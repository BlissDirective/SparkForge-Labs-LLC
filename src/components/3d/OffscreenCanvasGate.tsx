'use client';

// ════════════════════════════════════════════════════════════════
// OffscreenCanvasGate — Phase 5 task #1 (§10.11) Ultra
// Progressive hydration wrapper for OffscreenCanvas worker rendering
// ════════════════════════════════════════════════════════════════
// Renders children (the current main-thread Canvas) when:
//   - OFFSCREEN_RENDER feature flag is off, OR
//   - isOffscreenRenderSafe() returns false (old browser), OR
//   - the worker bootstrap fails for any reason.
//
// Otherwise swaps to a worker-backed canvas that reads SAB-mirrored
// Zustand state every frame. The swap happens BEFORE first paint so
// users never see both canvases at once.
//
// The worker module itself is loaded lazily by dynamic-importing
// `./OffscreenCanvasWorkerHost` — that module is the one that spawns
// `new Worker(new URL('../../workers/renderWorker.ts', ...))`. Keeping
// the dynamic import here means the ~120kb worker bundle is not in
// the critical path when the flag is off.
// ════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState } from 'react';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { isOffscreenRenderSafe } from '@/lib/3d/offscreenCanvasSupport';

type Status = 'gating' | 'main-thread' | 'worker-booting' | 'worker-active' | 'worker-failed';

export interface OffscreenCanvasGateProps {
  /** The existing main-thread Canvas tree. Rendered when worker is disabled. */
  children: React.ReactNode;
  /** Optional placeholder shown during worker boot (first paint ms). */
  placeholder?: React.ReactNode;
  /** Disable the worker path even when flag + support allow it (debug). */
  forceMainThread?: boolean;
}

export function OffscreenCanvasGate({
  children,
  placeholder,
  forceMainThread,
}: OffscreenCanvasGateProps) {
  const [status, setStatus] = useState<Status>('gating');

  const eligible = useMemo(() => {
    if (forceMainThread) return false;
    if (typeof window === 'undefined') return false; // SSR → main-thread
    if (!isFeatureEnabled('OFFSCREEN_RENDER')) return false;
    return isOffscreenRenderSafe(navigator.userAgent);
  }, [forceMainThread]);

  useEffect(() => {
    if (!eligible) {
      setStatus('main-thread');
      return;
    }

    // Dynamic import so the worker bundle isn't in the critical path.
    setStatus('worker-booting');
    let mounted = true;
    import('./OffscreenCanvasWorkerHost')
      .then(({ bootWorkerHost }) => {
        if (!mounted) return;
        return bootWorkerHost()
          .then((res) => {
            if (!mounted) return;
            setStatus(res.ok ? 'worker-active' : 'worker-failed');
          })
          .catch((err: unknown) => {
            console.warn('[OffscreenCanvasGate] worker boot failed:', err);
            if (mounted) setStatus('worker-failed');
          });
      })
      .catch((err: unknown) => {
        console.warn('[OffscreenCanvasGate] dynamic import failed:', err);
        if (mounted) setStatus('worker-failed');
      });

    return () => {
      mounted = false;
    };
  }, [eligible]);

  // Render decision:
  // - main-thread / worker-failed: render children as usual
  // - worker-booting: render placeholder (or children as fallback)
  // - worker-active: render nothing here; the worker host owns its
  //   own <canvas> mounted into the DOM alongside this subtree.
  if (status === 'worker-booting') {
    return <>{placeholder ?? children}</>;
  }
  if (status === 'worker-active') {
    return null;
  }
  return <>{children}</>;
}
