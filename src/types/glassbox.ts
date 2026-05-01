// src/types/glassbox.ts
// ════════════════════════════════════════════════════════════════
// Stage 11F — Glass Box Lab (C2, Lab 11 — Audit step)
// ════════════════════════════════════════════════════════════════
// Shared types for replay trajectories, issue detections, and
// session-only audit reports. STATELESS: no Supabase schema. The
// kid's annotations and report live entirely in the Zustand store
// per session.
//
// Replay source: a saved AgentComposition (Stage 11D save) — when
// the save has populated tool_bindings (Stage 11E), the audit also
// inspects tool usage step-by-step.
// ════════════════════════════════════════════════════════════════

import type { TrajectoryStep } from '@/types/agentAtelier';

// ─── Issue categories ────────────────────────────────────────────

/** Kid-readable categories the auditor (and the player) can tag. */
export type IssueCategory =
  | 'missing-input'        // an agent ran without a wired input
  | 'unused-output'        // an agent's output went nowhere
  | 'tool-misuse'          // an attached tool wasn't actually used (or used wrong type)
  | 'redundant-step'       // two agents produced the same thing
  | 'forbidden-tool'       // a forbidden tool was attached (carryover from Stage 11E)
  | 'no-critic'            // a "critic" agent absent from a multi-step team
  | 'short-loop';          // suspiciously short trajectory for the mission

export interface IssueCategoryMeta {
  label: string;
  emoji: string;
  /** HEX accent color for the category badge. */
  color: string;
  /** ≤ 90-char hint shown to the player on hover. */
  hint: string;
  /** Severity 1..3 (UI sorts critical issues to the top). */
  severity: 1 | 2 | 3;
}

// ─── Replay step augmentation ────────────────────────────────────

/** A single replay step augmented with auditor-detected issues and
 *  optional player-applied annotations. */
export interface AuditStep {
  /** The base trajectory step from missionRunner.simulate. */
  base: TrajectoryStep;
  /** Auditor-detected issues for this step (read-only, computed). */
  detected: IssueCategory[];
  /** Player-applied annotations for this step. */
  playerTags: IssueCategory[];
  /** Optional ≤ 200-char free-text note. */
  playerNote?: string;
}

// ─── Audit report ────────────────────────────────────────────────

export interface AuditSummary {
  /** Total steps in the trajectory. */
  totalSteps: number;
  /** Number of steps that ANY auditor issue flagged. */
  flaggedSteps: number;
  /** Per-category counts of detected issues across the whole trajectory. */
  detectedByCategory: Record<IssueCategory, number>;
  /** Per-category counts of player-tagged issues across the whole trajectory. */
  taggedByCategory: Record<IssueCategory, number>;
  /** Did the player find ANY issue the auditor also detected (true positive)? */
  truePositiveCount: number;
  /** Issues the player tagged that the auditor didn't detect (over-flag). */
  overTagCount: number;
  /** Issues the auditor detected that the player missed (under-flag). */
  underTagCount: number;
  /** Audit "accuracy" 0..1 — heuristic for the grade UI. */
  accuracy: number;
  /** Star rating 0..3 derived from accuracy + coverage. */
  stars: 0 | 1 | 2 | 3;
}

// ─── Replay-source pointer ───────────────────────────────────────

/** Pointer into a saved composition the player picked for replay. */
export interface ReplaySource {
  /** agent_compositions.id */
  compositionId: string;
  /** display name. */
  name: string;
  /** Stage source — 'atelier' (Stage 11D save) or 'mcp' (11E save with bindings). */
  origin: 'atelier' | 'mcp';
  /** ISO timestamp. */
  createdAt: string;
}

// ─── Auditor errors ──────────────────────────────────────────────

export type AuditorError =
  | { kind: 'no-team'; }
  | { kind: 'cycle-in-team'; involvedAgentIds: string[] }
  | { kind: 'composition-not-found'; compositionId: string };
