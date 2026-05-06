'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Auth error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-base px-4">
      <motion.div
        className="text-center max-w-[28rem]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-6xl mb-6">&#x1F512;</div>
        <h2 className="font-display text-xl font-bold text-white mb-3">
          Authentication Error
        </h2>
        <p className="font-body text-white/50 text-sm mb-8">
          Something went wrong during sign-in. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <motion.button
            onClick={reset}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Try Again
          </motion.button>
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl bg-white/10 text-white font-display font-bold text-sm hover:bg-white/15 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
