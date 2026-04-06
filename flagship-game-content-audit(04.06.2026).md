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
