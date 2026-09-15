'use client';

// Poster fallback when the canvas cannot run (no WebGPU/WebGL2, or
// Canvas3DErrorBoundary catch). Display still only — never the Sparky
// lock, never a regenerated plate. CSS background so LCP stays HTML
// text and we do not run the lock through next/image.

import { FORGE_HUB_DISPLAY_STILL } from '@/config/forgeHub';

interface ForgePosterFallbackProps {
  className?: string;
}

export function ForgePosterFallback({ className }: ForgePosterFallbackProps) {
  return (
    <div
      aria-hidden="true"
      data-forge-stage="poster"
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${FORGE_HUB_DISPLAY_STILL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        // Slow breathe — TAP W1 poster fallback. No filter/transform
        // on html/body/app-shell (OVERLAY-CRIT-001); this node is the
        // poster itself, not a wrapper around the app.
        animation: 'forge-hub-poster-breathe 8s ease-in-out infinite',
      }}
    />
  );
}
