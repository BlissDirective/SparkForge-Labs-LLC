'use client';

// DOM overlay hook: static registry rects before the canvas projects,
// then per-frame screen quads from glass mesh corners (TAP §2.2).

import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type RefObject,
} from 'react';
import { cssGlassStyle, slotOrigin, type GlassSlotId } from './glassSlots';
import { layoutSlotForView, type LayoutSlot } from './layouts';
import { liveDirectorSlot } from './director/targets';
import {
  cssYawTransform,
  morphPhaseFromProgress,
  type MorphPhase,
} from './projectionMath';
import { getSlotProjection } from './slotAnchors';
import { useForgeStore } from '@/stores/sceneStore';

export interface ProjectedSlot {
  ref: RefObject<HTMLElement | null>;
  style: CSSProperties;
  slot: LayoutSlot;
  morphPhase: MorphPhase;
  reading: boolean;
}

export function useProjectedSlot(slotId: GlassSlotId): ProjectedSlot {
  const ref = useRef<HTMLElement | null>(null);
  const mode = useForgeStore((s) => s.forge.mode);
  const poseLock = useForgeStore((s) => s.forge.poseLock);
  const morphProgress = useForgeStore((s) => s.forge.morphProgress);
  const live = liveDirectorSlot(slotId, mode, poseLock);
  const slot = live ?? layoutSlotForView(slotId, mode, poseLock);
  const morphPhase = morphPhaseFromProgress(morphProgress);
  const reading = slot.reading;
  const hidden = !slot.visible || poseLock || !live;

  const style: CSSProperties = hidden
    ? { display: 'none' }
    : {
        ...cssGlassStyle(slot),
        display: 'flex',
        transform: reading
          ? 'none'
          : cssYawTransform(slot.yaw ?? 0),
      };

  useLayoutEffect(() => {
    if (hidden) return;
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      const live = getSlotProjection(slotId);
      if (el && live?.visible) {
        el.style.display = 'flex';
        el.style.left = `${live.left}px`;
        el.style.top = `${live.top}px`;
        el.style.width = `${live.width}px`;
        el.style.height = `${live.height}px`;
        el.style.transformOrigin = slotOrigin({
          left: 0,
          top: 0,
          width: 1,
          height: 1,
          yaw: live.reading ? 0 : live.yawDeg,
        });
        el.style.transform = live.reading
          ? 'none'
          : cssYawTransform(live.yawDeg);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hidden, slotId]);

  return { ref, style, slot, morphPhase, reading };
}
