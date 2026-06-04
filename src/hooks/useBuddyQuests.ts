// ════════════════════════════════════════════════════
// useBuddyQuests — collaborative weekly quest hook
// ════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiFetchResponse } from '@/lib/api';
import type { BuddyQuest } from '@/lib/social/SocialEngine';

export interface UseBuddyQuestsReturn {
  quests: BuddyQuest[];
  isLoading: boolean;
  error: string | null;
  assignWithBuddy: (buddyId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useBuddyQuests(childId: string | null): UseBuddyQuestsReturn {
  const [quests, setQuests] = useState<BuddyQuest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuests = useCallback(async () => {
    if (!childId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetchResponse(`/api/buddy-quests?childId=${childId}`);
      const data = await res.json();
      if (data.success) {
        setQuests(data.data.quests ?? []);
      } else {
        setError(data.error ?? 'Failed to load buddy quests');
      }
    } catch {
      setError('Failed to load buddy quests');
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  const assignWithBuddy = useCallback(
    async (buddyId: string) => {
      if (!childId) return false;
      try {
        const res = await apiFetchResponse('/api/buddy-quests', {
          method: 'POST',
          body: JSON.stringify({ childId, buddyId }),
        });
        const data = await res.json();
        if (data.success) {
          await fetchQuests();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [childId, fetchQuests],
  );

  return { quests, isLoading, error, assignWithBuddy, refresh: fetchQuests };
}
