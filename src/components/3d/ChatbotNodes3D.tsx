"use client";

// ================================================================
// CHATBOT NODES 3D — Lab 8 (NLP) — v3 Enhanced 3D
// D3D-B1: Exports clean scene group for CockpitCanvas integration
// Canvas, Environment, and EffectComposer removed — provided by CockpitCanvas
// [v3] 3D conversation tree nodes with glowing connections
// [v3] Animated message routing paths during test mode
// [v3] Decision 6.5 — Tier 2 Enhanced 3D
// ENH: Pulse trails + data flow + root halo + endpoint burst
// ================================================================

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame, invalidate } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import {
  CatmullRomCurve3,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  TubeGeometry,
  Vector3,
} from 'three';
import {
  Particle,
  PARTICLE_PRESETS,
  spawnParticles,
  updateParticles,
} from '@/lib/3d/gameParticles';
import ChatbotBuilderEnvironment from '@/components/3d/environments/ChatbotBuilderEnvironment';

// Scratch vector to avoid per-frame allocations (BUG-M1 fix)
const _scratchVec3 = new Vector3();
const _dummy = new Object3D();

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

// ■■■ ENH: Instanced Particle Renderer ■■■

function ParticleCloud({
  particles,
  color,
}: {
  particles: Particle[];
  color: string;
}) {
  const meshRef = useRef<InstancedMesh>(null);
  const maxCount = 80; // max particles we'll ever show

  useFrame(() => {
    if (!meshRef.current) return;
    const count = Math.min(particles.length, maxCount);
    for (let i = 0; i < maxCount; i++) {
      if (i < count) {
        const p = particles[i];
        _dummy.position.copy(p.position);
        _dummy.scale.setScalar(p.size * p.opacity);
        _dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, _dummy.matrix);
      } else {
        _dummy.position.set(0, 0, -100);
        _dummy.scale.setScalar(0);
        _dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, _dummy.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.count = count;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, maxCount]}>
      <sphereGeometry args={[1, 6, 4]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </instancedMesh>
  );
}

// ■■■ ENH: Root Halo (glowing torus around START node) ■■■

function RootHalo({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.z = state.clock.elapsedTime * 0.6;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    const mat = meshRef.current.material as MeshStandardMaterial;
    mat.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    invalidate();
  });

  return (
    <mesh ref={meshRef} position={position}>
      <torusGeometry args={[0.38, 0.03, 12, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.4}
        transparent
        opacity={0.6}
        roughness={0.2}
        metalness={0.5}
      />
    </mesh>
  );
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
  const meshRef = useRef<Mesh>(null);
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
    const mat = meshRef.current.material as MeshStandardMaterial;
    const targetEmissive = isHovered || isInTestPath ? 0.7 : 0.15;
    mat.emissiveIntensity = MathUtils.lerp(
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

// ■■■ Connection Tube Component (ENH: data flow UV animation) ■■■

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
  const tubeRef = useRef<Mesh>(null);

  const curve = useMemo(() => {
    const mid: [number, number, number] = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2,
      (from[2] + to[2]) / 2 + 0.3,
    ];
    return new CatmullRomCurve3([
      new Vector3(...from),
      new Vector3(...mid),
      new Vector3(...to),
    ]);
  }, [from, to]);

  const geometry = useMemo(() => {
    return new TubeGeometry(curve, 12, 0.02, 6, false);
  }, [curve]);

  // Dispose geometry on unmount to prevent GPU memory leaks (BUG-M3 fix)
  useEffect(() => {
    return () => { geometry.dispose(); };
  }, [geometry]);

  useFrame((state, delta) => {
    if (!tubeRef.current) return;
    const mat = tubeRef.current.material as MeshStandardMaterial;
    const targetOpacity = isActive ? 0.9 : 0.3;
    mat.opacity = MathUtils.lerp(mat.opacity, targetOpacity, delta * 4);
    mat.emissiveIntensity = isActive ? 0.6 : 0.1;

    // ENH: Data flow color modulation — cycle emissive intensity along time
    if (isActive) {
      const flow = Math.sin(state.clock.elapsedTime * 4) * 0.5 + 0.5;
      mat.emissiveIntensity = 0.3 + flow * 0.5;
    }

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

// ■■■ Message Pulse (test mode) — ENH: with trail particles ■■■

function MessagePulse({
  from,
  to,
  color,
  active,
  onReachEnd,
  isEndNode,
}: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  active: boolean;
  onReachEnd?: () => void;
  isEndNode: boolean;
}) {
  const ref = useRef<Mesh>(null);
  const progress = useRef(0);
  const trailRef = useRef<Particle[]>([]);
  const trailSpawnTimer = useRef(0);
  const reachedEnd = useRef(false);

  useFrame((_, delta) => {
    if (!ref.current || !active) {
      if (ref.current) ref.current.visible = false;
      return;
    }
    ref.current.visible = true;
    progress.current += delta * 0.5;

    // ENH: Detect reaching end node
    if (progress.current > 0.95 && isEndNode && !reachedEnd.current) {
      reachedEnd.current = true;
      onReachEnd?.();
    }

    if (progress.current > 1) {
      progress.current = 0;
      reachedEnd.current = false;
    }

    const t = progress.current;
    const px = from[0] + (to[0] - from[0]) * t;
    const py = from[1] + (to[1] - from[1]) * t + Math.sin(t * Math.PI) * 0.2;
    const pz = from[2] + (to[2] - from[2]) * t;
    ref.current.position.set(px, py, pz);

    // ENH: Spawn trail particles behind the pulse
    trailSpawnTimer.current += delta;
    if (trailSpawnTimer.current > 0.04) {
      trailSpawnTimer.current = 0;
      const origin = new Vector3(px, py, pz);
      const newTrail = spawnParticles('trailParticles', origin, {
        count: 1,
        colors: [color, '#FFFFFF'],
        speedRange: [0.05, 0.15],
        lifeRange: [0.2, 0.5],
        sizeRange: [0.015, 0.035],
      });
      trailRef.current.push(...newTrail);
      // Cap at 15 trail particles
      if (trailRef.current.length > 15) {
        trailRef.current = trailRef.current.slice(-15);
      }
    }

    // Update trail
    updateParticles(trailRef.current, delta, PARTICLE_PRESETS.trailParticles);
    trailRef.current = trailRef.current.filter((p) => p.life > 0);

    invalidate();
  });

  return (
    <group>
      <mesh ref={ref} visible={false}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
      {/* ENH: Trail particle instances */}
      <ParticleCloud particles={trailRef.current} color={color} />
    </group>
  );
}

// ■■■ ENH: Endpoint Discovery Burst ■■■

function EndpointBurst({
  position,
  color,
  active,
}: {
  position: [number, number, number];
  color: string;
  active: boolean;
}) {
  const particlesRef = useRef<Particle[]>([]);
  const meshRef = useRef<InstancedMesh>(null);
  const hasSpawned = useRef(false);
  const maxCount = 20;

  useEffect(() => {
    if (active && !hasSpawned.current) {
      hasSpawned.current = true;
      const origin = new Vector3(...position);
      particlesRef.current = spawnParticles('discoveryBurst', origin, {
        count: 20,
        colors: [color, '#FFD700', '#FFFFFF'],
        speedRange: [1.0, 3.0],
        lifeRange: [0.6, 1.2],
      });
    }
    if (!active) {
      hasSpawned.current = false;
    }
  }, [active, position, color]);

  useFrame((_, delta) => {
    if (particlesRef.current.length === 0 || !meshRef.current) return;
    updateParticles(particlesRef.current, delta, PARTICLE_PRESETS.discoveryBurst);
    particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

    for (let i = 0; i < maxCount; i++) {
      if (i < particlesRef.current.length) {
        const p = particlesRef.current[i];
        _dummy.position.copy(p.position);
        _dummy.scale.setScalar(p.size * p.opacity);
        _dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, _dummy.matrix);
      } else {
        _dummy.position.set(0, 0, -100);
        _dummy.scale.setScalar(0);
        _dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, _dummy.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.count = Math.min(particlesRef.current.length, maxCount);
    invalidate();
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, maxCount]}>
      <sphereGeometry args={[1, 6, 4]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </instancedMesh>
  );
}

// ■■■ Scene (inner R3F) ■■■

function ChatbotScene({
  nodes,
  personalityColors,
  hoveredNode,
  testPath,
  isTestMode,
}: ChatbotNodes3DProps) {
  const positions = useMemo(
    () => computeNodePositions3D(nodes),
    [nodes]
  );

  const testPathSet = useMemo(() => new Set(testPath), [testPath]);

  // ENH: Track which end nodes have received a burst
  const [burstEndNodes, setBurstEndNodes] = useState<Set<string>>(new Set());

  // Identify end nodes
  const endNodeIds = useMemo(
    () => new Set(nodes.filter((n) => n.responses.length === 0).map((n) => n.id)),
    [nodes]
  );

  // Reset bursts when test path changes
  useEffect(() => {
    setBurstEndNodes(new Set());
  }, [testPath]);

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

      {/* ENH: Root halo around START node */}
      {positions["root"] && (
        <RootHalo
          position={positions["root"]}
          color={personalityColors.primary}
        />
      )}

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

      {/* Message Pulses (test mode only) — ENH: with trail particles */}
      {isTestMode &&
        testPath.slice(0, -1).map((nodeId, i) => {
          const nextId = testPath[i + 1];
          const from = positions[nodeId];
          const to = positions[nextId];
          if (!from || !to) return null;
          const isEnd = endNodeIds.has(nextId);
          return (
            <MessagePulse
              key={`pulse-${nodeId}-${nextId}`}
              from={from}
              to={to}
              color={personalityColors.primary}
              active={true}
              isEndNode={isEnd}
              onReachEnd={() => {
                setBurstEndNodes((prev) => new Set(prev).add(nextId));
              }}
            />
          );
        })}

      {/* ENH: Discovery burst at end nodes when message arrives */}
      {isTestMode &&
        Array.from(burstEndNodes).map((nodeId) => {
          const pos = positions[nodeId];
          if (!pos) return null;
          return (
            <EndpointBurst
              key={`burst-${nodeId}`}
              position={pos}
              color={personalityColors.primary}
              active={true}
            />
          );
        })}

    </>
  );
}

// ■■■ Exported Component ■■■

export default function ChatbotNodes3D(props: ChatbotNodes3DProps) {
  return (
    <group>
      {/* FL-Lite Environment — wired S7-WARN-002 */}
      <ChatbotBuilderEnvironment isTestMode={props.isTestMode} activeNodeCount={props.nodes.length} />

      <ChatbotScene
        nodes={props.nodes}
        personalityColors={props.personalityColors}
        hoveredNode={props.hoveredNode}
        testPath={props.testPath}
        isTestMode={props.isTestMode}
      />
    </group>
  );
}
