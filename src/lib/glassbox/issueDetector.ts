// src/lib/glassbox/issueDetector.ts
// ════════════════════════════════════════════════════════════════
// Stage 11F — Glass Box Lab issue detector
// ════════════════════════════════════════════════════════════════
// Lightweight heuristic auditor that flags potential issues per
// trajectory step. INTENTIONALLY simple — kids learn to spot
// patterns the auditor pre-categorizes, then practice the same
// pattern recognition themselves.
// ════════════════════════════════════════════════════════════════

import type { AgentComposition, Mission, TrajectoryStep } from '@/types/agentAtelier';
import type { ToolBinding } from '@/types/mcplab';
import type { IssueCategory, IssueCategoryMeta } from '@/types/glassbox';
import { getAgent } from '@/lib/agentatelier/agentRoster';

// ─── Detection rules ─────────────────────────────────────────────

interface DetectStepIssuesInput {
  step: TrajectoryStep;
  composition: AgentComposition;
  bindings: ToolBinding[];
  mission: Mission;
  allSteps: TrajectoryStep[];
}

/** Returns the set of issue categories detected for a single step. */
export function detectStepIssues(input: DetectStepIssuesInput): IssueCategory[] {
  const { step, composition, bindings, mission, allSteps } = input;
  const out: IssueCategory[] = [];

  const spec = getAgent(step.agentId);
  if (!spec) return out;

  // 1. missing-input — any required input port whose runtime value is the
  //    sentinel "(no <type> wired)" placeholder produced by the simulator
  //    when the input had no upstream wire.
  for (const inputName of Object.keys(step.inputs)) {
    const v = step.inputs[inputName];
    if (typeof v === 'string' && v.startsWith('(no ') && v.endsWith(' wired)')) {
      out.push('missing-input');
      break;
    }
  }

  // 2. unused-output — any of THIS step's outputs that no downstream agent
  //    actually consumed (no wire reads it). Only flag if there are later
  //    steps; the final terminal agent's outputs are by definition the end.
  const isTerminal = allSteps[allSteps.length - 1]?.step === step.step;
  if (!isTerminal) {
    const consumedOutputs = new Set(
      composition.wires
        .filter((w) => w.fromAgentId === step.agentId)
        .map((w) => w.fromOutputName),
    );
    const allOutputs = Object.keys(step.outputs);
    const unused = allOutputs.filter((name) => !consumedOutputs.has(name));
    if (unused.length > 0) out.push('unused-output');
  }

  // 3. tool-misuse — for each tool BOUND to this agent, check that the
  //    agent's input port type accepts the tool's output type. Stage 11E's
  //    addBinding already validates this, but a save could pre-date the
  //    validation rules — defensive flag.
  const myBindings = bindings.filter((b) => b.agentId === step.agentId);
  for (const b of myBindings) {
    const port = spec.inputs.find((p) => p.name === b.inputName);
    if (!port) {
      out.push('tool-misuse');
      break;
    }
  }

  // 4. redundant-step — another step in the trajectory produced an output
  //    of the SAME shape. Heuristic: same output type and step.summary
  //    within edit-distance 8.
  const similarStep = allSteps.find(
    (s) =>
      s.step !== step.step &&
      Object.keys(s.outputs).join('|') === Object.keys(step.outputs).join('|') &&
      summaryDistance(s.summary, step.summary) <= 8,
  );
  if (similarStep) out.push('redundant-step');

  // 5. forbidden-tool — kept on a per-step basis: if any of THIS agent's
  //    bindings reference a tool that a Stage-11E forbidden list rejected.
  //    Stage 11F doesn't load the original mission's forbidden list (we
  //    don't know which 11E mission produced the save), so this rule is a
  //    PLACEHOLDER for future cross-stage history. For now it never fires.

  // 6. no-critic — a per-trajectory rule: only fire on the LAST step if no
  //    'critic' agent appeared anywhere AND the trajectory has 4+ steps.
  if (
    isTerminal &&
    allSteps.length >= 4 &&
    !allSteps.some((s) => s.agentId === 'critic')
  ) {
    out.push('no-critic');
  }

  // 7. short-loop — a per-trajectory rule: trajectory has <= 2 steps but
  //    the mission's parAgentCount is >= 4. Fire on step 1.
  if (step.step === 1 && allSteps.length <= 2 && mission.parAgentCount >= 4) {
    out.push('short-loop');
  }

  return out;
}

// ─── Cheap edit-distance for summary similarity ──────────────────

function summaryDistance(a: string, b: string): number {
  if (a === b) return 0;
  // Simple character-level Levenshtein, capped at 32 chars to keep cheap.
  const A = a.slice(0, 32);
  const B = b.slice(0, 32);
  const m = A.length;
  const n = B.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array(n + 1).fill(0);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = i - 1;
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = A[i - 1] === B[j - 1] ? prev : Math.min(prev, dp[j], dp[j - 1]) + 1;
      prev = tmp;
    }
  }
  return dp[n];
}

// ─── Category display metadata ───────────────────────────────────

export const ISSUE_CATEGORY_META: Record<IssueCategory, IssueCategoryMeta> = {
  'missing-input': {
    label: 'Missing input',
    emoji: '🔌',
    color: '#FF7050',
    hint: 'An agent ran without a wired input — fall-back placeholder used.',
    severity: 3,
  },
  'unused-output': {
    label: 'Unused output',
    emoji: '🍃',
    color: '#D9A430',
    hint: 'An agent produced an output that nothing downstream consumed.',
    severity: 2,
  },
  'tool-misuse': {
    label: 'Tool misuse',
    emoji: '🪛',
    color: '#FF7050',
    hint: 'A bound tool feeds a port whose type doesn\'t match.',
    severity: 3,
  },
  'redundant-step': {
    label: 'Redundant step',
    emoji: '♻️',
    color: '#D9A430',
    hint: 'Two steps produced very similar output — wasted work.',
    severity: 1,
  },
  'forbidden-tool': {
    label: 'Forbidden tool',
    emoji: '🚫',
    color: '#FF7050',
    hint: 'A tool the original mission forbade is attached.',
    severity: 3,
  },
  'no-critic': {
    label: 'No critic',
    emoji: '🛡️',
    color: '#D9A430',
    hint: 'Long trajectories without a critic risk uncaught errors.',
    severity: 2,
  },
  'short-loop': {
    label: 'Too few steps',
    emoji: '📏',
    color: '#D9A430',
    hint: 'Trajectory is too short for the mission\'s recommended team size.',
    severity: 1,
  },
};

// ─── Audit summary helpers ───────────────────────────────────────

import type { AuditStep, AuditSummary } from '@/types/glassbox';

const ALL_CATEGORIES: IssueCategory[] = [
  'missing-input',
  'unused-output',
  'tool-misuse',
  'redundant-step',
  'forbidden-tool',
  'no-critic',
  'short-loop',
];

/** Compute an audit summary from the augmented trajectory + the
 *  player's annotations. */
export function summarizeAudit(steps: AuditStep[]): AuditSummary {
  const detectedByCategory = Object.fromEntries(
    ALL_CATEGORIES.map((c) => [c, 0]),
  ) as Record<IssueCategory, number>;
  const taggedByCategory = Object.fromEntries(
    ALL_CATEGORIES.map((c) => [c, 0]),
  ) as Record<IssueCategory, number>;

  let flaggedSteps = 0;
  let truePositiveCount = 0;
  let overTagCount = 0;
  let underTagCount = 0;

  for (const step of steps) {
    if (step.detected.length > 0) flaggedSteps += 1;
    for (const c of step.detected) detectedByCategory[c] += 1;
    for (const c of step.playerTags) taggedByCategory[c] += 1;

    const detectedSet = new Set(step.detected);
    const taggedSet = new Set(step.playerTags);
    for (const c of taggedSet) {
      if (detectedSet.has(c)) truePositiveCount += 1;
      else overTagCount += 1;
    }
    for (const c of detectedSet) {
      if (!taggedSet.has(c)) underTagCount += 1;
    }
  }

  // Accuracy heuristic: TP / (TP + over + under), or 1 if there were
  // no issues either side (the trajectory was clean and the kid agreed).
  const denom = truePositiveCount + overTagCount + underTagCount;
  const accuracy = denom === 0 ? 1 : truePositiveCount / denom;

  // Stars: based on accuracy, with a minimum of 1 star if the player
  // engaged at all.
  const engaged = steps.some((s) => s.playerTags.length > 0 || (s.playerNote ?? '').length > 0);
  const stars: 0 | 1 | 2 | 3 =
    !engaged ? 0
    : accuracy >= 0.85 ? 3
    : accuracy >= 0.6 ? 2
    : 1;

  return {
    totalSteps: steps.length,
    flaggedSteps,
    detectedByCategory,
    taggedByCategory,
    truePositiveCount,
    overTagCount,
    underTagCount,
    accuracy,
    stars,
  };
}
