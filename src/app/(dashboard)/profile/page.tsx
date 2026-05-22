// ════════════════════════════════════════════════════════════════
// PROFILE — User Profile Page (Phase 3)
// ════════════════════════════════════════════════════════════════
// Child profile display with stats, achievements summary, and
// React Bits-enhanced visuals (GradientText, SpotlightCard).

'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  User, Zap, Trophy, Flame, TrendingUp, Star,
  Gamepad2, Clock, Award, Sparkles,
} from 'lucide-react';
import { useActiveChild } from '@/hooks/useChildren';
import { useAllLabsProgress } from '@/hooks/useProgress';
import { useBadges } from '@/hooks/useGamification';
import { SFCard } from '@/components/ui/SFCard';
import { SFBadge } from '@/components/ui/SFBadge';
import { SFProgressBar } from '@/components/ui/SFProgressBar';
import { SFCircularProgress } from '@/components/ui/SFCircularProgress';
import SpotlightCard from '@/components/bits/SpotlightCard';
import GradientText from '@/components/bits/GradientText';
import ShinyText from '@/components/bits/ShinyText';
import StarBorder from '@/components/bits/StarBorder';
import CountUp from '@/components/bits/CountUp';

export default function ProfilePage() {
  const child = useActiveChild();
  const childId = child?.id ?? '';
  const { data: labsProgress } = useAllLabsProgress(childId);
  const { data: badgesData } = useBadges(childId);

  const overallProgress = useMemo(() => {
    if (!labsProgress || !Array.isArray(labsProgress)) return 0;
    const total = (labsProgress as Array<{ percent?: number }>).reduce((s, l) => s + (l.percent || 0), 0);
    return Math.round(total / Math.max((labsProgress as unknown[]).length, 1));
  }, [labsProgress]);

  const earnedBadges = useMemo(() =>
    (badgesData?.badges ?? []).filter((b: { earned: boolean }) => b.earned).length,
    [badgesData]
  );

  const totalBadges = badgesData?.badges?.length ?? 0;

  if (!child) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <User className="w-16 h-16 mb-4" style={{ color: '#DAE0F0' }} />
        <h2 className="text-xl font-bold mb-2" style={{ color: '#1A1D2B' }}>No Profile Found</h2>
        <p className="text-sm" style={{ color: '#8C94AC' }}>Create a profile to get started</p>
      </div>
    );
  }

  const xpToNext = (child.level ?? 1) * 100 - (child.xp ?? 0);
  const xpProgress = ((child.xp ?? 0) / ((child.level ?? 1) * 100)) * 100;

  const statCards = [
    { label: 'XP', value: child.xp ?? 0, icon: Zap, color: '#4F6EF7' },
    { label: 'Level', value: child.level ?? 1, icon: Trophy, color: '#FFD93D' },
    { label: 'Streak', value: child.streak_count ?? 0, icon: Flame, color: '#FF6B35', suffix: 'd' },
    { label: 'Badges', value: earnedBadges, icon: Award, color: '#E945F5', suffix: `/${totalBadges}` },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 lg:pb-0">
      {/* Profile Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <SpotlightCard spotlightColor="rgba(233,69,245,0.1)" className="overflow-hidden">
          {/* Background gradient */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, #E945F5, #4F6EF7, #2ECC71)' }}
          />

          <div className="relative p-6 sm:p-8 text-center">
            {/* Avatar */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center text-4xl font-extrabold text-white mx-auto mb-4"
              style={{
                background: 'linear-gradient(135deg, #E945F5, #4F6EF7)',
                boxShadow: '0 8px 32px rgba(79,110,247,0.3)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {child.display_name?.charAt(0)?.toUpperCase()}
            </motion.div>

            <h1 className="text-2xl sm:text-3xl font-extrabold mb-1" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
              <GradientText from="#E945F5" to="#4F6EF7">
                {child.display_name}
              </GradientText>
            </h1>

            <p className="text-sm mb-4" style={{ color: '#8C94AC' }}>
              Level {child.level} Explorer &middot; {child.age_band ?? 'All Ages'}
            </p>

            {/* Level Progress */}
            <div className="max-w-sm mx-auto">
              <div className="flex items-center justify-between text-xs mb-1">
                <span style={{ color: '#8C94AC' }}>Level {child.level}</span>
                <span style={{ color: '#4F6EF7', fontWeight: 600 }}>{xpToNext} XP to Level {child.level + 1}</span>
              </div>
              <SFProgressBar value={child.xp ?? 0} max={(child.level ?? 1) * 100} variant="primary" />
            </div>
          </div>
        </SpotlightCard>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <StarBorder color={stat.color} speed={8}>
              <div className="p-4 text-center">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <p className="text-xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
                  <CountUp to={stat.value} suffix={stat.suffix || ''} />
                </p>
                <p className="text-xs" style={{ color: '#8C94AC' }}>{stat.label}</p>
              </div>
            </StarBorder>
          </motion.div>
        ))}
      </div>

      {/* Overall Progress */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <SFCard variant="elevated" className="p-5">
          <div className="flex items-center gap-5">
            <SFCircularProgress value={overallProgress} size={72} strokeWidth={7} color="#4F6EF7">
              <span className="text-sm font-extrabold" style={{ color: '#4F6EF7' }}>{overallProgress}%</span>
            </SFCircularProgress>
            <div className="flex-1">
              <h3 className="text-base font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
                Overall Learning Progress
              </h3>
              <p className="text-xs" style={{ color: '#8C94AC' }}>
                You&apos;ve completed {overallProgress}% of all learning labs. Keep it up!
              </p>
              <SFProgressBar value={overallProgress} max={100} variant="primary" className="mt-3" />
            </div>
          </div>
        </SFCard>
      </motion.div>

      {/* Recent Badges Preview */}
      {badgesData?.badges && badgesData.badges.filter((b: { earned: boolean }) => b.earned).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
            <Award className="w-5 h-5 inline mr-1" style={{ color: '#FFD93D' }} />
            <ShinyText text="Recent Badges" speed={4} />
          </h2>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {(badgesData.badges as Array<{ id: string; name: string; icon: string; earned: boolean }>)
              .filter((b) => b.earned)
              .slice(0, 6)
              .map((badge) => (
                <div
                  key={badge.id}
                  className="shrink-0 w-20 text-center"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mx-auto mb-1"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,217,61,0.2), rgba(255,217,61,0.05))',
                    }}
                  >
                    {badge.icon}
                  </div>
                  <p className="text-[10px] font-medium truncate" style={{ color: '#52586E' }}>{badge.name}</p>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Fun Fact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center py-6"
      >
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sf-full text-sm"
          style={{ backgroundColor: 'rgba(79,110,247,0.08)', color: '#4F6EF7' }}
        >
          <Sparkles className="w-4 h-4" />
          <span>Keep learning to unlock more badges and level up!</span>
        </div>
      </motion.div>
    </div>
  );
}
