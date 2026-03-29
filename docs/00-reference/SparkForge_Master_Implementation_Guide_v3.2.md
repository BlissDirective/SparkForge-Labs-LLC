# SPARKFORGE — MASTER IMPLEMENTATION GUIDE

**Version:** 4.0 | **Date:** March 29, 2026 | **For:** Claude Code (Local Terminal + Remote Mobile)
**Supersedes:** Master Implementation Guide v3.3 (March 23, 2026) — Complete overhaul: Added comprehensive Document-to-Code Map (Section 3) linking every stage .md to every /src file. Added Complete Source Code Registry (Section 4) mapping all 409 src files to stage origins. Added Enhancement & Undocumented Files Map (Section 5) identifying 100+ files created during audit/enhancement cycles. Updated all registries (13 stores, 35 hooks, 93 3D components). Added 30-day commit log (50 commits). Added Known Gaps section. Aligned with CLAUDE.md v6.0 and D3D Desktop-First Overhaul (20 decision locks).

**Purpose:** Single entry point for building SparkForge from stage documents. This v4.0 is the **ultra-comprehensive edition** — every document and every source file in the repo is mapped, indexed, and linked to its stage of origin. Use this as your development GPS.

---

## SECTION 1: OVERVIEW & HOW TO USE

### Workflow

1. **Find your stage** in the Build Execution Plan (Section 11)
2. **Look up the stage** in the Document-to-Code Map (Section 3) to see every .md and every /src file
3. **Read the stage .md** for complete copy-paste code
4. **Create files** in the order specified by the stage doc
5. **Validate:** `npm run build` + `npx tsc --noEmit` + browser check
6. **Commit** and move to next part/stage

### Critical Rules

- **Single-pass build with v3-FINAL priority.** Where a v3-FINAL document exists, it is the ONLY source needed. It contains ALL v2 content plus v3 visual enhancements. Do NOT build v2 first then patch.
- **Follow stages in order:** 1 → 2 → 3 → 3-Hero → 3-Cockpit → 3-Login3D → 4 → 5 → 6 → 7 → 8 → 9 → 10
- **Each stage depends on ALL previous stages being complete**
- **Never skip ahead. Never implement partial files.**
- **Every code block is COMPLETE** — copy entire file contents
- **Always evaluate local and remote files** for potential new additions or modifications before starting a stage
- **Read documents prior to development** — Some stages require v2 docs first, others require v3 first

### Key Reference Documents

| Priority | Document | Location | Purpose |
|----------|----------|----------|---------|
| 1 | **CLAUDE.md v6.0** | Repo root | Architecture, rules, autonomy, D3D decisions |
| 2 | **This file (v4.0)** | `docs/00-reference/` | Ultra-comprehensive file map, registries |
| 3 | **Stage documents** | `docs/stage*/` folders | Complete copy-paste code per stage |
| 4 | **PROGRESS.md** | Repo root | Current build status, phase tracking |
| 5 | **Master Directory v1.2** | `docs/00-reference/` | 26-phase flow map, file registry |
| 6 | **GCUD V10.2** | `docs/00-reference/` | Source of truth for game content + status |
| 7 | **3D-Component-Registry.md** | `docs/00-reference/` | 93-component 3D registry with tiers/budgets |
| 8 | **Per-Stage-Playbooks.md** | `docs/00-reference/` | Full build playbooks for all 10 stages |
| 9 | **CPA v2.0** | `docs/00-reference/` | 3D Panoramic Cockpit full spec |
| 10 | **ERROR_HANDLING_AUTOFIX_GUIDE.md** | `docs/00-reference/` | Build/TS/import error patterns |

### Environment

- **Runtime:** Node.js 20+ LTS
- **Framework:** Next.js 15 (React 19, Turbopack, App Router)
- **Language:** TypeScript strict mode
- **Styling:** Tailwind CSS 4 (Oxide engine)
- **3D:** React Three Fiber v9 + drei + postprocessing (Three.js r183+, TSL, WebGPU/WebGL2)
- **State:** Zustand (13 stores) + Jotai (3D atoms)
- **Testing:** Vitest + Playwright + MSW
- **Deployment:** Vercel

### Repo Statistics (as of March 29, 2026)

| Metric | Count |
|--------|-------|
| Source files (`/src/`) | 409 |
| Documentation files (`/docs/`) | 128 |
| Root config/doc files | 25+ |
| Games (all functional) | 35 |
| 3D components | 140 |
| Stores | 13 |
| Hooks | 35 |
| API routes | 32 |
| Shaders (TSL + GLSL) | 24 |
| Stage documents (active) | 80+ |
| Superseded documents | 8 |
| Commits (past 30 days) | 50 |
| Decision locks | 84 (48 core + 4 OD + 12 CPA2 + 20 D3D) |

---
