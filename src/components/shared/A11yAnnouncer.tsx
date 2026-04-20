'use client';

// ════════════════════════════════════════════════════
// A11yAnnouncer — Screen Reader Announcement Provider
// ════════════════════════════════════════════════════
// Phase 1 audit fix (Section 8.2): Provides a visually-hidden
// aria-live region that announces score changes, XP gains,
// badge unlocks, level-ups, and streak milestones to screen readers.
//
// Mount once at layout level — subscribes to gameStore + uiStore.

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useUIStore } from '@/stores/uiStore';

export function A11yAnnouncer() {
  const [message, setMessage] = useState('');
  const prevScoreRef = useRef<number>(0);
  // STATE-CRIT-001 (13B): gameStore is now scoped per child. When the
  // active child changes, re-subscribe to the newly-active child's store
  // so score announcements follow the active profile.
  const activeChildId = useChildStore((s) => s.activeChildId);

  // Subscribe to score changes during gameplay
  useEffect(() => {
    // Reset the baseline on child switch so the first score event on the
    // new child isn't reported as a `+score` diff from the previous child.
    prevScoreRef.current = useGameStore.getState().score;

    const unsubScore = useGameStore.subscribe((state) => {
      if (state.score !== prevScoreRef.current && state.currentGame) {
        const diff = state.score - prevScoreRef.current;
        if (diff > 0) {
          setMessage(`Score: ${state.score}. Plus ${diff} points.`);
        }
        prevScoreRef.current = state.score;
      }
    });

    return unsubScore;
  }, [activeChildId]);

  // Subscribe to celebration triggers (XP, badges, level-ups, streaks)
  useEffect(() => {
    const unsubCelebration = useUIStore.subscribe((state, prevState) => {
      if (state.showCelebration && !prevState.showCelebration && state.celebrationType) {
        const data = state.celebrationData;
        switch (state.celebrationType) {
          case 'xp': {
            const xp = typeof data === 'object' && data && 'xp' in data ? (data as { xp: number }).xp : 0;
            if (xp > 0) setMessage(`Earned ${xp} XP!`);
            break;
          }
          case 'badge': {
            const name = typeof data === 'object' && data && 'name' in data ? (data as { name: string }).name : 'a new badge';
            setMessage(`Badge earned: ${name}!`);
            break;
          }
          case 'level': {
            const level = typeof data === 'object' && data && 'level' in data ? (data as { level: number }).level : '';
            setMessage(`Level up! You are now level ${level}.`);
            break;
          }
          case 'streak': {
            const count = typeof data === 'object' && data && 'count' in data ? (data as { count: number }).count : 0;
            setMessage(`${count} day streak! Keep it up!`);
            break;
          }
          case 'confetti':
            setMessage('Celebration! Great achievement!');
            break;
        }
      }
    });

    return unsubCelebration;
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
