// ════════════════════════════════════════════════════
// Stripe customer-balance credit helpers
//
// Implements the "Option B" annual cancellation policy from
// /terms#refunds: after the 30-day money-back window, an
// annual cancellation forfeits cash but receives Stripe
// customer-balance credit equal to (unused months ×
// monthly-equivalent rate). The credit applies automatically
// to the customer's next invoice (any future SparkForge
// charge) and never expires.
//
// Stripe docs:
//   https://stripe.com/docs/billing/customer/balance
//   https://stripe.com/docs/api/customer_balance_transactions/create
//
// Sign convention:
//   - Positive `amount` on createBalanceTransaction → DEBIT
//     (customer owes more on next invoice).
//   - Negative `amount` on createBalanceTransaction → CREDIT
//     (customer owes less / has credit).
//
// We always pass NEGATIVE amounts for credits.
// ════════════════════════════════════════════════════

import type Stripe from 'stripe';

// Monthly-equivalent rates in cents. Mirrors TIER_DISPLAY in
// src/lib/tier-config.ts (plus: $7.99, forge: $14.99). Kept in
// cents to avoid floating-point arithmetic on money.
export const MONTHLY_EQUIVALENT_CENTS = {
  plus: 799,
  forge: 1499,
} as const satisfies Record<'plus' | 'forge', number>;

export type CreditableTier = keyof typeof MONTHLY_EQUIVALENT_CENTS;

export interface UnusedMonthsCredit {
  unusedMonths: number;
  creditCents: number;
}

/**
 * Compute the credit owed when cancelling an annual subscription
 * mid-term, in WHOLE unused months.
 *
 * Partial months are rounded DOWN to be conservative — the in-progress
 * billing month is treated as "used" and not credited. This matches
 * the policy text in /terms#refunds: "credit your SparkForge account
 * for the unused months at the monthly-equivalent rate."
 *
 * Returns 0 if the cancel time is at or after period end.
 *
 * Caps at 11 months even on edge cases (e.g. clock skew yielding
 * floor(remainingDays / 30) = 12 — impossible after at least 1 day
 * of use).
 */
export function computeUnusedMonthsCredit(
  tier: CreditableTier,
  periodStart: Date,
  periodEnd: Date,
  cancelAt: Date,
): UnusedMonthsCredit {
  const startMs = periodStart.getTime();
  const endMs = periodEnd.getTime();
  const cancelMs = cancelAt.getTime();

  if (!(endMs > startMs)) {
    throw new Error('periodEnd must be after periodStart');
  }
  if (cancelMs >= endMs) {
    return { unusedMonths: 0, creditCents: 0 };
  }
  if (cancelMs < startMs) {
    throw new Error('cancelAt must be at or after periodStart');
  }

  const msPerDay = 86_400_000;
  const remainingDays = Math.floor((endMs - cancelMs) / msPerDay);
  const unusedMonths = Math.min(11, Math.floor(remainingDays / 30));
  const creditCents = unusedMonths * MONTHLY_EQUIVALENT_CENTS[tier];

  return { unusedMonths, creditCents };
}

/**
 * Apply a credit to the Stripe customer's balance.
 *
 * Pass `creditCents` as a POSITIVE integer (the amount to credit).
 * The function negates internally before sending to Stripe so the
 * sign convention (negative = credit) is hidden from callers.
 *
 * The returned BalanceTransaction can be persisted on the parent
 * record for audit / customer-support reference.
 */
export async function creditAccountForUnusedMonths(
  stripe: Stripe,
  customerId: string,
  creditCents: number,
  description: string,
): Promise<Stripe.CustomerBalanceTransaction> {
  if (!Number.isInteger(creditCents) || creditCents <= 0) {
    throw new Error(`creditCents must be a positive integer; got ${creditCents}`);
  }
  return stripe.customers.createBalanceTransaction(customerId, {
    amount: -creditCents,
    currency: 'usd',
    description,
  });
}

/**
 * Detect whether a subscription's price is the annual cadence.
 * We look up the price interval directly so the check stays
 * accurate even if a subscription was migrated to a new price ID.
 */
export function isAnnualSubscription(sub: Stripe.Subscription): boolean {
  const item = sub.items.data[0];
  if (!item) return false;
  const recurring = item.price.recurring;
  return recurring?.interval === 'year';
}

/**
 * Returns the tier slug ('plus' | 'forge') backing a Stripe price ID,
 * or null if the price doesn't belong to a creditable tier.
 *
 * Resolves via env-configured price IDs so the mapping stays in sync
 * with whatever Stripe products are active in this environment.
 */
export function tierFromPriceId(priceId: string): CreditableTier | null {
  if (
    priceId === process.env.STRIPE_PLUS_MONTHLY_ID ||
    priceId === process.env.STRIPE_PLUS_YEARLY_ID
  ) {
    return 'plus';
  }
  if (
    priceId === process.env.STRIPE_FORGE_MONTHLY_ID ||
    priceId === process.env.STRIPE_FORGE_YEARLY_ID
  ) {
    return 'forge';
  }
  return null;
}
