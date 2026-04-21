// ════════════════════════════════════════════════════
// PAYWALL MODAL — Shown when tier limits are reached
// Two variants: parent (upgrade CTA) / child (gentle message)
// v2: Animated, context-aware, Frost-Prismatic
// Enhancement #7: Progress ring in child variant showing remaining free uses
// ════════════════════════════════════════════════════
'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Lock, X } from 'lucide-react';
import Link from 'next/link';
import { TIER_DISPLAY, type SubscriptionTier } from '@/lib/tier-config';

type PaywallContext = 'games' | 'prompts' | 'labs' | 'children' | 'general';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: PaywallContext;
  variant?: 'parent' | 'child';
  currentTier?: SubscriptionTier;
  /** ENH #7: For child variant — current usage count (e.g. games played this week) */
  currentUsage?: number;
  /** ENH #7: For child variant — max allowed (e.g. 3 games/week for free tier) */
  maxUsage?: number;
}

const CHILD_MESSAGES: Record<PaywallContext, { title: string; body: string; emoji: string }> = {
  games: {
    title: "You've played a lot today!",
    body: 'Come back next week for more games, or ask a parent to unlock unlimited play!',
    emoji: '🎮',
  },
  prompts: {
    title: "You've used all your spark energy today!",
    body: 'Your AI spark recharges tomorrow. Keep exploring lessons and games!',
    emoji: '⚡',
  },
  labs: {
    title: 'This lab is locked!',
    body: 'Ask your parent to unlock more labs for your adventure!',
    emoji: '🔒',
  },
  children: {
    title: 'Profile limit reached',
    body: 'Ask a parent to upgrade for more profiles.',
    emoji: '👥',
  },
  general: {
    title: 'This feature is locked',
    body: 'Ask a parent to unlock this feature!',
    emoji: '✨',
  },
};

const PARENT_MESSAGES: Record<PaywallContext, { title: string; body: string }> = {
  games: {
    title: 'Game limit reached',
    body: 'Your free plan includes 3 games per week. Upgrade for unlimited games!',
  },
  prompts: {
    title: 'Prompt limit reached',
    body: 'Your free plan includes 5 Prompt Lab tries per day. Upgrade for more!',
  },
  labs: {
    title: 'Premium lab content',
    body: 'Labs 4–10 require a Plus or Forge subscription for full access.',
  },
  children: {
    title: 'Child profile limit',
    body: 'Upgrade your plan to add more child profiles.',
  },
  general: {
    title: 'Premium feature',
    body: 'This feature requires a Plus or Forge subscription.',
  },
};

const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20 },
};

// ENH #7: SVG progress ring component
function ProgressRing({
  current,
  max,
  size = 64,
  strokeWidth = 4,
}: {
  current: number;
  max: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(current / max, 1);
  const offset = circumference * (1 - progress);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`Usage: ${current} of ${max}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#FFAA44"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-data text-xs text-white/80">
          {current}/{max}
        </span>
      </div>
    </div>
  );
}

export function PaywallModal({
  isOpen,
  onClose,
  context,
  variant = 'parent',
  currentTier = 'free',
  currentUsage,
  maxUsage,
}: PaywallModalProps) {
  const suggestedTier = currentTier === 'free' ? 'plus' : 'forge';
  const suggestedDisplay = TIER_DISPLAY[suggestedTier];
  const showProgressRing =
    variant === 'child' &&
    currentUsage !== undefined &&
    maxUsage !== undefined &&
    maxUsage > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          variants={modalBackdrop}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close paywall"
          />

          {/* Content */}
          <motion.div
            className="relative glass-card-v2-elevated w-full max-w-sm p-6 text-center overflow-hidden"
            variants={modalContent}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {variant === 'child' ? (
              <>
                <motion.div
                  className="text-5xl mb-4"
                  animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {CHILD_MESSAGES[context].emoji}
                </motion.div>
                <h2 className="font-display text-lg font-bold text-white mb-2">
                  {CHILD_MESSAGES[context].title}
                </h2>
                <p className="font-body text-sm text-white/50 mb-4">
                  {CHILD_MESSAGES[context].body}
                </p>

                {/* ENH #7: Progress ring showing remaining free uses */}
                {showProgressRing && (
                  <div className="flex flex-col items-center mb-4">
                    <ProgressRing
                      current={currentUsage!}
                      max={maxUsage!}
                    />
                    <p className="font-body text-xs text-white/60 mt-2">
                      {context === 'games' ? 'Games played this week' :
                       context === 'prompts' ? 'Prompts used today' :
                       'Uses this period'}
                    </p>
                  </div>
                )}

                <motion.button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-white/10 border border-white/10 text-white font-display font-bold text-sm"
                  whileTap={{ scale: 0.98 }}
                >
                  Got It!
                </motion.button>
              </>
            ) : (
              <>
                {/* Glow accent */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-spark-orange/10 blur-3xl pointer-events-none" />

                <div className="w-14 h-14 rounded-full bg-spark-orange/10 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-spark-orange" />
                </div>

                <h2 className="font-display text-lg font-bold text-white mb-2">
                  {PARENT_MESSAGES[context].title}
                </h2>
                <p className="font-body text-sm text-white/50 mb-6">
                  {PARENT_MESSAGES[context].body}
                </p>

                <Link href="/parent/subscription" onClick={onClose}>
                  <motion.button
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-spark-orange to-amber-600 text-white font-display text-sm font-bold flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Rocket className="w-4 h-4" />
                    Upgrade to {suggestedDisplay.name} — ${suggestedDisplay.monthlyPrice}/mo
                  </motion.button>
                </Link>

                <button
                  onClick={onClose}
                  className="mt-3 font-body text-xs text-white/60 hover:text-white/50 transition-colors"
                >
                  Maybe later
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
