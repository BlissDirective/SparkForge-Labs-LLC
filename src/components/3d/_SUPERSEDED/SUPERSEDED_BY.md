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

---

## Superseded Files: LoginPortal3D.tsx + LoginParticles3D.tsx

| Field | Value |
|-------|-------|
| **Superseded Files** | `LoginPortal3D.tsx`, `LoginParticles3D.tsx` |
| **Replacement** | Static cosmic-gradient backdrop in `src/app/(auth)/layout.tsx` |
| **Date Archived** | May 6, 2026 |
| **Reason** | UX audit — 3D portal/blob/ring + particle field did not match design intent at runtime and distracted from the auth form. Owner approved full removal in chat. |
| **Decision Reference** | Supersedes CLAUDE.md HS-10 "3D crystal portal renders behind login card" — replace with static gradient. |

### Why They Were Replaced

- **Visual mismatch:** the rotating `MeshDistortMaterial` orb + concentric `Ring` meshes + 120-point sparkle field read as a generic "ring/blob" instead of the intended portal motif.
- **Form-focus regression:** the animated backdrop pulled attention away from the centered login card, contributing to the "text condensed to center / unclear panel" complaint.
- **No functional value:** the backdrop is purely decorative — no user-facing feature depends on it. A static radial gradient gives the same dark/cosmic feel without the fidelity gap.

### Replacement

- `src/app/(auth)/layout.tsx` now renders a single `radial-gradient` accent (purple top, blue bottom, ~18% / ~10% peak alpha) under a `bg-cosmic-dark` base. No WebGL, no R3F Canvas, no `Canvas3DErrorBoundary` needed in this layout.
- LoginCard widened to `max-w-lg` and the wave 👋 icon was removed; the heading + form get more horizontal room.
- Container padding bumped to `pt-24 pb-16` so the fixed brand chip and footer never collide with the card.

### Import Redirections

The only consumer was `src/app/(auth)/layout.tsx`, which has been updated to drop both imports. `src/components/3d/panels/LoginPanel3D.tsx` references `LoginPortal3D` only in a code comment (no import) — left as-is.
