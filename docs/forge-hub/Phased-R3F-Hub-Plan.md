# Phased R3F Hub Plan — SparkForge Labs

**Status:** Phase 0 (spec lock) — updated 2026-09-15 (W0-05 vocabulary)  
**Date:** 2026-09-08 (rev 2026-09-15)  
**Owner:** SparkForge Labs (CDO)  
**Repo:** BlissDirective/SparkForge-Labs-LLC  
**Branch:** `setup-sparkforge-dev`  
**Vocabulary:** `VOCABULARY.md` (LOCKED) — `HoloL` / `HoloC` / `HoloR`; modes `welcome`, `hubSplit`, …  
**Related:** TAP v2.2 `docs/forge-hub/TRANSITION_ACTION_PLAN.md`; visual lock `docs/forge-hub/LOCKED_HUB.md` + `public/forge-hub/world/LOCKED_HERO.png`; avatar `docs/forge-hub/LOCKED_SPARKY.md`; unified plan `docs/forge-hub/R3F_VARIATION_PLAN.md`; PR #164 `/dev/forge-lab` (closed, ported per `PR164_PORT_LIST.md`)

---

## 1. Intent

Rebuild the kid hub as a **real-time forge laboratory** using **React Three Fiber (R3F)**:

- **World** = R3F meshes (room, lights, SF core, pedestal)
- **UI** = **HTML panels on screen meshes** (interactive React menus on 3D glass)
- **Camera** = **fixed** (same composition as the locked forge plate) — no free-look v1
- **Layouts** = named morph states (panels move/merge like today’s `ForgeLayout`)

This replaces fighting a painted plate vs HTML % map for hologram alignment. Keep `/dev/forge-lab` hotspot shell as fallback until R3F hub ships.

**Out of scope for v1:** Unreal / Pixel Streaming (GPU $/concurrent; see cost model spreadsheet), free-fly camera, full Unity WebGL rewrite.

---

## 2. Design rules

1. Fixed camera matching locked hero composition.
2. World meshes for environment; HTML for all interactive menus/forms.
3. One hologram visual family (thin cyan glass, denser fill when active).
4. Named layout modes morph mesh transforms (spring/lerp).
5. Heavy Phaser/Pixi games **exit or dim** the forge (perf); light in-hub play uses `PlayStage`.
6. Parent/billing/legal may use **EscapeFlat** (2D overlay) if 3D hurts usability.
7. Accessibility: focus order, reduced motion, readable contrast on glass.
8. COPPA / kids-safe defaults (no dark patterns; clear exits).

### Sparky (2026-09-11)
No desk dock on `LOCKED_HUB`. Sparky is a **hologram/overlay** (`SparkyOverlay`) in later phases — not world desk hardware.

---

## 3. Screen module catalog

Locked names: `VOCABULARY.md`. The locked plate is a **Holo trio** — no top banner. Every layout is a placement of one to three slabs.

| Module ID | Role | Typical content |
|---|---|---|
| `HoloL` | Left glass of the trio | Lists, stats, tools, welcome key details (what SparkForge is / labs / games) |
| `HoloC` | Center glass of the trio | Primary surface: welcome headline + login, daily mission, lesson, launch stage |
| `HoloR` | Right glass of the trio | Detail, preview, feed, rewards; welcome Sparky intro + demo login |
| `PlayStage` | **Single large hologram** (HoloL+C+R merged) | Games on glass (default), story, lesson viewer |
| `HoloBubble` | Sparky head-emitter chat (small fourth glass) | Tips, tutor chat, whisper — TAP §2.8b |
| `CorePortal` | SF emitter (world mesh) | Ignite / emit / dock |
| `ToastRail` | Edge chips | Toasts, mission pings, footer/legal chip |
| `EscapeFlat` | Full-viewport 2D escape | Parent billing, legal, dense settings |

**Retired (do not use):** `TopBanner`, `SideList`, `SideDetail`, `CenterWide`. Map any leftover copy to `HoloL` / `HoloC` / `HoloR` (or `PlayStage` when merged).

---

## 4. Hub display modes (layout states)

Mode ids match TAP §2.1 / §5. Sub-layouts Focus, Dual, and Whisper are placements of the same trio (plus `HoloBubble`), not extra slabs.

| Mode | Live modules | Purpose |
|---|---|---|
| `welcome` | HoloC full + HoloL/R ~85% + CorePortal + HoloBubble | **Site home + login** (replaces marketing hero). Auth forms wipe on HoloC. |
| `hubSplit` | Equal HoloL + HoloC + HoloR | Default post-login dock — **three destinations** on the equal trio |
| `labsBrowse` | HoloL list + HoloC lab hero + HoloR detail | Lab map + detail |
| `gameLobby` | HoloL games + HoloC launch + HoloR preview | Pick a game |
| `avatarStudio` | HoloL stats + HoloC avatar + HoloR Sparky outfits | Child avatar / companion rack |
| `settingsDock` | HoloL nav + HoloC kid prefs (or EscapeFlat) | Kid settings; security → FLAT |
| `playStage` | **One PlayStage** (3→1 morph) | Games / story / lessons on the merged slab |
| `cinematic` | Minimal UI | Emit/charge animation; story beats |

**Retired mode ids:** `heroWelcome` → `welcome`. `authMerged` → `welcome` (signup/forgot/reset wipe HoloC; no morph). Parent/billing is `FLAT` + `EscapeFlat`, not a hologram mode.

**Sub-layouts:** Focus (HoloC ~70–80%, sides yaw/tuck); Dual (two mid panels, HoloC strip); Whisper (`HoloBubble` expands, trio dims).

### PlayStage morph

`HoloL` + `HoloC` + `HoloR` **lerp into one mega-glass** (flat slab first; curved later) in front of SF. Games play inside that slab by default (TAP decision 5).

```
welcome → hubSplit
              ↓
    labsBrowse / gameLobby / avatarStudio
              ↓
         playStage → hubSplit (or gameLobby)
```

Focus / Dual / Whisper can apply on top of the current mode. `Emit burst` (`cinematic`) can punctuate any change.

---

## 5. Live app → mode crosswalk (seed)

Canonical route table: TAP v2.2 §5. This seed uses the locked names only.

| Live surface | R3F mode | Modules |
|---|---|---|
| Marketing / first paint + login | `welcome` | HoloL key details · HoloC "Welcome to SparkForge" + login · HoloR Sparky intro / demo |
| Signup / forgot / reset | `welcome` | Same trio; HoloC form wipes in (no morph) |
| Home / daily mission | `hubSplit` | HoloL stats / streak · HoloC mission / continue · HoloR feed |
| Labs map | `labsBrowse` | HoloL list · HoloC selected lab · HoloR detail |
| Arcade / game menus | `gameLobby` → `playStage` | Lobby on the trio, then merged PlayStage (fullscreen hatch per registry) |
| Sparky tutor / chat | `HoloBubble` (any mode) | Head-emitter bubble; Whisper expands it. Outfit rack is `avatarStudio` |
| Parent / billing / legal | `FLAT` | `EscapeFlat` |
| Settings | `settingsDock` | HoloL nav · HoloC prefs; security routes `FLAT` |

---

## 6. Phases

| Phase | Deliverable | Success |
|---|---|---|
| **0 — Spec lock** | This doc + screen inventory | Modes/modules agreed |
| **1 — Room shell** | R3F scene ≈ locked plate; fixed camera; SF core | Looks like forge; no menus |
| **2 — Screen mesh kit** | 3 glass quads + Html mount + morph API | One React panel locked to mesh |
| **3 — HubSplit + Hero** | Wire Top/L/R stubs; hero welcome | Navigable mock hub |
| **4 — Auth + PlayStage** | L+R merge; 3→1 PlayStage | Sign-on + large stage |
| **5 — Content families** | Mount real labs/games/avatar/settings | Parity with live flows |
| **6 — Polish** | Emit timing, motion prefs, mobile, optional ambience video | Ship-ready behind flag |

**Flag:** e.g. `NEXT_PUBLIC_FORGE_LAB_R3F` (default off). Hotspot `/dev/forge-lab` remains until cutover.

---

## 7. Technical notes

- Stack: Next.js + `@react-three/fiber` + `@react-three/drei` (`Html`, `Environment` as needed).
- Prefer **Html transform** on mesh for a11y/forms; avoid baking UI into canvas textures for v1.
- Morph: shared layout registry (port `src/lib/forge-lab/layouts.ts` concepts to 3D transforms).
- Lighting: match locked plate (cyan holograms primary; blue→purple strips secondary).
- Perf: one scene, limited lights, no free camera; unload PlayStage content when leaving mode.

---

## 8. Explicit non-goals (v1)

- Pixel Streaming / always-on GPU farms for every kid
- Replacing all Phaser/Pixi games with R3F
- Panoramic free-look cockpit (historical failure mode)

---

## 9. References

- Locked plate: `public/forge-hub/world/LOCKED_HERO.png` + `public/forge-hub/world/LOCKED.md` (SHAs in `public/forge-hub/SHA256SUMS`; read-only)
- Hotspot hub: PR #164 (`/dev/forge-lab` port list is W0-07 / W2); product route is `/dev/forge-hub`
- Cost contrast: `SparkForge_PixelStreaming_Concurrency_Cost_Model.xlsx` (owner-local research spreadsheet; not in this repo)
- Prior brainstorm (2026-09-08 CDO chat): modules, modes, phases 0–6

---

## 10. Next brainstorm beat

One-page **screen inventory**: every menu/route → module + mode. Then Phase 1 room shell spike behind a feature flag.
