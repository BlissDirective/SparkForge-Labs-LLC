# SparkForge — Codebase Map

**Branch:** `setup-sparkforge-dev` · **Generated:** 2026-06-29 · **Source:** codebase-memory-mcp index (19,553 nodes / 37,299 edges / 1,429 files) + direct tree audit

> This is the **ground-truth** map of what the code actually does today, not what the
> design docs aspire to. Where the two disagree, the code wins. The biggest divergence:
> the **3D Laboratory Control Station cockpit has been removed from the active render
> path** and replaced by an HTML-first dashboard (see §6). Many docs still describe the
> cockpit as live — they are stale (see `docs/INDEX.md` and the cleanup manifest).

---

## 1. What SparkForge Is

A gamified AI-literacy platform for ages 7–16: **42 games across 11 themed Labs**, dark-mode
"Frost-Prismatic" aesthetic, subscription tiers (Free / Plus / Forge). Next.js 15 App Router,
React 19, TypeScript strict, Supabase backend, Stripe billing.

## 2. Tech Stack (as installed — 78 deps / 32 dev)

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router, Turbopack), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 |
| DB / Auth | Supabase (Postgres + RLS + Storage), project ref `gqoaknfboahuqvgpidgw` |
| State | Zustand (19 stores) + Jotai atoms |
| Server state | React Query (@tanstack/react-query) |
| Validation | Zod |
| Payments | Stripe |
| AI | Anthropic Claude API; @mlc-ai/web-llm (on-device tutor) |
| **2D games** | **Pixi.js v8 + @pixi/react v8** (archetype renderers), **Phaser 4** (maze) |
| 3D (legacy) | React Three Fiber v9 + drei + postprocessing (present but mostly dormant — §6) |
| Animation | Rive (@rive-app/react-canvas), Motion, GSAP |
| Monitoring | Sentry |
| Testing | Vitest (unit/integration) + Playwright (E2E) + MSW |
| Deploy | Vercel |

## 3. Directory Topology

```
src/
├── app/                      335 nodes · 59 page routes · 104 API route.ts files
│   ├── (dashboard)/          HTML-first dashboard shell (layout.tsx replaces cockpit)
│   ├── (marketing)/          landing, pricing
│   ├── api/                  104 route handlers (children, games, stripe, cron, content…)
│   └── dev/                  dev-only pages (hero-v3 sandbox — legacy)
├── components/               1,652 nodes
│   ├── games/                45 game .tsx + pixi/ archetypes + phaser/ maze
│   ├── 3d/                   205 .tsx — LEGACY cockpit/hero tree, mostly off-path (§6)
│   ├── layout/               Sidebar, TopBar, BottomNav (active dashboard chrome)
│   ├── ai-tutor/             on-device tutor (web-llm) + guide store binding
│   └── dashboard/, auth/, providers/, shared/ …
├── stores/                   19 Zustand stores (301 nodes)
├── hooks/                    209 nodes
├── lib/                      943 nodes — supabase, stripe, 3d/, hero/, branding, cron-auth
├── shaders/                  47 shader files (legacy 3D)
└── types/                    canonical LABS, GameId unions
```

## 4. Game Architecture (the live, current path)

Games are the heart of the product and the most recently reworked subsystem.

- **Shell:** every game mounts in `GameShell` (provides `JuiceProvider`, XP/celebration on
  `completeGame()`), driven by `GameLevelSystem`.
- **Shared renderers:** `QuizLevelRenderer`, `SimulationLevelRenderer`, `GameVisualKit`.
- **2D archetypes (Pixi v8):** four reusable canvas stages under
  `src/components/games/pixi/` —
  - `PixiSortStage` / `PixiBinSortStage` (**SORT**)
  - `PixiRevealStage` (**REVEAL**)
  - `PixiConnectStage` (**CONNECT**)
  - `PixiReactStage` (**REACT**)
  - plus `PixiStageSkeleton` (shared `h-[420px]` loading placeholder — single source of
    the arbitrary spacing value, keeps the spacing-budget unit test green).
  - **CSP note:** `primitives.ts` imports `pixi.js/unsafe-eval` at the top so Pixi runs
    under the app's strict CSP. Do not remove.
- **Maze archetype (Phaser 4):** `phaser/mazeGame.ts` + `PhaserMazeStage.tsx`
  (type-only Phaser import, runtime injection; recursive-backtracker gen + BFS solve).
- **Loader:** `src/app/(dashboard)/arcade/[gameSlug]/game-loaders.ts` lazy-imports each game.
  `def()` resolves `named && mod[named] ? mod[named] : mod.default` — migrated games are
  **default exports**, so the default fallback is required (its absence caused React #306).
- **Dev hook:** `window.__SPARKFORGE_GAME__` exposes game state for the Playwright smoke test.
- **Migration status:** Waves 1–7 migrated ~26 quiz/sim games onto the Pixi/Phaser
  archetypes. See `docs/UI-Game-Enhancements/Game-Migration-Map.md` and `Phase-D-Status.md`.

## 5. Backend & Cross-Cutting Systems

- **Supabase:** all persistent data; RLS enforced. `createServerSupabase` (74 fan-in),
  `createAdminClient` (63), `requireAuth` (78), `verifyChildOwnership` (56) are the
  highest-traffic helpers — touch them carefully.
- **API envelope:** `apiError` (120 fan-in) / `apiSuccess` (113) wrap every route response.
- **Auth/session:** `middleware.ts` (`set`, 154 fan-in — highest in the graph) handles
  session refresh + CSRF (requires `CSRF_SECRET`).
- **Cron:** `src/lib/cron-auth.ts` — bearer-verified; unauthenticated bypass requires
  `ALLOW_UNAUTHENTICATED_CRON==='true' && NODE_ENV!=='production'`, else 500.
- **Billing:** Stripe checkout → `api/stripe/webhook` → `tierFromPriceId`; unmapped price
  IDs raise a Sentry error.
- **Content:** React Query `useContent` (117 fan-in); admin curation pipeline + AI content
  generator.
- **AI tutor:** `AITutorContext` binds `guideStore` to the active child
  (`bindToChild`) so per-child tutor state never leaks across profile switches.

## 6. Legacy 3D / Cockpit — OFF the active path ⚠️

The dashboard `layout.tsx` header says it all: *"Replaces the 3D cockpit with a clean,
accessible, responsive HTML dashboard."* Consequences:

- **Still on disk:** 205 `src/components/3d/*.tsx`, 47 shaders, `cockpitStore`,
  `cockpitAtoms`, `useHeroAnimation`, `lib/3d/*`, `lib/hero/*`, `src/app/dev/hero-v3`.
- **No longer rendered** by the dashboard. `eventBridge.now` (138 fan-in) is part of this
  dormant 3D system.
- **Implication for docs:** every doc describing the cockpit / hero cinematic / VR /
  Laboratory Control Station as the live UI is **stale**. These are the primary cleanup
  targets (Cockpit-Interface-Plan.md, BRAND_HERO_ACTION_PLAN.md, SparkForge-VR-Update.md,
  docs/hero-v3/, large parts of the v3 design audits).
- **Not deleted yet** because some primitives (branding material, Rive/Pixi juice) may be
  reused by the adaptive-quality strategy. Code removal is a separate decision from doc
  cleanup.

## 7. Hotspots (by fan-in — change with care)

| Symbol | Fan-in | Role |
|--------|-------:|------|
| `middleware.set` | 154 | session/CSRF middleware |
| `eventBridge.now` | 138 | **legacy 3D** event bus (dormant) |
| `apiError` | 120 | API error envelope |
| `useContent.select` | 117 | content fetching |
| `apiSuccess` | 113 | API success envelope |
| `toastStore.error` | 101 | global toasts |
| `requireAuth` | 78 | route auth guard |
| `createServerSupabase` | 74 | server DB client |
| `createAdminClient` | 63 | service-role DB client |
| `verifyChildOwnership` | 56 | child-scope authz |

## 8. Testing & Tooling

- **Unit/integration:** Vitest (~816 tests). Notable: `cron-auth.test.ts` (9),
  spacing-budget guard (§7.5).
- **E2E:** Playwright — `tests/e2e/game-migration-smoke.spec.ts` drives 26 migrated games,
  asserts a canvas mounts and zero page errors. Launch with
  `executablePath: '/opt/pw-browsers/chromium'` (never run `playwright install` here).
- **Codebase graph:** codebase-memory-mcp 0.8.1 indexes the repo; use
  `search_graph` / `trace_path` / `get_architecture` before broad code exploration.

## 9. How to Find Things

| Looking for… | Go to |
|---|---|
| A game's logic | `src/components/games/<Name>Game.tsx` |
| Shared 2D canvas rendering | `src/components/games/pixi/` |
| Maze game | `src/components/games/phaser/` |
| Game lazy-loading | `src/app/(dashboard)/arcade/[gameSlug]/game-loaders.ts` |
| Dashboard chrome | `src/components/layout/` |
| Auth / session | `src/middleware.ts`, `src/lib/auth*`, `requireAuth` |
| DB access | `src/lib/supabase/*`, `createServerSupabase` |
| Billing | `src/app/api/stripe/`, `tierFromPriceId` |
| Lab colors / canonical labs | `src/config/labColors.ts`, `src/types/index.ts` |
| Legacy 3D (dormant) | `src/components/3d/`, `src/shaders/`, `src/lib/3d/` |

---
*Regenerate after major structural changes: re-run codebase-memory-mcp `index_repository`,
then update §3/§7 from `get_architecture`.*
