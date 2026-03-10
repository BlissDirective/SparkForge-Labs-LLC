// ════════════════════════════════════════════════════
// SESSION TIMER — Enforces daily time limits
// v2 [ENH-8C]: Warns at 5min remaining, blocks at limit
// ════════════════════════════════════════════════════
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useChildStore } from '@/stores/childStore';
import { createClient } from '@/lib/supabase/client';

interface TimerState {
  limitMinutes: number | null;
  usedMinutes: number;
  remainingMinutes: number | null;
  isWarning: boolean;
  isBlocked: boolean;
}

export function useSessionTimer(): TimerState {
  const activeChild = useChildStore((s) => s.activeChild);

  const [state, setState] = useState<TimerState>({
    limitMinutes: null,
    usedMinutes: 0,
    remainingMinutes: null,
    isWarning: false,
    isBlocked: false,
  });

  const checkTime = useCallback(async () => {
    if (!activeChild?.id) return;

    const limit = activeChild.daily_time_limit_minutes ?? null;
    if (limit === null || limit === undefined) {
      setState({
        limitMinutes: null,
        usedMinutes: 0,
        remainingMinutes: null,
        isWarning: false,
        isBlocked: false,
      });
      return;
    }

    const sb = createClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: sessions } = await sb
      .from('sessions')
      .select('duration_seconds')
      .eq('child_id', activeChild.id)
      .gte('started_at', today.toISOString());

    const usedMinutes = Math.round(
      (sessions ?? []).reduce(
        (sum, row) => sum + (row.duration_seconds ?? 0),
        0
      ) / 60
    );

    const remaining = Math.max(0, limit - usedMinutes);

    setState({
      limitMinutes: limit,
      usedMinutes,
      remainingMinutes: remaining,
      isWarning: remaining <= 5 && remaining > 0,
      isBlocked: remaining <= 0,
    });
  }, [activeChild]);

  useEffect(() => {
    checkTime();
    const interval = setInterval(checkTime, 60_000);
    return () => clearInterval(interval);
  }, [checkTime]);

  return state;
}
