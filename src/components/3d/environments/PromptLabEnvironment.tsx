'use client';

// ════════════════════════════════════════════════════
// PromptLabEnvironment — AI Workshop Studio (5M budget)
// ════════════════════════════════════════════════════
// Lab 4: AI & Language | Color: #F59E0B (Amber)
//
// Transforms Prompt Lab into a creative AI workshop:
//   - Floating book library orbiting the workspace
//   - Holographic display screens showing prompt patterns
//   - Token counter cylinder that fills as prompts grow
//   - Central AI brain mesh that pulses during thinking
//   - Prompt history scroll wall
//   - Ambient light motes drifting like ideas
//   - Writing desk surface with glowing ink trails
//
// Triangle Budget (Desktop Ultra):
//   Terrain:           ~200K
//   Floating Books:    ~300K (150 instanced book meshes)
//   Holographic Screens: ~80K
//   Token Counter:     ~50K  (cylinder with segments)
//   AI Brain Mesh:     ~100K (high-detail icosahedron)
//   Writing Desk:      ~30K
//   Scroll Wall:       ~60K
//   Light Motes:       ~40K  (instanced spheres)
//   Sky/Atmosphere:    ~50K
//   Total:             ~910K

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  FlagshipEnvironmentWrapper,
  useFlagshipLOD,
} from './FlagshipEnvironmentBase';

// ■■ Floating Book Library ■■
function FloatingBooks({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const count = lod.level === 'ultra' ? 100 : lod.level === 'high' ? 60 : 25;
  const booksRef = useRef<THREE.InstancedMesh>(null);

  const bookData = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      orbitRadius: 6 + Math.random() * 8,
      orbitSpeed: 0.05 + Math.random() * 0.15,
      height: 1 + Math.random() * 5,
      bobSpeed: 0.5 + Math.random() * 1.5,
      bobAmount: 0.2 + Math.random() * 0.5,
      phase: (i / count) * Math.PI * 2,
      tiltX: (Math.random() - 0.5) * 0.4,
      tiltZ: (Math.random() - 0.5) * 0.4,
    })), [count]
  );

  useFrame((state) => {
    if (!booksRef.current) return;
    const t = state.clock.elapsedTime;
    const temp = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3(0.4, 0.55, 0.06);

    for (let i = 0; i < count; i++) {
      const b = bookData[i];
      const angle = t * b.orbitSpeed + b.phase;
      const x = Math.cos(angle) * b.orbitRadius;
      const z = Math.sin(angle) * b.orbitRadius;
      const y = b.height + Math.sin(t * b.bobSpeed + b.phase) * b.bobAmount;

      pos.set(x, y, z);
      quat.setFromEuler(new THREE.Euler(b.tiltX, angle + Math.PI, b.tiltZ));
      temp.compose(pos, quat, scl);
      booksRef.current.setMatrixAt(i, temp);
    }
    booksRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={booksRef} args={[undefined, undefined, count]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#92400E"
        roughness={0.7}
        emissive="#F59E0B"
        emissiveIntensity={0.05}
      />
    </instancedMesh>
  );
}

// ■■ Token Counter Cylinder ■■
function TokenCounter({
  lod,
  fillLevel = 0.5,
}: {
  lod: ReturnType<typeof useFlagshipLOD>;
  fillLevel: number;
}) {
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!glowRef.current) return;
    const mat = glowRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.2 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
  });

  return (
    <group position={[7, -1, 0]}>
      {/* Outer glass cylinder */}
      <mesh>
        <cylinderGeometry args={[0.5, 0.5, 3, lod.segments, 1, true]} />
        <meshStandardMaterial
          color="#F59E0B"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          metalness={0.3}
          roughness={0.1}
        />
      </mesh>

      {/* Fill level */}
      <mesh position={[0, -1.5 + fillLevel * 1.5, 0]}>
        <cylinderGeometry args={[0.45, 0.45, fillLevel * 3, lod.segments]} />
        <meshStandardMaterial
          color="#F59E0B"
          emissive="#F59E0B"
          emissiveIntensity={0.4}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Top cap */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.1, lod.segments]} />
        <meshStandardMaterial color="#92400E" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Base */}
      <mesh position={[0, -1.5, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.1, lod.segments]} />
        <meshStandardMaterial color="#92400E" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Glow ring */}
      <mesh ref={glowRef} position={[0, -1.5 + fillLevel * 3, 0]}>
        <torusGeometry args={[0.5, 0.03, 4, lod.segments]} />
        <meshBasicMaterial color="#FBBF24" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// ■■ Central AI Brain Mesh ■■
function AIBrain({
  lod,
  isThinking,
}: {
  lod: ReturnType<typeof useFlagshipLOD>;
  isThinking: boolean;
}) {
  const brainRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);

  const detail = lod.level === 'ultra' ? 4 : lod.level === 'high' ? 3 : 2;

  useFrame((state) => {
    if (!brainRef.current) return;
    const t = state.clock.elapsedTime;
    const speed = isThinking ? 2 : 0.3;
    brainRef.current.rotation.y = t * speed * 0.3;
    brainRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;

    if (outerRef.current) {
      const scale = 1 + (isThinking ? Math.sin(t * 4) * 0.1 : Math.sin(t) * 0.03);
      outerRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={[-6, 1.5, 0]}>
      {/* Core brain */}
      <mesh ref={brainRef} castShadow>
        <icosahedronGeometry args={[1, detail]} />
        <meshStandardMaterial
          color="#F59E0B"
          metalness={0.5}
          roughness={0.2}
          emissive="#F59E0B"
          emissiveIntensity={isThinking ? 0.8 : 0.2}
        />
      </mesh>

      {/* Outer shell */}
      <mesh ref={outerRef}>
        <icosahedronGeometry args={[1.3, detail > 1 ? detail - 1 : 1]} />
        <meshStandardMaterial
          color="#FBBF24"
          transparent
          opacity={0.08}
          wireframe
        />
      </mesh>

      {/* Glow point */}
      <pointLight
        intensity={isThinking ? 2 : 0.5}
        color="#F59E0B"
        distance={8}
      />
    </group>
  );
}

// ■■ Writing Desk Surface ■■
function WritingDesk({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  return (
    <group position={[0, -0.5, 0]}>
      {/* Desk surface */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[4, 0.1, 2.5]} />
        <meshStandardMaterial
          color="#1C1917"
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>

      {/* Desk legs */}
      {[[-1.8, -0.5, -1], [1.8, -0.5, -1], [-1.8, -0.5, 1], [1.8, -0.5, 1]].map((pos, i) => (
        <mesh key={i} position={[pos[0], pos[1], pos[2]]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.9, 4]} />
          <meshStandardMaterial color="#92400E" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      {/* Glowing ink well */}
      {lod.enableDetailProps && (
        <mesh position={[1.5, 0.1, -0.8]}>
          <cylinderGeometry args={[0.08, 0.1, 0.12, lod.segments]} />
          <meshStandardMaterial
            color="#F59E0B"
            emissive="#F59E0B"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
    </group>
  );
}

// ■■ Holographic Screens ■■
function HoloScreens({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const screenRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!screenRef.current) return;
    const t = state.clock.elapsedTime;
    screenRef.current.children.forEach((child, i) => {
      child.position.y = 2.5 + Math.sin(t * 0.3 + i * 2) * 0.2;
    });
  });

  if (!lod.enableDetailProps) return null;

  return (
    <group ref={screenRef}>
      {/* Main prompt pattern display */}
      <mesh position={[0, 2.5, -6]} rotation={[0.1, 0, 0]}>
        <planeGeometry args={[4, 2.5]} />
        <meshBasicMaterial
          color="#F59E0B"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Side displays */}
      <mesh position={[-5, 2.5, -4]} rotation={[0, 0.5, 0]}>
        <planeGeometry args={[2, 1.5]} />
        <meshBasicMaterial
          color="#FBBF24"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[5, 2.5, -4]} rotation={[0, -0.5, 0]}>
        <planeGeometry args={[2, 1.5]} />
        <meshBasicMaterial
          color="#FBBF24"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ■■ Ambient Idea Motes ■■
function IdeaMotes({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const count = lod.level === 'ultra' ? 80 : 40;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const moteData = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 16,
      y: Math.random() * 5,
      z: (Math.random() - 0.5) * 16,
      speed: 0.1 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
    })), [count]
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    const temp = new THREE.Matrix4();
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const m = moteData[i];
      const x = m.x + Math.sin(t * m.speed + m.phase) * 1;
      const y = m.y + Math.sin(t * m.speed * 0.5 + m.phase * 2) * 0.5;
      const z = m.z + Math.cos(t * m.speed + m.phase) * 1;
      const scale = 0.03 + Math.sin(t * 2 + i) * 0.01;

      temp.makeScale(scale, scale, scale);
      temp.setPosition(x, y, z);
      meshRef.current.setMatrixAt(i, temp);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!lod.enableParticles) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 4]} />
      <meshBasicMaterial
        color="#FBBF24"
        transparent
        opacity={0.6}
      />
    </instancedMesh>
  );
}

// ■■ Main Environment Component ■■
export interface PromptLabEnvironmentProps {
  isThinking: boolean;
  tokenUsage: number; // 0-1 fill level
}

export default function PromptLabEnvironment({
  isThinking,
  tokenUsage,
}: PromptLabEnvironmentProps) {
  const lod = useFlagshipLOD();

  return (
    <FlagshipEnvironmentWrapper
      labColor="#F59E0B"
      terrainColor="#0F0A05"
      skyTopColor="#080510"
      skyHorizonColor="#1A1005"
      fogColor="#F59E0B"
      heightScale={0.1}
    >
      {/* Floating Library */}
      <FloatingBooks lod={lod} />

      {/* Token Counter */}
      <TokenCounter lod={lod} fillLevel={tokenUsage} />

      {/* AI Brain */}
      <AIBrain lod={lod} isThinking={isThinking} />

      {/* Writing Desk */}
      <WritingDesk lod={lod} />

      {/* Holographic Displays */}
      <HoloScreens lod={lod} />

      {/* Ambient Motes */}
      <IdeaMotes lod={lod} />
    </FlagshipEnvironmentWrapper>
  );
}
