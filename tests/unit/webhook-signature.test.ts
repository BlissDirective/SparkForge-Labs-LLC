// ════════════════════════════════════════════════════
// Unit test — Stripe webhook signature handling
// v3 Gap 1/Task 4
// ════════════════════════════════════════════════════
// Fast, deterministic, no network / no Supabase / no Stripe API.
//
// Covers:
//  1. HMAC-SHA256 signing matches Stripe's published format
//     (i.e. what scripts/smoke-test-webhook.ts produces)
//  2. Signed payloads verify cleanly through stripe.webhooks.constructEvent
//  3. Tampered payloads are rejected
//  4. Unsigned requests fail gracefully
//
// Run via:
//   npm run test
// ════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import Stripe from 'stripe';

const TEST_SECRET = 'whsec_smoke_test_secret_do_not_use_in_production';

// Same signing function as scripts/smoke-test-webhook.ts — kept in
// lockstep here so changes to the signing logic break this test.
function signStripePayload(body: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${body}`;
  const hmac = createHmac('sha256', secret);
  hmac.update(signedPayload);
  const v1 = hmac.digest('hex');
  return `t=${timestamp},v1=${v1}`;
}

function makeFakeEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'evt_test_' + Date.now(),
    object: 'event',
    api_version: '2026-02-25.clover',
    created: Math.floor(Date.now() / 1000),
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        object: 'checkout.session',
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
        mode: 'subscription',
        payment_status: 'paid',
        status: 'complete',
        metadata: {
          supabase_id: '00000000-0000-0000-0000-000000000000',
          tier: 'plus',
        },
      },
    },
    livemode: false,
    pending_webhooks: 0,
    request: null,
    ...overrides,
  };
}

describe('Stripe webhook signature', () => {
  it('signs a payload in the Stripe "t=<unix>,v1=<hex>" format', () => {
    const body = JSON.stringify({ hello: 'world' });
    const sig = signStripePayload(body, TEST_SECRET);

    expect(sig).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
  });

  it('timestamp is within the last few seconds', () => {
    const body = 'x';
    const sig = signStripePayload(body, TEST_SECRET);
    const match = sig.match(/^t=(\d+),/);
    expect(match).not.toBeNull();
    const ts = parseInt(match![1]!, 10);
    const now = Math.floor(Date.now() / 1000);
    expect(Math.abs(now - ts)).toBeLessThan(5);
  });

  it('constructEvent accepts our signed payload', () => {
    const stripe = new Stripe('sk_test_unused_key_for_signature_only', {
      apiVersion: '2026-02-25.clover',
    });

    const event = makeFakeEvent();
    const body = JSON.stringify(event);
    const sig = signStripePayload(body, TEST_SECRET);

    const verified = stripe.webhooks.constructEvent(body, sig, TEST_SECRET);

    expect(verified.id).toBe(event.id);
    expect(verified.type).toBe('checkout.session.completed');
    // Metadata survives the round-trip
    const obj = verified.data.object as { metadata?: { tier?: string } };
    expect(obj.metadata?.tier).toBe('plus');
  });

  it('rejects a tampered body', () => {
    const stripe = new Stripe('sk_test_unused_key_for_signature_only', {
      apiVersion: '2026-02-25.clover',
    });

    const original = JSON.stringify(makeFakeEvent());
    const sig = signStripePayload(original, TEST_SECRET);
    // Tamper with the body AFTER signing
    const tampered = original.replace('"plus"', '"forge"');

    expect(() => {
      stripe.webhooks.constructEvent(tampered, sig, TEST_SECRET);
    }).toThrow(/signature/i);
  });

  it('rejects a mismatched secret', () => {
    const stripe = new Stripe('sk_test_unused_key_for_signature_only', {
      apiVersion: '2026-02-25.clover',
    });

    const body = JSON.stringify(makeFakeEvent());
    const sig = signStripePayload(body, TEST_SECRET);

    expect(() => {
      stripe.webhooks.constructEvent(body, sig, 'whsec_different_secret');
    }).toThrow(/signature/i);
  });

  it('rejects an empty signature', () => {
    const stripe = new Stripe('sk_test_unused_key_for_signature_only', {
      apiVersion: '2026-02-25.clover',
    });

    const body = JSON.stringify(makeFakeEvent());

    expect(() => {
      stripe.webhooks.constructEvent(body, '', TEST_SECRET);
    }).toThrow();
  });
});
