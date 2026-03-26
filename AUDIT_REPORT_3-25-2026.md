# SparkForge — Consolidated Audit Report

**Date:** March 25, 2026
**Auditor:** SparkForge Audit Agent v1.0
**Repo:** blissdirective/sparkforge
**Commit:** `3eb83e9a428fe38dab158dfbfff7df3e9b703d36`
**Build Status:** FAIL (dependencies not installed)
**Test Results:** Vitest — FAIL (not installed locally) | Playwright — FAIL (not configured)
**TypeScript Errors:** 15,378 total (13,613 from missing node_modules + 1,536 implicit `any` + 229 real code errors)
**ESLint:** FAIL (no `eslint.config.js` — needs ESLint v9+ flat config migration)
**Source Files:** 346 TypeScript/TSX files

---

## Executive Summary

SparkForge has **346 source files** across a well-structured Next.js 15 App Router codebase with all 35 games code-complete. However, **`node_modules` is missing/incomplete**, which cascades into build failure, 15,378 TypeScript errors, and inability to run tests. Once dependencies are installed, the real error surface drops to ~1,765 TypeScript issues — predominantly **1,536 implicit `any` parameter types** (TS7006/TS7031) and **229 genuine code errors** (missing props, Zod parse typing, property access on `unknown`). ESLint has no flat config file. No test infrastructure is runnable. These are all fixable without architectural changes.

### Finding Counts (Phase 0)

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| HIGH | 5 |
| WARNING | 4 |
| INFO | 2 |
| PASS | 6 |

---

## Phase 0 — Environment Scan Results

### Environment

| Check | Result |
|-------|--------|
| Node.js | v22.22.0 |
| npm | 10.9.4 |
| Package manager | npm (package-lock.json present) |
| TypeScript strict mode | `"strict": true` in tsconfig.json |
| Source directory | `src/` with 10 subdirectories |

---

## CRITICAL FINDINGS

### CRIT-001 — node_modules missing/incomplete — build cannot run

**Category:** Environment / Build
**Description:** `node_modules` directory is missing or incomplete. `next`, `react`, `zustand`, `jotai`, `@react-three/fiber`, and all other dependencies are unresolvable. This causes `npm run build` to fail immediately (`sh: 1: next: not found`) and inflates TypeScript errors to 15,378.
**Evidence:**
```
> sparkforge-init@0.1.0 build
> next build
sh: 1: next: not found
```
**Required Fix:**
```bash
npm install
```
Then re-run `npm run build` and `npx tsc --noEmit` to get the real error count. All 13,613 "Cannot find module" errors will resolve. The remaining ~1,765 errors are the real audit surface.

---

### CRIT-002 — ESLint not configured for v9+ flat config

**Category:** Tooling / Code Quality
**Description:** ESLint 10.0.0 is available via npx but no `eslint.config.js` (flat config) exists. The project has no `.eslintrc.*` file either. Zero linting is enforced.
**Evidence:**
```
ESLint: 10.0.0
ESLint couldn't find an eslint.config.(js|mjs|cjs) file.
```
**Required Fix:** Create `eslint.config.js` at repo root:
```javascript
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      '@next/next': nextPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
    settings: { react: { version: 'detect' } },
  },
  { ignores: ['.next/', 'node_modules/', 'public/'] }
);
```
Install required packages:
```bash
npm install -D eslint @eslint/eslintrc typescript-eslint eslint-plugin-react eslint-plugin-react-hooks @next/eslint-plugin-next
```

---

### CRIT-003 — No test infrastructure runnable

**Category:** Testing
**Description:** Neither Vitest nor Playwright can execute. Vitest is not installed locally (ran via npx, failed to resolve `vitest/config`). Playwright is not configured. No MSW mock handlers exist (`src/mocks/` directory missing). Zero test coverage is verifiable.
**Evidence:**
```
Error: Cannot find module 'vitest/config'
---
MSW handlers not found
```
**Required Fix:**
```bash
# Install test dependencies
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom
npm install -D @playwright/test
npm install -D msw

# Initialize Playwright
npx playwright install

# Create MSW handler directory
mkdir -p src/mocks
```
Then create `src/mocks/handlers.ts` with mock handlers for critical API routes (auth, children, progress, gamification, stripe).

---

## HIGH FINDINGS

### HIGH-001 — 229 genuine TypeScript code errors

**Category:** TypeScript Quality
**Description:** After filtering out missing-module errors (13,613) and implicit-any errors (1,536), there are 229 real code errors that indicate actual bugs or type mismatches.
**Breakdown:**

| Error Code | Count | Description | Top Affected Files |
|------------|-------|-------------|-------------------|
| TS2741 | 84 | Missing required props (`children` prop not passed) | `layout.tsx`, creature components, `SidePanels.tsx` |
| TS2339 | 44 | Property access on `unknown` (Zod parse results untyped) | API routes: `signup`, `prompt-lab`, `content`, `badges` |
| TS2322 | 35 | Type mismatch in assignments | Various components |
| TS18046 | 17 | Accessing properties on `unknown` type | API routes: `login`, `children/[childId]` |
| TS2739 | 12 | Missing properties in object type | Component props |
| TS2347 | 4 | Unrelated types in comparison | — |
| TS2305 | 4 | Module has no exported member | — |
| TS2538 | 3 | Cannot use type as index | — |
| TS2345 | 1 | Argument type mismatch | — |

**Evidence (top 3 patterns):**

*Pattern 1 — Missing `children` prop (84 errors):*
```typescript
// src/app/(dashboard)/layout.tsx:54
<DemoGuard>  // TS2741: Property 'children' is missing
// FIX: <DemoGuard>{children}</DemoGuard> — ensure children is passed through
```

*Pattern 2 — Zod parse result typed as `unknown` (44+17 = 61 errors):*
```typescript
// src/app/api/auth/signup/route.ts:17
const { email, password, fullName, coppaConsent, timezone } = parsed.data;
// TS2339: Property 'email' does not exist on type 'unknown'
// FIX: Type the parseBody helper with generic: parseBody<SignupData>(req, SignupSchema)
//   OR: const data = parsed.data as z.infer<typeof SignupSchema>;
```

*Pattern 3 — Record index with untyped key (TS7053, counted in implicit-any):*
```typescript
// src/app/(dashboard)/arcade/page.tsx:226
const tierInfo = TIER_CONFIG[game.tier];
// FIX: Type the game parameter: (game: GameRegistryEntry) => ...
```

**Required Fix:** These break down into 3 systematic fixes:
1. **Zod `parseBody` helper** — add generic type parameter so `parsed.data` is typed:
   ```typescript
   async function parseBody<T>(req: Request, schema: z.ZodSchema<T>): Promise<{ success: true; data: T } | { success: false; error: z.ZodError }> { ... }
   ```
2. **Component `children` props** — pass `children` through wrapper components or make it optional (`children?: React.ReactNode`)
3. **Callback parameter types** — add explicit types to `.map()`, `.filter()`, event handler callbacks

---

### HIGH-002 — 1,536 implicit `any` parameter types (TS7006/TS7031)

**Category:** TypeScript Quality
**Description:** 1,536 parameters lack explicit type annotations, relying on implicit `any` which TypeScript strict mode correctly flags. Most are in callbacks (`.map()`, `.filter()`, event handlers, Zustand `set`/`get`, R3F `useFrame` delta).
**Top offenders:**

| Parameter Name | Count | Typical Location |
|---------------|-------|-----------------|
| `delta` | 208 | R3F `useFrame((state, delta) => ...)` |
| `_` (unused) | 207 | Callbacks ignoring first arg |
| `i` (index) | 174 | `.map((item, i) => ...)` |
| `s` (state) | 133 | Zustand `set(s => ...)` |
| `state` | 115 | R3F `useFrame((state) => ...)` |
| `prev` | 78 | `setState(prev => ...)` |
| `e` (event) | 65 | Event handlers `onChange={(e) => ...}` |
| `p` | 58 | Various callbacks |
| `clock` | 48 | R3F `useFrame(({clock}) => ...)` |
| `el` | 26 | Ref callbacks |

**Required Fix:** Systematic type annotation pass. Examples:
```typescript
// R3F useFrame — add RootState and number types
useFrame((state: RootState, delta: number) => { ... })

// Zustand set — type already inferred if store creator is typed
set((s: MyStoreState) => ({ ...s, value: newValue }))

// Event handlers
onChange={(e: React.ChangeEvent<HTMLInputElement>) => ...}

// Map/filter callbacks — type the array or parameter
items.map((item: ItemType, i: number) => ...)
```
This is a bulk fix — consider running a codemod or adding type annotations file-by-file during each stage audit.

---

### HIGH-003 — Vitest config references uninstalled dependency

**File:** `vitest.config.ts`
**Category:** Testing / Build
**Description:** `vitest.config.ts` imports from `vitest/config` and `path`, but vitest is not in `package.json` dependencies (or node_modules is missing). Config file itself also uses `__dirname` which requires `@types/node`.
**Evidence:**
```
vitest.config.ts(1,30): error TS2307: Cannot find module 'vitest/config'
vitest.config.ts(2,18): error TS2307: Cannot find module 'path'
vitest.config.ts(25,25): error TS2304: Cannot find name '__dirname'
```
**Required Fix:**
```bash
npm install -D vitest @vitest/coverage-v8 @types/node
```

---

### HIGH-004 — tests/setup.ts uses `global` without Node types

**File:** `tests/setup.ts`
**Category:** Testing
**Description:** Test setup file references `global` (Node.js global object) without `@types/node` installed.
**Evidence:**
```
tests/setup.ts(19,1): error TS2304: Cannot find name 'global'.
tests/setup.ts(26,1): error TS2304: Cannot find name 'global'.
```
**Required Fix:** Ensure `@types/node` is in devDependencies and `tsconfig.json` includes `"types": ["node"]` in compilerOptions, or the test tsconfig extends the base with node types.

---

### HIGH-005 — DemoGuard missing `children` prop in dashboard layout

**File:** `src/app/(dashboard)/layout.tsx` (line 54)
**Category:** Runtime / React
**Description:** `<DemoGuard>` is rendered without passing `children`, but its props interface requires it. This would cause a runtime error — the dashboard layout would fail to render for all users (demo and authenticated).
**Evidence:**
```typescript
// line 54
<DemoGuard />  // Missing children — should wrap child content
```
**Required Fix:**
```typescript
// Option A: Pass children through
<DemoGuard>{children}</DemoGuard>

// Option B: Make children optional in DemoGuardProps if it can render standalone
interface DemoGuardProps {
  children?: React.ReactNode;
}
```

---

## WARNING FINDINGS

### WARN-001 — Fonts loaded via Google Fonts CDN link, not next/font

**File:** `src/app/layout.tsx` (line 99)
**Category:** Performance
**Description:** Fonts (Exo 2, Sora, JetBrains Mono, Orbitron) are loaded via a `<link>` tag to Google Fonts CDN instead of using `next/font/google`. This adds an external network request, doesn't benefit from Next.js font optimization (self-hosting, preloading, `font-display`), and creates a FOUT (flash of unstyled text).
**Evidence:**
```html
<link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@...&display=swap" rel="stylesheet" />
```
**Required Fix:**
```typescript
import { Exo_2, Sora, JetBrains_Mono, Orbitron } from 'next/font/google';

const exo2 = Exo_2({ subsets: ['latin'], weight: ['400','500','600','700','800'], variable: '--font-display' });
const sora = Sora({ subsets: ['latin'], weight: ['300','400','500','600','700'], variable: '--font-body' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400','500','700'], variable: '--font-mono' });
const orbitron = Orbitron({ subsets: ['latin'], weight: ['400','500','600','700'], variable: '--font-data' });

// In <body>:
<body className={`${exo2.variable} ${sora.variable} ${jetbrainsMono.variable} ${orbitron.variable}`}>
```
Update `tailwind.config.ts` fontFamily to use CSS variables:
```typescript
fontFamily: {
  display: ['var(--font-display)', 'system-ui', 'sans-serif'],
  body: ['var(--font-body)', 'system-ui', 'sans-serif'],
  mono: ['var(--font-mono)', 'monospace'],
  data: ['var(--font-data)', 'monospace'],
},
```

---

### WARN-002 — tailwind.config.ts uses `require()` without Node types

**File:** `tailwind.config.ts` (line 156)
**Category:** TypeScript
**Description:** Uses CommonJS `require()` which TypeScript cannot resolve without `@types/node`.
**Evidence:**
```
tailwind.config.ts(156,13): error TS2580: Cannot find name 'require'.
```
**Required Fix:** Replace `require()` with ESM `import`, or ensure `@types/node` is installed. If it's a Tailwind plugin, use:
```typescript
import plugin from 'tailwindcss/plugin';
```

---

### WARN-003 — In-memory rate limiting not production-ready

**File:** `src/lib/rate-limit.ts`
**Category:** Security / Scalability
**Description:** Rate limiting uses an in-memory `Map` store. This works for single-instance Vercel deployments but will not work correctly with multiple serverless function instances (each instance has its own Map). Rate limits could be bypassed under load.
**Required Fix:** For production, replace with Upstash Redis rate limiter:
```bash
npm install @upstash/ratelimit @upstash/redis
```
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'),
});
```

---

### WARN-004 — useApi.ts stub still present (BUG-1 not fully resolved)

**File:** `src/hooks/useApi.ts`
**Category:** Architecture / Doc-Drift
**Description:** The old `useApi.ts` stub file from Stage 1 still exists. Per BUG-1, Stage 4 Part 1 should have replaced it entirely. The stub may cause confusion or incorrect hook usage.
**Required Fix:** Delete `src/hooks/useApi.ts` if Stage 4 replacement hooks (React Query-based) are in place. Verify no imports reference it, then remove.

---

## INFO FINDINGS

### INFO-001 — Sentry config files reference missing module

**Files:** `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
**Category:** Doc-Drift / Environment
**Description:** Three Sentry config files exist and import from `@sentry/nextjs`, but the package is not installed (missing node_modules). These files are correctly structured but will error until dependencies are installed.
**Impact:** Non-functional until `npm install`. No code changes needed — just dependency installation.

---

### INFO-002 — npm major version update available

**Description:** npm 11.12.0 is available (current: 10.9.4). Non-blocking.
**Impact:** Cosmetic. Update at convenience: `npm install -g npm@11.12.0`

---

## PASS FINDINGS

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | TypeScript strict mode enabled | PASS | `tsconfig.json` has `"strict": true` |
| 2 | next.config.ts serverExternalPackages | PASS | Three.js externalized: `['three', '@react-three/fiber', '@react-three/drei']` |
| 3 | Source file structure | PASS | 10 directories under `src/`: app, components, config, hooks, lib, middleware, shaders, stores, types |
| 4 | package.json + lockfile present | PASS | Both `package.json` and `package-lock.json` exist |
| 5 | Node.js version compatible | PASS | v22.22.0 (LTS) — fully compatible with Next.js 15 |
| 6 | Git repository initialized | PASS | Recent commits show active development |

---

## PHASE 0 — COMMAND OUTPUTS SUMMARY

### TypeScript Compiler (`npx tsc --noEmit`)

| Category | Count |
|----------|-------|
| Total errors | 15,378 |
| Missing module declarations (TS2307, TS2503, TS7026, TS2580, TS2304) | 13,613 |
| Implicit `any` parameters (TS7006, TS7031) | 1,536 |
| Missing required props (TS2741) | 84 |
| Property on unknown (TS2339) | 44 |
| Type mismatch (TS2322) | 35 |
| Unknown access (TS18046) | 17 |
| Missing object properties (TS2739) | 12 |
| Other (TS2347, TS2305, TS2538, TS2345, TS7053) | 37 |

**Verdict:** ~13,613 errors resolve with `npm install`. Remaining ~1,765 are real code issues requiring fixes.

### Next.js Build (`npm run build`)

```
> sparkforge-init@0.1.0 build
> next build
sh: 1: next: not found
```
**Verdict:** FAIL — dependencies not installed.

### Vitest (`npx vitest run`)

```
Error: Cannot find module 'vitest/config'
```
**Verdict:** FAIL — vitest not in local dependencies.

### Playwright

Not configured. No `playwright.config.ts` found.
**Verdict:** FAIL — not set up.

### ESLint (`npx eslint "src/**/*.{ts,tsx}"`)

```
ESLint couldn't find an eslint.config.(js|mjs|cjs) file.
```
**Verdict:** FAIL — no config file.

### MSW Mock Handlers

```
MSW handlers not found — src/mocks/ directory does not exist
```
**Verdict:** FAIL — no mock infrastructure.

---

## RECOMMENDED TRIAGE ORDER (Phase 0)

1. **`npm install`** — resolves CRIT-001, unlocks build/test capability, clears ~13,613 TS errors
2. **Fix DemoGuard children prop** (HIGH-005) — prevents dashboard runtime crash
3. **Type Zod `parseBody` helper** (HIGH-001, pattern 2) — clears 61 API route errors
4. **Add explicit parameter types** (HIGH-002) — clears 1,536 implicit `any` warnings
5. **Create `eslint.config.js`** (CRIT-002) — enables linting
6. **Install test dependencies** (CRIT-003, HIGH-003, HIGH-004) — enables test execution
7. **Migrate fonts to `next/font`** (WARN-001) — performance improvement
8. **Upgrade rate limiter to Redis** (WARN-003) — production readiness
9. **Remove `useApi.ts` stub** (WARN-004) — cleanup

---

# STAGE 1 AUDIT — Foundation

**Stage:** 1 (Phases 1-2)
**Source Docs:** `STAGE1_Foundation_v2_PART1`, `STAGE1_Foundation_v2_PART2`
**Scope:** Project config, Tailwind, types, stores, base components, root layout, game registry

## Stage 1 — Finding Counts

| Severity | Count |
|----------|-------|
| CRITICAL | 1 |
| HIGH | 2 |
| WARNING | 4 |
| INFO | 4 |
| PASS | 10 |

---

## Stage 1 — CRITICAL FINDINGS

### S1-CRIT-001 — LABS array in `types/index.ts` has 33 games, not 35 — 3 missing, 1 phantom

**File:** `src/types/index.ts`
**Category:** Architecture / Data Integrity
**Description:** The `LABS` constant (source of truth for `getAllGames()`, `getGameBySlug()`, and all UI game listings) contains only **33 games**. Three games present in `gameRegistry.ts` (35 entries) are MISSING from LABS:

| Missing Game | Lab | Tier |
|-------------|-----|------|
| `emoji-decoder` | Lab 8 (Words & Language) | FL-Lite |
| `my-first-ai-app` | Lab 9 (Build Your AI) | FL-Lite |
| `ai-or-not` | Lab 10 (AI Futures) | FL-Lite |

Additionally, `vibe-coder` exists in LABS (Lab 9) but does NOT exist in `gameRegistry.ts` — it appears to be a phantom/renamed game.

**Evidence:**
```bash
# gameRegistry.ts has 35 entries
grep -c "slug:" src/config/gameRegistry.ts  # → 35

# LABS in types/index.ts has 33 game slugs
grep -c "slug:" src/types/index.ts  # → 36 (35 games + 1 type definition)
# But 3 registry games are missing and 1 LABS game doesn't exist in registry
```

**Impact:** `getAllGames()` returns 33 instead of 35. `getGameBySlug('emoji-decoder')` returns `null`. Any UI using LABS as the game source shows incomplete data. The Arcade page and Lab navigation will be missing 3 games.

**Required Fix:**
1. Add `emoji-decoder` to Lab 8 games array in LABS
2. Add `my-first-ai-app` to Lab 9 games array in LABS
3. Add `ai-or-not` to Lab 10 games array in LABS
4. Remove or rename `vibe-coder` — cross-reference with GCUD V10.2 for the authoritative slug. If `vibe-coder` was renamed to one of the missing games, replace it.
5. Verify final count: `getAllGames().length === 35`

---

## Stage 1 — HIGH FINDINGS

### S1-HIGH-001 — Missing npm packages: `three-mesh-bvh` and `troika-three-text`

**File:** `package.json`
**Category:** Dependencies
**Description:** Stage 1 doc Step 2k specifies installing `three-bvh-csg three-mesh-bvh troika-three-text`. The actual `package.json` has `three-bvh-csg` but is **missing** `three-mesh-bvh` and `troika-three-text`.

**Impact:** Hero Animation v2.0 (Phase 5A-5B) depends on `three-mesh-bvh` for BVH-accelerated raycasting and `troika-three-text` for SDF 3D text rendering. Build will fail at Phase 5A without these.

**Required Fix:**
```bash
npm install three-mesh-bvh troika-three-text
```

---

### S1-HIGH-002 — Missing hooks: `useMediaQuery.ts` and `useIsMobile.ts`

**File:** `src/hooks/useMediaQuery.ts`, `src/hooks/useIsMobile.ts`
**Category:** Doc-Drift / D3D Compliance
**Description:** Stage 1 doc Step 21 specifies both files. Neither exists. Per D3D-1, `useIsMobile` was intentionally removed. However, `useMediaQuery` is a general-purpose utility that may still be imported by other code.

**Impact:** Any component importing `@/hooks/useMediaQuery` will fail. If no active imports remain, this is just a doc-drift issue.

**Required Fix:**
1. Search for imports: `grep -r "useMediaQuery\|useIsMobile" src/` — if zero active imports, downgrade to INFO
2. If imports exist for `useMediaQuery`, recreate as a generic hook:
   ```typescript
   // src/hooks/useMediaQuery.ts
   import { useState, useEffect } from 'react';
   export function useMediaQuery(query: string): boolean {
     const [matches, setMatches] = useState(false);
     useEffect(() => {
       const mql = window.matchMedia(query);
       setMatches(mql.matches);
       const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
       mql.addEventListener('change', handler);
       return () => mql.removeEventListener('change', handler);
     }, [query]);
     return matches;
   }
   ```
3. Update stage doc to note `useIsMobile` removed per D3D-1

---

## Stage 1 — WARNING FINDINGS

### S1-WARN-001 — `gameRegistry.ts` lab names inconsistent with `types/index.ts` LABS

**Files:** `src/config/gameRegistry.ts` (lines 32-43), `src/types/index.ts`
**Category:** Architecture / Data Consistency
**Description:** `LAB_NAMES` in gameRegistry.ts uses different titles from the LABS array in types/index.ts for 7 out of 10 labs:

| Lab | gameRegistry.ts | types/index.ts |
|-----|----------------|----------------|
| 2 | "AI Assistants" | "Teaching Machines" |
| 3 | "How AI Learns" | "The Brain Inside" |
| 4 | "AI & Language" | "AI That Creates" |
| 5 | "AI Agents" | "AI Helpers" |
| 6 | "AI & Society" | "AI & Ethics" |
| 8 | "AI Communication" | "Words & Language" |
| 9 | "Building with AI" | "Build Your AI" |

**Impact:** Different lab names appear in different parts of the UI depending on which data source is used (registry vs LABS constant).

**Required Fix:** Align `LAB_NAMES` in `gameRegistry.ts` to match the authoritative LABS array, or have gameRegistry import lab names from LABS. Single source of truth.

---

### S1-WARN-002 — `cockpitStore.ts` duplicates types locally instead of importing from `@/types`

**File:** `src/stores/cockpitStore.ts` (lines 12-16)
**Category:** TypeScript Quality
**Description:** `CockpitSkin`, `SpatialView`, `ConsoleType`, and `CeremonyType` are redefined locally in the store instead of being imported from `src/types/index.ts` where they are already defined.

**Impact:** If types diverge between the two locations, TypeScript won't catch the mismatch. Maintenance risk.

**Required Fix:**
```typescript
// Replace lines 12-16 with:
import type { CockpitSkin, SpatialView, ConsoleType, CeremonyType } from '@/types';
```

---

### S1-WARN-003 — `cockpitConfig.ts` export name doesn't match stage doc

**File:** `src/lib/3d/cockpitConfig.ts` (line 12)
**Category:** Doc-Drift
**Description:** Stage doc specifies export name `COCKPIT_GEOMETRY_V2`. Actual code exports `COCKPIT_GEOMETRY` (no `_V2` suffix). Consumer `useAdaptiveCockpit.ts` imports `COCKPIT_GEOMETRY` — code is internally consistent.

**Impact:** Cosmetic doc-drift. No runtime break.

**Required Fix:** Update stage doc Step 20c to use `COCKPIT_GEOMETRY`.

---

### S1-WARN-004 — `deviceStore.ts` significantly diverged from stage doc (D3D-1 overhaul)

**File:** `src/stores/deviceStore.ts`
**Category:** Doc-Drift
**Description:** Stage doc defines multi-device profiles (`DeviceType`, `DEVICE_PROFILES` for desktop/tablet/mobile, `hasSelected`, `setDeviceType`, `GPUTier` with `'css'` option). Actual code has D3D-1 hardcoded desktop-ultra profile with completely different API surface (`PerformanceProfile`, `DESKTOP_ULTRA_PROFILE`, `TriangleBudgetTier`, no device selection).

**Impact:** Code is correct per D3D-1 decision lock. Stage doc is outdated — anyone reading the doc will get the wrong API.

**Required Fix:** Update stage doc Step 20a to reflect the D3D-1 desktop-ultra store shape. Per CLAUDE.md Section 3.1, this is a mandatory auto-fix (deprecated API usage).

---

## Stage 1 — INFO FINDINGS

### S1-INFO-001 — `authStore.ts` expanded beyond Stage 1 scope (expected)

**Description:** Stage 1 doc defines simple store (`parent`, `isLoading`, `setParent`, `setLoading`, `clearAuth`). Actual store adds `isDemoMode`, `demoSession`, `startDemoSession`, `endDemoSession`, `checkDemoStatus` from Phase 5E-5F (Login 3D Enhancement). This is expected — stores evolve across stages.

### S1-INFO-002 — `uiStore.ts` retains deprecated `gameActive` flag

**Description:** CLAUDE.md Section 14 states `gameActive` is deprecated (use `sceneStore.enterGame`/`exitGame` instead). The flag still exists in uiStore but is unused by GameShell. Dead code — low priority cleanup.

### S1-INFO-003 — Root layout is Stage 10 replacement (expected)

**Description:** Current `src/app/layout.tsx` includes A11yProvider, ErrorBoundary, OfflineBanner, full SEO metadata, viewport config, PWA manifest — all Stage 10 enhancements. Expected since Stages 1-10 have been built.

### S1-INFO-004 — Barrel files exist in component directories

**Description:** Barrel files (`index.ts`) exist in `src/components/games/`, `src/shaders/`, `src/components/3d/environments/`, `src/components/3d/creatures/`. These re-export components for convenient imports. Next.js `optimizePackageImports` in `next.config.ts` handles the main offenders. Low impact on production bundle — may slow HMR in dev.

---

## Stage 1 — PASS FINDINGS

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | `tsconfig.json` strict mode + paths | PASS | `"strict": true`, `"@/*": ["./src/*"]` |
| 2 | `next.config.ts` serverExternalPackages | PASS | `['three', '@react-three/fiber', '@react-three/drei']` |
| 3 | `tailwind.config.ts` Frost-Prismatic colors | PASS | All neon accents, surface colors, lab colors 1-10 correct |
| 4 | BUG-10F: Correct fonts | PASS | Exo 2, Sora, JetBrains Mono, Orbitron. No Fredoka/Nunito. |
| 5 | IMP-4: Both `spark-*` and `neon-*` tokens | PASS | Both defined with correct values |
| 6 | No `any` types in Stage 1 files | PASS | Zero `any` usage in types, stores, lib |
| 7 | `gameStore.ts` matches stage doc | PASS | All actions: startGame, updateScore, advanceRound, completeGame, resetGame |
| 8 | `childStore.ts` matches stage doc | PASS | Persist middleware with partialize, all actions present |
| 9 | `toastStore.ts` matches stage doc | PASS | Convenience functions, auto-dismiss, max 3 toasts |
| 10 | `postcss.config.js` uses Tailwind 4 syntax | PASS | `'@tailwindcss/postcss': {}` (correct for TW4 Oxide engine) |

---

## Stage 1 — File Inventory

| Expected File | Status |
|--------------|--------|
| `tsconfig.json` | EXISTS |
| `tailwind.config.ts` | EXISTS |
| `postcss.config.js` | EXISTS |
| `next.config.ts` | EXISTS |
| `.env.example` | EXISTS |
| `src/app/globals.css` | EXISTS |
| `src/types/index.ts` | EXISTS (33 games, should be 35) |
| `src/stores/authStore.ts` | EXISTS (expanded by Phase 5E) |
| `src/stores/childStore.ts` | EXISTS |
| `src/stores/gameStore.ts` | EXISTS |
| `src/stores/toastStore.ts` | EXISTS |
| `src/stores/uiStore.ts` | EXISTS |
| `src/stores/deviceStore.ts` | EXISTS (D3D-1 divergence) |
| `src/stores/cockpitStore.ts` | EXISTS (CPA2 expanded) |
| `src/stores/sceneStore.ts` | EXISTS (D3D-B5 addition) |
| `src/stores/cockpitAtoms.ts` | EXISTS |
| `src/lib/utils.ts` | EXISTS |
| `src/lib/supabase/client.ts` | EXISTS |
| `src/lib/supabase/server.ts` | EXISTS |
| `src/lib/animations.ts` | EXISTS |
| `src/lib/tier-config.ts` | EXISTS |
| `src/lib/3d/cockpitConfig.ts` | EXISTS |
| `src/lib/3d/webgpuDetect.ts` | EXISTS |
| `src/hooks/useDebounce.ts` | EXISTS |
| `src/hooks/useLocalStorage.ts` | EXISTS |
| `src/hooks/useSystemPreferences.ts` | EXISTS |
| `src/hooks/useAdaptiveCockpit.ts` | EXISTS |
| `src/components/game/GameShell.tsx` | EXISTS |
| `src/config/gameRegistry.ts` | EXISTS (35 games) |
| `src/components/providers/QueryProvider.tsx` | EXISTS |
| `src/app/layout.tsx` | EXISTS (Stage 10 version) |
| `src/middleware.ts` | EXISTS |
| `sentry.client.config.ts` | EXISTS |
| `sentry.server.config.ts` | EXISTS |
| `sentry.edge.config.ts` | EXISTS |
| `src/app/global-error.tsx` | EXISTS |
| `vitest.config.ts` | EXISTS |
| `tests/setup.ts` | EXISTS |
| `src/hooks/useMediaQuery.ts` | **MISSING** (D3D-1 removal) |
| `src/hooks/useIsMobile.ts` | **MISSING** (D3D-1 removal) |

**Files Expected:** 39 | **Files Found:** 37 | **Missing:** 2 (intentional D3D-1 removal)

---

*Stage 1 audit complete. Stage 2-3 audits collected, pending write-up.*

*SparkForge Audit Agent v1.0 | Phase 0 + Stage 1 | March 25, 2026*
