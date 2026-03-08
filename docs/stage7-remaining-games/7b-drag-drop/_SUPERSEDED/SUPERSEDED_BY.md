# Stage 7B — Superseded Documents

**Date Archived:** March 8, 2026
**Archived By:** Claude Code (Code Review Role per CLAUDE.md Section 3.1)

---

## DO NOT USE THESE FILES FOR BUILD

The files in this `_SUPERSEDED/` folder contain **outdated code** that has been fully replaced by v3-FINAL documents. Using these files will result in:

- Wrong store API calls (`game.addScore` instead of `game.updateScore`)
- Missing 3D integrations (Decision 6.5)
- Missing `game.startGame()` initialization
- Missing `Canvas3DErrorBoundary` wrapping
- Outdated UI patterns and incomplete features

---

## Supersedure Map

| Superseded File | Replaced By | Reason |
|----------------|-------------|--------|
| `STAGE7B_Part1_SortToyBox_HumanVsMachine.md` | `STAGE7B_v3FINAL_PartA_SortToyBox3D_HumanVsMachine.md` | v3-FINAL explicitly states "Supersedes: STAGE7B_Part1...V2". Contains full 3D Sort Toy Box (SortScene3D.tsx) + Human vs Machine with all store API fixes. |
| `STAGE7B_Part2_CodeBlocks_CareerExplorer.md` | `STAGE7B_v3FINAL_PartB_CodeBlocks3D_CodeBlocksGame.md` + `STAGE7B_v3FINAL_PartC_CareerExplorer_BatchVerification.md` | v3-FINAL PartB explicitly states "Supersedes: STAGE7B_Part2 Code Blocks V2". Code Blocks gets full 3D (CodeBlocks3D.tsx). Career Explorer unchanged from v2 but consolidated into PartC. |
| `STAGE7B_CodeBlocks_v3FINAL.md` | `STAGE7B_v3FINAL_PartB_CodeBlocks3D_CodeBlocksGame.md` | Earlier standalone v3 draft. Superseded by the coordinated v3-FINAL Part A/B/C batch which includes the same game plus additional fixes and integration verification. |

## Active Build Documents (Use These)

| Document | Games Covered |
|----------|--------------|
| `STAGE7B_v3FINAL_PartA_SortToyBox3D_HumanVsMachine.md` | Sort Toy Box (Full 3D), Human vs Machine (Standard) |
| `STAGE7B_v3FINAL_PartB_CodeBlocks3D_CodeBlocksGame.md` | Code Blocks (FL-Lite 3D) |
| `STAGE7B_v3FINAL_PartC_CareerExplorer_BatchVerification.md` | Career Explorer (Standard) |
