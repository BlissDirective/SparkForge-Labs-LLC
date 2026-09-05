# Forge Lab hotspot hub

**Date:** 2026-09-05  
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
| **z2** | Real React UI: `ForgeCore` (live SF), `TopMonitor` HUD fitted 1:1 in the bezel glass (yaw 0), `HoloPanel`s that emit from SF and float in empty air. |

`?calibrate=1` on `/dev/forge-lab` outlines the hit map. Outlines use the **same** `%` box + yaw as the HTML overlays (`dockSlotStyle`) — HTML bounds after yaw.

---

## Option A (owner-locked)

World plates have **no side hologram frames**. Left/right of the SF core is empty air (dark lab walls only). HTML `HoloPanel` owns the **entire** hologram — cyan edge, frosted fill, glow, and UI — as **one** transformed element.

Do **not** paint yawed trapezoids into the art and overlay a second HTML box. That split (hybrid dock) is what caused the misalignment: plate frames yawed, HTML sat flat.

Docked plate: `public/forge-lab/04-docked.png` (Option A empty-air). Emit plate is also frameless so the charge→emit crossfade does not flash painted frames.

### Frozen map — 1536×1024 plate

Locked plates are **1536×1024 (3:2)**. The stage is a letterboxed box with `aspect-ratio: 1536 / 1024` and `object-fit: contain`. Every hotspot is a **percent of that stage**, not of the viewport.

`HOLO_YAW_DEG = 4`. Docked HoloPanels use `perspective(1200px) rotateY(yawdeg)` on the **same** element that draws the hologram chrome. Transform-origin faces SF: left panel `right center`, right panel `left center`.

| Region | Box (% of plate) | Yaw |
|---|---|---|
| `TOP_MONITOR_GLASS` | `27.4, 2.6, 45.2 × 17.8` | `0` — HUD stays flat in the bezel glass |
| `FORGE_CORE` | circle `cx 50, cy 49.2, r 9.4` | — |
| `PEDESTAL` | `36.5, 70.5, 27 × 18.5` | `0` |
| `LEFT_HOLO_SLOT` | `7.2, 30.5, 20.8 × 42` | `−4` |
| `RIGHT_HOLO_SLOT` | `72, 30.5, 20.8 × 42` | `+4` |

### Blend tokens (HoloPanel CSS — HOLO_BLEND)

HTML draws these; the plate does not.

| Token | Value |
|---|---|
| edge | `rgba(77, 233, 255, 0.55)` |
| fill | `rgba(8, 18, 36, 0.32)` |
| fillActive | `rgba(10, 24, 48, 0.42)` |
| blur | `12px` |
| glow | `0 0 24px rgba(77, 233, 255, 0.25)` |

CSS variables on `.fl-hub`: `--fl-holo-edge`, `--fl-holo-fill`, `--fl-holo-fill-active`, `--fl-holo-blur`, `--fl-holo-glow`.

The hub root is `data-surface="dark"` and HoloPanels are `<section>`s so the a11y `.light aside` remap cannot paint them as white cards.

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
- Hybrid dock (painted yawed frames + flat HTML overlays).
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

- Idle/charge plates are generated stand-ins. Docked/emit are Option A empty-air (no side frames).
- Still plates + CSS crossfade only — no Grok Video encode.
- Game bay and avatar kit are labeled stubs (`data-slot="game-shell"` / `data-slot="avatar-creator"`).
- Authenticated `/forge-lab` needs the flag on at build time (`NEXT_PUBLIC_*`).
