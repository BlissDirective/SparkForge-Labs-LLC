'use client';

// ════════════════════════════════════════════════════════════════
// useSafePause — UX-MED-002 (T10a)
// ════════════════════════════════════════════════════════════════
// Pause-aware utilities for game components:
//
//   useSafePause()          — subscribes to gameStore.isPaused +
//                             exposes stable pause/resume/toggle
//                             actions. Use in React components.
//
//   useSafePauseFrame(cb)   — drop-in replacement for @react-three/
//                             fiber's useFrame that skips cb when
//                             isPaused is true. Preserves the delta
//                             argument so time-based animations
//                             freeze rather than jump on resume.
//
// The gameStore already has pauseGame/resumeGame from the original
// store factory; T10a adds togglePause() and this hook pair so
// consumers don't need to wire three separate selectors.

import { useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/stores/gameStore';

export interface SafePauseApi {
  isPaused: boolean;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
}

/**
 * Component-level pause API. Subscribes to gameStore.isPaused with a
 * narrow selector (no re-render on unrelated state changes).
 */
export function useSafePause(): SafePauseApi {
  const isPaused = useGameStore((s) => s.isPaused);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const togglePause = useGameStore((s) => s.togglePause);

  return {
    isPaused,
    pause: pauseGame,
    resume: resumeGame,
    toggle: togglePause,
  };
}

/**
 * Drop-in replacement for useFrame that short-circuits the callback
 * when gameStore.isPaused is true. Use this inside any game
 * component that runs per-frame animation state updates — timer
 * counters, shader uniforms, physics, etc. — so that a pause
 * genuinely freezes the game rather than just hiding it.
 *
 * @example
 *   const meshRef = useRef<Mesh>(null);
 *   useSafePauseFrame((state, delta) => {
 *     if (meshRef.current) {
 *       meshRef.current.rotation.y += delta;
 *     }
 *   });
 *
 * Implementation reads isPaused directly from the store via
 * `getState()` inside the frame callback — avoids adding a render-
 * loop subscription that would cause R3F components to re-render on
 * every pause toggle.
 */
export function useSafePauseFrame(
  callback: (
    state: Parameters<Parameters<typeof useFrame>[0]>[0],
    delta: number,
  ) => void,
  renderPriority?: number,
): void {
  const wrapped = useCallback(
    (state: Parameters<Parameters<typeof useFrame>[0]>[0], delta: number) => {
      if (useGameStore.getState().isPaused) return;
      callback(state, delta);
    },
    [callback],
  );
  useFrame(wrapped, renderPriority);
}
