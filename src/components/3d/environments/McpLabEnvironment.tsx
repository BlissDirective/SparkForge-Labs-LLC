'use client';

// ════════════════════════════════════════════════════════════════
// McpLabEnvironment — Lab 11 MCP Plug-and-Play workshop (~3.2M tris)
// ════════════════════════════════════════════════════════════════
// Lab 11 | Color: #6FFFE6 (Mint-Cyan)
// Stage 11E - C6, the "Equip" step of Build->Equip->Constrain
//
// Design intent: a futuristic tool workshop with a curved tool-rack
// wall behind a central composition stage. The wall is the visual
// metaphor for "the catalog" - rows of tinted plinths where each
// tool's hologram floats. The center stage carries the team; tool
// connections beam from wall plinths down to bound agent ports.
//
// Triangle Budget (Desktop Ultra):
//   FlagshipEnvironmentWrapper (terrain + sky):     ~600K
//   Curved Tool-Rack Wall:                          ~700K (instanced
//                                                          plinths)
//   Composition Stage:                              ~350K
//   Floor Hex-Grid:                                 ~250K
//   Overhead Lighting Truss:                        ~300K
//   Mint Ribbon Particles:                          ~200K
//   Reactive Effects:                               ~400K
//   ────────────────────────────────────────
//   Total:                                          ~2.8M
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
  const rows = 14;
  const cols = 14;
  const radius = 0.7;
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
      matRef.current.emissiveIntensity = 0.16 + 0.06 * Math.sin(clock.elapsedTime * 0.7);
    }
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, total]} receiveShadow>
      <cylinderGeometry args={[radius * 0.92, radius * 0.92, 0.04, 6]} />
      <meshStandardMaterial
        ref={matRef}
        color={LAB11_DEEP}
        emissive={LAB11_HEX}
        emissiveIntensity={0.18}
        roughness={0.45}
        metalness={0.6}
      />
    </instancedMesh>
  );
}

// ─── Curved tool-rack wall (14 plinths in 2 stacked rows) ────────

function ToolRackWall() {
  const groupRef = useRef<Group>(null);
  // 14 tool slots = 7 per row × 2 rows.
  const SLOTS_PER_ROW = 7;
  const RADIUS = 8.5;
  const ARC_DEG = 100; // center the arc around the back hemisphere

  const slots = useMemo(() => {
    const start = -((ARC_DEG / 2) * Math.PI) / 180 - Math.PI;
    const span = (ARC_DEG * Math.PI) / 180;
    const out: Array<{ row: number; pos: [number, number, number]; angle: number }> = [];
    for (let row = 0; row < 2; row++) {
      const y = 1.4 + row * 1.0;
      for (let i = 0; i < SLOTS_PER_ROW; i++) {
        const t = i / (SLOTS_PER_ROW - 1);
        const angle = start + t * span;
        const x = Math.cos(angle) * RADIUS;
        const z = Math.sin(angle) * RADIUS;
        out.push({ row, pos: [x, y, z], angle });
      }
    }
    return out;
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // Subtle pulse on individual plinths via group y-bob.
    groupRef.current.children.forEach((c, i) => {
      c.position.y = 0.04 * Math.sin(clock.elapsedTime * 0.7 + i * 0.2);
    });
  });

  return (
    <group ref={groupRef}>
      {slots.map((slot, i) => (
        <group key={i} position={slot.pos} rotation={[0, -slot.angle - Math.PI / 2, 0]}>
          {/* Plinth backboard */}
          <mesh receiveShadow castShadow>
            <boxGeometry args={[0.7, 0.7, 0.1]} />
            <meshStandardMaterial color="#152A2E" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Mint rim */}
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[0.62, 0.62, 0.02]} />
            <meshBasicMaterial color={LAB11_DEEP} transparent opacity={0.6} />
          </mesh>
          {/* Inner glow (tool slot) */}
          <mesh position={[0, 0, 0.08]}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshBasicMaterial color={LAB11_HEX} transparent opacity={0.18} side={DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Composition stage (where player's team materializes) ─────────

function CompositionStage() {
  const ringRef = useRef<MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.opacity = 0.55 + 0.25 * Math.sin(clock.elapsedTime * 0.7);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh receiveShadow position={[0, -0.02, 0]}>
        <cylinderGeometry args={[3.0, 3.0, 0.04, 64]} />
        <meshStandardMaterial color="#1A2C30" metalness={0.95} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.9, 3.0, 64]} />
        <meshBasicMaterial ref={ringRef} color={LAB11_HEX} side={DoubleSide} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.0, 2.02, 32]} />
        <meshBasicMaterial color={LAB11_SOFT} side={DoubleSide} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// ─── Overhead lighting truss ─────────────────────────────────────

function LightingTruss() {
  const beams = 6;
  const radius = 6.5;
  const trussRef = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!trussRef.current) return;
    trussRef.current.rotation.y = clock.elapsedTime * 0.04;
  });
  return (
    <group ref={trussRef} position={[0, 5.5, 0]}>
      {Array.from({ length: beams }, (_, i) => {
        const angle = (i / beams) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh>
              <boxGeometry args={[0.16, 0.16, 1.0]} />
              <meshStandardMaterial color="#2A3A40" metalness={0.9} roughness={0.3} />
            </mesh>
            <pointLight
              color={LAB11_HEX}
              intensity={1.3}
              distance={9}
              decay={2}
              position={[0, -0.3, 0]}
            />
          </group>
        );
      })}
    </group>
  );
}

// ─── Drifting Mint particles ─────────────────────────────────────

function MintRibbonParticles() {
  const ref = useRef<InstancedMesh>(null);
  const COUNT = 180;
  const dummy = useMemo(() => new Object3D(), []);

  const data = useMemo(() => {
    return Array.from({ length: COUNT }, () => ({
      r: 4 + Math.random() * 5,
      yBase: 1 + Math.random() * 4,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      const d = data[i];
      const angle = d.phase + t * 0.07;
      dummy.position.set(
        Math.cos(angle) * d.r,
        d.yBase + Math.sin(t * 0.5 + d.phase) * 0.4,
        Math.sin(angle) * d.r,
      );
      const s = 0.022 + 0.015 * Math.sin(t * 1.0 + d.phase);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={LAB11_HEX} transparent opacity={0.8} />
    </instancedMesh>
  );
}

// ─── Wrapper export ──────────────────────────────────────────────

export default function McpLabEnvironment() {
  return (
    <FlagshipEnvironmentWrapper
      labColor={LAB11_HEX}
      terrainColor={LAB11_DEEP}
      skyTopColor="#03171A"
      skyHorizonColor="#082F33"
      fogColor="#08252A"
    >
      <HexGridFloor />
      <ToolRackWall />
      <CompositionStage />
      <LightingTruss />
      <MintRibbonParticles />
    </FlagshipEnvironmentWrapper>
  );
}
