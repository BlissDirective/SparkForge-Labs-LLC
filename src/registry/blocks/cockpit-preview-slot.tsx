'use client';

/**
 * CockpitPreviewSlot — drop-in mini cockpit scene for marketing.
 * ════════════════════════════════════════════════════════════════════
 *
 * Purpose for AI design tools (read src/registry/README.md first):
 *   A miniature, non-interactive 3D cockpit scene (~50K tris, low DPR)
 *   suitable for marketing / pricing pages where the visitor can see
 *   "what they'd be using" before they sign up.
 *
 *   This slot wraps the underlying CockpitPreview3D in its own
 *   <Canvas>, so consumers don't need to know about R3F to use it.
 *   Just drop it into a fixed-aspect-ratio container.
 *
 * Recommended container:
 *   <div className="relative aspect-[16/10] rounded-2xl overflow-hidden">
 *     <CockpitPreviewSlot />
 *   </div>
 *
 * Status lane: 🟢 Core / Preserve.
 * ════════════════════════════════════════════════════════════════════ */

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const CockpitPreview3D = dynamic(
  () => import('@/components/3d/CockpitPreview3D'),
  { ssr: false },
);

const R3FCanvas = dynamic(
  () => import('@react-three/fiber').then((m) => m.Canvas),
  { ssr: false },
);

export interface CockpitPreviewSlotProps {
  /** Optional className passed through to the wrapping div. */
  className?: string;
  /** Background color shown while the canvas hydrates. Default deep navy. */
  background?: string;
}

export function CockpitPreviewSlot({
  className = 'absolute inset-0',
  background = '#060A12',
}: CockpitPreviewSlotProps) {
  return (
    <div className={className} style={{ background }}>
      <Suspense fallback={null}>
        <R3FCanvas
          camera={{ position: [0, 0.3, 1.8], fov: 50 }}
          dpr={[1, 1.5]}
          style={{ background }}
          gl={{ alpha: false, antialias: true, powerPreference: 'default' }}
        >
          <CockpitPreview3D />
        </R3FCanvas>
      </Suspense>
    </div>
  );
}

export default CockpitPreviewSlot;
