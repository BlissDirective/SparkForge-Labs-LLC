# Stage 11A v3-FINAL — Pocket Brain (C5)

**Version:** v3-FINAL
**Build Phase:** 11A — *first* of 7 in the Stage 11 New-Flagship Cohort.
**Concept Source:** `docs/research/02-Flagship-Game-Concepts.md` Section H.
**Lab:** 1 — *What IS AI?* (`#0FB8FA`, OKLCH `oklch(0.75 0.17 225)`)
**Age Bands:** A (7–9) / B (10–12) / C (13–16) — all three supported.
**Validation gates:** `npm run build` PASS, `npx tsc --noEmit` PASS, `npm run lint` PASS.
**Tier:** Flagship (20M-tri budget desktop ultra).

---

## 1. Overview

Pocket Brain is the **anchor flagship for Lab 1**. It is the first SparkForge game to run a real LLM **fully client-side** — no server call, no API key, no per-prompt cost. The entire learning loop ("what *is* a model?") is shown, not told: a real Mixture-of-Experts SLM downloads, caches in IndexedDB, and streams tokens out of the browser at WebGPU speeds.

This stage exists because of the WebGPU + WebAssembly maturation documented in `01-AI-Trends-Research.md` §7 — specifically, LFM2-MoE (Liquid AI), Phi-4 (Microsoft), and Gemma 3/4 (Google) crossed the production-quality threshold for in-browser inference between Q4 2025 and Q1 2026.

### 1.1 Why Stage 11A first?

- **Cheapest tech to validate.** No new database tables, no new AI ContentTypes, no Anthropic API spend.
- **Highest visual "wow"** for the Lab 1 narrative ("a real AI lives in your browser").
- **Unblocks nothing.** Other stages do not depend on Pocket Brain's outputs.
- **Tests the WebGPU inference pipeline** — discovers any device-capability issues that would also affect future browser-side AI features (compaction, memory tiering, on-device evals).

---

## 2. Decisions Implemented

| Decision | Description | Component |
|---|---|---|
| **Doc 2 §H.1** | Real client-side LLM, not a simulation | `PocketBrainGame.tsx` |
| **Doc 2 §H.5** | Three-tier model fallback (LFM2-MoE → Gemma 4 E2B → TinyLlama) based on device capability | `PocketBrainModelLoader.ts` |
| **Doc 2 §H.6** | 30 prompts × 4 quantization levels = 120 runs | `pocketBrainPrompts.ts` |
| **Doc 2 §H.7** | Two loops: Explore + Speed Race | `PocketBrainGame.tsx` |
| **Doc 2 §H.8** | 8-lobe MoE switchboard 3D visualization | `PocketBrain3D.tsx` |
| **Doc 2 §H.11** | Zero per-prompt cost (compare-cloud is single tightly-bounded call) | `PocketBrainGame.tsx` |
| **Doc 2 §H.13** | WebGPU primary path; MP4-poster fallback for unsupported devices | `PocketBrainGame.tsx` |
| **CLAUDE.md §1.1** | Tech-quality mandate: WebGPU + TSL primary path, no fork | All 3D files |

---

## 3. Files

### 3.1 NEW

| Action | File | Approx. lines |
|---|---|---|
| NEW | `src/components/games/PocketBrainGame.tsx` | ~2,800 |
| NEW | `src/components/3d/PocketBrain3D.tsx` | ~520 |
| NEW | `src/components/3d/environments/PocketBrainEnvironment.tsx` | ~380 |
| NEW | `src/lib/pocketbrain/PocketBrainModelLoader.ts` | ~280 |
| NEW | `src/lib/pocketbrain/pocketBrainPrompts.ts` | ~310 (30 prompts × 5 themes) |
| NEW | `src/lib/pocketbrain/quantization.ts` | ~120 (Q4/Q5/Q8/FP16 helpers) |
| NEW | `src/stores/pocketBrainStore.ts` | ~210 |
| NEW | `public/poster/pocket-brain-fallback.mp4` | (asset; ≤ 6MB, 12 s clip) |

### 3.2 MODIFIED

| Action | File | Why |
|---|---|---|
| MODIFY | `src/config/gameRegistry.ts` | +1 `GameRegistryEntry` (`pocket-brain`) + camera preset |
| MODIFY | `src/components/games/index.ts` | Export `PocketBrainGame` |
| MODIFY | `package.json` | `@mlc-ai/web-llm` (and optional `@huggingface/transformers` fallback) |

**No Supabase migration.** State is ephemeral; long-term progress hooks into existing `child_progress`.

---

## 4. Triangle Budget

Stage 11A is a *low-3D-complexity* flagship — most of the visual interest is in the streaming token pellets and the MoE lobes. Triangle budget targets:

| Component | Desktop Ultra | LOD Low |
|---|---|---|
| `PocketBrain3D` (brain + 8 lobes + token pellets) | ~120K | ~25K |
| `PocketBrainEnvironment` (laptop/desk/orbs scene) | ~2.4M | ~200K |
| Particle system (12 lab-blue sparks) | ~1.5K | ~1.5K |
| **Scene total** | **~2.5M tris** | **~225K tris** |

Well within the **20M** flagship desktop budget (`gameRegistry.ts:69`). LODWrapper adaptive FPS monitoring per Stage 6E precedent.

| Device | Max Budget | Target FPS | LOD Level |
|---|---|---|---|
| Desktop (WebGPU) | 20,000,000 | 60 | ultra/high |
| Tablet | 5,000,000 | 45 | medium |
| Mobile | 2,500,000 | 30 | low |
| Non-WebGPU device | — | — | MP4-poster fallback (no R3F) |

---

## 5. Type Contracts

### 5.1 Phase Machine

```typescript
type Phase =
  | 'welcome'           // Hero overlay + voiceover
  | 'learn-model'       // Card 1: "What's a model?"
  | 'learn-tokens'      // Card 2: tokens explained with emoji
  | 'learn-where'       // Card 3: cloud vs in-browser
  | 'download'          // Real download bar, real model fetch
  | 'first-run'         // Real prompt, real response stream
  | 'token-stream-view' // Slo-mo token + logit visualization
  | 'quantization-lab'  // Slider: Q4 / Q5 / Q8 / FP16. RAM bar moves.
  | 'moe-switchboard'   // Visualize which expert lit up per token
  | 'speed-race'        // Loop 2: timed trivia with quant-level tradeoff
  | 'compare-cloud'     // Side-by-side with one Anthropic API answer
  | 'pocket-mode'       // Free play with the SLM
  | 'report';           // Stats + cert ("you ran a real LLM today")
```

13 phases — meets the **≥ 12 phases** target codified in Doc 2 §A.1.

### 5.2 Store Shape

```typescript
// src/stores/pocketBrainStore.ts
import { create } from 'zustand';

export type ModelChoice = 'lfm2-moe' | 'gemma-e2b' | 'tinyllama-1b';
export type Quantization = 'Q4' | 'Q5' | 'Q8' | 'FP16';
export type ModelStatus = 'idle' | 'downloading' | 'loading' | 'ready' | 'error';

export interface PocketBrainState {
  modelStatus: ModelStatus;
  modelChoice: ModelChoice;
  quantization: Quantization;
  prompt: string;
  streamingTokens: string[];
  activeExperts: number[];      // MoE lobes lit, ids 0..7
  ramUsageBytes: number;
  tokensPerSec: number;
  downloadProgress: number;     // 0..1
  webgpuSupported: boolean;
  // actions
  setQuantization: (q: Quantization) => void;
  beginDownload: () => Promise<void>;
  runPrompt: (text: string) => Promise<void>;
  reset: () => void;
}
```

### 5.3 Model Loader Contract

```typescript
// src/lib/pocketbrain/PocketBrainModelLoader.ts
export interface PocketBrainEngine {
  status: ModelStatus;
  /** Streams chunks; returns aggregated text once finished. */
  generate(prompt: string, opts: { quantization: Quantization; maxTokens?: number }):
    AsyncGenerator<{ token: string; expertId: number; tps: number }, string, void>;
  /** Bytes currently held in JS heap + GPU memory by the loaded model. */
  ramUsage(): number;
  /** Free model resources. */
  dispose(): void;
}

export async function loadPocketBrain(opts: {
  preferredModel: ModelChoice;
  onProgress: (p: number) => void;
}): Promise<PocketBrainEngine>;
```

The loader inspects `navigator.gpu`, available device memory (`navigator.deviceMemory`), and chosen quantization, then negotiates down through the three-tier fallback (LFM2-MoE → Gemma 4 E2B → TinyLlama). If WebGPU is missing, `loadPocketBrain` rejects and the game switches to the **MP4-poster fallback** path — no R3F mounted, no @mlc-ai/web-llm imported.

---

## 6. Content Library

### 6.1 30 Hardcoded Prompts × 5 Themes

Defined in `src/lib/pocketbrain/pocketBrainPrompts.ts`. Every prompt is single-purpose, kid-safe, and scored against a hand-built reference answer for Speed Race grading.

| Theme | Count | Example |
|---|---|---|
| Story Starters | 6 | *"Write 3 sentences about a brave cat who learns to fly."* |
| Math | 6 | *"What is 17 × 4? Show your work."* |
| Translation | 6 | *"Say 'good morning, friend' in French."* |
| Common Sense | 6 | *"If I drop an egg from a table, what happens? Why?"* |
| Creative | 6 | *"Make up a name for a friendly robot that helps in a library."* |

Each prompt structure:

```typescript
export interface PocketBrainPrompt {
  id: string;            // 'story-001', 'math-003', etc.
  theme: 'story' | 'math' | 'translate' | 'sense' | 'create';
  text: string;          // the prompt
  band: ('A' | 'B' | 'C')[]; // visible bands
  reference: string;     // expert reference answer for grading
  acceptanceTokens: string[]; // partial-credit substring matches
  maxTokens: number;     // model output cap (40-150 typical)
}
```

### 6.2 Quantization Set (4 levels)

```typescript
// src/lib/pocketbrain/quantization.ts
export const QUANTIZATIONS = [
  { id: 'Q4', bytesPerParam: 0.5, accuracyBand: 'fast/dim' },
  { id: 'Q5', bytesPerParam: 0.625, accuracyBand: 'balanced' },
  { id: 'Q8', bytesPerParam: 1.0, accuracyBand: 'sharp' },
  { id: 'FP16', bytesPerParam: 2.0, accuracyBand: 'crisp/heavy' },
] as const;
```

30 prompts × 4 quants = **120 runs** of unique observable behavior — meets Doc 2 §H content target.

---

## 7. Phase Implementation Sketch

### 7.1 `welcome` → `learn-model` → `learn-tokens` → `learn-where`

Standard Card UI matching `BiasDetectiveGame.tsx` learn phase pattern. No model load yet — fully cached card content with motion entrance.

### 7.2 `download`

A **real** download bar driven by `loadPocketBrain({ onProgress })`. Cancellable. On success, transitions to `first-run`. On non-WebGPU, transitions to MP4-poster fallback view (separate render path that does NOT mount `PocketBrain3D`).

### 7.3 `first-run`

Non-interactive: a single hardcoded prompt (`"Hello! Tell me one fun fact about the brain."`) is sent to the engine; the player watches tokens stream into the 3D view (PocketBrain3D handles visualization). On completion, transitions to `token-stream-view`.

### 7.4 `token-stream-view`

Re-runs the previous prompt at **0.25× playback rate**, with each token revealing its top-5 logit candidates as drei `<Text>` floating beside the active token pellet. Teaches the **probability/sampling** concept.

### 7.5 `quantization-lab`

Interactive slider component. Changing the slider triggers `loadPocketBrain` with new quantization (reuses the same model file when possible — only re-quantizes on the GPU). RAM bar updates from `engine.ramUsage()`. Each level runs the same prompt for comparison.

### 7.6 `moe-switchboard`

If the loaded model is **LFM2-MoE** (the primary path), `PocketBrain3D` shows 8 lobes lighting up per token based on `engine.generate()`'s yielded `expertId`. If the fallback is the dense Gemma E2B / TinyLlama, this phase shows a "no MoE on this device" educational card and skips to next.

### 7.7 `speed-race` (Loop 2)

5-minute timed mode. The player picks a quantization at the start. Speed Race feeds 25 trivia prompts; the model answers; player rates each (correct / partial / wrong). Score = (correct − wrong/2) × quantization-bonus. Lower-quant runs faster but scores fewer points per correct.

### 7.8 `compare-cloud`

**The only cloud call in the entire game.** A single `POST /api/pocket-brain/compare` invokes the existing Anthropic-API path used by Prompt Lab (`src/app/api/prompt-lab/route.ts` precedent) with strict input filtering. Renders side-by-side: local vs cloud answer.

### 7.9 `pocket-mode` (Loop 1, free play)

Player types any prompt; engine answers. Output goes through existing kid-safe filter (`src/lib/safety/kidSafeFilter.ts` if present, else inline filter chain — see §10 acceptance).

---

## 8. 3D Component Specs

### 8.1 `PocketBrain3D.tsx`

```typescript
// src/components/3d/PocketBrain3D.tsx
'use client';

interface Props {
  activeExperts: number[];   // 0..7 lobes lit
  streamingTokens: string[]; // tokens in flight as glowing pellets
  tokensPerSec: number;
}

export default function PocketBrain3D({ activeExperts, streamingTokens, tokensPerSec }: Props) {
  return (
    <group>
      <BrainCore />               {/* Glowing centroid, IcosahedronGeometry detail 3 */}
      <MoELobes active={activeExperts} />  {/* 8 spheres ringed around the core */}
      <TokenPellets tokens={streamingTokens} speed={tokensPerSec} />
      <FlagshipParticles count={12} color="#0FB8FA" />
    </group>
  );
}
```

**Canvas embedding:** per Stage 6E §FIX-DUAL-CANVAS, `PocketBrain3D` uses `<group>` (no inner `<Canvas>`) inside the existing CockpitCanvas. **Key rule: D3D-B1.**

### 8.2 `PocketBrainEnvironment.tsx`

Tabletop laptop-on-desk scene. Reuses chrome-bezel materials from `BrandingMaterial.tsx` (CLAUDE.md §1.1 single source of truth).

| Asset | Tris (Ultra) | Notes |
|---|---|---|
| Desk | ~80K | Wood-grain SDF noise normal map |
| Laptop | ~750K | Chrome bezel + screen mesh |
| Glowing model orbs (5) | ~280K | InstancedMesh, particles attached |
| Notebook + papers | ~190K | drei `<Float>` |
| Bookshelf (background) | ~600K | Cube-mapped low-poly fallback |
| Fog + atmospherics | ~500K | Volumetric noise FBM |
| **Total** | **~2.4M** | LOD low: ~200K |

---

## 9. Registry & Camera Preset

```typescript
// src/config/gameRegistry.ts — additions
const CAMERA_PRESETS: Record<string, GameCameraPreset> = {
  // ... existing entries ...
  'pocket-brain': { position: [0, 1.5, 4], lookAt: [0, 0.8, 0], fov: 42 },
};

export const GAME_REGISTRY: readonly GameRegistryEntry[] = [
  // ... existing 35 entries ...
  {
    id: 36,
    name: 'Pocket Brain',
    slug: 'pocket-brain',
    lab: 1,
    labName: LAB_NAMES[1],
    tier: 'flagship',
    has3D: true,
    component3D: 'PocketBrain3D',
    ageBands: ['A', 'B', 'C'],
    stage: '11A',
    description: 'Run a real AI model right inside your browser. Watch tokens stream out and dial up the brain power.',
    icon: '🧠', // 🧠
    triangleBudget: budget('flagship', true),
    cameraPreset: cameraPreset('pocket-brain'),
  },
];
```

---

## 10. Acceptance Criteria (HS-5 visual checkpoint after this stage)

- [ ] All 13 phases reachable from `welcome` and end in `report`.
- [ ] `loadPocketBrain` succeeds on a WebGPU-enabled Chromium 113+ device with LFM2-MoE.
- [ ] On Safari without WebGPU, the game falls back cleanly to the MP4-poster path; no `@mlc-ai/web-llm` import error reaches the user.
- [ ] Quantization slider changes RAM bar by the expected ratio (Q4 ≈ 0.5×, FP16 = 2×, vs Q8 = 1×).
- [ ] MoE switchboard shows 1–2 active lobes per token on LFM2-MoE; on dense fallback, the educational "no MoE here" card displays.
- [ ] Speed Race scoring math matches the formula in §7.7.
- [ ] `compare-cloud` makes exactly **one** Anthropic API call per session, gated behind a confirm modal.
- [ ] All 30 hardcoded prompts pass kid-safe filtering on local SLM output (`src/lib/safety/kidSafeFilter.ts` if present, else inline regex chain — *new requirement: confirm presence of safety helper before merge*).
- [ ] `PocketBrain3D` mounts inside CockpitCanvas (`<group>` only, no inner `<Canvas>`).
- [ ] Triangle count under 20M ultra; under 2.5M low.
- [ ] All ARIA labels present on interactive elements (slider, prompt input, run button).
- [ ] Chrome bezel + LED rim per Frost-Prismatic visual system.
- [ ] Estimated TSX lines: **2,800 for `PocketBrainGame.tsx`** (≥ 2× current flagship median 1,650).
- [ ] `npm run build`, `npx tsc --noEmit`, `npm run lint` all PASS.
- [ ] Lighthouse: no new Best-Practice or Accessibility regressions.
- [ ] Sentry release tag includes `stage-11a-pocket-brain`.

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| WebGPU unsupported on a player's browser | MP4-poster fallback path + clear in-game explanation |
| Model download too slow on slow networks | Cache in IndexedDB; show progress; cancel/resume buttons |
| LFM2-MoE WASM blob exceeds Vercel asset limits | Host on Cloudflare R2 / model CDN, fetched at runtime (already standard for `@mlc-ai/web-llm`) |
| Output contains kid-unsafe text from local SLM | Inline kid-safe filter chain (regex + word-list); see §10 acceptance — this MUST exist before merge |
| Prompt cache leaks across child accounts | IndexedDB key includes `child.id`; cleared on logout |

---

## 12. References

- Doc 2 (`02-Flagship-Game-Concepts.md`) Section H — full concept spec
- Doc 1 (`01-AI-Trends-Research.md`) §7 — On-device / Edge AI research findings
- `STAGE6E_v3FINAL_A.md` lines 4–11 — Canvas Coexistence + D3D-B1 rule reused here
- CLAUDE.md §1.1 (Tech Quality Mandate) — WebGPU primary, no fork
- CLAUDE.md §7 — Game Architecture Template (phase machine, GameShell, particles)

---

*End of STAGE11A_v3FINAL.md.*
