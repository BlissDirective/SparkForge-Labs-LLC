# SparkForge 3D Asset Pipeline

> PERF-HIGH-002 (Option C). How to prepare + compress 3D assets for shipping.

---

## Current state (April 2026)

| Asset class | Count | Largest | Total |
|---|---:|---:|---:|
| HDR environments | 1 | 2.0 MB (`public/hdri/frost-prismatic.hdr`) | 2.0 MB |
| PNG icons / branding | 5 | ~60 KB (og-image) | ~250 KB |
| Textures (3D color/normal/roughness) | **0** | — | — |
| GLB / GLTF models | **0** | — | — |

SparkForge's 3D layer is **procedural-first**: geometry is extruded, beveled, and lit at runtime from code; shaders are TSL/GLSL; materials are `MeshStandardMaterial`/`MeshToonMaterial` with parameter-driven PBR rather than baked textures. The HDR environment map is the only image-asset cost on the 3D layer today.

This means **PERF-HIGH-002 is mostly forward-looking**: the pipeline below exists so that when GLBs or baked textures are introduced (e.g., Pet Trainer pets per CLAUDE.md §HS-8, future games, marketing renders), they land already compressed.

---

## Asset size budgets

| Category | Budget (uncompressed) | Budget (shipped) | Notes |
|---|---|---|---|
| Single PBR texture | 4 MB (2048²×RGBA) | **≤ 400 KB** via KTX2 | 10 : 1 minimum ratio; 2048² is the ceiling — prefer 1024² or 512² where acuity allows |
| HDR environment | 4 MB | ≤ 4 MB (.hdr is already compact) | Use RGBM or RGBD + WebP if texture-too-big becomes a problem |
| GLB model | 5 MB per model | **≤ 500 KB** via Draco + KTX2 | Enable Draco geometry compression + replace embedded textures with KTX2 |
| Procedural shader | — | — | Always preferred over textures for tile-able patterns, LEDs, chrome, etc. |

---

## Why KTX2 / Basis Universal

Stock web browsers can decode PNG/JPG, but **loading a 2048² PNG into a GPU texture means the browser spends ~50 ms CPU decoding + uploads 16 MB of uncompressed RGBA to VRAM.** Basis Universal (.basis) and KTX2 (.ktx2) are GPU-native compressed formats. Their win:

- Ship 6–10× smaller (4 MB → 400 KB on disk)
- Upload 4× smaller to VRAM (BC7 / ASTC / ETC block compression, 8 bpp vs. 32 bpp)
- Zero CPU decode — the GPU consumes the block-compressed payload directly

KTX2 is the 2020+ container that wraps Basis with metadata. drei's `<KTX2Loader>` decodes it in-browser via the companion WASM transcoder.

---

## Tooling

### `basisu` — the reference compressor

One-time install:
```bash
# macOS (Homebrew)
brew install basis_universal
# Linux (build from source, ~2 min)
git clone https://github.com/BinomialLLC/basis_universal /tmp/basisu
cd /tmp/basisu && cmake . && make -j
sudo install basisu /usr/local/bin/
```

Verify:
```bash
basisu -v   # should print version
```

### The compression script

`scripts/compress-textures.sh` walks `public/textures/` and regenerates `.ktx2` siblings for any `.png` / `.jpg` / `.jpeg` that is newer (or missing its KTX2 counterpart). Idempotent; safe to re-run.

```bash
bash scripts/compress-textures.sh
```

Add it to your workflow on any commit that touches `public/textures/`.

Typical settings used by the script (normal PBR texture):
```
basisu -ktx2 -q 180 -mipmap -mip_filter mitchell IN.png -output_file IN.ktx2
```
- `-q 180` — quality 0–255; 180 is a solid "indistinguishable at 1:1 zoom" sweet spot
- `-mipmap -mip_filter mitchell` — pre-computed mipmaps in high-quality filtering
- Normal maps: add `-normal_map` (adjusts quantization for directional data)

### drei loader

```tsx
import { useKTX2 } from '@react-three/drei';
const diffuse = useKTX2('/textures/pet-body-color.ktx2');
```

Drei bundles the Basis transcoder WASM automatically. No extra config.

---

## GLB workflow

For GLBs (future Pet Trainer pets, marketing hero models, etc.):

1. **Author** in Blender / Maya / Substance.
2. **Export** as glTF-binary (.glb) with `KHR_texture_basisu` and `KHR_draco_mesh_compression`. Blender's built-in exporter supports both under Addons → import/export enabled.
3. **Compress further** with `gltfpack` (from meshoptimizer):
   ```bash
   npx gltfpack -i src.glb -o dist.glb -c -cc -tc
   ```
   - `-c` = vertex quantization, `-cc` = compressed vertex streams, `-tc` = transcode textures to KTX2
4. **Place** under `public/models/<game>/...` and preload via `useGLTF.preload(path)` in `src/lib/3d/preloadAssets.ts`.

Target: GLB ≤ 500 KB per model. If one exceeds 500 KB, revisit texture resolution first, then geometry density.

---

## When (not) to add a texture

Procedural is almost always better. Ask before introducing a PNG:

| Procedural | Textured |
|---|---|
| Repeating patterns (grids, LEDs, chrome panels) | Character faces / unique detail |
| 2-color gradients | Photographic references |
| Animated / parameterized looks | Hand-authored illustration |

If the asset IS worth a texture, read the **Asset size budgets** table above. Ship it compressed.

---

## Enforcement

The CI job currently does not auto-compress uncompressed PNGs — the pipeline is tooled but not gated. When texture assets start landing, we'll add a CI step that fails if `public/textures/` contains a `.png` / `.jpg` without a fresher `.ktx2` sibling. That gate depends on `basisu` being available in the runner image and is tracked as a follow-up (not Phase 2).

---

## Phase-4 enhancement idea: Next.js custom loader

`next.config.ts` can register a custom loader that rewrites `import img from './texture.png'` to a runtime-negotiated format (AVIF for HTML, KTX2 for R3F). This removes the manual `useKTX2` boilerplate. Scope is non-trivial (~200 LOC + the Next.js config shape) and unjustified while the texture count is zero. Revisit once we have 10+ textures.
