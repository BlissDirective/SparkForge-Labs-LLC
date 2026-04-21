// ════════════════════════════════════════════════════════════════
// T20 PERF-HIGH-001 — useGame() bundle contract
// ════════════════════════════════════════════════════════════════
// The useGame() hook returns a shallow-stable bundle of the 6
// fields games actually need (score + 5 actions). Tests verify:
//   1. The returned shape includes exactly those keys.
//   2. Calling the exposed actions mutates the store correctly.
// Re-render-stability under useShallow is enforced at the Zustand
// level — we do not reach into React rendering here.

import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useGame, useGameStore } from '@/stores/gameStore';

beforeEach(() => {
  useGameStore.getState().resetGame();
});

afterEach(() => {
  useGameStore.getState().resetGame();
});

describe('T20 — useGame() bundle', () => {
  it('exposes score + 5 action methods', () => {
    const { result } = renderHook(() => useGame());
    expect(Object.keys(result.current).sort()).toEqual(
      [
        'advanceRound',
        'completeGame',
        'score',
        'setMaxScore',
        'startGame',
        'updateScore',
      ].sort(),
    );
    expect(typeof result.current.updateScore).toBe('function');
    expect(typeof result.current.startGame).toBe('function');
  });

  it('updateScore mutates the underlying store', () => {
    const { result } = renderHook(() => useGame());
    act(() => {
      result.current.startGame('ai-spy', 5);
      result.current.updateScore(20);
    });
    expect(useGameStore.getState().score).toBe(20);
  });

  it('setMaxScore persists to the store', () => {
    const { result } = renderHook(() => useGame());
    act(() => {
      result.current.startGame('ai-spy', 5);
      result.current.setMaxScore(100);
    });
    expect(useGameStore.getState().maxScore).toBe(100);
  });

  it('completeGame flips isComplete', () => {
    const { result } = renderHook(() => useGame());
    act(() => {
      result.current.startGame('ai-spy', 3);
      result.current.completeGame();
    });
    expect(useGameStore.getState().isComplete).toBe(true);
  });
});
