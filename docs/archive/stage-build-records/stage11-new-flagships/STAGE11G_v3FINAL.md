# Stage 11G v3-FINAL — Harness Forge (C7)

**Version:** v3-FINAL
**Build Phase:** 11G — **last** of 7 in the Stage 11 New-Flagship Cohort. **Third flagship in Lab 11.**
**Concept Source:** `docs/research/02-Flagship-Game-Concepts.md` Section J.
**Lab:** **11 — Agentic AI** — **"Constrain"** act. Closes the Build → Equip → Constrain arc opened by 11D and continued in 11E.
**Age Bands:** C (13–16) primary; B (10–12) simplified; A (7–9) skipped (concept density too high).
**Validation gates:** `npm run build` PASS, `npx tsc --noEmit` PASS, `npm run lint` PASS.
**Tier:** Flagship (20M-tri budget desktop ultra).
**Prerequisites:** Stages 11D / 11E / 11F all shipped (Audit Replay loop reads their save formats).

---

## 1. Overview

Harness Engineering — *"Agent = Model + Harness"* (Doc 1 §2.1) — is the most squarely-engineering-flavored of the seven concepts. Harness Forge teaches it as a build-it-yourself sandbox: the player wraps a (simulated) AI agent in **deterministic hooks** that fire **pre-tool**, **post-tool**, and **after-output**. Hooks turn red or green in real-time. Sensors flash. The player iteratively constrains a misbehaving agent until it always does the right thing — not by changing the model, but by changing the **harness around** it.

This stage closes the Stage 11 cohort, closes the Lab 11 narrative arc, and is the **first cross-game-aware** SparkForge experience: Audit-Replay loop reads `agent_compositions` (11D), `player_cartridges` (11E), and `eval_grades` (11F) and lets the player retroactively harness their *own past behavior*.

---

## 2. Decisions Implemented

| Decision | Description | Component |
|---|---|---|
| Doc 2 §J.4 | 14-phase machine | `HarnessForgeGame.tsx` |
| Doc 2 §J.5 | 12 hook primitives across 3 lifecycle stages (pre-tool / post-tool / output-judge) | `hookPrimitives.ts` |
| Doc 2 §J.6 | 30 hand-built scenarios + 10 EU-AI-Act compliance rules | `harnessScenarios.ts` |
| Doc 2 §J.7 | Two loops: Add Hooks + Audit Replay | `HarnessForgeGame.tsx` |
| Doc 2 §J.10 | New Supabase table `player_harnesses` with RLS | `supabase/migrations/.../player_harnesses.sql` |
| Doc 2 §J.11 | Cross-link audit reads 11D/11E/11F save tables | `auditReplayLoader.ts` |
| Doc 1 §2.1 | "Agent = Model + Harness" framing preserved end-to-end | UI copy + 3D forge |
| Doc 1 §6.1 | Constitutional-classifier-style policy-check hook included | `hookPrimitives.ts` |
| CLAUDE.md §1.1 | WebGPU+TSL primary | All 3D files |

---

## 3. Files

### 3.1 NEW

| Action | File | Approx. lines |
|---|---|---|
| NEW | `src/components/games/HarnessForgeGame.tsx` | ~3,500 |
| NEW | `src/components/3d/HarnessForge3D.tsx` | ~520 |
| NEW | `src/components/3d/environments/HarnessForgeEnvironment.tsx` | ~440 |
| NEW | `src/lib/harnessforge/hookPrimitives.ts` | ~360 (12 deterministic hook implementations) |
| NEW | `src/lib/harnessforge/harnessRunner.ts` | ~280 (sequential dispatch + sensor reporting) |
| NEW | `src/lib/harnessforge/harnessScenarios.ts` | ~620 (30 scenarios + 10 compliance rules) |
| NEW | `src/lib/harnessforge/auditReplayLoader.ts` | ~280 (cross-link reader) |
| NEW | `src/stores/harnessForgeStore.ts` | ~260 |
| NEW | `supabase/migrations/20260504_harness_forge_player_harnesses.sql` | ~40 |

### 3.2 MODIFIED

| Action | File | Why |
|---|---|---|
| MODIFY | `src/config/gameRegistry.ts` | +1 entry (`harness-forge`) + camera preset |
| MODIFY | `src/components/games/index.ts` | Export `HarnessForgeGame` |
| MODIFY | `src/lib/ai/ai-content-generator.ts` | Add `'harness-forge'` GameId + 6 ContentTypes |
| MODIFY | `src/types/index.ts` | Lab 11 `games[]` array gains `'harness-forge'` |

---

## 4. Triangle Budget

| Component | Desktop Ultra | LOD Low |
|---|---|---|
| `HarnessForge3D` (forge core + 12 hook satellites + sensor LEDs) | ~420K | ~70K |
| `HarnessForgeEnvironment` (industrial workshop) | ~3.3M | ~280K |
| Particle system (12 mint-cyan sparks for Lab 11) | ~1.5K | ~1.5K |
| **Scene total** | **~3.7M tris** | **~352K tris** |

Within 20M flagship budget.

---

## 5. Type Contracts

### 5.1 Phase Machine

```typescript
type Phase =
  | 'welcome'
  | 'learn-harness'       // Card 1: Agent = Model + Harness
  | 'learn-guides'        // Card 2: feedforward (rules)
  | 'learn-sensors'       // Card 3: feedback (watching)
  | 'learn-lifecycle'     // Card 4: pre-tool, post-tool, after-output
  | 'tutorial'            // Guided 1-scenario harness build
  | 'pre-tool-lab'        // 5 scenarios — block bad tool calls
  | 'post-tool-lab'       // 5 scenarios — sanitize outputs
  | 'output-judge-lab'    // 5 scenarios — accept/reject final outputs
  | 'full-build'          // Boss: complete harness around a tricky agent
  | 'audit-replay'        // Loop 2: audit a saved run from C1/C6/C3, identify gaps
  | 'compliance-gate'     // EU AI Act-flavored 10-rule final exam
  | 'free-forge'          // Free play
  | 'report';             // Stats + cert + harness-of-the-day leaderboard
```

14 phases.

### 5.2 Hook Primitives

```typescript
// src/lib/harnessforge/hookPrimitives.ts
export type Lifecycle = 'pre-tool' | 'post-tool' | 'output-judge';

export interface HookPrimitive {
  id: string;
  lifecycle: Lifecycle;
  label: string;
  description: string;          // ≤ 100 chars, kid-readable
  /** Type-safe arg schema for the hook config. */
  argSchema: { name: string; kind: 'text' | 'number' | 'list' }[];
}

export const HOOK_PRIMITIVES: readonly HookPrimitive[] = [ /* 12 entries */ ];
```

12 primitives:

| Lifecycle | Primitive id | Purpose |
|---|---|---|
| `pre-tool` | `block-if-pii` | Refuse if argument contains a name/email/etc. |
| `pre-tool` | `block-domain-allowlist` | Allow only certain URLs |
| `pre-tool` | `rate-limit` | Soft rate-limit a tool |
| `pre-tool` | `require-confirmation` | Pause for confirmation |
| `post-tool` | `redact` | Censor matched patterns |
| `post-tool` | `truncate` | Cap long outputs |
| `post-tool` | `score-toxicity` | Flag toxic responses |
| `post-tool` | `check-fact` | Flag potentially-false statements |
| `output-judge` | `policy-check` | Verify rules from a constitution |
| `output-judge` | `length-bounds` | Enforce length |
| `output-judge` | `topic-allowlist` | Allow only certain topics |
| `output-judge` | `require-citation` | Must include `[source: …]` |

### 5.3 Composed Hook & Harness Shape

```typescript
export interface ConfiguredHook {
  primitiveId: string;
  args: Record<string, unknown>;
}

export interface Harness {
  id?: string;                  // uuid (set on save)
  name: string;
  hooks: ConfiguredHook[];      // ordered; pre-tool fires first, then post, then judge
}
```

### 5.4 Scenario Shape

```typescript
// src/lib/harnessforge/harnessScenarios.ts
export interface HarnessScenario {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'compliance';
  band: ('B' | 'C')[];
  /** Description of the misbehaving agent. */
  scenarioPrompt: string;
  /** Hidden ground-truth: which hooks (and configs) suffice to "win". */
  expectedHooks: ConfiguredHook[];
  /** Sample agent attempts the scenario will simulate. */
  agentAttempts: { input: string; rawOutput: string; isMisbehavior: boolean }[];
}

export const HARNESS_SCENARIOS: readonly HarnessScenario[] = [ /* 30 entries */ ];

/** Compliance gate — 10 rules from a sample policy. */
export const COMPLIANCE_RULES: readonly { id: string; description: string; expectedHook: ConfiguredHook }[] = [ /* 10 entries */ ];
```

### 5.5 Audit Replay Loader

```typescript
// src/lib/harnessforge/auditReplayLoader.ts
/** Loads recent saves from Stage 11D (compositions), 11E (cartridges), and 11F (eval_grades). */
export async function loadAuditCandidates(childId: string): Promise<{
  agentCompositions: AuditCandidate[];
  playerCartridges: AuditCandidate[];
  evalGrades: AuditCandidate[];
}>;

export interface AuditCandidate {
  id: string;
  source: 'agent-comp' | 'cartridge' | 'eval-grade';
  label: string;
  /** Replay produces a HarnessScenario the player retro-fits hooks onto. */
  toScenario: () => HarnessScenario;
}
```

### 5.6 Store Shape

```typescript
interface HarnessForgeState {
  scenario: HarnessScenario | null;
  hooks: ConfiguredHook[];               // composed by player
  trace: HarnessTrace[];                 // step-by-step with hook firings
  passed: boolean;
  gaps: Gap[];                           // for audit-replay loop
  savedHarnesses: Harness[];             // unlocked
  // actions
  pickScenario: (id: string) => void;
  addHook: (h: ConfiguredHook) => void;
  removeHook: (idx: number) => void;
  runHarness: () => void;
  saveHarness: (name: string) => Promise<void>;
  loadAuditCandidate: (id: string) => Promise<void>;
}
```

---

## 6. Scenario Library (30 + 10)

| Bucket | Count | Notes |
|---|---|---|
| Easy | 10 | Single misbehavior, single hook needed. Band B entry. |
| Medium | 10 | Chained misbehaviors, 2–3 hooks needed. Band B/C. |
| Hard | 10 | Adversarial agent that probes hook gaps; player must layer 4+ hooks. Band C only. |
| Compliance | 10 | EU-AI-Act-style policy rules; final exam phase. |
| **Total** | **40** | |

### 6.1 6 New AI ContentTypes

| ContentType | Per band | Purpose |
|---|---|---|
| `scenario-easy`, `-medium`, `-hard` | each (B/C) | Generated harness scenarios |
| `compliance-rule-A`, `-B`, `-C` | each | EU-AI-Act-flavored verification rules |

(Band A is skipped here per the concept-density rationale; A-band ContentTypes for compliance still exist for use *outside* this game.)

---

## 7. Game Loops

### 7.1 Loop 1: Add Hooks

Scenario presents a misbehaving agent. Player drags hook primitives, configures their args, presses Run. Trace is rendered with sensor LEDs (green = hook fired, blocked correctly; red = hook fired but missed; gray = hook not relevant). Player iterates until trace is clean for all sample agent attempts.

### 7.2 Loop 2: Audit Replay

Player loads one of their own past saves (Stage 11D / 11E / 11F). Loader synthesizes a `HarnessScenario` from the save, identifies at least 3 detectable misbehaviors, and challenges the player to harness them. Score = number of gaps closed × player-rubric-match.

---

## 8. 3D Component Specs

### 8.1 `HarnessForge3D.tsx`

```typescript
'use client';

interface Props {
  hooks: ConfiguredHook[];
  trace: HarnessTrace[];
  activeHookIdx: number | null;     // currently firing hook in animation
  failed: boolean;
}

export default function HarnessForge3D({ hooks, trace, activeHookIdx, failed }: Props) {
  return (
    <group>
      <ForgeCore failed={failed} />               {/* Glowing agent blueprint at center */}
      <HookSatellites hooks={hooks} active={activeHookIdx} />  {/* Up to 12 lobes orbiting */}
      <SensorLEDs trace={trace} />                {/* Status board with red/green LEDs */}
      <FlagshipParticles count={12} color="#6FFFE6" />
    </group>
  );
}
```

D3D-B1 compliant.

### 8.2 `HarnessForgeEnvironment.tsx`

Industrial workshop: anvils, blueprints on walls, status board with sensor LEDs, hanging cables.

| Asset | Tris (Ultra) |
|---|---|
| Anvils + plinths | ~440K |
| Blueprint walls | ~360K |
| Status-board / sensor-LED rack | ~520K |
| Workbench + tools | ~400K |
| Floor (industrial concrete) | ~180K |
| Hanging cables / brackets | ~340K |
| Volumetric forge-glow (TSL) | ~520K |
| Wall paneling | ~540K |
| **Total** | **~3.3M** |

---

## 9. Persistence (Supabase migration)

```sql
-- supabase/migrations/20260504_harness_forge_player_harnesses.sql
create table player_harnesses (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  name text not null,
  hooks jsonb not null,         -- ConfiguredHook[]
  pass_rate numeric default 0,  -- 0..1 across scenarios
  created_at timestamptz not null default now()
);

create index player_harnesses_child_idx on player_harnesses(child_id);

alter table player_harnesses enable row level security;

create policy "child rw own harnesses" on player_harnesses
  for all
  using (child_id = current_setting('app.child_id', true)::uuid)
  with check (child_id = current_setting('app.child_id', true)::uuid);

create policy "parent reads child harnesses" on player_harnesses
  for select
  using (
    exists (
      select 1 from children c
      where c.id = player_harnesses.child_id
        and c.parent_id = auth.uid()
    )
  );
```

`get_advisors` mandatory post-DDL.

---

## 10. Cross-Game Integration

### 10.1 Read Sources

`auditReplayLoader.ts` queries:

- **`agent_compositions`** (Stage 11D) — replays saved compositions to identify hook gaps
- **`player_cartridges`** (Stage 11E) — runs cartridges through probe missions, surfaces misbehaviors
- **`eval_grades`** (Stage 11F) — surfaces low-scoring trajectories as harness candidates

### 10.2 Closes the Cohort Loop

Stage 11G is the **only** Stage 11 game that *consumes* save formats from three other Stage 11 games. This is by design — the Constrain act in the Build → Equip → Constrain arc requires that Build and Equip have already produced something to constrain.

---

## 11. Registry & Camera Preset

```typescript
const CAMERA_PRESETS = {
  // ...
  'harness-forge': { position: [0, 2.8, 5.5], lookAt: [0, 1, 0], fov: 49 },
};

{
  id: 42,
  name: 'Harness Forge',
  slug: 'harness-forge',
  lab: 11,
  labName: LAB_NAMES[11],
  tier: 'flagship',
  has3D: true,
  component3D: 'HarnessForge3D',
  ageBands: ['B', 'C'],     // B simplified; A skipped
  stage: '11G',
  description: 'Add hooks around an AI agent and watch them fire — make AI you can trust.',
  icon: '🛠️',
  triangleBudget: budget('flagship', true),
  cameraPreset: cameraPreset('harness-forge'),
}
```

---

## 12. Acceptance Criteria

- [ ] All 14 phases reachable; `report` shows pass-rate + harness-of-the-day leaderboard.
- [ ] 12 hook primitives across 3 lifecycle stages, each with type-safe arg schema.
- [ ] 30 scenarios + 10 compliance rules total.
- [ ] Hook order (pre-tool → post-tool → output-judge) deterministic in `harnessRunner`.
- [ ] Sensor LEDs render correctly: green (fired+blocked), red (fired+missed), gray (irrelevant).
- [ ] `player_harnesses` migration applied; `get_advisors` PASS.
- [ ] Audit Replay loop loads from all 3 prior-stage tables.
- [ ] Audit Replay falls back gracefully if no saves exist (placeholder set).
- [ ] B simplified / C full; A skipped (rationale documented).
- [ ] WebGPU+TSL primary path.
- [ ] All ARIA labels.
- [ ] Chrome bezel + LED rim.
- [ ] AI content slot wired (6 ContentTypes).
- [ ] Estimated TSX lines: **3,500 for `HarnessForgeGame.tsx`**.
- [ ] Build / type / lint PASS.
- [ ] Sentry release tag `stage-11g-harness-forge`.
- [ ] **Cohort gate:** This stage validates the full Stage 11 cross-game save-format chain works end-to-end.

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Hook-config UI too complex for B-band | B-band uses preset hook chips with locked args; only label visible |
| Audit Replay surfaces nothing for new players | Placeholder set + "play another Stage 11 game first" copy |
| Compliance rules feel preachy or political | All rules framed as kid-relatable safety analogs (e.g., "don't share home address" rather than abstract GDPR clauses) |
| Adversarial scenarios test patience | C-band only; tutorial gate before unlocking hard bucket |
| Hook ordering bugs | `harnessRunner` validates ordering with a runtime guard + a property test |

---

## 14. References

- Doc 2 Section J — concept spec
- Doc 1 §2 — Harness Engineering research
- Doc 1 §6.1 — Constitutional Classifiers (policy-check hook anchor)
- `STAGE11D_v3FINAL.md` §11 — `agent_compositions` save contract
- `STAGE11E_v3FINAL.md` §11 — `player_cartridges` save contract
- `STAGE11F_v3FINAL.md` §10 — `eval_grades` save contract
- `STAGE6E_v3FINAL_A.md` — Canvas Coexistence rule (D3D-B1)
- CLAUDE.md §1.1 — Tech Quality Mandate
- CLAUDE.md §2 — `get_advisors` post-DDL requirement

---

*End of STAGE11G_v3FINAL.md. Stage 11 cohort design fully drafted.*

