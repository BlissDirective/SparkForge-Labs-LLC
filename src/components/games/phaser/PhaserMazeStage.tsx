// ════════════════════════════════════════════════════════════════════════
// PHASER MAZE STAGE — React wrapper for the Treat Trainer maze (Wave 7)
// ════════════════════════════════════════════════════════════════════════
// Mounts the Phaser-4 maze game (client-only) inside the GameShell, mirroring
// the Pixi-stage boundary: the React shell owns layout + a11y; the canvas owns
// play. Phaser is imported dynamically in an effect so it never reaches SSR.
// A DOM d-pad + hint button drive the same scene controls as the keyboard, and
// scene state is published to window.__SPARKFORGE_GAME__ for the Playwright loop.

'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Route } from 'lucide-react';
import { publishScene } from '@/lib/dev/gameInspector';
import { hexNum } from '@/components/games/pixi/primitives';
import type { MazeControls } from './mazeGame';

interface PhaserMazeStageProps {
  /** Bump to force a fresh maze (e.g. on level change). */
  levelKey: string | number;
  cols: number;
  rows: number;
  treats: number;
  labColor: string;
  reducedMotion?: boolean;
  /** score is 0–100 efficiency. */
  onComplete: (score: number, detail: { steps: number; optimal: number }) => void;
}

export default function PhaserMazeStage({
  levelKey, cols, rows, treats, labColor, reducedMotion = false, onComplete,
}: PhaserMazeStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<MazeControls>({ move: () => {}, hint: () => {} });
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [status, setStatus] = useState({ collected: 0, total: treats, steps: 0 });

  useEffect(() => {
    let game: { destroy: (removeCanvas: boolean) => void } | null = null;
    let cancelled = false;

    (async () => {
      const host = hostRef.current;
      if (!host) return;
      const PhaserMod = await import('phaser');
      const Phaser = (PhaserMod as unknown as { default?: typeof PhaserMod }).default ?? PhaserMod;
      const { createMazeGame } = await import('./mazeGame');
      if (cancelled || !hostRef.current) return;

      game = createMazeGame(
        Phaser as typeof import('phaser'),
        hostRef.current,
        { cols, rows, treats, labColor: hexNum(labColor), reducedMotion },
        controlsRef.current,
        {
          onState: (s) => {
            setStatus(s);
            publishScene({ stage: 'phaser-maze', collected: s.collected, total: s.total, steps: s.steps });
          },
          onComplete: (score, detail) => onCompleteRef.current(score, detail),
        },
      );
    })();

    return () => {
      cancelled = true;
      try { game?.destroy(true); } catch { /* already torn down */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelKey]);

  const dpadBtn = 'flex h-12 w-12 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2';
  const dpadStyle = {
    background: `${labColor}1A`,
    color: labColor,
    border: `2px solid ${labColor}40`,
    ['--tw-ring-color' as string]: labColor,
  };

  return (
    <div role="group" aria-label="Maze board">
      <div
        ref={hostRef}
        className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-2xl"
        style={{ aspectRatio: '1 / 1', background: 'linear-gradient(135deg, #0E1428, #0A0F1E)', border: `1px solid ${labColor}30` }}
      />

      <p aria-live="polite" className="sr-only">
        {status.collected} of {status.total} treats collected in {status.steps} steps.
      </p>

      {/* DOM d-pad + hint — keyboard/AT play and on-screen controls. */}
      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="grid grid-cols-3 grid-rows-3 gap-1.5" style={{ width: 'fit-content' }}>
          <span />
          <button type="button" className={dpadBtn} style={dpadStyle} aria-label="Move up" onClick={() => controlsRef.current.move('up')}><ArrowUp className="h-5 w-5" /></button>
          <span />
          <button type="button" className={dpadBtn} style={dpadStyle} aria-label="Move left" onClick={() => controlsRef.current.move('left')}><ArrowLeft className="h-5 w-5" /></button>
          <span />
          <button type="button" className={dpadBtn} style={dpadStyle} aria-label="Move right" onClick={() => controlsRef.current.move('right')}><ArrowRight className="h-5 w-5" /></button>
          <span />
          <button type="button" className={dpadBtn} style={dpadStyle} aria-label="Move down" onClick={() => controlsRef.current.move('down')}><ArrowDown className="h-5 w-5" /></button>
          <span />
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-sm font-bold" style={{ color: labColor }}>
            {status.collected} / {status.total} treats · {status.steps} steps
          </span>
          <button
            type="button"
            className="flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={dpadStyle}
            aria-label="Show the best path to the nearest treat"
            onClick={() => controlsRef.current.hint()}
          >
            <Route className="h-4 w-4" /> Plan path
          </button>
          <span className="text-xs" style={{ color: '#8C94AC' }}>Arrow keys or WASD also move.</span>
        </div>
      </div>
    </div>
  );
}
