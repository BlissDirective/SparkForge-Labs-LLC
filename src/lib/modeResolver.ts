// ════════════════════════════════════════════════════
// Mode Resolver — Unified Mode Type Bridge
// ════════════════════════════════════════════════════
// Phase 1 audit fix (Section 3.4, Solution B): Provides explicit
// mapping between the three overlapping mode type systems:
//
//   CockpitMode (9 values)  — atmosphere presets, design tokens
//   StationMode (10 values) — legacy audio, cockpit config
//   ActiveScene (5 values)  — scene graph routing
//
// Instead of deprecating StationMode (risky: used in 5+ files + audio),
// this utility provides a clean bridge so each system stays stable
// while consumers can convert between them as needed.

import type { CockpitMode } from '@/lib/3d/cockpitModePresets';
import type { StationMode } from '@/hooks/useStationMode';
import type { ActiveScene } from '@/stores/sceneStore';

// ═══════════════════════════════════════════════════════════════
// COCKPIT MODE → STATION MODE
// ═══════════════════════════════════════════════════════════════

const COCKPIT_TO_STATION: Record<CockpitMode, StationMode> = {
  dashboard:   'dashboard',
  labs:        'labmap',
  lab_detail:  'lab',
  arcade:      'arcade',
  game:        'game',
  profile:     'profile',
  settings:    'dashboard',  // Settings has no StationMode equivalent → dashboard
  celebration: 'celebration',
  parent:      'parent',
};

export function cockpitToStation(mode: CockpitMode): StationMode {
  return COCKPIT_TO_STATION[mode] ?? 'dashboard';
}

// ═══════════════════════════════════════════════════════════════
// STATION MODE → COCKPIT MODE
// ═══════════════════════════════════════════════════════════════

const STATION_TO_COCKPIT: Record<StationMode, CockpitMode> = {
  dashboard:   'dashboard',
  arcade:      'arcade',
  labmap:      'labs',
  lab:         'lab_detail',
  game:        'game',
  profile:     'profile',
  celebration: 'celebration',
  onboarding:  'dashboard',  // No cockpit preset for onboarding → dashboard
  parent:      'parent',
  admin:       'dashboard',  // No cockpit preset for admin → dashboard
};

export function stationToCockpit(mode: StationMode): CockpitMode {
  return STATION_TO_COCKPIT[mode] ?? 'dashboard';
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
// ACTIVE SCENE → STATION MODE
// ═══════════════════════════════════════════════════════════════

const SCENE_TO_STATION: Record<ActiveScene, StationMode> = {
  hero:          'dashboard',
  cockpit:       'dashboard',
  spatial:       'labmap',
  game:          'game',
  transitioning: 'game',
};

export function sceneToStation(scene: ActiveScene): StationMode {
  return SCENE_TO_STATION[scene] ?? 'dashboard';
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
 *
 *   const resolved = resolveMode({ station: 'labmap' });
 *   // → { cockpit: 'labs', station: 'labmap', scene: 'spatial' }
 */
export function resolveMode(
  input: Partial<ResolvedMode>,
): ResolvedMode {
  if (input.cockpit) {
    return {
      cockpit: input.cockpit,
      station: cockpitToStation(input.cockpit),
      scene: input.scene ?? (input.cockpit === 'game' ? 'game' : 'cockpit'),
    };
  }

  if (input.station) {
    const cockpit = stationToCockpit(input.station);
    return {
      cockpit,
      station: input.station,
      scene: input.scene ?? (input.station === 'game' ? 'game' : input.station === 'labmap' || input.station === 'lab' ? 'spatial' : 'cockpit'),
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
