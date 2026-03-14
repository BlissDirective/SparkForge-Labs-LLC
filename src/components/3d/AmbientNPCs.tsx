'use client';

// ════════════════════════════════════════════════════
// AmbientNPCs — Background Robot Assistants
// ════════════════════════════════════════════════════
// Enhancement 1.1: Small robot assistants that float around the station,
// giving it a sense of life. They follow simple patrol paths and
// react to player interactions (briefly face focused lab).
//
// Low triangle budget: ~200 tris per bot, max 5 bots.
// Uses instanced mesh for performance.

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { useDeviceStore } from '@/stores/deviceStore';

interface AmbientNPCsProps {
  visible: boolean;
  focusedLabPosition: [number, number, number] | null;
}

interface BotState {
  id: number;
  pathRadius: number;
  height: number;
  speed: number;
  phase: number;
  color: string;
  scale: number;
}

// Small geometric robot — sphere head + box body + antenna
function MiniBot({
  position,
  rotation,
  color,
  scale,
}: {
  position: [number, number, number];
  rotation: number;
  color: string;
  scale: number;
}) {
  return (
    <group position={position} rotation-y={rotation} scale={scale}>
      {/* Body */}
      <mesh>
        <boxGeometry args={[0.12, 0.15, 0.08]} />
        <meshStandardMaterial
          color="#1A1822"
          metalness={0.8}
          roughness={0.3}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
      {/* Head */}
      <mesh position-y={0.12}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial
          color="#111118"
          metalness={0.9}
          roughness={0.2}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Eye (single visor) */}
      <mesh position={[0, 0.12, 0.055]}>
        <planeGeometry args={[0.08, 0.025]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Antenna */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.06, 4]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Antenna tip */}
      <mesh position={[0, 0.23, 0]}>
        <sphereGeometry args={[0.012, 6, 4]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

export function AmbientNPCs({ visible, focusedLabPosition }: AmbientNPCsProps) {
  const botsRef = useRef<THREE.Group>(null);
  const profile = useDeviceStore((s) => s.profile);

  // Determine bot count based on device
  const botCount = profile.lodBias === 'high' ? 5 : profile.lodBias === 'medium' ? 3 : 0;

  const bots = useMemo<BotState[]>(() => {
    const colors = ['#00BBFF', '#AA66FF', '#00FF88', '#FFAA44', '#FF66AA'];
    return Array.from({ length: botCount }, (_, i) => ({
      id: i,
      pathRadius: 5.5 + i * 0.6,
      height: 1.2 + (i % 3) * 0.5,
      speed: 0.15 + i * 0.03,
      phase: (i / botCount) * Math.PI * 2,
      color: colors[i % colors.length],
      scale: 0.7 + Math.random() * 0.4,
    }));
  }, [botCount]);

  const botPositions = useRef<Array<{ pos: [number, number, number]; rot: number }>>(
    bots.map(() => ({ pos: [0, 0, 0], rot: 0 }))
  );

  useFrame(({ clock }) => {
    if (!visible || botCount === 0) return;
    const t = clock.elapsedTime;

    bots.forEach((bot, i) => {
      const angle = t * bot.speed + bot.phase;
      const x = Math.cos(angle) * bot.pathRadius;
      const z = Math.sin(angle) * bot.pathRadius;
      const y = bot.height + Math.sin(t * 0.5 + bot.phase) * 0.15;

      // Face direction of travel (or focused lab if nearby)
      let facingAngle = angle + Math.PI / 2;

      if (focusedLabPosition) {
        const dx = focusedLabPosition[0] - x;
        const dz = focusedLabPosition[2] - z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 4) {
          // Blend toward looking at focused lab
          const labAngle = Math.atan2(dz, dx);
          facingAngle = THREE.MathUtils.lerp(facingAngle, labAngle, 0.3);
        }
      }

      botPositions.current[i] = {
        pos: [x, y, z],
        rot: facingAngle,
      };
    });
  });

  if (!visible || botCount === 0) return null;

  return (
    <group ref={botsRef}>
      {bots.map((bot, i) => (
        <Float key={bot.id} speed={1} floatIntensity={0.2} rotationIntensity={0}>
          <MiniBot
            position={botPositions.current[i]?.pos || [0, 0, 0]}
            rotation={botPositions.current[i]?.rot || 0}
            color={bot.color}
            scale={bot.scale}
          />
        </Float>
      ))}
    </group>
  );
}
