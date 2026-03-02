# SPARKFORGE — MASTER IMPLEMENTATION GUIDE

**Version:** 3.1 | **Date:** March 1, 2026 | **For:** Claude Code
**Supersedes:** Master Implementation Guide v3.0 (March 1, 2026) — corrects game count from 31 to 35.

**Purpose:** Single entry point for building SparkForge from stage documents. Updated for single-pass v3-FINAL build strategy, 14 v3-FINAL documents, and alignment with Master Directory v1.0 and GCUD V10.

---

## HOW TO USE THIS GUIDE

This document is your roadmap. The actual code lives in the stage PDF documents. Your workflow:

1. Read this guide for the stage overview and source document references
2. Read the Master Directory v1.0 Section 4 for the exact document to use
3. Read the referenced PDF (v3-FINAL or v2) for complete copy-paste code
4. Create folders first, then files in order
5. Validate: visual (browser) + build (npm run build) + console (dev tools)
6. Commit and move to next part/stage

**CRITICAL:** Single-pass build with v3-FINAL priority. Where a v3-FINAL document exists, it is the ONLY source needed. It contains ALL v2 content plus v3 visual enhancements. Do NOT build v2 first then patch.

**CRITICAL RULES:**

- Follow stages in order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10
- Each stage depends on ALL previous stages being complete
- Never skip ahead. Never implement partial files.
- Every code block is COMPLETE — copy entire file contents
- All PowerShell commands are single-line (no backtick continuations)

**ENVIRONMENT:** Windows 11 + PowerShell 7+ | VS Code | Node.js 20+ LTS

### Key Reference Documents

| Document | Purpose |
|----------|---------|
| Master Directory v1.0 | 24-phase flow map, file registry, GitHub structure — READ FIRST |
| GCUD V10 | Source of truth for game content, gap status, file registry |
| CLAUDE.md v5.1 | Architecture, conventions, game template, 3D rules |
| Decision Lock Checkpoints 1-3 | 48 locked decisions implemented by v3-FINAL |
| Visual Enhancement Concept v2 | Lab Control Station 8-section design spec |
| Setup Prerequisites | Software install, Supabase/Stripe/Vercel account setup |

**Runtime & Complete Package List:** Node.js 20+ LTS. Next.js 14, TypeScript strict, Tailwind CSS, Supabase, Stripe, Framer Motion, GSAP, React Three Fiber, Three.js, @react-three/drei, @react-three/postprocessing, recharts, Tone.js, Zod, Zustand, @tanstack/react-query, @dnd-kit/*, @radix-ui/*, class-variance-authority, clsx, tailwind-merge, lucide-react. Full list in Stage 1 Part 1.

---

## STAGE 1: FOUNDATION

**Source Documents:** STAGE1_Foundation_v2_PART1 + PART2 (v2 only)

| Part | Source | Content |
|------|--------|---------|
| Part 1 | STAGE1_Foundation_v2_PART1 | Next.js project, 40+ npm packages, config files, 30+ directories |
| Part 2 | STAGE1_Foundation_v2_PART2 | Types, stores, hooks, utils, root layout |

Commit: `git commit -m "Stage 1: Foundation"`

---

## STAGE 2: DATABASE & API

**Source Documents:** STAGE2_Database_API_v2_PART1-4 (v2 only)

| Part | Source | Content |
|------|--------|---------|
| Part 1 | STAGE2_Database_API_v2_PART1 | DB schema (9 tables), indexes (14), RLS, badge seed (68), starter content |
| Part 2 | STAGE2_Database_API_v2_PART2 | Zod schemas, tier-config.ts, rate limiting, API helpers |
| Part 3 | STAGE2_Database_API_v2_PART3 | API routes: auth, children CRUD, content |
| Part 4 | STAGE2_Database_API_v2_PART4 | API routes: progress, gamification (xp, streak, badges) |

Hard Stops: HS-1 (Supabase keys), HS-7 (SQL execution)

Commit: `git commit -m "Stage 2: Database + API"`

---

## STAGE 3: AUTH, LAYOUT & STATION FRAME

**Source Documents [MIXED v2 + v3]:**

| Part | Source | Type | Content |
|------|--------|------|---------|
| Part 1 | STAGE3_Auth_Layout_Shell_v2_PART1 | v2 | AuthProvider, signup, login, reset-password |
| Part 2 | STAGE3_Auth_Layout_Shell_v2_PART2 | v2 | Dashboard layout, Sidebar, TopBar, ChildSelector |
| Part 3A | STAGE3_Part3A_v3FINAL | v3-FINAL | StationFrame, CrystalShatter, Aurora, Particles, LEDRim, HDR |
| Part 3B | STAGE3_Part3B_v3FINAL | v3-FINAL | Emissive CSS, onboarding crystal, landing page |

Decision IDs: 1.1-1.7, 2.1-2.5, 7.1, 7.3-4, 8.1

Commit: `git commit -m "Stage 3: Auth + Layout + Station Frame"`

---

## STAGE 4: CORE PAGES & LAB RECONFIGURATION

**Source Documents [MIXED v2 + v3]:**

| Part | Source | Type | Content |
|------|--------|------|---------|
| Part 1 | STAGE4_Core_Pages_v2_PART1 | v2 | Dashboard home, hooks |
| Part 2A | STAGE4_Part2_v3FINAL_A | v3-FINAL | 10 lab pattern GLSL shaders + shader index |
| Part 2B | STAGE4_Part2_v3FINAL_B | v3-FINAL | LabReconfiguration, GameFocusSequence, useStationMode |
| Part 3 | STAGE4_Core_Pages_v2_PART3 | v2 | Profile page, quiz engine, settings |

Decision IDs: 3.1-3.5, 4.1

Commit: `git commit -m "Stage 4: Core Pages + Lab Reconfiguration"`

---

## STAGE 5: GAMIFICATION & VISUAL FX

**Source Documents [MIXED v2 + v3]:**

| Part | Source | Type | Content |
|------|--------|------|---------|
| Part 1 | STAGE5_Gamification_Profile_PART1 | v2 | XP engine, cosmetics, avatar, sound, daily challenge |
| Parts 2-3A | STAGE5_Parts23_v3FINAL_A | v3-FINAL | LiquidMetal, Holographic, EnergyField shader components |
| Parts 2-3B | STAGE5_Parts23_v3FINAL_B | v3-FINAL | XPVortex, BadgePedestals, particle slider, profile 3D |
| Parts 2-3C | STAGE5_Parts23_v3FINAL_C | v3-FINAL | GameParticles3D, ceremonies, verification |

Decision IDs: 4.2-4.5, 5.2-5.6, 7.2

Commit: `git commit -m "Stage 5: Gamification + Visual FX"`

---

## STAGE 6: FLAGSHIP GAMES (5 games) [ALL v3-FINAL]

All 5 flagships use v3-FINAL documents exclusively. Each v3-FINAL is a standalone replacement containing ALL v2 game logic + v3 3D enhancements. Part A = new 3D component, Part B = full game file replacement.

**Prerequisites:** Stages 1-5 complete. Read CLAUDE.md Section 4 (Game Architecture Template).

| Order | Game | Source | Parts | Key 3D Component | Decision IDs |
|-------|------|--------|-------|-------------------|-------------|
| 6.1 | AI Pet Trainer (Lab 2) | STAGE6B_v3FINAL | A+B | Pet3DScene + PetCreature3D (GLB pipeline) | 6.2, 7.5 |
| 6.2 | Neural Builder (Lab 3) | STAGE6C_v3FINAL | A+B | NeuralNetwork3D (rotatable 3D network) | 6.1 |
| 6.3 | Prompt Lab (Lab 4) | STAGE6D_v3FINAL | A+B | PromptBubble3D (reactive thought bubble) | 6.5 |
| 6.4 | Agent Architect (Lab 5) | STAGE6E_v3FINAL | A+B+C | AgentPipeline3D (data packets + spotlight) | 6.4, 6.5 |
| 6.5 | Bias Detective (Lab 6) | STAGE6F_v3FINAL | A+B+C | BiasScales3D (justice scales) | 6.5, 6.6 |

Every flagship: Chrome bezel + LED rim, particle background, welcome/learn/play/complete phases, age-band differentiation (A/B/C), ARIA labels, Tone.js audio, useIsMobile() fallback.

Commit: `git commit -m "Stage 6: 5 flagship games with 3D"`

---

## STAGE 7: ALL REMAINING GAMES (30 games) [MIXED]

**Prerequisites:** Stages 1-6 complete. Implement in sub-stage order: 7A → 7B → 7C → 7D → 7E → 7F → Shared.

### 7A — Tap & Quiz (9 games) [v2 only]

| Source | Games |
|--------|-------|
| STAGE7A_Batch_TapQuiz | AI Spy, Time Machine |
| STAGE7A_Part2_TokenChopper_AiArt | Word Predictor, Token Chopper, AI Art Detective |
| STAGE7A_Part3_ToolPicker_DataShield | Tool Picker, Data Shield |
| STAGE7A_Part4_RealOrFake_PredictionMarket | Real or Fake, Prediction Market |

Commit: `git commit -m "Stage 7A: 9 tap/quiz games"`

### 7B — Drag & Drop (4 games) [v3-FINAL]

**Source:** STAGE7B_v3FINAL_A/B/C. **Decisions:** 6.3, 6.5

**Games:** Sort Toy Box (Full 3D: SortScene3D), Human vs Machine, Code Blocks (Enhanced 3D: CodeBlocks3D), Career Explorer

Commit: `git commit -m "Stage 7B: 4 drag/drop games with 3D"`

### 7C — Simulation & Sandbox (6 games) [MIXED]

| Source | Type | Games |
|--------|------|-------|
| STAGE7C_Part1_TreatTrainer_Sentiment | v2 | Treat Trainer, Sentiment Scanner |
| STAGE7C_Part2_Translation_NeuronRelay | v2 | Lost in Translation, Neuron Relay |
| STAGE7C_v3FINAL_A/B/C | v3-FINAL | Chatbot Builder (3D: ChatbotNodes3D), Data Detective (3D: DataDetective3D) |

Commit: `git commit -m "Stage 7C: 6 simulation games"`

### 7D — Investigation (5 games) [MIXED]

| Source | Type | Games |
|--------|------|-------|
| STAGE7D_Part1_PixelInvestigator_FoolTheAI | v2 | Pixel Investigator, Fool the AI |
| STAGE7D_v3FINAL_A/B/C | v3-FINAL | Robot Vacuum (3D), Camera Quest (3D), Future Forge (3D) |

Commit: `git commit -m "Stage 7D: 5 investigation games with 3D"`

### 7E — Ethics & API (3 games) [v2 only]

**Source:** STAGE7E Part1 + Part2. **Games:** Ethics Courtroom, Build a Classifier, API Explorer

Commit: `git commit -m "Stage 7E: 3 ethics/API games"`

### 7F — Band A Expansion (3 games) [MIXED]

| Source | Type | Games |
|--------|------|-------|
| STAGE7F_v3FINAL_A/B | v3-FINAL | My First AI App (3D: MyFirstAiApp3D) |
| STAGE7F_Part2 | v2 | Emoji Decoder, AI or Not? (no 3D — Tier 3) |

Commit: `git commit -m "Stage 7F: 3 Band A games"`

### 7 Shared — Systems [MIXED]

| Source | Type | Content |
|--------|------|---------|
| STAGE7_Shared_v3FINAL_A | v3-FINAL | GenericGameParticles (CSS ambient particles for 29 standard/FL-Lite games) |
| STAGE7_Shared_XP_Celebration | v2 | XPPopupProvider, GameCompleteCelebration, StreakFire |

Note: CodeBlocks_V3_FullTreatment.pdf is referenced by 7B v3-FINAL. Keep for context.

**Final validation:** All 35 games accessible from Arcade. Each completes full phase cycle.
**Update** `gameRegistry.ts` with all 35 entries per STAGE7F_Part2 final registry.

---

## STAGE 8: PARENT DASHBOARD

**Source Documents [MIXED v2 + v3]:**

| Part | Source | Type | Content |
|------|--------|------|---------|
| Part 1 | STAGE8_Parent_Dashboard_v2_PART1 | v2 | Tier config extensions, Stripe setup, parent store |
| Part 2 | STAGE8_Parent_Dashboard_v2_PART2 | v2 | Parent dashboard, subscription, paywall |
| Part 3A | STAGE8_P3_v3FINAL_A | v3-FINAL | ScrollJourney landing page |
| Part 3B | STAGE8_P3_v3FINAL_B | v3-FINAL | FeatureShowcase, StationPreview |
| Part 3C | STAGE8_P3_v3FINAL_C | v3-FINAL | /pricing route, verification |

Decision IDs: 8.1-8.5

Hard Stops: HS-2 (Stripe keys)

Commit: `git commit -m "Stage 8: Parent Dashboard + Monetization"`

---

## STAGE 9: CONTENT AGENT

**Source Documents:** STAGE9_Content_Agent_v2_PART1-3 (v2 only)

| Part | Source | Content |
|------|--------|---------|
| Part 1 | STAGE9_Content_Agent_v2_PART1 | Agent pipeline (4-stage), prompts, API routes |
| Part 2 | STAGE9_Content_Agent_v2_PART2 | Admin review dashboard |
| Part 3 | STAGE9_Content_Agent_v2_PART3 | Seed content: 150 lessons, 90 quizzes, 60 facts |

Hard Stops: HS-3 (Anthropic API key)

Commit: `git commit -m "Stage 9: Content Agent"`

---

## STAGE 10: POLISH & DEPLOY

**Source Documents:** STAGE10_Polish_Deploy_v2_PART1-2 (v2 only)

| Part | Source | Content |
|------|--------|---------|
| Part 1 | STAGE10_Polish_Deploy_v2_PART1 | A11yProvider, AccessibilityToolbar, SEO, CSP, PWA |
| Part 2 | STAGE10_Polish_Deploy_v2_PART2 | Game router (35 games), production next.config.js, deployment guide |

Hard Stops: HS-4 (Vercel)

Commit: `git commit -m "Stage 10: Polish + Deploy"`

---

## QUICK REFERENCE — ALL 35 GAMES

| # | Game | Lab | Stage | Slug | Tier | 3D | Bands |
|---|------|-----|-------|------|------|----|-------|
| 1 | AI Spy | 1 | 7A | ai-spy | Std | — | A,B,C |
| 2 | Time Machine | 1 | 7A | time-machine | Std | — | A,B,C |
| 3 | Human vs Machine | 1 | 7B | human-vs-machine | Std | — | A,B,C |
| 4 | AI Pet Trainer | 2 | 6B | pet-trainer | Flag | Full | A,B,C |
| 5 | Sort Toy Box | 2 | 7B | sort-toy-box | Full3D | Full | A,B,C |
| 6 | Treat Trainer | 2 | 7C | treat-trainer | Std | — | A,B,C |
| 7 | Data Detective | 2 | 7C | data-detective | FL-L | Enh | A,B,C |
| 8 | Neural Builder | 3 | 6C | neural-builder | Flag | Full | A,B,C |
| 9 | Neuron Relay | 3 | 7C | neuron-relay | Std | — | A,B,C |
| 10 | Pixel Investigator | 3 | 7D | pixel-investigator | Std | — | B,C |
| 11 | Prompt Lab | 4 | 6D | prompt-lab | Flag | Full | A,B,C |
| 12 | Word Predictor | 4 | 7A | word-predictor | Std | — | A,B,C |
| 13 | Token Chopper | 4 | 7A | token-chopper | Std | — | B,C |
| 14 | AI Art Detective | 4 | 7A | ai-art-detective | Std | — | A,B,C |
| 15 | Agent Architect | 5 | 6E | agent-architect | Flag | Full | A,B,C |
| 16 | Robot Vacuum | 5 | 7D | robot-vacuum | FL-L | Enh | A,B,C |
| 17 | Tool Picker | 6 | 7A | tool-picker | Std | — | A,B,C |
| 18 | Bias Detective | 6 | 6F | bias-detective | Flag | Full | B,C |
| 19 | Data Shield | 6 | 7A | data-shield | Std | — | A,B,C |
| 20 | Real or Fake | 6 | 7A | real-or-fake | Std | — | A,B,C |
| 21 | Ethics Courtroom | 6 | 7E | ethics-courtroom | Std | — | B,C |
| 22 | Camera Quest | 7 | 7D | camera-quest | FL-L | Enh | A,B,C |
| 23 | Fool the AI | 7 | 7D | fool-the-ai | Std | — | B,C |
| 24 | Build Classifier | 7 | 7E | build-classifier | Std | — | B,C |
| 25 | Prediction Market | 7 | 7A | prediction-market | Std | — | B,C |
| 26 | Sentiment Scanner | 8 | 7C | sentiment-scanner | Std | — | A,B,C |
| 27 | Chatbot Builder | 8 | 7C | chatbot-builder | FL-L | Enh | B,C |
| 28 | Lost in Translation | 8 | 7C | lost-in-translation | Std | — | A,B,C |
| 29 | Emoji Decoder | 8 | 7F | emoji-decoder | Enh | — | A,B |
| 30 | Code Blocks | 9 | 7B | code-blocks | FL-L | Enh | A,B,C |
| 31 | Career Explorer | 9 | 7B | career-explorer | Std | — | B,C |
| 32 | API Explorer | 9 | 7E | api-explorer | Std | — | C |
| 33 | My First AI App | 9 | 7F | my-first-ai-app | FL-L | Enh | A,B,C |
| 34 | Future Forge | 10 | 7D | future-forge | FL-L | Enh | A,B,C |
| 35 | AI or Not? | 10 | 7F | ai-or-not | Enh | — | A,B |

**Tiers:** 5 Flagship Full 3D + 1 Full 3D (Sort) + 7 FL-Lite Enhanced + 2 Enhanced Std + 20 Standard = **35 games**.

---

*End of Master Implementation Guide v3.1 | SparkForge | Lab Control Station | 35 games | 78 files | 48 decisions | March 1, 2026*

*This is a living document. Updated after each delivery session. GCUD V10 is the canonical source for game content tracking. Master Directory v1.0 is the canonical source for file registry and build flow.*
