// ════════════════════════════════════════════════════════════════
// Forge Hub — projection + morph-phase math (W2)
// ════════════════════════════════════════════════════════════════
// DOM panels ride glass: project mesh-corner NDC → CSS pixels, then
// apply yaw as perspective + rotateY (TAP §2.2). Yaw snaps to 0 on
// `reading` slots. CSS yaw is clamped to ±8°.
//
// Morph content never stretches: fade first fifth, wipe last fifth
// (MOTION_BIBLE / TAP §2.2). Director owns the clock; we only map
// `morphProgress` → `data-morph-phase`.

import { HOLO_PERSPECTIVE_PX } from './glassSlots';

export { HOLO_PERSPECTIVE_PX };

/** TAP §2.2 — CSS perspective yaw cap. Glass `yawTuck` may store more. */
export const HOLO_YAW_CSS_MAX_DEG = 8;

export type MorphPhase = 'idle' | 'fade-out' | 'glass' | 'wipe-in';

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function clampYawCssDeg(yaw: number): number {
  return Math.max(-HOLO_YAW_CSS_MAX_DEG, Math.min(HOLO_YAW_CSS_MAX_DEG, yaw));
}

/** NDC (clip space, y-up) → CSS pixels (y-down) inside a viewport. */
export function ndcToScreen(
  ndcX: number,
  ndcY: number,
  width: number,
  height: number,
): ScreenPoint {
  return {
    x: (ndcX * 0.5 + 0.5) * width,
    y: (-ndcY * 0.5 + 0.5) * height,
  };
}

export function boundingRect(points: readonly ScreenPoint[]): ScreenRect {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  return {
    left,
    top,
    width: Math.max(...xs) - left,
    height: Math.max(...ys) - top,
  };
}

/**
 * TAP §2.2 fifths: outgoing fade in (0, 0.2), glass carries (0.2, 0.8),
 * incoming wipe in (0.8, 1). Settled layouts report `idle`.
 */
export function morphPhaseFromProgress(t: number): MorphPhase {
  if (t <= 0 || t >= 1) return 'idle';
  if (t < 0.2) return 'fade-out';
  if (t > 0.8) return 'wipe-in';
  return 'glass';
}

export function cssYawTransform(yawDeg: number): string {
  const yaw = clampYawCssDeg(yawDeg);
  if (yaw === 0) return 'none';
  return `perspective(${HOLO_PERSPECTIVE_PX}px) rotateY(${yaw}deg)`;
}
