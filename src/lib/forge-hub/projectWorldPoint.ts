// ════════════════════════════════════════════════════════════════
// Fixed-camera world → CSS pixel helper for the HoloBubble stub.
// Matches FORGE_HUB_CAMERA lock pose (no micro-dolly / parallax).
// Live canvas path prefers ForgeSlotProjector + the real camera.
// ════════════════════════════════════════════════════════════════

import { PerspectiveCamera, Vector3 } from 'three';
import { FORGE_HUB_CAMERA } from '@/config/forgeHub';
import { ndcToScreen, type ScreenPoint } from './projectionMath';

const scratchCam = new PerspectiveCamera(
  FORGE_HUB_CAMERA.fov,
  1,
  FORGE_HUB_CAMERA.near,
  FORGE_HUB_CAMERA.far,
);
const scratchVec = new Vector3();

function syncLockCamera(aspect: number): void {
  scratchCam.fov = FORGE_HUB_CAMERA.fov;
  scratchCam.near = FORGE_HUB_CAMERA.near;
  scratchCam.far = FORGE_HUB_CAMERA.far;
  scratchCam.aspect = aspect > 0 ? aspect : 1;
  scratchCam.position.set(
    FORGE_HUB_CAMERA.position[0],
    FORGE_HUB_CAMERA.position[1],
    FORGE_HUB_CAMERA.position[2],
  );
  scratchCam.lookAt(
    FORGE_HUB_CAMERA.lookAt[0],
    FORGE_HUB_CAMERA.lookAt[1],
    FORGE_HUB_CAMERA.lookAt[2],
  );
  scratchCam.updateProjectionMatrix();
  scratchCam.updateMatrixWorld();
}

export function projectWorldToScreen(
  world: readonly [number, number, number],
  width: number,
  height: number,
): ScreenPoint {
  const { point } = projectWorldVisible(world, width, height);
  return point;
}

export function projectWorldVisible(
  world: readonly [number, number, number],
  width: number,
  height: number,
): { point: ScreenPoint; visible: boolean } {
  syncLockCamera(width / Math.max(1, height));
  scratchVec.set(world[0], world[1], world[2]).project(scratchCam);
  return {
    point: ndcToScreen(scratchVec.x, scratchVec.y, width, height),
    visible:
      Number.isFinite(scratchVec.x) &&
      Number.isFinite(scratchVec.y) &&
      scratchVec.z >= -1 &&
      scratchVec.z <= 1,
  };
}
