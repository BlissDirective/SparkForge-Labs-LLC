// ════════════════════════════════════════════════════
// useLeaderboard — React Hook for League/Leaderboard
// Weekly league data with server sync
// ════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { LeaderboardEntry, LeagueTier } from '@/lib/leaderboard/LeaderboardEngine';
import {
  getLeagueConfig,
  isInPromotionZone,
  isInDemotionZone,
  getWeekStart,
  getWeekEnd,
  getSecondsUntilLeagueReset,
  formatTimeUntilReset,
  LEAGUE_ORDER,
} from '@/lib/leaderboard/LeaderboardEngine';
import { apiFetch } from '@/lib/api';

export interface UseLeaderboardReturn {
  // Data
  entries: LeaderboardEntry[];
  userRank: number | null;
  userEntry: LeaderboardEntry | null;
  isLoading: boolean;
  error: string | null;

  // League info
  currentTier: LeagueTier | null;
  weekStart: string;
  weekEnd: string;
  timeUntilReset: string;
  secondsUntilReset: number;

  // Zones
  isInPromotionZone: boolean;
  isInDemotionZone: boolean;
  isSafe: boolean;

  // Config
  leagueConfig: ReturnType<typeof getLeagueConfig> | null;
  canAccessTier: (tier: LeagueTier) => boolean;

  // Progression
  progression: {
    currentTier: LeagueTier | null;
    nextTier: LeagueTier | null;
    previousTier: LeagueTier | null;
    xpToNextTier: number;
  } | null;

  // Actions
  refresh: () => Promise<void>;
}

export function useLeaderboard(childId: string | null): UseLeaderboardReturn {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentTier, setCurrentTier] = useState<LeagueTier | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [progression, setProgression] = useState<UseLeaderboardReturn['progression']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsUntil, setSecondsUntil] = useState(() => getSecondsUntilLeagueReset());

  const weekStart = useMemo(() => getWeekStart(), []);
  const weekEnd = useMemo(() => getWeekEnd(), []);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsUntil(getSecondsUntilLeagueReset());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    if (!childId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await apiFetch(`/api/leaderboard?childId=${childId}`);
      const data = await res.json();

      if (data.success) {
        setEntries(data.data.entries || []);
        setCurrentTier(data.data.tier || 'bronze');
        setUserRank(data.data.userRank || null);
        setProgression(data.data.progression || null);
      } else {
        setError(data.message || 'Failed to load leaderboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Computed
  const userEntry = useMemo(() => {
    return entries.find(e => e.isCurrentUser) || null;
  }, [entries]);

  const tierConfig = useMemo(() => {
    return currentTier ? getLeagueConfig(currentTier) : null;
  }, [currentTier]);

  const promotionZone = useMemo(() => {
    if (!userRank || !entries.length || !currentTier) return false;
    return isInPromotionZone(userRank, entries.length, currentTier);
  }, [userRank, entries.length, currentTier]);

  const demotionZone = useMemo(() => {
    if (!userRank || !entries.length || !currentTier) return false;
    return isInDemotionZone(userRank, entries.length, currentTier);
  }, [userRank, entries.length, currentTier]);

  const canAccessTier = useCallback((tier: LeagueTier): boolean => {
    if (!currentTier) return tier === 'bronze';
    const currentIdx = LEAGUE_ORDER.indexOf(currentTier);
    const targetIdx = LEAGUE_ORDER.indexOf(tier);
    return targetIdx <= currentIdx + 1; // Can see current and next tier
  }, [currentTier]);

  return {
    entries,
    userRank,
    userEntry,
    isLoading,
    error,
    currentTier,
    weekStart,
    weekEnd,
    timeUntilReset: formatTimeUntilReset(secondsUntil),
    secondsUntilReset: secondsUntil,
    isInPromotionZone: promotionZone,
    isInDemotionZone: demotionZone,
    isSafe: !promotionZone && !demotionZone && entries.length > 0,
    leagueConfig: tierConfig,
    canAccessTier,
    progression,
    refresh: fetchLeaderboard,
  };
}
