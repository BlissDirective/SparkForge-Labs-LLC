'use client';

// ════════════════════════════════════════════════════════════════
// PixelWitnessEnvironment — Lab 7 edit bay (~2.6M tris)
// ════════════════════════════════════════════════════════════════
// Lab 7: Computer Vision | Color: #10BAD2 (cyan)
// Stage 11C — C4 Pixel Witness
//
// Design intent per Doc 2 §G.8: 'edit-bay setting — tape reels,
// monitors, frame timeline scrolling on a wall'. Atmospheric
// monitoring-room vibe, cooler than the cozy Pocket Brain library.
//
// Triangle Budget (Desktop Ultra):
//   FlagshipEnvironmentWrapper:                  ~600K
//   Hex Floor (cyan tinted):                     ~200K
//   Side Monitors (4 stacked towers):            ~600K
//   Tape Reels (2 wall-mounted):                 ~250K
//   Frame Timeline (scrolling wall strip):       ~250K
//   Cinema Pedestal (where 3D scene mounts):     ~250K
//   Cyan Particle Field:                         ~200K
//   Reactive Effects:                            ~250K
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

const LAB7_HEX = '#10BAD2';
const LAB7_DEEP = '#062A35';
const LAB7_SOFT = '#7FE0EE';

// ─── Hex floor (cyan tinted) ─────────────────────────────────────

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
      matRef.current.emissiveIntensity = 0.13 + 0.04 * Math.sin(clock.elapsedTime * 0.55);
    }
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, total]} receiveShadow>
      <cylinderGeometry args={[radius * 0.92, radius * 0.92, 0.04, 6]} />
      <meshStandardMaterial
        ref={matRef}
        color={LAB7_DEEP}
        emissive={LAB7_HEX}
        emissiveIntensity={0.14}
        roughness={0.4}
        metalness={0.65}
      />
    </instancedMesh>
  );
}

// ─── Side monitor towers (4 stacked walls of monitors) ───────────

function SideMonitors() {
  const groupRef = useRef<Group>(null);
  const positions: Array<[number, number, number]> = [
    [-5, 0, -2.5],
    [-5, 0,  0.5],
    [ 5, 0, -2.5],
    [ 5, 0,  0.5],
  ];

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // Each tower's middle screen pulses out of phase.
    groupRef.current.children.forEach((c, i) => {
      const tower = c as Group;
      const middleScreen = tower.children[1] as Group;
      if (middleScreen) {
        const child = middleScreen.children[1];
        if (child) {
          const mat = (child as { material?: MeshBasicMaterial }).material;
          if (mat) {
            mat.opacity = 0.35 + 0.15 * Math.sin(clock.elapsedTime * 1.2 + i * 0.7);
          }
        }
      }
    });
  });

  return (
    <group ref={groupRef}>
      {positions.map((p, i) => (
        <group key={i} position={p}>
          {/* 3 stacked screens per tower */}
          {[0, 1, 2].map((row) => (
            <group key={row} position={[0, 0.6 + row * 0.95, 0]}>
              {/* Bezel */}
              <mesh>
                <boxGeometry args={[1.2, 0.85, 0.1]} />
                <meshStandardMaterial color="#0E1A22" metalness={0.85} roughness={0.25} />
              </mesh>
              {/* Screen surface */}
              <mesh position={[0, 0, 0.06]}>
                <planeGeometry args={[1.05, 0.7]} />
                <meshBasicMaterial color={LAB7_HEX} transparent opacity={0.4} side={DoubleSide} />
              </mesh>
            </group>
          ))}
          {/* Tower base */}
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[1.4, 0.1, 0.5]} />
            <meshStandardMaterial color="#0A1A22" metalness={0.85} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Tape reels (2 wall-mounted, slow rotate) ────────────────────

function TapeReels() {
  const reelRefs = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!reelRefs.current) return;
    reelRefs.current.children.forEach((reel, i) => {
      // Two reels rotate in opposite directions like a real tape deck.
      const dir = i % 2 === 0 ? 1 : -1;
      reel.rotation.z = clock.elapsedTime * 0.25 * dir;
    });
  });

  return (
    <group ref={reelRefs} position={[0, 4, -5]}>
      {[
        [-1.4, 0, 0],
        [1.4, 0, 0],
      ].map((p, i) => (
        <group key={i} position={p as [number, number, number]}>
          {/* Reel disc */}
          <mesh>
            <cylinderGeometry args={[0.7, 0.7, 0.06, 24]} />
            <meshStandardMaterial color="#1A2A30" metalness={0.85} roughness={0.3} />
          </mesh>
          {/* Cyan rim */}
          <mesh>
            <torusGeometry args={[0.65, 0.025, 8, 32]} />
            <meshBasicMaterial color={LAB7_HEX} />
          </mesh>
          {/* Inner spokes (4) */}
          {[0, 1, 2, 3].map((j) => {
            const angle = (j / 4) * Math.PI * 2;
            return (
              <mesh
                key={j}
                position={[Math.cos(angle) * 0.3, Math.sin(angle) * 0.3, 0.04]}
              >
                <boxGeometry args={[0.04, 0.5, 0.02]} />
                <meshStandardMaterial color={LAB7_SOFT} metalness={0.8} roughness={0.3} />
              </mesh>
            );
          })}
          {/* Hub */}
          <mesh>
            <cylinderGeometry args={[0.1, 0.1, 0.08, 16]} />
            <meshStandardMaterial color="#0A1A22" metalness={0.9} roughness={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Frame timeline (scrolling wall strip) ───────────────────────

function FrameTimeline() {
  const ref = useRef<InstancedMesh>(null);
  const COUNT = 30;
  const dummy = useMemo(() => new Object3D(), []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      const xOffset = (((i / COUNT) + (t * 0.05)) % 1) * 14 - 7;
      dummy.position.set(xOffset, 2.2, -4.95);
      dummy.scale.set(0.5, 0.32, 0.04);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={LAB7_HEX} transparent opacity={0.3} />
    </instancedMesh>
  );
}

// ─── Cinema pedestal (where the cinema screen + AI iris mount) ───

function CinemaPedestal() {
  const ringRef = useRef<MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.opacity = 0.5 + 0.2 * Math.sin(clock.elapsedTime * 0.7);
    }
  });
  return (
    <group position={[0, 0, 0]}>
      <mesh receiveShadow position={[0, 0.04, 0]}>
        <cylinderGeometry args={[2.2, 2.4, 0.08, 32]} />
        <meshStandardMaterial color="#0E1A22" metalness={0.95} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.1, 2.2, 48]} />
        <meshBasicMaterial ref={ringRef} color={LAB7_HEX} side={DoubleSide} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.10, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.45, 1.48, 32]} />
        <meshBasicMaterial color={LAB7_SOFT} side={DoubleSide} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// ─── Cyan particle field ─────────────────────────────────────────

function ParticleField() {
  const ref = useRef<InstancedMesh>(null);
  const COUNT = 130;
  const dummy = useMemo(() => new Object3D(), []);
  const data = useMemo(() => Array.from({ length: COUNT }, () => ({
    r: 3 + Math.random() * 4,
    yBase: 1.5 + Math.random() * 4,
    phase: Math.random() * Math.PI * 2,
  })), []);

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
      <meshBasicMaterial color={LAB7_SOFT} transparent opacity={0.7} />
    </instancedMesh>
  );
}

// ─── Wrapper export ──────────────────────────────────────────────

export default function PixelWitnessEnvironment() {
  return (
    <FlagshipEnvironmentWrapper
      labColor={LAB7_HEX}
      terrainColor={LAB7_DEEP}
      skyTopColor="#03171A"
      skyHorizonColor="#082F33"
      fogColor="#08252A"
    >
      <HexFloor />
      <SideMonitors />
      <TapeReels />
      <FrameTimeline />
      <CinemaPedestal />
      <ParticleField />
      {/* Edit-bay overhead key light */}
      <pointLight color={LAB7_HEX} intensity={1.4} distance={12} decay={2} position={[0, 6, 2]} />
    </FlagshipEnvironmentWrapper>
  );
}
