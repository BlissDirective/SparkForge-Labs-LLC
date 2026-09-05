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
| **z2** | Real React UI: `ForgeCore` (live SF), always-on `TopMonitor` (thin cyan hologram, 60% plate width), `HoloPanel`s that emit from SF. |

`?calibrate=1` on `/dev/forge-lab` outlines the hit map. Outlines use the **same** `%` box + yaw as the HTML overlays (`dockSlotStyle`) — HTML bounds after yaw.

---

## Option A (owner-locked)

Idle and docked share one plate. Empty cyan panes on the plate are **guides only** (no fake UI). HTML owns the **entire** hologram — cyan edge, frosted fill, glow, and content — as **one** transformed element.

- Side `HoloPanel`s: `perspective(1200px) rotateY(±3deg)`
- `TopMonitor`: same thin-edge + glass-fill family, yaw `0`, **always illuminated**

Do **not** paint a hanging industrial metal bezel or thick yawed slabs into the art. Prefer empty-air / faint thin guides. HTML `TopMonitor` at **60%** width is source of truth even if the plate guide is slightly narrower.

Locked hero (blue→purple structural strips, no orange, faint top/side guides) is used for `00-locked-hub-dark-sf.png`, `01-idle.png`, `02-charge.png`, `03-emit.png`, and `04-docked.png`.

### Frozen map — 1536×1024 plate

`HOLO_YAW_DEG = 3` (degrees; not percent). Transform-origin faces SF: left `right center`, right `left center`.

| Region | Box (% of plate) | Yaw |
|---|---|---|
| `TOP_MONITOR_GLASS` | `20, 2.8, 60 × 14.5` | `0` |
| `FORGE_CORE` | circle `cx 50, cy 49.2, r 9.4` | — |
| `PEDESTAL` | `36.5, 70.5, 27 × 18.5` | `0` |
| `LEFT_HOLO_SLOT` | `7.2, 30.5, 20.8 × 42` | `−3` |
| `RIGHT_HOLO_SLOT` | `72, 30.5, 20.8 × 42` | `+3` |

Nudge those numbers only after `?calibrate=1` proves the empty panes miss the HTML. Report any % change.

### TopMonitor — always-on hologram

No dark idle. First load (idle/charge) shows welcome copy from `FORGE_LAB_WELCOME` in `src/lib/forge-lab/catalog.ts`:

- Title: `Welcome to SparkForge Labs`
- Subtitle: `Where kids learn AI by building, playing, and exploring with Sparky.`
- Rotating secondary: `Meet Sparky — your AI tutor and friend. New games just dropped in Lab 11.`

Emit/docked swaps the same glass to lab name + XP/streak gauges. Retract returns welcome.

### Plate lighting

Structural wall/floor/ceiling energy strips are a **blue → purple** gradient: child-friendlier, slightly brighter ambient. **No orange strips.** Strips stay **secondary** — dimmer than cyan hologram edges/fill so left/right/top menus stay readable.

### Blend tokens (HoloPanel + TopMonitor CSS — HOLO_BLEND)

HTML draws these on the same transformed element as the content.

| Token | Value |
|---|---|
| edge | `rgba(77, 233, 255, 0.55)` |
| fill | `rgba(8, 18, 36, 0.32)` |
| fillActive | `rgba(10, 24, 48, 0.42)` |
| blur | `12px` |
| glow | `0 0 24px rgba(77, 233, 255, 0.25)` |

---

## SF portal

State machine: `idle → charge → emit → docked` (`src/lib/forge-lab/portalMachine.ts`).

- Click SF / pedestal → charge (420ms) → emit (560ms) → dock panels left/right. Top hologram stays lit the whole time.
- `prefers-reduced-motion` → skip straight to **docked**.
- Escape or Retract folds side panels back into SF; TopMonitor returns to welcome.

---

## What we avoided

- Panoramic cockpit hull / OrbitControls / persistent `CockpitCanvas`
- Mission Control space-station console
- Clickable video pixels without DOM twins
- Hybrid dock (thick painted frames + flat HTML)
- Industrial hanging metal TopMonitor bezel
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
- Game bay and avatar kit are stubs.
- Authenticated `/forge-lab` needs the flag on at build time.
