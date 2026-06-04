// ════════════════════════════════════════════════════
// useStreak — React Hook for Streak State Management
// Connects StreakEngine to the UI with server sync
// ════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import type {
  StreakState,
  StreakActivityResult,
  StreakDay,
  StreakMilestone,
  StreakWager,
} from '@/lib/streak/StreakEngine';
import {
  processDailyActivity,
  getNextMilestone,
  getDaysUntilNextMilestone,
  getReachedMilestones,
  isStreakAtRisk,
  getStreakMotivationMessage,
  getStreakMultiplier,
  getSocietyBenefits,
  generateStreakCalendar,
  getTodayUTC,
  STREAK_MILESTONES,
} from '@/lib/streak/StreakEngine';
import { apiFetchResponse } from '@/lib/api';

export interface UseStreakReturn {
  // State
  streakState: StreakState | null;
  isLoading: boolean;
  error: string | null;

  // Computed
  streakCount: number;
  longestStreak: number;
  freezesAvailable: number;
  freezesEquipped: number;
  activeWager: StreakWager | null;
  isStreakSocietyMember: boolean;
  nextMilestone: StreakMilestone | null;
  daysUntilMilestone: number;
  xpMultiplier: number;
  streakAtRisk: boolean;
  motivationMessage: string;
  calendar: ReturnType<typeof generateStreakCalendar>;
  reachedMilestones: StreakMilestone[];
  societyBenefits: ReturnType<typeof getSocietyBenefits>;

  // Actions
  recordActivity: () => Promise<StreakActivityResult | null>;
  equipFreeze: () => Promise<boolean>;
  unequipFreeze: () => Promise<boolean>;
  placeWager: (type: '7-day' | '14-day') => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useStreak(childId: string | null): UseStreakReturn {
  const [streakState, setStreakState] = useState<StreakState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = getTodayUTC();

  // Fetch streak state from server
  const fetchStreakState = useCallback(async () => {
    if (!childId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await apiFetchResponse(`/api/gamification/streak?childId=${childId}`);
      const data = await res.json();

      if (data.success) {
        // Build full StreakState from server response
        const state: StreakState = {
          streakCount: data.data.streak_count ?? 0,
          longestStreak: data.data.longest_streak ?? data.data.streak_count ?? 0,
          streakLastDate: data.data.streak_last_date,
          streakStartedDate: data.data.streak_started_date,
          freezesAvailable: data.data.freezes_available ?? 0,
          freezesEquipped: data.data.freezes_equipped ?? 0,
          totalFreezesEarned: data.data.total_freezes_earned ?? 0,
          activeWager: data.data.active_wager,
          wagerHistory: data.data.wager_history ?? [],
          isStreakSocietyMember: (data.data.streak_count ?? 0) >= 7,
          societyJoinedAt: data.data.society_joined_at,
          last30Days: data.data.last_30_days ?? [],
          nextMilestone: null, // Computed
          daysUntilMilestone: 0, // Computed
        };
        setStreakState(state);
      } else {
        setError(data.message || 'Failed to load streak data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load streak data');
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  // Initial fetch
  useEffect(() => {
    fetchStreakState();
  }, [fetchStreakState]);

  // Record daily activity
  const recordActivity = useCallback(async (): Promise<StreakActivityResult | null> => {
    if (!childId || !streakState) return null;

    try {
      // Optimistic local update using engine
      const result = processDailyActivity(streakState, today);

      // Sync with server
      const res = await apiFetchResponse('/api/gamification/streak', {
        method: 'POST',
        body: JSON.stringify({ childId }),
      });
      const data = await res.json();

      if (data.success) {
        // Refetch to get server-authoritative state
        await fetchStreakState();
        return result;
      } else {
        setError(data.message || 'Failed to record activity');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record activity');
      return null;
    }
  }, [childId, streakState, today, fetchStreakState]);

  // Equip a freeze
  const equipFreeze = useCallback(async (): Promise<boolean> => {
    if (!childId) return false;

    try {
      const res = await apiFetchResponse('/api/gamification/streak/freeze', {
        method: 'POST',
        body: JSON.stringify({ childId, action: 'equip' }),
      });
      const data = await res.json();

      if (data.success) {
        await fetchStreakState();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [childId, fetchStreakState]);

  // Unequip a freeze
  const unequipFreeze = useCallback(async (): Promise<boolean> => {
    if (!childId) return false;

    try {
      const res = await apiFetchResponse('/api/gamification/streak/freeze', {
        method: 'POST',
        body: JSON.stringify({ childId, action: 'unequip' }),
      });
      const data = await res.json();

      if (data.success) {
        await fetchStreakState();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [childId, fetchStreakState]);

  // Place a wager
  const placeWager = useCallback(async (type: '7-day' | '14-day'): Promise<boolean> => {
    if (!childId) return false;

    try {
      const res = await apiFetchResponse('/api/gamification/streak/wager', {
        method: 'POST',
        body: JSON.stringify({ childId, wagerType: type }),
      });
      const data = await res.json();

      if (data.success) {
        await fetchStreakState();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [childId, fetchStreakState]);

  // Computed values
  const computed = useMemo(() => {
    if (!streakState) {
      return {
        streakCount: 0,
        longestStreak: 0,
        freezesAvailable: 0,
        freezesEquipped: 0,
        activeWager: null,
        isStreakSocietyMember: false,
        nextMilestone: null,
        daysUntilMilestone: 0,
        xpMultiplier: 1,
        streakAtRisk: false,
        motivationMessage: 'Start your streak today!',
        calendar: [],
        reachedMilestones: [],
        societyBenefits: { xpBonusPercent: 0, gemBonusPercent: 0, dailyGemReward: 0, title: '' },
      };
    }

    const streakCount = streakState.streakCount;
    const nextMilestone = getNextMilestone(streakCount);
    const daysUntilMilestone = getDaysUntilNextMilestone(streakCount);
    const streakAtRisk = isStreakAtRisk(streakState.streakLastDate, today);

    return {
      streakCount,
      longestStreak: streakState.longestStreak,
      freezesAvailable: streakState.freezesAvailable,
      freezesEquipped: streakState.freezesEquipped,
      activeWager: streakState.activeWager,
      isStreakSocietyMember: streakState.isStreakSocietyMember,
      nextMilestone,
      daysUntilMilestone,
      xpMultiplier: getStreakMultiplier(streakCount),
      streakAtRisk,
      motivationMessage: getStreakMotivationMessage(streakCount, streakAtRisk),
      calendar: generateStreakCalendar(
        streakState.last30Days,
        streakCount,
        streakState.streakLastDate,
        today,
      ),
      reachedMilestones: getReachedMilestones(streakCount),
      societyBenefits: getSocietyBenefits(streakCount),
    };
  }, [streakState, today]);

  return {
    streakState,
    isLoading,
    error,
    ...computed,
    recordActivity,
    equipFreeze,
    unequipFreeze,
    placeWager,
    refresh: fetchStreakState,
  };
}
