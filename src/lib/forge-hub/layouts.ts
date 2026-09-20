// ════════════════════════════════════════════════════════════════
// Forge Hub — layout registry (PR #164 layouts.ts, re-seated)
// ════════════════════════════════════════════════════════════════
// Port: named layouts, PercentRect lerp, rectCentroid, containsPoint,
// beamAttachPoint (live-rect, core-facing edge), liveBeams,
// resolvedSlots, beamSlotsForState.
//
// Do not keep `authMerged` as a mode. `AUTH_MERGED_CENTER` numbers
// seed `playStage` (decision 7 / PR164_PORT_LIST).
//
// Geometric caveat: #164 hubSplit was TopMonitor + L/R wings. Locked
// Forge Hub hubSplit is the equal trio HoloL / HoloC / HoloR. W2
// re-seats HoloC from the painted top seed (`HOLO_C_LOCK`) to a
// center reading plate. `?pose=lock` keeps the W1-03 top trio for
// SSIM. Director owns morph clocks — this module is poses + math.
//
// LAYOUT_MORPH_MS: #164 used 480. MOTION_BIBLE `slotSlide` is 420 ms
// (interactive slab window). Stagehand ships 420; changing it is
// Tier 1 with Director.

import {
  FORGE_CORE,
  PLATE_HEIGHT_PX,
  PLATE_WIDTH_PX,
  type PercentRect,
} from './coreMap';
import {
  HOLO_C_LOCK,
  HOLO_L_LOCK,
  HOLO_R_LOCK,
  percentRectToLocal,
  slotOrigin,
  type GlassSlotId,
} from './glassSlots';
import type { ForgeMode } from './types';

export type ForgeLayoutId = ForgeMode | 'lock';

export interface LayoutSlot extends PercentRect {
  id: GlassSlotId;
  /** Forms, games, or >2 lines of body text — yaw snaps to 0. */
  reading: boolean;
  visible: boolean;
}

export interface ForgeLayout {
  id: ForgeLayoutId;
  slots: Record<GlassSlotId, LayoutSlot>;
}

export interface LiveBeam {
  id: GlassSlotId;
  x: number;
  y: number;
  fromX: number;
  fromY: number;
}

/** MOTION_BIBLE `slotSlide` / interactive slab window. #164 was 480. */
export const LAYOUT_MORPH_MS = 420;

/** PR #164 seed — not used at runtime. Documented for the port. */
export const LAYOUT_MORPH_MS_PR164 = 480;

/** Welcome sides vs hubSplit (TAP §2.9 / MOTION_BIBLE welcome-idle). */
export const WELCOME_SIDE_SCALE = 0.85;

/**
 * PlayStage merge-target seed — the three slabs merge into one game slab.
 * Owner call (2026-09-19): tall, spec-literal ~70 % viewport width × ~73 %
 * height (TAP §2.7 / MOTION_BIBLE §5.4), re-read off LOCKED_HUB.jpg. Top
 * aligns with the painted glass (13.5 %); the slab reaches DOWN over the
 * bottom-centre SF emitter disc (FORGE_CORE cy 78) so the merged glass
 * englobes the core and the room dims behind it. Because the slab now
 * contains the core, `liveBeams` draws no external cone in the merged
 * state (was a short cone under the old y24–68 seed). Not a live
 * `authMerged` mode.
 */
export const PLAYSTAGE_CENTER: PercentRect = {
  left: 15,
  top: 13.5,
  width: 70,
  height: 73,
  yaw: 0,
};

/** @see PLAYSTAGE_CENTER — #164 name kept as an alias for tests. */
export const AUTH_MERGED_CENTER = PLAYSTAGE_CENTER;

/**
 * hubSplit HoloC — the "today's mission" / welcome-login reading plate.
 * Re-read off LOCKED_HUB.jpg (2026-09-19, W1-05): seated in the painted
 * glass band (top 13.5 %, bottom 62.5 %) so it clears the desk edge (~70 %)
 * and the emitter disc (FORGE_CORE cy 78) the old y24–72 seed dipped into.
 * Centred on x50 with ~1.8 % symmetric gaps to the lock wings (L right
 * edge 35.2 %, R left edge 64.8 %); a touch wider/taller than HOLO_C_LOCK
 * so it reads as the focal plate. Lock pose still uses `HOLO_C_LOCK`, so
 * SSIM / `?pose=lock` is unchanged.
 */
export const HUBSPLIT_HOLO_C: PercentRect = {
  left: 37,
  top: 13.5,
  width: 26,
  height: 49,
  yaw: 0,
};

const SLOT_IDS: readonly GlassSlotId[] = ['holoL', 'holoC', 'holoR'];

function slot(
  id: GlassSlotId,
  rect: PercentRect,
  reading: boolean,
  visible = true,
): LayoutSlot {
  return {
    id,
    ...rect,
    yaw: reading ? 0 : (rect.yaw ?? 0),
    reading,
    visible,
  };
}

export function scalePercentRect(rect: PercentRect, scale: number): PercentRect {
  const origin = slotOrigin(rect);
  const width = rect.width * scale;
  const height = rect.height * scale;
  const cy = rect.top + rect.height / 2;
  let left = rect.left;
  if (origin === 'right center') left = rect.left + rect.width - width;
  else if (origin === 'center center') left = rect.left + (rect.width - width) / 2;
  return {
    ...rect,
    left,
    top: cy - height / 2,
    width,
    height,
  };
}

function trio(
  id: ForgeLayoutId,
  left: PercentRect,
  center: PercentRect,
  right: PercentRect,
  reading: { l: boolean; c: boolean; r: boolean } = {
    l: true,
    c: true,
    r: true,
  },
): ForgeLayout {
  return {
    id,
    slots: {
      holoL: slot('holoL', left, reading.l),
      holoC: slot('holoC', center, reading.c),
      holoR: slot('holoR', right, reading.r),
    },
  };
}

function hiddenAt(
  id: GlassSlotId,
  rect: PercentRect,
  reading: boolean,
): LayoutSlot {
  return slot(id, rect, reading, false);
}

/** W1-03 painted trio — SSIM / `?pose=lock` only. HoloC = top seed. */
export const LOCK_POSE_LAYOUT: ForgeLayout = {
  id: 'lock',
  slots: {
    holoL: slot('holoL', HOLO_L_LOCK, false),
    holoC: slot('holoC', HOLO_C_LOCK, false),
    holoR: slot('holoR', HOLO_R_LOCK, false),
  },
};

const HUB_SPLIT_LAYOUT = trio(
  'hubSplit',
  HOLO_L_LOCK,
  HUBSPLIT_HOLO_C,
  HOLO_R_LOCK,
);

const WELCOME_LAYOUT = trio(
  'welcome',
  scalePercentRect(HOLO_L_LOCK, WELCOME_SIDE_SCALE),
  HUBSPLIT_HOLO_C,
  scalePercentRect(HOLO_R_LOCK, WELCOME_SIDE_SCALE),
);

const PLAY_STAGE_LAYOUT: ForgeLayout = {
  id: 'playStage',
  slots: {
    holoL: hiddenAt('holoL', PLAYSTAGE_CENTER, true),
    holoC: slot('holoC', PLAYSTAGE_CENTER, true),
    holoR: hiddenAt('holoR', PLAYSTAGE_CENTER, true),
  },
};

// Live-mode trios re-read off LOCKED_HUB.jpg (2026-09-19, W1-05). Every
// resting panel sits in the painted glass band (top ≥13.5 %, bottom ≤62.5 %)
// so it clears the desk edge (~70 %) and the bottom-centre emitter disc
// (FORGE_CORE cy 78). Symmetric compositions are centred on x50. The old
// rects were authored for the superseded top-monitor plate and pushed panel
// bottoms to y66–94 (onto the desk / disc).

// labsBrowse: dominant centre hero (selected lab) between two thin columns
// (lab list · detail+progress). TAP route `/labs`.
const LABS_BROWSE_LAYOUT = trio(
  'labsBrowse',
  { left: 6, top: 15, width: 17, height: 45, yaw: 0 },
  { left: 26, top: 13.5, width: 48, height: 49, yaw: 0 },
  { left: 77, top: 15, width: 17, height: 45, yaw: 0 },
);

// focus: one large centre reading plate with the two side wings tucked to
// thin ±8° lips. TAP routes `/labs/[labId]`, `/mastery`, `/competencies`.
const FOCUS_LAYOUT = trio(
  'focus',
  { left: 2.5, top: 20, width: 11, height: 36, yaw: -8 },
  { left: 16, top: 13.5, width: 68, height: 49, yaw: 0 },
  { left: 86.5, top: 20, width: 11, height: 36, yaw: 8 },
  { l: false, c: true, r: false },
);

// dual: two strong side panels over a wide, short centre chart band
// (lifted up off the emitter into the glass band). TAP routes `/progress`
// (stats · chart · detail) and `/buddies` (friends · — · invite).
const DUAL_LAYOUT = trio(
  'dual',
  { left: 5, top: 13.5, width: 41, height: 40, yaw: 0 },
  { left: 8, top: 55, width: 84, height: 9, yaw: 0 },
  { left: 54, top: 13.5, width: 41, height: 40, yaw: 0 },
);

// avatarStudio: centred child-avatar plate flanked by stats and the Sparky
// outfit rack. TAP route `/profile`.
const AVATAR_STUDIO_LAYOUT = trio(
  'avatarStudio',
  { left: 5, top: 16, width: 22, height: 44, yaw: 0 },
  { left: 33, top: 13.5, width: 34, height: 49, yaw: 0 },
  { left: 73, top: 16, width: 22, height: 44, yaw: 0 },
);

export const FORGE_LAYOUTS: Record<ForgeMode, ForgeLayout> = {
  welcome: WELCOME_LAYOUT,
  hubSplit: HUB_SPLIT_LAYOUT,
  labsBrowse: LABS_BROWSE_LAYOUT,
  gameLobby: { ...HUB_SPLIT_LAYOUT, id: 'gameLobby' },
  playStage: PLAY_STAGE_LAYOUT,
  avatarStudio: AVATAR_STUDIO_LAYOUT,
  settingsDock: { ...HUB_SPLIT_LAYOUT, id: 'settingsDock' },
  cinematic: { ...WELCOME_LAYOUT, id: 'cinematic' },
  focus: FOCUS_LAYOUT,
  dual: DUAL_LAYOUT,
  flat: {
    id: 'flat',
    slots: {
      holoL: hiddenAt('holoL', HOLO_L_LOCK, false),
      holoC: hiddenAt('holoC', HUBSPLIT_HOLO_C, true),
      holoR: hiddenAt('holoR', HOLO_R_LOCK, false),
    },
  },
};

export const FORGE_LAYOUT_MODES: readonly ForgeMode[] = [
  'welcome',
  'hubSplit',
  'labsBrowse',
  'gameLobby',
  'playStage',
  'avatarStudio',
  'settingsDock',
  'cinematic',
  'focus',
  'dual',
  'flat',
];

export function isForgeMode(value: string | null | undefined): value is ForgeMode {
  return !!value && value in FORGE_LAYOUTS;
}

export function layoutForMode(mode: ForgeMode): ForgeLayout {
  return FORGE_LAYOUTS[mode];
}

export function layoutForView(mode: ForgeMode, poseLock: boolean): ForgeLayout {
  return poseLock ? LOCK_POSE_LAYOUT : layoutForMode(mode);
}

export function layoutSlotForView(
  id: GlassSlotId,
  mode: ForgeMode,
  poseLock: boolean,
): LayoutSlot {
  return layoutForView(mode, poseLock).slots[id];
}

export function visibleLayoutSlots(layout: ForgeLayout): LayoutSlot[] {
  return SLOT_IDS.map((id) => layout.slots[id]).filter((s) => s.visible);
}

export function glassSlotsForView(
  mode: ForgeMode,
  poseLock: boolean,
): LayoutSlot[] {
  return visibleLayoutSlots(layoutForView(mode, poseLock));
}

/**
 * Director hook — per-slot pose targets for a mode. Stagehand does
 * not tween; GSAP reads these later (W2-02).
 */
export function registerMorphTargets(
  mode: ForgeMode,
): Record<GlassSlotId, LayoutSlot> {
  return layoutForMode(mode).slots;
}

export function slotContentSizePx(rect: PercentRect): {
  width: number;
  height: number;
} {
  return {
    width: (rect.width / 100) * PLATE_WIDTH_PX,
    height: (rect.height / 100) * PLATE_HEIGHT_PX,
  };
}

export function slotToWorld(
  rect: PercentRect,
  plateWidth: number,
  plateHeight: number,
) {
  return percentRectToLocal(rect, plateWidth, plateHeight);
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
 * Core-facing edge of a live slot. Tracks the morphing rect so a
 * later beam mesh does not draw through the glass (PR #164 finding).
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
  if (core.cx <= rect.left) return { x: leftEdge(rect), y: c.y };
  return c;
}

function leftEdge(rect: PercentRect): number {
  return rect.left;
}

export function liveBeams(
  slots: ReadonlyArray<{ id: GlassSlotId; rect: PercentRect }>,
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

/** Morph a hub wing toward the PlayStage merge target. t=0 split, t=1 merged. */
export function morphWingRect(side: 'left' | 'right', t: number): PercentRect {
  const start = side === 'left' ? HOLO_L_LOCK : HOLO_R_LOCK;
  return lerpRect(start, PLAYSTAGE_CENTER, t);
}

export function resolvedSlots(t: number): {
  holoL: PercentRect;
  holoC: PercentRect;
  holoR: PercentRect;
  merged: boolean;
} {
  const clamped = Math.min(1, Math.max(0, t));
  return {
    holoL: morphWingRect('left', clamped),
    holoC: lerpRect(HUBSPLIT_HOLO_C, PLAYSTAGE_CENTER, clamped),
    holoR: morphWingRect('right', clamped),
    merged: clamped >= 0.999,
  };
}

/**
 * Live beam slots for the current morph + portal state.
 * Retargeted from #164 top/left/right/center → HoloL/C/R.
 * Idle (wingsLive=false) = HoloC only (was top HUD). Docked = trio.
 * Merged PlayStage still lists HoloC; liveBeams drops it when the
 * rect contains the core.
 */
export function beamSlotsForState(
  t: number,
  wingsLive: boolean,
): Array<{ id: GlassSlotId; rect: PercentRect }> {
  const slots = resolvedSlots(t);
  if (slots.merged) {
    return [{ id: 'holoC', rect: slots.holoC }];
  }
  const live: Array<{ id: GlassSlotId; rect: PercentRect }> = [
    { id: 'holoC', rect: slots.holoC },
  ];
  if (wingsLive) {
    live.push({ id: 'holoL', rect: slots.holoL });
    live.push({ id: 'holoR', rect: slots.holoR });
  }
  return live;
}
