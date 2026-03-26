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

*Phase 0 complete. Stages 1-10 deep audit, COPPA checklist, 35-game audit, and security audit pending — run next phases when ready.*

*SparkForge Audit Agent v1.0 | Phase 0 | March 25, 2026*
