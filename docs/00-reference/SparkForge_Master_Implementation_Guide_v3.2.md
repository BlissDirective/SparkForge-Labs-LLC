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

## SECTION 3: STAGE-BY-STAGE DOCUMENT-TO-CODE MAP

This is the **master cross-reference**: every stage document linked to every `/src/` file it creates or modifies. Use this to trace any file back to its origin, or to see the full scope of any stage before building.

Legend: **C** = Creates new file | **M** = Modifies existing file | **R** = Replaces entire file

---

### Stage 1: Foundation

#### STAGE1_Foundation_v2_PART1 — Config & Directory Structure

| Action | File Path |
|--------|-----------|
| C | `next.config.ts` |
| C | `tsconfig.json` |
| C | `tailwind.config.ts` |
| C | `postcss.config.js` |
| C | `.env.example` |
| C | `src/app/globals.css` |
| C | `src/app/layout.tsx` |
| C | `src/app/global-error.tsx` |
| C | `src/app/error.tsx` |
| C | `src/app/not-found.tsx` |
| C | `src/app/robots.ts` |
| C | `src/app/sitemap.ts` |

#### STAGE1_Foundation_v2_PART2 — Types, Stores, Hooks, Utils

| Action | File Path |
|--------|-----------|
| C | `src/types/index.ts` |
| C | `src/lib/utils.ts` |
| C | `src/lib/supabase/client.ts` |
| C | `src/lib/supabase/server.ts` |
| C | `src/lib/animations.ts` |
| C | `src/lib/feature-flags.ts` |
| C | `src/lib/webgpuDetection.ts` |
| C | `src/lib/3d/webgpuDetect.ts` |
| C | `src/lib/3d/cockpitConfig.ts` |
| C | `src/lib/audio/cockpitAudio.ts` |
| C | `src/stores/authStore.ts` |
| C | `src/stores/childStore.ts` |
| C | `src/stores/gameStore.ts` |
| C | `src/stores/toastStore.ts` |
| C | `src/stores/uiStore.ts` |
| C | `src/stores/deviceStore.ts` |
| C | `src/stores/cockpitStore.ts` |
| C | `src/stores/cockpitAtoms.ts` |
| C | `src/hooks/useDebounce.ts` |
| C | `src/hooks/useLocalStorage.ts` |
| C | `src/hooks/useSystemPreferences.ts` |
| C | `src/hooks/useAdaptiveCockpit.ts` |
| C | `src/middleware.ts` |
| C | `src/components/providers/QueryProvider.tsx` |

---

### Stage 2: Database & API

#### STAGE2_Database_API_v2_PART1 — DB Schema (SQL, run in Supabase)

| Action | File Path |
|--------|-----------|
| C | `sql/` directory (schema SQL — executed in Supabase, not /src/) |

#### STAGE2_Database_API_v2_PART2 — Validation, Config, Helpers

| Action | File Path |
|--------|-----------|
| C | `src/lib/validations.ts` |
| C | `src/lib/tier-config.ts` |
| C | `src/lib/rate-limit.ts` |
| C | `src/lib/api-helpers.ts` |

#### STAGE2_Database_API_v2_PART3 — API Routes (Auth, Children, Content)

| Action | File Path |
|--------|-----------|
| C | `src/app/api/auth/signup/route.ts` |
| C | `src/app/api/auth/login/route.ts` |
| C | `src/app/api/auth/logout/route.ts` |
| C | `src/app/api/auth/me/route.ts` |
| C | `src/app/api/auth/consent/route.ts` |
| C | `src/app/api/children/route.ts` |
| C | `src/app/api/children/[childId]/route.ts` |
| C | `src/app/api/content/route.ts` |
| C | `src/app/api/content/[slug]/route.ts` |

#### STAGE2_Database_API_v2_PART4 — API Routes (Progress, Gamification) + Hooks

| Action | File Path |
|--------|-----------|
| C | `src/app/api/progress/route.ts` |
| C | `src/app/api/progress/world/route.ts` |
| C | `src/app/api/progress/all-labs/route.ts` |
| C | `src/app/api/gamification/xp/route.ts` |
| C | `src/app/api/gamification/streak/route.ts` |
| C | `src/app/api/gamification/badges/route.ts` |
| C | `src/app/api/sessions/route.ts` |
| C | `src/app/api/health/route.ts` |
| C | `src/lib/api.ts` |
| C | `src/hooks/useChildren.ts` |
| C | `src/hooks/useContent.ts` |
| C | `src/hooks/useProgress.ts` |
| C | `src/hooks/useGamification.ts` |

---

### Stage 3: Auth, Layout & Station Frame

#### STAGE3_Auth_Layout_Shell_v2_PART1 — Auth Pages

| Action | File Path |
|--------|-----------|
| C | `src/app/(auth)/layout.tsx` |
| C | `src/app/(auth)/login/page.tsx` |
| C | `src/app/(auth)/signup/page.tsx` |
| C | `src/app/(auth)/reset-password/page.tsx` |
| C | `src/components/providers/AuthProvider.tsx` |

#### STAGE3_Auth_Layout_Shell_v2_PART2 — Dashboard Layout

| Action | File Path |
|--------|-----------|
| C | `src/app/(dashboard)/layout.tsx` |
| C | `src/app/(dashboard)/loading.tsx` |
| C | `src/app/(dashboard)/error.tsx` |
| C | `src/components/layout/Sidebar.tsx` |
| C | `src/components/shared/CelebrationOverlay.tsx` |
| C | `src/components/shared/ContinueBanner.tsx` |
| C | `src/components/shared/LoadingSkeleton.tsx` |
| C | `src/components/shared/LoadingScreen.tsx` |
| C | `src/components/shared/EmptyState.tsx` |
| C | `src/components/shared/ErrorBanner.tsx` |
| C | `src/components/shared/ToastContainer.tsx` |
| C | `src/hooks/useSessionTracker.ts` |
| C | `src/hooks/useStationMode.ts` |

#### STAGE3_Part3A_v3FINAL — StationFrame, 3D Shell, Shaders

| Action | File Path |
|--------|-----------|
| C | `src/components/3d/StationFrame.tsx` |
| C | `src/components/3d/CrystalHero.tsx` |
| C | `src/components/3d/AuroraBackground.tsx` |
| C | `src/components/3d/AmbientParticles.tsx` |
| C | `src/components/3d/LEDRim.tsx` |
| C | `src/components/providers/PageTransitionProvider.tsx` |
| C | `src/lib/3d/materials.ts` |
| C | `src/shaders/index.ts` |
| C | `src/hooks/useGSAPScroll.ts` |
| C | `src/app/(marketing)/layout.tsx` |
| C | `src/app/(marketing)/page.tsx` |

#### STAGE3_Part3B_v3FINAL — Emissive CSS, Onboarding, Landing

| Action | File Path |
|--------|-----------|
| C | `src/components/3d/OnboardingCrystal.tsx` |
| C | `src/shaders/dissolve.glsl` |
| C | `src/shaders/wormhole.glsl` |
| C | `src/app/(dashboard)/onboarding/page.tsx` |

---

### Stage 3-Hero: Hero Animation

#### HERO_ANIMATION_v3FINAL_PartA — Stores, Infrastructure, Shaders

| Action | File Path |
|--------|-----------|
| C | `src/shaders/tsl/crystallineLogoTSL.ts` |
| C | `src/shaders/tsl/electricVeinsTSL.ts` |
| C | `src/lib/3d/voronoiFracture.ts` |
| C | `src/lib/3d/heroSplines.ts` |
| M | `src/stores/uiStore.ts` (+skipIntroAnimation) |
| M | `src/stores/deviceStore.ts` (+gpuTier, +stripeCount) |

#### HERO_ANIMATION_v3FINAL_PartB — Particles, Audio, Orchestrator

| Action | File Path |
|--------|-----------|
| C | `src/lib/3d/heroParticleCompute.ts` |
| C | `src/lib/3d/heroParticleRender.ts` |
| C | `src/lib/audio/heroAudio.ts` |
| C | `src/hooks/useHeroAnimation.ts` |
| C | `src/components/3d/HeroAnimation.tsx` |
| M | `src/components/3d/_SUPERSEDED/CrystalShatter.tsx` (archived) |

---

### Stage 3-Cockpit: CPA v2.0

#### COCKPIT_CPA2_v3FINAL_PartA — Canvas, Camera, Panel Geometry

| Action | File Path |
|--------|-----------|
| C | `src/components/3d/CockpitCanvas.tsx` |
| C | `src/components/3d/CameraSystem.tsx` |
| C | `src/components/3d/CockpitPanels.tsx` |
| C | `src/components/3d/SidePanels.tsx` |
| C | `src/components/3d/HolographicHUD.tsx` |
| C | `src/components/3d/StatusBar3D.tsx` |
| C | `src/components/3d/CockpitStructuralDetail.tsx` |
| C | `src/components/3d/CockpitFloor3D.tsx` |
| M | `src/stores/cockpitStore.ts` (spatial nav, skins, heroPhase) |

#### COCKPIT_CPA2_v3FINAL_PartB — Spatial Dashboard, HUD, Transitions, Audio

| Action | File Path |
|--------|-----------|
| C | `src/components/3d/SpatialDashboard.tsx` |
| C | `src/components/3d/HolographicLabMap.tsx` |
| C | `src/components/3d/InteractiveConsole3D.tsx` |
| C | `src/components/3d/AmbientNPCs.tsx` |
| C | `src/components/3d/DynamicEnvironment.tsx` |
| C | `src/components/3d/VolumetricFog3D.tsx` |
| C | `src/components/3d/CeremonyFX.tsx` |
| C | `src/components/3d/WormholeTransition.tsx` |
| C | `src/components/3d/MiniMapOverlay3D.tsx` |
| C | `src/components/3d/CockpitSkinManager.tsx` |
| C | `src/hooks/useCockpitAudio.ts` |
| C | `src/hooks/useSpatialNavigation.ts` |
| M | `src/components/3d/StationFrame.tsx` (→ thin wrapper) |
| M | `src/components/3d/LEDRim.tsx` (1500 LEDs, emissive 3.0) |

---

### Stage 3-Login3D: Login Enhancement + Demo Login

#### LOGIN_3D_v3FINAL_PartA — 3D Portal, Demo Infrastructure

| Action | File Path |
|--------|-----------|
| C | `src/lib/demo-session.ts` |
| C | `src/components/3d/LoginPortal3D.tsx` |
| C | `src/components/3d/LoginParticles3D.tsx` |
| C | `src/components/auth/DemoLoginButton.tsx` |
| C | `src/components/auth/DemoSessionBanner.tsx` |
| C | `src/app/api/auth/demo/route.ts` |
| M | `src/stores/authStore.ts` (+isDemoMode, +demoSession) |
| R | `src/app/(auth)/layout.tsx` (add 3D canvas layer) |

#### LOGIN_3D_v3FINAL_PartB — Enhanced Login, Demo Guards

| Action | File Path |
|--------|-----------|
| C | `src/hooks/useDemoSession.ts` |
| C | `src/components/auth/DemoGuard.tsx` |
| C | `src/components/auth/LoginFormCard.tsx` |
| R | `src/app/(auth)/login/page.tsx` (enhanced with Demo button) |
| M | `src/components/providers/AuthProvider.tsx` (demo hydration) |
| M | `src/app/(dashboard)/layout.tsx` (add DemoGuard + banner) |

---

### Stage 4: Core Pages & Lab Reconfiguration

#### STAGE4_Core_Pages_v2_PART1 — Dashboard Home, Data Hooks

| Action | File Path |
|--------|-----------|
| R | `src/hooks/useChildren.ts` (replaces Stage 2 stub) |
| R | `src/hooks/useContent.ts` (replaces Stage 2 stub) |
| R | `src/hooks/useProgress.ts` (replaces Stage 2 stub) |
| R | `src/hooks/useGamification.ts` (replaces Stage 2 stub) |
| C | `src/app/(dashboard)/home/page.tsx` |
| C | `src/app/(dashboard)/labs/page.tsx` |
| C | `src/app/(dashboard)/labs/[labId]/page.tsx` |
| C | `src/app/(dashboard)/arcade/page.tsx` |
| C | `src/app/(dashboard)/arcade/[gameSlug]/page.tsx` |

#### STAGE4_Part2A_v3FINAL — Lab Pattern GLSL Shaders

| Action | File Path |
|--------|-----------|
| C | `src/shaders/labPatterns/index.ts` |
| C | `src/components/3d/LabPatternBackground.tsx` |

#### STAGE4_Part2B_v3FINAL — Transitions, Station Mode

| Action | File Path |
|--------|-----------|
| C | `src/components/transitions/LabReconfiguration.tsx` |
| C | `src/components/transitions/GameFocusSequence.tsx` |
| M | `src/hooks/useStationMode.ts` (full implementation) |

#### STAGE4_Core_Pages_v2_PART3 — Profile, Content, Settings

| Action | File Path |
|--------|-----------|
| C | `src/app/(dashboard)/profile/page.tsx` |
| C | `src/app/(dashboard)/settings/page.tsx` |
| C | `src/app/(dashboard)/content/[slug]/page.tsx` |
| C | `src/components/content/LessonViewer.tsx` |
| C | `src/components/content/QuizEngine.tsx` |
| C | `src/components/content/SparkFactViewer.tsx` |
| C | `src/components/content/CompletionIndicator.tsx` |
| C | `src/components/labs/LabConnectionMap.tsx` |

---

### Stage 5: Gamification & Visual FX

#### STAGE5_Gamification_Profile_PART1 — XP, Cosmetics, Avatar, Sound

| Action | File Path |
|--------|-----------|
| C | `src/lib/gamification.ts` |
| C | `src/lib/cosmetics.ts` |
| C | `src/lib/avatar.ts` |
| C | `src/lib/dailyChallenge.ts` |
| C | `src/hooks/useSoundEffect.ts` |
| C | `src/components/gamification/BadgeDisplay.tsx` |
| C | `src/components/gamification/BadgeGrid.tsx` |
| C | `src/components/gamification/LevelProgress.tsx` |
| C | `src/components/gamification/TrophyRoom.tsx` |
| C | `src/components/gamification/index.ts` |

#### STAGE5_Parts23A_v3FINAL — Reward Shaders

| Action | File Path |
|--------|-----------|
| M | `src/shaders/index.ts` (add badge/card reward shaders) |

#### STAGE5_Parts23B_v3FINAL — XPVortex, Badges, Profile 3D

| Action | File Path |
|--------|-----------|
| C | `src/components/3d/XPVortex.tsx` |
| C | `src/components/3d/BadgePedestal3D.tsx` |
| C | `src/components/3d/BadgeLevitate3D.tsx` |
| C | `src/components/3d/SparkCard3D.tsx` |
| C | `src/components/ui/ParticleIntensitySlider.tsx` |

#### STAGE5_Parts23C_v3FINAL — Particles, Ceremonies

| Action | File Path |
|--------|-----------|
| C | `src/components/3d/GameParticles3D.tsx` |
| C | `src/components/3d/LevelUpExplosion.tsx` |
| C | `src/components/3d/StreakFlame3D.tsx` |
| C | `src/components/3d/GameCelebration.tsx` |

---

### Stage 6: Flagship Games (5 games)

#### STAGE6B_v3FINAL_A/B — AI Pet Trainer (Lab 2)

| Action | File Path |
|--------|-----------|
| C | `src/components/3d/PetCreature3D.tsx` |
| C | `src/components/3d/Pet3DScene.tsx` |
| C | `src/components/3d/PetCompanion3D.tsx` |
| C | `src/components/3d/PetDataLab3D.tsx` |
| C | `src/components/3d/environments/PetTrainerEnvironment.tsx` |
| C | `src/components/games/PetTrainerGame.tsx` |
| C | `src/hooks/usePetTrainerAudio.ts` |

#### STAGE6C_v3FINAL_A/B — Neural Builder (Lab 3)

| Action | File Path |
|--------|-----------|
| C | `src/components/3d/NeuralNetwork3D.tsx` |
| C | `src/components/3d/environments/NeuralBuilderEnvironment.tsx` |
| C | `src/components/games/NeuralBuilderGame.tsx` |
| C | `src/hooks/useNetworkAudio.ts` |

#### STAGE6D (v2 + v3FINAL_A/B) — Prompt Lab (Lab 4)

| Action | File Path |
|--------|-----------|
| C | `src/components/3d/PromptBubble3D.tsx` |
| C | `src/components/3d/PromptBubble3DScene.tsx` |
| C | `src/components/3d/PromptScore3D.tsx` |
| C | `src/components/3d/environments/PromptLabEnvironment.tsx` |
| C | `src/components/games/PromptLabGame.tsx` |
| C | `src/app/api/ai/prompt-lab/route.ts` |
| C | `src/hooks/usePromptLabAudio.ts` |

#### STAGE6E_v3FINAL_A/B/C — Agent Architect (Lab 5)

| Action | File Path |
|--------|-----------|
| C | `src/components/3d/AgentPipeline3D.tsx` |
| C | `src/components/3d/environments/AgentArchitectEnvironment.tsx` |
| C | `src/components/games/AgentArchitectGame.tsx` |
| C | `src/hooks/useAgentAudio.ts` |

#### STAGE6F_v3FINAL_A/B/C — Bias Detective (Lab 6)

| Action | File Path |
|--------|-----------|
| C | `src/components/3d/BiasScales3D.tsx` |
| C | `src/components/3d/BiasDecisionTree3D.tsx` |
| C | `src/components/3d/environments/BiasDetectiveEnvironment.tsx` |
| C | `src/components/games/BiasDetectiveGame.tsx` |
| C | `src/hooks/useBiasDetectiveAudio.ts` |

---

### Stage 7: Remaining Games (30 games)

#### 7A — Tap & Quiz (9 games)

| Doc | Creates |
|-----|---------|
| BatchA_TapQuiz | `games/AiSpyGame.tsx`, `games/TimeMachineGame.tsx` |
| Part2 | `games/WordPredictorGame.tsx`, `games/TokenChopperGame.tsx`, `games/AiArtDetectiveGame.tsx` |
| Part3 | `games/ToolPickerGame.tsx`, `games/DataShieldGame.tsx` |
| Part4 | `games/RealOrFakeGame.tsx`, `games/PredictionMarketGame.tsx` |

#### 7B — Drag & Drop (4 games, v3-FINAL)

| Doc | Creates |
|-----|---------|
| v3FINAL_PartA | `3d/SortScene3D.tsx`, `3d/SortFeatureViz3D.tsx`, `3d/environments/SortToyBoxEnvironment.tsx`, `games/SortToyBoxGame.tsx`, `games/HumanVsMachineGame.tsx`, `hooks/useSortAudio.ts` |
| v3FINAL_PartB | `3d/CodeBlocks3D.tsx`, `3d/environments/CodeBlocksEnvironment.tsx`, `games/CodeBlocksGame.tsx` |
| v3FINAL_PartC | `3d/environments/CareerExplorerEnvironment.tsx`, `games/CareerExplorerGame.tsx` |

#### 7C — Simulation (6 games, mixed)

| Doc | Creates |
|-----|---------|
| Part1 (v2) | `games/TreatTrainerGame.tsx`, `games/SentimentScannerGame.tsx` |
| Part2 (v2) | `games/LostInTranslationGame.tsx`, `games/NeuronRelayGame.tsx` |
| v3FINAL_PartA | `3d/ChatbotNodes3D.tsx`, `3d/DataDetective3D.tsx`, `3d/environments/ChatbotBuilderEnvironment.tsx`, `3d/environments/DataDetectiveEnvironment.tsx` |
| v3FINAL_PartB | `games/ChatbotBuilderGame.tsx` |
| v3FINAL_PartC | `games/DataDetectiveGame.tsx` |

#### 7D — Investigation (5 games, mixed)

| Doc | Creates |
|-----|---------|
| Part1 (v2) | `games/PixelInvestigatorGame.tsx`, `games/FoolTheAiGame.tsx` |
| v3FINAL_PartA | `3d/RobotVacuum3D.tsx`, `3d/CameraQuest3D.tsx`, `3d/FutureForge3D.tsx`, `3d/environments/RobotVacuumEnvironment.tsx`, `3d/environments/CameraQuestEnvironment.tsx`, `3d/environments/FutureForgeEnvironment.tsx` |
| v3FINAL_PartB | `games/RobotVacuumGame.tsx`, `games/CameraQuestGame.tsx` |
| v3FINAL_PartC | `games/FutureForgeGame.tsx` |

#### 7E — Ethics & API (3 games, v2)

| Doc | Creates |
|-----|---------|
| Part1 | `games/EthicsCourtroomGame.tsx`, `games/BuildClassifierGame.tsx` |
| Part2 | `games/ApiExplorerGame.tsx` |

#### 7F — Band A (3 games, mixed)

| Doc | Creates |
|-----|---------|
| v3FINAL_PartA | `3d/MyFirstAiApp3D.tsx`, `3d/environments/MyFirstAiAppEnvironment.tsx` |
| v3FINAL_PartB | `games/MyFirstAiAppGame.tsx` |
| Part1 (v2) | `games/EmojiDecoderGame.tsx` |
| Part2 (v2) | `games/AiOrNotGame.tsx`, `config/gameRegistry.ts` (final 35-entry update) |

#### 7 Shared — Systems

| Doc | Creates |
|-----|---------|
| Shared Systems | `components/game/GameShell.tsx`, `components/game/XPPopup.tsx`, `components/game/GameCompleteCelebration.tsx`, `components/game/StreakFire.tsx` |
| XP Celebration | `components/shared/StepIndicator.tsx`, `components/shared/FeatureGate.tsx` |

---

### Stage 8: Parent Dashboard

#### STAGE8_Parent_Dashboard_v2_PART1 — Tier Config, Stripe, Store

| Action | File Path |
|--------|-----------|
| M | `src/lib/tier-config.ts` (APPEND tier extensions) |
| C | `src/stores/parentStore.ts` |
| C | `src/middleware/tierCheck.ts` |
| C | `src/hooks/useParentDashboard.ts` |
| C | `src/hooks/useSessionTimer.ts` |
| C | `src/app/api/stripe/checkout/route.ts` |
| C | `src/app/api/stripe/portal/route.ts` |
| C | `src/app/api/stripe/webhook/route.ts` |
| C | `src/app/api/parent/dashboard/route.ts` |

#### STAGE8_Parent_Dashboard_v2_PART2 — Dashboard Pages, Components

| Action | File Path |
|--------|-----------|
| C | `src/app/(dashboard)/parent/page.tsx` |
| C | `src/app/(dashboard)/parent/add-child/page.tsx` |
| C | `src/app/(dashboard)/parent/subscription/page.tsx` |
| C | `src/components/parent/UpgradePrompt.tsx` |
| C | `src/components/parent/ParentLoadingSkeleton.tsx` |
| C | `src/components/parent/TimeLimitBanner.tsx` |
| C | `src/components/parent/PaywallModal.tsx` |

#### STAGE8_P3_v3FINAL_A/B/C — Landing Page, Pricing

| Action | File Path |
|--------|-----------|
| C | `src/components/landing/ScrollJourney.tsx` |
| C | `src/components/landing/FeatureShowcase.tsx` |
| C | `src/components/landing/StationPreview.tsx` |
| C | `src/components/landing/LabDiscoveryRing.tsx` |
| C | `src/app/(marketing)/pricing/page.tsx` |

---

### Stage 9: Content Agent

#### STAGE9_Content_Agent_v2_PART1 — Pipeline, Prompts, API

| Action | File Path |
|--------|-----------|
| C | `src/lib/agent/prompts.ts` |
| C | `src/lib/agent/readability.ts` |
| C | `src/lib/agent/pipeline.ts` |
| C | `src/lib/agent/moderation.ts` |
| C | `src/app/api/agent/run/route.ts` |
| C | `src/app/api/agent/schedule/route.ts` |
| C | `src/app/api/ai/guide/route.ts` |

#### STAGE9_Content_Agent_v2_PART2 — Admin Review Dashboard

| Action | File Path |
|--------|-----------|
| C | `src/app/(dashboard)/admin/content/page.tsx` |
| C | `src/app/api/agent/review/route.ts` |

#### STAGE9_Content_Agent_v2_PART3 — Seed Content

| Action | File Path |
|--------|-----------|
| C | `src/lib/agent/seed.ts` |

---

### Stage 10: Polish & Deploy

#### STAGE10_Polish_Deploy_v2_PART1 — Accessibility, SEO, PWA

| Action | File Path |
|--------|-----------|
| C | `src/stores/accessibilityStore.ts` |
| C | `src/components/accessibility/A11yProvider.tsx` |
| C | `src/components/accessibility/AccessibilityToolbar.tsx` |
| C | `src/app/globals-a11y.css` |
| C | `src/components/ui/ErrorBoundary.tsx` |
| C | `src/components/ui/OfflineBanner.tsx` |
| C | `src/components/ui/LoadingSkeleton.tsx` |
| M | `src/app/not-found.tsx` (enhanced 404) |

#### STAGE10_Polish_Deploy_v2_PART2 — Game Router, Production Config

| Action | File Path |
|--------|-----------|
| M | `next.config.ts` (production CSP, headers) |
| M | `src/app/(dashboard)/arcade/[gameSlug]/page.tsx` (35-game router) |
| C | `vercel.json` |
| C | `sentry.client.config.ts` |
| C | `sentry.server.config.ts` |
| C | `sentry.edge.config.ts` |

---
