// ════════════════════════════════════════════════════
// EMAIL TEMPLATE — Post-Purchase Acknowledgment
// R7 / AUDIT 2 — CA ARL AB 2863 post-purchase acknowledgment
// "in a form that can be retained and reproduced" (Cal. BPC
// § 17602(a)(3)). Also referenced in ToS §4e item 4.
//
// Sent from the Stripe webhook handler immediately after a
// checkout.session.completed event. Supplements (does not
// replace) the Stripe-default receipt.
// ════════════════════════════════════════════════════

import type { SubscriptionTier } from '@/lib/tier-config';

export interface PostPurchaseOptions {
  parentName: string;
  parentEmail: string;
  tier: Exclude<SubscriptionTier, 'free'>;
  interval: 'month' | 'year';
  /** Charged amount in dollars (not cents). */
  amount: number;
  /** Next billing date, if available. */
  nextRenewsAt?: Date | null;
  /** Whether this subscription started with a trial. */
  hasTrial: boolean;
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

function formatDate(d: Date): string {
  try {
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export function renderPostPurchase(opts: PostPurchaseOptions): RenderedEmail {
  const tierLabel = TIER_NAMES[opts.tier];
  const greeting = opts.parentName ? `Hi ${opts.parentName.split(' ')[0]}` : 'Hi there';
  const intervalLabel = opts.interval === 'month' ? 'month' : 'year';
  const amountStr = `$${opts.amount.toFixed(2)}`;
  const nextRenewLabel = opts.nextRenewsAt ? formatDate(opts.nextRenewsAt) : `one ${intervalLabel} from today`;

  let appOrigin: string;
  try {
    appOrigin = new URL(opts.manageUrl).origin;
  } catch {
    appOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://sparkforge-labs.com';
  }

  const subject = opts.hasTrial
    ? `Your SparkForge ${tierLabel} trial is active`
    : `Welcome to SparkForge ${tierLabel}`;

  const trialBlurb = opts.hasTrial
    ? `Your 7-day free trial is active now. You will not be charged until the trial ends, and you can cancel any time before then from the Parent Dashboard.`
    : `Your subscription is active. The first charge of ${amountStr} has been processed.`;

  const text = [
    `${greeting},`,
    '',
    `Thanks for subscribing to SparkForge ${tierLabel}.`,
    '',
    trialBlurb,
    '',
    `Plan: ${tierLabel}`,
    `Price: ${amountStr} per ${intervalLabel}`,
    `Automatic renewal: yes, every ${intervalLabel} until you cancel`,
    `Next charge: ${nextRenewLabel}`,
    '',
    `Cancel any time (one click): ${opts.manageUrl}`,
    '',
    `If you cancel before the next charge date, you keep access through the end of the current period and are not billed again.`,
    '',
    `Full subscription terms: ${appOrigin}/terms#subscriptions`,
    `Privacy Policy: ${appOrigin}/privacy`,
    '',
    '— The SparkForge team',
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${BG_DARK};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:rgba(255,255,255,0.85);">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_DARK};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0f1424;border:1px solid rgba(255,255,255,0.08);border-radius:14px;overflow:hidden;">
      <tr><td style="padding:28px 32px 8px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${BRAND_COLOR};">${opts.hasTrial ? 'Trial confirmation' : 'Subscription confirmation'}</p>
        <h1 style="margin:8px 0 0;font-size:22px;color:#ffffff;">${escapeHtml(subject)}</h1>
      </td></tr>
      <tr><td style="padding:24px 32px;">
        <p style="margin:0 0 12px;font-size:15px;line-height:22px;">${escapeHtml(greeting)},</p>
        <p style="margin:0 0 16px;font-size:14px;line-height:22px;color:rgba(255,255,255,0.75);">Thanks for subscribing to SparkForge ${escapeHtml(tierLabel)}.</p>
        <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:rgba(255,255,255,0.75);">${escapeHtml(trialBlurb)}</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;">
          <tr><td style="padding:14px 18px;font-size:13px;color:rgba(255,255,255,0.75);">
            Plan: <strong style="color:#fff;">${escapeHtml(tierLabel)}</strong><br/>
            Price: <strong style="color:#fff;">${escapeHtml(amountStr)} per ${escapeHtml(intervalLabel)}</strong><br/>
            Automatic renewal: <strong style="color:#fff;">yes</strong> — every ${escapeHtml(intervalLabel)} until you cancel<br/>
            Next charge: <strong style="color:#fff;">${escapeHtml(nextRenewLabel)}</strong>
          </td></tr>
        </table>

        <p style="margin:0 0 20px;">
          <a href="${escapeHtml(opts.manageUrl)}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:${BG_DARK};background:${BRAND_COLOR};text-decoration:none;border-radius:10px;">
            Manage or cancel subscription
          </a>
        </p>

        <p style="margin:0;font-size:12px;line-height:18px;color:rgba(255,255,255,0.55);">
          If you cancel before the next charge date, you keep access through the end of the current period and are not billed again. One click, no phone call required.
        </p>
      </td></tr>
      <tr><td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.2);">
        <p style="margin:0 0 8px;font-size:11px;line-height:16px;color:rgba(255,255,255,0.4);">
          This is your post-purchase acknowledgment, retained in your inbox in a reproducible form per California Automatic Renewal Law requirements.
        </p>
        <p style="margin:0;font-size:11px;line-height:16px;color:rgba(255,255,255,0.35);">
          <a href="${escapeHtml(appOrigin)}/parent/subscription" style="color:rgba(255,255,255,0.55);text-decoration:underline;">Manage subscription</a>
          &middot; <a href="${escapeHtml(appOrigin)}/terms" style="color:rgba(255,255,255,0.55);text-decoration:underline;">Terms of Service</a>
          &middot; <a href="${escapeHtml(appOrigin)}/privacy" style="color:rgba(255,255,255,0.55);text-decoration:underline;">Privacy Policy</a>
        </p>
      </td></tr>
    </table>
    <div style="margin-top:16px;font-size:11px;color:rgba(255,255,255,0.3);">
      &copy; ${new Date().getFullYear()} SparkForge LLC &middot; an Illinois limited liability company
    </div>
  </td></tr>
</table>
</body>
</html>`;

  return { subject, html, text };
}
