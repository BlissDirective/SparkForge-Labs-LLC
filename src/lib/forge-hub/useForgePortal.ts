'use client';

// W1-02 store-backed portal dispatch. W2-02 Director owns charge/emit
// holds (420 / 560). This hook no longer auto-ADVANCE — Ignite plays
// MOTION_BIBLE `emit-burst`. Reduced-motion uses useForgeReducedMotion
// (matchMedia + uiStore) so Playwright emulateMedia matches the HUD.

import { useCallback } from 'react';
import { useForgeReducedMotion } from '@/lib/forge-hub/useForgeReducedMotion';
import { playForgeTransition, getForgeDirector } from '@/lib/forge-hub/director';
import { useForgeStore } from '@/stores/sceneStore';
import { isPortalOpen, type PortalEvent, type PortalPhase } from './portalMachine';

export interface ForgePortalControls {
  phase: PortalPhase;
  isOpen: boolean;
  ignite: () => void;
  retract: () => void;
  /** Docked → retract; otherwise ignite (core / pedestal click). */
  toggle: () => void;
  dispatch: (event: PortalEvent) => void;
}

export function useForgePortal(): ForgePortalControls {
  const reduceMotion = useForgeReducedMotion();
  const phase = useForgeStore((s) => s.forge.portalPhase);
  const poseLock = useForgeStore((s) => s.forge.poseLock);
  const dispatch = useForgeStore((s) => s.dispatchForgePortal);

  const ignite = useCallback(() => {
    if (poseLock) return;
    playForgeTransition('emit-burst', { reducedMotion: reduceMotion });
  }, [poseLock, reduceMotion]);

  const retract = useCallback(() => {
    if (poseLock) return;
    getForgeDirector().kill();
    dispatch({ type: 'RETRACT' });
  }, [dispatch, poseLock]);

  const toggle = useCallback(() => {
    if (phase === 'docked') retract();
    else ignite();
  }, [ignite, phase, retract]);

  return {
    phase,
    isOpen: isPortalOpen(phase),
    ignite,
    retract,
    toggle,
    dispatch,
  };
}

export function portalLiveStatus(phase: PortalPhase): string {
  switch (phase) {
    case 'idle':
      return 'Forge core idle. Activate the SparkForge hologram to emit.';
    case 'charge':
      return 'Core charging.';
    case 'emit':
      return 'Hologram beam emitting from the core.';
    case 'docked':
      return 'Portal docked. Panels will land on the glass in a later task.';
    default:
      return 'Forge core idle.';
  }
}
