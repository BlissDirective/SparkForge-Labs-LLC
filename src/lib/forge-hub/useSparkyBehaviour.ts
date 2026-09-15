'use client';

/**
 * Wires placeholder Sparky to the existing sceneStore forge slice.
 * Mode / hover / focus while Director is idle. Live morph seats are
 * written by Director `sparkyReactions.ts` (five Tier-1 spots only).
 * No new Zustand store.
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
    // Director timelines own forge.sparky.spot during a live morph.
    if (directorId) return;
    dispatchSparkyEvent({ type: 'MODE', mode }, { reducedMotion, poseLock });
  }, [mode, poseLock, reducedMotion, directorId]);

  useEffect(() => {
    if (poseLock || directorId) return;
    dispatchSparkyEvent(
      { type: 'HOVER', panel: hoveredPanel },
      { reducedMotion, poseLock },
    );
  }, [hoveredPanel, poseLock, reducedMotion, directorId]);

  useEffect(() => {
    if (poseLock || directorId) return;
    dispatchSparkyEvent(
      { type: 'FOCUS', panel: activePanel },
      { reducedMotion, poseLock },
    );
  }, [activePanel, poseLock, reducedMotion, directorId]);
}
