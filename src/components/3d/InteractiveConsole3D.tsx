'use client';

// ════════════════════════════════════════════════════
// InteractiveConsole3D — Holographic Stat Consoles
// ════════════════════════════════════════════════════
// Enhancement 1.1: Physical 3D consoles for XP stats, badge gallery,
// streak tracker — holographic displays the child interacts with spatially.
//
// 4 consoles arranged around the central map:
// - XP Console (front-left): XP bar, level, progress
// - Badge Console (front-right): Recent badges, rarity glow
// - Streak Console (back-left): Streak fire, calendar
// - Progress Console (back-right): Lab completion overview

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Float } from '@react-three/drei';
import * as THREE from 'three';

type ConsoleVariant = 'xp' | 'badges' | 'streak' | 'progress';

interface ConsoleData {
  xp?: number;
  xpMax?: number;
  level?: number;
  levelTitle?: string;
  streak?: number;
  badgeCount?: number;
  recentBadge?: string;
  labsCompleted?: number;
  totalLabs?: number;
}

interface InteractiveConsoleProps {
  variant: ConsoleVariant;
  position: [number, number, number];
  rotation?: [number, number, number];
  data: ConsoleData;
  isActive: boolean;
  onClick: () => void;
}

const CONSOLE_COLORS: Record<ConsoleVariant, string> = {
  xp: '#00BBFF',
  badges: '#FFAA44',
  streak: '#FF6644',
  progress: '#00FF88',
};

const CONSOLE_LABELS: Record<ConsoleVariant, string> = {
  xp: 'XP STATION',
  badges: 'BADGE VAULT',
  streak: 'STREAK CORE',
  progress: 'LAB PROGRESS',
};

function ConsoleContent({
  variant,
  data,
  color,
}: {
  variant: ConsoleVariant;
  data: ConsoleData;
  color: string;
}) {
  switch (variant) {
    case 'xp':
      return (
        <group>
          <Text
            position={[0, 0.15, 0.01]}
            fontSize={0.06}
            color={color}
            anchorX="center"
            font="/fonts/Orbitron-Bold.woff"
          >
            {`${data.xp ?? 0} / ${data.xpMax ?? 500} XP`}
          </Text>
          <Text
            position={[0, 0.03, 0.01]}
            fontSize={0.04}
            color="#ffffff"
            anchorX="center"
            font="/fonts/Sora-Regular.woff"
          >
            {`Level ${data.level ?? 1} — ${data.levelTitle ?? 'Spark Starter'}`}
          </Text>
          {/* XP bar */}
          <mesh position={[0, -0.06, 0.01]}>
            <planeGeometry args={[0.5, 0.03]} />
            <meshBasicMaterial color="#1A1822" />
          </mesh>
          <mesh position={[-0.25 + ((data.xp ?? 0) / (data.xpMax ?? 500)) * 0.25, -0.06, 0.015]}>
            <planeGeometry args={[((data.xp ?? 0) / (data.xpMax ?? 500)) * 0.5, 0.025]} />
            <meshBasicMaterial color={color} />
          </mesh>
        </group>
      );
    case 'badges':
      return (
        <group>
          <Text
            position={[0, 0.12, 0.01]}
            fontSize={0.08}
            color={color}
            anchorX="center"
            font="/fonts/Orbitron-Bold.woff"
          >
            {`${data.badgeCount ?? 0}`}
          </Text>
          <Text
            position={[0, 0.01, 0.01]}
            fontSize={0.04}
            color="#ffffff"
            anchorX="center"
            font="/fonts/Sora-Regular.woff"
          >
            Badges Earned
          </Text>
          {data.recentBadge && (
            <Text
              position={[0, -0.08, 0.01]}
              fontSize={0.035}
              color={color}
              anchorX="center"
              font="/fonts/Sora-Regular.woff"
            >
              {`Latest: ${data.recentBadge}`}
            </Text>
          )}
        </group>
      );
    case 'streak':
      return (
        <group>
          <Text
            position={[0, 0.12, 0.01]}
            fontSize={0.1}
            color={color}
            anchorX="center"
            font="/fonts/Orbitron-Bold.woff"
          >
            {`${data.streak ?? 0}`}
          </Text>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.04}
            color="#ffffff"
            anchorX="center"
            font="/fonts/Sora-Regular.woff"
          >
            Day Streak
          </Text>
        </group>
      );
    case 'progress':
      return (
        <group>
          <Text
            position={[0, 0.12, 0.01]}
            fontSize={0.06}
            color={color}
            anchorX="center"
            font="/fonts/Orbitron-Bold.woff"
          >
            {`${data.labsCompleted ?? 0} / ${data.totalLabs ?? 10}`}
          </Text>
          <Text
            position={[0, 0.01, 0.01]}
            fontSize={0.04}
            color="#ffffff"
            anchorX="center"
            font="/fonts/Sora-Regular.woff"
          >
            Labs Explored
          </Text>
        </group>
      );
  }
}

export function InteractiveConsole3D({
  variant,
  position,
  rotation = [0, 0, 0],
  data,
  isActive,
  onClick,
}: InteractiveConsoleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const color = CONSOLE_COLORS[variant];
  const label = CONSOLE_LABELS[variant];

  useFrame(() => {
    if (!groupRef.current) return;
    // Subtle hover float
    groupRef.current.position.y =
      position[1] + Math.sin(Date.now() * 0.002 + variant.charCodeAt(0)) * 0.03;

    // Glow pulse
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      const pulse = Math.sin(Date.now() * 0.003) * 0.1;
      mat.opacity = isActive ? 0.25 + pulse : 0.08 + pulse * 0.5;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={new THREE.Euler(...rotation)}
    >
      <Float speed={1.2} rotationIntensity={0} floatIntensity={0.15}>
        {/* Console body — rounded box with chrome edges */}
        <RoundedBox
          args={[0.7, 0.5, 0.05]}
          radius={0.02}
          smoothness={4}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          onPointerEnter={() => {
            document.body.style.cursor = 'pointer';
          }}
          onPointerLeave={() => {
            document.body.style.cursor = 'default';
          }}
        >
          <meshStandardMaterial
            color="#111118"
            metalness={0.9}
            roughness={0.2}
            emissive={color}
            emissiveIntensity={isActive ? 0.15 : 0.05}
          />
        </RoundedBox>

        {/* Glow backdrop */}
        <mesh ref={glowRef} position-z={-0.03}>
          <planeGeometry args={[0.75, 0.55]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.08}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Top label */}
        <Text
          position={[0, 0.3, 0.01]}
          fontSize={0.035}
          color={color}
          anchorX="center"
          anchorY="bottom"
          font="/fonts/Orbitron-Bold.woff"
        >
          {label}
        </Text>

        {/* Console content */}
        <ConsoleContent variant={variant} data={data} color={color} />

        {/* Chrome edge highlight */}
        <mesh position-z={0.026}>
          <ringGeometry args={[0.33, 0.35, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.1} />
        </mesh>
      </Float>
    </group>
  );
}

// Pre-defined console positions around the map
export const CONSOLE_POSITIONS: Record<ConsoleVariant, { position: [number, number, number]; rotation: [number, number, number] }> = {
  xp:       { position: [-2.5, 0.8, 4.5], rotation: [0, 0.3, 0] },
  badges:   { position: [2.5, 0.8, 4.5],  rotation: [0, -0.3, 0] },
  streak:   { position: [-3.5, 0.8, -1],   rotation: [0, 0.6, 0] },
  progress: { position: [3.5, 0.8, -1],    rotation: [0, -0.6, 0] },
};
