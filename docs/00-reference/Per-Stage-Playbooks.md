# SPARKFORGE — Per-Stage Playbooks

**Version:** 1.0 | **Date:** March 19, 2026
**Extracted from:** CLAUDE.md v5.6 Section 5
**Cross-reference:** CLAUDE.md (autonomy rules, hard stops), Master Implementation Guide v3.2 (stage overviews)

---

## Stage 1: Foundation

**Source:** `STAGE1_Foundation_v2_PART1` + `PART2` (v2 only)
**Prerequisites:** Node.js 20+, Git, VS Code
**Hard Stops:** None
**Parts:** 2

**Part 1 — Config & Structure (10 steps):**
- Create Next.js 15 project: `npx create-next-app@15 sparkforge --turbopack`
- Install 50+ npm packages (10 install commands)
- Config files: tsconfig, tailwind, postcss, next.config.ts, .env.example, .gitignore
- globals.css with 7 utility classes
- Create 30+ directories (including tests/)

**Part 2 — Source Files (Steps 11-26):**
- types/index.ts, utils.ts, supabase clients, middleware
- animations.ts (45+ Motion variants), 7 Zustand stores + Jotai atoms
- Sentry config, Vitest config, WebGPU detection
- root layout.tsx, 4 new hooks, feature flags, toast system

**Validation:** `npm run build` passes. Dev server starts.
**Commit:** `git commit -m "Stage 1 Part 1: Config and folder structure"` then `git commit -m "Stage 1 Part 2: Types, stores, hooks, utils"`
**Tag:** `git tag -a v0.1.0 -m "Stage 1 complete: Foundation"`

---

## Stage 2: Database & API

**Source:** `STAGE2_Database_API_v2_PART1-4` (v2 only)
**Prerequisites:** Stage 1 complete
**Hard Stops:** HS-1 (Supabase keys), HS-7 (SQL execution)
**Parts:** 4

**BEFORE STARTING:** Trigger HS-1. Wait for `.env.local` with Supabase URL + anon key + service role key.

**Part 1:** DB schema (9 tables), indexes (14), RLS policies, badge seed (68), starter content → **Trigger HS-7**: provide SQL blocks for human to execute in Supabase SQL Editor.
**Part 2:** Zod schemas, tier-config.ts, rate limiting, API helpers
**Part 3:** API routes: auth, children CRUD, content
**Part 4:** API routes: progress, gamification (xp, streak, badges)

**IMPORTANT:** Database uses `world` column — UI displays `Lab`. This is intentional.
**Validation:** All API routes respond. Test `/api/health`.
**Tag:** `git tag -a v0.2.0 -m "Stage 2 complete: Database + API"`

---

## Stage 3: Auth, Layout & Station Frame

**Source:** PART1-2 (v2) + Part3A/B (v3-FINAL)
**Prerequisites:** Stage 2 complete
**Hard Stops:** HS-5 (visual after all parts)
**Parts:** 4 (2 v2 + 2 v3)

**Part 1 (v2):** AuthProvider, signup, login, reset-password
**Part 2 (v2):** Dashboard layout, Sidebar, TopBar, ChildSelector, onboarding
**Part 3A (v3-FINAL):** StationFrame, HeroAnimation (replaces CrystalShatter — archived to `_SUPERSEDED/`), Aurora, Particles, LEDRim, HDR, materials.ts — Decisions 1.1-1.7, 2.1-2.5, 7.1, 7.3-4, 8.1
**Part 3B (v3-FINAL):** Emissive CSS, onboarding crystal, landing page, scanline

**3D files created:** StationFrame.tsx, HeroAnimation.tsx (CrystalShatter.tsx archived to `_SUPERSEDED/`), AuroraBackground.tsx, AmbientParticles.tsx, LEDRimLight.tsx
**Tag:** `git tag -a v0.3.0 -m "Stage 3 complete: Auth + Layout + Station Frame"`

---

## Stage 3-Hero: Hero Animation (8-Phase Cinematic)

**Source:** `HERO_ANIMATION_v3FINAL_PartA.md` + `PartB.md` (in `docs/stage3-auth-layout/`)
**Reference:** `SparkForge_Hero_Page_Animation_v2.0.md` + `Implementation_Plan_Hero_Page_Animation_v2.0.md` (in `docs/00-reference/`)
**Prerequisites:** Stage 3 complete (StationFrame shell + CrystalShatter exist)
**Hard Stops:** HS-5 (visual verification after Part B)
**Parts:** 2
**Decisions:** OD-1 (Audio Default), OD-2 (Fast-Forward Scrub), OD-3 (Skip Intro Toggle), OD-4 (WebGPU Compute Shaders)

**Part A (Infrastructure):** Store updates (uiStore +skipIntroAnimation, deviceStore +gpuTier/stripeCount), webgpuDetection.ts, 4 shader files (crystallineLogo.vert/.frag, electricVeins.frag, voronoiShatter.comp), voronoiFracture.ts, heroSplines.ts. Packages: `three-bvh-csg`, `three-mesh-bvh`, `troika-three-text`.

**Part B (Visual + Audio):** heroParticleCompute.ts (TSL compute kernel, 1B+ lifetime particles), heroParticleRender.ts (SDF billboard quads), heroAudio.ts (Tone.js 8-phase audio timeline), useHeroAnimation.ts (lifecycle hook), HeroAnimation.tsx (master GSAP orchestrator, 549 lines). CrystalShatter.tsx archived to `_SUPERSEDED/`.

**Key Architecture:**
- 8-phase GSAP timeline: void → assembly → showcase → surge → shatter → regroup → materialize → online (19s total)
- WebGPU compute particles (10M simultaneous, 1B+ lifetime) with WebGL2/CSS fallback
- Seamless handoff: animation's final frame IS the cockpit's first interactive frame (CPA2-3)
- Skip: First visit always plays full. Settings toggle available. `prefers-reduced-motion` respected.

**3D files created/modified:** HeroAnimation.tsx, heroParticleCompute.ts, heroParticleRender.ts, voronoiFracture.ts, heroSplines.ts, heroAudio.ts, useHeroAnimation.ts, webgpuDetection.ts, 4 shader files
**Tag:** `git tag -a v0.3.1 -m "Stage 3-Hero complete: 8-phase cinematic hero animation"`

---

## Stage 3-Cockpit: 3D Panoramic Cockpit Architecture (CPA v2.0, 20M Upgrade)

**Source:** `COCKPIT_CPA2_v3FINAL_PartA.md` + `PartB.md` (in `docs/stage3-auth-layout/`)
**Reference:** `3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md` + `Upgrade-3D-Panoramic-Cockpit-2026-03-20.md` (in `docs/00-reference/`)
**Prerequisites:** Stage 3-Hero complete (HeroAnimation + CockpitCanvas foundation)
**Hard Stops:** HS-5, HS-9 (hero-to-cockpit handoff verification)
**Parts:** 2
**Decisions:** CPA2-1 through CPA2-12

**Part A (Canvas + Shell):** CockpitCanvas.tsx (single persistent R3F Canvas, CPA2-1), CameraSystem.tsx (unified camera), CockpitPanels.tsx (2M tris), SidePanels.tsx (1.5M), LEDRim.tsx (200K), HolographicHUD.tsx (500K), StatusBar3D.tsx (500K), CockpitStructuralDetail.tsx (1.5M), CockpitFloor3D.tsx (500K). StationFrame.tsx + SpatialDashboard.tsx refactored to thin wrappers. cockpitStore.ts created.

**Part B (Spatial + Audio):** HolographicLabMap.tsx (1M), LabStructure3D (3M, 300K×10 labs), InteractiveConsole3D (2M, 500K×4), AmbientNPCs (1.5M, 187K×8), DynamicEnvironment (3M), VolumetricFog3D (500K), CeremonyFX (500K), WormholeTransition (300K), MiniMapOverlay3D (250K), CockpitSkinManager, AuroraBackground (50K), AmbientParticles (200K), cockpitAudio.ts + useCockpitAudio.ts.

**Key Architecture:**
- Single persistent R3F Canvas at z-index: 0 (CPA2-1) — wraps entire app
- WebGPU primary renderer with WebGL2 auto-fallback (CPA2-2)
- 20M triangle budget (desktop), 10M (tablet), 0 (mobile — CSS fallback)
- Hero → cockpit seamless handoff (CPA2-3): final animation frame IS first cockpit frame
- 5 cockpit skins (default, nebula, ocean, crystal, grid) — unlock-gated
- Spatial audio zones with Tone.js Panner3D (CPA2-8)

**Total cockpit triangles:** ~19,000,000 (1M headroom on 20M budget)
**Tag:** `git tag -a v0.3.2 -m "Stage 3-Cockpit complete: 20M 3D Panoramic Cockpit"`

---

## Stage 4: Core Pages & Lab Reconfiguration

**Source:** PART1+3 (v2) + Part2A/B (v3-FINAL)
**Prerequisites:** Stage 3 complete
**Hard Stops:** HS-5 (visual after all parts)
**Parts:** 4 (2 v2 + 2 v3)

**Part 1 (v2):** Dashboard home, hooks (useChildren, useContent, useProgress, useGamification). **BUG-1 FIX: REPLACES useApi.ts entirely.** **BUG-3 FIX: Uses single /api/progress/all-labs.**
**Part 2A (v3-FINAL):** 10 lab pattern GLSL shaders + shader index — Decision 4.1
**Part 2B (v3-FINAL):** LabReconfiguration, GameFocusSequence, useStationMode — Decisions 3.1-3.5, 5.4
**Part 3 (v2):** Profile page, quiz engine, settings

**Tag:** `git tag -a v0.4.0 -m "Stage 4 complete: Core Pages + Lab Reconfiguration"`

---

## Stage 5: Gamification & Visual FX

**Source:** PART1 (v2) + Parts23 A/B/C (v3-FINAL)
**Prerequisites:** Stage 4 complete
**Parts:** 4 (1 v2 + 3 v3)

**Part 1 (v2):** XP engine, cosmetics, avatar, sound, daily challenge
**Parts 2-3A (v3-FINAL):** LiquidMetal, Holographic, EnergyField shaders — Decisions 4.2-4.5
**Parts 2-3B (v3-FINAL):** XPVortex, BadgePedestals, particle slider — Decisions 5.2-5.6, 7.2
**Parts 2-3C (v3-FINAL):** GameParticles3D (R3F for flagships), ceremonies, verification

**Tag:** `git tag -a v0.5.0 -m "Stage 5 complete: Gamification + Visual FX"`

---

## Stage 6: Flagship Games (5 games — ALL v3-FINAL)

**Source:** All v3-FINAL exclusively
**Prerequisites:** Stages 1-5 complete
**Hard Stops:** HS-8 (soft note for GLB assets), HS-5 (visual after all 5)

Each flagship: Part A = 3D component, Part B/C = full game replacement.

| Order | Game | Source | 3D Component | Decisions |
|-------|------|--------|-------------|-----------|
| 6.1 | AI Pet Trainer (Lab 2) | STAGE6B_v3FINAL_A/B | Pet3DScene + PetCreature3D | 6.2, 7.5 |
| 6.2 | Neural Builder (Lab 3) | STAGE6C_v3FINAL_A/B | NeuralNetwork3D | 6.1 |
| 6.3 | Prompt Lab (Lab 4) | STAGE6D_v3FINAL_A/B | PromptBubble3D | 6.5 |
| 6.4 | Agent Architect (Lab 5) | STAGE6E_v3FINAL_A/B/C | AgentPipeline3D | 6.4, 6.5 |
| 6.5 | Bias Detective (Lab 6) | STAGE6F_v3FINAL_A/B/C | BiasScales3D | 6.5, 6.6 |

**Every flagship requires:** Chrome bezel + LED rim, particle bg, welcome/learn/play/complete phases, age-band A/B/C, ARIA labels, Tone.js audio, useIsMobile() fallback.

**FIX-DUAL-CANVAS (March 18, 2026):** StationFrame unmounts its R3F Canvas entirely when `mode === 'game'` — each flagship game creates its own Canvas for 3D content. CSS-only frame (bezel + indicators) provides visual continuity. This prevents dual WebGL contexts and gives games full GPU budget. See each Part A doc for Canvas Coexistence Note.

**Tag:** `git tag -a v0.6.0 -m "Stage 6 complete: 5 flagship games with 3D"`

---

## Stage 7: All Remaining Games (30 games — Mixed)

**Prerequisites:** Stages 1-6 complete
**Implement in order:** 7A → 7B → 7C → 7D → 7E → 7F → Shared

**7A — 9 Tap/Quiz games (v2):** AI Spy, Time Machine, Word Predictor, Token Chopper, AI Art Detective, Tool Picker, Data Shield, Real or Fake, Prediction Market. Source: 4 v2 docs.

**7B — 4 Drag/Drop games (v3-FINAL):** Sort Toy Box (Full 3D), Human vs Machine, Code Blocks (Enhanced 3D), Career Explorer. Source: STAGE7B_v3FINAL_A/B/C.

**7C — 6 Simulation games (Mixed):**
- v2: Treat Trainer, Sentiment Scanner, Lost in Translation, Neuron Relay (Part1 + Part2)
- v3-FINAL: Chatbot Builder (3D), Data Detective (3D) (STAGE7C_v3FINAL_A/B/C)

**7D — 5 Investigation games (Mixed):**
- v2: Pixel Investigator, Fool the AI (STAGE7D_Part1)
- v3-FINAL: Robot Vacuum (3D), Camera Quest (3D), Future Forge (3D) (STAGE7D_v3FINAL_A/B/C)

**7E — 3 Ethics/API games (v2):** Ethics Courtroom, Build Classifier, API Explorer

**7F — 3 Band A games (Mixed):**
- v3-FINAL: My First AI App (3D) (STAGE7F_v3FINAL_A/B)
- v2: Emoji Decoder (STAGE7F_Part1), AI or Not? (STAGE7F_Part2)

**7 Shared — Systems (Mixed):**
- v3-FINAL: GenericGameParticles for 29 standard/FL-Lite games (STAGE7_Shared_v3FINAL_A)
- v2: XPPopupProvider, GameCompleteCelebration, StreakFire (STAGE7_Shared_XP_Celebration)

**After all 7 sub-stages:** Update `gameRegistry.ts` with all 35 entries.
**Tag:** `git tag -a v0.7.0 -m "Stage 7 complete: 30 games + shared systems (35 total)"`

---

## Stage 8: Parent Dashboard & Monetization

**Source:** PART1-2 (v2) + P3 A/B/C (v3-FINAL)
**Prerequisites:** Stages 1-7 complete
**Hard Stops:** HS-2 (Stripe keys), HS-5 (visual)

**BEFORE STARTING:** Trigger HS-2. Wait for Stripe test keys + 4 price IDs.

**Part 1 (v2):** Tier config extensions, Stripe setup, parent store. **BUG-8A: APPEND to existing tier-config.ts, do NOT create tiers.ts.**
**Part 2 (v2):** Parent dashboard, subscription, paywall
**Part 3A/B/C (v3-FINAL):** ScrollJourney landing, FeatureShowcase, StationPreview, /pricing route — Decisions 8.1-8.5

**Tag:** `git tag -a v0.8.0 -m "Stage 8 complete: Parent Dashboard + Monetization"`

---

## Stage 9: Content Agent

**Source:** `STAGE9_Content_Agent_v2_PART1-3` (v2 only)
**Prerequisites:** Stages 1-8 complete
**Hard Stops:** HS-3 (Anthropic key)

**BEFORE STARTING:** Trigger HS-3. Wait for `ANTHROPIC_API_KEY`.

**Part 1:** Agent pipeline (4-stage: Research → Generate → Screen → Insert), prompts, API routes. **ENH-9A: Graceful 503 if key missing.**
**Part 2:** Admin review dashboard
**Part 3:** Seed content: 150 lessons, 90 quizzes, 60 facts

**Tag:** `git tag -a v0.9.0 -m "Stage 9 complete: Content Agent"`

---

## Stage 10: Polish & Deploy

**Source:** `STAGE10_Polish_Deploy_v2_PART1-2` (v2 only)
**Prerequisites:** Stages 1-9 complete
**Hard Stops:** HS-4 (Vercel), HS-5 (final visual)

**Part 1:** A11yProvider, AccessibilityToolbar, accessibilityStore (9th store), SEO meta, CSP headers, PWA manifest
**Part 2:** Game router (35 games), production next.config.ts (REPLACES Stage 1 version), deployment guide

**BUG-10F (CRITICAL):** Root layout MUST use Exo 2/Sora/Orbitron — NOT Fredoka/Nunito Sans.
**BUG-10D:** CSP connect-src must include Vercel analytics domains.

**BEFORE DEPLOYING:** Trigger HS-4. Wait for Vercel setup.

**Final validation:** `vercel --prod`, Lighthouse audit, all routes resolve, PWA install prompt.
**Tag:** `git tag -a v0.10.0 -m "Stage 10 complete: Polish + Deploy — SparkForge v1.0"`

---

*End of Per-Stage Playbooks v1.0 | Extracted from CLAUDE.md v5.6 | March 19, 2026*
