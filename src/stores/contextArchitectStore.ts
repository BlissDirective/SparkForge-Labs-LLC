// src/stores/contextArchitectStore.ts
// ════════════════════════════════════════════════════════════════
// CONTEXT ARCHITECT STORE — Stage 11B (C2, Lab 8)
// ════════════════════════════════════════════════════════════════
// Per-session state for the context-engineering game. No Supabase
// persistence per Doc 2 §E.10 — all session state.
//
// Persisted slice: tutorialSeen + lastMode + bestScore.
// Transient slice: shelf + external memory + active question +
// rot + accuracy + run history.
// ════════════════════════════════════════════════════════════════

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ContextCard,
  ContextError,
  ContextMode,
  ConversationTurn,
  ExternalPlacement,
  Question,
  ShelfPlacement,
} from '@/types/contextArchitect';
import {
  computeAccuracy,
  computeRot,
  tokensUsed,
  validateIsolate,
  validateOffload,
  validatePlace,
  validateReduce,
  validateRetrieve,
  computeGrade,
  explainError,
} from '@/lib/contextarch/budgetEngine';
import { getCard } from '@/lib/contextarch/cardLibrary';
import { questionsForBand, questionsByDifficulty, QUESTION_LIBRARY } from '@/lib/contextarch/questionLibrary';

// ─── Phase machine ───────────────────────────────────────────────

export type ContextArchitectPhase =
  | 'welcome'
  | 'learn-shelf'
  | 'learn-budget'
  | 'learn-moves'
  | 'learn-rot'
  | 'tutorial'
  | 'sort-mode'
  | 'budget-mode'
  | 'multi-turn-mode'
  | 'rot-boss'
  | 'design-shelf'
  | 'report';

// ─── Persisted shape ─────────────────────────────────────────────

interface ContextArchitectPersisted {
  tutorialSeen: { shelf: boolean; budget: boolean; moves: boolean; rot: boolean; tutorial: boolean };
  lastMode: ContextMode;
  bestScore: number;
}

// ─── Transient shape ─────────────────────────────────────────────

interface ContextArchitectTransient {
  phase: ContextArchitectPhase;

  // Shelf state
  shelf: ShelfPlacement[];
  external: ExternalPlacement[];
  budget: number;
  turn: number;

  // Active question
  currentQuestion: Question | null;

  // Computed (cached for cheap reads in components)
  used: number;
  rot: number;
  accuracy: number;

  // Mode + history
  mode: ContextMode;
  turnsThisSession: ConversationTurn[];

  // UI surfaces
  lastError: string | null;
  /** Card id the user is hovering / inspecting in the deck. */
  inspectCardId: string | null;
}

type ContextArchitectState = ContextArchitectPersisted & ContextArchitectTransient & {
  setPhase: (p: ContextArchitectPhase) => void;
  beginGame: () => void;
  reset: () => void;
  markTutorialSeen: (k: keyof ContextArchitectPersisted['tutorialSeen']) => void;

  // Mode
  setMode: (m: ContextMode) => void;
  startMode: (m: ContextMode, band: 'A' | 'B' | 'C') => void;

  // Question control
  setQuestion: (q: Question) => void;
  nextQuestion: (band: 'A' | 'B' | 'C') => void;

  // Card actions (each writes shelf / external + recomputes rot/accuracy)
  placeCard: (cardId: string) => boolean;
  offloadCard: (cardId: string) => boolean;
  retrieveCard: (cardId: string) => boolean;
  isolateCard: (cardId: string) => boolean;
  reduceCard: (cardId: string) => boolean;
  removeCard: (cardId: string) => void;

  // Turn / answer flow
  answerCurrentQuestion: () => void;

  // Inspect
  setInspect: (cardId: string | null) => void;

  // Cached recompute hook
  recompute: () => void;
};

const TRANSIENT_INITIAL: ContextArchitectTransient = {
  phase: 'welcome',
  shelf: [],
  external: [],
  budget: 256,
  turn: 0,
  currentQuestion: null,
  used: 0,
  rot: 0,
  accuracy: 0,
  mode: 'sort',
  turnsThisSession: [],
  lastError: null,
  inspectCardId: null,
};

// Default budgets per Doc 2 §E.4 — sort-mode is generous, rot-boss
// shrinks, etc.
const MODE_BUDGETS: Record<ContextMode, number> = {
  'sort':         512,  // generous, no real budget pressure
  'budget':       128,  // tight
  'multi-turn':   192,  // medium
  'rot-boss':     96,   // hard, shrinks each round (handled in startMode)
  'design-shelf': 320,  // free-play medium
};

// ─── Store ───────────────────────────────────────────────────────

export const useContextArchitectStore = create<ContextArchitectState>()(
  persist(
    (set, get) => ({
      tutorialSeen: { shelf: false, budget: false, moves: false, rot: false, tutorial: false },
      lastMode: 'sort',
      bestScore: 0,
      ...TRANSIENT_INITIAL,

      setPhase: (p) => set({ phase: p }),

      beginGame: () => {
        const { tutorialSeen } = get();
        const next: ContextArchitectPhase =
          !tutorialSeen.shelf ? 'learn-shelf'
          : !tutorialSeen.budget ? 'learn-budget'
          : !tutorialSeen.moves ? 'learn-moves'
          : !tutorialSeen.rot ? 'learn-rot'
          : !tutorialSeen.tutorial ? 'tutorial'
          : 'sort-mode';
        set({ phase: next });
      },

      reset: () => set({ ...TRANSIENT_INITIAL }),

      markTutorialSeen: (k) =>
        set((s) => ({ tutorialSeen: { ...s.tutorialSeen, [k]: true } })),

      // ── Mode ───────────────────────────────────────────────
      setMode: (m) => set({ mode: m, lastMode: m }),

      startMode: (mode, band) => {
        const budget = MODE_BUDGETS[mode];
        // Pick a starting question appropriate to the mode.
        const eligible = mode === 'rot-boss'
          ? questionsByDifficulty('hard').filter((q) => q.band.includes(band))
          : mode === 'sort'
          ? questionsByDifficulty('easy').filter((q) => q.band.includes(band))
          : questionsForBand(band);
        const first = eligible[0] ?? QUESTION_LIBRARY[0];
        set({
          mode,
          lastMode: mode,
          budget,
          shelf: [],
          external: [],
          turn: 0,
          turnsThisSession: [],
          currentQuestion: first,
          used: 0,
          rot: 0,
          accuracy: 0,
          lastError: null,
          phase: mode === 'rot-boss' ? 'rot-boss'
                : mode === 'multi-turn' ? 'multi-turn-mode'
                : mode === 'budget' ? 'budget-mode'
                : mode === 'design-shelf' ? 'design-shelf'
                : 'sort-mode',
        });
      },

      // ── Question control ──────────────────────────────────
      setQuestion: (q) => {
        set({ currentQuestion: q });
        get().recompute();
      },

      nextQuestion: (band) => {
        const { mode, turnsThisSession } = get();
        const seenIds = new Set(turnsThisSession.map((t) => t.questionId));
        const eligible = (
          mode === 'rot-boss'
            ? questionsByDifficulty('hard')
            : mode === 'sort'
            ? questionsByDifficulty('easy')
            : QUESTION_LIBRARY
        ).filter((q) => q.band.includes(band) && !seenIds.has(q.id));
        const next = eligible[0] ?? null;
        if (!next) return;
        // Rot-boss tightens the budget each round.
        const newBudget = mode === 'rot-boss'
          ? Math.max(48, get().budget - 16)
          : get().budget;
        set({
          currentQuestion: next,
          budget: newBudget,
        });
        get().recompute();
      },

      // ── Card actions ──────────────────────────────────────
      placeCard: (cardId) => {
        const card = getCard(cardId);
        if (!card) return false;
        const { shelf, budget, mode } = get();
        if (shelf.find((p) => p.cardId === cardId)) return false; // already placed
        // Sort mode + design-shelf have soft budgets (won't reject).
        const enforce = mode === 'budget' || mode === 'multi-turn' || mode === 'rot-boss';
        if (enforce) {
          const err = validatePlace(shelf, card, budget);
          if (err) {
            set({ lastError: explainError(err) });
            return false;
          }
        }
        const { turn } = get();
        const placement: ShelfPlacement = {
          cardId,
          position: shelf.length,
          reduced: false,
          isolated: false,
          placedAtTurn: turn,
        };
        set((s) => ({
          shelf: [...s.shelf, placement],
          lastError: null,
        }));
        get().recompute();
        return true;
      },

      offloadCard: (cardId) => {
        const { shelf, external, turn } = get();
        const err = validateOffload(shelf, cardId);
        if (err) {
          set({ lastError: explainError(err) });
          return false;
        }
        set({
          shelf: shelf.filter((p) => p.cardId !== cardId),
          external: [...external, { cardId, offloadedAtTurn: turn }],
          lastError: null,
        });
        get().recompute();
        return true;
      },

      retrieveCard: (cardId) => {
        const { shelf, external, budget, turn } = get();
        const err = validateRetrieve(external, shelf, cardId, budget);
        if (err) {
          set({ lastError: explainError(err) });
          return false;
        }
        // Retrieve costs 1 turn — increment turn counter.
        const newPlacement: ShelfPlacement = {
          cardId,
          position: shelf.length,
          reduced: false,
          isolated: false,
          placedAtTurn: turn + 1,
        };
        set({
          shelf: [...shelf, newPlacement],
          external: external.filter((p) => p.cardId !== cardId),
          turn: turn + 1,
          lastError: null,
        });
        get().recompute();
        return true;
      },

      isolateCard: (cardId) => {
        const { shelf } = get();
        const err = validateIsolate(shelf, cardId);
        if (err) {
          set({ lastError: explainError(err) });
          return false;
        }
        set({
          shelf: shelf.map((p) => p.cardId === cardId ? { ...p, isolated: true } : p),
          lastError: null,
        });
        get().recompute();
        return true;
      },

      reduceCard: (cardId) => {
        const { shelf } = get();
        const err = validateReduce(shelf, cardId);
        if (err) {
          set({ lastError: explainError(err) });
          return false;
        }
        set({
          shelf: shelf.map((p) => p.cardId === cardId ? { ...p, reduced: true } : p),
          lastError: null,
        });
        get().recompute();
        return true;
      },

      removeCard: (cardId) => {
        const { shelf, external } = get();
        set({
          shelf: shelf.filter((p) => p.cardId !== cardId),
          external: external.filter((p) => p.cardId !== cardId),
        });
        get().recompute();
      },

      // ── Turn / answer flow ─────────────────────────────────
      answerCurrentQuestion: () => {
        const { shelf, external, currentQuestion, accuracy, rot, turn, turnsThisSession, bestScore } = get();
        if (!currentQuestion) return;
        const turnRecord: ConversationTurn = {
          turnIndex: turn,
          questionId: currentQuestion.id,
          shelfSnapshotIds: shelf.map((p) => p.cardId),
          externalSnapshotIds: external.map((p) => p.cardId),
          accuracy,
          rotAtAnswer: rot,
        };
        const updatedTurns = [...turnsThisSession, turnRecord];
        const grade = computeGrade(updatedTurns);
        const score = Math.round(grade.meanAccuracy * 100);
        set({
          turnsThisSession: updatedTurns,
          turn: turn + 1,
          bestScore: Math.max(bestScore, score),
        });
      },

      // ── Inspect ────────────────────────────────────────────
      setInspect: (cardId) => set({ inspectCardId: cardId }),

      // ── Recompute (cached) ────────────────────────────────
      recompute: () => {
        const { shelf, currentQuestion, budget } = get();
        set({
          used: tokensUsed(shelf),
          rot: computeRot(shelf, currentQuestion, budget),
          accuracy: computeAccuracy(shelf, currentQuestion),
        });
      },
    }),
    {
      name: 'sparkforge-context-architect',
      partialize: (s): ContextArchitectPersisted => ({
        tutorialSeen: s.tutorialSeen,
        lastMode: s.lastMode,
        bestScore: s.bestScore,
      }),
    },
  ),
);
