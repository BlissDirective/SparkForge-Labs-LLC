// ════════════════════════════════════════════════════════════════
// Unit tests — UX-MED-002 (T10a) gameStore togglePause
// ════════════════════════════════════════════════════════════════

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  useGameStore,
  clearAllGameStores,
} from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';

beforeEach(() => {
  useChildStore.setState({ activeChildId: 'child-a' });
});

afterEach(() => {
  clearAllGameStores();
  useChildStore.setState({ activeChildId: null });
});

describe('gameStore.togglePause — UX-MED-002 (T10a)', () => {
  it('defaults to not paused', () => {
    expect(useGameStore.getState().isPaused).toBe(false);
  });

  it('togglePause flips isPaused', () => {
    const toggle = useGameStore.getState().togglePause;
    toggle();
    expect(useGameStore.getState().isPaused).toBe(true);
    toggle();
    expect(useGameStore.getState().isPaused).toBe(false);
  });

  it('pauseGame + resumeGame set absolute values', () => {
    const { pauseGame, resumeGame } = useGameStore.getState();
    pauseGame();
    expect(useGameStore.getState().isPaused).toBe(true);
    pauseGame();
    expect(useGameStore.getState().isPaused).toBe(true); // idempotent
    resumeGame();
    expect(useGameStore.getState().isPaused).toBe(false);
  });

  it('startGame always starts unpaused regardless of prior state', () => {
    useGameStore.getState().pauseGame();
    expect(useGameStore.getState().isPaused).toBe(true);

    useGameStore.getState().startGame('ai-spy', 5);
    expect(useGameStore.getState().isPaused).toBe(false);
  });

  it('tick is a no-op while paused', () => {
    useGameStore.getState().startGame('ai-spy', 5);
    const before = useGameStore.getState().timeElapsed;
    useGameStore.getState().tick();
    expect(useGameStore.getState().timeElapsed).toBe(before + 1);

    useGameStore.getState().pauseGame();
    useGameStore.getState().tick();
    expect(useGameStore.getState().timeElapsed).toBe(before + 1); // unchanged

    useGameStore.getState().resumeGame();
    useGameStore.getState().tick();
    expect(useGameStore.getState().timeElapsed).toBe(before + 2);
  });

  it('resetGame clears isPaused', () => {
    useGameStore.getState().pauseGame();
    useGameStore.getState().resetGame();
    expect(useGameStore.getState().isPaused).toBe(false);
  });
});
