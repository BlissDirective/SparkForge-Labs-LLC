# Forge Lab world plates

Locked indoor forge-lab stills for the hotspot hub (`/dev/forge-lab`).

**Option A:** plates must not paint side hologram frames. HTML `HoloPanel` owns the cyan edge, frost, and UI at ±4° yaw.

| File | Role |
|---|---|
| `00-locked-hub-dark-sf.png` | Default idle world plate (1536×1024), empty air L/R |
| `00-sf-monogram-closeup.png` | SF core reference (1024×1024) |
| `01-idle.png` … `02-charge.png` | Portal keyframes (empty air L/R) |
| `03-emit.png` | Emit keyframe — frameless (no painted L/R holograms) |
| `04-docked.png` | Option A empty-air dock plate (1536×1024). SF core + hanging bezel only. |

To add a looping encode later, drop a `.webm` here and set `WORLD_MEDIA.loopVideo` in `src/lib/forge-lab/hotspotMap.ts`.
