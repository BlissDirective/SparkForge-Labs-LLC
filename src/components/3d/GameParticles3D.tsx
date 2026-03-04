'use client';

// ================================================================
// SparkForge GameParticles3D — Per-Game Particle System
// ================================================================
// Decision 5.3: 5 flagship custom + 23 generic lab-colored
//
// Registry of particle configs per game slug.
// GameParticleEmitter reads config and renders appropriate particles.
// Respects particle intensity slider (Decision 5.5) via uiStore.
//
// FIX APPLIED: Replaced unsafe `as Record<string, string>` cast
// with properly typed uiStore selector after store update.

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
  count: number; // Base particle count (before intensity multiplier)
  color: string; // Primary color
  secondaryColor?: string; // Optional secondary
  size: number; // Base size
  speed: number; // Animation speed
  scale: [number, number, number]; // Spread area
  shape?: 'sparkles' | 'rising' | 'orbiting' | 'falling';
  label?: string; // Description for debugging
}

// ---- Lab Colors (from v2 gamification.ts / VEC v2) ----
const LAB_COLORS: Record<number, string> = {
  1: '#3B82F6', // Code Lab - blue
  2: '#8B5CF6', // Data Lab - purple
  3: '#EC4899', // Neural Lab - pink
  4: '#F59E0B', // Create Lab - amber
  5: '#10B981', // Agent Lab - emerald
  6: '#EF4444', // Ethics Lab - red
  7: '#06B6D4', // Vision Lab - cyan
  8: '#8B5CF6', // Language Lab - purple
  9: '#10B981', // Build Lab - emerald
  10: '#F59E0B', // Frontier Lab - amber
};

// ---- Flagship Custom Configs (5 games) ----
const FLAGSHIP_CONFIGS: Record<string, GameParticleConfig> = {
  'pet-trainer': {
    type: 'custom',
    count: 30,
    color: '#F59E0B',
    secondaryColor: '#FCD34D',
    size: 4,
    speed: 0.3,
    scale: [3, 2, 3],
    shape: 'rising',
    label: 'Pet Trainer: warm rising sparkles (paw-like)',
  },
  'neural-builder': {
    type: 'custom',
    count: 50,
    color: '#EC4899',
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
    color: '#F59E0B',
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
    color: '#10B981',
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
    color: '#EF4444',
    secondaryColor: '#F87171',
    size: 3,
    speed: 0.4,
    scale: [3, 3, 3],
    shape: 'sparkles',
    label: 'Bias Detective: balanced scale sparkles',
  },
};

// ---- Get config for any game slug ----
export function getGameParticleConfig(
  slug: string,
  labId: number
): GameParticleConfig {
  // Check flagship first
  if (FLAGSHIP_CONFIGS[slug]) {
    return FLAGSHIP_CONFIGS[slug];
  }

  // Generic: lab-colored sparkles
  const labColor = LAB_COLORS[labId] || '#3B82F6';
  return {
    type: 'generic',
    count: 20,
    color: labColor,
    size: 2,
    speed: 0.4,
    scale: [3, 2, 3],
    shape: 'sparkles',
    label: `Generic: Lab ${labId} colored sparkles`,
  };
}

// ---- Reusable Particle Emitter ----
interface GameParticleEmitterProps {
  slug: string;
  labId: number;
  position?: [number, number, number];
}

export function GameParticleEmitter({
  slug,
  labId,
  position = [0, 0, 0],
}: GameParticleEmitterProps) {
  // Read intensity from store (Decision 5.5)
  const particleIntensity = useUIStore((s) => s.particleIntensity);
  const multiplier = INTENSITY_MULTIPLIERS[particleIntensity] ?? 1.0;

  const config = useMemo(
    () => getGameParticleConfig(slug, labId),
    [slug, labId]
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
