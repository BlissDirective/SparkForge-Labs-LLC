# Hero v3 Storyboard

**Document version:** 1.0 — Phase 5a deliverable (BRAND_HERO_ACTION_PLAN §8)
**Date:** 2026-04-29
**Branch:** `claude/sparkforge-phase-five-CSSzU`
**Total runtime:** 19.0 s @ 1× / 4.75 s @ 4× fast-forward (locked, decision N4)
**Framework:** GSAP master timeline + Theatre.js sequencer (dev-tunable, no NODE_ENV gate)
**Renderer:** Single-canvas R3F + WebGPU + TSL (decisions D3, N1, N2 — no shader fork)
**Source-of-truth:** `src/lib/branding/sf-material.config.ts` (every color, IOR, dispersion, dichroic, lighting param eye-extracted from `public/branding/IMG_4607.png`)
**Halt rule:** SSIM ≥ 0.96 vs IMG_4607 (palette + structure) and against this storyboard's beat anchor stills (decision N5, Mythos rule)
**User sign-off gate:** Phase 5a halts here. Phase 5b prep (`LensflareTSL.tsx`) does **not** start until this storyboard is approved.

---

## §1. Audit — Current Hero v2 (`src/components/3d/HeroAnimation.tsx`)

The existing 8-phase hero ("v2") is implemented as a single `<group>` rendered inside the persistent `CockpitCanvas` (CPA v2 single-canvas architecture — no canvas swap). The atomic handoff lifecycle is driven by `cockpitStore.setHeroPhase()` ∈ `{'idle' | 'animating' | 'materializing' | 'complete'}` plus `setCockpitReady(true)`. There is **no** `useAtomicHeroToCockpit.ts` hook (the action plan referenced one that doesn't exist) — the handoff is wired through GSAP timeline `onComplete` → store transitions inside `useHeroAnimation.ts` and the GSAP onComplete callback in `HeroScene`.

| # | v2 Label | Time (s) | Camera (proxy) | Subject | Audio |
|---|---|---|---|---|---|
| 1 | `void` | 0.0 → 2.0 | (0,0,1.5) → (0,0,2.5), fov 35 | Particles (200 cyan points), ambient cyan light | Brown rumble lp 80→200Hz, sub-bass 40Hz 0→0.3 |
| 2 | `assembly` | 2.0 → 4.5 | (0,0,2.5) → (0,0,5.0), fov 35→50 | Logo box (6×1.5×0.5) `back.out(1.7)` scale 0→1 | Whoosh bp 200→2000Hz, MembraneSynth C1 + MetalSynth clang at t≈4.0, GrainPlayer chimes |
| 3 | `showcase` | 4.5 → 7.5 | Orbit r=3.0, full revolution, lookAt origin | Logo emissive 0→0.5 | PolySynth Cmaj7 chord (C4-E4-G4-B4), pink whoosh Panner3D circling |
| 4 | `surge` | 7.5 → 10.0 | (continued orbit), camera shake 0→0.03 | Logo emissive 0.5→3.0 | Stochastic crackle (50–150ms), saw tension sweep 100→800Hz, brown thunder 0→0.4 |
| 5 | `shatter` | 10.0 → 11.5 | fov 53→55→53 (impact zoom), shake spike 0.08→0 in 1.4s | Logo scale→0 in 0.3s; ~150–500 Voronoi shards burst with physics (gravity −4.5, damping 0.985); bloom flash sphere spike→0 over 1s | MembraneSynth C0 sub-drop, Player `glass-shatter.mp3`, GrainPlayer `glass-fragments.mp3` debris through FeedbackDelay echo |
| 6 | `regroup` | 11.5 → 14.0 | Reset to (0,0,5), fov 56 | Shards continue tumbling + opacity fade to 0 by 14.0 | MetalSynth decel sweep 4kHz→200Hz, pink migration drone (HRTF Panner3D), cockpit hum 55Hz rises −20→−12dB |
| 7 | `materialize` | 14.0 → 17.0 | (0,0,5) → (0, 6.5, 7), fov 58, lookAt (0,3,0) | `cockpitStore.setHeroPhase('materializing')` → cockpit groups fade in; hero shards already hidden | Aurora pad Am7 (A3-C4-E4-G4) +0.0s, LED buzz +0.4s, panel clunk +0.8s, digital chirp arpeggio +1.2s, HUD ring (C5-G5-C6) +1.6s, gauge clicks (3×) +2.0s, cockpit hum to −6dB |
| 8 | `online` | 17.0 → 19.0 | Settle at materialize end pose | GSAP `onComplete` → `setHeroPhase('complete')` + `setCockpitReady(true)` | FM sweep power-up C5, persistent cockpit ambient 55Hz @ −6dB (carries over to cockpit's own audio engine) |

**Skip / fast-forward semantics (preserved verbatim in v3):**
- `prefers-reduced-motion: reduce` → instant skip to phase 8 final state
- `uiStore.skipIntroAnimation === true` → skip on every visit *except* first (localStorage `sparkforge-hero-seen`)
- Click / Enter / Space → `timeScale = 4.0` (4× fast-forward, audio synced by progress not transport time → no pitch shift)
- Escape → `actions.skipToEnd()` (immediate cockpit handoff)

**v2 issues to fix in v3 (informs the new beat sheet):**
1. Logo subject is a generic 6×1.5×0.5 `BoxGeometry` — does not carry SparkForge brand DNA. v3 replaces with `<SfMark3D>` (Phase 2) + `<SparkForgeWordmark3D>` (Phase 3) using `BrandingMaterial` (Phase 1).
2. Voronoi shards source from a generic box — v3 sources from the Phase-2 SF mark `ExtrudeGeometry` so the shatter is brand-faithful.
3. No lens flare / volumetric god-rays / dichroic bloom — v3 adds `<LensflareTSL>` (Phase 5b prep) at warm-amber lower-left + cool-cyan upper-right anchor positions from `SF_BRAND.LENS_FLARES`.
4. Camera path is mostly z-axis dolly — v3 adds parallax sweeps and a final upward lookAt(0,3,0) tilt that telegraphs the cockpit horizon emergence.
5. Audio cue boundaries (2.0 / 4.5 / 7.5 / 10.0 / 11.5 / 14.0 / 17.0) get **remapped** to v3 beat boundaries (2.5 / 5.0 / 8.0 / 11.0 / 14.0 / 16.5 / 18.5) — see §11 audio remap.

---

## §2. Hero v3 — Beat Sheet (Overview)

| # | Beat | Time (s) | Δ | Camera move | Primary subject | Out-trigger |
|---|---|---|---|---|---|---|
| 1 | **Void Awakening** | 0.0 → 2.5 | 2.5 | (0, 0, 16) → (0, 0, 12) slow dolly-in | Starfield + cyan radial streaks (`BACKGROUND.streaks` from sf-material.config) on `voidNavy #02050d` | First dispersion-spark visible at t≈2.4 |
| 2 | **Ignition Spark** | 2.5 → 5.0 | 2.5 | (0, 0, 12) → (−1.4, +0.6, 9.2) ease-out + slight rotate-around-Y +0.18 rad | Two `<LensflareTSL>` mount: warm-amber lower-left + cool-cyan upper-right; `intensityMul` animated 0 → 1.4 → 1.0 | Lensflares peak; particles converge to S anchor |
| 3 | **S Crystallization** | 5.0 → 8.0 | 3.0 | (−1.4, +0.6, 9.2) → (−0.4, +0.2, 7.5) ease-in-out, lookAt SfMark center | `<SfMark3D>` S-glyph fades in (`transmission` 0 → 0.97; `dispersionStrength` peaks at 0.108 then settles to 0.072), italic 3.4° lean already applied | S material fully resolved; F anchor highlights |
| 4 | **F Mirror + Shard Burst** | 8.0 → 11.0 | 3.0 | (−0.4, +0.2, 7.5) → (+0.4, +0.2, 7.5) lateral dolly + +5° tilt-up | F mirrors S's ignition (same TSL fade-in); `<SfShardSet>` (Phase 5b.2) briefly assembles into F THEN explodes outward at t=10.0 with cyan-magenta gradient trail | Shards mid-burst; wordmark anchors sweep in |
| 5 | **Wordmark Cascade** | 11.0 → 14.0 | 3.0 | (+0.4, +0.2, 7.5) → (0, +0.4, 9.5) pull-back + center | `<SparkForgeWordmark3D revealMask>` animated `[0,5]` → `[0,1,5]` → `[0,1,2,5]` ... → `[0..9]` left-to-right; electric arcs (`electricVeins.frag`) bind glyphs as they appear | All 10 letters resolved; dichroic intensity ramping |
| 6 | **Dichroic Bloom** | 14.0 → 16.5 | 2.5 | (0, +0.4, 9.5) → (0, +0.6, 10.5) gentle pull-back, breath-rate float | Wordmark `dichroicIntensity` 1.0 → 1.6 → 1.0; both lensflares peak again (`intensityMul` 1.0 → 1.8); HDRI env intensity 2.4 → 3.0 → 2.4 | Wordmark drifts upward; cockpit silhouette begins |
| 7 | **Cockpit Materialization** | 16.5 → 18.5 | 2.0 | (0, +0.6, 10.5) → (0, +6.0, 7.5), fov 50 → 58, lookAt (0, +3.0, 0) | Wordmark drifts up + slight scale 1.0 → 0.85; cockpit groups fade in (`cockpitStore.setHeroPhase('materializing')`); holographic horizon emerges from below | Cockpit fully materialized; wordmark dissolving |
| 8 | **Atomic Handoff** | 18.5 → 19.0 | 0.5 | settle at (0, +6.0, 7.5), no further camera movement | Wordmark dissolves into cockpit's central holographic display (`opacity` 1 → 0, scale 0.85 → 0); GSAP `onComplete` fires → `setHeroPhase('complete')` + `setCockpitReady(true)` | Hero loop ends; cockpit interactivity unlocked |

**Beat-boundary rationale (locked in this storyboard):**
- 2.5 s for Beat 1 — long enough for void dread + dolly-in to register without being self-indulgent
- 2.5 s for Beat 2 — flares grow and resolve before the eye anchors on S
- 3.0 s each for Beats 3, 4, 5 — three "main event" beats sharing equal screen time (S birth, F mirror+burst, full-word arrival)
- 2.5 s for Beat 6 — dichroic breath, allows audience to register the brand mark before motion resumes
- 2.0 s for Beat 7 — fast cockpit fade-in keeps perceived runtime under 19 s; longer would feel like a load screen
- 0.5 s for Beat 8 — atomic handoff is intentionally tight; longer crossfades feel like a transition, not an arrival

**Total:** 2.5 + 2.5 + 3.0 + 3.0 + 3.0 + 2.5 + 2.0 + 0.5 = **19.0 s** ✅ matches N4 lock.

---

## §3. Beat 1 — Void Awakening (0.0 → 2.5 s)

| Aspect | Detail |
|---|---|
| **Camera** | start `(0, 0, 16)`, end `(0, 0, 12)` — slow z-only dolly-in. Easing `power1.inOut`. fov 35 (locked, no change in this beat). |
| **lookAt** | `(0, 0, 0)` static |
| **Background** | `voidNavy #02050d` clear color; faint cyan radial streaks (`BACKGROUND.streaks` from sf-material.config) at 12% opacity, slow horizontal drift (~0.005 rad/s) |
| **Subjects mounted** | • 200-particle cyan starfield (drei `<Points>`, `pointsMaterial size={0.03} color={rimCyan}`) — opacity 0 → 0.4 over 2.0 s<br>• Empty branding scene root (no glyphs visible yet) |
| **Lighting** | env intensity 30% of locked 2.4 (i.e. 0.72) ramping to 50% (1.2) by t=2.5; Key + Rim both at 0% (start dark) |
| **Material state** | `BrandingMaterial` instances pre-warmed (compileAsync via R3F `gl.compile()`) but not yet mounted to a mesh |
| **Key visual events** | • t=0.0 black-out → first particles fade in around t=0.4<br>• t=1.5 cyan streaks become legible<br>• t=2.4 first dispersion-spark glints lower-left (telegraph for Beat 2's amber lensflare) |
| **Audio cues (existing v2 nodes reused)** | • Brown rumble `voidNodes.rumble` start @ t=0.0; lowpass filter sweep 80→200 Hz over 2.5 s (was 2.0 in v2 — extended)<br>• Sub-bass 40 Hz sine `voidNodes.subBass` start @ t=0.0; gain 0 → 0.3 over 2.5 s<br>• Optional whisper of `assemblyNodes.whoosh` *fade-in* prepping for beat 2 (gain 0 → 0.05) |
| **Performance** | < 8 draw calls. Single particle buffer + skybox quad. 0 TSL emissive evaluations (BrandingMaterial not yet rendering). |
| **Out-trigger** | `t >= 2.5` AND first dispersion-spark visible (`spark.opacity >= 0.6`) |
| **Theatre.js sequence** | `Hero v3` sheet → `Beat1_VoidAwakening` track. Tunable: dolly-end-z, particle-fade-rate, streak-drift-rate. |

---

## §4. Beat 2 — Ignition Spark (2.5 → 5.0 s)

| Aspect | Detail |
|---|---|
| **Camera** | start `(0, 0, 12)`, end `(−1.4, +0.6, 9.2)` — diagonal dolly-in with subtle parallax. Easing `power2.inOut`. fov 35 → 38 (mild zoom-in). |
| **lookAt** | start `(0, 0, 0)`, end `(−0.2, +0.1, 0)` — tracks toward where S will appear |
| **Subjects mounted** | • Starfield + streaks (continuing from Beat 1, opacity holding at 0.4)<br>• `<LensflareTSL flare={0}>` warm-amber lower-left at world `(−2.6, −1.4, 0)` (`SF_BRAND.LENS_FLARES[0]`)<br>• `<LensflareTSL flare={1}>` cool-cyan upper-right at world `(+2.8, +1.6, 0)` (`SF_BRAND.LENS_FLARES[1]`) |
| **Animated uniforms (per lensflare)** | • `intensityMul`: 0 → 1.4 (peak at t≈4.0) → 1.0 (settle at t=5.0)<br>• `coreScale`: 0 → 1.0 (ease-out, peaks t≈3.8)<br>• `streakScale`: 0 → 1.4 (peak t≈4.0) → 1.2 (settle) |
| **Lighting** | Key (warm `keyAmber #ffaa55`) intensity 0 → 6.8 (locked); Rim (cool `rimCyan #7fe8ff`) 0 → 4.4; Fill `voidNavyLift #070a14` 0 → 0.6. All ramp linearly across 2.5 s. |
| **Volumetric** | God-rays (Phase 5b prep — to be added if `<LensflareTSL>` exposes a volumetric streak slot): warm-amber rays from lower-left light source, opacity 0 → 0.45 |
| **Particle behavior** | Starfield particles begin convergence — random outward positions ease toward an attractor at `(−0.4, +0.2, 0)` (the S anchor). Easing `power3.inOut`. Convergence completes by t=5.0 (all 200 particles within radius 0.8 of attractor). |
| **Key visual events** | • t=2.5 amber spark hot-core appears lower-left, cyan halo upper-right<br>• t=3.4 anamorphic streaks at full length, both flares cross-illuminate the dark center<br>• t=4.0 peak intensity (lensflare `intensityMul=1.4`)<br>• t=4.8 particles cluster tight at S anchor; flare intensities settle |
| **Audio cues (existing v2 nodes remapped)** | • Whoosh `assemblyNodes.whoosh` ramps from 0.05 → full; bandpass 200 → 1200 Hz over 2.5 s<br>• Impact `assemblyNodes.impact.triggerAttackRelease('C1', '8n')` at t=4.0 (warm-amber peak)<br>• Clang `assemblyNodes.clang.triggerAttackRelease('16n')` at t=4.0 (cool-cyan peak)<br>• GrainPlayer `assemblyNodes.grainChimes` start @ t=3.0 if `/audio/glass-chime.mp3` loaded |
| **Performance** | LensflareTSL: 2 instances × 2 meshes (hot core sphere + streak plane). Total +4 draw calls, both `MeshBasicNodeMaterial` with `AdditiveBlending`. |
| **Out-trigger** | `t >= 5.0` AND lensflare `intensityMul == 1.0` settle confirmed (no overshoot bounce) AND particle convergence ≥ 95% complete |
| **Theatre.js sequence** | `Beat2_IgnitionSpark` track. Tunable: per-flare position, intensity-curve shape, streak-angle, particle-attractor-position. |

---

## §5. Beat 3 — S Crystallization (5.0 → 8.0 s)

| Aspect | Detail |
|---|---|
| **Camera** | start `(−1.4, +0.6, 9.2)`, end `(−0.4, +0.2, 7.5)` — pull-in toward S, slight rise to eye-level. Easing `power2.inOut`. fov 38 → 40. |
| **lookAt** | tracks the SfMark group center (auto-recentered via `Box3` measurement after mount) |
| **Subjects mounted** | • `<SfMark3D revealMask={['sf-mark-S']}>` — only the S path visible; F path mesh exists but `visible={false}`<br>• Starfield + streaks fading down (opacity 0.4 → 0.15)<br>• Lensflares holding at `intensityMul=1.0` |
| **Material animation (S only)** | • `transmission` 0 → 0.97 (locked) — `power2.out` ease, t=5.0 → 6.5<br>• `dispersionStrength` overshoots: 0 → 0.108 (peak t=6.2) → 0.072 (settle by t=7.0)<br>• `dichroicIntensity` 0 → 1.0 (linear t=5.5 → 7.5)<br>• `clearcoat` 0 → 1.0 (linear t=5.0 → 7.0)<br>• `emissiveIntensity` 0 → 0.8 (peak t=6.5) → 0.3 (settle by t=8.0) |
| **Particle behavior** | The 200 converged particles dissolve INTO the S geometry — outward radial decay, opacity 0.4 → 0 over t=5.0 → 6.0. Effect: particles "ignite" the S. |
| **Geometry** | Phase-2 SF mark `ExtrudeGeometry` (depth 32% of 650u cap-height, bevel 7.2%, 12 bevel segments, 24 curve segments). Italic 3.4° lean via group rotation Y. Per-instance `BrandingMaterial` (TSL node material — sharing breaks uniform isolation). |
| **Lighting** | Locked rig (key 6.8 / rim 4.4 / fill 0.6) holds steady. Procedural HDRI (E2 — drei `<Environment frames={1}>` with palette-locked `<Lightformer>` rig) at full env intensity 2.4. |
| **Key visual events** | • t=5.2 first dispersion shimmer visible at S edges (cyan-magenta-amber spectral split)<br>• t=6.2 dispersion peaks — S edges show hottest chromatic bloom (especially upper-right rim where `keyAmber` meets `rimCyan`)<br>• t=7.0 dichroic film coating fully resolved (rim Cyan → dispersion Magenta → key Amber band sweep)<br>• t=7.8 F anchor position (mirror reflection across Y axis) starts highlighting — telegraphs Beat 4 |
| **Audio cues (existing v2 nodes remapped)** | • Showcase hum `showcaseNodes.hum.triggerAttack(['C4','E4','G4','B4'])` @ t=5.0 — 4-voice Cmaj7<br>• Pink whoosh `showcaseNodes.whoosh` start @ t=5.0; Panner3D circles (cos×2.4, sin×2.4) but slower than v2 (full revolution over 3.0 s)<br>• Subtle `surgeNodes.tensionSweep` *fade-in* prepping for Beat 4 (gain 0 → 0.08, sawtooth filter LP 100 → 400 Hz) |
| **Performance** | SfMark S only = 1 mesh × 1 BrandingMaterial. Per-frame TSL emissive eval cost: ~0.3 ms on WebGPU desktop-ultra (measured Phase 2). |
| **Out-trigger** | `t >= 8.0` AND `transmission >= 0.97` AND `dispersionStrength == 0.072 ± 0.001` |
| **Theatre.js sequence** | `Beat3_SCrystallization` track. Tunable: dispersion-overshoot-amount, dichroic-ramp-curve, particle-decay-shape, emissive-peak-time. |

---

## §6. Beat 4 — F Mirror + Shard Burst (8.0 → 11.0 s)

| Aspect | Detail |
|---|---|
| **Camera** | start `(−0.4, +0.2, 7.5)`, end `(+0.4, +0.2, 7.5)` — lateral dolly across to F position + 5° tilt-up at end. Easing `power2.inOut`. fov 40 → 42 → 40 (subtle breathe at peak). |
| **lookAt** | start S center `(−0.4, +0.2, 0)`, end F center `(+0.4, +0.2, 0)` |
| **Subjects mounted** | • `<SfMark3D revealMask={['sf-mark-S','sf-mark-F']}>` — F now visible<br>• `<SfShardSet>` (Phase 5b.2 — Voronoi pre-fracture from F's `ExtrudeGeometry` via `three-bvh-csg`). Initial state: shards assembled into F shape. ~150–500 shards depending on GPU tier. |
| **F Material animation** | Same as S in Beat 3 but compressed to 1.0 s (t=8.0 → 9.0): `transmission` 0 → 0.97; `dispersionStrength` 0 → 0.108 → 0.072; `dichroicIntensity` 0 → 1.0; `emissiveIntensity` 0 → 1.2 → 0.5 (hotter peak than S — telegraphs the upcoming burst). |
| **Shard burst (t=10.0 detonation)** | • `<SfShardSet>` switches from "assembled F" pose to "exploding outward"<br>• Per-shard physics: random outward velocity 2.5–6.0 u/s (biased upward +1.5 u/s), angular velocity ±6 rad/s on each axis, gravity −4.5 u/s², damping 0.985, angular damping 0.99 (matches v2 physics constants — proven aesthetic)<br>• Shard count tier: WebGPU-ultra 500 / WebGPU-high 350 / WebGPU-mid 250 / non-WebGPU 150<br>• Each shard's `BrandingMaterial` instance gets a per-shard cyan→magenta gradient via `vertexColors` attribute — burst trail reads as a chromatic spray |
| **Bloom flash (10.0–11.0)** | Additive bloom sphere at F center: `emissiveIntensity` 0 → 4.0 (instant @ 10.0) → 0 (decay over 1.0 s, `power4.out`); scale 1.0 → 1.8 → 1.0; opacity 0.7 → 0 |
| **Camera shake** | `shakeIntensity` 0 → 0.08 instantaneous spike at t=10.0, decay to 0 over 1.0 s `expo.out` |
| **Lensflares** | Both flare `intensityMul` spike 1.0 → 2.2 (peak t=10.05) → 1.0 (decay by 11.0); `streakScale` 1.2 → 1.8 → 1.2 |
| **Key visual events** | • t=8.0 → 9.0 F crystallizes (mirror of S)<br>• t=9.0 → 9.8 brief settle, both glyphs at peak material fidelity<br>• t=9.8 → 10.0 audible/visual tension build (camera shake creeps to 0.03)<br>• **t=10.0 detonation** — F geometry "shatters" into shard set; bloom flash; camera spike; lensflare double-pulse<br>• t=10.0 → 11.0 shards tumble outward + start fading; bloom decays |
| **Audio cues (existing v2 nodes remapped)** | • Surge buildup `surgeNodes.tensionSweep` 100 → 800 Hz over t=8.0 → 10.0; brown thunder gain 0 → 0.4<br>• Stochastic crackle `surgeNodes.crackle` 50–150 ms intervals during 8.0 → 10.0<br>• **Detonation** at t=10.0: `shatterNodes.subDrop.triggerAttackRelease('C0','4n')`, `glassShatter.start()` (`/audio/glass-shatter.mp3` if loaded), `debris.start()` GrainPlayer through `FeedbackDelay echo` |
| **Performance** | Shard burst is the highest-cost frame. WebGPU compute path (E3): cell-center generation on GPU (~3–5 ms vs CPU 60 ms). Per-frame: shard count × `BrandingMaterial` eval + bloom pass. Budget: ≤ 16 ms on WebGPU desktop-ultra. |
| **Out-trigger** | `t >= 11.0` AND shard opacity ≤ 0.4 (most are visible but fading) AND camera shake ≤ 0.001 |
| **Theatre.js sequence** | `Beat4_FMirrorAndShardBurst` track. Tunable: detonation-time, shard-velocity-range, bloom-peak-intensity, lensflare-double-pulse-amplitude. |

---

## §7. Beat 5 — Wordmark Cascade (11.0 → 14.0 s)

| Aspect | Detail |
|---|---|
| **Camera** | start `(+0.4, +0.2, 7.5)`, end `(0, +0.4, 9.5)` — pull-back + recenter for full-word framing. Easing `power1.inOut`. fov 40 → 42. |
| **lookAt** | tracks centroid of currently-visible letters in `<SparkForgeWordmark3D>` (auto-recenter prop). |
| **Subjects mounted** | • `<SparkForgeWordmark3D revealMask={...}>` — animated reveal sequence<br>• `<SfMark3D>` unmounted at t=11.0 (S+F responsibility transfers to wordmark's index-0 + index-5 entries — same path d-strings, no visual discontinuity)<br>• `<SfShardSet>` continuing to fade out (opacity → 0 by t=12.0) |
| **revealMask animation** | Frame-by-frame letter pop-in (cap each at ~0.28 s before next):<br>• t=11.00 — `[0,5]` (S, F — already visible from Beat 4)<br>• t=11.30 — `[0,1,5]` (+ p)<br>• t=11.55 — `[0,1,2,5]` (+ a)<br>• t=11.80 — `[0,1,2,3,5]` (+ r)<br>• t=12.05 — `[0,1,2,3,4,5]` (+ k)<br>• t=12.40 — `[0,1,2,3,4,5,6]` (+ o)<br>• t=12.70 — `[0,1,2,3,4,5,6,7]` (+ r)<br>• t=13.00 — `[0,1,2,3,4,5,6,7,8]` (+ g)<br>• t=13.30 — `[0,1,2,3,4,5,6,7,8,9]` (+ e — full word)<br>• t=13.30 → 14.0 settle |
| **Per-letter pop-in** | Each new letter mounts its `BrandingMaterial` mesh with `transmission` 0 → 0.97 over 0.20 s; `emissiveIntensity` 0 → 0.6 → 0.3 (overshoot then settle) over 0.30 s. Identical curve to Beat 3's S — visual rhyme. |
| **Electric arcs (`electricVeins.frag`)** | Between each new letter and its predecessor: a brief electric arc traces from the previous letter's right edge to the new letter's left edge. Arc duration 0.15 s, dies before next letter pops. Color: `dispersionMag #ff5fc8` core, `rimCyan #7fe8ff` halo. Reuses the existing `electricVeins.frag` shader if present in `src/shaders/`; otherwise port to TSL during 5b. |
| **Lighting** | Locked rig holds. Env intensity 2.4. |
| **Lensflares** | Both lensflares hold at `intensityMul=1.0`. Both shift slightly with camera dolly (parallax) so they don't feel pinned to screen-space. |
| **Audio cues (existing v2 nodes remapped)** | • Decel sweep `regroupNodes.decel.triggerAttackRelease('2n')` @ t=11.0 (filter sweep 4 kHz → 200 Hz over 1.0 s — masks the shatter ringout)<br>• Migration drone `regroupNodes.migrationDrone` HRTF Panner3D start @ t=11.0<br>• **Per-letter chimes** — for each new letter pop-in, trigger one `assemblyNodes.clang.triggerAttackRelease('32n')` at the corresponding t (8 chimes total, ascending pitch C5 → G5 across the cascade)<br>• Cockpit hum `regroupNodes.cockpitHum` start @ t=11.5; gain ramp −20 → −12 dB by t=14.0 |
| **Performance** | Up to 10 BrandingMaterial instances (one per letter). Each evaluates TSL emissive `Fn` per fragment. Budget: ≤ 12 ms/frame on WebGPU desktop-ultra. |
| **Out-trigger** | `t >= 14.0` AND `revealMask.length === 10` AND all letter `transmission >= 0.97` |
| **Theatre.js sequence** | `Beat5_WordmarkCascade` track. Tunable: per-letter-pop-time-array (10 × float), arc-color, arc-duration, settle-tail-length. |

---

## §8. Beat 6 — Dichroic Bloom (14.0 → 16.5 s)

| Aspect | Detail |
|---|---|
| **Camera** | start `(0, +0.4, 9.5)`, end `(0, +0.6, 10.5)` — gentle pull-back + slight rise; subtle "breathing" float (sin LFO ±0.04 u on Y axis, period 2.5 s). Easing `power1.inOut`. fov 42 → 44. |
| **lookAt** | wordmark centroid `(0, 0, 0)` (after auto-recenter) |
| **Subjects mounted** | Full `<SparkForgeWordmark3D>` (all 10 letters); lensflares both still mounted; starfield holding at 0.15 opacity (subtle background); shards now fully unmounted/disposed |
| **Material animation (all 10 letters synchronized)** | • `dichroicIntensity`: 1.0 → 1.6 (peak t=15.2) → 1.0 (settle t=16.5). Animated via shared `MaterialOptions` controller — single TSL uniform broadcast.<br>• `dispersionStrength`: 0.072 → 0.090 (peak t=15.2) → 0.072. Subtle but visible — chromatic edge band widens.<br>• `emissiveIntensity`: 0.3 → 0.55 (peak t=15.0) → 0.3.<br>• `clearcoat` and `transmission` hold steady. |
| **HDRI env** | Env intensity 2.4 → 3.0 (peak t=15.2) → 2.4. Drei `<Environment>` exposure animated via `intensity` prop. |
| **Lensflares** | Both flares peak again — `intensityMul` 1.0 → 1.8 → 1.0; `coreScale` 1.0 → 1.3 → 1.0; `streakScale` 1.2 → 1.6 → 1.2. The double-bloom (light-source + material) is the visual signature beat. |
| **Volumetric god-rays** | Warm-amber rays from lower-left lensflare pass through the wordmark; opacity 0 → 0.35 → 0.15 over the beat. Gives the bloom physical substance. |
| **Key visual events** | • t=14.0 → 15.2 dichroic intensity ramps; chromatic edge bloom widens; lensflares grow<br>• t=15.2 **peak bloom** — wordmark looks like it is illuminated from inside; god-rays at fullest, dichroic film at hottest; entire frame near-white in highlights<br>• t=15.2 → 16.5 settle back to baseline; this prepares the eye for the cockpit-emergence color shift in Beat 7 |
| **Audio cues (existing v2 nodes remapped)** | • Aurora pad `materializeNodes.auroraPad.triggerAttack(['A3','C4','E4','G4'])` — soft swell @ t=14.0 (Am7 — minor with major-7 brightness, foreshadowing cockpit's color)<br>• HUD ring `materializeNodes.hudRing.triggerAttackRelease(['C5','G5','C6'], '8n')` @ t=15.2 (peak bloom — chord coincides with visual peak)<br>• Cockpit hum continues, gain ramp −12 → −6 dB by t=16.5<br>• Migration drone `regroupNodes.migrationDrone.stop()` @ t=16.5 (clean handoff to materialize palette) |
| **Performance** | Same draw-call count as Beat 5. Higher per-fragment cost during peak bloom (god-ray volumetric pass). Budget: ≤ 14 ms/frame on WebGPU desktop-ultra. |
| **Out-trigger** | `t >= 16.5` AND `dichroicIntensity == 1.0 ± 0.01` |
| **Theatre.js sequence** | `Beat6_DichroicBloom` track. Tunable: peak-time-offset (default t=15.2 → moveable), peak-amplitude (default 1.6 → 1.4–1.8 range), god-ray-opacity-curve, breath-LFO-amplitude. |

---

## §9. Beat 7 — Cockpit Materialization (16.5 → 18.5 s)

| Aspect | Detail |
|---|---|
| **Camera** | start `(0, +0.6, 10.5)`, end `(0, +6.0, 7.5)` — strong upward + forward arc. Easing `power2.inOut`. fov 44 → 58 (wide-angle reveal of cockpit space). |
| **lookAt** | start wordmark centroid `(0, 0, 0)`, end cockpit-horizon focal point `(0, +3.0, 0)` — interpolated linearly. Camera pitches up ~22°. |
| **Subjects in transition** | • `<SparkForgeWordmark3D>` drifts upward (group `position.y` 0 → +1.4 over the beat) and slightly shrinks (`scale` 1.0 → 0.85); opacity holds at 1.0 until Beat 8<br>• Cockpit groups (existing `<CockpitCanvas>` interior children) fade in: `cockpitStore.setHeroPhase('materializing')` fires @ t=16.5 → cockpit's existing materialize choreography runs in parallel<br>• Lensflares fade out: `intensityMul` 1.0 → 0 (`power2.in`) by t=18.0 — they belong to the hero light setup, not the cockpit |
| **Cockpit-side animations (driven by existing cockpit code, not this storyboard)** | The cockpit's spatial dashboard, holographic lab map, NPCs, and dynamic environment all begin their materialize sequence on `setHeroPhase('materializing')`. This storyboard does NOT redefine cockpit interior — it is the *receiver* of the handoff. Reference: `Cockpit-Interface-Plan.md`. |
| **Hero light fade** | Key (warm amber) intensity 6.8 → 4.0 over t=16.5 → 18.5; Rim (cool cyan) 4.4 → 2.5; Fill 0.6 → 0.4. Cockpit's own ambient + key lights ramp up to compensate (existing cockpit lighting code). Net frame luminance stays roughly constant — no flash. |
| **HDRI env** | Hero env intensity 2.4 → 1.2 (cockpit's own env will reach 1.5 by t=18.5). Sphere texture unchanged. |
| **Background** | `voidNavy` lifts to `voidNavyLift #070a14` (5% lighter) over t=16.5 → 18.5; cockpit's own background (deeper holographic horizon) layers behind. |
| **Key visual events** | • t=16.5 cockpit silhouette begins emerging from below frame (holographic horizon line)<br>• t=17.0 first NPC + console outline visible<br>• t=17.5 wordmark drifting upward, cockpit consoles at full opacity 0.6<br>• t=18.0 lensflares fully extinguished; cockpit at full geometric resolution<br>• t=18.5 wordmark hovering above cockpit central display, ready for handoff |
| **Audio cues (existing v2 nodes remapped — full materialize bank)** | • LED buzz snap `materializeNodes.ledBuzz` @ t=16.9 (panel power-on)<br>• Panel clunk `materializeNodes.panelClunk` @ t=17.3 (heavy chassis engaging)<br>• Digital chirp arpeggio (4 notes @ 50 ms stagger) `materializeNodes.digitalChirp` @ t=17.7 (system boot)<br>• Gauge clicks (3 hits @ 100 ms stagger) `materializeNodes.gaugeClick` @ t=18.1 (instruments calibrating)<br>• Cockpit hum continues at −6 dB (locked level for cockpit interactivity phase) |
| **Performance** | Highest-cost beat (hero + cockpit both rendering, materializing). Cockpit asset budget: 37.8M tris (Cockpit Upgrade locked). Budget: ≤ 18 ms/frame on WebGPU desktop-ultra. |
| **Out-trigger** | `t >= 18.5` AND cockpit `setHeroPhase('materializing')` callback fired AND wordmark scale ≤ 0.85 |
| **Theatre.js sequence** | `Beat7_CockpitMaterialization` track. Tunable: camera-arc-shape (start-rise-rate vs end-zoom-rate), wordmark-drift-amount, hero-light-fade-curve, cockpit-fade-in-overlap-window. |

---

## §10. Beat 8 — Atomic Handoff (18.5 → 19.0 s)

| Aspect | Detail |
|---|---|
| **Camera** | hold at `(0, +6.0, 7.5)`, fov 58, lookAt `(0, +3.0, 0)`. **No further movement.** This is intentional — the cockpit is "yours" now; the camera is a steady observer. |
| **Wordmark dissolution** | • `position.y` +1.4 → +1.9 (continued upward drift)<br>• `scale` 0.85 → 0 (`power3.in` — accelerates into nothing)<br>• `opacity` 1.0 → 0 (`power2.in` — fades faster than scale)<br>• `dispersionStrength` boosted to 0.140 during dissolve (last visible chromatic flare as the wordmark scatters) |
| **Cockpit holographic display** | The wordmark's final position/scale matches the cockpit's central holographic-display anchor point. As the wordmark dissolves, the holographic display lights up with its own content (existing cockpit code). Visual reading: "the wordmark *became* the display." |
| **Final emissive flash** | A brief soft flash at the wordmark's last position: cyan-magenta-amber tri-color burst, opacity 0 → 0.3 → 0 over 0.4 s (t=18.55 → 18.95). Reads as the moment the brand identity dissolves into the platform. |
| **Hero light** | All hero lights at 0 intensity by t=19.0. Cockpit lights at full. |
| **Lifecycle events (CRITICAL — atomic handoff)** | • t=18.5 → trigger ramp-out animations<br>• t=18.95 → wordmark scale ≤ 0.05, opacity ≤ 0.05<br>• **t=19.00 — GSAP `tl.onComplete()` fires:**<br>&nbsp;&nbsp;&nbsp;&nbsp;1. `useCockpitStore.getState().setHeroPhase('complete')`<br>&nbsp;&nbsp;&nbsp;&nbsp;2. `useCockpitStore.getState().setCockpitReady(true)`<br>&nbsp;&nbsp;&nbsp;&nbsp;3. `actions.setComplete()` — fires the `onComplete` callback up to `<HeroAnimation>` parent<br>&nbsp;&nbsp;&nbsp;&nbsp;4. Hero `<HeroScene>` returns `null` on next render (state.isComplete short-circuit at line 518 of v2 — preserved verbatim)<br>&nbsp;&nbsp;&nbsp;&nbsp;5. The `<canvas>` DOM node **does not** unmount — cockpit children continue rendering inside it |
| **CPA v2 single-canvas verification (HS-9 hard stop)** | The handoff is ONE GSAP onComplete callback + a flag flip in cockpitStore. There is no canvas swap, no remount, no key change, no opacity-crossfade between two `<Canvas>` siblings. Devtools verification: same `<canvas>` DOM node from t=0 through t=19+ uninterrupted. |
| **Audio cues** | • FM sweep power-up `onlineNodes.powerUp.triggerAttackRelease('C5','4n')` @ t=18.5 (climactic system-online tone)<br>• `onlineNodes.cockpitAmbient` start @ t=18.5 — persistent 55 Hz sine at −6 dB. **Not disposed** at hero end — it carries forward into the cockpit's own audio engine (existing v2 behavior preserved verbatim). |
| **Performance** | Light frame — most hero subjects unmounting. Budget: ≤ 12 ms/frame. |
| **Out-trigger** | `tl.time() >= 19.0` AND `setCockpitReady(true)` fired |
| **Theatre.js sequence** | `Beat8_AtomicHandoff` track. Tunable: dissolve-curve-shape, final-flash-duration, final-flash-color-mix (cyan/mag/amber ratios). |

---

## §11. Audio Cue Remap — v2 → v3

The existing `HeroAudioTimeline` class (`src/lib/audio/heroAudio.ts`, 807 lines) constructs all 8 phase node groups in `initialize()` and triggers them via `syncToProgress(progress)` in the `useFrame` callback. v3 reuses **every existing node** — only the trigger timestamps in `syncToProgress` change. No new audio assets needed; audio file dependencies (`/audio/glass-chime.mp3`, `/audio/glass-shatter.mp3`, `/audio/glass-fragments.mp3`) graceful-degrade as today.

| v2 Node Group | v2 Window (s) | v3 Window (s) | v3 Beat | Trigger remap |
|---|---|---|---|---|
| `voidNodes.rumble` (brown noise lp80→200Hz) | 0.0 → 2.0 | 0.0 → 2.5 | Beat 1 | Filter sweep window stretched 2.0 → 2.5 s |
| `voidNodes.subBass` (40 Hz sine) | 0.0 → 2.0 | 0.0 → 2.5 | Beat 1 | Gain ramp window stretched |
| `assemblyNodes.whoosh` (white noise bp 200→2000 Hz) | 2.0 → 4.5 | 2.5 → 5.0 | Beat 2 | Filter sweep target 1200 Hz (was 2000) — softer, less harsh peak |
| `assemblyNodes.impact` (MembraneSynth C1) | once @ ~4.0 | once @ 4.0 | Beat 2 | Trigger time unchanged (still warm-amber peak) |
| `assemblyNodes.clang` (MetalSynth) | once @ ~4.0 | once @ 4.0 + once per letter (Beat 5) | Beat 2, Beat 5 | Reused as cascade chime — 8 additional triggers in Beat 5 |
| `assemblyNodes.grainChimes` (`/audio/glass-chime.mp3` GrainPlayer) | 2.0 → 4.5 | 3.0 → 5.0 | Beat 2 | Start delayed to t=3.0 (post first lensflare ignition) |
| `showcaseNodes.hum` (PolySynth Cmaj7) | 4.5 → 7.5 | 5.0 → 8.0 | Beat 3 | Window shifted +0.5 s |
| `showcaseNodes.whoosh` (pink noise + Panner3D) | 4.5 → 7.5 | 5.0 → 8.0 | Beat 3 | Panner orbit speed unchanged |
| `surgeNodes.tensionSweep` (saw 100→800 Hz) | 7.5 → 10.0 | 8.0 → 10.0 | Beat 4 | Window starts +0.5 s — faster ramp |
| `surgeNodes.crackle` (NoiseSynth interval) | 7.5 → 10.0 | 8.0 → 10.0 | Beat 4 | Same |
| `surgeNodes.thunder` (brown noise) | 7.5 → 10.0 | 8.0 → 10.0 | Beat 4 | Same |
| `shatterNodes.subDrop` (MembraneSynth C0) | once @ 10.2 | once @ 10.0 | Beat 4 | Aligned to detonation frame (was slightly late in v2) |
| `shatterNodes.glassShatter` (Player) | once @ 10.2 | once @ 10.0 | Beat 4 | Same |
| `shatterNodes.debris` (GrainPlayer) | 10.2 → 11.5 | 10.0 → 11.5 | Beat 4 | Window starts at detonation, ends as Beat 5 begins |
| `regroupNodes.decel` (MetalSynth filter sweep) | once @ 11.5 | once @ 11.0 | Beat 5 | Triggered at Beat-5 in (covers shatter ringout) |
| `regroupNodes.migrationDrone` (pink + HRTF Panner3D) | 11.5 → 14.0 | 11.0 → 16.5 | Beats 5-6 | **Window extended** through Beat 6 (was Beat 5 only); stops cleanly at Beat 6 end |
| `regroupNodes.cockpitHum` (55 Hz sine, −20 → −12 dB) | 11.5 → 14.0 | 11.5 → 16.5 | Beats 5-6 | Window extended; gain target −6 dB by t=16.5 (was −12 dB) |
| `materializeNodes.auroraPad` (Am7 PolySynth) | once @ 14.0 | once @ 14.0 | Beat 6 | Trigger time unchanged — kicks off Beat 6's bloom |
| `materializeNodes.hudRing` (C5-G5-C6 chord) | once @ 15.6 | once @ 15.2 | Beat 6 | Aligned to dichroic peak (was offset in v2) |
| `materializeNodes.ledBuzz` | once @ 14.4 | once @ 16.9 | Beat 7 | Moved into Beat 7 (cockpit power-on context) |
| `materializeNodes.panelClunk` | once @ 14.8 | once @ 17.3 | Beat 7 | Moved into Beat 7 |
| `materializeNodes.digitalChirp` (4-note arpeggio) | once @ 15.2 | once @ 17.7 | Beat 7 | Moved into Beat 7 |
| `materializeNodes.gaugeClick` (3 hits) | once @ 16.0 | once @ 18.1 | Beat 7 | Moved into Beat 7 |
| `materializeNodes.cockpitHum` | 14.0 → 17.0 | 16.5 → 18.5 | Beat 7 | Window shifted; not redundant with regroup hum (handoff) |
| `onlineNodes.powerUp` (FM sweep C5) | once @ 17.0 | once @ 18.5 | Beat 8 | Climactic moment now Beat 8 (was Beat 7→8 v2 boundary) |
| `onlineNodes.cockpitAmbient` (55 Hz sine, persistent) | 17.0 → ∞ | 18.5 → ∞ | Beat 8+ | Persists into cockpit interactivity (handoff) |

**Net audio change for v3:** ~12 trigger-time edits in `syncToProgress` (one method, no node restructure). New behavior: `clang` triggers 8 times in Beat 5 (one per letter pop). All other changes are timestamp shifts. **Estimated implementation cost:** 1 commit, ~80 LOC diff.

---

## §12. Cockpit Handoff Contract (CPA v2 single-canvas)

The hero canvas IS the cockpit canvas. There is one `<Canvas>` (the existing `<CockpitCanvas>`) mounted persistently at the page root. Hero scene renders as a `<group>` inside it; cockpit interior renders as siblings. The "handoff" is a state transition, not a remount.

### State machine (driven by `useCockpitStore`)

| heroPhase | When | What's visible | What's interactive |
|---|---|---|---|
| `idle` | Pre-hero (page first mounted, hero not yet started) | Empty void or loading state | Nothing (hero should auto-start) |
| `animating` | t = 0.0 → 16.5 (Beats 1-6) | Hero subjects only; cockpit groups `visible=false` | Skip / fast-forward / Escape |
| `materializing` | t = 16.5 → 19.0 (Beats 7-8) | Hero (drifting up) + cockpit (fading in) overlap | Skip still works; clicking accelerates |
| `complete` | t ≥ 19.0 | Cockpit only; hero unmounted | Full cockpit interactivity |

Plus `cockpitReady: boolean` — flips `true` at Beat-8 GSAP `onComplete`. UI components gating on full cockpit interactivity (consoles, lab map clicks) read `cockpitReady` not `heroPhase` (decouples animation lifecycle from interactivity gate).

### Single-canvas verification (HS-9 hard stop)

After Phase 5c is complete, manual verification by the user:

1. Open DevTools → Elements panel
2. Inspect the `<canvas>` element BEFORE refresh
3. Watch the same DOM node from `localStorage.removeItem('sparkforge-hero-seen'); location.reload()` through to t=19+
4. **The canvas node MUST NOT unmount or remount** at any point
5. Cockpit interactivity (e.g. clicking a console) becomes available exactly at t=19.0 (when `cockpitReady` flips)

### Skip / fast-forward preserved verbatim from v2

| Trigger | Effect | Behavior |
|---|---|---|
| First visit, no localStorage `sparkforge-hero-seen` | Always plays | Full 19 s sequence |
| `prefers-reduced-motion: reduce` | Always skips | `actions.skipToEnd()` immediate |
| `uiStore.skipIntroAnimation === true` AND not first visit | Skips | `actions.skipToEnd()` immediate |
| Click anywhere on hero overlay | Fast-forward | `timeScale = 4.0` (4.75 s remaining at peak speed) |
| `Enter` or `Space` | Fast-forward | Same as click |
| `Escape` | Skip | Same as `skipToEnd()` |

Audio progress sync (not transport sync) means fast-forward does NOT pitch-shift audio — cues fire at correct progress points whether at 1× or 4×. This is preserved verbatim from v2 (`heroAudio.ts:setTimeScale`).

### Mobile / non-WebGPU fallback (decision N2)

Devices without WebGPU receive `public/branding/brand-fallback.mp4` (Phase 4 output) as a `<video>` poster within `<BrandingShowcase>`. The hero animation does NOT run on these devices — they see a static poster + the wordmark PNG (`public/branding/sparkforge-hero.png`). **No shader fork.** Cockpit remains accessible via direct nav after auth — the hero is decorative on these devices, not a gating route.

---

## §13. Open Questions for User Sign-Off

Phase 5b prep (and 5b, 5c) build on this storyboard. Each question below has a recommended default — answering "go with defaults" unblocks 5b prep immediately.

| # | Question | Recommended default | Tradeoff if you change it |
|---|---|---|---|
| **Q1** | **Beat boundaries** — are the 8 timestamps (2.5/5.0/8.0/11.0/14.0/16.5/18.5/19.0 s) acceptable? | Yes (per N4 lock) | Re-balancing changes pacing perception — for example, extending Beat 4 to 12.0 s shortens Beats 5-8 → cockpit arrival feels rushed |
| **Q2** | **Camera path style** — do you want the diagonal parallax dolly in Beat 2 (current spec, off-axis pull from `(0,0,12)` to `(−1.4, +0.6, 9.2)`) or a straight z-axis dolly? | Diagonal | Straight is safer / cheaper but reads as standard intro; diagonal telegraphs "cinematic" intent |
| **Q3** | **Wordmark cascade order** — current spec is left-to-right S→p→a→r→k→F→o→r→g→e (with S+F already visible from Beat 4). Alternative: anchored-pair (S+F first, then everything else fills inward simultaneously, ~0.6 s). | Left-to-right (legibility, builds anticipation) | Anchored-pair is faster/punchier but loses the "spelling out" reveal |
| **Q4** | **Beat 4 detonation visual** — do shards fly outward in all directions (current spec, biased upward) or directionally (e.g. all toward the camera for a face-burst effect)? | Outward+up bias | Camera-direction burst is dramatic but obscures the wordmark anchor positions for ~0.5 s; outward gives the next beat clean entry |
| **Q5** | **Lensflare double-bloom (Beat 6)** — `intensityMul` peaks at 1.8. Higher (2.4+) reads as "explosive" climax, lower (1.4) reads as "subtle". | 1.8 (mid-range) | Higher risks bloom blowout on bright displays; lower may not register as a peak beat |
| **Q6** | **Cockpit handoff visible cue** — the spec has wordmark dissolving into the cockpit's central holographic display. Alternative: wordmark "shatters" again (mini-Beat-4 style) and the shards become the cockpit's UI elements. | Dissolution | Shatter-into-UI is cooler but adds 0.5–1.0 s and risks reading as a second climax (visual fatigue) |
| **Q7** | **Audio remap acceptance** — §11 changes 12 trigger-times in `heroAudio.ts:syncToProgress`. Approve the remap as documented? | Approve | Rejecting forces v3 visuals to align with v2 audio timing — would re-introduce the v2 boundary mismatches between visual and audio peaks |
| **Q8** | **Theatre.js studio overlay** — should `studio.initialize()` be auto-mounted on every hero render, or gated behind `?theatre=1` query param? | `?theatre=1` query gate | Auto-mount adds a UI overlay to all visitors (intrusive in production); query-gate keeps it dev-tunable on every environment per the no-NODE_ENV-gate mandate |
| **Q9** | **SSIM halt strategy** — Mythos rule says SSIM ≥ 0.96 vs IMG_4607. For animated beats there is no single reference frame — should we (a) halt against the locked Phase 4 still anchors at t=2.5/5.0/8.0/11.0/14.0/16.5/18.5/19.0, or (b) halt against motion-frame averages? | (a) Anchor stills | (b) is more robust to subtle motion drift but doubles the rendering cost in `scripts/compare-ssim.ts` |
| **Q10** | **Mobile / non-WebGPU experience** — current spec serves the static MP4 poster only. Should we ALSO author a 5–8 s "trimmed video" version of this storyboard (Sora/Veo) for mobile so they get a hero, just shorter? | No (static poster only) | Trimmed video is Phase 7 (Sora prompt pack) work — adds budget but improves mobile first-impression |

### How to respond

- **"Go with defaults on all"** — fastest path to Phase 5b prep
- **"Change Q3 to anchored-pair, rest defaults"** (or any subset) — I'll update the storyboard, re-commit, then proceed to 5b prep
- **"Restructure Beat N"** — name the beat and the change; I'll redraft only that section
- **"Halt entirely / re-discuss"** — I'll wait for direction

---

## §14. What Phase 5b Prep Will Do (Once You Sign Off)

Reference for your decision: this is what the next phase produces, so you know what you are signing off into.

| Sub-phase | Output | Estimated diff |
|---|---|---|
| **5b prep** | `src/components/3d/branding/LensflareTSL.tsx` — custom TSL anamorphic lensflare shader (per N3 lensflare = `c`). Two-mesh architecture (hot-core sphere + streak plane), `AdditiveBlending`. Reads from `SF_BRAND.LENS_FLARES` config (already in Phase 1). Mounted at `/dev/branding` as a new "Lensflare" subject for visual tuning. | +1 component (~200 LOC), +1 dev-showcase wiring, no breaking changes |
| **5b** | `src/lib/hero/heroTheatreProject.ts` (Theatre.js sheet); `src/components/3d/branding/SfShardSet.tsx` (Voronoi pre-fracture via `three-bvh-csg`); `src/components/3d/hero/v3/Beat{1..4}*.tsx`; modifications to `HeroAnimation.tsx` to mount v3 beats 1-4 instead of v2 phases 1-4 (behind a feature flag for safe rollback during the transition). | +1 Theatre project, +1 shard component, +4 beat components, modifications to `HeroAnimation.tsx`, modifications to `heroAudio.ts` for partial remap (Beats 1-4 audio only) |
| **5c** | Beats 5-8 components + the rest of the audio remap + HS-9 verification + remove v3 feature flag once all 8 beats are proven. | +4 beat components, modifications to `heroAudio.ts` for full remap, removal of feature flag |

After 5c, the v3 hero replaces v2 in `HeroAnimation.tsx` entirely. The storyboard above becomes the canonical reference for any future tuning.

---

*End of Storyboard v1.0 — Phase 5a deliverable.*
*Awaiting user sign-off (§13 questions). Phase 5b prep does not start until questions are answered.*







