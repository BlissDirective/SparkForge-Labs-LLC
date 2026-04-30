# 02 — Flagship Game Concepts (5–10 New Flagship Games)

**Document role:** Concept design proposals for 5–10 new flagship games derived from `01-AI-Trends-Research.md`.
**Authored:** April 30, 2026
**Status:** v0.1 — Concepts ready for user feedback before building
**Concept count:** 7 (down-selected from 10 candidates per user decision)
**Lab decision policy:** **Dual-specced** for agentic concepts (C1, C6, C7) — both existing-lab and proposed Lab 11 placements documented.

> **Reading order:** This document assumes you have read `01-AI-Trends-Research.md`. Section numbers like "§9.1" refer to that document.

---

## Executive Summary

Document 1 surfaced **five pillars** of modern AI engineering — Orchestration, Harness, Reasoning, Context, Trust — and **eleven mechanic candidates** (Doc 1 §9.1) that translate cleanly to kid-friendly play. Document 2 takes those candidates and turns **seven** of them into full flagship-grade game concepts, each at **≥ 2× content depth** of current flagship games.

### The 7 Concepts at a Glance

| # | Concept | Primary Pillar | Headline Mechanic | Lab |
|---|---|---|---|---|
| **C1** | **Agent Atelier** | Orchestration | Wire specialist agents into a working team | **Lab 5** *or* **new Lab 11** (dual-spec) |
| **C2** | **Context Architect** | Context | Sort knowledge onto a token-budgeted shelf, beat Context Rot | **Lab 8 — Words & Language** |
| **C3** | **Glass Box Lab** | Trust | Grade every step of an AI's trajectory like a referee | **Lab 6 — AI & Ethics** |
| **C4** | **Pixel Witness** | Multimodal | Watch a clip, ask the AI questions, catch its hallucinations | **Lab 7 — Computer Vision** |
| **C5** | **Pocket Brain** | (foundational) | Run a real LLM in your browser, no server. Feel quantization. | **Lab 1 — What IS AI?** |
| **C6** | **MCP Plug-and-Play Lab** | Orchestration | Snap MCP-shaped tool cartridges into an agent's ports | **Lab 5** *or* **new Lab 11** (dual-spec) |
| **C7** | **Harness Forge** | Harness | Add hooks (pre-tool, post-tool, judge) and watch them fire | **Lab 9** *or* **new Lab 11** (dual-spec) |

### Targets (per the brief — "≥ 2× current flagship content")

Baselined against the 6 existing flagships (5–7 phases, 8–24 content units, 1,100–2,400 TSX lines):

- **≥ 12 phases** (welcome → multiple learn cards → multiple play loops → reflection/judge → complete)
- **3 age-band variants per phase** (A: 7–9, B: 10–12, C: 13–16). Some concepts use B/C only with A 2D fallback (matching Agent Architect / Neural Builder precedent).
- **24–48 distinct content units** (scenes / prompts / scenarios / cards)
- **≥ 2 distinct play loops** for replayability
- **TSX target:** ~2,500–3,500 lines per `*Game.tsx`

### Stack Conformance

All seven concepts are buildable on the **already-locked SparkForge stack** (CLAUDE.md §1):

- Next.js 15 App Router + React 19
- React Three Fiber v9 + drei + WebGPU+TSL (per CLAUDE.md tech-quality mandate)
- Zustand (15 stores) + Jotai (3D atoms)
- Supabase (Postgres + Auth + Storage)
- Anthropic Claude API (existing — used by Prompt Lab + Content Agent)
- **WebLLM / Transformers.js** — *added for C5 Pocket Brain only.* New optional dependency, no replacement of existing infra.
- Sentry observability (existing)

No new infrastructure category is required. Migration impact is detailed in Section 9.

---

## A. Design Framework

This section codifies the conventions every concept below follows. Treat this as the schema for the 7 specs that follow.

### A.1 Phase Structure

Each concept defines a `type Phase = ...` union (matching existing flagship convention — Doc 1 §9.4, plus survey of `AgentArchitectGame.tsx:48`, `BiasDetectiveGame.tsx:64`). All concepts target **≥ 12 phases**, achieved via either:

- **Many short phases** (e.g., welcome → learn-A → learn-B → learn-C → calibrate → play-1 → play-2 → ...), or
- **Fewer large phases with sub-steps** (e.g., a single "play" phase with 8 internal levels).

Both patterns exist in the current 6 flagships and are equally accepted.

### A.2 Age-Band Differentiation

| Band | Ages | Content treatment |
|---|---|---|
| **A** | 7–9 | Heavily guided, 2 choices per step max, picture-first, no jargon, audio support. Some concepts use 2D fallback (matching Agent Architect §4 in `STAGE6E_v3FINAL_A.md`). |
| **B** | 10–12 | Standard depth, 3–5 choices per step, progressive jargon introduction (with hover-to-define), audio optional. |
| **C** | 13–16 | Full depth, real terminology, code/config exposure, links to real research, leaderboard mode. |

### A.3 3D / Visual Pattern

Each concept includes:
- **A `Name3D.tsx` scene** in `src/components/3d/` (within flagship 20M-tri budget)
- **Optional `NameEnvironment.tsx`** in `src/components/3d/environments/` for immersive setting
- **12–15 lab-colored particles** (per CLAUDE.md §7)
- **Chrome bezel + LED rim** (per Frost-Prismatic design system)
- **WebGPU+TSL primary path** (per CLAUDE.md §1 tech-quality mandate)

### A.4 Content Inventory

Every concept lists:
- **Hardcoded content units** — minimum 24, ideally 36–48
- **AI-generated content slots** (where applicable) — maps to existing AI content agent infra (per CLAUDE.md §9 — already supports `ai-content-generator.ts` with rate-limited GameId-keyed generation)
- **Difficulty tiers** — `easy / medium / hard / expert` (matches `StandardTier-game-content-audit(04.09.2026).md` precedent)
- **Replay loops** — at least 2 distinct game modes per concept

### A.5 Required Integrations

Every concept hooks into:
- `useGameStore` for `startGame`, `updateScore`, `advanceRound`, `completeGame`
- `useChildStore` for `activeChild?.age_band`
- `GameShell` wrapper
- ARIA labels on every interactive element
- `useSafeTimeout` for animations (per Standard Tier audit)
- `useAnimatedCounter` for score displays (shared hook per CLAUDE.md §11)

### A.6 Registry Entry Schema

Each concept ships a `GameRegistryEntry` (per `src/config/gameRegistry.ts:14-30`) with:
- `id` — next available sequential
- `slug` — kebab-case
- `tier: 'flagship'`
- `has3D: true`
- `component3D: 'Name3D'`
- `triangleBudget: budget('flagship', true)` — yields `{ desktop: 20_000_000 }`
- `cameraPreset` — added to `CAMERA_PRESETS` per concept

### A.7 Common Migration Surfaces

Most concepts touch the same files. Listing these once here, referenced per-concept later:

| File | Why touched |
|---|---|
| `src/config/gameRegistry.ts` | Add `GameRegistryEntry` |
| `src/config/labs.ts` + `src/config/labColors.ts` | Only if Lab 11 added (concepts C1, C6, C7) |
| `src/components/games/index.ts` | Export new game component |
| `src/lib/ai/ai-content-generator.ts` | Add new `GameId` and `ContentType` Zod schema entries (where AI-generated content used) |
| `supabase/migrations/` | New migration only if a concept needs new persistent shape (e.g., player-saved constitutions, harness configs, trajectory grades) |

---

## B. Lab 11 Proposal — *"Agentic AI Lab"* (Optional)

**Status:** Proposed. User explicitly deferred the lab-mapping decision for agentic concepts (C1, C6, C7), so each of those is dual-specced. This section defines what Lab 11 would look like *if* selected.

### B.1 Lab 11 Identity

| Field | Proposed value |
|---|---|
| `id` | 11 |
| `name` | `'Agentic AI'` |
| `hex` | `#6FFFE6` (Mint-Cyan — fills the unused gap between Lab 5 green `#00D17A` and Lab 7 cyan `#10BAD2`) |
| `oklch` | `oklch(0.85 0.16 175)` — slightly above the 0.75 lightness of the 10 existing labs to signal "newest" |
| `family` | `'Mint-Cyan'` (new family — would extend `LabColor.family` union in `labColors.ts:30-40`) |
| `icon` | `'🕸️'` (web/orchestration motif) |

### B.2 Lab 11 Theme

> *"AI doesn't work alone anymore. In Lab 11, you build teams of AI agents that talk to each other, plug tools into them, and wrap them in safety harnesses — just like the real engineers at Anthropic, Google, and OpenAI."*

Three flagships fit naturally:
- **C1 Agent Atelier** — building the team
- **C6 MCP Plug-and-Play Lab** — wiring tools into the team
- **C7 Harness Forge** — keeping the team safe

This forms a tight three-game arc: **Build → Equip → Constrain.**

### B.3 Tradeoffs

| Pro | Con |
|---|---|
| Tells a coherent narrative across 3 flagships | Adds a lab to a system originally scoped at 10 |
| Aligns with the dominant 2026 AI industry shift (Doc 1 §1) | Modifies `labColors.ts` (single source of truth) — touches Tailwind plugin + 3D color consumers |
| Frees Lab 5 / 9 from feeling overloaded | Marketing materials list "10 themed labs" — would need updating |
| Mint-Cyan slot is visually clean (no neighbor conflict) | Requires lab-map 3D scene update (`HolographicLabMap.tsx`) |

### B.4 Files Affected If Lab 11 Adopted

- `src/config/labColors.ts` — add 11th entry, extend `family` union
- `src/config/labs.ts` — `LAB_ICONS` add `11: '🕸️'`
- `src/components/3d/environments/HolographicLabMap.tsx` *(or whichever file renders the lab map)* — add 11th node + position
- `tailwind.config.ts` — auto-generated via `buildTailwindLabColors()` (no manual change)
- Marketing copy ("10 themed labs" → "11")
- CLAUDE.md "150 design decisions" log — add a new decision entry

### B.5 Default Recommendation

**Slight lean toward "add Lab 11"** — the agentic theme is the *defining trend of the window the research covers*, and three full flagships is a strong basis for a lab. But the call is yours; the dual-specs in C1, C6, C7 are designed to make either path equally cheap.

---

## C. Concept Overview Table

Full specs for each concept follow in sections D–J. This table summarizes what each delivers against the 2× content target.

| # | Concept | Phases | Content Units | Play Loops | Age Bands | New Migration? | New AI Content Types? |
|---|---|---|---|---|---|---|---|
| C1 | Agent Atelier | 13 | 36 (12 specialist agents × 3 missions) | 2 (Build / Free Play) | A 2D fallback / B / C | Yes — `agent_compositions` | 6 (3 per band × 2 modes) |
| C2 | Context Architect | 12 | 48 (knowledge cards) | 3 (Sort / Budget / Multi-turn) | A / B / C | No | 9 (3 per band) |
| C3 | Glass Box Lab | 14 | 40 (trajectory recordings) | 2 (Grade / Design) | B / C (A 2D fallback) | Yes — `eval_grades` | 6 (3 per band) |
| C4 | Pixel Witness | 12 | 24 video clips × 4 Q each = 96 Q-A pairs | 2 (Watch / Build VLM) | A / B / C | No | 6 (3 per band) |
| C5 | Pocket Brain | 13 | 30 prompts × 4 quantization levels = 120 runs | 2 (Explore / Race) | A / B / C | No | 0 (browser-side SLM) |
| C6 | MCP Plug-and-Play Lab | 12 | 25 cartridges + 30 missions | 2 (Mission / Build cartridge) | B / C (A 2D fallback) | Yes — `player_cartridges` | 9 (3 per band) |
| C7 | Harness Forge | 14 | 30 harness scenarios | 2 (Add hooks / Audit) | C only (B simplified, A skipped) | Yes — `player_harnesses` | 6 (3 per band) |

---

