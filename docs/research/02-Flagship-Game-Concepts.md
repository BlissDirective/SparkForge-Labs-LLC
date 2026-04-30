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

## F. Concept C3 — Glass Box Lab

> *"You're not just judging what the AI did. You're judging how it got there. Every step gets a grade."*

### F.1 Headline

The AI used to be a black box: prompt in, answer out. In 2026, every step is on display — what tool it called, what arguments it used, how long it took, what it cost (Doc 1 §6.3). In Glass Box Lab the player becomes the **referee**: a recorded AI trajectory plays back, and the player grades each step on a 5-dimension rubric. Then they design their *own* eval rubric and run it against new trajectories. The "trust" pillar (Doc 1 §8.1) made playable.

### F.2 Lab Placement

**Lab 6 — AI & Ethics** (`#FF7050`, red-orange). Joins Bias Detective. Theme alignment: both games train kids to *judge AI*, not just use it.

### F.3 Research Anchors

- **Doc 1 §6.3** — Production Evals Best Practices (full trajectories: tool choice, argument validity, step count, time/cost, policy compliance)
- **Doc 1 §6.5** — trajectory scoring as "scorecard"
- **Doc 1 §8.1** — Pillar: Trust
- **Doc 1 §6.1** — Constitutional Classifiers (3,000+ hours red-team)

### F.4 Phase Structure (14 phases)

```typescript
type Phase =
  | 'welcome'
  | 'learn-glassbox'     // Card 1: from black box to glass box
  | 'learn-rubric'       // Card 2: 5 dimensions of a trajectory
  | 'learn-toolchoice'   // Sub-card: tool choice correctness
  | 'learn-argvalidity'  // Sub-card: argument validity
  | 'learn-steps'        // Sub-card: step count
  | 'learn-timecost'     // Sub-card: time / cost
  | 'learn-policy'       // Sub-card: policy compliance
  | 'tutorial'           // Guided 1-trajectory grade
  | 'grade-easy'         // 10 simple trajectories
  | 'grade-medium'       // 10 ambiguous trajectories
  | 'grade-adversarial'  // 10 trick trajectories with hidden flaws
  | 'design-rubric'      // Loop 2: design own eval, run on samples
  | 'report';            // Stats + best/worst grades + cert
```

14 phases.

### F.5 Trajectory Library (40 recordings)

40 hand-built trajectory recordings. Each is a sequence of 4–12 steps, with metadata for each step:

| Step Field | Type | Example |
|---|---|---|
| `step` | `number` | `3` |
| `tool` | `string` | `"calculator"` |
| `args` | `object` | `{ "expr": "12 * 15" }` |
| `duration_ms` | `number` | `420` |
| `cost_tokens` | `number` | `87` |
| `policy_flags` | `string[]` | `["safe-content"]` |
| `output` | `string` | `"180"` |
| `expected_grade` | `1-5 per dimension` | reference answers |

Library breakdown:
- **10 Easy** — clearly-correct trajectories (band A entry)
- **10 Medium** — judgment calls (band B/C)
- **10 Adversarial** — subtle errors hidden inside successful-looking outputs (band C — explicitly inspired by Doc 1 §6.2: "LLM-judge vulnerability")
- **10 Cross-link** — replays of other SparkForge games that the player previously completed (e.g., a prior Agent Atelier mission), so kids grade their own past AI runs. **(Powerful narrative hook.)**

### F.6 The Rubric (player grades each step on 5 dimensions, 1–5 stars)

| Dimension | What it measures |
|---|---|
| **Tool Choice** | Did the AI pick the right tool for this step? |
| **Argument Validity** | Were the arguments to the tool sensible? |
| **Step Count** | Was this step necessary, or wasted? |
| **Time / Cost** | Was the time/token cost reasonable? |
| **Policy Compliance** | Does the output respect the rules? |

### F.7 Game Loops (2)

- **Loop 1: Grade Mode** — player grades pre-recorded trajectories. Score = how close to expert-grade.
- **Loop 2: Design Mode** — player designs their own rubric (weights, thresholds), then runs it on the trajectory library. Score = how well their rubric matches expert grades.

### F.8 3D / Visual

| Asset | File | Purpose |
|---|---|---|
| `TrajectoryRail3D.tsx` | `src/components/3d/` | A horizontal rail of step-cards, with the active card raised + lit. Hover reveals all 5 rubric dimensions as glowing pillars beside it. |
| `GlassBoxEnvironment.tsx` | `src/components/3d/environments/` | Courtroom-meets-server-room: wood-grain referee desk, glass walls showing data flowing past, gavel resting under spotlight. |

**Camera preset:**
```typescript
'glass-box': { position: [0, 2.2, 5.5], lookAt: [0, 0.8, 0], fov: 47 }
```

### F.9 State Schema

```typescript
interface GlassBoxState {
  trajectory: Trajectory | null;
  cursor: number;                       // current step
  grades: StepGrade[];                  // accumulating
  rubric: Rubric;                       // editable in design mode
  mode: 'grade' | 'design';
  expertGrades: ExpertGradeMap | null;  // loaded for scoring
}
```

### F.10 Persistence

```sql
-- supabase/migrations/2026XXXX_glass_box_eval_grades.sql
create table eval_grades (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  trajectory_id text not null,
  grades jsonb not null,           -- StepGrade[]
  rubric jsonb,                    -- only set in design mode
  expert_match_score numeric,      -- 0..1 vs expert
  created_at timestamptz default now()
);
create index eval_grades_child_idx on eval_grades(child_id);
alter table eval_grades enable row level security;
-- RLS: child read/write own; parent read child's. Run get_advisors after.
```

### F.11 Cross-Link with Other SparkForge Games

For the 10 "cross-link" trajectories, Glass Box Lab pulls from the player's recent saves in:
- Agent Atelier (`agent_compositions` table) — replay a past mission
- Bias Detective (existing) — replay an investigation
- Prompt Lab (existing) — replay a prompt iteration

This creates a **meta-game loop**: kids learn that *what they did* was itself a trajectory.

### F.12 AI Content Types (6 new)

| ContentType | Per band | Purpose |
|---|---|---|
| `trajectory-A` | A | Simplified 4-step recordings |
| `trajectory-B` | B | 6-step recordings |
| `trajectory-C` | C | 8–12 step adversarial recordings |
| `rubric-hint-A/B/C` | each | Tutorial hints based on age |

### F.13 Acceptance Criteria

- [ ] 14 phases implemented
- [ ] 40 trajectory recordings (10 each: easy / medium / adversarial / cross-link)
- [ ] 5-dimension rubric with 1–5 star grading
- [ ] Design mode: editable rubric weights + expert-match scoring
- [ ] Cross-link with Agent Atelier / Bias Detective / Prompt Lab past saves
- [ ] `eval_grades` migration applied; RLS verified
- [ ] B/C primary; A 2D fallback
- [ ] Registry entry + camera preset
- [ ] Estimated TSX lines: ~3,400

---

## G. Concept C4 — Pixel Witness

> *"Watch the clip. Now ask the AI what happened. Then catch the lies."*

### G.1 Headline

The 2025–2026 generation of frontier models train **a single transformer on mixed-modality token streams** — no more separate "vision encoder + text head" (Doc 1 §5.1). Pixel Witness teaches this concept through a video-first puzzle: a short clip plays, the AI describes/answers questions about it, and the player decides what's correct, what's a hallucination, and (in advanced phases) configures **which "senses" the AI gets to use** (text, image-frame, full-video, audio).

### G.2 Lab Placement

**Lab 7 — Computer Vision** (`#10BAD2`, cyan). Single-spec. Lab 7 currently has *no flagship*; this becomes its anchor.

### G.3 Research Anchors

- **Doc 1 §5.1–§5.5** — Native multimodal architectures, Era 3a, Tarsier2 / Eagle 2.5 video reasoning
- **Doc 1 §9.1** — mechanic: drop video into agent, ask questions about the clip
- **Doc 1 §5.5** — pertinent: "single shared brain" vs "specialist parts wired together"

### G.4 Phase Structure (12 phases)

```typescript
type Phase =
  | 'welcome'
  | 'learn-modal'        // Card 1: senses → modalities
  | 'learn-fusion'       // Card 2: bolt-on bridge vs single transformer
  | 'learn-hallucinate'  // Card 3: what an AI hallucination looks like
  | 'tutorial'           // 1 guided clip with overlay
  | 'watch-A'            // 6 simple clips (band A primary)
  | 'watch-B'            // 9 medium clips
  | 'watch-C'            // 9 hard / adversarial clips
  | 'hallucination-hunt' // Boss: AI is confidently wrong, player must spot it
  | 'sense-builder'      // Loop 2: configure which modalities the AI gets
  | 'creative-sandbox'   // Optional: prompt an image gen (Imagen/Flux gated)
  | 'report';            // Score + replay + cert
```

12 phases.

### G.5 Video Library (24 clips × 4 questions = 96 Q-A pairs)

24 short kid-safe clips, each 5–15 seconds. Each clip ships with **4 questions** (one per difficulty, one designed to elicit hallucination):

| Clip Theme | Examples |
|---|---|
| **Everyday** | Cat opening a door, kid blowing bubbles, dog catching a ball |
| **Nature** | Sunrise time-lapse, leaf falling, ocean wave |
| **Mechanical** | Clock gears moving, dominos falling, balloon inflating |
| **Sports** | Soccer goal, swimming dive, gymnastics flip |
| **Crafts** | Paper-folding origami, cake decorating, plant repotting |

For each clip, 4 Q types:
1. **Literal** — "What is the cat doing?"
2. **Inferential** — "Why did the kid duck?"
3. **Counting** — "How many bubbles formed?"
4. **Adversarial** — A question whose plausible-but-wrong answer is the *expected hallucination*. Player has to recognize it.

All clips are pre-authored, royalty-free, curated for kid-safe content. **No live AI image gen during these phases** — only the optional creative-sandbox phase uses gated Imagen/Flux/DALL·E with strict prompt filtering.

### G.6 Sense Builder (Loop 2)

In the sense-builder phase the player toggles which modalities the AI receives:

| Sense | Token cost | Effect |
|---|---|---|
| **Caption only** | 1× | AI gets a text caption only — easy to lie |
| **One frame** | 5× | AI gets one still — fixes some lies |
| **All frames** | 30× | AI gets the full video — hard to lie |
| **Audio** | 5× | AI gets the audio track |

The player learns: **giving more senses = more accuracy, but more cost.** Maps directly to Doc 1 §3 multi-model routing tradeoffs.

### G.7 Game Loops (2)

- **Loop 1: Watch & Judge** — clip plays, 4 questions, AI answers, player rates each (correct / partial / hallucination)
- **Loop 2: Sense Builder** — pick which senses, see how AI changes its answer

### G.8 3D / Visual

| Asset | File | Purpose |
|---|---|---|
| `PixelWitness3D.tsx` | `src/components/3d/` | Curved cinema screen + the "eye of the AI" — a glowing camera-iris that opens/closes as senses toggle. |
| `PixelWitnessEnvironment.tsx` | `src/components/3d/environments/` | Edit-bay setting — tape reels, monitors, frame timeline scrolling on a wall. |

**Camera preset:**
```typescript
'pixel-witness': { position: [0, 1.8, 4], lookAt: [0, 0.5, 0], fov: 44 }
```

### G.9 State Schema

```typescript
interface PixelWitnessState {
  clip: Clip | null;
  questions: Question[];         // 4 per clip
  answers: AIAnswer[];           // generated server-side via Claude API or pre-recorded
  ratings: PlayerRating[];
  senses: SenseConfig;           // which modalities enabled
  totalScore: number;
}
```

### G.10 Persistence

**No new migration required.** Score and ratings hook into existing `child_progress`.

### G.11 AI Backend

The clip Q-A pairs are **pre-recorded** — no live model call needed for primary flow. The optional `creative-sandbox` phase calls existing AI infra (Imagen/Flux through Anthropic-hosted gateway or existing Prompt Lab path) under strict kid-safe prompt filtering.

### G.12 AI Content Types (6 new)

| ContentType | Per band | Purpose |
|---|---|---|
| `clip-question-A/B/C` | each | Custom question generator per clip |
| `hallucination-prompt-A/B/C` | each | Adversarial Q generator |

### G.13 Acceptance Criteria

- [ ] 12 phases implemented
- [ ] 24 clips × 4 Q-A pairs = 96 content units
- [ ] Sense Builder with 4 modality toggles + cost display
- [ ] All 3 age bands fully supported
- [ ] Boss "hallucination hunt" round
- [ ] Clips kid-safe, royalty-free, curated
- [ ] Optional creative-sandbox with strict prompt filter
- [ ] Registry entry + camera preset
- [ ] Estimated TSX lines: ~3,000

---

## H. Concept C5 — Pocket Brain

> *"There's a real AI living in this browser tab. No internet. No server. No API key. Just you, your laptop, and a tiny brain."*

### H.1 Headline

The most directly SparkForge-relevant trend in the entire research window: **WebGPU + WebAssembly let real LLMs run fully client-side at 30–70 tokens/sec** (Doc 1 §7.1, §7.2). Pocket Brain is the lab anchor for **Lab 1 — What IS AI?** It puts a real, **already-running, in-tab small language model** in front of every kid who plays. They watch a download bar, watch tokens stream out, slide the **quantization dial** between Q4 / Q8 / FP16 and *feel* memory shrinking. Then they peek at the **Mixture-of-Experts switchboard** and watch only the right "specialist" wake up for each question.

### H.2 Lab Placement

**Lab 1 — What IS AI?** (`#0FB8FA`, blue). Single-spec. Lab 1 currently has no flagship; this becomes the front door for new players. Foundational pillar (per Doc 1 §8.1, "what is a model?" is foundational, not one of the five engineering pillars).

### H.3 Research Anchors

- **Doc 1 §7.1–§7.4** — WebLLM, Transformers.js, LFM2-MoE, Phi-4, Gemma 3/4
- **Doc 1 §9.1** — mechanic: run an SLM in the browser
- **Doc 1 §7.4** — quantization, MoE, PLE all as teachable concepts

### H.4 Phase Structure (13 phases)

```typescript
type Phase =
  | 'welcome'
  | 'learn-model'        // Card 1: "What's a model?"
  | 'learn-tokens'       // Card 2: tokens explained with emoji
  | 'learn-where'        // Card 3: cloud vs in-browser
  | 'download'           // Real download bar, real model fetched
  | 'first-run'          // Real prompt, real response stream
  | 'token-stream-view'  // Slo-mo token view with logit visualization
  | 'quantization-lab'   // Slider: Q4 / Q8 / FP16. Watch RAM bar move.
  | 'moe-switchboard'    // Visualize which "specialist" lit up
  | 'speed-race'         // Loop 2: time-trial — answer N questions vs cloud
  | 'compare-cloud'      // Side-by-side with Anthropic API answer
  | 'pocket-mode'        // Free play with the SLM
  | 'report';            // Stats + cert ("you ran a real LLM today")
```

13 phases.

### H.5 Browser-side Model Choice

| Model | Total Params | Active Params | Disk Size (Q4) | Why this one? |
|---|---|---|---|---|
| **Primary** | LFM2-MoE | 8.3B | 1.5B | Doc 1 §7.2 — proven WebGPU showcase, MoE behavior visualizable |
| **Fallback Small** | Gemma 4 E2B | ~2B | ~1GB | Doc 1 §7.2 — runs on weaker laptops, multimodal-capable |
| **Fallback Tiny** | TinyLlama 1.1B | 1.1B | ~600MB | Last-resort for low-VRAM devices |

A device-capability check on first load picks the largest model the device can handle. The chosen model is cached in IndexedDB; subsequent visits skip the download. New optional dependencies: `@mlc-ai/web-llm` (per Doc 1 §7.5 — first-class browser-AI lib).

### H.6 Prompt Library (30 prompts × 4 quantization levels = 120 runs)

30 hardcoded prompts grouped into 5 themes:

| Theme | Examples |
|---|---|
| **Story Starters** | "Write 3 sentences about a brave cat" |
| **Math** | "What is 17 × 4?" (tests reasoning) |
| **Translation** | "Say 'good morning' in French" |
| **Common Sense** | "If I drop an egg, what happens?" |
| **Creative** | "Make up a name for a friendly robot" |

Each prompt runs at all 4 quantization levels (Q4 / Q5 / Q8 / FP16) so kids see the accuracy/speed tradeoff side-by-side.

### H.7 Game Loops (2)

- **Loop 1: Explore Mode** — kids try any of the 30 prompts at any quant level, observe.
- **Loop 2: Speed Race** — 5-minute timed mode answering as many trivia Qs as possible. The browser SLM is the player's "brain" — they have to choose quant level (faster but dumber, or slower but smarter).

### H.8 3D / Visual

| Asset | File | Purpose |
|---|---|---|
| `PocketBrain3D.tsx` | `src/components/3d/` | A glowing miniature brain, with **8 lobes representing MoE experts**. Lobes light up when active. Token stream flows out as glowing pellets. |
| `PocketBrainEnvironment.tsx` | `src/components/3d/environments/` | Tabletop close-up: laptop on a desk, model files as glowing orbs being downloaded. |

**Camera preset:**
```typescript
'pocket-brain': { position: [0, 1.5, 4], lookAt: [0, 0.8, 0], fov: 42 }
```

### H.9 State Schema

```typescript
interface PocketBrainState {
  modelStatus: 'idle' | 'downloading' | 'loading' | 'ready' | 'error';
  modelChoice: 'lfm2-moe' | 'gemma-e2b' | 'tinyllama-1b';
  quantization: 'Q4' | 'Q5' | 'Q8' | 'FP16';
  prompt: string;
  streamingTokens: string[];
  activeExperts: number[];      // MoE lobes lit
  ramUsageBytes: number;
  tokensPerSec: number;
}
```

### H.10 Persistence

**No new migration required.** Run history can be ephemeral; if persistence is added later, hook into existing `child_progress`.

### H.11 No Server-Side Cost

Critical: **Pocket Brain does NOT use the Anthropic API for primary play.** It runs a real LLM client-side. The only cloud call is the optional `compare-cloud` phase — one tightly-bounded comparison against the existing Prompt Lab API path, with kid-safe filtering.

This is the cheapest flagship to operate (zero per-prompt cost) and the most "real" — kids see real AI, not a simulation.

### H.12 New Dependencies

```jsonc
// package.json additions
"@mlc-ai/web-llm": "^0.2.x"   // browser-side LLM inference
// optional, smaller fallback
"@huggingface/transformers": "^3.0.x"   // for tinyllama path
```

Per CLAUDE.md tech-quality mandate (§1): "Optional dependencies that materially raise the visual ceiling are added without budget review when their use is documented in a phase plan." Pocket Brain documents the use case — adding these is in scope.

### H.13 Browser Support

WebGPU is required for the LFM2-MoE primary path (Chrome 113+, Edge 113+, Safari 17+, Firefox-with-flag, mobile Chromium). Devices without WebGPU receive a thin **MP4-poster fallback** (matching the broader CLAUDE.md §1 fallback policy for the hero animation), with a "your browser doesn't support pocket models — here's a video" educational clip.

### H.14 AI Content Types

**0 new content types.** Pocket Brain is unique among these 7 concepts — its content is generated *live in the browser* by the SLM. No `ai-content-generator.ts` additions.

### H.15 Acceptance Criteria

- [ ] 13 phases implemented
- [ ] WebLLM (or fallback) loads, caches in IndexedDB, generates real tokens
- [ ] 30 prompts × 4 quantization levels (120 runs) supported
- [ ] MoE switchboard visualization shows active experts
- [ ] Speed Race loop with quant-level tradeoff scoring
- [ ] Cross-device fallback chain (LFM2-MoE → Gemma E2B → TinyLlama → MP4-poster)
- [ ] Compare-cloud phase: 1-shot Anthropic API call with kid-safe filter
- [ ] All 3 age bands supported (A: pre-loaded model, B: pick prompts, C: full quant control)
- [ ] WebGPU+TSL primary path
- [ ] Estimated TSX lines: ~2,800

---

## I. Concept C6 — MCP Plug-and-Play Lab

> *"MCP is USB-C for AI. Plug in a calculator. Plug in a calendar. Plug in a paint brush. The agent grows."*

### I.1 Headline

In late 2025 / early 2026, **MCP became the dominant agent-tool standard** (Doc 1 §1.2: 10,000+ public servers, 97M monthly SDK downloads, donated to Linux Foundation). MCP Plug-and-Play Lab makes the abstraction physical: agents have **tool ports**, players collect **MCP cartridges** (calculator, calendar, drawing app, dictionary, music maker, weather, timer, map, news…), snap them in, and run missions where the cartridge combination determines what the agent can do. Wrong cartridges produce comic failure. Right cartridges produce surprising capability.

### I.2 Lab Placement (DUAL-SPEC)

| Path | Lab | Lab name | Color | Notes |
|---|---|---|---|---|
| **Path A** *(if Lab 11 not adopted)* | **Lab 5** | AI Helpers | `#00D17A` (green) | Joins Pet Trainer + Agent Atelier (Path A). Lab 5 becomes the "agentic" lab by default. |
| **Path B** *(if Lab 11 adopted)* | **Lab 11** | Agentic AI | `#6FFFE6` (mint-cyan) | Second flagship in Lab 11 — the "Equip" act in the Build → Equip → Constrain arc. |

### I.3 Research Anchors

- **Doc 1 §1.2** — MCP standard, "USB-C for AI"
- **Doc 1 §9.1** — mechanic: MCP plug-and-play tool ports
- **Doc 1 §1.4 Pertinent** — "Familiar metaphor, maps cleanly"

### I.4 Phase Structure (12 phases)

```typescript
type Phase =
  | 'welcome'
  | 'learn-usbc'         // Card 1: USB-C metaphor (real photo of USB-C → MCP cartridge analogy)
  | 'learn-cartridges'   // Card 2: tour of 25 cartridges
  | 'learn-mission'      // Card 3: how missions work
  | 'tutorial'           // Guided 1-mission with 3 cartridges
  | 'cartridge-gallery'  // Browse + collect
  | 'mission-pick'       // 30 missions
  | 'load-cartridges'    // Snap 1–5 cartridges into agent
  | 'run-mission'        // Animated execution, show which cartridge fires
  | 'debug'              // Mission failed → diagnose missing cartridge
  | 'build-cartridge'    // Loop 2: design own cartridge spec
  | 'report';            // Stats + cartridge unlocks
```

12 phases.

### I.5 Cartridge Library (25)

Each cartridge has a `tool spec` (MCP-shape JSON), an icon, and a port type (yellow/blue/red/green ports correspond to data shape compatibility — kid-friendly form of MCP type discipline):

| # | Cartridge | Port | Spec sample |
|---|---|---|---|
| 1 | Calculator | yellow | `{ "tools": ["add", "mul", "div", "sub"] }` |
| 2 | Calendar | blue | `{ "tools": ["next_event", "schedule"] }` |
| 3 | Dictionary | yellow | `{ "tools": ["define", "synonyms"] }` |
| 4 | Drawing | red | `{ "tools": ["draw", "color"] }` |
| 5 | Timer | yellow | `{ "tools": ["start", "stop", "elapsed"] }` |
| 6 | Music Maker | red | `{ "tools": ["play_note", "tempo"] }` |
| 7 | Weather | blue | `{ "tools": ["forecast", "current"] }` |
| 8 | Map | green | `{ "tools": ["distance", "directions"] }` |
| 9 | Translator | yellow | `{ "tools": ["translate", "detect_lang"] }` |
| 10 | Random | yellow | `{ "tools": ["dice", "shuffle", "pick"] }` |
| 11 | Notes | blue | `{ "tools": ["save_note", "search_notes"] }` |
| 12 | Counter | yellow | `{ "tools": ["count", "tally"] }` |
| 13 | Color Picker | red | `{ "tools": ["pick_color", "hex"] }` |
| 14 | Spelling | yellow | `{ "tools": ["check", "suggest"] }` |
| 15 | Sorter | green | `{ "tools": ["sort", "filter"] }` |
| 16 | Quiz | yellow | `{ "tools": ["ask_question", "score"] }` |
| 17 | Story Tracker | blue | `{ "tools": ["track_chars", "summarize"] }` |
| 18 | Habit Tracker | blue | `{ "tools": ["log", "streak"] }` |
| 19 | Recipe | green | `{ "tools": ["scale", "convert"] }` |
| 20 | Joke Maker | red | `{ "tools": ["pun", "knock_knock"] }` |
| 21 | Memory | blue | `{ "tools": ["recall", "remember"] }` |
| 22 | Coin Flip | yellow | `{ "tools": ["flip"] }` |
| 23 | Stopwatch | yellow | `{ "tools": ["lap", "split"] }` |
| 24 | Currency | yellow | `{ "tools": ["convert", "rate"] }` |
| 25 | Compliment | red | `{ "tools": ["nice_thing", "kind_word"] }` |

All cartridges are pre-curated for kid-safe behavior; outputs go through existing content filters before display.

### I.6 Mission Library (30 missions)

30 missions, each requires 1–5 cartridges. Examples:

- **"Plan a 30-min snack break"** — needs Timer + Recipe + Calendar
- **"Make a kid-safe joke"** — needs Joke Maker + Spelling
- **"Decide what to wear today"** — needs Weather + Calendar
- **"Draw a sunset"** — needs Drawing + Color Picker
- **"Pick a fair turn order"** — needs Random + Sorter

Missions are tagged with required ports (yellow/blue/red/green). Players see the puzzle: "I need 1 yellow + 1 blue. Which combo?"

### I.7 Game Loops (2)

- **Loop 1: Mission Mode** — pick mission, pick cartridges, run, get graded
- **Loop 2: Build Cartridge** — design a new cartridge spec (name, tools, port type), test on missions

### I.8 3D / Visual

| Asset | File | Purpose |
|---|---|---|
| `MCPRig3D.tsx` | `src/components/3d/` | Central agent block with **5 visible USB-C-shaped ports**, glowing port colors. Cartridges fly in and snap with a click. |
| `MCPLabEnvironment.tsx` | `src/components/3d/environments/` | Tinkerer's workshop — racks of cartridges, soldering iron, oscilloscope, blueprints. |

**Camera preset:**
```typescript
'mcp-lab': { position: [0, 2.5, 5.5], lookAt: [0, 0.6, 0], fov: 48 }
```

### I.9 State Schema

```typescript
interface MCPLabState {
  loadedCartridges: Cartridge[];   // 0–5
  collection: string[];            // unlocked cartridge ids
  customCartridges: Cartridge[];   // built in Loop 2, max 5
  mission: Mission | null;
  trace: ToolCall[];               // which tool fired when
  grade: MissionGrade | null;
}
```

### I.10 Persistence

```sql
-- supabase/migrations/2026XXXX_mcp_player_cartridges.sql
create table player_cartridges (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  name text not null,
  spec jsonb not null,        -- MCP-shape spec
  port_type text not null,    -- 'yellow' | 'blue' | 'red' | 'green'
  created_at timestamptz default now()
);
create index player_cartridges_child_idx on player_cartridges(child_id);
alter table player_cartridges enable row level security;
-- RLS: child can read/write own; parent can read child's. get_advisors after.
```

### I.11 AI Content Types (9 new)

| ContentType | Per band | Purpose |
|---|---|---|
| `mcp-mission-A/B/C` | each | Generated missions tagged with required ports |
| `cartridge-flavor-A/B/C` | each | Description + use-case for each cartridge |
| `failure-banter-A/B/C` | each | Funny failure messages when wrong cartridge combo |

### I.12 Acceptance Criteria

- [ ] 12 phases implemented
- [ ] 25 cartridges with valid MCP-shape specs + port types
- [ ] 30 missions tagged with required ports
- [ ] Loop 2 (Build Cartridge) with editor + test runner
- [ ] `player_cartridges` migration applied; RLS verified
- [ ] B/C primary; A 2D fallback (drag complexity)
- [ ] Registry entry + camera preset
- [ ] Estimated TSX lines: ~3,200

---

## J. Concept C7 — Harness Forge

> *"The model decides. The harness watches. Add a hook here. Add a sensor there. Now you have an AI you can trust."*

### J.1 Headline

Harness Engineering — *"Agent = Model + Harness"* (Doc 1 §2.1) — is the youngest of the seven research themes and the most squarely-engineering-flavored. Harness Forge teaches it as a build-it-yourself sandbox: the player wraps a (simulated) AI agent in **deterministic hooks** that fire pre-tool, post-tool, and after-output. Hooks turn red or green in real-time. Sensors flash. The player iteratively constrains a misbehaving agent until it always does the right thing — not by changing the model, but by changing the *harness around* it.

This concept aligns with the older C-band exclusively (with B-band simplified). Code-style metaphors (hooks, lifecycle, dispatch) are intentionally surfaced.

### J.2 Lab Placement (DUAL-SPEC)

| Path | Lab | Lab name | Color | Notes |
|---|---|---|---|---|
| **Path A** *(if Lab 11 not adopted)* | **Lab 9** | Build Your AI | `#E68E28` (orange) | Joins the lab whose flagship slot is empty. Theme alignment: kids "build" their AI's safety wrapper. |
| **Path B** *(if Lab 11 adopted)* | **Lab 11** | Agentic AI | `#6FFFE6` (mint-cyan) | Third flagship in Lab 11 — the "Constrain" act in Build → Equip → Constrain arc. |

### J.3 Research Anchors

- **Doc 1 §2.1–§2.5** — Guides + Sensors, computational + inferential, hooks/skills/agents/workflows
- **Doc 1 §6.3** — full-trajectory eval practices
- **Doc 1 §8.1** — Pillar: Harness
- **Doc 1 §9.1** — mechanic: hook hands-on (pre-tool, post-tool, after-output)

### J.4 Phase Structure (14 phases)

```typescript
type Phase =
  | 'welcome'
  | 'learn-harness'      // Card 1: Agent = Model + Harness
  | 'learn-guides'       // Card 2: feedforward (rules)
  | 'learn-sensors'      // Card 3: feedback (watching)
  | 'learn-lifecycle'    // Card 4: pre-tool, post-tool, after-output
  | 'tutorial'           // Guided 1-scenario harness build
  | 'pre-tool-lab'       // 5 scenarios — block bad tool calls
  | 'post-tool-lab'      // 5 scenarios — sanitize outputs
  | 'output-judge-lab'   // 5 scenarios — accept/reject final outputs
  | 'full-build'         // Boss: complete harness around a tricky agent
  | 'audit-replay'       // Loop 2: audit a saved run, identify gaps
  | 'compliance-gate'    // EU AI Act-flavored final exam (10 rules to verify)
  | 'free-forge'         // Free play
  | 'report';            // Stats + cert + harness-of-the-day leaderboard
```

14 phases.

### J.5 Hook Library (player builds these)

The player composes harnesses from primitives, all available as drag-in blocks:

**Pre-Tool Hooks (fire before a tool call):**
- `block-if-pii(args)` — refuse if argument contains a name/email/etc.
- `block-domain-allowlist(url, list)` — allow only certain URLs
- `rate-limit(name, n_per_min)` — soft rate-limit a tool
- `require-confirmation(reason)` — pause for confirmation

**Post-Tool Hooks (fire after a tool call):**
- `redact(output, patterns)` — censor matched patterns
- `truncate(output, max_chars)` — cap long outputs
- `score-toxicity(output, threshold)` — flag toxic responses
- `check-fact(output, against)` — flag potentially-false statements

**Output Judge Hooks (fire on final agent output):**
- `policy-check(text, rules[])` — verify rules from a constitution
- `length-bounds(text, min, max)` — enforce length
- `topic-allowlist(text, topics[])` — allow only certain topics
- `require-citation(text)` — must include "[source: …]"

The `rules[]` arg of `policy-check` lets the player write a kid-style constitution as 5–10 simple rules. (This recovers some Constitution-Court-flavored play even though that concept was dropped.)

### J.6 Scenario Library (30 harness scenarios)

30 hand-built scenarios across difficulty:

- **10 Easy** — single misbehavior, single hook needed
- **10 Medium** — chained misbehaviors, 2–3 hooks needed
- **10 Hard** — adversarial agent that probes hook gaps; player must layer 4+ hooks
- **+EU AI Act-style compliance gate** — final 10 rules from a sample policy doc; player must verify each

### J.7 Game Loops (2)

- **Loop 1: Add Hooks** — scenario presents a misbehaving agent, player adds hooks until trace is clean
- **Loop 2: Audit Replay** — load a saved run from another SparkForge game (Agent Atelier, MCP Lab), find at least 3 gaps in the harness, propose hooks

### J.8 3D / Visual

| Asset | File | Purpose |
|---|---|---|
| `HarnessForge3D.tsx` | `src/components/3d/` | Industrial forge: a glowing blueprint of an agent in the center, hook blocks circling like satellites. Active hooks pulse. Failed hooks turn red. |
| `HarnessForgeEnvironment.tsx` | `src/components/3d/environments/` | Workshop with anvils, blueprints on walls, a status board with sensor LEDs. |

**Camera preset:**
```typescript
'harness-forge': { position: [0, 2.8, 5.5], lookAt: [0, 1, 0], fov: 49 }
```

### J.9 State Schema

```typescript
interface HarnessForgeState {
  scenario: Scenario | null;
  hooks: Hook[];                 // composed by player
  trace: HarnessTrace[];         // step-by-step with hook firings
  passed: boolean;
  gaps: Gap[];                   // for audit-replay loop
  savedHarnesses: Harness[];     // unlocked
}
```

### J.10 Persistence

```sql
-- supabase/migrations/2026XXXX_harness_forge_player_harnesses.sql
create table player_harnesses (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  name text not null,
  hooks jsonb not null,         -- Hook[]
  pass_rate numeric,            -- 0..1 across scenarios
  created_at timestamptz default now()
);
create index player_harnesses_child_idx on player_harnesses(child_id);
alter table player_harnesses enable row level security;
-- RLS: child can read/write own; parent can read child's. get_advisors after.
```

### J.11 Cross-Link Hooks Into Other Games

Audit-Replay loop reads:
- `agent_compositions` (Agent Atelier, C1) — recent missions
- `player_cartridges` (MCP Lab, C6) — recent custom cartridges
- `eval_grades` (Glass Box Lab, C3) — recent player grades

Closes the cross-game loop. **Players see their own past behavior get audited.**

### J.12 AI Content Types (6 new)

| ContentType | Per band | Purpose |
|---|---|---|
| `scenario-easy/medium/hard` | each (B/C) | Generated harness scenarios |
| `compliance-rule-A/B/C` | each | EU-AI-Act-flavored verification rules |

(Band A skipped — concept exclusively B-simplified and C-full.)

### J.13 Acceptance Criteria

- [ ] 14 phases implemented
- [ ] 12 hook primitives wired to a deterministic harness runner
- [ ] 30 scenarios + 10 compliance rules
- [ ] Loop 2 (Audit Replay) cross-links 3+ other games' saves
- [ ] `player_harnesses` migration applied; RLS verified
- [ ] B simplified / C full; A skipped (rationale documented)
- [ ] Registry entry + camera preset
- [ ] Estimated TSX lines: ~3,500

---





