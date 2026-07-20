// ════════════════════════════════════════════════════════════════
// CORE IGNITION — shared types (Forge F8, Concept 10 Part 12)
// ════════════════════════════════════════════════════════════════

export type CoreIgnitionBand = 'A' | 'B' | 'C';

export type GateType =
  | 'vague-fog'
  | 'bias-wall'
  | 'context-canyon'
  | 'hallucination-gap'
  | 'token-overload';

export interface GateChip {
  /** Chip label the child taps. */
  text: string;
  /** Which prompt slot this chip belongs in (null = distractor). */
  slot: 'role' | 'task' | 'detail' | null;
}

export interface GateScenario {
  id: string;
  gateType: GateType;
  band: CoreIgnitionBand;
  /** The situation shown above the forge. */
  setup: string;
  /** What the child's prompt must achieve. */
  goal: string;
  /** Band A: 6 chips (3 correct — one per slot — + 3 distractors). */
  chips?: GateChip[];
  /** Band B: template with two ___ blanks. */
  templateText?: string;
  /** Band B: options per blank (first option correct). */
  blankOptions?: [string[], string[]];
  /** Band C: an exemplar prompt (shown AFTER scoring as a model). */
  exemplar?: string;
  /** Band C rubric: each inner array = synonyms; ≥1 group hit per ingredient. */
  keywords?: {
    task: string[];
    ingredient: string[];
    context: string[];
  };
}

export interface GateResult {
  scenarioId: string;
  gateType: GateType;
  points: number; // 0–10
  feedback: string;
  /** Which ingredients the child supplied (for the complete-phase recap). */
  ingredients: string[];
}

export const GATE_META: Record<GateType, { name: string; icon: string; ingredient: string; breakLine: string }> = {
  'vague-fog': {
    name: 'Vague Fog',
    icon: '🌫️',
    ingredient: 'a specific task',
    breakLine: 'The fog burns away!',
  },
  'bias-wall': {
    name: 'Bias Wall',
    icon: '🧱',
    ingredient: 'fair, balanced phrasing',
    breakLine: 'The wall cracks down the middle!',
  },
  'context-canyon': {
    name: 'Context Canyon',
    icon: '🏜️',
    ingredient: 'background context',
    breakLine: 'A light-bridge assembles!',
  },
  'hallucination-gap': {
    name: 'Hallucination Gap',
    icon: '👻',
    ingredient: 'a grounding rule',
    breakLine: 'The phantom bricks turn solid!',
  },
  'token-overload': {
    name: 'Token Overload',
    icon: '🌀',
    ingredient: 'a short, focused ask',
    breakLine: 'The wall compacts into a cube and drops!',
  },
};
