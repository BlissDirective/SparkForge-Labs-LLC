# Forge Lab world plates

Hotspot video shell + Option A. Stills until `WORLD_MEDIA.loopVideo` is wired.

Empty cyan panes are **guides only**. HTML owns holograms:

- Side `HoloPanel`s — thin cyan edge + glass fill at ±3° yaw
- `TopMonitor` — same family, yaw 0, **60% plate width**, always on

Prefer empty-air / faint thin guides. HTML TopMonitor at 60% is source of truth if the painted guide is slightly narrower.

Structural energy strips on this lock are **blue → purple**, secondary to cyan hologram edges. No orange strips.

| File | Role |
|---|---|
| `00-locked-hub-dark-sf.png` | Locked hero — thin top hologram guide, blue/purple ambient. Also copied to idle + docked. |
| `00-sf-monogram-closeup.png` | SF core reference (1024×1024) |
| `01-idle.png` | Same locked plate (empty guides stay) |
| `02-charge.png` / `03-emit.png` | Same locked still so the portal crossfade does not swap rooms |
| `04-docked.png` | Same locked plate — HTML holograms appear on dock |

To add a looping encode later, drop a `.webm` here and set `WORLD_MEDIA.loopVideo` in `src/lib/forge-lab/hotspotMap.ts`.
