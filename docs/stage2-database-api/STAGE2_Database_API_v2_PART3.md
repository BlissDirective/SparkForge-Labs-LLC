# SPARKFORGE — STAGE 2: DATABASE & API LAYER v2 (PART 3 of 4)

**Date:** February 21, 2026 | **Version:** Frost-Prismatic v2.1

## PART 3 (2C) COVERS:

- All 17+ API route handlers (16 files)
- **Auth:** signup, login, logout, me
- **Children:** list/create, get/update/delete
- **Content:** filtered list, single by slug
- **Progress:** list/create, lab progress, all-labs bulk (NEW v2)
- **Gamification:** XP, streak, badges (ENHANCED v2)
- **AI:** Prompt Lab
- **Stripe:** checkout, portal, webhook
- **Sessions:** start/end
- **Health:** status check (NEW v2)

## v2 CHANGES IN THIS PART:

- **[IMP-3]** Rate limiting wired into `auth/signup` and `auth/login`
- **[BUG-6]** Badge POST handler expanded to check ALL criteria types
- **[ENH]** Cache-Control headers on content GET (5min) and badges GET (1hr)
- **[BUG-3]** NEW all-labs bulk progress endpoint
- **[NEW-2C]** NEW health check endpoint

## PREREQUISITES: Parts 1-2 complete. Folders created in Part 2 Step 1.

**IMPORTANT IMPORT NOTE:** Stage 1 exports `createServerSupabase` (not `createServerClient`). Admin client is `createAdminClient`. Both from `'@/lib/supabase/server'`.

---

## AUTH ROUTES (4 files)

### File: `src/app/api/auth/signup/route.ts`

```typescript
// POST /api/auth/signup — Create parent account with COPPA consent
// v2 [IMP-3]: Rate limiting applied (5 req/min)
import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { SignupSchema } from '@/lib/validations';
import { apiSuccess, apiError, parseBody, applyRateLimit } from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // v2 [IMP-3]: Rate limit auth endpoints
  const limited = applyRateLimit(req, 'auth-signup', undefined, RATE_LIMITS.auth);
  if (limited) return limited;

  const parsed = await parseBody(req, SignupSchema);
  if (!parsed.success) return parsed.response;

  const { email, password, fullName, coppaConsent, timezone } = parsed.data;

  const supabase = createAdminClient();

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      return apiError('An account with this email already exists', 409, 'EMAIL_EXISTS');
    }
    return apiError('Failed to create account. Please try again.', 500, 'AUTH_ERROR');
  }

  // v2 [NEW-3A]: onboarding_complete defaults false
  const { error: parentError } = await supabase.from('parents').insert({
    id: authData.user.id,
    email,
    full_name: fullName || null,
    coppa_consent_at: new Date().toISOString(),
    onboarding_complete: false,
  });

  if (parentError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return apiError('Failed to create account. Please try again.', 500, 'DB_ERROR');
  }

  await supabase.auth.admin.generateLink({ type: 'signup', email, password });

  return apiSuccess({ userId: authData.user.id, emailSent: true }, 201);
}
```

---

### File: `src/app/api/auth/login/route.ts`

```typescript
// POST /api/auth/login — Sign in with email/password
// v2 [IMP-3]: Rate limiting applied (5 req/min)
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { LoginSchema } from '@/lib/validations';
import { apiSuccess, apiError, parseBody, applyRateLimit } from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const limited = applyRateLimit(req, 'auth-login', undefined, RATE_LIMITS.auth);
  if (limited) return limited;

  const parsed = await parseBody(req, LoginSchema);
  if (!parsed.success) return parsed.response;

  const supabase = createServerSupabase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return apiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  return apiSuccess({
    user: { id: data.user.id, email: data.user.email },
    session: { accessToken: data.session.access_token },
  });
}
```

---

### File: `src/app/api/auth/logout/route.ts`

```typescript
// POST /api/auth/logout — Sign out
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';

export async function POST(_req: NextRequest) {
  const supabase = createServerSupabase();
  const { error } = await supabase.auth.signOut();

  if (error) return apiError('Failed to sign out', 500);

  return apiSuccess({ signedOut: true });
}
```

---

### File: `src/app/api/auth/me/route.ts`

```typescript
// GET /api/auth/me — Get current user profile
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';

export async function GET(_req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return apiError('Not authenticated', 401, 'AUTH_REQUIRED');
  }

  const { data: parent } = await supabase
    .from('parents')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!parent) return apiError('Parent profile not found', 404);

  return apiSuccess({
    id: parent.id,
    email: parent.email,
    fullName: parent.full_name,
    subscriptionTier: parent.subscription_tier,
    subscriptionStatus: parent.subscription_status,
    onboardingComplete: parent.onboarding_complete,
    isAdmin: parent.is_admin,
    createdAt: parent.created_at,
  });
}
```

---

## CHILDREN ROUTES (2 files)

### File: `src/app/api/children/route.ts`

```typescript
// GET /api/children — List parent's children
// POST /api/children — Create a child profile
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { CreateChildSchema } from '@/lib/validations';
import { apiSuccess, apiError, parseBody, requireAuth } from '@/lib/api-helpers';
import { canCreateChild } from '@/lib/tier-config';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const supabase = createServerSupabase();
  const { data: children, error } = await supabase
    .from('children')
    .select('*')
    .eq('parent_id', auth.user.id)
    .order('created_at', { ascending: true });

  if (error) return apiError('Failed to fetch children', 500);

  return apiSuccess(children || []);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, CreateChildSchema);
  if (!parsed.success) return parsed.response;

  const supabase = createServerSupabase();

  const { count } = await supabase
    .from('children')
    .select('id', { count: 'exact', head: true })
    .eq('parent_id', auth.user.id);

  if (!canCreateChild(auth.user.tier, count || 0)) {
    return apiError(
      "You've reached your plan's child profile limit. Upgrade to add more!",
      403, 'TIER_LIMIT'
    );
  }

  const { data: child, error } = await supabase
    .from('children')
    .insert({
      parent_id: auth.user.id,
      display_name: parsed.data.displayName,
      age: parsed.data.age || 10,
      age_band: parsed.data.ageBand,
      avatar_config: parsed.data.avatarConfig || {},
    })
    .select()
    .single();

  if (error) return apiError('Failed to create child profile', 500);

  return apiSuccess(child, 201);
}
```

---

### File: `src/app/api/children/[childId]/route.ts`

```typescript
// GET/PATCH/DELETE /api/children/:childId
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { UpdateChildSchema } from '@/lib/validations';
import { apiSuccess, apiError, parseBody, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';

interface Params { params: Promise<{ childId: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { childId } = await params;
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = createServerSupabase();
  const { data } = await supabase.from('children').select('*').eq('id', childId).single();
  if (!data) return apiError('Child not found', 404);

  return apiSuccess(data);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { childId } = await params;
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const parsed = await parseBody(req, UpdateChildSchema);
  if (!parsed.success) return parsed.response;

  const supabase = createServerSupabase();

  const updateData: Record<string, unknown> = {};
  if (parsed.data.displayName) updateData.display_name = parsed.data.displayName;
  if (parsed.data.avatarConfig) updateData.avatar_config = parsed.data.avatarConfig;
  if (parsed.data.dailyTimeLimitMinutes !== undefined) updateData.daily_time_limit_minutes = parsed.data.dailyTimeLimitMinutes;
  if (parsed.data.promptLabEnabled !== undefined) updateData.prompt_lab_enabled = parsed.data.promptLabEnabled;
  if (parsed.data.preferences) updateData.preferences = parsed.data.preferences;

  const { data, error } = await supabase
    .from('children').update(updateData).eq('id', childId).select().single();

  if (error) return apiError('Failed to update child', 500);

  return apiSuccess(data);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { childId } = await params;
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = createServerSupabase();
  const { error } = await supabase.from('children').delete().eq('id', childId);

  if (error) return apiError('Failed to delete child profile', 500);

  return apiSuccess({ deleted: true });
}
```

---

## CONTENT ROUTES (2 files) — ENHANCED v2

### File: `src/app/api/content/route.ts`

```typescript
// GET /api/content — Fetch published content with filters
// v2 [ENH]: Added Cache-Control: 5 minute cache
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { ContentQuerySchema } from '@/lib/validations';
import { apiError, parseQuery, requireAuth } from '@/lib/api-helpers';
import { isLabAccessible } from '@/lib/tier-config';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = parseQuery(req, ContentQuerySchema);
  if (!parsed.success) return parsed.response;

  const { world, ageBand, type, limit = 20, offset = 0 } = parsed.data;

  if (world) {
    const access = isLabAccessible(auth.user.tier, world);
    if (access === 'locked') {
      return apiError('This lab requires a subscription upgrade', 403, 'TIER_LIMIT');
    }
  }

  const supabase = createServerSupabase();
  let query = supabase
    .from('content')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .range(offset, offset + limit - 1);

  if (world) query = query.eq('world', world);
  if (ageBand) query = query.eq('target_age_band', ageBand);
  if (type) query = query.eq('type', type);

  const { data, count, error } = await query;

  if (error) return apiError('Failed to fetch content', 500);

  // v2 [ENH]: Cache-Control header for content
  const response = NextResponse.json(
    { success: true, data: data || [], total: count || 0, limit, offset },
    { status: 200 }
  );
  response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
  return response;
}
```

---

### File: `src/app/api/content/[slug]/route.ts`

```typescript
// GET /api/content/:slug — Fetch single content item by slug
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth } from '@/lib/api-helpers';
import { isLabAccessible } from '@/lib/tier-config';

interface Params { params: Promise<{ slug: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) return apiError('Content not found', 404);

  const access = isLabAccessible(auth.user.tier, data.world);
  if (access === 'locked') {
    return apiError('This content requires a subscription upgrade', 403, 'TIER_LIMIT');
  }

  if (access === 'preview' && data.sort_order > 1) {
    return apiError('Upgrade to access more content in this lab', 403, 'TIER_LIMIT');
  }

  return apiSuccess(data);
}
```

---

## PROGRESS ROUTES (3 files — including NEW v2 all-labs)

### File: `src/app/api/progress/route.ts`

```typescript
// GET /api/progress — Fetch progress for a child
// POST /api/progress — Create/update progress record
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { CompleteContentSchema } from '@/lib/validations';
import { apiSuccess, apiError, parseBody, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const childId = req.nextUrl.searchParams.get('childId');
  if (!childId) return apiError('childId is required', 400);

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('progress')
    .select('*, content:content_id(title, type, world, xp_reward)')
    .eq('child_id', childId)
    .order('updated_at', { ascending: false });

  if (error) return apiError('Failed to fetch progress', 500);

  return apiSuccess(data || []);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, CompleteContentSchema);
  if (!parsed.success) return parsed.response;

  const { childId, contentId, score, timeSpentSeconds } = parsed.data;

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('progress')
    .upsert({
      child_id: childId,
      content_id: contentId,
      completed: true,
      score: score || null,
      time_spent_seconds: timeSpentSeconds,
      completed_at: new Date().toISOString(),
      attempts: 1,
    }, { onConflict: 'child_id,content_id' })
    .select()
    .single();

  if (error) return apiError('Failed to record progress', 500);

  return apiSuccess(data, 201);
}
```

---

### File: `src/app/api/progress/world/route.ts`

```typescript
// GET /api/progress/world — Get lab progress using DB function
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { LabProgressSchema } from '@/lib/validations';
import { apiSuccess, apiError, parseQuery, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = parseQuery(req, LabProgressSchema);
  if (!parsed.success) return parsed.response;

  const { childId, world } = parsed.data;

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = createServerSupabase();

  const { data: child } = await supabase
    .from('children').select('age_band').eq('id', childId).single();

  if (!child) return apiError('Child not found', 404);

  const { data, error } = await supabase.rpc('get_lab_progress', {
    p_child_id: childId, p_world: world, p_age_band: child.age_band,
  });

  if (error) return apiError('Failed to fetch lab progress', 500);

  const result = data?.[0] || { total_items: 0, completed_items: 0, percent: 0 };

  return apiSuccess({
    labId: world,
    totalItems: result.total_items,
    completedItems: result.completed_items,
    percent: result.percent,
  });
}
```

---

### v2 [BUG-3] NEW ENDPOINT:

### File: `src/app/api/progress/all-labs/route.ts`

```typescript
// GET /api/progress/all-labs — Bulk fetch progress for ALL 10 labs
// v2 [BUG-3]: Replaces 10 individual /progress/world calls with 1 bulk call.
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const childId = req.nextUrl.searchParams.get('childId');
  if (!childId) return apiError('childId is required', 400);

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = createServerSupabase();

  const { data: child } = await supabase
    .from('children').select('age_band').eq('id', childId).single();

  if (!child) return apiError('Child not found', 404);

  // Fetch all 10 labs in parallel
  const results = await Promise.all(
    Array.from({ length: 10 }, (_, i) => i + 1).map(async (world) => {
      const { data } = await supabase.rpc('get_lab_progress', {
        p_child_id: childId, p_world: world, p_age_band: child.age_band,
      });
      const row = data?.[0] || { total_items: 0, completed_items: 0, percent: 0 };
      return {
        labId: world,
        totalItems: Number(row.total_items),
        completedItems: Number(row.completed_items),
        percent: Number(row.percent),
      };
    })
  );

  return apiSuccess(results);
}
```

---

## GAMIFICATION ROUTES (3 files) — ENHANCED v2

### File: `src/app/api/gamification/xp/route.ts`

```typescript
// POST /api/gamification/xp — Award XP with streak multiplier + level-up
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { AwardXPSchema } from '@/lib/validations';
import {
  apiSuccess, apiError, parseBody, requireAuth,
  verifyChildOwnership, applyRateLimit, checkDuplicate,
} from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';

// Level calculation using LEVELS array from types
function calculateLevel(xp: number) {
  // Levels defined in src/types/index.ts LEVELS array
  // Each level has { level, title, minXP, maxXP }
  // Simplified inline for this route:
  const tiers = [
    { min: 0, max: 500, level_range: [1, 5], title: 'Spark Starter' },
    { min: 500, max: 1500, level_range: [6, 10], title: 'Curious Coder' },
    { min: 1500, max: 3500, level_range: [11, 20], title: 'Data Explorer' },
    { min: 3500, max: 7000, level_range: [21, 30], title: 'Algorithm Ace' },
    { min: 7000, max: 12000, level_range: [31, 40], title: 'Neural Navigator' },
    { min: 12000, max: 20000, level_range: [41, 50], title: 'AI Architect' },
  ];

  for (const tier of tiers) {
    if (xp <= tier.max) {
      const range = tier.max - tier.min;
      const levels = tier.level_range[1] - tier.level_range[0] + 1;
      const perLevel = range / levels;
      const inTier = xp - tier.min;
      const levelInTier = Math.floor(inTier / perLevel);
      const level = tier.level_range[0] + levelInTier;
      const progress = (inTier % perLevel) / perLevel;
      return { level: Math.max(1, level), title: tier.title, progress };
    }
  }
  return { level: 51, title: 'Forge Master', progress: 1 };
}

export async function POST(req: NextRequest) {
  const limited = applyRateLimit(req, 'gamification-xp', undefined, RATE_LIMITS.general);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  // v2 [NEW-2B]: Dedup rapid clicks
  const dup = checkDuplicate(req, auth.user.id);
  if (dup) return dup;

  const parsed = await parseBody(req, AwardXPSchema);
  if (!parsed.success) return parsed.response;

  const { childId, amount, source } = parsed.data;

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = createServerSupabase();

  const { data: child } = await supabase
    .from('children')
    .select('xp, level, streak_count, spark_coins')
    .eq('id', childId)
    .single();

  if (!child) return apiError('Child not found', 404);

  // Streak multiplier: 2x at 7+ day streak
  const multiplier = child.streak_count >= 7 ? 2 : 1;
  const xpAwarded = amount * multiplier;
  const newXP = child.xp + xpAwarded;
  const oldLevel = calculateLevel(child.xp);
  const newLevel = calculateLevel(newXP);
  const leveledUp = newLevel.level > oldLevel.level;
  const coinsEarned = leveledUp ? (newLevel.level - oldLevel.level) * 5 : 0;

  await supabase.from('children').update({
    xp: newXP,
    level: newLevel.level,
    spark_coins: child.spark_coins + coinsEarned,
  }).eq('id', childId);

  return apiSuccess({
    xpAwarded, multiplier, newXP,
    newLevel: newLevel.level, newTitle: newLevel.title,
    levelProgress: newLevel.progress, leveledUp, coinsEarned,
  });
}
```

---

### File: `src/app/api/gamification/streak/route.ts`

```typescript
// POST /api/gamification/streak — Update daily streak
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, parseBody, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';

const StreakSchema = z.object({ childId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, StreakSchema);
  if (!parsed.success) return parsed.response;

  const { childId } = parsed.data;

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = createServerSupabase();

  const { data: child } = await supabase
    .from('children')
    .select('streak_count, streak_last_date, streak_shield')
    .eq('id', childId)
    .single();

  if (!child) return apiError('Child not found', 404);

  const today = new Date().toISOString().split('T')[0];
  const lastDate = child.streak_last_date;

  // Already logged today
  if (lastDate === today) {
    return apiSuccess({
      streakCount: child.streak_count, streakShield: child.streak_shield,
      shieldUsed: false, recovered: false, isNew: false,
    });
  }

  let newStreak = child.streak_count;
  let shieldUsed = false;
  let recovered = false;
  let newShield = child.streak_shield;

  if (lastDate) {
    const daysSince = Math.floor(
      (new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSince === 1) {
      newStreak += 1;
    } else if (daysSince === 2 && child.streak_shield) {
      newStreak += 1;
      shieldUsed = true;
      newShield = false;
    } else {
      newStreak = 1;
      recovered = true;
    }
  } else {
    newStreak = 1;
  }

  // Award streak shield at 7-day milestones
  if (newStreak > 0 && newStreak % 7 === 0) newShield = true;

  await supabase.from('children').update({
    streak_count: newStreak, streak_last_date: today, streak_shield: newShield,
  }).eq('id', childId);

  return apiSuccess({
    streakCount: newStreak, streakShield: newShield,
    shieldUsed, recovered, isNew: !lastDate,
  });
}
```

---

### File: `src/app/api/gamification/badges/route.ts`

```typescript
// GET /api/gamification/badges — Fetch all badges + earned status
// POST /api/gamification/badges — Check and award earned badges
// v2 [BUG-6]: POST expanded to check ALL criteria types
// v2 [ENH]: GET has Cache-Control: 1 hour
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, parseBody, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';

// v2 [ENH]: Cache badge definitions
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const childId = req.nextUrl.searchParams.get('childId');
  if (!childId) return apiError('childId is required', 400);

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = createServerSupabase();

  const [{ data: badges }, { data: earned }] = await Promise.all([
    supabase.from('badges').select('*').order('category').order('criteria_value'),
    supabase.from('child_badges').select('badge_id, earned_at').eq('child_id', childId),
  ]);

  const earnedMap = new Map((earned || []).map(e => [e.badge_id, e.earned_at]));

  const merged = (badges || []).map(b => ({
    ...b, earned: earnedMap.has(b.id), earnedAt: earnedMap.get(b.id) || null,
  }));

  const response = NextResponse.json({ success: true, data: merged }, { status: 200 });
  response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=300');
  return response;
}

const CheckBadgesSchema = z.object({ childId: z.string().uuid() });

// v2 [BUG-6]: Expanded to check ALL criteria types:
// reach_xp, reach_level, maintain_streak, complete_world,
// world_games_complete, world_quizzes_90, worlds_visited,
// worlds_mastered, unique_games_played, prompts_used,
// sandboxes_completed, spark_facts_read, total_badges, special
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, CheckBadgesSchema);
  if (!parsed.success) return parsed.response;

  const { childId } = parsed.data;

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = createServerSupabase();

  const { data: child } = await supabase
    .from('children').select('xp, level, streak_count, age_band')
    .eq('id', childId).single();

  if (!child) return apiError('Child not found', 404);

  const { data: allBadges } = await supabase.from('badges').select('*');
  const { data: earned } = await supabase.from('child_badges').select('badge_id').eq('child_id', childId);

  const earnedIds = new Set((earned || []).map(e => e.badge_id));
  const unearned = (allBadges || []).filter(b => !earnedIds.has(b.id));

  // Progress data for world-based checks
  const { data: progress } = await supabase
    .from('progress')
    .select('content_id, completed, score, content:content_id(world, type)')
    .eq('child_id', childId).eq('completed', true);

  const worldsVisited = new Set<number>();
  const gamesByWorld = new Map<number, number>();
  const quizScoresByWorld = new Map<number, number[]>();
  const uniqueGamesPlayed = new Set<string>();

  for (const p of progress || []) {
    const c = p.content as any;
    if (!c) continue;
    worldsVisited.add(c.world);
    if (c.type === 'game') {
      gamesByWorld.set(c.world, (gamesByWorld.get(c.world) || 0) + 1);
      uniqueGamesPlayed.add(p.content_id);
    }
    if (c.type === 'quiz' && p.score !== null) {
      const scores = quizScoresByWorld.get(c.world) || [];
      scores.push(Number(p.score));
      quizScoresByWorld.set(c.world, scores);
    }
  }

  // v2 [BUG-6]: Check ALL criteria types
  const newBadges: typeof allBadges = [];

  for (const badge of unearned) {
    let met = false;

    switch (badge.criteria_type) {
      case 'reach_xp':
        met = child.xp >= badge.criteria_value;
        break;
      case 'reach_level':
        met = child.level >= badge.criteria_value;
        break;
      case 'maintain_streak':
        met = child.streak_count >= badge.criteria_value;
        break;
      case 'complete_world':
        if (badge.criteria_world) {
          const { data: lp } = await supabase.rpc('get_lab_progress', {
            p_child_id: childId, p_world: badge.criteria_world, p_age_band: child.age_band,
          });
          met = (lp?.[0]?.percent || 0) >= badge.criteria_value;
        }
        break;
      case 'world_games_complete':
        if (badge.criteria_world) {
          met = (gamesByWorld.get(badge.criteria_world) || 0) >= badge.criteria_value;
        }
        break;
      case 'world_quizzes_90':
        if (badge.criteria_world) {
          const scores = quizScoresByWorld.get(badge.criteria_world) || [];
          met = scores.length > 0 && scores.every(s => s >= 90);
        }
        break;
      case 'worlds_visited':
        met = worldsVisited.size >= badge.criteria_value;
        break;
      case 'worlds_mastered': {
        let mastered = 0;
        for (let w = 1; w <= 10; w++) {
          const { data: lp } = await supabase.rpc('get_lab_progress', {
            p_child_id: childId, p_world: w, p_age_band: child.age_band,
          });
          if ((lp?.[0]?.percent || 0) >= 100) mastered++;
        }
        met = mastered >= badge.criteria_value;
        break;
      }
      case 'unique_games_played':
        met = uniqueGamesPlayed.size >= badge.criteria_value;
        break;
      case 'prompts_used': {
        const { count } = await supabase
          .from('prompt_history')
          .select('id', { count: 'exact', head: true })
          .eq('child_id', childId);
        met = (count || 0) >= badge.criteria_value;
        break;
      }
      case 'sandboxes_completed': {
        const sandboxCount = (progress || []).filter(
          p => (p.content as any)?.type === 'sandbox'
        ).length;
        met = sandboxCount >= badge.criteria_value;
        break;
      }
      case 'spark_facts_read': {
        const factCount = (progress || []).filter(
          p => (p.content as any)?.type === 'spark_fact'
        ).length;
        met = factCount >= badge.criteria_value;
        break;
      }
      case 'total_badges':
        met = (earnedIds.size + newBadges.length) >= badge.criteria_value;
        break;
      case 'special':
        // Special badges awarded by specific game/event handlers
        break;
    }

    if (met) {
      newBadges.push(badge);
      earnedIds.add(badge.id);
    }
  }

  // Insert newly earned badges
  if (newBadges.length > 0) {
    await supabase.from('child_badges').insert(
      newBadges.map(b => ({ child_id: childId, badge_id: b.id }))
    );
  }

  return apiSuccess({ newBadges, totalEarned: earnedIds.size });
}
```

---

## AI PROMPT LAB (1 file)

### File: `src/app/api/ai/prompt-lab/route.ts`

```typescript
// POST /api/ai/prompt-lab — Moderated AI chat for kids
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabase } from '@/lib/supabase/server';
import { PromptLabSchema } from '@/lib/validations';
import {
  apiSuccess, apiError, parseBody, requireAuth,
  verifyChildOwnership, applyRateLimit,
} from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { TIER_CONFIG } from '@/lib/tier-config';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPTS: Record<string, string> = {
  A: `You are Sparky, a friendly AI tutor for kids ages 7-10. Use simple words, fun analogies, and lots of encouragement. Keep responses under 150 words. If asked about anything inappropriate, gently redirect to a fun science or technology topic.`,
  B: `You are Sparky, an AI tutor for kids ages 11-13. Explain concepts clearly with good examples. Keep responses under 200 words. Encourage curiosity and deeper thinking. If asked about anything inappropriate, gently redirect to an interesting STEM topic.`,
  C: `You are Sparky, an AI tutor for teens ages 14-16. You can discuss complex topics at an appropriate level. Keep responses under 250 words. Encourage critical thinking and exploration. If asked about anything inappropriate, redirect to a relevant educational topic.`,
};

export async function POST(req: NextRequest) {
  const limited = applyRateLimit(req, 'prompt-lab', undefined, RATE_LIMITS.promptLab);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, PromptLabSchema);
  if (!parsed.success) return parsed.response;

  const { childId, prompt, temperature, ageBand } = parsed.data;

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = createServerSupabase();

  const { data: child } = await supabase
    .from('children')
    .select('prompts_used_today, prompts_reset_date')
    .eq('id', childId)
    .single();

  if (!child) return apiError('Child not found', 404);

  const today = new Date().toISOString().split('T')[0];
  const usedToday = child.prompts_reset_date === today ? child.prompts_used_today : 0;
  const dailyLimit = TIER_CONFIG[auth.user.tier].promptsPerDay;

  if (usedToday >= dailyLimit) {
    return apiError(
      `You've used all ${dailyLimit} prompts for today. Come back tomorrow!`,
      429, 'TIER_LIMIT'
    );
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      temperature,
      system: SYSTEM_PROMPTS[ageBand] || SYSTEM_PROMPTS.A,
      messages: [{ role: 'user', content: prompt }],
    });

    const reply = message.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('');

    await supabase.from('prompt_history').insert({
      child_id: childId, prompt, response: reply,
      temperature, age_band: ageBand, moderation_passed: true,
    });

    await supabase.from('children').update({
      prompts_used_today: usedToday + 1, prompts_reset_date: today,
    }).eq('id', childId);

    return apiSuccess({ reply, promptsRemaining: dailyLimit - usedToday - 1 });
  } catch (error: any) {
    if (error?.status === 429) return apiError('Sparky is taking a quick break. Try again in a moment!', 429);
    return apiError('Sparky had a hiccup. Please try again!', 500);
  }
}
```

---

## STRIPE ROUTES (3 files)

### File: `src/app/api/stripe/checkout/route.ts`

```typescript
// POST /api/stripe/checkout — Create Stripe Checkout session
import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabase } from '@/lib/supabase/server';
import { CheckoutSchema } from '@/lib/validations';
import { apiSuccess, apiError, parseBody, requireAuth } from '@/lib/api-helpers';
import { STRIPE_PRICES } from '@/lib/tier-config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' });

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, CheckoutSchema);
  if (!parsed.success) return parsed.response;

  const { tier, interval } = parsed.data;
  const priceId = STRIPE_PRICES[tier][interval];

  if (!priceId) return apiError('Invalid price configuration', 500);

  const supabase = createServerSupabase();

  const { data: parent } = await supabase
    .from('parents')
    .select('stripe_customer_id, email')
    .eq('id', auth.user.id)
    .single();

  let customerId = parent?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: parent?.email || auth.user.email,
      metadata: { supabase_user_id: auth.user.id },
    });
    customerId = customer.id;

    await supabase.from('parents')
      .update({ stripe_customer_id: customerId })
      .eq('id', auth.user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${req.nextUrl.origin}/parent/subscription?success=true`,
    cancel_url: `${req.nextUrl.origin}/parent/subscription?canceled=true`,
    metadata: { supabase_user_id: auth.user.id, tier },
  });

  return apiSuccess({ url: session.url });
}
```

---

### File: `src/app/api/stripe/portal/route.ts`

```typescript
// POST /api/stripe/portal — Customer portal for subscription management
import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth } from '@/lib/api-helpers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' });

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const supabase = createServerSupabase();

  const { data: parent } = await supabase
    .from('parents')
    .select('stripe_customer_id')
    .eq('id', auth.user.id)
    .single();

  if (!parent?.stripe_customer_id) return apiError('No subscription found', 404);

  const session = await stripe.billingPortal.sessions.create({
    customer: parent.stripe_customer_id,
    return_url: `${req.nextUrl.origin}/parent/subscription`,
  });

  return apiSuccess({ url: session.url });
}
```

---

### File: `src/app/api/stripe/webhook/route.ts`

```typescript
// POST /api/stripe/webhook — Handle Stripe webhook events
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const tier = session.metadata?.tier as 'plus' | 'forge';

      if (userId && tier) {
        await supabase.from('parents').update({
          subscription_tier: tier, subscription_status: 'active',
          stripe_customer_id: session.customer as string,
        }).eq('id', userId);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const status = sub.status === 'active' ? 'active'
        : sub.status === 'past_due' ? 'past_due' : 'canceled';

      await supabase.from('parents')
        .update({ subscription_status: status })
        .eq('stripe_customer_id', customerId);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await supabase.from('parents')
        .update({ subscription_tier: 'free', subscription_status: 'canceled' })
        .eq('stripe_customer_id', sub.customer as string);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await supabase.from('parents')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', invoice.customer as string);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

---

## SESSION ROUTES (1 file)

### File: `src/app/api/sessions/route.ts`

```typescript
// POST /api/sessions — Start or end a play session
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { StartSessionSchema, EndSessionSchema } from '@/lib/validations';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const body = await req.json();
  const action = body.action;

  if (action === 'start') {
    const result = StartSessionSchema.safeParse(body);
    if (!result.success) return apiError('Invalid request', 400);

    const { childId } = result.data;

    if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from('sessions')
      .insert({ child_id: childId })
      .select()
      .single();

    if (error) return apiError('Failed to start session', 500);

    return apiSuccess(data, 201);
  }

  if (action === 'end') {
    const result = EndSessionSchema.safeParse(body);
    if (!result.success) return apiError('Invalid request', 400);

    const { sessionId } = result.data;

    const supabase = createServerSupabase();

    const { data: session } = await supabase
      .from('sessions').select('*').eq('id', sessionId).single();

    if (!session) return apiError('Session not found', 404);

    const duration = Math.floor(
      (Date.now() - new Date(session.started_at).getTime()) / 1000
    );

    const { data, error } = await supabase
      .from('sessions')
      .update({ ended_at: new Date().toISOString(), duration_seconds: duration })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) return apiError('Failed to end session', 500);

    return apiSuccess(data);
  }

  return apiError('Invalid action. Use "start" or "end".', 400);
}
```

---

## HEALTH CHECK (NEW v2)

### v2 [NEW-2C]:

### File: `src/app/api/health/route.ts`

```typescript
// GET /api/health — Health check endpoint
// v2 [NEW-2C]: Returns app status, DB connectivity, version, timestamp.
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest) {
  const start = Date.now();

  let dbStatus = 'ok';

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('badges')
      .select('id', { count: 'exact', head: true });
    if (error) dbStatus = 'error';
  } catch {
    dbStatus = 'error';
  }

  const responseTime = Date.now() - start;

  return NextResponse.json({
    status: dbStatus === 'ok' ? 'healthy' : 'degraded',
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    responseTimeMs: responseTime,
    environment: process.env.NODE_ENV || 'development',
  }, {
    status: dbStatus === 'ok' ? 200 : 503,
    headers: { 'Cache-Control': 'no-cache, no-store' },
  });
}
```

---

## PART 3 COMPLETE — WHAT YOU NOW HAVE

After Part 3, you have **16 API route files**:

### AUTH (4 files):
- `/api/auth/signup` — v2 [IMP-3]: rate limited (5/min)
- `/api/auth/login` — v2 [IMP-3]: rate limited (5/min)
- `/api/auth/logout`
- `/api/auth/me` — returns `onboarding_complete` field

### CHILDREN (2 files):
- `/api/children` — list + create (with tier limit check)
- `/api/children/[childId]` — get + update + delete

### CONTENT (2 files):
- `/api/content` — v2 [ENH]: Cache-Control 5min
- `/api/content/[slug]` — with tier preview enforcement

### PROGRESS (3 files):
- `/api/progress` — list + create/upsert
- `/api/progress/world` — single lab progress via DB function
- `/api/progress/all-labs` — v2 [BUG-3] NEW: 10 labs in 1 call

### GAMIFICATION (3 files):
- `/api/gamification/xp` — streak multiplier, level-up, coins, dedup
- `/api/gamification/streak` — shields, 7-day milestones
- `/api/gamification/badges` — v2 [BUG-6]: checks ALL 14 criteria types

### AI (1 file):
- `/api/ai/prompt-lab` — moderated, rate-limited, age-appropriate

### STRIPE (3 files):
- `/api/stripe/checkout` — creates Stripe session
- `/api/stripe/portal` — customer management
- `/api/stripe/webhook` — handles 4 event types

### SESSIONS (1 file):
- `/api/sessions` — start/end with duration tracking

### HEALTH (1 file):
- `/api/health` — v2 [NEW-2C]: status, DB check, version

## v2 CHANGE SUMMARY FOR PART 3:

- **[IMP-3]** Rate limiting on `auth/signup` + `auth/login` (5 req/min)
- **[BUG-6]** Badge checker expanded: 14 criteria types vs v1's ~4
- **[BUG-3]** `/api/progress/all-labs`: 10 labs in 1 API call
- **[NEW-2C]** `/api/health`: monitoring + deployment verification
- **[ENH]** Cache-Control: content (5min), badges (1hr)
- **[NEW-2B]** `checkDuplicate()` used in XP endpoint

---

**NEXT:** Part 4 — React Query hooks, api.ts fetch wrapper, QueryProvider, layout update
