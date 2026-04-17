'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  getDemoTimeRemaining,
  formatTimeRemaining,
  DEMO_DURATION_MS,
} from '@/lib/demo-session';

interface DemoSessionState {
  isDemoMode: boolean;
  timeRemaining: string;
  timeRemainingMs: number;
  isUrgent: boolean;
  isExpired: boolean;
  percentRemaining: number;
}

export function useDemoSession(): DemoSessionState {
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const demoSession = useAuthStore((s) => s.demoSession);

  const [state, setState] = useState<DemoSessionState>({
    isDemoMode: false,
    timeRemaining: '',
    timeRemainingMs: 0,
    isUrgent: false,
    isExpired: false,
    percentRemaining: 100,
  });

  useEffect(() => {
    if (!isDemoMode || !demoSession) {
      setState((prev) => ({ ...prev, isDemoMode: false }));
      return;
    }

    function update() {
      const remainingMs = getDemoTimeRemaining(demoSession);
      setState({
        isDemoMode: true,
        timeRemaining: formatTimeRemaining(remainingMs),
        timeRemainingMs: remainingMs,
        isUrgent: remainingMs < 5 * 60 * 1000,
        isExpired: remainingMs <= 0,
        percentRemaining: Math.max(0, (remainingMs / DEMO_DURATION_MS) * 100),
      });
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isDemoMode, demoSession]);

  return state;
}
