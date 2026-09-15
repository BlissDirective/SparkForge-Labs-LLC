'use client';

/**
 * Wires placeholder Sparky to the existing sceneStore forge slice.
 * Mode / hover / cheap Director ids. No new Zustand store.
 */

import { useEffect } from 'react';
import {
  dispatchSparkyEvent,
} from '@/lib/forge-hub/sparkyBehaviour';
import { useForgeStore } from '@/stores/sceneStore';

export function useSparkyBehaviour(
  reducedMotion: boolean,
  poseLock: boolean,
): void {
  const mode = useForgeStore((s) => s.forge.mode);
  const hoveredPanel = useForgeStore((s) => s.forge.hoveredPanel);
  const activePanel = useForgeStore((s) => s.forge.activePanel);
  const directorId = useForgeStore((s) => s.forge.directorId);

  useEffect(() => {
    if (poseLock) {
      useForgeStore.getState().patchForgeSparky({ moving: false });
      return;
    }
    dispatchSparkyEvent({ type: 'MODE', mode }, { reducedMotion, poseLock });
  }, [mode, poseLock, reducedMotion]);

  useEffect(() => {
    if (poseLock) return;
    dispatchSparkyEvent(
      { type: 'HOVER', panel: hoveredPanel },
      { reducedMotion, poseLock },
    );
  }, [hoveredPanel, poseLock, reducedMotion]);

  useEffect(() => {
    if (poseLock) return;
    dispatchSparkyEvent(
      { type: 'FOCUS', panel: activePanel },
      { reducedMotion, poseLock },
    );
  }, [activePanel, poseLock, reducedMotion]);

  useEffect(() => {
    if (poseLock || !directorId) return;
    if (directorId === 'whisper-expand') {
      dispatchSparkyEvent({ type: 'WHISPER' }, { reducedMotion, poseLock });
      return;
    }
    if (directorId === 'whisper-close') {
      dispatchSparkyEvent(
        { type: 'WHISPER_CLOSE' },
        { reducedMotion, poseLock },
      );
      return;
    }
    dispatchSparkyEvent(
      { type: 'DIRECTOR', id: directorId },
      { reducedMotion, poseLock },
    );
  }, [directorId, poseLock, reducedMotion]);
}
