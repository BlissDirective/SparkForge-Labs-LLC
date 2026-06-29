# Archived Documentation — Manifest

**Date:** 2026-06-29 · **Branch:** `setup-sparkforge-dev` · **Action:** doc-surface cleanup

> ⚠️ **DO NOT BUILD FROM ANYTHING IN `docs/archive/`.** These files are kept for
> history only. The live, authoritative documentation set is declared in
> [`docs/INDEX.md`](../INDEX.md) and mapped in [`docs/CODEBASE-MAP.md`](../CODEBASE-MAP.md).
> Everything here was moved with `git mv` — full content is recoverable from git history.

## Why these were archived

Two structural shifts made ~181 docs stale:

1. **3D cockpit removed from the active render path.** The dashboard `layout.tsx` now
   renders an HTML-first dashboard ("Replaces the 3D cockpit with a clean, accessible,
   responsive HTML dashboard"). Every doc describing the Laboratory Control Station
   cockpit, the 8-beat hero cinematic, VR, or WebGPU/TSL shader work as the *live* UI is
   no longer applicable.
2. **Game migration to Pixi/Phaser archetypes (Waves 1–7) + staged build complete.** The
   per-stage build specs and the pre-migration game-content audits describe work that is
   done and/or superseded by the new archetype renderers.

The live surface dropped from **235 → 54** `.md` files.

## What was archived

| Folder | Contents | Reason |
|--------|----------|--------|
| `root-design-cockpit-era/` | Cockpit-Interface-Plan, SparkForge-VR-Update, BRAND_HERO_ACTION_PLAN, SparkForge-ALT-UI, Mythos, Master-Design-Agent, Master-SparkForge-UI-Design-Change, Master-Design-UI-UX-Reference-Source, ENHANCEMENT_BLUEPRINT_v1.0, MASTER-SparkForge-Enhancement-Plan, SparkForge-Design-UI-UX-Audit, DESIGN_DECISIONS_LOG, DESIGN | Cockpit/hero/VR/v3 design vision — off the active HTML-first path |
| `root-audits-superseded/` | flagship-game-content-audit, flagship-lite-game-content-audit, StandardTier-game-content-audit, GAME_ENHANCEMENT_AUDIT, BACKEND_AUDIT_REPORT, DEPLOYMENT-READINESS-AUDIT + 5 prior AUDIT_REPORT generations | Game audits superseded by Wave 1–7 migration; code audits superseded by `fable-audit-v1.md` |
| `root-misc-superseded/` | dev-progress, Claude.md (dup of CLAUDE.md), SESSION_REFERENCE, Ref-claude-auto.v1.0, CHANGELOG-REDESIGN, STAGING_NOTES, PHASE_4_UNRESOLVED_CARRYOVER, Feature-Workflow-Test, Agent-Frontend, SparkForge-agent, SparkForge-Score, SETUP_CHECKLIST | Duplicates / session scratch / superseded by PROGRESS.md + CLAUDE.md |
| `3d-cockpit-hero/` | Phase5-Systems-And-Costs, Phase5-Next10-v3-Options, 3D_ASSET_PIPELINE, CEREMONY_FX_TSL_FEASIBILITY, OFFSCREEN_CANVAS_FEASIBILITY, 3D_PERF_PROFILING, GAME_AUDIT, DESIGN_COMPLIANCE_MATRIX + dirs `hero-v3/`, `enhancements/` (DESKTOP_FIRST_3D_OVERHAUL A–D), `00-reference/` (cockpit/hero/35-game-era reference set) | 3D/cockpit/hero feasibility + planning, dormant subsystem |
| `stage-build-records/` | `stage1-foundation` … `stage11-new-flagships` (12 dirs, ~195 files) | Original staged build specs — build complete; cockpit-era architecture superseded |
| `business/` | 2026_MarketAnalysis_Report, VC_Analysis | Business/investor analysis — not dev-applicable |

## Live set (kept — see docs/INDEX.md)

**Root:** `CLAUDE.md`, `README.md`, `PROGRESS.md`, `fable-audit-v1.md`,
`Fable-Frontend-Enhancement.md`, `Ui-Creation.md`, `TESTING.md`, `DEPLOYMENT.md`,
`database-patterns.md`

**docs/:** `CODEBASE-MAP.md`, `INDEX.md`, `STATE_ARCHITECTURE.md`, `DISASTER_RECOVERY.md`,
`UX_CONTRAST_POLICY.md`, `automation-playbook.md`, and dirs `UI-Game-Enhancements/`,
`legal/`, `research/`, `01-decisions/`

## Recovering a file

```bash
git log --all --oneline -- docs/archive/<folder>/<file>.md   # find it
git show <commit>:<original-path>                            # view a prior version
```

If the 3D cockpit work is ever revived, restore the relevant `3d-cockpit-hero/` and
`stage-build-records/` docs rather than rewriting them.
