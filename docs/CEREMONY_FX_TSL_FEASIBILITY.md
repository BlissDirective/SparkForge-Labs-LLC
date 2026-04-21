# P2 §10.8 — CeremonyFX Physics Offload · Feasibility & Decision

**Date:** April 21, 2026 · **Status:** Scaffold landed, activation gated behind
feature flag pending perf drill + COOP/COEP headers

---

## Problem

`src/components/3d/CeremonyFX.tsx` runs particle physics (confetti,
fireworks, sparks, trophies) inside multiple `useFrame` callbacks.
Each callback iterates thousands of `InstancedMesh` instances,
calling `setMatrixAt` per particle. On a celebration with the full
burst set (up to ~4K particles across all components), this can add
**2-4 ms per frame** of main-thread work — meaningful on 60 fps
targets (16.6 ms/frame budget).

## Options (user-selected: C with A+B evaluation)

| Opt | Strategy | Main-thread reduction | Risk |
|-----|----------|-----------------------|------|
| **A** | Port physics to **TSL compute shader** (GPU side) | ~100% (physics → GPU) | HIGH: ~600 LOC, WGSL vs GLSL fallback quirks, Three.js r183+ TSL maturity |
| **B** | Physics in **Web Worker** via Comlink (T12 infra) | 60–90% (IF SharedArrayBuffer) / 20–40% (postMessage clone) | MED: requires COOP/COEP headers for SAB; postMessage at 60 Hz = clone cost |
| **C** | Start B, measure, migrate to A if gain insufficient | Incremental | LOW |

## Mythos lens

The MoE router pattern says: route each input to the expert best suited
for it. Particles come in two classes:

1. **Geometry-heavy, small counts** (trophies, center confetti at start) —
   Main thread + InstancedMesh is already optimal. Worker round-trip
   would ADD latency.
2. **Geometry-light, large counts** (confetti drift, spark trails) —
   Physics is O(N); worker or GPU offload scales linearly with N.

Routing all particles through A single path (worker OR GPU) is the
anti-pattern. The right architecture is **per-emitter routing**
analogous to MoE's top-k expert selection.

## Recommended path (autonomous execution of Opt C)

### Phase 1 (this commit) — Scaffold
1. Extract pure `integrateParticles(state, dt, forces)` physics function —
   no Three.js types, so it's portable across main thread / worker / TSL
   kernel input.
2. Add `integrateParticles` to the T12 heavyCompute.worker as a callable
   job. Main-thread callers flip a prop `useWorkerPhysics={true}` to opt
   in; default stays `false` until a perf drill justifies it.
3. Add unit tests for the pure function + a contract test that worker
   and main-thread integrators produce identical output for a fixed
   seed.

### Phase 2 (future, gated) — Activate B
1. Benchmark on a representative ceremony (full burst, 4 K particles).
2. If worker yields >1 ms/frame improvement AND COOP/COEP is configured
   on the Vercel deployment, flip `useWorkerPhysics={true}` in
   CeremonyFX defaults.
3. Otherwise stay on main thread — worker overhead exceeds win.

### Phase 3 (future, Phase 5 architectural) — Option A (TSL)
1. Trigger: sustained user-reported FPS drops on celebrations,
   particularly when postFX stack is also active.
2. Scope: port `integrateParticles` to a TSL compute kernel. Use
   Hero Animation's existing TSL compute pipeline as the reference.
3. Keep the main-thread/worker path as the fallback for browsers
   without WebGPU.

## Why this is Opt C + A+B done honestly

- **B** is SCAFFOLDED, not activated. Activation is a one-line prop flip
  once a perf drill + COOP/COEP show value. This lets the perf work
  happen incrementally without committing to a worker round-trip we
  can't measure yet.
- **A** is DOCUMENTED as a Phase 5 spike, with a concrete trigger and
  scope. It's not scaffolded yet because TSL compute kernels need a
  dedicated PR (scene lifecycle, buffer management, WGSL → GLSL TSL
  port).
- **Both show value together**: A for ultra-large bursts (>10 K
  particles), B for medium (1 K–5 K), main for small (<1 K). The MoE
  router pattern picks per-emitter.

## Deliverables this commit

1. `src/lib/particles/physicsCore.ts` — pure `integrateParticles`
   function.
2. `src/lib/workers/heavyCompute.worker.ts` — new exported
   `integrateParticles` wrapper.
3. `tests/unit/particle-physics-core.test.ts` — pure-function
   correctness.
4. This document.

CeremonyFX.tsx itself is NOT touched — scaffolding only. The worker
integration ships ready for a future perf-drill PR to wire in.
