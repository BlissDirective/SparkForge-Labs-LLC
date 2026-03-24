// ════════════════════════════════════════════════════
// useIrisTransition — Orchestrates Mechanical Iris Animation
// ════════════════════════════════════════════════════
// Reads transition state from sceneStore and drives the
// progress value via requestAnimationFrame. Provides a
// simple API for GameShell and navigation to trigger
// game entry/exit transitions.
//
// Section 4.1-C: Iris audio is integrated directly into this
// hook so ANY consumer gets automatic transition audio.
// Lab-color pitch/timbre variations via Section 4.1-F.

import { useEffect, useCallback, useRef } from 'react';
import { useSceneStore } from '@/stores/sceneStore';
import { irisAudioEngine } from '@/lib/audio/irisAudio';

export function useIrisTransition() {
  const transition = useSceneStore((s) => s.transition);
  const isTransitioning = useSceneStore((s) => s.isTransitioning);
  const activeGameLabColor = useSceneStore((s) => s.activeGameLabColor);
  const updateProgress = useSceneStore((s) => s.updateTransitionProgress);
  const completeTransition = useSceneStore((s) => s.completeTransition);
  const enterGame = useSceneStore((s) => s.enterGame);
  const exitGame = useSceneStore((s) => s.exitGame);

  // Audio lifecycle tracking (Section 4.1-C)
  const audioInitialized = useRef(false);
  const wasTransitioning = useRef(false);

  // Start/stop iris audio in sync with transition lifecycle
  useEffect(() => {
    if (isTransitioning && !wasTransitioning.current) {
      // Transition started — initialize audio engine and play
      if (!audioInitialized.current) {
        irisAudioEngine.init();
        audioInitialized.current = true;
      }
      const dir = transition?.type === 'iris-close' ? 'close' : 'open';
      irisAudioEngine.startTransition(dir, activeGameLabColor);
      wasTransitioning.current = true;
    } else if (!isTransitioning && wasTransitioning.current) {
      // Transition ended — stop audio
      irisAudioEngine.stopTransition();
      wasTransitioning.current = false;
    }
  }, [isTransitioning, transition?.type, activeGameLabColor]);

  // Sync audio progress each frame during transition
  useEffect(() => {
    if (isTransitioning && transition) {
      const direction = transition.type === 'iris-close' ? 'close' : 'open';
      irisAudioEngine.syncProgress(transition.progress, direction);
    }
  }, [isTransitioning, transition]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
