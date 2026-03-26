/**
 * MSW Mock Handlers — SparkForge API
 *
 * Basic mock handlers for all 24 API endpoints.
 * Used by Vitest integration tests and Playwright E2E tests.
 *
 * Usage:
 *   import { handlers } from '@/mocks/handlers';
 *   const server = setupServer(...handlers);
 */

import { http, HttpResponse } from 'msw';

const API = 'http://localhost:3000/api';

// ── Mock Data ───────────────────────────────────────────────────────

const mockParent = {
  id: 'parent-001',
  email: 'test@sparkforge.dev',
  fullName: 'Test Parent',
  subscriptionTier: 'free' as const,
  subscriptionStatus: 'active' as const,
  onboardingComplete: true,
  isAdmin: false,
  createdAt: '2026-01-01T00:00:00Z',
};

const mockChild = {
  id: 'child-001',
  parent_id: 'parent-001',
  display_name: 'Spark Kid',
  age_band: 'B' as const,
  avatar_config: { color: '#00BBFF', shape: 'circle' },
  xp: 250,
  level: 3,
  title: 'Circuit Starter',
  coins: 15,
  streak_count: 5,
  streak_shield: false,
  daily_time_limit_minutes: 60,
  prompt_lab_enabled: true,
  created_at: '2026-01-15T00:00:00Z',
};

const mockSession = {
  accessToken: 'mock-jwt-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: Date.now() + 3600_000,
};

const mockLabProgress = Array.from({ length: 10 }, (_, i) => ({
  labId: i + 1,
  totalItems: 3 + (i % 2),
  completedItems: Math.min(i, 3 + (i % 2)),
  percent: Math.round((Math.min(i, 3 + (i % 2)) / (3 + (i % 2))) * 100),
}));

// ── Handlers ────────────────────────────────────────────────────────

export const handlers = [
  // ── Health ──
  http.get(`${API}/health`, () =>
    HttpResponse.json({
      status: 'ok',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      database: 'connected',
      responseTimeMs: 12,
      environment: 'test',
    }),
  ),

  // ── Auth ──
  http.post(`${API}/auth/signup`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    if (!body.email || !body.password) {
      return HttpResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    return HttpResponse.json({ userId: 'parent-new', emailSent: true }, { status: 201 });
  }),

  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    if (body.email === 'test@sparkforge.dev' && body.password === 'password123') {
      return HttpResponse.json({
        user: { id: mockParent.id, email: mockParent.email },
        session: mockSession,
      });
    }
    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),

  http.post(`${API}/auth/logout`, () =>
    HttpResponse.json({ signedOut: true }),
  ),

  http.get(`${API}/auth/me`, () =>
    HttpResponse.json(mockParent),
  ),

  http.post(`${API}/auth/demo`, () =>
    HttpResponse.json({
      demoId: 'demo-session-001',
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      message: 'Demo session started',
    }),
  ),

  // ── Children ──
  http.get(`${API}/children`, () =>
    HttpResponse.json([mockChild]),
  ),

  http.post(`${API}/children`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { ...mockChild, id: 'child-new', display_name: body.displayName || 'New Kid' },
      { status: 201 },
    );
  }),

  http.get(`${API}/children/:childId`, ({ params }) =>
    HttpResponse.json({ ...mockChild, id: params.childId }),
  ),

  http.patch(`${API}/children/:childId`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...mockChild, id: params.childId, ...body });
  }),

  http.delete(`${API}/children/:childId`, () =>
    HttpResponse.json({ deleted: true }),
  ),

  // ── Progress ──
  http.get(`${API}/progress`, ({ request }) => {
    const url = new URL(request.url);
    const childId = url.searchParams.get('childId');
    if (!childId) return HttpResponse.json({ error: 'childId required' }, { status: 400 });
    return HttpResponse.json([
      { id: 'prog-001', childId, contentId: 'content-001', score: 85, timeSpentSeconds: 120 },
    ]);
  }),

  http.post(`${API}/progress`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { id: 'prog-new', ...body, createdAt: new Date().toISOString() },
      { status: 201 },
    );
  }),

  http.get(`${API}/progress/world`, ({ request }) => {
    const url = new URL(request.url);
    const world = url.searchParams.get('world');
    return HttpResponse.json({
      labId: Number(world) || 1,
      totalItems: 4,
      completedItems: 2,
      percent: 50,
    });
  }),

  http.get(`${API}/progress/all-labs`, () =>
    HttpResponse.json(mockLabProgress),
  ),

  // ── Content ──
  http.get(`${API}/content`, () =>
    HttpResponse.json({
      success: true,
      data: [
        { id: 'content-001', slug: 'ai-spy', title: 'AI Spy', world: 1, type: 'game', ageBand: 'B', published: true },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    }),
  ),

  http.get(`${API}/content/:slug`, ({ params }) =>
    HttpResponse.json({
      id: 'content-001',
      slug: params.slug,
      title: 'Mock Content',
      world: 1,
      type: 'game',
      ageBand: 'B',
      published: true,
      body: '# Mock content body',
    }),
  ),

  // ── Sessions ──
  http.post(`${API}/sessions`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    if (body.action === 'start') {
      return HttpResponse.json(
        { id: 'session-001', childId: body.childId, startedAt: new Date().toISOString() },
        { status: 201 },
      );
    }
    return HttpResponse.json({
      id: body.sessionId,
      endedAt: new Date().toISOString(),
      durationSeconds: 300,
    });
  }),

  // ── Gamification ──
  http.get(`${API}/gamification/badges`, () =>
    HttpResponse.json([
      { id: 'badge-001', name: 'First Steps', category: 'exploration', earned: true, earnedAt: '2026-02-01T00:00:00Z' },
      { id: 'badge-002', name: 'Code Warrior', category: 'coding', earned: false, earnedAt: null },
    ]),
  ),

  http.post(`${API}/gamification/badges`, () =>
    HttpResponse.json({ newBadges: [], totalEarned: 1 }),
  ),

  http.post(`${API}/gamification/streak`, () =>
    HttpResponse.json({
      streakCount: 6,
      streakShield: false,
      shieldUsed: false,
      recovered: false,
      isNew: false,
    }),
  ),

  http.post(`${API}/gamification/xp`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const amount = (body.amount as number) || 10;
    return HttpResponse.json({
      xpAwarded: amount,
      multiplier: 1,
      newXP: 260,
      newLevel: 3,
      newTitle: 'Circuit Starter',
      levelProgress: 0.6,
      leveledUp: false,
      coinsEarned: 0,
    });
  }),

  // ── AI / Prompt Lab ──
  http.post(`${API}/ai/prompt-lab`, () =>
    HttpResponse.json({
      reply: 'That\'s a great question! AI learns by looking at lots of examples, kind of like how you learn to recognize animals by seeing many pictures of them.',
      promptsRemaining: 9,
    }),
  ),

  // ── Stripe ──
  http.post(`${API}/stripe/checkout`, () =>
    HttpResponse.json({ url: 'https://checkout.stripe.com/test_session' }),
  ),

  http.post(`${API}/stripe/portal`, () =>
    HttpResponse.json({ url: 'https://billing.stripe.com/test_portal' }),
  ),

  http.post(`${API}/stripe/webhook`, () =>
    HttpResponse.json({ received: true }),
  ),

  // ── Agent (Admin) ──
  http.post(`${API}/agent/run`, () =>
    HttpResponse.json({ status: 'completed', itemsGenerated: 3 }),
  ),

  http.get(`${API}/agent/review`, () =>
    HttpResponse.json({
      items: [],
      total: 0,
      stats: { pending: 0, flagged: 0, approved: 5, rejected: 1 },
    }),
  ),

  http.post(`${API}/agent/review`, () =>
    HttpResponse.json({
      results: [],
      summary: { approved: 0, rejected: 0 },
    }),
  ),

  http.get(`${API}/agent/schedule`, () =>
    HttpResponse.json({ success: true, data: { itemsGenerated: 0 } }),
  ),
];
