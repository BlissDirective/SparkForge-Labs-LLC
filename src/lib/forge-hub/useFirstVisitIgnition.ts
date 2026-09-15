'use client';

/**
 * Bind first-visit-ignition to the live /dev/forge-hub tip.
 * Callers pass Stagehand W2-03 route + flatOverlay selectors.
 * Auto-play is opt-in on the lab (`?ignition=1`); production `/` `/login`
 * stay gated until FORGE_HUB. HUD play() remains the manual trigger.
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

    const storage =
      typeof sessionStorage === 'undefined' ? null : sessionStorage;
    const arm = armFirstVisitIgnition({
      pathname: opts.pathname,
      routeKind: opts.routeKind,
      poseLock: opts.poseLock,
      flatOverlay,
      skipIntro,
      reducedMotion: opts.reducedMotion,
      ignitionQuery: opts.ignitionQuery,
      seen: readIgnitionSeen(storage),
      forgeHubEnabled: isForgeHubProductionEnabled(),
    });

    if (arm.kind === 'hold') return;

    armed.current = true;
    writeIgnitionSeen(storage);

    if (arm.kind === 'welcome-idle') {
      playForgeTransition('welcome-idle', {
        reducedMotion: opts.reducedMotion,
      });
      return;
    }

    playForgeTransition('first-visit-ignition', {
      reducedMotion: arm.reducedMotion,
    });
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
