'use client';

// ================================================================
// PromptScore3D — 3D floating prompt quality visualization
// ================================================================
// P6-B: Shows prompt quality score as a floating holographic ring
// with 5 dimension segments. Higher scores = brighter, larger rings.
// Renders in CockpitCanvas alongside PromptBubble3DScene.
// ================================================================

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Group } from 'three';

interface ScoreDimension {
  label: string;
  value: number; // 0-5
  color: string;
}

interface PromptScore3DProps {
  dimensions: ScoreDimension[];
  totalScore: number; // 0-25
  isVisible: boolean;
}

const AMBER = new Color('#F59E0B');
const DIM_COLORS = ['#F59E0B', '#F97316', '#EF4444', '#8B5CF6', '#10B981'];

export default function PromptScore3D({
  dimensions,
  totalScore,
  isVisible,
}: PromptScore3DProps) {
  const groupRef = useRef<Group>(null);
  const quality = totalScore / 25; // 0-1

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.2;
    // Pulse scale with quality
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.02 * quality;
    groupRef.current.scale.setScalar(pulse);
  });

  if (!isVisible || dimensions.length === 0) return null;

  return (
    <group ref={groupRef} position={[2, 1.5, -1]}>
      {/* Central score orb */}
      <mesh>
        <sphereGeometry args={[0.15 + quality * 0.1, 16, 16]} />
        <meshStandardMaterial
          color={AMBER}
          emissive={AMBER}
          emissiveIntensity={0.5 + quality * 1.5}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Outer quality ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.4 + quality * 0.2, 0.02, 8, 32]} />
        <meshStandardMaterial
          color="#F59E0B"
          emissive="#F59E0B"
          emissiveIntensity={quality * 2}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Dimension segments — 5 arcs around the ring */}
      {dimensions.map((dim, i) => {
        const angle = (i / dimensions.length) * Math.PI * 2;
        const radius = 0.6;
        const dimQuality = dim.value / 5;
        const color = new Color(DIM_COLORS[i] || '#F59E0B');

        return (
          <group key={dim.label}>
            {/* Dimension bar */}
            <mesh
              position={[
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius,
              ]}
            >
              <boxGeometry args={[0.08, dimQuality * 0.5 + 0.05, 0.08]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={dimQuality * 1.2}
                transparent
                opacity={0.7}
              />
            </mesh>

            {/* Dimension tip glow */}
            <mesh
              position={[
                Math.cos(angle) * radius,
                dimQuality * 0.25 + 0.08,
                Math.sin(angle) * radius,
              ]}
            >
              <sphereGeometry args={[0.03, 6, 6]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={2.0}
              />
            </mesh>
          </group>
        );
      })}

      {/* Quality level indicator light */}
      <pointLight
        position={[0, 0.5, 0]}
        intensity={quality * 0.8}
        color="#F59E0B"
        distance={3}
      />
    </group>
  );
}
