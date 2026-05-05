'use client';

// ════════════════════════════════════════════════════════════════════
// BrandHero3D — Public Landing Hero (Option A redesign)
// ════════════════════════════════════════════════════════════════════
// Replaces the v3-FINAL CrystalHero (a single translucent extruded box)
// with a true brand-surface render: the SparkForgeWordmark3D rendered
// through the WebGPU + TSL BrandingMaterial pipeline, anchored by the
// two anamorphic lens-flares from sf-material.config.
//
// Pipeline reuse (CLAUDE.md v6.6 Tech Quality Mandate):
//   - <BrandingShowcase>     — WebGPU detection + MP4 fallback + HDRI rig
//   - <SparkForgeWordmark3D> — per-letter ExtrudeGeometry + dichroic TSL
//   - <LensflareTSL>         — anamorphic streak shader (amber + cyan)
//
// Marketing-specific behaviour (NOT shared with the cockpit hero):
//   - Continuous loop, no cinematic timeline.
//   - Per-letter cascade reveal once on mount (S → p → a → r → k → F …).
//   - Lensflare ignition fade-in synced to the wordmark cascade end.
//   - Mouse-parallax tilt, smooth-damped.
//   - prefers-reduced-motion → no parallax, instant reveal, static flares.
// ════════════════════════════════════════════════════════════════════

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useReducedMotion } from 'motion/react';
import { Group } from 'three';

import { BrandingShowcase } from '@/components/3d/branding/BrandingShowcase';
import { SparkForgeWordmark3D } from '@/components/3d/branding/SparkForgeWordmark3D';
import { LensflareTSL } from '@/components/3d/branding/LensflareTSL';

const TOTAL_LETTERS = 10;
const LETTER_REVEAL_INTERVAL_MS = 110;       // ≈ 1.1 s for full cascade
const FLARE_IGNITION_DELAY_MS = 1100;        // matches end of cascade
const FLARE_IGNITION_DURATION_MS = 900;      // 0 → peak → settle
const FLARE_PEAK = 1.6;
const FLARE_SETTLE = 1.0;

interface HeroSceneProps {
  revealMask: number[] | undefined;
  flareIntensityMul: number;
  parallaxEnabled: boolean;
}

function HeroScene({
  revealMask,
  flareIntensityMul,
  parallaxEnabled,
}: HeroSceneProps) {
  const groupRef = useRef<Group>(null);
  const { pointer } = useThree();

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;

    const t = clock.elapsedTime;

    if (parallaxEnabled) {
      const targetY = pointer.x * 0.10 + Math.sin(t * 0.18) * 0.02;
      const targetX = -pointer.y * 0.06 + Math.sin(t * 0.13) * 0.012;
      g.rotation.y += (targetY - g.rotation.y) * 0.045;
      g.rotation.x += (targetX - g.rotation.x) * 0.045;
    } else {
      g.rotation.x = 0;
      g.rotation.y = 0;
    }
  });

  return (
    <group ref={groupRef}>
      <SparkForgeWordmark3D revealMask={revealMask} />
      <LensflareTSL flare={0} intensityMul={flareIntensityMul} />
      <LensflareTSL flare={1} intensityMul={flareIntensityMul * 0.85} />
    </group>
  );
}

export function BrandHero3D() {
  const prefersReducedMotion = useReducedMotion();

  // Per-letter cascade reveal: undefined = all visible, [] = none.
  const [revealMask, setRevealMask] = useState<number[] | undefined>(
    prefersReducedMotion ? undefined : [],
  );
  const [flareIntensityMul, setFlareIntensityMul] = useState<number>(
    prefersReducedMotion ? FLARE_SETTLE : 0,
  );

  // Cascade timer
  useEffect(() => {
    if (prefersReducedMotion) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      if (i >= TOTAL_LETTERS) {
        setRevealMask(undefined);
        window.clearInterval(id);
      } else {
        setRevealMask(Array.from({ length: i }, (_, k) => k));
      }
    }, LETTER_REVEAL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [prefersReducedMotion]);

  // Flare ignition: 0 → PEAK → SETTLE, kicks in as cascade completes
  useEffect(() => {
    if (prefersReducedMotion) return;
    const startAt = FLARE_IGNITION_DELAY_MS;
    const dur = FLARE_IGNITION_DURATION_MS;
    let raf = 0;
    const t0 = performance.now();
    const tick = () => {
      const elapsed = performance.now() - t0;
      if (elapsed < startAt) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const local = elapsed - startAt;
      if (local >= dur) {
        setFlareIntensityMul(FLARE_SETTLE);
        return;
      }
      // 0..0.5 ramp up, 0.5..1 ease back to settle
      const p = local / dur;
      const value =
        p < 0.5
          ? (p / 0.5) * FLARE_PEAK
          : FLARE_PEAK - ((p - 0.5) / 0.5) * (FLARE_PEAK - FLARE_SETTLE);
      setFlareIntensityMul(value);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [prefersReducedMotion]);

  const ariaLabel = useMemo(
    () => 'SparkForge — animated wordmark on glassy dichroic background',
    [],
  );

  return (
    <div className="absolute inset-0">
      <BrandingShowcase
        cameraDistance={10.0}
        ariaLabel={ariaLabel}
        // Default fallback paths used: /branding/brand-fallback.mp4
        // and /branding/IMG_4607.png. Both already shipped in /public.
      >
        <Suspense fallback={null}>
          <HeroScene
            revealMask={revealMask}
            flareIntensityMul={flareIntensityMul}
            parallaxEnabled={!prefersReducedMotion}
          />
        </Suspense>
      </BrandingShowcase>
    </div>
  );
}

export default BrandHero3D;
