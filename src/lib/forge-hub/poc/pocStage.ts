// ════════════════════════════════════════════════════════════════
// Forge Stage POC — single-clock pose model (live-object approach)
// ════════════════════════════════════════════════════════════════
// Proof-of-concept for the "five live rendered objects on an empty
// room" direction (owner 2026-09). Every object's pose is a pure
// function of ONE scalar `stage` in [0,1]:
//   0.0 = welcome   0.5 = hub (equal trio)   1.0 = playStage (merged)
// so the whole scene morphs as one coherent thing — no baked holograms
// to drift out of alignment. Units are the POC world (camera-facing
// plane at z=0, ~x[-8,8] y[-4.5,4.5], 16:9). This is deliberately
// NOT the production layout registry (`layouts.ts`, percent-of-plate);
// it is the throwaway-geometry stand-in the authored GLBs replace.
// See docs/forge-hub/FORGE_STAGE_PIPELINE.md.

export type PocContent = 'welcome' | 'hub' | 'play';

export interface PocSlot {
  /** world X of the screen centre */
  x: number;
  /** world Y of the screen centre */
  y: number;
  /** world width (plane scale X) */
  sx: number;
  /** world height (plane scale Y) */
  sy: number;
  /** yaw in degrees (toward the core) */
  yaw: number;
  /** opacity 0..1 (side panels fade to 0 as they merge) */
  a: number;
}

export interface PocPose {
  L: PocSlot;
  C: PocSlot;
  R: PocSlot;
  /** emitter emission 0..1 (drives core glow, beams, key light) */
  emit: number;
  /** beam intensity 0..1 */
  beam: number;
  /** room dim 0..1 (playStage darkens the backdrop) */
  dim: number;
  /** content drawn on the centre screen */
  content: PocContent;
}

interface PocKeyframe extends Omit<PocPose, 'content'> {
  content: PocContent;
}

/** Named stops on the single `stage` axis. */
export const POC_STAGE_VALUE = { welcome: 0, hub: 0.5, play: 1 } as const;

export type PocStageName = keyof typeof POC_STAGE_VALUE;

/** Keyframes at stage 0 / 0.5 / 1. Every live mode is a sample between them. */
export const POC_KEYFRAMES: Record<'0' | '0.5' | '1', PocKeyframe> = {
  '0': {
    L: { x: -5.1, y: 1.15, sx: 3.0, sy: 2.95, yaw: 9, a: 1 },
    C: { x: 0, y: 1.15, sx: 3.7, sy: 3.95, yaw: 0, a: 1 },
    R: { x: 5.1, y: 1.15, sx: 3.0, sy: 2.95, yaw: -9, a: 1 },
    emit: 0.55,
    beam: 0.5,
    dim: 0.0,
    content: 'welcome',
  },
  '0.5': {
    L: { x: -5.0, y: 1.1, sx: 3.5, sy: 3.4, yaw: 10, a: 1 },
    C: { x: 0, y: 1.2, sx: 3.7, sy: 3.7, yaw: 0, a: 1 },
    R: { x: 5.0, y: 1.1, sx: 3.5, sy: 3.4, yaw: -10, a: 1 },
    emit: 0.72,
    beam: 0.7,
    dim: 0.0,
    content: 'hub',
  },
  '1': {
    L: { x: 0, y: 0.9, sx: 6.0, sy: 5.0, yaw: 0, a: 0 },
    C: { x: 0, y: 0.9, sx: 11.4, sy: 6.2, yaw: 0, a: 1 },
    R: { x: 0, y: 0.9, sx: 6.0, sy: 5.0, yaw: 0, a: 0 },
    emit: 1.0,
    beam: 1.0,
    dim: 0.55,
    content: 'play',
  },
};

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function lerpSlot(a: PocSlot, b: PocSlot, t: number): PocSlot {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    sx: lerp(a.sx, b.sx, t),
    sy: lerp(a.sy, b.sy, t),
    yaw: lerp(a.yaw, b.yaw, t),
    a: lerp(a.a, b.a, t),
  };
}

/** Centre-screen content by nearest stop (welcome < 0.25 ≤ hub < 0.75 ≤ play). */
export function contentForStage(stage: number): PocContent {
  const s = clamp01(stage);
  return s < 0.25 ? 'welcome' : s < 0.75 ? 'hub' : 'play';
}

/** The whole scene pose for a given `stage` — one clock, all objects. */
export function samplePocPose(stage: number): PocPose {
  const s = clamp01(stage);
  const lo = s < 0.5 ? '0' : '0.5';
  const hi = s < 0.5 ? '0.5' : '1';
  const loVal = s < 0.5 ? 0 : 0.5;
  const hiVal = s < 0.5 ? 0.5 : 1;
  const t = (s - loVal) / (hiVal - loVal);
  const A = POC_KEYFRAMES[lo];
  const B = POC_KEYFRAMES[hi];
  return {
    L: lerpSlot(A.L, B.L, t),
    C: lerpSlot(A.C, B.C, t),
    R: lerpSlot(A.R, B.R, t),
    emit: lerp(A.emit, B.emit, t),
    beam: lerp(A.beam, B.beam, t),
    dim: lerp(A.dim, B.dim, t),
    content: contentForStage(s),
  };
}

/** Stage name the scrubber value currently reads as (for the HUD). */
export function stageNameFor(stage: number): PocStageName {
  const s = clamp01(stage);
  return s < 0.25 ? 'welcome' : s < 0.75 ? 'hub' : 'play';
}
