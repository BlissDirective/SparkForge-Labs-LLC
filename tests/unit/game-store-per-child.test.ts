// ════════════════════════════════════════════════════
// Unit tests — per-child game store isolation
// Final-Audit 04-15-2026 finding STATE-CRIT-001 (Option B)
// ════════════════════════════════════════════════════
// Verifies that switching the active child in useChildStore causes
// useGameStore to dispatch to an isolated per-child store, so one
// child's in-progress game state never leaks into another's.
// ════════════════════════════════════════════════════

import { afterEach, describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameStore, clearAllGameStores } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';

afterEach(() => {
  clearAllGameStores();
  // T5c-C4: childStore is UI-only now — just the activeChildId field.
  useChildStore.setState({ activeChildId: null });
});

function setActiveChild(id: string, _name = 'Test Child') {
  useChildStore.setState({ activeChildId: id });
}

describe('gameStore — per-child isolation', () => {
  it('child A and child B have independent game state', () => {
    setActiveChild('child-a', 'Alex');

    const { result, rerender } = renderHook(() => useGameStore());
    act(() => {
      result.current.startGame('ai-spy', 5);
      result.current.updateScore(30);
    });
    expect(result.current.currentGame).toBe('ai-spy');
    expect(result.current.score).toBe(30);

    // Switch child profile
    act(() => {
      setActiveChild('child-b', 'Blair');
    });
    rerender();

    // Child B sees a fresh store — no leaked state from A
    expect(result.current.currentGame).toBeNull();
    expect(result.current.score).toBe(0);
    expect(result.current.phase).toBe('idle');
  });

  it('switching back to child A restores their in-progress game', () => {
    setActiveChild('child-a');
    const { result, rerender } = renderHook(() => useGameStore());
    act(() => {
      result.current.startGame('pet-trainer', 10);
      result.current.updateScore(45);
    });

    act(() => setActiveChild('child-b'));
    rerender();
    expect(result.current.score).toBe(0);

    act(() => setActiveChild('child-a'));
    rerender();
    // Alex's game is still going
    expect(result.current.currentGame).toBe('pet-trainer');
    expect(result.current.score).toBe(45);
  });

  it('static getState() targets the current active child', () => {
    setActiveChild('child-a');
    const { rerender } = renderHook(() => useGameStore());
    act(() => useGameStore.getState().startGame('neural-builder', 3));
    expect(useGameStore.getState().currentGame).toBe('neural-builder');

    act(() => setActiveChild('child-b'));
    rerender();
    expect(useGameStore.getState().currentGame).toBeNull();
  });

  it('resetGame on child A does not affect child B', () => {
    setActiveChild('child-a');
    const { result, rerender } = renderHook(() => useGameStore());
    act(() => {
      result.current.startGame('prompt-lab', 5);
      result.current.updateScore(20);
    });

    // Start a different game for child B
    act(() => setActiveChild('child-b'));
    rerender();
    act(() => {
      result.current.startGame('bias-detective', 7);
      result.current.updateScore(15);
    });
    expect(result.current.score).toBe(15);

    // Reset child B
    act(() => result.current.resetGame());
    expect(result.current.currentGame).toBeNull();

    // Back to A — still untouched
    act(() => setActiveChild('child-a'));
    rerender();
    expect(result.current.currentGame).toBe('prompt-lab');
    expect(result.current.score).toBe(20);
  });
});
