// ════════════════════════════════════════════════════════════════
// ANALYTICS CARD — Deep Learning Insights (Phase 5)
// ════════════════════════════════════════════════════════════════
// Rich analytics for parents showing learning velocity, time
// distribution across games, weekly trends, and skill development.
// Uses SVG micro-visualizations for at-a-glance insights.

'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp, Clock, Zap, BookOpen, Star, Flame,
  Trophy, Target,
} from 'lucide-react';
import { SFCard } from '@/components/ui/SFCard';
import CountUp from '@/components/bits/CountUp';

interface GameTimeBreakdown {
  gameName: string;
  minutes: number;
  color: string;
}

interface WeeklyComparison {
  week: string;
  gamesPlayed: number;
  timeMinutes: number;
  xpEarned: number;
}

interface AnalyticsCardProps {
  childName: string;
  totalGamesPlayed: number;
  totalTimeMinutes: number;
  xpEarned: number;
  streakDays: number;
  gamesCompleted: number;
  timeBreakdown?: GameTimeBreakdown[];
  weeklyComparison?: WeeklyComparison[];
  recentAchievements?: string[];
}

// Mini horizontal bar for time breakdown
function MiniBar({ value, max, color, label, sublabel }: {
  value: number; max: number; color: string; label: string; sublabel: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-xs font-semibold" style={{ color: '#1A1D2B' }}>{label}</span>
          <span className="text-xs" style={{ color: '#8C94AC' }}>{sublabel}</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#F0F1F8' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}CC)` }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}

// Spark bar micro-chart for weekly comparison
function SparkBars({ data }: { data: WeeklyComparison[] }) {
  const maxGames = Math.max(...data.map((d) => d.gamesPlayed), 1);

  return (
    <div className="flex items-end gap-2 h-16">
      {data.map((week, i) => (
        <div key={week.week} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            className="w-full rounded-t-md"
            style={{
              background: `linear-gradient(to top, #4F6EF7, #4F6EF7AA)`,
              height: `${(week.gamesPlayed / maxGames) * 100}%`,
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          />
          <span className="text-[9px] font-medium" style={{ color: '#8C94AC' }}>
            {week.week}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsCard({
  childName,
  totalGamesPlayed,
  totalTimeMinutes,
  xpEarned,
  streakDays,
  gamesCompleted,
  timeBreakdown,
  weeklyComparison,
  recentAchievements,
}: AnalyticsCardProps) {
  // Default time breakdown if none provided
  const defaultBreakdown: GameTimeBreakdown[] = useMemo(() => [
    { gameName: 'Pet Trainer', minutes: 45, color: '#E945F5' },
    { gameName: 'Sort Toy Box', minutes: 30, color: '#4F6EF7' },
    { gameName: 'Data Detective', minutes: 25, color: '#FF6B35' },
    { gameName: 'Code Blocks', minutes: 20, color: '#2ECC71' },
  ], []);

  const breakdown = timeBreakdown && timeBreakdown.length > 0 ? timeBreakdown : defaultBreakdown;
  const maxMinutes = Math.max(...breakdown.map((b) => b.minutes), 1);

  // Default weekly data
  const defaultWeekly: WeeklyComparison[] = useMemo(() => [
    { week: 'W1', gamesPlayed: 4, timeMinutes: 60, xpEarned: 240 },
    { week: 'W2', gamesPlayed: 6, timeMinutes: 90, xpEarned: 380 },
    { week: 'W3', gamesPlayed: 5, timeMinutes: 75, xpEarned: 310 },
    { week: 'W4', gamesPlayed: 8, timeMinutes: 120, xpEarned: 520 },
  ], []);

  const weekly = weeklyComparison && weeklyComparison.length > 0 ? weeklyComparison : defaultWeekly;

  // Compute learning velocity (XP per hour)
  const velocity = totalTimeMinutes > 0 ? Math.round((xpEarned / totalTimeMinutes) * 60) : 0;
  const velocityTrend = velocity > 100 ? 'up' : velocity > 50 ? 'steady' : 'starting';

  const statCards = [
    { icon: Trophy, label: 'Games Played', value: totalGamesPlayed, color: '#E945F5' },
    { icon: Clock, label: 'Total Time', value: `${Math.round(totalTimeMinutes / 60)}h`, color: '#4F6EF7' },
    { icon: Zap, label: 'XP Earned', value: xpEarned, color: '#FF6B35', useCountUp: true },
    { icon: Flame, label: 'Day Streak', value: streakDays, color: '#FF6B35' },
  ];

  return (
    <div className="space-y-4">
      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <SFCard variant="elevated" className="p-3 text-center">
              <stat.icon className="w-5 h-5 mx-auto mb-1" style={{ color: stat.color }} />
              <p className="text-lg font-extrabold" style={{ color: '#1A1D2B', fontFamily: 'var(--font-display)' }}>
                {stat.useCountUp && typeof stat.value === 'number' ? (
                  <CountUp end={stat.value} duration={1.5} />
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-[10px] font-medium" style={{ color: '#8C94AC' }}>{stat.label}</p>
            </SFCard>
          </motion.div>
        ))}
      </div>

      {/* Time breakdown */}
      <SFCard variant="elevated" className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4" style={{ color: '#4F6EF7' }} />
          <h4 className="text-sm font-bold" style={{ color: '#1A1D2B' }}>
            Time by Game
          </h4>
        </div>
        <div className="space-y-3">
          {breakdown.map((b) => (
            <MiniBar
              key={b.gameName}
              value={b.minutes}
              max={maxMinutes}
              color={b.color}
              label={b.gameName}
              sublabel={`${b.minutes}m`}
            />
          ))}
        </div>
      </SFCard>

      {/* Weekly activity + Velocity side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SFCard variant="elevated" className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4" style={{ color: '#2ECC71' }} />
            <h4 className="text-sm font-bold" style={{ color: '#1A1D2B' }}>
              Weekly Activity
            </h4>
          </div>
          <SparkBars data={weekly} />
          <p className="text-xs text-center mt-2" style={{ color: '#8C94AC' }}>
            Games played per week
          </p>
        </SFCard>

        <SFCard variant="elevated" className="p-5 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4" style={{ color: '#E945F5' }} />
            <h4 className="text-sm font-bold" style={{ color: '#1A1D2B' }}>
              Learning Velocity
            </h4>
          </div>
          <p className="text-3xl font-extrabold mb-1" style={{ color: '#1A1D2B', fontFamily: 'var(--font-display)' }}>
            {velocity}
          </p>
          <p className="text-xs mb-3" style={{ color: '#8C94AC' }}>
            XP earned per hour
          </p>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                background: velocityTrend === 'up' ? '#2ECC7118' : velocityTrend === 'steady' ? '#4F6EF718' : '#FF6B3518',
                color: velocityTrend === 'up' ? '#2ECC71' : velocityTrend === 'steady' ? '#4F6EF7' : '#FF6B35',
              }}
            >
              <TrendingUp className="w-3 h-3" />
              {velocityTrend === 'up' ? 'Accelerating' : velocityTrend === 'steady' ? 'Steady' : 'Getting Started'}
            </span>
          </div>
        </SFCard>
      </div>

      {/* Recent achievements */}
      {recentAchievements && recentAchievements.length > 0 && (
        <SFCard variant="elevated" className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4" style={{ color: '#FF6B35' }} />
            <h4 className="text-sm font-bold" style={{ color: '#1A1D2B' }}>
              Recent Achievements
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentAchievements.map((achievement) => (
              <span
                key={achievement}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: '#FF6B3515', color: '#FF6B35' }}
              >
                <Trophy className="w-3 h-3" />
                {achievement}
              </span>
            ))}
          </div>
        </SFCard>
      )}
    </div>
  );
}
