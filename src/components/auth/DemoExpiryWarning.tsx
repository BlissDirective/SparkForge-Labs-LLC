'use client';

// ════════════════════════════════════════════════════════════════
// DemoExpiryWarning — UX-MED-002 (T10c)
// ════════════════════════════════════════════════════════════════
// Fires ONCE at T-10min on a demo session. Pauses any active game
// (via gameStore.pause) so a child mid-round isn't robbed of their
// progress without notice, surfaces a summary of what the demo user
// has accomplished so far, and offers a one-click conversion to a
// real account.
//
// Architecture:
//   - Rendered globally by DemoSessionBanner (inside the dashboard
//     layout) so it's available on every authed surface.
//   - Session-scoped — fires exactly once per demo session. We use
//     sessionStorage keyed by the demo session id so navigating
//     between routes within the demo doesn't re-fire the modal, but
//     a full reload inside the same demo window won't re-fire
//     either (intentional — the existing urgent banner at <5min is
//     sufficient nagging).
//   - Dismissing the warning does NOT resume the game — users
//     explicitly click "Keep playing" to resume, giving them a beat
//     to see the achievements summary before jumping back in.
//
// Uses the generic ConfirmDialog primitive from T7 (UX-MED-006) so
// focus-trap, WCAG dialog roles, and the modal's visual language
// stay consistent with the delete-account flow.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Trophy, Clock } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useAuthStore } from '@/stores/authStore';
import { useDemoSession } from '@/hooks/useDemoSession';
import { useGameStore } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';

// Fires the pre-warning when <= this many ms remain.
const PREWARN_THRESHOLD_MS = 10 * 60 * 1000;

function sessionStorageKey(demoId: string): string {
  return `sparkforge-demo-prewarn:${demoId}`;
}

export function DemoExpiryWarning() {
  const router = useRouter();
  const demo = useDemoSession();
  const demoSession = useAuthStore((s) => s.demoSession);
  const activeChild = useActiveChild();

  const [isOpen, setIsOpen] = useState(false);
  const [wasPausedBefore, setWasPausedBefore] = useState(false);

  // Trigger: exactly once per demo session when we cross the 10-min
  // threshold, as long as >0 time remains (expired case is handled
  // by the existing expired banner in DemoSessionBanner).
  useEffect(() => {
    if (!demo.isDemoMode || !demoSession) return;
    if (demo.timeRemainingMs > PREWARN_THRESHOLD_MS) return;
    if (demo.timeRemainingMs <= 0) return;

    if (typeof window === 'undefined') return;
    const key = sessionStorageKey(demoSession.id);
    if (window.sessionStorage.getItem(key) === '1') return;

    // Mark as shown immediately so re-renders can't race the setIsOpen.
    window.sessionStorage.setItem(key, '1');

    // Snapshot prior pause state so we don't resume a game the user
    // had already paused themselves.
    const gameState = useGameStore.getState();
    setWasPausedBefore(gameState.isPaused);

    // Pause active game if one is in progress. completeGame guard
    // in gameStore prevents pause from flipping a completed game.
    if (gameState.currentGame && !gameState.isComplete) {
      gameState.pauseGame();
    }

    setIsOpen(true);
  }, [demo.isDemoMode, demo.timeRemainingMs, demoSession]);

  // If the demo expires while the modal is open, close it — the
  // existing expired banner in DemoSessionBanner takes over.
  useEffect(() => {
    if (isOpen && demo.isExpired) {
      setIsOpen(false);
    }
  }, [isOpen, demo.isExpired]);

  const handleResume = () => {
    setIsOpen(false);
    // Only resume if we were the ones who paused.
    if (!wasPausedBefore) {
      useGameStore.getState().resumeGame();
    }
  };

  const handleSignup = () => {
    // Don't resume the game — the user is leaving demo mode.
    setIsOpen(false);
    // Prefill the signup form with any metadata we have. Demo
    // sessions don't carry an email (Supabase anonymous users), so
    // we just forward them to /signup with a "from demo" marker
    // so downstream analytics can attribute conversions.
    router.push('/signup?from=demo');
  };

  if (!demo.isDemoMode) return null;

  const xp = activeChild?.xp ?? 0;
  const level = activeChild?.level ?? 1;
  const streak = activeChild?.streak_count ?? 0;

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onCancel={handleResume}
      onConfirm={handleSignup}
      title="10 minutes left in your demo"
      message={
        <div className="space-y-4">
          <div className="flex items-start gap-2 text-white/85">
            <Clock
              className="w-4 h-4 mt-0.5 flex-shrink-0 text-spark-amber"
              aria-hidden="true"
            />
            <p>
              Your demo session will end soon. Create a free account
              to keep your progress — otherwise everything resets when
              the timer hits 0:00.
            </p>
          </div>

          {/* Achievements summary — pulled from the React Query
              cache, so it reflects any XP / streak update the
              gamification pipeline has already reconciled. */}
          {(xp > 0 || level > 1 || streak > 0) && (
            <div
              className="rounded-lg border border-white/10 bg-surface-deep/60 p-3"
              role="group"
              aria-label="Your demo session achievements"
            >
              <div className="flex items-center gap-2 mb-2">
                <Trophy
                  className="w-4 h-4 text-spark-amber"
                  aria-hidden="true"
                />
                <span className="font-display text-xs font-semibold text-white/85">
                  Your progress so far
                </span>
              </div>
              <ul className="grid grid-cols-3 gap-3 text-center">
                <li>
                  <div className="font-data text-lg font-bold text-spark-blue">
                    {xp}
                  </div>
                  <div className="font-body text-[10px] uppercase tracking-wide text-white/50">
                    XP
                  </div>
                </li>
                <li>
                  <div className="font-data text-lg font-bold text-spark-purple">
                    {level}
                  </div>
                  <div className="font-body text-[10px] uppercase tracking-wide text-white/50">
                    Level
                  </div>
                </li>
                <li>
                  <div className="font-data text-lg font-bold text-spark-orange">
                    {streak}
                  </div>
                  <div className="font-body text-[10px] uppercase tracking-wide text-white/50">
                    Streak
                  </div>
                </li>
              </ul>
            </div>
          )}

          <p className="flex items-start gap-2 text-xs text-white/55">
            <UserPlus
              className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
              aria-hidden="true"
            />
            Signing up takes about 30 seconds. Free plan includes
            1 child profile and access to the first lab.
          </p>
        </div>
      }
      confirmLabel="Create free account"
      cancelLabel="Keep playing"
      variant="default"
    />
  );
}
