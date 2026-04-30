'use client';

/**
 * Beat 1 — Void Awakening (0.0 → 2.5 s)
 *
 * Storyboard §3:
 *   - Camera (driven by parent): (0,0,16) → (0,0,12) slow dolly-in
 *   - Background: voidNavy clear color + faint cyan radial streaks
 *   - Subject: 200-particle cyan starfield, opacity 0 → 0.4
 *   - Lighting: env 30% → 50% (driven by parent)
 *   - First dispersion-spark visible at t≈2.4 (telegraph for Beat 2)
 *
 * This component renders only the scene-graph subjects (starfield,
 * streaks, dispersion-spark). Camera path + lighting ramps are
 * driven at the parent level (HeroAnimation v3 in 5c, or the
 * /dev/hero-v3 scrubber in 5b.4) since they cross-fade between beats.
 */

import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  type Group,
  type Points,
  type PointsMaterial,
} from 'three';
import { val } from '@theatre/core';
import { heroBeat1 } from '@/lib/hero/heroTheatreProject';
import { PALETTE, BACKGROUND } from '@/lib/branding/sf-material.config';

// ─────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────

export interface Beat1Props {
  /** 0..1 progress through the beat. */
  progress: number;
  /** Whether this beat is currently active (drives visibility). */
  active: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// Constants (storyboard §3 defaults)
// ─────────────────────────────────────────────────────────────────────

const STARFIELD_COUNT = 200;
const STREAK_COUNT = 24;
const STARFIELD_BOUND = 14; // worldspace half-extent
const STREAK_RADIUS_MIN = 4;
const STREAK_RADIUS_MAX = 12;

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export function Beat1VoidAwakening({ progress, active }: Beat1Props) {
  const starfieldRef = useRef<Points>(null);
  const starfieldMatRef = useRef<PointsMaterial | null>(null);
  const streakGroupRef = useRef<Group>(null);

  // ─── Generate starfield positions once (deterministic) ───
  const starfieldPositions = useMemo(() => {
    const arr = new Float32Array(STARFIELD_COUNT * 3);
    // Use a simple deterministic pattern (Halton-ish via sin/cos seeds)
    for (let i = 0; i < STARFIELD_COUNT; i++) {
      arr[i * 3 + 0] = (Math.sin(i * 12.9898) * 43758.5453) % 1.0 * 2 * STARFIELD_BOUND - STARFIELD_BOUND;
      arr[i * 3 + 1] = (Math.sin(i * 78.233 + 1.0) * 43758.5453) % 1.0 * 2 * STARFIELD_BOUND - STARFIELD_BOUND;
      arr[i * 3 + 2] = (Math.sin(i * 4.123 + 2.0) * 43758.5453) % 1.0 * 2 * STARFIELD_BOUND - STARFIELD_BOUND;
    }
    return arr;
  }, []);

  // ─── Generate radial streak positions (line segments from origin outward) ───
  const streakGeometries = useMemo(() => {
    const geoms: BufferGeometry[] = [];
    for (let i = 0; i < STREAK_COUNT; i++) {
      const angle = (i / STREAK_COUNT) * Math.PI * 2;
      const elev = ((Math.sin(i * 1.234) + 1) * 0.5 - 0.5) * 0.4; // small Y elevation jitter
      const minR = STREAK_RADIUS_MIN;
      const maxR = STREAK_RADIUS_MIN +
        ((Math.sin(i * 3.567) + 1) * 0.5) * (STREAK_RADIUS_MAX - STREAK_RADIUS_MIN);
      const dx = Math.cos(angle);
      const dy = elev;
      const dz = Math.sin(angle);
      const positions = new Float32Array([
        dx * minR, dy * minR, dz * minR,
        dx * maxR, dy * maxR, dz * maxR,
      ]);
      const g = new BufferGeometry();
      g.setAttribute('position', new BufferAttribute(positions, 3));
      geoms.push(g);
    }
    return geoms;
  }, []);

  // Dispose streak geometries on unmount
  useEffect(() => {
    return () => {
      streakGeometries.forEach((g) => g.dispose());
    };
  }, [streakGeometries]);

  // ─── Per-frame: opacity + drift ───
  useFrame(() => {
    if (!active) return;

    // Starfield opacity: 0 → 0.4 across progress, weighted by Theatre.js
    // particleFadeRate (default 1.0)
    const fadeRate = val(heroBeat1.props.particleFadeRate);
    const t = Math.min(progress * fadeRate, 1.0);
    if (starfieldMatRef.current) {
      starfieldMatRef.current.opacity = t * 0.4;
    }

    // Streaks: opacity 0 → 0.12; drift rotation around Y
    if (streakGroupRef.current) {
      streakGroupRef.current.visible = active;
      // Continuous Y-axis drift — driven by progress * driftRate
      const driftRate = val(heroBeat1.props.streakDriftRate);
      streakGroupRef.current.rotation.y += driftRate;
    }
  });

  if (!active) return null;

  return (
    <group>
      {/* Starfield */}
      <points ref={starfieldRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[starfieldPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={starfieldMatRef}
          size={0.04}
          color={PALETTE.rimCyan}
          transparent
          opacity={0}
          sizeAttenuation
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </points>

      {/* Cyan radial streaks — faint background motion */}
      <group ref={streakGroupRef}>
        {streakGeometries.map((g, i) => (
          <line key={i}>
            <primitive object={g} attach="geometry" />
            <lineBasicMaterial
              color={new Color(BACKGROUND.streaks.color)}
              transparent
              opacity={Math.min(progress * 0.12, 0.12)}
              depthWrite={false}
              blending={AdditiveBlending}
              toneMapped={false}
            />
          </line>
        ))}
      </group>
    </group>
  );
}
