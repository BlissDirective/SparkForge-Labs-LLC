'use client';

// ════════════════════════════════════════════════════
// HolographicLabMap — 3D Holographic Map of All 10 Labs
// ════════════════════════════════════════════════════
// Enhancement 1.1: Floating 3D hologram with labs arranged in a circular
// space station layout. Children rotate/zoom to explore. Each lab is a
// distinct 3D structure (neural tower, ethics courthouse, data vault, etc.)
//
// Features:
// - 10 lab structures in circular ring (LAB_POSITIONS from cockpitStore)
// - Central holographic core (pulsing orb)
// - Connection lines between labs
// - Interactive: click to focus, double-click to enter
// - Gentle auto-rotation when not focused
// - Completion indicators per lab

import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { LabStructure3D } from './LabStructure3D';
import { LAB_POSITIONS } from '@/stores/cockpitStore';
import { LABS } from '@/types';

// Lab accent colors (same as useStationMode)
const LAB_COLORS: Record<number, string> = {
  1: '#00BBFF', 2: '#AA66FF', 3: '#FF66AA', 4: '#FFAA44', 5: '#00FF88',
  6: '#FF6644', 7: '#06B6D4', 8: '#818CF8', 9: '#10B981', 10: '#D946EF',
};

interface HolographicLabMapProps {
  focusedLabId: number | null;
  hoveredLabId: number | null;
  labCompletions: Record<number, number>; // labId -> 0-1 completion
  orbitSpeed: number;
  onLabClick: (labId: number) => void;
  onLabHover: (labId: number | null) => void;
  onLabDoubleClick: (labId: number) => void;
}

// Central holographic core — pulsing energy orb at the center
function HolographicCore({ color, pulse }: { color: string; pulse: number }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.5;
      const s = 0.3 + pulse * 0.05;
      coreRef.current.scale.setScalar(s);
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.y += delta * 0.2;
      ringsRef.current.rotation.x += delta * 0.1;
    }
  });

  return (
    <group>
      {/* Central orb */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
            transparent
            opacity={0.6}
            wireframe
          />
        </mesh>
      </Float>

      {/* Rotating rings */}
      <group ref={ringsRef}>
        <mesh rotation-x={Math.PI / 2}>
          <torusGeometry args={[1.2, 0.008, 8, 96]} />
          <meshBasicMaterial color={color} transparent opacity={0.25} />
        </mesh>
        <mesh rotation-x={Math.PI / 3}>
          <torusGeometry args={[1.0, 0.005, 8, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
        </mesh>
        <mesh rotation-x={Math.PI / 6} rotation-y={Math.PI / 4}>
          <torusGeometry args={[0.8, 0.005, 8, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.15} />
        </mesh>
      </group>

      {/* Grid floor */}
      <gridHelper
        args={[12, 24, '#00BBFF', '#00BBFF']}
        position-y={-0.8}
        material-opacity={0.04}
        material-transparent={true}
      />
    </group>
  );
}

export function HolographicLabMap({
  focusedLabId,
  hoveredLabId,
  labCompletions,
  orbitSpeed,
  onLabClick,
  onLabHover,
  onLabDoubleClick,
}: HolographicLabMapProps) {
  const groupRef = useRef<THREE.Group>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gentle auto-rotation when no lab is focused
  useFrame((_, delta) => {
    if (!groupRef.current || focusedLabId !== null) return;
    groupRef.current.rotation.y += delta * orbitSpeed;
  });

  // Core color follows focused lab or defaults to primary blue
  const coreColor = focusedLabId
    ? LAB_COLORS[focusedLabId] || '#00BBFF'
    : '#00BBFF';

  const pulse = useMemo(() => Math.sin(Date.now() * 0.002) * 0.5 + 0.5, []);

  // Handle single vs double click
  const handleLabClick = useCallback(
    (labId: number) => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
        // Double click — enter lab
        onLabDoubleClick(labId);
        return;
      }
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        // Single click — focus lab
        onLabClick(labId);
      }, 250);
    },
    [onLabClick, onLabDoubleClick]
  );

  return (
    <group ref={groupRef}>
      {/* Central holographic core */}
      <HolographicCore color={coreColor} pulse={pulse} />

      {/* Lab structures arranged in ring */}
      {LABS.map((lab) => {
        const pos = LAB_POSITIONS[lab.id];
        if (!pos) return null;
        return (
          <LabStructure3D
            key={lab.id}
            labId={lab.id}
            position={pos}
            color={LAB_COLORS[lab.id] || '#00BBFF'}
            title={lab.title}
            icon={lab.icon}
            isFocused={focusedLabId === lab.id}
            isHovered={hoveredLabId === lab.id}
            completionPct={labCompletions[lab.id] ?? 0}
            onClick={() => handleLabClick(lab.id)}
            onPointerEnter={() => onLabHover(lab.id)}
            onPointerLeave={() => onLabHover(null)}
          />
        );
      })}
    </group>
  );
}
