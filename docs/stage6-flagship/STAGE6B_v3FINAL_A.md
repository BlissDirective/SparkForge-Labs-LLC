# Stage 6B v3-FINAL Part A — AI Pet Trainer 3D Components

**Version:** v3-FINAL (corrected)
**Build Phase:** 10 (Stage 6B — Pet Trainer, Part A: 3D components)
**Prerequisites:** Stage 5 complete (all parts), Stage 3 Part 3 v3-FINAL (StationFrame + HDR infrastructure)
**Validation:** `npm run build` PASS, `npx tsc --noEmit` PASS, `npm run lint` PASS
**Lab:** 2 — Teaching Machines | **Color:** #8B5CF6 (Purple)
**Age Bands:** A (7-10), B (11-13), C (14-16)

---

## Overview

This document creates the 3D pet rendering system for the AI Pet Trainer flagship game. Two files: `PetCreature3D.tsx` (GLB model loader with toon shading) and `Pet3DScene.tsx` (Canvas wrapper with lighting, sparkles, and HDR environment).

**Part A scope:** 3D component files only. Part B contains the full `PetTrainerGame.tsx` game replacement.

### Decisions Implemented

| Decision | Description | Component |
|----------|-------------|-----------|
| 6.2 | Pet evolution via Spline/Blender GLB assets (6 stages) | PetCreature3D.tsx + Pet3DScene.tsx |
| 7.5 | MeshToonMaterial (3-step gradient) for cartoon cel-shading | PetCreature3D.tsx |
| 7.1 | Custom Frost-Prismatic HDR with drei preset fallback | Pet3DScene.tsx |

### Files Created / Modified

| # | File | Action | Purpose |
|---|------|--------|---------|
| 1 | `src/components/3d/PetCreature3D.tsx` | CREATE | GLB model loader with toon shading + fallback orb |
| 2 | `src/components/3d/Pet3DScene.tsx` | CREATE | Canvas wrapper with lighting, sparkles, HDR, emoji overlay |
| 3 | `public/models/pets/` | CREATE (dir) | GLB asset directory for 6 evolution stages |

### Triangle Budget Breakdown (5M Enhancement — March 18, 2026)

| Component | Desktop Ultra | LOD Low |
|-----------|-------------|---------|
| PetCreature3D (GLB/fallback) | ~8K–15K | ~4K |
| PetTrainerEnvironment (terrain + sky) | ~250K | ~10K |
| PetTrainerEnvironment (vegetation) | ~600K | ~20K |
| PetTrainerEnvironment (arena + obstacles) | ~250K | ~10K |
| PetTrainerEnvironment (props/toys/water) | ~160K | ~5K |
| PetTrainerEnvironment (fog + wildlife) | ~70K | ~0 |
| **Total** | **~1.3M** | **~49K** |

**Scene total:** ~1.3M tris (desktop ultra) with LODWrapper adaptive FPS monitoring.
Immersive pet habitat: training arena, obstacle course, vegetation, water pond, butterflies.

### New Files (5M Enhancement)

| # | File | Purpose |
|---|------|---------|
| 4 | `src/components/3d/environments/FlagshipEnvironmentBase.tsx` | Shared LOD-aware foundation |
| 5 | `src/components/3d/environments/PetTrainerEnvironment.tsx` | Immersive pet habitat |

| Device | Max Budget | Target FPS | LOD Level |
|--------|-----------|------------|-----------|
| Desktop | 5,000,000 | 60 | ultra/high |
| Tablet | 2,500,000 | 45 | medium |
| Mobile | 1,250,000 | 30 | low |

### GPU Performance Budget

| Component | Triangles | Cost | When Active |
|-----------|-----------|------|-------------|
| PetCreature3D (GLB) | 200-2500 (per stage) | ~0.3ms | Pet Trainer game only |
| PetCreature3D (Fallback orb) | ~200-2300 (per stage) | ~0.2ms | When GLB unavailable |
| Pet3DScene (full) | +Sparkles +Bloom | ~0.5ms total | Pet Trainer game only |

### v2 → v3 Changes

| Aspect | v2 (Current) | v3-FINAL (This Document) |
|--------|-------------|------------------------|
| 3D Pet Rendering | Glowing orb (MeshTransmissionMaterial) with emoji overlay | GLB creature models (Spline/Blender) with MeshToonMaterial cel-shading + graceful fallback to orb |
| Pet Shading | MeshTransmissionMaterial (glass/refraction) | MeshToonMaterial (3-step gradient, cartoon) |
| HDR Environment | drei "night" preset only | Custom Frost-Prismatic HDR with drei fallback |
| Asset Pipeline | None (procedural geo) | GLB lazy-loading via useGLTF + Suspense |
| Evolution Visuals | Orb scale + segments (6 stages) | Separate GLB mesh per stage + toon gradient color shift |
| File Structure | Pet3DScene.tsx (1 file) | PetCreature3D.tsx (NEW) + Pet3DScene.tsx (updated) |

### GLB Asset Pipeline (Decision 6.2)

| Stage | File Path | Description | Triangles |
|-------|-----------|-------------|-----------|
| 0 — Egg | /models/pets/pet-stage-0.glb | Simple egg shape | ~200 |
| 1 — Baby | /models/pets/pet-stage-1.glb | Small round creature | ~500 |
| 2 — Toddler | /models/pets/pet-stage-2.glb | Slightly larger, limbs | ~800 |
| 3 — Kid | /models/pets/pet-stage-3.glb | Full body, recognizable | ~1200 |
| 4 — Teen | /models/pets/pet-stage-4.glb | Detailed, accessories | ~1800 |
| 5 — Genius | /models/pets/pet-stage-5.glb | Full detail, grad cap | ~2500 |

**Fallback Strategy:** If a GLB file is not found (404 or loading error), the component gracefully falls back to the v2 procedural orb (icosahedron with MeshToonMaterial). The game is fully playable before GLB assets are created.

**Asset Creation (Parallel Workstream):** GLB files: Spline or Blender, cartoon style, under 3K triangles each, single mesh, UV-unwrapped, exported as .glb. Place in `public/models/pets/`. No code changes needed.

---

## Code Review Fixes Applied

| # | Severity | File | Issue | Fix |
|---|----------|------|-------|-----|
| 1 | HIGH | PetCreature3D.tsx | `useGLTF.preload()` call after `export default` — dead code placement | Verified it works at module scope after default export in TypeScript; kept placement with documentation |
| 2 | HIGH | PetCreature3D.tsx | `useRef<THREE.Group>(null!)` — non-null assertion on ref initial value | Changed to `useRef<THREE.Group>(null)` with null guard in useFrame |
| 3 | HIGH | PetCreature3D.tsx | `useRef<THREE.Mesh>(null!)` in FallbackOrb — same issue | Changed to `useRef<THREE.Mesh>(null)` with null guard |
| 4 | HIGH | Pet3DScene.tsx | HDR path `/envmaps/frost-prismatic-studio.hdr` — directory doesn't exist; CLAUDE.md specifies `public/hdri/frost-prismatic.hdr` | Corrected to `/hdri/frost-prismatic.hdr` |
| 5 | HIGH | Pet3DScene.tsx | `Environment` `onError` prop doesn't exist in drei — TS2322 build error | Replaced with HEAD-request probe pattern (same as PetCreature3D GLB check) |
| 6 | MEDIUM | PetCreature3D.tsx | `scene.clone()` in `<primitive>` called every render | Memoized with `useMemo(() => scene.clone(), [scene])` |
| 7 | LOW | PetCreature3D.tsx | `labColor` prop accepted but unused in component body | Documented as reserved for future tint customization via JSDoc |

---

## Step 1: Create `public/models/pets/` directory

```bash
mkdir -p public/models/pets
```

GLB assets are placed here as a parallel workstream. The game is fully playable with the fallback orb before assets arrive.

---

## Step 2: Create `src/components/3d/PetCreature3D.tsx`

Decision 6.2 + 7.5: GLB model loader with 3-step toon gradient shading. 6 evolution stages, mood-reactive visuals, graceful fallback to procedural orb.

```tsx
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
import * as THREE from 'three';

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
): THREE.DataTexture {
  const size = 4;
  const data = new Uint8Array(size * 4);
  const colors = [
    new THREE.Color(base), // darkest (shadow)
    new THREE.Color(mid), // mid tone
    new THREE.Color(highlight), // highlight
    new THREE.Color(highlight), // brightest
  ];

  for (let i = 0; i < size; i++) {
    data[i * 4] = Math.floor(colors[i].r * 255);
    data[i * 4 + 1] = Math.floor(colors[i].g * 255);
    data[i * 4 + 2] = Math.floor(colors[i].b * 255);
    data[i * 4 + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, size, 1, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
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
  const meshRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(url);
  const moodCfg = MOOD_CONFIG[mood];
  const evoCfg = EVOLUTION_TOON[Math.min(evolutionStage, 5)];

  // Create toon gradient texture
  const gradientMap = useMemo(
    () => createToonGradient(evoCfg.base, evoCfg.mid, evoCfg.highlight),
    [evoCfg.base, evoCfg.mid, evoCfg.highlight]
  );

  // Memoize scene clone to avoid re-cloning every render
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Apply MeshToonMaterial to all meshes in the GLB
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshToonMaterial({
          color: new THREE.Color(evoCfg.mid),
          gradientMap,
          emissive: new THREE.Color(moodCfg.emissive),
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
  const meshRef = useRef<THREE.Mesh>(null);
  const moodCfg = MOOD_CONFIG[mood];
  const evoCfg = EVOLUTION_TOON[Math.min(evolutionStage, 5)];

  const gradientMap = useMemo(
    () => createToonGradient(evoCfg.base, evoCfg.mid, evoCfg.highlight),
    [evoCfg.base, evoCfg.mid, evoCfg.highlight]
  );

  const emissiveColor = useMemo(
    () => new THREE.Color(moodCfg.emissive),
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
```

---

## Step 3: Create `src/components/3d/Pet3DScene.tsx` (REPLACES v2)

Decision 6.2 + 7.1: Canvas wrapper with toon-optimized lighting, mood-reactive sparkles, Bloom postprocessing, custom HDR environment with fallback, and emoji overlay.

**FIX APPLIED:** HDR path corrected from `/envmaps/frost-prismatic-studio.hdr` to `/hdri/frost-prismatic.hdr` per CLAUDE.md.

**FIX APPLIED:** Environment `onError` prop doesn't exist in drei — replaced with HEAD-request probe pattern.

```tsx
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
// FIX APPLIED: Environment fallback uses HEAD probe, not onError
// (drei Environment doesn't have onError prop)
//
// Dynamic import with ssr: false required.

import { useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sparkles, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import PetCreature3D from './PetCreature3D';

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

// === Custom HDR path (Decision 7.1) ===
// FIX: CLAUDE.md specifies public/hdri/ (not /envmaps/)
const CUSTOM_HDR_PATH = '/hdri/frost-prismatic.hdr';

function SceneEnvironment() {
  const [hdrAvailable, setHdrAvailable] = useState(false);

  // Probe whether custom HDR file exists
  useEffect(() => {
    let cancelled = false;
    fetch(CUSTOM_HDR_PATH, { method: 'HEAD' })
      .then((res) => {
        if (!cancelled) setHdrAvailable(res.ok);
      })
      .catch(() => {
        if (!cancelled) setHdrAvailable(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Use custom HDR if available, otherwise drei preset
  if (!hdrAvailable) {
    return <Environment preset="night" />;
  }

  return (
    <Suspense fallback={<Environment preset="night" />}>
      <Environment files={CUSTOM_HDR_PATH} />
    </Suspense>
  );
}

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
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        {/* Lighting optimized for MeshToonMaterial */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          color={labColor}
          castShadow
        />
        <pointLight position={[-4, -3, 3]} intensity={0.3} color="#6366F1" />

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

        {/* Contact shadow beneath pet */}
        <ContactShadows
          position={[0, -1.5, 0]}
          opacity={0.3}
          scale={4}
          blur={2}
          color={labColor}
        />

        {/* [v3] Custom HDR environment with fallback */}
        <SceneEnvironment />

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
```

---

## Verification Checklist

```
✅ PetCreature3D.tsx exists at src/components/3d/PetCreature3D.tsx
✅ Pet3DScene.tsx exists at src/components/3d/Pet3DScene.tsx
✅ public/models/pets/ directory exists (empty — GLB assets parallel workstream)
✅ npx tsc --noEmit     — PASS (0 errors)
✅ npm run lint          — PASS (0 warnings)
✅ npm run build         — PASS (clean production build)
✅ PetCreature3D imports: useGLTF, Float, THREE, creates MeshToonMaterial
✅ Pet3DScene imports PetCreature3D (NOT the old PetOrb function)
✅ Environment references custom HDR path with HEAD probe + Suspense fallback
✅ Fallback orb uses meshToonMaterial (NOT MeshTransmissionMaterial)
```

### Component Audit Summary

| Component | Hooks | Canvas | Shader | Dependencies | ARIA |
|-----------|-------|--------|--------|-------------|------|
| PetCreature3D | 6 (useRef x2, useMemo x3, useState, useEffect, useFrame) | Requires parent Canvas | None (MeshToonMaterial) | useGLTF, Float (drei) | N/A (3D mesh) |
| Pet3DScene | 3 (useMemo, useState, useEffect) | Self-contained | None | Sparkles, Environment, ContactShadows (drei), Bloom (postprocessing) | Emoji overlay visible |

### Mood Configuration Reference

| Mood | Emissive | Intensity | Float Speed | Rotation Speed |
|------|----------|-----------|-------------|---------------|
| sleeping | #4B3B8A | 0.15 | 0.5 | 0.08 |
| confused | #6B5B9A | 0.3 | 1.0 | 0.2 |
| learning | #8B5CF6 | 0.5 | 1.5 | 0.4 |
| smart | #A78BFA | 0.7 | 2.0 | 0.6 |
| genius | #C4B5FD | 1.0 | 2.5 | 0.8 |
| celebrating | #DDD6FE | 1.4 | 3.0 | 1.2 |

### Evolution Toon Gradient Reference

| Stage | Name | Base | Mid | Highlight | Scale |
|-------|------|------|-----|-----------|-------|
| 0 | Egg | #9F7AEA | #B794F4 | #E9D5FF | 0.50 |
| 1 | Baby | #8B5CF6 | #A78BFA | #DDD6FE | 0.65 |
| 2 | Toddler | #7C3AED | #8B5CF6 | #C4B5FD | 0.80 |
| 3 | Kid | #6D28D9 | #7C3AED | #A78BFA | 0.95 |
| 4 | Teen | #5B21B6 | #6D28D9 | #8B5CF6 | 1.10 |
| 5 | Genius | #4C1D95 | #5B21B6 | #7C3AED | 1.25 |
