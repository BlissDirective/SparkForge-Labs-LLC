# Stage 5 Parts 2-3C v3-FINAL — Celebrations, Particles & Controls

**Version:** v3-FINAL (corrected)
**Build Phase:** 9C (Part C of Parts 2-3)
**Prerequisites:** Stage 5 Part 1 complete, Stage 5 Parts 2-3A (reward shaders), Stage 5 Parts 2-3B (reward components)
**Validation:** `npm run build` PASS, `npx tsc --noEmit` PASS, `npm run lint` PASS

---

## Overview

This document ADDS 4 new components (3 R3F + 1 UI) and MODIFIES `uiStore.ts` to support the particle intensity preference. These are the **celebration and particle control** components that complete the v3 Stage 5 gamification visual layer.

**Document scope:** NEW components + uiStore modification. All prior Stage 5 files remain untouched. This is Part C (final) of the v3-FINAL Stage 5 enhancement — celebrations, game particles, and child preference controls.

### Decisions Implemented

| Decision | Description | Component |
|----------|-------------|-----------|
| 5.3 | 5 flagship custom + 23 generic particle configs | GameParticles3D.tsx |
| 5.5 | Particle intensity slider Low/Med/High/Off | ParticleIntensitySlider.tsx + uiStore |
| — | R3F particle burst replacing CSS confetti | LevelUpExplosion.tsx |
| — | Diamond-tier shader fire (100+ day) | StreakFlame3D.tsx |

### Files Created / Modified

| # | File | Action | Purpose |
|---|------|--------|---------|
| 1 | `src/components/3d/LevelUpExplosion.tsx` | CREATE | 200-particle R3F burst + Bloom for level-up |
| 2 | `src/components/3d/StreakFlame3D.tsx` | CREATE | Diamond tier (100+ day) fireNoise shader flame |
| 3 | `src/components/3d/GameParticles3D.tsx` | CREATE | Per-game particle config registry + emitter |
| 4 | `src/components/ui/ParticleIntensitySlider.tsx` | CREATE | Child preference control with 4 levels |
| 5 | `src/stores/uiStore.ts` | MODIFY | Added `particleIntensity` state + `setParticleIntensity` action |

### GPU Performance Budget

| Component | Cost | When Active | Duration |
|-----------|------|-------------|----------|
| LevelUpExplosion | ~0.3ms | Level-up event | 2.0s (auto-unmounts) |
| StreakFlame3D | ~0.2ms | Profile page, 100+ day | Persistent while visible |
| GameParticles3D | ~0.1ms/game | Game play screen | While game is active |
| ParticleIntensitySlider | 0ms (CSS only) | Settings section | N/A |

### v2 / v3 Relationship

| v2 Component (CSS/Framer) | v3 Upgrade (R3F/Shader) | Scope |
|---------------------------|------------------------|-------|
| LevelUpCeremony CSS confetti | LevelUpExplosion R3F burst | Desktop only |
| StreakFlame.tsx tiers 1-6 | StreakFlame3D.tsx tier 7 only | Diamond (100+ day) only |
| No equivalent | GameParticles3D config registry | All 28 games |
| No equivalent | ParticleIntensitySlider | All particle systems |

---

## Code Review Fixes Applied

| # | Severity | File | Issue | Fix |
|---|----------|------|-------|-----|
| 1 | CRITICAL | StreakFlame3D.tsx | JSX `>` closes `<div` tag before `className`, `style`, and `aria-label` attributes — PDF corruption split the opening tag, making attributes appear as text content | Restructured JSX: all attributes placed inside the `<div ... >` tag correctly |
| 2 | CRITICAL | ParticleIntensitySlider.tsx | Raw TypeScript code leaked outside component function at bottom of file — `particleIntensity: 'off' \| 'low' \| 'medium' \| 'high';` was executable code, not a comment (uiStore instructions weren't properly commented) | Removed leaked code entirely; uiStore instructions applied as actual store modifications |
| 3 | HIGH | uiStore.ts | Missing `particleIntensity` state and `setParticleIntensity` action — both GameParticles3D and ParticleIntensitySlider depend on this store property | Added `particleIntensity: 'off' \| 'low' \| 'medium' \| 'high'` to UIState interface, default `'medium'`, with setter action |
| 4 | HIGH | GameParticles3D.tsx + ParticleIntensitySlider.tsx | Unsafe `as Record<string, string>` casts to access `particleIntensity` from store (workaround for missing store property) | Replaced with properly typed `s.particleIntensity` selectors after store update |
| 5 | MEDIUM | LevelUpExplosion.tsx | `tierColor` and `onComplete` props on same line with misplaced description comment | Reformatted interface with JSDoc comment above `tierColor` |
| 6 | MEDIUM | LevelUpExplosion.tsx + StreakFlame3D.tsx | Named exports only — consumers need `.then(m => m.Name)` pattern for dynamic import with `ssr: false` | Added `export default` alias for both components; documented import pattern in header comments |

---

## Step 1: Modify `src/stores/uiStore.ts`

**Action:** APPEND `particleIntensity` state and `setParticleIntensity` action.

Add to the `UIState` interface:
```typescript
particleIntensity: 'off' | 'low' | 'medium' | 'high';
```

Add to the actions:
```typescript
setParticleIntensity: (level: 'off' | 'low' | 'medium' | 'high') => void;
```

Add to the store implementation:
```typescript
particleIntensity: 'medium',
setParticleIntensity: (particleIntensity) => set({ particleIntensity }),
```

**Full updated file:**

```typescript
import { create } from 'zustand';
import type { CelebrationType } from '@/types';

interface UIState {
  sidebarOpen: boolean;
  showCelebration: boolean;
  celebrationType: CelebrationType | null;
  celebrationData: Record<string, unknown> | null;
  labColor: string;
  labTint: string;
  soundEnabled: boolean;
  dailyChallengeCompleted: boolean;
  particleIntensity: 'off' | 'low' | 'medium' | 'high';
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  triggerCelebration: (type: CelebrationType, data?: Record<string, unknown>) => void;
  dismissCelebration: () => void;
  setLabColor: (color: string, tint?: string) => void;
  toggleSound: () => void;
  markDailyChallengeComplete: () => void;
  resetDailyChallenge: () => void;
  setParticleIntensity: (level: 'off' | 'low' | 'medium' | 'high') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  showCelebration: false,
  celebrationType: null,
  celebrationData: null,
  labColor: '#00BBFF',
  labTint: '#00BBFF',
  soundEnabled: true,
  dailyChallengeCompleted: false,
  particleIntensity: 'medium',
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  triggerCelebration: (type, data = {}) => set({ showCelebration: true, celebrationType: type, celebrationData: data }),
  dismissCelebration: () => set({ showCelebration: false, celebrationType: null, celebrationData: null }),
  setLabColor: (labColor, labTint) => {
    set({ labColor, labTint: labTint || labColor });
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--lab-color', labColor);
      document.documentElement.style.setProperty('--lab-glow', labColor + '40');
    }
  },
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  markDailyChallengeComplete: () => set({ dailyChallengeCompleted: true }),
  resetDailyChallenge: () => set({ dailyChallengeCompleted: false }),
  setParticleIntensity: (particleIntensity) => set({ particleIntensity }),
}));
```

---

## Step 2: Create `src/components/3d/LevelUpExplosion.tsx`

Replaces v2 CSS confetti with R3F particle burst + Bloom. 200 instanced cube particles explode outward in the tier color, then fade over 2.0s. Self-contained Canvas overlay — auto-unmounts after completion.

```tsx
'use client';

// ================================================================
// SparkForge LevelUpExplosion — R3F Particle Burst
// ================================================================
// Replaces v2 CSS confetti with R3F particle burst + Bloom.
// Triggered on level-up. 200 particles, 2.0s duration.
// Auto-unmounts after completion. Mobile uses v2 CSS fallback.
//
// Self-contained Canvas overlay — no parent Canvas needed.
// Dynamic import: dynamic(() => import(...).then(m => m.LevelUpExplosion), { ssr: false })

import { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

const PARTICLE_COUNT = 200;
const DURATION = 2.0;

interface ParticleData {
  velocity: THREE.Vector3;
  size: number;
  rotSpeed: number;
  gravity: number;
}

function generateExplosion(): ParticleData[] {
  const data: ParticleData[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Deterministic "random" from index (avoids Math.random in hot path)
    const seed1 = Math.sin(i * 1.37) * 0.5 + 0.5;
    const seed2 = Math.sin(i * 2.71) * 0.5 + 0.5;
    const seed3 = Math.sin(i * 3.97) * 0.5 + 0.5;
    const seed4 = Math.sin(i * 5.13) * 0.5 + 0.5;

    const theta = seed1 * Math.PI * 2;
    const phi = Math.acos(2 * seed2 - 1);
    const speed = 2 + seed3 * 4;

    data.push({
      velocity: new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed + 2, // Bias upward
        Math.cos(phi) * speed * 0.5
      ),
      size: 0.02 + seed4 * 0.04,
      rotSpeed: (seed1 - 0.5) * 10,
      gravity: 3 + seed2 * 2,
    });
  }
  return data;
}

function ExplosionScene({
  color,
  onComplete,
}: {
  color: string;
  onComplete: () => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const startTime = useRef(0);
  const completedRef = useRef(false);
  const particles = useMemo(() => generateExplosion(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const threeColor = useMemo(() => new THREE.Color(color), [color]);

  // Set instance colors with slight per-particle variation
  useEffect(() => {
    if (!meshRef.current) return;
    const c = new THREE.Color();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      c.copy(threeColor);
      const seed = Math.sin(i * 7.19) * 0.5 + 0.5;
      c.offsetHSL(
        (seed - 0.5) * 0.1,
        (Math.sin(i * 3.37) * 0.5) * 0.2,
        (Math.sin(i * 4.91) * 0.5) * 0.1
      );
      meshRef.current.setColorAt(i, c);
    }
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [threeColor]);

  useFrame(({ clock }) => {
    if (startTime.current === 0) startTime.current = clock.elapsedTime;
    const elapsed = clock.elapsedTime - startTime.current;
    if (!meshRef.current) return;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      const t = elapsed;

      if (t > DURATION) {
        dummy.scale.setScalar(0);
      } else {
        // Physics: position = v*t - 0.5*g*t^2 (gravity pulls down)
        dummy.position.set(
          p.velocity.x * t,
          p.velocity.y * t - 0.5 * p.gravity * t * t,
          p.velocity.z * t
        );

        // Rotation
        dummy.rotation.set(
          t * p.rotSpeed,
          t * p.rotSpeed * 0.7,
          t * p.rotSpeed * 0.3
        );

        // Fade out: full size until 60%, then shrink
        const fadeProgress = elapsed / DURATION;
        const scale =
          fadeProgress < 0.6
            ? p.size
            : p.size * (1.0 - (fadeProgress - 0.6) / 0.4);
        dummy.scale.setScalar(Math.max(0, scale));
      }

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;

    if (elapsed >= DURATION && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  });

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, PARTICLE_COUNT]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.9} />
      </instancedMesh>

      <EffectComposer>
        <Bloom
          intensity={3.0}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </group>
  );
}

// ---- Public API ----

interface LevelUpExplosionProps {
  /** Level tier color */
  tierColor: string;
  onComplete?: () => void;
}

export function LevelUpExplosion({
  tierColor,
  onComplete,
}: LevelUpExplosionProps) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const handleComplete = () => {
    setFadeOut(true);
    setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 300);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 pointer-events-none transition-opacity
        duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        gl={{ antialias: false, alpha: true }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ExplosionScene color={tierColor} onComplete={handleComplete} />
        </Suspense>
      </Canvas>

      {/* LEVEL UP text */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2
          font-display text-5xl font-bold animate-bounce"
        style={{
          color: tierColor,
          textShadow: `0 0 30px ${tierColor}80`,
        }}
      >
        LEVEL UP!
      </div>
    </div>
  );
}

export default LevelUpExplosion;
```

---

## Step 3: Create `src/components/3d/StreakFlame3D.tsx`

Diamond tier (100+ day streak) only. Uses the `fireNoise` shader from Part A. Three intersecting PlaneGeometry billboards create a volumetric illusion. Additive blending for glow. Desktop only — mobile uses v2 CSS.

**CRITICAL FIX:** JSX `>` was placed before attributes on the wrapper `<div`, causing `className`, `style`, and `aria-label` to become text content instead of JSX attributes. All attributes moved inside the tag.

```tsx
'use client';

// ================================================================
// SparkForge StreakFlame3D — Diamond Tier Shader Fire
// ================================================================
// Diamond streak flame (100+ day) using fireNoise shader.
// v2 StreakFlame.tsx CSS handles tiers 1-6 — this is tier 7 only.
// PlaneGeometry billboard with transparent additive blending.
// Desktop only — mobile uses v2 CSS fallback.
//
// FIX APPLIED: JSX `>` was placed before attributes on the wrapper
// div (PDF corruption). All attributes now correctly inside the tag.
//
// Self-contained Canvas overlay.
// Dynamic import: dynamic(() => import(...).then(m => m.StreakFlame3D), { ssr: false })

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import {
  fireNoiseVertexShader,
  fireNoiseFragmentShader,
} from '@/shaders';

function DiamondFlame() {
  const meshRef = useRef<THREE.Mesh>(null);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: fireNoiseVertexShader,
      fragmentShader: fireNoiseFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1.0 },
        uFlameHeight: { value: 1.2 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, []);

  useFrame(({ clock }) => {
    shaderMaterial.uniforms.uTime.value = clock.elapsedTime;
    // Subtle height pulsing
    const pulse = 1.0 + Math.sin(clock.elapsedTime * 1.5) * 0.1;
    shaderMaterial.uniforms.uFlameHeight.value = 1.2 * pulse;
  });

  return (
    <group>
      {/* Main flame plane */}
      <mesh ref={meshRef} material={shaderMaterial}>
        <planeGeometry args={[1.0, 1.8]} />
      </mesh>

      {/* Secondary smaller flame (depth illusion) */}
      <mesh
        material={shaderMaterial}
        rotation={[0, Math.PI / 4, 0]}
        scale={[0.8, 0.9, 0.8]}
      >
        <planeGeometry args={[0.8, 1.5]} />
      </mesh>

      {/* Third plane for volume */}
      <mesh
        material={shaderMaterial}
        rotation={[0, -Math.PI / 4, 0]}
        scale={[0.7, 0.85, 0.7]}
      >
        <planeGeometry args={[0.7, 1.4]} />
      </mesh>

      {/* Inner glow point light */}
      <pointLight
        position={[0, 0.3, 0]}
        color="#F59E0B"
        intensity={2}
        distance={3}
      />

      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </group>
  );
}

// ---- Public API ----

interface StreakFlame3DProps {
  streakDays: number;
  className?: string;
}

export function StreakFlame3D({ streakDays, className }: StreakFlame3DProps) {
  // Only render for Diamond tier (100+ days)
  if (streakDays < 100) return null;

  return (
    <div
      className={`relative ${className || ''}`}
      style={{ width: 80, height: 120 }}
      aria-label={`Diamond streak flame: ${streakDays} days`}
    >
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        gl={{ antialias: false, alpha: true }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <DiamondFlame />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default StreakFlame3D;
```

---

## Step 4: Create `src/components/3d/GameParticles3D.tsx`

Decision 5.3: Per-game particle configuration registry. 5 flagship games get custom configs; 23 non-flagship games get generic lab-colored sparkles. `GameParticleEmitter` renders particles based on the registry, respecting the intensity slider (Decision 5.5) via uiStore.

**FIX APPLIED:** Replaced unsafe `as Record<string, string>` cast with properly typed `s.particleIntensity` selector.

```tsx
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
```

---

## Step 5: Create `src/components/ui/ParticleIntensitySlider.tsx`

Decision 5.5: 4-level particle intensity control (Off/Low/Medium/High). Default: Medium. Persists to uiStore. Rendered in Profile page settings section. Uses Framer Motion for animated active indicator and lucide-react icons.

**CRITICAL FIX:** Raw TypeScript code leaked outside the component function — uiStore modification instructions appeared as executable code instead of comments. Removed entirely; instructions applied as actual store modifications (Step 1).

**FIX APPLIED:** Replaced unsafe `as Record<...>` casts with properly typed selectors.

```tsx
'use client';

// ================================================================
// SparkForge ParticleIntensitySlider — Particle Preference Control
// ================================================================
// Decision 5.5: Low/Medium/High/Off, default Medium
// Persists to uiStore. Affects all particle systems.
// Rendered in Profile page settings section.
//
// FIX APPLIED: Removed raw TypeScript code that leaked outside the
// component at the bottom of the file (uiStore instructions were
// not properly commented — they appeared as executable code).
//
// FIX APPLIED: Replaced unsafe `as Record<...>` casts with properly
// typed uiStore selectors after store update.

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Flame, Wind, X } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

type IntensityLevel = 'off' | 'low' | 'medium' | 'high';

const LEVELS: {
  value: IntensityLevel;
  label: string;
  icon: typeof Sparkles;
  color: string;
  description: string;
}[] = [
  {
    value: 'off',
    label: 'Off',
    icon: X,
    color: '#64748B',
    description: 'No particles',
  },
  {
    value: 'low',
    label: 'Low',
    icon: Wind,
    color: '#3B82F6',
    description: 'Subtle ambient',
  },
  {
    value: 'medium',
    label: 'Medium',
    icon: Sparkles,
    color: '#8B5CF6',
    description: 'Balanced (default)',
  },
  {
    value: 'high',
    label: 'High',
    icon: Flame,
    color: '#F59E0B',
    description: 'Full spectacle',
  },
];

interface ParticleIntensitySliderProps {
  className?: string;
}

export function ParticleIntensitySlider({
  className,
}: ParticleIntensitySliderProps) {
  // Properly typed store access (particleIntensity added to uiStore in v3)
  const particleIntensity = useUIStore((s) => s.particleIntensity);
  const setParticleIntensity = useUIStore((s) => s.setParticleIntensity);

  const handleSelect = useCallback(
    (level: IntensityLevel) => {
      setParticleIntensity(level);
    },
    [setParticleIntensity]
  );

  const activeIndex = LEVELS.findIndex((l) => l.value === particleIntensity);

  return (
    <div className={`space-y-3 ${className || ''}`}>
      <label className="font-display text-sm font-medium text-white/70">
        Particle Effects
      </label>

      <div
        className="flex gap-2"
        role="radiogroup"
        aria-label="Particle intensity level"
      >
        {LEVELS.map((level) => {
          const Icon = level.icon;
          const isActive = particleIntensity === level.value;

          return (
            <button
              key={level.value}
              role="radio"
              aria-checked={isActive}
              aria-label={`${level.label}: ${level.description}`}
              onClick={() => handleSelect(level.value)}
              className={`
                relative flex-1 flex flex-col items-center gap-1.5
                px-3 py-2.5 rounded-xl border transition-all
                duration-200 cursor-pointer
                ${
                  isActive
                    ? 'border-white/30 bg-white/10'
                    : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                }
              `}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="particle-intensity-active"
                  className="absolute inset-0 rounded-xl border-2"
                  style={{ borderColor: level.color }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                />
              )}

              <Icon
                className="w-4 h-4 transition-colors"
                style={{ color: isActive ? level.color : '#64748B' }}
              />

              <span
                className="font-data text-[10px] font-medium transition-colors"
                style={{ color: isActive ? level.color : '#94A3B8' }}
              >
                {level.label}
              </span>

              {/* Particle preview dots */}
              {level.value !== 'off' && isActive && (
                <div className="flex gap-0.5">
                  {Array.from({
                    length: LEVELS.findIndex((l) => l.value === level.value),
                  }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: level.color }}
                      animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.8, 1.2, 0.8],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Current description */}
      <p className="font-body text-[10px] text-white/30 text-center">
        {LEVELS[activeIndex]?.description || 'Balanced (default)'}
      </p>
    </div>
  );
}

export default ParticleIntensitySlider;
```

---

## Verification Checklist

```
✅ npx tsc --noEmit     — PASS (0 errors)
✅ npm run lint          — PASS (0 warnings)
✅ npm run build         — PASS (clean production build)
```

### Component Audit Summary

| Component | Hooks | Canvas | Shader | Store Deps | ARIA |
|-----------|-------|--------|--------|------------|------|
| LevelUpExplosion | 4 (useState x2, useRef, useMemo) | Self-contained | None (BasicMaterial) | None | aria-hidden overlay |
| StreakFlame3D | 2 (useRef, useMemo) | Self-contained | fireNoise | None | aria-label on wrapper |
| GameParticles3D | 2 (useUIStore, useMemo) | Requires parent Canvas | None (drei Sparkles) | particleIntensity | N/A (3D particles) |
| ParticleIntensitySlider | 3 (useUIStore x2, useCallback) | N/A (CSS/Framer) | None | particleIntensity, setParticleIntensity | radiogroup, aria-checked |

### Flagship Particle Config Summary

| Game | Slug | Count | Color | Shape | Lab |
|------|------|-------|-------|-------|-----|
| Pet Trainer | pet-trainer | 30 | #F59E0B | rising | 2 |
| Neural Builder | neural-builder | 50 | #EC4899 | sparkles | 3 |
| Prompt Lab | prompt-lab | 25 | #F59E0B | falling | 4 |
| Agent Architect | agent-architect | 40 | #10B981 | orbiting | 5 |
| Bias Detective | bias-detective | 20 | #EF4444 | sparkles | 6 |

### Stage 5 v3-FINAL Complete — Combined Parts A+B+C

| Part | Files | Decisions |
|------|-------|-----------|
| A (Shaders) | 4 GLSL + index.ts modify | 4.2, 4.3, 4.5 |
| B (R3F Rewards) | 4 components | 4.2, 4.3, 5.2, 7.2 |
| C (Celebrations) | 4 components + uiStore modify | 5.3, 5.5 |

---

## CPA v2.0 INTEGRATION NOTES

> **Updated March 15, 2026** — 3D Panoramic Cockpit Enhancement v2.0 integration points.

### CeremonyFX Replaces / Augments LevelUpExplosion

The `CeremonyFX.tsx` component (created in Stage 3 Part 3B as part of the CPA v2.0 unified CockpitCanvas) provides a **cockpit-wide** celebration system that augments the existing `LevelUpExplosion.tsx` and `CelebrationOverlay`:

| Event | v2 Component | CPA v2.0 Augmentation |
|-------|-------------|----------------------|
| Level-up | LevelUpExplosion.tsx (self-contained Canvas) | CeremonyFX type `'levelUp'` — HUD rings expand 1.5x, bloom spikes to 1.0, 200 particles from cockpit center, cockpit panels flash lab color |
| XP gain | CelebrationOverlay CSS animation | CeremonyFX type `'xp'` — HUD rings expand 1.1x, bloom to 0.6, 50 particles, subtle panel pulse |
| Badge earned | CelebrationOverlay CSS animation | CeremonyFX type `'badge'` — HUD rings expand 1.3x, bloom to 0.8, 100 particles, hex clusters flash in sequence |
| Game complete | CelebrationOverlay CSS animation | CeremonyFX type `'gameComplete'` — HUD rings expand 1.4x, bloom to 0.9, 150 particles |
| Streak milestone | CSS StreakFire animation | CeremonyFX type `'streakMilestone'` — HUD rings expand 1.2x, bloom to 0.7, 80 fire-colored particles |

**Coexistence strategy:** Both systems run simultaneously:
- **LevelUpExplosion** renders in its own self-contained Canvas overlay (z-index 50) — remains as-is for mobile fallback and guaranteed visibility
- **CeremonyFX** renders within the CockpitCanvas (z-index 0) — adds cockpit-wide environmental celebration
- On mobile (no CockpitCanvas), only LevelUpExplosion + CSS CelebrationOverlay trigger
- On desktop, both fire for maximum impact

### Triggering CeremonyFX from Game Completion

When a game calls `gameStore.completeGame()`, the celebration pipeline should:

```typescript
// In useGameFocusState or game completion handler:
import { useCockpitStore } from '@/stores/cockpitStore';

// After game.completeGame():
const labColor = useUIStore.getState().labColor;
useCockpitStore.getState().enqueueCeremony({
  type: 'gameComplete',
  intensity: 0.9,
  labColor,
});
```

### Particle Intensity Integration

The `ParticleIntensitySlider` and `uiStore.particleIntensity` setting affects CeremonyFX particles:
- `'off'` → CeremonyFX particle count = 0 (bloom/HUD effects still play)
- `'low'` → particle count × 0.3
- `'medium'` → particle count × 1.0 (default from `CEREMONY_INTENSITY`)
- `'high'` → particle count × 1.5

This is consumed by CeremonyFX via `useUIStore(s => s.particleIntensity)` — consistent with GameParticles3D pattern.
| **Total** | **12 new + 2 modified** | **8 decisions** |
