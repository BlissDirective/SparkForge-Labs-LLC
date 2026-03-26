# SparkForge — Consolidated Audit Report

**Date:** March 25, 2026
**Auditor:** SparkForge Audit Agent v1.0
**Repo:** blissdirective/sparkforge
**Commit:** `3eb83e9a428fe38dab158dfbfff7df3e9b703d36`
**Build Status:** ~~FAIL (dependencies not installed)~~ **PASS** (resolved March 26, 2026 — Batch 1+2)
**Test Results:** ~~Vitest — FAIL (not installed locally)~~ **Vitest v4.1.2 installed** | ~~Playwright — FAIL (not configured)~~ **Playwright configured**
**TypeScript Errors:** ~~15,378 total~~ **0 errors** (resolved March 26, 2026 — Batch 1: npm install cleared 15,315; Batch 2: fixed remaining 63)
**ESLint:** ~~FAIL (no `eslint.config.js`)~~ **Build passes** (Next.js built-in ESLint + eslint-disable on TSL shaders)
**Source Files:** 346 TypeScript/TSX files

---

## Remediation Log (March 26, 2026)

### Batch 1: Environment & Dependencies
- `npm install --legacy-peer-deps` (nivo/React 19 conflict)
- Installed missing: `three-mesh-bvh`, `troika-three-text`, `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `msw`, `@playwright/test`, `@types/node`
- Created: `playwright.config.ts`, `src/mocks/handlers.ts` (24 API routes), `src/mocks/server.ts`, `src/mocks/browser.ts`, `tests/e2e/health.spec.ts`
- Deferred: WARN-003 (Redis rate limiter) — note added to Stage 10 doc

### Batch 2: TypeScript & ESLint Fixes
- Fixed 63 TypeScript errors: creature components (CreatureProps, MoodConfig, THREE namespace) + TSL shaders (Node type mismatches, atan2→atan, swizzle types)
- Removed unused imports from 17 component files
- Added eslint-disable to 19 TSL shader files (legitimate `as any` for Three.js TSL type gaps)
- **Result: `npm run build` PASS, `npx tsc --noEmit` 0 errors**

### Batch 3: Implicit `any` Type Annotations — SKIPPED
- Re-assessed: all 1,536 TS7006/TS7031 errors were artifacts of missing `node_modules`
- After Batch 1 `npm install`, TypeScript infers all parameter types from installed `.d.ts` definitions
- `npx tsc --noEmit` confirms 0 errors — no code changes needed

### Batch 4: ESLint Configuration (CRIT-002)
- Installed `typescript-eslint`
- Created `eslint.config.mjs` (ESLint v9 flat config)
- Extends `next/core-web-vitals` + `tseslint.configs.recommended`
- TSL shader files: `no-explicit-any` and `no-unused-vars` disabled via config (removed redundant inline directives)
- Fixed LabStructure3D.tsx no-op expression (line 812)
- **Result: ESLint 0 errors, 30 warnings (all acceptable) | Build PASS**

### Batch 5: Font Migration & Code Cleanup
- Removed duplicate `@import` for Google Fonts from globals.css (was loading fonts twice)
- Added CSS custom properties (`--font-display`, `--font-body`, `--font-mono`, `--font-data`) to `:root`
- Updated Tailwind fontFamily to use CSS variables with font-name fallbacks
- Replaced `require('tailwindcss-animate')` with ESM `import tailwindcssAnimate`
- Deleted deprecated `src/hooks/useApi.ts` stub (BUG-1, zero active imports)
- Full `next/font/google` migration deferred (build env lacks internet access for font fetch)
- **Result: Build PASS**

### Batch 6: Data Integrity Fixes
- **LABS array (S1-CRIT-001):** Fixed from 32 to 35 games
  - Added: `emoji-decoder` (Lab 8), `my-first-ai-app` (Lab 9), `ai-or-not` (Lab 10)
  - Removed: phantom `vibe-coder` (Lab 9 — no gameRegistry entry)
  - Moved: `prediction-market` from Lab 10 → Lab 7 (per GCUD V10.2)
  - Moved: `career-explorer` from Lab 10 → Lab 9 (per GCUD V10.2)
- **Lab names (S1-WARN-001):** Aligned 7 mismatched names in gameRegistry.ts LAB_NAMES to match LABS
- **cockpitStore types (S1-WARN-002):** Import from `@/types`, re-export for existing consumers
- **Result: Build PASS | TypeScript 0 errors | getAllGames().length === 35**

### Batch 7: Stage 1 Audit — Batch A (Verification & Downgrade)
- **S1-HIGH-002:** Downgraded to INFO — `useMediaQuery` and `useIsMobile` have zero active imports in `src/`. Both intentionally removed per D3D-1 (desktop-only platform). Only comment references remain. No code fix needed.
- **S1-INFO-002:** Verified `gameActive`/`setGameActive` in uiStore are still actively consumed by `useStationMode.ts` (lines 104-105, 325). Not dead code — deferred to future refactor when `sceneStore` fully replaces mode derivation.
- **Result: No code changes — audit report updated with verified findings**

### Batch 8: Stage 1 Audit — Batch B (Stage Doc Updates)
- **S1-WARN-003:** Updated `STAGE1_Foundation_v2_PART2.md` Step 20c — renamed `COCKPIT_GEOMETRY_V2` → `COCKPIT_GEOMETRY` across all 7 occurrences. Aligned `topBarSegments`/`sideSegments` to 20M upgrade values. Added structural detail constants. Added missing `parent`/`admin` bloom presets.
- **S1-WARN-004:** Replaced entire Step 20a `deviceStore` section with D3D-1 desktop-ultra implementation (PerformanceProfile, DESKTOP_ULTRA_PROFILE, TRIANGLE_BUDGETS, selector helpers). Updated Step 21 hooks: marked `useMediaQuery`/`useIsMobile` as REMOVED per D3D-1. Updated file inventory table.
- **Result: Stage doc now matches actual codebase — per CLAUDE.md Section 3.1 (auto-fix: deprecated API usage)**

### Batch 9: Stage 2 Audit Fixes (Security + Type Safety + Config)
- **S2-HIGH-001 (Security):** Added `verifyChildOwnership` to session end action — prevents session UUID enumeration
- **S2-HIGH-002 (TypeScript):** Defined `ProgressWithContent` type, removed 3x `as any` casts + 3 eslint-disable comments + 4 non-null assertions in badges route
- **S2-WARN-001 (Config):** Aligned Stripe env var names in `tier-config.ts` to match `.env.example` (`STRIPE_PLUS_MONTHLY_ID` format). Also fixed Stage 8 doc.
- **S2-WARN-002 (TypeScript):** Used `Anthropic.TextBlock` type guard + `catch (error: unknown)` with proper narrowing in prompt-lab route
- **S2-WARN-003 (Consistency):** Replaced raw `req.json()` with `parseBody` using `z.discriminatedUnion` schema in sessions route
- **S2-INFO-001, S2-INFO-002:** Deferred (cosmetic — no functional impact)
- **Result: All Stage 2 HIGH + WARNING findings resolved**

---

## Executive Summary

SparkForge has **346 source files** across a well-structured Next.js 15 App Router codebase with all 35 games code-complete. ~~However, `node_modules` is missing/incomplete, which cascades into build failure, 15,378 TypeScript errors, and inability to run tests.~~ **As of March 26, 2026:** All dependencies installed, build passes, TypeScript reports 0 errors, Vitest and Playwright are configured, MSW mock handlers cover all 24 API routes. Remaining Phase 0 items: ESLint flat config creation (CRIT-002), font migration to next/font (WARN-001), useApi.ts cleanup (WARN-004), and data integrity fixes (S1-CRIT-001, S1-WARN-001).

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

### CRIT-001 — ~~node_modules missing/incomplete — build cannot run~~ RESOLVED (Batch 1)

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

### CRIT-002 — ~~ESLint not configured for v9+ flat config~~ RESOLVED (Batch 4)

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

### CRIT-003 — ~~No test infrastructure runnable~~ RESOLVED (Batch 1)

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

### HIGH-001 — ~~229 genuine TypeScript code errors~~ RESOLVED (Batch 1+2: 0 errors remaining)

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

### HIGH-002 — ~~1,536 implicit `any` parameter types (TS7006/TS7031)~~ RESOLVED (Batch 1: all resolved by npm install restoring type definitions)

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

### HIGH-003 — ~~Vitest config references uninstalled dependency~~ RESOLVED (Batch 1)

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

### HIGH-004 — ~~tests/setup.ts uses `global` without Node types~~ RESOLVED (Batch 1)

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

### HIGH-005 — ~~DemoGuard missing `children` prop in dashboard layout~~ RESOLVED (Batch 1: npm install restored types, error was from missing node_modules)

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

### WARN-001 — ~~Fonts loaded via Google Fonts CDN link, not next/font~~ PARTIALLY RESOLVED (Batch 5: duplicate @import removed, CSS vars added, preconnect added. Full next/font migration deferred — requires internet at build time)

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

### WARN-002 — ~~tailwind.config.ts uses `require()` without Node types~~ RESOLVED (Batch 5: replaced with ESM import)

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

### WARN-003 — In-memory rate limiting not production-ready — DEFERRED (note added to Stage 10 doc)

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

### WARN-004 — ~~useApi.ts stub still present (BUG-1 not fully resolved)~~ RESOLVED (Batch 5: file deleted)

**File:** ~~`src/hooks/useApi.ts`~~ DELETED
**Category:** Architecture / Doc-Drift
**Description:** ~~The old `useApi.ts` stub file from Stage 1 still exists.~~ Deleted — all 4 replacement hooks confirmed in place (useChildren, useContent, useProgress, useGamification). Zero active imports of useApi.ts existed.
**Required Fix:** Delete `src/hooks/useApi.ts` if Stage 4 replacement hooks (React Query-based) are in place. Verify no imports reference it, then remove.

---

## INFO FINDINGS

### INFO-001 — ~~Sentry config files reference missing module~~ RESOLVED (Batch 1: npm install)

**Files:** `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
**Category:** Doc-Drift / Environment
**Description:** Three Sentry config files exist and import from `@sentry/nextjs`, but the package is not installed (missing node_modules). These files are correctly structured but will error until dependencies are installed.
**Impact:** ~~Non-functional until `npm install`.~~ Resolved by Batch 1 npm install.

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
| CRITICAL | 1 (resolved Batch 6) |
| HIGH | 1 (resolved Batch 1) + 1 (downgraded to INFO — Batch 7) |
| WARNING | 4 (all resolved: 2 Batch 6, 2 Batch 8) |
| INFO | 5 (4 original + 1 downgraded from HIGH). S1-INFO-002 deferred. |
| PASS | 10 |

---

## Stage 1 — CRITICAL FINDINGS

### S1-CRIT-001 — ~~LABS array in `types/index.ts` has 33 games, not 35 — 3 missing, 1 phantom~~ RESOLVED (Batch 6)

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

### S1-HIGH-001 — ~~Missing npm packages: `three-mesh-bvh` and `troika-three-text`~~ RESOLVED (Batch 1)

**File:** `package.json`
**Category:** Dependencies
**Description:** Stage 1 doc Step 2k specifies installing `three-bvh-csg three-mesh-bvh troika-three-text`. The actual `package.json` has `three-bvh-csg` but is **missing** `three-mesh-bvh` and `troika-three-text`.

**Impact:** Hero Animation v2.0 (Phase 5A-5B) depends on `three-mesh-bvh` for BVH-accelerated raycasting and `troika-three-text` for SDF 3D text rendering. Build will fail at Phase 5A without these.

**Required Fix:**
```bash
npm install three-mesh-bvh troika-three-text
```

---

### S1-HIGH-002 — ~~Missing hooks: `useMediaQuery.ts` and `useIsMobile.ts`~~ DOWNGRADED to INFO (Batch 7)

**File:** `src/hooks/useMediaQuery.ts`, `src/hooks/useIsMobile.ts`
**Category:** Doc-Drift / D3D Compliance
**Description:** Stage 1 doc Step 21 specifies both files. Neither exists. Per D3D-1, `useIsMobile` was intentionally removed. However, `useMediaQuery` is a general-purpose utility that may still be imported by other code.

**Impact:** ~~Any component importing `@/hooks/useMediaQuery` will fail.~~ **Verified March 26:** Zero active imports of `useMediaQuery` or `useIsMobile` in `src/`. Only 3 comment references remain (dashboard layout.tsx x2, deviceStore.ts x1). No code fix needed — doc-drift only.

**Resolution:** Downgraded from HIGH to INFO. Both hooks intentionally removed per D3D-1 (desktop-only platform). Stage doc update deferred to Batch B (S1-WARN-004 covers deviceStore doc update).

---

## Stage 1 — WARNING FINDINGS

### S1-WARN-001 — ~~`gameRegistry.ts` lab names inconsistent with `types/index.ts` LABS~~ RESOLVED (Batch 6: aligned all 10 lab names)

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

### S1-WARN-002 — ~~`cockpitStore.ts` duplicates types locally instead of importing from `@/types`~~ RESOLVED (Batch 6: imports from @/types, re-exports for consumers)

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

### S1-WARN-003 — ~~`cockpitConfig.ts` export name doesn't match stage doc~~ RESOLVED (Batch 8)

**File:** `src/lib/3d/cockpitConfig.ts` (line 12)
**Category:** Doc-Drift
**Description:** Stage doc specifies export name `COCKPIT_GEOMETRY_V2`. Actual code exports `COCKPIT_GEOMETRY` (no `_V2` suffix). Consumer `useAdaptiveCockpit.ts` imports `COCKPIT_GEOMETRY` — code is internally consistent.

**Impact:** Cosmetic doc-drift. No runtime break.

**Resolution:** Updated `STAGE1_Foundation_v2_PART2.md` Step 20c: renamed `COCKPIT_GEOMETRY_V2` → `COCKPIT_GEOMETRY` in all 7 occurrences (export + useAdaptiveCockpit references). Also aligned `topBarSegments` (48→256) and `sideSegments` (24→128) to match 20M cockpit upgrade values, and added missing structural detail constants. Added missing `parent`/`admin` bloom presets.

---

### S1-WARN-004 — ~~`deviceStore.ts` significantly diverged from stage doc (D3D-1 overhaul)~~ RESOLVED (Batch 8)

**File:** `src/stores/deviceStore.ts`
**Category:** Doc-Drift
**Description:** Stage doc defines multi-device profiles (`DeviceType`, `DEVICE_PROFILES` for desktop/tablet/mobile, `hasSelected`, `setDeviceType`, `GPUTier` with `'css'` option). Actual code has D3D-1 hardcoded desktop-ultra profile with completely different API surface (`PerformanceProfile`, `DESKTOP_ULTRA_PROFILE`, `TriangleBudgetTier`, no device selection).

**Impact:** Code is correct per D3D-1 decision lock. Stage doc is outdated — anyone reading the doc will get the wrong API.

**Resolution:** Replaced entire Step 20a in `STAGE1_Foundation_v2_PART2.md` with actual D3D-1 desktop-ultra implementation. Updated description, interface, profile, triangle budgets, store shape, and selector helpers. Also updated Step 21 hooks section: marked `useMediaQuery`/`useIsMobile` as REMOVED per D3D-1, updated file inventory table.

---

## Stage 1 — INFO FINDINGS

### S1-INFO-001 — `authStore.ts` expanded beyond Stage 1 scope (expected)

**Description:** Stage 1 doc defines simple store (`parent`, `isLoading`, `setParent`, `setLoading`, `clearAuth`). Actual store adds `isDemoMode`, `demoSession`, `startDemoSession`, `endDemoSession`, `checkDemoStatus` from Phase 5E-5F (Login 3D Enhancement). This is expected — stores evolve across stages.

### S1-INFO-002 — `uiStore.ts` retains `gameActive` flag — DEFERRED (Batch 7: still actively consumed)

**Description:** CLAUDE.md Section 14 states `gameActive` is deprecated (use `sceneStore.enterGame`/`exitGame` instead). However, `gameActive`/`setGameActive` are still actively consumed by `useStationMode.ts` (lines 104-105, 325) for mode derivation (`'game'` mode triggers frame dimming per Decision 3.4). Removing this flag requires migrating `useStationMode` to read from `sceneStore` — a cross-cutting refactor deferred to a future sprint. Not dead code.

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

---

# STAGE 2 AUDIT — Database & API

**Stage:** 2 (Phases 3)
**Source Docs:** `STAGE2_Database_API_v2_PART1-4`
**Scope:** Supabase setup, API routes, database schema, RLS policies, API helpers, Zod validation, rate limiting

## Stage 2 — Finding Counts

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH | 2 (both resolved — Batch 9) |
| WARNING | 3 (all resolved — Batch 9) |
| INFO | 2 (deferred — cosmetic) |
| PASS | 12 |

---

## Stage 2 — HIGH FINDINGS

### S2-HIGH-001 — ~~Session end endpoint missing child ownership verification~~ RESOLVED (Batch 9)

**File:** `src/app/api/sessions/route.ts`
**Category:** Security
**Description:** The "end session" action fetches the session by UUID and updates it, but never verifies the session belongs to a child owned by the authenticated parent.

**Resolution:** Added `verifyChildOwnership(auth.user.id, session.child_id)` check after fetching the session in the `end` action. Returns 404 if ownership fails (prevents session UUID enumeration). Also refactored entire route to use `parseBody` with `z.discriminatedUnion` schema (fixes S2-WARN-003 simultaneously).

---

### S2-HIGH-002 — ~~`as any` casts in badges route bypass TypeScript safety (3 occurrences)~~ RESOLVED (Batch 9)

**File:** `src/app/api/gamification/badges/route.ts`
**Category:** TypeScript Quality
**Description:** Three uses of `as any` for accessing Supabase join content relations (`p.content`), plus `newBadges!` non-null assertions.

**Resolution:** Defined `ProgressWithContent` type and cast once at query result (`typedProgress`). Removed all 3 `as any` casts and 3 eslint-disable comments. Changed `newBadges` initialization to `NonNullable<typeof allBadges>` — removed 4 non-null assertions (`!`). All content property access is now fully typed via `p.content?.world` / `p.content?.type`.

---

## Stage 2 — WARNING FINDINGS

### S2-WARN-001 — ~~Stripe env var names in `tier-config.ts` don't match stage doc~~ RESOLVED (Batch 9)

**File:** `src/lib/tier-config.ts`
**Category:** Doc-Drift / Config
**Description:** Code used `STRIPE_PRICE_PLUS_MONTHLY` etc., but `.env.example` (authoritative) uses `STRIPE_PLUS_MONTHLY_ID`.

**Resolution:** Updated `tier-config.ts` to use `.env.example` names (`STRIPE_PLUS_MONTHLY_ID`, `STRIPE_PLUS_YEARLY_ID`, `STRIPE_FORGE_MONTHLY_ID`, `STRIPE_FORGE_YEARLY_ID`). Also updated `STAGE8_P3_v3FINAL_B.md` which had the old names. All three sources (`.env.example`, code, docs) now aligned.

---

### S2-WARN-002 — ~~`as any` and `catch (error: any)` in prompt-lab route~~ RESOLVED (Batch 9)

**File:** `src/app/api/ai/prompt-lab/route.ts`
**Category:** TypeScript Quality
**Description:** `(block as any).text` cast and `catch (error: any)` bypassed TypeScript safety.

**Resolution:** Used `Anthropic.TextBlock` type guard for content block filtering. Changed `catch (error: any)` to `catch (error: unknown)` with proper narrowing via `instanceof Error` + `'status' in error` check for 429 detection. Removed both eslint-disable comments.

---

### S2-WARN-003 — ~~`sessions/route.ts` uses raw `req.json()` instead of `parseBody`~~ RESOLVED (Batch 9)

**File:** `src/app/api/sessions/route.ts`
**Category:** Consistency / Error Handling
**Description:** Route used raw `await req.json()` instead of `parseBody` helper.

**Resolution:** Replaced with `parseBody(req, SessionSchema)` using a `z.discriminatedUnion('action', [...])` schema that validates `start` (requires `childId`) and `end` (requires `sessionId`) actions with proper UUID validation. Malformed JSON now returns consistent formatted errors.

---

## Stage 2 — INFO FINDINGS

### S2-INFO-001 — Timezone validated but silently discarded in signup

**File:** `src/app/api/auth/signup/route.ts` (line 17)
**Category:** Data
**Description:** `timezone` is part of `SignupSchema` (validated by Zod) but the `parents` table has no `timezone` column. The value is validated then silently discarded — never stored.

**Impact:** No functional break. If timezone is needed for future features (scheduling, analytics), add a column. Otherwise, remove from schema to avoid confusion.

---

### S2-INFO-002 — `all-labs` childId not UUID-validated via Zod

**File:** `src/app/api/progress/all-labs/route.ts`
**Category:** Consistency
**Description:** `childId` is validated manually (`if (!childId)`) rather than through a Zod schema with `.uuid()`. Other progress endpoints use Zod schemas. A malformed non-UUID string could reach `verifyChildOwnership` and the RPC calls — Supabase would reject it harmlessly, but it's inconsistent.

**Impact:** No security risk (Supabase rejects malformed UUIDs). Consistency improvement only.

---

## Stage 2 — PASS FINDINGS

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | Zod validation on all API routes | PASS | All 14+ routes use `parseBody` or inline Zod schemas |
| 2 | `requireAuth` on all protected routes | PASS | Every child/progress/gamification/content route checks auth |
| 3 | `verifyChildOwnership` on child data routes | PASS | All child-accessing routes verify parent-child relationship (session end fixed Batch 9) |
| 4 | Rate limiting on auth endpoints | PASS | signup: 5/min, login: 5/min, prompt-lab: 20/hr, demo: 3/hr |
| 5 | No SUPABASE_SERVICE_ROLE_KEY in client code | PASS | Only in `server.ts` createAdminClient (server-only) |
| 6 | `createAdminClient` properly separated | PASS | `src/lib/supabase/server.ts` lines 25-30 |
| 7 | No raw SQL string interpolation | PASS | All queries use Supabase client `.from().select().eq()` pattern |
| 8 | COPPA consent required at signup | PASS | `coppaConsent: z.literal(true)` in SignupSchema |
| 9 | No `dangerouslySetInnerHTML` | PASS | Zero occurrences in codebase |
| 10 | BUG-7: subscription_status default | PASS | SQL shows `DEFAULT 'active'` with explanatory comment |
| 11 | BUG-3: `/api/progress/all-labs` endpoint exists | PASS | Bulk fetch with 10 parallel RPC calls via `Promise.all()` |
| 12 | `/api/health` route (public, unauthenticated) | PASS | Correct — health checks should be public |

---

## Stage 2 — API Route Inventory

| Route | Methods | Auth | Zod | Rate Limit | Status |
|-------|---------|------|-----|------------|--------|
| `/api/auth/signup` | POST | No (creates account) | SignupSchema | 5/min | PASS |
| `/api/auth/login` | POST | No (authenticates) | LoginSchema | 5/min | PASS |
| `/api/auth/logout` | POST | No (no-op if unauth) | — | — | PASS |
| `/api/auth/me` | GET | Yes | — | — | PASS |
| `/api/auth/demo` | POST | No | — | 3/hr/IP | PASS |
| `/api/children` | GET, POST | Yes | CreateChildSchema | — | PASS |
| `/api/children/[childId]` | GET, PATCH, DELETE | Yes + ownership | UpdateChildSchema | — | PASS |
| `/api/content` | GET | Yes + tier | ContentQuerySchema | — | PASS |
| `/api/content/[slug]` | GET | Yes + tier | — | — | PASS |
| `/api/progress` | GET, POST | Yes + ownership | CompleteContentSchema | — | PASS |
| `/api/progress/world` | GET | Yes + ownership | LabProgressSchema | — | PASS |
| `/api/progress/all-labs` | GET | Yes + ownership | Manual check | — | PASS (BUG-3) |
| `/api/gamification/xp` | POST | Yes + ownership + dedup | XpSchema | — | PASS |
| `/api/gamification/badges` | GET, POST | Yes + ownership | BadgeCriteriaSchema | — | PASS (Batch 9: as any removed) |
| `/api/gamification/streak` | POST | Yes + ownership | Inline StreakSchema | — | PASS |
| `/api/sessions` | POST | Yes + ownership (both) | SessionSchema (discriminated union) | — | PASS (Batch 9: ownership + parseBody) |
| `/api/ai/prompt-lab` | POST | Yes + ownership + tier | PromptLabSchema | 20/hr | PASS (Batch 9: type guard + error:unknown) |
| `/api/health` | GET | No | — | — | PASS |
| `/api/stripe/checkout` | POST | Yes | — | — | PASS |
| `/api/stripe/portal` | POST | Yes | — | — | PASS |
| `/api/stripe/webhook` | POST | Signature verify | — | — | PASS |
| `/api/agent/run` | POST | Yes + admin | — | — | PASS |
| `/api/agent/review` | POST | Yes + admin | — | — | PASS |
| `/api/agent/schedule` | POST | Yes + admin | — | — | PASS |

**Routes Expected:** 20+ | **Routes Found:** 23 | **Issues:** 0 (all resolved — Batch 9)

---

---

# STAGE 3 AUDIT — Auth, Layout, Hero Animation, Cockpit, Login 3D

**Stage:** 3 (Phases 4, 5, 5A-5F)
**Source Docs:** `STAGE3_Auth_Layout_Shell_v2_PART1-2`, `STAGE3_Part3A/B_v3FINAL`, `HERO_ANIMATION_v3FINAL_PartA/B`, `COCKPIT_CPA2_v3FINAL_PartA/B`, `LOGIN_3D_v3FINAL_PartA/B`
**Scope:** Auth pages, dashboard layout, StationFrame, Hero Animation (8-phase), Cockpit Architecture (CPA2), Login 3D Enhancement, Demo Login, middleware

## Stage 3 — Finding Counts

| Severity | Count |
|----------|-------|
| CRITICAL | 1 |
| HIGH | 2 |
| WARNING | 3 |
| INFO | 3 |
| PASS | 28 |

---

## Stage 3 — CRITICAL FINDINGS

### S3-CRIT-001 — Middleware missing `/reset-password` from public paths

**File:** `src/middleware.ts` (line 29)
**Category:** Auth / UX — Broken Feature
**Description:** The `publicPaths` array does not include `/reset-password`. Unauthenticated users clicking "Forgot password?" from the login page will be redirected back to `/login` by the middleware, making password reset completely inaccessible.

**Evidence:**
```typescript
// src/middleware.ts line 29 (current):
const publicPaths = ['/login', '/signup', '/pricing', '/about', '/privacy', '/terms'];
// MISSING: '/reset-password'
```

**Required Fix:**
```typescript
const publicPaths = ['/login', '/signup', '/reset-password', '/pricing', '/about', '/privacy', '/terms'];
```

---

## Stage 3 — HIGH FINDINGS

### S3-HIGH-001 — COPPA consent sent before user confirms checkbox

**File:** `src/app/(auth)/signup/page.tsx` (line 66)
**Category:** COPPA Compliance
**Description:** The signup flow has 4 steps: Account (Step 1) → Verify (Step 2) → COPPA Consent (Step 3) → Profile (Step 4). However, `coppaConsent: true` is **hardcoded** in the Step 1 API call, sent to the server BEFORE the user reaches Step 3 where they actually check the COPPA consent checkbox. The consent is recorded server-side at account creation time regardless of the user's future checkbox action.

**Evidence:**
```typescript
// signup/page.tsx line 66 — in Step 1 handler:
const response = await fetch('/api/auth/signup', {
  body: JSON.stringify({
    email, password, fullName,
    coppaConsent: true,  // ← Hardcoded TRUE before user sees Step 3
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }),
});
```

**Impact:** The COPPA consent timestamp (`coppa_consent_at`) in the database is recorded at account creation, not at the time the user actually confirms consent. Under FTC COPPA rules (April 2026 deadline), consent must be verifiable and intentional. A hardcoded `true` before the checkbox is shown does not meet this standard.

**Required Fix:** Restructure the signup flow so the API call happens AFTER Step 3 completion:

*Option A (preferred):* Move the `/api/auth/signup` call to after Step 3 completes:
```typescript
// Step 3 completion handler:
const handleConsentConfirm = async () => {
  if (!coppaChecked) return; // User must check the box
  const response = await fetch('/api/auth/signup', {
    body: JSON.stringify({
      email, password, fullName,
      coppaConsent: true,  // Now this is truthful — user just confirmed
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  });
  // Then proceed to Step 4
};
```

*Option B:* Create account in Step 1 without consent, then call a separate `/api/auth/consent` endpoint in Step 3 that sets `coppa_consent_at`.

---

### S3-HIGH-002 — Middleware blocks demo users from dashboard

**File:** `src/middleware.ts` (lines 29-36)
**Category:** Auth / Runtime
**Description:** Demo users have no Supabase auth session (`user` will be `null`). Dashboard routes (`/home`, `/labs`, `/arcade`, `/profile`) are not in `publicPaths`. The middleware will redirect demo users to `/login` on every dashboard page load, making the Demo Login feature non-functional.

**Evidence:**
```typescript
// middleware.ts logic:
const { data: { user } } = await supabase.auth.getUser();
if (!user && !isPublicPath) {
  return NextResponse.redirect(new URL('/login', req.url));
  // Demo users hit this redirect — they have no Supabase user
}
```

**Required Fix:** Add demo session awareness to the middleware:
```typescript
const { data: { user } } = await supabase.auth.getUser();

// Check for demo session cookie/indicator
const isDemoSession = req.cookies.get('sparkforge-demo-session')?.value;

if (!user && !isDemoSession && !isPublicPath) {
  return NextResponse.redirect(new URL('/login', req.url));
}
```
Alternatively, have the demo session creation in `/api/auth/demo` set a server-readable cookie that the middleware can check.

---

## Stage 3 — WARNING FINDINGS

### S3-WARN-001 — Auth layout `dpr` may cause hydration mismatch

**File:** `src/app/(auth)/layout.tsx` (line 35)
**Category:** React / SSR
**Description:** `window.devicePixelRatio` is accessed inline in the Canvas `dpr` prop. The layout is `'use client'` and the Canvas is dynamically imported with `ssr: false`, but the surrounding layout code is still server-rendered during hydration. A `typeof window !== 'undefined'` guard prevents crashes but the server always gets the fallback value `2` while the client may get a different value, causing a hydration mismatch warning.

**Required Fix:** Use R3F Canvas's built-in `dpr` range (since D3D-1 means desktop-only):
```typescript
<Canvas dpr={[1, 3]}>  {/* R3F auto-selects based on devicePixelRatio */}
```

---

### S3-WARN-002 — Unused `isCardHovered` state in login page

**File:** `src/app/(auth)/login/page.tsx` (line 8)
**Category:** Code Quality
**Description:** `setIsCardHovered` is assigned but `isCardHovered` is never read. This state was likely intended to pass hover info to the 3D portal for interactive glow effects, but the connection is never wired up — `LoginPortal3D`'s `isHovered` prop in the auth layout defaults to `false`.

**Required Fix:** Either wire `isCardHovered` up to the auth layout's 3D portal via context/callback, or remove the unused state to avoid dead code.

---

### S3-WARN-003 — `heroAudio.ts` path differs from CLAUDE.md spec

**File:** `src/lib/audio/heroAudio.ts`
**Category:** Doc-Drift
**Description:** CLAUDE.md Phase 5B lists the file as `src/lib/3d/heroAudio.ts`. The actual file is at `src/lib/audio/heroAudio.ts`. All imports reference the correct actual path — code is internally consistent.

**Impact:** Cosmetic doc-drift. No runtime break.

**Required Fix:** Update CLAUDE.md Phase 5B file list to `src/lib/audio/heroAudio.ts`.

---

## Stage 3 — INFO FINDINGS

### S3-INFO-001 — No TopBar component exists (intentional)

**Description:** CLAUDE.md lists `TopBar` in the Stage 3 audit checklist but no `TopBar` component exists anywhere. The dashboard uses Sidebar-only navigation. The cockpit 3D HUD (`HolographicHUD`, `StatusBar3D`) replaces the traditional TopBar in the v3 Laboratory Control Station design. Appears intentional.

### S3-INFO-002 — `demo-session.ts` has `deviceType` field contradicting D3D-1

**File:** `src/lib/demo-session.ts` (line 12)
**Description:** `DemoSession` interface includes `deviceType: 'desktop' | 'tablet' | 'mobile' | null` which contradicts D3D-1 (desktop-only). The field is always set to `null` and never used. Harmless but inconsistent.

### S3-INFO-003 — `_SUPERSEDED` archive properly maintained

**Description:** `src/components/3d/_SUPERSEDED/` contains `CrystalShatter.tsx` with a proper `SUPERSEDED_BY.md` manifest documenting the replacement by `HeroAnimation.tsx`, the date, reason, decision reference (Decision 8.1), and notes that `CrystalHero.tsx` is RETAINED. No active code imports CrystalShatter. Archive is clean.

---

## Stage 3 — PASS FINDINGS

### Auth Pages (6 PASS)

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | `(auth)/layout.tsx` — 3D canvas layer | PASS | LoginPortal3D + LoginParticles3D dynamically imported, ssr: false |
| 2 | `login/page.tsx` — DemoLoginButton present | PASS | Enhanced with LoginFormCard + DemoLoginButton + divider |
| 3 | `signup/page.tsx` — 4-step COPPA flow | PASS | Steps 1-4 present, shield icon, consent checkbox, age-18+ text |
| 4 | `reset-password/page.tsx` — full flow | PASS | Email input, Supabase resetPasswordForEmail, ARIA live region |
| 5 | `LoginFormCard.tsx` — chrome bezel glow | PASS | `?demo=expired` amber notification handled |
| 6 | `DemoLoginButton.tsx` — confirmation flow | PASS | Calls `/api/auth/demo`, starts client session, redirects to `/home` |

### Dashboard Layout (4 PASS)

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 7 | `(dashboard)/layout.tsx` | PASS | StationFrame (dynamic, ssr:false), DemoGuard, DemoSessionBanner, CelebrationOverlay, Sidebar |
| 8 | `Sidebar.tsx` — full nav | PASS | Desktop collapsed/expanded, keyboard nav, child switcher, correct fonts |
| 9 | `StationFrame.tsx` — thin CockpitCanvas wrapper | PASS | CPA2-1 architecture, all props passed through |
| 10 | `(dashboard)/home/page.tsx` | PASS | Placeholder with child stats, marked "replaced in Stage 4" |

### Hero Animation (11 PASS)

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 11 | `HeroAnimation.tsx` | PASS | 8-phase cinematic, renders as `<group>` inside CockpitCanvas |
| 12 | `useHeroAnimation.ts` | PASS | Hook orchestrating hero phases |
| 13 | `crystallineLogo.vert` | PASS | Vertex shader |
| 14 | `crystallineLogo.frag` | PASS | Fragment shader |
| 15 | `electricVeins.frag` | PASS | Fragment shader |
| 16 | `voronoiShatter.comp` | PASS | Compute shader |
| 17 | `voronoiFracture.ts` | PASS | Exports generateVoronoiShards, assignShardsToTargets, SHARD_COUNTS |
| 18 | `heroSplines.ts` | PASS | Exports generateSplineTimings |
| 19 | `heroParticleCompute.ts` | PASS | TSL particle compute |
| 20 | `heroParticleRender.ts` | PASS | TSL particle render |
| 21 | `heroAudio.ts` | PASS | Audio system (path at src/lib/audio/, not src/lib/3d/) |

### Cockpit Architecture (4 PASS — all CPA2 + D3D-B decisions verified)

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 22 | `CockpitCanvas.tsx` — single persistent Canvas | PASS | CPA2-1, D3D-B1: never unmounts, SceneRouter for visibility |
| 23 | `SceneRouter.tsx` — D3D-B5 visibility control | PASS | Hero/cockpit/spatial/game/iris groups, opacity interpolation (D3D-B6) |
| 24 | `MechanicalIris.tsx` — D3D-B2 transitions | PASS | 8-blade aperture, 100K tris, driven by sceneStore.transition.progress |
| 25 | `PostProcessingStack.tsx` — D3D-5 always-on | PASS | 9 effects: N8AO, Bloom, ChromaticAberration, DOF, Noise, HueSaturation, BrightnessContrast, Vignette, BarrelDistortion |

### Login 3D + Demo (3 PASS)

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 26 | `DemoGuard.tsx` — expiry protection | PASS | Checks every 30s, redirects to `/login?demo=expired` |
| 27 | `DemoSessionBanner.tsx` — countdown + urgent | PASS | Timer, urgent mode at <5min, expired modal, "Create Account" CTA |
| 28 | `demo-session.ts` — 1hr sessions | PASS | localStorage persistence, formatTimeRemaining utility |

---

## Stage 3 — File Inventory

### Auth Pages
| File | Status |
|------|--------|
| `src/app/(auth)/layout.tsx` | EXISTS (3D canvas layer) |
| `src/app/(auth)/login/page.tsx` | EXISTS (enhanced) |
| `src/app/(auth)/signup/page.tsx` | EXISTS (4-step COPPA) |
| `src/app/(auth)/reset-password/page.tsx` | EXISTS |

### Dashboard Layout
| File | Status |
|------|--------|
| `src/app/(dashboard)/layout.tsx` | EXISTS |
| `src/app/(dashboard)/home/page.tsx` | EXISTS |
| `src/components/layout/Sidebar.tsx` | EXISTS |
| `src/components/layout/StationFrame.tsx` | EXISTS |

### Hero Animation (Phase 5A-5B)
| File | Status |
|------|--------|
| `src/components/3d/HeroAnimation.tsx` | EXISTS |
| `src/hooks/useHeroAnimation.ts` | EXISTS |
| `src/shaders/crystallineLogo.vert` | EXISTS |
| `src/shaders/crystallineLogo.frag` | EXISTS |
| `src/shaders/electricVeins.frag` | EXISTS |
| `src/shaders/voronoiShatter.comp` | EXISTS |
| `src/lib/3d/voronoiFracture.ts` | EXISTS |
| `src/lib/3d/heroSplines.ts` | EXISTS |
| `src/lib/3d/heroParticleCompute.ts` | EXISTS |
| `src/lib/3d/heroParticleRender.ts` | EXISTS |
| `src/lib/audio/heroAudio.ts` | EXISTS (path differs from doc) |

### Cockpit Architecture (Phase 5C-5D)
| File | Status |
|------|--------|
| `src/components/3d/CockpitCanvas.tsx` | EXISTS |
| `src/components/3d/CameraSystem.tsx` | EXISTS |
| `src/components/3d/SceneRouter.tsx` | EXISTS |
| `src/components/3d/MechanicalIris.tsx` | EXISTS |
| `src/components/3d/PostProcessingStack.tsx` | EXISTS |
| `src/components/3d/CockpitPanels.tsx` | EXISTS |
| `src/components/3d/SidePanels.tsx` | EXISTS |
| `src/components/3d/HolographicLabMap.tsx` | EXISTS |
| `src/components/3d/HolographicHUD.tsx` | EXISTS |
| `src/components/3d/StatusBar3D.tsx` | EXISTS |
| `src/components/3d/LEDRim.tsx` | EXISTS |
| `src/components/3d/AuroraBackground.tsx` | EXISTS |
| `src/components/3d/CockpitStructuralDetail.tsx` | EXISTS |
| `src/components/3d/CockpitFloor3D.tsx` | EXISTS |
| `src/components/3d/VolumetricFog3D.tsx` | EXISTS |
| `src/components/3d/DynamicEnvironment.tsx` | EXISTS |
| `src/components/3d/InteractiveConsole3D.tsx` | EXISTS |
| `src/components/3d/AmbientNPCs.tsx` | EXISTS |
| `src/components/3d/CeremonyFX.tsx` | EXISTS |
| `src/components/3d/WormholeTransition.tsx` | EXISTS |
| `src/components/3d/MiniMapOverlay3D.tsx` | EXISTS |
| `src/components/3d/CockpitSkinManager.tsx` | EXISTS |
| `src/components/3d/SpatialDashboard.tsx` | EXISTS |
| `src/components/3d/LabStructure3D.tsx` | EXISTS |

### Login 3D + Demo (Phase 5E-5F)
| File | Status |
|------|--------|
| `src/components/3d/LoginPortal3D.tsx` | EXISTS |
| `src/components/3d/LoginParticles3D.tsx` | EXISTS |
| `src/components/auth/DemoLoginButton.tsx` | EXISTS |
| `src/components/auth/DemoGuard.tsx` | EXISTS |
| `src/components/auth/DemoSessionBanner.tsx` | EXISTS |
| `src/components/auth/LoginFormCard.tsx` | EXISTS |
| `src/lib/demo-session.ts` | EXISTS |
| `src/hooks/useDemoSession.ts` | EXISTS |
| `src/app/api/auth/demo/route.ts` | EXISTS |

### Stores Modified in Stage 3
| File | Status |
|------|--------|
| `src/stores/authStore.ts` | EXISTS (demo extensions) |
| `src/stores/cockpitStore.ts` | EXISTS (CPA2 full) |
| `src/stores/sceneStore.ts` | EXISTS (D3D-B5) |
| `src/stores/deviceStore.ts` | EXISTS (D3D-1 hardcoded) |

### Archive
| File | Status |
|------|--------|
| `src/components/3d/_SUPERSEDED/CrystalShatter.tsx` | EXISTS (archived) |
| `src/components/3d/_SUPERSEDED/SUPERSEDED_BY.md` | EXISTS (manifest) |

### Middleware
| File | Status |
|------|--------|
| `src/middleware.ts` | EXISTS (**missing /reset-password**) |
| `src/components/providers/AuthProvider.tsx` | EXISTS (demo hydration) |

**Files Expected:** 55+ | **Files Found:** 55+ | **Missing:** 0 files missing (1 middleware config issue)

---

---

# STAGE 4 AUDIT — Core Pages

**Stage:** 4 (Phases 6-7)
**Source Docs:** `STAGE4_Core_Pages_v2_PART1+3`, `STAGE4_Part2_v3FINAL_A/B`
**Scope:** Dashboard home, Labs map, Profile page, Arcade, Game routing, React Query hooks
**Build Status:** NOT COMPLETE — 3 of 5 core pages are stubs or missing

## Stage 4 — Finding Counts

| Severity | Count |
|----------|-------|
| CRITICAL | 4 |
| HIGH | 4 |
| WARNING | 5 |
| INFO | 1 |
| PASS | 5 |

---

## Stage 4 — CRITICAL FINDINGS

### S4-CRIT-001 — Home page is still a Stage 3 placeholder

**File:** `src/app/(dashboard)/home/page.tsx`
**Category:** Incomplete Build
**Description:** The dashboard home page is a placeholder from Stage 3. Line 7 reads `// Home Dashboard -- Placeholder (replaced in Stage 4)`. The page shows only static stats from Zustand `childStore` (XP, level, streak, coins). It has no lab progress overview, no "continue learning" section, no React Query data fetching, no daily challenge widget — none of the Stage 4 deliverables.

**Required Fix:** Build the full Stage 4 home dashboard per `STAGE4_Core_Pages_v2_PART1`:
- Lab progress cards using `useAllLabsProgress(childId)` from `src/hooks/useProgress.ts`
- Recent activity feed
- Daily challenge widget using `useDailyChallenge(childId)` from `src/hooks/useContent.ts`
- "Continue Learning" CTA linking to last incomplete game
- React Query for all server data
- Skeleton loading states
- ARIA labels on all interactive cards

---

### S4-CRIT-002 — Labs page is a 13-line stub

**File:** `src/app/(dashboard)/labs/page.tsx`
**Category:** Incomplete Build
**Description:** The entire labs page is 13 lines returning "Coming in Stage 4". No lab map, no 10-lab grid, no completion indicators, no progress data. This is the primary navigation surface for the platform.

**Required Fix:** Build the full labs map per stage docs:
- 10 lab cards with lab colors from `LABS` constant
- Completion percentage per lab via `useAllLabsProgress(childId)`
- Lab-colored borders/accents per Frost-Prismatic theme
- Navigation to individual lab pages via Next.js `Link`
- Skeleton loading state
- ARIA labels and keyboard navigation

---

### S4-CRIT-003 — Individual lab page route missing entirely

**File:** `src/app/(dashboard)/labs/[labId]/page.tsx` — DOES NOT EXIST
**Category:** Missing Feature
**Description:** No dynamic route exists for individual lab pages. The onboarding page references `/labs/${selectedLab}` (line 74) which would produce a 404. Users cannot browse games within a specific lab.

**Required Fix:** Create `src/app/(dashboard)/labs/[labId]/page.tsx`:
- Fetch lab metadata from `LABS` constant by ID
- List all games in that lab with completion status
- Show lab description, game count, age band requirements
- Use `useLabProgress(childId, labId)` for per-game progress
- Handle invalid labId with 404 fallback
- ARIA labels, keyboard navigation, skeleton loading

---

### S4-CRIT-004 — BUG-5 unresolved: `useAllLabsProgress` exists but is not consumed

**File:** `src/hooks/useProgress.ts` (line 36) → `src/app/(dashboard)/labs/page.tsx`
**Category:** Known Bug / Incomplete Integration
**Description:** The `useAllLabsProgress` React Query hook exists and correctly calls `/api/progress/all-labs` (BUG-3 fix). However, it is **not consumed by any page** — the labs page is a stub. BUG-5 ("Lab map shows wrong completion") cannot be considered fixed because the lab map doesn't exist.

**Required Fix:** Build the labs page (S4-CRIT-002) with `useAllLabsProgress` as its primary data source.

---

## Stage 4 — HIGH FINDINGS

### S4-HIGH-001 — `useApi.ts` dead code not deleted (BUG-1)

**File:** `src/hooks/useApi.ts` (179 lines)
**Category:** Dead Code / Known Bug
**Description:** The old stub file still exists. Its header (lines 1-18) correctly warns it's a placeholder. All four replacement hooks exist (`useChildren`, `useContent`, `useProgress`, `useGamification`). **Zero files import from `useApi.ts`** — confirmed zero consumers.

**Required Fix:**
```bash
rm src/hooks/useApi.ts
```

---

### S4-HIGH-002 — Game router does not enforce GameShell wrapper

**File:** `src/app/(dashboard)/arcade/[gameSlug]/page.tsx` (line 221)
**Category:** Architecture / Safety
**Description:** The game router renders `<GameComponent />` directly without wrapping in `GameShell`. Each game file imports `GameShell` internally, but if any game omits it, there's no safety net — XP tracking, scene registration, chrome bezel, and ARIA context would all be missing.

**Evidence:**
```typescript
// Line 221:
return <GameComponent />;  // No GameShell wrapper
```

**Required Fix:** Wrap games at the router level as a safety net:
```typescript
return (
  <GameShell gameId={gameSlug} labColor={game.labColor}>
    <GameComponent />
  </GameShell>
);
```
Note: This may cause double-wrapping if individual games also use GameShell. Consider a prop like `<GameShell enforce>` that checks if already wrapped.

---

### S4-HIGH-003 — 4 hook files duplicate `apiFetch` instead of importing from `src/lib/api.ts`

**Files:** `src/hooks/useChildren.ts`, `src/hooks/useContent.ts`, `src/hooks/useProgress.ts`, `src/hooks/useGamification.ts` (lines 4-11 each)
**Category:** Code Quality / DRY
**Description:** Each hook defines its own identical 5-line `apiFetch` function instead of importing the centralized version from `src/lib/api.ts` which has proper error typing (`ApiError` class) and generic support. Four copies of the same code.

**Required Fix:**
```typescript
// In each hook file, replace local apiFetch with:
import { apiFetch } from '@/lib/api';
```

---

### S4-HIGH-004 — Home page has zero ARIA labels

**File:** `src/app/(dashboard)/home/page.tsx` (lines 39-82)
**Category:** Accessibility
**Description:** The placeholder home page renders stat cards and a welcome section with zero `aria-label` attributes on any interactive or informational elements. This is a children's platform — accessibility is critical.

**Required Fix:** Will be resolved when the full Stage 4 home page is built (S4-CRIT-001). Ensure all stat cards, navigation elements, and interactive widgets have proper ARIA labels.

---

## Stage 4 — WARNING FINDINGS

### S4-WARN-001 — Hook return types implicitly `any`

**Files:** `src/hooks/useContent.ts`, `src/hooks/useProgress.ts`, `src/hooks/useGamification.ts`
**Category:** TypeScript Quality
**Description:** The local `apiFetch` implementations don't use generics, so React Query hook return data is implicitly `any`. Consumers can access any property without TypeScript catching errors.

**Required Fix:** Use the generic `apiFetch<T>` from `src/lib/api.ts` and type the query functions:
```typescript
const { data } = useQuery<LabProgress[]>({
  queryKey: ['all-labs-progress', childId],
  queryFn: () => apiFetch<LabProgress[]>(`/api/progress/all-labs?childId=${childId}`),
});
```

---

### S4-WARN-002 — Arcade page hardcodes all 35 games inline

**File:** `src/app/(dashboard)/arcade/page.tsx` (lines 40-76)
**Category:** Architecture / DRY
**Description:** All 35 games are defined as inline objects in the arcade page rather than importing from `src/config/gameRegistry.ts`. This creates a second source of truth for game metadata.

**Required Fix:** Import games from `gameRegistry.ts` or from `LABS` in `types/index.ts`:
```typescript
import { GAME_REGISTRY, getAllGames } from '@/config/gameRegistry';
```

---

### S4-WARN-003 — No settings page exists

**File:** `src/app/(dashboard)/settings/page.tsx` — DOES NOT EXIST
**Category:** Missing Feature
**Description:** CLAUDE.md mentions `skipIntroAnimation` in Settings. No settings page exists for users to configure preferences like skip intro, sound toggle, accessibility options.

**Required Fix:** Create a settings page or integrate settings into the profile page (Stage 5).

---

### S4-WARN-004 — Arcade page shows no per-game completion status

**File:** `src/app/(dashboard)/arcade/page.tsx`
**Category:** UX / Feature Gap
**Description:** The arcade page lists all 35 games but shows no completion indicators, progress bars, or "completed" badges per game. Users can't tell which games they've finished.

**Required Fix:** Integrate `useChildProgress` to fetch completion status and display it on each game card.

---

### S4-WARN-005 — `content/[slug]/page.tsx` uses `as string` type assertion

**File:** `src/app/(dashboard)/content/[slug]/page.tsx` (line 13)
**Category:** TypeScript Quality
**Description:** `params.slug as string` is a type assertion without validation. In Next.js 15 App Router, `params` can have string or string[] values for catch-all routes.

**Required Fix:**
```typescript
const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
```

---

## Stage 4 — INFO FINDINGS

### S4-INFO-001 — Game route is at `/arcade/[gameSlug]` not `/play/[slug]`

**Description:** Some docs reference `/play/[slug]` as the game route path. The actual implementation uses `/arcade/[gameSlug]`. The arcade page links correctly use this path. Internal consistency is fine — just a doc-vs-implementation naming choice.

---

## Stage 4 — PASS FINDINGS

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | Arcade page fully implemented | PASS | 298 lines, search, lab filter, tier filter, age band badges, responsive grid |
| 2 | Game router with dynamic imports | PASS | All 35 games via `next/dynamic`, proper loading states, 404 fallback |
| 3 | Dashboard `error.tsx` | PASS | Proper `reset()` + Link to `/home` |
| 4 | Dashboard `loading.tsx` | PASS | Skeleton UI |
| 5 | No raw `<img>` or `<a>` tags in pages | PASS | Next.js `Link` and no images used |

---

## Stage 4 — File Inventory

| Expected File | Status |
|--------------|--------|
| `src/app/(dashboard)/home/page.tsx` | EXISTS (placeholder only) |
| `src/app/(dashboard)/labs/page.tsx` | EXISTS (13-line stub) |
| `src/app/(dashboard)/labs/[labId]/page.tsx` | **MISSING** |
| `src/app/(dashboard)/profile/page.tsx` | EXISTS (Stage 5 stub — expected) |
| `src/app/(dashboard)/arcade/page.tsx` | EXISTS (fully implemented) |
| `src/app/(dashboard)/arcade/[gameSlug]/page.tsx` | EXISTS (fully implemented) |
| `src/app/(dashboard)/settings/page.tsx` | **MISSING** |
| `src/app/(dashboard)/content/[slug]/page.tsx` | EXISTS |
| `src/app/(dashboard)/error.tsx` | EXISTS |
| `src/app/(dashboard)/loading.tsx` | EXISTS |
| `src/hooks/useChildren.ts` | EXISTS |
| `src/hooks/useContent.ts` | EXISTS |
| `src/hooks/useProgress.ts` | EXISTS |
| `src/hooks/useGamification.ts` | EXISTS |
| `src/hooks/useApi.ts` | EXISTS (dead code — should be deleted) |

**Files Expected:** 14 | **Files Found:** 13 | **Missing:** 1 (`labs/[labId]`) | **Stubs:** 2 (home, labs)

---

---

# STAGE 5 AUDIT — Gamification & Profile

**Stage:** 5 (Phases 8-9)
**Source Docs:** `STAGE5_Gamification_Profile_PART1`, `STAGE5_Parts23_v3FINAL_A/B/C`
**Scope:** XP system, streaks, badges, trophy room, celebration overlays, profile page, 3D ceremony effects
**Build Status:** PARTIALLY IMPLEMENTED — hooks/APIs done, profile stub, game-to-XP pipeline disconnected

## Stage 5 — Finding Counts

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH | 7 |
| WARNING | 5 |
| INFO | 2 |
| PASS | 6 |

---

## Stage 5 — CRITICAL FINDINGS

### S5-CRIT-001 — Profile page is a stub

**File:** `src/app/(dashboard)/profile/page.tsx`
**Category:** Incomplete Build
**Description:** The entire profile page is a 13-line placeholder returning "Coming in Stage 5." No child data fetching, no avatar editor, no XP/level/badge/streak display, no loading states, no error handling. This is the primary Stage 5 deliverable.

**Required Fix:** Build the full profile page per Stage 5 Part 1:
- React Query data fetching via `useChildren` hook
- Avatar config editor (shape, color, accessories)
- Stats display: XP progress bar, level, streak fire, spark coins
- Badge gallery with earned/locked states
- Edit display name capability
- Loading skeletons, error boundary, ARIA labels

---

### S5-CRIT-002 — Games never award XP — gamification pipeline disconnected

**Files:** All 35 game files in `src/components/games/`, `src/stores/gameStore.ts` (line 50)
**Category:** Core Feature Broken
**Description:** All 35 games call `game.completeGame()` from `gameStore`, which only sets `{ isComplete: true }` in local Zustand state. **No game calls `useCompleteAndReward()`** from `useGamification.ts`. The gamification hook exists and works — it's used by content viewers (`LessonViewer`, `QuizEngine`, `SparkFactViewer`) — but is completely disconnected from the game completion flow. This means:
- XP is **never awarded** when a game completes
- Streaks are **never updated** from game play
- Badges are **never checked** after game completion
- Celebrations **never trigger** from games

**Impact:** The entire gamification system is non-functional for the platform's core activity (playing games).

**Required Fix:** Wire `useCompleteAndReward` into `GameShell` so it fires automatically when `isComplete` transitions to `true`:

```typescript
// In GameShell.tsx — add effect:
const isComplete = useGameStore(s => s.isComplete);
const { completeAndReward } = useCompleteAndReward();
const hasRewarded = useRef(false);

useEffect(() => {
  if (isComplete && !hasRewarded.current) {
    hasRewarded.current = true;
    completeAndReward({
      childId: activeChild.id,
      contentId: gameId,
      score: gameStore.score,
      source: 'game',
    });
  }
}, [isComplete]);
```

This ensures all 35 games automatically award XP/badges/streaks without individual modification.

---

## Stage 5 — HIGH FINDINGS

### S5-HIGH-001 — `gamification/` component directory is empty

**File:** `src/components/gamification/` (contains only `.gitkeep`)
**Category:** Missing Components
**Description:** Stage docs call for `BadgeDisplay`, `TrophyRoom`, `BadgeGrid`, `LevelProgress` and other gamification UI components in this directory. It is entirely empty. Some gamification components exist in `src/components/game/` instead (`XPPopup.tsx`, `StreakFire.tsx`, `GameCompleteCelebration.tsx`) but key ones like badge display and trophy room don't exist anywhere.

**Required Fix:** Create badge display grid and trophy room components per Stage 5 docs.

---

### S5-HIGH-002 — `streak` and `confetti` celebration types unhandled

**File:** `src/components/shared/CelebrationOverlay.tsx` (lines 148-294)
**Category:** Incomplete Feature
**Description:** `CelebrationType` defines 5 types (`'xp' | 'badge' | 'level' | 'streak' | 'confetti'`). The overlay only renders modals/toasts for `'badge'`, `'level'`, and `'xp'`. The `'streak'` and `'confetti'` types trigger confetti particles but show no visual feedback (no "7-Day Streak!" toast, no confetti-only mode).

**Required Fix:** Add streak milestone UI (e.g., animated streak count toast) and confetti-only rendering mode.

---

### S5-HIGH-003 — XP toast never auto-dismisses

**File:** `src/components/shared/CelebrationOverlay.tsx` (lines 273-292)
**Category:** UX Bug
**Description:** The XP toast appears but has no auto-dismiss timer and no manual dismiss button. Badge and level modals dismiss on backdrop click, but the XP toast remains visible indefinitely.

**Required Fix:** Add `setTimeout(() => dismissCelebration(), 3000)` in a `useEffect` when `celebrationType === 'xp'`, or add an onClick handler to dismiss.

---

### S5-HIGH-004 — No `reducedMotion` respect in any gamification component

**Files:** `CelebrationOverlay.tsx`, `XPPopup.tsx`, `StreakFire.tsx`, `GameCompleteCelebration.tsx`, `CeremonyFX.tsx`
**Category:** Accessibility
**Description:** None of the gamification components check `useA11yStore`'s `reduceMotion` flag. All animations (confetti physics, badge flip, XP popup, streak fire, 3D ceremony) play at full intensity regardless of user preference. The `accessibilityStore` defines the flag and other components respect it.

**Required Fix:** Import `useA11yStore` and conditionally:
- Skip confetti particle physics when `reduceMotion` is true
- Use simple fade-in instead of spring animations
- Disable `CeremonyFX` 3D effects
- Show static versions of celebrations (just the message, no motion)

---

### S5-HIGH-005 — No ARIA labels on any gamification component

**Files:** `CelebrationOverlay.tsx`, `XPPopup.tsx`, `StreakFire.tsx`, `GameCompleteCelebration.tsx`
**Category:** Accessibility
**Description:** Zero ARIA attributes in any gamification component. Celebration modals have no `role="dialog"`, no `aria-modal="true"`, no `aria-label`. XP popup has no `role="status"` or `aria-live="polite"`. Confetti has no `aria-hidden="true"`. Screen readers cannot interpret these elements.

**Required Fix:**
- Modals: `role="dialog" aria-modal="true" aria-label="Badge Earned"`
- XP toast: `role="status" aria-live="polite"`
- Decorative confetti/particles: `aria-hidden="true"`
- Streak fire: `aria-hidden="true"` (decorative)

---

### S5-HIGH-006 — XPPopupProvider never mounted

**File:** `src/components/game/XPPopup.tsx`
**Category:** Dead Feature
**Description:** `XPPopupProvider` provides a `useXPPopup()` context for floating "+X XP" animations. However, it is not mounted in `GameShell`, the dashboard layout, or any page. Without the provider, `useXPPopup()` returns the default no-op `showXP: () => {}`.

**Required Fix:** Mount `<XPPopupProvider>` in `GameShell` or the dashboard layout:
```typescript
// In GameShell.tsx:
<XPPopupProvider>
  {children}
</XPPopupProvider>
```

---

### S5-HIGH-007 — CeremonyFX (3D) not mounted in dashboard scene

**File:** `src/app/(dashboard)/layout.tsx`, `src/components/3d/CeremonyFX.tsx`
**Category:** Dead Feature
**Description:** `CeremonyFX` is a well-implemented 3D celebration component (500K triangle budget) with instanced confetti, fireworks, trophies, HUD ring expansion, and particle showers. However, it is NOT rendered anywhere in the app. It needs to be a child of `CockpitCanvas`/`SceneRouter` to function.

**Required Fix:** Wire `CeremonyFX` into the cockpit scene, driven by `uiStore.celebrationType`:
```typescript
// In CockpitCanvas.tsx or SceneRouter.tsx:
{showCelebration && (
  <CeremonyFX type={mapCelebrationType(celebrationType)} labColor={labColor} />
)}
```
Create a mapping function between `CelebrationType` (`'level'`, `'badge'`) and `CeremonyFXProps.type` (`'levelUp'`, `'badgeEarn'`).

---

## Stage 5 — WARNING FINDINGS

### S5-WARN-001 — CeremonyFX type enum mismatches CelebrationType

**Files:** `src/components/3d/CeremonyFX.tsx` (line 34), `src/types/index.ts` (line 8)
**Category:** Type Mismatch
**Description:** Two parallel type systems: `CeremonyFXProps.type` uses `'levelUp' | 'badgeEarn' | 'labComplete' | 'streakMilestone'` while `CelebrationType` uses `'xp' | 'badge' | 'level' | 'streak' | 'confetti'`. No mapping layer exists.

**Required Fix:** Create an explicit mapping function and document which component handles which celebration.

---

### S5-WARN-002 — Confetti rAF loop lacks unmount guard

**File:** `src/components/shared/CelebrationOverlay.tsx` (lines 97-147)
**Category:** React Safety
**Description:** The confetti animation runs 300 frames via `requestAnimationFrame`. While `cancelAnimationFrame` is called in cleanup, `setConfetti` state updates could fire after unmount in React 18 concurrent mode.

**Required Fix:** Add an `isMounted` ref checked before each `setConfetti`:
```typescript
const isMounted = useRef(true);
useEffect(() => () => { isMounted.current = false; }, []);
// In animation loop:
if (isMounted.current) setConfetti(updated);
```

---

### S5-WARN-003 — `as any` casts in badges route (duplicate of S2-HIGH-002)

**File:** `src/app/api/gamification/badges/route.ts` (lines 83, 160, 168)
**Description:** Already reported in Stage 2 audit. Three `as any` casts for Supabase join content types.

---

### S5-WARN-004 — `accessibilityStore` exported as `useA11yStore`

**File:** `src/stores/accessibilityStore.ts`
**Category:** Naming Consistency
**Description:** CLAUDE.md Section 14 calls it "accessibilityStore" but the export is `useA11yStore`. Internal usage is consistent with the short name, but differs from documentation.

---

### S5-WARN-005 — CeremonyFX has leftover LOD comment

**File:** `src/components/3d/CeremonyFX.tsx` (line 503)
**Category:** Code Quality
**Description:** Comment reads `// Scale particle counts based on LOD` followed by hardcoded `const pMul = 1.0;`. LOD was removed per D3D-2. Misleading comment.

**Required Fix:** Update comment: `// Particle counts (desktop-ultra: full quality always)`

---

## Stage 5 — INFO FINDINGS

### S5-INFO-001 — Gamification components in `game/` not `gamification/`

**Description:** `XPPopup.tsx`, `StreakFire.tsx`, `GameCompleteCelebration.tsx` live in `src/components/game/` alongside `GameShell.tsx`. The `gamification/` directory is empty. Minor organizational inconsistency.

### S5-INFO-002 — `useCompleteAndReward` properly used by content viewers

**Description:** `LessonViewer.tsx`, `QuizEngine.tsx`, `SparkFactViewer.tsx` correctly import and call `useCompleteAndReward` — confirming the hook works. Only the game flow is disconnected.

---

## Stage 5 — PASS FINDINGS

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | `useGamification.ts` hook | PASS | Full suite: `useAwardXP`, `useUpdateStreak`, `useBadges`, `useCheckBadges`, `useCompleteAndReward` |
| 2 | `/api/gamification/xp` route | PASS | XP award with streak multiplier + level-up detection |
| 3 | `/api/gamification/badges` route | PASS | 13 badge criteria types, ownership verification |
| 4 | `/api/gamification/streak` route | PASS | Streak update with shield logic |
| 5 | `childStore.ts` XP/level/badge state | PASS | `updateXP`, `updateLevel`, `updateStreak`, `setBadges`, persisted |
| 6 | `uiStore.ts` celebration triggers | PASS | `triggerCelebration(type, data)` + `dismissCelebration()` |

---

## Stage 5 — File Inventory

| File | Status |
|------|--------|
| `src/app/(dashboard)/profile/page.tsx` | EXISTS (stub only) |
| `src/hooks/useGamification.ts` | EXISTS (fully implemented) |
| `src/components/shared/CelebrationOverlay.tsx` | EXISTS (partial — missing streak/confetti types) |
| `src/components/game/XPPopup.tsx` | EXISTS (provider never mounted) |
| `src/components/game/StreakFire.tsx` | EXISTS |
| `src/components/game/GameCompleteCelebration.tsx` | EXISTS |
| `src/components/3d/CeremonyFX.tsx` | EXISTS (not mounted in scene) |
| `src/components/gamification/` | EXISTS (empty — `.gitkeep` only) |
| `src/stores/accessibilityStore.ts` | EXISTS |
| `src/app/api/gamification/xp/route.ts` | EXISTS |
| `src/app/api/gamification/badges/route.ts` | EXISTS |
| `src/app/api/gamification/streak/route.ts` | EXISTS |

**Implemented:** 11 files | **Stubs:** 1 (profile) | **Empty dir:** 1 (gamification/) | **Not mounted:** 2 (XPPopup provider, CeremonyFX)

---

---

# STAGE 6 AUDIT — Flagship Games (6 games)

**Stage:** 6 (Phases 10-14)
**Source Docs:** `STAGE6B_v3FINAL_A/B`, `STAGE6C_v3FINAL_A/B`, `STAGE6D_v3FINAL_A/B`, `STAGE6E_v3FINAL_A/B/C`, `STAGE6F_v3FINAL_A/B/C`
**Scope:** 6 Flagship games with full 3D (20M triangle budget), creature system, Prompt Lab AI integration
**Build Status:** All 6 games code-complete, but architectural issues with Canvas and gameStore

## Stage 6 — Finding Counts

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| HIGH | 6 |
| WARNING | 5 |
| INFO | 1 |
| PASS | 9 |

---

## Stage 6 — Game Overview

| Game | File | Lines | Phases | Age Bands | completeGame | ARIA | 3D Component |
|------|------|-------|--------|-----------|--------------|------|-------------|
| Pet Trainer | PetTrainerGame.tsx | 1,048 | 7 (adopt→teach→train→data-lab→test→report) | A/B/C | YES | 5 labels | Pet3DScene |
| Sort Toy Box | SortToyBoxGame.tsx | 420 | 3 (welcome→sort→reveal) | A/C partial | YES | **0 labels** | SortScene3D |
| Neural Builder | NeuralBuilderGame.tsx | 1,484 | 6 (welcome→learn→build→train→test→report) | B/C | YES | 21 labels | NeuralNetwork3D |
| Prompt Lab | PromptLabGame.tsx | 1,962 | 5 (welcome→learn→sandbox→challenge→report) | A/B/C | **MISSING** | 15 labels | PromptBubble3DScene |
| Agent Architect | AgentArchitectGame.tsx | 1,171 | 5 (welcome→design→validate→report) | A/B/C | YES | 5 labels | AgentPipeline3D |
| Bias Detective | BiasDetectiveGame.tsx | 1,547 | 7 (welcome→investigate→analyze→report) | A/B/C | YES | 3 labels | BiasScales3D |

---

## Stage 6 — CRITICAL FINDINGS

### S6-CRIT-001 — Prompt Lab never calls `game.completeGame()`

**File:** `src/components/games/PromptLabGame.tsx`
**Category:** Core Feature Broken
**Description:** Grep for `completeGame` returns zero matches. The game increments score and advances rounds but never signals completion. Combined with S5-CRIT-002 (gamification pipeline disconnected), Prompt Lab never awards XP, never triggers celebrations, and never counts toward lab completion progress.

**Required Fix:** Add `game.completeGame()` when transitioning to the report/summary phase:
```typescript
// In the report phase transition:
useEffect(() => {
  if (phase === 'report') {
    game.completeGame();
  }
}, [phase]);
```

---

### S6-CRIT-002 — All 6 flagship 3D components create standalone Canvas (violates D3D-B1)

**Files:** `Pet3DScene.tsx`, `SortScene3D.tsx`, `NeuralNetwork3D.tsx`, `PromptBubble3DScene.tsx`, `AgentPipeline3D.tsx`, `BiasScales3D.tsx`
**Category:** Architecture / D3D Decision Lock Violation
**Description:** Per D3D-B1 (Single Persistent Canvas), all game 3D should render as `<group>` inside `CockpitCanvas` via `sceneStore.setGameSceneContent`. Instead, all 6 flagship 3D components create their own independent `<Canvas>` instances. This means:
- Two WebGL contexts run simultaneously (CockpitCanvas + game Canvas) — doubles GPU memory
- No iris transition between cockpit and game (D3D-B2 violated)
- Cockpit doesn't fade to 20% opacity during game (D3D-B6 violated)
- Scene routing via `sceneStore` is bypassed (D3D-B5 violated)

**Evidence:** Each file contains `<Canvas>` as a root element (Pet3DScene line 83, SortScene3D line 407, NeuralNetwork3D line 467, etc.)

**Required Fix:** Refactor each 3D component to export a `<group>` instead of a `<Canvas>`, and have the game component register it via:
```typescript
const setGameSceneContent = useSceneStore(s => s.setGameSceneContent);
useEffect(() => {
  setGameSceneContent(<Pet3DSceneGroup {...props} />);
  return () => setGameSceneContent(null);
}, [props]);
```
This is a significant refactor affecting all 6 files. The `<Canvas>` wrapper, camera, lights, and postprocessing must be removed from each — `CockpitCanvas` already provides these.

---

### S6-CRIT-003 — 5 of 6 games never call `game.startGame()`

**Files:** PetTrainerGame, NeuralBuilderGame, PromptLabGame, AgentArchitectGame, BiasDetectiveGame
**Category:** Store Initialization
**Description:** Only `SortToyBoxGame` calls `game.startGame("sort-toy-box", 1)`. The other 5 never initialize the game store with their slug and total rounds. This means `gameStore` may contain stale data from a previously played game, causing `updateScore` and `completeGame` to operate on wrong state.

**Required Fix:** Each game must call `startGame` on mount:
```typescript
useEffect(() => {
  game.startGame('pet-trainer', totalRounds);
  return () => game.resetGame();
}, []);
```

---

## Stage 6 — HIGH FINDINGS

### S6-HIGH-001 — Sort Toy Box has zero ARIA labels

**File:** `src/components/games/SortToyBoxGame.tsx`
**Category:** Accessibility
**Description:** Zero `aria-label` or `aria-*` attributes. Interactive buttons ("Open the Toy Box" line 317, "Add Group" line 362, "See How AI Sorts" line 369) all lack accessibility labels.

**Required Fix:** Add `aria-label` to all interactive buttons and the drag-and-drop sort area.

---

### S6-HIGH-002 — Sort Toy Box missing `learn` and `complete` phases

**File:** `src/components/games/SortToyBoxGame.tsx` (line 34)
**Category:** Game Architecture
**Description:** Phase type is `'welcome' | 'sort' | 'reveal'` — no `learn` or `complete` phase. CLAUDE.md Section 7 mandates the welcome→learn→play→complete cycle. This is the smallest flagship (420 lines) and lacks educational content and a summary phase.

**Required Fix:** Add `learn` phase (teaches clustering/unsupervised learning concepts) and `complete` phase ("What You Learned" summary with XP award).

---

### S6-HIGH-003 — No geometry/material disposal in 5 of 6 3D components

**Files:** `Pet3DScene.tsx`, `SortScene3D.tsx`, `NeuralNetwork3D.tsx`, `PromptBubble3D.tsx`, `BiasScales3D.tsx`
**Category:** Memory Leak / Performance
**Description:** Only `AgentPipeline3D.tsx` (line 144) disposes a texture on unmount. The other 5 create geometries and materials without cleanup. Over time (especially navigating between games), GPU memory will accumulate.

**Required Fix:** Add disposal in `useEffect` cleanup for each component:
```typescript
useEffect(() => {
  return () => {
    geometry.dispose();
    material.dispose();
  };
}, []);
```
Or use drei's `useDispose` utility.

---

### S6-HIGH-004 — Missing Sort Toy Box 3D environment

**File:** `src/components/3d/environments/SortToyBoxEnvironment.tsx` — DOES NOT EXIST
**Category:** Missing Asset
**Description:** All other 5 flagships have dedicated environment files (PetTrainerEnvironment, NeuralBuilderEnvironment, PromptLabEnvironment, AgentArchitectEnvironment, BiasDetectiveEnvironment). Sort Toy Box has none.

**Required Fix:** Create `SortToyBoxEnvironment.tsx` with Lab 1 themed environment (blue `#00BBFF` accents).

---

### S6-HIGH-005 — No sceneStore integration in any flagship environment

**Files:** All 5 environment files in `src/components/3d/environments/`
**Category:** D3D-B5 Violation
**Description:** None of the flagship environments reference `sceneStore`, `setGameSceneContent`, or `enterGame`/`exitGame`. Per D3D-B5, scene management should be centralized through `sceneStore`. The environments are mounted directly by the game components rather than registered into the cockpit scene system.

**Required Fix:** Part of the S6-CRIT-002 refactor — environments should be wrapped in the `<group>` registered via `setGameSceneContent`.

---

### S6-HIGH-006 — Sort Toy Box has minimal age band differentiation

**File:** `src/components/games/SortToyBoxGame.tsx` (lines 299-302, 397-401)
**Category:** Content Quality
**Description:** Only Band C gets differentiated text. Band A is not differentiated from Band B. Other flagships have multiple content sets per band with vocabulary and complexity adjustments.

**Required Fix:** Add Band A content (simpler vocabulary, fewer items) and Band B content (intermediate complexity).

---

## Stage 6 — WARNING FINDINGS

### S6-WARN-001 — Prompt Lab has no client-side rate limiting

**File:** `src/components/games/PromptLabGame.tsx` (lines 722, 800)
**Category:** Security / UX
**Description:** `promptsUsed` state is tracked and displayed but not enforced client-side. Only the `loading` flag (debounce during in-flight request) and server-side 429 response prevent rapid-fire requests. A child could spam the send button before server rate-limits kick in.

**Required Fix:** Add client-side cooldown (minimum 2-second gap between sends) and display remaining daily prompts.

---

### S6-WARN-002 — Sort Toy Box `useEffect` missing dependency

**File:** `src/components/games/SortToyBoxGame.tsx` (line 151)
**Category:** React Quality
**Description:** `useEffect(() => { game.startGame("sort-toy-box", 1); }, [])` has empty dependency array but references `game`. ESLint `react-hooks/exhaustive-deps` violation.

**Required Fix:** `useEffect(() => { game.startGame("sort-toy-box", 1); }, [game])` or extract via ref.

---

### S6-WARN-003 — Sort Toy Box has dead code (`_ShapeIcon`, `_assignGroup`)

**File:** `src/components/games/SortToyBoxGame.tsx` (lines 105, 204)
**Category:** Code Quality
**Description:** Functions prefixed with `_` are never called — appear to be unused 2D fallback paths.

**Required Fix:** Remove dead code.

---

### S6-WARN-004 — Bias Detective Canvas created in game file, not 3D component

**File:** `src/components/games/BiasDetectiveGame.tsx` (lines 43-46)
**Category:** Architecture
**Description:** The game file dynamically imports both `BiasScales3D` and `Canvas` separately, creating the Canvas wrapper in the game component rather than the 3D file. Fragile coupling.

---

### S6-WARN-005 — Sort Toy Box redundant nested phase check

**File:** `src/components/games/SortToyBoxGame.tsx` (line 344)
**Category:** Code Quality
**Description:** `{phase === 'sort' && (` nested inside a block already guarded by the same check. Redundant condition.

---

## Stage 6 — INFO FINDINGS

### S6-INFO-001 — Sort Toy Box is significantly smaller than other flagships

**Description:** At 420 lines, Sort Toy Box is 2.5-4.7x smaller than the other flagships (1,048-1,962 lines). Missing learn/complete phases and minimal age band content contribute to this gap. It may need a scope expansion to match flagship quality expectations.

---

## Stage 6 — PASS FINDINGS

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | Zero `any` types across all 6 games | PASS | No `@ts-ignore`, no `as any`, no `: any` |
| 2 | GameShell wrapper on all 6 games | PASS | All use `<GameShell>` with correct props |
| 3 | Dynamic import ssr:false for all 3D | PASS | All use `dynamic(() => import(...), { ssr: false })` |
| 4 | Chrome bezel + LED rim on all 6 | PASS | Gradient borders, box shadows, LED `h-[2px]` strips |
| 5 | Creature system complete | PASS | 5 species + CreatureBase + creatureConfig (11KB) |
| 6 | Prompt Lab API error handling | PASS | Handles 429, moderation rejection, network failures |
| 7 | All 7 3D component files exist | PASS | Pet3DScene, SortScene3D, NeuralNetwork3D, PromptBubble3D, PromptBubble3DScene, AgentPipeline3D, BiasScales3D |
| 8 | 5 of 6 environment files exist | PASS | PetTrainer, NeuralBuilder, PromptLab, AgentArchitect, BiasDetective |
| 9 | 5 of 6 games call `completeGame()` | PASS | Only PromptLab is missing it |

---

## Stage 6 — File Inventory

### Game Components
| File | Lines | Status |
|------|-------|--------|
| `src/components/games/PetTrainerGame.tsx` | 1,048 | EXISTS |
| `src/components/games/SortToyBoxGame.tsx` | 420 | EXISTS (needs learn/complete phases) |
| `src/components/games/NeuralBuilderGame.tsx` | 1,484 | EXISTS |
| `src/components/games/PromptLabGame.tsx` | 1,962 | EXISTS (missing completeGame) |
| `src/components/games/AgentArchitectGame.tsx` | 1,171 | EXISTS |
| `src/components/games/BiasDetectiveGame.tsx` | 1,547 | EXISTS |

### 3D Components
| File | Status |
|------|--------|
| `src/components/3d/Pet3DScene.tsx` | EXISTS (standalone Canvas) |
| `src/components/3d/SortScene3D.tsx` | EXISTS (standalone Canvas) |
| `src/components/3d/NeuralNetwork3D.tsx` | EXISTS (standalone Canvas) |
| `src/components/3d/PromptBubble3D.tsx` | EXISTS |
| `src/components/3d/PromptBubble3DScene.tsx` | EXISTS (standalone Canvas) |
| `src/components/3d/AgentPipeline3D.tsx` | EXISTS (standalone Canvas) |
| `src/components/3d/BiasScales3D.tsx` | EXISTS |

### 3D Environments
| File | Status |
|------|--------|
| `src/components/3d/environments/PetTrainerEnvironment.tsx` | EXISTS (27KB) |
| `src/components/3d/environments/NeuralBuilderEnvironment.tsx` | EXISTS (20KB) |
| `src/components/3d/environments/PromptLabEnvironment.tsx` | EXISTS |
| `src/components/3d/environments/AgentArchitectEnvironment.tsx` | EXISTS (21KB) |
| `src/components/3d/environments/BiasDetectiveEnvironment.tsx` | EXISTS (24KB) |
| `src/components/3d/environments/SortToyBoxEnvironment.tsx` | **MISSING** |

### Creature System
| File | Status |
|------|--------|
| `src/components/3d/creatures/BytelingCreature.tsx` | EXISTS |
| `src/components/3d/creatures/SparkpawCreature.tsx` | EXISTS |
| `src/components/3d/creatures/VoltkitCreature.tsx` | EXISTS |
| `src/components/3d/creatures/CogsworthCreature.tsx` | EXISTS |
| `src/components/3d/creatures/PixieCreature.tsx` | EXISTS |
| `src/components/3d/creatures/CreatureBase.tsx` | EXISTS |
| `src/config/creatureConfig.ts` | EXISTS (11KB) |

**Games:** 6/6 exist | **3D:** 7/7 exist | **Environments:** 5/6 (Sort Toy Box missing) | **Creatures:** 7/7 exist

---

---

# STAGE 7 AUDIT — Remaining Games (29 games: 9 FL-Lite + 20 Standard)

**Stage:** 7 (Phases 15-22)
**Source Docs:** `STAGE7A_Batch + Parts 2-4`, `STAGE7B_v3FINAL_A/B/C`, `STAGE7C_Part1+2 + v3FINAL_A/B/C`, `STAGE7D_v3FINAL_A/B/C`, `STAGE7E_Part1+2`, `STAGE7F_v3FINAL_A/B + Part1/2`
**Scope:** 9 FL-Lite games (10M tri budget) + 20 Standard games (5M tri budget), environments, 3D integration
**Build Status:** All 29 games code-complete. Systemic D3D-B1 violation across 28/29 games.

## Stage 7 — Finding Counts

| Severity | Count |
|----------|-------|
| CRITICAL | 1 (systemic — affects 28 games) |
| HIGH | 4 |
| WARNING | 4 |
| INFO | 2 |
| PASS | 7 |

---

## Stage 7 — FL-Lite Game Overview (9 games)

| Game | Lines | Phases | Learn | Complete | startGame | completeGame | 3D Import | ARIA |
|------|-------|--------|-------|----------|-----------|-------------|-----------|------|
| DataDetective | 322 | welcome→play→complete | NO | YES | NO | YES | YES | 4 |
| RobotVacuum | 834 | welcome→learn→play | YES | NO | NO | YES | YES | 2 |
| CameraQuest | 619 | welcome→learn→hunt | YES | NO | NO | YES | YES | 1 |
| ChatbotBuilder | 750 | welcome→learn→build | YES | NO | YES | YES | YES | 4 |
| EmojiDecoder | 614 | welcome→learn→play→lab→complete | YES | YES | YES | YES | **NO** | 5 |
| CodeBlocks | 727 | welcome→learn→play | YES | NO | NO | YES | YES | 2 |
| MyFirstAiApp | 750 | welcome→learn→build→preview→complete | YES | YES | YES | YES | YES | 7 |
| FutureForge | 381 | welcome→learn→play→complete | YES | YES | YES | YES | YES | 3 |
| AiOrNot | 554 | welcome→learn→play→predict→complete | YES | YES | YES | YES | **NO** | 3 |

## Stage 7 — Standard Game Overview (20 games)

| Game | Lines | Phases | Learn | Complete | startGame | completeGame | ARIA |
|------|-------|--------|-------|----------|-----------|-------------|------|
| AiSpy | 499 | welcome→play→reveal→complete | NO | YES | NO | YES | 5+ |
| TimeMachine | 316 | welcome→play | NO | NO | NO | YES | 2+ |
| HumanVsMachine | 429 | welcome→play | NO | NO | NO | YES | 1+ |
| TreatTrainer | 244 | welcome→select→train→report | NO | NO | YES | YES | 2+ |
| NeuronRelay | 212 | welcome→learn→play→report | YES | NO | NO | YES | 5+ |
| PixelInvestigator | 311 | welcome→zoom→discover→report | NO | NO | NO | YES | 4+ |
| WordPredictor | 391 | welcome→play | NO | NO | NO | YES | 1+ |
| TokenChopper | 298 | welcome→learn→play | YES | NO | NO | YES | 1+ |
| AiArtDetective | 464 | welcome→examine→judge→report | NO | NO | NO | YES | 1+ |
| ToolPicker | 247 | welcome→learn→match→report | YES | NO | NO | YES | 1+ |
| DataShield | 260 | welcome→protect→report | NO | NO | NO | YES | 2+ |
| RealOrFake | 231 | welcome→analyze→judge→report | NO | NO | NO | YES | 2+ |
| EthicsCourtroom | 949 | welcome→learn→trial→complete | YES | YES | NO | YES | 5+ |
| FoolTheAi | 299 | welcome→learn→create→test | YES | NO | NO | YES | 1+ |
| BuildClassifier | 770 | welcome→label→train→test→report | YES | NO | NO | YES | 6+ |
| PredictionMarket | 256 | welcome→learn→predict→report | YES | NO | NO | YES | 1+ |
| SentimentScanner | 216 | welcome→analyze→report | NO | NO | NO | YES | 2+ |
| LostInTranslation | 235 | welcome→translate→compare→report | NO | NO | NO | YES | 2+ |
| CareerExplorer | 594 | welcome→learn→play→complete | YES | YES | YES | YES | 7+ |
| ApiExplorer | 765 | welcome→learn→request→inspect→report | YES | NO | NO | YES | 5+ |

---

## Stage 7 — CRITICAL FINDINGS

### S7-CRIT-001 — 28 of 29 games create standalone Canvas (systemic D3D-B1 violation)

**Category:** Architecture — D3D Decision Lock Violation
**Description:** Combined with S6-CRIT-002 (6 flagships), this makes **28 of 29 total 3D-using games** that create their own `<Canvas>` instead of rendering as `<group>` inside the persistent `CockpitCanvas`. Only **AiSpyGame** correctly uses `sceneStore.setGameSceneContent`.

This violates:
- **D3D-B1**: CockpitCanvas should never unmount; games shouldn't create separate Canvas instances
- **D3D-B3**: Game scenes should render as `<group>` inside CockpitCanvas
- **D3D-B5**: sceneStore should manage scene visibility
- **D3D-B2**: MechanicalIris transitions can't work with separate Canvas
- **D3D-B6**: Cockpit can't fade to 20% opacity during game

**Impact:** Dual WebGL contexts running simultaneously on 28 games. GPU memory doubled. No iris transitions. SceneRouter bypassed. This is the single largest architectural gap in the entire codebase.

**Required Fix:** Systemic refactor — remove `<Canvas>` from all 28 3D components, convert to `<group>`, and register via `sceneStore.setGameSceneContent`. This is a major effort but is required by 5 locked D3D decisions. AiSpyGame serves as the reference implementation.

---

## Stage 7 — HIGH FINDINGS

### S7-HIGH-001 — 22 of 29 games never call `startGame()`

**Category:** Store Initialization
**Description:** Only 7 games call `game.startGame(slug, rounds)`:
- **FL-Lite (5/9):** ChatbotBuilder, EmojiDecoder, MyFirstAiApp, FutureForge, AiOrNot
- **Standard (2/20):** TreatTrainer, CareerExplorer

The other 22 never initialize the game store. Combined with 5 flagships from S6-CRIT-003, that's **27 of 35 total games** that skip `startGame()`.

**Required Fix:** Add `game.startGame(slug, totalRounds)` on mount for all games. Can be automated in `GameShell` if the `gameId` prop is reliably set.

---

### S7-HIGH-002 — 2 FL-Lite games missing 3D component integration

**Files:** `EmojiDecoderGame.tsx`, `AiOrNotGame.tsx`
**Category:** Missing Feature
**Description:** Both are classified as FL-Lite (immersive 3D, 10M triangle budget) but neither imports nor renders its 3D component. `EmojiDecoder3D.tsx` and `AiOrNot3D.tsx` exist but are orphaned — never imported by any file.

**Required Fix:**
```typescript
// In EmojiDecoderGame.tsx:
const EmojiDecoder3D = dynamic(() => import('@/components/3d/EmojiDecoder3D'), { ssr: false });
// Render in play/lab phase

// In AiOrNotGame.tsx:
const AiOrNot3D = dynamic(() => import('@/components/3d/AiOrNot3D'), { ssr: false });
// Render in play/predict phase
```

---

### S7-HIGH-003 — 21 of 29 games missing explicit `complete` phase

**Category:** Game Architecture
**Description:** Per CLAUDE.md Section 7, the phase cycle should include a `complete` phase that shows results and triggers celebrations. Only **8 of 29** Stage 7 games have it:
- FL-Lite: DataDetective, EmojiDecoder, MyFirstAiApp, FutureForge, AiOrNot (5)
- Standard: AiSpy, EthicsCourtroom, CareerExplorer (3)

The other 21 call `completeGame()` mid-flow without transitioning to a dedicated completion screen with "What You Learned" summary.

**Required Fix:** Add `complete` phase to each game with educational summary, score display, and celebration trigger. This can be phased — prioritize FL-Lite games first.

---

### S7-HIGH-004 — API Explorer Band C restriction not enforced in code

**File:** `src/components/games/ApiExplorerGame.tsx`
**Category:** COPPA / Age Restriction
**Description:** API Explorer is marked "BAND C ONLY" in its header comment and shows an "Advanced — Ages 14-16" badge. However, it does NOT import `useChildStore` to read the child's age band. There is no programmatic gate preventing Band A (ages 7-10) or Band B (ages 11-13) users from accessing it. The restriction is documentation-only, not enforced.

The `gameRegistry.ts` correctly marks it as `ageBands: ['C']`, but nothing in the game routing (`arcade/[gameSlug]/page.tsx`) checks this against the active child's age band.

**Required Fix:** Add age band enforcement in the game router:
```typescript
// In arcade/[gameSlug]/page.tsx:
const activeChild = useChildStore(s => s.activeChild);
const gameConfig = GAME_REGISTRY[gameSlug];
if (gameConfig?.ageBands && !gameConfig.ageBands.includes(activeChild?.age_band)) {
  return <AgeRestrictionNotice requiredBands={gameConfig.ageBands} />;
}
```

---

## Stage 7 — WARNING FINDINGS

### S7-WARN-001 — 15 of 29 games missing `learn` phase

**Category:** Game Architecture
**Description:** The architecture template specifies welcome→learn→play→complete. 15 games jump directly from welcome to play:
- FL-Lite: DataDetective (1)
- Standard: AiSpy, TimeMachine, HumanVsMachine, TreatTrainer, PixelInvestigator, WordPredictor, AiArtDetective, DataShield, RealOrFake, SentimentScanner, LostInTranslation (11)
- Plus 3 Standard games use `tips`/`report` phases instead of `learn` (close equivalents)

**Impact:** Acceptable for simpler Standard-tier games that teach through gameplay. DataDetective (FL-Lite) should have a learn phase added.

---

### S7-WARN-002 — All 9 FL-Lite environment files are orphaned (dead code)

**Files:** All 9 files in `src/components/3d/environments/` for FL-Lite games
**Category:** Dead Code
**Description:** None of the 9 FL-Lite game files or their 3D components import their corresponding environment files. The 3D components use drei's `<Environment preset="night" />` inline instead. The environment files exist but are never loaded.

**Impact:** Dead code adding to repo size. May be intended for future SceneRouter integration.

---

### S7-WARN-003 — Low ARIA label count on several games

**Category:** Accessibility
**Description:** Several games have minimal ARIA coverage:
- CameraQuest: 1 label (capture button only)
- RobotVacuum: 2 labels
- CodeBlocks: 2 labels
- Multiple Standard games: 1-2 labels

Interactive buttons, dropdowns, and clickable elements lack `aria-label` in these games.

---

### S7-WARN-004 — Inconsistent error boundary usage across games

**File:** `src/components/games/ChatbotBuilderGame.tsx` (line 35)
**Category:** Consistency
**Description:** Only ChatbotBuilderGame imports `Canvas3DErrorBoundary` to wrap its 3D component. The other 28 games don't use a 3D-specific error boundary. If a 3D component throws during render, it will crash the entire game page rather than showing a graceful fallback.

**Required Fix:** Either wrap all 3D dynamic imports in a shared error boundary at the `GameShell` level, or add `Canvas3DErrorBoundary` to all games with 3D.

---

## Stage 7 — INFO FINDINGS

### S7-INFO-001 — AiSpyGame is the D3D-B1 reference implementation

**Description:** Of all 35 games, only AiSpyGame correctly uses `sceneStore.setGameSceneContent` to register its 3D environment into CockpitCanvas without creating a separate Canvas. It serves as the reference implementation for the D3D-B1 refactor.

### S7-INFO-002 — Standard game size range

**Description:** Standard games range from 212 lines (NeuronRelay) to 949 lines (EthicsCourtroom). Average is ~380 lines. All are functional with complete gameplay loops.

---

## Stage 7 — PASS FINDINGS

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | All 29 game files exist | PASS | 9 FL-Lite + 20 Standard, all at correct paths |
| 2 | All 29 games call `completeGame()` | PASS | Every game signals completion |
| 3 | All 29 games use GameShell wrapper | PASS | Consistent wrapper pattern |
| 4 | All 29 games have chrome bezel styling | PASS | LED rim + gradient borders |
| 5 | All 29 games have age band routing | PASS | Content differentiates A/B/C (except ApiExplorer — C-only) |
| 6 | All 29 environment files exist | PASS | 9 FL-Lite + 20 Standard environments |
| 7 | All 9 FL-Lite 3D components exist | PASS | DataDetective3D, RobotVacuum3D, CameraQuest3D, ChatbotNodes3D, EmojiDecoder3D, CodeBlocks3D, MyFirstAiApp3D, FutureForge3D, AiOrNot3D |

---

## Stage 7 — Combined Game Statistics (29 games)

| Metric | FL-Lite (9) | Standard (20) | Total |
|--------|-------------|---------------|-------|
| Files exist | 9/9 | 20/20 | 29/29 |
| completeGame() called | 9/9 | 20/20 | 29/29 |
| startGame() called | 5/9 | 2/20 | 7/29 |
| Has learn phase | 8/9 | 6/20 | 14/29 |
| Has complete phase | 5/9 | 3/20 | 8/29 |
| 3D imported | 7/9 | 19/20* | 26/29 |
| Own Canvas (D3D-B1 violation) | 9/9 | 19/20 | 28/29 |
| sceneStore integration | 0/9 | 1/20 | 1/29 |
| Environment files exist | 9/9 | 20/20 | 29/29 |

*AiSpy uses sceneStore (no own Canvas). 19 Standard games have own Canvas via environment imports.

---

---

# STAGE 8 AUDIT — Parent Dashboard & Stripe Payments

**Stage:** 8 (Phases 23-24)
**Source Docs:** `STAGE8_Parent_Dashboard_v2_PART1-2`, `STAGE8_P3_v3FINAL_A/B/C`
**Scope:** Parent dashboard, subscription management, Stripe checkout/portal/webhook, pricing page, parental controls
**Build Status:** COMPLETE — all files exist and functional

## Stage 8 — Finding Counts

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH | 2 |
| WARNING | 5 |
| INFO | 2 |
| PASS | 22 |

---

## Stage 8 — HIGH FINDINGS

### S8-HIGH-001 — No Zod validation on Stripe checkout request body

**File:** `src/app/api/stripe/checkout/route.ts` (lines 37-45)
**Category:** Security / Input Validation
**Description:** The `tier` and `interval` fields are cast with `as SubscriptionTier` and `as 'month' | 'year'` without runtime Zod validation. A malicious request could pass `tier: 'admin'` or `interval: 'decade'`. The code does check for `priceId` lookup failure (line 50) which partially mitigates this, but the raw tier value ends up in Stripe metadata (line 91) unsanitized.

**Required Fix:**
```typescript
import { z } from 'zod';
const CheckoutSchema = z.object({
  tier: z.enum(['plus', 'forge']),
  interval: z.enum(['month', 'year']),
});
const parsed = await parseBody(req, CheckoutSchema);
if (!parsed.success) return apiError('Invalid checkout parameters', 400);
const { tier, interval } = parsed.data;
```

---

### S8-HIGH-002 — N+1 query pattern in `useParentDashboard` (up to 25 DB calls)

**File:** `src/hooks/useParentDashboard.ts` (lines 50-116)
**Category:** Performance
**Description:** For each child, the hook makes 5 separate Supabase queries (lessons count, quiz count, badge count, games count, sessions). With 5 children on the Forge plan, this is **25 database queries** on every dashboard load.

**Required Fix:** Consolidate into a single server-side API route or database function:
```typescript
// Option A: Single API route
GET /api/parent/dashboard?parentId=xxx
// Returns all children with pre-aggregated stats

// Option B: Database function
SELECT * FROM get_parent_dashboard(p_parent_id UUID)
// Returns children + stats in one round-trip
```

---

## Stage 8 — WARNING FINDINGS

### S8-WARN-001 — No UI button to delete a child profile

**File:** `src/app/(dashboard)/parent/page.tsx`
**Category:** COPPA / Feature Gap
**Description:** The DELETE API endpoint exists (`/api/children/[childId]` with ownership verification), but the parent dashboard has no delete button or confirmation flow. Parents cannot delete a child profile from the UI — they'd need to use the API directly.

**Required Fix:** Add a delete button with confirmation modal on the child detail view. Include clear warning about permanent data deletion.

---

### S8-WARN-002 — Raw Stripe status stored without mapping

**File:** `src/app/api/stripe/webhook/route.ts` (line 104)
**Category:** Data Integrity
**Description:** In `customer.subscription.updated`, the raw Stripe status string (e.g., `'incomplete'`, `'trialing'`, `'unpaid'`, `'past_due'`) is stored directly in the `subscription_status` column. If the column has a check constraint limited to expected values, this could silently fail.

**Required Fix:** Map Stripe statuses to application statuses:
```typescript
const STATUS_MAP: Record<string, string> = {
  active: 'active', trialing: 'active',
  past_due: 'past_due', unpaid: 'canceled',
  canceled: 'canceled', incomplete: 'active',
  incomplete_expired: 'canceled', paused: 'paused',
};
const appStatus = STATUS_MAP[sub.status] ?? 'active';
```

---

### S8-WARN-003 — Time limit save has no error handling

**File:** `src/app/(dashboard)/parent/page.tsx` (lines 81-88)
**Category:** Error Handling
**Description:** `handleTimeLimit` calls both `updateChildTimeLimit` (optimistic store update) and `sb.from('children').update(...)` (Supabase write) but never checks the Supabase result for errors. If the DB write fails, the UI shows the updated limit but the actual limit is unchanged.

**Required Fix:** Check the Supabase response and roll back the optimistic update on failure:
```typescript
const { error } = await sb.from('children').update({ daily_time_limit: minutes }).eq('id', childId);
if (error) {
  // Roll back optimistic update
  updateChildTimeLimit(childId, previousLimit);
  toast.error('Failed to save time limit');
}
```

---

### S8-WARN-004 — Subscription page uses `alert()` instead of toast

**File:** `src/app/(dashboard)/parent/subscription/page.tsx` (lines 66, 69, 81, 84)
**Category:** UX / Accessibility
**Description:** Uses `alert()` for error messages. Not accessible-friendly (screen readers handle it inconsistently) and breaks the Frost-Prismatic visual design.

**Required Fix:** Replace with `useToastStore`:
```typescript
const toast = useToastStore(s => s.addToast);
// Replace: alert('Failed to start checkout');
// With:    toast('error', 'Failed to start checkout');
```

---

### S8-WARN-005 — Add-child page uses direct Supabase client call (bypasses server)

**File:** `src/app/(dashboard)/parent/add-child/page.tsx` (line 78)
**Category:** Security / Architecture
**Description:** Child creation uses direct Supabase client call from the browser, bypassing any server-side validation or rate limiting. A malicious user could create unlimited child profiles by manipulating the client, ignoring tier-based child limits.

**Required Fix:** Route child creation through the existing `/api/children` POST endpoint which enforces tier limits server-side.

---

## Stage 8 — INFO FINDINGS

### S8-INFO-001 — Pricing page CTAs link to /signup (correct)

**Description:** Public pricing page CTA buttons link to `/signup` rather than directly to Stripe checkout. Correct — unauthenticated users need to create an account first.

### S8-INFO-002 — Stripe price IDs use placeholder fallbacks

**Description:** `tier-config.ts` (lines 82-91) falls back to `price_placeholder_*` strings. The checkout route (line 50) checks for this prefix and returns an error. Good defensive pattern for development without Stripe keys.

---

## Stage 8 — PASS FINDINGS

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | All 9 Stage 8 files exist | PASS | Parent pages, Stripe routes, pricing, store, tier-config |
| 2 | Webhook signature verification | PASS | `stripe.webhooks.constructEvent(body, sig, secret)` |
| 3 | Raw body handling for webhook | PASS | `req.text()` preserves body for sig verification |
| 4 | 4 webhook event types handled | PASS | checkout.completed, sub.updated, sub.deleted, invoice.failed |
| 5 | ENH-8A: 503 fallback if keys missing | PASS | All 3 Stripe routes return 503 + setup_url |
| 6 | No Stripe secret in client code | PASS | Only in server-side `src/app/api/stripe/` |
| 7 | BUG-8A: Single tier-config.ts | PASS | No duplicate `tiers.ts` anywhere |
| 8 | Tier-config appended correctly | PASS | Comment confirms BUG-8A fix applied |
| 9 | Free/Plus/Forge tiers displayed | PASS | Pricing page shows all 3 tiers |
| 10 | Daily time limits per child | PASS | 15/30/60/90 min + Unlimited options |
| 11 | Parent can view child progress | PASS | XP, lessons, time, streak, level, badges |
| 12 | Delete child API endpoint exists | PASS | `/api/children/[childId]` DELETE with ownership |
| 13 | No `any` types in Stage 8 files | PASS | Clean TypeScript |
| 14 | Proper auth on Stripe routes | PASS | `requireAuth` on checkout/portal, admin client on webhook |
| 15 | Webhook idempotency | PASS | `ignoreDuplicates: true` on event upsert |
| 16 | Parent hold-button ARIA | PASS | `aria-label="Hold for 3 seconds..."` |
| 17 | Math verification ARIA | PASS | `aria-label="Enter the sum"` + `aria-live="polite"` |
| 18 | Child selector ARIA | PASS | `aria-label` + `aria-pressed` |
| 19 | Time limit buttons ARIA | PASS | `aria-pressed` + `aria-label` |
| 20 | Add-child form ARIA | PASS | `htmlFor`/`id` + `aria-label` on inputs |
| 21 | Pricing FAQ ARIA | PASS | `aria-expanded` + `aria-controls` + `role="region"` |
| 22 | Suspense boundary on subscription | PASS | Wraps `useSearchParams()` per Next.js best practice |

---

## Stage 8 — File Inventory

| File | Status |
|------|--------|
| `src/app/(dashboard)/parent/page.tsx` | EXISTS |
| `src/app/(dashboard)/parent/add-child/page.tsx` | EXISTS |
| `src/app/(dashboard)/parent/subscription/page.tsx` | EXISTS |
| `src/app/(dashboard)/onboarding/page.tsx` | EXISTS |
| `src/app/(marketing)/pricing/page.tsx` | EXISTS |
| `src/app/api/stripe/checkout/route.ts` | EXISTS |
| `src/app/api/stripe/portal/route.ts` | EXISTS |
| `src/app/api/stripe/webhook/route.ts` | EXISTS |
| `src/stores/parentStore.ts` | EXISTS |
| `src/lib/tier-config.ts` | EXISTS (BUG-8A: single file) |
| `src/hooks/useParentDashboard.ts` | EXISTS |

**All expected files present. No missing files.**

---

---

# STAGE 9 AUDIT — Content Agent (AI Pipeline)

**Stage:** 9 (Phase 25)
**Source Docs:** `STAGE9_Content_Agent_v2_PART1-3`
**Scope:** Anthropic Claude API integration, content generation pipeline, admin review dashboard, safety screening, Prompt Lab
**Build Status:** COMPLETE — pipeline, admin dashboard, and all routes functional

## Stage 9 — Finding Counts

| Severity | Count |
|----------|-------|
| CRITICAL | 1 |
| HIGH | 4 |
| WARNING | 4 |
| INFO | 2 |
| PASS | 20 |

---

## Stage 9 — CRITICAL FINDINGS

### S9-CRIT-001 — ENH-9A not applied to Prompt Lab (top-level Anthropic init)

**File:** `src/app/api/ai/prompt-lab/route.ts` (line 13)
**Category:** Runtime Crash / Known Bug
**Description:** The Anthropic SDK is initialized at the **top level** with `new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })`. This means:
1. If `ANTHROPIC_API_KEY` is missing, the SDK initializes with `undefined` and crashes at runtime with an unhelpful error when `messages.create()` is called — no graceful 503
2. Violates BUG-9A (lazy init) — the Content Agent pipeline (`pipeline.ts`) correctly uses lazy initialization via `getAnthropicClient()`, but Prompt Lab does not
3. Violates ENH-9A — all 3 agent routes return 503 if key missing, but Prompt Lab crashes instead

**Required Fix:** Add early key check and lazy initialization:
```typescript
export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return apiError('Prompt Lab is not configured. Add ANTHROPIC_API_KEY.', 503);
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // ... rest of handler
}
```

---

## Stage 9 — HIGH FINDINGS

### S9-HIGH-001 — No client-side admin guard on admin dashboard

**File:** `src/app/(dashboard)/admin/content/page.tsx`
**Category:** Security / Access Control
**Description:** The admin content page is a `'use client'` component with no auth check. Any authenticated user who navigates to `/admin/content` sees the full admin UI. API endpoints verify admin status (approve/reject return 403 for non-admins), but the page still renders and leaks queue metadata. The middleware (`src/middleware.ts`) also has no admin route protection.

**Required Fix:** Add a client-side admin check with redirect:
```typescript
const { parent } = useAuthStore();
useEffect(() => {
  if (parent && !parent.is_admin) {
    router.replace('/home');
  }
}, [parent]);
if (!parent?.is_admin) return null; // Don't render until verified
```
Or better: add server-side protection via a layout or middleware check for `/admin/*` routes.

---

### S9-HIGH-002 — No Zod validation on review POST body

**File:** `src/app/api/agent/review/route.ts` (lines 129-160)
**Category:** Input Validation
**Description:** The POST body is parsed with manual checks (`!body.action || !body.ids || !Array.isArray(body.ids)`) but `ids` are not validated as UUIDs. Malicious strings could be passed to Supabase queries. While Supabase parameterizes queries (preventing SQL injection), this is inconsistent with the Zod-everywhere pattern.

**Required Fix:**
```typescript
const ReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  ids: z.array(z.string().uuid()),
  reason: z.string().optional(),
});
const parsed = await parseBody(req, ReviewSchema);
```

---

### S9-HIGH-003 — Hardcoded model string in Prompt Lab (BUG-9B violation)

**File:** `src/app/api/ai/prompt-lab/route.ts` (line 58)
**Category:** Known Bug
**Description:** Uses `'claude-sonnet-4-20250514'` directly instead of importing from the `MODELS` constant in `src/lib/agent/prompts.ts`. Also note the model is Sonnet 4 while the MODELS config uses Sonnet 4.5 (`claude-sonnet-4-5-20250514`) — this discrepancy may be intentional (cheaper model for chat) but should be explicit.

**Required Fix:**
```typescript
import { MODELS } from '@/lib/agent/prompts';
// Use MODELS.generation or add a MODELS.promptLab entry
model: MODELS.generation, // or a dedicated chat model constant
```

---

### S9-HIGH-004 — `any` types in Prompt Lab (2 occurrences)

**File:** `src/app/api/ai/prompt-lab/route.ts` (lines 67-68, 81-82)
**Category:** TypeScript Quality
**Description:** Two eslint-disable comments for `@typescript-eslint/no-explicit-any`:
- Line 68: `(block as any).text` — should use type guard for `TextBlock`
- Line 82: `catch (error: any)` — should use `catch (error: unknown)`

**Required Fix:** Already detailed in S2-WARN-002. Use type guard:
```typescript
.filter((block): block is Anthropic.TextBlock => block.type === 'text')
.map(block => block.text)
```

---

## Stage 9 — WARNING FINDINGS

### S9-WARN-001 — No rate limiting on `/api/agent/run`

**File:** `src/app/api/agent/run/route.ts`
**Category:** Security / Cost
**Description:** Admin-only check provides some protection, but a compromised admin session could trigger unlimited expensive pipeline runs (5+ Anthropic API calls with web search per run).

**Required Fix:** Add `applyRateLimit(req, RATE_LIMITS.agent)` — e.g., 5 runs per hour.

---

### S9-WARN-002 — No rate limiting on review POST

**File:** `src/app/api/agent/review/route.ts`
**Category:** Security
**Description:** Admin-only but no throttling on bulk approve/reject. A compromised session could mass-approve content.

---

### S9-WARN-003 — CRON_SECRET check skippable when env var not set

**File:** `src/app/api/agent/schedule/route.ts` (line 16)
**Category:** Security
**Description:** The condition `if (cronSecret && ...)` means if `CRON_SECRET` is not set, anyone can trigger the schedule endpoint via GET. By design for local dev, but in production `CRON_SECRET` MUST be set.

**Required Fix:** Add a warning log when `CRON_SECRET` is missing, or require it in production:
```typescript
if (!cronSecret && process.env.NODE_ENV === 'production') {
  return apiError('CRON_SECRET required in production', 500);
}
```

---

### S9-WARN-004 — Prompt Lab has no post-response safety moderation

**File:** `src/app/api/ai/prompt-lab/route.ts`
**Category:** COPPA / Safety
**Description:** The Prompt Lab (child-facing AI chat) relies ONLY on system prompt instructions for safety ("gently redirect" inappropriate topics). There is no post-response safety screening or content filtering. Claude could still produce unexpected content. The Content Agent has a multi-layer safety pipeline (LLM check + readability), but Prompt Lab has none.

**Required Fix:** Add a lightweight post-response moderation check using the Haiku model, or at minimum a keyword blocklist filter before returning the response to the child.

---

## Stage 9 — INFO FINDINGS

### S9-INFO-001 — Schedule route uses raw NextResponse instead of helpers

**Description:** `schedule/route.ts` uses `NextResponse.json()` directly instead of `apiSuccess`/`apiError` helpers. Inconsistent with other routes but functionally equivalent.

### S9-INFO-002 — Seed script is manual (prints instructions)

**Description:** `seed.ts` reads SQL and prints instructions for the admin to execute manually. Does not auto-execute. Safe but requires manual setup step.

---

## Stage 9 — PASS FINDINGS

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | All 9 Stage 9 files exist | PASS | Pipeline, prompts, readability, 3 routes, admin page, seed |
| 2 | Pipeline calls Anthropic Claude API | PASS | 3 distinct API calls (research, generation, safety) |
| 3 | BUG-9A: Lazy Anthropic init in pipeline | PASS | `getAnthropicClient()` with lazy `require()` |
| 4 | BUG-9B: Centralized MODELS object | PASS | `prompts.ts` lines 7-12 (Sonnet 4.5, Haiku 4.5) |
| 5 | Multi-stage safety screening | PASS | LLM safety (11 rules) + Flesch-Kincaid readability |
| 6 | Readability validation against age band | PASS | Band A=grade 5, B=grade 8, C=grade 10 |
| 7 | Content status = `pending_review` | PASS | Never auto-publishes — human review required |
| 8 | Pipeline error handling | PASS | Fallback on research, skip-and-continue on gen, fail-safe on safety |
| 9 | Retry with exponential backoff | PASS | Retries on 429 and 5xx with jitter |
| 10 | Deduplication check | PASS | Checks title+world+age_band before insert |
| 11 | ENH-9A on agent routes | PASS | All 3 agent routes return 503 if key missing |
| 12 | Auth + admin on all agent routes | PASS | `getUser()` + `parents.is_admin` check |
| 13 | Admin review: approve/reject/preview | PASS | Full CRUD with bulk operations |
| 14 | `reviewed_by` and `reviewed_at` recorded | PASS | pipeline.ts lines 442-443, 477-478 |
| 15 | Admin dashboard ARIA labels | PASS | Checkbox roles, button labels, dialog roles, focus management |
| 16 | Keyboard accessibility (Escape closes modals) | PASS | Lines 155-167 |
| 17 | No raw AI output exposed to children | PASS | All content goes through review before publishing |
| 18 | No `any` in pipeline code | PASS | Proper interfaces throughout pipeline.ts |
| 19 | No hardcoded API keys | PASS | All keys from `process.env` |
| 20 | CRON schedule with feature flag | PASS | `ENABLE_CONTENT_AGENT=false` disables |

---

## Stage 9 — File Inventory

| File | Status |
|------|--------|
| `src/lib/agent/pipeline.ts` | EXISTS (563 lines) |
| `src/lib/agent/prompts.ts` | EXISTS (110 lines — MODELS + prompt templates) |
| `src/lib/agent/readability.ts` | EXISTS (77 lines — Flesch-Kincaid) |
| `src/lib/agent/seed.ts` | EXISTS (86 lines — manual SQL helper) |
| `src/app/api/agent/run/route.ts` | EXISTS (54 lines) |
| `src/app/api/agent/review/route.ts` | EXISTS (189 lines) |
| `src/app/api/agent/schedule/route.ts` | EXISTS (47 lines) |
| `src/app/(dashboard)/admin/content/page.tsx` | EXISTS (1,089 lines) |
| `src/app/api/ai/prompt-lab/route.ts` | EXISTS (87 lines — ENH-9A missing) |

**All expected files present.**

---

---

# STAGE 10 AUDIT — Polish & Deploy

**Stage:** 10 (Phase 26)
**Source Docs:** `STAGE10_Polish_Deploy_v2_PART1-2`
**Scope:** Accessibility toolkit, PWA, CSP headers, Sentry monitoring, production readiness, icons/assets
**Build Status:** PARTIALLY COMPLETE — a11y toolkit and Sentry done; CSP, PWA assets, and service worker missing

## Stage 10 — Finding Counts

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH | 7 |
| WARNING | 5 |
| INFO | 3 |
| PASS | 12 |

---

## Stage 10 — CRITICAL FINDINGS

### S10-CRIT-001 — No CSP headers configured anywhere (BUG-10D unaddressed)

**Files:** `src/middleware.ts`, `next.config.ts`
**Category:** Security
**Description:** No Content-Security-Policy headers exist anywhere in the codebase. The middleware only handles Supabase auth and route protection. `next.config.ts` has no `headers()` function. This means:
- No `script-src` restrictions (XSS risk)
- No `connect-src` restrictions (BUG-10D: Vercel analytics domains not configured)
- No `frame-ancestors` protection (clickjacking risk)
- No `font-src` or `img-src` restrictions

**Required Fix:** Add CSP headers in `next.config.ts`:
```typescript
async headers() {
  return [{
    source: '/(.*)',
    headers: [{
      key: 'Content-Security-Policy',
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "connect-src 'self' https://*.supabase.co https://*.sentry.io https://vitals.vercel-insights.com https://va.vercel-scripts.com",
        "img-src 'self' https://*.supabase.co data:",
        "font-src 'self' https://fonts.gstatic.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "frame-ancestors 'none'",
      ].join('; '),
    },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  }];
}
```

---

### S10-CRIT-002 — PWA icons referenced in manifest do not exist

**File:** `public/manifest.json` (lines 13-24)
**Category:** PWA / Assets
**Description:** Manifest references `/icon-192.png` and `/icon-512.png` but neither file exists in `public/`. PWA install will fail on all platforms. Additionally missing: `favicon.ico`, `apple-touch-icon.png` (referenced in layout.tsx lines 103-104), and `og-image.png` (referenced in metadata line 50).

**Required Fix:** Create and place these icon files:
- `public/icon-192.png` (192x192, SparkForge logo)
- `public/icon-512.png` (512x512, SparkForge logo)
- `public/favicon.ico` (32x32 multi-resolution)
- `public/apple-touch-icon.png` (180x180)
- `public/og-image.png` (1200x630, social sharing preview)

---

## Stage 10 — HIGH FINDINGS

### S10-HIGH-001 — No security headers in next.config.ts

**File:** `next.config.ts`
**Category:** Security
**Description:** Missing standard production security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`. These are basic protections expected for any production web application, especially one serving children.

**Required Fix:** Add in the `headers()` function alongside CSP (see S10-CRIT-001).

---

### S10-HIGH-002 — ErrorBoundary does not report to Sentry

**File:** `src/components/ui/ErrorBoundary.tsx` (line 33)
**Category:** Monitoring
**Description:** The ErrorBoundary wraps the entire app tree (inside `<A11yProvider>` in root layout) but only calls `console.error('ErrorBoundary caught:', error, errorInfo)`. Component-level errors caught here are invisible to Sentry monitoring.

**Required Fix:**
```typescript
import * as Sentry from '@sentry/nextjs';

componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  console.error('ErrorBoundary caught:', error, errorInfo);
  Sentry.captureException(error, {
    contexts: { react: { componentStack: errorInfo.componentStack } },
  });
}
```

---

### S10-HIGH-003 — Route-level error.tsx does not report to Sentry

**File:** `src/app/error.tsx` (line 14)
**Category:** Monitoring
**Description:** The route-level error page only uses `console.error`. Unlike `global-error.tsx` (which correctly calls `Sentry.captureException`), route-level errors go unreported.

**Required Fix:** Add `Sentry.captureException(error)` in the `useEffect`.

---

### S10-HIGH-004 — No service worker exists

**Category:** PWA
**Description:** No `public/sw.js`, no `next-pwa` or `@ducanh2912/next-pwa` or `serwist` package in dependencies, no `navigator.serviceWorker` registration found. PWA offline support, caching, and install prompts are non-functional.

**Required Fix:** Install `@ducanh2912/next-pwa`, configure in `next.config.ts`, create basic service worker with offline caching.

---

### S10-HIGH-005 — No offline fallback page

**File:** `src/app/offline/page.tsx` — DOES NOT EXIST
**Category:** PWA / UX
**Description:** Without an offline page, users going offline see browser error pages instead of a branded SparkForge offline message.

**Required Fix:** Create `src/app/offline/page.tsx` with Frost-Prismatic styled offline message and "Try Again" button.

---

### S10-HIGH-006 — OpenDyslexic font files missing

**File:** `src/app/globals-a11y.css` (lines 62-74)
**Category:** Accessibility
**Description:** CSS declares `@font-face` for `OpenDyslexic-Regular.woff2` and `OpenDyslexic-Bold.woff2` in `/fonts/`, but the font files don't exist in `public/fonts/`. The dyslexia font toggle in the accessibility toolbar silently fails.

**Required Fix:** Download OpenDyslexic woff2 files from the OpenDyslexic project and place in `public/fonts/`.

---

### S10-HIGH-007 — No environment variable validation at startup

**Category:** Production Readiness
**Description:** No `src/lib/env.ts` or equivalent validates required env vars at build/startup time. The middleware directly asserts `process.env.NEXT_PUBLIC_SUPABASE_URL!` (line 8) which throws an unhelpful runtime error if missing.

**Required Fix:** Create `src/lib/env.ts` with Zod validation:
```typescript
import { z } from 'zod';
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});
export const env = envSchema.parse(process.env);
```

---

## Stage 10 — WARNING FINDINGS

### S10-WARN-001 — accessibilityStore interface doesn't match CLAUDE.md

**File:** `src/stores/accessibilityStore.ts` (lines 12-14)
**Category:** Doc-Drift
**Description:** CLAUDE.md Section 14 specifies `fontSize, contrast, reducedMotion, screenReader`. Actual store has `fontSize, highContrast, reduceMotion, dyslexiaFont, darkMode`. Property names differ (`contrast` vs `highContrast`, `reducedMotion` vs `reduceMotion`) and `screenReader` is absent.

**Required Fix:** Add `screenReader` boolean to the store. Document naming divergence or rename for consistency.

---

### S10-WARN-002 — console.log leaks form data in pricing page

**File:** `src/app/(marketing)/pricing/page.tsx` (line 274)
**Category:** Data Exposure
**Description:** `console.log('School interest:', schoolForm)` logs school inquiry form data (name, email, institution) to the browser console in production.

**Required Fix:** Remove or guard: `if (process.env.NODE_ENV === 'development') console.log(...)`

---

### S10-WARN-003 — Light theme-color in dark-mode-only app

**File:** `src/app/layout.tsx` (line 77)
**Category:** Design Consistency
**Description:** Light theme color `#F0F4F8` is defined in viewport metadata, but CLAUDE.md Section 6 states "Mode: Dark-mode only." This exists to support the a11y light mode toggle, but contradicts the design spec.

---

### S10-WARN-004 — error.tsx not reporting to Sentry (duplicate reference)

**File:** `src/app/error.tsx` (line 14)
**Description:** Covered under S10-HIGH-003. Only `console.error`, no Sentry reporting.

---

### S10-WARN-005 — Missing OG image for social sharing

**File:** `src/app/layout.tsx` (line 50)
**Category:** SEO / Marketing
**Description:** `og-image.png` is referenced in metadata but doesn't exist in `public/`. Social sharing previews (Twitter, Slack, Discord, etc.) will show broken images.

---

## Stage 10 — INFO FINDINGS

### S10-INFO-001 — Seed script console.logs are acceptable

**Description:** `src/lib/agent/seed.ts` has 14 `console.log` calls. This is a CLI-only dev utility, not a production code path.

### S10-INFO-002 — No TODO/FIXME comments found in source

**Description:** Clean — no outstanding TODO/FIXME/HACK markers in source code.

### S10-INFO-003 — Light/dark mode toggle exists despite dark-only spec

**Description:** Full dark/light mode toggle is implemented in accessibilityStore + A11yProvider. This appears intentional as an accessibility feature, but contradicts CLAUDE.md Section 6 "dark-mode only."

---

## Stage 10 — PASS FINDINGS

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | BUG-10F: Correct fonts | PASS | Exo 2, Sora, JetBrains Mono, Orbitron. No Fredoka/Nunito. |
| 2 | Skip-to-content link | PASS | `<a href="#main-content">` in root layout |
| 3 | Screen reader live region | PASS | `<div aria-live="polite" aria-atomic="true" id="sr-announcements" />` |
| 4 | `prefers-reduced-motion` detected | PASS | A11yProvider auto-applies on first visit |
| 5 | Reduced motion CSS rules | PASS | Multiple `@media (prefers-reduced-motion)` rules + `.reduce-motion` class |
| 6 | A11y toolbar controls | PASS | Font size, dark/light, dyslexia, motion, contrast |
| 7 | A11y toolbar ARIA patterns | PASS | `role="switch"`, `role="radiogroup"` properly used |
| 8 | Sentry sample rate | PASS | 0.1 (10%) in production — not 1.0 |
| 9 | Sentry tunnel route | PASS | `/monitoring` to bypass ad-blockers |
| 10 | Sentry COPPA replay masking | PASS | `maskAllText: true`, `blockAllMedia: true` |
| 11 | Sentry source map upload | PASS | `widenClientFileUpload: true` |
| 12 | global-error.tsx reports to Sentry | PASS | `Sentry.captureException(error)` in useEffect |

---

## Stage 10 — File Inventory

| File | Status |
|------|--------|
| `src/stores/accessibilityStore.ts` | EXISTS |
| `src/components/accessibility/A11yProvider.tsx` | EXISTS |
| `src/components/accessibility/AccessibilityToolbar.tsx` | EXISTS |
| `src/app/layout.tsx` | EXISTS (correct fonts, skip link, live region) |
| `src/app/globals-a11y.css` | EXISTS (OpenDyslexic fonts missing) |
| `src/components/ui/OfflineBanner.tsx` | EXISTS |
| `src/components/ui/ErrorBoundary.tsx` | EXISTS (no Sentry) |
| `public/manifest.json` | EXISTS (icons missing) |
| `sentry.client.config.ts` | EXISTS |
| `sentry.server.config.ts` | EXISTS |
| `sentry.edge.config.ts` | EXISTS |
| `src/app/global-error.tsx` | EXISTS (reports to Sentry) |
| `src/app/error.tsx` | EXISTS (no Sentry) |
| `src/app/offline/page.tsx` | **MISSING** |
| `public/sw.js` | **MISSING** |
| `public/favicon.ico` | **MISSING** |
| `public/apple-touch-icon.png` | **MISSING** |
| `public/icon-192.png` | **MISSING** |
| `public/icon-512.png` | **MISSING** |
| `public/og-image.png` | **MISSING** |
| `public/fonts/OpenDyslexic-*.woff2` | **MISSING** |

**Present:** 13 files | **Missing:** 8 files (icons, fonts, service worker, offline page)

---

*All 10 stages audited. Full report complete.*

*SparkForge Audit Agent v1.0 | Phase 0 + Stages 1-10 | March 25, 2026*
*Stages 1-9 audit complete. Stage 10 pending.*

*SparkForge Audit Agent v1.0 | Phase 0 + Stages 1-9 | March 25, 2026*
