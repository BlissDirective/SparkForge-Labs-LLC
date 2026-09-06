'use client';

import { circleStyle, FORGE_CORE } from '@/lib/forge-lab/hotspotMap';
import type { PortalPhase } from '@/lib/forge-lab/portalMachine';

/**
 * Decorative core twin — rings only.
 * The plate already paints the cyan SF monogram; do NOT overlay a second glyph
 * (that showed as white block symbols on top of SF).
 */
export function ForgeCore({ phase }: { phase: PortalPhase }) {
  return (
    <div
      className={`fl-core is-${phase}`}
      style={circleStyle(FORGE_CORE)}
      aria-hidden="true"
    >
      <span className="fl-core__ring" />
      <span className="fl-core__ring fl-core__ring--dash" />
      <span className="fl-core__ring fl-core__ring--inner" />
    </div>
  );
}
