// ════════════════════════════════════════════════════
// useUgc — Create-a-Quiz: my creations, community library, ratings
// ════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiFetchResponse } from '@/lib/api';
import type { CreatorBadge, UserQuiz } from '@/lib/ugc/UgcEngine';

export type QuizView = UserQuiz & { averageRating: number };

export interface UseUgcReturn {
  myCreations: QuizView[];
  community: QuizView[];
  badges: CreatorBadge[];
  stats: { published: number; totalRatings: number };
  isLoading: boolean;
  error: string | null;
  createQuiz: (title: string, questionIds: string[]) => Promise<{ ok: boolean; message: string }>;
  rateQuiz: (contentId: string, stars: number) => Promise<boolean>;
  moderate: (contentId: string, approve: boolean) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useUgc(childId: string | null): UseUgcReturn {
  const [myCreations, setMyCreations] = useState<QuizView[]>([]);
  const [community, setCommunity] = useState<QuizView[]>([]);
  const [badges, setBadges] = useState<CreatorBadge[]>([]);
  const [stats, setStats] = useState({ published: 0, totalRatings: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUgc = useCallback(async () => {
    if (!childId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetchResponse(`/api/ugc?childId=${childId}`);
      const data = await res.json();
      if (data.success) {
        setMyCreations(data.data.myCreations ?? []);
        setCommunity(data.data.community ?? []);
        setBadges(data.data.badges ?? []);
        setStats(data.data.stats ?? { published: 0, totalRatings: 0 });
      } else {
        setError(data.error ?? 'Failed to load content');
      }
    } catch {
      setError('Failed to load content');
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchUgc();
  }, [fetchUgc]);

  const createQuiz = useCallback(async (title: string, questionIds: string[]) => {
    if (!childId) return { ok: false, message: 'No active child' };
    try {
      const res = await apiFetchResponse('/api/ugc', {
        method: 'POST',
        body: JSON.stringify({ childId, title, questionIds }),
      });
      const data = await res.json();
      if (data.success) { await fetchUgc(); return { ok: true, message: data.data.message ?? 'Submitted!' }; }
      return { ok: false, message: data.error ?? 'Could not create quiz' };
    } catch { return { ok: false, message: 'Could not create quiz' }; }
  }, [childId, fetchUgc]);

  const rateQuiz = useCallback(async (contentId: string, stars: number) => {
    if (!childId) return false;
    try {
      const res = await apiFetchResponse('/api/ugc/rate', {
        method: 'POST',
        body: JSON.stringify({ childId, contentId, stars }),
      });
      const data = await res.json();
      if (data.success) { await fetchUgc(); return true; }
      return false;
    } catch { return false; }
  }, [childId, fetchUgc]);

  const moderate = useCallback(async (contentId: string, approve: boolean) => {
    if (!childId) return false;
    try {
      const res = await apiFetchResponse('/api/ugc/moderate', {
        method: 'POST',
        body: JSON.stringify({ childId, contentId, approve }),
      });
      const data = await res.json();
      if (data.success) { await fetchUgc(); return true; }
      return false;
    } catch { return false; }
  }, [childId, fetchUgc]);

  return { myCreations, community, badges, stats, isLoading, error, createQuiz, rateQuiz, moderate, refresh: fetchUgc };
}
