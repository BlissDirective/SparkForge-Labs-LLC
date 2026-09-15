'use client';

/**
 * Bind game-launch-burst QA force-play on /dev/forge-hub?burst=1.
 * Session-first follow-on after lobby-playstage-merge lives in Director
 * (does not nest into the GSAP morph or Stagehand P2 cycle).
 */

import { useEffect, useRef } from 'react';
import { playForgeTransition } from '@/lib/forge-hub/director';
import {
  armGameLaunchBurst,
  readBurstSeen,
  writeBurstSeen,
} from '@/lib/forge-hub/gameLaunchBurst';
import { selectForgeFlatOverlay, useForgeStore } from '@/stores/sceneStore';
import { useUIStore } from '@/stores/uiStore';

function liveReducedMotion(fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  try {
    const osPref = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const userPref = useUIStore.getState().a11y.reduceMotion;
    return osPref || userPref;
  } catch {
    return fallback;
  }
}

export function useGameLaunchBurst(opts: {
  poseLock: boolean;
  reducedMotion: boolean;
  burstQuery: boolean;
}): void {
  const flatOverlay = useForgeStore(selectForgeFlatOverlay);
  const mode = useForgeStore((s) => s.forge.mode);
  const morphProgress = useForgeStore((s) => s.forge.morphProgress);
  const armed = useRef(false);

  useEffect(() => {
    if (armed.current) return;
    if (!opts.burstQuery) return;
    if (opts.poseLock) return;

    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled || armed.current) return;

      const reducedMotion = liveReducedMotion(opts.reducedMotion);
      const storage =
        typeof sessionStorage === 'undefined' ? null : sessionStorage;
      const arm = armGameLaunchBurst({
        poseLock: opts.poseLock,
        flatOverlay,
        reducedMotion,
        seen: readBurstSeen(storage),
        force: true,
        fromMerge: false,
        mode,
        morphProgress,
      });

      if (arm.kind === 'hold') return;
      armed.current = true;
      if (arm.kind === 'skip') return;

      writeBurstSeen(storage);
      playForgeTransition('game-launch-burst', { reducedMotion });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [
    flatOverlay,
    mode,
    morphProgress,
    opts.burstQuery,
    opts.poseLock,
    opts.reducedMotion,
  ]);
}
