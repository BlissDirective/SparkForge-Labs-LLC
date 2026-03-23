'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getDemoTimeRemaining, formatTimeRemaining } from '@/lib/demo-session';

interface DemoSessionState {
  isDemoMode: boolean;
  timeRemaining: string;
  timeRemainingMs: number;
  isUrgent: boolean;
  isExpired: boolean;
  percentRemaining: number;
}

const DEMO_DURATION_MS = 60 * 60 * 1000; // 1 hour

export function useDemoSession(): DemoSessionState {
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const checkDemoStatus = useAuthStore((s) => s.checkDemoStatus);

  const [state, setState] = useState<DemoSessionState>({
    isDemoMode: false,
    timeRemaining: '',
    timeRemainingMs: 0,
    isUrgent: false,
    isExpired: false,
    percentRemaining: 100,
  });

  useEffect(() => {
    if (!isDemoMode) {
      setState((prev) => ({ ...prev, isDemoMode: false }));
      return;
    }

    function update() {
      const valid = checkDemoStatus();
      if (!valid) {
        setState({
          isDemoMode: true,
          timeRemaining: '0:00',
          timeRemainingMs: 0,
          isUrgent: true,
          isExpired: true,
          percentRemaining: 0,
        });
        return;
      }

      const remainingMs = getDemoTimeRemaining();
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
  }, [isDemoMode, checkDemoStatus]);

  return state;
}
