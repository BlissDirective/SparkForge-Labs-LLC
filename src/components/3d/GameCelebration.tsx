'use client';

// ════════════════════════════════════════════════════
// GameCelebration — Evolving In-Game Victory Effects
// ════════════════════════════════════════════════════
// Renders escalating celebration effects inside game environments
// that evolve based on achievement level:
//
//   Round complete (early):  Small confetti burst (50 particles)
//   Round complete (mid):    Confetti (100) + light flash
//   Round complete (late):   Confetti (150) + HUD ring pulse
//   Game complete:           Full ceremony — confetti (250) + fireworks
//                            + trophy + HUD rings (500K tris)
//
// Automatically detects round advances and game completion from gameStore.
// Renders as R3F group — must be inside Canvas context.
//
// Audit: R3F Best Practices §1 — Finding 2: No victory celebrations in games

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  DoubleSide,
  Euler,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PointLight,
  Quaternion,
  Vector3,
} from 'three';
import { useGameStore } from '@/stores/gameStore';

// ■■ Celebration intensity levels ■■

type CelebrationLevel = 'none' | 'small' | 'medium' | 'large' | 'epic';

interface CelebrationConfig {
  confettiCount: number;
  fireworkBursts: number;
  fireworkParticlesPerBurst: number;
  showTrophy: boolean;
  hudRingCount: number;
  showerCount: number;
  duration: number;
  flashIntensity: number;
}

const CELEBRATION_CONFIGS: Record<CelebrationLevel, CelebrationConfig> = {
  none: {
    confettiCount: 0, fireworkBursts: 0, fireworkParticlesPerBurst: 0,
    showTrophy: false, hudRingCount: 0, showerCount: 0, duration: 0, flashIntensity: 0,
  },
  small: {
    confettiCount: 50, fireworkBursts: 0, fireworkParticlesPerBurst: 0,
    showTrophy: false, hudRingCount: 0, showerCount: 0, duration: 2.0, flashIntensity: 0.5,
  },
  medium: {
    confettiCount: 100, fireworkBursts: 0, fireworkParticlesPerBurst: 0,
    showTrophy: false, hudRingCount: 1, showerCount: 40, duration: 2.5, flashIntensity: 1.0,
  },
  large: {
    confettiCount: 150, fireworkBursts: 1, fireworkParticlesPerBurst: 30,
    showTrophy: false, hudRingCount: 2, showerCount: 60, duration: 3.0, flashIntensity: 1.5,
  },
  epic: {
    confettiCount: 250, fireworkBursts: 3, fireworkParticlesPerBurst: 60,
    showTrophy: true, hudRingCount: 3, showerCount: 120, duration: 4.0, flashIntensity: 3.0,
  },
};

// ■■ Props ■■

interface GameCelebrationProps {
  labColor: string;
}

// ■■ Shared scratch objects ■■

const _matrix = new Matrix4();
const _position = new Vector3();
const _quaternion = new Quaternion();
const _scale = new Vector3();
const _euler = new Euler();

const GRAVITY = -9.8;

const CONFETTI_COLORS = [
  '#00BBFF', '#00FF88', '#AA66FF', '#FF6644', '#FFAA44',
  '#FF66AA', '#06B6D4', '#818CF8', '#F97316', '#D946EF',
];

// ════════════════════════════════════════════════════
// Sub: Confetti Burst (scaled by count)
// ════════════════════════════════════════════════════

function ConfettiEffect({
  count,
  elapsed,
  duration,
  labColor,
}: {
  count: number;
  elapsed: number;
  duration: number;
  labColor: string;
}) {
  const meshRef = useRef<InstancedMesh>(null);

  const data = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const rotations = new Float32Array(count * 3);
    const rotSpeeds = new Float32Array(count * 3);
    const colors: Color[] = [];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 0.3;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = (Math.random() - 0.5) * 0.3;

      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      velocities[i3] = Math.cos(angle) * speed * 0.6;
      velocities[i3 + 1] = 4 + Math.random() * 6;
      velocities[i3 + 2] = Math.sin(angle) * speed * 0.6;

      rotations[i3] = Math.random() * Math.PI * 2;
      rotations[i3 + 1] = Math.random() * Math.PI * 2;
      rotations[i3 + 2] = Math.random() * Math.PI * 2;
      rotSpeeds[i3] = (Math.random() - 0.5) * 8;
      rotSpeeds[i3 + 1] = (Math.random() - 0.5) * 8;
      rotSpeeds[i3 + 2] = (Math.random() - 0.5) * 8;

      const palette = i % 3 === 0 ? labColor : CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      colors.push(new Color(palette));
    }

    return { positions, velocities, rotations, rotSpeeds, colors };
  }, [count, labColor]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = elapsed;
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
      _scale.set(s, s * 0.4, s);
      _matrix.compose(_position, _quaternion, _scale);
      mesh.setMatrixAt(i, _matrix);
      mesh.setColorAt(i, data.colors[i]);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial transparent opacity={0.9} roughness={0.4} metalness={0.3} />
    </instancedMesh>
  );
}

// ════════════════════════════════════════════════════
// Sub: Firework Bursts (0-3 bursts based on level)
// ════════════════════════════════════════════════════

function FireworkEffect({
  burstCount,
  particlesPerBurst,
  elapsed,
  labColor,
}: {
  burstCount: number;
  particlesPerBurst: number;
  elapsed: number;
  labColor: string;
}) {
  const meshRef = useRef<InstancedMesh>(null);

  const bursts = useMemo(() => {
    const centers = [
      { center: new Vector3(-1.5, 2.5, 0), delay: 0.0, color: new Color(labColor) },
      { center: new Vector3(1.0, 3.0, -0.5), delay: 0.6, color: new Color('#AA66FF') },
      { center: new Vector3(0, 3.5, 0.5), delay: 1.2, color: new Color('#FF6644') },
    ].slice(0, burstCount);

    return centers.map((b) => {
      const dirs = new Float32Array(particlesPerBurst * 3);
      for (let i = 0; i < particlesPerBurst; i++) {
        const i3 = i * 3;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 1.5 + Math.random() * 2.5;
        dirs[i3] = Math.sin(phi) * Math.cos(theta) * speed;
        dirs[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
        dirs[i3 + 2] = Math.cos(phi) * speed;
      }
      return { ...b, directions: dirs };
    });
  }, [burstCount, particlesPerBurst, labColor]);

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
          _scale.set(0, 0, 0);
          _position.set(0, -100, 0);
        } else {
          const fade = Math.max(0, 1 - burstT / 2.0);
          const px = burst.center.x + burst.directions[i3] * burstT;
          const py = burst.center.y + burst.directions[i3 + 1] * burstT + 0.5 * GRAVITY * 0.15 * burstT * burstT;
          const pz = burst.center.z + burst.directions[i3 + 2] * burstT;
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

  if (burstCount === 0 || particlesPerBurst === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, totalCount]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial emissive="#ffffff" emissiveIntensity={1.5} transparent opacity={0.9} />
    </instancedMesh>
  );
}

// ════════════════════════════════════════════════════
// Sub: Trophy Popup (epic only)
// ════════════════════════════════════════════════════

function TrophyEffect({ elapsed, duration }: { elapsed: number; duration: number }) {
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const scaleT = Math.min(elapsed / 0.8, 1);
    const elastic = scaleT < 1
      ? 1 - Math.pow(Math.cos(scaleT * Math.PI * 0.5), 3) * Math.cos(scaleT * 10) * (1 - scaleT)
      : 1;
    const s = Math.max(0, elastic);

    const fadeT = elapsed > duration - 1.0 ? 1 - (elapsed - (duration - 1.0)) : 1;
    const finalScale = s * Math.max(0, fadeT);

    group.scale.setScalar(finalScale);
    group.rotation.y = elapsed * 1.5;
    group.position.y = 1.0 + Math.sin(elapsed * 2) * 0.1;
  });

  return (
    <group ref={groupRef} scale={0}>
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 0.4, 12]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.4} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.25, 0.15, 0.5, 12]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.4} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFAA44" emissiveIntensity={0.6} metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

// ════════════════════════════════════════════════════
// Sub: HUD Rings (0-3 rings based on level)
// ════════════════════════════════════════════════════

function HUDRingEffect({ count, elapsed, labColor }: { count: number; elapsed: number; labColor: string }) {
  const ringsRef = useRef<Group>(null);

  const materials = useMemo(
    () =>
      Array.from({ length: count }, () =>
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
    [count, labColor],
  );

  useEffect(() => {
    return () => {
      materials.forEach((m) => m.dispose());
    };
  }, [materials]);

  useFrame(() => {
    const group = ringsRef.current;
    if (!group) return;

    for (let i = 0; i < count; i++) {
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
      const eased = 1 - Math.pow(1 - progress, 3);
      const scale = 0.5 + eased * 3.5;
      ring.scale.setScalar(scale);

      const mat = materials[i];
      mat.opacity = Math.max(0, 1 - progress);
      ring.rotation.x = Math.PI / 2;
    }
  });

  if (count === 0) return null;

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
// Sub: Particle Shower (medium+ celebrations)
// ════════════════════════════════════════════════════

function ShowerEffect({
  count,
  elapsed,
  duration,
  labColor,
}: {
  count: number;
  elapsed: number;
  duration: number;
  labColor: string;
}) {
  const meshRef = useRef<InstancedMesh>(null);

  const data = useMemo(() => {
    const xPositions = new Float32Array(count);
    const zPositions = new Float32Array(count);
    const speeds = new Float32Array(count);
    const offsets = new Float32Array(count);
    const shimmerPhases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      xPositions[i] = (Math.random() - 0.5) * 6;
      zPositions[i] = (Math.random() - 0.5) * 4;
      speeds[i] = 1.5 + Math.random() * 3;
      offsets[i] = Math.random() * 5;
      shimmerPhases[i] = Math.random() * Math.PI * 2;
    }

    return { xPositions, zPositions, speeds, offsets, shimmerPhases };
  }, [count]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const fadeOut = elapsed > duration - 1.0 ? 1 - (elapsed - (duration - 1.0)) : 1;

    for (let i = 0; i < count; i++) {
      const y = data.offsets[i] - data.speeds[i] * elapsed;
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

  if (count === 0) return null;

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
// Sub: Victory Flash Light
// ════════════════════════════════════════════════════

function VictoryFlashLight({
  intensity,
  elapsed,
  duration: _duration,
  labColor,
}: {
  intensity: number;
  elapsed: number;
  duration: number;
  labColor: string;
}) {
  const lightRef = useRef<PointLight>(null);

  useFrame(() => {
    if (!lightRef.current) return;
    // Quick bright flash that decays exponentially
    const flashCurve = Math.exp(-elapsed * 2.5) * intensity;
    lightRef.current.intensity = flashCurve;
  });

  if (intensity === 0) return null;

  return (
    <pointLight
      ref={lightRef}
      position={[0, 2, 0]}
      color={labColor}
      distance={30}
      intensity={0}
      decay={2}
    />
  );
}

// ════════════════════════════════════════════════════
// Main: GameCelebration
// ════════════════════════════════════════════════════

function getCelebrationLevel(
  roundProgress: number,
  isGameComplete: boolean,
): CelebrationLevel {
  if (isGameComplete) return 'epic';
  if (roundProgress >= 0.75) return 'large';
  if (roundProgress >= 0.4) return 'medium';
  return 'small';
}

export function GameCelebration({ labColor }: GameCelebrationProps) {
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const isComplete = useGameStore((s) => s.isComplete);

  const [active, setActive] = useState(false);
  const [celebLevel, setCelebLevel] = useState<CelebrationLevel>('none');
  const [elapsed, setElapsed] = useState(0);
  const prevRoundRef = useRef(0);
  const prevCompleteRef = useRef(false);
  const startTimeRef = useRef(0);

  // Detect round advances and game completion
  useEffect(() => {
    // Round advanced (not initial round 1 setup)
    if (currentRound > prevRoundRef.current && prevRoundRef.current > 0) {
      const roundProgress = totalRounds > 0 ? currentRound / totalRounds : 0;
      const level = getCelebrationLevel(roundProgress, false);
      setCelebLevel(level);
      setActive(true);
      setElapsed(0);
      startTimeRef.current = 0;
    }
    prevRoundRef.current = currentRound;
  }, [currentRound, totalRounds]);

  // Game complete — override with epic celebration
  useEffect(() => {
    if (isComplete && !prevCompleteRef.current) {
      setCelebLevel('epic');
      setActive(true);
      setElapsed(0);
      startTimeRef.current = 0;
    }
    prevCompleteRef.current = isComplete;
  }, [isComplete]);

  // Animate elapsed timer
  useFrame((_, delta) => {
    if (!active) return;

    startTimeRef.current += delta;
    setElapsed(startTimeRef.current);

    const config = CELEBRATION_CONFIGS[celebLevel];
    if (startTimeRef.current >= config.duration) {
      setActive(false);
      setCelebLevel('none');
    }
  });

  if (!active || celebLevel === 'none') return null;

  const config = CELEBRATION_CONFIGS[celebLevel];

  return (
    <group name="game-celebration">
      <ConfettiEffect
        count={config.confettiCount}
        elapsed={elapsed}
        duration={config.duration}
        labColor={labColor}
      />
      <FireworkEffect
        burstCount={config.fireworkBursts}
        particlesPerBurst={config.fireworkParticlesPerBurst}
        elapsed={elapsed}
        labColor={labColor}
      />
      {config.showTrophy && (
        <TrophyEffect elapsed={elapsed} duration={config.duration} />
      )}
      <HUDRingEffect
        count={config.hudRingCount}
        elapsed={elapsed}
        labColor={labColor}
      />
      <ShowerEffect
        count={config.showerCount}
        elapsed={elapsed}
        duration={config.duration}
        labColor={labColor}
      />
      <VictoryFlashLight
        intensity={config.flashIntensity}
        elapsed={elapsed}
        duration={config.duration}
        labColor={labColor}
      />
    </group>
  );
}

export default GameCelebration;
