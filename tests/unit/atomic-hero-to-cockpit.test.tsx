// ════════════════════════════════════════════════════════════════
// P2 §6.6 — Atomic hero→cockpit handoff with paint gate
// ════════════════════════════════════════════════════════════════
// Verifies:
//   1. useAtomicHeroToCockpit fires completeHero() exactly once when
//      all 3 conditions meet (heroPhase='complete' + cockpitReady=true
//      + activeScene='hero').
//   2. The call is double-rAF deferred — completeHero only runs after
//      TWO animation frames so the cockpit's first paint can commit
//      before the hero layer drops.
//   3. Cleanup cancels pending rAFs if the component unmounts before
//      both frames fire.
//   4. Fast-machine order-swap: whichever flag flips second still
//      triggers the sequence.

import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAtomicHeroToCockpit } from '@/hooks/useIsFullyReady';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useSceneStore } from '@/stores/sceneStore';

type Frame = () => void;

let rafQueue: Array<{ fn: Frame; id: number }> = [];
let cancelledIds = new Set<number>();
let nextRafId = 1;
let originalCompleteHero: (() => void) | null = null;
let completeHeroMock: ReturnType<typeof vi.fn>;

function drainRaf(times = 1) {
  for (let i = 0; i < times; i++) {
    const current = rafQueue;
    rafQueue = [];
    current.forEach(({ fn, id }) => {
      if (!cancelledIds.has(id)) fn();
    });
  }
}

beforeEach(() => {
  rafQueue = [];
  cancelledIds = new Set();
  nextRafId = 1;
  vi.stubGlobal('requestAnimationFrame', (fn: Frame) => {
    const id = nextRafId++;
    rafQueue.push({ fn, id });
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    cancelledIds.add(id);
  });
  // Replace the store's completeHero action with a mock that persists
  // across setState calls (Zustand shallow-merges, so the mock survives).
  originalCompleteHero = useSceneStore.getState().completeHero;
  completeHeroMock = vi.fn();
  useSceneStore.setState({
    activeScene: 'hero',
    isTransitioning: false,
    completeHero: completeHeroMock,
  });
  useCockpitStore.setState({ heroPhase: 'idle', cockpitReady: false });
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalCompleteHero) {
    useSceneStore.setState({
      activeScene: 'cockpit',
      isTransitioning: false,
      completeHero: originalCompleteHero,
    });
  }
  useCockpitStore.setState({ heroPhase: 'idle', cockpitReady: false });
});

describe('P2 §6.6 — useAtomicHeroToCockpit paint gate', () => {
  it('does not fire completeHero before both flags are true', () => {
    renderHook(() => useAtomicHeroToCockpit());
    // Initially: heroPhase=idle, cockpitReady=false → no call
    drainRaf(3);
    expect(completeHeroMock).not.toHaveBeenCalled();
  });

  it('defers completeHero across TWO animation frames (paint gate)', async () => {
    renderHook(() => useAtomicHeroToCockpit());

    // Flip both flags → effect schedules the first rAF.
    act(() => {
      useCockpitStore.setState({ heroPhase: 'complete', cockpitReady: true });
    });

    // After just ONE rAF flush — completeHero NOT yet called (still
    // waiting for the paint-commit frame).
    drainRaf(1);
    expect(completeHeroMock).not.toHaveBeenCalled();

    // After the SECOND rAF — commit landed, completeHero fires.
    drainRaf(1);
    expect(completeHeroMock).toHaveBeenCalledTimes(1);
  });

  it('fires on order-swap: cockpitReady first, then heroPhase', async () => {
    renderHook(() => useAtomicHeroToCockpit());

    act(() => {
      useCockpitStore.setState({ cockpitReady: true });
    });
    drainRaf(2);
    expect(completeHeroMock).not.toHaveBeenCalled();

    act(() => {
      useCockpitStore.setState({ heroPhase: 'complete' });
    });
    drainRaf(2);
    expect(completeHeroMock).toHaveBeenCalledTimes(1);
  });

  it('does not re-fire once activeScene has left hero', async () => {
    renderHook(() => useAtomicHeroToCockpit());

    act(() => {
      useCockpitStore.setState({ heroPhase: 'complete', cockpitReady: true });
    });
    drainRaf(2);
    expect(completeHeroMock).toHaveBeenCalledTimes(1);

    // Simulate a second hero cycle — but this time scene is already
    // cockpit, so gate must NOT fire again.
    act(() => {
      useSceneStore.setState({ activeScene: 'cockpit' });
      // Re-set the flags; with activeScene=cockpit the effect gate
      // is closed.
      useCockpitStore.setState({ heroPhase: 'idle', cockpitReady: false });
      useCockpitStore.setState({ heroPhase: 'complete', cockpitReady: true });
    });
    drainRaf(5);
    expect(completeHeroMock).toHaveBeenCalledTimes(1);
  });

  it('cleanup cancels pending rAFs on unmount', () => {
    const completeHeroMock = vi.spyOn(useSceneStore.getState(), 'completeHero');
    const { unmount: unmountHook } = renderHook(() => useAtomicHeroToCockpit());

    act(() => {
      useCockpitStore.setState({ heroPhase: 'complete', cockpitReady: true });
    });
    // One rAF has been scheduled but not yet flushed.
    expect(rafQueue.length).toBe(1);

    unmountHook();
    // After unmount + all rAFs drain, completeHero MUST NOT have fired.
    drainRaf(3);
    expect(completeHeroMock).not.toHaveBeenCalled();
  });
});
