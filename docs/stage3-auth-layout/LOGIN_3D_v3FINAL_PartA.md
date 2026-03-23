# LOGIN_3D_v3FINAL_PartA — 3D Login Page Enhancement

**Stage:** 3 (Auth/Layout) — Login Enhancement
**Phase:** Post-Stage 3 Part 3 (before Hero Animation)
**Supersedes:** Current flat login page (`src/app/(auth)/login/page.tsx`, `src/app/(auth)/layout.tsx`)
**Version:** v3-FINAL | **Date:** March 23, 2026

---

## Overview

This document transforms the SparkForge login/signup pages from a flat glassmorphic card into an immersive 3D laboratory entrance. The login page becomes the **first visual encounter** with the Frost-Prismatic design system — featuring a rotating crystal portal, animated particle fields, volumetric lighting, and chrome-bezel UI elements that preview the full cockpit experience.

**Key additions in this Part:**
- 3D login scene with crystal portal and ambient particles
- Login background shader (aurora + energy field)
- Enhanced auth layout with 3D canvas integration
- Animated form components with chrome bezel styling
- Demo Login feature (1-hour timed session, no account required)

---

## 1. Prerequisites

### Packages (already installed from Stage 1/3)

No new packages required. Uses existing:
- `three` / `@react-three/fiber` / `@react-three/drei` / `@react-three/postprocessing`
- `framer-motion` (Motion)
- `zustand`
- `lucide-react`

### Files Modified

| File | Action |
|------|--------|
| `src/app/(auth)/layout.tsx` | **REPLACE** — Add 3D canvas layer |
| `src/app/(auth)/login/page.tsx` | **REPLACE** — Enhanced 3D login with Demo Login |
| `src/stores/authStore.ts` | **MODIFY** — Add demo session state |

### Files Created

| File | Purpose |
|------|---------|
| `src/components/3d/LoginPortal3D.tsx` | 3D crystal portal scene for login background |
| `src/components/3d/LoginParticles3D.tsx` | Ambient particle field for auth pages |
| `src/components/auth/DemoLoginButton.tsx` | Demo Login button + timer logic |
| `src/components/auth/DemoSessionBanner.tsx` | Persistent banner showing remaining demo time |
| `src/lib/demo-session.ts` | Demo session utilities (timer, storage, cleanup) |
| `src/app/api/auth/demo/route.ts` | Demo session API endpoint |

---

## 2. Demo Session Utilities

**File:** `src/lib/demo-session.ts`

```typescript
// Demo session management — 1 hour timed access without account
// Stores session in localStorage with expiry timestamp

const DEMO_SESSION_KEY = 'sparkforge-demo-session';
const DEMO_DURATION_MS = 60 * 60 * 1000; // 1 hour

export interface DemoSession {
  id: string;
  startedAt: number;
  expiresAt: number;
  deviceType: 'desktop' | 'tablet' | 'mobile' | null;
}

export function createDemoSession(): DemoSession {
  const now = Date.now();
  const session: DemoSession = {
    id: `demo-${now}-${Math.random().toString(36).slice(2, 9)}`,
    startedAt: now,
    expiresAt: now + DEMO_DURATION_MS,
    deviceType: null,
  };
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getDemoSession(): DemoSession | null {
  const raw = localStorage.getItem(DEMO_SESSION_KEY);
  if (!raw) return null;
  try {
    const session: DemoSession = JSON.parse(raw);
    if (Date.now() >= session.expiresAt) {
      clearDemoSession();
      return null;
    }
    return session;
  } catch {
    clearDemoSession();
    return null;
  }
}

export function getDemoTimeRemaining(): number {
  const session = getDemoSession();
  if (!session) return 0;
  return Math.max(0, session.expiresAt - Date.now());
}

export function isDemoExpired(): boolean {
  const session = getDemoSession();
  if (!session) return true;
  return Date.now() >= session.expiresAt;
}

export function clearDemoSession(): void {
  localStorage.removeItem(DEMO_SESSION_KEY);
}

export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
```

---

## 3. Auth Store Update

**File:** `src/stores/authStore.ts` — **MODIFY** (append demo session state)

Add the following to the existing `AuthState` interface and store:

```typescript
import { create } from 'zustand';
import type { Parent } from '@/types';
import { getDemoSession, createDemoSession, clearDemoSession, type DemoSession } from '@/lib/demo-session';

interface AuthState {
  parent: Parent | null;
  isLoading: boolean;
  // Demo session state
  isDemoMode: boolean;
  demoSession: DemoSession | null;
  setParent: (parent: Parent | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
  // Demo actions
  startDemoSession: () => DemoSession;
  endDemoSession: () => void;
  checkDemoStatus: () => boolean; // returns true if still valid
}

export const useAuthStore = create<AuthState>((set, get) => ({
  parent: null,
  isLoading: true,
  isDemoMode: false,
  demoSession: null,

  setParent: (parent) => set({ parent }),
  setLoading: (loading) => set({ isLoading: loading }),

  clearAuth: () => set({
    parent: null,
    isLoading: false,
    isDemoMode: false,
    demoSession: null,
  }),

  startDemoSession: () => {
    const session = createDemoSession();
    set({ isDemoMode: true, demoSession: session });
    return session;
  },

  endDemoSession: () => {
    clearDemoSession();
    set({ isDemoMode: false, demoSession: null });
  },

  checkDemoStatus: () => {
    const session = getDemoSession();
    if (!session) {
      if (get().isDemoMode) {
        set({ isDemoMode: false, demoSession: null });
      }
      return false;
    }
    return true;
  },
}));
```

---

## 4. Demo Session API Endpoint

**File:** `src/app/api/auth/demo/route.ts`

```typescript
// POST /api/auth/demo — Initialize demo session (no auth required)
// Returns a temporary session token for demo access
import { NextRequest } from 'next/server';
import { apiSuccess, apiError, applyRateLimit } from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Rate limit demo creation (3 per hour per IP)
  const limited = applyRateLimit(req, 'demo-session', undefined, {
    interval: 3600,
    limit: 3,
  });
  if (limited) return limited;

  const demoId = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

  return apiSuccess({
    demoId,
    expiresAt,
    message: 'Demo session started. You have 1 hour to explore SparkForge.',
  });
}
```

---

## 5. 3D Login Portal Scene

**File:** `src/components/3d/LoginPortal3D.tsx`

```typescript
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles, Ring } from '@react-three/drei';
import * as THREE from 'three';

interface LoginPortal3DProps {
  portalColor?: string;
  intensity?: number;
  isHovered?: boolean;
}

export default function LoginPortal3D({
  portalColor = '#AA66FF',
  intensity = 1.0,
  isHovered = false,
}: LoginPortal3DProps) {
  const portalRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  const portalColorObj = useMemo(() => new THREE.Color(portalColor), [portalColor]);
  const secondaryColor = useMemo(() => new THREE.Color('#00BBFF'), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Rotate outer ring slowly
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.15;
      ringRef.current.rotation.x = Math.sin(t * 0.1) * 0.1;
    }

    // Counter-rotate inner ring
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z = -t * 0.25;
      innerRingRef.current.rotation.y = Math.cos(t * 0.08) * 0.15;
    }

    // Pulse portal distortion on hover
    if (portalRef.current) {
      const scale = isHovered ? 1.05 + Math.sin(t * 3) * 0.03 : 1.0;
      portalRef.current.scale.setScalar(scale);
    }

    // Animate glow intensity
    if (glowRef.current) {
      glowRef.current.intensity = (isHovered ? 3.0 : 1.5) + Math.sin(t * 2) * 0.5;
    }
  });

  return (
    <group position={[0, 0, -2]}>
      {/* Central portal sphere with distortion */}
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
        <mesh ref={portalRef}>
          <icosahedronGeometry args={[1.2, 4]} />
          <MeshDistortMaterial
            color={portalColorObj}
            emissive={portalColorObj}
            emissiveIntensity={0.4 * intensity}
            roughness={0.1}
            metalness={0.8}
            distort={isHovered ? 0.5 : 0.3}
            speed={2}
            transparent
            opacity={0.85}
          />
        </mesh>
      </Float>

      {/* Outer chrome ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[2.0, 0.06, 16, 64]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={secondaryColor}
          emissiveIntensity={0.3}
          metalness={0.95}
          roughness={0.05}
        />
      </mesh>

      {/* Inner energy ring */}
      <mesh ref={innerRingRef}>
        <torusGeometry args={[1.5, 0.04, 16, 48]} />
        <meshStandardMaterial
          color={portalColorObj}
          emissive={portalColorObj}
          emissiveIntensity={0.6}
          metalness={0.7}
          roughness={0.2}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Decorative ring segments */}
      {[0, 1, 2, 3].map((i) => (
        <Ring
          key={i}
          args={[1.7 + i * 0.15, 1.75 + i * 0.15, 32]}
          rotation={[0, 0, (i * Math.PI) / 4]}
          position={[0, 0, -0.1 * i]}
        >
          <meshStandardMaterial
            color="#ffffff"
            emissive={portalColorObj}
            emissiveIntensity={0.2}
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.3}
          />
        </Ring>
      ))}

      {/* Sparkle particles around portal */}
      <Sparkles
        count={60}
        scale={5}
        size={2}
        speed={0.4}
        color={portalColor}
        opacity={0.6}
      />

      {/* Portal glow light */}
      <pointLight
        ref={glowRef}
        color={portalColor}
        intensity={1.5}
        distance={8}
        decay={2}
      />

      {/* Ambient fill */}
      <pointLight
        color="#00BBFF"
        intensity={0.3}
        position={[3, 2, 1]}
        distance={10}
      />
    </group>
  );
}
```

---

## 6. Login Particle Field

**File:** `src/components/3d/LoginParticles3D.tsx`

```typescript
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LoginParticles3DProps {
  count?: number;
  color?: string;
  spread?: number;
}

export default function LoginParticles3D({
  count = 200,
  color = '#AA66FF',
  spread = 8,
}: LoginParticles3DProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * spread * 2,
        (Math.random() - 0.5) * spread * 2,
        (Math.random() - 0.5) * spread - 3,
      ),
      speed: 0.1 + Math.random() * 0.3,
      offset: Math.random() * Math.PI * 2,
      scale: 0.02 + Math.random() * 0.04,
    }));
  }, [count, spread]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    particles.forEach((p, i) => {
      dummy.position.set(
        p.position.x + Math.sin(t * p.speed + p.offset) * 0.5,
        p.position.y + Math.cos(t * p.speed * 0.7 + p.offset) * 0.3,
        p.position.z + Math.sin(t * p.speed * 0.5 + p.offset) * 0.2,
      );
      const pulse = 1 + Math.sin(t * 2 + p.offset) * 0.3;
      dummy.scale.setScalar(p.scale * pulse);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const particleColor = useMemo(() => new THREE.Color(color), [color]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial
        color={particleColor}
        transparent
        opacity={0.6}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
```

---

## 7. Enhanced Auth Layout with 3D Background

**File:** `src/app/(auth)/layout.tsx` — **REPLACE**

```typescript
'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { DemoSessionBanner } from '@/components/auth/DemoSessionBanner';

// Dynamic 3D imports — SSR disabled
const LoginScene3D = dynamic(
  () => import('@/components/3d/LoginPortal3D').then((mod) => {
    // Wrap in a Canvas-ready component
    const LoginPortal3D = mod.default;
    const LoginParticles3D = require('@/components/3d/LoginParticles3D').default;

    return function LoginScene() {
      return (
        <>
          <ambientLight intensity={0.15} />
          <LoginPortal3D portalColor="#AA66FF" intensity={1.0} />
          <LoginParticles3D count={150} color="#AA66FF" spread={6} />
        </>
      );
    };
  }),
  { ssr: false }
);

const R3FCanvas = dynamic(
  () => import('@react-three/fiber').then((mod) => mod.Canvas),
  { ssr: false }
);

function useIsMobile() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const isMobile = typeof window !== 'undefined' ? useIsMobile() : false;

  return (
    <div className="min-h-screen bg-surface-deep bg-cosmic-dark flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Demo session banner — renders only when in demo mode */}
      <DemoSessionBanner />

      {/* 3D Background Layer — desktop only */}
      {!isMobile && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Suspense fallback={null}>
            <R3FCanvas
              camera={{ position: [0, 0, 5], fov: 50 }}
              dpr={[1, 2]}
              style={{ background: 'transparent' }}
              gl={{ alpha: true, antialias: true }}
            >
              <LoginScene3D />
            </R3FCanvas>
          </Suspense>
        </div>
      )}

      {/* CSS Particle Fallback — mobile */}
      {isMobile && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-pulse"
              style={{
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: i % 3 === 0 ? '#AA66FF' : i % 3 === 1 ? '#00BBFF' : '#00FF88',
                opacity: 0.3 + Math.random() * 0.4,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-8 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-spark-purple to-spark-blue flex items-center justify-center shadow-lg shadow-spark-purple/25">
          <span className="text-2xl">⚡</span>
        </div>
        <span className="font-display text-2xl font-bold text-white drop-shadow-lg">
          SparkForge
        </span>
      </Link>

      {/* Card container — above 3D layer */}
      <div className="w-full max-w-md relative z-10">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-white/20 text-xs font-body text-center relative z-10">
        &copy; 2026 BlissDirective &middot; SparkForge
      </p>
    </div>
  );
}
```

---

## 8. Demo Login Button Component

**File:** `src/components/auth/DemoLoginButton.tsx`

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Play, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export function DemoLoginButton() {
  const router = useRouter();
  const startDemoSession = useAuthStore((s) => s.startDemoSession);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDemoStart() {
    setLoading(true);

    try {
      // Call demo API to register session server-side
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        setLoading(false);
        return;
      }

      // Start client-side demo session
      startDemoSession();

      // Navigate to dashboard
      router.push('/home');
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <AnimatePresence mode="wait">
        {!showConfirm ? (
          <motion.button
            key="demo-trigger"
            onClick={() => setShowConfirm(true)}
            className="w-full h-11 rounded-xl border border-spark-green/30 bg-spark-green/5 text-spark-green font-display font-semibold text-sm hover:bg-spark-green/10 hover:border-spark-green/50 transition-all flex items-center justify-center gap-2"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            aria-label="Try SparkForge demo without creating an account"
          >
            <Play className="w-4 h-4" />
            Try Demo (No Account Needed)
          </motion.button>
        ) : (
          <motion.div
            key="demo-confirm"
            className="rounded-xl border border-spark-green/20 bg-spark-green/5 p-4 space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <p className="font-body text-sm text-white/70 text-center">
              You'll get <span className="text-spark-green font-semibold">1 hour</span> to explore
              the full SparkForge experience — Hero Animation, 3D Cockpit, Labs, and Games.
            </p>
            <p className="font-body text-xs text-white/40 text-center">
              No data is saved. Create an account anytime to keep your progress.
            </p>
            <div className="flex gap-2">
              <motion.button
                onClick={() => setShowConfirm(false)}
                className="flex-1 h-10 rounded-lg border border-white/10 text-white/50 font-body text-sm hover:bg-white/5 transition-colors"
                whileTap={{ scale: 0.98 }}
                disabled={loading}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleDemoStart}
                disabled={loading}
                className="flex-1 h-10 rounded-lg bg-gradient-to-r from-spark-green/80 to-spark-blue/80 text-white font-display font-bold text-sm disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Demo
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## 9. Demo Session Banner

**File:** `src/components/auth/DemoSessionBanner.tsx`

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Clock, X, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getDemoTimeRemaining, formatTimeRemaining } from '@/lib/demo-session';

export function DemoSessionBanner() {
  const router = useRouter();
  const { isDemoMode, endDemoSession, checkDemoStatus } = useAuthStore();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleExpired = useCallback(() => {
    setShowExpiredModal(true);
  }, []);

  const handleExitDemo = useCallback(() => {
    endDemoSession();
    setShowExpiredModal(false);
    router.push('/login');
  }, [endDemoSession, router]);

  // Update timer every second
  useEffect(() => {
    if (!isDemoMode) return;

    const interval = setInterval(() => {
      const valid = checkDemoStatus();
      if (!valid) {
        handleExpired();
        clearInterval(interval);
        return;
      }

      const remaining = getDemoTimeRemaining();
      setTimeRemaining(formatTimeRemaining(remaining));

      // Urgent state when < 5 minutes remain
      setIsUrgent(remaining < 5 * 60 * 1000);

      // Expired
      if (remaining <= 0) {
        handleExpired();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isDemoMode, checkDemoStatus, handleExpired]);

  if (!isDemoMode && !showExpiredModal) return null;

  return (
    <>
      {/* Persistent demo banner — top of viewport */}
      <AnimatePresence>
        {isDemoMode && !dismissed && (
          <motion.div
            className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 text-sm font-body ${
              isUrgent
                ? 'bg-gradient-to-r from-red-900/90 to-orange-900/90 border-b border-red-500/30'
                : 'bg-gradient-to-r from-spark-purple/20 to-spark-blue/20 border-b border-white/10 backdrop-blur-md'
            }`}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-400 animate-pulse' : 'text-spark-green'}`} />
              <span className={isUrgent ? 'text-red-200' : 'text-white/70'}>
                Demo Mode
              </span>
              <span className={`font-data font-bold tabular-nums ${isUrgent ? 'text-red-300' : 'text-spark-green'}`}>
                {timeRemaining}
              </span>
              <span className={isUrgent ? 'text-red-300/60' : 'text-white/40'}>remaining</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/signup')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-spark-purple/20 border border-spark-purple/30 text-spark-purple text-xs font-semibold hover:bg-spark-purple/30 transition-colors"
                aria-label="Create an account to save progress"
              >
                <UserPlus className="w-3 h-3" />
                Create Account
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="text-white/30 hover:text-white/60 transition-colors"
                aria-label="Dismiss demo banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo expired modal */}
      <AnimatePresence>
        {showExpiredModal && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-card rounded-2xl p-8 max-w-sm mx-4 text-center relative overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Chrome bezel border */}
              <div className="absolute inset-0 rounded-2xl p-[1px] pointer-events-none">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-spark-purple/30 via-transparent to-spark-blue/30" />
              </div>

              <div className="text-5xl mb-4">&#9200;</div>
              <h2 className="font-display text-xl font-bold text-white mb-2">
                Demo Session Ended
              </h2>
              <p className="font-body text-sm text-white/60 mb-6">
                Your 1-hour demo has expired. Create a free account to continue
                exploring SparkForge and save your progress!
              </p>

              <div className="space-y-3">
                <motion.button
                  onClick={() => {
                    endDemoSession();
                    setShowExpiredModal(false);
                    router.push('/signup');
                  }}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Create Free Account
                </motion.button>

                <motion.button
                  onClick={handleExitDemo}
                  className="w-full h-10 rounded-xl border border-white/10 text-white/50 font-body text-sm hover:bg-white/5 transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  Return to Login
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

---

## 10. Build Validation — Part A

After creating all files in this part, run:

```bash
npm run build
npx tsc --noEmit
```

### Expected Results

- All new files compile without TypeScript errors
- Auth layout renders with 3D canvas on desktop, CSS particles on mobile
- Demo session utilities properly create/read/clear from localStorage
- Auth store includes demo mode state
- No SSR errors (all 3D components use `dynamic` with `ssr: false`)

### Files Created (Part A Summary)

| # | File | Lines | Purpose |
|---|------|-------|---------|
| 1 | `src/lib/demo-session.ts` | ~65 | Demo session timer utilities |
| 2 | `src/stores/authStore.ts` | ~45 | Updated auth store with demo state |
| 3 | `src/app/api/auth/demo/route.ts` | ~25 | Demo session API endpoint |
| 4 | `src/components/3d/LoginPortal3D.tsx` | ~135 | 3D crystal portal scene |
| 5 | `src/components/3d/LoginParticles3D.tsx` | ~75 | Ambient particle field |
| 6 | `src/app/(auth)/layout.tsx` | ~95 | Enhanced auth layout with 3D |
| 7 | `src/components/auth/DemoLoginButton.tsx` | ~105 | Demo login button + confirm |
| 8 | `src/components/auth/DemoSessionBanner.tsx` | ~165 | Demo timer banner + expiry modal |

### Git Commit (Part A)

```bash
git add -A
git commit -m "Stage 3 Login Enhancement Part A: 3D portal scene, demo session infrastructure, enhanced auth layout"
```

---

*Continued in LOGIN_3D_v3FINAL_PartB.md — Enhanced login page, demo route guards, AuthProvider integration, visual polish*
