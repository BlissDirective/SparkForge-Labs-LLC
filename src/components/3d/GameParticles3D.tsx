'use client';

// ================================================================
// SparkForge GameParticles3D — Per-Game Particle Config Registry
// ================================================================
// Decision 5.3: 6 flagship custom + default lab-colored sparkles
// Respects particle intensity slider (Decision 5.5) via uiStore.
// Renders INSIDE CockpitCanvas as a <group> (D3D-B1).
//
// Props: { gameId: string; labColor?: string }
// Uses drei Sparkles component for all particle rendering.
// Intensity: off=0, low=0.3, medium=1.0, high=2.0

import { useMemo } from 'react';
import { Sparkles } from '@react-three/drei';
import { useUIStore } from '@/stores/uiStore';

// ---- Particle Intensity Multipliers (Decision 5.5) ----
const INTENSITY_MULTIPLIERS: Record<string, number> = {
  off: 0,
  low: 0.3,
  medium: 1.0,
  high: 2.0,
};

// ---- Particle Config Interface ----
export interface GameParticleConfig {
  type: 'custom' | 'generic';
  count: number;
  color: string;
  secondaryColor?: string;
  size: number;
  speed: number;
  scale: [number, number, number];
  shape?: 'sparkles' | 'rising' | 'orbiting' | 'falling';
  label?: string;
}

// ---- Lab Colors (Frost-Prismatic spec, Section 6) ----
const LAB_COLORS: Record<number, string> = {
  1: '#00BBFF', // L1 - Code Lab
  2: '#AA66FF', // L2 - Data Lab
  3: '#FF66AA', // L3 - Neural Lab
  4: '#FFAA44', // L4 - Create Lab
  5: '#00FF88', // L5 - Agent Lab
  6: '#FF6644', // L6 - Ethics Lab
  7: '#06B6D4', // L7 - Vision Lab
  8: '#818CF8', // L8 - Language Lab
  9: '#F97316', // L9 - Build Lab
  10: '#D946EF', // L10 - Frontier Lab
};

// ---- Flagship Custom Configs (6 games) ----
const FLAGSHIP_CONFIGS: Record<string, GameParticleConfig> = {
  'pet-trainer': {
    type: 'custom',
    count: 30,
    color: '#FFAA44',
    secondaryColor: '#FCD34D',
    size: 4,
    speed: 0.3,
    scale: [3, 2, 3],
    shape: 'rising',
    label: 'Pet Trainer: warm rising sparkles',
  },
  'neural-builder': {
    type: 'custom',
    count: 50,
    color: '#FF66AA',
    secondaryColor: '#F472B6',
    size: 2,
    speed: 1.5,
    scale: [4, 3, 2],
    shape: 'sparkles',
    label: 'Neural Builder: fast synapse sparks',
  },
  'prompt-lab': {
    type: 'custom',
    count: 25,
    color: '#FFAA44',
    secondaryColor: '#FBBF24',
    size: 3,
    speed: 0.5,
    scale: [3, 2, 3],
    shape: 'falling',
    label: 'Prompt Lab: falling word fragments',
  },
  'agent-architect': {
    type: 'custom',
    count: 40,
    color: '#00FF88',
    secondaryColor: '#34D399',
    size: 2,
    speed: 1.0,
    scale: [4, 2, 4],
    shape: 'orbiting',
    label: 'Agent Architect: orbiting data packets',
  },
  'bias-detective': {
    type: 'custom',
    count: 20,
    color: '#FF6644',
    secondaryColor: '#F87171',
    size: 3,
    speed: 0.4,
    scale: [3, 3, 3],
    shape: 'sparkles',
    label: 'Bias Detective: balanced scale sparkles',
  },
  'sort-toy-box': {
    type: 'custom',
    count: 35,
    color: '#00BBFF',
    secondaryColor: '#38BDF8',
    size: 3,
    speed: 0.6,
    scale: [3, 3, 3],
    shape: 'falling',
    label: 'Sort Toy Box: cascading sort particles',
  },
};

// ---- Resolve lab number from color string ----
function labNumberFromColor(color: string): number {
  const entry = Object.entries(LAB_COLORS).find(
    ([, c]) => c.toLowerCase() === color.toLowerCase()
  );
  return entry ? Number(entry[0]) : 1;
}

// ---- Get config for any game slug ----
export function getGameParticleConfig(
  gameId: string,
  labColor?: string
): GameParticleConfig {
  if (FLAGSHIP_CONFIGS[gameId]) {
    return FLAGSHIP_CONFIGS[gameId];
  }

  const color = labColor || '#00BBFF';
  return {
    type: 'generic',
    count: 20,
    color,
    size: 2,
    speed: 0.4,
    scale: [3, 2, 3],
    shape: 'sparkles',
    label: `Generic: lab-colored sparkles`,
  };
}

// ---- Main Component ----
interface GameParticles3DProps {
  gameId: string;
  labColor?: string;
  position?: [number, number, number];
}

export default function GameParticles3D({
  gameId,
  labColor,
  position = [0, 0, 0],
}: GameParticles3DProps) {
  const particleIntensity = useUIStore((s) => s.particleIntensity);
  const multiplier = INTENSITY_MULTIPLIERS[particleIntensity] ?? 1.0;

  const config = useMemo(
    () => getGameParticleConfig(gameId, labColor),
    [gameId, labColor]
  );

  // If intensity is "off", render nothing
  if (multiplier === 0) return null;

  const adjustedCount = Math.round(config.count * multiplier);
  const adjustedSize = config.size * Math.max(0.5, multiplier);

  return (
    <group position={position}>
      <Sparkles
        count={adjustedCount}
        scale={config.scale}
        size={adjustedSize}
        speed={config.speed}
        color={config.color}
        noise={config.shape === 'orbiting' ? 2 : 1}
      />

      {/* Secondary color layer for flagships */}
      {config.secondaryColor && config.type === 'custom' && (
        <Sparkles
          count={Math.round(adjustedCount * 0.4)}
          scale={
            config.scale.map((s) => s * 0.7) as [number, number, number]
          }
          size={adjustedSize * 0.7}
          speed={config.speed * 1.3}
          color={config.secondaryColor}
        />
      )}
    </group>
  );
}

// ---- Re-export for backward compatibility ----
export { LAB_COLORS };
