// ════════════════════════════════════════════════════
// UPGRADE PROMPT — Shown when tier limits are hit
// Only shown in parent-facing contexts. NEVER to children.
// v2: Frost-Prismatic styling (ENH-8E)
// ════════════════════════════════════════════════════
'use client';

import { motion } from 'motion/react';
import { Rocket, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface UpgradePromptProps {
  message: string;
  context?: string;
  variant?: 'parent' | 'child';
}

export function UpgradePrompt({
  message,
  context,
  variant = 'parent',
}: UpgradePromptProps) {
  // Child-facing variant: gentle, no pricing language
  if (variant === 'child') {
    return (
      <motion.div
        className="rounded-2xl border border-white/[0.06] bg-surface-card/80 backdrop-blur-xl p-6 text-center max-w-md mx-auto shadow-lg shadow-black/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <motion.div
          className="text-5xl mb-3"
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {'\u2728'}
        </motion.div>
        <h3 className="font-display text-lg font-bold text-white mb-2">
          {message}
        </h3>
        {context && (
          <p className="font-body text-sm text-white/50">{context}</p>
        )}
      </motion.div>
    );
  }

  // Parent-facing variant: includes upgrade CTA
  return (
    <motion.div
      className="rounded-2xl border border-neon-orange/30 bg-surface-card/80 backdrop-blur-xl p-6 text-center max-w-md mx-auto shadow-lg shadow-neon-orange/5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="w-12 h-12 rounded-full bg-neon-orange/10 flex items-center justify-center mx-auto mb-4">
        <Rocket className="w-6 h-6 text-neon-orange" />
      </div>

      <h3 className="font-display text-lg font-bold text-white mb-2">
        {message}
      </h3>

      {context && (
        <p className="font-body text-sm text-white/70 mb-4">{context}</p>
      )}

      <Link href="/parent/subscription">
        <motion.button
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-neon-orange to-neon-amber text-white font-display font-semibold text-sm shadow-lg shadow-neon-orange/20 transition-shadow hover:shadow-neon-orange/40"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <Sparkles className="w-4 h-4" />
          Upgrade to Keep Going!
        </motion.button>
      </Link>
    </motion.div>
  );
}
