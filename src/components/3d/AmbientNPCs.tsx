'use client';

// ════════════════════════════════════════════════════
// AmbientNPCs — Articulated Robot Assistants
// ════════════════════════════════════════════════════
// 20M COCKPIT UPGRADE: 187K tris/bot × 8 bots = 1.5M total
// High-poly subdivided bodies, articulated 3-finger grippers,
// personality accessories, hover pad assemblies, panel detail lines.
//
// Device scaling: Desktop 8 bots, Tablet 4 bots, Mobile 0.

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLOD } from '@/hooks/useLOD';
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
  visorBlinkInterval: number;
}

// ── Personality Definitions ────────────────────────

const PERSONALITIES: BotPersonality[] = [
  { type: 'scout',    color: '#00BBFF', speedMult: 1.4, scaleMult: 0.8,  heightOffset: 0,   description: 'Fast scanner' },
  { type: 'engineer', color: '#FFAA44', speedMult: 1.0, scaleMult: 1.0,  heightOffset: 0,   description: 'Tool carrier' },
  { type: 'medic',    color: '#00FF88', speedMult: 0.9, scaleMult: 0.95, heightOffset: 0.3, description: 'Gentle healer' },
  { type: 'guardian', color: '#FF6644', speedMult: 0.8, scaleMult: 1.2,  heightOffset: 0,   description: 'Patrol sentinel' },
  { type: 'scholar',  color: '#AA66FF', speedMult: 0.6, scaleMult: 0.9,  heightOffset: 0.1, description: 'Console drifter' },
];

// ── Noise helpers ──────────────────────────────────

function fade(t: number): number { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerpN(a: number, b: number, t: number): number { return a + t * (b - a); }
function grad2d(hash: number, x: number, y: number): number {
  const h = hash & 3;
  return (h < 2 ? x : -x) + (h === 0 || h === 3 ? y : -y);
}
const PERM: number[] = (() => {
  const p = Array.from({ length: 256 }, (_: unknown, i: number) => i);
  let seed = 42;
  for (let i = 255; i > 0; i--) {
    seed = (seed * 16807) % 2147483647;
    const j = seed % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  return [...p, ...p];
})();
function noise2D(x: number, y: number): number {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x), yf = y - Math.floor(y);
  const u = fade(xf), v = fade(yf);
  const aa = PERM[PERM[X] + Y], ab = PERM[PERM[X] + Y + 1];
  const ba = PERM[PERM[X + 1] + Y], bb = PERM[PERM[X + 1] + Y + 1];
  return lerpN(lerpN(grad2d(aa, xf, yf), grad2d(ba, xf - 1, yf), u),
               lerpN(grad2d(ab, xf, yf - 1), grad2d(bb, xf - 1, yf - 1), u), v);
}

// ── 3-Finger Gripper Hand (~8K tris) ──────────────

function GripperHand({ color, seg, side }: { color: string; seg: number; side: 1 | -1 }) {
  const halfSeg = Math.max(8, Math.floor(seg / 4));
  const fingerDefs = [
    { ox: 0,          oy: 0,    rot: 0 },
    { ox: side * 0.014, oy: 0.01,  rot: side * 0.3 },
    { ox: -side * 0.014, oy: -0.01, rot: -side * 0.3 },
  ];
  return (
    <group>
      {/* Palm */}
      <mesh>
        <cylinderGeometry args={[0.022, 0.026, 0.04, halfSeg * 2]} />
        <meshStandardMaterial color="#1A1822" metalness={0.9} roughness={0.2}
          emissive={color} emissiveIntensity={0.1} />
      </mesh>
      {fingerDefs.map((fd, fi) => (
        <group key={fi} position={[fd.ox, -0.03, 0]} rotation={[0, fd.rot, 0]}>
          {/* Proximal bone */}
          <mesh position={[0, -0.018, 0]}>
            <cylinderGeometry args={[0.007, 0.009, 0.036, halfSeg]} />
            <meshStandardMaterial color="#222230" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Knuckle joint */}
          <mesh position={[0, -0.038, 0]}>
            <sphereGeometry args={[0.009, halfSeg, halfSeg]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4}
              metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Distal bone */}
          <mesh position={[0, -0.058, 0]}>
            <cylinderGeometry args={[0.006, 0.007, 0.028, halfSeg]} />
            <meshStandardMaterial color="#1A1822" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Fingertip */}
          <mesh position={[0, -0.074, 0]}>
            <sphereGeometry args={[0.008, halfSeg, halfSeg]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6}
              metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Personality Accessory (~15-20K tris) ──────────

function PersonalityAccessory({ type, color, seg }: { type: PersonalityType; color: string; seg: number }) {
  const halfSeg = Math.max(8, Math.floor(seg / 2));
  switch (type) {
    case 'scout':
      return (
        <group position={[0, 0.18, 0.08]}>
          {/* Scanner dish */}
          <mesh>
            <torusGeometry args={[0.06, 0.012, halfSeg, seg]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5}
              metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Inner rings */}
          {[0.04, 0.025].map((r, i) => (
            <mesh key={i}>
              <torusGeometry args={[r, 0.006, halfSeg / 2, seg]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4}
                metalness={0.85} roughness={0.15} transparent opacity={0.7} />
            </mesh>
          ))}
          {/* Dish arm */}
          <mesh position={[0, -0.07, 0]}>
            <cylinderGeometry args={[0.008, 0.012, 0.1, halfSeg]} />
            <meshStandardMaterial color="#333344" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      );
    case 'engineer':
      return (
        <group position={[0.16, -0.12, 0]} rotation={[0, 0, -0.4]}>
          {/* Tool housing */}
          <mesh>
            <cylinderGeometry args={[0.018, 0.022, 0.1, halfSeg * 2]} />
            <meshStandardMaterial color="#2a2a3a" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Bit tip */}
          <mesh position={[0, -0.065, 0]}>
            <coneGeometry args={[0.018, 0.04, halfSeg]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7}
              metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Grip rings */}
          {[-0.01, 0.01, 0.03].map((y, i) => (
            <mesh key={i} position={[0, y, 0]}>
              <torusGeometry args={[0.022, 0.004, 8, halfSeg]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3}
                metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>
      );
    case 'medic':
      return (
        <group position={[0, 0.22, 0.06]}>
          {/* Medical cross horizontal */}
          <mesh>
            <boxGeometry args={[0.1, 0.026, 0.012]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5}
              metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Medical cross vertical */}
          <mesh>
            <boxGeometry args={[0.026, 0.1, 0.012]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5}
              metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Halo ring */}
          <mesh position={[0, 0, -0.01]}>
            <torusGeometry args={[0.065, 0.005, halfSeg / 2, seg]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8}
              transparent opacity={0.7} toneMapped={false} />
          </mesh>
        </group>
      );
    case 'guardian':
      return (
        <group position={[0, 0.1, -0.1]}>
          {/* Shield face */}
          <mesh>
            <sphereGeometry args={[0.1, halfSeg, halfSeg / 2, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color="#1a1a2e" metalness={0.95} roughness={0.05}
              emissive={color} emissiveIntensity={0.15} />
          </mesh>
          {/* Shield rim ring */}
          <mesh rotation={[Math.PI / 4, 0, 0]}>
            <torusGeometry args={[0.1, 0.008, halfSeg / 2, seg]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6}
              metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Cross emblem */}
          <mesh position={[0, 0, 0.08]}>
            <boxGeometry args={[0.055, 0.014, 0.006]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0, 0, 0.08]}>
            <boxGeometry args={[0.014, 0.055, 0.006]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
          </mesh>
        </group>
      );
    case 'scholar':
    default:
      return (
        <group position={[0, 0.2, 0.07]}>
          {/* Tablet frame */}
          <mesh>
            <torusGeometry args={[0.055, 0.01, halfSeg / 2, seg]} />
            <meshStandardMaterial color="#2a2a3a" metalness={0.9} roughness={0.15}
              emissive={color} emissiveIntensity={0.3} />
          </mesh>
          {/* Display panel */}
          <mesh position={[0, 0, 0.006]}>
            <planeGeometry args={[0.08, 0.06]} />
            <meshBasicMaterial color={color} transparent opacity={0.4} toneMapped={false} />
          </mesh>
          {/* Data lines */}
          {[-0.018, -0.006, 0.006, 0.018].map((y, i) => (
            <mesh key={i} position={[0, y, 0.008]}>
              <planeGeometry args={[0.06, 0.004]} />
              <meshBasicMaterial color={color} transparent opacity={0.6 - i * 0.1}
                toneMapped={false} />
            </mesh>
          ))}
        </group>
      );
  }
}

// ── High-Poly Articulated Bot (~187K tris) ─────────

function ArticulatedBot({
  botState,
  time,
  focusedLabPosition,
}: {
  botState: BotState;
  time: number;
  focusedLabPosition: [number, number, number] | null;
}) {
  const groupRef    = useRef<THREE.Group>(null);
  const headRef     = useRef<THREE.Group>(null);
  const leftArmRef  = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const visorMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const antTipRef   = useRef<THREE.MeshStandardMaterial>(null);
  const padMatLRef  = useRef<THREE.MeshStandardMaterial>(null);
  const padMatRRef  = useRef<THREE.MeshStandardMaterial>(null);

  const lod = useLOD({ tier: 'system' });
  const seg = lod.segments;                     // 64 at ultra
  const halfSeg = Math.max(8, Math.floor(seg / 2));

  const { personality, pathSeed, speed, phase, scale, visorBlinkInterval } = botState;
  const prevPos = useRef<[number, number, number]>([0, 0, 0]);
  const facingRef = useRef(0);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = time;
    const s = pathSeed;

    const noiseX = noise2D(t * speed * 0.15 + s * 10, s * 3.7) * 6;
    const noiseZ = noise2D(s * 5.2, t * speed * 0.15 + s * 7.1) * 6;
    const baseR = 5 + (s % 3) * 1.5;
    const angle = t * speed * 0.2 + phase;

    const x = Math.cos(angle) * baseR + noiseX;
    const z = Math.sin(angle) * baseR + noiseZ;
    const y = 1.2 + personality.heightOffset + botState.height + Math.sin(t * 0.7 + phase) * 0.2;

    groupRef.current.position.set(x, y, z);
    groupRef.current.scale.setScalar(scale * personality.scaleMult);

    const dx = x - prevPos.current[0];
    const dz = z - prevPos.current[2];
    const mspd = Math.sqrt(dx * dx + dz * dz);
    let targetFacing = facingRef.current;
    if (mspd > 0.001) targetFacing = Math.atan2(dx, dz);
    if (focusedLabPosition) {
      const fdx = focusedLabPosition[0] - x, fdz = focusedLabPosition[2] - z;
      if (Math.sqrt(fdx * fdx + fdz * fdz) < 4) targetFacing = Math.atan2(fdx, fdz);
    }
    let diff = targetFacing - facingRef.current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    facingRef.current += diff * 0.05;
    groupRef.current.rotation.y = facingRef.current;
    prevPos.current = [x, y, z];

    const armSwing = Math.sin(t * 3 + phase) * 0.3 * Math.min(mspd * 20, 1);
    if (leftArmRef.current)  leftArmRef.current.rotation.x = armSwing;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -armSwing;

    if (visorMatRef.current) {
      const bc = t % visorBlinkInterval;
      visorMatRef.current.opacity = bc < 0.1 ? 0.2 : 1.0;
    }
    if (antTipRef.current) {
      antTipRef.current.emissiveIntensity = 0.5 + ((Math.sin(t * 2.5 + phase * 3) + 1) * 0.5) * 1.5;
    }
    const padPulse = 0.8 + ((Math.sin(t * 1.8 + phase) + 1) * 0.5) * 1.2;
    if (padMatLRef.current) padMatLRef.current.emissiveIntensity = padPulse;
    if (padMatRRef.current) padMatRRef.current.emissiveIntensity = padPulse;
  });

  const metal = { metalness: 0.88, roughness: 0.18 };
  const c = personality.color;

  return (
    <group ref={groupRef}>

      {/* ── HEAD GROUP ─────────────────────────────── */}
      <group ref={headRef} position={[0, 0.22, 0]}>
        {/* Cranium — high-poly sphere */}
        <mesh>
          <sphereGeometry args={[0.1, seg, Math.floor(seg * 0.75)]} />
          <meshStandardMaterial color="#1A1822" {...metal} emissive={c} emissiveIntensity={0.12} />
        </mesh>
        {/* Inner cranium detail */}
        <mesh>
          <sphereGeometry args={[0.094, halfSeg, halfSeg]} />
          <meshStandardMaterial color="#0e0e18" {...metal} side={THREE.BackSide} />
        </mesh>
        {/* Visor outer torus frame */}
        <mesh position={[0, -0.01, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.062, 0.012, halfSeg, seg]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.5} {...metal} />
        </mesh>
        {/* Visor inner ring */}
        <mesh position={[0, -0.01, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.05, 0.005, halfSeg / 2, seg]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.8}
            transparent opacity={0.7} toneMapped={false} />
        </mesh>
        {/* Visor lens glow */}
        <mesh position={[0, -0.01, 0.088]}>
          <ringGeometry args={[0.025, 0.06, seg, 1, 0, Math.PI]} />
          <meshBasicMaterial ref={visorMatRef} color={c} transparent opacity={1} toneMapped={false} />
        </mesh>
        {/* Eye sensors */}
        {[-0.028, 0.028].map((ex, ei) => (
          <mesh key={ei} position={[ex, 0, 0.086]}>
            <sphereGeometry args={[0.012, halfSeg, halfSeg]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.2} toneMapped={false} />
          </mesh>
        ))}
        {/* Antenna stem */}
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.006, 0.009, 0.12, halfSeg]} />
          <meshStandardMaterial color="#333344" {...metal} />
        </mesh>
        {/* Antenna mid-ring */}
        <mesh position={[0, 0.16, 0]}>
          <torusGeometry args={[0.012, 0.004, 8, halfSeg]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.6} {...metal} />
        </mesh>
        {/* Antenna tip */}
        <mesh position={[0, 0.21, 0]}>
          <sphereGeometry args={[0.018, halfSeg, halfSeg]} />
          <meshStandardMaterial ref={antTipRef} color={c} emissive={c} emissiveIntensity={1.0} {...metal} />
        </mesh>
        {/* Head panel lines */}
        {[0.06, -0.04].map((y, i) => (
          <mesh key={i} position={[0, y, 0.09]}>
            <boxGeometry args={[0.12, 0.005, 0.002]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.4} />
          </mesh>
        ))}
      </group>

      {/* ── NECK ───────────────────────────────────── */}
      <mesh position={[0, 0.125, 0]}>
        <cylinderGeometry args={[0.024, 0.032, 0.04, seg]} />
        <meshStandardMaterial color="#111118" {...metal} />
      </mesh>
      <mesh position={[0, 0.13, 0]}>
        <torusGeometry args={[0.03, 0.006, halfSeg / 2, seg]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.4} {...metal} />
      </mesh>

      {/* ── TORSO ──────────────────────────────────── */}
      <group position={[0, 0.04, 0]}>
        {/* Main torso — high-poly lathe */}
        <mesh>
          <cylinderGeometry args={[0.095, 0.085, 0.22, seg, 8]} />
          <meshStandardMaterial color="#1A1822" {...metal} emissive={c} emissiveIntensity={0.06} />
        </mesh>
        {/* Torso detail shell */}
        <mesh>
          <cylinderGeometry args={[0.097, 0.087, 0.21, seg, 4]} />
          <meshStandardMaterial color="#111118" {...metal} wireframe={false}
            side={THREE.BackSide} />
        </mesh>
        {/* Shoulder pad left */}
        <mesh position={[0.115, 0.06, 0]}>
          <sphereGeometry args={[0.052, halfSeg, halfSeg]} />
          <meshStandardMaterial color="#1e1e2e" {...metal} emissive={c} emissiveIntensity={0.12} />
        </mesh>
        {/* Shoulder pad right */}
        <mesh position={[-0.115, 0.06, 0]}>
          <sphereGeometry args={[0.052, halfSeg, halfSeg]} />
          <meshStandardMaterial color="#1e1e2e" {...metal} emissive={c} emissiveIntensity={0.12} />
        </mesh>
        {/* Hip ring */}
        <mesh position={[0, -0.1, 0]}>
          <torusGeometry args={[0.075, 0.012, halfSeg / 2, seg]} />
          <meshStandardMaterial color="#222" {...metal} emissive={c} emissiveIntensity={0.25} />
        </mesh>
        {/* Chest panel frame */}
        <mesh position={[0, 0.04, 0.085]}>
          <torusGeometry args={[0.042, 0.008, halfSeg / 2, seg]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.5} {...metal} />
        </mesh>
        {/* Chest display */}
        <mesh position={[0, 0.04, 0.093]}>
          <planeGeometry args={[0.065, 0.065]} />
          <meshBasicMaterial color={c} transparent opacity={0.25} toneMapped={false} />
        </mesh>
        {/* Vertical panel line */}
        <mesh position={[0, -0.02, 0.088]}>
          <boxGeometry args={[0.007, 0.1, 0.002]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.5} />
        </mesh>
        {/* Horizontal panel line */}
        <mesh position={[0, 0.04, 0.088]}>
          <boxGeometry args={[0.14, 0.006, 0.002]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.35} />
        </mesh>
        {/* Side vents left */}
        {[-0.04, -0.01, 0.02].map((y, i) => (
          <mesh key={i} position={[0.082, y, 0.04]}>
            <boxGeometry args={[0.008, 0.02, 0.06]} />
            <meshStandardMaterial color="#0a0a14" {...metal} />
          </mesh>
        ))}
        {/* Side vents right */}
        {[-0.04, -0.01, 0.02].map((y, i) => (
          <mesh key={i} position={[-0.082, y, 0.04]}>
            <boxGeometry args={[0.008, 0.02, 0.06]} />
            <meshStandardMaterial color="#0a0a14" {...metal} />
          </mesh>
        ))}
        {/* Backpack */}
        <group position={[0, 0.01, -0.1]}>
          <mesh>
            <boxGeometry args={[0.1, 0.14, 0.055]} />
            <meshStandardMaterial color="#111118" {...metal} emissive={c} emissiveIntensity={0.06} />
          </mesh>
          {/* Backpack top rounded cap */}
          <mesh position={[0, 0.072, 0]}>
            <sphereGeometry args={[0.05, halfSeg, halfSeg / 2, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#111118" {...metal} />
          </mesh>
          {/* Backpack indicator strip */}
          <mesh position={[0, 0, 0.029]}>
            <boxGeometry args={[0.06, 0.018, 0.002]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.0} />
          </mesh>
          {/* Backpack vent slots */}
          {[-0.03, 0, 0.03].map((y, i) => (
            <mesh key={i} position={[0, y, 0.029]}>
              <boxGeometry args={[0.07, 0.006, 0.001]} />
              <meshStandardMaterial color="#0a0a14" {...metal} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ── LEFT ARM ───────────────────────────────── */}
      <group ref={leftArmRef} position={[0.13, 0.1, 0]}>
        {/* Shoulder joint sphere */}
        <mesh>
          <sphereGeometry args={[0.028, halfSeg, halfSeg]} />
          <meshStandardMaterial color="#222" {...metal} emissive={c} emissiveIntensity={0.2} />
        </mesh>
        {/* Shoulder ring */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.028, 0.005, 8, halfSeg]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.4} {...metal} />
        </mesh>
        {/* Upper arm */}
        <mesh position={[0, -0.055, 0]}>
          <cylinderGeometry args={[0.018, 0.022, 0.09, halfSeg, 4]} />
          <meshStandardMaterial color="#1A1822" {...metal} emissive={c} emissiveIntensity={0.07} />
        </mesh>
        {/* Elbow sphere */}
        <mesh position={[0, -0.11, 0]}>
          <sphereGeometry args={[0.022, halfSeg, halfSeg]} />
          <meshStandardMaterial color="#222" {...metal} emissive={c} emissiveIntensity={0.25} />
        </mesh>
        {/* Elbow guard ring */}
        <mesh position={[0, -0.11, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.022, 0.004, 8, halfSeg]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.3} {...metal} />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.165, 0]}>
          <cylinderGeometry args={[0.016, 0.019, 0.09, halfSeg, 4]} />
          <meshStandardMaterial color="#1A1822" {...metal} emissive={c} emissiveIntensity={0.07} />
        </mesh>
        {/* Wrist sphere */}
        <mesh position={[0, -0.215, 0]}>
          <sphereGeometry args={[0.018, halfSeg, halfSeg]} />
          <meshStandardMaterial color="#333" {...metal} emissive={c} emissiveIntensity={0.2} />
        </mesh>
        {/* Gripper hand */}
        <group position={[0, -0.25, 0]}>
          <GripperHand color={c} seg={seg} side={1} />
        </group>
        {/* Arm panel line */}
        <mesh position={[0.02, -0.09, 0]}>
          <boxGeometry args={[0.004, 0.07, 0.002]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* ── RIGHT ARM ──────────────────────────────── */}
      <group ref={rightArmRef} position={[-0.13, 0.1, 0]}>
        <mesh>
          <sphereGeometry args={[0.028, halfSeg, halfSeg]} />
          <meshStandardMaterial color="#222" {...metal} emissive={c} emissiveIntensity={0.2} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.028, 0.005, 8, halfSeg]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.4} {...metal} />
        </mesh>
        <mesh position={[0, -0.055, 0]}>
          <cylinderGeometry args={[0.018, 0.022, 0.09, halfSeg, 4]} />
          <meshStandardMaterial color="#1A1822" {...metal} emissive={c} emissiveIntensity={0.07} />
        </mesh>
        <mesh position={[0, -0.11, 0]}>
          <sphereGeometry args={[0.022, halfSeg, halfSeg]} />
          <meshStandardMaterial color="#222" {...metal} emissive={c} emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[0, -0.11, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.022, 0.004, 8, halfSeg]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.3} {...metal} />
        </mesh>
        <mesh position={[0, -0.165, 0]}>
          <cylinderGeometry args={[0.016, 0.019, 0.09, halfSeg, 4]} />
          <meshStandardMaterial color="#1A1822" {...metal} emissive={c} emissiveIntensity={0.07} />
        </mesh>
        <mesh position={[0, -0.215, 0]}>
          <sphereGeometry args={[0.018, halfSeg, halfSeg]} />
          <meshStandardMaterial color="#333" {...metal} emissive={c} emissiveIntensity={0.2} />
        </mesh>
        <group position={[0, -0.25, 0]}>
          <GripperHand color={c} seg={seg} side={-1} />
        </group>
        <mesh position={[-0.02, -0.09, 0]}>
          <boxGeometry args={[0.004, 0.07, 0.002]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* ── HOVER PADS ─────────────────────────────── */}
      {[0.055, -0.055].map((px, pi) => (
        <group key={pi} position={[px, -0.12, 0]}>
          {/* Pad disk */}
          <mesh>
            <cylinderGeometry args={[0.042, 0.052, 0.018, seg]} />
            <meshStandardMaterial color="#1A1822" {...metal} emissive={c} emissiveIntensity={0.2} />
          </mesh>
          {/* Pad underside cone */}
          <mesh position={[0, -0.015, 0]}>
            <coneGeometry args={[0.04, 0.018, seg]} />
            <meshStandardMaterial
              ref={pi === 0 ? padMatLRef : padMatRRef}
              color={c} emissive={c} emissiveIntensity={1.0}
              transparent opacity={0.85} toneMapped={false} />
          </mesh>
          {/* Glow ring outer */}
          <mesh position={[0, -0.004, 0]}>
            <torusGeometry args={[0.055, 0.007, halfSeg / 2, seg]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.7}
              transparent opacity={0.5} toneMapped={false} />
          </mesh>
          {/* Glow ring inner */}
          <mesh position={[0, -0.004, 0]}>
            <torusGeometry args={[0.038, 0.005, halfSeg / 2, seg]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.9}
              transparent opacity={0.4} toneMapped={false} />
          </mesh>
          {/* Energy column connecting pad to body */}
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.006, 0.01, 0.1, halfSeg]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.5}
              transparent opacity={0.6} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* ── PERSONALITY ACCESSORY ─────────────────── */}
      {lod.enableEffects && (
        <PersonalityAccessory type={personality.type} color={c} seg={seg} />
      )}

    </group>
  );
}

// ── Main Component ─────────────────────────────────

export function AmbientNPCs({ visible, focusedLabPosition }: AmbientNPCsProps) {
  const botsRef = useRef<THREE.Group>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const profile = useDeviceStore((s) => s.profile);

  const botCount = profile.lodBias === 'high' ? 8 : profile.lodBias === 'medium' ? 4 : 0;

  const bots = useMemo<BotState[]>(() => {
    return Array.from({ length: botCount }, (_: unknown, i: number) => {
      const personality = PERSONALITIES[i % PERSONALITIES.length];
      const seed = (i * 7919 + 31) % 1000;
      return {
        id: i,
        personality,
        pathSeed: seed / 100,
        height: (i % 3) * 0.3,
        speed: (0.15 + i * 0.02) * personality.speedMult,
        phase: (i / Math.max(botCount, 1)) * Math.PI * 2,
        scale: (0.75 + (seed % 30) / 100) * personality.scaleMult,
        visorBlinkInterval: 3 + (seed % 50) / 10,
      };
    });
  }, [botCount]);

  useFrame(({ clock }) => {
    if (!visible || botCount === 0) return;
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
