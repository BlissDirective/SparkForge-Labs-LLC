# SPARKFORGE — STAGE 2: DATABASE & API LAYER v2 (PART 4 of 4)

**Date:** February 21, 2026 | **Version:** Frost-Prismatic v2.1

## PART 4 (2D) COVERS:

- QueryProvider (React Query client setup)
- api.ts fetch wrapper (frontend → API bridge)
- useApi.ts placeholder hooks (v2: WARNING + stubs only)
- Build verification + git commit

## v2 CHANGES IN THIS PART:

- **[BUG-1]** `useApi.ts` has prominent WARNING: "Stage 4 REPLACES this file" — Hooks reduced to stubs that only invalidate queries. This prevents confusion about which hooks are authoritative.
- QueryProvider and api.ts are unchanged from v1 (already solid)

## PREREQUISITES: Parts 1-3 complete

**WHAT ARE REACT QUERY HOOKS?** React Query manages data fetching in React. Instead of writing `fetch()` calls in every component, we define reusable "hooks" that handle loading, caching, error states, and refetching. Components just call `useChildren()` or `useContent()` and React Query handles the rest.

---

## STEP 1: INSTALL REACT QUERY DEVTOOLS (optional but helpful)

```bash
npm install @tanstack/react-query-devtools
```

---

## STEP 2: QUERY CLIENT PROVIDER

**WHAT THIS DOES:** Wraps the app in a React Query provider so all components can use the query hooks. Also includes the devtools overlay.

**WHERE:** Create `src/components/providers/QueryProvider.tsx`

### File: `src/components/providers/QueryProvider.tsx`

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,      // Data is "fresh" for 5 minutes
            gcTime: 30 * 60 * 1000,         // Cache kept for 30 minutes
            retry: 1,                        // Retry failed requests once
            refetchOnWindowFocus: false,     // Don't refetch on tab switch
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

## STEP 3: API FETCH HELPER

**WHAT THIS DOES:** A small wrapper around `fetch()` that handles JSON parsing, error extraction, and base URL construction. All hooks use this instead of raw `fetch()`.

**WHERE:** Create `src/lib/api.ts`

### File: `src/lib/api.ts`

```typescript
// ════════════════════════════════════════════════════
// STANDARDIZED API FETCH WRAPPER
// All React Query hooks use this to call our API routes.
// ════════════════════════════════════════════════════

const BASE = ''; // Same origin — no need for full URL

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: string[];
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: string[];

  constructor(message: string, code: string, status: number, details?: string[]) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || !json.success) {
    throw new ApiError(
      json.error || 'Something went wrong',
      json.code || 'UNKNOWN',
      res.status,
      json.details
    );
  }

  return json.data as T;
}

// Convenience methods
export const api = {
  get: <T>(path: string) => apiFetch<T>(path),

  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(path: string) =>
    apiFetch<T>(path, { method: 'DELETE' }),
};
```

---

## STEP 4: REACT QUERY HOOKS (v2: PLACEHOLDER STUBS)

**WHAT THIS DOES:** Provides basic hooks so that Stage 2 compiles and Stage 3 can reference them. These are INTENTIONALLY minimal.

**v2 [BUG-1]: CRITICAL WARNING ADDED** — Stage 4 (Core Pages) REPLACES this entire file with 4 specialized hook files:
- `src/hooks/useChildren.ts`
- `src/hooks/useContent.ts`
- `src/hooks/useProgress.ts`
- `src/hooks/useGamification.ts`

The hooks below are stubs. Do NOT build features against them. They exist only so the build passes after Stage 2.

**WHERE:** Create `src/hooks/useApi.ts`

### File: `src/hooks/useApi.ts`

```typescript
// ════════════════════════════════════════════════════
// WARNING: THIS FILE IS A PLACEHOLDER
// ════════════════════════════════════════════════════
//
// Stage 4 (Core Pages) REPLACES this entire file with 4 specialized
// hook files that provide full functionality:
//
//   src/hooks/useChildren.ts     — CRUD for child profiles
//   src/hooks/useContent.ts      — Content fetching + daily challenge
//   src/hooks/useProgress.ts     — Progress tracking + lab completion
//   src/hooks/useGamification.ts — XP, streaks, badges, combined flow
//
// DO NOT build features against these stubs.
// They exist only so the project compiles after Stage 2.
//
// After completing Stage 4, DELETE this file:
//   Remove-Item -Path "src/hooks/useApi.ts" -ErrorAction SilentlyContinue
//
// ════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Child, Content, Badge } from '@/types';

// ═══ QUERY KEYS ═══

export const queryKeys = {
  me: ['me'] as const,
  children: ['children'] as const,
  child: (id: string) => ['children', id] as const,
  content: (filters?: Record<string, unknown>) => ['content', filters] as const,
  contentBySlug: (slug: string) => ['content', 'slug', slug] as const,
  progress: (childId: string) => ['progress', childId] as const,
  labProgress: (childId: string, world: number) => ['progress', childId, 'lab', world] as const,
  allLabsProgress: (childId: string) => ['progress', childId, 'all-labs'] as const,
  badges: (childId: string) => ['badges', childId] as const,
};

// ═══ AUTH HOOK (stub) ═══

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.get<{ id: string; email: string; subscriptionTier: string }>('/api/auth/me'),
  });
}

// ═══ CHILDREN HOOKS (stubs) ═══

export function useChildren() {
  return useQuery({
    queryKey: queryKeys.children,
    queryFn: () => api.get<Child[]>('/api/children'),
  });
}

export function useCreateChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { displayName: string; ageBand: string }) =>
      api.post<Child>('/api/children', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.children }),
  });
}

// ═══ CONTENT HOOKS (stubs) ═══

export function useContent(filters?: { world?: number; ageBand?: string; type?: string }) {
  const params = new URLSearchParams();
  if (filters?.world) params.set('world', String(filters.world));
  if (filters?.ageBand) params.set('ageBand', filters.ageBand);
  if (filters?.type) params.set('type', filters.type);
  const qs = params.toString();

  return useQuery({
    queryKey: queryKeys.content(filters),
    queryFn: () => api.get<Content[]>(`/api/content${qs ? `?${qs}` : ''}`),
  });
}

// ═══ PROGRESS HOOKS (stubs) ═══

export function useProgress(childId: string) {
  return useQuery({
    queryKey: queryKeys.progress(childId),
    queryFn: () => api.get(`/api/progress?childId=${childId}`),
    enabled: !!childId,
  });
}

// v2 [BUG-3]: All-labs progress stub (calls new bulk endpoint)
export function useAllLabsProgress(childId: string) {
  return useQuery({
    queryKey: queryKeys.allLabsProgress(childId),
    queryFn: () => api.get<Array<{
      labId: number; totalItems: number; completedItems: number; percent: number;
    }>>(`/api/progress/all-labs?childId=${childId}`),
    enabled: !!childId,
  });
}

// ═══ GAMIFICATION HOOKS (stubs) ═══

export function useAwardXP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { childId: string; amount: number; source: string }) =>
      api.post('/api/gamification/xp', data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.child(variables.childId) });
      qc.invalidateQueries({ queryKey: queryKeys.children });
    },
  });
}

export function useUpdateStreak() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (childId: string) =>
      api.post('/api/gamification/streak', { childId }),
    onSuccess: (_, childId) => {
      qc.invalidateQueries({ queryKey: queryKeys.child(childId) });
    },
  });
}

export function useBadges(childId: string) {
  return useQuery({
    queryKey: queryKeys.badges(childId),
    queryFn: () => api.get<(Badge & { earned: boolean; earnedAt: string | null })[]>(
      `/api/gamification/badges?childId=${childId}`
    ),
    enabled: !!childId,
  });
}

export function useCheckBadges() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (childId: string) =>
      api.post<{ newBadges: Badge[]; totalEarned: number }>(
        '/api/gamification/badges', { childId }
      ),
    onSuccess: (_, childId) => {
      qc.invalidateQueries({ queryKey: queryKeys.badges(childId) });
    },
  });
}

// ═══ STRIPE HOOKS (stubs) ═══

export function useCheckout() {
  return useMutation({
    mutationFn: (data: { tier: 'plus' | 'forge'; interval?: 'month' | 'year' }) =>
      api.post<{ url: string }>('/api/stripe/checkout', data),
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });
}

export function usePortal() {
  return useMutation({
    mutationFn: () => api.post<{ url: string }>('/api/stripe/portal', {}),
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });
}

// ═══ PROMPT LAB HOOK (stub) ═══

export function usePromptLab() {
  return useMutation({
    mutationFn: (data: { childId: string; prompt: string; temperature?: number; ageBand: string }) =>
      api.post<{ reply: string; promptsRemaining: number }>('/api/ai/prompt-lab', data),
  });
}
```

---

## STEP 5: VERIFY ROOT LAYOUT HAS QUERYPROVIDER

**WHAT THIS DOES:** Confirms the root layout (created in Stage 1 v2 Part 2, Step 18) wraps children in QueryProvider. Stage 1 v2 already includes this.

**CHECK:** Open `src/app/layout.tsx` and verify it contains:

```tsx
<QueryProvider>
  <AuthProvider>
    {children}
  </AuthProvider>
</QueryProvider>
```

If your Stage 1 v2 is complete, this is already in place. No changes needed.

---

## STEP 6: BUILD VERIFICATION

```bash
npm run build
```

This should complete with 0 errors. Common issues and fixes:

| Issue | Fix |
|-------|-----|
| `Cannot find module '@/lib/api'` | Ensure `src/lib/api.ts` was created in Step 3 |
| `Cannot find module '@/types'` | Ensure `src/types/index.ts` exists from Stage 1 |
| `Cannot find module '@tanstack/react-query'` | `npm install @tanstack/react-query @tanstack/react-query-devtools` |
| `Module not found: '@/lib/supabase/server'` | Ensure Stage 1 files exist (`src/lib/supabase/server.ts`) |
| Types not matching in useApi.ts | Expected — stubs use simplified types. Stage 4 replaces the file with full types. |

---

## STEP 7: GIT COMMIT

```bash
git add .
git commit -m "Stage 2: Database schema, API routes, React Query hooks, seed data"
```

Optional: push to GitHub

```bash
git push
```

---

## STAGE 2 v2 COMPLETE — WHAT YOU NOW HAVE

### DATABASE (Supabase):
- 9 tables with constraints and relationships
- 14 performance indexes
- Full RLS on every table
- 3 auto-update triggers + daily/weekly reset functions
- Lab progress calculation function
- 68 badge definitions (Lab terminology)
- 6 starter content items (Labs 1-3)
- COPPA-compliant prompt history cleanup
- v2: `parents.onboarding_complete` column
- v2: Clarified `subscription_status` design decision

### TYPESCRIPT FILES (20 files):
- **`src/lib/validations.ts`** — 20 Zod schemas + auto-generated types
  - v2: [CONN-2] `avatarConfig` flexible record in `UpdateChildSchema`
- **`src/lib/tier-config.ts`** — Subscription tier limits + helpers
- **`src/lib/rate-limit.ts`** — In-memory rate limiter (4 presets)
- **`src/lib/api-helpers.ts`** — Auth middleware + response helpers
  - v2: [ENH] Typed `ERROR_CODES` constants
  - v2: [NEW-2B] `checkDuplicate()` request deduplication
- **`src/lib/api.ts`** — Fetch wrapper for frontend

### API ROUTES (16 files):
- **Auth:** signup (rate limited), login (rate limited), logout, me
- **Children:** list/create, get/update/delete
- **Content:** filtered list (cached 5min), single by slug
- **Progress:** list/create, lab progress, all-labs bulk (NEW)
- **Gamification:** XP (with dedup), streak, badges (14 criteria types)
- **AI:** Prompt Lab (moderated, rate-limited, age-appropriate)
- **Stripe:** checkout, portal, webhook (4 event types)
- **Sessions:** start/end with duration tracking
- **Health:** status check (NEW)

### HOOKS + PROVIDERS (2 files):
- **`src/components/providers/QueryProvider.tsx`** — React Query provider
- **`src/hooks/useApi.ts`** — PLACEHOLDER stubs (Stage 4 replaces)
  - v2: [BUG-1] Prominent WARNING comment added

### v2 CHANGE SUMMARY ACROSS ALL 4 PARTS:
- **[BUG-1]** `useApi.ts` WARNING: Stage 4 replaces this file
- **[BUG-3]** `/api/progress/all-labs`: 10 labs in 1 API call
- **[BUG-6]** Badge checker: 14 criteria types (was ~4 in v1)
- **[BUG-7]** `subscription_status` default clarified with comment
- **[CONN-2]** `UpdateChildSchema` flexible `avatarConfig`
- **[IMP-3]** Rate limiting on `auth/signup` + `auth/login`
- **[ENH]** Typed `ERROR_CODES` in api-helpers
- **[ENH]** Cache-Control: content (5min), badges (1hr)
- **[NEW-2B]** Request deduplication middleware
- **[NEW-2C]** `/api/health` endpoint
- **[NEW-3A]** `parents.onboarding_complete` column

### TOTAL FILES IN PROJECT AFTER STAGE 2 v2: ~38
### TOTAL NPM PACKAGES: 40+

---

## NEXT UP: STAGE 3 v2 — AUTH FLOW & APP SHELL

In Stage 3 v2 you'll build:
- AuthProvider with session management
- Login/signup pages with COPPA consent
- Shared UI components (buttons, cards, modals, inputs)
- Dashboard layout (sidebar + top bar)
- v2: Onboarding wizard (behind feature flag)
- v2: Animated sidebar with gradient active bar
- v2: PageTransitionProvider for route transitions
- v2: useSessionTracker for automatic session logging
