# SPARKFORGE — MASTER IMPLEMENTATION GUIDE

**Version:** 4.1 | **Date:** April 3, 2026 | **For:** Claude Code (Local Terminal + Remote Mobile)
**Supersedes:** Master Implementation Guide v4.0 (March 29, 2026) — Full 3D UI Migration complete (7 phases, 49 components, 150 design decisions). AmbientParticles removed (Decision 20.0). 3D component count updated to ~172. Stores updated to 15 (added cockpitUIStore, extended sceneStore). Added 4 new UI migration reference documents.
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

- **Evaluate each stage's v3-FINAL documents before building.** V3-FINAL documents fall into two categories: **(1) Replacement** — the v3-FINAL fully supersedes v2 and is the ONLY source needed (e.g., Stage 7B where v2 is archived to `_SUPERSEDED/`). **(2) Additive** — the v3-FINAL adds 3D/shader enhancements on top of v2; both v2 AND v3-FINAL are required, with v2 built first (e.g., Stages 5, 6D, 7C, 7D, 7F). Check each document's header for "Supersedes" or "Additive" designation. When a v3-FINAL is additive, the v2 is NOT superseded — it remains a prerequisite (see CLAUDE.md Section 3.2).
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
| 2 | **Stage documents** | `docs/stage*/` folders | Complete copy-paste code per stage |
| 3 | **This file (v4.0)** | `docs/00-reference/` | Ultra-comprehensive file map, registries |
| 4 | **PROGRESS.md** | Repo root | Current build status, phase tracking |
| 5 | **Master Directory v1.2** | `docs/00-reference/` | 26-phase flow map, file registry |
| 6 | **GCUD V10.2** | `docs/00-reference/` | Source of truth for game content + status |
| 7 | **3D-Component-Registry.md** | `docs/00-reference/` | ~140-component 3D registry with tiers/budgets |
| 8 | **Per-Stage-Playbooks.md** | `docs/00-reference/` | Full build playbooks for all 10 stages |
| 9 | **CPA v2.0** | `docs/00-reference/` | 3D Panoramic Cockpit full spec |
| 10 | **ERROR_HANDLING_AUTOFIX_GUIDE.md** | `docs/00-reference/` | Build/TS/import error patterns |

### Environment

- **Runtime:** Node.js 20+ LTS
- **Framework:** Next.js 15 (React 19, Turbopack, App Router)
- **Language:** TypeScript strict mode
- **Styling:** Tailwind CSS 4 (Oxide engine)
- **3D:** React Three Fiber v9 + drei + postprocessing (Three.js r183+, TSL, WebGPU/WebGL2)
- **State:** Zustand (15 stores) + Jotai (3D atoms)
- **Testing:** Vitest + Playwright + MSW
- **Deployment:** Vercel

### Repo Statistics (as of March 29, 2026)

| Metric | Count |
|--------|-------|
| Source files (`/src/`) | 412 |
| Documentation files (`/docs/`) | 128 |
| Root config/doc files | 25+ |
| Games (all functional) | 35 |
| 3D components | ~172 |
| Stores | 15 |
| Hooks | 36 |
| API routes | 33 |
| Shaders (TSL + GLSL) | 24 |
| Stage documents (active) | 80+ |
| Superseded documents | 8 |
| Commits (past 30 days) | 50 |
| Decision locks | 84 (48 core + 4 OD + 12 CPA2 + 20 D3D) |

---

## Code Audit Status (March 30, 2026)

A comprehensive full-repo code audit was completed on March 30, 2026, covering all 497 source files, 127 docs, and 18 SQL files. **154 issues found and fixed** (21 Critical, 42 High, 52 Medium, 39 Low).

### Full 3D UI Migration Status (April 3, 2026)

The Full 3D UI Migration is **complete** — 7 phases, 49 components, 150 design decisions. All dashboard UI now renders in 3D via the persistent CockpitCanvas. AmbientParticles removed (Decision 20.0). 3D component count increased from ~140 to ~172. Store count increased from 13 to 15 (added cockpitUIStore; sceneStore extended with gameHUDContent).

### Flagship Game Audit (April 7, 2026)

A comprehensive playability/interactivity audit of all 6 flagship games was completed on April 7, 2026. **17 bugs fixed** (5 Critical, 5 High, 7 Medium), **all 6 flagships expanded 2-3x content depth**, and **AI content generation infrastructure** added.

| Phase | Scope | Files |
|-------|-------|-------|
| **A** | 5 gameStore/GameShell bugs (all 35 games) | `gameStore.ts`, `GameShell.tsx` |
| **B** | 8 Neural Builder bugs | `NeuralBuilderGame.tsx` |
| **C** | Sort Toy Box expansion (652→1,122 lines) | `SortToyBoxGame.tsx` |
| **D** | Neural Builder Band A + content (1,531→1,863 lines) | `NeuralBuilderGame.tsx` |
| **D2** | 4 flagship expansions (Pet/Prompt/Agent/Bias) | 4 game files |
| **E** | AI content generation (3 new files) | `ai-content-generator.ts`, `generate-content/route.ts`, `useAIContent.ts` |
| **F** | Per-game AI integration | 5 game files |

**Key changes:**
- `gameStore.ts`: `setMaxScore()` action added, `advanceRound()` off-by-one fixed, `resetGame()` clears all state
- `GameShell.tsx`: Reward pipeline wrapped in try/catch with auto-retry
- All 6 flagship games: 2-3x seed content expansion (new challenges, modes, categories, cases)
- New files: `src/lib/ai-content-generator.ts`, `src/app/api/ai/generate-content/route.ts`, `src/hooks/useAIContent.ts`
- Source: `flagship-game-content-audit(04.06.2026).md`

### FL-Lite Game Content Audit (April 8-9, 2026)

**Status:** COMPLETE — All 9 FL-Lite games audited and enhanced.

| Metric | Before | After |
|--------|--------|-------|
| Total bugs found | — | 43 (5C, 11H, 18M, 9L) |
| Bugs fixed | — | 21 (5C, 11H, 5M) |
| Content items | ~163 | ~500+ (~3x) |
| AI prompt templates | 0 | 27 (3 per game) |
| useGameContent() | Dormant | Active (all 9 games) |
| Admin curation | Flagship only | Extended to FL-Lite |
| UI components | — | DifficultySelector, GameProgressTracker, AIContentBadge |
| Difficulty tiers | None | Easy/Medium/Hard/Expert with age-band gating |

### Key Architecture Updates Applied During Audit
- **D3D-1 Compliance**: All `useIsMobile()`, `GenericGameParticles`, CSS fallback code removed from source and stage docs
- **D3D-2 Compliance**: All `useLOD`, `LODWrapper`, LOD atoms removed; `COCKPIT_LOD` replaced with `COCKPIT_DETAIL`
- **D3D-3 Compliance**: Triangle budgets updated across all docs (Flagship 20M, FL-Lite 10M, Standard 5M)
- **D3D-B1 Compliance**: `gameActive`/`setGameActive` deprecated in `uiStore`; `useStationMode` reads from `sceneStore`
- **CPA2-1**: Standalone Canvas violations flagged in GameFocusSequence, OnboardingCrystal
- **SQL**: Duplicate seed files merged (badges, content, cron); RUN_ORDER.md comprehensive
- **Tailwind**: Migrated to v4 (`@import "tailwindcss"` + `@config` compatibility)
- **Security**: COPPA consent uses `getUser()`, SQL functions use SECURITY INVOKER
- **New Pages**: `/parent/prompt-history` and `/parent/export` fully created
- **Centralized Config**: Lab names/colors in `src/config/labs.ts`, Stripe version in `src/lib/stripe.ts`

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

### 2.2 Reference Documents — `docs/00-reference/` (21 active + 1 superseded)

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
| `Master-SparkForge-UI-Design-Change.md` | v1.2 | Full 3D UI migration spec — 7 phases, 49 components, 150 decisions | ACTIVE | 3D UI Migration |
| `SparkForge-Full-ControlScreen.json` | v1.2 | Complete cockpit control screen layout definition (1,081 lines, 11 sections) | ACTIVE | 3D UI Migration |
| `DESIGN_DECISIONS_LOG.md` | current | Design decisions log for 3D UI migration (150 decisions) | ACTIVE | 3D UI Migration |
| `SESSION_REFERENCE.md` | current | Session reference for 3D UI migration phases and implementation notes | ACTIVE | 3D UI Migration |
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
| C | `src/components/3d/AmbientParticles.tsx` | **REMOVED (Decision 20.0)** |
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
| C | `src/components/marketing/MarketingHeader.tsx` |
| C | `src/components/marketing/MarketingFooter.tsx` |
| C | `src/app/(marketing)/pricing/page.tsx` |
| C | `src/app/(marketing)/privacy/page.tsx` |
| C | `src/app/(marketing)/terms/page.tsx` |

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

## SECTION 4: COMPLETE SOURCE CODE REGISTRY

Every file in `/src/` organized by directory, with its stage of origin. Files created during audit/enhancement cycles (not in any stage doc) are marked with their commit origin.

### 4.1 App Routes — `src/app/` (59 files)

| File | Stage Origin | Notes |
|------|-------------|-------|
| `layout.tsx` | Stage 1 P1 | Root layout with fonts, providers |
| `globals.css` | Stage 1 P1 | Tailwind + Frost-Prismatic tokens |
| `globals-a11y.css` | Stage 10 P1 | Accessibility CSS layer |
| `error.tsx` | Stage 1 P1 | Root error boundary |
| `global-error.tsx` | Stage 1 P1 | Global error boundary |
| `not-found.tsx` | Stage 1 P1 / Stage 10 | Enhanced 404 |
| `robots.ts` | Stage 1 P1 | SEO robots |
| `sitemap.ts` | Stage 1 P1 | SEO sitemap |
| `(auth)/layout.tsx` | Stage 3 P1 / Login3D PartA | Auth layout (replaced with 3D canvas) |
| `(auth)/login/page.tsx` | Stage 3 P1 / Login3D PartB | Login (replaced with Demo button) |
| `(auth)/signup/page.tsx` | Stage 3 P1 | Signup |
| `(auth)/reset-password/page.tsx` | Stage 3 P1 | Password reset |
| `(dashboard)/layout.tsx` | Stage 3 P2 / Login3D PartB | Dashboard shell + DemoGuard |
| `(dashboard)/loading.tsx` | Stage 3 P2 | Loading state |
| `(dashboard)/error.tsx` | Stage 3 P2 | Dashboard error |
| `(dashboard)/home/page.tsx` | Stage 4 P1 | Dashboard home |
| `(dashboard)/labs/page.tsx` | Stage 4 P1 | Labs map |
| `(dashboard)/labs/[labId]/page.tsx` | Stage 4 P1 | Individual lab |
| `(dashboard)/arcade/page.tsx` | Stage 4 P1 | Arcade listing |
| `(dashboard)/arcade/[gameSlug]/page.tsx` | Stage 4 P1 / Stage 10 | Game router (35 games) |
| `(dashboard)/profile/page.tsx` | Stage 4 P3 | Player profile |
| `(dashboard)/settings/page.tsx` | Stage 4 P3 | Settings |
| `(dashboard)/content/[slug]/page.tsx` | Stage 4 P3 | Content viewer |
| `(dashboard)/onboarding/page.tsx` | Stage 3 P3B | Onboarding flow |
| `(dashboard)/badges/page.tsx` | Stage 5 P1 | Badge collection |
| `(dashboard)/parent/page.tsx` | Stage 8 P2 | Parent dashboard |
| `(dashboard)/parent/add-child/page.tsx` | Stage 8 P2 | Add child |
| `(dashboard)/parent/subscription/page.tsx` | Stage 8 P2 | Subscription management |
| `(dashboard)/admin/content/page.tsx` | Stage 9 P2 | Admin content review |
| `(marketing)/layout.tsx` | Stage 3 P3A / Audit | Marketing shell (shared header + footer + aurora bg) |
| `(marketing)/page.tsx` | Stage 3 P3A | Landing page |
| `(marketing)/pricing/page.tsx` | Stage 8 P3C | Pricing page |
| `(marketing)/privacy/page.tsx` | Audit CRIT-005 | Privacy Policy (COPPA-compliant, 13 sections) |
| `(marketing)/terms/page.tsx` | Audit CRIT-005 | Terms of Service (14 sections) |
| `api/auth/signup/route.ts` | Stage 2 P3 | Auth API |
| `api/auth/login/route.ts` | Stage 2 P3 | Auth API |
| `api/auth/logout/route.ts` | Stage 2 P3 | Auth API |
| `api/auth/me/route.ts` | Stage 2 P3 | Auth API |
| `api/auth/consent/route.ts` | Stage 2 P3 / Audit CRIT-002 | Consent API (secured with session auth + rate limiting) |
| `api/auth/callback/route.ts` | Audit HIGH-009 | OAuth/magic link callback handler |
| `api/auth/demo/route.ts` | Login3D PartA | Demo session API |
| `api/children/route.ts` | Stage 2 P3 | Children CRUD |
| `api/children/[childId]/route.ts` | Stage 2 P3 | Child by ID |
| `api/content/route.ts` | Stage 2 P3 | Content API |
| `api/content/[slug]/route.ts` | Stage 2 P3 | Content by slug |
| `api/progress/route.ts` | Stage 2 P4 | Progress API |
| `api/progress/world/route.ts` | Stage 2 P4 | Lab progress |
| `api/progress/all-labs/route.ts` | Stage 2 P4 | All labs progress |
| `api/gamification/xp/route.ts` | Stage 2 P4 | XP API |
| `api/gamification/streak/route.ts` | Stage 2 P4 | Streak API |
| `api/gamification/badges/route.ts` | Stage 2 P4 | Badges API |
| `api/sessions/route.ts` | Stage 2 P4 | Session tracking |
| `api/health/route.ts` | Stage 2 P4 | Health check |
| `api/ai/guide/route.ts` | Stage 9 P1 | AI Guide chat |
| `api/ai/prompt-lab/route.ts` | Stage 6D | Prompt Lab AI |
| `api/stripe/checkout/route.ts` | Stage 8 P1 | Stripe checkout |
| `api/stripe/portal/route.ts` | Stage 8 P1 | Stripe portal |
| `api/stripe/webhook/route.ts` | Stage 8 P1 | Stripe webhook |
| `api/parent/dashboard/route.ts` | Stage 8 P1 | Parent data |
| `api/agent/run/route.ts` | Stage 9 P1 | Agent trigger |
| `api/agent/schedule/route.ts` | Stage 9 P1 | Agent cron |
| `api/agent/review/route.ts` | Stage 9 P2 | Content review |
| `api/agent/architect/route.ts` | Enh: S9 Phase 1 | Architect pipeline |
| `api/agent/trending/route.ts` | Enh: S9 Phase 1 | Trending research |
| `api/agent/game-generator/route.ts` | Enh: S9 Phase 1 | Game generator |

### 4.2 Stores — `src/stores/` (15 files)

| File | Stage Origin | Key State |
|------|-------------|-----------|
| `authStore.ts` | Stage 1 P2 / Login3D | user, session, isDemoMode, demoSession |
| `childStore.ts` | Stage 1 P2 | children[], activeChild, xp, level, badges |
| `gameStore.ts` | Stage 1 P2 | currentGame, phase, score, rounds |
| `toastStore.ts` | Stage 1 P2 | toasts[], addToast/removeToast |
| `uiStore.ts` | Stage 1 P2 / Hero | sidebar, celebration, labColor, skipIntroAnimation, cockpitMode |
| `deviceStore.ts` | Stage 1 P2 / Hero | gpuTier, stripeCount, desktop-ultra hardcoded |
| `cockpitStore.ts` | Stage 1 P2 / CPA2 | spatialView, focusedLabId, heroPhase, cockpitSkin, spatialAudioVolume, eventAudioVolume, mechanicalAudioDensity, labAudioEnabled |
| `cockpitAtoms.ts` | Stage 3 (Phase 1-3) | Jotai atoms for cockpit 3D state |
| `parentStore.ts` | Stage 8 P1 | subscription, children, timeLimit |
| `accessibilityStore.ts` | Stage 10 P1 | fontSize, contrast, reducedMotion |
| `sceneStore.ts` | Enh: D3D Part A | activeScene, activeGameId, transition state, gameHUDContent, centerContentType, centerContentProps |
| `guideStore.ts` | Enh: S9 Batch 1 | AI Guide avatar state |
| `cockpitBroadcastStore.ts` | Enh: S1 Batch A | Cross-panel event bus, 16 event types |
| `cockpitUIStore.ts` | 3D UI Migration | Cockpit UI panel state, quadrant layout, panel visibility, 3D UI interaction state |

### 4.3 Hooks — `src/hooks/` (35 files)

| File | Stage Origin | Purpose |
|------|-------------|---------|
| `useAdaptiveCockpit.ts` | Stage 1 P2 | Cockpit adaptation |
| `useAgentAudio.ts` | Stage 6E | Agent Architect audio |
| `useAmbientSoundscape.ts` | Enh: Cockpit audio | Ambient soundscape |
| `useBiasDetectiveAudio.ts` | Stage 6F | Bias Detective audio |
| `useBranchingLesson.ts` | Enh: S9 Phase 1 | Interactive branching lessons |
| `useChildren.ts` | Stage 2 P4 → Stage 4 P1 | Children data (replaced stub) |
| `useCockpitAudio.ts` | CPA2 PartB | Cockpit ambient audio |
| `useCockpitContentBridge.ts` | Enh: S9 Batch 1 | Cockpit-to-content bridge |
| `useContent.ts` | Stage 2 P4 → Stage 4 P1 | Content data (replaced stub) |
| `useDebounce.ts` | Stage 1 P2 | Debounce utility |
| `useDemoSession.ts` | Login3D PartB | Demo session management |
| `useFrameTimeMonitor.ts` | Enh: Audit S4.2 | Dev-only FPS monitoring |
| `useGSAPScroll.ts` | Stage 3 P3A | GSAP scroll animations |
| `useGameEnvironmentReactivity.ts` | Enh: Env reactivity | State-driven 3D environment |
| `useGamification.ts` | Stage 2 P4 → Stage 4 P1 | Gamification data |
| `useGuideContext.ts` | Enh: S9 Batch 1 | AI Guide context |
| `useHeroAnimation.ts` | Hero PartB | Hero animation orchestrator |
| `useInteractiveSurface.ts` | Enh: D3D Part D | Interactive cockpit surfaces |
| `useIrisTransition.ts` | Enh: D3D Part A | Mechanical iris transitions |
| `useLocalStorage.ts` | Stage 1 P2 | localStorage wrapper |
| `useNetworkAudio.ts` | Stage 6C | Neural Builder audio |
| `useParallaxMouse.ts` | Enh: D3D Part D | Parallax mouse tracking |
| `useParentDashboard.ts` | Stage 8 P1 | Parent dashboard data |
| `usePetTrainerAudio.ts` | Stage 6B | Pet Trainer audio |
| `useProgress.ts` | Stage 2 P4 → Stage 4 P1 | Progress data |
| `usePromptLabAudio.ts` | Stage 6D | Prompt Lab audio |
| `useSessionTimer.ts` | Stage 8 P1 | Time limit enforcement |
| `useSessionTracker.ts` | Stage 3 P2 | Session activity tracking |
| `useSortAudio.ts` | Stage 7B | Sort Toy Box audio |
| `useSoundEffect.ts` | Stage 5 P1 | General sound effects |
| `useSpatialNavigation.ts` | CPA2 PartB | Spatial dashboard navigation |
| `useStationMode.ts` | Stage 3 P2 / Stage 4 P2B | Station mode switching |
| `useSystemPreferences.ts` | Stage 1 P2 | System preference detection |
| `useVoiceInput.ts` | Enh: S9 Batch 1 | Voice input for AI Guide |
| `useVoiceOutput.ts` | Enh: S9 Batch 1 | Voice output for AI Guide |

### 4.4 Lib Utilities — `src/lib/` (43 files)

| File | Stage Origin | Purpose |
|------|-------------|---------|
| `utils.ts` | Stage 1 P2 | cn() + general utilities |
| `animations.ts` | Stage 1 P2 | Motion animation presets |
| `feature-flags.ts` | Stage 1 P2 | Feature flag system |
| `webgpuDetection.ts` | Stage 1 P2 | WebGPU capability detection |
| `validations.ts` | Stage 2 P2 | Zod schemas |
| `tier-config.ts` | Stage 2 P2 / Stage 8 P1 | Subscription tier config |
| `rate-limit.ts` | Stage 2 P2 | Rate limiting |
| `api-helpers.ts` | Stage 2 P2 | API response helpers |
| `api.ts` | Stage 2 P4 | Frontend API client |
| `gamification.ts` | Stage 5 P1 | XP/level calculations |
| `cosmetics.ts` | Stage 5 P1 | Cosmetic items catalog |
| `avatar.ts` | Stage 5 P1 | Avatar system |
| `dailyChallenge.ts` | Stage 5 P1 | Daily challenge logic |
| `demo-session.ts` | Login3D PartA | Demo session utilities |
| `ceremonyMapping.ts` | Enh: S5-CRIT fix | Ceremony-to-badge mapping |
| `supabase/client.ts` | Stage 1 P2 | Supabase browser client |
| `supabase/server.ts` | Stage 1 P2 | Supabase server client |
| `3d/cockpitConfig.ts` | Stage 1 P2 | Cockpit configuration |
| `3d/webgpuDetect.ts` | Stage 1 P2 | WebGPU detect (3D-specific) |
| `3d/materials.ts` | Stage 3 P3A | 11 PBR material presets |
| `3d/voronoiFracture.ts` | Hero PartA | Voronoi fracture system |
| `3d/heroSplines.ts` | Hero PartA | Hero animation splines |
| `3d/heroParticleCompute.ts` | Hero PartB | Hero particle compute |
| `3d/heroParticleRender.ts` | Hero PartB | Hero particle render |
| `3d/preloadAssets.ts` | Enh: Cockpit | Asset preloading |
| `3d/proceduralConfig.ts` | Enh: S4.2 Batch 1 | Procedural environment config |
| `3d/cockpitMaterials.ts` | Enh: S1 Batch A | 7 cockpit material factories |
| `3d/interactiveSurfaceConfig.ts` | Enh: S4.1 Batch 1 | 8 cockpit surface presets |
| `3d/cameraShake.ts` | Enh: S4.1 Batch 1 | Camera shake + SHAKE_PRESETS |
| `3d/gameParticles.ts` | Enh: S7-CRIT-001 | Game particle system |
| `audio/cockpitAudio.ts` | Stage 1 P2 | Cockpit audio engine |
| `audio/heroAudio.ts` | Hero PartB | Hero animation audio |
| `audio/irisAudio.ts` | Enh: D3D Part A | Iris transition audio |
| `agent/prompts.ts` | Stage 9 P1 | Agent system prompts |
| `agent/readability.ts` | Stage 9 P1 | Flesch-Kincaid validation |
| `agent/pipeline.ts` | Stage 9 P1 | 4-stage agent pipeline |
| `agent/moderation.ts` | Stage 9 P1 | Content moderation |
| `agent/seed.ts` | Stage 9 P3 | Seed content data |
| `agent/architect-pipeline.ts` | Enh: S9 Batch 1 | Architect pipeline extension |
| `agent/architect-prompts.ts` | Enh: S9 Batch 1 | Architect prompts |
| `agent/game-generator-pipeline.ts` | Enh: S9 Batch 1 | Game generator pipeline |
| `agent/game-generator-prompts.ts` | Enh: S9 Batch 1 | Game generator prompts |
| `guide/prompts.ts` | Enh: S9 Batch 1 | AI Guide prompts |

### 4.5 Config — `src/config/` (2 files)

| File | Stage Origin | Purpose |
|------|-------------|---------|
| `gameRegistry.ts` | Stage 7F P2 / Enh: Triangle budgets | 35-game registry with slugs, labs, tiers |
| `creatureConfig.ts` | Enh: Audit S4.2 | Pet creature species definitions |

### 4.6 Middleware — `src/middleware.ts` + `src/middleware/`

| File | Stage Origin | Purpose |
|------|-------------|---------|
| `middleware.ts` | Stage 1 P2 | Next.js root middleware |
| `middleware/tierCheck.ts` | Stage 8 P1 | Server-side tier limit checking |

### 4.7 Mocks — `src/mocks/` (3 files)

| File | Stage Origin | Purpose |
|------|-------------|---------|
| `browser.ts` | Stage 1 P1 | MSW browser setup |
| `handlers.ts` | Stage 1 P1 | MSW mock handlers |
| `server.ts` | Stage 1 P1 | MSW server setup |

### 4.8 Types — `src/types/` (1 file)

| File | Stage Origin | Purpose |
|------|-------------|---------|
| `index.ts` | Stage 1 P2 / All stages | Central type definitions (expanded by every stage) |

---

## SECTION 5: ENHANCEMENT & UNDOCUMENTED FILES MAP

Files created during audit cycles, enhancement work, or bug fixes — **not in any original stage document** but vital to the codebase. Each is traced to its commit of origin.

### 5.1 D3D Desktop-First Overhaul (commit `a44901c`, March 23, 2026)

**Source Docs:** `docs/enhancements/DESKTOP_FIRST_3D_OVERHAUL_PartA-D.md`

| File | Purpose |
|------|---------|
| `src/stores/sceneStore.ts` | Centralized scene state (D3D-B5) |
| `src/components/3d/MechanicalIris.tsx` | Cockpit-to-game iris transition (D3D-B2) |
| `src/components/3d/SceneRouter.tsx` | Scene visibility management (D3D-B4) |
| `src/components/3d/PostProcessingStack.tsx` | 7-effect always-on stack (D3D-5/C1) |
| `src/hooks/useIrisTransition.ts` | Iris transition hook |
| `src/hooks/useInteractiveSurface.ts` | Interactive cockpit surfaces (D3D Part D) |
| `src/hooks/useParallaxMouse.ts` | Parallax mouse tracking (D3D Part D) |
| `src/lib/audio/irisAudio.ts` | Iris transition audio + LAB_COLOR_AUDIO_PROFILES |

### 5.2 Cockpit Upgrade & Audit Enhancements (March 20-25, 2026)

| File | Commit | Purpose |
|------|--------|---------|
| `src/components/3d/CockpitFloor3D.tsx` | `65060f0` (Cockpit upgrade #8) | Grated floor, piping, LED channels |
| `src/components/3d/CeremonyFXBridge.tsx` | Enh: Cockpit | Bridge between 2D ceremonies and 3D FX |
| `src/components/3d/BadgePedestalBridge.tsx` | Enh: Cockpit | Bridge between badges UI and 3D pedestal |
| `src/components/3d/ParentDashboardBridge.tsx` | Enh: Cockpit | Bridge to 3D parent dashboard |
| `src/components/3d/ParentStatHologram3D.tsx` | Enh: Cockpit | 3D holographic parent stats |
| `src/components/3d/ContentHologram3D.tsx` | Enh: Cockpit | 3D content hologram display |
| `src/components/3d/Canvas3DErrorBoundary.tsx` | Enh: S4.2 | Canvas crash recovery |
| `src/components/3d/WebGPUErrorBoundary.tsx` | Enh: S4.2 | WebGPU failure fallback |
| `src/components/3d/OnboardingCrystal3D.tsx` | Enh: Cockpit | Enhanced onboarding crystal |
| `src/components/3d/GuideAvatar3D.tsx` | Enh: AI Guide | 3D AI Guide avatar |
| `src/components/3d/AvatarPreview3D.tsx` | Enh: Profile | 3D avatar preview |
| `src/components/3d/CinematicCamera.tsx` | Enh: Cockpit | Cinematic camera system |
| `src/components/3d/NPCSpeechBubble.tsx` | Enh: S9 Batch 1 | NPC speech bubble 3D |
| `src/lib/3d/preloadAssets.ts` | Enh: Cockpit | Asset preloading utility |
| `src/lib/3d/proceduralConfig.ts` | Enh: S4.2 Batch 1 | Procedural environment config |
| `src/lib/3d/cameraShake.ts` | Enh: S4.1 Batch 1 | Camera shake presets |
| `src/lib/3d/interactiveSurfaceConfig.ts` | Enh: S4.1 Batch 1 | Surface interaction presets |
| `src/lib/3d/cockpitMaterials.ts` | Enh: S1 Batch A | 7 cockpit material factories |
| `src/lib/3d/gameParticles.ts` | Enh: S7-CRIT-001 | Game particle system |
| `src/hooks/useFrameTimeMonitor.ts` | Enh: Audit S4.2 | Dev-only frame time monitor |
| `src/hooks/useGameEnvironmentReactivity.ts` | Enh: Env reactivity | State-driven 3D environment |
| `src/hooks/useAmbientSoundscape.ts` | Enh: Cockpit audio | Ambient soundscape |
| `src/lib/ceremonyMapping.ts` | Enh: S5-CRIT fix | Ceremony mapping |

### 5.3 Stage 9 Content Agent — Phase 1 Enhancement (commit `84598bc`, March 28, 2026)

| File | Purpose |
|------|---------|
| `src/stores/guideStore.ts` | AI Guide avatar state management |
| `src/hooks/useVoiceInput.ts` | Voice input for AI Guide |
| `src/hooks/useVoiceOutput.ts` | Voice output for AI Guide |
| `src/hooks/useGuideContext.ts` | AI Guide context provider |
| `src/hooks/useCockpitContentBridge.ts` | Cockpit-to-content data bridge |
| `src/hooks/useBranchingLesson.ts` | Interactive branching lesson navigation |
| `src/lib/agent/architect-pipeline.ts` | Architect pipeline extension |
| `src/lib/agent/architect-prompts.ts` | Architect system prompts |
| `src/lib/agent/game-generator-pipeline.ts` | Game generator pipeline |
| `src/lib/agent/game-generator-prompts.ts` | Game generator prompts |
| `src/lib/guide/prompts.ts` | AI Guide conversation prompts |
| `src/components/content/BranchingLessonRenderer.tsx` | Interactive branching lesson UI |
| `src/components/ui/GuideChatPanel.tsx` | AI Guide chat panel |
| `src/components/ui/GuideMobileAvatar.tsx` | AI Guide mobile avatar |
| `src/components/3d/NPCSpeechBubble.tsx` | NPC speech bubble 3D |
| `src/app/api/agent/architect/route.ts` | Architect API route |
| `src/app/api/agent/trending/route.ts` | Trending research API |
| `src/app/api/agent/game-generator/route.ts` | Game generator API |

### 5.4 3D UI Components (commit `21cb7fa`, March 27, 2026)

**Source Doc:** CLAUDE.md v6.0 Section 9.3 (Cockpit Triangle Budgets v3.0)

| File | Purpose | Triangle Budget |
|------|---------|----------------|
| `src/components/3d/ui/HolographicButton.tsx` | Physical cockpit buttons | Part of 5M |
| `src/components/3d/ui/RadialDial3D.tsx` | Rotary dial controls | Part of 5M |
| `src/components/3d/ui/ToggleSwitch3D.tsx` | Physical toggle switches | Part of 5M |
| `src/components/3d/ui/HolographicCard.tsx` | Holographic info cards | Part of 5M |
| `src/components/3d/ui/HolographicPanel.tsx` | Large holographic panels | Part of 5M |
| `src/components/3d/ui/NavigationButtonGrid.tsx` | 5 nav buttons (HOME/LABS/ARCADE/SETTINGS/PROFILE) | 1M |
| `src/components/3d/ui/VariableDialCluster.tsx` | 3 center-console dials | 1.5M |
| `src/components/3d/ui/CenterViewportScreen.tsx` | Spherical panoramic screen | 3M |
| `src/components/3d/ui/index.ts` | Barrel export | — |
| `src/stores/cockpitBroadcastStore.ts` | Cross-panel event bus (16 event types) | — |

### 5.5 Procedural Environment System (commit `fe8e082`, March 24, 2026)

| File | Purpose |
|------|---------|
| `src/components/3d/environments/procedural/ProceduralTerrain.tsx` | Procedural terrain generation |
| `src/components/3d/environments/procedural/ProceduralSkyDome.tsx` | Sky dome with atmosphere |
| `src/components/3d/environments/procedural/ProceduralFog.tsx` | Volumetric fog layers |
| `src/components/3d/environments/procedural/ProceduralLighting.tsx` | Dynamic lighting system |
| `src/components/3d/environments/procedural/ProceduralProps.tsx` | Environment prop placement |
| `src/components/3d/environments/procedural/index.ts` | Barrel export |
| `src/components/3d/environments/ProceduralEnvironmentGenerator.tsx` | Main generator orchestrator |
| `src/components/3d/environments/ReactiveEnvironmentEffects.tsx` | Game-state-reactive effects |

### 5.6 Creature System (commit `3eb83e9`, March 25, 2026)

| File | Purpose |
|------|---------|
| `src/components/3d/creatures/CreatureBase.tsx` | Base creature component |
| `src/components/3d/creatures/VoltkitCreature.tsx` | Electric creature variant |
| `src/components/3d/creatures/PixieCreature.tsx` | Fairy creature variant |
| `src/components/3d/creatures/BytelingCreature.tsx` | Digital creature variant |
| `src/components/3d/creatures/SparkpawCreature.tsx` | Fire creature variant |
| `src/components/3d/creatures/CogsworthCreature.tsx` | Mechanical creature variant |
| `src/components/3d/creatures/index.ts` | Barrel export |
| `src/config/creatureConfig.ts` | Creature species definitions |

### 5.7 TSL Shader System (commits `3eb83e9` + `0afa537`)

| File | Purpose |
|------|---------|
| `src/shaders/tsl/auroraTSL.ts` | Aurora effect (TSL port) |
| `src/shaders/tsl/crystallineLogoTSL.ts` | Crystalline logo (Hero) |
| `src/shaders/tsl/electricVeinsTSL.ts` | Electric veins (Hero) |
| `src/shaders/tsl/energyFieldTSL.ts` | Energy field effect |
| `src/shaders/tsl/fireNoiseTSL.ts` | Fire/noise effect |
| `src/shaders/tsl/holographicTSL.ts` | Holographic effect |
| `src/shaders/tsl/liquidMetalTSL.ts` | Liquid metal effect |
| `src/shaders/tsl/scanlineTSL.ts` | Scanline effect |
| `src/shaders/tsl/noiseUtils.ts` | Shared noise functions |
| `src/shaders/tsl/index.ts` | Barrel export |
| `src/shaders/labPatterns/tsl/agentLab.ts` | Lab 5 pattern (TSL) |
| `src/shaders/labPatterns/tsl/buildLab.ts` | Lab 9 pattern (TSL) |
| `src/shaders/labPatterns/tsl/codeLab.ts` | Lab 9 pattern (TSL) |
| `src/shaders/labPatterns/tsl/createLab.ts` | Lab 4 pattern (TSL) |
| `src/shaders/labPatterns/tsl/dataLab.ts` | Lab 2 pattern (TSL) |
| `src/shaders/labPatterns/tsl/ethicsLab.ts` | Lab 6 pattern (TSL) |
| `src/shaders/labPatterns/tsl/frontierLab.ts` | Lab 10 pattern (TSL) |
| `src/shaders/labPatterns/tsl/languageLab.ts` | Lab 8 pattern (TSL) |
| `src/shaders/labPatterns/tsl/neuralLab.ts` | Lab 3 pattern (TSL) |
| `src/shaders/labPatterns/tsl/visionLab.ts` | Lab 7 pattern (TSL) |
| `src/shaders/labPatterns/tsl/shared.ts` | Shared TSL utilities |
| `src/shaders/labPatterns/tsl/index.ts` | Barrel export |

### 5.8 Game Environments (35 files — one per game)

All created by their corresponding Stage 6/7 docs + the `StandardEnvironmentBase.tsx`, `FlagshipEnvironmentBase.tsx`, `FLLiteEnvironmentBase.tsx` base classes.

| Base Class | Stage | Games Using |
|------------|-------|-------------|
| `FlagshipEnvironmentBase.tsx` | Stage 6 | Pet Trainer, Neural Builder, Prompt Lab, Agent Architect, Bias Detective |
| `FLLiteEnvironmentBase.tsx` | Stage 7 | Sort Toy Box, Code Blocks, Chatbot Builder, Data Detective, Robot Vacuum, Camera Quest, Future Forge, My First AI App, Emoji Decoder |
| `StandardEnvironmentBase.tsx` | Stage 7 | All 20 Standard tier games |

Individual environment files follow pattern: `src/components/3d/environments/{GameName}Environment.tsx`

### 5.9 Dashboard Components (created during audit fixes)

| File | Commit | Purpose |
|------|--------|---------|
| `src/components/dashboard/SpatialOverlay.tsx` | Enh: Cockpit | Spatial dashboard HTML overlay |
| `src/components/dashboard/TrendingFeed.tsx` | Enh: S9 Phase 1 | Trending AI topics feed |

---

## SECTION 6: ALL 35 GAMES — QUICK REFERENCE

Updated with correct tiers per D3D-3 (3-tier system: Flagship/FL-Lite/Standard).

| # | Game | Lab | Stage | Slug | Tier | 3D Component | Bands | Env File |
|---|------|-----|-------|------|------|--------------|-------|----------|
| 1 | AI Spy | 1 | 7A | `ai-spy` | Standard | AiSpyEnvironment | A,B,C | `AiSpyEnvironment.tsx` |
| 2 | Time Machine | 1 | 7A | `time-machine` | Standard | TimeMachineEnvironment | A,B,C | `TimeMachineEnvironment.tsx` |
| 3 | Human vs Machine | 1 | 7B | `human-vs-machine` | Standard | HumanVsMachineEnvironment | A,B,C | `HumanVsMachineEnvironment.tsx` |
| 4 | AI Pet Trainer | 2 | 6B | `pet-trainer` | **Flagship** | Pet3DScene, PetCreature3D | A,B,C | `PetTrainerEnvironment.tsx` |
| 5 | Sort Toy Box | 2 | 7B | `sort-toy-box` | **Flagship** | SortScene3D, SortFeatureViz3D | A,B,C | `SortToyBoxEnvironment.tsx` |
| 6 | Treat Trainer | 2 | 7C | `treat-trainer` | Standard | TreatTrainerEnvironment | A,B,C | `TreatTrainerEnvironment.tsx` |
| 7 | Data Detective | 2 | 7C | `data-detective` | **FL-Lite** | DataDetective3D | A,B,C | `DataDetectiveEnvironment.tsx` |
| 8 | Neural Builder | 3 | 6C | `neural-builder` | **Flagship** | NeuralNetwork3D | A,B,C | `NeuralBuilderEnvironment.tsx` |
| 9 | Neuron Relay | 3 | 7C | `neuron-relay` | Standard | NeuronRelayEnvironment | A,B,C | `NeuronRelayEnvironment.tsx` |
| 10 | Pixel Investigator | 3 | 7D | `pixel-investigator` | Standard | PixelInvestigatorEnvironment | B,C | `PixelInvestigatorEnvironment.tsx` |
| 11 | Prompt Lab | 4 | 6D | `prompt-lab` | **Flagship** | PromptBubble3D, PromptScore3D | A,B,C | `PromptLabEnvironment.tsx` |
| 12 | Word Predictor | 4 | 7A | `word-predictor` | Standard | WordPredictorEnvironment | A,B,C | `WordPredictorEnvironment.tsx` |
| 13 | Token Chopper | 4 | 7A | `token-chopper` | Standard | TokenChopperEnvironment | B,C | `TokenChopperEnvironment.tsx` |
| 14 | AI Art Detective | 4 | 7A | `ai-art-detective` | Standard | AiArtDetectiveEnvironment | A,B,C | `AiArtDetectiveEnvironment.tsx` |
| 15 | Agent Architect | 5 | 6E | `agent-architect` | **Flagship** | AgentPipeline3D | A,B,C | `AgentArchitectEnvironment.tsx` |
| 16 | Robot Vacuum | 5 | 7D | `robot-vacuum` | **FL-Lite** | RobotVacuum3D | A,B,C | `RobotVacuumEnvironment.tsx` |
| 17 | Tool Picker | 6 | 7A | `tool-picker` | Standard | ToolPickerEnvironment | A,B,C | `ToolPickerEnvironment.tsx` |
| 18 | Bias Detective | 6 | 6F | `bias-detective` | **Flagship** | BiasScales3D, BiasDecisionTree3D | B,C | `BiasDetectiveEnvironment.tsx` |
| 19 | Data Shield | 6 | 7A | `data-shield` | Standard | DataShieldEnvironment | A,B,C | `DataShieldEnvironment.tsx` |
| 20 | Real or Fake | 6 | 7A | `real-or-fake` | Standard | RealOrFakeEnvironment | A,B,C | `RealOrFakeEnvironment.tsx` |
| 21 | Ethics Courtroom | 6 | 7E | `ethics-courtroom` | Standard | EthicsCourtroomEnvironment | B,C | `EthicsCourtroomEnvironment.tsx` |
| 22 | Camera Quest | 7 | 7D | `camera-quest` | **FL-Lite** | CameraQuest3D | A,B,C | `CameraQuestEnvironment.tsx` |
| 23 | Fool the AI | 7 | 7D | `fool-the-ai` | Standard | FoolTheAiEnvironment | B,C | `FoolTheAiEnvironment.tsx` |
| 24 | Build Classifier | 7 | 7E | `build-classifier` | Standard | BuildClassifierEnvironment | B,C | `BuildClassifierEnvironment.tsx` |
| 25 | Prediction Market | 7 | 7A | `prediction-market` | Standard | PredictionMarketEnvironment | B,C | `PredictionMarketEnvironment.tsx` |
| 26 | Sentiment Scanner | 8 | 7C | `sentiment-scanner` | Standard | SentimentScannerEnvironment | A,B,C | `SentimentScannerEnvironment.tsx` |
| 27 | Chatbot Builder | 8 | 7C | `chatbot-builder` | **FL-Lite** | ChatbotNodes3D | B,C | `ChatbotBuilderEnvironment.tsx` |
| 28 | Lost in Translation | 8 | 7C | `lost-in-translation` | Standard | LostInTranslationEnvironment | A,B,C | `LostInTranslationEnvironment.tsx` |
| 29 | Emoji Decoder | 8 | 7F | `emoji-decoder` | **FL-Lite** | EmojiDecoder3D | A,B | `EmojiDecoderEnvironment.tsx` |
| 30 | Code Blocks | 9 | 7B | `code-blocks` | **FL-Lite** | CodeBlocks3D | A,B,C | `CodeBlocksEnvironment.tsx` |
| 31 | Career Explorer | 9 | 7B | `career-explorer` | Standard | CareerExplorerEnvironment | B,C | `CareerExplorerEnvironment.tsx` |
| 32 | API Explorer | 9 | 7E | `api-explorer` | Standard | ApiExplorerEnvironment | C | `ApiExplorerEnvironment.tsx` |
| 33 | My First AI App | 9 | 7F | `my-first-ai-app` | **FL-Lite** | MyFirstAiApp3D | A,B,C | `MyFirstAiAppEnvironment.tsx` |
| 34 | Future Forge | 10 | 7D | `future-forge` | **FL-Lite** | FutureForge3D | A,B,C | `FutureForgeEnvironment.tsx` |
| 35 | AI or Not? | 10 | 7F | `ai-or-not` | **FL-Lite** | AiOrNot3D | A,B | `AiOrNotEnvironment.tsx` |

**Tier Summary:** 6 Flagship (20M tris) + 9 FL-Lite (10M tris) + 20 Standard (5M tris) = **35 games**

**Audit Status (March 29, 2026):** All 35 games pass functional completeness audit — phase system, age bands, completeGame(), ARIA labels, GameShell wrapper, 3D environments, substantive content.

---

## SECTION 7: COMPLETE STORE & HOOK REGISTRY

### 7.1 Zustand Stores (12) + Jotai Atoms (1)

| Store | File | Stage | Key Actions |
|-------|------|-------|-------------|
| authStore | `stores/authStore.ts` | S1/Login3D | signIn, signUp, signOut, startDemoSession, endDemoSession |
| childStore | `stores/childStore.ts` | S1/S4/S5 | setActiveChild, updateXP, addBadge, setAvatar |
| gameStore | `stores/gameStore.ts` | S1/S6 | startGame, updateScore, advanceRound, completeGame, resetGame |
| toastStore | `stores/toastStore.ts` | S1 | addToast, removeToast |
| uiStore | `stores/uiStore.ts` | S1/Hero | toggleSidebar, setCelebration, setLabColor, skipIntroAnimation |
| deviceStore | `stores/deviceStore.ts` | S1/Hero | Hardcoded desktop-ultra (50M budget, gpuTier, stripeCount) |
| cockpitStore | `stores/cockpitStore.ts` | S1/CPA2 | setSpatialView, setFocusedLab, setHeroPhase, setCockpitSkin |
| cockpitAtoms | `stores/cockpitAtoms.ts` | S3 | Jotai atoms for cockpit 3D reactive state |
| parentStore | `stores/parentStore.ts` | S8 | setSubscription, setTimeLimit, setContentFilter |
| accessibilityStore | `stores/accessibilityStore.ts` | S10 | setFontSize, setContrast, setReducedMotion |
| sceneStore | `stores/sceneStore.ts` | D3D | enterGame, exitGame, enterSpatial, exitSpatial, setHeroActive |
| guideStore | `stores/guideStore.ts` | S9 Enh | setGuideState, setConversation |
| cockpitBroadcastStore | `stores/cockpitBroadcastStore.ts` | S4 v3.0 | broadcast(event), subscribe(event), 16 event types |

### 7.2 Custom Hooks (35)

| Hook | Stage | Category | Description |
|------|-------|----------|-------------|
| useAdaptiveCockpit | S1 | 3D | Cockpit LOD/quality adaptation |
| useAgentAudio | S6E | Audio | Agent Architect sound effects |
| useAmbientSoundscape | Enh | Audio | Cockpit ambient audio layers |
| useBiasDetectiveAudio | S6F | Audio | Bias Detective sound effects |
| useBranchingLesson | S9 Enh | Content | Branching lesson navigation |
| useChildren | S2→S4 | Data | Children CRUD + React Query |
| useCockpitAudio | CPA2 | Audio | Cockpit audio engine hook |
| useCockpitContentBridge | S9 Enh | Bridge | Cockpit-to-content data bridge |
| useContent | S2→S4 | Data | Content fetching + caching |
| useDebounce | S1 | Utility | Debounce values |
| useDemoSession | Login3D | Auth | Demo session timer + expiry |
| useFrameTimeMonitor | Enh | Perf | Dev-only frame time logging |
| useGSAPScroll | S3 | Animation | GSAP scroll triggers |
| useGameEnvironmentReactivity | Enh | 3D | State-driven environment effects |
| useGamification | S2→S4 | Data | XP, badges, streaks |
| useGuideContext | S9 Enh | AI | AI Guide conversation context |
| useHeroAnimation | Hero | 3D | 8-phase hero orchestrator |
| useInteractiveSurface | D3D | 3D | Cockpit surface interactions |
| useIrisTransition | D3D | 3D | Mechanical iris transitions |
| useLocalStorage | S1 | Utility | localStorage with SSR safety |
| useNetworkAudio | S6C | Audio | Neural Builder audio |
| useParallaxMouse | D3D | 3D | Mouse-driven parallax |
| useParentDashboard | S8 | Data | Parent dashboard data |
| usePetTrainerAudio | S6B | Audio | Pet Trainer sound effects |
| useProgress | S2→S4 | Data | Progress tracking |
| usePromptLabAudio | S6D | Audio | Prompt Lab sound effects |
| useSessionTimer | S8 | Auth | Daily time limit enforcement |
| useSessionTracker | S3 | Auth | Session activity tracking |
| useSortAudio | S7B | Audio | Sort Toy Box audio |
| useSoundEffect | S5 | Audio | General Tone.js sound effects |
| useSpatialNavigation | CPA2 | 3D | Spatial dashboard navigation |
| useStationMode | S3/S4 | UI | Station mode switching |
| useSystemPreferences | S1 | Utility | OS preference detection |
| useVoiceInput | S9 Enh | AI | Voice input processing |
| useVoiceOutput | S9 Enh | AI | Voice TTS output |

---

## SECTION 8: 3D COMPONENT REGISTRY SUMMARY

Full registry in `docs/00-reference/3D-Component-Registry.md`. Summary below.

### 8.1 By Category

| Category | Count | Key Components | Triangle Budget |
|----------|-------|----------------|----------------|
| System/Dashboard | 9 | CockpitCanvas, HeroAnimation, StationFrame, SceneRouter, MechanicalIris, PostProcessingStack | 30M (cockpit) |
| Cockpit Geometry | 15 | CockpitPanels(4M), SidePanels(3M), HolographicHUD(1M), StatusBar3D(1M), LEDRim(500K), CockpitFloor3D(1M), CockpitStructuralDetail(2M) | 37.8M total |
| 3D UI Components | 9 | HolographicButton, RadialDial3D, ToggleSwitch3D, NavigationButtonGrid(1M), VariableDialCluster(1.5M), CenterViewportScreen(3M) | 5M + 5.5M |
| Flagship Games | 12 | Pet3DScene, NeuralNetwork3D, PromptBubble3D, AgentPipeline3D, BiasScales3D, SortScene3D + environments | 20M per game |
| FL-Lite Games | 19 | CodeBlocks3D, ChatbotNodes3D, DataDetective3D, RobotVacuum3D, CameraQuest3D, FutureForge3D, MyFirstAiApp3D, EmojiDecoder3D, AiOrNot3D + envs | 10M per game |
| Standard Environments | 21 | StandardEnvironmentBase + 20 game-specific environments | 5M per game |
| Procedural | 7 | ProceduralEnvironmentGenerator, Terrain, SkyDome, Fog, Lighting, Props | Shared with envs |
| Creatures | 7 | CreatureBase + 5 species (Voltkit, Pixie, Byteling, Sparkpaw, Cogsworth) | Part of Pet Trainer |
| Hero Animation | 5 | useHeroAnimation, heroParticleCompute, voronoiFracture, heroSplines, heroAudio | Part of system |
| Audio | 3 | cockpitAudio, heroAudio, irisAudio | — |
| TSL Shaders | 22 | 10 lab patterns + 9 effect shaders + shared + indices | — |
| **Total** | **~172** | | **50M system budget** |

### 8.2 Desktop-Ultra Profile (D3D-1)

| Property | Value |
|----------|-------|
| Target FPS | 60 |
| Max Triangles | 50,000,000 (37.8M cockpit + 12.2M game headroom) |
| Bloom | Always on |
| Shadows | Always on |
| SSAO | Always on |
| Chromatic Aberration | Always on |
| Depth of Field | Always on |
| Pixel Ratio | Native (`window.devicePixelRatio`) |

---

## SECTION 9: 30-DAY COMMIT LOG (Feb 28 – Mar 29, 2026)

50 commits across the audit and enhancement period. Ordered newest-first.

| Date | Hash | Message | PR |
|------|------|---------|----|
| 2026-03-29 | `e59de8c` | fix: create 3 missing files referenced in Stage 3 docs | — |
| 2026-03-28 | `84598bc` | Stage 9 Batch 1: Fix Prompt Lab Anthropic init + model string | #47 |
| 2026-03-28 | `591f316` | Batch 1: Fix Stage 7 game TS errors — 3D prop passing + namespace import | #46 |
| 2026-03-28 | `8e5c654` | Stage 6 Batch 1A: Fix S6-CRIT-001 + S6-CRIT-003 — game lifecycle fixes | #43 |
| 2026-03-27 | `1f145d7` | Stage 8 Batch 1: Security fixes (S8-HIGH-001, S8-WARN-002, S8-WARN-005, S10-WARN-002) | #45 |
| 2026-03-27 | `b399d16` | S7-CRIT-001: D3D-B1 Canvas refactor — all 28 Stage 7 games now use sceneStore | #44 |
| 2026-03-27 | `5442937` | Claude/fix stage 5 audit issues | #42 |
| 2026-03-27 | `c36418a` | Batch 1: Fix S5-CRIT-001, S5-CRIT-002, S5-HIGH-006 — profile page + gamification pipeline | #41 |
| 2026-03-27 | `6c13a90` | Update CLAUDE.md | — |
| 2026-03-27 | `006a7d7` | Update PROGRESS.md | — |
| 2026-03-27 | `21cb7fa` | Stage 1 Batch A: Verify & downgrade S1-HIGH-002, defer S1-INFO-002 | #40 |
| 2026-03-26 | `f276f01` | Add comprehensive cockpit architecture JSON definition | #39 |
| 2026-03-26 | `973760c` | Phase 0 Batch 1: Restore dependencies & test infrastructure | #38 |
| 2026-03-26 | `5c49e04` | Update CLAUDE.md | — |
| 2026-03-26 | `2d8fde4` | Claude/execute audit report | #36 |
| 2026-03-26 | `8010dc2` | Audit Phase 0: Environment scan — build, TypeScript, tests, ESLint | #37 |
| 2026-03-26 | `b0b9df3` | Claude/execute audit report | #34 |
| 2026-03-26 | `ef11ee1` | Claude/execute audit report | #32 |
| 2026-03-26 | `203f1f2` | Audit Phase 0: Environment scan — build, TypeScript, tests, ESLint | #31 |
| 2026-03-25 | `3eb83e9` | Audit Section 4.2: TSL ports for 9 remaining GLSL shaders + WebGPU error boundary | #30 |
| 2026-03-25 | `6af2460` | Create SPARKFORGE_AUDIT_AGENT.md | — |
| 2026-03-25 | `7356a8f` | fix(3d): CanvasTexture disposal + r3f-perf dev monitor | #29 |
| 2026-03-25 | `0a35396` | R3F Animation Enhancements: Drag, Hover, Micro-Animations, Easing | #28 |
| 2026-03-25 | `1674644` | feat(3d): add game environment reactivity — state-driven lighting, particles, victory flash | #27 |
| 2026-03-25 | `e629161` | Audit Suggestions #12, #14: Simplify Canvas dpr + add React.memo to 3D subtrees | #26 |
| 2026-03-25 | `dd72893` | Audit Finding 11: Replace sub-scale font sizes with Tailwind tokens | #25 |
| 2026-03-24 | `481967e` | fix(3d): convert THREE namespace imports to named imports — environments | #24 |
| 2026-03-24 | `414e611` | fix(perf): critical GPU memory/allocation fixes in cockpit 3D components | #23 |
| 2026-03-24 | `b390386` | docs: add Master Triad full codebase audit report | #22 |
| 2026-03-24 | `1089874` | Section 4.1 Batch 1: Iris audio integration, lab-color sound variations, camera shake | #21 |
| 2026-03-24 | `fe8e082` | Section 4.2 Batch 1: Procedural environment core config + 5 sub-generators | #20 |
| 2026-03-24 | `8fe0cae` | Create Agent-Frontend.md | — |
| 2026-03-24 | `45d8cc9` | D3D Phase 1 (WIP): Remove mobile/LOD/CSS fallbacks, lock desktop-ultra | #19 |
| 2026-03-23 | `a44901c` | D3D Overhaul Part A: Foundation cleanup — constraint removal spec | #18 |
| 2026-03-23 | `62a6f77` | Add Mobile 3D Enhancement Plan Part A: Analysis & Options | #17 |
| 2026-03-23 | `c3f07e8` | fix: resolve 3 critical blockers + implement Login 3D Enhancement (Phases 5E-5F) | #16 |
| 2026-03-23 | `2d62838` | Stage 3 Login Enhancement: 3D login page + Demo Login feature docs | #15 |
| 2026-03-22 | `0afa537` | Phase 1-3 Commits | — |
| 2026-03-21 | `8a42bdc` | fix: rename stage8 doc to remove colon invalid on Windows | — |
| 2026-03-20 | `472e222` | Claude/review sparkforge docs | #14 |
| 2026-03-20 | `d210106` | docs: add Hero Animation + Cockpit CPA2 to BUILD EXECUTION PLAN (Phases 5A-5D) | #13 |
| 2026-03-20 | `ea799b9` | docs: add Hero Animation + Cockpit CPA2 to BUILD EXECUTION PLAN (Phases 5A-5D) | #12 |
| 2026-03-20 | `b0b3988` | Claude/consolidate cockpit docs | #11 |
| 2026-03-20 | `3beda8d` | Claude/complete 3d cockpit upgrade | #9 |
| 2026-03-20 | `65060f0` | Claude/upgrade 3d cockpit | #8 |
| 2026-03-19 | `23035cc` | docs: audit CLAUDE.md v5.6, extract playbooks + 3D registry, update reference docs | #7 |
| 2026-03-19 | `010d0fe` | Add market research and competitive analysis document | #6 |
| 2026-03-19 | `2a1ba9a` | Claude/ai guide avatar design | #5 |
| 2026-03-18 | `abd1601` | fix: resolve dual-canvas bug, integrate LODWrapper, add mobile particle fallback | #4 |
| 2026-03-18 | `f4b6e1f` | Claude/review stage 6 conflicts | #3 |
| 2026-03-18 | `09a4c38` | Claude/upgrade triangle budgets | #2 |

---

## SECTION 10: KNOWN GAPS & AUDIT FINDINGS

### 10.1 Resolved Gaps (fixed during this audit)

| Gap | Resolution | Commit |
|-----|-----------|--------|
| `src/shaders/dissolve.glsl` missing | Created with full GLSL — CPA2-5 dissolve shader | `e59de8c` |
| `src/shaders/wormhole.glsl` missing | Created with full GLSL — CPA2-6 tunnel energy | `e59de8c` |
| `src/components/providers/PageTransitionProvider.tsx` missing | Created with full React context + sceneStore integration | `e59de8c` |

### 10.2 Non-Blocking Items

| Item | Status | Notes |
|------|--------|-------|
| Pet GLB assets (`public/models/pets/`) | Dir exists, GLBs pending | Parallel workstream. Game uses fallback orb. |
| Font file (`public/fonts/Exo2-Bold.woff`) | Not yet placed | drei Text falls back to default. Stage 10 polish. |
| `src/components/celebrations/` | Empty (.gitkeep) | Placeholder for future celebration components |
| `src/components/profile/` | Empty (.gitkeep) | Placeholder for profile components (profile page exists in app/) |
| `src/app/(public)/` | Empty (.gitkeep) | Placeholder for public-facing routes |

### 10.3 Documentation vs Code Drift

| Finding | Details |
|---------|---------|
| Guide filename | File is `SparkForge_Master_Implementation_Guide_v3.2.md` but internal version is now v4.0. Kept same filename for git history continuity. |
| CLAUDE.md store count | Tech stack said "9 stores" — **FIXED** to 13 (11 Zustand + 1 Jotai + 1 broadcast). Section 14 correctly lists all 13. |
| CLAUDE.md 3D component count | Section 9 said "93 components" — **FIXED** to ~140. Full registry in 3D-Component-Registry.md needs separate update. |
| CLAUDE.md triangle budgets | Sections 1 & 13 had outdated budgets (10M/2M/500K) — **FIXED** to match D3D-3 (20M/10M/5M). |
| CLAUDE.md cockpit system budget | Section 9 said "30M cockpit" — **FIXED** to ~37.8M to match detailed budget table. |
| CLAUDE.md HS-9/HS-10 mobile refs | Referenced mobile CSS fallbacks removed by D3D-1 — **FIXED**, mobile verification steps removed. |
| CLAUDE.md Stage 6D build table | Listed only v3-FINAL — **FIXED** to show v2 + v3-FINAL (Mixed), matching MIG Section 11. |
| CLAUDE.md Three.js version | Said r171+ — **FIXED** to r183+ to match MIG and installed version. |
| Stage 6 docs reference useIsMobile() | D3D-1 removed all mobile detection. Stage 6 docs still mention `useIsMobile()` fallback — code has been updated but docs have not. |

---

## SECTION 11: BUILD EXECUTION ORDER

The definitive development order. Each phase must complete before the next begins.

| Phase | Stage | Source Documents | Type | Hard Stops | Tag |
|-------|-------|-----------------|------|------------|-----|
| 1 | Stage 1 Part 1 | STAGE1_Foundation_v2_PART1 | v2 | — | — |
| 2 | Stage 1 Part 2 | STAGE1_Foundation_v2_PART2 | v2 | — | v0.1.0 |
| 3 | Stage 2 Parts 1-4 | STAGE2_Database_API_v2_PART1-4 | v2 | HS-1, HS-7 | v0.2.0 |
| 4 | Stage 3 Parts 1-2 | STAGE3_Auth_Layout_Shell_v2_PART1-2 | v2 | — | — |
| 5 | Stage 3 Part 3 | STAGE3_Part3A/B_v3FINAL | v3 | — | v0.3.0 |
| **5A** | **Hero Animation Part 1** | **HERO_ANIMATION_v3FINAL_PartA** | **v3** | — | — |
| **5B** | **Hero Animation Part 2** | **HERO_ANIMATION_v3FINAL_PartB** | **v3** | HS-5 | v0.3.1 |
| **5C** | **Cockpit Part 1** | **COCKPIT_CPA2_v3FINAL_PartA** | **v3** | — | — |
| **5D** | **Cockpit Part 2** | **COCKPIT_CPA2_v3FINAL_PartB** | **v3** | HS-5, HS-9 | v0.3.2 |
| **5E** | **Login 3D Part 1** | **LOGIN_3D_v3FINAL_PartA** | **v3** | — | — |
| **5F** | **Login 3D Part 2** | **LOGIN_3D_v3FINAL_PartB** | **v3** | HS-5, HS-10 | v0.3.3 |
| 6 | Stage 4 Parts 1+3 | STAGE4_Core_Pages_v2_PART1+3 | v2 | — | — |
| 7 | Stage 4 Part 2 | STAGE4_Part2A/B_v3FINAL | v3 | — | v0.4.0 |
| 8 | Stage 5 Part 1 | STAGE5_Gamification_Profile_PART1 | v2 | — | — |
| 9 | Stage 5 Parts 2-3 | STAGE5_Parts23A/B/C_v3FINAL | v3 | — | v0.5.0 |
| 10 | Stage 6B | STAGE6B_v3FINAL_A/B | v3 | HS-8 (soft) | — |
| 11 | Stage 6C | STAGE6C_v3FINAL_A/B | v3 | — | — |
| 12 | Stage 6D | STAGE6D_v2 + v3FINAL_A/B | Mixed | — | — |
| 13 | Stage 6E | STAGE6E_v3FINAL_A/B/C | v3 | — | — |
| 14 | Stage 6F | STAGE6F_v3FINAL_A/B/C | v3 | — | v0.6.0 |
| 15 | Stage 7A (9 games) | STAGE7A Batch + Parts 2-4 | v2 | — | — |
| 16 | Stage 7B (4 games) | STAGE7B_v3FINAL_A/B/C | v3 | — | — |
| 17 | Stage 7C (4 games v2) | STAGE7C_Part1 + Part2 | v2 | — | — |
| 18 | Stage 7C (2 games v3) | STAGE7C_v3FINAL_A/B/C | v3 | — | — |
| 19 | Stage 7D (5 games) | STAGE7D_Part1 + v3FINAL_A/B/C | Mixed | — | — |
| 20 | Stage 7E (3 games) | STAGE7E_Part1 + Part2 | v2 | — | — |
| 21 | Stage 7F (3 games) | STAGE7F_v3FINAL_A/B + Part1 + Part2 | Mixed | — | — |
| 22 | Stage 7 Shared | STAGE7_Shared + XP_Celebration | Mixed | — | v0.7.0 |
| 23 | Stage 8 Parts 1-2 | STAGE8_Parent_Dashboard_v2_PART1-2 | v2 | HS-2 | — |
| 24 | Stage 8 Part 3 | STAGE8_P3_v3FINAL_A/B/C | v3 | — | v0.8.0 |
| 25 | Stage 9 Parts 1-3 | STAGE9_Content_Agent_v2_PART1-3 | v2 | HS-3 | v0.9.0 |
| 26 | Stage 10 Parts 1-2 | STAGE10_Polish_Deploy_v2_PART1-2 | v2 | HS-4, HS-5 | v0.10.0 |

### Enhancement Phases (post-stage or during audit cycles)

| Enhancement | Source | When to Apply | Files Created |
|-------------|--------|---------------|---------------|
| D3D Desktop-First Overhaul (Parts A-D) | `docs/enhancements/DESKTOP_FIRST_3D_OVERHAUL_*.md` | After Stage 3-Cockpit, before Stage 4 | 8 files (Section 5.1) |
| Procedural Environment System | Audit Section 4.2 commits | After Stage 4 Part 2 | 8 files (Section 5.5) |
| Creature System | Audit Section 4.2 commits | After Stage 6B (Pet Trainer) | 8 files (Section 5.6) |
| TSL Shader Ports | Audit Section 4.2 commits | After Stage 4 Part 2A | 22 files (Section 5.7) |
| 3D UI Components | Stage 4 v3.0 / S1 Batch A | After Stage 4 Part 2B | 10 files (Section 5.4) |
| Content Agent Phase 1 | S9 Batch 1 commits | After Stage 9 Part 3 | 18 files (Section 5.3) |
| AI Guide Avatar | `docs/enhancements/AI_GUIDE_AVATAR_ENHANCEMENT_PLAN.md` | Future | Planned |

### 5.8 Frontend Audit Fixes — March 30, 2026

| Category | Detail |
|----------|--------|
| Build fixes | Offline page `'use client'`, Supabase build-safe fallbacks |
| React 19 compat | @nivo/* upgraded 0.88.0 to 0.99.0 |
| Error boundaries | Added `error.tsx` + `loading.tsx` for (auth) and (marketing) route groups |
| Production hardening | Guarded non-essential console statements |
| CSS cleanup | Moved inline CSS keyframes (dangerouslySetInnerHTML) to `globals.css` |
| 3D imports | Added loading fallbacks to dynamic 3D imports |
| Accessibility | Improved ARIA on 8 games (52+ labels added) |
| Documentation | Updated CLAUDE.md store registry (13 stores: added guideStore + cockpitAtoms) |

**Files Created:**

| File | Purpose |
|------|---------|
| `src/app/(auth)/error.tsx` | Auth route error boundary |
| `src/app/(auth)/loading.tsx` | Auth route loading state |
| `src/app/(marketing)/error.tsx` | Marketing route error boundary |
| `src/app/(marketing)/loading.tsx` | Marketing route loading state |
| `src/app/(dashboard)/admin/content/AdminContentClient.tsx` | Admin content client component |

---

---

## APPENDIX A: UNIFIED 3D UI MIGRATION — DOCUMENT & FILE CORRECTION PLAN

**Version:** 1.0 | **Date:** March 31, 2026 | **Status:** ASSESSMENT COMPLETE — Ready for Implementation Planning
**Source:** `Master-SparkForge-UI-Design-Change.md` + `SparkForge-Full-ControlScreen.json` (1,081 lines, 11 sections)
**Decision:** UI-1 through UI-18 (18 new architectural decisions)

---

### A.1 EXECUTIVE SUMMARY

SparkForge is migrating from a **split architecture** (3D cockpit at z-index 0 + full-screen HTML at z-index 10) to a **unified 3D cockpit interface** where every dashboard element renders inside a single persistent R3F Canvas. The HTML layer completely obscured the 37.8M-triangle cockpit — making the 3D investment invisible.

#### Migration Scale

| Metric | Count |
|--------|-------|
| Source files affected (REPLACE + MODIFY) | **~90** |
| Source files preserved (zero changes) | **~320** |
| New source files to create | **~24** |
| Stage documents requiring updates | **~45** |
| Reference documents requiring updates | **~8** |
| Root documents requiring updates | **~3** |
| New npm dependencies | **0** (@react-three/uikit already installed) |
| New decision locks | **18** (UI-1 through UI-18) |
| New cockpitStore fields | **4** (audio controls) |
| Estimated LOC replaced/rewritten | **~11,700** |
| Estimated LOC preserved | **~45,000+** |

#### What Changes

| Layer | Before | After |
|-------|--------|-------|
| Dashboard pages | Full HTML pages (248–689 LOC each) | Thin scene descriptors (~20–30 LOC each) via `useCockpitScene()` |
| Navigation | HTML Sidebar.tsx (DOM links) | 3D NavigationButtonGrid (already built) + sr-only HTML fallback |
| Settings | HTML toggles + sliders | ToggleSwitch3D + RadialDial3D (already built) |
| Forms (login, signup, chat) | HTML `<form>` + `<input>` | uikit Input with hidden HTML proxy |
| Data displays | Tailwind cards + grids | HolographicCard + HolographicPanel (already built) |
| Game UI overlays | HTML score/timer/quiz | 3D GameScoreGauge + QuizPanel3D (new) |
| Celebrations | Framer Motion overlay | CeremonyFX (already 3D) + broadcast events |
| Page transitions | CSS crossfade | 400ms ease-out-cubic crossfade in 3D + MechanicalIris for games |
| Glassmorphism | CSS backdrop-filter | Opaque metallic: carbon composite + chrome bezel |

#### What Does NOT Change

- **~172 3D components** (cockpit, environments, game scenes, hero animation, 3D UI migration)
- **8 existing 3D UI primitives** (HolographicButton, RadialDial3D, ToggleSwitch3D, NavigationButtonGrid, etc.)
- **37 custom hooks** (React Query data layer)
- **31 API routes** (backend unchanged)
- **15 Zustand stores** (13 existing + cockpitUIStore new; sceneStore extended with gameHUDContent)
- **47 shader files** (GLSL + TSL)
- **35 game 3D environments**
- **cockpitBroadcastStore** (16 events already defined)
- **cockpitMaterials.ts** (7 factories match JSON spec)
- **CockpitAudioEngine** + 10 lab soundscapes

#### Stays HTML (SEO / Accessibility / Compliance)

| Category | Reason |
|----------|--------|
| Marketing landing page body (`/pricing`, `/terms`, `/privacy`) | SEO — Google must crawl |
| Screen-reader nav (Sidebar.tsx sr-only) | WCAG accessibility |
| Error/offline pages | Must work without WebGL |
| Admin panel (`/admin/content`) | Internal tool |
| Hidden text input proxy | Browser keyboard/paste/autocomplete |

---

### A.2 SOURCE CODE IMPACT — FILE-BY-FILE CORRECTION PLAN

Every `/src/` file categorized by migration impact. **REPLACE** = file becomes thin 3D scene descriptor. **MODIFY** = file needs partial changes (add hooks, remove HTML, adjust wiring). **PRESERVE** = zero changes needed.

#### A.2.1 REPLACE — Files Becoming 3D Scene Descriptors (~22 files, ~4,200 LOC removed)

These files lose their HTML/Tailwind UI and become minimal wrappers that feed scene data to the cockpit via `useCockpitScene()`.

| File | Lines | Replacement |
|------|-------|-------------|
| `src/app/(dashboard)/home/page.tsx` | 248 | → `DashboardCenter.tsx` (lab map + welcome + CTA) |
| `src/app/(dashboard)/labs/page.tsx` | 199 | → `LabsCenter.tsx` (zoomed lab map) |
| `src/app/(dashboard)/labs/[labId]/page.tsx` | 256 | → `LabDetailPanel.tsx` (lab structure + orbital cards) |
| `src/app/(dashboard)/arcade/page.tsx` | 275 | → `ArcadePanel.tsx` (4-column scrollable game grid) |
| `src/app/(dashboard)/profile/page.tsx` | 689 | → `ProfileCenter.tsx` (3D trophy room + avatar) |
| `src/app/(dashboard)/settings/page.tsx` | 248 | → `SettingsPanel.tsx` (3D toggle/dial controls) |
| `src/app/(dashboard)/onboarding/page.tsx` | 347 | → `OnboardingPanel.tsx` (3D step wizard) |
| `src/app/(auth)/login/page.tsx` | ~120 | → `LoginPanel3D.tsx` (uikit form + portal) |
| `src/app/(auth)/signup/page.tsx` | ~120 | → `LoginPanel3D.tsx` (shared auth panel) |
| `src/components/shared/CelebrationOverlay.tsx` | 446 | → CeremonyFX (already 3D) + broadcast triggers |
| `src/components/gamification/TrophyRoom.tsx` | ~80 | → `ProfileCenter.tsx` BadgePedestal3D array |
| `src/components/gamification/BadgeDisplay.tsx` | ~60 | → BadgeLevitate3D (already 3D) |
| `src/components/gamification/BadgeGrid.tsx` | ~80 | → HolographicCard grid in ProfileCenter |
| `src/components/gamification/LevelProgress.tsx` | ~70 | → RadialDial3D gauge (left quadrant) |
| `src/components/content/LessonViewer.tsx` | ~150 | → HolographicPanel in center viewport |
| `src/components/content/QuizEngine.tsx` | ~300 | → `QuizPanel3D.tsx` (new 3D component) |
| `src/components/content/CompletionIndicator.tsx` | ~50 | → CeremonyFX burst trigger |
| `src/components/auth/LoginFormCard.tsx` | ~80 | → uikit Input panel in LoginPanel3D |
| `src/components/parent/PaywallModal.tsx` | ~60 | → center screen takeover (3D modal) |
| `src/components/parent/UpgradePrompt.tsx` | ~70 | → HolographicPanel center modal |
| `src/components/dashboard/SpatialOverlay.tsx` | ~80 | → absorbed into CockpitUILayer |
| `src/components/dashboard/TrendingFeed.tsx` | ~100 | → right quadrant activity log scroll |

#### A.2.2 MODIFY — Files Needing Partial Changes (~47 files, ~7,500 LOC touched)

| File | Lines | Changes Needed |
|------|-------|----------------|
| **Layouts & Root** | | |
| `src/app/layout.tsx` | ~120 | Add CockpitCanvas provider at root level |
| `src/app/(dashboard)/layout.tsx` | 152 | Remove visual Sidebar; keep sr-only nav; wire `useCockpitScene` |
| `src/app/(auth)/layout.tsx` | ~100 | Update 3D canvas portal setup for unified entry |
| `src/app/(marketing)/page.tsx` | ~100 | Embed `MarketingHero3D` canvas; keep HTML body for SEO |
| `src/app/globals.css` | ~500 | Add cockpit CSS variables; remove dashboard Tailwind tokens |
| **Dashboard Pages** | | |
| `src/app/(dashboard)/arcade/[gameSlug]/page.tsx` | 259 | Remove HTML game UI overlay; wire to sceneStore game mode |
| `src/app/(dashboard)/content/[slug]/page.tsx` | 46 | Wire to content hologram in center viewport |
| `src/app/(dashboard)/parent/page.tsx` | 585 | Parent stats → `ParentPanel.tsx` 3D gauges |
| `src/app/(dashboard)/parent/add-child/page.tsx` | 282 | Form → uikit Input with hidden HTML proxy |
| `src/app/(dashboard)/parent/subscription/page.tsx` | 344 | Billing UI → center screen 3D modal |
| `src/app/(dashboard)/parent/export/page.tsx` | 650 | Export UI → 3D data panel |
| `src/app/(dashboard)/parent/prompt-history/page.tsx` | 475 | History list → scrollable 3D activity log |
| **Game Components** | | |
| `src/components/game/GameShell.tsx` | ~120 | Add sceneStore broadcast wiring; update mode transitions |
| `src/components/game/XPPopup.tsx` | ~60 | Replace motion.div with 3D particle burst |
| `src/components/game/StreakFire.tsx` | ~50 | Streak display → 3D StreakFlame3D trigger |
| `src/components/game/GameCompleteCelebration.tsx` | ~100 | Overlay → CeremonyFX broadcast event |
| **Shared Components** | | |
| `src/components/shared/ContinueBanner.tsx` | 66 | Remove visual HTML; keep logic for sceneStore |
| `src/components/shared/LoadingSkeleton.tsx` | 75 | Replace with 3D loading animation |
| `src/components/shared/LoadingScreen.tsx` | 57 | Loading → cockpit boot sequence animation |
| `src/components/shared/EmptyState.tsx` | 32 | Empty card → minimal uikit Text |
| `src/components/shared/ErrorBanner.tsx` | 42 | Error → 3D HUD alert via toast store |
| `src/components/shared/StepIndicator.tsx` | 56 | Step dots → `PhaseIndicator3D.tsx` |
| `src/components/shared/ToastContainer.tsx` | 56 | Toast → 3D toast zone with broadcast audio |
| `src/components/shared/FeatureGate.tsx` | 21 | Update gate logic for 3D scene states |
| **Content Components** | | |
| `src/components/content/BranchingLessonRenderer.tsx` | ~100 | Branching UI → holographic flow panel |
| `src/components/content/SparkFactViewer.tsx` | ~80 | Fact display → 3D text hologram popup |
| **Auth Components** | | |
| `src/components/auth/DemoLoginButton.tsx` | ~40 | Demo button → 3D nav integration broadcast |
| `src/components/auth/DemoSessionBanner.tsx` | ~50 | Banner → 3D HUD countdown callout |
| `src/components/auth/DemoGuard.tsx` | ~30 | Logic preserved; update state calls |
| **Parent Components** | | |
| `src/components/parent/TimeLimitBanner.tsx` | ~60 | Timer alert → 3D center overlay panel |
| `src/components/parent/ParentLoadingSkeleton.tsx` | ~50 | Skeleton → 3D loading state |
| **UI Components** | | |
| `src/components/ui/GuideChatPanel.tsx` | ~200 | Chat panel → `ChatPanel3D.tsx` wrapper |
| `src/components/ui/OfflineBanner.tsx` | ~50 | Offline → 3D HUD alert text |
| `src/components/ui/LoadingSkeleton.tsx` | ~60 | Skeleton → 3D spinner animation |
| `src/components/ui/ParticleIntensitySlider.tsx` | ~80 | HTML slider → RadialDial3D control |
| `src/components/ui/ErrorBoundary.tsx` | ~60 | Add Canvas error boundary logic |
| **Accessibility** | | |
| `src/components/accessibility/AccessibilityToolbar.tsx` | ~80 | Toolbar → floating 3D settings icon |
| **Transitions** | | |
| `src/components/transitions/GameFocusSequence.tsx` | ~100 | Sequence → MechanicalIris + FOV scale transition |
| `src/components/transitions/LabReconfiguration.tsx` | ~80 | Reconfig → variable dial reset animation |
| **Layout** | | |
| `src/components/layout/Sidebar.tsx` | ~100 | Keep sr-only; add keyboard nav broadcast |
| **Providers** | | |
| `src/components/providers/AuthProvider.tsx` | ~80 | Add 3D auth mode detection |
| `src/components/providers/PageTransitionProvider.tsx` | ~60 | Wire transitions to sceneStore |
| **Stores** (3 files) | | |
| `src/stores/cockpitStore.ts` | ~300 | +4 audio fields, +mode preset state |
| `src/stores/uiStore.ts` | 63 | +mode presets, update gameActive → sceneStore |
| `src/stores/sceneStore.ts` | 146 | +centerContentType, +page route mapping |
| **Hooks** (4 files) | | |
| `src/hooks/useStationMode.ts` | ~150 | Add auto mode-selection per route (8 presets) |
| `src/hooks/useCockpitAudio.ts` | ~300 | Wire spatial audio per mode changes |
| `src/hooks/useAdaptiveCockpit.ts` | ~60 | Fine-tune 3D layout breakpoints |
| `src/hooks/useAuthHover.ts` | ~40 | Update for 3D raycasting hover |

#### A.2.3 PRESERVE — Files With Zero Changes (~320 files)

| Category | Count | Examples |
|----------|-------|---------|
| 3D components (cockpit, hero, scenes) | ~75 | CockpitCanvas, HeroAnimation, StationFrame, SceneRouter, MechanicalIris |
| 3D UI primitives | 9 | HolographicButton, RadialDial3D, NavigationButtonGrid, CenterViewportScreen |
| 3D game environments | 35 | PetTrainerEnvironment, SortToyBoxEnvironment, all StandardEnvironmentBase games |
| 3D creatures & NPCs | 8 | CreatureBase, 5 species, GuideAvatar3D, AmbientNPCs |
| 3D FX & particles | 10 | CeremonyFX, XPVortex, LevelUpExplosion, GameParticles3D |
| Procedural environment system | 7 | ProceduralTerrain, SkyDome, Fog, Lighting, Props |
| Shaders (GLSL + TSL) | 47 | 10 lab patterns + TSL ports + hero/aurora/dissolve shaders |
| API routes | 31 | All `/api/` routes (auth, children, progress, stripe, agent, health) |
| Data hooks (React Query) | 29 | useChildren, useContent, useProgress, useGamification, useSortAudio |
| Stores (unchanged) | 10 | authStore, childStore, gameStore, parentStore, guideStore, etc. |
| Utility libraries | 43 | utils.ts, animations.ts, validations.ts, tier-config.ts, all agent/* |
| Config files | 2 | gameRegistry.ts, creatureConfig.ts |
| Types | 2 | types/index.ts, types/shaders.d.ts |
| Middleware | 2 | middleware.ts, tierCheck.ts |
| Mocks | 3 | browser.ts, handlers.ts, server.ts |
| Error/system pages | 5 | error.tsx, global-error.tsx, offline/page.tsx, robots.ts, sitemap.ts |
| Marketing components | 6 | ScrollJourney, FeatureShowcase, StationPreview, MarketingHeader/Footer |
| Games (35 game .tsx files) | 35 | All game logic files — Phase 5-6 migrates UI, not game logic |

#### A.2.4 IMPACT SUMMARY TABLE

| Category | REPLACE | MODIFY | PRESERVE | Total |
|----------|---------|--------|----------|-------|
| Page files | 9 | 8 | 2 | 19 |
| Shared components | 2 | 8 | 1 | 11 |
| Gamification components | 4 | 0 | 1 | 5 |
| Content components | 3 | 2 | 0 | 5 |
| Auth components | 1 | 3 | 0 | 4 |
| Parent components | 2 | 2 | 0 | 4 |
| Game/UI components | 0 | 7 | 0 | 7 |
| Dashboard components | 2 | 0 | 0 | 2 |
| Layout/Transitions | 0 | 3 | 0 | 3 |
| Providers | 0 | 2 | 1 | 3 |
| 3D components | 0 | 0 | ~140 | ~140 |
| Stores | 0 | 3 | 10 | 13 |
| Hooks | 0 | 4 | 31 | 35 |
| API routes | 0 | 0 | 31 | 31 |
| CSS files | 0 | 1 | 1 | 2 |
| Everything else | 0 | 0 | ~100 | ~100 |
| **TOTALS** | **~22** | **~47** | **~320** | **~390** |

### A.3 DOCUMENTATION IMPACT MAP — EVERY DOC FILE CATEGORIZED

Every documentation file categorized: **MAJOR UPDATE** (contains HTML code to rewrite), **MINOR UPDATE** (references HTML patterns), **ARCHITECTURE UPDATE** (defines rules needing 3D UI sections), **NO CHANGE** (unaffected).

#### A.3.1 Root Documents

| File | Impact | Changes Required |
|------|--------|-----------------|
| `CLAUDE.md` | **ARCHITECTURE** | Section 7 (game template): add 3D UI pattern. Section 8 (conventions): add 3D panel naming. Section 9 (3D rules): add UI-1–UI-18 decisions. Section 14 (stores): add cockpitStore audio fields. Add new Section 15: 3D UI Architecture. |
| `Master-SparkForge-UI-Design-Change.md` | NO CHANGE | Source of truth for this migration |
| `ENHANCEMENT_BLUEPRINT_v1.0.md` | **MINOR** | Section 1 references HTML dashboard — update to reference unified 3D |
| `TESTING.md` | **MINOR** | Add 3D UI testing patterns (raycasting, uikit, Canvas interaction tests) |
| `Feature-Workflow-Test.md` | **MINOR** | Add 3D panel feature workflow |
| `database-patterns.md` | NO CHANGE | Backend-only, no UI references |
| `SparkForge-agent.md` | NO CHANGE | Agent pipeline, no UI code |
| `PROGRESS.md` | **MINOR** | Add Phase 11: 3D UI Migration tracking rows |
| `DEPLOYMENT.md` | NO CHANGE | Deployment procedures unchanged |
| All `AUDIT_REPORT*.md` | NO CHANGE | Historical reference |
| `Cockpit-Interface-Plan.md` | NO CHANGE | Precursor to Master UI Design Change |

#### A.3.2 Reference Documents — `docs/00-reference/`

| File | Impact | Changes Required |
|------|--------|-----------------|
| `SparkForge_Master_Implementation_Guide_v3.2.md` | **ARCHITECTURE** | THIS APPENDIX. Also: Section 3 (document-to-code map) needs Phase 11 entries. Section 4 (source registry) needs new files. Section 11 (build order) needs Phase 11 added. |
| `3D-Component-Registry.md` | **ARCHITECTURE** | Add ~24 new UI panel components. Add `CockpitUILayer` category. Update triangle budgets (+3M for UI). |
| `Per-Stage-Playbooks.md` | **ARCHITECTURE** | Add Phase 11 playbook (7 sub-phases). Update Stage 3-4 playbooks with 3D UI migration notes. |
| `3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md` | **MINOR** | Add UI-1–UI-18 decision cross-references. Note quadrant layout supersedes original spatial dashboard HTML overlay. |
| `GCUD_V10.2.md` | **MINOR** | Game entries reference HTML UI phases — add note that Phase 5-6 migrates game UI to 3D. |
| `QUICK_REFERENCE_35_GAMES.md` | NO CHANGE | Game metadata table, no UI code |
| `SparkForge_Master_Directory_v1.2.md` | **MINOR** | Add Phase 11 to 26-phase flow map |
| `Implementation_Plan_Hero_Page_Animation_v2.0.md` | NO CHANGE | Hero animation spec, no HTML |
| `SparkForge_Hero_Page_Animation_v2.0.md` | NO CHANGE | Hero 8-phase spec, no HTML |
| `ERROR_HANDLING_AUTOFIX_GUIDE.md` | **MINOR** | Add uikit error patterns, Canvas crash recovery |
| `KNOWN_COMPAT_NOTES.md` | **MINOR** | Add @react-three/uikit compatibility notes |
| `Upgrade-3D-Panoramic-Cockpit-2026-03-20.md` | NO CHANGE | Historical changelog |
| `COCKPIT_INTEGRATION_ARCHITECTURE_v1.0.md` | NO CHANGE | Precursor reference |
| `SPARKFORGE_AUDIT_AGENT.md` | NO CHANGE | Audit process doc |
| `MARKET_RESEARCH_COMPETITIVE_ANALYSIS.md` | NO CHANGE | Market research |

#### A.3.3 Stage Documents — By Stage

**Stage 1: Foundation** — `docs/stage1-foundation/`

| File | Impact | Reason |
|------|--------|--------|
| `STAGE1_Foundation_v2_PART1.md` | **MINOR** | Creates `globals.css`, `layout.tsx` — will need 3D CSS token updates |
| `STAGE1_Foundation_v2_PART2.md` | **MINOR** | Creates stores, hooks — cockpitStore needs audio field additions |

**Stage 2: Database & API** — `docs/stage2-database-api/`

| File | Impact | Reason |
|------|--------|--------|
| `STAGE2_Database_API_v2_PART1-4.md` (4 files) | NO CHANGE | SQL, API routes, data hooks — no UI code |

**Stage 3: Auth & Layout** — `docs/stage3-auth-layout/`

| File | Impact | Reason |
|------|--------|--------|
| `STAGE3_Auth_Layout_Shell_v2_PART1.md` | **MAJOR** | Creates auth pages (login, signup, reset), auth layout — all become 3D |
| `STAGE3_Auth_Layout_Shell_v2_PART2.md` | **MAJOR** | Creates dashboard layout, Sidebar, shared components (CelebrationOverlay, ContinueBanner, LoadingSkeleton, EmptyState, ErrorBanner, ToastContainer) — all MODIFY or REPLACE |
| `STAGE3_Auth_Layout_Shell_v3_PART3A.md` | **MINOR** | Creates StationFrame, 3D shell, marketing layout — StationFrame thin wrapper update |
| `STAGE3_Auth_Layout_Shell_v3_PART3B.md` | **MINOR** | Creates OnboardingCrystal, shaders — onboarding page becomes 3D wizard |
| `COCKPIT_CPA2_v3FINAL_PartA.md` | NO CHANGE | Pure 3D cockpit geometry — preserved |
| `COCKPIT_CPA2_v3FINAL_PartB.md` | NO CHANGE | Spatial dashboard 3D — preserved |
| `HERO_ANIMATION_v3FINAL_PartA.md` | NO CHANGE | Hero shaders/stores — preserved |
| `HERO_ANIMATION_v3FINAL_PartB.md` | NO CHANGE | Hero particles/audio — preserved |
| `LOGIN_3D_v3FINAL_PartA.md` | **MAJOR** | Creates LoginPortal3D, DemoLoginButton, DemoSessionBanner, auth layout replacement — all need 3D UI update |
| `LOGIN_3D_v3FINAL_PartB.md` | **MAJOR** | Creates LoginFormCard, DemoGuard, enhanced login page — forms migrate to uikit |

**Stage 4: Core Pages** — `docs/stage4-core-pages/`

| File | Impact | Reason |
|------|--------|--------|
| `STAGE4_Core_Pages_v2_PART1.md` | **MAJOR** | Creates dashboard home, labs, arcade, lab detail pages — all become scene descriptors |
| `STAGE4_Part2A_v3FINAL.md` | NO CHANGE | Lab pattern GLSL shaders — preserved |
| `STAGE4_Part2B_v3FINAL.md` | **MINOR** | Creates LabReconfiguration, GameFocusSequence — transitions need 3D update |
| `STAGE4_Core_Pages_v2_PART3.md` | **MAJOR** | Creates profile, settings, content pages — all become 3D panels |

**Stage 5: Gamification** — `docs/stage5-gamification/`

| File | Impact | Reason |
|------|--------|--------|
| `STAGE5_Gamification_Profile_PART1.md` | **MAJOR** | Creates BadgeDisplay, BadgeGrid, LevelProgress, TrophyRoom — all REPLACE with 3D |
| `STAGE5_Parts23A_v3FINAL.md` | NO CHANGE | Reward shaders — preserved |
| `STAGE5_Parts23B_v3FINAL.md` | **MINOR** | Creates XPVortex, BadgePedestal3D (already 3D) + ParticleIntensitySlider (HTML → dial) |
| `STAGE5_Parts23C_v3FINAL.md` | NO CHANGE | 3D particles, ceremonies — preserved |

**Stage 6: Flagship Games** — `docs/stage6-flagship/`

| File | Impact | Reason |
|------|--------|--------|
| `STAGE6B_v3FINAL_A.md` | NO CHANGE | Pet Trainer 3D components — preserved |
| `STAGE6B_v3FINAL_B.md` | **MAJOR** | PetTrainerGame.tsx — game UI migrates to 3D panels (Phase 5) |
| `STAGE6C_v3FINAL_A.md` | NO CHANGE | Neural Builder 3D — preserved |
| `STAGE6C_v3FINAL_B.md` | **MAJOR** | NeuralBuilderGame.tsx — game UI migrates (Phase 5) |
| `STAGE6D_v2_PromptLab.md` | **MAJOR** | PromptLabGame.tsx — game UI migrates (Phase 5) |
| `STAGE6D_v2_Enhancements.md` | **MINOR** | Prompt Lab enhancements — partial UI references |
| `STAGE6D_v3FINAL_PartA.md` | NO CHANGE | Prompt Lab 3D — preserved |
| `STAGE6D_v3FINAL_PartB.md` | **MINOR** | Enhanced game — partial UI updates |
| `STAGE6E_v3FINAL_A.md` | NO CHANGE | Agent Architect 3D — preserved |
| `STAGE6E_v3FINAL_B.md` | **MAJOR** | AgentArchitectGame.tsx — game UI migrates (Phase 5) |
| `STAGE6E_v3FINAL_C.md` | NO CHANGE | Verification — no UI code |
| `STAGE6F_v3FINAL_A.md` | NO CHANGE | Bias Detective 3D — preserved |
| `STAGE6F_v3FINAL_B.md` | **MAJOR** | BiasDetectiveGame.tsx — game UI migrates (Phase 5) |
| `STAGE6F_v3FINAL_C.md` | NO CHANGE | Verification — no UI code |

**Stage 7: Remaining Games** — `docs/stage7-remaining-games/`

| Substage | Files | Impact | Reason |
|----------|-------|--------|--------|
| 7A (4 docs) | BatchA, Part2, Part3, Part4 | **MAJOR** | 9 game .tsx files — all have HTML game UI that migrates in Phase 6 |
| 7B (3 docs) | v3FINAL PartA/B/C | **MAJOR** | 4 game .tsx files — HTML game UI migrates. 3D components preserved. |
| 7C (5 docs) | Part1, Part2, v3FINAL A/B/C | **MAJOR** | 6 game .tsx files — HTML game UI migrates. 3D components preserved. |
| 7D (4 docs) | Part1, v3FINAL A/B/C | **MAJOR** | 5 game .tsx files — HTML game UI migrates. 3D components preserved. |
| 7E (2 docs) | Part1, Part2 | **MAJOR** | 3 game .tsx files — HTML game UI migrates. |
| 7F (4 docs) | v3FINAL A/B, Part1, Part2 | **MAJOR** | 3 game .tsx files — HTML game UI migrates. 3D components preserved. |
| 7 Shared (2 docs) | Shared Systems, XP Celebration | **MAJOR** | GameShell, XPPopup, GameCompleteCelebration — all MODIFY |

**Stage 8: Parent Dashboard** — `docs/stage8-parent-dashboard/`

| File | Impact | Reason |
|------|--------|--------|
| `STAGE8_Parent_Dashboard_v2_PART1.md` | **MINOR** | Creates parentStore, Stripe routes, hooks — mostly preserved. tierCheck middleware unchanged. |
| `STAGE8_Parent_Dashboard_v2_PART2.md` | **MAJOR** | Creates parent pages (parent, add-child, subscription), PaywallModal, TimeLimitBanner, UpgradePrompt — all MODIFY/REPLACE |
| `STAGE8_P3_v3FINAL_A.md` | **MINOR** | ScrollJourney, LabDiscoveryRing — landing stays HTML for SEO but gets 3D hero embed |
| `STAGE8_P3_v3FINAL_B.md` | **MINOR** | FeatureShowcase, StationPreview — marketing HTML preserved for SEO |
| `STAGE8_P3_v3FINAL_C.md` | **MINOR** | Pricing page — stays HTML for SEO |

**Stage 9: Content Agent** — `docs/stage9-content-agent/`

| File | Impact | Reason |
|------|--------|--------|
| `STAGE9_Content_Agent_v2_PART1.md` | NO CHANGE | Agent pipeline, prompts, API — no UI code |
| `STAGE9_Content_Agent_v2_PART2.md` | **MINOR** | Admin content page — stays HTML (internal tool, UI-1 exemption) |
| `STAGE9_Content_Agent_v2_PART3.md` | NO CHANGE | Seed content data — no UI code |

**Stage 10: Polish & Deploy** — `docs/stage10-polish-deploy/`

| File | Impact | Reason |
|------|--------|--------|
| `STAGE10_Polish_Deploy_v2_PART1.md` | **MAJOR** | Creates AccessibilityToolbar (→ 3D), OfflineBanner (→ HUD), LoadingSkeleton (→ 3D), not-found.tsx update |
| `STAGE10_Polish_Deploy_v2_PART2.md` | **MINOR** | Production config, game router — gameSlug page needs sceneStore wiring |

**Enhancement Documents** — `docs/enhancements/`

| File | Impact | Reason |
|------|--------|--------|
| `DESKTOP_FIRST_3D_OVERHAUL_PartA-D.md` (4 files) | **MINOR** | D3D decisions still valid; add UI-1–UI-18 cross-references |
| `AI_GUIDE_AVATAR_ENHANCEMENT_PLAN.md` | NO CHANGE | Future enhancement — already 3D |

#### A.3.4 DOCUMENTATION IMPACT SUMMARY

| Impact Level | Count | Examples |
|-------------|-------|---------|
| **MAJOR UPDATE** | ~32 | Stage 3 P1-P2, Stage 4 P1+P3, Stage 5 P1, all 6 flagship game docs, all 22 Stage 7 game docs, Stage 8 P2, Stage 10 P1 |
| **MINOR UPDATE** | ~18 | CLAUDE.md, Stage 1 P1-P2, Login3D, Stage 4 P2B, Stage 5 P23B, Stage 8 P1+P3, TESTING.md, reference docs |
| **ARCHITECTURE UPDATE** | ~4 | Master Implementation Guide, 3D-Component-Registry, Per-Stage-Playbooks, CLAUDE.md |
| **NO CHANGE** | ~74 | All SQL, API-only, pure 3D specs, hero animation, cockpit geometry, shaders, superseded docs |
| **TOTAL** | ~128 | |

### A.4 NEW FILES, DEPENDENCIES & STORE CHANGES

#### A.4.1 New Source Files to Create (~24 files)

All new files go under existing directories. No new directory structure needed.

**Infrastructure — `src/hooks/` + `src/components/3d/ui/`** (7 files)

| File | Location | Purpose | Triangle Budget |
|------|----------|---------|----------------|
| `useCockpitScene.ts` | `src/hooks/` | Hook: per-route scene descriptor manager. Returns `{ centerContent, modePreset, pageData }`. Reads Next.js router, drives CockpitUILayer. | — |
| `CockpitUILayer.tsx` | `src/components/3d/ui/` | Orchestrator: manages all 3D UI panels, handles mode transitions (400ms crossfade), wires quadrant layout. Renders inside CockpitCanvas. | — |
| `CockpitText.tsx` | `src/components/3d/ui/` | Primitive: uikit Text wrapper with Frost-Prismatic styling (Exo 2 / Sora / Orbitron fonts, #F0F0F4 color, emissive options). | Part of 3M |
| `CockpitContainer.tsx` | `src/components/3d/ui/` | Primitive: uikit Container wrapper with carbon composite background + chrome bezel border. | Part of 3M |
| `CockpitScrollPanel.tsx` | `src/components/3d/ui/` | Primitive: uikit scroll container with LED scroll indicator strip. For activity log, game grid, trophy gallery. | Part of 3M |
| `CockpitInput.tsx` | `src/components/3d/ui/` | Primitive: uikit Input with hidden HTML `<input>` proxy for keyboard/paste/autocomplete. SDF text + per-character spring animation. | Part of 3M |
| `CockpitTooltip.tsx` | `src/components/3d/ui/` | Primitive: 3D holographic tooltip panel. Auto-positioned, 300ms delay, chrome bezel, carbon composite background. | Part of 3M |

**Dashboard Panels — `src/components/3d/panels/`** (6 files, NEW directory)

| File | Route | Center Content | Triangle Budget |
|------|-------|----------------|----------------|
| `DashboardCenter.tsx` | `/home` | HolographicLabMap + welcome stats (uikit Text) + Continue CTA (HolographicButton) | Reuses existing 1M lab map |
| `DashboardLeft.tsx` | All | AvatarPreview3D + GuideAvatar3D + 3 BadgePedestal3D + 4 RadialDial3D gauges (XP, Level, Streak, Progress) | ~500K new |
| `DashboardRight.tsx` | All | Settings quick-access (2 toggles + 2 dials) + CockpitScrollPanel activity log (20 items) + 4 HolographicButton quick actions | ~500K new |
| `LabsCenter.tsx` | `/labs` | Zoomed HolographicLabMap with game counts per node, click→focus, double-click→enter | Reuses existing |
| `LabDetailPanel.tsx` | `/labs/[id]` | LabStructure3D (300K) + orbital HolographicCard ring (game list) | ~500K new |
| `ArcadePanel.tsx` | `/arcade` | 4-column CockpitScrollPanel grid of HolographicCards (35 game tiles). Filterable by lab. | ~500K new |

**Page-Specific Panels — `src/components/3d/panels/`** (5 files)

| File | Route | Content |
|------|-------|---------|
| `ProfileCenter.tsx` | `/profile` | BadgePedestal3D array (9 categories) + enlarged AvatarPreview3D with cosmetic ring |
| `SettingsPanel.tsx` | `/settings` | HolographicPanel array: Audio (3 controls), Visual (2 controls), Cockpit Skin (5-card grid) |
| `ParentPanel.tsx` | `/parent` | Parent analytics: children overview, time limits, subscription status (uikit Text + RadialDial3D gauges) |
| `LoginPanel3D.tsx` | `/login`, `/signup` | uikit form panel (CockpitInput for email/password) + 3D portal background. Replaces LoginFormCard. |
| `OnboardingPanel.tsx` | `/onboarding` | Multi-step 3D wizard in center viewport. CockpitContainer per step. |

**Game UI — `src/components/3d/ui/`** (5 files)

| File | Purpose | Used By |
|------|---------|---------|
| `GameScoreGauge.tsx` | Animated score display gauge with number spring animation | All 35 games |
| `GameTimerDisplay.tsx` | Countdown timer with visual warning states (amber <30s, red <10s) | Timed games |
| `QuizPanel3D.tsx` | Quiz question + answer buttons + streak indicator | Tap & Quiz games (9) |
| `ChatPanel3D.tsx` | Chat/dialogue panel for AI interaction games | Chatbot Builder, Prompt Lab |
| `PhaseIndicator3D.tsx` | Multi-phase progress display ("Phase 2/4") with holographic markers | All phased games |

**Marketing — `src/components/3d/`** (1 file)

| File | Purpose |
|------|---------|
| `MarketingHero3D.tsx` | 3D cockpit preview embedded in HTML marketing landing page. Canvas inset in scrollable HTML body. |

#### A.4.2 New Directory

| Directory | Purpose |
|-----------|---------|
| `src/components/3d/panels/` | Dashboard panel components (center/left/right/page-specific). Separates UI panels from geometry/FX. |

#### A.4.3 NPM Dependencies

| Package | Status | Version | Purpose |
|---------|--------|---------|---------|
| `@react-three/uikit` | **ALREADY INSTALLED** | ^1.0.64 | Text, Input, Container, scroll — core 3D UI primitives |
| `@react-three/uikit-apfel` | **ALREADY INSTALLED** | ^0.8.21 | Apple-style presets for uikit |
| `@react-three/fiber` | INSTALLED | ^9.5.0 | R3F core |
| `@react-three/drei` | INSTALLED | ^10.7.7 | Html proxy, useTexture, etc. |
| `three` | INSTALLED | ^0.183.2 | Three.js core |
| `tone` | INSTALLED | ^15.1.22 | Audio synthesis |

**Zero new npm dependencies required.** The stack is complete.

#### A.4.4 Store State Changes

**`src/stores/cockpitStore.ts`** — Add 4 audio control fields:

| Field | Type | Default | Binding (JSON spec) |
|-------|------|---------|---------------------|
| `spatialAudioVolume` | `number` | `0.3` | Spatial FX volume dial (0–1) |
| `eventAudioVolume` | `number` | `0.5` | UI sounds volume dial (0–1) |
| `mechanicalAudioDensity` | `number` | `0.7` | Mechanical detail dial (0=atmospheric, 1=every click has audio) |
| `labAudioEnabled` | `boolean` | `true` | Lab soundscape crossfade toggle |

Plus 4 setter actions: `setSpatialAudioVolume`, `setEventAudioVolume`, `setMechanicalAudioDensity`, `setLabAudioEnabled`.

**Already exists:** `cockpitAudioEnabled` (boolean), `ambientVolume` (number, 0.15).

**`src/stores/uiStore.ts`** — Add mode preset state:

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `cockpitMode` | `'dashboard' \| 'labs' \| 'lab_detail' \| 'game' \| 'profile' \| 'settings' \| 'celebration' \| 'parent'` | `'dashboard'` | Active cockpit atmosphere mode |

**`src/stores/sceneStore.ts`** — Add center content routing:

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `centerContentType` | `'labmap' \| 'labmap_zoomed' \| 'lab_detail' \| 'arcade_grid' \| 'trophy_room' \| 'settings' \| 'parent' \| 'login' \| 'onboarding' \| 'game' \| 'content'` | `'labmap'` | What renders in center viewport |
| `centerContentProps` | `Record<string, unknown>` | `{}` | Props passed to center panel (labId, gameSlug, etc.) |

#### A.4.5 Existing 3D UI Components — Already Built (Zero Changes)

These 8 components are the **foundation** for the migration. New panel files compose them.

| Component | File | Status | Used By |
|-----------|------|--------|---------|
| HolographicButton | `src/components/3d/ui/HolographicButton.tsx` | READY | Nav, CTAs, quick actions |
| RadialDial3D | `src/components/3d/ui/RadialDial3D.tsx` | READY | Gauges, volume, settings |
| ToggleSwitch3D | `src/components/3d/ui/ToggleSwitch3D.tsx` | READY | Audio, particles, settings |
| HolographicCard | `src/components/3d/ui/HolographicCard.tsx` | READY | Game tiles, lab cards, badges |
| HolographicPanel | `src/components/3d/ui/HolographicPanel.tsx` | READY | Settings sections, containers |
| NavigationButtonGrid | `src/components/3d/ui/NavigationButtonGrid.tsx` | READY | Primary 5-button nav |
| VariableDialCluster | `src/components/3d/ui/VariableDialCluster.tsx` | READY | Bottom 3 dials per-page |
| CenterViewportScreen | `src/components/3d/ui/CenterViewportScreen.tsx` | READY | Center viewport shell |

### A.5 IMPLEMENTATION PHASES, CLAUDE.MD IMPACT & RISK MITIGATION

#### A.5.1 Implementation Phase Plan (Phase 11 — 3D UI Migration)

Inserts into the Build Execution Plan (Section 11) after Phase 26 (Stage 10). Decision UI-18 mandates phased migration: dashboard first, then flagships, then standard games.

| Sub-Phase | Week | Scope | New Files | Modified Files | Hard Stops |
|-----------|------|-------|-----------|----------------|------------|
| **11A: Infrastructure** | 1 | `useCockpitScene`, `CockpitUILayer`, 5 uikit primitives (Text, Container, ScrollPanel, Input, Tooltip) | 7 | 3 (stores) | — |
| **11B: Dashboard** | 2 | 6 pages → scene descriptors. Create DashboardCenter/Left/Right, LabsCenter, LabDetailPanel, ArcadePanel | 6 | 6 (pages) | HS-5 (visual verify) |
| **11C: Auth + Forms** | 3 | Login/signup → LoginPanel3D, OnboardingPanel. Chat → ChatPanel3D. | 3 | 4 (auth pages/layout) | HS-5 |
| **11D: Gamification** | 3–4 | Celebration → CeremonyFX broadcast. XP/streak → 3D triggers. Profile → ProfileCenter. Settings → SettingsPanel. Parent → ParentPanel. | 3 | 12 (shared + game components) | — |
| **11E: Flagship Games** | 4–5 | 6 flagship game UIs → 3D panels. Create GameScoreGauge, GameTimerDisplay, QuizPanel3D, PhaseIndicator3D. | 4 | 6 (game files) | HS-5 |
| **11F: Standard Games** | 6–8 | 29 standard game UIs via 4 shared templates (QuizPanel3D, ChatPanel3D, PhaseIndicator3D, GameScoreGauge). | 0 | 29 (game files) | — |
| **11G: Marketing** | 8 | MarketingHero3D embedded in landing page. CSS refinements. | 1 | 2 (marketing pages) | HS-5 |

**Totals:** ~24 new files, ~55 modified files. Tag: `v0.11.0`.

#### A.5.2 CLAUDE.md Sections Requiring Updates

| Section | Current Content | Required Change |
|---------|----------------|-----------------|
| **Section 1 (Project Identity)** | Tech stack table | Add `@react-three/uikit` row. Update "Styling" from "Tailwind CSS 4" to "Tailwind CSS 4 (marketing/SEO only) + cockpitMaterials.ts (dashboard 3D)". |
| **Section 4 (Build Execution Plan)** | Phases 1–26 | Add Phase 11A–11G (3D UI Migration) after Phase 26. Add visual checkpoint HS-11. |
| **Section 5 (Per-Stage Playbooks)** | 10 stage playbooks | Add Phase 11 playbook with 7 sub-phases. |
| **Section 6 (Design System)** | Frost-Prismatic colors, glassmorphism | Add UI-3: "Opaque metallic cockpit — NOT glassmorphic. Carbon composite + chrome bezel. Holographic ONLY on center lab map." Update material references. |
| **Section 7 (Game Architecture)** | HTML game template with phase system | Add 3D game UI template pattern using `GameScoreGauge`, `QuizPanel3D`, `PhaseIndicator3D`. Note: game logic stays identical, only UI rendering changes. |
| **Section 8 (File Conventions)** | Component naming conventions | Add: `3D panels: src/components/3d/panels/NamePanel.tsx`. Add: `3D UI primitives: src/components/3d/ui/CockpitName.tsx`. |
| **Section 9 (3D Architecture)** | 140 component registry, D3D decisions | Add UI-1 through UI-18 decision locks. Add 3D UI component triangle budget (+3M). Update total to ~40.8M cockpit + ~9.2M game headroom. Add quadrant layout spec reference. |
| **Section 9.3 (Cockpit Budgets)** | 37.8M cockpit triangle budget table | Add row: "3D UI Panels (24 components) — 3,000,000 triangles". Update cockpit total to ~40.8M. |
| **Section 10 (Error Handling)** | Build/TS error patterns | Add uikit error patterns: Input proxy failures, Canvas crash on UI unmount, SDF font loading errors. |
| **Section 11 (Known Bugs)** | Bug registry | Add: `UI-MIGRATION-PHASE` tracking entry for phased rollout status. |
| **Section 14 (Stores)** | 13 stores table | Update cockpitStore entry: add `spatialAudioVolume`, `eventAudioVolume`, `mechanicalAudioDensity`, `labAudioEnabled`. Update uiStore: add `cockpitMode`. Update sceneStore: add `centerContentType`, `centerContentProps`. |

#### A.5.3 Master Implementation Guide Sections Requiring Updates (This File)

| Section | Required Change |
|---------|-----------------|
| **Section 3 (Document-to-Code Map)** | Add Phase 11 sub-stages with file creation/modification maps |
| **Section 4 (Source Code Registry)** | Add ~24 new files to Section 4.x registries |
| **Section 5 (Enhancement Map)** | Add Section 5.9: 3D UI Migration (24 files) |
| **Section 7 (Store Registry)** | Update cockpitStore, uiStore, sceneStore entries with new fields |
| **Section 8 (3D Component Registry)** | Add `3D UI Panels` category (~24 components) |
| **Section 11 (Build Execution Order)** | Add Phase 11A–11G rows after Phase 26 |

#### A.5.4 Other Documents Requiring Updates

| Document | Location | Change |
|----------|----------|--------|
| `3D-Component-Registry.md` | `docs/00-reference/` | Add ~24 UI panel components. New category: "3D UI Panels". |
| `Per-Stage-Playbooks.md` | `docs/00-reference/` | Add Phase 11 playbook (7 sub-phases with file lists + visual checkpoints). |
| `KNOWN_COMPAT_NOTES.md` | `docs/00-reference/` | Add @react-three/uikit v1.0.64 notes: Input proxy caveats, SDF font requirements. |
| `ERROR_HANDLING_AUTOFIX_GUIDE.md` | `docs/00-reference/` | Add uikit-specific error patterns and auto-fix strategies. |
| `PROGRESS.md` | Repo root | Add Phase 11 tracking rows (11A–11G). |

#### A.5.5 Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Text readability in 3D | Users can't read small text on curved surfaces | Larger fonts (14px+), geometric typefaces (Exo 2, Orbitron), high-contrast. Fallback to `drei Html` per element if needed. |
| uikit Input edge cases | Login/signup may lose keyboard/paste functionality | Hidden HTML `<input>` proxy handles native events. Fallback to `drei Html` overlay per input if uikit fails. |
| Performance: +3M triangles for UI | Frame rate drop below 50fps target | SDF text instancing, `useFrameTimeMonitor` (Plan B1). If persistent issues: `Plan B2` adaptive effect degradation. |
| Single Canvas crash | WebGL context loss kills entire UI | `Canvas3DErrorBoundary` (exists) + fallback to HTML error page. Test context loss recovery. |
| 35 game UI migrations | Massive PR surface area | Phase 5–6 uses 4 shared templates (QuizPanel3D, ChatPanel3D, PhaseIndicator3D, GameScoreGauge) covering all 29 standard games. 6 flagships get custom treatment. |
| Accessibility regression | Screen readers can't parse Canvas | sr-only Sidebar nav (preserved), ARIA live regions for state changes, `prefers-reduced-motion` reduces 8 effects to instant. |
| Glassmorphism muscle memory | Users expect transparent frosted panels | UI-3 decision lock: Opaque metallic is deliberate. Holographic ONLY on center lab map. No CSS `backdrop-filter`. |

#### A.5.6 New Decision Locks (UI-1 through UI-18)

All 18 decisions from `Master-SparkForge-UI-Design-Change.md` Section 4 become locked architectural decisions:

| ID | Decision | Summary |
|----|----------|---------|
| UI-1 | Full 3D dashboard | Everything behind auth renders in 3D. Zero SEO risk (behind auth). |
| UI-2 | uikit for text/forms | uikit Input uses hidden HTML proxy for keyboard/paste/autocomplete. |
| UI-3 | Opaque metallic cockpit | NOT glassmorphic. Carbon composite + chrome bezel. Holographic ONLY on center lab map. |
| UI-4 | Center swaps per page | Center viewport shows different 3D content per route. Left/right/bottom fixed. |
| UI-5 | Left = Player Identity | Avatar + AI Guide + Trophies + 4 Gauges. Always present. |
| UI-6 | Right = Control Hub | Settings + Activity Log + Quick Actions. Always present. |
| UI-7 | Bottom = Instruments | 3 Dials (page-aware) + 5 Nav Buttons + StatusBar3D. Never changes layout. |
| UI-8 | Game = 75% takeover | Center scales 1.75x, FOV 58→72, panels slide 30% outward, dim to 40%. |
| UI-9 | Dramatic celebration | Gold LEDs, HUD expansion, bloom spike, 3D confetti, 2.5s duration. |
| UI-10 | Smooth crossfade | 400ms ease-out-cubic between non-game pages. MechanicalIris for game entry/exit. |
| UI-11 | Layered hover feedback | Buttons/cards: glow + scale 1.05. Panels: chrome edge-trace. |
| UI-12 | Center screen modals | Dialog replaces center content. No overlay dimming. Close via button/Escape. |
| UI-13 | 3D holographic tooltips | Materialize next to hovered element. Chrome bezel. 300ms delay. |
| UI-14 | Keyboard nav | 5 nav buttons + center CTA are Tab-accessible. Mouse is primary input. |
| UI-15 | Dense spatial audio | Every interaction has spatial audio. User controls density via settings dial. |
| UI-16 | Full audio customization | 6 controls: master, ambient/spatial/event volumes, mechanical density, lab crossfade. |
| UI-17 | Lab audio crossfade | 10 Tone.js generative soundscapes. 1.5s crossfade on lab transition. |
| UI-18 | Phased game migration | Dashboard first → 6 flagships → 29 standard. |

**Total decision locks after migration: 84 existing + 18 UI = 102 locked decisions.**

---

*End of Appendix A — Unified 3D UI Migration: Document & File Correction Plan v1.0*
*24 new files | ~22 REPLACE + ~47 MODIFY + ~320 PRESERVE = ~390 source files assessed | ~32 MAJOR + ~18 MINOR + ~4 ARCHITECTURE + ~74 NO CHANGE = 128 docs assessed | 18 new decision locks (UI-1–UI-18) | 0 new npm dependencies | 4 new store fields | 7 implementation sub-phases | March 31, 2026*

---

*End of Master Implementation Guide v4.1 | SparkForge | Laboratory Control Station*
*414 source files | 132 documentation files | 35 games (6 Flagship + 9 FL-Lite + 20 Standard) | 15 stores | 35 hooks | ~172 3D components | 84 decision locks + 18 UI decisions + 150 design decisions | Full 3D UI Migration complete (7 phases, 49 components) | Aligned with CLAUDE.md v6.0 + Master UI Design Change v1.2 | April 3, 2026*

*This is a living document. Updated after each delivery session. GCUD V10.2 is the canonical source for game content tracking. Master Directory v1.2 is the canonical source for file registry and build flow.*
