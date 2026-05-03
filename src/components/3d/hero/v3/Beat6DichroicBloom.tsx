'use client';

/**
 * Beat 6 — Dichroic Bloom (14.0 → 16.5 s)
 *
 * Storyboard §8 + user pick Q5 (lensflare peak intensityMul = 2.0):
 *   - Camera (parent-driven): (0,0.4,9.5) → (0,0.6,10.5) gentle pull-back
 *     + breath-rate Y float (sin LFO ±0.04, period 2.5 s)
 *   - Subject: full SparkForgeWordmark3D (all 10 letters); shards fully gone
 *   - Material animation (all 10 letters synchronized via shared progress):
 *     dichroicIntensity:   1.0 → 1.6 (peak progress 0.48 / t=15.2) → 1.0
 *     dispersionStrength:  0.072 → 0.090 → 0.072
 *     emissiveIntensity:   0.3 → 0.55 → 0.3
 *     clearcoat:           1.0 (steady)
 *     transmission:        0.97 (steady)
 *   - HDRI env intensity: parent-driven 2.4 → 3.0 → 2.4
 *   - Lensflares peak again — both flares intensityMul 1.0 → 2.0 → 1.0;
 *     coreScale 1.0 → 1.4 → 1.0; streakScale 1.2 → 1.7 → 1.2 (Q5)
 *   - Volumetric god-rays: deferred (5c integration polish — added at
 *     HeroAnimation v3 wiring when post-process pass lands)
 *
 * Audio: Aurora pad Am7 @ progress=0 (t=14.0); HUD ring chord @ peak
 * progress=0.48 (t=15.2). Both wired in 5c.4 audio remap.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, type MeshPhysicalMaterial } from 'three';
import {
  SparkForgeWordmark3D,
  LETTER_ORDER,
} from '@/components/3d/branding/SparkForgeWordmark3D';
import { LensflareTSL } from '@/components/3d/branding/LensflareTSL';

// ─────────────────────────────────────────────────────────────────────
// Bloom curve — bell-shaped peak
// ─────────────────────────────────────────────────────────────────────

/**
 * Symmetric bell curve peaking at `peakAt` in [0..1] progress.
 * Uses smoothstep on both sides for soft ramps.
 */
function bellCurve(progress: number, peakAt: number, baseValue: number, peakValue: number): number {
  const t = Math.max(0, Math.min(1, progress));
  let u: number;
  if (t <= peakAt) {
    u = peakAt > 0 ? t / peakAt : 1;
  } else {
    u = 1 - (t - peakAt) / (1 - peakAt);
  }
  // Smoothstep ease
  const eased = u * u * (3 - 2 * u);
  return baseValue + eased * (peakValue - baseValue);
}

interface SfUniformsBag {
  dichroicIntensity?: { value: number };
  fresnelBoost?: { value: number };
}

const PEAK_AT_PROGRESS = 0.48; // t=15.2 within 14.0..16.5 s window

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export interface Beat6Props {
  progress: number;
  active: boolean;
}

export function Beat6DichroicBloom({ progress, active }: Beat6Props) {
  const groupRef = useRef<Group | null>(null);

  // Pre-compute synchronized targets per frame (cheap math; same value
  // applied to all 10 letters so we evaluate once per frame).
  const targets = useMemo(() => {
    if (!active) {
      return {
        dichroic: 1.0,
        dispersion: 0.072,
        emissive: 0.3,
        flareIntensity: 1.0,
        flareCore: 1.0,
        flareStreak: 1.2,
      };
    }
    return {
      dichroic: bellCurve(progress, PEAK_AT_PROGRESS, 1.0, 1.6),
      dispersion: bellCurve(progress, PEAK_AT_PROGRESS, 0.072, 0.090),
      emissive: bellCurve(progress, PEAK_AT_PROGRESS, 0.3, 0.55),
      // User pick Q5: peak intensityMul = 2.0
      flareIntensity: bellCurve(progress, PEAK_AT_PROGRESS, 1.0, 2.0),
      flareCore: bellCurve(progress, PEAK_AT_PROGRESS, 1.0, 1.4),
      flareStreak: bellCurve(progress, PEAK_AT_PROGRESS, 1.2, 1.7),
    };
  }, [active, progress]);

  // Per-frame: walk wordmark group, apply synchronized targets to all letters
  useFrame(() => {
    if (!active || !groupRef.current) return;

    groupRef.current.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      const pathId = (obj.userData as { sfMarkPathId?: string } | undefined)?.sfMarkPathId;
      if (!pathId) return;
      const dashIdx = pathId.lastIndexOf('-');
      const basePathId = dashIdx > 0 ? pathId.slice(0, dashIdx) : pathId;
      const letterIdx = (LETTER_ORDER as readonly string[]).indexOf(basePathId);
      if (letterIdx < 0) return;

      const mat = obj.material as MeshPhysicalMaterial;
      if (!mat) return;

      mat.transmission = 0.97;
      mat.dispersion = targets.dispersion * 4.0;
      mat.emissiveIntensity = targets.emissive;
      mat.clearcoat = 1.0;

      const sfUniforms = (mat as unknown as { __sfUniforms?: SfUniformsBag }).__sfUniforms;
      if (sfUniforms?.dichroicIntensity) sfUniforms.dichroicIntensity.value = targets.dichroic;
    });
  });

  if (!active) return null;

  return (
    <group>
      <SparkForgeWordmark3D groupRef={groupRef} italicLean={0.06} />
      <LensflareTSL
        flare={0}
        intensityMul={targets.flareIntensity}
        coreScale={targets.flareCore}
        streakScale={targets.flareStreak}
      />
      <LensflareTSL
        flare={1}
        intensityMul={targets.flareIntensity}
        coreScale={targets.flareCore}
        streakScale={targets.flareStreak}
      />
    </group>
  );
}
