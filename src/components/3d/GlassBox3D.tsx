'use client';

// ════════════════════════════════════════════════════════════════
// GlassBox3D — Stage 11F dynamic scene content
// ════════════════════════════════════════════════════════════════
// Lab 11 | Color: #6FFFE6 (Mint-Cyan)
//
// Renders the saved composition's team as TRANSPARENT, glass-like
// figures (visual metaphor for "glass box" auditing - you can see
// inside) and the current trajectory step's beams flowing between
// agents. The active step's agent gets a brighter halo and a
// floating data packet showing the step number.
//
// Reads from useGlassBoxStore: steps, scrubIndex, inspectAgentId.
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

import { useGlassBoxStore } from '@/stores/glassBoxStore';
import { getAgent } from '@/lib/agentatelier/agentRoster';
import type { PlacedAgent, Wire } from '@/types/agentAtelier';

const LAB11_HEX = '#6FFFE6';
const STAGE_RADIUS = 2.0;

function logicalToWorld(p: [number, number]): [number, number, number] {
  return [p[0] * STAGE_RADIUS, 0, p[1] * STAGE_RADIUS];
}

// ─── Transparent specialist hologram ─────────────────────────────

interface SpecialistFigureProps {
  placed: PlacedAgent;
  isActive: boolean;
  isInspected: boolean;
  isPast: boolean;
}

function SpecialistFigure({ placed, isActive, isInspected, isPast }: SpecialistFigureProps) {
  const spec = getAgent(placed.agentId);
  const groupRef = useRef<Group>(null);
  const innerRef = useRef<MeshBasicMaterial>(null);
  const haloRef = useRef<MeshBasicMaterial>(null);
  const accent = useMemo(() => new Color(spec?.accentHex ?? LAB11_HEX), [spec?.accentHex]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = 0.5 + 0.04 * Math.sin(clock.elapsedTime * 1.2);
    if (innerRef.current) {
      // Active: pulsing strong; past: dim glow; future (default): soft.
      const target = isActive ? 0.95 : isPast ? 0.55 : 0.35;
      const blink = isActive ? 0.15 * Math.sin(clock.elapsedTime * 4) : 0;
      innerRef.current.opacity = target + blink;
    }
    if (haloRef.current) {
      haloRef.current.opacity =
        isInspected ? 0.45 : isActive ? 0.28 : 0.12;
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
      {/* Wireframe inner sphere — see-through "glass box" effect */}
      <mesh>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshBasicMaterial color={accent} wireframe transparent opacity={0.7} />
      </mesh>
      {/* Faint glass-like fill */}
      <mesh>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshBasicMaterial ref={innerRef} color={accent} transparent opacity={0.4} depthWrite={false} />
      </mesh>
      {/* Outer halo (only meaningful when active or inspected) */}
      <mesh>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshBasicMaterial ref={haloRef} color={accent} transparent opacity={0.15} side={DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── Step indicator (floating glyph above the active agent) ──────

function StepIndicator({ placed, stepNumber }: { placed: PlacedAgent; stepNumber: number }) {
  const groupRef = useRef<Group>(null);
  const matRef = useRef<MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.elapsedTime * 0.6;
    }
    if (matRef.current) {
      matRef.current.opacity = 0.7 + 0.2 * Math.sin(clock.elapsedTime * 2.2);
    }
  });
  const [x, , z] = logicalToWorld(placed.position);
  return (
    <group ref={groupRef} position={[x, 1.5, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.24, 24]} />
        <meshBasicMaterial ref={matRef} color={LAB11_HEX} side={DoubleSide} transparent opacity={0.85} />
      </mesh>
      {/* Step number indicator: a small tinted bar count */}
      {Array.from({ length: Math.min(stepNumber, 8) }, (_, i) => (
        <mesh
          key={i}
          position={[(i - 4) * 0.06, 0.08, 0]}
        >
          <boxGeometry args={[0.04, 0.04, 0.04]} />
          <meshBasicMaterial color={LAB11_HEX} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Wire beam (agent-to-agent, dim when not in active step) ─────

interface WireBeamProps {
  wire: Wire;
  team: PlacedAgent[];
  active: boolean;
}

function WireBeam({ wire, team, active }: WireBeamProps) {
  const fromPlaced = team.find((p) => p.agentId === wire.fromAgentId);
  const toPlaced = team.find((p) => p.agentId === wire.toAgentId);
  const fromSpec = fromPlaced ? getAgent(fromPlaced.agentId) : null;

  const { tubeGeo, accent } = useMemo(() => {
    if (!fromPlaced || !toPlaced) return { tubeGeo: null, accent: new Color(LAB11_HEX) };
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
    const geo = new TubeGeometry(c, 24, 0.022, 8, false);
    return { tubeGeo: geo, accent: new Color(fromSpec?.accentHex ?? LAB11_HEX) };
  }, [fromPlaced, toPlaced, fromSpec?.accentHex]);

  const matRef = useRef<MeshBasicMaterial>(null);
  useFrame(() => {
    if (matRef.current) {
      matRef.current.opacity = active ? 0.85 : 0.3;
    }
  });

  if (!tubeGeo) return null;
  return (
    <mesh geometry={tubeGeo}>
      <meshBasicMaterial ref={matRef} color={accent} transparent opacity={0.3} />
    </mesh>
  );
}

// ─── Top-level scene component ───────────────────────────────────

export default function GlassBox3D() {
  const steps = useGlassBoxStore((s) => s.steps);
  const scrubIndex = useGlassBoxStore((s) => s.scrubIndex);
  const inspectAgentId = useGlassBoxStore((s) => s.inspectAgentId);
  const savesCache = useGlassBoxStore((s) => s.savesCache);
  const currentSourceId = useGlassBoxStore((s) => s.currentSourceId);

  // Stable references for team + wires so downstream useMemo deps don't churn.
  const composition = currentSourceId ? savesCache[currentSourceId]?.comp : null;
  const team = useMemo(() => composition?.team ?? [], [composition]);
  const wires = useMemo(() => composition?.wires ?? [], [composition]);

  const activeStep = steps[scrubIndex];
  const activeAgentId = activeStep?.base.agentId;
  const pastAgentIds = useMemo(
    () => new Set(steps.slice(0, scrubIndex).map((s) => s.base.agentId)),
    [steps, scrubIndex],
  );

  // Active wires: those whose toAgentId is the current step's agent
  // (data flowing INTO the active step) — the audit-replay metaphor.
  const activeWireIndices = useMemo(() => {
    if (!activeAgentId) return new Set<number>();
    const out = new Set<number>();
    wires.forEach((w, i) => {
      if (w.toAgentId === activeAgentId) out.add(i);
    });
    return out;
  }, [wires, activeAgentId]);

  return (
    <group>
      {team.map((p) => (
        <SpecialistFigure
          key={p.agentId}
          placed={p}
          isActive={activeAgentId === p.agentId}
          isInspected={inspectAgentId === p.agentId}
          isPast={pastAgentIds.has(p.agentId)}
        />
      ))}
      {wires.map((w, i) => (
        <WireBeam key={i} wire={w} team={team} active={activeWireIndices.has(i)} />
      ))}
      {activeStep && (() => {
        const placed = team.find((p) => p.agentId === activeAgentId);
        if (!placed) return null;
        return <StepIndicator placed={placed} stepNumber={activeStep.base.step} />;
      })()}
    </group>
  );
}
