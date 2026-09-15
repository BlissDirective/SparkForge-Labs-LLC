// ════════════════════════════════════════════════════════════════
// Forge Hub — camera, plate, and budget constants (W1-01)
// ════════════════════════════════════════════════════════════════
// Single source for the /dev/forge-hub room shell. W1-03 lock-pose
// glass overlays the painted cyan frames. W2 owns the layout registry
// (welcome / equal-trio re-seat). CorePortal world pose is W1-02.
//
// Framing target: public/forge-hub/world/LOCKED_HERO.png at 1536×1024
// (TAP v2.2 §2.4, §2.6 camera, §8). Display still is preferred on
// screen; the canonical plate stays the SSIM reference.

import { FORGE_CORE, PEDESTAL, plateXToUnit } from '@/lib/forge-hub/coreMap';
import type { ForgeFrameloop } from '@/lib/forge-hub/types';

/** Canonical lock plate — SSIM reference. Never regenerate. */
export const FORGE_HUB_LOCK_PLATE = '/forge-hub/world/LOCKED_HERO.png';

/** Display still of the same composition — on-screen plate + poster. */
export const FORGE_HUB_DISPLAY_STILL =
  '/forge-hub/world/LOCKED_HERO_no_haze_filter.png';

export const FORGE_HUB_REFERENCE_VIEWPORT = {
  width: 1536,
  height: 1024,
} as const;

export const FORGE_HUB_LOCK_ASPECT =
  FORGE_HUB_REFERENCE_VIEWPORT.width / FORGE_HUB_REFERENCE_VIEWPORT.height;

/** SSIM exit gate (TAP §8 / LOCKED_HUB). Inspector owns the harness. */
export const FORGE_HUB_SSIM_THRESHOLD = 0.96;

/**
 * Fixed camera — close frontal POV matching the lock plate.
 * Micro-dolly is ± MICRO_DOLLY_PERCENT of camera distance.
 * Pointer parallax is applied in ForgeFixedCamera; no orbit, no cuts.
 */
export const FORGE_HUB_CAMERA = {
  position: [0, 1.32, 4.35] as const,
  lookAt: [0, 0.78, -0.2] as const,
  fov: 38,
  near: 0.1,
  far: 80,
  /** Allowed idle dolly as a fraction of camera-to-lookAt distance. */
  microDollyPercent: 0.02,
  /** Pointer parallax world-unit scale (x, y). */
  parallax: [0.055, 0.035] as const,
} as const;

/** DPR clamp for the hub canvas (Stagehand Phase 1). */
export const FORGE_HUB_DPR: [number, number] = [1, 1.5];

/**
 * Backdrop plane sits along the look axis so it fills the frustum at
 * the lock FOV / aspect. Desk is a real y=0 plane (Sparky's floor).
 */
export const FORGE_HUB_PLATE = {
  /** Distance from camera to the backdrop along the look vector. */
  backdropDistance: 8.6,
  desk: {
    /** Circular platform in the lock (SF emitter floor). */
    position: [0, 0, 0.15] as const,
    radius: 1.62,
    /** Sample the lower band of the plate for the desk texture. */
    uvRepeat: [1, 0.4] as const,
    uvOffset: [0, 0] as const,
  },
} as const;

/**
 * CorePortal world pose (W1-02). Plate-percent FORGE_CORE.cx=50 seats
 * the disc on the desk origin; r=9.4% of the lock plate is scaled
 * against the W1-01 desk radius so the glow covers the painted SF
 * module without a second glyph.
 */
export const FORGE_HUB_CORE_PORTAL = {
  position: [
    plateXToUnit(FORGE_CORE.cx) * FORGE_HUB_PLATE.desk.radius,
    0,
    FORGE_HUB_PLATE.desk.position[2],
  ] as const,
  /** Inner emissive disc — smaller than the circular desk platform. */
  radius: FORGE_HUB_PLATE.desk.radius * (FORGE_CORE.r / (PEDESTAL.width / 2)),
  lift: 0.055,
  beamHeight: 1.92,
  beamRadiusTop: 0.52,
  beamRadiusBottom: 0.07,
} as const;

export const FORGE_HUB_BLOOM = {
  intensity: 0.22,
  threshold: 0.78,
  smoothing: 0.9,
} as const;

/**
 * Glass slabs (W1-03). World materials on the lock-pose trio.
 * Breathe is ambient (`panelBreathe` ~3 s, scale 98–102 %). Freeze
 * under reduced motion and `?pose=lock`. RM first-paint is a 200 ms
 * CSS crossfade — no continuous loop.
 */
export const FORGE_HUB_GLASS = {
  /** Local +Z toward camera so slabs sit in front of the plate. */
  lift: 0.05,
} as const;

export const FORGE_HUB_QUERY = {
  poseLock: 'lock',
  poseParam: 'pose',
  fallbackParam: 'fallback',
  fallbackPoster: 'poster',
} as const;

export function plateSizeAtDistance(
  distance: number,
  fovDeg: number,
  aspect: number,
): readonly [number, number] {
  const height = 2 * Math.tan((fovDeg * Math.PI) / 360) * distance;
  return [height * aspect, height];
}

export function frameloopForMotion(
  prefersReducedMotion: boolean,
): ForgeFrameloop {
  return prefersReducedMotion ? 'demand' : 'always';
}
