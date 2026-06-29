# LOGIN_3D_v3FINAL_PartB — Enhanced Login Page, Demo Guards & Integration

> **NOTE (April 3, 2026):** The auth layout has been further enhanced by the 3D UI Migration (Phase 3). Login, signup, and reset pages now render as fully 3D panels (LoginPanel3D, SignupPanel3D, ResetPasswordPanel3D) inside their own R3F Canvas (Decision P3-1). The code in this document remains valid as the foundation — the 3D panel architecture layers on top.

**Stage:** 3 (Auth/Layout) — Login Enhancement
**Phase:** Post-Part A (builds on LOGIN_3D_v3FINAL_PartA.md)
**Version:** v3-FINAL | **Date:** March 23, 2026

---

## Overview

This document completes the 3D login enhancement with:
- Enhanced login page integrating the Demo Login button and 3D hover interactions
- Demo route guard middleware (redirects expired demos to login)
- AuthProvider integration for demo session hydration
- Dashboard layout updates for demo banner
- Enhanced signup page with 3D background coordination
- Visual polish: animated transitions, chrome bezel effects, loading states

---

## 1. Prerequisites

**Part A must be completed first.** The following files from Part A must exist:
- `src/lib/demo-session.ts`
- `src/stores/authStore.ts` (updated with demo state)
- `src/app/api/auth/demo/route.ts`
- `src/components/3d/LoginPortal3D.tsx`
- `src/components/3d/LoginParticles3D.tsx`
- `src/app/(auth)/layout.tsx` (replaced with 3D version)
- `src/components/auth/DemoLoginButton.tsx`
- `src/components/auth/DemoSessionBanner.tsx`

### Files Modified

| File | Action |
|------|--------|
| `src/app/(auth)/login/page.tsx` | **REPLACE** — Enhanced login with Demo button + 3D interactions |
| `src/components/providers/AuthProvider.tsx` | **MODIFY** — Add demo session hydration on mount |
| `src/app/(dashboard)/layout.tsx` | **MODIFY** — Add DemoSessionBanner + demo expiry check |

### Files Created

| File | Purpose |
|------|---------|
| `src/components/auth/DemoGuard.tsx` | Client-side demo expiry guard for dashboard routes |
| `src/components/auth/LoginFormCard.tsx` | Extracted animated login form with chrome bezel |
| `src/hooks/useDemoSession.ts` | Hook for demo timer state in any component |

---

## 2. Demo Session Hook

**File:** `src/hooks/useDemoSession.ts`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getDemoTimeRemaining, formatTimeRemaining, isDemoExpired } from '@/lib/demo-session';

interface DemoSessionState {
  isDemoMode: boolean;
  timeRemaining: string;
  timeRemainingMs: number;
  isUrgent: boolean;
  isExpired: boolean;
  percentRemaining: number;
}

const DEMO_DURATION_MS = 60 * 60 * 1000; // 1 hour

export function useDemoSession(): DemoSessionState {
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const checkDemoStatus = useAuthStore((s) => s.checkDemoStatus);

  const [state, setState] = useState<DemoSessionState>({
    isDemoMode: false,
    timeRemaining: '',
    timeRemainingMs: 0,
    isUrgent: false,
    isExpired: false,
    percentRemaining: 100,
  });

  useEffect(() => {
    if (!isDemoMode) {
      setState((prev) => ({ ...prev, isDemoMode: false }));
      return;
    }

    function update() {
      const valid = checkDemoStatus();
      if (!valid) {
        setState({
          isDemoMode: true,
          timeRemaining: '0:00',
          timeRemainingMs: 0,
          isUrgent: true,
          isExpired: true,
          percentRemaining: 0,
        });
        return;
      }

      const remainingMs = getDemoTimeRemaining();
      setState({
        isDemoMode: true,
        timeRemaining: formatTimeRemaining(remainingMs),
        timeRemainingMs: remainingMs,
        isUrgent: remainingMs < 5 * 60 * 1000,
        isExpired: remainingMs <= 0,
        percentRemaining: Math.max(0, (remainingMs / DEMO_DURATION_MS) * 100),
      });
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isDemoMode, checkDemoStatus]);

  return state;
}
```

---

## 3. Demo Guard Component

**File:** `src/components/auth/DemoGuard.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { isDemoExpired } from '@/lib/demo-session';

interface DemoGuardProps {
  children: React.ReactNode;
}

/**
 * DemoGuard wraps dashboard routes to enforce demo session expiry.
 * If the user is in demo mode and the session has expired, they are
 * redirected back to the login page with an expiry message.
 *
 * For authenticated (non-demo) users, this component is a passthrough.
 */
export function DemoGuard({ children }: DemoGuardProps) {
  const router = useRouter();
  const { isDemoMode, endDemoSession } = useAuthStore();

  useEffect(() => {
    if (!isDemoMode) return;

    // Check immediately
    if (isDemoExpired()) {
      endDemoSession();
      router.push('/login?demo=expired');
      return;
    }

    // Check every 30 seconds
    const interval = setInterval(() => {
      if (isDemoExpired()) {
        endDemoSession();
        router.push('/login?demo=expired');
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [isDemoMode, endDemoSession, router]);

  return <>{children}</>;
}
```

---

## 4. Animated Login Form Card

**File:** `src/components/auth/LoginFormCard.tsx`

```typescript
'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

interface LoginFormCardProps {
  onHoverChange?: (hovered: boolean) => void;
}

export function LoginFormCard({ onHoverChange }: LoginFormCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Show demo expired message if redirected from DemoGuard
  const demoExpired = searchParams.get('demo') === 'expired';

  async function handleLogin() {
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter your email and password');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid email or password');
        setLoading(false);
        return;
      }

      router.push('/home');
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="glass-card rounded-2xl p-8 relative overflow-hidden"
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Chrome bezel border effect */}
      <div className="absolute inset-0 rounded-2xl p-[1px] pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-spark-purple/20 via-transparent to-spark-blue/20" />
      </div>

      {/* Animated edge glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          boxShadow: '0 0 20px rgba(170, 102, 255, 0.1), inset 0 0 20px rgba(0, 187, 255, 0.05)',
        }}
        animate={{
          boxShadow: [
            '0 0 20px rgba(170, 102, 255, 0.1), inset 0 0 20px rgba(0, 187, 255, 0.05)',
            '0 0 30px rgba(170, 102, 255, 0.15), inset 0 0 30px rgba(0, 187, 255, 0.08)',
            '0 0 20px rgba(170, 102, 255, 0.1), inset 0 0 20px rgba(0, 187, 255, 0.05)',
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="text-center mb-6">
        <motion.div
          className="text-4xl mb-3"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        >
          &#128075;
        </motion.div>
        <h2 className="font-display text-xl font-bold text-white">Welcome Back!</h2>
        <p className="font-body text-white/50 text-sm mt-1">Log in to continue your adventure</p>
      </div>

      {/* Demo expired notification */}
      {demoExpired && (
        <motion.div
          className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <p className="font-body text-sm text-amber-300">
            Your demo session has ended. Log in or create an account to continue.
          </p>
        </motion.div>
      )}

      {/* Error banner */}
      <div aria-live="assertive" aria-atomic="true">
        {error && <ErrorBanner message={error} dismissible={false} />}
      </div>

      <div className="space-y-4 mt-4">
        {/* Email field */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label htmlFor="login-email" className="block font-body text-sm font-semibold text-white/70 mb-1.5">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/30" />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 font-body text-sm focus:outline-none focus:border-spark-purple/50 focus:ring-1 focus:ring-spark-purple/30 transition-colors"
              autoComplete="email"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
        </motion.div>

        {/* Password field */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="font-body text-sm font-semibold text-white/70">
              Password
            </label>
            <Link href="/reset-password" className="font-body text-xs text-spark-purple hover:text-spark-purple/80">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/30" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full h-12 pl-11 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 font-body text-sm focus:outline-none focus:border-spark-purple/50 focus:ring-1 focus:ring-spark-purple/30 transition-colors"
              autoComplete="current-password"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
        </motion.div>

        {/* Login button */}
        <motion.button
          onClick={handleLogin}
          disabled={loading || !email || !password}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          whileHover={{ scale: 1.01, boxShadow: '0 0 20px rgba(170, 102, 255, 0.3)' }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <motion.div
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              Logging in...
            </span>
          ) : (
            'Log In'
          )}
        </motion.button>
      </div>

      <p className="text-center font-body text-sm text-white/30 mt-6">
        {"Don't have an account?"}{' '}
        <Link href="/signup" className="text-spark-purple hover:text-spark-purple/80 font-semibold">
          Sign up
        </Link>
      </p>
    </motion.div>
  );
}
```

---

## 5. Enhanced Login Page

**File:** `src/app/(auth)/login/page.tsx` — **REPLACE**

```typescript
'use client';

import { Suspense, useState } from 'react';
import { LoginFormCard } from '@/components/auth/LoginFormCard';
import { DemoLoginButton } from '@/components/auth/DemoLoginButton';

export default function LoginPage() {
  const [isCardHovered, setIsCardHovered] = useState(false);

  return (
    <Suspense fallback={null}>
      <LoginFormCard onHoverChange={setIsCardHovered} />
      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-white/10" />
        <span className="font-body text-xs text-white/30 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>
      {/* Demo Login */}
      <DemoLoginButton />
    </Suspense>
  );
}
```

---

## 6. AuthProvider Update — Demo Session Hydration

**File:** `src/components/providers/AuthProvider.tsx` — **MODIFY**

Add demo session hydration to the existing `useEffect` that runs on mount. Insert the following block **at the start** of the initialization function, before the Supabase session check:

```typescript
// --- ADD TO EXISTING AuthProvider useEffect (mount) ---
import { getDemoSession } from '@/lib/demo-session';
import { useAuthStore } from '@/stores/authStore';

// Inside the useEffect initialization:
// Check for existing demo session first
const demoSession = getDemoSession();
if (demoSession) {
  useAuthStore.getState().isDemoMode || useAuthStore.setState({
    isDemoMode: true,
    demoSession,
  });
  // Demo users skip Supabase session check — no real auth
  // Still set loading to false so the app renders
  setLoading(false);
  return; // Exit early — demo mode doesn't use Supabase auth
}

// ... rest of existing Supabase session initialization ...
```

**Important:** The demo session check MUST come before `supabase.auth.getSession()`. Demo users have no Supabase session — the demo session in localStorage is their only credential.

---

## 7. Dashboard Layout Update — Demo Banner + Guard

**File:** `src/app/(dashboard)/layout.tsx` — **MODIFY**

Add the DemoSessionBanner and DemoGuard to the dashboard layout. Insert these components wrapping the existing layout content:

```typescript
// --- ADD IMPORTS ---
import { DemoSessionBanner } from '@/components/auth/DemoSessionBanner';
import { DemoGuard } from '@/components/auth/DemoGuard';

// --- WRAP existing return JSX ---
// Before (simplified):
// return (
//   <div>
//     <StationFrame ... />
//     <Sidebar ... />
//     <main>{children}</main>
//   </div>
// );

// After:
// return (
//   <DemoGuard>
//     <DemoSessionBanner />
//     <div>
//       <StationFrame ... />
//       <Sidebar ... />
//       <main>{children}</main>
//     </div>
//   </DemoGuard>
// );
```

The `DemoGuard` handles automatic redirect when the demo expires. The `DemoSessionBanner` shows the persistent timer at the top of the viewport.

---

## 8. Demo Mode Behavior Matrix

| Feature | Authenticated User | Demo User |
|---------|-------------------|-----------|
| Hero Animation (8-phase) | Plays on first visit | Always plays (demo = first visit) |
| 3D Panoramic Cockpit | Full access | Full access |
| Lab Navigation | Full access | Full access |
| Game Play | Full access, XP saved | Full access, XP NOT saved |
| Profile / Avatar | Editable, persisted | Read-only default avatar |
| Parent Dashboard | Full access | Hidden (no children data) |
| Settings | Full access | Limited (device type only) |
| Timer Banner | Hidden | Visible (countdown) |
| Session Duration | Unlimited | 1 hour max |
| Data Persistence | Supabase | localStorage only (cleared on expiry) |
| XP / Badges / Streaks | Tracked + saved | Visible but not persisted |

### Demo User Default Profile

When in demo mode, the `childStore` should use a default demo child profile:

```typescript
// Default demo child (used when isDemoMode === true)
const DEMO_CHILD = {
  id: 'demo-child',
  parent_id: 'demo-parent',
  display_name: 'Explorer',
  age: 10,
  age_band: 'B' as const,
  avatar_slug: 'astronaut',
  xp: 0,
  level: 1,
  streak_days: 0,
  badges: [],
  cosmetics: { hat: null, trail: null, frame: null },
  created_at: new Date().toISOString(),
};
```

This ensures all game components that read from `childStore` work without errors during demo mode.

---

## 9. Demo Expiry Flow

```
Demo timer reaches 0:00
  │
  ├─ DemoGuard detects expiry (30s poll)
  │   └─ Calls endDemoSession()
  │   └─ router.push('/login?demo=expired')
  │
  ├─ DemoSessionBanner detects expiry (1s poll)
  │   └─ Shows expired modal overlay
  │   └─ Two buttons:
  │       ├─ "Create Free Account" → /signup
  │       └─ "Return to Login" → /login
  │
  └─ On login page:
      └─ ?demo=expired query param
      └─ Shows amber notification: "Your demo session has ended"
      └─ User can log in or sign up normally
```

---

## 10. Visual Design Specifications

### Login Portal 3D Scene

| Property | Value |
|----------|-------|
| Portal geometry | Icosahedron (r=1.2, detail=4) with MeshDistortMaterial |
| Portal color | `#AA66FF` (spark-purple) |
| Distortion | 0.3 idle, 0.5 on card hover |
| Outer ring | Torus (r=2.0, tube=0.06), chrome metalness 0.95 |
| Inner ring | Torus (r=1.5, tube=0.04), purple emissive 0.6 |
| Sparkles | 60 count, scale 5, speed 0.4 |
| Particles | 150 instanced icosahedrons, spread 6, drift speed 0.1-0.4 |
| Lighting | Point light purple (1.5 intensity), point light blue (0.3), ambient (0.15) |
| Camera | Position [0, 0, 5], FOV 50 |
| DPR | [1, 2] (adaptive) |

### Auth Card Styling

| Property | Value |
|----------|-------|
| Background | `glass-card` (existing CSS class) |
| Border | Chrome bezel gradient: `from-spark-purple/20 to-spark-blue/20` |
| Edge glow | Animated box-shadow pulse (4s cycle) |
| Entrance | Fade in + slide up (0.5s ease-out) |
| Form fields | Staggered entrance (0.1s, 0.2s delays) |
| Button hover | Scale 1.01 + purple shadow glow |

### Demo Banner Styling

| State | Background | Text | Timer |
|-------|-----------|------|-------|
| Normal (>5min) | `from-spark-purple/20 to-spark-blue/20` + blur | `text-white/70` | `text-spark-green` (Orbitron font) |
| Urgent (<5min) | `from-red-900/90 to-orange-900/90` | `text-red-200` | `text-red-300` (pulse animation) |

### Demo Expired Modal

| Property | Value |
|----------|-------|
| Overlay | `bg-black/80 backdrop-blur-sm` |
| Card | `glass-card` with chrome bezel |
| Icon | Clock emoji (⏰), 5xl size |
| Primary CTA | Purple-to-blue gradient button ("Create Free Account") |
| Secondary CTA | Ghost button with border ("Return to Login") |
| Entrance | Scale 0.9→1.0 + fade, spring animation |

---

## 11. Accessibility Requirements

| Feature | Requirement |
|---------|-------------|
| Demo button | `aria-label="Try SparkForge demo without creating an account"` |
| Demo banner | `role="status"`, time updates via `aria-live="polite"` |
| Expired modal | `role="alertdialog"`, `aria-labelledby` on heading, focus trap |
| Login form | All existing ARIA labels preserved from v2 |
| Error banner | `aria-live="assertive"` (existing) |
| 3D canvas | `aria-hidden="true"` (decorative, not interactive) |
| Mobile fallback | CSS particles are decorative, no ARIA needed |
| Reduced motion | `prefers-reduced-motion: reduce` → 3D canvas hidden, CSS particles static |

---

## 12. Build Validation — Part B

After creating/modifying all files in this part, run:

```bash
npm run build
npx tsc --noEmit
```

### Expected Results

- Enhanced login page renders with Demo Login button below the form
- Demo session starts on button click → redirects to /home
- Demo banner appears at top of dashboard with countdown timer
- Banner turns red/urgent when <5 minutes remain
- Expired modal appears when time runs out with two CTAs
- DemoGuard redirects expired demo users to /login?demo=expired
- 3D portal reacts to card hover (increased distortion)
- Mobile shows CSS particle fallback (no 3D canvas)
- All ARIA labels present and functional

### Files Created/Modified (Part B Summary)

| # | File | Lines | Action |
|---|------|-------|--------|
| 1 | `src/hooks/useDemoSession.ts` | ~70 | CREATE |
| 2 | `src/components/auth/DemoGuard.tsx` | ~45 | CREATE |
| 3 | `src/components/auth/LoginFormCard.tsx` | ~175 | CREATE |
| 4 | `src/app/(auth)/login/page.tsx` | ~25 | REPLACE |
| 5 | `src/components/providers/AuthProvider.tsx` | +15 | MODIFY |
| 6 | `src/app/(dashboard)/layout.tsx` | +5 | MODIFY |

### Git Commit (Part B)

```bash
git add -A
git commit -m "Stage 3 Login Enhancement Part B: Enhanced login page, demo guards, AuthProvider integration, visual polish"
```

---

## 13. Complete File Registry — Login 3D Enhancement

| # | File | Part | Action | Purpose |
|---|------|------|--------|---------|
| 1 | `src/lib/demo-session.ts` | A | CREATE | Demo timer utilities |
| 2 | `src/stores/authStore.ts` | A | MODIFY | Demo session state |
| 3 | `src/app/api/auth/demo/route.ts` | A | CREATE | Demo API endpoint |
| 4 | `src/components/3d/LoginPortal3D.tsx` | A | CREATE | 3D crystal portal |
| 5 | `src/components/3d/LoginParticles3D.tsx` | A | CREATE | Ambient particles |
| 6 | `src/app/(auth)/layout.tsx` | A | REPLACE | 3D auth layout |
| 7 | `src/components/auth/DemoLoginButton.tsx` | A | CREATE | Demo login UI |
| 8 | `src/components/auth/DemoSessionBanner.tsx` | A | CREATE | Timer banner + expiry modal |
| 9 | `src/hooks/useDemoSession.ts` | B | CREATE | Demo timer hook |
| 10 | `src/components/auth/DemoGuard.tsx` | B | CREATE | Demo expiry guard |
| 11 | `src/components/auth/LoginFormCard.tsx` | B | CREATE | Animated login form |
| 12 | `src/app/(auth)/login/page.tsx` | B | REPLACE | Enhanced login page |
| 13 | `src/components/providers/AuthProvider.tsx` | B | MODIFY | Demo hydration |
| 14 | `src/app/(dashboard)/layout.tsx` | B | MODIFY | Demo banner + guard |

**Total: 14 files (9 created, 3 replaced, 2 modified)**

---

## 14. Visual Verification Checklist

After completing both Part A and Part B, verify:

```
LOGIN 3D ENHANCEMENT — Visual Verification

Desktop:
- [ ] 3D crystal portal renders behind login card
- [ ] Portal has rotating rings and sparkle particles
- [ ] Chrome bezel glows and pulses on login card
- [ ] Form fields animate in with staggered delay
- [ ] "Try Demo" button visible below login form
- [ ] Demo confirmation panel shows on click
- [ ] Demo starts → redirects to /home with hero animation
- [ ] Demo banner visible at top with countdown timer
- [ ] Banner turns red when <5 min remaining
- [ ] Expired modal appears when timer hits 0:00
- [ ] "Return to Login" clears demo and redirects
- [ ] Login page shows amber "demo expired" notice when ?demo=expired

Mobile:
- [ ] CSS particles render (no 3D canvas)
- [ ] Login form fully functional
- [ ] Demo button works
- [ ] Demo banner responsive on mobile widths

Accessibility:
- [ ] Screen reader announces demo button purpose
- [ ] Expired modal traps focus
- [ ] Error messages announced via aria-live
- [ ] Tab order logical through form + demo button
- [ ] prefers-reduced-motion disables 3D + animations
```

---

*End of LOGIN_3D_v3FINAL_PartB.md — Login Enhancement Complete*
*14 files total | Demo Login (1-hour timed) | 3D Crystal Portal | Chrome Bezel UI | Mobile CSS Fallback | Full Accessibility | March 23, 2026*
