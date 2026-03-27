'use client';

// ════════════════════════════════════════════════════
// PROFILE PAGE — 3D-Embedded Cockpit Page (Enhanced)
// ════════════════════════════════════════════════════
// Stage 5: Full profile with avatar editor, trophy room,
// accurate XP progression, streak flames, daily challenge.
//
// 3D Integration:
//   - setLabColor('#FF66AA') on mount → cockpit tints to profile pink
//   - Badge data rendered as cockpit-themed gallery
//   - XP/Level/Streak displayed with lab-color accents
//
// Audit fixes: S5-CRIT-001 (profile stub → full page)

import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useChildStore } from '@/stores/childStore';
import { useUIStore } from '@/stores/uiStore';
import { useA11yStore } from '@/stores/accessibilityStore';
import { useBadges } from '@/hooks/useGamification';
import { useAllLabsProgress } from '@/hooks/useProgress';
import {
  calculateLevel, getFlameConfig, getLevelColor,
  getStreakEmoji, getStreakMessage, getRarityColor,
} from '@/lib/gamification';
import { getTodaysChallenge, isChallengeComplete, formatTimeRemaining, getSecondsUntilReset } from '@/lib/dailyChallenge';
import { staggerContainer, staggerItem } from '@/lib/animations';
import type { BadgeCategory } from '@/types';
import {
  Zap, Flame, Trophy, Star, Target, Shield,
  Edit3, Check, X, Coins, Sparkles, Clock, Lock,
} from 'lucide-react';

// ═══ BADGE CATEGORIES ═══
const BADGE_CATEGORIES: { key: BadgeCategory; label: string; icon: string }[] = [
  { key: 'progress', label: 'Progress', icon: '📈' },
  { key: 'streak', label: 'Streak', icon: '🔥' },
  { key: 'lab', label: 'Lab', icon: '🧪' },
  { key: 'game_master', label: 'Game Master', icon: '🎮' },
  { key: 'knowledge', label: 'Knowledge', icon: '📚' },
  { key: 'explorer', label: 'Explorer', icon: '🧭' },
  { key: 'creator', label: 'Creator', icon: '🎨' },
  { key: 'secret', label: 'Secret', icon: '🔮' },
  { key: 'prestige', label: 'Prestige', icon: '👑' },
];

// ═══ AVATAR SHAPES ═══
const AVATAR_SHAPES = [
  { id: 'circle', label: 'Circle', clip: 'circle(50%)' },
  { id: 'hexagon', label: 'Hexagon', clip: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' },
  { id: 'diamond', label: 'Diamond', clip: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
  { id: 'shield', label: 'Shield', clip: 'polygon(50% 0%, 100% 15%, 100% 60%, 50% 100%, 0% 60%, 0% 15%)' },
  { id: 'star', label: 'Star', clip: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
  { id: 'pentagon', label: 'Pentagon', clip: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' },
];

// ═══ LOADING SKELETON ═══
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`}
      aria-hidden="true"
    />
  );
}

// ═══ Badge type for this page ═══
interface BadgeData {
  id: string;
  name: string;
  icon: string;
  category: BadgeCategory;
  description?: string;
  rarity?: string;
  earned?: boolean;
}

export default function ProfilePage() {
  const { activeChild } = useChildStore();
  const updateAvatarConfig = useChildStore((s) => s.updateAvatarConfig);
  const setLabColor = useUIStore((s) => s.setLabColor);
  const reduceMotion = useA11yStore((s) => s.reduceMotion);
  const childId = activeChild?.id || '';

  const { data: badges, isLoading: badgesLoading } = useBadges(childId);
  const { data: labsProgress, isLoading: progressLoading } = useAllLabsProgress(childId);

  // Display name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  // Trophy room category filter
  const [activeCategory, setActiveCategory] = useState<BadgeCategory | 'all'>('all');
  // Daily challenge countdown
  const [resetCountdown, setResetCountdown] = useState(() => getSecondsUntilReset());

  // Set cockpit to profile pink on mount
  useEffect(() => {
    setLabColor('#FF66AA');
  }, [setLabColor]);

  // Daily challenge countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setResetCountdown(getSecondsUntilReset());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  // ═══ Computed data ═══
  const levelInfo = useMemo(() => {
    if (!activeChild) return null;
    return calculateLevel(activeChild.xp);
  }, [activeChild]);

  const flameConfig = useMemo(() => {
    if (!activeChild) return null;
    return getFlameConfig(activeChild.streak_count);
  }, [activeChild]);

  const allBadges = useMemo(() => {
    if (!badges || !Array.isArray(badges)) return [] as BadgeData[];
    return badges as BadgeData[];
  }, [badges]);

  const earnedBadges = useMemo(() => allBadges.filter((b) => b.earned), [allBadges]);

  const filteredBadges = useMemo(() => {
    if (activeCategory === 'all') return allBadges;
    return allBadges.filter((b) => b.category === activeCategory);
  }, [allBadges, activeCategory]);

  const overallProgress = useMemo(() => {
    if (!labsProgress || !Array.isArray(labsProgress)) return 0;
    const total = labsProgress.reduce(
      (sum: number, lab: { percent?: number }) => sum + (lab.percent || 0),
      0
    );
    return Math.round(total / 10);
  }, [labsProgress]);

  const dailyChallenge = useMemo(() => getTodaysChallenge(), []);
  const challengeComplete = useMemo(
    () => isChallengeComplete(activeChild?.streak_last_date),
    [activeChild?.streak_last_date],
  );

  const currentShapeIndex = activeChild?.avatar_config?.face_shape ?? 0;
  const shapeConfig = AVATAR_SHAPES[currentShapeIndex] || AVATAR_SHAPES[0];

  // ═══ Handlers ═══
  const startEditName = useCallback(() => {
    setEditName(activeChild?.display_name || '');
    setIsEditingName(true);
  }, [activeChild]);

  const saveName = useCallback(() => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== activeChild?.display_name) {
      // Optimistic update — API sync handled by childStore
      useChildStore.getState().setActiveChild({
        ...activeChild!,
        display_name: trimmed,
      });
    }
    setIsEditingName(false);
  }, [editName, activeChild]);

  const cancelEditName = useCallback(() => {
    setIsEditingName(false);
    setEditName('');
  }, []);

  const selectShape = useCallback(
    (index: number) => {
      updateAvatarConfig({ face_shape: index });
    },
    [updateAvatarConfig]
  );

  // ═══ Loading state ═══
  if (!activeChild) {
    return (
      <div className="text-center py-20" role="status" aria-label="Loading profile">
        <div className="w-8 h-8 border-2 border-spark-pink/30 border-t-spark-pink rounded-full animate-spin mx-auto" />
        <p className="text-white/50 font-body mt-4">Loading profile systems...</p>
      </div>
    );
  }

  const levelColor = levelInfo ? getLevelColor(levelInfo.level) : '#FF66AA';
  const xpPercent = levelInfo ? Math.round(levelInfo.progress * 100) : 0;

  return (
    <motion.div
      variants={reduceMotion ? undefined : staggerContainer}
      initial={reduceMotion ? undefined : 'initial'}
      animate={reduceMotion ? undefined : 'animate'}
      className="space-y-4 max-w-2xl mx-auto pb-8"
      role="main"
      aria-label="Player Profile"
    >
      {/* ═══ Profile Header ═══ */}
      <motion.section
        variants={reduceMotion ? undefined : staggerItem}
        className="rounded-xl p-6 backdrop-blur-md border border-spark-pink/20 bg-spark-pink/5 text-center"
        aria-label="Profile overview"
      >
        {/* Avatar with shape selector */}
        <div className="relative inline-block mb-3">
          <div
            className="w-24 h-24 mx-auto flex items-center justify-center text-4xl border-2 transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${levelColor}20, #AA66FF20)`,
              borderColor: `${levelColor}60`,
              boxShadow: `0 0 40px ${levelColor}20`,
              clipPath: shapeConfig.clip,
            }}
            aria-label={`Player avatar: ${shapeConfig.label} shape`}
          >
            {activeChild.display_name?.charAt(0)?.toUpperCase() || '\u26a1'}
          </div>

          {/* Streak flame indicator */}
          {flameConfig && activeChild.streak_count >= 1 && (
            <div
              className="absolute -top-2 -right-2 text-lg"
              aria-label={`Streak flame: ${flameConfig.label}`}
              title={flameConfig.label}
            >
              {getStreakEmoji(activeChild.streak_count)}
            </div>
          )}
        </div>

        {/* Display Name (editable) */}
        <div className="flex items-center justify-center gap-2 mb-1">
          {isEditingName ? (
            <div className="flex items-center gap-2" role="group" aria-label="Edit display name">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveName();
                  if (e.key === 'Escape') cancelEditName();
                }}
                className="bg-white/[0.06] border border-spark-pink/30 rounded-lg px-3 py-1 font-display text-xl text-white text-center focus:outline-none focus:border-spark-pink/60"
                maxLength={20}
                autoFocus
                aria-label="Display name input"
              />
              <button onClick={saveName} className="text-spark-green hover:scale-110 transition-transform" aria-label="Save name">
                <Check className="w-5 h-5" />
              </button>
              <button onClick={cancelEditName} className="text-red-400 hover:scale-110 transition-transform" aria-label="Cancel editing">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-xl font-bold text-white">
                {activeChild.display_name}
              </h1>
              <button
                onClick={startEditName}
                className="text-white/30 hover:text-white/60 transition-colors"
                aria-label="Edit display name"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <p className="font-mono text-xs tracking-wider mt-1" style={{ color: `${levelColor}90` }}>
          LEVEL {levelInfo?.level || activeChild.level} · {levelInfo?.title?.toUpperCase() || 'EXPLORER'}
        </p>

        {/* XP Progress bar — accurate via calculateLevel */}
        <div className="mt-4 max-w-xs mx-auto">
          <div className="flex items-center justify-between text-[10px] font-data text-white/30 mb-1">
            <span>{levelInfo?.xpInLevel || 0} XP</span>
            <span>
              {((levelInfo?.xpForNextLevel || 0) - (levelInfo?.xpForCurrentLevel || 0)).toLocaleString()} XP to level{' '}
              {(levelInfo?.level || 1) + 1}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden relative">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${levelColor}, ${levelColor}CC)`,
                boxShadow: `0 0 8px ${levelColor}40`,
              }}
              initial={reduceMotion ? { width: `${xpPercent}%` } : { width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={reduceMotion ? { duration: 0 } : { duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.section>

      {/* ═══ Avatar Shape Selector ═══ */}
      <motion.section
        variants={reduceMotion ? undefined : staggerItem}
        className="rounded-xl p-5 backdrop-blur-md border border-white/[0.06] bg-surface-card/50"
        aria-label="Avatar customization"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-spark-purple" />
          <h2 className="font-display font-bold text-white text-sm">Avatar Shape</h2>
        </div>
        <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Select avatar shape">
          {AVATAR_SHAPES.map((shape, idx) => (
            <button
              key={shape.id}
              onClick={() => selectShape(idx)}
              className={`aspect-square rounded-lg border transition-all flex items-center justify-center text-xs font-body ${
                currentShapeIndex === idx
                  ? 'border-spark-pink/60 bg-spark-pink/10 text-white'
                  : 'border-white/[0.06] bg-white/[0.03] text-white/40 hover:border-white/20 hover:text-white/60'
              }`}
              role="radio"
              aria-checked={currentShapeIndex === idx}
              aria-label={`${shape.label} shape`}
            >
              <div
                className="w-8 h-8 bg-gradient-to-br from-spark-pink/30 to-spark-purple/30"
                style={{ clipPath: shape.clip }}
              />
            </button>
          ))}
        </div>
      </motion.section>

      {/* ═══ Stats Grid ═══ */}
      <motion.div
        variants={reduceMotion ? undefined : staggerItem}
        className="grid grid-cols-4 gap-3"
        role="group"
        aria-label="Player stats"
      >
        {[
          { label: 'Total XP', value: activeChild.xp.toLocaleString(), icon: Zap, color: '#00BBFF' },
          {
            label: 'Streak',
            value: `${activeChild.streak_count}d`,
            icon: Flame,
            color: flameConfig?.coreColor || '#FF6644',
          },
          { label: 'Progress', value: `${progressLoading ? '...' : overallProgress}%`, icon: Target, color: '#00FF88' },
          {
            label: 'Coins',
            value: (activeChild.spark_coins || 0).toLocaleString(),
            icon: Coins,
            color: '#FFAA44',
          },
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

      {/* ═══ Streak Flame Section ═══ */}
      {flameConfig && activeChild.streak_count >= 1 && (
        <motion.section
          variants={reduceMotion ? undefined : staggerItem}
          className="rounded-xl p-5 backdrop-blur-md border border-white/[0.06] bg-surface-card/50"
          aria-label={`Streak status: ${flameConfig.label}, ${activeChild.streak_count} days`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{
                  background: `radial-gradient(circle, ${flameConfig.coreColor}30, transparent)`,
                  boxShadow: `0 0 20px ${flameConfig.glowColor}`,
                }}
              >
                {getStreakEmoji(activeChild.streak_count)}
              </div>
              <div>
                <p className="font-display font-bold text-white text-sm">{flameConfig.label}</p>
                <p className="font-mono text-[10px] text-white/30 uppercase tracking-wider">
                  {activeChild.streak_count} Day Streak
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-data text-xs" style={{ color: flameConfig.coreColor }}>
                {flameConfig.tier.toUpperCase()}
              </p>
              {/* Flame intensity bar */}
              <div className="w-20 h-1.5 rounded-full bg-white/[0.06] mt-1 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${flameConfig.intensity * 100}%`,
                    background: `linear-gradient(90deg, ${flameConfig.coreColor}, ${flameConfig.outerColor})`,
                  }}
                />
              </div>
            </div>
          </div>
          {/* Streak message */}
          <p className="font-body text-xs text-white/40 mt-3">
            {getStreakMessage(activeChild.streak_count, false, false)}
          </p>
          {/* Streak shields */}
          {activeChild.streak_shields > 0 && (
            <div
              className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/[0.06]"
              aria-label={`${activeChild.streak_shields} streak shield${activeChild.streak_shields !== 1 ? 's' : ''} available`}
            >
              <Shield className="w-3.5 h-3.5 text-neon-blue" />
              <span className="font-data text-[11px] text-neon-blue">
                {activeChild.streak_shields} Streak Shield{activeChild.streak_shields !== 1 ? 's' : ''} Available
              </span>
            </div>
          )}
        </motion.section>
      )}

      {/* ═══ Daily Challenge ═══ */}
      <motion.section
        variants={reduceMotion ? undefined : staggerItem}
        className="rounded-xl p-5 backdrop-blur-md border border-white/[0.06] bg-surface-card/50"
        aria-label="Daily challenge"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-spark-green" />
            <h2 className="font-display font-bold text-white text-sm">Daily Challenge</h2>
          </div>
          <div className="flex items-center gap-1 text-white/30">
            <Clock className="w-3 h-3" />
            <span className="font-data text-[10px]">Resets in {formatTimeRemaining(resetCountdown)}</span>
          </div>
        </div>
        <div
          className={`rounded-lg p-4 border ${
            challengeComplete
              ? 'border-spark-green/30 bg-spark-green/5'
              : 'border-spark-orange/20 bg-spark-orange/5'
          }`}
          role="status"
          aria-label={`Daily challenge: ${dailyChallenge.title}. ${challengeComplete ? 'Completed' : 'In progress'}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl flex-shrink-0" aria-hidden="true">{dailyChallenge.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-white text-sm">{dailyChallenge.title}</p>
              <p className="font-body text-xs text-white/40 mt-0.5">{dailyChallenge.description}</p>
            </div>
            <div className="text-right flex-shrink-0">
              {challengeComplete ? (
                <div className="flex items-center gap-1 text-spark-green">
                  <Check className="w-4 h-4" />
                  <span className="font-data text-xs">Done</span>
                </div>
              ) : (
                <div className="font-data text-xs text-spark-orange">
                  +{dailyChallenge.xpReward} XP
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══ Spark Coins + Cosmetic Shop Teaser ═══ */}
      <motion.section
        variants={reduceMotion ? undefined : staggerItem}
        className="rounded-xl p-5 backdrop-blur-md border border-white/[0.06] bg-surface-card/50"
        aria-label="Spark Coins"
      >
        <div className="flex items-center gap-2 mb-3">
          <Coins className="w-4 h-4 text-spark-orange" />
          <h2 className="font-display font-bold text-white text-sm">Spark Coins</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p
              className="font-data text-3xl font-bold"
              style={{ color: '#FFAA44' }}
              aria-label={`${(activeChild.spark_coins || 0).toLocaleString()} Spark Coins`}
            >
              {(activeChild.spark_coins || 0).toLocaleString()}
            </p>
            <p className="font-body text-xs text-white/30 mt-1">
              Earn coins by completing games and challenges
            </p>
          </div>
          <div
            className="rounded-lg px-4 py-2.5 border border-white/[0.06] bg-white/[0.03] text-center"
            aria-label="Cosmetic shop coming soon"
          >
            <Lock className="w-4 h-4 text-white/20 mx-auto mb-1" />
            <p className="font-mono text-[9px] text-white/20 uppercase tracking-wider">Shop</p>
            <p className="font-body text-[8px] text-white/15">Coming Soon</p>
          </div>
        </div>
      </motion.section>

      {/* ═══ Trophy Room — Badge Gallery by Category ═══ */}
      <motion.section
        variants={reduceMotion ? undefined : staggerItem}
        className="rounded-xl p-5 backdrop-blur-md border border-white/[0.06] bg-surface-card/50"
        aria-label="Trophy room"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-spark-orange" />
            <h2 className="font-display font-bold text-white text-sm">Trophy Room</h2>
          </div>
          <span className="font-data text-xs text-white/30">
            {earnedBadges.length} / {allBadges.length} earned
          </span>
        </div>

        {/* Category filter tabs */}
        <div
          className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-hide"
          role="tablist"
          aria-label="Badge categories"
        >
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider whitespace-nowrap border transition-all ${
              activeCategory === 'all'
                ? 'border-spark-orange/40 bg-spark-orange/10 text-spark-orange'
                : 'border-white/[0.06] text-white/30 hover:text-white/50'
            }`}
            role="tab"
            aria-selected={activeCategory === 'all'}
          >
            All ({allBadges.length})
          </button>
          {BADGE_CATEGORIES.map((cat) => {
            const count = allBadges.filter((b) => b.category === cat.key).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider whitespace-nowrap border transition-all ${
                  activeCategory === cat.key
                    ? 'border-spark-orange/40 bg-spark-orange/10 text-spark-orange'
                    : 'border-white/[0.06] text-white/30 hover:text-white/50'
                }`}
                role="tab"
                aria-selected={activeCategory === cat.key}
              >
                {cat.icon} {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Badge grid */}
        {badgesLoading ? (
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : filteredBadges.length > 0 ? (
          <div className="grid grid-cols-4 gap-2" role="list" aria-label="Badges">
            <AnimatePresence mode="popLayout">
              {filteredBadges.map((badge) => (
                <motion.div
                  key={badge.id}
                  layout={!reduceMotion}
                  initial={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
                  className={`rounded-lg p-2 text-center border transition-all ${
                    badge.earned
                      ? ''
                      : 'border-white/[0.04] bg-white/[0.02] opacity-40'
                  }`}
                  style={badge.earned && badge.rarity ? {
                    borderColor: `${getRarityColor(badge.rarity)}30`,
                    background: `${getRarityColor(badge.rarity)}08`,
                    boxShadow: `0 0 10px ${getRarityColor(badge.rarity)}10`,
                  } : undefined}
                  role="listitem"
                  aria-label={`Badge: ${badge.name}${badge.earned ? ` (earned, ${badge.rarity || 'common'})` : ' (locked)'}`}
                  title={badge.description || badge.name}
                >
                  <div className={`text-xl mb-1 ${badge.earned ? '' : 'grayscale'}`}>
                    {badge.earned ? badge.icon || '\ud83c\udfc5' : '\ud83d\udd12'}
                  </div>
                  <p className="font-mono text-[8px] text-white/40 truncate">{badge.name}</p>
                  {badge.rarity && badge.earned && (
                    <p
                      className="font-data text-[7px] uppercase mt-0.5"
                      style={{ color: getRarityColor(badge.rarity) }}
                    >
                      {badge.rarity}
                    </p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <p className="font-body text-sm text-white/30 text-center py-4">
            {activeCategory === 'all'
              ? 'Complete games and challenges to earn badges!'
              : `No ${activeCategory} badges yet. Keep exploring!`}
          </p>
        )}
      </motion.section>

      {/* ═══ Account Info ═══ */}
      <motion.section
        variants={reduceMotion ? undefined : staggerItem}
        className="rounded-xl p-5 backdrop-blur-md border border-white/[0.06] bg-surface-card/50"
        aria-label="Account information"
      >
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
            <span className="font-body text-white/40">Level Tier</span>
            <span className="font-data" style={{ color: levelColor }}>
              {levelInfo?.title || 'Explorer'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-body text-white/40">Total XP</span>
            <span className="font-data text-neon-blue">{activeChild.xp.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-body text-white/40">Spark Coins</span>
            <span className="font-data text-spark-orange">
              {(activeChild.spark_coins || 0).toLocaleString()} \ud83e\ude99
            </span>
          </div>
        </div>
      </motion.section>

      {/* ARIA live region for screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Profile: {activeChild.display_name}. Level {levelInfo?.level || activeChild.level},{' '}
        {levelInfo?.title || 'Explorer'}. {earnedBadges.length} badges earned out of{' '}
        {allBadges.length}. {activeChild.streak_count} day streak{flameConfig ? `, ${flameConfig.label} tier` : ''}.{' '}
        {(activeChild.spark_coins || 0).toLocaleString()} Spark Coins.
      </div>
    </motion.div>
  );
}
