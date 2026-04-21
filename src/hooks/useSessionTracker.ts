'use client';

import { useEffect, useRef } from 'react';
import { csrfHeader } from '@/lib/api';
import { useChildStore } from '@/stores/childStore';

// useSessionTracker — Automatic Play Session Tracking
// v2 [NEW-2A]: Starts session on mount, pauses on tab switch,
//   ends on unmount. Non-critical — all failures silent.

export function useSessionTracker() {
  const activeChildId = useChildStore((s) => s.activeChildId);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeChildId) return;

    const childId = activeChildId;

    async function startSession() {
      try {
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...csrfHeader() },
          body: JSON.stringify({
            action: 'start',
            childId,
          }),
        });
        const data = await res.json();
        sessionIdRef.current = data.sessionId || null;
      } catch {
        // Silent fail — session tracking is non-critical
      }
    }

    async function endSession() {
      if (!sessionIdRef.current) return;
      try {
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...csrfHeader() },
          body: JSON.stringify({
            action: 'end',
            sessionId: sessionIdRef.current,
          }),
        });
      } catch {
        // Silent fail
      }
      sessionIdRef.current = null;
    }

    // Handle visibility change (tab switch)
    function handleVisibilityChange() {
      if (document.hidden) {
        endSession();
      } else {
        startSession();
      }
    }

    startSession();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      endSession();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeChildId]);
}
