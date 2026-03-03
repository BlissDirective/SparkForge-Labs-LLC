'use client';

import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon = '✨', title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      className="text-center py-16 px-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-display text-lg font-bold text-white mb-2">{title}</h3>
      <p className="font-body text-white/50 text-sm max-w-xs mx-auto mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm hover:brightness-110 transition-all"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
