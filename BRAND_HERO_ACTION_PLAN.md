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

## 8. Phase 5a — Storyboard + Hero Audit (DETAILED)

**Goal:** Read the existing 8-phase hero (`src/components/3d/HeroAnimation.tsx`) end-to-end. Document every current beat. Then write the new 19-second beat sheet for the v3 hero — a deliverable the user signs off on BEFORE any code is rebuilt.

This phase ships a markdown deliverable, not code. Do not modify `HeroAnimation.tsx` until Phase 5b.

### Phase 5a.1 — Audit current hero

**Files to read:**

- `src/components/3d/HeroAnimation.tsx` (full read)
- `src/stores/sceneStore.ts` (heroPhase state machine + setters)
- `src/hooks/useAtomicHeroToCockpit.ts` (the atomic handoff)
- `src/components/3d/Cockpit*.tsx` or wherever the cockpit canvas lives (find via `grep -r "cockpit" src/components/3d`)
- `Cockpit-Interface-Plan.md` (high-level cockpit architecture)

For each of the existing 8 phases, document in the storyboard:
- Phase name + duration (ms)
- Camera path (start → end position + lookAt)
- Active subjects (crystal/text/particles)
- Key visual events
- Audio cue points
- Transition trigger to next phase

### Phase 5a.2 — Author storyboard

**File to create:** `docs/hero-v3/Storyboard.md`

Structure:

```markdown
# Hero v3 Storyboard

## Total runtime: 19 s @ 1×, 4.75 s @ 4× fast-forward
## Framework: GSAP timeline + Theatre.js sequencer
## All beats source from src/lib/branding/sf-material.config.ts

### Beat 1 — Void Awakening (0.0 – 2.5s)
| Aspect | Detail |
|---|---|
| Camera | start (0,0,15), end (0,0,12) — slow dolly-in |
| Subject | starfield + cyan radial streaks (BACKGROUND.streaks) |
| Audio | distant low-frequency hum, rises to mid |
| Lighting | env at 30% intensity, key + rim at 0% |
| Trigger out | t = 2.5s + dispersion-spark visible |

### Beat 2 — Ignition Spark (2.5 – 5.0s)
... (full breakdown)

### Beat 3 — S Crystallization (5.0 – 8.0s)
### Beat 4 — F Mirror + Shard Burst (8.0 – 11.0s)
### Beat 5 — Wordmark Cascade (11.0 – 14.0s)
### Beat 6 — Dichroic Bloom (14.0 – 16.5s)
### Beat 7 — Cockpit Materialization (16.5 – 18.5s)
### Beat 8 — Atomic Handoff (18.5 – 19.0s)
```

The exact beat content should mirror the storyboard you described to the user in chat (deep navy void → spark coalesce → S crystallize → F mirror + Voronoi shard burst → parkorge cascade → dichroic bloom → cockpit emerges → atomic handoff). Reproduce that storyboard verbatim in the markdown so the next session has the source.

### Phase 5a.3 — Audio cue map

Pull the existing audio file paths from `useCockpitAudio` and the hero scene. Map cue points to beats in `Storyboard.md`.

### Phase 5a.4 — User sign-off gate

Commit the storyboard. Push. **STOP.** Ask user to approve before starting 5b prep.

```bash
git add docs/hero-v3/Storyboard.md PROGRESS.md
git commit -m "Phase 5a: hero v3 storyboard + audit current hero"
git push
```

---

## 9. Phase 5b prep — Custom TSL Lensflare Shader (DETAILED)

**Goal:** Build the custom TSL anamorphic lensflare shader (per locked decision N3 lensflare = `c`). This is a self-contained component that any beat can mount; not used in Phase 5a, used by 5b beats 2/4/6.

### Phase 5b prep.1 — Create `src/components/3d/branding/LensflareTSL.tsx`

**Pattern to follow:** Same as `BrandingMaterial.tsx`'s TSL approach — uniforms via `uniform()`, custom `Fn(...)` for the shader body, applied to a `MeshBasicNodeMaterial` on a screen-space plane (or as a postprocessing pass).

**Two-mesh architecture:**

1. **Hot core** — small additive sphere at the flare position with emissive node = radial falloff × color × intensity uniform.
2. **Anamorphic streak** — wide thin plane oriented to the streak angle, with TSL fragment that draws a streak gradient (high alpha at center, falloff toward ends, slight chromatic tint at the tips).

Use additive blending (`AdditiveBlending`) so flares stack on top of the scene without darkening it.

**Read uniform values from `LENS_FLARES` array in `sf-material.config.ts`** — there are two pre-configured flares (amber-spark lower-left, cyan-halo upper-right) with positions, colors, intensity, streak angle, length, width.

**Component contract:**

```ts
export interface LensflareTSLProps {
  /** Index into SF_BRAND.LENS_FLARES, OR a fully custom flare config */
  flare?: number | LensflareConfig;
  /** Override intensity multiplier (Phase 5b animates this 0 → 1.8 → 1.2) */
  intensityMul?: number;
  /** Override hot-core size (Phase 5b animates this 0 → 1.0 during ignition) */
  coreScale?: number;
  /** Override streak length (Phase 5b animates this 0 → 1.4 during ignition) */
  streakScale?: number;
}
export function LensflareTSL(props: LensflareTSLProps): JSX.Element { ... }
```

### Phase 5b prep.2 — Add to dev showcase

Add a "Lensflare" subject to `/dev/branding` so visual tuning can happen in isolation. Show both flares (amber + cyan) over a dark background with the SF mark behind for scale reference.

### Phase 5b prep.3 — Build + dev verify + commit

```bash
npm run build
npm run dev
# Visual: warm-amber flare lower-left, cool-cyan flare upper-right,
# anamorphic horizontal streaks visible, additive blend correct (no darkening).
git add src/components/3d/branding/LensflareTSL.tsx src/app/dev/branding/client.tsx
git commit -m "Phase 5b prep: custom TSL anamorphic lensflare shader"
git push
```

---

## 10. Phase 5b — Hero Phases 1-4 Rebuild (DETAILED)

**Goal:** Replace beats 1-4 of `HeroAnimation.tsx` with the new TSL/three-bvh-csg implementation matching `Storyboard.md`. Beats 5-8 stay on the legacy code path until Phase 5c — the hero will visually break mid-stream during this phase, that's expected.

### Phase 5b.1 — Theatre.js project setup

**File to create:** `src/lib/hero/heroTheatreProject.ts`

```ts
import { getProject } from '@theatre/core';
import heroState from './hero-v3.theatre.json';   // exported state file

export const heroProject = getProject('SparkForgeHero', { state: heroState });
export const heroSheet = heroProject.sheet('Hero v3');
```

In dev mode, also import `@theatre/studio` and `studio.initialize()` so beats can be live-tuned. Strip `studio` from production via dynamic import gated on `process.env.NODE_ENV !== 'production'`.

### Phase 5b.2 — Voronoi shard pre-fracture (E3 — WebGPU compute)

**File to create:** `src/components/3d/branding/SfShardSet.tsx`

1. Import `three-bvh-csg` (`MeshBVH`, `CSG` operations).
2. Take the SF mark `ExtrudeGeometry` from Phase 2.
3. Generate ~150 random Voronoi cell centers inside the geometry's bounding box.
4. For each cell, intersect with the SF geometry → produces shard meshes.
5. Each shard gets its own `BrandingMaterial` instance + initial position = its center-of-mass.
6. Expose `useShardImpulse(impulseMap)` hook to drive shard animation (position + rotation deltas) from the GSAP timeline.

**Optimization (E3 GPU compute):** The repo already has `src/shaders/voronoiShatter.comp`. If it's a TSL-compatible compute kernel, port the cell-center generation to GPU. If it's WebGL2-style GLSL, write a TSL equivalent. Result: shard set generates in <5ms instead of CPU's ~60ms.

### Phase 5b.3 — Beat implementations

For each of beats 1-4, create a sub-component under `src/components/3d/hero/v3/`:

| File | Beat |
|---|---|
| `Beat1VoidAwakening.tsx` | starfield + cyan streaks, slow dolly-in |
| `Beat2IgnitionSpark.tsx` | warm spark forms lower-left, cool glow upper-right, both lensflares mount with `intensityMul` animated 0 → 1 |
| `Beat3SCrystallization.tsx` | particle convergence to S position, BrandingMaterial fades in (transmission animated 0 → 0.97), dispersion peak |
| `Beat4FMirrorAndShardBurst.tsx` | F mirrors S's ignition; SfShardSet briefly assembles into the F mark THEN explodes outward + cyan-mag gradient trail |

Each beat exports a hook `useBeatN(timeline)` that wires its animations into the shared GSAP timeline at the correct offset (per `Storyboard.md`).

### Phase 5b.4 — Wire into HeroAnimation.tsx

**File to edit:** `src/components/3d/HeroAnimation.tsx`

Replace the current beat-1-through-4 sub-components with the new v3 imports. Wrap in a phase-flag check (`process.env.NEXT_PUBLIC_HERO_V3_BEATS_1_4 === 'true'`) so legacy fallback is one env-var flip away during development. Remove the flag at end of Phase 5c.

### Phase 5b.5 — Build + dev verify + commit + push

```bash
npm run build
npm run dev
# Visit / (homepage) — hero plays. Beats 1-4 are new, beats 5-8 are legacy
# (visible discontinuity at t=11s — expected).
git add ...
git commit -m "Phase 5b: hero beats 1-4 rebuilt — ignition + shard burst"
git push
```

User checkpoint after Phase 5b: visual sign-off on beats 1-4 only.

---

## 11. Phase 5c — Hero Phases 5-8 + Cockpit Handoff (DETAILED)

**Goal:** Replace beats 5-8 with v3 implementations AND make the atomic single-canvas handoff to the cockpit work flawlessly. This is the highest-risk phase — handoff timing is brittle.

### Phase 5c.1 — Beat implementations

| File | Beat |
|---|---|
| `Beat5WordmarkCascade.tsx` | parkorge letters flash in around the SF mark with electricity arcs binding them (uses `electricVeins.frag` shader already in repo) |
| `Beat6DichroicBloom.tsx` | full wordmark settles, dichroic intensity animated 1.0 → 1.6 → 1.0, both lensflares peak |
| `Beat7CockpitMaterialization.tsx` | camera dolly continues back, wordmark drifts upward, holographic horizon with cockpit silhouette materializes from below (read existing cockpit init from `Cockpit*.tsx`) |
| `Beat8AtomicHandoff.tsx` | wordmark dissolves into cockpit's central holographic display; sceneStore.completeHero() fires atomically |

### Phase 5c.2 — CPA v2 single-canvas verification

**Critical contract** (CLAUDE.md HS-9):

- The hero canvas IS the cockpit canvas — same `<Canvas>` instance, no swap.
- The handoff is a camera-and-scene transition within the same canvas, not a canvas remount.
- `useAtomicHeroToCockpit` (already exists at `src/hooks/useAtomicHeroToCockpit.ts`) wires the atomicity. Read it; do NOT rewrite it; verify it still works after your beat-8 changes.

**Test method:**

1. Open DevTools → Elements panel. Find the `<canvas>` element BEFORE the hero starts. Note its DOM node.
2. Watch the same node through the entire hero. It must NEVER unmount/remount.
3. The cockpit appears WITHIN the same canvas after t=18.5s.

If the canvas swaps: the handoff is broken. Likely cause is `<Canvas>` mounted under a `key` that changes, or hero/cockpit are separate `<Canvas>` siblings. Trace the parent JSX tree until you find the swap and merge them.

### Phase 5c.3 — Fast-forward + skip controls

Verify `Settings → Hero animation → Skip` toggle still works. Verify clicking/Enter/Space during the hero accelerates `playbackRate = 4`. Both already wired to `sceneStore` in legacy code — preserve those exact bindings.

### Phase 5c.4 — Build + verify HS-9 checklist

```bash
npm run build
npm run dev
# Visit / fresh (clear localStorage 'skipIntroAnimation' first):
#   1. 8-phase hero plays for ~19 s
#   2. Click during hero → 4× speed → ~4.75 s remaining
#   3. Settings toggle "skip" → next refresh, hero is skipped
#   4. Hero → cockpit handoff: NO canvas swap, NO white flash
#   5. Cockpit spatial dashboard renders with holographic lab map
#   6. Lab entry wormhole transition works
#   7. prefers-reduced-motion (DevTools rendering panel) → skips to cockpit
```

### Phase 5c.5 — Commit + push

```bash
git add ...
git commit -m "Phase 5c: hero beats 5-8 + atomic cockpit handoff (HS-9 passes)"
git push
```

User checkpoint: HS-9 hard-stop verification — full visual checklist above.

---

## 12. Phase 6 — App-Wide SparkForge Wording Audit (DETAILED)

**Goal:** Find every place the literal string `"SparkForge"` (or `<title>SparkForge</title>`, or any visual mark) appears in the UI, and replace it with a single shared `<BrandWordmark>` component that renders consistently across the app.

### Phase 6.1 — Author `src/components/branding/BrandWordmark.tsx`

A small wrapper that picks the right rendition based on context:

```ts
export interface BrandWordmarkProps {
  /** Render style. */
  variant?: '3d-live' | 'svg-static' | 'text-fallback';
  /** Size token. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Color override (only for text-fallback). */
  color?: string;
  /** Aria label override. */
  ariaLabel?: string;
}
```

| Variant | Implementation | When to use |
|---|---|---|
| `3d-live` | mounts `<SparkForgeWordmark3D>` in a small `<BrandingShowcase>` | hero only (1 instance, expensive) |
| `svg-static` | `<img src="/branding/sparkforge-hero.png">` (Phase 4 output) | navbar, footer, headers — most app surfaces |
| `text-fallback` | styled `<span>SparkForge</span>` with branded gradient | screen readers, low-fi contexts |

Default = `svg-static`. The 4K PNG from Phase 4 scales down beautifully for any size token.

### Phase 6.2 — Audit + replace

```bash
# Find every literal use:
grep -rn "SparkForge" src/ --include="*.tsx" --include="*.ts" | grep -v "// " | grep -v "/\*" | grep -v "^.*:.*\* " | head -100
# Categories likely to surface:
#   - <h1> or <span> with "SparkForge" text in marketing pages
#   - <title>SparkForge ...</title> in metadata (LEAVE these — they're SEO text)
#   - alt="SparkForge logo" on existing <img> tags
#   - logo-wordmark.svg <img> usage (replace with BrandWordmark)
```

For each VISUAL occurrence, replace with `<BrandWordmark variant="svg-static" size="<appropriate>" />`. SEO/metadata text strings stay as-is — the brand wordmark is for VISUAL surfaces only.

### Phase 6.3 — Update existing wordmark SVG → forwarder

`public/branding/logo-wordmark.svg` (the existing pre-Phase-1 wordmark with Inter text) is no longer the canonical wordmark. Two options:

- **a.** Delete it. Risk: any external link to it 404s.
- **b.** Replace its file content with a forwarder SVG that loads `sparkforge-hero.png` via `<image>` tag. Maintains URL stability.

Recommend **b**. Replace contents:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4096 1024" width="4096" height="1024">
  <image href="/branding/sparkforge-hero.png" width="4096" height="1024"/>
</svg>
```

### Phase 6.4 — Build + visual sweep

```bash
npm run build
npm run dev
# Walk every route once with the visual checklist:
#   /             /labs       /home       /pricing    /about
#   /signup       /login      /admin      /dashboard
# Verify the SparkForge wordmark renders consistently — same letterforms,
# same dichroic, same size scaling — everywhere.
```

### Phase 6.5 — Commit + push

```bash
git add src/components/branding/BrandWordmark.tsx
git add <every replaced file>
git add public/branding/logo-wordmark.svg   # if forwarder option
git add PROGRESS.md
git commit -m "Phase 6: app-wide BrandWordmark — single source of truth"
git push
```

User checkpoint: full app visual sweep on desktop + mobile.

---

## 13. Phase 7 — Sora 2 + Veo 3 Prompt Pack (DETAILED)

**Goal:** A documentation-only deliverable. No code. Author a polished prompt pack for the marketing-only Seedance / Sora 2 / Veo 3 video renders. The user generates the videos manually using their model accounts; the prompt pack is the brief.

### Phase 7.1 — Author `docs/marketing/SoraVeo-PromptPack.md`

Structure:

```markdown
# SparkForge Marketing Video — Prompt Pack

## Anchor frames (provide as image inputs)
- public/branding/sf-hero.png  — first-frame anchor for SF beats
- public/branding/sparkforge-hero.png — first-frame anchor for wordmark beats

## Style notes (every prompt prepends)
- Color palette: deep navy void #02050d, dichroic cyan #7fe8ff, magenta #ff5fc8, warm amber #ffaa55
- Material: clear glass crystal, IOR 1.55, transmission 0.97, asymmetric prismatic dispersion
- Lighting: warm key from lower-left, cool rim from upper-right, no overhead light
- Camera: cinematic dolly + slight handheld float, never aggressive movement

## Beat-by-beat prompts (mirroring Storyboard.md)

### Beat 1 — Void Awakening (0–2.5s, target 3s clip)
SORA 2 PROMPT: <full prompt>
VEO 3 PROMPT: <full prompt — Veo prefers shorter prompts>
SEEDANCE 2.0 PROMPT: <full prompt — Seedance prefers cinematography terms>

### Beat 2-7 ... (same triple-prompt pattern)

### Beat 8 — Last frame anchor
LAST FRAME: render the cockpit's first mounted frame as PNG, supply as Sora's
"end_frame" parameter / Veo 3's "last_frame_image" / Seedance's "end_image".
This locks the handoff.
```

### Phase 7.2 — Stitching + grading instructions

Add a section detailing:

1. How to stitch the 7 generated clips with FFmpeg (zero-frame `xfade` filter for smooth transitions).
2. Suggested DaVinci Resolve LUT to lock palette to IMG_4607.
3. Encoding ladders (4K AV1 + H.265 fallback + 1080p VP9 for Safari ≤16).

### Phase 7.3 — Cost + iteration estimate

Document realistic per-pass costs ($1-10 per take depending on model) and recommend 3-5 takes per beat to find the brand-faithful winner. Total budget: $25-200 for a complete brand-faithful 19-second hero render.

### Phase 7.4 — Commit + push

```bash
git add docs/marketing/SoraVeo-PromptPack.md
git commit -m "Phase 7: Sora 2 + Veo 3 + Seedance 2.0 prompt pack"
git push
```

This phase ends the build plan.

---

## 14. Reusable Patterns + Conventions

Patterns established by Phases 1-2 that future code should follow without re-inventing:

### TSL imports

```ts
// CORRECT — named imports only (ESLint blocks namespace imports)
import { WebGPURenderer, MeshPhysicalNodeMaterial } from 'three/webgpu';
import { Fn, vec3, uniform, normalView, positionWorld, mix, smoothstep, abs, sin, cos, pow, dot, normalize, fract, step, oneMinus } from 'three/tsl';

// WRONG — will fail eslint no-restricted-imports
import * as THREE_WEBGPU from 'three/webgpu';
```

### WebGPU capability detection (client-side only)

See `useWebGPUCapability()` in `BrandingShowcase.tsx`. Reuse it; don't re-implement.

### R3F WebGPU async gl factory

```tsx
<Canvas
  gl={async (props) => {
    const renderer = new WebGPURenderer({
      ...(props as Record<string, unknown>),
      antialias: true,
      alpha: false,
    });
    await renderer.init();
    return renderer as unknown as never;  // R3F type ergonomics
  }}
>
```

### SVG → ExtrudeGeometry pipeline

See `SfMark3D.tsx` for the full pattern:
- `useLoader(SVGLoader, url)` — handles caching + suspense
- `SVGLoader.createShapes(path)` — modern API; do NOT use deprecated `path.toShapes()`
- `new ExtrudeGeometry(shape, settings)` per shape
- `geom.scale(1, -1, 1)` to flip y (SVG y-down → three y-up)
- Recenter to box center via `geom.boundingBox.getCenter() + geom.translate()`
- Group-level recenter via Box3 measurement after mount (handles aggregate)

### BrandingMaterial instantiation

```ts
const material = useMemo(() => createBrandingMaterial(options), [options]);
useEffect(() => () => material.dispose(), [material]);
```

Each mesh gets its OWN material instance (TSL node materials hold GPU pipelines per-instance). Sharing causes uniform interference.

### Italic lean (NOT skew)

Always apply via group rotation, never via skewX. Skew distorts the surface normals and breaks the dispersion fresnel sampling.

```tsx
<group rotation={[0, italicLean, 0]}>...</group>   // ✓ correct
// <... transform: skewX(...)>                      // ✗ breaks dispersion
```

### Dev showcase route convention

- Path: `src/app/dev/<feature>/page.tsx` + `client.tsx`
- Page: server component, `notFound()` if production AND no `NEXT_PUBLIC_ALLOW_DEV_ROUTES`
- Client: `'use client'`, all interactivity here
- Middleware bypass: `/dev/*` already covered

### Pre-existing repo gotchas (auto-fixed during Phase 1, may resurface)

- `src/app/(dashboard)/layout.tsx` references `useCockpitBroadcast` — must be imported from `@/stores/cockpitBroadcastStore` (NOT `@/stores/cockpitStore`).
- `src/stores/cockpitStore.ts` had duplicate `_*Timeout` properties from a merge artifact. Re-check after pulls.
- ESLint rule `no-restricted-imports` blocks `import * as X from 'three[/...]`. Always use named imports.

---

## 15. Mythos Halt Rule — How Convergence Works In Practice

**Threshold:** SSIM ≥ 0.96 vs `public/branding/IMG_4607.png` for SF mark, vs the user-approved storyboard for hero beats.

**Loop pattern (apply to every visual checkpoint):**

```
1. Render current state to PNG (via dev/branding/render route or Phase 4 script)
2. SSIM(current.png, IMG_4607.png) -> compute via npm pkg `image-ssim` or sharp
3. If >= 0.96 -> halt, ship, commit
4. If < 0.96  -> identify worst-deviating channel (color/structure/luminance)
                    -> tune corresponding sf-material.config.ts param
                    -> goto 1
5. After 12 iterations without convergence -> escalate to user with diff visualization
```

In practice (Phase 1 + 2): the user does the eyeballing. If you (the agent) want to automate it, install `image-ssim` and write a one-shot `scripts/compare-ssim.ts` that the dev showcase can call.

---

## 16. ALTERNATIVE — Video Hero Path (Sora 2 / Veo 3 / Seedance 2.0)

If at any point the user decides the live R3F+TSL hero is taking too long, costing too much engineering, or simply doesn't hit the visual ceiling they want — here is the **complete** transition plan to switch to a video-generated hero. This is a self-contained alternative; reading section 16 alone is enough to execute.

### 16.1 — Tradeoffs (read first)

| Dimension | Live R3F + TSL (default) | Video-generated hero (this section) |
|---|---|---|
| Visual ceiling | Excellent, bound by what we can write in TSL | Hollywood-grade out of the box |
| Per-device consistency | Varies (WebGPU vs MP4-poster) | Pixel-identical everywhere |
| Bundle weight | ~30 KB shaders | 25-60 MB streamed video |
| First paint | Canvas init ~600ms | Poster instant (~50 KB JPG) |
| Cockpit handoff | True single-canvas, zero-flash | Crossfade window — visible if mistimed |
| Skip / scrub / 4× FF | Native via timeline | Native via `<video>` API |
| Pointer parallax | Native | **Impossible** |
| Chromatic dispersion fidelity | Full GPU precision | Crushed by H.264/AV1 codec |
| Iteration speed | Live shader hot-reload, free | Hours per generation, $1-10/take |
| Brand updates | Edit shader uniform, ship in minutes | Re-prompt + re-grade + re-encode (days) |
| Source-of-truth | One shader, both contexts | Diverges (shader for stills, video for hero) |
| Engineering risk | Medium (TSL bugs, WebGPU edge cases) | Low (just a `<video>` tag) |

**Recommendation if switching:** keep the live offline-render path (Phase 4) as the brand source-of-truth for stills, and use video ONLY for the hero. The shader produces the still frames that ANCHOR the video generation (image-to-video conditioning) — this preserves the single-source-of-truth.

### 16.2 — Model selection (April 2026)

| Model | Max length | Max res | Strength | Caveat |
|---|---|---|---|---|
| **Sora 2** (OpenAI) | ~20s | 1080p (4K via upscale) | Best material physics + realism | API gated; high cost per iteration |
| **Veo 3** (Google) | ~8s | 4K native | Best photographic feel | 8s cap forces stitching |
| **Seedance 2.0** (ByteDance) | ~10s | 4K | Best cinematic camera moves | Less reliable on tiny letterform detail |
| **Kling 2.0** (Kuaishou) | ~10s | 1080p | Best character motion | Less cinematic for abstract VFX |
| **Runway Gen-4** | ~10s multi-shot | 4K | Best multi-shot continuity | Pricing ramps quickly |

**Recommended primary:** **Sora 2** (single 20s take + 4K upscale) → simplest pipeline.
**Recommended fallback:** **Veo 3 stitched** (8s × 3 clips with FLF2V conditioning) → best photographic quality.
**Recommended for camera moves:** **Seedance 2.0** if Sora 2 / Veo 3 access isn't available.

### 16.3 — Storyboard for video version (19s)

Same beat structure as the live R3F version (`Storyboard.md`), but each beat is a video clip with explicit anchor frames:

| t | Beat | First-frame anchor | Last-frame anchor |
|---|---|---|---|
| 0.0–2.5s | Void Awakening | navy void + 2 light points (rendered or generated) | beat-2 spark mid-coalesce |
| 2.5–5.0s | Ignition Spark | beat-1 final | beat-3 S-mid-crystallize |
| 5.0–8.0s | S Crystallization | beat-2 final | **`public/branding/sf-hero.png`** (Phase 4 SF-mark still) |
| 8.0–11.0s | F Mirror + Shard Burst | beat-3 final (SF mark complete) | beat-5 wordmark-mid-cascade |
| 11.0–14.0s | Wordmark Cascade | beat-4 final (SF + scattered shards) | **`public/branding/sparkforge-hero.png`** (Phase 4 wordmark still) |
| 14.0–17.0s | Dichroic Bloom | beat-5 final (wordmark settled) | beat-7 cockpit silhouette starts |
| 17.0–19.0s | Cockpit Materialization + Handoff | beat-6 final | **render of cockpit's first frame** (NEW: see step 16.4.2) |

### 16.4 — Implementation steps

Same execution model as the live-hero phases, but the per-phase content changes:

#### 16.4.1 — Replace Phase 5b/5c with Phase V (video)

```
Phase V.1  Stitch + encode pipeline
  scripts/stitch-hero-video.ts  → ffmpeg concat + xfade + AV1 + H.265 + WebM
Phase V.2  Build <BrandHeroVideo> component
  src/components/3d/HeroVideoPlayer.tsx  → <video> with poster + controls + skip + 4x FF
Phase V.3  Cockpit-arrival anchor frame render
  scripts/render-cockpit-anchor.ts  → boots cockpit, screenshots first frame at 4K
Phase V.4  Wire into HomePage / hero mount points
  Replace HeroAnimation usage with HeroVideoPlayer; preserve sceneStore.heroPhase semantics
Phase V.5  Crossfade handoff
  Last 400ms of <video> fades down; cockpit canvas fades up
Phase V.6  prefers-reduced-motion + accessibility
  poster-only path; ARIA description; captions for any audio
```

#### 16.4.2 — How to produce the cockpit-anchor PNG

Critical for landing the handoff frame: the video's last frame must EXACTLY match the cockpit's first rendered frame. Without this, the transition is jarring.

```bash
npm run dev
# Navigate to a hidden /dev/cockpit-anchor route that mounts the cockpit
# at its initial state, no UI overlays, fixed camera.
# Take a screenshot.
node scripts/render-cockpit-anchor.ts > public/branding/cockpit-anchor.png
# Pass cockpit-anchor.png as the "end_frame" / "last_frame_image" parameter
# to your video-gen model for the final beat.
```

Then in `HeroVideoPlayer.tsx`:
```ts
const handleVideoEnd = () => {
  // Crossfade the video out as cockpit canvas fades in.
  // 400ms overlap window. Both render simultaneously during overlap.
  videoRef.current!.style.opacity = '0';
  cockpitCanvasRef.current!.style.opacity = '1';
  setTimeout(() => sceneStore.completeHero(), 400);
};
```

#### 16.4.3 — Generate the video clips

For each beat in section 16.3:

1. Open your chosen model's web UI or API.
2. Provide the **first-frame anchor** as an image input (Sora 2: `image_input`; Veo 3: `first_frame_image`; Seedance: `start_image`).
3. Provide the **last-frame anchor** as an end-frame conditioning input (Sora 2 + Veo 3 + Seedance all support this).
4. Use the prompts from `docs/marketing/SoraVeo-PromptPack.md` (created in Phase 7 — author it FIRST even if you're skipping live-hero, because it captures the storyboard).
5. Generate 3-5 takes. Hand-pick the best.
6. Save winners to `public/branding/hero-clips/beat-<N>.mp4`.

#### 16.4.4 — Stitch + encode

```bash
ffmpeg -i beat-1.mp4 -i beat-2.mp4 -i beat-3.mp4 ... \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.1:offset=2.4[v01];[v01][2:v]xfade=...[v02];..." \
  -c:v libsvtav1 -crf 28 -pix_fmt yuv420p \
  public/branding/sparkforge-hero-4k.mp4

# Encode H.265 fallback for Safari ≤16
ffmpeg -i public/branding/sparkforge-hero-4k.mp4 -c:v libx265 -crf 26 \
  public/branding/sparkforge-hero-4k.h265.mp4

# Encode 1080p adaptive ladder for slow connections
ffmpeg -i public/branding/sparkforge-hero-4k.mp4 -vf scale=1920:1080 -c:v libx264 -crf 22 \
  public/branding/sparkforge-hero-1080p.mp4
```

#### 16.4.5 — Adaptive streaming (recommended)

Use Vercel's built-in HLS support: upload all three encodings (4K AV1, 4K H.265, 1080p H.264) and serve via Vercel's edge CDN. The `<video>` tag's `<source>` elements list them in priority order; the browser picks the best supported.

### 16.5 — How to bring this to fruition (decision tree)

If the user reads this section and decides to switch:

1. **Skip Phase 5a/5b/5c entirely.** Replace them with "Phase V" sub-phases above.
2. **Still execute Phase 7** — the prompt pack IS the storyboard for the video generation. Without Phase 7 there's nothing to prompt.
3. **Still execute Phase 4** — the offline 4K stills become the I2V/FLF2V anchor frames. Without Phase 4, the videos have nothing to anchor to and will drift off-brand.
4. **Phase 6 (BrandWordmark)** still applies — non-hero surfaces still use the static PNG.
5. **Phase 3 (SparkForge wordmark geometry)** can be skipped IF you commit fully to video (the wordmark only renders in static contexts — covered by Phase 4 PNG output). But recommend keeping it for `<BrandWordmark variant="3d-live">` instances if you ever want a live shader anywhere.

**Hybrid approach (RECOMMENDED if going video):** Keep all 7 phases of the live-hero plan (so all non-hero surfaces use the live shader), and ADDITIONALLY do "Phase V" video work for the home-page hero only. This gives you:

- Marketing-grade Hollywood video on the most-viewed surface
- Live shader fidelity everywhere else
- Single brand source-of-truth still preserved (shader anchors the video)

### 16.6 — Cost + time estimate

| Item | Time | Cost |
|---|---|---|
| Phase 7 prompt pack authoring | 4 hours | $0 |
| Generate 21 takes (3 per beat × 7 beats) | 8-12 hours wall-clock | $50-300 |
| Hand-pick winners + first iteration | 2-4 hours | $20-100 (re-rolls) |
| Stitch + grade + encode | 4-6 hours | $0 |
| Cockpit anchor frame production | 1 hour | $0 |
| HeroVideoPlayer component | 4-8 hours engineering | $0 |
| Crossfade handoff implementation | 2-4 hours | $0 |
| QA + adaptive ladder verification | 4-6 hours | $0 |
| **Total** | **2-4 days wall-clock** | **$70-400** |

Compare to live-hero remaining work (Phases 5a-c + 6): ~5-8 days engineering, $0 ongoing.

---

## 17. Final Checklist Before Closing Out

Whether the user picks live-hero or video-hero, the build is "done" when:

- [ ] All 35+ UI occurrences of "SparkForge" use `<BrandWordmark>` (Phase 6)
- [ ] Hero plays end-to-end at 19s with 4× fast-forward + skip toggle (HS-9)
- [ ] Hero → cockpit handoff has zero visible flash (HS-9)
- [ ] `prefers-reduced-motion` skips hero entirely (HS-9)
- [ ] Login 3D + Demo Login flow still works (HS-10)
- [ ] WebGPU + non-WebGPU devices both serve a faithful brand experience
- [ ] `npm run build` passes
- [ ] `PROGRESS.md` updated with all phase completions
- [ ] User has signed off visually on each phase

---

*End of commit 4 of 4. Document complete.*
*Total runtime estimate from this point: 5-8 days for live-hero path, 2-4 days for video-hero path.*
*Branch ready for handoff at commit `c4939dc` + four `BRAND_HERO_ACTION_PLAN: commit N/4 ...` commits on top.*
