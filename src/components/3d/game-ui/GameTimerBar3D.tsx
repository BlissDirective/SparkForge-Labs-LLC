'use client';

// ════════════════════════════════════════════════════════════════
// GameTimerBar3D — Countdown/Elapsed Timer Bar (Phase 5)
// ════════════════════════════════════════════════════════════════
// Optional timer that renders below the GameHUD3D bar.
// Can operate in countdown or elapsed mode.
// Pulses urgently when time is running low.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Color, Mesh, MeshStandardMaterial } from 'three';
import { useGameStore } from '@/stores/gameStore';
import {
  CHROME_BORDER,
  NUMERIC_FONT,
  EMISSIVE_SCALE,
} from '@/lib/3d/cockpitDesignTokens';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const BAR_WIDTH = 1.0;
const BAR_HEIGHT = 0.015;
const BAR_Y = 0.77;
const BAR_Z = -2.8;
const URGENT_THRESHOLD = 0.2; // Pulse when <20% time remaining

interface GameTimerBar3DProps {
  /** Total time limit in seconds (countdown mode). If 0, shows elapsed. */
  timeLimit?: number;
  /** Accent color */
  color?: string;
}

export function GameTimerBar3D({
  timeLimit = 0,
  color = '#00BBFF',
}: GameTimerBar3DProps) {
  const timeElapsed = useGameStore((s) => s.timeElapsed);
  const barRef = useRef<Mesh>(null);

  const accentColor = useMemo(() => new Color(color), [color]);
  const urgentColor = useMemo(() => new Color('#FF6644'), []);
  const chromeColor = useMemo(() => new Color(CHROME_BORDER.colorHex), []);

  const isCountdown = timeLimit > 0;
  const remaining = isCountdown ? Math.max(0, timeLimit - timeElapsed) : timeElapsed;
  const progress = isCountdown ? remaining / timeLimit : 1;
  const isUrgent = isCountdown && progress < URGENT_THRESHOLD;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Urgent pulse
  useFrame((state) => {
    if (barRef.current && isUrgent) {
      const mat = barRef.current.material as MeshStandardMaterial;
      const pulse = Math.sin(state.clock.elapsedTime * 6) * 0.5 + 0.5;
      mat.emissiveIntensity = EMISSIVE_SCALE.medium + pulse * EMISSIVE_SCALE.bright;
    }
  });

  const fillWidth = BAR_WIDTH * Math.max(0.001, progress);
  const displayColor = isUrgent ? urgentColor : accentColor;

  return (
    <group name="game-timer-bar" position={[0, BAR_Y, BAR_Z]}>
      {/* Track background */}
      <mesh>
        <boxGeometry args={[BAR_WIDTH + 0.004, BAR_HEIGHT + 0.004, 0.002]} />
        <meshStandardMaterial
          color={chromeColor}
          metalness={0.95}
          roughness={0.1}
          emissive={displayColor}
          emissiveIntensity={CHROME_BORDER.glowIntensity}
        />
      </mesh>
      <mesh position={[0, 0, 0.001]}>
        <boxGeometry args={[BAR_WIDTH, BAR_HEIGHT, 0.002]} />
        <meshStandardMaterial color={new Color('#0A0F1F')} metalness={0.3} roughness={0.6} />
      </mesh>

      {/* Fill bar */}
      <mesh
        ref={barRef}
        position={[-(BAR_WIDTH - fillWidth) / 2, 0, 0.002]}
      >
        <boxGeometry args={[fillWidth, BAR_HEIGHT - 0.002, 0.002]} />
        <meshStandardMaterial
          color={displayColor}
          emissive={displayColor}
          emissiveIntensity={EMISSIVE_SCALE.medium}
          toneMapped={false}
        />
      </mesh>

      {/* Time display */}
      <Text
        position={[BAR_WIDTH / 2 + 0.06, 0, 0.002]}
        fontSize={0.016}
        color={isUrgent ? '#FF6644' : '#F0F0F4'}
        anchorX="left"
        anchorY="middle"
        font={NUMERIC_FONT}
      >
        {timeStr}
      </Text>
    </group>
  );
}

export default GameTimerBar3D;
