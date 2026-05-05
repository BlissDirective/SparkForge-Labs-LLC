'use client';

// ════════════════════════════════════════════════════════════════
// Auth Layout — HTML auth card with 3D portal backdrop
// ════════════════════════════════════════════════════════════════
// Per CLAUDE.md HS-10: 3D crystal portal renders BEHIND the login
// card, not as the login card itself. The R3F Canvas is a fixed
// backdrop and is wrapped in Canvas3DErrorBoundary so a WebGL
// failure (common on lower-end mobile Safari) cannot crash the
// auth experience. The auth form is rendered as standard HTML on
// top of the backdrop and works without WebGL.

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { DemoSessionBanner } from '@/components/auth/DemoSessionBanner';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { SkipLink } from '@/components/shared/SkipLink';
import { Canvas3DErrorBoundary } from '@/components/3d/Canvas3DErrorBoundary';

// Dynamic 3D imports — SSR disabled, lazy-loaded so the HTML form
// is interactive immediately even before the Canvas mounts.
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
        {/* Demo session banner — renders only when in demo mode */}
        <DemoSessionBanner />

        {/* ─── 3D portal backdrop (fixed, behind the form) ─── */}
        {/* Wrapped in Canvas3DErrorBoundary so a WebGL context-loss or
            shader-compile error degrades to the static gradient
            background instead of crashing the route segment. */}
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          aria-hidden="true"
        >
          <Canvas3DErrorBoundary fallback={null}>
            <Suspense fallback={null}>
              <R3FCanvas
                camera={{ position: [0, 0, 3.5], fov: 50 }}
                dpr={[1, 1.5]}
                style={{ background: 'transparent' }}
                gl={{
                  alpha: true,
                  antialias: true,
                  // Default power preference avoids the iOS Safari
                  // rejection that 'high-performance' triggers on
                  // some devices; the backdrop is decorative so we
                  // also tolerate non-accelerated contexts.
                  powerPreference: 'default',
                  failIfMajorPerformanceCaveat: false,
                }}
              >
                <ambientLight intensity={0.15} />
                <directionalLight position={[2, 3, 4]} intensity={0.3} />
                <LoginPortal3D portalColor="#AA66FF" intensity={1.0} />
                <LoginParticles3D count={120} color="#AA66FF" spread={6} />
              </R3FCanvas>
            </Suspense>
          </Canvas3DErrorBoundary>
        </div>

        {/* Skip-link landing target (sr-only). Pages provide their own
            <main> elements; this anchor exists solely so the SkipLink can
            jump past navigation chrome. */}
        <main id="auth-main" tabIndex={-1} className="sr-only">Authentication content</main>

        {/* ─── HTML auth content (above the backdrop) ─── */}
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
          {children}
        </div>

        {/* sr-only accessibility layer — screen readers can navigate */}
        <div className="sr-only" role="navigation" aria-label="Authentication">
          <a href="/login">Log in</a>
          <a href="/signup">Sign up</a>
          <a href="/reset-password">Reset password</a>
          <a href="/terms">Terms of Service</a>
          <a href="/privacy">Privacy Policy</a>
        </div>

        {/* Branding overlay — minimal, above 3D */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-spark-purple to-spark-blue flex items-center justify-center shadow-lg shadow-spark-purple/25">
            <span className="text-xl">⚡</span>
          </div>
          <span className="font-display text-xl font-bold text-white drop-shadow-lg">
            SparkForge
          </span>
        </div>

        {/* Footer */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 text-center">
          <p className="text-white/55 text-xs font-body">
            &copy; {new Date().getFullYear()} SparkForge LLC &middot;{' '}
            <a href="/terms" className="text-white/70 hover:text-white underline decoration-dotted decoration-white/40 underline-offset-2">
              Terms
            </a>
            {' '}&middot;{' '}
            <a href="/privacy" className="text-white/70 hover:text-white underline decoration-dotted decoration-white/40 underline-offset-2">
              Privacy
            </a>
          </p>
        </div>
      </div>
    </AuthProvider>
  );
}
