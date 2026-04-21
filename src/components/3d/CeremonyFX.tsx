'use client';

// ════════════════════════════════════════════════════
// CeremonyFX — Cockpit Celebration Effects (20M budget)
// ════════════════════════════════════════════════════
// Renders achievement celebration effects within the cockpit scene.
// Triangle budget: 500,000 (system tier).
//
// Ceremony types:
//   levelUp         — confetti burst + HUD rings + trophy
//   badgeEarn       — firework bursts + trophy
//   labComplete     — confetti + fireworks + HUD rings
//   streakMilestone — particle shower + HUD rings

import { useRef, useMemo, useState, useEffect, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import {
  CHROME_BORDER,
  CELEBRATION_TIERS,
  EMISSIVE_LED_MULTIPLIER,
  getEmissive,
} from '@/lib/3d/cockpitDesignTokens';
import type { CelebrationTier } from '@/lib/3d/cockpitDesignTokens';
import { fireHaptic } from '@/lib/haptic/hapticSim';
// P5 §10.8 Sub 6: GPU compute dispatch + GPU-rendered sub-components.
// When the compute system returns non-null (WebGPU renderer), the GPU
// variants below replace the CPU-driven ones.
import { useCeremonyCompute } from '@/hooks/useCeremonyCompute';
import {
  GpuConfettiBurst,
  GpuFireworkBursts,
  GpuTrophyPopup,
  GpuParticleShower,
} from './CeremonyFXGpu';
import {
  Color,
  DoubleSide,
  Euler,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three';

// ■■ Props ■■
export interface CeremonyFXProps {
  active: boolean;
  type: 'levelUp' | 'badgeEarn' | 'labComplete' | 'streakMilestone';
  labColor?: string;
  onComplete?: () => void;
}

// ■■ Constants ■■
const GRAVITY = -9.8;

// Which sub-effects each ceremony type uses
const CEREMONY_CONFIG: Record<
  CeremonyFXProps['type'],
  { confetti: boolean; fireworks: boolean; trophy: boolean; hudRings: boolean; shower: boolean }
> = {
  levelUp:         { confetti: true,  fireworks: false, trophy: true,  hudRings: true,  shower: false },
  badgeEarn:       { confetti: false, fireworks: true,  trophy: true,  hudRings: false, shower: false },
  labComplete:     { confetti: true,  fireworks: true,  trophy: false, hudRings: true,  shower: false },
  streakMilestone: { confetti: false, fireworks: false, trophy: false, hudRings: true,  shower: true  },
};

// ■■ Map ceremony types to celebration tiers from design tokens ■■
const CEREMONY_TIER_MAP: Record<CeremonyFXProps['type'], CelebrationTier> = {
  levelUp:         'epic',
  badgeEarn:       'major',
  labComplete:     'epic',
  streakMilestone: 'minor',
};

/** Decision 18.3: Pulsing bloom — heartbeat pattern (2-3 peaks) before decay.
 *  Returns a bloom intensity multiplier [0..1] for the current elapsed time. */
function getBloomPulse(elapsed: number, duration: number, bloomPeak: number): number {
  const normalised = elapsed / duration;
  // Heartbeat zone: 10%–60% of ceremony duration — 3 quick pulses
  const heartbeatStart = 0.1;
  const heartbeatEnd = 0.6;
  // Decay zone: 60%–100% — smooth falloff
  if (normalised < heartbeatStart) {
    // Ramp in
    return bloomPeak * (normalised / heartbeatStart);
  }
  if (normalised < heartbeatEnd) {
    // 3 pulses across the heartbeat zone
    const hbProgress = (normalised - heartbeatStart) / (heartbeatEnd - heartbeatStart);
    const pulseFreq = 3; // 3 full beats
    const pulse = Math.pow(Math.sin(hbProgress * pulseFreq * Math.PI), 2);
    // Minimum 40% between beats so it never fully disappears
    return bloomPeak * (0.4 + 0.6 * pulse);
  }
  // Decay from heartbeatEnd to 1.0
  const decayProgress = (normalised - heartbeatEnd) / (1.0 - heartbeatEnd);
  return bloomPeak * Math.max(0, 1 - decayProgress);
}

// ■■ Ceremony Label Map ■■
const CEREMONY_LABELS: Record<CeremonyFXProps['type'], { title: string; subtitle: string }> = {
  levelUp:         { title: 'Level Up!',      subtitle: 'New abilities unlocked' },
  badgeEarn:       { title: 'Badge Earned!',   subtitle: 'Achievement unlocked' },
  labComplete:     { title: 'Lab Complete!',   subtitle: 'All games mastered' },
  streakMilestone: { title: 'Streak!',         subtitle: 'Keep it going' },
};

// ■■ Shared scratch objects (avoid per-frame allocation) ■■
const _matrix = new Matrix4();
const _position = new Vector3();
const _quaternion = new Quaternion();
const _scale = new Vector3();
const _euler = new Euler();
const _color = new Color();

// ════════════════════════════════════════════════════
// Sub-component: Confetti Burst
// ════════════════════════════════════════════════════
interface ConfettiData {
  positions: Float32Array;
  velocities: Float32Array;
  rotations: Float32Array;
  rotSpeeds: Float32Array;
  colors: Color[];
}

function ConfettiBurst({
  elapsedRef,
  count,
  labColor: _labColor,
  duration,
}: {
  /** Phase 3 Task 5C: elapsed is now passed via ref, not prop, so the
   *  parent no longer re-renders this subtree every frame. */
  elapsedRef: RefObject<number>;
  count: number;
  labColor: string;
  duration: number;
}) {
  const meshRef = useRef<InstancedMesh>(null);

  const data = useMemo<ConfettiData>(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const rotations = new Float32Array(count * 3);
    const rotSpeeds = new Float32Array(count * 3);
    const colors: Color[] = [];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Start near origin with slight spread
      positions[i3] = (Math.random() - 0.5) * 0.3;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = (Math.random() - 0.5) * 0.3;

      // Initial velocity: upward burst with horizontal spread
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      velocities[i3] = Math.cos(angle) * speed * 0.6;
      velocities[i3 + 1] = 4 + Math.random() * 6;
      velocities[i3 + 2] = Math.sin(angle) * speed * 0.6;

      // Random rotation + spin
      rotations[i3] = Math.random() * Math.PI * 2;
      rotations[i3 + 1] = Math.random() * Math.PI * 2;
      rotations[i3 + 2] = Math.random() * Math.PI * 2;
      rotSpeeds[i3] = (Math.random() - 0.5) * 8;
      rotSpeeds[i3 + 1] = (Math.random() - 0.5) * 8;
      rotSpeeds[i3 + 2] = (Math.random() - 0.5) * 8;

      // Decision 18.1: Metallic shards — chrome (#a8b5c8) and gold (#FFD700) alternating
      const isChrome = i % 2 === 0;
      const palette = isChrome ? CHROME_BORDER.colorHex : '#FFD700';
      colors.push(new Color(palette));
    }

    return { positions, velocities, rotations, rotSpeeds, colors };
  }, [count]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = elapsedRef.current;
    const fadeStart = duration * 0.7;
    const opacity = t > fadeStart ? 1 - (t - fadeStart) / (duration - fadeStart) : 1;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const px = data.positions[i3] + data.velocities[i3] * t;
      const py = data.positions[i3 + 1] + data.velocities[i3 + 1] * t + 0.5 * GRAVITY * t * t;
      const pz = data.positions[i3 + 2] + data.velocities[i3 + 2] * t;

      _position.set(px, py, pz);
      _euler.set(
        data.rotations[i3] + data.rotSpeeds[i3] * t,
        data.rotations[i3 + 1] + data.rotSpeeds[i3 + 1] * t,
        data.rotations[i3 + 2] + data.rotSpeeds[i3 + 2] * t,
      );
      _quaternion.setFromEuler(_euler);
      const s = 0.04 * Math.max(opacity, 0);
      _scale.set(s, s * 0.4, s); // flat confetti shape
      _matrix.compose(_position, _quaternion, _scale);
      mesh.setMatrixAt(i, _matrix);
      mesh.setColorAt(i, data.colors[i]);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      {/* Decision 18.1: Metallic shards — chrome + gold, reflective, premium */}
      <meshStandardMaterial transparent opacity={0.95} roughness={0.1} metalness={0.95} />
    </instancedMesh>
  );
}

// ════════════════════════════════════════════════════
// Sub-component: Firework Bursts
// ════════════════════════════════════════════════════
interface BurstData {
  center: Vector3;
  delay: number;
  directions: Float32Array;
  color: Color;
}

function FireworkBursts({
  elapsedRef,
  particlesPerBurst,
  labColor,
}: {
  elapsedRef: RefObject<number>;
  particlesPerBurst: number;
  labColor: string;
}) {
  const meshRef = useRef<InstancedMesh>(null);

  const bursts = useMemo<BurstData[]>(() => {
    const burstCenters: BurstData[] = [
      { center: new Vector3(-1.5, 2.5, 0), delay: 0.0, directions: new Float32Array(0), color: new Color(labColor) },
      { center: new Vector3(1.0, 3.0, -0.5), delay: 0.6, directions: new Float32Array(0), color: new Color('#AA66FF') },
      { center: new Vector3(0, 3.5, 0.5), delay: 1.2, directions: new Float32Array(0), color: new Color('#FF6644') },
    ];

    for (const burst of burstCenters) {
      const dirs = new Float32Array(particlesPerBurst * 3);
      for (let i = 0; i < particlesPerBurst; i++) {
        const i3 = i * 3;
        // Random direction on sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 1.5 + Math.random() * 2.5;
        dirs[i3] = Math.sin(phi) * Math.cos(theta) * speed;
        dirs[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
        dirs[i3 + 2] = Math.cos(phi) * speed;
      }
      burst.directions = dirs;
    }

    return burstCenters;
  }, [particlesPerBurst, labColor]);

  const totalCount = bursts.length * particlesPerBurst;

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const elapsed = elapsedRef.current;
    let idx = 0;
    for (const burst of bursts) {
      const burstT = elapsed - burst.delay;

      for (let i = 0; i < particlesPerBurst; i++) {
        const i3 = i * 3;

        if (burstT < 0 || burstT > 2.0) {
          // Not yet triggered or fully faded
          _scale.set(0, 0, 0);
          _position.set(0, -100, 0);
        } else {
          const expandT = burstT;
          const fade = Math.max(0, 1 - burstT / 2.0);
          const px = burst.center.x + burst.directions[i3] * expandT;
          const py = burst.center.y + burst.directions[i3 + 1] * expandT + 0.5 * GRAVITY * 0.15 * expandT * expandT;
          const pz = burst.center.z + burst.directions[i3 + 2] * expandT;
          _position.set(px, py, pz);
          const s = 0.03 * fade;
          _scale.set(s, s, s);
        }

        _quaternion.identity();
        _matrix.compose(_position, _quaternion, _scale);
        mesh.setMatrixAt(idx, _matrix);
        mesh.setColorAt(idx, burst.color);
        idx++;
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, totalCount]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      {/* Phase 2 audit fix (Section 7.1): Design token adoption */}
      <meshStandardMaterial emissive="#ffffff" emissiveIntensity={getEmissive('bright')} transparent opacity={0.9} />
    </instancedMesh>
  );
}

// ════════════════════════════════════════════════════
// Sub-component: Trophy Popup — Particle Assembly (Decision 18.2)
// ════════════════════════════════════════════════════
// Particles start scattered and converge to form the trophy shape,
// giving a "3D printed from light" effect. Dramatic + futuristic.

const TROPHY_PARTICLE_COUNT = 200;
const TROPHY_CONVERGE_TIME = 1.6; // seconds to fully assemble

interface TrophyParticleData {
  /** Random start positions (scattered sphere) */
  startPositions: Float32Array;
  /** Final target positions on trophy surface */
  targetPositions: Float32Array;
}

/** Sample target positions on the trophy surface (pedestal + cup + sphere) */
function sampleTrophyTargets(count: number): Float32Array {
  const targets = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const section = i / count;
    if (section < 0.3) {
      // Pedestal: cylinder from y=-0.3 to y=-0.1, radius 0.2–0.3
      const angle = Math.random() * Math.PI * 2;
      const y = -0.3 + Math.random() * 0.2;
      const r = 0.2 + (0.3 - 0.2) * ((y + 0.3) / 0.2);
      targets[i3] = Math.cos(angle) * r;
      targets[i3 + 1] = y;
      targets[i3 + 2] = Math.sin(angle) * r;
    } else if (section < 0.75) {
      // Cup body: cylinder from y=-0.1 to y=0.4, radius 0.15–0.25
      const angle = Math.random() * Math.PI * 2;
      const y = -0.1 + Math.random() * 0.5;
      const t = (y + 0.1) / 0.5;
      const r = 0.15 + (0.25 - 0.15) * t;
      targets[i3] = Math.cos(angle) * r;
      targets[i3 + 1] = y;
      targets[i3 + 2] = Math.sin(angle) * r;
    } else {
      // Top sphere: at y=0.55, radius 0.15
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.15;
      targets[i3] = Math.sin(phi) * Math.cos(theta) * r;
      targets[i3 + 1] = 0.55 + Math.sin(phi) * Math.sin(theta) * r;
      targets[i3 + 2] = Math.cos(phi) * r;
    }
  }
  return targets;
}

function TrophyPopup({ elapsedRef, duration }: { elapsedRef: RefObject<number>; duration: number }) {
  const meshRef = useRef<InstancedMesh>(null);
  const groupRef = useRef<Group>(null);

  const data = useMemo<TrophyParticleData>(() => {
    const startPositions = new Float32Array(TROPHY_PARTICLE_COUNT * 3);
    for (let i = 0; i < TROPHY_PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      // Scattered sphere of radius 2–4
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2 + Math.random() * 2;
      startPositions[i3] = Math.sin(phi) * Math.cos(theta) * r;
      startPositions[i3 + 1] = Math.sin(phi) * Math.sin(theta) * r + 1.0;
      startPositions[i3 + 2] = Math.cos(phi) * r;
    }
    const targetPositions = sampleTrophyTargets(TROPHY_PARTICLE_COUNT);
    return { startPositions, targetPositions };
  }, []);

  useFrame(() => {
    const mesh = meshRef.current;
    const group = groupRef.current;
    if (!mesh || !group) return;

    const elapsed = elapsedRef.current;
    // Convergence progress: 0 → 1 over TROPHY_CONVERGE_TIME
    const convergeT = Math.min(elapsed / TROPHY_CONVERGE_TIME, 1);
    // Ease-in-out cubic for smooth convergence
    const eased = convergeT < 0.5
      ? 4 * convergeT * convergeT * convergeT
      : 1 - Math.pow(-2 * convergeT + 2, 3) / 2;

    // Fade out in last second of ceremony
    const fadeOut = elapsed > duration - 1.0
      ? Math.max(0, 1 - (elapsed - (duration - 1.0)))
      : 1;

    for (let i = 0; i < TROPHY_PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      // Lerp from scattered start to trophy surface target
      const sx = data.startPositions[i3];
      const sy = data.startPositions[i3 + 1];
      const sz = data.startPositions[i3 + 2];
      const tx = data.targetPositions[i3];
      const ty = data.targetPositions[i3 + 1];
      const tz = data.targetPositions[i3 + 2];

      const px = sx + (tx - sx) * eased;
      const py = sy + (ty - sy) * eased;
      const pz = sz + (tz - sz) * eased;

      _position.set(px, py, pz);
      _quaternion.identity();
      // Particles shrink as they converge (tight packing), scale by fadeOut at end
      const particleSize = (0.04 - 0.02 * eased) * fadeOut;
      _scale.set(particleSize, particleSize, particleSize);
      _matrix.compose(_position, _quaternion, _scale);
      mesh.setMatrixAt(i, _matrix);

      // Gold color with emissive boost during assembly
      _color.set('#FFD700');
      mesh.setColorAt(i, _color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    // Rotate whole group slowly once assembled
    group.rotation.y = elapsed * 1.5;
    group.position.y = 1.0 + Math.sin(elapsed * 2) * 0.1;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, TROPHY_PARTICLE_COUNT]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        {/* Decision 18.2: "3D printed from light" — high emissive gold particles */}
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={EMISSIVE_LED_MULTIPLIER}
          metalness={0.95}
          roughness={0.08}
          transparent
          opacity={0.95}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}

// ════════════════════════════════════════════════════
// Sub-component: HUD Ring Expansion
// ════════════════════════════════════════════════════
function HUDRings({ elapsedRef, labColor }: { elapsedRef: RefObject<number>; labColor: string }) {
  const ringsRef = useRef<Group>(null);
  const ringCount = 3;

  const materials = useMemo(
    () =>
      Array.from({ length: ringCount }, (_, _i) =>
        new MeshStandardMaterial({
          color: labColor,
          emissive: labColor,
          emissiveIntensity: 0.6,
          transparent: true,
          opacity: 1,
          side: DoubleSide,
          depthWrite: false,
        })
      ),
    [labColor],
  );

  useFrame(() => {
    const group = ringsRef.current;
    if (!group) return;

    const elapsed = elapsedRef.current;
    for (let i = 0; i < ringCount; i++) {
      const ring = group.children[i] as Mesh;
      if (!ring) continue;

      const delay = i * 0.3;
      const t = Math.max(0, elapsed - delay);
      const expandDuration = 2.5;

      if (t <= 0) {
        ring.scale.setScalar(0);
        continue;
      }

      const progress = Math.min(t / expandDuration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const scale = 0.5 + eased * 3.5;
      ring.scale.setScalar(scale);

      // Fade out as ring expands
      const mat = materials[i];
      mat.opacity = Math.max(0, 1 - progress);
      ring.rotation.x = Math.PI / 2; // face upward
    }
  });

  return (
    <group ref={ringsRef} position={[0, 1.0, 0]}>
      {materials.map((mat, i) => (
        <mesh key={i} material={mat}>
          <torusGeometry args={[1, 0.02, 8, 48]} />
        </mesh>
      ))}
    </group>
  );
}

// ════════════════════════════════════════════════════
// Sub-component: Particle Shower
// ════════════════════════════════════════════════════
function ParticleShower({
  elapsedRef,
  count,
  labColor,
  duration,
}: {
  elapsedRef: RefObject<number>;
  count: number;
  labColor: string;
  duration: number;
}) {
  const meshRef = useRef<InstancedMesh>(null);

  const data = useMemo(() => {
    const xPositions = new Float32Array(count);
    const zPositions = new Float32Array(count);
    const speeds = new Float32Array(count);
    const offsets = new Float32Array(count);
    const shimmerPhases = new Float32Array(count);
    const particleColor = new Color(labColor);

    for (let i = 0; i < count; i++) {
      xPositions[i] = (Math.random() - 0.5) * 6;
      zPositions[i] = (Math.random() - 0.5) * 4;
      speeds[i] = 1.5 + Math.random() * 3;
      offsets[i] = Math.random() * 5; // stagger start height
      shimmerPhases[i] = Math.random() * Math.PI * 2;
    }

    return { xPositions, zPositions, speeds, offsets, shimmerPhases, particleColor };
  }, [count, labColor]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const elapsed = elapsedRef.current;
    const fadeOut = elapsed > duration - 1.0
      ? 1 - (elapsed - (duration - 1.0))
      : 1;

    for (let i = 0; i < count; i++) {
      const y = data.offsets[i] - data.speeds[i] * elapsed;
      // Wrap around when falling below -3
      const wrappedY = ((y % 8) + 8) % 8 - 3;
      const shimmer = 0.5 + 0.5 * Math.sin(elapsed * 4 + data.shimmerPhases[i]);

      _position.set(
        data.xPositions[i] + Math.sin(elapsed * 1.5 + data.shimmerPhases[i]) * 0.2,
        wrappedY,
        data.zPositions[i],
      );
      _quaternion.identity();
      const s = 0.015 * shimmer * Math.max(0, fadeOut);
      _scale.set(s, s, s);
      _matrix.compose(_position, _quaternion, _scale);
      mesh.setMatrixAt(i, _matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshStandardMaterial
        color={labColor}
        emissive={labColor}
        emissiveIntensity={2}
        transparent
        opacity={0.8}
      />
    </instancedMesh>
  );
}

// ════════════════════════════════════════════════════
// Main Component: CeremonyFX
// ════════════════════════════════════════════════════
export function CeremonyFX({
  active,
  type,
  labColor = '#00BBFF',
  onComplete,
}: CeremonyFXProps) {
  // Phase 3 Task 5C (§10.8): Replaced `useState(elapsed)` + `useState(bloomIntensity)`
  // with refs so the parent no longer re-renders the entire ceremony tree every
  // frame. The previous pattern triggered a full React re-render of 5 particle
  // sub-components (ConfettiBurst, FireworkBursts, TrophyPopup, HUDRings,
  // ParticleShower) at 60fps during celebrations. Each sub-component now reads
  // `elapsedRef.current` directly inside its own useFrame. Zero visual change —
  // particle physics, bloom pulse, and completion timing are all preserved.
  const elapsedRef = useRef(0);
  const [completed, setCompleted] = useState(false);
  const bloomMeshRef = useRef<Mesh>(null);
  const bloomMatRef = useRef<MeshStandardMaterial>(null);
  const startTimeRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Resolve tier-specific config from design tokens
  const tier = CEREMONY_TIER_MAP[type];
  const tierConfig = CELEBRATION_TIERS[tier];
  const duration = tierConfig.durationMs / 1000;

  // Reset when active changes
  useEffect(() => {
    if (active) {
      elapsedRef.current = 0;
      setCompleted(false);
      if (bloomMatRef.current) {
        bloomMatRef.current.emissiveIntensity = 0;
        bloomMatRef.current.opacity = 0;
      }
      if (bloomMeshRef.current) bloomMeshRef.current.visible = false;
      startTimeRef.current = null;

      // Phase 4 §10.14 (J-A): Fire impactBurst haptic ONLY for epic-tier
      // celebrations (levelUp + labComplete — the biggest moments in the
      // child's journey). Badge earn (major tier) + streak milestone
      // (minor tier) intentionally skip the camera shake to avoid
      // over-stimulation on frequent events.
      if (tier === 'epic') {
        fireHaptic('impactBurst');
      }
    }
  }, [active, tier]);

  // Drive elapsed timer + bloom pulse via useFrame (NO per-frame setState)
  useFrame((_, delta) => {
    if (!active || completed) return;

    if (startTimeRef.current === null) {
      startTimeRef.current = 0;
    }

    startTimeRef.current += delta;
    elapsedRef.current = startTimeRef.current;
    const newElapsed = elapsedRef.current;

    // Decision 18.3: Pulsing bloom — heartbeat pattern before decay.
    // Direct material mutation (no setState) — changes apply on the NEXT
    // render pass of Three.js, same visual result, no React re-render cost.
    const bloom = getBloomPulse(newElapsed, duration, tierConfig.bloomPeak);
    if (bloomMatRef.current) {
      bloomMatRef.current.emissiveIntensity = bloom * EMISSIVE_LED_MULTIPLIER * 3;
      bloomMatRef.current.opacity = bloom * 0.35;
    }
    if (bloomMeshRef.current) {
      bloomMeshRef.current.visible = bloom > 0.01;
    }

    if (newElapsed >= duration) {
      setCompleted(true);
      if (bloomMatRef.current) {
        bloomMatRef.current.emissiveIntensity = 0;
        bloomMatRef.current.opacity = 0;
      }
      if (bloomMeshRef.current) bloomMeshRef.current.visible = false;
      onCompleteRef.current?.();
    }
  });

  const config = CEREMONY_CONFIG[type];

  // Particle counts from CELEBRATION_TIERS (desktop-ultra: full quality always)
  const confettiCount = tierConfig.confetti ? Math.max(tierConfig.confettiCount, 150) : 250;
  const fireworkPerBurst = Math.round(60);
  const showerCount = Math.round(120);

  // P5 §10.8 Sub 6: GPU compute dispatch. Non-null only when renderer
  // is WebGPU AND ceremony is active — on WebGL2, gpuSystem stays
  // null and the CPU branch below renders.
  //
  // Hook must run unconditionally (rules-of-hooks) — early return was
  // moved below this call.
  const gpuSystem = useCeremonyCompute({
    active,
    labColor,
    duration,
    elapsedRef,
    archetypes: (['confetti', 'firework', 'trophy', 'shower'] as const).filter((a) => {
      if (a === 'confetti') return config.confetti;
      if (a === 'firework') return config.fireworks;
      if (a === 'trophy') return config.trophy;
      if (a === 'shower') return config.shower;
      return false;
    }) as ('confetti' | 'firework' | 'trophy' | 'shower')[],
  });

  if (!active || completed) return null;

  return (
    <group>
      {/* GPU path — only when renderer is WebGPU. Mounts nothing on WebGL2. */}
      {gpuSystem && config.confetti && <GpuConfettiBurst system={gpuSystem} />}
      {gpuSystem && config.fireworks && <GpuFireworkBursts system={gpuSystem} />}
      {gpuSystem && config.trophy && <GpuTrophyPopup system={gpuSystem} />}
      {gpuSystem && config.shower && <GpuParticleShower system={gpuSystem} />}

      {/* CPU path — authoritative when renderer is WebGL2 (gpuSystem null) */}
      {!gpuSystem && config.confetti && (
        <ConfettiBurst elapsedRef={elapsedRef} count={confettiCount} labColor={labColor} duration={duration} />
      )}
      {!gpuSystem && config.fireworks && (
        <FireworkBursts elapsedRef={elapsedRef} particlesPerBurst={fireworkPerBurst} labColor={labColor} />
      )}
      {!gpuSystem && config.trophy && <TrophyPopup elapsedRef={elapsedRef} duration={duration} />}
      {!gpuSystem && config.shower && (
        <ParticleShower elapsedRef={elapsedRef} count={showerCount} labColor={labColor} duration={duration} />
      )}

      {/* HUD rings stay CPU on both paths — only 3 low-cost objects. */}
      {config.hudRings && <HUDRings elapsedRef={elapsedRef} labColor={labColor} />}

      {/* Decision 18.3: Bloom pulse emitter — a central glow sphere driven by heartbeat rhythm */}
      <mesh ref={bloomMeshRef} position={[0, 1.0, 0]} visible={false}>
        <sphereGeometry args={[0.6, 8, 8]} />
        <meshStandardMaterial
          ref={bloomMatRef}
          color={labColor}
          emissive={labColor}
          emissiveIntensity={0}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* ── 3D-Anchored Ceremony Label Popup ── */}
      <Html
        position={[0.6, 1.8, 0]}
        distanceFactor={6}
        className="pointer-events-none select-none"
        center
      >
        <div
          className="text-center whitespace-nowrap"
          style={{
            animation: 'ceremonyPopup 2s ease-out forwards',
          }}
        >
          <p
            className="font-data text-2xl font-bold drop-shadow-[0_0_12px_currentColor]"
            style={{ color: labColor }}
          >
            {CEREMONY_LABELS[type].title}
          </p>
          <p className="font-display text-xs text-white/70 mt-1">
            {CEREMONY_LABELS[type].subtitle}
          </p>
        </div>
        <style>{`
          @keyframes ceremonyPopup {
            0% { opacity: 0; transform: translateY(20px) scale(0.8); }
            20% { opacity: 1; transform: translateY(0px) scale(1.1); }
            40% { transform: translateY(-5px) scale(1.0); }
            100% { opacity: 0; transform: translateY(-30px) scale(0.9); }
          }
        `}</style>
      </Html>
    </group>
  );
}

export default CeremonyFX;
