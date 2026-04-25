// ════════════════════════════════════════════════════
// POST /api/admin/trial-reminders/test
// v3 Gap 2 follow-up: Admin-only manual send of the trial
// reminder email template to an arbitrary address. Useful for
// previewing the template in a real inbox without waiting for
// the daily cron, and for verifying Resend is configured
// correctly.
//
// Body:
//   { to: string, window?: '48h' | '24h' | 'final', tier?: 'plus' | 'forge' }
//
// The test send does NOT write a subscription_events row (so
// it can be run repeatedly) and does NOT affect any real
// parent record. It just renders + sends.
// ════════════════════════════════════════════════════
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess, apiError, requireAdmin, parseBody } from '@/lib/api-helpers';
import { sendEmail, isEmailConfigured } from '@/lib/email';
import { renderTrialReminder } from '@/lib/email-templates/trial-reminder';

export const runtime = 'nodejs';

const TestBodySchema = z.object({
  to: z.string().email(),
  window: z.enum(['48h', '24h', 'final']).default('48h'),
  tier: z.enum(['plus', 'forge']).default('plus'),
  parentName: z.string().trim().max(100).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, TestBodySchema);
  if (!parsed.success) return parsed.response;

  if (!isEmailConfigured()) {
    return apiError(
      'Email service not configured. Add RESEND_API_KEY to your environment variables.',
      503,
      'EMAIL_NOT_CONFIGURED'
    );
  }

  const { to, parentName } = parsed.data;
  // Zod .default() guarantees these are set, but parseBody's generic
  // erases the default narrowing. Assert to the known post-default type.
  const window = (parsed.data.window ?? '48h') as '48h' | '24h' | 'final';
  const tier = (parsed.data.tier ?? 'plus') as 'plus' | 'forge';

  // Fake a "trial ends in X" timestamp based on window
  const now = new Date();
  const hoursAhead = window === 'final' ? 4 : window === '24h' ? 18 : 40;
  const trialEndsAt = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  const appUrl =
    process.env.NEXT_PUBLIC_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000';
  const manageUrl = `${appUrl.replace(/\/$/, '')}/parent/subscription`;

  const rendered = renderTrialReminder({
    parentName: parentName ?? 'Test Parent',
    parentEmail: to,
    tier,
    daysRemaining: Math.floor(hoursAhead / 24),
    hoursRemaining: hoursAhead,
    trialEndsAt,
    manageUrl,
    window,
  });

  const result = await sendEmail({
    to,
    subject: `[TEST] ${rendered.subject}`,
    html: rendered.html,
    text: rendered.text,
    tags: {
      kind: 'trial_reminder_test',
      window,
      tier,
      triggered_by: auth.user.id,
    },
  });

  if (!result.sent) {
    return apiError(
      `Failed to send test email: ${result.reason ?? 'Unknown error'}`,
      500
    );
  }

  return apiSuccess({
    to,
    window,
    tier,
    subject: `[TEST] ${rendered.subject}`,
    resendId: result.id,
  });
}
