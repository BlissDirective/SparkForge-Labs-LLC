'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Play, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function DemoLoginButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDemoStart() {
    setLoading(true);

    try {
      // AUTH-CRIT-002 (2B): The API route creates a Supabase anonymous
      // session. Refresh the client-side session cache so AuthProvider
      // detects the new anonymous user and hydrates demo state.
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      await supabase.auth.refreshSession();

      router.push('/home');
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <AnimatePresence mode="wait">
        {!showConfirm ? (
          <motion.button
            key="demo-trigger"
            onClick={() => setShowConfirm(true)}
            className="w-full h-11 rounded-xl border border-spark-green/30 bg-spark-green/5 text-spark-green font-display font-semibold text-sm hover:bg-spark-green/10 hover:border-spark-green/50 transition-all flex items-center justify-center gap-2"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            aria-label="Try SparkForge demo without creating an account"
          >
            <Play className="w-4 h-4" />
            Try Demo (No Account Needed)
          </motion.button>
        ) : (
          <motion.div
            key="demo-confirm"
            className="rounded-xl border border-spark-green/20 bg-spark-green/5 p-4 space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <p className="font-body text-sm text-white/70 text-center">
              You&apos;ll get <span className="text-spark-green font-semibold">1 hour</span> to explore
              the full SparkForge experience — Hero Animation, 3D Cockpit, Labs, and Games.
            </p>
            <p className="font-body text-xs text-white/40 text-center">
              No data is saved. Create an account anytime to keep your progress.
            </p>
            <div className="flex gap-2">
              <motion.button
                onClick={() => setShowConfirm(false)}
                className="flex-1 h-10 rounded-lg border border-white/10 text-white/50 font-body text-sm hover:bg-white/5 transition-colors"
                whileTap={{ scale: 0.98 }}
                disabled={loading}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleDemoStart}
                disabled={loading}
                className="flex-1 h-10 rounded-lg bg-gradient-to-r from-spark-green/80 to-spark-blue/80 text-white font-display font-bold text-sm disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Demo
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
