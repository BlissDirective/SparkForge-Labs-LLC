'use client';

// ════════════════════════════════════════════════════════════════
// HarnessForge3D — Stage 11G dynamic scene content
// ════════════════════════════════════════════════════════════════
// Lab 11 | Color: #6FFFE6 (Mint-Cyan) + per-layer accents
//
// Renders the loaded team WRAPPED in three concentric harness
// shells (filter, validator, monitor). Each shell pulses when ANY
// rule for that layer is enabled and brightens dramatically when
// stress test catches land.
//
// Reads from useHarnessForgeStore: currentSaveId, availableSaves,
// config, results, grade.
// ════════════════════════════════════════════════════════════════

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
} from 'three';

import { useHarnessForgeStore } from '@/stores/harnessForgeStore';
import { getAgent } from '@/lib/agentatelier/agentRoster';
import type { PlacedAgent } from '@/types/agentAtelier';

const STAGE_RADIUS = 1.4;

// Per-layer accent colors. Filter (innermost) = warm-orange (the
// "frontline" against bad inputs). Validator (middle) = mint. Monitor
// (outermost) = lavender.
const LAYER_COLORS: Record<'filter' | 'validator' | 'monitor', string> = {
  filter:    '#E68E28',
  validator: '#6FFFE6',
  monitor:   '#B67BFF',
};

// Per-layer radii (the visual ordering: filter tight around team,
// monitor furthest out).
const LAYER_RADII: Record<'filter' | 'validator' | 'monitor', number> = {
  filter:    2.0,
  validator: 3.0,
  monitor:   4.0,
};

function logicalToWorld(p: [number, number]): [number, number, number] {
  return [p[0] * STAGE_RADIUS, 0, p[1] * STAGE_RADIUS];
}

// ─── Specialist hologram (compact) ───────────────────────────────

function SpecialistFigure({ placed }: { placed: PlacedAgent }) {
  const spec = getAgent(placed.agentId);
  const groupRef = useRef<Group>(null);
  const accent = useMemo(() => new Color(spec?.accentHex ?? '#6FFFE6'), [spec?.accentHex]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = 0.5 + 0.04 * Math.sin(clock.elapsedTime * 1.4);
  });

  if (!spec) return null;
  const [x, y, z] = logicalToWorld(placed.position);

  return (
    <group ref={groupRef} position={[x, y + 0.5, z]}>
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.28, 0.34, 0.16, 12]} />
        <meshStandardMaterial color="#152A2E" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.24, 24, 24]} />
        <meshBasicMaterial color={accent} transparent opacity={0.85} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.36, 24, 24]} />
        <meshBasicMaterial color={accent} transparent opacity={0.18} side={DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── Harness shell (one of three concentric layers) ──────────────

interface HarnessShellProps {
  layer: 'filter' | 'validator' | 'monitor';
  /** Number of rules currently enabled in this layer. */
  activeRuleCount: number;
  /** Number of stress-test catches this layer has produced (after a run). */
  catchCount: number;
}

function HarnessShell({ layer, activeRuleCount, catchCount }: HarnessShellProps) {
  const matRef = useRef<MeshBasicMaterial>(null);
  const wireRef = useRef<MeshBasicMaterial>(null);
  const radius = LAYER_RADII[layer];
  const color = LAYER_COLORS[layer];

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    // Base opacity: 0 if no rules enabled, otherwise a soft baseline that
    // pulses harder when catches land.
    const baseOpacity = activeRuleCount === 0 ? 0 : 0.06 + 0.02 * activeRuleCount;
    const catchPulse = catchCount > 0 ? 0.06 + 0.04 * Math.sin(clock.elapsedTime * 3) : 0;
    matRef.current.opacity = baseOpacity + catchPulse;

    if (wireRef.current) {
      wireRef.current.opacity = activeRuleCount === 0 ? 0 : 0.35 + 0.06 * Math.sin(clock.elapsedTime * 1.4);
    }
  });

  // Skip rendering entirely if no rules are enabled — clean look.
  if (activeRuleCount === 0) return null;

  return (
    <group>
      {/* Wireframe sphere — the "structural" layer */}
      <mesh>
        <sphereGeometry args={[radius, 24, 16]} />
        <meshBasicMaterial ref={wireRef} color={color} wireframe transparent opacity={0.4} />
      </mesh>
      {/* Translucent fill — only visible when catches land */}
      <mesh>
        <sphereGeometry args={[radius, 24, 16]} />
        <meshBasicMaterial
          ref={matRef}
          color={color}
          side={DoubleSide}
          transparent
          opacity={0.06}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Top-level scene component ───────────────────────────────────

export default function HarnessForge3D() {
  const currentSaveId = useHarnessForgeStore((s) => s.currentSaveId);
  const availableSaves = useHarnessForgeStore((s) => s.availableSaves);
  const config = useHarnessForgeStore((s) => s.config);
  const results = useHarnessForgeStore((s) => s.results);

  const team: PlacedAgent[] = useMemo(() => {
    if (!currentSaveId) return [];
    const entry = availableSaves.find((e) => e.comp.id === currentSaveId);
    return entry?.comp.team ?? [];
  }, [currentSaveId, availableSaves]);

  // Per-layer enabled rule counts.
  const filterRules =
    (config.filter.stripPii ? 1 : 0) +
    (config.filter.blockProfanity ? 1 : 0) +
    (config.filter.lengthCap > 0 ? 1 : 0);
  const validatorRules =
    (config.validator.requireKeyword ? 1 : 0) +
    (config.validator.maxLength !== undefined ? 1 : 0) +
    (config.validator.requireCitations ? 1 : 0);
  const monitorRules =
    (config.monitor.loopLimit > 0 ? 1 : 0) +
    (config.monitor.dedupeOutputs ? 1 : 0);

  // Per-layer catch counts across all stress test results.
  const layerCatches = useMemo(() => {
    let f = 0, v = 0, m = 0;
    for (const r of Object.values(results)) {
      for (const c of r.catches) {
        if (c.layer === 'filter') f += 1;
        else if (c.layer === 'validator') v += 1;
        else if (c.layer === 'monitor') m += 1;
      }
    }
    return { filter: f, validator: v, monitor: m };
  }, [results]);

  return (
    <group>
      {team.map((p) => (
        <SpecialistFigure key={p.agentId} placed={p} />
      ))}
      <HarnessShell layer="filter" activeRuleCount={filterRules} catchCount={layerCatches.filter} />
      <HarnessShell layer="validator" activeRuleCount={validatorRules} catchCount={layerCatches.validator} />
      <HarnessShell layer="monitor" activeRuleCount={monitorRules} catchCount={layerCatches.monitor} />
    </group>
  );
}
