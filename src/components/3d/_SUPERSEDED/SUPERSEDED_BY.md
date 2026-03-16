# SUPERSEDED FILES — src/components/3d/_SUPERSEDED/

> **DO NOT USE** — The files in this directory contain known issues and have been fully replaced by newer implementations. They are preserved for git history only.

---

## Superseded File: CrystalShatter.tsx

| Field | Value |
|-------|-------|
| **Superseded File** | `CrystalShatter.tsx` |
| **Replacement File** | `src/components/3d/HeroAnimation.tsx` |
| **Date Archived** | March 16, 2026 |
| **Reason** | Fully replaced by 8-phase Hero Animation v2.0 cinematic sequence |
| **Decision Reference** | CLAUDE.md Section 3 (Decision 8.1), SparkForge_Hero_Page_Animation_v2.0.md |

### Why CrystalShatter Was Replaced

- **Limited scope:** 5-phase, ~7s animation with basic instanced shards
- **No WebGPU support:** Used only WebGL-based instanced meshes
- **No TSL compute:** Particle system was CPU-bound, limited to ~10K particles
- **No spatial audio:** No Tone.js integration
- **No fast-forward/skip:** No OD-2/OD-3 support (click-to-skip only)
- **No GPU tier detection:** No device-adaptive particle budgets

### Replacement: HeroAnimation.tsx

- **8-phase, ~19s cinematic sequence** with full GSAP timeline orchestration
- **WebGPU TSL compute kernel** for 1B+ lifetime particle throughput
- **Tone.js spatial audio** synchronized to animation phases
- **Fast-forward (4x)** via click/Enter/Space (OD-2)
- **Skip intro toggle** in Settings (OD-3)
- **GPU tier detection** with multi-buffer stripe probing (OD-4)
- **Voronoi fracture** shard system (OD-1)

### Active Build Documents

| Document | Purpose |
|----------|---------|
| `src/components/3d/HeroAnimation.tsx` | Full 8-phase hero animation (replacement) |
| `src/components/3d/CrystalHero.tsx` | **RETAINED** — Separate component (Decision 8.1), NOT superseded |
| `src/hooks/useHeroAnimation.ts` | Hook for hero animation lifecycle |

### Import Redirections (17 references)

All 17 references to `CrystalShatter` in stage documents have been redirected to `HeroAnimation`. See PROGRESS.md Phase F3 entry for details.
