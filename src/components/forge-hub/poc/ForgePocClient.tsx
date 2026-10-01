'use client';

// Forge Stage POC — HUD + controls. Buttons drive the REAL forge slice
// (applyForgeRoute); the scene reads forge.mode and mirrors the shared
// morphProgress clock. The scrubber + toggles are a mutable bridge the R3F
// scene reads each frame (so dragging never re-renders React). The GLB
// toggle is gated on probePocAssets() — authored objects drop in with no
// code change the moment the GLBs exist.

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { modeToStage, stageToMode } from '@/lib/forge-hub/poc/pocStage';
import { forgeRouteForDevMode } from '@/lib/forge-hub/devHud';
import { useForgeStore } from '@/stores/sceneStore';
import { probePocAssets } from './pocAssets';
import type { PocState, PocReadoutRefs, PocSource } from './ForgePocStage';

const ForgePocStage = dynamic(
  () => import('./ForgePocStage').then((m) => m.ForgePocStage),
  { ssr: false },
);

export function ForgePocClient() {
  const stateRef = useRef<PocState>({
    stage: 0.5,
    auto: false,
    beams: true,
    rm: false,
    baked: false,
    dragging: false,
  });

  const readouts: PocReadoutRefs = {
    mode: useRef<HTMLElement | null>(null),
    stage: useRef<HTMLElement | null>(null),
    cw: useRef<HTMLElement | null>(null),
    side: useRef<HTMLElement | null>(null),
    emit: useRef<HTMLElement | null>(null),
    beam: useRef<HTMLElement | null>(null),
    dim: useRef<HTMLElement | null>(null),
    slider: useRef<HTMLInputElement | null>(null),
  };

  const forgeMode = useForgeStore((s) => s.forge.mode);
  const applyForgeRoute = useForgeStore((s) => s.applyForgeRoute);
  const activeStop = stageToMode(modeToStage(forgeMode)); // welcome | hubSplit | playStage

  const [auto, setAuto] = useState(false);
  const [beams, setBeams] = useState(true);
  const [rm, setRm] = useState(false);
  const [baked, setBaked] = useState(false);
  const [source, setSource] = useState<PocSource>('procedural');
  const [assetsAvailable, setAssetsAvailable] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRm(true);
      stateRef.current.rm = true;
    }
    let alive = true;
    probePocAssets().then((ok) => {
      if (alive) setAssetsAvailable(ok);
    });
    return () => {
      alive = false;
    };
  }, []);

  const goto = useCallback(
    (mode: 'welcome' | 'hubSplit' | 'playStage') => {
      stateRef.current.auto = false;
      setAuto(false);
      applyForgeRoute(forgeRouteForDevMode(mode, stateRef.current.rm));
    },
    [applyForgeRoute],
  );

  const onScrub = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    stateRef.current.dragging = true;
    stateRef.current.stage = parseFloat((e.target as HTMLInputElement).value);
    stateRef.current.auto = false;
    setAuto(false);
  }, []);

  const endScrub = useCallback(() => {
    stateRef.current.dragging = false;
    applyForgeRoute(
      forgeRouteForDevMode(stageToMode(stateRef.current.stage), stateRef.current.rm),
    );
  }, [applyForgeRoute]);

  const btn = (stop: string) =>
    `flex-1 min-w-[96px] rounded-[10px] border px-3 py-2.5 text-[12.5px] font-semibold transition ${
      !auto && activeStop === stop
        ? 'border-cyan-300 bg-cyan-300/15 text-white shadow-[0_0_20px_-6px_#5fe6ff]'
        : 'border-cyan-200/20 bg-white/[0.04] text-cyan-50 hover:border-cyan-200/40'
    }`;

  const chk =
    'inline-flex cursor-pointer select-none items-center gap-2 rounded-[9px] border border-cyan-200/20 bg-white/[0.04] px-2.5 py-2 text-[11px] font-semibold text-cyan-100/80';

  return (
    <div className="absolute inset-0">
      <ForgePocStage stateRef={stateRef} readouts={readouts} source={source} />

      <div className="pointer-events-none absolute right-4 top-4 hidden min-w-[188px] rounded-xl border border-cyan-200/20 bg-[#0d1319]/75 p-3 font-mono text-[11px] leading-6 text-cyan-100/70 backdrop-blur-sm sm:block">
        <div className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-cyan-50">
          forge slice → all objects
        </div>
        {(
          [
            ['forge.mode', readouts.mode],
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

      <div className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+16px)] left-1/2 w-[min(680px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-cyan-200/20 bg-[#0d1319]/75 p-4 backdrop-blur-md">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Stage">
          <button type="button" className={btn('welcome')} onClick={() => goto('welcome')}>
            Welcome
            <span className="mt-0.5 block font-mono text-[9.5px] tracking-[0.08em] text-cyan-100/60">side panels + login</span>
          </button>
          <button type="button" className={btn('hubSplit')} onClick={() => goto('hubSplit')}>
            Hub
            <span className="mt-0.5 block font-mono text-[9.5px] tracking-[0.08em] text-cyan-100/60">equal trio</span>
          </button>
          <button type="button" className={btn('playStage')} onClick={() => goto('playStage')}>
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
            defaultValue={0.5}
            onInput={onScrub}
            onPointerDown={() => {
              stateRef.current.dragging = true;
            }}
            onPointerUp={endScrub}
            onKeyUp={endScrub}
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
          <label
            className={`${chk} ${assetsAvailable ? '' : 'cursor-not-allowed opacity-50'}`}
            title={
              assetsAvailable
                ? 'Swap procedural stand-ins for the authored GLBs'
                : 'Authored GLBs not found yet — produce them per FORGE_STAGE_ASSET_PROMPTS.md'
            }
          >
            <input
              type="checkbox"
              disabled={!assetsAvailable}
              checked={source === 'glb'}
              onChange={(e) => setSource(e.target.checked ? 'glb' : 'procedural')}
              className="h-3.5 w-3.5 accent-cyan-300"
            />
            Authored GLBs{assetsAvailable ? '' : ' (none yet)'}
          </label>
        </div>
      </div>
    </div>
  );
}

export default ForgePocClient;
