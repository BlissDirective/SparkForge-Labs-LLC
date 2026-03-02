# SPARKFORGE — Master Directory & Development Flow Map

**Version:** 1.1 | **Date:** March 1, 2026 | **BlissDirective**
**Laboratory Control Station Vision | Frost-Prismatic v3**
**Supersedes:** Master Directory v1.0 (March 1, 2026) — corrects game count from 31 to 35.

| Metric | Value |
|--------|-------|
| Total Project Files | 85 files (141 MB) |
| Stage Documents | 10 stages, all copy-paste ready |
| v3-FINAL Patches | 14 documents across 34 part files |
| Games | **35 games** (5 flagship, 1 full 3D, 7 FL-Lite, 2 enhanced, 20 standard) |
| Locked Decisions | 48 decisions across 3 checkpoints |
| Code Written | 0% — all documentation, ready to build |

**PURPOSE:** This document serves as the single authoritative guide for transferring SparkForge project knowledge to GitHub and executing full development. It maps every file, defines the build order, flags redundancies for cleanup, and provides the recommended repository structure.

---

## TABLE OF CONTENTS

1. Build Strategy & Implementation Order
2. Master File Registry — All 85 Project Files
3. Redundancy & Cleanup Report
4. Single-Pass Development Flow Map
5. Stage-by-Stage File Reference (Stages 1–10)
6. v3-FINAL Patch Application Guide
7. Recommended GitHub Repository Structure
8. Recommended /src Folder Structure
9. Pre-Development Checklist
10. Quick Reference — All 35 Games

---

## 1. BUILD STRATEGY & IMPLEMENTATION ORDER

**Approach:** Single-Pass with v3-FINAL Priority. Where a v3-FINAL document exists, use it as the authoritative source — it contains ALL v2 content plus the v3 visual enhancements merged in. Where no v3-FINAL exists, use the v2 stage document directly. This eliminates the need for a second patch pass.

**CRITICAL RULE:** Build stages sequentially: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10. Each stage depends on all prior stages. Never skip ahead. Within each stage, follow the Part order (A → B → C).

### Implementation Order Summary

| Order | Stage | Source Documents | v3-FINAL? | Parts |
|-------|-------|-----------------|-----------|-------|
| 1 | Stage 1: Foundation | STAGE1_Foundation_v2 PART1-2 | No | 2 |
| 2 | Stage 2: Database/API | STAGE2_Database_API_v2 PART1-4 | No | 4 |
| 3 | Stage 3: Auth/Layout Parts 1-2 | STAGE3_Auth_Layout_Shell_v2 PART1-2 | No | 2 |
| 4 | Stage 3: Part 3 (Station) | STAGE3_Part3A/B_v3FINAL | YES | 2 |
| 5 | Stage 4: Core Pages Part 1+3 | STAGE4_Core_Pages_v2 PART1+3 | No | 2 |
| 6 | Stage 4: Part 2 (Labs) | STAGE4_Part2_v3FINAL_A/B | YES | 2 |
| 7 | Stage 5: Gamification Part 1 | STAGE5_Gamification_Profile PART1 | No | 1 |
| 8 | Stage 5: Parts 2-3 | STAGE5_Parts23_v3FINAL_A/B/C | YES | 3 |
| 9 | Stage 6B: Pet Trainer | STAGE6B_v3FINAL_A/B | YES | 2 |
| 10 | Stage 6C: Neural Builder | STAGE6C_v3FINAL_A/B | YES | 2 |
| 11 | Stage 6D: Prompt Lab | STAGE6D_v3FINAL_A/B | YES | 2 |
| 12 | Stage 6E: Agent Architect | STAGE6E_v3FINAL_A/B/C | YES | 3 |
| 13 | Stage 6F: Bias Detective | STAGE6F_v3FINAL_A/B/C | YES | 3 |
| 14 | Stage 7A: Tap/Quiz (9 games) | STAGE7A_Batch + Parts 2-4 | No | 4 |
| 15 | Stage 7B: Drag/Drop | STAGE7B_v3FINAL_A/B/C | YES | 3 |
| 16 | Stage 7C: Simulation | STAGE7C_v3FINAL_A/B/C (CB+DD) + Part1 + Part2 (TT+SS+LiT+NR) | PARTIAL | 5 |
| 17 | Stage 7D: Investigation | STAGE7D_v3FINAL_A/B/C | YES | 3 |
| 18 | Stage 7E: Ethics/API | STAGE7E Part1 + Part2 | No | 2 |
| 19 | Stage 7F: Band A | STAGE7F_v3FINAL_A/B + Part2 | YES | 3 |
| 20 | Stage 7 Shared | STAGE7_Shared_v3FINAL_A + Shared_XP_Celebration | PARTIAL | 2 |
| 21 | Stage 8: Parent Dash P1-2 | STAGE8_Parent_Dashboard_v2 P1-2 | No | 2 |
| 22 | Stage 8: Part 3 (Landing) | STAGE8_P3_v3FINAL_A/B/C | YES | 3 |
| 23 | Stage 9: Content Agent | STAGE9_Content_Agent_v2 P1-3 | No | 3 |
| 24 | Stage 10: Polish/Deploy | STAGE10_Polish_Deploy_v2 P1-2 | No | 2 |

Total build steps: 24 ordered implementation phases across 10 stages.

---

## 2. MASTER FILE REGISTRY — ALL 85 PROJECT FILES

*Unchanged from v1.0. See Master Directory v1.0 Section 2 for the complete 85-file registry with sizes, dates, and categories.*

---

## 3. REDUNDANCY & CLEANUP REPORT

*Unchanged from v1.0. 7 files marked for removal. See Master Directory v1.0 Section 3.*

---

## 4. SINGLE-PASS DEVELOPMENT FLOW MAP

### Stages 1–5: Foundation Through Gamification

| Step | Action | Document |
|------|--------|----------|
| 1.1 | [v2] Foundation: config, packages, folders | STAGE1_Foundation_v2_PART1 |
| 1.2 | [v2] Foundation: types, stores, hooks | STAGE1_Foundation_v2_PART2 |
| 1.V | VALIDATE: dev server starts | — |
| 1.G | git commit + tag v0.1.0 | — |
| 2.1 | [v2] Database: schema, RLS, seeds | STAGE2_Database_API_v2_PART1 |
| 2.2 | [v2] Database: Zod, tier-config, helpers | STAGE2_Database_API_v2_PART2 |
| 2.3 | [v2] API: auth, children, content | STAGE2_Database_API_v2_PART3 |
| 2.4 | [v2] API: progress, gamification | STAGE2_Database_API_v2_PART4 |
| 2.V | VALIDATE: API routes respond | — |
| 2.G | git commit + tag v0.2.0 | — |
| 3.1 | [v2] Auth: provider, signup, login | STAGE3_Auth_Layout_Shell_v2_PART1 |
| 3.2 | [v2] Layout: dashboard, sidebar, topbar | STAGE3_Auth_Layout_Shell_v2_PART2 |
| 3.3 | [v3] Station: StationFrame, CrystalShatter, Aurora, Particles | STAGE3_Part3A_v3FINAL |
| 3.4 | [v3] Station: Emissive CSS, onboarding crystal | STAGE3_Part3B_v3FINAL |
| 3.V | VALIDATE: Login → Dashboard with station frame | — |
| 3.G | git commit + tag v0.3.0 | — |
| 4.1 | [v2] Pages: dashboard home, hooks | STAGE4_Core_Pages_v2_PART1 |
| 4.2 | [v3] Lab: 10 GLSL shaders | STAGE4_Part2_v3FINAL_A |
| 4.3 | [v3] Lab: LabReconfiguration, GameFocusSequence | STAGE4_Part2_v3FINAL_B |
| 4.4 | [v2] Pages: profile, quiz, settings | STAGE4_Core_Pages_v2_PART3 |
| 4.V | VALIDATE: Dashboard, labs map, profile | — |
| 4.G | git commit + tag v0.4.0 | — |
| 5.1 | [v2] Gamification: XP, cosmetics, avatar, sound | STAGE5_Gamification_Profile_PART1 |
| 5.2 | [v3] Shaders: LiquidMetal, Holographic, EnergyField | STAGE5_Parts23_v3FINAL_A |
| 5.3 | [v3] 3D: XPVortex, BadgePedestals, particles | STAGE5_Parts23_v3FINAL_B |
| 5.4 | [v3] 3D: GameParticles3D, ceremonies | STAGE5_Parts23_v3FINAL_C |
| 5.V | VALIDATE: XP popup, streak, badges, 3D effects | — |
| 5.G | git commit + tag v0.5.0 | — |

### Stage 6: Flagship Games (5 games)

| Step | Action | Document |
|------|--------|----------|
| 6.1a | [v3] Pet Trainer 3D: PetCreature3D, Pet3DScene | STAGE6B_v3FINAL_A |
| 6.1b | [v3] Pet Trainer game file | STAGE6B_v3FINAL_B |
| 6.2a | [v3] Neural Builder 3D: NeuralNetwork3D | STAGE6C_v3FINAL_A |
| 6.2b | [v3] Neural Builder game file | STAGE6C_v3FINAL_B |
| 6.3a | [v3] Prompt Lab 3D: PromptBubble3D | STAGE6D_v3FINAL_A |
| 6.3b | [v3] Prompt Lab game file | STAGE6D_v3FINAL_B |
| 6.4a | [v3] Agent Architect 3D: AgentPipeline3D | STAGE6E_v3FINAL_A |
| 6.4b | [v3] Agent Architect game file | STAGE6E_v3FINAL_B |
| 6.4c | [v3] Agent Architect verification | STAGE6E_v3FINAL_C |
| 6.5a | [v3] Bias Detective 3D: BiasScales3D | STAGE6F_v3FINAL_A |
| 6.5b | [v3] Bias Detective game file | STAGE6F_v3FINAL_B |
| 6.5c | [v3] Bias Detective verification | STAGE6F_v3FINAL_C |
| 6.V | VALIDATE: All 5 flagships playable with 3D | — |
| 6.G | git commit + tag v0.6.0 | — |

### Stage 7: All Remaining Games (30 games)

| Step | Action | Document |
|------|--------|----------|
| 7.1 | [v2] 7A Tap/Quiz: AI Spy, Time Machine | STAGE7A_Batch_TapQuiz |
| 7.1b | [v2] 7A: Word Predictor, Token Chopper, AI Art Detective | STAGE7A_Part2_TokenChopper_AiArt |
| 7.1c | [v2] 7A: Tool Picker, Data Shield | STAGE7A_Part3_ToolPicker_DataShield |
| 7.1d | [v2] 7A: Real or Fake, Prediction Market | STAGE7A_Part4_RealOrFake_PredictionMarket |
| 7.1G | git commit -m "Stage 7A: 9 tap/quiz games" | — |
| 7.2a | [v3] 7B: SortScene3D + CodeBlocks3D | STAGE7B_v3FINAL_A |
| 7.2b | [v3] 7B: Sort Toy Box + Human vs Machine + Code Blocks + Career Explorer | STAGE7B_v3FINAL_B |
| 7.2c | [v3] 7B: verification | STAGE7B_v3FINAL_C |
| 7.2G | git commit -m "Stage 7B: 4 drag/drop games" | — |
| 7.3 | [v2] 7C: Treat Trainer, Sentiment Scanner | STAGE7C_Part1_TreatTrainer_Sentiment |
| 7.3b | [v2] 7C: Lost in Translation, Neuron Relay | STAGE7C_Part2_Translation_NeuronRelay |
| 7.3c | [v3] 7C: ChatbotNodes3D + DataDetective3D | STAGE7C_v3FINAL_A |
| 7.3d | [v3] 7C: Chatbot Builder + Data Detective games | STAGE7C_v3FINAL_B |
| 7.3e | [v3] 7C: verification | STAGE7C_v3FINAL_C |
| 7.3G | git commit -m "Stage 7C: 6 simulation games" | — |
| 7.4 | [v2] 7D: Pixel Investigator, Fool the AI | STAGE7D_Part1_PixelInvestigator_FoolTheAI |
| 7.4b | [v3] 7D: RobotVacuum3D + CameraQuest3D + FutureForge3D | STAGE7D_v3FINAL_A |
| 7.4c | [v3] 7D: Robot Vacuum + Camera Quest games | STAGE7D_v3FINAL_B |
| 7.4d | [v3] 7D: Future Forge + registry update | STAGE7D_v3FINAL_C |
| 7.4G | git commit -m "Stage 7D: 5 investigation games" | — |
| 7.5 | [v2] 7E: Ethics Courtroom | STAGE7E_Part1_EthicsCourtroom_BuildClassifier |
| 7.5b | [v2] 7E: Build Classifier, API Explorer | STAGE7E_Part2_ApiExplorer_Registry |
| 7.5G | git commit -m "Stage 7E: 3 ethics/API games" | — |
| 7.6a | [v3] 7F: MyFirstAiApp3D | STAGE7F_v3FINAL_A |
| 7.6b | [v3] 7F: My First AI App game | STAGE7F_v3FINAL_B |
| 7.6c | [v2] 7F: Emoji Decoder, AI or Not? | STAGE7F_Part2 |
| 7.6G | git commit -m "Stage 7F: 3 Band A games" | — |
| 7.7a | [v3] Shared: GenericGameParticles | STAGE7_Shared_v3FINAL_A |
| 7.7b | [v2] Shared: XPPopup, GameComplete, StreakFire | STAGE7_Shared_XP_Celebration |
| 7.V | VALIDATE: All 35 games accessible from Arcade, each game completes full phase cycle | — |
| 7.G | git commit per batch (7A, 7B, 7C, 7D, 7E, 7F, Shared) | — |

### Stages 8–10: Dashboard, Agent, Deploy

| Step | Action | Document |
|------|--------|----------|
| 8.1 | [v2] Parent dashboard Part 1: tier config, Stripe, parent store | STAGE8_Parent_Dashboard_v2_PART1 |
| 8.2 | [v2] Parent dashboard Part 2: dashboard, subscription, paywall | STAGE8_Parent_Dashboard_v2_PART2 |
| 8.3a | [v3] Landing: ScrollJourney | STAGE8_P3_v3FINAL_A |
| 8.3b | [v3] Landing: FeatureShowcase, StationPreview | STAGE8_P3_v3FINAL_B |
| 8.3c | [v3] Landing: /pricing route, verification | STAGE8_P3_v3FINAL_C |
| 8.V | VALIDATE: Parent dashboard, pricing, Stripe checkout | — |
| 8.G | git commit + tag v0.8.0 | — |
| 9.1 | [v2] Agent: pipeline, prompts, API routes | STAGE9_Content_Agent_v2_PART1 |
| 9.2 | [v2] Agent: admin review dashboard | STAGE9_Content_Agent_v2_PART2 |
| 9.3 | [v2] Agent: seed content | STAGE9_Content_Agent_v2_PART3 |
| 9.V | VALIDATE: Agent produces content, admin review works | — |
| 9.G | git commit + tag v0.9.0 | — |
| 10.1 | [v2] Polish: A11y, SEO, CSP, PWA | STAGE10_Polish_Deploy_v2_PART1 |
| 10.2 | [v2] Deploy: game router (35 games), prod config, deploy guide | STAGE10_Polish_Deploy_v2_PART2 |
| 10.V | VALIDATE: Lighthouse audit, all routes, PWA install | — |
| 10.G | git commit + tag v0.10.0 | — |

---

## 5. STAGE-BY-STAGE FILE REFERENCE

*Section 5 contains detailed per-stage file listings. Content is unchanged from v1.0 except where game counts are referenced. For the complete file registry, see Master Directory v1.0 Section 5.*

---

## 6. v3-FINAL PATCH APPLICATION GUIDE

*Unchanged from v1.0. The 14 v3-FINAL documents apply as single-pass replacements. See Master Directory v1.0 Section 6.*

---

## 7. RECOMMENDED GITHUB REPOSITORY STRUCTURE

*Unchanged from v1.0. See Master Directory v1.0 Section 7 for the complete /docs folder structure.*

---

## 8. RECOMMENDED /src FOLDER STRUCTURE

*Unchanged from v1.0. See Master Directory v1.0 Section 8.*

---

## 9. PRE-DEVELOPMENT CHECKLIST

*Unchanged from v1.0. See Master Directory v1.0 Section 9.*

---

## 10. QUICK REFERENCE — ALL 35 GAMES

| # | Game | Lab | Slug | Tier | Bands | Stage |
|---|------|-----|------|------|-------|-------|
| 1 | AI Spy | 1 | ai-spy | Standard | A,B,C | 7A |
| 2 | Time Machine | 1 | time-machine | Standard | A,B,C | 7A |
| 3 | Human vs Machine | 1 | human-vs-machine | Standard | A,B,C | 7B |
| 4 | AI Pet Trainer | 2 | pet-trainer | Flagship | A,B,C | 6B |
| 5 | Sort Toy Box | 2 | sort-toy-box | Full 3D | A,B,C | 7B |
| 6 | Treat Trainer | 2 | treat-trainer | Standard | A,B,C | 7C |
| 7 | Data Detective | 2 | data-detective | FL-Lite+3D | A,B,C | 7C |
| 8 | Neural Builder | 3 | neural-builder | Flagship | A,B,C | 6C |
| 9 | Neuron Relay | 3 | neuron-relay | Standard | A,B,C | 7C |
| 10 | Pixel Investigator | 3 | pixel-investigator | Standard | B,C | 7D |
| 11 | Prompt Lab | 4 | prompt-lab | Flagship | A,B,C | 6D |
| 12 | Word Predictor | 4 | word-predictor | Standard | A,B,C | 7A |
| 13 | Token Chopper | 4 | token-chopper | Standard | B,C | 7A |
| 14 | AI Art Detective | 4 | ai-art-detective | Standard | A,B,C | 7A |
| 15 | Agent Architect | 5 | agent-architect | Flagship | A,B,C | 6E |
| 16 | Robot Vacuum | 5 | robot-vacuum | FL-Lite+3D | A,B,C | 7D |
| 17 | Tool Picker | 6 | tool-picker | Standard | A,B,C | 7A |
| 18 | Bias Detective | 6 | bias-detective | Flagship | B,C | 6F |
| 19 | Data Shield | 6 | data-shield | Standard | A,B,C | 7A |
| 20 | Real or Fake | 6 | real-or-fake | Standard | A,B,C | 7A |
| 21 | Ethics Courtroom | 6 | ethics-courtroom | Standard | B,C | 7E |
| 22 | Camera Quest | 7 | camera-quest | FL-Lite+3D | A,B,C | 7D |
| 23 | Fool the AI | 7 | fool-the-ai | Standard | B,C | 7D |
| 24 | Build a Classifier | 7 | build-classifier | Standard | B,C | 7E |
| 25 | Prediction Market | 7 | prediction-market | Standard | B,C | 7A |
| 26 | Sentiment Scanner | 8 | sentiment-scanner | Standard | A,B,C | 7C |
| 27 | Chatbot Builder | 8 | chatbot-builder | FL-Lite+3D | B,C | 7C |
| 28 | Lost in Translation | 8 | lost-in-translation | Standard | A,B,C | 7C |
| 29 | Emoji Decoder | 8 | emoji-decoder | Enhanced | A,B | 7F |
| 30 | Code Blocks | 9 | code-blocks | FL-Lite+3D | A,B,C | 7B |
| 31 | Career Explorer | 9 | career-explorer | Standard | B,C | 7B |
| 32 | API Explorer | 9 | api-explorer | Standard | C | 7E |
| 33 | My First AI App | 9 | my-first-ai-app | FL-Lite+3D | A,B,C | 7F |
| 34 | Future Forge | 10 | future-forge | FL-Lite+3D | A,B,C | 7D |
| 35 | AI or Not? | 10 | ai-or-not | Enhanced | A,B | 7F |

**Tiers:** 5 Flagship + 1 Full 3D + 7 FL-Lite + 2 Enhanced + 20 Standard = **35 games**

### Games Per Lab

| Lab | Title | Games | Count |
|-----|-------|-------|-------|
| 1 | What IS AI? | AI Spy, Time Machine, Human vs Machine | 3 |
| 2 | Teaching Machines | AI Pet Trainer, Sort Toy Box, Treat Trainer, Data Detective | 4 |
| 3 | The Brain Inside | Neural Builder, Neuron Relay, Pixel Investigator | 3 |
| 4 | AI That Creates | Prompt Lab, Word Predictor, Token Chopper, AI Art Detective | 4 |
| 5 | AI Helpers | Agent Architect, Robot Vacuum | 2 |
| 6 | AI & Ethics | Tool Picker, Bias Detective, Data Shield, Real or Fake, Ethics Courtroom | 5 |
| 7 | Computer Vision | Camera Quest, Fool the AI, Build Classifier, Prediction Market | 4 |
| 8 | Words & Language | Sentiment Scanner, Chatbot Builder, Lost in Translation, Emoji Decoder | 4 |
| 9 | Build with AI | Code Blocks, Career Explorer, API Explorer, My First AI App | 4 |
| 10 | AI's Future | Future Forge, AI or Not? | 2 |
| **Total** | | | **35** |

---

### V1.1 CHANGE SUMMARY

| Change | From (v1.0) | To (v1.1) |
|--------|-------------|-----------|
| Total game count | 31 | **35** |
| Standard tier count | 16 | **20** |
| Stage 7A game count | 8 | **9** |
| Stage 7 total game count | 26 | **30** |
| GenericGameParticles scope | 23 standard games | **29 standard/FL-Lite games** |
| Section 10 title | "All 31 Games" | "All 35 Games" |
| Stage 10 game router | 31 games | **35 games** |

The tier arithmetic error (5+1+7+2+16=31) has been corrected to (5+1+7+2+20=35). All game tables in v1.0 already listed 35 entries numbered 1-35; only the summary counts were incorrect.

---

*End of Master Directory v1.1 | SparkForge | 85 files | 35 games | 48 decisions | 14 v3-FINAL documents | March 1, 2026*
