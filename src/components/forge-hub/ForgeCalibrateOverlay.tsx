'use client';

/**
 * `?calibrate=1` — layout-slot + projection debug overlay.
 * Registry outlines are percent-of-plate (PR #164 re-spec, not the
 * hotspot hit map). Yellow boxes follow live `getSlotProjection`
 * quads when the canvas projector is running.
 */

import { useEffect, useState } from 'react';
import { FORGE_CORE } from '@/lib/forge-hub/coreMap';
import {
  calibrateMorphPhase,
  calibrateSlotsForMode,
  fmtCalibrateNum,
  LAYOUT_MORPH_MS,
} from '@/lib/forge-hub/devHud';
import { cssGlassStyle } from '@/lib/forge-hub/glassSlots';
import {
  getSlotProjection,
  type ProjectedSlotQuad,
} from '@/lib/forge-hub/slotAnchors';
import type { GlassSlotId } from '@/lib/forge-hub/glassSlots';
import { useForgeStore } from '@/stores/sceneStore';

const SLOT_IDS: readonly GlassSlotId[] = ['holoL', 'holoC', 'holoR'];

interface ForgeCalibrateOverlayProps {
  layout?: 'stage' | 'viewport';
}

export function ForgeCalibrateOverlay({
  layout = 'stage',
}: ForgeCalibrateOverlayProps) {
  const mode = useForgeStore((s) => s.forge.mode);
  const morphProgress = useForgeStore((s) => s.forge.morphProgress);
  const directorId = useForgeStore((s) => s.forge.directorId);
  const slots = calibrateSlotsForMode(mode);
  const morphPhase = calibrateMorphPhase(morphProgress);
  const [projections, setProjections] = useState<
    Partial<Record<GlassSlotId, ProjectedSlotQuad>>
  >({});

  useEffect(() => {
    if (layout !== 'viewport') {
      setProjections({});
      return;
    }
    let raf = 0;
    const tick = () => {
      const next: Partial<Record<GlassSlotId, ProjectedSlotQuad>> = {};
      for (const id of SLOT_IDS) {
        const live = getSlotProjection(id);
        if (live?.visible) next[id] = live;
      }
      setProjections(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [layout, mode]);

  return (
    <div
      className="fh-calibrate"
      data-testid="forge-hub-calibrate"
      data-forge-calibrate="1"
      data-forge-calibrate-layout={layout}
      aria-hidden="true"
    >
      <div className="forge-hub-glass-stage fh-calibrate__plate">
        <div
          className="fh-calibrate__core"
          style={{
            left: `${FORGE_CORE.cx - FORGE_CORE.r}%`,
            top: `${FORGE_CORE.cy - FORGE_CORE.r}%`,
            width: `${FORGE_CORE.r * 2}%`,
            height: `${FORGE_CORE.r * 2}%`,
          }}
          data-forge-calibrate-core="1"
        />
        {slots.map((slot) => (
          <div
            key={slot.id}
            className="fh-calibrate__slot"
            data-forge-calibrate-slot={slot.id}
            data-visible={slot.visible ? 'true' : 'false'}
            data-reading={slot.reading ? 'true' : 'false'}
            style={cssGlassStyle(slot)}
          >
            <span className="fh-calibrate__label">
              {slot.id} {fmtCalibrateNum(slot.left)}/{fmtCalibrateNum(slot.top)}{' '}
              {fmtCalibrateNum(slot.width)}×{fmtCalibrateNum(slot.height)} yaw
              {fmtCalibrateNum(slot.yaw, 0)}° {slot.reading ? 'read' : 'glass'}
              {slot.visible ? '' : ' hidden'}
            </span>
          </div>
        ))}
      </div>
      {layout === 'viewport'
        ? SLOT_IDS.map((id) => {
            const quad = projections[id];
            if (!quad) return null;
            return (
              <div
                key={`proj-${id}`}
                className="fh-calibrate__proj"
                data-forge-calibrate-proj={id}
                style={{
                  left: quad.left,
                  top: quad.top,
                  width: quad.width,
                  height: quad.height,
                }}
              />
            );
          })
        : null}
      <p className="fh-calibrate__hud" data-testid="forge-hub-calibrate-hud">
        {mode} · morph {fmtCalibrateNum(morphProgress, 2)} {morphPhase} ·
        slotSlide {LAYOUT_MORPH_MS}ms · {directorId ?? 'idle'}
      </p>
    </div>
  );
}
