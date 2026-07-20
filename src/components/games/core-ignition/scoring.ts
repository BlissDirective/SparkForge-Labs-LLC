// ════════════════════════════════════════════════════════════════
// CORE IGNITION — deterministic scoring rubric (Forge F8, §12.5)
// ════════════════════════════════════════════════════════════════
// NO AI call in the core loop. Pure functions, unit-tested.
// Feedback is ALWAYS constructive and names the ingredient.

import { BANNED_VAGUE_WORDS } from './content';
import { GATE_META } from '@/types/coreIgnition';
import type { GateResult, GateScenario } from '@/types/coreIgnition';

export interface BandAInput {
  kind: 'A';
  /** Chip text placed in each slot (null = slot left empty). */
  slots: { role: string | null; task: string | null; detail: string | null };
}
export interface BandBInput {
  kind: 'B';
  /** Selected option text per blank. */
  blanks: [string, string];
  /** Optional modifier chip — apt when it matches the first blank option set? Simplified: boolean from UI. */
  modifierApt?: boolean;
}
export interface BandCInput {
  kind: 'C';
  text: string;
}
export type GateInput = BandAInput | BandBInput | BandCInput;

const MIN_C_LEN = 8;
const MAX_C_LEN = 220;

export function scoreGate(input: GateInput, scenario: GateScenario): GateResult {
  const meta = GATE_META[scenario.gateType];

  if (input.kind === 'A') {
    const chips = scenario.chips ?? [];
    const correctFor = (slot: 'role' | 'task' | 'detail') =>
      chips.find((c) => c.slot === slot)?.text ?? null;
    let points = 0;
    const ingredients: string[] = [];
    const wrong: string[] = [];
    (['role', 'task', 'detail'] as const).forEach((slot) => {
      const placed = input.slots[slot];
      if (placed && placed === correctFor(slot)) {
        points += 3;
        ingredients.push(slot);
      } else if (placed) {
        wrong.push(slot);
      }
    });
    if (points === 9) points = 10; // perfect bonus
    const feedback =
      points === 10
        ? `Perfect forge! Your prompt has ${meta.ingredient} and every piece in place. ${meta.breakLine}`
        : wrong.length > 0
          ? `Almost! The ${wrong[0]} slot needs a different chip — this gate needs ${meta.ingredient}.`
          : `Good start! Fill every slot — this gate needs ${meta.ingredient}.`;
    return { scenarioId: scenario.id, gateType: scenario.gateType, points, feedback, ingredients };
  }

  if (input.kind === 'B') {
    const opts = scenario.blankOptions ?? [[], []];
    let points = 0;
    const ingredients: string[] = [];
    input.blanks.forEach((chosen, i) => {
      if (opts[i]?.[0] === chosen) {
        points += 4;
        ingredients.push(i === 0 ? 'task' : 'detail');
      }
    });
    if (input.modifierApt) points += 2;
    points = Math.min(10, points);
    const feedback =
      points >= 8
        ? `Strong forge! You supplied ${meta.ingredient}. ${meta.breakLine}`
        : `Check your blanks — this gate needs ${meta.ingredient}. Which choice actually helps the machine?`;
    return { scenarioId: scenario.id, gateType: scenario.gateType, points, feedback, ingredients };
  }

  // ── Band C rubric ──
  const text = input.text.trim().toLowerCase();
  const kw = scenario.keywords ?? { task: [], ingredient: [], context: [] };
  let points = 0;
  const ingredients: string[] = [];
  const hit = (group: string[]) => group.some((k) => text.includes(k.toLowerCase()));

  if (hit(kw.task)) {
    points += 3;
    ingredients.push('a clear task');
  }
  if (hit(kw.ingredient)) {
    points += 4;
    ingredients.push(meta.ingredient);
  }
  if (hit(kw.context)) {
    points += 2;
    ingredients.push('context');
  }
  if (text.length >= MIN_C_LEN && text.length <= MAX_C_LEN) points += 1;
  for (const banned of BANNED_VAGUE_WORDS) {
    if (text.includes(banned)) points -= 1;
  }
  points = Math.max(0, Math.min(10, points));

  const missing: string[] = [];
  if (!hit(kw.task)) missing.push('a clear task verb');
  if (!hit(kw.ingredient)) missing.push(meta.ingredient);
  if (!hit(kw.context)) missing.push('a bit of context');

  const feedback =
    points >= 8
      ? `Masterful prompt! ${meta.breakLine}`
      : missing.length > 0
        ? `Good metal, needs tempering — try adding ${missing[0]}.`
        : `Trim the vague words and strike again — this gate needs ${meta.ingredient}.`;

  return { scenarioId: scenario.id, gateType: scenario.gateType, points, feedback, ingredients };
}
