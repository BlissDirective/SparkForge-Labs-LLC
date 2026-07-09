// ════════════════════════════════════════════════════════════════
// adaptiveStore — G5: invisible client-side adaptive difficulty
// ════════════════════════════════════════════════════════════════
// The server-side adaptive system (AdaptiveEngine + /api/adaptive +
// AdaptiveCurveCard) shipped earlier but was never fed by gameplay —
// no game recorded a sample, so the recommended level never moved.
// This store closes the loop entirely on the client: every game
// completion folds a performance sample (via the SAME pure engine
// functions, so client and future server math agree), tracked per
// child × lab with single-step hysteresis. Games read the resulting
// recommendation to pick a starting difficulty — invisibly, no UI.
//
// It also keeps a capped per-game outcome log (learning-outcome
// telemetry) so future content decisions can use real data. Both
// slices persist to localStorage; nothing here needs a DB or schema
// change. Server persistence (to light up the parent learning-curve
// card with cross-device history) remains a separate follow-up gated
// on the `adaptive_difficulty` table.

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  applySample,
  defaultState,
  type AdaptiveState,
  type DifficultyLevel,
  type PerformanceSample,
} from '@/lib/adaptive/AdaptiveEngine';

/** One recorded game completion — the raw telemetry row. */
export interface OutcomeEvent {
  childId: string;
  gameSlug: string;
  labId: number;
  /** Accuracy 0..1 that drove the sample. */
  accuracy: number;
  /** Stars 0..3 the game reported. */
  stars: number;
  /** Difficulty the controller recommends AFTER this outcome. */
  level: DifficultyLevel;
  /** ISO timestamp. */
  at: string;
}

/** Cap the telemetry log so localStorage never grows unbounded. */
export const OUTCOME_LOG_CAP = 250;

export interface RecordOutcomeInput {
  childId: string;
  gameSlug: string;
  labId: number;
  /** Correct-answer ratio 0..1. */
  accuracy: number;
  /** Stars 0..3 (for the telemetry row + a fallback accuracy signal). */
  stars: number;
  /** Optional richer signals; sensible neutral defaults otherwise. */
  speedScore?: number;
  hintRate?: number;
  retryRate?: number;
  /** Injected clock for deterministic tests. */
  at?: Date;
}

interface AdaptiveStoreState {
  /** Per child×lab adaptive state, keyed `${childId}:${labId}`. */
  byKey: Record<string, AdaptiveState>;
  /** Capped per-game outcome telemetry (most recent last). */
  outcomes: OutcomeEvent[];
  /** Fold a completion into the adaptive state; returns the new level. */
  recordOutcome: (input: RecordOutcomeInput) => DifficultyLevel;
  /** Adaptive state for a child×lab, or null if never sampled. */
  stateFor: (childId: string | null, labId: number) => AdaptiveState | null;
  /** Recent outcomes for a child (most recent first), optionally 1 lab. */
  outcomesFor: (childId: string, labId?: number) => OutcomeEvent[];
  /** Forget everything for a child (e.g. profile deletion). */
  clearForChild: (childId: string) => void;
}

export function adaptiveKey(childId: string, labId: number): string {
  return `${childId}:${labId}`;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export const useAdaptiveStore = create<AdaptiveStoreState>()(
  persist(
    (set, get) => ({
      byKey: {},
      outcomes: [],

      recordOutcome: ({
        childId,
        gameSlug,
        labId,
        accuracy,
        stars,
        speedScore = 0.5,
        hintRate = 0,
        retryRate = 0,
        at = new Date(),
      }) => {
        const key = adaptiveKey(childId, labId);
        const prev = get().byKey[key] ?? defaultState();
        const sample: PerformanceSample = {
          accuracy: clamp01(accuracy),
          speedScore: clamp01(speedScore),
          hintRate: clamp01(hintRate),
          retryRate: clamp01(retryRate),
        };
        const next = applySample(prev, sample, at);

        const event: OutcomeEvent = {
          childId,
          gameSlug,
          labId,
          accuracy: clamp01(accuracy),
          stars,
          level: next.level,
          at: at.toISOString(),
        };

        set((s) => ({
          byKey: { ...s.byKey, [key]: next },
          outcomes: [...s.outcomes, event].slice(-OUTCOME_LOG_CAP),
        }));

        return next.level;
      },

      stateFor: (childId, labId) => {
        if (!childId) return null;
        return get().byKey[adaptiveKey(childId, labId)] ?? null;
      },

      outcomesFor: (childId, labId) =>
        get()
          .outcomes.filter(
            (o) => o.childId === childId && (labId === undefined || o.labId === labId),
          )
          .reverse(),

      clearForChild: (childId) =>
        set((s) => ({
          byKey: Object.fromEntries(
            Object.entries(s.byKey).filter(([k]) => !k.startsWith(`${childId}:`)),
          ),
          outcomes: s.outcomes.filter((o) => o.childId !== childId),
        })),
    }),
    {
      name: 'sparkforge-adaptive',
      version: 1,
      partialize: (s) => ({ byKey: s.byKey, outcomes: s.outcomes }),
    },
  ),
);
