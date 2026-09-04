'use client';

import { MissionControlConsole } from '@/components/mission-control/MissionControlConsole';
import {
  PREVIEW_PROGRESS,
  PREVIEW_STATS,
  buildLabInstruments,
} from '@/components/mission-control/labInstruments';
import { useForgeTier } from '@/hooks/useForgeTier';

/** Public preview — sample instruments, no child/progress fetches. */
export function MissionControlPreviewClient() {
  const { isCompact, prefersReducedMotion, allowShimmer } = useForgeTier();
  const allowCanvas = allowShimmer && !isCompact && !prefersReducedMotion;

  return (
    <MissionControlConsole
      stats={PREVIEW_STATS}
      labs={buildLabInstruments(PREVIEW_PROGRESS)}
      allowCanvas={allowCanvas}
      reducedMotion={prefersReducedMotion}
      preview
      backHref="/"
    />
  );
}
