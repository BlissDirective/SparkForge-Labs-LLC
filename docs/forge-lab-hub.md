# Forge Lab hotspot hub

**Date:** 2026-09-05  
**Flag:** `NEXT_PUBLIC_FORGE_LAB_HUB` (`FEATURE_FLAGS.FORGE_LAB_HUB`)  
**Routes:** `/forge-lab` (authenticated, flag-on) · `/dev/forge-lab` (public preview)

Indoor **forge laboratory** mock. **Hotspot video shell + Option A.** A looping-ready world plate plus invisible DOM/SVG hotspot twins open real HTML hologram panels. The center **SF** monogram is the portal/emitter.

This is **not** Mission Control (PR #163) and **not** the panoramic cockpit.

---

## Layers (hotspot video shell)

Video/still pixels are never the click target.

| Layer | What |
|---|---|
| **z0** | World plate. Stills now (`public/forge-lab/00-locked-hub-dark-sf.png` + idle/charge/emit/docked). `WORLD_MEDIA.loopVideo` stays `null` until a later encode. |
| **z1** | Invisible DOM buttons aligned to the plate (`HotspotMap`). SF core, pedestal, top hologram, left/right docks. |
| **z2** | Real React UI: `EmitterBeams` (SVG core→panel), `ForgeCore`, always-on `TopMonitor`, `HoloPanel`s. |

`?calibrate=1` on `/dev/forge-lab` outlines the hit map. `?layout=authMerged` stubs the sign-on merge.

---

## Option A (owner-locked)

Idle and docked share one plate. Empty cyan panes + painted emitter lines on the plate are **guides only**. HTML owns the **entire** hologram and the live interconnects.

- Side `HoloPanel`s: `perspective(1200px) rotateY(±2deg)`
- `TopMonitor`: same thin-edge + denser glass-fill family, yaw `0`, **always illuminated**, width **60%**
- `EmitterBeams`: SVG from `FORGE_CORE` to each *live* panel (core-facing edge of the current slot rect). Beams update when a layout morphs.

Prefer clear air — HTML blur is 3px so the plate does not bloom through the glass.

### Frozen map — 1536×1024 plate

`HOLO_YAW_DEG = 2` (degrees; not percent). Transform-origin faces SF: left `right center`, right `left center`.

| Region | Box (% of plate) | Yaw |
|---|---|---|
| `TOP_MONITOR_GLASS` | `20, 2.8, 60 × 14.5` | `0` |
| `FORGE_CORE` | circle `cx 50, cy 49.2, r 9.4` | — |
| `PEDESTAL` | `36.5, 70.5, 27 × 18.5` | `0` |
| `LEFT_HOLO_SLOT` | `7.2, 30.5, 20.8 × 42` | `−2` |
| `RIGHT_HOLO_SLOT` | `72, 30.5, 20.8 × 42` | `+2` |

Nudge those numbers only after `?calibrate=1` proves the empty panes miss the HTML. Report any % change.

### TopMonitor — always-on hologram

No dark idle. First load (idle/charge) shows welcome copy from `FORGE_LAB_WELCOME` in `src/lib/forge-lab/catalog.ts`.

### Plate lighting

Brighter metal. Structural strips are **blue → purple**, secondary to cyan hologram edges and emitter beams. **No orange strips.**

### Blend tokens (HOLO_BLEND)

| Token | Value |
|---|---|
| edge | `rgba(77, 233, 255, 0.78)` |
| fill | `rgba(6, 14, 28, 0.48)` |
| fillActive | `rgba(6, 14, 28, 0.58)` |
| blur | `3px` (clear air) |
| glow | `0 0 18px rgba(77, 233, 255, 0.28)` |

---

## ForgeLayout scaffold

`src/lib/forge-lab/layouts.ts` — named layouts with slot rects. Stub morph only; do not rebuild the app.

| Layout | Slots |
|---|---|
| `hubSplit` | top + left + right (default hub) |
| `authMerged` | top + one wide `center` (L+R lerp into sign-on HTML 1:1) |

Preview: `/dev/forge-lab?layout=authMerged` or the **Auth merge** chip. Beams follow the live rects as wings collapse.

---

## SF portal

State machine: `idle → charge → emit → docked` (`src/lib/forge-lab/portalMachine.ts`).

- Click SF / pedestal → charge → emit → dock. Top hologram stays lit. Side beams light with the wings.
- `prefers-reduced-motion` → skip straight to **docked**.
- Escape or Retract folds side panels; TopMonitor returns to welcome.

---

## What we avoided

- Panoramic cockpit / Mission Control
- Clickable video pixels without DOM twins
- Hybrid dock / hanging metal TopMonitor
- Rebuilding the real auth app onto `authMerged`
- Rewriting 42 games

---

## How to toggle

```bash
NEXT_PUBLIC_FORGE_LAB_HUB=true
```

Flag **defaults to `false`**. `/dev/forge-lab` does not require the flag.

---

## Known limitations

- Stills + CSS crossfade only — `WORLD_MEDIA.loopVideo` is the hook for a later encode.
- Game bay, avatar kit, and auth-merged sign-on are stubs.
- Authenticated `/forge-lab` needs the flag on at build time.

## World art lock (do not regenerate)

Canonical plate: `public/forge-lab/world/LOCKED_HERO.png`  
SHA256: `db75ecf0055a8168a0ae71be5f1f28921c1ef9c29511ce44c380348121442555`

Display still: `public/forge-lab/world/LOCKED_HERO_no_haze_filter.png`  
SHA256: `582366f956c37390fb70c8d954f247fc4f1e3932c47996202c30f43d27be0cd9`

**Agents must never regenerate world art.** Copy byte-for-byte only; fail if SHA mismatches. See `public/forge-lab/world/LOCKED.md`.
