# Stage 11B v3-FINAL — Context Architect (C2)

**Version:** v3-FINAL
**Build Phase:** 11B — second of 7 in the Stage 11 New-Flagship Cohort.
**Concept Source:** `docs/research/02-Flagship-Game-Concepts.md` Section E.
**Lab:** 8 — *Words & Language* (`#8F96FA`, OKLCH `oklch(0.75 0.15 275)`)
**Age Bands:** A (7–9 simplified, 2D fallback) / B (10–12) / C (13–16).
**Validation gates:** `npm run build` PASS, `npx tsc --noEmit` PASS, `npm run lint` PASS.
**Tier:** Flagship (20M-tri budget desktop ultra).

---

## 1. Overview

Context Architect makes **context engineering** — the discipline declared in Doc 1 §4 to be "the new bottleneck" of LLM productization — concretely playable for kids. The AI assistant in this game has a fixed-size **context shelf**. Knowledge cards arrive with token costs and relevance scores. The player applies the four canonical "moves" — **Offload · Retrieve · Isolate · Reduce** — to keep the shelf curated under tightening token budgets.

A boss round introduces **Context Rot**: the more cards on the shelf, the lower the AI's accuracy. Players must compress to win.

Stage 11B is the second build phase because it is **migration-free**, **API-free**, and **hand-built content only** — the lowest-risk slot after Stage 11A's WebGPU pipeline validation.

---

## 2. Decisions Implemented

| Decision | Description | Component |
|---|---|---|
| Doc 2 §E.4 | 12-phase machine | `ContextArchitectGame.tsx` |
| Doc 2 §E.5 | 48 hand-built knowledge cards × 4 metadata fields | `contextArchitectCards.ts` |
| Doc 2 §E.6 | Four moves: Offload · Retrieve · Isolate · Reduce | `contextEngine.ts` |
| Doc 2 §E.7 | Three loops: Sort / Budget / Multi-turn | `ContextArchitectGame.tsx` |
| Doc 2 §E.8 | 3D shelf as floating slabs + library environment | `ContextShelf3D.tsx` |
| Doc 1 §4.3 (Context Rot) | Boss round with shrinking budget + accuracy decay | `ContextArchitectGame.tsx` |

---

## 3. Files

### 3.1 NEW

| Action | File | Approx. lines |
|---|---|---|
| NEW | `src/components/games/ContextArchitectGame.tsx` | ~3,200 |
| NEW | `src/components/3d/ContextShelf3D.tsx` | ~480 |
| NEW | `src/components/3d/environments/ContextArchitectEnvironment.tsx` | ~420 |
| NEW | `src/lib/contextarchitect/contextEngine.ts` | ~340 (move handlers + scoring) |
| NEW | `src/lib/contextarchitect/contextArchitectCards.ts` | ~520 (48 cards × 4 fields) |
| NEW | `src/lib/contextarchitect/rotModel.ts` | ~120 (Context Rot decay curve) |
| NEW | `src/stores/contextArchitectStore.ts` | ~240 |

### 3.2 MODIFIED

| Action | File | Why |
|---|---|---|
| MODIFY | `src/config/gameRegistry.ts` | +1 entry (`context-architect`) + camera preset |
| MODIFY | `src/components/games/index.ts` | Export `ContextArchitectGame` |
| MODIFY | `src/lib/ai/ai-content-generator.ts` | Add `'context-architect'` GameId + 9 ContentTypes |

**No Supabase migration.** Score and progress hook into existing `child_progress` and `game_sessions`.

---

## 4. Triangle Budget

| Component | Desktop Ultra | LOD Low |
|---|---|---|
| `ContextShelf3D` (shelf + 48 card slots + glow rims) | ~280K | ~45K |
| `ContextArchitectEnvironment` (towering library, mist, ladders) | ~3.1M | ~280K |
| Particle system (12 violet sparks) | ~1.5K | ~1.5K |
| **Scene total** | **~3.4M tris** | **~325K tris** |

Within 20M flagship budget. LODWrapper adaptive FPS.

---

## 5. Type Contracts

### 5.1 Phase Machine

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
  | 'multi-turn-mode'    // Loop 3: full conversation, manage history
  | 'rot-boss'           // Boss: 50 cards, shrinking budget
  | 'design-shelf'       // Free play: design own knowledge base
  | 'report';
```

12 phases — meets target.

### 5.2 Card Shape

```typescript
// src/lib/contextarchitect/contextArchitectCards.ts
export interface ContextCard {
  id: string;
  theme: 'animals' | 'space' | 'tech' | 'body' | 'earth' | 'math';
  text: string;            // displayed text (≤ 100 chars)
  tokens: 8 | 16 | 32 | 64;
  relevance: number;       // 0..1, set per question at runtime
  decay: number;           // 0..1, accuracy lost when reduced
  freshness: number;       // turns since added; 0 = just added
}

export const CONTEXT_CARDS: readonly ContextCard[] = [ /* 48 entries */ ];
```

### 5.3 Move Engine Contract

```typescript
// src/lib/contextarchitect/contextEngine.ts
export type Move =
  | { kind: 'offload'; cardId: string }
  | { kind: 'retrieve'; cardId: string }
  | { kind: 'isolate'; cardId: string; durationTurns: number }
  | { kind: 'reduce'; cardId: string };

export interface ApplyResult {
  shelf: ContextCard[];
  external: ContextCard[];
  used: number;        // tokens used
  rotLevel: number;    // 0..1 (Context Rot state)
}

export function applyMove(state: ApplyResult, move: Move, budget: number): ApplyResult;
```

### 5.4 Rot Model

```typescript
// src/lib/contextarchitect/rotModel.ts
// Empirical curve from Doc 1 §4.3: model accuracy ≈ 1 - (used/budget)^p where p=0.7
// once used > 0.6 * budget. Below that threshold, rot = 0.
export function computeRot(used: number, budget: number): number;
```

### 5.5 Store Shape

```typescript
interface ContextArchitectState {
  shelf: ContextCard[];
  external: ContextCard[];        // offloaded
  budget: number;                 // current token budget
  used: number;                   // tokens currently on shelf
  question: Question | null;
  rotLevel: number;               // computed from used/budget
  conversationHistory: Turn[];    // multi-turn mode
  score: number;
  // actions
  applyMove: (move: Move) => void;
  nextQuestion: () => void;
  startMode: (mode: 'sort' | 'budget' | 'multi-turn' | 'rot-boss' | 'design') => void;
}
```

---

## 6. Content Library

### 6.1 48 Knowledge Cards × 6 Themes

8 cards per theme, hand-built. Each card has token cost (8/16/32/64) and decay coefficient (0.0–0.5). Examples of card text per theme:

| Theme | Sample texts |
|---|---|
| Animals | "Cats see UV light." • "Octopus has 9 brains." • "Honeybees recognize faces." |
| Space | "Saturn would float in water." • "1 Mars day = 24 h 39 min." • "Sun's core is 27,000,000 °F." |
| Tech | "Wi-Fi is radio waves." • "QR codes can store URLs." • "Phones use 6+ sensors." |
| Body | "The brain uses 20% of your energy." • "Bones renew every 10 years." |
| Earth | "The Sahara was a forest 6,000 years ago." • "Lightning hits Earth 100×/sec." |
| Math | "Zero was invented in India around 600 CE." • "Prime numbers go on forever." |

48 cards × 4 metadata fields = 192 unique data points. Beats Doc 2 §A content target (24–48 units) at the **upper end**.

### 6.2 Difficulty Tiers

`easy / medium / hard / expert` — matches Standard Tier audit precedent. Difficulty modifies:

- Number of relevant vs distractor cards in the round
- Initial budget (tighter at higher tiers)
- Number of multi-turn rounds before report

### 6.3 9 New AI ContentTypes (`ai-content-generator.ts`)

| ContentType | Per band | Purpose |
|---|---|---|
| `question-A`, `question-B`, `question-C` | each | Procedural question generators |
| `distractor-A`, `distractor-B`, `distractor-C` | each | Generated decoy cards |
| `summary-rubric-A`, `summary-rubric-B`, `summary-rubric-C` | each | Eval criteria for player's reduce-move output |

Rate-limited via existing infra (15 calls/game/session).

---

## 7. Game Loops

### 7.1 Loop 1: Sort Mode

Question arrives. 6–10 cards arrive in a tray. Player drags relevant cards onto shelf, ignores distractors. AI answers using only shelved cards. Score = correctness × precision.

### 7.2 Loop 2: Budget Mode

Same as Sort Mode, **plus** a fixed token budget (starts at 256, drops by 32 each round). Players must Offload or Reduce to fit. Score = correctness × budget-margin.

### 7.3 Loop 3: Multi-turn Mode

A 6-turn conversation. The player must keep the shelf relevant across all 6 turns, using Isolate to scope context to specific sub-tasks and Reduce to compress aging cards. Score = average correctness across turns.

### 7.4 Boss: `rot-boss`

50 cards stream onto shelf rapidly. Budget shrinks 8 tokens/sec. Rot rises. The only way to win is to **Reduce aggressively** while preserving high-relevance cards. Boss-round-only mechanic: a "pristine" indicator goes red when rot > 0.5.

---

## 8. 3D Component Specs

### 8.1 `ContextShelf3D.tsx`

```typescript
'use client';

interface Props {
  cards: ContextCard[];        // shelf contents
  external: ContextCard[];     // offloaded (rendered behind shelf as ghosts)
  budget: number;
  used: number;
  rotLevel: number;            // 0..1 — drives shelf glow color (cyan→red)
}

export default function ContextShelf3D(props: Props) {
  // 3D bookshelf, drei <Box> per card slot, glowing token-bar above
  // Rot-level drives a TSL fragment shader that desaturates and warms the shelf
  // as rot rises. (Per CLAUDE.md §1.1 — TSL primary; no WebGL2 fork.)
  return (
    <group>
      <ShelfFrame />
      <CardSlots cards={props.cards} budget={props.budget} used={props.used} />
      <ExternalGhosts cards={props.external} />
      <TokenBar used={props.used} budget={props.budget} />
      <RotOverlay level={props.rotLevel} />
      <FlagshipParticles count={12} color="#8F96FA" />
    </group>
  );
}
```

Canvas embedding rule: D3D-B1 — `<group>` only.

### 8.2 `ContextArchitectEnvironment.tsx`

Library setting: tall shelves disappearing into mist, archive ladders, dust-mote particles. Budget breakdown:

| Asset | Tris (Ultra) |
|---|---|
| Far shelves (2 walls, instanced) | ~1.6M |
| Ladder + railings | ~140K |
| Floor + base | ~80K |
| Volumetric mist (TSL) | ~600K (shader-driven) |
| Hanging lamps + cables | ~520K |
| Background bookshelves (cube-mapped) | ~160K |
| **Total** | **~3.1M** |

---

## 9. Registry & Camera Preset

```typescript
// gameRegistry.ts additions
const CAMERA_PRESETS: Record<string, GameCameraPreset> = {
  // ...
  'context-architect': { position: [0, 2, 5], lookAt: [0, 1, 0], fov: 46 },
};

{
  id: 37,
  name: 'Context Architect',
  slug: 'context-architect',
  lab: 8,
  labName: LAB_NAMES[8],
  tier: 'flagship',
  has3D: true,
  component3D: 'ContextShelf3D',
  ageBands: ['A', 'B', 'C'],
  stage: '11B',
  description: 'Curate the AI assistant\'s knowledge shelf — keep what matters, offload the rest.',
  icon: '📚',
  triangleBudget: budget('flagship', true),
  cameraPreset: cameraPreset('context-architect'),
}
```

---

## 10. Acceptance Criteria

- [ ] All 12 phases reachable; `report` shows score breakdown.
- [ ] Four moves (Offload/Retrieve/Isolate/Reduce) wire to `applyMove` deterministically.
- [ ] 48 hand-built cards loaded from `contextArchitectCards.ts`.
- [ ] Rot model curve `1 - (u/b)^0.7` matches §5.4 reference; visible on shelf glow.
- [ ] Boss round (`rot-boss`) playable; shrinking budget tied to a 30-second clock.
- [ ] Three loops (Sort / Budget / Multi-turn) selectable from `tutorial` exit.
- [ ] All 3 age bands supported (A: simplified, max 2 moves shown at a time; B: standard; C: free-form).
- [ ] WebGPU+TSL shader for shelf glow primary path; MP4-poster fallback for non-WebGPU.
- [ ] All ARIA labels present.
- [ ] Chrome bezel + LED rim per Frost-Prismatic.
- [ ] AI content slot wired with 9 ContentTypes (rate-limited).
- [ ] Estimated TSX lines: **3,200 for `ContextArchitectGame.tsx`**.
- [ ] Build / type / lint PASS.
- [ ] Sentry release tag includes `stage-11b-context-architect`.

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Drag-and-drop on shelf is fiddly on touch screens | A-band uses 2-button "send to shelf / offload" UI; B/C uses drag |
| Rot curve feels punishing or confusing | Tuning pass after first playtest; expose curve `p` as a single dev knob |
| Multi-turn round runs long (≥ 10 min) | Cap turns at 6; offer "save & resume" via `child_progress.last_state_blob` |

---

## 12. References

- Doc 2 Section E — concept spec
- Doc 1 §4 — Context Engineering research
- `STAGE6E_v3FINAL_A.md` — Canvas Coexistence rule (D3D-B1)
- CLAUDE.md §1.1 — Tech Quality Mandate (TSL primary)
- CLAUDE.md §11 — Standard Tier audit precedent for difficulty tiers + AI content slots

---

*End of STAGE11B_v3FINAL.md.*
