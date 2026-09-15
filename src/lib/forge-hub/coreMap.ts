// ════════════════════════════════════════════════════════════════
// Forge Hub — CorePortal plate math (PR #164 hotspotMap.ts, math only)
// ════════════════════════════════════════════════════════════════
// W1-02 needs the frozen plate aspect + FORGE_CORE / PEDESTAL so the
// TSL emitter sits on the painted SF module. Panel slots, HOTSPOTS,
// WORLD_MEDIA, and yaw helpers stay on the #164 branch until W2.
//
// Coordinates are percentages of the 1536×1024 lock plate.

export const PLATE_WIDTH_PX = 1536;
export const PLATE_HEIGHT_PX = 1024;
export const PLATE_ASPECT_RATIO = PLATE_WIDTH_PX / PLATE_HEIGHT_PX;

export interface PercentRect {
  left: number;
  top: number;
  width: number;
  height: number;
  /** Degrees. Negative yaws the left edge away (left wing); 0 = flat. */
  yaw?: number;
}

export interface PercentCircle {
  cx: number;
  cy: number;
  r: number;
}

/** Circular SF hologram — primary portal emitter (CorePortal). */
export const FORGE_CORE: PercentCircle = {
  cx: 50,
  cy: 49.2,
  r: 9.4,
};

/** Pedestal under the core — secondary ignite hit in #164; desk plane here. */
export const PEDESTAL: PercentRect = {
  left: 36.5,
  top: 70.5,
  width: 27,
  height: 18.5,
  yaw: 0,
};

export function isPercentRect(rect: PercentRect): boolean {
  return (
    rect.left >= 0 &&
    rect.top >= 0 &&
    rect.width > 0 &&
    rect.height > 0 &&
    rect.left + rect.width <= 100.001 &&
    rect.top + rect.height <= 100.001
  );
}

export function isPercentCircle(circle: PercentCircle): boolean {
  return (
    circle.r > 0 &&
    circle.cx - circle.r >= -0.001 &&
    circle.cy - circle.r >= -0.001 &&
    circle.cx + circle.r <= 100.001 &&
    circle.cy + circle.r <= 100.001
  );
}

/** Plate-percent X → unit offset in [-1, 1]. cx=50 seats on the desk origin. */
export function plateXToUnit(percentX: number): number {
  return percentX / 50 - 1;
}
