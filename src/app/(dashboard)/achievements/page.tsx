// ════════════════════════════════════════════════════════════════
// ACHIEVEMENTS — Rewards & Badges Page (Phase 3)
// ════════════════════════════════════════════════════════════════
// Gamified achievement showcase. R5: DESIGN.md §6 celebration
// hierarchy — CountUp for numbers, GlareHover sweep on EARNED badges
// only; locked badges stay flat/desaturated. BlurText h1 (GradientText
// and ShinyText retired per §7.1). StarBorder kept (badges/streaks).

'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Star, Lock, Zap, Crown, Shield, Sparkles, TrendingUp, Gamepad2 } from 'lucide-react';
import { useActiveChild } from '@/hooks/useChildren';
import { useBadges } from '@/hooks/useGamification';
import { SFCard } from '@/components/ui/SFCard';
import { SFBadge } from '@/components/ui/SFBadge';
import { SFCircularProgress } from '@/components/ui/SFCircularProgress';
import StarBorder from '@/components/bits/StarBorder';
import BlurText from '@/components/bits/BlurText';
import CountUp from '@/components/bits/CountUp';
import GlareHover from '@/components/bits/GlareHover';
import { SparkyCore } from '@/components/sparky';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Trophy },
  { id: 'games', label: 'Games', icon: Gamepad2 },
  { id: 'streaks', label: 'Streaks', icon: Zap },
  { id: 'learning', label: 'Learning', icon: TrendingUp },
  { id: 'special', label: 'Special', icon: Crown },
];

export default function AchievementsPage() {
  const child = useActiveChild();
  const childId = child?.id ?? '';
  const { data: badgesData } = useBadges(childId);
  const [activeCategory, setActiveCategory] = useState('all');

  const badges = useMemo(() => badgesData?.badges ?? [], [badgesData]);

  const filteredBadges = useMemo(() => {
    if (activeCategory === 'all') return badges;
    return badges.filter((b: { category?: string }) => b.category === activeCategory);
  }, [badges, activeCategory]);

  const earnedCount = useMemo(() => badges.filter((b: { earned: boolean }) => b.earned).length, [badges]);
  const totalCount = badges.length;
  const completionPct = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  // Rarity colors
  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary': return { bg: '#FFD93D', text: '#B8860B', glow: '0 4px 16px rgba(255,217,61,0.3)' };
      case 'epic': return { bg: '#E945F5', text: '#FFFFFF', glow: '0 4px 16px rgba(233,69,245,0.25)' };
      case 'rare': return { bg: '#4F6EF7', text: '#FFFFFF', glow: '0 4px 16px rgba(79,110,247,0.25)' };
      default: return { bg: '#EEF2FA', text: '#52586E', glow: 'none' };
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 lg:pb-0">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Star className="w-7 h-7" style={{ color: '#FFD93D', fill: '#FFD93D' }} aria-hidden="true" />
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
            <BlurText text="Rewards" />
          </h1>
        </div>
        <p className="text-sm" style={{ color: '#52586E' }}>
          Every badge tells a story you earned.
        </p>
      </motion.div>

      {/* Progress Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <StarBorder color="#FFD93D" speed={6}>
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4">
            <SFCircularProgress value={completionPct} size={72} strokeWidth={7} color="#FFD93D">
              <Trophy className="w-6 h-6" style={{ color: '#FFD93D' }} />
            </SFCircularProgress>
            <div className="text-center sm:text-left">
              <p className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
                <CountUp to={earnedCount} /> / {totalCount}
              </p>
              <p className="text-sm" style={{ color: '#8C94AC' }}>
                badges earned &middot; {completionPct}% completion
              </p>
            </div>
            <div className="flex gap-3 ml-auto">
              {[
                { icon: Crown, color: '#FFD93D', label: 'Legendary' },
                { icon: Sparkles, color: '#E945F5', label: 'Epic' },
                { icon: Star, color: '#4F6EF7', label: 'Rare' },
                { icon: Shield, color: '#8C94AC', label: 'Common' },
              ].map((r) => (
                <div key={r.label} className="text-center">
                  <r.icon className="w-5 h-5 mx-auto mb-0.5" style={{ color: r.color }} />
                  <span className="text-[10px]" style={{ color: '#8C94AC' }}>
                    {badges.filter((b: { rarity?: string; earned: boolean }) => b.rarity?.toLowerCase() === r.label.toLowerCase() && b.earned).length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </StarBorder>
      </motion.div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            aria-pressed={activeCategory === cat.id}
            aria-label={`Show ${cat.label} badges`}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-sf-full text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${activeCategory === cat.id ? 'text-white' : ''}`}
            style={{
              backgroundColor: activeCategory === cat.id ? '#4F6EF7' : 'transparent',
              color: activeCategory === cat.id ? '#FFFFFF' : '#52586E',
              border: activeCategory === cat.id ? 'none' : '1px solid #DAE0F0',
            }}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredBadges.map((badge: { id: string; name: string; description: string; icon: string; rarity: string; earned: boolean; category: string }, i: number) => {
          const rarity = getRarityColor(badge.rarity);
          // DESIGN §6 celebration hierarchy: the chrome glare sweep is
          // an EARNED celebration — locked badges stay flat/desaturated.
          const card = (
              <SFCard
                variant={badge.earned ? 'elevated' : 'outlined'}
                padding="md"
                className={`text-center h-full transition-all ${badge.earned ? 'hover:-translate-y-0.5' : 'opacity-60 grayscale'}`}
              >
                {/* Badge Icon */}
                <motion.div
                  whileHover={badge.earned ? { rotate: [0, -10, 10, 0], scale: 1.1 } : {}}
                  transition={{ duration: 0.4 }}
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3"
                  style={{
                    background: badge.earned
                      ? `linear-gradient(135deg, ${rarity.bg}30, ${rarity.bg}10)`
                      : '#EEF2FA',
                    boxShadow: badge.earned ? rarity.glow : 'none',
                  }}
                >
                  {badge.earned ? (
                    <span>{badge.icon}</span>
                  ) : (
                    <Lock className="w-6 h-6" style={{ color: '#8C94AC' }} />
                  )}
                </motion.div>

                <h3 className="text-sm font-bold mb-1" style={{ color: badge.earned ? '#1A1D2B' : '#8C94AC' }}>
                  {badge.name}
                </h3>
                <p className="text-[11px] line-clamp-2 mb-2" style={{ color: '#8C94AC' }}>
                  {badge.description}
                </p>

                <SFBadge
                  variant={badge.earned ? 'primary' : 'default'}
                  size="sm"
                >
                  {badge.rarity}
                </SFBadge>

                {!badge.earned && (
                  <div className="mt-2 text-[10px] font-medium" style={{ color: '#8C94AC' }}>
                    Locked
                  </div>
                )}
              </SFCard>
          );
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 20 }}
            >
              {badge.earned ? (
                <GlareHover glowColor={rarity.bg} radius={16} className="h-full">
                  {card}
                </GlareHover>
              ) : (
                card
              )}
            </motion.div>
          );
        })}
      </div>

      {filteredBadges.length === 0 && (
        <div className="text-center py-16">
          <div className="flex justify-center mb-3" aria-hidden="true">
            <SparkyCore expression="thinking" pixelSize={72} showAura={false} />
          </div>
          <p className="text-sm" style={{ color: '#52586E' }}>No badges in this category yet. Keep playing!</p>
        </div>
      )}
    </div>
  );
}
