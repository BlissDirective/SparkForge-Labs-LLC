'use client';

// ════════════════════════════════════════════════════
// ReactiveEnvironmentEffects — State-Driven Environment Layer
// ════════════════════════════════════════════════════
// Additive 3D effects layer that responds to game state in real-time.
// Renders inside base environment wrappers alongside procedural terrain/sky/fog.
//
// Effects:
//   • Warm accent light — intensifies with score/round progression
//   • Victory flash light — bright lab-colored pulse on game completion
//   • Progressive ambient — subtle brightness increase with round progress
//   • Fog particle speed modulation — particles accelerate with gameplay
//   • Sky dome color reactivity — horizon shifts toward lab color
//
// Audit: R3F Best Practices §1 — Findings 1 & 3
// All 35 games inherit reactivity automatically via base environment wrappers.

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AmbientLight, BufferAttribute, Group, LineSegments, MathUtils, InstancedMesh, Matrix4, PointLight, Vector3, Quaternion } from 'three';
import { useGameEnvironmentReactivity } from '@/hooks/useGameEnvironmentReactivity';
import { GameCelebration } from '@/components/3d/GameCelebration';
import { useParallaxMouse } from '@/hooks/useParallaxMouse';

// ■■ Types ■■

type EnvironmentTier = 'standard' | 'fl-lite' | 'flagship';

interface ReactiveEnvironmentEffectsProps {
  labColor: string;
  tier: EnvironmentTier;
}

// ■■ Tier-based intensity scaling ■■

const TIER_SCALE: Record<EnvironmentTier, number> = {
  standard: 1.0,
  'fl-lite': 1.2,
  flagship: 1.5,
};

const TIER_PARTICLE_COUNT: Record<EnvironmentTier, number> = {
  standard: 20,
  'fl-lite': 35,
  flagship: 50,
};

// ■■ Scratch objects (avoid per-frame allocation) ■■

const _matrix = new Matrix4();
const _position = new Vector3();
const _quaternion = new Quaternion();
const _scale = new Vector3();

// ════════════════════════════════════════════════════
// Sub-component: Progress Particles
// ════════════════════════════════════════════════════
// Particles that respond to both game state AND child progress:
//   • Speed scales with round progression + streak
//   • Visible count scales with child level (particleCountMultiplier)
//   • Glow intensity grows with level, pulses on victory
//   • Connection lines appear at higher streak counts (≥ 3-day)
//
// Audit: R3F Best Practices §1 — Finding 3

import type { EnvironmentReactivityValues } from '@/hooks/useGameEnvironmentReactivity';

const MAX_CONNECTIONS = 40;
const CONNECTION_DISTANCE = 3.0;

function ProgressParticles({
  count,
  labColor,
  reactivityRef,
  tierScale,
}: {
  count: number;
  labColor: string;
  reactivityRef: React.RefObject<EnvironmentReactivityValues | null>;
  tierScale: number;
}) {
  const meshRef = useRef<InstancedMesh>(null);
  const linesRef = useRef<LineSegments>(null);

  // Allocate max count upfront; visibility controlled via scale
  const maxCount = Math.ceil(count * 1.8); // max with full particleCountMultiplier

  const particleData = useMemo(() => {
    const positions = new Float32Array(maxCount * 3);
    const velocities = new Float32Array(maxCount * 3);
    const phases = new Float32Array(maxCount);
    const baseScales = new Float32Array(maxCount);

    for (let i = 0; i < maxCount; i++) {
      const i3 = i * 3;
      const spread = 8 * tierScale;
      positions[i3] = (Math.random() - 0.5) * spread * 2;
      positions[i3 + 1] = Math.random() * 4 - 0.5;
      positions[i3 + 2] = (Math.random() - 0.5) * spread * 2;

      velocities[i3] = (Math.random() - 0.5) * 0.3;
      velocities[i3 + 1] = 0.2 + Math.random() * 0.4;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.3;

      phases[i] = Math.random() * Math.PI * 2;
      baseScales[i] = 0.02 + Math.random() * 0.04;
    }

    return { positions, velocities, phases, baseScales };
  }, [maxCount, tierScale]);

  // Pre-allocate connection line buffer
  const linePositions = useMemo(
    () => new Float32Array(MAX_CONNECTIONS * 6),
    [],
  );

  // Store computed world positions for connection checks
  const worldPositions = useMemo(
    () => new Float32Array(maxCount * 3),
    [maxCount],
  );

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const rv = reactivityRef.current;
    const speedMul = rv ? rv.particleSpeed : 1.0;
    const progressGlow = rv ? rv.roundProgress : 0;
    const flash = rv ? rv.victoryFlash : 0;
    const levelGlow = rv ? rv.levelFactor : 0;
    const streakFactor = rv ? rv.streakFactor : 0;
    const countMul = rv ? rv.particleCountMultiplier : 1.0;
    const time = state.clock.elapsedTime;

    // Visible count scales with child level + streak
    const visibleCount = Math.min(Math.ceil(count * countMul), maxCount);

    for (let i = 0; i < maxCount; i++) {
      const i3 = i * 3;

      if (i >= visibleCount) {
        // Hide particles beyond visible count
        _scale.set(0, 0, 0);
        _position.set(0, -100, 0);
        _quaternion.identity();
        _matrix.compose(_position, _quaternion, _scale);
        mesh.setMatrixAt(i, _matrix);
        continue;
      }

      const px = particleData.positions[i3];
      const py = particleData.positions[i3 + 1];
      const pz = particleData.positions[i3 + 2];

      // Animate positions with speed multiplier
      const x = px + Math.sin(time * particleData.velocities[i3] * speedMul + particleData.phases[i]) * 1.5;
      const y = py + ((time * particleData.velocities[i3 + 1] * speedMul) % 5) - 0.5;
      const z = pz + Math.cos(time * particleData.velocities[i3 + 2] * speedMul + particleData.phases[i]) * 1.5;

      // Store for connection line checks
      worldPositions[i3] = x;
      worldPositions[i3 + 1] = y;
      worldPositions[i3 + 2] = z;

      // Scale grows with progress + level, pulses on victory
      const progressScale = 1.0 + progressGlow * 0.5 + levelGlow * 0.3;
      const flashScale = 1.0 + flash * 2.0;
      const breathe = 0.8 + 0.2 * Math.sin(time * 2 + particleData.phases[i]);
      const s = particleData.baseScales[i] * progressScale * flashScale * breathe;

      _position.set(x, y, z);
      _quaternion.identity();
      _scale.set(s, s, s);
      _matrix.compose(_position, _quaternion, _scale);
      mesh.setMatrixAt(i, _matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    // Modulate emissive intensity: brighter at higher levels
    const mat = mesh.material as { emissiveIntensity?: number };
    if (mat.emissiveIntensity !== undefined) {
      mat.emissiveIntensity = MathUtils.lerp(
        mat.emissiveIntensity,
        0.5 + progressGlow * 1.5 + levelGlow * 1.0 + flash * 3.0,
        delta * 4,
      );
    }

    // Connection lines: appear when streak ≥ 3-day (streakFactor ≥ 0.43)
    const lines = linesRef.current;
    if (lines && streakFactor >= 0.43) {
      let lineIdx = 0;
      const maxDist2 = CONNECTION_DISTANCE * CONNECTION_DISTANCE;
      const lineCount = Math.min(visibleCount, 30); // check subset for perf

      for (let i = 0; i < lineCount && lineIdx < MAX_CONNECTIONS; i++) {
        const ix = worldPositions[i * 3];
        const iy = worldPositions[i * 3 + 1];
        const iz = worldPositions[i * 3 + 2];

        for (let j = i + 1; j < lineCount && lineIdx < MAX_CONNECTIONS; j++) {
          const dx = worldPositions[j * 3] - ix;
          const dy = worldPositions[j * 3 + 1] - iy;
          const dz = worldPositions[j * 3 + 2] - iz;
          const dist2 = dx * dx + dy * dy + dz * dz;

          if (dist2 < maxDist2) {
            const li = lineIdx * 6;
            linePositions[li] = ix;
            linePositions[li + 1] = iy;
            linePositions[li + 2] = iz;
            linePositions[li + 3] = worldPositions[j * 3];
            linePositions[li + 4] = worldPositions[j * 3 + 1];
            linePositions[li + 5] = worldPositions[j * 3 + 2];
            lineIdx++;
          }
        }
      }

      // Zero out unused line vertices
      for (let i = lineIdx * 6; i < MAX_CONNECTIONS * 6; i++) {
        linePositions[i] = 0;
      }

      const geo = lines.geometry;
      const attr = geo.getAttribute('position') as BufferAttribute;
      attr.needsUpdate = true;

      // Fade connection opacity with streak intensity
      const lineMat = lines.material as { opacity?: number };
      if (lineMat.opacity !== undefined) {
        lineMat.opacity = MathUtils.lerp(lineMat.opacity, streakFactor * 0.3, delta * 3);
      }
    } else if (lines) {
      // Hide connections when streak is low
      const lineMat = lines.material as { opacity?: number };
      if (lineMat.opacity !== undefined) {
        lineMat.opacity = MathUtils.lerp(lineMat.opacity, 0, delta * 3);
      }
    }
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, maxCount]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={labColor}
          emissive={labColor}
          emissiveIntensity={0.5}
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </instancedMesh>
      {/* Connection lines — visible at streak ≥ 3 days */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={labColor}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </lineSegments>
    </>
  );
}

// ════════════════════════════════════════════════════
// Exported: useEnvironmentParallax
// ════════════════════════════════════════════════════
// Applies moderate 4° mouse-driven parallax tilt to a scene group.
// Call in environment wrappers with a ref to the root <group>.
//
// Audit: R3F Best Practices §1 — Finding 4: No parallax depth in games

const PARALLAX_TILT_RAD = (4 * Math.PI) / 180; // 4° moderate tilt

export function useEnvironmentParallax(groupRef: React.RefObject<Group | null>) {
  const parallax = useParallaxMouse({ intensity: 1.0, smoothing: 0.03 });

  useFrame(() => {
    if (!groupRef.current || !parallax.current) return;
    groupRef.current.rotation.y = MathUtils.lerp(
      groupRef.current.rotation.y,
      parallax.current.smoothX * PARALLAX_TILT_RAD,
      0.05,
    );
    groupRef.current.rotation.x = MathUtils.lerp(
      groupRef.current.rotation.x,
      parallax.current.smoothY * PARALLAX_TILT_RAD * 0.5,
      0.05,
    );
  });
}

// ════════════════════════════════════════════════════
// Main: ReactiveEnvironmentEffects
// ════════════════════════════════════════════════════

export function ReactiveEnvironmentEffects({ labColor, tier }: ReactiveEnvironmentEffectsProps) {
  const reactivity = useGameEnvironmentReactivity();
  const warmLightRef = useRef<PointLight>(null);
  const flashLightRef = useRef<PointLight>(null);
  const progressAmbientRef = useRef<AmbientLight>(null);

  const tierScale = TIER_SCALE[tier];
  const particleCount = TIER_PARTICLE_COUNT[tier];

  useFrame(() => {
    const v = reactivity.current;
    if (!v) return;

    // Warm accent light — grows with round progress
    if (warmLightRef.current) {
      warmLightRef.current.intensity = MathUtils.lerp(
        warmLightRef.current.intensity,
        (v.lightingWarmth - 1.0) * 2.0 * tierScale,
        0.05,
      );
    }

    // Victory flash — bright lab-colored pulse on completion
    if (flashLightRef.current) {
      flashLightRef.current.intensity = v.victoryFlash * 4.0 * tierScale;
    }

    // Progressive ambient — subtle brightness increase
    if (progressAmbientRef.current) {
      progressAmbientRef.current.intensity = MathUtils.lerp(
        progressAmbientRef.current.intensity,
        v.roundProgress * 0.12 * tierScale,
        0.05,
      );
    }
  });

  return (
    <group name="reactive-environment-effects">
      {/* Warm accent — intensifies with score/rounds */}
      <pointLight
        ref={warmLightRef}
        position={[0, 4, 0]}
        color="#FFAA44"
        distance={25 * tierScale}
        intensity={0}
        decay={2}
      />
      {/* Victory flash — bright lab-colored pulse on game complete */}
      <pointLight
        ref={flashLightRef}
        position={[0, 3, 0]}
        color={labColor}
        distance={35 * tierScale}
        intensity={0}
        decay={2}
      />
      {/* Progressive ambient — subtle environment brightening */}
      <ambientLight
        ref={progressAmbientRef}
        color={labColor}
        intensity={0}
      />
      {/* State-driven particles — speed/glow react to gameplay */}
      <ProgressParticles
        count={particleCount}
        labColor={labColor}
        reactivityRef={reactivity}
        tierScale={tierScale}
      />
      {/* Evolving celebrations — escalates from confetti to full ceremony */}
      <GameCelebration labColor={labColor} />
    </group>
  );
}

export default ReactiveEnvironmentEffects;
