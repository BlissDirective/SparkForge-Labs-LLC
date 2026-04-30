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

## D. Concept C1 — Agent Atelier

> *"Hire a team of AI specialists, wire them together, and run a mission. Every team member knows one thing really well."*

### D.1 Headline

You are the **Atelier Director** of an AI workshop. The world has stopped using single all-purpose AI assistants — modern AI works in teams (Doc 1 §1). Your job is to assemble those teams. Each session, a *mission card* arrives ("plan a birthday party", "fact-check a science article", "design a recyclable lunchbox"). You drag specialist agents (Researcher, Planner, Writer, Critic, Coder, Estimator…) onto a 3D atelier floor, wire their outputs into each other's inputs (MCP-style), then press **Run Mission** and watch the team work — with success, failure, and surprise outcomes traced visually.

### D.2 Lab Placement (DUAL-SPEC)

| Path | Lab | Lab name | Color | Notes |
|---|---|---|---|---|
| **Path A** *(if Lab 11 not adopted)* | **Lab 5** | AI Helpers | `#00D17A` (green) | Joins Pet Trainer's lab. Lab 5 narrative becomes "all kinds of helpers, including teams of helpers." |
| **Path B** *(if Lab 11 adopted)* | **Lab 11** | Agentic AI | `#6FFFE6` (mint-cyan) | First flagship in the new lab. Anchors the "build → equip → constrain" arc. |

Either way: same code. Only `lab` and `labName` fields differ in the registry entry.

### D.3 Research Anchors

- **Doc 1 §1.1–§1.4** — Multi-agent systems, "delegate, review, own"
- **Doc 1 §1.4 Pertinent Patterns** — specialization, MCP wiring, inter-agent protocols
- **Doc 1 §8.1** — Pillar: Orchestration

### D.4 Phase Structure (13 phases)

```typescript
type Phase =
  | 'welcome'            // Hero overlay + voiceover
  | 'learn-team'         // Card 1: "Why teams beat solo AIs"
  | 'learn-roles'        // Card 2: 12 specialists explained
  | 'learn-wiring'       // Card 3: MCP-style ports + protocols
  | 'meet-agents'        // Interactive: hover each agent for backstory
  | 'tutorial-mission'   // Guided 1-mission build
  | 'pick-mission'       // Mission gallery (8 hand-built + AI-generated)
  | 'assemble'           // Drag agents onto atelier floor
  | 'wire'               // Connect output→input ports
  | 'simulate'           // Watch team execute (animated trace)
  | 'inspect'            // Step-by-step trajectory log
  | 'iterate'            // Patch wiring, re-run
  | 'report';            // Mission grade + agent MVP + replay
```

13 phases ≈ 2× the 5–7 of current flagships.

### D.5 Specialist Agent Roster (12)

Three tiers: 4 always available (band A entry), 4 unlock at band B, 4 unlock at band C.

| Tier | Agent | Role | Inputs | Outputs |
|---|---|---|---|---|
| A | **Researcher** | Looks things up | `topic` | `facts[]` |
| A | **Writer** | Turns notes into prose | `notes`, `tone` | `text` |
| A | **Planner** | Breaks goals into steps | `goal` | `steps[]` |
| A | **Estimator** | Predicts time/cost | `task` | `time`, `cost` |
| B | **Critic** | Finds flaws in others' work | `artifact` | `issues[]` |
| B | **Coder** | Writes small programs | `spec` | `code` |
| B | **Translator** | Switches languages or styles | `text`, `target` | `text` |
| B | **Summarizer** | Compresses long text | `text`, `budget` | `text` |
| C | **Router** | Picks which agent runs next | `state` | `next_agent` |
| C | **Toolsmith** | Wraps an outside tool (calc, calendar) | `request` | `tool_result` |
| C | **Judge** | Scores final outputs | `artifact`, `rubric` | `grade` |
| C | **Memory** | Remembers across runs | `key`, `value` | `recall` |

### D.6 Mission Library (8 hardcoded × 3 difficulty = 24 + 12 AI-generated = 36 content units)

Hardcoded missions, each with `easy / medium / hard` variants:

1. **The Birthday Plan** — plan a kid's birthday for a $40 budget
2. **The Fact Check** — verify three claims from a science article
3. **Lunchbox Re-Design** — propose a recyclable lunchbox with cost estimate
4. **The Story Editor** — improve a 3-paragraph story
5. **Homework Hot Seat** — solve a multi-step word problem
6. **Travel Trio** — plan a 3-city train trip with constraints
7. **Pet Schedule** — daily care plan for a hamster + a fish
8. **Build a Joke** — generate 5 kid-safe jokes about a noun

Plus **12 AI-generated mission cards** per session (rate-limited via existing `ai-content-generator.ts` infra).

### D.7 Game Loops (2)

- **Loop 1: Mission mode** — pick mission, assemble + wire team, run, get graded, retry. Score-tracked.
- **Loop 2: Free Play** — no mission, no grade. Build any team, throw any prompt, observe.

### D.8 3D / Visual

| Asset | File | Purpose |
|---|---|---|
| `AgentAtelier3D.tsx` | `src/components/3d/` | Atelier floor — circular dais, agent slots, glowing wire connections (TubeGeometry along CatmullRomCurve3, mirroring AgentPipeline3D) |
| `AgentAtelierEnvironment.tsx` | `src/components/3d/environments/` | Workshop-loft setting: pinboards, drafting tables, hanging tools (within 20M tri budget) |
| Particles | inline | 12 lab-colored sparks (mint-cyan if Lab 11, green if Lab 5) |

**Camera preset (added to `gameRegistry.ts`):**
```typescript
'agent-atelier': { position: [0, 4, 8], lookAt: [0, 0.5, 0], fov: 50 }
```

### D.9 State Schema

New Zustand slice (lives in `src/stores/agentAtelierStore.ts` — follows `STATE_ARCHITECTURE.md` convention):

```typescript
interface AgentAtelierState {
  team: PlacedAgent[];          // up to 8 agents on atelier floor
  wires: Wire[];                // output→input connections
  mission: Mission | null;
  trajectory: TrajectoryStep[]; // per-step log built during simulate
  grade: MissionGrade | null;
  missionsCompleted: string[];  // for unlock progression
}
```

### D.10 Persistence (Supabase migration)

```sql
-- supabase/migrations/2026XXXX_agent_atelier_compositions.sql
create table agent_compositions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  name text not null,
  team jsonb not null,    -- PlacedAgent[]
  wires jsonb not null,   -- Wire[]
  created_at timestamptz default now()
);
create index agent_compositions_child_idx on agent_compositions(child_id);
alter table agent_compositions enable row level security;
-- RLS: child can read/write own, parent can read child's.
-- (advisor check after DDL per CLAUDE.md §2)
```

### D.11 Integration Points (refer to existing flagship code)

| Pattern | Reference |
|---|---|
| Phase machine | `AgentArchitectGame.tsx:48` |
| 3D Canvas embedding (no inner Canvas) | `STAGE6E_v3FINAL_A.md` lines 4–11, D3D-B1 |
| Mission gallery pattern | `BiasDetectiveGame.tsx` cases phase |
| AI content slot | `src/lib/ai/ai-content-generator.ts` — add `'agent-atelier'` GameId, 6 ContentTypes |
| Triangle budget | 20M (flagship desktop) per `gameRegistry.ts:69` |

### D.12 AI Content Types (6 new — added to `ai-content-generator.ts`)

| ContentType | Per band | Purpose |
|---|---|---|
| `mission-card-A` | A | Simplified missions, 1 goal, ≤ 3 steps |
| `mission-card-B` | B | Standard missions, 2-step goals |
| `mission-card-C` | C | Multi-objective missions, soft constraints |
| `agent-bio-A` | A | Picture-card backstory ≤ 30 words |
| `agent-bio-B` | B | Backstory + tip ≤ 80 words |
| `agent-bio-C` | C | Full backstory + real-world analog ≤ 200 words |

### D.13 Acceptance Criteria

- [ ] 13 phases implemented with `Phase` union
- [ ] 12 specialists with valid input/output port shapes
- [ ] 8 hardcoded + 12 AI-generated missions per session
- [ ] 3 age bands (A 2D fallback, B/C full 3D)
- [ ] `agent-atelier` slug + entry in `gameRegistry.ts`
- [ ] Camera preset added
- [ ] `agent_compositions` migration applied; RLS verified via `get_advisors`
- [ ] WebGPU+TSL primary path; MP4-poster fallback per CLAUDE.md §1
- [ ] All ARIA labels; chrome bezel + LED rim
- [ ] WCAG sweep: text contrast `/50+` per CLAUDE.md T19
- [ ] Estimated TSX lines: ~3,000 (≥ 2× current flagship median ~1,650)

---

## E. Concept C2 — Context Architect

> *"The AI's brain has a shelf, and the shelf is small. What you put on it matters more than how big the AI is."*

### E.1 Headline

The AI assistant in Context Architect has a fixed-size **context shelf**. Every turn, the player chooses **what to keep, what to offload, what to retrieve, and what to compress** — the four canonical "moves" of context engineering (Doc 1 §4.1, §4.2, §9.1). As the conversation grows, **Context Rot** sets in: too much on the shelf, accuracy drops. The player must defeat Rot by becoming a careful curator.

### E.2 Lab Placement

**Lab 8 — Words & Language** (`#8F96FA`, violet). Single-spec. Words are about *what gets said*; context engineering is about *what gets remembered*. Natural fit.

### E.3 Research Anchors

- **Doc 1 §4.1–§4.5** — Context engineering definition, four moves, Context Rot
- **Doc 1 §3.2** — long context windows + caveats
- **Doc 1 §9.1** — mechanic: sort context shelves under a token budget

### E.4 Phase Structure (12 phases)

```typescript
type Phase =
  | 'welcome'
  | 'learn-shelf'        // Card 1: "What's a context window?"
  | 'learn-budget'       // Card 2: token budgets visualized
  | 'learn-moves'        // Card 3: Offload / Retrieve / Isolate / Reduce
  | 'learn-rot'          // Card 4: Context Rot demonstration
  | 'tutorial'           // 1 guided round with overlays
  | 'sort-mode'          // Loop 1: sort knowledge cards onto shelf
  | 'budget-mode'        // Loop 2: same, but under token budget
  | 'multi-turn-mode'    // Loop 3: multi-turn conversation, manage history
  | 'rot-boss'           // Boss round: 50 cards, shrinking budget
  | 'design-shelf'       // Free play: design own knowledge base
  | 'report';            // Score breakdown + best/worst decisions
```

12 phases.

### E.5 Knowledge Card Library (48 cards)

48 hand-built knowledge cards across 6 themes (8 cards each), each with 4 metadata properties used by the budget engine:

| Theme | Examples |
|---|---|
| **Animals** | "Cats see UV light", "Octopus has 9 brains", "Honeybees recognize faces"… |
| **Space** | "Saturn would float in water", "1 Mars day = 24h 39min", "Sun's core: 27M°F"… |
| **Tech** | "Wi-Fi is radio waves", "QR codes can store URLs", "Phones use 6+ sensors"… |
| **Body** | "Brain uses 20% of energy", "Bones renew every 10 years"… |
| **Earth** | "Sahara was a forest 6000 yrs ago", "Lightning hits Earth 100×/sec"… |
| **Math** | "Zero invented ~600 CE in India", "Prime numbers go on forever"… |

Each card has:
- `tokens: number` — how much shelf-space it consumes (8, 16, 32, 64)
- `relevance: 0-1` — to current question
- `decay: 0-1` — how much value is lost when summarized
- `freshness: number` — how many turns ago it became known

### E.6 The Four Moves (mechanic core)

Each turn the player can apply one of four moves to a card:

| Move | What it does | Cost |
|---|---|---|
| **Offload** | Card moves to "external memory" — costs 1 retrieval to bring back | Free |
| **Retrieve** | Pull a card back from external memory | Costs 1 turn |
| **Isolate** | Card hidden from the next agent only | Free |
| **Reduce** | Summarize: half tokens, but `decay`-loss applied | Free |

### E.7 Game Loops (3)

- **Loop 1: Sort Mode** — questions arrive, place relevant cards on shelf
- **Loop 2: Budget Mode** — same, but under a strict token budget that shrinks each round
- **Loop 3: Multi-turn Mode** — full conversation, manage history while staying under budget

### E.8 3D / Visual

| Asset | File | Purpose |
|---|---|---|
| `ContextShelf3D.tsx` | `src/components/3d/` | The shelf itself: a glowing 3D bookshelf with cards as floating slabs. Token-bar fills as cards added. Color-coded by relevance. |
| `ContextArchitectEnvironment.tsx` | `src/components/3d/environments/` | Library setting — towering shelves disappearing into mist, archive ladders. |

**Camera preset:**
```typescript
'context-architect': { position: [0, 2, 5], lookAt: [0, 1, 0], fov: 46 }
```

### E.9 State Schema

```typescript
interface ContextArchitectState {
  shelf: ContextCard[];
  external: ContextCard[];       // offloaded
  budget: number;                // current token budget
  used: number;                  // tokens currently on shelf
  question: Question | null;
  rotLevel: number;              // 0..1, increases as shelf gets crowded
  conversationHistory: Turn[];   // for multi-turn mode
  score: number;
}
```

### E.10 Persistence

**No new migration required.** Score and progress hook into existing `child_progress` and `game_sessions` tables.

### E.11 AI Content Types (9 new)

| ContentType | Per band | Purpose |
|---|---|---|
| `question-A` | A | Simple yes/no questions ≤ 20 tokens of context needed |
| `question-B` | B | Standard, 1-2 cards needed |
| `question-C` | C | Multi-fact questions, 3+ cards |
| `distractor-A/B/C` | each | "Decoy" cards that look relevant but aren't |
| `summary-rubric-A/B/C` | each | Eval criteria for player's reduce-move |

### E.12 Integration Points

| Pattern | Reference |
|---|---|
| Multi-mode loop pattern | `BiasDetectiveGame.tsx` (cases / investigate / testlab / fix) |
| 3D shelf vs UI overlay | similar to `NeuralBuilderGame.tsx` build phase |
| AI content slot | `ai-content-generator.ts` add `'context-architect'` GameId + 9 ContentTypes |

### E.13 Acceptance Criteria

- [ ] 12 phases implemented
- [ ] 48 hand-built knowledge cards × 4 metadata properties each
- [ ] Four moves (Offload/Retrieve/Isolate/Reduce) wired to budget engine
- [ ] 3 game loops (Sort / Budget / Multi-turn)
- [ ] Boss round with shrinking budget
- [ ] Context Rot visualization (shelf glows red as Rot rises)
- [ ] 3 age bands fully supported
- [ ] `context-architect` registry entry + camera preset
- [ ] AI content slot with 9 ContentTypes
- [ ] WCAG sweep + ARIA + chrome bezel
- [ ] Estimated TSX lines: ~3,200

---



