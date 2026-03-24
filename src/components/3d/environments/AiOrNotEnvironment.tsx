'use client';

// ════════════════════════════════════════════════════
// AiOrNotEnvironment — AI Art Gallery / Exhibition Hall (FL-Lite ~1.3M budget)
// ════════════════════════════════════════════════════
// Lab 10: AI Futures | Color: #D946EF (Fuchsia)
//
// A grand exhibition hall where players judge AI vs human art:
//   - Exhibition hall with display pedestals (instanced)
//   - Ornate picture frames on walls (instanced gallery)
//   - Voting booth stations (instanced kiosks)
//   - Holographic "HUMAN" and "AI" label projections
//   - Spotlight lighting rigs above displays
//   - Gallery visitor silhouettes (instanced figures)
//   - Verdict particles (green/red floating indicators)
//   - Grand entrance archway with neon "GALLERY" text
//
// Triangle Budget (Desktop Ultra):
//   Display Pedestals (instanced):   ~200K (16 pedestals x ~12.5K)
//   Picture Frames (instanced):      ~180K (20 frames x ~9K each)
//   Voting Booths (instanced):       ~120K (8 kiosks x ~15K each)
//   Label Projections:               ~80K  (holographic text planes)
//   Spotlight Rigs (instanced):      ~100K (16 spotlights)
//   Visitor Silhouettes (instanced): ~120K (12 figures x ~10K)
//   Verdict Particles:               ~100K (floating indicators)
//   Grand Entrance Archway:          ~150K (arch + neon details)
//   Gallery walls + floor accents:   ~150K
//   Total:                           ~1.3M

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FLLiteEnvironmentWrapper, useFLLiteLOD } from './FLLiteEnvironmentBase';

const LAB_COLOR = '#D946EF';

// ■■ Display Pedestals (Instanced) ■■
function DisplayPedestals({ lod }: { lod: ReturnType<typeof useFLLiteLOD> }) {
  const count = 16;
  const pedestalsRef = useRef<THREE.InstancedMesh>(null);
  const topPlateRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!pedestalsRef.current || !topPlateRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / (count / 2));
      const col = i % Math.ceil(count / 2);
      const x = (col - Math.ceil(count / 4)) * 2.2;
      const z = row === 0 ? -3 : 3;
      // Column
      tmp.makeScale(0.35, 1.0, 0.35);
      tmp.setPosition(x, 0, z);
      pedestalsRef.current.setMatrixAt(i, tmp);
      // Top plate
      tmp.makeScale(0.5, 0.06, 0.5);
      tmp.setPosition(x, 0.53, z);
      topPlateRef.current.setMatrixAt(i, tmp);
    }
    pedestalsRef.current.instanceMatrix.needsUpdate = true;
    topPlateRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  return (
    <group>
      <instancedMesh ref={pedestalsRef} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, 1.0, 16} />
        <meshStandardMaterial color="#1E1828" metalness={0.5} roughness={0.4} />
      </instancedMesh>
      <instancedMesh ref={topPlateRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[1, 1, 1, 16} />
        <meshStandardMaterial color="#2A2238" metalness={0.7} roughness={0.2} />
      </instancedMesh>
    </group>
  );
}

// ■■ Picture Frames on Walls (Instanced) ■■
function PictureFrames({ lod }: { lod: ReturnType<typeof useFLLiteLOD> }) {
  const count = 20;
  const framesRef = useRef<THREE.InstancedMesh>(null);
  const canvasRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!framesRef.current || !canvasRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const along = (Math.floor(i / 2) - count / 4) * 2.0;
      const wallZ = side * 8;
      const height = 2.0 + (i % 3) * 0.4;
      // Frame border
      const rot = new THREE.Quaternion();
      rot.setFromEuler(new THREE.Euler(0, side > 0 ? Math.PI : 0, 0));
      tmp.compose(
        new THREE.Vector3(along, height, wallZ),
        rot,
        new THREE.Vector3(1.2, 0.9, 0.08),
      );
      framesRef.current.setMatrixAt(i, tmp);
      // Inner canvas
      tmp.compose(
        new THREE.Vector3(along, height, wallZ - side * 0.01),
        rot,
        new THREE.Vector3(1.0, 0.7, 0.01),
      );
      canvasRef.current.setMatrixAt(i, tmp);
      color.setHSL(0.75 + (i / count) * 0.2, 0.3, 0.15);
      canvasRef.current.setColorAt(i, color);
    }
    framesRef.current.instanceMatrix.needsUpdate = true;
    canvasRef.current.instanceMatrix.needsUpdate = true;
    if (canvasRef.current.instanceColor) canvasRef.current.instanceColor.needsUpdate = true;
  }, [count]);

  return (
    <group>
      <instancedMesh ref={framesRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#8B7355" metalness={0.6} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={canvasRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial metalness={0.1} roughness={0.8} />
      </instancedMesh>
    </group>
  );
}

// ■■ Voting Booth Stations (Instanced) ■■
function VotingBooths({ lod, isJudging }: { lod: ReturnType<typeof useFLLiteLOD>; isJudging: boolean }) {
  const count = 8;
  const boothsRef = useRef<THREE.InstancedMesh>(null);
  const screensRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!boothsRef.current || !screensRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * 2.5;
      // Booth body
      tmp.makeScale(0.6, 1.2, 0.4);
      tmp.setPosition(x, 0.1, 6);
      boothsRef.current.setMatrixAt(i, tmp);
      // Screen
      tmp.makeScale(0.45, 0.35, 0.02);
      tmp.setPosition(x, 0.9, 5.78);
      screensRef.current.setMatrixAt(i, tmp);
    }
    boothsRef.current.instanceMatrix.needsUpdate = true;
    screensRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!screensRef.current) return;
    const mat = screensRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = isJudging
      ? 0.5 + Math.sin(timeRef.current * 4) * 0.25
      : 0.2;
  });

  return (
    <group>
      <instancedMesh ref={boothsRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1A1628" metalness={0.5} roughness={0.4} />
      </instancedMesh>
      <instancedMesh ref={screensRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.2}
          transparent
          opacity={0.6}
        />
      </instancedMesh>
    </group>
  );
}

// ■■ Holographic Label Projections ■■
function LabelProjections({ lod, isJudging }: { lod: ReturnType<typeof useFLLiteLOD>; isJudging: boolean }) {
  const humanRef = useRef<THREE.Mesh>(null);
  const aiRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const pulse = isJudging ? 0.5 + Math.sin(timeRef.current * 3) * 0.3 : 0.15;
    if (humanRef.current) {
      (humanRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
      humanRef.current.position.y = 3.5 + Math.sin(timeRef.current * 0.8) * 0.1;
    }
    if (aiRef.current) {
      (aiRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
      aiRef.current.position.y = 3.5 + Math.sin(timeRef.current * 0.8 + Math.PI) * 0.1;
    }
  });

  return (
    <group>
      {/* HUMAN label */}
      <mesh ref={humanRef} position={[-3, 3.5, 0]}>
        <boxGeometry args={[1.8, 0.5, 0.03]} />
        <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={0.15} transparent opacity={0.5} />
      </mesh>
      {/* AI label */}
      <mesh ref={aiRef} position={[3, 3.5, 0]}>
        <boxGeometry args={[1.2, 0.5, 0.03]} />
        <meshStandardMaterial color="#FF6644" emissive="#FF6644" emissiveIntensity={0.15} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

// ■■ Spotlight Rigs (Instanced) ■■
function SpotlightRigs({ lod }: { lod: ReturnType<typeof useFLLiteLOD> }) {
  const count = 16;
  const lightsRef = useRef<THREE.InstancedMesh>(null);
  const armRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!lightsRef.current || !armRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / (count / 2));
      const col = i % Math.ceil(count / 2);
      const x = (col - Math.ceil(count / 4)) * 2.0;
      const z = row === 0 ? -3 : 3;
      // Light cone
      const rot = new THREE.Quaternion();
      rot.setFromEuler(new THREE.Euler(Math.PI, 0, 0));
      tmp.compose(
        new THREE.Vector3(x, 4.5, z),
        rot,
        new THREE.Vector3(0.15, 0.2, 0.15),
      );
      lightsRef.current.setMatrixAt(i, tmp);
      // Arm
      tmp.makeScale(0.03, 0.4, 0.03);
      tmp.setPosition(x, 4.8, z);
      armRef.current.setMatrixAt(i, tmp);
    }
    lightsRef.current.instanceMatrix.needsUpdate = true;
    armRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!lightsRef.current) return;
    const mat = lightsRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.5 + Math.sin(timeRef.current * 1.2) * 0.15;
  });

  return (
    <group>
      <instancedMesh ref={lightsRef} args={[undefined, undefined, count]}>
        <coneGeometry args={[1, 1, 8]} />
        <meshStandardMaterial color="#FFEECC" emissive="#FFEECC" emissiveIntensity={0.5} />
      </instancedMesh>
      <instancedMesh ref={armRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshStandardMaterial color="#333340" metalness={0.7} roughness={0.3} />
      </instancedMesh>
    </group>
  );
}

// ■■ Gallery Visitor Silhouettes (Instanced) ■■
function VisitorSilhouettes({ lod }: { lod: ReturnType<typeof useFLLiteLOD> }) {
  const count = 12;
  const bodiesRef = useRef<THREE.InstancedMesh>(null);
  const headsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const wanderSeeds = useMemo(() =>
    Array.from({ length: count }, () => ({
      baseX: (Math.random() - 0.5) * 10,
      baseZ: (Math.random() - 0.5) * 6,
      speed: 0.1 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
      wanderRadius: 0.5 + Math.random() * 1.0,
    })),
  [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!bodiesRef.current || !headsRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const s = wanderSeeds[i];
      const x = s.baseX + Math.sin(timeRef.current * s.speed + s.phase) * s.wanderRadius;
      const z = s.baseZ + Math.cos(timeRef.current * s.speed * 0.7 + s.phase) * s.wanderRadius;
      // Body
      tmp.makeScale(0.2, 0.7, 0.15);
      tmp.setPosition(x, 0.0, z);
      bodiesRef.current.setMatrixAt(i, tmp);
      // Head
      tmp.makeScale(0.12, 0.12, 0.12);
      tmp.setPosition(x, 0.48, z);
      headsRef.current.setMatrixAt(i, tmp);
    }
    bodiesRef.current.instanceMatrix.needsUpdate = true;
    headsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={bodiesRef} args={[undefined, undefined, count]}>
        <capsuleGeometry args={[1, 1, 4, 8]} />
        <meshStandardMaterial color="#1A1525" transparent opacity={0.5} />
      </instancedMesh>
      <instancedMesh ref={headsRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#1A1525" transparent opacity={0.5} />
      </instancedMesh>
    </group>
  );
}

// ■■ Verdict Particles (Green/Red Floating) ■■
function VerdictParticles({ lod, correctCount }: { lod: ReturnType<typeof useFLLiteLOD>; correctCount: number }) {
  const count = 50;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const seeds = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: (Math.random() - 0.5) * 14,
      y: Math.random() * 5,
      z: (Math.random() - 0.5) * 12,
      speed: 0.15 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
      isCorrect: i < Math.min(correctCount * 3, count),
    })),
  [count, correctCount]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!meshRef.current) return;
    const tmp = new THREE.Matrix4();
    const rot = new THREE.Quaternion();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const y = ((s.y + timeRef.current * s.speed * 0.2) % 5);
      rot.setFromEuler(new THREE.Euler(timeRef.current * 0.5 + s.phase, timeRef.current * 0.3, 0));
      tmp.compose(
        new THREE.Vector3(s.x + Math.sin(timeRef.current * 0.4 + s.phase) * 0.5, y, s.z),
        rot,
        new THREE.Vector3(0.06, 0.06, 0.06),
      );
      meshRef.current.setMatrixAt(i, tmp);
      color.set(s.isCorrect ? '#00FF88' : '#FF4444');
      meshRef.current.setColorAt(i, color);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.5} transparent opacity={0.7} />
    </instancedMesh>
  );
}

// ■■ Grand Entrance Archway ■■
function GrandEntrance({ lod }: { lod: ReturnType<typeof useFLLiteLOD> }) {
  const neonRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (neonRef.current) {
      (neonRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.5 + Math.sin(timeRef.current * 2.5) * 0.2;
    }
  });

  const archSegs = 32;

  return (
    <group position={[0, 0, -9]}>
      {/* Left pillar */}
      <mesh position={[-2.0, 1.8, 0]} castShadow>
        <boxGeometry args={[0.5, 3.6, 0.5]} />
        <meshStandardMaterial color="#2A2035" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Right pillar */}
      <mesh position={[2.0, 1.8, 0]} castShadow>
        <boxGeometry args={[0.5, 3.6, 0.5]} />
        <meshStandardMaterial color="#2A2035" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Arch */}
      <mesh position={[0, 3.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[2.0, 0.12, 8, archSegs, Math.PI]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Neon "GALLERY" sign */}
      <mesh ref={neonRef} position={[0, 4.5, 0.3]}>
        <boxGeometry args={[2.5, 0.35, 0.04]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.5} />
      </mesh>
      {/* Gallery floor runner */}
      <mesh position={[0, -0.98, 4]} receiveShadow>
        <boxGeometry args={[1.5, 0.02, 8]} />
        <meshStandardMaterial color="#2A1030" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Velvet ropes */}
      {(
        <>
          <mesh position={[-1.2, 0.5, 2]}>
            <cylinderGeometry args={[0.02, 0.02, 1.0, 6]} />
            <meshStandardMaterial color="#8B0000" metalness={0.3} roughness={0.7} />
          </mesh>
          <mesh position={[1.2, 0.5, 2]}>
            <cylinderGeometry args={[0.02, 0.02, 1.0, 6]} />
            <meshStandardMaterial color="#8B0000" metalness={0.3} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.7, 2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.015, 0.015, 2.4, 6]} />
            <meshStandardMaterial color="#CC0000" metalness={0.2} roughness={0.8} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ■■ Gallery Walls ■■
function GalleryWalls({ lod }: { lod: ReturnType<typeof useFLLiteLOD> }) {
  return (
    <group>
      {/* Left wall */}
      <mesh position={[-10, 2, 0]} castShadow>
        <boxGeometry args={[0.15, 5, 18]} />
        <meshStandardMaterial color="#14101E" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Right wall */}
      <mesh position={[10, 2, 0]} castShadow>
        <boxGeometry args={[0.15, 5, 18]} />
        <meshStandardMaterial color="#14101E" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 2, -9.5]} castShadow>
        <boxGeometry args={[20, 5, 0.15]} />
        <meshStandardMaterial color="#16102A" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Crown molding */}
      {(
        <>
          <mesh position={[-10, 4.3, 0]}>
            <boxGeometry args={[0.2, 0.1, 18]} />
            <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.15} metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[10, 4.3, 0]}>
            <boxGeometry args={[0.2, 0.1, 18]} />
            <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.15} metalness={0.6} roughness={0.3} />
          </mesh>
        </>
      )}
      {/* Ceiling */}
      <mesh position={[0, 4.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 18]} />
        <meshStandardMaterial color="#0A050D" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ■■ Main Environment ■■
interface AiOrNotEnvironmentProps {
  isJudging?: boolean;
  correctCount?: number;
}

export default function AiOrNotEnvironment({
  isJudging = false,
  correctCount = 0,
}: AiOrNotEnvironmentProps) {
  const lod = useFLLiteLOD();

  return (
    <FLLiteEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#0E0818"
      skyTopColor="#08041A"
      skyHorizonColor="#1A0E2A"
      fogColor="#D946EF"
    >
      <GalleryWalls lod={lod} />
      <DisplayPedestals lod={lod} />
      <PictureFrames lod={lod} />
      <VotingBooths lod={lod} isJudging={isJudging} />
      <LabelProjections lod={lod} isJudging={isJudging} />
      <SpotlightRigs lod={lod} />
      <VisitorSilhouettes lod={lod} />
      <VerdictParticles lod={lod} correctCount={correctCount} />
      <GrandEntrance lod={lod} />
      {/* Judging spotlight */}
      {isJudging && (
        <pointLight position={[0, 3, 0]} intensity={1.5} color={LAB_COLOR} distance={10} />
      )}
    </FLLiteEnvironmentWrapper>
  );
}
