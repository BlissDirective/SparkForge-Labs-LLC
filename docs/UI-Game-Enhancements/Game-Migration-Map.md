# Game Migration Map — Pixi Archetypes, Lab Skins & Enhancements

> **Date:** 2026-06-16
> **Owner doc:** `Fable-Frontend-Enhancement.md` (Phase C → rollout)
> **Companion:** `fable-audit-v1.md`, `Ui-Creation.md` (no-emoji policy)
> **Status:** planning map for the lab-by-lab migration of all 42 games onto the
> `PixiGameStage` shell + the 4 reusable scene archetypes shipped in Phase C.

This is the single reference for **which archetype each game should adopt, what
lab-color skin it inherits, and the per-game enhancements** worth landing during
the migration. It is grounded in the live code: the game registry
(`src/config/gameRegistry.ts`), lab colors (`src/config/labColors.ts`), and each
game's current mechanic (audited 2026-06-16).

---

## 1. The archetype toolkit (Phase C, shipped)

All four live in `src/components/games/pixi/` and mount inside `<PixiGameStage>`.
Load every game's `play` phase via `next/dynamic({ ssr:false })`.

| Code | Archetype (component) | Mechanic | Best for |
|------|----------------------|----------|----------|
| **SORT** | `SortDragScene` | drag tokens into labelled bins | classification, clustering, bucketing, binary judgments |
| **CONNECT** | `ConnectBoardScene` | drag edges between nodes | pipelines, graphs, wiring, sequencing into a structure |
| **REACT** | `ReactionArena` | tap self-spawning targets before they expire | speed, attention, fast judgments, combos |
| **REVEAL** | `RevealMapScene` | tap tiles to uncover what's hidden | discovery, spot-the-X, scan, memory, inspection |

Two non-archetype dispositions also appear in the map:

- **R3F** — keep the existing React-Three-Fiber flagship scene (Phase D upgrades
  it with Blender-MCP assets). The listed archetype is its **2D / mobile-tier
  fallback** (see Mobile Fallback Policy in `CLAUDE.md`).
- **CUSTOM** — bespoke DOM experience that no archetype fits cleanly (debate,
  live API console). Enhance in place; do not force a canvas.

---

## 2. Skinning model — "every lab is a world"

Each game inherits its **lab accent** (hex) as the `labColor` prop on
`<PixiGameStage>` and every scene. That single value already drives bin glow,
node fills, particle bursts, the frame border, and the reaction palette seed.

**Recommended addition (small, high-leverage):** a `labSkin(labColor)` helper
that derives a full per-lab palette (accent, accent-dim, success, particle set)
plus an optional background-art slot, so a "world identity" is one import per
game rather than scattered hexes. Seed it from the canonical table below.

### Canonical lab palette (source of truth: `labColors.ts`)

| Lab | Name | Hex | OKLCH | Family |
|-----|------|-----|-------|--------|
| 1 | What IS AI? | `#0FB8FA` | `oklch(0.75 0.17 225)` | Blue |
| 2 | Teaching Machines | `#B67BFF` | `oklch(0.75 0.19 295)` | Purple |
| 3 | The Brain Inside | `#FF70AF` | `oklch(0.75 0.19 345)` | Pink |
| 4 | AI That Creates | `#D9A430` | `oklch(0.75 0.17 75)` | Amber |
| 5 | AI Helpers | `#00D17A` | `oklch(0.75 0.19 155)` | Green |
| 6 | AI & Ethics | `#FF7050` | `oklch(0.75 0.20 25)` | Red-Orange |
| 7 | Computer Vision | `#10BAD2` | `oklch(0.75 0.14 195)` | Cyan |
| 8 | Words & Language | `#8F96FA` | `oklch(0.75 0.15 275)` | Violet |
| 9 | Build Your AI | `#E68E28` | `oklch(0.75 0.18 50)` | Orange |
| 10 | AI Futures | `#DE5AEA` | `oklch(0.75 0.19 325)` | Fuchsia |
| 11 | Agentic AI | `#6FFFE6` | `oklch(0.85 0.16 175)` | Mint-Cyan |

---

## 3. Lab-by-lab migration map

Legend — **Current:** `QUIZ` = QuizLevelRenderer multiple-choice · `LEVELS` =
GameLevelSystem custom renderer · `3D` = has an R3F scene · `MECHANIC` = already
uses a GameMechanicKit piece.

### Lab 1 — What IS AI? · `#0FB8FA` Blue

| Game | Tier | Current | → Archetype | Key enhancement |
|------|------|---------|-------------|-----------------|
| AI Spy | standard | **DONE (REVEAL)** ✅ | **REVEAL** ✅ | Wave-1 proof. Object tiles shown; tap the ones using AI → signal-pulse + why-card. Hunt replaces the tap-quiz. |
| Time Machine | standard | QUIZ | **SORT** | Era "lanes" as bins; drag each milestone onto its decade. Animated era backdrop shifts as lanes fill. |
| Human vs Machine | standard | LEVELS | **SORT** | Two bins (Human / Machine) with a live tug-of-war meter between them; correct drops pull the rope. |
| Pocket Brain | flagship | LEVELS · 3D | **R3F** (REVEAL fallback) | Keep the in-browser WebGPU LLM. Add a Pixi token-stream overlay so kids *see* tokens generate; mobile fallback = reveal "what the tiny brain knows" tiles. |

### Lab 2 — Teaching Machines · `#B67BFF` Purple

| Game | Tier | Current | → Archetype | Key enhancement |
|------|------|---------|-------------|-----------------|
| Pet Trainer | flagship | LEVELS · 3D | **R3F** | Keep 3D pet. Bind a **Rive** pet face to reward/correct events (closes HS-8). |
| Sort Toy Box | flagship | **DONE (SORT)** | **SORT** ✅ | Reference implementation — the Phase-B/C proof. Next: Scenario sprite set for toys. |
| Treat Trainer | standard | LEVELS | **Phaser-4** (maze) | Genuine tilemap maze + pathfinding (the one game the doc flags for Phaser physics). Reward pellets, dog sprite. |
| Data Detective | fl-lite | QUIZ · 3D | **REVEAL** | Scan a dataset grid; tap to reveal outliers/missing cells (heatmap reveal). Magnifier reticle cursor. |

### Lab 3 — The Brain Inside · `#FF70AF` Pink

| Game | Tier | Current | → Archetype | Key enhancement |
|------|------|---------|-------------|-----------------|
| Neural Builder | flagship | LEVELS · 3D | **R3F** (CONNECT fallback) | Keep 3D net. CONNECT is the exact 2D/mobile archetype: wire neurons across layers; pulse data along edges on "run". |
| Neuron Relay | standard | **DONE (CONNECT)** ✅ | **CONNECT** ✅ | Wave-1 proof. Wire input→hidden→output; correct wires light green, dead-ends red. Pulse-race-on-run = follow-up enhancement. |
| Pixel Investigator | standard | QUIZ | **REVEAL** | Progressive de-pixelation: each correct tap sharpens a region until the image (and how CV "sees" it) resolves. |

### Lab 4 — AI That Creates · `#D9A430` Amber

| Game | Tier | Current | → Archetype | Key enhancement |
|------|------|---------|-------------|-----------------|
| Prompt Lab | flagship | 3D | **R3F** | Keep 3D. Pixi "generation" particle burst when a prompt resolves. |
| Word Predictor | standard | **DONE (REACT)** ✅ | **REACT** ✅ | Wave-3 proof. Candidate next-words rise as cards with probability bars; tap the likeliest before it fades. ReactionArena gained a labeled "card" mode. |
| Token Chopper | standard | **DONE (SORT)** ✅ | **SORT** ✅ | Wave-3 proof. Sort chopped pieces into Word / Subword / Punct / Special token-type bins. (Reuses `PixiBinSortStage`.) |
| AI Art Detective | standard | **DONE (SORT)** ✅ | **SORT** ✅ | Wave-3 proof. Two bins Human-made / AI-made; drop a clue → why-card reveals the artifact. (Reuses `PixiBinSortStage`.) |

### Lab 5 — AI Helpers · `#00D17A` Green

| Game | Tier | Current | → Archetype | Key enhancement |
|------|------|---------|-------------|-----------------|
| Agent Architect | flagship | 3D | **R3F** (CONNECT fallback) | Keep 3D pipeline. CONNECT is the exact 2D archetype: wire perception → reasoning → action modules. |
| Robot Vacuum | fl-lite | LEVELS · 3D | **REVEAL** (or Phaser grid) | Tap/clean dirt tiles on a room grid; show the planned path. Phaser-4 if true pathfinding is wanted. |
| Tool Picker | standard | QUIZ | **SORT** | Drag each real-world problem onto the right AI-tool bin; tool tray with icons. |

### Lab 6 — AI & Ethics · `#FF7050` Red-Orange

| Game | Tier | Current | → Archetype | Key enhancement |
|------|------|---------|-------------|-----------------|
| Bias Detective | flagship | QUIZ · 3D | **R3F** (SORT fallback) | Keep 3D scales. SORT models the scales literally: drop evidence onto two pans and watch them tip toward fair/unfair. |
| Data Shield | standard | **DONE (SORT)** ✅ | **SORT** ✅ | Wave-2 proof. Drag data items into Private / Sensitive / Shareable bins; shield-strength meter rises on correct calls. Generic `PixiBinSortStage` (named bins) extracted. |
| Real or Fake | standard | **DONE (REVEAL)** ✅ | **REVEAL** ✅ | Wave-2 proof. Inspect media snippets; tap the fakes → verdict + the tell revealed. Real items explain why they are trustworthy. |
| Ethics Courtroom | standard | 3D | **CUSTOM** | Debate/decision game — no canvas archetype. Adopt `ChoiceCardDeck` for arguments + a Rive judge that reacts to your case. |

### Lab 7 — Computer Vision · `#10BAD2` Cyan

| Game | Tier | Current | → Archetype | Key enhancement |
|------|------|---------|-------------|-----------------|
| Camera Quest | fl-lite | QUIZ · 3D | **REVEAL** | Viewfinder reticle scans a scene; tap to "capture" the target object and add it to the training set. |
| Fool the AI | standard | QUIZ | **SORT** | Drag perturbation patches/stickers onto image zones; a live confidence meter drops as the classifier gets fooled. |
| Build Classifier | standard | 3D | **SORT** | Drag training examples into class bins; a live accuracy meter rewards balanced, correct labelling. |
| Prediction Market | standard | QUIZ | **SORT** | Allocate prediction tokens across outcome bins; odds bars animate; resolve against "crowd wisdom". |
| Pixel Witness | flagship | QUIZ · 3D | **R3F** (REVEAL fallback) | Keep 3D edit-bay. REVEAL fits the 2D path: step frames, toggle senses, reveal where the AI's account lies. |

### Lab 8 — Words & Language · `#8F96FA` Violet

| Game | Tier | Current | → Archetype | Key enhancement |
|------|------|---------|-------------|-----------------|
| Sentiment Scanner | standard | LEVELS | **SORT** | Drag messages into emotion bins (happy/sad/angry/neutral); an emotion-gradient meter colours the scene. |
| Chatbot Builder | fl-lite | LEVELS · 3D | **CONNECT** | Exact fit: wire dialogue nodes + response branches, then "test-run" a conversation that lights the path taken. |
| Lost in Translation | standard | LEVELS | **CONNECT** | Wire a translation relay (telephone chain); a meaning-drift meter shows how much was lost each hop. |
| Emoji Decoder | fl-lite | QUIZ · 3D | **SORT** | Drag emoji-token tiles into sentence order / onto word mappings; decode reveal animates the sentence. |
| Context Architect | flagship | QUIZ · 3D (+CONNECT bonus) | **R3F** (SORT fallback) | Keep the 3D shelf. SORT models it: drag cards onto/off the shelf within a token-budget meter (Context Rot). |

### Lab 9 — Build Your AI · `#E68E28` Orange

| Game | Tier | Current | → Archetype | Key enhancement |
|------|------|---------|-------------|-----------------|
| Code Blocks | fl-lite | LEVELS · 3D | **CONNECT** | Snap/wire blocks into a program graph (uses `validateCodeSequence`); a run animation steps execution. |
| Career Explorer | standard | LEVELS | **CONNECT** | Match skill ↔ career pairs by drawing links; reveal a career profile card on a correct match. |
| API Explorer | standard | 3D | **CUSTOM** | Real request/response console (band C). Keep DOM; add a Pixi packet animation flying request → API → response. |
| My First AI App | fl-lite | LEVELS · 3D | **CONNECT** | Wire UI components → AI service → output; live mockup preview updates as the graph completes. |

### Lab 10 — AI Futures · `#DE5AEA` Fuchsia

| Game | Tier | Current | → Archetype | Key enhancement |
|------|------|---------|-------------|-----------------|
| Future Forge | fl-lite | LEVELS · 3D | **CONNECT** | Assemble invention modules into a blueprint graph; an impact-simulation gauge scores society effects. |
| AI or Not? | fl-lite | **DONE (REACT)** ✅ | **REACT** ✅ | Wave-1 proof. Timed drill: tap AI "tells" before they vanish; streak/combo builds. Per-level media tells taught as a learn card. |

### Lab 11 — Agentic AI · `#6FFFE6` Mint-Cyan (all flagship 3D)

| Game | Tier | Current | → Archetype | Key enhancement |
|------|------|---------|-------------|-----------------|
| Agent Atelier | flagship | LEVELS · 3D | **R3F** (CONNECT fallback) | Keep 3D atelier. CONNECT is the exact arc-step "Build": wire specialists so each feeds the next, then run. |
| MCP Lab | flagship | QUIZ · 3D | **R3F** (CONNECT/SORT fallback) | "Equip": plug tools into agent sockets (CONNECT) or assign tools to agents (SORT); capability meter grows. |
| Glass Box | flagship | QUIZ · 3D | **R3F** (REVEAL fallback) | "Audit": step the trajectory, reveal each hidden step, flag the buggy one. REVEAL grid = trajectory timeline. |
| Harness Forge | flagship | LEVELS · 3D | **R3F** (SORT fallback) | "Constrain": drag safeguards onto three layers (filter input / validate output / monitor); SORT = three bins. |

---

## 4. Archetype distribution

| Archetype | Count (incl. flagship fallbacks) | Games |
|-----------|------|-------|
| **SORT** | 12 | Time Machine, Human vs Machine, Sort Toy Box ✅, Token Chopper, AI Art Detective, Tool Picker, Data Shield, Fool the AI, Build Classifier, Prediction Market, Sentiment Scanner, Emoji Decoder, (+ Bias Detective, Context Architect, Harness Forge, MCP Lab fallbacks) |
| **CONNECT** | 6 | Neuron Relay, Chatbot Builder, Lost in Translation, Code Blocks, Career Explorer, My First AI App, Future Forge (+ Neural Builder, Agent Architect, Agent Atelier fallbacks) |
| **REVEAL** | 6 | AI Spy, Data Detective, Pixel Investigator, Real or Fake, Camera Quest, Robot Vacuum (+ Pocket Brain, Pixel Witness, Glass Box fallbacks) |
| **REACT** | 2 | Word Predictor, AI or Not? |
| **R3F kept** | 14 | all flagship 3D + 3D fl-lite that earn their scene |
| **CUSTOM** | 2 | Ethics Courtroom, API Explorer |

SORT and REVEAL clear the quiz backlog fastest — they are the right place to
start.

---

## 5. Recommended rollout order

Lab-by-lab, ~4–6 games/week per the Fable plan. Sequenced to **prove each
archetype on a standard game before any flagship leans on it as a fallback**,
and to front-load the flattest quiz games (biggest delight delta).

1. **Wave 1 — prove the remaining 3 archetypes (1 game each). ✅ DONE (2026-06-28)**
   `CONNECT` → Neuron Relay (Lab 3) · `REVEAL` → AI Spy (Lab 1) · `REACT` →
   AI or Not? (Lab 10). All three migrated; build green; reusable
   `PixiRevealStage` / `PixiConnectStage` / `PixiReactStage` wrappers extracted
   for the lab-by-lab rollout. Pending: HS-5 Playwright SSIM ≥ 0.96 visual pass.
2. **Wave 2 — Lab 6 (Ethics) quiz sweep: ✅ DONE (2026-06-28)** Data Shield
   (SORT), Real or Fake (REVEAL) — Data Shield is a 1:1 match to the existing
   mechanic-kit demo. Generic `PixiBinSortStage` (named bins) + `SortDragScene
   binLabels` + `ChipToken` word-wrap extracted for the rollout. Build green;
   HS-5 Playwright visual pass pending.
3. **Wave 3 — Lab 4 (Creates): ✅ DONE (2026-06-28)** Word Predictor (REACT),
   Token Chopper (SORT), AI Art Detective (SORT). ReactionArena extended with a
   labeled "card" mode (word + probability bar) for Word Predictor; both SORT
   games reuse `PixiBinSortStage`. Build green; HS-5 visual pass pending.
4. **Wave 4 — Lab 7 (Vision):** Camera Quest, Fool the AI, Build Classifier,
   Prediction Market.
5. **Wave 5 — Lab 8 (Language):** Sentiment Scanner, Emoji Decoder, Chatbot
   Builder, Lost in Translation.
6. **Wave 6 — Labs 1/3/5/9 remainders:** Time Machine, Human vs Machine,
   Pixel Investigator, Tool Picker, Neuron Relay finish, Code Blocks, Career
   Explorer, My First AI App, Future Forge.
7. **Wave 7 — Treat Trainer (Phaser-4 maze)** — the single Phaser case.
8. **Phase D — flagships:** wire each flagship's archetype as its mobile/2D
   fallback while the R3F scene gets Blender-MCP asset upgrades. Lab 11 last
   (newest, all flagship).

Per-game definition of done: archetype wired · lab skin applied · juice firing
(already inherited via `JuiceProvider`) · keyboard/AT fallback present ·
`window.__SPARKFORGE_GAME__` scene state published · Playwright visual pass at
SSIM ≥ 0.96 · ≤ ~150 kB gz incremental · 60 fps on a school Chromebook.

---

## 6. Cross-cutting enhancements (apply during, not after)

- **Rive companions, per-lab skinned.** The mascot is already wired in
  `JuiceProvider` (placeholder until `public/rive/sparky.riv` lands). Give each
  lab a tinted companion variant via the lab accent; Lab 2 Pet Trainer and Lab 6
  Ethics Courtroom get bespoke reactive characters.
- **Per-lab Tone.js soundscape.** Tone.js is already in the stack; a short
  ambient bed + correct/combo motif keyed to the lab family makes "entering a
  game feel like the cockpit delivered you somewhere".
- **Bonus mechanic rounds.** The `bonusRound` SortingTray hook now lives in
  `QuizLevelRenderer` (3 games wired). Extend a meaningful order-round to the
  rest of the quiz library as each migrates.
- **Lab-world backgrounds.** Scenario-generated, style-locked background art per
  lab, dropped behind the canvas via the `PixiGameStage` frame slot.
- **Age-band feedback config.** Band A = max celebration (confetti, big numbers,
  mascot dance); Band C = speed metrics, streak multipliers, leaderboard deltas.
  Same engine, different presentation — wire as a config on the stage.
- **Dev-hook QA discipline.** Every migrated scene publishes its state to
  `window.__SPARKFORGE_GAME__`; the Playwright loop asserts state textually while
  judging visuals from screenshots (canvas is a11y-opaque).

---

## 7. Status legend

| Mark | Meaning |
|------|---------|
| ✅ | migrated + runtime-proven (Sort Toy Box) |
| **R3F** | keep the 3D flagship scene; archetype is the 2D/mobile fallback |
| **CUSTOM** | no archetype fits; enhance the bespoke experience in place |

*Generated by Claude Code (Fable series). Grounded in `gameRegistry.ts` (42
games), `labColors.ts` (11 labs), and a 2026-06-16 mechanic audit. Archetype
library shipped in Phase C; this map drives the lab-by-lab rollout.*
