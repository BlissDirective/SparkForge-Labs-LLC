# Forge Lab world plates

Locked indoor forge-lab stills for the hotspot hub (`/dev/forge-lab`).

| File | Role |
|---|---|
| `00-locked-hub-dark-sf.png` | Default idle world plate (1536×1024) |
| `00-sf-monogram-closeup.png` | SF core reference (1024×1024) |
| `01-idle.png` … `03-emit.png` | Portal keyframes (generated stand-ins) |
| `04-docked.png` | Owner-locked hybrid dock plate (`04-docked-hybrid-exact-slots`, 1536×1024). Empty L/R hologram frames must match `hotspotMap.ts` ±5° yaw. |

To add a looping encode later, drop a `.webm` here and set `WORLD_MEDIA.loopVideo` in `src/lib/forge-lab/hotspotMap.ts`.
