'use client';

// ================================================================
// SparkForge BadgePedestal3D — 5-Tier PBR Trophy Pedestals
// ================================================================
// Decision 7.2: Rarity-based pedestal materials
// GPU cost: ~0.2ms per pedestal
// Geometry: CylinderGeometry base + OctahedronGeometry emblem
// Renders INSIDE CockpitCanvas as a <group> (D3D-B1)
//
// Tiers (per spec):
//   Common    — roughness 0.8, metalness 0.3, #94a3b8
//   Uncommon  — roughness 0.5, metalness 0.5, #a3e635
//   Rare      — roughness 0.3, metalness 0.7, #3b82f6, emissive 0.3
//   Epic      — roughness 0.2, metalness 0.8, #8b5cf6, emissive 0.5
//   Legendary — roughness 0.1, metalness 1.0, #f59e0b, emissive 0.8

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import { Color, Mesh } from 'three';
import { useA11yStore } from '@/stores/accessibilityStore';

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

interface BadgePedestal3DProps {
  rarity: Rarity;
  icon?: string;
  active?: boolean;
  position?: [number, number, number];
}

interface MaterialConfig {
  color: Color;
  roughness: number;
  metalness: number;
  emissive: Color;
  emissiveIntensity: number;
}

const RARITY_MATERIALS: Record<Rarity, { color: string; roughness: number; metalness: number; emissive?: string; emissiveIntensity: number }> = {
  common:    { color: '#94a3b8', roughness: 0.8, metalness: 0.3, emissiveIntensity: 0 },
  uncommon:  { color: '#a3e635', roughness: 0.5, metalness: 0.5, emissiveIntensity: 0 },
  rare:      { color: '#3b82f6', roughness: 0.3, metalness: 0.7, emissive: '#3b82f6', emissiveIntensity: 0.3 },
  epic:      { color: '#8b5cf6', roughness: 0.2, metalness: 0.8, emissive: '#8b5cf6', emissiveIntensity: 0.5 },
  legendary: { color: '#f59e0b', roughness: 0.1, metalness: 1.0, emissive: '#f59e0b', emissiveIntensity: 0.8 },
};

function getMaterialConfig(rarity: Rarity, active: boolean): MaterialConfig {
  const cfg = RARITY_MATERIALS[rarity];
  return {
    color: new Color(active ? cfg.color : '#333340'),
    roughness: cfg.roughness,
    metalness: cfg.metalness,
    emissive: new Color(cfg.emissive || '#000000'),
    emissiveIntensity: active ? cfg.emissiveIntensity : 0,
  };
}

export default function BadgePedestal3D({
  rarity,
  icon: _icon,
  active = true,
  position = [0, 0, 0],
}: BadgePedestal3DProps) {
  const emblemRef = useRef<Mesh>(null);
  const reduceMotion = useA11yStore((s) => s.reduceMotion);
  const material = useMemo(() => getMaterialConfig(rarity, active), [rarity, active]);

  const hasFloat = rarity === 'rare' || rarity === 'epic' || rarity === 'legendary';
  const hasSparkles = rarity === 'epic' || rarity === 'legendary';

  // Slow rotation for rare+ tiers
  useFrame((_, delta) => {
    if (!emblemRef.current || !hasFloat || reduceMotion) return;
    emblemRef.current.rotation.y += delta * 0.5;
  });

  const emblem = (
    <group position={[0, 0.6, 0]}>
      <mesh
        ref={emblemRef}
        castShadow
        aria-label={`Badge pedestal, ${rarity} rarity${active ? '' : ', locked'}`}
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

      {hasSparkles && active && (
        <Sparkles
          count={rarity === 'legendary' ? 30 : 15}
          scale={0.8}
          size={2}
          speed={0.4}
          color={RARITY_MATERIALS[rarity].color}
        />
      )}
    </group>
  );

  return (
    <group position={position}>
      {/* Pedestal base */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.25, 0.3, 8]} />
        <meshStandardMaterial
          color={active ? '#1A1822' : '#111118'}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Emblem with optional Float wrapper */}
      {hasFloat && active && !reduceMotion ? (
        <Float speed={1.5} rotationIntensity={0} floatIntensity={0.3}>
          {emblem}
        </Float>
      ) : (
        emblem
      )}
    </group>
  );
}
