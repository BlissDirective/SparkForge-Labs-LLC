# SPARKFORGE — STAGE 4: CORE PAGES v2 (PART 1 of 3)

**Date:** February 22, 2026 | **Version:** Frost-Prismatic v2.1
**Code-Reviewed:** March 3, 2026 — All bugs fixed, build-verified

---

> **NOTE (April 3, 2026):** Dashboard pages created in this document have been converted to thin scene descriptors by the 3D UI Migration (Phase 2). Each page now calls `useCockpitScene()` to set the cockpit mode and delegates rendering to 3D panel components (DashboardCenter, LabsCenter, ArcadePanel, ProfileCenter, SettingsPanel, ParentPanel) in `src/components/3d/panels/`. The HTML content described here has been replaced by 3D panel architecture (~861 lines HTML removed). The route structure and data hooks remain valid.

## PART 1 (4A) COVERS

- React Query hooks for children, content, progress, gamification
- These hooks connect frontend pages to the Stage 2 API routes
- Every page uses these instead of calling fetch directly

## v2 CHANGES IN THIS PART

| Tag | Change |
|-----|--------|
| `[ENH]` | `useGamification`: Optimistic updates for `useAwardXP` + `useUpdateStreak` |
| `[ENH]` | `useGamification`: React Query `onMutate`/`onError`/`onSettled` pattern |
| `[NEW-2D]` | `useGamification`: Streak recovery toast via `useToastStore` |
| `[BUG-3]` | `useProgress`: `useAllLabsProgress` uses `/api/progress/all-labs` (single API call instead of 10 parallel calls) |
| `[ENH]` | `useProgress`: staleTime 2min for lab progress |
| `[ENH]` | `useContent`: staleTime 10min for lab content, 30min for slug |

## PREREQUISITES

- Stages 1–3 v2 complete

## TERMINOLOGY NOTE

- Hook names use "Lab" (user-facing): `useLabContent`, `useLabProgress`
- API query params still use "world" (DB column): `?world=1`
- The `WORLDS` constant from types is still used internally
- Users never see "world" — only "Lab"

## NOTE ON EXISTING HOOKS

Stage 2 Part 4 created `src/hooks/useApi.ts` with basic stub hooks. This Stage **REPLACES** that file with 4 specialized hook files. Delete `useApi.ts` after creating these files.

---

## STEP 1: CREATE FOLDERS

```bash
mkdir -p src/hooks
mkdir -p src/components/content
mkdir -p "src/app/(dashboard)/labs/[labId]"
mkdir -p "src/app/(dashboard)/content/[slug]"
```

---

## STEP 2: CHILDREN HOOKS

CRUD operations for child profiles.

- `useChildren()` — list all children
- `useCreateChild()` — create + auto-select
- `useUpdateChild()` — update profile
- `useDeleteChild()` — delete profile

### File: `src/hooks/useChildren.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useChildStore } from '@/stores/childStore';

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data.data;
}

export function useChildren() {
  return useQuery({
    queryKey: ['children'],
    queryFn: () => apiFetch('/api/children'),
  });
}

export function useCreateChild() {
  const qc = useQueryClient();
  const { setChildren, setActiveChild } = useChildStore();

  return useMutation({
    mutationFn: (body: { displayName: string; ageBand: string; birthYear?: number }) =>
      apiFetch('/api/children', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (newChild) => {
      qc.invalidateQueries({ queryKey: ['children'] });
      const current = useChildStore.getState().children;
      const updated = [...current, newChild];
      setChildren(updated);
      if (updated.length === 1) setActiveChild(newChild);
    },
  });
}

export function useUpdateChild() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ childId, ...body }: { childId: string } & Record<string, unknown>) =>
      apiFetch(`/api/children/${childId}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['children'] }),
  });
}

export function useDeleteChild() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (childId: string) =>
      apiFetch(`/api/children/${childId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['children'] }),
  });
}
```

---

## STEP 3: CONTENT HOOKS (ENHANCED v2)

### v2 CHANGES

- `[ENH]` staleTime: 10min for lab content (content doesn't change often)
- `[ENH]` staleTime: 30min for content by slug (individual items are stable)

### File: `src/hooks/useContent.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import type { Content } from '@/types';

async function apiFetch(url: string) {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data.data;
}

// Fetch all content for a specific lab
// v2 [ENH]: staleTime 10 minutes
export function useLabContent(labNumber: number, ageBand: string) {
  return useQuery({
    queryKey: ['content', 'lab', labNumber, ageBand],
    queryFn: () => apiFetch(`/api/content?world=${labNumber}&ageBand=${ageBand}&limit=50`),
    enabled: !!labNumber && !!ageBand,
    staleTime: 10 * 60 * 1000, // v2 [ENH]: 10 minutes
  });
}

// Fetch single content item by slug
// v2 [ENH]: staleTime 30 minutes
export function useContentBySlug(slug: string) {
  return useQuery({
    queryKey: ['content', 'slug', slug],
    queryFn: () => apiFetch(`/api/content/${slug}`),
    enabled: !!slug,
    staleTime: 30 * 60 * 1000, // v2 [ENH]: 30 minutes
  });
}

// Fetch all content for an age band (no lab filter)
export function useAllContent(ageBand: string) {
  return useQuery({
    queryKey: ['content', 'all', ageBand],
    queryFn: () => apiFetch(`/api/content?ageBand=${ageBand}&limit=50`),
    enabled: !!ageBand,
  });
}

// Daily challenge: picks a semi-random item based on today's date
export function useDailyChallenge(ageBand: string) {
  return useQuery({
    queryKey: ['content', 'daily', ageBand],
    queryFn: () => apiFetch(`/api/content?ageBand=${ageBand}&limit=5`),
    enabled: !!ageBand,
    staleTime: 60 * 60 * 1000, // 1 hour
    select: (data) => {
      const items = (data?.items || []) as Content[];
      if (items.length === 0) return null;
      const dayIndex = new Date().getDate() % items.length;
      return items[dayIndex];
    },
  });
}

// Latest content (prioritizes AI-generated)
export function useLatestContent(ageBand: string) {
  return useQuery({
    queryKey: ['content', 'latest', ageBand],
    queryFn: () => apiFetch(`/api/content?ageBand=${ageBand}&limit=3`),
    enabled: !!ageBand,
    select: (data) => {
      const items = (data?.items || []) as Content[];
      return items.find((i) => i.is_agent_generated) || items[0] || null;
    },
  });
}
```

---

## STEP 4: PROGRESS HOOKS (ENHANCED v2)

### v2 CHANGES

- `[BUG-3]` `useAllLabsProgress` now calls `/api/progress/all-labs` (single API call instead of 10 parallel calls). This is the bulk endpoint created in Stage 2 v2 Part 3.
- `[ENH]` staleTime: 2 minutes for lab progress (allows brief caching)

### File: `src/hooks/useProgress.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data.data;
}

// All progress records for a child
export function useChildProgress(childId: string) {
  return useQuery({
    queryKey: ['progress', childId],
    queryFn: () => apiFetch(`/api/progress?childId=${childId}`),
    enabled: !!childId,
  });
}

// Completion % for a specific lab (uses get_lab_progress DB function)
// v2 [ENH]: staleTime 2 minutes
export function useLabProgress(childId: string, labNumber: number) {
  return useQuery({
    queryKey: ['progress', 'lab', childId, labNumber],
    queryFn: () => apiFetch(`/api/progress/world?childId=${childId}&world=${labNumber}`),
    enabled: !!childId && !!labNumber,
    staleTime: 2 * 60 * 1000, // v2 [ENH]: 2 minutes
  });
}

// v2 [BUG-3]: Single API call for all 10 labs
// Previously: 10 parallel calls to /api/progress/world
// Now: 1 call to /api/progress/all-labs (created in Stage 2 v2)
export function useAllLabsProgress(childId: string) {
  return useQuery({
    queryKey: ['progress', 'all-labs', childId],
    queryFn: () => apiFetch(`/api/progress/all-labs?childId=${childId}`),
    enabled: !!childId,
    staleTime: 2 * 60 * 1000, // v2 [ENH]: 2 minutes
  });
}

// Mark content item as completed
export function useCompleteContent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: { childId: string; contentId: string; score?: number; timeSpentSeconds?: number }) =>
      apiFetch('/api/progress', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['progress', variables.childId] });
      qc.invalidateQueries({ queryKey: ['progress', 'lab'] });
      qc.invalidateQueries({ queryKey: ['progress', 'all-labs'] });
    },
  });
}
```

---

## STEP 5: GAMIFICATION HOOKS (ENHANCED v2)

### v2 CHANGES

- `[ENH]` `useAwardXP`: Optimistic updates — XP shows instantly in UI before server confirms. Uses `onMutate`/`onError`/`onSettled` pattern.
- `[ENH]` `useUpdateStreak`: Optimistic streak increment
- `[NEW-2D]` Streak recovery toast: If streak was recovered by shield, show a toast notification via `useToastStore` (from Stage 1 v2)

### File: `src/hooks/useGamification.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/stores/uiStore';
import { useChildStore } from '@/stores/childStore';
import { useToastStore } from '@/stores/toastStore';

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data.data;
}

// v2 [ENH]: Optimistic XP update — shows instant feedback
export function useAwardXP() {
  const qc = useQueryClient();
  const { triggerCelebration } = useUIStore();
  const { activeChild } = useChildStore();

  return useMutation({
    mutationFn: (body: { childId: string; amount: number; source: string }) =>
      apiFetch('/api/gamification/xp', { method: 'POST', body: JSON.stringify(body) }),

    // v2 [ENH]: Optimistic update — instantly show XP in sidebar
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await qc.cancelQueries({ queryKey: ['progress'] });

      // Snapshot for rollback
      const previousChild = activeChild ? { ...activeChild } : null;

      // Optimistically update local store
      if (activeChild) {
        useChildStore.getState().updateXP(variables.amount);
      }

      return { previousChild };
    },

    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousChild) {
        useChildStore.getState().setActiveChild(context.previousChild);
      }
    },

    onSuccess: (result) => {
      // Show XP celebration
      triggerCelebration('xp', { xp: result.xpAwarded || result.amount });

      // If leveled up, show level celebration after XP toast
      if (result.leveledUp) {
        setTimeout(() => {
          triggerCelebration('level', {
            level: result.newLevel,
            title: result.newTitle,
          });
        }, 2500);
      }
    },

    onSettled: () => {
      // Always refetch to sync with server
      qc.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

// v2 [ENH]: Optimistic streak update
export function useUpdateStreak() {
  const qc = useQueryClient();
  const { activeChild } = useChildStore();

  return useMutation({
    mutationFn: (childId: string) =>
      apiFetch('/api/gamification/streak', { method: 'POST', body: JSON.stringify({ childId }) }),

    // v2 [ENH]: Optimistic streak increment
    onMutate: async () => {
      const previousChild = activeChild ? { ...activeChild } : null;

      if (activeChild) {
        useChildStore.getState().setActiveChild({
          ...activeChild,
          streak_count: activeChild.streak_count + 1,
        });
      }

      return { previousChild };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousChild) {
        useChildStore.getState().setActiveChild(context.previousChild);
      }
    },

    onSuccess: (result) => {
      // v2 [NEW-2D]: Streak recovery toast
      if (result.shieldUsed) {
        useToastStore.getState().addToast(
          'info',
          'Streak Saved! Your streak shield protected your streak!',
          4000
        );
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

// Get badges for a child
export function useBadges(childId: string) {
  return useQuery({
    queryKey: ['badges', childId],
    queryFn: () => apiFetch(`/api/gamification/badges?childId=${childId}`),
    enabled: !!childId,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Check for new badges after an action
export function useCheckBadges() {
  const qc = useQueryClient();
  const { triggerCelebration } = useUIStore();

  return useMutation({
    mutationFn: (childId: string) =>
      apiFetch('/api/gamification/badges', { method: 'POST', body: JSON.stringify({ childId }) }),
    onSuccess: (result) => {
      if (result.newBadges && result.newBadges.length > 0) {
        // Delay badge celebration to not overlap with XP toast
        setTimeout(() => {
          triggerCelebration('badge', result.newBadges[0]);
        }, 2500);
      }
      qc.invalidateQueries({ queryKey: ['badges'] });
    },
  });
}

// COMBINED FLOW: complete content -> award XP -> update streak -> check badges
// This is the main function games and lessons call when a child finishes something.
export function useCompleteAndReward() {
  const completeContent = useCompleteContentInternal();
  const awardXP = useAwardXP();
  const updateStreak = useUpdateStreak();
  const checkBadges = useCheckBadges();

  return async (
    childId: string,
    contentId: string,
    xpAmount: number,
    source: string,
    score?: number
  ) => {
    // Step 1: Record completion
    await completeContent.mutateAsync({ childId, contentId, score });

    // Step 2: Award XP (triggers celebration)
    await awardXP.mutateAsync({ childId, amount: xpAmount, source });

    // Step 3: Update streak
    await updateStreak.mutateAsync(childId);

    // Step 4: Check for new badges
    await checkBadges.mutateAsync(childId);
  };
}

// Internal helper — used only by useCompleteAndReward
function useCompleteContentInternal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: { childId: string; contentId: string; score?: number }) =>
      apiFetch('/api/progress', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}
```

---

## STEP 6: DELETE OLD HOOKS FILE

Stage 2 Part 4 created `src/hooks/useApi.ts` with basic stub hooks. These new files replace it completely. Delete the old one:

```bash
rm -f src/hooks/useApi.ts
```

---

## STEP 7: BUILD VERIFICATION

```bash
npm run build
npx tsc --noEmit
npm run lint
```

Should complete with 0 errors.

### Common Issues

| Issue | Fix |
|-------|-----|
| `Cannot find module '@/stores/childStore'` | Ensure Stage 1 v2 stores exist |
| `Cannot find module '@/stores/toastStore'` | Created in Stage 1 v2 Part 2 |
| `Cannot find module '@/stores/uiStore'` | Created in Stage 1 v2 Part 2 |

---

## PART 1 (4A) v2 COMPLETE

### Files Created

| File | Exports | Notes |
|------|---------|-------|
| `src/hooks/useChildren.ts` | `useChildren`, `useCreateChild`, `useUpdateChild`, `useDeleteChild` | CRUD for child profiles |
| `src/hooks/useContent.ts` | `useLabContent`, `useContentBySlug`, `useAllContent`, `useDailyChallenge`, `useLatestContent` | v2: `[ENH]` staleTime 10min (lab), 30min (slug) |
| `src/hooks/useProgress.ts` | `useChildProgress`, `useLabProgress`, `useAllLabsProgress`, `useCompleteContent` | v2: `[BUG-3]` all-labs single call, `[ENH]` staleTime 2min |
| `src/hooks/useGamification.ts` | `useAwardXP`, `useUpdateStreak`, `useBadges`, `useCheckBadges`, `useCompleteAndReward` | v2: `[ENH]` optimistic XP + streak, `[NEW-2D]` streak toast |

### File Deleted

| File | Reason |
|------|--------|
| `src/hooks/useApi.ts` | Stage 2 placeholder — superseded by the 4 specialized hook files above |

### Directories Created

| Directory | Purpose |
|-----------|---------|
| `src/components/content/` | Content display components (populated in Part 2/3) |
| `src/app/(dashboard)/labs/[labId]/` | Lab detail page route (populated in Part 2) |
| `src/app/(dashboard)/content/[slug]/` | Content viewer route (populated in Part 3) |

### v2 Change Summary

| Tag | Change |
|-----|--------|
| `[BUG-3]` | `useAllLabsProgress`: 1 API call instead of 10 |
| `[ENH]` | Optimistic XP: instant feedback, rollback on error |
| `[ENH]` | Optimistic streak: increment immediately |
| `[ENH]` | staleTime tuning: content 10min, slug 30min, progress 2min |
| `[NEW-2D]` | Streak shield recovery toast |

### Code Review Fixes Applied (March 3, 2026)

The following issues were found during code review and fixed in this document:

| # | Original Issue | Fix Applied |
|---|---------------|-------------|
| 1 | `useProgress.ts`: `useCompleteContent` mutationFn parameter type truncated — missing closing brace and parenthesis | Completed the type: `{ childId: string; contentId: string; score?: number; timeSpentSeconds?: number }` |
| 2 | `useGamification.ts`: `useUpdateStreak` had garbled syntax — broken string literal in `onSuccess`, misplaced braces, `onSettled` outside mutation config | Restructured entire mutation to correct brace nesting and callback placement |
| 3 | `useGamification.ts`: `useCheckBadges` mutationFn missing closing parenthesis | Added closing `)` |
| 4 | `useGamification.ts`: Referenced `updateXPLocally` which doesn't exist on `childStore` | Changed to `updateXP` — the existing method on `childStore` with identical behavior |
| 5 | `useGamification.ts`: `toastStore.addToast()` called with object `{ type, title, message, duration }` — actual signature is `(type, message, duration?)` and store has no `title` field | Changed to `addToast('info', 'Streak Saved! Your streak shield protected your streak!', 4000)` matching actual API |
| 6 | `useGamification.ts`: Used `require()` for dynamic import of `toastStore` with try/catch | Changed to static import — `toastStore` exists since Stage 1 and `require()` is unreliable in Next.js client components |
| 7 | `useContent.ts`: `select` callbacks used `any` type for array items | Added `Content` type import and cast `as Content[]` for type safety |

---

## NEXT: Part 2 (4B) — Home Dashboard, Lab Map, Lab Detail
