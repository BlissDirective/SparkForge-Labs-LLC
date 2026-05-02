// src/lib/mcplab/toolBinding.ts
// ════════════════════════════════════════════════════════════════
// Stage 11E — MCP Plug-and-Play Lab (C6)
// ════════════════════════════════════════════════════════════════
// Validation + mission library + grader. Pure functions — no React,
// no IO. Parallels Stage 11D's wireGraph + missionRunner pair so the
// 11E game UI can reuse the same mental model.
// ════════════════════════════════════════════════════════════════

import type {
  EquipGrade,
  EquipMission,
  ToolBinding,
  ToolBindingError,
} from '@/types/mcplab';
import type { PlacedAgent } from '@/types/agentAtelier';
import { getAgent } from '@/lib/agentatelier/agentRoster';
import { canConnect } from '@/lib/agentatelier/wireGraph';
import { getTool } from './toolCatalog';

// ─── Validation ──────────────────────────────────────────────────

/** Validates a ToolBinding against the current team + mission. Returns
 *  null if valid, else a ToolBindingError describing the first
 *  failure encountered. */
export function validateBinding(
  team: PlacedAgent[],
  existingBindings: ToolBinding[],
  candidate: ToolBinding,
  mission?: EquipMission,
): ToolBindingError | null {
  const tool = getTool(candidate.toolId);
  if (!tool) return { kind: 'unknown-tool', toolId: candidate.toolId };

  // Forbidden by current mission?
  if (mission && mission.forbiddenTools.includes(candidate.toolId)) {
    return { kind: 'forbidden-tool', toolId: candidate.toolId };
  }

  // Agent in team?
  const placed = team.find((p) => p.agentId === candidate.agentId);
  if (!placed) return { kind: 'unknown-agent', agentId: candidate.agentId };

  const spec = getAgent(candidate.agentId);
  if (!spec) return { kind: 'unknown-agent', agentId: candidate.agentId };

  // Input port exists?
  const inputPort = spec.inputs.find((p) => p.name === candidate.inputName);
  if (!inputPort) {
    return { kind: 'unknown-port', agentId: candidate.agentId, inputName: candidate.inputName };
  }

  // Tool output type compatible with agent input port type?
  // Reuses Stage 11D's canConnect rules.
  if (!canConnect({ name: 'tool', type: tool.outputType }, inputPort)) {
    return { kind: 'type-mismatch', toolType: tool.outputType, portType: inputPort.type };
  }

  // Duplicate?
  const dup = existingBindings.find(
    (b) => b.agentId === candidate.agentId && b.inputName === candidate.inputName && b.toolId === candidate.toolId,
  );
  if (dup) return { kind: 'duplicate-binding' };

  return null;
}

/** Human-readable explanation for a ToolBindingError. UI surfaces this
 *  as a kid-friendly toast / inline error. */
export function explainBindingError(e: ToolBindingError): string {
  switch (e.kind) {
    case 'unknown-tool':
      return `Tool "${e.toolId}" isn't in the catalog.`;
    case 'unknown-agent':
      return `Agent "${e.agentId}" isn't on your team.`;
    case 'unknown-port':
      return `Agent "${e.agentId}" has no input named "${e.inputName}".`;
    case 'type-mismatch':
      return `This tool produces ${e.toolType}, but the port expects ${e.portType}. Pick a different tool or different port.`;
    case 'duplicate-binding':
      return 'That tool is already attached to that port.';
    case 'forbidden-tool':
      return `This mission forbids tool "${e.toolId}" — it would skip the lesson.`;
  }
}

// ─── Mission library ─────────────────────────────────────────────

export const EQUIP_MISSIONS: readonly EquipMission[] = [
  // Easy
  {
    id: 'birthday-budget-easy',
    title: 'Birthday on a Budget',
    prompt: 'Plan a $40 birthday party. Use tools to do real math, not estimates.',
    difficulty: 'easy',
    band: ['A', 'B', 'C'],
    starterTeam: ['planner', 'estimator'],
    recommendedTools: ['calculator', 'calendar'],
    forbiddenTools: [],
    parToolCount: 2,
    rubric: [
      { criterion: 'Uses calculator for the math', weight: 2 },
      { criterion: 'Uses calendar for the date', weight: 1 },
      { criterion: 'Stays under $40', weight: 2 },
    ],
  },
  {
    id: 'word-of-the-day-easy',
    title: 'Word of the Day',
    prompt: 'Look up an interesting word, find 3 synonyms, and write a one-sentence example.',
    difficulty: 'easy',
    band: ['A', 'B', 'C'],
    starterTeam: ['researcher', 'writer'],
    recommendedTools: ['dictionary', 'thesaurus'],
    forbiddenTools: [],
    parToolCount: 2,
    rubric: [
      { criterion: 'Uses dictionary for definition', weight: 1.5 },
      { criterion: 'Uses thesaurus for synonyms', weight: 1.5 },
      { criterion: 'Final example sentence is well-formed', weight: 1 },
    ],
  },

  // Medium
  {
    id: 'travel-trio-medium',
    title: 'Equipped Travel Trio',
    prompt: 'Plan a 3-city trip in 5 days under €600 — let your tools verify train times and convert currency.',
    difficulty: 'medium',
    band: ['B', 'C'],
    starterTeam: ['planner', 'researcher', 'estimator'],
    recommendedTools: ['calendar', 'unit-converter', 'safe-search'],
    forbiddenTools: [],
    parToolCount: 3,
    rubric: [
      { criterion: 'Uses calendar for travel dates', weight: 1 },
      { criterion: 'Uses unit-converter for currency or distance', weight: 1.5 },
      { criterion: 'Uses safe-search to research cities', weight: 1.5 },
      { criterion: 'Total cost under €600', weight: 2 },
    ],
  },
  {
    id: 'science-fact-check-medium',
    title: 'Science Fact-Check Run',
    prompt: 'Check 3 science claims. Use safe-search to find sources, dictionary to define jargon, notepad to track sources.',
    difficulty: 'medium',
    band: ['B', 'C'],
    starterTeam: ['researcher', 'critic'],
    recommendedTools: ['safe-search', 'dictionary', 'notepad'],
    forbiddenTools: [],
    parToolCount: 3,
    rubric: [
      { criterion: 'Each claim labeled true/false/partial', weight: 1.5 },
      { criterion: 'Sources tracked in notepad', weight: 1 },
      { criterion: 'Jargon defined via dictionary', weight: 1 },
      { criterion: 'No claims labeled without a source', weight: 2 },
    ],
  },

  // Hard
  {
    id: 'lunchbox-budget-hard',
    title: 'Engineered Lunchbox',
    prompt: 'Design a recyclable lunchbox under $12 and 300g. Use calculator for cost, formula-solver for material weights, doodle-maker for the sketch. No web tools — design from first principles.',
    difficulty: 'hard',
    band: ['C'],
    starterTeam: ['planner', 'critic', 'estimator'],
    recommendedTools: ['calculator', 'formula-solver', 'doodle-maker'],
    forbiddenTools: ['safe-search', 'web-fetch'],
    parToolCount: 3,
    rubric: [
      { criterion: 'Calculator used for cost', weight: 1.5 },
      { criterion: 'Formula-solver used for weight', weight: 1.5 },
      { criterion: 'Doodle-maker produces a sketch', weight: 1 },
      { criterion: 'Total cost ≤ $12', weight: 1.5 },
      { criterion: 'Total weight ≤ 300g', weight: 1 },
      { criterion: 'No forbidden tools attached', weight: 2 },
    ],
  },
  {
    id: 'multilingual-joke-hard',
    title: 'Multilingual Joke Builder',
    prompt: 'Build 3 kid-safe jokes in English, translate the funniest 2 to French, then verify they\'re still funny. Use translator-tool, dictionary, and color-picker for joke-card styling.',
    difficulty: 'hard',
    band: ['C'],
    starterTeam: ['writer', 'translator', 'critic'],
    recommendedTools: ['translator-tool', 'dictionary', 'color-picker'],
    forbiddenTools: [],
    parToolCount: 3,
    rubric: [
      { criterion: '3 English jokes generated', weight: 1 },
      { criterion: 'Translator-tool used for French', weight: 1.5 },
      { criterion: 'Dictionary used for tricky words', weight: 1 },
      { criterion: 'Color-picker palette applied', weight: 1 },
      { criterion: 'Critic confirms humor preserved in French', weight: 1.5 },
    ],
  },
] as const;

if (process.env.NODE_ENV !== 'production' && EQUIP_MISSIONS.length !== 6) {
  throw new Error(`EQUIP_MISSIONS expected 6 entries, got ${EQUIP_MISSIONS.length}`);
}

export function getEquipMission(id: string): EquipMission | undefined {
  return EQUIP_MISSIONS.find((m) => m.id === id);
}

export function equipMissionsForBand(band: 'A' | 'B' | 'C'): EquipMission[] {
  return EQUIP_MISSIONS.filter((m) => m.band.includes(band));
}

// ─── Grader ──────────────────────────────────────────────────────

interface EquipGradeInput {
  team: PlacedAgent[];
  bindings: ToolBinding[];
  mission: EquipMission;
  /** Stub artifact text (for now, the grader is heuristic — keyword
   *  match against the rubric criteria — and uses the mission prompt
   *  + tool ids as the corpus). Stage 11F will replace this with an
   *  actual replayed trajectory. */
  artifactHint?: string;
  timeMs: number;
}

/** Grade an equipped mission. The grader rewards using recommended
 *  tools and penalizes using forbidden tools. */
export function gradeEquipped(input: EquipGradeInput): EquipGrade {
  const { bindings, mission, artifactHint = '', timeMs } = input;

  const boundToolIds = new Set(bindings.map((b) => b.toolId));
  const violations = mission.forbiddenTools.filter((id) => boundToolIds.has(id));

  // Per-criterion match: heuristic keyword check against the rubric
  // criterion text vs the bound tool ids + names + the artifact hint.
  const corpus = [
    ...bindings.map((b) => b.toolId),
    ...bindings.map((b) => b.inputName),
    artifactHint,
  ].join(' ').toLowerCase();

  const STOP = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'in', 'is', 'it',
    'least', 'must', 'of', 'on', 'or', 'per', 'present', 'than', 'that', 'the',
    'to', 'with', 'each', 'all', 'every', 'any', 'no', 'used',
  ]);
  function keywords(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[^a-z0-9$€£-]+/)
      .filter((w) => w.length >= 3 && !STOP.has(w));
  }

  const perCriterion = mission.rubric.map((c) => {
    const kws = keywords(c.criterion);
    if (kws.length === 0) return { criterion: c.criterion, matched: 0.5 };
    const hits = kws.filter((k) => corpus.includes(k)).length;
    const matched = Math.min(1, hits / kws.length);
    return { criterion: c.criterion, matched };
  });

  const totalWeight = mission.rubric.reduce((s, c) => s + c.weight, 0) || 1;
  const weightedSum = mission.rubric.reduce(
    (s, c, i) => s + c.weight * perCriterion[i].matched,
    0,
  );
  let total = weightedSum / totalWeight;

  // Recommended-tools bonus: + (n_attached_recommended / total_recommended) * 0.1
  if (mission.recommendedTools.length > 0) {
    const attachedRec = mission.recommendedTools.filter((id) => boundToolIds.has(id)).length;
    total += (attachedRec / mission.recommendedTools.length) * 0.1;
  }
  // Par-toolCount bonus: + 0.05 if equal-or-fewer than par
  if (bindings.length <= mission.parToolCount && bindings.length > 0) total += 0.05;
  // Violation penalty: - 0.15 per forbidden tool attached
  total -= violations.length * 0.15;
  total = Math.max(0, Math.min(1, total));

  // MVP tool — first recommended tool that's actually attached, else first attached.
  const mvpToolId =
    mission.recommendedTools.find((id) => boundToolIds.has(id)) ??
    bindings[0]?.toolId ??
    null;

  const stars: 0 | 1 | 2 | 3 =
    total >= 0.8 ? 3 : total >= 0.6 ? 2 : total >= 0.4 ? 1 : 0;

  return {
    total,
    stars,
    perCriterion,
    mvpToolId,
    violations,
    timeMs,
  };
}
