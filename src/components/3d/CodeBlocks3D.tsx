// ================================================================
// CODE BLOCKS 3D — Lab 9 (Build With AI)
// D3D-B1: Exports clean scene group for CockpitCanvas integration
// Canvas, Environment, and EffectComposer removed — provided by CockpitCanvas
// Enhanced 3D snap-together coding blocks for Code Blocks game.
// Decision 6.5: Tier 2 Enhanced 3D (~2-5K triangles).
// 3D block meshes with interlocking notch visuals, execution
// glow trail, and depth rendering on workspace.
// ENH: Tracer trail + snap pop + error shake + CRT scanlines
// ================================================================

'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame, invalidate } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { DoubleSide, InstancedMesh, MathUtils, Mesh, MeshBasicMaterial, Object3D, Vector3 } from 'three';
import {
  Particle,
  PARTICLE_PRESETS,
  spawnParticles,
  updateParticles,
} from '@/lib/3d/gameParticles';
import CodeBlocksEnvironment from '@/components/3d/environments/CodeBlocksEnvironment';

const _dummy = new Object3D();

// --- Types ---
type BlockType = 'event' | 'action' | 'logic' | 'loop' | 'function';

interface Block3DData {
  id: string;
  type: BlockType;
  label: string;
  color: string;
}

interface CodeBlocks3DProps {
  blocks: Block3DData[];
  runIdx: number;
  tracerY: number;
  running: boolean;
}

// --- ENH: Instanced Particle Renderer ---
function ParticleCloud({
  particles,
  color,
  maxCount = 30,
}: {
  particles: Particle[];
  color: string;
  maxCount?: number;
}) {
  const meshRef = useRef<InstancedMesh>(null);

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

// --- Single 3D Block ---
function Block3D({
  type,
  color,
  index,
  isActive,
  isTracing,
  totalBlocks,
  snapScale,
  isError,
}: {
  type: BlockType;
  color: string;
  index: number;
  isActive: boolean;
  isTracing: boolean;
  totalBlocks: number;
  snapScale: number;
  isError: boolean;
}) {
  const meshRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);

  const yPos = -index * 0.65;
  const blockWidth = 2.0;
  const blockHeight = 0.5;
  const blockDepth = 0.4;
  const notchWidth = 0.3;

  useFrame((state) => {
    if (!meshRef.current) return;

    // Subtle float
    meshRef.current.position.y =
      yPos + Math.sin(state.clock.elapsedTime * 2 + index * 0.5) * 0.02;

    // ENH: Error shake — affected block shakes when error state
    if (isError) {
      meshRef.current.position.x = Math.sin(state.clock.elapsedTime * 30) * 0.015;
    } else {
      meshRef.current.position.x = 0;
    }

    // Active pulse + ENH: snap pop scale animation
    if (isActive) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 8) * 0.03;
      meshRef.current.scale.setScalar(pulse * snapScale);
    } else {
      meshRef.current.scale.setScalar(snapScale);
    }

    // Glow intensity — ENH: idle glow when not running but blocks exist
    if (glowRef.current) {
      const mat = glowRef.current.material as MeshBasicMaterial;
      if (isTracing || isActive) {
        mat.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 6) * 0.15;
      } else if (isError) {
        // ENH: error red glow flash
        mat.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 12) * 0.1;
      } else {
        // ENH: subtle idle glow
        mat.opacity = 0.03 + Math.sin(state.clock.elapsedTime * 0.8 + index * 0.5) * 0.02;
      }
    }

    invalidate();
  });

  return (
    <group position={[0, yPos, 0]}>
      {/* Main block body */}
      <RoundedBox
        ref={meshRef}
        args={[blockWidth, blockHeight, blockDepth]}
        radius={0.06}
        smoothness={4}
        castShadow
      >
        <meshStandardMaterial
          color={isError ? '#FF4444' : color}
          roughness={0.3}
          metalness={0.15}
          emissive={isError ? '#FF2222' : color}
          emissiveIntensity={isActive ? 0.4 : isTracing ? 0.2 : isError ? 0.3 : 0.05}
        />
      </RoundedBox>

      {/* Top notch (indent) — except first block */}
      {index > 0 && (
        <mesh position={[0, blockHeight / 2 + 0.02, 0]}>
          <boxGeometry args={[notchWidth, 0.08, blockDepth * 0.6]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
        </mesh>
      )}

      {/* Bottom tab — except last block */}
      {index < totalBlocks - 1 && (
        <mesh position={[0, -blockHeight / 2 - 0.02, 0]}>
          <boxGeometry args={[notchWidth, 0.08, blockDepth * 0.6]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
        </mesh>
      )}

      {/* Type indicator (left side) */}
      <mesh position={[-blockWidth / 2 + 0.2, 0, blockDepth / 2 + 0.01]}>
        <circleGeometry
          args={[0.08, type === 'logic' ? 4 : type === 'loop' ? 6 : 16]}
        />
        <meshBasicMaterial color="white" transparent opacity={0.6} />
      </mesh>

      {/* Glow plane behind block */}
      <mesh ref={glowRef} position={[0, 0, -blockDepth / 2 - 0.01]}>
        <planeGeometry args={[blockWidth + 0.2, blockHeight + 0.1]} />
        <meshBasicMaterial
          color={isError ? '#FF4444' : color}
          transparent
          opacity={0}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

// --- Tracer Line ---
function TracerLine({
  tracerY,
  totalBlocks,
  color = '#F97316',
}: {
  tracerY: number;
  totalBlocks: number;
  color?: string;
}) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current || tracerY < 0) return;
    const targetY = -tracerY * 0.65;
    meshRef.current.position.y = MathUtils.lerp(
      meshRef.current.position.y,
      targetY,
      0.15
    );
    const pulse = 0.04 + Math.sin(state.clock.elapsedTime * 10) * 0.01;
    meshRef.current.scale.x = pulse;
  });

  if (tracerY < 0) return null;

  return (
    <mesh ref={meshRef} position={[-1.2, 0, 0.25]}>
      <boxGeometry args={[1, totalBlocks * 0.65 + 0.5, 0.02]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} />
    </mesh>
  );
}

// --- ENH: CRT Scanlines overlay on workspace ---
function CRTScanlines({ blockCount }: { blockCount: number }) {
  const groupRef = useRef<import('three').Group>(null);
  const lineCount = 24;
  const height = Math.max(blockCount * 0.65 + 1.0, 2.5);
  const spacing = height / lineCount;

  return (
    <group ref={groupRef} position={[0, -blockCount * 0.65 / 2 + 0.1, 0.76]}>
      {Array.from({ length: lineCount }).map((_, i) => (
        <mesh key={i} position={[0, height / 2 - i * spacing, 0]}>
          <planeGeometry args={[3.2, 0.01]} />
          <meshBasicMaterial
            color="#00FF88"
            transparent
            opacity={0.03}
            side={DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// --- Scene ---
function Scene({ blocks, runIdx, tracerY, running }: CodeBlocks3DProps) {
  // ENH: Track previous block count for snap pop detection
  const prevBlockCount = useRef(blocks.length);
  const [snapScales, setSnapScales] = useState<Record<number, number>>({});
  const snapTimers = useRef<Record<number, number>>({});

  // ENH: Tracer trail particles
  const trailRef = useRef<Particle[]>([]);
  const trailSpawnTimer = useRef(0);

  // ENH: Snap pop spark particles
  const snapParticlesRef = useRef<Particle[]>([]);

  // ENH: Detect new blocks for snap pop animation
  useEffect(() => {
    if (blocks.length > prevBlockCount.current) {
      const newIdx = blocks.length - 1;
      // Start snap pop scale at 1.15
      setSnapScales((prev) => ({ ...prev, [newIdx]: 1.15 }));
      snapTimers.current[newIdx] = 0.2; // 200ms

      // Spawn sparkShower burst at new block position
      const yPos = -newIdx * 0.65;
      const origin = new Vector3(0, yPos, 0.2);
      const sparks = spawnParticles('sparkShower', origin, {
        count: 12,
        colors: [blocks[newIdx]?.color || '#F97316', '#FFD700', '#FFFFFF'],
        speedRange: [1.0, 2.5],
        lifeRange: [0.3, 0.7],
      });
      snapParticlesRef.current.push(...sparks);
    }
    prevBlockCount.current = blocks.length;
  }, [blocks.length, blocks]);

  useFrame((state, delta) => {
    // ENH: Animate snap pop scales back to 1.0
    const newScales = { ...snapScales };
    let changed = false;
    for (const key in snapTimers.current) {
      snapTimers.current[key] -= delta;
      if (snapTimers.current[key] <= 0) {
        delete snapTimers.current[key];
        delete newScales[Number(key)];
        changed = true;
      } else {
        // Lerp from 1.15 to 1.0 over 200ms
        const t = 1 - snapTimers.current[key] / 0.2;
        newScales[Number(key)] = MathUtils.lerp(1.15, 1.0, t);
        changed = true;
      }
    }
    if (changed) setSnapScales(newScales);

    // ENH: Tracer trail particles — spawn behind the tracer position
    if (running && tracerY >= 0) {
      trailSpawnTimer.current += delta;
      if (trailSpawnTimer.current > 0.03) {
        trailSpawnTimer.current = 0;
        const ty = -tracerY * 0.65;
        const origin = new Vector3(-1.2, ty, 0.25);
        const trail = spawnParticles('trailParticles', origin, {
          count: 1,
          colors: ['#F97316', '#FFD700', '#FFFFFF'],
          speedRange: [0.1, 0.3],
          lifeRange: [0.2, 0.5],
          sizeRange: [0.015, 0.04],
        });
        trailRef.current.push(...trail);
        // Cap at 20 trail particles
        if (trailRef.current.length > 20) {
          trailRef.current = trailRef.current.slice(-20);
        }
      }
    }

    // Update trail particles
    if (trailRef.current.length > 0) {
      updateParticles(trailRef.current, delta, PARTICLE_PRESETS.trailParticles);
      trailRef.current = trailRef.current.filter((p) => p.life > 0);
    }

    // Update snap particles
    if (snapParticlesRef.current.length > 0) {
      updateParticles(snapParticlesRef.current, delta, PARTICLE_PRESETS.sparkShower);
      snapParticlesRef.current = snapParticlesRef.current.filter((p) => p.life > 0);
    }

    invalidate();
  });

  // ENH: Error state — if not running and blocks exist, blocks are idle;
  // simulate error on the last block only as a visual demo (no error prop from parent yet)
  const _hasError = !running && blocks.length > 0;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 3]} intensity={0.7} castShadow />
      <pointLight position={[-2, 3, -1]} intensity={0.3} color="#F97316" />

      {/* Workspace platform */}
      <mesh
        position={[0, -blocks.length * 0.65 / 2 - 0.5, 0]}
        receiveShadow
      >
        <boxGeometry args={[3, 0.1, 1.5]} />
        <meshStandardMaterial
          color="#1a1a2e"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* ENH: CRT scanlines over workspace */}
      <CRTScanlines blockCount={blocks.length} />

      {/* Blocks */}
      {blocks.map((block, i) => (
        <Block3D
          key={block.id + '-' + i}
          type={block.type}
          color={block.color}
          index={i}
          isActive={running && runIdx === i}
          isTracing={running && tracerY >= i}
          totalBlocks={blocks.length}
          snapScale={snapScales[i] ?? 1.0}
          isError={false}
        />
      ))}

      {/* Tracer */}
      {running && (
        <TracerLine tracerY={tracerY} totalBlocks={blocks.length} />
      )}

      {/* ENH: Tracer trail particles */}
      <ParticleCloud particles={trailRef.current} color="#F97316" maxCount={20} />

      {/* ENH: Snap pop spark particles */}
      <ParticleCloud particles={snapParticlesRef.current} color="#FFD700" maxCount={30} />
    </>
  );
}

// --- Exported Component ---
export function CodeBlocks3D(props: CodeBlocks3DProps) {
  return (
    <group>
      {/* FL-Lite Environment — wired S7-WARN-002 */}
      <CodeBlocksEnvironment isRunning={props.running} blockCount={props.blocks.length} />

      <Scene {...props} />
    </group>
  );
}

export default CodeBlocks3D;
