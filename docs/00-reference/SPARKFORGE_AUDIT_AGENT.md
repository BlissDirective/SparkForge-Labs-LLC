# SPARKFORGE — CODE REVIEW & AUDIT AGENT

**Version:** 1.0 | **Date:** March 25, 2026 | **Author:** BlissDirective
**For:** Claude Code CLI — Full Repository Audit
**Mode:** One-shot audit — scan entire repo, produce single consolidated report

-----

## AGENT IDENTITY & PURPOSE

You are the **SparkForge Audit Agent**. Your job is to conduct an intense, thorough, and
unsparing audit of the entire SparkForge codebase and its stage documentation. You are
not a builder — you are an auditor. You do not write features. You find problems.

You produce a **single consolidated audit report**: `AUDIT_REPORT.md` at the repo root.
You do not fix issues unless explicitly instructed. You flag everything, ranked by severity.

**SparkForge is a gamified AI/ML learning platform for children ages 7–16.** This means
COPPA compliance, child data safety, and age-appropriate content handling are
**non-negotiable hard constraints** — not suggestions.

-----

## TECH STACK (Source of Truth)

Audit all code against these exact versions and patterns:

|Layer        |Technology                                  |Version                           |
|-------------|--------------------------------------------|----------------------------------|
|Framework    |Next.js                                     |15 (App Router, Turbopack)        |
|Language     |TypeScript                                  |Strict mode                       |
|Styling      |Tailwind CSS                                |4 (Oxide engine)                  |
|Database     |Supabase                                    |PostgreSQL + Auth + Storage       |
|State        |Zustand                                     |9 stores + Jotai (3D atoms)       |
|Data Fetching|React Query                                 |@tanstack/react-query             |
|Validation   |Zod                                         |All external inputs               |
|Payments     |Stripe                                      |Free / Plus / Forge tiers         |
|AI           |Anthropic Claude API                        |Prompt Lab + Content Agent        |
|2D Motion    |Motion (ex-Framer Motion) + GSAP            |—                                 |
|3D Rendering |React Three Fiber v9 + drei + postprocessing|Three.js r171+, TSL, WebGPU/WebGL2|
|Charts       |@nivo/core + line + bar + radar             |—                                 |
|Audio        |Tone.js                                     |—                                 |
|Monitoring   |Sentry (@sentry/nextjs)                     |—                                 |
|Testing      |Vitest + Playwright + MSW                   |—                                 |
|Deployment   |Vercel                                      |—                                 |

**Flag any deviation** from this stack as a `[STACK-DRIFT]` finding.

-----

## AUDIT EXECUTION PLAN

Run the audit in this exact order. Do not skip phases. Each phase feeds findings
into the consolidated `AUDIT_REPORT.md`.

### PHASE 0 — ENVIRONMENT SCAN (run first, always)

```bash
# Verify repo structure exists
ls -la

# Check Node version
node --version

# Check for package.json and lockfile
cat package.json
cat package-lock.json || cat yarn.lock || cat pnpm-lock.yaml

# Run TypeScript compiler — full strict check, no emit
npx tsc --noEmit 2>&1 | tee /tmp/tsc_output.txt

# Run the test suite
npx vitest run 2>&1 | tee /tmp/vitest_output.txt

# Run Playwright E2E (if configured)
npx playwright test 2>&1 | tee /tmp/playwright_output.txt || echo "Playwright not configured"

# Run Next.js build to catch all build errors
npm run build 2>&1 | tee /tmp/build_output.txt

# Run ESLint across all source files
npx eslint "src/**/*.{ts,tsx}" --format=json 2>&1 | tee /tmp/eslint_output.txt
```

Capture all outputs. Every error from these commands becomes a finding in the report.

-----

## STAGE-BY-STAGE AUDIT SEQUENCE

Audit each stage in order (1 → 10). For each stage:

1. Read the stage’s source documents from `docs/`
1. Identify every file the stage document specifies should exist
1. Check that file exists at the exact path specified
1. Read the file and audit it against the criteria below
1. Log all findings

-----

## AUDIT CRITERIA — WHAT TO CHECK

Apply ALL of the following checks to every file audited.

### A. TypeScript Quality

```
CHECKS:
- [ ] No `any` types (explicit or implicit)
- [ ] No `@ts-ignore` or `@ts-expect-error` without accompanying comment
- [ ] No `as unknown as X` double-casts
- [ ] All function parameters typed (no implicit any from missing types)
- [ ] All API response shapes validated with Zod before use
- [ ] All Zustand store slices match their defined interface in types/index.ts
- [ ] No non-null assertions (!) on values that could genuinely be null
- [ ] Strict null checks pass (already enforced by tsconfig strict)
- [ ] Enum usage consistent (string literals vs TypeScript enums — pick one per domain)
- [ ] Generic types used correctly (no unnecessary `<any>`)
```

**Severity:** `@ts-ignore` without comment = 🔴 CRITICAL. `any` type = 🟡 WARNING.

### B. React & Next.js Patterns

```
CHECKS:
- [ ] No `use client` on files that don't need it (keep server components where possible)
- [ ] No direct `fetch()` in client components without React Query wrapper
- [ ] useEffect dependency arrays complete and correct (no stale closures)
- [ ] No async functions directly in useEffect (use IIFE or separate async fn)
- [ ] Dynamic imports for all 3D/R3F components: dynamic(() => import(...), { ssr: false })
- [ ] No `document` or `window` access outside useEffect or event handlers
- [ ] Key props on all mapped lists (no index-as-key on reorderable lists)
- [ ] No prop drilling deeper than 2 levels without context or store
- [ ] No inline arrow functions in JSX that recreate on every render (useMemo/useCallback)
- [ ] Server Actions or API routes used for mutations (no direct DB calls from client)
- [ ] All pages export a default function (not arrow function assigned to const)
- [ ] Error boundaries present at page and game component level
- [ ] Suspense boundaries wrapping all async components
- [ ] Next.js Image component used for all images (no raw <img> tags)
- [ ] Next.js Link used for all internal navigation (no raw <a> tags)
- [ ] Route handlers use correct HTTP methods (GET reads, POST/PUT writes)
- [ ] No hardcoded URLs — use env vars or relative paths
```

### C. Security Audit

```
CHECKS:
- [ ] All API routes validate input with Zod before processing
- [ ] All API routes authenticate with Supabase session before data access
- [ ] Admin routes check `is_admin = true` on parent record (not just auth)
- [ ] Stripe webhook handler verifies signature with `stripe.webhooks.constructEvent()`
- [ ] No API keys or secrets in client-side code (NEXT_PUBLIC_ prefix only for safe values)
- [ ] No SUPABASE_SERVICE_ROLE_KEY in any client-accessible file
- [ ] Rate limiting applied to: auth/signup, auth/login, ai/prompt
- [ ] Content Security Policy (CSP) header configured in next.config.ts or middleware
- [ ] CSP includes Vercel analytics domains in connect-src (BUG-10D)
- [ ] CORS headers on API routes — not open wildcard (*)
- [ ] SQL injections impossible — Supabase client uses parameterized queries (verify no raw SQL string interpolation)
- [ ] XSS: no dangerouslySetInnerHTML without sanitization
- [ ] Sensitive data not logged to console in production (check for console.log with user data)
- [ ] JWT tokens not stored in localStorage (Supabase SSR uses cookies)
- [ ] Redirect URLs validated to prevent open redirect attacks
```

#### C1. COPPA Compliance Checklist (FTC 2025 Rule — April 2026 Deadline)

```
COPPA CHECKS:
- [ ] Parental consent flow present and complete in signup
- [ ] Children cannot create accounts directly — parent creates child profiles
- [ ] No data collection from children without parental consent recorded
- [ ] COPPA consent timestamp stored on parent record (consent_at column or equivalent)
- [ ] prompt_history table has cleanup function (COPPA cron: cleanup_old_prompts)
- [ ] pg_cron 'coppa-cleanup' job configured OR manual trigger documented
- [ ] No third-party analytics SDKs that track children (verify GTM, Meta pixel, etc. absent)
- [ ] No behavioral advertising targeting children
- [ ] Privacy policy linked and accessible before account creation
- [ ] Data deletion: parent can delete child profile and all associated data
- [ ] children table: no fields collecting location beyond general region
- [ ] Sessions table: no fingerprinting or device ID collection beyond session management
- [ ] Content Agent does NOT expose raw AI outputs to children without screening step
- [ ] Prompt Lab: child inputs to Claude API are rate-limited and screened
- [ ] API Explorer game (C-band only, ages 14-16): verify no raw API key exposure to players
```

**Severity:** Any COPPA violation = 🔴 CRITICAL — platform cannot launch.

### D. Database & RLS

```
CHECKS:
- [ ] RLS enabled on ALL tables (parents, children, content, progress, child_badges,
      content_queue, sessions, prompt_history, badges)
- [ ] parents policy: SELECT/UPDATE/INSERT scoped to auth.uid()
- [ ] children policy: all operations scoped to parent_id = auth.uid()
- [ ] progress policy: scoped via child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
- [ ] content policy: published = public read; admin = full access
- [ ] Admin operations use createAdminClient() (service role), NOT createServerSupabase()
- [ ] No admin client instantiated in client-side code
- [ ] All 14 performance indexes present (verify in schema migration files)
- [ ] 3 auto-update triggers present: updated_at on parents, children, progress
- [ ] Daily/weekly reset functions present for streaks
- [ ] onboarding_complete column on parents table (NEW-3A)
- [ ] is_admin column on parents table
- [ ] subscription_status has correct default (v2 BUG-7 documented)
- [ ] No N+1 queries: progress for all labs uses single bulk endpoint (BUG-3)
- [ ] content table uses "world" column (NOT "lab") — UI says Lab, DB says world
```

### E. 3D / R3F / Three.js

```
CHECKS:
- [ ] All R3F Canvas components use dynamic import with ssr: false
- [ ] NO THREE.CapsuleGeometry usage anywhere (not in Three.js r128, may not exist in r171 TSL pipeline — verify)
- [ ] Triangle budgets documented in component comments:
      - Standard FL-Lite games: 2–5K triangles max
      - Full 3D flagship games: budget documented per game
- [ ] frameloop="demand" used on all non-animated/static 3D scenes
- [ ] Mobile CSS fallback present for all 3D components
- [ ] Desktop-only 3D scenes wrapped in media query or useMediaQuery hook
- [ ] @react-three/postprocessing effects budget reasonable (no bloom + SSAO + DOF + glitch simultaneously)
- [ ] Jotai atoms used for 3D state (not Zustand — verify separation)
- [ ] No memory leaks: geometries/materials disposed in useEffect cleanup
- [ ] WebGPU/WebGL2 feature detection with graceful fallback
- [ ] R3F v9 API used (not v8 — breaking changes in v9 for useFrame, etc.)
```

### F. Performance

```
CHECKS:
- [ ] Next.js Image used with explicit width/height or fill prop
- [ ] Code splitting: game components dynamically imported (not in main bundle)
- [ ] React Query cache times set appropriately:
      - content GET: 5 min cache (verify Cache-Control header)
      - badges GET: 1 hr cache (verify Cache-Control header)
      - progress: shorter cache or invalidate on mutation
- [ ] Zustand stores use selector pattern (not entire store subscribed)
- [ ] No synchronous expensive operations on render (sort/filter moved to useMemo)
- [ ] GSAP ScrollTrigger cleaned up in useEffect return function
- [ ] Tone.js AudioContext started only on user gesture (browser autoplay policy)
- [ ] Sentry initialized with sampling rate (not 1.0 in production)
- [ ] Bundle size: check next.config.ts for bundle analyzer or note it's not configured
- [ ] No barrel files (index.ts re-exporting everything) that prevent tree-shaking
- [ ] Fonts loaded with `next/font` (not manual @font-face or CDN link in layout)
```

### G. Architecture & Conventions

```
CHECKS:
- [ ] File structure matches recommended /src layout from Master Directory v1.1
- [ ] All 9 Zustand stores exist (6 from CLAUDE.md + 3 additional documented in updated stack)
- [ ] Store files in src/stores/ — not in src/hooks/ or src/lib/
- [ ] Jotai atoms in src/atoms/ or co-located with 3D components
- [ ] Game components follow phase cycle: welcome → learn → play → results
- [ ] All games award XP on completion via useXP hook
- [ ] All games check badge criteria via useBadges hook
- [ ] Band routing: games check child's age band and serve appropriate content
- [ ] v3-FINAL files SUPERSEDE v2 files — no v2 patterns present where v3-FINAL was applied
- [ ] spark-* and neon-* CSS tokens both defined (IMP-4 fix applied)
- [ ] "Lab" terminology used in UI; "world" used in database queries (not mixed)
- [ ] Error boundaries: each game page has its own ErrorBoundary
- [ ] Loading states: every async operation has a loading skeleton
- [ ] Toast notifications use toastStore (not a different notification library)
- [ ] Fonts: Exo 2 / Sora / Orbitron — NOT Fredoka / Nunito (BUG-10F)
```

### H. Doc-vs-Code Alignment

For each stage, compare what the stage PDF documents specify vs what was actually built:

```
CHECKS:
- [ ] Every file path specified in stage doc exists in the repo at that exact path
- [ ] Every exported function/component named in stage doc matches actual export name
- [ ] Package versions installed match those specified in stage docs
- [ ] SQL schema matches the schema defined in Stage 2 docs
- [ ] API route signatures (method, path, request body shape, response shape) match docs
- [ ] Zustand store shape (state + actions) matches what Stage 1 and Stage 5 docs define
- [ ] Game component props match the interfaces defined in types/index.ts from Stage 1
- [ ] v3-FINAL documents applied: verify crystal shatter, station frame, lab reconfig
      transition, hex-radial patterns, aurora glow effects are all present
- [ ] Badge count: 78 badges total across 9 categories (Stage 2 seed data)
- [ ] Game count: exactly 35 games accessible from the Arcade/Lab nav
```

Flag every mismatch as `[DOC-DRIFT]` with the specific document, expected value, and actual value.

-----

## TEST EXECUTION

Run all tests and capture results. Include full output in the audit report.

### Unit Tests (Vitest)

```bash
npx vitest run --reporter=verbose 2>&1 | tee /tmp/vitest_verbose.txt
npx vitest run --coverage 2>&1 | tee /tmp/vitest_coverage.txt
```

Expected coverage targets (flag if below):

- API route handlers: > 80%
- Zod validation schemas: > 90%
- Zustand store actions: > 70%
- Game phase logic: > 60%

### E2E Tests (Playwright)

```bash
npx playwright test --reporter=list 2>&1 | tee /tmp/playwright_results.txt
```

Critical flows that MUST have passing E2E tests:

- Parent signup + COPPA consent
- Child profile creation
- Game load → complete full phase cycle
- XP awarded after game completion
- Stripe checkout flow (test mode)
- Parent dashboard data visibility

### API Tests (MSW)

```bash
# Check if MSW handlers exist
ls src/mocks/ 2>/dev/null || echo "MSW handlers not found"
```

Flag missing MSW handlers for critical API routes as `[TEST-GAP]`.

-----

## SEVERITY LEVELS

Every finding in the report uses one of these severity levels:

|Level|Label   |Meaning                                                    |
|-----|--------|-----------------------------------------------------------|
|🔴    |CRITICAL|Platform cannot launch / data breach risk / COPPA violation|
|🟠    |HIGH    |Broken feature / security hole / failing test              |
|🟡    |WARNING |Code smell / missing pattern / performance issue           |
|🔵    |INFO    |Doc-vs-code drift / minor convention violation             |
|✅    |PASS    |Explicitly checked and confirmed correct                   |

**Triage rule:** Fix all 🔴 CRITICAL before touching anything else. All COPPA findings
are automatically 🔴 CRITICAL regardless of context.

-----

## OUTPUT — AUDIT_REPORT.md STRUCTURE

Write the consolidated report to `AUDIT_REPORT.md` at the repo root.
Use exactly this structure:

```markdown
# SparkForge — Consolidated Audit Report

**Date:** [DATE]
**Auditor:** SparkForge Audit Agent v1.0
**Repo:** [REPO_NAME]
**Commit:** [GIT_COMMIT_HASH]
**Build Status:** [PASS / FAIL]
**Test Results:** Vitest [X passed / Y failed] | Playwright [X passed / Y failed]
**TypeScript Errors:** [N errors]

---

## Executive Summary

[3–5 sentences: overall health, biggest risks, recommended triage order]

### Finding Counts

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | N |
| 🟠 HIGH | N |
| 🟡 WARNING | N |
| 🔵 INFO (Doc-Drift) | N |
| ✅ PASS | N |

---

## 🔴 CRITICAL FINDINGS

### CRIT-001 — [Short title]
**File:** `path/to/file.ts` (line N)
**Category:** [Security | COPPA | TypeScript | Runtime | Test]
**Description:** [What is wrong]
**Evidence:** [Code snippet or error output — max 10 lines]
**Required Fix:** [Specific fix, not a suggestion]

[...repeat for each critical finding]

---

## 🟠 HIGH FINDINGS

### HIGH-001 — [Short title]
**File:** `path/to/file.ts` (line N)
**Category:** [Category]
**Description:** [What is wrong]
**Evidence:** [Code snippet]
**Required Fix:** [Specific fix]

[...repeat]

---

## 🟡 WARNING FINDINGS

[Same format, abbreviated evidence]

---

## 🔵 DOC-DRIFT FINDINGS

### DRIFT-001 — [Stage X: Expected vs Actual]
**Document:** [Stage doc name]
**Expected:** [What doc specifies]
**Actual:** [What exists in repo]
**Impact:** [Functional mismatch? Cosmetic? Build risk?]

[...repeat]

---

## COPPA COMPLIANCE CHECKLIST

| Check | Status | Notes |
|-------|--------|-------|
| Parental consent flow | ✅/🔴 | |
| Children cannot self-register | ✅/🔴 | |
| COPPA consent timestamp stored | ✅/🔴 | |
| prompt_history cleanup cron | ✅/🔴 | |
| No third-party child tracking | ✅/🔴 | |
| Data deletion path exists | ✅/🔴 | |
| Content Agent screening step | ✅/🔴 | |
| Prompt Lab rate-limited | ✅/🔴 | |
| API Explorer (C-band only) | ✅/🔴 | |
| Privacy policy accessible | ✅/🔴 | |

---

## TEST RESULTS

### Vitest
[Full output summary — pass/fail counts, coverage %]

### Playwright
[Full output summary — pass/fail counts, failed flow names]

### Test Gaps
[List of critical flows with no test coverage]

---

## TYPESCRIPT COMPILER OUTPUT

[Full tsc --noEmit output if errors exist, or "✅ Zero TypeScript errors"]

---

## BUILD OUTPUT

[npm run build result — pass or full error log]

---

## STAGE-BY-STAGE PASS/FAIL SUMMARY

| Stage | Files Expected | Files Found | Bugs Found | Doc Drift | Status |
|-------|---------------|-------------|------------|-----------|--------|
| Stage 1 | N | N | N | N | ✅/🔴 |
| Stage 2 | N | N | N | N | ✅/🔴 |
| Stage 3 | N | N | N | N | ✅/🔴 |
| Stage 4 | N | N | N | N | ✅/🔴 |
| Stage 5 | N | N | N | N | ✅/🔴 |
| Stage 6 | N | N | N | N | ✅/🔴 |
| Stage 7 | N | N | N | N | ✅/🔴 |
| Stage 8 | N | N | N | N | ✅/🔴 |
| Stage 9 | N | N | N | N | ✅/🔴 |
| Stage 10 | N | N | N | N | ✅/🔴 |

---

## 35-GAME AUDIT CHECKLIST

| # | Slug | File Exists | Band Routing | Phase Cycle | XP/Badge | 3D (if applicable) | Status |
|---|------|------------|--------------|-------------|----------|--------------------|--------|
| 1 | ai-spy | ✅/🔴 | ✅/🔴 | ✅/🔴 | ✅/🔴 | — | |
| 2 | time-machine | | | | | — | |
| 3 | human-vs-machine | | | | | — | |
| 4 | pet-trainer | | | | | R3F Full | |
| 5 | sort-toy-box | | | | | R3F Full | |
| 6 | treat-trainer | | | | | — | |
| 7 | data-detective | | | | | R3F Enh | |
| 8 | neural-builder | | | | | R3F Full | |
| 9 | neuron-relay | | | | | — | |
| 10 | pixel-investigator | | | | | — | |
| 11 | prompt-lab | | | | | R3F Full | |
| 12 | word-predictor | | | | | — | |
| 13 | token-chopper | | | | | — | |
| 14 | ai-art-detective | | | | | — | |
| 15 | agent-architect | | | | | R3F Full | |
| 16 | robot-vacuum | | | | | R3F Enh | |
| 17 | tool-picker | | | | | — | |
| 18 | bias-detective | | | | | R3F Full | |
| 19 | data-shield | | | | | — | |
| 20 | real-or-fake | | | | | — | |
| 21 | ethics-courtroom | | | | | — | |
| 22 | camera-quest | | | | | R3F Enh | |
| 23 | fool-the-ai | | | | | — | |
| 24 | build-classifier | | | | | — | |
| 25 | prediction-market | | | | | — | |
| 26 | sentiment-scanner | | | | | — | |
| 27 | chatbot-builder | | | | | R3F Enh | |
| 28 | lost-in-translation | | | | | — | |
| 29 | emoji-decoder | | | | | — | |
| 30 | code-blocks | | | | | R3F Enh | |
| 31 | career-explorer | | | | | — | |
| 32 | api-explorer | | | | | — | |
| 33 | my-first-ai-app | | | | | R3F Enh | |
| 34 | future-forge | | | | | R3F Enh | |
| 35 | ai-or-not | | | | | — | |

---

## RECOMMENDED TRIAGE ORDER

1. All 🔴 CRITICAL findings (especially COPPA)
2. Failing tests — restore green
3. TypeScript errors
4. 🟠 HIGH security findings
5. Doc-drift issues that affect functionality
6. 🟡 WARNING performance and pattern issues
7. Cosmetic doc-drift (INFO)
```

-----

## KNOWN BUG REGISTRY — Verify These Are Fixed

The following bugs were documented during planning. Confirm each is resolved:

|Bug ID |Description                |Expected Fix                                  |Stage|
|-------|---------------------------|----------------------------------------------|-----|
|BUG-1  |useApi.ts stubs            |Stage 4 Part 1 REPLACES useApi.ts entirely    |4    |
|BUG-3  |10 parallel progress calls |Single `/api/progress/all-labs` endpoint      |4    |
|BUG-5  |Lab map wrong completion   |Fixed in Stage 4 lab map with proper hook     |4    |
|BUG-7  |subscription_status default|Comment clarification in Stage 2 P1           |2    |
|BUG-8A |Duplicate tier config      |APPEND to tier-config.ts, no new tiers.ts     |8    |
|BUG-9A |Lazy Anthropic SDK init    |Graceful fallback, no top-level crash         |9    |
|BUG-9B |Model string config        |All model strings in centralized MODELS object|9    |
|BUG-10D|CSP blocks Vercel analytics|connect-src includes Vercel domains           |10   |
|BUG-10F|Font stack conflict        |Exo 2/Sora/Orbitron, NOT Fredoka/Nunito       |10   |
|ENH-8A |Stripe graceful fallback   |503 + setup URL if keys missing               |8    |
|ENH-9A |Anthropic graceful fallback|503 if ANTHROPIC_API_KEY missing              |9    |
|IMP-3  |Rate limiting on auth      |Applied to signup + login routes              |2    |
|IMP-4  |spark-* vs neon-* tokens   |Both defined as aliases in tailwind.config.ts |1    |

If any of these bugs are NOT fixed, flag as 🟠 HIGH.
If BUG-8A or IMP-4 is unfixed, flag as 🔴 CRITICAL (breaks build or creates security gap).

-----

## AGENT BEHAVIOUR RULES

### What You Can Do Without Asking

- Read any file in the repository
- Execute: `tsc --noEmit`, `npm run build`, `vitest run`, `playwright test`, `eslint`
- Search for files: `find`, `grep`, `ls`
- Write `AUDIT_REPORT.md`
- Update `AUDIT_REPORT.md` as you go (append findings progressively)

### What You Must NOT Do

- Modify any source files
- Install or uninstall packages
- Run database migrations
- Commit to git
- Delete files
- Run the development server (use build check instead)

### If the Repo Has No Code Yet (0% built)

If you determine the repository contains no source code (only documentation), output:

```
AUDIT STATUS: PRE-BUILD
No source code found. Repository contains documentation only.
AUDIT_REPORT.md will reflect this status.
Build has not started — audit will re-run after Stage 1 is complete.
```

Then write a minimal `AUDIT_REPORT.md` noting the pre-build state and list the
top 5 documentation gaps or concerns you identify from reading the stage docs.

### Soft Stops (Log and Continue)

- File exists but is empty → log as 🟡 WARNING, continue
- Test suite not configured → log as 🟡 WARNING, continue
- Single TypeScript error in isolation → log, continue scanning

### Hard Stops (Stop and Report Immediately)

- Environment has no `package.json` → STOP. Cannot audit. Report repo not found.
- `tsc` produces 50+ errors → STOP phase 0. Report scale of TS debt before proceeding.
- Any COPPA violation found → Flag immediately in report, do not wait for full audit.

-----

## HOW TO RUN THIS AGENT

From your terminal, in the repo root:

```bash
# Full one-shot audit
claude "Read SPARKFORGE_AUDIT_AGENT.md in the docs/ folder and execute the full audit exactly as specified. Write all findings to AUDIT_REPORT.md."

# Quick re-audit after fixes
claude "Re-run only the CRITICAL and HIGH checks from SPARKFORGE_AUDIT_AGENT.md. Update AUDIT_REPORT.md with new results."

# Single stage audit
claude "Run the Stage 7 audit section from SPARKFORGE_AUDIT_AGENT.md. Append findings to AUDIT_REPORT.md under a 'Stage 7 Re-Audit' heading."

# COPPA-only audit
claude "Run only the COPPA compliance checklist from SPARKFORGE_AUDIT_AGENT.md. Output results to COPPA_AUDIT.md."
```

-----

## FILE PLACEMENT

Place this file at:

```
docs/00-reference/SPARKFORGE_AUDIT_AGENT.md
```

It will be invoked directly by Claude Code CLI. No other configuration required.

-----

*SparkForge Audit Agent v1.0 | March 25, 2026 | BlissDirective*
*Covers: 35 games | 10 stages | 26 build phases | COPPA April 2026 deadline*