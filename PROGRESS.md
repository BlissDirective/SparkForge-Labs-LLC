# SparkForge Build Progress

## Current Phase: Flagship Game Audit Implementation
## Status: IN PROGRESS
## Last Updated: 2026-04-07

---

### Flagship Game Audit — Phase C: Sort Toy Box Major Expansion (April 7, 2026)

**Status:** COMPLETE
**Scope:** Major expansion from 652 → 1,117 lines. 4 bugs fixed (ST1-ST4).
**Branch:** `claude/flagship-game-audit-implementation-cb9TL`

- [x] 5-round progressive system with progression gates (≥60% match to unlock)
- [x] Expanded shape library: 12 → 30+ shapes across 5 round pools
- [x] Expanded criteria: 3 → 8 (shape, color, size, pattern, texture, weight, symmetry, edgeCount)
- [x] 3 game modes: Standard, Challenge (timed), Discovery (free-play with static AI rule matching)
- [x] Animated 3-phase AI reveal (BUG-ST3): feature extraction → distance → clustering
- [x] Scoring overhaul (BUG-ST1): 5pts/sort + combo bonus + match accuracy + round bonuses
- [x] Removed unused useGameContent hook (BUG-ST2)
- [x] replayCount forces shape regeneration on replay (BUG-ST4)

**Files modified:** `src/components/games/SortToyBoxGame.tsx`
**Verification:** `npx tsc --noEmit` — PASS | `npm run build` — PASS

---

### Flagship Game Audit — Phase B: Neural Builder Critical Fixes (April 7, 2026)

**Status:** COMPLETE
**Scope:** 8 bugs in NeuralBuilderGame.tsx (2 Critical, 3 High, 3 Medium)
**Branch:** `claude/flagship-game-audit-implementation-cb9TL`

- [x] BUG-NB1 (CRITICAL): Training accuracy now architecture-dependent (convergence rate, noise, plateau)
- [x] BUG-NB2 (HIGH): optimalMatch normalized by optimal neuron sum, not totalNeurons
- [x] BUG-NB3 (HIGH): sparkIntensity uses raw delta before weight clamping
- [x] BUG-NB4 (CRITICAL): Removed duplicate inline NeuralNetwork3D (kept sceneStore registration)
- [x] BUG-NB5 (MEDIUM): setTimeout in ref, cleared on unmount
- [x] BUG-NB6 (MEDIUM): Heartbeat continues during training at 2.7x speed
- [x] BUG-NB7 (MEDIUM): Audio concurrency limited to 3 (prevents distortion)
- [x] BUG-NB8 (MEDIUM): Canvas cleared on challenge switch

**Files modified:** `src/components/games/NeuralBuilderGame.tsx`
**Verification:** `npx tsc --noEmit` — PASS | `npm run build` — PASS

---

### Flagship Game Audit — Phase A: GameStore + GameShell Bug Fixes (April 7, 2026)

**Status:** COMPLETE
**Scope:** 5 critical/high bugs in shared game infrastructure (affects all 35 games)
**Branch:** `claude/flagship-game-audit-implementation-cb9TL`
**Source:** `flagship-game-content-audit(04.06.2026).md` — Section 3 (Bug Audit), Section 8 (Implementation Roadmap)

- [x] BUG-GS1 (CRITICAL): Decoupled `updateScore()` from `maxScore`. Added `setMaxScore()` action. Score and maxScore are now independent.
- [x] BUG-GS2 (HIGH): Fixed `advanceRound()` off-by-one. Changed `>=` to `>`, advance-then-check pattern.
- [x] BUG-GS3 (HIGH): `resetGame()` now clears all fields: `currentGame`, `totalRounds`, `hintsRemaining` added to reset.
- [x] BUG-GS4 (CRITICAL): Kept `maxScore` in HUD using `totalRounds * 10`. Ceremony tier calculation preserved.
- [x] BUG-GS5 (HIGH): Wrapped `completeAndReward` in try/catch. `hasRewarded.current` resets on failure for auto-retry.

**Files modified:**
- `src/stores/gameStore.ts` — 3 bug fixes + 1 new action
- `src/components/game/GameShell.tsx` — 2 bug fixes (reward pipeline + maxScore)

**Verification:** `npx tsc --noEmit` — PASS (zero type errors)

---

### 3D UI Migration (April 3, 2026)

**Status:** COMPLETE — All 7 phases delivered
**Scope:** Full migration of HTML/CSS dashboard UI to 3D cockpit-embedded panels
**Total:** 49 components, 150 design decisions

**Phase 1 — Infrastructure (8 files):**
- [x] cockpitModePresets
- [x] cockpitDesignTokens
- [x] cockpitUIStore
- [x] CockpitUILayer
- [x] 5 UI primitives (base 3D UI building blocks)

**Phase 2 — Dashboard (9 panels):**
- [x] 6 HTML pages converted to 3D panel architecture
- [x] ~861 lines of HTML removed

**Phase 3 — Auth + Forms (4 panels):**
- [x] LoginPanel3D
- [x] SignupPanel3D
- [x] ResetPasswordPanel3D
- [x] ChatPanel3D

**Phase 4 — Gamification (3 components):**
- [x] XPPopup3D
- [x] CelebrationPanel3D
- [x] useCelebration3D

**Phase 5 — Game UI (3 components):**
- [x] GameHUD3D
- [x] GameTimerBar3D
- [x] GamePhaseOverlay3D

**Phase 6 — Game Templates (6 components):**
- [x] ChoiceButton3D
- [x] QuizGameTemplate
- [x] BuilderGameTemplate
- [x] ExplorerGameTemplate
- [x] LabGameTemplate
- [x] GameLearnCards3D

**Phase 7 — Marketing (1 component):**
- [x] CockpitPreview3D

**Key Changes:**
- AmbientParticles.tsx DELETED (Decision 20.0)
- HolographicHUD REPOSITIONED to peripheral frame (Decision 6.0)
- Cockpit-Interface-Plan.md ARCHIVED to _SUPERSEDED/

---

### Documentation Drift Fixes (March 30, 2026)

**Status:** COMPLETE
**Scope:** Archive obsolete docs, fix CLAUDE.md Section 14, note registry refresh needed

- [x] I1: Archived MOBILE_3D_ENHANCEMENT_PLAN_PartA.md and PartB.md to `docs/00-reference/_SUPERSEDED/` via `git mv`. Updated SUPERSEDED_BY.md manifest with D3D-1 obsolescence reason.
- [x] I2: Added v3.0 refresh note to `docs/00-reference/3D-Component-Registry.md` — authoritative list is now CLAUDE.md Section 9 (93 components). LOD/mobile references in registry are outdated per D3D-1/D3D-2.
- [x] I5: Updated CLAUDE.md Section 14 authStore entry to match actual implementation: `parent, isLoading, isDemoMode, demoSession, setParent/setLoading/clearAuth/startDemoSession/endDemoSession/checkDemoStatus` (was incorrectly listing `user, session, loading, signIn/signUp/signOut`).
- [x] I6: Added note to CLAUDE.md Section 14 accessibilityStore entry that store is exported as `useA11yStore`.
- [x] I9: Verified gameRegistry cleanup — `src/config/gameRegistry.ts` contains zero tablet/mobile column references. Batch 3 cleanup confirmed complete.

### Discrepancies Log

- **I3 — Stage 7 Shared file naming:** CLAUDE.md Section 4 references `STAGE7_Shared_v3FINAL_A` and `XP_Celebration(v2)` but the actual filenames in `docs/` may use spaces (e.g., `STAGE7 Shared v3FINAL PartA.md`). This is a documentation reference inconsistency only — the actual files with spaces are fine and should not be renamed. Stage doc references in CLAUDE.md use underscore convention while files may use spaces.

---

### Frontend Audit Fixes (March 30, 2026)

**Status:** COMPLETE
**Scope:** Build fixes, React 19 compatibility, error boundaries, accessibility, production hardening

- [x] CRIT-001: Added 'use client' to /offline page (build fix)
- [x] CRIT-002: Made Supabase client build-safe with placeholder fallbacks (build fix)
- [x] CRIT-003: Upgraded @nivo/* from 0.88.0 to 0.99.0 for React 19 compatibility
- [x] HIGH-001: Documented font loading migration plan (next/font deferred — no build internet)
- [x] HIGH-002: Added error.tsx for (auth) and (marketing) route groups
- [x] HIGH-003: Added loading.tsx for (auth) and (marketing) route groups
- [x] HIGH-004: Guarded non-essential console statements for production
- [x] HIGH-005: Moved dangerouslySetInnerHTML CSS keyframes to globals.css
- [x] WARN-001: Added loading fallbacks to dynamic 3D imports
- [x] WARN-003: Improved ARIA accessibility on 8 simpler games (52+ labels added)
- [x] WARN-005: Documented guideStore + cockpitAtoms in CLAUDE.md

**Files Created (5):**
- `src/app/(auth)/error.tsx`
- `src/app/(auth)/loading.tsx`
- `src/app/(marketing)/error.tsx`
- `src/app/(marketing)/loading.tsx`
- `src/app/(dashboard)/admin/content/AdminContentClient.tsx`

**Files Modified (8+):**
- `src/app/offline/page.tsx` (added 'use client')
- `src/lib/supabase/client.ts` (build-safe fallbacks)
- `src/lib/supabase/server.ts` (build-safe fallbacks)
- `src/lib/env.ts` (relaxed Supabase validation)
- `src/middleware.ts` (build-safe fallbacks)
- `src/app/globals.css` (CSS keyframes from dangerouslySetInnerHTML)
- `package.json` (@nivo upgrade)
- 8 game components (ARIA improvements)

---

### Marketing Layout & Legal Pages Enhancement (2026-03-30)

**Status:** COMPLETE
**Branch:** `claude/audit-findings-implementation-WJSMR`
**Scope:** Shared marketing layout, production-ready COPPA privacy policy, terms of service

**Phase 1 — Shared Marketing Layout:**
- [x] `src/components/marketing/MarketingHeader.tsx` — Fixed glassmorphism header with nav, auth CTAs, active page indicator
- [x] `src/components/marketing/MarketingFooter.tsx` — 3-column footer (Platform, Legal, Contact) with COPPA badge
- [x] `src/app/(marketing)/layout.tsx` — Updated with shared header/footer, aurora background gradient

**Phase 2 — COPPA-Compliant Privacy Policy (13 sections):**
- [x] Operator identification with physical contact details
- [x] Detailed data collection inventory (what we collect AND don't collect)
- [x] Third-party service disclosures with data/purpose/security per service (5 services)
- [x] Verifiable Parental Consent (VPC) method description
- [x] Parental rights enumeration with exercise instructions
- [x] Written data retention policy with per-category periods (2025 COPPA amendment)
- [x] Written security program disclosure (2025 COPPA amendment)
- [x] Cookie/persistent identifier disclosure table
- [x] No-advertising/no-profiling/no-monetization statement
- [x] Demo mode data handling
- [x] Policy change notification + re-consent requirement
- [x] Legal review required banner

**Phase 3 — Terms of Service (14 sections):**
- [x] Eligibility & age requirements (COPPA alignment)
- [x] Account terms with security responsibilities
- [x] Subscription tiers (Free/Plus/Forge) with billing details
- [x] Parental gate for all purchases
- [x] Demo mode terms
- [x] Comprehensive acceptable use policy
- [x] AI-specific disclosures (Anthropic API, moderation, no profiling)
- [x] No-advertising statement
- [x] Intellectual property
- [x] Termination (by user and by operator)
- [x] Disclaimers & limitation of liability
- [x] Dispute resolution (Delaware law, JAMS arbitration)
- [x] Change notification + re-consent requirement

**Phase 4 — Documentation Updates:**
- [x] Master Implementation Guide v4.0 — Added marketing components, privacy/terms pages, auth callback to file registries
- [x] PROGRESS.md — Full implementation log
- [x] AUDIT_REPORT_03.29.2026.md — Resolution status table (updated earlier)

**Files Created (4):**
- `src/components/marketing/MarketingHeader.tsx`
- `src/components/marketing/MarketingFooter.tsx`
- `src/app/(marketing)/privacy/page.tsx` (rewritten from scratch)
- `src/app/(marketing)/terms/page.tsx` (rewritten from scratch)

**Files Modified (2):**
- `src/app/(marketing)/layout.tsx` (full rewrite — added header/footer/aurora)
- `docs/00-reference/SparkForge_Master_Implementation_Guide_v3.2.md` (file registry updates)

---

### Audit Findings Implementation (2026-03-30)

**Status:** CRITICAL + HIGH COMPLETE
**Branch:** `claude/audit-findings-implementation-WJSMR`
**Source:** `AUDIT_REPORT_03.29.2026.md`

**CRITICAL Findings (5/5 Resolved):**
- [x] CRIT-001: AuthProvider wired into (dashboard) and (auth) layouts
- [x] CRIT-002: COPPA consent endpoint secured with session auth + rate limiting
- [x] CRIT-003: Sentry PII scrubbing via beforeSend on all 3 configs (client/server/edge)
- [x] CRIT-004: SQL CHECK constraints consolidated to canonical 6-value set + migration script
- [x] CRIT-005: /privacy and /terms pages created under (marketing) route group

**HIGH Findings (8/8 Resolved, 1 Verified OK):**
- [x] HIGH-001/002: Duplicate SQL files deleted (001b_rls.sql, 001c_functions.sql)
- [x] HIGH-003: search_path added to get_lab_progress SECURITY DEFINER function
- [x] HIGH-004: IDOR fix — auth.uid() check in get_parent_dashboard
- [x] HIGH-005: Daily streak reset pg_cron job added
- [x] HIGH-006: Badge thresholds corrected (35 games, 67 badges)
- [x] HIGH-007: All 9 TypeScript errors fixed across 5 source files
- [x] HIGH-008: Cascading deletes verified — all FKs have ON DELETE CASCADE (no fix needed)
- [x] HIGH-009: Auth callback route.ts created for OAuth/magic link flows

**Build Verification:**
- [x] TypeScript compilation: PASS
- [x] ESLint: PASS (additional fixes applied for unescaped entities, prefer-const, layout exports)
- [ ] Prerender: EXPECTED FAIL (missing Supabase env vars in build environment)

**Discrepancies Log:**
- useAuthHover exported from (auth)/layout.tsx violated Next.js layout export rules — extracted to src/hooks/useAuthHover.ts
- useContent.ts queryFn return type needed explicit cast for type-safe select callback

---

### Previous: Stage 9 — Content Agent Enhancement (ALL 9 PHASES COMPLETE)
**Status:** COMPLETE — Full 9-phase enhancement plan implemented
**Last Updated:** 2026-03-28 (Phase 9: New Game Development Generator)

---

### Content Agent Enhancement — Phase 1: Schema Extension (2026-03-28)

**Status:** COMPLETE
**Branch:** `claude/stage-9-audit-fixes-YQomo`
**Scope:** Foundation types, prompts, pipeline stages, hooks, admin dashboard for 9-phase enhancement plan

**Phase 1A — TypeScript Types (commit b10df85):**
- [x] 4 new ContentType values: game_scenario, game_challenge, trending_topic, branching_lesson
- [x] 12 new interfaces: GameScenarioConfig, GameChallengeConfig, TrendingTopicConfig, BranchingLessonConfig, BranchNode, ContentMetadata, DynamicGameConfig, ArchitectureRequirement, PipelineGateStatus, NewGameBlueprint
- [x] Extended CONTENT_TYPE_ICONS

**Phase 1B — Pipeline Prompts (commit b10df85):**
- [x] GAME_MECHANICS: 35-game slug→mechanics mapping
- [x] 4 new system prompts: GAME_SCENARIO, GAME_CHALLENGE, TRENDING_RESEARCH, BRANCHING_LESSON
- [x] TRENDING_SEARCH_QUERIES: 10 weekly-rotating queries

**Phase 1C — Pipeline Stages (commit b10df85):**
- [x] stageGenerateGameScenarios() — dynamic rounds for existing games
- [x] stageGenerateGameChallenges() — time-limited events
- [x] stageGenerateBranchingLessons() — interactive decision trees
- [x] stageTrendingResearch() — weekly AI news with game adaptations
- [x] PipelineMode: 'standard' | 'enhanced' | 'full'
- [x] Extended AgentRunResult with new metrics

**Phase 1D — Admin Dashboard (commit d163291):**
- [x] 4 new Lucide icons for content types
- [x] Pipeline mode selector (standard/enhanced/full)

**Phase 1E — Content Hooks (commit b10df85):**
- [x] useGameContent(gameSlug, ageBand) — game scenarios + challenges
- [x] useTrendingContent(ageBand) — trending topics
- [x] useBranchingLessons(labNumber, ageBand) — interactive lessons

**Files Created (0) | Files Modified (5):**
- `src/types/index.ts` — 12 new interfaces + 4 content types
- `src/lib/agent/prompts.ts` — 4 prompts + 35 game mechanics + trending queries
- `src/lib/agent/pipeline.ts` — 4 new stages + PipelineMode + enhanced orchestrator
- `src/hooks/useContent.ts` — 3 new React Query hooks
- `src/app/api/agent/run/route.ts` — mode query param support
- `src/app/(dashboard)/admin/content/page.tsx` — icons + mode selector

### Phase 2: Dynamic Game Scaffolding (2026-03-28)

**Status:** COMPLETE (commit 9c9e4f4)
- [x] All 35 game components wired with `useGameContent` hook
- [x] Static content preserved as fallback, dynamic scenarios overlay when available
- [x] 3 parallel batches: Labs 1-3 (12 games), Labs 4-7 (12 games), Labs 8-10 (11 games)

### Phase 3: Trending AI Topics Pipeline (2026-03-28)

**Status:** COMPLETE (commit fa5aabf)
- [x] `/api/agent/trending` route — POST (admin) + GET (cron)
- [x] `runTrendingPipeline()` standalone pipeline function
- [x] `TrendingFeed.tsx` dashboard component (compact/full modes)
- [x] `vercel.json` — weekly trending cron (Mondays 8 AM UTC)
- [x] `schedule/route.ts` — supports ?mode= param, defaults to 'enhanced'

**Files Created (2):**
- `src/app/api/agent/trending/route.ts`
- `src/components/dashboard/TrendingFeed.tsx`

**Files Modified (3):**
- `src/lib/agent/pipeline.ts` — added runTrendingPipeline()
- `src/app/api/agent/schedule/route.ts` — mode param support
- `vercel.json` — weekly trending cron

**Enhancement Roadmap (9 Phases):**
- [x] Phase 1: Content Agent Schema Extension ✅
- [x] Phase 2: Dynamic Game Scaffolding (all 35 games) ✅
- [x] Phase 3: Trending AI Topics Pipeline ✅
- [x] Phase 4: Interactive Lesson Builder ✅
- [x] Phase 5: AI Guide Avatar Integration ✅
- [x] Phase 6: 3D Cockpit Content Integration ✅
- [x] Phase 7: Admin Dashboard Enhancement ✅
- [x] Phase 8: 3D Architecture/UI/UX Generator ✅
- [x] Phase 9: New Game Development Generator ✅

### Phase 9: New Game Development Generator (2026-03-28)

**Status:** COMPLETE (commit 3b1ce43)
**Scope:** Autonomous pipeline that creates entirely new games (concept → code → 3D → audit)

- [x] `game-generator-prompts.ts` — 3 prompts (concept, game code, environment code)
- [x] `game-generator-pipeline.ts` — 9-stage pipeline with COPPA audit
- [x] `/api/agent/game-generator` route — admin-only, rate limited
- [x] Admin dashboard — "New Game" button with tier/lab targeting

**Files Created (3):**
- `src/lib/agent/game-generator-prompts.ts`
- `src/lib/agent/game-generator-pipeline.ts`
- `src/app/api/agent/game-generator/route.ts`

**Files Modified (1):**
- `src/app/(dashboard)/admin/content/page.tsx` — New Game button

---

### FULL ENHANCEMENT SUMMARY (9 Phases, 2026-03-28)

| Phase | Scope | New Files | Modified | Lines Added |
|-------|-------|-----------|----------|-------------|
| Audit Fixes | 11 findings resolved | 1 | 7 | ~200 |
| Phase 1: Schema | Types, prompts, pipeline, hooks | 0 | 7 | ~670 |
| Phase 2: Scaffolding | 35 games wired with useGameContent | 0 | 35 | ~106 |
| Phase 3: Trending | API route, feed component, cron | 2 | 3 | ~297 |
| Phase 4: Lessons | Branching renderer, hook, API | 2 | 2 | ~357 |
| Phase 5: AI Guide | Store, prompts, API, voice, chat, 3D | 9 | 1 | ~1,400 |
| Phase 6: Cockpit | Content bridge, NPC bubbles, hologram | 3 | 0 | ~366 |
| Phase 7: Admin | Search, analytics, type filter | 0 | 1 | ~157 |
| Phase 8: 3D Generator | Architect pipeline, prompts, API | 3 | 1 | ~712 |
| Phase 9: Game Generator | Game pipeline, prompts, API | 3 | 1 | ~583 |
| **TOTAL** | | **23 new** | **58 modified** | **~4,848** |

### Phase 8: 3D Architecture/UI/UX Generator (2026-03-28)

**Status:** COMPLETE (commits 3c58bce, Phase 8B)
**Scope:** Autonomous Claude API pipeline that generates R3F components with 8-gate approval

**Phase 8A — Pipeline + Prompts + Route (commit 3c58bce, 3 files):**
- [x] `architect-prompts.ts` — 4 system prompts (analysis, R3F code gen, integration, COPPA audit)
- [x] `architect-pipeline.ts` — 8-gate pipeline (analysis → architecture → code_gen → file_mgmt → build_test → coppa_audit → admin_approval → deploy)
- [x] `/api/agent/architect` route — admin-only POST, rate limited, Zod validated

**Phase 8B — Admin Integration (this commit):**
- [x] "Generate 3D Architecture" button in admin preview modal
- [x] Triggers architect pipeline per content item, shows gate results via toast

**Files Created (3):**
- `src/lib/agent/architect-prompts.ts`
- `src/lib/agent/architect-pipeline.ts`
- `src/app/api/agent/architect/route.ts`

**Files Modified (1):**
- `src/app/(dashboard)/admin/content/page.tsx` — architect trigger button

### Phase 7: Admin Dashboard Enhancement (2026-03-28)

**Status:** COMPLETE (commit 22c92a1)
- [x] Search bar — real-time title search with client-side filtering
- [x] Content type filter — dropdown for all 7 content types
- [x] Manual create button — UI hook for future create modal
- [x] Analytics tab — content statistics with by-type, by-lab, by-band breakdowns
- [x] filteredItems — replaces items.map for search + type filter support

**Files Modified (1):**
- `src/app/(dashboard)/admin/content/page.tsx` — +157 lines

### Phase 6: 3D Cockpit Content Integration (2026-03-28)

**Status:** COMPLETE (commit 157eb08)
- [x] `useCockpitContentBridge` hook — bridges Content Agent data to cockpit elements
- [x] `NPCSpeechBubble.tsx` — floating 3D speech bubbles above NPC bots
- [x] `ContentHologram3D.tsx` — holographic content display (daily challenge, trending, recs)

**Files Created (3):**
- `src/hooks/useCockpitContentBridge.ts`
- `src/components/3d/NPCSpeechBubble.tsx`
- `src/components/3d/ContentHologram3D.tsx`

### Phase 5: AI Guide Avatar Integration (2026-03-28)

**Status:** COMPLETE (commits a66d464, 800b0d1, Phase 5C)
**Scope:** Full "Spark" AI Guide — 5 avatar concepts, voice I/O, streaming chat, context awareness

**Phase 5A — Infrastructure (commit a66d464, 6 files):**
- [x] `guideStore.ts` — 10th Zustand store (persisted preferences, conversation, voice, turns)
- [x] `lib/guide/prompts.ts` — Composable prompt system (BASE + AGE_BAND + CONTEXT + LAB + GAME_HINTS)
- [x] `/api/ai/guide/route.ts` — SSE streaming conversation (Haiku, tier-gated turns)
- [x] `useVoiceInput.ts` — Web Speech API STT with interim results
- [x] `useVoiceOutput.ts` — Web Speech API TTS (age-band-tuned pitch/rate, audio-reactive)
- [x] `useGuideContext.ts` — Auto-detects context from route/sceneStore

**Phase 5B — Components (commit 800b0d1, 3 files):**
- [x] `GuideChatPanel.tsx` — Glassmorphic chat overlay (SSE streaming, voice, minimize/expand)
- [x] `GuideAvatar3D.tsx` — R3F avatar (5 concepts: Orb, Fox, Drone, Spark, Nova, all audio-reactive)
- [x] `GuideMobileAvatar.tsx` — CSS 2D fallback (pulse, spinner, lab-color glow)

**Phase 5C — Integration (this commit):**
- [x] Dashboard layout — GuideChatPanel mounted, useGuideContext activated

**Files Created (9):**
- `src/stores/guideStore.ts`, `src/lib/guide/prompts.ts`, `src/app/api/ai/guide/route.ts`
- `src/hooks/useVoiceInput.ts`, `src/hooks/useVoiceOutput.ts`, `src/hooks/useGuideContext.ts`
- `src/components/ui/GuideChatPanel.tsx`, `src/components/3d/GuideAvatar3D.tsx`
- `src/components/ui/GuideMobileAvatar.tsx`

**Files Modified (1):**
- `src/app/(dashboard)/layout.tsx` — GuideChatPanel + useGuideContext integration

### Phase 4: Interactive Lesson Builder (2026-03-28)

**Status:** COMPLETE (commit ce06dd7)
- [x] `useBranchingLesson` hook — decision-tree state machine with back/restart/progress
- [x] `BranchingLessonRenderer` component — full interactive lesson UI with 4 node types
- [x] Content API — multi-type filtering (comma-separated) + gameSlug filter
- [x] ContentQuerySchema — accepts string type and gameSlug params

**Files Created (2):**
- `src/hooks/useBranchingLesson.ts`
- `src/components/content/BranchingLessonRenderer.tsx`

**Files Modified (2):**
- `src/lib/validations.ts` — ContentQuerySchema extended
- `src/app/api/content/route.ts` — multi-type + gameSlug filtering
- [ ] Phase 4: Interactive Lesson Builder
- [ ] Phase 5: AI Guide Avatar Integration
- [ ] Phase 6: 3D Cockpit Content Integration
- [ ] Phase 7: Admin Dashboard Enhancement
- [ ] Phase 8: 3D Architecture/UI/UX Generator
- [ ] Phase 9: New Game Development Generator

---

### Stage 9 Audit Fixes (2026-03-28)

**Status:** COMPLETE
**Branch:** `claude/stage-9-audit-fixes-YQomo`
**Build Status:** TypeScript PASS (0 new errors), all changes compile clean

**Batch 1 — CRIT-001 + HIGH-003 (commit 328fd17):**
- [x] S9-CRIT-001 — Moved Anthropic SDK init from top-level to lazy per-request in prompt-lab/route.ts
- [x] S9-HIGH-003 — Replaced hardcoded model string with MODELS.moderation from centralized config
- [x] S9-HIGH-004 — Already resolved (proper TextBlock type guard + error: unknown)

**Batch 2 — HIGH-001 + HIGH-002 (commit 2987334):**
- [x] S9-HIGH-001 — Added client-side admin guard (useAuthStore + useRouter redirect) to admin content page
- [x] S9-HIGH-002 — Replaced manual POST validation with Zod schema (ReviewSchema with UUID validation)

**Batch 3 — WARN-001/002/003 + INFO-001 (commit 23cf531):**
- [x] S9-WARN-001 — Added rate limiting on /api/agent/run (2/hr via RATE_LIMITS.contentAgent)
- [x] S9-WARN-002 — Added rate limiting on review POST (60/min default)
- [x] S9-WARN-003 — CRON_SECRET now required in production (blocks endpoint if unset)
- [x] S9-INFO-001 — Migrated schedule route from raw NextResponse to apiSuccess/apiError helpers

**Batch 4 — WARN-004 (commit fff7360):**
- [x] S9-WARN-004 — Added defense-in-depth post-response moderation to Prompt Lab:
  - Layer 1: Keyword blocklist (regex, zero latency)
  - Layer 2: Haiku LLM moderation (age-band-aware screening)
  - Blocked responses logged with moderation_passed=false
  - Children see safe redirect messages

**Files Created (1):**
- `src/lib/agent/moderation.ts` — Post-response moderation (blocklist + Haiku)

**Files Modified (5):**
- `src/app/api/ai/prompt-lab/route.ts` — Lazy init + MODELS + moderation integration
- `src/app/(dashboard)/admin/content/page.tsx` — Admin guard
- `src/app/api/agent/review/route.ts` — Zod validation + rate limiting
- `src/app/api/agent/run/route.ts` — Rate limiting
- `src/app/api/agent/schedule/route.ts` — CRON_SECRET enforcement + apiSuccess/apiError
## Current Phase: Stage 7 — Scene Store Audit & Environment Wiring
## Status: COMPLETE — All Stage 7 findings resolved including S7-WARN-002 + 34 TS errors fixed
## Last Updated: 2026-03-28

---

### Stage 7 — Scene Store Audit & Environment Wiring (2026-03-28)

**Status:** COMPLETE
**Branch:** claude/audit-scene-store-stage7-P69V9
**Build Status:** TypeScript 0 errors | Build PASS

**Batch 1 — Stage 7 Game TypeScript Fixes (3 files):**
- [x] EmojiDecoderGame: Pass required props to EmojiDecoder3D, fix variable ordering
- [x] AiOrNotGame: Pass required props to AiOrNot3D, map TimeCategory → visual categories
- [x] DataDetective3D: Replace THREE.Points namespace with named Points import

**Batch 2 — Supporting TypeScript Fixes (11 files, 31 errors → 0):**
- [x] useGamification, useChildren, useContent: Type apiFetch generics
- [x] content/[slug], labs/[labId], labs/page: Type hook return values
- [x] badges/route, stripe/checkout: Fix type assertions
- [x] HolographicButton, LessonViewer, TrophyRoom: Fix type mismatches

**Batch 3 — FL-Lite Environment Wiring (S7-WARN-002, 9 files):**
- [x] DataDetective3D ← DataDetectiveEnvironment
- [x] RobotVacuum3D ← RobotVacuumEnvironment
- [x] CameraQuest3D ← CameraQuestEnvironment
- [x] ChatbotNodes3D ← ChatbotBuilderEnvironment
- [x] EmojiDecoder3D ← EmojiDecoderEnvironment
- [x] CodeBlocks3D ← CodeBlocksEnvironment
- [x] MyFirstAiApp3D ← MyFirstAiAppEnvironment
- [x] FutureForge3D ← FutureForgeEnvironment
- [x] AiOrNot3D ← AiOrNotEnvironment

**Stage 7 Audit Summary — All Findings RESOLVED:**
| ID | Severity | Status |
|---|---|---|
| S7-CRIT-001 | CRITICAL | Resolved (March 27 — D3D-B1 Canvas refactor) |
| S7-HIGH-001 | HIGH | Resolved (GameShell handles startGame) |
| S7-HIGH-002 | HIGH | Resolved (March 27 — EmojiDecoder + AiOrNot 3D wired) |
| S7-HIGH-003 | HIGH | Resolved (March 27 — complete phases added) |
| S7-HIGH-004 | HIGH | Resolved (March 27 — age band enforcement) |
| S7-WARN-001 | WARNING | Resolved (March 27 — learn phases) |
| S7-WARN-002 | WARNING | Resolved (March 28 — 9 FL-Lite environments wired) |
| S7-WARN-003 | WARNING | Resolved (March 27 — ARIA improvements) |
| S7-WARN-004 | WARNING | Resolved (March 27 — SceneRouter error boundary) |
## Current Phase: Stage 6 — Flagship Games Enhancement (P0-P6 COMPLETE)
## Status: COMPLETE — 14 audit fixes + 5 embedding fixes + 7 enhancement phases (P0-P6)
## Last Updated: 2026-03-28 (P6 Session 3: 4 game-specific 3D visualizations)

---

### Stage 6 Enhancement — P0/P1/P2 (2026-03-28)

**Status:** COMPLETE (Session 1 of 3)
**Branch:** claude/stage-6-audit-fixes-38BE4
**Scope:** SortToyBox env expansion + cockpit broadcast for all 6 + audio for all 6

**Phase 1 (P0) — SortToyBoxEnvironment Expansion (commit 47859d6):**
- [x] Expanded from 251 → 622 lines (5 → 12 sub-components)
- [x] NEW: RoboticSortArms (6 animated arms, progress-reactive), FeatureScanner (sweeping beam)
- [x] NEW: BinaryDecisionTree, ClusterSpheres (3 orbiting), WarehouseShelving (24 instanced)
- [x] NEW: DataFlowTubes (3 glowing connections), HolographicLabels (3 floating panels)
- [x] Reactive props: sortProgress, activeGroupCount
- [x] useFrame hooks: 6 (up from 2). Triangle budget: ~3.8M (up from ~1M). Wow: 4/5 (up from 2/5)

**Phase 2 (P1) — Cockpit Broadcast Integration (commit 497dc7d):**
- [x] PetTrainerGame: button-press (correct/wrong), dial-rotate (accuracy), celebration-start (evolution)
- [x] SortToyBoxGame: button-press (sort), celebration-start + dial-rotate (AI reveal)
- [x] NeuralBuilderGame: dial-rotate (epoch progress), celebration-start (50/75/90% + complete)
- [x] PromptLabGame: button-press + dial-rotate (send), celebration-start (challenge pass)
- [x] AgentArchitectGame: button-press (place/run), celebration-start + dial-rotate (mission)
- [x] BiasDetectiveGame: button-press + dial-rotate (evidence), celebration-start (case closed)

**Phase 3 (P2) — Per-Game Audio Hooks (commit 21c0733):**
- [x] usePetTrainerAudio.ts — correct chime, wrong tone, streak chord, evolution fanfare, blip
- [x] useSortAudio.ts — throw whoosh, bin land thunk, group fill chime, AI reveal, complete
- [x] usePromptLabAudio.ts — typewriter click, send whoosh, response pop, score tone, challenge fanfare
- [x] useAgentAudio.ts — block click, connect wire, run hum, step tick, mission fanfare (star-rated)
- [x] useBiasDetectiveAudio.ts — gavel strike, evidence reveal, scale creak, balanced chime, case closed
- [x] All 6 games wired with soundEnabled toggle + audio calls at key action points

**Files Created (5):**
- `src/hooks/usePetTrainerAudio.ts`, `useSortAudio.ts`, `usePromptLabAudio.ts`
- `src/hooks/useAgentAudio.ts`, `useBiasDetectiveAudio.ts`

**Files Modified (7):**
- `src/components/3d/environments/SortToyBoxEnvironment.tsx` — Full expansion
- All 6 game components — cockpitBroadcast + audio integration

### Stage 6 Enhancement — P3/P4/P5 Session 2 (2026-03-28)

**Status:** COMPLETE
**Branch:** claude/stage-6-audit-fixes-38BE4

**Phase 4 (P3) — Dead Prop Fixes + Missing Interactions (commit 4b41e3b):**
- [x] NeuralNetwork3D: dataFlowActive now drives traveling data dots along connections
- [x] PromptBubble3D: merge mechanic implemented (similar keywords attract + absorb)
- [x] Pet3DScene: emoji prop made optional (never used in 3D component)
- [x] SortScene3D: hover state + cursor pointer on ThrowableItem
- [x] AgentPipeline3D: hover glow + cursor pointer on Block3D
- [x] BiasScales3D: chain links swing with beam tilt velocity (cascading pendulum)
- [x] SortScene3D: landing particle burst (8 particles, auto-cleanup 700ms)
- [x] PromptLabGame: always-on environment (registers on mount, not just on keywords)

**Phase 5 (P4+P5) — CeremonyFX Milestones + Environment Reactivity (commit d4d83a4):**
- [x] All 6 games trigger CeremonyFX at conservative milestones:
  - PetTrainer: confetti on evolution, NeuralBuilder: confetti at 50/75%, streak at 90%
  - SortToyBox: confetti on AI reveal, PromptLab: confetti on challenge pass
  - AgentArchitect: confetti/streak on mission, BiasDetective: confetti on case closed
- [x] BiasDetective: dynamic caseColor per case type (blue/amber/green/purple/pink/red)
- [x] PetTrainer + NeuralBuilder environments already mood/accuracy-reactive (verified working)

**Files Modified (13):**
- 6 game components — CeremonyFX + uiStore integration
- 7 3D components — data flow, merge, hover, particles, chain physics

---

### Stage 6 Audit Fix — Full Resolution (2026-03-27)

**Status:** COMPLETE
**Branch:** claude/stage-6-audit-fixes-38BE4
**Build Status:** All 14 findings resolved across 4 batches

**Batch 1A — Critical Game Lifecycle (commit 01710ae):**
- [x] S6-CRIT-001 — PromptLabGame: Added completeGame() call in report phase, "Finish Lab" button, full report UI with stats + age-band "What You Learned"
- [x] S6-CRIT-003 — SortToyBoxGame: Removed redundant startGame("sort-toy-box", 1) — GameShell handles initialization with correct totalRounds=12

**Batch 1B — D3D-B1 Canvas Refactor (commit 49c768a):**
- [x] S6-CRIT-002 — Refactored 5 standalone Canvas → group: Pet3DScene, SortScene3D, NeuralNetwork3D, PromptBubble3DScene, AgentPipeline3D. Removed Canvas from BiasDetectiveGame. All 6 games register via setGameSceneContent().
- [x] S6-HIGH-005 — Full sceneStore integration in all 6 flagship game components

**Batch 2A — Sort Toy Box Expansion (commit bcb1a02):**
- [x] S6-HIGH-001 — Full ARIA labels on all interactive elements
- [x] S6-HIGH-002 — Added learn phase (3 lesson cards/band) + complete phase (stats, summary, completeGame)
- [x] S6-HIGH-006 — Full A/B/C age band content in all phases
- [x] S6-WARN-003 — Removed dead code (_ShapeIcon, _assignGroup)
- [x] S6-WARN-005 — Removed redundant nested phase check

**Batch 2B+2C+3 — Disposal, Environment, Rate Limit (commit e788614):**
- [x] S6-HIGH-003 — Material disposal added to BiasScales3D + PromptBubble3D
- [x] S6-HIGH-004 — Created SortToyBoxEnvironment.tsx (240 lines, Lab 2 purple theme)
- [x] S6-WARN-001 — Client-side rate limiting in PromptLab (2s cooldown + 50/day cap)
- [x] S6-WARN-002 — Resolved (removed redundant startGame call)
- [x] S6-WARN-004 — Resolved (BiasDetective Canvas removed)

**Files Created (1):**
- `src/components/3d/environments/SortToyBoxEnvironment.tsx`

**Files Modified (14):**
- `src/components/games/PromptLabGame.tsx` — completeGame, report phase, rate limiting, sceneStore
- `src/components/games/SortToyBoxGame.tsx` — Full rewrite: learn/complete phases, ARIA, age bands
- `src/components/games/PetTrainerGame.tsx` — sceneStore integration
- `src/components/games/NeuralBuilderGame.tsx` — sceneStore integration
- `src/components/games/AgentArchitectGame.tsx` — sceneStore integration
- `src/components/games/BiasDetectiveGame.tsx` — sceneStore + Canvas removal
- `src/components/3d/Pet3DScene.tsx` — Canvas → group
- `src/components/3d/SortScene3D.tsx` — Canvas → group
- `src/components/3d/NeuralNetwork3D.tsx` — Canvas → group
- `src/components/3d/PromptBubble3DScene.tsx` — Canvas → group
- `src/components/3d/AgentPipeline3D.tsx` — Canvas → group
- `src/components/3d/BiasScales3D.tsx` — Material disposal
- `src/components/3d/PromptBubble3D.tsx` — Material disposal
- `src/components/3d/environments/index.ts` — Added SortToyBoxEnvironment export

**Stage 6 Audit Summary — All Findings:**
| ID | Severity | Status |
|---|---|---|
| S6-CRIT-001 | CRITICAL | Resolved (Batch 1A) |
| S6-CRIT-002 | CRITICAL | Resolved (Batch 1B) |
| S6-CRIT-003 | CRITICAL | Resolved (Batch 1A) |
| S6-HIGH-001 | HIGH | Resolved (Batch 2A) |
| S6-HIGH-002 | HIGH | Resolved (Batch 2A) |
| S6-HIGH-003 | HIGH | Resolved (Batch 2B) |
| S6-HIGH-004 | HIGH | Resolved (Batch 2C) |
| S6-HIGH-005 | HIGH | Resolved (Batch 1B) |
| S6-HIGH-006 | HIGH | Resolved (Batch 2A) |
| S6-WARN-001 | WARNING | Resolved (Batch 3) |
| S6-WARN-002 | WARNING | Resolved (Batch 1A) |
| S6-WARN-003 | WARNING | Resolved (Batch 2A) |
| S6-WARN-004 | WARNING | Resolved (Batch 1B) |
| S6-WARN-005 | WARNING | Resolved (Batch 2A) |

**3D Embedding Audit (Batch 5, commit 18b47fc):**
- [x] 3D-EMB-001 — SortScene3D: Wired in orphaned SortToyBoxEnvironment
- [x] 3D-EMB-002 — NeuralNetwork3D: Removed duplicate Environment + EffectComposer
- [x] 3D-EMB-003 — AgentPipeline3D: Removed duplicate Environment preset
- [x] 3D-EMB-004 — BiasScales3D: Removed duplicate Environment preset
- [x] 3D-EMB-005 — GameShell: Added cockpitBroadcastStore game-enter/game-exit events

**Stage 6 Doc Updates (Batch 6):**
- [x] Updated 11 stage documents with audit fix notes (6B A/B, 6C A/B, 6D A/B, 6E A/B, 6F A/B, 7B PartA)

### Stage 6 Enhancement — P6 Session 3 (2026-03-28)

**Status:** COMPLETE
**Branch:** claude/stage-6-audit-fixes-38BE4

**Phase 6 (P6) — Game-Specific 3D Visualizations (commit 1e282e9):**
- [x] PetDataLab3D (150 lines) — 3D bar chart for data-lab phase (label distribution, overfitting detection)
- [x] PromptScore3D (130 lines) — Holographic quality ring with 5 dimension segments
- [x] BiasDecisionTree3D (160 lines) — 3D octahedron decision tree for fix phase (biased=red, fixed=green)
- [x] SortFeatureViz3D (170 lines) — 3D feature-space scatter plot for reveal phase

**Files Created (4):**
- `src/components/3d/PetDataLab3D.tsx`, `PromptScore3D.tsx`, `BiasDecisionTree3D.tsx`, `SortFeatureViz3D.tsx`

**Files Modified (4):**
- PetTrainerGame, PromptLabGame, BiasDetectiveGame, SortToyBoxGame — integrated 3D visualizations
## Current Phase: Stage 8 — Full Suite 3D Cockpit Enhancements
## Status: COMPLETE — All 8 audit findings resolved + 10 3D enhancements (A1-D1)
## Last Updated: 2026-03-28 (Stage 8: Audit fixes + Full Suite 3D cockpit integration)

---

### Stage 8 Audit Fix — Full Resolution (2026-03-27)

**Status:** COMPLETE
**Branch:** claude/stage-8-audit-fixes-A0DNZ
**Build Status:** All 8 findings resolved + 3D embedding audit passed

**Batch 1 — Security Fixes:**
- [x] S8-HIGH-001 — Zod validation on Stripe checkout (CheckoutSchema from validations.ts)
- [x] S8-WARN-002 — Stripe status mapping (STRIPE_STATUS_MAP, DB CHECK updated)
- [x] S8-WARN-005 — Add-child routes through /api/children POST (server-side validation)
- [x] S10-WARN-002 — console.log removed from pricing page

**Batch 2 — Performance + UX:**
- [x] S8-HIGH-002 — PG function get_parent_dashboard() + API route + hook rewrite (6N→1 query)
- [x] S8-WARN-003 — Time limit error handling + optimistic rollback
- [x] S8-WARN-004 — alert() replaced with toast in subscription page

**Batch 3 — COPPA:**
- [x] S8-WARN-001 — Delete child button + confirmation modal in parent dashboard

**3D Cockpit Enhancements (Batches 5-8):**
- [x] A1: ParentStatHologram3D — 4 floating holographic stat tiles (~200K tris)
- [x] A2: Child selector → lab-select broadcast (age-band color → LED rim)
- [x] A3: Time limit → dial-rotate broadcast (snap to preset)
- [x] B1: Tier upgrade ceremony — CeremonyFX confetti on ?success=true
- [x] B2: Billing toggle → toggle-switch broadcast
- [x] B3: Tier card hover → button-press broadcast (tier color → LED rim)
- [x] C1: OnboardingCrystal3D — Progressive crystal formation (~150K tris)
- [x] C2: Lab selection → lab-select broadcast (lab color)
- [x] C3: Launch sequence — game-enter + celebration-start + confetti
- [x] D1: Animated CSS comparison bars in pricing feature table

**Files Created (5):**
- `sql/schema-stage8-dashboard-fn.sql` — PG function + DB constraint update
- `src/app/api/parent/dashboard/route.ts` — Aggregated dashboard API
- `src/components/3d/ParentStatHologram3D.tsx` — 4 floating stat tiles
- `src/components/3d/ParentDashboardBridge.tsx` — Bridge for CockpitCanvas
- `src/components/3d/OnboardingCrystal3D.tsx` — Progressive crystal formation

**Files Modified (9):**
- `src/app/api/stripe/checkout/route.ts` — Zod validation
- `src/app/api/stripe/webhook/route.ts` — Status mapping
- `src/hooks/useParentDashboard.ts` — API-driven fetch
- `src/app/(dashboard)/parent/page.tsx` — Delete button, error handling, toast, 3D broadcasts
- `src/app/(dashboard)/parent/subscription/page.tsx` — Toast, ceremony, broadcasts
- `src/app/(dashboard)/parent/add-child/page.tsx` — API route instead of direct DB
- `src/app/(dashboard)/onboarding/page.tsx` — Crystal import, broadcasts, launch sequence
- `src/app/(marketing)/pricing/page.tsx` — console.log removal, CSS comparison bars
- `src/components/3d/CockpitCanvas.tsx` — ParentDashboardBridge mount

**Stage 8 Audit Summary — All Findings:**
| ID | Severity | Status |
|---|---|---|
| S8-HIGH-001 | HIGH | Resolved (Batch 1) |
| S8-HIGH-002 | HIGH | Resolved (Batch 2) |
| S8-WARN-001 | WARNING | Resolved (Batch 3) |
| S8-WARN-002 | WARNING | Resolved (Batch 1) |
| S8-WARN-003 | WARNING | Resolved (Batch 2) |
| S8-WARN-004 | WARNING | Resolved (Batch 2) |
| S8-WARN-005 | WARNING | Resolved (Batch 1) |
| S10-WARN-002 | WARNING | Resolved (Batch 1) |
## Current Phase: Stage 7 — 3D Enhancement Build + Audit Fix
## Status: COMPLETE — All findings resolved + 3D/UI enhancements deployed
## Last Updated: 2026-03-27 (Stage 7: Audit Fix + 3D Enhancement Build)

---

### Stage 7 — 3D Enhancement Build (2026-03-27)

**Status:** COMPLETE
**Branch:** claude/stage-7-audit-fixes-i4ZvH
**Scope:** FL-Lite 3D upgrades (9 components) + Standard UI/UX (10 games) + Systemic enhancements

**Phase 1A — Shared Particle Library (commit a46cdda):**
- [x] Created `src/lib/3d/gameParticles.ts` — 8 particle presets (confettiBurst, sparkShower, dustCloud, dataStream, discoveryBurst, victoryFireworks, trailParticles, steamPuff)
- [x] Particle factory + physics update loop + completion tier system
- **1 file created, 307 lines**

**Phase 1B — CeremonyFX Game Completion Tiers (commit 7a9c67b):**
- [x] GameShell now triggers cockpit CeremonyFX on game completion
- [x] Gold (>80%) → levelUp ceremony | Silver (50-80%) → confetti | Bronze (<50%) → xp toast
- **1 file modified**

**Phase 1C — Bloom/Vignette Presets:**
- [x] Already implemented via cockpit-architecture.json modePresets (game, gameComplete, celebration)

**Phase 2 — FL-Lite 3D Component Upgrades (commit 0fb222c):**
- [x] DataDetective3D: Discovery particles + MeshPhysicalMaterial refraction lens + glow ring
- [x] RobotVacuum3D: Dust cloud particles + glowing trail + LED eyes + victory spin
- [x] CameraQuest3D: Camera flash + polaroid develop effect + chrome gauge + flip sparks
- [x] ChatbotNodes3D: Message pulse trails + data flow texture + root halo + endpoint burst
- [x] EmojiDecoder3D: Steam puffs + gear mesh upgrade + conveyor scroll + vibration + ejection
- [x] CodeBlocks3D: Tracer trail + snap pop + error shake + CRT scanlines
- [x] MyFirstAiApp3D: Orb connection particles + screen content + launch exhaust + score counter
- [x] FutureForge3D: Grid pulse + selection burst + holographic seal + forge glow
- [x] AiOrNot3D: Verdict particles + spotlight + gallery collection + pedestal reveal
- **9 files modified, +2,013 lines | Wow factor: 2.7/5 → 4.2/5**

**Phase 3 — Standard Game UI/UX Enhancements (commit 31254c5):**
- [x] TimeMachine: Clock animation + placement celebration + progress bar
- [x] WordPredictor: Spring probability bars + brain pulse + streak flame
- [x] TokenChopper: Staggered token entrance + type colors + cost meter
- [x] NeuronRelay: Signal pulse flow + toggle animation + animated meter
- [x] FoolTheAi: Animated confidence bar + answer feedback + fooled counter
- [x] PredictionMarket: Animated voting bars + crowd visualization + accuracy counter
- [x] AiArtDetective: Zoom lens hover + animated slider
- [x] ApiExplorer: Send/receive animation + method badges + typewriter response
- [x] HumanVsMachine: Score bars + thinking indicators + verdict reveal
- **9 files modified, +721 lines | Wow factor: 3.2/5 → 3.8/5**

---

### Stage 7 Audit Fix — Full Resolution (2026-03-27)

**Status:** COMPLETE
**Branch:** claude/stage-7-audit-fixes-i4ZvH
**Build Status:** All CRITICAL + HIGH findings resolved, 3/4 WARN resolved, 1 WARN deferred

**Batch 1 — S7-CRIT-001: D3D-B1 Canvas Refactor (commit 26982ce):**
- [x] Removed standalone `<Canvas>` from all 28 Stage 7 games
- [x] 19 Standard games: Canvas → sceneStore.setGameSceneContent()
- [x] 9 FL-Lite 3D components: Canvas/EffectComposer/Environment → clean `<group>` export
- [x] 9 FL-Lite game files: Added sceneStore integration
- [x] S7-HIGH-002: EmojiDecoder + AiOrNot 3D components imported and registered
- **37 files modified**

**Batch 2 — S7-HIGH-004 + S7-WARN-004 (commit 47aca47):**
- [x] Age band enforcement in game router (API Explorer band C + all restricted games)
- [x] Canvas3DErrorBoundary + Suspense around game content in SceneRouter
- **2 files modified**

**Batch 3 — S7-HIGH-003 + S7-WARN-001 (commit 0e0d025):**
- [x] Complete phases verified/added for all 29 Stage 7 games
- [x] Unique educational "What You Learned" summaries per game
- [x] Learn phases verified present across all games
- **24 files modified**

**Batch 4 — S7-WARN-003: ARIA Labels:**
- [x] ARIA coverage improved on CameraQuest, RobotVacuum, CodeBlocks, NeuronRelay, TreatTrainer, SentimentScanner

**Deferred:**
- [ ] S7-WARN-002 — 9 FL-Lite environment files orphaned (intended for future SceneRouter wiring)

**Stage 7 Audit Summary — All Findings:**
| ID | Severity | Status |
|---|---|---|
| S7-CRIT-001 | CRITICAL | Resolved (Batch 1) |
| S7-HIGH-001 | HIGH | Already resolved (GameShell) |
| S7-HIGH-002 | HIGH | Resolved (Batch 1) |
| S7-HIGH-003 | HIGH | Resolved (Batch 3) |
| S7-HIGH-004 | HIGH | Resolved (Batch 2) |
| S7-WARN-001 | WARNING | Resolved (Batch 3) |
| S7-WARN-002 | WARNING | Deferred (future SceneRouter) |
| S7-WARN-003 | WARNING | Resolved (Batch 4) |
| S7-WARN-004 | WARNING | Resolved (Batch 2) |
| S7-INFO-001 | INFO | Acknowledged |
| S7-INFO-002 | INFO | Acknowledged |

---

### Stage 5 Audit Fix — Full Resolution (2026-03-27)

**Status:** COMPLETE
**Branch:** claude/fix-stage-5-audit-issues-xgt8j
**Build Status:** All 16 findings resolved + 4 3D embedding enhancements

**Batch 1 — Critical Fixes (commit cf7cd6b):**
- [x] S5-CRIT-001 — Profile page enhanced (215→689 lines): calculateLevel(), avatar shapes, trophy room, streak flames, daily challenge, editable name, cockpitBroadcast
- [x] S5-CRIT-002 — Wired useCompleteAndReward into GameShell — all 35 games auto-award XP/badges/streaks
- [x] S5-HIGH-006 — Mounted XPPopupProvider in GameShell

**Batch 2 — High Fixes (commit a2fda4e):**
- [x] S5-HIGH-001 — Created 4 UI + 3 3D gamification components (BadgeDisplay, BadgeGrid, LevelProgress, TrophyRoom, XPVortex, BadgePedestal3D, LevelUpExplosion)
- [x] S5-HIGH-002 — Added streak/confetti celebration types to CelebrationOverlay
- [x] S5-HIGH-003 — XP toast auto-dismiss (3s)
- [x] S5-HIGH-004 — reduceMotion support in all gamification components
- [x] S5-HIGH-005 — Full ARIA labels (dialog, aria-modal, aria-live, aria-hidden)
- [x] S5-HIGH-007 — CeremonyFX wired into CockpitCanvas via CeremonyFXBridge + ceremonyMapping

**Batch 3 — Warning Fixes (commit 1354d1f):**
- [x] S5-WARN-001 — CelebrationType→CeremonyFX mapping (ceremonyMapping.ts)
- [x] S5-WARN-002 — Confetti rAF unmount guard (isMounted ref)
- [x] S5-WARN-003 — Already resolved (S2-HIGH-002 typed interface)
- [x] S5-WARN-005 — LOD comment updated in CeremonyFX

**Batch 4 — Info/Cleanup (commit fb02db2):**
- [x] S5-INFO-001 — gamification/ barrel export index.ts, removed .gitkeep

**3D Embedding Enhancements (commit 2801de2):**
- [x] Enhancement A — Profile page broadcasts to cockpitBroadcastStore (page-navigate, badge-earn, button-press)
- [x] Enhancement B — TrophyRoom 3D showcase for rare/epic/legendary badges + BadgePedestalBridge
- [x] Enhancement C — AvatarPreview3D (136 lines, 6 shapes, morph animation, idle rotation, letter overlay)
- [x] Enhancement D — useGamification hooks broadcast xp-change, level-up, badge-earn, streak-update to cockpit

**Files Created (12):**
- `src/components/gamification/BadgeDisplay.tsx`, `BadgeGrid.tsx`, `LevelProgress.tsx`, `TrophyRoom.tsx`, `index.ts`
- `src/components/3d/XPVortex.tsx`, `BadgePedestal3D.tsx`, `LevelUpExplosion.tsx`, `AvatarPreview3D.tsx`, `BadgePedestalBridge.tsx`, `CeremonyFXBridge.tsx`
- `src/lib/ceremonyMapping.ts`

**Files Modified (6):**
- `src/app/(dashboard)/profile/page.tsx` — Full enhancement
- `src/components/game/GameShell.tsx` — Gamification pipeline + XPPopupProvider
- `src/components/shared/CelebrationOverlay.tsx` — All 5 types, ARIA, reduceMotion
- `src/hooks/useGamification.ts` — cockpitBroadcast integration
- `src/components/3d/CeremonyFX.tsx` — LOD comment fix
- `src/components/3d/CockpitCanvas.tsx` — CeremonyFXBridge added

**Stage 5 Audit Summary — All Findings:**
| ID | Severity | Status |
|---|---|---|
| S5-CRIT-001 | CRITICAL | Resolved (Batch 1) |
| S5-CRIT-002 | CRITICAL | Resolved (Batch 1) |
| S5-HIGH-001 | HIGH | Resolved (Batch 2) |
| S5-HIGH-002 | HIGH | Resolved (Batch 2) |
| S5-HIGH-003 | HIGH | Resolved (Batch 2) |
| S5-HIGH-004 | HIGH | Resolved (Batch 2) |
| S5-HIGH-005 | HIGH | Resolved (Batch 2) |
| S5-HIGH-006 | HIGH | Resolved (Batch 1) |
| S5-HIGH-007 | HIGH | Resolved (Batch 2) |
| S5-WARN-001 | WARNING | Resolved (Batch 2/3) |
| S5-WARN-002 | WARNING | Resolved (Batch 2) |
| S5-WARN-003 | WARNING | Already resolved (S2-HIGH-002) |
| S5-WARN-004 | WARNING | Acknowledged (naming only, no code change) |
| S5-WARN-005 | WARNING | Resolved (Batch 3) |
| S5-INFO-001 | INFO | Resolved (Batch 4) |
| S5-INFO-002 | INFO | Confirmed working (no action needed) |

---

### Stage 4 — Batch 1: Audit Fixes / Code Cleanup (2026-03-27)

**Status:** COMPLETE
**Branch:** claude/fix-stage-1-audit-1dW5W

**Findings Addressed:**
- [x] S4-HIGH-001 — Already resolved (useApi.ts deleted in prior batch)
- [x] S4-HIGH-003 + S4-WARN-001 — Refactored 4 hooks to use centralized `apiFetch` from `src/lib/api.ts`
- [x] S4-WARN-005 — Fixed `as string` assertion in content/[slug]/page.tsx

**Files Modified (5):**
- `src/hooks/useProgress.ts` — Removed local apiFetch, import from @/lib/api
- `src/hooks/useContent.ts` — Removed local apiFetch, import from @/lib/api
- `src/hooks/useChildren.ts` — Removed local apiFetch, import from @/lib/api
- `src/hooks/useGamification.ts` — Removed local apiFetch, import from @/lib/api
- `src/app/(dashboard)/content/[slug]/page.tsx` — Safe Array.isArray check for params.slug

---

### Stage 4 — Batch 2: Camera Repositioning + Materials Upgrade (2026-03-27)

**Status:** COMPLETE
**Branch:** claude/fix-stage-1-audit-1dW5W

**Changes:**
- [x] Camera repositioned: `[0, 6.5, 7]` → `[0, 0.65, 1.1]` (cockpit seat, not overhead)
- [x] COCKPIT_GEOMETRY v3: arc 140° → 218°, radius 4.0 → 4.8, segments 256→288/128→144
- [x] ADAPTIVE_CURVATURE: ultraWide 155°→230°, desktop 140°→218°
- [x] CAMERA_PRESETS: all modes updated for tight-focus + added 'settings' mode
- [x] SPATIAL_CAMERA_PRESETS: all views tight-focus + added CONSOLE_CAMERA_PRESETS (left/right)
- [x] Created `src/lib/3d/cockpitMaterials.ts` — 7 material factories per vision JSON
- [x] Added explicit 3D positions: leftConsole, rightConsole, statusBar, centerViewport, HUD

**Files Created (1):**
- `src/lib/3d/cockpitMaterials.ts` — Material factory (alloy, panel, holographic, button, bezel, console, LED)

**Files Modified (4):**
- `src/lib/3d/cockpitConfig.ts` — COCKPIT_GEOMETRY v3, CAMERA_PRESETS, ADAPTIVE_CURVATURE
- `src/stores/cockpitStore.ts` — SPATIAL_CAMERA_PRESETS tight-focus + CONSOLE_CAMERA_PRESETS
- `src/components/3d/CockpitCanvas.tsx` — Initial camera position [0, 0.65, 1.1]
- `src/components/3d/CameraSystem.tsx` — Updated handoff comment

---

### Stage 4 — Batch 3: Full Geometry + Material Overhaul (2026-03-27)

**Status:** COMPLETE
**Branch:** claude/fix-stage-1-audit-1dW5W

**Changes:**
- [x] CockpitPanels.tsx: v3 header, imports cockpitMaterials, 12 ribs (was 8), 768 rivets (was 512)
- [x] LEDRim.tsx: v3 header, 1500 ultra LEDs (was 1000), emissive 3.0 (was ~0.3), imports cockpitMaterials
- [x] SidePanels.tsx: Positions [-2.35, 0.25, -1.65] (was [-5.5, 0, -2]), chrome #a8b5c8 (was #2a2e3e), metalness 0.98 (was 0.92), reads positions from COCKPIT_GEOMETRY
- [x] StatusBar3D.tsx: v3 1M budget header, chrome #a8b5c8 metalness 0.98 roughness 0.12

**Files Modified (4):**
- `src/components/3d/CockpitPanels.tsx`
- `src/components/3d/LEDRim.tsx`
- `src/components/3d/SidePanels.tsx`
- `src/components/3d/StatusBar3D.tsx`

---

### Stage 3 Audit Fix — Batch 10: Security + COPPA + 3D Integration (2026-03-26)

**Status:** COMPLETE
**Branch:** claude/fix-stage-1-audit-1dW5W

**Findings Addressed:**
- [x] S3-CRIT-001 — Added `/reset-password` to middleware public paths
- [x] S3-HIGH-001 — COPPA (Option B): Created `/api/auth/consent` endpoint, signup no longer sends consent prematurely
- [x] S3-HIGH-002 — Demo users: `sparkforge-demo-active` httpOnly cookie + middleware check
- [x] S3-WARN-001 — Auth layout `dpr={[1, 3]}` replaces inline `window.devicePixelRatio`
- [x] S3-WARN-002 — `AuthHoverContext` wires login card hover to `LoginPortal3D.isHovered`
- [x] S3-WARN-003 — Downgraded to INFO (no wrong path in docs)
- [x] 3D Integration Audit — 4 findings deferred to Stage 4 (setLabColor, Settings page, WormholeTransition, auth canvas)

**Files Created (2):**
- `src/app/api/auth/consent/route.ts` — COPPA consent endpoint
- (context in auth layout — inline, not separate file)

**Files Modified (7):**
- `src/middleware.ts` — `/reset-password` + demo cookie check
- `src/app/api/auth/demo/route.ts` — Sets `sparkforge-demo-active` cookie
- `src/app/api/auth/signup/route.ts` — Removed `coppaConsent`, sets `coppa_consent_at: null`
- `src/lib/validations.ts` — `SignupSchema` no longer requires `coppaConsent`, added `CoppaConsentSchema`
- `src/app/(auth)/signup/page.tsx` — Step 1 no coppaConsent, Step 3 calls `/api/auth/consent`
- `src/app/(auth)/layout.tsx` — `AuthHoverContext`, `isHovered` prop, `dpr={[1, 3]}`
- `src/app/(auth)/login/page.tsx` — Uses `useAuthHover()` context

---

### Stage 2 Audit Fix — Batch 9: Security + Type Safety + Config (2026-03-26)

**Status:** COMPLETE
**Branch:** claude/fix-stage-1-audit-1dW5W
**Build Status:** Code changes — 5 source files modified

**Findings Addressed:**
- [x] S2-HIGH-001 — Added `verifyChildOwnership` to session end action (security: prevents session UUID enumeration)
- [x] S2-HIGH-002 — Defined `ProgressWithContent` type in badges route, removed 3x `as any`, 3 eslint-disable, 4 non-null assertions
- [x] S2-WARN-001 — Aligned Stripe env vars to `.env.example` names (`STRIPE_PLUS_MONTHLY_ID` format) in `tier-config.ts` + Stage 8 doc
- [x] S2-WARN-002 — Used `Anthropic.TextBlock` type guard + `catch (error: unknown)` in prompt-lab route
- [x] S2-WARN-003 — Replaced raw `req.json()` with `parseBody` + `z.discriminatedUnion` schema in sessions route
- [ ] S2-INFO-001 — Deferred (timezone validated but discarded — cosmetic)
- [ ] S2-INFO-002 — Deferred (all-labs childId not Zod-validated — cosmetic)

**Files Modified (5 source + 2 docs):**
- `src/app/api/sessions/route.ts` — Full rewrite: parseBody + discriminated union + ownership check
- `src/app/api/gamification/badges/route.ts` — ProgressWithContent type, no more as any or !
- `src/app/api/ai/prompt-lab/route.ts` — TextBlock type guard, catch error:unknown
- `src/lib/tier-config.ts` — Stripe env var names aligned to .env.example
- `docs/stage8-parent-dashboard/STAGE8_P3_v3FINAL_B.md` — Stripe env var names aligned
- `AUDIT_REPORT_3-25-2026.md` — All S2 findings marked resolved, remediation log updated
- `PROGRESS.md` — Batch 9 entry added

---

### Stage 1 Audit Fix — Batch A: Verification & Downgrade (2026-03-26)

**Status:** COMPLETE
**Branch:** claude/fix-stage-1-audit-1dW5W
**Build Status:** No code changes — verification only

**Findings Addressed:**
- [x] S1-HIGH-002 — Downgraded to INFO: `useMediaQuery`/`useIsMobile` have zero active imports. Both removed per D3D-1. Comment-only references in 3 files.
- [x] S1-INFO-002 — Verified NOT dead code: `gameActive`/`setGameActive` still actively consumed by `useStationMode.ts` for mode derivation. Deferred to future `sceneStore` migration refactor.

**Files Modified (2 — documentation only):**
- `AUDIT_REPORT_3-25-2026.md` — Updated S1-HIGH-002 (downgraded), S1-INFO-002 (deferred), finding counts, Batch 7 remediation log
- `PROGRESS.md` — Added Batch A entry

---

### Stage 1 Audit Fix — Batch B: Stage Doc Updates (2026-03-26)

**Status:** COMPLETE
**Branch:** claude/fix-stage-1-audit-1dW5W
**Build Status:** Doc-only changes — no source code modified

**Findings Addressed:**
- [x] S1-WARN-003 — Fixed `COCKPIT_GEOMETRY_V2` → `COCKPIT_GEOMETRY` in stage doc (7 occurrences). Aligned segment counts to 20M upgrade. Added structural detail constants + missing bloom presets.
- [x] S1-WARN-004 — Replaced entire deviceStore Step 20a with D3D-1 desktop-ultra implementation. Updated hooks Step 21: marked useMediaQuery/useIsMobile as REMOVED. Updated file inventory.

**Files Modified (3):**
- `docs/stage1-foundation/STAGE1_Foundation_v2_PART2.md` — Steps 20a, 20c, 21, file inventory table
- `AUDIT_REPORT_3-25-2026.md` — S1-WARN-003 resolved, S1-WARN-004 resolved, finding counts final, Batch 8 remediation log
- `PROGRESS.md` — Added Batch B entry, status updated to COMPLETE

**Stage 1 Audit Summary — All Findings:**
| ID | Severity | Status |
|---|---|---|
| S1-CRIT-001 | CRITICAL | Resolved (Batch 6) |
| S1-HIGH-001 | HIGH | Resolved (Batch 1) |
| S1-HIGH-002 | HIGH→INFO | Downgraded (Batch 7) — no active imports |
| S1-WARN-001 | WARNING | Resolved (Batch 6) |
| S1-WARN-002 | WARNING | Resolved (Batch 6) |
| S1-WARN-003 | WARNING | Resolved (Batch 8) — stage doc updated |
| S1-WARN-004 | WARNING | Resolved (Batch 8) — stage doc updated |
| S1-INFO-001 | INFO | Expected — authStore expanded by Phase 5E |
| S1-INFO-002 | INFO | Deferred — gameActive still consumed by useStationMode |
| S1-INFO-003 | INFO | Expected — layout is Stage 10 version |
| S1-INFO-004 | INFO | Low impact — barrel files with optimizePackageImports |

---

### Phase 0 Audit Fix — Batch 2: TypeScript & ESLint Fixes (2026-03-26)

**Status:** COMPLETE
**Branch:** claude/fix-phase-0-issues-vvp0t
**Build Status:** PASS (npm run build succeeds, tsc --noEmit 0 errors)

**Findings Addressed:**
- [x] HIGH-001 — 63 genuine TypeScript errors fixed (was 229 pre-install, resolved to 63 post-install, now 0)
- [x] HIGH-005 — DemoGuard children prop (resolved by npm install restoring type definitions)
- [x] ESLint build errors — all unused imports removed from 17 component files
- [x] TSL shader eslint-disable — 19 shader files get legitimate `no-explicit-any` + `no-unused-vars` disables

**TypeScript Fixes (23 files):**
- Creature components (4 files): Fixed CreatureProps import path, added MoodConfig properties, added THREE namespace import
- TSL shader files (19 files): Fixed Node<> type mismatches with `as any` assertions, fixed `atan2` → `atan` import, fixed swizzle parameter types

**ESLint Fixes (17 files):**
- Removed unused imports: `useMemo`, `useFrame`, `Environment`, `MathUtils`, `Color`, `MeshStandardMaterial`, `vec2`, `vec4`, etc.
- Removed unused variables: `bars`, `cellSize`, `colWidth`, `dp`, `uvCoord`, `flameUV`, etc.
- Prefixed unused callback params with `_` where needed

**Results:**
- TypeScript errors: 63 → **0** (100% clean)
- Next.js build: **PASS** (compiled + 42 static pages generated)
- Total files modified: 40 (23 TS fixes + 17 ESLint fixes)

---

### Phase 0 Audit Fix — Batch 1: Environment & Dependencies (2026-03-26)

**Status:** COMPLETE
**Branch:** claude/fix-phase-0-issues-vvp0t
**Audit Source:** AUDIT_REPORT_3-25-2026.md

**Findings Addressed:**
- [x] CRIT-001 — `npm install` (with `--legacy-peer-deps` for nivo/React 19 conflict)
- [x] S1-HIGH-001 — Installed missing `three-mesh-bvh` and `troika-three-text`
- [x] CRIT-003 — Test infrastructure: vitest, @vitest/coverage-v8, @testing-library/react, @testing-library/jest-dom, jsdom, msw, @playwright/test, @types/node
- [x] HIGH-003 — vitest.config.ts now resolves `vitest/config`
- [x] HIGH-004 — tests/setup.ts `global` resolves with @types/node

**Files Created (6):**
- `playwright.config.ts` — Playwright E2E config (chromium, localhost:3000)
- `src/mocks/handlers.ts` — MSW mock handlers for all 24 API routes
- `src/mocks/server.ts` — MSW server setup for Vitest (Node)
- `src/mocks/browser.ts` — MSW worker setup for browser tests
- `tests/e2e/health.spec.ts` — Basic E2E test stub (health check)
- `tests/unit/` and `tests/integration/` directories created

**Files Modified (1):**
- `docs/stage10-polish-deploy/STAGE10_Polish_Deploy_v2_PART2.md` — Added DEFERRED section for production rate limiter (WARN-003: Upstash Redis)

**Results After Batch 1:**
- TypeScript errors: 15,378 → **63** (99.6% reduction)
- Vitest: runnable (no test files yet)
- Playwright: configured
- MSW: 24 API route handlers ready
- Build: reaches lint/type-check phase (fails on pre-existing code errors — Batch 2 scope)

**Deferred:**
- WARN-003 (Redis rate limiter) — reference added to Stage 10 doc, requires Upstash credentials

---

### Creature Species + HDRI Asset Creation (2026-03-25)

**Status:** COMPLETE
**Branch:** claude/audit-report-r3f-review-XQQ1z

**HDRI Generation:**
- [x] Created Node.js HDRI generator (tools/generate-frost-prismatic-hdri.js)
- [x] Generated frost-prismatic.hdr (1024x512, Radiance RGBE, 2MB)
  - Dark studio (#0a0a14) + Blue key (#3B82F6) + Purple fill (#8B5CF6) + Teal rim (#06B6D4)
- [x] CockpitCanvas switched from drei 'night' preset to custom HDRI

**5 Creature Species (replacing 6 generic pets):**
- [x] creatureConfig.ts — Species configs, mood system, 6 evolution stages each
- [x] CreatureBase.tsx — Shared toon shading, CreatureWrapper, BlinkingEye, InnerGlow
- [x] BytelingCreature.tsx — Data & Binary theme (cubic shapes, blue #00BBFF)
- [x] SparkpawCreature.tsx — Neural Networks theme (spheres/tentacles, purple #AA66FF)
- [x] VoltkitCreature.tsx — Energy & Computing theme (triangles/spikes, green #00FF88)
- [x] CogsworthCreature.tsx — Robotics & Building theme (cylinders/gears, amber #FFAA44)
- [x] PixieCreature.tsx — Computer Vision theme (discs/lenses, cyan #06B6D4)

**Integration:**
- [x] PetCreature3D.tsx — Rewrote to use species dispatcher (no more GLB probing)
- [x] Pet3DScene.tsx — Added speciesId prop
- [x] PetTrainerGame.tsx — Replaced 6 generic pets with 5 AI-themed species
- [x] creatures/index.ts — Barrel export + CREATURE_COMPONENTS lookup map

**Files Created (10):**
- `tools/generate-frost-prismatic-hdri.js`
- `public/hdri/frost-prismatic.hdr`
- `src/config/creatureConfig.ts`
- `src/components/3d/creatures/CreatureBase.tsx`
- `src/components/3d/creatures/BytelingCreature.tsx`
- `src/components/3d/creatures/SparkpawCreature.tsx`
- `src/components/3d/creatures/VoltkitCreature.tsx`
- `src/components/3d/creatures/CogsworthCreature.tsx`
- `src/components/3d/creatures/PixieCreature.tsx`
- `src/components/3d/creatures/index.ts`

**Files Modified (3):**
- `src/components/3d/PetCreature3D.tsx` — Species-aware renderer
- `src/components/3d/Pet3DScene.tsx` — Added speciesId prop
- `src/components/games/PetTrainerGame.tsx` — 5 new species configs

**Species Summary:**
| Species | Theme | Shape | Color | Stages |
|---------|-------|-------|-------|--------|
| Byteling | Data & Binary | Cubic | #00BBFF | Data Seed → Bitlet → Bytepup → Datacrunch → Codec → Terabyte |
| Sparkpaw | Neural Networks | Spherical | #AA66FF | Synapse Egg → Noodlet → Synapper → Neurowhelp → Dendrite → Cortex |
| Voltkit | Energy & Computing | Triangular | #00FF88 | Spark Cell → Zaplet → Voltpup → Ampere → Gigawatt → Exaflare |
| Cogsworth | Robotics & Building | Cylindrical | #FFAA44 | Gear Capsule → Sprocket → Ratchet → Dynamo → Fabricator → Archimedes |
| Pixie | Computer Vision | Disc/Lens | #06B6D4 | Lens Seed → Peekaboo → Scanner → Focusfly → Spectra → Omniscient |

---

### Audit Report — R3F Section 4: Stack Alignment & Pitfalls (2026-03-25)

**Status:** COMPLETE
**Branch:** claude/audit-report-r3f-review-XQQ1z

**Plan A — TSL Shader Ports (9 GLSL → TSL):**
- [x] Batch 1: Noise utilities — simplex3DTSL, fbm4/6TSL, fbm3_4/6TSL, curlNoiseTSL, perlinNoise2DTSL, hash2TSL
- [x] Batch 2: auroraTSL, scanlineTSL, holographicTSL
- [x] Batch 3: energyFieldTSL (vertex + fragment), liquidMetalTSL (vertex + fragment), fireNoiseTSL (vertex + fragment)
- [x] Batch 4: crystallineLogoTSL (vertex + PBR fragment), electricVeinsTSL (fractal veins + propagation)
- [x] Batch 5: Barrel export index (src/shaders/tsl/index.ts) + WebGPUErrorBoundary component

**Plan B1 — Frame-Time Monitoring (Non-Invasive):**
- [x] Created useFrameTimeMonitor hook — 60-frame sample window, logs warnings > 20ms avg
- [x] Added FrameTimeMonitorInner component to CockpitCanvas (dev-only)
- [x] Added Plan B2 adaptive degradation reference to CLAUDE.md Section 9.1

**Plan C — Asset Preloading:**
- [x] Created src/lib/3d/preloadAssets.ts — wires GLTF_PRELOAD_PATHS + HDRI preloading
- [x] Module-level import in CockpitCanvas triggers preloading on first render
- [x] Note: HDRI file (/public/hdri/frost-prismatic.hdr) pending creation — uses 'night' preset fallback

**Files Created (14):**
- `src/shaders/tsl/noiseUtils.ts` — Shared TSL noise functions (simplex3D, fbm, curl, perlin)
- `src/shaders/tsl/auroraTSL.ts` — Aurora void background (Decision 2.5)
- `src/shaders/tsl/scanlineTSL.ts` — CRT scanline overlay (Decision 2.3)
- `src/shaders/tsl/holographicTSL.ts` — Holographic card diffraction (Decision 4.3)
- `src/shaders/tsl/energyFieldTSL.ts` — Streak shield vertex + fragment (Decision 4.5)
- `src/shaders/tsl/liquidMetalTSL.ts` — Badge levitate vertex + fragment (Decision 4.2)
- `src/shaders/tsl/fireNoiseTSL.ts` — Diamond streak flame vertex + fragment
- `src/shaders/tsl/crystallineLogoTSL.ts` — Hero Animation Phase 2 vertex + PBR fragment
- `src/shaders/tsl/electricVeinsTSL.ts` — Hero Animation Phase 4 fractal veins
- `src/shaders/tsl/index.ts` — Barrel export for all TSL shader ports
- `src/components/3d/WebGPUErrorBoundary.tsx` — TSL compilation error boundary with WebGL2 fallback
- `src/hooks/useFrameTimeMonitor.ts` — Non-invasive frame-time monitoring (dev-only)
- `src/lib/3d/preloadAssets.ts` — Centralized GLTF + HDRI preloading

**Files Modified (2):**
- `src/components/3d/CockpitCanvas.tsx` — Added FrameTimeMonitorInner + asset preload import
- `CLAUDE.md` — Added Plan B1/B2 performance monitoring reference to Section 9.1

**TypeScript validation:** PASS (0 new errors; pre-existing module resolution errors from missing node_modules unchanged)

**Audit Section 4 Item Status:**
| Item | Status | Notes |
|------|--------|-------|
| 4.1 r3f-perf monitoring | ALREADY FIXED (prior audit) | r3f-perf installed, lazy-loaded, dev-only |
| 4.2 GLSL → TSL migration | FIXED | 9 shaders ported + error boundary |
| 4.3 CanvasTexture leaks | ALREADY FIXED (prior audit) | All 3 files have disposal |
| 4.4 GPU tier degradation | FIXED (B1) | Frame-time monitor + B2 reference |
| 4.5 Asset preloading | FIXED | preloadAssets.ts wired in CockpitCanvas |
| 4.6 leva in prod deps | ALREADY FIXED (prior audit) | Moved to devDependencies |

---

### Audit Report — R3F Section 3: Post-Processing & UI Zones (2026-03-25)

**Status:** COMPLETE
**Branch:** claude/audit-r3f-postprocessing-l178F

**Batch 1 — GPU Memory + Dev Monitoring:**
- [x] Item 1: AiSpyGame.tsx — Removed independent Canvas (D3D-B1 violation). Game 3D content now injected via sceneStore.setGameSceneContent(). Added gameSceneContent state to sceneStore.ts. CockpitCanvas reads from store as fallback.
- [x] Item 2: CanvasTexture disposal — AgentPipeline3D.tsx, LabStructure3D.tsx already had disposal (prior audit). Added missing disposal to PetCreature3D.tsx FallbackOrb + GLBPetModel components.
- [x] Item 3: r3f-perf — Already installed (^7.2.3) and integrated in CockpitCanvas with React.lazy + dev-only guard. No changes needed.

**Batch 2 — Post-Processing Enhancements + Html Overlays:**
- [x] Item 4: Adaptive bloom threshold — PostProcessingStack.tsx bloom threshold now shifts per scene (0.3 celebrations, 0.4 transitions/hero, 0.5 spatial, 0.8 gameplay, 0.6 cockpit default)
- [x] Item 5: Per-lab color grading — Added HueSaturation + BrightnessContrast effects. 10 per-lab color profiles (hue, saturation, brightness, contrast). Ceremony warm amber override. Vignette + BarrelDistortion now scene-reactive. Effect count: 7 → 9 always-on.
- [x] Item 6: drei Html 3D-anchored overlays:
  - HolographicLabMap.tsx: Lab name + completion % tooltip on hover (glassmorphism card, lab-colored border)
  - AmbientNPCs.tsx: Personality name badges above bots (pill badge, neon text)
  - CeremonyFX.tsx: Animated ceremony title popup ("Level Up!", "Badge Earned!", etc.) with float-up-and-fade CSS animation
  - WormholeTransition.tsx: "Entering {Lab Name}" label at tunnel midpoint with fade-in/out gated to transition progress

**Files Modified (10 total):**
- `src/components/3d/PostProcessingStack.tsx` — 9 effects, adaptive bloom, color grading, reactive vignette/barrel
- `src/components/3d/CockpitCanvas.tsx` — r3f-perf + gameSceneContent from store
- `src/components/3d/HolographicLabMap.tsx` — Html tooltip overlay
- `src/components/3d/AmbientNPCs.tsx` — Html name badges
- `src/components/3d/CeremonyFX.tsx` — Html ceremony popup
- `src/components/3d/WormholeTransition.tsx` — Html "Entering Lab" label
- `src/components/3d/AgentPipeline3D.tsx` — CanvasTexture disposal
- `src/components/3d/LabStructure3D.tsx` — CanvasTexture disposal
- `src/components/3d/PetCreature3D.tsx` — DataTexture disposal (2 components)
- `src/components/games/AiSpyGame.tsx` — Removed Canvas, uses sceneStore
- `src/stores/sceneStore.ts` — Added gameSceneContent state + selector
- `package.json` — r3f-perf devDependency

**TypeScript validation:** PASS (0 new errors; 14 pre-existing TSL shader type errors unchanged)

---

### Audit Report — Suggestions (2026-03-25)

**Status:** COMPLETE
**Branch:** claude/audit-report-suggestions-oEzxB

**Batch 1 — Canvas DPR + React.memo:**
- [x] Suggestion #12: CockpitCanvas.tsx — Simplified dpr to [1, 3], letting AdaptiveDpr manage runtime values
- [x] Suggestion #13: SKIPPED — frameloop="always" is intentional per D3D-5 mandate (ambient cockpit animations)
- [x] Suggestion #14: Wrapped SpatialDashboardContent, AmbientNPCs, DynamicEnvironment with React.memo

**Batch 2 — Design System Hex Replacement:**
- [x] Suggestion #15: Replaced hardcoded hex values with Tailwind semantic tokens in 3 files:
  - ParentLoadingSkeleton.tsx: bg-[#111118]/80 → bg-surface-card/80 (4 instances)
  - UpgradePrompt.tsx: 7 hex replacements (surface-card, neon-orange, neon-amber tokens)
  - FutureForgeGame.tsx: bg-surface-base, text-lab-10, via-lab-10, text-neon-amber tokens
  - PaywallModal.tsx: SVG stroke="#FFAA44" left as-is (SVG attribute, no Tailwind equivalent)

**Batch 3 — Layout Fix + GLTF Preload:**
- [x] Suggestion #16: Fixed DemoGuard JSX indentation in dashboard layout (logic was correct, formatting misleading)
- [x] Suggestion #17: Added GLTF_PRELOAD_PATHS registry in lib/3d/materials.ts with documented usage pattern

**TypeScript validation:** PASS (0 new errors; pre-existing module resolution errors from missing node_modules unchanged)

---

### Audit Report — Critical Findings (2026-03-24)

**Status:** COMPLETE
**Branch:** claude/audit-critical-findings-xu1H3

**Batch 1 — GPU Memory/Allocation Fixes:**
- [x] Critical #1: SidePanels.tsx — Shared blip geometry + material, dynamic props in useFrame
- [x] Critical #2: HolographicLabMap.tsx — Added useEffect disposal for ConnectionBeam geometry/material
- [x] Critical #3: PostProcessingStack.tsx — useRef for chromatic Vector2 instead of useMemo

**Batch 2 — Store Subscription Optimization:**
- [x] Critical #4a: CockpitCanvas.tsx — 10 individual selectors replacing full destructure
- [x] Critical #4b: useSpatialNavigation.ts — 7 individual selectors
- [x] Critical #4c: SpatialOverlay.tsx — 3 individual selectors

**TypeScript validation:** PASS (0 new errors; 14 pre-existing TSL shader type errors unchanged)

### Audit Report — Important Findings (2026-03-24)

**Status:** MOSTLY COMPLETE (2 deferred to dedicated PRs)
**Branch:** claude/audit-critical-findings-xu1H3

**Batch 3+4 — Quick Wins + Performance:**
- [x] Important #6: StatusBar3D.tsx — Rewrote material factories to use ref + useFrame
- [x] Important #7: CockpitPanels.tsx — Immediate geometry disposal via ref on dependency change
- [x] Important #9: package.json — Moved leva to devDependencies
- [x] Important #12: QueryProvider.tsx — Wrapped ReactQueryDevtools in NODE_ENV guard

**Batch 5 — Dependency Cleanup + Design System:**
- [x] Important #8: Removed recharts, replaced with @nivo/line in NeuralBuilderGame.tsx (~200KB savings)
- [x] Important #10: Added DURATION/EASING/TRANSITION presets to existing animations.ts

**Deferred to Dedicated PRs:**
- [ ] Important #5: `import * as THREE` → named imports (103 files, large-scope refactor)
- [ ] Important #11: Sub-scale font sizes text-[9px]/text-[10px] → text-xs (306 occurrences, 53 files)
- [ ] Important #13: Duplicate particle system extraction (architectural refactor, 3 files)

**TypeScript validation:** PASS (0 new errors)

---

### Local Development Environment Setup (March 21, 2026)

**Status:** NOT YET COMPLETED
**Branch:** claude/sparkforge-stage1-foundation-LBQEo

**Environment:**
- Node.js v25.8.1, npm 11.11.0
- `npm install --legacy-peer-deps` — all dependencies installed
- `.env.local` — created with placeholder values (keys not yet configured)
- `npm run build` — compiles successfully (lint cleanup in progress)

**Note:** All prior code in this repo was written directly on GitHub (not built or tested locally). Local development begins now from Stage 1 Phase 1. The project is at **0% built/developed** — no stages have been locally validated or run. During Build, Claude Code shall strictly clone repo locally, then begin auditing/implementing code starting with stage 1. Code should not be re-written, it should just be audited, and fixed if errors occur. 
**Note:** During stage by stage development it is critical to continuously scan local repo/ file database for any and all applicable code/ critical documentation when developing stage by stage, starting with stage 1.
---

### Build Execution Plan (30 Phases)

- [ ] Phase 1 — Stage 1 Part 1: Foundation config & structure (verified + fixed 2026-03-22)
- [ ] Phase 2 — Stage 1 Part 2: TypeScript source files (verified + fixed 2026-03-22)
- [ ] Phase 3 — Stage 2 Parts 1-4: Database & API (HS-1, HS-7)
- [ ] Phase 4 — Stage 3 Parts 1-2: Auth & Layout
- [ ] Phase 5 — Stage 3 Part 3: Station Frame (v3-FINAL)
- [ ] Phase 5A — Hero Animation Part 1: Stores, infrastructure, shaders
- [ ] Phase 5B — Hero Animation Part 2: Particles, audio, orchestrator (HS-5)
- [ ] Phase 5C — Cockpit Architecture Part 1: Canvas, camera, panels
- [ ] Phase 5D — Cockpit Architecture Part 2: Spatial dashboard, transitions (HS-5, HS-9)
- [ ] Phase 6 — Stage 4 Parts 1+3: Core pages
- [ ] Phase 7 — Stage 4 Part 2: v3-FINAL
- [ ] Phase 8 — Stage 5 Part 1: Gamification & profile
- [ ] Phase 9 — Stage 5 Parts 2-3: v3-FINAL
- [ ] Phase 10 — Stage 6B: Flagship game (HS-8)
- [ ] Phase 11 — Stage 6C: Flagship game
- [ ] Phase 12 — Stage 6D: Flagship game
- [ ] Phase 13 — Stage 6E: Flagship game
- [ ] Phase 14 — Stage 6F: Flagship game
- [ ] Phase 15 — Stage 7A: 9 games
- [ ] Phase 16 — Stage 7B: 4 games
- [ ] Phase 17 — Stage 7C: 4 games (v2)
- [ ] Phase 18 — Stage 7C: 2 games (v3)
- [ ] Phase 19 — Stage 7D: 5 games
- [ ] Phase 20 — Stage 7E: 3 games
- [ ] Phase 21 — Stage 7F: 3 games
- [ ] Phase 22 — Stage 7 Shared systems
- [ ] Phase 23 — Stage 8 Parts 1-2: Parent dashboard (HS-2)
- [ ] Phase 24 — Stage 8 Part 3: v3-FINAL
- [ ] Phase 25 — Stage 9 Parts 1-3: Content agent (HS-3)
- [ ] Phase 26 — Stage 10 Parts 1-2: Polish & deploy (HS-4)

---

### Completed
- 

### Current Issues
_(none)_

### Blocked On
_(none)_

### Discrepancies Log (March 22, 2026)

**Phase 1 fixes:**
- `next.config.js` → `next.config.ts`: Replaced Stage 10 production config with Stage 1 starter per build order. Added Sentry wrapper, GLSL loaders, Turbopack rules.
- `.gitignore`: Added missing test/Sentry entries (test-results/, playwright-report/, blob-report/, .sentryclirc).
- Created 8 missing directories: public/images, public/sounds/cockpit, public/fonts, public/models/pets, tests/unit, tests/integration, tests/e2e, tests/mocks.

**Phase 2 fixes:**
- `src/types/index.ts`: Added missing CPA v2.0 types (CockpitSkin, SpatialView, ConsoleType, CeremonyType, HUDDataMode, CameraTarget, HexClusterData).
- `src/lib/animations.ts`: Fixed import from `framer-motion` to `motion/react` per Enhancement 8.1.
- Created 5 missing files: `src/stores/cockpitAtoms.ts`, `src/lib/3d/webgpuDetect.ts`, `src/hooks/useAdaptiveCockpit.ts`, `vitest.config.ts`, `tests/setup.ts`.

### Desktop-First 3D Overhaul (D3D) — March 23, 2026

**Status:** PLAN COMPLETE (4 parts, 20 decision locks, 13 files)
**Branch:** `claude/3d-immersive-overhaul-plan-JyUZL`

| Part | Commit | Files | Decision Locks | Status |
|------|--------|-------|----------------|--------|
| A — Foundation Cleanup | `db18293` | 1 doc | D3D-1 through D3D-9 (9) | COMMITTED |
| B — Single Canvas & Iris | `93cd13e` | 4 src + 1 doc | D3D-B1 through D3D-B6 (6) | COMMITTED |
| C — Post-FX & Audio | `d923968` | 4 src + 1 doc | D3D-C1 through D3D-C5 (5) | COMMITTED |
| D — Doc Updates & Roadmap | `6d7dc6d` | 1 doc + CLAUDE.md v6.0 | 0 | Phase 4A COMMITTED, 4B COMMITTED |

**Source files created (8):**
- `src/stores/sceneStore.ts` — Centralized scene management
- `src/components/3d/SceneRouter.tsx` — Scene group visibility controller
- `src/components/3d/MechanicalIris.tsx` — Signature iris transition (530 lines)
- `src/hooks/useIrisTransition.ts` — Transition orchestration hook
- `src/components/3d/PostProcessingStack.tsx` — 7 always-on effects
- `src/lib/audio/irisAudio.ts` — Iris procedural audio
- `src/hooks/useParallaxMouse.ts` — Mouse parallax tracking
- `src/hooks/useInteractiveSurface.ts` — Hover-reactive surfaces

**Modified files (3):**
- `src/components/3d/CockpitCanvas.tsx` — Persistent canvas, SceneRouter, removed CSS fallbacks
- `src/components/game/GameShell.tsx` — sceneStore integration
- `src/components/3d/CameraSystem.tsx` — Game camera mode

**Key architecture changes:**
- Single persistent R3F Canvas (never unmounts, even during gameplay)
- Mechanical iris transition replaces canvas unmount pattern
- sceneStore centralizes visibility (replaces fragmented uiStore.gameActive + cockpitStore.heroPhase)
- 7 post-processing effects always-on with scene-reactive multipliers
- Procedural iris audio (Web Audio API)
- Mouse parallax + interactive surface hooks

### D3D Phase 4B — Error Analysis & Discrepancy Catalog (March 24, 2026)

#### Stage Documents Requiring D3D Updates (During Build)

These discrepancies exist between existing stage docs and the D3D architecture. Each will be resolved when its stage is built — NOT pre-emptively.

| Stage Doc | Discrepancy | Resolution |
|-----------|-------------|-----------|
| All 35 game stage docs (6B–7F) | Contain `useIsMobile()` pattern and conditional 3D rendering | Remove during build per D3D-1. Games render 3D unconditionally. |
| All 3D component stage docs | Import `useLOD` / `LODWrapper` / `useLODContext` | Remove during build, hardcode ultra-quality values (D3D-2). |
| Stage 3 Part 3 | Creates StationFrame with separate Canvas | Use CockpitCanvas with SceneRouter instead (D3D-B1). |
| Stage 6B–7F (all games) | Games create own `<Canvas>` for 3D scenes | Render as `<group>` inside CockpitCanvas via GameShell (D3D-B3). |
| Stage 4 Part 1 | `useApi.ts` references | BUG-1 already documented, no D3D impact. |
| CockpitCanvas stage docs (5C–5D) | References `profile.bloomEnabled` conditional rendering | Remove conditional — PostProcessingStack is always-on (D3D-5, D3D-C1). |
| GameShell stage docs | References `setGameActive(true/false)` from uiStore | Replace with `sceneStore.enterGame`/`exitGame` (D3D-B5). |
| Hero Animation docs (5A–5B) | HeroAnimation may create separate Canvas | Must render as scene within CockpitCanvas (D3D-B1). |
| Login 3D docs (5E–5F) | LoginPortal3D creates own Canvas | Login page is pre-auth — this Canvas is acceptable (outside CockpitCanvas scope). No D3D change needed. |

#### Files With Stale References (Fix During Stage Build)

These files contain references that D3D supersedes. They are NOT broken (old code still works), but will be updated during their respective stage builds:

| Pattern | Occurrences | Files Affected | D3D Replacement |
|---------|------------|----------------|----------------|
| `useIsMobile` | ~401 | 84 files | Remove entirely (D3D-1) |
| `useLOD` / `LODWrapper` / `useLODContext` | ~30 | 15 files | Remove, hardcode ultra (D3D-2) |
| `GenericGameParticles` | ~35 | 35 game files | Remove CSS fallback (D3D-1) |
| `setGameActive` | ~4 | GameShell, uiStore, CockpitCanvas | Use `sceneStore.enterGame`/`exitGame` (D3D-B5) |
| `profile.bloomEnabled` | ~3 | CockpitCanvas, 2 config files | Always true — remove conditional (D3D-5) |
| `DeviceSelectionModal` | ~2 | Provider, settings page | Remove entirely (D3D-1) |
| `useAdaptiveLOD` | ~5 | LODWrapper, 3D game components | Remove entirely (D3D-2) |
| `lodSphere` / `lodBox` | ~10 | 3D components | Replace with hardcoded max segments (D3D-2) |

#### Non-Breaking Deprecations

These patterns still function but are superseded by D3D architecture:

| Deprecated | Replacement | Impact |
|-----------|-------------|--------|
| `uiStore.gameActive` | `sceneStore.activeScene === 'game'` | uiStore flag still exists but no longer read by CockpitCanvas |
| `cockpitStore.heroPhase` | `sceneStore.activeScene === 'hero'` | cockpitStore retains `heroPhase` for HeroAnimation internal state machine |
| `WormholeTransition` (cockpit-to-game) | `MechanicalIris` | WormholeTransition retained for lab-to-lab transitions within spatial dashboard |
| Inline postprocessing in CockpitCanvas | `PostProcessingStack` component | Old inline EffectComposer replaced by extracted component (D3D-C1) |
| `deviceStore.profile.bloomEnabled` | Always `true` | Profile property still exists but is always `true` |
| `deviceStore.hasSelected` | Always `true` | No device selection flow exists |

#### Import Graph Changes

| Import Change | Affected Consumers | Notes |
|---------------|-------------------|-------|
| `sceneStore` added | CockpitCanvas, SceneRouter, GameShell, MechanicalIris, PostProcessingStack | New central state for scene management |
| `useLOD` removed | All 3D game components, LODWrapper, GameShell | Consumers must remove import and inline ultra values |
| `useIsMobile` removed | 84 files across games, layouts, 3D components | Consumers must remove import and conditional blocks |
| `GenericGameParticles` removed | 35 game files | Consumers must remove import and mobile fallback rendering |
| `PostProcessingStack` added | CockpitCanvas | Single consumer, replaces inline effects |
| `irisAudio` added | MechanicalIris (via useIrisTransition) | Procedural audio for iris open/close |

### Section 4.2 — Procedural Environment Generation (March 24, 2026)

**Status:** COMPLETE
**Branch:** `claude/procedural-environment-generation-8glJx`

**Architecture:** ProceduralEnvironmentGenerator orchestrates 5 sub-generators (Terrain, SkyDome, Fog, Lighting, Props) driven by 10 lab theme profiles and 3 tier configs. All 3 base environment wrappers (Standard, FL-Lite, Flagship) refactored to delegate internally — zero breaking changes to 35 existing game environments.

| Batch | Commit | Files | Status |
|-------|--------|-------|--------|
| 1 — Core config + sub-generators | `9269743` | 6 created (proceduralConfig.ts + 5 procedural/*.tsx) | COMMITTED |
| 2 — Generator + integration | `d554608` | 2 created + 4 modified (generator, index, 3 base wrappers) | COMMITTED |
| 3 — Documentation updates | — | 3 modified (PROGRESS.md, CLAUDE.md, PartD.md) | COMMITTED |

**Files created (8):**
- `src/lib/3d/proceduralConfig.ts` — 10 lab themes, 3 tier configs, seeded RNG, type definitions
- `src/components/3d/environments/procedural/ProceduralTerrain.tsx` — Seeded FBM noise terrain + grid floor
- `src/components/3d/environments/procedural/ProceduralSkyDome.tsx` — Gradient sky, star field, aurora
- `src/components/3d/environments/procedural/ProceduralFog.tsx` — 5 fog behaviors (drift/sparkle/swirl/pulse/rise)
- `src/components/3d/environments/procedural/ProceduralLighting.tsx` — Auto-scaled lighting rig
- `src/components/3d/environments/procedural/ProceduralProps.tsx` — 10 geometry types, instanced scatter
- `src/components/3d/environments/procedural/index.ts` — Barrel export
- `src/components/3d/environments/ProceduralEnvironmentGenerator.tsx` — Main orchestrator

**Files modified (4):**
- `src/components/3d/environments/StandardEnvironmentBase.tsx` — Wrapper delegates to procedural (tier='standard')
- `src/components/3d/environments/FLLiteEnvironmentBase.tsx` — Wrapper delegates to procedural (tier='fl-lite')
- `src/components/3d/environments/FlagshipEnvironmentBase.tsx` — Wrapper delegates to procedural (tier='flagship')
- `src/components/3d/environments/index.ts` — Added ProceduralEnvironmentGenerator export

**Key decisions:**
- Q1: Replace base wrappers (Option B) — procedural system is internal, external API unchanged
- Q2: 10 lab theme profiles approved (digital-detection through quantum-frontier)
- Q3: Game tier only (Option A) — triangle budget scales by Standard/FL-Lite/Flagship

### Section 4.1 — Near-Term Enhancements (March 24, 2026)

**Status:** COMPLETE
**Branch:** `claude/build-section-4.1-CQSdv`
**Source:** `docs/enhancements/DESKTOP_FIRST_3D_OVERHAUL_PartD.md` Section 4.1

All 7 near-term enhancements from the D3D roadmap have been implemented:

| Enhancement | ID | Effort | Status | Commit |
|------------|-----|--------|--------|--------|
| WebGPU Shader Ports | A | Medium | COMPLETE | `f5f3519` |
| Per-Game Camera Presets | B | Low | COMPLETE | `378b91c` |
| Iris Audio Integration | C | Low | COMPLETE | `710714b` |
| CockpitCanvas Parallax | D | Low | PRE-EXISTING | (already wired in D3D Part C) |
| Interactive Surface Deployment | E | Medium | COMPLETE (stubs) | `80f1d2f` |
| Transition Sound Variations | F | Low | COMPLETE | `710714b` |
| Camera Shake on Events | G | Low | COMPLETE | `710714b` |

**Files created (14):**
- `src/shaders/labPatterns/tsl/shared.ts` — TSL shared utilities (rand2D, simplex2D)
- `src/shaders/labPatterns/tsl/codeLab.ts` — Lab 1 TSL pattern
- `src/shaders/labPatterns/tsl/dataLab.ts` — Lab 2 TSL pattern
- `src/shaders/labPatterns/tsl/neuralLab.ts` — Lab 3 TSL pattern
- `src/shaders/labPatterns/tsl/createLab.ts` — Lab 4 TSL pattern
- `src/shaders/labPatterns/tsl/agentLab.ts` — Lab 5 TSL pattern
- `src/shaders/labPatterns/tsl/ethicsLab.ts` — Lab 6 TSL pattern
- `src/shaders/labPatterns/tsl/visionLab.ts` — Lab 7 TSL pattern
- `src/shaders/labPatterns/tsl/languageLab.ts` — Lab 8 TSL pattern
- `src/shaders/labPatterns/tsl/buildLab.ts` — Lab 9 TSL pattern
- `src/shaders/labPatterns/tsl/frontierLab.ts` — Lab 10 TSL pattern
- `src/shaders/labPatterns/tsl/index.ts` — Barrel export with lookup helpers
- `src/lib/3d/cameraShake.ts` — Camera shake controller with event presets
- `src/lib/3d/interactiveSurfaceConfig.ts` — Cockpit interactive surface presets

**Files modified (5):**
- `src/lib/audio/irisAudio.ts` — Lab color audio profiles (10 colors → frequency/filter variations)
- `src/hooks/useIrisTransition.ts` — Integrated iris audio lifecycle (was in CockpitCanvas)
- `src/components/3d/CameraSystem.tsx` — Per-game camera presets + shake offset
- `src/components/3d/CockpitCanvas.tsx` — Game preset lookup, removed redundant audio code
- `src/config/gameRegistry.ts` — Added cameraPreset field to all 35 games

---

### Stage 10 Audit Fixes (2026-03-29)

**Status:** COMPLETE
**Branch:** `claude/stage-10-audit-fixes-Ax92m`
**Source:** `AUDIT_REPORT_3-25-2026.md` — Stage 10 section (2 CRITICAL, 7 HIGH, 5 WARNING, 3 INFO)

**Batch 1 — CSP + Security Headers (S10-CRIT-001, S10-HIGH-001, BUG-10D):**
- [x] Added `Content-Security-Policy` header in `next.config.ts` with `connect-src` for Supabase, Sentry, Vercel analytics, Stripe, Anthropic
- [x] Added `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
- [x] Added `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- [x] Added `Strict-Transport-Security` (HSTS) with 2-year max-age + preload
- [x] Added immutable caching headers for `/_next/static/` assets

**Batch 2 — Sentry Error Reporting (S10-HIGH-002, S10-HIGH-003):**
- [x] `ErrorBoundary.tsx` — Added `Sentry.captureException` in `componentDidCatch`
- [x] `error.tsx` — Added `Sentry.captureException` in `useEffect`

**Batch 3 — Environment Validation (S10-HIGH-007):**
- [x] Created `src/lib/env.ts` with Zod schema for all required/optional env vars
- [x] Validates at module import: NEXT_PUBLIC_SUPABASE_URL (required), NEXT_PUBLIC_SUPABASE_ANON_KEY (required), Stripe/Anthropic/Sentry keys (optional with graceful fallback)

**Batch 4 — Accessibility Store (S10-WARN-001):**
- [x] Added `screenReader: boolean` + `toggleScreenReader()` to `accessibilityStore.ts`
- [x] Now matches CLAUDE.md Section 14 specification

**Batch 5 — PWA Offline Support (S10-HIGH-004, S10-HIGH-005):**
- [x] Created `public/sw.js` — Cache-first for static assets, network-first for navigation, offline fallback
- [x] Created `src/app/offline/page.tsx` — Frost-Prismatic styled offline page with retry button
- [x] Service worker registered in `A11yProvider` on client mount

**Batch 6 — OpenDyslexic Fonts (S10-HIGH-006):**
- [x] Downloaded `OpenDyslexic-Regular.woff` and `OpenDyslexic-Bold.woff` to `public/fonts/`
- [x] Updated `globals-a11y.css` `@font-face` from woff2 to woff format

**Batch 7 — Theme Color (S10-WARN-003):**
- [x] Dual theme-color retained as intentional — supports a11y light mode toggle (S10-INFO-003)
- [x] No code change needed; documented as design decision

**PWA Branded Icons (S10-CRIT-002, S10-WARN-005):**
- [x] Created `scripts/generate-pwa-icons.mjs` — Sharp-based icon generator with crystalline glassmorphic SparkForge branding
- [x] Generated `icon-512.png` (512×512), `icon-192.png` (192×192), `apple-touch-icon.png` (180×180), `favicon.ico`/`favicon.png` (32×32), `og-image.png` (1200×630)
- [x] Design: Deep void (#0A0E16) background, aurora gradients, chrome bezel ring, neon blue (#00BBFF) "SF" monogram with glassmorphic glow, HUD accent dots

**Files Created (7):**
- `scripts/generate-pwa-icons.mjs`
- `public/icon-512.png`, `public/icon-192.png`, `public/apple-touch-icon.png`
- `public/favicon.ico`, `public/favicon.png`, `public/og-image.png`
- `public/sw.js`
- `src/app/offline/page.tsx`
- `src/lib/env.ts`
- `public/fonts/OpenDyslexic-Regular.woff`, `public/fonts/OpenDyslexic-Bold.woff`

**Files Modified (5):**
- `next.config.ts` — CSP + security headers + static caching
- `src/components/ui/ErrorBoundary.tsx` — Sentry reporting
- `src/app/error.tsx` — Sentry reporting
- `src/stores/accessibilityStore.ts` — screenReader field
- `src/components/accessibility/A11yProvider.tsx` — SW registration
- `src/app/globals-a11y.css` — OpenDyslexic woff format fix

**Audit Finding Resolution Summary:**

| Finding | Severity | Status |
|---------|----------|--------|
| S10-CRIT-001 (No CSP) | CRITICAL | RESOLVED |
| S10-CRIT-002 (PWA icons missing) | CRITICAL | RESOLVED |
| S10-HIGH-001 (No security headers) | HIGH | RESOLVED |
| S10-HIGH-002 (ErrorBoundary no Sentry) | HIGH | RESOLVED |
| S10-HIGH-003 (error.tsx no Sentry) | HIGH | RESOLVED |
| S10-HIGH-004 (No service worker) | HIGH | RESOLVED |
| S10-HIGH-005 (No offline page) | HIGH | RESOLVED |
| S10-HIGH-006 (OpenDyslexic fonts missing) | HIGH | RESOLVED |
| S10-HIGH-007 (No env validation) | HIGH | RESOLVED |
| S10-WARN-001 (a11y store mismatch) | WARNING | RESOLVED |
| S10-WARN-002 (console.log pricing) | WARNING | PREVIOUSLY RESOLVED |
| S10-WARN-003 (Light theme-color) | WARNING | DOCUMENTED (intentional) |
| S10-WARN-004 (error.tsx duplicate) | WARNING | RESOLVED (via S10-HIGH-003) |
| S10-WARN-005 (Missing OG image) | WARNING | RESOLVED |
| S10-INFO-001 (Seed script logs) | INFO | ACCEPTABLE |
| S10-INFO-002 (No TODO/FIXME) | INFO | CLEAN |
| S10-INFO-003 (Light/dark toggle) | INFO | DOCUMENTED (intentional a11y) |

### Code Review Notes
_(none yet)_

---

## Full Code Audit — March 30, 2026

### Audit Scope
- **497 source files** in src/
- **127 documentation files** in docs/
- **18 SQL files** in sql/
- **Config, scripts, tools** at repo root
- **6 parallel audit agents** covering: Routes & API, Components, Stores/Hooks/Types, Stage Documents, Config/SQL/Scripts, Cross-Cutting Concerns

### Issues Found: 154 total
| Severity | Count | Status |
|----------|-------|--------|
| Critical | 21 | ✅ All fixed |
| High | 42 | ✅ All fixed |
| Medium | 52 | ✅ All fixed |
| Low | 39 | ✅ All fixed |

### Batches Completed (10 total)
1. **Batch 1** — Critical Security + Missing Functionality (7 issues)
2. **Batch 2** — D3D Overhaul Propagation (7 issues)
3. **Batch 3** — Triangle Budgets + SQL Merge (7 issues)
4. **Batch 4** — Data Inconsistencies (12 issues)
5. **Batch 5a** — Architecture + Tailwind v4 Migration (6 issues)
6. **Batch 5b** — Parent Dashboard Pages Created (2 issues, 1125 lines new)
7. **Batch 6** — Docs Drift + Performance (17 issues)
8. **Batch 7** — Medium Code Quality (18 issues)
9. **Batch 8** — Stage Doc Deprecated Patterns (8 files updated)
10. **Batch 9** — Low Priority Cleanup (10 issues)

### Key Changes Summary
- Security: COPPA consent JWT validation, SQL security fixes, demo cookie cleanup
- Missing functionality: PATCH /api/auth/me, postprocessing package, 2 parent dashboard pages
- D3D compliance: Removed deprecated gameActive/LOD/mobile code from 15+ source files
- Data: Fixed all lab colors, 5 age band mismatches, centralized lab config
- Architecture: Tailwind v4 migration, SSR-safe localStorage, middleware validation
- SQL: Merged duplicate seed files, unified RUN_ORDER.md
- Docs: Archived obsolete mobile plans, updated triangle budgets, fixed stage doc imports
- Performance: Lazy Tone.js, optimized store subscriptions, parallel badge queries

### Validation
- TypeScript (`npx tsc --noEmit`): ✅ PASS — zero errors
- All 35 game components present: ✅ VERIFIED
- All 3D registry components exist: ✅ VERIFIED
- Import graph clean (no broken imports): ✅ VERIFIED
- No deprecated fonts (Fredoka/Nunito): ✅ VERIFIED
- No deprecated mobile patterns in source: ✅ VERIFIED
