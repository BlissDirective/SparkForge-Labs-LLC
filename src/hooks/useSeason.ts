// ════════════════════════════════════════════════════
// useSeason — active seasonal event + per-child progress
// ════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiFetchResponse } from '@/lib/api';
import type {
  Season,
  SeasonalQuest,
  SeasonalItem,
  SeasonProgress,
} from '@/lib/seasons/SeasonEngine';

export interface UseSeasonReturn {
  active: boolean;
  season: Season | null;
  week: number;
  quests: SeasonalQuest[];
  items: SeasonalItem[];
  progress: SeasonProgress | null;
  percent: number;
  isLoading: boolean;
  error: string | null;
  claimQuest: (questId: string) => Promise<boolean>;
  claimGrandPrize: () => Promise<boolean>;
  purchase: (itemId: string) => Promise<{ ok: boolean; message: string }>;
  refresh: () => Promise<void>;
}

export function useSeason(childId: string | null): UseSeasonReturn {
  const [active, setActive] = useState(false);
  const [season, setSeason] = useState<Season | null>(null);
  const [week, setWeek] = useState(1);
  const [quests, setQuests] = useState<SeasonalQuest[]>([]);
  const [items, setItems] = useState<SeasonalItem[]>([]);
  const [progress, setProgress] = useState<SeasonProgress | null>(null);
  const [percent, setPercent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSeason = useCallback(async () => {
    if (!childId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetchResponse(`/api/seasons?childId=${childId}`);
      const data = await res.json();
      if (data.success) {
        setActive(data.data.active);
        setSeason(data.data.season ?? null);
        setWeek(data.data.week ?? 1);
        setQuests(data.data.quests ?? []);
        setItems(data.data.items ?? []);
        setProgress(data.data.progress ?? null);
        setPercent(data.data.percent ?? 0);
      } else {
        setError(data.error ?? 'Failed to load season');
      }
    } catch {
      setError('Failed to load season');
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchSeason();
  }, [fetchSeason]);

  const claimQuest = useCallback(async (questId: string) => {
    if (!childId) return false;
    try {
      const res = await apiFetchResponse('/api/seasons/claim', {
        method: 'POST',
        body: JSON.stringify({ childId, questId }),
      });
      const data = await res.json();
      if (data.success) { await fetchSeason(); return true; }
      return false;
    } catch { return false; }
  }, [childId, fetchSeason]);

  const claimGrandPrize = useCallback(async () => {
    if (!childId) return false;
    try {
      const res = await apiFetchResponse('/api/seasons/claim', {
        method: 'POST',
        body: JSON.stringify({ childId, grandPrize: true }),
      });
      const data = await res.json();
      if (data.success) { await fetchSeason(); return true; }
      return false;
    } catch { return false; }
  }, [childId, fetchSeason]);

  const purchase = useCallback(async (itemId: string) => {
    if (!childId) return { ok: false, message: 'No active child' };
    try {
      const res = await apiFetchResponse('/api/seasons/purchase', {
        method: 'POST',
        body: JSON.stringify({ childId, itemId }),
      });
      const data = await res.json();
      if (data.success) { await fetchSeason(); return { ok: true, message: 'Purchased!' }; }
      return { ok: false, message: data.error ?? 'Could not purchase' };
    } catch { return { ok: false, message: 'Could not purchase' }; }
  }, [childId, fetchSeason]);

  return {
    active, season, week, quests, items, progress, percent,
    isLoading, error, claimQuest, claimGrandPrize, purchase, refresh: fetchSeason,
  };
}
