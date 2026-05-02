// src/lib/contextarch/budgetEngine.ts
// ════════════════════════════════════════════════════════════════
// Stage 11B — Context Architect budget + Rot + grade engine
// ════════════════════════════════════════════════════════════════
// Pure functions. No React, no IO. Computes:
//   • Used-token total across the shelf (accounting for reductions
//     and isolations).
//   • Context Rot (0..1) — rises as the shelf gets crowded with low-
//     relevance cards or as time-since-placement grows ("freshness").
//   • Per-question accuracy — how well the current shelf answers
//     the active question.
//   • Move validation: each of Offload/Retrieve/Isolate/Reduce
//     returns null on success or a ContextError with a kid-readable
//     reason.
//   • Final grade.
//
// The pedagogical core: the kid LEARNS by watching how Rot and
// accuracy respond to their move choices. The math is simple by
// design — each rule is named in code so the UI can echo it back
// in plain language.
// ════════════════════════════════════════════════════════════════

import type {
  ContextCard,
  ContextError,
  ContextGrade,
  ContextMove,
  ConversationTurn,
  ExternalPlacement,
  MoveDescriptor,
  Question,
  ShelfPlacement,
} from '@/types/contextArchitect';
import { getCard, reducedTokensFor } from './cardLibrary';

// ─── Token math ──────────────────────────────────────────────────

/** Compute the effective token cost of a single placement. */
export function effectiveTokens(p: ShelfPlacement): number {
  const card = getCard(p.cardId);
  if (!card) return 0;
  // Isolated cards still consume tokens — they're hidden from the next
  // agent, but still on the shelf.
  return p.reduced ? reducedTokensFor(card) : card.tokens;
}

/** Sum of effective tokens currently on the shelf. */
export function tokensUsed(shelf: ShelfPlacement[]): number {
  return shelf.reduce((s, p) => s + effectiveTokens(p), 0);
}

// ─── Context Rot ─────────────────────────────────────────────────

/** Rot rises when the shelf is crowded AND has lots of low-relevance
 *  cards. Returns 0..1. */
export function computeRot(
  shelf: ShelfPlacement[],
  question: Question | null,
  budget: number,
): number {
  if (shelf.length === 0) return 0;

  // Crowdedness component: tokens used / budget. >100% pushes hard.
  const crowdedness = budget > 0 ? Math.min(1.6, tokensUsed(shelf) / budget) : 0;

  // Distraction component: fraction of cards that don't help the question.
  let distraction = 0;
  if (question) {
    const keys = new Set(question.keyCardIds);
    const distractions = shelf.filter((p) => !keys.has(p.cardId)).length;
    distraction = distractions / shelf.length;
  }

  // Combine: 60% crowdedness, 40% distraction. Floor at 0, cap at 1.
  const raw = 0.6 * Math.max(0, crowdedness - 0.7) * 2 + 0.4 * distraction;
  return Math.max(0, Math.min(1, raw));
}

// ─── Accuracy ────────────────────────────────────────────────────

/** How well does the current shelf answer the active question? 0..1.
 *  Built from 4 ingredients per Doc 1 §4.2:
 *    + key cards present  +0.6 (split evenly across keys)
 *    - decoys present     -0.2 each (capped)
 *    - high rot           -rot * 0.4
 *    + reduce penalty: reduced cards still count but at (1-decay) value
 *    - isolated cards: don't count at all for accuracy (they're hidden)
 */
export function computeAccuracy(
  shelf: ShelfPlacement[],
  question: Question | null,
): number {
  if (!question) return 0;
  const visiblePlacements = shelf.filter((p) => !p.isolated);

  const keyCount = question.keyCardIds.length;
  if (keyCount === 0) return 1;

  let keyScore = 0;
  for (const keyId of question.keyCardIds) {
    const placement = visiblePlacements.find((p) => p.cardId === keyId);
    if (!placement) continue;
    const card = getCard(keyId);
    if (!card) continue;
    // Reduced key cards count at (1 - decay) value.
    const value = placement.reduced ? Math.max(0.1, 1 - card.decay) : 1;
    keyScore += value / keyCount;
  }
  keyScore = keyScore * 0.7; // max 0.7 from key cards

  let decoyPenalty = 0;
  const decoySet = new Set(question.decoyCardIds);
  const decoysOnShelf = visiblePlacements.filter((p) => decoySet.has(p.cardId)).length;
  decoyPenalty = Math.min(0.3, decoysOnShelf * 0.15);

  // Rot penalty.
  const rot = computeRot(shelf, question, /* budget irrelevant here */ 256);
  const rotPenalty = rot * 0.25;

  const total = keyScore - decoyPenalty - rotPenalty;
  // Bonus: an exactly-right shelf (only key cards, none extra) scores +0.3.
  const onlyKeys = visiblePlacements.length === keyCount &&
    question.keyCardIds.every((id) => visiblePlacements.some((p) => p.cardId === id));
  const tightnessBonus = onlyKeys ? 0.3 : 0;

  return Math.max(0, Math.min(1, total + tightnessBonus));
}

// ─── Move validators ─────────────────────────────────────────────

/** Validates an Offload move. Returns null on success, error otherwise. */
export function validateOffload(
  shelf: ShelfPlacement[],
  cardId: string,
): ContextError | null {
  if (!shelf.find((p) => p.cardId === cardId)) {
    return { kind: 'card-not-on-shelf', cardId };
  }
  return null;
}

/** Validates a Retrieve move. */
export function validateRetrieve(
  external: ExternalPlacement[],
  shelf: ShelfPlacement[],
  cardId: string,
  budget: number,
): ContextError | null {
  if (!external.find((p) => p.cardId === cardId)) {
    return { kind: 'card-not-on-shelf', cardId };
  }
  const card = getCard(cardId);
  if (!card) return { kind: 'card-not-on-shelf', cardId };
  const newTotal = tokensUsed(shelf) + card.tokens;
  if (newTotal > budget) {
    return { kind: 'budget-exceeded', over: newTotal - budget };
  }
  return null;
}

/** Validates an Isolate move. */
export function validateIsolate(
  shelf: ShelfPlacement[],
  cardId: string,
): ContextError | null {
  const placement = shelf.find((p) => p.cardId === cardId);
  if (!placement) return { kind: 'card-not-on-shelf', cardId };
  if (placement.isolated) return { kind: 'card-already-isolated', cardId };
  return null;
}

/** Validates a Reduce move. */
export function validateReduce(
  shelf: ShelfPlacement[],
  cardId: string,
): ContextError | null {
  const placement = shelf.find((p) => p.cardId === cardId);
  if (!placement) return { kind: 'card-not-on-shelf', cardId };
  if (placement.reduced) return { kind: 'card-already-reduced', cardId };
  return null;
}

/** Validates a place-on-shelf request. Used when the player drags a
 *  fresh card from the deck onto the shelf. */
export function validatePlace(
  shelf: ShelfPlacement[],
  card: ContextCard,
  budget: number,
): ContextError | null {
  const newTotal = tokensUsed(shelf) + card.tokens;
  if (budget > 0 && newTotal > budget) {
    return { kind: 'budget-exceeded', over: newTotal - budget };
  }
  return null;
}

// ─── Grade computation ───────────────────────────────────────────

/** Compute a session-end grade across one or more answered turns. */
export function computeGrade(turns: ConversationTurn[]): ContextGrade {
  const totalQuestions = turns.length;
  if (totalQuestions === 0) {
    return {
      totalQuestions: 0,
      correctAnswers: 0,
      meanAccuracy: 0,
      meanRot: 0,
      tokensUsed: 0,
      bestRoundAccuracy: 0,
      stars: 0,
      summary: 'No turns played yet.',
    };
  }

  const correctAnswers = turns.filter((t) => t.accuracy >= 0.7).length;
  const meanAccuracy = turns.reduce((s, t) => s + t.accuracy, 0) / totalQuestions;
  const meanRot = turns.reduce((s, t) => s + t.rotAtAnswer, 0) / totalQuestions;
  const bestRoundAccuracy = Math.max(...turns.map((t) => t.accuracy));

  const stars: 0 | 1 | 2 | 3 =
    meanAccuracy >= 0.85 ? 3
    : meanAccuracy >= 0.65 ? 2
    : meanAccuracy >= 0.4 ? 1
    : 0;

  const summary =
    stars === 3 ? 'Crisp shelf curation across the board. Nearly zero Rot.'
    : stars === 2 ? 'Solid context engineering. A few rounds had too many decoys.'
    : stars === 1 ? 'You found some answers. Try Reducing or Offloading more aggressively.'
    : 'Lots of rot. Aim for the smallest shelf that still answers the question.';

  return {
    totalQuestions,
    correctAnswers,
    meanAccuracy,
    meanRot,
    tokensUsed: 0, // computed by caller if needed
    bestRoundAccuracy,
    stars,
    summary,
  };
}

// ─── Move metadata for the UI ────────────────────────────────────

export const MOVE_META: Record<ContextMove, MoveDescriptor> = {
  offload: {
    move: 'offload',
    turnCost: 0,
    label: 'Offload',
    hint: 'Move card to external memory. Free. Costs 1 retrieval to bring it back.',
    emoji: '📤',
  },
  retrieve: {
    move: 'retrieve',
    turnCost: 1,
    label: 'Retrieve',
    hint: 'Pull a card back from external memory. Costs 1 turn.',
    emoji: '📥',
  },
  isolate: {
    move: 'isolate',
    turnCost: 0,
    label: 'Isolate',
    hint: 'Hide this card from the next agent only. Free.',
    emoji: '🙈',
  },
  reduce: {
    move: 'reduce',
    turnCost: 0,
    label: 'Reduce',
    hint: 'Summarize: half the tokens, but the card loses some value (decay).',
    emoji: '🗜️',
  },
};

// ─── Error explainer ─────────────────────────────────────────────

export function explainError(e: ContextError): string {
  switch (e.kind) {
    case 'budget-exceeded':
      return `Budget exceeded by ${e.over} tokens. Try reducing or offloading something.`;
    case 'card-not-on-shelf':
      return `That card isn\'t on the shelf right now.`;
    case 'card-already-reduced':
      return `That card is already reduced.`;
    case 'card-already-isolated':
      return `That card is already isolated.`;
    case 'no-question-active':
      return `Pick a question first.`;
  }
}
