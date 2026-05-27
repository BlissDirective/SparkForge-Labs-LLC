// ════════════════════════════════════════════════════════════════
// DAILY MISSION CARD — Phase 3 Centerpiece
// Sparky-given daily challenge with progress tracking, countdown,
// and reward preview. Integrates with existing dailyChallenge system.
// ════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, Target, ChevronRight, Check, Sparkles } from 'lucide-react';
import { SparkyPresenter } from '@/components/sparky/SparkyPresenter';
import { getTodaysChallenge, getSecondsUntilReset, formatTimeRemaining } from '@/lib/dailyChallenge';
import type { DailyChallenge } from '@/lib/dailyChallenge';

interface DailyMissionCardProps {
  childName: string;
  childId: string;
  onStartMission?: (challenge: DailyChallenge) => void;
  compact?: boolean;
}

export function DailyMissionCard({
  childName,
  childId,
  onStartMission,
  compact = false,
}: DailyMissionCardProps) {
  const [challenge] = useState(() => getTodaysChallenge());
  const [secondsLeft, setSecondsLeft] = useState(() => getSecondsUntilReset());
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(getSecondsUntilReset());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Simulate progress (in real app, this comes from server)
  useEffect(() => {
    const checkComplete = async () => {
      try {
        const res = await fetch(`/api/progress/daily?childId=${childId}&challengeId=${challenge.id}`);
        if (res.ok) {
          const data = await res.json();
          setIsComplete(data.completed ?? false);
          setProgress(data.progress ?? 0);
        }
      } catch {
        // Silently fail — daily progress is non-critical
      }
    };
    if (childId) checkComplete();
  }, [childId, challenge.id]);

  if (dismissed) return null;

  const timeLeft = formatTimeRemaining(secondsLeft);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 p-3 overflow-hidden"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-indigo-300 font-medium">Daily Mission</p>
            <p className="text-sm text-white font-semibold truncate">{challenge.title}</p>
          </div>
          {isComplete ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
              <Check className="w-3 h-3" /> Done
            </div>
          ) : (
            <button
              onClick={() => onStartMission?.(challenge)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-medium transition-colors"
            >
              Go <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(79,110,247,0.08), rgba(233,69,245,0.08))',
            border: '1px solid rgba(79,110,247,0.2)',
          }}
        >
          {/* Ambient glow */}
          <div
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, #4F6EF7, transparent)' }}
          />
          <div
            className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-15 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, #E945F5, transparent)' }}
          />

          <div className="relative p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left: Sparky Presenter */}
              <div className="flex flex-col items-center lg:items-start shrink-0">
                <SparkyPresenter
                  expression={isComplete ? 'celebrating' : 'happy'}
                  message={
                    isComplete
                      ? `Amazing work today, ${childName}! You completed your daily mission! Come back tomorrow for a new challenge!`
                      : `Hey ${childName}! Your mission today: ${challenge.description}. Complete it to earn ${challenge.xpReward} XP!`
                  }
                  missionType="daily"
                  actionLabel={isComplete ? 'Mission Complete!' : 'Start Mission'}
                  onAction={isComplete ? undefined : () => onStartMission?.(challenge)}
                  onDismiss={() => setDismissed(true)}
                />
              </div>

              {/* Right: Challenge Details */}
              <div className="flex-1 min-w-0 space-y-4">
                {/* Status header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/20">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span className="text-xs font-semibold text-indigo-300">Daily Mission</span>
                    </div>
                    {isComplete && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-300">Completed</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    Resets in {timeLeft}
                  </div>
                </div>

                {/* Challenge card */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: 'rgba(12, 16, 32, 0.5)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl shrink-0">{challenge.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-white mb-1">{challenge.title}</h3>
                      <p className="text-sm text-slate-300 mb-3">{challenge.description}</p>

                      {/* Progress bar (if in progress) */}
                      {!isComplete && progress > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-400">Progress</span>
                            <span className="text-indigo-400">{progress}/{challenge.requirementCount}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (progress / challenge.requirementCount) * 100)}%` }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Rewards */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs font-semibold text-amber-400">+{challenge.xpReward} XP</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
                          <Target className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-xs font-semibold text-purple-400">
                            {challenge.requirementCount} {challenge.requirementCount === 1 ? 'task' : 'tasks'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                {!isComplete && (
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onStartMission?.(challenge)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #4F6EF7, #7C5CFC)',
                        boxShadow: '0 4px 16px rgba(79,110,247,0.35)',
                      }}
                    >
                      Start Mission
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
