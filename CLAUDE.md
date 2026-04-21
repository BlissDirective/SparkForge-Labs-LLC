# SPARKFORGE — CLAUDE.md

## Autonomous Development Playbook for Claude Code

**Version:** 6.5 | **Date:** April 21, 2026 | **Vision:** Laboratory Control Station
**Supersedes:** CLAUDE.md v6.4 (April 9, 2026) — Standard Tier Games Audit complete. T11–T20 Phase 2 completion adds: react-joyride cockpit tutorial (T11), cooperative scheduler + Web Worker (T12), next/image enforcement + OptimizedImage wrapper (T13), lazy game-loader factory (T14), Performance toggle with D3D-5 relaxation (T15a+b), Sentry environment/release tagging + perf transactions (T16), verifyCronBearer shared helper (T17), Supabase PITR runbook + recovery script (T18), text-white/10-40 → /50+ WCAG sweep (T19), 30 non-flagship games migrated to Zustand selectors (
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
| State | Zustand (15 stores) + Jotai (3D atoms) | Client state |
| Data Fetching | React Query (@tanstack/react-query) | Server state + caching |
| Validation | Zod | Schema validation |
| Payments | Stripe | Subscriptions (Free/Plus/Forge) |
| AI | Anthropic Claude API | Prompt Lab game + Content Agent |
| 2D Motion | Motion (ex Framer Motion) + GSAP | Transitions, scroll |
| 3D Rendering | React Three Fiber v9 + drei + postprocessing | 3D scenes, shaders (Three.js r183+, TSL, WebGPU/WebGL2) |
| Charts | @nivo/core + @nivo/line + @nivo/bar + @nivo/radar | Data visualization |
| Audio | Tone.js | Game audio feedback |
| Monitoring | Sentry (@sentry/nextjs) | Error tracking + performance |
| Testing | Vitest + Playwright + MSW | Unit, integration, E2E tests |
| Deployment | Vercel | Production hosting |



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
| HS-9 | Hero-to-Cockpit handoff verification | After Phase 5D (Cockpit Architecture Part 2) | "HARD STOP: Hero Animation + Cockpit Architecture complete. Please verify: (1) 8-phase hero animation plays on first visit, (2) Fast-forward (click/Enter/Space) accelerates to 4x, (3) Skip toggle works in Settings, (4) Hero→cockpit handoff is seamless (no canvas swap, no flash), (5) Cockpit spatial dashboard renders with holographic lab map, (6) Lab entry wormhole transition works. Reply 'approved' to continue to Stage 4." |
| HS-10 | Login 3D + Demo Login verification | After Phase 5F (Login Enhancement Part B) | "HARD STOP: Login 3D Enhancement complete. Please verify: (1) 3D crystal portal renders behind login card on desktop, (2) Chrome bezel glow pulses on login card, (3) Demo Login button visible with confirmation flow, (4) Demo starts and redirects to /home with hero animation, (5) Demo banner shows countdown timer at top of dashboard, (6) Banner turns red/urgent when <5 min remain, (7) Expired modal appears when timer hits 0:00, (8) ?demo=expired shows amber notification on login page. Reply 'approved' to continue to Stage 4." |

### Escalation Rules

- **1st auto-fix attempt fails** → Try a different approach
- **2nd auto-fix attempt fails** → HARD STOP. Show error + both attempted fixes. Ask human.
- **3 or more files failing in same part** → HARD STOP. Possible document discrepancy.
- **Runtime error (not build error)** → Log it, continue building. Flag at stage visual checkpoint.

---


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

**Stage-specific visual checklists:**

| Stage | What to Verify |
|-------|---------------|
| 1 | Dev server starts, no errors in console |
| 2 | API routes respond (test /api/health), Supabase connected |
| 3 | Signup → Login → Dashboard loads with sidebar. Station frame visible (Part 3). |
| 3-Hero | 8-phase hero animation plays (19s). Fast-forward works (4x). Skip toggle in Settings. WebGPU/WebGL2/CSS fallback chain. Audio plays (mutable). `prefers-reduced-motion` skips to cockpit. |
| 3-Cockpit | Cockpit renders at ~37.8M tris (desktop-ultra). Hero→cockpit seamless handoff (CPA2-3). Spatial dashboard with holographic lab map. 4 consoles, NPCs, dynamic environment. Wormhole transitions. |
| 3-Login3D | 3D crystal portal behind login card (desktop). Chrome bezel glow pulses. Demo Login button with confirmation. Demo → /home with hero animation. Timer banner at dashboard top. Urgent mode at <5min. Expiry modal at 0:00. ?demo=expired amber notice. |
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


---




| 

---



### Standard Tier Content & AI Integration (April 9-10, 2026)

- **Content expansion:** IMPLEMENTED — 20 games receiving ~3x hardcoded content expansion with difficulty tags. Vocabulary expansions (SentimentScanner 30→90 words). Multi-maze system (TreatTrainer 1→6 mazes).
- **AI prompt templates:** IMPLEMENTED — 60 new content types in `ai-content-generator.ts` (3 per Standard game). 20 new GameIds. Rate limit maintained at 15/game/session.
- **Admin curation pipeline:** Types and validation extended for Standard tier — +20 GameIds, +60 ContentTypes in Zod schema.
- **Difficulty tiers:** IMPLEMENTED — `difficulty?: 'easy' | 'medium' | 'hard' | 'expert'` field added to all content interfaces. DifficultySelector available in all 20 games.
- **Learn phases:** IMPLEMENTED — 12 games received 3 learn cards each (36 total cards). All 20 Standard games now have welcome → learn → play → complete flow.
- **Scoring normalization:** IMPLEMENTED — TimeMachine and RealOrFake normalized to 10pts/correct. DataShield maxScore fixed (240 not 60). Dead state removed from RealOrFake and PixelInvestigator.
- **Shared infrastructure:** IMPLEMENTED — `useSafeTimeout` hook applied to 12 games. `useAnimatedCounter` extracted to shared hook (deduplicated from 5 games).
- **Full audit report:** `StandardTier-game-content-audit(04.09.2026).md` — 8 sections, 76 bugs, 6-phase roadmap.

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



*End of CLAUDE.md v6.5 — SparkForge Autonomous Development Playbook*
*131+ doc files | 172 3D component files | 35 games (6 Flagship + 9 FL-Lite + 20 Standard) | 15 stores | 150 design decisions (131 design + 19 implementation) + 84 architecture decisions (48 core + 4 OD + 12 CPA2 + 20 D3D) | 20 v3-FINAL documents (14 original + 4 Hero/Cockpit + 2 Login 3D) | 32 build phases | Full 3D UI Migration COMPLETE (7 phases, 49 components, dashboard/auth/game/marketing) | Enhancement 1.1 IMPLEMENTED (37.8M Cockpit Upgrade) | Enhancement 1.2 PLANNED | CPA v2.0 IMPLEMENTED (Single Canvas + Seamless Handoff) | Hero Animation v2.0 IMPLEMENTED | Login 3D Enhancement IMPLEMENTED (3D Portal + Demo Login) | D3D Overhaul IMPLEMENTED (Desktop-First, 50M budget, Mechanical Iris, Scene Routing) | 20 D3D decision locks (9 D3D + 6 D3D-B + 5 D3D-C) | AmbientParticles REMOVED (Decision 20.0) | HolographicHUD REPOSITIONED (Decision 6.0: peripheral frame) | Flagship Game Audit COMPLETE (17 bugs fixed, 6 games expanded 2-3x, AI content infra added) | FL-Lite Game Audit COMPLETE (43 bugs found, 9 games expanded ~11x, 27 AI content types) | Standard Tier Game Audit COMPLETE (76 bugs found, 20 games planned ~11x expansion, 60 AI content types, 6-phase roadmap) | **v6.5 (April 21, 2026): D3D-5 relaxation authorized — user-facing Performance toggle in Settings may omit DepthOfField + N8AO/SSAO (opt-in, persisted).** | April 21, 2026*
