// ════════════════════════════════════════════════════
// 404 PAGE — Cosmic "lost in space" identity (DESIGN.md §8/§2)
// Server component: SparkyCore renders as a client island; the
// entrance is a self-contained CSS keyframe so no 'use client' is
// needed here. Reduced-motion disables the entrance.
// ════════════════════════════════════════════════════

import Link from 'next/link';
import { Home, Compass } from 'lucide-react';
import { SparkyCore } from '@/components/sparky/SparkyCore';

export default function NotFound() {
  return (
    <div className="relative flex items-center justify-center min-h-screen p-8 bg-surface-deep overflow-hidden">
      {/* Ambient cosmic glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          width: 'min(560px, 80vw)',
          height: 'min(560px, 80vw)',
          background:
            'radial-gradient(circle, rgba(77,233,255,0.10) 0%, rgba(79,110,247,0.06) 45%, transparent 72%)',
        }}
      />

      <div className="sf-enter relative text-center max-w-md">
        {/* Sparky — decorative, drifted off course */}
        <div aria-hidden="true" className="flex justify-center mb-4">
          <SparkyCore expression="sad" size="xl" />
        </div>

        <p
          className="font-display text-8xl font-bold text-neon-blue/25 mb-1 select-none leading-none"
          aria-hidden="true"
        >
          404
        </p>
        <h1 className="font-display text-3xl font-bold text-white mb-3">
          Lost in Space!
        </h1>
        <p
          className="font-body text-base mb-8 leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.72)' }}
        >
          This page drifted into a black hole. Sparky can&apos;t find it either —
          let&apos;s warp you back to Mission Control.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-display font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            style={{
              background: 'linear-gradient(135deg, #E945F5, #4F6EF7)',
              boxShadow: '0 4px 20px rgba(233,69,245,0.30)',
            }}
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Back to Home
          </Link>
          <Link
            href="/labs"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/15 font-display font-bold text-sm transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            style={{ color: 'rgba(255,255,255,0.8)' }}
          >
            <Compass className="w-4 h-4" aria-hidden="true" />
            Explore Labs
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes sf-404-enter {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: none; }
        }
        .sf-enter { animation: sf-404-enter 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .sf-enter { animation: none; }
        }
      `}</style>
    </div>
  );
}
