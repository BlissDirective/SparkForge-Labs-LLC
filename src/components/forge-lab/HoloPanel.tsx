'use client';

import type { CSSProperties, ReactNode } from 'react';
import { FORGE_CORE, dockSlotStyle, type PercentRect } from '@/lib/forge-lab/hotspotMap';

export function HoloPanel({
  slot,
  side,
  title,
  open,
  children,
}: {
  slot: PercentRect;
  side: 'left' | 'right' | 'center';
  title: string;
  open: boolean;
  children: ReactNode;
}) {
  const fromX = FORGE_CORE.cx - (slot.left + slot.width / 2);
  const fromY = FORGE_CORE.cy - (slot.top + slot.height / 2);
  const yaw = slot.yaw ?? 0;
  const dock = dockSlotStyle(slot);

  const style: CSSProperties = {
    ...dock,
    ['--fl-from-x' as string]: `${fromX * 1.4}%`,
    ['--fl-from-y' as string]: `${fromY * 1.4}%`,
    ['--fl-yaw' as string]: `${yaw}deg`,
    ['--fl-origin' as string]: dock.transformOrigin,
  };

  return (
    <section
      className={`fl-panel${open ? ' is-open' : ''}`}
      style={style}
      data-side={side}
      data-yaw={yaw}
      aria-hidden={!open}
      hidden={!open}
    >
      <header className="fl-panel__head">
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}
