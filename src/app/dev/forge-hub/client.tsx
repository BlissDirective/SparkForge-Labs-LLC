'use client';

/**
 * /dev/forge-hub client — W2 screen kit + Director HUD on the W1 room.
 *
 * LCP is the server-rendered <h1> in page.tsx. The R3F stage is
 * dynamically imported after hydration + GPU probe so the heading
 * paints first (TAP §2.2 / §8 load budget).
 *
 * Screen kit: Stagehand layout registry + projection + HoloPanel.
 * Director: GSAP MOTION_BIBLE ids (emit-burst, login-success-hubsplit,
 * first-visit-ignition stub). No new Zustand store.
 */

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import '@/components/forge-hub/forge-hub.css';
import { ForgePosterFallback } from '@/components/forge-hub/ForgePosterFallback';
import { HoloPanelLayer } from '@/components/forge-hub/HoloPanelLayer';
import { ForgeDirectorControls } from '@/components/forge-hub/ForgeDirectorControls';
import {
  FORGE_HUB_QUERY,
  frameloopForMotion,
} from '@/config/forgeHub';
import { detectGPUTier } from '@/lib/webgpuDetection';
import {
  FORGE_LAYOUT_MODES,
  isForgeMode,
} from '@/lib/forge-hub/layouts';
import {
  portalLiveStatus,
  useForgePortal,
} from '@/lib/forge-hub/useForgePortal';
import { useForgeReducedMotion } from '@/lib/forge-hub/useForgeReducedMotion';
import type { ForgeMode } from '@/lib/forge-hub/types';
import { useDeviceStore } from '@/stores/deviceStore';
import { useForgeStore } from '@/stores/sceneStore';

const ForgeStage = dynamic(
  () => import('@/components/forge-hub/ForgeStage'),
  { ssr: false },
);

type StageStatus = 'pending' | 'ready' | 'poster';

const MODE_SWITCHER_MODES: ForgeMode[] = FORGE_LAYOUT_MODES.filter(
  (mode) => mode !== 'flat',
);

export function ForgeHubClient() {
  const searchParams = useSearchParams();
  const prefersReducedMotion = useForgeReducedMotion();
  const poseLock =
    searchParams.get(FORGE_HUB_QUERY.poseParam) === FORGE_HUB_QUERY.poseLock;
  const forcePoster =
    searchParams.get(FORGE_HUB_QUERY.fallbackParam) ===
    FORGE_HUB_QUERY.fallbackPoster;
  const calibrate =
    searchParams.get(FORGE_HUB_QUERY.calibrateParam) ===
    FORGE_HUB_QUERY.calibrateOn;
  const modeParam = searchParams.get('mode');

  const setForgePoseLock = useForgeStore((s) => s.setForgePoseLock);
  const setForgeFrameloop = useForgeStore((s) => s.setForgeFrameloop);
  const setForgeMode = useForgeStore((s) => s.setForgeMode);
  const setForgePortalPhase = useForgeStore((s) => s.setForgePortalPhase);
  const mode = useForgeStore((s) => s.forge.mode);
  const { phase, isOpen, retract, toggle } = useForgePortal();
  const directorId = useForgeStore((s) => s.forge.directorId);

  const [allowStage, setAllowStage] = useState(false);
  const [stageStatus, setStageStatus] = useState<StageStatus>('pending');

  const posterVisible = forcePoster || stageStatus === 'poster';
  const glassReady = posterVisible || stageStatus === 'ready';
  const breatheOff = !!prefersReducedMotion || poseLock;
  const holoLayout = stageStatus === 'ready' && !forcePoster ? 'viewport' : 'stage';

  useEffect(() => {
    setForgePoseLock(poseLock);
    setForgeFrameloop(frameloopForMotion(!!prefersReducedMotion));
    if (poseLock) setForgePortalPhase('idle');
  }, [
    poseLock,
    prefersReducedMotion,
    setForgeFrameloop,
    setForgePoseLock,
    setForgePortalPhase,
  ]);

  useEffect(() => {
    if (modeParam && isForgeMode(modeParam)) setForgeMode(modeParam);
  }, [modeParam, setForgeMode]);

  useEffect(() => {
    if (forcePoster) {
      setStageStatus('poster');
      return;
    }

    let cancelled = false;
    (async () => {
      const result = await detectGPUTier();
      if (cancelled) return;
      useDeviceStore.getState().setGpuTier(result.tier, result.stripeCount);

      // Two rAFs so the LCP heading can paint before the R3F chunk mounts.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      if (!cancelled) setAllowStage(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [forcePoster]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (poseLock) return;
      if (event.key === 'Escape' && phase !== 'idle') {
        event.preventDefault();
        retract();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, poseLock, retract]);

  const onReady = useCallback(() => setStageStatus('ready'), []);
  const onFailure = useCallback(() => setStageStatus('poster'), []);

  return (
    <div
      data-testid="forge-hub-shell"
      data-forge-pose={poseLock ? 'lock' : 'idle'}
      data-forge-stage={forcePoster ? 'poster' : stageStatus}
      data-forge-portal={phase}
      data-forge-glass={glassReady ? 'trio' : 'pending'}
      data-forge-breathe={breatheOff ? 'off' : 'on'}
      data-forge-mode={mode}
      data-forge-screen-kit="w2"
      data-forge-director={directorId ?? 'idle'}
      data-forge-rm={prefersReducedMotion ? 'on' : 'off'}
      className="relative min-h-screen w-full overflow-hidden bg-[#0b1218]"
    >
      <ForgePosterFallback withGlass={posterVisible} />

      {allowStage && !forcePoster && (
        <div
          className={
            prefersReducedMotion
              ? 'absolute inset-0 forge-hub-rm-crossfade'
              : 'absolute inset-0'
          }
          aria-hidden="true"
        >
          <ForgeStage onReady={onReady} onFailure={onFailure} />
        </div>
      )}

      {!poseLock ? (
        <HoloPanelLayer layout={holoLayout} calibrate={calibrate} />
      ) : null}

      {!poseLock ? (
        <div
          data-forge-director-ui="1"
          className="pointer-events-auto absolute bottom-6 left-6 z-20 flex flex-col gap-3"
        >
          <button
            type="button"
            data-testid="forge-hub-ignite"
            className="forge-hub-ignite"
            aria-pressed={isOpen}
            aria-label={
              phase === 'docked'
                ? 'Retract portal'
                : 'Ignite SparkForge portal'
            }
            onClick={toggle}
          >
            {phase === 'docked' ? 'Retract' : 'Ignite portal'}
          </button>
          <p
            data-testid="forge-hub-portal-phase"
            className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-100/80"
          >
            {phase}
          </p>
          <ForgeDirectorControls
            reducedMotion={!!prefersReducedMotion}
            poseLock={poseLock}
          />
        </div>
      ) : null}

      {!poseLock ? (
        <div className="pointer-events-auto absolute bottom-6 right-6 z-20 flex flex-col items-end gap-2">
          <label className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan-100/80">
            Layout
            <select
              data-testid="forge-hub-mode-switch"
              className="forge-hub-mode ml-2"
              aria-label="Forge hub layout mode"
              value={mode}
              onChange={(event) => {
                const next = event.target.value;
                if (isForgeMode(next)) setForgeMode(next);
              }}
            >
              {MODE_SWITCHER_MODES.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      <div className="sr-only" role="status" aria-live="polite">
        {portalLiveStatus(phase)}
      </div>
    </div>
  );
}
