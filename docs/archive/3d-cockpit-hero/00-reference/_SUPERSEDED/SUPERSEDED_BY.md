# _SUPERSEDED — docs/00-reference

## ⚠️ DO NOT USE THESE FILES FOR DEVELOPMENT ⚠️

Documents in this folder are **archived** and must not be referenced for any build activity.
All content has been superseded by newer documents listed below.

---

## Archived Files

### `COCKPIT_PANORAMIC_ARCHITECTURE_v1.md`

| Field | Value |
|-------|-------|
| **Archived** | March 20, 2026 |
| **Original date** | March 14, 2026 |
| **Superseded by** | `docs/00-reference/3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md` |
| **Also see** | `docs/00-reference/Upgrade-3D-Panoramic-Cockpit-2026-03-20.md` |
| **Why archived** | v2.0 fully consolidates v1.0 + Enhancement 1.1 + Enhancement 1.2 into a single coherent spec. The v1 file itself contained a `⚠️ REFERENCE ONLY` warning in its own header. |

### Known Issues in the Archived File (DO NOT APPLY)

| Issue | Description |
|-------|-------------|
| **Separate Canvas instances** | v1 spec describes `StationFrame`, `SpatialDashboard`, and (implicitly) `HeroAnimation` each creating their own R3F `<Canvas>`. This is the FIX-TRIPLE-CANVAS bug — resolved in v2.0 + Upgrade doc. Never implement this pattern. |
| **Outdated triangle budget** | v1 specifies ~800–1,200 triangles for the cockpit shell. The correct desktop budget is **20,000,000 triangles** per the Upgrade doc (March 20, 2026). |
| **Missing HeroAnimation unification** | v1 does not address `HeroAnimation.tsx` needing to be a `<group>` within `CockpitCanvas`. The Upgrade doc (Section A) and v2.0 Migration Phase 1 resolve this. |
| **No CPA2 decision alignment** | v1 predates the CPA2 decision lock system. Its architectural decisions are superseded by CPA2-1 through CPA2-15 in v2.0 Section 15. |
| **No deviceStore 20M values** | v1 has no reference to the updated `deviceStore` profiles (desktop 20M, tablet 10M, system tier). |

---

## Active Documents for Cockpit Development

Use these in this order of authority:

| Priority | Document | Location | Scope |
|----------|----------|----------|-------|
| 1 | **3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md** | `docs/00-reference/` | Full cockpit architecture spec — geometry, materials, spatial dashboard, skins, transitions, audio, LOD, accessibility |
| 2 | **Upgrade-3D-Panoramic-Cockpit-2026-03-20.md** | `docs/00-reference/` | Change log for 20M triangle upgrade + FIX-TRIPLE-CANVAS fix — implementation phases, file change list, verification plan |
| 3 | **CLAUDE.md** (Sections 9, 9.1, 9.2, 9.3, 14) | Repo root | Authoritative cockpit summary, triangle budgets, store definitions, CPA2 decision index |

---

---

### `MOBILE_3D_ENHANCEMENT_PLAN_PartA.md`

| Field | Value |
|-------|-------|
| **Archived** | March 30, 2026 |
| **Original date** | March 2026 |
| **Superseded by** | D3D Desktop-First Overhaul (CLAUDE.md v6.0, March 24, 2026) |
| **Why archived** | Obsoleted by D3D Desktop-First Overhaul (March 24, 2026) — mobile code paths removed per D3D-1. All mobile/tablet rendering code paths, CSS fallbacks, and `useIsMobile()` references have been eliminated. The platform now renders desktop-ultra only (50M triangle budget). |

### `MOBILE_3D_ENHANCEMENT_PLAN_PartB.md`

| Field | Value |
|-------|-------|
| **Archived** | March 30, 2026 |
| **Original date** | March 2026 |
| **Superseded by** | D3D Desktop-First Overhaul (CLAUDE.md v6.0, March 24, 2026) |
| **Why archived** | Obsoleted by D3D Desktop-First Overhaul (March 24, 2026) — mobile code paths removed per D3D-1. All mobile/tablet rendering code paths, CSS fallbacks, and `useIsMobile()` references have been eliminated. The platform now renders desktop-ultra only (50M triangle budget). |

### Known Issues in the Archived Mobile Files (DO NOT APPLY)

| Issue | Description |
|-------|-------------|
| **Mobile code paths removed** | D3D-1 decision lock removed all mobile/tablet rendering. 401 `isMobile` occurrences were removed. These plans describe features that no longer exist in the codebase. |
| **CSS fallback architecture removed** | D3D-1/D3D-2 removed CSS particle fallbacks, `GenericGameParticles`, and LOD-based degradation. All rendering is now desktop-ultra at full quality. |
| **Outdated device detection** | Plans reference `useIsMobile()`, `DeviceSelectionModal`, and tiered device profiles — all removed per D3D overhaul. |

---

*Archived by: Claude Code | March 30, 2026 | Per CLAUDE.md Section 3.2 Superseded Document Policy*
