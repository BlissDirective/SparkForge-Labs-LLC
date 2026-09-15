'use client';

// W1-02 — store-backed portal runner.
// Director (W2) will own the timeline. Until then this hook:
//   IGNITE → hold charge 420ms → ADVANCE emit → hold 560ms → docked
//   prefers-reduced-motion / uiStore a11y → SKIP_TO_DOCKED
//   pose=lock freezes idle for the SSIM capture (no auto-advance)

import { useCallback, useEffect } from 'react';
import { useSafeMotion } from '@/hooks/useSafeMotion';
import { useForgeStore } from '@/stores/sceneStore';
import {
  isPortalOpen,
  nextHoldMs,
  type PortalEvent,
  type PortalPhase,
} from './portalMachine';

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
  const reduceMotion = useSafeMotion();
  const phase = useForgeStore((s) => s.forge.portalPhase);
  const poseLock = useForgeStore((s) => s.forge.poseLock);
  const dispatch = useForgeStore((s) => s.dispatchForgePortal);

  useEffect(() => {
    if (poseLock) return;
    const hold = nextHoldMs(phase);
    if (hold == null) return;
    if (reduceMotion) {
      useForgeStore.getState().dispatchForgePortal({ type: 'SKIP_TO_DOCKED' });
      return;
    }
    const id = window.setTimeout(() => {
      useForgeStore.getState().dispatchForgePortal({ type: 'ADVANCE' });
    }, hold);
    return () => window.clearTimeout(id);
  }, [phase, poseLock, reduceMotion]);

  const ignite = useCallback(() => {
    if (poseLock) return;
    if (reduceMotion) {
      dispatch({ type: 'SKIP_TO_DOCKED' });
      return;
    }
    dispatch({ type: 'IGNITE' });
  }, [dispatch, poseLock, reduceMotion]);

  const retract = useCallback(() => {
    if (poseLock) return;
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
