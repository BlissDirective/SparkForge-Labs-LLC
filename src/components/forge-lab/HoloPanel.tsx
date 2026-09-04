'use client';

import type { CSSProperties, ReactNode } from 'react';
import {
  FORGE_CORE,
  LEFT_HOLO_SLOT,
  RIGHT_HOLO_SLOT,
  rectStyle,
  type PercentRect,
} from '@/lib/forge-lab/hotspotMap';
import type { PortalPhase } from '@/lib/forge-lab/portalMachine';
import { isPortalOpen } from '@/lib/forge-lab/portalMachine';

export function HoloPanel({
  side,
  phase,
  title,
  children,
}: {
  side: 'left' | 'right';
  phase: PortalPhase;
  title: string;
  children: ReactNode;
}) {
  const slot: PercentRect = side === 'left' ? LEFT_HOLO_SLOT : RIGHT_HOLO_SLOT;
  const open = isPortalOpen(phase);
  const fromX = FORGE_CORE.cx - (slot.left + slot.width / 2);
  const fromY = FORGE_CORE.cy - (slot.top + slot.height / 2);

  const style: CSSProperties = {
    ...rectStyle(slot),
    ['--fl-from-x' as string]: `${fromX * 1.4}%`,
    ['--fl-from-y' as string]: `${fromY * 1.4}%`,
  };

  return (
    <aside
      className={`fl-panel is-${phase}`}
      style={style}
      data-side={side}
      aria-hidden={!open}
      hidden={!open}
    >
      <header className="fl-panel__head">
        <h2>{title}</h2>
      </header>
      {children}
    </aside>
  );
}
