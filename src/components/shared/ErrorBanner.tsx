'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface ErrorBannerProps {
  message: string;
  dismissible?: boolean;
  className?: string;
}

export function ErrorBanner({ message, dismissible = true, className }: ErrorBannerProps) {
  const [visible, setVisible] = useState(true);

  if (!message || !visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={`flex items-start gap-3 p-4 rounded-xl bg-spark-coral/10 border border-spark-coral/20 ${className || ''}`}
        role="alert"
        aria-live="assertive"
      >
        <AlertTriangle className="w-5 h-5 text-spark-coral flex-shrink-0 mt-0.5" />
        <p className="font-body text-sm text-spark-coral flex-1">{message}</p>
        {dismissible && (
          <button
            onClick={() => setVisible(false)}
            className="text-spark-coral/50 hover:text-spark-coral transition-colors"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
