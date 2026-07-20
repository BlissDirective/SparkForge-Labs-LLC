// ════════════════════════════════════════════════════
// StreakWagerModal — Streak Wager Placement
// Free to enter, win gems by maintaining streak
// ════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, TrendingUp, Zap, Check, Loader2 } from 'lucide-react';
import { WAGER_CONFIG } from '@/lib/streak/StreakEngine';
import type { StreakWager } from '@/lib/streak/StreakEngine';

interface StreakWagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceWager: (type: '7-day' | '14-day') => Promise<boolean>;
  currentStreak: number;
  longestStreak: number;
  activeWager: StreakWager | null;
  gems: number;
}

export function StreakWagerModal({
  isOpen,
  onClose,
  onPlaceWager,
  currentStreak,
  longestStreak,
  activeWager,
  gems,
}: StreakWagerModalProps) {
  const [selectedType, setSelectedType] = useState<'7-day' | '14-day'>('7-day');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  const canPlace14Day = longestStreak >= 14;
  const hasActiveWager = activeWager?.status === 'active';

  const handlePlaceWager = async () => {
    if (selectedType === '14-day' && !canPlace14Day) return;
    if (hasActiveWager) return;

    setIsSubmitting(true);
    const success = await onPlaceWager(selectedType);
    setResult(success ? 'success' : 'error');
    setIsSubmitting(false);

    if (success) {
      setTimeout(() => {
        setResult(null);
        onClose();
      }, 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-sf-console border border-sf-console-border/50 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-6 pb-4">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-sf-console-raised transition-colors"
              >
                <X className="w-5 h-5 text-sf-console-text-dim" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Streak Wager</h2>
                  <p className="text-xs text-sf-console-text-dim">Free to enter · Win gems</p>
                </div>
              </div>
            </div>

            {/* Active wager status */}
            {hasActiveWager && activeWager && (
              <div className="mx-6 mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-sm text-emerald-400 font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Active {activeWager.wagerType} wager
                </p>
                <p className="text-xs text-emerald-400/70 mt-1">
                  Maintain your streak until {activeWager.endDate} to win {activeWager.rewardGems} gems!
                </p>
              </div>
            )}

            {/* Wager options */}
            <div className="px-6 pb-4 space-y-3">
              {/* 7-day wager */}
              <button
                onClick={() => setSelectedType('7-day')}
                disabled={hasActiveWager}
                className={`
                  w-full p-4 rounded-xl border-2 transition-all text-left
                  ${selectedType === '7-day' && !hasActiveWager
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-sf-console-border bg-sf-console-raised/50 hover:border-sf-console-border'
                  }
                  ${hasActiveWager ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">7-Day Wager</p>
                      <p className="text-xs text-sf-console-text-dim">Maintain streak for 7 days</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-400">+50</p>
                    <p className="text-xs text-sf-console-text-faint">gems</p>
                  </div>
                </div>
              </button>

              {/* 14-day wager */}
              <button
                onClick={() => setSelectedType('14-day')}
                disabled={!canPlace14Day || hasActiveWager}
                className={`
                  w-full p-4 rounded-xl border-2 transition-all text-left
                  ${selectedType === '14-day' && !hasActiveWager
                    ? 'border-sf-console-accent-alt bg-sf-console-accent-alt/10'
                    : 'border-sf-console-border bg-sf-console-raised/50 hover:border-sf-console-border'
                  }
                  ${(!canPlace14Day || hasActiveWager) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sf-console-accent-alt/20 flex items-center justify-center">
                      <Target className="w-4 h-4 text-sf-console-accent-alt" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">14-Day Wager</p>
                      <p className="text-xs text-sf-console-text-dim">
                        {canPlace14Day ? 'Maintain streak for 14 days' : 'Requires 14-day streak history'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-sf-console-accent-alt">+100</p>
                    <p className="text-xs text-sf-console-text-faint">gems</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Submit */}
            <div className="px-6 pb-6">
              <motion.button
                onClick={handlePlaceWager}
                disabled={isSubmitting || hasActiveWager || result === 'success'}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full py-3 rounded-xl font-semibold text-sm
                  transition-all flex items-center justify-center gap-2
                  ${result === 'success'
                    ? 'bg-emerald-600 text-white'
                    : result === 'error'
                      ? 'bg-red-600 text-white'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400'
                  }
                  ${(isSubmitting || hasActiveWager) ? 'opacity-60 cursor-not-allowed' : ''}
                `}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Placing wager...
                  </>
                ) : result === 'success' ? (
                  <>
                    <Check className="w-4 h-4" />
                    Wager placed!
                  </>
                ) : result === 'error' ? (
                  'Failed — try again'
                ) : hasActiveWager ? (
                  'Wager already active'
                ) : (
                  `Place ${selectedType} Wager (Free)`
                )}
              </motion.button>

              <p className="mt-3 text-center text-xs text-sf-console-text-faint">
                Your streak must remain unbroken to win. Freezes can help!
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
