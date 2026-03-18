# Stage 6C v3-FINAL Part A — Neural Network Builder 3D + Audio

**Version:** v3-FINAL (corrected)
**Build Phase:** 11 (Stage 6C — Neural Builder, Part A: 3D component + audio hook)
**Prerequisites:** Stage 3 Part 3 v3-FINAL (StationFrame + HDR infrastructure), Stage 5 complete

> **Canvas Coexistence Note (FIX-DUAL-CANVAS):** The StationFrame component creates a full-viewport R3F `<Canvas>` on all dashboard pages. When `useStationMode` returns `mode: 'game'`, StationFrame unmounts its 3D Canvas entirely (early return with CSS-only frame) to avoid dual WebGL contexts. NeuralNetwork3D creates its own `<Canvas>` for 3D network visualization — it gets full GPU ownership during gameplay. The CSS fallback frame (chrome bezel + indicators) remains visible for visual continuity. Long-term, CPA v2.0 (Enhancement 1.1+) will unify all Canvas instances into a single persistent `<CockpitCanvas>`.
**Validation:** `npm run build` PASS, `npx tsc --noEmit` PASS, `npm run lint` PASS
**Lab:** 3 — The Brain Inside | **Color:** #EC4899 (Pink)
**Age Bands:** B (11-13), C (14-16) — Band A content to be created

---

## Overview

This document creates the 3D neural network visualization and audio sonification for the Neural Builder flagship game. Two files: `NeuralNetwork3D.tsx` (interactive 3D rotatable network replacing v2 SVG) and `useNetworkAudio.ts` (Tone.js sonification hook).

**Part A scope:** 3D component + audio hook. Part B contains the full `NeuralBuilderGame.tsx` game replacement.

### Decisions Implemented

| Decision | Description | Component |
|----------|-------------|-----------|
| 6.1 | Replace SVG entirely with 3D rotatable network (OrbitControls) | NeuralNetwork3D.tsx |

### Bug Fixes Preserved

| Bug | Description | Status |
|-----|-------------|--------|
| BUG-10F | Font stack: Exo 2/Sora/Orbitron NOT Fredoka/Nunito | Preserved (no font refs in 3D component) |

### v2 Enhancements Preserved

- Network heartbeat idle animation with synaptic sparks
- Tone.js network sonification (useNetworkAudio hook)
- Layer depth visualization via OrbitControls rotation

### Files Created / Modified

| # | File | Action | Purpose |
|---|------|--------|---------|
| 1 | `src/components/3d/NeuralNetwork3D.tsx` | CREATE | Interactive 3D neural network — replaces v2 SVG + NeuralNet3D.tsx brain orb |
| 2 | `src/hooks/useNetworkAudio.ts` | CREATE | Tone.js sonification: activation tones, epoch chords, spark pings, completion arpeggio |

### New Package Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `tone` | 15.1.22 | Audio synthesis for network sonification |
| `@nivo/line` | latest | Data visualization — loss curve chart (used in Part B game) |

Installed with `npm install tone @nivo/line --legacy-peer-deps` (peer dep conflict with existing packages).

### Triangle Budget Breakdown (10M Enhancement — March 18, 2026)

| Component | Desktop Ultra | LOD Low |
|-----------|-------------|---------|
| NeuralNetwork3D (nodes + connections) | ~20K | ~8K |
| NeuralBuilderEnvironment (server racks) | ~1.2M | ~20K |
| NeuralBuilderEnvironment (circuit traces) | ~200K | ~5K |
| NeuralBuilderEnvironment (holo panels + fans) | ~500K | ~0 |
| NeuralBuilderEnvironment (ceiling paths + data streams) | ~510K | ~0 |
| NeuralBuilderEnvironment (terrain + sky + fog) | ~1.25M | ~10K |
| **Total** | **~3.68M** | **~43K** |

**Scene total:** ~3.68M tris (desktop ultra) with LODWrapper adaptive FPS monitoring.
Immersive data center: server racks with LED status lights, circuit board floor, holographic panels, cooling fans, neural pathway ceiling lights, data stream particles.

### New Files (10M Enhancement)

| # | File | Purpose |
|---|------|---------|
| 3 | `src/components/3d/environments/NeuralBuilderEnvironment.tsx` | Immersive data center lab |

| Device | Max Budget | Target FPS | LOD Level |
|--------|-----------|------------|-----------|
| Desktop | 10,000,000 | 60 | ultra/high |
| Tablet | 5,000,000 | 45 | medium |
| Mobile | 2,500,000 | 30 | low |

### GPU Performance Budget

| Component | Triangles | Cost | When Active |
|-----------|-----------|------|-------------|
| NeuralNetwork3D (desktop) | ~20K max | ~0.5ms | Neural Builder game only |
| NeuralNetwork3D (mobile) | ~8K max | ~0.3ms | Neural Builder game only |
| Bloom postprocessing | N/A | ~0.2ms | Desktop only |

### v2 → v3 Changes

| Aspect | v2 (Current) | v3-FINAL (This Document) |
|--------|-------------|------------------------|
| Network Visualization | Animated SVG with glow effects, 2D circles + lines | 3D rotatable network with SphereGeometry neurons, Line2 fat-line connections, OrbitControls |
| 3D Component | NeuralNet3D.tsx (floating brain orb, decorative only) | NeuralNetwork3D.tsx (full interactive 3D network replaces SVG entirely) |
| Interaction | SVG hover/click | 3D raycasting for hover/click + OrbitControls rotation |
| Camera | N/A (2D SVG) | Constrained polar angle OrbitControls, auto-orbit during training |
| Activation Colors | CSS gradients on SVG circles | Emissive material color (cold blue → hot orange) on SphereGeometry |
| Triangle Budget | N/A (SVG) | ~20K max (72 nodes + 300 connections) |
| Mobile | Same SVG at all sizes | Simplified flat rendering: fewer segments, no bloom |
| Audio Hook | useNetworkAudio.ts (V2 patch) | Same hook, included as complete standalone |

---

## Code Review & Audit Report

### Issues Found and Fixed (Source Document)

| # | Severity | File | Issue | Fix Applied |
|---|----------|------|-------|-------------|
| 1 | CRITICAL | useNetworkAudio.ts | `setTimeout(() => synth.dispose(), 800)` in `playEpochChord` placed OUTSIDE the `useCallback` closure (PDF line break corruption) — `synth` is out of scope | Moved inside the `try` block, before `catch` |
| 2 | CRITICAL | useNetworkAudio.ts | `setTimeout(() => synth.dispose(), 1200)` in `playComplete` placed OUTSIDE the `useCallback` closure (same issue) | Moved inside the `try` block, before `catch` |
| 3 | CRITICAL | NeuralNetwork3D.tsx | `className="..."` placed INSIDE `style={{}}` object — invalid JSX syntax mixing attributes with object properties | Separated into distinct `className` and `style` attributes on the `<div>` |
| 4 | HIGH | NeuralNetwork3D.tsx | `controlsRef.current?.update()` in AutoOrbitController called outside `useFrame` at function body level — runs on every render | Moved inside the `useFrame` callback |
| 5 | HIGH | NeuralNetwork3D.tsx | `useRef<THREE.Mesh>(null!)` non-null assertions on meshRef (NeuronSphere) and sparkRef (ConnectionLine) | Changed to `null` with null guards in `useFrame` |
| 6 | MEDIUM | NeuralNetwork3D.tsx | `useThree` imported from `@react-three/fiber` but never used | Removed from imports |
| 7 | LOW | NeuralNetwork3D.tsx | `useState`, `useCallback` imported but never used | Removed from imports |
| 8 | LOW | useNetworkAudio.ts | Empty `catch {}` blocks without comments | Added `// Silent fallback` comments for clarity |

### Architecture Details

**NeuralNetwork3D.tsx (~380 lines):**

| Element | Implementation |
|---------|---------------|
| Neurons | `SphereGeometry(0.15, 20, 20)` desktop / `(0.15, 12, 12)` mobile. Emissive `meshStandardMaterial`, activation color interpolated cold blue (#3b82f6) → hot orange (#f97316) |
| Connections | drei `Line` component (Line2 fat lines). Weight-based thickness (0.5-3px) + color encoding (blue-negative → red-positive) |
| Camera | `OrbitControls` constrained polar angle 35°-85° (`Math.PI * 0.19` to `Math.PI * 0.47`), distance 3-12, damping 0.05 |
| Auto-orbit | Activates during training (speed 1.5), stops when idle. Disabled on mobile. |
| Hover/Click | R3F raycasting: `onPointerOver`/`onPointerOut` on neurons for inspect, `onClick` on connections for weight slider |
| Heartbeat | v2 enhancement preserved: pulse wave from input→output layers when not training. Computed from `heartbeatPhase` (0-1) |
| Sparks | Amber sphere (`0.08` radius) at connection midpoints, visible when `sparkIntensity > 0.3`. Desktop only. |
| Layer Labels | drei `Text` component below each layer: "Input (N)", "Hidden N (N)", "Output (N)" |
| Environment | drei `"night"` preset |
| Bloom | Desktop only: intensity 0.6, threshold 0.4, smoothing 0.9 |

**useNetworkAudio.ts (~120 lines):**

| Method | Description | Sound |
|--------|-------------|-------|
| `initTone()` | Lazy Tone.js initialization (requires user gesture) | — |
| `playActivation(layerIndex, totalLayers)` | Neuron activation tone | Sine wave, pitch 200-800Hz mapped by layer depth |
| `playEpochChord(epoch, maxEpochs, accuracy)` | Training epoch progress | PolySynth chord, dissonant→consonant as training progresses |
| `playComplete()` | Training completion fanfare | Ascending C-major arpeggio (C4-E5) in triangle wave |
| `playSpark(intensity)` | Synaptic spark ping (intensity > 0.4) | Triangle wave, 800-1400Hz random, very short envelope |

---

## Verification Checklist

### Part A Validation
- [x] `src/hooks/useNetworkAudio.ts` exists and exports `useNetworkAudio` + default
- [x] `src/components/3d/NeuralNetwork3D.tsx` exists and exports default
- [x] No TypeScript errors: `npx tsc --noEmit` PASS
- [x] No lint errors: `npm run lint` PASS
- [x] Build passes: `npm run build` PASS
- [x] NeuralNetwork3D imports: OrbitControls, Line, Text, THREE, Canvas, Bloom
- [x] NeuralNetwork3D accepts full network data props (layerSizes, network, isTraining, etc.)
- [x] OrbitControls constrained: polar angle 35°-85°
- [x] Auto-orbit activates during training, stops when idle
- [x] Heartbeat pulse wave preserved (v2 enhancement)
- [x] Spark flash at connection midpoints for weight changes
- [x] Mobile fallback: fewer segments (12 vs 20), no bloom
- [x] ARIA label on container div
- [x] useNetworkAudio: initTone, playActivation, playEpochChord, playComplete, playSpark
- [ ] Old NeuralNet3D.tsx — does not exist yet (no file to delete)

### Note on Band A Content
The stage document specifies: "Band A Content Needs To Be Created. Use Claude agent to create content and generate new code." This will be addressed in Part B when the full NeuralBuilderGame.tsx is created, as Band A content is game-level content (challenges, descriptions) not 3D component-level.
