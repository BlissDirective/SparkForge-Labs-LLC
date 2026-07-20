// ════════════════════════════════════════════════════════════════
// QUICK STATS BAR — Phase 3 Top-Level Overview
// Compact horizontal bar integrating Phase 2 components:
// StreakCounter, CurrencyDisplay, and key stats.
// ════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { Trophy, Target, TrendingUp, Gem } from 'lucide-react';
import { StreakCounter } from '@/components/streak/StreakCounter';
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay';

export interface QuickStats {
  streakCount: number;
  longestStreak: number;
  freezesEquipped: number;
  gems: number;
  canClaimDaily: boolean;
  dailyStreak: number;
  earnedBadges: number;
  totalBadges: number;
  leagueTier: string;
  leagueRank: number | null;
  xp: number;
  level: number;
}

interface QuickStatsBarProps {
  stats: QuickStats;
  childName: string;
  onClaimDaily: () => Promise<boolean>;
  onOpenStreakDetails?: () => void;
  onOpenShop?: () => void;
}

export function QuickStatsBar({
  stats,
  childName,
  onClaimDaily,
  onOpenStreakDetails,
  onOpenShop,
}: QuickStatsBarProps) {
  const xpToNext = (stats.level ?? 1) * 100;
  const xpProgress = Math.min(100, ((stats.xp ?? 0) % 100) / 100 * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3"
    >
      {/* Streak Counter */}
      <div className="col-span-1">
        <StreakCounter
          streakCount={stats.streakCount}
          longestStreak={stats.longestStreak}
          freezesEquipped={stats.freezesEquipped}
          isAtRisk={false}
          nextMilestone={null}
          daysUntilMilestone={0}
          onClick={onOpenStreakDetails}
          compact
        />
      </div>

      {/* Gems */}
      <div className="col-span-1 flex items-center">
        <CurrencyDisplay
          gems={stats.gems}
          canClaimDaily={stats.canClaimDaily}
          dailyStreak={stats.dailyStreak}
          onClaimDaily={onClaimDaily}
          onOpenShop={onOpenShop}
          compact
        />
      </div>

      {/* Badges */}
      <motion.div
        whileHover={{ scale: 1.03 }}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-sf-console/60 border border-sf-console-border/30 cursor-pointer"
      >
        <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
          <Trophy className="w-4.5 h-4.5 text-amber-400" />
        </div>
        <div>
          <p className="text-xs text-sf-console-text-dim">Badges</p>
          <p className="text-sm font-bold text-white">
            {stats.earnedBadges}
            <span className="text-sf-console-text-faint font-normal">/{stats.totalBadges}</span>
          </p>
        </div>
      </motion.div>

      {/* League */}
      <motion.div
        whileHover={{ scale: 1.03 }}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-sf-console/60 border border-sf-console-border/30 cursor-pointer"
      >
        <div className="w-9 h-9 rounded-lg bg-sf-console-accent-alt/10 flex items-center justify-center shrink-0">
          <Target className="w-4.5 h-4.5 text-sf-console-accent-alt" />
        </div>
        <div>
          <p className="text-xs text-sf-console-text-dim">League</p>
          <p className="text-sm font-bold text-white capitalize">
            {stats.leagueTier || 'Bronze'}
          </p>
        </div>
      </motion.div>

      {/* XP / Level (hidden on mobile) */}
      <div className="hidden lg:flex items-center gap-2.5 px-3 py-2 rounded-xl bg-sf-console/60 border border-sf-console-border/30">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
          <TrendingUp className="w-4.5 h-4.5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-sf-console-text-dim">Level {stats.level}</p>
            <p className="text-[10px] text-sf-console-text-faint">{Math.round(xpProgress)}%</p>
          </div>
          <div className="w-full h-1.5 bg-sf-console-well rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
