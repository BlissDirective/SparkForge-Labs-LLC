# Stage 7: All Remaining Games (30 games)

**Build Phase:** 14–20 of 24
**v3-FINAL:** Mixed — varies by sub-stage
**Hard Stops:** None

Implement in sub-stage order: **7A → 7B → 7C → 7D → 7E → 7F → Shared**

Each sub-stage has its own folder below. Total: 30 games across 7 sub-stages.

## Sub-Stage Summary

| Sub-Stage | Folder | Games | Type | PDFs |
|-----------|--------|-------|------|------|
| 7A | `7a-tap-quiz/` | 9 tap/quiz games | v2 only | 4 |
| 7B | `7b-drag-drop/` | 4 drag/drop games | v3-FINAL | 3 |
| 7C | `7c-simulation/` | 6 simulation games | Mixed | 5 |
| 7D | `7d-investigation/` | 5 investigation games | Mixed | 4 |
| 7E | `7e-ethics-api/` | 3 ethics/API games | v2 only | 2 |
| 7F | `7f-band-a/` | 3 Band A games | Mixed | 3 |
| Shared | `7-shared/` | Shared systems | Mixed | 2 (+1 reference) |
| **Total** | | **30 games** | | **23+1 PDFs** |

## Validation (after ALL sub-stages)

- All 35 games accessible from Arcade
- Each game completes full phase cycle
- `gameRegistry.ts` has all 35 entries

## Commit

```bash
# Per sub-stage commits during build:
git commit -m "Stage 7A: 9 tap/quiz games"
git commit -m "Stage 7B: 4 drag/drop games with 3D"
git commit -m "Stage 7C: 6 simulation games"
git commit -m "Stage 7D: 5 investigation games with 3D"
git commit -m "Stage 7E: 3 ethics/API games"
git commit -m "Stage 7F: 3 Band A games"

# Final tag after all 7 sub-stages:
git tag -a v0.7.0 -m "Stage 7 complete: 30 games + shared systems (35 total)"
```
