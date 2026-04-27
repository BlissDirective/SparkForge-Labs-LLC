// ════════════════════════════════════════════════════
// Unit tests — computeUnusedMonthsCredit (Option B refund policy)
// ════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  computeUnusedMonthsCredit,
  MONTHLY_EQUIVALENT_CENTS,
  isAnnualSubscription,
  tierFromPriceId,
} from '@/lib/stripe-credits';
import type Stripe from 'stripe';

describe('computeUnusedMonthsCredit', () => {
  const start = new Date('2026-01-01T00:00:00Z');
  const end = new Date('2027-01-01T00:00:00Z');

  it('returns 0 credit when cancel happens at or after period end', () => {
    expect(computeUnusedMonthsCredit('plus', start, end, end)).toEqual({
      unusedMonths: 0,
      creditCents: 0,
    });
    expect(
      computeUnusedMonthsCredit('plus', start, end, new Date('2027-06-01T00:00:00Z')),
    ).toEqual({ unusedMonths: 0, creditCents: 0 });
  });

  it('returns 11 months credit when cancel happens 1 day after period start', () => {
    const cancelAt = new Date('2026-01-02T00:00:00Z');
    const result = computeUnusedMonthsCredit('forge', start, end, cancelAt);
    expect(result.unusedMonths).toBe(11);
    expect(result.creditCents).toBe(11 * MONTHLY_EQUIVALENT_CENTS.forge);
  });

  it('credits 6 months mid-year for plus tier', () => {
    const cancelAt = new Date('2026-07-01T00:00:00Z');
    const result = computeUnusedMonthsCredit('plus', start, end, cancelAt);
    expect(result.unusedMonths).toBe(6);
    expect(result.creditCents).toBe(6 * MONTHLY_EQUIVALENT_CENTS.plus);
    expect(result.creditCents).toBe(4794);
  });

  it('floors partial months — 45 days remaining = 1 month credit', () => {
    const cancelAt = new Date('2026-11-17T00:00:00Z');
    const result = computeUnusedMonthsCredit('plus', start, end, cancelAt);
    expect(result.unusedMonths).toBe(1);
    expect(result.creditCents).toBe(MONTHLY_EQUIVALENT_CENTS.plus);
  });

  it('returns 0 when only days remain (less than 30)', () => {
    const cancelAt = new Date('2026-12-15T00:00:00Z');
    const result = computeUnusedMonthsCredit('plus', start, end, cancelAt);
    expect(result.unusedMonths).toBe(0);
    expect(result.creditCents).toBe(0);
  });

  it('throws when cancelAt precedes periodStart', () => {
    const before = new Date('2025-12-01T00:00:00Z');
    expect(() => computeUnusedMonthsCredit('plus', start, end, before)).toThrow();
  });

  it('throws when periodEnd is not after periodStart', () => {
    expect(() => computeUnusedMonthsCredit('plus', end, start, end)).toThrow();
  });
});

describe('isAnnualSubscription', () => {
  function makeSub(interval: 'month' | 'year' | 'week'): Stripe.Subscription {
    return {
      items: {
        data: [{ price: { recurring: { interval } } }],
      },
    } as unknown as Stripe.Subscription;
  }

  it('returns true for yearly subscription', () => {
    expect(isAnnualSubscription(makeSub('year'))).toBe(true);
  });

  it('returns false for monthly subscription', () => {
    expect(isAnnualSubscription(makeSub('month'))).toBe(false);
  });

  it('returns false when items array is empty', () => {
    const sub = { items: { data: [] } } as unknown as Stripe.Subscription;
    expect(isAnnualSubscription(sub)).toBe(false);
  });
});

describe('tierFromPriceId', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.STRIPE_PLUS_MONTHLY_ID = 'price_plus_m';
    process.env.STRIPE_PLUS_YEARLY_ID = 'price_plus_y';
    process.env.STRIPE_FORGE_MONTHLY_ID = 'price_forge_m';
    process.env.STRIPE_FORGE_YEARLY_ID = 'price_forge_y';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('maps plus price IDs', () => {
    expect(tierFromPriceId('price_plus_m')).toBe('plus');
    expect(tierFromPriceId('price_plus_y')).toBe('plus');
  });

  it('maps forge price IDs', () => {
    expect(tierFromPriceId('price_forge_m')).toBe('forge');
    expect(tierFromPriceId('price_forge_y')).toBe('forge');
  });

  it('returns null for unknown price', () => {
    expect(tierFromPriceId('price_unknown')).toBe(null);
  });
});
