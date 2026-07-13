// ════════════════════════════════════════════════════
// useUgc — Create-a-Quiz: my creations, community library, ratings
// ════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiFetchResponse } from '@/lib/api';
import type { CreatorBadge, UserQuiz, ContentKind } from '@/lib/ugc/UgcEngine';

/** A creation of any kind (quiz / agent / prompt) with its resolved payload. */
export type ContentView = UserQuiz & {
  averageRating: number;
  kind: ContentKind;
  payload: Record<string, unknown>;
};
/** @deprecated use ContentView — retained so existing quiz callers compile. */
export type QuizView = ContentView;

export interface PublishResult { ok: boolean; message: string }

export interface UseUgcReturn {
  myCreations: ContentView[];
  community: ContentView[];
  badges: CreatorBadge[];
  stats: { published: number; totalRatings: number };
  isLoading: boolean;
  error: string | null;
  createQuiz: (title: string, questionIds: string[]) => Promise<PublishResult>;
  publishPrompt: (text: string, band: 'A' | 'B' | 'C') => Promise<PublishResult>;
  publishAgent: (compositionId: string, name: string, summary?: string) => Promise<PublishResult>;
  rateQuiz: (contentId: string, stars: number) => Promise<boolean>;
  moderate: (contentId: string, approve: boolean) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useUgc(childId: string | null): UseUgcReturn {
  const [myCreations, setMyCreations] = useState<ContentView[]>([]);
  const [community, setCommunity] = useState<ContentView[]>([]);
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
        body: JSON.stringify({ kind: 'quiz', childId, title, questionIds }),
      });
      const data = await res.json();
      if (data.success) { await fetchUgc(); return { ok: true, message: data.data.message ?? 'Submitted!' }; }
      return { ok: false, message: data.error ?? 'Could not create quiz' };
    } catch { return { ok: false, message: 'Could not create quiz' }; }
  }, [childId, fetchUgc]);

  const publishPrompt = useCallback(async (text: string, band: 'A' | 'B' | 'C') => {
    if (!childId) return { ok: false, message: 'No active child' };
    try {
      const res = await apiFetchResponse('/api/ugc', {
        method: 'POST',
        body: JSON.stringify({ kind: 'prompt', childId, title: 'Prompt', text, band }),
      });
      const data = await res.json();
      if (data.success) { await fetchUgc(); return { ok: true, message: data.data.message ?? 'Submitted!' }; }
      return { ok: false, message: data.error ?? 'Could not share prompt' };
    } catch { return { ok: false, message: 'Could not share prompt' }; }
  }, [childId, fetchUgc]);

  const publishAgent = useCallback(async (compositionId: string, name: string, summary?: string) => {
    if (!childId) return { ok: false, message: 'No active child' };
    try {
      const res = await apiFetchResponse('/api/ugc', {
        method: 'POST',
        body: JSON.stringify({ kind: 'agent', childId, title: name, compositionId, summary }),
      });
      const data = await res.json();
      if (data.success) { await fetchUgc(); return { ok: true, message: data.data.message ?? 'Submitted!' }; }
      return { ok: false, message: data.error ?? 'Could not share agent' };
    } catch { return { ok: false, message: 'Could not share agent' }; }
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

  return {
    myCreations, community, badges, stats, isLoading, error,
    createQuiz, publishPrompt, publishAgent, rateQuiz, moderate, refresh: fetchUgc,
  };
}
