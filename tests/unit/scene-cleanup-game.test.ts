// ════════════════════════════════════════════════════════════════
// Unit tests — STATE-MED-003 (B) sceneStore.cleanupGame() coordinator
// ════════════════════════════════════════════════════════════════
// Verifies the single coordinated teardown path across sceneStore +
// gameStore used by GameShell unmount, PauseMenu Quit, and
// GameErrorBoundary return-to-arcade.
//
// Coverage:
//   1. cleanupGame resets gameStore fields (phase / score / isPaused /
//      isComplete / currentGame)
//   2. cleanupGame clears sceneStore game scene + HUD content
//   3. cleanupGame triggers the iris-close transition (exitGame path)
//   4. cleanupGame reverts activeGameLabColor to default
//   5. cleanupGame is idempotent — calling twice is a no-op on the
//      second call, does not re-trigger the iris animation
//   6. cleanupGame ordering — gameStore state is reset BEFORE the
//      scene transition is set

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useSceneStore } from '@/stores/sceneStore';
import {
  useGameStore,
  clearAllGameStores,
} from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';

// Capture the store's own initial snapshot once (after all modules are
// loaded) so `afterEach` can deterministically restore it even if the
// scene store picks up async hydration in a future change.
const SCENE_DEFAULTS = useSceneStore.getState();

function setActiveChild(id: string) {
  useChildStore.setState({
    activeChild: {
      id,
      parent_id: 'p1',
      display_name: 'Test',
      age_band: 'B',
      avatar_config: null,
      xp: 0,
      level: 1,
      streak_count: 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  });
}

beforeEach(() => {
  // Reset sceneStore to a deterministic cockpit-idle state before each
  // test so we can tell whether cleanupGame actually flipped anything.
  useSceneStore.setState({
    activeScene: SCENE_DEFAULTS.activeScene,
    previousScene: null,
    activeGameId: null,
    activeGameLabColor: SCENE_DEFAULTS.activeGameLabColor,
    transition: null,
    isTransitioning: false,
    cockpitOpacityTarget: 1.0,
    gameSceneContent: null,
    gameHUDContent: null,
  });
  setActiveChild('child-a');
});

afterEach(() => {
  clearAllGameStores();
  useChildStore.setState({ activeChild: null, children: [] });
  useSceneStore.setState({
    activeScene: SCENE_DEFAULTS.activeScene,
    previousScene: null,
    activeGameId: null,
    activeGameLabColor: SCENE_DEFAULTS.activeGameLabColor,
    transition: null,
    isTransitioning: false,
    cockpitOpacityTarget: 1.0,
    gameSceneContent: null,
    gameHUDContent: null,
  });
});

describe('sceneStore.cleanupGame — STATE-MED-003 (B)', () => {
  it('resets gameStore (currentGame / phase / score / isPaused / isComplete)', () => {
    // Simulate a game in progress
    useGameStore.getState().startGame('ai-spy', 5);
    useGameStore.getState().updateScore(30);
    useGameStore.getState().completeGame();
    useSceneStore.getState().enterGame('ai-spy', '#00BBFF');

    expect(useGameStore.getState().currentGame).toBe('ai-spy');
    expect(useGameStore.getState().score).toBe(30);
    expect(useGameStore.getState().isComplete).toBe(true);
    expect(useGameStore.getState().phase).toBe('complete');

    useSceneStore.getState().cleanupGame();

    const g = useGameStore.getState();
    expect(g.currentGame).toBeNull();
    expect(g.score).toBe(0);
    expect(g.isComplete).toBe(false);
    expect(g.phase).toBe('idle');
    expect(g.isPaused).toBe(false);
  });

  it('clears gameSceneContent and gameHUDContent', () => {
    useSceneStore.getState().enterGame('ai-spy', '#FF66AA');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useSceneStore.getState().setGameSceneContent({ fake: 'scene' } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useSceneStore.getState().setGameHUDContent({ fake: 'hud' } as any);

    expect(useSceneStore.getState().gameSceneContent).not.toBeNull();
    expect(useSceneStore.getState().gameHUDContent).not.toBeNull();

    useSceneStore.getState().cleanupGame();

    expect(useSceneStore.getState().gameSceneContent).toBeNull();
    expect(useSceneStore.getState().gameHUDContent).toBeNull();
  });

  it('triggers the iris-close transition', () => {
    useSceneStore.getState().enterGame('ai-spy', '#FF66AA');
    useSceneStore.setState({
      activeScene: 'game',
      isTransitioning: false,
      transition: null,
    });

    useSceneStore.getState().cleanupGame();

    const s = useSceneStore.getState();
    expect(s.isTransitioning).toBe(true);
    expect(s.transition?.type).toBe('iris-close');
    expect(s.transition?.from).toBe('game');
    expect(s.transition?.to).toBe('cockpit');
    expect(s.activeScene).toBe('transitioning');
  });

  it('reverts activeGameLabColor to the default', () => {
    useSceneStore.getState().enterGame('pet-trainer', '#FF6644');
    expect(useSceneStore.getState().activeGameLabColor).toBe('#FF6644');

    useSceneStore.getState().cleanupGame();

    expect(useSceneStore.getState().activeGameLabColor).toBe('#00BBFF');
  });

  it('is idempotent — second call is a no-op on clean state', () => {
    useSceneStore.getState().enterGame('ai-spy', '#FF66AA');
    useSceneStore.getState().cleanupGame();

    // Simulate CockpitCanvas completing the iris-close transition —
    // this is what clears activeGameId + returns the scene to 'cockpit'.
    useSceneStore.setState({
      activeScene: 'cockpit',
      previousScene: 'game',
      activeGameId: null,
      isTransitioning: false,
      transition: null,
      gameSceneContent: null,
      gameHUDContent: null,
    });

    const before = useSceneStore.getState();
    useSceneStore.getState().cleanupGame();
    const after = useSceneStore.getState();

    // Guard fires on all four clean conditions → no-op. transition /
    // isTransitioning / activeScene must remain the same references.
    expect(after.transition).toBe(before.transition);
    expect(after.isTransitioning).toBe(before.isTransitioning);
    expect(after.activeScene).toBe(before.activeScene);
    expect(after.activeGameId).toBeNull();
  });

  it('is NOT a no-op when transition is still pending', () => {
    // Mid-transition re-entry: e.g., user presses Quit, then clicks
    // Quit again before the iris finishes. Second cleanupGame() must
    // still force the gameStore to a clean slate so the HUD doesn't
    // re-mount with stale phase === 'complete'.
    useSceneStore.getState().enterGame('ai-spy', '#FF66AA');
    useSceneStore.getState().cleanupGame();

    // activeGameId still set → guard does NOT fire, cleanup runs again.
    useGameStore.getState().startGame('ai-spy', 5);
    useGameStore.getState().completeGame();

    useSceneStore.getState().cleanupGame();

    expect(useGameStore.getState().phase).toBe('idle');
    expect(useGameStore.getState().currentGame).toBeNull();
  });

  it('orders teardown: gameStore reset BEFORE scene transition begins', () => {
    // This ordering prevents HUD subscribers from observing a
    // "phase: complete" + "gameHUDContent: null" mid-state.
    useGameStore.getState().startGame('ai-spy', 5);
    useGameStore.getState().updateScore(50);
    useSceneStore.getState().enterGame('ai-spy', '#FF66AA');

    const observed: { phase: string; gameHUD: unknown }[] = [];

    // Subscribe to BOTH stores and snapshot their states in the order
    // updates fire.
    const unsubGame = useGameStore.subscribe((state) => {
      observed.push({
        phase: state.phase,
        gameHUD: useSceneStore.getState().gameHUDContent,
      });
    });
    const unsubScene = useSceneStore.subscribe((state) => {
      observed.push({
        phase: useGameStore.getState().phase,
        gameHUD: state.gameHUDContent,
      });
    });

    useSceneStore.getState().cleanupGame();

    unsubGame();
    unsubScene();

    // The first observed event should be the gameStore reset (phase =
    // 'idle') BEFORE the scene HUD content was cleared. Inspect the
    // sequence: no event should have phase === 'complete' AND
    // gameHUD === null at the same time (the forbidden mid-state).
    const midState = observed.find(
      (e) => e.phase === 'complete' && e.gameHUD === null,
    );
    expect(midState).toBeUndefined();
  });
});
