# Stage 4: Core Pages & Lab Reconfiguration

**Build Phase:** 6–7 of 24
**v3-FINAL:** Mixed (Parts 1+3 v2, Part 2A/B v3-FINAL)
**Hard Stops:** HS-5 (visual verification after all parts)
**Decision IDs:** 3.1–3.5, 4.1

## Files to Place Here (4 PDFs)

| Filename | Phase | Type | Content |
|----------|-------|------|---------|
| `STAGE4_Core_Pages_v2_PART1.pdf` | 4.1 | v2 | Dashboard home, hooks (useChildren, useContent, useProgress, useGamification) |
| `STAGE4_Part2_v3FINAL_A.pdf` | 4.2 | v3-FINAL | 10 lab pattern GLSL shaders + shader index |
| `STAGE4_Part2_v3FINAL_B.pdf` | 4.3 | v3-FINAL | LabReconfiguration, GameFocusSequence, useStationMode |
| `STAGE4_Core_Pages_v2_PART3.pdf` | 4.4 | v2 | Profile page, quiz engine, settings |

## Notes

- **BUG-1 FIX:** Part 1 REPLACES `useApi.ts` entirely
- **BUG-3 FIX:** Uses single `/api/progress/all-labs` endpoint

## Validation

- Dashboard home, Labs map, Profile page work
- Lab reconfiguration transitions work

## Commit

```bash
git commit -m "Stage 4: Core Pages + Lab Reconfiguration"
git tag -a v0.4.0 -m "Stage 4 complete: Core Pages + Lab Reconfiguration"
```
