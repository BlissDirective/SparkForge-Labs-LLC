'use client';

/**
 * Bind first-visit-ignition to the live /dev/forge-hub tip.
 * Callers pass Stagehand W2-03 route + flatOverlay selectors.
 * Auto-play is opt-in on the lab (`?ignition=1`); production `/` `/login`
 * stay gated until FORGE_HUB. HUD play() remains the manual trigger.
 *
 * Reduced-motion is read from matchMedia inside the effect (not the first
 * render) so Playwright emulateMedia / hydration cannot arm the 1500 ms
 * cinematic by mistake.
 */

import { useEffect, useRef } from 'react';
import { playForgeTransition } from '@/lib/forge-hub/director';
import {
  armFirstVisitIgnition,
  isForgeHubProductionEnabled,
  readIgnitionSeen,
  writeIgnitionSeen,
} from '@/lib/forge-hub/firstVisitIgnition';
import type { ForgeRouteKind } from '@/lib/forge-hub/types';
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

export function useFirstVisitIgnition(opts: {
  pathname: string;
  routeKind: ForgeRouteKind;
  poseLock: boolean;
  reducedMotion: boolean;
  ignitionQuery: boolean;
}): void {
  const flatOverlay = useForgeStore(selectForgeFlatOverlay);
  const skipIntro = useUIStore((s) => s.skipIntroAnimation);
  const armed = useRef(false);

  useEffect(() => {
    if (armed.current) return;
    if (opts.poseLock) return;

    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled || armed.current) return;

      const reducedMotion = liveReducedMotion(opts.reducedMotion);
      const storage =
        typeof sessionStorage === 'undefined' ? null : sessionStorage;
      const arm = armFirstVisitIgnition({
        pathname: opts.pathname,
        routeKind: opts.routeKind,
        poseLock: opts.poseLock,
        flatOverlay,
        skipIntro,
        reducedMotion,
        ignitionQuery: opts.ignitionQuery,
        seen: readIgnitionSeen(storage),
        forgeHubEnabled: isForgeHubProductionEnabled(),
      });

      if (arm.kind === 'hold') return;

      armed.current = true;
      writeIgnitionSeen(storage);

      if (arm.kind === 'welcome-idle') {
        playForgeTransition('welcome-idle', { reducedMotion });
        return;
      }

      playForgeTransition('first-visit-ignition', {
        reducedMotion: arm.reducedMotion,
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [
    flatOverlay,
    opts.ignitionQuery,
    opts.pathname,
    opts.poseLock,
    opts.reducedMotion,
    opts.routeKind,
    skipIntro,
  ]);
}
