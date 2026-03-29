# SPARKFORGE — MASTER IMPLEMENTATION GUIDE

**Version:** 4.0 | **Date:** March 29, 2026 | **For:** Claude Code (Local Terminal + Remote Mobile)
**Supersedes:** Master Implementation Guide v3.3 (March 23, 2026) — Complete overhaul: Added comprehensive Document-to-Code Map (Section 3) linking every stage .md to every /src file. Added Complete Source Code Registry (Section 4) mapping all 409 src files to stage origins. Added Enhancement & Undocumented Files Map (Section 5) identifying 100+ files created during audit/enhancement cycles. Updated all registries (13 stores, 35 hooks, 93 3D components). Added 30-day commit log (50 commits). Added Known Gaps section. Aligned with CLAUDE.md v6.0 and D3D Desktop-First Overhaul (20 decision locks).

**Purpose:** Single entry point for building SparkForge from stage documents. This v4.0 is the **ultra-comprehensive edition** — every document and every source file in the repo is mapped, indexed, and linked to its stage of origin. Use this as your development GPS.

---

## SECTION 1: OVERVIEW & HOW TO USE

### Workflow

1. **Find your stage** in the Build Execution Plan (Section 11)
2. **Look up the stage** in the Document-to-Code Map (Section 3) to see every .md and every /src file
3. **Read the stage .md** for complete copy-paste code
4. **Create files** in the order specified by the stage doc
5. **Validate:** `npm run build` + `npx tsc --noEmit` + browser check
6. **Commit** and move to next part/stage

### Critical Rules

- **Single-pass build with v3-FINAL priority.** Where a v3-FINAL document exists, it is the ONLY source needed. It contains ALL v2 content plus v3 visual enhancements. Do NOT build v2 first then patch.
- **Follow stages in order:** 1 → 2 → 3 → 3-Hero → 3-Cockpit → 3-Login3D → 4 → 5 → 6 → 7 → 8 → 9 → 10
- **Each stage depends on ALL previous stages being complete**
- **Never skip ahead. Never implement partial files.**
- **Every code block is COMPLETE** — copy entire file contents
- **Always evaluate local and remote files** for potential new additions or modifications before starting a stage
- **Read documents prior to development** — Some stages require v2 docs first, others require v3 first

### Key Reference Documents

| Priority | Document | Location | Purpose |
|----------|----------|----------|---------|
| 1 | **CLAUDE.md v6.0** | Repo root | Architecture, rules, autonomy, D3D decisions |
| 2 | **This file (v4.0)** | `docs/00-reference/` | Ultra-comprehensive file map, registries |
| 3 | **Stage documents** | `docs/stage*/` folders | Complete copy-paste code per stage |
| 4 | **PROGRESS.md** | Repo root | Current build status, phase tracking |
| 5 | **Master Directory v1.2** | `docs/00-reference/` | 26-phase flow map, file registry |
| 6 | **GCUD V10.2** | `docs/00-reference/` | Source of truth for game content + status |
| 7 | **3D-Component-Registry.md** | `docs/00-reference/` | 93-component 3D registry with tiers/budgets |
| 8 | **Per-Stage-Playbooks.md** | `docs/00-reference/` | Full build playbooks for all 10 stages |
| 9 | **CPA v2.0** | `docs/00-reference/` | 3D Panoramic Cockpit full spec |
| 10 | **ERROR_HANDLING_AUTOFIX_GUIDE.md** | `docs/00-reference/` | Build/TS/import error patterns |

### Environment

- **Runtime:** Node.js 20+ LTS
- **Framework:** Next.js 15 (React 19, Turbopack, App Router)
- **Language:** TypeScript strict mode
- **Styling:** Tailwind CSS 4 (Oxide engine)
- **3D:** React Three Fiber v9 + drei + postprocessing (Three.js r183+, TSL, WebGPU/WebGL2)
- **State:** Zustand (13 stores) + Jotai (3D atoms)
- **Testing:** Vitest + Playwright + MSW
- **Deployment:** Vercel

### Repo Statistics (as of March 29, 2026)

| Metric | Count |
|--------|-------|
| Source files (`/src/`) | 409 |
| Documentation files (`/docs/`) | 128 |
| Root config/doc files | 25+ |
| Games (all functional) | 35 |
| 3D components | 140 |
| Stores | 13 |
| Hooks | 35 |
| API routes | 32 |
| Shaders (TSL + GLSL) | 24 |
| Stage documents (active) | 80+ |
| Superseded documents | 8 |
| Commits (past 30 days) | 50 |
| Decision locks | 84 (48 core + 4 OD + 12 CPA2 + 20 D3D) |

---

## SECTION 2: COMPLETE DOCUMENT REGISTRY

Every documentation file in the repo, organized by location. **Status** indicates if the file is actively used for builds (ACTIVE), reference-only (REF), or archived (SUPERSEDED).

### 2.1 Root-Level Documents (14 files)

| File | Purpose | Status | Used By |
|------|---------|--------|---------|
| `CLAUDE.md` (v6.0) | Autonomous development playbook — architecture, rules, all decisions | ACTIVE | All stages |
| `PROGRESS.md` | Build progress tracking — current phase, completed stages, issues | ACTIVE | All stages |
| `TESTING.md` | Testing pyramid — unit, integration, E2E patterns | ACTIVE | Stage 10 |
| `README.md` | Project README (Next.js bootstrapped) | REF | — |
| `DEPLOYMENT.md` | Deployment procedures and guidelines | ACTIVE | Stage 10 |
| `Agent-Frontend.md` | Agent frontend documentation | REF | Stage 9 |
| `SparkForge-agent.md` | SparkForge agent specifications | REF | Stage 9 |
| `AUDIT_REPORT.md` | Original code audit report | REF | — |
| `AUDIT_REPORT_3-25-2026.md` | Latest audit report (March 25, 2026) | REF | — |
| `CODE_AUDIT_SUMMARY_MATRIX_20260315.md` | Code audit summary matrix | REF | — |
| `GAME_ENHANCEMENT_AUDIT.md` | Game enhancement audit | REF | Stages 6-7 |
| `ENHANCEMENT_BLUEPRINT_v1.0.md` | 12-section visionary upgrade plan (Enh 1.0–1.2+) | ACTIVE | Enhancements |
| `Feature-Workflow-Test.md` | Build-test-integrate cycle, feature sizing | ACTIVE | All stages |
| `database-patterns.md` | Supabase/RLS patterns, schema design | ACTIVE | Stages 2, 8, 9 |

### 2.2 Reference Documents — `docs/00-reference/` (17 active + 1 superseded)

| File | Version | Purpose | Status | Used By |
|------|---------|---------|--------|---------|
| `SparkForge_Master_Implementation_Guide_v3.2.md` | **v4.0** | THIS FILE — ultra-comprehensive dev GPS | ACTIVE | All stages |
| `SparkForge_Master_Directory_v1.2.md` | v1.2 | 26-phase flow map, file registry | ACTIVE | All stages |
| `GCUD_V10.2.md` | V10.2 | Game content source of truth, 35 games | ACTIVE | Stages 6-7 |
| `3D-Component-Registry.md` | current | 93-component 3D registry with tiers/budgets | ACTIVE | Stages 3-7 |
| `3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md` | v2.0 | CPA v2.0 — cockpit full spec, CPA2 decisions | ACTIVE | Stage 3-Cockpit |
| `Implementation_Plan_Hero_Page_Animation_v2.0.md` | v2.0 | Hero animation implementation plan | ACTIVE | Stage 3-Hero |
| `SparkForge_Hero_Page_Animation_v2.0.md` | v2.0 | Hero animation 8-phase spec | ACTIVE | Stage 3-Hero |
| `Per-Stage-Playbooks.md` | current | Full build playbooks for all 10 stages | ACTIVE | All stages |
| `QUICK_REFERENCE_35_GAMES.md` | current | Full game table (canonical in GCUD V10.2) | ACTIVE | Stages 6-7 |
| `ERROR_HANDLING_AUTOFIX_GUIDE.md` | current | Build/TS/import error patterns + auto-fix | ACTIVE | All stages |
| `KNOWN_COMPAT_NOTES.md` | current | Version-sensitive package flags | ACTIVE | All stages |
| `SPARKFORGE_AUDIT_AGENT.md` | current | Autonomous evaluation sweep playbook | REF | Audit cycles |
| `MARKET_RESEARCH_COMPETITIVE_ANALYSIS.md` | current | Market research + competitive analysis | REF | — |
| `MOBILE_3D_ENHANCEMENT_PLAN_PartA.md` | current | Mobile 3D analysis (superseded by D3D desktop-first) | REF | — |
| `MOBILE_3D_ENHANCEMENT_PLAN_PartB.md` | current | Mobile 3D options (superseded by D3D desktop-first) | REF | — |
| `Upgrade-3D-Panoramic-Cockpit-2026-03-20.md` | current | 20M cockpit upgrade changelog | REF | Stage 3-Cockpit |
| `README.md` | current | Reference folder index | REF | — |
| `_SUPERSEDED/COCKPIT_PANORAMIC_ARCHITECTURE_v1.md` | v1.0 | Original cockpit spec (replaced by v2.0) | SUPERSEDED | — |

### 2.3 Decision Documents — `docs/01-decisions/`

| File | Purpose | Status |
|------|---------|--------|
| `README.md` | Decision lock index (64 core decisions embedded in stage docs) | REF |

### 2.4 Enhancement Documents — `docs/enhancements/` (5 files)

| File | Purpose | Status | Used By |
|------|---------|--------|---------|
| `DESKTOP_FIRST_3D_OVERHAUL_PartA.md` | D3D foundation cleanup — constraint removal spec | ACTIVE | D3D Overhaul |
| `DESKTOP_FIRST_3D_OVERHAUL_PartB.md` | D3D scene routing — MechanicalIris, SceneRouter | ACTIVE | D3D Overhaul |
| `DESKTOP_FIRST_3D_OVERHAUL_PartC.md` | D3D postprocessing — 7-effect always-on stack | ACTIVE | D3D Overhaul |
| `DESKTOP_FIRST_3D_OVERHAUL_PartD.md` | D3D interactive surfaces — parallax, hover, drag | ACTIVE | D3D Overhaul |
| `AI_GUIDE_AVATAR_ENHANCEMENT_PLAN.md` | AI Guide avatar 3D companion spec | REF | Future Enh |

### 2.5 Stage Documents — Build Sources

#### Stage 1: Foundation — `docs/stage1-foundation/` (3 files)

| File | Type | Parts | Status |
|------|------|-------|--------|
| `STAGE1_Foundation_v2_PART1.md` | v2 | Part 1 of 2 | ACTIVE |
| `STAGE1_Foundation_v2_PART2.md` | v2 | Part 2 of 2 | ACTIVE |
| `README.md` | — | Index | REF |

#### Stage 2: Database & API — `docs/stage2-database-api/` (5 files)

| File | Type | Parts | Status |
|------|------|-------|--------|
| `STAGE2_Database_API_v2_PART1.md` | v2 | Part 1 of 4 | ACTIVE |
| `STAGE2_Database_API_v2_PART2.md` | v2 | Part 2 of 4 | ACTIVE |
| `STAGE2_Database_API_v2_PART3.md` | v2 | Part 3 of 4 | ACTIVE |
| `STAGE2_Database_API_v2_PART4.md` | v2 | Part 4 of 4 | ACTIVE |
| `README.md` | — | Index | REF |

#### Stage 3: Auth & Layout — `docs/stage3-auth-layout/` (11 files)

| File | Type | Phase | Status |
|------|------|-------|--------|
| `STAGE3_Auth_Layout_Shell_v2_PART1.md` | v2 | 3.1 — Auth | ACTIVE |
| `STAGE3_Auth_Layout_Shell_v2_PART2.md` | v2 | 3.2 — Dashboard layout | ACTIVE |
| `STAGE3_Auth_Layout_Shell_v3_PART3A_20260314.md` | v3-FINAL | 3.3A — StationFrame, 3D shell | ACTIVE |
| `STAGE3_Auth_Layout_Shell_v3_PART3B_20260314.md` | v3-FINAL | 3.3B — Emissive CSS, onboarding | ACTIVE |
| `HERO_ANIMATION_v3FINAL_PartA.md` | v3-FINAL | 5A — Hero stores, shaders | ACTIVE |
| `HERO_ANIMATION_v3FINAL_PartB.md` | v3-FINAL | 5B — Hero particles, audio, orchestrator | ACTIVE |
| `COCKPIT_CPA2_v3FINAL_PartA.md` | v3-FINAL | 5C — Cockpit canvas, camera, panels | ACTIVE |
| `COCKPIT_CPA2_v3FINAL_PartB.md` | v3-FINAL | 5D — Spatial dashboard, HUD, transitions | ACTIVE |
| `LOGIN_3D_v3FINAL_PartA.md` | v3-FINAL | 5E — 3D login portal, demo infra | ACTIVE |
| `LOGIN_3D_v3FINAL_PartB.md` | v3-FINAL | 5F — Enhanced login, demo guards | ACTIVE |
| `README.md` | — | Index | REF |

#### Stage 4: Core Pages — `docs/stage4-core-pages/` (5 files)

| File | Type | Parts | Status |
|------|------|-------|--------|
| `STAGE4_Core_Pages_v2_PART1.md` | v2 | Part 1 — Dashboard home, hooks | ACTIVE |
| `STAGE4_Part2A_v3FINAL.md` | v3-FINAL | Part 2A — Lab pattern GLSL shaders | ACTIVE |
| `STAGE4_Part2B_v3FINAL.md` | v3-FINAL | Part 2B — LabReconfiguration, GameFocus | ACTIVE |
| `STAGE4_Core_Pages_v2_PART3.md` | v2 | Part 3 — Profile, quiz, settings | ACTIVE |
| `README.md` | — | Index | REF |

#### Stage 5: Gamification — `docs/stage5-gamification/` (5 files)

| File | Type | Parts | Status |
|------|------|-------|--------|
| `STAGE5_Gamification_Profile_PART1.md` | v2 | Part 1 — XP, cosmetics, avatar, sound | ACTIVE |
| `STAGE5_Parts23A_v3FINAL.md` | v3-FINAL | Parts 2-3A — Shaders | ACTIVE |
| `STAGE5_Parts23B_v3FINAL.md` | v3-FINAL | Parts 2-3B — XPVortex, badges, 3D | ACTIVE |
| `STAGE5_Parts23C_v3FINAL.md` | v3-FINAL | Parts 2-3C — Particles, ceremonies | ACTIVE |
| `README.md` | — | Index | REF |

#### Stage 6: Flagship Games — `docs/stage6-flagship/` (15 files)

| File | Type | Game | Status |
|------|------|------|--------|
| `STAGE6B_v3FINAL_A.md` | v3-FINAL | Pet Trainer — 3D components | ACTIVE |
| `STAGE6B_v3FINAL_B.md` | v3-FINAL | Pet Trainer — game file | ACTIVE |
| `STAGE6C_v3FINAL_A.md` | v3-FINAL | Neural Builder — 3D | ACTIVE |
| `STAGE6C_v3FINAL_B.md` | v3-FINAL | Neural Builder — game | ACTIVE |
| `STAGE6D_v2_PromptLab.md` | v2 | Prompt Lab — base game (prerequisite) | ACTIVE |
| `STAGE6D_v2_Enhancements.md` | v2 | Prompt Lab — enhancements | ACTIVE |
| `STAGE6D_v3FINAL_PartA.md` | v3-FINAL | Prompt Lab — 3D (additive to v2) | ACTIVE |
| `STAGE6D_v3FINAL_PartB.md` | v3-FINAL | Prompt Lab — enhanced game | ACTIVE |
| `STAGE6E_v3FINAL_A.md` | v3-FINAL | Agent Architect — 3D | ACTIVE |
| `STAGE6E_v3FINAL_B.md` | v3-FINAL | Agent Architect — game | ACTIVE |
| `STAGE6E_v3FINAL_C.md` | v3-FINAL | Agent Architect — verification | ACTIVE |
| `STAGE6F_v3FINAL_A.md` | v3-FINAL | Bias Detective — 3D | ACTIVE |
| `STAGE6F_v3FINAL_B.md` | v3-FINAL | Bias Detective — game | ACTIVE |
| `STAGE6F_v3FINAL_C.md` | v3-FINAL | Bias Detective — verification | ACTIVE |
| `STAGE6F_DebugFixes.md` | — | Debug fix log | REF ONLY |

#### Stage 7: Remaining Games — `docs/stage7-remaining-games/` (28 active + 7 superseded)

**7A — Tap & Quiz** (`7a-tap-quiz/`, 4 active):

| File | Games Covered | Status |
|------|---------------|--------|
| `STAGE7A_BatchA_TapQuiz_8Games.md` | AI Spy, Time Machine | ACTIVE |
| `STAGE7A_Part2_TokenChopper_AiArt.md` | Word Predictor, Token Chopper, AI Art Detective | ACTIVE |
| `STAGE7A_Part3_ToolPicker_DataShield.md` | Tool Picker, Data Shield | ACTIVE |
| `STAGE7A_Part4_RealOrFake_PredictionMarket.md` | Real or Fake, Prediction Market | ACTIVE |

**7B — Drag & Drop** (`7b-drag-drop/`, 3 active + 3 superseded):

| File | Games Covered | Status |
|------|---------------|--------|
| `STAGE7B_v3FINAL_PartA_SortToyBox3D_HumanVsMachine.md` | Sort Toy Box (3D), Human vs Machine | ACTIVE |
| `STAGE7B_v3FINAL_PartB_CodeBlocks3D_CodeBlocksGame.md` | Code Blocks (3D) | ACTIVE |
| `STAGE7B_v3FINAL_PartC_CareerExplorer_BatchVerification.md` | Career Explorer + verification | ACTIVE |
| `_SUPERSEDED/STAGE7B_Part1_SortToyBox_HumanVsMachine.md` | (v2 replaced by PartA) | SUPERSEDED |
| `_SUPERSEDED/STAGE7B_Part2_CodeBlocks_CareerExplorer.md` | (v2 replaced by PartB+C) | SUPERSEDED |
| `_SUPERSEDED/STAGE7B_CodeBlocks_v3FINAL.md` | (early v3 replaced by PartB) | SUPERSEDED |

**7C — Simulation** (`7c-simulation/`, 5 active + 3 superseded):

| File | Games Covered | Status |
|------|---------------|--------|
| `STAGE7C_Part1_TreatTrainer_SentimentScanner.md` | Treat Trainer, Sentiment Scanner | ACTIVE (v2) |
| `STAGE7C_Part2_LostInTranslation_NeuronRelay.md` | Lost in Translation, Neuron Relay | ACTIVE (v2) |
| `STAGE7C_v3FINAL_PartA_3D_Components.md` | ChatbotNodes3D, DataDetective3D | ACTIVE |
| `STAGE7C_v3FINAL_PartB_ChatbotBuilder.md` | Chatbot Builder (3D) | ACTIVE |
| `STAGE7C_v3FINAL_PartC_DataDetective.md` | Data Detective (3D) | ACTIVE |
| `_SUPERSEDED/STAGE7C_Part3_ChatbotBuilder_DataDetective_v2.md` | (v2 replaced) | SUPERSEDED |
| `_SUPERSEDED/STAGE7C_v3FINAL_ChatbotBuilder_V3_FullTreatment.md` | (draft replaced) | SUPERSEDED |
| `_SUPERSEDED/STAGE7C_v3FINAL_DataDetective_V3_FullTreatment.md` | (draft replaced) | SUPERSEDED |

**7D — Investigation** (`7d-investigation/`, 4 active + 2 reference):

| File | Games Covered | Status |
|------|---------------|--------|
| `STAGE7D_Part1_PixelInvestigator_FoolTheAI.md` | Pixel Investigator, Fool the AI | ACTIVE (v2) |
| `STAGE7D_v3FINAL_PartA_3D_Components.md` | RobotVacuum3D, CameraQuest3D, FutureForge3D | ACTIVE |
| `STAGE7D_v3FINAL_PartB_RobotVacuum_CameraQuest.md` | Robot Vacuum, Camera Quest (3D games) | ACTIVE |
| `STAGE7D_v3FINAL_PartC_FutureForge_Registry_Verification.md` | Future Forge + registry | ACTIVE |
| `STAGE7D_AUDIT_REPORT.md` | Audit findings | REF ONLY |
| `STAGE7D_ENHANCEMENTS.md` | Enhancement notes | REF ONLY |

**7E — Ethics & API** (`7e-ethics-api/`, 2 active):

| File | Games Covered | Status |
|------|---------------|--------|
| `STAGE7E_Part1_EthicsCourtroom_BuildClassifier.md` | Ethics Courtroom, Build a Classifier | ACTIVE |
| `STAGE7E_Part2_ApiExplorer_Registry.md` | API Explorer + registry | ACTIVE |

**7F — Band A** (`7f-band-a/`, 4 active + 1 reference):

| File | Games Covered | Status |
|------|---------------|--------|
| `STAGE7F_v3FINAL_PartA_MyFirstAiApp3D.md` | My First AI App — 3D | ACTIVE |
| `STAGE7F_v3FINAL_PartB_MyFirstAiAppGame.md` | My First AI App — game | ACTIVE |
| `STAGE7F_Part1_EmojiDecoder.md` | Emoji Decoder | ACTIVE (v2) |
| `STAGE7F_Part2_AiOrNot_Registry.md` | AI or Not + registry | ACTIVE (v2) |
| `STAGE7F_AUDIT_REPORT.md` | Audit findings | REF ONLY |

**7 Shared** (`7-shared/` + root):

| File | Content | Status |
|------|---------|--------|
| `STAGE 7 SHARED SYSTEMS.md` | Shared systems overview | ACTIVE |
| `STAGE 7 SHARED SYSTEMS - XP Popup + Completion Celebration.md` | XP + celebration | ACTIVE |

#### Stage 8: Parent Dashboard — `docs/stage8-parent-dashboard/` (6 files)

| File | Type | Parts | Status |
|------|------|-------|--------|
| `STAGE8_Parent_Dashboard_v2_PART1.md` | v2 | Part 1 — Tier config, Stripe, parent store | ACTIVE |
| `STAGE8_Parent_Dashboard_v2_PART2.md` | v2 | Part 2 — Dashboard, subscription, paywall | ACTIVE |
| `STAGE8_P3_v3FINAL_A.md` | v3-FINAL | Part 3A — ScrollJourney landing | ACTIVE |
| `STAGE8_P3_v3FINAL_B.md` | v3-FINAL | Part 3B — FeatureShowcase, StationPreview | ACTIVE |
| `STAGE8_P3_v3FINAL_C.md` | v3-FINAL | Part 3C — /pricing route, verification | ACTIVE |
| `README.md` | — | Index | REF |

#### Stage 9: Content Agent — `docs/stage9-content-agent/` (4 files)

| File | Type | Parts | Status |
|------|------|-------|--------|
| `STAGE9_Content_Agent_v2_PART1.md` | v2 | Part 1 — Agent pipeline, prompts, API | ACTIVE |
| `STAGE9_Content_Agent_v2_PART2.md` | v2 | Part 2 — Admin review dashboard | ACTIVE |
| `STAGE9_Content_Agent_v2_PART3.md` | v2 | Part 3 — Seed content (150+90+60) | ACTIVE |
| `README.md` | — | Index | REF |

#### Stage 10: Polish & Deploy — `docs/stage10-polish-deploy/` (3 files)

| File | Type | Parts | Status |
|------|------|-------|--------|
| `STAGE10_Polish_Deploy_v2_PART1.md` | v2 | Part 1 — A11y, SEO, CSP, PWA | ACTIVE |
| `STAGE10_Polish_Deploy_v2_PART2.md` | v2 | Part 2 — Game router, production config | ACTIVE |
| `README.md` | — | Index | REF |

### 2.6 Other Documentation Files

| File | Location | Purpose | Status |
|------|----------|---------|--------|
| `Stage_Documents_Master_Grid.html` | Repo root | Interactive document index | REF |
| `Stage_Documents_Master_Grid.pdf` | Repo root | Printable document reference | REF |
| `COCKPIT_ARCHITECTURE_CURRENT.json` | Repo root | Current cockpit architecture state | REF |
| `docs/stage6-flagship-games/README.md` | Stage 6 | Games listing info | REF |
| `docs/stage7-remaining-games/README.md` | Stage 7 | Overview of 7A-7F substages | REF |
| `docs/stage7-remaining-games/7-shared/README.md` | Stage 7 | Shared systems index | REF |

---
