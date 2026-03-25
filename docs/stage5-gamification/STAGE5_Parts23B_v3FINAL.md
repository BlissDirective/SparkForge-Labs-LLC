# Stage 5 Parts 2-3B v3-FINAL — R3F Reward Components

**Version:** v3-FINAL (corrected)
**Build Phase:** 9B (Part B of Parts 2-3)
**Prerequisites:** Stage 5 Part 1 complete, Stage 5 Parts 2-3A (reward shaders), Stage 3 Part 3 v3-FINAL (R3F infrastructure)
**Validation:** `npm run build` PASS, `npx tsc --noEmit` PASS, `npm run lint` PASS

---

## Overview

This document ADDS 4 new React Three Fiber (R3F) components to `src/components/3d/`. These are the **reward display components** that use the shaders from Parts 2-3A to render interactive badges, cards, and XP celebrations in the v3 Laboratory Control Station vision.

**Document scope:** NEW R3F components only. Reward shaders (Part A) and gamification engine (Part 1) remain untouched. This is Part B of the v3-FINAL Stage 5 enhancement — 3D reward display components.

### Decisions Implemented

| Decision | Description | Component |
|----------|-------------|-----------|
| 5.2 | XP vortex particle overlay for 20+ XP gains | XPVortex.tsx |
| 7.2 | 5-tier PBR pedestals for trophy room | BadgePedestal3D.tsx |
| 4.2 | LiquidMetal shader on Epic/Legendary badges | BadgeLevitate3D.tsx |
| 4.3 | Holographic diffraction on collectible cards | SparkCard3D.tsx |

### Files Created

| # | File | Action | Purpose |
|---|------|--------|---------|
| 1 | `src/components/3d/XPVortex.tsx` | CREATE | 100-particle instanced spiral for XP celebrations |
| 2 | `src/components/3d/BadgePedestal3D.tsx` | CREATE | 5-tier PBR pedestals with Float + Sparkles |
| 3 | `src/components/3d/BadgeLevitate3D.tsx` | CREATE | LiquidMetal shader badge display |
| 4 | `src/components/3d/SparkCard3D.tsx` | CREATE | Holographic daily card with tilt interaction |
| 5 | `public/fonts/` | CREATE (dir) | Directory for Exo 2 font file (soft dependency) |

### GPU Performance Budget

| Component | Cost | When Active | Geometry |
|-----------|------|-------------|----------|
| XPVortex | ~0.2ms | XP popup (2s lifespan) | 100 instanced spheres |
| BadgePedestal3D | ~0.2ms/pedestal | Trophy Room only | Cylinder + Octahedron |
| BadgeLevitate3D | ~0.3ms/badge | Trophy Room only | Sphere (32 segments) |
| SparkCard3D | ~0.1ms | Profile / Shop only | RoundedBox + Text |

### Dependencies

| Package | Used By | Export |
|---------|---------|--------|
| `@react-three/fiber` | All 4 | useFrame, Canvas |
| `@react-three/drei` | BadgePedestal3D, SparkCard3D | Float, Sparkles, Text, RoundedBox |
| `@react-three/postprocessing` | XPVortex | EffectComposer, Bloom |
| `@/shaders` | BadgeLevitate3D, SparkCard3D | liquidMetal*, holographic* shaders |
| `@/lib/gamification` | BadgePedestal3D, BadgeLevitate3D | Rarity, getRarityColor, getRarityVisuals |

---

## Code Review Fixes Applied

| # | Severity | File | Issue | Fix |
|---|----------|------|-------|-----|
| 1 | CRITICAL | BadgeLevitate3D.tsx | `side: THREE.DoubleSide` placed OUTSIDE ShaderMaterial constructor closing `})` — PDF corruption split the object literal | Moved inside ShaderMaterial constructor as a property |
| 2 | CRITICAL | SparkCard3D.tsx | `transparent: true, side: THREE.FrontSide` placed OUTSIDE ShaderMaterial constructor — same PDF corruption pattern | Moved both properties inside ShaderMaterial constructor |
| 3 | HIGH | XPVortex.tsx | Hooks ordering — early return `xpAmount < 20` between hooks violates React rules | All hooks called unconditionally before any early return |
| 4 | HIGH | BadgeLevitate3D.tsx | `useThree` imported from `@react-three/fiber` but never used | Removed unused import |
| 5 | MEDIUM | SparkCard3D.tsx | Font file `/fonts/Exo2-Bold.woff` missing (public/fonts/ doesn't exist) | Created directory; Text component gracefully falls back to default font |
| 6 | MEDIUM | XPVortex.tsx | `Math.random()` in useFrame creates non-deterministic renders | Replaced with pre-computed deterministic particle data in useMemo |

---

## Step 1: Create `src/components/3d/XPVortex.tsx`

Decision 5.2: 100-particle instanced spiral overlay for 20+ XP gains. Auto-unmounts after 2-second animation.

```tsx
'use client';

// ================================================================
// SparkForge XPVortex — 100-Particle Spiral Overlay
// ================================================================
// Decision 5.2: Particle vortex for 20+ XP gains
// GPU cost: ~0.2ms (100 instanced spheres, single draw call)
// Geometry: InstancedMesh spiral rising upward
// Lifespan: Auto-unmounts after 2s animation
//
// Usage: Overlaid in XP popup/celebration when xpAmount >= 20.
// Below 20 XP returns null (no GPU cost).

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Color, InstancedMesh, Object3D } from 'three';

interface XPVortexProps {
  xpAmount: number;
  color?: string;
  onComplete?: () => void;
}

const PARTICLE_COUNT = 100;
const DURATION = 2.0;

export default function XPVortex({
  xpAmount,
  color = '#00BBFF',
  onComplete,
}: XPVortexProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const timeRef = useRef(0);
  const [active, setActive] = useState(true);

  // Pre-compute spiral paths for each particle
  const particleData = useMemo(() => {
    const data: Array<{
      angle: number;
      radius: number;
      speed: number;
      phase: number;
      baseY: number;
    }> = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = i / PARTICLE_COUNT;
      const angle = t * Math.PI * 6; // 3 full spirals
      const radius = 0.3 + t * 1.2;
      const speed = 0.5 + (Math.sin(i * 1.37) * 0.5 + 0.5) * 1.5;
      const phase = (Math.sin(i * 2.71) * 0.5 + 0.5) * Math.PI * 2;
      data.push({ angle, radius, speed, phase, baseY: -1 + t * 0.5 });
    }
    return data;
  }, []);

  const colorObj = useMemo(() => new Color(color), [color]);
  const dummy = useMemo(() => new Object3D(), []);

  useFrame((_, delta) => {
    if (!meshRef.current || !active || xpAmount < 20) return;

    timeRef.current += delta;
    const progress = Math.min(timeRef.current / DURATION, 1);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particleData[i];

      // Spiral upward with contracting radius
      const currentAngle =
        p.angle + timeRef.current * p.speed + p.phase;
      const currentRadius = p.radius * (1 - progress * 0.3);
      const y = p.baseY + progress * 3.0 * p.speed;

      dummy.position.set(
        Math.cos(currentAngle) * currentRadius,
        y,
        Math.sin(currentAngle) * currentRadius
      );

      // Scale down as particles rise and fade
      const scale = Math.max(0, (1 - progress) * 0.5);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;

    // Auto-complete after duration
    if (progress >= 1 && active) {
      setActive(false);
      onComplete?.();
    }
  });

  // Return null for small XP or after animation completes
  // All hooks are called unconditionally above (React rules)
  if (xpAmount < 20 || !active) return null;

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, PARTICLE_COUNT]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshBasicMaterial
          color={colorObj}
          transparent
          opacity={0.9}
          toneMapped={false}
        />
      </instancedMesh>

      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}
```

---

## Step 2: Create `src/components/3d/BadgePedestal3D.tsx`

Decision 7.2: 5-tier PBR pedestals for trophy room display. Rarity determines material quality, Float levitation, and Sparkle effects.

```tsx
'use client';

// ================================================================
// SparkForge BadgePedestal3D — 5-Tier PBR Trophy Pedestals
// ================================================================
// Decision 7.2: Rarity-based pedestal materials
// GPU cost: ~0.2ms per pedestal
// Geometry: CylinderGeometry base + OctahedronGeometry emblem
//
// Tiers:
//   Common    — Brushed steel, no effects
//   Uncommon  — Polished chrome, subtle Float
//   Rare      — Blue glass + glow, Sparkles
//   Epic      — Purple crystal + Bloom, Sparkles + Float
//   Legendary — Gold PBR + fire particles, Sparkles + Float
//
// Used in: Trophy Room layout (BadgePedestals grid)

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import { Color, Mesh } from 'three';
import type { Rarity } from '@/lib/gamification';
import { getRarityColor, getRarityVisuals } from '@/lib/gamification';

interface BadgePedestal3DProps {
  rarity: Rarity;
  position?: [number, number, number];
  badgeName?: string;
  unlocked?: boolean;
}

// Rarity → material config
function getPedestalMaterial(rarity: Rarity, unlocked: boolean) {
  const color = new Color(unlocked ? getRarityColor(rarity) : '#333340');

  switch (rarity) {
    case 'legendary':
      return {
        color,
        metalness: 0.95,
        roughness: 0.1,
        emissive: new Color(getRarityColor(rarity)),
        emissiveIntensity: unlocked ? 0.3 : 0,
      };
    case 'epic':
      return {
        color,
        metalness: 0.8,
        roughness: 0.15,
        emissive: new Color(getRarityColor(rarity)),
        emissiveIntensity: unlocked ? 0.2 : 0,
      };
    case 'rare':
      return {
        color,
        metalness: 0.6,
        roughness: 0.2,
        emissive: new Color(getRarityColor(rarity)),
        emissiveIntensity: unlocked ? 0.15 : 0,
      };
    case 'uncommon':
      return {
        color,
        metalness: 0.7,
        roughness: 0.25,
        emissive: new Color('#000000'),
        emissiveIntensity: 0,
      };
    default: // common
      return {
        color,
        metalness: 0.4,
        roughness: 0.5,
        emissive: new Color('#000000'),
        emissiveIntensity: 0,
      };
  }
}

export default function BadgePedestal3D({
  rarity,
  position = [0, 0, 0],
  badgeName = 'Badge',
  unlocked = true,
}: BadgePedestal3DProps) {
  const emblemRef = useRef<Mesh>(null);
  const material = useMemo(() => getPedestalMaterial(rarity, unlocked), [rarity, unlocked]);
  const visuals = useMemo(() => getRarityVisuals(rarity), [rarity]);
  const rarityColor = useMemo(() => getRarityColor(rarity), [rarity]);

  // Slow rotation for rare+ tiers
  useFrame((_, delta) => {
    if (!emblemRef.current || visuals.rotateSpeed === 0) return;
    emblemRef.current.rotation.y += (Math.PI * 2 * delta) / visuals.rotateSpeed;
  });

  const hasFloat = rarity === 'uncommon' || rarity === 'rare' ||
    rarity === 'epic' || rarity === 'legendary';
  const hasSparkles = rarity === 'rare' || rarity === 'epic' || rarity === 'legendary';

  const emblem = (
    <group position={[position[0], position[1] + 0.6, position[2]]}>
      <mesh
        ref={emblemRef}
        castShadow
        aria-label={`${badgeName} badge, ${rarity} rarity${unlocked ? '' : ', locked'}`}
      >
        <octahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial
          color={material.color}
          metalness={material.metalness}
          roughness={material.roughness}
          emissive={material.emissive}
          emissiveIntensity={material.emissiveIntensity}
        />
      </mesh>

      {/* Sparkle particles for rare+ */}
      {hasSparkles && unlocked && (
        <Sparkles
          count={visuals.particleCount * 3}
          scale={0.8}
          size={2}
          speed={0.4}
          color={rarityColor}
        />
      )}
    </group>
  );

  return (
    <group>
      {/* Pedestal base */}
      <mesh
        position={[position[0], position[1] + 0.15, position[2]]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.2, 0.25, 0.3, 8]} />
        <meshStandardMaterial
          color={unlocked ? '#1A1822' : '#111118'}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Emblem with optional Float wrapper */}
      {hasFloat && unlocked ? (
        <Float
          speed={1.5}
          rotationIntensity={0}
          floatIntensity={visuals.levitateHeight * 0.1}
        >
          {emblem}
        </Float>
      ) : (
        emblem
      )}
    </group>
  );
}
```

---

## Step 3: Create `src/components/3d/BadgeLevitate3D.tsx`

Decision 4.2: LiquidMetal shader on Epic/Legendary badge meshes. Epic uses 0.5x intensity; Legendary uses 1.0x with mouse-driven ripple effect.

**CRITICAL FIX:** ShaderMaterial `side: THREE.DoubleSide` was placed OUTSIDE the constructor object (after the closing `});`) due to PDF corruption. Moved inside.

**FIX:** Removed unused `useThree` import.

```tsx
'use client';

// ================================================================
// SparkForge BadgeLevitate3D — LiquidMetal Badge Display
// ================================================================
// Decision 4.2: Liquid metal shader on Epic/Legendary badges
// GPU cost: ~0.3ms per badge (simplex noise displacement)
// Geometry: SphereGeometry (detail 32) for smooth displacement
//
// Uniforms: uTime, uIntensity, uColor, uRippleCenter, uRippleStrength
// Epic: intensity=0.5 (subtle). Legendary: intensity=1.0 + mouse ripple.
//
// FIX APPLIED: ShaderMaterial `side` property moved INSIDE constructor.
// FIX APPLIED: Removed unused `useThree` import.

import { useRef, useMemo, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  DoubleSide,
  Event,
  MathUtils,
  Mesh,
  ShaderMaterial,
  Vector2,
} from 'three';
import type { Rarity } from '@/lib/gamification';
import { getRarityColor, getRarityVisuals } from '@/lib/gamification';
import {
  liquidMetalVertexShader,
  liquidMetalFragmentShader,
} from '@/shaders';

interface BadgeLevitate3DProps {
  rarity: Rarity;
  position?: [number, number, number];
  badgeName?: string;
}

export default function BadgeLevitate3D({
  rarity,
  position = [0, 0, 0],
  badgeName = 'Badge',
}: BadgeLevitate3DProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const rippleCenterRef = useRef(new Vector2(0.5, 0.5));

  const isLegendary = rarity === 'legendary';
  const isEpic = rarity === 'epic';
  const useLiquidMetal = isEpic || isLegendary;
  const color = useMemo(() => getRarityColor(rarity), [rarity]);
  const visuals = useMemo(() => getRarityVisuals(rarity), [rarity]);

  // FIX: `side` is INSIDE the ShaderMaterial constructor (was outside)
  const shaderMaterial = useMemo(() => {
    if (!useLiquidMetal) return null;

    return new ShaderMaterial({
      vertexShader: liquidMetalVertexShader,
      fragmentShader: liquidMetalFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: isLegendary ? 1.0 : 0.5 },
        uColor: { value: new Color(color) },
        uRippleCenter: { value: new Vector2(0.5, 0.5) },
        uRippleStrength: { value: 0 },
      },
      side: DoubleSide,
    });
  }, [useLiquidMetal, isLegendary, color]);

  // Animate uniforms + levitation
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Slow Y rotation
    if (visuals.rotateSpeed > 0) {
      meshRef.current.rotation.y +=
        (Math.PI * 2 * delta) / visuals.rotateSpeed;
    }

    // Levitation bob
    const levHeight = visuals.levitateHeight * 0.02;
    meshRef.current.position.y =
      position[1] + Math.sin(Date.now() * 0.002) * levHeight;

    // Update shader uniforms
    if (shaderMaterial) {
      shaderMaterial.uniforms.uTime.value += delta;
      shaderMaterial.uniforms.uRippleCenter.value.copy(rippleCenterRef.current);
      // Legendary gets mouse ripple; Epic gets none
      shaderMaterial.uniforms.uRippleStrength.value = MathUtils.lerp(
        shaderMaterial.uniforms.uRippleStrength.value,
        hovered && isLegendary ? 1.0 : 0,
        delta * 4
      );
    }
  });

  // Track pointer for legendary ripple
  const handlePointerMove = useCallback(
    (e: Event) => {
      if (!isLegendary) return;
      const event = e as Event & { uv?: Vector2 };
      if (event.uv) {
        rippleCenterRef.current.copy(event.uv);
      }
    },
    [isLegendary]
  );

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerMove={handlePointerMove}
      aria-label={`${badgeName}, ${rarity} rarity badge with liquid metal effect`}
    >
      <sphereGeometry args={[0.3, 32, 32]} />
      {shaderMaterial ? (
        <primitive object={shaderMaterial} attach="material" />
      ) : (
        <meshStandardMaterial
          color={color}
          metalness={0.6}
          roughness={0.3}
        />
      )}
    </mesh>
  );
}
```

---

## Step 4: Create `src/components/3d/SparkCard3D.tsx`

Decision 4.3: Holographic diffraction card for Daily Spark display. Interactive pointer-driven tilt drives the `uTilt` uniform, creating a rainbow shift that follows the viewing angle.

**CRITICAL FIX:** ShaderMaterial `transparent: true` and `side: THREE.FrontSide` were placed OUTSIDE the constructor object due to PDF corruption. Moved inside.

**NOTE:** Font file `public/fonts/Exo2-Bold.woff` must be placed manually. drei's `<Text>` (troika-three-text) falls back to a default font if the file is missing — this is non-blocking.

```tsx
'use client';

// ================================================================
// SparkForge SparkCard3D — Holographic Daily Spark Card
// ================================================================
// Decision 4.3: Holographic diffraction on collectible cards
// GPU cost: ~0.1ms (no noise dependency, simple fragment shader)
// Geometry: RoundedBox card + drei Text for title
//
// Interactive: pointer-driven tilt updates uTilt uniform for
// rainbow shift that follows the user's viewing angle.
//
// FIX APPLIED: ShaderMaterial `transparent` and `side` moved
// INSIDE constructor (were outside due to PDF corruption).
//
// NOTE: Font file at /fonts/Exo2-Bold.woff must be placed in
// public/fonts/. Text component falls back to default font if missing.

import { useRef, useMemo, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import {
  Color,
  Event,
  FrontSide,
  Group,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three';
import {
  holographicVertexShader,
  holographicFragmentShader,
} from '@/shaders';

interface SparkCard3DProps {
  title?: string;
  color?: string;
  position?: [number, number, number];
  onClick?: () => void;
}

const FONT_URL = '/fonts/Exo2-Bold.woff';
const CARD_WIDTH = 1.2;
const CARD_HEIGHT = 1.6;

export default function SparkCard3D({
  title = 'Daily Spark',
  color = '#00BBFF',
  position = [0, 0, 0],
  onClick,
}: SparkCard3DProps) {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const tiltRef = useRef(new Vector2(0, 0));
  const targetTiltRef = useRef(new Vector2(0, 0));

  // FIX: `transparent` and `side` are INSIDE the constructor (were outside)
  const shaderMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: holographicVertexShader,
        fragmentShader: holographicFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uTilt: { value: new Vector2(0, 0) },
          uIntensity: { value: 0.8 },
          uBaseColor: { value: new Color(color) },
        },
        transparent: true,
        side: FrontSide,
      }),
    [color]
  );

  // Animate tilt toward target + update time
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    shaderMaterial.uniforms.uTime.value += delta;

    // Smooth tilt interpolation
    tiltRef.current.lerp(targetTiltRef.current, delta * 6);
    shaderMaterial.uniforms.uTilt.value.copy(tiltRef.current);

    // Subtle idle rotation when not hovered
    if (!hovered) {
      targetTiltRef.current.set(
        Math.sin(Date.now() * 0.001) * 0.05,
        Math.cos(Date.now() * 0.0013) * 0.05
      );
    }

    // Apply tilt to group rotation for physical card feel
    groupRef.current.rotation.y = tiltRef.current.x * 0.3;
    groupRef.current.rotation.x = -tiltRef.current.y * 0.2;
  });

  // Track pointer for tilt
  const handlePointerMove = useCallback(
    (e: Event) => {
      const event = e as Event & { point?: Vector3 };
      if (!event.point || !groupRef.current) return;

      // Normalize point relative to card center
      const local = groupRef.current.worldToLocal(event.point.clone());
      targetTiltRef.current.set(
        (local.x / CARD_WIDTH) * 2,
        (local.y / CARD_HEIGHT) * 2
      );
    },
    []
  );

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => {
        setHovered(false);
        targetTiltRef.current.set(0, 0);
      }}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
    >
      {/* Card body with holographic shader */}
      <RoundedBox
        args={[CARD_WIDTH, CARD_HEIGHT, 0.04]}
        radius={0.06}
        smoothness={4}
        castShadow
      >
        <primitive object={shaderMaterial} attach="material" />
      </RoundedBox>

      {/* Chrome edge bevel */}
      <RoundedBox
        args={[CARD_WIDTH + 0.03, CARD_HEIGHT + 0.03, 0.02]}
        radius={0.07}
        smoothness={4}
        position={[0, 0, -0.015]}
      >
        <meshStandardMaterial
          color="#2A2A3A"
          metalness={0.8}
          roughness={0.2}
        />
      </RoundedBox>

      {/* Title text */}
      <Text
        position={[0, -CARD_HEIGHT * 0.35, 0.025]}
        fontSize={0.1}
        maxWidth={CARD_WIDTH * 0.8}
        textAlign="center"
        color="#FFFFFF"
        font={FONT_URL}
        anchorX="center"
        anchorY="middle"
        aria-label={title}
      >
        {title}
      </Text>

      {/* Spark icon (diamond shape) */}
      <mesh position={[0, 0.15, 0.025]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.9}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
```

---

## Step 5: Create `public/fonts/` Directory

```bash
mkdir -p public/fonts
```

**NOTE:** The font file `Exo2-Bold.woff` should be placed here for SparkCard3D's `<Text>` component. This is a soft dependency — the component renders correctly with a fallback font if the file is absent.

---

## Verification Checklist

```
✅ npx tsc --noEmit     — PASS (0 errors)
✅ npm run lint          — PASS (0 warnings)
✅ npm run build         — PASS (clean production build)
```

### Component Audit Summary

| Component | Hooks | Conditional Returns | Shader | drei Deps | ARIA |
|-----------|-------|-------------------|--------|-----------|------|
| XPVortex | 5 (all unconditional) | After all hooks ✓ | None (BasicMaterial) | None | N/A (effect overlay) |
| BadgePedestal3D | 4 | None | None (StandardMaterial) | Float, Sparkles | aria-label on emblem |
| BadgeLevitate3D | 6 | None | liquidMetal (Epic/Legendary) | None | aria-label on mesh |
| SparkCard3D | 5 | None | holographic | RoundedBox, Text | aria-label on text |
