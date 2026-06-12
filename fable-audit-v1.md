# Fable Audit v1 — SparkForge Labs

> **Date:** 2026-06-12
> **Branch:** `setup-sparkforge-dev` @ `9e5d1e4`
> **Scope:** General code review, frontend audit, backend audit
> **Method:** Full baseline validation (typecheck / lint / unit tests / production build) + three parallel deep audits (backend & security, frontend & games, architecture & repo health), with the highest-severity findings manually verified against source before publishing.

---

## 0. Baseline Validation Results

All four gates pass on a fresh clone of this branch:

| Check | Result |
|---|---|
| `tsc --noEmit` (strict mode) | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors, 14 warnings (all unused-var/unused-disable) |
| `npm run test` (Vitest) | ✅ 75 files, **814/814 tests pass** (23.6s) |
| `npm run build` (production) | ✅ Clean. Shared first-load JS **230 kB**; heaviest route `/dev/hero-v3` at 709 kB (dev-only) |

This is a genuinely healthy baseline — most projects this size don't have it. The findings below are about what the green checks *don't* catch.

---

## 1. Executive Summary

**Overall: a professionally architected codebase with a strong security spine, held back by a handful of concrete backend gaps and a bimodal game-quality problem.**

The honest version:

- **What's genuinely good:** strict TypeScript with almost no escape hatches (29 `any`, 1 justified `@ts-expect-error`, 0 `@ts-ignore`), server-authoritative XP/currency, RLS-first database design, a mature CI pipeline (gitleaks with SparkForge-specific rules, RLS verification against fresh Postgres, an API-auth audit script), COPPA-aware Sentry PII scrubbing, and a clean pure-function Engine pattern with no client/server logic duplication.
- **What needs fixing before launch:** a verified PostgREST filter-injection vector in the safe-messages route, idempotency applied to exactly **one** of ~50 mutating endpoints, race conditions in invite-code redemption and friend limits, and missing rate limits on the new social/UGC surface — the highest-risk surface on a kids' platform.
- **The product problem:** ~28 of the 42 games are quiz templates with one feedback toast. The retention infrastructure (juice, combos, mechanics kit) was built in Phases 5–6 but **the games don't use it**. This is the single biggest gap between effort invested and player-perceived value. (Addressed in depth in `Fable-Frontend-Enhancement.md`.)

---

## 2. Backend Findings

### 2.1 — PostgREST filter injection in safe-messages GET — **HIGH** ⚠ *verified*

`src/app/api/messages/route.ts:43`

```ts
.or(`and(from_child_id.eq.${childId},to_child_id.eq.${buddyId}),and(from_child_id.eq.${buddyId},to_child_id.eq.${childId})`)
```

- `childId` is protected by `verifyChildOwnership()` (line 24) — fine.
- `buddyId` comes straight from `url.searchParams.get('buddyId')` (line 22) with **no UUID validation** and is interpolated into a PostgREST filter string executed via `createAdminClient()` — i.e., **with RLS bypassed**. The POST handler validates `buddyId` with `z.string().uuid()` (line 73); the GET handler does not.
- A crafted `buddyId` containing filter syntax (`,or(...)`, `)` etc.) can alter the query and potentially read other children's message history.

**Fix (15 minutes):** validate `buddyId` with `z.string().uuid()` in GET before use, and prefer chained `.eq()`/`.in()` builders over interpolated `.or()` strings everywhere an admin client is used. Audit the codebase for the same pattern: `grep -rn '\.or(\`' src/app/api`.

### 2.2 — Idempotency exists on exactly one endpoint — **HIGH** ⚠ *verified*

`checkDuplicate()` (SHA-256 body-hash dedup) is implemented and used in `src/app/api/gamification/xp/route.ts` — and **nowhere else**. Friends, messages, buddy quests, UGC create/rate/moderate, season claims, mastery certificates: all are double-submit vulnerable. A kid double-tapping "claim" on a season reward is the realistic exploit, not an attacker.

**Fix:** apply `checkDuplicate()` to every state-mutating POST, starting with `/api/seasons/claim`, `/api/seasons/purchase`, `/api/mastery/claim`, `/api/friends` (redeem), `/api/messages`.

### 2.3 — Invite-code redemption race — **MEDIUM**

`src/app/api/friends/route.ts:137–209`: check `invite.redeemed` → … → set `redeemed = true` is a classic TOCTOU window. Two concurrent redemptions of the same code can both pass the check. Similarly, the friend-limit count check (lines 153–165) has no DB-level backstop, so concurrent redemptions can exceed the limit.

**Fix:** make redemption atomic — `UPDATE friend_invites SET redeemed = true, redeemed_by = $1 WHERE code = $2 AND redeemed = false RETURNING *` (or a Postgres function), and enforce the friend cap in a trigger or unique-constraint design rather than an application-side count.

### 2.4 — No rate limiting on social/UGC routes — **MEDIUM**

The platform has a working Upstash-based `applyRateLimit()` helper with a central `RATE_LIMITS` config — but `/api/messages`, `/api/friends`, `/api/buddy-quests`, `/api/ugc`, `/api/ugc/rate` don't call it. On a kids' platform, message/rating spam is a safety issue, not just a cost issue.

**Fix:** add limits (e.g., 10 messages/min, 5 UGC submissions/hour, 1 rating per content per child) — the infrastructure already exists, this is wiring.

### 2.5 — Buddy-quest progress not clamped — **MEDIUM**

`supabase/migrations/20260604_social_features.sql:72`: `my_progress`/`buddy_progress` have `CHECK (>= 0)` but no upper bound, and `SocialEngine` marks quests complete when `progress >= requirementCount`. A client sending `progress: 999999` insta-completes the quest.

**Fix:** clamp on write in the API route (`Math.min(progress, requirementCount)`) and add `CHECK (my_progress <= requirement_count)` in a follow-up migration.

### 2.6 — Cron auth dev bypass — **LOW**

`src/lib/cron-auth.ts:58–73`: `verifyCronBearer()` allows unauthenticated calls whenever `NODE_ENV !== 'production'` with only a log line. A staging deploy with the wrong NODE_ENV exposes season toggles, trial reminders, and analytics snapshots.

**Fix:** require an explicit `ALLOW_UNAUTHENTICATED_CRON=true` opt-in for the bypass instead of inferring from NODE_ENV.

### 2.7 — Stripe webhook silently swallows unknown price IDs — **LOW**

`src/app/api/stripe/webhook/route.ts:58–73`: `tierFromPriceId()` returns `null` for unmapped price IDs and the event proceeds, silently corrupting tier state if env vars drift. Signature verification itself is solid.

**Fix:** Sentry-error and reject events with unmapped price IDs.

### 2.8 — What the backend gets right (so it stays right)

- COPPA boundary is real and server-enforced: preset-template-only messaging (template text resolved server-side from the catalog — free text never reaches the DB), parent approval required for friend connections, parents can read all of their child's messages.
- XP flow ignores client-supplied amounts; canonical rewards come from `game-xp-config.ts` with a server-side daily cap.
- Middleware default-denies `/api/*` unless allowlisted; CSP nonces per request; `scripts/audit-api-auth.sh` enforces auth-or-public on every route in CI.
- No secrets in the repo (gitleaks-verified with custom Supabase/Anthropic/Stripe rules).

---

## 3. Frontend Findings

### 3.1 — The game-quality bimodality — **HIGH** (product-critical)

The library splits into two tiers with very different quality:

| Tier | Games | Character |
|---|---|---|
| Flagship | ~6 (PromptLab, AgentArchitect, EthicsCourtroom, BuildClassifier, ApiExplorer, NeuralBuilder) | 800–2,400 lines each, 3D environments, multi-phase, rich feedback |
| Standard | ~28 | 60–100-line wrappers around `QuizLevelRenderer`/sim templates — timer, score, explanation toast, done |

Roughly half the library is "answer 10 questions, see a toast." Pedagogically sound, neurologically understimulating. A 10-year-old finishes a level in 90 seconds and feels like they consumed content, not played a game.

### 3.2 — Phase 5/6 infrastructure built but not adopted by games — **HIGH** ⚠ *verified*

- `GameJuiceEngine` **is** wired into `GameShell` via `JuiceProvider` (`src/components/game/GameShell.tsx`) — so shell-level combo tracking exists.
- But the **GameMechanicKit components have zero consumers**: `grep -rl "components/mechanics" src` returns nothing outside the components themselves. `DragDropZone`, `ConnectionBoard`, `SortingTray`, `ChoiceCardDeck` were built in Phase 6 and no game imports any of them.
- The `ChoiceCard`-with-consequences mechanic is defined and never used; all games are linear level 1→2→3→done with no branching or replay incentive.

**Fix:** this is the cheapest possible win — the components exist and are tested. Retrofit one mechanic into each standard game (see the enhancement doc for a concrete rollout plan).

### 3.3 — Accessibility in games — **HIGH**

Only 8 of 50 game files contain any `aria-` attribute, and keyboard handlers were found in ~3 game files. Quiz options lack `role="radio"`/`aria-pressed`; feedback popups lack `aria-live`; score/combo changes are silent to screen readers. For a 6–16 audience this matters more, not less — and it's a procurement blocker for schools.

**Fix:** add ARIA + keyboard support to the **shared renderers** (`QuizLevelRenderer`, `GameLevelSystem`, `GameVisualKit`) — because ~28 games share them, fixing 3 files fixes most of the library.

### 3.4 — Monolith components — **MEDIUM**

- `PromptLabGame.tsx`: **2,409 lines** (challenges + templates + scoring + phases + 3D in one file)
- `AgentArchitectGame.tsx` / `EthicsCourtroomGame.tsx`: ~1,300 lines each
- `BuildClassifierGame.tsx`: 836 lines

Not broken, but each one is a merge-conflict magnet and untestable as a unit. Split along natural seams (e.g., PromptSandbox / ChallengePanel / TemplateLibrary) when next touched — don't do a big-bang refactor.

### 3.5 — Memoization gap — **MEDIUM**

Only 4 of ~444 components use `React.memo`. Combined with inconsistent Zustand selector usage (some `useGameStore()` bare, some with selectors), hot paths (level nodes, quiz options, HUD counters) re-render on every parent update. Profile first; the likely wins are in the shared game renderers and HUD.

### 3.6 — Persisted store bleed across child switches — **MEDIUM**

`deviceStore`, `cockpitStore`, `guideStore` persist to localStorage without child-scoped keys. Parent switches Child A → Child B on the same device and B inherits A's persisted UI/tutorial state. (`gameStore` had this fixed under STATE-CRIT-001; the same treatment is needed for the remaining persisted stores.)

### 3.7 — Design-system drift in new pages — **LOW–MEDIUM**

The new pages (buddies, seasons, mastery, story, create) mix `SF*` design-system components with inline `style={{ fontFamily: 'var(--font-display)', color: '#…' }}` and 30+ hardcoded hex colors across games. The ESLint contrast rule exists; consider extending lint to flag inline `style` color/font usage so drift stops accumulating.

### 3.8 — Touch targets and back-navigation — **LOW**

Quiz option buttons at `p-3` likely render below the 44×44 px minimum on phones; bump shared renderers to `min-h-12`. Navigating back mid-game silently discards progress — add an "are you sure?" guard when `gameState === 'playing'`.

---

## 4. Architecture & Repo Health

### 4.1 — What's exemplary (keep doing this)

- **Engine pattern:** all 17 engines are pure-function modules — no classes, no singletons, no side effects; API routes call engines and persist results. No client/server logic duplication found.
- **CI:** gitleaks (full history, custom rules) → typecheck/test/build → RLS verification against fresh Postgres → API-auth audit → Sentry source-map check. This is a mature pipeline.
- **Type discipline:** strict mode, 29 `any` (all in Web API/TSL impedance zones), one documented `@ts-expect-error`, zero `@ts-ignore`, zero build-error suppression flags in `next.config.ts`.
- **COPPA-aware observability:** `stripChildPII()` scrubs child fields from every Sentry event.

### 4.2 — Dead/heavy dependencies — **MEDIUM** ⚠ *verified*

- `@splinetool/react-spline` + `@splinetool/runtime`: **zero imports anywhere in `src/`**. ~2 MB of dead dependency. Remove both. (Independent research note: the community Spline MCP server is also non-functional — no reason to keep this around "for later.")
- `@mlc-ai/web-llm` (~2.5 MB + WASM): used in exactly one file (`src/lib/pocketbrain/webllmService.ts`). Verify it's behind a dynamic import / feature flag; if PocketBrain isn't shipping, remove.
- `gsap` + `motion` coexistence is fine (3 files vs 124 files, distinct roles). `xstate` is lightly but legitimately used.

### 4.3 — Documentation sprawl — **LOW** (but real)

~44 loose `.md` files at repo root, including five overlapping audit reports (`AUDIT_REPORT.md`, `AUDIT_REPORT_3-25-2026.md`, `AUDIT_REPORT_03.29.2026.md`, `Final-Audit_04-15-2026.md`, `CODE_AUDIT_SUMMARY_MATRIX_20260315.md`) and multiple generations of `Master-*`/`SparkForge-*` design docs. Anyone (human or AI agent) onboarding to this repo cannot tell which document is authoritative.

**Fix:** `git mv` superseded docs to `docs/archive/` with a one-page `docs/INDEX.md` declaring what's active — the repo already has exactly this convention (`_SUPERSEDED/` + manifest) for stage docs; apply it at the root.

### 4.4 — Test coverage shape — **MEDIUM**

814 unit tests is real coverage, and every engine has a test file. The gaps:

- 2 skipped a11y E2E tests (`a11y-game-focus.spec.ts`) marked "scaffolding for hand-off" — unskip or delete.
- No E2E for the money paths: Stripe checkout → webhook → tier change → reward state. The webhook is unit-tested with mocks only.
- Zero tests render an actual game component. The shared renderers (`QuizLevelRenderer` etc.) are the highest-leverage place to add component tests.

---

## 5. Honest Criticisms (the part you asked for)

1. **You keep buying engines and not driving them.** Phases 5–6 built a juice system and a four-mechanic diversification kit; the games still don't import the mechanics. Phase 8–10 built seven new feature engines (seasons, mastery, adaptive, UGC, story, analytics, social) in roughly a week of commits. The platform's plumbing is now ~2 phases ahead of its product. **Stop adding engines until the 28 standard games consume the ones that exist.** The gap between "infrastructure score" and "what a 9-year-old experiences" is the project's central risk.

2. **The audit-document habit is replacing the fix habit.** This is (by my count) at least the 6th audit document in this repo. Several prior audits flag issues that are still present (e.g., game ARIA coverage was flagged in the April audits). An audit that doesn't convert to closed issues is a cost, not an asset. Recommendation: convert §2.1–§2.5 of this doc into tracked issues *this week*, and archive the older audit docs so there is exactly one live list.

3. **Velocity is outrunning verification on the social surface.** The newest, highest-risk code (kids' social features) is precisely where rate limiting, idempotency, and input validation are thinnest. The team's own hardening patterns (`checkDuplicate`, `applyRateLimit`, Zod-everything) exist and are good — they just weren't applied to the last two phases. That suggests phases are being declared "complete" on green tests, and the security checklist isn't part of the definition of done. Add a per-endpoint checklist (auth ✓ zod ✓ rate-limit ✓ dedup ✓ RLS ✓) to the PR template.

4. **Root-level docs are now actively misleading.** CLAUDE.md says 35 games and 15 stores; the codebase has 42 games and ~19 stores; SparkForge-Score.md says 86 tests, there are 814. Every stale number erodes trust in all the docs. Pick the few living documents and let the rest be explicitly archived.

5. **Demo/dev escape hatches need inventory.** The cron NODE_ENV bypass (§2.6) and the demo-session `hasCoppaConsent: true` hardcode are each individually defensible, but nobody has a single list of "behaviors that differ outside production." Maintain one (`docs/DEV_BYPASSES.md`) — it's the list a future incident review will wish existed.

---

## 6. Prioritized Action List

| # | Action | Effort | Severity |
|---|---|---|---|
| 1 | Validate `buddyId` as UUID in `GET /api/messages`; replace interpolated `.or()` strings | ~30 min | **High** |
| 2 | Apply `checkDuplicate()` to seasons/mastery/friends/messages/UGC POST routes | ~half day | **High** |
| 3 | Add `applyRateLimit()` to the 5 social/UGC routes | ~2 h | **Medium** |
| 4 | Atomic invite-code redemption (`UPDATE … WHERE redeemed = false RETURNING`) | ~2 h | **Medium** |
| 5 | Clamp buddy-quest progress server-side | ~30 min | **Medium** |
| 6 | Remove `@splinetool/*` deps; verify `@mlc-ai/web-llm` is dynamically imported | ~30 min | Medium |
| 7 | ARIA + keyboard support in the 3 shared game renderers (fixes ~28 games at once) | ~1–2 days | **High** |
| 8 | Child-scoped persistence keys for `cockpitStore`/`guideStore`/`deviceStore` | ~2 h | Medium |
| 9 | Cron bypass → explicit `ALLOW_UNAUTHENTICATED_CRON` opt-in | ~30 min | Low |
| 10 | Archive superseded root docs into `docs/archive/` + `docs/INDEX.md` | ~1 h | Low |
| 11 | E2E test: Stripe checkout → webhook → tier → reward | ~1 day | Medium |
| 12 | Reject Stripe events with unmapped price IDs (Sentry error) | ~30 min | Low |

Items 1–5 are the pre-launch security set. Item 7 is the highest-leverage UX/compliance fix in the repo. The game-experience redesign is covered separately in `Fable-Frontend-Enhancement.md`.

---

*Generated by Claude Code (Fable audit series, v1). Findings marked ⚠ verified were manually confirmed against source on 2026-06-12; all file:line references are from branch `setup-sparkforge-dev` @ `9e5d1e4`.*
