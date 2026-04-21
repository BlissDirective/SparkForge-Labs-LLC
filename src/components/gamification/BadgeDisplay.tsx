'use client';

import { motion } from 'motion/react';
import { getRarityColor, getRarityGlow, getRarityLabel } from '@/lib/gamification';
// R2: a11y state merged into uiStore (was accessibilityStore)
import { useUIStore } from '@/stores/uiStore';
import type { BadgeCategory, BadgeRarity } from '@/types';

// ════════════════════════════════════════════════════
// BADGE DISPLAY — Single badge card with rarity styling
// Earned badges: full color, glow, rarity indicator
// Locked badges: grayscale, lock icon, no glow
// ════════════════════════════════════════════════════

export interface BadgeData {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: BadgeRarity;
  earned: boolean;
  category: BadgeCategory;
}

interface BadgeDisplayProps {
  badge: BadgeData;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CONFIG = {
  sm: { card: 'w-28 h-32', icon: 'text-2xl', name: 'text-xs', stars: 'text-[10px]' },
  md: { card: 'w-36 h-40', icon: 'text-3xl', name: 'text-sm', stars: 'text-xs' },
  lg: { card: 'w-44 h-48', icon: 'text-4xl', name: 'text-base', stars: 'text-sm' },
} as const;

export function BadgeDisplay({ badge, size = 'md' }: BadgeDisplayProps) {
  const reduceMotion = useUIStore((s) => s.a11y.reduceMotion);
  const config = SIZE_CONFIG[size];
  const rarityColor = getRarityColor(badge.rarity);
  const rarityGlow = getRarityGlow(badge.rarity);
  const rarityStars = getRarityLabel(badge.rarity);

  const earned = badge.earned;
  const statusLabel = earned
    ? `${badge.name}, ${badge.rarity} badge, earned`
    : `${badge.name}, locked badge`;

  return (
    <motion.div
      role="listitem"
      aria-label={statusLabel}
      className={`
        ${config.card} relative flex flex-col items-center justify-center gap-2
        rounded-xl border border-white/[0.06] p-3
        backdrop-blur-md transition-colors
        ${earned
          ? 'bg-[#111118]/70'
          : 'bg-[#111118]/40 opacity-60'
        }
      `}
      style={{
        boxShadow: earned ? rarityGlow : 'none',
        borderColor: earned ? `${rarityColor}30` : undefined,
      }}
      whileHover={
        !reduceMotion && earned
          ? { scale: 1.06, transition: { duration: 0.2 } }
          : undefined
      }
      whileTap={
        !reduceMotion && earned
          ? { scale: 0.97 }
          : undefined
      }
    >
      {/* Rarity indicator bar */}
      {earned && (
        <div
          className="absolute top-0 left-3 right-3 h-[2px] rounded-full"
          style={{ backgroundColor: rarityColor }}
        />
      )}

      {/* Badge icon or lock */}
      <div
        className={`
          ${config.icon} leading-none select-none
          ${earned ? '' : 'grayscale'}
        `}
      >
        {earned ? badge.icon : '\uD83D\uDD12'}
      </div>

      {/* Badge name */}
      <span
        className={`
          ${config.name} font-display font-semibold text-center leading-tight
          ${earned ? 'text-white' : 'text-white/70'}
        `}
        style={{ color: earned ? rarityColor : undefined }}
      >
        {badge.name}
      </span>

      {/* Rarity stars (earned only) */}
      {earned && (
        <span
          className={`${config.stars} leading-none`}
          style={{ color: rarityColor }}
          aria-hidden="true"
        >
          {rarityStars}
        </span>
      )}

      {/* Locked label */}
      {!earned && (
        <span className="text-[10px] font-body text-white/60 uppercase tracking-wider">
          Locked
        </span>
      )}
    </motion.div>
  );
}
