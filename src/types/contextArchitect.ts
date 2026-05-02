// src/types/contextArchitect.ts
// ════════════════════════════════════════════════════════════════
// Stage 11B — Context Architect (C2, Lab 8 — Words & Language)
// ════════════════════════════════════════════════════════════════
// Shared types for the context-engineering game. Pedagogical core:
// kid manages a fixed-size "context shelf" via 4 canonical moves
// (Offload / Retrieve / Isolate / Reduce) per Doc 1 §4.1-§4.5. As the
// shelf gets crowded, Context Rot rises and accuracy drops.
//
// All session-only - no Supabase schema.
// ════════════════════════════════════════════════════════════════

import type { AgeBand } from '@/config/gameRegistry';

// ─── Knowledge card ──────────────────────────────────────────────

export type CardTheme = 'animals' | 'space' | 'tech' | 'body' | 'earth' | 'math';

/** Card token cost — only 4 sizes per Doc 2 §E.5. */
export type CardTokenSize = 8 | 16 | 32 | 64;

export interface ContextCard {
  id: string;
  theme: CardTheme;
  /** ≤ 90-char fact. */
  text: string;
  /** ≤ 32-char title shown on the slab. */
  title: string;
  /** Token cost on the shelf. */
  tokens: CardTokenSize;
  /** Knowledge themes this card serves (sometimes a card serves multiple
   *  cross-theme questions — e.g., a "fish circulatory system" card matches
   *  both 'animals' and 'body'). Used by the relevance engine. */
  serves: CardTheme[];
  /** Loss factor applied when REDUCED. 0.1 = pristine compression,
   *  0.9 = lossy summary that throws away most of the card's value. */
  decay: number;
  /** Decorative emoji. */
  emoji: string;
  /** Age-band gate. */
  unlockTier: AgeBand;
}

/** A reduced (summarized) variant of a card — half the tokens, but the
 *  card's `decay` factor is applied to its effective relevance. */
export interface ReducedCard {
  base: ContextCard;
  /** Half tokens, rounded down to the nearest size. */
  reducedTokens: CardTokenSize;
}

// ─── Shelf state ─────────────────────────────────────────────────

/** A card currently placed on the shelf, in some state. */
export interface ShelfPlacement {
  cardId: string;
  /** Order on the shelf (used for layout + 'oldest-first' eviction). */
  position: number;
  /** Whether this card has been REDUCED (summary-form). */
  reduced: boolean;
  /** Whether this card is ISOLATED (hidden from the next agent only). */
  isolated: boolean;
  /** Turn this card was placed (for freshness/decay). */
  placedAtTurn: number;
}

/** A card moved off the shelf into external memory. */
export interface ExternalPlacement {
  cardId: string;
  /** Turn the card was offloaded. Retrieving costs 1 turn. */
  offloadedAtTurn: number;
}

// ─── Question ────────────────────────────────────────────────────

export interface Question {
  id: string;
  /** Kid-readable question text. */
  text: string;
  /** Card ids that fully answer this question (the "key cards"). */
  keyCardIds: string[];
  /** Optional decoy card ids - look related but don't help. */
  decoyCardIds: string[];
  /** Difficulty - drives initial budget and rot threshold. */
  difficulty: 'easy' | 'medium' | 'hard';
  /** Age-band gate. */
  band: AgeBand[];
  /** Optional hint shown if the player gets stuck. */
  hint?: string;
}

// ─── The 4 moves ─────────────────────────────────────────────────

export type ContextMove = 'offload' | 'retrieve' | 'isolate' | 'reduce';

export interface MoveDescriptor {
  move: ContextMove;
  /** Turn cost (0 = free, 1 = costs the next turn). */
  turnCost: number;
  /** Kid-readable label. */
  label: string;
  /** ≤ 100-char hint. */
  hint: string;
  /** Decorative emoji. */
  emoji: string;
}

// ─── Game modes ──────────────────────────────────────────────────

export type ContextMode =
  | 'sort'           // Loop 1: pick relevant cards, no token budget
  | 'budget'         // Loop 2: same, under a strict token budget
  | 'multi-turn'     // Loop 3: rolling history across turns
  | 'rot-boss'       // Boss: 50 cards, shrinking budget
  | 'design-shelf';  // Free play

// ─── Turn record (multi-turn mode) ───────────────────────────────

export interface ConversationTurn {
  turnIndex: number;
  questionId: string;
  /** Cards on the shelf at the moment the turn was answered. */
  shelfSnapshotIds: string[];
  /** External-memory snapshot (offloaded cards). */
  externalSnapshotIds: string[];
  /** Computed accuracy 0..1 — how well the shelf answered the question. */
  accuracy: number;
  /** Rot level at the moment of answer. */
  rotAtAnswer: number;
}

// ─── Score / grade ───────────────────────────────────────────────

export interface ContextGrade {
  totalQuestions: number;
  correctAnswers: number;
  /** Mean accuracy across all answered questions, 0..1. */
  meanAccuracy: number;
  /** Average rot level across all turns - lower is better. */
  meanRot: number;
  /** Total tokens used (cumulative across rounds). */
  tokensUsed: number;
  /** Highest single-round accuracy. */
  bestRoundAccuracy: number;
  /** Stars 0..3. */
  stars: 0 | 1 | 2 | 3;
  /** ≤ 200-char summary text. */
  summary: string;
}

// ─── Errors ──────────────────────────────────────────────────────

export type ContextError =
  | { kind: 'budget-exceeded'; over: number }
  | { kind: 'card-not-on-shelf'; cardId: string }
  | { kind: 'card-already-reduced'; cardId: string }
  | { kind: 'card-already-isolated'; cardId: string }
  | { kind: 'no-question-active' };
