'use client';

// ════════════════════════════════════════════════════
// SortToyBoxEnvironment — Lab 2 (Teaching AI) Flagship
// ════════════════════════════════════════════════════
// S6-HIGH-004: Created missing environment for Sort Toy Box.
// Lab 2 color: #AA66FF (Purple)
// Theme: Sorting laboratory with conveyor belts, bins, and
// classification machinery. Purple-tinted ambient lighting.
//
// Triangle Budget: ~4M within 10M flagship ceiling
//   Ground terrain:    ~400K (FlagshipEnvironmentWrapper)
//   Sky dome:          ~80K  (FlagshipEnvironmentWrapper)
//   Sorting table:     ~50K  (central workspace)
//   Conveyor belt:     ~100K (instanced rollers)
//   Storage bins:      ~80K  (4 collection bins)
//   Classification grid: ~200K (floor grid lines)
//   Ambient particles: ~100K (floating sort indicators)
//   Reserve:           ~5M+

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three';
import { FlagshipEnvironmentWrapper } from './FlagshipEnvironmentBase';

// ■■ Sorting Table (central workspace) ■■
function SortingTable() {
  return (
    <group position={[0, 0, 0]}>
      {/* Main table surface */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[8, 0.15, 6]} />
        <meshStandardMaterial color="#1A1530" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Table legs */}
      {[[-3.5, -1.5, -2.5], [3.5, -1.5, -2.5], [-3.5, -1.5, 2.5], [3.5, -1.5, 2.5]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 2, 8]} />
          <meshStandardMaterial color="#2D1B69" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {/* Purple edge trim */}
      <mesh position={[0, -0.42, 0]}>
        <boxGeometry args={[8.1, 0.02, 6.1]} />
        <meshStandardMaterial color="#AA66FF" emissive="#AA66FF" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// ■■ Conveyor Belt (decorative, instanced rollers) ■■
function ConveyorBelt() {
  const rollerCount = 20;
  const meshRef = useRef<InstancedMesh>(null);

  useMemo(() => {
    if (!meshRef.current) return;
    const mat = new Matrix4();
    const pos = new Vector3();
    const quat = new Quaternion();
    const scale = new Vector3(1, 1, 1);

    for (let i = 0; i < rollerCount; i++) {
      pos.set(-4.5 + i * 0.45, -0.35, -4);
      quat.setFromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2);
      mat.compose(pos, quat, scale);
      meshRef.current.setMatrixAt(i, mat);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = new Matrix4();
    const pos = new Vector3();
    const quat = new Quaternion();
    const scale = new Vector3(1, 1, 1);
    const time = clock.getElapsedTime();

    for (let i = 0; i < rollerCount; i++) {
      pos.set(-4.5 + i * 0.45, -0.35, -4);
      quat.setFromAxisAngle(new Vector3(1, 0, 0), time * 2);
      mat.compose(pos, quat, scale);
      meshRef.current.setMatrixAt(i, mat);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Belt surface */}
      <mesh position={[0, -0.42, -4]} receiveShadow>
        <boxGeometry args={[9, 0.05, 0.8]} />
        <meshStandardMaterial color="#1A0A3E" metalness={0.2} roughness={0.8} />
      </mesh>
      {/* Rollers */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, rollerCount]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.7, 8]} />
        <meshStandardMaterial color="#3D2080" metalness={0.5} roughness={0.5} />
      </instancedMesh>
    </group>
  );
}

// ■■ Collection Bins ■■
function CollectionBins() {
  const binColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'];
  return (
    <group position={[0, -0.5, 4]}>
      {binColors.map((color, i) => (
        <group key={i} position={[((i - 1.5) * 2.2), 0, 0]}>
          {/* Bin body (open top box) */}
          <mesh castShadow>
            <boxGeometry args={[1.5, 1, 1.5]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={0.3}
              metalness={0.1}
              roughness={0.7}
            />
          </mesh>
          {/* Bin rim glow */}
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[1.55, 0.05, 1.55]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ■■ Classification Grid (floor pattern) ■■
function ClassificationGrid() {
  const gridSize = 12;
  const lines = useMemo(() => {
    const result: [number, number, number][] = [];
    for (let i = -gridSize / 2; i <= gridSize / 2; i += 2) {
      result.push([i, 0, 0]);
    }
    return result;
  }, []);

  return (
    <group position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {lines.map((pos, i) => (
        <React.Fragment key={i}>
          <mesh position={[pos[0], 0, 0]}>
            <boxGeometry args={[0.02, gridSize, 0.01]} />
            <meshStandardMaterial
              color="#AA66FF"
              emissive="#AA66FF"
              emissiveIntensity={0.15}
              transparent
              opacity={0.2}
            />
          </mesh>
          <mesh position={[0, pos[0], 0]}>
            <boxGeometry args={[gridSize, 0.02, 0.01]} />
            <meshStandardMaterial
              color="#AA66FF"
              emissive="#AA66FF"
              emissiveIntensity={0.15}
              transparent
              opacity={0.2}
            />
          </mesh>
        </React.Fragment>
      ))}
    </group>
  );
}

// ■■ Floating Sort Particles ■■
function SortParticles() {
  const count = 30;
  const meshRef = useRef<InstancedMesh>(null);
  const color = useMemo(() => new Color('#AA66FF'), []);

  const offsets = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 16,
      y: Math.random() * 4 + 1,
      z: (Math.random() - 0.5) * 12,
      speed: Math.random() * 0.5 + 0.3,
      phase: Math.random() * Math.PI * 2,
    })),
    []
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = new Matrix4();
    const time = clock.getElapsedTime();

    offsets.forEach((o, i) => {
      const y = o.y + Math.sin(time * o.speed + o.phase) * 0.5;
      mat.setPosition(o.x, y, o.z);
      meshRef.current!.setMatrixAt(i, mat);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <icosahedronGeometry args={[0.04, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.0}
        transparent
        opacity={0.6}
      />
    </instancedMesh>
  );
}

// ════════════════════════════════════════════════════
// EXPORTED ENVIRONMENT
// ════════════════════════════════════════════════════

export default function SortToyBoxEnvironment() {
  return (
    <FlagshipEnvironmentWrapper
      labColor="#AA66FF"
      terrainColor="#0D0520"
      skyTopColor="#050810"
      skyHorizonColor="#1A0A3E"
      fogColor="#AA66FF"
      heightScale={0.15}
      terrainSize={40}
    >
      <SortingTable />
      <ConveyorBelt />
      <CollectionBins />
      <ClassificationGrid />
      <SortParticles />

      {/* Ambient purple lighting */}
      <ambientLight intensity={0.15} color="#AA66FF" />
      <pointLight position={[0, 5, 0]} intensity={0.8} color="#DDD6FE" distance={20} />
      <pointLight position={[-5, 3, -3]} intensity={0.3} color="#AA66FF" distance={12} />
      <pointLight position={[5, 3, 3]} intensity={0.3} color="#8B5CF6" distance={12} />
    </FlagshipEnvironmentWrapper>
  );
}
