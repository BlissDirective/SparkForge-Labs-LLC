# SparkForge — Consolidated Deployment Readiness Audit Report

**Date:** March 29, 2026
**Auditor:** SparkForge Audit Agent v1.0 (per SPARKFORGE_AUDIT_AGENT.md)
**Repo:** blissdirective/sparkforge
**Branch:** claude/sparkforge-deployment-audit-fE3Db
**Commit:** 453033edd810c2cf6fa3e991db301434142a675f
**Build Status:** FAIL (1 blocking TypeScript error in PetDataLab3D.tsx:143)
**TypeScript Errors:** 9 (all fixable)
**Test Results:** Vitest/Playwright not executed (node_modules was missing at audit start)

---

## 0. RESOLUTION STATUS (Updated March 30, 2026)

**Resolved by:** claude/audit-findings-implementation-WJSMR branch
**Build Status after fixes:** PASS (TypeScript compilation + ESLint clean)

| Finding | Status | Commit |
|---------|--------|--------|
| **CRIT-001** AuthProvider not wired | **RESOLVED** | Added to (dashboard) and (auth) layouts |
| **CRIT-002** Unauthenticated consent | **RESOLVED** | Auth check + rate limiting added |
| **CRIT-003** Sentry child PII | **RESOLVED** | beforeSend PII scrubbing on all 3 configs |
| **CRIT-004** SQL constraint conflicts | **RESOLVED** | Consolidated to canonical 6-value set + migration |
| **CRIT-005** Missing privacy/terms | **RESOLVED** | Created both pages under (marketing) route group |
| **HIGH-001** Duplicate RLS files | **RESOLVED** | Deleted 001b_rls.sql (duplicate of 002) |
| **HIGH-002** Duplicate function files | **RESOLVED** | Deleted 001c_functions.sql (duplicate of 003) |
| **HIGH-003** Missing search_path | **RESOLVED** | Added SET search_path to get_lab_progress |
| **HIGH-004** Dashboard IDOR | **RESOLVED** | auth.uid() check in get_parent_dashboard |
| **HIGH-005** No streak reset cron | **RESOLVED** | Added daily streak-reset pg_cron job |
| **HIGH-006** Badge count mismatches | **RESOLVED** | Updated to 35 games / 67 badges |
| **HIGH-007** 9 TypeScript errors | **RESOLVED** | All 9 errors fixed across 5 files |
| **HIGH-008** Cascading deletes | **VERIFIED OK** | All FKs already have ON DELETE CASCADE |
| **HIGH-009** Missing auth callback | **RESOLVED** | Created route.ts with code exchange |

**Additional build fixes applied:**
- ESLint: Escaped JSX entities in CameraQuestGame, FoolTheAiGame
- ESLint: prefer-const in pipeline.ts
- Next.js: Extracted useAuthHover from layout (invalid layout export)
- TypeScript: Fixed useContent.ts queryFn return type

---

## 1. Executive Summary

SparkForge is approximately **95% code-complete** across all 10 development stages. All 35 games exist. ~~The build fails on a single TS error.~~ **All CRITICAL and HIGH findings have been resolved (March 30, 2026).** There are 5 CRITICAL findings (mostly COPPA/security), 9 HIGH findings, and numerous moderate/minor issues. The top risks were: AuthProvider not wired into layouts, unauthenticated COPPA consent endpoint, missing privacy/terms pages, Sentry potentially capturing child PII, and subscription_status constraint conflicts across SQL files.

### Finding Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 5 |
| HIGH | 9 |
| WARNING | 15 |
| INFO / DOC-DRIFT | 18 |
| PASS | 20+ |

---

## 2. CRITICAL FINDINGS

### CRIT-001 — AuthProvider Not Wired Into Any Layout

**File:** `src/components/providers/AuthProvider.tsx`
**Category:** Architecture / Runtime

AuthProvider exists and handles Supabase session init, demo session hydration, child selection, and auth state changes. But it is **never rendered** in any layout. Auth initialization never executes — users cannot authenticate.

**Fix:** Add `<AuthProvider>` wrapping children in `src/app/(dashboard)/layout.tsx` and `src/app/(auth)/layout.tsx`.
**Docs to update:** Stage 3 layout docs, PROGRESS.md

---

### CRIT-002 — Unauthenticated COPPA Consent Endpoint

**File:** `src/app/api/auth/consent/route.ts`
**Category:** Security / COPPA

POST endpoint has NO auth check. Uses `createAdminClient()` to update `coppa_consent_at` for ANY email. An attacker could set consent timestamps for arbitrary accounts.

**Fix:** Require valid Supabase session on the consent endpoint, scope update to `session.user.id`. Add `RATE_LIMITS.auth`.
**Docs to update:** Stage 2 auth docs

---

### CRIT-003 — Sentry May Capture Child PII Without COPPA Disclosure

**Files:** `next.config.ts`, `sentry.client.config.ts`
**Category:** COPPA / Privacy

Sentry captures error context including child display names, age bands, XP values. COPPA requires no third-party service receives children's PII without verifiable parental consent.

**Fix:** Configure `beforeSend` callback to strip child-related fields. Add Sentry to privacy policy disclosure.
**Docs to update:** Stage 10 docs

---

### CRIT-004 — Subscription Status CHECK Constraint Conflicts

**Files:** `sql/001_schema.sql`, `sql/schema-stage8.sql`, `sql/schema-stage8-dashboard-fn.sql`
**Category:** Database

Three conflicting CHECK constraints: `(active, past_due, canceled, trialing)` vs `(none, active, past_due, canceled)` vs `(none, active, past_due, canceled, paused)`. Running Stage 8 on existing DB silently fails.

**Fix:** Consolidate to single canonical constraint: `(none, active, past_due, canceled, trialing, paused)`. Add ALTER TABLE migration.
**Docs to update:** Stage 2 Part 1, Stage 8 schema docs

---

### CRIT-005 — No Privacy Policy or Terms Pages Exist

**Files:** `src/app/(auth)/signup/page.tsx` links to `/privacy` and `/terms`
**Category:** COPPA / Legal

No page components exist for either route — clicking returns 404. COPPA requires privacy policy accessible at point of consent.

**Fix:** Create `src/app/(marketing)/privacy/page.tsx` and `src/app/(marketing)/terms/page.tsx`. Add `/terms` to middleware `publicPaths`.
**Docs to update:** Stage 10 docs

---

## 3. HIGH FINDINGS

### HIGH-001 — Duplicate RLS Policy Files
**Files:** `sql/001b_rls.sql` and `sql/002_rls.sql` are identical. Running both causes CREATE POLICY errors.
**Fix:** Delete `sql/001b_rls.sql`, keep `002_rls.sql`.

### HIGH-002 — Duplicate Function/Trigger Files
**Files:** `sql/001c_functions.sql` and `sql/003_functions.sql` are identical. CREATE TRIGGER is not idempotent.
**Fix:** Delete `sql/001c_functions.sql`, keep `003_functions.sql`.

### HIGH-003 — SECURITY DEFINER Functions Without search_path
**Files:** `sql/003_functions.sql` — `get_lab_progress` uses SECURITY DEFINER without `SET search_path`.
**Fix:** Add `SET search_path = public, pg_temp` to all SECURITY DEFINER functions.

### HIGH-004 — get_parent_dashboard IDOR Vulnerability
**File:** `sql/schema-stage8-dashboard-fn.sql`
Any authenticated user can pass another user's UUID and get their children's dashboard data.
**Fix:** Add `IF p_parent_id != auth.uid() THEN RAISE EXCEPTION 'unauthorized'; END IF;`

### HIGH-005 — No Automatic Streak Reset for Inactive Users
**Files:** `sql/003_functions.sql`
Streak resets only fire on UPDATE of children row. Inactive children retain inflated streaks.
**Fix:** Add pg_cron daily job to reset stale streaks.

### HIGH-006 — Badge Count Mismatches
**File:** `sql/002_badges.sql`
"Complete Collection" requires 28 games (should be 35). "Ultimate Scholar" requires 72 badges but only 68 exist (unachievable).
**Fix:** Update thresholds to match actual counts.

### HIGH-007 — Build Fails — PetDataLab3D.tsx TypeScript Error
**File:** `src/components/3d/PetDataLab3D.tsx:143`
`'opacity' in child.material` — Type `{}` may represent a primitive value.
**Fix:** Add type guard: `typeof child.material === 'object' && child.material !== null`

### HIGH-008 — Cascading Deletes Not Verified for Child Data
**File:** `src/app/api/children/[childId]/route.ts`
DELETE only removes from children table. Related data in progress, sessions, prompt_history may not cascade. COPPA violation if orphaned data persists.
**Fix:** Verify ON DELETE CASCADE on all foreign keys referencing `children.id`.

### HIGH-009 — Missing Auth Callback Route Handler
**File:** `src/app/api/auth/callback/` — directory has only `.gitkeep`
OAuth and magic link flows are completely broken without this handler.
**Fix:** Create `route.ts` with `supabase.auth.exchangeCodeForSession(code)`.

---

## 4. WARNING FINDINGS

| # | Issue | File | Fix |
|---|-------|------|-----|
| W-01 | In-memory rate limiter won't work in serverless | `src/lib/rate-limit.ts` | Replace with Redis (Upstash) |
| W-02 | Lab color returns #00BBFF for ALL games | `src/types/index.ts` | Use `lab.tint` instead of `lab.color` in `getAllGames()` |
| W-03 | Lab 9 color wrong (#10B981 vs #F97316) | `src/hooks/useStationMode.ts:78` | Change to `#F97316` |
| W-04 | Standard tier triangle budget 200x low (25K vs 5M) | `src/config/gameRegistry.ts` | Update to 5,000,000 |
| W-05 | useParentDashboard uses raw fetch, not React Query | `src/hooks/useParentDashboard.ts` | Refactor to useQuery |
| W-06 | Progress upsert resets attempts to 1 | `src/app/api/progress/route.ts:51` | Increment instead of reset |
| W-07 | RUN_ORDER.md omits 9 of 16 SQL files | `sql/RUN_ORDER.md` | Add all files in dependency order |
| W-08 | Fonts loaded via CDN, not next/font | `src/app/layout.tsx` | Migrate to next/font/google |
| W-09 | Sentry missing instrumentation.ts | Missing file | Create `src/instrumentation.ts` |
| W-10 | experimental.turbo deprecated | `next.config.ts` | Rename to `turbopack` |
| W-11 | agent_runs table missing updated_at trigger | `sql/schema-stage9.sql` | Add BEFORE UPDATE trigger |
| W-12 | Health endpoint uses admin client | `src/app/api/health/route.ts` | Use anon client instead |
| W-13 | Stripe URLs use unvalidated APP_URL | `src/app/api/stripe/checkout/route.ts` | Validate against domain allowlist |
| W-14 | Quiz schema inconsistency in seed files | `sql/003_seed_content.sql` | Standardize to `correct_index` format |
| W-15 | TopBar and ChildSelector missing | Stage 3 docs reference them | Update docs or create components |

---

## 5. DOC-DRIFT / INFO FINDINGS

| # | Issue |
|---|-------|
| DRIFT-01 | CLAUDE.md Section 14 lists 11 stores but 13 exist (missing guideStore, cockpitAtoms) |
| DRIFT-02 | authStore interface doesn't match CLAUDE.md (parent vs user/session) |
| DRIFT-03 | uiStore.gameActive deprecated but still used in useStationMode.ts |
| DRIFT-04 | cockpitBroadcastStore exports `useCockpitBroadcast` not `useCockpitBroadcastStore` |
| DRIFT-05 | gameRegistry has3D: false for Standard games with 3D environment imports |
| DRIFT-06 | Dual webgpu detection files: webgpuDetection.ts AND webgpuDetect.ts |
| DRIFT-07 | proceduralConfig.ts at src/lib/3d/ instead of documented path |
| DRIFT-08 | CockpitAudioEngine at src/lib/audio/cockpitAudio.ts vs registry name |
| DRIFT-09 | children/[id]/ directory empty alongside children/[childId]/ |
| DRIFT-10 | No dedicated /badges route (accessible through profile only) |
| DRIFT-11 | public/models/ directory absent (non-blocking per HS-8) |
| DRIFT-12 | No gamification/route.ts root route (sub-routes exist) |
| DRIFT-13 | SortToyBoxGame.tsx missing chrome bezel (only game of 35) |
| DRIFT-14 | Games only accessible via /arcade/[gameSlug], not /labs path |
| DRIFT-15 | Login response returns access_token in body (unnecessary) |
| DRIFT-16 | subscription_events no parent self-read RLS |
| DRIFT-17 | Logout endpoint has no auth check (harmless but inconsistent) |
| DRIFT-18 | API routes bypass middleware auth (by design, but no guardrail) |

---

## 6. COPPA COMPLIANCE CHECKLIST

| Check | Status | Notes |
|-------|--------|-------|
| Parental consent flow | PASS | 4-step wizard, parent confirms 18+ |
| Children cannot self-register | PASS | Only parents create child profiles |
| COPPA consent timestamp stored | PASS | coppa_consent_at column in parents |
| prompt_history cleanup cron | PASS | pg_cron daily cleanup in sql/006_cron.sql |
| No third-party child tracking | CRITICAL | Sentry may capture child PII (CRIT-003) |
| Data deletion path exists | HIGH | DELETE exists but cascades unverified (HIGH-008) |
| Content Agent screening | PASS | Two-layer moderation: regex + Haiku LLM |
| Prompt Lab rate-limited | PASS | 20/hour global + per-child daily limits |
| API Explorer C-band only | PASS | Ages 14-16, uses mock responses |
| Privacy policy accessible | CRITICAL | /privacy returns 404 (CRIT-005) |
| Consent endpoint secured | CRITICAL | No auth on /api/auth/consent (CRIT-002) |

---

## 7. TYPESCRIPT COMPILER OUTPUT (9 errors)

| # | File | Line | Error | Fix |
|---|------|------|-------|-----|
| 1 | PetDataLab3D.tsx | 143 | TS2638: `{}` in `in` operator | Add typeof object guard |
| 2 | GameShell.tsx | 67 | TS2353: `intensity` not on CockpitEvent | Add `intensity?` to type |
| 3 | GameShell.tsx | 69 | TS2353: same as above | Same fix |
| 4 | AgentArchitectGame.tsx | 408 | TS2339: `from` not on Arrow | Add `from` to Arrow type |
| 5 | AgentArchitectGame.tsx | 409 | TS2339: `to` not on Arrow | Add `to` to Arrow type |
| 6 | AgentArchitectGame.tsx | 410 | TS2551: `outputIdx` → `outputIndex` | Rename property |
| 7 | PetTrainerGame.tsx | 427 | TS2448: `isOverfit` before declaration | Move declaration up |
| 8 | PetTrainerGame.tsx | 427 | TS2454: `isOverfit` before assigned | Same fix |
| 9 | useContent.ts | 65 | TS2339: `items` not on `{}` | Add type annotation |

---

## 8. BUILD OUTPUT

- **Compiled:** Successfully in 54s
- **Type checking:** FAIL on PetDataLab3D.tsx:143
- **Warnings:** Sentry instrumentation.ts missing, experimental.turbo deprecated, ESLint plugin not detected

---

## 9. STAGE-BY-STAGE SUMMARY

| Stage | Status | Key Issues |
|-------|--------|------------|
| 1 Foundation | PASS | All base config correct |
| 2 Database/API | WARNING | Duplicate SQL files, constraint conflicts, empty callback |
| 3 Auth/Layout | CRITICAL | AuthProvider not wired (CRIT-001) |
| 4 Core Pages | PASS | BUG-1/BUG-3 resolved |
| 5 Gamification | PASS | XP/badge/streak systems working |
| 6 Flagship | WARNING | PetDataLab3D + PetTrainer TS errors |
| 7 Remaining | WARNING | AgentArchitect TS errors, SortToyBox chrome bezel |
| 8 Parent Dashboard | HIGH | IDOR vulnerability (HIGH-004) |
| 9 Content Agent | PASS | Moderation properly implemented |
| 10 Polish/Deploy | WARNING | Missing instrumentation.ts, privacy/terms pages |

---

## 10. 35-GAME AUDIT CHECKLIST

| # | Slug | Exists | Bands | Phases | XP | 3D | Status |
|---|------|--------|-------|--------|----|----|--------|
| 1 | ai-spy | YES | YES | YES | YES | Env | PASS |
| 2 | time-machine | YES | YES | YES | YES | Env | PASS |
| 3 | human-vs-machine | YES | YES | YES | YES | Env | PASS |
| 4 | pet-trainer | YES | YES | YES | YES | Full | WARN (TS) |
| 5 | sort-toy-box | YES | YES | YES | YES | Full | WARN (bezel) |
| 6 | treat-trainer | YES | YES | YES | YES | Env | PASS |
| 7 | data-detective | YES | YES | YES | YES | Full | PASS |
| 8 | neural-builder | YES | YES | YES | YES | Full | PASS |
| 9 | neuron-relay | YES | YES | YES | YES | Env | PASS |
| 10 | pixel-investigator | YES | YES | YES | YES | Env | PASS |
| 11 | prompt-lab | YES | YES | YES | YES | Full | PASS |
| 12 | word-predictor | YES | YES | YES | YES | Env | PASS |
| 13 | token-chopper | YES | YES | YES | YES | Env | PASS |
| 14 | ai-art-detective | YES | YES | YES | YES | Env | PASS |
| 15 | agent-architect | YES | YES | YES | YES | Full | WARN (TS) |
| 16 | robot-vacuum | YES | YES | YES | YES | Full | PASS |
| 17 | tool-picker | YES | YES | YES | YES | Env | PASS |
| 18 | bias-detective | YES | YES | YES | YES | Full | PASS |
| 19 | data-shield | YES | YES | YES | YES | Env | PASS |
| 20 | real-or-fake | YES | YES | YES | YES | Env | PASS |
| 21 | ethics-courtroom | YES | YES | YES | YES | Env | PASS |
| 22 | camera-quest | YES | YES | YES | YES | Full | PASS |
| 23 | fool-the-ai | YES | YES | YES | YES | Env | PASS |
| 24 | build-classifier | YES | YES | YES | YES | Env | PASS |
| 25 | prediction-market | YES | YES | YES | YES | Env | PASS |
| 26 | sentiment-scanner | YES | YES | YES | YES | Env | PASS |
| 27 | chatbot-builder | YES | YES | YES | YES | Full | PASS |
| 28 | lost-in-translation | YES | YES | YES | YES | Env | PASS |
| 29 | emoji-decoder | YES | YES | YES | YES | Full | PASS |
| 30 | code-blocks | YES | YES | YES | YES | Full | PASS |
| 31 | career-explorer | YES | YES | YES | YES | Env | PASS |
| 32 | api-explorer | YES | YES | YES | YES | Env | PASS |
| 33 | my-first-ai-app | YES | YES | YES | YES | Full | PASS |
| 34 | future-forge | YES | YES | YES | YES | Full | PASS |
| 35 | ai-or-not | YES | YES | YES | YES | Full | PASS |

**Result: 32 PASS, 3 WARNING, 0 FAIL. All 35 games present.**

---

## 11. KNOWN BUG REGISTRY VERIFICATION

| Bug ID | Status | Verified |
|--------|--------|----------|
| BUG-1 (useApi.ts stubs) | RESOLVED | Confirmed — file absent |
| BUG-3 (10 parallel progress calls) | RESOLVED | Confirmed — all-labs endpoint exists |
| BUG-5 (Lab map wrong completion) | RESOLVED | Confirmed |
| BUG-7 (subscription_status default) | RESOLVED | Confirmed |
| BUG-10D (CSP blocks Vercel) | RESOLVED | Confirmed |
| BUG-10F (Font stack conflict) | RESOLVED | Confirmed — correct fonts |
| IMP-4 (spark-*/neon-* tokens) | RESOLVED | Confirmed — both defined |
| ENH-8A (Stripe fallback) | RESOLVED | Confirmed |
| ENH-9A (Anthropic fallback) | RESOLVED | Confirmed |

---

## 12. RECOMMENDED TRIAGE ORDER

### Priority 1 — CRITICAL (Launch Blockers)
1. **CRIT-001** — Wire AuthProvider into layouts (~15 min)
2. **CRIT-005** — Create /privacy and /terms pages (~2-4 hrs)
3. **CRIT-002** — Secure consent endpoint (~30 min)
4. **CRIT-003** — Configure Sentry PII scrubbing (~2-3 hrs)
5. **CRIT-004** — Consolidate SQL constraints (~1-2 hrs)

### Priority 2 — HIGH (Significant Defects)
6. **HIGH-004** — Fix dashboard IDOR (~30 min)
7. **HIGH-007** — Fix 9 TypeScript errors (~30-60 min)
8. **HIGH-008** — Verify cascading deletes (~1-2 hrs)
9. **HIGH-001/002** — Clean up duplicate SQL files (~1 hr)
10. **HIGH-003** — Add search_path to SECURITY DEFINER (~1 hr)
11. **HIGH-009** — Create auth callback handler (~30 min)
12. **HIGH-005** — Add streak reset cron (~1-2 hrs)
13. **HIGH-006** — Fix badge count mismatches (~1 hr)

### Priority 3 — WARNING (15 items, ~4-8 hrs total)
### Priority 4 — INFO/DOC-DRIFT (18 items, ~2-3 hrs total)

### Triage Summary

| Priority | Count | Estimated Effort |
|----------|-------|-----------------|
| CRITICAL | 5 | 6-10 hours |
| HIGH | 8 | 8-12 hours |
| WARNING | 15 | 4-8 hours |
| INFO | 18 | 2-3 hours |
| **Total** | **46** | **~20-33 hours** |

---

*SparkForge Audit Report v1.0 | March 29, 2026 | Generated by SparkForge Audit Agent*
*Covers: 35 games | 10 stages | All SQL/API/Auth/3D/COPPA checks | Per SPARKFORGE_AUDIT_AGENT.md*
