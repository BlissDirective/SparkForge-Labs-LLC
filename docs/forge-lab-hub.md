# Forge Lab hotspot hub

**Date:** 2026-09-04  
**Flag:** `NEXT_PUBLIC_FORGE_LAB_HUB` (`FEATURE_FLAGS.FORGE_LAB_HUB`)  
**Routes:** `/forge-lab` (authenticated, flag-on) · `/dev/forge-lab` (public preview)

Indoor **forge laboratory** mock. A looping-ready world plate plus invisible DOM/SVG hotspot twins open real HTML hologram panels. The center **SF** monogram is the portal/emitter.

This is **not** Mission Control (PR #163) and **not** the panoramic cockpit.

---

## Layers (hotspot video shell)

Video/still pixels are never the click target.

| Layer | What |
|---|---|
| **z0** | World plate. Still images now (`public/forge-lab/00-locked-hub-dark-sf.png` + idle/charge/emit/docked keyframes). `WORLD_MEDIA.loopVideo` is the hook for a later encode. |
| **z1** | Invisible DOM buttons aligned to the plate (`HotspotMap`). SF core, pedestal, top-monitor glass, left/right docks. |
| **z2** | Real React UI: `ForgeCore` (live SF), `TopMonitor` HUD fitted 1:1 in the bezel glass, `HoloPanel`s that emit from SF. |

`?calibrate=1` on `/dev/forge-lab` outlines the hit map.

---

## Coordinate approach

Locked plates are **1536×1024 (3:2)**. The stage is a letterboxed box with `aspect-ratio: 1536 / 1024` and `object-fit: contain`. Every hotspot is a **percent of that stage**, not of the viewport.

Constants live in `src/lib/forge-lab/hotspotMap.ts`:

| Region | Box (% of plate) |
|---|---|
| `TOP_MONITOR_GLASS` | `27.4, 2.6, 45.2 × 17.8` — HUD fits this inner glass |
| `FORGE_CORE` | circle `cx 50, cy 49.2, r 9.4` |
| `PEDESTAL` | `36.5, 70.5, 27 × 18.5` |
| `LEFT_HOLO_SLOT` | `7.2, 30.5, 20.8 × 42` |
| `RIGHT_HOLO_SLOT` | `72, 30.5, 20.8 × 42` |

Nudge those numbers after a new plate; do not click the pixels.

---

## SF portal

State machine: `idle → charge → emit → docked` (`src/lib/forge-lab/portalMachine.ts`).

- Click SF / pedestal (or Enter on the hotspot) → charge (420ms) → emit (560ms) → dock panels left/right and light the top bay.
- `prefers-reduced-motion` or Settings reduce-motion → skip straight to **docked**.
- Escape or Retract folds panels back into SF.
- Docked panels: lab **listbox** (left), game-bay stub + avatar stub (right). Games are not rewritten.

---

## What we avoided

- Panoramic ~38–50M-triangle cockpit hull, OrbitControls, persistent `CockpitCanvas`.
- Clickable video/image pixels without DOM twins.
- Mission Control’s space-station console / ellipse of lab pods / optional WebGL backdrop.
- Rewriting 42 games or the marketing site.
- A SaaS header in the top glass — the bezel gets lab name, XP/streak gauges, and a Sparky one-liner.

---

## How to toggle

```bash
NEXT_PUBLIC_FORGE_LAB_HUB=true
```

- Flag **defaults to `false`** so `/home` stays the working dashboard.
- `/dev/forge-lab` is a public preview (sample child “Nova”) and does **not** require the flag.

---

## Known limitations

- World plates are generated stand-ins matching the locked indoor-lab brief (original attachment files were not on disk in this environment). Swap files in `public/forge-lab/` 1:1 if the source plates return.
- Still plates + CSS crossfade only — no Grok Video encode.
- Game bay and avatar kit are labeled stubs (`data-slot="game-shell"` / `data-slot="avatar-creator"`).
- Bezel/core percents are first-pass calibration against 1536×1024 plates; use `?calibrate=1` to retune.
- Authenticated `/forge-lab` needs the flag on at build time (`NEXT_PUBLIC_*`).
