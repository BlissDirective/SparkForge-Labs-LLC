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
 * the user isn't anonymous or is missing required metadata.
 *
 * Handles two cases for `startedAt`:
 *   1. Preferred: user_metadata.demo_started_at (set when /api/auth/demo
 *      runs signInAnonymously with options.data). Locks in the creation
 *      time even if Supabase propagates created_at slowly.
 *   2. Fallback: user.created_at from the auth row.
 */
export function demoSessionFromUser(user: {
  id: string;
  is_anonymous?: boolean;
  created_at?: string;
  user_metadata?: Record<string, unknown>;
} | null): DemoSession | null {
  if (!user || !user.is_anonymous) return null;

  const metaStart = user.user_metadata?.demo_started_at;
  const startedAt =
    typeof metaStart === 'string' && !Number.isNaN(Date.parse(metaStart))
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
