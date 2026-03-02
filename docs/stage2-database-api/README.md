# Stage 2: Database & API

**Build Phase:** 3 of 24
**v3-FINAL:** No — v2 only
**Hard Stops:** HS-1 (Supabase keys), HS-7 (SQL execution)

## Files to Place Here (4 PDFs)

| Filename | Phase | Content |
|----------|-------|---------|
| `STAGE2_Database_API_v2_PART1.pdf` | 2.1 | DB schema (9 tables), indexes (14), RLS, badge seed (78), starter content |
| `STAGE2_Database_API_v2_PART2.pdf` | 2.2 | Zod schemas, tier-config.ts, rate limiting, API helpers |
| `STAGE2_Database_API_v2_PART3.pdf` | 2.3 | API routes: auth, children CRUD, content |
| `STAGE2_Database_API_v2_PART4.pdf` | 2.4 | API routes: progress, gamification (xp, streak, badges) |

## Before Starting

Trigger **HS-1**: Need `.env.local` with Supabase URL + anon key + service role key.

## Validation

- All API routes respond
- Test `/api/health`

## Commit

```bash
git commit -m "Stage 2: Database + API"
git tag -a v0.2.0 -m "Stage 2 complete: Database + API"
```
