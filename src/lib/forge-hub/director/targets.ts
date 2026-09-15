// ════════════════════════════════════════════════════════════════
// Bind Director morphs to Stagehand W2-01 layout APIs (PR #176).
// Stagehand owns registry / projection / HoloPanel. Director does
// not invent layout numbers — GSAP lerps `registerMorphTargets`.
// ════════════════════════════════════════════════════════════════

import type { PercentRect } from '@/lib/forge-hub/coreMap';
import type { GlassSlotId } from '@/lib/forge-hub/glassSlots';
import {
  HUBSPLIT_HOLO_C,
  LAYOUT_MORPH_MS,
  glassSlotsForView,
  lerpRect,
  registerMorphTargets,
  type LayoutSlot,
} from '@/lib/forge-hub/layouts';
import type { ForgeMode } from '@/lib/forge-hub/types';
import { peekDirectorClock, type DirectorClock } from './clock';

export { HUBSPLIT_HOLO_C, LAYOUT_MORPH_MS, registerMorphTargets };

const SLOT_IDS: readonly GlassSlotId[] = ['holoL', 'holoC', 'holoR'];

export function morphTargetsFor(
  mode: ForgeMode,
): Record<GlassSlotId, LayoutSlot> {
  return registerMorphTargets(mode);
}

export function copyPercentRect(rect: PercentRect): PercentRect {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    yaw: rect.yaw ?? 0,
  };
}

export function lerpMorphSlots(
  from: ForgeMode,
  to: ForgeMode,
  t: number,
): Record<GlassSlotId, LayoutSlot> {
  const a = registerMorphTargets(from);
  const b = registerMorphTargets(to);
  const clamped = Math.min(1, Math.max(0, t));
  const out = {} as Record<GlassSlotId, LayoutSlot>;
  for (const id of SLOT_IDS) {
    const rect = lerpRect(a[id], b[id], clamped);
    out[id] = {
      ...b[id],
      ...rect,
      visible: a[id].visible || b[id].visible,
      reading: clamped < 0.5 ? a[id].reading : b[id].reading,
    };
  }
  return out;
}

export function scaleVsHubSplit(slot: PercentRect, hub: PercentRect): number {
  if (hub.width === 0) return 1;
  return slot.width / hub.width;
}

/** Write Stagehand-lerped rects onto the GSAP clock (HoloC live seat). */
export function applyLiveSlotsToClock(clock: DirectorClock): void {
  const from = clock.layoutFrom;
  const to = clock.layoutTo;
  if (!from || !to) return;
  const live = lerpMorphSlots(from, to, clock.layoutT);
  const hub = registerMorphTargets('hubSplit');
  clock.holoL = copyPercentRect(live.holoL);
  clock.holoC = copyPercentRect(live.holoC);
  clock.holoR = copyPercentRect(live.holoR);
  clock.holoLScale = scaleVsHubSplit(live.holoL, hub.holoL);
  clock.holoCScale = scaleVsHubSplit(live.holoC, hub.holoC);
  clock.holoRScale = scaleVsHubSplit(live.holoR, hub.holoR);
}

export function snapClockToMode(clock: DirectorClock, mode: ForgeMode): void {
  clock.layoutFrom = mode;
  clock.layoutTo = mode;
  clock.layoutT = 1;
  applyLiveSlotsToClock(clock);
}

export function liveDirectorSlots(
  mode: ForgeMode,
  poseLock: boolean,
): LayoutSlot[] {
  if (poseLock) return glassSlotsForView(mode, true);
  const clock = peekDirectorClock();
  if (clock.layoutFrom && clock.layoutTo) {
    const live = lerpMorphSlots(clock.layoutFrom, clock.layoutTo, clock.layoutT);
    return SLOT_IDS.map((id) => live[id]).filter((slot) => slot.visible);
  }
  return glassSlotsForView(mode, false);
}

export function liveDirectorSlot(
  id: GlassSlotId,
  mode: ForgeMode,
  poseLock: boolean,
): LayoutSlot | null {
  if (poseLock) {
    return glassSlotsForView(mode, true).find((slot) => slot.id === id) ?? null;
  }
  const clock = peekDirectorClock();
  if (clock.layoutFrom && clock.layoutTo) {
    const slot = lerpMorphSlots(clock.layoutFrom, clock.layoutTo, clock.layoutT)[
      id
    ];
    return slot.visible ? slot : null;
  }
  return glassSlotsForView(mode, false).find((slot) => slot.id === id) ?? null;
}
