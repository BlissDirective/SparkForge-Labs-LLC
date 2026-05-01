'use client';

// ════════════════════════════════════════════════════════════════
// AgentAtelier3D — Stage 11D dynamic scene content
// ════════════════════════════════════════════════════════════════
// Lab 11 | Color: #6FFFE6 (Mint-Cyan)
//
// Renders the player's wired team and the trace beams between them.
// Sits inside the AgentAtelierEnvironment.
//
// What this component owns:
//   • Specialist holograms — one per PlacedAgent in the store
//   • Wire tubes — one per Wire, color-tinted by source agent
//   • Trace packets — animated beads travel along wires during the
//     'simulate' phase, scrubbing the trajectory
//   • Selection / hover affordance
//   • Drag-target legal-port pulse during wire creation
//
// Reads team + wires + phase + dragSource from useAgentAtelierStore.
// ════════════════════════════════════════════════════════════════

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  TubeGeometry,
  Vector3,
} from 'three';

import { useAgentAtelierStore } from '@/stores/agentAtelierStore';
import { getAgent } from '@/lib/agentatelier/agentRoster';
import type { PlacedAgent, Wire } from '@/types/agentAtelier';

const LAB11_HEX = '#6FFFE6';

// ─── Coords mapping (logical 2D -> world XZ) ─────────────────────

const STAGE_RADIUS = 2.6;

function logicalToWorld(p: [number, number]): [number, number, number] {
  // Logical (-1..1) -> world XZ on the central composition stage.
  return [p[0] * STAGE_RADIUS, 0, p[1] * STAGE_RADIUS];
}

// ─── Specialist hologram (one per placed agent) ──────────────────

interface SpecialistFigureProps {
  placed: PlacedAgent;
  isSelected: boolean;
  isDragSource: boolean;
}

function SpecialistFigure({ placed, isSelected, isDragSource }: SpecialistFigureProps) {
  const spec = getAgent(placed.agentId);
  const groupRef = useRef<Group>(null);
  const ringRef = useRef<MeshBasicMaterial>(null);
  const coreRef = useRef<MeshBasicMaterial>(null);
  const accent = useMemo(() => new Color(spec?.accentHex ?? LAB11_HEX), [spec?.accentHex]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // Gentle hover bob.
    groupRef.current.position.y = 0.5 + 0.04 * Math.sin(clock.elapsedTime * 1.4);
    // Selection pulse.
    if (ringRef.current) {
      const target = isSelected ? 1.0 : isDragSource ? 0.85 : 0.55;
      const blink = isDragSource ? 0.25 * Math.sin(clock.elapsedTime * 4) : 0;
      ringRef.current.opacity = target + blink;
    }
    // Core glow.
    if (coreRef.current) {
      coreRef.current.opacity = 0.85 + 0.1 * Math.sin(clock.elapsedTime * 2.4);
    }
  });

  if (!spec) return null;
  const [x, y, z] = logicalToWorld(placed.position);

  return (
    <group ref={groupRef} position={[x, y + 0.5, z]}>
      {/* Plinth */}
      <mesh position={[0, -0.55, 0]} receiveShadow>
        <cylinderGeometry args={[0.32, 0.4, 0.18, 12]} />
        <meshStandardMaterial color="#152A2E" metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Accent rim */}
      <mesh position={[0, -0.46, 0]}>
        <torusGeometry args={[0.36, 0.02, 12, 32]} />
        <meshBasicMaterial ref={ringRef} color={accent} transparent opacity={0.55} />
      </mesh>
      {/* Hologram core */}
      <mesh>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshBasicMaterial ref={coreRef} color={accent} transparent opacity={0.9} />
      </mesh>
      {/* Outer halo */}
      <mesh>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshBasicMaterial color={accent} transparent opacity={0.18} side={DoubleSide} />
      </mesh>
      {/* Floating role disc above the core (read by the UI overlay) */}
      <mesh position={[0, 0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.22, 24]} />
        <meshBasicMaterial color={accent} side={DoubleSide} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

// ─── Wire tube (between two placed agents) ──────────────────────

interface WireBeamProps {
  wire: Wire;
  team: PlacedAgent[];
  index: number;
  /** True during 'simulate' phase. */
  flowing: boolean;
}

function WireBeam({ wire, team, index, flowing }: WireBeamProps) {
  const fromPlaced = team.find((p) => p.agentId === wire.fromAgentId);
  const toPlaced = team.find((p) => p.agentId === wire.toAgentId);
  const fromSpec = fromPlaced ? getAgent(fromPlaced.agentId) : null;

  // Curve sampling — 32 segments along a Catmull-Rom curve with a
  // gentle sag for visual elegance.
  const { tubeGeo, curve, accent } = useMemo(() => {
    if (!fromPlaced || !toPlaced) {
      return { tubeGeo: null, curve: null, accent: new Color(LAB11_HEX) };
    }
    const a = logicalToWorld(fromPlaced.position);
    const b = logicalToWorld(toPlaced.position);
    const mid: [number, number, number] = [
      (a[0] + b[0]) / 2,
      0.9 + 0.2 * Math.abs(b[0] - a[0]),
      (a[2] + b[2]) / 2,
    ];
    const c = new CatmullRomCurve3([
      new Vector3(a[0], a[1] + 0.5, a[2]),
      new Vector3(mid[0], mid[1], mid[2]),
      new Vector3(b[0], b[1] + 0.5, b[2]),
    ]);
    const geo = new TubeGeometry(c, 32, 0.03, 8, false);
    return {
      tubeGeo: geo,
      curve: c,
      accent: new Color(fromSpec?.accentHex ?? LAB11_HEX),
    };
  }, [fromPlaced, toPlaced, fromSpec?.accentHex]);

  const packetRef = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!flowing || !packetRef.current || !curve) return;
    // Each wire's packet runs offset by `index * 0.15` so they don't
    // pulse in lockstep when many wires fire simultaneously.
    const t = (clock.elapsedTime * 0.6 + index * 0.15) % 1;
    const point = curve.getPointAt(t);
    packetRef.current.position.copy(point);
  });

  if (!tubeGeo || !fromPlaced || !toPlaced) return null;

  return (
    <group>
      {/* Tube */}
      <mesh geometry={tubeGeo}>
        <meshBasicMaterial color={accent} transparent opacity={flowing ? 0.85 : 0.45} />
      </mesh>
      {/* Trace packet (only animated when flowing) */}
      {flowing && (
        <mesh ref={packetRef}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshBasicMaterial color={accent} />
        </mesh>
      )}
    </group>
  );
}

// ─── Drag-source pulse (visual hint of legal targets) ────────────

function DragSourcePulse() {
  const dragSource = useAgentAtelierStore((s) => s.dragSource);
  const team = useAgentAtelierStore((s) => s.team);
  const ref = useRef<MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.opacity = 0.35 + 0.25 * Math.sin(clock.elapsedTime * 3);
  });

  if (!dragSource) return null;
  const fromPlaced = team.find((p) => p.agentId === dragSource.agentId);
  if (!fromPlaced) return null;
  const [x, , z] = logicalToWorld(fromPlaced.position);

  return (
    <mesh position={[x, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.55, 0.62, 32]} />
      <meshBasicMaterial ref={ref} color={LAB11_HEX} side={DoubleSide} transparent opacity={0.5} />
    </mesh>
  );
}

// ─── Top-level scene component ───────────────────────────────────

interface AgentAtelier3DProps {
  selectedAgentId?: string | null;
}

export default function AgentAtelier3D({ selectedAgentId = null }: AgentAtelier3DProps) {
  const team = useAgentAtelierStore((s) => s.team);
  const wires = useAgentAtelierStore((s) => s.wires);
  const phase = useAgentAtelierStore((s) => s.phase);
  const dragSource = useAgentAtelierStore((s) => s.dragSource);
  const flowing = phase === 'simulate';

  return (
    <group>
      {team.map((p) => (
        <SpecialistFigure
          key={p.agentId}
          placed={p}
          isSelected={selectedAgentId === p.agentId}
          isDragSource={dragSource?.agentId === p.agentId}
        />
      ))}
      {wires.map((w, i) => (
        <WireBeam key={i} wire={w} team={team} index={i} flowing={flowing} />
      ))}
      <DragSourcePulse />
    </group>
  );
}
