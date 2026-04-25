// ════════════════════════════════════════════════════
// Unit tests — demo-session helpers
// Final-Audit 04-15-2026 finding AUTH-CRIT-002 (Option B)
// ════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  demoSessionFromUser,
  getDemoTimeRemaining,
  isDemoExpired,
  formatTimeRemaining,
  DEMO_DURATION_MS,
} from '@/lib/demo-session';

describe('demoSessionFromUser', () => {
  it('returns null for non-anonymous users', () => {
    expect(
      demoSessionFromUser({ id: 'u1', is_anonymous: false, created_at: new Date().toISOString() }),
    ).toBeNull();
  });

  it('returns null for null input', () => {
    expect(demoSessionFromUser(null)).toBeNull();
  });

  it('derives expiry from user_metadata.demo_started_at when present', () => {
    const started = new Date('2026-04-17T12:00:00Z').getTime();
    const session = demoSessionFromUser({
      id: 'anon-1',
      is_anonymous: true,
      created_at: new Date(started + 60_000).toISOString(), // created_at is later — ignored
      user_metadata: { demo_started_at: new Date(started).toISOString() },
    });
    expect(session).not.toBeNull();
    expect(session!.startedAt).toBe(started);
    expect(session!.expiresAt).toBe(started + DEMO_DURATION_MS);
  });

  it('falls back to created_at if demo_started_at is missing', () => {
    const created = new Date('2026-04-17T14:00:00Z').getTime();
    const session = demoSessionFromUser({
      id: 'anon-2',
      is_anonymous: true,
      created_at: new Date(created).toISOString(),
    });
    expect(session!.startedAt).toBe(created);
  });

  it('uses desktop device type (D3D-1)', () => {
    const session = demoSessionFromUser({
      id: 'anon-3',
      is_anonymous: true,
      created_at: new Date().toISOString(),
    });
    expect(session!.deviceType).toBe('desktop');
  });
});

describe('getDemoTimeRemaining / isDemoExpired', () => {
  it('returns 0 and expired for a null session', () => {
    expect(getDemoTimeRemaining(null)).toBe(0);
    expect(isDemoExpired(null)).toBe(true);
  });

  it('returns positive ms for a fresh session', () => {
    const now = Date.now();
    const session = {
      id: 'x',
      startedAt: now,
      expiresAt: now + DEMO_DURATION_MS,
      deviceType: 'desktop' as const,
    };
    expect(getDemoTimeRemaining(session)).toBeGreaterThan(0);
    expect(isDemoExpired(session)).toBe(false);
  });

  it('returns 0 and expired for a session past its expiry', () => {
    const now = Date.now();
    const session = {
      id: 'x',
      startedAt: now - DEMO_DURATION_MS - 1000,
      expiresAt: now - 1000,
      deviceType: 'desktop' as const,
    };
    expect(getDemoTimeRemaining(session)).toBe(0);
    expect(isDemoExpired(session)).toBe(true);
  });
});

describe('formatTimeRemaining', () => {
  it('formats 1 hour as 60:00', () => {
    expect(formatTimeRemaining(60 * 60 * 1000)).toBe('60:00');
  });

  it('formats 5 minutes 30 seconds as 5:30', () => {
    expect(formatTimeRemaining(5 * 60 * 1000 + 30 * 1000)).toBe('5:30');
  });

  it('pads single-digit seconds', () => {
    expect(formatTimeRemaining(61_000)).toBe('1:01');
  });

  it('clamps negative to 0:00', () => {
    expect(formatTimeRemaining(-1000)).toBe('0:00');
  });
});
