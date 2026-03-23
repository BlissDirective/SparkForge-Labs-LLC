# MOBILE 3D ENHANCEMENT PLAN — Part A: Analysis & Options

**Version:** 1.0 | **Date:** March 23, 2026 | **Status:** DRAFT — Awaiting User Review
**Scope:** Upgrading SparkForge mobile experience from CSS-only to lightweight 3D
**Companion:** Part B contains detailed implementation specs per chosen option

---

## 1. CURRENT STATE ANALYSIS

### 1.1 What Mobile Gets Today

SparkForge currently uses a **binary mobile strategy**: desktop/tablet get full R3F 3D, mobile (<768px) gets **zero 3D** — pure CSS fallbacks everywhere.

| Area | Desktop (≥1024px) | Tablet (768–1023px) | Mobile (<768px) |
|------|-------------------|---------------------|-----------------|
| **Cockpit** | 20M tri 3D panoramic | 10M tri reduced 3D | Zero 3D — flat CSS glassmorphic dashboard |
| **Hero Animation** | 8-phase 19s cinematic | 8-phase 19s cinematic | Skipped entirely — instant dashboard |
| **Login Portal** | 3D crystal portal + 200 particles | 3D crystal portal + 200 particles | 30 CSS pulsing dots |
| **Games (Flagship)** | Full R3F scenes (10M tri) | Reduced R3F (5M tri) | CSS particles only — `GenericGameParticles` |
| **Games (FL-Lite)** | Full R3F scenes (2M tri) | Reduced R3F (1M tri) | CSS particles only |
| **Games (Standard)** | R3F environments (500K tri) | R3F environments (250K tri) | CSS particles only |
| **Lab Map** | 3D holographic map | 3D holographic map | Flat 2D grid/carousel |
| **Particles** | R3F instanced particles | R3F instanced particles | `motion/react` CSS div drift |
| **Post-processing** | Bloom, vignette, barrel distortion | Bloom, vignette | None |
| **Shadows** | Yes | No | No |

### 1.2 Key Files Governing Mobile Behavior

| File | Role | Mobile Logic |
|------|------|-------------|
| `src/hooks/useIsMobile.ts` | Viewport detection | `window.innerWidth < 768` → returns `true` |
| `src/stores/deviceStore.ts` | Performance profiles | Mobile: 30 FPS, 2.5M tri cap, 0.3x particles, no bloom/shadows |
| `src/components/3d/CockpitCanvas.tsx` | Unified R3F Canvas | Returns `null` on mobile (line ~85) |
| `src/components/3d/GenericGameParticles.tsx` | CSS particle fallback | 14 `motion.div` elements with radial gradient |
| `src/components/3d/GameShell.tsx` | Game wrapper | Renders CSS particles on mobile instead of R3F |

### 1.3 Decision Lock CPA2-12

The current "zero R3F on mobile" approach is governed by **Decision CPA2-12**:
> "Mobile gets zero R3F (pure CSS fallback) — Battery life, performance, and touch UX all better with CSS approach on mobile"

**This plan proposes amending CPA2-12** to allow lightweight, performance-budgeted 3D on mobile while preserving the battery-conscious spirit of the original decision.

### 1.4 What Users Are Missing on Mobile

1. **No sense of immersion** — The "Laboratory Control Station" identity is entirely absent on phones
2. **No hero animation** — First-time users see an instant flat dashboard (no wow factor)
3. **No 3D game elements** — All 35 games look like flat 2D web apps on mobile
4. **No spatial navigation** — Lab map is a generic 2D grid instead of an interactive 3D environment
5. **No chrome bezel depth** — Bezel is a CSS gradient border, not a dimensional element
6. **No particle immersion** — 14 slowly-drifting CSS dots vs. hundreds of dynamic 3D particles

---

## 2. FEASIBILITY RESEARCH: MOBILE 3D IN 2026

### 2.1 Triangle Budgets — What's Actually Feasible?

Research across industry sources, Three.js forums, and WebGL/WebGPU benchmarks reveals:

| Scope | Safe Budget | Aggressive Budget | Notes |
|-------|------------|-------------------|-------|
| **Total scene (mobile WebGL2)** | 50K–100K tri | 200K–500K tri | Draw calls matter more than tri count |
| **Total scene (mobile WebGPU)** | 100K–300K tri | 500K–1M tri | WebGPU 3-5x faster than WebGL |
| **Individual hero asset** | 5K–20K tri | 50K–100K tri | LOD critical at distance |
| **Instanced particles** | 5K–50K instances | 100K+ instances | 1 draw call via InstancedMesh |
| **Draw calls** | <50 ideal | <100 max | **Primary bottleneck on mobile** |
| **Textures** | 512×512 max | 1024×1024 | KTX2/ASTC compression essential |

**Key insight: Draw calls, not triangles, are the primary mobile bottleneck.** A scene with 200K triangles in 5 draw calls will outperform 50K triangles in 200 draw calls.

### 2.2 WebGPU Mobile Support (March 2026)

| Browser | Mobile Status | Notes |
|---------|-------------|-------|
| **Chrome Android** | ✅ Shipped (v121+) | Android 12+ with Qualcomm/ARM GPUs |
| **Safari iOS** | ✅ Shipped (Safari 26 / iOS 26) | Full WebGPU via Metal backend |
| **Firefox Android** | ⚠️ Behind flag | Expected stable 2026 |
| **Samsung Internet** | ✅ Via Chromium engine | Follows Chrome support |

**Coverage estimate:** ~70-75% of mobile users can run WebGPU today. Three.js `WebGPURenderer` auto-falls back to WebGL2 for the rest.

### 2.3 Performance Gains: WebGPU vs WebGL on Mobile

| Metric | WebGL2 | WebGPU | Improvement |
|--------|--------|--------|-------------|
| Draw call overhead | High (JS→GPU per call) | Low (command buffers) | 3-5x |
| Compute shaders | Not available | Full support | Enables GPU particles |
| Instancing | Supported | Optimized | 2-3x faster |
| Power consumption | Baseline | 30-40% less | Same workload, longer battery |
| Texture compression | Limited | KTX2/ASTC native | 50-75% less VRAM |
| Real-world FPS (AR face tracking) | 12 FPS | 58 FPS | ~5x (Nexara Labs benchmark) |

### 2.4 Are Animations Feasible on Mobile?

**Yes — with constraints:**

| Animation Type | Mobile Feasibility | Approach |
|---------------|-------------------|----------|
| **Camera transitions** | ✅ Excellent | Tween camera position/rotation (zero geometry cost) |
| **Object rotation/scale** | ✅ Excellent | Matrix transforms only (no geometry cost) |
| **Morph targets** | ✅ Good | GPU-computed vertex interpolation |
| **Skeletal animation** | ⚠️ Limited | Max 2-3 skinned meshes, <5K tri each |
| **GPU particle systems** | ✅ Good (WebGPU) | Compute shader particles, 10K-100K instances |
| **CSS particle hybrid** | ✅ Excellent | Combine CSS overlay with simple 3D backdrop |
| **Post-processing** | ⚠️ Selective | Bloom at half-res OK; avoid stacking multiple effects |
| **Physics simulation** | ❌ Avoid | CPU-bound, drains battery, minimal visual payoff |

**Critical optimization strategies for mobile animation:**
- **On-demand rendering**: Only re-render when scene changes (saves 80%+ GPU cycles when idle)
- **Delta-based timing**: Normalize animation speed across devices via frame delta
- **Resolution scaling**: Render at 0.5x-0.75x device pixel ratio during intensive animations
- **LOD + distance culling**: Aggressively simplify/hide distant objects

---

## 3. ENHANCEMENT OPTIONS

### Option A: "Lite 3D" — Conservative Enhancement (RECOMMENDED)

**Philosophy:** Add just enough 3D to create immersion without risking battery or performance.

| Area | Enhancement | Triangle Budget | Draw Calls |
|------|-----------|----------------|------------|
| **Login portal** | Simplified 3D crystal (low-poly) + 50 instanced particles | 5K | 3 |
| **Hero animation** | Compressed 8-phase sequence (8 seconds instead of 19) with simple geometry morphs | 15K | 5 |
| **Cockpit shell** | Minimal chrome bezel ring + LED rim as 3D (no panels, no HUD) | 10K | 4 |
| **Lab map** | 2.5D isometric cards with depth + parallax (CSS + minimal R3F) | 8K | 6 |
| **Game backgrounds** | Single low-poly themed backdrop per game (instanced) | 10K per game | 2-3 |
| **Ambient particles** | InstancedMesh particles replacing CSS dots (50-100 particles) | 2K | 1 |
| **TOTAL SCENE** | | **~50K tri** | **~22 calls** |

**Mobile Performance Profile Update:**
```
targetFPS: 30
maxTriangles: 100_000  (was 2_500_000 but 0 used; now 100K actually used)
lodBias: 'low'
bloomEnabled: false
postProcessingEnabled: false (or half-res bloom only)
shadowsEnabled: false
instancedMeshLimit: 200
pixelRatio: 1.0
```

**Battery Impact:** Minimal — on-demand rendering + low geometry means GPU idles 80%+ of the time
**Risk Level:** Low — well within proven mobile WebGL2 budgets
**User Impact:** High — transforms flat CSS pages into dimensional experiences
**Estimated Build Effort:** 2-3 development phases (insertable into existing build plan)

---

### Option B: "Immersive Mobile" — Moderate Enhancement

**Philosophy:** Bring a meaningful subset of the desktop 3D experience to mobile with WebGPU-first rendering.

| Area | Enhancement | Triangle Budget | Draw Calls |
|------|-----------|----------------|------------|
| **Login portal** | Full crystal portal (medium-poly) + 150 instanced particles + glow | 20K | 6 |
| **Hero animation** | Full 8-phase sequence (12 seconds) with simplified geometry + GPU particles | 50K | 10 |
| **Cockpit shell** | Chrome bezel + LED rim + simplified side panels + status bar | 80K | 15 |
| **Holographic HUD** | Simplified HUD (2 rings instead of 8) | 15K | 3 |
| **Lab map** | 3D mini holographic map with 10 lab nodes (low-poly) | 30K | 12 |
| **Game backgrounds** | Themed 3D environment per game (low-poly) + ambient lighting | 50K per game | 8-10 |
| **Ambient particles** | GPU compute particles (WebGPU) or instanced fallback (WebGL2) | 10K | 1-2 |
| **Post-processing** | Half-resolution bloom only | — | 1 |
| **TOTAL SCENE** | | **~255K tri** | **~50 calls** |

**Mobile Performance Profile Update:**
```
targetFPS: 30 (WebGL2) / 45 (WebGPU)
maxTriangles: 300_000
lodBias: 'low' (WebGL2) / 'medium' (WebGPU)
bloomEnabled: true (half-res)
postProcessingEnabled: true (bloom only)
shadowsEnabled: false
instancedMeshLimit: 500
pixelRatio: 1.0 (WebGL2) / 1.25 (WebGPU)
```

**Battery Impact:** Moderate — continuous rendering during navigation; on-demand during static views
**Risk Level:** Medium — requires WebGPU for best experience; WebGL2 fallback is noticeably reduced
**User Impact:** Very High — mobile feels like a real 3D app
**Estimated Build Effort:** 4-5 development phases

---

### Option C: "Full Parity" — Aggressive Enhancement

**Philosophy:** Mobile should match tablet experience at reduced fidelity. Push hardware limits with adaptive degradation.

| Area | Enhancement | Triangle Budget | Draw Calls |
|------|-----------|----------------|------------|
| **Login portal** | Full crystal portal + 200 particles + chrome glow + animated tendrils | 40K | 8 |
| **Hero animation** | Full 8-phase 15-second sequence, GPU particles (50K instances), geometry morph | 100K | 15 |
| **Cockpit** | Full cockpit geometry at `billboard`/`low` LOD — all panels, HUD, status bar | 200K | 30 |
| **Lab map** | Full 3D holographic map with geodesic shell, data highways, lab dioramas (low-poly) | 80K | 15 |
| **Game environments** | Full themed 3D environments per game at `low` LOD | 125K per game | 15-20 |
| **NPCs** | 2 simplified ambient NPCs (billboard sprites at distance) | 20K | 2 |
| **Particles** | Full GPU particle system (WebGPU compute) with CSS fallback | 15K | 2 |
| **Post-processing** | Bloom (half-res) + subtle vignette | — | 2 |
| **Dynamic environment** | Simplified fog + minimal weather effects | 10K | 2 |
| **TOTAL SCENE** | | **~500K–700K tri** | **~80-95 calls** |

**Mobile Performance Profile Update:**
```
targetFPS: 30 (WebGL2) / 45 (WebGPU)
maxTriangles: 750_000
lodBias: 'low' (WebGL2) / 'medium' (WebGPU)
bloomEnabled: true (half-res)
postProcessingEnabled: true
shadowsEnabled: false
instancedMeshLimit: 1000
pixelRatio: 1.0 (WebGL2) / 1.5 (WebGPU)
```

**Battery Impact:** High — near-continuous rendering, GPU always active
**Risk Level:** High — older phones (2-3 year old mid-range) will struggle; requires aggressive adaptive LOD
**User Impact:** Maximum — mobile is a true 3D experience matching tablet
**Estimated Build Effort:** 6-8 development phases
**Requires:** WebGPU for acceptable performance; WebGL2 auto-downgrades to Option A behavior

---

### Option D: "Hybrid Smart" — Adaptive Per-Device

**Philosophy:** Detect device capability at runtime and serve the appropriate tier automatically. High-end phones get Option B, mid-range get Option A, low-end get enhanced CSS.

| Device Tier | Detection Method | Experience Level | Triangle Budget |
|-------------|-----------------|------------------|----------------|
| **High-end mobile** | WebGPU + >4GB RAM + recent GPU | Option B (Immersive) | 300K |
| **Mid-range mobile** | WebGL2 + >2GB RAM | Option A (Lite 3D) | 100K |
| **Low-end mobile** | WebGL1 or low RAM | Enhanced CSS (current + improvements) | 0 (CSS only) |

**Additional CSS-only enhancements (all tiers):**
- Improved glassmorphic depth (layered blur, parallax scroll)
- Richer CSS particle system (more particles, varied sizes, trail effects)
- CSS 3D transforms for card flip/tilt interactions
- `backdrop-filter` layering for depth perception
- CSS `perspective` + `transform-style: preserve-3d` for pseudo-3D layouts

**Battery Impact:** Adaptive — each tier tuned for its hardware class
**Risk Level:** Low-Medium — graceful degradation built-in
**User Impact:** High — everyone gets the best their device can handle
**Estimated Build Effort:** 5-6 development phases (builds Option A + B + detection layer)

---

## 4. COMPARISON MATRIX

| Criteria | Option A (Lite) | Option B (Immersive) | Option C (Full Parity) | Option D (Hybrid) |
|----------|:-:|:-:|:-:|:-:|
| **Triangle Budget** | 50K | 255K | 500-700K | 0-300K (adaptive) |
| **Draw Calls** | ~22 | ~50 | ~80-95 | ~0-50 (adaptive) |
| **Battery Impact** | Minimal | Moderate | High | Adaptive |
| **Risk Level** | Low | Medium | High | Low-Medium |
| **Build Effort** | 2-3 phases | 4-5 phases | 6-8 phases | 5-6 phases |
| **WebGL2 Experience** | Full | Reduced | Poor | Full (auto-adapted) |
| **WebGPU Experience** | Full | Full | Full | Full |
| **Old Phone Support** | ✅ Good | ⚠️ Acceptable | ❌ Struggles | ✅ Good |
| **Wow Factor** | Medium | High | Very High | High |
| **User Impact** | High | Very High | Maximum | High |
| **Maintenance Complexity** | Low | Medium | High | Medium-High |
| **Alignment with v3 Vision** | Partial | Strong | Full | Strong |

### Recommendation

**Option D (Hybrid Smart)** is the recommended approach because:
1. It serves the best experience each device can handle
2. Low-end phones don't suffer performance degradation
3. High-end phones get near-desktop immersion
4. The detection layer (`deviceStore.ts` already has the infrastructure) is low incremental cost
5. It future-proofs the platform as mobile GPUs improve year over year

**If simplicity is preferred:** Option A (Lite 3D) provides the highest impact-to-effort ratio and can be upgraded to Option D later.

---

## 5. SOURCES

- [Polycount Forum — Smartphone polygon budgets](https://polycount.com/discussion/130371/polygon-count-for-smartphone-applications)
- [Scope AR — Triangle count best practices](https://help.scopear.com/hc/en-us/articles/14025646295309-Performance-optimization-best-practices-Recommended-maximum-triangle-and-node-counts)
- [Mona — WebGL metaverse limitations](https://docs.monaverse.com/create/mona-crash-course/metaverse-webgl-limitations)
- [Three.js Forum — WebGL performance on all devices](https://discourse.threejs.org/t/webgl-performance-in-all-devices/22234)
- [React Three Fiber — Scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [Codrops — Building efficient Three.js scenes](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)
- [Utsubo — 100 Three.js tips for performance (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [WebGPU — All major browsers now ship it](https://www.webgpu.com/news/webgpu-hits-critical-mass-all-major-browsers/)
- [ByteIota — WebGPU 2026: 70% browser support, 15x perf gains](https://byteiota.com/webgpu-2026-70-browser-support-15x-performance-gains/)
- [Utsubo — What's new in Three.js 2026: WebGPU](https://www.utsubo.com/blog/threejs-2026-what-changed)
- [Apple — WebGPU in iOS 26](https://appdevelopermagazine.com/webgpu-in-ios-26/)
- [Chrome Developers — WebGPU overview](https://developer.chrome.com/docs/web-platform/webgpu/overview)
- [Can I Use — WebGPU support tables](https://caniuse.com/webgpu)
- [Three.js Journey — Performance tips](https://threejs-journey.com/lessons/performance-tips)
- [Wawa Sensei — R3F optimization](https://wawasensei.dev/courses/react-three-fiber/lessons/optimization)
- [MDN — WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)

---

*End of Part A — See Part B for detailed implementation specs per option*
