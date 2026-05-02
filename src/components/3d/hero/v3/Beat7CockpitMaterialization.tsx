'use client';

/**
 * Beat 7 — Cockpit Materialization (16.5 → 18.5 s)
 *
 * Storyboard §9:
 *   - Camera (parent-driven): (0,0.6,10.5) → (0,6.0,7.5), fov 44 → 58,
 *     lookAt linearly interp (0,0,0) → (0,3,0). Camera pitches up ~22°.
 *   - Subjects in transition:
 *     • SparkForgeWordmark3D drifts upward (group.y 0 → +1.4) + scales
 *       1.0 → 0.85; opacity holds 1.0 until Beat 8.
 *     • Cockpit groups fade in: cockpitStore.setHeroPhase('materializing')
 *       fires @ progress=0 (only when signalCockpit=true; gated for
 *       /dev/hero-v3 which has no cockpit mounted).
 *     • Lensflares fade out: intensityMul 1.0 → 0 over progress 0..0.75
 *       (by progress 0.75 = t=18.0 they're fully extinguished).
 *   - Hero key/rim/fill light fade is parent-driven (HeroAnimation v3
 *     in 5c.6); cockpit's own lights ramp up to compensate.
 *   - HDRI env intensity 2.4 → 1.2 is parent-driven.
 *   - Background voidNavy → voidNavyLift (5% lighter) is parent-driven.
 *
 * Audio cues (per storyboard §9 + §11 audio remap):
 *   - LED buzz @ progress=0.20 (t≈16.9)
 *   - Panel clunk @ progress=0.40 (t≈17.3)
 *   - Digital chirp arpeggio @ progress=0.60 (t≈17.7)
 *   - Gauge clicks @ progress=0.80 (t≈18.1)
 *   - Cockpit hum continues at −6 dB
 *   All wired in 5c.4 audio remap.
 */

import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { SparkForgeWordmark3D } from '@/components/3d/branding/SparkForgeWordmark3D';
import { LensflareTSL } from '@/components/3d/branding/LensflareTSL';

// ─────────────────────────────────────────────────────────────────────
// Curves
// ─────────────────────────────────────────────────────────────────────

function smoothstep(t: number, a = 0, b = 1): number {
  const u = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return u * u * (3 - 2 * u);
}

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export interface Beat7Props {
  progress: number;
  active: boolean;
  /**
   * If true, fires cockpitStore.setHeroPhase('materializing') at the
   * beginning of the beat. Default false — only the live HeroAnimation v3
   * (5c.6) sets this true; /dev/hero-v3 leaves it false (no cockpit).
   */
  signalCockpit?: boolean;
  /**
   * Optional cockpit-signal callback. Called once at progress >= 0 when
   * active becomes true. Receives 'materializing' (start) at the time
   * the beat opens. Beat 8 fires the 'complete' transition.
   */
  onMaterializeStart?: () => void;
}

export function Beat7CockpitMaterialization({
  progress,
  active,
  signalCockpit = false,
  onMaterializeStart,
}: Beat7Props) {
  const wordmarkOuterRef = useRef<Group>(null);
  const signaledRef = useRef(false);

  // Fire the materialize-start signal exactly once when this beat opens
  useEffect(() => {
    if (!active) {
      signaledRef.current = false;
      return;
    }
    if (signaledRef.current) return;
    signaledRef.current = true;
    if (signalCockpit) onMaterializeStart?.();
  }, [active, signalCockpit, onMaterializeStart]);

  const targets = useMemo(() => {
    if (!active) {
      return { wordmarkY: 0, wordmarkScale: 1.0, flareIntensity: 0 };
    }
    // Wordmark drift: smoothstep ease across full beat
    const drift = smoothstep(progress);
    return {
      wordmarkY: drift * 1.4,
      wordmarkScale: 1.0 + drift * (0.85 - 1.0),
      // Flares fade from 1.0 → 0 over progress 0..0.75 (extinguished by t=18.0)
      flareIntensity: progress < 0.75 ? 1.0 - smoothstep(progress / 0.75) : 0,
    };
  }, [active, progress]);

  // Per-frame: apply position + scale to the wordmark outer group
  useFrame(() => {
    if (!active || !wordmarkOuterRef.current) return;
    wordmarkOuterRef.current.position.y = targets.wordmarkY;
    wordmarkOuterRef.current.scale.setScalar(targets.wordmarkScale);
  });

  if (!active) return null;

  return (
    <group ref={wordmarkOuterRef}>
      <SparkForgeWordmark3D italicLean={0.06} />
      {targets.flareIntensity > 0.001 && (
        <>
          <LensflareTSL flare={0} intensityMul={targets.flareIntensity} />
          <LensflareTSL flare={1} intensityMul={targets.flareIntensity} />
        </>
      )}
    </group>
  );
}
