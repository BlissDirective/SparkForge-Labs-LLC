// ════════════════════════════════════════════════════════════════
// Forge Lab — hotspot hit map + bezel calibration
// ════════════════════════════════════════════════════════════════
// Coordinates are percentages of the *contained world plate*, not the
// viewport. The stage is a letterboxed 3:2 frame (the locked plates
// are 1536×1024). Overlay HTML/SVG twins use the same % box so they
// stay glued to the art when the window resizes.
//
// Pixel pixels are never the hit target. z1 is an invisible DOM/SVG
// map. To retune: open /dev/forge-lab?calibrate=1 and nudge these
// constants. Do not click the image.
//
// Hotspot video shell + Option A: still plates (loopVideo hook later).
// Plate may show faint empty cyan guide panes. HTML HoloPanel owns
// edge + frost + UI as one `perspective + rotateY` element.

export const PLATE_WIDTH_PX = 1536;
export const PLATE_HEIGHT_PX = 1024;
export const PLATE_ASPECT = `${PLATE_WIDTH_PX} / ${PLATE_HEIGHT_PX}`;
export const PLATE_ASPECT_RATIO = PLATE_WIDTH_PX / PLATE_HEIGHT_PX;

export const WORLD_MEDIA = {
  kind: 'still' as const,
  /** Locked indoor forge-lab plate — default idle world. */
  locked: '/forge-lab/00-locked-hub-dark-sf.png',
  monogram: '/forge-lab/00-sf-monogram-closeup.png',
  /** Wire a looping encode here later. Still plates are the mock. */
  loopVideo: null as string | null,
  keyframes: {
    idle: '/forge-lab/01-idle.png',
    charge: '/forge-lab/02-charge.png',
    emit: '/forge-lab/03-emit.png',
    docked: '/forge-lab/04-docked.png',
  },
} as const;

/**
 * Option A dock yaw (degrees). HTML owns the entire hologram.
 * Left slot is −HOLO_YAW_DEG, right is +HOLO_YAW_DEG.
 */
export const HOLO_YAW_DEG = 3;
/** Perspective distance for `rotateY` on docked hologram slots. */
export const HOLO_PERSPECTIVE_PX = 1200;

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

/** Inner glass of the hanging physical bezel — TopMonitor HUD fits 1:1. Yaw 0. */
export const TOP_MONITOR_GLASS: PercentRect = {
  left: 27.4,
  top: 2.6,
  width: 45.2,
  height: 17.8,
  yaw: 0,
};

/** Outer bezel (debug outline only — not a hit target). */
export const TOP_MONITOR_BEZEL: PercentRect = {
  left: 24.8,
  top: 0.8,
  width: 50.4,
  height: 21.4,
};

/** Circular SF hologram — primary portal emitter. */
export const FORGE_CORE: PercentCircle = {
  cx: 50,
  cy: 49.2,
  r: 9.4,
};

/** Pedestal under the core — optional secondary ignite hit. */
export const PEDESTAL: PercentRect = {
  left: 36.5,
  top: 70.5,
  width: 27,
  height: 18.5,
  yaw: 0,
};

/** Docked left hologram wing. Yaw toward SF (origin on the right edge). */
export const LEFT_HOLO_SLOT: PercentRect = {
  left: 7.2,
  top: 30.5,
  width: 20.8,
  height: 42,
  yaw: -HOLO_YAW_DEG,
};

/** Docked right hologram wing. Yaw toward SF (origin on the left edge). */
export const RIGHT_HOLO_SLOT: PercentRect = {
  left: 72,
  top: 30.5,
  width: 20.8,
  height: 42,
  yaw: HOLO_YAW_DEG,
};

/** Recessed wall niches — reserved for later lab crystals. */
export const LEFT_WALL_SLOT: PercentRect = {
  left: 1.6,
  top: 28,
  width: 6.4,
  height: 44,
};

export const RIGHT_WALL_SLOT: PercentRect = {
  left: 92,
  top: 28,
  width: 6.4,
  height: 44,
};

export type HotspotId =
  | 'forge-core'
  | 'top-monitor'
  | 'pedestal'
  | 'left-slot'
  | 'right-slot';

export interface HotspotDef {
  id: HotspotId;
  label: string;
  kind: 'circle' | 'rect';
  circle?: PercentCircle;
  rect?: PercentRect;
}

export const HOTSPOTS: readonly HotspotDef[] = [
  {
    id: 'forge-core',
    label: 'SparkForge core. Press Enter to emit hologram panels.',
    kind: 'circle',
    circle: FORGE_CORE,
  },
  {
    id: 'top-monitor',
    label: 'Top monitor bay. Lab status HUD when the core is docked.',
    kind: 'rect',
    rect: TOP_MONITOR_GLASS,
  },
  {
    id: 'pedestal',
    label: 'Forge pedestal. Same as the SparkForge core.',
    kind: 'rect',
    rect: PEDESTAL,
  },
  {
    id: 'left-slot',
    label: 'Left hologram dock. Lab list lands here after emit.',
    kind: 'rect',
    rect: LEFT_HOLO_SLOT,
  },
  {
    id: 'right-slot',
    label: 'Right hologram dock. Game bay and avatar tools land here.',
    kind: 'rect',
    rect: RIGHT_HOLO_SLOT,
  },
];

export function rectStyle(rect: PercentRect): {
  left: string;
  top: string;
  width: string;
  height: string;
} {
  return {
    left: `${rect.left}%`,
    top: `${rect.top}%`,
    width: `${rect.width}%`,
    height: `${rect.height}%`,
  };
}

/** Transform-origin faces the SF core so ±yaw folds the wings inward. */
export function slotOrigin(rect: PercentRect): string {
  const yaw = rect.yaw ?? 0;
  if (yaw < 0) return 'right center';
  if (yaw > 0) return 'left center';
  return 'center center';
}

export function slotTransform(rect: PercentRect): string {
  const yaw = rect.yaw ?? 0;
  return `perspective(${HOLO_PERSPECTIVE_PX}px) rotateY(${yaw}deg)`;
}

export function yawStyle(rect: PercentRect): {
  transform: string;
  transformOrigin: string;
} {
  return {
    transform: slotTransform(rect),
    transformOrigin: slotOrigin(rect),
  };
}

/** Shared box + yaw used by HoloPanels and calibrate hotspot outlines. */
export function dockSlotStyle(rect: PercentRect): {
  left: string;
  top: string;
  width: string;
  height: string;
  transform: string;
  transformOrigin: string;
} {
  return {
    ...rectStyle(rect),
    ...yawStyle(rect),
  };
}

export function circleStyle(circle: PercentCircle): {
  left: string;
  top: string;
  width: string;
  height: string;
} {
  return {
    left: `${circle.cx - circle.r}%`,
    top: `${circle.cy - circle.r}%`,
    width: `${circle.r * 2}%`,
    height: `${circle.r * 2}%`,
  };
}

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
