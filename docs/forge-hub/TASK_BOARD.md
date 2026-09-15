# Forge Hub — Task Board

**Created:** 2026-09-14 (Foreman Day 1)  
**Plan:** TRANSITION_ACTION_PLAN.md v2.2  
**Integration branch:** `setup-sparkforge-dev` only  
**Owner:** Conrad (only approver)  
**Foreman covering:** SparkForge-Labs (CDO) until a dedicated Foreman agent exists

Status legend: `todo` · `doing` · `blocked` · `done` · `packet`

## Open approval packets
| ID | Title | Tier | Status |
|----|-------|------|--------|
| AP-001 | §11.6 accounts / LFS / mesh-gen / device lab | 2 | **packet** — awaiting owner |

## Day 1 dispatch (§11.9)

| ID | Owner | Task | Status | Notes |
|----|-------|------|--------|-------|
| W0-01 | Foreman→Scribe | Decision-lock `docs/01-decisions/2026-09-forge-hub.md` (decisions 1–13) | **done** | commit `017d681` |
| W0-02 | Scribe | Amend Concept 10 §0.1.2–0.1.3 + §1.2 palette | **done** | PR #165 `7d9418c` |
| W0-03 | Scribe | Amend Fable-5 Rebuild Part IV forge-hub outcome | **done** | PR #167 `add7da2` |
| W0-04 | Scribe | CLAUDE.md v7 draft as approval packet | todo | Tier 2 |
| W0-05 | Scribe | Vocabulary lock HoloL/C/R; archive root Phased plan → `_SUPERSEDED/` | todo | |
| W0-06 | Scribe | Fix hub-concepts/`/workspace` paths in forge-hub specs; PROGRESS.md FORGE HUB note | todo | locks already committed 2026-09-14 |
| W0-07 | Scribe + Gatekeeper | PR #164 port list; close after W2 port | todo | do not close until port |
| W0-08 | Scribe + Director | MOTION_BIBLE.md v1 | todo | |
| W1-01 | Stagehand | `/dev/forge-hub` plate+parallax room shell; fixed cam; SSIM harness stub | **review** | PR #166 `8de3bbf` |
| W1-02 | Stagehand | Portal reducer port from PR #164; emitter charge/emit | todo | |
| W1-03 | Stagehand | Three glass slabs + breathe; poster fallback | todo | |
| W3-01 | Smith | Confirm SPARKY-CHARACTER-SPEC + artist brief | todo | spec may already exist |
| W3-02 | Smith | Track A candidate sheet (needs AP-001 mesh-gen) | blocked | AP-001 |
| W3-03 | Stagehand + Smith | Placeholder Sparky + desk spots + behaviour hooks | todo | after W1-01 |
| W8-01 | Inspector | Reference hardware doc + SSIM CI job scaffold | todo | |
| W8-02 | Inspector | Unit/e2e test scaffolds for forge-hub | todo | |
| W10-01 | Gatekeeper | FLAGS.md skeleton (`FORGE_HUB*`) | todo | no prod flip |
| W10-02 | Gatekeeper | Branch-protection packet after AP-001 | blocked | AP-001 |

## Rules
- Branch: `grok/<callsign>/<task-id>-<slug>` → PR into `setup-sparkforge-dev`
- Before push: `npm ci` · `npm run build` · `npm run test` · `npx tsc --noEmit` · Playwright health for UI
- Never touch `public/forge-hub/` bytes; `sha256sum -c SHA256SUMS` if near that folder
- Never edit `src/components/games/*`; no new Zustand store; OVERLAY-CRIT-001


## Roster live (2026-09-14)
| Call sign | Agent | Status |
|-----------|-------|--------|
| Foreman | SparkForge-Labs (CDO) covering | active |
| Scribe | Scribe (Forge Hub) | active — channel Forge Hub |
| Stagehand | Stagehand (Forge Hub) | active — channel Forge Hub |
| Smith / Director / Inspector / Glazier / Gatekeeper | — | deferred until AP-001 / P1 |
