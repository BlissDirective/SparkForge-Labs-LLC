'use client';

// ════════════════════════════════════════════════════
// PROFILE PAGE — 3D-Embedded Cockpit Page
// ════════════════════════════════════════════════════
// Stage 4/5: Profile overview with cockpit integration.
// Camera flies to right console zone on mount.
//
// 3D Integration:
//   - setLabColor('#FF66AA') on mount → cockpit tints to profile pink
//   - Badge data rendered as cockpit-themed gallery
//   - XP/Level/Streak displayed with lab-color accents
//
// Full avatar editor + trophy room 3D = Stage 5 scope.

import { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { useChildStore } from '@/stores/childStore';
import { useUIStore } from '@/stores/uiStore';
import { useBadges } from '@/hooks/useGamification';
import { useAllLabsProgress } from '@/hooks/useProgress';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { Zap, Flame, Trophy, Star, Target, Award } from 'lucide-react';

export default function ProfilePage() {
  const { activeChild } = useChildStore();
  const setLabColor = useUIStore((s) => s.setLabColor);
  const childId = activeChild?.id || '';

  const { data: badges } = useBadges(childId);
  const { data: labsProgress } = useAllLabsProgress(childId);

  // Set cockpit to profile pink on mount
  useEffect(() => {
    setLabColor('#FF66AA');
  }, [setLabColor]);

  const earnedBadges = useMemo(() => {
    if (!badges || !Array.isArray(badges)) return [];
    return badges.filter((b: { earned?: boolean }) => b.earned);
  }, [badges]);

  const totalBadges = useMemo(() => {
    if (!badges || !Array.isArray(badges)) return 0;
    return badges.length;
  }, [badges]);

  const overallProgress = useMemo(() => {
    if (!labsProgress || !Array.isArray(labsProgress)) return 0;
    const total = labsProgress.reduce((sum: number, lab: { percent?: number }) =>
      sum + (lab.percent || 0), 0);
    return Math.round(total / 10);
  }, [labsProgress]);

  if (!activeChild) {
    return (
      <div className="text-center py-20" role="status" aria-label="Loading profile">
        <div className="w-8 h-8 border-2 border-spark-pink/30 border-t-spark-pink rounded-full animate-spin mx-auto" />
        <p className="text-white/50 font-body mt-4">Loading profile systems...</p>
      </div>
    );
  }

  // XP progress within current level
  const xpInLevel = activeChild.xp % 500;
  const xpForLevel = 500;
  const xpPercent = Math.round((xpInLevel / xpForLevel) * 100);

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-4 max-w-2xl mx-auto"
      role="main"
      aria-label="Player Profile"
    >
      {/* ═══ Profile Header ═══ */}
      <motion.div
        variants={staggerItem}
        className="rounded-xl p-6 backdrop-blur-md border border-spark-pink/20 bg-spark-pink/5 text-center"
      >
        {/* Avatar placeholder (Stage 5: PetCreature3D) */}
        <div
          className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl border-2"
          style={{
            background: 'linear-gradient(135deg, #FF66AA20, #AA66FF20)',
            borderColor: '#FF66AA40',
            boxShadow: '0 0 30px #FF66AA20',
          }}
          aria-label="Player avatar"
        >
          {activeChild.display_name?.charAt(0)?.toUpperCase() || '⚡'}
        </div>
        <h1 className="font-display text-xl font-bold text-white">
          {activeChild.display_name}
        </h1>
        <p className="font-mono text-xs text-spark-pink/60 tracking-wider mt-1">
          LEVEL {activeChild.level} · {activeChild.level_title?.toUpperCase()}
        </p>

        {/* XP Progress bar */}
        <div className="mt-4 max-w-xs mx-auto">
          <div className="flex items-center justify-between text-[10px] font-data text-white/30 mb-1">
            <span>{xpInLevel} XP</span>
            <span>{xpForLevel} XP to next level</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-spark-pink to-spark-purple"
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>

      {/* ═══ Stats Grid ═══ */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-3 gap-3"
        role="group"
        aria-label="Player stats"
      >
        {[
          { label: 'Total XP', value: activeChild.xp.toLocaleString(), icon: Zap, color: '#00BBFF' },
          { label: 'Streak', value: `${activeChild.streak_count}d`, icon: Flame, color: '#FF6644' },
          { label: 'Progress', value: `${overallProgress}%`, icon: Target, color: '#00FF88' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-3 text-center backdrop-blur-md border border-white/[0.06] bg-surface-card/50"
            style={{ boxShadow: `0 0 15px ${stat.color}10` }}
            role="status"
            aria-label={`${stat.label}: ${stat.value}`}
          >
            <stat.icon className="w-4 h-4 mx-auto mb-1" style={{ color: stat.color }} />
            <p className="font-data text-lg font-bold text-white">{stat.value}</p>
            <p className="font-mono text-[9px] text-white/25 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* ═══ Badge Gallery ═══ */}
      <motion.div variants={staggerItem} className="rounded-xl p-5 backdrop-blur-md border border-white/[0.06] bg-surface-card/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-spark-orange" />
            <h2 className="font-display font-bold text-white text-sm">Badges</h2>
          </div>
          <span className="font-data text-xs text-white/30">
            {earnedBadges.length} / {totalBadges}
          </span>
        </div>

        {earnedBadges.length > 0 ? (
          <div className="grid grid-cols-4 gap-2" role="list" aria-label="Earned badges">
            {earnedBadges.slice(0, 12).map((badge: { id: string; name: string; icon: string; category: string }) => (
              <div
                key={badge.id}
                className="rounded-lg p-2 text-center border border-spark-orange/20 bg-spark-orange/5"
                role="listitem"
                aria-label={`Badge: ${badge.name}`}
              >
                <div className="text-xl mb-1">{badge.icon || '🏅'}</div>
                <p className="font-mono text-[8px] text-white/40 truncate">{badge.name}</p>
              </div>
            ))}
            {earnedBadges.length > 12 && (
              <div className="rounded-lg p-2 text-center border border-white/[0.06] bg-white/5 flex items-center justify-center">
                <span className="font-data text-xs text-white/30">+{earnedBadges.length - 12}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="font-body text-sm text-white/30 text-center py-4">
            Complete games and challenges to earn badges!
          </p>
        )}
      </motion.div>

      {/* ═══ Account Info ═══ */}
      <motion.div variants={staggerItem} className="rounded-xl p-5 backdrop-blur-md border border-white/[0.06] bg-surface-card/50">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-neon-blue" />
          <h2 className="font-display font-bold text-white text-sm">Account</h2>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-body text-white/40">Display Name</span>
            <span className="font-display font-bold text-white">{activeChild.display_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-body text-white/40">Age Band</span>
            <span className="font-data text-white/60">
              {activeChild.age_band === 'A' ? '7-10' : activeChild.age_band === 'B' ? '11-13' : '14-16'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-body text-white/40">Spark Coins</span>
            <span className="font-data text-spark-orange">{activeChild.spark_coins?.toLocaleString() || 0} 🪙</span>
          </div>
        </div>
      </motion.div>

      {/* ARIA live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Profile: {activeChild.display_name}. Level {activeChild.level}.
        {earnedBadges.length} badges earned out of {totalBadges}.
      </div>
    </motion.div>
  );
}
