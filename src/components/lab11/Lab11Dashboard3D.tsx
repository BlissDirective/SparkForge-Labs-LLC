'use client';

// ════════════════════════════════════════════════════════════════
// Lab11Dashboard3D — Holographic projector pedestal scene
// ════════════════════════════════════════════════════════════════
// Stage 11A — Lab 11 Holographic Dashboard
//
// The visual centerpiece of the dashboard: a Mint-Cyan holographic
// projector pedestal at the center of the canvas with a slowly-
// rotating "agent constellation" floating above it. Each placed-
// specialist on the player's saves gets a tinted point in the
// constellation; node size correlates to placement frequency.
//
// Self-contained Three.js scene — drops into a <Canvas> in the
// parent dashboard component. ~800K tris desktop budget.
// ════════════════════════════════════════════════════════════════

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  DoubleSide,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
} from 'three';
import { AGENT_ROSTER } from '@/lib/agentatelier/agentRoster';
import type { AtelierStats } from '@/hooks/useAtelierStats';

const LAB11_HEX = '#6FFFE6';
const LAB11_SOFT = '#9FFFEF';
const LAB11_DEEP = '#0A4A47';

// ─── Holographic projector pedestal ──────────────────────────────

function ProjectorPedestal() {
  const ringRef = useRef<MeshBasicMaterial>(null);
  const beamRef = useRef<MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.opacity = 0.6 + 0.3 * Math.sin(clock.elapsedTime * 0.8);
    }
    if (beamRef.current) {
      beamRef.current.opacity = 0.18 + 0.07 * Math.sin(clock.elapsedTime * 0.6);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Heavy brushed-metal base */}
      <mesh receiveShadow position={[0, -0.3, 0]}>
        <cylinderGeometry args={[1.4, 1.6, 0.3, 24]} />
        <meshStandardMaterial color="#0E2226" metalness={0.95} roughness={0.18} />
      </mesh>
      {/* Mid-band Mint rim */}
      <mesh position={[0, -0.13, 0]}>
        <torusGeometry args={[1.5, 0.04, 16, 48]} />
        <meshBasicMaterial color={LAB11_HEX} />
      </mesh>
      {/* Lens disc */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.3, 48]} />
        <meshBasicMaterial color={LAB11_DEEP} side={DoubleSide} transparent opacity={0.7} />
      </mesh>
      {/* Pulsing inner ring */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.05, 1.12, 48]} />
        <meshBasicMaterial ref={ringRef} color={LAB11_HEX} side={DoubleSide} transparent opacity={0.7} />
      </mesh>
      {/* Volumetric beam (cone) */}
      <mesh position={[0, 1.6, 0]}>
        <coneGeometry args={[0.95, 3.2, 32, 1, true]} />
        <meshBasicMaterial
          ref={beamRef}
          color={LAB11_HEX}
          side={DoubleSide}
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Agent constellation ─────────────────────────────────────────
// One node per specialist. Node radius = 0.06 * (1 + placements / 4).

interface ConstellationProps {
  stats: AtelierStats;
}

function AgentConstellation({ stats }: ConstellationProps) {
  const groupRef = useRef<Group>(null);
  // Depend only on the slice we read so React Query refetches that
  // return a referentially-fresh `stats` object don't recompute the
  // 12-node layout when nothing material changed.
  const specialistFrequency = stats.specialistFrequency;

  // Pre-compute layout: 12 nodes on two stacked rings inside the beam.
  const nodes = useMemo(() => {
    const ring1 = AGENT_ROSTER.slice(0, 6);
    const ring2 = AGENT_ROSTER.slice(6);
    const r1 = 0.55;
    const r2 = 0.7;
    const y1 = 2.0;
    const y2 = 2.7;
    const placements = (id: string) =>
      specialistFrequency.find((f) => f.agentId === id)?.placements ?? 0;
    return [
      ...ring1.map((a, i) => {
        const t = i / ring1.length;
        const angle = t * Math.PI * 2;
        return {
          agentId: a.id,
          position: [Math.cos(angle) * r1, y1, Math.sin(angle) * r1] as [number, number, number],
          color: a.accentHex,
          placements: placements(a.id),
        };
      }),
      ...ring2.map((a, i) => {
        const t = i / ring2.length;
        const angle = t * Math.PI * 2 + Math.PI / 6;
        return {
          agentId: a.id,
          position: [Math.cos(angle) * r2, y2, Math.sin(angle) * r2] as [number, number, number],
          color: a.accentHex,
          placements: placements(a.id),
        };
      }),
    ];
  }, [specialistFrequency]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.elapsedTime * 0.18;
  });

  return (
    <group ref={groupRef}>
      {nodes.map((n, i) => {
        const baseR = 0.05;
        const r = baseR * (1 + Math.min(2, n.placements / 4));
        const opacity = n.placements > 0 ? 0.95 : 0.35;
        return (
          <group key={n.agentId} position={n.position}>
            <mesh>
              <sphereGeometry args={[r, 16, 16]} />
              <meshBasicMaterial color={n.color} transparent opacity={opacity} />
            </mesh>
            {n.placements > 0 && (
              <mesh>
                <sphereGeometry args={[r * 1.8, 16, 16]} />
                <meshBasicMaterial color={n.color} transparent opacity={0.18} side={DoubleSide} />
              </mesh>
            )}
            {/* Vertical tether down to lens (visual anchor) */}
            {i % 2 === 0 && (
              <mesh position={[0, -0.4, 0]}>
                <cylinderGeometry args={[0.005, 0.005, 0.8, 6]} />
                <meshBasicMaterial color={n.color} transparent opacity={0.25} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

// ─── Drifting Mint dust particles ────────────────────────────────

function DriftDust() {
  const ref = useRef<InstancedMesh>(null);
  const COUNT = 90;

  const data = useMemo(() => {
    return Array.from({ length: COUNT }, () => ({
      r: 0.6 + Math.random() * 1.6,
      yBase: 0.5 + Math.random() * 3.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.05 + Math.random() * 0.06,
    }));
  }, []);

  const dummy = useMemo(() => new Object3D(), []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      const d = data[i];
      const angle = d.phase + t * d.speed;
      dummy.position.set(
        Math.cos(angle) * d.r,
        d.yBase + Math.sin(t * 0.4 + d.phase) * 0.18,
        Math.sin(angle) * d.r,
      );
      const s = 0.018 + 0.012 * Math.sin(t * 1.2 + d.phase);
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

// ─── Lighting + scene ────────────────────────────────────────────

interface Lab11Dashboard3DProps {
  stats: AtelierStats;
}

export default function Lab11Dashboard3D({ stats }: Lab11Dashboard3DProps) {
  return (
    <group>
      <ambientLight intensity={0.25} />
      <pointLight color={LAB11_HEX} intensity={2.4} distance={8} decay={2} position={[0, 2.5, 0]} />
      <pointLight color="#FFFFFF" intensity={0.4} distance={5} decay={2} position={[3, 4, 3]} />
      <ProjectorPedestal />
      <AgentConstellation stats={stats} />
      <DriftDust />
    </group>
  );
}
