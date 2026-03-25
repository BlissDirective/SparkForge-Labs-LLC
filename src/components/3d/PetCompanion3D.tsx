'use client';

// ================================================================
// PET COMPANION 3D — Roaming AI Pet for the SparkForge Cockpit
// ================================================================
// Enhancement 1.2: Cockpit Personalization Engine
//
// The AI Pet from Pet Trainer lives permanently in the cockpit,
// roaming around, reacting to user actions, and evolving with XP.
//
// Evolution stages:
//   Baby  (level 1-5)   — Simple orb + eyes + antenna
//   Teen  (level 6-15)  — Capsule body + fins + backpack + glow antenna
//   Adult (level 16+)   — Full body + articulated fins + halo ring + chest panel
//
// Behaviors:
//   Idle        — Sine-wave hover, slow rotation, random drift
//   Celebration — Scale bounce + 360 spin + particle burst
//   Tracking    — Lerps toward focused lab position
//   Confused    — Head tilt oscillation after 30s inactivity
//   Blink       — Eyes dim every 4-6 seconds
//
// Triangle budget: ~800
// LOD tier: system
// Dynamic import with ssr: false required.

import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  MathUtils,
  Mesh,
  Object3D,
  Vector3,
} from 'three';
import { useDeviceStore } from '@/stores/deviceStore';

// ================================================================
// Types
// ================================================================

interface PetCompanion3DProps {
  level: number;
  xp: number;
  isCelebrating: boolean;
  focusedLabPosition: [number, number, number] | null;
  petColor?: string;
  visible: boolean;
}

type EvolutionStage = 'baby' | 'teen' | 'adult';

interface DriftState {
  targetX: number;
  targetZ: number;
  nextChangeTime: number;
}

// ================================================================
// Constants
// ================================================================

const DEFAULT_PET_COLOR = '#00BBFF';

const DRIFT_BOUNDS = { x: 1.5, z: 1.5 };
const DRIFT_CHANGE_INTERVAL_MIN = 3.0;
const DRIFT_CHANGE_INTERVAL_MAX = 7.0;
const HOVER_AMPLITUDE = 0.1;
const HOVER_FREQUENCY = 1.5;
const IDLE_ROTATION_SPEED = 0.3;
const TRACKING_LERP = 0.02;
const CONFUSED_TIMEOUT = 30.0;
const BLINK_INTERVAL_MIN = 4.0;
const BLINK_INTERVAL_MAX = 6.0;
const BLINK_DURATION = 0.15;

// Celebration animation
const CELEBRATION_DURATION = 0.5;
const CELEBRATION_SCALE_PEAK = 1.3;
const CELEBRATION_PARTICLE_COUNT = 8;

// Chrome material values (Frost-Prismatic)
const CHROME_METALNESS = 0.8;
const CHROME_ROUGHNESS = 0.2;

// ================================================================
// Helpers
// ================================================================

function getEvolutionStage(level: number): EvolutionStage {
  if (level <= 5) return 'baby';
  if (level <= 15) return 'teen';
  return 'adult';
}

/** Pseudo-random drift using sin/cos combinations (no external noise lib) */
function perlinDrift(time: number, seed: number): number {
  return (
    Math.sin(time * 0.7 + seed * 1.3) * 0.4 +
    Math.cos(time * 1.1 + seed * 2.7) * 0.3 +
    Math.sin(time * 0.3 + seed * 4.1) * 0.3
  );
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// ================================================================
// Celebration Particles (InstancedMesh tiny spheres)
// ================================================================

interface CelebrationParticlesProps {
  active: boolean;
  color: string;
  segments: number;
}

const _particleDummy = new Object3D();
const _particleVelocities: Vector3[] = [];
const _particleLifetimes: number[] = [];

function CelebrationParticles({ active, color, segments }: CelebrationParticlesProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const startTimeRef = useRef(0);
  const isActiveRef = useRef(false);

  // Initialize velocities
  useMemo(() => {
    _particleVelocities.length = 0;
    _particleLifetimes.length = 0;
    for (let i = 0; i < CELEBRATION_PARTICLE_COUNT; i++) {
      const angle = (i / CELEBRATION_PARTICLE_COUNT) * Math.PI * 2;
      const speed = 1.5 + Math.random() * 1.0;
      _particleVelocities.push(
        new Vector3(
          Math.cos(angle) * speed,
          1.0 + Math.random() * 1.5,
          Math.sin(angle) * speed
        )
      );
      _particleLifetimes.push(0);
    }
  }, []);

  const particleColor = useMemo(() => new Color(color), [color]);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Detect rising edge of celebration
    if (active && !isActiveRef.current) {
      isActiveRef.current = true;
      startTimeRef.current = state.clock.elapsedTime;
      // Reset lifetimes
      for (let i = 0; i < CELEBRATION_PARTICLE_COUNT; i++) {
        _particleLifetimes[i] = 0;
      }
    }
    if (!active) {
      isActiveRef.current = false;
    }

    const elapsed = state.clock.elapsedTime - startTimeRef.current;
    const particleDuration = 0.8;

    for (let i = 0; i < CELEBRATION_PARTICLE_COUNT; i++) {
      const t = Math.min(elapsed / particleDuration, 1.0);
      if (elapsed > 0 && elapsed < particleDuration) {
        const vel = _particleVelocities[i];
        _particleDummy.position.set(
          vel.x * t,
          vel.y * t - 2.0 * t * t, // gravity
          vel.z * t
        );
        const fadeScale = Math.max(0, 1.0 - t) * 0.04;
        _particleDummy.scale.setScalar(fadeScale);
      } else {
        _particleDummy.scale.setScalar(0);
        _particleDummy.position.set(0, -10, 0);
      }
      _particleDummy.updateMatrix();
      meshRef.current.setMatrixAt(i, _particleDummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, CELEBRATION_PARTICLE_COUNT]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, segments, segments]} />
      <meshStandardMaterial
        color={particleColor}
        emissive={particleColor}
        emissiveIntensity={1.5}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

// ================================================================
// Eye Component
// ================================================================

interface EyeProps {
  position: [number, number, number];
  dimmed: boolean;
  segments: number;
}

function PetEye({ position, dimmed, segments }: EyeProps) {
  const emissiveIntensity = dimmed ? 0.1 : 1.2;
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.03, segments, segments]} />
      <meshStandardMaterial
        color="#FFFFFF"
        emissive="#00BBFF"
        emissiveIntensity={emissiveIntensity}
        metalness={0.1}
        roughness={0.3}
      />
    </mesh>
  );
}

// ================================================================
// Baby Evolution Geometry
// ================================================================

interface EvolutionProps {
  color: Color;
  eyesDimmed: boolean;
  segments: number;
}

function BabyGeometry({ color, eyesDimmed, segments }: EvolutionProps) {
  return (
    <group>
      {/* Body — simple sphere */}
      <mesh>
        <sphereGeometry args={[0.15, segments, segments]} />
        <meshPhysicalMaterial
          color={color}
          metalness={CHROME_METALNESS}
          roughness={CHROME_ROUGHNESS}
          transmission={0.15}
          thickness={0.5}
          ior={1.5}
        />
      </mesh>

      {/* Eyes */}
      <PetEye position={[-0.05, 0.04, 0.13]} dimmed={eyesDimmed} segments={segments} />
      <PetEye position={[0.05, 0.04, 0.13]} dimmed={eyesDimmed} segments={segments} />

      {/* Antenna */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.08, 4]} />
        <meshStandardMaterial
          color="#AAAAAA"
          metalness={CHROME_METALNESS}
          roughness={CHROME_ROUGHNESS}
        />
      </mesh>
      {/* Antenna tip */}
      <mesh position={[0, 0.23, 0]}>
        <sphereGeometry args={[0.015, segments, segments]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ================================================================
// Teen Evolution Geometry
// ================================================================

function TeenGeometry({ color, eyesDimmed, segments }: EvolutionProps) {
  return (
    <group>
      {/* Body — elongated capsule-like shape (cylinder + sphere caps) */}
      <mesh>
        <capsuleGeometry args={[0.12, 0.14, Math.max(4, segments), segments]} />
        <meshPhysicalMaterial
          color={color}
          metalness={CHROME_METALNESS}
          roughness={CHROME_ROUGHNESS}
          transmission={0.12}
          thickness={0.6}
          ior={1.5}
        />
      </mesh>

      {/* Eyes */}
      <PetEye position={[-0.06, 0.06, 0.1]} dimmed={eyesDimmed} segments={segments} />
      <PetEye position={[0.06, 0.06, 0.1]} dimmed={eyesDimmed} segments={segments} />

      {/* Hover fins (2 small planes) */}
      <mesh position={[-0.16, -0.02, 0]} rotation={[0, 0, -0.3]}>
        <planeGeometry args={[0.08, 0.04]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          side={DoubleSide}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0.16, -0.02, 0]} rotation={[0, 0, 0.3]}>
        <planeGeometry args={[0.08, 0.04]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          side={DoubleSide}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Antenna with glow tip */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.1, 4]} />
        <meshStandardMaterial
          color="#CCCCCC"
          metalness={CHROME_METALNESS}
          roughness={CHROME_ROUGHNESS}
        />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.02, segments, segments]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>

      {/* Backpack (small box) */}
      <mesh position={[0, -0.02, -0.13]}>
        <boxGeometry args={[0.08, 0.07, 0.04]} />
        <meshStandardMaterial
          color="#334155"
          metalness={CHROME_METALNESS}
          roughness={CHROME_ROUGHNESS}
        />
      </mesh>
    </group>
  );
}

// ================================================================
// Adult Evolution Geometry
// ================================================================

function AdultGeometry({ color, eyesDimmed, segments }: EvolutionProps) {
  const haloRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!haloRef.current) return;
    haloRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.8) * 0.2 + 0.3;
    haloRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.6) * 0.15;
  });

  return (
    <group>
      {/* Body — larger capsule */}
      <mesh>
        <capsuleGeometry args={[0.14, 0.18, Math.max(4, segments), segments]} />
        <meshPhysicalMaterial
          color={color}
          metalness={CHROME_METALNESS}
          roughness={CHROME_ROUGHNESS}
          transmission={0.1}
          thickness={0.7}
          ior={1.5}
        />
      </mesh>

      {/* Eyes */}
      <PetEye position={[-0.07, 0.08, 0.12]} dimmed={eyesDimmed} segments={segments} />
      <PetEye position={[0.07, 0.08, 0.12]} dimmed={eyesDimmed} segments={segments} />

      {/* Articulated fins (slightly larger, angled) */}
      <mesh position={[-0.19, 0, 0]} rotation={[0.15, 0, -0.4]}>
        <planeGeometry args={[0.1, 0.05]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          side={DoubleSide}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0.19, 0, 0]} rotation={[-0.15, 0, 0.4]}>
        <planeGeometry args={[0.1, 0.05]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          side={DoubleSide}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Antenna */}
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.12, 4]} />
        <meshStandardMaterial
          color="#CCCCCC"
          metalness={CHROME_METALNESS}
          roughness={CHROME_ROUGHNESS}
        />
      </mesh>
      <mesh position={[0, 0.33, 0]}>
        <sphereGeometry args={[0.022, segments, segments]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>

      {/* Backpack */}
      <mesh position={[0, -0.01, -0.16]}>
        <boxGeometry args={[0.1, 0.09, 0.05]} />
        <meshStandardMaterial
          color="#334155"
          metalness={CHROME_METALNESS}
          roughness={CHROME_ROUGHNESS}
        />
      </mesh>

      {/* Halo ring (TorusGeometry) orbiting above head */}
      <mesh ref={haloRef} position={[0, 0.38, 0]}>
        <torusGeometry args={[0.1, 0.01, Math.max(4, segments), segments]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.0}
          toneMapped={false}
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>

      {/* Emissive chest panel */}
      <mesh position={[0, -0.02, 0.145]}>
        <planeGeometry args={[0.06, 0.04]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.9}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ================================================================
// Main Component
// ================================================================

export function PetCompanion3D({
  level,
  xp,
  isCelebrating,
  focusedLabPosition,
  petColor = DEFAULT_PET_COLOR,
  visible,
}: PetCompanion3DProps) {
  const _particleMultiplier = useDeviceStore((s) => s.profile.particleMultiplier);

  const groupRef = useRef<Group>(null);
  const innerGroupRef = useRef<Group>(null);

  // Blink state
  const [eyesDimmed, setEyesDimmed] = useState(false);
  const nextBlinkRef = useRef(randomRange(BLINK_INTERVAL_MIN, BLINK_INTERVAL_MAX));
  const blinkTimerRef = useRef(0);

  // Celebration state
  const celebrationStartRef = useRef(-1);
  const wasCelebratingRef = useRef(false);

  // Drift state
  const driftRef = useRef<DriftState>({
    targetX: 0,
    targetZ: 0,
    nextChangeTime: randomRange(DRIFT_CHANGE_INTERVAL_MIN, DRIFT_CHANGE_INTERVAL_MAX),
  });

  // Confused state (no activity timer)
  const lastActivityRef = useRef(0);

  // Derived values
  const stage = getEvolutionStage(level);
  const color = useMemo(() => new Color(petColor), [petColor]);
  const segments = 64;

  // Track activity changes
  useEffect(() => {
    lastActivityRef.current = performance.now() / 1000;
  }, [xp, isCelebrating, focusedLabPosition]);

  // Detect celebration start (rising edge)
  const handleCelebrationStart = useCallback(() => {
    celebrationStartRef.current = -1; // will be set in useFrame
  }, []);

  useEffect(() => {
    if (isCelebrating && !wasCelebratingRef.current) {
      handleCelebrationStart();
    }
    wasCelebratingRef.current = isCelebrating;
  }, [isCelebrating, handleCelebrationStart]);

  // Main animation loop
  useFrame((state) => {
    if (!groupRef.current || !innerGroupRef.current || !visible) return;

    const time = state.clock.elapsedTime;
    const delta = state.clock.getDelta() || 0.016;
    const now = performance.now() / 1000;
    const drift = driftRef.current;

    // ── Blink logic ──
    blinkTimerRef.current += delta;
    if (blinkTimerRef.current >= nextBlinkRef.current) {
      setEyesDimmed(true);
      setTimeout(() => setEyesDimmed(false), BLINK_DURATION * 1000);
      blinkTimerRef.current = 0;
      nextBlinkRef.current = randomRange(BLINK_INTERVAL_MIN, BLINK_INTERVAL_MAX);
    }

    // ── Celebration animation ──
    if (isCelebrating) {
      if (celebrationStartRef.current < 0) {
        celebrationStartRef.current = time;
      }
      const celebElapsed = time - celebrationStartRef.current;
      const t = Math.min(celebElapsed / CELEBRATION_DURATION, 1.0);

      // Scale bounce: 1 -> peak -> 1
      const scaleT = t < 0.5 ? t * 2 : 2 - t * 2;
      const scale = 1.0 + (CELEBRATION_SCALE_PEAK - 1.0) * Math.sin(scaleT * Math.PI * 0.5);
      innerGroupRef.current.scale.setScalar(scale);

      // 360 Y spin
      innerGroupRef.current.rotation.y = t * Math.PI * 2;

      if (t >= 1.0) {
        innerGroupRef.current.scale.setScalar(1.0);
      }
    } else {
      // ── Idle rotation ──
      innerGroupRef.current.rotation.y += delta * IDLE_ROTATION_SPEED;
      innerGroupRef.current.scale.setScalar(1.0);
    }

    // ── Hover (sine wave Y offset) ──
    const hoverY = Math.sin(time * HOVER_FREQUENCY) * HOVER_AMPLITUDE;

    // ── Confused behavior (tilt) ──
    const timeSinceActivity = now - lastActivityRef.current;
    let confusedTilt = 0;
    if (timeSinceActivity > CONFUSED_TIMEOUT) {
      confusedTilt = Math.sin(time * 2.5) * 0.2;
    }
    innerGroupRef.current.rotation.z = confusedTilt;

    // ── Position: tracking vs drift ──
    if (focusedLabPosition) {
      // Smoothly track toward focused lab position
      groupRef.current.position.x = MathUtils.lerp(
        groupRef.current.position.x,
        focusedLabPosition[0],
        TRACKING_LERP
      );
      groupRef.current.position.z = MathUtils.lerp(
        groupRef.current.position.z,
        focusedLabPosition[2],
        TRACKING_LERP
      );
      groupRef.current.position.y = MathUtils.lerp(
        groupRef.current.position.y,
        focusedLabPosition[1] + hoverY,
        TRACKING_LERP
      );
    } else {
      // Random drift within bounds
      if (time > drift.nextChangeTime) {
        drift.targetX = perlinDrift(time, 1.0) * DRIFT_BOUNDS.x;
        drift.targetZ = perlinDrift(time, 2.0) * DRIFT_BOUNDS.z;
        drift.nextChangeTime = time + randomRange(
          DRIFT_CHANGE_INTERVAL_MIN,
          DRIFT_CHANGE_INTERVAL_MAX
        );
      }

      groupRef.current.position.x = MathUtils.lerp(
        groupRef.current.position.x,
        drift.targetX,
        0.01
      );
      groupRef.current.position.z = MathUtils.lerp(
        groupRef.current.position.z,
        drift.targetZ,
        0.01
      );
      groupRef.current.position.y = hoverY;
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      <group ref={innerGroupRef}>
        {/* Evolution-stage geometry */}
        {stage === 'baby' && (
          <BabyGeometry color={color} eyesDimmed={eyesDimmed} segments={segments} />
        )}
        {stage === 'teen' && (
          <TeenGeometry color={color} eyesDimmed={eyesDimmed} segments={segments} />
        )}
        {stage === 'adult' && (
          <AdultGeometry color={color} eyesDimmed={eyesDimmed} segments={segments} />
        )}

        {/* Celebration particle burst */}
        {(
          <CelebrationParticles
            active={isCelebrating}
            color={petColor}
            segments={Math.max(4, Math.round(segments * 0.5))}
          />
        )}
      </group>
    </group>
  );
}
