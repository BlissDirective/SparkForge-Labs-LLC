
# ═══════════════════════════════════════════════════════════════════════════════
# SPARKFORGE BACKEND AUDIT REPORT — Pre-Merge Assessment
# ═══════════════════════════════════════════════════════════════════════════════
# Target branch: setup-SparkForge-dev (Stripe, Supabase, Vercel connected)
# Audit date: 2026-05-22
# Auditor: Full-stack review of all backend layers
# ═══════════════════════════════════════════════════════════════════════════════

## EXECUTIVE SUMMARY

**Overall Status: COMPATIBLE with 3 CRITICAL issues to fix before merge**

The redesigned frontend (Phases 1-5) is **fully compatible** with the existing
backend. All 72 API routes, SQL schema, auth system, Stripe integration, and
Supabase RLS policies are intact and require **zero modifications**. However,
three issues in our redesigned code must be fixed before merge to prevent
runtime failures.

---

## 1. BACKEND ARCHITECTURE OVERVIEW (Verified Intact)

### 1.1 API Routes — 72 Endpoints (All Preserved)

| Category | Count | Key Endpoints Used by Redesign |
|----------|-------|-------------------------------|
| Auth | 21 | `/api/auth/login`, `/api/auth/signup`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/demo`, `/api/auth/callback` |
| Children | 2 | `/api/children` (GET/POST), `/api/children/:id` (GET/PATCH/DELETE) |
| Progress | 3 | `/api/progress`, `/api/progress/world`, `/api/progress/all-labs` |
| Content | 2 | `/api/content`, `/api/content/:slug` |
| Gamification | 3 | `/api/gamification/xp`, `/api/gamification/streak`, `/api/gamification/badges` |
| Parent | 2 | `/api/parent/dashboard`, `/api/parent/usage` |
| Sessions | 1 | `/api/sessions` (POST start/end) |
| Stripe | 7 | `/api/stripe/checkout`, `/api/stripe/portal`, `/api/stripe/webhook`, etc. |
| AI/Agent | 7 | `/api/ai/guide`, `/api/ai/generate-content`, `/api/ai/prompt-lab`, `/api/agent/*` |
| Admin | 5 | `/api/admin/*` (subscriptions, children, content) |
| Cron | 3 | `/api/cron/*` (trial-reminders, dunning, annual-reminder) |
| MFA | 6 | `/api/auth/mfa/*` (factors, enroll, verify, challenge) |
| Passkeys | 5 | `/api/auth/passkeys/*` (register, authenticate, verify) |
| OAuth | 2 | `/api/auth/oauth/:provider`, `/api/auth/identities` |
| Other | 4 | `/api/health`, `/api/i18n/locale`, `/api/docs`, `/api/jobs/*` |

**Verdict: ALL ENDPOINTS PRESERVED — No route conflicts introduced by redesign**

### 1.2 SQL Schema — 26 Migration Files (All Required)

Core tables verified:
- `parents` — auth users, subscriptions, COPPA consent, admin flags
- `children` — child profiles with `daily_time_limit_minutes` column (Stage 8)
- `content` — lessons, quizzes, games across 10 labs/worlds
- `progress` — completion tracking with RLS
- `badges` / `child_badges` — 68 badges across 9 categories
- `sessions` — play session tracking
- `prompt_history` — COPPA-compliant (30-day auto-delete)
- `content_queue` — AI-generated content review pipeline

Key functions:
- `get_lab_progress(UUID, INT, TEXT)` — lab completion % (SECURITY INVOKER)
- `get_parent_dashboard(UUID)` — aggregated parent data (SECURITY DEFINER + auth.uid() check)
- `reset_daily_prompts()` / `reset_weekly_games()` — automatic counter resets
- `cleanup_old_prompts()` — COPPA 30-day cleanup

**Verdict: ALL TABLES/FUNCTIONS PRESENT — No schema changes needed**

### 1.3 Auth System — Multi-Layer (Fully Compatible)

Auth flow in original codebase:
```
Client ──fetch()──> /api/auth/login ──> Supabase SSR signInWithPassword()
Client ──fetch()──> /api/auth/signup ──> Supabase SSR signUp()
Client ──fetch()──> /api/auth/logout ──> Supabase SSR signOut()
```

Features verified:
- Supabase SSR sessions with httpOnly/Secure/Lax cookies
- CSRF double-submit protection (HMAC-verified tokens)
- Rate limiting via Upstash Redis (5 req/min auth, 100 req/min general)
- MFA TOTP (feature-flagged)
- WebAuthn passkeys (feature-flagged)
- OAuth (Google, Apple, Microsoft)
- Demo sessions (Supabase anonymous users, 1-hour cap)
- COPPA consent gating (`requireAuthWithConsent`)
- Admin role system (`requireAdmin`)

**Verdict: FULLY COMPATIBLE — Our redesign uses the same auth store pattern**

### 1.4 Supabase Integration (Verified)

| Component | Status | Notes |
|-----------|--------|-------|
| `@supabase/ssr` client | OK | Browser + server clients with cookie management |
| `@supabase/supabase-js` admin | OK | Service-role for signup parent row insert |
| RLS policies | OK | 10+ RLS SQL files enforcing row-level security |
| Realtime | OK | `sql/024_realtime_progress.sql` enables realtime |
| PG Cron | OK | Daily resets at UTC midnight |

### 1.5 Stripe Integration (Verified)

| Component | Status | Notes |
|-----------|--------|-------|
| Stripe.js v8.8 | OK | Client-side payment elements |
| Checkout sessions | OK | `/api/stripe/checkout` with trial support |
| Customer portal | OK | `/api/stripe/portal` |
| Webhook handler | OK | `/api/stripe/webhook` with signature verification |
| Subscription changes | OK | `/api/stripe/subscription/change` |
| Invoice preview | OK | `/api/stripe/invoice-preview` |
| Dunning management | OK | `sql/025_dunning.sql` + `/api/cron/dunning` |
| 3-tier pricing | OK | Free/Plus($7.99)/Forge($14.99) with yearly savings |

---

## 2. FRONTEND-BACKEND CONTRACT VERIFICATION

### 2.1 Hooks -> API Compatibility Matrix

| Hook | API Endpoint | Status | Used In |
|------|-------------|--------|---------|
| `useChildren` | GET /api/children | OK | Home, Parent, Profile, Settings |
| `useActiveChild` | (from store) | OK | All dashboard pages |
| `useAllLabsProgress` | GET /api/progress/all-labs | OK | Home, Progress, Parent |
| `useLabProgress` | GET /api/progress/world | OK | Labs page |
| `useCompleteContent` | POST /api/progress | OK | Game completion flow |
| `useGamification().awardXP` | POST /api/gamification/xp | OK | Celebration overlay |
| `useGamification().checkBadges` | POST /api/gamification/badges | OK | After game completion |
| `useParentDashboard` | GET /api/parent/dashboard | OK | Parent page (ScreenTimeCard) |
| `useParentUsage` | GET /api/parent/usage | OK | Parent page |
| `useSessionTracker` | POST /api/sessions | OK | Game play page |
| `useTrialStatus` | GET /api/auth/me | OK | Subscription page |
| `useContent` | GET /api/content | OK | Labs, content pages |

**Verdict: ALL CONTRACTS HONORED — Every hook maps to an existing API route**

### 2.2 Game Loader Compatibility

The game play page (`/arcade/[gameSlug]`) uses `GAME_LOADERS` from `game-loaders.ts`
which dynamically imports 35 game components. Our `GameAdapter` pattern bridges
this with `HtmlGameShell` via feature flag — no game files are modified.

**Verdict: ZERO GAME FILE CHANGES NEEDED**

---

## 3. CRITICAL ISSUES (Must Fix Before Merge)

### 🔴 CRITICAL-001: Missing `@/lib/auth/client` Module

**Files affected:**
- `src/app/(auth)/login/page.tsx` (line 24)
- `src/app/(auth)/signup/page.tsx` (line 36)

**Problem:** Both auth pages do:
```tsx
const { signIn } = await import('@/lib/auth/client');
await signIn(email, password);
```

**But `src/lib/auth/client.ts` does NOT exist.** The codebase uses direct `fetch()`
calls to API routes. Auth is done via:
```tsx
// CORRECT pattern (from existing LoginFormCard):
const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...csrfHeader() },
  body: JSON.stringify({ email, password }),
});
const data = await res.json();
if (!res.ok) throw new Error(data.error);
```

**Fix required:** Replace the dynamic import pattern with direct fetch calls
using `csrfHeader()` from `@/lib/api`.

---

### 🟡 CRITICAL-002: ScreenTimeCard Doesn't Persist to Server

**File:** `src/components/parent/ScreenTimeCard.tsx`

**Problem:** The `onUpdateLimit` callback only updates local Zustand state:
```tsx
// parentStore.ts line 50 — local state only:
updateChildTimeLimit: (childId, minutes) =>
  set((state) => ({
    children: state.children.map((c) =>
      c.id === childId ? { ...c, daily_time_limit_minutes: minutes } : c
    ),
  })),
```

There's no API call to PATCH `/api/children/:childId` with the new time limit.
The backend supports this (verified in `src/app/api/children/[childId]/route.ts`
line 38: `if (parsed.data.dailyTimeLimitMinutes !== undefined)`).

**Fix required:** Add a server sync call in ScreenTimeCard's `handleAdjust`
and `handlePreset` functions:
```tsx
await apiFetch(`/api/children/${childId}`, {
  method: 'PATCH',
  body: JSON.stringify({ dailyTimeLimitMinutes: newLimit }),
});
```

---

### 🟡 CRITICAL-003: ProgressCharts `hoursPlayed` Calculation Mismatch

**File:** `src/app/(dashboard)/progress/page.tsx`

**Problem:** The stats calculation uses:
```tsx
hoursPlayed: Math.round((child?.xp ?? 0) / 60),
```
This treats XP as minutes, which is incorrect. XP and time are different
metrics. The `total_time_minutes` from `useParentDashboard` should be used
instead for accurate time display.

**Fix required:** Use `total_time_minutes` from parent dashboard data or
compute from session data.

---

## 4. WARNINGS (Non-blocking, Should Fix)

### W-001: Existing Pages Still Import Old Cockpit Stores

**Files:**
- `src/app/(dashboard)/onboarding/page.tsx` — imports `useCockpitScene`, `useCockpitStore`
- `src/app/(dashboard)/parent/subscription/page.tsx` — imports `useCockpitBroadcast`, `useCockpitStore`
- `src/app/(dashboard)/labs/[labId]/page.tsx` — imports `useCockpitStore`, `useCockpitBroadcast`

**Impact:** These are NOT our redesigned pages. They'll continue working since
the 3D stores remain in the codebase. The feature flag system prevents the 3D
cockpit from loading on the new layout. No merge conflict.

**Recommendation:** Leave as-is. These pages can be redesigned in future phases.

### W-002: `useParentDashboard` Doesn't Auto-Refresh After Time Limit Update

When the user changes the time limit in ScreenTimeCard, the parent dashboard
data won't reflect the change until a page refresh because `useParentDashboard`
doesn't invalidate the React Query cache.

**Fix:** After the PATCH call, invalidate the query cache:
```tsx
queryClient.invalidateQueries({ queryKey: ['parent', 'dashboard'] });
```

### W-003: Auth Pages Missing CSRF Header

Our redesigned auth pages don't include the CSRF header in their login/signup
requests. The middleware enforces CSRF on state-mutating API calls. Without the
header, the requests will be rejected with 403 CSRF_FAILED.

**Fix:** Import `csrfHeader` from `@/lib/api` and spread it into fetch headers.

---

## 5. FILES TO REMOVE BEFORE MERGE

### Backend: NONE

No backend files (API routes, SQL, lib helpers) need removal. The original
`setup-SparkForge-dev` branch already has all backend infrastructure.

### Frontend — Safe to Remove (3D cockpit, superseded):

| File/Directory | Reason |
|---------------|--------|
| `src/components/auth/_SUPERSEDED/` | Old LoginFormCard replaced by new login page |
| `src/components/3d/` | 3D cockpit components (feature-flagged, not imported by new code) |
| `COCKPIT_ARCHITECTURE_CURRENT.json` | 3D architecture doc |
| `SparkForge-Full-ControlScreen.json` | Old design spec |
| `SparkForge-New-Design/` | Old design exploration files |

**IMPORTANT:** These are safe to remove because:
1. Our new layout (`src/app/(dashboard)/layout.tsx`) doesn't import them
2. Feature flags (`USE_HTML_DASHBOARD`, `USE_HTML_GAME_SHELL`) prevent loading
3. All new pages use the HTML-first component system

**KEEP these (still used):**
- `src/stores/cockpitStore.ts` — still imported by subscription, onboarding, labs pages
- `src/stores/cockpitBroadcastStore.ts` — same reason
- All game components in `src/components/games/` — loaded dynamically via `GAME_LOADERS`

---

## 6. MERGE CHECKLIST

### Before Merging:
- [ ] Fix CRITICAL-001: Replace `@/lib/auth/client` imports with direct fetch() calls
- [ ] Fix CRITICAL-002: Add server persistence to ScreenTimeCard
- [ ] Fix CRITICAL-003: Correct hoursPlayed calculation in progress page
- [ ] Fix W-003: Add CSRF headers to auth page fetch calls
- [ ] Run `npm run build` to verify no compilation errors
- [ ] Run `npm run lint` to catch any issues

### After Merging (on `setup-SparkForge-dev`):
- [ ] Run all SQL migrations on Supabase (if not already applied)
- [ ] Verify Stripe webhook endpoint URL in dashboard
- [ ] Test auth flow (signup → email verification → login → child creation)
- [ ] Test game play (XP award → badge check → progress update)
- [ ] Test Stripe checkout (trial → subscription → portal)
- [ ] Test parent dashboard (screen time, content filters)

### No Action Needed (verified compatible):
- [x] All 72 API routes
- [x] All SQL schema migrations
- [x] Supabase auth + RLS
- [x] Stripe integration
- [x] Rate limiting + CSRF
- [x] All game loader dynamic imports
- [x] All React Query hooks
- [x] Feature flag system

---

## 7. ENVIRONMENT VARIABLES (Verified)

All required env vars are documented in `.env.example`. The `setup-SparkForge-dev`
branch should already have these configured in Vercel:

| Variable | Purpose | Status |
|----------|---------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase key | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key for server ops | Required |
| `STRIPE_SECRET_KEY` | Stripe API key | Required |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | Required |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe.js key | Required |
| `STRIPE_*_PRICE_ID` | Product price IDs | Required |
| `ANTHROPIC_API_KEY` | AI content generation | Required |
| `UPSTASH_REDIS_REST_URL/TOKEN` | Rate limiting | Required in prod |
| `CSRF_SECRET` | CSRF token HMAC | Required |
| `CRON_SECRET` | Cron job auth | Required |
| `SENTRY_DSN` | Error tracking | Optional |
| `RESEND_API_KEY` | Email notifications | Optional |

---

## CONCLUSION

The redesigned SparkForge frontend is **architecturally compatible** with the
existing `setup-SparkForge-dev` backend. The 72 API routes, SQL schema, auth
system, Stripe integration, and Supabase RLS policies all remain intact and
require no modifications.

**Only 3 issues in our redesigned code need fixing before merge:**
1. Auth pages use a non-existent module (`@/lib/auth/client`)
2. Screen time changes don't persist to the server
3. Hours played calculation is incorrect

These are all frontend fixes — the backend is ready.
