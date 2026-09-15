'use client';

/**
 * /dev/forge-hub client — W1-01 room shell.
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

  const [allowStage, setAllowStage] = useState(false);
  const [stageStatus, setStageStatus] = useState<StageStatus>('pending');

  useEffect(() => {
    setForgePoseLock(poseLock);
    setForgeMode('hubSplit');
    setForgeFrameloop(frameloopForMotion(!!prefersReducedMotion));
  }, [
    poseLock,
    prefersReducedMotion,
    setForgeFrameloop,
    setForgeMode,
    setForgePoseLock,
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

  const onReady = useCallback(() => setStageStatus('ready'), []);
  const onFailure = useCallback(() => setStageStatus('poster'), []);

  return (
    <div
      data-testid="forge-hub-shell"
      data-forge-pose={poseLock ? 'lock' : 'idle'}
      data-forge-stage={forcePoster ? 'poster' : stageStatus}
      className="relative min-h-screen w-full overflow-hidden bg-[#0b1218]"
    >
      <ForgePosterFallback />

      {allowStage && !forcePoster && (
        <div className="absolute inset-0" aria-hidden="true">
          <ForgeStage onReady={onReady} onFailure={onFailure} />
        </div>
      )}
    </div>
  );
}
