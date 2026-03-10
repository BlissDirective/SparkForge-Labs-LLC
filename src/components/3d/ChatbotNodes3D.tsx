"use client";

// ================================================================
// CHATBOT NODES 3D — Lab 8 (NLP) — v3 Enhanced 3D
// [v3] 3D conversation tree nodes with glowing connections
// [v3] Animated message routing paths during test mode
// [v3] Decision 6.5 — Tier 2 Enhanced 3D
// ================================================================

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, invalidate } from "@react-three/fiber";
import { Text, Environment } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// Scratch vector to avoid per-frame allocations (BUG-M1 fix)
const _scratchVec3 = new THREE.Vector3();

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
    _scratchVec3.set(targetScale, targetScale, targetScale);
    meshRef.current.scale.lerp(_scratchVec3, delta * 6);
    invalidate(); // Request next frame
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
        color="#666666"
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

  // Dispose geometry on unmount to prevent GPU memory leaks (BUG-M3 fix)
  useEffect(() => {
    return () => { geometry.dispose(); };
  }, [geometry]);

  useFrame((_, delta) => {
    if (!tubeRef.current) return;
    const mat = tubeRef.current.material as THREE.MeshStandardMaterial;
    const targetOpacity = isActive ? 0.9 : 0.3;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, delta * 4);
    mat.emissiveIntensity = isActive ? 0.6 : 0.1;
    invalidate();
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
    invalidate();
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
        frameloop="always"
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
