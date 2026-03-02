# Stage 10: Polish & Deploy

**Build Phase:** 24 of 24
**v3-FINAL:** No — v2 only
**Hard Stops:** HS-4 (Vercel account + GitHub repo connection)

## Files to Place Here (2 PDFs)

| Filename | Phase | Content |
|----------|-------|---------|
| `STAGE10_Polish_Deploy_v2_PART1.pdf` | 10.1 | A11yProvider, AccessibilityToolbar, accessibilityStore (6th store), SEO meta, CSP headers, PWA manifest |
| `STAGE10_Polish_Deploy_v2_PART2.pdf` | 10.2 | Game router (35 games), production next.config.js (REPLACES Stage 1 version), deployment guide |

## Before Deploying

Trigger **HS-4**: Need Vercel account created, GitHub repo connected, environment variables configured in Vercel dashboard.

## Notes

- **BUG-10F (CRITICAL):** Root layout MUST use Exo 2/Sora/Orbitron — NOT Fredoka/Nunito Sans
- **BUG-10D:** CSP `connect-src` must include Vercel analytics domains

## Validation

- `vercel --prod` succeeds
- Lighthouse audit passes
- All routes resolve
- PWA install prompt works
- Accessibility toolbar functional

## Commit

```bash
git commit -m "Stage 10: Polish + Deploy"
git tag -a v0.10.0 -m "Stage 10 complete: Polish + Deploy — SparkForge v1.0"
```
