// ════════════════════════════════════════════════════════════════════════
// PIXI GAME STAGE — reusable canvas shell for all Pixi archetypes (Phase C)
// ════════════════════════════════════════════════════════════════════════
// Extracted from the Phase-B Sort the Toy Box proof. Owns everything every
// archetype needs so a scene only has to draw:
//   • responsive sizing (ResizeObserver → measured width/height)
//   • a transparent, antialiased, DPR-aware <Application>
//   • the Frost-Prismatic framed surface
//   • the a11y boundary (doc §2.3): canvas is opaque to the a11y tree, so
//     scenes pass an `a11y` DOM fallback + an aria-live `status` string
//   • the dev inspector hook (window.__SPARKFORGE_GAME__) for the
//     Playwright loop
//
// A scene is supplied as a render function receiving the measured dims:
//   <PixiGameStage ...>{({ width, height }) => <MyScene .../>}</PixiGameStage>

'use client';

import { useRef, useState, useEffect, type ReactNode } from 'react';
import { Application } from '@pixi/react';
import './primitives';
import { publishScene } from '@/lib/dev/gameInspector';

const MIN_W = 320;

export interface StageDims { width: number; height: number; }

interface PixiGameStageProps {
  labColor: string;
  ariaLabel: string;
  height?: number;
  children: (dims: StageDims) => ReactNode;
  /** DOM fallback (keyboard / AT path) rendered below the canvas. */
  a11y?: ReactNode;
  /** aria-live status line announcing scene progress. */
  status?: string;
  /** Scene state surfaced to window.__SPARKFORGE_GAME__ in dev. */
  inspector?: Record<string, unknown>;
}

export default function PixiGameStage({
  labColor, ariaLabel, height = 420, children, a11y, status, inspector,
}: PixiGameStageProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: height });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cw = entries[0]?.contentRect.width ?? 0;
      setSize({ w: Math.max(MIN_W, Math.floor(cw)), h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  // Publish scene state for the Playwright loop. Keyed on a stable
  // serialization so we don't republish every render.
  const inspectorKey = inspector ? JSON.stringify(inspector) : '';
  useEffect(() => {
    if (inspectorKey) publishScene(JSON.parse(inspectorKey));
  }, [inspectorKey]);

  return (
    <div role="group" aria-label={ariaLabel}>
      <div
        ref={wrapRef}
        className="relative w-full overflow-hidden rounded-2xl"
        style={{ height, background: 'linear-gradient(135deg, #0E1428, #0A0F1E)', border: `1px solid ${labColor}30` }}
      >
        {size.w > 0 && (
          <Application
            key={`${size.w}x${size.h}`}
            width={size.w}
            height={size.h}
            backgroundAlpha={0}
            antialias
            resolution={typeof window !== 'undefined' ? window.devicePixelRatio : 1}
            autoDensity
          >
            {children({ width: size.w, height: size.h })}
          </Application>
        )}
      </div>

      {status && <p aria-live="polite" className="sr-only">{status}</p>}
      {a11y && <div className="mt-3">{a11y}</div>}
    </div>
  );
}
