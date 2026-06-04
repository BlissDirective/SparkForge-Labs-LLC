// ════════════════════════════════════════════════════
// useAdaptive — per-lab adaptive difficulty + learning curves
// ════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiFetchResponse } from '@/lib/api';
import type { DifficultyLevel, LearningPoint } from '@/lib/adaptive/AdaptiveEngine';

export interface AdaptiveLab {
  labId: number;
  level: DifficultyLevel;
  performance: number;
  samples: number;
  history: LearningPoint[];
  trend: 'up' | 'down' | 'flat';
}

export interface RecordSample {
  labId: number;
  accuracy: number;
  speedScore?: number;
  hintRate?: number;
  retryRate?: number;
}

export interface UseAdaptiveReturn {
  labs: AdaptiveLab[];
  isLoading: boolean;
  error: string | null;
  recordSample: (sample: RecordSample) => Promise<DifficultyLevel | null>;
  refresh: () => Promise<void>;
}

export function useAdaptive(childId: string | null): UseAdaptiveReturn {
  const [labs, setLabs] = useState<AdaptiveLab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdaptive = useCallback(async () => {
    if (!childId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetchResponse(`/api/adaptive?childId=${childId}`);
      const data = await res.json();
      if (data.success) {
        setLabs(data.data.labs ?? []);
      } else {
        setError(data.error ?? 'Failed to load adaptive difficulty');
      }
    } catch {
      setError('Failed to load adaptive difficulty');
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchAdaptive();
  }, [fetchAdaptive]);

  const recordSample = useCallback(async (sample: RecordSample) => {
    if (!childId) return null;
    try {
      const res = await apiFetchResponse('/api/adaptive/record', {
        method: 'POST',
        body: JSON.stringify({ childId, ...sample }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchAdaptive();
        return data.data.level as DifficultyLevel;
      }
      return null;
    } catch { return null; }
  }, [childId, fetchAdaptive]);

  return { labs, isLoading, error, recordSample, refresh: fetchAdaptive };
}
