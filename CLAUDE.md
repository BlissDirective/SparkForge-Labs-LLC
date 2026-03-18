# SPARKFORGE — CLAUDE.md

## Autonomous Development Playbook for Claude Code

**Version:** 5.5 | **Date:** March 17, 2026 | **Vision:** Laboratory Control Station
**Supersedes:** CLAUDE.md v5.4 (March 16, 2026) — Cockpit architecture expanded, Hero Animation detailed, reference doc versions updated.

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

- **Documentation:** COMPLETE — 90 active project files
- **v3-FINAL patches:** 14 documents (34 part files), 64 locked decisions (48 core + 4 OD + 12 CPA2)
- **Games:** 35 total — 5 flagship (full 3D), 1 full 3D, 7 FL-Lite (enhanced 3D), 2 enhanced standard, 20 standard
- **Code written:** 0% — ready to build

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
| 3 | **Master Directory v1.1** | `docs/00-reference/` | 24-phase flow map, file registry |
| 4 | **GCUD V10.1** | `docs/00-reference/` | Source of truth for game content + status |
| 5 | **Master Implementation Guide v3.1** | `docs/00-reference/` | Stage overviews + file lists |
| 6 | **Decision Lock Checkpoints 1-3** | `docs/01-decisions/` | 64 locked decisions (48 core + 4 OD + 12 CPA2) |
| 7 | **Visual Enhancement Concept v2** | `docs/00-reference/` | Lab Control Station design spec |
| 8 | **Known Compat Notes** | `docs/00-reference/` | Version-sensitive package flags |
| 9 | **Testing Guide** | `TESTING.md` (repo root) | Testing pyramid, API/component/E2E tests, pre-deploy checklist |
| 10 | **Feature Workflow Guide** | `Feature-Workflow-Test.md` (repo root) | Build-test-integrate cycle, feature sizing, version control per feature |
| 11 | **Database Patterns Guide** | `database-patterns.md` (repo root) | Supabase/RLS patterns, schema design, validation, seeding, performance |
| 12 | **SparkForge Agent Playbook** | `SparkForge-agent.md` (repo root) | Autonomous evaluation sweeps, admin approval workflow, apply-test-report cycle |
| 13 | **CPA v2.0 (Cockpit Architecture)** | `docs/00-reference/` | 3D Panoramic Cockpit full spec, CPA2 decisions, triangle budgets |
| 14 | **Hero Animation v2.0** | `docs/00-reference/` | 8-phase cinematic spec + implementation plan |
| 15 | **Error Handling & Auto-Fix Guide** | `docs/00-reference/` | Build/TS/import error patterns and auto-fix strategies |
| 16 | **Quick Reference: 35 Games** | `docs/00-reference/` | Full game table (extracted from CLAUDE.md, canonical in GCUD V10.1) |
| 17 | **Enhancement Blueprint v1.0** | Repo root | 12-section visionary upgrade plan (Enh 1.0–1.2+) |

### Build Strategy: Single-Pass with v3-FINAL Priority

**Where a v3-FINAL document exists, use it as the ONLY source.** It contains all v2 content plus v3 enhancements. Do NOT build v2 first then patch. Where no v3-FINAL exists, use the v2 document directly.

### 3.1 Stage Document Modification Policy

Stage documents in `docs/` are **living documents** — they should always contain the most current, buildable code. Claude Code acts as the **primary code reviewer** during development and is responsible for keeping stage docs accurate.

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
- Bugs that would cause runtime failures
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

### Implementation Order (24 Phases)

Follow this EXACT order. Never skip ahead.

| Phase | Stage | Source Documents | v3? | Hard Stops |
|-------|-------|-----------------|-----|------------|
| 1 | Stage 1 Part 1 | STAGE1_Foundation_v2_PART1 | No | — |
| 2 | Stage 1 Part 2 | STAGE1_Foundation_v2_PART2 | No | — |
| 3 | Stage 2 Parts 1-4 | STAGE2_Database_API_v2_PART1-4 | No | HS-1, HS-7 |
| 4 | Stage 3 Parts 1-2 | STAGE3_Auth_Layout_Shell_v2_PART1-2 | No | — |
| 5 | Stage 3 Part 3 | STAGE3_Part3A/B_v3FINAL | YES | — |
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
| 21 | Stage 7F (3 games) | STAGE7F_v3FINAL_A/B + Part2(v2) | Mixed | — |
| 22 | Stage 7 Shared | STAGE7_Shared_v3FINAL_A + XP_Celebration(v2) | Mixed | — |
| 23 | Stage 8 Parts 1-2 | STAGE8_Parent_Dashboard_v2_PART1-2 | No | HS-2 |
| 24 | Stage 8 Part 3 | STAGE8_P3_v3FINAL_A/B/C | YES | — |
| 25 | Stage 9 Parts 1-3 | STAGE9_Content_Agent_v2_PART1-3 | No | HS-3 |
| 26 | Stage 10 Parts 1-2 | STAGE10_Polish_Deploy_v2_PART1-2 | No | HS-4 |

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

## 5. PER-STAGE PLAYBOOKS

### Stage 1: Foundation

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

### Stage 2: Database & API

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

### Stage 3: Auth, Layout & Station Frame

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

### Stage 4: Core Pages & Lab Reconfiguration

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

### Stage 5: Gamification & Visual FX

**Source:** PART1 (v2) + Parts23 A/B/C (v3-FINAL)
**Prerequisites:** Stage 4 complete
**Parts:** 4 (1 v2 + 3 v3)

**Part 1 (v2):** XP engine, cosmetics, avatar, sound, daily challenge
**Parts 2-3A (v3-FINAL):** LiquidMetal, Holographic, EnergyField shaders — Decisions 4.2-4.5
**Parts 2-3B (v3-FINAL):** XPVortex, BadgePedestals, particle slider — Decisions 5.2-5.6, 7.2
**Parts 2-3C (v3-FINAL):** GameParticles3D (R3F for flagships), ceremonies, verification

**Tag:** `git tag -a v0.5.0 -m "Stage 5 complete: Gamification + Visual FX"`

---

### Stage 6: Flagship Games (5 games — ALL v3-FINAL)

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

**Tag:** `git tag -a v0.6.0 -m "Stage 6 complete: 5 flagship games with 3D"`

---

### Stage 7: All Remaining Games (30 games — Mixed)

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
- v2: Emoji Decoder, AI or Not? (STAGE7F_Part2)

**7 Shared — Systems (Mixed):**
- v3-FINAL: GenericGameParticles for 29 standard/FL-Lite games (STAGE7_Shared_v3FINAL_A)
- v2: XPPopupProvider, GameCompleteCelebration, StreakFire (STAGE7_Shared_XP_Celebration)

**After all 7 sub-stages:** Update `gameRegistry.ts` with all 35 entries.
**Tag:** `git tag -a v0.7.0 -m "Stage 7 complete: 30 games + shared systems (35 total)"`

---

### Stage 8: Parent Dashboard & Monetization

**Source:** PART1-2 (v2) + P3 A/B/C (v3-FINAL)
**Prerequisites:** Stages 1-7 complete
**Hard Stops:** HS-2 (Stripe keys), HS-5 (visual)

**BEFORE STARTING:** Trigger HS-2. Wait for Stripe test keys + 4 price IDs.

**Part 1 (v2):** Tier config extensions, Stripe setup, parent store. **BUG-8A: APPEND to existing tier-config.ts, do NOT create tiers.ts.**
**Part 2 (v2):** Parent dashboard, subscription, paywall
**Part 3A/B/C (v3-FINAL):** ScrollJourney landing, FeatureShowcase, StationPreview, /pricing route — Decisions 8.1-8.5

**Tag:** `git tag -a v0.8.0 -m "Stage 8 complete: Parent Dashboard + Monetization"`

---

### Stage 9: Content Agent

**Source:** `STAGE9_Content_Agent_v2_PART1-3` (v2 only)
**Prerequisites:** Stages 1-8 complete
**Hard Stops:** HS-3 (Anthropic key)

**BEFORE STARTING:** Trigger HS-3. Wait for `ANTHROPIC_API_KEY`.

**Part 1:** Agent pipeline (4-stage: Research → Generate → Screen → Insert), prompts, API routes. **ENH-9A: Graceful 503 if key missing.**
**Part 2:** Admin review dashboard
**Part 3:** Seed content: 150 lessons, 90 quizzes, 60 facts

**Tag:** `git tag -a v0.9.0 -m "Stage 9 complete: Content Agent"`

---

### Stage 10: Polish & Deploy

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
- 12-15 particles (lab-colored) — CSS for standard, R3F for flagship
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

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => { setM(window.innerWidth < 768); }, []);
  return m;
}

// In render: hidden on mobile, CSS fallback active
{!isMobile && <Component3D {...props} />}
```

---

## 8. FILE & FOLDER CONVENTIONS

### Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `EmojiDecoderGame.tsx` |
| Game components | `src/components/games/NameGame.tsx` | `PetTrainerGame.tsx` |
| 3D components | `src/components/3d/Name3D.tsx` | `NeuralNetwork3D.tsx` |
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
- Mobile fallback: `useIsMobile()` → component returns `null` on mobile
- CSS 2D fallback remains fully functional when 3D is hidden
- Triangle budgets: Flagship 10M+ (10,000,000), FL-Lite 2M+ (2,000,000), Standard 500K+ (500,000) (all games now have full 3D environments)
- **LOD is MANDATORY** — every 3D component must use `useLOD()` hook or `<LODWrapper>` (see Section 9.1)
- **Device-adaptive FPS** — `deviceStore` drives FPS targets (desktop 60, tablet 45, mobile 30)
- Materials: `MeshToonMaterial` (pets), `MeshStandardMaterial` (chrome), custom GLSL
- Environment: `frost-prismatic.hdr` in `public/hdri/`
- 11 PBR presets in `lib/3d/materials.ts`
- 10 GLSL lab pattern shaders in `src/shaders/`

### 3D Component Registry

| Component | Stage | Game/System |
|-----------|-------|------------|
| StationFrame.tsx | 3 v3 | Dashboard chrome frame |
| HeroAnimation.tsx | 3 v3 | 8-phase 19s cinematic hero sequence (1B+ particles, WebGPU TSL compute, Voronoi shatter → cockpit materialization). Replaces CrystalShatter (archived to `_SUPERSEDED/`). See `Implementation_Plan_Hero_Page_Animation_v2.0.md`. |
| AuroraBackground.tsx | 3 v3 | Dashboard ambient |
| AmbientParticles.tsx | 3 v3 | Dashboard floating particles |
| GameParticles3D.tsx | 5 v3 | R3F particles (5 flagships) |
| GenericGameParticles.tsx | 7 Shared v3 | CSS particles (23 standard) |
| Pet3DScene.tsx + PetCreature3D.tsx | 6B v3 | Pet Trainer (GLB evolution) |
| NeuralNetwork3D.tsx | 6C v3 | Neural Builder (rotatable) |
| PromptBubble3D.tsx | 6D v3 | Prompt Lab (thought bubble) |
| AgentPipeline3D.tsx | 6E v3 | Agent Architect (pipeline) |
| BiasScales3D.tsx | 6F v3 | Bias Detective (justice scales) |
| SortScene3D.tsx | 7B v3 | Sort Toy Box (3D throwing) |
| CodeBlocks3D.tsx | 7B v3 | Code Blocks (block assembly) |
| ChatbotNodes3D.tsx | 7C v3 | Chatbot Builder (conversation) |
| DataDetective3D.tsx | 7C v3 | Data Detective (magnifying glass) |
| RobotVacuum3D.tsx | 7D v3 | Robot Vacuum (isometric) |
| CameraQuest3D.tsx | 7D v3 | Camera Quest (polaroid) |
| FutureForge3D.tsx | 7D v3 | Future Forge (blueprint) |
| MyFirstAiApp3D.tsx | 7F v3 | My First AI App (mockup) |
| LODWrapper.tsx | — | Mandatory LOD container for all 3D scenes |
| SpatialDashboard.tsx | Enh 1.1 | Scene group: lab map, consoles, NPCs, environment (within CockpitCanvas) |
| CinematicCamera.tsx | Enh 1.1 | Spring-damped position/lookAt/FOV interpolation |
| HolographicLabMap.tsx | Enh 1.1 | Central holographic core + 10 lab ring + connection beams |
| LabStructure3D.tsx | Enh 1.1 | 10 unique multi-part lab models (~2.5K tris each) |
| InteractiveConsole3D.tsx | Enh 1.1 | 4 holographic consoles (XP, badges, streak, progress) |
| AmbientNPCs.tsx | Enh 1.1 | 5 personality bot types with Perlin patrol |
| DynamicEnvironment.tsx | Enh 1.1 | Lab-reactive particles + spatial grid + multi-light |
| CockpitCanvas.tsx | CPA 2.0 | Persistent R3F Canvas wrapping entire app (WebGPU primary, WebGL2 fallback) |
| CockpitPanel.tsx | CPA 2.0 | Top/bottom chrome bezels with hex sub-panels |
| SidePanel.tsx | CPA 2.0 | Left radar + right terminal panels |
| HolographicHUD.tsx | CPA 2.0 | Center rotating holographic rings |
| StatusBar3D.tsx | CPA 2.0 | Bottom gauge strip with animated meters |
| CockpitLighting.tsx | CPA 2.0 | Multi-point light rig + environment map |
| SpatialOverlay.tsx | Enh 1.1 | Glassmorphic HTML overlay — lab info, nav hints, console indicators |
| useHeroAnimation.ts | Hero v2 | Animation lifecycle hook — skip logic, fast-forward, phase callbacks |
| heroParticleCompute.ts | Hero v2 | TSL compute kernel for 1B+ particle throughput (lib/3d/) |
| voronoiFracture.ts | Hero v2 | CPU-side Voronoi tessellation for Phase 5 shatter (lib/3d/) |
| heroSplines.ts | Hero v2 | Spline path definitions for Phase 6 shard→cockpit migration (lib/3d/) |
| heroAudio.ts | Hero v2 | Tone.js audio timeline for all 8 phases (lib/audio/) |
| FlagshipEnvironmentBase.tsx | 6 v3 10M | Shared LOD-aware foundation: 512-seg terrain, sky dome, fog particles, lighting rig, instanced scatter |
| PetTrainerEnvironment.tsx | 6B v3 10M | Enchanted pet habitat: training arena, obstacle course, playground, enchanted forest, creek, fireflies, garden beds, lantern posts, butterflies (~3.96M tris) |
| NeuralBuilderEnvironment.tsx | 6C v3 10M | Quantum data center: server racks, quantum core processor, data pipelines, monitor array, matrix rain, robotic arms, security grid (~3.68M tris) |
| PromptLabEnvironment.tsx | 6D v3 10M | Enchanted AI workshop: library tower, floating books, word cloud, typewriter, ink rivers, AI brain, inspiration crystals, dictionary columns (~3.39M tris) |
| AgentArchitectEnvironment.tsx | 6E v3 10M | Mission control center: server corridor, mission control wall, drone fleet, blueprint table, assembly line, communication array, cargo containers (~3.27M tris) |
| BiasDetectiveEnvironment.tsx | 6F v3 10M | Grand justice courtroom: marble pillars, chandelier, witness stand, jury box, evidence wall, scales of justice, courthouse arches (~3.44M tris) |
| FLLiteEnvironmentBase.tsx | 7 v3 2M | Shared FL-Lite foundation: 256-seg terrain, sky dome, fog particles, lighting rig |
| DataDetectiveEnvironment.tsx | 7C v3 2M | Investigation laboratory: desks, evidence boards, filing cabinets, magnifying hologram, data streams (~1.3M tris) |
| RobotVacuumEnvironment.tsx | 7D v3 2M | Smart home interior: furniture, IoT sensors, control panels, charging dock, floor plan overlay (~1.2M tris) |
| CameraQuestEnvironment.tsx | 7D v3 2M | Photography studio: lighting rigs, camera stations, photo gallery wall, film strips, neural net viz (~1.3M tris) |
| ChatbotBuilderEnvironment.tsx | 7C v3 2M | Communication hub: chat bubbles, server towers, antenna array, message streams, consoles (~1.2M tris) |
| EmojiDecoderEnvironment.tsx | 7F v3 2M | Translation workshop: emoji sculptures, translation machine, rosetta pillars, cultural displays (~1.3M tris) |
| CodeBlocksEnvironment.tsx | 7B v3 2M | Code laboratory: terminal screens, circuit board floor, LED strips, binary rain, robot assistants (~1.4M tris) |
| MyFirstAiAppEnvironment.tsx | 7F v3 2M | App dev studio: device mockups, component shelves, wireframe displays, launch pad (~1.2M tris) |
| FutureForgeEnvironment.tsx | 7D v3 2M | Future city: skyline towers, holographic billboards, flying vehicles, innovation dome (~1.4M tris) |
| AiOrNotEnvironment.tsx | 7F v3 2M | AI art gallery: exhibition pedestals, picture frames, voting booths, spotlight rigs (~1.3M tris) |
| EmojiDecoder3D.tsx | 7F v3 2M | Emoji Decoder game 3D component: translation machine, emoji display, decoded output |
| AiOrNot3D.tsx | 7F v3 2M | AI or Not? game 3D component: display pedestal, voting buttons, verdict ring, score display |
| StandardEnvironmentBase.tsx | 7 Standard 500K | Shared LOD-aware foundation: 128-seg terrain, sky dome, fog particles, lighting rig |
| AiSpyEnvironment.tsx | 7A Standard 500K | Futuristic detective office: holographic screens, magnifier, evidence pinboard, scanner beam (~500K tris) |
| TimeMachineEnvironment.tsx | 7A Standard 500K | Time vortex portal chamber: spinning rings, timeline helix, era panels, clock mechanisms (~500K tris) |
| HumanVsMachineEnvironment.tsx | 7B Standard 500K | Split arena: human workshop vs machine factory, judge podium, comparison cards (~500K tris) |
| TreatTrainerEnvironment.tsx | 7C Standard 500K | AI training playground: obstacle course, treat dispensers, reward stations, behavior scoreboard (~500K tris) |
| NeuronRelayEnvironment.tsx | 7C Standard 500K | Neural relay station: giant neuron models, axon pathways, synapse junctions, signal pulses (~500K tris) |
| PixelInvestigatorEnvironment.tsx | 7D Standard 500K | Digital forensics lab: pixel grid table, magnification station, RGB analyzer, binary waterfall (~500K tris) |
| WordPredictorEnvironment.tsx | 7A Standard 500K | Language prediction library: word bubbles, probability tree, autocomplete screens, dictionary towers (~500K tris) |
| TokenChopperEnvironment.tsx | 7A Standard 500K | Tokenization factory: conveyor belts, chopper mechanism, token bins, BPE visualizer (~500K tris) |
| AiArtDetectiveEnvironment.tsx | 7A Standard 500K | Art analysis museum: floating artworks, style panels, technique analyzer, palette station (~500K tris) |
| ToolPickerEnvironment.tsx | 7A Standard 500K | AI tool workshop: labeled racks, task board, comparison table, effectiveness gauges (~500K tris) |
| DataShieldEnvironment.tsx | 7A Standard 500K | Cybersecurity command center: shield generator, data tunnels, firewall walls, privacy vault (~500K tris) |
| RealOrFakeEnvironment.tsx | 7A Standard 500K | Media verification studio: dual screens, fact-checker, deepfake chamber, truth meter (~500K tris) |
| EthicsCourtroomEnvironment.tsx | 7E Standard 500K | AI ethics courtroom: judge bench, witness stand, jury box, scales of justice, gavel (~500K tris) |
| FoolTheAiEnvironment.tsx | 7D Standard 500K | Adversarial testing lab: AI brain dome, disguise station, perturbation generator, defense shield (~500K tris) |
| BuildClassifierEnvironment.tsx | 7E Standard 500K | Classification yard: sorting conveyors, category bins, decision tree, accuracy dashboard (~500K tris) |
| PredictionMarketEnvironment.tsx | 7A Standard 500K | Prediction trading floor: ticker displays, wager console, probability charts, crystal ball (~500K tris) |
| SentimentScannerEnvironment.tsx | 7C Standard 500K | Emotion analysis lab: mood meter, sentiment oscilloscope, emoji bubbles, polarity dashboard (~500K tris) |
| LostInTranslationEnvironment.tsx | 7C Standard 500K | Universal translation hub: Babel tower, translation bridge, language globe, dictionary ceiling (~500K tris) |
| CareerExplorerEnvironment.tsx | 7B Standard 500K | AI career expo: exhibition booths, holographic previews, skill tree, career flowchart (~500K tris) |
| ApiExplorerEnvironment.tsx | 7E Standard 500K | API command center: gateway hub, pipeline tubes, endpoint tower, auth station, webhook array (~500K tris) |

### 9.1 Mandatory LOD Architecture

**Every 3D component MUST implement Level of Detail (LOD).** This is not optional — it ensures consistent performance across all device types.

#### Device Performance System

Users select their device type at first launch via `DeviceSelectionModal`:

| Device | Target FPS | Max Triangles | LOD Bias | Bloom | Shadows | Pixel Ratio |
|--------|-----------|---------------|----------|-------|---------|-------------|
| Desktop (Computer) | 60 | 10M | ultra | Yes | Yes | 2.5x |
| Tablet | 45 | 5M | high | Yes | No | 1.5x |
| Mobile (Phone) | 30 | 2.5M | low | No | No | 1x |

**Store:** `src/stores/deviceStore.ts` — persisted via localStorage (`sparkforge-device`)
**Modal:** `src/components/ui/DeviceSelectionModal.tsx` — shown once on first visit
**Settings:** User can change device type anytime in Settings page

#### LOD Levels

| Level | Segments | Effects | Shadows | Reflections | Use Case |
|-------|----------|---------|---------|-------------|----------|
| `ultra` | 32 | All + trails | Yes | Yes | Desktop, max quality |
| `high` | 16 | All | Yes | Yes | Desktop/Tablet, close camera |
| `medium` | 12 | Most | No | Yes | Tablet, mid-range |
| `low` | 8 | None | No | No | Mobile, far camera |
| `billboard` | 4 | None | No | No | Extreme distance / perf |

#### Usage Pattern (Required)

```typescript
// In 3D component:
import { useLOD, lodSphere } from '@/hooks/useLOD';

function MyScene3D() {
  const lod = useLOD({ tier: 'flagship' }); // or 'flLite', 'standard', 'system'
  return (
    <mesh>
      <sphereGeometry args={lodSphere(lod, 1.0)} />
      {lod.enableEffects && <Sparkles />}
      {lod.enableShadows && <ContactShadows />}
    </mesh>
  );
}

// Or via wrapper:
import { LODWrapper, useLODContext } from '@/components/3d/LODWrapper';

<LODWrapper tier="flagship" adaptive>
  <MyScene3D />
</LODWrapper>
```

#### Adaptive FPS Monitor

`useAdaptiveLOD()` monitors real-time FPS and auto-downgrades LOD when performance drops below 80% of target. Use `adaptive` prop on `<LODWrapper>` for automatic degradation.

#### Triangle Budgets by Device

| Tier | Desktop | Tablet | Mobile |
|------|---------|--------|--------|
| Flagship | 10M | 5M | 2.5M |
| FL-Lite | 2M | 1M | 500K |
| Standard | 500K | 250K | 125K |

### 9.2 Game Tier Definitions (3 tiers)

**Note:** Enhanced Standard tier has been **merged into FL-Lite**. There are now 3 game tiers:

| Tier | Description | 3D | Triangle Budget | Games |
|------|-------------|-----|----------------|-------|
| **Flagship** | Full immersive 3D scenes, all effects | Full R3F | 10M+ (10,000,000) | 5 |
| **FL-Lite** | Immersive 3D with themed environments | Full R3F | 2M+ (2,000,000) | 9 |
| **Standard** | Immersive 3D environments with themed scenes | Full R3F | 500K+ (500,000) | 20 |

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

#### Cockpit Triangle Budgets

| Component | Triangles | Notes |
|-----------|-----------|-------|
| HolographicLabMap | ~28K | Core + 10 lab ring + beams |
| LabStructure3D (10 labs) | ~25K | ~2.5K per lab model |
| DynamicEnvironment | ~15K | Particles + spatial grid |
| InteractiveConsole3D (4) | ~6K | XP, badges, streak, progress |
| AmbientNPCs (5 types) | ~4K | ~500 tris each with Perlin patrol |
| CockpitPanels + StatusBar | ~22K | Chrome bezels, HUD rings, gauges |
| LEDRim | ~4K | Arc geometry with lab-color glow |
| **Cockpit Total** | **~104K** | Within 5M tablet budget (10M desktop) |

#### Mobile CSS Fallback Strategy

On mobile (`useIsMobile()` returns `true`), the full cockpit is hidden and replaced with:

- **2D glassmorphic dashboard** — standard HTML/CSS layout with `backdrop-filter: blur()`
- **CSS particle backgrounds** — `GenericGameParticles.tsx` provides lightweight DOM-animated `<div>` particles
- **Chrome bezel** rendered as CSS borders/gradients (no R3F)
- **Lab map** as a flat grid/carousel instead of 3D hologram
- All interactive functionality preserved — only visual presentation differs

#### TSL / WebGPU Notes

Since Three.js r171+, custom `ShaderMaterial` and `RawShaderMaterial` are **not supported** in `WebGPURenderer`. All shaders must use **TSL (Three Shader Language)**, which auto-compiles to:
- **WGSL** for WebGPU path
- **GLSL** for WebGL2 fallback path

The 10 GLSL lab pattern shaders in `src/shaders/` work under WebGL2 but need TSL equivalents for WebGPU compatibility. Hero Animation particle system already uses full TSL compute pipeline.

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

**Full table:** `docs/00-reference/QUICK_REFERENCE_35_GAMES.md` (also in GCUD V10.1)

**Summary:** 6 Flagship (full 3D, 10M budget) + 9 FL-Lite (immersive 3D, 2M budget) + 20 Standard (themed 3D) = **35 games** across 10 Labs. All games support age bands A/B/C (some B/C or C only). Built across Stages 6B–7F.

---

## 14. STORES (9 total)

| Store | Stage | Key State |
|-------|-------|-----------|
| authStore | 3 | user, session, loading, signIn/signUp/signOut |
| childStore | 1/4/5 | children[], activeChild, xp, level, badges, avatar, cosmetics |
| gameStore | 1/6 | currentGame, phase, score, startGame/completeGame/resetGame |
| toastStore | 1 | toasts[], addToast/removeToast |
| uiStore | 1 | sidebar, celebration, labColor, particleIntensity, sound, skipIntroAnimation |
| accessibilityStore | 10 | fontSize, contrast, reducedMotion, screenReader |
| parentStore | 8 | subscription, children, timeLimit, contentFilter |
| **deviceStore** | — | deviceType, hasSelected, profile (FPS, LOD, triangles, effects), gpuTier, stripeCount |
| **cockpitStore** | Enh 1.1 / CPA 2.0 | spatialView, focusedLabId, cameraTarget, cockpitSkin, npcsVisible, activeConsole, heroPhase, cockpitReady. Full definition in `3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md`. |

---

*End of CLAUDE.md v5.5 — SparkForge Autonomous Development Playbook*
*90 active files | 35 games | 64 decisions (48 core + 4 OD + 12 CPA2) | 14 v3-FINAL documents | Enhancement 1.1 IMPLEMENTED | Enhancement 1.2 PLANNED | CPA v2.0 DOCUMENTED | Tech Stack 8.1 APPLIED | March 17, 2026*
