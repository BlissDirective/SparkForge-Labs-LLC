// ================================================================
// SparkForge AgentPipeline3D — 3D Pipeline Visualization
// ================================================================
// Decision 6.4: Full 3D platform for Agent Architect flagship.
// Decision 6.2.4: Typed block geometries, TubeGeometry connections,
//   InstancedMesh data packets, SpotLight execution tracking.
// Decision 5.3: Flagship custom emerald particles.
//
// Architecture:
// - R3F Canvas rendered inside AgentArchitectGame build phase
// - Blocks placed via palette (game manages state, 3D renders)
// - Connections rendered as glowing tubes
// - Cinema mode: data packets + spotlight + PointLight glow
// - Mobile: Not loaded (parent handles 2D fallback)
//
// Performance: ~5K triangles max. frameloop='always' during run.
// Dynamic import with ssr: false required.
// ================================================================

'use client';

import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { Text, Environment } from '@react-three/drei';
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  OctahedronGeometry,
  PointLight,
  Points,
  RepeatWrapping,
  SphereGeometry,
  SpotLight,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import AgentArchitectEnvironment from './environments/AgentArchitectEnvironment';

// ================================================================
// TYPES (mirrored from game component)
// ================================================================

export interface PipelineBlock {
  id: string;
  typeId: string;
  label: string;
  emoji: string;
  color: string;
  x: number;
  z: number;
  configText?: string;
  outputs: number; // 0 = terminal, 1 = single, 2 = yes/no branch
}

export interface PipelineConnection {
  fromId: string;
  toId: string;
  outputIndex: number; // 0 = default/YES, 1 = NO
}

export interface PipelineProps {
  blocks: PipelineBlock[];
  connections: PipelineConnection[];
  activeBlockId: string | null;
  runPath: string[];
  isRunning: boolean;
  onBlockClick?: (id: string) => void;
  onPlatformClick?: (gridX: number, gridZ: number) => void;
}

// ================================================================
// CONSTANTS
// ================================================================

const GRID_SIZE = 1.2;
const PLATFORM_W = 14;
const PLATFORM_D = 10;
const BLOCK_Y = 0.35;
const TUBE_RADIUS = 0.03;
const TUBE_SEGMENTS = 16;
const PACKET_SIZE = 0.08;
const PACKET_COUNT = 4;

// Block type -> geometry mapping (Decision 6.2.4)
const BLOCK_GEOMETRIES: Record<string, () => BufferGeometry> = {
  goal: () => new BoxGeometry(0.7, 0.45, 0.7),
  search: () => new CylinderGeometry(0.35, 0.35, 0.45, 16),
  tool: () => new CylinderGeometry(0.3, 0.3, 0.55, 6),
  decide: () => new OctahedronGeometry(0.38),
  check: () => new OctahedronGeometry(0.32),
  loop: () => new TorusGeometry(0.28, 0.09, 8, 24),
  memory: () => new SphereGeometry(0.32, 16, 12),
  parallel: () => new BoxGeometry(0.8, 0.35, 0.4),
  human: () => new SphereGeometry(0.3, 16, 12),
  done: () => new BoxGeometry(0.55, 0.35, 0.55),
};

// ================================================================
// PLATFORM COMPONENT
// ================================================================

function Platform({ onPlatformClick }: {
  onPlatformClick?: (gx: number, gz: number) => void;
}) {
  const meshRef = useRef<Mesh>(null);

  const gridTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0a1a14';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.lineWidth = 1;
    const step = 512 / 12;
    for (let i = 0; i <= 12; i++) {
      ctx.beginPath();
      ctx.moveTo(i * step, 0);
      ctx.lineTo(i * step, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * step);
      ctx.lineTo(512, i * step);
      ctx.stroke();
    }

    const tex = new CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = RepeatWrapping;
    return tex;
  }, []);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!onPlatformClick) return;
    const point = e.point;
    const gx = Math.round((point.x + PLATFORM_W / 2) / GRID_SIZE);
    const gz = Math.round((point.z + PLATFORM_D / 2) / GRID_SIZE);
    if (gx >= 0 && gx <= 10 && gz >= 0 && gz <= 7) {
      onPlatformClick(gx, gz);
    }
  }, [onPlatformClick]);

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      onClick={handleClick}
      receiveShadow
    >
      <planeGeometry args={[PLATFORM_W, PLATFORM_D]} />
      <meshStandardMaterial
        map={gridTexture}
        color="#0d1f17"
        roughness={0.85}
        metalness={0.15}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

// ================================================================
// SINGLE BLOCK 3D COMPONENT
// ================================================================

function Block3D({
  block, isActive, inPath, onClick,
}: {
  block: PipelineBlock;
  isActive: boolean;
  inPath: boolean;
  onClick?: (id: string) => void;
}) {
  const meshRef = useRef<Mesh>(null);
  const glowRef = useRef<PointLight>(null);

  const geometry = useMemo(() => {
    const factory = BLOCK_GEOMETRIES[block.typeId] || BLOCK_GEOMETRIES.goal;
    return factory();
  }, [block.typeId]);

  const worldX = (block.x * GRID_SIZE) - PLATFORM_W / 2 + GRID_SIZE / 2;
  const worldZ = (block.z * GRID_SIZE) - PLATFORM_D / 2 + GRID_SIZE / 2;

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (isActive) {
      meshRef.current.scale.setScalar(
        1 + Math.sin(Date.now() * 0.005) * 0.08
      );
      if (glowRef.current) {
        glowRef.current.intensity = 2 + Math.sin(Date.now() * 0.008) * 1;
      }
    } else {
      const target = new Vector3(1, 1, 1);
      meshRef.current.scale.lerp(target, delta * 4);
      if (glowRef.current) {
        glowRef.current.intensity = inPath ? 0.8 : 0;
      }
    }

    // Type-specific idle animations
    if (block.typeId === 'loop' && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.8;
    }
    if (block.typeId === 'search' && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(block.id);
  }, [block.id, onClick]);

  const baseColor = new Color(block.color);
  const emissiveColor = isActive
    ? baseColor.clone().multiplyScalar(0.6)
    : inPath
      ? baseColor.clone().multiplyScalar(0.2)
      : new Color(0x000000);

  return (
    <group position={[worldX, BLOCK_Y, worldZ]}>
      {/* Main block mesh */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        onClick={handleClick}
        castShadow
      >
        <meshStandardMaterial
          color={block.color}
          emissive={emissiveColor}
          emissiveIntensity={isActive ? 1.5 : inPath ? 0.5 : 0}
          roughness={0.4}
          metalness={0.3}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* PointLight glow for active/path blocks */}
      <pointLight
        ref={glowRef}
        color={block.color}
        intensity={0}
        distance={2}
        decay={2}
      />

      {/* Label above block: emoji + type name */}
      <Text
        position={[0, 0.55, 0]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.01}
        outlineColor="black"
      >
        {block.emoji} {block.label}
      </Text>

      {/* Config text below block */}
      {block.configText && (
        <Text
          position={[0, -0.45, 0]}
          fontSize={0.09}
          color="rgba(255,255,255,0.5)"
          anchorX="center"
          anchorY="top"
          maxWidth={1.2}
        >
          {block.configText.length > 30
            ? block.configText.slice(0, 27) + '...'
            : block.configText}
        </Text>
      )}

      {/* Output port indicators */}
      {block.outputs >= 1 && (
        <mesh position={[0, -0.3, 0.45]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshStandardMaterial
            color="#10B981"
            emissive="#10B981"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
      {block.outputs === 2 && (
        <>
          {/* YES port (green, left) */}
          <mesh position={[-0.3, -0.3, 0.45]}>
            <sphereGeometry args={[0.05, 8, 6]} />
            <meshStandardMaterial
              color="#22C55E"
              emissive="#22C55E"
              emissiveIntensity={0.5}
            />
          </mesh>
          {/* NO port (red, right) */}
          <mesh position={[0.3, -0.3, 0.45]}>
            <sphereGeometry args={[0.05, 8, 6]} />
            <meshStandardMaterial
              color="#EF4444"
              emissive="#EF4444"
              emissiveIntensity={0.5}
            />
          </mesh>
          <Text
            position={[-0.3, -0.3, 0.55]}
            fontSize={0.07}
            color="#22C55E"
            anchorX="center"
          >
            YES
          </Text>
          <Text
            position={[0.3, -0.3, 0.55]}
            fontSize={0.07}
            color="#EF4444"
            anchorX="center"
          >
            NO
          </Text>
        </>
      )}
    </group>
  );
}

// ================================================================
// TUBE CONNECTION COMPONENT
// ================================================================

function TubeConnection({
  from, to, isActive, color,
}: {
  from: Vector3;
  to: Vector3;
  isActive: boolean;
  color: string;
}) {
  const tubeGeom = useMemo(() => {
    const mid = new Vector3(
      (from.x + to.x) / 2,
      Math.max(from.y, to.y) + 0.6,
      (from.z + to.z) / 2
    );
    const curve = new CatmullRomCurve3([from, mid, to]);
    return new TubeGeometry(
      curve, TUBE_SEGMENTS, TUBE_RADIUS, 6, false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from.x, from.y, from.z, to.x, to.y, to.z]);

  const baseColor = new Color(color);

  return (
    <mesh geometry={tubeGeom}>
      <meshStandardMaterial
        color={color}
        emissive={isActive ? baseColor : new Color(0x000000)}
        emissiveIntensity={isActive ? 1.2 : 0}
        transparent
        opacity={isActive ? 0.9 : 0.3}
        roughness={0.6}
        metalness={0.2}
      />
    </mesh>
  );
}

// ================================================================
// DATA PACKETS (travel along tubes during run)
// ================================================================

function DataPackets({
  from, to, active,
}: {
  from: Vector3;
  to: Vector3;
  active: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const progressRef = useRef(0);

  const curve = useMemo(() => {
    const mid = new Vector3(
      (from.x + to.x) / 2,
      Math.max(from.y, to.y) + 0.6,
      (from.z + to.z) / 2
    );
    return new CatmullRomCurve3([from, mid, to]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from.x, from.y, from.z, to.x, to.y, to.z]);

  useFrame((_, delta) => {
    if (!active || !groupRef.current) return;
    progressRef.current = (progressRef.current + delta * 0.8) % 1;
    const children = groupRef.current.children;
    for (let i = 0; i < children.length; i++) {
      const t = (progressRef.current + i / PACKET_COUNT) % 1;
      const pos = curve.getPoint(t);
      children[i].position.copy(pos);
    }
  });

  if (!active) return null;

  return (
    <group ref={groupRef}>
      {Array.from({ length: PACKET_COUNT }).map((_, i) => (
        <mesh key={i} castShadow>
          <boxGeometry args={[PACKET_SIZE, PACKET_SIZE, PACKET_SIZE]} />
          <meshStandardMaterial
            color="#10B981"
            emissive="#10B981"
            emissiveIntensity={2}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

// ================================================================
// EXECUTION SPOTLIGHT
// ================================================================

function ExecutionSpotlight({
  targetPos, active,
}: {
  targetPos: Vector3 | null;
  active: boolean;
}) {
  const lightRef = useRef<SpotLight>(null);
  const targetRef = useRef(new Vector3(0, 0, 0));

  useFrame((_, delta) => {
    if (!lightRef.current || !targetPos) return;
    targetRef.current.lerp(targetPos, delta * 3);
    lightRef.current.target.position.copy(targetRef.current);
    lightRef.current.target.updateMatrixWorld();
    lightRef.current.intensity = active ? 3 : 0;
  });

  return (
    <spotLight
      ref={lightRef}
      position={[0, 6, 0]}
      angle={0.4}
      penumbra={0.5}
      intensity={0}
      color="#10B981"
      castShadow
      shadow-mapSize-width={512}
      shadow-mapSize-height={512}
    />
  );
}

// ================================================================
// AMBIENT PARTICLES (Decision 5.3 flagship)
// ================================================================

function PipelineParticles() {
  const pointsRef = useRef<Points>(null);
  const count = 80;

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * PLATFORM_W;
      pos[i * 3 + 1] = Math.random() * 3 + 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * PLATFORM_D;
      vel[i * 3] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 1] = Math.random() * 0.01 + 0.005;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame(() => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes
      .position as BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 3];
      arr[i * 3 + 1] += velocities[i * 3 + 1];
      arr[i * 3 + 2] += velocities[i * 3 + 2];

      if (arr[i * 3 + 1] > 4) {
        arr[i * 3 + 1] = 0.5;
        arr[i * 3] = (Math.random() - 0.5) * PLATFORM_W;
        arr[i * 3 + 2] = (Math.random() - 0.5) * PLATFORM_D;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#10B981"
        size={0.04}
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ================================================================
// SCENE ORCHESTRATOR
// ================================================================

function PipelineScene({
  blocks,
  connections,
  activeBlockId,
  runPath,
  isRunning,
  onBlockClick,
  onPlatformClick,
}: PipelineProps) {
  const blockPositions = useMemo(() => {
    const map: Record<string, Vector3> = {};
    blocks.forEach((b) => {
      const wx = b.x * GRID_SIZE - PLATFORM_W / 2 + GRID_SIZE / 2;
      const wz = b.z * GRID_SIZE - PLATFORM_D / 2 + GRID_SIZE / 2;
      map[b.id] = new Vector3(wx, BLOCK_Y, wz);
    });
    return map;
  }, [blocks]);

  const activePos =
    activeBlockId && blockPositions[activeBlockId]
      ? blockPositions[activeBlockId]
      : null;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 8, 3]}
        intensity={0.6}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Platform */}
      <Platform onPlatformClick={onPlatformClick} />

      {/* Blocks */}
      {blocks.map((block) => (
        <Block3D
          key={block.id}
          block={block}
          isActive={activeBlockId === block.id}
          inPath={runPath.includes(block.id)}
          onClick={onBlockClick}
        />
      ))}

      {/* Connections (tubes) + Data Packets */}
      {connections.map((conn, i) => {
        const fromPos = blockPositions[conn.fromId];
        const toPos = blockPositions[conn.toId];
        if (!fromPos || !toPos) return null;

        const fromBlock = blocks.find((b) => b.id === conn.fromId);
        const isActivePath =
          runPath.includes(conn.fromId) && runPath.includes(conn.toId);

        return (
          <group key={`conn-${i}`}>
            <TubeConnection
              from={fromPos}
              to={toPos}
              isActive={isActivePath}
              color={fromBlock?.color || '#10B981'}
            />
            <DataPackets
              from={fromPos}
              to={toPos}
              active={isRunning && isActivePath}
            />
          </group>
        );
      })}

      {/* Execution spotlight */}
      <ExecutionSpotlight targetPos={activePos} active={isRunning} />

      {/* Ambient particles (Decision 5.3) */}
      <PipelineParticles />

      {/* HDR environment for reflections */}
      <Environment preset="night" />
    </>
  );
}

// ================================================================
// EXPORTED CANVAS WRAPPER
// ================================================================

export default function AgentPipeline3D(props: PipelineProps) {
  return (
    <Canvas
      camera={{ position: [0, 10, 10], fov: 50 }}
      shadows
      dpr={[1, 1.5]}
      frameloop={props.isRunning ? 'always' : 'demand'}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '0.75rem',
        background:
          'linear-gradient(180deg, #030712 0%, #0a1a14 100%)',
      }}
      gl={{ antialias: true, alpha: false }}
    >
        {/* [5M] Immersive Server Command Center Environment */}
        <AgentArchitectEnvironment
          isRunning={props.isRunning}
          activeBlockId={props.activeBlockId}
        />

        <PipelineScene {...props} />
    </Canvas>
  );
}

// ================================================================
// HELPER: Convert game blocks to pipeline blocks
// ================================================================

export function toPipelineBlocks(
  blocks: Array<{
    id: string;
    type: {
      id: string;
      label: string;
      emoji: string;
      color: string;
      outputs: number;
    };
    x: number;
    y: number;
    config: {
      text?: string;
      tool?: string;
      searchTarget?: string;
    };
  }>
): PipelineBlock[] {
  return blocks.map((b) => ({
    id: b.id,
    typeId: b.type.id,
    label: b.type.label,
    emoji: b.type.emoji,
    color: b.type.color,
    x: Math.round(b.x / 140),
    z: Math.round(b.y / 100),
    configText:
      b.config.text ||
      b.config.tool ||
      b.config.searchTarget ||
      undefined,
    outputs: b.type.outputs,
  }));
}
