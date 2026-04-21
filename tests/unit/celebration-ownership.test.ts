// ════════════════════════════════════════════════════════════════
// P2 §3.5 — Celebration state-flow ownership contract
// ════════════════════════════════════════════════════════════════
// After §3.5, celebration state has ONE owner: uiStore.showCelebration.
// cockpitStore no longer carries a ceremonyQueue, and there are no
// enqueue/dequeue actions.
//
// These tests make the new invariants explicit so future refactors
// don't silently reintroduce a second owner.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useUIStore } from '@/stores/uiStore';
import { useCockpitStore } from '@/stores/cockpitStore';

beforeEach(() => {
  useUIStore.getState().dismissCelebration();
});

afterEach(() => {
  useUIStore.getState().dismissCelebration();
});

describe('P2 §3.5 — celebration state ownership', () => {
  it('uiStore.showCelebration is the signal — false by default', () => {
    expect(useUIStore.getState().showCelebration).toBe(false);
    expect(useUIStore.getState().celebrationType).toBeNull();
  });

  it('triggerCelebration sets showCelebration + type + data', () => {
    useUIStore.getState().triggerCelebration('xp-award', { amount: 50 });
    const s = useUIStore.getState();
    expect(s.showCelebration).toBe(true);
    expect(s.celebrationType).toBe('xp-award');
    expect(s.celebrationData).toEqual({ amount: 50 });
  });

  it('dismissCelebration clears everything', () => {
    useUIStore.getState().triggerCelebration('streak', { days: 7 });
    useUIStore.getState().dismissCelebration();
    const s = useUIStore.getState();
    expect(s.showCelebration).toBe(false);
    expect(s.celebrationType).toBeNull();
    expect(s.celebrationData).toBeNull();
  });

  it('dismissCelebration is idempotent (back-to-back safe)', () => {
    useUIStore.getState().triggerCelebration('xp-award');
    useUIStore.getState().dismissCelebration();
    // Second call, nothing to dismiss — MUST NOT throw.
    expect(() => useUIStore.getState().dismissCelebration()).not.toThrow();
    expect(useUIStore.getState().showCelebration).toBe(false);
  });

  it('cockpitStore no longer exposes ceremonyQueue / enqueueCeremony / dequeueCeremony', () => {
    const s = useCockpitStore.getState() as Record<string, unknown>;
    expect(s.ceremonyQueue).toBeUndefined();
    expect(s.enqueueCeremony).toBeUndefined();
    expect(s.dequeueCeremony).toBeUndefined();
  });
});
