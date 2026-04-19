# SparkForge State Architecture

> STATE-HIGH-003 (Option C). Inventory of every Zustand / Jotai store, their responsibilities, cross-store dependencies, and the forward roadmap for simplification.

---

## TL;DR

**14 Zustand stores + 1 Jotai atom module = 15 state containers.**

Despite the count, the **dependency graph is remarkably clean**: only one cross-store import exists (`gameStore → childStore`, to look up the active child for the per-child store factory). There is no cyclic dependency and no "tangled web" — the audit concern about complexity is therefore mostly **cognitive** (14 stores is a lot to mentally model), not runtime coupling.

The `scripts/audit-store-deps.sh` script is an automated regression floor: it prints the same dep graph below and flags any store that ever acquires 3+ cross-store imports.

---

## Store inventory

| Store | LOC | Cross-store deps | Consumers | Responsibility |
|---|---:|---|---:|---|
| `authStore` | — | — | 12 | Parent identity, demo session state, COPPA flags |
| `childStore` | — | — | 60 | Children array + active child + avatar/XP local cache |
| `parentStore` | 56 | — | 4 | Parent-dashboard aggregated view model (tier + child summaries) |
| `gameStore` | 213 | `childStore` | 42 | Per-child game session state via factory (phase, score, etc.) |
| `uiStore` | — | — | 29 | Global UI flags (celebration, particle intensity, skipIntroAnimation, labColor) |
| `toastStore` | — | — | 7 | Toast queue + action-button support |
| `sceneStore` | — | — | 49 | Active 3D scene selection, transition state, game HUD content |
| `cockpitStore` | 442 | — | 28 | Cockpit spatial state (focusedLab, cameraTarget, skin, NPCs, audio, mode) |
| `cockpitBroadcastStore` | — | — | 28 | Cross-panel 3D event bus with pulse decay |
| `cockpitUIStore` | 81 | — | 12 | Center-viewport panel content routing |
| `cockpitAtoms` | — | — | 1 | Jotai atoms for fine-grained cockpit reactive state |
| `deviceStore` | — | — | 11 | Desktop-ultra profile (hardcoded since D3D-1); GPU tier detection |
| `accessibilityStore` | — | — | 11 | Font size, contrast, reducedMotion, screenReader preferences |
| `guideStore` | — | — | 6 | AI Guide (Sparky) conversation state + voice + avatar |

Counts from April 2026 branch snapshot.

---

## Dependency graph (runtime)

```
childStore ─── gameStore (per-child factory key)

[every other store is a leaf — no outbound store-to-store imports]
```

That's it. Every other store is self-contained. Components may compose multiple stores in a single render, but the stores themselves don't call each other.

**Implication:** the real-world "tangled state" risk the audit flagged (store A's update cascading into store B's subscription) does **not** exist here. If that symptom ever appears, it'll be via a *component* that bridges two stores, not a store importing another.

---

## Concerns matrix

| Concern | Evidence | Severity | Fix surface |
|---|---|---|---|
| Cognitive overload (14 stores) | Developers must hold all 14 in their heads when tracing state | Medium | Consolidate near-duplicates; enforce naming (all cockpit-* prefix already helps) |
| Cross-cockpit redundancy | `cockpitStore` (spatial) + `cockpitUIStore` (routing) + `cockpitBroadcastStore` (bus) all touch the cockpit's lifecycle | Medium-Low | Candidate merge (see Roadmap) |
| Large consumer surface on a few stores | `childStore` (60), `sceneStore` (49), `gameStore` (42) | Low | Inherent to their purpose; consumer count is fine if they use selectors (PERF-HIGH-001) |
| 1 accidental cross-import | `gameStore → childStore` | Low | Intentional per factory pattern; leave alone |

---

## Roadmap (Phase 3+ — not this commit)

Listed in risk-ranked order. **All are deferred** to a dedicated refactor session; the current commit ships the doc + the auditable baseline only.

### R1. Merge `cockpitUIStore` into `cockpitStore.ui` slice

  - **Scope:** 12 consumers rewrite `useCockpitUIStore((s) => s.x)` → `useCockpitStore((s) => s.ui.x)`.
  - **Risk:** LOW. Both stores are pure state containers. No event-bus semantics involved.
  - **Test plan:** tsc-clean migration; dev-server smoke verifies center-panel routing per mode; existing vitest for CockpitUILayer.

### R2. Merge `accessibilityStore` into `uiStore.a11y` slice

  - **Scope:** 11 consumers. Small shape (fontSize, contrast, reducedMotion, screenReader).
  - **Risk:** LOW. Semantic overlap — a11y IS UI. Keeping them separate was historical, not architectural.
  - **Test plan:** visual verification with Accessibility toolbar toggle; test the reduced-motion path.

### R3. Leave `cockpitBroadcastStore` separate

  - **Rationale:** Event-bus architecture is fundamentally different from state containers. Merging the ring-buffer + pulse-decay system into `cockpitStore` would mix paradigms and worsen cognitive load. Keep it.

### R4. Leave `cockpitAtoms` separate

  - **Rationale:** Jotai atoms are a different reactivity primitive than Zustand. They coexist cleanly via the provider pattern and serve a narrow purpose (fine-grained per-lab reactive reads).

### End state after R1 + R2

From 14 Zustand stores → **12 Zustand stores** (+ 1 Jotai module = 13 containers). Two merges, zero behavior changes, ~23 consumer lines edited.

---

## Enforcement

`scripts/audit-store-deps.sh` runs on every `bash scripts/audit-store-deps.sh`. It:

1. Walks `src/stores/*.ts` and emits the table shown above.
2. Flags any store with ≥ 3 cross-store imports as a high-coupling warning.
3. Exits non-zero on any flagged finding so CI can gate on it (opt-in — not wired into the workflow today).

Run locally before opening a PR that adds a new store:

```
bash scripts/audit-store-deps.sh
```

---

## Appendix: why not just "collapse everything"?

Several of the 14 stores are **structural boundaries that reflect domain separation**:

- `authStore` is owned by AuthProvider and cleared on sign-out.
- `childStore` is owned by the parent and re-populated on child switch.
- `gameStore` is per-child via factory to prevent XP leakage (STATE-CRIT-001 fix).
- `deviceStore` is hardware detection and rarely changes.
- `toastStore` is a transient notification queue.

Forcing these into a monolith trades 14-store bookkeeping for one-big-store sprawl — you lose the natural "owned by X" intuition without gaining runtime performance (Zustand subscriptions are cheap; selectors already narrow re-renders per PERF-HIGH-001). The only merges worth doing are where the domain ALREADY overlaps (R1, R2).
