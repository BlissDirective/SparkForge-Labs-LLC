'use client';

import { circleStyle, FORGE_CORE } from '@/lib/forge-lab/hotspotMap';
import type { PortalPhase } from '@/lib/forge-lab/portalMachine';

/** Live SF hologram twin — sits on the plate core, does not replace it. */
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
      <svg className="fl-core__glyph" viewBox="0 0 120 120" fill="none">
        <path
          d="M38 22 H78 V36 H50 V50 H76 V64 H50 V86 H36 V64 H22 V50 H36 V36 H22 V22 H38 Z"
          fill="url(#fl-sf)"
          stroke="#e8fdff"
          strokeWidth="1.4"
        />
        <path
          d="M70 40 H98 V52 H82 V64 H96 V76 H82 V98 H68 V40 Z"
          fill="url(#fl-sf)"
          stroke="#e8fdff"
          strokeWidth="1.4"
        />
        <defs>
          <linearGradient id="fl-sf" x1="20" y1="16" x2="100" y2="104">
            <stop stopColor="#e8fdff" />
            <stop offset="0.45" stopColor="#00d4ff" />
            <stop offset="1" stopColor="#0077aa" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
