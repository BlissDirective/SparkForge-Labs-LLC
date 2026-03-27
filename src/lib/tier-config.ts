// ════════════════════════════════════════════════════
// SUBSCRIPTION TIER CONFIGURATION
// Single source of truth for free/plus/forge limits.
// ════════════════════════════════════════════════════

export type SubscriptionTier = 'free' | 'plus' | 'forge';

export interface TierLimits {
  promptsPerDay: number;
  gamesPerWeek: number | null; // null = unlimited
  maxChildren: number;
  freeLabsAccess: number[];    // Labs with full access
  previewLabs: number[];       // Labs with first-lesson-only access
  lockedLabs: number[];        // No access
  features: {
    promptLab: boolean;
    dailyChallenge: boolean;
    leaderboard: boolean;
    avatarShop: boolean;
    exportProgress: boolean;
    offlineMode: boolean;
    prioritySupport: boolean;
  };
}

export const TIER_CONFIG: Record<SubscriptionTier, TierLimits> = {
  free: {
    promptsPerDay: 5,
    gamesPerWeek: 3,
    maxChildren: 1,
    freeLabsAccess: [1, 2, 3],
    previewLabs: [4, 5, 6, 7, 8, 9, 10],
    lockedLabs: [],
    features: {
      promptLab: true,
      dailyChallenge: true,
      leaderboard: false,
      avatarShop: false,
      exportProgress: false,
      offlineMode: false,
      prioritySupport: false,
    },
  },
  plus: {
    promptsPerDay: 50,
    gamesPerWeek: null,
    maxChildren: 3,
    freeLabsAccess: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    previewLabs: [],
    lockedLabs: [],
    features: {
      promptLab: true,
      dailyChallenge: true,
      leaderboard: true,
      avatarShop: true,
      exportProgress: true,
      offlineMode: false,
      prioritySupport: false,
    },
  },
  forge: {
    promptsPerDay: 200,
    gamesPerWeek: null,
    maxChildren: 5,
    freeLabsAccess: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    previewLabs: [],
    lockedLabs: [],
    features: {
      promptLab: true,
      dailyChallenge: true,
      leaderboard: true,
      avatarShop: true,
      exportProgress: true,
      offlineMode: true,
      prioritySupport: true,
    },
  },
};

// ═══ STRIPE PRICE IDS ═══
// S2-WARN-001: Env var names aligned with .env.example (authoritative source)
// Replace with your actual Stripe price IDs after creating products
export const STRIPE_PRICES = {
  plus: {
    month: process.env.STRIPE_PLUS_MONTHLY_ID || 'price_placeholder_plus_monthly',
    year: process.env.STRIPE_PLUS_YEARLY_ID || 'price_placeholder_plus_yearly',
  },
  forge: {
    month: process.env.STRIPE_FORGE_MONTHLY_ID || 'price_placeholder_forge_monthly',
    year: process.env.STRIPE_FORGE_YEARLY_ID || 'price_placeholder_forge_yearly',
  },
} as const;

// ═══ HELPER FUNCTIONS ═══

export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_CONFIG[tier];
}

export function canCreateChild(tier: SubscriptionTier, currentChildCount: number): boolean {
  return currentChildCount < TIER_CONFIG[tier].maxChildren;
}

export function isLabAccessible(tier: SubscriptionTier, labId: number): 'full' | 'preview' | 'locked' {
  const config = TIER_CONFIG[tier];
  if (config.freeLabsAccess.includes(labId)) return 'full';
  if (config.previewLabs.includes(labId)) return 'preview';
  return 'locked';
}

export function canUsePromptLab(tier: SubscriptionTier, promptsUsedToday: number): boolean {
  return promptsUsedToday < TIER_CONFIG[tier].promptsPerDay;
}

export function canPlayGame(tier: SubscriptionTier, gamesPlayedThisWeek: number): boolean {
  const limit = TIER_CONFIG[tier].gamesPerWeek;
  if (limit === null) return true;
  return gamesPlayedThisWeek < limit;
}

export function hasFeature(tier: SubscriptionTier, feature: keyof TierLimits['features']): boolean {
  return TIER_CONFIG[tier].features[feature];
}

// ═══════════════════════════════════════════════════════
// STAGE 8 ADDITIONS — Pricing display & plan metadata
// Appended to existing tier-config.ts to avoid duplicate
// type conflicts (v2 BUG-8A fix)
// ═══════════════════════════════════════════════════════

export interface TierDisplayConfig {
  slug: SubscriptionTier;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  highlight?: boolean;
}

export const TIER_DISPLAY: Record<SubscriptionTier, TierDisplayConfig> = {
  free: {
    slug: 'free',
    name: 'Spark Free',
    tagline: 'Start your AI adventure',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Labs 1–3 fully unlocked',
      'Labs 4–10 first lesson free',
      '3 games per week',
      '5 Prompt Lab tries per day',
      '1 child profile',
    ],
  },
  plus: {
    slug: 'plus',
    name: 'Spark Plus',
    tagline: 'Unlock the full adventure',
    monthlyPrice: 7.99,
    yearlyPrice: 79.99,
    highlight: true,
    features: [
      'All 10 Labs fully unlocked',
      'Unlimited games',
      '50 Prompt Lab tries per day',
      '3 child profiles',
      'Parent progress reports',
      'Offline content access',
    ],
  },
  forge: {
    slug: 'forge',
    name: 'Spark Forge',
    tagline: 'The ultimate learning experience',
    monthlyPrice: 14.99,
    yearlyPrice: 149.99,
    features: [
      'Everything in Plus',
      '200 Prompt Lab tries per day',
      '5 child profiles',
      'Early access to new content',
      'Priority support',
      'Exclusive avatar items',
    ],
  },
};

export function getTierDisplayName(tier: SubscriptionTier): string {
  return TIER_DISPLAY[tier]?.name ?? 'Spark Free';
}

export function getYearlySavingsPercent(tier: SubscriptionTier): number {
  const display = TIER_DISPLAY[tier];
  if (!display || display.monthlyPrice === 0) return 0;
  const monthlyTotal = display.monthlyPrice * 12;
  return Math.round(((monthlyTotal - display.yearlyPrice) / monthlyTotal) * 100);
}
