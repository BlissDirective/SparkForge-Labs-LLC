export type AgeBand = 'A' | 'B' | 'C';
export type SubscriptionTier = 'free' | 'plus' | 'forge';
export type ContentType = 'lesson' | 'quiz' | 'game' | 'spark_fact' | 'activity' | 'sandbox' | 'game_scenario' | 'game_challenge' | 'trending_topic' | 'branching_lesson'
  | 'flagship_pet_category' | 'flagship_sort_criterion' | 'flagship_neural_challenge' | 'flagship_agent_mission' | 'flagship_bias_case'
  | 'fll_data_detective' | 'fll_robot_vacuum' | 'fll_camera_quest' | 'fll_chatbot_builder' | 'fll_emoji_decoder'
  | 'fll_code_blocks' | 'fll_my_first_ai_app' | 'fll_future_forge' | 'fll_ai_or_not';
export type ContentStatus = 'published' | 'pending_review' | 'needs_human_review' | 'rejected' | 'draft';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type BadgeCategory = 'progress' | 'streak' | 'lab' | 'game_master' | 'knowledge' | 'explorer' | 'creator' | 'secret' | 'prestige';
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type CelebrationType = 'xp' | 'badge' | 'level' | 'streak' | 'confetti';

// ═══ CPA v2.0 — Cockpit Panoramic Architecture Types ═══
export type CockpitSkin = 'default' | 'cyberpunk' | 'space' | 'underwater' | 'crystal';
export type SpatialView = 'overview' | 'lab-focus' | 'console' | 'orbit';
export type ConsoleType = 'xp' | 'badges' | 'streak' | 'progress';
// Aligned with CelebrationType (Phase 1 audit fix: Section 3.2)
// Legacy mapping: levelUp→level, gameComplete→confetti, streakMilestone→streak
export type CeremonyType = CelebrationType;
export type HUDDataMode = 'minimap' | 'labfocus' | 'hidden' | 'burst' | 'stats' | 'tutorial';

export interface CameraTarget {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}

export interface HexClusterData {
  left: {
    activeLabId: number;
    activeLabColor: string;
    labCompletion: number;        // 0-1
    recommendedLabId: number;
    recommendedLabColor: string;
  };
  right: {
    xpRate: number;               // XP earned per minute (rolling 5min window)
    streakHeat: number;           // 0-1 (0 = cold, 1 = on fire)
    alertCount: number;           // pending notifications
    alertType: 'badge' | 'challenge' | 'social' | null;
  };
}

export interface Parent {
  id: string;
  email: string;
  full_name?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string | null;
  subscription_tier: SubscriptionTier;
  subscription_status: string;
  subscription_period_end?: string | null;
  trial_ends_at?: string | null;
  is_admin: boolean;
  onboarding_complete: boolean;
  coppa_consent_at: string;
  // AUTH-HIGH-004: nullable until user clicks Supabase email-confirm link.
  // Stamped by /api/auth/callback on first successful exchange.
  email_verified_at?: string | null;
  // AUTH-ENH-003: last OAuth provider used, for settings display.
  oauth_last_provider?: string | null;
  oauth_last_used_at?: string | null;
  // PAY-ENH-003: Dunning sequence state. All NULL when not in dunning.
  // dunning_stage: 0..4 (see DUNNING_SCHEDULE). grace_period_ends_at
  // is the moment the tier demotes to free if not paid.
  grace_period_ends_at?: string | null;
  dunning_stage?: number | null;
  dunning_started_at?: string | null;
  dunning_last_sent_at?: string | null;
  dunning_tier_before?: 'plus' | 'forge' | null;
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

// ═══ Phase 1: Content Agent Enhancement Types ═══

/** Game scenario — dynamic round/level data injected into existing games */
export interface GameScenarioConfig {
  game_slug: string;              // Target game from GAME_REGISTRY
  scenario_id: string;            // Unique scenario identifier
  scenario_type: 'round' | 'level' | 'challenge' | 'dataset' | 'decision_tree';
  parameters: Record<string, unknown>;  // Game-specific config (items, rules, difficulty_params)
  narrative?: string;             // Optional story context for the scenario
  learning_objectives: string[];  // What child learns from this scenario
  topics: string[];               // AI concept tags (e.g., 'tokens', 'bias', 'neural-networks')
  keywords: string[];             // Search/discovery keywords
  prerequisite_content_ids?: string[];  // Content that should be completed first
}

/** Game challenge — time-limited special events for games */
export interface GameChallengeConfig {
  game_slug: string;
  challenge_type: 'daily' | 'weekly' | 'event' | 'trending';
  time_limit_seconds?: number;
  bonus_xp: number;
  parameters: Record<string, unknown>;
  narrative: string;
  expires_at?: string;            // ISO8601 — when challenge disappears
  source_topic?: string;          // Trending AI topic that inspired this
}

/** Trending topic — AI news adapted to game mechanics */
export interface TrendingTopicConfig {
  source_url: string;
  headline: string;
  summary: string;
  published_date: string;
  adapted_games: {
    game_slug: string;
    scenario: GameScenarioConfig;
  }[];
}

/** Branching lesson — interactive lesson with decision tree */
export interface BranchingLessonConfig {
  entry_node_id: string;
  nodes: BranchNode[];
  learning_outcomes: string[];
  estimated_paths: number;        // Number of unique paths through the tree
}

export interface BranchNode {
  id: string;
  type: 'content' | 'choice' | 'outcome' | 'interactive';
  content_body: string;           // Markdown content for this node
  choices?: { label: string; next_node_id: string; feedback?: string }[];
  interactive_config?: {          // For embedded mini-simulations
    type: 'diagram' | 'animation' | 'mini_game';
    data: Record<string, unknown>;
  };
}

/** Enhanced content metadata — extends base Content for all new types */
export interface ContentMetadata {
  topics: string[];               // 3-5 AI concept tags
  learning_outcomes: string[];    // What child learns
  keywords: string[];             // Search terms (5-10)
  prerequisite_ids?: string[];    // Content IDs that should precede this
  badge_criteria?: {              // Optional badge unlock trigger
    badge_id: string;
    condition: string;            // e.g., 'score>80', 'complete', 'streak>3'
  };
  source_finding?: {              // Link back to research finding
    title: string;
    source_url: string;
    educational_potential: number;
  };
}

/** Extended GameConfig for dynamic game content */
export interface DynamicGameConfig extends GameConfig {
  scenarios?: GameScenarioConfig[];
  challenges?: GameChallengeConfig[];
  trending?: TrendingTopicConfig;
  metadata?: ContentMetadata;
}

/** Architecture pipeline — describes 3D/UI requirements for new content */
export interface ArchitectureRequirement {
  content_id: string;
  content_type: ContentType;
  required_3d_components: {
    name: string;                  // Component name (PascalCase)
    type: 'environment' | 'game_scene' | 'ui_element' | 'effect';
    triangle_budget: number;
    description: string;
    integration_point: string;     // Where in existing architecture
  }[];
  required_ui_components: {
    name: string;
    type: 'page' | 'panel' | 'overlay' | 'modal';
    description: string;
  }[];
  existing_reusable: string[];    // Existing components that can be reused
  estimated_complexity: 'low' | 'medium' | 'high';
}

/** Content pipeline gate status for 8-gate approval process */
export type PipelineGate = 'analysis' | 'architecture' | 'code_gen' | 'file_management' | 'build_test' | 'coppa_audit' | 'admin_approval' | 'deployed';

export interface PipelineGateStatus {
  gate: PipelineGate;
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'skipped';
  completed_at?: string;
  notes?: string;
}

/** New game blueprint — full game spec for Phase 9 game generator */
export interface NewGameBlueprint {
  name: string;
  slug: string;
  lab: number;
  tier: 'flagship' | 'fl-lite' | 'standard';
  age_bands: AgeBand[];
  description: string;
  learning_objectives: string[];
  mechanics: string;              // Markdown description of game mechanics
  phases: ('welcome' | 'learn' | 'play' | 'complete')[];
  scoring: {
    base_xp: number;
    perfect_bonus: number;
    time_bonus: boolean;
  };
  three_d_requirements?: ArchitectureRequirement;
  pipeline_gates: PipelineGateStatus[];
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
      { slug: 'pocket-brain', title: 'Pocket Brain', emoji: '🧠', description: 'Run a real AI in your browser — no internet needed', estimatedMinutes: 22, xpReward: 35, ageBands: ['A', 'B', 'C'] },
      { slug: 'ai-spy', title: 'AI Spy', emoji: '🔍', description: 'Find hidden AI in everyday scenes', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'time-machine', title: 'Time Machine', emoji: '⏰', description: 'Place AI milestones on a timeline', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'human-vs-machine', title: 'Human vs Machine', emoji: '🤝', description: 'Who does it better — you or AI?', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
    ],
  },
  {
    id: 2, title: 'Teaching Machines', subtitle: 'Machine Learning', color: '#AA66FF', tint: '#AA66FF', icon: '🧠', description: 'Train your own AI models and see learning in action',
    games: [
      { slug: 'pet-trainer', title: 'AI Pet Trainer', emoji: '🐾', description: 'Adopt and train a virtual AI pet', estimatedMinutes: 20, xpReward: 30, ageBands: ['A', 'B', 'C'] },
      { slug: 'sort-toy-box', title: 'Sort the Toy Box', emoji: '📦', description: 'Group shapes like an AI would', estimatedMinutes: 8, xpReward: 20, ageBands: ['A', 'B', 'C'] },
      { slug: 'treat-trainer', title: 'Treat Trainer', emoji: '🍪', description: 'Teach a robot with rewards', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'data-detective', title: 'Data Detective', emoji: '🕵️', description: 'Clean messy data to improve AI', estimatedMinutes: 15, xpReward: 30, ageBands: ['A', 'B', 'C'] },
    ],
  },
  {
    id: 3, title: 'The Brain Inside', subtitle: 'Neural Networks', color: '#FF66AA', tint: '#FF66AA', icon: '🧬', description: 'Explore neural networks — the brain of AI',
    games: [
      { slug: 'neural-builder', title: 'Neural Network Builder', emoji: '🏗️', description: 'Build and train a visual neural network', estimatedMinutes: 25, xpReward: 35, ageBands: ['B', 'C'] },
      { slug: 'neuron-relay', title: 'Neuron Relay', emoji: '⚡', description: 'Pass signals through a neuron chain', estimatedMinutes: 8, xpReward: 20, ageBands: ['A', 'B', 'C'] },
      { slug: 'pixel-investigator', title: 'Pixel Investigator', emoji: '🔎', description: 'Guess images from their pixels', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
    ],
  },
  {
    id: 4, title: 'AI That Creates', subtitle: 'Generative AI', color: '#FFAA44', tint: '#FFAA44', icon: '🎨', description: 'See how AI generates art, music, and text',
    games: [
      { slug: 'prompt-lab', title: 'Prompt Lab', emoji: '⌨️', description: 'Master the art of talking to AI', estimatedMinutes: 15, xpReward: 30, ageBands: ['A', 'B', 'C'] },
      { slug: 'word-predictor', title: 'Word Predictor', emoji: '📝', description: 'Guess what word AI picks next', estimatedMinutes: 8, xpReward: 20, ageBands: ['A', 'B', 'C'] },
      { slug: 'token-chopper', title: 'Token Chopper', emoji: '✂️', description: 'See how AI chops up language', estimatedMinutes: 5, xpReward: 15, ageBands: ['A', 'B', 'C'] },
      { slug: 'ai-art-detective', title: 'AI Art Detective', emoji: '🖼️', description: 'Spot AI-made art vs human art', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
    ],
  },
  {
    id: 5, title: 'AI Helpers', subtitle: 'Agents & Tools', color: '#00FF88', tint: '#00FF88', icon: '🔧', description: 'Meet the AI assistants changing the world',
    games: [
      { slug: 'agent-architect', title: 'Agent Architect', emoji: '📐', description: 'Build an AI agent with a flowchart', estimatedMinutes: 20, xpReward: 30, ageBands: ['B', 'C'] },
      { slug: 'robot-vacuum', title: 'Robot Vacuum Challenge', emoji: '🤖', description: 'Program a vacuum with rules', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'tool-picker', title: 'Tool Picker', emoji: '🧰', description: 'Pick the right AI tool for the job', estimatedMinutes: 5, xpReward: 15, ageBands: ['A', 'B', 'C'] },
    ],
  },
  {
    id: 6, title: 'AI & Ethics', subtitle: 'Fairness & Safety', color: '#FF6644', tint: '#FF6644', icon: '⚖️', description: 'Tackle the big questions: fairness, bias, and safety',
    games: [
      { slug: 'bias-detective', title: 'Bias Detective', emoji: '🔍', description: 'Investigate unfair AI systems', estimatedMinutes: 25, xpReward: 35, ageBands: ['B', 'C'] },
      { slug: 'data-shield', title: 'Data Shield', emoji: '🛡️', description: 'Protect your personal data', estimatedMinutes: 10, xpReward: 20, ageBands: ['A', 'B', 'C'] },
      { slug: 'real-or-fake', title: 'Real or Fake?', emoji: '🎭', description: 'Spot deepfakes and AI content', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'ethics-courtroom', title: 'AI Ethics Courtroom', emoji: '⚖️', description: 'Debate real AI dilemmas', estimatedMinutes: 25, xpReward: 35, ageBands: ['B', 'C'] },
    ],
  },
  {
    id: 7, title: 'Computer Vision', subtitle: 'How AI Sees', color: '#06B6D4', tint: '#06B6D4', icon: '👁️', description: 'Teach machines to see and understand images',
    games: [
      { slug: 'pixel-witness', title: 'Pixel Witness', emoji: '🎬', description: 'Watch a video, judge the AI\'s answer, catch hallucinations', estimatedMinutes: 18, xpReward: 35, ageBands: ['A', 'B', 'C'] },
      { slug: 'camera-quest', title: 'Camera Quest', emoji: '📷', description: 'Find objects with your camera', estimatedMinutes: 15, xpReward: 30, ageBands: ['A', 'B', 'C'] },
      { slug: 'fool-the-ai', title: 'Fool the AI', emoji: '🎩', description: 'Trick an AI image classifier', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'build-classifier', title: 'Build a Classifier', emoji: '🏷️', description: 'Train your own image classifier', estimatedMinutes: 20, xpReward: 30, ageBands: ['B', 'C'] },
      { slug: 'prediction-market', title: 'Prediction Market', emoji: '📊', description: 'Vote on AI predictions', estimatedMinutes: 5, xpReward: 15, ageBands: ['A', 'B', 'C'] },
    ],
  },
  {
    id: 8, title: 'Words & Language', subtitle: 'NLP', color: '#818CF8', tint: '#818CF8', icon: '💬', description: 'Explore how AI reads, writes, translates, and understands language',
    games: [
      { slug: 'context-architect', title: 'Context Architect', emoji: '📚', description: 'Curate the AI\'s memory shelf and defeat Context Rot', estimatedMinutes: 20, xpReward: 35, ageBands: ['A', 'B', 'C'] },
      { slug: 'sentiment-scanner', title: 'Sentiment Scanner', emoji: '😊', description: 'See how AI reads emotions in text', estimatedMinutes: 8, xpReward: 20, ageBands: ['A', 'B', 'C'] },
      { slug: 'chatbot-builder', title: 'Chatbot Builder', emoji: '💬', description: 'Build your own chatbot', estimatedMinutes: 20, xpReward: 30, ageBands: ['B', 'C'] },
      { slug: 'lost-in-translation', title: 'Lost in Translation', emoji: '🌍', description: 'Watch sentences change through translation', estimatedMinutes: 8, xpReward: 20, ageBands: ['A', 'B', 'C'] },
      { slug: 'emoji-decoder', title: 'Emoji Decoder', emoji: '🔣', description: 'Decode emoji sequences into sentences', estimatedMinutes: 10, xpReward: 20, ageBands: ['A', 'B'] },
    ],
  },
  {
    id: 9, title: 'Build Your AI', subtitle: 'Hands-On Coding', color: '#F97316', tint: '#F97316', icon: '💻', description: 'Design, build, and test your own AI projects',
    games: [
      { slug: 'code-blocks', title: 'Code Blocks', emoji: '🧩', description: 'Snap code blocks together to build logic', estimatedMinutes: 15, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'career-explorer', title: 'Career Explorer', emoji: '🧭', description: 'Discover AI career paths', estimatedMinutes: 10, xpReward: 20, ageBands: ['B', 'C'] },
      { slug: 'api-explorer', title: 'API Explorer', emoji: '🔌', description: 'Send real API requests to Claude', estimatedMinutes: 20, xpReward: 35, ageBands: ['C'] },
      { slug: 'my-first-ai-app', title: 'My First AI App', emoji: '📱', description: 'Build a simple AI-powered app from scratch', estimatedMinutes: 15, xpReward: 30, ageBands: ['A', 'B', 'C'] },
    ],
  },
  {
    id: 10, title: 'AI Futures', subtitle: 'What Comes Next', color: '#D946EF', tint: '#D946EF', icon: '🚀', description: 'Imagine what AI will do next — and what you\'ll create',
    games: [
      { slug: 'future-forge', title: 'Future Forge', emoji: '🔮', description: 'Design your dream AI invention', estimatedMinutes: 15, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'ai-or-not', title: 'AI or Not?', emoji: '❓', description: 'Judge whether creative works were made by humans or AI', estimatedMinutes: 10, xpReward: 20, ageBands: ['A', 'B'] },
    ],
  },
  {
    // Lab 11 added April 30, 2026 (Doc 2 Section B Path B). Hosts the Build->Equip->Constrain
    // arc: C1 Agent Atelier (Stage 11D), C6 MCP Plug-and-Play Lab (Stage 11E), C7 Harness Forge
    // (Stage 11G). Stage 11D shipped May 1, 2026 — Agent Atelier is the first published game.
    id: 11, title: 'Agentic AI', subtitle: 'Teams of AI Agents', color: '#6FFFE6', tint: '#6FFFE6', icon: '🕸️', description: 'Build teams of AI agents, plug tools into them, and wrap them in safety harnesses',
    games: [
      { slug: 'agent-atelier', title: 'Agent Atelier', emoji: '🎭', description: 'Pick specialists, wire them up, and run the team on a mission', estimatedMinutes: 18, xpReward: 30, ageBands: ['A', 'B', 'C'] },
      { slug: 'mcp-lab', title: 'MCP Plug-and-Play Lab', emoji: '🔌', description: 'Plug tools into your team and watch capabilities expand', estimatedMinutes: 16, xpReward: 30, ageBands: ['A', 'B', 'C'] },
      { slug: 'glass-box', title: 'Glass Box Lab', emoji: '🔍', description: 'Audit any saved team frame-by-frame and find the bugs', estimatedMinutes: 14, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'harness-forge', title: 'Harness Forge', emoji: '🛡️', description: 'Wrap any team in three safety-harness layers and stress-test it', estimatedMinutes: 16, xpReward: 30, ageBands: ['A', 'B', 'C'] },
    ],
  },
];

export const WORLDS = LABS;

export function getAllGames(): (GameMeta & { labId: number; labColor: string; labTint: string; labTitle: string })[] {
  return LABS.flatMap(l => l.games.map(g => ({ ...g, labId: l.id, labColor: l.color, labTint: l.tint, labTitle: l.title })));
}

export function getLabById(id: number): LabMeta | undefined {
  return LABS.find(l => l.id === id);
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
  game_scenario: '🎲', game_challenge: '🏆', trending_topic: '📡', branching_lesson: '🌳',
  flagship_pet_category: '🐾', flagship_sort_criterion: '📊', flagship_neural_challenge: '🧠',
  flagship_agent_mission: '🤖', flagship_bias_case: '⚖️',
  fll_data_detective: '🔍', fll_robot_vacuum: '🧹', fll_camera_quest: '📷',
  fll_chatbot_builder: '💬', fll_emoji_decoder: '😀', fll_code_blocks: '🧩',
  fll_my_first_ai_app: '📱', fll_future_forge: '🔮', fll_ai_or_not: '🤔',
};

export const RARITY_COLORS: Record<BadgeRarity, string> = {
  common: '#64748B', uncommon: '#00FF88', rare: '#00BBFF', epic: '#AA66FF', legendary: '#FFAA44',
};
