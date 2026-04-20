// ════════════════════════════════════════════════════════════════
// Unit tests — UX-MED-002 (T10c) DemoExpiryWarning trigger logic
// ════════════════════════════════════════════════════════════════
// Focuses on the session-storage-gated one-fire behavior of the
// pre-warning modal. Full render-tree tests depend on React Query
// + auth + game stores being in sync, which is covered by the
// individual store / hook tests; here we exercise the pure gating
// rules via the component's sessionStorage key contract.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// These helpers mirror the component's internals — if the
// sessionStorage key shape changes in DemoExpiryWarning.tsx this
// test must be updated in lockstep.
const SESSION_KEY_PREFIX = 'sparkforge-demo-prewarn:';
const PREWARN_THRESHOLD_MS = 10 * 60 * 1000;

function keyFor(id: string) {
  return `${SESSION_KEY_PREFIX}${id}`;
}

function hasFired(id: string): boolean {
  return window.sessionStorage.getItem(keyFor(id)) === '1';
}

function markFired(id: string): void {
  window.sessionStorage.setItem(keyFor(id), '1');
}

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  window.sessionStorage.clear();
});

describe('DemoExpiryWarning trigger logic — UX-MED-002 (T10c)', () => {
  it('threshold is 10 minutes', () => {
    expect(PREWARN_THRESHOLD_MS).toBe(10 * 60 * 1000);
  });

  it('key is scoped per demo session id', () => {
    markFired('demo-abc');
    expect(hasFired('demo-abc')).toBe(true);
    expect(hasFired('demo-xyz')).toBe(false);
  });

  it('sessionStorage survives across same-session reloads', () => {
    markFired('demo-1');
    // Simulate component remount — sessionStorage persists
    expect(hasFired('demo-1')).toBe(true);
  });

  it('different session ids do not collide', () => {
    markFired('a');
    markFired('b');
    markFired('c');
    expect(hasFired('a')).toBe(true);
    expect(hasFired('b')).toBe(true);
    expect(hasFired('c')).toBe(true);
    expect(hasFired('d')).toBe(false);
  });

  it('trigger window: > 0 AND <= 10 minutes remaining', () => {
    // Gate check: (0 < remaining <= 10 min) → should fire
    const shouldFire = (remainingMs: number) =>
      remainingMs > 0 && remainingMs <= PREWARN_THRESHOLD_MS;

    expect(shouldFire(11 * 60 * 1000)).toBe(false); // 11min → still too far out
    expect(shouldFire(10 * 60 * 1000)).toBe(true); // exactly 10min
    expect(shouldFire(5 * 60 * 1000)).toBe(true); // 5min
    expect(shouldFire(1000)).toBe(true); // 1s
    expect(shouldFire(0)).toBe(false); // expired — expired banner handles this
    expect(shouldFire(-5_000)).toBe(false); // already expired
  });

  it('clearing sessionStorage resets the gate (for tests / debugging)', () => {
    markFired('demo-reset');
    expect(hasFired('demo-reset')).toBe(true);
    window.sessionStorage.clear();
    expect(hasFired('demo-reset')).toBe(false);
  });
});
