'use client';

// ════════════════════════════════════════════════════════════════
// PocketBrain3D — Stage 11A dynamic scene content
// ════════════════════════════════════════════════════════════════
// Lab 1 | Color: #0FB8FA (blue)
//
// What this component owns (per Doc 2 §H.8):
//   • Glowing miniature brain — 8 lobes representing MoE experts.
//     Lobes light up when active.
//   • Token stream — glowing pellets streaming from the brain
//     during inference; pellet count tracks tokensPerSec.
//   • Idle, downloading, ready, streaming visual states pulled from
//     usePocketBrainStore.
// ════════════════════════════════════════════════════════════════

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from 'three';

import { usePocketBrainStore } from '@/stores/pocketBrainStore';

const LAB1_HEX = '#0FB8FA';
const LAB1_SOFT = '#7FD8FF';

// 8 MoE expert lobe positions on a small sphere (octahedral-ish layout
// around the brain core).
const LOBE_POSITIONS: Array<[number, number, number]> = [
  [ 0.30,  0.10,  0.30],
  [-0.30,  0.10,  0.30],
  [ 0.30,  0.10, -0.30],
  [-0.30,  0.10, -0.30],
  [ 0.20,  0.42,  0.00],
  [-0.20,  0.42,  0.00],
  [ 0.00, -0.20,  0.40],
  [ 0.00, -0.20, -0.40],
];

// Per-lobe accent (subtle hue rotation around blue → cyan → blue-violet).
const LOBE_ACCENTS = [
  '#0FB8FA', '#10D2D2', '#7FB8FF', '#9FB8FA',
  '#0FE8FF', '#7FB8FF', '#0F98FA', '#5FA8FF',
];

// ─── Brain core ──────────────────────────────────────────────────

function BrainCore() {
  const matRef = useRef<MeshBasicMaterial>(null);
  const wireRef = useRef<MeshBasicMaterial>(null);
  const modelStatus = usePocketBrainStore((s) => s.modelStatus);
  const isStreaming = usePocketBrainStore((s) => s.isStreaming);

  useFrame(({ clock }) => {
    if (!matRef.current || !wireRef.current) return;
    const t = clock.elapsedTime;
    if (modelStatus === 'idle') {
      matRef.current.opacity = 0.18;
      wireRef.current.opacity = 0.25;
    } else if (modelStatus === 'downloading' || modelStatus === 'loading') {
      // Slow heartbeat during load.
      matRef.current.opacity = 0.35 + 0.15 * Math.sin(t * 1.6);
      wireRef.current.opacity = 0.45;
    } else if (modelStatus === 'ready' && !isStreaming) {
      matRef.current.opacity = 0.55 + 0.05 * Math.sin(t * 0.8);
      wireRef.current.opacity = 0.55;
    } else if (isStreaming) {
      // Faster pulse while streaming tokens.
      matRef.current.opacity = 0.85 + 0.1 * Math.sin(t * 5);
      wireRef.current.opacity = 0.75;
    } else {
      matRef.current.opacity = 0.15;
      wireRef.current.opacity = 0.2;
    }
  });

  return (
    <group position={[0, 1.2, 0.05]}>
      {/* Wireframe outer brain */}
      <mesh>
        <sphereGeometry args={[0.5, 24, 16]} />
        <meshBasicMaterial ref={wireRef} color={LAB1_HEX} wireframe transparent opacity={0.4} />
      </mesh>
      {/* Solid inner core */}
      <mesh>
        <sphereGeometry args={[0.4, 24, 24]} />
        <meshBasicMaterial ref={matRef} color={LAB1_SOFT} transparent opacity={0.4} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─── 8 MoE expert lobes ──────────────────────────────────────────

function MoELobes() {
  const activeExperts = usePocketBrainStore((s) => s.activeExperts);
  const isStreaming = usePocketBrainStore((s) => s.isStreaming);
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // Idle slow rotation around y so the lobes feel alive even when not lit.
    groupRef.current.rotation.y = clock.elapsedTime * 0.18;
    // Per-lobe pulse: active ones brighter, inactive dim.
    groupRef.current.children.forEach((c, i) => {
      const isActive = activeExperts.includes(i);
      // Each lobe is a group with a sphere mesh; reach into the material.
      type LobeMesh = THREE_Mesh & { material?: MeshBasicMaterial };
      const childGroup = c as Group;
      const mesh = childGroup.children[0] as LobeMesh;
      if (mesh && mesh.material) {
        const target = isActive
          ? (isStreaming ? 0.95 + 0.08 * Math.sin(clock.elapsedTime * 6 + i) : 0.75)
          : 0.2;
        mesh.material.opacity = target;
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 1.2, 0.05]}>
      {LOBE_POSITIONS.map((pos, i) => {
        const accent = LOBE_ACCENTS[i];
        return (
          <group key={i} position={pos}>
            <mesh>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshBasicMaterial color={accent} transparent opacity={0.4} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// Local Three.Mesh shape declaration (avoids importing the Mesh type
// just for this narrow use).
type THREE_Mesh = { material?: MeshBasicMaterial };

// ─── Token pellet stream ─────────────────────────────────────────

function TokenPellets() {
  const ref = useRef<InstancedMesh>(null);
  const isStreaming = usePocketBrainStore((s) => s.isStreaming);
  const tokensPerSec = usePocketBrainStore((s) => s.tokensPerSec);
  const COUNT = 60;
  const dummy = useMemo(() => new Object3D(), []);

  // Each pellet has a per-pellet phase + base radius around the brain.
  const pellets = useMemo(
    () => Array.from({ length: COUNT }, (_, i) => ({
      phase: (i / COUNT) * Math.PI * 2,
      radius: 0.55,
      yBase: 1.2,
    })),
    [],
  );

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    // Pellet visibility scales with isStreaming + tokensPerSec.
    // When idle, render all at zero scale.
    const speedFactor = isStreaming ? Math.min(2, tokensPerSec / 8) : 0;
    for (let i = 0; i < COUNT; i++) {
      const p = pellets[i];
      // Pellet leaves the brain in a radial direction, fading out.
      const cycleProgress = ((t * (0.5 + speedFactor * 0.5)) + p.phase) % 1;
      const r = p.radius + cycleProgress * 1.6; // travels 1.6 units
      const angle = p.phase * 1.7;
      dummy.position.set(
        Math.cos(angle) * r,
        p.yBase + Math.sin(t * 0.5 + p.phase) * 0.05,
        Math.sin(angle) * r + 0.05,
      );
      // Fade scale: peak in middle, zero at start/end.
      const s = speedFactor === 0
        ? 0
        : 0.04 * Math.sin(cycleProgress * Math.PI);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={LAB1_HEX} transparent opacity={0.85} />
    </instancedMesh>
  );
}

// ─── Active-expert beam (visual highlight to the lobe locations) ─

function ActiveExpertBeams() {
  const activeExperts = usePocketBrainStore((s) => s.activeExperts);
  const isStreaming = usePocketBrainStore((s) => s.isStreaming);

  if (!isStreaming || activeExperts.length === 0) return null;

  return (
    <group position={[0, 1.2, 0.05]}>
      {activeExperts.map((i) => {
        const pos = LOBE_POSITIONS[i];
        const accent = LOBE_ACCENTS[i] ?? LAB1_HEX;
        const dir = new Vector3(pos[0], pos[1], pos[2]);
        const len = dir.length();
        const mid = dir.multiplyScalar(0.5);
        return (
          <group key={i} position={[mid.x, mid.y, mid.z]}>
            <mesh>
              <cylinderGeometry args={[0.012, 0.012, len, 6]} />
              <meshBasicMaterial color={accent} transparent opacity={0.6} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ─── Top-level scene component ───────────────────────────────────

export default function PocketBrain3D() {
  return (
    <group>
      <BrainCore />
      <MoELobes />
      <ActiveExpertBeams />
      <TokenPellets />
    </group>
  );
}
