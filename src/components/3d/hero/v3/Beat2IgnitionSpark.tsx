'use client';

/**
 * Beat 2 — Ignition Spark (2.5 → 5.0 s)
 *
 * Storyboard §4:
 *   - Camera (parent-driven): (0,0,12) → (-1.4, +0.6, 9.2), parallax dolly
 *   - Subjects: continuing starfield (parent-shared) + 2 LensflareTSL
 *   - Animated uniforms (per flare):
 *     intensityMul: 0 → 1.4 (peak t=4.0 / progress 0.6) → 1.0 (settle)
 *     coreScale:    0 → 1.0 (peak t=3.8 / progress 0.52)
 *     streakScale:  0 → 1.4 (peak t=4.0 / progress 0.6) → 1.2 (settle)
 *   - Lighting: parent ramps key/rim/fill 0 → locked-rig values
 *   - Volumetric god-rays from lower-left flare (deferred — added in 5c
 *     when integrated cinematic pass lands)
 *
 * Out-trigger: progress ≥ 1.0 AND lensflare intensityMul == 1.0 settle
 *              AND particle convergence ≥ 95% complete
 *
 * NOTE: This component owns ONLY the lensflares. Particle convergence
 * (starfield → S anchor attractor at -0.4, +0.2, 0) lives on the
 * shared particle system mounted by the parent /dev/hero-v3 scrubber
 * (or HeroAnimation v3 in 5c).
 */

import { useMemo } from 'react';
import { val } from '@theatre/core';
import { LensflareTSL } from '@/components/3d/branding/LensflareTSL';
import { heroBeat2 } from '@/lib/hero/heroTheatreProject';

// ─────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────

export interface Beat2Props {
  /** 0..1 progress through the beat. */
  progress: number;
  /** Whether this beat is currently active. */
  active: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// Curves
// ─────────────────────────────────────────────────────────────────────

/**
 * Bell curve over progress, peaking at `peakAt` (0..1) with `peakValue`,
 * settling to `settleValue`. Used for intensityMul / coreScale / streakScale.
 *
 * Curve shape:
 *   - 0 → peakAt  : ease-out from 0 to peakValue (power 1.5)
 *   - peakAt → 1.0: ease-in from peakValue to settleValue (power 2.0)
 */
function peakSettleCurve(
  progress: number,
  peakAt: number,
  peakValue: number,
  settleValue: number,
): number {
  const t = Math.max(0, Math.min(1, progress));
  if (t <= peakAt) {
    const u = peakAt > 0 ? t / peakAt : 1;
    return Math.pow(u, 0.65) * peakValue;
  }
  const u = (t - peakAt) / (1 - peakAt);
  return peakValue + Math.pow(u, 2.0) * (settleValue - peakValue);
}

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export function Beat2IgnitionSpark({ progress, active }: Beat2Props) {
  // Theatre.js tunables (Q8 auto-mounted studio exposes these in real time)
  const peakIntensityMul = useMemo(
    () => (active ? Number(val(heroBeat2.props.flareIntensityPeak)) : 0),
    [active],
  );
  // peakTime is in seconds within the 2.5 s beat — convert to 0..1
  const peakAt = useMemo(() => {
    if (!active) return 0.6;
    const seconds = Number(val(heroBeat2.props.peakTime));
    return Math.max(0.05, Math.min(0.95, seconds / 2.5));
  }, [active]);

  // Per-frame derived values from progress
  const intensityMul = active
    ? peakSettleCurve(progress, peakAt, peakIntensityMul, 1.0)
    : 0;

  // Core scale peaks slightly earlier than intensity (storyboard t=3.8 vs 4.0)
  const coreScale = active
    ? peakSettleCurve(progress, Math.max(0.05, peakAt - 0.08), 1.0, 1.0)
    : 0;

  // Streak scale peaks together with intensity, settles to 1.2
  const streakScale = active
    ? peakSettleCurve(progress, peakAt, 1.4, 1.2)
    : 0;

  if (!active) return null;

  return (
    <group>
      {/* Amber spark — lower-left (LENS_FLARES[0]) */}
      <LensflareTSL
        flare={0}
        intensityMul={intensityMul}
        coreScale={coreScale}
        streakScale={streakScale}
      />
      {/* Cyan halo — upper-right (LENS_FLARES[1]) */}
      <LensflareTSL
        flare={1}
        intensityMul={intensityMul}
        coreScale={coreScale}
        streakScale={streakScale}
      />
    </group>
  );
}
