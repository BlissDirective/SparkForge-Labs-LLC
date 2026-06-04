// ════════════════════════════════════════════════════
// Demo session helpers
// Final-Audit 04-15-2026 finding AUTH-CRIT-002 (Option B)
//
// The previous implementation stored the demo session in localStorage with
// a client-computed expiry. An attacker could bypass auth by setting the
// `sparkforge-demo-active` cookie to `1` directly.
//
// This file is now a set of pure helpers. The source of truth for demo
// state is the Supabase authenticated user (user.is_anonymous + user
// metadata). AuthProvider hydrates the authStore from that user on boot.
//
// STATE-MED-002 (Phase 2): split state between localStorage and store is
// also resolved — no localStorage persistence remains for demo state.
// ════════════════════════════════════════════════════

const DEMO_DURATION_MS = 60 * 60 * 1000; // 1 hour

export interface DemoSession {
  id: string;
  startedAt: number;
  expiresAt: number;
  // D3D-1: Desktop-only platform — no tablet/mobile support
  deviceType: 'desktop';
}

/**
 * Derive a DemoSession from a Supabase anonymous user. Returns null if
 * the user isn't anonymous or has no usable created_at.
 *
 * Audit P2/D — `startedAt` is now derived ONLY from `user.created_at`,
 * the cryptographically-bound auth-row timestamp. The previous
 * implementation preferred `user_metadata.demo_started_at` (set at
 * signInAnonymously() time) so that replication lag wouldn't shift the
 * timer; that came at the cost of letting a demo user extend their
 * session by calling `supabase.auth.updateUser({ data: { demo_started_at:
 * ... } })`. The replication-lag concern is a UX glitch worth a few
 * seconds of timer drift; the spoofing concern is a privilege boundary.
 * Server-side `requireAuth()` already trusts `created_at` — this brings
 * the client display in line with that authoritative clock.
 */
export function demoSessionFromUser(user: {
  id: string;
  is_anonymous?: boolean;
  created_at?: string;
  user_metadata?: { demo_started_at?: string } | null;
} | null): DemoSession | null {
  if (!user || !user.is_anonymous) return null;

  // Prefer the explicit demo start stamp recorded in user metadata; fall
  // back to account creation time, then to now. The demo timer should be
  // anchored to when the demo actually started, not when the anon account
  // happened to be created.
  const metaStart = user.user_metadata?.demo_started_at;
  const startedAt =
    metaStart && !Number.isNaN(Date.parse(metaStart))
      ? Date.parse(metaStart)
      : user.created_at && !Number.isNaN(Date.parse(user.created_at))
        ? Date.parse(user.created_at)
        : Date.now();

  return {
    id: user.id,
    startedAt,
    expiresAt: startedAt + DEMO_DURATION_MS,
    deviceType: 'desktop',
  };
}

export function getDemoTimeRemaining(session: DemoSession | null): number {
  if (!session) return 0;
  return Math.max(0, session.expiresAt - Date.now());
}

export function isDemoExpired(session: DemoSession | null): boolean {
  if (!session) return true;
  return Date.now() >= session.expiresAt;
}

export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export { DEMO_DURATION_MS };
