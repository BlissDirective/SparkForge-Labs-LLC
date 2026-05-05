'use client';

// ════════════════════════════════════════════════════════════════
// Auth Layout — v4 Cosmic Theme (HTML/CSS)
// ════════════════════════════════════════════════════════════════
// Modern glass-morphism auth experience replacing 3D panels.
// Faster load, better accessibility, mobile-first design.
// Split layout: cosmic illustration left, form right (on desktop).

import { Suspense } from 'react';
import Link from 'next/link';
import { DemoSessionBanner } from '@/components/auth/DemoSessionBanner';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { SkipLink } from '@/components/shared/SkipLink';
import { StarField } from '@/components/ui/star-field';
import { Sparkles } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SkipLink targetId="auth-main" />
      <div className="min-h-screen bg-surface-base relative overflow-hidden">
        {/* Cosmic background */}
        <StarField starCount={150} showNebula />

        {/* Demo session banner — renders only when in demo mode */}
        <DemoSessionBanner />

        {/* Main content */}
        <div className="relative z-10 min-h-screen flex">
          {/* Left panel - Cosmic illustration (hidden on mobile) */}
          <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative items-center justify-center p-12">
            {/* Decorative elements */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Large gradient orb */}
              <div
                className="w-[500px] h-[500px] rounded-full animate-cosmic-float"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, rgba(182,123,255,0.3), rgba(0,212,255,0.2), transparent 70%)',
                  filter: 'blur(40px)',
                }}
                aria-hidden="true"
              />
            </div>

            {/* Floating rings */}
            <div
              className="absolute w-72 h-72 rounded-full border border-white/10 animate-cosmic-orbit"
              style={{ animationDuration: '30s' }}
              aria-hidden="true"
            />
            <div
              className="absolute w-96 h-96 rounded-full border border-neon-purple/20 animate-cosmic-orbit"
              style={{ animationDuration: '45s', animationDirection: 'reverse' }}
              aria-hidden="true"
            />

            {/* Central content */}
            <div className="relative z-10 text-center max-w-md">
              {/* Robot/mascot illustration placeholder */}
              <div className="relative w-48 h-48 mx-auto mb-8">
                <div
                  className="absolute inset-0 rounded-3xl rotate-6"
                  style={{
                    background: 'linear-gradient(135deg, rgba(182,123,255,0.3), rgba(0,212,255,0.3))',
                    filter: 'blur(20px)',
                  }}
                  aria-hidden="true"
                />
                <div
                  className="relative w-full h-full rounded-3xl bg-surface-card/50 backdrop-blur-xl border border-white/10 flex items-center justify-center"
                >
                  <Sparkles className="w-20 h-20 text-neon-purple" />
                </div>
              </div>

              <h2 className="font-display text-3xl font-bold text-text-primary mb-4">
                Welcome to SparkForge
              </h2>
              <p className="text-text-secondary leading-relaxed">
                The AI Learning Lab where curious minds ages 7-16 explore artificial intelligence 
                through games, experiments, and hands-on adventures.
              </p>
            </div>
          </div>

          {/* Right panel - Form */}
          <main
            id="auth-main"
            className="flex-1 flex items-center justify-center p-6 md:p-12"
          >
            <div className="w-full max-w-md">
              {/* Mobile logo */}
              <div className="lg:hidden flex justify-center mb-8">
                <Link href="/" className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center shadow-lg shadow-neon-purple/25">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-display text-xl font-bold text-text-primary">
                    SparkForge
                  </span>
                </Link>
              </div>

              {/* Auth form content */}
              <Suspense
                fallback={
                  <div className="animate-pulse">
                    <div className="h-8 bg-white/5 rounded-lg w-1/2 mb-4" />
                    <div className="h-12 bg-white/5 rounded-xl mb-4" />
                    <div className="h-12 bg-white/5 rounded-xl mb-4" />
                    <div className="h-12 bg-white/5 rounded-xl" />
                  </div>
                }
              >
                {children}
              </Suspense>
            </div>
          </main>
        </div>

        {/* Desktop branding */}
        <div className="hidden lg:flex fixed top-6 left-8 z-20 items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center shadow-lg shadow-neon-purple/25 transition-transform group-hover:scale-105">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-text-primary">
              SparkForge
            </span>
          </Link>
        </div>

        {/* Footer */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 text-center">
          <p className="text-text-muted text-xs font-body">
            &copy; {new Date().getFullYear()} SparkForge LLC &middot;{' '}
            <Link
              href="/terms"
              className="text-text-secondary hover:text-text-primary underline decoration-dotted decoration-white/20 underline-offset-2 transition-colors"
            >
              Terms
            </Link>
            {' '}&middot;{' '}
            <Link
              href="/privacy"
              className="text-text-secondary hover:text-text-primary underline decoration-dotted decoration-white/20 underline-offset-2 transition-colors"
            >
              Privacy
            </Link>
          </p>
        </div>
      </div>
    </AuthProvider>
  );
}
