# SparkForge 3D Performance Profiling Guide

> PERF-HIGH-001 (Option C). How to profile the 3D cockpit + game scenes with r3f-perf and interpret results.

---

## 1. Enable the live perf overlay

The overlay is auto-mounted inside `CockpitCanvas` with two gating paths:

- **Dev builds** (`NODE_ENV=development`) — always shown top-right.
- **Any build** — show/hide via `useUIStore((s) => s.showPerfStats)`. Operators can flip this in the DevTools console:
  ```js
  useUIStore.setState({ showPerfStats: true });
  ```

The overlay reports:

| Metric | Target | Read |
|---|---|---|
| **FPS** | ≥ 60 | average frames/sec |
| **Calls** | low drops on cockpit-only view | draw calls / frame |
| **Triangles** | ≤ 37.8 M (cockpit) + ≤ 12 M (game) | CLAUDE.md §9.3 budget |
| **Memory (GPU)** | stable / not climbing | VRAM used by textures + buffers |
| **GC** | rare | GC events; spikes indicate allocation churn |

---

## 2. Store-subscription profiling

### The problem
Components that do `const state = useStore()` (no selector) re-render on *every* state-field change. In R3F, `useFrame` subscribers compound this — a 60 fps scene running 10 compounded subscribers = 600 unnecessary re-renders/sec.

### Detection
1. Run in dev with the overlay enabled.
2. Open React DevTools → Profiler → Record.
3. Interact with cockpit (hover LED, navigate panels).
4. Stop. Look for components re-rendering on *every* state change rather than only when their displayed data changes.

### Pattern fixes

Pure-action component:
```tsx
// ✗ Before — re-renders on score, phase, round, timeElapsed, everything
const game = useGameStore();
game.updateScore(1);

// ✓ After — stable action refs, never re-renders from store
const game = useGameActions();
game.updateScore(1);
```

Reactive read:
```tsx
// ✗ Before — `game.score` works but subscribes to the entire state
const game = useGameStore();
return <div>{game.score}</div>;

// ✓ After — re-renders only when score changes
const score = useGameScore();
return <div>{score}</div>;
```

### ESLint guard
`eslint.config.mjs` flags `const x = use*Store()` without a selector as a warning (`PERF-HIGH-001`). New code is blocked at PR review.

---

## 3. Triangle-budget profiling

Per `CLAUDE.md §9.3` cockpit is budgeted at 37.8 M triangles. If the overlay shows more:

1. Identify the regression commit via `git bisect` with the overlay open.
2. Attribute triangles per component in the overlay's expanded view.
3. Reduce subdivision segments (most common cause) or remove dense geometry.

Game scenes have their own budgets (Flagship 20 M, FL-Lite 10 M, Standard 5 M). Overlay triangles = cockpit + active-game layer combined.

---

## 4. Texture memory profiling

See `docs/3D_ASSET_PIPELINE.md` (PERF-HIGH-002) for the texture compression pipeline. After compression, the overlay's Memory counter should drop proportionally to the PNG→KTX2 ratio (typically 6-10x reduction per affected texture).

---

## 5. Known acceptable hot paths

These are hot on purpose and do NOT indicate regressions:

- **HeroAnimation** — 1-time shatter + materialize sequence. 50-80 calls for ~10 seconds during first visit.
- **CeremonyFX** — confetti/fireworks spawn 200-500 instances transiently during celebration.
- **WormholeTransition** — 300k tris for ~1.2 sec of lab-to-lab travel.

If these are sustained (not transient), investigate. Otherwise ignore.
