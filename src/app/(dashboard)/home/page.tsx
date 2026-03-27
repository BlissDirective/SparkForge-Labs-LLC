'use client';

// ════════════════════════════════════════════════════
// HOME DASHBOARD — 3D-Embedded Cockpit Page
// ════════════════════════════════════════════════════
// Stage 4: Full dashboard replacing Stage 3 placeholder.
// All primary data renders via 3D cockpit components:
//   - InteractiveConsole3D variants: XP, streak, level, coins
//   - StatusBar3D: speedometer + flame + 10 lab indicators
//   - VariableDialCluster: XP Rate / Streak Days / Lab Progress
//   - NavigationButtonGrid: HOME active (depressed + pulsing)
//
// This page is a THIN HTML overlay providing:
//   - Welcome greeting (accessible, readable text)
//   - "Continue Learning" CTA
//   - Daily challenge card
//   - Lab progress summary (accessible text for screen readers)
//   - ARIA live region for real-time stat updates
//
// The 3D cockpit IS the dashboard. This HTML layer supplements it
// with readable text and accessible content that complements the
// visual spectacle happening in the CockpitCanvas behind it.

import { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useChildStore } from '@/stores/childStore';
import { useUIStore } from '@/stores/uiStore';
import { useAllLabsProgress } from '@/hooks/useProgress';
import { useDailyChallenge } from '@/hooks/useContent';
import { useBadges } from '@/hooks/useGamification';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { Zap, Flame, Trophy, BookOpen, ChevronRight, Sparkles } from 'lucide-react';

// Lab data for progress display
const LAB_NAMES = [
  'What IS AI?', 'Teaching Machines', 'The Brain Inside',
  'AI That Creates', 'AI Helpers', 'AI & Ethics',
  'Computer Vision', 'Words & Language', 'Build Your AI', "AI's Future",
] as const;

const LAB_COLORS = [
  '#00BBFF', '#AA66FF', '#FF66AA', '#FFAA44', '#00FF88',
  '#FF6644', '#06B6D4', '#818CF8', '#F97316', '#D946EF',
] as const;

export default function HomePage() {
  const { activeChild } = useChildStore();
  const setLabColor = useUIStore((s) => s.setLabColor);
  const childId = activeChild?.id || '';
  const ageBand = activeChild?.age_band || 'B';

  // Set cockpit to default blue on home page mount
  useEffect(() => {
    setLabColor('#00BBFF');
  }, [setLabColor]);

  // React Query data
  const { data: labsProgress, isLoading: labsLoading } = useAllLabsProgress(childId);
  const { data: dailyChallenge } = useDailyChallenge(ageBand);
  const { data: badges } = useBadges(childId);

  // Compute overall progress
  const overallProgress = useMemo(() => {
    if (!labsProgress || !Array.isArray(labsProgress)) return 0;
    const total = labsProgress.reduce((sum: number, lab: { percent?: number }) =>
      sum + (lab.percent || 0), 0);
    return Math.round(total / 10);
  }, [labsProgress]);

  const earnedBadgeCount = useMemo(() => {
    if (!badges || !Array.isArray(badges)) return 0;
    return badges.filter((b: { earned?: boolean }) => b.earned).length;
  }, [badges]);

  if (!activeChild) {
    return (
      <div className="text-center py-20" role="status" aria-label="Loading dashboard">
        <div className="w-8 h-8 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin mx-auto" />
        <p className="text-white/50 font-body mt-4">Initializing cockpit systems...</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-4 max-w-4xl mx-auto"
      role="main"
      aria-label="SparkForge Home Dashboard"
    >
      {/* ═══ Welcome Header — Cockpit-themed overlay ═══ */}
      <motion.div
        variants={staggerItem}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-white drop-shadow-[0_0_12px_rgba(0,187,255,0.3)]">
            Welcome back, {activeChild.display_name}
          </h1>
          <p className="font-mono text-xs text-neon-blue/60 tracking-wider mt-1">
            STATION ONLINE · LEVEL {activeChild.level} · {activeChild.level_title?.toUpperCase()}
          </p>
        </div>
        {activeChild.streak_count > 0 && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-spark-orange/30 bg-spark-orange/5 backdrop-blur-sm"
            role="status"
            aria-label={`${activeChild.streak_count} day streak`}
          >
            <Flame className="w-4 h-4 text-spark-orange" />
            <span className="font-data font-bold text-spark-orange text-sm">
              {activeChild.streak_count}
            </span>
          </div>
        )}
      </motion.div>

      {/* ═══ Quick Stats — Glass cards with cockpit glow ═══ */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-4 gap-3"
        role="group"
        aria-label="Player statistics"
      >
        {[
          { label: 'Total XP', value: activeChild.xp.toLocaleString(), icon: Zap, color: '#00BBFF' },
          { label: 'Level', value: activeChild.level, icon: Sparkles, color: '#AA66FF' },
          { label: 'Badges', value: earnedBadgeCount, icon: Trophy, color: '#FFAA44' },
          { label: 'Progress', value: `${overallProgress}%`, icon: BookOpen, color: '#00FF88' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-3 text-center backdrop-blur-md border border-white/[0.06] bg-surface-card/60"
            style={{ boxShadow: `0 0 20px ${stat.color}15, inset 0 1px 0 rgba(255,255,255,0.06)` }}
            role="status"
            aria-label={`${stat.label}: ${stat.value}`}
          >
            <stat.icon className="w-5 h-5 mx-auto mb-1" style={{ color: stat.color }} />
            <p className="font-data text-lg font-bold text-white">{stat.value}</p>
            <p className="font-mono text-[10px] text-white/30 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* ═══ Continue Learning CTA ═══ */}
      <motion.div variants={staggerItem}>
        <Link
          href="/labs"
          className="group flex items-center justify-between rounded-xl p-4 backdrop-blur-md border border-neon-blue/20 bg-neon-blue/5 hover:bg-neon-blue/10 hover:border-neon-blue/40 transition-all"
          aria-label="Continue learning — go to Labs"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00BBFF20, #AA66FF20)', border: '1px solid rgba(0,187,255,0.2)' }}
            >
              <BookOpen className="w-5 h-5 text-neon-blue" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm">Continue Learning</p>
              <p className="font-body text-white/40 text-xs">
                {overallProgress > 0 ? `${overallProgress}% overall progress · ${10 - Math.floor(overallProgress / 10)} labs remaining` : 'Start your AI learning journey'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-neon-blue group-hover:translate-x-1 transition-all" />
        </Link>
      </motion.div>

      {/* ═══ Daily Challenge ═══ */}
      {dailyChallenge && (
        <motion.div variants={staggerItem}>
          <Link
            href={`/content/${dailyChallenge.slug}`}
            className="group flex items-center gap-3 rounded-xl p-4 backdrop-blur-md border border-spark-purple/20 bg-spark-purple/5 hover:bg-spark-purple/10 hover:border-spark-purple/40 transition-all"
            aria-label={`Daily challenge: ${dailyChallenge.title}`}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #AA66FF20, #FF66AA20)', border: '1px solid rgba(170,102,255,0.2)' }}
            >
              <span className="text-lg">⚡</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[10px] text-spark-purple/60 uppercase tracking-wider mb-0.5">Daily Challenge</p>
              <p className="font-display font-bold text-white text-sm truncate">{dailyChallenge.title}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-spark-purple group-hover:translate-x-1 transition-all flex-shrink-0" />
          </Link>
        </motion.div>
      )}

      {/* ═══ Lab Progress Grid ═══ */}
      <motion.div variants={staggerItem}>
        <h2 className="font-mono text-[10px] text-white/30 uppercase tracking-[0.15em] mb-2">
          Lab Progress
        </h2>
        <div className="grid grid-cols-5 gap-2" role="list" aria-label="Lab progress overview">
          {LAB_NAMES.map((name, i) => {
            const labNum = i + 1;
            const color = LAB_COLORS[i];
            const progress = labsLoading ? 0 :
              (Array.isArray(labsProgress) ? (labsProgress[i]?.percent || 0) : 0);

            return (
              <Link
                key={labNum}
                href={`/labs/${labNum}`}
                className="group rounded-lg p-2 text-center backdrop-blur-sm border border-white/[0.04] bg-surface-card/40 hover:bg-surface-card/70 hover:border-white/10 transition-all"
                role="listitem"
                aria-label={`Lab ${labNum}: ${name} — ${Math.round(progress)}% complete`}
              >
                <div
                  className="w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center text-[10px] font-data font-bold"
                  style={{
                    background: `${color}20`,
                    border: `1.5px solid ${color}40`,
                    color,
                    boxShadow: progress > 0 ? `0 0 8px ${color}30` : 'none',
                  }}
                >
                  {labNum}
                </div>
                {/* Progress bar */}
                <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }}
                  />
                </div>
                <p className="font-mono text-[7px] text-white/25 mt-1 truncate">{name}</p>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ ARIA Live Region — announces stat changes from 3D cockpit ═══ */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        XP: {activeChild.xp}. Level: {activeChild.level}. Streak: {activeChild.streak_count} days.
        Overall progress: {overallProgress}%.
      </div>
    </motion.div>
  );
}
