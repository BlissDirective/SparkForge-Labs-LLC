// ════════════════════════════════════════════════════
// EMAIL TEMPLATE — Trial Reminder
// v3 Gap 2 follow-up: Reminds parents their trial ends in
// <48h (or <24h depending on `window`).
//
// HTML is inlined on purpose — most email clients strip
// external CSS. Keeps the template self-contained and easy
// to preview via the admin test endpoint.
//
// Colors roughly match Frost-Prismatic (dark surface + neon
// accents) but fall back gracefully in light-mode clients.
// ════════════════════════════════════════════════════

import type { SubscriptionTier } from '@/lib/tier-config';

export interface TrialReminderOptions {
  parentName: string;
  parentEmail: string;
  tier: Exclude<SubscriptionTier, 'free'>;
  daysRemaining: number;
  hoursRemaining: number;
  trialEndsAt: Date;
  manageUrl: string;
  /** Used in subject line + copy: '48h' | '24h' | 'final' */
  window: '48h' | '24h' | 'final';
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const TIER_NAMES: Record<'plus' | 'forge', string> = {
  plus: 'Spark Plus',
  forge: 'Spark Forge',
};

const BRAND_COLOR = '#00BBFF';
const BG_DARK = '#0A0E16';
const SURFACE_CARD = '#111118';
const TEXT_WHITE = '#FFFFFF';
const TEXT_MUTED = 'rgba(255, 255, 255, 0.65)';

/**
 * Format a timestamp for display in the email body.
 * Example: "Friday, April 12 at 6:42 PM UTC"
 */
function formatTrialEnd(date: Date): string {
  try {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short',
    });
  } catch {
    return date.toISOString();
  }
}

/** Chooses subject wording based on window. */
function buildSubject(window: '48h' | '24h' | 'final', tier: string): string {
  switch (window) {
    case 'final':
      return `Last chance: your ${tier} trial ends in a few hours`;
    case '24h':
      return `Your ${tier} trial ends tomorrow`;
    case '48h':
    default:
      return `Your ${tier} trial ends in 2 days`;
  }
}

export function renderTrialReminder(opts: TrialReminderOptions): RenderedEmail {
  const tierLabel = TIER_NAMES[opts.tier];
  const greeting = opts.parentName ? `Hi ${opts.parentName.split(' ')[0]}` : 'Hi there';
  const endsAtFormatted = formatTrialEnd(opts.trialEndsAt);

  // Derive the site origin from manageUrl (falls back to env or prod default)
  // so legal-footer links (/terms, /privacy, etc.) are absolute and correct.
  let appOrigin: string;
  try {
    appOrigin = new URL(opts.manageUrl).origin;
  } catch {
    appOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://sparkforge-labs.com';
  }

  // Pick a short time-remaining string for the headline
  let remainingLabel: string;
  if (opts.window === 'final') {
    remainingLabel = `${Math.max(1, opts.hoursRemaining)} hours`;
  } else if (opts.daysRemaining <= 1) {
    remainingLabel = opts.daysRemaining === 1 ? '1 day' : `${opts.hoursRemaining} hours`;
  } else {
    remainingLabel = `${opts.daysRemaining} days`;
  }

  const subject = buildSubject(opts.window, tierLabel);

  // ─── Plain text fallback ──────────────────────────
  const text = [
    `${greeting},`,
    '',
    `Just a heads-up — your SparkForge ${tierLabel} trial ends in ${remainingLabel}.`,
    '',
    `Trial ends: ${endsAtFormatted}`,
    '',
    `What happens next:`,
    `  • If you do nothing, you'll be charged at the end of the trial and keep full access.`,
    `  • If you'd rather not continue, cancel anytime from your subscription page.`,
    `  • Your kids keep every badge, every XP point, and every bit of progress no matter what.`,
    '',
    `Manage your subscription: ${opts.manageUrl}`,
    '',
    `Questions? Just reply to this email — we read every message.`,
    '',
    `— The SparkForge team`,
    '',
    '---',
    `You're receiving this because you started a ${tierLabel} trial for ${opts.parentEmail}.`,
    `Unsubscribe from trial reminders: ${opts.manageUrl}?notifications=off`,
  ].join('\n');

  // ─── HTML body ───────────────────────────────────
  // Table-based layout — maximum email client compatibility.
  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${BG_DARK};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${TEXT_WHITE};">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${BG_DARK};padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:${SURFACE_CARD};border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">

          <!-- Header strip -->
          <tr>
            <td style="padding:32px 32px 24px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="font-family:'Exo 2',sans-serif;font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND_COLOR};">
                SparkForge
              </div>
              <div style="font-family:'Exo 2',sans-serif;font-size:22px;font-weight:800;color:${TEXT_WHITE};margin-top:4px;">
                ${escapeHtml(tierLabel)} trial — ${escapeHtml(remainingLabel)} left
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px 0;font-size:16px;line-height:24px;color:${TEXT_WHITE};">
                ${escapeHtml(greeting)},
              </p>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:${TEXT_MUTED};">
                Just a heads-up — your ${escapeHtml(tierLabel)} free trial ends in
                <strong style="color:${TEXT_WHITE};">${escapeHtml(remainingLabel)}</strong>.
              </p>

              <!-- Trial end date card -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:rgba(0,187,255,0.08);border:1px solid rgba(0,187,255,0.25);border-radius:12px;margin:20px 0;">
                <tr>
                  <td style="padding:16px 20px;">
                    <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:${BRAND_COLOR};font-weight:700;">
                      Trial ends
                    </div>
                    <div style="font-size:15px;color:${TEXT_WHITE};margin-top:4px;font-family:'Orbitron',monospace;">
                      ${escapeHtml(endsAtFormatted)}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 8px 0;font-size:14px;font-weight:700;color:${TEXT_WHITE};text-transform:uppercase;letter-spacing:1px;">
                What happens next
              </p>
              <ul style="margin:0 0 20px 0;padding-left:20px;font-size:14px;line-height:22px;color:${TEXT_MUTED};">
                <li style="margin-bottom:8px;">
                  If you do nothing, you'll be charged at the end of the trial and keep full access.
                </li>
                <li style="margin-bottom:8px;">
                  If you'd rather not continue, you can cancel anytime from your subscription page.
                </li>
                <li>
                  Your kids keep every badge, every XP point, and every bit of progress no matter what.
                </li>
              </ul>

              <!-- CTA button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px 0;">
                <tr>
                  <td style="background:${BRAND_COLOR};border-radius:10px;">
                    <a href="${escapeHtml(opts.manageUrl)}" style="display:inline-block;padding:14px 28px;font-family:'Exo 2',sans-serif;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${BG_DARK};text-decoration:none;">
                      Manage Subscription
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0 0;font-size:13px;line-height:20px;color:${TEXT_MUTED};">
                Questions? Just reply to this email — we read every message.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.2);">
              <p style="margin:0 0 10px;font-size:12px;line-height:18px;color:rgba(255,255,255,0.4);">
                You're receiving this because you started a ${escapeHtml(tierLabel)} trial for ${escapeHtml(opts.parentEmail)}.
                By continuing your subscription after the trial you agree to our Terms of Service, which include the
                automatic-renewal disclosures in &sect;&sect; 4e&ndash;4g.
                <br/>
                <a href="${escapeHtml(opts.manageUrl)}?notifications=off" style="color:rgba(255,255,255,0.5);text-decoration:underline;">
                  Turn off trial reminders
                </a>
              </p>
              <p style="margin:0;font-size:11px;line-height:16px;color:rgba(255,255,255,0.35);">
                <a href="${escapeHtml(appOrigin)}/parent/subscription" style="color:rgba(255,255,255,0.55);text-decoration:underline;">Manage subscription</a>
                &middot; <a href="${escapeHtml(appOrigin)}/terms" style="color:rgba(255,255,255,0.55);text-decoration:underline;">Terms of Service</a>
                &middot; <a href="${escapeHtml(appOrigin)}/privacy" style="color:rgba(255,255,255,0.55);text-decoration:underline;">Privacy Policy</a>
                &middot; <a href="${escapeHtml(appOrigin)}/privacy/children" style="color:rgba(255,255,255,0.55);text-decoration:underline;">Children's Privacy</a>
              </p>
            </td>
          </tr>

        </table>
        <div style="margin-top:16px;font-size:11px;color:rgba(255,255,255,0.3);">
          &copy; ${new Date().getFullYear()} SparkForge LLC &middot; an Illinois limited liability company &middot; AI literacy for kids ages 7&ndash;16
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

/** Minimal HTML entity escape for interpolated user-supplied strings. */
function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
