// ════════════════════════════════════════════════════════════════
// PARENT DASHBOARD — Parent Portal (Phase 5 Enhanced)
// ════════════════════════════════════════════════════════════════
// Parent-facing dashboard with deep analytics, screen time
// controls, content filtering, and child monitoring. Integrates
// ScreenTimeCard, ContentFilterCard, and AnalyticsCard components.

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Shield, Users, Clock, Gamepad2, TrendingUp, Settings,
  CreditCard, ChevronRight, Sparkles, Eye, Lock,
} from 'lucide-react';
import { useActiveChild, useChildren } from '@/hooks/useChildren';
import { useAllLabsProgress } from '@/hooks/useProgress';
import { useParentDashboard } from '@/hooks/useParentDashboard';
import { SFCard } from '@/components/ui/SFCard';
import { SFBadge } from '@/components/ui/SFBadge';
import { SFProgressBar } from '@/components/ui/SFProgressBar';
import { SFButton } from '@/components/ui/SFButton';
import SpotlightCard from '@/components/bits/SpotlightCard';
import BlurText from '@/components/bits/BlurText';
import CountUp from '@/components/bits/CountUp';
import { ScreenTimeCard } from '@/components/parent';
import { ContentFilterCard } from '@/components/parent';
import { AnalyticsCard } from '@/components/parent';
import { ParentApprovalsSection } from '@/components/social';
import { AdaptiveCurveCard } from '@/components/adaptive';
import { ContentModerationSection } from '@/components/ugc';
import { AdvancedAnalyticsCard } from '@/components/analytics';

export default function ParentPage() {
  const { data: childrenList } = useChildren();
  const activeChild = useActiveChild();
  const childId = activeChild?.id ?? '';
  const { data: labsProgress } = useAllLabsProgress(childId);

  // Phase 5: useParentDashboard for enhanced data (screen time, etc.)
  const {
    children: dashboardChildren,
    selectedChildId,
    selectChild,
    updateChildTimeLimit,
  } = useParentDashboard();

  const childCount = childrenList?.length ?? 0;
  const overallProgress = useMemo(() => {
    if (!labsProgress || !Array.isArray(labsProgress)) return 0;
    const total = (labsProgress as Array<{ percent?: number }>).reduce((s, l) => s + (l.percent || 0), 0);
    return Math.round(total / Math.max((labsProgress as unknown[]).length, 1));
  }, [labsProgress]);

  // Find selected child from dashboard data for screen time
  const selectedChild = useMemo(() =>
    dashboardChildren.find((c) => c.id === (selectedChildId || activeChild?.id)) ||
    dashboardChildren[0],
    [dashboardChildren, selectedChildId, activeChild]
  );

  const quickLinks = [
    { label: 'Add Child Profile', href: '/parent/add-child', icon: Users, color: '#4F6EF7', desc: 'Create a new learning profile' },
    { label: 'Screen Time', href: '#screen-time', icon: Clock, color: '#FF6B35', desc: 'Set daily time limits' },
    { label: 'Content Filter', href: '#content-filter', icon: Eye, color: '#2ECC71', desc: 'Manage age-appropriate content' },
    { label: 'Subscription', href: '/parent/subscription', icon: CreditCard, color: '#E945F5', desc: 'Manage your plan' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 lg:pb-0">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-1" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
          <Shield className="w-7 h-7 inline mr-2" style={{ color: '#4F6EF7' }} />
          <BlurText text="Parent Dashboard" />
        </h1>
        <p className="text-sm" style={{ color: '#52586E' }}>
          Monitor progress, manage settings, and keep your kids safe
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: childCount === 1 ? 'Child Profile' : 'Child Profiles', value: childCount, icon: Users, color: '#4F6EF7' },
          { label: 'Progress', value: overallProgress, icon: TrendingUp, color: '#2ECC71', suffix: '%' },
          { label: 'Games', value: 42, icon: Gamepad2, color: '#E945F5' },
          { label: 'Streak', value: activeChild?.streak_count ?? 0, icon: Clock, color: '#FF6B35', suffix: ' days' },
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
                <CountUp to={stat.value} suffix={stat.suffix || ''} />
              </p>
              <p className="text-xs" style={{ color: '#8C94AC' }}>{stat.label}</p>
            </SFCard>
          </motion.div>
        ))}
      </div>

      {/* ═══════ PHASE 8: Study Buddy Approvals ═══════ */}
      {childrenList && childrenList.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <ParentApprovalsSection
            children={childrenList.map((c) => ({ id: c.id, display_name: c.display_name }))}
          />
        </motion.section>
      )}

      {/* ═══════ PHASE 10: Quiz Moderation ═══════ */}
      {childrenList && childrenList.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <ContentModerationSection
            children={childrenList.map((c) => ({ id: c.id, display_name: c.display_name }))}
          />
        </motion.section>
      )}

      {/* ═══════ PHASE 10: Advanced Analytics ═══════ */}
      {childId && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
          <AdvancedAnalyticsCard childId={childId} />
        </motion.section>
      )}

      {/* ═══════ PHASE 10: Adaptive Learning Curve ═══════ */}
      {childId && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <AdaptiveCurveCard childId={childId} />
        </motion.section>
      )}

      {/* ═══════ PHASE 5: Deep Analytics ═══════ */}
      {selectedChild && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
            <TrendingUp className="w-5 h-5 inline mr-1" style={{ color: '#4F6EF7' }} />
            Learning Analytics
          </h2>
          <AnalyticsCard
            childName={selectedChild.display_name}
            totalGamesPlayed={selectedChild.games_played}
            totalTimeMinutes={selectedChild.total_time_minutes}
            xpEarned={selectedChild.xp}
            streakDays={selectedChild.streak_count}
            gamesCompleted={selectedChild.lessons_completed}
            recentAchievements={[
              `${selectedChild.streak_count}-Day Streak`,
              `${selectedChild.labs_completed} Labs Completed`,
              `${selectedChild.badges_earned} Badges Earned`,
            ]}
          />
        </motion.section>
      )}

      {/* ═══════ PHASE 5: Screen Time + Content Filter ═══════ */}
      {selectedChild && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.section
            id="screen-time"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ScreenTimeCard
              childId={selectedChild.id}
              childName={selectedChild.display_name}
              timeUsedMinutes={selectedChild.total_time_minutes % (selectedChild.daily_time_limit_minutes || 180)}
              timeLimitMinutes={selectedChild.daily_time_limit_minutes}
              onUpdateLimit={(mins) => updateChildTimeLimit(selectedChild.id, mins)}
            />
          </motion.section>

          <motion.section
            id="content-filter"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <ContentFilterCard
              childName={selectedChild.display_name}
              ageBand={selectedChild.age_band}
            />
          </motion.section>
        </div>
      )}

      {/* Child Profiles */}
      {childrenList && childrenList.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
            <Users className="w-5 h-5 inline mr-1" style={{ color: '#4F6EF7' }} />
            Child Profiles
            {dashboardChildren.length > 1 && (
              <span className="text-xs font-normal ml-2" style={{ color: '#8C94AC' }}>
                (Click to select)
              </span>
            )}
          </h2>

          <div className="space-y-3">
            {childrenList.map((child, i) => (
              <SpotlightCard
                key={child.id}
                spotlightColor={child.id === (selectedChildId || activeChild?.id) ? 'rgba(79,110,247,0.12)' : 'rgba(79,110,247,0.04)'}
              >
                <button
                  className="w-full p-4 flex items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 
                             focus-visible:ring-inset focus-visible:ring-[#4F6EF7]/30 rounded-2xl"
                  onClick={() => child.id !== (selectedChildId || activeChild?.id) && selectChild(child.id)}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #E945F5, #4F6EF7)',
                    }}
                  >
                    {child.display_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold" style={{ color: '#1A1D2B' }}>{child.display_name}</h3>
                      {child.id === (selectedChildId || activeChild?.id) && (
                        <SFBadge variant="primary" size="sm">Active</SFBadge>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: '#8C94AC' }}>
                      Level {child.level} &middot; {child.xp} XP &middot; {child.streak_count}-day streak
                    </p>
                    <div className="mt-2 max-w-xs">
                      <SFProgressBar value={child.xp % (child.level * 100)} max={child.level * 100} variant="primary" />
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 shrink-0" style={{ color: '#8C94AC' }} />
                </button>
              </SpotlightCard>
            ))}
          </div>
        </motion.section>
      )}

      {/* Quick Links */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
          <Settings className="w-5 h-5 inline mr-1" style={{ color: '#8C94AC' }} />
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickLinks.map((link, i) => (
            <motion.div
              key={link.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.05 }}
            >
              <Link href={link.href}>
                <SFCard variant="interactive" padding="md" className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${link.color}15` }}
                  >
                    <link.icon className="w-5 h-5" style={{ color: link.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold" style={{ color: '#1A1D2B' }}>{link.label}</h3>
                    <p className="text-xs" style={{ color: '#8C94AC' }}>{link.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#8C94AC' }} />
                </SFCard>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* COPPA Notice */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
        <div
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{ backgroundColor: 'rgba(46,204,113,0.06)', border: '1px solid rgba(46,204,113,0.15)' }}
        >
          <Lock className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#2ECC71' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#1A1D2B' }}>COPPA Compliant</p>
            <p className="text-xs" style={{ color: '#8C94AC' }}>
              SparkForge is COPPA compliant. We never collect personal information from children under 13 without parental consent.
              <Link href="/coppa-notice" className="ml-1 font-semibold hover:underline" style={{ color: '#2ECC71' }}>Learn more</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
