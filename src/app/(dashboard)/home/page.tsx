// ════════════════════════════════════════════════════════════════
// DASHBOARD HOME — SparkForge Phase 3 Redesign
// ════════════════════════════════════════════════════════════════
// Complete home page overhaul integrating Phase 2 retention mechanics:
// StreakCounter, CurrencyDisplay, LeaderboardPanel, plus new
// DailyMissionCard with SparkyPresenter, ActivityFeed, QuickStatsBar.
// Dark theme, kid-friendly, fully animated with Framer Motion.

'use client';

import { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Sparkles,
  Gamepad2,
  Zap,
  ChevronRight,
  TrendingUp,
  Clock,
  Target,
  Star,
} from 'lucide-react';
import { useActiveChild } from '@/hooks/useChildren';
import { useAllLabsProgress } from '@/hooks/useProgress';
import { useBadges } from '@/hooks/useGamification';
import { useStreak } from '@/hooks/useStreak';
import { useCurrency } from '@/hooks/useCurrency';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { GAME_REGISTRY } from '@/config/gameRegistry';
import { LAB_COLORS } from '@/config/labs';
import { SFCard } from '@/components/ui/SFCard';
import { SFBadge } from '@/components/ui/SFBadge';
import { SFCircularProgress } from '@/components/ui/SFCircularProgress';
import { DailyMissionCard } from '@/components/mission/DailyMissionCard';
import { QuickStatsBar } from '@/components/home/QuickStatsBar';
import { ActivityFeed } from '@/components/home/ActivityFeed';
import { LeaderboardPanel } from '@/components/leaderboard/LeaderboardPanel';
import SpotlightCard from '@/components/bits/SpotlightCard';
import ShinyText from '@/components/bits/ShinyText';
import GradientText from '@/components/bits/GradientText';
import { getTodaysChallenge } from '@/lib/dailyChallenge';
import type { ActivityItem } from '@/components/home/ActivityFeed';

export default function HomePage() {
  const child = useActiveChild();
  const childId = child?.id ?? '';
  const childName = child?.display_name ?? 'Explorer';

  // ─── Data Hooks (Phase 2 integration) ───
  const { data: labsProgress, isLoading: progressLoading } = useAllLabsProgress(childId);
  const { data: badgesData } = useBadges(childId);

  const {
    streakCount,
    longestStreak,
    freezesEquipped,
    recordActivity,
  } = useStreak(childId);

  const {
    gems,
    canClaimDaily,
    dailyStreak,
    claimDaily,
  } = useCurrency(childId);

  const {
    entries: leaderboardEntries,
    userRank,
    currentTier: leagueTier,
    timeUntilReset,
    isInPromotionZone,
    isInDemotionZone,
    refresh: refreshLeaderboard,
  } = useLeaderboard(childId);

  // ─── Computed State ───
  const earnedBadges = useMemo(() => {
    if (!badgesData?.badges) return 0;
    return badgesData.badges.filter((b: { earned: boolean }) => b.earned).length;
  }, [badgesData]);

  const totalBadges = badgesData?.badges?.length ?? 0;

  const overallProgress = useMemo(() => {
    if (!labsProgress || !Array.isArray(labsProgress)) return 0;
    const total = (labsProgress as Array<{ percent?: number }>).reduce(
      (sum, lab) => sum + (lab.percent || 0), 0
    );
    return Math.min(100, Math.round(total / Math.max(labsProgress.length, 1)));
  }, [labsProgress]);

  const featuredGames = useMemo(() =>
    GAME_REGISTRY.filter((g) => g.tier === 'flagship').slice(0, 4),
    []
  );

  const recentGames = useMemo(() => {
    if (!labsProgress) return [];
    const playedSlugs = new Set<string>();
    (labsProgress as Array<{ game_slug?: string }>).forEach((p) => {
      if (p.game_slug) playedSlugs.add(p.game_slug);
    });
    return GAME_REGISTRY.filter((g) => playedSlugs.has(g.slug)).slice(0, 3);
  }, [labsProgress]);

  // ─── Mock Activity Feed (real data would come from API) ───
  const activities: ActivityItem[] = useMemo(() => {
    const now = new Date();
    const items: ActivityItem[] = [];

    if (streakCount > 0) {
      items.push({
        id: 'act-streak',
        type: 'streak',
        title: `${streakCount}-day streak`,
        description: 'Keep it going!',
        timestamp: new Date(now.getTime() - 3600000).toISOString(),
      });
    }

    if (recentGames.length > 0) {
      recentGames.forEach((g, i) => {
        items.push({
          id: `act-game-${i}`,
          type: 'game',
          title: g.name,
          xp: 25 + i * 5,
          timestamp: new Date(now.getTime() - (i + 1) * 7200000).toISOString(),
          icon: g.icon,
        });
      });
    }

    if (earnedBadges > 0) {
      const recentBadge = badgesData?.badges?.find?.((b: { earned: boolean }) => b.earned);
      if (recentBadge) {
        items.push({
          id: 'act-badge',
          type: 'badge',
          title: recentBadge.name,
          timestamp: new Date(now.getTime() - 86400000).toISOString(),
          icon: recentBadge.icon,
        });
      }
    }

    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [streakCount, recentGames, earnedBadges, badgesData]);

  // ─── Handlers ───
  const handleStartMission = useCallback((challenge: { targetSlug?: string }) => {
    if (challenge.targetSlug) {
      window.location.href = `/arcade/${challenge.targetSlug}`;
    } else {
      window.location.href = '/arcade';
    }
  }, []);

  // ─── No Child State ───
  if (!child) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-6xl mb-4"
        >
          &#127918;
        </motion.div>
        <h2 className="text-2xl font-bold mb-2 text-white" style={{ fontFamily: 'var(--font-display)' }}>
          Welcome to SparkForge!
        </h2>
        <p className="text-base mb-6 text-slate-400">
          Create a profile to start your AI learning journey.
        </p>
        <Link
          href="/parent/add-child"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #4F6EF7, #E945F5)' }}
        >
          <Sparkles className="w-5 h-5" />
          Create Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-20 lg:pb-6">
      {/* ═══ Welcome Header ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            <span className="text-white">Hey </span>
            <GradientText from="#E945F5" to="#4F6EF7">{childName}</GradientText>
            <span className="text-white">! </span>
            <span className="inline-block animate-bounce">&#128075;</span>
          </h1>
        </div>
        <p className="text-sm text-slate-400">
          Ready to continue your AI learning adventure today?
        </p>
      </motion.section>

      {/* ═══ Quick Stats Bar (Phase 2 Integration) ═══ */}
      <QuickStatsBar
        stats={{
          streakCount,
          longestStreak,
          freezesEquipped,
          gems,
          canClaimDaily,
          dailyStreak,
          earnedBadges,
          totalBadges,
          leagueTier: leagueTier || 'bronze',
          leagueRank: userRank,
          xp: child.xp ?? 0,
          level: child.level ?? 1,
        }}
        childName={childName}
        onClaimDaily={claimDaily}
        onOpenStreakDetails={() => {}}
      />

      {/* ═══ Daily Mission (Phase 3 Centerpiece) ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <DailyMissionCard
          childName={childName}
          childId={childId}
          onStartMission={handleStartMission}
        />
      </motion.section>

      {/* ═══ Main Content Grid ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Continue Playing + Progress */}
        <div className="lg:col-span-2 space-y-5">
          {/* Continue Playing */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <ShinyText text="Continue Playing" speed={5} />
              </h2>
              <Link href="/arcade" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                See All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(recentGames.length > 0 ? recentGames : featuredGames.slice(0, 3)).map((game, i) => (
                <motion.div
                  key={game.slug}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                >
                  <Link href={`/arcade/${game.slug}`}>
                    <SFCard variant="interactive" padding="sm" className="h-full group">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${LAB_COLORS[game.lab]}20` }}
                      >
                        {game.icon}
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{game.name}</h3>
                      <p className="text-xs line-clamp-2 mb-2 text-slate-400">{game.description}</p>
                      <SFBadge variant="primary" size="sm">{game.labName}</SFBadge>
                    </SFCard>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Overall Progress */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Your Progress
              </h2>
              <Link href="/progress" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                Details <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Overall */}
              <SFCard variant="default" className="flex items-center gap-4">
                <SFCircularProgress value={overallProgress} size={56} strokeWidth={5} color="#4F6EF7">
                  <span className="text-xs font-bold text-indigo-400">{overallProgress}%</span>
                </SFCircularProgress>
                <div>
                  <p className="text-sm font-bold text-white">Overall</p>
                  <p className="text-xs text-slate-400">Across all labs</p>
                </div>
              </SFCard>

              {/* Games */}
              <SFCard variant="default" className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-fuchsia-500/10 flex items-center justify-center shrink-0">
                  <Gamepad2 className="w-6 h-6 text-fuchsia-400" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    {recentGames.length}
                  </p>
                  <p className="text-xs text-slate-400">Games played</p>
                </div>
              </SFCard>

              {/* Time */}
              <SFCard variant="default" className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    {Math.round((child.xp ?? 0) / 10)}m
                  </p>
                  <p className="text-xs text-slate-400">Time learning</p>
                </div>
              </SFCard>
            </div>
          </motion.section>

          {/* Featured Games Row */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <Sparkles className="w-4 h-4 text-fuchsia-400" />
                Featured Games
              </h2>
              <Link href="/arcade" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                Browse All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <SpotlightCard spotlightColor="rgba(233, 69, 245, 0.08)" className="rounded-2xl">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-1">
                {featuredGames.map((game, i) => (
                  <motion.div
                    key={game.slug}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                  >
                    <Link href={`/arcade/${game.slug}`}>
                      <motion.div
                        whileHover={{ scale: 1.04, y: -3 }}
                        whileTap={{ scale: 0.97 }}
                        className="relative rounded-xl p-4 text-center cursor-pointer overflow-hidden group"
                        style={{
                          background: `linear-gradient(135deg, ${LAB_COLORS[game.lab]}12, ${LAB_COLORS[game.lab]}04)`,
                          border: `1px solid ${LAB_COLORS[game.lab]}18`,
                        }}
                      >
                        {/* Hover glow */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ background: `radial-gradient(circle at center, ${LAB_COLORS[game.lab]}15, transparent)` }}
                        />
                        <div className="relative text-4xl mb-3">{game.icon}</div>
                        <h3 className="relative text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{game.name}</h3>
                        <p className="relative text-[10px] mt-1 text-slate-500">{game.labName}</p>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </SpotlightCard>
          </motion.section>
        </div>

        {/* Right Column: Leaderboard + Activity */}
        <div className="space-y-5">
          {/* Leaderboard (Phase 2 Integration) */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <LeaderboardPanel
              entries={leaderboardEntries}
              userRank={userRank}
              currentTier={leagueTier}
              timeUntilReset={timeUntilReset}
              isInPromotionZone={isInPromotionZone}
              isInDemotionZone={isInDemotionZone}
              onViewFull={() => {}}
            />
          </motion.section>

          {/* Activity Feed */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <ActivityFeed activities={activities} />
          </motion.section>

          {/* Daily Challenge Quick Card */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <DailyChallengeQuickCard childId={childId} />
          </motion.section>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// DAILY CHALLENGE QUICK CARD — Compact side-panel version
// ════════════════════════════════════════════════════════════════

function DailyChallengeQuickCard({ childId }: { childId: string }) {
  const [challenge] = useState(() => getTodaysChallenge());

  return (
    <div
      className="rounded-2xl p-4 overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))',
        border: '1px solid rgba(245,158,11,0.15)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-amber-400" fill="#F59E0B" />
        <h3 className="text-sm font-semibold text-white">Daily Challenge</h3>
      </div>

      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0">{challenge.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white mb-0.5">{challenge.title}</p>
          <p className="text-xs text-slate-400 mb-2">{challenge.description}</p>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-semibold">
              <Zap className="w-3 h-3" /> +{challenge.xpReward} XP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
