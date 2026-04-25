// PAY-ENH-003 (Ultra): Dunning email templates
//
// Five templates: payment-failed, retry-coming, grace-ending,
// downgraded, win-back. Each takes an env-derived portal URL so
// the "Update payment method" CTAs link to Stripe's customer
// portal session (started by /api/stripe/portal).

import type { DunningStageDefinition } from '@/lib/stripe/dunning';

export interface DunningEmailInput {
  parentName: string | null;
  portalUrl: string;
  pricingUrl: string;
  graceEndsAt?: Date | null;
  retryDate?: Date | null;
  winBackCouponCode?: string | null;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const WRAPPER = (body: string) => `
<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#06070e;color:#d4d8e2;padding:32px;margin:0;">
<div style="max-width:560px;margin:0 auto;background:#0f1424;border:1px solid #1f2a44;border-radius:12px;padding:32px;">
<h1 style="color:#fff;font-size:20px;margin:0 0 16px;">SparkForge</h1>
${body}
<p style="color:#6b7896;font-size:12px;margin:32px 0 0;">
You're receiving this because your SparkForge account needs attention.
<br>Manage preferences at <a href="#" style="color:#60a5fa;">support@sparkforge.ai</a>.
</p>
</div></body></html>
`.trim();

function hello(name: string | null): string {
  return name ? `Hi ${escapeHtml(name)},` : 'Hi,';
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderPaymentFailed(input: DunningEmailInput): RenderedEmail {
  const subject = 'Payment failed — we\'re retrying automatically';
  const html = WRAPPER(`
    <p>${hello(input.parentName)}</p>
    <p>We couldn't charge your card for this month's SparkForge subscription.</p>
    <p><strong>Nothing's broken yet.</strong> Stripe will automatically retry over the next 3 days. Your family's access continues during a 7-day grace period.</p>
    <p><a href="${escapeHtml(input.portalUrl)}" style="background:#10b981;color:#0b1018;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:600;">Update payment method</a></p>
    <p style="color:#8892a8;font-size:13px;">If the retries succeed, we'll email you again to confirm — no further action needed.</p>
  `);
  const text = `${hello(input.parentName)}\n\nWe couldn't charge your card for this month's SparkForge subscription. Stripe will automatically retry over the next 3 days. Your family's access continues during a 7-day grace period.\n\nUpdate your payment method: ${input.portalUrl}\n\nIf the retries succeed we'll email you to confirm.`;
  return { subject, html, text };
}

function renderRetryComing(input: DunningEmailInput): RenderedEmail {
  const subject = 'Update your card — subscription retry in 4 days';
  const retry = input.retryDate ? fmtDate(input.retryDate) : 'soon';
  const html = WRAPPER(`
    <p>${hello(input.parentName)}</p>
    <p>Your SparkForge subscription hasn't been charged yet this cycle. The next automatic retry is on <strong>${escapeHtml(retry)}</strong>.</p>
    <p>If your card details have changed, please update them before the retry to avoid any interruption.</p>
    <p><a href="${escapeHtml(input.portalUrl)}" style="background:#f59e0b;color:#0b1018;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:600;">Update payment method</a></p>
  `);
  const text = `${hello(input.parentName)}\n\nYour SparkForge subscription hasn't been charged yet this cycle. Next automatic retry: ${retry}. If your card has changed, please update it before then.\n\nUpdate payment method: ${input.portalUrl}`;
  return { subject, html, text };
}

function renderGraceEnding(input: DunningEmailInput): RenderedEmail {
  const subject = 'Grace period ending tomorrow — please update payment';
  const grace = input.graceEndsAt ? fmtDate(input.graceEndsAt) : 'tomorrow';
  const html = WRAPPER(`
    <p>${hello(input.parentName)}</p>
    <p>Your SparkForge grace period ends on <strong>${escapeHtml(grace)}</strong>. After that your plan will be paused and access reverts to the free tier.</p>
    <p>Child progress + XP + badges are <strong>never</strong> deleted. You can restart anytime and your family picks up where they left off.</p>
    <p><a href="${escapeHtml(input.portalUrl)}" style="background:#ef4444;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:600;">Update payment now</a></p>
  `);
  const text = `${hello(input.parentName)}\n\nYour SparkForge grace period ends ${grace}. After that your plan will be paused and access reverts to free. Child progress is never deleted.\n\nUpdate payment now: ${input.portalUrl}`;
  return { subject, html, text };
}

function renderDowngraded(input: DunningEmailInput): RenderedEmail {
  const subject = 'Your SparkForge plan was paused';
  const html = WRAPPER(`
    <p>${hello(input.parentName)}</p>
    <p>Your SparkForge plan was paused because we couldn't process payment during the 7-day grace window.</p>
    <p>Your family keeps their free-tier access — all progress, XP, and badges are preserved. Come back any time to resume full features.</p>
    <p><a href="${escapeHtml(input.pricingUrl)}" style="background:#60a5fa;color:#0b1018;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:600;">Restart subscription</a></p>
  `);
  const text = `${hello(input.parentName)}\n\nYour SparkForge plan was paused because we couldn't process payment during the 7-day grace window. All progress is preserved. Restart any time.\n\n${input.pricingUrl}`;
  return { subject, html, text };
}

function renderWinBack(input: DunningEmailInput): RenderedEmail {
  const subject = 'Come back — 50% off your first month';
  const coupon = input.winBackCouponCode ? escapeHtml(input.winBackCouponCode) : 'WELCOME50';
  const html = WRAPPER(`
    <p>${hello(input.parentName)}</p>
    <p>We miss you. Use code <strong style="font-family:monospace;background:#1f2a44;padding:2px 8px;border-radius:4px;">${coupon}</strong> for 50% off your first month back on SparkForge.</p>
    <p>Your kids' XP, badges, and streaks are still here waiting.</p>
    <p><a href="${escapeHtml(input.pricingUrl)}?coupon=${coupon}" style="background:#10b981;color:#0b1018;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:600;">Reactivate with 50% off</a></p>
  `);
  const text = `${hello(input.parentName)}\n\nWe miss you. Use code ${coupon} for 50% off your first month back on SparkForge. Your kids' XP, badges, and streaks are still here.\n\n${input.pricingUrl}?coupon=${coupon}`;
  return { subject, html, text };
}

export function renderDunningEmail(
  templateKey: DunningStageDefinition['templateKey'],
  input: DunningEmailInput,
): RenderedEmail {
  switch (templateKey) {
    case 'payment-failed': return renderPaymentFailed(input);
    case 'retry-coming':   return renderRetryComing(input);
    case 'grace-ending':   return renderGraceEnding(input);
    case 'downgraded':     return renderDowngraded(input);
    case 'win-back':       return renderWinBack(input);
  }
}
