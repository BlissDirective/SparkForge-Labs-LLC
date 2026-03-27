// ================================================================
// CODE BLOCKS 3D — Lab 9 (Build With AI)
// D3D-B1: Exports clean scene group for CockpitCanvas integration
// Canvas, Environment, and EffectComposer removed — provided by CockpitCanvas
// Enhanced 3D snap-together coding blocks for Code Blocks game.
// Decision 6.5: Tier 2 Enhanced 3D (~2-5K triangles).
// 3D block meshes with interlocking notch visuals, execution
// glow trail, and depth rendering on workspace.
// ================================================================

'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { DoubleSide, MathUtils, Mesh, MeshBasicMaterial } from 'three';

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

// --- Single 3D Block ---
function Block3D({
  type,
  color,
  index,
  isActive,
  isTracing,
  totalBlocks,
}: {
  type: BlockType;
  color: string;
  index: number;
  isActive: boolean;
  isTracing: boolean;
  totalBlocks: number;
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

    // Active pulse
    if (isActive) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 8) * 0.03;
      meshRef.current.scale.setScalar(pulse);
    } else {
      meshRef.current.scale.setScalar(1);
    }

    // Glow intensity
    if (glowRef.current) {
      const mat = glowRef.current.material as MeshBasicMaterial;
      if (isTracing || isActive) {
        mat.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 6) * 0.15;
      } else {
        mat.opacity = 0;
      }
    }
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
          color={color}
          roughness={0.3}
          metalness={0.15}
          emissive={color}
          emissiveIntensity={isActive ? 0.4 : isTracing ? 0.2 : 0.05}
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
          color={color}
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

// --- Scene ---
function Scene({ blocks, runIdx, tracerY, running }: CodeBlocks3DProps) {
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
        />
      ))}

      {/* Tracer */}
      {running && (
        <TracerLine tracerY={tracerY} totalBlocks={blocks.length} />
      )}
    </>
  );
}

// --- Exported Component ---
export function CodeBlocks3D(props: CodeBlocks3DProps) {
  return (
    <group>
      <Scene {...props} />
    </group>
  );
}

export default CodeBlocks3D;
