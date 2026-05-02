'use client';

// ════════════════════════════════════════════════════════════════
// PocketBrainEnvironment — Lab 1 tabletop close-up (~2.4M tris)
// ════════════════════════════════════════════════════════════════
// Lab 1: What IS AI? | Color: #0FB8FA (blue)
// Stage 11A — C5 Pocket Brain
//
// Design intent per Doc 2 §H.8: tabletop close-up — laptop on a desk,
// model files as glowing orbs being downloaded. Warm cozy framing
// meant to evoke "right here, in your room, on your laptop". This is
// the first flagship a new player sees, so the visual must
// communicate "you, the kid, are about to do something real."
//
// Triangle Budget (Desktop Ultra):
//   FlagshipEnvironmentWrapper:                  ~600K
//   Hex Floor (smaller, suggestive of room):     ~200K
//   Desk + Laptop:                               ~600K
//   Floating Model-File Orbs (10 orbs):          ~250K
//   Overhead Lampshade Lighting:                 ~250K
//   Soft Mist Particles:                         ~200K
//   Reactive Effects:                            ~300K
//   ────────────────────────────────────────
//   Total:                                       ~2.4M
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

const LAB1_HEX = '#0FB8FA';
const LAB1_DEEP = '#0A2A45';
const LAB1_SOFT = '#7FD8FF';
const WARM_AMBER = '#FFB97A';

// ─── Hex floor (smaller than other labs — close-up framing) ──────

function HexFloor() {
  const ref = useRef<InstancedMesh>(null);
  const rows = 12;
  const cols = 12;
  const radius = 0.55;
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
      matRef.current.emissiveIntensity = 0.12 + 0.04 * Math.sin(clock.elapsedTime * 0.4);
    }
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, total]} receiveShadow>
      <cylinderGeometry args={[radius * 0.92, radius * 0.92, 0.04, 6]} />
      <meshStandardMaterial
        ref={matRef}
        color="#0A1A2A"
        emissive={LAB1_HEX}
        emissiveIntensity={0.13}
        roughness={0.55}
        metalness={0.45}
      />
    </instancedMesh>
  );
}

// ─── Desk + laptop centerpiece ───────────────────────────────────

function DeskAndLaptop() {
  const screenMatRef = useRef<MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (screenMatRef.current) {
      // Subtle screen pulse to evoke "the model is working".
      screenMatRef.current.opacity = 0.55 + 0.12 * Math.sin(clock.elapsedTime * 1.2);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Desktop surface */}
      <mesh receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[3.6, 0.08, 2.4]} />
        <meshStandardMaterial color="#3A2818" metalness={0.15} roughness={0.55} />
      </mesh>
      {/* 4 desk legs */}
      {[
        [1.7, 0.25, 1.1],
        [-1.7, 0.25, 1.1],
        [1.7, 0.25, -1.1],
        [-1.7, 0.25, -1.1],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} receiveShadow>
          <boxGeometry args={[0.12, 0.5, 0.12]} />
          <meshStandardMaterial color="#2A1E12" metalness={0.2} roughness={0.6} />
        </mesh>
      ))}
      {/* Laptop base (closed deck) */}
      <mesh receiveShadow castShadow position={[0, 0.6, 0.1]}>
        <boxGeometry args={[1.7, 0.05, 1.1]} />
        <meshStandardMaterial color="#2A2A2E" metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Laptop screen (lifted, tilted) */}
      <group position={[0, 0.62, -0.45]} rotation={[-0.18, 0, 0]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[1.7, 1.1, 0.05]} />
          <meshStandardMaterial color="#1A1A1E" metalness={0.9} roughness={0.18} />
        </mesh>
        {/* Screen glow surface */}
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[1.55, 0.95]} />
          <meshBasicMaterial ref={screenMatRef} color={LAB1_HEX} transparent opacity={0.6} side={DoubleSide} />
        </mesh>
      </group>
      {/* Brand-strip Mint-blue under-glow on the deck */}
      <mesh position={[0, 0.625, 0.08]}>
        <boxGeometry args={[1.4, 0.005, 0.85]} />
        <meshBasicMaterial color={LAB1_SOFT} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// ─── Floating model-file orbs (10 — visual metaphor for download) ─

function ModelFileOrbs() {
  const groupRef = useRef<Group>(null);
  const orbs = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * Math.PI * 2;
      const r = 2.6 + (i % 3) * 0.35;
      return {
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        yBase: 1.4 + (i % 4) * 0.25,
        phase: i * 0.7,
      };
    });
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((c, i) => {
      const orb = orbs[i];
      if (!orb) return;
      c.position.y = orb.yBase + 0.08 * Math.sin(clock.elapsedTime * 0.6 + orb.phase);
    });
  });

  return (
    <group ref={groupRef}>
      {orbs.map((orb, i) => (
        <group key={i} position={[orb.x, orb.yBase, orb.z]}>
          <mesh>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color={LAB1_HEX} transparent opacity={0.85} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshBasicMaterial color={LAB1_HEX} transparent opacity={0.18} side={DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Overhead lampshade ──────────────────────────────────────────

function LampshadeLighting() {
  return (
    <group position={[0, 4, 0.3]}>
      {/* Cord */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 1.2, 6]} />
        <meshStandardMaterial color="#1A1A1A" />
      </mesh>
      {/* Shade (cone) */}
      <mesh position={[0, -0.2, 0]}>
        <coneGeometry args={[0.55, 0.5, 16, 1, true]} />
        <meshStandardMaterial color="#E8D9B5" side={DoubleSide} roughness={0.6} />
      </mesh>
      {/* Lightbulb glow */}
      <mesh position={[0, -0.35, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color={WARM_AMBER} transparent opacity={0.6} />
      </mesh>
      <pointLight color={WARM_AMBER} intensity={2.8} distance={6} decay={2} position={[0, -0.4, 0]} />
    </group>
  );
}

// ─── Soft mist particles (cozy room atmosphere) ──────────────────

function SoftMist() {
  const ref = useRef<InstancedMesh>(null);
  const COUNT = 80;
  const dummy = useMemo(() => new Object3D(), []);
  const data = useMemo(() => Array.from({ length: COUNT }, () => ({
    r: 1.5 + Math.random() * 3,
    yBase: 0.6 + Math.random() * 2.5,
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
        d.yBase + Math.sin(t * 0.3 + d.phase) * 0.15,
        Math.sin(angle) * d.r,
      );
      const s = 0.012 + 0.008 * Math.sin(t * 0.7 + d.phase);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={LAB1_SOFT} transparent opacity={0.55} />
    </instancedMesh>
  );
}

// ─── Wrapper export ──────────────────────────────────────────────

export default function PocketBrainEnvironment() {
  return (
    <FlagshipEnvironmentWrapper
      labColor={LAB1_HEX}
      terrainColor="#0A1A2A"
      skyTopColor="#020A14"
      skyHorizonColor="#0A2545"
      fogColor="#08182A"
    >
      <HexFloor />
      <DeskAndLaptop />
      <ModelFileOrbs />
      <LampshadeLighting />
      <SoftMist />
    </FlagshipEnvironmentWrapper>
  );
}
