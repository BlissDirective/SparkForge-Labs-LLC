// ════════════════════════════════════════════════════════════════
// PARENT DASHBOARD — Parent Portal (Phase 3)
// ════════════════════════════════════════════════════════════════
// Parent-facing dashboard for monitoring children's progress,
// managing screen time, and controlling settings.

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
import { SFCard } from '@/components/ui/SFCard';
import { SFBadge } from '@/components/ui/SFBadge';
import { SFProgressBar } from '@/components/ui/SFProgressBar';
import { SFButton } from '@/components/ui/SFButton';
import SpotlightCard from '@/components/bits/SpotlightCard';
import GradientText from '@/components/bits/GradientText';
import CountUp from '@/components/bits/CountUp';

export default function ParentPage() {
  const { data: childrenList } = useChildren();
  const activeChild = useActiveChild();
  const childId = activeChild?.id ?? '';
  const { data: labsProgress } = useAllLabsProgress(childId);

  const childCount = childrenList?.length ?? 0;
  const overallProgress = useMemo(() => {
    if (!labsProgress || !Array.isArray(labsProgress)) return 0;
    const total = (labsProgress as Array<{ percent?: number }>).reduce((s, l) => s + (l.percent || 0), 0);
    return Math.round(total / Math.max((labsProgress as unknown[]).length, 1));
  }, [labsProgress]);

  const quickLinks = [
    { label: 'Add Child Profile', href: '/parent/add-child', icon: Users, color: '#4F6EF7', desc: 'Create a new learning profile' },
    { label: 'Screen Time', href: '/parent', icon: Clock, color: '#FF6B35', desc: 'Set daily time limits' },
    { label: 'Content Filter', href: '/parent', icon: Eye, color: '#2ECC71', desc: 'Manage age-appropriate content' },
    { label: 'Subscription', href: '/parent/subscription', icon: CreditCard, color: '#E945F5', desc: 'Manage your plan' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 lg:pb-0">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-1" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
          <GradientText from="#4F6EF7" to="#2ECC71">
            <Shield className="w-7 h-7 inline mr-2" style={{ color: '#4F6EF7' }} />
            Parent Dashboard
          </GradientText>
        </h1>
        <p className="text-sm" style={{ color: '#8C94AC' }}>
          Monitor progress, manage settings, and keep your kids safe
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Children', value: childCount, icon: Users, color: '#4F6EF7' },
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

      {/* Child Profiles */}
      {childrenList && childrenList.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
            <Users className="w-5 h-5 inline mr-1" style={{ color: '#4F6EF7' }} />
            Child Profiles
          </h2>

          <div className="space-y-3">
            {childrenList.map((child, i) => (
              <SpotlightCard key={child.id} spotlightColor="rgba(79,110,247,0.08)">
                <div className="p-4 flex items-center gap-4">
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
                      {child.id === activeChild?.id && (
                        <SFBadge variant="primary" size="sm">Active</SFBadge>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: '#8C94AC' }}>
                      Level {child.level} &middot; {child.xp} XP &middot; {child.streak_count}-day streak
                    </p>
                    <div className="mt-2 max-w-xs">
                      <SFProgressBar value={child.xp} max={child.level * 100} variant="primary" />
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 shrink-0" style={{ color: '#8C94AC' }} />
                </div>
              </SpotlightCard>
            ))}
          </div>
        </motion.section>
      )}

      {/* Quick Links */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
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
              transition={{ delay: 0.4 + i * 0.05 }}
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <div
          className="rounded-sf-lg p-4 flex items-start gap-3"
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
