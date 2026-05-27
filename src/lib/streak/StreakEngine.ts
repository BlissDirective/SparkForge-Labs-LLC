// ════════════════════════════════════════════════════
// STREAK ENGINE v2 — Retention Mechanics Core
// Based on Duolingo's proven streak system with adaptations
// for COPPA-compliant children's education
// ════════════════════════════════════════════════════

// ═══ TYPES ═══

/** A single day's activity record for calendar display */
export interface StreakDay {
  date: string; // YYYY-MM-DD
  active: boolean;
  xpEarned: number;
  gamesPlayed: number;
  freezeUsed: boolean;
  wagerActive: boolean;
}

/** Wager a child can place on their streak */
export interface StreakWager {
  id: string;
  childId: string;
  wagerType: '7-day' | '14-day';
  gemsBet: number; // 0 for free wagers
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'active' | 'completed' | 'failed' | 'claimed';
  daysMaintained: number;
  rewardGems: number; // 50 for 7-day, 100 for 14-day
  createdAt: string;
}

/** Freeze inventory item */
export interface StreakFreeze {
  id: string;
  childId: string;
  equipped: boolean; // Only equipped freezes auto-apply
  consumed: boolean;
  consumedDate: string | null;
  source: '7-day-milestone' | '14-day-milestone' | '30-day-reward' | 'purchase';
  createdAt: string;
}

/** Complete streak state for a child */
export interface StreakState {
  streakCount: number;
  longestStreak: number;
  streakLastDate: string | null; // YYYY-MM-DD of last activity
  streakStartedDate: string | null; // YYYY-MM-DD when current streak began
  freezesAvailable: number; // Unequipped freezes in inventory
  freezesEquipped: number; // Equipped and ready to auto-apply
  totalFreezesEarned: number; // Lifetime stat
  activeWager: StreakWager | null;
  wagerHistory: StreakWager[];
  isStreakSocietyMember: boolean;
  societyJoinedAt: string | null;
  last30Days: StreakDay[];
  nextMilestone: StreakMilestone | null;
  daysUntilMilestone: number;
}

/** A streak milestone with reward */
export interface StreakMilestone {
  day: number;
  rewardType: 'freeze' | 'gems' | 'society' | 'title' | 'chest';
  rewardValue: number; // gems amount, freeze count, or 0 for title/society
  title?: string;
  description: string;
}

/** Activity result from processing a day's activity */
export interface StreakActivityResult {
  streakCount: number;
  streakIncreased: boolean;
  streakBroken: boolean;
  freezeConsumed: boolean;
  freezeEquipped: boolean;
  newMilestoneReached: StreakMilestone | null;
  wagerStatus: 'active' | 'completed' | 'failed' | 'unchanged';
  wagerReward: number; // Gems earned from wager
  xpMultiplier: number; // Streak-based XP multiplier
  message: string;
  isNewStreak: boolean;
}

// ═══ CONSTANTS ═══

/** Streak milestones — rewards at these day counts */
export const STREAK_MILESTONES: StreakMilestone[] = [
  { day: 1,  rewardType: 'gems',  rewardValue: 10,  description: 'First day! Welcome to the streak!' },
  { day: 3,  rewardType: 'gems',  rewardValue: 20,  description: '3-day streak bonus!' },
  { day: 7,  rewardType: 'freeze', rewardValue: 1,  title: 'Streak Society Initiate', description: '7-day streak! First freeze earned + Society access!' },
  { day: 10, rewardType: 'gems',  rewardValue: 30,  description: '10 days strong!' },
  { day: 14, rewardType: 'freeze', rewardValue: 1,  title: 'Streak Keeper', description: '14 days! Second freeze earned!' },
  { day: 21, rewardType: 'gems',  rewardValue: 50,  description: '3 weeks! Amazing dedication!' },
  { day: 30, rewardType: 'chest', rewardValue: 100, title: 'Streak Society Member', description: '30 days! Big gem chest + exclusive title!' },
  { day: 50, rewardType: 'gems',  rewardValue: 75,  description: '50 days! Halfway to legendary!' },
  { day: 60, rewardType: 'freeze', rewardValue: 2,  title: 'Streak Master', description: '60 days! Two freezes + legendary status!' },
  { day: 100, rewardType: 'chest', rewardValue: 250, title: 'Streak Centurion', description: '100 days! Massive reward — you are unstoppable!' },
  { day: 180, rewardType: 'gems', rewardValue: 150, description: '6 months of learning!' },
  { day: 365, rewardType: 'chest', rewardValue: 500, title: 'Streak Legend', description: '1 FULL YEAR! The ultimate achievement!' },
];

/** Wager configurations */
export const WAGER_CONFIG = {
  '7-day': { daysRequired: 7, rewardGems: 50, gemsBet: 0 },
  '14-day': { daysRequired: 14, rewardGems: 100, gemsBet: 0 },
} as const;

/** XP multiplier based on streak count */
export function getStreakMultiplier(streakCount: number): number {
  if (streakCount >= 30) return 2.0;
  if (streakCount >= 14) return 1.75;
  if (streakCount >= 7) return 1.5;
  if (streakCount >= 3) return 1.25;
  return 1.0;
}

/** Society benefits based on streak tier */
export function getSocietyBenefits(streakCount: number): {
  xpBonusPercent: number;
  gemBonusPercent: number;
  dailyGemReward: number;
  title: string;
} {
  if (streakCount >= 365) return { xpBonusPercent: 50, gemBonusPercent: 50, dailyGemReward: 10, title: 'Eternal Flame' };
  if (streakCount >= 100) return { xpBonusPercent: 40, gemBonusPercent: 40, dailyGemReward: 7, title: 'Diamond Member' };
  if (streakCount >= 60) return { xpBonusPercent: 30, gemBonusPercent: 30, dailyGemReward: 5, title: 'Platinum Member' };
  if (streakCount >= 30) return { xpBonusPercent: 20, gemBonusPercent: 20, dailyGemReward: 3, title: 'Gold Member' };
  if (streakCount >= 14) return { xpBonusPercent: 10, gemBonusPercent: 10, dailyGemReward: 2, title: 'Silver Member' };
  if (streakCount >= 7) return { xpBonusPercent: 5, gemBonusPercent: 5, dailyGemReward: 1, title: 'Bronze Member' };
  return { xpBonusPercent: 0, gemBonusPercent: 0, dailyGemReward: 0, title: '' };
}

// ═══ DATE HELPERS ═══

/** Get today's date as YYYY-MM-DD in UTC */
export function getTodayUTC(): string {
  return new Date().toISOString().split('T')[0];
}

/** Get the date N days ago as YYYY-MM-DD */
export function getDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().split('T')[0];
}

/** Calculate days between two date strings (YYYY-MM-DD) */
export function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

/** Check if two dates are consecutive (b is the day after a) */
export function isConsecutiveDay(previous: string | null, current: string): boolean {
  if (!previous) return false;
  return daysBetween(previous, current) === 1;
}

/** Check if there's exactly a 1-day gap (missed one day) */
export function hasOneDayGap(previous: string | null, current: string): boolean {
  if (!previous) return false;
  return daysBetween(previous, current) === 2;
}

// ═══ STREAK PROCESSING ═══

/**
 * Process daily activity and update streak state.
 * This is the CORE function — idempotent, safe to call multiple times per day.
 * Returns the result without mutating the input state.
 */
export function processDailyActivity(
  state: StreakState,
  today: string = getTodayUTC(),
): StreakActivityResult {
  const result: StreakActivityResult = {
    streakCount: state.streakCount,
    streakIncreased: false,
    streakBroken: false,
    freezeConsumed: false,
    freezeEquipped: state.freezesEquipped > 0,
    newMilestoneReached: null,
    wagerStatus: 'unchanged',
    wagerReward: 0,
    xpMultiplier: getStreakMultiplier(state.streakCount),
    message: '',
    isNewStreak: false,
  };

  // Already active today — return current state unchanged
  if (state.streakLastDate === today) {
    result.message = 'Already active today! Great job!';
    return result;
  }

  // Calculate days since last activity
  let newStreak = state.streakCount;
  let freezeConsumed = false;

  if (!state.streakLastDate) {
    // First ever activity
    newStreak = 1;
    result.isNewStreak = true;
    result.message = 'First day! Your streak begins!';
  } else {
    const gap = daysBetween(state.streakLastDate, today);

    if (gap === 1) {
      // Consecutive day — streak continues
      newStreak += 1;
      result.streakIncreased = true;
      result.message = `Streak up to ${newStreak} days! Keep it going!`;
    } else if (gap === 2 && state.freezesEquipped > 0) {
      // Missed one day but freeze equipped — streak saved!
      newStreak += 1; // Still counts as continuing (freeze bridges the gap)
      freezeConsumed = true;
      result.streakIncreased = true;
      result.freezeConsumed = true;
      result.message = 'Streak freeze saved you! Your streak continues!';
    } else {
      // Streak broken — reset to 1
      newStreak = 1;
      result.streakBroken = true;
      result.isNewStreak = true;
      result.message = gap > 2
        ? `You were away for ${gap} days. Starting fresh — day 1!`
        : 'Streak reset, but every expert was once a beginner! Day 1!';
    }
  }

  result.streakCount = newStreak;
  result.xpMultiplier = getStreakMultiplier(newStreak);

  // Check for milestone
  const milestone = STREAK_MILESTONES.find(m => m.day === newStreak);
  if (milestone) {
    result.newMilestoneReached = milestone;
  }

  // Evaluate active wager
  if (state.activeWager) {
    const wager = state.activeWager;
    const config = WAGER_CONFIG[wager.wagerType];
    const daysSinceStart = daysBetween(wager.startDate, today) + 1;

    if (result.streakBroken) {
      // Wager failed — streak broken means wager lost
      result.wagerStatus = 'failed';
      result.message += ' Your wager was not successful.';
    } else if (daysSinceStart >= config.daysRequired) {
      // Wager completed successfully!
      result.wagerStatus = 'completed';
      result.wagerReward = config.rewardGems;
      result.message += ` Wager complete! +${config.rewardGems} gems!`;
    } else {
      // Wager still active
      result.wagerStatus = 'active';
      const daysRemaining = config.daysRequired - daysSinceStart;
      result.message += ` Wager: ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} to go!`;
    }
  }

  return result;
}

// ═══ FREEZE MANAGEMENT ═══

/** Equip a freeze for auto-protection (must call before the missed day) */
export function equipFreeze(state: StreakState): { success: boolean; message: string } {
  if (state.freezesAvailable <= 0) {
    return { success: false, message: 'No freezes available. Keep your streak to earn more!' };
  }
  if (state.freezesEquipped >= 2) {
    return { success: false, message: 'You can only equip 2 freezes at a time!' };
  }
  return { success: true, message: 'Freeze equipped! You are protected for one missed day.' };
}

/** Unequip a freeze (return to inventory) */
export function unequipFreeze(state: StreakState): { success: boolean; message: string } {
  if (state.freezesEquipped <= 0) {
    return { success: false, message: 'No equipped freezes to remove.' };
  }
  return { success: true, message: 'Freeze returned to inventory.' };
}

/** Calculate freezes earned from milestone rewards */
export function calculateFreezeRegeneration(
  currentStreak: number,
  previousMilestoneClaimed: number,
): number {
  let freezes = 0;
  for (const milestone of STREAK_MILESTONES) {
    if (milestone.rewardType === 'freeze' && milestone.day <= currentStreak && milestone.day > previousMilestoneClaimed) {
      freezes += milestone.rewardValue;
    }
  }
  return freezes;
}

// ═══ WAGER MANAGEMENT ═══

/** Place a new streak wager */
export function placeWager(
  state: StreakState,
  wagerType: '7-day' | '14-day',
  today: string = getTodayUTC(),
): { success: boolean; wager?: StreakWager; message: string } {
  // Cannot place wager if streak is 0 or broken
  if (state.streakCount < 1) {
    return { success: false, message: 'Start a streak first before placing a wager!' };
  }

  // Cannot place wager if one is already active
  if (state.activeWager && state.activeWager.status === 'active') {
    return { success: false, message: 'You already have an active wager. Complete it first!' };
  }

  // Cannot place 14-day wager without at least 14-day streak history
  if (wagerType === '14-day' && state.longestStreak < 14) {
    return { success: false, message: 'Reach a 14-day streak first to unlock 14-day wagers!' };
  }

  const config = WAGER_CONFIG[wagerType];
  const wager: StreakWager = {
    id: `wager-${today}-${wagerType}`,
    childId: '', // Set by caller
    wagerType,
    gemsBet: config.gemsBet,
    startDate: today,
    endDate: getEndDate(today, config.daysRequired),
    status: 'active',
    daysMaintained: 0,
    rewardGems: config.rewardGems,
    createdAt: today,
  };

  return {
    success: true,
    wager,
    message: `${wagerType} wager placed! Maintain your streak for ${config.daysRequired} days to win ${config.rewardGems} gems!`,
  };
}

/** Get the end date for a wager */
function getEndDate(startDate: string, daysRequired: number): string {
  const d = new Date(startDate);
  d.setUTCDate(d.getUTCDate() + daysRequired - 1);
  return d.toISOString().split('T')[0];
}

/** Check if a wager has been completed and can be claimed */
export function canClaimWager(wager: StreakWager, currentStreak: number, today: string): boolean {
  if (wager.status !== 'active' && wager.status !== 'completed') return false;
  const config = WAGER_CONFIG[wager.wagerType];
  const daysSinceStart = daysBetween(wager.startDate, today) + 1;
  return currentStreak >= daysSinceStart && daysSinceStart >= config.daysRequired;
}

// ═══ CALENDAR GENERATION ═══

/** Generate 30-day streak calendar for display */
export function generateStreakCalendar(
  last30Days: StreakDay[],
  streakCount: number,
  streakLastDate: string | null,
  today: string = getTodayUTC(),
): (StreakDay & { isToday: boolean; isFuture: boolean; partOfStreak: boolean })[] {
  const result = [];

  for (let i = 29; i >= 0; i--) {
    const date = getDaysAgo(i);
    const existing = last30Days.find(d => d.date === date);
    const isToday = date === today;
    const isFuture = date > today;

    // A day is part of the current streak if it's within the streak window
    let partOfStreak = false;
    if (streakLastDate && streakCount > 0 && !isFuture) {
      const daysFromLast = daysBetween(date, streakLastDate);
      partOfStreak = daysFromLast >= 0 && daysFromLast < streakCount;
    }

    if (existing) {
      result.push({ ...existing, isToday, isFuture, partOfStreak });
    } else {
      result.push({
        date,
        active: false,
        xpEarned: 0,
        gamesPlayed: 0,
        freezeUsed: false,
        wagerActive: false,
        isToday,
        isFuture,
        partOfStreak,
      });
    }
  }

  return result;
}

// ═══ MILESTONE HELPERS ═══

/** Get the next upcoming milestone */
export function getNextMilestone(currentStreak: number): StreakMilestone | null {
  return STREAK_MILESTONES.find(m => m.day > currentStreak) || null;
}

/** Get days until next milestone */
export function getDaysUntilNextMilestone(currentStreak: number): number {
  const next = getNextMilestone(currentStreak);
  if (!next) return 0;
  return next.day - currentStreak;
}

/** Get all milestones up to and including the current streak */
export function getReachedMilestones(currentStreak: number): StreakMilestone[] {
  return STREAK_MILESTONES.filter(m => m.day <= currentStreak);
}

// ═══ STREAK MESSAGES ═══

/** Get a motivational message based on streak state */
export function getStreakMotivationMessage(streakCount: number, isAtRisk: boolean): string {
  if (isAtRisk) {
    const messages = [
      'Your streak is at risk! Do one activity today to keep it alive!',
      'Don\'t let your streak slip! One quick game is all it takes!',
      '⚠️ Streak alert! Spend 5 minutes to save your progress!',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  if (streakCount >= 365) {
    return 'Legendary! A full year of learning. You are unstoppable!';
  }
  if (streakCount >= 100) {
    return '100+ days! You are in the elite tier. Keep the fire burning!';
  }
  if (streakCount >= 60) {
    return '60 days! Your dedication is incredible. Push for 100!';
  }
  if (streakCount >= 30) {
    return '30-day club member! Your consistency is paying off!';
  }
  if (streakCount >= 14) {
    return 'Two weeks strong! The Streak Society welcomes you!';
  }
  if (streakCount >= 7) {
    return 'One week! You\'ve earned your first freeze. Keep going!';
  }
  if (streakCount >= 3) {
    return 'Building momentum! Come back tomorrow for more rewards!';
  }
  if (streakCount >= 1) {
    return 'Great start! Come back tomorrow to build your streak!';
  }
  return 'Start your streak today! Every expert was once a beginner.';
}

/** Check if streak is at risk (no activity today and past 8 PM UTC) */
export function isStreakAtRisk(streakLastDate: string | null, today: string = getTodayUTC()): boolean {
  if (!streakLastDate) return false; // No streak yet, not at risk
  if (streakLastDate === today) return false; // Already active today

  const now = new Date();
  const hoursUTC = now.getUTCHours();

  // Consider at risk if it's after 8 PM UTC and they haven't been active
  if (hoursUTC >= 20) {
    const gap = daysBetween(streakLastDate, today);
    return gap >= 1; // Missed at least one day
  }

  return false;
}

// ═══ STREAK RISK PREDICTION ═══

/** Predict streak risk based on activity patterns */
export function predictStreakRisk(
  last7Days: boolean[], // true = active that day
): 'low' | 'medium' | 'high' {
  const activeDays = last7Days.filter(Boolean).length;

  if (activeDays >= 6) return 'low';      // Very consistent
  if (activeDays >= 4) return 'medium';   // Moderate consistency
  if (activeDays >= 2) return 'high';     // Inconsistent — likely to break
  return 'high';                          // Barely active — very high risk
}

// ═══ WEEKLY SUMMARY ═══

export interface WeeklyStreakSummary {
  weekStarting: string;
  daysActive: number;
  totalXp: number;
  totalGames: number;
  streakMaintained: boolean;
  freezesUsed: number;
  wagersCompleted: number;
  gemsEarned: number;
}

/** Generate weekly summary from streak history */
export function generateWeeklySummary(
  days: StreakDay[],
  weekStarting: string,
): WeeklyStreakSummary {
  const weekDays = days.filter(d => d.date >= weekStarting && d.date < getEndDate(weekStarting, 7));

  return {
    weekStarting,
    daysActive: weekDays.filter(d => d.active).length,
    totalXp: weekDays.reduce((sum, d) => sum + d.xpEarned, 0),
    totalGames: weekDays.reduce((sum, d) => sum + d.gamesPlayed, 0),
    streakMaintained: weekDays.every(d => d.active),
    freezesUsed: weekDays.filter(d => d.freezeUsed).length,
    wagersCompleted: weekDays.filter(d => d.wagerActive).length,
    gemsEarned: 0, // Populated by caller with gem data
  };
}
