// ════════════════════════════════════════════════════════════════
// Named desk spots for placeholder Sparky (TAP §2.8 / spec §7.1).
// Room coordinates on the real W1-01 desk plane (y = 0 contact).
// Does NOT change the layout registry / glass slot APIs (no Tier-1).
// ════════════════════════════════════════════════════════════════

import { FORGE_HUB_CAMERA, FORGE_HUB_PLATE } from '@/config/forgeHub';
import type { ForgeMode, ForgePanelId, ForgeSparkySpot } from '@/lib/forge-hub/types';

/** Spec §3.1 — boots to crown of the dome, metres. */
export const SPARKY_HEIGHT_M = 0.4;

/** Spec §4.2 — HoloBubble socket sits 0.06 m above the dome apex. */
export const SPARKY_HOLO_SOCKET_LIFT_M = 0.06;

export const SPARKY_SPOT_IDS = [
  'nearCore',
  'leftLip',
  'rightLip',
  'frontCenter',
  'behindCore',
] as const satisfies readonly ForgeSparkySpot[];

export interface SparkySpotPose {
  id: ForgeSparkySpot;
  /** Room coords; y is boot contact on the desk plane. */
  position: readonly [number, number, number];
  /** Yaw radians. 0 = face +Z (toward the fixed hub camera). */
  yaw: number;
}

const DESK = FORGE_HUB_PLATE.desk;
const CX = DESK.position[0];
const CY = DESK.position[1];
const CZ = DESK.position[2];

/**
 * Camera-facing half of the circular desk so Sparky stays in the
 * lower band of the lock frustum (desk below glass hit targets).
 * Glass lives on the far plate; these poses never share that plane.
 */
export const SPARKY_SPOTS: Record<ForgeSparkySpot, SparkySpotPose> = {
  nearCore: {
    id: 'nearCore',
    position: [CX, CY, CZ + 0.42],
    yaw: 0,
  },
  leftLip: {
    id: 'leftLip',
    position: [CX - 0.88, CY, CZ + 0.48],
    yaw: -0.45,
  },
  rightLip: {
    id: 'rightLip',
    position: [CX + 0.88, CY, CZ + 0.48],
    yaw: 0.45,
  },
  frontCenter: {
    id: 'frontCenter',
    position: [CX, CY, CZ + 1.05],
    yaw: 0,
  },
  behindCore: {
    id: 'behindCore',
    position: [CX, CY, CZ - 0.38],
    yaw: 0,
  },
};

export const SPARKY_DEFAULT_SPOT: ForgeSparkySpot = 'nearCore';

export function isSparkySpot(value: string): value is ForgeSparkySpot {
  return (SPARKY_SPOT_IDS as readonly string[]).includes(value);
}

export function sparkySpotPose(id: ForgeSparkySpot): SparkySpotPose {
  return SPARKY_SPOTS[id];
}

/** Horizontal distance from the desk centre in XZ. */
export function spotDeskOffset(id: ForgeSparkySpot): number {
  const [x, , z] = SPARKY_SPOTS[id].position;
  return Math.hypot(x - CX, z - CZ);
}

export function spotOnDesk(id: ForgeSparkySpot, margin = 0.18): boolean {
  return spotDeskOffset(id) <= DESK.radius - margin;
}

/**
 * True when boot contact is the desk plane and the crown sits below
 * the camera look-at height (glass / holograms read above Sparky).
 */
export function spotClearsGlass(id: ForgeSparkySpot): boolean {
  const [, y] = SPARKY_SPOTS[id].position;
  const crown = y + SPARKY_HEIGHT_M;
  return (
    Math.abs(y - CY) < 1e-6 &&
    crown < FORGE_HUB_CAMERA.lookAt[1] &&
    spotOnDesk(id)
  );
}

export function sparkyHoloAnchor(
  id: ForgeSparkySpot,
): readonly [number, number, number] {
  const [x, y, z] = SPARKY_SPOTS[id].position;
  return [x, y + SPARKY_HEIGHT_M + SPARKY_HOLO_SOCKET_LIFT_M, z];
}

/** Mode → home spot when Director is idle (cheap Director end-state mirror). */
export function defaultSpotForMode(mode: ForgeMode): ForgeSparkySpot {
  switch (mode) {
    case 'labsBrowse':
      return 'leftLip';
    case 'gameLobby':
    case 'playStage':
    case 'settingsDock':
      return 'rightLip';
    case 'dual':
    case 'avatarStudio':
      return 'frontCenter';
    default:
      return 'nearCore';
  }
}

/** Hovered wing → nearest lip; HoloC keeps the current / nearCore seat. */
export function attendSpotForPanel(
  panel: ForgePanelId,
  current: ForgeSparkySpot,
): ForgeSparkySpot {
  if (panel === 'holoL') return 'leftLip';
  if (panel === 'holoR') return 'rightLip';
  if (panel === 'holoC') return current === 'frontCenter' ? current : 'nearCore';
  return current;
}
