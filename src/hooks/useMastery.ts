// ════════════════════════════════════════════════════
// useMastery — topic mastery tree + certificate actions
// ════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiFetchResponse } from '@/lib/api';
import type { TopicMastery } from '@/lib/mastery/MasteryEngine';

export interface UseMasteryReturn {
  topics: TopicMastery[];
  masteredCount: number;
  total: number;
  isLoading: boolean;
  error: string | null;
  claimMastery: (labId: number) => Promise<boolean>;
  setCertificateApproval: (labId: number, approve: boolean) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useMastery(childId: string | null): UseMasteryReturn {
  const [topics, setTopics] = useState<TopicMastery[]>([]);
  const [masteredCount, setMasteredCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMastery = useCallback(async () => {
    if (!childId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetchResponse(`/api/mastery?childId=${childId}`);
      const data = await res.json();
      if (data.success) {
        setTopics(data.data.topics ?? []);
        setMasteredCount(data.data.masteredCount ?? 0);
        setTotal(data.data.total ?? 0);
      } else {
        setError(data.error ?? 'Failed to load mastery');
      }
    } catch {
      setError('Failed to load mastery');
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchMastery();
  }, [fetchMastery]);

  const claimMastery = useCallback(async (labId: number) => {
    if (!childId) return false;
    try {
      const res = await apiFetchResponse('/api/mastery/claim', {
        method: 'POST',
        body: JSON.stringify({ childId, labId }),
      });
      const data = await res.json();
      if (data.success) { await fetchMastery(); return true; }
      return false;
    } catch { return false; }
  }, [childId, fetchMastery]);

  const setCertificateApproval = useCallback(async (labId: number, approve: boolean) => {
    if (!childId) return false;
    try {
      const res = await apiFetchResponse('/api/mastery/certificate', {
        method: 'POST',
        body: JSON.stringify({ childId, labId, approve }),
      });
      const data = await res.json();
      if (data.success) { await fetchMastery(); return true; }
      return false;
    } catch { return false; }
  }, [childId, fetchMastery]);

  return { topics, masteredCount, total, isLoading, error, claimMastery, setCertificateApproval, refresh: fetchMastery };
}
