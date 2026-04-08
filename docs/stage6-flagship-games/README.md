# Stage 6: Flagship Games (5 games)

**Build Phase:** 9–13 of 24
**v3-FINAL:** ALL v3-FINAL exclusively
**Hard Stops:** HS-8 (soft note for GLB assets — non-blocking), HS-5 (visual after all 5)

Each flagship: Part A = 3D component, Part B/C = full game replacement.

## Files to Place Here (12 PDFs across 5 sub-folders)

### 6B — AI Pet Trainer (Lab 2)

| Filename | Phase | Content | Decision IDs |
|----------|-------|---------|-------------|
| `STAGE6B_v3FINAL_A.pdf` | 6.1a | Pet3DScene + PetCreature3D (GLB pipeline) | 6.2, 7.5 |
| `STAGE6B_v3FINAL_B.pdf` | 6.1b | Pet Trainer full game file |  |

### 6C — Neural Builder (Lab 3)

| Filename | Phase | Content | Decision IDs |
|----------|-------|---------|-------------|
| `STAGE6C_v3FINAL_A.pdf` | 6.2a | NeuralNetwork3D (rotatable 3D network) | 6.1 |
| `STAGE6C_v3FINAL_B.pdf` | 6.2b | Neural Builder full game file |  |

### 6D — Prompt Lab (Lab 4)

| Filename | Phase | Content | Decision IDs |
|----------|-------|---------|-------------|
| `STAGE6D_v3FINAL_A.pdf` | 6.3a | PromptBubble3D (reactive thought bubble) | 6.5 |
| `STAGE6D_v3FINAL_B.pdf` | 6.3b | Prompt Lab full game file |  |

### 6E — Agent Architect (Lab 5)

| Filename | Phase | Content | Decision IDs |
|----------|-------|---------|-------------|
| `STAGE6E_v3FINAL_A.pdf` | 6.4a | AgentPipeline3D (data packets + spotlight) | 6.4, 6.5 |
| `STAGE6E_v3FINAL_B.pdf` | 6.4b | Agent Architect full game file |  |
| `STAGE6E_v3FINAL_C.pdf` | 6.4c | Agent Architect verification |  |

### 6F — Bias Detective (Lab 6)

| Filename | Phase | Content | Decision IDs |
|----------|-------|---------|-------------|
| `STAGE6F_v3FINAL_A.pdf` | 6.5a | BiasScales3D (justice scales) | 6.5, 6.6 |
| `STAGE6F_v3FINAL_B.pdf` | 6.5b | Bias Detective full game file |  |
| `STAGE6F_v3FINAL_C.pdf` | 6.5c | Bias Detective verification |  |

## Flagship Game Audit (April 7, 2026)

All 6 flagship games received a comprehensive playability/interactivity audit:
- **17 bugs fixed** (5 Critical, 5 High, 7 Medium) across gameStore, GameShell, Neural Builder, Sort Toy Box
- **All 6 flagships expanded 2-3x content depth** (new challenges, modes, categories, cases, blocks)
- **AI content generation infrastructure** added (3 new files: ai-content-generator.ts, generate-content route, useAIContent hook)
- **Per-game AI integration** for infinite replay content
- Source: `flagship-game-content-audit(04.06.2026).md`

## Validation

- All 6 flagships playable: full phase cycle (welcome → learn → play → complete)
- 3D visible on desktop (D3D-1: desktop-only rendering)

## Commit

```bash
git commit -m "Stage 6: 5 flagship games with 3D"
git tag -a v0.6.0 -m "Stage 6 complete: 5 flagship games with 3D"
```
