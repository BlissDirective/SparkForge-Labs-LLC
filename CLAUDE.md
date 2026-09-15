# SPARKFORGE — CLAUDE.md

## Autonomous Development Playbook for Claude Code

**Version:** 7.0 | **Date:** 2026-09-15 | **Vision:** Hologram-Forge Hub
**Status:** **APPROVED by the owner 2026-09-15 (AP-W0-04).** Live agent playbook.
**Supersedes:** CLAUDE.md v6.5–6.8 (Laboratory Control Station as the *live* kid-facing shell). v6.x remains the historical cockpit-era playbook. Product direction lock: [`docs/01-decisions/2026-09-forge-hub.md`](docs/01-decisions/2026-09-forge-hub.md) (2026-09-14) and TAP v2.2.

> **Conflict rule:** this v7 playbook is the agent autonomy source. On forge-hub architecture and operating model, `docs/forge-hub/TRANSITION_ACTION_PLAN.md` v2.2 (§1 target end state, §2 architecture, §11 team operating model) still wins. Agents may **not** reopen decisions 1–14; only the owner may.

> **Branching:** `setup-sparkforge-dev` is the default and only integration branch. There is no `main`; never create one. Work branches are `grok/<callsign>/<task-id>-<slug>` (agents) or `claude/<slug>` (audits). CI runs on pushes to those and on PRs into `setup-sparkforge-dev`.

---

## 1. PROJECT IDENTITY

SparkForge is a gamified AI learning platform for children ages 7–16. It teaches AI concepts through **42 interactive games** across **11 themed Labs** (Lab 11 *Agentic AI* adopted April 30, 2026 — see *Lab-11 Adoption Decision* below).

**Live kid-facing vision (v7):** the **Hologram-Forge Hub** — a warm rose-gold / cream forge room with three cyan hologram slabs, a desk-bound Sparky, and one persistent R3F stage on desktop/ultrawide. See *Forge Hub (v7)* below.

**Historical (v3–v6.8, not the live shell):** Frost-Prismatic Laboratory Control Station — chrome bezels, 8-phase hero arrival, cockpit spatial dashboard, wormhole lab entry. That language is retired as product vision. Cockpit code remains in-tree until W9 archive; do not extend it as the kid shell.

### Forge Hub (v7) — live product vision

**Sources:** TAP v2.2 §1–§2 · decision lock `docs/01-decisions/2026-09-forge-hub.md`.

- **Desktop and ultrawide (≥ 1440 px):** every kid-facing route lives inside one persistent forge stage (room, emitter, desk, three glass slabs). Fixed camera. Navigation is choreographed morphs, never a page flash. Modes include `welcome`, `hubSplit`, `labsBrowse`, `gameLobby`, `playStage`, `avatarStudio`, `settingsDock`, `cinematic`, plus Focus/Dual sub-layouts. Parent, billing, security, legal, and admin routes are `FLAT` (`EscapeFlat`); the stage pauses.
- **One canvas in the root layout**, mode by pathname; FLAT routes pause and hide it. Renderer: `three/webgpu` via `createRenderer` + TSL (WebGPU → WebGL2 → poster). Flag family `FORGE_HUB*` in `src/config/feature-flags.ts`. No production flag flip without an owner packet.
- **Panels:** DOM panels projected from the 3D scene. Glass meshes carry motion; DOM content rides them and **never stretches**. Reading plate: opaque ≥ 0.85 backing inside the glass. Yaw ≤ 8° as CSS perspective; forms, games, and long text sit at yaw 0.
- **LCP:** the LCP element on every route is **HTML text** (or an eager image), never a script-hydrated canvas. The stage loads after LCP. Pre-hydration: static rects over a poster of the plate.
- **Welcome:** `welcome` = shrunken side panels (HoloL / HoloR) with hero key details + center login (HoloC) under "Welcome to SparkForge". `/`, `/login`, `/signup` share the scene. Marketing long-scroll is dropped (decision 11); pricing + legal stay flat.
- **Hub:** after login, sides grow to equal (`hubSplit`); HoloC becomes today's mission.
- **Games:** play inside the merged hologram **`PlayStage` by default**, with a per-game fullscreen escape hatch. **Never edit** `src/components/games/*`.
- **Sparky:** rigged 3D character on the desk (not a painted dock, not overlay-only). Face from the expression system; outfit packs by calendar; 2D stills from the same model for in-game + compact. Conversation is the head-emitter **HoloBubble** (text only in v1).
- **State:** **no new Zustand store.** Repurpose `sceneStore` → `forgeStore` (`mode`, `previousMode`, `morphProgress`, `portalPhase`, `activePanel`, `hoveredPanel`, `sparky`, `flatOverlay`, `holoBubble`, `frameloop`). `cockpitStore` / cockpit atoms retire with W9.
- **Choreography:** every state change is a directed, interruptible Director sequence (GSAP runtime; Theatre.js for authored beats). `prefers-reduced-motion` → 200 ms crossfade.
- **OVERLAY-CRIT-001:** never put `filter`, `transform`, or `backdrop-filter` on `html`, `body`, or an app-shell wrapper. `EscapeFlat` sits outside any transformed forge wrapper.
- **Art lock:** never regenerate or restyle `public/forge-hub/` bytes. SSIM ≥ 0.96 vs `public/forge-hub/world/LOCKED_HUB.jpg` (LOCKED_HUB). Verify `SHA256SUMS` if near that folder.
- **Rollback:** `FORGE_HUB` off returns the HTML shell on every tier.

### Lab-11 Adoption Decision (v6.7 — April 30, 2026)

**Decision:** Lab 11 *"Agentic AI"* (`#6FFFE6` Mint-Cyan, OKLCH `oklch(0.85 0.16 175)`, icon 🕸️) added to the canonical lab system. Reasoning: the late 2025–early 2026 industry pivot to multi-agent / harness-engineered systems is the dominant AI-engineering trend (per `docs/research/01-AI-Trends-Research.md` §1, §2, §8), and the new SparkForge flagship cohort (Stage 11A–11G) clusters three concepts (C1 Agent Atelier, C6 MCP Plug-and-Play Lab, C7 Harness Forge) tightly around it — the **Build → Equip → Constrain** narrative arc.

**Files affected (already implemented):**

- `src/config/labColors.ts` — 11th `LabColor` entry; `family` union extended with `'Mint-Cyan'`.
- `src/config/labs.ts` — `LAB_ICONS[11] = '🕸️'`.
- `src/stores/cockpitStore.ts` — `LAB_COUNT = 11`, ring math recalculated. *(historical cockpit store; W9 retires it into `forgeStore` — do not extend as the kid shell.)*
- `src/components/3d/HolographicLabMap.tsx` — local `LAB_COLORS` + `LAB_ADJACENCY` extended; `_LAB_ANGLE_STEP_RAD = 2π/11`.
- `src/types/index.ts` — `LABS` array gains 11th entry (games array starts empty; populated as Stages 11D / 11E / 11G ship).
- `tailwind.config.ts` — auto-generated via `buildTailwindLabColors()`. No manual change.

**Source documents:** `docs/research/02-Flagship-Game-Concepts.md` Section B (the Lab-11 proposal that was adopted), Section K.5 (Stage 11A–G build sequence).

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15 (App Router, Turbopack) | Full-stack React 19 |
| Language | TypeScript (strict mode) | Type safety |
| Styling | Tailwind CSS 4 (Oxide engine) | Utility-first CSS |
| Database | Supabase (PostgreSQL + Auth + Storage) | All persistent data |
| State | Zustand (~19 stores) + Jotai (3D atoms) | Client state. **No new Zustand store** for forge-hub — repurpose `sceneStore` → `forgeStore`. |
| Data Fetching | React Query (@tanstack/react-query) | Server state + caching |
| Validation | Zod | Schema validation |
| Payments | Stripe | Subscriptions (Free/Plus/Forge) |
| AI | Anthropic Claude API | Prompt Lab game + Content Agent |
| 2D Motion | Motion (ex Framer Motion) + GSAP | Transitions, scroll |
| 3D Rendering | React Three Fiber v9 + drei + postprocessing + three-bvh-csg | 3D scenes + WebGPU+TSL (Three.js r183+). Forge stage: WebGPU → WebGL2 → poster. |
| Charts | @nivo/core + @nivo/line + @nivo/bar + @nivo/radar | Data visualization |
| Audio | Tone.js | Game audio feedback |
| Monitoring | Sentry (@sentry/nextjs) | Error tracking + performance |
| Testing | Vitest + Playwright + MSW | Unit, integration, E2E tests |
| Deployment | Vercel | Production hosting |

### Tech Quality Mandate (v6.6 — April 28, 2026)

**Use the highest-quality tech stack tool available, at all times.** Quality and visual fidelity are the only first-order constraints; workload, build time, generation cost, and bundle size are *informational* and must be reported to the user, but they are **not** restrictions on tool choice. The only valid reasons to refuse a higher-quality tool are:

1. The tool would introduce a *functional conflict* with another locked stack component (e.g. would break the single root-layout forge canvas, TAP §2.1, or the WebGPU → WebGL2 → poster fallback chain).
2. The tool is not in a stable release channel.
3. The user explicitly downgrades the choice in chat.

**Implications already in effect:**

- **Forge stage (kid shell, desktop/ultrawide):** `three/webgpu` via `createRenderer` + TSL materials. WebGPU first, automatic WebGL2 backend, poster of the locked plate below that (or on `Canvas3DErrorBoundary`). No shader fork for compact tier — compact never mounts the canvas.
- All branding-surface materials (`BrandingMaterial.tsx`, `<BrandWordmark>`) draw from a single source-of-truth config (`src/lib/branding/sf-material.config.ts`) — eye-extracted from `public/branding/IMG_4607.png`. No duplicate material code paths.
- Visual checkpoints halt at **SSIM ≥ 0.96** vs reference (Mythos halt rule). Forge-hub room shell: SSIM ≥ 0.96 vs `LOCKED_HUB.jpg`. Iterate until convergence; never ship below threshold.
- Optional dependencies that materially raise the visual ceiling (e.g. `three-bvh-csg`, `@theatre/core`) are added without budget review when their use is documented in a phase plan. Workload, build time, generation cost, and bundle size are **informational** — report them; they are not a reason to refuse the higher-quality tool.
- **Historical (cockpit-era hero):** live hero animation was WebGPU+TSL-only with an MP4 poster and no WebGL2 chain. That path is not the kid-facing shell. Do not revive it as product vision.

### Mobile Fallback Policy (v6.8, aligned v7 forge-hub)

**Compact `< 1440` = HTML shell, no canvas. Desktop ≥ 1440 = forge stage. LCP = HTML text.** The desktop-only D3D mandate stays superseded. Single source of truth: `src/hooks/useDeviceProfile.ts`.

- **Compact (`mobile` + `tablet`, width < 1440):** today's HTML dashboard shell stays as the compact-tier shell, restyled to the forge-hub palette. **No canvas** below 1440 px. 2D Sparky stills from the same 3D model. Same page content components as desktop slots.
- **Desktop / ultrawide (width ≥ 1440):** Hologram-Forge Hub stage (not cockpit chrome). Tech Quality Mandate still applies inside this branch.
- **LCP:** HTML text or an eager image on every route, including desktop. The forge stage loads after LCP (poster + static rects before hydration).
- **No-GPU desktop or canvas crash:** unmount the stage; poster of the plate behind the same DOM panels; 2D Sparky. Nothing functional is lost.
- **Current code (until W4/W9 cutover):** `CockpitCanvasGate` still short-circuits to `<MobileDashboard />` on compact; `MobileDashboard.tsx` is the live HTML shell (header + Demo badge + level/XP/streak + Continue CTA + nav tiles + 11-lab grid). Pre-hydration SSR still assumes desktop. Do not add a second compact canvas. Do not extend cockpit chrome for compact.
- **Reduced-motion:** Director replaces morphs/beats with a 200 ms crossfade. Existing honors (`useHeroAnimation`, ScrollJourney, `useParallaxMouse`, cockpit floor pulse while that code remains) stay. Do not add independent tweens that ignore `prefers-reduced-motion`.

Tier thresholds (same cut as TAP decision 4 / `useDeviceProfile`):
- `mobile`: width < 768
- `tablet`: 768 ≤ width < 1440  ← compact HTML shell; **no canvas**
- `desktop`: 1440 ≤ width < 1920  ← forge stage
- `ultrawide`: width ≥ 1920  ← forge stage



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
- **Execute Supabase operations via MCP connector** — `execute_sql`, `apply_migration`, `list_tables`, `list_migrations`, `list_extensions`, `get_advisors`, `generate_typescript_types`, `deploy_edge_function`, `get_logs`, etc. User grants full Supabase autonomy **provided the SQL/migration/function payload has been reviewed with the user prior to execution**. Project ref: `gqoaknfboahuqvgpidgw`. Always run `get_advisors` after DDL changes to catch missing RLS policies.

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

### Forge Hub hard rules (v7; TAP §11.3)

These are absolute. They do not weaken existing autonomy rules; they constrain forge-hub work.

- Never regenerate, re-render, recompress, upscale, or restyle any file under `public/forge-hub/`. Run `cd public/forge-hub && sha256sum -c SHA256SUMS` before and after any task that touches that folder.
- Never edit `src/components/games/*`. Never skip, disable, or quarantine a test.
- Never add a Zustand store. Repurpose `sceneStore` → `forgeStore`. Never put `filter`, `transform`, or `backdrop-filter` on `html`, `body`, or an app-shell wrapper (OVERLAY-CRIT-001).
- Never create a release tag, create or delete a long-lived branch, flip a production `FORGE_HUB*` flag, or change Vercel production / GitHub repository settings without an owner packet marked Approve.
- Never reopen decisions 1–14. Propose amendments; do not relitigate.
- **CI and config changes ride in their own PR** (Inspector or Gatekeeper lane), never inside a feature PR. A weakened check (scan scope, skipped assertion, relaxed threshold) is Tier 1 at least and is named in the PR title.
- **Gates need measured numbers.** P1 is not passable without a real SSIM score from `scripts/ssim-forge-hub.mjs` (`.forge-hub-ssim/report.json`, captured from a live canvas, ≥ 0.96 vs `LOCKED_HUB.jpg`). A stub, a skipped run, or a poster capture is not a number. The same applies to frame-time and launch budgets in TAP §8.
- **Never merge with a red required check.** A failure that predates the PR is reported and fixed or ported per the CI-red rule; it is not merged past.

### HARD STOPS — Wait for Human Input

A hard stop means: **STOP ALL WORK. Output a clear status message. Wait for the human to respond before continuing.**

| ID | Trigger | When | What to Tell Human |
|----|---------|------|--------------------|
| HS-1 | Supabase project setup | Before Stage 2 Part 1 | "HARD STOP: I need your Supabase project URL, anon key, and service role key added to `.env.local` before I can proceed with Stage 2." |
| HS-2 | Stripe account setup | Before Stage 8 Part 1 | "HARD STOP: I need your Stripe test-mode API keys and 4 price IDs (Plus monthly, Plus yearly, Forge monthly, Forge yearly) added to `.env.local`." |
| HS-3 | Anthropic API key | Before Stage 9 Part 1 | "HARD STOP: I need your `ANTHROPIC_API_KEY` added to `.env.local`." |
| HS-4 | Vercel deployment | Before Stage 10 deploy step | "HARD STOP: I need you to create a Vercel account, connect the GitHub repo, and configure environment variables in the Vercel dashboard." |
| HS-5 | Stage-level visual verification | After completing ALL parts of a stage | "VISUAL CHECKPOINT — Stage N complete. Please run `npm run dev`, open localhost:3000, and verify: [specific checklist]. Reply Approve to continue or describe issues." For forge-hub kid-visible work, use P1–P7 / C1–C7 packets instead of cockpit-era checklists. |
| HS-6 | Build failure after 2 auto-fix attempts | Any time | "HARD STOP: Build is failing and I've exhausted auto-fix attempts. Here's the error: [error]. Here's what I've tried: [attempts]. Please advise." |
| HS-8 | GLB/3D asset creation | Stage 6B (Pet Trainer) | "SOFT NOTE: Pet Trainer will use procedural fallback (orb) until GLB assets are placed in `public/models/pets/`. This is non-blocking — game is fully playable." |
| HS-9 | **HISTORICAL** Hero-to-Cockpit handoff | Cockpit-era Phase 5D | **Retired as a live gate.** Do not verify 8-phase hero → cockpit as the kid shell. Live gates: P1 room shell + `welcome` / `hubSplit`. |
| HS-10 | **HISTORICAL** Login 3D + crystal portal | Cockpit-era Phase 5F | **Retired as a live gate.** Demo login lives on HoloR in `welcome`. Live gate: P2 (login form on HoloC through `welcome → hubSplit → playStage → gameLobby → welcome`) and P3 Wave 1 routes. |

### Forge Hub visual gates (v7 — replace cockpit-era HS-9 / HS-10)

Owner visual checkpoints (TAP §4 + SPARKY-CHARACTER-SPEC §11). Reply **Approve** on the gate packet. Kid-visible work does not pass a gate without that word.

#### Phase gates P1–P7

| ID | Trigger | When | What to tell the owner |
|----|---------|------|------------------------|
| P1 | Room shell + placeholder Sparky | After W1 / W3 steps 2–3 | "VISUAL CHECKPOINT — P1. Verify: (1) `/dev/forge-hub` at SSIM ≥ 0.96 vs `public/forge-hub/world/LOCKED_HUB.jpg`, (2) ignition plays, (3) WebKit shows the poster fallback, (4) placeholder Sparky walks desk spots and reacts to mode changes, (5) fixed camera (no free-look), (6) SHA256SUMS still OK. Reply Approve / Revise / Reject." |
| P2 | Screen kit + Director | After W2 / W7 | "VISUAL CHECKPOINT — P2. Verify: (1) login form on HoloC survives `welcome → hubSplit → playStage → gameLobby → welcome` with content never stretching, (2) Director timelines tested, (3) forge-hub theme applied, (4) PR #164 ported and closed, (5) `EscapeFlat` outside any transformed wrapper (OVERLAY-CRIT-001), (6) axe + keyboard-only pass. Reply Approve / Revise / Reject." |
| P3 | Welcome, auth, home | After W4 wave 1 + W6 | "VISUAL CHECKPOINT — P3. Verify: `/`, `/login`, `/signup`, `/home`, `/onboarding` on the stage; compact `<1440` is HTML-only (no canvas); LCP is HTML text; Lighthouse a11y/CLS gates real. Reply Approve / Revise / Reject." |
| P4 | Labs, content, games on glass | After W4 waves 2–3 + W5 | "VISUAL CHECKPOINT — P4. Verify: lab browse → lesson → game on `PlayStage` and back with no renderer re-init; all 42 games swept; `fullscreen` escape-hatch list agreed; **zero** `src/components/games/*` edits. Reply Approve / Revise / Reject." |
| P5 | Rigged Sparky + remaining kid routes | After W3 steps 5–8 + W4 waves 4–5 | "VISUAL CHECKPOINT — P5. Verify: rigged Sparky live with the clip set; First Day / Sharp Suit / nearest seasonal pack; HoloBubble replaces the floating tutor; every kid route migrated or FLAT. Reply Approve / Revise / Reject." |
| P6 | Polish and hardening | After W8 / W7 guards | "VISUAL CHECKPOINT — P6. Verify: jobs green flag-on and flag-off; SSIM in CI; reduced-motion pass; COPPA review of Sparky interaction and outfits. Reply Approve / Revise / Reject." |
| P7 | Cutover | After W10 / W9 | "VISUAL CHECKPOINT — P7. Verify: staged rollout; cockpit archive PR; tag only after owner packet Approve. Reply Approve / Revise / Reject." |

#### Character checkpoints C1–C7

| ID | Gate | What the owner reviews | Pass condition |
|----|------|------------------------|----------------|
| C1 | Turnaround and expression sheet | D1 | Reads as `LOCKED_SPARKY.png` from every angle; nine faces unmistakable at 72 px |
| C2 | Blocking model in the room | D2 on the desk in `/dev/forge-hub` | Scale and silhouette feel right beside the holograms |
| C3 | Final model and materials | D3 turntable + still against the plate | SSIM ≥ 0.90 vs a matched crop of the concept; coral / cyan / yellow read under room light |
| C4 | Rig and clip library | D4 and D5 in `/dev/forge-hub` | Every spec clip present and named; no pinching; interruptible blends look natural |
| C5 | Runtime GLB and behaviour | D6 in the hub, reacting to real events | Budgets met; reaction map verified; dome uncovered (outfit rule) |
| C6 | Each outfit pack | D7 in the outfit rack and held poses | Pack rules; thumbnail approved |
| C7 | 2D stills | D8 in the compact shell and a game | Matches the 3D look; 72 px legible |

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
| 3 | Signup → Login → `/home`. Compact `<1440`: HTML shell, no canvas. Desktop ≥1440 with `FORGE_HUB`: forge stage (not station-frame / cockpit chrome). |
| Forge-welcome | `welcome`: HoloL/HoloR ~85% with hero key details; HoloC "Welcome to SparkForge" + login. `/`, `/login`, `/signup` share the scene. LCP is HTML text. Demo login on HoloR. |
| Forge-hub | `hubSplit` after login; sides grow to equal; HoloC = today's mission. Morphs, not page flashes. |
| Forge-playStage | Three slabs merge; game in `HtmlGameShell` `stage` variant; room dims; Sparky reacts. **No `games/*` edits.** Fullscreen only via registry escape hatch. |
| 3-Hero *(historical)* | Cockpit-era 8-phase hero — **retired as the kid-facing shell.** Welcome scene is the marketing hero (decision 11). Do not restore long-scroll marketing. |
| 3-Cockpit *(historical)* | Laboratory Control Station / cockpit-as-product — **retired.** W9 archives cockpit shell, HUD, station frame, NPCs, iris. Salvage renderer/post/error-boundary/`sceneStore`/`deviceStore` only. |
| 3-Login3D *(historical)* | Crystal-portal login card — **replaced** by `welcome` on the forge stage. Keep demo-session timer/expiry behaviour; retarget banners onto `ToastRail`. |
| 4 | Labs browse (`labsBrowse`) → lab Focus; profile `avatarStudio`. Compact remains HTML. |
| 5 | XP popup, streak fire, badge displays, trophy room. Ceremonies re-targeted to the forge stage on desktop. |
| 6 | All 5 flagship games playable: full phase cycle (welcome→learn→play→complete). On desktop, play inside `PlayStage` unless registry `fullscreen`. |
| 7 | All remaining games playable. Game registry lists all 42. Arcade is `gameLobby`. |
| 8 | Parent dashboard + billing are **FLAT**. Pricing is a flat route (no marketing long-scroll). Stripe test checkout works. |
| 9 | Content agent produces content via admin trigger. Admin review dashboard shows items. Admin is FLAT. |
| 10 | Accessibility toolbar, PWA install, Lighthouse audit. All routes resolve (forge or FLAT per TAP §5). Production build clean. `FORGE_HUB` off rolls back to HTML shell. |

### Commit Strategy

**Per-part commits with milestone tags at stage completion.**

```bash
# Per-part commit
git add -A
git commit -m "Stage 3 Part 2: Dashboard shell, sidebar, TopBar"

# Stage milestone tag (after ALL parts + visual approval)
# Forge-hub: never create a release tag without an owner packet marked Approve (TAP §11.3).
git tag -a v0.3.0 -m "Stage 3 complete: Auth + Layout + Station Frame"
```

**Tag format:** `v0.{stage}.0` (e.g., `v0.1.0`, `v0.2.0`, ... `v0.10.0`). Forge-hub cutover tag `v1.0.0-forge-hub` is P7 and owner-gated.

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

### Required Features (ALL 42 games)

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

### Forge Hub constraint (v7) — games on glass

- Default: games play inside merged hologram **`PlayStage`** via `HtmlGameShell` `variant="stage"`. Registry field `stage: 'glass' | 'fullscreen'` defaults to `glass`.
- **Never edit** `src/components/games/*` for forge-hub, overlay, or shell work. Game internals (phases, age bands, `completeGame()`, in-game 3D) stay as they are.
- Phaser/Pixi games (`TreatTrainer`, `SortToyBox`, `BuildClassifier`, `AiOrNot`, `FutureForge`): world `frameloop: 'demand'` so two GPU contexts are never both hot.
- Compact `<1440`: HTML shell; in-game 72 px Sparky stills from the 3D master — still no `games/*` edits.

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
| Forge stage | `src/components/forge-hub/` | `ForgeStage.tsx` |
| Forge config | `src/config/forgeHub.ts`, `src/lib/forge-hub/` | layouts, routeModes, portalMachine |
| Forge store | `src/stores/sceneStore.ts` → `forgeStore` | **Do not add a new store** |
| Locked hub art | `public/forge-hub/` | **Never regenerate**; `SHA256SUMS` |


---




| 

---



### Historical build records (v6.x — not live vision)

The following sections record completed game/content work. They are not the kid-facing shell. Forge-hub must not edit `src/components/games/*` to "update" these.

### Standard Tier Content & AI Integration (April 9-10, 2026) — historical

- **Content expansion:** IMPLEMENTED — 20 games receiving ~3x hardcoded content expansion with difficulty tags. Vocabulary expansions (SentimentScanner 30→90 words). Multi-maze system (TreatTrainer 1→6 mazes).
- **AI prompt templates:** IMPLEMENTED — 60 new content types in `ai-content-generator.ts` (3 per Standard game). 20 new GameIds. Rate limit maintained at 15/game/session.
- **Admin curation pipeline:** Types and validation extended for Standard tier — +20 GameIds, +60 ContentTypes in Zod schema.
- **Difficulty tiers:** IMPLEMENTED — `difficulty?: 'easy' | 'medium' | 'hard' | 'expert'` field added to all content interfaces. DifficultySelector available in all 20 games.
- **Learn phases:** IMPLEMENTED — 12 games received 3 learn cards each (36 total cards). All 20 Standard games now have welcome → learn → play → complete flow.
- **Scoring normalization:** IMPLEMENTED — TimeMachine and RealOrFake normalized to 10pts/correct. DataShield maxScore fixed (240 not 60). Dead state removed from RealOrFake and PixelInvestigator.
- **Shared infrastructure:** IMPLEMENTED — `useSafeTimeout` hook applied to 12 games. `useAnimatedCounter` extracted to shared hook (deduplicated from 5 games).
- **Full audit report:** `StandardTier-game-content-audit(04.09.2026).md` — 8 sections, 76 bugs, 6-phase roadmap.

### Game Code Agent — COMPLETED

The AI Spy game (Lab 1, Game #1) has been implemented via autonomous agent on March 14, 2026. The game is now fully functional at `src/components/games/AiSpyGame.tsx` with all required features (chrome bezel, age bands A/B/C, welcome→play→reveal→complete phases, 12+ scenes, ARIA labels). No remaining games have missing implementations — all 42 games are code-complete. (Audit-corrected count, 2026-06: the library is 42 games across 11 labs, not 35.)

---

## 12. PROGRESS TRACKING

Claude Code maintains a separate **PROGRESS.md** file at the repo root. Update after each part.

### PROGRESS.md Template

```markdown
# SparkForge Build Progress

## Current Phase: [N] — [Stage Name Part X]
## Status: [IN PROGRESS / BLOCKED / COMPLETE]
## Last Updated: [timestamp]



*End of CLAUDE.md v7.0 — SparkForge Autonomous Development Playbook (owner-approved 2026-09-15, AP-W0-04)*
*Live vision: Hologram-Forge Hub (desktop/ultrawide ≥1440 forge stage; compact <1440 HTML shell, no canvas; LCP = HTML text). Decision lock 2026-09-14. TAP v2.2 wins on forge-hub architecture and operating model.*
*Historical v6.x (cockpit-era, not live shell): Laboratory Control Station | 8-phase hero | CPA v2.0 single-canvas handoff | Login 3D crystal portal | 37.8M Cockpit Upgrade | D3D Overhaul / Mechanical Iris | 20 D3D decision locks | AmbientParticles REMOVED | HolographicHUD peripheral frame.*
*Still in force: Tech Quality Mandate (v6.6; highest-quality tools; cost/size informational) | Mobile Fallback Policy aligned v7 | Lab 11 Agentic AI | 42 games / 11 labs | D3D-5 Performance toggle | game template + autonomy/process sections.*
*Forge-hub constraints: no `public/forge-hub/` byte edits | no `src/components/games/*` edits | no new Zustand store (repurpose sceneStore) | OVERLAY-CRIT-001 | SSIM ≥ 0.96 vs the locked hub plate | P1–P7 / C1–C7 owner gates.*
