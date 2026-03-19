# SPARKFORGE — GAME CONTENT UPDATE DOCUMENT (GCUD)

**Living Reference — Version 10.2 | March 19, 2026**
**Supersedes:** GCUD V10.1 (March 1, 2026) — updated code status column (Stages 1-7 code-complete), fixed tier breakdown (3-tier: 6+9+20=35), updated file count (92 active), aligned version references with CLAUDE.md v5.6 / Master Directory v1.2 / Master Implementation Guide v3.2.

**PURPOSE:** Single source of truth for game content, stage document status, v3-FINAL patch tracking, file registry, gap resolution, and implementation readiness.

---

## TABLE OF CONTENTS

1. Stage Document Status (Triple-Column Tracking)
2. Project File Registry (Post-Cleanup — 78 Active Files)
3. v3-FINAL Document Inventory
4. Full Game Inventory (35 Games)
5. Shared Systems
6. Build Strategy Reference
7. Game Content Review — Gap Closure (Final V10)
8. Cross-Cutting Issues
9. Design System Updates
10. Stale Document Cleanup
11. Change Log

---

## 1. STAGE DOCUMENT STATUS

Triple-column tracking: v2 Docs = base copy-paste-ready. v3-FINAL = Lab Control Station patches. Code = implementation status. Build: single-pass using v3-FINAL where available.

| Stage | v2 Docs | v3-FINAL | Code | Parts | Build Source |
|-------|---------|----------|------|-------|-------------|
| 1 Foundation | COMPLETE | N/A | Code-Complete | 2 | v2 PART1-2 |
| 2 Database/API | COMPLETE | N/A | Code-Complete | 4 | v2 PART1-4 |
| 3 Auth/Layout | COMPLETE | Part 3 DONE | Code-Complete | 2v2+2v3 | v2 P1-2, v3 P3A/B |
| 4 Core Pages | COMPLETE | Part 2 DONE | Code-Complete | 2v2+2v3 | v2 P1+3, v3 P2A/B |
| 5 Gamification | COMPLETE | Parts 2-3 DONE | Code-Complete | 1v2+3v3 | v2 P1, v3 A/B/C |
| 6B Pet Trainer | SUPERSEDED | COMPLETE | Code-Complete | 2v3 | v3-FINAL A/B |
| 6C Neural Builder | SUPERSEDED | COMPLETE | Code-Complete | 2v3 | v3-FINAL A/B |
| 6D Prompt Lab | SUPERSEDED | COMPLETE | Code-Complete | 2v3 | v3-FINAL A/B |
| 6E Agent Architect | SUPERSEDED | COMPLETE | Code-Complete | 3v3 | v3-FINAL A/B/C |
| 6F Bias Detective | SUPERSEDED | COMPLETE | Code-Complete | 3v3 | v3-FINAL A/B/C |
| 7A Tap/Quiz | COMPLETE | N/A | Code-Complete | 4 | v2 (4 docs) |
| 7B Drag/Drop | SUPERSEDED | COMPLETE | Code-Complete | 3v3 | v3-FINAL A/B/C |
| 7C (TT+SS+LiT+NR) | COMPLETE | N/A | Code-Complete | 2 | v2 Part1+2 |
| 7C (CB+DD) | SUPERSEDED | COMPLETE | Code-Complete | 3v3 | v3-FINAL A/B/C |
| 7D Investigation | SUPERSEDED | COMPLETE | Code-Complete | 3v3 | v3-FINAL A/B/C |
| 7E Ethics/API | COMPLETE | N/A | Code-Complete | 2 | v2 Part1+2 |
| 7F (My First AI App) | SUPERSEDED | COMPLETE | Code-Complete | 2v3 | v3-FINAL A/B |
| 7F (Emoji Decoder) | COMPLETE | N/A | Code-Complete | 1 | v2 Part1 |
| 7F (AI or Not?) | COMPLETE | N/A | Code-Complete | 1 | v2 Part2 |
| 7 Shared | COMPLETE | Particles DONE | Code-Complete | 1v2+1v3 | v2 XP + v3 Particles |
| 8 Parent Dashboard | COMPLETE | Part 3 DONE | Not Started | 2v2+3v3 | v2 P1-2, v3 A/B/C |
| 9 Content Agent | COMPLETE | N/A | Not Started | 3 | v2 PART1-3 |
| 10 Polish/Deploy | COMPLETE | N/A | Not Started | 2 | v2 PART1-2 |

**Summary:** All 10 stages documented. 14 v3-FINAL patches cover Stages 3-8. Stages 1-7 code-complete (~70%). 26 ordered phases per Master Directory v1.2.

---

## 2. PROJECT FILE REGISTRY (Post-Cleanup — 92 Active Files)

*Updated from 78 (V10) to 92. New files include Per-Stage-Playbooks.md, 3D-Component-Registry.md, 35+ 3D environment components, audit reports, and enhancement documents added March 14-19, 2026.*

---

## 3. v3-FINAL DOCUMENT INVENTORY

14 documents produced Feb 26–Mar 1 implementing 48 locked decisions. Each is a standalone replacement containing ALL v2 content + v3 enhancements.

| # | Document | Parts | Decision IDs | Key 3D Content |
|---|----------|-------|-------------|----------------|
| 1 | Stage 3 Part 3 | 3A+3B | 1.1-1.7, 2.1-2.5, 7.1, 7.3-4, 8.1 | StationFrame, CrystalShatter, Aurora, Particles, LEDRim, HDR |
| 2 | Stage 4 Part 2 | A+B | 3.1-3.5, 4.1 | LabReconfiguration, GameFocusSequence, 10 shaders |
| 3 | Stage 5 Pts 2-3 | A+B+C | 4.2-4.5, 5.2-5.6, 7.2 | LiquidMetal, Holographic, EnergyField, XPVortex |
| 4 | Stage 6B | A+B | 6.2, 7.5 | Pet GLB pipeline, MeshToonMaterial, 6 evolutions |
| 5 | Stage 6C | A+B | 6.1 | 3D rotatable network replacing SVG |
| 6 | Stage 6D | A+B | 6.5 | 3D thought bubble system |
| 7 | Stage 6E | A+B+C | 6.4, 6.5 | 3D pipeline platform with data packets |
| 8 | Stage 6F | A+B+C | 6.5, 6.6 | 3D justice scales, all age bands |
| 9 | Stage 7B | A+B+C | 6.3, 6.5 | Sort Toy Box 3D + Code Blocks enhanced |
| 10 | Stage 7C | A+B+C | 6.5 | Chatbot + Data Detective 3D |
| 11 | Stage 7D | A+B+C | 6.5 | Robot Vacuum + Camera Quest + Future Forge 3D |
| 12 | Stage 7F | A+B | 6.5 | My First AI App 3D mockup |
| 13 | Stage 7 Shared | A | 5.3 | GenericGameParticles (29 standard/FL-Lite games) |
| 14 | Stage 8 Part 3 | A+B+C | 8.1-8.5 | Scroll journey, /pricing, FeatureShowcase |

**Total:** 14 documents, 34 parts, ~60 new files, ~23 modified, 64 decisions (48 core + 4 OD + 12 CPA2).

---

## 4. FULL GAME INVENTORY (35 Games)

| # | Game | Lab | Slug | Tier | Bands | Stage | 3D |
|---|------|-----|------|------|-------|-------|----|
| 1 | AI Spy | 1 | ai-spy | Std | A,B,C | 7A | — |
| 2 | Time Machine | 1 | time-machine | Std | A,B,C | 7A | — |
| 3 | Human vs Machine | 1 | human-vs-machine | Std | A,B,C | 7B | — |
| 4 | AI Pet Trainer | 2 | pet-trainer | Flag | A,B,C | 6B | Full |
| 5 | Sort Toy Box | 2 | sort-toy-box | Full3D | A,B,C | 7B | Full |
| 6 | Treat Trainer | 2 | treat-trainer | Std | A,B,C | 7C | — |
| 7 | Data Detective | 2 | data-detective | FL-L | A,B,C | 7C | Enh |
| 8 | Neural Builder | 3 | neural-builder | Flag | A,B,C | 6C | Full |
| 9 | Neuron Relay | 3 | neuron-relay | Std | A,B,C | 7C | — |
| 10 | Pixel Investigator | 3 | pixel-investigator | Std | B,C | 7D | — |
| 11 | Prompt Lab | 4 | prompt-lab | Flag | A,B,C | 6D | Full |
| 12 | Word Predictor | 4 | word-predictor | Std | A,B,C | 7A | — |
| 13 | Token Chopper | 4 | token-chopper | Std | B,C | 7A | — |
| 14 | AI Art Detective | 4 | ai-art-detective | Std | A,B,C | 7A | — |
| 15 | Agent Architect | 5 | agent-architect | Flag | A,B,C | 6E | Full |
| 16 | Robot Vacuum | 5 | robot-vacuum | FL-L | A,B,C | 7D | Enh |
| 17 | Tool Picker | 6 | tool-picker | Std | A,B,C | 7A | — |
| 18 | Bias Detective | 6 | bias-detective | Flag | B,C | 6F | Full |
| 19 | Data Shield | 6 | data-shield | Std | A,B,C | 7A | — |
| 20 | Real or Fake | 6 | real-or-fake | Std | A,B,C | 7A | — |
| 21 | Ethics Courtroom | 6 | ethics-courtroom | Std | B,C | 7E | — |
| 22 | Camera Quest | 7 | camera-quest | FL-L | A,B,C | 7D | Enh |
| 23 | Fool the AI | 7 | fool-the-ai | Std | B,C | 7D | — |
| 24 | Build Classifier | 7 | build-classifier | Std | B,C | 7E | — |
| 25 | Prediction Market | 7 | prediction-market | Std | B,C | 7A | — |
| 26 | Sentiment Scanner | 8 | sentiment-scanner | Std | A,B,C | 7C | — |
| 27 | Chatbot Builder | 8 | chatbot-builder | FL-L | B,C | 7C | Enh |
| 28 | Lost in Translation | 8 | lost-in-translation | Std | A,B,C | 7C | — |
| 29 | Emoji Decoder | 8 | emoji-decoder | Enh | A,B | 7F | — |
| 30 | Code Blocks | 9 | code-blocks | FL-L | A,B,C | 7B | Enh |
| 31 | Career Explorer | 9 | career-explorer | Std | B,C | 7B | — |
| 32 | API Explorer | 9 | api-explorer | Std | C | 7E | — |
| 33 | My First AI App | 9 | my-first-ai-app | FL-L | A,B,C | 7F | Enh |
| 34 | Future Forge | 10 | future-forge | FL-L | A,B,C | 7D | Enh |
| 35 | AI or Not? | 10 | ai-or-not | Enh | A,B | 7F | — |

**Tiers:** 6 Flagship Full 3D (10M) + 9 FL-Lite Immersive 3D (2M) + 20 Standard = **35 games**.

### Tier Breakdown Detail

| Tier | Count | Triangle Budget | Games |
|------|-------|----------------|-------|
| Flagship (Full 3D) | 6 | 10M+ (10,000,000) | Pet Trainer, Sort Toy Box, Neural Builder, Prompt Lab, Agent Architect, Bias Detective |
| FL-Lite (Immersive 3D) | 9 | 2M+ (2,000,000) | Data Detective, Robot Vacuum, Camera Quest, Chatbot Builder, Emoji Decoder, Code Blocks, My First AI App, Future Forge, AI or Not? |
| Standard (Immersive 3D) | 20 | 500K+ (500,000) | AI Spy, Time Machine, Human vs Machine, Treat Trainer, Neuron Relay, Pixel Investigator, Word Predictor, Token Chopper, AI Art Detective, Tool Picker, Data Shield, Real or Fake, Ethics Courtroom, Fool the AI, Build Classifier, Prediction Market, Sentiment Scanner, Lost in Translation, Career Explorer, API Explorer |

> **Note:** All 35 games now have dedicated 3D environments with full R3F scenes. Standard tier upgraded from 10K–25K to 500K budget (March 18, 2026) with 20 individual environment files and StandardEnvironmentBase. FL-Lite upgraded to 2M budget (March 18, 2026). The "CSS-only" and "Enhanced Standard" tiers have been eliminated.

### Games Per Stage

| Stage | Games | Count |
|-------|-------|-------|
| 6 (Flagships) | Pet Trainer, Neural Builder, Prompt Lab, Agent Architect, Bias Detective | 5 |
| 7A (Tap/Quiz) | AI Spy, Time Machine, Word Predictor, Token Chopper, AI Art Detective, Tool Picker, Data Shield, Real or Fake, Prediction Market | 9 |
| 7B (Drag/Drop) | Sort Toy Box, Human vs Machine, Code Blocks, Career Explorer | 4 |
| 7C (Simulation) | Treat Trainer, Sentiment Scanner, Lost in Translation, Neuron Relay, Chatbot Builder, Data Detective | 6 |
| 7D (Investigation) | Pixel Investigator, Fool the AI, Robot Vacuum, Camera Quest, Future Forge | 5 |
| 7E (Ethics/API) | Ethics Courtroom, Build Classifier, API Explorer | 3 |
| 7F (Band A) | My First AI App, Emoji Decoder, AI or Not? | 3 |
| **Total** | | **35** |

---

## 5. SHARED SYSTEMS

| Component | Source | Purpose |
|-----------|--------|---------|
| XPPopupProvider | Shared_XP_Celebration | Floating "+X XP" with combo |
| GameCompleteCelebration | Shared_XP_Celebration | Full-screen confetti, stars, badges |
| StreakFire | Shared_XP_Celebration | Progressive edge glow + sparks |
| GenericGameParticles | 7_Shared_v3FINAL_A | CSS particles for 29 standard/FL-Lite games |
| GameParticles3D | 5_Parts23_v3FINAL_C | R3F particles for 5 flagships |

---

## 6. BUILD STRATEGY REFERENCE

**Single-Pass Build:** v3-FINAL where available, v2 where not. 26 phases across 10 stages. See Master Directory v1.2 Section 4 for the complete flow map.

**Implementation Order:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

**Validation:** visual (browser) + build (npm run build) + console (dev tools)

**Hard Stops:** Stage 2 (Supabase), Stage 8 (Stripe), Stage 9 (Anthropic API), Stage 10 (Vercel)

---

## 7. GAME CONTENT REVIEW — GAP CLOSURE (Final V10)

V9 scorecard: 11/15 resolved, 1 partial, 3 deferred. V10 update: Gap #12 (No 3D elements) now RESOLVED via v3-FINAL — 13 games have 3D. New scorecard: 12/15 resolved, 1 partial, 2 deferred.

| # | Gap | V9 Status | V10 Status | Resolution |
|---|-----|-----------|------------|------------|
| 12 | No 3D despite R3F | DEFERRED | RESOLVED | 13 games have 3D via 14 v3-FINAL docs |

All other gaps unchanged from V9. Remaining: #10 (Camera consent → Stage 8) and #11 (SVG mobile → Stage 10).

---

## 8. CROSS-CUTTING ISSUES

All unchanged from V9 except CC10 (No 3D) now RESOLVED. 13 issues total, 10 resolved, 1 partial, 2 deferred.

---

## 9. DESIGN SYSTEM UPDATES (V10)

- **Chrome bezel wrapper:** All games. Lab-colored LED rim.
- **Particles:** Dual system — R3F (5 flagships) + CSS GenericGameParticles (29 standard/FL-Lite).
- **3D Components:** 20+ new in src/components/3d/ via v3-FINAL documents.
- **Shader Library:** 10 lab patterns + 4 materials (LiquidMetal, Holographic, EnergyField, StreakFlame).
- **PBR Materials:** 7 presets in materials.ts.
- **Custom HDR:** frost-prismatic.hdr environment map.
- **Mobile Fallbacks:** All 3D returns null on mobile. CSS 2D preserved.
- **Station Frame:** Persistent R3F chrome frame on dashboard pages.
- **Crystal Shatter:** Voronoi fracture hero (~7s, 5 phases).

---

## 10. STALE DOCUMENT CLEANUP (Updated V10)

7 files removed per Master Directory v1.0. No additional stale files remain. Action: Remove GCUD V9 after V10 upload.

---

## 11. CHANGE LOG

| Date | Ver | Change |
|------|-----|--------|
| 2026-02-19 | V1-V6 | Initial creation through versioning system |
| 2026-02-20 | V7 | 7A-7C complete + V3 treatments + shared |
| 2026-02-20 | V8 | 7D-7E complete, gap analysis, 28/28 games |
| 2026-02-20 | V8+ | 7F Band A (31 games), Stages 5/1-4/8/9/10 v2 expanded |
| 2026-02-24 | V9 | Full audit, dual-column tracking, 31-game inventory |
| 2026-02-25 | — | Decision Lock Checkpoints 1-3 (48 decisions locked) |
| 2026-02-26 | — | v3-FINAL Master Plan + Stage 3 P3, Stage 4 P2 |
| 2026-02-27 | — | v3-FINAL: Stages 5 P2-3, 6B, 6C, 6D, 6E, 6F |
| 2026-02-28 | — | v3-FINAL: Stages 7B, 7C, 7D, 7F |
| 2026-03-01 | — | v3-FINAL: Stage 7 Shared, Stage 8 P3 |
| 2026-03-01 | — | Master Directory v1.0 produced |
| 2026-03-01 | V10 | Triple-column tracking, v3-FINAL inventory, 7 files removed, CC10/Gap12 resolved, CLAUDE.md v4, Master Directory alignment |
| 2026-03-01 | V10.1 | **CORRECTION: Game count 31 → 35. Tier breakdown: 20 Standard (not 16). Stage 7A: 9 games (not 8). Stage 7 total: 30 games (not 26). GenericGameParticles serves 29 games (not 23). Added per-tier and per-stage breakdowns for verification.** |
| 2026-03-18 | V10.1+ | **BUGFIX: FIX-DUAL-CANVAS v2** — `gameActive` state moved to Zustand `uiStore` (was broken local `useState` in `useStationMode`). GameShell now calls `setGameActive(true/false)` on mount/unmount. **LODWrapper** integrated into GameShell for all 35 games (auto-resolves tier from `gameRegistry`). **Mobile particle fallback** added to GameShell via `GenericGameParticles`. Files: `uiStore.ts`, `useStationMode.ts`, `GameShell.tsx`. Docs: `CLAUDE.md` bug registry, `STAGE 7 SHARED SYSTEMS.md` addendum. |

### NEXT STEPS

1. Continue Stage 8 build (Stages 1-7 code-complete)
2. Follow single-pass 26-phase build per Master Directory v1.2 Section 4
3. Three-layer validation after each stage
4. Update GCUD Code Status column after each stage

---

### V10.2 CHANGE SUMMARY (March 19, 2026)

| Change | From (V10.1) | To (V10.2) |
|--------|-------------|-----------|
| Code status (Stages 1-7) | Not Started | Code-Complete |
| Active file count | 78 | 92 |
| Decision count | 48 | 64 (48 core + 4 OD + 12 CPA2) |
| Phase count | 24 | 26 |
| Version references | CLAUDE.md v5.1, MD v1.0, MIG v3.1 | CLAUDE.md v5.6, MD v1.2, MIG v3.2 |
| 7F Emoji Decoder | Grouped with AI or Not? | Separate row (Part1 v2) |
| New reference docs | — | Per-Stage-Playbooks.md, 3D-Component-Registry.md |

---

*End of GCUD V10.2 | 92 files | 35 games (6+9+20) | 64 decisions | 14 v3-FINAL docs | March 19, 2026*
