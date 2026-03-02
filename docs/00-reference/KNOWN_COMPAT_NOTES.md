# SparkForge — Known Compatibility Notes

**Purpose:** Flags version-sensitive packages and API surfaces that may require adjustment depending on install date. Stage documents contain code patterns targeting specific library APIs — this file tracks where those patterns are fragile.

**Last Updated:** 2026-03-02

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

## General Guidance

1. **When installing fresh:** Run `npm install` then immediately check `npx tsc --noEmit` before writing any code. Fix version mismatches early.
2. **When a stage doc's code doesn't compile:** Check this file first — the fix may already be documented.
3. **Pin versions in `package.json`** after a successful Stage 1 build to avoid drift on reinstall.
4. **After any `npm update`:** Re-run `npm run build` to catch API surface changes.
