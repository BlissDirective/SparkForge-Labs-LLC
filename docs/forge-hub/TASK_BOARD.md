# Forge Hub — Task Board

**Created:** 2026-09-14 (Foreman Day 1)  
**Plan:** TRANSITION_ACTION_PLAN.md v2.2  
**Integration branch:** `setup-sparkforge-dev` only (no `main`; the stray one was deleted 2026-09-15)  
**Owner:** Conrad (only approver)  
**Foreman covering:** SparkForge-Labs (CDO). 2026-09-15: the owner's reviewer (Claude) reconciled this board and landed the stalled W0 PRs while the Grok team is rate-limited.

Status legend: `todo` · `doing` · `blocked` · `done` · `packet`

## Open approval packets
| ID | Title | Tier | Status |
|----|-------|------|--------|
| AP-001 | §11.6 accounts / LFS / mesh-gen / device lab | 2 | **Approved, Option A (owner, 2026-09-15).** Owner-side hands-on steps listed in `AP-001.md`: branch protection, mesh-gen key, Mixamo, Chromebook, agent token. |
| AP-W0-04 | CLAUDE.md v7 | 2 | **Approved (owner, 2026-09-15).** Landed on dev with the "awaiting" language removed and branch, CI-PR, measured-gate rules added. PR #171 closed. |

## Owner-side actions outstanding (nobody else can do these)
| # | Action | Why |
|---|--------|-----|
| O-1 | GitHub → Settings → Branches → protect `setup-sparkforge-dev` (require PR with 1 review, required checks: `Typecheck, test, build`, `Secret scan (gitleaks)`, `RLS verification`, `E2E smoke (Playwright)`, `SSIM vs locked hub plate`; require up to date; block force push; no bypass) | Stops merges with red checks (PR #166 merged with E2E red). |
| O-2 | Create the mesh-gen account, store `MESH_GEN_API_KEY` in the agent runner secret store | Unblocks W3-02 Track A. |
| O-3 | Buy the reference Chromebook (Intel Iris Xe class); tell Inspector the model | Unblocks the WebGPU SSIM and frame-time numbers (§8). Headless CI cannot capture WebGPU. |
| O-4 | Fine-grained GitHub token or App for the agents (`GITHUB_TOKEN` in the runner) | Agents currently commit under the owner's account. |
| O-5 | ~~Confirm the canonical hub plate~~ **RESOLVED 2026-09-15**: owner supplied `LOCKED_HUB.jpg` (equal trio, 1280×720). `LOCKED_HERO.png` superseded. Room shell re-pointed + re-tuned; SSIM 0.969 (WebGL2). | Done. |

## Board

| ID | Owner | Task | Status | Notes |
|----|-------|------|--------|-------|
| W0-01 | Foreman→Scribe | Decision-lock `docs/01-decisions/2026-09-forge-hub.md` (decisions 1–13) | **done** | commit `017d681`; decision 14 (footer inside a side hologram) appended 2026-09-15 |
| W0-02 | Scribe | Amend Concept 10 §0.1.2–0.1.3 + §1.2 palette | **done** | reviewed and landed on dev 2026-09-15 (PR #165 content; PR closed) |
| W0-03 | Scribe | Amend Fable-5 Rebuild Part IV forge-hub outcome | **done** | reviewed and landed on dev 2026-09-15 (PR #167 content; PR closed) |
| W0-04 | Scribe | CLAUDE.md v7 | **done** | approved AP-W0-04; landed 2026-09-15 with corrections (PR #171 content; PR closed) |
| W0-05 | Scribe | Vocabulary lock HoloL/C/R; archive root Phased plan → `_SUPERSEDED/` | **done** | landed 2026-09-15 (PR #168 content; PR closed). `VOCABULARY.md` ToastRail row updated for decision 14. |
| W0-06 | Scribe | Reconcile spec paths to in-repo locations; PROGRESS note | **done** | landed 2026-09-15 (PR #169 content; PR closed) |
| W0-07 | Scribe + Gatekeeper | PR #164 port list; close after W2 port | **done** | `PR164_PORT_LIST.md`; #164 closed by W2-09 |
| W0-08 | Scribe + Director | MOTION_BIBLE.md v1 | **done** | merged PR #174 `8df5634` |
| W1-01 | Stagehand | `/dev/forge-hub` plate+parallax room shell; fixed cam | **done** | merged PR #166 `892e464`. Its SSIM harness was a stub; real harness is W8-01. |
| W1-02 | Stagehand | Portal reducer port from PR #164; emitter charge/emit | **done** | merged PR #173 `90706e7` |
| W1-03 | Stagehand | Three glass slabs + breathe; poster fallback | **done** | merged #175 `a4056cc`. 2026-09-15: WebGL2 fallback drew the plane diagonal (wireframe); fixed with `EdgesGeometry` outline. |
| W1-04 | Stagehand | Room shell to gate: desk plane painting over the plate, backdrop tone mapping | **done** | 2026-09-15 reviewer fix: desk plane is colourless (y=0 reference only), backdrop `toneMapped=false`. Measured SSIM before/after in PROGRESS.md. |
| W2-01 … W2-11 | Stagehand / Director | Screen kit, Director, morphs, beats, renderer cascade, #164 audit | **done** | see PROGRESS.md entries for PRs #176–#186 |
| W3-01 | Smith | Confirm SPARKY-CHARACTER-SPEC + artist brief | todo | spec exists (`docs/sparky/SPARKY-CHARACTER-SPEC.md` v1.0); brief `docs/sparky/ARTIST_BRIEF.md` still to write |
| W3-02 | Smith | Track A candidate sheet | blocked | O-2 (mesh-gen key) |
| W3-03 | Stagehand + Smith | Placeholder Sparky + desk spots + behaviour hooks | **done** | PR #187 `97a6f9d` |
| W3-04 | Stagehand | HoloBubble stub (open/close + Escape) | **done** | PR #190 reviewed and merged 2026-09-15. Follow-up W3-05: drop `aria-modal` from the non-modal tip/whisper states. |
| W3-D1 | Director | Bind Director morph Sparky reactions to the five seats | **done** | PR #191 reviewed and merged 2026-09-15 (branch was `cursor/…`, rule 8 reminder issued) |
| W3-05 | Stagehand | HoloBubble a11y: `aria-modal` only when a real focus trap exists; `role="status"` for tip | todo | from PR #190 review |
| W8-01 | Inspector | Reference hardware doc + real SSIM harness + CI job | **done** | 2026-09-15 reviewer: `scripts/ssim-forge-hub.mjs` (real capture + SSIM, poster hidden, cookie notice dismissed, blank-canvas guard), `.github/workflows/forge-hub-visual.yml`, `REFERENCE_HARDWARE.md` |
| W8-02 | Inspector | Forge-hub e2e scaffolds | **doing** | `tests/e2e/a11y-forge-nav.spec.ts` added 2026-09-15 (axe per mode, poster, keyboard); Sparky hit-test spec still todo |
| W8-03 | Inspector | Marketing footer contrast (pre-existing, blocked dev CI) | **done** | 2026-09-15: `globals-a11y.css` light-mode selector gap fixed; footer moves into a side hologram (decision 14) |
| W8-04 | Inspector | Headless WebGPU capture is black; document and keep CI on WebGL2; WebGPU number from the reference laptop | **done** | `REFERENCE_HARDWARE.md` §1; CI job forces `fallback=webgl2` |
| W10-01 | Gatekeeper | FLAGS.md skeleton (`FORGE_HUB*`) | **done** | `FLAGS.md` 2026-09-15; no flag defined in code yet |
| W10-02 | Gatekeeper | Branch protection | **packet → owner action O-1** | settings spelled out in `AP-001.md` |
| W10-03 | Gatekeeper | Weekly full-history gitleaks | **done** | `.github/workflows/gitleaks-full-history.yml` (compensates for the per-PR range scan from #166) |
| P1 | Stagehand → owner | P1 gate packet | **SSIM passes (0.969 WebGL2 vs LOCKED_HUB.jpg); WebGPU number pending O-3** | Room shell re-tuned to the canonical plate 2026-09-15. Remaining before the packet: WebGPU SSIM on the reference laptop (O-3); the live-mode layout registry (`layouts.ts` welcome/labsBrowse/focus/dual/avatarStudio rects) still carries old-plate geometry and needs a visual re-tune to the equal trio (W1-05, Stagehand) — the lock-pose (what SSIM measures) is correct. |
| W1-05 | Stagehand | Re-tune the live-mode layout registry to the equal-trio plate | todo | `layouts.ts`: LOCK pose + hubSplit/welcome side wings now derive from the new HOLO_*_LOCK and are correct; `labsBrowse`, `focus`, `dual`, `avatarStudio`, and `HUBSPLIT_HOLO_C`/`PLAYSTAGE_CENTER` rects were authored for the old composition and should be re-read off `LOCKED_HUB.jpg` with `/dev/forge-hub?calibrate=1`. Emitter (`CorePortal`) sits at the bottom-centre disc now (FORGE_CORE cy 78); verify its world Y projects onto the painted disc under the fixed camera. |

## Rules
- Branch: `grok/<callsign>/<task-id>-<slug>` → PR into `setup-sparkforge-dev`
- Before push: `npm ci` · `npm run build` · `npm run test` · `npx tsc --noEmit` · Playwright health for UI
- Never touch `public/forge-hub/` bytes; `sha256sum -c SHA256SUMS` if near that folder
- Never edit `src/components/games/*`; no new Zustand store; OVERLAY-CRIT-001
- CI and config changes in their own PR; gates need measured numbers; never merge with a red required check (CLAUDE.md v7 hard rules)

## Roster live (2026-09-15)
| Call sign | Agent | Status |
|-----------|-------|--------|
| Foreman | SparkForge-Labs (CDO) covering | active |
| Scribe / Stagehand / Director | Grok Bot Team | rate-limited for a few days from 2026-09-15 |
| Smith | — | blocked on O-2 |
| Inspector | — | W8-01/03/04 covered by the reviewer 2026-09-15; W8-02 continues |
| Glazier / Gatekeeper | — | deferred until P1 |
