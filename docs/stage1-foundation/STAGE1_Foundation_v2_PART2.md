# STAGE 1: FOUNDATION — Part 2 of 2 (Source Files)

**Version:** v2 | **Status:** COMPLETE | **v3-FINAL:** None (v2 only)
**Covers:** Types, Supabase clients, middleware, utils, animations, stores, hooks, feature flags, root layout, QueryProvider
**Prerequisites:** Stage 1 Part 1 complete
**Estimated Build Time:** 25–35 minutes

---

## Overview

Stage 1 Part 2 creates all foundational source files that every subsequent stage depends on:

- **Types & Constants** — `src/types/index.ts` (full type system + LABS array + game registry)
- **Utility Functions** — `src/lib/utils.ts` (cn, formatNumber, ageBand helpers)
- **Supabase Clients** — browser client, server client, admin client
- **Middleware** — route protection with Supabase auth
- **Animations** — 45+ Motion variants + spring presets
- **Stores** — 4 Zustand stores (auth, child, game, toast) + uiStore + deviceStore + cockpitStore
- **Jotai Atoms** — Fine-grained 3D state atoms for shader uniforms, particles, camera, LOD (Enhancement 8.1)
- **Hooks** — 4 utility hooks (useDebounce, useLocalStorage, useMediaQuery, useIsMobile) + useAdaptiveCockpit
- **Cockpit Config** — `src/lib/3d/cockpitConfig.ts` (CPA v2.0 geometry, bloom, camera, HUD, LOD presets)
- **Audio Engine** — `src/lib/audio/cockpitAudio.ts` (CockpitAudioEngine class for spatial cockpit audio)
- **Sentry** — Error tracking + performance monitoring config files (Enhancement 8.1)
- **WebGPU Detection** — Auto-detect WebGPU with WebGL2 fallback + TSL migration tracking (Enhancement 8.2)
- **Vitest Config** — Unit + integration test configuration with happy-dom (Enhancement 8.5)
- **Feature Flags** — environment-based feature gating
- **System Preferences** — OS-level accessibility detection
- **QueryProvider** — React Query wrapper with devtools
- **Root Layout** — initial layout.tsx (replaced by Stage 10)

---

## Step 11: Types & Constants

**File:** `src/types/index.ts`

This is the central type definition file for the entire application. Contains:

- **Type aliases:** `AgeBand`, `SubscriptionTier`, `ContentType`, `ContentStatus`, `Difficulty`, `BadgeCategory`, `BadgeRarity`, `CelebrationType`
- **Interfaces:** `Parent`, `Child`, `AvatarConfig`, `ChildPreferences`, `Content`, `QuizQuestion`, `GameConfig`, `Progress`, `Badge`, `ChildBadge`, `ContentQueueItem`, `LabMeta`, `GameMeta`
- **Constants:** `DEFAULT_PREFERENCES`, `LABS` (10 labs with 35 games), `WORLDS` alias, `XP_REWARDS`, `LEVEL_THRESHOLDS`, `PROMPT_LIMITS`, `CHILD_LIMITS`, `GAME_LIMITS`, `CONTENT_TYPE_ICONS`, `RARITY_COLORS`
- **Helper functions:** `getAllGames()`, `getLabById()`, `getGameBySlug()`

```typescript
export type AgeBand = 'A' | 'B' | 'C';
export type SubscriptionTier = 'free' | 'plus' | 'forge';
export type ContentType = 'lesson' | 'quiz' | 'game' | 'spark_fact' | 'activity' | 'sandbox';
export type ContentStatus = 'published' | 'pending_review' | 'needs_human_review' | 'rejected' | 'draft';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type BadgeCategory = 'progress' | 'streak' | 'lab' | 'game_master' | 'knowledge' | 'explorer' | 'creator' | 'secret' | 'prestige';
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type CelebrationType = 'xp' | 'badge' | 'level' | 'streak' | 'confetti';

// ═══ CPA v2.0 — Cockpit Panoramic Architecture Types ═══
export type CockpitSkin = 'default' | 'cyberpunk' | 'space' | 'underwater' | 'crystal';
export type SpatialView = 'overview' | 'lab-focus' | 'console' | 'orbit';
export type ConsoleType = 'xp' | 'badges' | 'streak' | 'progress';
export type CeremonyType = 'xp' | 'badge' | 'levelUp' | 'gameComplete' | 'streakMilestone';
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
  subscription_tier: SubscriptionTier;
  subscription_status: string;
  subscription_period_end?: string;
  is_admin: boolean;
  onboarding_complete: boolean;
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
    id: 1, title: 'What IS AI?', subtitle: 'Foundations', color: '#00BBFF', tint: '#00BBFF', icon: '🤖',
    description: 'Discover how machines learn to think',
    games: [
      { slug: 'ai-spy', title: 'AI Spy', emoji: '🔍', description: 'Find hidden AI in everyday scenes', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'time-machine', title: 'Time Machine', emoji: '⏰', description: 'Place AI milestones on a timeline', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'human-vs-machine', title: 'Human vs Machine', emoji: '🤝', description: 'Who does it better — you or AI?', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
    ],
  },
  {
    id: 2, title: 'Teaching Machines', subtitle: 'Machine Learning', color: '#00BBFF', tint: '#AA66FF', icon: '🧠',
    description: 'Train your own AI models and see learning in action',
    games: [
      { slug: 'pet-trainer', title: 'AI Pet Trainer', emoji: '🐾', description: 'Adopt and train a virtual AI pet', estimatedMinutes: 20, xpReward: 30, ageBands: ['A', 'B', 'C'] },
      { slug: 'sort-toy-box', title: 'Sort the Toy Box', emoji: '📦', description: 'Group shapes like an AI would', estimatedMinutes: 8, xpReward: 20, ageBands: ['A', 'B', 'C'] },
      { slug: 'treat-trainer', title: 'Treat Trainer', emoji: '🍪', description: 'Teach a robot with rewards', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'data-detective', title: 'Data Detective', emoji: '🕵️', description: 'Clean messy data to improve AI', estimatedMinutes: 15, xpReward: 30, ageBands: ['A', 'B', 'C'] },
    ],
  },
  {
    id: 3, title: 'The Brain Inside', subtitle: 'Neural Networks', color: '#00BBFF', tint: '#FF66AA', icon: '🧬',
    description: 'Explore neural networks — the brain of AI',
    games: [
      { slug: 'neural-builder', title: 'Neural Network Builder', emoji: '🏗️', description: 'Build and train a visual neural network', estimatedMinutes: 25, xpReward: 35, ageBands: ['B', 'C'] },
      { slug: 'neuron-relay', title: 'Neuron Relay', emoji: '⚡', description: 'Pass signals through a neuron chain', estimatedMinutes: 8, xpReward: 20, ageBands: ['A', 'B', 'C'] },
      { slug: 'pixel-investigator', title: 'Pixel Investigator', emoji: '🔎', description: 'Guess images from their pixels', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
    ],
  },
  {
    id: 4, title: 'AI That Creates', subtitle: 'Generative AI', color: '#00BBFF', tint: '#FFAA44', icon: '🎨',
    description: 'See how AI generates art, music, and text',
    games: [
      { slug: 'prompt-lab', title: 'Prompt Lab', emoji: '⌨️', description: 'Master the art of talking to AI', estimatedMinutes: 15, xpReward: 30, ageBands: ['A', 'B', 'C'] },
      { slug: 'word-predictor', title: 'Word Predictor', emoji: '📝', description: 'Guess what word AI picks next', estimatedMinutes: 8, xpReward: 20, ageBands: ['A', 'B', 'C'] },
      { slug: 'token-chopper', title: 'Token Chopper', emoji: '✂️', description: 'See how AI chops up language', estimatedMinutes: 5, xpReward: 15, ageBands: ['A', 'B', 'C'] },
      { slug: 'ai-art-detective', title: 'AI Art Detective', emoji: '🖼️', description: 'Spot AI-made art vs human art', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
    ],
  },
  {
    id: 5, title: 'AI Helpers', subtitle: 'Agents & Tools', color: '#00BBFF', tint: '#00FF88', icon: '🔧',
    description: 'Meet the AI assistants changing the world',
    games: [
      { slug: 'agent-architect', title: 'Agent Architect', emoji: '📐', description: 'Build an AI agent with a flowchart', estimatedMinutes: 20, xpReward: 30, ageBands: ['B', 'C'] },
      { slug: 'robot-vacuum', title: 'Robot Vacuum Challenge', emoji: '🤖', description: 'Program a vacuum with rules', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'tool-picker', title: 'Tool Picker', emoji: '🧰', description: 'Pick the right AI tool for the job', estimatedMinutes: 5, xpReward: 15, ageBands: ['A', 'B', 'C'] },
    ],
  },
  {
    id: 6, title: 'AI & Ethics', subtitle: 'Fairness & Safety', color: '#00BBFF', tint: '#FF6644', icon: '⚖️',
    description: 'Tackle the big questions: fairness, bias, and safety',
    games: [
      { slug: 'bias-detective', title: 'Bias Detective', emoji: '🔍', description: 'Investigate unfair AI systems', estimatedMinutes: 25, xpReward: 35, ageBands: ['B', 'C'] },
      { slug: 'data-shield', title: 'Data Shield', emoji: '🛡️', description: 'Protect your personal data', estimatedMinutes: 10, xpReward: 20, ageBands: ['A', 'B', 'C'] },
      { slug: 'real-or-fake', title: 'Real or Fake?', emoji: '🎭', description: 'Spot deepfakes and AI content', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'ethics-courtroom', title: 'AI Ethics Courtroom', emoji: '⚖️', description: 'Debate real AI dilemmas', estimatedMinutes: 25, xpReward: 35, ageBands: ['B', 'C'] },
    ],
  },
  {
    id: 7, title: 'Computer Vision', subtitle: 'How AI Sees', color: '#00BBFF', tint: '#06B6D4', icon: '👁️',
    description: 'Teach machines to see and understand images',
    games: [
      { slug: 'camera-quest', title: 'Camera Quest', emoji: '📷', description: 'Find objects with your camera', estimatedMinutes: 15, xpReward: 30, ageBands: ['A', 'B', 'C'] },
      { slug: 'fool-the-ai', title: 'Fool the AI', emoji: '🎩', description: 'Trick an AI image classifier', estimatedMinutes: 10, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'build-classifier', title: 'Build a Classifier', emoji: '🏷️', description: 'Train your own image classifier', estimatedMinutes: 20, xpReward: 30, ageBands: ['B', 'C'] },
    ],
  },
  {
    id: 8, title: 'Words & Language', subtitle: 'NLP', color: '#00BBFF', tint: '#818CF8', icon: '💬',
    description: 'Explore how AI reads, writes, translates, and understands language',
    games: [
      { slug: 'sentiment-scanner', title: 'Sentiment Scanner', emoji: '😊', description: 'See how AI reads emotions in text', estimatedMinutes: 8, xpReward: 20, ageBands: ['A', 'B', 'C'] },
      { slug: 'chatbot-builder', title: 'Chatbot Builder', emoji: '💬', description: 'Build your own chatbot', estimatedMinutes: 20, xpReward: 30, ageBands: ['B', 'C'] },
      { slug: 'lost-in-translation', title: 'Lost in Translation', emoji: '🌍', description: 'Watch sentences change through translation', estimatedMinutes: 8, xpReward: 20, ageBands: ['A', 'B', 'C'] },
    ],
  },
  {
    id: 9, title: 'Build Your AI', subtitle: 'Hands-On Coding', color: '#00BBFF', tint: '#F97316', icon: '💻',
    description: 'Design, build, and test your own AI projects',
    games: [
      { slug: 'code-blocks', title: 'Code Blocks', emoji: '🧩', description: 'Snap code blocks together to build logic', estimatedMinutes: 15, xpReward: 25, ageBands: ['A', 'B', 'C'] },
      { slug: 'vibe-coder', title: 'Vibe Coder', emoji: '✨', description: 'Describe what you want, see the code', estimatedMinutes: 15, xpReward: 30, ageBands: ['B', 'C'] },
      { slug: 'api-explorer', title: 'API Explorer', emoji: '🔌', description: 'Send real API requests to Claude', estimatedMinutes: 20, xpReward: 35, ageBands: ['B', 'C'] },
    ],
  },
  {
    id: 10, title: 'AI Futures', subtitle: 'What Comes Next', color: '#00BBFF', tint: '#D946EF', icon: '🚀',
    description: 'Imagine what AI will do next — and what you\'ll create',
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
};

export const RARITY_COLORS: Record<BadgeRarity, string> = {
  common: '#64748B', uncommon: '#00FF88', rare: '#00BBFF', epic: '#AA66FF', legendary: '#FFAA44',
};
```

---

## Step 12: Utility Functions

**File:** `src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export function getAgeBandLabel(band: 'A' | 'B' | 'C'): string {
  const labels = { A: 'Ages 7-10', B: 'Ages 11-13', C: 'Ages 14-16' };
  return labels[band];
}

export function ageToAgeBand(age: number): 'A' | 'B' | 'C' {
  if (age <= 10) return 'A';
  if (age <= 13) return 'B';
  return 'C';
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## Step 13: Supabase Clients

### Browser Client

**File:** `src/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Server Client + Admin Client

**File:** `src/lib/supabase/server.ts`

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createServerSupabase() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }); } catch { /* Server Component */ }
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }); } catch { /* Server Component */ }
        },
      },
    }
  );
}

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

---

## Step 14: Middleware

**File:** `src/middleware.ts`

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const publicPaths = ['/', '/login', '/signup', '/pricing', '/about', '/privacy', '/terms'];
  const isPublic = publicPaths.some(p => request.nextUrl.pathname === p);
  const isAPI = request.nextUrl.pathname.startsWith('/api');
  const isStatic = request.nextUrl.pathname.startsWith('/_next');
  const isAsset = request.nextUrl.pathname.match(/\.(ico|png|jpg|svg|woff2?)$/);

  if (!user && !isPublic && !isAPI && !isStatic && !isAsset) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|sounds|fonts).*)'],
};
```

---

## Step 15: Animation Library

**File:** `src/lib/animations.ts`

Contains 45+ Motion variants organized by category:

- **Spring presets:** `gentle`, `bouncy`, `snappy`, `wobbly`, `panel`
- **Fade variants:** `fadeIn`, `fadeSlideUp`, `fadeSlideDown`
- **Page transitions:** `pageTransition`
- **Stagger containers:** `staggerContainer`, `staggerItem`, `staggerFast`, `listRevealContainer`, `listRevealItem`
- **Scale & pop:** `scaleIn`, `popIn`
- **Slide variants:** `slideInLeft`, `slideInRight`, `slideDrawer`
- **Hover effects:** `hoverLift`, `hoverGlow`, `cardHover`, `hexHover`
- **Micro interactions:** `microBounce`, `timerPulse`, `skeletonPulse`
- **Gamification:** `xpFloat`, `streakFlame`, `xpGain`, `badgeUnlock`, `levelUp`, `confettiPiece()`, `correctAnswer`, `wrongAnswer`
- **Progress:** `progressRing()`, `progressFill()`
- **Floating & ambient:** `floatingIsland`
- **Hero/landing:** `heroTitle`, `heroSubtitle`
- **Lab/module:** `moduleTransition`, `labCardEntrance()`, `lockShake`, `staggerItemFromLeft`, `panelSlideRight`
- **Modal/tooltip:** `modalBackdrop`, `modalContent`, `tooltipPop`
- **Particles:** `sparkParticle()`
- **Count-up spring:** `countUp`
- **Safe variant wrapper:** `safeVariant()` — respects reduced-motion preference

```typescript
// Enhancement 8.1: 'framer-motion' rebranded to 'motion' — import from 'motion/react'
import { type Variants, type Transition } from 'motion/react';

// ═══ SPRING PRESETS ═══
export const springs = {
  gentle: { type: 'spring', stiffness: 150, damping: 20 } as Transition,
  bouncy: { type: 'spring', stiffness: 300, damping: 15 } as Transition,
  snappy: { type: 'spring', stiffness: 500, damping: 25 } as Transition,
  wobbly: { type: 'spring', stiffness: 180, damping: 12 } as Transition,
  panel: { type: 'spring', stiffness: 200, damping: 22 } as Transition,
};

// ═══ FADE VARIANTS ═══
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export const fadeSlideDown: Variants = {
  initial: { opacity: 0, y: -12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.2 } },
};

// ═══ PAGE TRANSITIONS ═══
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -12, filter: 'blur(4px)', transition: { duration: 0.25 } },
};

// ... (remaining 35+ variants — see full file in src/lib/animations.ts)

// ═══ SAFE VARIANT WRAPPER ═══
export function safeVariant(variant: Variants, reducedMotion = false): Variants {
  if (!reducedMotion) return variant;
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.15 } },
    exit: { opacity: 0, transition: { duration: 0.1 } },
  };
}
```

> Full file contains all 45+ variants. See `src/lib/animations.ts` for complete source.

---

## Step 16: Auth Store

**File:** `src/stores/authStore.ts`

```typescript
import { create } from 'zustand';
import type { Parent } from '@/types';

interface AuthState {
  parent: Parent | null;
  isLoading: boolean;
  setParent: (parent: Parent | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  parent: null,
  isLoading: true,
  setParent: (parent) => set({ parent }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () => set({ parent: null, isLoading: false }),
}));
```

---

## Step 17: Child Store

**File:** `src/stores/childStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Child, ChildBadge, Progress, AvatarConfig } from '@/types';

interface ChildState {
  activeChild: Child | null;
  children: Child[];
  badges: ChildBadge[];
  progress: Progress[];
  setActiveChild: (child: Child | null) => void;
  setChildren: (children: Child[]) => void;
  setBadges: (badges: ChildBadge[]) => void;
  setProgress: (progress: Progress[]) => void;
  updateXP: (xp: number) => void;
  updateLevel: (level: number, title: string) => void;
  updateStreak: (count: number) => void;
  updateCoins: (coins: number) => void;
  updateAvatarConfig: (config: Partial<AvatarConfig>) => void;
  clearChild: () => void;
}

export const useChildStore = create<ChildState>()(
  persist(
    (set, get) => ({
      activeChild: null,
      children: [],
      badges: [],
      progress: [],
      setActiveChild: (activeChild) => set({ activeChild }),
      setChildren: (children) => set({ children }),
      setBadges: (badges) => set({ badges }),
      setProgress: (progress) => set({ progress }),
      updateXP: (xpToAdd) => {
        const child = get().activeChild;
        if (!child) return;
        set({ activeChild: { ...child, xp: child.xp + xpToAdd } });
      },
      updateLevel: (level, title) => {
        const child = get().activeChild;
        if (!child) return;
        set({ activeChild: { ...child, level, level_title: title } });
      },
      updateStreak: (count) => {
        const child = get().activeChild;
        if (!child) return;
        set({ activeChild: { ...child, streak_count: count } });
      },
      updateCoins: (coinsToAdd) => {
        const child = get().activeChild;
        if (!child) return;
        set({ activeChild: { ...child, spark_coins: child.spark_coins + coinsToAdd } });
      },
      updateAvatarConfig: (config) => {
        const child = get().activeChild;
        if (!child) return;
        set({ activeChild: { ...child, avatar_config: { ...child.avatar_config, ...config } } });
      },
      clearChild: () => set({ activeChild: null, children: [], badges: [], progress: [] }),
    }),
    { name: 'sparkforge-child', partialize: (state) => ({ activeChild: state.activeChild }) }
  )
);
```

---

## Step 18: Game Store

**File:** `src/stores/gameStore.ts`

```typescript
import { create } from 'zustand';

interface GameState {
  currentGame: string | null;
  currentRound: number;
  totalRounds: number;
  score: number;
  maxScore: number;
  isComplete: boolean;
  isPaused: boolean;
  hintsRemaining: number;
  timeElapsed: number;
  gameData: Record<string, unknown>;
  startGame: (gameId: string, totalRounds: number, hints?: number) => void;
  updateScore: (points: number) => void;
  advanceRound: () => void;
  useHint: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  completeGame: () => void;
  resetGame: () => void;
  setGameData: (key: string, value: unknown) => void;
  tick: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentGame: null,
  currentRound: 0,
  totalRounds: 0,
  score: 0,
  maxScore: 0,
  isComplete: false,
  isPaused: false,
  hintsRemaining: 3,
  timeElapsed: 0,
  gameData: {},
  startGame: (gameId, totalRounds, hints = 3) => set({
    currentGame: gameId, currentRound: 1, totalRounds, score: 0, maxScore: 0,
    isComplete: false, isPaused: false, hintsRemaining: hints, timeElapsed: 0, gameData: {},
  }),
  updateScore: (points) => set((s) => ({ score: s.score + points, maxScore: s.maxScore + points })),
  advanceRound: () => {
    const s = get();
    if (s.currentRound >= s.totalRounds) { set({ isComplete: true }); }
    else { set({ currentRound: s.currentRound + 1 }); }
  },
  useHint: () => set((s) => ({ hintsRemaining: Math.max(0, s.hintsRemaining - 1) })),
  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),
  completeGame: () => set({ isComplete: true }),
  resetGame: () => set({ currentRound: 1, score: 0, maxScore: 0, isComplete: false, isPaused: false, timeElapsed: 0, gameData: {} }),
  setGameData: (key, value) => set((s) => ({ gameData: { ...s.gameData, [key]: value } })),
  tick: () => set((s) => (s.isPaused ? {} : { timeElapsed: s.timeElapsed + 1 })),
}));
```

---

## Step 19: Toast Store

**File:** `src/stores/toastStore.ts`

```typescript
import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  createdAt: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

let toastCounter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (type, message, duration = 4000) => {
    const id = `toast-${++toastCounter}-${Date.now()}`;
    const toast: Toast = { id, type, message, duration, createdAt: Date.now() };

    set((state) => ({
      toasts: [...state.toasts.slice(-2), toast],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),

  clearAll: () => set({ toasts: [] }),
}));

// ═══ CONVENIENCE FUNCTIONS ═══
export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().addToast('success', message, duration),
  error: (message: string, duration?: number) =>
    useToastStore.getState().addToast('error', message, duration),
  info: (message: string, duration?: number) =>
    useToastStore.getState().addToast('info', message, duration),
  warning: (message: string, duration?: number) =>
    useToastStore.getState().addToast('warning', message, duration),
};
```

---

## Step 20: UI Store

**File:** `src/stores/uiStore.ts`

```typescript
import { create } from 'zustand';
import type { CelebrationType } from '@/types';

interface UIState {
  sidebarOpen: boolean;
  showCelebration: boolean;
  celebrationType: CelebrationType | null;
  celebrationData: Record<string, unknown> | null;
  labColor: string;
  labTint: string;
  soundEnabled: boolean;
  dailyChallengeCompleted: boolean;
  particleIntensity: 'off' | 'low' | 'medium' | 'high';
  /** Per-child setting: skip the hero intro animation on page load.
   *  Default: false. Toggled in Settings page (Stage 4 Part 3).
   *  When true, HeroAnimation renders Phase 8 final state immediately. */
  skipIntroAnimation: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  triggerCelebration: (type: CelebrationType, data?: Record<string, unknown>) => void;
  dismissCelebration: () => void;
  setLabColor: (color: string, tint?: string) => void;
  toggleSound: () => void;
  markDailyChallengeComplete: () => void;
  resetDailyChallenge: () => void;
  setParticleIntensity: (level: 'off' | 'low' | 'medium' | 'high') => void;
  setSkipIntroAnimation: (skip: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  showCelebration: false,
  celebrationType: null,
  celebrationData: null,
  labColor: '#00BBFF',
  labTint: '#00BBFF',
  soundEnabled: true,
  dailyChallengeCompleted: false,
  particleIntensity: 'medium',
  skipIntroAnimation: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  triggerCelebration: (type, data = {}) => set({ showCelebration: true, celebrationType: type, celebrationData: data }),
  dismissCelebration: () => set({ showCelebration: false, celebrationType: null, celebrationData: null }),
  setLabColor: (labColor, labTint) => {
    set({ labColor, labTint: labTint || labColor });
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--lab-color', labColor);
      document.documentElement.style.setProperty('--lab-glow', labColor + '40');
    }
  },
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  markDailyChallengeComplete: () => set({ dailyChallengeCompleted: true }),
  resetDailyChallenge: () => set({ dailyChallengeCompleted: false }),
  setParticleIntensity: (particleIntensity) => set({ particleIntensity }),
  setSkipIntroAnimation: (skipIntroAnimation) => set({ skipIntroAnimation }),
}));
```

---

## Step 20a: Device Store

**File:** `src/stores/deviceStore.ts`

> CPA v2.0: Users select their device type at first launch. Drives LOD, FPS targets, and triangle budgets for all 3D components.

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

// ■■ GPU Rendering Tier (Hero Animation v2.0) ■■
// Detected at runtime by webgpuDetection.ts
// Determines particle budget and rendering pipeline for hero animation
export type GPUTier = 'webgpu-high' | 'webgpu-mid' | 'webgpu-low' | 'webgl2' | 'css';

export interface DeviceProfile {
  targetFPS: number;
  maxTriangles: number;
  lodBias: 'ultra' | 'high' | 'medium' | 'low';
  bloom: boolean;
  shadows: boolean;
  pixelRatio: number;
  antialias: boolean;
}

const DEVICE_PROFILES: Record<DeviceType, DeviceProfile> = {
  desktop: {
    targetFPS: 60,
    maxTriangles: 500_000,
    lodBias: 'ultra',
    bloom: true,
    shadows: true,
    pixelRatio: 2.5,
    antialias: true,
  },
  tablet: {
    targetFPS: 45,
    maxTriangles: 150_000,
    lodBias: 'high',
    bloom: true,
    shadows: false,
    pixelRatio: 1.5,
    antialias: true,
  },
  mobile: {
    targetFPS: 30,
    maxTriangles: 50_000,
    lodBias: 'low',
    bloom: false,
    shadows: false,
    pixelRatio: 1,
    antialias: false,
  },
};

interface DeviceState {
  deviceType: DeviceType;
  hasSelected: boolean;
  profile: DeviceProfile;
  /** GPU rendering tier detected at runtime by webgpuDetection.ts.
   *  Determines particle budget and rendering pipeline for hero animation.
   *  Cached in localStorage alongside existing device preferences. */
  gpuTier: GPUTier;
  /** Number of striped particle buffers (1-4) based on GPU VRAM capability.
   *  Each stripe holds 2.5M particles at 48 bytes each. */
  stripeCount: number;
  setDeviceType: (type: DeviceType) => void;
  setGpuTier: (tier: GPUTier, stripes?: number) => void;
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set) => ({
      deviceType: 'desktop',
      hasSelected: false,
      profile: DEVICE_PROFILES.desktop,
      gpuTier: 'webgl2' as GPUTier,  // safe default until detection runs
      stripeCount: 0,                 // 0 = no WebGPU stripes (WebGL2/CSS mode)
      setDeviceType: (deviceType) =>
        set({
          deviceType,
          hasSelected: true,
          profile: DEVICE_PROFILES[deviceType],
        }),
      setGpuTier: (gpuTier, stripes = 0) => set({ gpuTier, stripeCount: stripes }),
    }),
    {
      name: 'sparkforge-device',
      partialize: (state) => ({
        deviceType: state.deviceType,
        hasSelected: state.hasSelected,
        gpuTier: state.gpuTier,
        stripeCount: state.stripeCount,
      }),
      onRehydrate: () => (state) => {
        if (state) {
          state.profile = DEVICE_PROFILES[state.deviceType];
        }
      },
    }
  )
);
```

---

## Step 20b: Cockpit Store (CPA v2.0)

**File:** `src/stores/cockpitStore.ts`

> CPA v2.0: Manages spatial dashboard navigation, camera targets, cockpit skin, NPC state, ceremony queue, and audio preferences. Persists skin selection, focused lab, and NPC visibility.

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CockpitSkin, SpatialView, ConsoleType, CeremonyType, CameraTarget } from '@/types';

// Pre-calculated lab positions in a circular ring
const LAB_ANGLE_STEP = (2 * Math.PI) / 10;
const LAB_RING_RADIUS = 3.8;

export const LAB_POSITIONS: Record<number, [number, number, number]> = {};
for (let i = 1; i <= 10; i++) {
  const angle = (i - 1) * LAB_ANGLE_STEP - Math.PI / 2; // Start from top
  LAB_POSITIONS[i] = [
    Math.cos(angle) * LAB_RING_RADIUS,
    0,
    Math.sin(angle) * LAB_RING_RADIUS,
  ];
}

// Camera presets for spatial views
export const SPATIAL_CAMERA_PRESETS: Record<SpatialView, CameraTarget> = {
  overview: {
    position: [0, 6.5, 7],
    lookAt: [0, -0.5, 0],
    fov: 58,
  },
  'lab-focus': {
    position: [0, 2.5, 2],
    lookAt: [0, 0, 0],
    fov: 50,
  },
  console: {
    position: [0, 1.8, 3.5],
    lookAt: [0, 0.5, 0],
    fov: 52,
  },
  orbit: {
    position: [0, 4, 5],
    lookAt: [0, 0, 0],
    fov: 55,
  },
};

// ═══ CPA v2.0 — Skin unlock requirements ═══
export const SKIN_UNLOCK_CONDITIONS: Record<CockpitSkin, { description: string; badge: string | null }> = {
  default:    { description: 'Always available', badge: null },
  cyberpunk:  { description: 'Complete all Lab 9 games', badge: 'Digital Pioneer' },
  space:      { description: 'Earn 10,000 total XP', badge: 'Star Navigator' },
  underwater: { description: 'Maintain a 30-day streak', badge: 'Deep Diver' },
  crystal:    { description: 'Complete ALL 35 games at least once', badge: 'Crystal Commander' },
};

interface CeremonyQueueItem {
  type: CeremonyType;
  intensity: number;
  labColor: string;
}

interface CockpitState {
  // Spatial navigation
  spatialView: SpatialView;
  focusedLabId: number | null;
  hoveredLabId: number | null;
  activeConsole: ConsoleType | null;
  isTransitioning: boolean;
  orbitSpeed: number;

  // Camera
  cameraTarget: CameraTarget;

  // Customization (CPA v2.0: skin unlock via achievements)
  cockpitSkin: CockpitSkin;
  unlockedSkins: CockpitSkin[];
  skinPreviewActive: boolean;

  // NPC state
  npcsVisible: boolean;

  // CPA v2.0 — Ceremony queue
  ceremonyQueue: CeremonyQueueItem[];

  // CPA v2.0 — Audio preferences
  cockpitAudioEnabled: boolean;
  ambientVolume: number;

  // CPA v2.0 — Mini-map
  miniMapVisible: boolean;

  // Actions
  setSpatialView: (view: SpatialView) => void;
  focusLab: (labId: number | null) => void;
  setHoveredLab: (labId: number | null) => void;
  openConsole: (type: ConsoleType) => void;
  closeConsole: () => void;
  setCockpitSkin: (skin: CockpitSkin) => void;
  unlockSkin: (skin: CockpitSkin) => void;
  setSkinPreview: (active: boolean) => void;
  setTransitioning: (transitioning: boolean) => void;
  setOrbitSpeed: (speed: number) => void;
  toggleNPCs: () => void;
  returnToOverview: () => void;
  enqueueCeremony: (item: CeremonyQueueItem) => void;
  dequeueCeremony: () => void;
  setCockpitAudio: (enabled: boolean) => void;
  setAmbientVolume: (volume: number) => void;
  toggleMiniMap: () => void;
}

export const useCockpitStore = create<CockpitState>()(
  persist(
    (set, get) => ({
      spatialView: 'overview',
      focusedLabId: null,
      hoveredLabId: null,
      activeConsole: null,
      isTransitioning: false,
      orbitSpeed: 0.15,
      cameraTarget: SPATIAL_CAMERA_PRESETS.overview,
      cockpitSkin: 'default',
      unlockedSkins: ['default'],
      skinPreviewActive: false,
      npcsVisible: true,
      ceremonyQueue: [],
      cockpitAudioEnabled: true,
      ambientVolume: 0.15,
      miniMapVisible: true,

      setSpatialView: (spatialView) => {
        set({
          spatialView,
          cameraTarget: SPATIAL_CAMERA_PRESETS[spatialView],
          isTransitioning: true,
        });
        setTimeout(() => set({ isTransitioning: false }), 800);
      },

      focusLab: (labId) => {
        if (labId === null) {
          get().returnToOverview();
          return;
        }
        const pos = LAB_POSITIONS[labId];
        if (!pos) return;

        const angle = Math.atan2(pos[2], pos[0]);
        const camDist = 2.2;
        set({
          focusedLabId: labId,
          spatialView: 'lab-focus',
          isTransitioning: true,
          cameraTarget: {
            position: [
              pos[0] + Math.cos(angle) * camDist,
              2.0,
              pos[2] + Math.sin(angle) * camDist,
            ],
            lookAt: [pos[0], 0.3, pos[2]],
            fov: 50,
          },
        });
        setTimeout(() => set({ isTransitioning: false }), 800);
      },

      setHoveredLab: (hoveredLabId) => set({ hoveredLabId }),

      openConsole: (activeConsole) => {
        set({
          activeConsole,
          spatialView: 'console',
          isTransitioning: true,
        });
        setTimeout(() => set({ isTransitioning: false }), 600);
      },

      closeConsole: () => {
        set({ activeConsole: null });
        get().returnToOverview();
      },

      setCockpitSkin: (cockpitSkin) => {
        const { unlockedSkins } = get();
        if (unlockedSkins.includes(cockpitSkin)) {
          set({ cockpitSkin });
        }
      },

      unlockSkin: (skin) => {
        set((s) => ({
          unlockedSkins: s.unlockedSkins.includes(skin)
            ? s.unlockedSkins
            : [...s.unlockedSkins, skin],
        }));
      },

      setSkinPreview: (skinPreviewActive) => set({ skinPreviewActive }),

      setTransitioning: (isTransitioning) => set({ isTransitioning }),

      setOrbitSpeed: (orbitSpeed) => set({ orbitSpeed }),

      toggleNPCs: () => set((s) => ({ npcsVisible: !s.npcsVisible })),

      returnToOverview: () => {
        set({
          spatialView: 'overview',
          focusedLabId: null,
          activeConsole: null,
          isTransitioning: true,
          cameraTarget: SPATIAL_CAMERA_PRESETS.overview,
        });
        setTimeout(() => set({ isTransitioning: false }), 800);
      },

      enqueueCeremony: (item) =>
        set((s) => ({ ceremonyQueue: [...s.ceremonyQueue, item] })),

      dequeueCeremony: () =>
        set((s) => ({ ceremonyQueue: s.ceremonyQueue.slice(1) })),

      setCockpitAudio: (cockpitAudioEnabled) => set({ cockpitAudioEnabled }),

      setAmbientVolume: (ambientVolume) => set({ ambientVolume }),

      toggleMiniMap: () => set((s) => ({ miniMapVisible: !s.miniMapVisible })),
    }),
    {
      name: 'sparkforge-cockpit',
      partialize: (state) => ({
        cockpitSkin: state.cockpitSkin,
        unlockedSkins: state.unlockedSkins,
        focusedLabId: state.focusedLabId,
        npcsVisible: state.npcsVisible,
        cockpitAudioEnabled: state.cockpitAudioEnabled,
        ambientVolume: state.ambientVolume,
        miniMapVisible: state.miniMapVisible,
      }),
    }
  )
);
```

---

## Step 20c: Cockpit Config (CPA v2.0)

**File:** `src/lib/3d/cockpitConfig.ts`

> CPA v2.0: Central configuration for all cockpit geometry, bloom, camera, vignette, HUD, panel, and LOD presets. Single source of truth consumed by CockpitCanvas, CockpitPanels, HolographicHUD, SidePanels, StatusBar3D, BarrelDistortion, and all cockpit 3D components.

```typescript
// ================================================================
// Cockpit Panoramic Architecture — Central Config (CPA v2.0)
// ================================================================
// Consolidates: CPA v1.0 + Enhancement 1.1 + Enhancement 1.2
// Decisions: CPA-1 through CPA-12, CPA2-1 through CPA2-12

// ■■ Cockpit Geometry Constants (v2.0 — adaptive curvature) ■■
export const COCKPIT_GEOMETRY_V2 = {
  // Base values (adapted by useAdaptiveCockpit)
  panelCurvature: 0.85,
  totalWrapArc: 140,            // degrees, overridden by adaptive
  panelRadius: 4.0,             // overridden by adaptive
  centralViewportWidth: 0.56,
  sidesPanelWidth: 0.12,
  topBarHeight: 0.10,
  consoleDeskHeight: 0.15,
  statusBarHeight: 0.05,
  hexRadius: 0.35,
  hexDepth: 0.02,

  // NEW in v2
  hexDataTextureSize: 64,       // px, for lab number / indicator textures
  panelEdgeBevel: 0.005,        // subtle edge chamfer
  topBarSegments: 48,           // increased from 32 for smoother curve
  sideSegments: 24,             // increased from 16
} as const;

// ■■ Viewport-Adaptive Curvature Thresholds (CPA2-2) ■■
export const ADAPTIVE_CURVATURE = {
  ultraWide: { minWidth: 1920, arc: 155, radius: 4.2 },
  desktop:   { minWidth: 1440, arc: 140, radius: 4.0 },
  tablet:    { minWidth: 1024, arc: 120, radius: 3.6 },
  cssFallback: { minWidth: 0, arc: 0, radius: 0 },
} as const;

// ■■ Bloom Presets — Mode-Dependent (CPA-7) ■■
export const BLOOM_PRESETS = {
  dashboard:     { intensity: 0.4, threshold: 0.6, smoothing: 0.9 },
  labmap:        { intensity: 0.5, threshold: 0.55, smoothing: 0.85 },
  lab:           { intensity: 0.5, threshold: 0.5, smoothing: 0.85 },
  game:          { intensity: 0.3, threshold: 0.7, smoothing: 0.95 },
  celebration:   { intensity: 0.8, threshold: 0.3, smoothing: 0.7 },
  gameComplete:  { intensity: 1.0, threshold: 0.2, smoothing: 0.6 },
  profile:       { intensity: 0.4, threshold: 0.6, smoothing: 0.9 },
  onboarding:    { intensity: 0.35, threshold: 0.65, smoothing: 0.9 },
} as const;

// ■■ Camera Presets — FOV + Barrel Distortion (CPA-9, CPA-10) ■■
export const CAMERA_PRESETS = {
  dashboard:   { fov: 56, distortion: 0.02 },
  labmap:      { fov: 58, distortion: 0.02 },
  lab:         { fov: 55, distortion: 0.015 },
  game:        { fov: 52, distortion: 0.0 },
  celebration: { fov: 58, distortion: 0.025 },
  profile:     { fov: 54, distortion: 0.01 },
  onboarding:  { fov: 52, distortion: 0.01 },
} as const;

// ■■ Vignette Presets — R3F Postprocessing (CPA-8) ■■
export const VIGNETTE_PRESETS = {
  dashboard:   { darkness: 0.5, offset: 0.3 },
  labmap:      { darkness: 0.4, offset: 0.3 },
  lab:         { darkness: 0.5, offset: 0.3 },
  game:        { darkness: 0.6, offset: 0.25 },
  celebration: { darkness: 0.3, offset: 0.4 },
  profile:     { darkness: 0.5, offset: 0.3 },
  onboarding:  { darkness: 0.4, offset: 0.35 },
} as const;

// ■■ HUD Presets v2 — Data-Driven Holographic HUD (CPA2-3) ■■
export const HUD_PRESETS_V2 = {
  dashboard:     { opacity: 0.15, rotationSpeed: 0.1,  pulseIntensity: 0.3, dataMode: 'minimap' as const },
  labmap:        { opacity: 0.18, rotationSpeed: 0.15, pulseIntensity: 0.4, dataMode: 'minimap' as const },
  lab:           { opacity: 0.20, rotationSpeed: 0.2,  pulseIntensity: 0.5, dataMode: 'labfocus' as const },
  game:          { opacity: 0.0,  rotationSpeed: 0,    pulseIntensity: 0,   dataMode: 'hidden' as const },
  celebration:   { opacity: 0.85, rotationSpeed: 0.4,  pulseIntensity: 1.0, dataMode: 'burst' as const },
  gameComplete:  { opacity: 1.0,  rotationSpeed: 0.5,  pulseIntensity: 1.0, dataMode: 'burst' as const },
  profile:       { opacity: 0.12, rotationSpeed: 0.08, pulseIntensity: 0.2, dataMode: 'stats' as const },
  onboarding:    { opacity: 0.10, rotationSpeed: 0.05, pulseIntensity: 0.15, dataMode: 'tutorial' as const },
} as const;

// ■■ Side Panel Presets (CPA-6) ■■
export const SIDE_PANEL_PRESETS = {
  dashboard:   { opacity: 0.6, leftContent: 'radar' as const, rightContent: 'stats' as const },
  labmap:      { opacity: 0.7, leftContent: 'labNav' as const, rightContent: 'stats' as const },
  lab:         { opacity: 0.5, leftContent: 'labNav' as const, rightContent: 'stats' as const },
  game:        { opacity: 0.0, leftContent: 'radar' as const, rightContent: 'stats' as const },
  celebration: { opacity: 0.3, leftContent: 'radar' as const, rightContent: 'terminal' as const },
  profile:     { opacity: 0.4, leftContent: 'radar' as const, rightContent: 'stats' as const },
  onboarding:  { opacity: 0.3, leftContent: 'radar' as const, rightContent: 'stats' as const },
} as const;

// ■■ Panel Curvature per Mode ■■
export const PANEL_CURVATURE_PRESETS = {
  dashboard:   0.85,
  labmap:      0.85,
  lab:         0.85,
  game:        0.3,     // Retracted during games (Decision 3.4)
  celebration: 0.85,
  profile:     0.85,
  onboarding:  0.7,
} as const;

// ■■ Panel Opacity per Mode ■■
export const PANEL_OPACITY_PRESETS = {
  dashboard:   1.0,
  labmap:      1.0,
  lab:         1.0,
  game:        0.2,     // Dimmed during games
  celebration: 1.0,
  profile:     1.0,
  onboarding:  0.8,
} as const;

// ■■ Status Bar Opacity per Mode ■■
export const STATUS_BAR_PRESETS = {
  dashboard:   { opacity: 1.0 },
  labmap:      { opacity: 1.0 },
  lab:         { opacity: 1.0 },
  game:        { opacity: 0.15 },  // Minimal, non-distracting
  celebration: { opacity: 1.0 },
  profile:     { opacity: 1.0 },
  onboarding:  { opacity: 0.6 },
} as const;

// ■■ Skin-Reactive Panel Materials (CPA2-5) ■■
export const SKIN_PANEL_TINTS: Record<string, {
  panelTint: string;
  hexGlow: string;
  chromeReflection: string;
}> = {
  default:    { panelTint: '#1a1e2e', hexGlow: 'lab',     chromeReflection: 'frost-prismatic' },
  cyberpunk:  { panelTint: '#2a0030', hexGlow: '#FF00FF', chromeReflection: 'neon-grid' },
  space:      { panelTint: '#0a0a1e', hexGlow: '#4444FF', chromeReflection: 'starfield' },
  underwater: { panelTint: '#0a1a2e', hexGlow: '#00BBFF', chromeReflection: 'caustic' },
  crystal:    { panelTint: '#1a0828', hexGlow: '#AA66FF', chromeReflection: 'prismatic' },
};

// ■■ Console Frame Styles per Skin (CPA2-11) ■■
export const CONSOLE_FRAME_STYLES: Record<string, {
  material: string;
  edgeGlow: boolean;
  transmission: number;
  bracketStyle: string;
}> = {
  default:    { material: 'chrome',     edgeGlow: true,  transmission: 0.4, bracketStyle: 'angular' },
  cyberpunk:  { material: 'darkChrome', edgeGlow: true,  transmission: 0.3, bracketStyle: 'neon' },
  space:      { material: 'titanium',   edgeGlow: false, transmission: 0.5, bracketStyle: 'minimal' },
  underwater: { material: 'copper',     edgeGlow: true,  transmission: 0.6, bracketStyle: 'organic' },
  crystal:    { material: 'glass',      edgeGlow: true,  transmission: 0.8, bracketStyle: 'faceted' },
};

// ■■ Mode Transition Durations (CPA2-6) ■■
export const MODE_TRANSITIONS = {
  'dashboard→lab':        { duration: 800, easing: 'spring(300, 25)' },
  'lab→game':             { duration: 600, easing: 'easeInOut' },
  'game→lab':             { duration: 400, easing: 'easeOut' },
  'lab→dashboard':        { duration: 800, easing: 'spring(300, 25)' },
  'any→celebration':      { duration: 200, easing: 'easeIn' },
  'celebration→previous': { duration: 1200, easing: 'easeOut' },
} as const;

// ■■ Ceremony FX Intensity per Type (CPA2-10) ■■
export const CEREMONY_INTENSITY = {
  xp:              { bloomPeak: 0.6, particleCount: 50,  hudExpansion: 1.1, duration: 1500 },
  badge:           { bloomPeak: 0.8, particleCount: 100, hudExpansion: 1.3, duration: 2000 },
  levelUp:         { bloomPeak: 1.0, particleCount: 200, hudExpansion: 1.5, duration: 3000 },
  gameComplete:    { bloomPeak: 0.9, particleCount: 150, hudExpansion: 1.4, duration: 2500 },
  streakMilestone: { bloomPeak: 0.7, particleCount: 80,  hudExpansion: 1.2, duration: 2000 },
} as const;

// ■■ Cockpit LOD Levels (CPA2-12) ■■
export const COCKPIT_LOD = {
  ultra: {
    panelSegments: 48,
    sideSegments: 24,
    hexDetail: true,
    hudRingSegments: 64,
    scanLines: 12,
    barrelDistortion: true,
    reflections: true,
  },
  high: {
    panelSegments: 32,
    sideSegments: 16,
    hexDetail: true,
    hudRingSegments: 48,
    scanLines: 12,
    barrelDistortion: true,
    reflections: true,
  },
  medium: {
    panelSegments: 24,
    sideSegments: 12,
    hexDetail: false,
    hudRingSegments: 32,
    scanLines: 8,
    barrelDistortion: false,
    reflections: false,
  },
  low: {
    panelSegments: 16,
    sideSegments: 8,
    hexDetail: false,
    hudRingSegments: 16,
    scanLines: 6,
    barrelDistortion: false,
    reflections: false,
  },
} as const;

// ■■ Triangle Budget Breakdown (CPA v2.0) ■■
export const TRIANGLE_BUDGET_V2 = {
  cockpitShell: {
    cockpitPanels: { desktop: 1500, tablet: 800, mobile: 0 },
    hexClusters:   { desktop: 300,  tablet: 200, mobile: 0 },
    holographicHUD:{ desktop: 600,  tablet: 400, mobile: 0 },
    sidePanels:    { desktop: 200,  tablet: 100, mobile: 0 },
    statusBar3D:   { desktop: 300,  tablet: 200, mobile: 0 },
    ledRim:        { desktop: 1500, tablet: 800, mobile: 0 },
  },
  spatialContent: {
    holographicLabMap:   { desktop: 28000, tablet: 12000, mobile: 0 },
    labStructures:       { desktop: 25000, tablet: 10000, mobile: 0 },
    interactiveConsoles: { desktop: 6000,  tablet: 3000,  mobile: 0 },
    ambientNPCs:         { desktop: 4000,  tablet: 2000,  mobile: 0 },
    petCompanion:        { desktop: 1500,  tablet: 800,   mobile: 0 },
    dynamicEnvironment:  { desktop: 15000, tablet: 5000,  mobile: 0 },
    ambientParticles:    { desktop: 5000,  tablet: 2000,  mobile: 0 },
  },
  transitionPeak: {
    wormhole:  { desktop: 2500, tablet: 1500, mobile: 0 },
    ceremony:  { desktop: 3000, tablet: 1000, mobile: 0 },
  },
} as const;

// ■■ Adaptive FPS Degradation Thresholds ■■
export const FPS_DEGRADATION = {
  full:           { min: 0.9,  action: 'Full quality' },
  reduceParticle: { min: 0.8,  action: 'Reduce particle counts by 30%' },
  dropLOD:        { min: 0.6,  action: 'Drop to next LOD level, disable BarrelDistortion' },
  disableHUD:     { min: 0.4,  action: 'Disable HolographicHUD, reduce NPC count by half' },
  cssFallback:    { min: 0.0,  action: 'Disable all cockpit 3D, fall back to CSS frame' },
} as const;

// ■■ Progressive Enhancement Thresholds (CPA2-9) ■■
export const COCKPIT_FEATURE_THRESHOLDS = {
  fullCockpit3D:    { minWidth: 1024, minGPU: 'medium' as const },
  reducedCockpit3D: { minWidth: 768,  minGPU: 'low' as const },
  cssOnly:          { minWidth: 0,    minGPU: 'any' as const },
} as const;

// ■■ Type exports for consumers ■■
export type StationModeKey = keyof typeof BLOOM_PRESETS;
export type SidePanelContent = 'radar' | 'labNav' | 'terminal' | 'stats';
```

---

## Step 20d: Cockpit Audio Engine (CPA v2.0)

**File:** `src/lib/audio/cockpitAudio.ts`

> CPA v2.0: Spatial audio engine for cockpit — skin-specific soundscapes, positional audio zones, and celebration SFX. Built on Web Audio API (upgradeable to Tone.js Panner3D for spatial positioning).

```typescript
// ================================================================
// CPA v2.0 — Cockpit Audio Engine
// ================================================================
// Manages: spatial audio zones, skin-specific ambient, transition SFX,
// celebration sounds, listener position tracking.
// Respects: uiStore.soundEnabled + accessibilityStore.reduceMotion

import type { CockpitSkin } from '@/types';

// Skin-specific ambient frequencies
const SKIN_AMBIENT: Record<CockpitSkin, { note: number; type: OscillatorType }> = {
  default:    { note: 65.41, type: 'sine' },        // C2
  cyberpunk:  { note: 87.31, type: 'sawtooth' },    // F2 (filtered)
  space:      { note: 65.41, type: 'sine' },         // Cm drone
  underwater: { note: 73.42, type: 'sine' },         // D2 (bandpass)
  crystal:    { note: 110.0, type: 'sine' },         // A2 (glass harmonica)
};

export class CockpitAudioEngine {
  private context: AudioContext | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private currentSkin: CockpitSkin = 'default';
  private disposed = false;

  async initialize(skin: CockpitSkin): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      this.context = new AudioContext();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.setValueAtTime(0.15, this.context.currentTime);
      this.masterGain.connect(this.context.destination);
      this.currentSkin = skin;
    } catch {
      // Audio not available
    }
  }

  updateListenerPosition(_position: [number, number, number]): void {
    // Spatial positioning — implemented with Tone.js Panner3D in full build
    // Web Audio API listener position update placeholder
  }

  async transitionToSkin(newSkin: CockpitSkin, duration: number): Promise<void> {
    if (!this.context || !this.masterGain) return;
    // Fade out current ambient
    if (this.ambientGain) {
      this.ambientGain.gain.exponentialRampToValueAtTime(
        0.001, this.context.currentTime + duration * 0.4
      );
    }
    // After fade out, start new ambient
    setTimeout(() => {
      if (this.disposed) return;
      this.stopAmbient();
      this.startAmbient(newSkin);
      this.currentSkin = newSkin;
    }, duration * 400);
  }

  startAmbient(skin?: CockpitSkin): void {
    if (!this.context || !this.masterGain) return;
    const s = skin || this.currentSkin;
    const config = SKIN_AMBIENT[s];
    this.ambientOsc = this.context.createOscillator();
    this.ambientGain = this.context.createGain();
    this.ambientOsc.type = config.type;
    this.ambientOsc.frequency.setValueAtTime(config.note, this.context.currentTime);
    this.ambientGain.gain.setValueAtTime(0.02, this.context.currentTime);
    this.ambientOsc.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);
    this.ambientOsc.start();
  }

  private stopAmbient(): void {
    if (this.ambientOsc) {
      try { this.ambientOsc.stop(); } catch { /* already stopped */ }
      this.ambientOsc = null;
    }
    if (this.ambientGain) {
      this.ambientGain.disconnect();
      this.ambientGain = null;
    }
  }

  playSpatial(soundId: string, _position: [number, number, number]): void {
    if (!this.context || !this.masterGain) return;
    // Short click/tone for UI feedback — full spatial impl in Tone.js upgrade
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const freq = soundId === 'hex-click' ? 3000 : soundId === 'console-open' ? 800 : 1200;
    osc.frequency.setValueAtTime(freq, this.context.currentTime);
    gain.gain.setValueAtTime(0.08, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.context.currentTime + 0.1);
  }

  setVolume(volume: number): void {
    if (this.masterGain && this.context) {
      this.masterGain.gain.setValueAtTime(volume, this.context.currentTime);
    }
  }

  dispose(): void {
    this.disposed = true;
    this.stopAmbient();
    if (this.context) {
      this.context.close();
      this.context = null;
    }
  }
}
```

---

## Step 20e: useAdaptiveCockpit Hook (CPA v2.0)

**File:** `src/hooks/useAdaptiveCockpit.ts`

> CPA v2.0 Decision CPA2-2: Viewport-adaptive curvature. Returns arc degrees, panel radius, and curvature based on window width with debounced resize listener.

```typescript
'use client';

import { useState, useEffect } from 'react';
import { ADAPTIVE_CURVATURE, COCKPIT_GEOMETRY_V2 } from '@/lib/3d/cockpitConfig';

interface AdaptiveCockpitParams {
  arcDegrees: number;
  panelRadius: number;
  curvature: number;
  isCSSFallback: boolean;
}

export function useAdaptiveCockpit(): AdaptiveCockpitParams {
  const [params, setParams] = useState<AdaptiveCockpitParams>({
    arcDegrees: COCKPIT_GEOMETRY_V2.totalWrapArc,
    panelRadius: COCKPIT_GEOMETRY_V2.panelRadius,
    curvature: COCKPIT_GEOMETRY_V2.panelCurvature,
    isCSSFallback: false,
  });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    function calculate() {
      const w = window.innerWidth;
      if (w >= ADAPTIVE_CURVATURE.ultraWide.minWidth) {
        setParams({
          arcDegrees: ADAPTIVE_CURVATURE.ultraWide.arc,
          panelRadius: ADAPTIVE_CURVATURE.ultraWide.radius,
          curvature: COCKPIT_GEOMETRY_V2.panelCurvature,
          isCSSFallback: false,
        });
      } else if (w >= ADAPTIVE_CURVATURE.desktop.minWidth) {
        setParams({
          arcDegrees: ADAPTIVE_CURVATURE.desktop.arc,
          panelRadius: ADAPTIVE_CURVATURE.desktop.radius,
          curvature: COCKPIT_GEOMETRY_V2.panelCurvature,
          isCSSFallback: false,
        });
      } else if (w >= ADAPTIVE_CURVATURE.tablet.minWidth) {
        setParams({
          arcDegrees: ADAPTIVE_CURVATURE.tablet.arc,
          panelRadius: ADAPTIVE_CURVATURE.tablet.radius,
          curvature: COCKPIT_GEOMETRY_V2.panelCurvature * 0.8,
          isCSSFallback: false,
        });
      } else {
        setParams({
          arcDegrees: 0,
          panelRadius: 0,
          curvature: 0,
          isCSSFallback: true,
        });
      }
    }

    calculate();

    function handleResize() {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculate, 150);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return params;
}
```

---

## Step 20f: Jotai Atoms for 3D State (Enhancement 8.1)

**File:** `src/stores/cockpitAtoms.ts`

> **Enhancement 8.1:** Jotai atoms for fine-grained 3D state that updates at high frequency
> (shader uniforms, particle counts, HUD values). Using atoms instead of Zustand for these
> values avoids full-store re-renders on every frame tick. Zustand remains the primary store
> for coarse app state — Jotai complements it for performance-sensitive 3D values.

```typescript
import { atom } from 'jotai';

// ═══ Shader Uniforms (updated per-frame or on interaction) ═══
export const bloomIntensityAtom = atom(0.4);
export const vignettedarknessAtom = atom(0.5);
export const barrelDistortionAtom = atom(0.02);
export const hudOpacityAtom = atom(0.15);
export const hudRotationSpeedAtom = atom(0.1);
export const hudPulseIntensityAtom = atom(0.3);

// ═══ Particle System (updated on mode change / FPS degradation) ═══
export const particleCountAtom = atom(50);
export const particleSpeedAtom = atom(1.0);

// ═══ Camera Interpolation (updated per-frame during transitions) ═══
export const cameraPositionAtom = atom<[number, number, number]>([0, 6.5, 7]);
export const cameraLookAtAtom = atom<[number, number, number]>([0, -0.5, 0]);
export const cameraFovAtom = atom(58);

// ═══ LOD State (updated on FPS degradation) ═══
export const currentLODLevelAtom = atom<'ultra' | 'high' | 'medium' | 'low' | 'billboard'>('high');
export const triangleBudgetUsedAtom = atom(0);
export const fpsRatioAtom = atom(1.0); // actual FPS / target FPS

// ═══ WebGPU State (Enhancement 8.2) ═══
export const rendererTypeAtom = atom<'webgpu' | 'webgl2' | 'webgl'>('webgl2');
export const gpuTierAtom = atom<'high' | 'medium' | 'low'>('medium');
```

---

## Step 20g: Sentry Configuration (Enhancement 8.1)

> **Enhancement 8.1:** Sentry provides error tracking, performance monitoring, and session replay.
> Three config files are needed for Next.js: client, server, and edge runtime.

**File:** `sentry.client.config.ts` (project root)

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring — sample 10% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay — capture 1% of sessions, 100% on error
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,       // COPPA: mask all text for child privacy
      blockAllMedia: true,     // COPPA: block media capture
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Filter out noisy errors
  ignoreErrors: [
    'ResizeObserver loop',
    'Non-Error promise rejection',
    /Loading chunk \d+ failed/,
  ],

  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
});
```

**File:** `sentry.server.config.ts` (project root)

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
});
```

**File:** `sentry.edge.config.ts` (project root)

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
});
```

**File:** `src/app/global-error.tsx`

```typescript
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="font-body antialiased bg-surface-deep text-white min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="font-display text-2xl mb-4">Something went wrong!</h2>
          <p className="text-white/60 mb-6">Our team has been notified.</p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-neon-blue/20 border border-neon-blue/40 rounded-lg
                       hover:bg-neon-blue/30 transition-colors font-body"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
```

---

## Step 20h: WebGPU Renderer Utilities (Enhancement 8.2)

**File:** `src/lib/3d/webgpuDetect.ts`

> **Enhancement 8.2:** WebGPU auto-detection with WebGL2 fallback. The renderer type is stored
> in a Jotai atom so all 3D components can adapt their shader strategy (TSL vs GLSL).

```typescript
import { rendererTypeAtom, gpuTierAtom } from '@/stores/cockpitAtoms';

/**
 * Detect WebGPU support and GPU capability tier.
 * Called once during CockpitCanvas initialization (Stage 3 Part 3).
 * Results stored in Jotai atoms for global access.
 */
export async function detectRendererCapability(): Promise<{
  renderer: 'webgpu' | 'webgl2' | 'webgl';
  gpuTier: 'high' | 'medium' | 'low';
}> {
  // Check WebGPU support
  if ('gpu' in navigator) {
    try {
      const adapter = await (navigator as Navigator & { gpu: GPU }).gpu.requestAdapter();
      if (adapter) {
        const info = await adapter.requestAdapterInfo();
        // Determine GPU tier from adapter limits
        const maxTexSize = adapter.limits.maxTextureDimension2D;
        const gpuTier = maxTexSize >= 16384 ? 'high' : maxTexSize >= 8192 ? 'medium' : 'low';
        return { renderer: 'webgpu', gpuTier };
      }
    } catch {
      // WebGPU failed, fall through to WebGL2
    }
  }

  // Check WebGL2 support
  const canvas = document.createElement('canvas');
  const gl2 = canvas.getContext('webgl2');
  if (gl2) {
    const debugInfo = gl2.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl2.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
    const isHighEnd = /RTX|RX 6|RX 7|M[1-3] (Pro|Max|Ultra)|Apple GPU/i.test(renderer);
    return { renderer: 'webgl2', gpuTier: isHighEnd ? 'high' : 'medium' };
  }

  // Fallback to basic WebGL
  return { renderer: 'webgl', gpuTier: 'low' };
}

/**
 * TSL Shader Migration Status (Enhancement 8.2)
 *
 * Three.js r170+ includes TSL (Three.js Shading Language) as a JavaScript-based
 * alternative to GLSL. TSL shaders are portable across WebGPU and WebGL renderers.
 *
 * Migration strategy: GRADUAL — both GLSL and TSL work simultaneously.
 * - New shaders written in TSL
 * - Existing 19 GLSL shaders migrated one-at-a-time as labs are updated
 * - GLSL shaders continue to work on WebGL2 renderer
 * - TSL shaders automatically compile to WGSL (WebGPU) or GLSL (WebGL) as needed
 *
 * Shaders to migrate (19 total):
 * 1-10: labPattern1.glsl through labPattern10.glsl (lab backgrounds)
 * 11: liquidMetal.glsl (Stage 5 — badge shader)
 * 12: holographic.glsl (Stage 5 — holographic badge)
 * 13: energyField.glsl (Stage 5 — energy field effect)
 * 14: dissolveTransition.glsl (CPA v2.0 — skin transitions)
 * 15: wormholeEffect.glsl (CPA v2.0 — lab entry)
 * 16: hexCluster.glsl (CPA v2.0 — data hex display)
 * 17: scanline.glsl (Stage 3 — CRT overlay)
 * 18: aurora.glsl (Stage 3 — background)
 * 19: barrelDistortion.glsl (CPA v2.0 — lens effect)
 */
export const TSL_MIGRATION_STATUS: Record<string, 'glsl' | 'tsl' | 'both'> = {
  // All start as GLSL, migrated to TSL during Enhancement implementation
  labPattern1: 'glsl', labPattern2: 'glsl', labPattern3: 'glsl',
  labPattern4: 'glsl', labPattern5: 'glsl', labPattern6: 'glsl',
  labPattern7: 'glsl', labPattern8: 'glsl', labPattern9: 'glsl',
  labPattern10: 'glsl',
  liquidMetal: 'glsl', holographic: 'glsl', energyField: 'glsl',
  dissolveTransition: 'glsl', wormholeEffect: 'glsl', hexCluster: 'glsl',
  scanline: 'glsl', aurora: 'glsl', barrelDistortion: 'glsl',
};
```

---

## Step 20i: Vitest Configuration (Enhancement 8.5)

**File:** `vitest.config.ts` (project root)

> **Enhancement 8.5:** Vitest configuration for unit and integration testing.
> Playwright configuration for E2E tests is added in Stage 10 Part 1.

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/types/**',
        'src/app/**/layout.tsx',
        'src/app/**/loading.tsx',
        'src/shaders/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**File:** `tests/setup.ts`

```typescript
import '@testing-library/jest-dom/vitest';

// Mock window.matchMedia for component tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
} as unknown as typeof IntersectionObserver;
```

---

## Step 21: Hooks

### useDebounce

**File:** `src/hooks/useDebounce.ts`

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

### useLocalStorage

**File:** `src/hooks/useLocalStorage.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(`sparkforge-${key}`);
      if (item !== null) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "sparkforge-${key}":`, error);
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const newValue = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(`sparkforge-${key}`, JSON.stringify(newValue));
        } catch (error) {
          console.warn(`Error writing localStorage key "sparkforge-${key}":`, error);
        }
        return newValue;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}
```

### useMediaQuery

**File:** `src/hooks/useMediaQuery.ts`

```typescript
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
```

### useIsMobile

**File:** `src/hooks/useIsMobile.ts`

```typescript
import { useMediaQuery } from './useMediaQuery';

export function useIsMobile(breakpoint = 768): boolean {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}
```

---

## Step 22: Feature Flags

**File:** `src/lib/feature-flags.ts`

```typescript
export type FeatureFlag =
  | 'WELCOME_ACHIEVEMENT'
  | 'LEVEL_CEREMONY'
  | 'PARENT_DASHBOARD'
  | 'CONTENT_AGENT'
  | 'OFFLINE_MODE';

function readFlag(flag: FeatureFlag): boolean {
  if (typeof window === 'undefined' && typeof process === 'undefined') return false;
  const envKey = `NEXT_PUBLIC_FF_${flag}`;
  const value = process.env[envKey];
  return value === 'true' || value === '1';
}

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return readFlag(flag);
}

export function getAllFlags(): Record<FeatureFlag, boolean> {
  const flags: FeatureFlag[] = [
    'WELCOME_ACHIEVEMENT',
    'LEVEL_CEREMONY',
    'PARENT_DASHBOARD',
    'CONTENT_AGENT',
    'OFFLINE_MODE',
  ];
  return Object.fromEntries(flags.map(f => [f, readFlag(f)])) as Record<FeatureFlag, boolean>;
}
```

---

## Step 23: System Preferences Hook

**File:** `src/hooks/useSystemPreferences.ts`

```typescript
import { useState, useEffect } from 'react';

export interface SystemPreferences {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  timezone: string;
  colorScheme: 'dark' | 'light';
}

const DEFAULT_PREFS: SystemPreferences = {
  prefersReducedMotion: false,
  prefersHighContrast: false,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  timezone: 'UTC',
  colorScheme: 'dark',
};

export function useSystemPreferences(): SystemPreferences {
  const [prefs, setPrefs] = useState<SystemPreferences>(DEFAULT_PREFS);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const highContrast = window.matchMedia('(prefers-contrast: more)').matches;
    const colorScheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    const width = window.innerWidth;

    setPrefs({
      prefersReducedMotion: reducedMotion,
      prefersHighContrast: highContrast,
      isMobile: width < 640,
      isTablet: width >= 640 && width < 1024,
      isDesktop: width >= 1024,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      colorScheme: colorScheme as 'dark' | 'light',
    });

    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    }

    if (reducedMotion) {
      document.documentElement.style.setProperty('--animation-speed', '0');
    }
  }, []);

  return prefs;
}
```

---

## Step 24: QueryProvider

**File:** `src/components/providers/QueryProvider.tsx`

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

## Step 25: Root Layout (Initial)

**File:** `src/app/layout.tsx`

> **Note:** This is the Stage 1 initial layout. Stage 10 Part 2 REPLACES this with
> production SEO, a11y provider, error boundary, PWA manifest, and viewport config.

```typescript
import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'SparkForge — Where Curiosity Meets AI',
  description: 'The gamified AI learning platform for kids ages 7-16.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700;800&family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Orbitron:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-surface-base text-white min-h-screen">
        <QueryProvider>
          <main>{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
```

---

## Step 26: Create .gitkeep Placeholders

Add `.gitkeep` files to empty directories that won't have files until later stages:

```bash
touch src/config/.gitkeep
touch src/shaders/labPatterns/.gitkeep
touch public/images/.gitkeep
touch public/sounds/.gitkeep
touch public/fonts/.gitkeep
touch public/models/pets/.gitkeep
touch public/hdri/.gitkeep
```

---

## Validation

After completing all steps (11-26):

```bash
npm run build
```

Expected: Build succeeds. TypeScript compiles with no errors.

```bash
npx tsc --noEmit
```

Expected: No type errors.

```bash
npm run dev
```

Expected: Dev server starts on `localhost:3000`. Renders (blank page or default). No console errors.

---

## Commit

```bash
git add -A
git commit -m "Stage 1 Part 2: Types, stores, hooks, utils"
```

---

## Stage 1 Complete — Tag

After both Part 1 and Part 2 are validated:

```bash
git tag -a v0.1.0 -m "Stage 1 complete: Foundation"
```

---

## Files Created in Stage 1

| File | Step | Purpose |
|------|------|---------|
| `tsconfig.json` | 3 | TypeScript configuration |
| `tailwind.config.ts` | 4 | Tailwind CSS + Frost-Prismatic theme |
| `postcss.config.js` | 5 | PostCSS plugins |
| `next.config.ts` | 6 | Next.js configuration |
| `.env.example` | 7 | Environment variable template |
| `src/app/globals.css` | 8 | Global CSS + design system |
| `.gitignore` | 9 | Git ignore rules |
| `src/types/index.ts` | 11 | Full type system + constants |
| `src/lib/utils.ts` | 12 | Utility functions |
| `src/lib/supabase/client.ts` | 13 | Browser Supabase client |
| `src/lib/supabase/server.ts` | 13 | Server + Admin Supabase clients |
| `src/middleware.ts` | 14 | Auth route protection |
| `src/lib/animations.ts` | 15 | 45+ Motion variants |
| `src/stores/authStore.ts` | 16 | Auth state (Zustand) |
| `src/stores/childStore.ts` | 17 | Child state with persistence |
| `src/stores/gameStore.ts` | 18 | Game state machine |
| `src/stores/toastStore.ts` | 19 | Toast notifications |
| `src/stores/uiStore.ts` | 20 | UI state (sidebar, celebrations, skipIntroAnimation) |
| `src/stores/deviceStore.ts` | 20a | Device type + LOD profile + GPUTier (CPA v2.0 + Hero v2.0) |
| `src/stores/cockpitStore.ts` | 20b | Cockpit spatial nav + skin + ceremony queue (CPA v2.0) |
| `src/lib/3d/cockpitConfig.ts` | 20c | Cockpit geometry, bloom, HUD, LOD presets (CPA v2.0) |
| `src/lib/audio/cockpitAudio.ts` | 20d | CockpitAudioEngine spatial audio class (CPA v2.0) |
| `src/hooks/useAdaptiveCockpit.ts` | 20e | Viewport-adaptive curvature hook (CPA v2.0) |
| `src/hooks/useDebounce.ts` | 21 | Value debouncing |
| `src/hooks/useLocalStorage.ts` | 21 | SSR-safe localStorage |
| `src/hooks/useMediaQuery.ts` | 21 | SSR-safe media queries |
| `src/hooks/useIsMobile.ts` | 21 | Mobile detection for 3D fallback |
| `src/lib/feature-flags.ts` | 22 | Environment-based feature gates |
| `src/hooks/useSystemPreferences.ts` | 23 | OS accessibility detection |
| `src/components/providers/QueryProvider.tsx` | 24 | React Query wrapper |
| `src/app/layout.tsx` | 25 | Root layout (initial) |

| `src/lib/webgpuDetection.ts` | — | GPU tier detection for hero animation (Hero v2.0) |

**Total files created in Stage 1:** 32 source files + 30+ directories (includes 5 CPA v2.0 + 1 Hero v2.0 files)

> **Hero Animation v2.0 — Additional source files** created in Stage 3 Part 3A:
> `src/lib/3d/heroParticleCompute.ts`, `src/lib/3d/heroParticleRender.ts`,
> `src/lib/3d/voronoiFracture.ts`, `src/lib/3d/heroSplines.ts`,
> `src/lib/audio/heroAudio.ts`, `src/hooks/useHeroAnimation.ts`,
> `src/components/3d/HeroAnimation.tsx`. See Implementation Plan Hero Animation v2.0.

---

## What's Next: Stage 2

Stage 2 creates the database schema, API routes, and Zod validation schemas.
**HARD STOP HS-1:** Before starting Stage 2, you need Supabase project credentials in `.env.local`.
