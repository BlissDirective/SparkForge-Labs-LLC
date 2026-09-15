'use client';

// HoloPanel — DOM reading plate projected onto glass (W2).
// TAP §2.3: opaque ≥ 0.85 navy backing; cyan only in the edge zone.
// Steal yaw/origin ideas from PR #164 HoloPanel; do not copy the
// hotspot overlay component.

import type { ReactNode, RefObject } from 'react';
import FocusTrap from 'focus-trap-react';
import type { GlassSlotId } from '@/lib/forge-hub/glassSlots';
import { HOLO_BLEND_CSS_VARS } from '@/lib/forge-hub/holoBlend';
import { useProjectedSlot } from '@/lib/forge-hub/useProjectedSlot';
import { useForgeStore } from '@/stores/sceneStore';

export interface HoloPanelProps {
  slotId: GlassSlotId;
  title: string;
  children: ReactNode;
  /** When true, trap focus inside the plate (modal / whisper later). */
  modal?: boolean;
}

export function HoloPanel({
  slotId,
  title,
  children,
  modal = false,
}: HoloPanelProps) {
  const { ref, style, slot, morphPhase, reading } = useProjectedSlot(slotId);
  const setHovered = useForgeStore((s) => s.setForgeHoveredPanel);
  const setActive = useForgeStore((s) => s.setForgeActivePanel);
  if (!slot.visible) return null;

  const panel = (
    <section
      ref={ref as RefObject<HTMLElement>}
      role="region"
      aria-label={title}
      aria-modal={modal || undefined}
      data-testid={`forge-hub-holo-${slotId}`}
      data-holo-slot={slotId}
      data-reading={reading ? 'true' : 'false'}
      data-morph-phase={morphPhase}
      className="fh-holo-panel"
      style={{ ...HOLO_BLEND_CSS_VARS, ...style }}
      onPointerEnter={() => setHovered(slotId)}
      onPointerLeave={() => setHovered(null)}
      onFocusCapture={() => setActive(slotId)}
      onBlurCapture={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        setActive(null);
      }}
    >
      <div className="fh-holo-panel__edge">
        <div className="fh-holo-panel__plate">
          <header className="fh-holo-panel__head">
            <h2>{title}</h2>
          </header>
          <div className="fh-holo-panel__scroll">{children}</div>
        </div>
      </div>
    </section>
  );

  if (!modal) return panel;

  return (
    <FocusTrap
      focusTrapOptions={{
        allowOutsideClick: true,
        escapeDeactivates: true,
        fallbackFocus: () => ref.current ?? document.body,
      }}
    >
      <div className="fh-holo-panel-trap">{panel}</div>
    </FocusTrap>
  );
}
