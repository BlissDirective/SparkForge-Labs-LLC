'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Clock, X, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getDemoTimeRemaining, formatTimeRemaining } from '@/lib/demo-session';

export function DemoSessionBanner() {
  const router = useRouter();
  const { isDemoMode, endDemoSession, checkDemoStatus } = useAuthStore();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleExpired = useCallback(() => {
    setShowExpiredModal(true);
  }, []);

  const handleExitDemo = useCallback(() => {
    endDemoSession();
    setShowExpiredModal(false);
    router.push('/login');
  }, [endDemoSession, router]);

  // Update timer every second
  useEffect(() => {
    if (!isDemoMode) return;

    const interval = setInterval(() => {
      const valid = checkDemoStatus();
      if (!valid) {
        handleExpired();
        clearInterval(interval);
        return;
      }

      const remaining = getDemoTimeRemaining();
      setTimeRemaining(formatTimeRemaining(remaining));

      // Urgent state when < 5 minutes remain
      setIsUrgent(remaining < 5 * 60 * 1000);

      // Expired
      if (remaining <= 0) {
        handleExpired();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isDemoMode, checkDemoStatus, handleExpired]);

  if (!isDemoMode && !showExpiredModal) return null;

  return (
    <>
      {/* Persistent demo banner — top of viewport */}
      <AnimatePresence>
        {isDemoMode && !dismissed && (
          <motion.div
            className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 text-sm font-body ${
              isUrgent
                ? 'bg-gradient-to-r from-red-900/90 to-orange-900/90 border-b border-red-500/30'
                : 'bg-gradient-to-r from-spark-purple/20 to-spark-blue/20 border-b border-white/10 backdrop-blur-md'
            }`}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-400 animate-pulse' : 'text-spark-green'}`} />
              <span className={isUrgent ? 'text-red-200' : 'text-white/70'}>
                Demo Mode
              </span>
              <span className={`font-data font-bold tabular-nums ${isUrgent ? 'text-red-300' : 'text-spark-green'}`}>
                {timeRemaining}
              </span>
              <span className={isUrgent ? 'text-red-300/60' : 'text-white/40'}>remaining</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/signup')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-spark-purple/20 border border-spark-purple/30 text-spark-purple text-xs font-semibold hover:bg-spark-purple/30 transition-colors"
                aria-label="Create an account to save progress"
              >
                <UserPlus className="w-3 h-3" />
                Create Account
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="text-white/30 hover:text-white/60 transition-colors"
                aria-label="Dismiss demo banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo expired modal */}
      <AnimatePresence>
        {showExpiredModal && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-card rounded-2xl p-8 max-w-sm mx-4 text-center relative overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Chrome bezel border */}
              <div className="absolute inset-0 rounded-2xl p-[1px] pointer-events-none">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-spark-purple/30 via-transparent to-spark-blue/30" />
              </div>

              <div className="text-5xl mb-4">&#9200;</div>
              <h2 className="font-display text-xl font-bold text-white mb-2">
                Demo Session Ended
              </h2>
              <p className="font-body text-sm text-white/60 mb-6">
                Your 1-hour demo has expired. Create a free account to continue
                exploring SparkForge and save your progress!
              </p>

              <div className="space-y-3">
                <motion.button
                  onClick={() => {
                    endDemoSession();
                    setShowExpiredModal(false);
                    router.push('/signup');
                  }}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Create Free Account
                </motion.button>

                <motion.button
                  onClick={handleExitDemo}
                  className="w-full h-10 rounded-xl border border-white/10 text-white/50 font-body text-sm hover:bg-white/5 transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  Return to Login
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
