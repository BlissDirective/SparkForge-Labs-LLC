// ════════════════════════════════════════════════════════════════
// PROGRESS — Learning Progress Dashboard (Phase 3)
// ════════════════════════════════════════════════════════════════
// Detailed progress tracking with charts, lab breakdown, and
// React Bits-enhanced visuals (GradientText, CountUp, SpotlightCard).

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Gamepad2, Clock, Zap, ChevronRight,
  Trophy, Target, Flame,
} from 'lucide-react';
import { useActiveChild } from '@/hooks/useChildren';
import { useAllLabsProgress } from '@/hooks/useProgress';
import { useParentDashboard } from '@/hooks/useParentDashboard';
import { LAB_COLORS, LAB_NAMES, LAB_ICONS } from '@/config/labs';
import { SFCard } from '@/components/ui/SFCard';
import { SFProgressBar } from '@/components/ui/SFProgressBar';
import BlurText from '@/components/bits/BlurText';
import CountUp from '@/components/bits/CountUp';
import { SparkyCore } from '@/components/sparky';
import { ProgressCharts } from '@/components/progress';

export default function ProgressPage() {
  const child = useActiveChild();
  const childId = child?.id ?? '';
  const { data: labsProgress, isLoading } = useAllLabsProgress(childId);
  const { children: dashboardChildren } = useParentDashboard();

  // Get actual total time from parent dashboard data (CRITICAL-003 fix)
  const matchedChild = dashboardChildren.find((c) => c.id === childId);
  const totalTimeMinutes = matchedChild?.total_time_minutes ?? 0;

  const overallProgress = useMemo(() => {
    if (!labsProgress || !Array.isArray(labsProgress)) return 0;
    const total = (labsProgress as Array<{ percent?: number }>).reduce((s, l) => s + (l.percent || 0), 0);
    return Math.min(100, Math.round(total / Math.max((labsProgress as unknown[]).length, 1)));
  }, [labsProgress]);

  const labBreakdown = useMemo(() => {
    if (!labsProgress || !Array.isArray(labsProgress)) return [];
    return (labsProgress as Array<{ lab?: number; percent?: number; games_completed?: number; total_games?: number }>)
      .map((p) => ({
        lab: p.lab ?? 0,
        percent: p.percent ?? 0,
        gamesCompleted: p.games_completed ?? 0,
        totalGames: p.total_games ?? 0,
        name: LAB_NAMES[p.lab ?? 0] || `Lab ${p.lab}`,
        color: LAB_COLORS[p.lab ?? 0] || '#4F6EF7',
      }))
      .filter((l) => l.lab > 0)
      .sort((a, b) => b.percent - a.percent);
  }, [labsProgress]);

  const stats = useMemo(() => {
    if (!labsProgress || !Array.isArray(labsProgress)) {
      return { gamesPlayed: 0, gamesCompleted: 0, totalXP: child?.xp ?? 0, hoursPlayed: 0 };
    }
    const completed = (labsProgress as Array<{ games_completed?: number }>).reduce((s, l) => s + (l.games_completed || 0), 0);
    return {
      gamesPlayed: completed,
      gamesCompleted: completed,
      totalXP: child?.xp ?? 0,
      // CRITICAL-003: Use actual tracked time instead of XP/60
      hoursPlayed: Math.round(totalTimeMinutes / 60),
    };
  }, [labsProgress, child, totalTimeMinutes]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 lg:pb-0">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-1" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
          <BlurText text="Your Progress" />
        </h1>
        <p className="text-sm" style={{ color: '#52586E' }}>
          See how far your curiosity has taken you.
        </p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total XP', value: stats.totalXP, icon: Zap, color: '#4F6EF7', suffix: '' },
          { label: 'Games Played', value: stats.gamesPlayed, icon: Gamepad2, color: '#E945F5', suffix: '' },
          { label: 'Completed', value: stats.gamesCompleted, icon: Trophy, color: '#2ECC71', suffix: '' },
          { label: 'Hours', value: stats.hoursPlayed, icon: Clock, color: '#FF6B35', suffix: 'h' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <SFCard variant="elevated" className="text-center p-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
                <CountUp to={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#8C94AC' }}>{stat.label}</p>
            </SFCard>
          </motion.div>
        ))}
      </div>

      {/* ═══ Phase 5: Progress Charts (Donut + Sparkline + Bar) ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <ProgressCharts
          labData={labBreakdown}
          overallPercent={overallProgress}
          totalGamesPlayed={stats.gamesPlayed}
          totalTimeMinutes={totalTimeMinutes}
        />
      </motion.div>

      {/* Streak — the old "Overall Progress" spotlight card duplicated
          the Overall Completion donut rendered by ProgressCharts just
          above (and read "Across all 0 learning labs" for fresh
          profiles). One source of truth for completion; streak gets
          its own full-width card (P1-6). */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <SFCard variant="elevated" className="p-5">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #FFD93D)', boxShadow: '0 4px 16px rgba(255,107,53,0.25)' }}
            >
              <Flame className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: '#8C94AC' }}>Current Streak</p>
              <p className="text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color: '#FF6B35' }}>
                <CountUp to={child?.streak_count ?? 0} /> days
              </p>
              <p className="text-xs" style={{ color: '#8C94AC' }}>
                Keep playing daily to maintain your streak!
              </p>
            </div>
          </div>
        </SFCard>
      </motion.div>

      {/* Lab Breakdown */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
          <Target className="w-5 h-5 inline mr-1" style={{ color: '#4F6EF7' }} />
          Lab Breakdown
        </h2>

        <div className="space-y-3">
          {labBreakdown.length === 0 && !isLoading && (
            <SFCard variant="default" className="text-center py-8">
              <div className="flex justify-center mb-3" aria-hidden="true">
                <SparkyCore expression="thinking" pixelSize={72} showAura={false} />
              </div>
              <p className="text-sm" style={{ color: '#52586E' }}>
                No lab progress yet — play any game to start filling this in!
              </p>
              <Link
                href="/labs"
                className="inline-flex items-center gap-1 mt-2 text-sm font-semibold"
                style={{ color: '#4F6EF7' }}
                aria-label="Explore the Labs"
              >
                Explore the Labs <ChevronRight className="w-4 h-4" />
              </Link>
            </SFCard>
          )}
          {labBreakdown.map((lab) => (
            <SFCard key={lab.lab} variant="default" padding="sm" className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: `${lab.color}15` }}
              >
                <span>{LAB_ICONS[lab.lab] || '\uD83E\uDDE0'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold truncate" style={{ color: '#1A1D2B' }}>{lab.name}</span>
                  <span className="text-xs font-bold shrink-0 ml-2" style={{ color: lab.color }}>{Math.round(lab.percent)}%</span>
                </div>
                <SFProgressBar value={lab.percent} max={100} variant="primary" />
              </div>
              <span className="text-xs shrink-0 hidden sm:block" style={{ color: '#8C94AC' }}>
                {lab.gamesCompleted}/{lab.totalGames}
              </span>
            </SFCard>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Lab icons are handled inline
