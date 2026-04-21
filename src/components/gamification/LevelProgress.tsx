'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { calculateLevel, getLevelColor, getLevelTierName } from '@/lib/gamification';
// R2: a11y state merged into uiStore (was accessibilityStore)
import { useUIStore } from '@/stores/uiStore';

// ════════════════════════════════════════════════════
// LEVEL PROGRESS — Circular SVG ring with tier info
// Displays current level, XP progress, and tier name
// Color-coded by tier with animated fill
// ════════════════════════════════════════════════════

interface LevelProgressProps {
  xp: number;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CONFIG = {
  sm: { dimension: 64,  stroke: 4, fontSize: 16, tierFont: 'text-[10px]', xpFont: 'text-[10px]' },
  md: { dimension: 96,  stroke: 5, fontSize: 22, tierFont: 'text-xs',     xpFont: 'text-xs'     },
  lg: { dimension: 128, stroke: 6, fontSize: 30, tierFont: 'text-sm',     xpFont: 'text-sm'     },
} as const;

export function LevelProgress({ xp, size = 'md' }: LevelProgressProps) {
  const reduceMotion = useUIStore((s) => s.a11y.reduceMotion);
  const config = SIZE_CONFIG[size];

  const levelInfo = useMemo(() => calculateLevel(xp), [xp]);
  const tierColor = getLevelColor(levelInfo.level);
  const tierName = getLevelTierName(levelInfo.level);

  const radius = (config.dimension - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference * (1 - levelInfo.progress);
  const xpRemaining = levelInfo.xpForNextLevel - xp;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Circular progress ring */}
      <div
        className="relative"
        style={{ width: config.dimension, height: config.dimension }}
        role="progressbar"
        aria-valuenow={Math.round(levelInfo.progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Level ${levelInfo.level}, ${tierName}, ${Math.round(levelInfo.progress * 100)}% to next level`}
      >
        <svg
          width={config.dimension}
          height={config.dimension}
          className="-rotate-90"
        >
          {/* Background track */}
          <circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={config.stroke}
          />

          {/* Progress arc */}
          <motion.circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={radius}
            fill="none"
            stroke={tierColor}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={
              reduceMotion
                ? { strokeDashoffset: progressOffset }
                : { strokeDashoffset: circumference }
            }
            animate={{ strokeDashoffset: progressOffset }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 1.2, ease: 'easeOut' }
            }
            style={{
              filter: `drop-shadow(0 0 4px ${tierColor}60)`,
            }}
          />
        </svg>

        {/* Level number in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-data font-bold leading-none"
            style={{
              fontSize: config.fontSize,
              color: tierColor,
            }}
          >
            {levelInfo.level}
          </span>
        </div>
      </div>

      {/* Tier name */}
      <span
        className={`${config.tierFont} font-display font-semibold tracking-wide`}
        style={{ color: tierColor }}
      >
        {tierName}
      </span>

      {/* XP remaining */}
      <span className={`${config.xpFont} font-data text-white/70`}>
        {xpRemaining > 0
          ? `${xpRemaining.toLocaleString()} XP to next level`
          : 'Max level reached!'
        }
      </span>
    </div>
  );
}
