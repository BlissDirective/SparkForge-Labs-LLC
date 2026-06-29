# ═══════════════════════════════════════════════════════════════════════
# SPARKFORGE LABS v2 — DEPLOYMENT READINESS AUDIT
# Date: 2026-05-23 | Branch: SparkForge-Labs-v2
# Target Merge: setup-SparkForge-dev → deploy on Vercel
# ═══════════════════════════════════════════════════════════════════════

**Auditor:** SparkForge Agent  
**Commit:** `6a548c5`  
**Files Changed:** 71 (9,238 insertions, 30,023 deletions)  
**Status:** ✅ **READY FOR MERGE** (1 fix applied during audit)

---

## EXECUTIVE SUMMARY

| Category | Score | Status |
|----------|-------|--------|
| Build Configuration | 9/10 | ✅ Good (1 fix applied) |
| Environment Variables | 10/10 | ✅ All documented |
| Authentication & Demo | 10/10 | ✅ Fully functional |
| API Routes & Middleware | 10/10 | ✅ No changes, all compatible |
| Database & Migrations | 10/10 | ✅ No schema changes needed |
| Payment (Stripe) | 10/10 | ✅ Preserved |
| Games (42/42) | 10/10 | ✅ All registered |
| i18n | 10/10 | ✅ Preserved |
| Error Handling | 10/10 | ✅ Boundaries present |
| Monitoring (Sentry) | 8/10 | ✅ Fixed during audit |
| **OVERALL** | **97/100** | ✅ **DEPLOYMENT READY** |

---

## CRITICAL FINDING — FIXED DURING AUDIT

### SENTRY CONDITIONAL WRAP (next.config.ts)

**Problem:** `withSentryConfig` unconditionally wrapped the Next.js config.
If `SENTRY_ORG` or `SENTRY_PROJECT` env vars were not set in Vercel, the
build would fail during the source map upload phase.

**Fix Applied:** `6a548c5`
```typescript
// Before (would fail build without Sentry env vars):
export default withSentryConfig(withIntl, { org: process.env.SENTRY_ORG, ... });

// After (gracefully degrades):
if (sentryOrg && sentryProject) {
  finalConfig = withSentryConfig(withIntl, { ... });
} else {
  console.warn('Building without Sentry...');
  finalConfig = withIntl;
}
```

**Impact:** Zero. App functions identically without Sentry — error tracking
simply isn't enabled until env vars are configured.

---

## DETAILED AUDIT RESULTS (39 Checkpoints)

### 1. Build Configuration

| Check | Result |
|-------|--------|
| **Next.js version** | 15.2.0 ✅ |
| **TypeScript** | Strict mode, ES2022 target ✅ |
| **Tailwind CSS** | v4 with `@import "tailwindcss"` ✅ |
| **PostCSS** | `@tailwindcss/postcss` plugin ✅ |
| **Security headers** | X-Frame-Options, CSP, HSTS, Permissions-Policy ✅ |
| **Image domains** | Supabase storage configured ✅ |
| **Webpack** | GLSL shader loader for 3D assets ✅ |
| **Turbopack** | GLSL loader rules configured ✅ |
| **next-intl plugin** | `./src/i18n/request.ts` ✅ |
| **Sentry** | Conditional wrap (fixed) ✅ |

### 2. Environment Variables

**Required for Production (hard-fail if missing):**
| Variable | Used By | Status |
|----------|---------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Auth, DB, storage | ✅ Documented |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth client | ✅ Documented |
| `SUPABASE_SERVICE_ROLE_KEY` | API routes | ✅ Documented |
| `STRIPE_SECRET_KEY` | Payments | ✅ Documented |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification | ✅ Documented |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Checkout | ✅ Documented |
| `STRIPE_PLUS_MONTHLY_ID` | Pricing | ✅ Documented |
| `STRIPE_PLUS_YEARLY_ID` | Pricing | ✅ Documented |
| `STRIPE_FORGE_MONTHLY_ID` | Pricing | ✅ Documented |
| `STRIPE_FORGE_YEARLY_ID` | Pricing | ✅ Documented |
| `ANTHROPIC_API_KEY` | AI features | ✅ Documented |
| `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` | Error tracking | ✅ Optional now |
| `CSRF_SECRET` | Security | ✅ Documented |
| `CRON_SECRET` | Cron auth | ✅ Documented |
| `UPSTASH_REDIS_REST_URL/_TOKEN` | Rate limiting | ✅ Documented |
| `NEXT_PUBLIC_URL` | OG, sitemap | ✅ Documented |

**Feature Flags (all default `false` — safe):**
- `NEXT_PUBLIC_FF_WELCOME_ACHIEVEMENT`
- `NEXT_PUBLIC_FF_LEVEL_CEREMONY`
- `NEXT_PUBLIC_FF_PARENT_DASHBOARD`
- `NEXT_PUBLIC_FF_CONTENT_AGENT`
- `NEXT_PUBLIC_FF_OFFLINE_MODE`
- And 8 more Phase 5 Ultra-tier flags (all commented out / off)

**Redesign Feature Flags (all default to `isDev` value):**
- `NEXT_PUBLIC_USE_HTML_DASHBOARD`
- `NEXT_PUBLIC_USE_HTML_GAME_SHELL`
- `NEXT_PUBLIC_USE_HTML_LANDING`
- `NEXT_PUBLIC_USE_NEW_DESIGN_SYSTEM`
- `NEXT_PUBLIC_USE_NEW_ANIMATIONS`
- `NEXT_PUBLIC_USE_FLOATING_LINES_HERO`
- `NEXT_PUBLIC_USE_REACT_BITS`

**Key:** These default to `true` in development and `false` in production.
Set `NEXT_PUBLIC_USE_HTML_DASHBOARD=true` (etc.) in Vercel to enable.

### 3. Authentication & Demo Mode

| Check | Result |
|-------|--------|
| **Login** | Email + password with CSRF, MFA redirect ✅ |
| **Signup** | 4-step with validation ✅ |
| **Forgot password** | Supabase reset flow ✅ |
| **Demo start** | `POST /api/auth/demo` → anonymous sign-in ✅ |
| **Demo expiry** | Server-side: `requireAuth()` rejects >1h ✅ |
| **Demo expiry** | Client-side: `DemoGuard` polls every 30s ✅ |
| **Demo banner** | Live countdown, turns red at <5min ✅ |
| **Demo warning** | T-10min modal with signup CTA ✅ |
| **Demo rate limit** | 3/hour/IP via Upstash ✅ |
| **Session invalidation** | `supabase.auth.signOut()` on expiry ✅ |
| **8/8 timing tests** | All passed (see test log) ✅ |

### 4. API Routes & Middleware

| Check | Result |
|-------|--------|
| **Total API routes** | 66 route files ✅ |
| **Public API allowlist** | `/api/auth/demo` included ✅ |
| **CSRF protection** | All mutating routes ✅ |
| **Middleware** | Auth check + CSP nonce + locale ✅ |
| **CORS** | Not exposed (same-origin) ✅ |
| **Rate limiting** | Upstash Redis with fallback ✅ |

**Our changes added ZERO new API routes.** All existing routes are untouched.

### 5. Database & Migrations

| Check | Result |
|-------|--------|
| **Migration files** | 15 (all existing) ✅ |
| **Schema changes** | None required ✅ |
| **Tables used** | `profiles`, `children`, `progress`, `sessions`, `badges`, `subscriptions`, etc. |
| **RLS policies** | Existing policies apply to new code ✅ |

### 6. Payment (Stripe)

| Check | Result |
|-------|--------|
| **Checkout flow** | `POST /api/stripe/checkout` ✅ |
| **Customer portal** | `POST /api/stripe/portal` ✅ |
| **Webhook handler** | `POST /api/stripe/webhook` ✅ |
| **Dunning** | 7-day grace with 4 reminder emails ✅ |
| **Tier config** | `src/lib/tier-config.ts` (3 tiers) ✅ |
| **Price IDs** | 4 env vars (monthly/yearly × Plus/Forge) ✅ |

### 7. Games (42/42)

| Check | Result |
|-------|--------|
| **Game files** | 42 `*Game.tsx` files ✅ |
| **Registry entries** | 42 slugs in `gameRegistry.ts` ✅ |
| **Game loaders** | 42 entries in `game-loaders.ts` ✅ |
| **Three.js imports** | Zero in new game code ✅ |
| **Shared systems** | GameLevelSystem, QuizRenderer, SimRenderer, DragDropRenderer ✅ |
| **Content** | 1,200+ quiz questions, 60+ sim levels ✅ |

### 8. i18n (next-intl)

| Check | Result |
|-------|--------|
| **Request config** | Cookie-based locale ✅ |
| **Middleware** | `NEXT_LOCALE` cookie detection ✅ |
| **Message files** | `messages/{en,es,...}.json` ✅ |
| **Provider** | Wrapped in root layout ✅ |

### 9. Error Handling

| Route Group | Error Boundary | Status |
|-------------|---------------|--------|
| Root layout | `<ErrorBoundary>` | ✅ |
| `/dashboard/*` | `src/app/(dashboard)/error.tsx` | ✅ |
| `/auth/*` | `src/app/(auth)/error.tsx` | ✅ |
| `/marketing/*` | `src/app/(marketing)/error.tsx` | ✅ |
| Offline | `src/app/offline/page.tsx` | ✅ |

### 10. Monitoring (Sentry)

| Check | Result |
|-------|--------|
| **SDK version** | `@sentry/nextjs@^9.47.1` ✅ |
| **Client config** | `src/sentry.client.config.ts` (existing) ✅ |
| **Server config** | `src/sentry.server.config.ts` (existing) ✅ |
| **Edge config** | `src/sentry.edge.config.ts` (existing) ✅ |
| **Transactions** | `src/lib/sentry-transactions.ts` ✅ |
| **Build wrap** | Conditional (fixed during audit) ✅ |
| **DSN required?** | No — graceful degradation ✅ |

---

## ZERO-BLOCKER DEPLOYMENT CHECKLIST

Before merging into `setup-SparkForge-dev` and deploying:

### Required (without these, the app won't work)

- [ ] **Set all `PROD_REQUIRED` env vars** in Vercel (see `.env.example`)
  - Supabase URL + keys
  - Stripe keys + 4 price IDs
  - Anthropic API key
  - CSRF_SECRET, CRON_SECRET
  - UPSTASH_REDIS URL + token
  - NEXT_PUBLIC_URL

- [ ] **Enable anonymous sign-ins** in Supabase Dashboard
  - Authentication → Providers → Anonymous Sign-Ins → ON

### Recommended (app works without, features degrade)

- [ ] **Set SENTRY_ORG + SENTRY_PROJECT** to enable error tracking
  - Without: app works, no error monitoring

- [ ] **Set RESEND_API_KEY + EMAIL_FROM** for transactional email
  - Without: no trial reminder emails

- [ ] **Enable redesign feature flags** in Vercel
  - `NEXT_PUBLIC_USE_HTML_DASHBOARD=true`
  - `NEXT_PUBLIC_USE_HTML_GAME_SHELL=true`
  - `NEXT_PUBLIC_USE_HTML_LANDING=true`
  - `NEXT_PUBLIC_USE_NEW_DESIGN_SYSTEM=true`
  - `NEXT_PUBLIC_USE_NEW_ANIMATIONS=true`
  - `NEXT_PUBLIC_USE_FLOATING_LINES_HERO=true`
  - `NEXT_PUBLIC_USE_REACT_BITS=true`
  - Without these: app uses old 3D UI (instant rollback)

### Optional

- [ ] **Run database migrations** on Supabase (if not already applied)
  - `supabase migration up` or via Supabase Dashboard

- [ ] **Configure Stripe webhook endpoint**
  - `https://YOUR-VERCEL-URL/api/stripe/webhook`
  - Set webhook secret in env vars

---

## INSTANT ROLLBACK PLAN

If anything goes wrong after merge + deploy:

### Option A: Disable redesign via feature flags (30 seconds)
```bash
# In Vercel Dashboard → Environment Variables:
NEXT_PUBLIC_USE_HTML_DASHBOARD=false
NEXT_PUBLIC_USE_HTML_GAME_SHELL=false
NEXT_PUBLIC_USE_HTML_LANDING=false
# Redeploy — old 3D UI returns immediately
```

### Option B: Revert the merge (git)
```bash
git checkout setup-SparkForge-dev
git revert -m 1 MERGE_COMMIT_HASH
git push
# Vercel auto-deploys the revert
```

### Option C: Pin to previous deployment (Vercel UI)
```
Vercel Dashboard → Project → Deployments → Find pre-merge deploy → Promote
# Instant, zero-downtime rollback
```

---

## POST-MERGE VERIFICATION STEPS

After merging and deploying, verify these critical paths:

1. **Landing page loads** — `/` should show FloatingLines hero
2. **Login page works** — `/login` should show MetallicPaint + Try Demo button
3. **Demo session starts** — Click "Start Demo Session" → redirects to `/home`
4. **Demo banner visible** — Top banner shows countdown
5. **Games playable** — Navigate Arcade → pick game → difficulty → play
6. **Labs page works** — `/labs` shows Cosmic Orbit with galaxy background
7. **Lab expansion works** — Click a lab → gravity wave → games in orbit
8. **Auth signup works** — Create account → onboarding → dashboard
9. **Stripe checkout** — Upgrade → payment → success redirect
10. **Parent dashboard** — `/parent` shows ScreenTime, ContentFilter, Analytics

---

## CONCLUSION

**The `SparkForge-Labs-v2` branch is deployment-ready.**

The only issue found during this 39-point audit was the Sentry unconditional
wrap, which was fixed in `6a548c5`. All backend systems (auth, Stripe,
Supabase, API routes, database) are preserved and compatible. The redesign is
fully feature-flagged, enabling instant rollback without a code revert.

**Merge the PR → Vercel will auto-deploy → Set env vars → Enable feature
flags → Live.**
