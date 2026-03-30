'use client';

// ================================================================
// PetDataLab3D — 3D bar chart for Pet Trainer data-lab phase
// ================================================================
// P6-A: Shows training data distribution as floating holographic
// bars. Each bar represents a label category with height proportional
// to count. Helps children visualize data balance/imbalance.
//
// Renders inside CockpitCanvas via sceneStore when data-lab phase.
// ================================================================

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Group } from 'three';

interface DataBar {
  label: string;
  count: number;
  color: string;
}

interface PetDataLab3DProps {
  data: DataBar[];
  totalItems: number;
  isOverfit: boolean;
  labColor?: string;
}

export default function PetDataLab3D({
  data,
  totalItems,
  isOverfit,
  labColor = '#8B5CF6',
}: PetDataLab3DProps) {
  const groupRef = useRef<Group>(null);
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  // Gentle idle rotation
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.1;
  });

  const barWidth = 0.6;
  const gap = 0.3;
  const totalWidth = data.length * (barWidth + gap) - gap;

  return (
    <group ref={groupRef} position={[0, 0.5, -1]}>
      {/* Base platform */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[totalWidth + 1, 0.05, 2]} />
        <meshStandardMaterial
          color="#1A1530"
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>

      {/* Grid lines on platform */}
      {[0.25, 0.5, 0.75, 1.0].map((t, i) => (
        <mesh key={i} position={[0, t * 2, 0.01]}>
          <boxGeometry args={[totalWidth + 0.5, 0.01, 0.01]} />
          <meshStandardMaterial
            color={labColor}
            emissive={labColor}
            emissiveIntensity={0.2}
            transparent
            opacity={0.2}
          />
        </mesh>
      ))}

      {/* Data bars */}
      {data.map((bar, i) => {
        const x = (i - (data.length - 1) / 2) * (barWidth + gap);
        const height = (bar.count / maxCount) * 2;
        const isImbalanced = isOverfit && bar.count / totalItems > 0.6;

        return (
          <group key={bar.label} position={[x, 0, 0]}>
            {/* Bar */}
            <mesh position={[0, height / 2, 0]} castShadow>
              <boxGeometry args={[barWidth, height, 0.5]} />
              <meshStandardMaterial
                color={bar.color || labColor}
                emissive={isImbalanced ? '#EF4444' : (bar.color || labColor)}
                emissiveIntensity={isImbalanced ? 0.6 : 0.2}
                transparent
                opacity={0.8}
                metalness={0.2}
                roughness={0.5}
              />
            </mesh>

            {/* Count indicator (floating sphere) */}
            <mesh position={[0, height + 0.2, 0]}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial
                color={bar.color || labColor}
                emissive={bar.color || labColor}
                emissiveIntensity={1.0}
              />
            </mesh>

            {/* Imbalance warning glow */}
            {isImbalanced && (
              <mesh position={[0, height + 0.4, 0]}>
                <sphereGeometry args={[0.12, 8, 8]} />
                <meshStandardMaterial
                  color="#EF4444"
                  emissive="#EF4444"
                  emissiveIntensity={1.5}
                  transparent
                  opacity={0.4}
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Overfit warning indicator */}
      {isOverfit && (
        <OverfitPulse labColor={labColor} width={totalWidth} />
      )}

      {/* Ambient data lab lighting */}
      <pointLight position={[0, 3, 2]} intensity={0.5} color={labColor} distance={8} />
    </group>
  );
}

// Pulsing red border when overfitting detected
function OverfitPulse({ labColor, width }: { labColor: string; width: number }) {
  const meshRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const pulse = 0.3 + Math.sin(clock.getElapsedTime() * 3) * 0.2;
    meshRef.current.children.forEach((child) => {
      const mat = 'material' in child ? (child as unknown as { material: Record<string, unknown> }).material : null;
      if (mat && typeof mat === 'object' && 'opacity' in mat) {
        (mat as { opacity: number }).opacity = pulse;
      }
    });
  });

  return (
    <group ref={meshRef}>
      {/* Warning border frame */}
      {[
        [0, 1.2, 0.8, width + 1.2, 0.03, 0.03],
        [0, -0.02, 0.8, width + 1.2, 0.03, 0.03],
        [-(width + 1.2) / 2, 0.6, 0.8, 0.03, 1.24, 0.03],
        [(width + 1.2) / 2, 0.6, 0.8, 0.03, 1.24, 0.03],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial
            color="#EF4444"
            emissive="#EF4444"
            emissiveIntensity={1.5}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}
