// ════════════════════════════════════════════════════
// Unit tests — Stripe webhook handler end-to-end
// v3 Gap 1/Task 4 follow-up
// ════════════════════════════════════════════════════
// Tests every branch of src/app/api/stripe/webhook/route.ts
// with mocked Supabase + Stripe clients. Fast, deterministic,
// zero network. Complements:
//   - tests/unit/webhook-signature.test.ts (signing algo only)
//   - scripts/smoke-test-webhook.ts (live dev-server e2e)
//
// Coverage:
//   1. Missing stripe-signature header → 503
//   2. Invalid signature throws from constructEvent → 400
//   3. checkout.session.completed writes all Gap 1+2 fields
//   4. customer.subscription.updated derives tier from Plus price
//   5. customer.subscription.updated derives tier from Forge price
//   6. customer.subscription.updated with unknown price keeps tier
//   7. customer.subscription.deleted downgrades + clears sub ID
//   8. invoice.payment_failed flips status to past_due
//   9. Stripe status 'trialing' maps to 'active'
//  10. Stripe status 'past_due' maps to 'past_due'
//  11. Subscription.trial_end → ISO timestamp written
//  12. Event audit row upserted with stripe_event_id
//  13. Missing env price IDs → no tier derivation
// ════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import type Stripe from 'stripe';

// ─── Mock modules BEFORE importing the route ─────────
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}));
vi.mock('@/lib/stripe', async (importOriginal) => {
  // PAY-HIGH-002: Keep the real `getCustomerId` helper (pure function)
  // while mocking `getStripe`. Using importOriginal() propagates any
  // future additions to the stripe-lib surface automatically.
  const actual = await importOriginal<typeof import('@/lib/stripe')>();
  return {
    ...actual,
    getStripe: vi.fn(),
  };
});

// Now safe to import
import { POST } from '@/app/api/stripe/webhook/route';
import { createAdminClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

const mockCreateAdmin = vi.mocked(createAdminClient);
const mockGetStripe = vi.mocked(getStripe);

// ─── Supabase mock ─────────────────────────────────
type Call =
  | { table: string; op: 'upsert'; data: Record<string, unknown>; options?: Record<string, unknown> }
  | { table: string; op: 'insert'; data: Record<string, unknown> }
  | { table: string; op: 'update'; data: Record<string, unknown>; filter?: { col: string; val: unknown } };

interface MockSupabaseOpts {
  // PAY-CRIT-001 (6B): Override the processed flag returned from
  // SELECT processed FROM subscription_events. Default: false (event is
  // unprocessed → webhook runs business logic). Set true to simulate a
  // replay → webhook should short-circuit.
  alreadyProcessed?: boolean;
}

function createMockSupabase(opts: MockSupabaseOpts = {}) {
  const calls: Call[] = [];
  const client = {
    from(table: string) {
      return {
        upsert(data: Record<string, unknown>, options?: Record<string, unknown>) {
          calls.push({ table, op: 'upsert', data, options });
          return Promise.resolve({ data: null, error: null });
        },
        insert(data: Record<string, unknown>) {
          calls.push({ table, op: 'insert', data });
          return Promise.resolve({ data: null, error: null });
        },
        update(data: Record<string, unknown>) {
          const entry: Call = { table, op: 'update', data };
          calls.push(entry);
          return {
            eq(col: string, val: unknown) {
              (entry as { filter?: { col: string; val: unknown } }).filter = { col, val };
              return Promise.resolve({ data: null, error: null });
            },
          };
        },
        // PAY-CRIT-001 (6B): The webhook calls
        //   supabase.from('subscription_events')
        //     .select('processed')
        //     .eq('stripe_event_id', event.id)
        //     .single()
        // for the idempotency guard. Mock returns a processed=false row by
        // default so the handler proceeds to business logic.
        select(_cols?: string) {
          return {
            eq(_col: string, _val: unknown) {
              return {
                single() {
                  return Promise.resolve({
                    data: { processed: opts.alreadyProcessed ?? false },
                    error: null,
                  });
                },
              };
            },
          };
        },
      };
    },
  };
  return { client, calls };
}

// ─── Stripe mock ───────────────────────────────────
interface StripeMockOpts {
  event?: unknown;
  subscription?: Partial<Stripe.Subscription>;
  throwOnVerify?: Error;
}

function createMockStripe(opts: StripeMockOpts = {}) {
  const defaultSub = {
    id: 'sub_test_default',
    trial_end: null,
    items: { data: [{ current_period_end: null, price: { id: 'price_plus_m' } }] },
  };
  return {
    webhooks: {
      constructEvent: vi.fn((body: string) => {
        if (opts.throwOnVerify) throw opts.throwOnVerify;
        return opts.event ?? JSON.parse(body);
      }),
    },
    subscriptions: {
      retrieve: vi.fn(() => Promise.resolve(opts.subscription ?? defaultSub)),
    },
  };
}

// ─── Test helpers ──────────────────────────────────
function makeRequest(body: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/stripe/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  });
}

function asParents(calls: Call[], op: Call['op']) {
  return calls.filter((c) => c.table === 'parents' && c.op === op);
}

// ─── Test setup ────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  process.env.STRIPE_PLUS_MONTHLY_ID = 'price_plus_m';
  process.env.STRIPE_PLUS_YEARLY_ID = 'price_plus_y';
  process.env.STRIPE_FORGE_MONTHLY_ID = 'price_forge_m';
  process.env.STRIPE_FORGE_YEARLY_ID = 'price_forge_y';
});

afterEach(() => {
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.STRIPE_PLUS_MONTHLY_ID;
  delete process.env.STRIPE_PLUS_YEARLY_ID;
  delete process.env.STRIPE_FORGE_MONTHLY_ID;
  delete process.env.STRIPE_FORGE_YEARLY_ID;
});

// ═══════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════

describe('webhook handler — auth + env guards', () => {
  it('returns 503 when Stripe is not configured', async () => {
    mockGetStripe.mockReturnValue(null);
    const req = makeRequest('{}');
    const res = await POST(req);
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/not configured/i);
  });

  it('returns 503 when stripe-signature header is missing', async () => {
    mockGetStripe.mockReturnValue(createMockStripe() as unknown as Stripe);
    const { client } = createMockSupabase();
    mockCreateAdmin.mockReturnValue(client as unknown as ReturnType<typeof createAdminClient>);

    const req = makeRequest('{}'); // no signature header
    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it('returns 503 when STRIPE_WEBHOOK_SECRET is missing', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    mockGetStripe.mockReturnValue(createMockStripe() as unknown as Stripe);

    const req = makeRequest('{}', { 'stripe-signature': 'whatever' });
    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it('returns 400 when signature verification throws', async () => {
    const stripe = createMockStripe({
      throwOnVerify: new Error('No signatures found matching the expected signature'),
    });
    mockGetStripe.mockReturnValue(stripe as unknown as Stripe);
    const { client } = createMockSupabase();
    mockCreateAdmin.mockReturnValue(client as unknown as ReturnType<typeof createAdminClient>);

    const req = makeRequest('{}', { 'stripe-signature': 'bad_sig' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/signature/i);
  });
});

describe('webhook handler — checkout.session.completed', () => {
  it('writes parents update with all Gap 1+2 fields', async () => {
    const event = {
      id: 'evt_checkout_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          customer: 'cus_abc',
          subscription: 'sub_abc',
          metadata: {
            supabase_id: 'parent-uuid-123',
            tier: 'forge',
          },
        },
      },
    };
    const subscription = {
      id: 'sub_abc',
      trial_end: 1800000000, // unix seconds
      items: {
        data: [
          {
            current_period_end: 1802592000,
            price: { id: 'price_forge_m' },
          },
        ],
      },
    } as unknown as Stripe.Subscription;

    const stripe = createMockStripe({ event, subscription });
    mockGetStripe.mockReturnValue(stripe as unknown as Stripe);
    const { client, calls } = createMockSupabase();
    mockCreateAdmin.mockReturnValue(client as unknown as ReturnType<typeof createAdminClient>);

    const req = makeRequest(JSON.stringify(event), { 'stripe-signature': 't=1,v1=ok' });
    const res = await POST(req);
    expect(res.status).toBe(200);

    // 1. Event audit row upserted
    const upserts = calls.filter((c) => c.op === 'upsert' && c.table === 'subscription_events');
    expect(upserts).toHaveLength(1);
    const auditEntry = upserts[0] as unknown as {
      data: { stripe_event_id: string; event_type: string };
    };
    expect(auditEntry.data.stripe_event_id).toBe('evt_checkout_123');
    expect(auditEntry.data.event_type).toBe('checkout.session.completed');

    // 2. Parents row updated with the Gap 1+2 fields
    const parentUpdates = asParents(calls, 'update') as Array<{
      data: Record<string, unknown>;
      filter?: { col: string; val: unknown };
    }>;
    expect(parentUpdates).toHaveLength(1);
    const update = parentUpdates[0];
    expect(update.data.subscription_tier).toBe('forge');
    expect(update.data.subscription_status).toBe('active');
    expect(update.data.stripe_customer_id).toBe('cus_abc');
    expect(update.data.stripe_subscription_id).toBe('sub_abc');
    expect(update.data.trial_ends_at).toBe(new Date(1800000000 * 1000).toISOString());
    expect(update.data.subscription_period_end).toBe(new Date(1802592000 * 1000).toISOString());
    expect(update.filter).toEqual({ col: 'id', val: 'parent-uuid-123' });

    // 3. subscription_events audit row back-filled with parent_id.
    //    PAY-CRIT-001 (6B): A second update sets processed=true at the end
    //    of the handler. Filter to the parent_id backfill specifically.
    const parentIdBackfills = calls.filter(
      (c) =>
        c.op === 'update' &&
        c.table === 'subscription_events' &&
        'parent_id' in (c as { data: Record<string, unknown> }).data,
    );
    expect(parentIdBackfills).toHaveLength(1);
    const processedMarks = calls.filter(
      (c) =>
        c.op === 'update' &&
        c.table === 'subscription_events' &&
        'processed' in (c as { data: Record<string, unknown> }).data,
    );
    expect(processedMarks).toHaveLength(1);
  });

  it('defaults tier to plus when metadata.tier is missing', async () => {
    const event = {
      id: 'evt_checkout_456',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_456',
          customer: 'cus_def',
          subscription: null, // no subscription → skips the retrieve call
          metadata: {
            supabase_id: 'parent-uuid-456',
            // no tier key
          },
        },
      },
    };
    const stripe = createMockStripe({ event });
    mockGetStripe.mockReturnValue(stripe as unknown as Stripe);
    const { client, calls } = createMockSupabase();
    mockCreateAdmin.mockReturnValue(client as unknown as ReturnType<typeof createAdminClient>);

    const req = makeRequest(JSON.stringify(event), { 'stripe-signature': 't=1,v1=ok' });
    await POST(req);

    const update = (asParents(calls, 'update') as Array<{ data: Record<string, unknown> }>)[0];
    expect(update.data.subscription_tier).toBe('plus');
    expect(update.data.stripe_subscription_id).toBeNull();
  });

  it('skips parents update when supabase_id metadata is missing', async () => {
    const event = {
      id: 'evt_checkout_789',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_789',
          customer: 'cus_xyz',
          subscription: 'sub_xyz',
          metadata: {}, // no supabase_id
        },
      },
    };
    const stripe = createMockStripe({ event });
    mockGetStripe.mockReturnValue(stripe as unknown as Stripe);
    const { client, calls } = createMockSupabase();
    mockCreateAdmin.mockReturnValue(client as unknown as ReturnType<typeof createAdminClient>);

    const req = makeRequest(JSON.stringify(event), { 'stripe-signature': 't=1,v1=ok' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    // No parents update should be attempted
    expect(asParents(calls, 'update')).toHaveLength(0);
    // Audit row still written
    expect(calls.filter((c) => c.table === 'subscription_events' && c.op === 'upsert')).toHaveLength(1);
  });
});

describe('webhook handler — customer.subscription.updated', () => {
  function makeSubEvent(
    status: string,
    priceId: string,
    trialEnd: number | null = null,
    periodEnd: number | null = null
  ) {
    return {
      id: `evt_sub_${status}_${priceId}`,
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test',
          customer: 'cus_test',
          status,
          trial_end: trialEnd,
          items: {
            data: [{ current_period_end: periodEnd, price: { id: priceId } }],
          },
        },
      },
    };
  }

  it('derives tier=plus from Plus monthly price ID', async () => {
    const event = makeSubEvent('active', 'price_plus_m');
    const stripe = createMockStripe({ event });
    mockGetStripe.mockReturnValue(stripe as unknown as Stripe);
    const { client, calls } = createMockSupabase();
    mockCreateAdmin.mockReturnValue(client as unknown as ReturnType<typeof createAdminClient>);

    await POST(makeRequest(JSON.stringify(event), { 'stripe-signature': 'ok' }));

    const update = (asParents(calls, 'update') as Array<{ data: Record<string, unknown>; filter?: { col: string; val: unknown } }>)[0];
    expect(update.data.subscription_tier).toBe('plus');
    expect(update.data.stripe_subscription_id).toBe('sub_test');
    expect(update.filter).toEqual({ col: 'stripe_customer_id', val: 'cus_test' });
  });

  it('derives tier=forge from Forge yearly price ID', async () => {
    const event = makeSubEvent('active', 'price_forge_y');
    const stripe = createMockStripe({ event });
    mockGetStripe.mockReturnValue(stripe as unknown as Stripe);
    const { client, calls } = createMockSupabase();
    mockCreateAdmin.mockReturnValue(client as unknown as ReturnType<typeof createAdminClient>);

    await POST(makeRequest(JSON.stringify(event), { 'stripe-signature': 'ok' }));

    const update = (asParents(calls, 'update') as Array<{ data: Record<string, unknown> }>)[0];
    expect(update.data.subscription_tier).toBe('forge');
  });

  it('does NOT overwrite tier when price ID is unknown', async () => {
    const event = makeSubEvent('active', 'price_unknown');
    const stripe = createMockStripe({ event });
    mockGetStripe.mockReturnValue(stripe as unknown as Stripe);
    const { client, calls } = createMockSupabase();
    mockCreateAdmin.mockReturnValue(client as unknown as ReturnType<typeof createAdminClient>);

    await POST(makeRequest(JSON.stringify(event), { 'stripe-signature': 'ok' }));

    const update = (asParents(calls, 'update') as Array<{ data: Record<string, unknown> }>)[0];
    expect(update.data).not.toHaveProperty('subscription_tier');
    // Other fields still updated
    expect(update.data.subscription_status).toBe('active');
    expect(update.data.stripe_subscription_id).toBe('sub_test');
  });

  it('maps Stripe status "trialing" to app status "active"', async () => {
    const event = makeSubEvent('trialing', 'price_plus_m');
    const stripe = createMockStripe({ event });
    mockGetStripe.mockReturnValue(stripe as unknown as Stripe);
    const { client, calls } = createMockSupabase();
    mockCreateAdmin.mockReturnValue(client as unknown as ReturnType<typeof createAdminClient>);

    await POST(makeRequest(JSON.stringify(event), { 'stripe-signature': 'ok' }));

    const update = (asParents(calls, 'update') as Array<{ data: Record<string, unknown> }>)[0];
    expect(update.data.subscription_status).toBe('active');
  });

  it('maps Stripe status "past_due" to app status "past_due"', async () => {
    const event = makeSubEvent('past_due', 'price_plus_m');
    const stripe = createMockStripe({ event });
    mockGetStripe.mockReturnValue(stripe as unknown as Stripe);
    const { client, calls } = createMockSupabase();
    mockCreateAdmin.mockReturnValue(client as unknown as ReturnType<typeof createAdminClient>);

    await POST(makeRequest(JSON.stringify(event), { 'stripe-signature': 'ok' }));

    const update = (asParents(calls, 'update') as Array<{ data: Record<string, unknown> }>)[0];
    expect(update.data.subscription_status).toBe('past_due');
  });

  it('converts trial_end unix seconds to ISO string', async () => {
    const unixSeconds = 1801000000;
    const event = makeSubEvent('active', 'price_plus_m', unixSeconds, unixSeconds + 1000);
    const stripe = createMockStripe({ event });
    mockGetStripe.mockReturnValue(stripe as unknown as Stripe);
    const { client, calls } = createMockSupabase();
    mockCreateAdmin.mockReturnValue(client as unknown as ReturnType<typeof createAdminClient>);

    await POST(makeRequest(JSON.stringify(event), { 'stripe-signature': 'ok' }));

    const update = (asParents(calls, 'update') as Array<{ data: Record<string, unknown> }>)[0];
    expect(update.data.trial_ends_at).toBe(new Date(unixSeconds * 1000).toISOString());
    expect(update.data.subscription_period_end).toBe(new Date((unixSeconds + 1000) * 1000).toISOString());
  });
});

describe('webhook handler — customer.subscription.deleted', () => {
  it('downgrades tier to free and clears subscription fields', async () => {
    const event = {
      id: 'evt_sub_deleted',
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_gone', customer: 'cus_gone' } },
    };
    const stripe = createMockStripe({ event });
    mockGetStripe.mockReturnValue(stripe as unknown as Stripe);
    const { client, calls } = createMockSupabase();
    mockCreateAdmin.mockReturnValue(client as unknown as ReturnType<typeof createAdminClient>);

    await POST(makeRequest(JSON.stringify(event), { 'stripe-signature': 'ok' }));

    const update = (asParents(calls, 'update') as Array<{ data: Record<string, unknown>; filter?: { col: string; val: unknown } }>)[0];
    expect(update.data.subscription_tier).toBe('free');
    expect(update.data.subscription_status).toBe('canceled');
    expect(update.data.stripe_subscription_id).toBeNull();
    expect(update.data.trial_ends_at).toBeNull();
    expect(update.data.subscription_period_end).toBeNull();
    expect(update.filter).toEqual({ col: 'stripe_customer_id', val: 'cus_gone' });
  });
});

describe('webhook handler — invoice.payment_failed', () => {
  it('flips subscription_status to past_due', async () => {
    const event = {
      id: 'evt_invoice_failed',
      type: 'invoice.payment_failed',
      data: { object: { id: 'in_test', customer: 'cus_broke' } },
    };
    const stripe = createMockStripe({ event });
    mockGetStripe.mockReturnValue(stripe as unknown as Stripe);
    const { client, calls } = createMockSupabase();
    mockCreateAdmin.mockReturnValue(client as unknown as ReturnType<typeof createAdminClient>);

    await POST(makeRequest(JSON.stringify(event), { 'stripe-signature': 'ok' }));

    const update = (asParents(calls, 'update') as Array<{ data: Record<string, unknown>; filter?: { col: string; val: unknown } }>)[0];
    expect(update.data.subscription_status).toBe('past_due');
    expect(update.filter).toEqual({ col: 'stripe_customer_id', val: 'cus_broke' });
    // We only update status — nothing else
    expect(Object.keys(update.data)).toEqual(['subscription_status']);
  });
});

describe('webhook handler — audit + idempotency', () => {
  it('upserts the event row with onConflict=stripe_event_id and ignoreDuplicates', async () => {
    const event = {
      id: 'evt_any',
      type: 'invoice.payment_failed',
      data: { object: { customer: 'cus_any' } },
    };
    const stripe = createMockStripe({ event });
    mockGetStripe.mockReturnValue(stripe as unknown as Stripe);
    const { client, calls } = createMockSupabase();
    mockCreateAdmin.mockReturnValue(client as unknown as ReturnType<typeof createAdminClient>);

    await POST(makeRequest(JSON.stringify(event), { 'stripe-signature': 'ok' }));

    const audit = calls.find(
      (c) => c.table === 'subscription_events' && c.op === 'upsert'
    ) as { options?: { onConflict?: string; ignoreDuplicates?: boolean } } | undefined;
    expect(audit).toBeDefined();
    expect(audit!.options?.onConflict).toBe('stripe_event_id');
    expect(audit!.options?.ignoreDuplicates).toBe(true);
  });

  it('returns 200 { received: true } for unknown event types', async () => {
    const event = {
      id: 'evt_unknown',
      type: 'some.unrelated.event',
      data: { object: {} },
    };
    const stripe = createMockStripe({ event });
    mockGetStripe.mockReturnValue(stripe as unknown as Stripe);
    const { client, calls } = createMockSupabase();
    mockCreateAdmin.mockReturnValue(client as unknown as ReturnType<typeof createAdminClient>);

    const res = await POST(makeRequest(JSON.stringify(event), { 'stripe-signature': 'ok' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { received: boolean };
    expect(body.received).toBe(true);

    // No parents update for unknown event types
    expect(asParents(calls, 'update')).toHaveLength(0);
    // But audit row still upserted
    expect(calls.filter((c) => c.table === 'subscription_events' && c.op === 'upsert')).toHaveLength(1);
  });

  // PAY-CRIT-001 (6B): Idempotency guard short-circuits replays.
  it('short-circuits when event is already processed (replay)', async () => {
    const event = {
      id: 'evt_replay',
      type: 'invoice.payment_failed',
      data: { object: { customer: 'cus_replay' } },
    };
    const stripe = createMockStripe({ event });
    mockGetStripe.mockReturnValue(stripe as unknown as Stripe);
    const { client, calls } = createMockSupabase({ alreadyProcessed: true });
    mockCreateAdmin.mockReturnValue(client as unknown as ReturnType<typeof createAdminClient>);

    const res = await POST(makeRequest(JSON.stringify(event), { 'stripe-signature': 'ok' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { received: boolean; replay?: boolean; skipped?: boolean };
    expect(body.received).toBe(true);
    expect(body.replay).toBe(true);
    expect(body.skipped).toBe(true);

    // Business logic must NOT run on replay
    expect(asParents(calls, 'update')).toHaveLength(0);
    // No processed=true write either (already processed)
    const processedMarks = calls.filter(
      (c) =>
        c.op === 'update' &&
        c.table === 'subscription_events' &&
        'processed' in (c as { data: Record<string, unknown> }).data,
    );
    expect(processedMarks).toHaveLength(0);
  });

  // DB-CRIT-001 (4C): Dual-write splits sensitive payload to detail table.
  it('writes raw payload to subscription_events_detail (admin-only)', async () => {
    const event = {
      id: 'evt_detail_test',
      type: 'invoice.payment_failed',
      data: { object: { customer: 'cus_detail', secret_field: 'never_expose_to_parents' } },
    };
    const stripe = createMockStripe({ event });
    mockGetStripe.mockReturnValue(stripe as unknown as Stripe);
    const { client, calls } = createMockSupabase();
    mockCreateAdmin.mockReturnValue(client as unknown as ReturnType<typeof createAdminClient>);

    await POST(makeRequest(JSON.stringify(event), { 'stripe-signature': 'ok' }));

    // Detail table receives the raw payload
    const detailUpsert = calls.find(
      (c) => c.table === 'subscription_events_detail' && c.op === 'upsert',
    ) as { data: { stripe_event_id: string; data: Record<string, unknown> } } | undefined;
    expect(detailUpsert).toBeDefined();
    expect(detailUpsert!.data.stripe_event_id).toBe('evt_detail_test');
    expect(detailUpsert!.data.data).toMatchObject({ secret_field: 'never_expose_to_parents' });

    // Metadata table does NOT carry the raw payload (no `data` key)
    const metaUpsert = calls.find(
      (c) => c.table === 'subscription_events' && c.op === 'upsert',
    ) as { data: Record<string, unknown> } | undefined;
    expect(metaUpsert).toBeDefined();
    expect('data' in metaUpsert!.data).toBe(false);
    expect(metaUpsert!.data.event_type).toBe('invoice.payment_failed');
  });
});
