// ════════════════════════════════════════════════════
// Unit tests — /api/gamification/xp server-authoritative flow
// API-HIGH-003 (C)
// ════════════════════════════════════════════════════
// Verifies:
//   1. source='game' with known gameId uses GAME_XP_REWARDS value,
//      IGNORING any amount the client sends.
//   2. source='game' with unknown gameId falls back to DEFAULT_GAME_XP.
//   3. source='game' without gameId returns 400.
//   4. source='lesson' (non-game) requires amount; server still trusts
//      amount but clamps to max 500.
//   5. Streak multiplier (2x at streak>=7) is applied server-side.
//   6. Daily cap clamps the award. When already-at-cap the route
//      returns xpAwarded=0 + capped=true without mutating the row.
//   7. First award of the day resets xp_awarded_today counter via
//      xp_reset_date < today heuristic.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ─────────────────────────────────────────
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(),
  createAdminClient: vi.fn(),
}));
vi.mock('@/lib/api-helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-helpers')>();
  return {
    ...actual,
    applyRateLimit: vi.fn(() => Promise.resolve(null)),
    checkDuplicate: vi.fn(() => Promise.resolve(null)),
    requireAuth: vi.fn(() =>
      Promise.resolve({ success: true, user: { id: 'parent-u' } }),
    ),
    verifyChildOwnership: vi.fn(() => Promise.resolve(true)),
  };
});

import { POST } from '@/app/api/gamification/xp/route';
import { createServerSupabase } from '@/lib/supabase/server';
import { DAILY_XP_CAP, getGameXP } from '@/lib/game-xp-config';

const mockCreateServer = vi.mocked(createServerSupabase);

interface ChildRow {
  xp: number;
  level: number;
  streak_count: number;
  spark_coins: number;
  xp_awarded_today: number;
  xp_reset_date: string | null;
}

interface UpdateCall {
  table: string;
  data: Record<string, unknown>;
  filterEq?: { col: string; val: unknown };
}

function makeSupabase(child: ChildRow) {
  const updates: UpdateCall[] = [];
  const client = {
    from(table: string) {
      return {
        select(_cols: string) {
          return {
            eq(_c: string, _v: unknown) {
              return {
                single: () => Promise.resolve({ data: child, error: null }),
              };
            },
          };
        },
        update(data: Record<string, unknown>) {
          const entry: UpdateCall = { table, data };
          updates.push(entry);
          return {
            eq(col: string, val: unknown) {
              entry.filterEq = { col, val };
              return Promise.resolve({ data: null, error: null });
            },
          };
        },
      };
    },
  };
  return { client, updates };
}

function makeReq(body: Record<string, unknown>) {
  return new NextRequest(new URL('http://localhost/api/gamification/xp'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const today = new Date().toISOString().slice(0, 10);

const baseChild: ChildRow = {
  xp: 0,
  level: 1,
  streak_count: 0,
  spark_coins: 0,
  xp_awarded_today: 0,
  xp_reset_date: today,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/gamification/xp — API-HIGH-003 (C)', () => {
  it('source=game uses GAME_XP_REWARDS[gameId]; ignores client amount', async () => {
    const { client, updates } = makeSupabase({ ...baseChild });
    mockCreateServer.mockResolvedValue(client as never);

    // pet-trainer is 30 in GAME_XP_REWARDS
    const res = await POST(
      makeReq({
        childId: '11111111-1111-1111-1111-111111111111',
        source: 'game',
        gameId: 'pet-trainer',
        // client tries to forge a 500 award — must be ignored
        amount: 500,
      }),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.xpAwarded).toBe(30);
    expect(getGameXP('pet-trainer')).toBe(30);

    // Row was updated with the server-computed amount.
    const upd = updates.find((u) => u.table === 'children');
    expect(upd?.data.xp).toBe(30);
    expect(upd?.data.xp_awarded_today).toBe(30);
  });

  it('source=game without gameId returns 400', async () => {
    const { client } = makeSupabase({ ...baseChild });
    mockCreateServer.mockResolvedValue(client as never);

    const res = await POST(
      makeReq({ childId: '11111111-1111-1111-1111-111111111111', source: 'game', amount: 100 }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('MISSING_GAME_ID');
  });

  it('source=game with unknown gameId falls back to DEFAULT_GAME_XP (50)', async () => {
    const { client, updates } = makeSupabase({ ...baseChild });
    mockCreateServer.mockResolvedValue(client as never);

    const res = await POST(
      makeReq({ childId: '11111111-1111-1111-1111-111111111111', source: 'game', gameId: 'not-a-real-game' }),
    );
    const body = await res.json();
    expect(body.data.xpAwarded).toBe(50);
    expect(updates[0]?.data.xp).toBe(50);
  });

  it('source=lesson still honors client amount (capped at 500 by schema)', async () => {
    const { client, updates } = makeSupabase({ ...baseChild });
    mockCreateServer.mockResolvedValue(client as never);

    const res = await POST(
      makeReq({ childId: '11111111-1111-1111-1111-111111111111', source: 'lesson', amount: 200 }),
    );
    const body = await res.json();
    expect(body.data.xpAwarded).toBe(200);
    expect(updates[0]?.data.xp).toBe(200);
  });

  it('applies 2x streak multiplier at streak_count>=7', async () => {
    const { client, updates } = makeSupabase({ ...baseChild, streak_count: 10 });
    mockCreateServer.mockResolvedValue(client as never);

    const res = await POST(
      makeReq({ childId: '11111111-1111-1111-1111-111111111111', source: 'game', gameId: 'pet-trainer' }),
    );
    const body = await res.json();
    expect(body.data.multiplier).toBe(2);
    expect(body.data.xpAwarded).toBe(60); // 30 * 2
    expect(updates[0]?.data.xp).toBe(60);
  });

  it('clamps award to DAILY_XP_CAP remainder', async () => {
    const { client, updates } = makeSupabase({
      ...baseChild,
      xp: DAILY_XP_CAP - 10,
      xp_awarded_today: DAILY_XP_CAP - 10,
    });
    mockCreateServer.mockResolvedValue(client as never);

    // pet-trainer would award 30 normally; only 10 left in budget.
    const res = await POST(
      makeReq({ childId: '11111111-1111-1111-1111-111111111111', source: 'game', gameId: 'pet-trainer' }),
    );
    const body = await res.json();
    expect(body.data.xpAwarded).toBe(10);
    expect(body.data.capped).toBe(true);
    expect(updates[0]?.data.xp_awarded_today).toBe(DAILY_XP_CAP);
  });

  it('returns xpAwarded=0 + capped=true when already at cap, no write', async () => {
    const { client, updates } = makeSupabase({
      ...baseChild,
      xp: DAILY_XP_CAP,
      xp_awarded_today: DAILY_XP_CAP,
    });
    mockCreateServer.mockResolvedValue(client as never);

    const res = await POST(
      makeReq({ childId: '11111111-1111-1111-1111-111111111111', source: 'game', gameId: 'pet-trainer' }),
    );
    const body = await res.json();
    expect(body.data.xpAwarded).toBe(0);
    expect(body.data.capped).toBe(true);
    expect(body.data.reason).toBe('DAILY_XP_CAP_REACHED');
    // No update call fired because there's nothing to credit.
    expect(updates).toHaveLength(0);
  });

  it('treats stale xp_reset_date (yesterday) as alreadyToday=0', async () => {
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);
    const { client, updates } = makeSupabase({
      ...baseChild,
      // xp_awarded_today is stale from yesterday — should be treated as 0
      xp_awarded_today: DAILY_XP_CAP,
      xp_reset_date: yesterday,
    });
    mockCreateServer.mockResolvedValue(client as never);

    const res = await POST(
      makeReq({ childId: '11111111-1111-1111-1111-111111111111', source: 'game', gameId: 'pet-trainer' }),
    );
    const body = await res.json();
    // Not capped — yesterday's counter doesn't count against today.
    expect(body.data.xpAwarded).toBe(30);
    expect(body.data.capped).toBe(false);
    // New counter is set to just today's award, not stacked.
    expect(updates[0]?.data.xp_awarded_today).toBe(30);
    expect(updates[0]?.data.xp_reset_date).toBe(today);
  });
});
