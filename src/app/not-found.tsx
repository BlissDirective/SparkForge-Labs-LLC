// ════════════════════════════════════════════════════
// 404 PAGE — Cosmic lost-in-space theme
// ════════════════════════════════════════════════════

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-surface-deep">
      <div className="text-center max-w-md">
        <p
          className="font-display text-8xl font-bold text-neon-blue/20 mb-2 select-none"
          aria-hidden="true"
        >
          404
        </p>
        <h1 className="font-display text-3xl font-bold text-white mb-2">
          Lost in Space!
        </h1>
        <p className="font-body text-base text-white/40 mb-8">
          This page has drifted into a black hole.
          Let&apos;s get you back to Mission Control!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-spark-blue to-blue-600 text-white font-display font-bold text-sm hover:shadow-glow-blue transition-shadow text-center"
          >
            Back to Home
          </Link>
          <Link
            href="/labs"
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-display font-bold text-sm hover:bg-white/10 transition-colors text-center"
          >
            Explore Labs
          </Link>
        </div>
      </div>
    </div>
  );
}
