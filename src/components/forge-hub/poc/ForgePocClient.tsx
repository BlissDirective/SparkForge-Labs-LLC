'use client';

// Forge Stage POC — HUD + controls. Owns the DOM overlay and a mutable
// control/readout bridge the R3F scene reads each frame (so dragging the
// scrubber or toggling options never re-renders React). One `stage`
// scalar (0 welcome · 0.5 hub · 1 playStage) morphs all five objects.

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { POC_STAGE_VALUE, stageNameFor } from '@/lib/forge-hub/poc/pocStage';
import type { PocState, PocReadoutRefs } from './ForgePocStage';

const ForgePocStage = dynamic(
  () => import('./ForgePocStage').then((m) => m.ForgePocStage),
  { ssr: false },
);

type Mode = 'welcome' | 'hub' | 'play' | null;

export function ForgePocClient() {
  const stateRef = useRef<PocState>({
    target: POC_STAGE_VALUE.hub,
    stage: POC_STAGE_VALUE.hub,
    auto: false,
    beams: true,
    rm: false,
    baked: false,
    dragging: false,
  });

  const readouts: PocReadoutRefs = {
    stage: useRef<HTMLElement | null>(null),
    cw: useRef<HTMLElement | null>(null),
    side: useRef<HTMLElement | null>(null),
    emit: useRef<HTMLElement | null>(null),
    beam: useRef<HTMLElement | null>(null),
    dim: useRef<HTMLElement | null>(null),
    slider: useRef<HTMLInputElement | null>(null),
  };

  const [mode, setMode] = useState<Mode>('hub');
  const [auto, setAuto] = useState(false);
  const [beams, setBeams] = useState(true);
  const [rm, setRm] = useState(false);
  const [baked, setBaked] = useState(false);

  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (m.matches) {
      setRm(true);
      stateRef.current.rm = true;
    }
  }, []);

  const goto = useCallback((v: number, m: Mode) => {
    stateRef.current.target = v;
    stateRef.current.auto = false;
    setAuto(false);
    setMode(m);
  }, []);

  const onScrub = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const v = parseFloat((e.target as HTMLInputElement).value);
    stateRef.current.dragging = true;
    stateRef.current.stage = v;
    stateRef.current.target = v;
    stateRef.current.auto = false;
    setAuto(false);
    setMode(stageNameFor(v));
  }, []);

  const btn = (m: Mode) =>
    `flex-1 min-w-[96px] rounded-[10px] border px-3 py-2.5 text-[12.5px] font-semibold transition ${
      mode === m
        ? 'border-cyan-300 bg-cyan-300/15 text-white shadow-[0_0_20px_-6px_#5fe6ff]'
        : 'border-cyan-200/20 bg-white/[0.04] text-cyan-50 hover:border-cyan-200/40'
    }`;

  const chk =
    'inline-flex cursor-pointer select-none items-center gap-2 rounded-[9px] border border-cyan-200/20 bg-white/[0.04] px-2.5 py-2 text-[11px] font-semibold text-cyan-100/80';

  return (
    <div className="absolute inset-0">
      <ForgePocStage stateRef={stateRef} readouts={readouts} />

      {/* readout — one clock → all objects */}
      <div className="pointer-events-none absolute right-4 top-4 hidden min-w-[176px] rounded-xl border border-cyan-200/20 bg-[#0d1319]/75 p-3 font-mono text-[11px] leading-6 text-cyan-100/70 backdrop-blur-sm sm:block">
        <div className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-cyan-50">
          one clock → all objects
        </div>
        {(
          [
            ['stage', readouts.stage],
            ['screen C w', readouts.cw],
            ['side α', readouts.side],
            ['emitter', readouts.emit],
            ['beams', readouts.beam],
            ['room dim', readouts.dim],
          ] as const
        ).map(([label, ref]) => (
          <div key={label} className="flex justify-between gap-4">
            <span>{label}</span>
            <b ref={ref} className="font-semibold text-cyan-300">
              —
            </b>
          </div>
        ))}
      </div>

      {/* control dock */}
      <div className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+16px)] left-1/2 w-[min(660px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-cyan-200/20 bg-[#0d1319]/75 p-4 backdrop-blur-md">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Stage">
          <button type="button" className={btn('welcome')} onClick={() => goto(POC_STAGE_VALUE.welcome, 'welcome')}>
            Welcome
            <span className="mt-0.5 block font-mono text-[9.5px] tracking-[0.08em] text-cyan-100/60">side panels + login</span>
          </button>
          <button type="button" className={btn('hub')} onClick={() => goto(POC_STAGE_VALUE.hub, 'hub')}>
            Hub
            <span className="mt-0.5 block font-mono text-[9.5px] tracking-[0.08em] text-cyan-100/60">equal trio</span>
          </button>
          <button type="button" className={btn('play')} onClick={() => goto(POC_STAGE_VALUE.play, 'play')}>
            Play Stage
            <span className="mt-0.5 block font-mono text-[9.5px] tracking-[0.08em] text-cyan-100/60">merge to one</span>
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <label htmlFor="poc-stage" className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.13em] text-cyan-100/70">
            Stage&nbsp;openness
          </label>
          <input
            id="poc-stage"
            ref={readouts.slider}
            type="range"
            min={0}
            max={1}
            step={0.001}
            defaultValue={POC_STAGE_VALUE.hub}
            onInput={onScrub}
            onPointerUp={() => {
              stateRef.current.dragging = false;
            }}
            onPointerDown={() => {
              stateRef.current.dragging = true;
            }}
            className="h-[5px] flex-1 cursor-pointer appearance-none rounded-full bg-gradient-to-r from-cyan-600 to-cyan-300 accent-cyan-300"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <label className={chk}>
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => {
                setAuto(e.target.checked);
                stateRef.current.auto = e.target.checked;
                if (e.target.checked) setMode(null);
              }}
              className="h-3.5 w-3.5 accent-cyan-300"
            />
            Auto-cycle
          </label>
          <label className={chk}>
            <input
              type="checkbox"
              checked={beams}
              onChange={(e) => {
                setBeams(e.target.checked);
                stateRef.current.beams = e.target.checked;
              }}
              className="h-3.5 w-3.5 accent-cyan-300"
            />
            Beams
          </label>
          <label className={chk}>
            <input
              type="checkbox"
              checked={rm}
              onChange={(e) => {
                setRm(e.target.checked);
                stateRef.current.rm = e.target.checked;
              }}
              className="h-3.5 w-3.5 accent-cyan-300"
            />
            Reduced motion
          </label>
          <label className={`${chk} border-rose-400/30 text-rose-200/90`}>
            <input
              type="checkbox"
              checked={baked}
              onChange={(e) => {
                setBaked(e.target.checked);
                stateRef.current.baked = e.target.checked;
              }}
              className="h-3.5 w-3.5 accent-rose-400"
            />
            Show baked-frame problem
          </label>
        </div>
      </div>
    </div>
  );
}

export default ForgePocClient;
