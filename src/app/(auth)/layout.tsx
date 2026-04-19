'use client';

// ════════════════════════════════════════════════════════════════
// Auth Layout — 3D Cockpit-Style Auth Experience (Phase 3)
// ════════════════════════════════════════════════════════════════
// Renders a full-canvas 3D auth scene with LoginPortal3D backdrop.
// Auth form panels (LoginPanel3D, SignupPanel3D) render as 3D groups
// inside the same Canvas. HTML is sr-only for accessibility.
//
// Architecture: Own R3F Canvas (not CockpitCanvas — user isn't auth'd).
// Design tokens from cockpitDesignTokens ensure visual consistency.

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { DemoSessionBanner } from '@/components/auth/DemoSessionBanner';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { SkipLink } from '@/components/shared/SkipLink';

// Dynamic 3D imports — SSR disabled
const LoginPortal3D = dynamic(
  () => import('@/components/3d/LoginPortal3D'),
  { ssr: false }
);

const LoginParticles3D = dynamic(
  () => import('@/components/3d/LoginParticles3D'),
  { ssr: false }
);

const R3FCanvas = dynamic(
  () => import('@react-three/fiber').then((mod) => mod.Canvas),
  { ssr: false }
);

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SkipLink targetId="auth-main" />
      <div className="min-h-screen bg-surface-deep bg-cosmic-dark relative overflow-hidden">
        {/* UX-HIGH-001: Skip-link target for auth pages. */}
        <main id="auth-main" tabIndex={-1} className="sr-only">Authentication content</main>
        {/* Demo session banner — renders only when in demo mode */}
        <DemoSessionBanner />

        {/* Full-screen 3D Canvas — portal backdrop */}
        <div className="fixed inset-0 z-0">
          <Suspense fallback={null}>
            <R3FCanvas
              camera={{ position: [0, 0, 3.5], fov: 50 }}
              dpr={[1, 2]}
              style={{ background: '#0A0E16' }}
              gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
            >
              <ambientLight intensity={0.15} />
              <directionalLight position={[2, 3, 4]} intensity={0.3} />
              <LoginPortal3D portalColor="#AA66FF" intensity={1.0} />
              <LoginParticles3D count={120} color="#AA66FF" spread={6} />

              {/* Auth form panels render as 3D children */}
              <Suspense fallback={null}>
                {children}
              </Suspense>
            </R3FCanvas>
          </Suspense>
        </div>

        {/* sr-only accessibility layer — screen readers can navigate */}
        <div className="sr-only" role="navigation" aria-label="Authentication">
          <a href="/login">Log in</a>
          <a href="/signup">Sign up</a>
          <a href="/reset-password">Reset password</a>
        </div>

        {/* Branding overlay — minimal, above 3D */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-spark-purple to-spark-blue flex items-center justify-center shadow-lg shadow-spark-purple/25">
            <span className="text-xl">⚡</span>
          </div>
          <span className="font-display text-xl font-bold text-white drop-shadow-lg">
            SparkForge
          </span>
        </div>

        {/* Footer */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <p className="text-white/20 text-xs font-body text-center">
            &copy; 2026 BlissDirective &middot; SparkForge
          </p>
        </div>
      </div>
    </AuthProvider>
  );
}
