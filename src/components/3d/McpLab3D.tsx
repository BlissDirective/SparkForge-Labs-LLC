'use client';

// ════════════════════════════════════════════════════════════════
// McpLab3D — Stage 11E dynamic scene content
// ════════════════════════════════════════════════════════════════
// Lab 11 | Color: #6FFFE6 (Mint-Cyan)
// Renders the player's team + bound tools + connection beams.
//
// What this component owns:
//   • Specialist holograms — same procedural figure as Stage 11D
//   • Tool tokens — floating disc above each bound agent's input port
//   • Wire tubes — between agents (read-only carryover from Atelier
//     save's wires when loadFromSave was used)
//   • Tool beams — connection from a virtual "wall plinth" position
//     down to the agent's bound input port
//
// Reads team + wires + bindings from useMcpLabStore.
// ════════════════════════════════════════════════════════════════

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Group,
  MeshBasicMaterial,
  TubeGeometry,
  Vector3,
} from 'three';

import { useMcpLabStore } from '@/stores/mcpLabStore';
import { getAgent } from '@/lib/agentatelier/agentRoster';
import { getTool } from '@/lib/mcplab/toolCatalog';
import type { PlacedAgent, Wire } from '@/types/agentAtelier';
import type { ToolBinding } from '@/types/mcplab';

const LAB11_HEX = '#6FFFE6';

// ─── Coords mapping (logical 2D -> world XZ) ─────────────────────

const STAGE_RADIUS = 2.4;

function logicalToWorld(p: [number, number]): [number, number, number] {
  return [p[0] * STAGE_RADIUS, 0, p[1] * STAGE_RADIUS];
}

// ─── Specialist hologram (carries over from Stage 11D pattern) ──

interface SpecialistFigureProps {
  placed: PlacedAgent;
  hasBindings: boolean;
}

function SpecialistFigure({ placed, hasBindings }: SpecialistFigureProps) {
  const spec = getAgent(placed.agentId);
  const groupRef = useRef<Group>(null);
  const ringRef = useRef<MeshBasicMaterial>(null);
  const accent = useMemo(() => new Color(spec?.accentHex ?? LAB11_HEX), [spec?.accentHex]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = 0.5 + 0.04 * Math.sin(clock.elapsedTime * 1.4);
    if (ringRef.current) {
      ringRef.current.opacity = hasBindings ? 0.85 + 0.1 * Math.sin(clock.elapsedTime * 2) : 0.45;
    }
  });

  if (!spec) return null;
  const [x, y, z] = logicalToWorld(placed.position);

  return (
    <group ref={groupRef} position={[x, y + 0.5, z]}>
      <mesh position={[0, -0.55, 0]} receiveShadow>
        <cylinderGeometry args={[0.32, 0.4, 0.18, 12]} />
        <meshStandardMaterial color="#152A2E" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, -0.46, 0]}>
        <torusGeometry args={[0.36, 0.02, 12, 32]} />
        <meshBasicMaterial ref={ringRef} color={accent} transparent opacity={0.55} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshBasicMaterial color={accent} transparent opacity={0.9} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshBasicMaterial color={accent} transparent opacity={0.18} side={DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── Tool token (disc floating over a bound agent input port) ────

interface ToolTokenProps {
  binding: ToolBinding;
  team: PlacedAgent[];
  /** Stable index for animation phase offset. */
  index: number;
}

function ToolToken({ binding, team, index }: ToolTokenProps) {
  const tool = getTool(binding.toolId);
  const placed = team.find((p) => p.agentId === binding.agentId);
  const accent = useMemo(() => new Color(tool?.accentHex ?? LAB11_HEX), [tool?.accentHex]);
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.elapsedTime * 0.4 + index * 0.4;
    groupRef.current.position.y = 1.55 + 0.06 * Math.sin(clock.elapsedTime * 1.2 + index);
  });

  if (!tool || !placed) return null;
  const [x, , z] = logicalToWorld(placed.position);

  return (
    <group ref={groupRef} position={[x, 1.55, z]}>
      {/* Disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.04, 24]} />
        <meshBasicMaterial color={accent} transparent opacity={0.85} />
      </mesh>
      {/* Outer halo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.22, 24]} />
        <meshBasicMaterial color={accent} transparent opacity={0.4} side={DoubleSide} />
      </mesh>
      {/* Vertical pulse to anchor visually to the agent below */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 1.0, 6]} />
        <meshBasicMaterial color={accent} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// ─── Wire tubes (carryover from Stage 11D save) ──────────────────

interface WireBeamProps {
  wire: Wire;
  team: PlacedAgent[];
}

function WireBeam({ wire, team }: WireBeamProps) {
  const fromPlaced = team.find((p) => p.agentId === wire.fromAgentId);
  const toPlaced = team.find((p) => p.agentId === wire.toAgentId);
  const fromSpec = fromPlaced ? getAgent(fromPlaced.agentId) : null;

  const { tubeGeo, accent } = useMemo(() => {
    if (!fromPlaced || !toPlaced) {
      return { tubeGeo: null, accent: new Color(LAB11_HEX) };
    }
    const a = logicalToWorld(fromPlaced.position);
    const b = logicalToWorld(toPlaced.position);
    const mid: [number, number, number] = [
      (a[0] + b[0]) / 2,
      0.85 + 0.15 * Math.abs(b[0] - a[0]),
      (a[2] + b[2]) / 2,
    ];
    const c = new CatmullRomCurve3([
      new Vector3(a[0], a[1] + 0.5, a[2]),
      new Vector3(mid[0], mid[1], mid[2]),
      new Vector3(b[0], b[1] + 0.5, b[2]),
    ]);
    const geo = new TubeGeometry(c, 24, 0.025, 8, false);
    return { tubeGeo: geo, accent: new Color(fromSpec?.accentHex ?? LAB11_HEX) };
  }, [fromPlaced, toPlaced, fromSpec?.accentHex]);

  if (!tubeGeo || !fromPlaced || !toPlaced) return null;

  return (
    <mesh geometry={tubeGeo}>
      <meshBasicMaterial color={accent} transparent opacity={0.5} />
    </mesh>
  );
}

// ─── Tool beam (from "wall" down to bound agent input) ───────────

interface ToolBeamProps {
  binding: ToolBinding;
  team: PlacedAgent[];
  /** Stable index → maps to a wall-slot position so beams don't all
   *  originate at the same point. */
  index: number;
}

function ToolBeam({ binding, team, index }: ToolBeamProps) {
  const tool = getTool(binding.toolId);
  const placed = team.find((p) => p.agentId === binding.agentId);

  const { tubeGeo, accent } = useMemo(() => {
    if (!tool || !placed) return { tubeGeo: null, accent: new Color(LAB11_HEX) };

    // Wall-slot position: 14 slots around the back hemisphere (matches
    // the McpLabEnvironment ToolRackWall layout).
    const SLOTS = 14;
    const RADIUS = 8.5;
    const ARC_DEG = 100;
    const t = (index % SLOTS) / Math.max(1, SLOTS - 1);
    const start = -((ARC_DEG / 2) * Math.PI) / 180 - Math.PI;
    const span = (ARC_DEG * Math.PI) / 180;
    const angle = start + t * span;
    const wallPos: [number, number, number] = [
      Math.cos(angle) * RADIUS,
      1.4 + (index % 2) * 1.0,
      Math.sin(angle) * RADIUS,
    ];

    const target = logicalToWorld(placed.position);
    const mid: [number, number, number] = [
      (wallPos[0] + target[0]) / 2,
      Math.max(wallPos[1], 1.55) + 0.5,
      (wallPos[2] + target[2]) / 2,
    ];
    const curve = new CatmullRomCurve3([
      new Vector3(wallPos[0], wallPos[1], wallPos[2]),
      new Vector3(mid[0], mid[1], mid[2]),
      new Vector3(target[0], 1.55, target[2]),
    ]);
    const geo = new TubeGeometry(curve, 24, 0.018, 6, false);
    return { tubeGeo: geo, accent: new Color(tool.accentHex) };
  }, [tool, placed, index]);

  if (!tubeGeo || !tool || !placed) return null;

  return (
    <mesh geometry={tubeGeo}>
      <meshBasicMaterial color={accent} transparent opacity={0.45} />
    </mesh>
  );
}

// ─── Top-level scene component ───────────────────────────────────

export default function McpLab3D() {
  const team = useMcpLabStore((s) => s.team);
  const wires = useMcpLabStore((s) => s.wires);
  const bindings = useMcpLabStore((s) => s.bindings);

  // Per-agent has-bindings lookup.
  const agentHasBindings = useMemo(() => {
    const set = new Set(bindings.map((b) => b.agentId));
    return (id: string) => set.has(id);
  }, [bindings]);

  return (
    <group>
      {team.map((p) => (
        <SpecialistFigure
          key={p.agentId}
          placed={p}
          hasBindings={agentHasBindings(p.agentId)}
        />
      ))}
      {wires.map((w, i) => (
        <WireBeam key={i} wire={w} team={team} />
      ))}
      {bindings.map((b, i) => (
        <React.Fragment key={`${b.agentId}-${b.inputName}-${b.toolId}-${i}`}>
          <ToolBeam binding={b} team={team} index={i} />
          <ToolToken binding={b} team={team} index={i} />
        </React.Fragment>
      ))}
    </group>
  );
}
