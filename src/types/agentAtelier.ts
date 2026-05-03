// src/types/agentAtelier.ts
// ================================================================
// Stage 11D — Agent Atelier (C1, Lab 11 opener)
// ================================================================
// Shared types for Stage 11D's 12-specialist roster, missions, wire
// graph, trajectories, and persistent compositions.
//
// These types are also consumed by:
//   • Stage 11F (Glass Box Lab) — replays saved compositions as
//     trajectories for grading
//   • Stage 11G (Harness Forge)  — audit-replays compositions to
//     identify hook gaps
//
// Schema notes for the JSONB columns of `agent_compositions` (see
// supabase/migrations/20260501000001_create_agent_compositions.sql):
//   • team   = PlacedAgent[]
//   • wires  = Wire[]
// Both shapes are STABLE as of April 30, 2026; future additions must
// be additive (new optional fields) per Doc 2 §K.4.

import type { AgeBand } from '@/config/gameRegistry';

// ─── Port shape (kid-friendly schema) ────────────────────────────

/** Data shape that an agent's input/output port carries.
 *  Used by `wireGraph.canConnect` to enforce type compatibility. */
export type PortType = 'text' | 'list' | 'number' | 'plan' | 'code' | 'tool_request';

export interface Port {
  name: string;
  type: PortType;
}

// ─── Specialist roster ───────────────────────────────────────────

/** Age-band gate at which a specialist becomes available. */
export type UnlockTier = AgeBand;

export interface AgentSpec {
  id: string;
  name: string;
  /** ≤ 32-char human role label. */
  role: string;
  unlockTier: UnlockTier;
  inputs: Port[];
  outputs: Port[];
  /** HEX accent color used to tint the 3D figure + trace packets. */
  accentHex: string;
  /** ≤ 80-char one-liner shown on hover. */
  blurb: string;
}

// ─── Missions ────────────────────────────────────────────────────

export type MissionDifficulty = 'easy' | 'medium' | 'hard';

export interface RubricCriterion {
  /** ≤ 80-char human-readable criterion. */
  criterion: string;
  /** Weight 0..1; the rubric's weights need not sum to 1 (renormalized at score time). */
  weight: number;
}

export interface Mission {
  id: string;
  title: string;
  /** Mission-card body shown to the player. */
  prompt: string;
  difficulty: MissionDifficulty;
  band: AgeBand[];
  /** Required output port type from the terminal agent in the wired team. */
  expectedOutput: PortType;
  /** Hand-built rubric used by `missionRunner.grade` to score attempts. */
  rubric: RubricCriterion[];
  /** Suggested minimum agent count to unlock 3-star grade. */
  parAgentCount: number;
}

export interface MissionGrade {
  /** Total score 0..1. */
  total: number;
  /** Star rating 0..3 (computed from total + parAgentCount bonus). */
  stars: 0 | 1 | 2 | 3;
  /** Per-criterion match score. */
  perCriterion: { criterion: string; matched: number }[];
  /** Agent that contributed most to the score. */
  mvp: string | null;
  /** Time taken in ms (for time-bonus). */
  timeMs: number;
}

// ─── Placed team + wire graph (the persistent shape) ─────────────

export interface PlacedAgent {
  /** Foreign key into AGENT_ROSTER. */
  agentId: string;
  /** Logical 2D atelier position (x, y) in -1..1 normalized coords. */
  position: [number, number];
}

export interface Wire {
  fromAgentId: string;
  fromOutputName: string;
  toAgentId: string;
  toInputName: string;
}

/** Persistent shape (matches `agent_compositions` JSONB columns). */
export interface AgentComposition {
  /** Set on save (gen_random_uuid()). */
  id: string;
  childId: string;
  name: string;
  team: PlacedAgent[];
  wires: Wire[];
  /** ISO timestamp. */
  createdAt: string;
}

// ─── Mission trajectory (per-step trace for `simulate` phase) ────

export interface TrajectoryStep {
  step: number;
  agentId: string;
  /** Snapshot of agent inputs at this step. */
  inputs: Record<string, unknown>;
  /** Snapshot of agent outputs at this step. */
  outputs: Record<string, unknown>;
  /** Time spent on this step in ms. */
  durationMs: number;
  /** ≤ 200-char human-readable summary of what the agent did. */
  summary: string;
}

// ─── Wire-graph errors ───────────────────────────────────────────

export type WireGraphError =
  | { kind: 'port-type-mismatch'; from: Port; to: Port }
  | { kind: 'cycle-detected'; involvedAgentIds: string[] }
  | { kind: 'duplicate-wire' }
  | { kind: 'self-wire' }
  | { kind: 'unknown-port'; agentId: string; portName: string };
