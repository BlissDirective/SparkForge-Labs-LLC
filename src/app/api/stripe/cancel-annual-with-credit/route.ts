// ════════════════════════════════════════════════════
// POST /api/stripe/cancel-annual-with-credit
//
// Implements the /terms#refunds "Option B" annual cancellation:
// after the 30-day money-back window, an annual subscriber can
// cancel mid-year and receive a Stripe customer-balance credit
// equal to (unused months × monthly-equivalent rate). The credit
// applies automatically to any future SparkForge invoice.
//
// Flow:
//   1. requireAuth → parent identity from JWT
//   2. Load parent's stripe_customer_id + stripe_subscription_id
//   3. Retrieve subscription from Stripe (source of truth)
//   4. Refuse if subscription is monthly (no per-month credit math
//      makes sense; monthly cancels keep access to period end)
//   5. Refuse if subscription is within the 30-day MBG window
//      (caller should request a full refund via Stripe portal /
//      support instead — different code path)
//   6. Compute (unused months, credit cents) from current period
//   7. Apply credit via customers.createBalanceTransaction
//   8. Cancel subscription IMMEDIATELY (user took the credit, so
//      access ends now — they can resubscribe later and the credit
//      will offset that invoice)
//   9. Audit-log the operation
//   10. Return summary for client display
//
// Body: { confirm: true } — explicit opt-in, see CancelAnnualWithCreditSchema
// ════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiError,
  requireAuth,
  parseBody,
} from '@/lib/api-helpers';
import { CancelAnnualWithCreditSchema } from '@/lib/validations';
import { getStripe } from '@/lib/stripe';
import {
  computeUnusedMonthsCredit,
  creditAccountForUnusedMonths,
  isAnnualSubscription,
  tierFromPriceId,
} from '@/lib/stripe-credits';
import { logSubscriptionEvent } from '@/lib/subscription-events';

export const runtime = 'nodejs';

const MBG_WINDOW_DAYS = 30;

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      {
        error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to your .env.local file.',
        setup_url: 'https://dashboard.stripe.com/apikeys',
      },
      { status: 503 },
    );
  }

  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, CancelAnnualWithCreditSchema);
  if (!parsed.success) return parsed.response;

  const supabase = await createServerSupabase();

  const { data: parent, error: parentErr } = await supabase
    .from('parents')
    .select('id, stripe_customer_id, stripe_subscription_id, subscription_tier')
    .eq('id', auth.user.id)
    .single();

  if (parentErr || !parent) {
    return apiError('Parent record not found.', 404);
  }
  if (!parent.stripe_customer_id || !parent.stripe_subscription_id) {
    return apiError('No active Stripe subscription on file.', 400);
  }

  let sub;
  try {
    sub = await stripe.subscriptions.retrieve(parent.stripe_subscription_id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return apiError(`Stripe subscription lookup failed: ${message}`, 502);
  }

  if (sub.status === 'canceled' || sub.cancel_at_period_end) {
    return apiError('This subscription is already cancelled or scheduled for cancellation.', 409);
  }

  if (!isAnnualSubscription(sub)) {
    return apiError(
      'This endpoint applies only to annual subscriptions. Monthly subscribers cancel any time and keep access until period end at no extra cost.',
      400,
      'NOT_ANNUAL',
    );
  }

  const item = sub.items.data[0];
  if (!item) {
    return apiError('Subscription has no line items.', 500);
  }

  const tier = tierFromPriceId(item.price.id);
  if (!tier) {
    return apiError(
      'Unable to determine credit tier from subscription price. Contact support.',
      500,
      'UNKNOWN_PRICE',
    );
  }

  // Stripe API 2026-02-25+: period boundaries on SubscriptionItem
  const periodStartUnix = item.current_period_start;
  const periodEndUnix = item.current_period_end;
  if (!periodStartUnix || !periodEndUnix) {
    return apiError('Subscription has no current period dates.', 500);
  }

  const periodStart = new Date(periodStartUnix * 1000);
  const periodEnd = new Date(periodEndUnix * 1000);
  const now = new Date();

  // Block requests still inside the 30-day MBG. Users in that window
  // are entitled to a full cash refund, not a credit — different policy
  // path (handled via support email per /terms#refunds).
  const msSinceStart = now.getTime() - periodStart.getTime();
  const daysSinceStart = Math.floor(msSinceStart / 86_400_000);
  if (daysSinceStart < MBG_WINDOW_DAYS) {
    return apiError(
      `This subscription is still inside the 30-day money-back window. Email support@sparkforge.app for a full refund instead of an account credit.`,
      400,
      'INSIDE_MBG_WINDOW',
    );
  }

  const { unusedMonths, creditCents } = computeUnusedMonthsCredit(
    tier,
    periodStart,
    periodEnd,
    now,
  );

  if (creditCents <= 0) {
    return apiError(
      'Less than one full month remains on this subscription. Cancellation will simply stop auto-renewal at period end with no credit.',
      400,
      'NO_CREDIT_DUE',
    );
  }

  // Apply credit FIRST. If this fails we leave the subscription
  // intact so the user can retry. If we cancelled first and the
  // credit failed, the user would have lost access AND received
  // nothing — strictly worse.
  let balanceTxn;
  try {
    balanceTxn = await creditAccountForUnusedMonths(
      stripe,
      parent.stripe_customer_id,
      creditCents,
      `SparkForge annual cancellation credit — ${unusedMonths} unused month(s) on ${tier} plan (sub ${sub.id})`,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[cancel-annual-with-credit] balance transaction failed:', message);
    return apiError(`Failed to apply account credit: ${message}`, 502);
  }

  // Now cancel the subscription IMMEDIATELY. User accepted the credit
  // in lieu of finishing the period.
  let canceled;
  try {
    canceled = await stripe.subscriptions.cancel(sub.id, {
      invoice_now: false,
      prorate: false,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    // Credit already applied; record the inconsistency for ops review.
    console.error(
      '[cancel-annual-with-credit] CRITICAL: credit applied but cancel failed.',
      { customerId: parent.stripe_customer_id, subscriptionId: sub.id, error: message },
    );
    await logSubscriptionEvent(supabase, {
      stripeEventId: `cancel_credit_partial_${Date.now()}_${parent.id}`,
      eventType: 'refund.annual_credit.partial_failure',
      parentId: parent.id,
      data: {
        balance_txn_id: balanceTxn.id,
        credit_cents: creditCents,
        cancel_error: message,
      },
    });
    return apiError(
      'Credit was applied but cancellation failed. Support has been notified and will complete the cancellation shortly.',
      500,
      'PARTIAL_FAILURE',
    );
  }

  await logSubscriptionEvent(supabase, {
    stripeEventId: `cancel_credit_${Date.now()}_${parent.id}`,
    eventType: 'refund.annual_credit.applied',
    parentId: parent.id,
    data: {
      subscription_id: sub.id,
      tier,
      unused_months: unusedMonths,
      credit_cents: creditCents,
      balance_txn_id: balanceTxn.id,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      canceled_at: canceled.canceled_at,
    },
  });

  return apiSuccess({
    subscriptionId: canceled.id,
    status: canceled.status,
    canceledAt: canceled.canceled_at,
    creditApplied: {
      unusedMonths,
      creditCents,
      creditDollars: (creditCents / 100).toFixed(2),
      currency: 'usd',
      balanceTransactionId: balanceTxn.id,
      description:
        'Credit will automatically apply to your next SparkForge invoice. It never expires.',
    },
  });
}
