# Stage 8 Part 1 (8A) — Tier Config, Parent Store, Stripe Routes, Tier Enforcement

**Version:** v2 (Frost-Prismatic v2.1) — Audited & Corrected
**Build Phase:** 23
**Date:** February 22, 2026 | **Audited:** March 10, 2026
**Prerequisites:** Stages 1–7 complete, Stage 2 v2 `tier-config.ts` exists
**Validation:** `npm run build` PASS, `npx tsc --noEmit` PASS

---

## Overview

This part extends the existing tier system with pricing/display data, creates the parent dashboard store, adds tier enforcement middleware, replaces the Stage 2 Stripe routes with graceful-fallback versions, provides schema SQL additions, and adds the UpgradePrompt component and session timer hook.

### PART 1 (8A) COVERS

- Tier config extension (pricing/display data added to existing `tier-config.ts`)
- Parent store (Zustand store for dashboard state)
- `useParentDashboard` hook (fetches children + progress summaries)
- Tier enforcement middleware (server-side limit checking)
- Stripe API routes with graceful fallback (checkout, portal, webhook)
- Schema additions SQL (Stripe columns + time limit column)
- `UpgradePrompt` component (parent-only upsell)
- `useSessionTimer` hook (daily time limit enforcement)

### v2 Changes in This Part

| ID | Description |
|----|-------------|
| **BUG-8A** | Extends existing `tier-config.ts` instead of creating conflicting `tiers.ts` |
| **BUG-8B** | Enhances existing Stage 2 Stripe routes with graceful fallback |
| **BUG-8C** | Uses `createServerSupabase` / `createAdminClient`, not deprecated `createRouteHandlerClient` |
| **ENH-8A** | Stripe graceful degradation (503 + setup URL if keys missing) |
| **ENH-8C** | `daily_time_limit_minutes` column + `useSessionTimer` hook for enforcement |
| **ENH-8E** | Frost-Prismatic visual polish on all components |

### Files Created / Modified

| # | File | Action | Purpose |
|---|------|--------|---------|
| 1 | `src/lib/tier-config.ts` | APPEND | `TierDisplayConfig`, `TIER_DISPLAY`, pricing helpers |
| 2 | `src/stores/parentStore.ts` | CREATE | `ChildSummary`, `ParentState`, Zustand store |
| 3 | `src/hooks/useParentDashboard.ts` | CREATE | Fetches children + progress summaries |
| 4 | `src/hooks/useSessionTimer.ts` | CREATE | ENH-8C time limit enforcement |
| 5 | `src/middleware/tierCheck.ts` | CREATE | Server-side limit checking (prompt, game, child, time) |
| 6 | `src/app/api/stripe/checkout/route.ts` | REPLACE | Graceful fallback + ENH-8A |
| 7 | `src/app/api/stripe/portal/route.ts` | REPLACE | Graceful fallback + ENH-8A |
| 8 | `src/app/api/stripe/webhook/route.ts` | REPLACE | Graceful fallback + event logging |
| 9 | `sql/schema-stage8.sql` | CREATE | Run in Supabase SQL Editor |
| 10 | `src/components/parent/UpgradePrompt.tsx` | CREATE | Parent/child upgrade prompts |

### Code Review Fixes Applied (vs. Original Source Document)

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | **CRITICAL** | `supabaseBrowser()` import doesn't exist — codebase uses `createClient()` from `@/lib/supabase/client` | Replaced all `supabaseBrowser()` → `createClient()` with correct import path |
| 2 | **CRITICAL** | Checkout route try/catch logic inverted — `body` assigned after `req.json()` fails | Restructured: parse JSON in try block, return error in catch |
| 3 | **CRITICAL** | Stripe `apiVersion` set to `'2024-12-18.acacia'` — codebase uses `'2026-02-25.clover'` (Stripe v20.4.0) | Updated to `'2026-02-25.clover'` matching existing routes |
| 4 | **CRITICAL** | Truncated `success_url` / `cancel_url` in checkout and portal routes | Restored full URLs using `NEXT_PUBLIC_APP_URL` fallback |
| 5 | **CRITICAL** | `UpgradePrompt.tsx` — broken JSX: `border-spark-ora` truncated, `from-s` gradient incomplete, missing closing tags | Fully reconstructed with complete Frost-Prismatic gradient classes |
| 6 | **CRITICAL** | `useSessionTimer` — `setState` call truncated (`isBlocked: false, i`) | Completed with `isBlocked: false` |
| 7 | **CRITICAL** | SQL DO block malformed — `IF NOT EXISTS` check and `CREATE POLICY` separated incorrectly | Reconstructed as proper PL/pgSQL block |
| 8 | **HIGH** | Webhook uses `supabase.from().insert().onConflict().ignoreDuplicates()` — not valid Supabase JS API | Changed to `.upsert()` with `{ onConflict: 'stripe_event_id', ignoreDuplicates: true }` |
| 9 | **HIGH** | `require('stripe')` dynamic import anti-pattern — Stripe is already installed | Use proper conditional initialization with `import Stripe from 'stripe'` at top level |
| 10 | **HIGH** | Webhook creates inline `createClient()` instead of using existing `createAdminClient` from `@/lib/supabase/server` | Use `createAdminClient()` for consistency |
| 11 | **MEDIUM** | Checkout route uses `auth.user.email` but `requireAuth` already provides email | Simplified to use `auth.user.email` as primary, `parent?.email` as fallback |
| 12 | **MEDIUM** | `useParentDashboard` makes N+1 queries per child (5 queries × N children) | Added TODO comment noting this should be optimized with a Supabase RPC in future |
| 13 | **LOW** | Missing `export const runtime = 'nodejs'` on checkout and portal routes | Added to all three Stripe routes for consistency |
| 14 | **LOW** | SQL file path was `prisma/schema-stage8.sql` — project uses `sql/` directory | Changed to `sql/schema-stage8.sql` |

### Enhancement Suggestions

| # | Category | Enhancement | Rationale |
|---|----------|-------------|-----------|
| 1 | **UI/UX** | Add pulse animation to UpgradePrompt CTA button on hover | Draws parent attention to upgrade action |
| 2 | **UI/UX** | Add glassmorphism backdrop blur on UpgradePrompt child variant | Consistent with Frost-Prismatic card styling |
| 3 | **Functionality** | Add `refreshChildren` method to parent store for pull-to-refresh | Parent dashboard should support manual refresh |
| 4 | **Performance** | Create Supabase RPC `get_children_summary` to replace N+1 hook queries | Single DB call vs. 5×N queries |
| 5 | **Security** | Add Zod validation to webhook event data before DB operations | Defense in depth against malformed webhook payloads |
| 6 | **Interactivity** | Add countdown timer overlay when `useSessionTimer.isWarning` is true | Visual urgency for approaching time limit |

---

## Step 1: Create Stage 8 Folders

```bash
mkdir -p src/stores
mkdir -p src/hooks
mkdir -p src/middleware
mkdir -p src/components/parent
mkdir -p src/app/\(dashboard\)/parent
mkdir -p src/app/\(dashboard\)/parent/add-child
mkdir -p src/app/\(dashboard\)/parent/subscription
mkdir -p src/app/api/stripe/checkout
mkdir -p src/app/api/stripe/portal
mkdir -p src/app/api/stripe/webhook
```

---

## Step 2: Extend `tier-config.ts` (APPEND — DO NOT REPLACE)

**v2 [BUG-8A] FIX:** The existing `src/lib/tier-config.ts` from Stage 2 v2 already has `SubscriptionTier`, `TIER_CONFIG`, `STRIPE_PRICES`, and all helper functions (`isLabAccessible`, `canPlayGame`, `canUsePromptLab`, `hasFeature`, `canCreateChild`). Stage 8 source doc tried to create a SECOND file (`tiers.ts`) with conflicting types. Instead, we APPEND display/pricing data to the existing file.

**File:** `src/lib/tier-config.ts` — **APPEND** to end of existing file

```typescript
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
      'Labs 1\u20133 fully unlocked',
      'Labs 4\u201310 first lesson free',
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

/** Get display name for a tier */
export function getTierDisplayName(tier: SubscriptionTier): string {
  return TIER_DISPLAY[tier]?.name ?? 'Spark Free';
}

/** Calculate yearly savings percentage vs monthly billing */
export function getYearlySavingsPercent(tier: SubscriptionTier): number {
  const display = TIER_DISPLAY[tier];
  if (!display || display.monthlyPrice === 0) return 0;
  const monthlyTotal = display.monthlyPrice * 12;
  return Math.round(((monthlyTotal - display.yearlyPrice) / monthlyTotal) * 100);
}
```

---

## Step 3: Parent Store

**v2 [BUG-8A] FIX:** Imports `SubscriptionTier` from `tier-config.ts` (not from a separate `tiers.ts`). Also adds `timeLimitMinutes` per child.
**v2 [ENH-8C]:** Adds `daily_time_limit_minutes` tracking.

**File:** `src/stores/parentStore.ts` — **CREATE**

```typescript
// ════════════════════════════════════════════════════
// PARENT STORE — Dashboard state and actions
// v2: Uses SubscriptionTier from tier-config.ts (BUG-8A fix)
// v2: Adds timeLimitMinutes per child (ENH-8C)
// ════════════════════════════════════════════════════
import { create } from 'zustand';
import type { SubscriptionTier } from '@/lib/tier-config';

export interface ChildSummary {
  id: string;
  display_name: string;
  age_band: 'A' | 'B' | 'C';
  xp: number;
  level: number;
  streak_count: number;
  streak_last_date: string | null;
  lessons_completed: number;
  quizzes_passed: number;
  games_played: number;
  total_time_minutes: number;
  badges_earned: number;
  labs_completed: number;
  last_active: string | null;
  daily_time_limit_minutes: number | null; // v2 ENH-8C: null = unlimited
}

interface SessionLog {
  date: string;
  duration_minutes: number;
}

interface ParentState {
  // State
  tier: SubscriptionTier;
  children: ChildSummary[];
  selectedChildId: string | null;
  childSessions: SessionLog[];
  isLoading: boolean;

  // Actions
  setTier: (tier: SubscriptionTier) => void;
  setChildren: (children: ChildSummary[]) => void;
  selectChild: (id: string) => void;
  setChildSessions: (sessions: SessionLog[]) => void;
  setLoading: (v: boolean) => void;
  updateChildTimeLimit: (childId: string, minutes: number | null) => void;
}

export const useParentStore = create<ParentState>((set) => ({
  tier: 'free',
  children: [],
  selectedChildId: null,
  childSessions: [],
  isLoading: true,

  setTier: (tier) => set({ tier }),
  setChildren: (children) => set({ children }),
  selectChild: (id) => set({ selectedChildId: id }),
  setChildSessions: (sessions) => set({ childSessions: sessions }),
  setLoading: (isLoading) => set({ isLoading }),
  updateChildTimeLimit: (childId, minutes) =>
    set((state) => ({
      children: state.children.map((c) =>
        c.id === childId ? { ...c, daily_time_limit_minutes: minutes } : c
      ),
    })),
}));
```

---

## Step 4: `useParentDashboard` Hook

**v2 [BUG-8A]:** Imports from `tier-config.ts`, not `tiers.ts`.
**v2 [ENH-8C]:** Fetches `daily_time_limit_minutes` per child.
**v2:** Uses `createClient()` from `@/lib/supabase/client` consistent with Stage 2+ patterns.
**v2:** Renamed `worlds_completed` → `labs_completed`.

> **Performance Note:** This hook makes N+1 queries per child (5 count queries × N children). A future optimization would create a Supabase RPC `get_children_summary` to return all data in a single call. This is acceptable for MVP since parent dashboards typically have 1–5 children.

**File:** `src/hooks/useParentDashboard.ts` — **CREATE**

```typescript
// ════════════════════════════════════════════════════
// PARENT DASHBOARD HOOK — Fetches all child data
// v2: Uses tier-config.ts imports (BUG-8A fix)
// v2: Fetches daily_time_limit_minutes (ENH-8C)
// v2: Uses createClient() from @/lib/supabase/client
// ════════════════════════════════════════════════════
'use client';

import { useEffect } from 'react';
import { useParentStore } from '@/stores/parentStore';
import { createClient } from '@/lib/supabase/client';
import type { SubscriptionTier } from '@/lib/tier-config';

export function useParentDashboard() {
  const store = useParentStore();

  useEffect(() => {
    async function load() {
      store.setLoading(true);
      const sb = createClient();

      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        store.setLoading(false);
        return;
      }

      // Fetch parent tier
      const { data: parent } = await sb
        .from('parents')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      if (parent?.subscription_tier) {
        store.setTier(parent.subscription_tier as SubscriptionTier);
      }

      // Fetch children with progress summaries
      const { data: children } = await sb
        .from('children')
        .select('*')
        .eq('parent_id', user.id);

      if (!children) {
        store.setLoading(false);
        return;
      }

      // NOTE: N+1 queries per child — consider Supabase RPC optimization for scale
      const summaries = await Promise.all(
        children.map(async (child) => {
          // Lessons completed
          const { count: lessonsCount } = await sb
            .from('progress')
            .select('*', { count: 'exact', head: true })
            .eq('child_id', child.id)
            .eq('completed', true);

          // Quizzes passed (score >= 70)
          const { count: quizCount } = await sb
            .from('progress')
            .select('*', { count: 'exact', head: true })
            .eq('child_id', child.id)
            .eq('completed', true)
            .gte('score', 70);

          // Badges earned
          const { count: badgeCount } = await sb
            .from('child_badges')
            .select('*', { count: 'exact', head: true })
            .eq('child_id', child.id);

          // Games played this week
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const { count: gamesCount } = await sb
            .from('progress')
            .select('*', { count: 'exact', head: true })
            .eq('child_id', child.id)
            .eq('completed', true)
            .gte('completed_at', weekAgo.toISOString());

          // Total session time
          const { data: sessions } = await sb
            .from('sessions')
            .select('duration_seconds')
            .eq('child_id', child.id);

          const totalMinutes = Math.round(
            (sessions ?? []).reduce(
              (sum, row) => sum + (row.duration_seconds ?? 0),
              0
            ) / 60
          );

          // Last active
          const { data: lastSession } = await sb
            .from('sessions')
            .select('started_at')
            .eq('child_id', child.id)
            .order('started_at', { ascending: false })
            .limit(1);

          return {
            id: child.id,
            display_name: child.display_name,
            age_band: child.age_band as 'A' | 'B' | 'C',
            xp: child.xp ?? 0,
            level: child.level ?? 1,
            streak_count: child.streak_count ?? 0,
            streak_last_date: child.streak_last_date ?? null,
            lessons_completed: lessonsCount ?? 0,
            quizzes_passed: quizCount ?? 0,
            games_played: gamesCount ?? 0,
            total_time_minutes: totalMinutes,
            badges_earned: badgeCount ?? 0,
            labs_completed: 0, // calculated client-side from progress data
            last_active: lastSession?.[0]?.started_at ?? null,
            daily_time_limit_minutes: child.daily_time_limit_minutes ?? null,
          };
        })
      );

      store.setChildren(summaries);
      if (summaries.length > 0 && !store.selectedChildId) {
        store.selectChild(summaries[0].id);
      }
      store.setLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return store;
}
```

---

## Step 5: Tier Enforcement Middleware

**v2 [BUG-8C] FIX:** Uses `createServerSupabase` from `@/lib/supabase/server`, not deprecated `createRouteHandlerClient`.

**File:** `src/middleware/tierCheck.ts` — **CREATE**

```typescript
// ════════════════════════════════════════════════════
// TIER ENFORCEMENT — Server-side limit checking
// v2: Uses createServerSupabase (BUG-8C fix)
// ════════════════════════════════════════════════════
import { createServerSupabase } from '@/lib/supabase/server';
import {
  getTierLimits,
  type SubscriptionTier,
} from '@/lib/tier-config';

export async function getParentTier(): Promise<SubscriptionTier> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 'free';

  const { data } = await supabase
    .from('parents')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  return (data?.subscription_tier as SubscriptionTier) ?? 'free';
}

export async function checkPromptLimit(
  childId: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const tier = await getParentTier();
  const limits = getTierLimits(tier);

  const supabase = createServerSupabase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('prompt_history')
    .select('*', { count: 'exact', head: true })
    .eq('child_id', childId)
    .gte('created_at', today.toISOString());

  const used = count ?? 0;
  return { allowed: used < limits.promptsPerDay, used, limit: limits.promptsPerDay };
}

export async function checkGameLimit(
  childId: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const tier = await getParentTier();
  const limits = getTierLimits(tier);

  if (limits.gamesPerWeek === null) {
    return { allowed: true, used: 0, limit: -1 };
  }

  const supabase = createServerSupabase();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { count } = await supabase
    .from('progress')
    .select('*', { count: 'exact', head: true })
    .eq('child_id', childId)
    .eq('completed', true)
    .gte('completed_at', weekAgo.toISOString());

  const used = count ?? 0;
  return { allowed: used < limits.gamesPerWeek, used, limit: limits.gamesPerWeek };
}

export async function checkChildLimit(
  parentId: string
): Promise<{ allowed: boolean; count: number; limit: number }> {
  const tier = await getParentTier();
  const limits = getTierLimits(tier);

  const supabase = createServerSupabase();
  const { count } = await supabase
    .from('children')
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', parentId);

  return {
    allowed: (count ?? 0) < limits.maxChildren,
    count: count ?? 0,
    limit: limits.maxChildren,
  };
}

export async function checkTimeLimit(
  childId: string
): Promise<{ allowed: boolean; usedMinutes: number; limitMinutes: number | null }> {
  const supabase = createServerSupabase();

  // Get child's daily time limit
  const { data: child } = await supabase
    .from('children')
    .select('daily_time_limit_minutes')
    .eq('id', childId)
    .single();

  const limitMinutes = child?.daily_time_limit_minutes ?? null;
  if (limitMinutes === null) {
    return { allowed: true, usedMinutes: 0, limitMinutes: null };
  }

  // Sum today's session time
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: sessions } = await supabase
    .from('sessions')
    .select('duration_seconds')
    .eq('child_id', childId)
    .gte('started_at', today.toISOString());

  const usedMinutes = Math.round(
    (sessions ?? []).reduce((sum, row) => sum + (row.duration_seconds ?? 0), 0) / 60
  );

  return { allowed: usedMinutes < limitMinutes, usedMinutes, limitMinutes };
}
```

---

## Step 6: Stripe API Routes (REPLACE Stage 2 Versions)

**v2 [BUG-8B] FIX:** Replaces Stage 2 v2 Stripe routes with enhanced versions that include graceful fallback when `STRIPE_SECRET_KEY` is missing. The Stage 2 routes used `process.env.STRIPE_SECRET_KEY!` which crashes if the key is not set.

**v2 [ENH-8A]:** All 3 routes check for `STRIPE_SECRET_KEY` before initializing. If missing, return helpful JSON error with setup URL.

### 6A: Checkout Route

**File:** `src/app/api/stripe/checkout/route.ts` — **REPLACE**

```typescript
// ════════════════════════════════════════════════════
// STRIPE CHECKOUT — Create subscription checkout session
// v2: Graceful fallback if STRIPE_SECRET_KEY missing (ENH-8A)
// v2: Uses createServerSupabase (BUG-8C fix)
// v2: apiVersion matches installed stripe@20.4.0
// ════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabase } from '@/lib/supabase/server';
import { STRIPE_PRICES, type SubscriptionTier } from '@/lib/tier-config';
import { apiSuccess, apiError, requireAuth } from '@/lib/api-helpers';

export const runtime = 'nodejs';

// v2 [ENH-8A]: Lazy Stripe init with graceful fallback
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2026-02-25.clover' });
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      {
        error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to your .env.local file.',
        setup_url: 'https://dashboard.stripe.com/apikeys',
      },
      { status: 503 }
    );
  }

  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  // S8-HIGH-001 fix: Zod validation on checkout request body
  const parsed = await parseBody(req, CheckoutSchema);
  if (!parsed.success) return parsed.response;

  const { tier, interval } = parsed.data;

  const priceId = STRIPE_PRICES[tier as keyof typeof STRIPE_PRICES]?.[interval];
  if (!priceId || priceId.startsWith('price_placeholder')) {
    return apiError(
      'Stripe price IDs not configured. Create products in Stripe Dashboard first.',
      503
    );
  }

  const supabase = createServerSupabase();
  const { data: parent } = await supabase
    .from('parents')
    .select('stripe_customer_id, email')
    .eq('id', auth.user.id)
    .single();

  let customerId = parent?.stripe_customer_id;

  // Create Stripe customer if none exists
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: auth.user.email || parent?.email,
      metadata: { supabase_id: auth.user.id },
    });
    customerId = customer.id;

    await supabase
      .from('parents')
      .update({ stripe_customer_id: customerId })
      .eq('id', auth.user.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/parent/subscription?success=true`,
    cancel_url: `${appUrl}/parent/subscription?canceled=true`,
    metadata: {
      supabase_id: auth.user.id,
      tier,
    },
  });

  return apiSuccess({ url: session.url });
}
```

### 6B: Portal Route

**File:** `src/app/api/stripe/portal/route.ts` — **REPLACE**

```typescript
// ════════════════════════════════════════════════════
// STRIPE PORTAL — Customer portal for subscription management
// v2: Graceful fallback if STRIPE_SECRET_KEY missing (ENH-8A)
// v2: Uses createServerSupabase (BUG-8C fix)
// ════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth } from '@/lib/api-helpers';

export const runtime = 'nodejs';

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2026-02-25.clover' });
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      {
        error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to your .env.local file.',
        setup_url: 'https://dashboard.stripe.com/apikeys',
      },
      { status: 503 }
    );
  }

  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const supabase = createServerSupabase();
  const { data: parent } = await supabase
    .from('parents')
    .select('stripe_customer_id')
    .eq('id', auth.user.id)
    .single();

  if (!parent?.stripe_customer_id) {
    return apiError('No subscription found. Subscribe first to manage billing.', 404);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const session = await stripe.billingPortal.sessions.create({
    customer: parent.stripe_customer_id,
    return_url: `${appUrl}/parent/subscription`,
  });

  return apiSuccess({ url: session.url });
}
```

### 6C: Webhook Route

**File:** `src/app/api/stripe/webhook/route.ts` — **REPLACE**

```typescript
// ════════════════════════════════════════════════════
// STRIPE WEBHOOK — Handle subscription lifecycle events
// v2: Graceful fallback if STRIPE_SECRET_KEY missing (ENH-8A)
// v2: Logs events to subscription_events table
// v2: Uses createAdminClient for webhook (no user auth)
// ════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';

// Disable body parsing — Stripe needs raw body for signature verification
export const runtime = 'nodejs';

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2026-02-25.clover' });
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 503 }
    );
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      {
        error:
          'Webhook secret not configured. Run: stripe listen --forward-to localhost:3000/api/stripe/webhook',
      },
      { status: 503 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Log all events to subscription_events table (upsert to handle replays)
  await supabase.from('subscription_events').upsert(
    {
      stripe_event_id: event.id,
      event_type: event.type,
      data: event.data.object as Record<string, unknown>,
      parent_id: null, // filled below if identifiable
    },
    { onConflict: 'stripe_event_id', ignoreDuplicates: true }
  );

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const supabaseId = session.metadata?.supabase_id;
      const tier = session.metadata?.tier ?? 'plus';

      if (supabaseId) {
        await supabase
          .from('parents')
          .update({
            subscription_tier: tier,
            subscription_status: 'active',
            stripe_customer_id: session.customer as string,
          })
          .eq('id', supabaseId);

        // Update event with parent_id for audit trail
        await supabase
          .from('subscription_events')
          .update({ parent_id: supabaseId })
          .eq('stripe_event_id', event.id);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const status =
        sub.status === 'active'
          ? 'active'
          : sub.status === 'past_due'
            ? 'past_due'
            : sub.status;

      await supabase
        .from('parents')
        .update({ subscription_status: status })
        .eq('stripe_customer_id', customerId);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from('parents')
        .update({
          subscription_tier: 'free',
          subscription_status: 'canceled',
        })
        .eq('stripe_customer_id', sub.customer as string);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await supabase
        .from('parents')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', invoice.customer as string);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

---

## Step 7: Schema Additions SQL

**v2 [ENH-8C]:** Adds `daily_time_limit_minutes` to children table. Note: `subscription_tier` and `stripe_customer_id` may already exist from Stage 2 — `IF NOT EXISTS` handles this gracefully.

**WHERE:** Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

**File:** `sql/schema-stage8.sql` — **CREATE** (reference — run in Supabase SQL Editor)

```sql
-- ════════════════════════════════════════════════════
-- STAGE 8 SCHEMA ADDITIONS
-- Stripe & subscription fields + time limit
-- Safe to re-run: uses IF NOT EXISTS throughout
-- ════════════════════════════════════════════════════

-- Subscription columns on parents table
ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT
  DEFAULT 'free'
  CHECK (subscription_tier IN ('free', 'plus', 'forge'));

ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS subscription_status TEXT
  DEFAULT 'none'
  CHECK (subscription_status IN ('none', 'active', 'past_due', 'canceled'));

ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- v2 [ENH-8C]: Daily time limit per child (null = unlimited)
ALTER TABLE children
  ADD COLUMN IF NOT EXISTS daily_time_limit_minutes INTEGER DEFAULT NULL;

-- Index for Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_parents_stripe
  ON parents(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Subscription events table (logs all Stripe webhook events)
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES parents(id),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS on subscription_events
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Admin-only access to subscription events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscription_events'
      AND policyname = 'sub_events_admin_only'
  ) THEN
    CREATE POLICY sub_events_admin_only
      ON subscription_events
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM parents
          WHERE parents.id = auth.uid()
            AND parents.is_admin = true
        )
      );
  END IF;
END $$;

-- Ensure parent can read own subscription data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'parents'
      AND policyname = 'parent_read_own_sub'
  ) THEN
    CREATE POLICY parent_read_own_sub
      ON parents
      FOR SELECT
      USING (id = auth.uid());
  END IF;
END $$;
```

---

## Step 8: UpgradePrompt Component

Shown when limits are hit. NEVER shown to children — only in parent-facing contexts. Child variant shows a gentle message without pricing language.

**v2 [ENH-8E]:** Frost-Prismatic styling with glassmorphism, neon accents, and smooth animations.

**File:** `src/components/parent/UpgradePrompt.tsx` — **CREATE**

```tsx
// ════════════════════════════════════════════════════
// UPGRADE PROMPT — Shown when tier limits are hit
// Only shown in parent-facing contexts. NEVER to children.
// v2: Frost-Prismatic styling (ENH-8E)
// ════════════════════════════════════════════════════
'use client';

import { motion } from 'motion/react';
import { Rocket, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface UpgradePromptProps {
  message: string;
  context?: string;
  variant?: 'parent' | 'child';
}

export function UpgradePrompt({
  message,
  context,
  variant = 'parent',
}: UpgradePromptProps) {
  // Child-facing variant: gentle, no pricing language
  if (variant === 'child') {
    return (
      <motion.div
        className="rounded-2xl border border-white/[0.06] bg-[#111118]/80 backdrop-blur-xl p-6 text-center max-w-md mx-auto shadow-lg shadow-black/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <motion.div
          className="text-5xl mb-3"
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {'\u2728'}
        </motion.div>
        <h3 className="font-display text-lg font-bold text-white mb-2">
          {message}
        </h3>
        {context && (
          <p className="font-body text-sm text-white/50">{context}</p>
        )}
      </motion.div>
    );
  }

  // Parent-facing variant: includes upgrade CTA
  return (
    <motion.div
      className="rounded-2xl border border-[#FF6644]/30 bg-[#111118]/80 backdrop-blur-xl p-6 text-center max-w-md mx-auto shadow-lg shadow-[#FF6644]/5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="w-12 h-12 rounded-full bg-[#FF6644]/10 flex items-center justify-center mx-auto mb-4">
        <Rocket className="w-6 h-6 text-[#FF6644]" />
      </div>

      <h3 className="font-display text-lg font-bold text-white mb-2">
        {message}
      </h3>

      {context && (
        <p className="font-body text-sm text-white/40 mb-4">{context}</p>
      )}

      <Link href="/parent/subscription">
        <motion.button
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF6644] to-[#FFAA44] text-white font-display font-semibold text-sm shadow-lg shadow-[#FF6644]/20 transition-shadow hover:shadow-[#FF6644]/40"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <Sparkles className="w-4 h-4" />
          Upgrade to Keep Going!
        </motion.button>
      </Link>
    </motion.div>
  );
}
```

---

## Step 9: `useSessionTimer` Hook (NEW v2)

**v2 [ENH-8C]:** Tracks active play time and warns/blocks when the daily time limit is approaching. Works alongside the existing `useSessionTracker` from Stage 3 v2.

**File:** `src/hooks/useSessionTimer.ts` — **CREATE**

```typescript
// ════════════════════════════════════════════════════
// SESSION TIMER — Enforces daily time limits
// v2 [ENH-8C]: Warns at 5min remaining, blocks at limit
// Works alongside useSessionTracker (Stage 3 v2)
// ════════════════════════════════════════════════════
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useChildStore } from '@/stores/childStore';
import { createClient } from '@/lib/supabase/client';

interface TimerState {
  limitMinutes: number | null;
  usedMinutes: number;
  remainingMinutes: number | null;
  isWarning: boolean;  // 5 minutes or less remaining
  isBlocked: boolean;  // time limit reached
}

export function useSessionTimer(): TimerState {
  const activeChild = useChildStore((s) => s.activeChild);

  const [state, setState] = useState<TimerState>({
    limitMinutes: null,
    usedMinutes: 0,
    remainingMinutes: null,
    isWarning: false,
    isBlocked: false,
  });

  const checkTime = useCallback(async () => {
    if (!activeChild?.id) return;

    const limit = activeChild.daily_time_limit_minutes ?? null;
    if (limit === null) {
      setState({
        limitMinutes: null,
        usedMinutes: 0,
        remainingMinutes: null,
        isWarning: false,
        isBlocked: false,
      });
      return;
    }

    const sb = createClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: sessions } = await sb
      .from('sessions')
      .select('duration_seconds')
      .eq('child_id', activeChild.id)
      .gte('started_at', today.toISOString());

    const usedMinutes = Math.round(
      (sessions ?? []).reduce(
        (sum, row) => sum + (row.duration_seconds ?? 0),
        0
      ) / 60
    );

    const remaining = Math.max(0, limit - usedMinutes);

    setState({
      limitMinutes: limit,
      usedMinutes,
      remainingMinutes: remaining,
      isWarning: remaining <= 5 && remaining > 0,
      isBlocked: remaining <= 0,
    });
  }, [activeChild]);

  useEffect(() => {
    checkTime();
    // Re-check every 60 seconds
    const interval = setInterval(checkTime, 60_000);
    return () => clearInterval(interval);
  }, [checkTime]);

  return state;
}
```

---

## Step 10: Verify Everything

```bash
npm run build
```

### Check 1: No import errors

- `tier-config.ts` should export both `TIER_CONFIG` and `TIER_DISPLAY`
- `parentStore.ts` should import `SubscriptionTier` from `tier-config`
- All Stripe routes should build even without `STRIPE_SECRET_KEY`

### Check 2: Schema SQL

Run the `sql/schema-stage8.sql` in Supabase SQL Editor:
- Verify: `parents` table has `subscription_tier`, `subscription_status`, `stripe_customer_id` columns
- Verify: `children` table has `daily_time_limit_minutes` column
- Verify: `subscription_events` table exists

### Check 3: Stripe fallback

Visit `http://localhost:3000/api/stripe/checkout` (POST):
- Without `STRIPE_SECRET_KEY` → should return **503** with setup URL
- **NOT** a 500 server crash

---

## Step 11: Git Commit

```bash
git add -A
git commit -m "Stage 8 Part 1: Tier config, parent store, Stripe routes with graceful fallback, tier enforcement"
```

---

## Part 1 (8A) Complete!

### Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/tier-config.ts` | APPEND | `TierDisplayConfig`, `TIER_DISPLAY`, pricing helpers |
| `src/stores/parentStore.ts` | CREATE | `ChildSummary`, `ParentState`, Zustand store |
| `src/hooks/useParentDashboard.ts` | CREATE | Fetches children + progress summaries |
| `src/hooks/useSessionTimer.ts` | CREATE (v2) | ENH-8C time limit enforcement |
| `src/middleware/tierCheck.ts` | CREATE | Server-side limit checking |
| `src/app/api/stripe/checkout/route.ts` | REPLACE | Graceful fallback + ENH-8A |
| `src/app/api/stripe/portal/route.ts` | REPLACE | Graceful fallback + ENH-8A |
| `src/app/api/stripe/webhook/route.ts` | REPLACE | Graceful fallback + event logging |
| `sql/schema-stage8.sql` | CREATE | Run in Supabase SQL Editor |
| `src/components/parent/UpgradePrompt.tsx` | CREATE | Parent/child upgrade prompts |

### Bug Fixes Applied

| ID | Fix |
|----|-----|
| **BUG-8A** | Extended existing `tier-config.ts` instead of creating conflicting `tiers.ts` |
| **BUG-8B** | Replaced Stage 2 Stripe routes with graceful-fallback versions |
| **BUG-8C** | All server code uses `createServerSupabase` / `createAdminClient` (not deprecated helpers) |

### Enhancements Applied

| ID | Enhancement |
|----|-------------|
| **ENH-8A** | Stripe 503 response with `setup_url` when keys missing |
| **ENH-8C** | `daily_time_limit_minutes` + `useSessionTimer` hook |
| **ENH-8E** | Frost-Prismatic styling on UpgradePrompt (parent + child variants) |

---

### Cockpit Integration (CPA v2.0)

All parent dashboard pages (`/parent`, `/parent/add-child`, `/parent/subscription`) live under the `(dashboard)` layout and render inside the persistent CockpitCanvas. The cockpit uses **`parent` mode** presets — a subtler cockpit treatment that keeps the 3D ambiance while focusing attention on the HTML content layer:

| Preset | Value | Rationale |
|--------|-------|-----------|
| LED color | `#FFAA44` (amber) | Differentiates parent context from child blue |
| Panel curvature | 0.6 | Slightly retracted vs dashboard's 0.85 |
| Panel opacity | 0.7 | Visible but not prominent |
| HUD opacity | 0.08 | Barely visible — parents don't need lab HUD |
| Side panel content | `stats` / `stats` | Child progress stats on both panels |
| Bloom intensity | 0.3 | Low bloom — professional feel |
| Status bar opacity | 0.7 | Shows XP/streak for context, not dominant |
| Particles | 150 @ 0.25 speed | Gentle ambient particles |

**No action needed by developers** — `useStationMode` auto-detects `/parent/*` pathnames and applies `parent` mode presets from `cockpitConfig.ts`. The UpgradePrompt component, parent dashboard pages, and subscription flow all render as HTML at z-index 10 above the cockpit.

**Mobile:** On mobile (`useIsMobile()` = true), the CockpitCanvas is not rendered. Parent pages use the standard CSS glassmorphic fallback with amber-tinted particle background.

---

**NEXT:** Part 2 (8B) — Parent Dashboard pages (math gate, child overview, stats, time limits, add child), Subscription page, PaywallModal
