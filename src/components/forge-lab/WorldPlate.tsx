'use client';

import { OptimizedImage } from '@/components/shared/OptimizedImage';
import {
  PLATE_HEIGHT_PX,
  PLATE_WIDTH_PX,
  WORLD_MEDIA,
} from '@/lib/forge-lab/hotspotMap';
import type { PortalPhase } from '@/lib/forge-lab/portalMachine';

const LAYERS: Array<{ id: PortalPhase | 'locked'; src: string }> = [
  { id: 'locked', src: WORLD_MEDIA.locked },
  { id: 'idle', src: WORLD_MEDIA.keyframes.idle },
  { id: 'charge', src: WORLD_MEDIA.keyframes.charge },
  { id: 'emit', src: WORLD_MEDIA.keyframes.emit },
  { id: 'docked', src: WORLD_MEDIA.keyframes.docked },
];

export function WorldPlate({ phase }: { phase: PortalPhase }) {
  const active = phase === 'idle' ? 'locked' : phase;

  return (
    <div className="fl-z0 fl-plate" aria-hidden="true">
      {LAYERS.map((layer, i) => (
        <div
          key={layer.id}
          className={layer.id === active ? 'fl-plate__layer is-on' : 'fl-plate__layer'}
        >
          <OptimizedImage
            src={layer.src}
            alt=""
            fill
            priority={i === 0}
            quality={82}
            sizes="100vw"
            style={{ objectFit: 'contain', objectPosition: 'center' }}
          />
        </div>
      ))}
      {/* Looping world video — still plates until an encode lands. */}
      {WORLD_MEDIA.loopVideo ? (
        <video
          className="fl-plate__layer"
          poster={WORLD_MEDIA.locked}
          src={WORLD_MEDIA.loopVideo}
          autoPlay
          muted
          loop
          playsInline
          width={PLATE_WIDTH_PX}
          height={PLATE_HEIGHT_PX}
        />
      ) : null}
    </div>
  );
}
