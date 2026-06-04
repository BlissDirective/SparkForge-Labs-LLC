// ════════════════════════════════════════════════════
// useAnalytics — advanced parent analytics for a child
// ════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiFetchResponse } from '@/lib/api';
import type { TopicStrength, LearningVelocity } from '@/lib/analytics/AnalyticsEngine';

export interface AnalyticsData {
  heatmap: TopicStrength[];
  velocity: LearningVelocity;
  percentile: number;
  timeOnTask: { totalMinutes: number; weeklyAvgMinutes: number };
  insight: string;
  weeks: number;
}

export interface UseAnalyticsReturn {
  data: AnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAnalytics(childId: string | null): UseAnalyticsReturn {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!childId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetchResponse(`/api/analytics?childId=${childId}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data as AnalyticsData);
      } else {
        setError(json.error ?? 'Failed to load analytics');
      }
    } catch {
      setError('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { data, isLoading, error, refresh: fetchAnalytics };
}
