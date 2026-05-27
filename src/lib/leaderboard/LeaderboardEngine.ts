// ════════════════════════════════════════════════════
// LEADERBOARD ENGINE — 6-Tier League System
// COPPA-safe competitive engagement for kids
// Based on Duolingo's proven league mechanics
// ════════════════════════════════════════════════════

// ═══ TYPES ═══

/** League tier — from Bronze (lowest) to Legend (highest) */
export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legend';

/** A league group with participants */
export interface League {
  id: string;
  tier: LeagueTier;
  weekStarting: string; // YYYY-MM-DD (Monday)
  weekEnding: string; // YYYY-MM-DD (Sunday)
  maxParticipants: number;
  isSealed: boolean; // True after week ends
  createdAt: string;
}

/** A participant in a league */
export interface LeagueParticipant {
  id: string;
  leagueId: string;
  childId: string;
  displayName: string; // COPPA-safe pseudonym, NOT real name
  avatarEmoji: string; // Emoji avatar, not photo
  xpEarned: number; // XP earned this week
  gamesPlayed: number;
  questsCompleted: number;
  rank: number; // 1-based rank within league
  promotionStatus: 'promoted' | 'demoted' | 'staying' | 'pending';
  joinedAt: string;
  isActive: boolean; // Has been active this week
}

/** Public leaderboard entry (COPPA-safe view) */
export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  avatarEmoji: string;
  xpEarned: number;
  gamesPlayed: number;
  isCurrentUser: boolean;
  tier: LeagueTier;
  promotionZone: boolean;
  demotionZone: boolean;
}

/** Weekly league result for a child */
export interface WeeklyLeagueResult {
  weekStarting: string;
  tier: LeagueTier;
  finalRank: number;
  totalParticipants: number;
  xpEarned: number;
  promotionStatus: 'promoted' | 'demoted' | 'staying';
  rewards: LeagueReward;
}

/** Rewards for league participation */
export interface LeagueReward {
  gems: number;
  freezes: number;
  badgeId?: string;
  title?: string;
}

/** League configuration per tier */
export interface LeagueConfig {
  tier: LeagueTier;
  label: string;
  color: string;
  bgGradient: string;
  icon: string;
  maxParticipants: number;
  promoteCount: number; // Top N get promoted
  demoteCount: number; // Bottom N get demoted
  rewardGems: {
    first: number;
    second: number;
    third: number;
    top10: number;
    top50: number;
    participation: number;
  };
  unlockRequirement: number; // Min total XP to unlock
}

// ═══ CONSTANTS ═══

/** League tier order for progression */
export const LEAGUE_ORDER: LeagueTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend'];

/** League configurations */
export const LEAGUE_CONFIGS: Record<LeagueTier, LeagueConfig> = {
  bronze: {
    tier: 'bronze',
    label: 'Bronze League',
    color: '#CD7F32',
    bgGradient: 'linear-gradient(135deg, #8B4513, #CD7F32)',
    icon: '🥉',
    maxParticipants: 50,
    promoteCount: 5,
    demoteCount: 0, // Can't demote from lowest
    rewardGems: { first: 20, second: 15, third: 10, top10: 5, top50: 3, participation: 1 },
    unlockRequirement: 0,
  },
  silver: {
    tier: 'silver',
    label: 'Silver League',
    color: '#C0C0C0',
    bgGradient: 'linear-gradient(135deg, #808080, #C0C0C0)',
    icon: '🥈',
    maxParticipants: 50,
    promoteCount: 5,
    demoteCount: 10,
    rewardGems: { first: 35, second: 25, third: 15, top10: 10, top50: 5, participation: 2 },
    unlockRequirement: 500,
  },
  gold: {
    tier: 'gold',
    label: 'Gold League',
    color: '#FFD700',
    bgGradient: 'linear-gradient(135deg, #B8860B, #FFD700)',
    icon: '🥇',
    maxParticipants: 30,
    promoteCount: 3,
    demoteCount: 8,
    rewardGems: { first: 60, second: 45, third: 30, top10: 15, top50: 8, participation: 3 },
    unlockRequirement: 1500,
  },
  platinum: {
    tier: 'platinum',
    label: 'Platinum League',
    color: '#E5E4E2',
    bgGradient: 'linear-gradient(135deg, #7D7D7D, #E5E4E2)',
    icon: '💎',
    maxParticipants: 30,
    promoteCount: 3,
    demoteCount: 8,
    rewardGems: { first: 100, second: 75, third: 50, top10: 25, top50: 12, participation: 5 },
    unlockRequirement: 3000,
  },
  diamond: {
    tier: 'diamond',
    label: 'Diamond League',
    color: '#B9F2FF',
    bgGradient: 'linear-gradient(135deg, #00CED1, #B9F2FF)',
    icon: '💠',
    maxParticipants: 20,
    promoteCount: 2,
    demoteCount: 5,
    rewardGems: { first: 200, second: 150, third: 100, top10: 50, top50: 25, participation: 10 },
    unlockRequirement: 5000,
  },
  legend: {
    tier: 'legend',
    label: 'Legend League',
    color: '#F59E0B',
    bgGradient: 'linear-gradient(135deg, #D946EF, #F59E0B, #FCD34D)',
    icon: '👑',
    maxParticipants: 15,
    promoteCount: 0, // Stay at top
    demoteCount: 5,
    rewardGems: { first: 500, second: 350, third: 200, top10: 100, top50: 50, participation: 20 },
    unlockRequirement: 10000,
  },
};

/** Zone thresholds as percentages */
export const LEAGUE_ZONES = {
  PROMOTION_TOP_PERCENT: 0.10, // Top 10% promotion zone
  DEMOTION_BOTTOM_PERCENT: 0.20, // Bottom 20% demotion zone
};

// ═══ PURE FUNCTIONS ═══

/** Get league config for a tier */
export function getLeagueConfig(tier: LeagueTier): LeagueConfig {
  return LEAGUE_CONFIGS[tier];
}

/** Get the next tier above (for promotion) */
export function getNextTier(current: LeagueTier): LeagueTier | null {
  const idx = LEAGUE_ORDER.indexOf(current);
  if (idx >= LEAGUE_ORDER.length - 1) return null;
  return LEAGUE_ORDER[idx + 1];
}

/** Get the previous tier below (for demotion) */
export function getPreviousTier(current: LeagueTier): LeagueTier | null {
  const idx = LEAGUE_ORDER.indexOf(current);
  if (idx <= 0) return null;
  return LEAGUE_ORDER[idx - 1];
}

/** Check if a child can access a league tier */
export function canAccessTier(tier: LeagueTier, totalLifetimeXP: number): boolean {
  return totalLifetimeXP >= LEAGUE_CONFIGS[tier].unlockRequirement;
}

/** Calculate promotion/demotion zones for a league */
export function calculateZones(
  participantCount: number,
  tier: LeagueTier,
): { promoteZoneSize: number; demoteZoneSize: number; safeZoneSize: number } {
  const config = LEAGUE_CONFIGS[tier];
  const promoteZoneSize = config.promoteCount;
  const demoteZoneSize = config.demoteCount;
  const safeZoneSize = Math.max(0, participantCount - promoteZoneSize - demoteZoneSize);

  return { promoteZoneSize, demoteZoneSize, safeZoneSize };
}

/** Determine promotion status based on rank */
export function determinePromotionStatus(
  rank: number,
  participantCount: number,
  tier: LeagueTier,
): 'promoted' | 'demoted' | 'staying' {
  const { promoteZoneSize, demoteZoneSize } = calculateZones(participantCount, tier);

  if (rank <= promoteZoneSize && getNextTier(tier)) return 'promoted';
  if (rank > participantCount - demoteZoneSize && getPreviousTier(tier)) return 'demoted';
  return 'staying';
}

/** Check if a rank is in the promotion zone */
export function isInPromotionZone(rank: number, participantCount: number, tier: LeagueTier): boolean {
  const { promoteZoneSize } = calculateZones(participantCount, tier);
  return rank <= promoteZoneSize;
}

/** Check if a rank is in the demotion zone */
export function isInDemotionZone(rank: number, participantCount: number, tier: LeagueTier): boolean {
  const { demoteZoneSize } = calculateZones(participantCount, tier);
  return rank > participantCount - demoteZoneSize;
}

/** Calculate reward for a league position */
export function calculateLeagueReward(
  rank: number,
  participantCount: number,
  tier: LeagueTier,
): LeagueReward {
  const config = LEAGUE_CONFIGS[tier];
  const percentile = rank / participantCount;

  let gems: number;
  if (rank === 1) gems = config.rewardGems.first;
  else if (rank === 2) gems = config.rewardGems.second;
  else if (rank === 3) gems = config.rewardGems.third;
  else if (percentile <= 0.1) gems = config.rewardGems.top10;
  else if (percentile <= 0.5) gems = config.rewardGems.top50;
  else gems = config.rewardGems.participation;

  // Legend league 1st place gets a title
  const title = tier === 'legend' && rank === 1 ? 'Weekly Champion' : undefined;

  return { gems, freezes: 0, title };
}

/** Sort participants by XP (descending) and assign ranks */
export function rankParticipants(
  participants: LeagueParticipant[],
): LeagueParticipant[] {
  const sorted = [...participants].sort((a, b) => {
    if (b.xpEarned !== a.xpEarned) return b.xpEarned - a.xpEarned;
    // Tie-breaker: more games played
    if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
    // Final tie-breaker: joined earlier
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });

  return sorted.map((p, i) => ({
    ...p,
    rank: i + 1,
    promotionStatus: determinePromotionStatus(i + 1, sorted.length, p.tier),
  }));
}

/** Build public leaderboard entries from participants */
export function buildLeaderboard(
  participants: LeagueParticipant[],
  currentChildId: string,
  tier: LeagueTier,
): LeaderboardEntry[] {
  const ranked = rankParticipants(participants);
  const count = ranked.length;

  return ranked.map(p => ({
    rank: p.rank,
    displayName: p.displayName,
    avatarEmoji: p.avatarEmoji,
    xpEarned: p.xpEarned,
    gamesPlayed: p.gamesPlayed,
    isCurrentUser: p.childId === currentChildId,
    tier,
    promotionZone: isInPromotionZone(p.rank, count, tier),
    demotionZone: isInDemotionZone(p.rank, count, tier),
  }));
}

// ═══ WEEKLY CYCLE HELPERS ═══

/** Get the Monday of the current week (week start) */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

/** Get the Sunday of the current week (week end) */
export function getWeekEnd(date: Date = new Date()): string {
  const start = new Date(getWeekStart(date));
  start.setUTCDate(start.getUTCDate() + 6);
  return start.toISOString().split('T')[0];
}

/** Get seconds until next league reset (Monday midnight UTC) */
export function getSecondsUntilLeagueReset(): number {
  const now = new Date();
  const currentDay = now.getUTCDay(); // 0=Sun, 1=Mon
  const daysUntilMonday = currentDay === 0 ? 1 : 8 - currentDay;

  const nextMonday = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysUntilMonday,
    0, 0, 0,
  ));

  return Math.max(0, Math.floor((nextMonday.getTime() - now.getTime()) / 1000));
}

/** Format seconds as "Xd Xh Xm" */
export function formatTimeUntilReset(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ═══ SEEDING & ASSIGNMENT ═══

/** Generate COPPA-safe display names */
export const DISPLAY_NAME_TEMPLATES = [
  'Star', 'Nova', 'Spark', 'Bolt', 'Flash', 'Comet', 'Meteor', 'Aurora',
  'Nebula', 'Quasar', 'Pulsar', 'Zenith', 'Orbit', 'Cosmos', 'Galaxy',
  'Photon', 'Quantum', 'Vector', 'Matrix', 'Cipher', 'Pixel', 'Binary',
  'Neon', 'Prism', 'Spectrum', 'Flux', 'Vortex', 'Nexus', 'Core', 'Sparky',
];

export const DISPLAY_NAME_SUFFIXES = [
  'Rider', 'Walker', 'Runner', 'Seeker', 'Hunter', 'Explorer', 'Pilot',
  'Master', 'Knight', 'Ranger', 'Sage', 'Wizard', 'Ninja', 'Champion',
  'Hero', 'Guardian', 'Warrior', 'Drifter', 'Surfer', 'Diver', 'Climber',
];

/** Generate a COPPA-safe pseudonym for leaderboard display */
export function generateDisplayName(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  const absHash = Math.abs(hash);
  const template = DISPLAY_NAME_TEMPLATES[absHash % DISPLAY_NAME_TEMPLATES.length];
  const suffix = DISPLAY_NAME_SUFFIXES[(absHash >> 4) % DISPLAY_NAME_SUFFIXES.length];
  return `${template}${suffix}`;
}

/** COPPA-safe emoji avatars (no photos, no identifying info) */
export const EMOJI_AVATARS = [
  '🤖', '👾', '🚀', '🛸', '🌟', '⚡', '🔥', '💎',
  '🎯', '🎮', '🎲', '🧩', '🧠', '💡', '🔮', '🎪',
  '🦁', '🐯', '🦊', '🐺', '🦅', '🦉', '🐉', '🦄',
  '🌈', '☀️', '🌙', '⭐', '🔭', '⚛️', '🔬', '🧪',
];

/** Select an emoji avatar deterministically from a seed */
export function selectEmojiAvatar(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return EMOJI_AVATARS[Math.abs(hash) % EMOJI_AVATARS.length];
}

/** Seed fake participants for leagues with low enrollment */
export function seedBotParticipants(
  leagueId: string,
  tier: LeagueTier,
  count: number,
  weekStarting: string,
): LeagueParticipant[] {
  const bots: LeagueParticipant[] = [];

  for (let i = 0; i < count; i++) {
    const botSeed = `bot-${leagueId}-${i}`;
    // Generate realistic XP amounts based on tier
    const baseXP = LEAGUE_CONFIGS[tier].unlockRequirement;
    const variance = Math.floor(Math.random() * baseXP * 0.3);

    bots.push({
      id: botSeed,
      leagueId,
      childId: botSeed,
      displayName: generateDisplayName(botSeed),
      avatarEmoji: selectEmojiAvatar(botSeed),
      xpEarned: Math.max(10, Math.floor(baseXP * 0.05) + variance),
      gamesPlayed: Math.floor(Math.random() * 20) + 1,
      questsCompleted: Math.floor(Math.random() * 5),
      rank: 0, // Assigned by rankParticipants
      promotionStatus: 'pending',
      joinedAt: weekStarting,
      isActive: true,
    });
  }

  return bots;
}

// ═══ PROGRESSION TRACKER ═══

export interface LeagueProgression {
  currentTier: LeagueTier;
  nextTier: LeagueTier | null;
  previousTier: LeagueTier | null;
  xpToNextTier: number;
  xpInCurrentTier: number;
  weeksInCurrentTier: number;
  totalWeeksPlayed: number;
  bestRank: number;
  timesPromoted: number;
  timesDemoted: number;
}

/** Calculate league progression for a child */
export function calculateLeagueProgression(
  currentTier: LeagueTier,
  totalLifetimeXP: number,
  weeklyResults: WeeklyLeagueResult[],
): LeagueProgression {
  const nextTier = getNextTier(currentTier);
  const previousTier = getPreviousTier(currentTier);

  const xpToNextTier = nextTier
    ? Math.max(0, LEAGUE_CONFIGS[nextTier].unlockRequirement - totalLifetimeXP)
    : 0;

  const xpInCurrentTier = totalLifetimeXP - LEAGUE_CONFIGS[currentTier].unlockRequirement;

  const weeksInCurrentTier = weeklyResults.filter(r => r.tier === currentTier).length;
  const bestRank = Math.min(...weeklyResults.map(r => r.finalRank), Infinity);
  const timesPromoted = weeklyResults.filter(r => r.promotionStatus === 'promoted').length;
  const timesDemoted = weeklyResults.filter(r => r.promotionStatus === 'demoted').length;

  return {
    currentTier,
    nextTier,
    previousTier,
    xpToNextTier,
    xpInCurrentTier,
    weeksInCurrentTier,
    totalWeeksPlayed: weeklyResults.length,
    bestRank: bestRank === Infinity ? 0 : bestRank,
    timesPromoted,
    timesDemoted,
  };
}
