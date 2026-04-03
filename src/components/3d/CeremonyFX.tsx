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

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import {
  CHROME_BORDER,
  CELEBRATION_TIERS,
  EMISSIVE_LED_MULTIPLIER,
} from '@/lib/3d/cockpitDesignTokens';
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
const CEREMONY_DURATION = 4.0; // seconds
const GRAVITY = -9.8;

const CONFETTI_COLORS = [
  '#00BBFF', '#00FF88', '#AA66FF', '#FF6644', '#FFAA44',
  '#FF66AA', '#06B6D4', '#818CF8', '#F97316', '#D946EF',
];

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
  elapsed,
  count,
  labColor,
}: {
  elapsed: number;
  count: number;
  labColor: string;
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
  }, [count, labColor]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = elapsed;
    const fadeStart = CEREMONY_DURATION * 0.7;
    const opacity = t > fadeStart ? 1 - (t - fadeStart) / (CEREMONY_DURATION - fadeStart) : 1;

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
  elapsed,
  particlesPerBurst,
  labColor,
}: {
  elapsed: number;
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
      <meshStandardMaterial emissive="#ffffff" emissiveIntensity={1.5} transparent opacity={0.9} />
    </instancedMesh>
  );
}

// ════════════════════════════════════════════════════
// Sub-component: Trophy Popup
// ════════════════════════════════════════════════════
function TrophyPopup({ elapsed }: { elapsed: number }) {
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    // Scale up from 0 to 1 over first 0.8s with elastic ease
    const scaleT = Math.min(elapsed / 0.8, 1);
    const elastic = scaleT < 1
      ? 1 - Math.pow(Math.cos(scaleT * Math.PI * 0.5), 3) * Math.cos(scaleT * 10) * (1 - scaleT)
      : 1;
    const s = Math.max(0, elastic);

    // Fade out in last second
    const fadeT = elapsed > CEREMONY_DURATION - 1.0
      ? 1 - (elapsed - (CEREMONY_DURATION - 1.0))
      : 1;
    const finalScale = s * Math.max(0, fadeT);

    group.scale.setScalar(finalScale);
    group.rotation.y = elapsed * 1.5;
    group.position.y = 1.0 + Math.sin(elapsed * 2) * 0.1;
  });

  return (
    <group ref={groupRef} scale={0}>
      {/* Pedestal — cylinder */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 0.4, 12]} />
        {/* Decision 18.2: Trophy materializes from light — high emissive, premium gold */}
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={EMISSIVE_LED_MULTIPLIER * 0.5} metalness={0.95} roughness={0.08} toneMapped={false} />
      </mesh>
      {/* Cup body — cylinder */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.25, 0.15, 0.5, 12]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={EMISSIVE_LED_MULTIPLIER * 0.5} metalness={0.95} roughness={0.08} toneMapped={false} />
      </mesh>
      {/* Top sphere — shiny ball */}
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFAA44" emissiveIntensity={0.6} metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

// ════════════════════════════════════════════════════
// Sub-component: HUD Ring Expansion
// ════════════════════════════════════════════════════
function HUDRings({ elapsed, labColor }: { elapsed: number; labColor: string }) {
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
  elapsed,
  count,
  labColor,
}: {
  elapsed: number;
  count: number;
  labColor: string;
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

    const fadeOut = elapsed > CEREMONY_DURATION - 1.0
      ? 1 - (elapsed - (CEREMONY_DURATION - 1.0))
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
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Reset when active changes
  useEffect(() => {
    if (active) {
      setElapsed(0);
      setCompleted(false);
      startTimeRef.current = null;
    }
  }, [active]);

  // Drive elapsed timer via useFrame
  useFrame((_, delta) => {
    if (!active || completed) return;

    if (startTimeRef.current === null) {
      startTimeRef.current = 0;
    }

    startTimeRef.current += delta;
    const newElapsed = startTimeRef.current;
    setElapsed(newElapsed);

    if (newElapsed >= CEREMONY_DURATION) {
      setCompleted(true);
      onCompleteRef.current?.();
    }
  });

  if (!active || completed) return null;

  const config = CEREMONY_CONFIG[type];

  // Particle counts (desktop-ultra: full quality always)
  const pMul = 1.0;
  const confettiCount = Math.round(250 * pMul);
  const fireworkPerBurst = Math.round(60 * pMul);
  const showerCount = Math.round(120 * pMul);

  return (
    <group>
      {config.confetti && (
        <ConfettiBurst elapsed={elapsed} count={confettiCount} labColor={labColor} />
      )}
      {config.fireworks && (
        <FireworkBursts elapsed={elapsed} particlesPerBurst={fireworkPerBurst} labColor={labColor} />
      )}
      {config.trophy && <TrophyPopup elapsed={elapsed} />}
      {config.hudRings && <HUDRings elapsed={elapsed} labColor={labColor} />}
      {config.shower && (
        <ParticleShower elapsed={elapsed} count={showerCount} labColor={labColor} />
      )}

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
