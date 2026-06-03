// ════════════════════════════════════════════════════
// useQuests — React Hook for Daily Quest Management
// Fetches active quests, tracks progress, handles claims
// ════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { ActiveQuest, WeeklyQuestChain, QuestReward } from '@/lib/quests/QuestEngine';
import { selectDailyQuests, updateQuestProgress, claimQuestReward, allQuestsClaimed } from '@/lib/quests/QuestEngine';
import { QUEST_TEMPLATES } from '@/lib/quests/QuestEngine';
import { apiFetch } from '@/lib/api';

export interface UseQuestsReturn {
  // State
  quests: ActiveQuest[];
  weeklyChain: WeeklyQuestChain | null;
  isLoading: boolean;
  error: string | null;
  claimInProgress: string | null;

  // Computed
  completedCount: number;
  totalCount: number;
  allClaimed: boolean;
  streakDays: number;

  // Actions
  claimQuest: (questId: string) => Promise<QuestReward | null>;
  trackProgress: (type: string, amount: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useQuests(childId: string | null): UseQuestsReturn {
  const [quests, setQuests] = useState<ActiveQuest[]>([]);
  const [weeklyChain, setWeeklyChain] = useState<WeeklyQuestChain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimInProgress, setClaimInProgress] = useState<string | null>(null);
  const [streakDays, setStreakDays] = useState(0);

  // ─── Fetch quests from server ───
  const fetchQuests = useCallback(async () => {
    if (!childId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await apiFetch(`/api/quests?childId=${childId}`);
      const data = await res.json();

      if (data.success) {
        setQuests(data.data.quests ?? []);
        setWeeklyChain(data.data.weeklyChain ?? null);
        setStreakDays(data.data.streakDays ?? 0);
      } else {
        // Fallback: generate local quests if server has none
        const today = new Date().toISOString().split('T')[0];
        const seed = `${childId}-${today}`;
        const localTemplates = selectDailyQuests(QUEST_TEMPLATES, seed);
        const localQuests: ActiveQuest[] = localTemplates.map((t) => ({
          id: `${t.id}-${today}`,
          templateId: t.id,
          childId,
          status: 'active' as const,
          progress: 0,
          requirementCount: t.requirementCount,
          assignedDate: today,
          expiresAt: today,
          claimedAt: null,
          createdAt: new Date().toISOString(),
          title: t.title,
          description: t.description,
          emoji: t.emoji,
          difficulty: t.difficulty,
          rarity: t.rarity,
          type: t.type,
          xpReward: t.xpReward,
          gemReward: t.gemReward,
          sparkyExpression: t.sparkyExpression,
        }));
        setQuests(localQuests);
        setStreakDays(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quests');
      setQuests([]);
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  // ─── Claim quest reward ───
  const claimQuest = useCallback(
    async (questId: string): Promise<QuestReward | null> => {
      if (!childId) return null;

      const quest = quests.find((q) => q.id === questId);
      if (!quest || quest.status !== 'completed') return null;

      try {
        setClaimInProgress(questId);

        const res = await apiFetch('/api/quests/claim', {
          method: 'POST',
          body: JSON.stringify({ childId, questId }),
        });

        const data = await res.json();

        if (data.success) {
          // Optimistic update
          setQuests((prev) =>
            prev.map((q) =>
              q.id === questId ? { ...q, status: 'claimed' as const, claimedAt: new Date().toISOString() } : q
            )
          );
          return data.data.reward as QuestReward;
        }

        return null;
      } catch (err) {
        console.error('Failed to claim quest:', err);
        return null;
      } finally {
        setClaimInProgress(null);
      }
    },
    [childId, quests]
  );

  // ─── Track progress locally and sync ───
  const trackProgress = useCallback(
    async (type: string, amount: number) => {
      if (!childId || !type || amount <= 0) return;

      setQuests((prev) => {
        const updated = prev.map((q) => {
          if (q.status !== 'active' || !q.type) return q;
          // Match quest type to progress event type
          const typeMap: Record<string, string[]> = {
            play_games: ['game_complete', 'game_start'],
            earn_xp: ['xp_earned'],
            streak_maintain: ['streak_update'],
            pet_care: ['pet_care', 'pet_feed', 'pet_play', 'pet_clean'],
            lab_explore: ['lab_visit'],
            perfect_score: ['perfect_score'],
            play_time: ['time_played'],
            earn_gems: ['gems_earned'],
            learn_tricks: ['pet_trick'],
          };

          const matches = typeMap[q.type];
          if (!matches || !matches.includes(type)) return q;

          return updateQuestProgress(q, amount);
        });
        return updated;
      });

      // Sync to server
      try {
        await apiFetch('/api/quests/progress', {
          method: 'POST',
          body: JSON.stringify({ childId, type, amount }),
        });
      } catch {
        // Silent fail — local state already updated optimistically
      }
    },
    [childId]
  );

  // ─── Computed values ───
  const completedCount = useMemo(
    () => quests.filter((q) => q.status === 'completed' || q.status === 'claimed').length,
    [quests]
  );

  const totalCount = quests.length;
  const allClaimed = useMemo(() => allQuestsClaimed(quests), [quests]);

  return {
    quests,
    weeklyChain,
    isLoading,
    error,
    claimInProgress,
    completedCount,
    totalCount,
    allClaimed,
    streakDays,
    claimQuest,
    trackProgress,
    refresh: fetchQuests,
  };
}
