// ════════════════════════════════════════════════════════════════
// Forge Hub — CorePortal plate math (PR #164 hotspotMap.ts, math only)
// ════════════════════════════════════════════════════════════════
// W1-02 needs the frozen plate aspect + FORGE_CORE / PEDESTAL so the
// TSL emitter sits on the painted SF module. Panel slots live in
// glassSlots.ts / layouts.ts. HOTSPOTS and WORLD_MEDIA were not ported.
//
// Coordinates are percentages of the 1280×720 lock plate
// (world/LOCKED_HUB.jpg, owner canonical 2026-09-15).

export const PLATE_WIDTH_PX = 1280;
export const PLATE_HEIGHT_PX = 720;
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

/**
 * Flat SF emitter disc — primary portal (CorePortal). On LOCKED_HUB.jpg
 * the disc sits bottom-centre on the desk and projects the cone up to
 * HoloC (measured centroid ~x50 %, y78 %), not mid-wall like the old plate.
 */
export const FORGE_CORE: PercentCircle = {
  cx: 50,
  cy: 78,
  r: 12,
};

/** Desk platform carrying the disc (bottom band of LOCKED_HUB.jpg). */
export const PEDESTAL: PercentRect = {
  left: 33,
  top: 70,
  width: 34,
  height: 20,
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
