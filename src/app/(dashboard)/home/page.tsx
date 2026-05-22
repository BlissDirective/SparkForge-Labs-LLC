// ════════════════════════════════════════════════════════════════
// DASHBOARD HOME — SparkForge v3 Redesign (Phase 3)
// ════════════════════════════════════════════════════════════════
// The main dashboard landing page. Kid-friendly, colorful,
// React Bits-enhanced, fully wired to backend data.

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Sparkles,
  Gamepad2,
  Zap,
  Trophy,
  TrendingUp,
  ChevronRight,
  Target,
  Clock,
  Star,
  Flame,
} from 'lucide-react';
import { useActiveChild } from '@/hooks/useChildren';
import { useAllLabsProgress } from '@/hooks/useProgress';
import { useBadges } from '@/hooks/useGamification';
import { GAME_REGISTRY } from '@/config/gameRegistry';
import { LAB_COLORS } from '@/config/labs';
import { SFCard } from '@/components/ui/SFCard';
import { SFBadge } from '@/components/ui/SFBadge';
import { SFProgressBar } from '@/components/ui/SFProgressBar';
import { SFCircularProgress } from '@/components/ui/SFCircularProgress';
import { SFSkeleton } from '@/components/ui/SFSkeleton';
import SpotlightCard from '@/components/bits/SpotlightCard';
import GradientText from '@/components/bits/GradientText';
import ShinyText from '@/components/bits/ShinyText';

export default function HomePage() {
  const child = useActiveChild();
  const childId = child?.id ?? '';
  const { data: labsProgress, isLoading: progressLoading } = useAllLabsProgress(childId);
  const { data: badgesData } = useBadges(childId);

  const overallProgress = useMemo(() => {
    if (!labsProgress || !Array.isArray(labsProgress)) return 0;
    const total = (labsProgress as Array<{ percent?: number }>).reduce(
      (sum, lab) => sum + (lab.percent || 0), 0
    );
    return Math.min(100, Math.round(total / Math.max(labsProgress.length, 1)));
  }, [labsProgress]);

  const earnedBadges = useMemo(() => {
    if (!badgesData?.badges) return 0;
    return badgesData.badges.filter((b: { earned: boolean }) => b.earned).length;
  }, [badgesData]);

  const totalBadges = badgesData?.badges?.length ?? 0;

  // Featured games (first 4 flagship)
  const featuredGames = useMemo(() =>
    GAME_REGISTRY.filter((g) => g.tier === 'flagship').slice(0, 4),
    []
  );

  // Recently played (simulated from progress)
  const recentGames = useMemo(() => {
    if (!labsProgress) return [];
    const playedSlugs = new Set<string>();
    (labsProgress as Array<{ game_slug?: string }>).forEach((p) => {
      if (p.game_slug) playedSlugs.add(p.game_slug);
    });
    return GAME_REGISTRY.filter((g) => playedSlugs.has(g.slug)).slice(0, 3);
  }, [labsProgress]);

  // Daily challenge (random game)
  const dailyChallenge = useMemo(() =>
    GAME_REGISTRY[Math.floor(Math.random() * GAME_REGISTRY.length)],
    []
  );

  if (!child) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">&#127918;</div>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
          Welcome to SparkForge!
        </h2>
        <p className="text-base mb-6" style={{ color: '#8C94AC' }}>
          Create a profile to start your AI learning journey.
        </p>
        <Link
          href="/parent/add-child"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-sf-full font-semibold text-white transition-all hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, #4F6EF7, #E945F5)' }}
        >
          <Sparkles className="w-5 h-5" />
          Create Profile
        </Link>
      </div>
    );
  }

  const xpToNext = (child.level ?? 1) * 100 - (child.xp ?? 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 lg:pb-0">
      {/* ═══ Hero Welcome Section ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SpotlightCard
          spotlightColor="rgba(79, 110, 247, 0.1)"
          className="relative overflow-hidden"
        >
          {/* Decorative gradient blob */}
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
            style={{ background: 'linear-gradient(135deg, #E945F5, #4F6EF7)' }}
          />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl font-extrabold text-white shrink-0"
              style={{
                background: 'linear-gradient(135deg, #E945F5, #4F6EF7)',
                boxShadow: '0 8px 24px rgba(79,110,247,0.3)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {child.display_name?.charAt(0)?.toUpperCase() || '?'}
            </div>

            <div className="flex-1 min-w-0">
              <h1
                className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight"
                style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}
              >
                Hey{' '}
                <GradientText from="#E945F5" to="#4F6EF7">
                  {child.display_name}
                </GradientText>
                ! &#128075;
              </h1>
              <p className="text-sm mt-1" style={{ color: '#8C94AC' }}>
                Level {child.level} Explorer &middot; {child.xp ?? 0} XP &middot; {child.streak_count ?? 0}-day streak
              </p>

              {/* XP Progress */}
              <div className="mt-3 max-w-md">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: '#8C94AC' }}>Level {child.level}</span>
                  <span style={{ color: '#4F6EF7', fontWeight: 600 }}>{xpToNext} XP to next level</span>
                </div>
                <SFProgressBar
                  value={child.xp ?? 0}
                  max={(child.level ?? 1) * 100}
                  variant="primary"
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-row sm:flex-col gap-3 sm:gap-2 shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(255,217,61,0.15)' }}>
                <Flame className="w-4 h-4" style={{ color: '#FF6B35' }} />
                <span className="text-sm font-bold" style={{ color: '#FF6B35' }}>{child.streak_count ?? 0}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(79,110,247,0.08)' }}>
                <Trophy className="w-4 h-4" style={{ color: '#4F6EF7' }} />
                <span className="text-sm font-bold" style={{ color: '#4F6EF7' }}>{earnedBadges}/{totalBadges}</span>
              </div>
            </div>
          </div>
        </SpotlightCard>
      </motion.section>

      {/* ═══ Quick Actions ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Play Games', icon: Gamepad2, color: '#4F6EF7', href: '/arcade' },
            { label: 'Learning Labs', icon: Zap, color: '#E945F5', href: '/labs' },
            { label: 'My Progress', icon: TrendingUp, color: '#2ECC71', href: '/progress' },
            { label: 'Rewards', icon: Trophy, color: '#FFD93D', href: '/achievements' },
          ].map((action) => (
            <Link key={action.label} href={action.href}>
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex flex-col items-center gap-2 p-4 rounded-sf-xl border text-center transition-shadow hover:shadow-sf-md"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#EEF2FA' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${action.color}15` }}
                >
                  <action.icon className="w-6 h-6" style={{ color: action.color }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: '#1A1D2B' }}>{action.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* ═══ Continue Playing & Daily Challenge ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Playing */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
              <ShinyText text="Continue Playing" speed={5} />
            </h2>
            <Link href="/arcade" className="text-xs font-semibold flex items-center gap-1 transition-colors hover:underline" style={{ color: '#4F6EF7' }}>
              See All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(recentGames.length > 0 ? recentGames : featuredGames.slice(0, 3)).map((game, i) => (
              <motion.div
                key={game.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <Link href={`/arcade/${game.slug}`}>
                  <SFCard variant="interactive" padding="sm" className="h-full">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3"
                      style={{ backgroundColor: `${LAB_COLORS[game.lab]}20` }}
                    >
                      {game.icon}
                    </div>
                    <h3 className="text-sm font-bold mb-1" style={{ color: '#1A1D2B' }}>{game.name}</h3>
                    <p className="text-xs line-clamp-2 mb-2" style={{ color: '#8C94AC' }}>{game.description}</p>
                    <SFBadge variant="primary" size="sm">{game.labName}</SFBadge>
                  </SFCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Daily Challenge */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
            <Star className="w-5 h-5 inline mr-1" style={{ color: '#FFD93D', fill: '#FFD93D' }} />
            Daily Challenge
          </h2>

          <Link href={`/arcade/${dailyChallenge.slug}`}>
            <SFCard
              variant="elevated"
              padding="lg"
              className="relative overflow-hidden h-full transition-all hover:shadow-sf-lg hover:-translate-y-1"
            >
              {/* Gradient accent */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ background: `linear-gradient(90deg, ${LAB_COLORS[dailyChallenge.lab]}, #4F6EF7)` }}
              />

              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-4"
                style={{
                  background: `linear-gradient(135deg, ${LAB_COLORS[dailyChallenge.lab]}30, ${LAB_COLORS[dailyChallenge.lab]}10)`,
                  boxShadow: `0 4px 12px ${LAB_COLORS[dailyChallenge.lab]}25`,
                }}
              >
                {dailyChallenge.icon}
              </div>

              <h3 className="text-base font-bold mb-2" style={{ color: '#1A1D2B' }}>
                {dailyChallenge.name}
              </h3>
              <p className="text-xs mb-4" style={{ color: '#8C94AC' }}>
                {dailyChallenge.description}
              </p>

              <div className="flex items-center justify-between">
                <SFBadge variant="secondary" size="sm">{dailyChallenge.labName}</SFBadge>
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#4F6EF7' }}>
                  <Target className="w-3 h-3" /> Play Now
                </span>
              </div>
            </SFCard>
          </Link>
        </motion.section>
      </div>

      {/* ═══ Overall Progress ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
            <TrendingUp className="w-5 h-5 inline mr-1" style={{ color: '#2ECC71' }} />
            Your Progress
          </h2>
          <Link href="/progress" className="text-xs font-semibold flex items-center gap-1" style={{ color: '#4F6EF7' }}>
            Details <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Overall */}
          <SFCard variant="default" className="flex items-center gap-4">
            <SFCircularProgress value={overallProgress} size={64} strokeWidth={6} color="#4F6EF7">
              <span className="text-sm font-bold" style={{ color: '#4F6EF7' }}>{overallProgress}%</span>
            </SFCircularProgress>
            <div>
              <p className="text-sm font-bold" style={{ color: '#1A1D2B' }}>Overall</p>
              <p className="text-xs" style={{ color: '#8C94AC' }}>Across all labs</p>
            </div>
          </SFCard>

          {/* Games Played */}
          <SFCard variant="default" className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(233,69,245,0.1)' }}
            >
              <Gamepad2 className="w-7 h-7" style={{ color: '#E945F5' }} />
            </div>
            <div>
              <p className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
                {recentGames.length}
              </p>
              <p className="text-xs" style={{ color: '#8C94AC' }}>Games played</p>
            </div>
          </SFCard>

          {/* Time spent */}
          <SFCard variant="default" className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(46,204,113,0.1)' }}
            >
              <Clock className="w-7 h-7" style={{ color: '#2ECC71' }} />
            </div>
            <div>
              <p className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
                {Math.round((child.xp ?? 0) / 10)}m
              </p>
              <p className="text-xs" style={{ color: '#8C94AC' }}>Time learning</p>
            </div>
          </SFCard>
        </div>
      </motion.section>

      {/* ═══ Featured Games Row ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
            <Sparkles className="w-5 h-5 inline mr-1" style={{ color: '#E945F5' }} />
            Featured Games
          </h2>
          <Link href="/arcade" className="text-xs font-semibold flex items-center gap-1" style={{ color: '#4F6EF7' }}>
            Browse All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {featuredGames.map((game, i) => (
            <motion.div
              key={game.slug}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <Link href={`/arcade/${game.slug}`}>
                <div
                  className="relative rounded-sf-xl p-4 text-center transition-all hover:scale-[1.03] hover:shadow-sf-lg cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${LAB_COLORS[game.lab]}15, ${LAB_COLORS[game.lab]}05)`,
                    border: `1px solid ${LAB_COLORS[game.lab]}20`,
                  }}
                >
                  <div className="text-4xl mb-3">{game.icon}</div>
                  <h3 className="text-sm font-bold" style={{ color: '#1A1D2B' }}>{game.name}</h3>
                  <p className="text-[10px] mt-1" style={{ color: '#8C94AC' }}>{game.labName}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
