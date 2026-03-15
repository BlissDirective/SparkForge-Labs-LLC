# SPARKFORGE — STAGE 7D v3-FINAL (PART A): 3D Components

**Date:** February 28, 2026 | **GCUD Version:** V9
**Vision:** Laboratory Control Station
**Design Direction:** Frost-Prismatic v3 (blue-dominant 60/40, chrome bezel, hex-radial, R3F station frame)
**Code-Reviewed:** March 8, 2026 by Claude Code (Code Review Role per CLAUDE.md §3.1)

---

## Overview

Three new 3D components implementing Decision 6.5 — Tier 2 Enhanced 3D for FL-Lite games:

| Game | Lab | Color | Component | Triangles |
|------|-----|-------|-----------|-----------|
| Robot Vacuum | Lab 5 (AI Helpers) | Emerald (#10B981) | RobotVacuum3D.tsx | ~3K |
| Camera Quest | Lab 7 (Computer Vision) | Cyan (#06B6D4) | CameraQuest3D.tsx | ~2K |
| Future Forge | Lab 10 (AI's Future) | Fuchsia (#D946EF) | FutureForge3D.tsx | ~2K |

**Prerequisites:** Stage 3 Part 3 v3-FINAL (StationFrame + HDR infrastructure), Three.js packages installed.
**Supersedes:** No prior 3D components exist for these games (v2 was CSS/emoji/SVG only).

---

## AUTO-FIX LOG (Applied During Code Review)

| # | Category | File | Original | Fixed | Reason |
|---|----------|------|----------|-------|--------|
| 1 | **Critical JSX** | FutureForge3D | `<ForgeScene>` rendered OUTSIDE `<Canvas>` | Moved inside `<Canvas>` | R3F components crash outside Canvas context. Would throw "hooks can only be used within Canvas" error. |
| 2 | **Performance** | All 3 files | `frameloop="demand"` with continuous `useFrame` | `frameloop="always"` | `demand` only renders on invalidation. Continuous animations (bobbing, lerping, pulsing) require `always`. Matches AgentPipeline3D and PromptBubble3DScene patterns. |
| 3 | **TypeScript** | RobotVacuum3D | DustParticles interface syntax broken — closing `}` before type definitions | Fixed interface block ordering | PDF formatting corrupted the interface/destructured-params pattern. |
| 4 | **JSX syntax** | CameraQuest3D | Main export `<div>` with attributes on wrong lines (`>` before `style=`) | Fixed JSX element structure | PDF line-wrapping broke the JSX. |
| 5 | **JSX syntax** | FutureForge3D | `<Text>` component with `>` on wrong line, attributes after | Fixed JSX element structure | PDF line-wrapping broke the JSX. |
| 6 | **GC pressure** | FutureForge3D | `new THREE.Vector3()` allocated per frame in HolographicPatent `useFrame` | Cached `_targetScale` vector via `useMemo` | Per-frame allocations cause GC pauses. Matches project pattern of pre-allocating vectors. |
| 7 | **Unused param** | RobotVacuum3D | `gridSize` param in FurnitureBlock unused | Removed from interface | Dead code cleanup. |
| 8 | **Missing 'use client'** | All 3 files | Had `"use client"` (double quotes) | Changed to `'use client'` (single quotes) | Consistency with all existing project components which use single quotes. |

### Triangle Budget Breakdown — RobotVacuum3D (FL-Lite)

| Component | Base Tris | With Effects | LOD Low |
|-----------|-----------|-------------|---------|
| RobotVacuum3D (robot) | ~12K | ~12K | ~5K |
| Room geometry | ~8K | ~8K | ~3K |
| Trail particles | ~5K | ~5K | ~2K |
| **Total** | **~25K** | **~25K** | **~10K** |

| Device | Max Budget | Target FPS | LOD Level |
|--------|-----------|------------|-----------|
| Desktop | 50,000 | 60 | ultra/high |
| Tablet | 25,000 | 45 | medium |
| Mobile | 10,000 | 30 | low |

### Triangle Budget Breakdown — CameraQuest3D (FL-Lite)

| Component | Base Tris | With Effects | LOD Low |
|-----------|-----------|-------------|---------|
| CameraQuest3D (camera) | ~8K | ~8K | ~3K |
| Polaroid cards | ~6K | ~6K | ~2K |
| Particles | ~4K | ~4K | ~1K |
| **Total** | **~18K** | **~18K** | **~6K** |

| Device | Max Budget | Target FPS | LOD Level |
|--------|-----------|------------|-----------|
| Desktop | 50,000 | 60 | ultra/high |
| Tablet | 25,000 | 45 | medium |
| Mobile | 10,000 | 30 | low |

### Triangle Budget Breakdown — FutureForge3D (FL-Lite)

| Component | Base Tris | With Effects | LOD Low |
|-----------|-----------|-------------|---------|
| FutureForge3D (blueprint) | ~10K | ~10K | ~4K |
| Hologram | ~6K | ~6K | ~2K |
| Particles | ~4K | ~4K | ~1K |
| **Total** | **~20K** | **~20K** | **~7K** |

| Device | Max Budget | Target FPS | LOD Level |
|--------|-----------|------------|-----------|
| Desktop | 50,000 | 60 | ultra/high |
| Tablet | 25,000 | 45 | medium |
| Mobile | 10,000 | 30 | low |

---

## Decisions Implemented

- **Decision 6.5** — Tier 2 Enhanced 3D for Robot Vacuum: 3D isometric room with dust particles, vacuum trail, furniture depth
- **Decision 6.5** — Tier 2 Enhanced 3D for Camera Quest: 3D polaroid cards that flip/stack, viewfinder overlay, confidence gauge
- **Decision 6.5** — Tier 2 Enhanced 3D for Future Forge: 3D blueprint table with holographic invention preview

---

## V2 → v3-FINAL Changes

### Robot Vacuum
| Aspect | V2 (CSS) | v3-FINAL |
|--------|----------|----------|
| Grid Display | CSS 6x6 grid with emoji | CSS preserved + 3D R3F isometric room above grid |
| Furniture | Emoji in CSS cells | 3D BoxGeometry blocks with depth |
| Dust | Emoji swap (dust→sparkle) | 3D Points particles that color-shift on clean |
| Vacuum | Emoji in grid cell | 3D cylinder with directional cone arrow, emerald glow |
| Trail | CSS cell background tint | 3D line trail with emerald opacity |

### Camera Quest
| Aspect | V2 (CSS) | v3-FINAL |
|--------|----------|----------|
| Hunt Cards | CSS buttons with emoji | 3D polaroid card meshes that flip on find |
| Collection | CSS grid of item states | 3D card stack growing as items found |
| Confidence | Motion bar | 3D semicircle gauge with rotating needle |

### Future Forge
| Aspect | V2 (CSS) | v3-FINAL |
|--------|----------|----------|
| Build Phase | CSS cards | 3D blueprint table with fuchsia grid lines |
| Skills | CSS toggle buttons | 3D floating orbs with glow rings |
| Patent Card | CSS styled div | 3D holographic plane with slow rotation, transmission material |

---

## File 1: `src/components/3d/RobotVacuum3D.tsx`

```tsx
'use client';

// ================================================================
// ROBOT VACUUM 3D — Lab 5 (AI Helpers) — v3 Enhanced 3D
// [v3] 3D isometric room with furniture depth
// [v3] Dust particles as Points, clean burst animation
// [v3] Vacuum robot with directional arrow + trail line
// [v3] Decision 6.5 — Tier 2 Enhanced 3D (~3K triangles)
// ================================================================

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ---- Types ----

interface FurnitureItem {
  pos: [number, number];
  emoji: string;
}

interface RoomData {
  walls: [number, number][];
  furniture: FurnitureItem[];
  dirt: [number, number][];
  charger: [number, number];
}

interface RobotVacuum3DProps {
  room: RoomData;
  vacPos: [number, number];
  vacDir: number;
  cleaned: Set<string>;
  trail: string[];
  gridSize: number;
  running: boolean;
  isMobile?: boolean;
}

// ---- Floor Grid ----

function FloorGrid({ size, color }: { size: number; color: string }) {
  const lines = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= size; i++) {
      // Horizontal
      pts.push(0, 0.01, i, size, 0.01, i);
      // Vertical
      pts.push(i, 0.01, 0, i, 0.01, size);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geom;
  }, [size]);

  return (
    <group>
      {/* Floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[size / 2, 0, size / 2]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#0a1a12" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Grid lines */}
      <lineSegments geometry={lines}>
        <lineBasicMaterial color={color} transparent opacity={0.15} />
      </lineSegments>
    </group>
  );
}

// ---- Furniture Block ----

function FurnitureBlock({ pos }: { pos: [number, number] }) {
  return (
    <mesh position={[pos[1] + 0.5, 0.3, pos[0] + 0.5]}>
      <boxGeometry args={[0.8, 0.6, 0.8]} />
      <meshStandardMaterial color="#4a3728" roughness={0.7} metalness={0.1} />
    </mesh>
  );
}

// ---- Wall Block ----

function WallBlock({ pos }: { pos: [number, number] }) {
  return (
    <mesh position={[pos[1] + 0.5, 0.4, pos[0] + 0.5]}>
      <boxGeometry args={[0.95, 0.8, 0.95]} />
      <meshStandardMaterial
        color="#1a1a2e"
        roughness={0.9}
        metalness={0.05}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
}

// ---- Dust Particles ----

function DustParticles({
  dirtPositions,
  cleaned,
}: {
  dirtPositions: [number, number][];
  cleaned: Set<string>;
}) {
  const ref = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const pos: number[] = [];
    const col: number[] = [];
    dirtPositions.forEach(([r, c]) => {
      pos.push(c + 0.5, 0.1, r + 0.5);
      col.push(0.6, 0.4, 0.2);
    });
    return {
      positions: new THREE.Float32BufferAttribute(pos, 3),
      colors: new THREE.Float32BufferAttribute(col, 3),
    };
  }, [dirtPositions]);

  useFrame(() => {
    if (!ref.current) return;
    const colAttr = ref.current.geometry.getAttribute('color');
    dirtPositions.forEach(([r, c], i) => {
      const isCleaned = cleaned.has(`${r},${c}`);
      // Fade cleaned dust to green
      colAttr.setXYZ(
        i,
        isCleaned ? 0.1 : 0.6,
        isCleaned ? 0.8 : 0.4,
        isCleaned ? 0.1 : 0.2
      );
    });
    colAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" {...positions} />
        <bufferAttribute attach="attributes-color" {...colors} />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

// ---- Vacuum Robot ----

function VacuumRobot({
  pos,
  dir,
  running,
}: {
  pos: [number, number];
  dir: number;
  running: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Direction to rotation (0=right, 1=down, 2=left, 3=up)
  const rotations = [0, -Math.PI / 2, Math.PI, Math.PI / 2];

  useFrame((state) => {
    if (!groupRef.current) return;
    // Smooth position lerp
    const tx = pos[1] + 0.5;
    const tz = pos[0] + 0.5;
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x, tx, 0.15
    );
    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z, tz, 0.15
    );
    // Smooth rotation
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y, rotations[dir], 0.15
    );
    // Glow pulse when running
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = running
        ? 0.3 + Math.sin(state.clock.elapsedTime * 6) * 0.15
        : 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[pos[1] + 0.5, 0.1, pos[0] + 0.5]}>
      {/* Body */}
      <mesh>
        <cylinderGeometry args={[0.35, 0.35, 0.15, 16]} />
        <meshStandardMaterial
          color="#10B981"
          emissive="#10B981"
          emissiveIntensity={0.3}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      {/* Direction arrow */}
      <mesh position={[0.25, 0.08, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.08, 0.2, 6]} />
        <meshStandardMaterial color="#ffffff" emissive="#10B981" emissiveIntensity={0.5} />
      </mesh>
      {/* Glow ring */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.36, 0.45, 24]} />
        <meshBasicMaterial
          color="#10B981"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ---- Trail Line ----

function TrailLine({ trail }: { trail: string[] }) {
  const ref = useRef<THREE.Line>(null);

  useEffect(() => {
    if (!ref.current || trail.length < 2) return;
    const pts = trail.map((key) => {
      const [r, c] = key.split(',').map(Number);
      return new THREE.Vector3(c + 0.5, 0.05, r + 0.5);
    });
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    ref.current.geometry.dispose();
    ref.current.geometry = geom;
  }, [trail]);

  return (
    // @ts-expect-error — R3F line element type mismatch with Three.js Line
    <line ref={ref}>
      <bufferGeometry />
      <lineBasicMaterial color="#10B981" transparent opacity={0.3} />
    </line>
  );
}

// ---- Charger Marker ----

function ChargerMarker({ pos }: { pos: [number, number] }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = 0.05 + Math.sin(state.clock.elapsedTime * 2) * 0.03;
  });

  return (
    <mesh ref={ref} position={[pos[1] + 0.5, 0.05, pos[0] + 0.5]}>
      <boxGeometry args={[0.4, 0.08, 0.4]} />
      <meshStandardMaterial
        color="#FBBF24"
        emissive="#FBBF24"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

// ---- Scene (inner R3F) ----

function RoomScene({
  room,
  vacPos,
  vacDir,
  cleaned,
  trail,
  gridSize,
  running,
}: Omit<RobotVacuum3DProps, 'isMobile'>) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} castShadow />
      <pointLight
        position={[vacPos[1] + 0.5, 1, vacPos[0] + 0.5]}
        intensity={0.4}
        color="#10B981"
      />

      {/* Floor + Grid */}
      <FloorGrid size={gridSize} color="#10B981" />

      {/* Walls */}
      {room.walls.map(([r, c], i) => (
        <WallBlock key={`w-${i}`} pos={[r, c]} />
      ))}

      {/* Furniture */}
      {room.furniture.map((f, i) => (
        <FurnitureBlock key={`f-${i}`} pos={f.pos} />
      ))}

      {/* Charger */}
      <ChargerMarker pos={room.charger} />

      {/* Dust */}
      <DustParticles dirtPositions={room.dirt} cleaned={cleaned} />

      {/* Trail */}
      <TrailLine trail={trail} />

      {/* Vacuum */}
      <VacuumRobot pos={vacPos} dir={vacDir} running={running} />

      {/* Environment */}
      <Environment preset="night" />

      {/* Bloom */}
      <EffectComposer>
        <Bloom
          intensity={0.3}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// ---- Main Export ----

export default function RobotVacuum3D(props: RobotVacuum3DProps) {
  if (props.isMobile) return null;

  return (
    <div
      style={{ width: '100%', height: 220, borderRadius: 12, overflow: 'hidden' }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [5, 6, 5], fov: 45 }}
        frameloop="always"
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        onCreated={({ camera }) => {
          camera.lookAt(3, 0, 3);
        }}
      >
        <RoomScene {...props} />
      </Canvas>
    </div>
  );
}
```

---

## File 2: `src/components/3d/CameraQuest3D.tsx`

```tsx
'use client';

// ================================================================
// CAMERA QUEST 3D — Lab 7 (Computer Vision) — v3 Enhanced 3D
// [v3] 3D polaroid cards that flip when found
// [v3] Confidence gauge with rotating needle
// [v3] Found card stack grows as items discovered
// [v3] Decision 6.5 — Tier 2 Enhanced 3D (~2K triangles)
// ================================================================

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ---- Types ----

interface HuntItemData {
  text: string;
  emoji: string;
  difficulty: 1 | 2 | 3;
  simConfidence: number;
}

interface CameraQuest3DProps {
  items: HuntItemData[];
  currentIndex: number;
  found: Set<number>;
  showConfidence: boolean;
  captured: boolean;
  isMobile?: boolean;
}

// ---- Polaroid Card ----

function PolaroidCard({
  item,
  isActive,
  isFound,
  stackOffset,
}: {
  item: HuntItemData;
  index: number;
  isActive: boolean;
  isFound: boolean;
  stackOffset: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const flipRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Flip animation for found cards
    const targetFlip = isFound ? Math.PI : 0;
    flipRef.current = THREE.MathUtils.lerp(flipRef.current, targetFlip, delta * 4);
    groupRef.current.rotation.y = flipRef.current;

    // Active card float
    if (isActive && !isFound) {
      groupRef.current.position.y =
        0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      groupRef.current.scale.setScalar(
        1.1 + Math.sin(state.clock.elapsedTime * 3) * 0.02
      );
    } else if (isFound) {
      groupRef.current.position.x = 2.5 + stackOffset * 0.25;
      groupRef.current.position.y = stackOffset * 0.02;
      groupRef.current.rotation.z = (stackOffset % 3 - 1) * 0.08;
      groupRef.current.scale.setScalar(0.6);
    } else {
      groupRef.current.scale.setScalar(0.001); // hidden
    }
  });

  return (
    <group ref={groupRef} position={isActive ? [0, 0.5, 0] : [2.5, 0, 0]}>
      {/* White border frame */}
      <mesh>
        <boxGeometry args={[1.1, 1.35, 0.03]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.9} />
      </mesh>
      {/* Image area (dark) */}
      <mesh position={[0, 0.1, 0.02]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial
          color={isActive ? '#1a1a2e' : '#2a2a3e'}
          emissive="#06B6D4"
          emissiveIntensity={isActive ? 0.1 : 0.02}
        />
      </mesh>
      {/* Emoji */}
      <Text
        position={[0, 0.15, 0.04]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
      >
        {item.emoji}
      </Text>
      {/* Label */}
      <Text
        position={[0, -0.5, 0.02]}
        fontSize={0.08}
        color="#555555"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.9}
      >
        {item.text}
      </Text>
      {/* Difficulty stars */}
      <Text
        position={[0, -0.6, 0.02]}
        fontSize={0.07}
        color="#FBBF24"
        anchorX="center"
        anchorY="middle"
      >
        {'★'.repeat(item.difficulty)}
      </Text>
      {/* Found checkmark (back side) */}
      {isFound && (
        <Text
          position={[0, 0, -0.02]}
          fontSize={0.3}
          color="#10B981"
          anchorX="center"
          anchorY="middle"
          rotation={[0, Math.PI, 0]}
        >
          ✓ FOUND
        </Text>
      )}
    </group>
  );
}

// ---- Confidence Gauge ----

function ConfidenceGauge({
  confidence,
  visible,
}: {
  confidence: number;
  visible: boolean;
}) {
  const needleRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!needleRef.current || !visible) return;
    // Needle angle: -PI/2 (0%) to PI/2 (100%)
    const targetAngle = -Math.PI / 2 + (confidence / 100) * Math.PI;
    needleRef.current.rotation.z = THREE.MathUtils.lerp(
      needleRef.current.rotation.z,
      targetAngle,
      delta * 3
    );
  });

  if (!visible) return null;

  const gaugeColor =
    confidence > 80 ? '#10B981' : confidence > 50 ? '#FBBF24' : '#EF4444';

  return (
    <group position={[0, -1.2, 0]}>
      {/* Arc background */}
      <mesh>
        <torusGeometry args={[0.5, 0.04, 8, 32, Math.PI]} />
        <meshStandardMaterial color="#333333" transparent opacity={0.5} />
      </mesh>
      {/* Colored arc fill */}
      <mesh>
        <torusGeometry args={[0.5, 0.05, 8, 32, Math.PI * (confidence / 100)]} />
        <meshStandardMaterial
          color={gaugeColor}
          emissive={gaugeColor}
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Needle */}
      <mesh ref={needleRef} position={[0, 0, 0.05]} rotation={[0, 0, -Math.PI / 2]}>
        <boxGeometry args={[0.02, 0.45, 0.01]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Center pivot */}
      <mesh position={[0, 0, 0.05]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#ffffff" metalness={0.5} />
      </mesh>
      {/* Label */}
      <Text
        position={[0, -0.15, 0]}
        fontSize={0.08}
        color={gaugeColor}
        anchorX="center"
        anchorY="top"
      >
        {`${confidence}% confident`}
      </Text>
    </group>
  );
}

// ---- Scene ----

function QuestScene({
  items,
  currentIndex,
  found,
  showConfidence,
  captured,
}: Omit<CameraQuest3DProps, 'isMobile'>) {
  let stackCount = 0;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[2, 5, 3]} intensity={0.6} />
      <pointLight position={[0, 1, 2]} intensity={0.3} color="#06B6D4" />

      {/* All cards */}
      {items.map((item, i) => {
        const isActive = i === currentIndex;
        const isFound = found.has(i);
        const offset = isFound ? stackCount++ : 0;
        return (
          <PolaroidCard
            key={i}
            item={item}
            index={i}
            isActive={isActive}
            isFound={isFound}
            stackOffset={offset}
          />
        );
      })}

      {/* Confidence gauge */}
      <ConfidenceGauge
        confidence={items[currentIndex]?.simConfidence || 0}
        visible={showConfidence && captured}
      />

      <Environment preset="night" />

      <EffectComposer>
        <Bloom
          intensity={0.3}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// ---- Main Export ----

export default function CameraQuest3D(props: CameraQuest3DProps) {
  if (props.isMobile) return null;

  return (
    <div
      style={{ width: '100%', height: 200, borderRadius: 12, overflow: 'hidden' }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 2, 4], fov: 40 }}
        frameloop="always"
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <QuestScene {...props} />
      </Canvas>
    </div>
  );
}
```

---

## File 3: `src/components/3d/FutureForge3D.tsx`

```tsx
'use client';

// ================================================================
// FUTURE FORGE 3D — Lab 10 (AI's Future) — v3 Enhanced 3D
// [v3] 3D blueprint table with grid lines
// [v3] Floating skill orbs (selected vs dimmed)
// [v3] Holographic patent card (step 4, slow rotation)
// [v3] Innovation meter as 3D bar
// [v3] Decision 6.5 — Tier 2 Enhanced 3D (~2K triangles)
// ================================================================

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ---- Types ----

interface SkillData {
  name: string;
  emoji: string;
}

interface FutureForge3DProps {
  step: number;
  selectedSkills: Set<string>;
  allSkills: SkillData[];
  problemEmoji: string;
  inventionName: string;
  innovationScore: number;
  isMobile?: boolean;
}

// ---- Blueprint Table ----

function BlueprintTable() {
  const lines = useMemo(() => {
    const pts: number[] = [];
    const xCount = 8;
    const zCount = 6;
    const w = 4;
    const d = 3;
    for (let i = 0; i <= xCount; i++) {
      const x = (i / xCount) * w - w / 2;
      pts.push(x, 0.06, -d / 2, x, 0.06, d / 2);
    }
    for (let j = 0; j <= zCount; j++) {
      const z = (j / zCount) * d - d / 2;
      pts.push(-w / 2, 0.06, z, w / 2, 0.06, z);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geom;
  }, []);

  return (
    <group>
      {/* Table surface */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4, 0.1, 3]} />
        <meshStandardMaterial color="#1a0a2e" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Grid lines */}
      <lineSegments geometry={lines}>
        <lineBasicMaterial color="#D946EF" transparent opacity={0.2} />
      </lineSegments>
    </group>
  );
}

// ---- Skill Orb ----

function SkillOrb({
  skill,
  index,
  isSelected,
  totalSkills,
}: {
  skill: SkillData;
  index: number;
  isSelected: boolean;
  totalSkills: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Arrange in arc above table
  const angle = (index / (totalSkills - 1 || 1)) * Math.PI - Math.PI / 2;
  const radius = 1.8;
  const baseX = Math.cos(angle) * radius;
  const baseZ = Math.sin(angle) * 0.8;
  const baseY = 1.2;

  useFrame((state) => {
    if (!ref.current) return;
    // Bob animation
    ref.current.position.y =
      baseY + Math.sin(state.clock.elapsedTime * 1.5 + index * 0.7) * 0.08;

    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = isSelected
      ? 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.2
      : 0.05;
    mat.opacity = isSelected ? 0.95 : 0.25;

    // Glow ring
    if (glowRef.current) {
      const gMat = glowRef.current.material as THREE.MeshBasicMaterial;
      gMat.opacity = isSelected
        ? 0.3 + Math.sin(state.clock.elapsedTime * 4 + index) * 0.1
        : 0;
    }
  });

  return (
    <group position={[baseX, baseY, baseZ]}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.2, 12, 8]} />
        <meshStandardMaterial
          color={isSelected ? '#D946EF' : '#444444'}
          emissive="#D946EF"
          emissiveIntensity={0.05}
          transparent
          opacity={0.25}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
      {/* Glow ring */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.3, 16]} />
        <meshBasicMaterial
          color="#D946EF"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Emoji label */}
      <Text
        position={[0, -0.35, 0]}
        fontSize={0.09}
        color={isSelected ? '#D946EF' : 'rgba(255,255,255,0.3)'}
        anchorX="center"
        anchorY="top"
      >
        {skill.name}
      </Text>
    </group>
  );
}

// ---- Holographic Patent ----

function HolographicPatent({
  visible,
  inventionName,
  innovationScore,
}: {
  visible: boolean;
  inventionName: string;
  innovationScore: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const planeRef = useRef<THREE.Mesh>(null);
  // Pre-allocate to avoid per-frame GC pressure
  const _targetScale = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    // Slow rotation
    groupRef.current.rotation.y += delta * 0.3;
    // Scale in
    const s = visible ? 1 : 0.001;
    _targetScale.set(s, s, s);
    groupRef.current.scale.lerp(_targetScale, delta * 3);
    // Holographic shimmer
    if (planeRef.current) {
      const mat = planeRef.current.material as THREE.MeshPhysicalMaterial;
      mat.emissiveIntensity = visible
        ? 0.2 + Math.sin(state.clock.elapsedTime * 2) * 0.1
        : 0;
    }
  });

  return (
    <group ref={groupRef} position={[0, 1.8, 0]} scale={[0.001, 0.001, 0.001]}>
      {/* Patent card plane */}
      <mesh ref={planeRef} rotation={[-0.3, 0, 0]}>
        <planeGeometry args={[2.5, 1.5]} />
        <meshPhysicalMaterial
          color="#2a0a4e"
          emissive="#D946EF"
          emissiveIntensity={0.2}
          transparent
          opacity={0.7}
          transmission={0.3}
          clearcoat={1.0}
          roughness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Title */}
      <Text
        position={[0, 0.35, 0.02]}
        fontSize={0.12}
        color="#D946EF"
        anchorX="center"
        anchorY="middle"
        rotation={[-0.3, 0, 0]}
      >
        PATENT APPROVED
      </Text>
      {/* Invention name */}
      <Text
        position={[0, 0.05, 0.02]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        rotation={[-0.3, 0, 0]}
        maxWidth={2}
      >
        {inventionName || 'Untitled'}
      </Text>
      {/* Innovation score */}
      <Text
        position={[0, -0.3, 0.02]}
        fontSize={0.1}
        color={innovationScore >= 80 ? '#10B981' : '#FBBF24'}
        anchorX="center"
        anchorY="middle"
        rotation={[-0.3, 0, 0]}
      >
        {`Innovation: ${innovationScore}/100`}
      </Text>
    </group>
  );
}

// ---- Problem Display ----

function ProblemDisplay({ emoji, visible }: { emoji: string; visible: boolean }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = 0.8 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
    ref.current.scale.setScalar(visible ? 1.2 : 0.001);
  });

  return (
    <group ref={ref} position={[0, 0.8, 0]}>
      <Text fontSize={0.4} anchorX="center" anchorY="middle">
        {emoji}
      </Text>
    </group>
  );
}

// ---- Scene ----

function ForgeScene({
  step,
  selectedSkills,
  allSkills,
  problemEmoji,
  inventionName,
  innovationScore,
}: Omit<FutureForge3DProps, 'isMobile'>) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 6, 3]} intensity={0.5} />
      <pointLight position={[0, 2, 0]} intensity={0.4} color="#D946EF" />

      {/* Blueprint table */}
      <BlueprintTable />

      {/* Problem emoji (step >= 1) */}
      <ProblemDisplay emoji={problemEmoji} visible={step >= 1 && step < 4} />

      {/* Skill orbs (step >= 3) */}
      {allSkills.map((skill, i) => (
        <SkillOrb
          key={skill.name}
          skill={skill}
          index={i}
          isSelected={selectedSkills.has(skill.name)}
          totalSkills={allSkills.length}
        />
      ))}

      {/* Holographic patent (step 4) */}
      <HolographicPatent
        visible={step === 4}
        inventionName={inventionName}
        innovationScore={innovationScore}
      />

      <Environment preset="night" />

      <EffectComposer>
        <Bloom
          intensity={0.4}
          luminanceThreshold={0.5}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// ---- Main Export ----

export default function FutureForge3D(props: FutureForge3DProps) {
  if (props.isMobile) return null;

  return (
    <div
      style={{ width: '100%', height: 220, borderRadius: 12, overflow: 'hidden' }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 4, 4], fov: 45 }}
        frameloop="always"
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 0.5, 0);
        }}
      >
        <ForgeScene {...props} />
      </Canvas>
    </div>
  );
}
```

---

## Part A Summary

| File | Type | Lines | Triangles | Mobile Fallback |
|------|------|-------|-----------|-----------------|
| `src/components/3d/RobotVacuum3D.tsx` | NEW | ~300 | ~3K | CSS emoji grid (existing V2) |
| `src/components/3d/CameraQuest3D.tsx` | NEW | ~300 | ~2K | CSS buttons (existing V2) |
| `src/components/3d/FutureForge3D.tsx` | NEW | ~300 | ~2K | CSS grid BG (existing V2) |

### Decision 6.5 Implementation Summary (7D games)

| Game | Tier | 3D Component | Triangles | Mobile Fallback |
|------|------|-------------|-----------|-----------------|
| Robot Vacuum | Tier 2 | RobotVacuum3D.tsx — 3D isometric room | ~3K | CSS grid only |
| Camera Quest | Tier 2 | CameraQuest3D.tsx — 3D polaroid cards | ~2K | CSS buttons only |
| Future Forge | Tier 2 | FutureForge3D.tsx — 3D blueprint table | ~2K | CSS grid BG only |
| Pixel Investigator | Tier 3 | None (standard 2D polish) | 0 | N/A (2D only) |
| Fool the AI | Tier 3 | None (standard 2D polish) | 0 | N/A (2D only) |

---

## Notes for Build

- All 3 components use `dynamic(() => import(...), { ssr: false })` pattern from parent game files (Part B/C).
- `frameloop="always"` is used because all components have continuous `useFrame` animations (bobbing, lerping, pulsing).
- Each component returns `null` when `isMobile` is true — parent game provides full CSS fallback.
- `@ts-expect-error` on `<line>` element in TrailLine is a known R3F typing limitation (lowercase `line` conflicts with HTML).

**NEXT:** Part B — RobotVacuumGame.tsx + CameraQuestGame.tsx (full standalone replacements with v3 3D integration)
**NEXT:** Part C — FutureForgeGame.tsx + Pixel Investigator (UNCHANGED) + Fool the AI (UNCHANGED) + Verification + Git
