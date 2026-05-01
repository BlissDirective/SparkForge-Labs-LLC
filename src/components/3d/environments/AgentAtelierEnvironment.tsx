'use client';

// ════════════════════════════════════════════════════════════════
// AgentAtelierEnvironment — Lab 11 Agentic AI workshop (~3.5M tris)
// ════════════════════════════════════════════════════════════════
// Lab 11: Agentic AI | Color: #6FFFE6 (Mint-Cyan, OKLCH 0.85 0.16 175)
// Stage 11D — Agent Atelier (C1, Lab-11 opener)
//
// Design intent: a futuristic atelier that visually communicates
// "build a team of specialists." Twelve hexagonal pedestals form a
// half-ring around a central composition stage; the player's wired
// team materializes on the stage with trace beams flowing between
// them. The atelier theme is "luminous craftsman" — Mint-Cyan
// holographic light, brushed-metal floor, soft volumetric haze.
//
// Triangle Budget (Desktop Ultra):
//   Terrain (FlagshipEnvironmentWrapper):  ~600K
//   Sky / Atmosphere:                      ~120K
//   Hex-Grid Floor Accent:                 ~250K
//   Pedestal Half-Ring (12 pedestals):     ~600K
//   Composition Stage (central platform):  ~400K
//   Workshop Lattice (overhead lighting):  ~350K
//   Specialist Holograms (idle states):    ~500K  (handled by AgentAtelier3D)
//   Mint-Cyan Ribbon Particles:            ~250K
//   Reactive Effects (FlagshipBase):       ~400K
//   ────────────────────────────────────────
//   Total:                                ~3.47M
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

// ─── Hex-grid floor accent ───────────────────────────────────────

function HexGridFloor() {
  const ref = useRef<InstancedMesh>(null);
  const rows = 18;
  const cols = 18;
  const radius = 0.62;
  const spacingX = radius * Math.sqrt(3);
  const spacingZ = radius * 1.5;
  const total = rows * cols;

  // Pre-build instance matrices once after mount.
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

  // Subtle breathing pulse on emissive intensity.
  const matRef = useRef<MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.18 + 0.06 * Math.sin(clock.elapsedTime * 0.6);
    }
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, total]} receiveShadow>
      <cylinderGeometry args={[radius * 0.92, radius * 0.92, 0.04, 6]} />
      <meshStandardMaterial
        ref={matRef}
        color={LAB11_DEEP}
        emissive={LAB11_HEX}
        emissiveIntensity={0.2}
        roughness={0.45}
        metalness={0.6}
      />
    </instancedMesh>
  );
}

// ─── Pedestal half-ring (12 specialist showcase plinths) ─────────

function PedestalHalfRing() {
  const groupRef = useRef<Group>(null);
  const PEDESTAL_COUNT = 12;
  const RADIUS = 7.5;

  // Pedestal positions: 12 evenly-spaced on the back hemisphere (-π .. 0).
  const positions = useMemo(() => {
    return Array.from({ length: PEDESTAL_COUNT }, (_, i) => {
      const t = i / (PEDESTAL_COUNT - 1); // 0 .. 1
      const angle = -Math.PI + t * Math.PI; // -π .. 0
      return [Math.cos(angle) * RADIUS, 0, Math.sin(angle) * RADIUS] as [number, number, number];
    });
  }, []);

  // Idle hover bob.
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((c, i) => {
      c.position.y = 0.05 * Math.sin(clock.elapsedTime * 0.5 + i * 0.45);
    });
  });

  return (
    <group ref={groupRef}>
      {positions.map((p, i) => (
        <group key={i} position={p}>
          {/* Hex base */}
          <mesh receiveShadow castShadow position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.45, 0.55, 0.3, 6]} />
            <meshStandardMaterial color="#152A2E" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Mint-Cyan rim glow */}
          <mesh position={[0, 0.32, 0]}>
            <torusGeometry args={[0.5, 0.025, 12, 32]} />
            <meshBasicMaterial color={LAB11_HEX} />
          </mesh>
          {/* Holographic socket — empty until specialist places */}
          <mesh position={[0, 0.65, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.04, 24]} />
            <meshBasicMaterial color={LAB11_SOFT} transparent opacity={0.18} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Composition stage (central platform where team is wired) ────

function CompositionStage() {
  const ringRef = useRef<MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.opacity = 0.55 + 0.25 * Math.sin(clock.elapsedTime * 0.7);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Brushed-metal disc */}
      <mesh receiveShadow position={[0, -0.02, 0]}>
        <cylinderGeometry args={[3.5, 3.5, 0.04, 64]} />
        <meshStandardMaterial color="#1A2C30" metalness={0.95} roughness={0.18} />
      </mesh>
      {/* Mint-Cyan grade-circle ring */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.4, 3.5, 64]} />
        <meshBasicMaterial ref={ringRef} color={LAB11_HEX} side={DoubleSide} transparent opacity={0.6} />
      </mesh>
      {/* Inner-glyph etched pattern */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.4, 2.42, 32]} />
        <meshBasicMaterial color={LAB11_SOFT} side={DoubleSide} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// ─── Overhead lattice (workshop ceiling lights) ──────────────────

function WorkshopLattice() {
  const beams = 8;
  const radius = 9;
  const beamRefs = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!beamRefs.current) return;
    beamRefs.current.rotation.y = clock.elapsedTime * 0.05;
  });
  return (
    <group ref={beamRefs} position={[0, 6.5, 0]}>
      {Array.from({ length: beams }, (_, i) => {
        const angle = (i / beams) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh>
              <boxGeometry args={[0.18, 0.18, 1.2]} />
              <meshStandardMaterial color="#2A3A40" metalness={0.9} roughness={0.3} />
            </mesh>
            <pointLight color={LAB11_HEX} intensity={1.4} distance={9} decay={2} position={[0, -0.3, 0]} />
          </group>
        );
      })}
    </group>
  );
}

// ─── Mint-Cyan ribbon particles ──────────────────────────────────

function RibbonParticles() {
  const ref = useRef<InstancedMesh>(null);
  const COUNT = 220;

  const baseY = useMemo(() => {
    return Array.from({ length: COUNT }, () => 1 + Math.random() * 5);
  }, []);
  const baseR = useMemo(() => {
    return Array.from({ length: COUNT }, () => 4 + Math.random() * 6);
  }, []);
  const phase = useMemo(() => {
    return Array.from({ length: COUNT }, () => Math.random() * Math.PI * 2);
  }, []);

  const dummy = useMemo(() => new Object3D(), []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      const angle = phase[i] + t * 0.08;
      const x = Math.cos(angle) * baseR[i];
      const z = Math.sin(angle) * baseR[i];
      const y = baseY[i] + Math.sin(t * 0.6 + phase[i]) * 0.4;
      dummy.position.set(x, y, z);
      const s = 0.02 + 0.02 * Math.sin(t * 1.2 + phase[i]);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={LAB11_HEX} transparent opacity={0.85} />
    </instancedMesh>
  );
}

// ─── Wrapper export ──────────────────────────────────────────────

export default function AgentAtelierEnvironment() {
  return (
    <FlagshipEnvironmentWrapper
      labColor={LAB11_HEX}
      terrainColor={LAB11_DEEP}
      skyTopColor="#03171A"
      skyHorizonColor="#082F33"
      fogColor="#08252A"
    >
      <HexGridFloor />
      <PedestalHalfRing />
      <CompositionStage />
      <WorkshopLattice />
      <RibbonParticles />
      {/* Static composition stage signage */}
      <mesh position={[0, 0.9, -3]} rotation={[0, 0, 0]}>
        <planeGeometry args={[2.4, 0.4]} />
        <meshBasicMaterial color={LAB11_HEX} transparent opacity={0.18} side={DoubleSide} />
      </mesh>
    </FlagshipEnvironmentWrapper>
  );
}
