# Stage 11E v3-FINAL — MCP Plug-and-Play Lab (C6)

**Version:** v3-FINAL
**Build Phase:** 11E — fifth of 7 in the Stage 11 New-Flagship Cohort. **Second flagship in Lab 11.**
**Concept Source:** `docs/research/02-Flagship-Game-Concepts.md` Section I.
**Lab:** **11 — Agentic AI** — **"Equip"** act in the Build → Equip → Constrain arc.
**Age Bands:** B (10–12) / C (13–16) — Band A 2D fallback (drag complexity).
**Validation gates:** `npm run build` PASS, `npx tsc --noEmit` PASS, `npm run lint` PASS.
**Tier:** Flagship (20M-tri budget desktop ultra).
**Prerequisites:** Lab 11 plumbing (already shipped). Stage 11D lands first per build sequence.

---

## 1. Overview

In late 2025 / early 2026, **MCP became the dominant agent-tool standard** (Doc 1 §1.2: 10,000+ public servers, 97M monthly SDK downloads, donated to Linux Foundation). MCP Plug-and-Play Lab makes the abstraction *physical*: agents have **tool ports**, players collect **MCP cartridges** (calculator, calendar, drawing app, dictionary, music maker, weather, timer, map, news…), snap them in, and run missions where the cartridge combination determines what the agent can do.

The metaphor — *"MCP is USB-C for AI"* — is preserved end-to-end: 4 port colors (yellow / blue / red / green) correspond to data-shape compatibility groups, the workshop has a real soldering iron and a blueprint wall, and "wrong cartridge for the job" produces comic failure outputs.

---

## 2. Decisions Implemented

| Decision | Description | Component |
|---|---|---|
| Doc 2 §I.4 | 12-phase machine | `MCPLabGame.tsx` |
| Doc 2 §I.5 | 25-cartridge library × 4 port types | `cartridgeLibrary.ts` |
| Doc 2 §I.6 | 30-mission library tagged with required ports | `mcpMissionLibrary.ts` |
| Doc 2 §I.7 | Two loops: Mission Mode + Build Cartridge | `MCPLabGame.tsx` |
| Doc 2 §I.10 | New Supabase table `player_cartridges` with RLS | `supabase/migrations/.../player_cartridges.sql` |
| Doc 1 §1.2 | MCP "USB-C for AI" metaphor preserved end-to-end | UI copy + 3D rig |
| CLAUDE.md §1.1 | WebGPU+TSL primary path | All 3D files |

---

## 3. Files

### 3.1 NEW

| Action | File | Approx. lines |
|---|---|---|
| NEW | `src/components/games/MCPLabGame.tsx` | ~3,200 |
| NEW | `src/components/3d/MCPRig3D.tsx` | ~520 |
| NEW | `src/components/3d/environments/MCPLabEnvironment.tsx` | ~440 |
| NEW | `src/lib/mcplab/cartridgeLibrary.ts` | ~480 (25 cartridges × spec) |
| NEW | `src/lib/mcplab/mcpMissionLibrary.ts` | ~520 (30 missions tagged with ports) |
| NEW | `src/lib/mcplab/cartridgeRunner.ts` | ~280 (deterministic dispatch + fail banter) |
| NEW | `src/lib/mcplab/portCompat.ts` | ~80 (color → data-shape compat table) |
| NEW | `src/stores/mcpLabStore.ts` | ~240 |
| NEW | `supabase/migrations/20260502_mcp_player_cartridges.sql` | ~36 |

### 3.2 MODIFIED

| Action | File | Why |
|---|---|---|
| MODIFY | `src/config/gameRegistry.ts` | +1 entry (`mcp-lab`) + camera preset |
| MODIFY | `src/components/games/index.ts` | Export `MCPLabGame` |
| MODIFY | `src/lib/ai/ai-content-generator.ts` | Add `'mcp-lab'` GameId + 9 ContentTypes |
| MODIFY | `src/types/index.ts` | Lab 11 `games[]` array gains `'mcp-lab'` |

---

## 4. Triangle Budget

| Component | Desktop Ultra | LOD Low |
|---|---|---|
| `MCPRig3D` (central agent + 5 USB-C ports + flying cartridges) | ~390K | ~60K |
| `MCPLabEnvironment` (tinkerer's workshop) | ~3.0M | ~250K |
| Particle system (12 mint-cyan sparks) | ~1.5K | ~1.5K |
| **Scene total** | **~3.4M tris** | **~310K tris** |

Within 20M flagship budget.

---

## 5. Type Contracts

### 5.1 Phase Machine

```typescript
type Phase =
  | 'welcome'
  | 'learn-usbc'         // Card 1: USB-C metaphor with real photo → MCP cartridge analogy
  | 'learn-cartridges'   // Card 2: tour of 25 cartridges
  | 'learn-mission'      // Card 3: how missions work
  | 'tutorial'           // Guided 1-mission with 3 cartridges
  | 'cartridge-gallery'  // Browse + collect
  | 'mission-pick'       // 30 missions
  | 'load-cartridges'    // Snap 1–5 cartridges into agent
  | 'run-mission'        // Animated execution; show which cartridge fires
  | 'debug'              // Mission failed → diagnose missing cartridge
  | 'build-cartridge'    // Loop 2: design own cartridge spec
  | 'report';
```

12 phases.

### 5.2 Cartridge Shape

```typescript
// src/lib/mcplab/cartridgeLibrary.ts
export type Port = 'yellow' | 'blue' | 'red' | 'green';

export interface ToolSpec {
  /** Tool name as MCP would expose it. */
  name: string;
  /** ≤ 60-char description shown in tooltip. */
  description: string;
  /** Argument shape (kid-friendly schema). */
  args: { name: string; kind: 'text' | 'number' | 'list' }[];
}

export interface Cartridge {
  id: string;
  label: string;            // "Calculator", "Weather", etc.
  port: Port;
  icon: string;             // emoji
  tools: ToolSpec[];
  /** True for the 25 hand-curated cartridges; false for player-built. */
  curated: boolean;
}

export const CARTRIDGE_LIBRARY: readonly Cartridge[] = [ /* 25 entries */ ];
```

### 5.3 Mission Shape

```typescript
// src/lib/mcplab/mcpMissionLibrary.ts
export interface MCPMission {
  id: string;
  title: string;
  prompt: string;                    // mission-card body
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  band: ('A' | 'B' | 'C')[];
  /** Required port colors; player must equip cartridges covering all. */
  requiredPorts: Port[];
  /** Optional bonus ports — equip these for star bonus. */
  bonusPorts: Port[];
  /** Hand-built reference rubric. */
  rubric: { criterion: string; weight: number }[];
}

export const MCP_MISSIONS: readonly MCPMission[] = [ /* 30 entries */ ];
```

### 5.4 Player-Built Cartridge Persistence

```typescript
export interface PlayerCartridge {
  id: string;             // uuid (set on save)
  childId: string;
  label: string;
  port: Port;
  spec: ToolSpec[];       // player-defined tools
  passRate?: number;      // 0..1 across mission runs
  createdAt: string;
}
```

### 5.5 Store Shape

```typescript
interface MCPLabState {
  loadedCartridges: Cartridge[];      // 0..5 in agent rig
  collection: string[];               // unlocked curated ids
  customCartridges: PlayerCartridge[];// max 5 per child
  mission: MCPMission | null;
  trace: ToolCall[];                  // which tool fired when
  grade: MissionGrade | null;
  // actions
  loadCartridge: (id: string) => void;
  ejectCartridge: (id: string) => void;
  pickMission: (id: string) => void;
  runMission: () => Promise<void>;
  saveCustomCartridge: (c: Omit<PlayerCartridge, 'id' | 'createdAt' | 'childId'>) => Promise<void>;
}
```

---

## 6. Cartridge Library (25)

| # | Cartridge | Port | Tools |
|---|---|---|---|
| 1 | Calculator | yellow | `add · mul · div · sub` |
| 2 | Calendar | blue | `next_event · schedule` |
| 3 | Dictionary | yellow | `define · synonyms` |
| 4 | Drawing | red | `draw · color` |
| 5 | Timer | yellow | `start · stop · elapsed` |
| 6 | Music Maker | red | `play_note · tempo` |
| 7 | Weather | blue | `forecast · current` |
| 8 | Map | green | `distance · directions` |
| 9 | Translator | yellow | `translate · detect_lang` |
| 10 | Random | yellow | `dice · shuffle · pick` |
| 11 | Notes | blue | `save_note · search_notes` |
| 12 | Counter | yellow | `count · tally` |
| 13 | Color Picker | red | `pick_color · hex` |
| 14 | Spelling | yellow | `check · suggest` |
| 15 | Sorter | green | `sort · filter` |
| 16 | Quiz | yellow | `ask_question · score` |
| 17 | Story Tracker | blue | `track_chars · summarize` |
| 18 | Habit Tracker | blue | `log · streak` |
| 19 | Recipe | green | `scale · convert` |
| 20 | Joke Maker | red | `pun · knock_knock` |
| 21 | Memory | blue | `recall · remember` |
| 22 | Coin Flip | yellow | `flip` |
| 23 | Stopwatch | yellow | `lap · split` |
| 24 | Currency | yellow | `convert · rate` |
| 25 | Compliment | red | `nice_thing · kind_word` |

All cartridge outputs go through existing kid-safe content filters before display.

---

## 7. Mission Library (30)

30 hand-built missions × required-ports tag. Examples:

| Mission | Required Ports | Bonus | Difficulty |
|---|---|---|---|
| "Plan a 30-min snack break" | timer + recipe + calendar (Y+G+B) | random | medium |
| "Make a kid-safe joke" | joke maker + spelling (R+Y) | dictionary | easy |
| "Decide what to wear today" | weather + calendar (B+B) | map | easy |
| "Draw a sunset" | drawing + color picker (R+R) | story tracker | medium |
| "Pick a fair turn order" | random + sorter (Y+G) | quiz | easy |

Players see the puzzle: *"I need 1 yellow + 1 blue. Which combo solves this best?"*

### 7.1 9 New AI ContentTypes

| ContentType | Per band | Purpose |
|---|---|---|
| `mcp-mission-A`, `-B`, `-C` | each | Generated missions tagged with required ports |
| `cartridge-flavor-A`, `-B`, `-C` | each | Description + use-case for each cartridge |
| `failure-banter-A`, `-B`, `-C` | each | Funny failure messages on wrong-cartridge combos |

---

## 8. Game Loops

### 8.1 Loop 1: Mission Mode

`mission-pick` → `load-cartridges` → `run-mission` → `debug` → `report`. Score = required-ports match × bonus-ports bonus × time bonus.

### 8.2 Loop 2: Build Cartridge

Player designs a cartridge — name, port color, tools — and tests on the 30-mission library. Saved to `player_cartridges` (max 5 custom per child). Pass rate (0..1) recorded.

---

## 9. 3D Component Specs

### 9.1 `MCPRig3D.tsx`

```typescript
'use client';

interface Props {
  loaded: Cartridge[];        // 0–5 cartridges in rig
  flyingCartridge: Cartridge | null;  // animation in flight to a port
  activeTool: string | null;  // tool currently firing (cartridge label.tool name)
}

export default function MCPRig3D({ loaded, flyingCartridge, activeTool }: Props) {
  return (
    <group>
      <AgentBlock />                {/* central glowing block, 5 USB-C ports visible */}
      <PortRing ports={['yellow', 'blue', 'red', 'green', 'yellow']} loaded={loaded} />
      {flyingCartridge && <CartridgeInFlight cart={flyingCartridge} />}
      <ToolFiringPulse activeTool={activeTool} />
      <FlagshipParticles count={12} color="#6FFFE6" />
    </group>
  );
}
```

D3D-B1 compliant.

### 9.2 `MCPLabEnvironment.tsx`

Tinkerer's workshop: racks of cartridges, a soldering iron, an oscilloscope, blueprints on the wall.

| Asset | Tris (Ultra) |
|---|---|
| Cartridge wall (stocked rack of 25 slots) | ~620K |
| Workbench + tools | ~440K |
| Oscilloscope + soldering iron | ~280K |
| Blueprint wall | ~360K |
| Ceiling + fluorescents | ~220K |
| Floor (poured-concrete tile) | ~140K |
| Volumetric solder smoke (TSL) | ~480K |
| Cable/conduit bundles | ~460K |
| **Total** | **~3.0M** |

---

## 10. Persistence (Supabase migration)

```sql
-- supabase/migrations/20260502_mcp_player_cartridges.sql
create table player_cartridges (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  label text not null,
  port text not null check (port in ('yellow', 'blue', 'red', 'green')),
  spec jsonb not null,    -- ToolSpec[]
  pass_rate numeric default 0,
  created_at timestamptz not null default now()
);

create index player_cartridges_child_idx on player_cartridges(child_id);

alter table player_cartridges enable row level security;

create policy "child rw own cartridges" on player_cartridges
  for all
  using (child_id = current_setting('app.child_id', true)::uuid)
  with check (child_id = current_setting('app.child_id', true)::uuid);

create policy "parent reads child cartridges" on player_cartridges
  for select
  using (
    exists (
      select 1 from children c
      where c.id = player_cartridges.child_id
        and c.parent_id = auth.uid()
    )
  );
```

**`get_advisors` mandatory post-DDL** per CLAUDE.md §2.

---

## 11. Cross-Game Save Format

`player_cartridges` is consumed by Stage 11G (Harness Forge) audit-replay. Schema is **stable as of this stage**; future changes additive only.

---

## 12. Registry & Camera Preset

```typescript
const CAMERA_PRESETS = {
  // ...
  'mcp-lab': { position: [0, 2.5, 5.5], lookAt: [0, 0.6, 0], fov: 48 },
};

{
  id: 40,
  name: 'MCP Plug-and-Play Lab',
  slug: 'mcp-lab',
  lab: 11,
  labName: LAB_NAMES[11],
  tier: 'flagship',
  has3D: true,
  component3D: 'MCPRig3D',
  ageBands: ['B', 'C'],          // A uses 2D fallback
  stage: '11E',
  description: 'Snap MCP cartridges into your AI agent and watch its powers grow.',
  icon: '🔌',
  triangleBudget: budget('flagship', true),
  cameraPreset: cameraPreset('mcp-lab'),
}
```

---

## 13. Acceptance Criteria

- [ ] All 12 phases reachable; `report` shows score + cartridge unlocks.
- [ ] 25 cartridges with valid MCP-shape specs and one of 4 port types.
- [ ] 30 missions tagged with required and bonus ports.
- [ ] Cartridge slot limit: 5 max in rig.
- [ ] Custom-cartridge limit: 5 max per child.
- [ ] `player_cartridges` migration applied; `get_advisors` PASS post-migration.
- [ ] B/C primary; A 2D fallback.
- [ ] Wrong-cartridge combos produce kid-safe `failure-banter-*` text from AI content slot.
- [ ] WebGPU+TSL primary path.
- [ ] All ARIA labels.
- [ ] Chrome bezel + LED rim.
- [ ] AI content slot wired (9 ContentTypes).
- [ ] Cross-game save contract documented (§11) and surfaced in `STAGE11G_v3FINAL.md`.
- [ ] Estimated TSX lines: **3,200 for `MCPLabGame.tsx`**.
- [ ] Build / type / lint PASS.
- [ ] Sentry release tag `stage-11e-mcp-lab`.

---

## 14. References

- Doc 2 Section I — concept spec
- Doc 1 §1.2 — MCP standard adoption research
- `STAGE6E_v3FINAL_A.md` — Canvas Coexistence rule (D3D-B1)
- CLAUDE.md §1.1 — Tech Quality Mandate
- CLAUDE.md §2 — `get_advisors` post-DDL requirement
- Doc 2 §B — Lab 11 adoption (this stage's prerequisite)
- `STAGE11D_v3FINAL.md` §11 — sister save-format precedent

---

*End of STAGE11E_v3FINAL.md.*

