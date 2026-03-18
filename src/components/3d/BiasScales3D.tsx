'use client';

// ================================================================
// SparkForge BiasScales3D — 3D Justice Scales
// ================================================================
// Decision 6.6: All age bands (A, B, C). 3D balance scales are
// visually intuitive — even young children understand "heavy
// side goes down."
//
// Decision 6.2.5: Custom geometry (beam + 2 chains + 2 platforms).
// ~620 triangles. MeshStandardMaterial brushed brass.
// Spring rotation from weight difference with damping.
// Balanced = golden glow. Unbalanced = red particles.
//
// Architecture:
// - R3F Canvas rendered inside BiasDetectiveGame investigate phase
// - Props: biasWeight (0-1), fairWeight (0-1), isBalanced
// - Spring physics tilt (no physics engine, manual spring)
// - Desktop only — mobile gets CSS fallback
//
// Performance: ~620 triangles. frameloop='always'.
// ================================================================

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { motion } from 'motion/react';
import * as THREE from 'three';
import BiasDetectiveEnvironment from './environments/BiasDetectiveEnvironment';

// -- Types --
interface BiasScales3DProps {
  /** 0-1: amount of bias evidence collected */
  biasWeight: number;
  /** 0-1: amount of neutral evidence collected */
  fairWeight: number;
  /** true when bias/fair are roughly equal */
  isBalanced: boolean;
  /** optional tint for the case (default red) */
  caseColor?: string;
  /** callback when 3D scene is ready */
  onReady?: () => void;
}

// -- Constants --
const BRASS_COLOR = new THREE.Color('#B8860B');
const BRASS_DARK = new THREE.Color('#8B6914');
const GOLD_GLOW = new THREE.Color('#FFD700');
const RED_WARN = new THREE.Color('#EF4444');
const FAIR_GREEN = new THREE.Color('#10B981');

const SPRING_STIFFNESS = 4.0;
const SPRING_DAMPING = 0.85;
const MAX_TILT = Math.PI / 6; // 30 degrees max

// -- Brushed brass material (shared) --
function useBrassMaterial() {
  return useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: BRASS_COLOR,
      metalness: 0.8,
      roughness: 0.3,
      envMapIntensity: 0.6,
    });
  }, []);
}

// -- Warning Particles (red, emit when severely unbalanced) --
function WarningParticles({ active, side }: { active: boolean; side: 'left' | 'right' }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 20;

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const xOffset = side === 'left' ? -1.2 : 1.2;

    for (let i = 0; i < count; i++) {
      pos[i * 3] = xOffset + (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = -0.8 + Math.random() * 0.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

      vel[i * 3] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 1] = 0.01 + Math.random() * 0.03;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    return { positions: pos, velocities: vel };
  }, [side]);

  useFrame(() => {
    if (!active || !pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const arr = posAttr.array as Float32Array;
    const xOffset = side === 'left' ? -1.2 : 1.2;

    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 3];
      arr[i * 3 + 1] += velocities[i * 3 + 1];
      arr[i * 3 + 2] += velocities[i * 3 + 2];

      // Reset particles that float too high
      if (arr[i * 3 + 1] > 0.5) {
        arr[i * 3] = xOffset + (Math.random() - 0.5) * 0.4;
        arr[i * 3 + 1] = -0.8;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      }
    }

    // [CR-6F-A2] needsUpdate inside useFrame, not outside
    posAttr.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={RED_WARN}
        size={0.04}
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// -- Gold Glow (emissive ring when balanced) --
function BalancedGlow({ active }: { active: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!ringRef.current) return;
    const targetOpacity = active ? 0.6 : 0;
    const mat = ringRef.current.material as THREE.MeshStandardMaterial;
    mat.opacity += (targetOpacity - mat.opacity) * delta * 3;

    // Gentle pulse
    if (active) {
      const scale = 1 + Math.sin(Date.now() * 0.003) * 0.05;
      ringRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={ringRef} position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.3, 0.05, 8, 24]} />
      <meshStandardMaterial
        color={GOLD_GLOW}
        emissive={GOLD_GLOW}
        emissiveIntensity={0.8}
        transparent
        opacity={0}
        depthWrite={false}
      />
    </mesh>
  );
}

// -- Main Scales Component --
export default function BiasScales3D({
  biasWeight,
  fairWeight,
  isBalanced,
  caseColor = '#EF4444',
  onReady,
}: BiasScales3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const leftPlatRef = useRef<THREE.Group>(null);
  const rightPlatRef = useRef<THREE.Group>(null);
  const brassMat = useBrassMaterial();

  // Spring physics state
  const springRef = useRef({ angle: 0, velocity: 0 });

  // Determine tilt target from weights
  const targetAngle = useMemo(() => {
    const diff = biasWeight - fairWeight;
    return THREE.MathUtils.clamp(diff * MAX_TILT * 2, -MAX_TILT, MAX_TILT);
  }, [biasWeight, fairWeight]);

  // Severely unbalanced = particles
  const severeImbalance = Math.abs(biasWeight - fairWeight) > 0.5;

  // [CR-6F-A5] Notify ready via useEffect (not useMemo)
  useEffect(() => {
    onReady?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Spring physics per frame
  useFrame((_, delta) => {
    const spring = springRef.current;
    const force = (targetAngle - spring.angle) * SPRING_STIFFNESS;
    spring.velocity += force * delta;
    spring.velocity *= SPRING_DAMPING;
    spring.angle += spring.velocity;

    // Apply beam rotation
    if (beamRef.current) {
      beamRef.current.rotation.z = spring.angle;
    }

    // Move platforms based on beam tilt
    const armLength = 1.2;
    if (leftPlatRef.current) {
      leftPlatRef.current.position.y = -0.4 + Math.sin(spring.angle) * armLength * 0.5;
      leftPlatRef.current.position.x = -armLength;
    }
    if (rightPlatRef.current) {
      rightPlatRef.current.position.y = -0.4 - Math.sin(spring.angle) * armLength * 0.5;
      rightPlatRef.current.position.x = armLength;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* [5M] Immersive Courtroom Environment */}
      <BiasDetectiveEnvironment
        isBalanced={isBalanced}
        caseColor={caseColor}
      />

      {/* Fulcrum / base pillar */}
      <mesh position={[0, -0.2, 0]} material={brassMat}>
        <cylinderGeometry args={[0.12, 0.18, 0.8, 12]} />
      </mesh>

      {/* Base plate */}
      <mesh position={[0, -0.65, 0]} material={brassMat}>
        <cylinderGeometry args={[0.4, 0.4, 0.08, 16]} />
      </mesh>

      {/* Fulcrum point / pivot cap */}
      <mesh position={[0, 0.22, 0]} material={brassMat}>
        <sphereGeometry args={[0.08, 12, 8]} />
      </mesh>

      {/* Beam (tilts with spring physics) */}
      <mesh ref={beamRef} position={[0, 0.2, 0]} material={brassMat}>
        <boxGeometry args={[2.6, 0.06, 0.1]} />
      </mesh>

      {/* Left platform group (BIAS side) */}
      <group ref={leftPlatRef} position={[-1.2, -0.4, 0]}>
        {/* Chain segments (3 links) */}
        {[0, 0.15, 0.3].map((y, i) => (
          <mesh key={`lc-${i}`} position={[0, 0.6 - y, 0]}>
            <torusGeometry args={[0.04, 0.012, 6, 8]} />
            <meshStandardMaterial color={BRASS_DARK} metalness={0.7} roughness={0.4} />
          </mesh>
        ))}

        {/* Platform dish */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.04, 16]} />
          <meshStandardMaterial color={BRASS_DARK} metalness={0.7} roughness={0.35} />
        </mesh>

        {/* Bias weight indicator (red sphere, scales with weight) */}
        {biasWeight > 0 && (
          <mesh position={[0, 0.08, 0]}>
            <sphereGeometry args={[0.08 + biasWeight * 0.12, 10, 8]} />
            <meshStandardMaterial
              color={RED_WARN}
              emissive={RED_WARN}
              emissiveIntensity={0.3}
              transparent
              opacity={0.7}
            />
          </mesh>
        )}

        {/* Label */}
        <mesh position={[0, -0.15, 0]}>
          <planeGeometry args={[0.5, 0.12]} />
          <meshBasicMaterial color="black" transparent opacity={0} />
        </mesh>
      </group>

      {/* Right platform group (FAIR side) */}
      <group ref={rightPlatRef} position={[1.2, -0.4, 0]}>
        {/* Chain segments */}
        {[0, 0.15, 0.3].map((y, i) => (
          <mesh key={`rc-${i}`} position={[0, 0.6 - y, 0]}>
            <torusGeometry args={[0.04, 0.012, 6, 8]} />
            <meshStandardMaterial color={BRASS_DARK} metalness={0.7} roughness={0.4} />
          </mesh>
        ))}

        {/* Platform dish */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.04, 16]} />
          <meshStandardMaterial color={BRASS_DARK} metalness={0.7} roughness={0.35} />
        </mesh>

        {/* Fair weight indicator (green sphere) — [CR-6F-A6] uses hoisted constant */}
        {fairWeight > 0 && (
          <mesh position={[0, 0.08, 0]}>
            <sphereGeometry args={[0.08 + fairWeight * 0.12, 10, 8]} />
            <meshStandardMaterial
              color={FAIR_GREEN}
              emissive={FAIR_GREEN}
              emissiveIntensity={0.3}
              transparent
              opacity={0.7}
            />
          </mesh>
        )}
      </group>

      {/* Balanced glow ring */}
      <BalancedGlow active={isBalanced} />

      {/* Warning particles when severely unbalanced */}
      <WarningParticles
        active={severeImbalance}
        side={biasWeight > fairWeight ? 'left' : 'right'}
      />

      {/* Environment for reflections (uses station HDR if available) */}
      <Environment preset="studio" />
    </group>
  );
}

// -- Export helper for weight calculation --
// [CR-6F-A4] Removed unused first parameter `evidence`
export function calculateScaleWeights(
  collected: string[],
  allEvidence: { id: string; biasRelevant: boolean }[]
): { biasWeight: number; fairWeight: number; isBalanced: boolean } {
  const collectedItems = allEvidence.filter(e => collected.includes(e.id));
  const biasCount = collectedItems.filter(e => e.biasRelevant).length;
  const fairCount = collectedItems.filter(e => !e.biasRelevant).length;

  const totalBias = allEvidence.filter(e => e.biasRelevant).length;
  const totalFair = allEvidence.filter(e => !e.biasRelevant).length;

  const biasWeight = totalBias > 0 ? biasCount / totalBias : 0;
  const fairWeight = totalFair > 0 ? fairCount / totalFair : 0;
  const isBalanced = Math.abs(biasWeight - fairWeight) < 0.2;

  return { biasWeight, fairWeight, isBalanced };
}

// ================================================================
// CSS Fallback for Mobile (appended to BiasScales3D.tsx)
// ================================================================
// On mobile (< 768px), the R3F canvas is not rendered.
// Instead, this Framer Motion component provides a visual
// balance scale using CSS transforms.
// [CR-6F-A3] motion import is at top of file — no duplicate needed

export function BiasScalesFallback({
  biasWeight,
  fairWeight,
  isBalanced,
}: {
  biasWeight: number;
  fairWeight: number;
  isBalanced: boolean;
}) {
  const tiltDeg = (biasWeight - fairWeight) * 30; // max 30deg
  const severeImbalance = Math.abs(biasWeight - fairWeight) > 0.5;

  return (
    <div
      className="relative w-full h-24 flex items-center justify-center"
      aria-hidden="true"
    >
      {/* Fulcrum */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-10"
        style={{ background: 'linear-gradient(180deg, #B8860B, #8B6914)' }}
      />

      {/* Base */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full"
        style={{ background: '#8B6914' }}
      />

      {/* Beam */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 h-1 rounded-full"
        style={{
          width: '80%',
          background: 'linear-gradient(90deg, #B8860B, #D4A640, #B8860B)',
          transformOrigin: 'center center',
        }}
        animate={{ rotate: tiltDeg }}
        transition={{ type: 'spring', stiffness: 80, damping: 12 }}
      >
        {/* Left pan (BIAS) */}
        <div className="absolute -left-1 top-full flex flex-col items-center">
          <div className="w-px h-6" style={{ background: '#8B6914' }} />
          <motion.div
            className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
            style={{
              borderColor: severeImbalance && biasWeight > fairWeight ? '#EF4444' : '#B8860B',
              background: biasWeight > 0
                ? `rgba(239, 68, 68, ${0.1 + biasWeight * 0.3})`
                : 'rgba(184, 134, 11, 0.1)',
            }}
            animate={{ scale: biasWeight > 0 ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-[9px] font-bold text-red-400">
              {Math.round(biasWeight * 100)}%
            </span>
          </motion.div>
          <span className="text-[8px] text-white/30 mt-0.5">Bias</span>
        </div>

        {/* Right pan (FAIR) */}
        <div className="absolute -right-1 top-full flex flex-col items-center">
          <div className="w-px h-6" style={{ background: '#8B6914' }} />
          <motion.div
            className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
            style={{
              borderColor: severeImbalance && fairWeight > biasWeight ? '#10B981' : '#B8860B',
              background: fairWeight > 0
                ? `rgba(16, 185, 129, ${0.1 + fairWeight * 0.3})`
                : 'rgba(184, 134, 11, 0.1)',
            }}
            animate={{ scale: fairWeight > 0 ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          >
            <span className="text-[9px] font-bold text-emerald-400">
              {Math.round(fairWeight * 100)}%
            </span>
          </motion.div>
          <span className="text-[8px] text-white/30 mt-0.5">Fair</span>
        </div>
      </motion.div>

      {/* Balanced glow */}
      {isBalanced && (
        <motion.div
          className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.4), transparent)' }}
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
}
