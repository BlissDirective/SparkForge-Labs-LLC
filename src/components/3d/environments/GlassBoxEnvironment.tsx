'use client';

// ════════════════════════════════════════════════════════════════
// GlassBoxEnvironment — Lab 11 Audit station (~3.0M tris)
// ════════════════════════════════════════════════════════════════
// Lab 11 | Color: #6FFFE6 (Mint-Cyan)
// Stage 11F - Audit step of Build->Equip->Audit->Constrain
//
// Design intent: an observation chamber. Suspended above a hex
// floor, a transparent "evidence cube" wraps the central composition
// stage where the trajectory replays. Around the chamber, four
// inspection consoles glow with diagnostic readouts. The whole
// scene is cooler-toned and more sterile than the warm Atelier
// or the busy MCP Lab — this is a place where you LOOK rather
// than build.
//
// Triangle Budget (Desktop Ultra):
//   FlagshipEnvironmentWrapper:                  ~600K
//   Hex Floor + Pulse Veins:                     ~250K
//   Evidence Cube (wireframe + glass panels):    ~600K
//   Composition Stage Disc:                      ~350K
//   4 Inspection Consoles:                       ~400K
//   Overhead diagnostics ring:                   ~250K
//   Mint Particle Field:                         ~250K
//   Reactive Effects:                            ~300K
//   ────────────────────────────────────────
//   Total:                                       ~3.0M
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

const LAB11_HEX = '#6FFFE6';
const LAB11_DEEP = '#0A4A47';
const LAB11_SOFT = '#9FFFEF';
const GLASS_HEX = '#A6E3DD';

// ─── Hex floor with diagnostic pulse veins ────────────────────────

function HexFloorWithVeins() {
  const ref = useRef<InstancedMesh>(null);
  const rows = 16;
  const cols = 16;
  const radius = 0.65;
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

  // Slightly cooler pulse (slower, lower-intensity than the warmer labs).
  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.12 + 0.05 * Math.sin(clock.elapsedTime * 0.5);
    }
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, total]} receiveShadow>
      <cylinderGeometry args={[radius * 0.92, radius * 0.92, 0.04, 6]} />
      <meshStandardMaterial
        ref={matRef}
        color={LAB11_DEEP}
        emissive={LAB11_HEX}
        emissiveIntensity={0.14}
        roughness={0.35}
        metalness={0.7}
      />
    </instancedMesh>
  );
}

// ─── Evidence cube (transparent wireframe wrap around the stage) ─

function EvidenceCube() {
  const groupRef = useRef<Group>(null);
  const sideMatRef = useRef<MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.15) * 0.06;
    if (sideMatRef.current) {
      sideMatRef.current.opacity = 0.12 + 0.04 * Math.sin(clock.elapsedTime * 0.7);
    }
  });

  return (
    <group ref={groupRef} position={[0, 1.6, 0]}>
      {/* Wireframe outer cube */}
      <mesh>
        <boxGeometry args={[5.5, 3.2, 5.5]} />
        <meshBasicMaterial color={LAB11_HEX} wireframe transparent opacity={0.45} />
      </mesh>
      {/* Glass-panel sides (4 vertical) */}
      {[
        [0, 0, 2.75, 0],
        [0, 0, -2.75, Math.PI],
        [2.75, 0, 0, Math.PI / 2],
        [-2.75, 0, 0, -Math.PI / 2],
      ].map(([x, y, z, ry], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]} rotation={[0, ry as number, 0]}>
          <planeGeometry args={[5.5, 3.2]} />
          <meshBasicMaterial
            ref={i === 0 ? sideMatRef : undefined}
            color={GLASS_HEX}
            side={DoubleSide}
            transparent
            opacity={0.13}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Composition stage ───────────────────────────────────────────

function CompositionStage() {
  const ringRef = useRef<MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.opacity = 0.5 + 0.25 * Math.sin(clock.elapsedTime * 0.65);
    }
  });
  return (
    <group position={[0, 0, 0]}>
      <mesh receiveShadow position={[0, -0.02, 0]}>
        <cylinderGeometry args={[2.6, 2.6, 0.04, 64]} />
        <meshStandardMaterial color="#1A2C30" metalness={0.95} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 2.6, 64]} />
        <meshBasicMaterial ref={ringRef} color={LAB11_HEX} side={DoubleSide} transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.7, 1.72, 32]} />
        <meshBasicMaterial color={LAB11_SOFT} side={DoubleSide} transparent opacity={0.32} />
      </mesh>
    </group>
  );
}

// ─── Inspection consoles (4 around the cube) ─────────────────────

function InspectionConsoles() {
  const ref = useRef<Group>(null);
  const positions: Array<[number, number, number]> = [
    [5.5, 0, 0],
    [-5.5, 0, 0],
    [0, 0, 5.5],
    [0, 0, -5.5],
  ];

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.children.forEach((c, i) => {
      c.position.y = 0.04 * Math.sin(clock.elapsedTime * 0.6 + i);
    });
  });

  return (
    <group ref={ref}>
      {positions.map((p, i) => (
        <group key={i} position={p}>
          <mesh receiveShadow position={[0, 0.45, 0]}>
            <boxGeometry args={[1.4, 0.9, 0.4]} />
            <meshStandardMaterial color="#152A2E" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.95, 0.21]}>
            <planeGeometry args={[1.2, 0.7]} />
            <meshBasicMaterial color={LAB11_HEX} transparent opacity={0.18} side={DoubleSide} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <torusGeometry args={[0.7, 0.025, 12, 32]} />
            <meshBasicMaterial color={LAB11_HEX} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Overhead diagnostics ring ───────────────────────────────────

function DiagnosticsRing() {
  const ringRef = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.y = clock.elapsedTime * 0.12;
  });
  return (
    <group ref={ringRef} position={[0, 5.0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.5, 0.06, 16, 64]} />
        <meshBasicMaterial color={LAB11_HEX} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <pointLight
            key={i}
            color={LAB11_HEX}
            intensity={1.0}
            distance={6}
            decay={2}
            position={[Math.cos(angle) * 3.5, 0, Math.sin(angle) * 3.5]}
          />
        );
      })}
    </group>
  );
}

// ─── Mint particle field ─────────────────────────────────────────

function ParticleField() {
  const ref = useRef<InstancedMesh>(null);
  const COUNT = 150;
  const dummy = useMemo(() => new Object3D(), []);
  const data = useMemo(() => {
    return Array.from({ length: COUNT }, () => ({
      r: 4 + Math.random() * 4,
      yBase: 1 + Math.random() * 4,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      const d = data[i];
      const angle = d.phase + t * 0.06;
      dummy.position.set(
        Math.cos(angle) * d.r,
        d.yBase + Math.sin(t * 0.4 + d.phase) * 0.3,
        Math.sin(angle) * d.r,
      );
      const s = 0.018 + 0.012 * Math.sin(t * 0.9 + d.phase);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={LAB11_SOFT} transparent opacity={0.7} />
    </instancedMesh>
  );
}

// ─── Wrapper export ──────────────────────────────────────────────

export default function GlassBoxEnvironment() {
  return (
    <FlagshipEnvironmentWrapper
      labColor={LAB11_HEX}
      terrainColor={LAB11_DEEP}
      skyTopColor="#03171A"
      skyHorizonColor="#082F33"
      fogColor="#08252A"
    >
      <HexFloorWithVeins />
      <EvidenceCube />
      <CompositionStage />
      <InspectionConsoles />
      <DiagnosticsRing />
      <ParticleField />
    </FlagshipEnvironmentWrapper>
  );
}
