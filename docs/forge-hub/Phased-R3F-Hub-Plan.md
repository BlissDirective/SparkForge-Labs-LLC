# Phased R3F Hub Plan — SparkForge Labs

**Status:** Phase 0 (spec lock) — updated 2026-09-11  
**Date:** 2026-09-08 (rev 2026-09-11)  
**Owner:** SparkForge Labs (CDO)  
**Repo:** BlissDirective/SparkForge-Labs-LLC  
**Branch:** `setup-sparkforge-dev`  
**Related:** PR #164 `/dev/forge-lab`; visual lock `docs/forge-hub/LOCKED_HUB.md` + `public/forge-hub/world/LOCKED_HERO.png`; avatar `docs/forge-hub/LOCKED_SPARKY.md`; unified plan `docs/forge-hub/R3F_VARIATION_PLAN.md`

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

| Module ID | Role | Typical content |
|---|---|---|
| `TopBanner` | Wide top glass | Welcome, XP/streak, Sparky line, alerts |
| `SideList` | Tall left/right | Labs list, game list, settings nav |
| `SideDetail` | Tall left/right | Lab detail, game preview, avatar tools |
| `CenterWide` | Merged L+R (or larger) | Sign-on, big forms |
| `PlayStage` | **Single large hologram** (meshed from 3 panels) | In-hub play area, Sparky theater, light interactive |
| `CorePortal` | SF emitter (mostly world mesh) | Ignite / emit / dock |
| `ToastRail` | Edge chips | Toasts, mission pings |
| `EscapeFlat` | Full-viewport 2D escape | Parent billing, dense settings |

---

## 4. Hub display modes (layout states)

| Mode | Live modules | Purpose |
|---|---|---|
| `welcome` (was heroWelcome) | HoloC large + HoloL/R small + CorePortal | **Site home** / first load (replaces marketing hero) |
| `hubSplit` | Top + L + R | Default navigation dock |
| `authMerged` | Top + CenterWide | Sign-in / signup / parent gate |
| `labsBrowse` | Top + SideList + SideDetail | Lab map + detail |
| `gameLobby` | Top + L games + R preview | Pick a game |
| `avatarStudio` | Top + side or CenterWide | Avatar / Sparky companion |
| `settingsDock` | Top + wide or EscapeFlat | Kid vs parent settings |
| `playStage` | **One PlayStage** (3→1 morph) | Larger in-forge interactive surface |
| `cinematic` | Minimal UI | Emit/charge animation |

### PlayStage morph

Left + Right + Top glass **lerp into one mega-glass** (flat slab first; curved later) in front of SF for a larger play/hit area without leaving the room.

```
heroWelcome → hubSplit ⇄ authMerged
                 ↓
         labsBrowse / gameLobby / avatarStudio
                 ↓
             playStage → hubSplit
```

---

## 5. Live app → mode crosswalk (seed)

| Live surface | R3F mode | Modules |
|---|---|---|
| Marketing / first paint | `heroWelcome` | TopBanner welcome copy |
| Sign-in / signup | `authMerged` | CenterWide forms |
| Home / daily mission | `hubSplit` or hero + chip | Top + mission/continue |
| Labs map | `labsBrowse` | SideList + SideDetail |
| Arcade / game menus | `gameLobby` → exit or `playStage` | Lobby then game runtime |
| Sparky tutor | `avatarStudio` / `playStage` | Chat + companion |
| Parent / billing | `EscapeFlat` | Flat UI |
| Settings | `settingsDock` | Dock or flat |

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
