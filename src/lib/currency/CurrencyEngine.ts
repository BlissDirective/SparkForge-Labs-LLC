// ════════════════════════════════════════════════════
// CURRENCY ENGINE — Gem Economy
// Virtual currency for children's education app
// COPPA-safe: no real money purchases, gems earned through learning
// ════════════════════════════════════════════════════

// ═══ TYPES ═══

export interface CurrencyWallet {
  childId: string;
  gems: number;
  gemsEarnedLifetime: number;
  gemsSpentLifetime: number;
  streakFreezesOwned: number;
  streakFreezesEquipped: number;
  lastDailyReward: string | null; // YYYY-MM-DD
  dailyRewardStreak: number; // Consecutive days of claiming daily reward
}

export interface CurrencyTransaction {
  id: string;
  childId: string;
  type: CurrencyTransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  sourceId?: string; // Related entity ID (badge ID, wager ID, etc.)
  createdAt: string;
}

export type CurrencyTransactionType =
  | 'streak_milestone'    // Gems from streak milestones
  | 'wager_win'           // Gems from winning a wager
  | 'daily_reward'        // Daily login bonus
  | 'badge_earned'        // Gems from earning a badge
  | 'level_up'            // Gems from leveling up
  | 'game_complete'       // Gems from completing a game
  | 'quest_complete'      // Gems from completing a quest
  | 'purchase_freeze'     // Spent gems to buy a freeze
  | 'wager_entry'         // Entry fee for wager (0 for free wagers)
  | 'spent_cosmetic'      // Spent on cosmetic items
  | 'admin_grant'         // Manual admin grant
  | 'event_reward';       // Special event rewards

export interface DailyReward {
  day: number; // 1-7 for weekly cycle
  gems: number;
  bonusFreeze: boolean;
  description: string;
}

export interface TransactionResult {
  success: boolean;
  wallet: CurrencyWallet;
  transaction?: CurrencyTransaction;
  message: string;
}

// ═══ CONSTANTS ═══

/** Daily login rewards — escalating weekly cycle */
export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, gems: 5,  bonusFreeze: false, description: 'Day 1 — Welcome back!' },
  { day: 2, gems: 10, bonusFreeze: false, description: 'Day 2 — Building momentum!' },
  { day: 3, gems: 15, bonusFreeze: false, description: 'Day 3 — Triple reward!' },
  { day: 4, gems: 20, bonusFreeze: false, description: 'Day 4 — Great consistency!' },
  { day: 5, gems: 30, bonusFreeze: false, description: 'Day 5 — Almost there!' },
  { day: 6, gems: 40, bonusFreeze: false, description: 'Day 6 — So close to the bonus!' },
  { day: 7, gems: 50, bonusFreeze: true,  description: 'Day 7 — Weekly bonus! +1 Freeze!' },
];

/** Gem rewards for level ups */
export const LEVEL_UP_GEMS: Record<number, number> = {
  0: 10,  // Levels 1-5
  5: 20,  // Levels 6-10
  10: 30, // Levels 11-15
  15: 40, // Levels 16-20
  20: 50, // Levels 21-30
  30: 75, // Levels 31-40
  40: 100, // Levels 41-50
};

/** Gem cost for items */
export const GEM_COSTS = {
  STREAK_FREEZE: 50,
  WAGER_ENTRY_7_DAY: 0,   // Free!
  WAGER_ENTRY_14_DAY: 0,  // Free!
  NAME_CHANGE: 100,
  COSMETIC_COMMON: 25,
  COSMETIC_UNCOMMON: 50,
  COSMETIC_RARE: 100,
  COSMETIC_EPIC: 250,
  COSMETIC_LEGENDARY: 500,
} as const;

/** Game completion gem rewards */
export const GAME_COMPLETION_GEMS = {
  easy: 5,
  medium: 10,
  hard: 15,
  perfect_score: 25, // Bonus for 100%
} as const;

// ═══ PURE FUNCTIONS ═══

/** Get daily reward for a given day in the weekly cycle */
export function getDailyReward(dayInCycle: number): DailyReward {
  const index = Math.max(0, Math.min(6, dayInCycle - 1));
  return DAILY_REWARDS[index];
}

/** Get gems rewarded for leveling up */
export function getLevelUpGems(newLevel: number): number {
  const thresholds = Object.keys(LEVEL_UP_GEMS).map(Number).sort((a, b) => b - a);
  for (const threshold of thresholds) {
    if (newLevel >= threshold) return LEVEL_UP_GEMS[threshold];
  }
  return 10;
}

/** Get gems for completing a game */
export function getGameCompletionGems(
  difficulty: 'easy' | 'medium' | 'hard',
  scorePercent: number,
  streakMultiplier: number,
): number {
  const baseGems = GAME_COMPLETION_GEMS[difficulty];
  const perfectBonus = scorePercent >= 100 ? GAME_COMPLETION_GEMS.perfect_score : 0;
  const total = baseGems + perfectBonus;

  // Apply streak multiplier (from streak engine)
  const societyBonus = streakMultiplier > 1 ? Math.floor(total * (streakMultiplier - 1) * 0.5) : 0;

  return total + societyBonus;
}

/** Check if a daily reward can be claimed */
export function canClaimDailyReward(
  wallet: CurrencyWallet,
  today: string = getTodayUTC(),
): boolean {
  if (!wallet.lastDailyReward) return true;
  return wallet.lastDailyReward !== today;
}

/** Calculate the next daily reward day in cycle */
export function getNextDailyRewardDay(wallet: CurrencyWallet): number {
  return Math.min(7, wallet.dailyRewardStreak + 1);
}

/** Claim daily reward */
export function claimDailyReward(
  wallet: CurrencyWallet,
  today: string = getTodayUTC(),
): TransactionResult {
  if (!canClaimDailyReward(wallet, today)) {
    return {
      success: false,
      wallet,
      message: 'Daily reward already claimed today! Come back tomorrow!',
    };
  }

  // Check if streak continues (claimed yesterday) or resets
  const yesterday = getDaysAgo(1);
  const streakContinues = wallet.lastDailyReward === yesterday;
  const newStreak = streakContinues ? wallet.dailyRewardStreak + 1 : 1;
  const rewardDay = Math.min(7, newStreak);
  const reward = getDailyReward(rewardDay);

  const newGems = wallet.gems + reward.gems;
  const newFreezes = reward.bonusFreeze
    ? wallet.streakFreezesOwned + 1
    : wallet.streakFreezesOwned;

  const newWallet: CurrencyWallet = {
    ...wallet,
    gems: newGems,
    gemsEarnedLifetime: wallet.gemsEarnedLifetime + reward.gems,
    streakFreezesOwned: newFreezes,
    lastDailyReward: today,
    dailyRewardStreak: newStreak,
  };

  const transaction: CurrencyTransaction = {
    id: `daily-${today}`,
    childId: wallet.childId,
    type: 'daily_reward',
    amount: reward.gems,
    balanceAfter: newGems,
    description: reward.description,
    createdAt: today,
  };

  return {
    success: true,
    wallet: newWallet,
    transaction,
    message: streakContinues
      ? `${reward.description} +${reward.gems} gems!`
      : `Daily streak reset, but you got +${reward.gems} gems! Keep it up!`,
  };
}

/** Award gems for any reason */
export function awardGems(
  wallet: CurrencyWallet,
  amount: number,
  type: CurrencyTransactionType,
  description: string,
  sourceId?: string,
  today: string = getTodayUTC(),
): TransactionResult {
  if (amount <= 0) {
    return { success: false, wallet, message: 'Invalid gem amount' };
  }

  const newGems = wallet.gems + amount;
  const newWallet: CurrencyWallet = {
    ...wallet,
    gems: newGems,
    gemsEarnedLifetime: wallet.gemsEarnedLifetime + amount,
  };

  const transaction: CurrencyTransaction = {
    id: `txn-${type}-${today}-${Date.now()}`,
    childId: wallet.childId,
    type,
    amount,
    balanceAfter: newGems,
    description,
    sourceId,
    createdAt: today,
  };

  return {
    success: true,
    wallet: newWallet,
    transaction,
    message: `+${amount} gems! ${description}`,
  };
}

/** Spend gems (deduct from wallet) */
export function spendGems(
  wallet: CurrencyWallet,
  amount: number,
  type: CurrencyTransactionType,
  description: string,
  today: string = getTodayUTC(),
): TransactionResult {
  if (amount <= 0) {
    return { success: false, wallet, message: 'Invalid gem amount' };
  }
  if (wallet.gems < amount) {
    return {
      success: false,
      wallet,
      message: `Not enough gems! You have ${wallet.gems} but need ${amount}.`,
    };
  }

  const newGems = wallet.gems - amount;
  const newWallet: CurrencyWallet = {
    ...wallet,
    gems: newGems,
    gemsSpentLifetime: wallet.gemsSpentLifetime + amount,
  };

  const transaction: CurrencyTransaction = {
    id: `txn-${type}-${today}-${Date.now()}`,
    childId: wallet.childId,
    type,
    amount: -amount,
    balanceAfter: newGems,
    description,
    createdAt: today,
  };

  return {
    success: true,
    wallet: newWallet,
    transaction,
    message: `-${amount} gems spent on ${description}`,
  };
}

/** Purchase a streak freeze with gems */
export function purchaseFreeze(wallet: CurrencyWallet): TransactionResult {
  return spendGems(
    wallet,
    GEM_COSTS.STREAK_FREEZE,
    'purchase_freeze',
    'Streak Freeze purchased',
  );
}

/** Award gems for streak milestone — caller passes milestone data to avoid circular deps */
export function awardStreakMilestoneGems(
  wallet: CurrencyWallet,
  streakDay: number,
  gemReward: number, // Pass the gem amount from caller who knows the milestone
  today: string = getTodayUTC(),
): TransactionResult {
  if (gemReward <= 0) {
    return { success: false, wallet, message: 'No gem reward at this milestone' };
  }

  return awardGems(
    wallet,
    gemReward,
    'streak_milestone',
    `${streakDay}-day streak milestone!`,
    `milestone-${streakDay}`,
    today,
  );
}

// ═══ DATE HELPERS ═══

function getTodayUTC(): string {
  return new Date().toISOString().split('T')[0];
}

function getDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().split('T')[0];
}
