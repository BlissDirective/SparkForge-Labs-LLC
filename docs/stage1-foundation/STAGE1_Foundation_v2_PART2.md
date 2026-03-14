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
- **Animations** — 45+ Framer Motion variants + spring presets
- **Stores** — 4 Zustand stores (auth, child, game, toast) + uiStore
- **Hooks** — 4 utility hooks (useDebounce, useLocalStorage, useMediaQuery, useIsMobile)
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

Contains 45+ Framer Motion variants organized by category:

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
import { type Variants, type Transition } from 'framer-motion';

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
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  triggerCelebration: (type: CelebrationType, data?: Record<string, unknown>) => void;
  dismissCelebration: () => void;
  setLabColor: (color: string, tint?: string) => void;
  toggleSound: () => void;
  markDailyChallengeComplete: () => void;
  resetDailyChallenge: () => void;
  setParticleIntensity: (level: 'off' | 'low' | 'medium' | 'high') => void;
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
}));
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
| `next.config.js` | 6 | Next.js configuration |
| `.env.example` | 7 | Environment variable template |
| `src/app/globals.css` | 8 | Global CSS + design system |
| `.gitignore` | 9 | Git ignore rules |
| `src/types/index.ts` | 11 | Full type system + constants |
| `src/lib/utils.ts` | 12 | Utility functions |
| `src/lib/supabase/client.ts` | 13 | Browser Supabase client |
| `src/lib/supabase/server.ts` | 13 | Server + Admin Supabase clients |
| `src/middleware.ts` | 14 | Auth route protection |
| `src/lib/animations.ts` | 15 | 45+ Framer Motion variants |
| `src/stores/authStore.ts` | 16 | Auth state (Zustand) |
| `src/stores/childStore.ts` | 17 | Child state with persistence |
| `src/stores/gameStore.ts` | 18 | Game state machine |
| `src/stores/toastStore.ts` | 19 | Toast notifications |
| `src/stores/uiStore.ts` | 20 | UI state (sidebar, celebrations) |
| `src/hooks/useDebounce.ts` | 21 | Value debouncing |
| `src/hooks/useLocalStorage.ts` | 21 | SSR-safe localStorage |
| `src/hooks/useMediaQuery.ts` | 21 | SSR-safe media queries |
| `src/hooks/useIsMobile.ts` | 21 | Mobile detection for 3D fallback |
| `src/lib/feature-flags.ts` | 22 | Environment-based feature gates |
| `src/hooks/useSystemPreferences.ts` | 23 | OS accessibility detection |
| `src/components/providers/QueryProvider.tsx` | 24 | React Query wrapper |
| `src/app/layout.tsx` | 25 | Root layout (initial) |

**Total files created in Stage 1:** 26 source files + 30+ directories

---

## What's Next: Stage 2

Stage 2 creates the database schema, API routes, and Zod validation schemas.
**HARD STOP HS-1:** Before starting Stage 2, you need Supabase project credentials in `.env.local`.
