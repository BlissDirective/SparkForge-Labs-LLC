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
// Replace with your actual Stripe price IDs after creating products
export const STRIPE_PRICES = {
  plus: {
    month: process.env.STRIPE_PRICE_PLUS_MONTHLY || 'price_placeholder_plus_monthly',
    year: process.env.STRIPE_PRICE_PLUS_YEARLY || 'price_placeholder_plus_yearly',
  },
  forge: {
    month: process.env.STRIPE_PRICE_FORGE_MONTHLY || 'price_placeholder_forge_monthly',
    year: process.env.STRIPE_PRICE_FORGE_YEARLY || 'price_placeholder_forge_yearly',
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
