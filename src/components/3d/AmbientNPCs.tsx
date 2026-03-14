'use client';

// ════════════════════════════════════════════════════
// AmbientNPCs — Articulated Robot Assistants
// ════════════════════════════════════════════════════
// Enhancement 2.0: Fully articulated robot NPCs with 5 personality
// types, Perlin noise patrol paths, arm bob, head tracking, visor
// blinks, and hover pad glow pulses.
//
// Triangle budget: 200K-500K total (~500 tris per bot, max 8 bots).
// Device scaling: Desktop 8, Tablet 4, Mobile 0.

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useDeviceStore } from '@/stores/deviceStore';

// ── Types ──────────────────────────────────────────

interface AmbientNPCsProps {
  visible: boolean;
  focusedLabPosition: [number, number, number] | null;
}

type PersonalityType = 'scout' | 'engineer' | 'medic' | 'guardian' | 'scholar';

interface BotPersonality {
  type: PersonalityType;
  color: string;
  speedMult: number;
  scaleMult: number;
  heightOffset: number;
  description: string;
}

interface BotState {
  id: number;
  personality: BotPersonality;
  pathSeed: number;
  height: number;
  speed: number;
  phase: number;
  scale: number;
  visorBlinkInterval: number; // 3-8 seconds
}

// ── Personality Definitions ────────────────────────

const PERSONALITIES: BotPersonality[] = [
  { type: 'scout', color: '#00BBFF', speedMult: 1.4, scaleMult: 0.8, heightOffset: 0, description: 'Fast scanner' },
  { type: 'engineer', color: '#FFAA44', speedMult: 1.0, scaleMult: 1.0, heightOffset: 0, description: 'Tool carrier' },
  { type: 'medic', color: '#00FF88', speedMult: 0.9, scaleMult: 0.95, heightOffset: 0.3, description: 'Gentle healer' },
  { type: 'guardian', color: '#FF6644', speedMult: 0.8, scaleMult: 1.2, heightOffset: 0, description: 'Patrol sentinel' },
  { type: 'scholar', color: '#AA66FF', speedMult: 0.6, scaleMult: 0.9, heightOffset: 0.1, description: 'Console drifter' },
];

// ── Simple Perlin-like noise (2D) ──────────────────

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

// Hash function for pseudo-random gradients
function grad2d(hash: number, x: number, y: number): number {
  const h = hash & 3;
  const u = h < 2 ? x : -x;
  const v = h === 0 || h === 3 ? y : -y;
  return u + v;
}

// Permutation table (static)
const PERM: number[] = (() => {
  const p = Array.from({ length: 256 }, (_, i) => i);
  // Fisher-Yates with fixed seed for determinism
  let seed = 42;
  for (let i = 255; i > 0; i--) {
    seed = (seed * 16807) % 2147483647;
    const j = seed % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  return [...p, ...p]; // Double for wrapping
})();

function noise2D(x: number, y: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);
  const aa = PERM[PERM[X] + Y];
  const ab = PERM[PERM[X] + Y + 1];
  const ba = PERM[PERM[X + 1] + Y];
  const bb = PERM[PERM[X + 1] + Y + 1];
  return lerp(
    lerp(grad2d(aa, xf, yf), grad2d(ba, xf - 1, yf), u),
    lerp(grad2d(ab, xf, yf - 1), grad2d(bb, xf - 1, yf - 1), u),
    v
  );
}

// ── Articulated Robot Bot (~500 tris) ──────────────

function ArticulatedBot({
  botState,
  time,
  focusedLabPosition,
}: {
  botState: BotState;
  time: number;
  focusedLabPosition: [number, number, number] | null;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const visorMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const antennaTipMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const leftPadMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const rightPadMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const { personality, pathSeed, speed, phase, scale, visorBlinkInterval } = botState;
  // Track previous position for facing direction
  const prevPos = useRef<[number, number, number]>([0, 0, 0]);
  const currentFacing = useRef(0);

  useFrame(() => {
    if (!groupRef.current) return;

    const t = time;
    const s = pathSeed;

    // Perlin noise patrol path
    const noiseX = noise2D(t * speed * 0.15 + s * 10, s * 3.7) * 6;
    const noiseZ = noise2D(s * 5.2, t * speed * 0.15 + s * 7.1) * 6;
    const baseRadius = 5 + (s % 3) * 1.5;
    const angle = t * speed * 0.2 + phase;

    const x = Math.cos(angle) * baseRadius + noiseX;
    const z = Math.sin(angle) * baseRadius + noiseZ;
    const baseHeight = 1.2 + personality.heightOffset + botState.height;
    const y = baseHeight + Math.sin(t * 0.7 + phase) * 0.2;

    groupRef.current.position.set(x, y, z);
    groupRef.current.scale.setScalar(scale * personality.scaleMult);

    // Head tracking: face direction of movement or focused lab
    const dx = x - prevPos.current[0];
    const dz = z - prevPos.current[2];
    const moveSpeed = Math.sqrt(dx * dx + dz * dz);

    let targetFacing = currentFacing.current;
    if (moveSpeed > 0.001) {
      targetFacing = Math.atan2(dx, dz);
    }

    // If near focused lab, turn toward it
    if (focusedLabPosition) {
      const labDx = focusedLabPosition[0] - x;
      const labDz = focusedLabPosition[2] - z;
      const dist = Math.sqrt(labDx * labDx + labDz * labDz);
      if (dist < 4) {
        const labAngle = Math.atan2(labDx, labDz);
        targetFacing = labAngle;
      }
    }

    // Smooth facing rotation
    let diff = targetFacing - currentFacing.current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    currentFacing.current += diff * 0.05;
    groupRef.current.rotation.y = currentFacing.current;

    prevPos.current = [x, y, z];

    // Arm bob animation (swing during movement)
    const armSwing = Math.sin(t * 3 + phase) * 0.3 * Math.min(moveSpeed * 20, 1);
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = armSwing;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = -armSwing;
    }

    // Visor blink (emissive flickers briefly every 3-8 seconds)
    if (visorMatRef.current) {
      const blinkCycle = t % visorBlinkInterval;
      const isBlinking = blinkCycle < 0.1;
      visorMatRef.current.opacity = isBlinking ? 0.2 : 1.0;
    }

    // Antenna tip pulse
    if (antennaTipMatRef.current) {
      const pulse = (Math.sin(t * 2.5 + phase * 3) + 1) * 0.5;
      antennaTipMatRef.current.emissiveIntensity = 0.5 + pulse * 1.5;
    }

    // Hover pad glow pulse
    const padPulse = (Math.sin(t * 1.8 + phase) + 1) * 0.5;
    const padIntensity = 0.8 + padPulse * 1.2;
    if (leftPadMatRef.current) {
      leftPadMatRef.current.emissiveIntensity = padIntensity;
    }
    if (rightPadMatRef.current) {
      rightPadMatRef.current.emissiveIntensity = padIntensity;
    }
  });

  const metalProps = {
    metalness: 0.85,
    roughness: 0.25,
  };

  return (
    <group ref={groupRef}>
      {/* ── Head ── */}
      <group ref={headRef} position={[0, 0.22, 0]}>
        {/* Cranium */}
        <mesh>
          <sphereGeometry args={[0.1, 16, 12]} />
          <meshStandardMaterial
            color="#1A1822"
            {...metalProps}
            emissive={personality.color}
            emissiveIntensity={0.15}
          />
        </mesh>
        {/* Visor */}
        <mesh position={[0, 0, 0.085]} rotation-y={0}>
          <ringGeometry args={[0.03, 0.075, 16, 1, 0, Math.PI]} />
          <meshBasicMaterial
            ref={visorMatRef}
            color={personality.color}
            transparent
            opacity={1.0}
          />
        </mesh>
        {/* Antenna */}
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.1, 6]} />
          <meshStandardMaterial color="#333" {...metalProps} />
        </mesh>
        {/* Antenna tip */}
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.018, 8, 6]} />
          <meshStandardMaterial
            ref={antennaTipMatRef}
            color={personality.color}
            emissive={personality.color}
            emissiveIntensity={1.0}
            {...metalProps}
          />
        </mesh>
      </group>

      {/* ── Body (torso) ── */}
      <group position={[0, 0.05, 0]}>
        <RoundedBox args={[0.18, 0.2, 0.12]} radius={0.02} smoothness={2}>
          <meshStandardMaterial
            color="#1A1822"
            {...metalProps}
            emissive={personality.color}
            emissiveIntensity={0.1}
          />
        </RoundedBox>
        {/* Panel detail line — horizontal */}
        <mesh position={[0, 0.03, 0.062]}>
          <boxGeometry args={[0.14, 0.008, 0.002]} />
          <meshStandardMaterial
            color={personality.color}
            emissive={personality.color}
            emissiveIntensity={0.6}
          />
        </mesh>
        {/* Panel detail line — vertical */}
        <mesh position={[0, -0.02, 0.062]}>
          <boxGeometry args={[0.008, 0.08, 0.002]} />
          <meshStandardMaterial
            color={personality.color}
            emissive={personality.color}
            emissiveIntensity={0.4}
          />
        </mesh>

        {/* ── Backpack ── */}
        <group position={[0, 0.02, -0.08]}>
          <mesh>
            <boxGeometry args={[0.1, 0.12, 0.05]} />
            <meshStandardMaterial
              color="#111118"
              {...metalProps}
              emissive={personality.color}
              emissiveIntensity={0.08}
            />
          </mesh>
          {/* Indicator strip */}
          <mesh position={[0, 0, 0.026]}>
            <boxGeometry args={[0.06, 0.015, 0.002]} />
            <meshStandardMaterial
              color={personality.color}
              emissive={personality.color}
              emissiveIntensity={1.0}
            />
          </mesh>
        </group>
      </group>

      {/* ── Left Arm ── */}
      <group ref={leftArmRef} position={[0.13, 0.1, 0]}>
        {/* Shoulder joint */}
        <mesh>
          <sphereGeometry args={[0.025, 8, 6]} />
          <meshStandardMaterial color="#222" {...metalProps} />
        </mesh>
        {/* Upper arm */}
        <mesh position={[0, -0.055, 0]}>
          <cylinderGeometry args={[0.02, 0.018, 0.08, 8]} />
          <meshStandardMaterial
            color="#1A1822"
            {...metalProps}
            emissive={personality.color}
            emissiveIntensity={0.08}
          />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.12, 0]}>
          <boxGeometry args={[0.03, 0.07, 0.025]} />
          <meshStandardMaterial
            color="#222"
            {...metalProps}
            emissive={personality.color}
            emissiveIntensity={0.1}
          />
        </mesh>
        {/* Engineer tool appendage */}
        {personality.type === 'engineer' && (
          <mesh position={[0, -0.17, 0]} rotation-z={0.3}>
            <cylinderGeometry args={[0.008, 0.012, 0.06, 6]} />
            <meshStandardMaterial
              color={personality.color}
              emissive={personality.color}
              emissiveIntensity={0.8}
            />
          </mesh>
        )}
      </group>

      {/* ── Right Arm ── */}
      <group ref={rightArmRef} position={[-0.13, 0.1, 0]}>
        {/* Shoulder joint */}
        <mesh>
          <sphereGeometry args={[0.025, 8, 6]} />
          <meshStandardMaterial color="#222" {...metalProps} />
        </mesh>
        {/* Upper arm */}
        <mesh position={[0, -0.055, 0]}>
          <cylinderGeometry args={[0.02, 0.018, 0.08, 8]} />
          <meshStandardMaterial
            color="#1A1822"
            {...metalProps}
            emissive={personality.color}
            emissiveIntensity={0.08}
          />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.12, 0]}>
          <boxGeometry args={[0.03, 0.07, 0.025]} />
          <meshStandardMaterial
            color="#222"
            {...metalProps}
            emissive={personality.color}
            emissiveIntensity={0.1}
          />
        </mesh>
      </group>

      {/* ── Hover Pads (instead of legs) ── */}
      {/* Left pad */}
      <group position={[0.055, -0.1, 0]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 0.015, 12]} />
          <meshStandardMaterial
            color="#1A1822"
            {...metalProps}
            emissive={personality.color}
            emissiveIntensity={0.2}
          />
        </mesh>
        {/* Glow underneath */}
        <mesh position={[0, -0.012, 0]} rotation-x={Math.PI}>
          <cylinderGeometry args={[0.035, 0.025, 0.005, 12]} />
          <meshStandardMaterial
            ref={leftPadMatRef}
            color={personality.color}
            emissive={personality.color}
            emissiveIntensity={1.0}
            transparent
            opacity={0.8}
          />
        </mesh>
      </group>
      {/* Right pad */}
      <group position={[-0.055, -0.1, 0]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 0.015, 12]} />
          <meshStandardMaterial
            color="#1A1822"
            {...metalProps}
            emissive={personality.color}
            emissiveIntensity={0.2}
          />
        </mesh>
        {/* Glow underneath */}
        <mesh position={[0, -0.012, 0]} rotation-x={Math.PI}>
          <cylinderGeometry args={[0.035, 0.025, 0.005, 12]} />
          <meshStandardMaterial
            ref={rightPadMatRef}
            color={personality.color}
            emissive={personality.color}
            emissiveIntensity={1.0}
            transparent
            opacity={0.8}
          />
        </mesh>
      </group>
    </group>
  );
}

// ── Main Component ─────────────────────────────────

export function AmbientNPCs({ visible, focusedLabPosition }: AmbientNPCsProps) {
  const botsRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const [currentTime, setCurrentTime] = useState(0);
  const profile = useDeviceStore((s) => s.profile);

  // Device scaling: Desktop 8, Tablet 4, Mobile 0
  const botCount = profile.lodBias === 'high' ? 8 : profile.lodBias === 'medium' ? 4 : 0;

  const bots = useMemo<BotState[]>(() => {
    return Array.from({ length: botCount }, (_, i) => {
      const personality = PERSONALITIES[i % PERSONALITIES.length];
      // Random-ish seed per bot (deterministic from index)
      const seed = (i * 7919 + 31) % 1000;
      return {
        id: i,
        personality,
        pathSeed: seed / 100,
        height: (i % 3) * 0.3,
        speed: (0.15 + i * 0.02) * personality.speedMult,
        phase: (i / botCount) * Math.PI * 2,
        scale: (0.75 + (seed % 30) / 100) * personality.scaleMult,
        visorBlinkInterval: 3 + (seed % 50) / 10, // 3.0 - 8.0 seconds
      };
    });
  }, [botCount]);

  useFrame(({ clock }) => {
    if (!visible || botCount === 0) return;
    timeRef.current = clock.elapsedTime;
    setCurrentTime(clock.elapsedTime);
  });

  if (!visible || botCount === 0) return null;

  return (
    <group ref={botsRef}>
      {bots.map((bot) => (
        <ArticulatedBot
          key={bot.id}
          botState={bot}
          time={currentTime}
          focusedLabPosition={focusedLabPosition}
        />
      ))}
    </group>
  );
}
