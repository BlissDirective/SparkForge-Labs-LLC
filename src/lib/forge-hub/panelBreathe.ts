// ════════════════════════════════════════════════════════════════
// Forge Hub — panelBreathe (MOTION_BIBLE ambient token)
// ════════════════════════════════════════════════════════════════
// Ambient only — not a Director morph. ~3 s loop, scale 98–102 %.
// Stagehand owns the loop (ForgeGlassSlabs useFrame). Director must
// not start a competing breathe tween; morphs snap scale to 1.0 via
// freezeBreathe on the Director clock, then resume this loop.
// `prefers-reduced-motion` and `?pose=lock` freeze at 1.0 (no loop).
// RM substitute for first paint is a 200 ms crossfade (CSS).

export const PANEL_BREATHE_PERIOD_S = 3;
export const PANEL_BREATHE_SCALE_MIN = 0.98;
export const PANEL_BREATHE_SCALE_MAX = 1.02;
export const REDUCED_MOTION_CROSSFADE_MS = 200;

/** Stagger so the trio does not pulse in lockstep. */
export const PANEL_BREATHE_PHASE_S = {
  holoL: 0,
  holoC: 1.05,
  holoR: 2.1,
} as const;

export function panelBreatheScale(
  elapsedSec: number,
  phaseOffsetSec: number,
  freeze: boolean,
): number {
  if (freeze) return 1;
  const t = (elapsedSec + phaseOffsetSec) / PANEL_BREATHE_PERIOD_S;
  const wave = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
  return (
    PANEL_BREATHE_SCALE_MIN +
    (PANEL_BREATHE_SCALE_MAX - PANEL_BREATHE_SCALE_MIN) * wave
  );
}
