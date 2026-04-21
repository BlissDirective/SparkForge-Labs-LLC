'use client';

import { motion, useReducedMotion } from 'motion/react';

export type DifficultyTier = 'easy' | 'medium' | 'hard' | 'expert';

interface DifficultySelectorProps {
  value: DifficultyTier | 'all';
  onChange: (tier: DifficultyTier | 'all') => void;
  ageBand: 'A' | 'B' | 'C';
  className?: string;
}

const TIERS: { id: DifficultyTier | 'all'; label: string; emoji: string; color: string; minBand: 'A' | 'B' | 'C' }[] = [
  { id: 'all', label: 'All', emoji: '🎯', color: '#00BBFF', minBand: 'A' },
  { id: 'easy', label: 'Easy', emoji: '🟢', color: '#00FF88', minBand: 'A' },
  { id: 'medium', label: 'Medium', emoji: '🟡', color: '#FFAA44', minBand: 'A' },
  { id: 'hard', label: 'Hard', emoji: '🟠', color: '#FF6644', minBand: 'B' },
  { id: 'expert', label: 'Expert', emoji: '🔴', color: '#AA66FF', minBand: 'C' },
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

// Phase 5 P.6-MIN (§8.8): Per-tier unlock messaging for locked chips.
// Keyed to the Band the player needs to progress to in order to unlock.
const UNLOCK_MESSAGE: Record<'A' | 'B' | 'C', string> = {
  A: 'Unlocked from the start',
  B: 'Available at age 10-12 (Band B)',
  C: 'Available at age 13-16 (Band C)',
};

/**
 * Difficulty tier selector with age-band gating.
 *
 * Band A: Easy + Medium, Band B: +Hard, Band C: +Expert.
 *
 * Phase 5 P.6-MIN (§8.8): Locked tiers now RENDER as disabled chips with
 * a tooltip explaining when the tier unlocks. Previously locked tiers were
 * filtered out entirely, leaving users wondering if "Expert" existed.
 * ARIA: `aria-disabled="true"` + descriptive `aria-label`.
 */
export function DifficultySelector({ value, onChange, ageBand, className = '' }: DifficultySelectorProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`} role="radiogroup" aria-label="Difficulty level">
      {TIERS.map(tier => {
        const isActive = value === tier.id;
        const isLocked = BAND_ORDER[tier.minBand] > BAND_ORDER[ageBand];
        const unlockMessage = UNLOCK_MESSAGE[tier.minBand];

        if (isLocked) {
          return (
            <button
              key={tier.id}
              type="button"
              disabled
              aria-disabled="true"
              aria-label={`${tier.label} difficulty — locked, ${unlockMessage.toLowerCase()}`}
              title={unlockMessage}
              role="radio"
              aria-checked={false}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-display text-xs border border-white/6 bg-white/2 text-white/25 cursor-not-allowed relative group"
            >
              <span className="text-sm grayscale opacity-60">{tier.emoji}</span>
              <span className="line-through decoration-white/20">{tier.label}</span>
              <span aria-hidden="true" className="text-white/70 ml-0.5">🔒</span>
              {/* Custom hover tooltip (in addition to `title` for screen-readers) */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-surface-elevated/95 backdrop-blur-sm px-2 py-1 text-[10px] font-body text-white/85 border border-white/10 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity shadow-lg"
              >
                {unlockMessage}
              </span>
            </button>
          );
        }

        return (
          <motion.button
            key={tier.id}
            onClick={() => onChange(tier.id)}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
            className={`
              flex items-center gap-1 px-3 py-1.5 rounded-lg font-display text-xs transition-all
              border ${isActive
                ? 'border-white/20 bg-white/10 text-white shadow-[0_0_8px_rgba(255,255,255,0.1)]'
                : 'border-white/6 bg-white/4 text-white/50 hover:bg-white/6 hover:text-white/70'
              }
            `}
            role="radio"
            aria-checked={isActive}
            aria-label={`${tier.label} difficulty`}
          >
            <span className="text-sm">{tier.emoji}</span>
            <span>{tier.label}</span>
            {isActive && (
              <motion.div
                layoutId="difficulty-indicator"
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: tier.color }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
