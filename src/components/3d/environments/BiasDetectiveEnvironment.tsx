'use client';

// ════════════════════════════════════════════════════
// BiasDetectiveEnvironment — Justice Courtroom (5M budget)
// ════════════════════════════════════════════════════
// Lab 6: AI & Society | Color: #EF4444 (Red)
//
// Transforms Bias Detective into a grand courtroom:
//   - Marble pillars with ornate capitals
//   - Judge's bench with ceremonial gavel
//   - Gallery seating (wooden pews)
//   - Law book shelves along walls
//   - Stained glass windows with lab-colored light
//   - Evidence display boards
//   - Justice-themed floor medallion
//   - Atmospheric dust motes and warm lighting
//
// Triangle Budget (Desktop Ultra):
//   Terrain:            ~200K
//   Marble Pillars:     ~300K (12 pillars, high detail)
//   Judge's Bench:      ~80K  (ornate desk + gavel)
//   Gallery Seating:    ~200K (instanced pews)
//   Law Book Shelves:   ~150K (shelves + instanced books)
//   Stained Glass:      ~40K  (window panels)
//   Evidence Boards:    ~30K
//   Floor Medallion:    ~50K
//   Dust Motes:         ~40K
//   Sky/Enclosure:      ~50K
//   Total:              ~1.14M

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  FlagshipEnvironmentWrapper,
  useFlagshipLOD,
} from './FlagshipEnvironmentBase';

// ■■ Marble Pillars ■■
function MarblePillars({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const pillarCount = lod.level === 'ultra' ? 12 : lod.level === 'high' ? 8 : 4;
  const pillarsRef = useRef<THREE.InstancedMesh>(null);
  const capsRef = useRef<THREE.InstancedMesh>(null);
  const basesRef = useRef<THREE.InstancedMesh>(null);

  const segs = lod.segments;

  React.useEffect(() => {
    if (!pillarsRef.current || !capsRef.current || !basesRef.current) return;
    const temp = new THREE.Matrix4();

    for (let i = 0; i < pillarCount; i++) {
      const side = i < pillarCount / 2 ? -1 : 1;
      const idx = i < pillarCount / 2 ? i : i - pillarCount / 2;
      const z = (idx - pillarCount / 4 + 0.5) * 3.5;
      const x = side * 8;

      // Pillar shaft
      temp.makeTranslation(x, 1.5, z);
      pillarsRef.current.setMatrixAt(i, temp);

      // Capital (top)
      temp.makeScale(1.3, 0.3, 1.3);
      temp.setPosition(x, 3.5, z);
      capsRef.current.setMatrixAt(i, temp);

      // Base
      temp.makeScale(1.4, 0.2, 1.4);
      temp.setPosition(x, -0.9, z);
      basesRef.current.setMatrixAt(i, temp);
    }
    pillarsRef.current.instanceMatrix.needsUpdate = true;
    capsRef.current.instanceMatrix.needsUpdate = true;
    basesRef.current.instanceMatrix.needsUpdate = true;
  }, [pillarCount]);

  return (
    <>
      {/* Pillar shafts */}
      <instancedMesh ref={pillarsRef} args={[undefined, undefined, pillarCount]} castShadow>
        <cylinderGeometry args={[0.35, 0.4, 4, segs]} />
        <meshStandardMaterial
          color="#E5E1D8"
          roughness={0.25}
          metalness={0.05}
          envMapIntensity={0.5}
        />
      </instancedMesh>

      {/* Capitals */}
      <instancedMesh ref={capsRef} args={[undefined, undefined, pillarCount]}>
        <cylinderGeometry args={[0.35, 0.45, 1, segs]} />
        <meshStandardMaterial
          color="#D4C9B0"
          roughness={0.3}
          metalness={0.1}
        />
      </instancedMesh>

      {/* Bases */}
      <instancedMesh ref={basesRef} args={[undefined, undefined, pillarCount]}>
        <cylinderGeometry args={[0.45, 0.5, 1, segs]} />
        <meshStandardMaterial
          color="#D4C9B0"
          roughness={0.3}
          metalness={0.1}
        />
      </instancedMesh>
    </>
  );
}

// ■■ Judge's Bench ■■
function JudgeBench({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const gavelRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!gavelRef.current) return;
    // Gentle rotation on display
    gavelRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
  });

  return (
    <group position={[0, -1, -6]}>
      {/* Bench desk */}
      <mesh castShadow>
        <boxGeometry args={[5, 1.5, 1.2]} />
        <meshStandardMaterial
          color="#5D3A1A"
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>

      {/* Bench front panel (ornate) */}
      <mesh position={[0, 0, 0.61]}>
        <boxGeometry args={[4.8, 1.3, 0.05]} />
        <meshStandardMaterial
          color="#8B4513"
          roughness={0.4}
          metalness={0.15}
        />
      </mesh>

      {/* Gavel */}
      <group ref={gavelRef} position={[1.5, 0.8, 0]}>
        {/* Handle */}
        <mesh rotation={[0, 0, Math.PI / 4]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.5, 6]} />
          <meshStandardMaterial color="#8B4513" roughness={0.6} />
        </mesh>
        {/* Head */}
        <mesh position={[0.18, 0.18, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.2, lod.segments]} />
          <meshStandardMaterial
            color="#D4A640"
            metalness={0.7}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Sound block (gavel pad) */}
      <mesh position={[1.5, 0.76, 0.3]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.04, lod.segments]} />
        <meshStandardMaterial color="#5D3A1A" roughness={0.7} />
      </mesh>

      {/* Nameplate */}
      {lod.enableDetailProps && (
        <mesh position={[0, 0.76, 0.55]}>
          <boxGeometry args={[1, 0.15, 0.03]} />
          <meshStandardMaterial
            color="#D4A640"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      )}
    </group>
  );
}

// ■■ Gallery Pews ■■
function GallerySeating({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const pewCount = lod.level === 'ultra' ? 16 : lod.level === 'high' ? 10 : 6;
  const pewsRef = useRef<THREE.InstancedMesh>(null);
  const backsRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!pewsRef.current || !backsRef.current) return;
    const temp = new THREE.Matrix4();

    for (let i = 0; i < pewCount; i++) {
      const side = i < pewCount / 2 ? -1 : 1;
      const row = i < pewCount / 2 ? i : i - pewCount / 2;
      const z = 2 + row * 1.8;
      const x = side * 3.5;

      // Seat
      temp.makeTranslation(x, -0.6, z);
      pewsRef.current.setMatrixAt(i, temp);

      // Back
      temp.makeScale(1, 1.5, 1);
      temp.setPosition(x, -0.2, z + 0.35);
      backsRef.current.setMatrixAt(i, temp);
    }
    pewsRef.current.instanceMatrix.needsUpdate = true;
    backsRef.current.instanceMatrix.needsUpdate = true;
  }, [pewCount]);

  return (
    <>
      <instancedMesh ref={pewsRef} args={[undefined, undefined, pewCount]} castShadow>
        <boxGeometry args={[2.5, 0.12, 0.6]} />
        <meshStandardMaterial color="#6B3A20" roughness={0.6} metalness={0.05} />
      </instancedMesh>
      <instancedMesh ref={backsRef} args={[undefined, undefined, pewCount]}>
        <boxGeometry args={[2.5, 0.08, 0.5]} />
        <meshStandardMaterial color="#5D3A1A" roughness={0.6} metalness={0.05} />
      </instancedMesh>
    </>
  );
}

// ■■ Law Book Shelves ■■
function LawBooks({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const bookCount = lod.level === 'ultra' ? 80 : 40;
  const booksRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!booksRef.current) return;
    const temp = new THREE.Matrix4();
    const colors = ['#8B0000', '#800020', '#4A0000', '#2F1B14', '#1A0A05'];
    const color = new THREE.Color();

    for (let i = 0; i < bookCount; i++) {
      const shelf = Math.floor(i / 20);
      const bookIdx = i % 20;
      const side = shelf < 2 ? -1 : 1;
      const shelfRow = shelf < 2 ? shelf : shelf - 2;

      const x = side * 11.5;
      const y = 0.5 + shelfRow * 1.5;
      const z = (bookIdx - 10) * 0.4;
      const height = 0.3 + Math.random() * 0.15;

      temp.makeScale(0.08, height, 0.25);
      temp.setPosition(x, y, z);
      booksRef.current.setMatrixAt(i, temp);

      color.set(colors[i % colors.length]);
      booksRef.current.setColorAt(i, color);
    }
    booksRef.current.instanceMatrix.needsUpdate = true;
    if (booksRef.current.instanceColor) {
      booksRef.current.instanceColor.needsUpdate = true;
    }
  }, [bookCount]);

  if (!lod.enableDetailProps) return null;

  return (
    <instancedMesh ref={booksRef} args={[undefined, undefined, bookCount]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#8B0000" roughness={0.7} />
    </instancedMesh>
  );
}

// ■■ Stained Glass Windows ■■
function StainedGlass({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  if (!lod.enableEffects) return null;

  const windowPositions = [
    { x: -12, z: -3, color: '#EF4444' },
    { x: -12, z: 3, color: '#F59E0B' },
    { x: 12, z: -3, color: '#3B82F6' },
    { x: 12, z: 3, color: '#8B5CF6' },
  ];

  return (
    <>
      {windowPositions.map((w, i) => (
        <group key={i} position={[w.x, 2, w.z]}>
          {/* Window frame */}
          <mesh>
            <boxGeometry args={[0.15, 3, 2]} />
            <meshStandardMaterial color="#3D2B1F" roughness={0.6} />
          </mesh>
          {/* Glass panel */}
          <mesh position={[w.x > 0 ? -0.1 : 0.1, 0, 0]}>
            <planeGeometry args={[0.01, 2.5, 1.5]} />
            <meshBasicMaterial
              color={w.color}
              transparent
              opacity={0.15}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Light from window */}
          <pointLight
            position={[w.x > 0 ? -1 : 1, 0, 0]}
            intensity={0.3}
            color={w.color}
            distance={6}
          />
        </group>
      ))}
    </>
  );
}

// ■■ Floor Justice Medallion ■■
function JusticeMedallion({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = state.clock.elapsedTime * 0.05;
  });

  return (
    <group position={[0, -0.97, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Outer ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[3, 3.3, lod.segments * 2]} />
        <meshStandardMaterial
          color="#D4A640"
          metalness={0.7}
          roughness={0.3}
          emissive="#D4A640"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Inner circle */}
      <mesh>
        <circleGeometry args={[3, lod.segments * 2]} />
        <meshStandardMaterial
          color="#1A1520"
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>

      {/* Scale symbol (simplified) */}
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[1.5, 1.6, lod.segments]} />
        <meshBasicMaterial
          color="#D4A640"
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}

// ■■ Dust Motes ■■
function DustMotes({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const count = lod.level === 'ultra' ? 100 : 50;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const motes = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 20,
      y: Math.random() * 5,
      z: (Math.random() - 0.5) * 20,
      driftX: (Math.random() - 0.5) * 0.1,
      driftY: 0.02 + Math.random() * 0.05,
      phase: Math.random() * Math.PI * 2,
    })), [count]
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    const temp = new THREE.Matrix4();
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const m = motes[i];
      const y = (m.y + t * m.driftY) % 5;
      const x = m.x + Math.sin(t * 0.3 + m.phase) * m.driftX * 5;
      const z = m.z + Math.cos(t * 0.2 + m.phase) * m.driftX * 5;

      temp.makeScale(0.015, 0.015, 0.015);
      temp.setPosition(x, y, z);
      meshRef.current.setMatrixAt(i, temp);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!lod.enableParticles) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#F5DEB3" transparent opacity={0.4} />
    </instancedMesh>
  );
}

// ■■ Main Environment Component ■■
export interface BiasDetectiveEnvironmentProps {
  isBalanced: boolean;
  caseColor?: string;
}

export default function BiasDetectiveEnvironment({
  isBalanced,
  caseColor: _caseColor = '#EF4444',
}: BiasDetectiveEnvironmentProps) {
  const lod = useFlagshipLOD();

  return (
    <FlagshipEnvironmentWrapper
      labColor="#EF4444"
      terrainColor="#0F0808"
      skyTopColor="#050305"
      skyHorizonColor="#1A0A0A"
      fogColor="#EF4444"
      heightScale={0.02}
      terrainSize={30}
    >
      {/* Courtroom Architecture */}
      <MarblePillars lod={lod} />
      <JudgeBench lod={lod} />
      <GallerySeating lod={lod} />
      <LawBooks lod={lod} />
      <StainedGlass lod={lod} />
      <JusticeMedallion lod={lod} />

      {/* Atmospheric Dust */}
      <DustMotes lod={lod} />

      {/* Warm courtroom lighting */}
      <pointLight
        position={[0, 4, -3]}
        intensity={0.8}
        color="#F5DEB3"
        distance={15}
      />

      {/* Balance-reactive accent */}
      {isBalanced && (
        <pointLight
          position={[0, 0.5, 0]}
          intensity={1}
          color="#FFD700"
          distance={8}
        />
      )}

      {/* Walls */}
      <mesh position={[0, 2, -10]}>
        <planeGeometry args={[26, 8]} />
        <meshStandardMaterial color="#1A1018" roughness={0.8} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color="#0F0A08" roughness={0.9} />
      </mesh>
    </FlagshipEnvironmentWrapper>
  );
}
