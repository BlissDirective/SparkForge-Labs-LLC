// ════════════════════════════════════════════════════
// CRON — Trial Reminder Emails
// v3 Gap 2 follow-up: Daily job that sends reminder emails
// to parents whose trial ends within the next 48 hours.
//
// Scheduling (vercel.json):
//   Daily at 10:00 UTC — single invocation per day catches
//   any trial ending within the next ~48h window.
//
// Deduplication:
//   Each reminder writes a subscription_events row with
//   event_type = 'trial.reminder.sent' and stripe_event_id
//   namespaced to the parent+window. We check for prior
//   sends before re-sending, so a parent can only receive
//   one 48h reminder AND one 24h reminder per trial.
//
// Security:
//   CRON_SECRET bearer-token auth (same pattern as
//   /api/agent/schedule). In production the secret is required.
//
// Graceful degradation:
//   - Missing RESEND_API_KEY → skipped with reason, returns 200
//   - Missing CRON_SECRET in prod → 500 CONFIG_ERROR
//   - Individual email failures don't abort the batch — each
//     parent is processed independently and failures are
//     logged to the audit trail for retry.
// ════════════════════════════════════════════════════
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail, isEmailConfigured } from '@/lib/email';
import { renderTrialReminder } from '@/lib/email-templates/trial-reminder';
import { logSubscriptionEvent } from '@/lib/subscription-events';
import type { SubscriptionTier } from '@/lib/tier-config';

export const runtime = 'nodejs';

const WINDOW_48H_MS = 48 * 60 * 60 * 1000;
const WINDOW_24H_MS = 24 * 60 * 60 * 1000;

interface TrialRow {
  id: string;
  email: string;
  full_name: string | null;
  subscription_tier: SubscriptionTier;
  trial_ends_at: string;
}

interface ReminderResult {
  parentId: string;
  parentEmail: string;
  window: '48h' | '24h';
  status: 'sent' | 'skipped_duplicate' | 'skipped_not_in_window' | 'failed';
  reason?: string;
}

/** Determine which reminder window the trial falls into. */
function classifyWindow(trialEndsAt: Date, now: Date): '48h' | '24h' | null {
  const msUntil = trialEndsAt.getTime() - now.getTime();
  if (msUntil <= 0) return null;
  if (msUntil <= WINDOW_24H_MS) return '24h';
  if (msUntil <= WINDOW_48H_MS) return '48h';
  return null;
}

function buildAuditEventId(parentId: string, window: '48h' | '24h'): string {
  return `trial_reminder_${window}_${parentId}`;
}

export async function GET(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret && process.env.NODE_ENV === 'production') {
    console.error('[cron/trial-reminders] CRON_SECRET missing in production');
    return apiError('CRON_SECRET required in production', 500, 'CONFIG_ERROR');
  }

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return apiError('Unauthorized', 401, 'AUTH_REQUIRED');
  }

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

  const supabase = createAdminClient();
  const now = new Date();
  const cutoff = new Date(now.getTime() + WINDOW_48H_MS);

  // ── Fetch parents with trials ending in next 48h ───
  const { data: rows, error: fetchErr } = await supabase
    .from('parents')
    .select('id, email, full_name, subscription_tier, trial_ends_at')
    .not('trial_ends_at', 'is', null)
    .gt('trial_ends_at', now.toISOString())
    .lte('trial_ends_at', cutoff.toISOString())
    .eq('subscription_status', 'active')
    .in('subscription_tier', ['plus', 'forge']);

  if (fetchErr) {
    console.error('[cron/trial-reminders] Fetch error:', fetchErr);
    return apiError('Failed to fetch trial parents', 500);
  }

  const trialRows = (rows ?? []) as TrialRow[];

  if (trialRows.length === 0) {
    return apiSuccess({
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      reason: 'No trials ending in the next 48 hours',
    });
  }

  // ── Load existing reminders for dedup in ONE query ─
  const parentIds = trialRows.map((r) => r.id);
  const { data: prior } = await supabase
    .from('subscription_events')
    .select('stripe_event_id, parent_id, event_type')
    .in('parent_id', parentIds)
    .eq('event_type', 'trial.reminder.sent');

  const priorSet = new Set(
    ((prior ?? []) as { stripe_event_id: string }[]).map((r) => r.stripe_event_id)
  );

  // ── Process each parent ────────────────────────────
  const appUrl =
    process.env.NEXT_PUBLIC_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000';
  const manageUrl = `${appUrl.replace(/\/$/, '')}/parent/subscription`;

  const results: ReminderResult[] = [];

  for (const row of trialRows) {
    const trialEndsAt = new Date(row.trial_ends_at);
    const window = classifyWindow(trialEndsAt, now);

    if (!window) {
      results.push({
        parentId: row.id,
        parentEmail: row.email,
        window: '48h',
        status: 'skipped_not_in_window',
      });
      continue;
    }

    // Dedup: has this parent already received this window's reminder?
    const auditEventId = buildAuditEventId(row.id, window);
    if (priorSet.has(auditEventId)) {
      results.push({
        parentId: row.id,
        parentEmail: row.email,
        window,
        status: 'skipped_duplicate',
      });
      continue;
    }

    // Render + send
    const msUntil = trialEndsAt.getTime() - now.getTime();
    const hoursRemaining = Math.max(1, Math.floor(msUntil / (60 * 60 * 1000)));
    const daysRemaining = Math.max(0, Math.floor(msUntil / (24 * 60 * 60 * 1000)));

    const rendered = renderTrialReminder({
      parentName: row.full_name ?? '',
      parentEmail: row.email,
      tier: row.subscription_tier as 'plus' | 'forge',
      daysRemaining,
      hoursRemaining,
      trialEndsAt,
      manageUrl,
      window,
    });

    const sendResult = await sendEmail({
      to: row.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tags: {
        kind: 'trial_reminder',
        window,
        tier: row.subscription_tier,
      },
    });

    if (!sendResult.sent) {
      console.error(
        `[cron/trial-reminders] Failed to send to ${row.email} (${window}):`,
        sendResult.reason
      );
      results.push({
        parentId: row.id,
        parentEmail: row.email,
        window,
        status: 'failed',
        reason: sendResult.reason,
      });
      continue;
    }

    // Audit log for dedup + history (DB-CRIT-001 4C: dual-write helper)
    await logSubscriptionEvent(supabase, {
      stripeEventId: auditEventId,
      eventType: 'trial.reminder.sent',
      parentId: row.id,
      data: {
        window,
        tier: row.subscription_tier,
        trial_ends_at: row.trial_ends_at,
        hours_remaining: hoursRemaining,
        resend_id: sendResult.id ?? null,
        sent_at: now.toISOString(),
      },
    });

    results.push({
      parentId: row.id,
      parentEmail: row.email,
      window,
      status: 'sent',
    });
  }

  // ── Summary ────────────────────────────────────────
  const summary = {
    processed: results.length,
    sent: results.filter((r) => r.status === 'sent').length,
    failed: results.filter((r) => r.status === 'failed').length,
    skipped_duplicate: results.filter((r) => r.status === 'skipped_duplicate').length,
    skipped_not_in_window: results.filter((r) => r.status === 'skipped_not_in_window').length,
    results,
  };

  console.log('[cron/trial-reminders]', summary);
  return apiSuccess(summary);
}
