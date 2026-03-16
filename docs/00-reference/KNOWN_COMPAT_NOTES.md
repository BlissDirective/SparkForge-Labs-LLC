# SparkForge — Known Compatibility Notes

**Purpose:** Flags version-sensitive packages and API surfaces that may require adjustment depending on install date. Stage documents contain code patterns targeting specific library APIs — this file tracks where those patterns are fragile.

**Last Updated:** 2026-03-15

---

## Version-Sensitive Packages

### 1. Zod (Validation Library)

| Item | Detail |
|------|--------|
| **Stage docs assume** | Zod v3 API (`z.literal(value, { errorMap })`, `ZodError.errors`) |
| **Risk** | `npm install zod` may pull v4+, which has breaking changes |
| **Breaking changes in v4** | `ZodError.errors` → `ZodError.issues`; `errorMap` option removed from `z.literal()`; `ZodSchema` import path changed |
| **Fix** | Pin to v3: `npm install zod@3` |
| **Files affected** | `src/lib/validations.ts`, `src/lib/api-helpers.ts` (apiValidationError) |
| **Stages affected** | 2 (validations created), all subsequent stages that use Zod schemas |

### 2. Stripe (Payment Processing)

| Item | Detail |
|------|--------|
| **Stage docs assume** | `apiVersion: '2024-12-18.acacia'` |
| **Risk** | Stripe SDK version determines the required `apiVersion` string — it changes with every major SDK release |
| **How to find correct version** | Check `node_modules/stripe/types/apiVersion.d.ts` → `export const ApiVersion = '...'` |
| **Fix** | Update the `apiVersion` string in all Stripe route files to match installed SDK |
| **Files affected** | `src/app/api/stripe/checkout/route.ts`, `src/app/api/stripe/portal/route.ts`, `src/app/api/stripe/webhook/route.ts` |
| **Stages affected** | 8 (Stripe routes created) |

### 3. Supabase Auth (`@supabase/supabase-js` + `@supabase/ssr`)

| Item | Detail |
|------|--------|
| **Stage docs assume** | `supabase.auth.admin.generateLink({ type: 'signup', email })` |
| **Risk** | Newer versions of `@supabase/supabase-js` require `password` in `GenerateSignupLinkParams` |
| **Fix** | Add `password` field to `generateLink` call |
| **Files affected** | `src/app/api/auth/signup/route.ts` |
| **Stages affected** | 3 (auth routes created) |

### 4. @tanstack/react-query

| Item | Detail |
|------|--------|
| **Stage docs assume** | `@tanstack/react-query` (core only in Stage 1 install) |
| **Note** | `@tanstack/react-query-devtools` is used by `QueryProvider.tsx` but not listed in Stage 1 install commands |
| **Fix** | Install separately: `npm install @tanstack/react-query-devtools` |
| **Files affected** | `src/components/providers/QueryProvider.tsx` |
| **Stages affected** | 1 Part 2 (QueryProvider created) or 3 (layout wired) |

---

## ESLint Configuration

| Item | Detail |
|------|--------|
| **Issue** | Default `next/typescript` ESLint config does not recognize `_`-prefixed variables as intentionally unused |
| **Fix** | Added to `.eslintrc.json`: `@typescript-eslint/no-unused-vars` rule with `argsIgnorePattern: "^_"`, `varsIgnorePattern: "^_"`, `destructuredArrayIgnorePattern: "^_"` |
| **Why** | Next.js API route handlers require a `req` parameter by convention even when unused (e.g., `GET` handlers). Underscore prefix is the standard TypeScript convention for intentionally unused params. |

---

### 5. Motion (formerly Framer Motion)

| Item | Detail |
|------|--------|
| **Stage docs assume** | `motion` package with `from 'motion/react'` imports |
| **Risk** | Old `framer-motion` package also exists — do NOT install `framer-motion` |
| **Breaking changes** | Import path changed: `from 'framer-motion'` → `from 'motion/react'`. Package name: `framer-motion` → `motion`. API is identical. |
| **Fix** | Install `motion` (not `framer-motion`): `npm install motion` |
| **Files affected** | All components using `motion`, `AnimatePresence`, `useAnimation`, `useMotionValue` |
| **Stages affected** | All stages (3+) that use animation |

### 6. @nivo (Charts — replaces recharts)

| Item | Detail |
|------|--------|
| **Stage docs assume** | `@nivo/core`, `@nivo/line`, `@nivo/bar`, `@nivo/radar` |
| **Risk** | Old stage docs may reference `recharts` — these have been updated |
| **Data format** | Nivo uses `{ id, data: [{ x, y }] }` format vs recharts' flat array |
| **Fix** | Install all required nivo packages: `npm install @nivo/core @nivo/line @nivo/bar @nivo/radar` |
| **Files affected** | Parent dashboard charts, progress visualizations |
| **Stages affected** | 8 (parent dashboard) |

### 7. Next.js 15 (Framework)

| Item | Detail |
|------|--------|
| **Stage docs assume** | Next.js 15 with React 19, Turbopack stable, `next.config.ts` (TypeScript) |
| **Key changes from 14** | `serverExternalPackages` replaces `experimental.serverComponentsExternalPackages`; `next.config.ts` replaces `.js`; Turbopack is default dev bundler; `useSearchParams()` requires Suspense boundary |
| **Fix** | Use `npx create-next-app@15` and `next.config.ts` format |
| **Files affected** | `next.config.ts`, all API routes, layouts |
| **Stages affected** | 1 (foundation), 10 (production config) |

### 8. Tailwind CSS 4

| Item | Detail |
|------|--------|
| **Stage docs assume** | Tailwind CSS 4 with Oxide engine |
| **Key changes from 3** | 10x faster builds, CSS-first config supported (JS config still works), native container queries, `@starting-style` for entry animations |
| **Fix** | `npm install tailwindcss@4` — JS `tailwind.config.ts` remains compatible |
| **Files affected** | `tailwind.config.ts`, `postcss.config.js`, `globals.css` |
| **Stages affected** | 1 (foundation) |

### 9. Sentry (@sentry/nextjs)

| Item | Detail |
|------|--------|
| **Stage docs assume** | `@sentry/nextjs` wrapping `next.config.ts` via `withSentryConfig` |
| **Risk** | Build will fail if Sentry env vars are missing in production |
| **Fix** | Set `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` in `.env.local` |
| **Files affected** | `next.config.ts`, `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` |
| **Stages affected** | 1 Part 2 (config created), all stages (error tracking active) |

### 10. Jotai (Fine-grained 3D state)

| Item | Detail |
|------|--------|
| **Stage docs assume** | Jotai atoms for 3D shader uniforms, particle counts, camera state, LOD |
| **Note** | Jotai is used alongside Zustand — Zustand for coarse app state, Jotai for fine-grained 3D state that updates at high frequency |
| **Fix** | `npm install jotai` |
| **Files affected** | `src/stores/atoms.ts`, 3D components |
| **Stages affected** | 1 Part 2 (atoms created), 3+ (3D components consume atoms) |

### 11. Hero Animation v2.0 — TSL & WebGPU Notes (March 2026)

| Item | Detail |
|------|--------|
| **Three.js r171+ / TSL Migration** | Three.js r171+ introduces `import * as THREE from 'three/webgpu'` for zero-config WebGPU. TSL (Three Shader Language) imports from `'three/tsl'` — replaces raw WGSL/GLSL shader authoring. |
| **ShaderMaterial deprecation** | `ShaderMaterial`, `RawShaderMaterial`, and `onBeforeCompile()` are NOT supported in `WebGPURenderer`. All custom materials must use TSL node materials (e.g., `MeshStandardNodeMaterial`). Standard materials (`MeshStandardMaterial`, `MeshPhysicalMaterial`) work unchanged. |
| **R3F v9 async GL prop** | R3F v9's `Canvas` accepts an async `gl` prop (required for `WebGPURenderer.init()`). Usage: `gl={async (canvas) => { const r = new WebGPURenderer({canvas}); await r.init(); return r; }}`. R3F v9 also requires `extend(THREE)` to register WebGPU elements. |
| **WebGPU browser coverage** | Chrome 113+, Edge 113+, Safari 26+: ~90% stable. Firefox: behind flag (Nightly), ~5% — auto-falls back to WebGL2 via TSL. Legacy: ~5% — CSS fallback (12-15 DOM particles). |
| **New packages** | `three-bvh-csg` (Voronoi fracture mesh operations), `three-mesh-bvh` (BVH acceleration for shard collision), `troika-three-text` (high-quality SDF-based 3D text geometry) |
| **Files affected** | `src/components/3d/HeroAnimation.tsx`, `src/lib/3d/heroParticleCompute.ts`, `src/lib/3d/heroParticleRender.ts`, `src/lib/webgpuDetection.ts`, `src/stores/deviceStore.ts` (GPUTier) |
| **Stages affected** | 1 Part 2 (deviceStore, webgpuDetection), 3 Part 3A/B (HeroAnimation) |

---

## General Guidance

1. **When installing fresh:** Run `npm install` then immediately check `npx tsc --noEmit` before writing any code. Fix version mismatches early.
2. **When a stage doc's code doesn't compile:** Check this file first — the fix may already be documented.
3. **Pin versions in `package.json`** after a successful Stage 1 build to avoid drift on reinstall.
4. **After any `npm update`:** Re-run `npm run build` to catch API surface changes.
5. **Motion imports:** All animation imports use `from 'motion/react'` — NOT `from 'framer-motion'`.
6. **Chart library:** All visualization uses `@nivo/*` packages — NOT `recharts`.
