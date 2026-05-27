// ════════════════════════════════════════════════════
// BADGE ENGINE v2 — Enhanced Badge System
// Rarity tiers, category groups, unlock celebrations
// ════════════════════════════════════════════════════

import type { Rarity } from '@/lib/gamification';

// ═══ TYPES ═══

export type BadgeCategory =
  | 'streak'       // Streak-related achievements
  | 'xp'           // XP/level achievements
  | 'games'        // Game completion achievements
  | 'labs'         // Lab exploration achievements
  | 'social'       // Social/leaderboard achievements (COPPA-safe)
  | 'special'      // Special/secret achievements
  | 'events';      // Time-limited event achievements

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  rarity: Rarity;
  icon: string; // Emoji icon
  criteriaType: string;
  criteriaValue: number;
  criteriaWorld?: number | null;
  isSecret: boolean; // Hidden until earned
  eventOnly?: boolean; // Only available during events
  eventId?: string;
  gemReward: number;
  xpReward: number;
}

export interface ChildBadge {
  badgeId: string;
  childId: string;
  earnedAt: string;
  isNew: boolean; // True if not yet viewed
}

export interface BadgeUnlockResult {
  badge: BadgeDefinition;
  isNew: boolean;
  celebration: {
    sound: boolean;
    particles: boolean;
    screenShake: boolean;
  };
  rewards: {
    gems: number;
    xp: number;
  };
}

export interface BadgeCollection {
  totalBadges: number;
  earnedCount: number;
  byCategory: Record<BadgeCategory, { total: number; earned: number }>;
  byRarity: Record<Rarity, { total: number; earned: number }>;
  secretBadgesFound: number;
  secretBadgesTotal: number;
  completionPercent: number;
  recentlyEarned: ChildBadge[];
}

// ═══ BADGE DEFINITIONS ═══

/** Complete badge catalog — all earnable badges */
export const BADGE_CATALOG: BadgeDefinition[] = [
  // ─── STREAK BADGES ───
  {
    id: 'streak-3', name: 'On Fire', description: 'Maintain a 3-day streak',
    category: 'streak', rarity: 'common', icon: '🔥',
    criteriaType: 'maintain_streak', criteriaValue: 3,
    isSecret: false, gemReward: 10, xpReward: 25,
  },
  {
    id: 'streak-7', name: 'Streak Society', description: 'Maintain a 7-day streak',
    category: 'streak', rarity: 'uncommon', icon: '🛡️',
    criteriaType: 'maintain_streak', criteriaValue: 7,
    isSecret: false, gemReward: 20, xpReward: 50,
  },
  {
    id: 'streak-14', name: 'Fortnight Hero', description: 'Maintain a 14-day streak',
    category: 'streak', rarity: 'uncommon', icon: '🏰',
    criteriaType: 'maintain_streak', criteriaValue: 14,
    isSecret: false, gemReward: 30, xpReward: 100,
  },
  {
    id: 'streak-30', name: 'Streak Master', description: 'Maintain a 30-day streak',
    category: 'streak', rarity: 'rare', icon: '💫',
    criteriaType: 'maintain_streak', criteriaValue: 30,
    isSecret: false, gemReward: 50, xpReward: 250,
  },
  {
    id: 'streak-60', name: 'Two Months Strong', description: 'Maintain a 60-day streak',
    category: 'streak', rarity: 'rare', icon: '🌋',
    criteriaType: 'maintain_streak', criteriaValue: 60,
    isSecret: false, gemReward: 75, xpReward: 500,
  },
  {
    id: 'streak-100', name: 'Centurion', description: 'Maintain a 100-day streak',
    category: 'streak', rarity: 'epic', icon: '💯',
    criteriaType: 'maintain_streak', criteriaValue: 100,
    isSecret: false, gemReward: 150, xpReward: 1000,
  },
  {
    id: 'streak-365', name: 'Unstoppable', description: 'Maintain a 365-day streak',
    category: 'streak', rarity: 'legendary', icon: '👑',
    criteriaType: 'maintain_streak', criteriaValue: 365,
    isSecret: false, gemReward: 500, xpReward: 5000,
  },

  // ─── XP BADGES ───
  {
    id: 'xp-100', name: 'First Steps', description: 'Earn 100 XP',
    category: 'xp', rarity: 'common', icon: '👣',
    criteriaType: 'reach_xp', criteriaValue: 100,
    isSecret: false, gemReward: 5, xpReward: 10,
  },
  {
    id: 'xp-500', name: 'Rising Star', description: 'Earn 500 XP',
    category: 'xp', rarity: 'common', icon: '⭐',
    criteriaType: 'reach_xp', criteriaValue: 500,
    isSecret: false, gemReward: 10, xpReward: 25,
  },
  {
    id: 'xp-1000', name: 'XP Collector', description: 'Earn 1,000 XP',
    category: 'xp', rarity: 'uncommon', icon: '🏆',
    criteriaType: 'reach_xp', criteriaValue: 1000,
    isSecret: false, gemReward: 20, xpReward: 50,
  },
  {
    id: 'xp-5000', name: 'XP Hoarder', description: 'Earn 5,000 XP',
    category: 'xp', rarity: 'rare', icon: '💰',
    criteriaType: 'reach_xp', criteriaValue: 5000,
    isSecret: false, gemReward: 50, xpReward: 150,
  },
  {
    id: 'xp-10000', name: 'XP Millionaire', description: 'Earn 10,000 XP',
    category: 'xp', rarity: 'epic', icon: '🏦',
    criteriaType: 'reach_xp', criteriaValue: 10000,
    isSecret: false, gemReward: 100, xpReward: 500,
  },

  // ─── LEVEL BADGES ───
  {
    id: 'level-5', name: 'Getting Started', description: 'Reach Level 5',
    category: 'xp', rarity: 'common', icon: '🎓',
    criteriaType: 'reach_level', criteriaValue: 5,
    isSecret: false, gemReward: 10, xpReward: 25,
  },
  {
    id: 'level-10', name: 'Apprentice', description: 'Reach Level 10',
    category: 'xp', rarity: 'uncommon', icon: '📜',
    criteriaType: 'reach_level', criteriaValue: 10,
    isSecret: false, gemReward: 20, xpReward: 50,
  },
  {
    id: 'level-20', name: 'Neural Navigator', description: 'Reach Level 20',
    category: 'xp', rarity: 'rare', icon: '🧭',
    criteriaType: 'reach_level', criteriaValue: 20,
    isSecret: false, gemReward: 35, xpReward: 100,
  },
  {
    id: 'level-30', name: 'Machine Mentor', description: 'Reach Level 30',
    category: 'xp', rarity: 'epic', icon: '🦉',
    criteriaType: 'reach_level', criteriaValue: 30,
    isSecret: false, gemReward: 75, xpReward: 300,
  },
  {
    id: 'level-50', name: 'Forge Master', description: 'Reach Level 50',
    category: 'xp', rarity: 'legendary', icon: '⚔️',
    criteriaType: 'reach_level', criteriaValue: 50,
    isSecret: false, gemReward: 250, xpReward: 1000,
  },

  // ─── GAME BADGES ───
  {
    id: 'games-10', name: 'Game Explorer', description: 'Play 10 different games',
    category: 'games', rarity: 'common', icon: '🎮',
    criteriaType: 'unique_games_played', criteriaValue: 10,
    isSecret: false, gemReward: 15, xpReward: 30,
  },
  {
    id: 'games-25', name: 'Game Collector', description: 'Play 25 different games',
    category: 'games', rarity: 'uncommon', icon: '🎯',
    criteriaType: 'unique_games_played', criteriaValue: 25,
    isSecret: false, gemReward: 30, xpReward: 75,
  },
  {
    id: 'games-42', name: ' completionist', description: 'Play all 42 games',
    category: 'games', rarity: 'epic', icon: '🏁',
    criteriaType: 'unique_games_played', criteriaValue: 42,
    isSecret: false, gemReward: 100, xpReward: 500,
  },
  {
    id: 'perfect-10', name: 'Perfectionist', description: 'Get 10 perfect scores',
    category: 'games', rarity: 'rare', icon: '💎',
    criteriaType: 'perfect_scores', criteriaValue: 10,
    isSecret: false, gemReward: 40, xpReward: 100,
  },

  // ─── LAB BADGES ───
  {
    id: 'lab-1', name: 'Lab Explorer', description: 'Complete Lab 1',
    category: 'labs', rarity: 'common', icon: '🔬',
    criteriaType: 'complete_world', criteriaValue: 100, criteriaWorld: 1,
    isSecret: false, gemReward: 10, xpReward: 25,
  },
  {
    id: 'lab-5', name: 'Halfway Hero', description: 'Complete 5 Labs',
    category: 'labs', rarity: 'uncommon', icon: '🧪',
    criteriaType: 'worlds_mastered', criteriaValue: 5,
    isSecret: false, gemReward: 25, xpReward: 75,
  },
  {
    id: 'lab-10', name: 'Lab Conqueror', description: 'Complete all 10 Labs',
    category: 'labs', rarity: 'epic', icon: '🏛️',
    criteriaType: 'worlds_mastered', criteriaValue: 10,
    isSecret: false, gemReward: 100, xpReward: 500,
  },

  // ─── SOCIAL BADGES (COPPA-safe) ───
  {
    id: 'social-bronze', name: 'Bronze Climber', description: 'Reach Bronze League',
    category: 'social', rarity: 'common', icon: '🥉',
    criteriaType: 'reach_league', criteriaValue: 1,
    isSecret: false, gemReward: 10, xpReward: 20,
  },
  {
    id: 'social-gold', name: 'Gold Champion', description: 'Reach Gold League',
    category: 'social', rarity: 'uncommon', icon: '🥇',
    criteriaType: 'reach_league', criteriaValue: 3,
    isSecret: false, gemReward: 30, xpReward: 75,
  },
  {
    id: 'social-legend', name: 'Legend', description: 'Reach Legend League',
    category: 'social', rarity: 'legendary', icon: '👑',
    criteriaType: 'reach_league', criteriaValue: 6,
    isSecret: false, gemReward: 200, xpReward: 500,
  },

  // ─── SPECIAL / SECRET BADGES ───
  {
    id: 'secret-first-login', name: 'Spark Ignited', description: 'Began your AI learning journey!',
    category: 'special', rarity: 'uncommon', icon: '✨',
    criteriaType: 'special', criteriaValue: 1,
    isSecret: false, gemReward: 5, xpReward: 10,
  },
  {
    id: 'secret-early-bird', name: 'Early Bird', description: 'Complete a game before 8 AM',
    category: 'special', rarity: 'uncommon', icon: '🐦',
    criteriaType: 'special', criteriaValue: 1,
    isSecret: true, gemReward: 15, xpReward: 25,
  },
  {
    id: 'secret-night-owl', name: 'Night Owl', description: 'Complete a game after 8 PM',
    category: 'special', rarity: 'uncommon', icon: '🦉',
    criteriaType: 'special', criteriaValue: 1,
    isSecret: true, gemReward: 15, xpReward: 25,
  },
  {
    id: 'secret-weekend', name: 'Weekend Warrior', description: 'Study on Saturday and Sunday',
    category: 'special', rarity: 'rare', icon: '🌟',
    criteriaType: 'special', criteriaValue: 1,
    isSecret: true, gemReward: 25, xpReward: 50,
  },
  {
    id: 'secret-comeback', name: 'Comeback Kid', description: 'Reclaim a 7+ day streak after losing it',
    category: 'special', rarity: 'rare', icon: '🔄',
    criteriaType: 'special', criteriaValue: 1,
    isSecret: true, gemReward: 30, xpReward: 75,
  },
  {
    id: 'secret-speed', name: 'Speed Demon', description: 'Complete 5 games in one day',
    category: 'special', rarity: 'uncommon', icon: '⚡',
    criteriaType: 'special', criteriaValue: 5,
    isSecret: true, gemReward: 20, xpReward: 40,
  },
  {
    id: 'secret-collector', name: 'Badge Collector', description: 'Earn 20 badges',
    category: 'special', rarity: 'epic', icon: '🎖️',
    criteriaType: 'total_badges', criteriaValue: 20,
    isSecret: false, gemReward: 75, xpReward: 250,
  },
  {
    id: 'secret-collector-all', name: 'Badge Master', description: 'Earn every badge',
    category: 'special', rarity: 'legendary', icon: '🏵️',
    criteriaType: 'total_badges', criteriaValue: 0, // Dynamic: total badge count
    isSecret: true, gemReward: 500, xpReward: 2000,
  },
];

// ═══ HELPER FUNCTIONS ═══

/** Get badge by ID */
export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGE_CATALOG.find(b => b.id === id);
}

/** Get badges by category */
export function getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
  return BADGE_CATALOG.filter(b => b.category === category);
}

/** Get badges by rarity */
export function getBadgesByRarity(rarity: Rarity): BadgeDefinition[] {
  return BADGE_CATALOG.filter(b => b.rarity === rarity);
}

/** Get visible badges (non-secret or already earned) */
export function getVisibleBadges(earnedIds: Set<string>): BadgeDefinition[] {
  return BADGE_CATALOG.filter(b => !b.isSecret || earnedIds.has(b.id));
}

/** Calculate badge collection stats */
export function calculateCollection(earnedIds: Set<string>): BadgeCollection {
  const categories: BadgeCategory[] = ['streak', 'xp', 'games', 'labs', 'social', 'special', 'events'];
  const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

  const byCategory = {} as Record<BadgeCategory, { total: number; earned: number }>;
  for (const cat of categories) {
    const total = BADGE_CATALOG.filter(b => b.category === cat).length;
    const earned = BADGE_CATALOG.filter(b => b.category === cat && earnedIds.has(b.id)).length;
    byCategory[cat] = { total, earned };
  }

  const byRarity = {} as Record<Rarity, { total: number; earned: number }>;
  for (const r of rarities) {
    const total = BADGE_CATALOG.filter(b => b.rarity === r).length;
    const earned = BADGE_CATALOG.filter(b => b.rarity === r && earnedIds.has(b.id)).length;
    byRarity[r] = { total, earned };
  }

  const secretBadgesTotal = BADGE_CATALOG.filter(b => b.isSecret).length;
  const secretBadgesFound = BADGE_CATALOG.filter(b => b.isSecret && earnedIds.has(b.id)).length;
  const earnedCount = earnedIds.size;
  const totalBadges = BADGE_CATALOG.length;

  return {
    totalBadges,
    earnedCount,
    byCategory,
    byRarity,
    secretBadgesFound,
    secretBadgesTotal,
    completionPercent: totalBadges > 0 ? Math.round((earnedCount / totalBadges) * 100) : 0,
    recentlyEarned: [], // Populated by caller
  };
}

/** Build unlock result for a newly earned badge */
export function buildUnlockResult(badgeId: string, isSecretReveal: boolean = false): BadgeUnlockResult {
  const badge = getBadgeById(badgeId);
  if (!badge) {
    throw new Error(`Badge not found: ${badgeId}`);
  }

  // Celebration intensity based on rarity
  const celebration = {
    sound: true,
    particles: badge.rarity !== 'common',
    screenShake: badge.rarity === 'epic' || badge.rarity === 'legendary',
  };

  return {
    badge,
    isNew: isSecretReveal,
    celebration,
    rewards: {
      gems: badge.gemReward,
      xp: badge.xpReward,
    },
  };
}

/** Get category display info */
export function getCategoryInfo(category: BadgeCategory): { label: string; icon: string; color: string } {
  switch (category) {
    case 'streak': return { label: 'Streak', icon: '🔥', color: '#FF6B35' };
    case 'xp': return { label: 'XP & Levels', icon: '⭐', color: '#FCD34D' };
    case 'games': return { label: 'Games', icon: '🎮', color: '#3B82F6' };
    case 'labs': return { label: 'Labs', icon: '🔬', color: '#10B981' };
    case 'social': return { label: 'Leagues', icon: '🏆', color: '#8B5CF6' };
    case 'special': return { label: 'Special', icon: '✨', color: '#EC4899' };
    case 'events': return { label: 'Events', icon: '🎉', color: '#F59E0B' };
  }
}

/** Check if a badge criteria is met based on child stats */
export function checkBadgeCriteria(
  badge: BadgeDefinition,
  childStats: {
    xp: number;
    level: number;
    streakCount: number;
    uniqueGamesPlayed: number;
    perfectScores: number;
    labsMastered: number;
    currentLeague: number;
    totalBadges: number;
  },
): boolean {
  switch (badge.criteriaType) {
    case 'reach_xp':
      return childStats.xp >= badge.criteriaValue;
    case 'reach_level':
      return childStats.level >= badge.criteriaValue;
    case 'maintain_streak':
      return childStats.streakCount >= badge.criteriaValue;
    case 'unique_games_played':
      return childStats.uniqueGamesPlayed >= badge.criteriaValue;
    case 'perfect_scores':
      return childStats.perfectScores >= badge.criteriaValue;
    case 'complete_world':
      return childStats.labsMastered >= 1; // Simplified
    case 'worlds_mastered':
      return childStats.labsMastered >= badge.criteriaValue;
    case 'reach_league':
      return childStats.currentLeague >= badge.criteriaValue;
    case 'total_badges':
      // For "all badges", check against total catalog
      if (badge.criteriaValue === 0) {
        return childStats.totalBadges >= BADGE_CATALOG.length;
      }
      return childStats.totalBadges >= badge.criteriaValue;
    case 'special':
      // Special badges checked by specific event handlers
      return false;
    default:
      return false;
  }
}

/** Find all newly eligible badges for a child */
export function findNewlyEligibleBadges(
  childStats: {
    xp: number;
    level: number;
    streakCount: number;
    uniqueGamesPlayed: number;
    perfectScores: number;
    labsMastered: number;
    currentLeague: number;
    totalBadges: number;
  },
  alreadyEarnedIds: Set<string>,
): BadgeDefinition[] {
  const eligible: BadgeDefinition[] = [];

  for (const badge of BADGE_CATALOG) {
    if (alreadyEarnedIds.has(badge.id)) continue;
    if (badge.criteriaType === 'special') continue; // Requires specific events

    if (checkBadgeCriteria(badge, childStats)) {
      eligible.push(badge);
    }
  }

  return eligible;
}
