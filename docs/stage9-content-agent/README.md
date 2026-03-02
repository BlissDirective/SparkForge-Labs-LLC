# Stage 9: Content Agent

**Build Phase:** 23 of 24
**v3-FINAL:** No — v2 only
**Hard Stops:** HS-3 (Anthropic API key)

## Files to Place Here (3 PDFs)

| Filename | Phase | Content |
|----------|-------|---------|
| `STAGE9_Content_Agent_v2_PART1.pdf` | 9.1 | Agent pipeline (4-stage: Research → Generate → Screen → Insert), prompts, API routes |
| `STAGE9_Content_Agent_v2_PART2.pdf` | 9.2 | Admin review dashboard |
| `STAGE9_Content_Agent_v2_PART3.pdf` | 9.3 | Seed content: 150 lessons, 90 quizzes, 60 facts |

## Before Starting

Trigger **HS-3**: Need `ANTHROPIC_API_KEY` in `.env.local`.

## Notes

- **ENH-9A:** Graceful 503 response if API key is missing

## Validation

- Content agent produces content via admin trigger
- Admin review dashboard shows items

## Commit

```bash
git commit -m "Stage 9: Content Agent"
git tag -a v0.9.0 -m "Stage 9 complete: Content Agent"
```
