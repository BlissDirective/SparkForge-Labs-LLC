# Stage 11C v3-FINAL — Pixel Witness (C4)

**Version:** v3-FINAL
**Build Phase:** 11C — third of 7 in the Stage 11 New-Flagship Cohort.
**Concept Source:** `docs/research/02-Flagship-Game-Concepts.md` Section G.
**Lab:** 7 — *Computer Vision* (`#10BAD2`, OKLCH `oklch(0.75 0.14 195)`).
**Age Bands:** A (7–9) / B (10–12) / C (13–16) — all three supported.
**Validation gates:** `npm run build` PASS, `npx tsc --noEmit` PASS, `npm run lint` PASS.
**Tier:** Flagship (20M-tri budget desktop ultra).

---

## 1. Overview

Pixel Witness is the **anchor flagship for Lab 7**. Modern frontier multimodal models (Doc 1 §5) train *one* transformer on mixed-modality token streams — no more vision-encoder bridge. Pixel Witness teaches this through a **video-first puzzle**: a short kid-safe clip plays, an AI describes/answers questions about it, and the player decides what's correct, what's a hallucination, and (in advanced phases) configures **which "senses" the AI gets to use**.

All clips are **pre-authored, royalty-free, kid-safe**. AI answers are **pre-recorded** (no live VLM call) for the primary loop; only the optional `creative-sandbox` phase touches a live image-gen API behind a strict prompt filter.

Stage 11C is the third build phase because — like 11B — it requires **no new database**, **no new LLM infrastructure**, and **only one new content slot** (per-clip generated questions). The clip library is the only blocker (royalty-free curation, sized small enough to ship via Vercel asset pipeline).

---

## 2. Decisions Implemented

| Decision | Description | Component |
|---|---|---|
| Doc 2 §G.4 | 12-phase machine with hallucination-hunt boss | `PixelWitnessGame.tsx` |
| Doc 2 §G.5 | 24 clips × 4 questions = 96 Q-A pairs | `pixelWitnessClips.ts` |
| Doc 2 §G.6 | Sense Builder loop (Caption/Frame/Video/Audio toggles) | `PixelWitnessGame.tsx` |
| Doc 2 §G.11 | Pre-recorded AI answers; only creative-sandbox uses live cloud | `PixelWitnessGame.tsx` |
| Doc 1 §5.1 (single-transformer) | Sense Builder mechanic teaches early-fusion concept | `PixelWitnessGame.tsx` |
| CLAUDE.md §1.1 | WebGPU+TSL primary path for cinema-screen shader | `PixelWitness3D.tsx` |

---

## 3. Files

### 3.1 NEW

| Action | File | Approx. lines |
|---|---|---|
| NEW | `src/components/games/PixelWitnessGame.tsx` | ~3,000 |
| NEW | `src/components/3d/PixelWitness3D.tsx` | ~440 |
| NEW | `src/components/3d/environments/PixelWitnessEnvironment.tsx` | ~380 |
| NEW | `src/lib/pixelwitness/pixelWitnessClips.ts` | ~620 (24 clips × 4 Q each + metadata) |
| NEW | `src/lib/pixelwitness/senseConfig.ts` | ~110 (modality cost helpers) |
| NEW | `src/lib/pixelwitness/halluRules.ts` | ~140 (adversarial-Q matchers) |
| NEW | `src/stores/pixelWitnessStore.ts` | ~180 |
| NEW | `public/clips/pixel-witness/*.mp4` | 24 clips × ≤ 1.5MB each, 5–15 s |

### 3.2 MODIFIED

| Action | File | Why |
|---|---|---|
| MODIFY | `src/config/gameRegistry.ts` | +1 entry (`pixel-witness`) + camera preset |
| MODIFY | `src/components/games/index.ts` | Export `PixelWitnessGame` |
| MODIFY | `src/lib/ai/ai-content-generator.ts` | Add `'pixel-witness'` GameId + 6 ContentTypes |

**No Supabase migration.** Score and ratings hook into existing `child_progress`.

---

## 4. Triangle Budget

| Component | Desktop Ultra | LOD Low |
|---|---|---|
| `PixelWitness3D` (curved cinema screen + iris-eye + frame timeline) | ~340K | ~55K |
| `PixelWitnessEnvironment` (edit-bay setting) | ~2.7M | ~240K |
| Particle system (12 cyan sparks) | ~1.5K | ~1.5K |
| **Scene total** | **~3.0M tris** | **~295K tris** |

Within 20M flagship budget. LODWrapper adaptive FPS.

---

## 5. Type Contracts

### 5.1 Phase Machine

```typescript
type Phase =
  | 'welcome'
  | 'learn-modal'         // Card 1: senses → modalities
  | 'learn-fusion'        // Card 2: bolt-on bridge vs single transformer
  | 'learn-hallucinate'   // Card 3: what an AI hallucination looks like
  | 'tutorial'            // 1 guided clip with overlay
  | 'watch-A'             // 6 simple clips (band A primary)
  | 'watch-B'             // 9 medium clips
  | 'watch-C'             // 9 hard / adversarial clips
  | 'hallucination-hunt'  // Boss: AI is confidently wrong, player must spot it
  | 'sense-builder'       // Loop 2: configure which modalities the AI gets
  | 'creative-sandbox'    // Optional: prompt an image gen (Imagen/Flux gated)
  | 'report';
```

12 phases — meets target.

### 5.2 Clip + Question Shape

```typescript
// src/lib/pixelwitness/pixelWitnessClips.ts
export type QuestionType = 'literal' | 'inferential' | 'counting' | 'adversarial';

export interface ClipQuestion {
  id: string;
  type: QuestionType;
  text: string;
  /** AI's pre-recorded answer for this Q. */
  aiAnswer: string;
  /** Ground truth — used to grade player's rating. */
  groundTruth: string;
  /** For adversarial Q's, the specific hallucination signature. */
  hallucinationSignature?: string;
}

export interface PixelWitnessClip {
  id: string;
  src: string;           // public/clips/pixel-witness/<id>.mp4
  durationSec: number;
  band: ('A' | 'B' | 'C')[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  theme: 'everyday' | 'nature' | 'mechanical' | 'sports' | 'crafts';
  questions: ClipQuestion[]; // exactly 4: literal, inferential, counting, adversarial
  attributionLicense: string; // CC-0 / public-domain / royalty-free vendor + url
}

export const PIXEL_WITNESS_CLIPS: readonly PixelWitnessClip[] = [ /* 24 entries */ ];
```

Each clip ships with **4** questions, structured for ground-truth grading. Total Q-A pairs: **96** — top of Doc 2's 24–48 content target.

### 5.3 Sense Config

```typescript
// src/lib/pixelwitness/senseConfig.ts
export type Sense = 'caption' | 'frame' | 'video' | 'audio';

export const SENSE_COSTS: Record<Sense, number> = {
  caption: 1,
  frame: 5,
  video: 30,
  audio: 5,
};

/** Given enabled senses, return the AI's "expected" accuracy band 0..1. */
export function expectedAccuracy(enabled: Sense[]): number;
```

Each clip carries a `senseAccuracyMatrix` (4×16 = 64 numbers per clip — pre-computed) describing expected accuracy for each Q given each sense combo. Loaded lazily by Sense Builder mode.

### 5.4 Store Shape

```typescript
interface PixelWitnessState {
  clip: PixelWitnessClip | null;
  questionIdx: number;
  ratings: ('correct' | 'partial' | 'hallucination')[];
  senses: Sense[];
  senseTokenBudget: number;
  totalScore: number;
  // actions
  loadClip: (id: string) => void;
  rate: (q: number, value: 'correct' | 'partial' | 'hallucination') => void;
  toggleSense: (s: Sense) => void;
}
```

---

## 6. Content Library

### 6.1 24 Pre-Authored Clips × 5 Themes

All clips kid-safe, ≤ 15 s, royalty-free / CC-0. Themes:

| Theme | Count | Examples |
|---|---|---|
| Everyday | 5 | Cat opens a door · Kid blows bubbles · Dog catches ball |
| Nature | 5 | Sunrise time-lapse · Leaf falling · Ocean wave |
| Mechanical | 5 | Clock gears moving · Dominoes falling · Balloon inflating |
| Sports | 5 | Soccer goal · Swim dive · Gymnastics flip |
| Crafts | 4 | Paper origami · Cake decorating · Plant repotting · Knot tying |

Each clip has 4 questions = **96 distinct Q-A pairs**.

### 6.2 Adversarial Questions (24)

Each clip's 4th question is **adversarial** — the AI's pre-recorded answer is *plausibly wrong* in a specific way. Examples:

- "How many bubbles did the kid blow?" — AI says "8". Truth: visible 5. Player must catch it.
- "Which cat paw opened the door?" — AI says "right paw". Truth: it was clearly the left.

The hallucination signature for each adversarial answer is captured in `halluRules.ts` so post-rating reasoning can show *why* the AI was wrong.

### 6.3 6 New AI ContentTypes

| ContentType | Per band | Purpose |
|---|---|---|
| `clip-question-A`, `-B`, `-C` | each | Custom Q generator per clip (rate-limited) |
| `hallucination-prompt-A`, `-B`, `-C` | each | Adversarial Q generator |

---

## 7. Game Loops

### 7.1 Loop 1: Watch & Judge

Clip plays → 4 questions → AI answers → player rates each (correct / partial / hallucination). Score = correct rating × difficulty multiplier.

### 7.2 Loop 2: Sense Builder

Same clip + Q set, but player configures `senses[]` first. Cost is summed; AI accuracy is sampled from `senseAccuracyMatrix`. Player learns: more senses = more accurate but more expensive.

### 7.3 Boss: `hallucination-hunt`

10 clips (one from each theme + 5 hard) shown rapidly. Each AI answer is **confidently wrong**. Player must detect at least 7/10 hallucinations to win. Cinematic edit: each detected hallucination triggers a freeze-frame highlight.

### 7.4 Optional: `creative-sandbox`

The **only** phase that touches a live cloud API. Player describes an image; the request is filtered through:

1. **Word-list block** (kid-safe profanity + violence + identity terms)
2. **Topic allow-list** (animals, nature, food, places, robots, only)
3. **Length cap** (≤ 50 words)

If the prompt passes, it's forwarded to the existing `/api/prompt-lab` Anthropic gateway with `{ "image_gen": "imagen-4" }` mode. If the gateway returns flagged content, replace with a placeholder + show "let's try a different prompt" UX.

This phase is **opt-in** behind a parent-permission toggle (existing `child.parental_unlocks` field).

---

## 8. 3D Component Specs

### 8.1 `PixelWitness3D.tsx`

```typescript
'use client';

interface Props {
  clipSrc: string;
  isPlaying: boolean;
  senses: Sense[];           // determines iris-eye dilation
  hallucinationFlash?: boolean; // boss-round flash effect
}

export default function PixelWitness3D({ clipSrc, isPlaying, senses, hallucinationFlash }: Props) {
  return (
    <group>
      <CurvedCinemaScreen src={clipSrc} playing={isPlaying} />
      <AIEye dilation={senses.length / 4} />  {/* iris opens as more senses enabled */}
      <FrameTimeline clipSrc={clipSrc} />     {/* scrolls along the back wall */}
      <FlagshipParticles count={12} color="#10BAD2" />
      {hallucinationFlash && <FlashOverlay />}
    </group>
  );
}
```

D3D-B1 compliant — `<group>` only, no inner `<Canvas>`.

### 8.2 `PixelWitnessEnvironment.tsx`

Edit-bay setting: vintage tape reels, monitors, chair, frame timeline scrolling on a wall.

| Asset | Tris (Ultra) |
|---|---|
| Cinema screen + frame | ~520K |
| Tape reels + spools | ~280K |
| Editor chair + console | ~640K |
| Monitor wall | ~480K |
| Cable bundle | ~190K |
| Volumetric haze | ~430K |
| Floor + base | ~120K |
| **Total** | **~2.7M** |

---

## 9. Registry & Camera Preset

```typescript
const CAMERA_PRESETS = {
  // ...
  'pixel-witness': { position: [0, 1.8, 4], lookAt: [0, 0.5, 0], fov: 44 },
};

{
  id: 38,
  name: 'Pixel Witness',
  slug: 'pixel-witness',
  lab: 7,
  labName: LAB_NAMES[7],
  tier: 'flagship',
  has3D: true,
  component3D: 'PixelWitness3D',
  ageBands: ['A', 'B', 'C'],
  stage: '11C',
  description: 'Watch a clip, ask the AI about it, and catch the lies. Decide which senses it needs.',
  icon: '🎬',
  triangleBudget: budget('flagship', true),
  cameraPreset: cameraPreset('pixel-witness'),
}
```

---

## 10. Acceptance Criteria

- [ ] All 12 phases reachable; report renders.
- [ ] 24 clips load via `<video>` with poster fallback; total bandwidth ≤ 36 MB.
- [ ] All 96 Q-A pairs render with pre-recorded AI answers.
- [ ] Sense Builder loop respects `SENSE_COSTS` and updates AI accuracy from the per-clip matrix.
- [ ] Boss round (`hallucination-hunt`) requires ≥ 7/10 detections to pass.
- [ ] Creative-sandbox phase **opt-in**, gated by parental unlock.
- [ ] Creative-sandbox prompt passes through 3-stage filter (word-list + topic + length).
- [ ] All 3 age bands supported.
- [ ] WebGPU+TSL primary path for cinema-screen shader.
- [ ] All ARIA labels on interactive controls (clip-play, rate buttons, sense toggles).
- [ ] Chrome bezel + LED rim per Frost-Prismatic.
- [ ] AI content slot wired (6 ContentTypes).
- [ ] Estimated TSX lines: **3,000 for `PixelWitnessGame.tsx`**.
- [ ] Build / type / lint PASS.
- [ ] Lighthouse: video playback does not regress LCP > 2.5 s on 3G simulation.
- [ ] Sentry release tag includes `stage-11c-pixel-witness`.

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Clip licensing ambiguity | Each clip's `attributionLicense` field is a build-time required string; CI fails if any clip has an empty license |
| Bandwidth budget on slow networks | All clips ≤ 1.5 MB each; lazy-load via `loading="lazy"` on `<video>`; preload only the next clip |
| Adversarial Q feels frustrating instead of educational | Boss round capped to 10 min; explanatory card after each detection ("here's why the AI was wrong") |
| Creative-sandbox API cost | Capped at 1 invocation per session; results cached in IndexedDB by prompt hash for 24 h |
| Clip player audio leaks before player presses unmute | All clips start muted; explicit unmute button (matches Hero Animation pattern) |

---

## 12. References

- Doc 2 Section G — concept spec
- Doc 1 §5 — Multimodal / VLM research
- `STAGE6F_v3FINAL_*.md` — visual-judgment game pattern (Bias Detective)
- `STAGE6E_v3FINAL_A.md` — D3D-B1 Canvas-coexistence rule
- CLAUDE.md §1.1 — Tech Quality Mandate
- CLAUDE.md §11 — Standard Tier audit precedent for difficulty tags
- Doc 2 §G.11 — pre-recorded AI answers rationale (zero per-prompt cost)

---

*End of STAGE11C_v3FINAL.md.*
