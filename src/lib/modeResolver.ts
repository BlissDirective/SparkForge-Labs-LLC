// ════════════════════════════════════════════════════
// Mode Resolver — Unified Mode Type Bridge
// ════════════════════════════════════════════════════
// Phase 1 audit fix (Section 3.4, Solution B): Provides explicit
// mapping between the overlapping mode type systems.
// Phase 2 Section 7 (Solution D): StationMode atomic cutover — the former
// StationMode union is now an alias of CockpitMode (labmap→labs,
// lab→lab_detail, onboarding/admin absorbed). The cockpit↔station bridge
// functions are now identity and remain exported only for backward compat
// with Phase 1 callers.
//
//   CockpitMode (11 values) — unified mode type (was 9; now absorbs onboarding, admin)
//   StationMode             — alias of CockpitMode (deprecated name)
//   ActiveScene (5 values)  — scene graph routing (orthogonal axis, retained)

import type { CockpitMode } from '@/lib/3d/cockpitModePresets';
import type { StationMode } from '@/hooks/useStationMode';
import type { ActiveScene } from '@/stores/sceneStore';

// ═══════════════════════════════════════════════════════════════
// COCKPIT MODE ↔ STATION MODE — identity after Phase 2 Section 7
// ═══════════════════════════════════════════════════════════════

export function cockpitToStation(mode: CockpitMode): StationMode {
  return mode;
}

export function stationToCockpit(mode: StationMode): CockpitMode {
  return mode;
}

// ═══════════════════════════════════════════════════════════════
// ACTIVE SCENE → COCKPIT MODE (partial — scene is a different axis)
// ═══════════════════════════════════════════════════════════════
// ActiveScene tracks scene graph state, not page state.
// This mapping provides a *default* cockpit mode for each scene;
// the actual cockpit mode may be overridden by route or user action.

const SCENE_TO_COCKPIT: Record<ActiveScene, CockpitMode> = {
  hero:          'dashboard',
  cockpit:       'dashboard',
  spatial:       'labs',
  game:          'game',
  transitioning: 'game',
};

export function sceneToCockpit(scene: ActiveScene): CockpitMode {
  return SCENE_TO_COCKPIT[scene] ?? 'dashboard';
}

// ═══════════════════════════════════════════════════════════════
// ACTIVE SCENE → STATION MODE (identity with sceneToCockpit after cutover)
// ═══════════════════════════════════════════════════════════════

export function sceneToStation(scene: ActiveScene): StationMode {
  return sceneToCockpit(scene);
}

// ═══════════════════════════════════════════════════════════════
// RESOLVE MODE — Get all three representations at once
// ═══════════════════════════════════════════════════════════════

export interface ResolvedMode {
  cockpit: CockpitMode;
  station: StationMode;
  scene: ActiveScene;
}

/**
 * Given any one mode value from any of the three systems, resolves
 * the corresponding values in the other two systems.
 *
 * Usage:
 *   const resolved = resolveMode({ cockpit: 'game' });
 *   // → { cockpit: 'game', station: 'game', scene: 'game' }
 */
export function resolveMode(
  input: Partial<ResolvedMode>,
): ResolvedMode {
  if (input.cockpit) {
    return {
      cockpit: input.cockpit,
      station: input.cockpit,
      scene: input.scene ?? (input.cockpit === 'game' ? 'game' : 'cockpit'),
    };
  }

  if (input.station) {
    return {
      cockpit: input.station,
      station: input.station,
      scene: input.scene ?? (input.station === 'game' ? 'game' : input.station === 'labs' || input.station === 'lab_detail' ? 'spatial' : 'cockpit'),
    };
  }

  if (input.scene) {
    return {
      cockpit: sceneToCockpit(input.scene),
      station: sceneToStation(input.scene),
      scene: input.scene,
    };
  }

  // Default fallback
  return { cockpit: 'dashboard', station: 'dashboard', scene: 'cockpit' };
}
