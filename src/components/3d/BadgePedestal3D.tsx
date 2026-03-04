'use client';

// ================================================================
// SparkForge BadgePedestal3D — 5-Tier PBR Trophy Pedestals
// ================================================================
// Decision 7.2: Rarity-based pedestal materials
// GPU cost: ~0.2ms per pedestal
// Geometry: CylinderGeometry base + OctahedronGeometry emblem
//
// Tiers:
//   Common    — Brushed steel, no effects
//   Uncommon  — Polished chrome, subtle Float
//   Rare      — Blue glass + glow, Sparkles
//   Epic      — Purple crystal + Bloom, Sparkles + Float
//   Legendary — Gold PBR + fire particles, Sparkles + Float
//
// Used in: Trophy Room layout (BadgePedestals grid)

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { Rarity } from '@/lib/gamification';
import { getRarityColor, getRarityVisuals } from '@/lib/gamification';

interface BadgePedestal3DProps {
  rarity: Rarity;
  position?: [number, number, number];
  badgeName?: string;
  unlocked?: boolean;
}

// Rarity → material config
function getPedestalMaterial(rarity: Rarity, unlocked: boolean) {
  const color = new THREE.Color(unlocked ? getRarityColor(rarity) : '#333340');

  switch (rarity) {
    case 'legendary':
      return {
        color,
        metalness: 0.95,
        roughness: 0.1,
        emissive: new THREE.Color(getRarityColor(rarity)),
        emissiveIntensity: unlocked ? 0.3 : 0,
      };
    case 'epic':
      return {
        color,
        metalness: 0.8,
        roughness: 0.15,
        emissive: new THREE.Color(getRarityColor(rarity)),
        emissiveIntensity: unlocked ? 0.2 : 0,
      };
    case 'rare':
      return {
        color,
        metalness: 0.6,
        roughness: 0.2,
        emissive: new THREE.Color(getRarityColor(rarity)),
        emissiveIntensity: unlocked ? 0.15 : 0,
      };
    case 'uncommon':
      return {
        color,
        metalness: 0.7,
        roughness: 0.25,
        emissive: new THREE.Color('#000000'),
        emissiveIntensity: 0,
      };
    default: // common
      return {
        color,
        metalness: 0.4,
        roughness: 0.5,
        emissive: new THREE.Color('#000000'),
        emissiveIntensity: 0,
      };
  }
}

export default function BadgePedestal3D({
  rarity,
  position = [0, 0, 0],
  badgeName = 'Badge',
  unlocked = true,
}: BadgePedestal3DProps) {
  const emblemRef = useRef<THREE.Mesh>(null);
  const material = useMemo(() => getPedestalMaterial(rarity, unlocked), [rarity, unlocked]);
  const visuals = useMemo(() => getRarityVisuals(rarity), [rarity]);
  const rarityColor = useMemo(() => getRarityColor(rarity), [rarity]);

  // Slow rotation for rare+ tiers
  useFrame((_, delta) => {
    if (!emblemRef.current || visuals.rotateSpeed === 0) return;
    emblemRef.current.rotation.y += (Math.PI * 2 * delta) / visuals.rotateSpeed;
  });

  const hasFloat = rarity === 'uncommon' || rarity === 'rare' ||
    rarity === 'epic' || rarity === 'legendary';
  const hasSparkles = rarity === 'rare' || rarity === 'epic' || rarity === 'legendary';

  const emblem = (
    <group position={[position[0], position[1] + 0.6, position[2]]}>
      <mesh
        ref={emblemRef}
        castShadow
        aria-label={`${badgeName} badge, ${rarity} rarity${unlocked ? '' : ', locked'}`}
      >
        <octahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial
          color={material.color}
          metalness={material.metalness}
          roughness={material.roughness}
          emissive={material.emissive}
          emissiveIntensity={material.emissiveIntensity}
        />
      </mesh>

      {/* Sparkle particles for rare+ */}
      {hasSparkles && unlocked && (
        <Sparkles
          count={visuals.particleCount * 3}
          scale={0.8}
          size={2}
          speed={0.4}
          color={rarityColor}
        />
      )}
    </group>
  );

  return (
    <group>
      {/* Pedestal base */}
      <mesh
        position={[position[0], position[1] + 0.15, position[2]]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.2, 0.25, 0.3, 8]} />
        <meshStandardMaterial
          color={unlocked ? '#1A1822' : '#111118'}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Emblem with optional Float wrapper */}
      {hasFloat && unlocked ? (
        <Float
          speed={1.5}
          rotationIntensity={0}
          floatIntensity={visuals.levitateHeight * 0.1}
        >
          {emblem}
        </Float>
      ) : (
        emblem
      )}
    </group>
  );
}
