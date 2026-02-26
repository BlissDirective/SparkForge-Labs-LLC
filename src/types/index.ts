export type AgeBand = 'A' | 'B' | 'C';
export type SubscriptionTier = 'free' | 'plus' | 'forge';
export type ContentType = 'lesson' | 'quiz' | 'game' | 'spark_fact' | 'activity' | 'sandbox';
export type ContentStatus = 'published' | 'pending_review' | 'needs_human_review' | 'rejected' | 'draft';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type BadgeCategory = 'progress' | 'streak' | 'lab' | 'game_master' | 'knowledge' | 'explorer' | 'creator' | 'secret' | 'prestige';
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Parent {
  id: string;
  email: string;
  full_name?: string;
  stripe_customer_id?: string;
  subscription_tier: SubscriptionTier;
  subscription_status: string;
  subscription_period_end?: string;
  is_admin: boolean;
  coppa_consent_at: string;
  created_at: string;
}

export interface Child {
  id: string;
  parent_id: string;
  display_name: string;
  age_band: AgeBand;
  birth_year?: number;
  xp: number;
  level: number;
  level_title: string;
  spark_coins: number;
  streak_count: number;
  streak_last_date?: string;
  streak_shields: number;
  avatar_config: AvatarConfig;
  preferences: ChildPreferences;
  daily_time_limit_minutes?: number;
  prompt_lab_enabled: boolean;
  prompts_used_today: number;
  games_played_this_week: number;
  created_at: string;
}

export interface AvatarConfig {
  face_shape?: number;
  skin_tone?: number;
  hair_style?: number;
  hair_color?: number;
  eye_style?: number;
  accessories?: string[];
  background?: string;
  pet?: { species: string; name: string; accessories: string[] };
}

export interface ChildPreferences {
  font_size: 'normal' | 'large' | 'xl';
  dyslexia_font: boolean;
  reduce_motion: boolean;
  high_contrast: boolean;
  sound_enabled: boolean;
}

export const DEFAULT_PREFERENCES: ChildPreferences = {
  font_size: 'normal',
  dyslexia_font: false,
  reduce_motion: false,
  high_contrast: false,
  sound_enabled: true,
};

export interface Content {
  id: string;
  world: number;
  title: string;
  slug?: string;
  type: ContentType;
  target_age_band: AgeBand;
  difficulty: Difficulty;
  content_body: string;
  quiz_questions?: QuizQuestion[];
  game_config?: GameConfig;
  xp_reward: number;
  estimated_minutes: number;
  sort_order: number;
  is_free: boolean;
  is_agent_generated: boolean;
  status: ContentStatus;
  created_at: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  hint: string;
}

export interface GameConfig {
  game_type: string;
  slug: string;
  description: string;
  mechanics: string;
  data?: Record<string, unknown>;
  estimated_duration_minutes: number;
}

export interface Progress {
  id: string;
  child_id: string;
  content_id: string;
  completed: boolean;
  score?: number;
  time_spent_seconds: number;
  attempts: number;
  completed_at?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  criteria_type: string;
  criteria_value: number;
  criteria_world?: number;
  rarity: BadgeRarity;
}

export interface ChildBadge {
  id: string;
  child_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface ContentQueueItem {
  id: string;
  agent_run_id?: string;
  title: string;
  type: ContentType;
  target_age_band: AgeBand;
  world: number;
  content_json: Record<string, unknown>;
  source_urls?: string[];
  safety_check: { passed: boolean; flags: string[]; flesch_kincaid_grade: number; notes: string };
  status: 'pending_review' | 'needs_human_review' | 'approved' | 'rejected';
  rejection_reason?: string;
  generated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface LabMeta {
  id: number;
  title: string;
  subtitle: string;
  color: string;
  tint: string;
  icon: string;
  description: string;
  games: GameMeta[];
}

export interface GameMeta {
  slug: string;
  title: string;
  emoji: string;
  description: string;
  estimatedMinutes: number;
  xpReward: number;
  ageBands: AgeBand[];
}

export const LABS: LabMeta[] = [
  {
    id: 1, title: 'What IS AI?', subtitle: 'Foundations', color: '#00BBFF', tint: '#00BBFF', icon: '🤖', description: 'Discover how machines learn to think',
    games: [
      { slug: 'ai-spy', title: 'AI Spy', emoji: '🔍', description: 'Find hidden AI in everyday scenes', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'time-machine', title: 'Time Machine', emoji: '⏰', description: 'Place AI milestones on a timeline', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'human-vs-machine', title: 'Human vs Machine', emoji: '🤝', description: 'Who does it better — you or AI?', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
    ],
  },
  {
    id: 2, title: 'Teaching Machines', subtitle: 'Machine Learning', color: '#00BBFF', tint: '#AA66FF', icon: '🧠', description: 'Train your own AI models and see learning in action',
    games: [
      { slug: 'pet-trainer', title: 'AI Pet Trainer', emoji: '🐾', description: 'Adopt and train a virtual AI pet', estimatedMinutes: 20, xpReward: 30, ageBands: ['A', 'B', 'C'] },
      { slug: 'sort-toy-box', title: 'Sort the Toy Box', emoji: '📦', description: 'Group shapes like an AI would', estimatedMinutes: 8, xpReward: 20, ageBands: ['A', 'B', 'C'] },
      { slug: 'treat-trainer', title: 'Treat Trainer', emoji: '🍪', description: 'Teach a robot with rewards', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'data-detective', title: 'Data Detective', emoji: '🕵️', description: 'Clean messy data to improve AI', estimatedMinutes: 15, xpReward: 30, ageBands: ['A', 'B', 'C'] },
    ],
  },
  {
    id: 3, title: 'The Brain Inside', subtitle: 'Neural Networks', color: '#00BBFF', tint: '#FF66AA', icon: '🧬', description: 'Explore neural networks — the brain of AI',
    games: [
      { slug: 'neural-builder', title: 'Neural Network Builder', emoji: '🏗️', description: 'Build and train a visual neural network', estimatedMinutes: 25, xpReward: 35, ageBands: ['B', 'C'] },
      { slug: 'neuron-relay', title: 'Neuron Relay', emoji: '⚡', description: 'Pass signals through a neuron chain', estimatedMinutes: 8, xpReward: 20, ageBands: ['A', 'B', 'C'] },
      { slug: 'pixel-investigator', title: 'Pixel Investigator', emoji: '🔎', description: 'Guess images from their pixels', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
    ],
  },
  {
    id: 4, title: 'AI That Creates', subtitle: 'Generative AI', color: '#00BBFF', tint: '#FFAA44', icon: '🎨', description: 'See how AI generates art, music, and text',
    games: [
      { slug: 'prompt-lab', title: 'Prompt Lab', emoji: '⌨️', description: 'Master the art of talking to AI', estimatedMinutes: 15, xpReward: 30, ageBands: ['A', 'B', 'C'] },
      { slug: 'word-predictor', title: 'Word Predictor', emoji: '📝', description: 'Guess what word AI picks next', estimatedMinutes: 8, xpReward: 20, ageBands: ['A', 'B', 'C'] },
      { slug: 'token-chopper', title: 'Token Chopper', emoji: '✂️', description: 'See how AI chops up language', estimatedMinutes: 5, xpReward: 15, ageBands: ['A', 'B', 'C'] },
      { slug: 'ai-art-detective', title: 'AI Art Detective', emoji: '🖼️', description: 'Spot AI-made art vs human art', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
    ],
  },
  {
    id: 5, title: 'AI Helpers', subtitle: 'Agents & Tools', color: '#00BBFF', tint: '#00FF88', icon: '🔧', description: 'Meet the AI assistants changing the world',
    games: [
      { slug: 'agent-architect', title: 'Agent Architect', emoji: '📐', description: 'Build an AI agent with a flowchart', estimatedMinutes: 20, xpReward: 30, ageBands: ['B', 'C'] },
      { slug: 'robot-vacuum', title: 'Robot Vacuum Challenge', emoji: '🤖', description: 'Program a vacuum with rules', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'tool-picker', title: 'Tool Picker', emoji: '🧰', description: 'Pick the right AI tool for the job', estimatedMinutes: 5, xpReward: 15, ageBands: ['A', 'B', 'C'] },
    ],
  },
  {
    id: 6, title: 'AI & Ethics', subtitle: 'Fairness & Safety', color: '#00BBFF', tint: '#FF6644', icon: '⚖️', description: 'Tackle the big questions: fairness, bias, and safety',
    games: [
      { slug: 'bias-detective', title: 'Bias Detective', emoji: '🔍', description: 'Investigate unfair AI systems', estimatedMinutes: 25, xpReward: 35, ageBands: ['B', 'C'] },
      { slug: 'data-shield', title: 'Data Shield', emoji: '🛡️', description: 'Protect your personal data', estimatedMinutes: 10, xpReward: 20, ageBands: ['A', 'B', 'C'] },
      { slug: 'real-or-fake', title: 'Real or Fake?', emoji: '🎭', description: 'Spot deepfakes and AI content', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'ethics-courtroom', title: 'AI Ethics Courtroom', emoji: '⚖️', description: 'Debate real AI dilemmas', estimatedMinutes: 25, xpReward: 35, ageBands: ['B', 'C'] },
    ],
  },
  {
    id: 7, title: 'Computer Vision', subtitle: 'How AI Sees', color: '#00BBFF', tint: '#06B6D4', icon: '👁️', description: 'Teach machines to see and understand images',
    games: [
      { slug: 'camera-quest', title: 'Camera Quest', emoji: '📷', description: 'Find objects with your camera', estimatedMinutes: 15, xpReward: 30, ageBands: ['A', 'B', 'C'] },
      { slug: 'fool-the-ai', title: 'Fool the AI', emoji: '🎩', description: 'Trick an AI image classifier', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'build-classifier', title: 'Build a Classifier', emoji: '🏷️', description: 'Train your own image classifier', estimatedMinutes: 20, xpReward: 30, ageBands: ['B', 'C'] },
    ],
  },
  {
    id: 8, title: 'Words & Language', subtitle: 'NLP', color: '#00BBFF', tint: '#818CF8', icon: '💬', description: 'Explore how AI reads, writes, translates, and understands language',
    games: [
      { slug: 'sentiment-scanner', title: 'Sentiment Scanner', emoji: '😊', description: 'See how AI reads emotions in text', estimatedMinutes: 8, xpReward: 20, ageBands: ['A', 'B', 'C'] },
      { slug: 'chatbot-builder', title: 'Chatbot Builder', emoji: '💬', description: 'Build your own chatbot', estimatedMinutes: 20, xpReward: 30, ageBands: ['B', 'C'] },
      { slug: 'lost-in-translation', title: 'Lost in Translation', emoji: '🌍', description: 'Watch sentences change through translation', estimatedMinutes: 8, xpReward: 20, ageBands: ['A', 'B', 'C'] },
    ],
  },
  {
    id: 9, title: 'Build Your AI', subtitle: 'Hands-On Coding', color: '#00BBFF', tint: '#F97316', icon: '💻', description: 'Design, build, and test your own AI projects',
    games: [
      { slug: 'code-blocks', title: 'Code Blocks', emoji: '🧩', description: 'Snap code blocks together to build logic', estimatedMinutes: 15, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'vibe-coder', title: 'Vibe Coder', emoji: '✨', description: 'Describe what you want, see the code', estimatedMinutes: 15, xpReward: 30, ageBands: ['B', 'C'] },
      { slug: 'api-explorer', title: 'API Explorer', emoji: '🔌', description: 'Send real API requests to Claude', estimatedMinutes: 20, xpReward: 35, ageBands: ['B', 'C'] },
    ],
  },
  {
    id: 10, title: 'AI Futures', subtitle: 'What Comes Next', color: '#00BBFF', tint: '#D946EF', icon: '🚀', description: 'Imagine what AI will do next — and what you\'ll create',
    games: [
      { slug: 'future-forge', title: 'Future Forge', emoji: '🔮', description: 'Design your dream AI invention', estimatedMinutes: 15, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'career-explorer', title: 'Career Explorer', emoji: '🧭', description: 'Discover AI career paths', estimatedMinutes: 10, xpReward: 20, ageBands: ['A', 'B', 'C'] },
      { slug: 'prediction-market', title: 'Prediction Market', emoji: '📊', description: 'Vote on AI predictions', estimatedMinutes: 5, xpReward: 15, ageBands: ['A', 'B', 'C'] },
    ],
  },
];

export const WORLDS = LABS;

export function getAllGames(): (GameMeta & { labId: number; labColor: string; labTint: string; labTitle: string })[] {
  return LABS.flatMap(l => l.games.map(g => ({ ...g, labId: l.id, labColor: l.color, labTint: l.tint, labTitle: l.title })));
}

export function getGameBySlug(slug: string) {
  for (const l of LABS) {
    const game = l.games.find(g => g.slug === slug);
    if (game) return { ...game, labId: l.id, labColor: l.color, labTint: l.tint, labTitle: l.title };
  }
  return null;
}

export const XP_REWARDS = {
  lesson_complete: 15, quiz_pass: 30, quiz_perfect: 50, game_complete: 25,
  sandbox_session: 20, spark_fact: 5, daily_challenge: 30, first_activity_bonus: 10,
} as const;

export const LEVEL_THRESHOLDS = [
  { min: 0, max: 250, title: 'Spark Starter', level_range: [1, 5] as const },
  { min: 251, max: 750, title: 'AI Apprentice', level_range: [6, 10] as const },
  { min: 751, max: 1500, title: 'Data Explorer', level_range: [11, 15] as const },
  { min: 1501, max: 3000, title: 'Algorithm Ace', level_range: [16, 20] as const },
  { min: 3001, max: 6000, title: 'Neural Navigator', level_range: [21, 30] as const },
  { min: 6001, max: 10000, title: 'Machine Mentor', level_range: [31, 40] as const },
  { min: 10001, max: 15000, title: 'AI Architect', level_range: [41, 50] as const },
  { min: 15001, max: Infinity, title: 'Forge Master', level_range: [51, 99] as const },
] as const;

export const PROMPT_LIMITS: Record<SubscriptionTier, number> = { free: 5, plus: 50, forge: 200 };
export const CHILD_LIMITS: Record<SubscriptionTier, number> = { free: 1, plus: 3, forge: 5 };
export const GAME_LIMITS: Record<SubscriptionTier, number> = { free: 3, plus: 999, forge: 999 };

export const CONTENT_TYPE_ICONS: Record<ContentType, string> = {
  lesson: '📚', quiz: '❓', game: '🎮', spark_fact: '⚡', activity: '🎯', sandbox: '🏖️',
};

export const RARITY_COLORS: Record<BadgeRarity, string> = {
  common: '#64748B', uncommon: '#00FF88', rare: '#00BBFF', epic: '#AA66FF', legendary: '#FFAA44',
};
