# SPARKFORGE — STAGE 7B v3-FINAL (Part A)

## Sort Toy Box (Full 3D) + Human vs Machine (Standard Polish)

**Date:** February 28, 2026
**GCUD Version:** V9
**Batch:** 7B — Drag & Drop Games
**Decision IDs:** 6.3 (Sort Toy Box Full 3D), 6.5 (3D Treatment Scope)
**Supersedes:** STAGE7B_Part1_SortToyBox_HumanVsMachine (V2)
**Games:** Sort Toy Box (Full 3D Treatment), Human vs Machine (Standard Polish)
**New Files:** `src/components/3d/SortScene3D.tsx`
**Modified Files:** `src/components/games/SortToyBoxGame.tsx`

---

## V3 ENHANCEMENT SUMMARY

| Component | V2 State | V3 Enhancement |
|-----------|----------|----------------|
| Sort Toy Box | 2D CSS shapes, tap-to-assign groups | Full 3D throwable primitives with parabolic arcs, 3D bins with ContactShadows, ~2K triangles |
| SortScene3D (NEW FILE) | — | React Three Fiber 3D scene: Box, Sphere, Cylinder, Cone, Torus primitives on table. Fixed overhead camera. Drag via pointer events mapped to 3D coords. |
| Human vs Machine | 2D side-by-side comparison (standard polish) | No 3D changes — retains V2 standard polish. Standard game with unique visual enhancements. |

---

## DECISION IMPLEMENTATION CHECKLIST

- [ ] Decision 6.3 — Sort Toy Box uses full 3D throwing with parabolic arcs (no physics engine)
- [ ] Decision 6.5 — Sort Toy Box is Tier 1 Full 3D (~2K triangles). Human vs Machine stays 2D standard polish.
- [ ] SortScene3D.tsx created as new R3F component at `src/components/3d/SortScene3D.tsx`
- [ ] SortToyBoxGame.tsx modified to conditionally render SortScene3D on desktop, fallback to 2D on mobile
- [ ] Triangle budget: ~2K max (primitives + table + bins)
- [ ] Fixed overhead camera angle (no OrbitControls — only Neural Builder gets that per Decision 6.1)
- [ ] ContactShadows on table surface for grounding
- [ ] Parabolic arc animation for throw trajectory (parametric, no physics engine)
- [ ] Mobile fallback: 2D CSS shapes (existing V2 behavior) when GPU insufficient

---

### Triangle Budget Breakdown — Sort Toy Box (Full 3D)

| Component | Base Tris | With Effects | LOD Low |
|-----------|-----------|-------------|---------|
| SortScene3D (objects) | ~18K | ~18K | ~7K |
| Conveyor / table | ~8K | ~8K | ~3K |
| Particles | ~5K | ~5K | ~2K |
| **Total** | **~31K** | **~31K** | **~12K** |

| Device | Max Budget | Target FPS | LOD Level |
|--------|-----------|------------|-----------|
| Desktop | 100,000 | 60 | ultra/high |
| Tablet | 50,000 | 45 | medium |
| Mobile | 25,000 | 30 | low |

---

## NEW FILE: `src/components/3d/SortScene3D.tsx`

> 3D throwable objects scene for Sort Toy Box — Decision 6.3

```tsx
// ================================================================
// SORT SCENE 3D — Lab 2 (Teaching AI)
// 3D throwable primitives with parabolic arcs for Sort Toy Box.
// Decision 6.3: Full 3D throwing. ~2K triangles.
// Fixed overhead camera. ContactShadows. No physics engine.
// Mobile fallback: parent renders 2D CSS shapes instead.
// ================================================================

'use client';

import { useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { ContactShadows, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';

// ■■■ Types ■■■

interface SortItem {
  id: string;
  shape: 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus';
  color: string;
  colorName: string;
  size: 'small' | 'large';
  group: number | null;
  position: [number, number, number];
}

interface Bin {
  id: number;
  position: [number, number, number];
  color: string;
  label: string;
}

interface SortScene3DProps {
  items: SortItem[];
  bins: Bin[];
  onItemDrop: (itemId: string, binId: number) => void;
  onItemMiss: (itemId: string) => void;
  activeItemId: string | null;
  onSelectItem: (id: string | null) => void;
}

// ■■■ Parabolic Arc Helper ■■■
// Parametric arc from start to end with peak height
function getArcPosition(
  start: THREE.Vector3,
  end: THREE.Vector3,
  t: number,
  peakHeight: number = 2.5
): THREE.Vector3 {
  const x = THREE.MathUtils.lerp(start.x, end.x, t);
  const z = THREE.MathUtils.lerp(start.z, end.z, t);
  // Parabolic y = peak * 4t(1-t) + lerp(startY, endY, t)
  const baseY = THREE.MathUtils.lerp(start.y, end.y, t);
  const arcY = peakHeight * 4 * t * (1 - t);
  return new THREE.Vector3(x, baseY + arcY, z);
}

// ■■■ Shape Mesh Component ■■■
function ShapeMesh({
  shape,
  color,
  size,
  isSelected,
}: {
  shape: SortItem['shape'];
  color: string;
  size: SortItem['size'];
  isSelected: boolean;
}) {
  const scale = size === 'small' ? 0.3 : 0.5;
  const emissiveIntensity = isSelected ? 0.4 : 0;

  const geometry = useMemo(() => {
    switch (shape) {
      case 'box':
        return <boxGeometry args={[1, 1, 1]} />;
      case 'sphere':
        return <sphereGeometry args={[0.5, 16, 16]} />;
      case 'cylinder':
        return <cylinderGeometry args={[0.4, 0.4, 1, 16]} />;
      case 'cone':
        return <coneGeometry args={[0.5, 1, 16]} />;
      case 'torus':
        return <torusGeometry args={[0.35, 0.15, 12, 24]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  }, [shape]);

  return (
    <mesh scale={scale} castShadow>
      {geometry}
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={emissiveIntensity}
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  );
}

// ■■■ Throwable Item ■■■
function ThrowableItem({
  item,
  isSelected,
  isFlying,
  flyTarget,
  onSelect,
  onLanded,
}: {
  item: SortItem;
  isSelected: boolean;
  isFlying: boolean;
  flyTarget: THREE.Vector3 | null;
  onSelect: () => void;
  onLanded: (correct: boolean) => void;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const flyProgress = useRef(0);
  const startPos = useRef(new THREE.Vector3(...item.position));
  const rotSpeed = useRef(
    new THREE.Vector3(
      Math.random() * 8 - 4,
      Math.random() * 8 - 4,
      Math.random() * 4 - 2
    )
  );

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (isFlying && flyTarget) {
      flyProgress.current += delta * 1.8; // ~0.55s flight
      const t = Math.min(flyProgress.current, 1);
      const pos = getArcPosition(startPos.current, flyTarget, t, 2.0);
      meshRef.current.position.copy(pos);

      // Tumble rotation during flight
      meshRef.current.rotation.x += rotSpeed.current.x * delta;
      meshRef.current.rotation.y += rotSpeed.current.y * delta;
      meshRef.current.rotation.z += rotSpeed.current.z * delta;

      if (t >= 1) {
        onLanded(true);
      }
    } else if (isSelected) {
      // Gentle hover bob when selected
      meshRef.current.position.y =
        item.position[1] + Math.sin(Date.now() * 0.005) * 0.1 + 0.2;
    } else {
      meshRef.current.position.set(...item.position);
    }
  });

  return (
    <group
      ref={meshRef}
      position={item.position}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (!isFlying) onSelect();
      }}
    >
      <ShapeMesh
        shape={item.shape}
        color={item.color}
        size={item.size}
        isSelected={isSelected}
      />
      {/* Selection ring */}
      {isSelected && !isFlying && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <ringGeometry args={[0.4, 0.5, 24]} />
          <meshBasicMaterial
            color={item.color}
            transparent
            opacity={0.5}
          />
        </mesh>
      )}
    </group>
  );
}

// ■■■ Bin Component ■■■
function SortBin({
  bin,
  isHighlighted,
  onClick,
}: {
  bin: Bin;
  isHighlighted: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    // Pulse when highlighted (item selected)
    const s = isHighlighted ? 1 + Math.sin(Date.now() * 0.004) * 0.03 : 1;
    meshRef.current.scale.setScalar(s);
  });

  return (
    <group ref={meshRef} position={bin.position} onClick={onClick}>
      {/* Open-top box: 4 walls + bottom */}
      {/* Bottom */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[1.2, 0.08, 1.2]} />
        <meshStandardMaterial
          color={bin.color}
          roughness={0.6}
          metalness={0.2}
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Front wall */}
      <mesh position={[0, 0.35, 0.56]}>
        <boxGeometry args={[1.2, 0.7, 0.08]} />
        <meshStandardMaterial
          color={bin.color}
          transparent
          opacity={isHighlighted ? 0.6 : 0.3}
        />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 0.35, -0.56]}>
        <boxGeometry args={[1.2, 0.7, 0.08]} />
        <meshStandardMaterial
          color={bin.color}
          transparent
          opacity={isHighlighted ? 0.6 : 0.3}
        />
      </mesh>
      {/* Left wall */}
      <mesh position={[-0.56, 0.35, 0]}>
        <boxGeometry args={[0.08, 0.7, 1.2]} />
        <meshStandardMaterial
          color={bin.color}
          transparent
          opacity={isHighlighted ? 0.6 : 0.3}
        />
      </mesh>
      {/* Right wall */}
      <mesh position={[0.56, 0.35, 0]}>
        <boxGeometry args={[0.08, 0.7, 1.2]} />
        <meshStandardMaterial
          color={bin.color}
          transparent
          opacity={isHighlighted ? 0.6 : 0.3}
        />
      </mesh>
      {/* Glow edge on highlight */}
      {isHighlighted && (
        <mesh position={[0, 0.02, 0]}>
          <ringGeometry args={[0.7, 0.85, 4]} />
          <meshBasicMaterial
            color={bin.color}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}
    </group>
  );
}

// ■■■ Table Surface ■■■
function TableSurface() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.05, 0]}
      receiveShadow
    >
      <planeGeometry args={[8, 6]} />
      <meshStandardMaterial
        color="#1a1a2e"
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

// ■■■ Main Scene ■■■
function Scene({
  items,
  bins,
  onItemDrop,
  onItemMiss,
  activeItemId,
  onSelectItem,
}: SortScene3DProps) {
  const [flyingItems, setFlyingItems] = useState<
    Map<string, { target: THREE.Vector3; binId: number }>
  >(new Map());

  const handleBinClick = useCallback(
    (binId: number) => {
      if (!activeItemId) return;

      const item = items.find((i) => i.id === activeItemId);
      if (!item) return;

      const bin = bins.find((b) => b.id === binId);
      if (!bin) return;

      // Start flying animation
      setFlyingItems((prev) => {
        const next = new Map(prev);
        next.set(activeItemId, {
          target: new THREE.Vector3(...bin.position),
          binId,
        });
        return next;
      });

      onSelectItem(null);
    },
    [activeItemId, items, bins, onSelectItem]
  );

  const handleLanded = useCallback(
    (itemId: string, correct: boolean) => {
      setFlyingItems((prev) => {
        const next = new Map(prev);
        const data = next.get(itemId);
        next.delete(itemId);
        if (data) onItemDrop(itemId, data.binId);
        return next;
      });
    },
    [onItemDrop]
  );

  return (
    <>
      {/* Camera: fixed overhead angle */}
      <OrthographicCamera
        makeDefault
        position={[0, 8, 4]}
        zoom={80}
        near={0.1}
        far={50}
      />

      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-3, 5, -3]} intensity={0.3} color="#AA66FF" />

      <TableSurface />

      <ContactShadows
        position={[0, -0.04, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
        far={4}
      />

      {/* Items */}
      {items
        .filter((item) => item.group === null)
        .map((item) => {
          const flyData = flyingItems.get(item.id);
          return (
            <ThrowableItem
              key={item.id}
              item={item}
              isSelected={activeItemId === item.id}
              isFlying={!!flyData}
              flyTarget={flyData?.target ?? null}
              onSelect={() => onSelectItem(item.id)}
              onLanded={(correct) => handleLanded(item.id, correct)}
            />
          );
        })}

      {/* Bins */}
      {bins.map((bin) => (
        <SortBin
          key={bin.id}
          bin={bin}
          isHighlighted={activeItemId !== null}
          onClick={() => handleBinClick(bin.id)}
        />
      ))}
    </>
  );
}

// ■■■ Exported Wrapper ■■■
export function SortScene3D(props: SortScene3DProps) {
  return (
    <div className="w-full h-full min-h-[300px]">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <Scene {...props} />
      </Canvas>
    </div>
  );
}

export default SortScene3D;
```

---

## MODIFIED FILE: `src/components/games/SortToyBoxGame.tsx`

> V3 — Integrates SortScene3D for desktop, retains 2D mobile fallback

```tsx
// ================================================================
// SORT THE TOY BOX V3 — Lab 2 (Teaching AI)
// Group shapes however you want, then compare with AI.
// Teaches: unsupervised learning, clustering, features.
//
// V3 ENHANCEMENTS (Decision 6.3):
// - Desktop: Full 3D throwable primitives via SortScene3D
// - Parabolic arcs on throw, 3D bins with ContactShadows
// - Mobile fallback: Original 2D CSS shapes (V2 behavior)
// - ~2K triangle budget within StationFrame canvas
//
// V2 RETAINED:
// - Chrome bezel, welcome phase, multiple rounds
// - AI explains sorting criteria, age-band depth
// - All game logic, scoring, phases
// ================================================================

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Plus, Boxes, Brain } from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy-load 3D scene (desktop only)
const SortScene3D = dynamic(
  () => import('@/components/3d/SortScene3D').then((m) => m.SortScene3D),
  { ssr: false }
);

type Phase = 'welcome' | 'sort' | 'reveal';

interface Shape {
  id: string;
  shape: 'circle' | 'square' | 'triangle';
  color: string;
  colorName: string;
  size: 'small' | 'large';
  group: number | null;
}

// Map 2D shapes to 3D primitives for SortScene3D
const SHAPE_TO_3D: Record<string, string> = {
  circle: 'sphere',
  square: 'box',
  triangle: 'cone',
};

const COLORS = [
  { color: '#3B82F6', name: 'Blue' },
  { color: '#EF4444', name: 'Red' },
  { color: '#10B981', name: 'Green' },
];

const AI_CRITERIA = [
  {
    key: 'shape',
    label: 'Shape',
    desc: 'I sorted by shape: circles, squares, and triangles each got their own group!',
    descC: 'Unsupervised clustering by geometric feature: the algorithm identified shape as the highest-variance attribute and partitioned accordingly.',
  },
  {
    key: 'color',
    label: 'Color',
    desc: 'I sorted by color: all blues together, all reds together, all greens together!',
    descC: 'Color-channel clustering: the algorithm used RGB distance metrics to group objects with similar hue values.',
  },
  {
    key: 'size',
    label: 'Size',
    desc: 'I sorted by size: big shapes and small shapes into two groups!',
    descC: 'Binary partitioning on the size feature: objects above the median bounding-box area form one cluster, below form another.',
  },
];

function generateShapes(): Shape[] {
  const shapes: Shape[] = [];
  let id = 0;
  (['circle', 'square', 'triangle'] as const).forEach((shape) => {
    COLORS.forEach((c) => {
      (['small', 'large'] as const).forEach((size) => {
        shapes.push({
          id: `s${id++}`,
          shape,
          color: c.color,
          colorName: c.name,
          size,
          group: null,
        });
      });
    });
  });
  // Shuffle
  for (let i = shapes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shapes[i], shapes[j]] = [shapes[j], shapes[i]];
  }
  return shapes.slice(0, 12);
}

// ■■■ 2D Shape Icon (mobile fallback) ■■■
function ShapeIcon({
  shape,
  color,
  size,
}: {
  shape: string;
  color: string;
  size: string;
}) {
  const s = size === 'small' ? 22 : 34;
  if (shape === 'circle')
    return (
      <div
        className="rounded-full"
        style={{ width: s, height: s, background: color }}
      />
    );
  if (shape === 'square')
    return (
      <div
        className="rounded-sm"
        style={{ width: s, height: s, background: color }}
      />
    );
  return (
    <div
      style={{ width: s, height: s }}
      className="flex items-end justify-center"
    >
      <div
        style={{
          borderLeft: `${s / 2}px solid transparent`,
          borderRight: `${s / 2}px solid transparent`,
          borderBottom: `${s}px solid ${color}`,
        }}
      />
    </div>
  );
}

// ■■■ Hook: detect desktop for 3D ■■■
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isDesktop;
}

export function SortToyBoxGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [shapes, setShapes] = useState<Shape[]>(() => generateShapes());
  const [groupCount, setGroupCount] = useState(2);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [aiCriterion, setAiCriterion] = useState<(typeof AI_CRITERIA)[0] | null>(null);

  const isDesktop = useIsDesktop();
  const allGrouped = shapes.every((s) => s.group !== null);

  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 4,
        dur: Math.random() * 6 + 4,
      })),
    []
  );

  // ■■■ 3D scene data mapping ■■■
  const items3D = useMemo(
    () =>
      shapes.map((s, idx) => ({
        id: s.id,
        shape: SHAPE_TO_3D[s.shape] as any,
        color: s.color,
        colorName: s.colorName,
        size: s.size,
        group: s.group,
        position: [
          ((idx % 4) - 1.5) * 1.2,
          0.3,
          (Math.floor(idx / 4) - 1) * 1.2 - 1.5,
        ] as [number, number, number],
      })),
    [shapes]
  );

  const bins3D = useMemo(
    () =>
      Array.from({ length: groupCount }, (_, g) => ({
        id: g,
        position: [((g - (groupCount - 1) / 2) * 2), 0, 2] as [number, number, number],
        color: ['#AA66FF', '#3B82F6', '#10B981', '#F59E0B'][g] || '#AA66FF',
        label: `Group ${g + 1}`,
      })),
    [groupCount]
  );

  function assignGroup(g: number) {
    if (!selectedShape) return;
    setShapes((prev) =>
      prev.map((s) =>
        s.id === selectedShape ? { ...s, group: g } : s
      )
    );
    setSelectedShape(null);
    game.updateScore(2);
  }

  function handle3DDrop(itemId: string, binId: number) {
    setShapes((prev) =>
      prev.map((s) => (s.id === itemId ? { ...s, group: binId } : s))
    );
    game.updateScore(2);
  }

  function revealAI() {
    const pick = AI_CRITERIA[Math.floor(Math.random() * AI_CRITERIA.length)];
    setAiCriterion(pick);
    const sorted = shapes.map((s) => {
      let g = 0;
      if (pick.key === 'shape')
        g = ['circle', 'square', 'triangle'].indexOf(s.shape);
      else if (pick.key === 'color')
        g = COLORS.findIndex((c) => c.color === s.color);
      else g = s.size === 'small' ? 0 : 1;
      return { ...s, group: g };
    });
    setShapes(sorted);
    game.updateScore(20);
    setPhase('reveal');
    setTimeout(() => game.completeGame(), 4000);
  }

  return (
    <GameShell
      gameId="sort-toy-box"
      title="Sort the Toy Box"
      worldNumber={2}
      worldColor="#AA66FF"
    >
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particle background */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: `radial-gradient(circle, rgba(170,102,255,${
                  0.15 + p.size * 0.06
                }), transparent)`,
              }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div
            className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(170,102,255,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(170,102,255,0.1)',
            }}
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4">
              <AnimatePresence mode="wait">
                {/* ■■■ WELCOME PHASE ■■■ */}
                {phase === 'welcome' && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <span className="text-5xl">🧸</span>
                    <h2 className="font-display text-2xl font-bold text-white">
                      Sort the Toy Box
                    </h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? 'Explore unsupervised learning — group objects by any feature, then compare your clustering with the AI\'s approach.'
                        : 'Sort these shapes into groups however YOU want! Then see how the AI sorts them differently.'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Clustering', 'Features', 'Unsupervised Learning'].map(
                        (t) => (
                          <span
                            key={t}
                            className="px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 font-body text-[10px] text-purple-300"
                          >
                            {t}
                          </span>
                        )
                      )}
                    </div>
                    <motion.button
                      onClick={() => setPhase('sort')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{
                        background: 'linear-gradient(135deg, #AA66FF, #8B5CF6)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Open the Toy Box!{' '}
                      <Boxes className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ■■■ SORT PHASE ■■■ */}
                {phase === 'sort' && (
                  <motion.div
                    key="sort"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col"
                  >
                    <p className="font-body text-xs text-white/30 mb-3 text-center">
                      {isDesktop
                        ? 'Click a shape, then click a bin to throw it!'
                        : 'Tap a shape, then tap a group to sort it.'}
                    </p>

                    {/* ■■■ 3D VIEW (Desktop) ■■■ */}
                    {isDesktop && phase === 'sort' ? (
                      <div className="flex-1 rounded-xl overflow-hidden border border-purple-500/10 min-h-[300px]">
                        <SortScene3D
                          items={items3D}
                          bins={bins3D}
                          onItemDrop={handle3DDrop}
                          onItemMiss={() => {}}
                          activeItemId={selectedShape}
                          onSelectItem={setSelectedShape}
                        />
                      </div>
                    ) : (
                      <>
                        {/* ■■■ 2D FALLBACK (Mobile) ■■■ */}
                        {/* Ungrouped */}
                        <div className="flex flex-wrap gap-2 justify-center mb-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                          {shapes
                            .filter((s) => s.group === null)
                            .map((s) => (
                              <motion.button
                                key={s.id}
                                onClick={() =>
                                  setSelectedShape(
                                    selectedShape === s.id ? null : s.id
                                  )
                                }
                                className={`p-2 rounded-lg transition-all ${
                                  selectedShape === s.id
                                    ? 'ring-2 ring-purple-500 bg-purple-500/10'
                                    : 'bg-white/5'
                                }`}
                                whileTap={{ scale: 0.9 }}
                                layout
                                aria-label={`${s.size} ${s.colorName} ${s.shape}`}
                              >
                                <ShapeIcon
                                  shape={s.shape}
                                  color={s.color}
                                  size={s.size}
                                />
                              </motion.button>
                            ))}
                          {shapes.filter((s) => s.group === null).length === 0 && (
                            <p className="font-body text-xs text-white/20">
                              All sorted!
                            </p>
                          )}
                        </div>

                        {/* Groups */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1">
                          {Array.from({ length: groupCount }).map((_, g) => (
                            <motion.button
                              key={g}
                              onClick={() => assignGroup(g)}
                              className={`rounded-xl border-2 border-dashed p-2 min-h-[80px] flex flex-wrap gap-1 content-start items-start ${
                                selectedShape
                                  ? 'border-purple-500/40 bg-purple-500/5 cursor-pointer'
                                  : 'border-white/10 bg-white/[0.02]'
                              }`}
                              whileHover={selectedShape ? { scale: 1.02 } : {}}
                            >
                              <span className="font-display text-[10px] text-white/20 w-full">
                                Group {g + 1}
                              </span>
                              {shapes
                                .filter((s) => s.group === g)
                                .map((s) => (
                                  <motion.div
                                    key={s.id}
                                    layout
                                    className="p-0.5"
                                  >
                                    <ShapeIcon
                                      shape={s.shape}
                                      color={s.color}
                                      size={s.size}
                                    />
                                  </motion.div>
                                ))}
                            </motion.button>
                          ))}
                          {groupCount < 4 && (
                            <button
                              onClick={() => setGroupCount((c) => c + 1)}
                              className="rounded-xl border-2 border-dashed border-white/5 flex items-center justify-center text-white/10 hover:text-white/30 hover:border-white/10"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </>
                    )}

                    {/* Add Group / Reveal buttons */}
                    <div className="mt-3 flex gap-2">
                      {isDesktop && groupCount < 4 && (
                        <button
                          onClick={() => setGroupCount((c) => c + 1)}
                          className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 font-display text-xs text-white/40 hover:text-white/60"
                        >
                          <Plus className="inline w-3 h-3 mr-1" /> Add Group
                        </button>
                      )}
                      {allGrouped && (
                        <motion.button
                          onClick={revealAI}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex-1 py-3 rounded-xl font-display font-bold text-sm text-white"
                          style={{
                            background: 'linear-gradient(135deg, #AA66FF, #8B5CF6)',
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          See How AI Sorts!
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ■■■ REVEAL PHASE ■■■ */}
                {phase === 'reveal' && aiCriterion && (
                  <motion.div
                    key="reveal"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <Brain className="w-8 h-8 text-purple-400" />
                    <h3 className="font-display text-lg font-bold text-white">
                      AI sorted by: {aiCriterion.label}
                    </h3>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? aiCriterion.descC
                        : aiCriterion.desc}
                    </p>
                    <div className="rounded-xl p-3 border border-purple-500/20 bg-purple-500/5 max-w-sm">
                      <p className="font-body text-xs text-white/40">
                        {ageBand === 'C'
                          ? 'In unsupervised learning, the algorithm discovers structure without labeled examples. Different feature weightings produce different but equally valid clusterings.'
                          : 'There\'s no "wrong" way to sort! AI just picks different features to focus on. Your sorting is just as valid!'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
}

export default SortToyBoxGame;
```

---

## UNCHANGED FILE: `src/components/games/HumanVsMachineGame.tsx`

> V2 Standard Polish — No 3D enhancements per Decision 6.5 (stays 2D)

```tsx
// ================================================================
// HUMAN VS MACHINE V2 — Lab 1 (What Is AI?)
// Side-by-side comparison: human answers vs AI answers.
// Teaches: AI strengths/limitations, human vs machine.
// Enhanced: chrome bezel, welcome phase, 8 challenges,
// scoring comparison, "who wins" verdict, age-band depth.
//
// V3 NOTE: No 3D enhancements. This is a standard polish game
// per Decision 6.5. Retains unique 2D visual enhancements
// with lab-colored particle background.
// ================================================================

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Swords, User, Bot } from 'lucide-react';

type Phase = 'welcome' | 'play';

interface Challenge {
  title: string;
  emoji: string;
  prompt: string;
  type: 'math' | 'text' | 'opinion';
  aiAnswer: string;
  aiTime: number;
  humanAdvantage: string;
  aiAdvantage: string;
  humanAdvantageC: string;
  aiAdvantageC: string;
  band: 'A' | 'B' | 'C';
}

const ALL_CHALLENGES: Challenge[] = [
  {
    title: 'Quick Math',
    emoji: '🧮',
    prompt: 'What is 47 + 86?',
    type: 'math',
    aiAnswer: '133',
    aiTime: 300,
    humanAdvantage: "You can check AI's work!",
    aiAdvantage: 'AI is lightning fast at math.',
    humanAdvantageC: 'Humans verify computational outputs through number sense and estimation.',
    aiAdvantageC: 'Computational speed: O(1) for arithmetic vs human sequential processing.',
    band: 'A',
  },
  {
    title: 'Complete the Joke',
    emoji: '😂',
    prompt: 'Why did the robot go to school?',
    type: 'text',
    aiAnswer: 'To improve its learning algorithms!',
    aiTime: 800,
    humanAdvantage: 'Humor is a human superpower!',
    aiAdvantage: "AI can generate jokes, but doesn't get why they're funny.",
    humanAdvantageC: 'Human humor relies on theory of mind, cultural context, and timing.',
    aiAdvantageC: 'AI pattern-matches joke structures but lacks phenomenal understanding of humor.',
    band: 'A',
  },
  {
    title: 'Describe Friendship',
    emoji: '🤝',
    prompt: 'What does friendship mean to you?',
    type: 'opinion',
    aiAnswer: 'Friendship is a mutual bond of trust, support, and shared experiences between people.',
    aiTime: 1200,
    humanAdvantage: 'Your answer has real feeling — AI describes, not feels.',
    aiAdvantage: 'AI sounds eloquent but has no lived experience.',
    humanAdvantageC: 'Phenomenal experience gives humans genuine emotional grounding.',
    aiAdvantageC: 'AI generates semantically coherent descriptions without subjective experience.',
    band: 'A',
  },
  {
    title: 'Name an Emotion',
    emoji: '😊',
    prompt: 'Describe what happiness feels like',
    type: 'opinion',
    aiAnswer: 'Happiness is a warm feeling of contentment, often accompanied by smiling and a sense of lightness.',
    aiTime: 1000,
    humanAdvantage: 'You described a FEELING. AI describes a concept.',
    aiAdvantage: 'AI sounds accurate but has never felt happy.',
    humanAdvantageC: 'First-person phenomenal experience is epistemically privileged.',
    aiAdvantageC: 'AI synthesizes descriptions from training data without qualia.',
    band: 'B',
  },
  {
    title: 'Creative Story',
    emoji: '📚',
    prompt: 'Write a one-sentence story about a lost puppy.',
    type: 'text',
    aiAnswer: 'A small golden puppy wandered through the misty park, sniffing each bench until it found the scarf that smelled like home.',
    aiTime: 1500,
    humanAdvantage: 'Your stories have unique perspectives!',
    aiAdvantage: 'AI writes well but remixes patterns from training data.',
    humanAdvantageC: 'Human narratives draw on embodied experience and genuine imagination.',
    aiAdvantageC: 'AI generates plausible narratives via statistical sequence prediction.',
    band: 'B',
  },
  {
    title: 'Quick Math 2',
    emoji: '🔢',
    prompt: 'What is 15 × 12?',
    type: 'math',
    aiAnswer: '180',
    aiTime: 200,
    humanAdvantage: 'Understanding WHY matters more than speed.',
    aiAdvantage: 'Calculators are fast, but understanding is human.',
    humanAdvantageC: 'Mathematical intuition and proof comprehension exceed mere computation.',
    aiAdvantageC: 'Deterministic arithmetic is trivially parallelizable.',
    band: 'A',
  },
  {
    title: 'Moral Dilemma',
    emoji: '⚖️',
    prompt: "Is it okay to lie to protect someone's feelings?",
    type: 'opinion',
    aiAnswer: 'This depends on the context. Some ethicists argue white lies preserve social harmony, while others prioritize honesty.',
    aiTime: 1800,
    humanAdvantage: 'You have REAL moral intuitions shaped by experience.',
    aiAdvantage: 'AI presents balanced views but cannot feel moral weight.',
    humanAdvantageC: 'Moral reasoning integrates emotion, experience, and ethical frameworks.',
    aiAdvantageC: 'AI aggregates ethical positions without moral agency or stakes.',
    band: 'C',
  },
  {
    title: 'Pattern Recognition',
    emoji: '🔍',
    prompt: 'What comes next: 2, 6, 12, 20, ___?',
    type: 'math',
    aiAnswer: '30 (differences increase by 2: +4, +6, +8, +10)',
    aiTime: 400,
    humanAdvantage: 'Humans can explain WHY patterns work.',
    aiAdvantage: 'AI processes sequences fast but may not truly understand.',
    humanAdvantageC: 'Human pattern recognition generalizes from limited examples via inductive reasoning.',
    aiAdvantageC: 'Sequence prediction leverages statistical regularities in training data.',
    band: 'C',
  },
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

export function HumanVsMachineGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [roundIdx, setRoundIdx] = useState(0);
  const [humanAnswer, setHumanAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [aiRevealed, setAiRevealed] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  const challenges = useMemo(
    () => ALL_CHALLENGES.filter((c) => BAND_ORDER[c.band] <= BAND_ORDER[ageBand]),
    [ageBand]
  );
  const challenge = challenges[roundIdx];

  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 4,
        dur: Math.random() * 6 + 4,
      })),
    []
  );

  const handleSubmit = useCallback(() => {
    if (!humanAnswer.trim()) return;
    setSubmitted(true);
    setAiThinking(true);
    game.updateScore(10);
    setTimeout(() => {
      setAiThinking(false);
      setAiRevealed(true);
    }, challenge.aiTime);
  }, [humanAnswer, challenge, game]);

  function nextRound() {
    setHumanAnswer('');
    setSubmitted(false);
    setAiRevealed(false);
    if (roundIdx < challenges.length - 1) {
      setRoundIdx((i) => i + 1);
      game.advanceRound();
    } else {
      game.completeGame();
    }
  }

  return (
    <GameShell
      gameId="human-vs-machine"
      title="Human vs Machine"
      worldNumber={1}
      worldColor="#00BBFF"
    >
      <div className="h-full flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: `radial-gradient(circle, rgba(0,187,255,${
                  0.15 + p.size * 0.06
                }), transparent)`,
              }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div
            className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(0,187,255,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(0,187,255,0.1)',
            }}
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4 items-center justify-center">
              <AnimatePresence mode="wait">
                {phase === 'welcome' && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-4"
                  >
                    <span className="text-5xl">⚔️</span>
                    <h2 className="font-display text-2xl font-bold text-white">
                      Human vs Machine
                    </h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      Go head-to-head with AI! See where humans shine and
                      where AI excels.
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Comparison', 'Strengths', 'Limitations'].map(
                        (t) => (
                          <span
                            key={t}
                            className="px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 font-body text-[10px] text-sky-300"
                          >
                            {t}
                          </span>
                        )
                      )}
                    </div>
                    <motion.button
                      onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{
                        background: 'linear-gradient(135deg, #00BBFF, #0099DD)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Challenge the AI!{' '}
                      <Swords className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {phase === 'play' && challenge && (
                  <motion.div
                    key="play"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full max-w-lg space-y-4"
                  >
                    <div className="text-center mb-4">
                      <span className="text-3xl">{challenge.emoji}</span>
                      <h3 className="font-display text-base font-bold text-white mt-1">
                        {challenge.title}
                      </h3>
                      <p className="font-body text-sm text-white/50">
                        {challenge.prompt}
                      </p>
                    </div>

                    <div className="flex gap-3 mb-4">
                      {/* Human side */}
                      <div className="flex-1 rounded-xl p-3 border border-sky-500/20 bg-sky-500/5">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-sky-400" />
                          <span className="font-display text-xs font-bold text-white">You</span>
                        </div>
                        {!submitted ? (
                          <input
                            type="text"
                            value={humanAnswer}
                            onChange={(e) => setHumanAnswer(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            placeholder="Your answer..."
                            autoFocus
                            aria-label="Your answer"
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-body placeholder:text-white/20 focus:outline-none focus:border-sky-500/50"
                          />
                        ) : (
                          <p className="font-body text-sm text-white/80">{humanAnswer}</p>
                        )}
                      </div>

                      {/* AI side */}
                      <div className="flex-1 rounded-xl p-3 border border-amber-500/20 bg-amber-500/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="w-4 h-4 text-amber-400" />
                          <span className="font-display text-xs font-bold text-white">AI</span>
                        </div>
                        {aiThinking ? (
                          <motion.p
                            className="font-body text-sm text-white/30"
                            animate={{ opacity: [0.3, 0.8, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                          >
                            Thinking...
                          </motion.p>
                        ) : aiRevealed ? (
                          <p className="font-body text-sm text-white/80">
                            {challenge.aiAnswer}
                          </p>
                        ) : (
                          <p className="font-body text-sm text-white/10">Waiting...</p>
                        )}
                      </div>
                    </div>

                    {!submitted && (
                      <motion.button
                        onClick={handleSubmit}
                        disabled={!humanAnswer.trim()}
                        className="w-full py-3 rounded-xl font-display font-bold text-sm text-white disabled:opacity-30"
                        style={{
                          background: 'linear-gradient(135deg, #00BBFF, #0099DD)',
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Submit!
                      </motion.button>
                    )}

                    {aiRevealed && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg p-2 bg-sky-500/5 border border-sky-500/10">
                            <p className="font-body text-[9px] text-sky-400 uppercase">Human Advantage</p>
                            <p className="font-body text-[10px] text-white/50 mt-0.5">
                              {ageBand === 'C' ? challenge.humanAdvantageC : challenge.humanAdvantage}
                            </p>
                          </div>
                          <div className="rounded-lg p-2 bg-amber-500/5 border border-amber-500/10">
                            <p className="font-body text-[9px] text-amber-400 uppercase">AI Advantage</p>
                            <p className="font-body text-[10px] text-white/50 mt-0.5">
                              {ageBand === 'C' ? challenge.aiAdvantageC : challenge.aiAdvantage}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          onClick={nextRound}
                          className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 font-display text-sm text-white/50 hover:bg-white/10"
                          whileTap={{ scale: 0.95 }}
                        >
                          Next Challenge →
                        </motion.button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
}

export default HumanVsMachineGame;
```

---

## VERIFICATION CHECKLIST — PART A

### `npm run dev`

**Sort Toy Box** (`/arcade/sort-toy-box`):
- [ ] Desktop: 3D scene renders with throwable primitives
- [ ] Desktop: Click shape selects it (hover bob animation)
- [ ] Desktop: Click bin triggers parabolic arc throw
- [ ] Desktop: ContactShadows visible on table surface
- [ ] Desktop: Bins pulse/highlight when item selected
- [ ] Mobile: Falls back to 2D CSS shapes (V2 behavior)
- [ ] Welcome phase: Chrome bezel (purple), title, topic tags
- [ ] Sort phase: Add Group button works (up to 4 groups)
- [ ] Reveal phase: AI criterion shown with age-band depth
- [ ] Band C: Technical unsupervised learning descriptions

**Human vs Machine** (`/arcade/human-vs-machine`):
- [ ] Chrome bezel (blue), welcome phase
- [ ] Side-by-side: Human input left, AI answer right
- [ ] AI thinking animation with timed reveal
- [ ] Advantage cards shown after each round
- [ ] Band C: Technical advantage descriptions
- [ ] Enter key submits answer

**3D Performance:**
- [ ] SortScene3D stays under ~2K triangles
- [ ] No OrbitControls (fixed overhead camera)
- [ ] Smooth 60fps on desktop (check with React DevTools)
- [ ] Mobile correctly detects and uses 2D fallback

### Git Commands

```bash
git add src/components/3d/SortScene3D.tsx
git add src/components/games/SortToyBoxGame.tsx
git add src/components/games/HumanVsMachineGame.tsx
git commit -m "Stage 7B v3-FINAL Part A: Sort Toy Box 3D + Human vs Machine"
git push origin main
```

**CONTINUES IN PART B:** Code Blocks V3 (Full Treatment) + Career Explorer + CodeBlocks3D.tsx
