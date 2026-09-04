'use client';

import {
  HOTSPOTS,
  circleStyle,
  rectStyle,
  type HotspotId,
} from '@/lib/forge-lab/hotspotMap';

export function HotspotMap({
  calibrate = false,
  onActivate,
}: {
  calibrate?: boolean;
  onActivate: (id: HotspotId) => void;
}) {
  return (
    <div className="fl-z1" role="group" aria-label="Forge lab hotspots">
      {HOTSPOTS.map((spot) => {
        const style =
          spot.kind === 'circle' && spot.circle
            ? circleStyle(spot.circle)
            : spot.rect
              ? rectStyle(spot.rect)
              : undefined;
        return (
          <button
            key={spot.id}
            type="button"
            className={[
              'fl-hotspot',
              spot.kind === 'circle' ? 'fl-hotspot--circle' : '',
              calibrate ? 'is-calibrate' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={style}
            aria-label={spot.label}
            data-hotspot={spot.id}
            onClick={() => onActivate(spot.id)}
          />
        );
      })}
    </div>
  );
}
