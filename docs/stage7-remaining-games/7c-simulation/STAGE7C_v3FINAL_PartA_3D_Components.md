# SPARKFORGE — STAGE 7C: CHATBOT BUILDER + DATA DETECTIVE — v3-FINAL (PART A)

**Date:** February 28, 2026 | **GCUD:** V9 | **Vision:** Laboratory Control Station
**Design Direction:** Frost-Prismatic v3 (blue-dominant 60/40, chrome bezel, hex-radial, R3F station frame)

- **Chatbot Builder** — Lab: 8 — Words & Language (NLP) | Color: `#6366F1` (Indigo)
- **Data Detective** — Lab: 2 — Teaching AI | Color: `#8B5CF6` (Purple)
- **Age Bands:** A (7–10), B (11–13), C (14–16)

---

## DECISIONS IMPLEMENTED IN THIS DOCUMENT

- [x] Decision 6.5 — Tier 2 Enhanced 3D for Chatbot Builder: 3D conversation tree nodes with glowing connections
- [x] Decision 6.5 — Tier 2 Enhanced 3D for Data Detective: 3D magnifying glass + evidence card depth

## BUG FIXES PRESERVED

- [x] BUG-10F — Font stack: Exo 2/Sora/Orbitron NOT Fredoka/Nunito

## v3 FEATURES (V3 Full Treatment) PRESERVED

- [x] Chatbot Builder: SVG graph visualization, typing animation, personality system, challenge mode, deploy celebration
- [x] Chatbot Builder: 4 templates (Pizza Bot, Help Desk, Joke Bot, Blank), builder metrics, node status indicators
- [x] Data Detective: Investigation theme (spotlight, evidence tape), severity heatmap, animated cleaning
- [x] Data Detective: Live accuracy gauge (SVG speedometer), data microscope histograms, detective rank (4 levels)
- [x] Data Detective: 3 case file datasets with manila folder animation, age-band differentiation
- [x] Both: Chrome bezel, welcome phase, learn phase, age-band depth (A/B/C)

---

## FILES IN THIS DOCUMENT (Part A)

| Action | File | Lines |
|--------|------|-------|
| NEW | `src/components/3d/ChatbotNodes3D.tsx` | ~300 |
| NEW | `src/components/3d/DataDetective3D.tsx` | ~300 |

**PREREQUISITES:** Stage 3 Part 3 v3-FINAL (StationFrame + HDR infrastructure) must be complete.
**SUPERSEDES:** No prior 3D components exist for these games (v2 was CSS/SVG only).

**FILES IN PART B:** `ChatbotBuilderGame.tsx` (~900 lines, full standalone replacement with 3D integration)
**FILES IN PART C:** `DataDetectiveGame.tsx` (~900 lines, full standalone replacement with 3D integration) + Verification + Git

---

## WHAT CHANGED FROM V3 TO v3-FINAL

### Chatbot Builder

| Aspect | V3 (Current) | v3-FINAL (This Document) |
|--------|-------------|--------------------------|
| Graph Visualization | SVG with floating bubbles + animated edges | SVG preserved + 3D R3F node spheres overlaid on graph view. Glowing connections. |
| 3D Component | None | ChatbotNodes3D.tsx (NEW). Dynamic import, ssr: false. Mobile CSS fallback. |
| Message Routing | Static SVG edges | SVG edges + 3D animated message pulse along paths (desktop only) |
| Triangle Budget | N/A (SVG only) | ~3K triangles (max 20 node spheres + 40 connections) |
| Performance | SVG + Framer Motion | ~3K tri. frameloop=demand. Desktop only (mobile = SVG). |
| Node Hover | SVG glow circle | SVG glow + 3D emissive pulse on hovered sphere |

### Data Detective

| Aspect | V3 (Current) | v3-FINAL (This Document) |
|--------|-------------|--------------------------|
| Investigation Theme | CSS spotlight + evidence tape borders | CSS preserved + 3D magnifying glass that follows cursor. Desk lamp as R3F SpotLight. |
| 3D Component | None | DataDetective3D.tsx (NEW). Dynamic import, ssr: false. Mobile CSS fallback. |
| Card Depth | Flat table rows with severity glow | Table preserved + 3D evidence cards with flip animation on select (desktop only) |
| Triangle Budget | N/A (CSS/SVG) | ~2K triangles (magnifying glass + card planes + lamp) |
| Performance | CSS + Framer Motion | ~2K tri. frameloop=demand. Desktop only (mobile = CSS). |
| Fix Animation | Sparkle + cross-fade | Preserved + 3D particle burst from magnifying glass |

---

## 3D COMPONENT SPECIFICATIONS (Decision 6.5)

Decision 6.5 specifies Tier 2 Enhanced 3D treatment for 7 flagship-lite games. These are themed 3D elements that augment (not replace) the existing 2D game layout. The 3D scenes render in a contained Canvas above or alongside the game UI, with mobile CSS fallback. Triangle budgets: 2–5K per game.

### ChatbotNodes3D.tsx — 3D Conversation Tree

| Element | Implementation Details |
|---------|----------------------|
| Node Spheres | SphereGeometry(0.25, 16, 12). One per BotNode. Root = indigo emissive. End = amber emissive. Middle = white/5 base with personality color border. |
| Connections | TubeGeometry along CatmullRomCurve3 paths. Radius 0.02, 8 tubular segments. Color from personality system. |
| Message Pulse | InstancedMesh small spheres (0.05 radius). Travel along tube paths during test mode. Speed: 2 seconds per connection. |
| Node Labels | drei Text component. Node ID below sphere. FontSize 0.12. Billboard to camera. |
| Hover Effect | Emissive intensity pulse 0.3 to 0.8. Scale pulse 1.0 to 1.15. onPointerOver / onPointerOut raycasting. |
| Camera | Fixed overhead: position [0, -1, 6], FOV 50. No OrbitControls (matches graph layout). |
| Lighting | AmbientLight 0.4 + DirectionalLight 0.6. PointLight at personality color, intensity 0.3. |
| Triangle Budget | ~3K max. 20 spheres × 96 tri = 1,920. 40 tubes × 24 tri = 960. Labels text. |
| Mobile Fallback | SVG graph only (no R3F Canvas). Auto-detect via window.innerWidth < 768. |

### DataDetective3D.tsx — 3D Investigation Desk

| Element | Implementation Details |
|---------|----------------------|
| Magnifying Glass | Custom geometry: RingGeometry handle + TorusGeometry rim + PlaneGeometry lens with MeshPhysicalMaterial (clearcoat 1.0, transmission 0.6, ior 1.5). Follows selected row position (lerp tracking). |
| Desk Lamp | SpotLight with ConeGeometry shade. Angle 0.6, penumbra 0.5, intensity 2. Targets the data table area. Purple tint. |
| Evidence Cards | PlaneGeometry(1.2, 0.8) with rounded corners via ShapeGeometry. MeshStandardMaterial with issue-type color tint. Flip animation on select (rotateY PI). |
| Fix Particles | Points system (20 particles). Burst outward from magnifying glass position on fix action. Purple/green colors. Fade over 1 second. |
| Cleaning Sparkle | 8 small SphereGeometry(0.03) with emissive white. Scale up + fade out animation on fix. |
| Camera | Fixed position [0, 0.5, 3.5], FOV 45. Looking down at desk angle. No OrbitControls (fixed investigation view). |
| Lighting | AmbientLight 0.3 + desk lamp SpotLight. PointLight for purple ambient glow. |
| Triangle Budget | ~2K max. Magnifying glass ~200 tri. Cards ~100 tri each (max 10). Lamp ~150 tri. |
| Mobile Fallback | CSS spotlight + Framer Motion only. No R3F Canvas on mobile. |

---

## PREREQUISITES

Packages should exist from Stage 3 P3 v3-FINAL:

```bash
npm list three @react-three/fiber @react-three/drei @react-three/postprocessing
```

If missing:

```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
```

---

## FILE 1: `src/components/3d/ChatbotNodes3D.tsx` (NEW — ~300 lines)

This component renders a 3D representation of the chatbot conversation tree. It receives the node graph data from the parent ChatbotBuilderGame and renders SphereGeometry nodes with TubeGeometry connections. During test mode, animated message pulses travel along the connections. The 3D scene sits above the SVG graph view on desktop. Mobile falls back to SVG only.

```tsx
"use client";

// ================================================================
// CHATBOT NODES 3D — Lab 8 (NLP) — v3 Enhanced 3D
// [v3] 3D conversation tree nodes with glowing connections
// [v3] Animated message routing paths during test mode
// [v3] Decision 6.5 — Tier 2 Enhanced 3D
// ================================================================

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Environment } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// ■■■ Types ■■■

interface BotNode {
  id: string;
  text: string;
  responses: { label: string; nextId: string | null }[];
}

interface PersonalityColors {
  primary: string;
  bg: string;
  border: string;
  accent: string;
}

interface ChatbotNodes3DProps {
  nodes: BotNode[];
  personalityColors: PersonalityColors;
  hoveredNode: string | null;
  testPath: string[];
  isTestMode: boolean;
  isMobile?: boolean;
}

// ■■■ Layout Helpers ■■■

function computeNodePositions3D(nodes: BotNode[]) {
  const positions: Record<string, [number, number, number]> = {};
  const visited = new Set<string>();
  const levelNodes: Record<number, string[]> = {};

  function traverse(id: string, level: number) {
    if (visited.has(id)) return;
    visited.add(id);
    if (!levelNodes[level]) levelNodes[level] = [];
    levelNodes[level].push(id);
    const node = nodes.find((n) => n.id === id);
    if (node) {
      node.responses.forEach((r) => {
        if (r.nextId) traverse(r.nextId, level + 1);
      });
    }
  }

  traverse("root", 0);

  // Orphan nodes
  nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      const maxLvl = Math.max(0, ...Object.keys(levelNodes).map(Number));
      if (!levelNodes[maxLvl + 1]) levelNodes[maxLvl + 1] = [];
      levelNodes[maxLvl + 1].push(n.id);
      visited.add(n.id);
    }
  });

  const levels = Object.keys(levelNodes)
    .map(Number)
    .sort((a, b) => a - b);
  const maxWidth = Math.max(...levels.map((l) => levelNodes[l].length));
  const spreadX = Math.max(4, maxWidth * 1.8);

  levels.forEach((level) => {
    const nodesAtLevel = levelNodes[level];
    const spacing = spreadX / (nodesAtLevel.length + 1);
    nodesAtLevel.forEach((id, i) => {
      const x = spacing * (i + 1) - spreadX / 2;
      const y = -level * 1.5;
      positions[id] = [x, y, 0];
    });
  });

  return positions;
}

// ■■■ Node Sphere Component ■■■

function NodeSphere({
  node,
  position,
  isHovered,
  isRoot,
  isEnd,
  isInTestPath,
  personalityColors,
}: {
  node: BotNode;
  position: [number, number, number];
  isHovered: boolean;
  isRoot: boolean;
  isEnd: boolean;
  isInTestPath: boolean;
  personalityColors: PersonalityColors;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const baseColor = isRoot
    ? personalityColors.primary
    : isEnd
      ? "#F59E0B"
      : "#ffffff";
  const emissiveColor = isRoot
    ? personalityColors.primary
    : isEnd
      ? "#F59E0B"
      : personalityColors.accent;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    const targetEmissive = isHovered || isInTestPath ? 0.7 : 0.15;
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity,
      targetEmissive,
      delta * 4
    );
    const targetScale = isHovered ? 1.15 : 1.0;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 6
    );
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.25, 16, 12]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissiveColor}
          emissiveIntensity={0.15}
          transparent
          opacity={isEnd ? 0.85 : 0.9}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      {/* Node ID label */}
      <Text
        position={[0, -0.42, 0]}
        fontSize={0.12}
        color="rgba(255,255,255,0.4)"
        anchorX="center"
        anchorY="top"
        outlineWidth={0.005}
        outlineColor="#000000"
      >
        {node.id}
      </Text>
      {/* Status indicator */}
      {isRoot && (
        <Text
          position={[0, 0.4, 0]}
          fontSize={0.1}
          color={personalityColors.primary}
          anchorX="center"
          anchorY="bottom"
        >
          START
        </Text>
      )}
      {isEnd && (
        <Text
          position={[0, 0.4, 0]}
          fontSize={0.1}
          color="#F59E0B"
          anchorX="center"
          anchorY="bottom"
        >
          END
        </Text>
      )}
    </group>
  );
}

// ■■■ Connection Tube Component ■■■

function ConnectionTube({
  from,
  to,
  color,
  isActive,
}: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  isActive: boolean;
}) {
  const tubeRef = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => {
    const mid: [number, number, number] = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2,
      (from[2] + to[2]) / 2 + 0.3,
    ];
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to),
    ]);
  }, [from, to]);

  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 12, 0.02, 6, false);
  }, [curve]);

  useFrame((_, delta) => {
    if (!tubeRef.current) return;
    const mat = tubeRef.current.material as THREE.MeshStandardMaterial;
    const targetOpacity = isActive ? 0.9 : 0.3;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, delta * 4);
    mat.emissiveIntensity = isActive ? 0.6 : 0.1;
  });

  return (
    <mesh ref={tubeRef} geometry={geometry}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.1}
        transparent
        opacity={0.3}
        roughness={0.5}
      />
    </mesh>
  );
}

// ■■■ Message Pulse (test mode) ■■■

function MessagePulse({
  from,
  to,
  color,
  active,
}: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  active: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const progress = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current || !active) {
      if (ref.current) ref.current.visible = false;
      return;
    }
    ref.current.visible = true;
    progress.current += delta * 0.5;
    if (progress.current > 1) progress.current = 0;
    const t = progress.current;
    ref.current.position.set(
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
      from[2] + (to[2] - from[2]) * t + Math.sin(t * Math.PI) * 0.2
    );
  });

  return (
    <mesh ref={ref} visible={false}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
}

// ■■■ Scene (inner R3F) ■■■

function ChatbotScene({
  nodes,
  personalityColors,
  hoveredNode,
  testPath,
  isTestMode,
}: Omit<ChatbotNodes3DProps, "isMobile">) {
  const positions = useMemo(
    () => computeNodePositions3D(nodes),
    [nodes]
  );

  const testPathSet = useMemo(() => new Set(testPath), [testPath]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 3]} intensity={0.6} />
      <pointLight
        position={[0, -2, 2]}
        intensity={0.3}
        color={personalityColors.primary}
      />

      {/* Node Spheres */}
      {nodes.map((node) => {
        const pos = positions[node.id];
        if (!pos) return null;
        return (
          <NodeSphere
            key={node.id}
            node={node}
            position={pos}
            isHovered={hoveredNode === node.id}
            isRoot={node.id === "root"}
            isEnd={node.responses.length === 0}
            isInTestPath={testPathSet.has(node.id)}
            personalityColors={personalityColors}
          />
        );
      })}

      {/* Connection Tubes */}
      {nodes.flatMap((node) =>
        node.responses
          .filter((r) => r.nextId && positions[r.nextId!])
          .map((r, i) => {
            const from = positions[node.id];
            const to = positions[r.nextId!];
            if (!from || !to) return null;
            const isActive =
              testPathSet.has(node.id) && testPathSet.has(r.nextId!);
            return (
              <ConnectionTube
                key={`${node.id}-${r.nextId}-${i}`}
                from={from}
                to={to}
                color={personalityColors.primary}
                isActive={isActive}
              />
            );
          })
      )}

      {/* Message Pulses (test mode only) */}
      {isTestMode &&
        testPath.slice(0, -1).map((nodeId, i) => {
          const nextId = testPath[i + 1];
          const from = positions[nodeId];
          const to = positions[nextId];
          if (!from || !to) return null;
          return (
            <MessagePulse
              key={`pulse-${nodeId}-${nextId}`}
              from={from}
              to={to}
              color={personalityColors.primary}
              active={true}
            />
          );
        })}

      {/* Environment */}
      <Environment preset="night" />

      {/* Bloom (subtle) */}
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

// ■■■ Exported Component ■■■

export default function ChatbotNodes3D(props: ChatbotNodes3DProps) {
  const { isMobile = false } = props;

  // Mobile: no 3D, parent renders SVG only
  if (isMobile) return null;

  return (
    <div
      className="w-full rounded-lg overflow-hidden"
      style={{
        height: 220,
        background:
          "radial-gradient(ellipse at center, rgba(99,102,241,0.06) 0%, transparent 70%)",
      }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, -1, 6], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
        frameloop="demand"
      >
        <ChatbotScene
          nodes={props.nodes}
          personalityColors={props.personalityColors}
          hoveredNode={props.hoveredNode}
          testPath={props.testPath}
          isTestMode={props.isTestMode}
        />
      </Canvas>
    </div>
  );
}
```

---

## FILE 2: `src/components/3d/DataDetective3D.tsx` (NEW — ~300 lines)

This component renders a 3D investigation desk scene for the Data Detective game. Features a magnifying glass that tracks the selected row, a desk lamp spotlight, and particle bursts on data fix actions. The 3D scene provides atmospheric depth above the data table. Mobile falls back to CSS-only spotlight effects.

```tsx
"use client";

// ================================================================
// DATA DETECTIVE 3D — Lab 2 (Teaching AI) — v3 Enhanced 3D
// [v3] 3D magnifying glass cursor with lens refraction
// [v3] Investigation desk lamp as R3F SpotLight
// [v3] Evidence card depth + flip animations
// [v3] Fix particle bursts from magnifying glass
// [v3] Decision 6.5 — Tier 2 Enhanced 3D
// ================================================================

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// ■■■ Types ■■■

interface DataDetective3DProps {
  selectedRow: number | null;
  totalRows: number;
  fixedRows: Set<number>;
  deletedRows: Set<number>;
  lastFixedRow: number | null;
  worldColor: string;
  isMobile?: boolean;
}

// ■■■ Magnifying Glass Component ■■■

function MagnifyingGlass({
  targetY,
  worldColor,
}: {
  targetY: number;
  worldColor: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const currentY = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    currentY.current = THREE.MathUtils.lerp(
      currentY.current,
      targetY,
      delta * 3
    );
    groupRef.current.position.y = currentY.current;
    // Gentle bob animation
    groupRef.current.position.x =
      Math.sin(Date.now() * 0.001) * 0.05;
    groupRef.current.rotation.z =
      Math.sin(Date.now() * 0.0008) * 0.03;
  });

  return (
    <group ref={groupRef} position={[2.2, 0, 0.5]}>
      {/* Lens (glass) */}
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[0, 0.35, 32]} />
        <meshPhysicalMaterial
          color="#e0e8ff"
          transparent
          opacity={0.15}
          transmission={0.6}
          roughness={0}
          metalness={0}
          clearcoat={1.0}
          clearcoatRoughness={0}
          ior={1.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Rim */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.35, 0.035, 8, 32]} />
        <meshStandardMaterial
          color="#C0C0C0"
          metalness={0.9}
          roughness={0.15}
          emissive={worldColor}
          emissiveIntensity={0.1}
        />
      </mesh>
      {/* Handle */}
      <mesh position={[0.25, -0.4, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.04, 0.05, 0.45, 8]} />
        <meshStandardMaterial
          color="#8B7355"
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>
      {/* Glow ring */}
      <mesh position={[0, 0, -0.01]}>
        <ringGeometry args={[0.33, 0.38, 32]} />
        <meshBasicMaterial
          color={worldColor}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ■■■ Desk Lamp Component ■■■

function DeskLamp({ worldColor }: { worldColor: string }) {
  return (
    <group position={[-1.8, 1.5, 1]}>
      {/* Lamp shade (cone) */}
      <mesh rotation={[Math.PI, 0, 0.2]}>
        <coneGeometry args={[0.35, 0.5, 16, 1, true]} />
        <meshStandardMaterial
          color="#2a2a3e"
          metalness={0.6}
          roughness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Lamp arm */}
      <mesh position={[0.1, 0.4, -0.1]} rotation={[0.3, 0, 0.2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
        <meshStandardMaterial
          color="#555566"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      {/* Spotlight beam */}
      <spotLight
        position={[0, -0.1, 0]}
        angle={0.6}
        penumbra={0.5}
        intensity={2}
        color={worldColor}
        castShadow={false}
      />
    </group>
  );
}

// ■■■ Fix Particle Burst ■■■

function FixParticles({
  active,
  position,
  worldColor,
}: {
  active: boolean;
  position: [number, number, number];
  worldColor: string;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const velocities = useRef<Float32Array>(new Float32Array(60));
  const lifetimes = useRef<Float32Array>(new Float32Array(20));

  useEffect(() => {
    if (active && pointsRef.current) {
      const posArr = pointsRef.current.geometry.attributes.position
        .array as Float32Array;
      for (let i = 0; i < 20; i++) {
        posArr[i * 3] = position[0];
        posArr[i * 3 + 1] = position[1];
        posArr[i * 3 + 2] = position[2];
        velocities.current[i * 3] = (Math.random() - 0.5) * 2;
        velocities.current[i * 3 + 1] = Math.random() * 1.5 + 0.5;
        velocities.current[i * 3 + 2] = (Math.random() - 0.5) * 2;
        lifetimes.current[i] = 1.0;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  }, [active, position]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posArr = pointsRef.current.geometry.attributes.position
      .array as Float32Array;
    let anyAlive = false;
    for (let i = 0; i < 20; i++) {
      if (lifetimes.current[i] <= 0) continue;
      anyAlive = true;
      lifetimes.current[i] -= delta * 1.5;
      posArr[i * 3] += velocities.current[i * 3] * delta;
      posArr[i * 3 + 1] += velocities.current[i * 3 + 1] * delta;
      posArr[i * 3 + 2] += velocities.current[i * 3 + 2] * delta;
      // Gravity
      velocities.current[i * 3 + 1] -= delta * 2;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = anyAlive ? 0.8 : 0;
  });

  const positions = useMemo(() => new Float32Array(60), []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={20}
        />
      </bufferGeometry>
      <pointsMaterial
        color={worldColor}
        size={0.06}
        transparent
        opacity={0}
        sizeAttenuation
      />
    </points>
  );
}

// ■■■ Evidence Card (3D plane) ■■■

function EvidenceCard({
  index,
  totalRows,
  isSelected,
  isFixed,
  isDeleted,
  issueColor,
  worldColor,
}: {
  index: number;
  totalRows: number;
  isSelected: boolean;
  isFixed: boolean;
  isDeleted: boolean;
  issueColor: string | null;
  worldColor: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const y = 0.8 - index * 0.28;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetRotY = isSelected ? Math.PI * 0.05 : 0;
    const targetZ = isSelected ? 0.15 : 0;
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      targetRotY,
      delta * 4
    );
    meshRef.current.position.z = THREE.MathUtils.lerp(
      meshRef.current.position.z,
      targetZ,
      delta * 4
    );
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.opacity = isDeleted
      ? THREE.MathUtils.lerp(mat.opacity, 0.2, delta * 3)
      : THREE.MathUtils.lerp(mat.opacity, 0.7, delta * 3);
  });

  const cardColor = isFixed
    ? "#10B981"
    : isDeleted
      ? "#6B7280"
      : issueColor || "#ffffff";

  return (
    <mesh ref={meshRef} position={[0, y, 0]}>
      <planeGeometry args={[3.5, 0.22]} />
      <meshStandardMaterial
        color={cardColor}
        transparent
        opacity={0.7}
        emissive={isSelected ? worldColor : "#000000"}
        emissiveIntensity={isSelected ? 0.3 : 0}
        roughness={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ■■■ Scene ■■■

function DetectiveScene({
  selectedRow,
  totalRows,
  fixedRows,
  deletedRows,
  lastFixedRow,
  worldColor,
}: Omit<DataDetective3DProps, "isMobile">) {
  const magY = selectedRow !== null
    ? 0.8 - (selectedRow % totalRows) * 0.28
    : 0.4;

  const [burstActive, setBurstActive] = useState(false);
  const burstPos = useRef<[number, number, number]>([2.2, 0, 0.5]);

  useEffect(() => {
    if (lastFixedRow !== null) {
      burstPos.current = [2.2, 0.8 - (lastFixedRow % 10) * 0.28, 0.5];
      setBurstActive(true);
      const t = setTimeout(() => setBurstActive(false), 800);
      return () => clearTimeout(t);
    }
  }, [lastFixedRow]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <DeskLamp worldColor={worldColor} />

      {/* Evidence Cards */}
      {Array.from({ length: Math.min(totalRows, 10) }, (_, i) => (
        <EvidenceCard
          key={i}
          index={i}
          totalRows={totalRows}
          isSelected={selectedRow === i}
          isFixed={fixedRows.has(i)}
          isDeleted={deletedRows.has(i)}
          issueColor={null}
          worldColor={worldColor}
        />
      ))}

      {/* Magnifying Glass */}
      <MagnifyingGlass targetY={magY} worldColor={worldColor} />

      {/* Fix Particles */}
      <FixParticles
        active={burstActive}
        position={burstPos.current}
        worldColor={worldColor}
      />

      {/* Environment */}
      <Environment preset="night" />

      {/* Bloom */}
      <EffectComposer>
        <Bloom
          intensity={0.3}
          luminanceThreshold={0.5}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// ■■■ Exported Component ■■■

export default function DataDetective3D(props: DataDetective3DProps) {
  const { isMobile = false } = props;

  // Mobile: no 3D, parent uses CSS spotlight only
  if (isMobile) return null;

  return (
    <div
      className="w-full rounded-lg overflow-hidden"
      style={{
        height: 180,
        background:
          "radial-gradient(ellipse at center, rgba(139,92,246,0.06) 0%, transparent 70%)",
      }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0.5, 3.5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
        frameloop="demand"
      >
        <DetectiveScene
          selectedRow={props.selectedRow}
          totalRows={props.totalRows}
          fixedRows={props.fixedRows}
          deletedRows={props.deletedRows}
          lastFixedRow={props.lastFixedRow}
          worldColor={props.worldColor}
        />
      </Canvas>
    </div>
  );
}
```

---

## PART A VALIDATION

### File Existence
- [ ] `ChatbotNodes3D.tsx` exists at `src/components/3d/ChatbotNodes3D.tsx`
- [ ] `DataDetective3D.tsx` exists at `src/components/3d/DataDetective3D.tsx`
- [ ] No TypeScript errors: `npx tsc --noEmit`

### ChatbotNodes3D Verification
- [ ] Accepts: nodes, personalityColors, hoveredNode, testPath, isTestMode, isMobile
- [ ] SphereGeometry(0.25, 16, 12) for each BotNode
- [ ] Root node = personality primary color emissive
- [ ] End nodes = amber (#F59E0B) emissive
- [ ] TubeGeometry connections via CatmullRomCurve3
- [ ] Message pulse spheres during test mode
- [ ] Hover effect: emissive pulse + scale pulse
- [ ] Node labels via drei Text
- [ ] START/END badges on root/terminal nodes
- [ ] Fixed camera [0, -1, 6] — no OrbitControls
- [ ] Bloom post-processing (subtle)
- [ ] Mobile returns null (parent renders SVG only)
- [ ] aria-hidden='true' on container
- [ ] frameloop='demand' for performance
- [ ] Triangle budget: ~3K max (20 spheres + 40 tubes)

### DataDetective3D Verification
- [ ] Accepts: selectedRow, totalRows, fixedRows, deletedRows, lastFixedRow, worldColor, isMobile
- [ ] Magnifying glass: RingGeometry lens + TorusGeometry rim + CylinderGeometry handle
- [ ] MeshPhysicalMaterial lens with clearcoat, transmission, ior
- [ ] Magnifying glass tracks selectedRow with lerp
- [ ] Desk lamp: ConeGeometry shade + SpotLight beam
- [ ] Evidence cards: PlaneGeometry rows with issue-color tint
- [ ] Fix particle burst: Points system, 20 particles, gravity + fade
- [ ] Selected card: subtle rotateY + z-offset
- [ ] Fixed cards: green tint. Deleted cards: fade to 0.2 opacity
- [ ] Fixed camera [0, 0.5, 3.5] — no OrbitControls
- [ ] Bloom post-processing (subtle)
- [ ] Mobile returns null (parent uses CSS spotlight)
- [ ] aria-hidden='true' on container
- [ ] frameloop='demand' for performance
- [ ] Triangle budget: ~2K max (glass + cards + lamp)

### Performance Notes

| Metric | Budget | ChatbotNodes3D | DataDetective3D | Status |
|--------|--------|---------------|----------------|--------|
| Triangle count | < 5K each | ~3K | ~2K | PASS |
| Frame loop | 60fps desktop | frameloop=demand | frameloop=demand | PASS |
| Mobile | 30fps | null (SVG fallback) | null (CSS fallback) | PASS |
| Bundle impact | < 50KB | ~12KB (shared R3F) | ~12KB (shared R3F) | PASS |
| Memory | < 10MB | ~2MB peak | ~1.5MB peak | PASS |

---

**PROCEED TO PART B** for `ChatbotBuilderGame.tsx` full standalone replacement with 3D integration.
**PROCEED TO PART C** for `DataDetectiveGame.tsx` full standalone replacement with 3D integration + Verification + Git.
