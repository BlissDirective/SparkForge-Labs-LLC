# Documentation Index — what's authoritative

> The repo accumulated overlapping audit + design docs across the cockpit-era build.
> This index declares the **live** documents. Everything under `docs/archive/` is
> superseded and kept only for history (do not build from it) — see
> [`docs/archive/SUPERSEDED_BY.md`](archive/SUPERSEDED_BY.md).
>
> **2026-06-29 cleanup:** the live `.md` surface was reduced from 235 → 54. The 3D
> cockpit/hero/VR design docs and the completed staged-build specs were archived after
> the dashboard moved to an HTML-first redesign and games migrated to Pixi/Phaser
> archetypes. Start with the **Codebase Map** below.

## Start here

| Doc | Scope |
|-----|-------|
| [`docs/CODEBASE-MAP.md`](CODEBASE-MAP.md) | **Ground-truth map** of what the code actually does today (architecture, game system, hotspots, where to find things). |
| `CLAUDE.md` | Autonomous development playbook (project identity, tech stack, conventions). |

## Active / authoritative

| Doc | Scope |
|-----|-------|
| `fable-audit-v1.md` | Current code/security/frontend audit. The live findings list. |
| `Fable-Frontend-Enhancement.md` | UI/game redesign strategy + MCP platform research. |
| `docs/UI-Game-Enhancements/Game-Migration-Map.md` | Per-game archetype/skin migration map (Waves 1–7 done). |
| `docs/UI-Game-Enhancements/Phase-D-Status.md` | Phase D assessment + decision plan. |
| `docs/UI-Game-Enhancements/Adaptive-Quality-Strategy.md` | "Optimize, don't downgrade" quality-tier plan for low-end devices. |
| `docs/UI-Game-Enhancements/Asset-Pipeline-Setup.md` | How to acquire/wire Blender/Rive/Scenario/Figma + emoji-art sweep. |
| `Ui-Creation.md` | No-emoji policy + UI creation guidance. |
| `PROGRESS.md` | Build progress log. |

## Operational / reference (kept)

| Doc | Scope |
|-----|-------|
| `TESTING.md` | Test strategy (Vitest + Playwright + MSW). |
| `DEPLOYMENT.md` | Deployment to Vercel. |
| `database-patterns.md` | Supabase/Postgres + RLS conventions. |
| `docs/STATE_ARCHITECTURE.md` | Zustand store architecture. |
| `docs/DISASTER_RECOVERY.md` | Supabase PITR / recovery runbook. |
| `docs/UX_CONTRAST_POLICY.md` | WCAG contrast policy. |
| `docs/automation-playbook.md` | Build/CI automation. |
| `docs/research/` | AI trends + flagship game concepts (Lab-11 source). |
| `docs/legal/` | Compliance, content coverage, accessibility audits. |
| `docs/01-decisions/` | Decision records. |

## Archived (superseded — historical only)

`docs/archive/` holds ~181 superseded docs in six folders
(`root-design-cockpit-era/`, `root-audits-superseded/`, `root-misc-superseded/`,
`3d-cockpit-hero/`, `stage-build-records/`, `business/`). Manifest:
[`docs/archive/SUPERSEDED_BY.md`](archive/SUPERSEDED_BY.md). Do not use them as a source
of truth; recover from git history if 3D cockpit work is revived.
