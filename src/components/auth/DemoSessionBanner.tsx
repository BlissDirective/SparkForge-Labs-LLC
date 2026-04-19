'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Clock, X, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useDemoSession } from '@/hooks/useDemoSession';

export function DemoSessionBanner() {
  const router = useRouter();
  const endDemoSession = useAuthStore((s) => s.endDemoSession);

  // AUTH-04: Consolidated — single source of truth for demo state
  const demo = useDemoSession();

  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show expired modal when demo expires
  useEffect(() => {
    if (demo.isExpired && demo.isDemoMode) {
      setShowExpiredModal(true);
    }
  }, [demo.isExpired, demo.isDemoMode]);

  const handleExitDemo = useCallback(() => {
    endDemoSession();
    setShowExpiredModal(false);
    router.push('/login');
  }, [endDemoSession, router]);

  if (!demo.isDemoMode && !showExpiredModal) return null;

  return (
    <>
      {/* Persistent demo banner — top of viewport */}
      <AnimatePresence>
        {demo.isDemoMode && !dismissed && (
          <motion.div
            className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 text-sm font-body ${
              demo.isUrgent
                ? 'bg-gradient-to-r from-red-900/90 to-orange-900/90 border-b border-red-500/30'
                : 'bg-gradient-to-r from-spark-purple/20 to-spark-blue/20 border-b border-white/10 backdrop-blur-md'
            }`}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${demo.isUrgent ? 'text-red-400 animate-pulse' : 'text-spark-green'}`} />
              <span className={demo.isUrgent ? 'text-red-200' : 'text-white/70'}>
                Demo Mode
              </span>
              <span className={`font-data font-bold tabular-nums ${demo.isUrgent ? 'text-red-300' : 'text-spark-green'}`}>
                {demo.timeRemaining}
              </span>
              <span className={demo.isUrgent ? 'text-red-300/70' : 'text-white/60'}>remaining</span>
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
                className="text-white/60 hover:text-white/90 transition-colors"
                aria-label="Dismiss demo banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo expired — inline expanded banner (replaces full-screen modal) */}
      <AnimatePresence>
        {showExpiredModal && (
          <motion.div
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-900/95 to-orange-900/95 border-b border-red-500/30 backdrop-blur-md"
            initial={{ y: -120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onKeyDown={(e) => e.key === 'Escape' && handleExitDemo()}
            tabIndex={-1}
            role="alert"
            aria-live="assertive"
          >
            <div className="max-w-xl mx-auto px-4 py-5 text-center">
              <h2 className="font-display text-lg font-bold text-white mb-1">
                Demo Session Ended
              </h2>
              <p className="font-body text-sm text-red-200/70 mb-4">
                Your 1-hour demo has expired. Create a free account to save your progress!
              </p>

              <div className="flex items-center justify-center gap-3">
                <motion.button
                  onClick={() => {
                    endDemoSession();
                    setShowExpiredModal(false);
                    router.push('/signup');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Create Free Account
                </motion.button>

                <motion.button
                  onClick={handleExitDemo}
                  className="px-5 py-2.5 rounded-xl border border-white/20 text-white/60 font-body text-sm hover:bg-white/5 transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  Return to Login
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
