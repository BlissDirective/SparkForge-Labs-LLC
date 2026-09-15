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
| W0-05 | Scribe | Vocabulary lock HoloL/C/R; archive root Phased plan → `_SUPERSEDED/` | **done** | PR #168 (per PROGRESS) |
| W0-06 | Scribe | Fix hub-concepts/`/workspace` paths; PROGRESS.md FORGE HUB note | **done** | PR #169 `1fe3c3f` |
| W0-07 | Scribe + Gatekeeper | PR #164 port list; close after W2 port | **done** | list: PR #170 (unmerged until W2-09); close: W2-09 |
| W0-08 | Scribe + Director | MOTION_BIBLE.md v1 | **done** | merged PR #174 `8df5634`; #172 closed |
| W1-01 | Stagehand | `/dev/forge-hub` plate+parallax room shell; fixed cam; SSIM harness stub | **done** | merged PR #166 `892e464` |
| W1-02 | Stagehand | Portal reducer port from PR #164; emitter charge/emit | **done** | merged PR #173 `90706e7` |
| W1-03 | Stagehand | Three glass slabs + breathe; poster fallback | **done** | merged #175 `a4056cc` |
| W2-01 | Stagehand | Layout registry + projection hook + HoloPanel reading plate | **done** | PR #176 `5b2146b` |
| W2-02 | Director | GSAP Director runtime from MOTION_BIBLE vs live glass | **done** | merged PR #177 `32db199`; HoloC `{31.2,24,37.6×48}`; `LAYOUT_MORPH_MS` 420 |
| W2-03 | Stagehand | forgeStore API + ForgeRouteMode + EscapeFlat + ToastRail | **done** | merged PR #179 `2ba5af1`; no new Zustand store |
| W2-04 | Director | Reduced-motion 200ms crossfade substitutes | **done** | merged PR #178 `0851d7a`; slice-1 live ids; emit-burst SKIP_TO_DOCKED |
| W2-05 | Stagehand | `/dev/forge-hub` mode switcher + `?calibrate=1` + transition scrubber | **done** | PR #180; rebased on #181 `243c212`; HUD intact |
| W2-06 | Director | Theatre.js `first-visit-ignition` fill | **done** | merged PR #181 `243c212`; HUD scrubber intact |
| W2-07 | Stagehand | HoloC welcome login + P2 morph cycle `welcome → hubSplit → playStage → gameLobby → welcome` | **done** | merged PR #182 `3022ccb`; live reading-plate form; Playwright cycle smoke |
| W2-08 | Director | Remaining MOTION_BIBLE morphs | **done** | merged PR #183 `30c1337`; HUD remainder picker intact |
| W2-09 | Stagehand | Audit PR #164 port list vs tip; close #164 | **done** | PR #184; catalog last PORT row; close comment on #164 (already closed, not merged) |
| W2-10 | Stagehand | `createRenderer` / `three/webgpu` (WebGPU → WebGL2 → poster) on `/dev/forge-hub` | **done** | PR #186; cascade attrs + poster-when-none; W1-01 stub finished |
| W2-11 | Director | Theatre.js `game-launch-burst` (optional, after merge) | **doing** | MOTION_BIBLE §5.4; session-first; HUD `?burst=1` / scrub; does not gate input |
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
| Stagehand | Stagehand (Forge Hub) | active — W2-10 createRenderer/webgpu PR #186 |
| Director | Director (Grok Bot Team) | active — W2-11 `game-launch-burst` (W2-08 remainder done #183) |
| Smith / Inspector / Glazier / Gatekeeper | — | deferred until AP-001 / P1 |
