// ════════════════════════════════════════════════════════════════
// ACHIEVEMENTS — Rewards & Badges Page (Phase 3)
// ════════════════════════════════════════════════════════════════
// Gamified achievement showcase with React Bits StarBorder,
// ShinyText, and animated progress tracking.

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
import ShinyText from '@/components/bits/ShinyText';
import GradientText from '@/components/bits/GradientText';

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
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-1" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
          <GradientText from="#FFD93D" to="#FF6B35">
            <Star className="w-7 h-7 inline mr-2" style={{ color: '#FFD93D', fill: '#FFD93D' }} />
            Rewards
          </GradientText>
        </h1>
        <p className="text-sm" style={{ color: '#8C94AC' }}>
          Collect badges by playing games and completing challenges
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
                <ShinyText text={`${earnedCount} / ${totalCount}`} speed={3} />
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
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <SFCard
                variant={badge.earned ? 'elevated' : 'outlined'}
                padding="md"
                className={`text-center transition-all ${badge.earned ? 'hover:shadow-sf-md hover:-translate-y-0.5' : 'opacity-60 grayscale'}`}
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
            </motion.div>
          );
        })}
      </div>

      {filteredBadges.length === 0 && (
        <div className="text-center py-16">
          <Trophy className="w-12 h-12 mx-auto mb-3" style={{ color: '#DAE0F0' }} />
          <p className="text-sm" style={{ color: '#8C94AC' }}>No badges in this category yet. Keep playing!</p>
        </div>
      )}
    </div>
  );
}
