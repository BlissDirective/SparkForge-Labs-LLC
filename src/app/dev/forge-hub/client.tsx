'use client';

/**
 * /dev/forge-hub client — W2 screen kit + Director + route/escape.
 *
 * LCP is the server-rendered <h1> in page.tsx. The R3F stage is
 * dynamically imported after hydration + GPU probe so the heading
 * paints first (TAP §2.2 / §8 load budget).
 *
 * W2-03: ForgeRouteMode (bridge, no store sync), EscapeFlat,
 * ToastRail. Same sceneStore forge slice — no new Zustand store.
 * W2 Theatre: first-visit-ignition JSON on ?ignition=1; game-launch-burst
 * on ?burst=1 (also follows live lobby-playstage-merge). Studio on
 * ?studio=1 in development only. Production `/` `/login` stay gated.
 * W2-05: mode switcher + ?calibrate=1 + transition scrubber on the
 * live forge slice / Director APIs. Director HUD stays intact.
 * W2-07: live HoloC welcome login + P2 morph cycle smoke.
 * W2-10: WebGPU → WebGL2 → poster cascade via `createRenderer`
 * (`three/webgpu`). Shell reports the winning backend on
 * `data-forge-renderer`. `?fallback=poster` / `?fallback=webgl2`.
 */

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, usePathname } from 'next/navigation';
import '@/components/forge-hub/forge-hub.css';
import { EscapeFlat } from '@/components/forge-hub/EscapeFlat';
import { ForgeCalibrateOverlay } from '@/components/forge-hub/ForgeCalibrateOverlay';
import { ForgeDirectorControls } from '@/components/forge-hub/ForgeDirectorControls';
import { ForgeModeSwitcher } from '@/components/forge-hub/ForgeModeSwitcher';
import { ForgeMorphCycle } from '@/components/forge-hub/ForgeMorphCycle';
import { ForgePosterFallback } from '@/components/forge-hub/ForgePosterFallback';
import {
  ForgeRouteMode,
  useForgeRouteMode,
} from '@/components/forge-hub/ForgeRouteMode';
import { ForgeTransitionScrubber } from '@/components/forge-hub/ForgeTransitionScrubber';
import { HoloPanelLayer } from '@/components/forge-hub/HoloPanelLayer';
import { ToastRail } from '@/components/forge-hub/ToastRail';
import {
  FORGE_HUB_QUERY,
  frameloopForMotion,
} from '@/config/forgeHub';
import { detectGPUTier } from '@/lib/webgpuDetection';
import { forgeRouteForDevMode } from '@/lib/forge-hub/devHud';
import { isForgeMode } from '@/lib/forge-hub/layouts';
import {
  forgeFallbackFromQuery,
  forgeStagePlan,
  type ForgeRendererPath,
} from '@/lib/forge-hub/rendererCascade';
import {
  portalLiveStatus,
  useForgePortal,
} from '@/lib/forge-hub/useForgePortal';
import { useForgeReducedMotion } from '@/lib/forge-hub/useForgeReducedMotion';
import { useFirstVisitIgnition } from '@/lib/forge-hub/useFirstVisitIgnition';
import { useGameLaunchBurst } from '@/lib/forge-hub/useGameLaunchBurst';
import { maybeLoadForgeTheatreStudio } from '@/lib/forge-hub/director';
import {
  useDeviceStore,
  waitForDeviceStoreHydration,
} from '@/stores/deviceStore';
import { toast } from '@/stores/toastStore';
import { useForgeStore } from '@/stores/sceneStore';

const ForgeStage = dynamic(
  () => import('@/components/forge-hub/ForgeStage'),
  { ssr: false },
);

type StageStatus = 'pending' | 'ready' | 'poster';

export function ForgeHubClient() {
  return (
    <ForgeRouteMode syncStore={false} pathname="/dev/forge-hub">
      <ForgeHubClientInner />
    </ForgeRouteMode>
  );
}

function ForgeHubClientInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? '/dev/forge-hub';
  const route = useForgeRouteMode();
  const prefersReducedMotion = useForgeReducedMotion();
  const poseLock =
    searchParams.get(FORGE_HUB_QUERY.poseParam) === FORGE_HUB_QUERY.poseLock;
  const fallback = forgeFallbackFromQuery(
    searchParams.get(FORGE_HUB_QUERY.fallbackParam),
  );
  const forcePoster = fallback === 'poster';
  const forceWebgl2 = fallback === 'webgl2';
  const calibrate =
    searchParams.get(FORGE_HUB_QUERY.calibrateParam) ===
    FORGE_HUB_QUERY.calibrateOn;
  const studioOn =
    searchParams.get(FORGE_HUB_QUERY.studioParam) === FORGE_HUB_QUERY.studioOn;
  const ignitionQuery =
    searchParams.get(FORGE_HUB_QUERY.ignitionParam) ===
    FORGE_HUB_QUERY.ignitionOn;
  const burstQuery =
    searchParams.get(FORGE_HUB_QUERY.burstParam) === FORGE_HUB_QUERY.burstOn;
  const modeParam = searchParams.get('mode');

  const setForgePoseLock = useForgeStore((s) => s.setForgePoseLock);
  const setForgeFrameloop = useForgeStore((s) => s.setForgeFrameloop);
  const applyForgeRoute = useForgeStore((s) => s.applyForgeRoute);
  const setForgePortalPhase = useForgeStore((s) => s.setForgePortalPhase);
  const mode = useForgeStore((s) => s.forge.mode);
  const previousMode = useForgeStore((s) => s.forge.previousMode);
  const flatOverlay = useForgeStore((s) => s.forge.flatOverlay);
  const frameloop = useForgeStore((s) => s.forge.frameloop);
  const { phase, isOpen, retract, toggle } = useForgePortal();
  const directorId = useForgeStore((s) => s.forge.directorId);
  const [cycleStatus, setCycleStatus] = useState('idle');
  const [cycleStep, setCycleStep] = useState('idle');
  const [cycleTrace, setCycleTrace] = useState('');

  useFirstVisitIgnition({
    pathname,
    routeKind: route.kind,
    poseLock,
    reducedMotion: !!prefersReducedMotion,
    ignitionQuery,
  });

  useGameLaunchBurst({
    poseLock,
    reducedMotion: !!prefersReducedMotion,
    burstQuery,
  });

  useEffect(() => {
    void maybeLoadForgeTheatreStudio(studioOn);
  }, [studioOn]);

  const [allowStage, setAllowStage] = useState(false);
  const [stageStatus, setStageStatus] = useState<StageStatus>('pending');
  const [rendererPath, setRendererPath] =
    useState<ForgeRendererPath>('pending');
  const [gpuTierLabel, setGpuTierLabel] = useState('pending');
  const [stagePrefer, setStagePrefer] = useState<'auto' | 'webgl2'>('auto');

  const posterVisible = forcePoster || stageStatus === 'poster';
  const glassReady = posterVisible || stageStatus === 'ready';
  const breatheOff = !!prefersReducedMotion || poseLock;
  const holoLayout = stageStatus === 'ready' && !forcePoster ? 'viewport' : 'stage';
  const stageHidden = flatOverlay || mode === 'flat';
  const bloomPath =
    poseLock || rendererPath === 'poster'
      ? 'off'
      : rendererPath === 'pending'
        ? 'pending'
        : rendererPath;

  const closeFlat = useCallback(() => {
    const back =
      previousMode && previousMode !== 'flat' ? previousMode : 'hubSplit';
    applyForgeRoute(forgeRouteForDevMode(back, !!prefersReducedMotion));
  }, [applyForgeRoute, prefersReducedMotion, previousMode]);

  const openFlat = useCallback(() => {
    applyForgeRoute(forgeRouteForDevMode('flat', !!prefersReducedMotion));
  }, [applyForgeRoute, prefersReducedMotion]);

  useEffect(() => {
    setForgePoseLock(poseLock);
    if (poseLock) {
      setForgePortalPhase('idle');
      return;
    }
    if (mode !== 'flat' && !flatOverlay) {
      setForgeFrameloop(frameloopForMotion(!!prefersReducedMotion));
    }
  }, [
    flatOverlay,
    mode,
    poseLock,
    prefersReducedMotion,
    setForgeFrameloop,
    setForgePoseLock,
    setForgePortalPhase,
  ]);

  useEffect(() => {
    if (ignitionQuery && directorId === 'first-visit-ignition') return;
    if (burstQuery && directorId === 'game-launch-burst') return;
    if (modeParam && isForgeMode(modeParam)) {
      applyForgeRoute(forgeRouteForDevMode(modeParam, !!prefersReducedMotion));
    }
  }, [
    applyForgeRoute,
    directorId,
    ignitionQuery,
    burstQuery,
    modeParam,
    prefersReducedMotion,
  ]);

  useEffect(() => {
    if (forcePoster) {
      setStageStatus('poster');
      setRendererPath('poster');
      setGpuTierLabel('skipped');
      setAllowStage(false);
      return;
    }

    let cancelled = false;
    (async () => {
      await waitForDeviceStoreHydration();
      const result = await detectGPUTier();
      if (cancelled) return;
      useDeviceStore.getState().setGpuTier(result.tier, result.stripeCount);
      setGpuTierLabel(result.backend === 'none' ? 'none' : result.tier);

      const plan = forgeStagePlan(
        result.backend,
        forceWebgl2 ? 'webgl2' : null,
      );
      setStagePrefer(plan.prefer);
      if (!plan.mountStage) {
        setStageStatus('poster');
        setRendererPath('poster');
        setAllowStage(false);
        return;
      }

      // Two rAFs so the LCP heading can paint before the R3F chunk mounts.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      if (!cancelled) setAllowStage(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [forcePoster, forceWebgl2]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (poseLock || stageHidden) return;
      if (event.key === 'Escape' && phase !== 'idle') {
        event.preventDefault();
        retract();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, poseLock, retract, stageHidden]);

  const onReady = useCallback((backend: 'webgpu' | 'webgl2') => {
    setStageStatus('ready');
    setRendererPath(backend);
  }, []);
  const onFailure = useCallback(() => {
    setStageStatus('poster');
    setRendererPath('poster');
    setAllowStage(false);
  }, []);

  return (
    <div
      data-testid="forge-hub-shell"
      data-forge-pose={poseLock ? 'lock' : 'idle'}
      data-forge-stage={forcePoster ? 'poster' : stageStatus}
      data-forge-renderer={rendererPath}
      data-forge-gpu-tier={gpuTierLabel}
      data-forge-bloom={bloomPath}
      data-forge-portal={phase}
      data-forge-glass={glassReady ? 'trio' : 'pending'}
      data-forge-breathe={breatheOff ? 'off' : 'on'}
      data-forge-mode={mode}
      data-forge-screen-kit="w2"
      data-forge-director={directorId ?? 'idle'}
      data-forge-rm={prefersReducedMotion ? 'on' : 'off'}
      data-forge-route-kind={route.kind}
      data-forge-ignition={ignitionQuery ? '1' : '0'}
      data-forge-burst={burstQuery ? '1' : '0'}
      data-forge-studio={studioOn ? '1' : '0'}
      data-forge-flat={stageHidden ? '1' : '0'}
      data-forge-frameloop={frameloop}
      data-forge-calibrate={calibrate ? '1' : '0'}
      data-forge-morph-cycle={cycleStatus}
      data-forge-morph-cycle-step={cycleStep}
      data-forge-morph-cycle-trace={cycleTrace}
      className="relative min-h-screen w-full overflow-hidden bg-[#0b1218]"
    >
      <ForgePosterFallback
        withGlass={posterVisible && !stageHidden}
        className={stageHidden ? 'invisible' : undefined}
      />

      {allowStage && !forcePoster && (
        <div
          className={
            prefersReducedMotion
              ? 'absolute inset-0 forge-hub-rm-crossfade'
              : 'absolute inset-0'
          }
          aria-hidden="true"
          hidden={stageHidden}
        >
          <ForgeStage
            prefer={stagePrefer}
            onReady={onReady}
            onFailure={onFailure}
          />
        </div>
      )}

      {!poseLock && !stageHidden ? (
        <HoloPanelLayer layout={holoLayout} calibrate={calibrate} />
      ) : null}

      {calibrate && !poseLock && !stageHidden ? (
        <ForgeCalibrateOverlay layout={holoLayout} />
      ) : null}

      {!poseLock && !stageHidden ? (
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

      {!poseLock && !stageHidden ? (
        <div className="pointer-events-auto absolute bottom-6 right-6 z-20 flex flex-col items-end gap-2">
          <ForgeModeSwitcher reducedMotion={!!prefersReducedMotion} />
          <ForgeMorphCycle
            reducedMotion={!!prefersReducedMotion}
            onStatus={(status, step) => {
              setCycleStatus(status);
              setCycleStep(step);
            }}
            onTrace={setCycleTrace}
          />
          <ForgeTransitionScrubber
            reducedMotion={!!prefersReducedMotion}
            poseLock={poseLock}
          />
          <button
            type="button"
            data-testid="forge-hub-toast-ping"
            className="forge-hub-ignite"
            onClick={() => toast.info('Forge hub ping')}
          >
            Ping toast
          </button>
        </div>
      ) : null}

      <ToastRail
        lock={poseLock}
        showFooter={!stageHidden}
        onOpenLegal={openFlat}
      />
      <EscapeFlat
        open={!poseLock && stageHidden}
        onClose={closeFlat}
        title="Parent space"
      >
        <p>
          Parent, billing, security, and legal screens use EscapeFlat.
          The forge canvas stays mounted with frameloop never (OVERLAY-CRIT-001).
        </p>
      </EscapeFlat>

      <div className="sr-only" role="status" aria-live="polite">
        {portalLiveStatus(phase)}
      </div>
    </div>
  );
}
