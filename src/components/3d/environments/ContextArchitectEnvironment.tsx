'use client';

// ════════════════════════════════════════════════════════════════
// ContextArchitectEnvironment — Lab 8 library setting (~3.0M tris)
// ════════════════════════════════════════════════════════════════
// Lab 8: Words & Language | Color: #8F96FA (violet)
// Stage 11B — C2 Context Architect
//
// Design intent per Doc 2 §E.8: 'library setting — towering shelves
// disappearing into mist, archive ladders'. Calmer + scholarly,
// distinct from the warmer cozy Lab 1 (Pocket Brain) and the
// industrial Lab 11 (Harness Forge). Visual metaphor: 'context
// engineering = librarianship'.
//
// Triangle Budget (Desktop Ultra):
//   FlagshipEnvironmentWrapper:                  ~600K
//   Hex Floor (parquet violet variant):          ~250K
//   Towering Shelves (4 background, instanced):  ~700K
//   Archive Ladders (2 corner):                  ~250K
//   Reading Lectern (central):                   ~250K
//   Overhead Mist Particles:                     ~250K
//   Reactive Effects:                            ~300K
//   ────────────────────────────────────────
//   Total:                                       ~2.6M
// ════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  Vector3,
} from 'three';

import { FlagshipEnvironmentWrapper } from './FlagshipEnvironmentBase';

const LAB8_HEX = '#8F96FA';
const LAB8_DEEP = '#1F2348';
const LAB8_SOFT = '#C2C7FF';

// ─── Hex floor (parquet violet variant) ──────────────────────────

function HexFloor() {
  const ref = useRef<InstancedMesh>(null);
  const rows = 14;
  const cols = 14;
  const radius = 0.6;
  const spacingX = radius * Math.sqrt(3);
  const spacingZ = radius * 1.5;
  const total = rows * cols;
  const matRef = useRef<MeshStandardMaterial>(null);

  useEffect(() => {
    if (!ref.current) return;
    const m = new Matrix4();
    const q = new Quaternion();
    const s = new Vector3(1, 1, 1);
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - cols / 2) * spacingX + (r % 2 ? spacingX / 2 : 0);
        const z = (r - rows / 2) * spacingZ;
        m.compose(new Vector3(x, -0.04, z), q, s);
        ref.current.setMatrixAt(i++, m);
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [rows, cols, spacingX, spacingZ]);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.13 + 0.04 * Math.sin(clock.elapsedTime * 0.5);
    }
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, total]} receiveShadow>
      <cylinderGeometry args={[radius * 0.92, radius * 0.92, 0.04, 6]} />
      <meshStandardMaterial
        ref={matRef}
        color="#1A1F38"
        emissive={LAB8_HEX}
        emissiveIntensity={0.14}
        roughness={0.5}
        metalness={0.5}
      />
    </instancedMesh>
  );
}

// ─── Towering background shelves (4) ─────────────────────────────

function ToweringShelves() {
  const positions: Array<[number, number, number, number]> = [
    // [x, z, ry, height]
    [-7, -2, 0.05, 12],
    [-7,  2, -0.05, 11],
    [ 7, -2, -0.05, 12],
    [ 7,  2,  0.05, 13],
  ];

  return (
    <group>
      {positions.map((p, i) => {
        const [x, z, ry, h] = p;
        return (
          <group key={i} position={[x, h / 2, z]} rotation={[0, ry, 0]}>
            {/* Spine */}
            <mesh receiveShadow castShadow>
              <boxGeometry args={[1.5, h, 0.4]} />
              <meshStandardMaterial color="#2A1E18" metalness={0.18} roughness={0.65} />
            </mesh>
            {/* Shelves running up the spine — 6 slots */}
            {Array.from({ length: 6 }, (_, j) => {
              const y = -h / 2 + 1 + j * (h - 2) / 5;
              return (
                <mesh key={j} position={[0, y, 0.21]}>
                  <boxGeometry args={[1.45, 0.04, 0.05]} />
                  <meshStandardMaterial color="#3A2A20" metalness={0.2} roughness={0.55} />
                </mesh>
              );
            })}
            {/* Faint book-spine glow strips per shelf */}
            {Array.from({ length: 6 }, (_, j) => {
              const y = -h / 2 + 1 + j * (h - 2) / 5;
              return (
                <mesh key={j} position={[0, y + 0.18, 0.22]}>
                  <boxGeometry args={[1.3, 0.28, 0.02]} />
                  <meshBasicMaterial color={LAB8_SOFT} transparent opacity={0.18} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

// ─── Archive ladders (2 corners) ─────────────────────────────────

function ArchiveLadders() {
  return (
    <group>
      {[
        [-5, 0, -3.5],
        [5, 0, 3.5],
      ].map((p, i) => (
        <group key={i} position={p as [number, number, number]} rotation={[0, i === 0 ? 0.2 : -0.2, 0]}>
          {/* Two rails */}
          <mesh position={[-0.18, 3, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 6, 8]} />
            <meshStandardMaterial color="#5A3A2A" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0.18, 3, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 6, 8]} />
            <meshStandardMaterial color="#5A3A2A" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* 8 rungs */}
          {Array.from({ length: 8 }, (_, j) => (
            <mesh key={j} position={[0, 0.5 + j * 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.025, 0.025, 0.4, 8]} />
              <meshStandardMaterial color="#5A3A2A" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ─── Central reading lectern (where shelf + cards materialize) ───

function ReadingLectern() {
  const ringRef = useRef<MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.opacity = 0.5 + 0.2 * Math.sin(clock.elapsedTime * 0.6);
    }
  });
  return (
    <group position={[0, 0, 0]}>
      {/* Wood top */}
      <mesh receiveShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[1.6, 1.4, 0.12, 24]} />
        <meshStandardMaterial color="#3A2818" metalness={0.2} roughness={0.55} />
      </mesh>
      {/* Stem */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.18, 0.32, 0.5, 12]} />
        <meshStandardMaterial color="#2A1E12" metalness={0.18} roughness={0.6} />
      </mesh>
      {/* Base */}
      <mesh receiveShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.7, 0.85, 0.1, 24]} />
        <meshStandardMaterial color="#2A1E12" metalness={0.2} roughness={0.6} />
      </mesh>
      {/* Lectern surface ring (where shelf hovers) */}
      <mesh position={[0, 0.57, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.4, 1.5, 48]} />
        <meshBasicMaterial ref={ringRef} color={LAB8_HEX} side={DoubleSide} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

// ─── Overhead mist (library dust motes) ──────────────────────────

function LibraryMist() {
  const ref = useRef<InstancedMesh>(null);
  const COUNT = 110;
  const dummy = useMemo(() => new Object3D(), []);
  const data = useMemo(() => Array.from({ length: COUNT }, () => ({
    r: 2.5 + Math.random() * 5,
    yBase: 1.5 + Math.random() * 6,
    phase: Math.random() * Math.PI * 2,
  })), []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      const d = data[i];
      const angle = d.phase + t * 0.04;
      dummy.position.set(
        Math.cos(angle) * d.r,
        d.yBase + Math.sin(t * 0.3 + d.phase) * 0.12,
        Math.sin(angle) * d.r,
      );
      const s = 0.014 + 0.008 * Math.sin(t * 0.6 + d.phase);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={LAB8_SOFT} transparent opacity={0.55} />
    </instancedMesh>
  );
}

// ─── Overhead reading lamps (warm) ───────────────────────────────

function OverheadLamps() {
  return (
    <group position={[0, 6, 0]}>
      {[
        [0, 0, 0],
        [-3, 0, 0],
        [3, 0, 0],
        [0, 0, -3],
        [0, 0, 3],
      ].map((p, i) => (
        <group key={i} position={p as [number, number, number]}>
          <mesh>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshBasicMaterial color="#FFD8B0" transparent opacity={0.7} />
          </mesh>
          <pointLight color="#FFD8B0" intensity={0.9} distance={6} decay={2} />
        </group>
      ))}
    </group>
  );
}

// ─── Wrapper export ──────────────────────────────────────────────

export default function ContextArchitectEnvironment() {
  return (
    <FlagshipEnvironmentWrapper
      labColor={LAB8_HEX}
      terrainColor="#1A1F38"
      skyTopColor="#0A0E20"
      skyHorizonColor={LAB8_DEEP}
      fogColor="#1A1A35"
    >
      <HexFloor />
      <ToweringShelves />
      <ArchiveLadders />
      <ReadingLectern />
      <LibraryMist />
      <OverheadLamps />
    </FlagshipEnvironmentWrapper>
  );
}
