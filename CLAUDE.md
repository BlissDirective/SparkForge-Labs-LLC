# SPARKFORGE — CLAUDE.md

## Autonomous Development Playbook for Claude Code

**Version:** 5.2 | **Date:** March 2, 2026 | **Vision:** Laboratory Control Station
**Supersedes:** CLAUDE.md v5.1 (March 1, 2026) — adds stage document modification policy and code review role.

---

## 1. PROJECT IDENTITY

SparkForge is a gamified AI learning platform for children ages 7–16. It teaches AI concepts through **35 interactive games** across **10 themed Labs**. The platform uses a dark-mode-only aesthetic called **Frost-Prismatic** with chrome bezels, neon accents, and glassmorphism. The v3 vision transforms the platform into a **Laboratory Control Station** — a futuristic command console with persistent chrome frames, crystal shatter arrivals, lab reconfiguration transitions, and themed 3D game elements.

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14 (App Router) | Full-stack React |
| Language | TypeScript (strict mode) | Type safety |
| Styling | Tailwind CSS | Utility-first CSS |
| Database | Supabase (PostgreSQL + Auth + Storage) | All persistent data |
| State | Zustand (6 stores) | Client state |
| Data Fetching | React Query (@tanstack/react-query) | Server state + caching |
| Validation | Zod | Schema validation |
| Payments | Stripe | Subscriptions (Free/Plus/Forge) |
| AI | Anthropic Claude API | Prompt Lab game + Content Agent |
| 2D Motion | Framer Motion + GSAP | Transitions, scroll |
| 3D Rendering | React Three Fiber + drei + postprocessing | 3D scenes, shaders |
| Charts | recharts | Data visualization |
| Audio | Tone.js | Game audio feedback |
| Deployment | Vercel | Production hosting |

### Current State

- **Documentation:** COMPLETE — 78 active project files
- **v3-FINAL patches:** 14 documents (34 part files), 48 locked decisions
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
| 3 | **Master Directory v1.0** | `docs/00-reference/` | 24-phase flow map, file registry |
| 4 | **GCUD V10** | `docs/00-reference/` | Source of truth for game content + status |
| 5 | **Master Implementation Guide v3.0** | `docs/00-reference/` | Stage overviews + file lists |
| 6 | **Decision Lock Checkpoints 1-3** | `docs/01-decisions/` | 48 locked decisions |
| 7 | **Visual Enhancement Concept v2** | `docs/00-reference/` | Lab Control Station design spec |
| 8 | **Known Compat Notes** | `docs/00-reference/` | Version-sensitive package flags |
| 9 | **Testing Guide** | `TESTING.md` (repo root) | Testing pyramid, API/component/E2E tests, pre-deploy checklist |
| 10 | **Feature Workflow Guide** | `Feature-Workflow-Test.md` (repo root) | Build-test-integrate cycle, feature sizing, version control per feature |
| 11 | **Database Patterns Guide** | `database-patterns.md` (repo root) | Supabase/RLS patterns, schema design, validation, seeding, performance |
| 12 | **SparkForge Agent Playbook** | `SparkForge-agent.md` (repo root) | Autonomous evaluation sweeps, admin approval workflow, apply-test-report cycle |

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
- Create Next.js project: `npx create-next-app@14 sparkforge`
- Install 40+ npm packages (8 install commands)
- Config files: tsconfig, tailwind, postcss, next.config, .env.example, .gitignore
- globals.css with 7 utility classes
- Create 30+ directories

**Part 2 — Source Files (Steps 11-26):**
- types/index.ts, utils.ts, supabase clients, middleware
- animations.ts (45+ Framer variants), 4 Zustand stores
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
**Part 3A (v3-FINAL):** StationFrame, CrystalShatter, Aurora, Particles, LEDRim, HDR, materials.ts — Decisions 1.1-1.7, 2.1-2.5, 7.1, 7.3-4, 8.1
**Part 3B (v3-FINAL):** Emissive CSS, onboarding crystal, landing page, scanline

**3D files created:** StationFrame.tsx, CrystalShatter.tsx, AuroraBackground.tsx, AmbientParticles.tsx, LEDRimLight.tsx
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

**Part 1:** A11yProvider, AccessibilityToolbar, accessibilityStore (6th store), SEO meta, CSP headers, PWA manifest
**Part 2:** Game router (35 games), production next.config.js (REPLACES Stage 1 version), deployment guide

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
- `next.config.js` externalizes Three.js from server builds
- Mobile fallback: `useIsMobile()` → component returns `null` on mobile
- CSS 2D fallback remains fully functional when 3D is hidden
- Triangle budgets: Flagship 50K–100K, FL-Lite 10K–50K, Standard 10K–25K (all games now have 3D)
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
| CrystalShatter.tsx | 3 v3 | Landing hero sequence |
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
| SpatialDashboard.tsx | Enh 1.1 | R3F Canvas orchestrator (camera, map, env, consoles, NPCs) |
| CinematicCamera.tsx | Enh 1.1 | Spring-damped position/lookAt/FOV interpolation |
| HolographicLabMap.tsx | Enh 1.1 | Central holographic core + 10 lab ring + connection beams |
| LabStructure3D.tsx | Enh 1.1 | 10 unique multi-part lab models (~2.5K tris each) |
| InteractiveConsole3D.tsx | Enh 1.1 | 4 holographic consoles (XP, badges, streak, progress) |
| AmbientNPCs.tsx | Enh 1.1 | 5 personality bot types with Perlin patrol |
| DynamicEnvironment.tsx | Enh 1.1 | Lab-reactive particles + spatial grid + multi-light |

### 9.1 Mandatory LOD Architecture

**Every 3D component MUST implement Level of Detail (LOD).** This is not optional — it ensures consistent performance across all device types.

#### Device Performance System

Users select their device type at first launch via `DeviceSelectionModal`:

| Device | Target FPS | Max Triangles | LOD Bias | Bloom | Shadows | Pixel Ratio |
|--------|-----------|---------------|----------|-------|---------|-------------|
| Desktop (Computer) | 60 | 500K | ultra | Yes | Yes | 2.5x |
| Tablet | 45 | 150K | high | Yes | No | 1.5x |
| Mobile (Phone) | 30 | 50K | low | No | No | 1x |

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
| Flagship | 100K | 50K | 25K |
| FL-Lite | 50K | 25K | 10K |
| Standard | 25K | 12K | 5K |

### 9.2 Game Tier Definitions (3 tiers)

**Note:** Enhanced Standard tier has been **merged into FL-Lite**. There are now 3 game tiers:

| Tier | Description | 3D | Triangle Budget | Games |
|------|-------------|-----|----------------|-------|
| **Flagship** | Full immersive 3D scenes, all effects | Full R3F | 50K–100K | 5 |
| **FL-Lite** | Enhanced 3D with themed environments | Enhanced R3F | 10K–50K | 10 |
| **Standard** | Meaningful 3D scenes (replaces CSS-only) | Themed R3F | 10K–25K | 20 |

---

## 10. ERROR HANDLING & AUTO-FIX GUIDE

When a build or typecheck fails, use these categories to attempt auto-fix before escalating.

### TypeScript Errors

| Pattern | Likely Cause | Auto-Fix |
|---------|-------------|----------|
| `Cannot find module '@/...'` | Missing file from earlier stage | Check if file exists. If not, check stage doc. Create if missing. |
| `Type 'X' is not assignable to 'Y'` | Interface mismatch | Check `types/index.ts`. Match the interface definition. |
| `Property 'X' does not exist on type 'Y'` | Store or type incomplete | Check if store/type was updated in a later part of same stage. |
| `Module has no exported member 'X'` | Named export missing | Check the source file. Add missing export. |

### Import Errors

| Pattern | Likely Cause | Auto-Fix |
|---------|-------------|----------|
| `Module not found: Can't resolve 'X'` | Package not installed | Run `npm install X`. Check stage doc for exact package. |
| `Can't resolve '@/components/...'` | File not yet created | Check if it's in a later part of current stage. Create placeholder if blocking. |
| `Dynamic import error (ssr: false)` | 3D component not in correct path | Ensure file is in `src/components/3d/` and uses correct export. |

### Build Errors

| Pattern | Likely Cause | Auto-Fix |
|---------|-------------|----------|
| `next build` fails with "page" errors | Missing `export default` | Ensure every page.tsx has a default export. |
| `next build` fails with CSS errors | Tailwind class not defined | Check `tailwind.config.ts` for custom class definitions. |
| ESLint errors blocking build | Strict rules | Fix or add `// eslint-disable-next-line` with specific rule. |

### Runtime Errors (Non-Blocking)

| Pattern | Action |
|---------|--------|
| Hydration mismatch | Check for `useEffect`-only state. Add `suppressHydrationWarning` if needed. |
| 3D component crash on server | Ensure `ssr: false` in dynamic import. |
| Supabase connection error | Check `.env.local` values. |

**After 2 failed auto-fix attempts → Escalate to HARD STOP (HS-6).**

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
| MISSING-7A | AI Spy game has no implementation | Will be developed via Game Code Agent (see below) | 7A |

### Game Code Agent (Planned)

A specialized game-modified web application development code agent will be created to develop any games or features with missing code implementations. This includes **AI Spy** (Lab 1, Game #1) which has a spec in `STAGE7A_BatchA_TapQuiz_8Games.md` but no full implementation across any Stage 7A part file. The Game Code Agent will be used to generate complete, pattern-compliant game code for AI Spy and any other games identified as missing during audits.

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

| # | Game | Lab | Slug | Tier | 3D | Bands | Stage |
|---|------|-----|------|------|-----|-------|-------|
| 1 | AI Spy | 1 | ai-spy | Std | — | A,B,C | 7A |
| 2 | Time Machine | 1 | time-machine | Std | — | A,B,C | 7A |
| 3 | Human vs Machine | 1 | human-vs-machine | Std | — | A,B,C | 7B |
| 4 | AI Pet Trainer | 2 | pet-trainer | Flag | Full | A,B,C | 6B |
| 5 | Sort Toy Box | 2 | sort-toy-box | Full3D | Full | A,B,C | 7B |
| 6 | Treat Trainer | 2 | treat-trainer | Std | — | A,B,C | 7C |
| 7 | Data Detective | 2 | data-detective | FL-L | Enh | A,B,C | 7C |
| 8 | Neural Builder | 3 | neural-builder | Flag | Full | A,B,C | 6C |
| 9 | Neuron Relay | 3 | neuron-relay | Std | — | A,B,C | 7C |
| 10 | Pixel Investigator | 3 | pixel-investigator | Std | — | B,C | 7D |
| 11 | Prompt Lab | 4 | prompt-lab | Flag | Full | A,B,C | 6D |
| 12 | Word Predictor | 4 | word-predictor | Std | — | A,B,C | 7A |
| 13 | Token Chopper | 4 | token-chopper | Std | — | B,C | 7A |
| 14 | AI Art Detective | 4 | ai-art-detective | Std | — | A,B,C | 7A |
| 15 | Agent Architect | 5 | agent-architect | Flag | Full | A,B,C | 6E |
| 16 | Robot Vacuum | 5 | robot-vacuum | FL-L | Enh | A,B,C | 7D |
| 17 | Tool Picker | 6 | tool-picker | Std | — | A,B,C | 7A |
| 18 | Bias Detective | 6 | bias-detective | Flag | Full | B,C | 6F |
| 19 | Data Shield | 6 | data-shield | Std | — | A,B,C | 7A |
| 20 | Real or Fake | 6 | real-or-fake | Std | — | A,B,C | 7A |
| 21 | Ethics Courtroom | 6 | ethics-courtroom | Std | — | B,C | 7E |
| 22 | Camera Quest | 7 | camera-quest | FL-L | Enh | A,B,C | 7D |
| 23 | Fool the AI | 7 | fool-the-ai | Std | — | B,C | 7D |
| 24 | Build Classifier | 7 | build-classifier | Std | — | B,C | 7E |
| 25 | Prediction Market | 7 | prediction-market | Std | — | B,C | 7A |
| 26 | Sentiment Scanner | 8 | sentiment-scanner | Std | — | A,B,C | 7C |
| 27 | Chatbot Builder | 8 | chatbot-builder | FL-L | Enh | B,C | 7C |
| 28 | Lost in Translation | 8 | lost-in-translation | Std | — | A,B,C | 7C |
| 29 | Emoji Decoder | 8 | emoji-decoder | FL-L | Enh | A,B | 7F |
| 30 | Code Blocks | 9 | code-blocks | FL-L | Enh | A,B,C | 7B |
| 31 | Career Explorer | 9 | career-explorer | Std | — | B,C | 7B |
| 32 | API Explorer | 9 | api-explorer | Std | — | C | 7E |
| 33 | My First AI App | 9 | my-first-ai-app | FL-L | Enh | A,B,C | 7F |
| 34 | Future Forge | 10 | future-forge | FL-L | Enh | A,B,C | 7D |
| 35 | AI or Not? | 10 | ai-or-not | FL-L | Enh | A,B | 7F |

---

## 14. STORES (9 total)

| Store | Stage | Key State |
|-------|-------|-----------|
| authStore | 3 | user, session, loading, signIn/signUp/signOut |
| childStore | 1/4/5 | children[], activeChild, xp, level, badges, avatar, cosmetics |
| gameStore | 1/6 | currentGame, phase, score, startGame/completeGame/resetGame |
| toastStore | 1 | toasts[], addToast/removeToast |
| uiStore | 1 | sidebar, celebration, labColor, particleIntensity, sound |
| accessibilityStore | 10 | fontSize, contrast, reducedMotion, screenReader |
| parentStore | 8 | subscription, children, timeLimit, contentFilter |
| **deviceStore** | — | deviceType, hasSelected, profile (FPS, LOD, triangles, effects) |
| **cockpitStore** | Enh 1.1 | spatialView, focusedLabId, cameraTarget, cockpitSkin, npcsVisible, activeConsole |

---

*End of CLAUDE.md v5.2 — SparkForge Autonomous Development Playbook*
*92+ files | 35 games | 48 decisions | 14 v3-FINAL documents | Enhancement 1.1 IMPLEMENTED | March 14, 2026*
