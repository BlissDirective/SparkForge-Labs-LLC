// ════════════════════════════════════════════════════
// CRON — Dunning Sequence Runner (PAY-ENH-003 Ultra)
//
// Runs daily at 10:15 UTC. For each parent in a dunning sequence
// whose next stage is due, sends the email and advances the stage.
//
// At stage 3 the parent is demoted to free tier (after 7-day grace
// + retries exhausted). Stage 4 is the 30-day win-back offer. A
// successful invoice.payment_succeeded webhook clears the sequence
// any time; this cron never un-demotes — the webhook owns recovery.
//
// Dedup: subscription_events rows with
//   stripe_event_id = dunning:{parentId}:{stage}:{YYYYMMDD}
// guard against duplicate sends if the cron fires twice in a day.
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import {
  apiSuccess,
  apiError,
  sanitizeErrorMessage,
  ERROR_CODES,
} from '@/lib/api-helpers';
import { verifyCronBearer } from '@/lib/cron-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail, isEmailConfigured } from '@/lib/email';
import { renderDunningEmail } from '@/lib/email-templates/dunning';
import {
  DUNNING_SCHEDULE,
  nextDueStage,
  type DunningStage,
} from '@/lib/stripe/dunning';
import { logSubscriptionEvent } from '@/lib/subscription-events';

export const runtime = 'nodejs';

interface ParentDunningRow {
  id: string;
  email: string;
  full_name: string | null;
  subscription_tier: string;
  dunning_stage: number | null;
  dunning_started_at: string | null;
  dunning_tier_before: string | null;
  grace_period_ends_at: string | null;
}

export async function GET(req: NextRequest) {
  const denied = verifyCronBearer(req, { routeName: 'dunning' });
  if (denied) return denied;

  const admin = createAdminClient();
  const origin = new URL(req.url).origin;

  // Fetch every parent currently in a dunning sequence.
  // The index idx_parents_dunning_scan keeps this cheap even at scale.
  const { data: candidates, error } = await admin
    .from('parents')
    .select(
      'id, email, full_name, subscription_tier, dunning_stage, dunning_started_at, dunning_tier_before, grace_period_ends_at',
    )
    .not('dunning_stage', 'is', null);

  if (error) {
    console.error('[cron/dunning] fetch error:', error);
    return apiError(
      sanitizeErrorMessage(error, 'Could not load dunning candidates'),
      500,
      ERROR_CODES.SERVER_ERROR,
    );
  }

  const now = new Date();
  let advanced = 0;
  let demoted = 0;
  let skipped = 0;
  let emailsSent = 0;
  const failures: Array<{ parentId: string; stage: number; reason: string }> = [];

  for (const parent of (candidates ?? []) as ParentDunningRow[]) {
    if (!parent.dunning_started_at || parent.dunning_stage === null) {
      skipped += 1;
      continue;
    }
    const startedAt = new Date(parent.dunning_started_at);
    const nextStage = nextDueStage({
      currentStage: parent.dunning_stage as DunningStage,
      startedAt,
      now,
    });
    if (nextStage === null) {
      skipped += 1;
      continue;
    }

    const def = DUNNING_SCHEDULE[nextStage];
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const dedupId = `dunning:${parent.id}:${nextStage}:${ymd}`;

    // Dedup: one email per (parent, stage, day). subscription_events
    // has stripe_event_id as UNIQUE; if it's already there, this stage
    // has fired today and we skip. logSubscriptionEvent uses upsert
    // with ignoreDuplicates:true so a separate pre-check SELECT is
    // the cleanest way to detect the collision.
    const { data: existing } = await admin
      .from('subscription_events')
      .select('stripe_event_id')
      .eq('stripe_event_id', dedupId)
      .maybeSingle();
    if (existing) {
      skipped += 1;
      continue;
    }
    await logSubscriptionEvent(admin, {
      stripeEventId: dedupId,
      parentId: parent.id,
      eventType: 'dunning.stage.fired',
      data: { stage: nextStage, templateKey: def.templateKey },
    });

    // Stage 3 demotes to free. Do this BEFORE the email send so the
    // email content accurately reflects the user's new state.
    const updates: Record<string, unknown> = {
      dunning_stage: nextStage,
      dunning_last_sent_at: now.toISOString(),
    };
    if (def.demotesToFree) {
      updates.subscription_tier = 'free';
      updates.subscription_status = 'canceled';
      updates.grace_period_ends_at = null;
      demoted += 1;
    }

    const { error: updateErr } = await admin
      .from('parents')
      .update(updates)
      .eq('id', parent.id);

    if (updateErr) {
      failures.push({ parentId: parent.id, stage: nextStage, reason: updateErr.message });
      continue;
    }

    advanced += 1;

    if (!isEmailConfigured()) continue;
    if (!parent.email) continue;

    try {
      const rendered = renderDunningEmail(def.templateKey, {
        parentName: parent.full_name,
        portalUrl: `${origin}/parent/subscription`,
        pricingUrl: `${origin}/pricing`,
        graceEndsAt: parent.grace_period_ends_at
          ? new Date(parent.grace_period_ends_at)
          : null,
        retryDate: null,
        winBackCouponCode: null,
      });
      const result = await sendEmail({
        to: parent.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        tags: { type: 'dunning', stage: String(nextStage) },
      });
      if (result.sent) emailsSent += 1;
      else failures.push({ parentId: parent.id, stage: nextStage, reason: result.reason ?? 'send skipped' });
    } catch (err) {
      failures.push({
        parentId: parent.id,
        stage: nextStage,
        reason: err instanceof Error ? err.message : 'unknown',
      });
    }
  }

  return apiSuccess({
    scanned: candidates?.length ?? 0,
    advanced,
    emailsSent,
    demoted,
    skipped,
    failures,
  });
}
