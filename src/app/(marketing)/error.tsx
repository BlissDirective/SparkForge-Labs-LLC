'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Marketing page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-base px-4">
      <motion.div
        className="text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-6xl mb-6">&#x26A1;</div>
        <h2 className="font-display text-xl font-bold text-white mb-3">
          Page Error
        </h2>
        <p className="font-body text-white/50 text-sm mb-8">
          Something went wrong loading this page. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <motion.button
            onClick={reset}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-spark-blue to-blue-600 text-white font-display font-bold text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Try Again
          </motion.button>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-white/10 text-white font-display font-bold text-sm hover:bg-white/15 transition-colors"
          >
            Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
