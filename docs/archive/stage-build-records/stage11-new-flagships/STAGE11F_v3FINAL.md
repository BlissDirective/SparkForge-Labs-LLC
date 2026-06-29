# Stage 11F v3-FINAL — Glass Box Lab (C3)

**Version:** v3-FINAL
**Build Phase:** 11F — sixth of 7 in the Stage 11 New-Flagship Cohort.
**Concept Source:** `docs/research/02-Flagship-Game-Concepts.md` Section F.
**Lab:** 6 — *AI & Ethics* (`#FF7050`, OKLCH `oklch(0.75 0.20 25)`). Joins Bias Detective.
**Age Bands:** B (10–12) / C (13–16) — Band A 2D fallback.
**Validation gates:** `npm run build` PASS, `npx tsc --noEmit` PASS, `npm run lint` PASS.
**Tier:** Flagship (20M-tri budget desktop ultra).
**Prerequisites:** Stage 11D `agent_compositions` and Stage 11E `player_cartridges` already shipped (consumed by cross-link trajectories).

---

## 1. Overview

Glass Box Lab makes **trajectory evaluation** — the production-grade "score-the-whole-trajectory-not-just-the-output" pattern from Doc 1 §6.3 — concretely playable. The player becomes the **referee**: a recorded AI trajectory plays back step-by-step on a horizontal rail; for each step, the player grades 5 dimensions (Tool Choice, Argument Validity, Step Count, Time/Cost, Policy Compliance) on 1–5 stars. Then in Loop 2, the player **designs their own rubric** (weights, thresholds), runs it on the trajectory library, and sees how well it matches expert grades.

Cross-link is the killer feature: 10 of the 40 trajectories are **the player's own past saves** from Agent Atelier (`agent_compositions`), MCP Lab (`player_cartridges`), and Prompt Lab. Kids see *their own past behavior* get audited.

---

## 2. Decisions Implemented

| Decision | Description | Component |
|---|---|---|
| Doc 2 §F.4 | 14-phase machine with 5 sub-cards for the 5 rubric dimensions | `GlassBoxLabGame.tsx` |
| Doc 2 §F.5 | 40 trajectory recordings: 10 easy / 10 medium / 10 adversarial / 10 cross-link | `trajectoryLibrary.ts` |
| Doc 2 §F.6 | 5-dimension rubric with 1–5 star grading | `rubricEngine.ts` |
| Doc 2 §F.7 | Two loops: Grade Mode + Design Mode | `GlassBoxLabGame.tsx` |
| Doc 2 §F.10 | New Supabase table `eval_grades` with RLS | `supabase/migrations/.../eval_grades.sql` |
| Doc 2 §F.11 | Cross-link with `agent_compositions`, `player_cartridges`, prompt-lab saves | `crossLinkLoader.ts` |
| Doc 1 §6.2 | Adversarial trajectories use the LLM-judge-misclassification pattern | `trajectoryLibrary.ts` |
| CLAUDE.md §1.1 | WebGPU+TSL primary | All 3D files |

---

## 3. Files

### 3.1 NEW

| Action | File | Approx. lines |
|---|---|---|
| NEW | `src/components/games/GlassBoxLabGame.tsx` | ~3,400 |
| NEW | `src/components/3d/TrajectoryRail3D.tsx` | ~480 |
| NEW | `src/components/3d/environments/GlassBoxEnvironment.tsx` | ~420 |
| NEW | `src/lib/glassbox/trajectoryLibrary.ts` | ~720 (40 recordings × full step metadata) |
| NEW | `src/lib/glassbox/rubricEngine.ts` | ~280 (player rubric runner + expert match) |
| NEW | `src/lib/glassbox/crossLinkLoader.ts` | ~240 (loads from agent_compositions/player_cartridges/prompts) |
| NEW | `src/stores/glassBoxStore.ts` | ~240 |
| NEW | `supabase/migrations/20260503_glass_box_eval_grades.sql` | ~40 |

### 3.2 MODIFIED

| Action | File | Why |
|---|---|---|
| MODIFY | `src/config/gameRegistry.ts` | +1 entry (`glass-box-lab`) + camera preset |
| MODIFY | `src/components/games/index.ts` | Export `GlassBoxLabGame` |
| MODIFY | `src/lib/ai/ai-content-generator.ts` | Add `'glass-box-lab'` GameId + 6 ContentTypes |

---

## 4. Triangle Budget

| Component | Desktop Ultra | LOD Low |
|---|---|---|
| `TrajectoryRail3D` (rail + 12 step-cards + 5 rubric pillars) | ~360K | ~55K |
| `GlassBoxEnvironment` (courtroom-meets-server-room) | ~3.1M | ~270K |
| Particle system (12 red-orange sparks) | ~1.5K | ~1.5K |
| **Scene total** | **~3.5M tris** | **~325K tris** |

Within 20M flagship budget.

---

## 5. Type Contracts

### 5.1 Phase Machine

```typescript
type Phase =
  | 'welcome'
  | 'learn-glassbox'      // Card 1: from black box to glass box
  | 'learn-rubric'        // Card 2: 5 dimensions of a trajectory
  | 'learn-toolchoice'    // Sub-card: tool choice correctness
  | 'learn-argvalidity'   // Sub-card: argument validity
  | 'learn-steps'         // Sub-card: step count
  | 'learn-timecost'      // Sub-card: time / cost
  | 'learn-policy'        // Sub-card: policy compliance
  | 'tutorial'            // Guided 1-trajectory grade
  | 'grade-easy'          // 10 simple trajectories
  | 'grade-medium'        // 10 ambiguous trajectories
  | 'grade-adversarial'   // 10 trick trajectories
  | 'design-rubric'       // Loop 2: design own eval, run on samples
  | 'report';             // Stats + best/worst grades + cert
```

14 phases — exceeds Doc 2 §A.1 minimum of 12.

### 5.2 Trajectory Step Shape

```typescript
// src/lib/glassbox/trajectoryLibrary.ts
export type RubricDim = 'toolChoice' | 'argValidity' | 'stepCount' | 'timeCost' | 'policy';

export interface TrajectoryStep {
  step: number;
  tool: string;                         // e.g. "calculator"
  args: Record<string, unknown>;
  durationMs: number;
  costTokens: number;
  policyFlags: string[];                // e.g. ["safe-content"]
  output: string;
  /** Expert grades 1..5 per dimension (reference for scoring). */
  expertGrade: Record<RubricDim, 1 | 2 | 3 | 4 | 5>;
}

export interface Trajectory {
  id: string;
  source: 'easy' | 'medium' | 'adversarial' | 'cross-link';
  /** When source === 'cross-link', identifies origin row. */
  origin?: { kind: 'agent-comp' | 'cartridge' | 'prompt-lab'; rowId: string };
  steps: TrajectoryStep[];
}

export const TRAJECTORY_LIBRARY: readonly Trajectory[] = [ /* 30 hardcoded; 10 cross-link generated at runtime */ ];
```

### 5.3 Rubric Engine

```typescript
// src/lib/glassbox/rubricEngine.ts
export type StepGrade = Record<RubricDim, 1 | 2 | 3 | 4 | 5>;

export interface PlayerRubric {
  weights: Record<RubricDim, number>; // sums to 1.0 in design mode
  thresholds: Record<RubricDim, number>; // 1..5 — "this is the minimum acceptable"
}

/** Apply player rubric to trajectory; return per-step pass/fail + total. */
export function runRubric(traj: Trajectory, rubric: PlayerRubric): {
  perStep: { stepIdx: number; pass: boolean; weighted: number }[];
  total: number;
};

/** Score how well player's grades match expert grades. */
export function expertMatchScore(playerGrades: StepGrade[], traj: Trajectory): number;
```

### 5.4 Cross-Link Loader

```typescript
// src/lib/glassbox/crossLinkLoader.ts
/**
 * Builds 10 cross-link trajectories from the player's own SparkForge saves.
 * Falls back gracefully if no saves exist (uses generic placeholder set).
 */
export async function loadCrossLinkTrajectories(childId: string): Promise<Trajectory[]>;
```

### 5.5 Store Shape

```typescript
interface GlassBoxState {
  trajectory: Trajectory | null;
  cursor: number;                       // current step
  grades: StepGrade[];                  // accumulating
  rubric: PlayerRubric;                 // editable in design mode
  mode: 'grade' | 'design';
  expertMatchScore: number | null;
  // actions
  loadTrajectory: (id: string) => Promise<void>;
  recordGrade: (step: number, grade: StepGrade) => void;
  setRubric: (r: PlayerRubric) => void;
  finishAndSave: () => Promise<void>;
}
```

---

## 6. Trajectory Library (40)

| Bucket | Count | Notes |
|---|---|---|
| Easy | 10 | Clearly-correct trajectories. Band B entry-level. |
| Medium | 10 | Ambiguous judgment calls. Band B/C. |
| Adversarial | 10 | Subtle errors hidden inside successful-looking outputs. Band C. Modeled on Doc 1 §6.2 LLM-judge misclassification finding. |
| Cross-link | 10 | Generated at runtime from player's own saves (`agent_compositions`, `player_cartridges`, `prompt_lab_history`). Falls back to a generic placeholder set if no saves exist. |
| **Total** | **40** | |

Each step ships with expert grades for all 5 rubric dimensions (1–5 stars).

### 6.1 6 New AI ContentTypes

| ContentType | Per band | Purpose |
|---|---|---|
| `trajectory-A`, `-B`, `-C` | each | Generated trajectory recordings (4 / 6 / 8–12 steps respectively) |
| `rubric-hint-A`, `-B`, `-C` | each | Tutorial hints based on age |

---

## 7. Game Loops

### 7.1 Loop 1: Grade Mode

Trajectory plays back step-by-step. For each step, player assigns 1–5 stars on each of 5 rubric dimensions. Score = how close each grade is to the expert grade (per-step), aggregated.

### 7.2 Loop 2: Design Mode

Player edits a `PlayerRubric` — five weight sliders that auto-normalize to 1.0, plus five threshold dropdowns. Their rubric runs against the entire 40-trajectory library; score = how well their pass/fail decisions match expert pass/fail.

---

## 8. 3D Component Specs

### 8.1 `TrajectoryRail3D.tsx`

```typescript
'use client';

interface Props {
  steps: TrajectoryStep[];
  cursor: number;
  hoveredDim: RubricDim | null;     // hover-to-highlight pillar
  playbackPlaying: boolean;
}

export default function TrajectoryRail3D({ steps, cursor, hoveredDim, playbackPlaying }: Props) {
  return (
    <group>
      <Rail length={steps.length * 0.8} />
      <StepCards steps={steps} cursor={cursor} />
      <RubricPillars hovered={hoveredDim} />     {/* 5 vertical bars showing expert grades */}
      {playbackPlaying && <PlayheadGlow position={cursor * 0.8} />}
      <FlagshipParticles count={12} color="#FF7050" />
    </group>
  );
}
```

D3D-B1 compliant.

### 8.2 `GlassBoxEnvironment.tsx`

Courtroom-meets-server-room hybrid: wood-grain referee desk, glass walls showing data flowing past, a gavel resting under spotlight.

| Asset | Tris (Ultra) |
|---|---|
| Referee desk | ~580K |
| Glass walls + flowing data | ~620K |
| Gavel + plinth | ~280K |
| Server-room background | ~520K |
| Spotlight rig | ~360K |
| Floor + base | ~180K |
| Volumetric beams (TSL) | ~520K |
| Cabling + brackets | ~140K |
| **Total** | **~3.2M** (caps to ~3.1M after LOD-cull) |

---

## 9. Persistence (Supabase migration)

```sql
-- supabase/migrations/20260503_glass_box_eval_grades.sql
create table eval_grades (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  trajectory_id text not null,
  grades jsonb not null,                -- StepGrade[]
  rubric jsonb,                          -- PlayerRubric (only set in design mode)
  expert_match_score numeric,            -- 0..1
  created_at timestamptz not null default now()
);

create index eval_grades_child_idx on eval_grades(child_id);

alter table eval_grades enable row level security;

create policy "child rw own grades" on eval_grades
  for all
  using (child_id = current_setting('app.child_id', true)::uuid)
  with check (child_id = current_setting('app.child_id', true)::uuid);

create policy "parent reads child grades" on eval_grades
  for select
  using (
    exists (
      select 1 from children c
      where c.id = eval_grades.child_id
        and c.parent_id = auth.uid()
    )
  );
```

`get_advisors` mandatory post-DDL.

---

## 10. Cross-Game Integration

### 10.1 Read Sources

`crossLinkLoader.ts` queries:

- `agent_compositions` (Stage 11D) → simulate runs of saved compositions, capturing each agent step as a `TrajectoryStep`
- `player_cartridges` (Stage 11E) → simulate runs against a fixed set of probe missions
- `prompt_lab_history` (existing) → replay past prompt sessions

### 10.2 Stable Contracts

The Trajectory shape (§5.2) is **stable** as of this stage. Stage 11G (Harness Forge) will read `eval_grades` rows via the same contract.

---

## 11. Registry & Camera Preset

```typescript
const CAMERA_PRESETS = {
  // ...
  'glass-box-lab': { position: [0, 2.2, 5.5], lookAt: [0, 0.8, 0], fov: 47 },
};

{
  id: 41,
  name: 'Glass Box Lab',
  slug: 'glass-box-lab',
  lab: 6,
  labName: LAB_NAMES[6],
  tier: 'flagship',
  has3D: true,
  component3D: 'TrajectoryRail3D',
  ageBands: ['B', 'C'],
  stage: '11F',
  description: 'Be the referee of every step the AI takes — and design the rules of fair play.',
  icon: '⚖️',
  triangleBudget: budget('flagship', true),
  cameraPreset: cameraPreset('glass-box-lab'),
}
```

---

## 12. Acceptance Criteria

- [ ] All 14 phases reachable; `report` shows expert-match score and grade distribution.
- [ ] 30 hardcoded trajectories + 10 runtime-generated cross-link = 40 total.
- [ ] Cross-link loader gracefully falls back to placeholder set when no saves exist.
- [ ] 5-dimension rubric runs deterministically; per-step pass/fail flagged correctly.
- [ ] Design Mode: weight sliders auto-normalize to 1.0; threshold dropdowns 1..5.
- [ ] `eval_grades` migration applied; `get_advisors` PASS.
- [ ] B/C primary; A 2D fallback.
- [ ] WebGPU+TSL primary path.
- [ ] All ARIA labels.
- [ ] Chrome bezel + LED rim.
- [ ] AI content slot wired (6 ContentTypes).
- [ ] Estimated TSX lines: **3,400 for `GlassBoxLabGame.tsx`**.
- [ ] Build / type / lint PASS.
- [ ] Sentry release tag `stage-11f-glass-box-lab`.

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Cross-link trajectories require player saves; new players have none | Placeholder generic set; graceful degradation; explanatory copy |
| Adversarial trajectories may upset younger players | Adversarial bucket gated to band C only by default |
| Rubric weight slider UI is fiddly | Use stepped notches (0.0/0.1/.../1.0); preset rubric chips for quick start |
| Trajectory rail 3D feels static during playback | Playhead glow + step-card raise/lower animation |

---

## 14. References

- Doc 2 Section F — concept spec
- Doc 1 §6 — AI Safety / Alignment / Evals research
- `STAGE11D_v3FINAL.md` §11 — `agent_compositions` save contract (consumed here)
- `STAGE11E_v3FINAL.md` §11 — `player_cartridges` save contract (consumed here)
- `STAGE6E_v3FINAL_A.md` — Canvas Coexistence rule (D3D-B1)
- CLAUDE.md §1.1 — Tech Quality Mandate
- CLAUDE.md §2 — `get_advisors` post-DDL requirement

---

*End of STAGE11F_v3FINAL.md.*

