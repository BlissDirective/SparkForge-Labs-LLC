// ════════════════════════════════════════════════════════════════
// Unit tests — UX-MED-001 (Opt A) gameStore.saveState lifecycle
// ════════════════════════════════════════════════════════════════

import { afterEach, describe, expect, it } from 'vitest';
import {
  useGameStore,
  clearAllGameStores,
} from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';

function withChild(id = 'child-a') {
  useChildStore.setState({ activeChildId: id });
}

afterEach(() => {
  clearAllGameStores();
  useChildStore.setState({ activeChildId: null });
});

describe('gameStore.saveState — UX-MED-001 (A)', () => {
  it('defaults to idle', () => {
    withChild();
    expect(useGameStore.getState().saveState).toBe('idle');
  });

  it('setSaveState transitions through lifecycle', () => {
    withChild();
    const set = useGameStore.getState().setSaveState;

    set('saving');
    expect(useGameStore.getState().saveState).toBe('saving');

    set('saved');
    expect(useGameStore.getState().saveState).toBe('saved');

    set('error');
    expect(useGameStore.getState().saveState).toBe('error');

    set('idle');
    expect(useGameStore.getState().saveState).toBe('idle');
  });

  it('startGame resets saveState to idle', () => {
    withChild();
    useGameStore.getState().setSaveState('error');
    useGameStore.getState().startGame('ai-spy', 5);
    expect(useGameStore.getState().saveState).toBe('idle');
  });

  it('resetGame resets saveState to idle', () => {
    withChild();
    useGameStore.getState().setSaveState('saved');
    useGameStore.getState().resetGame();
    expect(useGameStore.getState().saveState).toBe('idle');
  });

  // NOTE: per-child isolation of saveState is inherited from the
  // gameStore per-child factory already verified in
  // tests/unit/game-store-per-child.test.ts — not duplicated here.
});
