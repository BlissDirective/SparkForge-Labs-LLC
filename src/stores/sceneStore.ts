import { type ReactNode } from 'react';
import { create } from 'zustand';
import { useGameStore } from '@/stores/gameStore';

export type ActiveScene = 'hero' | 'cockpit' | 'spatial' | 'game' | 'transitioning';
export type TransitionType = 'iris-open' | 'iris-close' | 'hero-to-cockpit' | 'cockpit-to-spatial' | 'none';

export interface SceneTransition {
  from: ActiveScene;
  to: ActiveScene;
  type: TransitionType;
  progress: number;      // 0..1
  duration: number;      // ms
  startedAt: number;     // Date.now()
}

interface SceneState {
  activeScene: ActiveScene;
  previousScene: ActiveScene | null;
  activeGameId: string | null;
  activeGameLabColor: string;
  transition: SceneTransition | null;
  isTransitioning: boolean;
  cockpitOpacityTarget: number;  // 1.0 in cockpit, 0.2 during game

  // Game 3D scene content — registered by games, consumed by CockpitCanvas (D3D-B3)
  gameSceneContent: ReactNode | null;
  setGameSceneContent: (content: ReactNode | null) => void;

  // Game HUD 3D content — registered by GameShell, rendered above game scene (Phase 5)
  gameHUDContent: ReactNode | null;
  setGameHUDContent: (content: ReactNode | null) => void;

  enterGame: (gameId: string, labColor: string) => void;
  exitGame: () => void;
  /**
   * STATE-MED-003 (B): Single coordinated teardown across sceneStore,
   * gameStore, and the game-level fields of sceneStore itself. Call
   * from:
   *   - GameShell unmount (after reward pipeline resolves)
   *   - PauseMenu3D "Quit to Labs" action (Phase 2C)
   *   - GameErrorBoundary fallback
   *   - Demo expiry auto-pause (Phase 2C)
   *
   * Order is deliberate — gameStore.resetGame() first so downstream
   * subscribers never observe a half-cleaned state (e.g., HUD gone
   * but phase still 'complete').
   *
   * Idempotent: no-op when activeGameId is already null and we're
   * not in a game scene.
   */
  cleanupGame: () => void;
  enterSpatial: () => void;
  exitSpatial: () => void;
  setHeroActive: () => void;
  completeHero: () => void;
  updateTransitionProgress: (progress: number) => void;
  completeTransition: () => void;
  /**
   * P2 §5.8 — resolves after the active transition (MechanicalIris,
   * wormhole, hero→cockpit crossfade) hits `completeTransition()`.
   * If no transition is in flight, resolves immediately.
   * Consumers gate `router.push` on this so page content swaps
   * after the cockpit iris finishes instead of mid-iris.
   */
  awaitTransitionComplete: () => Promise<void>;
}

const IRIS_DURATION = 600;

// P2 §5.8 — Transition watchers.
// A module-scope Set of resolver callbacks; `awaitTransitionComplete()`
// pushes into it, `completeTransition()` drains it. Module-scope
// (not store state) because subscriber count shouldn't trigger re-renders
// and Zustand's shallow-equal comparisons don't handle Set membership
// changes well.
const transitionWatchers = new Set<() => void>();
function notifyTransitionWatchers() {
  if (transitionWatchers.size === 0) return;
  const snapshot = Array.from(transitionWatchers);
  transitionWatchers.clear();
  for (const resolve of snapshot) resolve();
}

export const useSceneStore = create<SceneState>((set, get) => ({
  activeScene: 'cockpit',
  previousScene: null,
  activeGameId: null,
  activeGameLabColor: '#00BBFF',
  transition: null,
  isTransitioning: false,
  cockpitOpacityTarget: 1.0,

  gameSceneContent: null,
  setGameSceneContent: (content) => set({ gameSceneContent: content }),

  gameHUDContent: null,
  setGameHUDContent: (content) => set({ gameHUDContent: content }),

  enterGame: (gameId, labColor) => {
    set({
      previousScene: get().activeScene,
      activeScene: 'transitioning',
      activeGameId: gameId,
      activeGameLabColor: labColor,
      isTransitioning: true,
      cockpitOpacityTarget: 0.2,
      transition: {
        from: 'cockpit',
        to: 'game',
        type: 'iris-open',
        progress: 0,
        duration: IRIS_DURATION,
        startedAt: Date.now(),
      },
    });
  },

  exitGame: () => {
    set({
      previousScene: 'game',
      activeScene: 'transitioning',
      isTransitioning: true,
      cockpitOpacityTarget: 1.0,
      gameSceneContent: null,
      gameHUDContent: null,
      transition: {
        from: 'game',
        to: 'cockpit',
        type: 'iris-close',
        progress: 0,
        duration: IRIS_DURATION,
        startedAt: Date.now(),
      },
    });
  },

  cleanupGame: () => {
    const state = get();
    // Idempotency: if no game is active and we're already back in the
    // cockpit scene, skip. Guards against StrictMode double-invocation,
    // React 18 concurrent unmount, and multiple call sites racing
    // (GameShell unmount + PauseMenu Quit + ErrorBoundary fallback).
    if (
      state.activeScene === 'cockpit' &&
      state.activeGameId === null &&
      state.gameSceneContent === null &&
      state.gameHUDContent === null
    ) {
      return;
    }

    // 1. Reset per-child gameStore BEFORE the iris animation begins so
    //    the phase indicator in the HUD doesn't briefly flip to 'idle'
    //    mid-animation. resetGame() clears:
    //      currentGame, phase, currentRound, totalRounds, score,
    //      maxScore, isComplete, isPaused, hintsRemaining,
    //      timeElapsed, gameData
    useGameStore.getState().resetGame();

    // 2. Trigger the scene exit (already clears gameSceneContent,
    //    gameHUDContent, and starts the iris-close transition).
    get().exitGame();

    // 3. Revert active game lab color to the default so the cockpit's
    //    ambient lights return to lab-neutral glow. The real color is
    //    re-set by enterGame() on the next game entry.
    set({ activeGameLabColor: '#00BBFF' });
  },


  // Phase 5 O.1-MAX (§5.8): Spatial transitions now animate via the
  // shared transition state machine so the 2D PageTransitionProvider
  // overlay and the 3D cockpit-to-spatial transition run on a single
  // timeline. Previously these were instant state flips with no 3D
  // animation, causing the lab-entry to feel abrupt.
  enterSpatial: () => set({
    previousScene: get().activeScene,
    activeScene: 'transitioning',
    isTransitioning: true,
    transition: {
      from: 'cockpit',
      to: 'spatial',
      type: 'cockpit-to-spatial',
      progress: 0,
      duration: 800,
      startedAt: Date.now(),
    },
  }),

  exitSpatial: () => set({
    previousScene: 'spatial',
    activeScene: 'transitioning',
    isTransitioning: true,
    transition: {
      from: 'spatial',
      to: 'cockpit',
      type: 'cockpit-to-spatial',
      progress: 0,
      duration: 600,
      startedAt: Date.now(),
    },
  }),

  setHeroActive: () => set({ activeScene: 'hero', previousScene: null }),

  completeHero: () => {
    set({
      previousScene: 'hero',
      activeScene: 'transitioning',
      isTransitioning: true,
      transition: {
        from: 'hero',
        to: 'cockpit',
        type: 'hero-to-cockpit',
        progress: 0,
        duration: 1200,
        startedAt: Date.now(),
      },
    });
  },

  updateTransitionProgress: (progress) => {
    const { transition } = get();
    if (transition) {
      set({ transition: { ...transition, progress: Math.min(progress, 1) } });
    }
  },

  completeTransition: () => {
    const { transition } = get();
    if (transition) {
      set({
        activeScene: transition.to,
        previousScene: transition.from,
        transition: null,
        isTransitioning: false,
        activeGameId: transition.to === 'cockpit' ? null : get().activeGameId,
      });
    }
    // P2 §5.8: notify anyone `awaiting` that the iris is done.
    notifyTransitionWatchers();
  },

  awaitTransitionComplete: () => {
    const { isTransitioning } = get();
    if (!isTransitioning) return Promise.resolve();
    return new Promise<void>((resolve) => {
      transitionWatchers.add(resolve);
    });
  },
}));

// Selectors
export const selectActiveScene = (s: SceneState) => s.activeScene;
export const selectTransition = (s: SceneState) => s.transition;
export const selectIsTransitioning = (s: SceneState) => s.isTransitioning;
export const selectActiveGameId = (s: SceneState) => s.activeGameId;
export const selectCockpitOpacity = (s: SceneState) => s.cockpitOpacityTarget;
export const selectGameSceneContent = (s: SceneState) => s.gameSceneContent;
export const selectGameHUDContent = (s: SceneState) => s.gameHUDContent;
