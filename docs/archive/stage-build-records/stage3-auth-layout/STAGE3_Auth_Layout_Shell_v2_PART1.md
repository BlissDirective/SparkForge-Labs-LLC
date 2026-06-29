# SPARKFORGE — STAGE 3: AUTH, LAYOUT & SHELL v2 (PART 1 of 3)

**Date:** February 21, 2026 | **Version:** Frost-Prismatic v2.1

## PART 1 (3A) COVERS:

- AuthProvider (session management + store hydration)
- Shared UI components (LoadingScreen, Skeletons, ErrorBanner, EmptyState, StepIndicator)
- Root layout note (already created in Stage 1 v2)

## v2 CHANGES IN THIS PART:

- **[NEW-3A]** AuthProvider checks `onboarding_complete`, redirects if false
- **[ACC]** LoadingScreen has `aria-live` and `role="status"`
- Root layout already includes QueryProvider + AuthProvider (Stage 1 v2)

## PREREQUISITES: Stages 1-2 v2 complete

**NOTE ON QUERYPROVIDER:** Already created in Stage 2 v2 Part 4. We do NOT recreate it here.

**NOTE ON ROOT LAYOUT:** Already created in Stage 1 v2 Part 2 (Step 18) with QueryProvider, AuthProvider, ToastContainer, fonts, and accessibility meta tags. We do NOT recreate it here.

---

## STEP 1: CREATE REQUIRED FOLDERS

```bash
mkdir -p src/components/providers
mkdir -p src/components/shared
mkdir -p src/components/layout
mkdir -p "src/app/(dashboard)/onboarding"
```

---

## STEP 2: AUTH PROVIDER (ENHANCED v2)

**WHAT THIS DOES:** On app load, checks if the user has an active Supabase session. If yes, fetches the parent record + children from the database and puts them into Zustand stores so every component can access them. Also listens for auth changes (login, logout, token refresh).

**v2 CHANGES:**
- **[NEW-3A]** Checks `onboarding_complete`. If false, redirects to `/onboarding` after login. This ensures first-time parents go through the onboarding wizard before seeing the dashboard.
- **[ACC]** Improved error logging

**WHERE:** Create `src/components/providers/AuthProvider.tsx`

### File: `src/components/providers/AuthProvider.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useChildStore } from '@/stores/childStore';
import { LoadingScreen } from '@/components/shared/LoadingScreen';

const supabase = createClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { setParent, setLoading: setAuthLoading, clearAuth } = useAuthStore();
  const { setChildren, setActiveChild, clearChild } = useChildStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        setAuthLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          await hydrateUserData(session.user.id);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        if (mounted) {
          setAuthLoading(false);
          setIsInitialized(true);
        }
      }
    }

    async function hydrateUserData(userId: string) {
      // Fetch parent record
      const { data: parent } = await supabase
        .from('parents')
        .select('*')
        .eq('id', userId)
        .single();

      if (parent && mounted) {
        setParent(parent);

        // v2 [NEW-3A]: Redirect to onboarding if not complete
        // Only redirect if we're on a dashboard page (not auth pages)
        if (
          !parent.onboarding_complete &&
          !pathname?.startsWith('/onboarding') &&
          !pathname?.startsWith('/login') &&
          !pathname?.startsWith('/signup') &&
          !pathname?.startsWith('/reset-password')
        ) {
          router.push('/onboarding');
        }
      }

      // Fetch children
      const { data: kids } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', userId)
        .order('created_at', { ascending: true });

      if (kids && mounted) {
        setChildren(kids);

        // Auto-select first child if none selected
        if (kids.length > 0) {
          const stored = typeof window !== 'undefined'
            ? localStorage.getItem('sparkforge-active-child')
            : null;
          const activeChild = stored
            ? kids.find((k: any) => k.id === stored) || kids[0]
            : kids[0];
          setActiveChild(activeChild);
        }
      }
    }

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await hydrateUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          clearAuth();
          clearChild();
          router.push('/login');
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Re-hydrate on token refresh to keep data fresh
          await hydrateUserData(session.user.id);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isInitialized) {
    return <LoadingScreen message="Loading SparkForge..." />;
  }

  return <>{children}</>;
}
```

**Auto-fix notes:**
- Stage doc originally mapped DB fields to camelCase in `setParent()` call, but `Parent` type uses snake_case (matching Supabase columns). Fixed to pass DB row directly: `setParent(parent)`.
- Added `onboarding_complete: boolean` to `Parent` interface in `src/types/index.ts` (column added in Stage 2 Part 1 but type wasn't updated).

---

## STEP 3: LOADING SCREEN

**WHERE:** Create `src/components/shared/LoadingScreen.tsx`

### File: `src/components/shared/LoadingScreen.tsx`

```typescript
'use client';

import { motion } from 'motion/react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div
      className="min-h-screen bg-surface-deep flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated logo */}
        <motion.div
          className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-spark-purple to-spark-blue"
          animate={{
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Pulsing dots */}
        <div className="flex gap-2 justify-center mb-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-spark-purple"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>

        <p className="font-body text-white/50 text-sm">{message}</p>
        <span className="sr-only">{message}</span>
      </motion.div>
    </div>
  );
}
```

---

## STEP 4: LOADING SKELETONS

**WHERE:** Create `src/components/shared/LoadingSkeleton.tsx`

### File: `src/components/shared/LoadingSkeleton.tsx`

```typescript
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-white/5', className)} />
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-10 w-32 mt-4" />
    </div>
  );
}

export function LabCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="w-14 h-14 rounded-xl" />
        <Skeleton className="w-10 h-6 rounded-full" />
      </div>
      <Skeleton className="h-5 w-2/3 mt-2" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-2 w-full rounded-full mt-3" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-4 text-center space-y-2">
      <Skeleton className="h-8 w-16 mx-auto" />
      <Skeleton className="h-3 w-20 mx-auto" />
    </div>
  );
}

export function ContentListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card rounded-xl p-4 flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="w-[220px] h-screen bg-surface-base/50 p-4 space-y-4">
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="space-y-2 mt-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

---

## STEP 5: ERROR BANNER

**WHERE:** Create `src/components/shared/ErrorBanner.tsx`

### File: `src/components/shared/ErrorBanner.tsx`

```typescript
'use client';

import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface ErrorBannerProps {
  message: string;
  dismissible?: boolean;
  className?: string;
}

export function ErrorBanner({ message, dismissible = true, className }: ErrorBannerProps) {
  const [visible, setVisible] = useState(true);

  if (!message || !visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={`flex items-start gap-3 p-4 rounded-xl bg-spark-coral/10 border border-spark-coral/20 ${className || ''}`}
        role="alert"
        aria-live="assertive"
      >
        <AlertTriangle className="w-5 h-5 text-spark-coral flex-shrink-0 mt-0.5" />
        <p className="font-body text-sm text-spark-coral flex-1">{message}</p>
        {dismissible && (
          <button
            onClick={() => setVisible(false)}
            className="text-spark-coral/50 hover:text-spark-coral transition-colors"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## STEP 6: EMPTY STATE

**WHERE:** Create `src/components/shared/EmptyState.tsx`

### File: `src/components/shared/EmptyState.tsx`

```typescript
'use client';

import { motion } from 'motion/react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon = '✨', title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      className="text-center py-16 px-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-display text-lg font-bold text-white mb-2">{title}</h3>
      <p className="font-body text-white/50 text-sm max-w-xs mx-auto mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm hover:brightness-110 transition-all"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
```

---

## STEP 7: STEP INDICATOR

Multi-step progress indicator for signup and onboarding flows.

**WHERE:** Create `src/components/shared/StepIndicator.tsx`

### File: `src/components/shared/StepIndicator.tsx`

```typescript
'use client';

import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  return (
    <div
      className="flex items-center justify-center gap-2 mb-8"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-valuenow={currentStep}
    >
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={i} className="flex items-center gap-2">
            <motion.div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                isCompleted
                  ? 'bg-spark-green text-white'
                  : isActive
                    ? 'bg-gradient-to-r from-spark-purple to-spark-blue text-white shadow-glow-purple'
                    : 'bg-white/10 text-white/40'
              }`}
              animate={isActive ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5 }}
              aria-label={labels ? `Step ${stepNum}: ${labels[i]}` : `Step ${stepNum}`}
            >
              {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
            </motion.div>

            {/* Connector line */}
            {stepNum < totalSteps && (
              <div
                className={`w-8 h-0.5 rounded-full transition-colors ${
                  isCompleted ? 'bg-spark-green' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

---

## STEP 8: VERIFY ROOT LAYOUT (NO CHANGES NEEDED)

Stage 1 v2 Part 2 (Step 18) already created `src/app/layout.tsx` with:
- QueryProvider wrapping
- AuthProvider wrapping
- ToastContainer
- Google Fonts
- Accessibility meta tags

**CHECK:** Open `src/app/layout.tsx` and verify it contains:

```tsx
<QueryProvider>
  <AuthProvider>
    {children}
  </AuthProvider>
</QueryProvider>
```

If Stage 1 v2 is complete, this is already in place. No changes needed here.

---

## PART 1 COMPLETE — WHAT YOU NOW HAVE

### Files created:

1. **`src/components/providers/AuthProvider.tsx`**
   - v2: [NEW-3A] `onboarding_complete` redirect check
   - v2: [ACC] Improved error handling + aria support

2. **`src/components/shared/LoadingScreen.tsx`**
   - v2: [ACC] `role="status"`, `aria-live="polite"`, sr-only text

3. **`src/components/shared/LoadingSkeleton.tsx`**
   - `Skeleton`, `CardSkeleton`, `LabCardSkeleton`, `StatCardSkeleton`, `ContentListSkeleton`, `SidebarSkeleton`

4. **`src/components/shared/ErrorBanner.tsx`**
   - v2: [ACC] `role="alert"`, `aria-live="assertive"`

5. **`src/components/shared/EmptyState.tsx`**

6. **`src/components/shared/StepIndicator.tsx`**
   - v2: [ACC] `role="progressbar"`, `aria-label` per step

### Files modified:

7. **`src/types/index.ts`** — Added `onboarding_complete: boolean` to `Parent` interface (column added in Stage 2 Part 1)

### KEY v2 UPDATES:

- AuthProvider redirects to `/onboarding` when `onboarding_complete=false`
- All components have ARIA attributes for accessibility
- Uses `createClient()` from Stage 1 (not inline `createBrowserClient`)
- Root layout NOT duplicated (Stage 1 v2 already has it)
- AuthProvider passes DB row directly to `setParent()` (snake_case matches `Parent` type)

### Discrepancies fixed:

- Stage doc `setParent()` used camelCase field mapping (`fullName`, `subscriptionTier`, etc.) but `Parent` type uses snake_case. Fixed to pass Supabase row directly.
- `onboarding_complete` was missing from `Parent` interface — added as auto-fix (CLAUDE.md Section 3.1: TypeScript type fixes).
- EmptyState: reconstructed `icon` default param and button className (badly mangled in PDF extraction).
- LoadingScreen: restored gradient className (was truncated at `from-spark-purple to-s`).
- StepIndicator: restored `aria-valuemin`, `aria-valuemax`, `aria-valuenow` attributes (were truncated) and `shadow-glow-purple` class (was split across lines).
- ErrorBanner: restored `border border-spark-coral/20` className (was truncated).

---

**NEXT:** Part 2 (3B) — Auth Pages (Signup, Login, Reset Password), Error Boundaries + Dashboard Loading
