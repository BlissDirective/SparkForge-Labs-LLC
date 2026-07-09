// ════════════════════════════════════════════════════════════════
// useRecommendedDifficulty — G5: read the invisible adaptive signal
// ════════════════════════════════════════════════════════════════
// Games call this on mount to pick a starting difficulty that matches
// how the active child has recently been doing in that lab. Returns
// `level: null` until enough samples exist (the controller waits for
// MIN_SAMPLES_TO_ADAPT), so callers fall back to their own default
// and nothing changes for a brand-new child.

'use client';

import { useMemo } from 'react';
import { useAdaptiveStore } from '@/stores/adaptiveStore';
import { useActiveChild } from '@/hooks/useChildren';
import { adaptiveKey, type OutcomeEvent } from '@/stores/adaptiveStore';
import type { DifficultyLevel } from '@/lib/adaptive/AdaptiveEngine';

export interface RecommendedDifficulty {
  /** Recommended level, or null when there isn't enough history yet. */
  level: DifficultyLevel | null;
  /** How many samples back the recommendation. */
  samples: number;
  /** Rolling performance 0..1 (0.5 default), for optional display. */
  performance: number;
}

/**
 * Recommended difficulty for the active child in a given lab. Reads the
 * persisted adaptive state; returns a stable object reference-free by
 * selecting the underlying state object (stable until it changes).
 */
export function useRecommendedDifficulty(labId: number): RecommendedDifficulty {
  const childId = useActiveChild()?.id ?? null;
  const state = useAdaptiveStore((s) =>
    childId ? s.byKey[adaptiveKey(childId, labId)] : undefined,
  );

  if (!state || state.samples === 0) {
    return { level: null, samples: 0, performance: 0.5 };
  }
  return { level: state.level, samples: state.samples, performance: state.performance };
}

/** Recent per-game outcomes for the active child (most recent first). */
export function useChildOutcomes(labId?: number): OutcomeEvent[] {
  const childId = useActiveChild()?.id ?? null;
  // Select the stable array reference; derive the filtered view with a
  // memo so the selector never returns a fresh array each render.
  const outcomes = useAdaptiveStore((s) => s.outcomes);
  return useMemo(() => {
    if (!childId) return [];
    return outcomes
      .filter((o) => o.childId === childId && (labId === undefined || o.labId === labId))
      .reverse();
  }, [outcomes, childId, labId]);
}
