# Stage 7C — Superseded Documents

**Date Archived:** March 8, 2026
**Archived By:** Claude Code (Code Review Role per CLAUDE.md Section 3.1)

---

## DO NOT USE THESE FILES FOR BUILD

The files in this `_SUPERSEDED/` folder contain **outdated code** that has been fully replaced by v3-FINAL documents. Using these files will result in:

- Wrong store API calls (`game.addScore` instead of `game.updateScore`, `game.nextRound` instead of `game.advanceRound`)
- Missing 3D integrations (Decision 6.5 Tier 2 Enhanced 3D)
- Missing `game.startGame()` initialization
- Missing `Canvas3DErrorBoundary` wrapping
- Per-frame Vector3 allocations (GC pressure)
- Invalid Three.js Color formats
- GPU memory leaks (TubeGeometry not disposed)
- Stale closures in challenge checking
- Missing typo issue type in datasets
- Missing ARIA labels

---

## Supersedure Map

| Superseded File | Replaced By | Reason |
|----------------|-------------|--------|
| `STAGE7C_Part3_ChatbotBuilder_DataDetective_v2.md` | `STAGE7C_v3FINAL_PartB_ChatbotBuilder.md` + `STAGE7C_v3FINAL_PartC_DataDetective.md` | v2 code for both games. Fully replaced by v3-FINAL which adds 3D integration (ChatbotNodes3D, DataDetective3D), all store API fixes, error boundaries, and enhancements. |
| `STAGE7C_v3FINAL_ChatbotBuilder_V3_FullTreatment.md` | `STAGE7C_v3FINAL_PartB_ChatbotBuilder.md` | Earlier V3 Full Treatment draft. The v3-FINAL Part B contains the same game logic plus: corrected store API, `Canvas3DErrorBoundary`, `game.startGame()`, editable response labels, stale closure fix, deploy timer cleanup. |
| `STAGE7C_v3FINAL_DataDetective_V3_FullTreatment.md` | `STAGE7C_v3FINAL_PartC_DataDetective.md` | Earlier V3 Full Treatment draft. The v3-FINAL Part C contains the same game logic plus: corrected store API, `Canvas3DErrorBoundary`, `game.startGame()`, typo issue rows in all 3 datasets, removed unused `worldColor` param from AccuracyGauge. |

## Active Build Documents (Use These)

| Document | Games Covered | Type |
|----------|--------------|------|
| `STAGE7C_Part1_TreatTrainer_SentimentScanner.md` | Treat Trainer (Standard), Sentiment Scanner (Standard) | v2 (audited + fixed) |
| `STAGE7C_Part2_LostInTranslation_NeuronRelay.md` | Lost in Translation (Standard), Neuron Relay (Standard) | v2 (audited + fixed) |
| `STAGE7C_v3FINAL_PartA_3D_Components.md` | ChatbotNodes3D, DataDetective3D, Canvas3DErrorBoundary | v3-FINAL (3D components) |
| `STAGE7C_v3FINAL_PartB_ChatbotBuilder.md` | Chatbot Builder (FL-Lite 3D) | v3-FINAL (full replacement) |
| `STAGE7C_v3FINAL_PartC_DataDetective.md` | Data Detective (FL-Lite 3D) | v3-FINAL (full replacement) |

## Build Order

1. Part 1 (v2) — Treat Trainer + Sentiment Scanner
2. Part 2 (v2) — Lost in Translation + Neuron Relay
3. Part A (v3-FINAL) — 3D Components + Error Boundary
4. Part B (v3-FINAL) — Chatbot Builder (full replacement)
5. Part C (v3-FINAL) — Data Detective (full replacement)
