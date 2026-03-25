'use client';

// ================================================================
// PET CREATURE 3D — GLB Model Loader with Toon Shading
// ================================================================
// Decision 6.2: Spline/Blender GLB assets for 6 evolution stages
// Decision 7.5: MeshToonMaterial (3-step gradient)
//
// Architecture:
// - Attempts to load GLB from /models/pets/pet-stage-{N}.glb
// - On success: renders GLB mesh with MeshToonMaterial
// - On failure: graceful fallback to procedural toon-shaded orb
// - Mood affects emissive color + float speed
// - Evolution stage selects which GLB to load
//
// FIX APPLIED: useGLTF.preload() moved to file end (was after export default)
// FIX APPLIED: useRef null assertions removed (null! → null with guards)
// FIX APPLIED: scene.clone() memoized to prevent re-cloning per render
// FIX APPLIED: Unused labColor prop documented as reserved for future use
//
// Dynamic import with ssr: false required.

import { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, useGLTF } from '@react-three/drei';
import {
  Color,
  DataTexture,
  Group,
  Mesh,
  MeshToonMaterial,
  NearestFilter,
  RGBAFormat,
} from 'three';

// === Types ===

export interface PetCreatureProps {
  evolutionStage: number; // 0-5
  mood:
    | 'sleeping'
    | 'confused'
    | 'learning'
    | 'smart'
    | 'genius'
    | 'celebrating';
  /** Lab color — reserved for future tint customization */
  labColor?: string;
}

// === Mood → Visual mapping ===
// Integration: mood drives emissive color (glow tint), intensity (brightness),
// floatSpeed (hover animation), and rotationSpeed (idle spin). These values
// are applied to MeshToonMaterial.emissive and MeshToonMaterial.emissiveIntensity
// in both the GLB model path and the fallback orb, ensuring consistent mood
// feedback regardless of whether the GLB asset is available.

const MOOD_CONFIG = {
  sleeping: {
    emissive: '#4B3B8A',
    intensity: 0.15,
    floatSpeed: 0.5,
    rotationSpeed: 0.08,
  },
  confused: {
    emissive: '#6B5B9A',
    intensity: 0.3,
    floatSpeed: 1.0,
    rotationSpeed: 0.2,
  },
  learning: {
    emissive: '#8B5CF6',
    intensity: 0.5,
    floatSpeed: 1.5,
    rotationSpeed: 0.4,
  },
  smart: {
    emissive: '#A78BFA',
    intensity: 0.7,
    floatSpeed: 2.0,
    rotationSpeed: 0.6,
  },
  genius: {
    emissive: '#C4B5FD',
    intensity: 1.0,
    floatSpeed: 2.5,
    rotationSpeed: 0.8,
  },
  celebrating: {
    emissive: '#DDD6FE',
    intensity: 1.4,
    floatSpeed: 3.0,
    rotationSpeed: 1.2,
  },
};

// === Evolution → Toon gradient colors (3-step) ===
// Decision 7.5: 3-step toon gradient per evolution stage

const EVOLUTION_TOON = [
  { base: '#9F7AEA', mid: '#B794F4', highlight: '#E9D5FF', scale: 0.5 }, // 0: Egg
  { base: '#8B5CF6', mid: '#A78BFA', highlight: '#DDD6FE', scale: 0.65 }, // 1: Baby
  { base: '#7C3AED', mid: '#8B5CF6', highlight: '#C4B5FD', scale: 0.8 }, // 2: Toddler
  { base: '#6D28D9', mid: '#7C3AED', highlight: '#A78BFA', scale: 0.95 }, // 3: Kid
  { base: '#5B21B6', mid: '#6D28D9', highlight: '#8B5CF6', scale: 1.1 }, // 4: Teen
  { base: '#4C1D95', mid: '#5B21B6', highlight: '#7C3AED', scale: 1.25 }, // 5: Genius
];

// === Toon gradient texture generator ===

function createToonGradient(
  base: string,
  mid: string,
  highlight: string
): DataTexture {
  const size = 4;
  const data = new Uint8Array(size * 4);
  const colors = [
    new Color(base), // darkest (shadow)
    new Color(mid), // mid tone
    new Color(highlight), // highlight
    new Color(highlight), // brightest
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

// === GLB Model Component (loaded state) ===

function GLBPetModel({
  url,
  mood,
  evolutionStage,
}: {
  url: string;
  mood: PetCreatureProps['mood'];
  evolutionStage: number;
}) {
  const meshRef = useRef<Group>(null);
  const { scene } = useGLTF(url);
  const moodCfg = MOOD_CONFIG[mood];
  const evoCfg = EVOLUTION_TOON[Math.min(evolutionStage, 5)];

  // Create toon gradient texture
  const gradientMap = useMemo(
    () => createToonGradient(evoCfg.base, evoCfg.mid, evoCfg.highlight),
    [evoCfg.base, evoCfg.mid, evoCfg.highlight]
  );

  // Dispose DataTexture on unmount to prevent GPU memory leak
  useEffect(() => () => gradientMap.dispose(), [gradientMap]);

  // Memoize scene clone to avoid re-cloning every render
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Apply MeshToonMaterial to all meshes in the GLB
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        mesh.material = new MeshToonMaterial({
          color: new Color(evoCfg.mid),
          gradientMap,
          emissive: new Color(moodCfg.emissive),
          emissiveIntensity: moodCfg.intensity * 0.3,
        });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [clonedScene, evoCfg, moodCfg, gradientMap]);

  // Idle rotation
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * moodCfg.rotationSpeed;
    meshRef.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
  });

  return (
    <Float
      speed={moodCfg.floatSpeed}
      rotationIntensity={0.25}
      floatIntensity={0.4 + evolutionStage * 0.12}
    >
      <group ref={meshRef} scale={evoCfg.scale}>
        <primitive object={clonedScene} />
      </group>
    </Float>
  );
}

// === Fallback Orb (procedural toon-shaded geometry) ===
// Used when GLB is not yet available or fails to load

function FallbackOrb({
  mood,
  evolutionStage,
}: {
  mood: PetCreatureProps['mood'];
  evolutionStage: number;
}) {
  const meshRef = useRef<Mesh>(null);
  const moodCfg = MOOD_CONFIG[mood];
  const evoCfg = EVOLUTION_TOON[Math.min(evolutionStage, 5)];

  const gradientMap = useMemo(
    () => createToonGradient(evoCfg.base, evoCfg.mid, evoCfg.highlight),
    [evoCfg.base, evoCfg.mid, evoCfg.highlight]
  );

  // Dispose DataTexture on unmount to prevent GPU memory leak
  useEffect(() => () => gradientMap.dispose(), [gradientMap]);

  const emissiveColor = useMemo(
    () => new Color(moodCfg.emissive),
    [moodCfg.emissive]
  );

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * moodCfg.rotationSpeed;
    meshRef.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
  });

  // Segment count increases with evolution (visual polish progression)
  const segments = [8, 12, 16, 24, 32, 48][Math.min(evolutionStage, 5)];

  return (
    <Float
      speed={moodCfg.floatSpeed}
      rotationIntensity={0.3}
      floatIntensity={0.5 + evolutionStage * 0.15}
    >
      {/* Main toon-shaded orb */}
      <mesh ref={meshRef} scale={evoCfg.scale}>
        <icosahedronGeometry args={[1, segments]} />
        <meshToonMaterial
          color={evoCfg.mid}
          gradientMap={gradientMap}
          emissive={emissiveColor}
          emissiveIntensity={moodCfg.intensity * 0.3}
        />
      </mesh>

      {/* Inner glow core */}
      <mesh scale={evoCfg.scale * 0.6}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color={moodCfg.emissive}
          emissive={emissiveColor}
          emissiveIntensity={moodCfg.intensity}
          transparent
          opacity={0.5}
          toneMapped={false}
        />
      </mesh>
    </Float>
  );
}

// === Main Exported Component ===
// Tries GLB first, falls back to orb

export default function PetCreature3D({
  evolutionStage = 0,
  mood = 'learning',
}: PetCreatureProps) {
  const [glbAvailable, setGlbAvailable] = useState<boolean | null>(null);
  const stage = Math.min(evolutionStage, 5);
  const glbUrl = `/models/pets/pet-stage-${stage}.glb`;

  // Probe whether the GLB file exists
  useEffect(() => {
    let cancelled = false;
    fetch(glbUrl, { method: 'HEAD' })
      .then((res) => {
        if (!cancelled) setGlbAvailable(res.ok);
      })
      .catch(() => {
        if (!cancelled) setGlbAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, [glbUrl]);

  // While probing or if GLB not available, show fallback
  if (glbAvailable === null || glbAvailable === false) {
    return (
      <FallbackOrb mood={mood} evolutionStage={evolutionStage} />
    );
  }

  // GLB is available — load it with Suspense
  return (
    <Suspense
      fallback={
        <FallbackOrb mood={mood} evolutionStage={evolutionStage} />
      }
    >
      <GLBPetModel
        url={glbUrl}
        mood={mood}
        evolutionStage={evolutionStage}
      />
    </Suspense>
  );
}

// Preload hint for first stage (egg is shown on welcome screen)
useGLTF.preload('/models/pets/pet-stage-0.glb');
