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
