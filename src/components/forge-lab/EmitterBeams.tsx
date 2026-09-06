'use client';

import { FORGE_CORE } from '@/lib/forge-lab/hotspotMap';
import type { LiveBeam } from '@/lib/forge-lab/layouts';

/** SVG interconnects from the forge core to each live panel. */
export function EmitterBeams({ beams }: { beams: readonly LiveBeam[] }) {
  return (
    <svg
      className="fl-beams"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      data-beams={beams.map((b) => b.id).join(' ')}
    >
      {beams.map((beam) => (
        <g key={beam.id} data-beam={beam.id}>
          <line
            className="fl-beam fl-beam--glow"
            x1={beam.fromX}
            y1={beam.fromY}
            x2={beam.x}
            y2={beam.y}
          />
          <line
            className="fl-beam"
            x1={beam.fromX}
            y1={beam.fromY}
            x2={beam.x}
            y2={beam.y}
          />
          <circle className="fl-beam__node" cx={beam.x} cy={beam.y} r={0.55} />
        </g>
      ))}
      <circle
        className="fl-beam__node fl-beam__node--core"
        cx={FORGE_CORE.cx}
        cy={FORGE_CORE.cy}
        r={0.7}
      />
    </svg>
  );
}
