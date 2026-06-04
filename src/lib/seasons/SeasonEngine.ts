// ════════════════════════════════════════════════════════════════════════
// SEASON ENGINE — Phase 9: Seasonal Content Engine
// ════════════════════════════════════════════════════════════════════════
// Limited-time seasonal events: themed quest lines, a seasonal shop with
// event-only currency, and a season completion tracker with a grand prize.
//
// The season/quest/item CATALOG lives here (runtime source of truth, so the
// UI works without DB seeding). The database stores only per-child state
// (season_progress, season_purchases) and the activation flags (seasons).
// ════════════════════════════════════════════════════════════════════════

// ─── Types ───────────────────────────────────────────────────────────────

export interface Season {
  key: string;
  name: string;
  theme: string;
  emoji: string;
  /** Inclusive start, as "MM-DD" (recurs annually). */
  startMMDD: string;
  /** Inclusive end, as "MM-DD". */
  endMMDD: string;
  /** Accent color for banners/cards. */
  color: string;
  /** Name of the seasonal currency (e.g. "Sun Shards"). */
  currencyName: string;
  currencyEmoji: string;
  /** Grand prize unlocked when all seasonal quests are complete. */
  grandPrize: { name: string; emoji: string };
}

export type SeasonalItemType = 'sparky_accessory' | 'pet_accessory' | 'background' | 'badge';

export interface SeasonalItem {
  id: string;
  seasonKey: string;
  name: string;
  emoji: string;
  type: SeasonalItemType;
  cost: number; // in seasonal currency
  /** Week of the season the item becomes available (1-based). Items rotate weekly. */
  weekAvailable: number;
}

export interface SeasonalQuest {
  id: string;
  seasonKey: string;
  order: number;
  title: string;
  description: string;
  emoji: string;
  requirementCount: number;
  /** Progress metric the quest tracks. */
  metric: SeasonalQuestMetric;
  xpReward: number;
  currencyReward: number;
}

export type SeasonalQuestMetric =
  | 'games_played'
  | 'quests_completed'
  | 'labs_completed'
  | 'streak_days'
  | 'buddy_quests';

export interface SeasonProgress {
  seasonKey: string;
  childId: string;
  /** Seasonal currency balance (earned only during the event). */
  currency: number;
  /** Per-quest progress counters, keyed by quest id. */
  questProgress: Record<string, number>;
  /** Quest ids whose reward has been claimed. */
  claimedQuests: string[];
  /** Item ids the child has purchased this season. */
  purchases: string[];
  grandPrizeClaimed: boolean;
}

// ─── Season Calendar (recurs annually) ──────────────────────────────────

export const SEASONS: Season[] = [
  {
    key: 'winter-festival', name: 'Winter Festival', theme: 'Winter Code Wonderland', emoji: '❄️',
    startMMDD: '01-01', endMMDD: '01-31', color: '#5EC8F5', currencyName: 'Snowflakes', currencyEmoji: '❄️',
    grandPrize: { name: 'Frost Crown for Sparky', emoji: '👑' },
  },
  {
    key: 'valentines', name: "Hearts & Algorithms", theme: 'Hearts & Algorithms', emoji: '💝',
    startMMDD: '02-01', endMMDD: '02-14', color: '#FF6B9D', currencyName: 'Heart Tokens', currencyEmoji: '💖',
    grandPrize: { name: 'Cupid Wings for Pet', emoji: '🪽' },
  },
  {
    key: 'spring-bloom', name: 'Spring Bloom', theme: 'Garden of Knowledge', emoji: '🌸',
    startMMDD: '03-15', endMMDD: '04-15', color: '#7ED957', currencyName: 'Petals', currencyEmoji: '🌸',
    grandPrize: { name: 'Blooming Garden Background', emoji: '🌷' },
  },
  {
    key: 'summer-explorer', name: 'Summer Explorer', theme: 'Summer AI Adventure', emoji: '🏖️',
    startMMDD: '06-01', endMMDD: '08-15', color: '#FFB627', currencyName: 'Sun Shards', currencyEmoji: '☀️',
    grandPrize: { name: 'Explorer Hat for Sparky', emoji: '🧭' },
  },
  {
    key: 'back-to-school', name: 'Back to School', theme: 'Code Academy', emoji: '🎒',
    startMMDD: '09-01', endMMDD: '09-30', color: '#4F6EF7', currencyName: 'Gold Stars', currencyEmoji: '⭐',
    grandPrize: { name: 'Graduation Cap for Sparky', emoji: '🎓' },
  },
  {
    key: 'halloween', name: 'Spooky Circuits', theme: 'Spooky Circuits', emoji: '🎃',
    startMMDD: '10-15', endMMDD: '10-31', color: '#FF7518', currencyName: 'Candy Bits', currencyEmoji: '🍬',
    grandPrize: { name: 'Ghost Costume for Pet', emoji: '👻' },
  },
  {
    key: 'holiday', name: 'Winter AI Festival', theme: 'Winter AI Festival', emoji: '🎁',
    startMMDD: '12-01', endMMDD: '12-31', color: '#E63946', currencyName: 'Gift Tokens', currencyEmoji: '🎁',
    grandPrize: { name: 'Festive Sleigh Background', emoji: '🛷' },
  },
];

const SEASON_INDEX: Record<string, Season> = Object.fromEntries(SEASONS.map((s) => [s.key, s]));

// ─── Active-season resolution ────────────────────────────────────────────

function mmddToNum(mmdd: string): number {
  const [m, d] = mmdd.split('-').map(Number);
  return m * 100 + d;
}

/** The season whose annual date range contains `date`, or null (off-season). */
export function getActiveSeason(date: Date = new Date()): Season | null {
  const cur = (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
  for (const s of SEASONS) {
    const start = mmddToNum(s.startMMDD);
    const end = mmddToNum(s.endMMDD);
    // No season in our calendar wraps the year boundary, so a simple
    // inclusive range check is sufficient.
    if (cur >= start && cur <= end) return s;
  }
  return null;
}

export function getSeason(key: string): Season | null {
  return SEASON_INDEX[key] ?? null;
}

/** 1-based week index within the active season (for weekly shop rotation). */
export function getSeasonWeek(season: Season, date: Date = new Date()): number {
  const year = date.getUTCFullYear();
  const [sm, sd] = season.startMMDD.split('-').map(Number);
  const start = Date.UTC(year, sm - 1, sd);
  const days = Math.floor((date.getTime() - start) / 86_400_000);
  return Math.max(1, Math.floor(days / 7) + 1);
}

// ─── Seasonal Quest Chains ───────────────────────────────────────────────

/** Generate a 5-step themed quest chain for a season. */
function questChain(seasonKey: string): SeasonalQuest[] {
  const specs: Array<{ title: string; description: string; emoji: string; metric: SeasonalQuestMetric; req: number }> = [
    { title: 'Warm Up', description: 'Play 3 games', emoji: '🎮', metric: 'games_played', req: 3 },
    { title: 'Daily Devotion', description: 'Complete 5 daily quests', emoji: '✅', metric: 'quests_completed', req: 5 },
    { title: 'Lab Adventurer', description: 'Finish 3 lab games', emoji: '🔬', metric: 'labs_completed', req: 3 },
    { title: 'On Fire', description: 'Reach a 5-day streak', emoji: '🔥', metric: 'streak_days', req: 5 },
    { title: 'Season Finale', description: 'Play 10 games total', emoji: '🏆', metric: 'games_played', req: 10 },
  ];
  return specs.map((s, i) => ({
    id: `${seasonKey}-q${i + 1}`,
    seasonKey,
    order: i + 1,
    title: s.title,
    description: s.description,
    emoji: s.emoji,
    requirementCount: s.req,
    metric: s.metric,
    xpReward: 50 + i * 25,
    currencyReward: 20 + i * 10,
  }));
}

export function getSeasonalQuests(seasonKey: string): SeasonalQuest[] {
  if (!SEASON_INDEX[seasonKey]) return [];
  return questChain(seasonKey);
}

// ─── Seasonal Shop ───────────────────────────────────────────────────────

/** Generate a rotating shop (6 items across 3 weeks) for a season. */
export function getSeasonalItems(seasonKey: string): SeasonalItem[] {
  const s = SEASON_INDEX[seasonKey];
  if (!s) return [];
  const defs: Array<{ name: string; emoji: string; type: SeasonalItemType; cost: number; week: number }> = [
    { name: `${s.name} Hat`, emoji: '🎩', type: 'sparky_accessory', cost: 30, week: 1 },
    { name: `${s.name} Scarf`, emoji: '🧣', type: 'sparky_accessory', cost: 40, week: 1 },
    { name: `${s.name} Pet Bow`, emoji: '🎀', type: 'pet_accessory', cost: 50, week: 2 },
    { name: `${s.name} Background`, emoji: '🖼️', type: 'background', cost: 80, week: 2 },
    { name: `${s.name} Badge`, emoji: '🏅', type: 'badge', cost: 60, week: 3 },
    { name: `${s.name} Crown`, emoji: '👑', type: 'sparky_accessory', cost: 120, week: 3 },
  ];
  return defs.map((d, i) => ({
    id: `${seasonKey}-item${i + 1}`,
    seasonKey,
    name: d.name,
    emoji: d.emoji,
    type: d.type,
    cost: d.cost,
    weekAvailable: d.week,
  }));
}

export function isItemAvailable(item: SeasonalItem, currentWeek: number): boolean {
  return currentWeek >= item.weekAvailable;
}

// ─── Progress helpers ────────────────────────────────────────────────────

export function emptyProgress(seasonKey: string, childId: string): SeasonProgress {
  return { seasonKey, childId, currency: 0, questProgress: {}, claimedQuests: [], purchases: [], grandPrizeClaimed: false };
}

export function isQuestComplete(quest: SeasonalQuest, progress: SeasonProgress): boolean {
  return (progress.questProgress[quest.id] ?? 0) >= quest.requirementCount;
}

export function isQuestClaimed(quest: SeasonalQuest, progress: SeasonProgress): boolean {
  return progress.claimedQuests.includes(quest.id);
}

export function canClaimQuest(quest: SeasonalQuest, progress: SeasonProgress): boolean {
  return isQuestComplete(quest, progress) && !isQuestClaimed(quest, progress);
}

/** 0-100 across all quests in the season's chain. */
export function seasonProgressPercent(seasonKey: string, progress: SeasonProgress): number {
  const quests = getSeasonalQuests(seasonKey);
  if (quests.length === 0) return 0;
  const done = quests.filter((q) => isQuestComplete(q, progress)).length;
  return Math.round((done / quests.length) * 100);
}

export function allQuestsComplete(seasonKey: string, progress: SeasonProgress): boolean {
  const quests = getSeasonalQuests(seasonKey);
  return quests.length > 0 && quests.every((q) => isQuestComplete(q, progress));
}

export function canAfford(item: SeasonalItem, progress: SeasonProgress): boolean {
  return progress.currency >= item.cost && !progress.purchases.includes(item.id);
}

export function canClaimGrandPrize(seasonKey: string, progress: SeasonProgress): boolean {
  return allQuestsComplete(seasonKey, progress) && !progress.grandPrizeClaimed;
}

export function getSeasonGreeting(season: Season | null, percent: number): string {
  if (!season) return 'No seasonal event is running right now. Check back soon!';
  if (percent >= 100) return `You completed ${season.name}! Claim your grand prize! ${season.emoji}`;
  if (percent === 0) return `${season.name} is here! Start the quest line to earn ${season.currencyName}.`;
  return `${season.name}: ${percent}% complete. Keep going! ${season.emoji}`;
}
