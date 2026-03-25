'use client';

// ================================================================
// CreatureBase — Shared Utilities for All 5 Creature Species
// ================================================================
// Provides toon gradient generation, mood-reactive wrapper,
// blinking eye animation, and evolution transition effects.
// All 5 species compose on top of this base.

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import {
  Color,
  DataTexture,
  Group,
  Mesh,
  NearestFilter,
  RGBAFormat,
} from 'three';
import type { PetMood, SpeciesId, MoodConfig, EvolutionStageConfig } from '@/config/creatureConfig';
import { MOOD_CONFIGS, getSpecies, getEvolutionStage } from '@/config/creatureConfig';

// ── Toon Gradient Texture Generator ──────────────────────────────

export function createToonGradient(base: string, mid: string, highlight: string): DataTexture {
  const size = 4;
  const data = new Uint8Array(size * 4);
  const colors = [
    new Color(base),
    new Color(mid),
    new Color(highlight),
    new Color(highlight),
  ];

  for (let i = 0; i < size; i++) {
    data[i * 4] = Math.floor(colors[i].r * 255);
    data[i * 4 + 1] = Math.floor(colors[i].g * 255);
    data[i * 4 + 2] = Math.floor(colors[i].b * 255);
    data[i * 4 + 3] = 255;
  }

  const texture = new DataTexture(data, size, 1, RGBAFormat);
  texture.needsUpdate = true;
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  return texture;
}

// ── Shared Props Interface ───────────────────────────────────────

export interface CreatureProps {
  speciesId: SpeciesId;
  evolutionStage: number;
  mood: PetMood;
  labColor?: string;
}

// ── useToonMaterial Hook ─────────────────────────────────────────

export function useToonSetup(speciesId: SpeciesId, evolutionStage: number, mood: PetMood) {
  const stage = Math.min(Math.max(0, evolutionStage), 5);
  const species = getSpecies(speciesId);
  const evoCfg = getEvolutionStage(speciesId, stage);
  const moodCfg = MOOD_CONFIGS[mood];

  const gradientMap = useMemo(
    () => createToonGradient(evoCfg.toon.base, evoCfg.toon.mid, evoCfg.toon.highlight),
    [evoCfg.toon.base, evoCfg.toon.mid, evoCfg.toon.highlight]
  );

  useEffect(() => () => gradientMap.dispose(), [gradientMap]);

  const emissiveColor = useMemo(() => new Color(moodCfg.emissive), [moodCfg.emissive]);
  const midColor = useMemo(() => new Color(evoCfg.toon.mid), [evoCfg.toon.mid]);

  return { species, evoCfg, moodCfg, gradientMap, emissiveColor, midColor, stage };
}

// ── Creature Wrapper (Float + Rotation + Mood) ───────────────────

export function CreatureWrapper({
  mood,
  evolutionStage,
  moodCfg,
  evoCfg,
  children,
}: {
  mood: PetMood;
  evolutionStage: number;
  moodCfg: MoodConfig;
  evoCfg: EvolutionStageConfig;
  children: React.ReactNode;
}) {
  const groupRef = useRef<Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * moodCfg.rotationSpeed;
    // Gentle idle sway
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
    groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.04;
  });

  return (
    <Float
      speed={moodCfg.floatSpeed}
      rotationIntensity={0.25}
      floatIntensity={0.4 + evolutionStage * 0.12}
    >
      <group ref={groupRef} scale={evoCfg.scale}>
        {children}
      </group>
    </Float>
  );
}

// ── Blinking Eye Component ───────────────────────────────────────

export function BlinkingEye({
  position,
  size = 0.15,
  color = '#FFFFFF',
  pupilColor = '#111111',
  pupilSize = 0.55,
}: {
  position: [number, number, number];
  size?: number;
  color?: string;
  pupilColor?: string;
  pupilSize?: number;
}) {
  const eyeRef = useRef<Group>(null);
  const blinkTimer = useRef(Math.random() * 5);

  useFrame((state, delta) => {
    if (!eyeRef.current) return;
    blinkTimer.current -= delta;

    if (blinkTimer.current <= 0) {
      // Blink: squash Y scale briefly
      const t = Math.abs(blinkTimer.current);
      if (t < 0.1) {
        eyeRef.current.scale.y = 0.1;
      } else if (t < 0.2) {
        eyeRef.current.scale.y = 1.0;
        blinkTimer.current = 3 + Math.random() * 4; // Next blink in 3-7s
      }
    } else {
      eyeRef.current.scale.y = 1.0;
    }
  });

  return (
    <group ref={eyeRef} position={position}>
      {/* Eye white */}
      <mesh>
        <sphereGeometry args={[size, 12, 12]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Pupil */}
      <mesh position={[0, 0, size * 0.7]}>
        <sphereGeometry args={[size * pupilSize, 8, 8]} />
        <meshToonMaterial color={pupilColor} />
      </mesh>
    </group>
  );
}

// ── Inner Glow Core ──────────────────────────────────────────────

export function InnerGlow({
  scale,
  moodCfg,
}: {
  scale: number;
  moodCfg: MoodConfig;
}) {
  const emissiveColor = useMemo(() => new Color(moodCfg.emissive), [moodCfg.emissive]);

  return (
    <mesh scale={scale * 0.5}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial
        color={moodCfg.emissive}
        emissive={emissiveColor}
        emissiveIntensity={moodCfg.intensity}
        transparent
        opacity={0.35}
        toneMapped={false}
      />
    </mesh>
  );
}
