'use client';

// ================================================================
// PET 3D SCENE v3 — Group for GLB Pet Creature (D3D-B1 compliant)
// ================================================================
// S6-CRIT-002: Refactored from standalone Canvas to <group> that
// renders inside CockpitCanvas via sceneStore.setGameSceneContent.
// Canvas, camera, dpr, gl config, and postprocessing removed —
// CockpitCanvas provides all of these.
//
// Decision 6.2: Uses PetCreature3D (GLB loader with fallback)
// Decision 7.1: Custom HDR with drei preset fallback
// Decision 7.5: Toon shading (delegated to PetCreature3D)
//
// Dynamic import with ssr: false required.

import { useMemo } from 'react';
import { Sparkles } from '@react-three/drei';
import PetCreature3D from './PetCreature3D';
import PetTrainerEnvironment from './environments/PetTrainerEnvironment';

// === Types ===

export interface PetSceneProps {
  emoji: string;
  speciesId?: 'byteling' | 'sparkpaw' | 'voltkit' | 'cogsworth' | 'pixie';
  mood:
    | 'sleeping'
    | 'confused'
    | 'learning'
    | 'smart'
    | 'genius'
    | 'celebrating';
  evolutionStage: number; // 0-5
  labColor?: string;
  size?: 'sm' | 'md' | 'lg';
  showSparkles?: boolean;
}

// === Mood → sparkle count ===

const SPARKLE_COUNTS: Record<PetSceneProps['mood'], number> = {
  sleeping: 0,
  confused: 10,
  learning: 30,
  smart: 50,
  genius: 80,
  celebrating: 120,
};

// === Exported Scene Group (D3D-B1: renders inside CockpitCanvas) ===

export default function Pet3DScene({
  speciesId = 'byteling',
  mood = 'learning',
  evolutionStage = 0,
  labColor = '#8B5CF6',
  showSparkles = true,
}: PetSceneProps) {
  const sparkleCount = SPARKLE_COUNTS[mood];

  return (
    <group>
      {/* [5M] Immersive Pet Habitat Environment */}
      <PetTrainerEnvironment
        evolutionStage={evolutionStage}
        mood={mood}
      />

      {/* [v3] PetCreature3D renders procedural species */}
      <PetCreature3D
        speciesId={speciesId}
        mood={mood}
        evolutionStage={evolutionStage}
        labColor={labColor}
      />

      {/* Sparkles (mood-reactive, preserved from v2) */}
      {showSparkles && sparkleCount > 0 && (
        <Sparkles
          count={sparkleCount}
          scale={3}
          size={2}
          speed={0.4}
          color={labColor}
        />
      )}
    </group>
  );
}
