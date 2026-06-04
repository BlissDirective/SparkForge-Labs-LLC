// ════════════════════════════════════════════════════
// useStory — cross-lab narrative campaigns
// ════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiFetchResponse } from '@/lib/api';
import type { StoryCampaign, StoryProgress, ChoicePath } from '@/lib/story/StoryEngine';

export interface CampaignView {
  campaign: StoryCampaign;
  progress: StoryProgress;
  percent: number;
}

export interface UseStoryReturn {
  campaigns: CampaignView[];
  isLoading: boolean;
  error: string | null;
  advance: (campaignId: string, chapterIndex: number, choice: ChoicePath) => Promise<boolean>;
  reset: (campaignId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useStory(childId: string | null): UseStoryReturn {
  const [campaigns, setCampaigns] = useState<CampaignView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStory = useCallback(async () => {
    if (!childId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetchResponse(`/api/story?childId=${childId}`);
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data.campaigns ?? []);
      } else {
        setError(data.error ?? 'Failed to load story');
      }
    } catch {
      setError('Failed to load story');
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchStory();
  }, [fetchStory]);

  const advance = useCallback(async (campaignId: string, chapterIndex: number, choice: ChoicePath) => {
    if (!childId) return false;
    try {
      const res = await apiFetchResponse('/api/story/advance', {
        method: 'POST',
        body: JSON.stringify({ childId, campaignId, chapterIndex, choice }),
      });
      const data = await res.json();
      if (data.success) { await fetchStory(); return true; }
      return false;
    } catch { return false; }
  }, [childId, fetchStory]);

  const reset = useCallback(async (campaignId: string) => {
    if (!childId) return false;
    try {
      const res = await apiFetchResponse('/api/story/reset', {
        method: 'POST',
        body: JSON.stringify({ childId, campaignId }),
      });
      const data = await res.json();
      if (data.success) { await fetchStory(); return true; }
      return false;
    } catch { return false; }
  }, [childId, fetchStory]);

  return { campaigns, isLoading, error, advance, reset, refresh: fetchStory };
}
