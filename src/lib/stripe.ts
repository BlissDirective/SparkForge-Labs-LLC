// Shared Stripe configuration
// Single source of truth for Stripe API version across all route handlers
import Stripe from 'stripe';

export const STRIPE_API_VERSION = '2026-02-25.clover' as const;

/**
 * Lazy Stripe client init with graceful fallback (ENH-8A).
 * Returns null if STRIPE_SECRET_KEY is not configured.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION });
}

/**
 * Normalize the many shapes Stripe uses for a `customer` reference into
 * a plain customer-id string.
 *
 * PAY-HIGH-002 (B): Previous call sites did `customer as string`, which
 * silently produced `'[object Object]'` if a handler was ever called
 * with an expanded Customer object, or `'null'` if the customer was
 * deleted. Those strings never match any `stripe_customer_id` column,
 * so the downstream UPDATE silently affected zero rows and we dropped
 * legitimate subscription events without noticing.
 *
 * Returns `null` for the null / DeletedCustomer case so callers can
 * log + skip rather than run a useless query.
 */
export function getCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined,
): string | null {
  if (!customer) return null;
  if (typeof customer === 'string') return customer;
  // Expanded Customer and DeletedCustomer both expose `.id`.
  return customer.id ?? null;
}
