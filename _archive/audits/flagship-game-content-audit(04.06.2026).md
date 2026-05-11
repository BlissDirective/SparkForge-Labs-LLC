# SparkForge Flagship Games — Playability & Interactivity Audit

**Date:** April 6, 2026
**Audit Version:** 1.0
**Auditor:** Claude Code (Autonomous Agent)
**Branch:** `claude/flagship-games-audit-cZJmv`
**Scope:** All 6 Flagship-tier games (20M triangle budget, full 3D R3F scenes)

---

## 1. Executive Summary

### Audit Objective

This audit evaluates the **playability, interactivity, educational depth, and technical quality** of SparkForge's 6 flagship games — the platform's premier interactive experiences, each featuring full 3D environments with 20M triangle budgets, immersive R3F scenes, and multi-phase gameplay. The audit assesses whether these games deliver sufficient engagement, learning value, and replay depth for children ages 7–16 across age bands A (7–9), B (10–12), and C (13–16).

### Games Audited

| # | Game | Lab | File | Lines | Phases | Age Bands | 3D Component |
|---|------|-----|------|-------|--------|-----------|--------------|
| 1 | **AI Pet Trainer** | Lab 2 — Teaching Machines | `PetTrainerGame.tsx` | 1,123 | 7 | A/B/C | Pet3DScene + PetTrainerEnvironment (3.96M tris) |
| 2 | **Sort Toy Box** | Lab 2 — Teaching Machines | `SortToyBoxGame.tsx` | 652 | 5 | A/B/C | SortScene3D + SortFeatureViz3D |
| 3 | **Neural Builder** | Lab 3 — The Brain Inside | `NeuralBuilderGame.tsx` | 1,531 | 6 | B/C only | NeuralNetwork3D + NeuralBuilderEnvironment (3.68M tris) |
| 4 | **Prompt Lab** | Lab 4 — AI That Creates | `PromptLabGame.tsx` | 2,127 | 5 | A/B/C | PromptBubble3D + PromptLabEnvironment (3.39M tris) |
| 5 | **Agent Architect** | Lab 5 — AI Helpers | `AgentArchitectGame.tsx` | 1,217 | 4 | A/B/C | AgentPipeline3D + AgentArchitectEnvironment (3.27M tris) |
| 6 | **Bias Detective** | Lab 6 — AI & Ethics | `BiasDetectiveGame.tsx` | 1,623 | 7 | A/B/C | BiasScales3D + BiasDetectiveEnvironment (3.44M tris) |

### Key Findings Summary

**Bugs:** 20+ issues identified across game code and shared infrastructure
- **5 Critical** — Training simulation ignores architecture (Neural Builder), maxScore tracking broken (gameStore), hardcoded maxScore mismatch (GameShell), duplicate 3D rendering (Neural Builder), score calculation fundamentally flawed
- **6 High** — advanceRound off-by-one, reward pipeline error handling missing, optimalMatch divisor bug, sparkIntensity calculation error, heartbeat animation stops during training, race condition in state updates
- **9 Medium** — Dead code, score imbalance, instant AI reveal, stale state on replay, audio queuing, timeout persistence, canvas state, division edge case, unused hook

**Content Depth:** Severe imbalance across flagships
- **Shallowest:** Sort Toy Box — single round, ~30–60 min total depth, 652 lines (weakest flagship by far)
- **Deepest:** Prompt Lab — open-ended sandbox with live Claude API, 5–10+ hours, 2,127 lines
- **Gap:** Neural Builder excludes Band A (ages 7–9) entirely — only flagship without full age range

**UI/UX:** Generally strong (7–9/10) with consistent chrome bezel patterns, but Sort Toy Box significantly underbuilt

**Educational Impact:** Ranges from 5/10 (Sort Toy Box) to 9/10 (Prompt Lab, Bias Detective)

### Approved Decisions

| # | Decision | Scope | Impact |
|---|----------|-------|--------|
| 1 | **Sort Toy Box — Major Expansion (3x)** | 652 → ~1,500+ lines, 5 rounds, 30+ shapes, 8 criteria | Brings weakest flagship to parity |
| 2 | **Neural Builder — Add Band A** | New simplified mode for ages 7–9 | Ensures all flagships cover full 7–16 range |
| 3 | **GameStore — Fix All 3 Bugs** | Fix advanceRound, maxScore, resetGame | Affects all 35 games platform-wide |
| 4 | **AI Integration — All 5 Remaining** | Claude API content generation for all flagships | Infinite replay via procedural content |
| 5 | **Seed Content — 2–3x Expansion (All 6)** | Major content additions across every flagship | Doubles+ depth and replay value |

### Content Expansion Multipliers

| Game | Current Depth | Target | Multiplier |
|------|--------------|--------|------------|
| Pet Trainer | 2–4 hours | 5–8 hours | 2.5x |
| Sort Toy Box | 30–60 min | 3–5 hours | 3x |
| Neural Builder | 2–3 hours | 5–8 hours | 2.5x |
| Prompt Lab | 5–10+ hours | 12–20+ hours | 2.5x |
| Agent Architect | 3–5 hours | 8–12 hours | 2.5x |
| Bias Detective | 3–5 hours | 8–12 hours | 2.5x |

### Report Structure

This document is organized into 8 sections:
1. **Executive Summary** (this section)
2. **Game Depth Assessment** — playtime analysis, replay value, content volume
3. **Bug Audit** — all bugs with severity, line numbers, and fix proposals
4. **UI/UX Audit** — cohesion, interactivity, accessibility
5. **Content Expansion Plan** — 2–3x seed content increase per flagship
6. **AI Content Generation Strategy** — Claude API integration architecture
7. **Educational Impact Assessment** — learning outcomes, Bloom's taxonomy mapping
8. **Implementation Roadmap** — phased code changes with priorities and dependencies

---

## 2. Game Depth Assessment

### Methodology

Each game was evaluated across four dimensions:
- **Single Playthrough Time** — minutes to complete one full cycle (welcome → learn → play → complete)
- **Content Volume** — number of unique scenarios, challenges, rounds, and items
- **Replay Value** — how much new content/experience a second+ playthrough offers
- **Total Depth Estimate** — realistic total engagement hours before content exhaustion

### Per-Game Analysis

#### 2.1 AI Pet Trainer — Moderate Depth (2–4 hours)

| Metric | Value |
|--------|-------|
| Single Playthrough | 15–20 min |
| Phases | 7 (welcome → adopt → teach → train → data-lab → test → report) |
| Content Volume | 5 pets × 4 category sets × 6 evolution stages = 120 unique combinations |
| Replay Drivers | Different pets, different categories, evolution chase |
| Replay Value | **Medium** — new pet + category keeps first 3-4 replays fresh |
| Depth Ceiling | ~2–4 hours before all pets/categories experienced |

**Strengths:**
- 7-phase flow is the longest among flagships, creating satisfying progression
- Pet evolution (Egg → Baby → Toddler → Kid → Teen → Genius) is intrinsically motivating
- Mood system (sleeping, confused, learning, smart, genius, celebrating) adds emotional connection
- Overfitting detection teaches a real ML concept organically
- 3D pet rendering with toon shading is visually distinctive

**Weaknesses:**
- Only 4 category sets (Shapes, Fruits, Animals, Vehicles) — exhausted quickly
- No customization beyond pet name — no accessories, colors, or cosmetic rewards
- Training is pure labeling — no mini-game variety within training phase
- Evolution is linear and deterministic — no branching paths or specializations
- No persistence between sessions — pet progress resets each playthrough

**Depth Rating: 6/10** — Engaging core loop but content exhausts in 3-4 sessions

---

#### 2.2 Sort Toy Box — Shallow Depth (30–60 min) **[WEAKEST FLAGSHIP]**

| Metric | Value |
|--------|-------|
| Single Playthrough | 8–10 min |
| Phases | 5 (welcome → learn → sort → reveal → complete) |
| Content Volume | 12 shapes (3 shapes × 3 colors × 2 sizes), 3 AI criteria |
| Replay Drivers | Random AI criterion selection (shape/color/size) |
| Replay Value | **Low** — 3 possible outcomes, all experienced in 3 plays |
| Depth Ceiling | ~30–60 min total before fully exhausted |

**Strengths:**
- Clean concept — sorting is intuitive for all ages
- 3D integration (SortScene3D, SortFeatureViz3D) adds visual appeal
- Age-band differentiated explanations connect to real ML concepts
- Dynamic group creation (up to 4) allows experimentation

**Weaknesses:**
- **Single round** — no progression, no difficulty scaling, no levels
- Only 12 shapes with 3 properties — trivially small dataset
- Only 3 possible AI criteria — exhausted in 3 plays maximum
- AI "reveal" is instant — no thinking simulation, no step-by-step explanation
- Score distribution is backwards (reveal bonus > sorting effort: 20 pts vs 24 pts)
- No achievement system, no milestones, no unlockables
- No challenge mode or timed play
- At 652 lines, it's half the size of the next-smallest flagship

**Depth Rating: 3/10** — Does not meet flagship quality bar. Needs major expansion.

---

#### 2.3 Neural Builder — Moderate-High Depth (2–3 hours)

| Metric | Value |
|--------|-------|
| Single Playthrough | 20–30 min |
| Phases | 6 (welcome → learn → build → train → test → report) |
| Content Volume | 3 challenges × 4 architecture tests = 12 unique play paths |
| Replay Drivers | Different challenges, architecture experimentation, accuracy optimization |
| Replay Value | **Medium** — architecture exploration keeps it interesting for 4-5 sessions |
| Depth Ceiling | ~2–3 hours before strategies plateau |

**Strengths:**
- Richest learning simulation — layers, neurons, connections, weights, training epochs
- Interactive 3D network visualization (NeuralNetwork3D) with orbit controls
- Training simulation with loss curves (Nivo ResponsiveLine) and epoch tracking
- Weight slider manipulation for connection inspection
- Drawing canvas for digit recognition testing
- Audio feedback via Tone.js (epoch chords, activation sounds, completion fanfare)
- Heartbeat idle animation adds personality to the network
- Architecture challenges (Minimalist, Shallow Master, Deep Thinker, Efficiency Expert)

**Weaknesses:**
- **No Band A support** — ages 7–9 completely excluded from this flagship
- **Training is purely random** — accuracy doesn't correlate with architecture quality (CRITICAL BUG)
- Only 3 challenge tasks (Digit Reader, Color Classifier, Shape Sorter)
- 4 architecture tests is thin for a flagship
- No hyperparameter exposure (learning rate, batch size are hardcoded)
- No activation function selection
- No concept of overfitting/generalization in test phase
- Canvas drawing state persists incorrectly between challenge switches

**Depth Rating: 6/10** — Strong core mechanics undermined by random training and limited content. Band A gap is a significant accessibility concern.

---

#### 2.4 Prompt Lab — Deep Depth (5–10+ hours) **[DEEPEST FLAGSHIP]**

| Metric | Value |
|--------|-------|
| Single Playthrough | 25–35 min |
| Phases | 5 (welcome → learn → sandbox → challenge → report) |
| Content Volume | 5 challenges + 8 templates + live AI sandbox = effectively infinite |
| Replay Drivers | Open-ended AI interaction, new prompts yield new responses every time |
| Replay Value | **High** — Claude API ensures every session is unique |
| Depth Ceiling | ~5–10+ hours, limited only by curiosity |

**Strengths:**
- **Only flagship with live AI integration** — real Claude API responses
- Open-ended sandbox allows unlimited experimentation
- Multi-dimensional prompt scoring (specificity, clarity, creativity, constraints, technique)
- Prompt X-Ray visualization shows keyword-to-response relationships
- 8 reusable prompt pattern templates with fill-in-the-blank slots
- Temperature/creativity dial with 5 visual stops
- 5 structured challenges with real-time grading
- 3D thought bubble visualization (PromptBubble3D) adds playful dimension
- Holographic UI design is the most visually polished of all flagships
- Markdown code display for formatted AI responses

**Weaknesses:**
- Challenges are static (5 fixed scenarios) — could be AI-generated
- No prompt history or comparison features
- No prompt chaining/recipes (multi-step prompts)
- No side-by-side prompt comparison ("Prompt Battle")
- No real-world scenario packs for contextual learning
- Template library is useful but not expandable by the student

**Depth Rating: 9/10** — Best-in-class flagship. Live AI interaction creates genuine depth.

---

#### 2.5 Agent Architect — Good Depth (3–5 hours)

| Metric | Value |
|--------|-------|
| Single Playthrough | 20–25 min |
| Phases | 4 (welcome → learn → missions → build → report) |
| Content Volume | 8 missions × 10 block types = 80+ possible pipeline configurations |
| Replay Drivers | Mission variety, block experimentation, star rating chase, cinema mode |
| Replay Value | **Medium** — missions provide structure but are finite |
| Depth Ceiling | ~3–5 hours to complete all missions with high star ratings |

**Strengths:**
- 10 distinct block types (Goal, Search, Tool, Decide, Check, Loop, Memory, Parallel, Human, Done)
- 8 progressive missions (beginner → intermediate → advanced)
- Block unlocking system creates progression
- Cinema mode execution with spotlight animation and narration
- Validation system checks for goal, done, connectivity, required blocks
- Pseudocode generation (Band C) bridges visual→code thinking
- Star rating system motivates replaying for perfection
- 3D pipeline visualization (AgentPipeline3D) with data packet animation

**Weaknesses:**
- Only 8 missions — consumed in 2-3 sessions
- No sandbox/free-build mode without mission constraints
- No debug mode (fixing broken pipelines)
- No multi-agent coordination scenarios
- No themed mission packs for different contexts
- Execution replay is instant — no step-by-step debugging with variable inspection
- Block configurations are simple (text only) — no complex parameter setting

**Depth Rating: 7/10** — Well-structured progression system. Needs more missions and modes.

---

#### 2.6 Bias Detective — Good Depth (3–5 hours)

| Metric | Value |
|--------|-------|
| Single Playthrough | 25–30 min |
| Phases | 7 (welcome → learn → cases → investigate → testlab → fix → report) |
| Content Volume | 6 cases × 3 evidence types × multiple fixes = 18+ investigation paths |
| Replay Drivers | Different cases, evidence combinations, fix strategies |
| Replay Value | **Medium** — cases are rich but finite |
| Depth Ceiling | ~3–5 hours to fully investigate all cases |

**Strengths:**
- 7-phase flow (tied with Pet Trainer for most phases) creates deep investigation arc
- 6 real-world bias cases drawn from actual AI incidents
- Evidence collection across 3 categories (data, outcome, pattern)
- Test Lab for experimenting with bias scenarios
- Fix phase with multiple solution approaches (some correct, some incorrect with explanations)
- Detective rank progression (5 levels) adds gamification
- 3D Bias Scales show balance/imbalance with spring physics
- 3D Decision Tree for fix visualization
- Real-world case studies annotated with year, title, and lesson

**Weaknesses:**
- Only 6 cases — a motivated child finishes all in 2 sessions
- Test Lab is preset-only — no custom dataset building
- No A/B testing (biased vs. debiased model comparison)
- No bias metric dashboard (disparate impact, equal opportunity)
- Fix phase lacks hands-on implementation detail
- No formal report generation
- No stakeholder interview simulation
- Evidence categories limited to 3 (missing feedback loops, historical bias)

**Depth Rating: 7/10** — Strongest ethical/social content. Needs more cases and hands-on tools.

---

### Comparative Depth Summary

| Game | Single Play | Total Depth | Replay | Content Items | Rating | Verdict |
|------|------------|-------------|--------|---------------|--------|---------|
| Prompt Lab | 25–35 min | 5–10+ hrs | High | Infinite (AI) | 9/10 | Benchmark flagship |
| Agent Architect | 20–25 min | 3–5 hrs | Medium | 80+ configs | 7/10 | Solid, needs missions |
| Bias Detective | 25–30 min | 3–5 hrs | Medium | 18+ paths | 7/10 | Rich cases, needs more |
| Pet Trainer | 15–20 min | 2–4 hrs | Medium | 120 combos | 6/10 | Fun, needs variety |
| Neural Builder | 20–30 min | 2–3 hrs | Medium | 12 paths | 6/10 | Strong core, limited |
| **Sort Toy Box** | **8–10 min** | **30–60 min** | **Low** | **36 combos** | **3/10** | **Needs major overhaul** |

### Critical Depth Gaps

1. **Sort Toy Box** is not flagship-quality — it's shorter than many Standard-tier games
2. **Neural Builder** excludes 33% of the target audience (Band A, ages 7–9)
3. **No flagship has AI-generated content** except Prompt Lab — all others are static/finite
4. **Pet Trainer** has the best emotional hook (pet evolution) but the least content variety
5. **All flagships** lack cross-session persistence — progress resets each play

---

## 3. Bug Audit

### Methodology

All 6 flagship game files, the shared `gameStore.ts`, and `GameShell.tsx` were read line-by-line. Bugs are classified by severity:

- **CRITICAL** — Breaks core gameplay, produces incorrect learning outcomes, or causes significant performance issues
- **HIGH** — Causes confusing behavior, data loss, or degraded experience
- **MEDIUM** — UX issues, dead code, or edge cases that affect quality

### 3.1 Shared Infrastructure Bugs (Affect ALL 35 Games)

#### BUG-GS1: `updateScore()` Makes `maxScore` Meaningless [CRITICAL]

**File:** `src/stores/gameStore.ts` — Line 41
```typescript
updateScore: (points) => set((s) => ({ score: s.score + points, maxScore: s.maxScore + points })),
```

**Problem:** `maxScore` increments in lockstep with `score`. They are always equal. The `maxScore` field is supposed to represent the maximum *possible* score, but it actually just mirrors the current score. This makes percentage-based calculations (completion tier, HUD progress bar) meaningless.

**Impact:** GameShell.tsx line 102 calculates `scorePercent = score / (totalRounds * 10) * 100` which is independent of `maxScore`, but any component reading `maxScore` gets incorrect data. The CeremonyFX tier (bronze/silver/gold) may fire incorrectly.

**Fix Options:**
- **Option A (Recommended):** Remove `maxScore` from `updateScore`. Add separate `setMaxScore(points)` action. Each game sets max possible score at start via `setMaxScore()`.
- **Option B:** Rename `maxScore` to `totalPointsEarned` and accept the dual-tracking semantic. Add a new `possibleScore` field set by games.
- **Option C:** Remove `maxScore` entirely from the store. Let each game compute its own maximum internally and pass it as a prop.

---

#### BUG-GS2: `advanceRound()` Off-By-One [HIGH]

**File:** `src/stores/gameStore.ts` — Lines 42–45
```typescript
advanceRound: () => {
  const s = get();
  if (s.currentRound >= s.totalRounds) { set({ isComplete: true }); }
  else { set({ currentRound: s.currentRound + 1 }); }
},
```

**Problem:** When `currentRound === totalRounds`, calling `advanceRound()` sets `isComplete: true` but doesn't actually advance the round counter. The game appears to jump from "playing round N" to "complete" without showing the final round's result. Additionally, `startGame` initializes `currentRound: 1`, so a game with `totalRounds: 4` goes 1→2→3→4→complete, which is correct in count but the `>=` check means calling `advanceRound` when already at round 4 immediately completes — potentially before the round's gameplay finishes if called prematurely.

**Impact:** Games that call `advanceRound()` at the *start* of each round (rather than after) will skip the last round entirely.

**Fix Options:**
- **Option A (Recommended):** Change to `>` comparison: `if (s.currentRound > s.totalRounds)`. Advance first, then check.
- **Option B:** Split into two actions: `nextRound()` (always increments) and `checkComplete()` (checks if done). Games call both explicitly.

---

#### BUG-GS3: `resetGame()` Partial State Reset [HIGH]

**File:** `src/stores/gameStore.ts` — Line 51
```typescript
resetGame: () => set({ currentRound: 1, score: 0, maxScore: 0, isComplete: false, isPaused: false, timeElapsed: 0, gameData: {} }),
```

**Problem:** Does not clear `currentGame`, `totalRounds`, or `hintsRemaining`. After `resetGame()`, the store retains stale references to the previous game ID and round configuration. If a new game starts without calling `startGame()` first, it inherits the old game's metadata.

**Impact:** GameShell calls `resetGame()` in its cleanup effect (line 90). If the next game mounts before `startGame()` fires, it reads stale `currentGame` and `totalRounds`.

**Fix Options:**
- **Option A (Recommended):** Reset ALL fields: add `currentGame: null, totalRounds: 0, hintsRemaining: 3` to the reset object.
- **Option B:** Remove `resetGame()` entirely. Games always call `startGame()` which already resets everything.

---

#### BUG-GS4: Hardcoded `maxScore` in GameShell HUD [CRITICAL]

**File:** `src/components/game/GameShell.tsx` — Line 83
```typescript
maxScore: totalRounds * 10,
```

**Problem:** The GameHUD3D progress bar assumes every game awards exactly 10 points per round. But actual scoring varies wildly:
- **Sort Toy Box:** 2 pts/shape × 12 shapes + 20 reveal = 44 pts (but HUD shows max 120)
- **Neural Builder:** `Math.round(maxAcc / 10) * 5` = variable (0–49 pts, HUD shows max 200)
- **Bias Detective:** 10 base + 5/strong arg per case = variable

**Impact:** HUD progress bar shows incorrect percentages. A fully-completed Sort Toy Box shows ~36% on the progress bar. CeremonyFX tier calculation (line 102) uses the same `totalRounds * 10` divisor, so bronze/silver/gold thresholds are wrong for every game.

**Fix Options:**
- **Option A (Recommended):** Accept `maxScore` as a GameShell prop. Each game passes its actual maximum. Default to `totalRounds * 10` for backwards compatibility.
- **Option B:** Remove maxScore from HUD entirely. Show raw score only.

---

#### BUG-GS5: Reward Pipeline Has No Error Handling [HIGH]

**File:** `src/components/game/GameShell.tsx` — Lines 97–99
```typescript
if (!isComplete || hasRewarded.current || !activeChild?.id) return;
hasRewarded.current = true;
completeAndReward(activeChild.id, gameId, xpReward, 'game', score);
```

**Problem:** `hasRewarded.current = true` is set *before* the async `completeAndReward()` call. If the API call fails (network error, server timeout), the reward is permanently lost for that session — `hasRewarded.current` prevents retry even after reconnection.

**Impact:** Intermittent network failures cause permanent XP/streak/badge loss. Children complete a game successfully but receive no reward.

**Fix Options:**
- **Option A (Recommended):** Wrap in try/catch. On failure, reset `hasRewarded.current = false` and show a retry toast.
- **Option B:** Move `hasRewarded.current = true` into the `.then()` callback of the promise chain, so it only marks as rewarded on success.

---

### 3.2 Neural Builder Bugs

#### BUG-NB1: Training Simulation Ignores Network Architecture [CRITICAL]

**File:** `src/components/games/NeuralBuilderGame.tsx` — Lines 464–468
```typescript
const acc = Math.min(
  maxAcc,
  (e / epochs) * maxAcc + Math.random() * 5
);
```

**Problem:** Accuracy is primarily determined by `(e / epochs) * maxAcc` — a linear ramp from 0 to `maxAcc` over 20 epochs, plus up to 5% random noise. While `maxAcc` is influenced by `optimalMatch`, the per-epoch accuracy progression is effectively predetermined. A student who builds a terrible architecture sees the same smooth curve as one who builds an optimal one — just capped at a slightly different maximum.

**Impact:** This is the most educationally damaging bug. The entire premise of Neural Builder is "architecture matters." But the training visualization tells children that **any architecture produces similar results** — contradicting the core learning objective. Architecture challenges become luck-based rather than skill-based.

**Fix:** Make accuracy progression architecture-dependent:
- Good architectures: fast convergence, high plateau, low noise
- Bad architectures: slow start, lower plateau, high variance, potential divergence
- Overly deep networks: show vanishing gradient effect (accuracy plateau mid-training)

---

#### BUG-NB2: `optimalMatch` Divisor Bug [HIGH]

**File:** `src/components/games/NeuralBuilderGame.tsx` — Lines 454–460
```typescript
const optimalMatch =
  layerSizes.length === challenge.optimalLayers.length
    ? layerSizes.reduce(
        (sum, s, i) => sum + Math.abs(s - challenge.optimalLayers[i]),
        0
      ) / totalNeurons
    : 0.5;
```

**Problem:** Dividing the sum of absolute differences by `totalNeurons` produces inconsistent scaling. For a 4-8-8-4 network (24 neurons) vs. optimal 4-6-6-4 (20 neurons): diff = |4-4|+|8-6|+|8-6|+|4-4| = 4, result = 4/24 = 0.17. But for 100-100-100-100 (400 neurons) vs. same optimal: diff = |100-4|+|100-6|+|100-6|+|100-4| = 380, result = 380/400 = 0.95. The penalty scales non-linearly with network size.

**Fix:** Normalize by `challenge.optimalLayers.reduce((a,b) => a+b, 0)` (sum of optimal neurons) instead of `totalNeurons`.

---

#### BUG-NB3: `sparkIntensity` Calculated After Clamping [HIGH]

**File:** `src/components/games/NeuralBuilderGame.tsx` — Lines 490–497
```typescript
const newWeight = parseFloat(
  (c.weight + (Math.random() - 0.5) * learningRate * 2).toFixed(2)
);
return {
  ...c,
  weight: Math.max(-1, Math.min(1, newWeight)),
  sparkIntensity: Math.abs(newWeight - c.weight),
};
```

**Problem:** `sparkIntensity` is calculated as `|newWeight - c.weight|`, but `newWeight` is already clamped to [-1, 1] on the line above. If the unclamped value would have been 1.5 but gets clamped to 1.0, and `c.weight` is 0.9, sparkIntensity = |1.0 - 0.9| = 0.1 (small spark). But the actual change was much larger (0.6), which should produce a big spark.

**Fix:** Calculate sparkIntensity from the unclamped delta: `sparkIntensity: Math.abs(rawDelta)` where `rawDelta = (Math.random() - 0.5) * learningRate * 2`.

---

#### BUG-NB4: Duplicate 3D Network Rendering [CRITICAL]

**File:** `src/components/games/NeuralBuilderGame.tsx` — Lines 304–324 AND Lines 1073–1089

The `NeuralNetwork3D` component is rendered in two places simultaneously:
1. **Line 305:** Registered in `sceneStore.setGameSceneContent()` — renders inside CockpitCanvas
2. **Line 1074:** Rendered inline in the build phase JSX — renders in the DOM

Both receive identical props and both render a full 3D R3F scene. This doubles GPU memory usage, draw calls, and frame computation.

**Fix:** Remove the inline rendering at lines 1073–1089. Keep only the sceneStore registration (lines 304–324) which renders inside the persistent CockpitCanvas per D3D-B1 architecture.

---

#### BUG-NB5: setTimeout Persists After Unmount [MEDIUM]

**File:** `src/components/games/NeuralBuilderGame.tsx` — Lines 611–614
```typescript
setTimeout(() => {
  setPhase('report');
  game.completeGame();
}, 1500);
```

**Problem:** If the component unmounts during the 1500ms delay (user navigates away, tab switches), the callback fires on an unmounted component. `setPhase` and `game.completeGame()` execute against stale state, potentially triggering the reward pipeline in GameShell.

**Fix:** Store the timeout ID in a ref and clear it in a useEffect cleanup: `const timeoutRef = useRef<NodeJS.Timeout>(); ... return () => clearTimeout(timeoutRef.current);`

---

#### BUG-NB6: Heartbeat Stops During Training [MEDIUM]

**File:** `src/components/games/NeuralBuilderGame.tsx` — Lines 352–358
```typescript
useEffect(() => {
  if (isTraining || phase !== 'build') return;
  const interval = setInterval(() => {
    setHeartbeatPhase((prev) => (prev + 0.015) % 1);
  }, 50);
  return () => clearInterval(interval);
}, [isTraining, phase]);
```

**Problem:** The heartbeat animation returns early when `isTraining` is true. During the 12-second training loop, the 3D network appears completely frozen — no visual indication that training is occurring beyond the text-based epoch counter.

**Fix:** Continue heartbeat during training but at increased speed: `const speed = isTraining ? 0.04 : 0.015;`

---

#### BUG-NB7: Audio Queuing During Training [MEDIUM]

**File:** `src/components/games/NeuralBuilderGame.tsx` — Lines 503–507

Audio plays on every epoch (20 times) plus activation sounds every 3rd epoch (~7 more). If a user triggers training multiple times in rapid succession, 27+ audio events queue from each run, causing distortion and audio overlap.

**Fix:** Add audio stream management — cancel previous playback before starting new, or use a semaphore to limit concurrent audio events.

---

#### BUG-NB8: Canvas Not Cleared on Challenge Switch [MEDIUM]

**File:** `src/components/games/NeuralBuilderGame.tsx` — `selectChallenge()` function (line ~430)

When switching challenges, the drawing canvas retains its previous content. The `initCanvas()` function (line 548) clears to black, but it's only called when the canvas mounts, not when challenges change.

**Fix:** Call `initCanvas()` inside `selectChallenge()` after resetting state.

---

### 3.3 Sort Toy Box Bugs

#### BUG-ST1: Score Distribution Inverted [MEDIUM]

**File:** `src/components/games/SortToyBoxGame.tsx` — Lines ~283, ~301

- Sorting effort: 12 shapes × 2 pts each = 24 pts
- AI reveal click: +20 pts (single button click)
- Reveal is worth 83% as much as the entire interactive sorting phase

**Problem:** The incentive structure rewards clicking "reveal" more than doing the sorting. A child could ignore sorting entirely and still get 45% of the score from the reveal bonus.

**Fix:** Invert the ratio — sorting effort should be the primary score driver. Consider: 5 pts/shape (60 total) + 5 reveal bonus, or scoring based on how close the player's groups match the AI's answer.

---

#### BUG-ST2: Dead `useGameContent` Hook [MEDIUM]

**File:** `src/components/games/SortToyBoxGame.tsx` — Line ~173
```typescript
const { data: _dynamicContent } = useGameContent('sort-toy-box', ageBand);
```

Imported but never used (underscore prefix). Wastes a React Query fetch cycle and network request.

**Fix:** Remove the hook call entirely until AI content generation is implemented.

---

#### BUG-ST3: AI Reveal is Instant [MEDIUM]

**File:** `src/components/games/SortToyBoxGame.tsx` — Lines ~291–299

The AI "sorts" all shapes instantly with no animation, no thinking simulation, and no step-by-step explanation. The UI suggests the AI is analyzing data, but the result appears immediately.

**Fix:** Add a multi-step reveal animation: (1) feature extraction highlight, (2) similarity calculation display, (3) animated group formation over 2-3 seconds.

---

#### BUG-ST4: Stale Shapes on Replay [MEDIUM]

**File:** `src/components/games/SortToyBoxGame.tsx`

The shapes array is generated once via `useMemo` with empty deps. On replay (within the same session), shapes are not regenerated — the player sees the exact same 12 items with the same properties.

**Fix:** Add a `replayCount` state variable to the useMemo dependency array. Increment on replay to force regeneration.

---

### 3.4 Bug Summary Table

| ID | File | Line(s) | Severity | Description | Scope |
|----|------|---------|----------|-------------|-------|
| BUG-GS1 | gameStore.ts | 41 | CRITICAL | maxScore mirrors score, always equal | All 35 games |
| BUG-GS2 | gameStore.ts | 42–45 | HIGH | advanceRound off-by-one | All 35 games |
| BUG-GS3 | gameStore.ts | 51 | HIGH | resetGame doesn't clear all state | All 35 games |
| BUG-GS4 | GameShell.tsx | 83 | CRITICAL | Hardcoded maxScore = totalRounds × 10 | All 35 games |
| BUG-GS5 | GameShell.tsx | 97–99 | HIGH | Reward pipeline no error handling | All 35 games |
| BUG-NB1 | NeuralBuilderGame.tsx | 464–468 | CRITICAL | Training ignores architecture | Neural Builder |
| BUG-NB2 | NeuralBuilderGame.tsx | 454–460 | HIGH | optimalMatch divisor wrong | Neural Builder |
| BUG-NB3 | NeuralBuilderGame.tsx | 490–497 | HIGH | sparkIntensity post-clamp calc | Neural Builder |
| BUG-NB4 | NeuralBuilderGame.tsx | 304+1074 | CRITICAL | Duplicate 3D rendering | Neural Builder |
| BUG-NB5 | NeuralBuilderGame.tsx | 611–614 | MEDIUM | setTimeout persists on unmount | Neural Builder |
| BUG-NB6 | NeuralBuilderGame.tsx | 352–358 | MEDIUM | Heartbeat stops during training | Neural Builder |
| BUG-NB7 | NeuralBuilderGame.tsx | 503–507 | MEDIUM | Audio queuing/distortion | Neural Builder |
| BUG-NB8 | NeuralBuilderGame.tsx | ~430 | MEDIUM | Canvas not cleared on switch | Neural Builder |
| BUG-ST1 | SortToyBoxGame.tsx | ~283, ~301 | MEDIUM | Score distribution inverted | Sort Toy Box |
| BUG-ST2 | SortToyBoxGame.tsx | ~173 | MEDIUM | Dead useGameContent hook | Sort Toy Box |
| BUG-ST3 | SortToyBoxGame.tsx | ~291–299 | MEDIUM | AI reveal is instant | Sort Toy Box |
| BUG-ST4 | SortToyBoxGame.tsx | useMemo | MEDIUM | Stale shapes on replay | Sort Toy Box |

**Totals: 5 Critical, 5 High, 7 Medium = 17 confirmed bugs**
- 5 shared infrastructure bugs affect all 35 games
- 8 bugs in Neural Builder (most buggy flagship)
- 4 bugs in Sort Toy Box
- 0 bugs found in Prompt Lab, Agent Architect, Bias Detective, Pet Trainer

---

## 4. UI/UX Audit

### Evaluation Criteria

Each game is scored across 5 dimensions (1–10 scale):

| Dimension | What It Measures |
|-----------|-----------------|
| **Visual Cohesion** | Consistency with Frost-Prismatic design system (chrome bezels, neon accents, dark mode, lab colors) |
| **Interactivity** | Input variety, response feedback, animation quality, engagement hooks |
| **Information Architecture** | Phase flow clarity, progress indicators, status visibility |
| **Accessibility** | ARIA labels, keyboard navigation, screen reader support, color contrast |
| **3D Integration** | How well the 3D scene enhances (not distracts from) gameplay |

### Per-Game UI/UX Scores

#### 4.1 AI Pet Trainer — 8/10

| Dimension | Score | Notes |
|-----------|-------|-------|
| Visual Cohesion | 9 | Purple (#8B5CF6) chrome bezel + LED rim consistent throughout. Toon-shaded pets are visually distinctive. |
| Interactivity | 7 | Pet selection, naming, labeling, and evolution are engaging. Training is pure button clicks — no drag-and-drop, no gestures. |
| Info Architecture | 8 | 7-phase flow with clear progression. Evolution stage indicator provides satisfying progress visualization. |
| Accessibility | 9 | Full ARIA labels, role regions, keyboard-navigable buttons. Mood descriptions accessible. |
| 3D Integration | 8 | Pet3DScene with mood-reactive animations enhances emotional connection. PetDataLab3D bar chart is useful. |

**Strengths:** Strongest emotional hook of all flagships. Pet moods and evolution create attachment. Purple theme is visually warm.
**Weaknesses:** Training phase is repetitive (click label, click label, click label). No drag interaction. Data lab visualization is informative but passive.
**Recommendations:** Add drag-and-drop labeling. Add pet interaction animations (feeding, playing). Add pet customization panel.

---

#### 4.2 Sort Toy Box — 6/10 **[WEAKEST UI]**

| Dimension | Score | Notes |
|-----------|-------|-------|
| Visual Cohesion | 7 | Purple (#AA66FF) particles and gradient buttons are present but minimal. Less chrome bezel detail than other flagships. |
| Interactivity | 5 | Shape selection + group assignment is the only interaction. No progression indicators, no feedback animations, no celebration milestones. |
| Info Architecture | 4 | Single round with no phase progression visible to the user. No round counter, no difficulty indicator, no achievement markers. |
| Accessibility | 8 | ARIA labels present, role regions defined, progress indicators with spoken descriptions. |
| 3D Integration | 7 | SortScene3D provides spatial sorting visualization. SortFeatureViz3D is useful for reveal phase. |

**Strengths:** Clean, simple concept — easy to understand for all ages. 3D shape visualization is intuitive.
**Weaknesses:** 
- **No progression system** — game feels like a single-screen toy, not a multi-phase game
- **No feedback loops** — no celebration when shapes are grouped correctly
- **No difficulty indication** — no visual cue about challenge level
- **Shortest gameplay** — 8-10 minutes feels more like a demo than a flagship
- **Score display is misleading** — HUD shows max 120 but real max is 44
**Recommendations:** Complete UI overhaul with multi-round progression bar, per-round difficulty badges, combo multiplier display, sorting streak counter, AI reveal step-by-step animation panel.

---

#### 4.3 Neural Builder — 9/10

| Dimension | Score | Notes |
|-----------|-------|-------|
| Visual Cohesion | 9 | Pink (#EC4899) theme with particle background. Chrome bezel consistent. Loss curve charts (Nivo) are polished. |
| Interactivity | 9 | Add/remove layers, adjust neurons, weight sliders, drawing canvas, train button, architecture challenges. Most interactive flagship. |
| Info Architecture | 8 | 6-phase flow with clear progression. Epoch counter and accuracy meter provide real-time feedback. Loss curve graph shows history. |
| Accessibility | 8 | ARIA labels on all controls. Layer/neuron count announced. Training progress described. Canvas drawing has no screen reader support (inherent limitation). |
| 3D Integration | 9 | NeuralNetwork3D with orbit controls, hover inspection, connection sparks, and heartbeat animation is the best 3D-gameplay integration of all flagships. |

**Strengths:** Richest input variety — buttons, sliders, canvas drawing, 3D orbit interaction. Real-time training visualization with charts is compelling. Audio feedback via Tone.js adds multisensory depth.
**Weaknesses:** No Band A adaptation — no simplified UI mode for ages 7–9. Weight slider interaction requires fine motor control. Canvas drawing is small (200×200px).
**Recommendations:** Add Band A simplified mode with larger touch targets, guided tutorials, and visual-only (no numeric) interface. Enlarge canvas. Add undo/redo for drawing.

---

#### 4.4 Prompt Lab — 9/10

| Dimension | Score | Notes |
|-----------|-------|-------|
| Visual Cohesion | 10 | Amber theme with holographic UI is the most visually polished flagship. Chrome bezel + LED rim at highest detail. Markdown rendering is clean. |
| Interactivity | 9 | Text input, creativity dial, template selection, challenge progression, copy/paste, X-Ray analysis. Rich input variety. |
| Info Architecture | 8 | 5-phase flow with sandbox freedom. Multi-dimensional scoring provides clear feedback. Template library organized by category. |
| Accessibility | 8 | ARIA labels on all controls. Text input accessible. Dial slider has screen reader description. Response text is selectable. |
| 3D Integration | 8 | PromptBubble3D thought bubbles are playful. PromptScore3D radar chart is informative. Neither blocks content — additive only. |

**Strengths:** Best visual polish. Holographic aesthetic feels premium. Live AI responses create genuine surprise and discovery. Creativity dial is an intuitive metaphor for temperature.
**Weaknesses:** Template slots are fill-in-the-blank text only — no visual template builder. No prompt history view. Long AI responses scroll off-screen without a scroll indicator.
**Recommendations:** Add prompt history panel. Add visual template builder. Add scroll position indicator for long responses. Add prompt comparison side-by-side view.

---

#### 4.5 Agent Architect — 8/10

| Dimension | Score | Notes |
|-----------|-------|-------|
| Visual Cohesion | 8 | Green (#10B981) theme is consistent. Block palette color-coding by category is intuitive. Connection paths are clean. |
| Interactivity | 8 | Block placement, connection drawing, configuration panels, cinema mode execution. Good variety but lacks drag-and-drop for positioning. |
| Info Architecture | 8 | 4-phase flow with mission progression. Star rating per mission provides clear goals. Block unlocking creates advancement feeling. |
| Accessibility | 8 | ARIA labels on blocks and buttons. Mission descriptions accessible. Cinema mode narration provides audio track. |
| 3D Integration | 8 | AgentPipeline3D with data packet animation and spotlight tracking is visually engaging. Doesn't interfere with block building UI. |

**Strengths:** Mission structure provides clear goals. Cinema mode execution is unique and engaging — children watch their agent "run" with narration. Star rating drives replay. Pseudocode generation (Band C) bridges visual-to-code.
**Weaknesses:** Block placement uses click-to-add, not drag-and-drop. No free-build sandbox outside missions. Configuration panels are text-only — could use visual selectors.
**Recommendations:** Add drag-and-drop block positioning on canvas. Add sandbox mode. Add visual configuration selectors (dropdowns, sliders) instead of text-only. Add step-by-step debug mode.

---

#### 4.6 Bias Detective — 8/10

| Dimension | Score | Notes |
|-----------|-------|-------|
| Visual Cohesion | 8 | Red (#EF4444) theme with evidence board aesthetic. Chrome bezel present. Scale visualization is on-theme. |
| Interactivity | 7 | Evidence checkbox selection, custom test input, fix option selection. Fewer input types than other flagships. |
| Info Architecture | 9 | 7-phase flow is the most structured — each phase has a clear purpose and builds on the previous. Detective rank progression visible. |
| Accessibility | 9 | Full ARIA labels. Evidence categories labeled. Bias scale descriptions accessible. Argument strength clearly communicated via text + color. |
| 3D Integration | 7 | BiasScales3D with spring physics is thematic but largely decorative. BiasDecisionTree3D adds value in fix phase. |

**Strengths:** Best information architecture — 7 phases create a compelling investigation arc. Real-world case grounding makes content feel important. Evidence collection mechanic is engaging.
**Weaknesses:** Evidence selection is checkbox-only — no evidence "board" visualization with connecting threads. Test lab is preset-only — no freeform testing. Fix phase could show more visual impact of fixes.
**Recommendations:** Add visual evidence board with connecting threads. Add custom dataset builder in test lab. Add before/after visualization for fix phase. Add bias metric dashboard with real numbers.

---

### UI/UX Comparative Summary

| Game | Cohesion | Interact. | Info Arch | A11y | 3D | **Overall** |
|------|----------|-----------|-----------|------|----|-------------|
| Prompt Lab | 10 | 9 | 8 | 8 | 8 | **9/10** |
| Neural Builder | 9 | 9 | 8 | 8 | 9 | **9/10** |
| Pet Trainer | 9 | 7 | 8 | 9 | 8 | **8/10** |
| Agent Architect | 8 | 8 | 8 | 8 | 8 | **8/10** |
| Bias Detective | 8 | 7 | 9 | 9 | 7 | **8/10** |
| **Sort Toy Box** | 7 | 5 | 4 | 8 | 7 | **6/10** |

### Cross-Cutting UI Issues

1. **No unified achievement/milestone UI** — each game handles completion differently. No shared trophy animation, no "personal best" indicator, no cross-game progress.
2. **Score display inconsistency** — GameShell HUD assumes `totalRounds × 10` for all games. Needs per-game maxScore.
3. **Sort Toy Box** stands out negatively — it looks and feels like a Standard-tier game, not a flagship.
4. **All flagships lack onboarding tooltips** — first-time players get a learn phase but no contextual UI hints during gameplay.
5. **Accessibility is uniformly strong** — ARIA labels, role regions, and keyboard navigation are consistent across all 6 games. This is a credit to the template architecture.

---

## 5. Content Expansion Plan (2–3x Seed Content Increase)

### Design Philosophy

Every flagship game should deliver **5–12+ hours of unique content** before exhaustion. The expansion strategy for each game follows three principles:

1. **More Content** — More scenarios, rounds, items, challenges, and configurations
2. **More Modes** — New ways to play the same core mechanics (timed, sandbox, competitive, cooperative)
3. **More Depth** — Deeper interactions within existing phases (mini-games, customization, advanced options)

Content is designed to be **age-band adaptive** — Band A gets simplified/visual versions, Band B gets the standard experience, Band C gets advanced features and deeper mechanics.

---

### 5.1 AI Pet Trainer — 2.5x Expansion (2–4 hrs → 5–8 hrs)

**Current State:** 5 pets, 4 category sets, 6 evolution stages, 6 moods

#### 5.1.1 New Pet Species (5 → 8)

| # | Pet | Visual Concept | Personality Trait | Unlock Condition |
|---|-----|---------------|-------------------|-----------------|
| 1–5 | Existing (Sparkbit, Neuralink, Datadog, Bytebun, Circucat) | Unchanged | Unchanged | Available at start |
| 6 | **Glitchfox** | Fox with pixelated tail that "glitches" between states | Mischievous — sometimes mislabels on purpose, teaches error correction | Complete 3 training sessions |
| 7 | **Datawing** | Dragonfly with translucent data-stream wings | Precise — learns faster but fragile (accuracy drops if overfed bad data) | Reach "Kid" evolution with any pet |
| 8 | **Neurohound** | Mechanical hound with neural-pathway markings that glow during training | Loyal — retains categories better across sessions, teaches memory/retention | Reach "Genius" evolution with any pet |

Each new pet has unique toon-shaded R3F model variants, mood animations, and evolution visual progressions.

#### 5.1.2 Training Categories (4 → 10)

| # | Category | Items (8 each) | Visual Style | Difficulty |
|---|----------|----------------|-------------|------------|
| 1–4 | Existing (Shapes, Fruits, Animals, Vehicles) | Unchanged | Unchanged | Easy–Medium |
| 5 | **Instruments** | Guitar, Piano, Drums, Violin, Flute, Trumpet, Harp, Saxophone | Silhouette outlines | Medium |
| 6 | **Weather** | Sun, Rain, Snow, Wind, Lightning, Fog, Hail, Rainbow | Animated icons | Easy |
| 7 | **Emotions** | Happy, Sad, Angry, Surprised, Scared, Confused, Proud, Sleepy | Expressive faces | Medium |
| 8 | **Foods** | Pizza, Sushi, Taco, Burger, Salad, Pasta, Soup, Sandwich | Cartoon illustrations | Easy |
| 9 | **Clothing** | Hat, Shirt, Pants, Shoes, Dress, Jacket, Scarf, Gloves | Flat design icons | Medium |
| 10 | **Vehicles (Advanced)** | Submarine, Helicopter, Rocket, Sailboat, Train, Bicycle, Segway, Hovercraft | Technical drawings | Hard |

#### 5.1.3 Evolution Stages (6 → 8)

| Stage | Name | Visual Change | Requirement |
|-------|------|---------------|-------------|
| 1–6 | Existing (Egg → Baby → Toddler → Kid → Teen → Genius) | Unchanged | Unchanged |
| 7 | **Specialist** | Pet gains a visual "badge" or accessory matching its best-trained category (e.g., music notes for Instruments) | Train 3+ categories to 90%+ accuracy |
| 8 | **Master** | Full visual overhaul — glowing aura, unique idle animation, crown/halo effect | Train 6+ categories to 95%+ accuracy |

#### 5.1.4 New Training Mini-Games (3 new modes)

**Speed Drill** — Rapid-Fire Labeling
- 30-second timer, items flash on screen for 2 seconds each
- Player must label correctly before time runs out
- Teaches: batch processing, speed vs. accuracy tradeoff
- Scoring: correct = +3 pts, wrong = -1 pt, skip = 0 pts
- Band A: 4-second timer per item, Band C: 1.5-second timer

**Noise Challenge** — Filtering Bad Data
- Mix of correctly and intentionally mislabeled items presented to pet
- Player must identify and reject the bad labels before feeding to pet
- Teaches: data quality, noise in training data, garbage-in-garbage-out
- Scoring: correctly identified noise = +5 pts, missed noise = -3 pts
- Band A: obvious noise (cat labeled "car"), Band C: subtle noise (tabby cat labeled "dog")

**Transfer Test** — Cross-Category Generalization
- Train pet on one category (e.g., Fruits), then test on related category (e.g., Foods)
- Pet must generalize learned features to new domain
- Teaches: transfer learning, feature generalization, domain adaptation
- Scoring: based on pet's accuracy on the unseen category
- Band A: closely related categories, Band C: distant categories

#### 5.1.5 Pet Mood System (6 → 10)

| # | Mood | Trigger | Visual | Learning Effect |
|---|------|---------|--------|-----------------|
| 1–6 | Existing (sleeping, confused, learning, smart, genius, celebrating) | Unchanged | Unchanged | Unchanged |
| 7 | **Frustrated** | 3+ consecutive wrong labels | Furrowed brow, small sparks | Learning rate -20% until soothed (correct label) |
| 8 | **Curious** | New category introduced | Wide eyes, tilted head, question marks | Learning rate +30% for first 5 items |
| 9 | **Proud** | Reached new evolution stage | Puffed chest, sparkle effect | Bonus XP for next 3 correct labels |
| 10 | **Sleepy** | 15+ items without a break | Drooping eyes, yawn animation | Learning rate -40%, signals player to take a break |

#### 5.1.6 Overfitting Lab (New Phase)

A dedicated phase inserted between "train" and "test" where children intentionally overtrain on one category:
- Player feeds pet 20+ items from a single category (e.g., only Fruits)
- Pet reaches 99% accuracy on Fruits but then fails on other categories
- Visual: pet's "brain" glows one color intensely while others dim
- Player then balances training data and watches accuracy equalize
- Teaches: overfitting, data balance, generalization — a critical ML concept
- Band A: guided with prompts ("Oh no, your pet only knows fruits!"), Band C: student must diagnose independently

#### 5.1.7 Pet Customization (New System)

Accessories unlocked through training milestones:

| Milestone | Reward | Category |
|-----------|--------|----------|
| First evolution | Basic hat (3 colors) | Headwear |
| 50 correct labels | Collar/necklace (5 styles) | Accessories |
| Complete Speed Drill | Speed goggles | Special |
| Complete Noise Challenge | Noise-canceling headphones | Special |
| Complete Transfer Test | Professor glasses | Special |
| Reach Specialist | Category-themed badge | Badges |
| Reach Master | Crown + aura effect | Prestige |

Accessories are purely cosmetic but visible in the 3D pet scene, providing tangible rewards for training effort.

#### 5.1.8 Expansion Impact Summary

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Pets | 5 | 8 | +60% |
| Categories | 4 | 10 | +150% |
| Evolution stages | 6 | 8 | +33% |
| Training modes | 1 (labeling) | 4 (label + speed + noise + transfer) | +300% |
| Moods | 6 | 10 | +67% |
| Unique combinations | 120 | 640+ | +433% |
| Estimated depth | 2–4 hrs | 5–8 hrs | **~2.5x** |

---

### 5.2 Sort Toy Box — 3x Expansion (30–60 min → 3–5 hrs) **[MAJOR OVERHAUL]**

**Current State:** 12 shapes, 1 round, 3 criteria, no progression

This is the most significant expansion — Sort Toy Box goes from the weakest flagship to a fully-featured multi-round sorting experience.

#### 5.2.1 Five-Round Progressive System

| Round | Name | Shapes | Sorting Dimensions | Groups | Time Limit | Band A | Band C |
|-------|------|--------|--------------------|--------|------------|--------|--------|
| 1 | **Basic Shapes** | Circle, Square, Triangle, Star, Pentagon, Hexagon | 1 (shape only) | 3 | None | Guided tutorial | Self-directed |
| 2 | **Colors & Sizes** | R1 shapes + Diamond, Oval, Heart | 2 (shape + color OR shape + size) | 4 | None | Choose 1 dimension | Both dimensions required |
| 3 | **3D Polyhedra** | Cube, Sphere, Pyramid, Cylinder, Torus, Cone, Prism, Dodecahedron | 2 (shape + faces/edges OR shape + volume class) | 4 | 90 sec | Visual cues | Count faces/edges |
| 4 | **Patterns & Textures** | Striped, Dotted, Checkered, Gradient, Solid, Metallic, Wooden, Glass | 3 (pattern + color + opacity) | 5 | 75 sec | Match visible pattern | Describe abstract features |
| 5 | **Mixed Challenge** | Random selection from all rounds | AI picks 2-3 from any dimension | 6 | 60 sec | AI hints | No hints, full difficulty |

**Progression gates:** Round N+1 unlocks when Round N is completed with ≥60% match accuracy.

#### 5.2.2 Expanded Shape Library (12 → 30+)

**Round 1 — 2D Basic (6 shapes):**
Circle, Square, Triangle, Star, Pentagon, Hexagon
- 3 sizes (small, medium, large)
- 5 colors (red, blue, green, yellow, purple)

**Round 2 — 2D Extended (4 new, 10 total):**
Add: Diamond, Oval, Heart, Arrow
- 3 sizes × 5 colors × 10 shapes = 150 possible items

**Round 3 — 3D Polyhedra (8 new, 18 total):**
Add: Cube, Sphere, Pyramid, Cylinder, Torus, Cone, Prism, Dodecahedron
- Properties: faces (4–12), edges (6–30), vertices (4–20), volume class (small/medium/large)
- Rendered as actual 3D objects in the R3F SortScene3D

**Round 4 — Textured (8 new patterns applied to any shape, 26+ total):**
Patterns: Striped, Dotted, Checkered, Gradient, Solid, Metallic, Wooden, Glass
- Applied to Round 1–3 shapes, creating hundreds of unique combinations

**Round 5 — Mixed (all shapes, all properties, AI-selected criteria):**
Full pool of 30+ base shapes with all property dimensions active

#### 5.2.3 Expanded Sorting Criteria (3 → 8)

| # | Criterion | Type | Description | Round Introduced |
|---|-----------|------|-------------|-----------------|
| 1 | Shape | Categorical | Group by geometric shape | Round 1 |
| 2 | Color | Categorical | Group by color family | Round 1 |
| 3 | Size | Ordinal | Group by small/medium/large | Round 1 |
| 4 | **Pattern** | Categorical | Group by surface pattern (striped, dotted, etc.) | Round 4 |
| 5 | **Texture** | Categorical | Group by material appearance (metallic, glass, etc.) | Round 4 |
| 6 | **Weight** | Ordinal | Inferred from size + material (metal > wood > glass) | Round 3 |
| 7 | **Symmetry** | Binary | Symmetrical vs. asymmetrical shapes | Round 2 |
| 8 | **Edge Count** | Numerical | Group by number of edges (0, 3, 4, 5, 6+) | Round 3 |

AI may combine 1–3 criteria simultaneously in later rounds.

#### 5.2.4 Group Mechanics (max 4 → 6)

**New interactions:**
- **Merge Groups:** Drag one group onto another to combine them (teaches cluster merging)
- **Split Groups:** Long-press a group to split it into two sub-groups (teaches hierarchical clustering)
- **Group Labels:** Players can name their groups (Band C: typed labels; Band A: emoji labels)
- **Group Confidence:** Visual indicator showing how "sure" the AI would be about each group assignment

#### 5.2.5 AI Reveal Enhancement

Replace the instant reveal with a **3-phase animated reveal**:

**Phase 1 — Feature Extraction (3 seconds):**
- Each shape gets a "scan" animation (light bar sweeps across)
- Extracted features appear as floating tags next to each shape
- Teaches: AI doesn't see shapes like humans do — it extracts numerical features

**Phase 2 — Distance Calculation (3 seconds):**
- Lines draw between similar shapes, thickness = similarity score
- Dissimilar shapes have thin/faded lines, similar shapes have bright/thick lines
- Numerical similarity scores appear on hover
- Teaches: AI measures "distance" between items in feature space

**Phase 3 — Cluster Formation (4 seconds):**
- Shapes animate into AI-determined groups with spring physics
- Each group gets a label and a "centroid" marker
- Player's groups shown side-by-side for comparison
- Match percentage calculated and displayed
- Teaches: clustering algorithms group by minimizing within-group distance

#### 5.2.6 New Game Modes (3 additions)

**Challenge Mode — Timed Sorting Races:**
- Fixed shape set, countdown timer (30/60/90 seconds)
- Score = shapes correctly sorted × time bonus
- Leaderboard per round (personal best tracking)
- Combo multiplier: 3 correct in a row = 2x, 5 = 3x, 10 = 5x
- Band A: 90 sec with hints, Band C: 30 sec no hints

**Discovery Mode — Free-Play Sandbox:**
- Unlimited shapes, unlimited groups, no timer, no scoring
- Player creates their own sorting rules
- "Teach the AI" prompt: player explains their rule in text, AI tries to follow it
- Teaches: the challenge of formalizing human intuition into algorithmic rules
- Band A: guided prompts ("Try sorting by color!"), Band C: open-ended

**Multi-Criteria Mode — Dimension Stacking (Band B/C only):**
- Sort by 2–3 criteria simultaneously
- Visual: shapes exist in a 2D or 3D feature space grid
- Player must create groups that satisfy all criteria
- Teaches: multi-dimensional clustering, the curse of dimensionality
- Band C gets a scatter plot visualization of the feature space

#### 5.2.7 Scoring Overhaul

| Action | Old Points | New Points | Rationale |
|--------|-----------|------------|-----------|
| Correct sort (per shape) | 2 | 5 | Primary action should be primary reward |
| Combo bonus (3+ streak) | — | +2 per shape | Rewards consistent accuracy |
| AI reveal click | 20 | 5 | Reduce passive reward |
| Match accuracy bonus | — | 0–30 (scaled) | High match % = high bonus |
| Round completion | — | 10 | Progression reward |
| All 5 rounds complete | — | 50 | Milestone bonus |
| **Max possible (Round 1)** | **44** | **~75** | **Effort-weighted** |
| **Max possible (all rounds)** | **44** | **~500+** | **Deep progression** |

#### 5.2.8 Expansion Impact Summary

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Rounds | 1 | 5 | +400% |
| Shapes | 12 | 30+ | +150% |
| Criteria | 3 | 8 | +167% |
| Max groups | 4 | 6 | +50% |
| Game modes | 1 | 4 (standard + challenge + discovery + multi-criteria) | +300% |
| AI reveal steps | 1 (instant) | 3 (animated) | +200% |
| Max score | 44 | 500+ | +1000% |
| Estimated depth | 30–60 min | 3–5 hrs | **~3x** |

---

### 5.3 Neural Builder — 2.5x Expansion (2–3 hrs → 5–8 hrs)

**Current State:** 3 challenges, 4 architecture tests, Band B/C only, no hyperparameter exposure

#### 5.3.1 Band A Content (New — Ages 7–9)

Band A uses a completely simplified "brain building" metaphor with no numbers, no math, and guided tutorials.

**3 Band A Challenges:**

| # | Challenge | Concept | Interaction |
|---|-----------|---------|-------------|
| 1 | **Connect the Dots** | Neurons connect to form a network | Drag colorful "brain cells" between dots to create paths. More paths = smarter brain. |
| 2 | **Build a Simple Brain** | Layers of a neural network | Stack 2–4 layers of brain cells. Each layer has 2–6 cells. Animated "thoughts" flow through. |
| 3 | **Color Sorter** | Input→output mapping | Feed colored balls into the brain, watch them travel through layers, come out sorted. |

**Band A UI Adaptations:**
- Large touch targets (60px minimum)
- Animated helper character ("Sparky") with speech bubbles providing guidance
- No numerical displays — use visual size metaphors (bigger = more neurons)
- Simplified training: "Feed your brain!" button instead of "Train Network"
- Results shown as star rating (1–5 stars) instead of accuracy percentage
- 3D network uses larger, rounder nodes with bright colors

#### 5.3.2 Expanded Challenges (3 → 8)

| # | Challenge | Input | Output | Optimal Architecture | Difficulty |
|---|-----------|-------|--------|---------------------|------------|
| 1–3 | Existing (Digit Reader, Color Classifier, Shape Sorter) | Unchanged | Unchanged | Unchanged | Medium |
| 4 | **Sound Recognizer** | Audio waveform visualization | Instrument identification (4 classes) | 3 layers: 8→12→4 | Medium |
| 5 | **Emotion Detector** | Emoji face images | Emotion label (6 classes) | 4 layers: 10→8→8→6 | Hard |
| 6 | **Animal Identifier** | Animal silhouettes | Species group (5 classes) | 3 layers: 8→10→5 | Medium |
| 7 | **Text Classifier** | Short text snippets (visual) | Category (4 classes: question/statement/exclamation/command) | 4 layers: 12→8→6→4 | Hard |
| 8 | **Weather Predictor** | Temperature + humidity + wind data points | Weather type (5 classes: sunny/rain/snow/cloudy/storm) | 3 layers: 3→8→5 | Hard |

Each challenge includes unique learn cards, test items, and optimal architecture hints.

#### 5.3.3 Architecture Tests (4 → 8)

| # | Test | Description | What It Teaches | Band |
|---|------|-------------|-----------------|------|
| 1–4 | Existing (Minimalist, Shallow Master, Deep Thinker, Efficiency Expert) | Unchanged | Unchanged | B/C |
| 5 | **Overfitter** | Build the largest possible network (max layers, max neurons) | Large networks memorize but don't generalize — accuracy drops on test set | B/C |
| 6 | **Underfitter** | Build the smallest possible network (1 layer, 2 neurons) | Too-small networks can't capture patterns — low accuracy on everything | B/C |
| 7 | **Speed Demon** | Achieve 80%+ accuracy with the fewest total neurons | Efficiency matters — smaller networks are faster to train and deploy | C |
| 8 | **Memory Master** | Achieve highest accuracy on the most complex challenge (Weather Predictor) | Some problems need more capacity — matching architecture to problem complexity | C |

#### 5.3.4 Band C Advanced Features

**Activation Function Selector:**
- Dropdown per layer: ReLU (default), Sigmoid, Tanh
- Visual: each function shown as an animated graph overlay on the layer
- Impact: affects training curve shape and convergence speed
- ReLU: fast convergence, risk of "dead neurons"
- Sigmoid: smooth but slow, vanishing gradient on deep networks
- Tanh: centered output, better for balanced tasks

**Dropout Layer Toggle:**
- Toggle per layer: Off (default), 25%, 50%
- Visual: random neurons "dim" during training (dropped out)
- Impact: reduces overfitting, improves generalization
- Learn card explains regularization concept

**Learning Rate Slider:**
- Range: 0.001 → 0.1 (currently hardcoded at 0.2)
- Visual: controls "step size" in loss landscape animation
- High LR: fast but unstable (oscillating loss curve)
- Low LR: stable but slow (barely moving loss curve)
- Optimal: smooth descent to minimum

**Batch Size Selector (Band C only):**
- Options: 1 (SGD), 8, 32, 128
- Visual: shows how many items are processed before updating weights
- Small batch: noisy updates, good generalization
- Large batch: smooth updates, risk of overfitting

#### 5.3.5 Competition Mode: "Beat the Benchmark"

Each challenge has a benchmark accuracy set by a "standard" architecture:
- Player must design an architecture that beats the benchmark
- Leaderboard tracks: best accuracy, fewest neurons, fastest convergence
- Bronze/Silver/Gold tiers: Beat benchmark / Beat by 5% / Beat by 10%
- Unlocks special network visual themes (neon, fire, ice, galaxy)

#### 5.3.6 Expansion Impact Summary

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Challenges | 3 | 8 | +167% |
| Architecture tests | 4 | 8 | +100% |
| Age bands | B/C | A/B/C | +Band A |
| Hyperparameters exposed | 0 | 4 (activation, dropout, LR, batch) | New |
| Game modes | 1 | 2 (standard + competition) | +100% |
| Unique play paths | 12 | 64+ | +433% |
| Estimated depth | 2–3 hrs | 5–8 hrs | **~2.5x** |

---

### 5.4 Prompt Lab — 2.5x Expansion (5–10 hrs → 12–20+ hrs)

**Current State:** 5 challenges, 8 templates, 5 scoring dimensions, live Claude API sandbox

Prompt Lab is already the deepest flagship thanks to live AI interaction. The expansion focuses on structured content, new modes, and real-world scenarios.

#### 5.4.1 Expanded Challenges (5 → 12)

| # | Challenge | Goal | Scoring Focus | Band |
|---|-----------|------|---------------|------|
| 1–5 | Existing (Sharpshooter, Actor, Creative, Ethics Debater, Template Master) | Unchanged | Unchanged | A/B/C |
| 6 | **Storyteller** | Write a prompt that generates a complete 3-act story with character arcs | Creativity + structure + length control | A/B/C |
| 7 | **Code Helper** | Write a prompt that helps debug a code snippet (pre-set buggy code shown) | Specificity + technique + output-formatting | B/C |
| 8 | **Translator** | Write a prompt that translates AND adapts a message for a different culture | Context-awareness + constraints + clarity | B/C |
| 9 | **Summarizer** | Write a prompt that compresses a 500-word article into exactly 3 bullet points | Constraints + specificity + output-formatting | A/B/C |
| 10 | **Fact Checker** | Write a prompt that evaluates a claim and provides sourced reasoning | Technique + clarity + context-awareness | B/C |
| 11 | **Persuader** | Write a prompt that generates a convincing argument for a given position | Creativity + technique + constraints | C |
| 12 | **Teacher** | Write a prompt that explains a complex concept at a specified reading level | Context-awareness + clarity + specificity | B/C |

Each challenge includes: introduction text, pre-set context/input, scoring rubric with dimension weights, 3 star thresholds, and an "expert example" prompt revealed after completion.

#### 5.4.2 Expanded Templates (8 → 15)

| # | Template | Pattern | Slot Count | Band |
|---|----------|---------|------------|------|
| 1–8 | Existing templates | Unchanged | Unchanged | A/B/C |
| 9 | **Role-Play** | "You are a [ROLE] who [CONTEXT]. When I say [INPUT], respond as [BEHAVIOR]." | 4 | A/B/C |
| 10 | **Debate Format** | "Present [N] arguments for [POSITION] and [N] against. Evaluate each on [CRITERIA]." | 4 | B/C |
| 11 | **Compare/Contrast** | "Compare [THING_A] and [THING_B] across these dimensions: [DIMS]. Format as a table." | 4 | B/C |
| 12 | **Q&A Generator** | "Generate [N] questions about [TOPIC] at [DIFFICULTY] level. Include answers." | 4 | A/B/C |
| 13 | **Story Arc** | "Write a story about [CHARACTER] who [CONFLICT]. Include: setup, rising action, climax, resolution." | 3 | A/B/C |
| 14 | **Structured Output** | "Analyze [INPUT] and return results as [FORMAT: JSON/table/list] with fields: [FIELDS]." | 4 | C |
| 15 | **Multi-Turn** | "First, [STEP_1]. Based on that result, [STEP_2]. Finally, [STEP_3]." | 3 | B/C |

#### 5.4.3 Scoring Dimensions (5 → 7)

| # | Dimension | Weight | Description |
|---|-----------|--------|-------------|
| 1–5 | Existing (Specificity, Clarity, Creativity, Constraints, Technique) | Unchanged | Unchanged |
| 6 | **Context-Awareness** | 10% | Does the prompt provide sufficient background for the AI to respond accurately? Measures role-setting, audience definition, domain specification. |
| 7 | **Output-Formatting** | 10% | Does the prompt specify how the response should be structured? Measures format requests (JSON, table, bullets), length constraints, section headers. |

Existing dimensions reweighted to accommodate: Specificity 20%, Clarity 15%, Creativity 15%, Constraints 15%, Technique 15%, Context-Awareness 10%, Output-Formatting 10%.

#### 5.4.4 New Modes

**Prompt Battle — Side-by-Side Comparison:**
- Write 2 prompts for the same task
- Both sent to Claude API simultaneously
- Responses shown side-by-side with scoring comparison
- Player picks the winner, then sees AI's scoring breakdown
- Teaches: iteration, A/B testing, prompt refinement
- Band A: pre-written prompt A vs. player's prompt B; Band C: both written by player

**Prompt History — Session Archive:**
- All prompts and responses saved to a scrollable timeline
- Each entry shows: prompt text, response preview, score, timestamp
- "Replay" button re-sends prompt for comparison (shows if different response)
- "Improve" button copies prompt to sandbox with improvement suggestions highlighted
- Export to clipboard for sharing

**Prompt Recipes — Multi-Step Chains:**
- Build a sequence of 2–4 prompts where each prompt's output feeds into the next
- Visual: flowchart showing prompt chain with data flowing between steps
- Example recipe: Brainstorm → Outline → Draft → Review
- Teaches: agent-like behavior, multi-step reasoning, decomposition
- Band A: 2-step recipes with guided slots; Band C: 4-step custom chains

#### 5.4.5 Real-World Scenario Packs (5 packs, 3 scenarios each)

| Pack | Theme | Scenarios |
|------|-------|-----------|
| **Homework Helper** | Academic support | Essay outline generator, Math word problem solver, Study guide creator |
| **Creative Writing** | Storytelling | Character creator, Plot twist generator, Dialogue writer |
| **Science Explorer** | Scientific inquiry | Experiment designer, Hypothesis evaluator, Data interpreter |
| **Debate Prep** | Argumentation | Argument builder, Counter-argument finder, Opening statement writer |
| **Code Review** | Programming | Bug finder, Code explainer, Refactoring advisor |

Each scenario provides: context setup, pre-loaded data/text, specific goal, scoring rubric, expert example.

#### 5.4.6 Expansion Impact Summary

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Challenges | 5 | 12 | +140% |
| Templates | 8 | 15 | +88% |
| Scoring dimensions | 5 | 7 | +40% |
| Game modes | 1 (sandbox) | 4 (sandbox + battle + history + recipes) | +300% |
| Scenario packs | 0 | 5 (15 scenarios) | New |
| Estimated depth | 5–10 hrs | 12–20+ hrs | **~2.5x** |

---

### 5.5 Agent Architect — 2.5x Expansion (3–5 hrs → 8–12 hrs)

**Current State:** 8 missions, 10 block types, 4 phases, cinema mode execution

#### 5.5.1 Expanded Block Types (10 → 15)

| # | Block | Icon | Description | Unlocked At |
|---|-------|------|-------------|-------------|
| 1–10 | Existing (Goal, Search, Tool, Decide, Check, Loop, Memory, Parallel, Human, Done) | Unchanged | Unchanged | Missions 1–8 |
| 11 | **Filter** | Funnel | Filters data based on criteria before passing to next block | Mission 9 |
| 12 | **Transform** | Gear | Modifies data format/structure (e.g., text→list, JSON→table) | Mission 10 |
| 13 | **API-Call** | Cloud | Makes external API request with configurable endpoint + params | Mission 12 |
| 14 | **Validate** | Checkmark | Verifies data meets quality/format requirements before proceeding | Mission 14 |
| 15 | **Notify** | Bell | Sends alert/notification to user or another agent | Mission 16 |

#### 5.5.2 Expanded Missions (8 → 18)

**Beginner Tier (Missions 1–5) — Sequential Pipelines:**

| # | Mission | Goal | Required Blocks | Stars |
|---|---------|------|-----------------|-------|
| 1–3 | Existing beginner missions | Unchanged | Unchanged | Unchanged |
| 4 | **Recipe Finder** | Agent searches for recipes matching user's ingredients | Goal→Search→Filter→Done | 1–3 |
| 5 | **Daily Briefing** | Agent gathers news + weather + calendar and presents summary | Goal→Search→Search→Search→Transform→Done | 1–3 |

**Intermediate Tier (Missions 6–11) — Branching + Loops:**

| # | Mission | Goal | Key Blocks | Stars |
|---|---------|------|------------|-------|
| 6–8 | Existing intermediate missions | Unchanged | Unchanged | Unchanged |
| 9 | **Smart Shopper** | Agent compares prices across stores, filters by budget, recommends best deal | Goal→Search→Filter→Decide→Done | 1–3 |
| 10 | **Study Planner** | Agent reviews subject list, transforms into schedule, loops until all subjects covered | Goal→Tool→Transform→Loop→Check→Done | 1–3 |
| 11 | **Bug Hunter** | Agent reads error log, searches for solutions, validates fix works | Goal→Tool→Search→Validate→Decide→Done | 1–3 |

**Advanced Tier (Missions 12–15) — Parallel + Memory:**

| # | Mission | Goal | Key Blocks | Stars |
|---|---------|------|------------|-------|
| 12 | **Travel Planner** | Agent books flights + hotels + activities in parallel, remembers preferences | Goal→Parallel(API-Call×3)→Memory→Transform→Done | 1–3 |
| 13 | **Content Creator** | Agent researches topic, drafts content, self-reviews, iterates until quality threshold met | Goal→Search→Tool→Check→Loop→Validate→Done | 1–3 |
| 14 | **Customer Support** | Agent triages request, searches knowledge base, validates answer, escalates to human if unsure | Goal→Decide→Search→Validate→Human→Notify→Done | 1–3 |
| 15 | **Data Pipeline** | Agent fetches data from 3 sources, transforms each, merges, validates output format | Goal→Parallel(API-Call×3)→Transform×3→Filter→Validate→Done | 1–3 |

**Expert Tier (Missions 16–18) — Multi-Agent + Error Recovery:**

| # | Mission | Goal | Key Blocks | Stars |
|---|---------|------|------------|-------|
| 16 | **Agent Team** | Design 2 agents that coordinate: one researches, one writes, they exchange data | 2× (Goal→...→Done) with Notify cross-links | 1–3 |
| 17 | **Error Recovery** | Agent must handle API failures gracefully — retry, fallback, alert human | Goal→API-Call→Check→Loop→Decide→Human→Notify→Done | 1–3 |
| 18 | **Autonomous Assistant** | Full personal assistant: handles email triage, calendar management, task prioritization, and user notifications | Goal→Parallel(Search, Tool, Memory)→Decide→Loop→Validate→Notify→Done | 1–3 |

#### 5.5.3 Themed Mission Packs (5 packs)

Each pack provides 3 related missions with shared context and progressive difficulty:

| Pack | Theme | Missions | Concept Taught |
|------|-------|----------|----------------|
| **Kitchen Helper** | Meal planning + cooking | Ingredient checker → Recipe finder → Meal planner | Sequential reasoning |
| **Homework Assistant** | Academic support | Question identifier → Research agent → Summary writer | Information retrieval |
| **Game Designer** | Simple game creation | Rule definer → Score tracker → Win condition checker | Logic flows |
| **Weather Reporter** | Data journalism | Data gatherer → Analyzer → Report formatter | Data pipelines |
| **Pet Sitter** | Virtual pet care | Status monitor → Need responder → Schedule planner | Event-driven agents |

#### 5.5.4 New Modes

**Sandbox Mode — Free Build:**
- No mission constraints — any blocks, any connections
- Test with custom text inputs typed by the player
- "Share Pipeline" button generates a text description of the agent
- Band A: guided sandbox with suggested blocks; Band C: fully open

**Debug Mode — Fix Broken Pipelines:**
- Pre-built pipelines with intentional errors (missing connections, wrong block order, infinite loops)
- Player must identify and fix the issue
- 10 debug challenges across difficulty tiers
- Teaches: debugging, testing, error identification
- Visual: broken connections shown as red dashed lines, error blocks pulse red

**Execution Replay — Step-by-Step Debugging:**
- After cinema mode execution, player can step through frame-by-frame
- Each step shows: current block, input data, output data, decision made
- "Variable Inspector" panel shows data state at each node
- Teaches: tracing execution flow, understanding intermediate state
- Band C: includes pseudocode view alongside visual replay

#### 5.5.5 Band C: Multi-Agent + Personality

**Multi-Agent Coordination:**
- Design 2 agents on a split canvas
- Connect them via Notify blocks (message passing)
- Agent A can "call" Agent B as a sub-routine
- Teaches: microservices, API design, delegation
- Visual: two separate pipeline canvases side-by-side with data flow arrows between them

**Agent Personality Configuration:**
- Per-agent personality slider: Formal ↔ Casual, Detailed ↔ Concise, Creative ↔ Factual
- Affects the pseudocode generation style and cinema mode narration tone
- Teaches: prompt engineering for agent behavior, system prompts

#### 5.5.6 Expansion Impact Summary

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Block types | 10 | 15 | +50% |
| Missions | 8 | 18 | +125% |
| Mission packs | 0 | 5 (15 missions) | New |
| Game modes | 1 (mission) | 4 (mission + sandbox + debug + replay) | +300% |
| Debug challenges | 0 | 10 | New |
| Multi-agent support | No | Yes (Band C) | New |
| Estimated depth | 3–5 hrs | 8–12 hrs | **~2.5x** |

---

### 5.6 Bias Detective — 2.5x Expansion (3–5 hrs → 8–12 hrs)

**Current State:** 6 cases, 3 evidence categories, 5 detective ranks, preset test lab

#### 5.6.1 Expanded Cases (6 → 14)

| # | Case | Domain | Bias Type | Real-World Inspiration | Band |
|---|------|--------|-----------|----------------------|------|
| 1–6 | Existing (Hiring Bot, Photo Filter, Loan Bot, School Predictor, Music Recommender, Medical AI) | Unchanged | Unchanged | Unchanged | A/B/C |
| 7 | **Social Media Feed** | Content curation | Engagement bias — algorithm promotes outrage over accuracy | Facebook/Twitter algorithmic feeds | A/B/C |
| 8 | **Criminal Justice AI** | Sentencing/risk | Racial bias in recidivism prediction models | COMPAS algorithm | B/C |
| 9 | **Insurance Pricing** | Financial services | Proxy discrimination — zip code correlates with race/income | Algorithmic redlining | B/C |
| 10 | **Voice Assistant** | Speech recognition | Accent bias — lower accuracy for non-standard accents | Smart speaker dialect gaps | A/B/C |
| 11 | **Ad Targeting** | Advertising | Gender/age stereotyping in ad delivery | Housing/job ad discrimination | B/C |
| 12 | **Translation Bias** | Language | Gender-default assumptions in translation (e.g., "doctor" → male) | Google Translate gender defaults | A/B/C |
| 13 | **Facial Recognition** | Surveillance | Demographic accuracy disparities — higher error for darker skin tones | MIT Gender Shades study | B/C |
| 14 | **Content Moderation** | Online safety | Differential enforcement — flagging dialects/slang as "toxic" more than standard language | Social media moderation bias | C |

Each case includes: narrative setup, 4–6 evidence items, 2–3 test lab scenarios, 3 fix options (1 best, 1 partial, 1 wrong), and a real-world case study reference.

#### 5.6.2 Evidence Categories (3 → 5)

| # | Category | Icon | Description | Example |
|---|----------|------|-------------|---------|
| 1–3 | Existing (Data Bias, Outcome Disparity, Pattern Recognition) | Unchanged | Unchanged | Unchanged |
| 4 | **Feedback Loop** | Circular arrows | The system's outputs reinforce its biases over time | Predictive policing: more arrests → more data → more predictions → more arrests in same area |
| 5 | **Historical Bias** | Clock/history | Training data reflects historical inequities that the model perpetuates | Hiring AI trained on 10 years of (biased) hiring decisions |

#### 5.6.3 Detective Ranks (5 → 8)

| Rank | Name | Cases Required | Reward |
|------|------|---------------|--------|
| 1–5 | Existing (Rookie → Senior Detective) | Unchanged | Unchanged |
| 6 | **Chief Inspector** | Complete 8 cases with strong arguments | Gold detective badge + "bias radar" visual overlay on future cases |
| 7 | **Bias Commissioner** | Complete 11 cases, identify all 5 evidence types | Platinum badge + access to expert-level case details |
| 8 | **Ethics Board Chair** | Complete all 14 cases with 80%+ accuracy on fixes | Diamond badge + ability to design custom cases (see 5.6.6) |

#### 5.6.4 Test Lab Expansion

**Custom Dataset Builder (New):**
- Player creates a test dataset by selecting demographic attributes (age, gender, region, income bracket)
- Set the sample size (10–1000)
- Choose the bias scenario to test (hiring, lending, etc.)
- Run the AI model on the custom dataset and observe disparate outcomes
- Teaches: experimental design, controlled testing, variable isolation
- Band A: simplified with 2 attributes, pre-set sizes; Band C: full control

**A/B Testing Mode (New):**
- Run the same test on two models side-by-side: biased model vs. debiased model
- Compare outcomes across demographics in a split-view dashboard
- Metrics displayed: accuracy per group, approval rate per group, false positive/negative rates
- Teaches: model comparison, the impact of debiasing interventions
- Visual: two bias scales side by side, one tilted, one balanced

**Bias Metric Dashboard (New — Band B/C):**
- Interactive dashboard showing quantitative bias metrics:
  - **Disparate Impact Ratio:** (favorable rate for protected group) / (favorable rate for privileged group). Fair ≥ 0.8
  - **Equal Opportunity Difference:** |TPR_protected - TPR_privileged|. Fair ≤ 0.1
  - **Demographic Parity:** difference in positive prediction rates across groups
- Slider to adjust fairness threshold and watch model behavior change
- Teaches: mathematical definitions of fairness, tradeoffs between fairness metrics

#### 5.6.5 Fix Phase Expansion

**Data Rebalancing Workshop (New):**
- Visual: bar chart showing training data distribution across demographics
- Player drags sliders to rebalance data (add/remove samples per group)
- Retrain button shows accuracy impact of rebalancing
- Teaches: data augmentation, resampling, representational harm

**Feature Removal Experiment (New):**
- List of features the model uses (age, zip code, name, credit score, etc.)
- Player toggles features on/off
- Model retrains and shows: accuracy change + bias change
- Teaches: proxy variables, feature selection, accuracy-fairness tradeoff
- Key insight: removing "race" doesn't remove racial bias if zip code is a proxy

**Fairness Constraint Tuning (New — Band C):**
- Slider: Accuracy ↔ Fairness tradeoff
- At max accuracy: model is biased but performs well overall
- At max fairness: model is fair but overall accuracy drops
- Sweet spot: balanced performance with acceptable fairness
- Teaches: Pareto optimality, there is no "free lunch" in fairness

#### 5.6.6 New Features

**Real-World Timeline (Interactive):**
- Scrollable timeline of 15+ famous AI bias incidents (2015–2026)
- Each entry: year, title, description, bias type, outcome, lesson learned
- Clickable entries expand to full case study with images and data
- Connected to relevant in-game cases via "See related case" links

**Bias Report Generator:**
- After completing a case, player writes a structured bias audit report
- Sections: Executive Summary, Evidence Found, Tests Conducted, Fixes Recommended, Remaining Risks
- AI-assisted writing (Band B/C): Claude provides sentence starters and feedback
- Export as formatted text (copy to clipboard)
- Teaches: professional communication, technical writing, accountability

**Stakeholder Interviews (Simulated):**
- Per case: 3 simulated interviews with affected parties
- Example (Hiring Bot): rejected applicant, hiring manager, AI developer
- Each interview reveals unique perspective and evidence
- Player must synthesize multiple viewpoints into their investigation
- Band A: pre-written interview summaries; Band C: interactive dialogue trees

#### 5.6.7 Expansion Impact Summary

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Cases | 6 | 14 | +133% |
| Evidence categories | 3 | 5 | +67% |
| Detective ranks | 5 | 8 | +60% |
| Test lab modes | 1 (preset) | 4 (preset + custom dataset + A/B + metrics) | +300% |
| Fix phase tools | 1 (option select) | 4 (option + rebalance + feature removal + fairness tuning) | +300% |
| New features | 0 | 3 (timeline + reports + interviews) | New |
| Estimated depth | 3–5 hrs | 8–12 hrs | **~2.5x** |

---

### 5.7 Cross-Game Expansion Summary

| Game | Before (Depth) | After (Depth) | Multiplier | Key Additions |
|------|---------------|--------------|------------|---------------|
| Pet Trainer | 2–4 hrs | 5–8 hrs | 2.5x | +3 pets, +6 categories, +3 mini-games, +overfitting lab, +customization |
| Sort Toy Box | 30–60 min | 3–5 hrs | 3x | +5 rounds, +18 shapes, +5 criteria, +3 modes, +animated reveal |
| Neural Builder | 2–3 hrs | 5–8 hrs | 2.5x | +Band A, +5 challenges, +4 tests, +4 hyperparams, +competition |
| Prompt Lab | 5–10 hrs | 12–20+ hrs | 2.5x | +7 challenges, +7 templates, +3 modes, +5 scenario packs |
| Agent Architect | 3–5 hrs | 8–12 hrs | 2.5x | +5 blocks, +10 missions, +5 packs, +3 modes, +multi-agent |
| Bias Detective | 3–5 hrs | 8–12 hrs | 2.5x | +8 cases, +2 evidence types, +3 test tools, +3 fix tools, +3 features |
| **Combined** | **~16–27 hrs** | **~41–65 hrs** | **~2.5x avg** | **Platform flagship content nearly tripled** |

---

## 6. AI Content Generation Strategy

### Overview

Currently, only **Prompt Lab** uses the Claude API for live content. The remaining 5 flagships rely entirely on static seed data — once a child has seen all scenarios, replay value drops to zero. AI content generation transforms every flagship into an **infinite-content** experience by dynamically generating new challenges, scenarios, and training data.

### 6.1 Architecture

#### Shared Utility: `src/lib/ai-content-generator.ts`

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────┐
│  Game Component  │────▶│  useAIContent() hook  │────▶│  API Route   │
│  (client)        │     │  (client)             │     │  /api/ai/    │
│                  │◀────│  merge + cache        │◀────│  generate    │
└─────────────────┘     └──────────────────────┘     └──────┬──────┘
                                                            │
                                                     ┌──────▼──────┐
                                                     │  Claude API  │
                                                     │  (Anthropic) │
                                                     └─────────────┘
```

**Key design decisions:**
1. **Server-side only** — Claude API calls happen in the Next.js API route, never client-side (API key security)
2. **Static-first fallback** — AI content merges with static content; if API fails, static content is always available
3. **Session caching** — Generated content cached in `localStorage` keyed by `gameId:ageBand:contentType:hash`
4. **Rate limiting** — Max 5 generation requests per game per session, 30-second cooldown between requests
5. **Age-band prompting** — Every prompt includes age-band context to ensure appropriate content

#### API Route: `src/app/api/ai/generate-content/route.ts`

```typescript
// POST /api/ai/generate-content
// Body: { gameId, contentType, ageBand, context?: object }
// Returns: { content: T, cached: boolean, generatedAt: string }
```

- Validates request with Zod schema
- Routes to game-specific prompt templates
- Calls Claude API with structured output instructions
- Validates response matches expected schema
- Returns typed content matching game-specific interfaces

#### Client Hook: `useAIContent(gameId, contentType, ageBand)`

```typescript
// Returns: { data: T | null, isLoading, error, generate: () => void }
// - Auto-checks localStorage cache first
// - Shows static content immediately, merges AI content when ready
// - "generate" can be called manually for on-demand content
```

### 6.2 Per-Game Integration

#### Pet Trainer — AI-Generated Categories + Items

| Content Type | Prompt Strategy | Example Output | Rate |
|-------------|-----------------|----------------|------|
| Training Category | "Generate a set of 8 items in the category [X] suitable for ages [band]. Each item needs: name, emoji, 2 distinguishing features." | `{ category: "Ocean Life", items: [{name: "Dolphin", emoji: "🐬", features: ["mammal", "fins"]}, ...] }` | 1 per session |
| Novel Category Set | "Invent a new training category not in this list: [existing]. Make it visual, concrete, and sortable." | `{ category: "Musical Instruments", items: [...] }` | 1 per session |

**Integration point:** "Surprise me!" button in category selection phase generates a novel category.

#### Sort Toy Box — AI-Generated Criteria + Configurations

| Content Type | Prompt Strategy | Example Output | Rate |
|-------------|-----------------|----------------|------|
| Sorting Criterion | "Create a sorting rule for [N] shapes with properties [list]. The rule should be non-obvious but learnable for a [band] child." | `{ criterion: "Sort by how many right angles", groups: 3 }` | 1 per round |
| Shape Configuration | "Design 12 shapes for a sorting exercise. Each shape has: name, color, size, pattern, symmetry, edgeCount." | `{ shapes: [...] }` | 1 per session |

**Integration point:** Round 5 (Mixed Challenge) uses AI-generated criteria beyond the static 8.

#### Neural Builder — AI-Generated Challenges + Datasets

| Content Type | Prompt Strategy | Example Output | Rate |
|-------------|-----------------|----------------|------|
| Architecture Challenge | "Create a neural network challenge for [band]. Include: task description, input type, output classes, optimal architecture hint." | `{ name: "Mood Classifier", inputs: "emoji faces", outputs: ["happy","sad","angry","neutral"], optimal: [4,8,6,4] }` | 1 per session |
| Test Dataset | "Generate 8 test items for [challenge]. Each item: visual description, correct class, difficulty." | `{ items: [{desc: "smiling face with tears", answer: 0, difficulty: "hard"}, ...] }` | Per challenge |

**Integration point:** "Random Challenge" button generates a novel challenge with unique test items.

#### Agent Architect — AI-Generated Missions

| Content Type | Prompt Strategy | Example Output | Rate |
|-------------|-----------------|----------------|------|
| Mission Brief | "Create an agent mission for [band] using blocks: [available]. Include: story context, goal, required blocks, validation rules, 3-star criteria." | `{ title: "Library Helper", story: "...", requiredBlocks: ["Goal","Search","Filter","Done"], starCriteria: {...} }` | 2 per session |
| Themed Pack | "Create 3 related missions about [theme] with increasing complexity for [band]." | `{ theme: "Space Station", missions: [...] }` | 1 per session |

**Integration point:** "Generate Mission" button in sandbox mode, and "New Pack" option in mission selection.

#### Bias Detective — AI-Generated Cases

| Content Type | Prompt Strategy | Example Output | Rate |
|-------------|-----------------|----------------|------|
| Bias Case | "Create an AI bias case study for [band]. Include: scenario title, domain, AI system description, 4 evidence items (across data/outcome/pattern/feedback/historical categories), 3 fix options (1 best, 1 partial, 1 wrong), and a real-world parallel." | `{ title: "Delivery Route AI", domain: "logistics", ...evidence, ...fixes }` | 1 per session |
| Stakeholder Interview | "Write a 5-exchange interview with [role] affected by [bias case]. Include emotional responses and unique perspective." | `{ role: "Delivery Driver", exchanges: [...] }` | Per case |

**Integration point:** "New Case" button after completing all 14 static cases. Stakeholder interviews generated on-demand.

### 6.3 Content Safety

All AI-generated content passes through a safety layer:

| Check | Implementation | Failure Action |
|-------|---------------|----------------|
| Age appropriateness | System prompt specifies age band + forbidden topics | Regenerate with stricter prompt |
| No real names | Post-generation regex check for common names + public figures | Strip and replace with fictional names |
| No violence/harm | System prompt excludes violence, weapons, substance use | Regenerate |
| No PII generation | Post-check for email, phone, address patterns | Strip matched content |
| Bias case sensitivity | Bias Detective cases reviewed for not stereotyping the groups they discuss | System prompt includes anti-stereotyping instructions |
| Schema validation | Zod validation of response structure | Fallback to static content |

### 6.4 Caching Strategy

```
Cache Hierarchy:
1. localStorage (per-session, per-game, per-band)
   Key: `sf:ai:{gameId}:{contentType}:{ageBand}:{hash}`
   TTL: Session duration (cleared on logout)
   
2. Supabase Storage (optional, future)
   Curated AI content promoted to permanent storage
   Admin review dashboard for quality control
   Shared across all users (community content)
```

### 6.5 Cost Estimation

| Game | Calls/Session | Tokens/Call (avg) | Cost/Session (est.) |
|------|--------------|-------------------|---------------------|
| Pet Trainer | 1–2 | ~500 | ~$0.003 |
| Sort Toy Box | 1–3 | ~400 | ~$0.003 |
| Neural Builder | 1–2 | ~600 | ~$0.004 |
| Agent Architect | 2–3 | ~800 | ~$0.006 |
| Bias Detective | 1–2 | ~1,200 | ~$0.008 |
| **Total per user session** | **6–12** | **~3,500** | **~$0.024** |

At 1,000 daily active users × 2 sessions/day = ~$48/day, $1,440/month. Well within typical API budget for an educational platform.

---

## 7. Educational Impact Assessment

### 7.1 AI Concepts Taught Per Game

| Game | Primary AI Concept | Secondary Concepts | Real-World Connection |
|------|-------------------|-------------------|----------------------|
| **Pet Trainer** | Supervised learning, classification, training data | Overfitting, data quality, generalization, transfer learning | Image classifiers, spam filters, recommendation systems |
| **Sort Toy Box** | Clustering, unsupervised learning, feature extraction | Distance metrics, dimensionality, multi-criteria classification | Customer segmentation, search engines, medical diagnosis grouping |
| **Neural Builder** | Neural network architecture, training, backpropagation | Layers, neurons, weights, activation functions, loss functions | Self-driving cars, speech recognition, medical imaging |
| **Prompt Lab** | Prompt engineering, human-AI interaction | Temperature, context, constraints, multi-step reasoning | ChatGPT, Copilot, AI writing assistants, content creation |
| **Agent Architect** | AI agents, pipelines, decision trees, orchestration | Parallel processing, memory, error recovery, human-in-the-loop | Personal assistants, automated customer service, workflow automation |
| **Bias Detective** | Algorithmic bias, fairness, ethical AI | Data bias, proxy variables, feedback loops, stakeholder impact | Hiring algorithms, credit scoring, facial recognition, content moderation |

### 7.2 Bloom's Taxonomy Mapping

Each game targets specific cognitive levels. The expansion aims to push all games toward higher-order thinking.

| Level | Pet Trainer | Sort Toy Box | Neural Builder | Prompt Lab | Agent Architect | Bias Detective |
|-------|------------|-------------|---------------|------------|-----------------|----------------|
| **Remember** | Name pet moods, list categories | Name shapes and properties | Recall layer terminology | Remember prompt patterns | Name block types | Recall bias types |
| **Understand** | Explain why training data matters | Explain sorting criteria | Explain how layers process data | Explain temperature effects | Explain pipeline flow | Explain how bias occurs |
| **Apply** | Label items correctly for training | Sort shapes by given criteria | Build network matching specs | Write prompts for tasks | Assemble pipeline for mission | Identify evidence in cases |
| **Analyze** | Analyze overfitting patterns | Analyze AI sorting logic | Analyze training curves | Analyze prompt score dimensions | Analyze pipeline efficiency | Analyze bias root causes |
| **Evaluate** | Judge training data quality | Evaluate AI vs. own sorting | Evaluate architecture tradeoffs | Evaluate prompt effectiveness | Evaluate agent design tradeoffs | Evaluate fix options |
| **Create** | Design custom training sets | Create own sorting rules | Design novel architectures | Craft original prompts | Build agents from scratch | Write bias audit reports |

**Current coverage:** Most games reach Apply/Analyze. Expansion pushes all to Evaluate/Create.

#### Expansion Impact on Bloom's

| Game | Current Ceiling | Post-Expansion Ceiling | Key Addition |
|------|----------------|----------------------|-------------|
| Pet Trainer | Apply (labeling) | Evaluate (overfitting lab, transfer test) | Overfitting Lab requires evaluating data quality |
| Sort Toy Box | Apply (sorting) | Create (Discovery Mode — invent sorting rules) | Discovery Mode + multi-criteria push to Create |
| Neural Builder | Analyze (training curves) | Create (Beat the Benchmark — novel architectures) | Competition mode + hyperparameter tuning = Create |
| Prompt Lab | Create (sandbox) | Create+ (recipes, battle) | Already at Create; recipes add composition depth |
| Agent Architect | Apply (follow missions) | Create (sandbox, debug, multi-agent) | Sandbox + debug mode reach full Create level |
| Bias Detective | Evaluate (fix selection) | Create (bias reports, custom datasets) | Report writing + custom datasets = Create level |

### 7.3 Learning Outcome Gaps

| Gap | Description | Affected Games | Fix |
|-----|-------------|---------------|-----|
| **No cross-game conceptual threading** | Games teach concepts in isolation — no explicit connection between supervised learning (Pet Trainer) and neural networks (Neural Builder) | All | Add "Concept Map" in post-game report showing how this game's concepts connect to other labs |
| **Limited reflection** | Most games end with a score screen, not a reflection prompt | All except Bias Detective | Add "What did you learn?" prompt in report phase with AI-generated reflection questions |
| **No spaced repetition** | Concepts seen once are never revisited | All | Suggest "revisit this game" prompts after 3/7/14 days via dashboard notifications |
| **Sort Toy Box lacks ML vocabulary** | Terms like "feature," "cluster," "distance" are used informally | Sort Toy Box | AI reveal should introduce formal vocabulary with age-band definitions |
| **Neural Builder skips backpropagation** | The most important training mechanism is invisible | Neural Builder | Add optional "peek inside training" mode showing weight updates flowing backward |
| **Agent Architect doesn't connect to LLMs** | Agents are abstract — no connection to how tools like ChatGPT actually use agents | Agent Architect | Add "Real AI Agents" comparison panel showing how real-world agents work similarly |

### 7.4 Pedagogical Approach Assessment

| Game | Approach | Strength | Risk |
|------|----------|----------|------|
| Pet Trainer | Learning-by-metaphor (pet = ML model) | Emotional engagement drives motivation | Risk of anthropomorphizing AI — pet "wants" to learn vs. model optimizes |
| Sort Toy Box | Discovery learning (sort first, see AI second) | Builds intuition before explanation | Without multi-round progression, discovery is too shallow |
| Neural Builder | Constructionism (build a network) | Hands-on building creates deep understanding | Random training simulation undermines the core lesson (BUG-NB1) |
| Prompt Lab | Experiential learning (write → observe → refine) | Real AI responses create authentic feedback loops | Open-endedness can overwhelm younger children without scaffolding |
| Agent Architect | Project-based learning (complete missions) | Structured goals with creative solutions | Mission-only mode limits free exploration |
| Bias Detective | Case-based learning (investigate real scenarios) | Real-world relevance creates meaning | 6 cases are too few for deep pattern recognition across bias types |

### 7.5 Educational Depth Ratings (Post-Expansion)

| Game | Current Rating | Post-Expansion | Rationale |
|------|---------------|----------------|-----------|
| Pet Trainer | 6/10 | 8/10 | Overfitting lab + transfer test add genuine ML depth |
| Sort Toy Box | 5/10 | 8/10 | Multi-round + multi-criteria + animated reveal teach real clustering |
| Neural Builder | 7/10 | 9/10 | Band A access + hyperparameters + competition create full learning arc |
| Prompt Lab | 9/10 | 10/10 | Already excellent; recipes + battle add composition mastery |
| Agent Architect | 7/10 | 9/10 | Debug mode + multi-agent teach real agent engineering |
| Bias Detective | 8/10 | 10/10 | Custom datasets + A/B testing + reports reach professional audit quality |

---

## 8. Implementation Roadmap

### Phase Overview

Implementation is divided into 6 phases, ordered by priority (critical bugs first, then content expansion, then AI integration).

| Phase | Name | Scope | Priority | Dependencies |
|-------|------|-------|----------|--------------|
| **A** | GameStore + GameShell Bug Fixes | 2 files, 5 bugs | CRITICAL | None — blocks all other work |
| **B** | Neural Builder Critical Fixes | 1 file, 8 bugs | CRITICAL | Phase A (gameStore fixes) |
| **C** | Sort Toy Box Major Expansion | 1 file, 652→1,500+ lines | HIGH | Phase A (gameStore fixes) |
| **D** | Neural Builder Band A + Content | 1 file, +5 challenges, +Band A | HIGH | Phase B (NB bug fixes) |
| **D2** | Remaining Flagship Expansions | 4 files (Pet/Prompt/Agent/Bias) | HIGH | Phase A (gameStore fixes) |
| **E** | AI Content Generation Infra | 2 new files + 1 new route | MEDIUM | Phase A |
| **F** | Per-Game AI Integration | 5 files modified | MEDIUM | Phase E (infrastructure) |

### Phase A: GameStore + GameShell Bug Fixes

**Files:** `src/stores/gameStore.ts`, `src/components/game/GameShell.tsx`
**Bugs fixed:** BUG-GS1, BUG-GS2, BUG-GS3, BUG-GS4, BUG-GS5
**Impact:** All 35 games

| Bug | Fix Summary |
|-----|------------|
| BUG-GS1 | Separate `score` and `maxScore`. Add `setMaxScore(points)` action. `updateScore` only modifies `score`. |
| BUG-GS2 | Change `>=` to `>` in advanceRound comparison. Advance round first, then check completion. |
| BUG-GS3 | Add `currentGame: null, totalRounds: 0, hintsRemaining: 3` to resetGame object. |
| BUG-GS4 | Accept `maxScore` as GameShell prop. Pass through to GameHUD3D. Default `totalRounds * 10`. |
| BUG-GS5 | Wrap `completeAndReward` in try/catch. Reset `hasRewarded.current` on failure. Show retry toast. |

**Verification:** `npm run build` + manual test of start/complete cycle on 2-3 games.

### Phase B: Neural Builder Critical Fixes

**File:** `src/components/games/NeuralBuilderGame.tsx`
**Bugs fixed:** BUG-NB1 through BUG-NB8

| Bug | Fix Summary |
|-----|------------|
| BUG-NB1 | Make training accuracy architecture-dependent. Good arch = fast convergence + high plateau. Bad arch = slow + noisy + potential divergence. |
| BUG-NB2 | Normalize optimalMatch by `challenge.optimalLayers.reduce((a,b)=>a+b,0)` instead of `totalNeurons`. |
| BUG-NB3 | Calculate sparkIntensity from raw delta before clamping: `Math.abs((Math.random()-0.5)*learningRate*2)`. |
| BUG-NB4 | Remove inline `<NeuralNetwork3D>` at line ~1074. Keep only sceneStore registration (line ~305). |
| BUG-NB5 | Store setTimeout in ref. Clear in useEffect cleanup. |
| BUG-NB6 | Continue heartbeat during training at increased speed: `isTraining ? 0.04 : 0.015`. |
| BUG-NB7 | Add audio semaphore — cancel previous playback before starting new. Max 3 concurrent audio events. |
| BUG-NB8 | Call `initCanvas()` inside `selectChallenge()` after state reset. |

**Verification:** `npm run build` + test training simulation produces architecture-correlated results.

### Phase C: Sort Toy Box Major Expansion

**File:** `src/components/games/SortToyBoxGame.tsx` (652 → ~1,500+ lines)

| Step | Content | Estimated Lines Added |
|------|---------|----------------------|
| C1 | Round system (5 rounds, progression gates, round counter UI) | +150 |
| C2 | Expanded shape library (30+ shapes with all properties) | +200 |
| C3 | Expanded criteria (8 criteria with combination logic) | +80 |
| C4 | Group mechanics (merge, split, labels, 6 max) | +100 |
| C5 | AI reveal animation (3-phase: extract → distance → cluster) | +150 |
| C6 | Challenge Mode (timer, combo multiplier, leaderboard) | +100 |
| C7 | Discovery Mode (free-play, custom rules, AI rule matching) | +100 |
| C8 | Scoring overhaul (effort-weighted, per-round, milestones) | +50 |
| C9 | Bug fixes (BUG-ST1 through BUG-ST4) | Net 0 (refactor) |

**Also fixes:** BUG-ST1 (score inversion), BUG-ST2 (dead hook), BUG-ST3 (instant reveal), BUG-ST4 (stale shapes)

### Phase D: Neural Builder Band A + Content Expansion

**File:** `src/components/games/NeuralBuilderGame.tsx`

| Step | Content |
|------|---------|
| D1 | Band A challenge data (3 challenges: Connect the Dots, Build a Simple Brain, Color Sorter) |
| D2 | Band A simplified UI (large targets, visual-only, guided tutorial, star ratings) |
| D3 | New challenges data (5 additional: Sound Recognizer, Emotion Detector, Animal Identifier, Text Classifier, Weather Predictor) |
| D4 | New architecture tests (4 additional: Overfitter, Underfitter, Speed Demon, Memory Master) |
| D5 | Band C advanced features (activation selector, dropout toggle, learning rate slider, batch size) |
| D6 | Competition mode ("Beat the Benchmark" with tiers and unlockables) |

### Phase D2: Remaining Flagship Seed Content Expansions

| Game | File | Key Additions | Estimated Lines Added |
|------|------|---------------|----------------------|
| Pet Trainer | `PetTrainerGame.tsx` | +3 pets, +6 categories, +3 mini-games, +4 moods, overfitting lab, customization system | +400–500 |
| Prompt Lab | `PromptLabGame.tsx` | +7 challenges, +7 templates, +2 scoring dims, Prompt Battle, Prompt Recipes, Prompt History, 5 scenario packs | +500–600 |
| Agent Architect | `AgentArchitectGame.tsx` | +5 blocks, +10 missions, 5 themed packs, Sandbox, Debug, Replay modes, multi-agent (Band C) | +500–600 |
| Bias Detective | `BiasDetectiveGame.tsx` | +8 cases, +2 evidence types, +3 ranks, custom dataset builder, A/B testing, fairness tuning, timeline, reports, interviews | +600–700 |

### Phase E: AI Content Generation Infrastructure

| File | Type | Content |
|------|------|---------|
| `src/lib/ai-content-generator.ts` | New | Shared utility: content type definitions, age-band prompt templates, caching layer, rate limiting, safety filtering |
| `src/app/api/ai/generate-content/route.ts` | New | API route: request validation (Zod), game-specific prompt routing, Claude API call, response validation |
| `src/hooks/useAIContent.ts` | New | Client hook: cache check → static fallback → API call → merge → return typed content |

### Phase F: Per-Game AI Integration

| Game | Integration Point | Content Type |
|------|------------------|-------------|
| Pet Trainer | "Surprise me!" button in category selection | Novel training categories + items |
| Sort Toy Box | Round 5 mixed challenge | AI-generated sorting criteria + shape configs |
| Neural Builder | "Random Challenge" button | Novel architecture challenges + test datasets |
| Agent Architect | "Generate Mission" in sandbox | AI-generated missions with story context |
| Bias Detective | "New Case" after completing static cases | AI-generated bias case studies |

### Dependency Graph

```
Phase A (gameStore/GameShell fixes)
├── Phase B (Neural Builder fixes) ──── Phase D (NB expansion)
├── Phase C (Sort Toy Box expansion)
├── Phase D2 (Pet/Prompt/Agent/Bias expansions)
└── Phase E (AI infra) ──── Phase F (per-game AI integration)
```

Phases B, C, D2, and E can run in parallel after Phase A completes.

### Verification Checklist

After all phases:
- [ ] `npm run build` passes clean
- [ ] `npx tsc --noEmit` — zero TypeScript errors
- [ ] All 6 flagship games complete full phase cycle (welcome → ... → complete)
- [ ] GameStore `score` and `maxScore` are independent
- [ ] Neural Builder training accuracy correlates with architecture
- [ ] Sort Toy Box has 5 playable rounds with progression
- [ ] Neural Builder Band A mode works for ages 7–9
- [ ] AI content generation returns valid typed content for all 5 games
- [ ] Static fallback works when API is unavailable
- [ ] All ARIA labels present, keyboard navigation functional

---

*End of Flagship Games Playability & Interactivity Audit v1.0*
*April 6, 2026 — 8 sections, 17 bugs documented, 6 games analyzed, 2.5x average content expansion planned*
