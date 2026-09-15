'use client';

/**
 * W3-04 HoloBubble controller — Escape close + focus restore.
 * Tip auto-dismiss is armed by set/open writers (holoBubble.ts).
 * No new Zustand store.
 */

import { useEffect } from 'react';
import {
  closeHoloBubble,
  isHoloBubbleOpen,
} from '@/lib/forge-hub/holoBubble';
import { dispatchSparkyEvent } from '@/lib/forge-hub/sparkyBehaviour';
import { useForgeReducedMotion } from '@/lib/forge-hub/useForgeReducedMotion';
import { useForgeStore } from '@/stores/sceneStore';

export function useHoloBubble(poseLock: boolean): void {
  const reducedMotion = useForgeReducedMotion();
  const flatOverlay = useForgeStore((s) => s.forge.flatOverlay);
  const mode = useForgeStore((s) => s.forge.mode);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (poseLock || flatOverlay || mode === 'flat') return;
      const bubble = useForgeStore.getState().forge.holoBubble.state;
      if (!isHoloBubbleOpen(bubble)) return;
      event.preventDefault();
      event.stopPropagation();
      if (bubble === 'whisper') {
        dispatchSparkyEvent(
          { type: 'WHISPER_CLOSE' },
          { reducedMotion, poseLock: false },
        );
        closeHoloBubble();
        return;
      }
      closeHoloBubble();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [flatOverlay, mode, poseLock, reducedMotion]);
}
