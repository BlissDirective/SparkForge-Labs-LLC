// ════════════════════════════════════════════════════════════════
// Unit tests — DELETE /api/auth/delete-account (PAY-MED-003 Opt B)
// ════════════════════════════════════════════════════════════════
// Verifies:
//   1. Unauthenticated request → 401
//   2. Missing / wrong confirm value → 400 VALIDATION_ERROR
//   3. Happy path with Stripe subscription → cancel + customer.del +
//      auth.admin.deleteUser invoked in order; response deleted=true
//   4. Happy path without Stripe → auth.admin.deleteUser still runs
//   5. Stripe cancel failure does NOT block auth.admin.deleteUser
//   6. auth.admin.deleteUser failure → 500 SERVER_ERROR

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ──────────────────────────────────────────────────────
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(),
  createAdminClient: vi.fn(),
}));
vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(),
  getCustomerId: vi.fn((x: unknown) => (typeof x === 'string' ? x : null)),
}));
vi.mock('@/lib/api-helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-helpers')>();
  return {
    ...actual,
    applyRateLimit: vi.fn(() => Promise.resolve(null)),
    requireAuth: vi.fn(),
  };
});
vi.mock('@/lib/subscription-events', () => ({
  logSubscriptionEvent: vi.fn(() => Promise.resolve()),
}));
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

import { DELETE } from '@/app/api/auth/delete-account/route';
import { createAdminClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import { requireAuth } from '@/lib/api-helpers';

const mockCreateAdmin = vi.mocked(createAdminClient);
const mockGetStripe = vi.mocked(getStripe);
const mockRequireAuth = vi.mocked(requireAuth);

function makeReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/delete-account', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

interface AdminStub {
  calls: string[];
  parent: {
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    subscription_status: string | null;
  } | null;
  deleteUserResult: { error: Error | null };
}

function makeAdminClient(stub: AdminStub) {
  return {
    from(_table: string) {
      return {
        select(_cols: string) {
          return {
            eq(_c: string, _v: unknown) {
              return {
                single: () =>
                  Promise.resolve({ data: stub.parent, error: null }),
              };
            },
          };
        },
      };
    },
    auth: {
      admin: {
        deleteUser: vi.fn(async () => {
          stub.calls.push('deleteUser');
          return stub.deleteUserResult;
        }),
      },
    },
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('DELETE /api/auth/delete-account — PAY-MED-003 (B)', () => {
  it('returns 401 when unauthenticated', async () => {
    mockRequireAuth.mockResolvedValueOnce({
      success: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response: new Response(JSON.stringify({ error: 'no' }), { status: 401 }) as any,
    });

    const res = await DELETE(makeReq({ confirm: 'DELETE' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 VALIDATION_ERROR when confirm is missing', async () => {
    mockRequireAuth.mockResolvedValue({
      success: true,
      user: {
        id: 'parent-1',
        email: 'a@b.com',
        tier: 'free',
        isAdmin: false,
        isDemo: false,
        hasCoppaConsent: true,
      },
    });

    const res = await DELETE(makeReq({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('VALIDATION_ERROR');
  });

  it('happy path: cancels subscription + deletes customer + auth user', async () => {
    mockRequireAuth.mockResolvedValue({
      success: true,
      user: {
        id: 'parent-1',
        email: 'a@b.com',
        tier: 'plus',
        isAdmin: false,
        isDemo: false,
        hasCoppaConsent: true,
      },
    });

    const stripeCalls: string[] = [];
    const subscriptionsCancel = vi.fn(async () => {
      stripeCalls.push('subscriptions.cancel');
      return {};
    });
    const customersDel = vi.fn(async () => {
      stripeCalls.push('customers.del');
      return {};
    });
    mockGetStripe.mockReturnValue({
      subscriptions: { cancel: subscriptionsCancel },
      customers: { del: customersDel },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const stub: AdminStub = {
      calls: [],
      parent: {
        stripe_customer_id: 'cus_123',
        stripe_subscription_id: 'sub_123',
        subscription_status: 'active',
      },
      deleteUserResult: { error: null },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreateAdmin.mockReturnValue(makeAdminClient(stub) as any);

    const res = await DELETE(makeReq({ confirm: 'DELETE' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.deleted).toBe(true);
    expect(json.data.subscriptionCancelled).toBe(true);
    expect(json.data.customerDeleted).toBe(true);
    expect(stripeCalls).toEqual(['subscriptions.cancel', 'customers.del']);
    expect(stub.calls).toContain('deleteUser');
  });

  it('still deletes auth user when Stripe subscription cancel fails', async () => {
    mockRequireAuth.mockResolvedValue({
      success: true,
      user: {
        id: 'parent-1',
        email: 'a@b.com',
        tier: 'plus',
        isAdmin: false,
        isDemo: false,
        hasCoppaConsent: true,
      },
    });

    mockGetStripe.mockReturnValue({
      subscriptions: {
        cancel: vi.fn(() => Promise.reject(new Error('stripe 5xx'))),
      },
      customers: { del: vi.fn(() => Promise.resolve({})) },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const stub: AdminStub = {
      calls: [],
      parent: {
        stripe_customer_id: 'cus_123',
        stripe_subscription_id: 'sub_123',
        subscription_status: 'active',
      },
      deleteUserResult: { error: null },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreateAdmin.mockReturnValue(makeAdminClient(stub) as any);

    const res = await DELETE(makeReq({ confirm: 'DELETE' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.deleted).toBe(true);
    expect(json.data.subscriptionCancelled).toBe(false);
    expect(stub.calls).toContain('deleteUser');
  });

  it('returns 500 when auth.admin.deleteUser fails', async () => {
    mockRequireAuth.mockResolvedValue({
      success: true,
      user: {
        id: 'parent-1',
        email: 'a@b.com',
        tier: 'free',
        isAdmin: false,
        isDemo: false,
        hasCoppaConsent: true,
      },
    });

    mockGetStripe.mockReturnValue(null);

    const stub: AdminStub = {
      calls: [],
      parent: {
        stripe_customer_id: null,
        stripe_subscription_id: null,
        subscription_status: null,
      },
      deleteUserResult: { error: new Error('supabase auth 5xx') },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreateAdmin.mockReturnValue(makeAdminClient(stub) as any);

    const res = await DELETE(makeReq({ confirm: 'DELETE' }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.code).toBe('SERVER_ERROR');
  });

  it('skips Stripe calls for demo users but still runs auth deletion', async () => {
    mockRequireAuth.mockResolvedValue({
      success: true,
      user: {
        id: 'demo-1',
        email: '',
        tier: 'free',
        isAdmin: false,
        isDemo: true,
        hasCoppaConsent: true,
      },
    });

    const subscriptionsCancel = vi.fn();
    const customersDel = vi.fn();
    mockGetStripe.mockReturnValue({
      subscriptions: { cancel: subscriptionsCancel },
      customers: { del: customersDel },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const stub: AdminStub = {
      calls: [],
      parent: null,
      deleteUserResult: { error: null },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreateAdmin.mockReturnValue(makeAdminClient(stub) as any);

    const res = await DELETE(makeReq({ confirm: 'DELETE' }));
    expect(res.status).toBe(200);
    expect(subscriptionsCancel).not.toHaveBeenCalled();
    expect(customersDel).not.toHaveBeenCalled();
    expect(stub.calls).toContain('deleteUser');
  });
});
