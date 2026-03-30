# SPARKFORGE — CLAUDE.md

## Autonomous Development Playbook for Claude Code

**Version:** 6.1 | **Date:** March 30, 2026 | **Vision:** Laboratory Control Station
**Supersedes:** CLAUDE.md v6.0 (March 24, 2026) — Full Code Audit: 154 issues found and fixed (21C/42H/52M/39L). D3D compliance enforced across source + docs. SQL merged. Tailwind v4 migrated. Security hardened. 2 parent pages created. Lab config centralized. Stage docs updated.
**Supersedes:** CLAUDE.md v5.9 (March 23, 2026) — D3D Desktop-First Overhaul: Removed mobile/LOD/CSS fallback architecture (D3D-1/2). Added desktop-ultra rendering (50M triangle budget). Added sceneStore, SceneRouter, MechanicalIris, PostProcessingStack. Updated Sections 7, 9, 9.1, 9.2, 9.3, 11, 14. Added 20 D3D decision locks (D3D-1–9, D3D-B1–6, D3D-C1–5). Version footer updated.

---

## 1. PROJECT IDENTITY

SparkForge is a gamified AI learning platform for children ages 7–16. It teaches AI concepts through **35 interactive games** across **10 themed Labs**. The platform uses a dark-mode-only aesthetic called **Frost-Prismatic** with chrome bezels, neon accents, and glassmorphism. The v3 vision transforms the platform into a **Laboratory Control Station** — a futuristic command console with persistent chrome frames, hero animation arrivals (8-phase cinematic sequence), lab reconfiguration transitions, and themed 3D game elements.

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15 (App Router, Turbopack) | Full-stack React 19 |
| Language | TypeScript (strict mode) | Type safety |
| Styling | Tailwind CSS 4 (Oxide engine) | Utility-first CSS |
| Database | Supabase (PostgreSQL + Auth + Storage) | All persistent data |
| State | Zustand (9 stores) + Jotai (3D atoms) | Client state |
| Data Fetching | React Query (@tanstack/react-query) | Server state + caching |
| Validation | Zod | Schema validation |
| Payments | Stripe | Subscriptions (Free/Plus/Forge) |
| AI | Anthropic Claude API | Prompt Lab game + Content Agent |
| 2D Motion | Motion (ex Framer Motion) + GSAP | Transitions, scroll |
| 3D Rendering | React Three Fiber v9 + drei + postprocessing | 3D scenes, shaders (Three.js r171+, TSL, WebGPU/WebGL2) |
| Charts | @nivo/core + @nivo/line + @nivo/bar + @nivo/radar | Data visualization |
| Audio | Tone.js | Game audio feedback |
| Monitoring | Sentry (@sentry/nextjs) | Error tracking + performance |
| Testing | Vitest + Playwright + MSW | Unit, integration, E2E tests |
| Deployment | Vercel | Production hosting |

### Current State

- **Documentation:** COMPLETE — 94 active project files
- **v3-FINAL patches:** 16 documents (38 part files), 64 locked decisions (48 core + 4 OD + 12 CPA2)
- **Games:** 35 total — 6 Flagship (full 3D, 10M tris), 9 FL-Lite (immersive 3D, 2M tris), 20 Standard (themed 3D, 500K tris)
- **Code written:** ~70% — Stages 1-7 code-complete, audited

---

## 2. AUTONOMY RULES

### What Claude Code CAN Do Without Asking

- Create files and folders per stage documents
- Install npm packages specified in stage documents
- Run `npm run build` and `npm run dev` for validation
- Fix TypeScript errors, import errors, and build errors using the error handling guide (Section 10)
- Auto-resolve minor file path discrepancies using project conventions (log the change)
- Run git commits per the commit strategy (Section 4)
- Proceed to next part/stage after successful validation
- Create PROGRESS.md and update it after each part completion
- **Update stage document `.md` files** with minor-to-moderate code fixes (see Section 3.1 — Stage Document Modification Policy)

### SOFT STOPS — Pause, Assess, Auto-Fix, Continue If Resolved

A soft stop means: **log the issue, attempt to fix it, and continue if the fix resolves the problem.** If the fix does NOT resolve it after 2 attempts, escalate to a HARD STOP.

| Trigger | Action |
|---------|--------|
| `npm run build` fails with TypeScript errors | Attempt auto-fix (see Section 10). Log fix in PROGRESS.md. Continue if build passes. |
| `npm run build` fails with import/module errors | Check path conventions (Section 8). Fix import. Continue if resolved. |
| Console warnings (non-blocking) | Log in PROGRESS.md. Continue. |
| Stage document file path doesn't match prior stage output | Flag discrepancy, propose fix using project conventions, continue if confident. Log in PROGRESS.md. |
| A file referenced in stage doc already exists from earlier stage | Check if it should be REPLACED or APPENDED. Stage docs will specify. Default: replace. |
| Minor CSS/layout discrepancy between expected and actual | Log in PROGRESS.md, continue. Visual review happens at stage-level HARD STOP. |
| npm package version conflict | Install the version specified in stage doc. If conflict persists, use `--legacy-peer-deps`. Log it. |

### HARD STOPS — Wait for Human Input

A hard stop means: **STOP ALL WORK. Output a clear status message. Wait for the human to respond before continuing.**

| ID | Trigger | When | What to Tell Human |
|----|---------|------|--------------------|
| HS-1 | Supabase project setup | Before Stage 2 Part 1 | "HARD STOP: I need your Supabase project URL, anon key, and service role key added to `.env.local` before I can proceed with Stage 2." |
| HS-2 | Stripe account setup | Before Stage 8 Part 1 | "HARD STOP: I need your Stripe test-mode API keys and 4 price IDs (Plus monthly, Plus yearly, Forge monthly, Forge yearly) added to `.env.local`." |
| HS-3 | Anthropic API key | Before Stage 9 Part 1 | "HARD STOP: I need your `ANTHROPIC_API_KEY` added to `.env.local`." |
| HS-4 | Vercel deployment | Before Stage 10 deploy step | "HARD STOP: I need you to create a Vercel account, connect the GitHub repo, and configure environment variables in the Vercel dashboard." |
| HS-5 | Stage-level visual verification | After completing ALL parts of a stage | "VISUAL CHECKPOINT — Stage N complete. Please run `npm run dev`, open localhost:3000, and verify: [specific checklist]. Reply 'approved' to continue or describe issues." |
| HS-6 | Build failure after 2 auto-fix attempts | Any time | "HARD STOP: Build is failing and I've exhausted auto-fix attempts. Here's the error: [error]. Here's what I've tried: [attempts]. Please advise." |
| HS-7 | Supabase SQL execution | Stage 2 Part 1 (DB schema) | "HARD STOP: Please run the following SQL blocks in your Supabase SQL Editor in order. Reply 'done' when complete." |
| HS-8 | GLB/3D asset creation | Stage 6B (Pet Trainer) | "SOFT NOTE: Pet Trainer will use procedural fallback (orb) until GLB assets are placed in `public/models/pets/`. This is non-blocking — game is fully playable." |
| HS-9 | Hero-to-Cockpit handoff verification | After Phase 5D (Cockpit Architecture Part 2) | "HARD STOP: Hero Animation + Cockpit Architecture complete. Please verify: (1) 8-phase hero animation plays on first visit, (2) Fast-forward (click/Enter/Space) accelerates to 4x, (3) Skip toggle works in Settings, (4) Hero→cockpit handoff is seamless (no canvas swap, no flash), (5) Cockpit spatial dashboard renders with holographic lab map, (6) Lab entry wormhole transition works, (7) Mobile shows CSS fallback (no R3F). Reply 'approved' to continue to Stage 4." |
| HS-10 | Login 3D + Demo Login verification | After Phase 5F (Login Enhancement Part B) | "HARD STOP: Login 3D Enhancement complete. Please verify: (1) 3D crystal portal renders behind login card on desktop, (2) Chrome bezel glow pulses on login card, (3) Demo Login button visible with confirmation flow, (4) Demo starts and redirects to /home with hero animation, (5) Demo banner shows countdown timer at top of dashboard, (6) Banner turns red/urgent when <5 min remain, (7) Expired modal appears when timer hits 0:00, (8) Mobile shows CSS particle fallback (no 3D canvas), (9) ?demo=expired shows amber notification on login page. Reply 'approved' to continue to Stage 4." |

### Escalation Rules

- **1st auto-fix attempt fails** → Try a different approach
- **2nd auto-fix attempt fails** → HARD STOP. Show error + both attempted fixes. Ask human.
- **3 or more files failing in same part** → HARD STOP. Possible document discrepancy.
- **Runtime error (not build error)** → Log it, continue building. Flag at stage visual checkpoint.

---

## 3. DOCUMENT HIERARCHY

Claude Code should reference these documents in this priority order:

| Priority | Document | Location | Purpose |
|----------|----------|----------|---------|
| 1 | **This file (CLAUDE.md)** | Repo root | Architecture, rules, autonomy boundaries |
| 2 | **Stage document (v3-FINAL or v2)** | `docs/` folder | Complete copy-paste code for current stage |
| 3 | **Master Directory v1.2** | `docs/00-reference/` | 26-phase flow map, file registry |
| 4 | **GCUD V10.2** | `docs/00-reference/` | Source of truth for game content + status |
| 5 | **Master Implementation Guide v3.2** | `docs/00-reference/` | Stage overviews + file lists |
| 6 | **Decision Lock Checkpoints 1-3** | `docs/01-decisions/` | 64 locked decisions (48 core + 4 OD + 12 CPA2) — decisions embedded in stage docs |
| 7 | **CPA v2.0 (Cockpit Architecture)** | `docs/00-reference/` | 3D Panoramic Cockpit full spec, CPA2 decisions, triangle budgets (absorbs Visual Enhancement Concept v2) |
| 7a | **Cockpit CPA2 Stage Docs** | `docs/stage3-auth-layout/` | `COCKPIT_CPA2_v3FINAL_PartA.md` + `PartB.md` — buildable code for Phases 5C–5D |
| 8 | **Hero Animation v2.0** | `docs/00-reference/` | 8-phase cinematic spec + implementation plan |
| 8a | **Hero Animation Stage Docs** | `docs/stage3-auth-layout/` | `HERO_ANIMATION_v3FINAL_PartA.md` + `PartB.md` — buildable code for Phases 5A–5B |
| 8b | **Login 3D Enhancement Stage Docs** | `docs/stage3-auth-layout/` | `LOGIN_3D_v3FINAL_PartA.md` + `PartB.md` — buildable code for Phases 5E–5F (3D login portal, Demo Login feature) |
| 9 | **Per-Stage Playbooks** | `docs/00-reference/` | Full build playbooks for all stages including Hero + Cockpit + Login 3D (extracted from CLAUDE.md Section 5) |
| 10 | **3D Component Registry** | `docs/00-reference/` | 60+ component registry with tiers/budgets (extracted from CLAUDE.md Section 9) |
| 11 | **Known Compat Notes** | `docs/00-reference/` | Version-sensitive package flags |
| 12 | **Testing Guide** | `TESTING.md` (repo root) | Testing pyramid, API/component/E2E tests, pre-deploy checklist |
| 13 | **Feature Workflow Guide** | `Feature-Workflow-Test.md` (repo root) | Build-test-integrate cycle, feature sizing, version control per feature |
| 14 | **Database Patterns Guide** | `database-patterns.md` (repo root) | Supabase/RLS patterns, schema design, validation, seeding, performance |
| 15 | **SparkForge Agent Playbook** | `SparkForge-agent.md` (repo root) | Autonomous evaluation sweeps, admin approval workflow, apply-test-report cycle |
| 16 | **Error Handling & Auto-Fix Guide** | `docs/00-reference/` | Build/TS/import error patterns and auto-fix strategies |
| 17 | **Quick Reference: 35 Games** | `docs/00-reference/` | Full game table (extracted from CLAUDE.md, canonical in GCUD V10.2) |
| 18 | **Enhancement Blueprint v1.0** | Repo root | 12-section visionary upgrade plan (Enh 1.0–1.2+) |

### Build Strategy: Read File Prior to Usage. Certain v2 documents need to be developed prior to v3, and certain v3 should be developed before their v2 counterparts. 

All docs containing "stage or Stage" should be read and evaluated for development order. Certain stages require v2 docs tk be developed first, while others may require v3 docs to be developed forst. Always read documents prior to development. 

### 3.1 Stage Document Modification Policy

Stage documents in `docs/` are **living documents** — they should always contain the most current, buildable code. Claude Code acts as the **primary code reviewer** during development and is responsible for keeping stage docs accurate. If updates to code and or documentation occur during development, periodically commit updates to ensure all files are up to date. 

#### AUTO-FIX (No Approval Needed)

Claude Code **MUST** update stage `.md` files without asking when any of the following are encountered during a build:

| Category | Examples | Action |
|----------|----------|--------|
| **Package API changes** | Zod v3→v4 method renames, Stripe apiVersion string, Supabase auth param changes | Update code snippets in the stage doc to match installed package version |
| **TypeScript type fixes** | Missing type annotations, `as const` inference issues, undefined narrowing | Fix the code in the stage doc so it compiles clean |
| **Import path corrections** | Wrong relative path, missing named export, package rename | Correct the import in the stage doc |
| **ESLint / linter fixes** | Unused vars, missing eslint-disable, formatting | Update code to pass linting |
| **Missing dependencies** | Package used in code but not listed in install step | Add to the install command in the stage doc |
| **Deprecated API usage** | React, Next.js, or library API deprecations | Update to current API |

**When auto-fixing a stage doc, Claude Code MUST:**
1. Make the fix in the stage `.md` file
2. Log the change in `PROGRESS.md` under "Discrepancies Log" with: stage doc name, what changed, why
3. Note the original code vs. the updated code for traceability

#### REQUIRES HUMAN APPROVAL (Hard Stop)

The following changes to stage documents require explicit approval before modifying:

| Category | Examples | Why |
|----------|----------|-----|
| **App structure changes** | New routes, new components, new directories not in original doc | Affects architecture |
| **Feature additions/removals** | Adding capabilities, removing game features, changing game mechanics | Affects product scope |
| **Visual/UX changes** | Different layout, changed animations, new color values, font changes | Affects design intent |
| **Database schema changes** | New columns, changed types, altered RLS policies | Affects data model |
| **State management changes** | New stores, changed store shape, new context providers | Affects app architecture |
| **3D/shader changes** | New 3D components, changed triangle budgets, different materials | Affects performance + design |
| **Business logic changes** | Tier limits, pricing, age-band content, game scoring | Affects product behavior |

**When proposing a structural change:**
```
STAGE DOC CHANGE REQUEST — [doc name]
Category: [structural / visual / feature / schema]
Current: [what the doc says now]
Proposed: [what it should say]
Reason: [why the change is needed]
Impact: [what else this affects]
Please reply 'approved' or describe concerns.
```

#### Code Review Role

Claude Code serves as the **primary code reviewer** during development:
- **During builds:** Flag code quality issues, potential bugs, security concerns, and performance problems found in stage document code
- **After builds:** Note any patterns that should be improved in future stages
- **Cross-stage consistency:** Ensure shared interfaces, type definitions, and utility usage stay consistent across stage docs
- **Review log:** Append review notes to PROGRESS.md under a "Code Review Notes" section when non-trivial observations arise

Review feedback should be practical and actionable — not stylistic nitpicking. Focus on:
- Bugs that would cause any type of failures
- Security issues (injection, auth bypass, data exposure)
- Type safety gaps that bypass TypeScript's protections
- Performance issues (N+1 queries, unnecessary re-renders, bundle size)
- Inconsistencies between stages that would cause integration failures

### 3.2 Superseded Document Policy

When a v3-FINAL document fully replaces a v2 document (or an earlier v3 draft), the outdated file **must be archived** to prevent accidental use of incorrect code. This is a **mandatory step** during every post-.md-creation stage audit.

#### Archive Structure

```
docs/stageN-name/
├── _SUPERSEDED/
│   ├── SUPERSEDED_BY.md        ← Manifest: what replaced what + why
│   ├── old_file_v2.md          ← Archived (preserved, never used for build)
│   └── old_draft_v3.md         ← Archived (preserved, never used for build)
├── ACTIVE_v3FINAL_PartA.md     ← Build source
├── ACTIVE_v3FINAL_PartB.md     ← Build source
└── README.md
```

#### Rules

| Rule | Description |
|------|-------------|
| **`_SUPERSEDED/` folder** | Create in any stage directory that contains superseded files. The `_` prefix sorts it first for visibility. |
| **`git mv` only** | Always use `git mv` to move files — preserves git history. Never copy-delete. |
| **`SUPERSEDED_BY.md` manifest** | Required in every `_SUPERSEDED/` folder. Must document: superseded file, replacement file, reason, and date. |
| **DO NOT USE warning** | Manifest must include a prominent warning listing the specific bugs/issues in the superseded code. |
| **Active documents list** | Manifest must list the correct build-order documents with their game coverage. |
| **REFERENCE ONLY files** | Debug fix logs, review notes, and other non-buildable documents stay in the main folder but get a `## REFERENCE ONLY — NOT A BUILD SOURCE` header. |

#### When to Archive

Archiving is triggered during these events:

| Trigger | Action |
|---------|--------|
| **v3-FINAL submitted that explicitly supersedes v2** | Move v2 to `_SUPERSEDED/`, create manifest |
| **v3-FINAL split (A/B/C) replaces earlier monolithic v3 draft** | Move draft to `_SUPERSEDED/`, update manifest |
| **Post-.md-creation audit** (every stage) | Scan for any files whose code is fully covered by newer documents. Archive if confirmed. |
| **Store API or pattern audit reveals unfixed files** | If a superseded file contains known bugs (e.g., `game.addScore`) and will never be fixed, archive it |

#### Verification Before Archiving

Before moving any file to `_SUPERSEDED/`, verify:

1. **Every game file** created by the old document is also created (or replaced) by the new document
2. **All game features** (phases, age bands, ARIA labels, particles, chrome bezel) are present in the replacement
3. **The new document uses correct store API** (`updateScore`, `advanceRound`, `startGame`, `completeGame`)
4. **No unique code exists** in the old file that isn't covered by the new one

If a v3-FINAL is **additive** (layers on top of v2 rather than replacing it), the v2 is **NOT superseded** — it remains a prerequisite. Example: Stage 6D v3-FINAL adds 3D to the v2 base game, so both are required.

#### Current Archive Status

| Stage | Archived Files | Active Files |
|-------|---------------|-------------|
| 7B | 3 files → `_SUPERSEDED/` | `v3FINAL_PartA`, `v3FINAL_PartB`, `v3FINAL_PartC` |
| 7C | 3 files → `_SUPERSEDED/` | `Part1` (v2), `Part2` (v2), `v3FINAL_PartA`, `v3FINAL_PartB`, `v3FINAL_PartC` |
| 6F | 0 (DebugFixes marked REFERENCE ONLY) | `v3FINAL_A`, `v3FINAL_B`, `v3FINAL_C`, `DebugFixes` (ref) |
| 6D | 0 (v2 is prerequisite, not superseded) | `v2_PromptLab`, `v2_Enhancements`, `v3FINAL_PartA`, `v3FINAL_PartB` |
| 3 (src) | `CrystalShatter.tsx` → `src/components/3d/_SUPERSEDED/` | `HeroAnimation.tsx` (full 8-phase replacement), `CrystalHero.tsx` (retained, Decision 8.1) |

---

## 4. BUILD EXECUTION PLAN
**Note:** A majority of the code was developed remotely via claude code committing to Github. At time of local terminal development, Claude Code shall dynamically review all local files cloned from Github. Claude code shall audit, enhance, and or fix any files, and or code during stage by stage development. CRITICAL: During local terminal development, claude code is not to re-write any code, unless explicitly directed by user, but rather use all existing code while auditing for errors, and or improvement opportunities.
**Note:** During local development, when Claude Code is auditing, and or building, any updates tk existing code, or files should be committed to local and remote repositories. Ask user for clarification on where to commit to on Github and locally. 
### Implementation Order 

Always evaluate local and or remote files to assess if new/updated documents have been added. Development should always be conducted dynamically, reviewing files prior to moving to next applicable stage or section in development.

| Phase | Stage | Source Documents | v3? | Hard Stops |
|-------|-------|-----------------|-----|------------|
| 1 | Stage 1 Part 1 | STAGE1_Foundation_v2_PART1 | No | — |
| 2 | Stage 1 Part 2 | STAGE1_Foundation_v2_PART2 | No | — |
| 3 | Stage 2 Parts 1-4 | STAGE2_Database_API_v2_PART1-4 | No | HS-1, HS-7 |
| 4 | Stage 3 Parts 1-2 | STAGE3_Auth_Layout_Shell_v2_PART1-2 | No | — |
| 5 | Stage 3 Part 3 | STAGE3_Part3A/B_v3FINAL | YES | — |
| **5A** | **Hero Animation Part 1** | **HERO_ANIMATION_v3FINAL_PartA** (stores, infrastructure, shaders) | **YES** | — |
| **5B** | **Hero Animation Part 2** | **HERO_ANIMATION_v3FINAL_PartB** (particle system, audio, orchestrator) | **YES** | HS-5 |
| **5C** | **Cockpit Architecture Part 1** | **COCKPIT_CPA2_v3FINAL_PartA** (CockpitCanvas, CameraSystem, panel geometry) | **YES** | — |
| **5D** | **Cockpit Architecture Part 2** | **COCKPIT_CPA2_v3FINAL_PartB** (spatial dashboard, HUD, transitions, audio, polish) | **YES** | HS-5, HS-9 |
| **5E** | **Login 3D Enhancement Part 1** | **LOGIN_3D_v3FINAL_PartA** (3D portal scene, particles, demo session infra, auth store, auth layout) | **YES** | — |
| **5F** | **Login 3D Enhancement Part 2** | **LOGIN_3D_v3FINAL_PartB** (enhanced login page, demo guard, demo banner, AuthProvider integration) | **YES** | HS-5, HS-10 |
| 6 | Stage 4 Parts 1+3 | STAGE4_Core_Pages_v2_PART1+3 | No | — |
| 7 | Stage 4 Part 2 | STAGE4_Part2_v3FINAL_A/B | YES | — |
| 8 | Stage 5 Part 1 | STAGE5_Gamification_Profile_PART1 | No | — |
| 9 | Stage 5 Parts 2-3 | STAGE5_Parts23_v3FINAL_A/B/C | YES | — |
| 10 | Stage 6B | STAGE6B_v3FINAL_A/B | YES | HS-8 (soft) |
| 11 | Stage 6C | STAGE6C_v3FINAL_A/B | YES | — |
| 12 | Stage 6D | STAGE6D_v3FINAL_A/B | YES | — |
| 13 | Stage 6E | STAGE6E_v3FINAL_A/B/C | YES | — |
| 14 | Stage 6F | STAGE6F_v3FINAL_A/B/C | YES | — |
| 15 | Stage 7A (9 games) | STAGE7A_Batch + Parts 2-4 | No | — |
| 16 | Stage 7B (4 games) | STAGE7B_v3FINAL_A/B/C | YES | — |
| 17 | Stage 7C (4 games v2) | STAGE7C_Part1 + Part2 | No | — |
| 18 | Stage 7C (2 games v3) | STAGE7C_v3FINAL_A/B/C | YES | — |
| 19 | Stage 7D (5 games) | STAGE7D_Part1(v2) + v3FINAL_A/B/C | Mixed | — |
| 20 | Stage 7E (3 games) | STAGE7E_Part1 + Part2 | No | — |
| 21 | Stage 7F (3 games) | STAGE7F_v3FINAL_A/B + Part1(v2) + Part2(v2) | Mixed | — |
| 22 | Stage 7 Shared | STAGE7_Shared_v3FINAL_A + XP_Celebration(v2) | Mixed | — |
| 23 | Stage 8 Parts 1-2 | STAGE8_Parent_Dashboard_v2_PART1-2 | No | HS-2 |
| 24 | Stage 8 Part 3 | STAGE8_P3_v3FINAL_A/B/C | YES | — |
| 25 | Stage 9 Parts 1-3 | STAGE9_Content_Agent_v2_PART1-3 | No | HS-3 |
| 26 | Stage 10 Parts 1-2 | STAGE10_Polish_Deploy_v2_PART1-2 | No | HS-4 |

#### Phase 5A–5B: Hero Animation (after Stage 3 Part 3)

The Hero Animation replaces `CrystalShatter.tsx` with an 8-phase cinematic sequence. It must be built **immediately after Stage 3 Part 3** because:
1. Stage 3 Part 3 creates the StationFrame shell and CrystalShatter — Hero Animation replaces CrystalShatter
2. The unified `CockpitCanvas` (CPA2-1) is established here, which ALL subsequent stages render inside
3. Stage 4+ pages depend on the cockpit wrapper being in place

**Phase 5A — Hero Animation Part 1: Stores, Infrastructure & Shaders**
- **Source:** `HERO_ANIMATION_v3FINAL_PartA.md` + `Implementation_Plan_Hero_Page_Animation_v2.0.md` (Phases A–C)
- **Files created:** `webgpuDetection.ts`, `crystallineLogo.vert`, `crystallineLogo.frag`, `electricVeins.frag`, `voronoiShatter.comp`, `voronoiFracture.ts`, `heroSplines.ts`
- **Files modified:** `uiStore.ts` (+skipIntroAnimation), `deviceStore.ts` (+gpuTier, +stripeCount)
- **Packages:** `three-bvh-csg`, `three-mesh-bvh`, `troika-three-text`

**Phase 5B — Hero Animation Part 2: Particles, Audio & Orchestrator**
- **Source:** `HERO_ANIMATION_v3FINAL_PartB.md` + `Implementation_Plan_Hero_Page_Animation_v2.0.md` (Phases B, D–E)
- **Files created:** `heroParticleCompute.ts`, `heroParticleRender.ts`, `heroAudio.ts`, `useHeroAnimation.ts`, `HeroAnimation.tsx`
- **Archives:** `CrystalShatter.tsx` → `src/components/3d/_SUPERSEDED/` (Decision 8.1: CrystalHero.tsx retained)
- **Hard Stop:** HS-5 — Visual verification of 8-phase hero animation sequence

#### Phase 5C–5D: 3D Panoramic Cockpit Architecture (CPA v2.0)

The Cockpit Architecture transforms the StationFrame shell into a full 3D command bridge. It must follow Hero Animation because:
1. CPA2-3 (Seamless Handoff) requires hero animation's final frame to transition into the live cockpit
2. `CockpitCanvas.tsx` (created in 5A/5B) is the single persistent canvas that cockpit geometry renders into
3. The 20M triangle budget cockpit components need the canvas + camera system in place

**Phase 5C — Cockpit Architecture Part 1: Canvas, Camera & Shell Geometry**
- **Source:** `COCKPIT_CPA2_v3FINAL_PartA.md` + `3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md` (Sections 2–4)
- **Files created/upgraded:** `CockpitCanvas.tsx` (camera [0,0.65,1.1]), `CameraSystem.tsx`, `CockpitPanels.tsx` (4M tris, 218° arc, r=4.8), `SidePanels.tsx` (3M, at [±2.35,0.25,-1.65]), `LEDRim.tsx` (500K, 1500 LEDs, emissive 3.0), `HolographicHUD.tsx` (1M), `StatusBar3D.tsx` (1M, at [0,-1.25,-1.95]), `CockpitStructuralDetail.tsx` (2M), `CockpitFloor3D.tsx` (1M)
- **Files modified:** `StationFrame.tsx` (→ thin wrapper), `SpatialDashboard.tsx` (→ thin wrapper)
- **Store updates:** `cockpitStore.ts` (spatial nav, skins, heroPhase), `cockpitConfig.ts` (TRIANGLE_BUDGET_V2)

**Phase 5D — Cockpit Architecture Part 2: Spatial Content, Transitions & Audio**
- **Source:** `COCKPIT_CPA2_v3FINAL_PartB.md` + `3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md` (Sections 5–17)
- **Files created/upgraded:** `HolographicLabMap.tsx` (1M), `InteractiveConsole3D.tsx` (2M), `AmbientNPCs.tsx` (1.5M), `DynamicEnvironment.tsx` (3M), `VolumetricFog3D.tsx` (500K), `CeremonyFX.tsx` (500K), `WormholeTransition.tsx` (300K), `MiniMapOverlay3D.tsx` (250K), `CockpitSkinManager.tsx`, `CockpitAudioEngine.ts`, `useCockpitAudio.ts`
- **Hard Stop:** HS-9 — Visual verification of full cockpit (hero → cockpit handoff, spatial dashboard, lab transitions)
- **Hard Stop:** HS-5 — Stage-level visual checkpoint

#### Phase 5E–5F: Login 3D Enhancement + Demo Login (after Cockpit Architecture)

The Login 3D Enhancement transforms the flat login/signup pages into an immersive 3D laboratory entrance with a crystal portal, animated particles, and chrome-bezel UI. It also adds a **Demo Login** feature allowing users to explore the full platform for 1 hour without creating an account. It must follow Cockpit Architecture because:
1. Demo users are redirected to `/home` which triggers the Hero Animation and Cockpit — these must be in place
2. The `DemoGuard` component wraps the dashboard layout which depends on `StationFrame` and `CockpitCanvas`
3. The Demo Login banner sits above the cockpit z-index layer

**Phase 5E — Login 3D Enhancement Part 1: 3D Scene, Demo Infrastructure & Auth Layout**
- **Source:** `LOGIN_3D_v3FINAL_PartA.md`
- **Files created:** `src/lib/demo-session.ts`, `src/components/3d/LoginPortal3D.tsx`, `src/components/3d/LoginParticles3D.tsx`, `src/components/auth/DemoLoginButton.tsx`, `src/components/auth/DemoSessionBanner.tsx`, `src/app/api/auth/demo/route.ts`
- **Files modified:** `src/stores/authStore.ts` (+isDemoMode, +demoSession, +startDemoSession, +endDemoSession, +checkDemoStatus), `src/app/(auth)/layout.tsx` (REPLACE — add 3D canvas layer)

**Phase 5F — Login 3D Enhancement Part 2: Enhanced Login, Demo Guards & Integration**
- **Source:** `LOGIN_3D_v3FINAL_PartB.md`
- **Files created:** `src/hooks/useDemoSession.ts`, `src/components/auth/DemoGuard.tsx`, `src/components/auth/LoginFormCard.tsx`
- **Files modified:** `src/app/(auth)/login/page.tsx` (REPLACE — enhanced with Demo Login button), `src/components/providers/AuthProvider.tsx` (MODIFY — demo session hydration), `src/app/(dashboard)/layout.tsx` (MODIFY — add DemoGuard + DemoSessionBanner)
- **Hard Stop:** HS-10 — Visual verification of 3D login, demo session flow, expiry modal
- **Hard Stop:** HS-5 — Stage-level visual checkpoint

### Per-Part Workflow

For EACH part listed above:

```
1. READ the stage document for the part
2. CREATE folders specified (mkdir/New-Item commands)
3. CREATE files in order, copying code exactly
4. RUN: npm run build
5. RUN: npx tsc --noEmit (TypeScript check)
6. CHECK: dev tools console for errors (if dev server running)
7. IF build passes → git commit (see Commit Strategy)
8. IF build fails → Soft Stop auto-fix (see Section 10)
9. UPDATE PROGRESS.md with part status
10. PROCEED to next part
```

### Visual Verification (Stage-Level)

After completing ALL parts of a stage, trigger **HS-5**:

```
VISUAL CHECKPOINT — Stage [N] Complete

Build status: PASS ✓
TypeScript: PASS ✓
Console errors: [none / list]

Please verify visually at localhost:3000:
- [ ] [stage-specific checklist items]

Reply 'approved' to continue to Stage [N+1], or describe issues.
```

**Stage-specific visual checklists:**

| Stage | What to Verify |
|-------|---------------|
| 1 | Dev server starts, no errors in console |
| 2 | API routes respond (test /api/health), Supabase connected |
| 3 | Signup → Login → Dashboard loads with sidebar. Station frame visible (Part 3). |
| 3-Hero | 8-phase hero animation plays (19s). Fast-forward works (4x). Skip toggle in Settings. WebGPU/WebGL2/CSS fallback chain. Audio plays (mutable). `prefers-reduced-motion` skips to cockpit. |
| 3-Cockpit | Cockpit renders at 20M tris (desktop). Hero→cockpit seamless handoff (CPA2-3). Spatial dashboard with holographic lab map. 4 consoles, NPCs, dynamic environment. Wormhole transitions. Mobile CSS fallback. |
| 3-Login3D | 3D crystal portal behind login card (desktop). Chrome bezel glow pulses. Demo Login button with confirmation. Demo → /home with hero animation. Timer banner at dashboard top. Urgent mode at <5min. Expiry modal at 0:00. Mobile CSS particles. ?demo=expired amber notice. |
| 4 | Dashboard home, Labs map, Profile page. Lab reconfiguration transitions work. |
| 5 | XP popup, streak fire, badge displays, trophy room. 3D particle effects on desktop. |
| 6 | All 5 flagship games playable: full phase cycle (welcome→learn→play→complete). 3D visible on desktop. |
| 7 | All 30 remaining games playable. Game registry shows 35 entries. Arcade page lists all. |
| 8 | Parent dashboard, subscription flow, pricing page with scroll journey. Stripe test checkout works. |
| 9 | Content agent produces content via admin trigger. Admin review dashboard shows items. |
| 10 | Accessibility toolbar, PWA install, Lighthouse audit. All routes resolve. Production build clean. |

### Commit Strategy

**Per-part commits with milestone tags at stage completion.**

```bash
# Per-part commit
git add -A
git commit -m "Stage 3 Part 2: Dashboard shell, sidebar, TopBar"

# Stage milestone tag (after ALL parts + visual approval)
git tag -a v0.3.0 -m "Stage 3 complete: Auth + Layout + Station Frame"
```

**Tag format:** `v0.{stage}.0` (e.g., `v0.1.0`, `v0.2.0`, ... `v0.10.0`)

---

## 5. PER-STAGE PLAYBOOKS (CRITICAL: Always Evaluate local and or remote documents for potential new additions or modifications.)

**Full playbooks:** `docs/00-reference/Per-Stage-Playbooks.md`

| Stage | Source | Parts | Hard Stops | Tag |
|-------|--------|-------|------------|-----|
| 1 Foundation | v2 PART1-2 | 2 | — | v0.1.0 |
| 2 Database/API | v2 PART1-4 | 4 | HS-1, HS-7 | v0.2.0 |
| 3 Auth/Layout/Frame | v2 P1-2 + v3 P3A/B | 4 | HS-5 | v0.3.0 |
| **3-Hero** Hero Animation | HERO_ANIMATION_v3FINAL_A/B | 2 | HS-5 | v0.3.1 |
| **3-Cockpit** Cockpit CPA2 | COCKPIT_CPA2_v3FINAL_A/B | 2 | HS-5, HS-9 | v0.3.2 |
| **3-Login3D** Login 3D + Demo | LOGIN_3D_v3FINAL_A/B | 2 | HS-5, HS-10 | v0.3.3 |
| 4 Core Pages/Labs | v2 P1+3 + v3 P2A/B | 4 | HS-5 | v0.4.0 |
| 5 Gamification/FX | v2 P1 + v3 A/B/C | 4 | — | v0.5.0 |
| 6 Flagship (5 games) | All v3-FINAL | 12 | HS-8, HS-5 | v0.6.0 |
| 7 Remaining (30 games) | Mixed v2 + v3 | 20+ | — | v0.7.0 |
| 8 Parent Dashboard | v2 P1-2 + v3 A/B/C | 5 | HS-2, HS-5 | v0.8.0 |
| 9 Content Agent | v2 PART1-3 | 3 | HS-3 | v0.9.0 |
| 10 Polish/Deploy | v2 PART1-2 | 2 | HS-4, HS-5 | v0.10.0 |

---

## 6. DESIGN SYSTEM — FROST-PRISMATIC

**Mode:** Dark-mode only. **Rule:** Blue-dominant 60/40 (60% blue, 40% accent pops).

### Colors

**Neon Accents:** blue `#00BBFF` (PRIMARY 60%), green `#00FF88`, purple `#AA66FF`, orange `#FF6644`, amber `#FFAA44`
**Surfaces:** base `#0A0E16`, card `#111118`, elevated `#1A1822`, border `rgba(255,255,255,0.06)`
**Chrome Bezel:** edge 0.06, highlight 0.12, specular 0.18 (all white alpha)
**Lab Colors:** L1 `#00BBFF`, L2 `#AA66FF`, L3 `#FF66AA`, L4 `#FFAA44`, L5 `#00FF88`, L6 `#FF6644`, L7 `#06B6D4`, L8 `#818CF8`, L9 `#F97316`, L10 `#D946EF`

### Fonts (AUTHORITATIVE — BUG-10F)

| Role | Font | CSS Class |
|------|------|-----------|
| Display/Headers | Exo 2 | `font-display` |
| Body Text | Sora | `font-body` |
| Monospace/Code | JetBrains Mono | `font-mono` |
| Data/Numbers | Orbitron | `font-data` |

**NEVER use Fredoka or Nunito Sans.** These were from the original build prompt and are incorrect.

---

## 7. GAME ARCHITECTURE TEMPLATE

Every game follows this pattern:

```typescript
'use client';
// Required: useState, useMemo, motion, AnimatePresence
// Required: GameShell, useGameStore, useChildStore

type Phase = 'welcome' | 'learn' | 'play' | 'complete';

// Age band from child profile
const ageBand = useChildStore(s => s.activeChild?.age_band) || 'B';

// Game completion → XP + celebration overlay
game.completeGame();
```

### Required Features (ALL 35 games)

- Chrome bezel + LED rim wrapper
- 12-15 particles (lab-colored) — R3F for all tiers (D3D-1: desktop-only)
- Welcome phase with animated entrance
- Age-band differentiated content (A/B/C)
- ARIA labels on all interactive elements
- Complete phase triggers `game.completeGame()`

### 3D Integration Pattern (v3-FINAL games only)

```typescript
const Component3D = dynamic(
  () => import('@/components/3d/Name3D'),
  { ssr: false }
);

// 3D always renders — desktop-only (D3D-1)
<Component3D {...props} />
```

---

## 8. FILE & FOLDER CONVENTIONS

### Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `EmojiDecoderGame.tsx` |
| Game components | `src/components/games/NameGame.tsx` | `PetTrainerGame.tsx` |
| 3D components | `src/components/3d/Name3D.tsx` | `NeuralNetwork3D.tsx` |
| 3D environments | `src/components/3d/environments/NameEnvironment.tsx` | `AiSpyEnvironment.tsx` |
| Procedural 3D | `src/components/3d/environments/procedural/ProceduralName.tsx` | `ProceduralTerrain.tsx` |
| Stores | camelCase | `authStore.ts` |
| API routes | `src/app/api/resource/route.ts` | `src/app/api/children/route.ts` |
| Hooks | camelCase with `use` prefix | `useGSAPScroll.ts` |
| Shaders | `src/shaders/labPatternN.glsl` | `labPattern3.glsl` |

### Terminology

| Context | Use |
|---------|-----|
| UI text | **Lab** |
| Database columns | **world** |
| API params | **world** |
| Hook names | **Lab** (e.g., useLabContent) |
| Store properties | **labColor** |
| Types/constants | **WORLDS** |

---

## 9. 3D ARCHITECTURE RULES

- **ALL** R3F/Three.js components go in `src/components/3d/`
- **ALL** must use `dynamic(() => import(...), { ssr: false })`
- `next.config.ts` externalizes Three.js from server builds via `serverExternalPackages`
- **Desktop-only rendering (D3D-1)** — no mobile/tablet code paths
- **All effects always-on (D3D-5)** — no conditional postprocessing
- **Single persistent Canvas (D3D-B1)** — CockpitCanvas never unmounts
- **Scene management via sceneStore (D3D-B5)** — centralized visibility control
- **Mechanical iris transitions (D3D-B2)** — cockpit-to-game via MechanicalIris
- **Triangle budgets: Flagship 20M, FL-Lite 10M, Standard 5M, System 30M (D3D-3)**
- Materials: `MeshToonMaterial` (pets), `MeshStandardMaterial` (chrome), custom GLSL
- Environment: `frost-prismatic.hdr` in `public/hdri/`
- 11 PBR presets in `lib/3d/materials.ts`
- 10 GLSL lab pattern shaders in `src/shaders/`

### 3D Component Registry

**Full registry (93 components):** `docs/00-reference/3D-Component-Registry.md`

| Category | Count | Key Components |
|----------|-------|----------------|
| System/Dashboard | 9 | StationFrame, HeroAnimation, AuroraBackground, SceneRouter, MechanicalIris, PostProcessingStack |
| Flagship (games + envs) | 12 | Pet3DScene, NeuralNetwork3D, PromptBubble3D, AgentPipeline3D, BiasScales3D, SortScene3D + 6 environments |
| FL-Lite (games + envs) | 19 | CodeBlocks3D, ChatbotNodes3D, DataDetective3D, RobotVacuum3D, CameraQuest3D, FutureForge3D, MyFirstAiApp3D, EmojiDecoder3D, AiOrNot3D + 10 environments |
| Standard (environments) | 21 | StandardEnvironmentBase + 20 game-specific environments |
| Procedural Environment | 7 | ProceduralEnvironmentGenerator, ProceduralTerrain, ProceduralSkyDome, ProceduralFog, ProceduralLighting, ProceduralProps, proceduralConfig |
| Cockpit/Enhancement | 24 | CockpitCanvas, CameraSystem, SpatialDashboard, HolographicLabMap, CockpitPanels, SidePanels, StatusBar3D, HolographicHUD, LEDRim, CockpitStructuralDetail, VolumetricFog3D, CockpitFloor3D, CeremonyFX, WormholeTransition, MiniMapOverlay3D, CockpitSkinManager, CockpitAudioEngine |
| **3D UI Components (v3.0)** | **8** | **HolographicButton, RadialDial3D, ToggleSwitch3D, HolographicCard, HolographicPanel, NavigationButtonGrid, VariableDialCluster, CenterViewportScreen** |
| **3D UI Materials** | **1** | **cockpitMaterials.ts (7 factories: alloyFrame, controlPanel, holographic, button, bezel, console, LED)** |
| **3D UI Stores** | **1** | **cockpitBroadcastStore.ts (cross-panel event bus, 16 event types, pulse decay)** |
| Hero Animation | 5 | useHeroAnimation, heroParticleCompute, voronoiFracture, heroSplines, heroAudio |
| Hooks (D3D) | 2 | useParallaxMouse, useInteractiveSurface |
| Audio (D3D) | 1 | irisAudioEngine (+ LAB_COLOR_AUDIO_PROFILES for per-lab sound variations) |
| Stores (D3D) | 1 | sceneStore |
| TSL Shaders (Section 4.1-A) | 12 | 10 lab pattern TSL ports + shared.ts + index.ts (WebGPU-compatible) |
| Camera Utilities (Section 4.1) | 2 | cameraShake (triggerCameraShake + SHAKE_PRESETS), interactiveSurfaceConfig (8 cockpit presets) |

### 9.1 Desktop-Ultra Rendering (D3D-1, D3D-2)

LOD system has been removed (D3D-2). All geometry renders at maximum quality always. No DeviceSelectionModal, no tiered budgets, no useLOD hook. `deviceStore` hardcodes desktop-ultra profile with 50M total triangle budget.

Future mobile support will use R3F-native LOD (Three.js LOD object), not CSS fallbacks.

#### Desktop-Ultra Profile

| Property | Value |
|----------|-------|
| Target FPS | 60 |
| Max Triangles | 50,000,000 (30M cockpit + 20M game) |
| Bloom | Always on |
| Shadows | Always on |
| Pixel Ratio | Native (`window.devicePixelRatio`) |
| SSAO | Always on |
| Chromatic Aberration | Always on |
| Depth of Field | Always on |

#### Performance Monitoring (Audit Section 4.4)

**Plan B1 (IMPLEMENTED):** Non-invasive frame-time monitoring via `useFrameTimeMonitor` hook in CockpitCanvas. Dev-only. Logs console warnings when average frame time exceeds 20ms (< 50fps). Does NOT auto-degrade effects — D3D-5 honored.

**Plan B2 (FUTURE — if persistent performance issues detected):** Adaptive effect degradation. Measure initial 60 frames; if avg > 20ms, disable DepthOfField and reduce N8AO to quarter-res. Implement via `performanceStore` dispatching to `PostProcessingStack` props. Only activate if Plan B1 monitoring shows consistent sub-50fps on target hardware.

### 9.2 Game Tier Definitions (3 tiers)

**Note:** Enhanced Standard tier has been **merged into FL-Lite**. There are now 3 game tiers:

| Tier | Description | 3D | Triangle Budget (D3D-3) | Games |
|------|-------------|-----|------------------------|-------|
| **Flagship** | Full immersive 3D scenes, all effects | Full R3F | 20M (20,000,000) | 6 |
| **FL-Lite** | Immersive 3D with themed environments | Full R3F | 10M (10,000,000) | 9 |
| **Standard** | Immersive 3D environments with themed scenes | Full R3F | 5M (5,000,000) | 20 |

**Total: 6 + 9 + 20 = 35 games.** Flagship includes Sort Toy Box (Full 3D). System (Cockpit) budget: 30M.

### 9.3 3D Panoramic Cockpit Suite (Enhancements 1.0 / 1.1 / 1.2)

The Cockpit Suite transforms SparkForge from a flat dashboard into a **fully immersive 3D command bridge**. It spans three enhancement phases, all documented in dedicated reference docs.

#### Architecture: CPA v2.0 (Single Persistent Canvas)

The **Cockpit Panoramic Architecture v2.0** (`docs/00-reference/3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md`) defines the core pattern:

- **Single `<CockpitCanvas>`** wraps the entire app — R3F Canvas persists across all routes (no remount, no canvas swap)
- **WebGPU primary** renderer via `WebGPURenderer` (async init), **WebGL2 fallback** automatic via TSL compilation
- **Hero Animation** seamlessly transitions INTO the live cockpit — final animation frame IS the first interactive frame
- **Dashboard HTML** renders as z-index overlay on top of the live cockpit scene
- **All cockpit geometry** materializes from shattered logo shards (Phase 6 migration → Phase 7 crystallization)

#### Enhancement Phases

| Phase | Name | Status | Source Document | Scope |
|-------|------|--------|-----------------|-------|
| **Enh 1.0** | Cockpit Panoramic Architecture v1 | Superseded by v2 | `COCKPIT_PANORAMIC_ARCHITECTURE_v1.md` | Initial cockpit shell concept |
| **Enh 1.1** | Spatial Dashboard (CPA v2.0) | IMPLEMENTED | `3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md` | Full spatial environment — holographic lab map, 4 consoles, NPCs, dynamic environment |
| **Enh 1.2** | Cockpit Personalization | PLANNED | `ENHANCEMENT_BLUEPRINT_v1.0.md` §1 | Cockpit skins, custom NPC configurations, user-driven theming |

#### CPA2 Decision Locks (12 decisions)

Decisions CPA2-1 through CPA2-12 govern cockpit architecture. Key decisions:

| ID | Decision | Summary |
|----|----------|---------|
| CPA2-1 | Single Canvas | One persistent R3F Canvas for entire app lifecycle |
| CPA2-2 | WebGPU Primary | WebGPURenderer with WebGL2 auto-fallback via TSL |
| CPA2-3 | Seamless Handoff | Hero animation → cockpit with zero DOM transitions |
| CPA2-4 | Scene Groups | SpatialDashboard as `<group>` within CockpitCanvas, not separate Canvas |

Full decision list in `3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md`.

#### D3D-B Decision Locks (Desktop-First Overhaul)

| ID | Decision | Summary |
|----|----------|---------|
| D3D-B1 | Persistent Canvas | CockpitCanvas never unmounts — uses SceneRouter for visibility |
| D3D-B2 | Mechanical Iris | MechanicalIris replaces WormholeTransition for cockpit-to-game transitions |
| D3D-B3 | Game Scene Groups | Game scenes render as `<group>` inside CockpitCanvas |
| D3D-B4 | SceneRouter | SceneRouter manages visibility of cockpit/game/hero/spatial scenes |
| D3D-B5 | sceneStore | Centralized scene state replaces fragmented state management |
| D3D-B6 | Cockpit Fade | Cockpit fades to 20% opacity during game scenes |

Note: WormholeTransition is retained for lab-to-lab transitions within the spatial dashboard.

#### Cockpit Triangle Budgets (v3.0 — 3D-Embedded UI Upgrade, March 27, 2026)

| Component | Triangles | Notes |
|-----------|-----------|-------|
| CockpitPanels | 4,000,000 | 288-seg curved hull (218° arc, r=4.8), 12 ribs, 768 rivets |
| SidePanels | 3,000,000 | Pulled to [±2.35, 0.25, -1.65], alloy chrome #a8b5c8, radar + terminal |
| HolographicLabMap | 1,000,000 | Multi-layer geodesic shells, data highways, projector pedestal |
| LabStructure3D (10 labs) | 3,000,000 | 300K/lab: subdivision surfaces, interior mechanisms, dioramas |
| InteractiveConsole3D (4) | 3,000,000 | 750K/console: multi-part housing, projector base, instrument cluster |
| AmbientNPCs (8 bots) | 2,000,000 | 250K/bot: articulated body, facial animation, finger grippers |
| DynamicEnvironment | 3,000,000 | Volumetric fog, environmental props, weather effects |
| HolographicHUD | 1,000,000 | 8 concentric rings, data arcs, reticle, volumetric scan beams |
| StatusBar3D | 1,000,000 | XP speedometer, streak flame, 10 lab indicators (at [0,-1.25,-1.95]) |
| LEDRim | 500,000 | 1500 LED capsules (was 1000), emissive 3.0, data viz mode |
| CockpitStructuralDetail | 2,000,000 | 60 cable bundles, 16 vent panels, ribs, LED indicator strips |
| CockpitFloor3D | 1,000,000 | Grated floor, sub-floor piping, energy conduits, LED channels |
| VolumetricFog3D | 500,000 | Fog volumes, god ray cones, density layers with FBM noise |
| CeremonyFX | 500,000 | Instanced confetti, fireworks, 3D trophies, HUD ring expansion |
| WormholeTransition | 300,000 | Tunnel interior, swirling energy walls, speed lines, portal rings |
| MiniMapOverlay3D | 250,000 | Miniature lab ring, player indicator, completion color-coding |
| AuroraBackground | 50,000 | Volumetric aurora layers, 3 ribbon TubeGeometry paths |
| AmbientParticles | 200,000 | Instanced icosahedron particles with trails and halos |
| **NEW: 3D UI Components** | 5,000,000 | HolographicButton, RadialDial3D, ToggleSwitch3D, HolographicCard/Panel |
| **NEW: NavigationButtonGrid** | 1,000,000 | 5 physical cockpit nav buttons (HOME/LABS/ARCADE/SETTINGS/PROFILE) |
| **NEW: VariableDialCluster** | 1,500,000 | 3 center-console dials, per-page auto-reconfigure |
| **NEW: CenterViewportScreen** | 3,000,000 | Spherical panoramic screen (r=3.9, 144×72 segs, BackSide) |
| **Cockpit Total** | **~37,800,000** | System 50M budget with ~12M game headroom |

#### Desktop-Only Rendering (D3D-1)

Mobile/tablet code paths have been removed (D3D-1). The cockpit always renders at full quality. No CSS fallbacks, no `useIsMobile()`, no `GenericGameParticles`. Future mobile support will use R3F-native LOD (Three.js LOD object) rather than CSS substitution.

#### TSL / WebGPU Notes

Since Three.js r171+, custom `ShaderMaterial` and `RawShaderMaterial` are **not supported** in `WebGPURenderer`. All shaders must use **TSL (Three Shader Language)**, which auto-compiles to:
- **WGSL** for WebGPU path
- **GLSL** for WebGL2 fallback path

The 10 GLSL lab pattern shaders in `src/shaders/labPatterns/` work under WebGL2. **TSL equivalents are now available** in `src/shaders/labPatterns/tsl/` (Section 4.1-A). Use `getLabPatternTSL(labNumber)` to get the TSL pattern + uniforms for any lab. Hero Animation particle system already uses full TSL compute pipeline.

---

## 10. ERROR HANDLING & AUTO-FIX GUIDE

**Full guide:** `docs/00-reference/ERROR_HANDLING_AUTOFIX_GUIDE.md`

**Quick rules:**
- TypeScript errors → check `types/index.ts`, verify imports, check stage doc for missing files
- Import errors → `npm install` missing packages, check file paths per Section 8 conventions
- Build errors → ensure `export default` on pages, check `tailwind.config.ts` for custom classes
- Runtime errors → ensure `ssr: false` for 3D, check `.env.local` for Supabase/Stripe/Anthropic keys
- **After 2 failed auto-fix attempts → Escalate to HARD STOP (HS-6)**

---

## 11. KNOWN BUG REGISTRY

These bugs are already documented. Apply the fix when you reach the indicated stage.

| ID | Issue | Fix | Stage |
|----|-------|-----|-------|
| BUG-1 | useApi.ts stubs confuse hooks | Stage 4 Part 1 REPLACES useApi.ts entirely | 4 |
| BUG-3 | 10 parallel progress API calls | Uses single `/api/progress/all-labs` endpoint | 4 |
| BUG-5 | Lab map shows wrong completion | Fixed in Stage 4 lab map with proper hook | 4 |
| BUG-7 | subscription_status default | Comment clarification in Stage 2 P1 | 2 |
| BUG-8A | Duplicate tier config files | APPEND to `tier-config.ts`, no new `tiers.ts` | 8 |
| BUG-10D | CSP blocks Vercel analytics | `connect-src` includes Vercel domains | 10 |
| BUG-10F | Font stack conflict | Exo 2/Sora/Orbitron NOT Fredoka/Nunito in root layout | 10 |
| ENH-8A | Stripe graceful fallback | 503 + setup URL if keys missing | 8 |
| ENH-9A | Anthropic graceful fallback | 503 if `ANTHROPIC_API_KEY` missing | 9 |
| IMP-4 | spark-* vs neon-* tokens | Both defined as aliases in `tailwind.config.ts` | 1 |
| MISSING-7A | AI Spy game has no implementation | **RESOLVED** — `AiSpyGame.tsx` created March 14, 2026 (420 lines, full game) | 7A |
| FIX-DUAL-CANVAS | Dual WebGL contexts: StationFrame Canvas + game Canvas run simultaneously during gameplay, doubling GPU overhead | **RESOLVED (v2 — March 18, 2026)** — StationFrame.tsx unmounts R3F Canvas when `mode === 'game'`. **Original fix was incomplete:** `setGameActive()` was never called and `useStationMode` used local `useState` instead of global Zustand. **v2 fix:** (1) Added `gameActive`/`setGameActive` to `uiStore` (Zustand global), (2) `useStationMode` reads from `uiStore` instead of local state, (3) `GameShell` calls `setGameActive(true/false)` on mount/unmount. All 35 games now properly trigger Canvas unmount. | 6/7 |
| FIX-LOD-MISSING | LODWrapper not integrated into any game despite CLAUDE.md Section 9.1 mandate | **RESOLVED (March 18, 2026)** — GameShell now wraps children with `<LODWrapper tier={lodTier} adaptive>`. Tier auto-resolved from `gameRegistry` via `gameId` slug. Mapping: `'fl-lite'` → `'flLite'`. All 35 games now have LOD context available to 3D children via `useLODContext()`. | 7 |
| FIX-MOBILE-PARTICLES | Mobile devices see blank background when 3D Canvas hidden by `useIsMobile()` | **RESOLVED (March 18, 2026)** — GameShell renders `<GenericGameParticles color={worldColor} />` on mobile as CSS particle fallback. All 35 games automatically get lab-colored ambient particles on mobile. | 7 |
| FIX-TRIPLE-CANVAS | HeroAnimation, StationFrame, and SpatialDashboard each created separate R3F Canvas instances, violating CPA2-1 (Single Canvas) and preventing CPA2-3 (Seamless Handoff) | **RESOLVED (March 20, 2026)** — Created unified `CockpitCanvas.tsx` with single persistent Canvas. `StationFrame`, `SpatialDashboard`, and `HeroAnimation` rewritten as thin `<group>` wrappers. `CameraSystem.tsx` manages all camera transitions. Hero-to-cockpit handoff is now seamless crossfade within single Canvas. | Enh 1.1 |
| FIX-SYSTEM-LOD-CAP | `useLOD` hardcoded system tier to 3,000 triangles, preventing cockpit from using full device budget | **RESOLVED (March 20, 2026)** — Removed hardcoded cap; system tier now reads from `deviceStore` triangle budgets (desktop 20M, tablet 10M). Ultra LOD segments increased from 32 to 64. | Enh 1.1 |
| UPGRADE-20M-COCKPIT | Cockpit used only ~104K of available triangle budget | **RESOLVED (March 20, 2026)** — Full 20M triangle upgrade across 13 upgraded components + 8 new components (CockpitStructuralDetail, VolumetricFog3D, CockpitFloor3D, CeremonyFX, WormholeTransition, MiniMapOverlay3D, CockpitCanvas, CameraSystem) + audio system (CockpitAudioEngine). See `Upgrade-3D-Panoramic-Cockpit-2026-03-20.md`. | Enh 1.1 |
| D3D-CANVAS-PERSIST | CockpitCanvas unmounted during gameplay (FIX-DUAL-CANVAS) | **SUPERSEDED** by D3D-B1: Canvas now persists. GameShell uses `sceneStore.enterGame`/`exitGame` instead of `setGameActive`. | D3D Part B |
| D3D-LOD-REMOVED | LOD system (`useLOD`, `LODWrapper`) removed | **RESOLVED** by D3D-2: All geometry at max quality. `deviceStore` hardcoded to desktop-ultra. | D3D Part A |
| D3D-MOBILE-REMOVED | Mobile detection and CSS fallbacks removed | **RESOLVED** by D3D-1: 401 `isMobile` occurrences removed. Desktop-only rendering. | D3D Part A |
| D3D-POSTFX-UPGRADE | Only 3 post-processing effects (Bloom, Vignette, BarrelDistortion) | **RESOLVED** by D3D-5/C1: 7 effects always-on with scene-reactive multipliers. | D3D Part C |

### Game Code Agent — COMPLETED

The AI Spy game (Lab 1, Game #1) has been implemented via autonomous agent on March 14, 2026. The game is now fully functional at `src/components/games/AiSpyGame.tsx` with all required features (chrome bezel, age bands A/B/C, welcome→play→reveal→complete phases, 12+ scenes, ARIA labels). No remaining games have missing implementations — all 35 games are code-complete.

---

## 12. PROGRESS TRACKING

Claude Code maintains a separate **PROGRESS.md** file at the repo root. Update after each part.

### PROGRESS.md Template

```markdown
# SparkForge Build Progress

## Current Phase: [N] — [Stage Name Part X]
## Status: [IN PROGRESS / BLOCKED / COMPLETE]
## Last Updated: [timestamp]

### Completed
- [ ] Stage 1 Part 1 — Foundation config ✓
- [ ] Stage 1 Part 2 — Source files ✓
- [ ] Stage 1 VISUAL APPROVED ✓ (tag: v0.1.0)
...

### Current Issues
- [list any soft-stop issues encountered and how they were resolved]

### Blocked On
- [any active HARD STOP waiting for human input]

### Discrepancies Log
- [any file path or content mismatches from stage docs, with resolution]
```

---

## 13. QUICK REFERENCE — ALL 35 GAMES

**Full table:** `docs/00-reference/QUICK_REFERENCE_35_GAMES.md` (also in GCUD V10.2)

**Summary:** 6 Flagship (full 3D, 10M budget) + 9 FL-Lite (immersive 3D, 2M budget) + 20 Standard (themed 3D) = **35 games** across 10 Labs. All games support age bands A/B/C (some B/C or C only). Built across Stages 6B–7F.

---

## 14. STORES (13 total)

| Store | Stage | Key State |
|-------|-------|-----------|
| authStore | 3 | parent, isLoading, isDemoMode, demoSession, setParent/setLoading/clearAuth/startDemoSession/endDemoSession/checkDemoStatus |
| childStore | 1/4/5 | children[], activeChild, xp, level, badges, avatar, cosmetics |
| gameStore | 1/6 | currentGame, phase, score, startGame/completeGame/resetGame |
| toastStore | 1 | toasts[], addToast/removeToast |
| uiStore | 1 | sidebar, celebration, labColor, particleIntensity, sound, skipIntroAnimation. Note: `gameActive` flag deprecated (D3D-B1) — use `sceneStore.enterGame`/`exitGame` instead. |
| accessibilityStore | 10 | fontSize, contrast, reducedMotion, screenReader. Exported as `useA11yStore`. |
| parentStore | 8 | subscription, children, timeLimit, contentFilter |
| **deviceStore** | — | D3D-1/3: Hardcoded desktop-ultra. 50M total budget. No device selection. gpuTier, stripeCount. |
| **cockpitStore** | Enh 1.1 / CPA 2.0 | spatialView, focusedLabId, cameraTarget, cockpitSkin, npcsVisible, activeConsole, **heroPhase** (`'idle'`\|`'animating'`\|`'materializing'`\|`'complete'`), cockpitReady, setHeroPhase. Full definition in `3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md`. |
| **sceneStore** | D3D Part B | `activeScene`, `activeGameId`, `activeGameLabColor`, `transition`, `isTransitioning`, `cockpitOpacityTarget`. Actions: `enterGame`/`exitGame`/`enterSpatial`/`exitSpatial`/`setHeroActive`/`completeHero`/`updateTransitionProgress`/`completeTransition`. |
| **cockpitBroadcastStore** | Stage 4 v3.0 | Cross-panel event bus. 16 event types (`dial-rotate`, `button-press`, `page-navigate`, `lab-select`, `xp-change`, etc.). Pulse decay system with per-event intensity mapping. All 3D UI components broadcast here; all cockpit elements subscribe. |
| **guideStore** | 5/Phase5 | visible, minimized, context, labId, gameId, mood, messages, isStreaming, voiceEnabled, avatarConcept |
| **cockpitAtoms** | CPA v2.0 | Jotai atoms for fine-grained cockpit 3D reactive state (labHover, panelFocus, etc.) |

---

*End of CLAUDE.md v6.1 — SparkForge Autonomous Development Playbook*
*98 active files | 35 games (6 Flagship + 9 FL-Lite + 20 Standard) | 84 decisions (48 core + 4 OD + 12 CPA2 + 20 D3D) | 20 v3-FINAL documents (14 original + 4 Hero/Cockpit + 2 Login 3D) | 32 build phases | Enhancement 1.1 IMPLEMENTED (20M Cockpit Upgrade) | Enhancement 1.2 PLANNED | CPA v2.0 IMPLEMENTED (Single Canvas + Seamless Handoff) | Hero Animation v2.0 IMPLEMENTED | Login 3D Enhancement IMPLEMENTED (3D Portal + Demo Login) | D3D Overhaul IMPLEMENTED (Desktop-First, 50M budget, Mechanical Iris, Scene Routing) | 20 D3D decision locks (9 D3D + 6 D3D-B + 5 D3D-C) | Tech Stack 8.1 APPLIED | FULL CODE AUDIT COMPLETE (154 issues fixed) | Tailwind v4 MIGRATED | SQL MERGED | March 30, 2026*
