# Forge Lab world plates

Hotspot video shell + Option A. Stills until `WORLD_MEDIA.loopVideo` is wired.

Painted cyan panes and emitter lines are **guides only**. HTML owns holograms + live beams:

- Side `HoloPanel`s — denser glass at ±2° yaw
- `TopMonitor` — same family, yaw 0, **60% plate width**, always on
- `EmitterBeams` — SVG from the forge core to each live panel; updates on layout morph

Prefer clear air. HTML blur is 3px. Structural strips are **blue → purple**. No orange.

| File | Role |
|---|---|
| `00-locked-hub-dark-sf.png` | Locked hero — brighter metal, blue/purple strips, painted emitter guides. Copied to idle + docked. |
| `00-sf-monogram-closeup.png` | SF core reference (1024×1024) |
| `01-idle.png` | Same locked plate |
| `02-charge.png` / `03-emit.png` | Same locked still so the portal crossfade does not swap rooms |
| `04-docked.png` | Same locked plate — HTML holograms + beams overlay |

To add a looping encode later, drop a `.webm` here and set `WORLD_MEDIA.loopVideo` in `src/lib/forge-lab/hotspotMap.ts`.
