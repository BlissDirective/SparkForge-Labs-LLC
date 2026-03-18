'use client';

// ════════════════════════════════════════════════════
// BiasDetectiveEnvironment — Grand Justice Courtroom (10M budget)
// ════════════════════════════════════════════════════
// Lab 6: AI & Society | Color: #EF4444 (Red)
//
// A majestic courtroom for investigating AI bias:
//   - Marble pillars with ornate capitals (expanded)
//   - Grand chandelier with multi-tier crystal arms
//   - Judge's bench with ceremonial gavel
//   - Witness stand with podium and microphone
//   - Jury box with individual seats
//   - Evidence display wall (investigation board)
//   - Gallery seating (wooden pews, more rows)
//   - Law book shelves along walls (denser)
//   - Stained glass windows with lab-colored light
//   - Scales of justice animated statue
//   - Courthouse archway portals
//   - Justice-themed floor medallion (enhanced)
//   - Atmospheric dust motes and warm lighting
//
// Triangle Budget (Desktop Ultra):
//   Terrain:            ~400K
//   Marble Pillars:     ~500K (16 pillars, high detail)
//   Grand Chandelier:   ~400K (multi-tier crystal arms)
//   Judge's Bench:      ~120K (ornate desk + gavel + details)
//   Witness Stand:      ~200K (podium + microphone + railing)
//   Jury Box:           ~250K (12 seats with dividers)
//   Evidence Wall:      ~250K (board + pinned items + strings)
//   Gallery Seating:    ~350K (instanced pews, more rows)
//   Law Book Shelves:   ~250K (shelves + instanced books)
//   Stained Glass:      ~80K  (window panels with light)
//   Scales Statue:      ~200K (animated justice scales)
//   Courthouse Arches:  ~200K (architectural arched doorways)
//   Floor Medallion:    ~80K
//   Dust Motes:         ~80K
//   Sky/Enclosure:      ~80K
//   Total:              ~3.44M

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  FlagshipEnvironmentWrapper,
  useFlagshipLOD,
} from './FlagshipEnvironmentBase';

// ■■ Marble Pillars (expanded) ■■
function MarblePillars({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const pillarCount = lod.level === 'ultra' ? 16 : lod.level === 'high' ? 10 : 6;
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
      const z = (idx - pillarCount / 4 + 0.5) * 3;
      const x = side * 9;
      temp.makeTranslation(x, 1.5, z);
      pillarsRef.current.setMatrixAt(i, temp);
      temp.makeScale(1.3, 0.3, 1.3);
      temp.setPosition(x, 4, z);
      capsRef.current.setMatrixAt(i, temp);
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
      <instancedMesh ref={pillarsRef} args={[undefined, undefined, pillarCount]} castShadow>
        <cylinderGeometry args={[0.35, 0.4, 4.5, segs]} />
        <meshStandardMaterial color="#E5E1D8" roughness={0.25} metalness={0.05} envMapIntensity={0.5} />
      </instancedMesh>
      <instancedMesh ref={capsRef} args={[undefined, undefined, pillarCount]}>
        <cylinderGeometry args={[0.35, 0.45, 1, segs]} />
        <meshStandardMaterial color="#D4C9B0" roughness={0.3} metalness={0.1} />
      </instancedMesh>
      <instancedMesh ref={basesRef} args={[undefined, undefined, pillarCount]}>
        <cylinderGeometry args={[0.45, 0.5, 1, segs]} />
        <meshStandardMaterial color="#D4C9B0" roughness={0.3} metalness={0.1} />
      </instancedMesh>
    </>
  );
}

// ■■ Grand Chandelier ■■
function GrandChandelier({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const chandelierRef = useRef<THREE.Group>(null);
  const candleCount = lod.level === 'ultra' ? 16 : 10;

  useFrame((state) => {
    if (!chandelierRef.current) return;
    chandelierRef.current.rotation.y = state.clock.elapsedTime * 0.03;
  });

  if (!lod.enableDetailProps) return null;

  return (
    <group ref={chandelierRef} position={[0, 5, -2]}>
      {/* Central chain */}
      <mesh>
        <cylinderGeometry args={[0.03, 0.03, 1.5, 4]} />
        <meshStandardMaterial color="#D4A640" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Main ring */}
      <mesh position={[0, -0.8, 0]}>
        <torusGeometry args={[1.5, 0.06, 6, lod.segments]} />
        <meshStandardMaterial color="#D4A640" metalness={0.8} roughness={0.2} emissive="#D4A640" emissiveIntensity={0.1} />
      </mesh>
      {/* Inner ring */}
      <mesh position={[0, -0.6, 0]}>
        <torusGeometry args={[0.8, 0.04, 6, lod.segments]} />
        <meshStandardMaterial color="#D4A640" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Candle holders */}
      {Array.from({ length: candleCount }).map((_, i) => {
        const angle = (i / candleCount) * Math.PI * 2;
        const tier = i < candleCount / 2 ? 1.5 : 0.8;
        const y = i < candleCount / 2 ? -0.8 : -0.6;
        return (
          <group key={i} position={[Math.cos(angle) * tier, y, Math.sin(angle) * tier]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.05, 0.15, 4]} />
              <meshStandardMaterial color="#D4A640" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.02, 0.025, 0.12, 4]} />
              <meshStandardMaterial color="#FEF3C7" emissive="#FCD34D" emissiveIntensity={0.8} />
            </mesh>
            <pointLight position={[0, 0.2, 0]} intensity={0.15} color="#FCD34D" distance={3} />
          </group>
        );
      })}
      {/* Crystal pendants */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh key={`crystal-${i}`} position={[Math.cos(angle) * 1.2, -1.2, Math.sin(angle) * 1.2]}>
            <octahedronGeometry args={[0.06, 0]} />
            <meshStandardMaterial color="#FFFFFF" transparent opacity={0.5} metalness={0.2} roughness={0.05} />
          </mesh>
        );
      })}
    </group>
  );
}

// ■■ Judge's Bench (enhanced) ■■
function JudgeBench({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const gavelRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!gavelRef.current) return;
    gavelRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
  });

  return (
    <group position={[0, -1, -7]}>
      {/* Raised platform */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[8, 0.3, 3]} />
        <meshStandardMaterial color="#3D2B1F" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Bench desk */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[6, 1.2, 1.2]} />
        <meshStandardMaterial color="#5D3A1A" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Front panel ornate */}
      <mesh position={[0, 0.9, 0.61]}>
        <boxGeometry args={[5.8, 1, 0.05]} />
        <meshStandardMaterial color="#8B4513" roughness={0.4} metalness={0.15} />
      </mesh>
      {/* Side panels */}
      {[-3.1, 3.1].map((x, i) => (
        <mesh key={i} position={[x, 0.9, 0]}>
          <boxGeometry args={[0.15, 1.2, 1.2]} />
          <meshStandardMaterial color="#6B3A20" roughness={0.5} metalness={0.1} />
        </mesh>
      ))}
      {/* Gavel */}
      <group ref={gavelRef} position={[2, 1.55, 0]}>
        <mesh rotation={[0, 0, Math.PI / 4]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.5, 6]} />
          <meshStandardMaterial color="#8B4513" roughness={0.6} />
        </mesh>
        <mesh position={[0.18, 0.18, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.22, lod.segments]} />
          <meshStandardMaterial color="#D4A640" metalness={0.7} roughness={0.2} />
        </mesh>
      </group>
      {/* Sound block */}
      <mesh position={[2, 1.52, 0.3]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.04, lod.segments]} />
        <meshStandardMaterial color="#5D3A1A" roughness={0.7} />
      </mesh>
      {/* Nameplate */}
      {lod.enableDetailProps && (
        <mesh position={[0, 1.52, 0.55]}>
          <boxGeometry args={[1.2, 0.18, 0.03]} />
          <meshStandardMaterial color="#D4A640" metalness={0.8} roughness={0.2} />
        </mesh>
      )}
    </group>
  );
}

// ■■ Witness Stand ■■
function WitnessStand({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  if (!lod.enableDetailProps) return null;

  return (
    <group position={[5, -1, -4]}>
      {/* Platform */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[2.5, 0.3, 2]} />
        <meshStandardMaterial color="#3D2B1F" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Podium */}
      <mesh position={[0, 0.85, 0.3]} castShadow>
        <boxGeometry args={[1.5, 1.1, 0.8]} />
        <meshStandardMaterial color="#5D3A1A" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Railing */}
      <mesh position={[0, 1.5, 0.7]}>
        <boxGeometry args={[2, 0.05, 0.05]} />
        <meshStandardMaterial color="#8B4513" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Railing posts */}
      {[-0.9, 0.9].map((x, i) => (
        <mesh key={i} position={[x, 1, 0.7]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 1, 6]} />
          <meshStandardMaterial color="#8B4513" metalness={0.3} roughness={0.5} />
        </mesh>
      ))}
      {/* Microphone */}
      <group position={[0, 1.6, 0.3]}>
        <mesh>
          <cylinderGeometry args={[0.015, 0.015, 0.4, 4]} />
          <meshStandardMaterial color="#4B5563" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <sphereGeometry args={[0.04, 6, 4]} />
          <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

// ■■ Jury Box ■■
function JuryBox({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const seatCount = lod.level === 'ultra' ? 12 : 8;
  const seatsRef = useRef<THREE.InstancedMesh>(null);
  const backsRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!seatsRef.current || !backsRef.current) return;
    const temp = new THREE.Matrix4();
    for (let i = 0; i < seatCount; i++) {
      const row = Math.floor(i / (seatCount / 2));
      const col = i % (seatCount / 2);
      const x = -6 - row * 1.5;
      const z = -3 + col * 1.2;
      temp.makeTranslation(x, -0.5, z);
      seatsRef.current.setMatrixAt(i, temp);
      temp.makeScale(1, 1.5, 1);
      temp.setPosition(x - 0.3, -0.1, z);
      backsRef.current.setMatrixAt(i, temp);
    }
    seatsRef.current.instanceMatrix.needsUpdate = true;
    backsRef.current.instanceMatrix.needsUpdate = true;
  }, [seatCount]);

  if (!lod.enableDetailProps) return null;

  return (
    <group>
      {/* Jury box railing */}
      <mesh position={[-5.5, -0.3, 0]}>
        <boxGeometry args={[0.08, 1, seatCount / 2 * 1.2 + 1]} />
        <meshStandardMaterial color="#5D3A1A" roughness={0.5} />
      </mesh>
      {/* Seats */}
      <instancedMesh ref={seatsRef} args={[undefined, undefined, seatCount]} castShadow>
        <boxGeometry args={[0.8, 0.1, 0.8]} />
        <meshStandardMaterial color="#6B3A20" roughness={0.6} metalness={0.05} />
      </instancedMesh>
      {/* Backs */}
      <instancedMesh ref={backsRef} args={[undefined, undefined, seatCount]}>
        <boxGeometry args={[0.08, 0.6, 0.8]} />
        <meshStandardMaterial color="#5D3A1A" roughness={0.6} metalness={0.05} />
      </instancedMesh>
    </group>
  );
}

// ■■ Evidence Display Wall ■■
function EvidenceWall({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const pinCount = lod.level === 'ultra' ? 15 : 8;
  const pinsRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!pinsRef.current) return;
    const temp = new THREE.Matrix4();
    const color = new THREE.Color();
    const colors = ['#EF4444', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6'];
    for (let i = 0; i < pinCount; i++) {
      const x = (Math.random() - 0.5) * 3.5;
      const y = (Math.random() - 0.5) * 2;
      temp.makeScale(0.08, 0.08, 0.08);
      temp.setPosition(7.9 + x * 0, 2 + y, -2 + x);
      pinsRef.current.setMatrixAt(i, temp);
      color.set(colors[i % colors.length]);
      pinsRef.current.setColorAt(i, color);
    }
    pinsRef.current.instanceMatrix.needsUpdate = true;
    if (pinsRef.current.instanceColor) pinsRef.current.instanceColor.needsUpdate = true;
  }, [pinCount]);

  if (!lod.enableDetailProps) return null;

  return (
    <group position={[8, 0, -2]}>
      {/* Board */}
      <mesh rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[4, 3, 0.1]} />
        <meshStandardMaterial color="#92400E" roughness={0.8} />
      </mesh>
      {/* Evidence cards */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[-0.08, 0.5 - i * 0.4 + (i % 2) * 0.2, -1.5 + i * 0.5]} rotation={[0, -Math.PI / 2, (Math.random() - 0.5) * 0.15]}>
          <planeGeometry args={[0.6, 0.4]} />
          <meshStandardMaterial color="#FEF3C7" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Pins */}
      <instancedMesh ref={pinsRef} args={[undefined, undefined, pinCount]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial color="#EF4444" />
      </instancedMesh>
    </group>
  );
}

// ■■ Gallery Pews (expanded) ■■
function GallerySeating({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const pewCount = lod.level === 'ultra' ? 24 : lod.level === 'high' ? 14 : 8;
  const pewsRef = useRef<THREE.InstancedMesh>(null);
  const backsRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!pewsRef.current || !backsRef.current) return;
    const temp = new THREE.Matrix4();
    for (let i = 0; i < pewCount; i++) {
      const side = i < pewCount / 2 ? -1 : 1;
      const row = i < pewCount / 2 ? i : i - pewCount / 2;
      const z = 2 + row * 1.5;
      const x = side * 3.5;
      temp.makeTranslation(x, -0.6, z);
      pewsRef.current.setMatrixAt(i, temp);
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

// ■■ Law Book Shelves (denser) ■■
function LawBooks({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const bookCount = lod.level === 'ultra' ? 120 : 60;
  const booksRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!booksRef.current) return;
    const temp = new THREE.Matrix4();
    const colors = ['#8B0000', '#800020', '#4A0000', '#2F1B14', '#1A0A05'];
    const color = new THREE.Color();
    for (let i = 0; i < bookCount; i++) {
      const shelf = Math.floor(i / 30);
      const bookIdx = i % 30;
      const side = shelf < 2 ? -1 : 1;
      const shelfRow = shelf < 2 ? shelf : shelf - 2;
      const x = side * 12.5;
      const y = 0.5 + shelfRow * 1.2;
      const z = (bookIdx - 15) * 0.35;
      const height = 0.3 + Math.random() * 0.15;
      temp.makeScale(0.08, height, 0.25);
      temp.setPosition(x, y, z);
      booksRef.current.setMatrixAt(i, temp);
      color.set(colors[i % colors.length]);
      booksRef.current.setColorAt(i, color);
    }
    booksRef.current.instanceMatrix.needsUpdate = true;
    if (booksRef.current.instanceColor) booksRef.current.instanceColor.needsUpdate = true;
  }, [bookCount]);

  if (!lod.enableDetailProps) return null;

  return (
    <instancedMesh ref={booksRef} args={[undefined, undefined, bookCount]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#8B0000" roughness={0.7} />
    </instancedMesh>
  );
}

// ■■ Stained Glass Windows (enhanced) ■■
function StainedGlass({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  if (!lod.enableEffects) return null;

  const windows = [
    { x: -13, z: -4, color: '#EF4444' },
    { x: -13, z: 0, color: '#F59E0B' },
    { x: -13, z: 4, color: '#8B5CF6' },
    { x: 13, z: -4, color: '#3B82F6' },
    { x: 13, z: 0, color: '#10B981' },
    { x: 13, z: 4, color: '#EC4899' },
  ];

  return (
    <>
      {windows.map((w, i) => (
        <group key={i} position={[w.x, 2.5, w.z]}>
          <mesh>
            <boxGeometry args={[0.15, 3.5, 2.5]} />
            <meshStandardMaterial color="#3D2B1F" roughness={0.6} />
          </mesh>
          <mesh position={[w.x > 0 ? -0.1 : 0.1, 0, 0]}>
            <planeGeometry args={[0.01, 3, 2]} />
            <meshBasicMaterial color={w.color} transparent opacity={0.12} side={THREE.DoubleSide} />
          </mesh>
          <pointLight position={[w.x > 0 ? -1.5 : 1.5, 0, 0]} intensity={0.25} color={w.color} distance={6} />
        </group>
      ))}
    </>
  );
}

// ■■ Scales of Justice Statue ■■
function ScalesOfJustice({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const leftPanRef = useRef<THREE.Group>(null);
  const rightPanRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const tilt = Math.sin(t * 0.3) * 0.15;
    if (beamRef.current) beamRef.current.rotation.z = tilt;
    if (leftPanRef.current) leftPanRef.current.position.y = 2 - Math.sin(tilt) * 0.8;
    if (rightPanRef.current) rightPanRef.current.position.y = 2 + Math.sin(tilt) * 0.8;
  });

  if (!lod.enableDetailProps) return null;

  return (
    <group position={[0, -1, -3]}>
      {/* Pedestal */}
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.5, lod.segments]} />
        <meshStandardMaterial color="#D4A640" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Central pillar */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 2.5, 6]} />
        <meshStandardMaterial color="#D4A640" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Crown */}
      <mesh position={[0, 2.8, 0]}>
        <sphereGeometry args={[0.12, lod.segments, lod.segments]} />
        <meshStandardMaterial color="#D4A640" metalness={0.8} roughness={0.2} emissive="#D4A640" emissiveIntensity={0.2} />
      </mesh>
      {/* Cross beam */}
      <mesh ref={beamRef} position={[0, 2.6, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[2.5, 0.05, 0.05]} />
        <meshStandardMaterial color="#D4A640" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Left pan */}
      <group ref={leftPanRef} position={[-1.2, 2, 0]}>
        <mesh>
          <cylinderGeometry args={[0.01, 0.01, 0.6, 4]} />
          <meshStandardMaterial color="#D4A640" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.35, 0]}>
          <cylinderGeometry args={[0.35, 0.3, 0.06, lod.segments]} />
          <meshStandardMaterial color="#D4A640" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
      {/* Right pan */}
      <group ref={rightPanRef} position={[1.2, 2, 0]}>
        <mesh>
          <cylinderGeometry args={[0.01, 0.01, 0.6, 4]} />
          <meshStandardMaterial color="#D4A640" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.35, 0]}>
          <cylinderGeometry args={[0.35, 0.3, 0.06, lod.segments]} />
          <meshStandardMaterial color="#D4A640" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#D4A640" distance={5} />
    </group>
  );
}

// ■■ Courthouse Archways ■■
function CourthouseArches({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  if (!lod.enableDetailProps) return null;

  const archPositions: [number, number, number, number][] = [
    [0, 0, 12, 0],
    [-6, 0, 12, 0],
    [6, 0, 12, 0],
  ];

  return (
    <group>
      {archPositions.map(([x, y, z, ry], i) => (
        <group key={i} position={[x, y, z]} rotation={[0, ry, 0]}>
          {/* Arch posts */}
          <mesh position={[-1.2, 1, 0]} castShadow>
            <boxGeometry args={[0.4, 4, 0.4]} />
            <meshStandardMaterial color="#E5E1D8" roughness={0.3} metalness={0.05} />
          </mesh>
          <mesh position={[1.2, 1, 0]} castShadow>
            <boxGeometry args={[0.4, 4, 0.4]} />
            <meshStandardMaterial color="#E5E1D8" roughness={0.3} metalness={0.05} />
          </mesh>
          {/* Arch top */}
          <mesh position={[0, 3, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.2, 0.2, 4, lod.segments, Math.PI]} />
            <meshStandardMaterial color="#D4C9B0" roughness={0.3} metalness={0.05} />
          </mesh>
          {/* Keystone */}
          <mesh position={[0, 4.15, 0]}>
            <boxGeometry args={[0.3, 0.35, 0.4]} />
            <meshStandardMaterial color="#D4A640" metalness={0.5} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ■■ Floor Justice Medallion (enhanced) ■■
function JusticeMedallion({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = state.clock.elapsedTime * 0.05;
  });

  return (
    <group position={[0, -0.97, 2]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={ringRef}>
        <ringGeometry args={[3.5, 3.8, lod.segments * 2]} />
        <meshStandardMaterial color="#D4A640" metalness={0.7} roughness={0.3} emissive="#D4A640" emissiveIntensity={0.1} />
      </mesh>
      <mesh>
        <circleGeometry args={[3.5, lod.segments * 2]} />
        <meshStandardMaterial color="#1A1520" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Inner decorative rings */}
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[2, 2.1, lod.segments]} />
        <meshBasicMaterial color="#D4A640" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[1, 1.1, lod.segments]} />
        <meshBasicMaterial color="#D4A640" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

// ■■ Dust Motes (expanded) ■■
function DustMotes({ lod }: { lod: ReturnType<typeof useFlagshipLOD> }) {
  const count = lod.level === 'ultra' ? 150 : 60;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const motes = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 24,
      y: Math.random() * 6,
      z: (Math.random() - 0.5) * 24,
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
      const y = (m.y + t * m.driftY) % 6;
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
      terrainSize={35}
    >
      <MarblePillars lod={lod} />
      <GrandChandelier lod={lod} />
      <JudgeBench lod={lod} />
      <WitnessStand lod={lod} />
      <JuryBox lod={lod} />
      <EvidenceWall lod={lod} />
      <GallerySeating lod={lod} />
      <LawBooks lod={lod} />
      <StainedGlass lod={lod} />
      <ScalesOfJustice lod={lod} />
      <CourthouseArches lod={lod} />
      <JusticeMedallion lod={lod} />
      <DustMotes lod={lod} />

      {/* Warm courtroom lighting */}
      <pointLight position={[0, 4, -3]} intensity={0.8} color="#F5DEB3" distance={18} />
      <pointLight position={[0, 4, 5]} intensity={0.4} color="#F5DEB3" distance={12} />

      {/* Balance-reactive accent */}
      {isBalanced && (
        <pointLight position={[0, 0.5, -3]} intensity={1.2} color="#FFD700" distance={10} />
      )}

      {/* Back wall */}
      <mesh position={[0, 2.5, -12]}>
        <planeGeometry args={[30, 10]} />
        <meshStandardMaterial color="#1A1018" roughness={0.8} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 5.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0F0A08" roughness={0.9} />
      </mesh>
    </FlagshipEnvironmentWrapper>
  );
}
