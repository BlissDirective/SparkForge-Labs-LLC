// ════════════════════════════════════════════════════
// CRON — Annual Renewal Reminder
// R2 / AUDIT 2 gap — California ARL AB 2863 (Cal. BPC §17602(c))
// + ToS §4e item 5: For yearly subscriptions, send a reminder
// email 3–21 days before each renewal.
//
// Scheduling (vercel.json):
//   Daily at 10:05 UTC. Catches any yearly-plan renewal falling
//   within [now + 14d, now + 15d) by default (single-day window
//   inside the 3–21 day allowed range). Runs for all active
//   yearly subscriptions once they approach the 14-day mark.
//
// Interval detection:
//   The parents table does not persist subscription_interval, so
//   we ask Stripe for the interval during each run. Only a small
//   number of parents reach this cron window daily, so the Stripe
//   API cost is negligible.
//
// Deduplication:
//   Each reminder writes a subscription_events row with
//   event_type = 'annual.renewal.reminder.sent' and
//   stripe_event_id = `annual_reminder_<parentId>_<renewalDate>`.
//   A single parent can only receive one reminder per renewal cycle.
//
// Security:
//   CRON_SECRET bearer-token auth via verifyCronBearer, same
//   pattern as trial-reminders and dunning.
//
// Graceful degradation:
//   - Missing RESEND_API_KEY  → skipped with reason, 200
//   - Missing Stripe config   → skipped with reason, 200
//   - Per-row failures do not abort the batch.
// ════════════════════════════════════════════════════
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { verifyCronBearer } from '@/lib/cron-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail, isEmailConfigured } from '@/lib/email';
import { renderAnnualReminder } from '@/lib/email-templates/annual-reminder';
import { logSubscriptionEvent } from '@/lib/subscription-events';
import { getStripe } from '@/lib/stripe';
import { TIER_DISPLAY, type SubscriptionTier } from '@/lib/tier-config';

export const runtime = 'nodejs';

// Fire the reminder when renewal is 14 days out (inside 3–21 day window).
const REMINDER_WINDOW_START_DAYS = 13;
const REMINDER_WINDOW_END_DAYS = 15;

interface ParentRow {
  id: string;
  email: string;
  full_name: string | null;
  subscription_tier: SubscriptionTier;
  subscription_period_end: string;
  stripe_subscription_id: string | null;
}

interface ReminderResult {
  parentId: string;
  parentEmail: string;
  status: 'sent' | 'skipped_duplicate' | 'skipped_not_yearly' | 'skipped_no_stripe_id' | 'failed';
  reason?: string;
}

function buildAuditEventId(parentId: string, renewalIso: string): string {
  // Namespace by renewal date so next year's reminder is not treated as a duplicate.
  const datePart = renewalIso.slice(0, 10);
  return `annual_reminder_${parentId}_${datePart}`;
}

export async function GET(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────
  const denial = verifyCronBearer(req, { routeName: 'annual-reminder' });
  if (denial) return denial;

  // ── Email configured? ──────────────────────────────
  if (!isEmailConfigured()) {
    return apiSuccess({
      skipped: true,
      reason: 'RESEND_API_KEY not configured — no emails sent',
      processed: 0,
      sent: 0,
      failed: 0,
    });
  }

  const stripe = getStripe();
  if (!stripe) {
    return apiSuccess({
      skipped: true,
      reason: 'STRIPE_SECRET_KEY not configured — cannot determine interval',
      processed: 0,
      sent: 0,
      failed: 0,
    });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const windowStart = new Date(now.getTime() + REMINDER_WINDOW_START_DAYS * 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_END_DAYS * 24 * 60 * 60 * 1000);

  // ── Fetch parents with active paid subs renewing inside the window ──
  const { data: rows, error: fetchErr } = await supabase
    .from('parents')
    .select('id, email, full_name, subscription_tier, subscription_period_end, stripe_subscription_id')
    .in('subscription_tier', ['plus', 'forge'])
    .eq('subscription_status', 'active')
    .not('subscription_period_end', 'is', null)
    .gte('subscription_period_end', windowStart.toISOString())
    .lt('subscription_period_end', windowEnd.toISOString());

  if (fetchErr) {
    console.error('[cron/annual-reminder] Fetch error:', fetchErr);
    return apiError('Failed to fetch candidate parents', 500);
  }

  const parentRows = (rows ?? []) as ParentRow[];

  if (parentRows.length === 0) {
    return apiSuccess({
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      reason: 'No yearly renewals inside the 14-day reminder window',
    });
  }

  // ── Dedup pre-load ──────────────────────────────────
  const parentIds = parentRows.map((r) => r.id);
  const { data: prior } = await supabase
    .from('subscription_events')
    .select('stripe_event_id, parent_id')
    .in('parent_id', parentIds)
    .eq('event_type', 'annual.renewal.reminder.sent');

  const priorSet = new Set(
    ((prior ?? []) as { stripe_event_id: string }[]).map((r) => r.stripe_event_id)
  );

  const appUrl =
    process.env.NEXT_PUBLIC_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000';
  const manageUrl = `${appUrl.replace(/\/$/, '')}/parent/subscription`;

  const results: ReminderResult[] = [];

  for (const row of parentRows) {
    const renewalAt = new Date(row.subscription_period_end);
    const auditEventId = buildAuditEventId(row.id, row.subscription_period_end);

    // Dedup
    if (priorSet.has(auditEventId)) {
      results.push({
        parentId: row.id,
        parentEmail: row.email,
        status: 'skipped_duplicate',
      });
      continue;
    }

    if (!row.stripe_subscription_id) {
      results.push({
        parentId: row.id,
        parentEmail: row.email,
        status: 'skipped_no_stripe_id',
      });
      continue;
    }

    // Determine interval by asking Stripe. Only yearly plans get the reminder.
    let intervalIsYear = false;
    let renewalAmount = 0;
    try {
      const sub = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
      const firstItem = sub.items?.data?.[0];
      const recurring = firstItem?.price?.recurring;
      intervalIsYear = recurring?.interval === 'year';
      const unitAmountCents = firstItem?.price?.unit_amount ?? 0;
      renewalAmount = unitAmountCents / 100;
    } catch (err) {
      console.error(
        `[cron/annual-reminder] Stripe retrieve failed for ${row.id}:`,
        err instanceof Error ? err.message : String(err)
      );
      results.push({
        parentId: row.id,
        parentEmail: row.email,
        status: 'failed',
        reason: 'stripe_retrieve_failed',
      });
      continue;
    }

    if (!intervalIsYear) {
      results.push({
        parentId: row.id,
        parentEmail: row.email,
        status: 'skipped_not_yearly',
      });
      continue;
    }

    // Fallback if Stripe returns 0 for some reason
    if (renewalAmount === 0) {
      renewalAmount = TIER_DISPLAY[row.subscription_tier].yearlyPrice;
    }

    const daysUntilRenewal = Math.max(
      1,
      Math.round((renewalAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    );

    const rendered = renderAnnualReminder({
      parentName: row.full_name ?? '',
      parentEmail: row.email,
      tier: row.subscription_tier as 'plus' | 'forge',
      renewalAmount,
      renewsAt: renewalAt,
      daysUntilRenewal,
      manageUrl,
    });

    const sendResult = await sendEmail({
      to: row.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tags: {
        kind: 'annual_renewal_reminder',
        tier: row.subscription_tier,
      },
    });

    if (!sendResult.sent) {
      console.error(
        `[cron/annual-reminder] Failed to send to ${row.email}:`,
        sendResult.reason
      );
      results.push({
        parentId: row.id,
        parentEmail: row.email,
        status: 'failed',
        reason: sendResult.reason,
      });
      continue;
    }

    await logSubscriptionEvent(supabase, {
      stripeEventId: auditEventId,
      eventType: 'annual.renewal.reminder.sent',
      parentId: row.id,
      data: {
        tier: row.subscription_tier,
        renewal_date: row.subscription_period_end,
        renewal_amount: renewalAmount,
        days_until_renewal: daysUntilRenewal,
        resend_id: sendResult.id ?? null,
        sent_at: now.toISOString(),
      },
    });

    results.push({
      parentId: row.id,
      parentEmail: row.email,
      status: 'sent',
    });
  }

  const summary = {
    processed: results.length,
    sent: results.filter((r) => r.status === 'sent').length,
    failed: results.filter((r) => r.status === 'failed').length,
    skipped_duplicate: results.filter((r) => r.status === 'skipped_duplicate').length,
    skipped_not_yearly: results.filter((r) => r.status === 'skipped_not_yearly').length,
    skipped_no_stripe_id: results.filter((r) => r.status === 'skipped_no_stripe_id').length,
    results,
  };

  console.log('[cron/annual-reminder]', summary);
  return apiSuccess(summary);
}
