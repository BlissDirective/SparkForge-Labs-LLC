// ════════════════════════════════════════════════════════════════
// Forge Hub — lock-pose glass slots (PR #164 hotspotMap.ts, math only)
// ════════════════════════════════════════════════════════════════
// W1-03 world materials overlay the three painted cyan frames on
// LOCKED_HUB.jpg: an equal trio (HoloL / HoloC / HoloR), no top banner.
// Rects are measured from the canonical plate (2026-09-15): panels span
// x 10.9–35.2 / 37.5–62.5 / 64.8–89.1 %, tops ~13.5 %. Lock-pose == the
// live `hubSplit` equal trio; W2 `layouts.ts` re-seats for `welcome`.
//
// Not ported: HOTSPOTS, WORLD_MEDIA, hit-map, hotspot shell CSS.

import type { CSSProperties } from 'react';
import {
  type PercentRect,
  isPercentRect,
} from './coreMap';
import type { ForgePanelId } from './types';

export const HOLO_YAW_DEG = 2;
export const HOLO_PERSPECTIVE_PX = 1200;

export type GlassSlotId = Exclude<ForgePanelId, null>;

export interface GlassLockSlot extends PercentRect {
  id: GlassSlotId;
}

/** Left hologram of the equal trio. Slight yaw toward the core. */
export const HOLO_L_LOCK: GlassLockSlot = {
  id: 'holoL',
  left: 10.9,
  top: 13.5,
  width: 24.3,
  height: 45,
  yaw: -HOLO_YAW_DEG,
};

/** Center hologram — a touch taller (receives the emitter cone). */
export const HOLO_C_LOCK: GlassLockSlot = {
  id: 'holoC',
  left: 37.5,
  top: 13.5,
  width: 25,
  height: 48,
  yaw: 0,
};

/** Right hologram of the equal trio. Slight yaw toward the core. */
export const HOLO_R_LOCK: GlassLockSlot = {
  id: 'holoR',
  left: 64.8,
  top: 13.5,
  width: 24.3,
  height: 45,
  yaw: HOLO_YAW_DEG,
};

export const GLASS_LOCK_SLOTS: Record<GlassSlotId, GlassLockSlot> = {
  holoL: HOLO_L_LOCK,
  holoC: HOLO_C_LOCK,
  holoR: HOLO_R_LOCK,
};

export const GLASS_LOCK_SLOT_LIST: readonly GlassLockSlot[] = [
  HOLO_L_LOCK,
  HOLO_C_LOCK,
  HOLO_R_LOCK,
];

export function slotOrigin(rect: PercentRect): 'right center' | 'left center' | 'center center' {
  const yaw = rect.yaw ?? 0;
  if (yaw < 0) return 'right center';
  if (yaw > 0) return 'left center';
  return 'center center';
}

/** PR #164 `slotTransform` — live DOM uses `cssYawTransform` (clamps, yaw 0 → none). */
export function slotTransform(rect: PercentRect): string {
  const yaw = rect.yaw ?? 0;
  return `perspective(${HOLO_PERSPECTIVE_PX}px) rotateY(${yaw}deg)`;
}

export interface GlassLocalRect {
  x: number;
  y: number;
  width: number;
  height: number;
  yawRad: number;
  /** Local X of the yaw/breathe pivot relative to the slot center. */
  pivotX: number;
}

/** Plate-percent box → local XY on a camera-facing plate plane (y-up). */
export function percentRectToLocal(
  rect: PercentRect,
  plateWidth: number,
  plateHeight: number,
): GlassLocalRect {
  const cx = (rect.left + rect.width / 2) / 100;
  const cy = (rect.top + rect.height / 2) / 100;
  const width = (rect.width / 100) * plateWidth;
  const height = (rect.height / 100) * plateHeight;
  const yaw = rect.yaw ?? 0;
  let pivotX = 0;
  if (yaw < 0) pivotX = width / 2;
  else if (yaw > 0) pivotX = -width / 2;
  return {
    x: (cx - 0.5) * plateWidth,
    y: (0.5 - cy) * plateHeight,
    width,
    height,
    yawRad: (yaw * Math.PI) / 180,
    pivotX,
  };
}

export function cssGlassStyle(rect: PercentRect): CSSProperties {
  const yaw = rect.yaw ?? 0;
  return {
    left: `${rect.left}%`,
    top: `${rect.top}%`,
    width: `${rect.width}%`,
    height: `${rect.height}%`,
    transformOrigin: slotOrigin(rect),
    ['--fh-yaw' as string]: `${yaw}deg`,
  };
}

export function assertLockSlots(): boolean {
  return GLASS_LOCK_SLOT_LIST.every((slot) => isPercentRect(slot));
}
