'use client';

// ════════════════════════════════════════════════════════════════
// GameHUD3D — Shared 3D Game HUD (Phase 5: Flagship Games)
// ════════════════════════════════════════════════════════════════
// Renders score gauge, round counter, phase indicator, and hints
// as 3D elements inside CockpitCanvas during game mode (UI-8).
//
// Reads directly from gameStore — no props needed for core data.
// Positioned at the top of the game viewport area.
//
// Per JSON spec UI-8: Game = 75% viewport takeover. HUD floats
// at the top edge of the expanded center viewport.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Color, Group, Mesh, MeshStandardMaterial } from 'three';
import { useGameStore } from '@/stores/gameStore';
import {
  CHROME_BORDER,
  TYPE_SCALE,
  TEXT_COLORS,
  NUMERIC_FONT,
  EMISSIVE_IDLE_INDICATOR,
  EMISSIVE_SCALE,
  HOVER_GLOW,
} from '@/lib/3d/cockpitDesignTokens';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const HUD_WIDTH = 1.8;
const HUD_HEIGHT = 0.12;
const HUD_DEPTH = 0.004;
const HUD_Y = 0.85;     // Top of game viewport
const HUD_Z = -2.8;     // In front of center viewport screen
const CARBON_BG = '#0A0F1F';
const CHROME_HEX = CHROME_BORDER.colorHex;

// ═══════════════════════════════════════════════════════════════
// SCORE ARC — Radial progress arc for score
// ═══════════════════════════════════════════════════════════════

function ScoreArc({
  score,
  maxPossible,
  color,
  position,
}: {
  score: number;
  maxPossible: number;
  color: string;
  position: [number, number, number];
}) {
  const progress = maxPossible > 0 ? Math.min(score / maxPossible, 1) : 0;
  const arcAngle = progress * Math.PI * 1.5; // 270° max arc
  const segments = Math.max(3, Math.floor(progress * 24));

  return (
    <group position={position}>
      {/* Background arc track */}
      <mesh rotation={[0, 0, Math.PI * 0.75]}>
        <ringGeometry args={[0.032, 0.04, 24, 1, 0, Math.PI * 1.5]} />
        <meshStandardMaterial
          color={new Color('#1A1822')}
          emissive={new Color(color)}
          emissiveIntensity={0.05}
        />
      </mesh>
      {/* Filled arc */}
      {progress > 0 && (
        <mesh rotation={[0, 0, Math.PI * 0.75]}>
          <ringGeometry args={[0.032, 0.04, segments, 1, 0, arcAngle]} />
          <meshStandardMaterial
            color={new Color(color)}
            emissive={new Color(color)}
            emissiveIntensity={EMISSIVE_SCALE.medium}
            toneMapped={false}
          />
        </mesh>
      )}
      {/* Score number in center */}
      <Text
        fontSize={0.028}
        color={color}
        anchorX="center"
        anchorY="middle"
        font={NUMERIC_FONT}
      >
        {`${score}`}
      </Text>
      {/* Label below */}
      <Text
        position={[0, -0.05, 0]}
        fontSize={TYPE_SCALE.caption.fontSize * 0.7}
        color={TEXT_COLORS.muted.hex}
        anchorX="center"
        anchorY="middle"
        font={TYPE_SCALE.caption.fontPath}
        fillOpacity={TEXT_COLORS.muted.opacity}
      >
        SCORE
      </Text>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// ROUND COUNTER — Shows currentRound / totalRounds
// ═══════════════════════════════════════════════════════════════

function RoundCounter({
  current,
  total,
  color,
  position,
}: {
  current: number;
  total: number;
  color: string;
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <Text
        fontSize={0.028}
        color={TEXT_COLORS.primary.hex}
        anchorX="center"
        anchorY="middle"
        font={NUMERIC_FONT}
      >
        {`${current}`}
      </Text>
      <Text
        position={[0.03, 0, 0]}
        fontSize={0.018}
        color={TEXT_COLORS.dim.hex}
        anchorX="left"
        anchorY="middle"
        font={NUMERIC_FONT}
        fillOpacity={TEXT_COLORS.dim.opacity}
      >
        {`/${total}`}
      </Text>
      <Text
        position={[0, -0.05, 0]}
        fontSize={TYPE_SCALE.caption.fontSize * 0.7}
        color={TEXT_COLORS.muted.hex}
        anchorX="center"
        anchorY="middle"
        font={TYPE_SCALE.caption.fontPath}
        fillOpacity={TEXT_COLORS.muted.opacity}
      >
        ROUND
      </Text>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// HINT PIPS — Shows remaining hints as lit/unlit dots
// ═══════════════════════════════════════════════════════════════

function HintPips({
  remaining,
  total,
  color,
  position,
}: {
  remaining: number;
  total: number;
  color: string;
  position: [number, number, number];
}) {
  if (total <= 0) return null;

  return (
    <group position={position}>
      {Array.from({ length: total }, (_, i) => {
        const lit = i < remaining;
        const x = (i - (total - 1) / 2) * 0.018;
        return (
          <mesh key={i} position={[x, 0, 0]}>
            <circleGeometry args={[0.006, 8]} />
            <meshStandardMaterial
              color={lit ? new Color(color) : new Color('#1A1822')}
              emissive={lit ? new Color(color) : new Color('#111')}
              emissiveIntensity={lit ? EMISSIVE_SCALE.medium : 0.02}
            />
          </mesh>
        );
      })}
      <Text
        position={[0, -0.025, 0]}
        fontSize={TYPE_SCALE.caption.fontSize * 0.6}
        color={TEXT_COLORS.muted.hex}
        anchorX="center"
        anchorY="middle"
        font={TYPE_SCALE.caption.fontPath}
        fillOpacity={TEXT_COLORS.muted.opacity}
      >
        HINTS
      </Text>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

interface GameHUD3DProps {
  /** Lab/world accent color */
  color?: string;
  /** Game title displayed in HUD */
  title?: string;
  /** Whether to show timer */
  showTimer?: boolean;
  /** Max possible score (for arc fill calculation) */
  maxScore?: number;
}

export function GameHUD3D({
  color = '#00BBFF',
  title = '',
  showTimer = false,
  maxScore,
}: GameHUD3DProps) {
  const score = useGameStore((s) => s.score);
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const hintsRemaining = useGameStore((s) => s.hintsRemaining);
  const timeElapsed = useGameStore((s) => s.timeElapsed);
  const isComplete = useGameStore((s) => s.isComplete);

  const glowRef = useRef<Mesh>(null);
  const chromeColor = useMemo(() => new Color(CHROME_HEX), []);
  const accentColor = useMemo(() => new Color(color), [color]);

  const computedMaxScore = maxScore || totalRounds * 10;

  // Format time
  const minutes = Math.floor(timeElapsed / 60);
  const seconds = timeElapsed % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Breathing glow on HUD bar
  useFrame((state) => {
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * (Math.PI * 2 / HOVER_GLOW.pulsePeriodS));
      (glowRef.current.material as MeshStandardMaterial).emissiveIntensity =
        EMISSIVE_IDLE_INDICATOR + pulse * 0.1;
    }
  });

  return (
    <group name="game-hud-3d" position={[0, HUD_Y, HUD_Z]}>
      {/* ═══ HUD Bar Background ═══ */}
      <mesh ref={glowRef}>
        <boxGeometry args={[HUD_WIDTH, HUD_HEIGHT, HUD_DEPTH]} />
        <meshStandardMaterial
          color={new Color(CARBON_BG)}
          emissive={accentColor}
          emissiveIntensity={EMISSIVE_IDLE_INDICATOR}
          metalness={0.85}
          roughness={0.35}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Chrome frame edges */}
      <mesh position={[0, HUD_HEIGHT / 2, HUD_DEPTH / 2 + 0.001]}>
        <boxGeometry args={[HUD_WIDTH, 0.002, 0.002]} />
        <meshStandardMaterial color={chromeColor} metalness={0.95} roughness={0.1}
          emissive={accentColor} emissiveIntensity={CHROME_BORDER.glowIntensity} />
      </mesh>
      <mesh position={[0, -HUD_HEIGHT / 2, HUD_DEPTH / 2 + 0.001]}>
        <boxGeometry args={[HUD_WIDTH, 0.002, 0.002]} />
        <meshStandardMaterial color={chromeColor} metalness={0.95} roughness={0.1}
          emissive={accentColor} emissiveIntensity={CHROME_BORDER.glowIntensity} />
      </mesh>

      {/* ═══ Content ═══ */}
      <group position={[0, 0, HUD_DEPTH / 2 + 0.002]}>
        {/* Game title (left) */}
        {title && (
          <Text
            position={[-HUD_WIDTH / 2 + 0.06, 0, 0]}
            fontSize={TYPE_SCALE.label.fontSize}
            color={color}
            anchorX="left"
            anchorY="middle"
            font={TYPE_SCALE.label.fontPath}
            maxWidth={0.35}
          >
            {title}
          </Text>
        )}

        {/* Score arc (center-left) */}
        <ScoreArc
          score={score}
          maxPossible={computedMaxScore}
          color={color}
          position={[-0.15, 0, 0]}
        />

        {/* Chrome divider */}
        <mesh position={[0.05, 0, 0]}>
          <boxGeometry args={[0.002, HUD_HEIGHT * 0.6, 0.002]} />
          <meshStandardMaterial color={chromeColor} metalness={0.95} roughness={0.1} />
        </mesh>

        {/* Round counter (center) */}
        <RoundCounter
          current={currentRound}
          total={totalRounds}
          color={color}
          position={[0.2, 0, 0]}
        />

        {/* Chrome divider */}
        <mesh position={[0.38, 0, 0]}>
          <boxGeometry args={[0.002, HUD_HEIGHT * 0.6, 0.002]} />
          <meshStandardMaterial color={chromeColor} metalness={0.95} roughness={0.1} />
        </mesh>

        {/* Hint pips (center-right) */}
        <HintPips
          remaining={hintsRemaining}
          total={3}
          color={color}
          position={[0.52, 0, 0]}
        />

        {/* Timer (far right, optional) */}
        {showTimer && (
          <group position={[HUD_WIDTH / 2 - 0.12, 0, 0]}>
            <Text
              fontSize={0.024}
              color={TEXT_COLORS.primary.hex}
              anchorX="center"
              anchorY="middle"
              font={NUMERIC_FONT}
            >
              {timeStr}
            </Text>
          </group>
        )}

        {/* Complete badge (overlays when done) */}
        {isComplete && (
          <group position={[HUD_WIDTH / 2 - 0.08, 0, 0.003]}>
            <mesh>
              <boxGeometry args={[0.14, HUD_HEIGHT * 0.7, 0.003]} />
              <meshStandardMaterial
                color={new Color('#FFD700')}
                emissive={new Color('#FFD700')}
                emissiveIntensity={EMISSIVE_SCALE.bright}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            <Text
              fontSize={TYPE_SCALE.caption.fontSize * 0.8}
              color="#000000"
              anchorX="center"
              anchorY="middle"
              font={TYPE_SCALE.caption.fontPath}
            >
              DONE
            </Text>
          </group>
        )}
      </group>
    </group>
  );
}

export default GameHUD3D;
