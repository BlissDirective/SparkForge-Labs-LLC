'use client';

// ════════════════════════════════════════════════════
// CareerExplorerEnvironment — AI Career Expo Hall (Standard ~500K budget)
// ════════════════════════════════════════════════════
// Lab 9: AI Careers & Future | Color: #F97316 (Orange)
//
// A futuristic career expo hall showcasing AI industry paths:
//   - Exhibition booths for AI careers (instanced kiosks)
//   - Holographic job preview screens (instanced floating displays)
//   - Skill tree display (branching node graph)
//   - Career path flowchart on illuminated floor
//   - Interview simulation pod (enclosed booth)
//   - Portfolio showcase wall (instanced frames)
//   - Salary comparison dashboard (bar chart)
//   - Industry sector map (segmented ring)
//
// Triangle Budget (Desktop Ultra):
//   Exhibition Booths (instanced):    ~80K  (10 kiosks x ~8K)
//   Holographic Job Screens (inst):   ~55K  (8 screens x ~6.8K)
//   Skill Tree Display:               ~55K  (nodes + branches)
//   Career Path Floor:                ~45K  (illuminated lines + nodes)
//   Interview Simulation Pod:         ~50K  (pod structure + screen)
//   Portfolio Wall (instanced):       ~55K  (12 frames x ~4.5K)
//   Salary Dashboard:                 ~50K  (bars + frame)
//   Industry Sector Map:              ~50K  (ring segments + labels)
//   Room Structure:                   ~60K
//   Total:                            ~500K

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StandardEnvironmentWrapper, useStandardLOD } from './StandardEnvironmentBase';

const LAB_COLOR = '#F97316';

// ■■ Exhibition Booths (Instanced) ■■
function ExhibitionBooths({ lod, careersExplored }: { lod: ReturnType<typeof useStandardLOD>; careersExplored: number }) {
  const count = 10;
  const wallsRef = useRef<THREE.InstancedMesh>(null);
  const countersRef = useRef<THREE.InstancedMesh>(null);
  const signsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!wallsRef.current || !countersRef.current || !signsRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 5.0;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const rot = new THREE.Quaternion();
      rot.setFromEuler(new THREE.Euler(0, -angle + Math.PI, 0));
      // Back wall
      tmp.compose(
        new THREE.Vector3(x, 1.0, z),
        rot,
        new THREE.Vector3(1.5, 2.0, 0.08),
      );
      wallsRef.current.setMatrixAt(i, tmp);
      // Counter
      tmp.compose(
        new THREE.Vector3(
          x + Math.cos(angle + Math.PI) * 0.4,
          0.1,
          z + Math.sin(angle + Math.PI) * 0.4,
        ),
        rot,
        new THREE.Vector3(1.2, 0.06, 0.5),
      );
      countersRef.current.setMatrixAt(i, tmp);
      // Sign
      tmp.compose(
        new THREE.Vector3(x, 2.2, z),
        rot,
        new THREE.Vector3(0.9, 0.25, 0.04),
      );
      signsRef.current.setMatrixAt(i, tmp);
    }
    wallsRef.current.instanceMatrix.needsUpdate = true;
    countersRef.current.instanceMatrix.needsUpdate = true;
    signsRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!signsRef.current) return;
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const explored = i < Math.min(careersExplored, count);
      color.set(explored ? '#00FF88' : LAB_COLOR);
      signsRef.current.setColorAt(i, color);
    }
    if (signsRef.current.instanceColor) signsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={wallsRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#181420" metalness={0.4} roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={countersRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1E1828" metalness={0.5} roughness={0.4} />
      </instancedMesh>
      <instancedMesh ref={signsRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.35}
        />
      </instancedMesh>
    </group>
  );
}

// ■■ Holographic Job Preview Screens (Instanced) ■■
function JobPreviewScreens({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const count = 8;
  const screensRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!screensRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.PI / count;
      const radius = 3.0;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const rot = new THREE.Quaternion();
      rot.setFromEuler(new THREE.Euler(0, -angle + Math.PI, 0));
      tmp.compose(
        new THREE.Vector3(x, 2.5, z),
        rot,
        new THREE.Vector3(0.8, 0.5, 0.02),
      );
      screensRef.current.setMatrixAt(i, tmp);
    }
    screensRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!screensRef.current) return;
    const tmp = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const rot = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      screensRef.current.getMatrixAt(i, tmp);
      tmp.decompose(pos, rot, scl);
      pos.y = 2.5 + Math.sin(timeRef.current * 0.8 + i * 1.2) * 0.1;
      tmp.compose(pos, rot, scl);
      screensRef.current.setMatrixAt(i, tmp);
    }
    screensRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={screensRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={LAB_COLOR}
        emissive={LAB_COLOR}
        emissiveIntensity={0.3}
        transparent
        opacity={0.5}
      />
    </instancedMesh>
  );
}

// ■■ Skill Tree Display ■■
function SkillTree({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const nodeCount = 15;
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const nodes = useMemo(() =>
    Array.from({ length: nodeCount }, (_, i) => {
      const tier = Math.floor(i / 3);
      const pos = i % 3;
      return {
        x: (pos - 1) * 0.8 + (Math.random() - 0.5) * 0.2,
        y: tier * 0.7,
        z: 0,
      };
    }),
  [nodeCount]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!nodesRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < nodeCount; i++) {
      const n = nodes[i];
      const pulse = 0.12 + Math.sin(timeRef.current * 2 + i * 0.7) * 0.02;
      tmp.makeScale(pulse, pulse, pulse);
      tmp.setPosition(n.x, n.y + 0.5, n.z);
      nodesRef.current.setMatrixAt(i, tmp);
      const hue = 0.08 + (i / nodeCount) * 0.12;
      color.setHSL(hue, 0.7, 0.55);
      nodesRef.current.setColorAt(i, color);
    }
    nodesRef.current.instanceMatrix.needsUpdate = true;
    if (nodesRef.current.instanceColor) nodesRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group position={[-5.0, 0.5, 0]} rotation={[0, Math.PI / 4, 0]}>
      {/* Backing board */}
      <mesh position={[0, 1.8, -0.15]}>
        <boxGeometry args={[3, 4, 0.08]} />
        <meshStandardMaterial color="#10081C" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Nodes */}
      <instancedMesh ref={nodesRef} args={[undefined, undefined, nodeCount]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial emissive={LAB_COLOR} emissiveIntensity={0.4} />
      </instancedMesh>
      {/* Branch lines (simplified as thin boxes) */}
      {nodes.slice(0, -3).map((n, i) => {
        const next = nodes[i + 3];
        if (!next) return null;
        const dx = next.x - n.x;
        const dy = next.y - n.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        return (
          <mesh
            key={`branch-${i}`}
            position={[(n.x + next.x) / 2, (n.y + next.y) / 2 + 0.5, 0.01]}
            rotation={[0, 0, angle]}
          >
            <boxGeometry args={[len, 0.015, 0.01]} />
            <meshStandardMaterial
              color={LAB_COLOR}
              emissive={LAB_COLOR}
              emissiveIntensity={0.2}
              transparent
              opacity={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ■■ Career Path Floor ■■
function CareerPathFloor({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const nodeCount = 8;
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!nodesRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < nodeCount; i++) {
      const pulse = 0.2 + Math.sin(timeRef.current * 1.5 + i * 0.9) * 0.04;
      const angle = (i / nodeCount) * Math.PI * 1.5 - Math.PI / 2;
      const radius = 2.5 + i * 0.3;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      tmp.makeScale(pulse, 0.02, pulse);
      tmp.setPosition(x, -0.88, z);
      nodesRef.current.setMatrixAt(i, tmp);
    }
    nodesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={nodesRef} args={[undefined, undefined, nodeCount]}>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
        />
      </instancedMesh>
      {/* Connecting path line */}
      <mesh position={[0, -0.87, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.5, 0.02, 4, 48, Math.PI * 1.5]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.2}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
}

// ■■ Interview Simulation Pod ■■
function InterviewPod({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const screenRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const segments = 24;

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (screenRef.current) {
      (screenRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.25 + Math.sin(timeRef.current * 2.0) * 0.1;
    }
  });

  return (
    <group position={[5.5, 0, -3.5]}>
      {/* Pod shell (half cylinder) */}
      <mesh rotation={[0, -Math.PI / 4, 0]}>
        <cylinderGeometry args={[1.0, 1.0, 2.5, segments, 1, true, 0, Math.PI]} />
        <meshStandardMaterial
          color="#14102A"
          metalness={0.5}
          roughness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Interior screen */}
      <mesh ref={screenRef} position={[-0.2, 0.6, -0.3]} rotation={[0, Math.PI * 0.75, 0]}>
        <boxGeometry args={[1.0, 0.7, 0.03]} />
        <meshStandardMaterial
          color="#0A1020"
          emissive={LAB_COLOR}
          emissiveIntensity={0.25}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Chair */}
      <mesh position={[0.3, -0.15, 0.2]} castShadow>
        <boxGeometry args={[0.4, 0.5, 0.4]} />
        <meshStandardMaterial color="#1A1428" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Pod rim light */}
      {(
        <mesh rotation={[0, -Math.PI / 4, 0]} position={[0, 1.3, 0]}>
          <torusGeometry args={[1.02, 0.02, 4, segments, Math.PI]} />
          <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// ■■ Portfolio Showcase Wall (Instanced) ■■
function PortfolioWall({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const count = 12;
  const framesRef = useRef<THREE.InstancedMesh>(null);
  const contentRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!framesRef.current || !contentRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = (col - 1.5) * 1.3;
      const y = 1.8 + row * 1.1;
      // Frame
      tmp.makeScale(1.0, 0.8, 0.06);
      tmp.setPosition(x, y, -7.0);
      framesRef.current.setMatrixAt(i, tmp);
      // Content
      tmp.makeScale(0.85, 0.65, 0.02);
      tmp.setPosition(x, y, -6.96);
      contentRef.current.setMatrixAt(i, tmp);
      color.setHSL(0.08 + (i / count) * 0.15, 0.4, 0.15);
      contentRef.current.setColorAt(i, color);
    }
    framesRef.current.instanceMatrix.needsUpdate = true;
    contentRef.current.instanceMatrix.needsUpdate = true;
    if (contentRef.current.instanceColor) contentRef.current.instanceColor.needsUpdate = true;
  }, [count]);

  return (
    <group>
      {/* Wall */}
      <mesh position={[0, 2.0, -7.15]}>
        <boxGeometry args={[8, 4, 0.12]} />
        <meshStandardMaterial color="#0E0A18" metalness={0.3} roughness={0.7} />
      </mesh>
      <instancedMesh ref={framesRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#2A1E10" metalness={0.6} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={contentRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial emissive={LAB_COLOR} emissiveIntensity={0.1} roughness={0.8} />
      </instancedMesh>
    </group>
  );
}

// ■■ Industry Sector Map (Segmented Ring) ■■
function IndustrySectorMap({ lod, currentCareer }: { lod: ReturnType<typeof useStandardLOD>; currentCareer: string }) {
  const sectorCount = 8;
  const sectorsRef = useRef<THREE.Mesh[]>([]);
  const timeRef = useRef(0);
  const segments = 24;

  const sectorColors = useMemo(() => [
    '#F97316', '#06B6D4', '#00FF88', '#AA66FF', '#FF66AA', '#FFAA44', '#FF6644', '#818CF8',
  ], []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    sectorsRef.current.forEach((mesh, i) => {
      if (mesh) {
        const isActive = i === Math.abs(currentCareer.length) % sectorCount;
        (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = isActive
          ? 0.5 + Math.sin(timeRef.current * 3) * 0.2
          : 0.1;
      }
    });
  });

  return (
    <group position={[0, 3.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
      {Array.from({ length: sectorCount }).map((_, i) => {
        const arcStart = (i / sectorCount) * Math.PI * 2;
        const arcLength = (Math.PI * 2 / sectorCount) - 0.05;
        return (
          <mesh
            key={`sector-${i}`}
            ref={(el) => { if (el) sectorsRef.current[i] = el; }}
          >
            <torusGeometry args={[2.5, 0.15, 6, segments, arcLength]} />
            <meshStandardMaterial
              color={sectorColors[i % sectorColors.length]}
              emissive={sectorColors[i % sectorColors.length]}
              emissiveIntensity={0.1}
              transparent
              opacity={0.6}
              rotation-z={arcStart}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ■■ Main Environment ■■
interface CareerExplorerEnvironmentProps {
  careersExplored?: number;
  currentCareer?: string;
}

export default function CareerExplorerEnvironment({
  careersExplored = 0,
  currentCareer = 'AI Engineer',
}: CareerExplorerEnvironmentProps) {
  const lod = useStandardLOD();

  return (
    <StandardEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#0E0A08"
      skyTopColor="#080504"
      skyHorizonColor="#1A100A"
      fogColor="#F97316"
    >
      <ExhibitionBooths lod={lod} careersExplored={careersExplored} />
      <JobPreviewScreens lod={lod} />
      <SkillTree lod={lod} />
      <CareerPathFloor lod={lod} />
      <InterviewPod lod={lod} />
      <PortfolioWall lod={lod} />
      <IndustrySectorMap lod={lod} currentCareer={currentCareer} />
      {/* Expo hall ambient glow */}
      <pointLight position={[0, 4, 0]} intensity={0.5} color={LAB_COLOR} distance={12} />
    </StandardEnvironmentWrapper>
  );
}
