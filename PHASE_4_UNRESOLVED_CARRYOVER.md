# Phase 4 Unresolved Carryover — To Address After Phase 4

This document tracks lower-priority findings from Phase 1/2/3 audits that
were deferred. These will be resolved in a sweep pass *after* all Phase 4
work is complete, per user directive on April 15, 2026.

## Critical Failures (§3) — carryover

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| §3.5 | Celebration state-flow fragmentation | HIGH | Deferred |
| §3.6 | Reactive cockpit settings bridge | HIGH | Deferred |

## State Management (§6) — carryover

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| §6.3 | Cockpit geometry constants duplicated | MEDIUM | Deferred |
| §6.6 | Hero-to-cockpit synchronization gap / readiness gate | MEDIUM | Deferred |

## Design Tokens (§7) — carryover

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| §7.2 | Lab colors defined in two places | LOW | Deferred |
| §7.4 | Font hierarchy not enforced | LOW | Deferred |
| §7.5 | Spacing tokens partially adopted | LOW | Deferred |

## Accessibility (§8) — carryover

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| §8.5 | Sidebar keyboard navigation broken | MEDIUM | Deferred |
| §8.6 | Game view has no focus containment | MEDIUM | Deferred |
| §8.8 | DifficultySelector locked tiers silent | LOW | Deferred |
| §8.9 | Loading states lack timeout handling | LOW | Deferred |
| §8.10 | Form validation feedback missing | LOW | Deferred |

## Visual Quality (§4) — carryover

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| §4.7 | Design decision compliance matrix | LOW | Deferred |

## Animation Polish (§5) — carryover

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| §5.8 | Page transitions not synchronized with 3D | MEDIUM | Deferred |
| §5.9 | Easing curves inconsistent | MEDIUM | Deferred |
| §5.10 | Reduced motion support incomplete across games | LOW | Deferred |

## Performance (§9/§10) — carryover

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| §10.8 | Full TSL compute-kernel migration for CeremonyFX particle physics | ENHANCEMENT | Deferred (Phase 3D resolved React cascade only) |
| §10.11 | OffscreenCanvas worker rendering | ENHANCEMENT | Deferred to Phase 5 (architectural) |

---

## Resolution Plan

After all Phase 4 sections commit and push successfully, return to this
document and tackle the items above in severity order:

1. **HIGH severity** (§3.5, §3.6) — state-flow fragmentation + reactive bridge
2. **MEDIUM severity** — §5.8, §5.9, §6.3, §6.6, §8.5, §8.6
3. **LOW severity** — §4.7, §5.10, §7.2, §7.4, §7.5, §8.8, §8.9, §8.10
4. **ENHANCEMENT severity** (Phase 5 architectural scope) — §10.8, §10.11

Total: 17 carryover items.
