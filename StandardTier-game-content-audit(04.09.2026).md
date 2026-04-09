# SparkForge Standard Tier Games — Playability & UI/UX Enhancement Audit

**Date:** April 9, 2026 | **Version:** 1.0 | **Auditor:** Claude Code (Autonomous Audit Agent)
**Scope:** All 20 Standard-tier games across 9 Labs
**Triangle Budget:** 5,000,000 per game (Standard tier)
**Methodology:** Full code review of all 20 `.tsx` game files, cross-referenced with GCUD V10.2, gameRegistry.ts, GameShell.tsx, gameStore.ts, ai-content-generator.ts, and prior audit reports (Flagship 04.06.2026, FL-Lite 04.08.2026)

---

## 1. Executive Summary

### 1.1 Audit Objectives

This audit evaluates all 20 Standard tier games across seven dimensions:

1. **Game Depth** — How many hours can a child legitimately spend playing?
2. **Bug Detection** — Code-level bugs affecting gameplay, memory, and correctness
3. **UI/UX Quality** — User-friendliness, cohesion with Frost-Prismatic design, interactivity
4. **Content Expansion** — Plan to increase seed content by ~11x (3x hardcoded + 3x AI admin + 3x live AI)
5. **AI Content Generation** — Integration with `useAIContent` hook and admin curation pipeline
6. **Educational Impact** — Bloom's taxonomy coverage, learning outcomes, age-band appropriateness
7. **Difficulty Tiers** — Activation of the currently non-functional DifficultySelector across all 20 games

### 1.2 Games Audited

| # | Game | Lab | File | Lines | Age Bands | Stage |
|---|------|-----|------|-------|-----------|-------|
| 1 | AI Spy | L1 — What IS AI? | `AiSpyGame.tsx` | 510 | A,B,C | 7A |
| 2 | Time Machine | L1 — What IS AI? | `TimeMachineGame.tsx` | 452 | A,B,C | 7A |
| 3 | Human vs Machine | L1 — What IS AI? | `HumanVsMachineGame.tsx` | 558 | A,B,C | 7B |
| 4 | Treat Trainer | L2 — Teaching Machines | `TreatTrainerGame.tsx` | 276 | A,B,C | 7C |
| 5 | Neuron Relay | L3 — The Brain Inside | `NeuronRelayGame.tsx` | 378 | A,B,C | 7C |
| 6 | Pixel Investigator | L3 — The Brain Inside | `PixelInvestigatorGame.tsx` | 339 | B,C | 7D |
| 7 | Word Predictor | L4 — AI That Creates | `WordPredictorGame.tsx` | 567 | A,B,C | 7A |
| 8 | Token Chopper | L4 — AI That Creates | `TokenChopperGame.tsx` | 445 | B,C | 7A |
| 9 | AI Art Detective | L4 — AI That Creates | `AiArtDetectiveGame.tsx` | 543 | A,B,C | 7A |
| 10 | Tool Picker | L5 — AI Helpers | `ToolPickerGame.tsx` | 277 | A,B,C | 7A |
| 11 | Data Shield | L6 — AI & Ethics | `DataShieldGame.tsx` | 289 | A,B,C | 7A |
| 12 | Real or Fake | L6 — AI & Ethics | `RealOrFakeGame.tsx` | 262 | A,B,C | 7A |
| 13 | Ethics Courtroom | L6 — AI & Ethics | `EthicsCourtroomGame.tsx` | 952 | B,C | 7E |
| 14 | Fool the AI | L7 — Computer Vision | `FoolTheAiGame.tsx` | 374 | B,C | 7D |
| 15 | Build Classifier | L7 — Computer Vision | `BuildClassifierGame.tsx` | 800 | B,C | 7E |
| 16 | Prediction Market | L7 — Computer Vision | `PredictionMarketGame.tsx` | 341 | B,C | 7A |
| 17 | Sentiment Scanner | L8 — Words & Language | `SentimentScannerGame.tsx` | 245 | A,B,C | 7C |
| 18 | Lost in Translation | L8 — Words & Language | `LostInTranslationGame.tsx` | 412 | A,B,C | 7C |
| 19 | Career Explorer | L9 — Build Your AI | `CareerExplorerGame.tsx` | 597 | B,C | 7B |
| 20 | API Explorer | L9 — Build Your AI | `ApiExplorerGame.tsx` | 848 | C | 7E |

**Total lines audited:** 9,475 lines across 20 game files

### 1.3 Key Findings Summary

| Metric | Result |
|--------|--------|
| **Total bugs found** | 76 (3 Critical, 12 High, 38 Medium, 23 Low) |
| **Systemic issues** | 5 platform-wide problems affecting all 20 games |
| **Average UI/UX score** | 7.2 / 10 |
| **Average game depth** | 5.1 / 10 (most games exhausted in 1-2 hours) |
| **Average play time** | 5.5 minutes per session |
| **Games missing learn phase** | 12 of 20 (60%) |
| **DifficultySelector functional** | 0 of 20 (0%) — all decorative |
| **AI content integration** | 0 of 20 (0%) — no Standard games use `useAIContent` |
| **Band A content gaps** | 2 games (Career Explorer, API Explorer) exclude Band A entirely |
| **Content expansion target** | ~11x (3x hardcoded + 3x AI admin + 3x live AI templates) |
| **New AI content types needed** | 60 (3 per game x 20 games) |

### 1.4 Approved Decisions

| # | Decision | Selected Option | Rationale |
|---|----------|----------------|-----------|
| 1 | setTimeout Cleanup | **Shared `useSafeTimeout` hook + fix all 20 games** | Eliminates systemic memory leak pattern across entire Standard tier |
| 2 | Band A Content Gap | **Create full Band A content** for Career Explorer and API Explorer | All Standard games must serve ages 7-16 per platform promise |
| 3 | DifficultySelector | **Option C: Content filtering + parameter adjustment** | Difficulty tiers filter content AND modify timers/hints/scoring |
| 4 | Content Expansion | **Option C: Full ~11x expansion** (3x hardcoded + 3x AI admin + 3x live) | Matches FL-Lite pattern for maximum content depth and replayability |
| 5 | Learn Phase | **Add to all 12 missing games** (3-4 learn cards each) | Consistent educational scaffolding before gameplay |
| 6 | Scoring | **Tiered scoring** — Easy = participation pts, Hard/Expert = strict | Balances motivation (younger) with challenge (advanced) |

### 1.5 Content Expansion Multipliers

| Layer | Multiplier | Source | Integration |
|-------|-----------|--------|-------------|
| **Hardcoded Seed** | 3x | Directly in game `.tsx` files | Immediate, curated, reviewed |
| **AI Admin Curation** | 3x | Claude API → `content_queue` → admin review → approved pool | Supabase-backed, quality-assured |
| **AI Prompt Templates** | 3x | Real-time Claude API via `useAIContent` hook | On-demand per session, infinite variety |
| **Combined** | **~11x** | All three layers blended | Progressive content pool expansion |

### 1.6 Report Structure

| Section | Content |
|---------|---------|
| 2 | Game-by-Game Findings (20 detailed game audits) |
| 3 | Cross-Game Bug Registry (76 bugs by severity) |
| 4 | Systemic Issues (5 platform-wide problems) |
| 5 | Content Expansion Plan (~11x per game) |
| 6 | AI Content Generation Strategy (60 new content types) |
| 7 | Educational Impact Assessment (Bloom's taxonomy mapping) |
| 8 | Implementation Roadmap (phased delivery) |
