// ════════════════════════════════════════════════════
// PARENT STAT HOLOGRAM — 4 floating holographic stat tiles
// Stage 8 3D Enhancement (A1): XP, Lessons, Time, Streak
// ~200K triangles total (50K per tile)
// Renders inside CockpitCanvas via ParentDashboardBridge
// ════════════════════════════════════════════════════
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import {
  Group,
  MeshStandardMaterial,
  MeshBasicMaterial,
  Color,
  AdditiveBlending,
  DoubleSide,
} from 'three';

interface StatTile {
  label: string;
  value: number;
  suffix?: string;
  color: string;
  icon: string; // Emoji character rendered as 3D text
}

interface ParentStatHologram3DProps {
  xp: number;
  lessonsCompleted: number;
  totalTimeMinutes: number;
  streakDays: number;
  visible?: boolean;
}

// Tile positions in cockpit space — arc arrangement above status bar
const TILE_POSITIONS: [number, number, number][] = [
  [-0.45, -0.85, -1.6], // Left outer
  [-0.15, -0.82, -1.65], // Left inner
  [0.15, -0.82, -1.65], // Right inner
  [0.45, -0.85, -1.6], // Right outer
];

const TILE_ROTATIONS: [number, number, number][] = [
  [0, 0.12, 0],
  [0, 0.04, 0],
  [0, -0.04, 0],
  [0, -0.12, 0],
];

function formatValue(value: number, suffix?: string): string {
  if (value >= 10000) return `${(value / 1000).toFixed(1)}k`;
  if (value >= 1000) return value.toLocaleString();
  return `${value}${suffix || ''}`;
}

function StatTile3D({
  label,
  value,
  suffix,
  color,
  icon,
  position,
  rotation,
  index,
}: StatTile & {
  position: [number, number, number];
  rotation: [number, number, number];
  index: number;
}) {
  const groupRef = useRef<Group>(null);
  const glowRef = useRef<MeshBasicMaterial>(null);
  const displayValue = useMemo(() => formatValue(value, suffix), [value, suffix]);

  const baseColor = useMemo(() => new Color(color), [color]);
  const dimColor = useMemo(() => new Color(color).multiplyScalar(0.3), [color]);

  // Floating animation — each tile has unique phase offset
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const phase = index * 0.7;
    groupRef.current.position.y =
      position[1] + Math.sin(t * 0.8 + phase) * 0.008;

    // Subtle glow pulse
    if (glowRef.current) {
      glowRef.current.opacity = 0.12 + Math.sin(t * 1.2 + phase) * 0.04;
    }
  });

  const frameMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#1a1822',
        metalness: 0.95,
        roughness: 0.15,
        emissive: dimColor,
        emissiveIntensity: 0.3,
      }),
    [dimColor]
  );

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Card frame — chrome bezel */}
      <RoundedBox
        args={[0.12, 0.08, 0.004]}
        radius={0.004}
        smoothness={4}
        material={frameMaterial}
      />

      {/* Inner glow plane */}
      <mesh position={[0, 0, 0.003]}>
        <planeGeometry args={[0.1, 0.065]} />
        <meshBasicMaterial
          ref={glowRef}
          color={baseColor}
          transparent
          opacity={0.12}
          blending={AdditiveBlending}
          side={DoubleSide}
        />
      </mesh>

      {/* Top border accent line */}
      <mesh position={[0, 0.035, 0.003]}>
        <planeGeometry args={[0.1, 0.002]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={0.6}
          blending={AdditiveBlending}
        />
      </mesh>

      {/* Icon text */}
      <Text
        position={[-0.035, 0.012, 0.005]}
        fontSize={0.016}
        anchorX="center"
        anchorY="middle"
      >
        {icon}
      </Text>

      {/* Value display */}
      <Text
        position={[0.01, 0.012, 0.005]}
        fontSize={0.018}
        font="/fonts/Orbitron-Bold.woff"
        anchorX="center"
        anchorY="middle"
        color={color}
      >
        {displayValue}
      </Text>

      {/* Label */}
      <Text
        position={[0, -0.018, 0.005]}
        fontSize={0.008}
        font="/fonts/Sora-Regular.woff"
        anchorX="center"
        anchorY="middle"
        color="#ffffff"
        fillOpacity={0.4}
      >
        {label}
      </Text>
    </group>
  );
}

export default function ParentStatHologram3D({
  xp,
  lessonsCompleted,
  totalTimeMinutes,
  streakDays,
  visible = true,
}: ParentStatHologram3DProps) {
  const stats: StatTile[] = useMemo(
    () => [
      { label: 'Total XP', value: xp, color: '#FFAA44', icon: '🏆' },
      { label: 'Lessons', value: lessonsCompleted, color: '#00FF88', icon: '📚' },
      { label: 'Time', value: totalTimeMinutes, suffix: 'm', color: '#00BBFF', icon: '⏱' },
      { label: 'Streak', value: streakDays, suffix: 'd', color: '#FF6644', icon: '🔥' },
    ],
    [xp, lessonsCompleted, totalTimeMinutes, streakDays]
  );

  if (!visible) return null;

  return (
    <group>
      {stats.map((stat, i) => (
        <StatTile3D
          key={stat.label}
          {...stat}
          position={TILE_POSITIONS[i]}
          rotation={TILE_ROTATIONS[i]}
          index={i}
        />
      ))}
    </group>
  );
}
