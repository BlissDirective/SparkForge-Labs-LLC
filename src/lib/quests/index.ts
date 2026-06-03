// ════════════════════════════════════════════════════
// Quest Engine Barrel Export
// ════════════════════════════════════════════════════

export {
  // Constants
  RARITY_MULTIPLIER,
  RARITY_COLORS,
  RARITY_GLOW,
  DIFFICULTY_SLOTS,
  QUEST_TEMPLATES,
  WEEKLY_CHAIN_TEMPLATES,

  // Core functions
  selectDailyQuests,
  activateQuest,
  updateQuestProgress,
  claimQuestReward,
  getQuestProgressPercent,
  createWeeklyChain,
  advanceChainStep,
  getQuestGreeting,
  countQuestsByStatus,
  allQuestsClaimed,
} from './QuestEngine';

export type {
  QuestRarity,
  QuestType,
  QuestDifficulty,
  QuestStatus,
  QuestTemplate,
  ActiveQuest,
  WeeklyQuestChain,
  QuestChainStep,
  QuestReward,
} from './QuestEngine';
