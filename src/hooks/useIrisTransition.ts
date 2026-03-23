// ════════════════════════════════════════════════════
// useIrisTransition — Orchestrates Mechanical Iris Animation
// ════════════════════════════════════════════════════
// Reads transition state from sceneStore and drives the
// progress value via requestAnimationFrame. Provides a
// simple API for GameShell and navigation to trigger
// game entry/exit transitions.

import { useEffect, useCallback } from 'react';
import { useSceneStore } from '@/stores/sceneStore';

export function useIrisTransition() {
  const transition = useSceneStore((s) => s.transition);
  const updateProgress = useSceneStore((s) => s.updateTransitionProgress);
  const completeTransition = useSceneStore((s) => s.completeTransition);
  const enterGame = useSceneStore((s) => s.enterGame);
  const exitGame = useSceneStore((s) => s.exitGame);

  // Drive transition progress via rAF
  useEffect(() => {
    if (!transition) return;

    let rafId: number;
    const tick = () => {
      const elapsed = Date.now() - transition.startedAt;
      const progress = Math.min(elapsed / transition.duration, 1);
      updateProgress(progress);

      if (progress >= 1) {
        completeTransition();
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [transition?.startedAt, transition?.duration, updateProgress, completeTransition]);

  const startGameTransition = useCallback(
    (gameId: string, labColor: string) => enterGame(gameId, labColor),
    [enterGame]
  );

  const endGameTransition = useCallback(
    () => exitGame(),
    [exitGame]
  );

  return {
    isTransitioning: !!transition,
    progress: transition?.progress ?? 0,
    type: transition?.type ?? 'none' as const,
    startGameTransition,
    endGameTransition,
  };
}
