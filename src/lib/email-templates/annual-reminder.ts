// ════════════════════════════════════════════════════
// EMAIL TEMPLATE — Annual Renewal Reminder
// R2 / AUDIT 2 gap — CA ARL AB 2863 + ToS §4e item 5:
// For yearly subscriptions, send a reminder 3–21 days before
// each renewal so the parent can cancel if desired.
//
// Complements trial-reminder.ts which handles pre-trial-end
// notifications. This one fires pre-annual-renewal only.
// ════════════════════════════════════════════════════

import type { SubscriptionTier } from '@/lib/tier-config';

export interface AnnualReminderOptions {
  parentName: string;
  parentEmail: string;
  tier: Exclude<SubscriptionTier, 'free'>;
  /** Amount that will be charged on renewal, in dollars (not cents). */
  renewalAmount: number;
  /** When the next renewal will occur. */
  renewsAt: Date;
  /** Days between `now` and `renewsAt`, integer. */
  daysUntilRenewal: number;
  /** Absolute URL to /parent/subscription. */
  manageUrl: string;
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

function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(date: Date): string {
  try {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function renderAnnualReminder(opts: AnnualReminderOptions): RenderedEmail {
  const tierLabel = TIER_NAMES[opts.tier];
  const greeting = opts.parentName ? `Hi ${opts.parentName.split(' ')[0]}` : 'Hi there';
  const renewalDateFormatted = formatDate(opts.renewsAt);
  const amountFormatted = `$${opts.renewalAmount.toFixed(2)}`;

  // Derive app origin from the manageUrl
  let appOrigin: string;
  try {
    appOrigin = new URL(opts.manageUrl).origin;
  } catch {
    appOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://sparkforge-labs.com';
  }

  const subject = `Your SparkForge ${tierLabel} subscription renews in ${opts.daysUntilRenewal} days`;

  const text = [
    `${greeting},`,
    '',
    `This is a friendly reminder that your SparkForge ${tierLabel} annual subscription is scheduled to renew on ${renewalDateFormatted}.`,
    '',
    `Amount: ${amountFormatted} (charged to your payment method on file)`,
    `Renewal date: ${renewalDateFormatted}`,
    '',
    `If you'd like to keep the subscription — great, no action needed. If you'd rather cancel before the renewal, open your Subscription page in the Parent Dashboard:`,
    opts.manageUrl,
    '',
    `Cancellation takes effect at the end of the current period and stops all future charges. You'll keep access to ${tierLabel} until the renewal date.`,
    '',
    `Full terms: ${appOrigin}/terms#subscriptions`,
    `Privacy: ${appOrigin}/privacy`,
    '',
    '— The SparkForge team',
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${BG_DARK};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:rgba(255,255,255,0.85);">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_DARK};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0f1424;border:1px solid rgba(255,255,255,0.08);border-radius:14px;overflow:hidden;">
        <tr>
          <td style="padding:28px 32px 8px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${BRAND_COLOR};">Annual renewal reminder</p>
            <h1 style="margin:8px 0 0;font-size:22px;color:#ffffff;">${escapeHtml(tierLabel)} renews in ${opts.daysUntilRenewal} days</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;">
            <p style="margin:0 0 16px;font-size:15px;line-height:22px;color:rgba(255,255,255,0.85);">${escapeHtml(greeting)},</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:22px;color:rgba(255,255,255,0.75);">
              This is a friendly reminder that your SparkForge ${escapeHtml(tierLabel)} annual subscription is scheduled to renew on <strong style="color:#fff;">${escapeHtml(renewalDateFormatted)}</strong>.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;">
              <tr>
                <td style="padding:14px 18px;font-size:13px;color:rgba(255,255,255,0.75);">
                  Amount: <strong style="color:#fff;">${escapeHtml(amountFormatted)}</strong> (charged to your payment method on file)<br/>
                  Renewal date: <strong style="color:#fff;">${escapeHtml(renewalDateFormatted)}</strong>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 16px;font-size:14px;line-height:22px;color:rgba(255,255,255,0.75);">
              If you want to keep the subscription, no action is needed. If you'd rather cancel before the renewal, visit your subscription settings:
            </p>
            <p style="margin:0 0 24px;">
              <a href="${escapeHtml(opts.manageUrl)}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:${BG_DARK};background:${BRAND_COLOR};text-decoration:none;border-radius:10px;">
                Manage subscription
              </a>
            </p>
            <p style="margin:0;font-size:12px;line-height:18px;color:rgba(255,255,255,0.55);">
              Cancellation takes effect at the end of the current period and stops all future charges. You'll keep access to ${escapeHtml(tierLabel)} until ${escapeHtml(renewalDateFormatted)}.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.2);">
            <p style="margin:0 0 8px;font-size:11px;line-height:16px;color:rgba(255,255,255,0.4);">
              You're receiving this notice under the terms of our Automatic Renewal Disclosure
              (see Terms of Service &sect;&sect; 4e&ndash;4g). We send it 3&ndash;21 days before each annual renewal
              so you have time to decide.
            </p>
            <p style="margin:0;font-size:11px;line-height:16px;color:rgba(255,255,255,0.35);">
              <a href="${escapeHtml(appOrigin)}/parent/subscription" style="color:rgba(255,255,255,0.55);text-decoration:underline;">Manage subscription</a>
              &middot; <a href="${escapeHtml(appOrigin)}/terms" style="color:rgba(255,255,255,0.55);text-decoration:underline;">Terms of Service</a>
              &middot; <a href="${escapeHtml(appOrigin)}/privacy" style="color:rgba(255,255,255,0.55);text-decoration:underline;">Privacy Policy</a>
            </p>
          </td>
        </tr>
      </table>
      <div style="margin-top:16px;font-size:11px;color:rgba(255,255,255,0.3);">
        &copy; ${new Date().getFullYear()} SparkForge LLC &middot; an Illinois limited liability company
      </div>
    </td>
  </tr>
</table>
</body>
</html>`;

  return { subject, html, text };
}
