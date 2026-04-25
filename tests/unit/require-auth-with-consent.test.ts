// ════════════════════════════════════════════════════
// Unit tests — AUTH-MED-002 (B) requireAuthWithConsent
// ════════════════════════════════════════════════════
// Verifies:
//   1. Unauthenticated request → 401 AUTH_REQUIRED
//   2. Authed parent w/ coppa_consent_at=null → 403 CONSENT_REQUIRED
//   3. Authed parent w/ coppa_consent_at set → passes through
//   4. Admin with coppa_consent_at=null → passes through (admin bypass)
//   5. Demo (anonymous) user → passes through (demo bypass)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ─────────────────────────────────────────
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(),
  createAdminClient: vi.fn(),
}));

import {
  requireAuthWithConsent,
  ERROR_CODES,
} from '@/lib/api-helpers';
import { createServerSupabase } from '@/lib/supabase/server';

const mockCreateServer = vi.mocked(createServerSupabase);

interface MockUser {
  id: string;
  email?: string;
  is_anonymous?: boolean;
  created_at?: string;
}

interface MockParent {
  subscription_tier: string;
  is_admin: boolean;
  coppa_consent_at: string | null;
}

function makeSupabaseClient(user: MockUser | null, parent: MockParent | null) {
  return {
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user },
          error: user ? null : new Error('no user'),
        }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from(_table: string) {
      return {
        select(_cols: string) {
          return {
            eq(_c: string, _v: unknown) {
              return {
                single: () => Promise.resolve({ data: parent, error: null }),
              };
            },
          };
        },
      };
    },
  };
}

function makeReq(): NextRequest {
  return new NextRequest('http://localhost/api/children', { method: 'POST' });
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('requireAuthWithConsent — AUTH-MED-002 (B)', () => {
  it('returns 401 AUTH_REQUIRED when unauthenticated', async () => {
    mockCreateServer.mockResolvedValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeSupabaseClient(null, null) as any,
    );

    const result = await requireAuthWithConsent(makeReq());
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.response.status).toBe(401);
    const body = await result.response.json();
    expect(body.code).toBe(ERROR_CODES.AUTH_REQUIRED);
  });

  it('returns 403 CONSENT_REQUIRED when parent has no coppa_consent_at', async () => {
    mockCreateServer.mockResolvedValue(
      makeSupabaseClient(
        { id: 'parent-1', email: 'a@b.com', is_anonymous: false },
        { subscription_tier: 'free', is_admin: false, coppa_consent_at: null },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any,
    );

    const result = await requireAuthWithConsent(makeReq());
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.response.status).toBe(403);
    const body = await result.response.json();
    expect(body.code).toBe(ERROR_CODES.CONSENT_REQUIRED);
  });

  it('passes through when parent has coppa_consent_at set', async () => {
    mockCreateServer.mockResolvedValue(
      makeSupabaseClient(
        { id: 'parent-2', email: 'a@b.com', is_anonymous: false },
        {
          subscription_tier: 'plus',
          is_admin: false,
          coppa_consent_at: '2026-01-01T00:00:00Z',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any,
    );

    const result = await requireAuthWithConsent(makeReq());
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.user.id).toBe('parent-2');
    expect(result.user.hasCoppaConsent).toBe(true);
    expect(result.user.tier).toBe('plus');
  });

  it('passes through for admin even without coppa_consent_at', async () => {
    mockCreateServer.mockResolvedValue(
      makeSupabaseClient(
        { id: 'admin-1', email: 'admin@b.com', is_anonymous: false },
        { subscription_tier: 'forge', is_admin: true, coppa_consent_at: null },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any,
    );

    const result = await requireAuthWithConsent(makeReq());
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.user.isAdmin).toBe(true);
    expect(result.user.hasCoppaConsent).toBe(true);
  });

  it('passes through for demo (anonymous) user', async () => {
    // Demo session created 10 min ago — within the 1-hour cap
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    mockCreateServer.mockResolvedValue(
      makeSupabaseClient(
        {
          id: 'demo-1',
          email: '',
          is_anonymous: true,
          created_at: tenMinAgo,
        },
        null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any,
    );

    const result = await requireAuthWithConsent(makeReq());
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.user.isDemo).toBe(true);
    expect(result.user.hasCoppaConsent).toBe(true);
  });
});
