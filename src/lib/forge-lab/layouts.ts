// ════════════════════════════════════════════════════════════════
// ForgeLayout — named scene registry (light scaffold)
// ════════════════════════════════════════════════════════════════
// Slot rects are % of the 1536×1024 plate. HTML holograms + EmitterBeams
// read the *live* rect so interconnects stay glued when a layout morphs.
//
// hubSplit: TopMonitor + L/R wings (default hub).
// authMerged: L+R lerp into one wide center glass for sign-on HTML 1:1.
// Stub only — do not rebuild the real auth app onto this yet.

import {
  FORGE_CORE,
  LEFT_HOLO_SLOT,
  RIGHT_HOLO_SLOT,
  TOP_MONITOR_GLASS,
  type PercentRect,
} from './hotspotMap';

export type ForgeLayoutId = 'hubSplit' | 'authMerged';

export type ForgeSlotId = 'top' | 'left' | 'right' | 'center';

export interface ForgeLayout {
  id: ForgeLayoutId;
  slots: Partial<Record<ForgeSlotId, PercentRect>>;
}

/** Wide center glass — L+R merge target for sign-on HTML 1:1. */
export const AUTH_MERGED_CENTER: PercentRect = {
  left: 20,
  top: 24,
  width: 60,
  height: 44,
  yaw: 0,
};

export const FORGE_LAYOUTS: Record<ForgeLayoutId, ForgeLayout> = {
  hubSplit: {
    id: 'hubSplit',
    slots: {
      top: TOP_MONITOR_GLASS,
      left: LEFT_HOLO_SLOT,
      right: RIGHT_HOLO_SLOT,
    },
  },
  authMerged: {
    id: 'authMerged',
    slots: {
      top: TOP_MONITOR_GLASS,
      center: AUTH_MERGED_CENTER,
    },
  },
};

export const LAYOUT_MORPH_MS = 480;

export function isForgeLayoutId(value: string | null | undefined): value is ForgeLayoutId {
  return value === 'hubSplit' || value === 'authMerged';
}

export function rectCentroid(rect: PercentRect): { x: number; y: number } {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpRect(a: PercentRect, b: PercentRect, t: number): PercentRect {
  return {
    left: lerp(a.left, b.left, t),
    top: lerp(a.top, b.top, t),
    width: lerp(a.width, b.width, t),
    height: lerp(a.height, b.height, t),
    yaw: lerp(a.yaw ?? 0, b.yaw ?? 0, t),
  };
}

export function containsPoint(rect: PercentRect, x: number, y: number): boolean {
  return (
    x >= rect.left &&
    x <= rect.left + rect.width &&
    y >= rect.top &&
    y <= rect.top + rect.height
  );
}

/**
 * Core-facing edge of a live slot. Tracks the morphing rect (centroid
 * motion) so the beam does not draw through the glass.
 */
export function beamAttachPoint(
  rect: PercentRect,
  core = FORGE_CORE,
): { x: number; y: number } {
  const c = rectCentroid(rect);
  const right = rect.left + rect.width;
  const bottom = rect.top + rect.height;
  if (core.cy >= bottom) return { x: c.x, y: bottom };
  if (core.cy <= rect.top) return { x: c.x, y: rect.top };
  if (core.cx >= right) return { x: right, y: c.y };
  if (core.cx <= rect.left) return { x: rect.left, y: c.y };
  return c;
}

export interface LiveBeam {
  id: ForgeSlotId;
  x: number;
  y: number;
  fromX: number;
  fromY: number;
}

export function liveBeams(
  slots: ReadonlyArray<{ id: ForgeSlotId; rect: PercentRect }>,
): LiveBeam[] {
  return slots
    .filter((s) => !containsPoint(s.rect, FORGE_CORE.cx, FORGE_CORE.cy))
    .map((s) => {
      const hit = beamAttachPoint(s.rect);
      return {
        id: s.id,
        x: hit.x,
        y: hit.y,
        fromX: FORGE_CORE.cx,
        fromY: FORGE_CORE.cy,
      };
    });
}

/** Morph a hub wing toward the merged center. t=0 split, t=1 merged. */
export function morphWingRect(side: 'left' | 'right', t: number): PercentRect {
  const start = side === 'left' ? LEFT_HOLO_SLOT : RIGHT_HOLO_SLOT;
  return lerpRect(start, AUTH_MERGED_CENTER, t);
}

export function resolvedSlots(t: number): {
  top: PercentRect;
  left: PercentRect;
  right: PercentRect;
  center: PercentRect;
  merged: boolean;
} {
  const clamped = Math.min(1, Math.max(0, t));
  return {
    top: TOP_MONITOR_GLASS,
    left: morphWingRect('left', clamped),
    right: morphWingRect('right', clamped),
    center: AUTH_MERGED_CENTER,
    merged: clamped >= 0.999,
  };
}

/** Live beam slots for the current morph + portal state. */
export function beamSlotsForState(
  t: number,
  wingsLive: boolean,
): Array<{ id: ForgeSlotId; rect: PercentRect }> {
  const slots = resolvedSlots(t);
  const live: Array<{ id: ForgeSlotId; rect: PercentRect }> = [
    { id: 'top', rect: slots.top },
  ];
  if (slots.merged) {
    live.push({ id: 'center', rect: slots.center });
  } else if (wingsLive) {
    live.push({ id: 'left', rect: slots.left });
    live.push({ id: 'right', rect: slots.right });
  }
  return live;
}
