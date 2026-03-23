'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { ChevronRight, X } from 'lucide-react';
import { useChildStore } from '@/stores/childStore';
import { WORLDS } from '@/types';

// ContinueBanner — "Pick up where you left off"
// v2 [NEW-3D]: Contextual banner showing last activity

export function ContinueBanner() {
  const { activeChild } = useChildStore();
  const [dismissed, setDismissed] = useState(false);

  // Show banner only if child has some progress data
  // This will be enhanced in Stage 4 with actual last-played content
  if (!activeChild || dismissed || activeChild.xp === 0) return null;

  // Find the last active lab (placeholder — Stage 4 provides real data)
  const lastLabId = 1;
  const lastLab = WORLDS.find((w) => w.id === lastLabId);
  if (!lastLab) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-4"
      >
        <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: `${lastLab.color}20` }}
          >
            {lastLab.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body text-white/50 text-xs">
              Continue where you left off
            </p>
            <p className="font-display text-sm font-bold text-white truncate">
              {lastLab.title}
            </p>
          </div>
          <Link
            href={`/labs/${lastLabId}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors text-white text-sm font-display font-bold"
          >
            Resume <ChevronRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/30 hover:text-white/50 transition-colors"
            aria-label="Dismiss continue banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
