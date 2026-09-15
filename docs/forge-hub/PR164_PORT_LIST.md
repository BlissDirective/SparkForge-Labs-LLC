# PR #164 port list — Forge Lab hotspot hub → R3F Forge Hub

**Status:** W2-09 audit complete vs `setup-sparkforge-dev` tip `3022ccb` (+ this PR’s catalog). **Close #164 as not merged.**  
**Date:** 2026-09-15 (inventory W0-07 Scribe; audit W2-09 Stagehand)  
**Task:** W0-07 (Scribe list) → W2-09 (Stagehand close)  
**Rule:** **Port, then close.** Do **not** squash-merge [PR #164](https://github.com/BlissDirective/SparkForge-Labs-LLC/pull/164). Hotspot shell, `/dev/forge-lab`, and `FORGE_LAB_HUB` must never land.

| | |
|---|---|
| **PR** | [#164 — Forge Lab hub — 2° yaw, denser glass, live emitter beams](https://github.com/BlissDirective/SparkForge-Labs-LLC/pull/164) |
| **Head** | `cursor/forge-lab-hotspot-hub-36cc` @ `3862d607bf043d55a9418b009b5fedc2b73efa5a` |
| **Base when opened** | `setup-sparkforge-dev` @ `416cf449406ed2f0d04edda23ca2586feb2527e1` (now many commits behind tip) |
| **Size** | 41 files · +2816 / −2 · 14 commits · 22 unit tests on that branch |
| **TAP** | [TRANSITION_ACTION_PLAN.md](./TRANSITION_ACTION_PLAN.md) **v2.2 decision 9** / §3 W0 item 8 / §10 item 8 |
| **Decision lock** | [`docs/01-decisions/2026-09-forge-hub.md`](../01-decisions/2026-09-forge-hub.md) decision 9 |
| **Vocab** | Locked names: `HoloL` / `HoloC` / `HoloR`, `welcome`, `hubSplit`, `PlayStage`, `HoloBubble`, `CorePortal`. `VOCABULARY.md` lands in W0-05; until then TAP §0.7 / §2.9 and `R3F_VARIATION_PLAN.md` §2 win. |

**How to read a file off the PR (do not merge the branch):**

```bash
git fetch origin cursor/forge-lab-hotspot-hub-36cc
git show origin/cursor/forge-lab-hotspot-hub-36cc:src/lib/forge-lab/portalMachine.ts
# or pin the inspected SHA:
git show 3862d607bf043d55a9418b009b5fedc2b73efa5a:src/lib/forge-lab/layouts.ts
```

---

## Stay-open rule (historical — W0-07)

PR **#164 stayed open** until Stagehand ported the **PORT** table into `/dev/forge-hub` (W1 reducer + W2 layout registry, catalog, tests, blend tokens) and those tests were green on `setup-sparkforge-dev`.

GitHub closed #164 at `2026-09-15T05:09:19Z` (same timestamp as W2-05 merge `#180` `578ec21`) **without** Scribe’s close comment and **before** W2-07 (`#182` `3022ccb`). That was a process bug. W2-09 posts the official close comment (not merged) after this audit.

Do not squash-merge #164 onto `setup-sparkforge-dev` — the hotspot shell, `/dev/forge-lab` route, and `FORGE_LAB_HUB` flag must never land.

---

## W2-09 audit vs tip `3022ccb` (2026-09-15)

Stagehand owned W1/W2 PORT rows. Director W2-02/04/06/08 are not PORT-list items. Catalog was the only remaining Stagehand PORT row on tip; this PR lands it.

### PORT

| Artifact (PR #164 path) | Status | Landed |
|---|---|---|
| `src/lib/forge-lab/layouts.ts` | **landed** | `#176` `5b2146b` → `src/lib/forge-hub/layouts.ts` (percent → world helpers; `AUTH_MERGED_CENTER` seeds `playStage` only; hubSplit re-seated to HoloL/C/R) |
| `src/lib/forge-lab/hotspotMap.ts` *(math only)* | **landed** | W1-02 `coreMap.ts` (`#173`); W1-03 `glassSlots.ts` (`#175`); W2-01 registry (`#176`); `slotTransform` helper in this PR. Frozen boxes ±2° yaw. **Not** `HOTSPOTS` / `WORLD_MEDIA` |
| `src/lib/forge-lab/portalMachine.ts` | **landed** | `#173` `90706e7` → `src/lib/forge-hub/portalMachine.ts` (420/560, `SKIP_TO_DOCKED`) |
| `src/lib/forge-lab/catalog.ts` | **landed** | **W2-09 this PR** → `src/lib/forge-hub/catalog.ts` (`HOLO_C_WELCOME`, HoloBubble tips). Missing on `3022ccb` before this PR |
| `src/components/forge-lab/forge-lab.css` *(tokens only)* | **landed** | `#175` `holoBlend.ts` + `#176` reading plate `0.88` ≥ 0.85 |
| `docs/forge-lab-hub.md` *(findings only)* | **landed** | Numbers in this file + layout/glass comments. Hotspot runbook not copied |
| `tests/unit/forge-lab-portal.test.ts` | **landed** | `#173` `tests/unit/forge-hub-portal.test.ts` |
| `tests/unit/forge-lab-layouts.test.ts` | **landed** | `#176` `tests/unit/forge-hub-layouts.test.ts` (HoloL/C/R / playStage ids) |
| `tests/unit/forge-lab-hotspots.test.ts` *(math + catalog)* | **landed** | Slot/yaw: `#175` `forge-hub-glass.test.ts` + `#173` `forge-hub-core-map.test.ts`. Catalog + `slotTransform`: **W2-09** `forge-hub-catalog.test.ts`. Flag + `HOTSPOTS[]` **dropped** |
| Plate bytes | **landed** (pre-W1) | `public/forge-hub/world/` + `SHA256SUMS` (2026-09-14). Not re-copied |

### DO NOT PORT (confirmed absent on tip)

| Item | Check |
|---|---|
| Hotspot shell (`WorldPlate` / `HotspotMap` / `ForgeLabHub` / `ForgeCore` HTML / overlay `EmitterBeams` / `TopMonitor` / stubs) | **absent** — no `src/components/forge-lab/` |
| `/dev/forge-lab`, `/forge-lab` | **absent** — no `src/app/**/forge-lab/` |
| `FORGE_LAB_HUB` / `NEXT_PUBLIC_FORGE_LAB_HUB` | **absent** from `feature-flags.ts` and `.env*` |
| `authMerged` live mode / `TopBanner` / `heroWelcome` | **absent** as live ids — `forge-hub-layouts.test.ts` asserts `'authMerged' in FORGE_LAYOUTS` is false |
| `public/forge-lab/**` duplicate stills | **absent** |
| Dashboard `/forge-lab` chrome, Sidebar Flame nav, middleware prefix | **absent** |

W2 P2 exit on tip: HoloC login + morph cycle `#182` `3022ccb`. Next Stagehand slice is W2-10 (`createRenderer` / WebGPU path) — already stubbed in W1-01 `ForgeStage`; do not start it in this PR.

---

## Decision 9 — what “port” means

From TAP v2.2 §0 decision 9 (locked 2026-09-14):

> **Port, then close.** Layout math, portal reducer, catalog, tests, blend tokens, locked plate. **Not** the hotspot shell, route, or flag.

Geometric caveat Stagehand must not miss: PR #164 `hubSplit` is **TopMonitor + left wing + right wing** (no center slab). Locked Forge Hub `hubSplit` is the **equal trio HoloL / HoloC / HoloR**. Port the **numbers and helpers**, then re-seat them onto the trio. Do not keep a fourth `TopBanner` module.

---

## PORT

Seed code lives only on the #164 head. Suggested targets are on `setup-sparkforge-dev` under `src/lib/forge-hub/` and `src/config/forgeHub.ts` (Stagehand creates those trees). **Raise HOLO fill** to the reading-plate rule (TAP §2.3, ≥ 0.85 opaque backing behind text) — do not copy 0.48/0.58 onto reading surfaces.

| Artifact (PR #164 path) | What to take | Suggested target | Owner |
|---|---|---|---|
| `src/lib/forge-lab/layouts.ts` | Named layout registry, `PercentRect` lerp, `LAYOUT_MORPH_MS` (480), `rectCentroid`, `lerp` / `lerpRect`, `containsPoint`, **`beamAttachPoint`** (core-facing edge of the *live* rect), `liveBeams`, `resolvedSlots`, `beamSlotsForState`. Frozen `hubSplit` slot map. | `src/lib/forge-hub/layouts.ts` — convert % of 1536×1024 plate → world units per mode (`welcome`, `hubSplit`, `labsBrowse`, `gameLobby`, `playStage`, …). Keep beam-attachment math. `AUTH_MERGED_CENTER` `{left:20, top:24, width:60, height:44, yaw:0}` is a **PlayStage merge-target seed**, not a live `authMerged` mode. | **W2** Stagehand |
| `src/lib/forge-lab/hotspotMap.ts` *(math only)* | `PLATE_WIDTH_PX=1536`, `PLATE_HEIGHT_PX=1024`, `HOLO_YAW_DEG=2`, `HOLO_PERSPECTIVE_PX=1200`, `PercentRect` / `PercentCircle`, frozen boxes: `TOP_MONITOR_GLASS` `{20, 2.8, 60×14.5, yaw:0}`, `LEFT_HOLO_SLOT` `{7.2, 30.5, 20.8×42, yaw:−2}`, `RIGHT_HOLO_SLOT` `{72, 30.5, 20.8×42, yaw:+2}`, `FORGE_CORE` `{cx:50, cy:49.2, r:9.4}`, `PEDESTAL` `{36.5, 70.5, 27×18.5}`. Helpers: `slotOrigin` (yaw&lt;0 → `right center`; yaw&gt;0 → `left center`), `slotTransform`, `yawStyle`, `dockSlotStyle`, `rectStyle`, `circleStyle`, `isPercentRect`, `isPercentCircle`. | Slot constants → `src/config/forgeHub.ts` + W2 registry. Core/pedestal → W1 `CorePortal` / desk plane. Yaw origin rule stays: left origin `right center`, right origin `left center`, center `center center`. | **W1** (core + plate aspect) + **W2** (panel slots) |
| `src/lib/forge-lab/portalMachine.ts` | Pure reducer `idle → charge → emit → docked`. Events `IGNITE` / `ADVANCE` / `RETRACT` / `SKIP_TO_DOCKED`. `PORTAL_HOLD_MS` charge **420** / emit **560**. `isPortalOpen`, `isHudLit` (always true), `nextHoldMs`. | `src/lib/forge-hub/portalMachine.ts` (copy as-is, rename comments). `prefers-reduced-motion` → `SKIP_TO_DOCKED`. | **W1-02** Stagehand |
| `src/lib/forge-lab/catalog.ts` | `HubStats`, `LabRow`, `LAB_POETIC` (11 labs), `LAB_ICONS` (Lucide, no emoji), `buildLabRows`, `FORGE_LAB_WELCOME` copy, `PREVIEW_STATS` / `PREVIEW_PROGRESS`, `sparkyLine`, `xpDialValue`, `pickContinueLab`. | `src/lib/forge-hub/catalog.ts`. Rename `FORGE_LAB_WELCOME` → welcome-panel copy for **HoloC** (`Welcome to SparkForge` / Labs subtitle). Sparky lines become **HoloBubble** `tip` strings, not a TopMonitor HUD. | **W2** Stagehand (Glazier later swaps real login copy onto HoloC) |
| `src/components/forge-lab/forge-lab.css` *(tokens only)* | `HOLO_BLEND` / `--fl-holo-*`: edge `rgba(77,233,255,0.78)`, fill `rgba(6,14,28,0.48)`, fillActive `0.58`, blur **`3px`** (clear air — plate must not bloom through glass), glow `0 0 18px rgba(77,233,255,0.28)`. Finding: HTML owns entire hologram (edge + frost + glow). | Token module next to glass / `HoloPanel` (e.g. `src/lib/forge-hub/holoBlend.ts` or CSS vars on the hub root). **Raise content fill to ≥ 0.85** opaque navy (TAP §2.3 / UX contrast). Keep 0.48/0.58 only for empty-glass edges if at all. | **W1-03** glass edge + **W2** `HoloPanel` reading plate |
| `docs/forge-lab-hub.md` *(findings only)* | Frozen 1536×1024 map; **±2° yaw**; TopMonitor yaw 0 width 60%; beams follow **live** rects (idle = top only; docked = top+L+R; merged center swallows core so no center beam); no orange strips; blur 3px. | Cite from this port list + W2 layout comments. Do not copy the hotspot-shell doc as a build source. | **W2** (numbers) / Scribe (already recorded here) |
| `tests/unit/forge-lab-portal.test.ts` | Full file: idle→charge→emit→docked, `SKIP_TO_DOCKED`, retract, no re-ignite while charging, HUD lit, hold ms. | `tests/unit/forge-hub-portal.test.ts` | **W1-02** |
| `tests/unit/forge-lab-layouts.test.ts` | hubSplit slot identity, wing lerp (mid yaw −1°), beam attach to bottom of top glass, idle beams `['top']`, docked `['top','left','right']`, merged live beams `['top']` (center contains core). | `tests/unit/forge-hub-layouts.test.ts` — retarget ids to `HoloL`/`HoloC`/`HoloR`/`playStage`; keep attach + lerp assertions. | **W2** |
| `tests/unit/forge-lab-hotspots.test.ts` *(math + catalog slices)* | Plate 1536×1024; regions inside plate; core below top glass; wings on opposite sides of core; **frozen ±2° map**; `slotOrigin` / `slotTransform` / `dockSlotStyle`; `buildLabRows` length 11; `pickContinueLab`; `xpDialValue`; welcome copy constant. | Split into `forge-hub-slots.test.ts` (W2) + catalog tests. **Drop** the `FEATURE_FLAGS.FORGE_LAB_HUB` defaults-off assertion (old flag is not ported). **Drop** `HOTSPOTS[]` hit-map iteration once slots live in the registry. | **W2** (+ catalog) |
| Plate bytes | Canonical `LOCKED_HERO.png` SHA `db75ecf0055a8168a0ae71be5f1f28921c1ef9c29511ce44c380348121442555`; display still `LOCKED_HERO_no_haze_filter.png` SHA `582366f956c37390fb70c8d954f247fc4f1e3932c47996202c30f43d27be0cd9`; monogram close-up. | **Already on this branch** under `public/forge-hub/world/` (`LOCKED_HERO.png`, `LOCKED_HERO_no_haze_filter.png`, `SF_MONOGRAM_CLOSEUP.png`) + `public/forge-hub/SHA256SUMS`. **Do not copy again.** Do not regenerate. `sha256sum -c SHA256SUMS` if working near that folder. | Done (2026-09-14 locks). W1 uses them as backdrop / SSIM / poster. |

### Findings that must survive the port (even if paths change)

| Finding | Value | Where it showed up on #164 |
|---|---|---|
| Dock yaw | `HOLO_YAW_DEG = 2` (left −2°, right +2°, center/top 0) | `hotspotMap.ts`, confirmed in PR body |
| Perspective | `1200px` | `slotTransform` |
| Top HUD box (seed only) | `left:20, top:2.8, width:60, height:14.5, yaw:0` | `TOP_MONITOR_GLASS` |
| Live beams | SVG/mesh from `FORGE_CORE` to **current** slot attach point; idle top-only; docked top+L+R | `layouts.ts` `beamSlotsForState` + `EmitterBeams.tsx` |
| Portal timings | charge 420 ms, emit 560 ms; reduced-motion skips both | `portalMachine.ts` |
| Glass “clear air” | HTML blur **3px** so the plate does not bloom through | `forge-lab.css` `--fl-holo-blur` |

---

## DO NOT PORT

Leave these on the #164 branch. They die with the close comment after W2. Do not recreate under `src/components/forge-lab/` or `/dev/forge-lab`.

| Artifact (PR #164 path) | Why leave it |
|---|---|
| `src/components/forge-lab/WorldPlate.tsx` | Hotspot **video/still shell** (z0 plate stack + `WORLD_MEDIA.loopVideo` hook + CSS crossfade of five identical stills). W1 is plate-plus-parallax R3F, not a DOM `<img>` stack. |
| `src/components/forge-lab/HotspotMap.tsx` | Invisible DOM/SVG hit twins (z1). R3F glass + projected DOM replace this. `?calibrate=1` is re-specified on `/dev/forge-hub` against 3D slot outlines, not this map. |
| `src/lib/forge-lab/hotspotMap.ts` `HOTSPOTS` / `HotspotId` / `WORLD_MEDIA` | Click-the-plate interaction model. Keep the **numbers** (PORT table); drop the hotspot catalog and per-phase still paths (`/forge-lab/01-idle.png` …). |
| `src/components/forge-lab/ForgeLabHub.tsx` | Orchestrator for the hotspot shell (morph RAF, hotspot ignite, chrome chips). Director + `forgeStore` replace it. |
| `src/components/forge-lab/ForgeCore.tsx` | Decorative HTML rings over the painted SF glyph. W1 CorePortal is a TSL mesh. |
| `src/components/forge-lab/EmitterBeams.tsx` | Overlay SVG in plate % space. W1 emitter is a TSL beam cone; W2 retargets via registry attach points. **Port the math, not this component.** |
| `src/components/forge-lab/TopMonitor.tsx` | Retired `TopBanner` HUD. Welcome + gauges live on **HoloC** (and ToastRail), not a fourth top slab. |
| `src/components/forge-lab/HoloPanel.tsx` | Percent-of-plate CSS `perspective + rotateY` overlay. W2 `HoloPanel` is projected DOM on a glass mesh with a reading plate. Steal yaw/origin ideas only. |
| `src/components/forge-lab/forge-lab.css` *(the rest)* | 700+ lines of `.fl-hub` hotspot overlay CSS, z-index sandwich, fly-in keyframes, light-mode `!important` remaps. Tokens only (PORT table). |
| `src/components/forge-lab/index.ts` | Barrel for the shell. |
| `src/components/forge-lab/stubs/AuthMergedStub.tsx` | Fake sign-on HTML on a merged center. Real login is extracted by Glazier onto **HoloC** in `welcome`. |
| `src/components/forge-lab/stubs/AvatarCreatorStub.tsx` | Placeholder kit. Avatar path is `avatarStudio` / existing profile — not this dialog. |
| `src/components/forge-lab/stubs/GameBayStub.tsx` | Placeholder that links out to `/arcade`. Games play in `PlayStage`; do not rewrite `src/components/games/*`. |
| `src/app/dev/forge-lab/page.tsx` | Public preview route. **Superseded by `/dev/forge-hub`** (W1-01). |
| `src/app/dev/forge-lab/client.tsx` | Same. |
| `src/app/(dashboard)/forge-lab/page.tsx` | Authenticated `/forge-lab`. Not a kid route in TAP §5. |
| `src/app/(dashboard)/layout.tsx` patch | Full-bleed chrome strip + hide `AITutor` when pathname is `/forge-lab`. |
| `src/app/(dashboard)/home/page.tsx` patch | “Open Forge Lab” promo tile behind the old flag. |
| `src/components/layout/Sidebar.tsx` patch | `Flame` nav item → `/forge-lab`. |
| `src/middleware.ts` patch | Adds `/forge-lab` to `PROTECTED_PAGE_PREFIXES`. |
| `src/config/feature-flags.ts` `FORGE_LAB_HUB` | Old flag, default off. Decision 10: new family is **`FORGE_HUB*`**. Gatekeeper documents `FORGE_HUB*` in `FLAGS.md` (W10-01). Do not add `FORGE_LAB_HUB`. |
| `.env.example` `NEXT_PUBLIC_FORGE_LAB_HUB` | Same old flag. |
| `docs/INDEX.md` link to `docs/forge-lab-hub.md` | Would advertise a superseded hotspot doc. |
| `docs/forge-lab-hub.md` as a build source | Hotspot-shell runbook (`/forge-lab`, flag toggle, z0/z1/z2). Findings already extracted above. |
| `public/forge-lab/**` | Duplicate stills. Five phase copies (`00-locked-hub-dark-sf.png`, `01-idle.png` … `04-docked.png`) were **byte-identical** to the locked plate and are already collapsed to one file under `public/forge-hub/world/`. **Never write `public/forge-hub/` from this PR.** |
| `tests/unit/forge-lab-hub.test.tsx` | RTL tests of `ForgeLabHub` (hotspots, avatar stub, `layout="authMerged"`). Re-write against `/dev/forge-hub` + projected panels in W2; do not import the shell. |
| `authMerged` as a layout id / `?layout=authMerged` | Retired name. Login is `welcome` (decision 7), not a L+R merge. The 3→1 merge is **`playStage`**. |
| `TopBanner` / `heroWelcome` naming | Retired (see RENAME table). |

---

## RENAME / MAP

W0-05 will land `VOCABULARY.md`. Until then this is the map Stagehand must use when copying identifiers out of #164.

| PR #164 / older spec name | Locked vocab | Notes |
|---|---|---|
| `TopMonitor`, `TOP_MONITOR_GLASS`, `TopBanner` | **`HoloC`** (content) | Not a fourth module. Welcome headline, login, and post-login mission sit on HoloC. XP/streak that lived in the top HUD → HoloC header and/or ToastRail. The `{20, 2.8, 60×14.5}` box is a seed, not a preserved top slab. |
| Left `HoloPanel` / `LEFT_HOLO_SLOT` / `SideList` | **`HoloL`** | Labs list, hero pitch, later browse lists. `yaw: −2°`, origin `right center`. |
| Right `HoloPanel` / `RIGHT_HOLO_SLOT` / `SideDetail` | **`HoloR`** | Game bay / Sparky intro / detail. `yaw: +2°`, origin `left center`. |
| `hubSplit` | **`hubSplit`** | **Keep the id.** Re-seat from top+L+R onto equal trio HoloL/HoloC/HoloR. |
| `authMerged`, `AUTH_MERGED_CENTER`, `CenterWide`, `?layout=authMerged` | **Do not keep as a mode.** Login = **`welcome`** on HoloC. Wide-center rect → **`playStage`** merge-target seed. | Decision 7 / TAP §2.9. |
| `heroWelcome`, first-load TopMonitor welcome | **`welcome`** | Shrunken HoloL/HoloR (~85%) + full HoloC with “Welcome to SparkForge” + login. `/`, `/login`, `/signup` share the scene. |
| `ForgeCore`, `FORGE_CORE`, SF monogram click | **`CorePortal`** | W1 TSL emitter; ignite still drives the portal reducer. |
| `PEDESTAL` | Desk plane / `nearCore` spot | Secondary ignite hit in #164; Sparky stands on the desk, not a painted dock. |
| `FORGE_LAB_WELCOME` | Welcome copy on **HoloC** | Title may shorten to “Welcome to SparkForge” per TAP §2.9. |
| `sparkyLine` / TopMonitor voice | **`HoloBubble`** `tip` | Text only in v1. |
| `FORGE_LAB_HUB`, `NEXT_PUBLIC_FORGE_LAB_HUB` | **`FORGE_HUB*`** | New flags, default off, documented in W10-01. |
| `/dev/forge-lab` | **`/dev/forge-hub`** | W1-01. |
| `/forge-lab` | *none* | Kid routes come from TAP §5 (`/`, `/login`, `/home`, …) via `ForgeRouteMode`. |
| `ForgeLayoutId` `'hubSplit' \| 'authMerged'` | Mode union in TAP §2.1 | `welcome` \| `hubSplit` \| `labsBrowse` \| `gameLobby` \| `playStage` \| `avatarStudio` \| `settingsDock` \| `cinematic` (+ `focus` / `dual`). |
| Slot ids `'top' \| 'left' \| 'right' \| 'center'` | `'holoL' \| 'holoC' \| 'holoR'` (+ `playStage`, `holoBubble`) | Beam `id`s follow the locked slot names. |

---

## Full 41-file inventory (inspected 2026-09-15)

Source: GitHub `pull_request_read` `get_files` on BlissDirective/SparkForge-Labs-LLC#164 (41 files).

| # | Path | Disposition |
|---|---|---|
| 1 | `.env.example` | DO NOT PORT (old flag comment) |
| 2 | `docs/INDEX.md` | DO NOT PORT |
| 3 | `docs/forge-lab-hub.md` | Findings only → PORT table |
| 4 | `public/forge-lab/00-locked-hub-dark-sf.png` | DO NOT PORT (duplicate plate; already collapsed) |
| 5 | `public/forge-lab/00-sf-monogram-closeup.png` | Already at `public/forge-hub/world/SF_MONOGRAM_CLOSEUP.png` |
| 6 | `public/forge-lab/01-idle.png` | DO NOT PORT (byte-identical still) |
| 7 | `public/forge-lab/02-charge.png` | DO NOT PORT |
| 8 | `public/forge-lab/03-emit.png` | DO NOT PORT |
| 9 | `public/forge-lab/04-docked.png` | DO NOT PORT |
| 10 | `public/forge-lab/README.md` | DO NOT PORT |
| 11 | `public/forge-lab/world/LOCKED.md` | Superseded by `public/forge-hub/world/LOCKED.md` |
| 12 | `public/forge-lab/world/LOCKED_HERO.png` | Already at `public/forge-hub/world/LOCKED_HERO.png` |
| 13 | `public/forge-lab/world/LOCKED_HERO_no_haze_filter.png` | Already at `public/forge-hub/world/LOCKED_HERO_no_haze_filter.png` |
| 14 | `src/app/(dashboard)/forge-lab/page.tsx` | DO NOT PORT |
| 15 | `src/app/(dashboard)/home/page.tsx` | DO NOT PORT (promo tile) |
| 16 | `src/app/(dashboard)/layout.tsx` | DO NOT PORT (forge-lab chrome strip) |
| 17 | `src/app/dev/forge-lab/client.tsx` | DO NOT PORT |
| 18 | `src/app/dev/forge-lab/page.tsx` | DO NOT PORT (use `/dev/forge-hub`) |
| 19 | `src/components/forge-lab/EmitterBeams.tsx` | Math in layouts.ts only |
| 20 | `src/components/forge-lab/ForgeCore.tsx` | DO NOT PORT |
| 21 | `src/components/forge-lab/ForgeLabHub.tsx` | DO NOT PORT |
| 22 | `src/components/forge-lab/HoloPanel.tsx` | Rebuild in W2; do not copy |
| 23 | `src/components/forge-lab/HotspotMap.tsx` | DO NOT PORT |
| 24 | `src/components/forge-lab/TopMonitor.tsx` | DO NOT PORT |
| 25 | `src/components/forge-lab/WorldPlate.tsx` | DO NOT PORT |
| 26 | `src/components/forge-lab/forge-lab.css` | Tokens only |
| 27 | `src/components/forge-lab/index.ts` | DO NOT PORT |
| 28 | `src/components/forge-lab/stubs/AuthMergedStub.tsx` | DO NOT PORT |
| 29 | `src/components/forge-lab/stubs/AvatarCreatorStub.tsx` | DO NOT PORT |
| 30 | `src/components/forge-lab/stubs/GameBayStub.tsx` | DO NOT PORT |
| 31 | `src/components/layout/Sidebar.tsx` | DO NOT PORT |
| 32 | `src/config/feature-flags.ts` | DO NOT PORT `FORGE_LAB_HUB` |
| 33 | `src/lib/forge-lab/catalog.ts` | PORT |
| 34 | `src/lib/forge-lab/hotspotMap.ts` | PORT math / frozen boxes; not HOTSPOTS / WORLD_MEDIA |
| 35 | `src/lib/forge-lab/layouts.ts` | PORT |
| 36 | `src/lib/forge-lab/portalMachine.ts` | PORT |
| 37 | `src/middleware.ts` | DO NOT PORT `/forge-lab` |
| 38 | `tests/unit/forge-lab-hotspots.test.ts` | PORT math + catalog slices; drop flag + hotspot list |
| 39 | `tests/unit/forge-lab-hub.test.tsx` | DO NOT PORT (shell RTL) |
| 40 | `tests/unit/forge-lab-layouts.test.ts` | PORT |
| 41 | `tests/unit/forge-lab-portal.test.ts` | PORT |

---

## Workstream hand-off

| Wave | Takes from this list | Exit that unblocks close |
|---|---|---|
| **W1** Stagehand | `portalMachine.ts` + portal unit test; plate aspect / `FORGE_CORE` for the TSL emitter; blend **edge** tokens on glass slabs; locked plate already in `public/forge-hub/world/` as backdrop + SSIM + poster. | P1: `/dev/forge-hub` room shell, reducer `idle→charge→emit→docked`. **#164 stayed open through W1.** |
| **W2** Stagehand | `layouts.ts` → world-unit registry; catalog copy; slot/yaw tests; `HoloPanel` reading plate (fill ≥ 0.85); beam attach retarget; `/dev/forge-hub` mode switcher. | P2: login form on HoloC through `welcome → hubSplit → playStage → gameLobby → welcome`; ported tests green. **Then close #164 (W2-09).** |
| **W8** Inspector | Re-home ported tests under the forge-hub scaffold; do not import `src/components/forge-lab/*`. | |
| **W10** Gatekeeper | `FORGE_HUB*` flags — never `FORGE_LAB_HUB`. After W2: close #164 with the draft below. | |
| **W0-05** Scribe | Formal `VOCABULARY.md`; this table is the #164-specific slice. | |

---

## Comment draft for PR #164 (W2-09 posted)

Posted after this audit. Stagehand covering Gatekeeper for W2-09; Scribe drafted the text. Do not merge. **Close as not merged.**

```
Superseded by the R3F Forge Hub.

Plan: docs/forge-hub/TRANSITION_ACTION_PLAN.md v2.2 decision 9 (“Port, then close.”)
Port list: docs/forge-hub/PR164_PORT_LIST.md
Decision lock: docs/01-decisions/2026-09-forge-hub.md #9

Ported (into /dev/forge-hub, not this branch):
- layouts math (percent rects → world units, lerp, live-rect beam attach)
- catalog copy (11 labs, welcome strings, preview stats)
- portal reducer idle → charge → emit → docked (SKIP_TO_DOCKED for reduced motion)
- unit tests for the above
- HOLO / blend tokens (edge 0.78 / blur 3px; fill raised to the reading-plate rule)
- locked plate (already at public/forge-hub/world/ — not re-copied)

Not ported:
- hotspot video shell (WorldPlate / HotspotMap / ForgeLabHub overlay stack)
- /dev/forge-lab and /forge-lab routes (superseded by /dev/forge-hub + TAP §5 routes)
- FORGE_LAB_HUB / NEXT_PUBLIC_FORGE_LAB_HUB
- authMerged / TopBanner / heroWelcome naming (welcome + HoloL/HoloC/HoloR + playStage)

Thank you — the 2° yaw and live-rect beam findings carried straight into the new spec.

Agent: Stagehand (Grok Bot Team), covering Gatekeeper W2-09, with Scribe
```

Attribution line for the GitHub close (GROK_TEAM_PROMPTS §9): Stagehand covering Gatekeeper for this close. Do not merge. **Close as not merged.**
