// src/lib/agentatelier/missionRunner.ts
// ================================================================
// Stage 11D — Agent Atelier (C1)
// ================================================================
// Mission execution + grading. Pure functions — no React, no IO.
//
// `simulate` walks the wired team in topological order and produces
// a TrajectoryStep[] the UI animates during the `simulate` phase.
// `grade` applies the mission rubric to the trajectory's final
// artifact and returns a MissionGrade with stars (0..3) and an MVP.
//
// The "execution model" is deliberately simplified: each agent
// produces a stub output appropriate to its role and port shape.
// This is a teaching tool — kids learn the *structure* of agentic
// orchestration (delegate, route, critique, revise) without having
// to call a real LLM. Stages 11F (Glass Box Lab) and 11G (Harness
// Forge) will read this trajectory shape for cross-game replay.
// ================================================================

import type {
  AgentComposition,
  AgentSpec,
  Mission,
  MissionGrade,
  PlacedAgent,
  TrajectoryStep,
  Wire,
} from '@/types/agentAtelier';
import { getAgent } from './agentRoster';
import { detectCycle, topologicalOrder } from './wireGraph';

// ─── Run-time errors ─────────────────────────────────────────────

export type RunError =
  | { kind: 'cycle-in-team'; involvedAgentIds: string[] }
  | { kind: 'no-terminal-agent' }
  | { kind: 'mission-output-mismatch'; expected: string; got: string };

// ─── Simulate ───────────────────────────────────────────────────

interface SimulateInput {
  team: PlacedAgent[];
  wires: Wire[];
  mission: Mission;
}

interface SimulateOutput {
  trajectory: TrajectoryStep[];
  /** Agent that produced the final artifact (ordered last in topological execution). */
  terminalAgentId: string | null;
  /** Final artifact as text — what `grade` will score. */
  finalArtifact: string;
  /** Total wall-clock duration in ms (sum of step durations). */
  totalMs: number;
  error: RunError | null;
}

/** Walk the team in topological order, producing stub outputs per agent
 *  appropriate to its role + port shape. The result trajectory is what
 *  the UI animates and what Stages 11F/11G later consume. */
export function simulate(input: SimulateInput): SimulateOutput {
  const { team, wires, mission } = input;

  // Cycle check (defensive — UI should already block this at wire-add time).
  const cycle = detectCycle(team, wires);
  if (cycle) {
    return {
      trajectory: [],
      terminalAgentId: null,
      finalArtifact: '',
      totalMs: 0,
      error: { kind: 'cycle-in-team', involvedAgentIds: cycle },
    };
  }

  if (team.length === 0) {
    return {
      trajectory: [],
      terminalAgentId: null,
      finalArtifact: '',
      totalMs: 0,
      error: { kind: 'no-terminal-agent' },
    };
  }

  const order = topologicalOrder(team, wires);
  const trajectory: TrajectoryStep[] = [];

  // Per-agent intermediate outputs, keyed by agentId+portName.
  const portValues = new Map<string, unknown>();
  function key(agentId: string, portName: string) {
    return `${agentId}:${portName}`;
  }

  // Seed mission inputs into the first agent's input ports — by convention,
  // each first-step agent's first input gets the mission prompt as text.
  let totalMs = 0;
  for (const agentId of order) {
    const spec = getAgent(agentId);
    if (!spec) continue;

    // Resolve inputs: any port that has an incoming wire takes that wire's
    // upstream value; otherwise defaults to the mission prompt for `text`,
    // or a sentinel for other types (so the player feels the consequence
    // of an unwired input).
    const inputs: Record<string, unknown> = {};
    for (const inp of spec.inputs) {
      const wire = wires.find((w) => w.toAgentId === agentId && w.toInputName === inp.name);
      if (wire) {
        inputs[inp.name] = portValues.get(key(wire.fromAgentId, wire.fromOutputName)) ?? '(missing)';
      } else if (inp.type === 'text') {
        inputs[inp.name] = mission.prompt;
      } else {
        inputs[inp.name] = `(no ${inp.type} wired)`;
      }
    }

    // Stub-execute: produce role-appropriate outputs.
    const outputs: Record<string, unknown> = {};
    for (const out of spec.outputs) {
      outputs[out.name] = stubOutput(spec, out.name, out.type, inputs, mission);
    }

    // Capture outputs for downstream wires.
    for (const out of spec.outputs) {
      portValues.set(key(agentId, out.name), outputs[out.name]);
    }

    const durationMs = stubDurationMs(spec);
    totalMs += durationMs;

    trajectory.push({
      step: trajectory.length + 1,
      agentId,
      inputs,
      outputs,
      durationMs,
      summary: stubSummary(spec, mission),
    });
  }

  // Terminal agent = last in topological order (no outgoing wires by definition
  // if the graph is a DAG with one sink; otherwise we take the last-ordered one).
  const terminalAgentId = order[order.length - 1] ?? null;

  // Final artifact: stringified terminal agent's first output that matches
  // mission.expectedOutput, or its first output overall.
  let finalArtifact = '';
  if (terminalAgentId) {
    const spec = getAgent(terminalAgentId);
    if (spec) {
      const matchingOut = spec.outputs.find((o) => o.type === mission.expectedOutput) ?? spec.outputs[0];
      if (matchingOut) {
        const v = portValues.get(key(terminalAgentId, matchingOut.name));
        finalArtifact = typeof v === 'string' ? v : JSON.stringify(v);
      }
    }
  }

  return { trajectory, terminalAgentId, finalArtifact, totalMs, error: null };
}

// ─── Stub output generators (teaching simulations) ───────────────

function stubOutput(
  spec: AgentSpec,
  outputName: string,
  outputType: string,
  inputs: Record<string, unknown>,
  mission: Mission,
): unknown {
  const inputDigest = Object.values(inputs).map((v) => String(v).slice(0, 40)).join(' | ');
  switch (spec.id) {
    case 'researcher':
      return [`Fact about: ${mission.title}`, 'Source A', 'Source B'];
    case 'writer':
      return `${spec.name} draft for "${mission.title}": ${inputDigest}`;
    case 'planner':
      return ['Step 1: clarify goal', 'Step 2: gather inputs', 'Step 3: produce output'];
    case 'estimator':
      return outputName === 'time' ? 30 : 12;
    case 'critic':
      return ['Issue 1: missing detail', 'Issue 2: cost unclear'];
    case 'coder':
      return `// ${spec.name}\nfunction solve() { /* ${mission.title} */ }`;
    case 'translator':
      return `${spec.name} (translated): ${inputDigest}`;
    case 'summarizer':
      return `Summary: ${inputDigest.slice(0, 80)}`;
    case 'router':
      return spec.outputs[0]?.name === 'next_agent' ? 'writer' : '';
    case 'toolsmith':
      return `Tool result for ${mission.title}`;
    case 'judge':
      return 0.8; // grade 0..1 stub
    case 'memory':
      return `Recalled: ${inputDigest.slice(0, 50)}`;
    default:
      return outputType === 'number' ? 0 : `(${spec.name} output)`;
  }
}

function stubDurationMs(spec: AgentSpec): number {
  // Reasoning-heavy specialists "take longer" so the trajectory animation
  // has visual rhythm.
  switch (spec.id) {
    case 'researcher': return 380;
    case 'writer':     return 420;
    case 'critic':     return 460;
    case 'coder':      return 500;
    case 'judge':      return 520;
    case 'router':     return 200;
    case 'memory':     return 180;
    case 'estimator':  return 240;
    case 'translator': return 360;
    case 'summarizer': return 320;
    case 'planner':    return 340;
    case 'toolsmith':  return 280;
    default:           return 300;
  }
}

function stubSummary(spec: AgentSpec, mission: Mission): string {
  return `${spec.name} processed "${mission.title}".`;
}

// ─── Grade ───────────────────────────────────────────────────────

interface GradeInput {
  trajectory: TrajectoryStep[];
  finalArtifact: string;
  mission: Mission;
}

/** Apply the mission's hand-built rubric to the trajectory's final
 *  artifact. Returns a MissionGrade with stars (0..3), per-criterion
 *  matches, and an MVP agent.
 *
 *  Grading model (kid-readable):
 *    • Each rubric criterion gets a 0..1 match score from a heuristic
 *      keyword check against the final artifact + trajectory summaries.
 *    • The total is the weighted average.
 *    • parAgentCount bonus: + 0.1 if team size ≤ par, otherwise no bonus.
 *    • Stars: total < 0.4 → 0, < 0.6 → 1, < 0.8 → 2, else 3.
 *    • MVP = agent whose stub-summary contributed the most matched
 *      criterion keywords (defaults to terminal agent if tied). */
export function grade(input: GradeInput): MissionGrade {
  const { trajectory, finalArtifact, mission } = input;

  const totalText = (
    finalArtifact + ' ' + trajectory.map((t) => t.summary).join(' ')
  ).toLowerCase();

  // Per-criterion match score: 1 if any criterion-derived keyword appears
  // in the artifact/trajectory text, scaled by partial matches.
  const perCriterion = mission.rubric.map((c) => {
    const keywords = extractKeywords(c.criterion);
    if (keywords.length === 0) return { criterion: c.criterion, matched: 0.5 };
    const hits = keywords.filter((k) => totalText.includes(k)).length;
    const matched = Math.min(1, hits / keywords.length);
    return { criterion: c.criterion, matched };
  });

  // Weighted average, normalized.
  const totalWeight = mission.rubric.reduce((s, c) => s + c.weight, 0) || 1;
  const weightedSum = mission.rubric.reduce(
    (s, c, i) => s + c.weight * perCriterion[i].matched,
    0,
  );
  let total = weightedSum / totalWeight;

  // Par-agent bonus.
  if (trajectory.length <= mission.parAgentCount) total = Math.min(1, total + 0.1);

  // Stars.
  const stars: 0 | 1 | 2 | 3 =
    total >= 0.8 ? 3 : total >= 0.6 ? 2 : total >= 0.4 ? 1 : 0;

  // MVP (heuristic).
  const mvp = trajectory.length > 0
    ? trajectory[trajectory.length - 1].agentId
    : null;

  const timeMs = trajectory.reduce((s, t) => s + t.durationMs, 0);

  return { total, stars, perCriterion, mvp, timeMs };
}

/** Cheap keyword extractor — pulls the lowercase content words from a
 *  short rubric criterion, dropping stop-words. */
const STOP = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'in', 'is', 'it',
  'least', 'must', 'of', 'on', 'or', 'per', 'present', 'than', 'that', 'the',
  'to', 'with', 'each', 'all', 'every', 'any', 'no',
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9$€£]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w));
}

// ─── Composition snapshot ────────────────────────────────────────

/** Snapshot the current team + wires into an `AgentComposition`-shaped
 *  payload ready to write to Supabase. (Store layer adds id + child_id
 *  + created_at on save.) */
export function compositionPayload(
  name: string,
  team: PlacedAgent[],
  wires: Wire[],
): Pick<AgentComposition, 'name' | 'team' | 'wires'> {
  return { name, team, wires };
}
