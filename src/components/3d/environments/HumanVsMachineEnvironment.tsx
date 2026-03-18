'use client';

// ════════════════════════════════════════════════════
// HumanVsMachineEnvironment — Split Arena (Standard ~500K budget)
// ════════════════════════════════════════════════════
// Lab 1: AI Basics | Color: #00BBFF (Blue)
//
// A dramatically split arena — half human workshop, half machine factory:
//   - Central judge's podium with verdict scales
//   - Human side: easels, paintbrushes, musical instruments (warm wooden tones)
//   - Machine side: robotic arms, circuit boards, screens (chrome cold tones)
//   - Dividing energy barrier between the two sides
//   - Floating comparison cards drifting above both sides
//   - Verdict spotlight that swings to the winning side
//   - Score displays for both sides
//   - Arena seating/bleachers along the back
//
// Triangle Budget (Desktop Ultra):
//   Judge's Podium + Scales:            ~50K  (podium + balance arms)
//   Human Side Props (instanced):       ~80K  (easels, brushes, instruments)
//   Machine Side Props (instanced):     ~80K  (arms, circuits, screens)
//   Energy Barrier Divider:             ~40K  (plane + particles)
//   Floating Comparison Cards:          ~45K  (instanced cards)
//   Score Displays:                     ~35K  (2 display panels)
//   Arena Seating (instanced):          ~70K  (bleacher rows)
//   Arena Walls + Floor:                ~60K  (enclosure + split floor)
//   Ambient Particles:                  ~40K
//   Total:                              ~500K

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StandardEnvironmentWrapper, useStandardLOD } from './StandardEnvironmentBase';

const LAB_COLOR = '#00BBFF';
const HUMAN_COLOR = '#FF8844';
const MACHINE_COLOR = '#44AAFF';

// ■■ Judge's Podium with Verdict Scales ■■
function JudgePodium({ lod, isRevealing }: { lod: ReturnType<typeof useStandardLOD>; isRevealing: boolean }) {
  const scaleRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const segments = lod.level === 'ultra' ? 16 : 10;

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (scaleRef.current) {
      scaleRef.current.rotation.y = Math.sin(timeRef.current * 0.4) * (isRevealing ? 0.3 : 0.05);
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isRevealing ? 0.8 + Math.sin(timeRef.current * 4) * 0.3 : 0.2;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Podium base */}
      <mesh position={[0, -0.4, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.8, 0.8, segments]} />
        <meshStandardMaterial color="#1A1A2A" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Podium column */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.4, segments]} />
        <meshStandardMaterial color="#C0C0D0" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Scale beam */}
      <group ref={scaleRef} position={[0, 1.2, 0]}>
        <mesh>
          <boxGeometry args={[2.0, 0.04, 0.04]} />
          <meshStandardMaterial color="#C0C0D0" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Human side plate */}
        <mesh position={[-0.9, -0.3, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.03, segments]} />
          <meshStandardMaterial color={HUMAN_COLOR} emissive={HUMAN_COLOR} emissiveIntensity={0.2} />
        </mesh>
        {/* Machine side plate */}
        <mesh position={[0.9, -0.3, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.03, segments]} />
          <meshStandardMaterial color={MACHINE_COLOR} emissive={MACHINE_COLOR} emissiveIntensity={0.2} />
        </mesh>
        {/* Chains (simplified) */}
        {lod.enableDetailProps && (
          <>
            <mesh position={[-0.9, -0.15, 0]}>
              <cylinderGeometry args={[0.01, 0.01, 0.3, 4]} />
              <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0.9, -0.15, 0]}>
              <cylinderGeometry args={[0.01, 0.01, 0.3, 4]} />
              <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
            </mesh>
          </>
        )}
      </group>
      {/* Glow ring at base */}
      <mesh ref={glowRef} position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.03, 6, 24]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

// ■■ Human Side Props (Instanced — Warm/Wooden) ■■
function HumanSideProps({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const count = lod.level === 'ultra' ? 14 : lod.level === 'high' ? 9 : 5;
  const propsRef = useRef<THREE.InstancedMesh>(null);
  const accentsRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!propsRef.current || !accentsRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = -3.5 - col * 0.8;
      const z = -2 + row * 1.5;
      const type = i % 4;
      if (type === 0) {
        // Easel
        tmp.makeScale(0.02, 0.8, 0.02);
        tmp.setPosition(x, 0.1, z);
      } else if (type === 1) {
        // Canvas on easel
        tmp.makeScale(0.4, 0.5, 0.02);
        tmp.setPosition(x, 0.5, z);
      } else if (type === 2) {
        // Musical note stand
        tmp.makeScale(0.15, 0.6, 0.15);
        tmp.setPosition(x, 0.0, z);
      } else {
        // Paintbrush holder
        tmp.makeScale(0.08, 0.3, 0.08);
        tmp.setPosition(x, -0.1, z);
      }
      propsRef.current.setMatrixAt(i, tmp);
      // Accent details
      tmp.makeScale(0.05, 0.05, 0.05);
      tmp.setPosition(x, 0.7 + (i % 3) * 0.2, z);
      accentsRef.current.setMatrixAt(i, tmp);
    }
    propsRef.current.instanceMatrix.needsUpdate = true;
    accentsRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  return (
    <group>
      {/* Warm-toned floor section */}
      <mesh position={[-3.5, -0.95, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 8]} />
        <meshStandardMaterial color="#1E140E" roughness={0.8} metalness={0.1} />
      </mesh>
      <instancedMesh ref={propsRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#8B6F47" roughness={0.7} metalness={0.15} />
      </instancedMesh>
      <instancedMesh ref={accentsRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial color={HUMAN_COLOR} emissive={HUMAN_COLOR} emissiveIntensity={0.3} />
      </instancedMesh>
      {/* Warm side light */}
      <pointLight position={[-3.5, 2, 0]} intensity={0.4} color={HUMAN_COLOR} distance={6} />
    </group>
  );
}

// ■■ Machine Side Props (Instanced — Chrome/Cold) ■■
function MachineSideProps({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const count = lod.level === 'ultra' ? 14 : lod.level === 'high' ? 9 : 5;
  const propsRef = useRef<THREE.InstancedMesh>(null);
  const screensRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!propsRef.current || !screensRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = 3.5 + col * 0.8;
      const z = -2 + row * 1.5;
      const type = i % 4;
      if (type === 0) {
        // Robotic arm base
        tmp.makeScale(0.15, 0.6, 0.15);
        tmp.setPosition(x, 0.0, z);
      } else if (type === 1) {
        // Circuit board
        tmp.makeScale(0.35, 0.4, 0.02);
        tmp.setPosition(x, 0.5, z);
      } else if (type === 2) {
        // Server rack
        tmp.makeScale(0.2, 0.7, 0.15);
        tmp.setPosition(x, 0.05, z);
      } else {
        // Processing unit
        tmp.makeScale(0.12, 0.12, 0.12);
        tmp.setPosition(x, 0.2, z);
      }
      propsRef.current.setMatrixAt(i, tmp);
      // Screens
      tmp.makeScale(0.3, 0.2, 0.01);
      tmp.setPosition(x, 0.6 + (i % 3) * 0.15, z + 0.1);
      screensRef.current.setMatrixAt(i, tmp);
    }
    propsRef.current.instanceMatrix.needsUpdate = true;
    screensRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!screensRef.current) return;
    const mat = screensRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.3 + Math.sin(timeRef.current * 3) * 0.15;
  });

  return (
    <group>
      {/* Cold-toned floor section */}
      <mesh position={[3.5, -0.95, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 8]} />
        <meshStandardMaterial color="#0A0E1A" roughness={0.6} metalness={0.3} />
      </mesh>
      <instancedMesh ref={propsRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#3A4050" metalness={0.8} roughness={0.15} />
      </instancedMesh>
      <instancedMesh ref={screensRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={MACHINE_COLOR}
          emissive={MACHINE_COLOR}
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
        />
      </instancedMesh>
      {/* Cold side light */}
      <pointLight position={[3.5, 2, 0]} intensity={0.4} color={MACHINE_COLOR} distance={6} />
    </group>
  );
}

// ■■ Energy Barrier Divider ■■
function EnergyBarrier({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const barrierRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (barrierRef.current) {
      const mat = barrierRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + Math.sin(timeRef.current * 2) * 0.15;
      mat.opacity = 0.12 + Math.sin(timeRef.current * 1.5) * 0.04;
    }
  });

  return (
    <group position={[0, 1.5, 0]}>
      {/* Main barrier plane */}
      <mesh ref={barrierRef} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[8, 4, 1, 1]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.3}
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Barrier edge glow lines */}
      {lod.enableDetailProps && (
        <>
          <mesh position={[0, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[8, 0.02]} />
            <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.7} transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[8, 0.02]} />
            <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.7} transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ■■ Floating Comparison Cards (Instanced) ■■
function ComparisonCards({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const count = lod.level === 'ultra' ? 12 : lod.level === 'high' ? 8 : 4;
  const cardsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const seeds = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: (Math.random() - 0.5) * 8,
      y: 3 + Math.random() * 1.5,
      z: (Math.random() - 0.5) * 5,
      speed: 0.1 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
      isHuman: i < count / 2,
    })),
  [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!cardsRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const y = s.y + Math.sin(timeRef.current * s.speed + s.phase) * 0.3;
      const rot = new THREE.Quaternion();
      rot.setFromEuler(new THREE.Euler(0, timeRef.current * 0.2 + s.phase, 0));
      tmp.compose(
        new THREE.Vector3(s.x, y, s.z),
        rot,
        new THREE.Vector3(0.3, 0.4, 0.01)
      );
      cardsRef.current.setMatrixAt(i, tmp);
      color.set(s.isHuman ? HUMAN_COLOR : MACHINE_COLOR);
      cardsRef.current.setColorAt(i, color);
    }
    cardsRef.current.instanceMatrix.needsUpdate = true;
    if (cardsRef.current.instanceColor) cardsRef.current.instanceColor.needsUpdate = true;
  });

  if (!lod.enableParticles) return null;

  return (
    <instancedMesh ref={cardsRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.2} transparent opacity={0.5} />
    </instancedMesh>
  );
}

// ■■ Score Displays ■■
function ScoreDisplays({ lod: _lod, humanScore, machineScore }: { lod: ReturnType<typeof useStandardLOD>; humanScore: number; machineScore: number }) {
  const humanRef = useRef<THREE.Mesh>(null);
  const machineRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (humanRef.current) {
      const mat = humanRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + (humanScore > machineScore ? Math.sin(timeRef.current * 3) * 0.2 : 0);
    }
    if (machineRef.current) {
      const mat = machineRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + (machineScore > humanScore ? Math.sin(timeRef.current * 3) * 0.2 : 0);
    }
  });

  return (
    <group>
      {/* Human score panel */}
      <mesh ref={humanRef} position={[-3.5, 3.5, -3.5]}>
        <boxGeometry args={[1.5, 0.6, 0.05]} />
        <meshStandardMaterial color={HUMAN_COLOR} emissive={HUMAN_COLOR} emissiveIntensity={0.3} metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Machine score panel */}
      <mesh ref={machineRef} position={[3.5, 3.5, -3.5]}>
        <boxGeometry args={[1.5, 0.6, 0.05]} />
        <meshStandardMaterial color={MACHINE_COLOR} emissive={MACHINE_COLOR} emissiveIntensity={0.3} metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Score backing plates */}
      <mesh position={[-3.5, 3.5, -3.55]}>
        <boxGeometry args={[1.7, 0.8, 0.04]} />
        <meshStandardMaterial color="#1A1220" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[3.5, 3.5, -3.55]}>
        <boxGeometry args={[1.7, 0.8, 0.04]} />
        <meshStandardMaterial color="#0A1220" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ■■ Arena Seating (Instanced Bleachers) ■■
function ArenaSeating({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const count = lod.level === 'ultra' ? 20 : lod.level === 'high' ? 12 : 6;
  const seatsRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!seatsRef.current) return;
    const tmp = new THREE.Matrix4();
    const rows = 3;
    const seatsPerRow = Math.ceil(count / rows);
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / seatsPerRow);
      const col = i % seatsPerRow;
      const x = (col - seatsPerRow / 2) * 0.9;
      const y = -0.4 + row * 0.5;
      const z = -4.5 - row * 0.6;
      tmp.makeScale(0.4, 0.35, 0.3);
      tmp.setPosition(x, y, z);
      seatsRef.current.setMatrixAt(i, tmp);
    }
    seatsRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  if (!lod.enableDetailProps) return null;

  return (
    <instancedMesh ref={seatsRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#1A1828" metalness={0.4} roughness={0.5} />
    </instancedMesh>
  );
}

// ■■ Main Environment ■■
interface HumanVsMachineEnvironmentProps {
  humanScore?: number;
  machineScore?: number;
  isRevealing?: boolean;
}

export default function HumanVsMachineEnvironment({
  humanScore = 0,
  machineScore = 0,
  isRevealing = false,
}: HumanVsMachineEnvironmentProps) {
  const lod = useStandardLOD();

  return (
    <StandardEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#080A14"
      skyTopColor="#030610"
      skyHorizonColor="#0A1628"
      fogColor="#00BBFF"
    >
      <JudgePodium lod={lod} isRevealing={isRevealing} />
      <HumanSideProps lod={lod} />
      <MachineSideProps lod={lod} />
      <EnergyBarrier lod={lod} />
      <ComparisonCards lod={lod} />
      <ScoreDisplays lod={lod} humanScore={humanScore} machineScore={machineScore} />
      <ArenaSeating lod={lod} />
      {/* Reveal spotlight */}
      {isRevealing && (
        <pointLight position={[0, 4, 0]} intensity={2.0} color="#FFFFFF" distance={10} />
      )}
    </StandardEnvironmentWrapper>
  );
}
