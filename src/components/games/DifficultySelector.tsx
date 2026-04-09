'use client';

import { motion } from 'motion/react';

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

/**
 * Difficulty tier selector with age-band gating.
 * Band A: Easy + Medium, Band B: +Hard, Band C: +Expert
 */
export function DifficultySelector({ value, onChange, ageBand, className = '' }: DifficultySelectorProps) {
  const available = TIERS.filter(t => BAND_ORDER[t.minBand] <= BAND_ORDER[ageBand]);

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`} role="radiogroup" aria-label="Difficulty level">
      {available.map(tier => {
        const isActive = value === tier.id;
        return (
          <motion.button
            key={tier.id}
            onClick={() => onChange(tier.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
