'use client';

// ================================================================
// SparkForge StreakFlame3D — Streak Fire Shader Flame
// ================================================================
// Decision 5.4: Streak flame for 7+ day streaks
// Renders INSIDE CockpitCanvas as a <group> (D3D-B1)
// 3 intersecting PlaneGeometry billboards with additive blending
// Scale increases with streak tier:
//   7-13: 0.3, 14-29: 0.5, 30-99: 0.7, 100+: 1.0
// pointLight for glow emission
// useFrame for animated UV offset

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, DoubleSide, Group } from 'three';
// R2: a11y state merged into uiStore (was accessibilityStore)
import { useUIStore } from '@/stores/uiStore';

interface StreakFlame3DProps {
  streakDays: number;
  color?: string;
  position?: [number, number, number];
}

function getStreakScale(days: number): number {
  if (days >= 100) return 1.0;
  if (days >= 30) return 0.7;
  if (days >= 14) return 0.5;
  if (days >= 7) return 0.3;
  return 0;
}

function getGlowIntensity(days: number): number {
  if (days >= 100) return 3.0;
  if (days >= 30) return 2.0;
  if (days >= 14) return 1.5;
  return 1.0;
}

export default function StreakFlame3D({
  streakDays,
  color = '#FF6644',
  position = [0, 0, 0],
}: StreakFlame3DProps) {
  const groupRef = useRef<Group>(null);
  const reduceMotion = useUIStore((s) => s.a11y.reduceMotion);

  const flameColor = useMemo(() => new Color(color), [color]);
  const scale = useMemo(() => getStreakScale(streakDays), [streakDays]);
  const glowIntensity = useMemo(() => getGlowIntensity(streakDays), [streakDays]);

  // Animated UV offset for flame flicker
  useFrame(({ clock }) => {
    if (!groupRef.current || reduceMotion) return;
    const t = clock.elapsedTime;
    // Gentle sway
    groupRef.current.rotation.z = Math.sin(t * 2.0) * 0.05;
    // Subtle scale pulse
    const pulse = 1.0 + Math.sin(t * 3.0) * 0.08;
    groupRef.current.scale.setScalar(scale * pulse);
  });

  // Don't render below 7 days
  if (streakDays < 7) return null;

  // 3 intersecting planes at 0, pi/4, -pi/4
  const planeRotations: [number, number, number][] = [
    [0, 0, 0],
    [0, Math.PI / 4, 0],
    [0, -Math.PI / 4, 0],
  ];

  return (
    <group position={position}>
      <group ref={groupRef} scale={scale}>
        {planeRotations.map((rot, i) => (
          <mesh
            key={i}
            rotation={rot}
            scale={[1 - i * 0.1, 1 - i * 0.05, 1]}
          >
            <planeGeometry args={[0.4, 0.6]} />
            <meshBasicMaterial
              color={flameColor}
              transparent
              opacity={0.6 - i * 0.1}
              blending={AdditiveBlending}
              depthWrite={false}
              side={DoubleSide}
              toneMapped={false}
            />
          </mesh>
        ))}

        {/* Inner glow point light */}
        <pointLight
          position={[0, 0.15, 0]}
          color={color}
          intensity={glowIntensity}
          distance={2}
          decay={2}
        />
      </group>
    </group>
  );
}
