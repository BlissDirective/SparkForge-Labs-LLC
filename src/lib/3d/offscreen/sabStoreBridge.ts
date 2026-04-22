// ════════════════════════════════════════════════════════════════
// sabStoreBridge — main-thread Zustand → SAB writer
// Phase 5 task #1 (§10.11) Ultra sub-module
// ════════════════════════════════════════════════════════════════
// Subscribes to the relevant Zustand stores on the main thread and
// projects their values into the SharedArrayBuffer mirror declared
// in `sabStoreMirror.ts`. The worker reads from the mirror every
// frame with zero round-trips.
//
// Usage (main thread):
//   const mirror = createSabStoreMirror();
//   const detach = wireZustandToSab(mirror);
//   // ... transfer mirror.buffer to worker ...
//   // on teardown: detach();
//
// This module intentionally has no React dependency — it can be
// called from either the Canvas provider or directly from an init
// hook. Zustand's `subscribe` API is framework-agnostic.
// ════════════════════════════════════════════════════════════════

import { useCockpitStore } from '@/stores/cockpitStore';
import { useSceneStore } from '@/stores/sceneStore';
import { useGameStore } from '@/stores/gameStore';
import { useUIStore } from '@/stores/uiStore';
import {
  SCENE_MODE_ENUM,
  SPATIAL_VIEW_ENUM,
  AGE_BAND_ENUM,
  GAME_PHASE_ENUM,
  encodeEnum,
  type SabStoreHandle,
} from './sabStoreMirror';

type Unsub = () => void;

/**
 * Subscribe all relevant stores and mirror their values into the SAB.
 * Returns a teardown function that unsubscribes every listener.
 *
 * Stores we do NOT mirror (intentional):
 *   - authStore: auth is HTTP-authoritative, worker should never need
 *     it. If a 3D panel renders auth-gated content it reads it on the
 *     main thread and passes down as a prop before init.
 *   - childStore: the active Child lives in React Query, reachable via
 *     useActiveChild() only. Call `writeActiveChildAgeBand(mirror, band)`
 *     from a React hook instead of subscribing here.
 *   - toastStore / parentStore: DOM-only, no 3D use.
 */
export function wireZustandToSab(mirror: SabStoreHandle): Unsub {
  const unsubs: Unsub[] = [];

  // ── sceneStore: activeScene only; transition presence → SCENE_TRANSITION_T ──
  unsubs.push(
    useSceneStore.subscribe((state, prev) => {
      if (!prev || state.activeScene !== prev.activeScene) {
        mirror.write('SCENE_MODE', encodeEnum(SCENE_MODE_ENUM, state.activeScene));
      }
      // Surface 1 while a transition is in flight, 0 otherwise. The SAB
      // stores a scalar T, not booleans, so worker camera tweens can
      // read this directly (future: expand to a 0..1 progress once the
      // store exposes it).
      const hasTransition = state.transition != null ? 1 : 0;
      const hadTransition = prev?.transition != null ? 1 : 0;
      if (!prev || hasTransition !== hadTransition) {
        mirror.write('SCENE_TRANSITION_T', hasTransition);
      }
    }),
  );

  // ── cockpitStore: focus, spatial view, transition flag, camera target ──
  unsubs.push(
    useCockpitStore.subscribe((state, prev) => {
      if (!prev || state.focusedLabId !== prev.focusedLabId) {
        mirror.write(
          'FOCUSED_LAB',
          typeof state.focusedLabId === 'number' ? state.focusedLabId : -1,
        );
      }
      if (!prev || state.spatialView !== prev.spatialView) {
        mirror.write('SPATIAL_VIEW', encodeEnum(SPATIAL_VIEW_ENUM, state.spatialView));
      }
      if (!prev || state.isTransitioning !== prev.isTransitioning) {
        mirror.write('IS_TRANSITIONING', state.isTransitioning ? 1 : 0);
      }
      const target = state.cameraTarget;
      if (!prev || target !== prev.cameraTarget) {
        // cameraTarget shape: { position: [x,y,z], lookAt: [x,y,z], fov }
        // or similar — write defensively using optional chaining.
        const pos = (target as { position?: readonly number[] })?.position;
        if (pos && pos.length >= 3) {
          mirror.write('CAM_TARGET_X', pos[0] ?? 0);
          mirror.write('CAM_TARGET_Y', pos[1] ?? 0);
          mirror.write('CAM_TARGET_Z', pos[2] ?? 0);
        }
        const fov = (target as { fov?: number })?.fov;
        if (typeof fov === 'number') mirror.write('CAM_FOV', fov);
      }
    }),
  );

  // ── gameStore: phase + derived active flag ────────────────────────
  unsubs.push(
    useGameStore.subscribe((state, prev) => {
      if (!prev || state.phase !== prev.phase) {
        mirror.write('GAME_PHASE', encodeEnum(GAME_PHASE_ENUM, state.phase));
        // Active = any non-idle phase. Worker uses this to lower
        // post-processing cost during gameplay (see D3D-B6).
        mirror.write('GAME_ACTIVE', state.phase !== 'idle' ? 1 : 0);
      }
    }),
  );

  // ── uiStore.a11y.reduceMotion ─────────────────────────────────────
  unsubs.push(
    useUIStore.subscribe((state, prev) => {
      const reduced = state.a11y?.reduceMotion ? 1 : 0;
      const prevReduced = prev?.a11y?.reduceMotion ? 1 : 0;
      if (reduced !== prevReduced) mirror.write('REDUCED_MOTION', reduced);
    }),
  );

  // ── Device pixel ratio ────────────────────────────────────────────
  if (typeof window !== 'undefined') {
    mirror.write('DEVICE_PIXEL_RATIO', window.devicePixelRatio || 1);
  }

  return () => {
    for (const u of unsubs) {
      try {
        u();
      } catch {
        /* no-op */
      }
    }
  };
}

/**
 * Write the active child's age band from a React context. Call from
 * useEffect inside a component that uses useActiveChild().
 */
export function writeActiveChildAgeBand(
  mirror: SabStoreHandle,
  band: 'A' | 'B' | 'C' | null | undefined,
): void {
  mirror.write('CHILD_AGE_BAND', encodeEnum(AGE_BAND_ENUM, band));
}
