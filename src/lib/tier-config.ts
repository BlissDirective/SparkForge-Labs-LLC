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
      offlineMode: true,
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

// ═══════════════════════════════════════════════════════
// v3 Gap 2 — TRIAL CONFIGURATION
// Days of free trial offered on each paid tier's first
// subscription. Set to 0 to disable the trial for that tier.
// Change here — no other file edits needed.
// ═══════════════════════════════════════════════════════

export const TRIAL_DAYS: Record<Exclude<SubscriptionTier, 'free'>, number> = {
  plus: 7,
  forge: 7,
};

/** Whether a parent is currently within a trial window. */
export function isInTrial(parent: {
  trial_ends_at?: string | null;
  subscription_status?: string | null;
}): boolean {
  if (!parent.trial_ends_at) return false;
  const ends = new Date(parent.trial_ends_at).getTime();
  if (Number.isNaN(ends)) return false;
  return ends > Date.now();
}

/** Whole days remaining in a trial (rounded up). Zero if not in trial. */
export function getTrialDaysRemaining(
  trialEndsAt: string | null | undefined
): number {
  if (!trialEndsAt) return 0;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

/** Milliseconds remaining in a trial. Zero if not in trial. */
export function getTrialMsRemaining(
  trialEndsAt: string | null | undefined
): number {
  if (!trialEndsAt) return 0;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return 0;
  return ms;
}

// ═══════════════════════════════════════════════════════
// v3 Gap 3 — FEATURE DELTA (for downgrade confirmation)
// Returns human-readable lists of what a parent gains or
// loses when switching between two tiers. Used by the
// DowngradeConfirmModal to show transparent upgrade/downgrade
// consequences.
// ═══════════════════════════════════════════════════════

const FEATURE_LABELS: Record<keyof TierLimits['features'], string> = {
  promptLab: 'Prompt Lab',
  dailyChallenge: 'Daily Challenge',
  leaderboard: 'Leaderboard',
  avatarShop: 'Avatar Shop',
  exportProgress: 'Progress export',
  offlineMode: 'Offline content access',
  prioritySupport: 'Priority support',
};

export interface FeatureDelta {
  lost: string[];
  gained: string[];
}

export function getFeatureDelta(
  from: SubscriptionTier,
  to: SubscriptionTier
): FeatureDelta {
  const fromLimits = TIER_CONFIG[from];
  const toLimits = TIER_CONFIG[to];
  const lost: string[] = [];
  const gained: string[] = [];

  // ── Child profile limit ──
  if (fromLimits.maxChildren > toLimits.maxChildren) {
    lost.push(
      `Child profiles reduced to ${toLimits.maxChildren} (from ${fromLimits.maxChildren})`
    );
  } else if (fromLimits.maxChildren < toLimits.maxChildren) {
    gained.push(
      `Child profiles increased to ${toLimits.maxChildren} (from ${fromLimits.maxChildren})`
    );
  }

  // ── Prompt Lab daily quota ──
  if (fromLimits.promptsPerDay > toLimits.promptsPerDay) {
    lost.push(
      `Prompt Lab reduced to ${toLimits.promptsPerDay}/day (from ${fromLimits.promptsPerDay})`
    );
  } else if (fromLimits.promptsPerDay < toLimits.promptsPerDay) {
    gained.push(
      `Prompt Lab increased to ${toLimits.promptsPerDay}/day (from ${fromLimits.promptsPerDay})`
    );
  }

  // ── Games per week ──
  const fromGames = fromLimits.gamesPerWeek;
  const toGames = toLimits.gamesPerWeek;
  if (fromGames === null && toGames !== null) {
    lost.push(`Games limited to ${toGames}/week (was unlimited)`);
  } else if (fromGames !== null && toGames === null) {
    gained.push('Unlimited games per week');
  } else if (fromGames !== null && toGames !== null && fromGames > toGames) {
    lost.push(`Games reduced to ${toGames}/week (from ${fromGames})`);
  } else if (fromGames !== null && toGames !== null && fromGames < toGames) {
    gained.push(`Games increased to ${toGames}/week (from ${fromGames})`);
  }

  // ── Labs (full-access count) ──
  const fromLabs = fromLimits.freeLabsAccess.length;
  const toLabs = toLimits.freeLabsAccess.length;
  if (fromLabs > toLabs) {
    lost.push(`Full access to ${fromLabs - toLabs} labs`);
  } else if (fromLabs < toLabs) {
    gained.push(`Full access to ${toLabs - fromLabs} more labs`);
  }

  // ── Boolean features ──
  for (const [key, fromVal] of Object.entries(fromLimits.features) as Array<
    [keyof TierLimits['features'], boolean]
  >) {
    const toVal = toLimits.features[key];
    if (fromVal && !toVal) lost.push(FEATURE_LABELS[key]);
    if (!fromVal && toVal) gained.push(FEATURE_LABELS[key]);
  }

  return { lost, gained };
}

/** True if moving from -> to is a downgrade (fewer features/limits). */
export function isDowngrade(from: SubscriptionTier, to: SubscriptionTier): boolean {
  if (from === to) return false;
  const order: Record<SubscriptionTier, number> = { free: 0, plus: 1, forge: 2 };
  return order[to] < order[from];
}
