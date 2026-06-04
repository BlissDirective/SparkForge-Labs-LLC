// ════════════════════════════════════════════════════
// useCurrency — React Hook for Gem Currency
// Manages wallet state with server sync
// ════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { CurrencyWallet } from '@/lib/currency/CurrencyEngine';
import {
  claimDailyReward,
  canClaimDailyReward,
  getNextDailyRewardDay,
  getDailyReward,
} from '@/lib/currency/CurrencyEngine';
import { apiFetchResponse } from '@/lib/api';

export interface UseCurrencyReturn {
  wallet: CurrencyWallet | null;
  isLoading: boolean;
  error: string | null;

  // Computed
  gems: number;
  canClaimDaily: boolean;
  nextDailyRewardDay: number;
  nextDailyReward: ReturnType<typeof getDailyReward>;
  dailyStreak: number;

  // Actions
  claimDaily: () => Promise<boolean>;
  awardGems: (amount: number, reason: string) => Promise<boolean>;
  spendGems: (amount: number, reason: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useCurrency(childId: string | null): UseCurrencyReturn {
  const [wallet, setWallet] = useState<CurrencyWallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    if (!childId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await apiFetchResponse(`/api/currency/wallet?childId=${childId}`);
      const data = await res.json();

      if (data.success) {
        setWallet({
          childId,
          gems: data.data.gems ?? 0,
          gemsEarnedLifetime: data.data.gems_earned_lifetime ?? 0,
          gemsSpentLifetime: data.data.gems_spent_lifetime ?? 0,
          streakFreezesOwned: data.data.streak_freezes_owned ?? 0,
          streakFreezesEquipped: data.data.streak_freezes_equipped ?? 0,
          lastDailyReward: data.data.last_daily_reward,
          dailyRewardStreak: data.data.daily_reward_streak ?? 0,
        });
      } else {
        setError(data.message || 'Failed to load wallet');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet');
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const claimDaily = useCallback(async (): Promise<boolean> => {
    if (!childId || !wallet) return false;

    try {
      const res = await apiFetchResponse('/api/currency/daily-reward', {
        method: 'POST',
        body: JSON.stringify({ childId }),
      });
      const data = await res.json();

      if (data.success) {
        await fetchWallet();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [childId, wallet, fetchWallet]);

  const awardGems = useCallback(async (amount: number, reason: string): Promise<boolean> => {
    if (!childId) return false;

    try {
      const res = await apiFetchResponse('/api/currency/award', {
        method: 'POST',
        body: JSON.stringify({ childId, amount, reason }),
      });
      const data = await res.json();

      if (data.success) {
        await fetchWallet();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [childId, fetchWallet]);

  const spendGems = useCallback(async (amount: number, reason: string): Promise<boolean> => {
    if (!childId) return false;

    try {
      const res = await apiFetchResponse('/api/currency/spend', {
        method: 'POST',
        body: JSON.stringify({ childId, amount, reason }),
      });
      const data = await res.json();

      if (data.success) {
        await fetchWallet();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [childId, fetchWallet]);

  const computed = useMemo(() => {
    if (!wallet) {
      return {
        gems: 0,
        canClaimDaily: false,
        nextDailyRewardDay: 1,
        nextDailyReward: getDailyReward(1),
        dailyStreak: 0,
      };
    }

    const canClaimDaily = canClaimDailyReward(wallet);
    const nextDay = getNextDailyRewardDay(wallet);

    return {
      gems: wallet.gems,
      canClaimDaily,
      nextDailyRewardDay: nextDay,
      nextDailyReward: getDailyReward(nextDay),
      dailyStreak: wallet.dailyRewardStreak,
    };
  }, [wallet]);

  return {
    wallet,
    isLoading,
    error,
    ...computed,
    claimDaily,
    awardGems,
    spendGems,
    refresh: fetchWallet,
  };
}
