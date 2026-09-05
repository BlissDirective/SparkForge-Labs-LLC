# Forge Lab world plates

Hotspot video shell + Option A. Stills until `WORLD_MEDIA.loopVideo` is wired.

Empty cyan panes are **guides only**. HTML `HoloPanel` owns edge + frost + UI at ±3° yaw.

| File | Role |
|---|---|
| `00-locked-hub-dark-sf.png` | Locked regen — brighter orange floor/cowling, dark metal. Also copied to idle + docked. |
| `00-sf-monogram-closeup.png` | SF core reference (1024×1024) |
| `01-idle.png` | Same locked plate (empty guides stay) |
| `02-charge.png` / `03-emit.png` | Same locked still so the portal crossfade does not swap rooms |
| `04-docked.png` | Same locked plate — HTML holograms appear on dock |

To add a looping encode later, drop a `.webm` here and set `WORLD_MEDIA.loopVideo` in `src/lib/forge-lab/hotspotMap.ts`.
