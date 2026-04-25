// ════════════════════════════════════════════════════
// Unit tests — /api/auth/callback email_verified_at stamping
// AUTH-HIGH-004 (4C)
// ════════════════════════════════════════════════════
// Verifies the callback handler:
//   1. Rejects missing `code` param → redirect to /login?error=…
//   2. Rejects a failing exchangeCodeForSession → redirect to /login?error=…
//   3. Stamps `parents.email_verified_at` via admin client on successful
//      exchange, with `.is('email_verified_at', null)` idempotency guard.
//   4. Does NOT re-stamp when the admin update returns an error (banner/gate
//      remain authoritative).
//   5. Sanitizes the `next` param (covered by AUTH-CRIT-003 tests too, but
//      repeated here for regression).
//   6. Proceeds to redirect even if the stamp itself throws (non-blocking).
// ════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ─────────────────────────────────────────
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(),
  createAdminClient: vi.fn(),
}));

import { GET } from '@/app/api/auth/callback/route';
import { createServerSupabase, createAdminClient } from '@/lib/supabase/server';

const mockCreateServer = vi.mocked(createServerSupabase);
const mockCreateAdmin = vi.mocked(createAdminClient);

// Record every .update().eq().is() chain target for assertions.
interface StampCall {
  table: string;
  update: Record<string, unknown>;
  filterEq?: { col: string; val: unknown };
  filterIs?: { col: string; val: unknown };
}

function makeAdminRecorder(opts: { throwOnUpdate?: boolean } = {}) {
  const calls: StampCall[] = [];
  const client = {
    from(table: string) {
      return {
        update(data: Record<string, unknown>) {
          if (opts.throwOnUpdate) throw new Error('synthetic admin failure');
          const entry: StampCall = { table, update: data };
          calls.push(entry);
          return {
            eq(col: string, val: unknown) {
              entry.filterEq = { col, val };
              return {
                is(col2: string, val2: unknown) {
                  entry.filterIs = { col: col2, val: val2 };
                  return Promise.resolve({ error: null });
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

function makeServerClient(opts: { exchangeError?: boolean; userId?: string | null } = {}) {
  const userId = opts.userId === null ? null : (opts.userId ?? 'parent-uuid-42');
  return {
    auth: {
      exchangeCodeForSession: vi.fn(async () => {
        if (opts.exchangeError) return { error: new Error('code_exchange_failed'), data: null };
        if (userId === null) return { error: null, data: { user: null } };
        return { error: null, data: { user: { id: userId, email: 't@example.com' } } };
      }),
    },
  };
}

function makeReq(pathAndQuery: string) {
  return new NextRequest(new URL(pathAndQuery, 'http://localhost:3000'));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/auth/callback — AUTH-HIGH-004 stamping', () => {
  it('redirects to /login?error when `code` is missing', async () => {
    const res = await GET(makeReq('/api/auth/callback'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?error=auth_callback_failed');
  });

  it('redirects to /login?error when exchangeCodeForSession fails', async () => {
    mockCreateServer.mockResolvedValue(makeServerClient({ exchangeError: true }) as never);
    const { client } = makeAdminRecorder();
    mockCreateAdmin.mockReturnValue(client as never);

    const res = await GET(makeReq('/api/auth/callback?code=abc'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?error=auth_callback_failed');
  });

  it('stamps email_verified_at via admin client with .is(null) guard on success', async () => {
    mockCreateServer.mockResolvedValue(makeServerClient() as never);
    const { client, calls } = makeAdminRecorder();
    mockCreateAdmin.mockReturnValue(client as never);

    const res = await GET(makeReq('/api/auth/callback?code=abc&next=/home'));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/home');

    // Idempotency check — the only update must target parents with the
    // .eq(id) + .is(email_verified_at, null) guard.
    expect(calls).toHaveLength(1);
    expect(calls[0].table).toBe('parents');
    expect(calls[0].filterEq).toEqual({ col: 'id', val: 'parent-uuid-42' });
    expect(calls[0].filterIs).toEqual({ col: 'email_verified_at', val: null });
    expect(typeof calls[0].update.email_verified_at).toBe('string');
    // Sanity — stamped value is ISO-formatted
    expect(calls[0].update.email_verified_at).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });

  it('proceeds to redirect even if the admin stamp throws (non-blocking)', async () => {
    mockCreateServer.mockResolvedValue(makeServerClient() as never);
    const { client } = makeAdminRecorder({ throwOnUpdate: true });
    mockCreateAdmin.mockReturnValue(client as never);

    // Silence the console.error emitted by the catch block.
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await GET(makeReq('/api/auth/callback?code=abc&next=/home'));
    errSpy.mockRestore();

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/home');
  });

  it('sanitizes `next` param — rejects protocol-relative URLs', async () => {
    mockCreateServer.mockResolvedValue(makeServerClient() as never);
    const { client } = makeAdminRecorder();
    mockCreateAdmin.mockReturnValue(client as never);

    const res = await GET(makeReq('/api/auth/callback?code=abc&next=//evil.com'));
    expect(res.headers.get('location')).toBe('http://localhost:3000/home');
  });

  it('sanitizes `next` param — rejects query strings and hashes', async () => {
    mockCreateServer.mockResolvedValue(makeServerClient() as never);
    const { client } = makeAdminRecorder();
    mockCreateAdmin.mockReturnValue(client as never);

    const res = await GET(makeReq('/api/auth/callback?code=abc&next=/home?x=1'));
    expect(res.headers.get('location')).toBe('http://localhost:3000/home');
  });
});
