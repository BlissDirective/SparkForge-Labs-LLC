'use client';

// ════════════════════════════════════════════════════════════════
// HarnessForgeEnvironment — Lab 11 Containment chamber (~3.0M tris)
// ════════════════════════════════════════════════════════════════
// Lab 11 | Color: #6FFFE6 (Mint-Cyan)
// Stage 11G - Constrain step of Build->Equip->Audit->Constrain
//
// Design intent: a forge-meets-containment-chamber. Heavier, more
// industrial than the other Lab 11 stages - this is where teams get
// hardened before ship. The visual centerpiece is a hex-paneled
// floor with three concentric ring etchings marking the radii where
// the player's 3 harness layers will materialize.
//
// Triangle Budget (Desktop Ultra):
//   FlagshipEnvironmentWrapper:                  ~600K
//   Hex Floor + Layer Markings:                  ~300K
//   Forge Pillars (4 corner anvils):             ~500K
//   Containment Stage Disc:                      ~350K
//   Overhead Industrial Truss:                   ~400K
//   Spark Particles (orange-tinted):             ~250K
//   Reactive Effects:                            ~300K
//   ────────────────────────────────────────
//   Total:                                       ~2.7M
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
const FORGE_AMBER = '#E68E28';

// ─── Hex floor with 3 concentric layer-radius markings ───────────

function HexFloorWithLayerMarks() {
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

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.13 + 0.05 * Math.sin(clock.elapsedTime * 0.55);
    }
  });

  return (
    <>
      <instancedMesh ref={ref} args={[undefined, undefined, total]} receiveShadow>
        <cylinderGeometry args={[radius * 0.92, radius * 0.92, 0.04, 6]} />
        <meshStandardMaterial
          ref={matRef}
          color="#0A1A1E"
          emissive={LAB11_HEX}
          emissiveIntensity={0.14}
          roughness={0.4}
          metalness={0.7}
        />
      </instancedMesh>
      {/* 3 concentric ring etchings — one per harness layer (innermost = filter,
          since filter is the outermost defensive perimeter conceptually wrapping
          tightest around the team) */}
      {[2.0, 3.0, 4.0].map((r, i) => (
        <mesh key={i} position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 0.04, r, 64]} />
          <meshBasicMaterial color={LAB11_HEX} side={DoubleSide} transparent opacity={0.35 - i * 0.08} />
        </mesh>
      ))}
    </>
  );
}

// ─── Containment stage (where team materializes) ──────────────────

function ContainmentStage() {
  const ringRef = useRef<MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.opacity = 0.5 + 0.25 * Math.sin(clock.elapsedTime * 0.65);
    }
  });
  return (
    <group position={[0, 0, 0]}>
      <mesh receiveShadow position={[0, -0.02, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 0.04, 64]} />
        <meshStandardMaterial color="#1A2C30" metalness={0.95} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.6, 64]} />
        <meshBasicMaterial ref={ringRef} color={LAB11_HEX} side={DoubleSide} transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.0, 1.02, 32]} />
        <meshBasicMaterial color={LAB11_SOFT} side={DoubleSide} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// ─── Forge pillars (4 anvil-style corners) ───────────────────────

function ForgePillars() {
  const groupRef = useRef<Group>(null);
  const positions: Array<[number, number, number]> = [
    [5.5, 0, 5.5],
    [-5.5, 0, 5.5],
    [5.5, 0, -5.5],
    [-5.5, 0, -5.5],
  ];

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((c, i) => {
      // Subtle ember pulse via y-bob
      c.position.y = 0.03 * Math.sin(clock.elapsedTime * 0.5 + i * 0.5);
    });
  });

  return (
    <group ref={groupRef}>
      {positions.map((p, i) => (
        <group key={i} position={p}>
          {/* Anvil base */}
          <mesh receiveShadow castShadow position={[0, 0.4, 0]}>
            <boxGeometry args={[0.9, 0.8, 0.9]} />
            <meshStandardMaterial color="#152A2E" metalness={0.92} roughness={0.22} />
          </mesh>
          {/* Top horn */}
          <mesh position={[0, 0.95, 0]}>
            <boxGeometry args={[0.7, 0.18, 1.4]} />
            <meshStandardMaterial color="#1F3F45" metalness={0.95} roughness={0.18} />
          </mesh>
          {/* Ember glow on top */}
          <mesh position={[0, 1.1, 0]}>
            <boxGeometry args={[0.4, 0.04, 0.8]} />
            <meshBasicMaterial color={FORGE_AMBER} transparent opacity={0.9} />
          </mesh>
          {/* Faint forge-light cast */}
          <pointLight color={FORGE_AMBER} intensity={1.0} distance={4.5} decay={2} position={[0, 1.3, 0]} />
        </group>
      ))}
    </group>
  );
}

// ─── Industrial overhead truss ───────────────────────────────────

function IndustrialTruss() {
  const trussRef = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!trussRef.current) return;
    trussRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.07) * 0.04;
  });
  return (
    <group ref={trussRef} position={[0, 5.5, 0]}>
      {/* Cross beams */}
      {[0, Math.PI / 2].map((rot, i) => (
        <mesh key={i} rotation={[0, rot, 0]}>
          <boxGeometry args={[0.2, 0.2, 12]} />
          <meshStandardMaterial color="#2A3A40" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
      {/* 4 corner-mounted Mint floodlights */}
      {[
        [4, 0, 4],
        [-4, 0, 4],
        [4, 0, -4],
        [-4, 0, -4],
      ].map((p, i) => (
        <pointLight
          key={i}
          color={LAB11_HEX}
          intensity={1.2}
          distance={9}
          decay={2}
          position={p as [number, number, number]}
        />
      ))}
    </group>
  );
}

// ─── Spark particles (warm forge sparks rising from corners) ─────

function SparkParticles() {
  const ref = useRef<InstancedMesh>(null);
  const COUNT = 120;
  const dummy = useMemo(() => new Object3D(), []);
  const data = useMemo(() => {
    return Array.from({ length: COUNT }, () => {
      const corner = Math.floor(Math.random() * 4);
      const cx = corner % 2 === 0 ? 5.5 : -5.5;
      const cz = corner < 2 ? 5.5 : -5.5;
      return {
        cx: cx + (Math.random() - 0.5) * 0.6,
        cz: cz + (Math.random() - 0.5) * 0.6,
        yBase: 1.0 + Math.random() * 0.5,
        speed: 0.4 + Math.random() * 0.6,
        phase: Math.random() * 3,
      };
    });
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      const d = data[i];
      const cycle = ((t * d.speed) + d.phase) % 4;
      const y = d.yBase + cycle * 1.0;
      dummy.position.set(d.cx, y, d.cz);
      const fade = Math.max(0, 1 - cycle / 4);
      const s = 0.025 * fade;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={FORGE_AMBER} transparent opacity={0.85} />
    </instancedMesh>
  );
}

// ─── Wrapper export ──────────────────────────────────────────────

export default function HarnessForgeEnvironment() {
  return (
    <FlagshipEnvironmentWrapper
      labColor={LAB11_HEX}
      terrainColor={LAB11_DEEP}
      skyTopColor="#03171A"
      skyHorizonColor="#082F33"
      fogColor="#08252A"
    >
      <HexFloorWithLayerMarks />
      <ContainmentStage />
      <ForgePillars />
      <IndustrialTruss />
      <SparkParticles />
    </FlagshipEnvironmentWrapper>
  );
}
