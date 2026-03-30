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
