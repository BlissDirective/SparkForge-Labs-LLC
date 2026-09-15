'use client';

// Poster fallback when the canvas cannot run (no WebGPU/WebGL2, or
// Canvas3DErrorBoundary catch). Display still only — never the Sparky
// lock, never a regenerated plate. CSS background so LCP stays HTML
// text and we do not run the lock through next/image.
//
// W1-03: optional CSS glass overlays (lock-pose trio) with the same
// panelBreathe token. Reduced motion: 200 ms crossfade, no loop.

import { FORGE_HUB_DISPLAY_STILL } from '@/config/forgeHub';
import { HOLO_BLEND_CSS_VARS } from '@/lib/forge-hub/holoBlend';
import { cssGlassStyle } from '@/lib/forge-hub/glassSlots';
import { glassSlotsForView } from '@/lib/forge-hub/layouts';
import { useForgeStore } from '@/stores/sceneStore';

interface ForgePosterFallbackProps {
  className?: string;
  withGlass?: boolean;
}

function PosterGlassOverlays() {
  const mode = useForgeStore((s) => s.forge.mode);
  const poseLock = useForgeStore((s) => s.forge.poseLock);
  const slots = glassSlotsForView(mode, poseLock);
  return (
    <div className="forge-hub-glass-stage" data-testid="forge-hub-glass-stage">
      {slots.map((slot) => (
        <div
          key={slot.id}
          data-testid={`forge-hub-glass-${slot.id}`}
          data-forge-glass-slot={slot.id}
          className="forge-hub-glass"
          aria-hidden="true"
          style={cssGlassStyle(slot)}
        />
      ))}
    </div>
  );
}

export function ForgePosterFallback({
  className,
  withGlass = false,
}: ForgePosterFallbackProps) {
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
        ...HOLO_BLEND_CSS_VARS,
        // Slow plate breathe — TAP W1 poster fallback. No filter/transform
        // on html/body/app-shell (OVERLAY-CRIT-001); this node is the
        // poster itself, not a wrapper around the app.
        animation: 'forge-hub-poster-breathe 8s ease-in-out infinite',
      }}
    >
      {withGlass ? <PosterGlassOverlays /> : null}
    </div>
  );
}
