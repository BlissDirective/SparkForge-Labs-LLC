# Stage 8: Parent Dashboard & Monetization

**Build Phase:** 21–22 of 24
**v3-FINAL:** Mixed (Parts 1–2 v2, Part 3 A/B/C v3-FINAL)
**Hard Stops:** HS-2 (Stripe test-mode API keys + 4 price IDs)
**Decision IDs:** 8.1–8.5

## Files to Place Here (5 PDFs)

| Filename | Phase | Type | Content |
|----------|-------|------|---------|
| `STAGE8_Parent_Dashboard_v2_PART1.pdf` | 8.1 | v2 | Tier config extensions, Stripe setup, parent store |
| `STAGE8_Parent_Dashboard_v2_PART2.pdf` | 8.2 | v2 | Parent dashboard, subscription, paywall |
| `STAGE8_P3_v3FINAL_A.pdf` | 8.3a | v3-FINAL | ScrollJourney landing page |
| `STAGE8_P3_v3FINAL_B.pdf` | 8.3b | v3-FINAL | FeatureShowcase, StationPreview |
| `STAGE8_P3_v3FINAL_C.pdf` | 8.3c | v3-FINAL | /pricing route, verification |

## Before Starting

Trigger **HS-2**: Need Stripe test-mode API keys and 4 price IDs (Plus monthly, Plus yearly, Forge monthly, Forge yearly) in `.env.local`.

## Notes

- **BUG-8A:** APPEND to existing `tier-config.ts`, do NOT create a new `tiers.ts`

## Validation

- Parent dashboard, subscription flow, pricing page
- Stripe test checkout works

## Commit

```bash
git commit -m "Stage 8: Parent Dashboard + Monetization"
git tag -a v0.8.0 -m "Stage 8 complete: Parent Dashboard + Monetization"
```
