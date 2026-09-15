// ════════════════════════════════════════════════════════════════
// Mutable Director clock — GSAP tweens this object. Glass / camera
// read it in useFrame (no Zustand). React HUDs subscribe via version.
// Live HoloL/C/R rects come from Stagehand `registerMorphTargets`.
// ════════════════════════════════════════════════════════════════

import type { PercentRect } from '@/lib/forge-hub/coreMap';
import { registerMorphTargets } from '@/lib/forge-hub/layouts';
import type { ForgeMode } from '@/lib/forge-hub/types';
import type { MotionBibleId } from './ids';
import { clampCameraDollyPercent, REDUCED_MOTION_CROSSFADE_MS } from './timings';

const HUB_SPLIT = registerMorphTargets('hubSplit');

export interface DirectorClock {
  id: MotionBibleId | null;
  progress: number;
  durationMs: number;
  freezeBreathe: boolean;
  layoutFrom: ForgeMode | null;
  layoutTo: ForgeMode | null;
  /** 0..1 lerp between Stagehand from/to targets (`LAYOUT_MORPH_MS`). */
  layoutT: number;
  /** Cinematic empty→pose scale. Morphs that only lerp rects stay at 1. */
  appearScale: number;
  holoL: PercentRect;
  holoC: PercentRect;
  holoR: PercentRect;
  holoLScale: number;
  holoCScale: number;
  holoRScale: number;
  contentOut: number;
  contentIn: number;
  bloom: number;
  beams: number;
  cameraDollyPercent: number;
  sparkyHop: number;
  sparkyPing: number;
  reducedMotionCrossfade: number;
  skippable: boolean;
  /** PlayStage merge dim / Whisper trio dim. 0 = full, 1 = dimmed. */
  roomDim: number;
  /** HoloBubble expand. 0 = rest / hidden, 1 = whisper size. */
  bubbleScale: number;
}

export const DIRECTOR_CLOCK_DEFAULTS: DirectorClock = {
  id: null,
  progress: 0,
  durationMs: 0,
  freezeBreathe: false,
  layoutFrom: null,
  layoutTo: null,
  layoutT: 1,
  appearScale: 1,
  holoL: { ...HUB_SPLIT.holoL },
  holoC: { ...HUB_SPLIT.holoC },
  holoR: { ...HUB_SPLIT.holoR },
  holoLScale: 1,
  holoCScale: 1,
  holoRScale: 1,
  contentOut: 1,
  contentIn: 0,
  bloom: 0,
  beams: 0,
  cameraDollyPercent: 0,
  sparkyHop: 0,
  sparkyPing: 0,
  reducedMotionCrossfade: 0,
  skippable: false,
  roomDim: 0,
  bubbleScale: 0,
};

const live: DirectorClock = {
  ...DIRECTOR_CLOCK_DEFAULTS,
  holoL: { ...DIRECTOR_CLOCK_DEFAULTS.holoL },
  holoC: { ...DIRECTOR_CLOCK_DEFAULTS.holoC },
  holoR: { ...DIRECTOR_CLOCK_DEFAULTS.holoR },
};

let version = 0;
const listeners = new Set<() => void>();

export function peekDirectorClock(): DirectorClock {
  return live;
}

export function getDirectorClockVersion(): number {
  return version;
}

export function subscribeDirectorClock(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function bump(): void {
  live.cameraDollyPercent = clampCameraDollyPercent(live.cameraDollyPercent);
  version += 1;
  for (const listener of listeners) listener();
}

export function resetDirectorClock(
  patch: Partial<DirectorClock> = {},
): DirectorClock {
  Object.assign(live, DIRECTOR_CLOCK_DEFAULTS, patch);
  live.holoL = { ...(patch.holoL ?? DIRECTOR_CLOCK_DEFAULTS.holoL) };
  live.holoC = { ...(patch.holoC ?? DIRECTOR_CLOCK_DEFAULTS.holoC) };
  live.holoR = { ...(patch.holoR ?? DIRECTOR_CLOCK_DEFAULTS.holoR) };
  bump();
  return live;
}

export function publishDirectorClock(): void {
  bump();
}

export function setDirectorClockId(id: MotionBibleId | null): void {
  live.id = id;
  bump();
}

/** Live MOTION_BIBLE RM substitute: 200 ms crossfade, no cinematic tokens. */
export function isDirectorRmCrossfade(clock: DirectorClock): boolean {
  return (
    clock.durationMs === REDUCED_MOTION_CROSSFADE_MS &&
    clock.id != null &&
    clock.id !== 'welcome-idle'
  );
}
