'use client';

// ================================================================
// PET 3D SCENE v3 — Wrapper for GLB Pet Creature
// ================================================================
// REPLACES: v2 Pet3DScene.tsx (procedural orb version)
// Decision 6.2: Uses PetCreature3D (GLB loader with fallback)
// Decision 7.1: Custom HDR with drei preset fallback
// Decision 7.5: Toon shading (delegated to PetCreature3D)
//
// This component wraps the 3D creature in a Canvas with:
// - Proper lighting for toon materials
// - Sparkle effects based on mood
// - Bloom postprocessing
// - Custom HDR environment (falls back to drei preset)
// - Emoji overlay (preserved from v2)
//
// FIX APPLIED: HDR path corrected from /envmaps/ to /hdri/
// (CLAUDE.md specifies public/hdri/frost-prismatic.hdr)
// FIX APPLIED: Environment fallback uses error state check, not
// Suspense-only (drei Environment throws on missing files)
//
// Dynamic import with ssr: false required.

import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import PetCreature3D from './PetCreature3D';
import PetTrainerEnvironment from './environments/PetTrainerEnvironment';
import { LODWrapper } from './LODWrapper';

// === Types ===

interface PetSceneProps {
  emoji: string;
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

// === Exported Scene Component ===

export default function Pet3DScene({
  emoji,
  mood = 'learning',
  evolutionStage = 0,
  labColor = '#8B5CF6',
  size = 'md',
  showSparkles = true,
}: PetSceneProps) {
  const sparkleCount = SPARKLE_COUNTS[mood];
  const sizeMap = { sm: 'h-32 w-32', md: 'h-48 w-48', lg: 'h-64 w-64' };

  // Bloom intensity scales with evolution
  const bloomIntensity = useMemo(
    () => 0.4 + evolutionStage * 0.12,
    [evolutionStage]
  );

  return (
    <div className={`relative ${sizeMap[size]}`}>
      <Canvas
        camera={{ position: [0, 1, 8], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        shadows
        style={{ background: 'transparent' }}
      >
        <LODWrapper tier="flagship" adaptive>
          {/* [5M] Immersive Pet Habitat Environment */}
          <PetTrainerEnvironment
            evolutionStage={evolutionStage}
            mood={mood}
          />

          {/* [v3] PetCreature3D replaces procedural orb */}
          <PetCreature3D
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
        </LODWrapper>

        {/* Bloom postprocessing */}
        <EffectComposer>
          <Bloom
            intensity={bloomIntensity}
            luminanceThreshold={0.5}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      {/* Emoji overlay centered on the 3D creature */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <span
          className="drop-shadow-lg"
          style={{
            fontSize:
              size === 'sm' ? '2rem' : size === 'md' ? '3rem' : '4rem',
          }}
        >
          {emoji}
        </span>
      </div>
    </div>
  );
}
