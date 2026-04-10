'use client';

import { useMemo } from 'react';
import type { DifficultyTier } from '@/components/games/DifficultySelector';

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

interface FilterableItem {
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  band?: 'A' | 'B' | 'C';
}

/**
 * Filters content items by difficulty tier and age band.
 * - 'all' tier returns everything accessible to the current age band
 * - Specific tier filters to that difficulty only
 * - Age band gates: easy/medium for all, hard for B+, expert for C only
 */
export function useFilteredContent<T extends FilterableItem>(
  items: T[],
  tier: DifficultyTier | 'all',
  ageBand: 'A' | 'B' | 'C'
): T[] {
  return useMemo(() => {
    return items.filter(item => {
      // Filter by age band (if item has band field)
      if (item.band && BAND_ORDER[item.band] > BAND_ORDER[ageBand]) return false;
      // Filter by difficulty tier
      if (tier === 'all') return true;
      if (!item.difficulty) return true; // Items without difficulty are always included
      return item.difficulty === tier;
    });
  }, [items, tier, ageBand]);
}

/**
 * Get game parameters adjusted by difficulty tier.
 * Easy = participation scoring, Expert = strict scoring.
 */
export function useGameParams(tier: DifficultyTier | 'all') {
  return useMemo(() => ({
    timer: tier === 'expert' ? 4 : tier === 'hard' ? 5 : tier === 'medium' ? 6 : 7,
    hintsAvailable: tier === 'expert' ? 0 : tier === 'hard' ? 1 : 3,
    scoreCorrect: 10,
    scoreWrong: tier === 'easy' ? 3 : tier === 'medium' ? 0 : tier === 'hard' ? -3 : tier === 'expert' ? -5 : 0,
  }), [tier]);
}
