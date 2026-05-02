// src/lib/glassbox/auditEngine.ts
// ════════════════════════════════════════════════════════════════
// Stage 11F — Glass Box Lab
// ════════════════════════════════════════════════════════════════
// Reuses Stage 11D's missionRunner.simulate to produce a trajectory
// from a saved composition, then augments each step with auditor-
// detected issues. The detection pass is intentionally lightweight
// (heuristic, not AI) so the audit is deterministic and reproducible
// — kids learn to spot patterns they can articulate.
// ════════════════════════════════════════════════════════════════

import type { AgentComposition } from '@/types/agentAtelier';
import type { ToolBinding } from '@/types/mcplab';
import type {
  AuditStep,
  AuditorError,
  ReplaySource,
} from '@/types/glassbox';
import { detectCycle } from '@/lib/agentatelier/wireGraph';
import { simulate } from '@/lib/agentatelier/missionRunner';
import { HARDCODED_MISSIONS } from '@/lib/agentatelier/missionLibrary';
import { detectStepIssues } from './issueDetector';
import { getAgent } from '@/lib/agentatelier/agentRoster';
import { getTool } from '@/lib/mcplab/toolCatalog';

// ─── Replay source helpers ───────────────────────────────────────

/** Heuristically classify a saved composition as 'atelier' or 'mcp'.
 *  A comp with non-empty tool_bindings is an MCP save (Stage 11E). */
export function classifyOrigin(
  bindings: ToolBinding[] | null | undefined,
): ReplaySource['origin'] {
  return bindings && bindings.length > 0 ? 'mcp' : 'atelier';
}

/** Heuristically pick a mission template based on the composition's
 *  name. Falls back to the first hardcoded mission if no match. */
export function inferMissionForComposition(comp: AgentComposition) {
  const lower = comp.name.toLowerCase();
  const families = [
    'birthday-plan', 'fact-check', 'lunchbox', 'story-editor',
    'homework', 'travel-trio', 'pet-schedule', 'build-joke',
  ];
  for (const fam of families) {
    if (lower.includes(fam) || lower.includes(fam.split('-')[0])) {
      const match = HARDCODED_MISSIONS.find((m) => m.id.startsWith(fam + '-'));
      if (match) return match;
    }
  }
  // Default fallback: birthday-plan-easy.
  return HARDCODED_MISSIONS[0];
}

// ─── Audit replay ────────────────────────────────────────────────

interface AuditReplayInput {
  composition: AgentComposition;
  /** Tool bindings from the composition's tool_bindings JSONB column. */
  bindings: ToolBinding[];
}

interface AuditReplayOutput {
  steps: AuditStep[];
  /** Final artifact (passed through from missionRunner.simulate). */
  finalArtifact: string;
  /** Total trajectory wall-clock duration in ms. */
  totalMs: number;
  error: AuditorError | null;
}

/** Replay a saved composition and produce an augmented audit trajectory. */
export function auditReplay(input: AuditReplayInput): AuditReplayOutput {
  const { composition: comp, bindings } = input;

  if (comp.team.length === 0) {
    return { steps: [], finalArtifact: '', totalMs: 0, error: { kind: 'no-team' } };
  }

  // Defensive cycle check (saves should be cycle-free per Stage 11D wireGraph
  // validation, but never trust persisted state).
  const cycle = detectCycle(comp.team, comp.wires);
  if (cycle) {
    return {
      steps: [],
      finalArtifact: '',
      totalMs: 0,
      error: { kind: 'cycle-in-team', involvedAgentIds: cycle },
    };
  }

  // Pick an inferred mission template — needed because missionRunner's
  // simulate signature requires one and the saved composition doesn't
  // carry its source mission id.
  const mission = inferMissionForComposition(comp);

  const sim = simulate({ team: comp.team, wires: comp.wires, mission });
  if (sim.error) {
    return {
      steps: [],
      finalArtifact: '',
      totalMs: 0,
      // Re-classify simulator runtime errors that we don't surface as a
      // dedicated AuditorError shape — fall back to no-team if the
      // simulator returned no terminal agent.
      error: { kind: 'no-team' },
    };
  }

  // Augment each step with auditor-detected issues.
  const steps: AuditStep[] = sim.trajectory.map((step) => {
    const detected = detectStepIssues({
      step,
      composition: comp,
      bindings,
      mission,
      allSteps: sim.trajectory,
    });
    return {
      base: step,
      detected,
      playerTags: [],
      playerNote: undefined,
    };
  });

  return {
    steps,
    finalArtifact: sim.finalArtifact,
    totalMs: sim.totalMs,
    error: null,
  };
}

// ─── Composition summary ─────────────────────────────────────────

/** Build a kid-readable summary of the composition itself, used by
 *  the save-select picker so the player can see what they're about
 *  to audit before clicking through. */
export interface CompositionSummary {
  agentNames: string[];
  toolNames: string[];
  wireCount: number;
  hasTools: boolean;
}

export function summarizeComposition(
  comp: AgentComposition,
  bindings: ToolBinding[],
): CompositionSummary {
  const agentNames = comp.team
    .map((p) => getAgent(p.agentId)?.name ?? p.agentId);
  const toolNames = bindings
    .map((b) => getTool(b.toolId)?.name ?? b.toolId);
  return {
    agentNames,
    toolNames,
    wireCount: comp.wires.length,
    hasTools: bindings.length > 0,
  };
}
