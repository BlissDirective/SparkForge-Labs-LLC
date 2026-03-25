import { type ReactNode } from 'react';
import { create } from 'zustand';

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

  enterGame: (gameId: string, labColor: string) => void;
  exitGame: () => void;
  enterSpatial: () => void;
  exitSpatial: () => void;
  setHeroActive: () => void;
  completeHero: () => void;
  updateTransitionProgress: (progress: number) => void;
  completeTransition: () => void;
}

const IRIS_DURATION = 600;

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

  enterSpatial: () => set({
    previousScene: get().activeScene,
    activeScene: 'spatial',
  }),

  exitSpatial: () => set({
    previousScene: 'spatial',
    activeScene: 'cockpit',
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
  },
}));

// Selectors
export const selectActiveScene = (s: SceneState) => s.activeScene;
export const selectTransition = (s: SceneState) => s.transition;
export const selectIsTransitioning = (s: SceneState) => s.isTransitioning;
export const selectActiveGameId = (s: SceneState) => s.activeGameId;
export const selectCockpitOpacity = (s: SceneState) => s.cockpitOpacityTarget;
export const selectGameSceneContent = (s: SceneState) => s.gameSceneContent;
