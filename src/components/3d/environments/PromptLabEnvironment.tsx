'use client';

// ════════════════════════════════════════════════════
// PromptLabEnvironment — Enchanted AI Workshop (10M budget)
// ════════════════════════════════════════════════════
// Lab 4: AI & Language | Color: #F59E0B (Amber)
//
// A magical creative workshop for prompt engineering:
//   - Floating book library orbiting the workspace
//   - Spiral library tower with multiple shelf tiers
//   - 3D word cloud constellation floating overhead
//   - Giant typewriter machine as educational centerpiece
//   - Flowing ink rivers on the floor
//   - Token counter cylinder that fills as prompts grow
//   - Central AI brain mesh that pulses during thinking
//   - Inspiration crystal clusters that glow with quality
//   - Dictionary column pillars
//   - Holographic display screens showing prompt patterns
//   - Writing desk with glowing ink trails
//   - Ambient light motes drifting like ideas
//
// Triangle Budget (Desktop Ultra):
//   Terrain:               ~400K
//   Library Tower:         ~500K (spiral structure + shelves + books)
//   Floating Books:        ~400K (200 instanced book meshes)
//   Word Cloud:            ~350K (floating word particles)
//   Typewriter Machine:    ~300K (keys, platen, carriage)
//   Ink Rivers:            ~200K (animated floor streams)
//   Token Counter:         ~100K (cylinder with segments)
//   AI Brain Mesh:         ~200K (high-detail icosahedron + shells)
//   Inspiration Crystals:  ~250K (crystal cluster groups)
//   Dictionary Columns:    ~300K (pillars of stacked blocks)
//   Holographic Screens:   ~150K
//   Writing Desk:          ~60K
//   Light Motes:           ~100K (instanced spheres)
//   Sky/Atmosphere:        ~80K
//   Total:                 ~3.39M

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  DoubleSide,
  Euler,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  Vector3,
} from 'three';
import {
  FlagshipEnvironmentWrapper,
} from './FlagshipEnvironmentBase';

// ■■ Spiral Library Tower ■■
function LibraryTower() {
  const shelfCount = 8;
  const booksPerShelf = 20;
  const booksRef = useRef<InstancedMesh>(null);
  const shelvesRef = useRef<InstancedMesh>(null);
  const bookTotal = shelfCount * booksPerShelf;

  React.useEffect(() => {
    if (!shelvesRef.current || !booksRef.current) return;
    const temp = new Matrix4();
    const pos = new Vector3();
    const quat = new Quaternion();
    const scl = new Vector3();

    for (let i = 0; i < shelfCount; i++) {
      const angle = (i / shelfCount) * Math.PI * 4; // 2 full spirals
      const radius = 3.5;
      const y = 0.5 + i * 1.2;
      pos.set(Math.cos(angle) * radius + 12, y, Math.sin(angle) * radius);
      quat.setFromEuler(new Euler(0, angle, 0));
      scl.set(3, 0.08, 0.6);
      temp.compose(pos, quat, scl);
      shelvesRef.current.setMatrixAt(i, temp);

      // Books on this shelf
      for (let j = 0; j < booksPerShelf; j++) {
        const bookIdx = i * booksPerShelf + j;
        const bx = (j - booksPerShelf / 2) * 0.12;
        const height = 0.2 + Math.random() * 0.15;
        pos.set(
          Math.cos(angle) * radius + 12 + Math.cos(angle + Math.PI / 2) * bx,
          y + 0.04 + height / 2,
          Math.sin(angle) * radius + Math.sin(angle + Math.PI / 2) * bx
        );
        quat.setFromEuler(new Euler(0, angle, 0));
        scl.set(0.08, height, 0.25);
        temp.compose(pos, quat, scl);
        booksRef.current.setMatrixAt(bookIdx, temp);
      }
    }
    shelvesRef.current.instanceMatrix.needsUpdate = true;
    booksRef.current.instanceMatrix.needsUpdate = true;
  }, [shelfCount, booksPerShelf, bookTotal]);

  return (
    <group>
      {/* Central column */}
      <mesh position={[12, 3, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.35, 10, 64]} />
        <meshStandardMaterial color="#5D3A1A" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Shelf planks */}
      <instancedMesh ref={shelvesRef} args={[undefined, undefined, shelfCount]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#92400E" roughness={0.6} metalness={0.1} />
      </instancedMesh>
      {/* Books */}
      <instancedMesh ref={booksRef} args={[undefined, undefined, bookTotal]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#78350F" roughness={0.7} emissive="#F59E0B" emissiveIntensity={0.03} />
      </instancedMesh>
    </group>
  );
}

// ■■ Floating Book Library ■■
function FloatingBooks() {
  const count = 150;
  const booksRef = useRef<InstancedMesh>(null);

  const bookData = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      orbitRadius: 5 + Math.random() * 10,
      orbitSpeed: 0.03 + Math.random() * 0.12,
      height: 1 + Math.random() * 6,
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
    const temp = new Matrix4();
    const pos = new Vector3();
    const quat = new Quaternion();
    const scl = new Vector3(0.4, 0.55, 0.06);

    for (let i = 0; i < count; i++) {
      const b = bookData[i];
      const angle = t * b.orbitSpeed + b.phase;
      pos.set(Math.cos(angle) * b.orbitRadius, b.height + Math.sin(t * b.bobSpeed + b.phase) * b.bobAmount, Math.sin(angle) * b.orbitRadius);
      quat.setFromEuler(new Euler(b.tiltX, angle + Math.PI, b.tiltZ));
      temp.compose(pos, quat, scl);
      booksRef.current.setMatrixAt(i, temp);
    }
    booksRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={booksRef} args={[undefined, undefined, count]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#92400E" roughness={0.7} emissive="#F59E0B" emissiveIntensity={0.05} />
    </instancedMesh>
  );
}

// ■■ Word Cloud Constellation ■■
function WordCloud() {
  const count = 200;
  const meshRef = useRef<InstancedMesh>(null);

  const words = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 20,
      y: 5 + Math.random() * 4,
      z: (Math.random() - 0.5) * 20,
      drift: 0.1 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      size: 0.03 + Math.random() * 0.06,
    })), [count]
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    const temp = new Matrix4();
    const t = state.clock.elapsedTime;
    const color = new Color();

    for (let i = 0; i < count; i++) {
      const w = words[i];
      const x = w.x + Math.sin(t * w.drift + w.phase) * 1.5;
      const y = w.y + Math.sin(t * w.drift * 0.5 + w.phase) * 0.5;
      const z = w.z + Math.cos(t * w.drift + w.phase) * 1.5;
      temp.makeScale(w.size, w.size, w.size);
      temp.setPosition(x, y, z);
      meshRef.current.setMatrixAt(i, temp);
      // Warm color gradient
      color.setHSL(0.1 + (i / count) * 0.05, 0.8, 0.5 + Math.sin(t + i * 0.1) * 0.2);
      meshRef.current.setColorAt(i, color);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#FBBF24" transparent opacity={0.7} />
    </instancedMesh>
  );
}

// ■■ Giant Typewriter Machine ■■
function TypewriterMachine() {
  const carriageRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!carriageRef.current) return;
    // Carriage sweeps back and forth
    carriageRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.3) * 1.5;
  });

  return (
    <group position={[0, -0.3, 6]}>
      {/* Base frame */}
      <mesh castShadow>
        <boxGeometry args={[5, 0.4, 3]} />
        <meshStandardMaterial color="#1C1917" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Back plate */}
      <mesh position={[0, 1.2, -1.2]} castShadow>
        <boxGeometry args={[5, 2, 0.15]} />
        <meshStandardMaterial color="#292524" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Key rows */}
      {[0, 1, 2].map((row) => (
        <group key={row}>
          {Array.from({ length: 10 - row }).map((_, col) => (
            <mesh key={`key-${row}-${col}`} position={[-2 + col * 0.45 + row * 0.2, 0.35 + row * 0.2, 0.8 - row * 0.5]} castShadow>
              <cylinderGeometry args={[0.12, 0.12, 0.08, 8]} />
              <meshStandardMaterial color="#F59E0B" metalness={0.5} roughness={0.3} emissive="#F59E0B" emissiveIntensity={0.1} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Platen roller */}
      <mesh position={[0, 1.8, -0.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.15, 0.15, 5, 64]} />
        <meshStandardMaterial color="#1C1917" roughness={0.9} />
      </mesh>
      {/* Carriage */}
      <mesh ref={carriageRef} position={[0, 2.1, -0.8]} castShadow>
        <boxGeometry args={[0.3, 0.15, 0.3]} />
        <meshStandardMaterial color="#F59E0B" metalness={0.7} roughness={0.2} emissive="#F59E0B" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

// ■■ Ink Rivers (floor) ■■
function InkRivers() {
  const riverCount = 6;
  const riversRef = useRef<Group>(null);

  useFrame((state) => {
    if (!riversRef.current) return;
    const t = state.clock.elapsedTime;
    riversRef.current.children.forEach((river, i) => {
      const mat = (river as Mesh).material as MeshBasicMaterial;
      mat.opacity = 0.08 + Math.sin(t * 0.5 + i * 1.5) * 0.04;
    });
  });

  return (
    <group ref={riversRef}>
      {Array.from({ length: riverCount }).map((_, i) => {
        const angle = (i / riverCount) * Math.PI * 2;
        const cx = Math.cos(angle) * 5;
        const cz = Math.sin(angle) * 5;
        return (
          <mesh key={i} position={[cx, -0.96, cz]} rotation={[-Math.PI / 2, 0, angle]}>
            <planeGeometry args={[12, 0.8, 16, 1]} />
            <meshBasicMaterial color="#F59E0B" transparent opacity={0.08} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

// ■■ Token Counter Cylinder ■■
function TokenCounter({ fillLevel = 0.5 }: { fillLevel: number }) {
  const glowRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!glowRef.current) return;
    const mat = glowRef.current.material as MeshBasicMaterial;
    mat.opacity = 0.2 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
  });

  return (
    <group position={[8, -1, 0]}>
      <mesh>
        <cylinderGeometry args={[0.6, 0.6, 3.5, 64, 1, true]} />
        <meshStandardMaterial color="#F59E0B" transparent opacity={0.08} side={DoubleSide} metalness={0.3} roughness={0.1} />
      </mesh>
      <mesh position={[0, -1.75 + fillLevel * 1.75, 0]}>
        <cylinderGeometry args={[0.55, 0.55, fillLevel * 3.5, 64]} />
        <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.4} transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 1.75, 0]}>
        <cylinderGeometry args={[0.65, 0.65, 0.12, 64]} />
        <meshStandardMaterial color="#92400E" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, -1.75, 0]}>
        <cylinderGeometry args={[0.65, 0.65, 0.12, 64]} />
        <meshStandardMaterial color="#92400E" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh ref={glowRef} position={[0, -1.75 + fillLevel * 3.5, 0]}>
        <torusGeometry args={[0.6, 0.04, 4, 64]} />
        <meshBasicMaterial color="#FBBF24" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// ■■ Central AI Brain Mesh (enhanced) ■■
function AIBrain({ isThinking }: { isThinking: boolean }) {
  const brainRef = useRef<Mesh>(null);
  const shell1Ref = useRef<Mesh>(null);
  const shell2Ref = useRef<Mesh>(null);

  const detail = 4;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const speed = isThinking ? 2 : 0.3;
    if (brainRef.current) {
      brainRef.current.rotation.y = t * speed * 0.3;
      brainRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;
    }
    if (shell1Ref.current) {
      const s = 1 + (isThinking ? Math.sin(t * 4) * 0.1 : Math.sin(t) * 0.03);
      shell1Ref.current.scale.setScalar(s);
      shell1Ref.current.rotation.y = -t * 0.2;
    }
    if (shell2Ref.current) {
      shell2Ref.current.rotation.x = t * 0.15;
      shell2Ref.current.rotation.z = t * 0.1;
    }
  });

  return (
    <group position={[-7, 2, 0]}>
      <mesh ref={brainRef} castShadow>
        <icosahedronGeometry args={[1.2, detail]} />
        <meshStandardMaterial color="#F59E0B" metalness={0.5} roughness={0.2} emissive="#F59E0B" emissiveIntensity={isThinking ? 0.8 : 0.2} />
      </mesh>
      <mesh ref={shell1Ref}>
        <icosahedronGeometry args={[1.5, detail > 1 ? detail - 1 : 1]} />
        <meshStandardMaterial color="#FBBF24" transparent opacity={0.06} wireframe />
      </mesh>
      <mesh ref={shell2Ref}>
        <icosahedronGeometry args={[1.8, 1]} />
        <meshStandardMaterial color="#F59E0B" transparent opacity={0.03} wireframe />
      </mesh>
      <pointLight intensity={isThinking ? 3 : 0.5} color="#F59E0B" distance={10} />
    </group>
  );
}

// ■■ Inspiration Crystals ■■
function InspirationCrystals() {
  const clusterCount = 6;
  const crystalsPerCluster = 8;
  const crystalsRef = useRef<InstancedMesh>(null);
  const totalCrystals = clusterCount * crystalsPerCluster;

  React.useEffect(() => {
    if (!crystalsRef.current) return;
    const temp = new Matrix4();
    const pos = new Vector3();
    const quat = new Quaternion();
    const scl = new Vector3();
    const color = new Color();
    const colors = ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A'];

    for (let c = 0; c < clusterCount; c++) {
      const cAngle = (c / clusterCount) * Math.PI * 2;
      const cx = Math.cos(cAngle) * 10;
      const cz = Math.sin(cAngle) * 10;

      for (let j = 0; j < crystalsPerCluster; j++) {
        const idx = c * crystalsPerCluster + j;
        const angle = (j / crystalsPerCluster) * Math.PI * 2;
        const r = 0.3 + Math.random() * 0.5;
        const h = 0.3 + Math.random() * 1.2;
        pos.set(cx + Math.cos(angle) * r, -0.5 + h / 2, cz + Math.sin(angle) * r);
        quat.setFromEuler(new Euler((Math.random() - 0.5) * 0.4, Math.random() * Math.PI, (Math.random() - 0.5) * 0.4));
        const s = 0.1 + Math.random() * 0.15;
        scl.set(s, h, s);
        temp.compose(pos, quat, scl);
        crystalsRef.current.setMatrixAt(idx, temp);
        color.set(colors[j % colors.length]);
        crystalsRef.current.setColorAt(idx, color);
      }
    }
    crystalsRef.current.instanceMatrix.needsUpdate = true;
    if (crystalsRef.current.instanceColor) crystalsRef.current.instanceColor.needsUpdate = true;
  }, [clusterCount, crystalsPerCluster, totalCrystals]);

  return (
    <instancedMesh ref={crystalsRef} args={[undefined, undefined, totalCrystals]} castShadow>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#F59E0B" metalness={0.4} roughness={0.2} emissive="#F59E0B" emissiveIntensity={0.3} transparent opacity={0.8} />
    </instancedMesh>
  );
}

// ■■ Dictionary Column Pillars ■■
function DictionaryColumns() {
  const columnCount = 6;
  const blocksPerColumn = 12;
  const blocksRef = useRef<InstancedMesh>(null);
  const totalBlocks = columnCount * blocksPerColumn;

  React.useEffect(() => {
    if (!blocksRef.current) return;
    const temp = new Matrix4();
    const color = new Color();
    const colors = ['#78350F', '#92400E', '#A16207', '#854D0E', '#713F12'];

    for (let c = 0; c < columnCount; c++) {
      const angle = (c / columnCount) * Math.PI * 2 + 0.3;
      const x = Math.cos(angle) * 7;
      const z = Math.sin(angle) * 7;

      for (let b = 0; b < blocksPerColumn; b++) {
        const idx = c * blocksPerColumn + b;
        const size = 0.6 + Math.random() * 0.2;
        temp.makeScale(size, 0.3, size);
        temp.setPosition(x + (Math.random() - 0.5) * 0.1, -0.7 + b * 0.35, z + (Math.random() - 0.5) * 0.1);
        blocksRef.current.setMatrixAt(idx, temp);
        color.set(colors[b % colors.length]);
        blocksRef.current.setColorAt(idx, color);
      }
    }
    blocksRef.current.instanceMatrix.needsUpdate = true;
    if (blocksRef.current.instanceColor) blocksRef.current.instanceColor.needsUpdate = true;
  }, [columnCount, blocksPerColumn, totalBlocks]);

  return (
    <instancedMesh ref={blocksRef} args={[undefined, undefined, totalBlocks]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#92400E" roughness={0.7} />
    </instancedMesh>
  );
}

// ■■ Writing Desk Surface ■■
function WritingDesk() {
  return (
    <group position={[0, -0.5, 0]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[4.5, 0.12, 3]} />
        <meshStandardMaterial color="#1C1917" roughness={0.5} metalness={0.3} />
      </mesh>
      {[[-2, -0.55, -1.2], [2, -0.55, -1.2], [-2, -0.55, 1.2], [2, -0.55, 1.2]].map((pos, i) => (
        <mesh key={i} position={[pos[0], pos[1], pos[2]]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 1, 4]} />
          <meshStandardMaterial color="#92400E" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      {(
        <mesh position={[1.8, 0.12, -1]}>
          <cylinderGeometry args={[0.1, 0.12, 0.14, 64]} />
          <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}

// ■■ Holographic Screens ■■
function HoloScreens() {
  const screenRef = useRef<Group>(null);

  useFrame((state) => {
    if (!screenRef.current) return;
    const t = state.clock.elapsedTime;
    screenRef.current.children.forEach((child, i) => {
      child.position.y = 3 + Math.sin(t * 0.3 + i * 2) * 0.2;
    });
  });

  return (
    <group ref={screenRef}>
      <mesh position={[0, 3, -7]} rotation={[0.1, 0, 0]}>
        <planeGeometry args={[5, 3]} />
        <meshBasicMaterial color="#F59E0B" transparent opacity={0.06} side={DoubleSide} />
      </mesh>
      <mesh position={[-6, 3, -5]} rotation={[0, 0.5, 0]}>
        <planeGeometry args={[3, 2]} />
        <meshBasicMaterial color="#FBBF24" transparent opacity={0.05} side={DoubleSide} />
      </mesh>
      <mesh position={[6, 3, -5]} rotation={[0, -0.5, 0]}>
        <planeGeometry args={[3, 2]} />
        <meshBasicMaterial color="#FBBF24" transparent opacity={0.05} side={DoubleSide} />
      </mesh>
    </group>
  );
}

// ■■ Ambient Idea Motes (expanded) ■■
function IdeaMotes() {
  const count = 150;
  const meshRef = useRef<InstancedMesh>(null);

  const moteData = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 22,
      y: Math.random() * 7,
      z: (Math.random() - 0.5) * 22,
      speed: 0.1 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
    })), [count]
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    const temp = new Matrix4();
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const m = moteData[i];
      const x = m.x + Math.sin(t * m.speed + m.phase) * 1.5;
      const y = m.y + Math.sin(t * m.speed * 0.5 + m.phase * 2) * 0.5;
      const z = m.z + Math.cos(t * m.speed + m.phase) * 1.5;
      const scale = 0.03 + Math.sin(t * 2 + i) * 0.01;
      temp.makeScale(scale, scale, scale);
      temp.setPosition(x, y, z);
      meshRef.current.setMatrixAt(i, temp);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 4]} />
      <meshBasicMaterial color="#FBBF24" transparent opacity={0.6} />
    </instancedMesh>
  );
}

// ■■ Main Environment Component ■■
export interface PromptLabEnvironmentProps {
  isThinking: boolean;
  tokenUsage: number;
}

export default function PromptLabEnvironment({ isThinking, tokenUsage }: PromptLabEnvironmentProps) {

  return (
    <FlagshipEnvironmentWrapper
      labColor="#F59E0B"
      terrainColor="#0F0A05"
      skyTopColor="#080510"
      skyHorizonColor="#1A1005"
      fogColor="#F59E0B"
      heightScale={0.1}
      terrainSize={50}
    >
      <LibraryTower />
      <FloatingBooks />
      <WordCloud />
      <TypewriterMachine />
      <InkRivers />
      <TokenCounter fillLevel={tokenUsage} />
      <AIBrain isThinking={isThinking} />
      <InspirationCrystals />
      <DictionaryColumns />
      <WritingDesk />
      <HoloScreens />
      <IdeaMotes />
    </FlagshipEnvironmentWrapper>
  );
}
