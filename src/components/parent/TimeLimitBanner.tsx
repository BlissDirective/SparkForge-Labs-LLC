// ════════════════════════════════════════════════════
// TIME LIMIT BANNER — Warns/blocks when daily limit approached
// v2 [ENH-8C]: Integrates with useSessionTimer from Part 1
// ════════════════════════════════════════════════════
'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useSessionTimer } from '@/hooks/useSessionTimer';

export function TimeLimitBanner() {
  const { isWarning, isBlocked, remainingMinutes, limitMinutes } = useSessionTimer();

  if (!isWarning && !isBlocked) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center ${
          isBlocked
            ? 'bg-gradient-to-r from-spark-coral/90 to-red-600/90 backdrop-blur-sm'
            : 'bg-gradient-to-r from-spark-orange/80 to-amber-600/80 backdrop-blur-sm'
        }`}
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        exit={{ y: -60 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <div className="flex items-center justify-center gap-2">
          {isBlocked ? (
            <AlertTriangle className="w-4 h-4 text-white" />
          ) : (
            <Clock className="w-4 h-4 text-white" />
          )}
          <p className="font-display text-sm font-bold text-white">
            {isBlocked
              ? "Time's up for today! Great learning session!"
              : `Only ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'} left today!`}
          </p>
        </div>
        {isBlocked && limitMinutes !== null && (
          <p className="font-body text-xs text-white/80 mt-1">
            Your daily {limitMinutes}-minute limit has been reached. See you tomorrow!
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
