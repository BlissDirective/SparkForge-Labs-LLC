# Phase 4 Unresolved Carryover — Progress Tracker

This document tracks lower-priority findings from Phase 1/2/3 audits that
were deferred. Original plan (April 15, 2026): resolve after all Phase 4
work completed.

**April 21, 2026 update:** Partially resolved across 2 sessions under Option Y
(small items first, then pause for feasibility analysis on the 3 heavy
architectural items). Remaining = §8.10 + §6.6 + §10.8 + §10.11.

---

## ✅ Resolved (11 of 17)

### HIGH severity

| ID | Issue | Option | Commit | Session |
|----|-------|--------|--------|---------|
| §3.5 | Celebration state-flow fragmentation | B | `db996cf` | Apr 21 |
| §3.6 | Reactive cockpit settings bridge | A | `20df497` | Apr 21 |

### MEDIUM severity

| ID | Issue | Option | Commit | Session |
|----|-------|--------|--------|---------|
| §5.8 | Page transitions not synchronized with 3D | A | `eccd333` | Apr 21 |
| §5.9 | Easing curves inconsistent | B | `1880595` | Apr 21 |
| §6.3 | Cockpit geometry constants duplicated | A | `77a30c0` | Apr 21 |
| §8.5 | Sidebar keyboard navigation broken | B | `05165ef` | Apr 21 |
| §8.6 | Game view has no focus containment | A + tests | `1376e81` | Apr 21 |

### LOW severity

| ID | Issue | Option | Commit | Session |
|----|-------|--------|--------|---------|
| §4.7 | Design decision compliance matrix | B (codegen) | `677e82d` | Apr 21 |
| §5.10 | Reduced motion incomplete across games | B | `9b2eddc` | Apr 21 |
| §7.2 | Lab colors defined in two places | C (codegen) | `1055488` | Apr 21 |
| §7.4 | Font hierarchy not enforced | B + C | `15a3274` | Apr 21 |
| §7.5 | Spacing tokens partially adopted | B (budget guard, 176 ceiling) | `6049bb8` | Apr 21 |
| §8.8 | DifficultySelector locked tiers silent | C | `94d9b79` | Apr 21 |
| §8.9 | Loading states lack timeout handling | C (withQueryTimeout helper) | `8d978ff` | Apr 21 |

---

## 🟡 Remaining (4 of 17)

### LOW severity — 1 item

| ID | Issue | User-selected Option | Status |
|----|-------|----------------------|--------|
| §8.10 | Form validation feedback missing | B (Zod + react-hook-form `mode: 'onTouched'`) | **Deferred — not started this session** |

### HIGH severity — 1 item (awaits feasibility analysis before implementation)

| ID | Issue | User-selected Option |
|----|-------|----------------------|
| §6.6 | Hero-to-cockpit synchronization gap | C — autonomous conflict resolution; best-possible sync |

### ENHANCEMENT severity — 2 items (Phase 5 architectural scope)

| ID | Issue | User-selected Option |
|----|-------|----------------------|
| §10.8 | Full TSL compute-kernel migration for CeremonyFX particle physics | C + test A+B together; implement both if value found |
| §10.11 | OffscreenCanvas worker rendering | A + Safari <16.4 feasibility audit |

---

## Session metrics (April 21, 2026)

- **Commits this session:** 21 (6 PERF-HIGH-001 + 9 carryover + 6 tests/infra)
- **Tests added:** 298 total (was 250 at session start, +48)
- **Test files:** 47 (was 37, +10)
- **PERF-HIGH-001 backfill:** 8 → 0 (rule promoted `warn` → `error`)
- **Branches:** `claude/audit-tasks-t11-t20-w2Gho` — all pushed

## Resume plan

Next session should start with **§8.10 (Form validation)** — the only
small item still open. It's a clean, contained migration (add Zod +
react-hook-form `mode: 'onTouched'` to existing forms).

Then present feasibility analyses for **§6.6 · §10.8 · §10.11** per
Option Y agreement — do NOT begin those until they are individually
authorized with sub-commit plans.
