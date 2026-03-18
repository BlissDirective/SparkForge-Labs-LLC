'use client';

// ════════════════════════════════════════════════════
// WordPredictorEnvironment — Language Prediction Library (Standard ~500K budget)
// ════════════════════════════════════════════════════
// Lab 4: Language & Communication | Color: #FFAA44 (Amber)
//
// A grand library with prediction-focused language processing elements:
//   - Floating word bubbles drifting through the space
//   - Probability tree growing from center (branching prediction paths)
//   - Sentence construction conveyor belt
//   - Word frequency heatmap floor tiles
//   - Autocomplete suggestion screens (instanced monitors)
//   - Dictionary towers (tall book stacks)
//   - Grammar circuit boards on walls
//   - Context window visualizer (sliding frame)
//
// Triangle Budget (Desktop Ultra):
//   Floating Word Bubbles:       ~65K  (instanced spheres + glow)
//   Probability Tree:            ~80K  (trunk + branches + leaf nodes)
//   Sentence Conveyor:           ~55K  (belt + word blocks)
//   Heatmap Floor Tiles:         ~40K  (instanced colored tiles)
//   Autocomplete Screens:        ~50K  (instanced monitors + stands)
//   Dictionary Towers:           ~60K  (instanced book stacks)
//   Grammar Circuit Walls:       ~45K  (instanced traces + nodes)
//   Context Window Visualizer:   ~35K  (frame + sliding panels)
//   Library Furniture:           ~40K  (reading desks, shelves)
//   Reserve:                     ~30K
//   Total:                       ~500K

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StandardEnvironmentWrapper, useStandardLOD } from './StandardEnvironmentBase';

const LAB_COLOR = '#FFAA44';

// ■■ Floating Word Bubbles ■■
function WordBubbles({ lod, isPredicting }: { lod: ReturnType<typeof useStandardLOD>; isPredicting: boolean }) {
  const count = lod.level === 'ultra' ? 40 : lod.level === 'high' ? 25 : 12;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const seeds = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 10,
      y: 1.0 + Math.random() * 3.5,
      z: (Math.random() - 0.5) * 8,
      speed: 0.1 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
      size: 0.08 + Math.random() * 0.15,
      hue: 0.08 + Math.random() * 0.06,
    })),
  [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!meshRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    const speedMul = isPredicting ? 2.0 : 1.0;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const drift = Math.sin(timeRef.current * s.speed * speedMul + s.phase);
      const bob = Math.cos(timeRef.current * s.speed * 0.7 + s.phase) * 0.15;
      const scale = s.size * (1 + (isPredicting ? Math.abs(drift) * 0.3 : 0));
      tmp.makeScale(scale * 1.5, scale, scale);
      tmp.setPosition(s.x + drift * 0.5, s.y + bob, s.z);
      meshRef.current.setMatrixAt(i, tmp);
      color.setHSL(s.hue, 0.7, 0.4 + Math.abs(drift) * 0.2);
      meshRef.current.setColorAt(i, color);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, lod.level === 'ultra' ? 12 : 8, 8]} />
      <meshStandardMaterial
        emissive={LAB_COLOR}
        emissiveIntensity={0.3}
        transparent
        opacity={0.6}
        roughness={0.3}
        metalness={0.2}
      />
    </instancedMesh>
  );
}

// ■■ Probability Tree ■■
function ProbabilityTree({ lod, isPredicting }: { lod: ReturnType<typeof useStandardLOD>; isPredicting: boolean }) {
  const branchCount = lod.level === 'ultra' ? 16 : lod.level === 'high' ? 10 : 6;
  const branchRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const branchData = useMemo(() =>
    Array.from({ length: branchCount }, (_, i) => {
      const tier = Math.floor(i / 4);
      const angle = (i % 4) * (Math.PI / 2) + tier * 0.3 + Math.random() * 0.5;
      const radius = 0.5 + tier * 0.8;
      return {
        x: Math.cos(angle) * radius,
        y: 1.0 + tier * 1.0,
        z: Math.sin(angle) * radius,
        rotZ: (Math.random() - 0.5) * 0.8,
        rotX: (Math.random() - 0.5) * 0.4,
        length: 0.5 + Math.random() * 0.6,
      };
    }),
  [branchCount]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!branchRef.current || !leafRef.current) return;
    const tmp = new THREE.Matrix4();
    const rot = new THREE.Quaternion();
    const color = new THREE.Color();
    for (let i = 0; i < branchCount; i++) {
      const b = branchData[i];
      const sway = isPredicting ? Math.sin(timeRef.current * 2 + i) * 0.05 : 0;
      rot.setFromEuler(new THREE.Euler(b.rotX + sway, 0, b.rotZ + sway));
      tmp.compose(
        new THREE.Vector3(b.x, b.y, b.z),
        rot,
        new THREE.Vector3(0.03, b.length, 0.03),
      );
      branchRef.current.setMatrixAt(i, tmp);
      // Leaf node at tip
      const leafScale = 0.06 + (isPredicting ? Math.sin(timeRef.current * 3 + i) * 0.02 : 0);
      tmp.makeScale(leafScale, leafScale, leafScale);
      tmp.setPosition(b.x + Math.sin(b.rotZ) * b.length * 0.5, b.y + b.length * 0.5, b.z);
      leafRef.current.setMatrixAt(i, tmp);
      const bright = isPredicting ? 0.5 + Math.sin(timeRef.current * 2 + i * 0.5) * 0.3 : 0.3;
      color.setHSL(0.08 + i * 0.01, 0.8, bright);
      leafRef.current.setColorAt(i, color);
    }
    branchRef.current.instanceMatrix.needsUpdate = true;
    leafRef.current.instanceMatrix.needsUpdate = true;
    if (leafRef.current.instanceColor) leafRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group position={[0, -0.5, 0]}>
      {/* Trunk */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.15, 1.5, lod.level === 'ultra' ? 12 : 8]} />
        <meshStandardMaterial color="#664422" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Trunk glow ring */}
      <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.02, 6, lod.level === 'ultra' ? 24 : 12]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.5} />
      </mesh>
      {/* Branches */}
      <instancedMesh ref={branchRef} args={[undefined, undefined, branchCount]} castShadow>
        <cylinderGeometry args={[0.5, 1, 1, 6]} />
        <meshStandardMaterial color="#885533" roughness={0.7} metalness={0.1} />
      </instancedMesh>
      {/* Leaf nodes */}
      <instancedMesh ref={leafRef} args={[undefined, undefined, branchCount]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.4} transparent opacity={0.8} />
      </instancedMesh>
    </group>
  );
}

// ■■ Sentence Construction Conveyor ■■
function SentenceConveyor({ lod, wordCount }: { lod: ReturnType<typeof useStandardLOD>; wordCount: number }) {
  const blockCount = lod.level === 'ultra' ? 12 : lod.level === 'high' ? 8 : 5;
  const blocksRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!blocksRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < blockCount; i++) {
      const progress = ((i / blockCount + timeRef.current * 0.08) % 1);
      const x = -4 + progress * 8;
      const bobble = Math.sin(timeRef.current * 2 + i * 0.8) * 0.02;
      const width = 0.2 + (i < wordCount ? 0.1 : 0);
      tmp.makeScale(width, 0.12, 0.15);
      tmp.setPosition(x, 0.35 + bobble, 4);
      blocksRef.current.setMatrixAt(i, tmp);
      color.set(i < wordCount ? LAB_COLOR : '#333340');
      blocksRef.current.setColorAt(i, color);
    }
    blocksRef.current.instanceMatrix.needsUpdate = true;
    if (blocksRef.current.instanceColor) blocksRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {/* Belt track */}
      <mesh position={[0, 0.25, 4]} receiveShadow>
        <boxGeometry args={[9, 0.06, 0.4]} />
        <meshStandardMaterial color="#1A1822" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Belt side rails */}
      <mesh position={[0, 0.32, 3.75]}>
        <boxGeometry args={[9, 0.02, 0.02]} />
        <meshStandardMaterial color="#444" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.32, 4.25]}>
        <boxGeometry args={[9, 0.02, 0.02]} />
        <meshStandardMaterial color="#444" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Word blocks */}
      <instancedMesh ref={blocksRef} args={[undefined, undefined, blockCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.2} />
      </instancedMesh>
    </group>
  );
}

// ■■ Autocomplete Suggestion Screens ■■
function AutocompleteScreens({ lod, isPredicting }: { lod: ReturnType<typeof useStandardLOD>; isPredicting: boolean }) {
  const count = lod.level === 'ultra' ? 6 : lod.level === 'high' ? 4 : 3;
  const screensRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!screensRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 0.6 - Math.PI * 0.3;
      const x = Math.sin(angle) * 5.5;
      const z = -Math.cos(angle) * 5.5;
      const rot = new THREE.Quaternion();
      rot.setFromEuler(new THREE.Euler(0, angle + Math.PI, 0));
      tmp.compose(new THREE.Vector3(x, 2.0, z), rot, new THREE.Vector3(0.8, 0.55, 0.04));
      screensRef.current.setMatrixAt(i, tmp);
    }
    screensRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!screensRef.current) return;
    const mat = screensRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = isPredicting
      ? 0.4 + Math.sin(timeRef.current * 3) * 0.2
      : 0.15;
  });

  return (
    <group>
      <instancedMesh ref={screensRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#111118"
          emissive={LAB_COLOR}
          emissiveIntensity={0.15}
          metalness={0.5}
          roughness={0.3}
        />
      </instancedMesh>
    </group>
  );
}

// ■■ Dictionary Towers ■■
function DictionaryTowers({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const towerCount = lod.level === 'ultra' ? 6 : lod.level === 'high' ? 4 : 2;
  const bookCount = towerCount * 8;
  const booksRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!booksRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    let idx = 0;
    for (let t = 0; t < towerCount; t++) {
      const baseX = -5 + t * (10 / (towerCount - 1 || 1));
      for (let b = 0; b < 8 && idx < bookCount; b++) {
        const y = 0.1 + b * 0.22;
        const rot = new THREE.Quaternion();
        rot.setFromEuler(new THREE.Euler(0, (b % 2) * 0.1 + t * 0.2, 0));
        tmp.compose(
          new THREE.Vector3(baseX, y, -5.5),
          rot,
          new THREE.Vector3(0.35, 0.18, 0.22),
        );
        booksRef.current.setMatrixAt(idx, tmp);
        color.setHSL(0.06 + b * 0.015, 0.5, 0.2 + b * 0.03);
        booksRef.current.setColorAt(idx, color);
        idx++;
      }
    }
    booksRef.current.instanceMatrix.needsUpdate = true;
    if (booksRef.current.instanceColor) booksRef.current.instanceColor.needsUpdate = true;
  }, [towerCount, bookCount]);

  return (
    <instancedMesh ref={booksRef} args={[undefined, undefined, bookCount]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.8} metalness={0.1} />
    </instancedMesh>
  );
}

// ■■ Grammar Circuit Boards (Walls) ■■
function GrammarCircuits({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const traceCount = lod.level === 'ultra' ? 30 : lod.level === 'high' ? 20 : 10;
  const nodeCount = lod.level === 'ultra' ? 15 : lod.level === 'high' ? 10 : 5;
  const tracesRef = useRef<THREE.InstancedMesh>(null);
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!tracesRef.current || !nodesRef.current) return;
    const tmp = new THREE.Matrix4();
    // Traces on side walls
    for (let i = 0; i < traceCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const y = 0.5 + (i / traceCount) * 3;
      const z = (Math.random() - 0.5) * 8;
      const length = 0.5 + Math.random() * 1.5;
      const isHoriz = Math.random() > 0.5;
      const rot = new THREE.Quaternion();
      rot.setFromEuler(new THREE.Euler(0, side > 0 ? -Math.PI / 2 : Math.PI / 2, isHoriz ? 0 : Math.PI / 2));
      tmp.compose(
        new THREE.Vector3(side * 6.4, y, z),
        rot,
        new THREE.Vector3(length, 0.015, 0.015),
      );
      tracesRef.current.setMatrixAt(i, tmp);
    }
    tracesRef.current.instanceMatrix.needsUpdate = true;
    // Circuit nodes
    for (let i = 0; i < nodeCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const y = 0.8 + (i / nodeCount) * 2.5;
      const z = (Math.random() - 0.5) * 7;
      tmp.makeScale(0.04, 0.04, 0.04);
      tmp.setPosition(side * 6.35, y, z);
      nodesRef.current.setMatrixAt(i, tmp);
    }
    nodesRef.current.instanceMatrix.needsUpdate = true;
  }, [traceCount, nodeCount]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!nodesRef.current) return;
    const mat = nodesRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.3 + Math.sin(timeRef.current * 2) * 0.15;
  });

  if (!lod.enableDetailProps) return null;

  return (
    <group>
      <instancedMesh ref={tracesRef} args={[undefined, undefined, traceCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.2} />
      </instancedMesh>
      <instancedMesh ref={nodesRef} args={[undefined, undefined, nodeCount]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshStandardMaterial color="#FFFFFF" emissive={LAB_COLOR} emissiveIntensity={0.3} />
      </instancedMesh>
    </group>
  );
}

// ■■ Context Window Visualizer ■■
function ContextWindowVisualizer({ lod, wordCount }: { lod: ReturnType<typeof useStandardLOD>; wordCount: number }) {
  const frameRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (frameRef.current) {
      frameRef.current.position.x = Math.sin(timeRef.current * 0.3) * 1.5;
      (frameRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.3 + Math.sin(timeRef.current * 2) * 0.1;
    }
  });

  if (!lod.enableDetailProps) return null;

  const windowWidth = 1.5 + Math.min(wordCount, 10) * 0.1;

  return (
    <group position={[0, 3.5, -3]}>
      {/* Context window frame */}
      <mesh ref={frameRef}>
        <boxGeometry args={[windowWidth, 0.6, 0.03]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.3}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Window bracket lines */}
      <mesh position={[-windowWidth / 2 - 0.05, 0, 0]}>
        <boxGeometry args={[0.04, 0.7, 0.02]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[windowWidth / 2 + 0.05, 0, 0]}>
        <boxGeometry args={[0.04, 0.7, 0.02]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// ■■ Main Environment ■■
interface WordPredictorEnvironmentProps {
  wordCount?: number;
  isPredicting?: boolean;
}

export default function WordPredictorEnvironment({
  wordCount = 0,
  isPredicting = false,
}: WordPredictorEnvironmentProps) {
  const lod = useStandardLOD();

  return (
    <StandardEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#0E0A06"
      skyTopColor="#0A0604"
      skyHorizonColor="#1A1208"
      fogColor="#FFAA44"
    >
      <WordBubbles lod={lod} isPredicting={isPredicting} />
      <ProbabilityTree lod={lod} isPredicting={isPredicting} />
      <SentenceConveyor lod={lod} wordCount={wordCount} />
      <AutocompleteScreens lod={lod} isPredicting={isPredicting} />
      <DictionaryTowers lod={lod} />
      <GrammarCircuits lod={lod} />
      <ContextWindowVisualizer lod={lod} wordCount={wordCount} />
      {/* Prediction active glow */}
      {isPredicting && (
        <pointLight position={[0, 2.5, 0]} intensity={1.0} color={LAB_COLOR} distance={10} />
      )}
    </StandardEnvironmentWrapper>
  );
}
