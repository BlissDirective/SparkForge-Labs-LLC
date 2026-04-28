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

## 6. Phase 3 — SparkForge Wordmark (DETAILED)

**Goal:** Render the full word "SparkForge" in 3D using bespoke letterforms designed in the same idiom as the Phase-2 SF mark, materialised with `BrandingMaterial`. The S and F glyphs are reused verbatim from `sf-geometry.svg`; the eight other glyphs (`p`, `a`, `r`, `k`, `o`, `r`, `g`, `e`) are designed fresh.

**Halt gate:** SSIM ≥ 0.96 vs IMG_4607's letter-styling. If pixel-accuracy is required, replace the SVG paths with Illustrator/Figma traces — keep the path IDs intact.

### Phase 3.1 — Author `public/branding/sparkforge-geometry.svg`

**File to create:** `public/branding/sparkforge-geometry.svg`

**Design constants (must match SF mark):**

| Constant | Value | Source |
|---|---|---|
| viewBox | `0 0 6400 800` | Wide single-line word |
| Cap-height | 650u (y range 70..720) | Same as `sf-geometry.svg` |
| Baseline | y = 720 | Same as `sf-geometry.svg` |
| Stroke thickness | 130u | Same as SF mark bars |
| Letter widths | 480-560u (varies per letter) | See per-letter table below |
| Letter spacing | 60u between letters | Tighter than reference allows for chamfered terminals |
| Chamfered terminals | match SF mark style | 30u cuts on letter-end edges |
| Italic lean | applied at component level (NOT in SVG) | matches Phase 2 — preserves dispersion fresnel |

**Per-letter x-positions and widths** (10 glyphs left-to-right):

| Letter | Path ID | x-start | x-end | Width | Notes |
|---|---|---|---|---|---|
| S | `sf-mark-S` | 60 | 550 | 490 | Copy from `sf-geometry.svg` (translate +0) |
| p | `wm-p` | 610 | 1080 | 470 | Lowercase. Round bowl on top, descender stem to baseline |
| a | `wm-a` | 1140 | 1610 | 470 | Lowercase. Round bowl + right vertical stem (single-storey 'a') |
| r | `wm-r` | 1670 | 2060 | 390 | Lowercase. Stem + small top-right hook |
| k | `wm-k` | 2120 | 2640 | 520 | Lowercase. Vertical stem + two diagonals at mid-height |
| F | `sf-mark-F` | 2700 | 3250 | 550 | Copy from `sf-geometry.svg` (translate +1930 from SF original) |
| o | `wm-o` | 3310 | 3850 | 540 | Lowercase. Closed oval — outer + inner subpath, opposite winding (creates the counter hole) |
| r | `wm-r2` | 3910 | 4300 | 390 | Same shape as 'r' above |
| g | `wm-g` | 4360 | 4900 | 540 | Lowercase. Bowl on top + descender below baseline (stretches y to ~820 for descender) |
| e | `wm-e` | 4960 | 5500 | 540 | Lowercase. Closed bowl with horizontal crossbar |

**Letter-design notes (each is one `<path>` with clockwise outline winding):**

- **p** — bowl (closed counter at y 70..420 inside x range 610..1010) + vertical stem (x 610..760) extending from y 70 down to y 800 (descender). Stem and bowl share left edge. Use a SECOND subpath for the inner counter with **opposite winding** to cut the hole.
- **a** — single-storey design: outer outline traces bowl on left + vertical stem on right + bottom curl. Inner counter as a second subpath with opposite winding.
- **r** — vertical stem (x 1670..1820, y 280..720) + top hook curving up-right from (1820, 280) to about (2060, 280). Hook can be a smooth bezier or stepped angles for the geometric idiom.
- **k** — vertical stem (x 2120..2270, y 70..720) + upper diagonal from (2270, 400) to (2640, 280) + lower diagonal from (2270, 400) to (2640, 720). Triangular wedge between the two diagonals is solid — they merge at (2270, 400).
- **F** — copy `sf-mark-F` path from `sf-geometry.svg`. Translate all x coordinates by `+1930` (so original x=770 becomes x=2700, etc.). Path ID stays `sf-mark-F` — Phase 5b animations target this ID.
- **o** — outer outline 540×500 oval (or rounded rectangle), inner counter ≈ 280×260 centered. Two subpaths, opposite winding for the hole. Use cubic beziers `C` for the curves.
- **r** (second instance) — duplicate of first 'r', translate x by `+2240`.
- **g** — descender goes below baseline. Bowl from y 280..650, descender stem extending from x 4360..4510 down to y 820 then curving left underneath the baseline. Inner counter for the bowl as second subpath.
- **e** — closed bowl shape with a horizontal crossbar at mid-height. The crossbar splits the inner counter into two smaller counters → use **three** subpaths (outer + upper inner + lower inner) all with appropriate windings, OR do it as a single complex outline that traces around the crossbar.

**Critical:** The `S` and `F` glyph paths must be **identical strings** to `sf-geometry.svg` apart from the x-translation. Programmatically: the next session should `cat public/branding/sf-geometry.svg`, copy the two path d-attributes, apply the x-offset (S: +0, F: +1930) by adding the offset to every x coordinate. Do NOT visually re-trace them — that introduces drift.

**Editable-by-humans contract:** If at any point the visual diff vs IMG_4607's intended wordmark style falls below SSIM 0.96, the user can replace any individual `<path>` with an Illustrator/Figma trace. Path IDs must be preserved — they are referenced by `SparkForgeWordmark3D.tsx` for per-letter animation.

### Phase 3.2 — Build `src/components/3d/branding/SparkForgeWordmark3D.tsx`

**Pattern:** Near-identical to `SfMark3D.tsx`. Differences:

1. Import `useLoader(SVGLoader, '/branding/sparkforge-geometry.svg')`.
2. Set `SVG_VIEW_WIDTH = 6400`, `TARGET_SCENE_WIDTH = 12.0` (wider scene span).
3. Set `SVG_CAP_HEIGHT = 650` (same — cap-height is shared with SF mark).
4. Iteration over `data.paths` — each path becomes its own mesh with its own `BrandingMaterial` instance and `userData.sfMarkPathId` set to the path ID.
5. Each mesh's geometry is independently extruded with the same `extrudeSettings` derived from `GEOMETRY` config.
6. Italic lean default `0.06` rad (same as Phase 2).
7. Optional prop `revealMask?: number[]` → array of letter indices currently visible. When undefined, all visible. Phase 5b will animate this from `[0]` (S only) → `[0,5]` (S + F) → `[0,1,2,3,4,5,6,7,8,9]` (full word).

**File-level contract:**

```ts
export interface SparkForgeWordmark3DProps {
  url?: string;            // default '/branding/sparkforge-geometry.svg'
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  italicLean?: number;     // default 0.06
  materialOptions?: BrandingMaterialOptions;
  revealMask?: number[];   // letter indices to render; default = all
  groupRef?: React.MutableRefObject<Group | null>;
}
```

**Reuse the helper** `SfMarkPart` from `SfMark3D.tsx` — it disposes geometry + material on unmount. Either re-export it from a shared module (`src/components/3d/branding/_shared.tsx`) or duplicate it. Recommend the shared module to keep DRY.

### Phase 3.3 — Mount in dev showcase

**File to edit:** `src/app/dev/branding/client.tsx`

1. Add `'sparkforge'` to the `Subject` union and `SUBJECTS` array (label: "SparkForge wordmark (Phase 3)").
2. Make it the new default subject (`useState<Subject>('sparkforge')`).
3. In the `<BrandingShowcase>` render branch:
   - When subject === `'sparkforge'`, mount `<SparkForgeWordmark3D italicLean={italicLean} materialOptions={matOptions} />` inside `<Suspense fallback={null}>`.
   - Bump camera distance to ~10 (wider word needs more pull-back).
4. Add a "letter reveal" slider (0..10 integer) that drives `revealMask`. Defaults to 10 (all letters).

### Phase 3.4 — Build + dev verify

```bash
npm run build         # must show "Compiled successfully" + EXIT=0
# Stop at first error. Most likely culprits:
#   - SVG path syntax error (validate sparkforge-geometry.svg in a browser first)
#   - SVGLoader subpath winding issue (counters showing as solid → flip subpath order)
#   - ESLint no-restricted-imports on three subpath imports → use NAMED imports only
npm run dev
# In browser → http://localhost:3000/dev/branding
# Subject = "SparkForge wordmark"; verify:
#   • All 10 letters render
#   • Counters in 'p', 'a', 'o', 'g', 'e' are HOLLOW not solid
#   • Dispersion + dichroic visible across all letters consistently
#   • Italic lean produces depth, not skew distortion
#   • Letter reveal slider hides/shows letters left-to-right
```

If subpath winding produces solid counters: the inner subpath's winding must be **opposite** to the outer. Reverse the inner subpath's vertex order (or flip start point).

### Phase 3.5 — Commit + push

```bash
git add public/branding/sparkforge-geometry.svg
git add src/components/3d/branding/SparkForgeWordmark3D.tsx
git add src/components/3d/branding/_shared.tsx   # if extracted
git add src/app/dev/branding/client.tsx
git add PROGRESS.md                              # add Phase 3 entry
git commit -m "Phase 3: SparkForge wordmark — bespoke parkorge glyphs in SF idiom"
git push -u origin claude/sparkforge-branding-3d-I4Za1
```

User checkpoint: visual sign-off at `/dev/branding` (Vercel preview if mobile-only; localhost otherwise).

---

## 7. Phase 4 — Offline Render Pipeline (DETAILED)

**Goal:** Generate two transparent 4K PNGs (`sf-hero.png`, `sparkforge-hero.png`) and one looped MP4 (`brand-fallback.mp4`) by puppeteer-screenshotting the dev showcase route at controlled poses. The MP4 is what `BrandingShowcase.tsx` serves to non-WebGPU devices (lifting the `fallbackVideoSrc` from `undefined` to a real URL).

### Phase 4.1 — Install Puppeteer + ffmpeg-static

```bash
npm install -D puppeteer ffmpeg-static
```

`puppeteer` ships its own bundled Chromium — no system browser needed. `ffmpeg-static` is the Node-side ffmpeg binary used to stitch PNGs into the MP4 loop.

**Note:** Puppeteer's default Chromium does NOT have WebGPU enabled. You must launch with the flag `--enable-unsafe-webgpu` AND specify the Vulkan/Dawn backend. If the bundled Chromium version is too old for stable WebGPU, fall back to launching system Chrome via `executablePath`.

### Phase 4.2 — Create `scripts/render-branding.ts`

**File to create:** `scripts/render-branding.ts`

**Script behaviour:**

1. Boot the Next.js dev server in the background (or hit a pre-running server).
2. Launch headless Chromium with WebGPU enabled.
3. Navigate to a NEW dev route — `/dev/branding/render?subject=sf|sparkforge|loop&t=<seconds>` — that you create as part of Phase 4. This route mounts `BrandingShowcase` at a fixed 4K viewport with no UI chrome and a query-param-driven pose.
4. Wait for `window.__brandingReady === true` (signal set by the route once shaders compile).
5. Call `page.screenshot({ omitBackground: true, type: 'png' })` for the still renders.
6. For the MP4 loop: capture 60 frames over 2 seconds (30fps × 2s = 60 frames) of a slow-rotating SF mark, then ffmpeg them into `brand-fallback.mp4` (H.264, yuv420p, ~2 MB).
7. Save outputs to `public/branding/`.

**Outputs:**

| Output | Pose | Resolution |
|---|---|---|
| `public/branding/sf-hero.png` | SF mark, italic 3.4°, fixed canonical pose | 4096 × 4096 transparent |
| `public/branding/sparkforge-hero.png` | Full wordmark, italic 3.4°, fixed canonical pose | 4096 × 1024 transparent |
| `public/branding/brand-fallback.mp4` | SF mark slow-rotate ±0.2 rad over 2 s loop | 1920 × 1920, H.264, yuv420p |

### Phase 4.3 — Create render-only dev route

**File to create:** `src/app/dev/branding/render/page.tsx` + `client.tsx`

Strips ALL UI chrome from the showcase (no header, no sliders, no reference panel). Reads `?subject=` and `?t=` query params. Mounts `<BrandingShowcase>` at full viewport with the requested subject. Sets `window.__brandingReady = true` after the first frame renders (via a `useFrame` callback that runs once).

Apply same dev-route guards as `/dev/branding`:
- `notFound()` in production unless `NEXT_PUBLIC_ALLOW_DEV_ROUTES=true`
- Add `/dev/branding/render` to the same middleware bypass (already covered by `/dev/*` prefix match — no middleware change needed).

### Phase 4.4 — Wire MP4 fallback

**File to edit:** `src/components/3d/branding/BrandingShowcase.tsx`

Default `fallbackVideoSrc` from `undefined` to `/branding/brand-fallback.mp4`. Now non-WebGPU devices automatically get the looped MP4 instead of just the static IMG_4607 poster.

### Phase 4.5 — Add npm script

**File to edit:** `package.json`

```json
"scripts": {
  ...
  "render:branding": "tsx scripts/render-branding.ts"
}
```

(Repo already uses `tsx` for similar scripts — verify by `grep -E '"render|tsx' package.json`. If `tsx` is missing, `npm install -D tsx`.)

### Phase 4.6 — Build + verify

```bash
npm run build                    # routes /dev/branding/render must compile
npm run render:branding          # produces 3 files in public/branding/
ls -lh public/branding/sf-hero.png public/branding/sparkforge-hero.png public/branding/brand-fallback.mp4
# Eyeball outputs in any image viewer to confirm transparency + composition
```

### Phase 4.7 — Commit + push

```bash
git add scripts/render-branding.ts
git add src/app/dev/branding/render/page.tsx
git add src/app/dev/branding/render/client.tsx
git add src/components/3d/branding/BrandingShowcase.tsx
git add public/branding/sf-hero.png
git add public/branding/sparkforge-hero.png
git add public/branding/brand-fallback.mp4
git add package.json package-lock.json
git add PROGRESS.md
git commit -m "Phase 4: offline render pipeline + 4K PNGs + MP4 fallback"
git push -u origin claude/sparkforge-branding-3d-I4Za1
```

---

*End of commit 2 of 4. Phase 5 + 6 in commit 3, Phase 7 + alternative video path in commit 4.*
