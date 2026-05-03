'use client';

/**
 * Beat 5 — Wordmark Cascade (11.0 → 14.0 s)
 *
 * Storyboard §7:
 *   - Camera (parent-driven): (0.4,0.2,7.5) → (0,0.4,9.5) pull-back + recenter
 *   - Subject: SparkForgeWordmark3D with revealMask animated left-to-right
 *   - Per-letter pop-in times within the 3.0 s beat (storyboard table):
 *     0.00 s → S, F (already visible from Beat 4 — index 0 + 5)
 *     0.30 s → p (index 1)
 *     0.55 s → a (2)
 *     0.80 s → r (3)
 *     1.05 s → k (4)
 *     1.40 s → o (6)
 *     1.70 s → r (7)
 *     2.00 s → g (8)
 *     2.30 s → e (9)
 *     2.30 → 3.00 s settle
 *   - Per-letter pop-in animation (each letter, age = beatTime − popTime):
 *     transmission: 0 → 0.97 over 0.20 s
 *     emissiveIntensity: 0 → 0.6 (peak age 0.10) → 0.3 over 0.30 s
 *   - Electric arcs (electricVeins.frag) between predecessor and new letter:
 *     deferred to a polish pass (visual signature, not blocking).
 *
 * Audio per-letter chime: 8 clang triggers (one per p/a/r/k/o/r/g/e pop)
 * are wired in Phase 5c.4 audio remap (heroAudio.ts:syncToProgress).
 */

import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, type MeshPhysicalMaterial } from 'three';
import {
  SparkForgeWordmark3D,
  LETTER_ORDER,
} from '@/components/3d/branding/SparkForgeWordmark3D';

// ─────────────────────────────────────────────────────────────────────
// Pop schedule (seconds within the 3.0 s beat)
// ─────────────────────────────────────────────────────────────────────

/**
 * Per-letter pop times. Index matches LETTER_ORDER (S, p, a, r, k, F, o, r, g, e).
 * S and F start visible at t=0 (carried over from Beat 4).
 */
const POP_TIMES: readonly number[] = [
  0.00,  // 0  S  (Beat 4 carry)
  0.30,  // 1  p
  0.55,  // 2  a
  0.80,  // 3  r
  1.05,  // 4  k
  0.00,  // 5  F  (Beat 4 carry)
  1.40,  // 6  o
  1.70,  // 7  r
  2.00,  // 8  g
  2.30,  // 9  e
];

const BEAT_DURATION = 3.0;

interface SfUniformsBag {
  dichroicIntensity?: { value: number };
}

// ─────────────────────────────────────────────────────────────────────
// Per-letter pop-in animation
// ─────────────────────────────────────────────────────────────────────

/**
 * Pop-in transmission ramp: 0 → 0.97 over 0.20 s.
 */
function popTransmission(age: number): number {
  if (age <= 0) return 0;
  if (age >= 0.20) return 0.97;
  return (age / 0.20) * 0.97;
}

/**
 * Pop-in emissive overshoot: 0 → 0.6 → 0.3 over 0.30 s.
 */
function popEmissive(age: number): number {
  if (age <= 0) return 0;
  if (age <= 0.10) return (age / 0.10) * 0.6;
  if (age <= 0.30) {
    const u = (age - 0.10) / 0.20;
    return 0.6 + u * (0.3 - 0.6);
  }
  return 0.3;
}

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export interface Beat5Props {
  progress: number;
  active: boolean;
}

export function Beat5WordmarkCascade({ progress, active }: Beat5Props) {
  const groupRef = useRef<Group | null>(null);
  // Track when each letter has actually been "popped" — once popped, never reverts
  // unless the beat exits.
  const popMomentsRef = useRef<Map<number, number>>(new Map());

  // Compute revealMask from current beat time
  const revealMask = useMemo(() => {
    if (!active) return [0, 5]; // S + F only when not active (carry from Beat 4)
    const t = progress * BEAT_DURATION;
    const mask: number[] = [];
    for (let i = 0; i < POP_TIMES.length; i++) {
      if (t >= POP_TIMES[i]) mask.push(i);
    }
    return mask;
  }, [active, progress]);

  // Reset pop moments when beat exits
  useEffect(() => {
    if (!active) {
      popMomentsRef.current.clear();
    }
  }, [active]);

  // Per-frame: walk wordmark group, update each letter's material based on age
  useFrame(() => {
    if (!active || !groupRef.current) return;

    const t = progress * BEAT_DURATION;

    // Record pop moment for any letter that should be visible by now
    for (let i = 0; i < POP_TIMES.length; i++) {
      if (t >= POP_TIMES[i] && !popMomentsRef.current.has(i)) {
        popMomentsRef.current.set(i, POP_TIMES[i]);
      }
    }

    // Walk meshes; update material based on per-letter age
    groupRef.current.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      const pathId = (obj.userData as { sfMarkPathId?: string } | undefined)?.sfMarkPathId;
      if (!pathId) return;
      // Strip "-N" shape index suffix
      const dashIdx = pathId.lastIndexOf('-');
      const basePathId = dashIdx > 0 ? pathId.slice(0, dashIdx) : pathId;
      const letterIdx = (LETTER_ORDER as readonly string[]).indexOf(basePathId);
      if (letterIdx < 0) return;

      const popTime = popMomentsRef.current.get(letterIdx);
      const mat = obj.material as MeshPhysicalMaterial;
      if (!mat) return;

      if (popTime === undefined) {
        // Not yet popped — material reset to invisible state
        mat.transmission = 0;
        mat.emissiveIntensity = 0;
        return;
      }

      const age = t - popTime;

      // S and F (carried from Beat 4) start at fully crystallized state — skip
      // pop curves for them
      if (letterIdx === 0 || letterIdx === 5) {
        mat.transmission = 0.97;
        mat.emissiveIntensity = 0.3;
        // Dichroic stays at 1.0 (carried from Beat 3/4)
        const sfUniforms = (mat as unknown as { __sfUniforms?: SfUniformsBag }).__sfUniforms;
        if (sfUniforms?.dichroicIntensity) sfUniforms.dichroicIntensity.value = 1.0;
        return;
      }

      // New letters: apply pop curves
      mat.transmission = popTransmission(age);
      mat.emissiveIntensity = popEmissive(age);
      // Dichroic ramps with transmission
      const sfUniforms = (mat as unknown as { __sfUniforms?: SfUniformsBag }).__sfUniforms;
      if (sfUniforms?.dichroicIntensity) {
        sfUniforms.dichroicIntensity.value = popTransmission(age) / 0.97;
      }
    });
  });

  if (!active) return null;

  return (
    <SparkForgeWordmark3D
      groupRef={groupRef}
      revealMask={revealMask}
      italicLean={0.06}
    />
  );
}
