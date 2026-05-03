'use client';

/**
 * Beat 3 — S Crystallization (5.0 → 8.0 s)
 *
 * Storyboard §5:
 *   - Camera (parent-driven): (-1.4,+0.6,9.2) → (-0.4,+0.2,7.5), pull-in to S
 *   - Subject: SfMark3D revealMask=['sf-mark-S'] (F path mounts but hidden)
 *   - Material animation:
 *     transmission:        0 → 0.97 over t=5.0→6.5 (progress 0 → 0.5)
 *     dispersionStrength:  0 → 0.108 (peak progress 0.4) → 0.072 (settle)
 *     dichroicIntensity:   0 → 1.0 (linear progress 0.17 → 0.83)
 *     clearcoat:           0 → 1.0 (linear progress 0 → 0.67)
 *     emissiveIntensity:   0 → 0.8 (peak progress 0.5) → 0.3 (settle)
 *   - Particle dissolution into S geometry (200 cyan converged particles
 *     decay outward over t=5.0→6.0) — owned by the parent's shared
 *     starfield in 5b.4 / 5c integration; not duplicated here.
 *
 * Material animation strategy: walk SfMark3D's group children (all are
 * meshes with userData.sfMarkPathId), filter to S paths, and update
 * their material props per frame. transmission / clearcoat / dispersion
 * are CPU-side props on MeshPhysicalNodeMaterial — direct assignment
 * is cheap (no node-graph recompile). dichroicIntensity is a TSL
 * uniform exposed via material.userData wrap.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, type MeshPhysicalMaterial } from 'three';
import { val } from '@theatre/core';
import { SfMark3D } from '@/components/3d/branding/SfMark3D';
import { heroBeat3 } from '@/lib/hero/heroTheatreProject';

// ─────────────────────────────────────────────────────────────────────
// Types — re-extract the exposed uniforms shape from BrandingMaterial
// ─────────────────────────────────────────────────────────────────────

interface SfUniformHandle {
  value: number;
}
interface SfUniformsBag {
  dichroicIntensity?: SfUniformHandle;
  fresnelBoost?: SfUniformHandle;
  fresnelPower?: SfUniformHandle;
}

// ─────────────────────────────────────────────────────────────────────
// Curves
// ─────────────────────────────────────────────────────────────────────

/** Linear ramp from `from` to `to` over the [t0..t1] sub-window of progress. */
function rampLinear(progress: number, t0: number, t1: number, from: number, to: number): number {
  if (progress <= t0) return from;
  if (progress >= t1) return to;
  const u = (progress - t0) / (t1 - t0);
  return from + u * (to - from);
}

/**
 * Bell curve: rises from 0 → peak at `peakAt`, settles to `settleAt` by
 * progress=1.0. Same shape used in Beat 2 with different exponents.
 */
function peakSettle(
  progress: number,
  peakAt: number,
  peakValue: number,
  settleValue: number,
  riseExp = 1.5,
  fallExp = 2.0,
): number {
  const t = Math.max(0, Math.min(1, progress));
  if (t <= peakAt) {
    const u = peakAt > 0 ? t / peakAt : 1;
    return Math.pow(u, 1 / riseExp) * peakValue;
  }
  const u = (t - peakAt) / (1 - peakAt);
  return peakValue + Math.pow(u, fallExp) * (settleValue - peakValue);
}

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export interface Beat3Props {
  /** 0..1 progress through the beat. */
  progress: number;
  /** Whether this beat is currently active. */
  active: boolean;
}

export function Beat3SCrystallization({ progress, active }: Beat3Props) {
  const groupRef = useRef<Group | null>(null);

  // Theatre tunables (read once per active toggle — not per frame)
  const tunables = useMemo(
    () => ({
      dispersionOvershoot: active
        ? Number(val(heroBeat3.props.dispersionOvershoot))
        : 0.108,
      emissivePeakAt: active
        ? Math.max(0.05, Math.min(0.95, Number(val(heroBeat3.props.emissivePeakTime)) / 3.0))
        : 0.5,
      dichroicRampSec: active
        ? Number(val(heroBeat3.props.dichroicRampDuration))
        : 2.0,
    }),
    [active],
  );

  // Per-frame material animation
  useFrame(() => {
    if (!active || !groupRef.current) return;

    // Compute target values at this progress
    const transmission = rampLinear(progress, 0.0, 0.5, 0, 0.97);
    const dispersion = peakSettle(progress, 0.4, tunables.dispersionOvershoot, 0.072);
    const dichroicEndProg = Math.min(0.95, tunables.dichroicRampSec / 3.0 + 0.17);
    const dichroic = rampLinear(progress, 0.17, dichroicEndProg, 0, 1.0);
    const clearcoat = rampLinear(progress, 0.0, 0.67, 0, 1.0);
    const emissive = peakSettle(progress, tunables.emissivePeakAt, 0.8, 0.3);

    // Walk all meshes in the SfMark3D group; update materials on the S path only
    groupRef.current.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      const pathId = (obj.userData as { sfMarkPathId?: string } | undefined)?.sfMarkPathId;
      if (!pathId || !pathId.startsWith('sf-mark-S')) return;

      const mat = obj.material as MeshPhysicalMaterial;
      if (!mat) return;
      mat.transmission = transmission;
      // dispersion: built-in scalar prop on MeshPhysicalNodeMaterial. The
      // value is expected to be in [0, ~5] — BrandingMaterial multiplies
      // DISPERSION.strength by 4.0 internally, so we mirror that scale here.
      mat.dispersion = dispersion * 4.0;
      mat.clearcoat = clearcoat;

      // dichroicIntensity is a TSL uniform exposed via material's
      // back-channel attachment (BrandingMaterial.tsx line 138).
      const sfUniforms = (mat as unknown as { __sfUniforms?: SfUniformsBag }).__sfUniforms;
      if (sfUniforms?.dichroicIntensity) {
        sfUniforms.dichroicIntensity.value = dichroic;
      }

      // Emissive intensity — boost during ignition, settle to baseline
      mat.emissiveIntensity = emissive;
    });
  });

  // Reset materials to baseline when beat exits
  useEffect(() => {
    if (active || !groupRef.current) return;
    groupRef.current.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      const pathId = (obj.userData as { sfMarkPathId?: string } | undefined)?.sfMarkPathId;
      if (!pathId?.startsWith('sf-mark-S')) return;
      const mat = obj.material as MeshPhysicalMaterial;
      if (!mat) return;
      mat.transmission = 0.97;
      mat.dispersion = 0.072 * 4.0;
      mat.clearcoat = 1.0;
      mat.emissiveIntensity = 0.3;
      const sfUniforms = (mat as unknown as { __sfUniforms?: SfUniformsBag }).__sfUniforms;
      if (sfUniforms?.dichroicIntensity) {
        sfUniforms.dichroicIntensity.value = 1.0;
      }
    });
  }, [active]);

  if (!active) return null;

  return (
    <SfMark3D
      groupRef={groupRef}
      revealMask={['sf-mark-S']}
      italicLean={0.06}
    />
  );
}
