# SparkForge Brand Update + Hero Animation — Action Plan

**Document version:** 1.0 (commit 1 of 4)
**Date:** April 28, 2026
**Branch:** `claude/sparkforge-branding-3d-I4Za1`
**Last commit on branch:** `c4939dc` (Phase 2.6 — env-var override)
**Reference image:** `public/branding/IMG_4607.png`
**Source-of-truth config:** `src/lib/branding/sf-material.config.ts`

---

## 0. How To Use This Document

This is a complete handoff: a fresh Claude Code session (or a fresh agent) should be able to pick up Phase 3 and execute through Phase 7 using only this file plus the repository as it currently stands.

Order of operations for a fresh session:

1. Read this document end-to-end.
2. `git checkout claude/sparkforge-branding-3d-I4Za1` → confirm `git log -1` shows `c4939dc`.
3. Read these three files in full to load the established conventions:
   - `src/lib/branding/sf-material.config.ts` (every brand value)
   - `src/components/3d/branding/BrandingMaterial.tsx` (TSL material pattern)
   - `src/components/3d/branding/SfMark3D.tsx` (SVG → ExtrudeGeometry pattern)
4. Pick up at Phase 3 (next session). Phases are sequential — do not skip.
5. After every sub-phase: `npm run build` → fix any errors → `git commit` → `git push`.
6. After every full phase: update `PROGRESS.md` and ask user for visual sign-off.

This document is split into four commits so individual writes stay small and crash-safe. If a section says "see commit 2/3/4" it means that section will arrive in a later append.

---

## 1. State Of Play

### Branch + commits

| | |
|---|---|
| **Branch** | `claude/sparkforge-branding-3d-I4Za1` |
| **Phase 1 commit** | `b3c6323` — BrandingMaterial WebGPU+TSL primary, MP4-poster fallback |
| **Phase 2 commit** | `33bbab1` — SF mark geometry + 3D extrusion |
| **Phase 2.6 commit** | `c4939dc` — `NEXT_PUBLIC_ALLOW_DEV_ROUTES` Vercel-preview override |
| **Working tree** | clean |
| **Push status** | all commits pushed to origin |
| **Build status** | `npm run build` passes, EXIT=0 |
| **Dev route** | `/dev/branding` returns 200 OK locally |

### Pre-existing repo issues auto-fixed during Phase 1 (CLAUDE.md §3.1)

These were already broken on the branch before any of this work began:

- `src/app/(dashboard)/layout.tsx` — missing `useCockpitBroadcast` import (added).
- `src/stores/cockpitStore.ts` — duplicate `_*Timeout` properties (deduped).

Both fixes are part of commit `b3c6323`.

---

## 2. Locked Decisions (do not revisit without explicit user override)

| ID | Decision | Pick |
|---|---|---|
| **D1** | Wordmark geometry source | **A** — hand-trace SF + custom-design `parkorge` glyphs in same idiom |
| **D2** | Render pipeline for offline 4K | **A** — Headless Puppeteer + `sharp` |
| **D3** | Material strategy | **B** — WebGPU+TSL primary |
| **D4** | Hero animation scope | **C** — full re-choreograph of all 8 phases |
| **D5** | Phase order | 1 → 2 → 3 → 4 → 5a → 5b → 5c → 6 → 7 |
| **N1** | Hero approach | **a** — Live R3F+TSL hero with volumetric god-rays + Voronoi shard upgrades |
| **N2** | WebGPU fallback policy | **c** — WebGPU+TSL primary, thin MP4-poster fallback for non-WebGPU. **No shader fork.** |
| **N3** | Optional deps for re-choreograph | **a + b + c** — `three-bvh-csg` + Theatre.js (dev) + lensflare (custom TSL per N3=c clarification) |
| **N3 lensflare** | Specific package | **c — custom TSL anamorphic shader.** `@react-three/lensflare-effect` does not exist on npm. |
| **N4** | Hero timing | 19 s with 4× fast-forward |
| **N5** | Halt threshold | **b** — SSIM ≥ 0.96 vs IMG_4607 (Mythos rule, baked into `sf-material.config.ts` HALT) |
| **E1** | Anisotropic prismatic dispersion in TSL | **YES** — implemented Phase 1 |
| **E2** | Procedural palette-locked HDRI | **YES** — implemented Phase 1 via drei `<Lightformer>` rig |
| **E3** | WebGPU compute Voronoi pre-fracture | **YES** — to be wired in Phase 5b |
| **Mobile review** | Vercel preview override | env-var `NEXT_PUBLIC_ALLOW_DEV_ROUTES=true` (set on preview env only) |

### Tech Quality Mandate (CLAUDE.md v6.6)

The user has elevated visual quality to a first-order constraint. Workload, build time, generation cost, and bundle size are *informational only* — they cannot be used as reasons to choose a lower-fidelity tool. Only three valid reasons to refuse the highest-quality option:

1. Functional conflict with another locked stack component.
2. Tool not in stable release.
3. Explicit user downgrade in chat.

This mandate is the reason WebGPU+TSL is the only material path (no WebGL2 fork) and why `three-bvh-csg` + Theatre.js were added without a budget conversation.

---

## 3. Brand DNA Reference

These values are eye-extracted from `public/branding/IMG_4607.png` and live in `src/lib/branding/sf-material.config.ts`. **Every branding-surface render in the app must source from that file** — never duplicate values inline.

### Palette (locked)

| Name | Hex | Role |
|---|---|---|
| `voidNavy` | `#02050d` | Background void |
| `voidNavyLift` | `#070a14` | Env-map base, fill light |
| `rimCyan` | `#7fe8ff` | Upper-right rim light, cyan dispersion peak |
| `cyanKick` | `#bff5ff` | Bevel kick highlight |
| `keyAmber` | `#ffaa55` | Lower-left key light, amber dispersion peak |
| `amberCore` | `#ffd9a8` | Lens-flare hot core |
| `dispersionMag` | `#ff5fc8` | Magenta dispersion mid-band |
| `dispersionPink` | `#ff9ad6` | Hot pink dispersion edge |
| `hotWhite` | `#ffffff` | Hottest highlight pinpoints |

### Material physics (locked)

| Param | Value | Notes |
|---|---|---|
| IOR | 1.55 | Crown-glass region |
| Transmission | 0.97 | Near-clear glass |
| Roughness | 0.04 | Glossy, slight haze from dichroic film |
| Metalness | 0.0 | Pure dielectric |
| Thickness | 0.85 | Volumetric absorption depth |
| Anisotropy | 0.65 | Drives E1 asymmetric dispersion |
| Anisotropy rotation | 0.42 rad | CCW from horizontal |
| Clearcoat | 1.0 | Dichroic film substrate |
| Clearcoat roughness | 0.08 | |
| Attenuation color | `#9fcfff` | Cool tint in thin sections |
| Env intensity | 2.4 | Aggressive HDRI bounce |

### Dispersion (E1 — asymmetric)

| Param | Value |
|---|---|
| iorR / iorG / iorB | -0.038 / 0.000 / +0.052 |
| Strength | 0.072 |
| Rotation | 0.31 rad (asymmetry) |
| Fresnel boost | 1.85 |
| Fresnel power | 2.4 |

### Dichroic coating

| Param | Value |
|---|---|
| Opacity | 0.55 |
| Bands | rimCyan → dispersionMag → keyAmber |
| Frequency | 1.35 cycles/unit |
| Angle power | 1.6 |
| Warm bias on +X | 0.18 |

### Geometry (extrusion)

| Param | Value (fraction of cap-height) |
|---|---|
| Extrude depth | 0.32 |
| Bevel size | 0.072 |
| Bevel thickness | 0.058 |
| Bevel segments | 12 |
| Curve segments | 24 |

### Lighting rig

| Light | Position | Color | Intensity |
|---|---|---|---|
| Key (warm) | (-3.4, -2.1, 2.6) | keyAmber | 6.8 |
| Rim (cool) | (3.6, 2.4, 1.8) | rimCyan | 4.4 |
| Fill | (0, -0.5, 4.0) | voidNavyLift | 0.6 |

### Halt rule

| | |
|---|---|
| SSIM threshold | **0.96** |
| Max iterations | 12 |
| Reference image | `/branding/IMG_4607.png` |

---

## 4. Completed Phases — Summary

### Phase 1 (commit `b3c6323`) — BrandingMaterial

| File | Purpose |
|---|---|
| `src/lib/branding/sf-material.config.ts` | Single source of truth — eye-extracted IMG_4607 params |
| `src/components/3d/branding/BrandingMaterial.tsx` | TSL `MeshPhysicalNodeMaterial` + custom dichroic emissive `Fn` node. Exports `createBrandingMaterial()` + `<BrandingMesh>`. |
| `src/components/3d/branding/BrandingShowcase.tsx` | Canvas wrapper with WebGPU capability gate, async `WebGPURenderer` init via R3F's async `gl` factory, drei `<Environment frames={1}>` + `<Lightformer>` rig (procedural HDRI / E2), three-light rig, MP4-poster fallback. |
| `src/app/dev/branding/page.tsx` + `client.tsx` | `/dev/branding` visual checkpoint route. 404 in production unless `NEXT_PUBLIC_ALLOW_DEV_ROUTES=true`. |
| `CLAUDE.md` | New "Tech Quality Mandate" v6.6 section; fallback-chain language removed; HS-9 checklist updated. |

**New deps:** `three-bvh-csg@0.0.18`, `@theatre/core@0.7.2`, `@theatre/studio@0.7.2` (`-D`).

### Phase 2 (commit `33bbab1`) — SF mark geometry

| File | Purpose |
|---|---|
| `public/branding/sf-geometry.svg` | Hand-traced SF mark. Two paths (`sf-mark-S`, `sf-mark-F`); clockwise outline winding; viewBox 1400×800. Editable in Illustrator/Figma — keep path IDs. |
| `src/components/3d/branding/SfMark3D.tsx` | `useLoader(SVGLoader)` → `SVGLoader.createShapes` → `ExtrudeGeometry` per shape. Mirrors y (SVG y-down → three y-up), recenters to box center. Italic forward-lean (3.4°) via group rotation, **not** skew. |
| `src/app/dev/branding/client.tsx` | Default subject is now "SF mark"; live-tuning sliders for `dispersionMultiplier`, `dichroicIntensity`, `italicLean`. |

### Phase 2.6 (commit `c4939dc`) — Vercel-preview env override

| File | Change |
|---|---|
| `src/middleware.ts` | `classify()` honours `NEXT_PUBLIC_ALLOW_DEV_ROUTES=true` — `/dev/*` reachable on preview if set. |
| `src/app/dev/branding/page.tsx` | Mirrors the same check (defence-in-depth). |
| `.env.example` | Documents the new var (commented out). |

To enable mobile review on Vercel preview: in Vercel dashboard → Project Settings → Environment Variables → add `NEXT_PUBLIC_ALLOW_DEV_ROUTES=true` scoped to **Preview** only (NOT Production).

---

## 5. What's Next

The remaining sections of this document — Phase 3 through Phase 7 detailed sub-task guides, reusable patterns, Mythos halt rule, and the alternative video-hero path — arrive in three more append commits to this same file:

- **Commit 2** → Phase 3 (SparkForge wordmark) + Phase 4 (offline render pipeline)
- **Commit 3** → Phase 5a + 5b prep + 5b + 5c + Phase 6
- **Commit 4** → Phase 7 + reusable patterns + Mythos convergence + alternative video-hero path

If you're reading this in a fresh session and the file ends here, check `git log` for commits with subject starting `BRAND_HERO_ACTION_PLAN: append` — those are the continuation commits.

---

*End of commit 1 of 4. Continued in subsequent appends.*
