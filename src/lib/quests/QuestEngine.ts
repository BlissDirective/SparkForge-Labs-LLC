// ════════════════════════════════════════════════════════════════
// QUEST ENGINE — Sparky Quest Giver System
// ════════════════════════════════════════════════════════════════
// 3 daily quests (Easy/Medium/Hard), weekly quest chains,
// quest templates, rotation, progress tracking, rewards.
// Builds on Phase 3's dailyChallenge but expanded to a full quest system.
//
// All pure functions — no side effects.

// ═══ TYPES ═══

export type QuestRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type QuestType =
  | 'play_games'       // Complete N games
  | 'earn_xp'          // Gain N XP
  | 'streak_maintain'  // Keep streak alive today
  | 'pet_care'         // Care for pet N times
  | 'lab_explore'      // Visit N different labs
  | 'perfect_score'    // Get 100% on N rounds
  | 'play_time'        // Play for N minutes
  | 'earn_gems'        // Earn N gems
  | 'learn_tricks'     // Teach pet N tricks
  | 'friend_play';     // Play with a friend (Phase 8)

export type QuestDifficulty = 'easy' | 'medium' | 'hard';
export type QuestStatus = 'active' | 'completed' | 'claimed' | 'expired';

export interface QuestTemplate {
  id: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  rarity: QuestRarity;
  title: string;
  description: string;
  emoji: string;
  requirementCount: number;
  xpReward: number;
  gemReward: number;
  sparkyExpression: string;
}

export interface ActiveQuest {
  id: string;           // Instance ID (templateId-date)
  templateId: string;
  childId: string;
  status: QuestStatus;
  progress: number;       // Current progress count
  requirementCount: number;
  assignedDate: string;   // YYYY-MM-DD
  expiresAt: string;      // YYYY-MM-DD
  claimedAt: string | null;
  createdAt: string;
  // Joined fields (populated client-side)
  title?: string;
  description?: string;
  emoji?: string;
  difficulty?: QuestDifficulty;
  rarity?: QuestRarity;
  type?: QuestType;
  xpReward?: number;
  gemReward?: number;
  sparkyExpression?: string;
}

export interface WeeklyQuestChain {
  id: string;
  childId: string;
  weekStarting: string;   // YYYY-MM-DD (Monday)
  steps: QuestChainStep[];
  currentStep: number;
  status: 'active' | 'completed' | 'claimed';
  totalSteps: number;
}

export interface QuestChainStep {
  stepNumber: number;
  title: string;
  description: string;
  emoji: string;
  requirementCount: number;
  progress: number;
  xpReward: number;
  gemReward: number;
  status: 'locked' | 'active' | 'completed';
}

export interface QuestReward {
  gems: number;
  xp: number;
  bonusGems: number;   // Streak bonus
  totalGems: number;
  message: string;
}

// ═══ CONSTANTS ═══

export const RARITY_MULTIPLIER: Record<QuestRarity, number> = {
  common: 1.0,
  uncommon: 1.2,
  rare: 1.5,
  epic: 2.0,
  legendary: 3.0,
};

export const RARITY_COLORS: Record<QuestRarity, string> = {
  common: '#94A3B8',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
};

export const RARITY_GLOW: Record<QuestRarity, string> = {
  common: '0 0 0 transparent',
  uncommon: '0 0 8px rgba(34,197,94,0.25)',
  rare: '0 0 12px rgba(59,130,246,0.3)',
  epic: '0 0 16px rgba(168,85,247,0.35)',
  legendary: '0 0 24px rgba(245,158,11,0.4)',
};

export const DIFFICULTY_SLOTS = {
  easy: 1,
  medium: 1,
  hard: 1,
} as const;

// ═══ QUEST TEMPLATE CATALOG (50+ templates) ═══

export const QUEST_TEMPLATES: QuestTemplate[] = [
  // ─── EASY (requirement 1-2, 5-10 gems, 10 XP) ───
  { id: 'qt-play-1', type: 'play_games', difficulty: 'easy', rarity: 'common', title: 'Game Explorer', description: 'Play 1 game today', emoji: '🎮', requirementCount: 1, xpReward: 10, gemReward: 5, sparkyExpression: 'happy' },
  { id: 'qt-play-2', type: 'play_games', difficulty: 'easy', rarity: 'common', title: 'Double Play', description: 'Play 2 different games', emoji: '🕹️', requirementCount: 2, xpReward: 10, gemReward: 5, sparkyExpression: 'happy' },
  { id: 'qt-streak-1', type: 'streak_maintain', difficulty: 'easy', rarity: 'common', title: 'Keep the Fire Burning', description: 'Keep your streak alive today', emoji: '🔥', requirementCount: 1, xpReward: 10, gemReward: 5, sparkyExpression: 'excited' },
  { id: 'qt-pet-1', type: 'pet_care', difficulty: 'easy', rarity: 'uncommon', title: 'Pet Friend', description: 'Feed your pet once', emoji: '🐾', requirementCount: 1, xpReward: 10, gemReward: 8, sparkyExpression: 'happy' },
  { id: 'qt-lab-1', type: 'lab_explore', difficulty: 'easy', rarity: 'common', title: 'Lab Visitor', description: 'Visit 1 lab', emoji: '🔬', requirementCount: 1, xpReward: 10, gemReward: 5, sparkyExpression: 'thinking' },
  { id: 'qt-time-1', type: 'play_time', difficulty: 'easy', rarity: 'common', title: 'Quick Session', description: 'Play for 5 minutes', emoji: '⏱️', requirementCount: 5, xpReward: 10, gemReward: 5, sparkyExpression: 'happy' },
  { id: 'qt-xp-1', type: 'earn_xp', difficulty: 'easy', rarity: 'common', title: 'XP Starter', description: 'Earn 25 XP', emoji: '⭐', requirementCount: 25, xpReward: 10, gemReward: 5, sparkyExpression: 'happy' },
  { id: 'qt-gems-1', type: 'earn_gems', difficulty: 'easy', rarity: 'uncommon', title: 'Gem Hunter', description: 'Earn 10 gems from any source', emoji: '💎', requirementCount: 10, xpReward: 10, gemReward: 8, sparkyExpression: 'excited' },
  { id: 'qt-perfect-1', type: 'perfect_score', difficulty: 'easy', rarity: 'uncommon', title: 'Perfect Round', description: 'Get 100% on 1 round', emoji: '💯', requirementCount: 1, xpReward: 10, gemReward: 8, sparkyExpression: 'celebrating' },
  { id: 'qt-tricks-1', type: 'learn_tricks', difficulty: 'easy', rarity: 'uncommon', title: 'Trick Time', description: 'Train your pet 1 time', emoji: '🎓', requirementCount: 1, xpReward: 10, gemReward: 8, sparkyExpression: 'happy' },

  // ─── MEDIUM (requirement 3-5, 10-20 gems, 25 XP) ───
  { id: 'qt-play-3', type: 'play_games', difficulty: 'medium', rarity: 'common', title: 'Triple Threat', description: 'Play 3 different games', emoji: '🎯', requirementCount: 3, xpReward: 25, gemReward: 10, sparkyExpression: 'excited' },
  { id: 'qt-play-4', type: 'play_games', difficulty: 'medium', rarity: 'uncommon', title: 'Arcade Master', description: 'Play 5 games', emoji: '🏆', requirementCount: 5, xpReward: 25, gemReward: 15, sparkyExpression: 'excited' },
  { id: 'qt-xp-2', type: 'earn_xp', difficulty: 'medium', rarity: 'common', title: 'XP Collector', description: 'Earn 75 XP', emoji: '📈', requirementCount: 75, xpReward: 25, gemReward: 10, sparkyExpression: 'happy' },
  { id: 'qt-xp-3', type: 'earn_xp', difficulty: 'medium', rarity: 'uncommon', title: 'XP Hoarder', description: 'Earn 150 XP', emoji: '🏦', requirementCount: 150, xpReward: 25, gemReward: 15, sparkyExpression: 'excited' },
  { id: 'qt-pet-2', type: 'pet_care', difficulty: 'medium', rarity: 'uncommon', title: 'Pet Caretaker', description: 'Care for your pet 3 times (feed, play, or clean)', emoji: '🐶', requirementCount: 3, xpReward: 25, gemReward: 15, sparkyExpression: 'happy' },
  { id: 'qt-lab-2', type: 'lab_explore', difficulty: 'medium', rarity: 'common', title: 'Lab Explorer', description: 'Visit 3 different labs', emoji: '🧪', requirementCount: 3, xpReward: 25, gemReward: 10, sparkyExpression: 'thinking' },
  { id: 'qt-perfect-2', type: 'perfect_score', difficulty: 'medium', rarity: 'rare', title: 'Perfectionist', description: 'Get 100% on 3 rounds', emoji: '💎', requirementCount: 3, xpReward: 25, gemReward: 20, sparkyExpression: 'celebrating' },
  { id: 'qt-time-2', type: 'play_time', difficulty: 'medium', rarity: 'uncommon', title: 'Dedicated Learner', description: 'Play for 15 minutes', emoji: '⏳', requirementCount: 15, xpReward: 25, gemReward: 15, sparkyExpression: 'happy' },
  { id: 'qt-gems-2', type: 'earn_gems', difficulty: 'medium', rarity: 'rare', title: 'Gem Collector', description: 'Earn 30 gems from any source', emoji: '👑', requirementCount: 30, xpReward: 25, gemReward: 20, sparkyExpression: 'excited' },
  { id: 'qt-tricks-2', type: 'learn_tricks', difficulty: 'medium', rarity: 'rare', title: 'Pet Trainer', description: 'Teach your pet 2 new tricks', emoji: '🦴', requirementCount: 2, xpReward: 25, gemReward: 20, sparkyExpression: 'excited' },

  // ─── HARD (requirement 7-15, 20-50 gems, 50 XP) ───
  { id: 'qt-play-5', type: 'play_games', difficulty: 'hard', rarity: 'rare', title: 'Marathon Gamer', description: 'Play 8 different games', emoji: '🎰', requirementCount: 8, xpReward: 50, gemReward: 25, sparkyExpression: 'excited' },
  { id: 'qt-play-6', type: 'play_games', difficulty: 'hard', rarity: 'epic', title: 'Arcade Legend', description: 'Play 12 different games', emoji: '🏅', requirementCount: 12, xpReward: 50, gemReward: 35, sparkyExpression: 'celebrating' },
  { id: 'qt-xp-4', type: 'earn_xp', difficulty: 'hard', rarity: 'rare', title: 'XP Champion', description: 'Earn 300 XP', emoji: '🌟', requirementCount: 300, xpReward: 50, gemReward: 25, sparkyExpression: 'excited' },
  { id: 'qt-xp-5', type: 'earn_xp', difficulty: 'hard', rarity: 'epic', title: 'XP Millionaire', description: 'Earn 500 XP', emoji: '💰', requirementCount: 500, xpReward: 50, gemReward: 35, sparkyExpression: 'celebrating' },
  { id: 'qt-pet-3', type: 'pet_care', difficulty: 'hard', rarity: 'epic', title: 'Pet Whisperer', description: 'Care for your pet 8 times', emoji: '❤️', requirementCount: 8, xpReward: 50, gemReward: 35, sparkyExpression: 'happy' },
  { id: 'qt-lab-3', type: 'lab_explore', difficulty: 'hard', rarity: 'rare', title: 'Lab Master', description: 'Visit 7 different labs', emoji: '🔭', requirementCount: 7, xpReward: 50, gemReward: 25, sparkyExpression: 'thinking' },
  { id: 'qt-perfect-3', type: 'perfect_score', difficulty: 'hard', rarity: 'epic', title: 'Flawless Victory', description: 'Get 100% on 7 rounds', emoji: '👑', requirementCount: 7, xpReward: 50, gemReward: 35, sparkyExpression: 'celebrating' },
  { id: 'qt-time-3', type: 'play_time', difficulty: 'hard', rarity: 'rare', title: 'Study Session', description: 'Play for 30 minutes', emoji: '📚', requirementCount: 30, xpReward: 50, gemReward: 25, sparkyExpression: 'happy' },
  { id: 'qt-time-4', type: 'play_time', difficulty: 'hard', rarity: 'epic', title: 'Deep Focus', description: 'Play for 45 minutes', emoji: '🧠', requirementCount: 45, xpReward: 50, gemReward: 35, sparkyExpression: 'thinking' },
  { id: 'qt-gems-3', type: 'earn_gems', difficulty: 'hard', rarity: 'epic', title: 'Gem Tycoon', description: 'Earn 75 gems from any source', emoji: '💎', requirementCount: 75, xpReward: 50, gemReward: 35, sparkyExpression: 'excited' },
  { id: 'qt-streak-2', type: 'streak_maintain', difficulty: 'hard', rarity: 'legendary', title: 'Streak Guardian', description: 'Maintain a 7+ day streak through today', emoji: '🛡️', requirementCount: 7, xpReward: 50, gemReward: 50, sparkyExpression: 'celebrating' },
  { id: 'qt-all-1', type: 'play_games', difficulty: 'hard', rarity: 'legendary', title: 'Complete Explorer', description: 'Play at least 1 game from 5 different labs', emoji: '🌍', requirementCount: 5, xpReward: 50, gemReward: 50, sparkyExpression: 'celebrating' },
];

// ═══ WEEKLY CHAIN TEMPLATES ═══

export const WEEKLY_CHAIN_TEMPLATES = [
  {
    id: 'wct-master',
    title: 'AI Master in Training',
    description: 'Complete this 7-day journey to become an AI master!',
    emoji: '🎓',
    steps: [
      { stepNumber: 1, title: 'First Steps', description: 'Play 2 games', emoji: '👣', requirementCount: 2, xpReward: 10, gemReward: 5 },
      { stepNumber: 2, title: 'Building Knowledge', description: 'Earn 50 XP', emoji: '📚', requirementCount: 50, xpReward: 15, gemReward: 8 },
      { stepNumber: 3, title: 'Pet Care', description: 'Care for your pet 2 times', emoji: '🐾', requirementCount: 2, xpReward: 15, gemReward: 8 },
      { stepNumber: 4, title: 'Halfway Hero', description: 'Play 4 games in 1 day', emoji: '🎯', requirementCount: 4, xpReward: 20, gemReward: 10 },
      { stepNumber: 5, title: 'Explorer', description: 'Visit 4 different labs', emoji: '🔬', requirementCount: 4, xpReward: 20, gemReward: 10 },
      { stepNumber: 6, title: 'Dedicated', description: 'Earn 150 XP in one day', emoji: '⭐', requirementCount: 150, xpReward: 25, gemReward: 15 },
      { stepNumber: 7, title: 'AI Master', description: 'Get 100% on 3 rounds', emoji: '👑', requirementCount: 3, xpReward: 50, gemReward: 30 },
    ],
  },
  {
    id: 'wct-streak',
    title: 'Streak Champion',
    description: 'Build and maintain an incredible streak!',
    emoji: '🔥',
    steps: [
      { stepNumber: 1, title: 'Day 1', description: 'Play 1 game', emoji: '1️⃣', requirementCount: 1, xpReward: 10, gemReward: 5 },
      { stepNumber: 2, title: 'Day 2', description: 'Play 2 games', emoji: '2️⃣', requirementCount: 2, xpReward: 10, gemReward: 5 },
      { stepNumber: 3, title: 'Day 3', description: 'Earn 30 XP', emoji: '3️⃣', requirementCount: 30, xpReward: 15, gemReward: 8 },
      { stepNumber: 4, title: 'Day 4', description: 'Play for 10 minutes', emoji: '4️⃣', requirementCount: 10, xpReward: 15, gemReward: 8 },
      { stepNumber: 5, title: 'Day 5', description: 'Get a perfect score', emoji: '5️⃣', requirementCount: 1, xpReward: 20, gemReward: 10 },
      { stepNumber: 6, title: 'Day 6', description: 'Play 5 different games', emoji: '6️⃣', requirementCount: 5, xpReward: 25, gemReward: 15 },
      { stepNumber: 7, title: 'Day 7', description: 'Earn 100 XP', emoji: '7️⃣', requirementCount: 100, xpReward: 50, gemReward: 30 },
    ],
  },
];

// ═══ PURE FUNCTIONS ═══

/** Select 3 quests for the day (1 easy, 1 medium, 1 hard) with rarity weighting */
export function selectDailyQuests(
  templates: QuestTemplate[],
  seed: string, // childId + date
): QuestTemplate[] {
  const byDifficulty = {
    easy: templates.filter(t => t.difficulty === 'easy'),
    medium: templates.filter(t => t.difficulty === 'medium'),
    hard: templates.filter(t => t.difficulty === 'hard'),
  };

  const selected: QuestTemplate[] = [];

  for (const diff of ['easy', 'medium', 'hard'] as const) {
    const pool = byDifficulty[diff];
    if (pool.length === 0) continue;

    // Weighted random selection by rarity
    const weights = pool.map(t => RARITY_MULTIPLIER[t.rarity]);
    const totalWeight = weights.reduce((s, w) => s + w, 0);

    // Deterministic pseudo-random based on seed + difficulty
    let hash = 0;
    const seedStr = `${seed}-${diff}`;
    for (let i = 0; i < seedStr.length; i++) {
      hash = ((hash << 5) - hash + seedStr.charCodeAt(i)) | 0;
    }
    const rand = Math.abs(hash % 1000) / 1000;

    let cumulative = 0;
    for (let i = 0; i < pool.length; i++) {
      cumulative += weights[i] / totalWeight;
      if (rand <= cumulative) {
        selected.push(pool[i]);
        break;
      }
    }

    // Fallback
    if (selected.filter(s => s.difficulty === diff).length === 0) {
      selected.push(pool[Math.abs(hash) % pool.length]);
    }
  }

  return selected;
}

/** Create an ActiveQuest from a template */
export function activateQuest(
  template: QuestTemplate,
  childId: string,
  date: string,
): ActiveQuest {
  return {
    // Client-side instance id: scoped per template + child + day so two
    // children (or two days) never collide. (The DB row uses its own UUID.)
    id: `${template.id}-${childId}-${date}`,
    templateId: template.id,
    childId,
    status: 'active',
    progress: 0,
    requirementCount: template.requirementCount,
    assignedDate: date,
    expiresAt: date, // Expires end of day
    claimedAt: null,
    createdAt: new Date().toISOString(),
    title: template.title,
    description: template.description,
    emoji: template.emoji,
    difficulty: template.difficulty,
    rarity: template.rarity,
    type: template.type,
    xpReward: template.xpReward,
    gemReward: template.gemReward,
    sparkyExpression: template.sparkyExpression,
  };
}

/** Update quest progress */
export function updateQuestProgress(
  quest: ActiveQuest,
  amount: number,
): ActiveQuest {
  const newProgress = Math.min(quest.requirementCount, quest.progress + amount);

  // Terminal statuses are immutable: a 'claimed' quest must never revert to
  // 'completed' (which would allow its reward to be collected again), and an
  // 'expired' quest can't be revived by further progress. Progress may still
  // tick up for display, but the status is locked.
  if (quest.status === 'claimed' || quest.status === 'expired') {
    return { ...quest, progress: newProgress };
  }

  const isComplete = newProgress >= quest.requirementCount;
  return {
    ...quest,
    progress: newProgress,
    status: isComplete ? 'completed' : quest.status,
  };
}

/** Claim quest rewards */
export function claimQuestReward(
  quest: ActiveQuest,
  streakDays: number, // Consecutive days of completing quests
): { quest: ActiveQuest; reward: QuestReward } {
  if (quest.status !== 'completed') {
    return {
      quest,
      reward: { gems: 0, xp: 0, bonusGems: 0, totalGems: 0, message: 'Quest not completed yet!' },
    };
  }

  const baseGems = quest.gemReward || 0;
  const streakMultiplier = Math.min(2.0, 1 + (streakDays * 0.05)); // +5% per day, max 2x
  const bonusGems = Math.round(baseGems * (streakMultiplier - 1));
  const totalGems = baseGems + bonusGems;

  const updatedQuest: ActiveQuest = {
    ...quest,
    status: 'claimed',
    claimedAt: new Date().toISOString(),
  };

  const reward: QuestReward = {
    gems: baseGems,
    xp: quest.xpReward || 0,
    bonusGems,
    totalGems,
    message: streakDays >= 3
      ? `+${totalGems} gems (+${bonusGems} streak bonus!) and +${quest.xpReward} XP!`
      : `+${totalGems} gems and +${quest.xpReward} XP!`,
  };

  return { quest: updatedQuest, reward };
}

/** Get progress percentage */
export function getQuestProgressPercent(quest: ActiveQuest): number {
  if (quest.requirementCount <= 0) return 0;
  return Math.round((quest.progress / quest.requirementCount) * 100);
}

/** Create a weekly quest chain */
export function createWeeklyChain(
  template: typeof WEEKLY_CHAIN_TEMPLATES[0],
  childId: string,
  weekStarting: string,
): WeeklyQuestChain {
  return {
    id: `${template.id}-${weekStarting}-${childId}`,
    childId,
    weekStarting,
    steps: template.steps.map(s => ({ ...s, status: s.stepNumber === 1 ? 'active' : 'locked', progress: 0 })),
    currentStep: 1,
    status: 'active',
    totalSteps: template.steps.length,
  };
}

/** Advance a weekly chain step */
export function advanceChainStep(chain: WeeklyQuestChain): WeeklyQuestChain {
  const newSteps = chain.steps.map((s, i) => {
    if (i === chain.currentStep - 1) return { ...s, status: 'completed' as const };
    if (i === chain.currentStep) return { ...s, status: 'active' as const };
    return s;
  });

  return {
    ...chain,
    steps: newSteps,
    currentStep: Math.min(chain.currentStep + 1, chain.totalSteps),
    status: chain.currentStep >= chain.totalSteps ? 'completed' : 'active',
  };
}

/** Get Sparky greeting for quest panel */
export function getQuestGreeting(completedCount: number, totalCount: number): string {
  if (totalCount === 0) return "No quests today — but there's always something new to learn!";
  if (completedCount === 0) return "I have some quests for you today! Complete them to earn gems and XP!";
  if (completedCount === totalCount) return "Amazing! You completed all your quests today! You're incredible!";
  if (completedCount >= totalCount / 2) return "Great progress! Just a few more quests to go!";
  return "Keep going! Every quest completed earns you gems and XP!";
}

/** Count quests by status */
export function countQuestsByStatus(quests: ActiveQuest[]): Record<QuestStatus, number> {
  return {
    active: quests.filter(q => q.status === 'active').length,
    completed: quests.filter(q => q.status === 'completed').length,
    claimed: quests.filter(q => q.status === 'claimed').length,
    expired: quests.filter(q => q.status === 'expired').length,
  };
}

/** Check if all daily quests are claimed */
export function allQuestsClaimed(quests: ActiveQuest[]): boolean {
  return quests.length > 0 && quests.every(q => q.status === 'claimed');
}
