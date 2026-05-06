'use client';

// ════════════════════════════════════════════════════════════════
// Auth Layout — clean static backdrop (3D portal removed per UX audit)
// ════════════════════════════════════════════════════════════════
// The decorative R3F portal/blob/ring + particle field were retired
// because they did not match the design intent at runtime and were
// distracting the user from the auth form. The auth surface is now
// a dark cosmic gradient with a single soft accent — the form is the
// focal point.

import { DemoSessionBanner } from '@/components/auth/DemoSessionBanner';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { SkipLink } from '@/components/shared/SkipLink';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SkipLink targetId="auth-main" />
      <div className="min-h-screen bg-surface-deep bg-cosmic-dark relative overflow-hidden">
        {/* Demo session banner — renders only when in demo mode */}
        <DemoSessionBanner />

        {/* Static cosmic accent — single radial wash, no animation,
            no WebGL. Decorative only. */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_rgba(170,102,255,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(0,187,255,0.10),_transparent_55%)]"
        />

        {/* Skip-link landing target (sr-only). Pages provide their own
            <main> elements; this anchor exists solely so the SkipLink can
            jump past navigation chrome. */}
        <main id="auth-main" tabIndex={-1} className="sr-only">Authentication content</main>

        {/* ─── HTML auth content ─── */}
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4 pt-24 pb-16">
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

        {/* Branding overlay — minimal, above backdrop */}
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
