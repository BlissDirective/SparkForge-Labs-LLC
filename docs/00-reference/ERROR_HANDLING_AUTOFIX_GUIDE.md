# SparkForge — Error Handling & Auto-Fix Guide

**Extracted from:** CLAUDE.md v5.5 Section 10
**Date:** March 17, 2026

When a build or typecheck fails, use these categories to attempt auto-fix before escalating.

---

## TypeScript Errors

| Pattern | Likely Cause | Auto-Fix |
|---------|-------------|----------|
| `Cannot find module '@/...'` | Missing file from earlier stage | Check if file exists. If not, check stage doc. Create if missing. |
| `Type 'X' is not assignable to 'Y'` | Interface mismatch | Check `types/index.ts`. Match the interface definition. |
| `Property 'X' does not exist on type 'Y'` | Store or type incomplete | Check if store/type was updated in a later part of same stage. |
| `Module has no exported member 'X'` | Named export missing | Check the source file. Add missing export. |

## Import Errors

| Pattern | Likely Cause | Auto-Fix |
|---------|-------------|----------|
| `Module not found: Can't resolve 'X'` | Package not installed | Run `npm install X`. Check stage doc for exact package. |
| `Can't resolve '@/components/...'` | File not yet created | Check if it's in a later part of current stage. Create placeholder if blocking. |
| `Dynamic import error (ssr: false)` | 3D component not in correct path | Ensure file is in `src/components/3d/` and uses correct export. |

## Build Errors

| Pattern | Likely Cause | Auto-Fix |
|---------|-------------|----------|
| `next build` fails with "page" errors | Missing `export default` | Ensure every page.tsx has a default export. |
| `next build` fails with CSS errors | Tailwind class not defined | Check `tailwind.config.ts` for custom class definitions. |
| ESLint errors blocking build | Strict rules | Fix or add `// eslint-disable-next-line` with specific rule. |

## Runtime Errors (Non-Blocking)

| Pattern | Action |
|---------|--------|
| Hydration mismatch | Check for `useEffect`-only state. Add `suppressHydrationWarning` if needed. |
| 3D component crash on server | Ensure `ssr: false` in dynamic import. |
| Supabase connection error | Check `.env.local` values. |

## Escalation

**After 2 failed auto-fix attempts → Escalate to HARD STOP (HS-6).**
