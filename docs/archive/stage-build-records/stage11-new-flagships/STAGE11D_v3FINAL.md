# Stage 11D v3-FINAL — Agent Atelier (C1)

**Version:** v3-FINAL
**Build Phase:** 11D — fourth of 7 in the Stage 11 New-Flagship Cohort. **Lab 11 opener.**
**Concept Source:** `docs/research/02-Flagship-Game-Concepts.md` Section D.
**Lab:** **11 — Agentic AI** (`#6FFFE6`, OKLCH `oklch(0.85 0.16 175)`, icon 🕸️) — *first flagship in the new lab.*
**Age Bands:** B (10–12) / C (13–16) — Band A receives 2D fallback (drag complexity, matches Agent Architect §STAGE6E precedent).
**Validation gates:** `npm run build` PASS, `npx tsc --noEmit` PASS, `npm run lint` PASS.
**Tier:** Flagship (20M-tri budget desktop ultra).
**Prerequisites:** Lab 11 plumbing committed (`labColors.ts`, `labs.ts`, `cockpitStore.ts`, `HolographicLabMap.tsx`, `types/index.ts`) — already shipped in commits e0b9c3b · 533ad8b · 4dc580c.

---

## 1. Overview

Agent Atelier is the **lab-opener flagship for Lab 11 — Agentic AI** and the first act of the **Build → Equip → Constrain** narrative arc spanning C1 (Atelier — *build* the team), C6 (MCP Lab — *equip* the team), and C7 (Harness Forge — *constrain* the team).

The player is the **Atelier Director** of an AI workshop. The world has stopped using single all-purpose AI assistants — modern AI works in *teams of specialists* (Doc 1 §1). Each session, a *mission card* arrives; the player drags 3–8 specialist agents (Researcher, Planner, Writer, Critic, Coder, Estimator, Router, Toolsmith, Judge, Memory, Translator, Summarizer) onto a 3D atelier floor, wires their input/output ports together MCP-style, and presses **Run Mission**. The team executes; the player watches the trace; iterates until the mission grades green.

This is the most ambitious of the seven concepts — it introduces persistent **`agent_compositions`** in Supabase, a 12-specialist roster with port-typed I/O, and the first cross-game save format read by Stage 11G (Harness Forge) audit-replay.

---

## 2. Decisions Implemented

| Decision | Description | Component |
|---|---|---|
| Doc 2 §D.4 | 13-phase machine | `AgentAtelierGame.tsx` |
| Doc 2 §D.5 | 12-specialist roster, 3 unlock tiers (4 / 4 / 4 per A/B/C band) | `agentRoster.ts` |
| Doc 2 §D.6 | 8 hardcoded missions × 3 difficulty + 12 AI-generated = 36 units | `missionLibrary.ts` |
| Doc 2 §D.7 | Two loops: Mission Mode + Free Play | `AgentAtelierGame.tsx` |
| Doc 2 §D.10 | New Supabase table `agent_compositions` with RLS | `supabase/migrations/.../agent_compositions.sql` |
| Doc 2 §D.11 | Phase machine pattern from `AgentArchitectGame.tsx:48` | `AgentAtelierGame.tsx` |
| Doc 1 §1.4 (specialization) | Each specialist has *one* canonical role; no duplicates | `agentRoster.ts` |
| CLAUDE.md §1.1 | WebGPU+TSL primary; chrome bezel from `BrandingMaterial.tsx` | All 3D files |
| **Doc 2 §B.4** | This stage *requires* the Lab 11 plumbing (already shipped) | (prerequisite) |

---

## 3. Files

### 3.1 NEW

| Action | File | Approx. lines |
|---|---|---|
| NEW | `src/components/games/AgentAtelierGame.tsx` | ~3,000 |
| NEW | `src/components/3d/AgentAtelier3D.tsx` | ~560 |
| NEW | `src/components/3d/environments/AgentAtelierEnvironment.tsx` | ~440 |
| NEW | `src/lib/agentatelier/agentRoster.ts` | ~380 (12 specialists × port specs) |
| NEW | `src/lib/agentatelier/missionLibrary.ts` | ~620 (8 missions × 3 difficulty) |
| NEW | `src/lib/agentatelier/missionRunner.ts` | ~280 (deterministic-ish trace builder) |
| NEW | `src/lib/agentatelier/wireGraph.ts` | ~180 (DAG validation + cycle detection) |
| NEW | `src/stores/agentAtelierStore.ts` | ~260 |
| NEW | `supabase/migrations/20260501_agent_atelier_compositions.sql` | ~40 |

### 3.2 MODIFIED

| Action | File | Why |
|---|---|---|
| MODIFY | `src/config/gameRegistry.ts` | +1 entry (`agent-atelier`) + camera preset |
| MODIFY | `src/components/games/index.ts` | Export `AgentAtelierGame` |
| MODIFY | `src/lib/ai/ai-content-generator.ts` | Add `'agent-atelier'` GameId + 6 ContentTypes |
| MODIFY | `src/types/index.ts` | Lab 11 entry's `games[]` array gains `'agent-atelier'` |

---

## 4. Triangle Budget

| Component | Desktop Ultra | LOD Low |
|---|---|---|
| `AgentAtelier3D` (8-slot dais + agent figures + tube wires) | ~410K | ~70K |
| `AgentAtelierEnvironment` (workshop loft) | ~3.2M | ~280K |
| Particle system (12 mint-cyan sparks for Lab 11) | ~1.5K | ~1.5K |
| **Scene total** | **~3.6M tris** | **~352K tris** |

Within 20M flagship budget. Camera frames the dais; the workshop is mostly background-LOD for performance.

---

## 5. Type Contracts

### 5.1 Phase Machine

```typescript
type Phase =
  | 'welcome'
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

13 phases — meets Doc 2 §A.1 target.

### 5.2 Specialist Agent Shape

```typescript
// src/lib/agentatelier/agentRoster.ts
export type PortType = 'text' | 'list' | 'number' | 'plan' | 'code' | 'tool_request';

export type UnlockTier = 'A' | 'B' | 'C'; // age-band gate for unlock

export interface AgentSpec {
  id: string;
  name: string;
  role: string;
  unlockTier: UnlockTier;       // A: always, B: unlocks at band B, C: at band C
  inputs: { name: string; type: PortType }[];
  outputs: { name: string; type: PortType }[];
  /** Used by trace renderer to color-code packets in 3D scene. */
  accentHex: string;
  /** ≤ 80-char one-liner shown on hover. */
  blurb: string;
}

export const AGENT_ROSTER: readonly AgentSpec[] = [ /* 12 entries */ ];
```

### 5.3 Mission Shape

```typescript
// src/lib/agentatelier/missionLibrary.ts
export interface Mission {
  id: string;
  title: string;
  prompt: string;             // mission-card body shown to player
  difficulty: 'easy' | 'medium' | 'hard';
  band: ('A' | 'B' | 'C')[];
  /** Required output port type from terminal agent. */
  expectedOutput: PortType;
  /** Hand-built rubric used by missionRunner to grade attempts. */
  rubric: { criterion: string; weight: number }[];
  /** Suggested minimum agent count to unlock 3-star grade. */
  parAgentCount: number;
}

export const HARDCODED_MISSIONS: readonly Mission[] = [ /* 24 entries: 8 missions × 3 difficulty */ ];
```

### 5.4 Composition Persistence Schema

```typescript
// src/stores/agentAtelierStore.ts
export interface PlacedAgent {
  agentId: string;        // → AgentSpec.id
  position: [number, number]; // logical 2D atelier position
}

export interface Wire {
  fromAgentId: string;
  fromOutputName: string;
  toAgentId: string;
  toInputName: string;
}

export interface AgentComposition {
  id: string;             // uuid (set on save)
  name: string;
  team: PlacedAgent[];
  wires: Wire[];
  createdAt: string;
}

export interface AgentAtelierState {
  team: PlacedAgent[];
  wires: Wire[];
  mission: Mission | null;
  trajectory: TrajectoryStep[];
  grade: MissionGrade | null;
  missionsCompleted: string[];
  // actions
  placeAgent: (agentId: string, pos: [number, number]) => void;
  removeAgent: (agentId: string) => void;
  addWire: (w: Wire) => void;
  removeWire: (w: Wire) => void;
  pickMission: (id: string) => void;
  runMission: () => Promise<void>;
  saveComposition: (name: string) => Promise<void>;
}
```

---

## 6. Specialist Roster (12)

| Tier | Agent | Role | Inputs | Outputs |
|---|---|---|---|---|
| A | **Researcher** | Looks things up | `{ topic: text }` | `{ facts: list }` |
| A | **Writer** | Turns notes into prose | `{ notes: list, tone: text }` | `{ text: text }` |
| A | **Planner** | Breaks goals into steps | `{ goal: text }` | `{ steps: plan }` |
| A | **Estimator** | Predicts time/cost | `{ task: text }` | `{ time: number, cost: number }` |
| B | **Critic** | Finds flaws in others' work | `{ artifact: text }` | `{ issues: list }` |
| B | **Coder** | Writes small programs | `{ spec: text }` | `{ code: code }` |
| B | **Translator** | Switches languages or styles | `{ text: text, target: text }` | `{ text: text }` |
| B | **Summarizer** | Compresses long text | `{ text: text, budget: number }` | `{ text: text }` |
| C | **Router** | Picks which agent runs next | `{ state: text }` | `{ next_agent: text }` |
| C | **Toolsmith** | Wraps an outside tool (calc, calendar) | `{ request: tool_request }` | `{ tool_result: text }` |
| C | **Judge** | Scores final outputs | `{ artifact: text, rubric: list }` | `{ grade: number }` |
| C | **Memory** | Remembers across runs | `{ key: text, value: text }` | `{ recall: text }` |

Port-type compatibility is enforced at wire-creation time via `wireGraph.ts.canConnect(out, in)`.

---

## 7. Mission Library (36 units)

8 hardcoded missions × 3 difficulty + 12 AI-generated = 36 content units. Beats the Doc 2 §A target.

### 7.1 Hardcoded Missions

| # | Mission | Theme | Notes |
|---|---|---|---|
| 1 | The Birthday Plan | Planning | $40 budget, age-appropriate |
| 2 | The Fact Check | Research | 3 claims to verify |
| 3 | Lunchbox Re-Design | Creativity | Recyclable + cost estimate |
| 4 | The Story Editor | Writing | Improve a 3-paragraph story |
| 5 | Homework Hot Seat | Math | Multi-step word problem |
| 6 | Travel Trio | Logistics | 3-city train trip |
| 7 | Pet Schedule | Care | Hamster + fish daily plan |
| 8 | Build a Joke | Creativity | 5 kid-safe jokes about a noun |

Each is exposed at `easy / medium / hard` with progressively tighter rubrics.

### 7.2 AI-Generated Mission Slot

Per session, up to 12 additional missions generated via existing `ai-content-generator.ts` infra under the new `'agent-atelier'` GameId. Rate-limited to 15 generations per session per CLAUDE.md §11 standard.

### 7.3 6 New AI ContentTypes

| ContentType | Per band | Purpose |
|---|---|---|
| `mission-card-A`, `-B`, `-C` | each | Generated mission cards by band |
| `agent-bio-A`, `-B`, `-C` | each | Specialist backstory + tip per band |

---

## 8. Game Loops

### 8.1 Loop 1: Mission Mode

`pick-mission` → `assemble` → `wire` → `simulate` → `inspect` → `iterate` → `report`. Score = rubric match × parAgent bonus × time bonus. 3-star rating standard.

### 8.2 Loop 2: Free Play

No mission, no grade. Player builds any team, throws any prompt at the terminal agent, observes the trace. Saves count toward `agent_compositions` like Mission Mode.

---

## 9. 3D Component Specs

### 9.1 `AgentAtelier3D.tsx`

```typescript
'use client';

interface Props {
  team: PlacedAgent[];
  wires: Wire[];
  trajectoryStep: number | null; // current animated step during simulate
  isRunning: boolean;
}

export default function AgentAtelier3D({ team, wires, trajectoryStep, isRunning }: Props) {
  return (
    <group>
      <AtelierDais />                 {/* circular base, 8 marked agent slots */}
      <AgentFigures placed={team} />  {/* 3D avatar per specialist (Box / Cylinder / Octahedron per role) */}
      <WireBundle wires={wires} active={trajectoryStep} />
      {/* TubeGeometry along CatmullRomCurve3 — same pattern as AgentPipeline3D */}
      <TraceParticles step={trajectoryStep} active={isRunning} />
      <FlagshipParticles count={12} color="#6FFFE6" />
    </group>
  );
}
```

D3D-B1 compliant: `<group>` only, no inner `<Canvas>`.

### 9.2 `AgentAtelierEnvironment.tsx`

Workshop-loft setting: pinboards on walls, drafting tables, hanging tools, ceiling skylight.

| Asset | Tris (Ultra) |
|---|---|
| Drafting tables (2) | ~520K |
| Pinboards + sticky notes | ~280K |
| Hanging tool rack | ~360K |
| Ceiling skylight + beams | ~420K |
| Tool-shelf (background) | ~720K |
| Floor + base | ~140K |
| Volumetric dust shafts (TSL) | ~480K |
| Ambient cables + bracketry | ~280K |
| **Total** | **~3.2M** |

---

## 10. Persistence (Supabase migration)

```sql
-- supabase/migrations/20260501_agent_atelier_compositions.sql
create table agent_compositions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  name text not null,
  team jsonb not null,    -- PlacedAgent[]
  wires jsonb not null,   -- Wire[]
  created_at timestamptz not null default now()
);

create index agent_compositions_child_idx on agent_compositions(child_id);

alter table agent_compositions enable row level security;

create policy "child rw own compositions" on agent_compositions
  for all
  using (child_id = current_setting('app.child_id', true)::uuid)
  with check (child_id = current_setting('app.child_id', true)::uuid);

create policy "parent reads child compositions" on agent_compositions
  for select
  using (
    exists (
      select 1 from children c
      where c.id = agent_compositions.child_id
        and c.parent_id = auth.uid()
    )
  );
```

**MUST run `get_advisors` after applying this migration** per CLAUDE.md §2 — confirms RLS is detected and no silent table-without-policy state exists.

---

## 11. Cross-Game Save Format

This is the **first** save format consumed downstream. Stage 11G (Harness Forge) audit-replay reads `agent_compositions` rows to surface "your past missions" as audit material. Therefore:

- The `team` JSONB and `wires` JSONB shapes are **stable contracts** as of this stage.
- Future schema changes require additive migration only (new optional fields). Removing fields requires a Stage-11G coordination.

---

## 12. Registry & Camera Preset

```typescript
const CAMERA_PRESETS = {
  // ...
  'agent-atelier': { position: [0, 4, 8], lookAt: [0, 0.5, 0], fov: 50 },
};

{
  id: 39,
  name: 'Agent Atelier',
  slug: 'agent-atelier',
  lab: 11,
  labName: LAB_NAMES[11],
  tier: 'flagship',
  has3D: true,
  component3D: 'AgentAtelier3D',
  ageBands: ['B', 'C'],          // A uses 2D fallback
  stage: '11D',
  description: 'Hire a team of AI specialists, wire them together, and run a mission.',
  icon: '🕸️',
  triangleBudget: budget('flagship', true),
  cameraPreset: cameraPreset('agent-atelier'),
}
```

---

## 13. Acceptance Criteria

- [ ] All 13 phases reachable; `report` shows grade + agent MVP + replay.
- [ ] 12-specialist roster loaded with port-type compatibility enforcement.
- [ ] 24 hardcoded missions (8 × 3 difficulty) + 12 AI-generated per session = 36 distinct units.
- [ ] Wire creation rejects type-incompatible connections via `wireGraph.canConnect`.
- [ ] DAG validation rejects cycles; `simulate` aborts cleanly with a learner-friendly error.
- [ ] `agent_compositions` table created with RLS. `get_advisors` PASS post-migration.
- [ ] Save/load roundtrip preserves team + wires byte-for-byte.
- [ ] Band B/C primary; band A 2D fallback (no R3F mounted) with same mission set.
- [ ] WebGPU+TSL primary path; MP4-poster fallback for non-WebGPU.
- [ ] All ARIA labels.
- [ ] Chrome bezel + LED rim.
- [ ] AI content slot wired (6 ContentTypes).
- [ ] Cross-game save contract documented (§11) and surfaced in `STAGE11G_v3FINAL.md`.
- [ ] Estimated TSX lines: **3,000 for `AgentAtelierGame.tsx`**.
- [ ] Build / type / lint PASS.
- [ ] Sentry release tag `stage-11d-agent-atelier`.

---

## 14. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Wire UI is fiddly on small screens | Min viewport 1024 px for B/C; A skips wire phase entirely (preset compositions) |
| Cycles in player graphs | `wireGraph.detectCycle` runs after every wire add; toast warning + auto-block |
| RLS policy regression breaks existing children's saves | `get_advisors` mandatory post-migration; smoke-test with two distinct child accounts |
| Mission grading feels unfair due to subjective rubric | Rubric is hand-built per mission; weights tunable from a single config; A-band uses simpler 1-criterion rubrics |
| Trace animation runs too long on slow devices | `trajectoryStep` advances at adaptive FPS-aware rate; max 6 s total animation |

---

## 15. References

- Doc 2 Section D — concept spec
- Doc 1 §1 — Agentic AI Engineering research
- `STAGE6E_v3FINAL_A.md` — Agent Architect 3D pipeline (closest existing precedent for wire/tube viz)
- `STAGE6E_v3FINAL_A.md` lines 4–11 — Canvas Coexistence rule (D3D-B1)
- `AgentArchitectGame.tsx:48` — Phase machine pattern
- CLAUDE.md §1.1 — Tech Quality Mandate (TSL primary)
- CLAUDE.md §2 — `get_advisors` post-DDL requirement
- Doc 2 §B — Lab 11 adoption (this stage's prerequisite)

---

*End of STAGE11D_v3FINAL.md.*

