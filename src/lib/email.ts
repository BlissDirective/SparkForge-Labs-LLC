// ════════════════════════════════════════════════════
// EMAIL SERVICE — Thin Resend REST wrapper
// v3 Gap 2 follow-up: Transactional email infrastructure
// for trial reminders, payment failures, and future
// admin notifications.
//
// Design principles:
//   - NO new npm dependency — uses fetch against Resend's
//     HTTPS API. Swap to another provider by rewriting this
//     one function; nothing else depends on Resend.
//   - Graceful degradation — missing RESEND_API_KEY returns
//     { sent: false, reason } instead of throwing. Call sites
//     log the reason and continue (same pattern as ENH-9A for
//     Anthropic and ENH-8A for Stripe).
//   - Idempotency is the caller's responsibility — this function
//     just sends. Dedup is handled by subscription_events.
// ════════════════════════════════════════════════════

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: Record<string, string>;
}

export interface EmailResult {
  sent: boolean;
  /** Provider-side message ID when sent === true */
  id?: string;
  /** Human-readable reason when sent === false */
  reason?: string;
}

const RESEND_URL = 'https://api.resend.com/emails';

/**
 * Send a transactional email via Resend.
 *
 * Returns `{ sent: true, id }` on success, or `{ sent: false, reason }`
 * when the provider rejects the message, the API key is missing, or
 * the network call fails. Never throws.
 *
 * @example
 *   const result = await sendEmail({
 *     to: 'parent@example.com',
 *     subject: 'Your trial ends tomorrow',
 *     html: '<p>Hello!</p>',
 *     text: 'Hello!',
 *     tags: { kind: 'trial-reminder', window: '48h' },
 *   });
 *   if (!result.sent) console.warn('[email] skipped:', result.reason);
 */
export async function sendEmail(opts: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      sent: false,
      reason:
        'RESEND_API_KEY not configured — email service disabled. Add the key to .env.local to enable.',
    };
  }

  const from =
    opts.from ??
    process.env.EMAIL_FROM ??
    'SparkForge <noreply@sparkforge-labs.com>';

  try {
    const response = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        reply_to: opts.replyTo,
        tags: opts.tags
          ? Object.entries(opts.tags).map(([name, value]) => ({ name, value }))
          : undefined,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[email] Resend API error:', response.status, errText);
      return {
        sent: false,
        reason: `Resend API returned ${response.status}: ${errText.slice(0, 200)}`,
      };
    }

    const body = (await response.json()) as { id?: string };
    return { sent: true, id: body.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown network error';
    console.error('[email] Network error:', msg);
    return { sent: false, reason: `Network error: ${msg}` };
  }
}

/**
 * Check whether email sending is configured. Use this in UI code
 * (e.g. admin dashboard) to show the email health badge.
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
