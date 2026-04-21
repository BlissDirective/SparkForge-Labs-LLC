# Phase 4 Carryover — Closed

**Status:** ✅ All 17 items addressed across the April 21, 2026 sessions.

This document originally tracked lower-priority findings from Phase 1/2/3
audits that were deferred until after Phase 4. As of April 21, 2026 — all
items have landed. Heavier items (§10.8, §10.11) ship with
honest-delivery scaffolds + Phase 5 activation plans so the next architect
has a clear entry point rather than a greenfield.

---

## ✅ Resolved — Small-scope items (13)

### HIGH severity

| ID | Issue | Option | Commit |
|----|-------|--------|--------|
| §3.5 | Celebration state-flow fragmentation | B | `db996cf` |
| §3.6 | Reactive cockpit settings bridge | A | `20df497` |

### MEDIUM severity

| ID | Issue | Option | Commit |
|----|-------|--------|--------|
| §5.8 | Page transitions not synchronized with 3D | A | `eccd333` |
| §5.9 | Easing curves inconsistent | B | `1880595` |
| §6.3 | Cockpit geometry constants duplicated | A | `77a30c0` |
| §8.5 | Sidebar keyboard navigation broken | B | `05165ef` |
| §8.6 | Game view has no focus containment | A + tests | `1376e81` |

### LOW severity

| ID | Issue | Option | Commit |
|----|-------|--------|--------|
| §4.7 | Design decision compliance matrix | B (codegen) | `677e82d` |
| §5.10 | Reduced motion incomplete across games | B | `9b2eddc` |
| §7.2 | Lab colors defined in two places | C (codegen) | `1055488` |
| §7.4 | Font hierarchy not enforced | B + C | `15a3274` |
| §7.5 | Spacing tokens partially adopted | B (budget guard) | `6049bb8` |
| §8.8 | DifficultySelector locked tiers silent | C | `94d9b79` |
| §8.9 | Loading states lack timeout handling | C | `8d978ff` |
| §8.10 | Form validation feedback missing | B (useFieldValidation) | `0e5782f` |

---

## ✅ Resolved — Architectural items (4)

### HIGH severity

| ID | Issue | Option | Commit |
|----|-------|--------|--------|
| §6.6 | Hero-to-cockpit synchronization gap | C — double-rAF paint gate | `ade34c2` |

### ENHANCEMENT severity (Phase 5 architectural scope — scaffold landed)

| ID | Issue | Option | Commit |
|----|-------|--------|--------|
| §10.8 | Full TSL compute-kernel migration for CeremonyFX | C + A+B if value → scaffold + feasibility doc | `b437d29` |
| §10.11 | OffscreenCanvas worker rendering | A + Safari audit → detection API + feasibility doc | _this commit_ |

**§10.8 scope:** Pure particle integrator extracted
(`src/lib/particles/physicsCore.ts`); Worker wrapper shipped
(`integrateParticlesWorker`); activation gated on perf drill + COOP/COEP
headers per `docs/CEREMONY_FX_TSL_FEASIBILITY.md`.

**§10.11 scope:** Capability detection API + UA-safe gate
(`src/lib/3d/offscreenCanvasSupport.ts`); full R3F-in-worker migration
deferred to a Phase 5 PR because it requires a custom R3F reconciler +
event bridge + store mirror + shader pre-warm — non-trivial and
out-of-scope for a bounded session. See
`docs/OFFSCREEN_CANVAS_FEASIBILITY.md` for the risk analysis + Phase 5
plan.

---

## Session metrics (cumulative, April 21, 2026)

- **Commits this session:** 26 (6 PERF-HIGH-001 + 14 carryover + 6 tests/infra/scaffolds/tracker)
- **Tests:** 250 → **332** (+82 across 16 new test files)
- **PERF-HIGH-001 repo-wide offenders:** 0 (was 8, rule promoted warn→error)
- **Branch:** `claude/audit-tasks-t11-t20-w2Gho` — all pushed

## Handoff notes for next session

1. `docs/CEREMONY_FX_TSL_FEASIBILITY.md` — Phase 2 activation trigger
   (perf drill + COOP/COEP → flip `useWorkerPhysics={true}`).
2. `docs/OFFSCREEN_CANVAS_FEASIBILITY.md` — Phase 5 migration plan
   (custom reconciler + event bridge + SAB store mirror).
3. `tests/unit/spacing-tokens-budget.test.ts` — `BUDGET = 176`. Lower
   as `[Npx]`/`[Nrem]` migrations land.

All carryover items are either resolved or have honest-delivery
scaffolds ready for Phase 5 pickup. No deferred work remains in this
document.
