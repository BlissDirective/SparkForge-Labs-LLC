# Full-SparkForge-ReDo.md

**Plan owner:** Claude Code (autonomous build agent)
**Branch:** `claude/sparkforge-production-audit-i7HVO`
**Drafted:** 2026-05-11
**Target ship:** 2026-06-11 (4 weeks + buffer)
**Status:** Approved — Scrap All 3D / Ship All 42 Games / Bright & Playful aesthetic

---

## 0. Executive Summary

SparkForge in its current state is an over-engineered 3D experience that **builds clean but fails at runtime** for any device that can't run WebGL, and even on supported devices it's hostile to its target audience (children 7–16). The repo carries ~71,000 lines of 3D code, 213 files in `src/components/3d/`, 37 dated audit/design `.md` files at the root, and a dashboard chassis (the "Cockpit") that has no HTML fallback.

The build itself succeeds (`npm run build` exits 0, 0 TypeScript errors, 60 lint warnings, all 90 routes emit). The problem is not compile — it's UX, runtime fragility, and aesthetic mismatch. That means we don't rewrite the app. We **strip the load-bearing 3D chrome, reskin to a Bright & Playful 2D HTML aesthetic, wrap in-game 3D scenes in fallbacks, and ship all 42 games on the existing GameShell architecture**.

**Three locked-in decisions:**

1. Scrap all chrome 3D (cockpit, hero, brand hero, holographic lab map, login/signup 3D panels, TSL post-processing). Keep in-game 3D scenes lazy-loaded with 2D fallbacks.
2. Ship all 42 games (35 existing + 7 new Stage 11 flagships). PocketBrain feature-flagged behind an "Experimental" gate if WebGPU LLM doesn't pass smoke.
3. Bright & Playful visual direction: light mode, peach-to-pink gradient, Spark Orange + Curious Purple accents, Fredoka + Nunito type, chunky rounded cards, kid-friendly mascot illustrations.

**Net deletion:** ~29,400 LOC of chrome 3D, ~1MB of dated docs, 10+ npm dependencies.
**Net retention:** ~40,000 LOC of in-game 3D scenes (lazy-loaded with fallbacks), all 42 games, GameShell, all 20 stores, all 68 API routes.

---

## 1. Repo State of the Union (2026-05-11)

### What builds cleanly today

- `npm run build` → exit 0, ~2.1 min compile, all 90 routes emit
- `npx tsc --noEmit` → 1 stale test error (`tests/unit/demo-session.test.ts:32`), production source is TS-clean
- `npm run lint` → exit 0, 60 warnings (28 unused vars, 18 `any`, 9 `exhaustive-deps`, 6 dead disable directives)
- First-load JS baseline 234 KB, heaviest user-facing route ~320 KB

### What's broken at runtime

| Blocker | Location | Symptom |
|---------|----------|---------|
| Missing Supabase env → throw | `src/lib/supabase/client.ts:11-12` | Demo button on `/login` crashes the page |
| Dashboard IS the cockpit | `src/app/(dashboard)/layout.tsx` → `StationFrame` → `CockpitCanvas` | `/home` is a black screen when WebGL fails |
| No error boundary or HTML fallback around 3D dashboard chrome | Same | Mobile Safari, low-memory devices, no-GPU devices all fail silently |
| Hero animation 8-beat sequence requires WebGPU+TSL primary path | `src/components/3d/HeroAnimation.tsx` | Many devices hit thin MP4 poster fallback — but the chain is fragile |

### Inventory snapshot

| Surface | Count | Size |
|---------|-------|------|
| Routes (page.tsx) | 35 | — |
| API handlers (route.ts) | 68 | — |
| 3D components | 213 files | ~71,400 LOC |
| Games | 41 *Game.tsx files (42 in registry incl. Stage 11) | ~36,876 LOC |
| Zustand stores | 20 | — |
| Hooks | 65 | — |
| `lib/` subdirectories | 25 | — |
| Shaders (GLSL + TSL) | 16 + tsl/ subdir | ~3,583 LOC |
| Root `.md` files | 37 | ~1 MB |
| `_SUPERSEDED/` folders | 4 | ~14 files |

### Security debt (must fix before ship)

- 1 critical (`happy-dom <=20.8.8` — test dep)
- 9 high (`flatted`, `lodash`, `lodash-es`, `icu-minify`, `mcp-data-vis`, `vite`)
- 8 moderate, 1 low
- `three-mesh-bvh@0.7.8` deprecated — bump to `^0.8.0`
- `glob@9.3.5` deprecated — transitive

---

## 2. Architectural Decision: 3D Scope

### The two flavors of 3D

| Flavor | What | Decision |
|--------|------|----------|
| **Chrome 3D** | Cockpit dashboard, HeroAnimation, BrandHero3D, HolographicLabMap, LabStructure3D, Login/Signup/Reset 3D panels, AuthPanelCanvas, TSL shaders, post-processing stack, marketing 3D acts (LabDiscoveryRing, StationPreview, ScrollJourney) | **DELETE** — load-bearing, no fallback, blocking users |
| **In-Game 3D** | Pet3DScene, NeuralNetwork3D, PromptBubble3D, BiasScales3D, AgentPipeline3D, EmojiDecoder3D, AiSpyEnvironment, and ~15 others | **KEEP** lazy-loaded inside each game, wrap in ErrorBoundary + 2D fallback |

### Why this works

- 22 of 42 games currently dynamic-import their 3D scene. Wrapping each in `<Game3DBoundary fallback={<TwoDFallback/>}>` lets the game still play when WebGL fails — just flat.
- Removing chrome 3D unblocks the entire login → dashboard → labs flow on every device, including no-GPU/no-WebGL environments.
- All game logic, stores, scoring, phases, ARIA labels, age-band content stay intact. **Zero game rewrites.**

### Game risk tiers

| Tier | Count | Examples | Verify Week |
|------|-------|----------|-------------|
| Pure 2D (works out of box) | 20 | AiSpy, TimeMachine, HumanVsMachine, WordPredictor, TokenChopper, SentimentScanner | Week 2 |
| Low-risk 3D (small optional scene) | 5 | EmojiDecoder, CodeBlocks, CameraQuest, FutureForge, AiOrNot | Week 2 |
| Medium-risk 3D (1.2–1.8K LOC, scene required) | 8 | AgentArchitect, PetTrainer, AgentAtelier, BuildClassifier, ContextArchitect, PixelWitness, ChatbotBuilder, SortToyBox | Week 3 |
| High-risk 3D (2K+ LOC, dual scenes) | 3 | PromptLab, NeuralBuilder, BiasDetective | Week 3 |
| Stage 11 (loaders unfinished) | 7 | PocketBrain, ContextArchitect, PixelWitness, AgentAtelier, McpLab, GlassBox, HarnessForge | Week 3 |

---

## 3. Redundant Code to Delete (Locked In)

### Tier A — Archives (delete immediately)

- `_SUPERSEDED/` at repo root (2 files)
- `docs/00-reference/_SUPERSEDED/` (4 files)
- `src/components/auth/_SUPERSEDED/` (2 files)
- `src/components/3d/_SUPERSEDED/` (4 files)
- `docs/stage7/.../7b-drag-drop/_SUPERSEDED/`
- `docs/stage7/.../7c-simulation/_SUPERSEDED/`

### Tier B — Dated docs (move to `_archive/2026-04-audits/`)

- `AUDIT_REPORT.md`, `AUDIT_REPORT_03.29.2026.md`, `AUDIT_REPORT_3-25-2026.md`
- `CODE_AUDIT_SUMMARY_MATRIX_20260315.md`
- `Final-Audit_04-15-2026.md`
- `GAME_ENHANCEMENT_AUDIT.md`
- `SparkForge-Design-UI-UX-Audit.md`
- `StandardTier-game-content-audit(04.09.2026).md`
- `flagship-game-content-audit(04.06.2026).md`
- `flagship-lite-game-content-audit(04.08.2026).md`
- `BRAND_HERO_ACTION_PLAN.md`, `Cockpit-Interface-Plan.md`
- `ENHANCEMENT_BLUEPRINT_v1.0.md`
- `Master-Design-Agent.md`, `Master-Design-UI-UX-Reference-Source.md`, `Master-SparkForge-UI-Design-Change.md`
- `Mythos.md`, `SparkForge-VR-Update.md`, `SparkForge-ALT-UI.md`
- `2026_MarketAnalysis_Report.md`, `VC_Analysis.md`
- `COCKPIT_ARCHITECTURE_CURRENT.json`, `SparkForge-Full-ControlScreen.json`
- `Stage_Documents_Master_Grid.html`, `Stage_Documents_Master_Grid.pdf`
- `Agent-Frontend.md`, `Feature-Workflow-Test.md`, `PHASE_4_UNRESOLVED_CARRYOVER.md`
- `Ref-claude-auto.v1.0.md`, `SparkForge-agent.md`
- `DESIGN.md`, `DESIGN_DECISIONS_LOG.md`
- `SparkForge-New-Design/` (per recent commit, this was a stub)

### Tier C — Chrome 3D code (delete)

| Subsystem | Files |
|-----------|-------|
| Cockpit | All 36 `Cockpit*` files in `src/components/3d/`, `cockpitStore.ts`, `cockpitAtoms.ts`, `cockpitBroadcastStore.ts`, `useCockpit*` hooks, `cockpitConfig.ts`, `cockpitMaterials.ts`, `cockpitModePresets.ts`, `batchedCockpit.ts`, `cockpitThemes.ts`, `cockpitDesignTokens.ts`, `src/components/3d/ui/` Cockpit-prefixed |
| Hero | `HeroAnimation.tsx`, `HeroScene.tsx`, `HeroOverlay.tsx`, `hero/v3/` (all 8 beats), `useHeroAnimation`, `useHeroCompute`, `useIrisTransition`, `src/lib/hero/` |
| Brand | `BrandHero3D.tsx`, `SparkForgeWordmark3D.tsx`, `LensflareTSL.tsx`, `CrystalHero.tsx`, `src/lib/branding/` 3D pieces |
| Labs 3D | `HolographicLabMap.tsx`, `LabStructure3D.tsx`, marketing `LabDiscoveryRing.tsx`, `StationPreview.tsx`, `ScrollJourney.tsx` |
| Auth 3D | `LoginPanel3D.tsx`, `SignupPanel3D.tsx`, `ResetPasswordPanel3D.tsx`, `AuthPanelCanvas.tsx` |
| Shaders | `src/shaders/tsl/`, `src/shaders/labPatterns/tsl/`, all chrome-only `.glsl` (audit per file before delete) |
| Post-FX | `PostProcessingStack.tsx`, `CeremonyFXGpu.tsx`, replaced by simple HTML/SVG celebration overlay |
| Registry slots | `src/registry/blocks/brand-hero-slot.tsx`, `cockpit-preview-slot.tsx`, `login-panel-slot.tsx` |
| Layouts | `StationFrame.tsx`, `CockpitCanvas.tsx`, `CockpitPreview3D.tsx`, `CockpitUILayer.tsx` |

### Tier D — npm dependencies to uninstall

| Package | Why |
|---------|-----|
| `@splinetool/react-spline`, `@splinetool/runtime` | Zero usages confirmed |
| `@react-three/uikit`, `@react-three/uikit-apfel` | Cockpit-only |
| `@react-three/rapier` | Verify; if cockpit-only, drop |
| `gsap` | `motion` is locked in as the animation library |
| `lenis` | Smooth scroll — not needed |
| `troika-three-text` | Cockpit-only text-in-canvas |
| `meshoptimizer` | 3D asset pipeline — not needed once chrome 3D gone |
| `comlink` | Worker bridge for cockpit |

**Keep:** `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` (in-game scenes use them).

---

## 4. Bright & Playful Visual System

### Tokens

| Token | Value |
|-------|-------|
| Mode | Light (default). Dark toggle deferred post-launch. |
| Background gradient | `linear-gradient(180deg, #FFF8F0 0%, #FFE9D6 50%, #FFD6E8 100%)` |
| Card surface | `#FFFFFF` + `box-shadow: 0 4px 20px rgba(255,138,76,0.12)` |
| Primary (Spark Orange) | `#FF6B35` |
| Secondary (Curious Purple) | `#7C4DFF` |
| Success | `#22C55E` |
| Warning | `#FBBF24` |
| Error | `#EF4444` |
| Type | Fredoka (headings), Nunito (body) — via `next/font/google` |
| Radii | `--r-sm: 12px`, `--r-md: 20px`, `--r-lg: 28px` |
| Motion | `motion` library, spring 200–400ms, respects `prefers-reduced-motion` |
| Lab colors | Existing `labColors.ts` desaturated 15% for light backgrounds |

### Component map (new + restyled)

| Surface | Component | Status |
|---------|-----------|--------|
| Landing hero | `PlayfulHero.tsx` | NEW |
| Landing features | `FeatureGrid.tsx` | NEW |
| Login/Signup card | `LoginCard.tsx`, `SignupCard.tsx` | RESKIN |
| Reset password | `ResetPasswordCard.tsx` | RESKIN |
| Dashboard home | `HomeGreeting.tsx`, `RecommendedGames.tsx` | NEW |
| Sidebar | `Sidebar.tsx` | RESKIN + responsive bottom-nav |
| Labs grid | `LabGrid.tsx`, `LabCard.tsx` | NEW |
| Lab detail | `LabHeader.tsx`, `GameGrid.tsx`, `GameCard.tsx` | NEW |
| GameShell | `GameShell.tsx` | RESKIN (logic untouched) |
| Celebration | `WinOverlay.tsx` | NEW (replaces CeremonyFX) |
| Parent dashboard | existing `(dashboard)/parent/*` pages | RESKIN |

### Accessibility floor (WCAG 2.1 AA + kid-friendly)

- Body text ≥ 16px, game-card text ≥ 20px
- Tap targets ≥ 44×44px
- Contrast ≥ 4.5:1 against white card / 7:1 on gradients where used
- Visible focus rings (`focus-visible:ring-4 ring-spark-orange/40`)
- ARIA labels on every interactive element
- `prefers-reduced-motion`: spring animations downgrade to crossfade

---

## 5. Four-Week Execution Plan

### Week 1 (May 11–17) — Demolition & Foundation

**Exit gate:** `npm run build` clean. `/login → demo → /home` flow renders HTML on Chrome desktop, Safari mobile, WebGL-disabled Chromium.

1. Create `_archive/2026-04-audits/`. `git mv` all Tier B docs into it.
2. Delete all four `_SUPERSEDED/` folders.
3. `npm audit fix`; bump `three-mesh-bvh@^0.8.0`; `--force` for `happy-dom`.
4. Fix TS error in `tests/unit/demo-session.test.ts:32`.
5. Audit `.env.local`; replace `throw` in `src/lib/supabase/client.ts` with a runtime error UI.
6. Rewrite `src/app/(dashboard)/layout.tsx` to a plain HTML shell.
7. Delete cockpit subsystem (Tier C → Cockpit row).
8. Delete hero + brand 3D (Tier C → Hero, Brand rows). Replace landing with placeholder gradient + tagline.
9. Delete auth 3D (Tier C → Auth row).
10. Delete `HolographicLabMap` + `LabStructure3D`. Placeholder `/labs` HTML grid.
11. Delete TSL shaders + post-processing (Tier C → Shaders, Post-FX rows).
12. Uninstall Tier D npm packages.
13. Rewrite `tailwind.config.ts` + `src/app/globals.css` with Bright & Playful tokens. Wire Fredoka + Nunito.
14. Commit per step. Push to `claude/sparkforge-production-audit-i7HVO`.

### Week 2 (May 18–24) — Core Surfaces Reskin

**Exit gate:** Landing, login, /home, /labs, /labs/[id], parent dashboard, 25 games all Bright & Playful. Lighthouse mobile Performance ≥ 80 on landing.

1. Build `PlayfulHero.tsx` (gradient + animated SVG mascot + 3 feature cards + CTA).
2. Reskin `LoginCard.tsx`, `SignupCard.tsx`, `ResetPasswordCard.tsx`.
3. Build `HomeGreeting.tsx`. Wire to `childStore` + progress API.
4. Build `LabCard.tsx` + `LabGrid.tsx`. Use `labColors.ts` desaturated.
5. Build `GameCard.tsx`. Replace `/labs/[labId]` placeholder.
6. Reskin `GameShell.tsx` chrome.
7. Reskin `Sidebar.tsx` (responsive bottom-nav variant for mobile).
8. Reskin parent dashboard pages.
9. Build `WinOverlay.tsx` (SVG sparkle + XP + retry/next).
10. Smoke-test 25 low-risk games. Log in `PROGRESS.md`.
11. Fix 9 `react-hooks/exhaustive-deps` warnings (real bugs).
12. Remove dead `useFilteredContent` thread in `PromptLab`, `RobotVacuum`, `SortToyBox`.

### Week 3 (May 25–31) — 3D-Wrapped Games + Stage 11

**Exit gate:** All 42 games (or 41 + PocketBrain experimental) load, play one round, complete. WebGL-disabled run still shows 2D fallbacks. No console errors in a 10-min play session.

1. Create `src/components/games/Game3DBoundary.tsx` (ErrorBoundary + WebGL detection + 3s timeout fallback).
2. Wrap every `dynamic()` 3D import inside 22 games with `<Game3DBoundary>`.
3. Build per-game 2D fallbacks for 8 medium-risk + 3 high-risk games (simple SVG/Canvas equivalents).
4. Finalize 7 Stage 11 game loaders in `src/lib/game-loaders.ts`.
5. Smoke-test each Stage 11 game.
6. **PocketBrain decision:** if `@mlc-ai/web-llm` model download fails reliably, gate behind "Experimental" flag.
7. Deep test PromptLab, NeuralBuilder, BiasDetective.
8. Verify per-lab game lists + locked/unlocked/completed states.
9. Resolve remaining 28 lint warnings (`no-explicit-any`, `no-unused-vars`).
10. WCAG sweep on new palette (contrast, tap targets, focus rings).

### Week 4 (June 1–7) — Polish, Test, Deploy

**Exit gate:** Deployed to production. All 42 games playable. Stripe checkout completes. Sentry receives errors. Lighthouse ≥ 80 mobile.

1. Stripe test checkout end-to-end. Confirm 4 price IDs.
2. Anthropic Claude API verified in PromptLab + Content Agent. Per-session rate limits (15/game).
3. Onboarding flow: first-login wizard (child profile → age band → 1-game tutorial via HTML tooltip).
4. Verify Sentry env + release tagging.
5. Supabase `get_advisors`; confirm RLS; PITR runbook.
6. PWA: manifest, offline page, service worker.
7. Lighthouse audits on 6 critical routes.
8. Playwright E2E: signup → child create → play → score → parent dashboard.
9. Real-device smoke matrix: iPhone, Android Chrome, Mac Safari, Windows Edge.
10. Rewrite `README.md`, `DEPLOYMENT.md`, `CLAUDE.md` to reflect post-redo architecture.
11. Push to Vercel production. Verify env. Post-deploy smoke.
12. Tag `v1.0.0`.

### Week 5 (June 8–11) — Buffer

Stabilization only. No new features.

---

## 6. Risks & Mitigations

| # | Risk | Mitigation | Likelihood |
|---|------|------------|------------|
| 1 | PocketBrain WebGPU LLM fails on most devices | Feature-flag behind "Experimental"; "Coming soon" card if smoke fails | High |
| 2 | In-game 3D scenes have device-specific bugs that 2D fallbacks don't hide cleanly | `Game3DBoundary` triggers fallback on 3s timeout, not just throw | Medium |
| 3 | Tailwind 4 + light-theme rewrite breaks 40+ Game.tsx visual layouts | Week 2 dedicated visual sweep; Week 3 smoke catches regressions | Medium |
| 4 | Bundle size after refactor still too large | Verify per-route first-load JS in build output; code-split if any > 350 KB | Low |
| 5 | Stripe/Anthropic env config doesn't match staging in prod | Week 4 dedicated checkpoint; every env var documented in DEPLOYMENT.md | Low |

---

## 7. Open Decisions (Defaults Assumed)

| # | Decision | Default |
|---|----------|---------|
| 1 | Mascot character | Commission/AI-generate "Sparky" — orange spark character, SVG illustrations |
| 2 | Marketing copy refresh | Defer to Week 2 with placeholder copy |
| 3 | Lab 11 ship-or-defer | Ship 6 of 7 Stage 11 games; gate PocketBrain |
| 4 | Tier pricing (Free / Plus / Forge) | Keep as documented — no changes for launch |
| 5 | Free-tier paywall depth | 5 free games (one per labs 1–5), all 11 labs visible, locked beyond |
| 6 | Demo session length | 30 minutes, no signup — already implemented |
| 7 | CLAUDE.md rewrite | Yes — v6.7 vision is no longer the build target |

---

## 8. Definition of Done

- [ ] `npm run build` exits 0
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run lint` exits 0 with < 20 warnings (down from 60)
- [ ] `npm audit` shows 0 critical, 0 high
- [ ] All 42 games load, play one round, and complete on Chrome desktop + iPhone Safari + Android Chrome
- [ ] WebGL-disabled run still plays every game via 2D fallbacks
- [ ] Demo flow: `/login → Start Demo → /home → /labs → /labs/[id] → play game → complete → XP awarded`
- [ ] Full signup flow: `/signup → confirm email → create child → play game → parent dashboard shows progress`
- [ ] Stripe test checkout completes for all 4 price IDs
- [ ] Anthropic Claude calls succeed in PromptLab + Content Agent
- [ ] Sentry receives errors from production
- [ ] Lighthouse mobile: Performance ≥ 80, A11y ≥ 95, SEO ≥ 90 on `/`, `/login`, `/home`, `/labs`, one game route
- [ ] Real-device matrix logged in `PROGRESS.md`
- [ ] `v1.0.0` tag pushed
- [ ] Vercel production smoke green

---

## 9. Out of Scope (Post-Launch)

These are explicitly NOT in the 1-month plan. They go on a v1.1+ roadmap.

- Dark mode toggle (default light only for launch)
- VR/AR features (`SparkForge-VR-Update.md` is archived)
- Cockpit/Hero/Brand 3D in any form
- Realtime multiplayer
- Content agent automation pipeline beyond admin-triggered flow
- Internationalization beyond what `next-intl` already wires
- PWA push notifications
- A/B testing infrastructure
- Mobile native apps (iOS / Android)

---

## 10. Autonomy Boundaries for Claude Code

Per `CLAUDE.md` Section 2 conventions, the following actions are pre-authorized for this redo:

**No-ask:**
- File deletions per Tier A, B, C, D above
- Per-step git commits + push to `claude/sparkforge-production-audit-i7HVO`
- npm package install/uninstall per Tier D
- Tailwind config and globals.css rewrite
- Component restyle within the Bright & Playful spec
- 2D fallback authoring for in-game 3D scenes
- Lint/TS warning fixes
- Supabase `execute_sql`, `apply_migration` (review payload first per existing rule)

**Ask first (hard stops):**
- Mascot artwork direction (Sparky vs alternatives)
- Marketing copy approval
- PocketBrain experimental flag final decision
- Free-tier paywall depth (5 games default)
- Production deploy (Week 4 step 11)
- `v1.0.0` tag (Week 4 step 12)

**Visual checkpoints (require user approval before next week starts):**
- End of Week 1: HTML shell renders on all device classes
- End of Week 2: Bright & Playful reskin on 6 core surfaces
- End of Week 3: All 42 games playable + 2D fallbacks confirmed
- End of Week 4: Production deploy

---

*End of Full-SparkForge-ReDo.md — drafted 2026-05-11 for ship by 2026-06-11.*
