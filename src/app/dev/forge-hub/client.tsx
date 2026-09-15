'use client';

/**
 * /dev/forge-hub client — W1-03 glass slabs on the W1-02 portal shell.
 *
 * LCP is the server-rendered <h1> in page.tsx. The R3F stage is
 * dynamically imported after hydration + GPU probe so the heading
 * paints first (TAP §2.2 / §8 load budget).
 */

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useReducedMotion } from 'motion/react';
import '@/components/forge-hub/forge-hub.css';
import { ForgePosterFallback } from '@/components/forge-hub/ForgePosterFallback';
import {
  FORGE_HUB_QUERY,
  frameloopForMotion,
} from '@/config/forgeHub';
import { detectGPUTier } from '@/lib/webgpuDetection';
import {
  portalLiveStatus,
  useForgePortal,
} from '@/lib/forge-hub/useForgePortal';
import { useDeviceStore } from '@/stores/deviceStore';
import { useForgeStore } from '@/stores/sceneStore';

const ForgeStage = dynamic(
  () => import('@/components/forge-hub/ForgeStage'),
  { ssr: false },
);

type StageStatus = 'pending' | 'ready' | 'poster';

export function ForgeHubClient() {
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
  const poseLock =
    searchParams.get(FORGE_HUB_QUERY.poseParam) === FORGE_HUB_QUERY.poseLock;
  const forcePoster =
    searchParams.get(FORGE_HUB_QUERY.fallbackParam) ===
    FORGE_HUB_QUERY.fallbackPoster;

  const setForgePoseLock = useForgeStore((s) => s.setForgePoseLock);
  const setForgeFrameloop = useForgeStore((s) => s.setForgeFrameloop);
  const setForgeMode = useForgeStore((s) => s.setForgeMode);
  const setForgePortalPhase = useForgeStore((s) => s.setForgePortalPhase);
  const { phase, isOpen, retract, toggle } = useForgePortal();

  const [allowStage, setAllowStage] = useState(false);
  const [stageStatus, setStageStatus] = useState<StageStatus>('pending');

  const posterVisible = forcePoster || stageStatus === 'poster';
  const glassReady = posterVisible || stageStatus === 'ready';
  const breatheOff = !!prefersReducedMotion || poseLock;

  useEffect(() => {
    setForgePoseLock(poseLock);
    setForgeMode('hubSplit');
    setForgeFrameloop(frameloopForMotion(!!prefersReducedMotion));
    if (poseLock) setForgePortalPhase('idle');
  }, [
    poseLock,
    prefersReducedMotion,
    setForgeFrameloop,
    setForgeMode,
    setForgePoseLock,
    setForgePortalPhase,
  ]);

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
        <div className="pointer-events-auto absolute bottom-6 left-6 z-20 flex flex-col gap-2">
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
        </div>
      ) : null}

      <div className="sr-only" role="status" aria-live="polite">
        {portalLiveStatus(phase)}
      </div>
    </div>
  );
}
