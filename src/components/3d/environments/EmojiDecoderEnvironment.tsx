'use client';

// ════════════════════════════════════════════════════
// EmojiDecoderEnvironment — Emoji Translation Workshop (FL-Lite ~1.3M budget)
// ════════════════════════════════════════════════════
// Lab 8: AI Communication | Color: #818CF8 (Indigo)
//
// A magical language laboratory where emojis are decoded
// and translated through a fantastical machine:
//   - Giant emoji sculptures on rotating pedestals
//   - Translation machine centerpiece with gears and tubes
//   - Rosetta stone pillars with glowing inscriptions
//   - Cultural display cases around the perimeter
//   - Floating symbol particles drifting through the space
//   - Holographic dictionary screens
//   - Conveyor belt carrying decoded message tiles
//   - Sentiment color waves rippling across the floor
//
// Triangle Budget (Desktop Ultra):
//   Emoji Sculptures (instanced):   ~250K (20 emojis x ~12.5K each)
//   Translation Machine:            ~200K (gears + tubes + conveyor)
//   Rosetta Pillars (instanced):    ~180K (12 pillars x ~15K each)
//   Display Cases (instanced):      ~150K (10 cases x ~15K each)
//   Holographic Screens (instanced):~120K (8 screens x ~15K each)
//   Conveyor Belt + Tiles:          ~100K
//   Floating Symbol Particles:      ~100K
//   Sentiment Floor Waves:          ~80K
//   Misc props + lighting accents:  ~120K
//   Total:                          ~1.3M

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FLLiteEnvironmentWrapper, useFLLiteLOD } from './FLLiteEnvironmentBase';

const LAB_COLOR = '#818CF8';

// ■■ Emoji Sculptures on Pedestals (Instanced) ■■
function EmojiSculptures({ lod }: { lod: ReturnType<typeof useFLLiteLOD> }) {
  const count = lod.level === 'ultra' ? 20 : lod.level === 'high' ? 14 : 8;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const pedestalRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const positions = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 6 + Math.sin(i * 1.7) * 1.5;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0.8, Math.sin(angle) * radius));
    }
    return pts;
  }, [count]);

  React.useEffect(() => {
    if (!meshRef.current || !pedestalRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    const hues = [0.08, 0.12, 0.55, 0.0, 0.33, 0.75, 0.16, 0.95];
    for (let i = 0; i < count; i++) {
      tmp.makeScale(0.4, 0.8, 0.4);
      tmp.setPosition(positions[i].x, -0.2, positions[i].z);
      pedestalRef.current.setMatrixAt(i, tmp);
      tmp.makeScale(0.5, 0.5, 0.5);
      tmp.setPosition(positions[i].x, positions[i].y, positions[i].z);
      meshRef.current.setMatrixAt(i, tmp);
      color.setHSL(hues[i % hues.length], 0.85, 0.6);
      meshRef.current.setColorAt(i, color);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor!.needsUpdate = true;
    pedestalRef.current.instanceMatrix.needsUpdate = true;
  }, [count, positions]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    const tmp = new THREE.Matrix4();
    const rot = new THREE.Quaternion();
    const scl = new THREE.Vector3(0.5, 0.5, 0.5);
    for (let i = 0; i < count; i++) {
      const p = positions[i];
      const bobY = p.y + Math.sin(timeRef.current * 1.2 + i * 0.5) * 0.15;
      rot.setFromEuler(new THREE.Euler(0, timeRef.current * 0.4 + i, 0));
      tmp.compose(new THREE.Vector3(p.x, bobY, p.z), rot, scl);
      meshRef.current.setMatrixAt(i, tmp);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={pedestalRef} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.35, 0.45, 0.8, 12]} />
        <meshStandardMaterial color="#1A1832" metalness={0.6} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
        <dodecahedronGeometry args={[1, lod.level === 'ultra' ? 2 : 1]} />
        <meshStandardMaterial metalness={0.3} roughness={0.4} envMapIntensity={0.5} />
      </instancedMesh>
    </group>
  );
}

// ■■ Translation Machine Centerpiece ■■
function TranslationMachine({ lod, isDecoding }: { lod: ReturnType<typeof useFLLiteLOD>; isDecoding: boolean }) {
  const gearsRef = useRef<THREE.Group>(null);
  const tubeRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (gearsRef.current) {
      gearsRef.current.children.forEach((child, i) => {
        const speed = isDecoding ? 2.0 : 0.3;
        child.rotation.z += delta * speed * (i % 2 === 0 ? 1 : -1);
      });
    }
    if (tubeRef.current) {
      (tubeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        isDecoding ? 0.6 + Math.sin(timeRef.current * 4) * 0.3 : 0.2;
    }
  });

  const gearSegs = lod.level === 'ultra' ? 24 : 16;

  return (
    <group position={[0, 0, 0]}>
      {/* Main body */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[2.5, 2.4, 1.5]} />
        <meshStandardMaterial color="#1A1832" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Gears */}
      <group ref={gearsRef}>
        {[[-1.35, 1.8, 0.76], [1.35, 1.8, 0.76], [0, 0.6, 0.76]].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]} castShadow>
            <torusGeometry args={[0.4, 0.08, 8, gearSegs]} />
            <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
      </group>
      {/* Translucent processing tube */}
      <mesh ref={tubeRef} position={[0, 1.2, 0.8]}>
        <cylinderGeometry args={[0.3, 0.3, 1.8, 16]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.2} transparent opacity={0.4} />
      </mesh>
      {/* Conveyor belt base */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[8, 0.15, 1.0]} />
        <meshStandardMaterial color="#111118" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Conveyor message tiles */}
      {lod.enableDetailProps && (
        <ConveyorTiles lod={lod} isDecoding={isDecoding} />
      )}
    </group>
  );
}

// ■■ Conveyor Message Tiles ■■
function ConveyorTiles({ lod, isDecoding }: { lod: ReturnType<typeof useFLLiteLOD>; isDecoding: boolean }) {
  const count = lod.level === 'ultra' ? 12 : 8;
  const tilesRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const speeds = useMemo(() =>
    Array.from({ length: count }, () => 0.4 + Math.random() * 0.6),
  [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!tilesRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const baseX = -3.5 + (i / count) * 7;
      const x = ((baseX + timeRef.current * speeds[i] * (isDecoding ? 1.5 : 0.3) + 3.5) % 7) - 3.5;
      tmp.makeScale(0.3, 0.06, 0.25);
      tmp.setPosition(x, 0.05, 0);
      tilesRef.current.setMatrixAt(i, tmp);
    }
    tilesRef.current.instanceMatrix.needsUpdate = true;
  });

  React.useEffect(() => {
    if (!tilesRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      tmp.makeScale(0.3, 0.06, 0.25);
      tmp.setPosition(-3.5 + (i / count) * 7, 0.05, 0);
      tilesRef.current.setMatrixAt(i, tmp);
      color.setHSL(0.65 + (i / count) * 0.15, 0.7, 0.55);
      tilesRef.current.setColorAt(i, color);
    }
    tilesRef.current.instanceMatrix.needsUpdate = true;
    if (tilesRef.current.instanceColor) tilesRef.current.instanceColor.needsUpdate = true;
  }, [count]);

  return (
    <instancedMesh ref={tilesRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial metalness={0.4} roughness={0.3} emissive={LAB_COLOR} emissiveIntensity={0.2} />
    </instancedMesh>
  );
}

// ■■ Rosetta Stone Pillars (Instanced) ■■
function RosettaPillars({ lod }: { lod: ReturnType<typeof useFLLiteLOD> }) {
  const count = lod.level === 'ultra' ? 12 : lod.level === 'high' ? 8 : 5;
  const pillarsRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const positions = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 10;
      pts.push(new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r));
    }
    return pts;
  }, [count]);

  React.useEffect(() => {
    if (!pillarsRef.current || !glowRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const height = 2.5 + (i % 3) * 0.5;
      tmp.makeScale(0.5, height, 0.5);
      tmp.setPosition(positions[i].x, height / 2 - 1, positions[i].z);
      pillarsRef.current.setMatrixAt(i, tmp);
      tmp.makeScale(0.6, 0.06, 0.6);
      tmp.setPosition(positions[i].x, height * 0.6, positions[i].z);
      glowRef.current.setMatrixAt(i, tmp);
    }
    pillarsRef.current.instanceMatrix.needsUpdate = true;
    glowRef.current.instanceMatrix.needsUpdate = true;
  }, [count, positions]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!glowRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const p = positions[i];
      const height = 2.5 + (i % 3) * 0.5;
      const y = height * 0.6 + Math.sin(timeRef.current + i * 0.8) * 0.1;
      tmp.makeScale(0.6, 0.06, 0.6);
      tmp.setPosition(p.x, y, p.z);
      glowRef.current.setMatrixAt(i, tmp);
    }
    glowRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={pillarsRef} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, 1, lod.level === 'ultra' ? 16 : 8]} />
        <meshStandardMaterial color="#2A2540" metalness={0.4} roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={glowRef} args={[undefined, undefined, count]}>
        <torusGeometry args={[0.45, 0.04, 6, 16]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.6} transparent opacity={0.7} />
      </instancedMesh>
    </group>
  );
}

// ■■ Display Cases (Instanced) ■■
function DisplayCases({ lod }: { lod: ReturnType<typeof useFLLiteLOD> }) {
  const count = lod.level === 'ultra' ? 10 : lod.level === 'high' ? 7 : 4;
  const casesRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!casesRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.PI / count;
      const r = 8;
      tmp.makeScale(0.8, 1.2, 0.8);
      tmp.setPosition(Math.cos(angle) * r, 0.1, Math.sin(angle) * r);
      casesRef.current.setMatrixAt(i, tmp);
    }
    casesRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  if (!lod.enableDetailProps) return null;

  return (
    <instancedMesh ref={casesRef} args={[undefined, undefined, count]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#1A1828" transparent opacity={0.35} metalness={0.9} roughness={0.1} />
    </instancedMesh>
  );
}

// ■■ Holographic Dictionary Screens (Instanced) ■■
function HolographicScreens({ lod, decodedCount }: { lod: ReturnType<typeof useFLLiteLOD>; decodedCount: number }) {
  const count = lod.level === 'ultra' ? 8 : lod.level === 'high' ? 5 : 3;
  const screensRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const positions = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 1.5 - Math.PI * 0.25;
      pts.push(new THREE.Vector3(Math.cos(angle) * 4, 2.5 + (i % 2) * 0.5, Math.sin(angle) * 4));
    }
    return pts;
  }, [count]);

  React.useEffect(() => {
    if (!screensRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      tmp.makeScale(1.2, 0.8, 0.03);
      tmp.setPosition(positions[i].x, positions[i].y, positions[i].z);
      screensRef.current.setMatrixAt(i, tmp);
    }
    screensRef.current.instanceMatrix.needsUpdate = true;
  }, [count, positions]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!screensRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const p = positions[i];
      const bob = Math.sin(timeRef.current * 0.8 + i) * 0.1;
      tmp.makeScale(1.2, 0.8, 0.03);
      tmp.setPosition(p.x, p.y + bob, p.z);
      screensRef.current.setMatrixAt(i, tmp);
    }
    screensRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!lod.enableDetailProps) return null;

  const intensity = Math.min(0.3 + decodedCount * 0.05, 1.0);

  return (
    <instancedMesh ref={screensRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        color={LAB_COLOR}
        emissive={LAB_COLOR}
        emissiveIntensity={intensity}
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

// ■■ Floating Symbol Particles ■■
function FloatingSymbols({ lod }: { lod: ReturnType<typeof useFLLiteLOD> }) {
  const count = lod.level === 'ultra' ? 80 : lod.level === 'high' ? 50 : 25;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const seeds = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 16,
      y: Math.random() * 5,
      z: (Math.random() - 0.5) * 16,
      speed: 0.2 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    })),
  [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!meshRef.current) return;
    const tmp = new THREE.Matrix4();
    const rot = new THREE.Quaternion();
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const y = ((s.y + timeRef.current * s.speed * 0.3) % 5);
      rot.setFromEuler(new THREE.Euler(timeRef.current * 0.3 + s.phase, timeRef.current * 0.5, 0));
      tmp.compose(
        new THREE.Vector3(s.x + Math.sin(timeRef.current * 0.5 + s.phase) * 0.4, y, s.z),
        rot,
        new THREE.Vector3(0.08, 0.08, 0.08),
      );
      meshRef.current.setMatrixAt(i, tmp);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!lod.enableParticles) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.5} transparent opacity={0.6} />
    </instancedMesh>
  );
}

// ■■ Sentiment Floor Waves ■■
function SentimentWaves({ lod, decodedCount }: { lod: ReturnType<typeof useFLLiteLOD>; decodedCount: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  const geometry = useMemo(() => {
    const segs = lod.level === 'ultra' ? 64 : 32;
    return new THREE.PlaneGeometry(14, 14, segs, segs);
  }, [lod.level]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!meshRef.current) return;
    const pos = meshRef.current.geometry.attributes.position;
    const amplitude = 0.05 + Math.min(decodedCount * 0.01, 0.15);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, Math.sin(x * 0.8 + timeRef.current * 1.5) * Math.cos(y * 0.8 + timeRef.current) * amplitude);
    }
    pos.needsUpdate = true;
  });

  if (!lod.enableEffects) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.95, 0]}>
      <meshStandardMaterial
        color={LAB_COLOR}
        emissive={LAB_COLOR}
        emissiveIntensity={0.15}
        transparent
        opacity={0.12}
        wireframe
      />
    </mesh>
  );
}

// ■■ Main Environment ■■
interface EmojiDecoderEnvironmentProps {
  decodedCount?: number;
  isDecoding?: boolean;
}

export default function EmojiDecoderEnvironment({
  decodedCount = 0,
  isDecoding = false,
}: EmojiDecoderEnvironmentProps) {
  const lod = useFLLiteLOD();

  return (
    <FLLiteEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#0D0B1A"
      skyTopColor="#06041A"
      skyHorizonColor="#12102A"
      fogColor="#818CF8"
    >
      <EmojiSculptures lod={lod} />
      <TranslationMachine lod={lod} isDecoding={isDecoding} />
      <RosettaPillars lod={lod} />
      <DisplayCases lod={lod} />
      <HolographicScreens lod={lod} decodedCount={decodedCount} />
      <FloatingSymbols lod={lod} />
      <SentimentWaves lod={lod} decodedCount={decodedCount} />
    </FLLiteEnvironmentWrapper>
  );
}
