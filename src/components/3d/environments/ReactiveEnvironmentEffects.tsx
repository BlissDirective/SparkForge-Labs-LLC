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
import { AmbientLight, Color, MathUtils, InstancedMesh, Matrix4, PointLight, Vector3, Quaternion } from 'three';
import { useGameEnvironmentReactivity } from '@/hooks/useGameEnvironmentReactivity';

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
// Subtle ambient particles that intensify with gameplay progress.
// Speed and glow driven by useGameEnvironmentReactivity values.

function ProgressParticles({
  count,
  labColor,
  reactivityRef,
  tierScale,
}: {
  count: number;
  labColor: string;
  reactivityRef: React.RefObject<{ particleSpeed: number; roundProgress: number; victoryFlash: number } | null>;
  tierScale: number;
}) {
  const meshRef = useRef<InstancedMesh>(null);

  const particleData = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const baseScales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
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
  }, [count, tierScale]);

  // Initialize matrices
  useMemo(() => {
    // Will be set on first frame
  }, []);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const rv = reactivityRef.current;
    const speedMul = rv ? rv.particleSpeed : 1.0;
    const progressGlow = rv ? rv.roundProgress : 0;
    const flash = rv ? rv.victoryFlash : 0;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const px = particleData.positions[i3];
      const py = particleData.positions[i3 + 1];
      const pz = particleData.positions[i3 + 2];

      // Animate positions with speed multiplier
      const x = px + Math.sin(time * particleData.velocities[i3] * speedMul + particleData.phases[i]) * 1.5;
      const y = py + ((time * particleData.velocities[i3 + 1] * speedMul) % 5) - 0.5;
      const z = pz + Math.cos(time * particleData.velocities[i3 + 2] * speedMul + particleData.phases[i]) * 1.5;

      // Scale grows with progress, pulses on victory
      const progressScale = 1.0 + progressGlow * 0.5;
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

    // Modulate emissive intensity based on progress
    const mat = mesh.material as { emissiveIntensity?: number };
    if (mat.emissiveIntensity !== undefined) {
      mat.emissiveIntensity = MathUtils.lerp(
        mat.emissiveIntensity,
        0.5 + progressGlow * 1.5 + flash * 3.0,
        delta * 4,
      );
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
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
  );
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
    </group>
  );
}

export default ReactiveEnvironmentEffects;
