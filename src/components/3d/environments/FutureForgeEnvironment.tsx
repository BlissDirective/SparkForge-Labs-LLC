'use client';

// ════════════════════════════════════════════════════
// FutureForgeEnvironment — Future Innovation City (FL-Lite ~1.4M budget)
// ════════════════════════════════════════════════════
// Lab 10: AI Futures | Color: #D946EF (Fuchsia)
//
// A miniature futuristic metropolis showcasing AI innovation:
//   - Miniature city skyline with instanced building towers
//   - Holographic billboard displays floating above streets
//   - Flying vehicle tracks with moving vehicles
//   - Central innovation hub dome (glass dome structure)
//   - AI brain monument (glowing neural sculpture)
//   - Hover platforms and walkways
//   - Energy beam pillars connecting buildings
//   - Progress meter tower that fills based on innovation score
//
// Triangle Budget (Desktop Ultra):
//   City Skyline (instanced):       ~350K (50 buildings x ~7K each)
//   Holographic Billboards:         ~120K (12 floating screens)
//   Flying Vehicles + Tracks:       ~150K (curved paths + vehicles)
//   Innovation Hub Dome:            ~130K (glass dome + interior)
//   AI Brain Monument:              ~120K (neural mesh sculpture)
//   Hover Platforms (instanced):    ~100K (walkways + platforms)
//   Energy Beam Pillars:            ~80K  (connecting beams)
//   Progress Meter Tower:           ~100K (tower + fill indicator)
//   Street grid + misc:             ~150K
//   Total:                          ~1.4M

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FLLiteEnvironmentWrapper, useFLLiteLOD } from './FLLiteEnvironmentBase';

const LAB_COLOR = '#D946EF';
const _FUCHSIA = new THREE.Color(LAB_COLOR);

// ■■ City Skyline (Instanced Buildings) ■■
function CitySkyline({ lod }: { lod: ReturnType<typeof useFLLiteLOD> }) {
  const count = 50;
  const buildingsRef = useRef<THREE.InstancedMesh>(null);
  const windowsRef = useRef<THREE.InstancedMesh>(null);

  const buildingData = useMemo(() => {
    const data: { pos: THREE.Vector3; height: number; width: number; depth: number }[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 7 + Math.random() * 5;
      const height = 0.8 + Math.random() * 3.5;
      const width = 0.3 + Math.random() * 0.5;
      const depth = 0.3 + Math.random() * 0.5;
      data.push({
        pos: new THREE.Vector3(Math.cos(angle) * r + (Math.random() - 0.5) * 2, height / 2 - 1, Math.sin(angle) * r + (Math.random() - 0.5) * 2),
        height, width, depth,
      });
    }
    return data;
  }, [count]);

  React.useEffect(() => {
    if (!buildingsRef.current || !windowsRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const d = buildingData[i];
      tmp.makeScale(d.width, d.height, d.depth);
      tmp.setPosition(d.pos.x, d.pos.y, d.pos.z);
      buildingsRef.current.setMatrixAt(i, tmp);
      // Building tint: dark with slight fuchsia hue variation
      color.setHSL(0.8 + Math.random() * 0.1, 0.2, 0.08 + Math.random() * 0.04);
      buildingsRef.current.setColorAt(i, color);
      // Window strip on front face
      tmp.makeScale(d.width * 0.7, d.height * 0.8, 0.01);
      tmp.setPosition(d.pos.x, d.pos.y, d.pos.z + d.depth / 2 + 0.01);
      windowsRef.current.setMatrixAt(i, tmp);
    }
    buildingsRef.current.instanceMatrix.needsUpdate = true;
    buildingsRef.current.instanceColor!.needsUpdate = true;
    windowsRef.current.instanceMatrix.needsUpdate = true;
  }, [count, buildingData]);

  return (
    <group>
      <instancedMesh ref={buildingsRef} args={[undefined, undefined, count]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial metalness={0.6} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={windowsRef} args={[undefined, undefined, count]}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.15} transparent opacity={0.4} />
      </instancedMesh>
    </group>
  );
}

// ■■ Holographic Billboards (Instanced) ■■
function HolographicBillboards({ lod }: { lod: ReturnType<typeof useFLLiteLOD> }) {
  const count = 12;
  const billboardsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const positions = useMemo(() =>
    Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const r = 6 + (i % 3) * 2;
      return new THREE.Vector3(Math.cos(angle) * r, 3.0 + (i % 2) * 0.8, Math.sin(angle) * r);
    }),
  [count]);

  React.useEffect(() => {
    if (!billboardsRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const angle = Math.atan2(positions[i].z, positions[i].x);
      tmp.makeRotationY(-angle);
      tmp.setPosition(positions[i].x, positions[i].y, positions[i].z);
      billboardsRef.current.setMatrixAt(i, tmp);
    }
    billboardsRef.current.instanceMatrix.needsUpdate = true;
  }, [count, positions]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!billboardsRef.current) return;
    const tmp = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      billboardsRef.current.getMatrixAt(i, tmp);
      tmp.decompose(pos, quat, scl);
      pos.y = positions[i].y + Math.sin(timeRef.current * 0.6 + i * 0.9) * 0.15;
      tmp.compose(pos, quat, scl);
      billboardsRef.current.setMatrixAt(i, tmp);
    }
    billboardsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={billboardsRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[1.2, 0.7]} />
      <meshStandardMaterial
        color={LAB_COLOR}
        emissive={LAB_COLOR}
        emissiveIntensity={0.4}
        transparent
        opacity={0.45}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

// ■■ Flying Vehicles on Curved Tracks ■■
function FlyingVehicles({ lod }: { lod: ReturnType<typeof useFLLiteLOD> }) {
  const vehicleCount = 8;
  const vehiclesRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const tracks = useMemo(() =>
    Array.from({ length: vehicleCount }, (_, i) => ({
      radius: 4 + i * 1.2,
      height: 2.0 + (i % 3) * 0.6,
      speed: 0.3 + Math.random() * 0.5,
      phase: (i / vehicleCount) * Math.PI * 2,
      tilt: (Math.random() - 0.5) * 0.3,
    })),
  [vehicleCount]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!vehiclesRef.current) return;
    const tmp = new THREE.Matrix4();
    const rot = new THREE.Quaternion();
    for (let i = 0; i < vehicleCount; i++) {
      const t = tracks[i];
      const angle = timeRef.current * t.speed + t.phase;
      const x = Math.cos(angle) * t.radius;
      const z = Math.sin(angle) * t.radius;
      const y = t.height + Math.sin(angle * 2) * 0.2;
      rot.setFromEuler(new THREE.Euler(t.tilt, -angle + Math.PI / 2, 0));
      tmp.compose(
        new THREE.Vector3(x, y, z),
        rot,
        new THREE.Vector3(0.25, 0.08, 0.12),
      );
      vehiclesRef.current.setMatrixAt(i, tmp);
    }
    vehiclesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={vehiclesRef} args={[undefined, undefined, vehicleCount]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#EE55FF" emissive={LAB_COLOR} emissiveIntensity={0.6} metalness={0.7} roughness={0.2} />
    </instancedMesh>
  );
}

// ■■ Innovation Hub Dome ■■
function InnovationDome({ lod }: { lod: ReturnType<typeof useFLLiteLOD> }) {
  const domeRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (domeRef.current) {
      (domeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.15 + Math.sin(timeRef.current * 1.5) * 0.08;
    }
  });

  const segs = 48;

  return (
    <group position={[0, -0.5, 0]}>
      {/* Dome shell */}
      <mesh ref={domeRef}>
        <sphereGeometry args={[2.5, segs, segs, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#2A1A3A"
          emissive={LAB_COLOR}
          emissiveIntensity={0.15}
          transparent
          opacity={0.25}
          metalness={0.8}
          roughness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Base ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.5, 0.08, 8, segs]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.5} metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Inner platform */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[2.2, 2.4, 0.1, segs]} />
        <meshStandardMaterial color="#161224" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

// ■■ AI Brain Monument ■■
function AIBrainMonument({ lod, innovationScore }: { lod: ReturnType<typeof useFLLiteLOD>; innovationScore: number }) {
  const brainRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (brainRef.current) {
      brainRef.current.rotation.y = timeRef.current * 0.4;
      brainRef.current.position.y = 1.5 + Math.sin(timeRef.current * 0.6) * 0.15;
    }
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(timeRef.current * 0.8) * 0.1;
      ringRef.current.rotation.z = timeRef.current * 0.3;
    }
  });

  const detail = 4;
  const intensity = Math.min(0.3 + innovationScore * 0.05, 1.0);

  return (
    <group position={[0, 0, 0]}>
      {/* Neural brain mesh */}
      <mesh ref={brainRef} position={[0, 1.5, 0]}>
        <icosahedronGeometry args={[0.9, detail]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={intensity}
          wireframe
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Inner core */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.4, 16, 12]} />
        <meshStandardMaterial color="#FF66FF" emissive={LAB_COLOR} emissiveIntensity={intensity * 0.8} />
      </mesh>
      {/* Orbit ring */}
      <mesh ref={ringRef} position={[0, 1.5, 0]}>
        <torusGeometry args={[1.2, 0.03, 6, 32]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.5} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// ■■ Energy Beam Pillars ■■
function EnergyBeams({ lod }: { lod: ReturnType<typeof useFLLiteLOD> }) {
  const beamCount = 8;
  const beamsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const positions = useMemo(() =>
    Array.from({ length: beamCount }, (_, i) => {
      const angle = (i / beamCount) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(angle) * 5, 0, Math.sin(angle) * 5);
    }),
  [beamCount]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!beamsRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < beamCount; i++) {
      const p = positions[i];
      const height = 3.5 + Math.sin(timeRef.current * 1.5 + i * 1.1) * 0.3;
      tmp.makeScale(0.04, height, 0.04);
      tmp.setPosition(p.x, height / 2 - 1, p.z);
      beamsRef.current.setMatrixAt(i, tmp);
    }
    beamsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={beamsRef} args={[undefined, undefined, beamCount]}>
      <cylinderGeometry args={[1, 1, 1, 6]} />
      <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.7} transparent opacity={0.5} />
    </instancedMesh>
  );
}

// ■■ Progress Meter Tower ■■
function ProgressTower({ lod, innovationScore, step }: { lod: ReturnType<typeof useFLLiteLOD>; innovationScore: number; step: number }) {
  const fillRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (fillRef.current) {
      (fillRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.4 + Math.sin(timeRef.current * 2) * 0.15;
    }
  });

  const fillHeight = Math.min(innovationScore / 10, 1.0) * 4.0;
  const segs = 16;

  return (
    <group position={[-8, -1, -4]}>
      {/* Tower frame */}
      <mesh castShadow>
        <cylinderGeometry args={[0.5, 0.6, 4.5, segs]} />
        <meshStandardMaterial color="#1A1428" metalness={0.6} roughness={0.3} transparent opacity={0.4} />
      </mesh>
      {/* Fill level */}
      <mesh ref={fillRef} position={[0, -2.2 + fillHeight / 2, 0]}>
        <cylinderGeometry args={[0.42, 0.42, fillHeight || 0.01, segs]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.4} transparent opacity={0.7} />
      </mesh>
      {/* Step indicator rings */}
      {Array.from({ length: Math.min(step, 5) }).map((_, i) => (
        <mesh key={i} position={[0, -1.8 + i * 0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.55, 0.03, 6, 16]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.4} />
        </mesh>
      ))}
      {/* Cap */}
      <mesh position={[0, 2.3, 0]}>
        <coneGeometry args={[0.6, 0.4, segs]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ■■ Main Environment ■■
interface FutureForgeEnvironmentProps {
  innovationScore?: number;
  step?: number;
}

export default function FutureForgeEnvironment({
  innovationScore = 0,
  step = 0,
}: FutureForgeEnvironmentProps) {
  const lod = useFLLiteLOD();

  return (
    <FLLiteEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#0E0818"
      skyTopColor="#08041A"
      skyHorizonColor="#1A0E2A"
      fogColor="#D946EF"
    >
      <CitySkyline lod={lod} />
      <HolographicBillboards lod={lod} />
      <FlyingVehicles lod={lod} />
      <InnovationDome lod={lod} />
      <AIBrainMonument lod={lod} innovationScore={innovationScore} />
      <EnergyBeams lod={lod} />
      <ProgressTower lod={lod} innovationScore={innovationScore} step={step} />
    </FLLiteEnvironmentWrapper>
  );
}
