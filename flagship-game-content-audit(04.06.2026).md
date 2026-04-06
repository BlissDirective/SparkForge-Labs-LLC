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
