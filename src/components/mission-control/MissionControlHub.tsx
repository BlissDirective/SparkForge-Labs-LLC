'use client';

import { useActiveChild } from '@/hooks/useChildren';
import { useAllLabsProgress } from '@/hooks/useProgress';
import { useForgeTier } from '@/hooks/useForgeTier';
import { MissionControlConsole } from './MissionControlConsole';
import {
  PREVIEW_PROGRESS,
  PREVIEW_STATS,
  buildLabInstruments,
  type HubStats,
  type LabProgressRow,
} from './labInstruments';

export interface MissionControlHubProps {
  /** Skip live child/progress fetches and render sample instruments. */
  preview?: boolean;
  backHref?: string;
}

export function MissionControlHub({
  preview = false,
  backHref = '/home',
}: MissionControlHubProps) {
  const child = useActiveChild();
  const childId = preview ? '' : (child?.id ?? '');
  const { data: labsProgress } = useAllLabsProgress(childId);
  const { isCompact, prefersReducedMotion, allowShimmer } = useForgeTier();

  const allowCanvas = allowShimmer && !isCompact && !prefersReducedMotion;

  if (preview) {
    return (
      <MissionControlConsole
        stats={PREVIEW_STATS}
        labs={buildLabInstruments(PREVIEW_PROGRESS)}
        allowCanvas={allowCanvas}
        reducedMotion={prefersReducedMotion}
        preview
        backHref={backHref}
      />
    );
  }

  if (!child) {
    return (
      <MissionControlConsole
        stats={{ childName: 'Explorer', xp: 0, level: 1, streak: 0 }}
        labs={buildLabInstruments([])}
        allowCanvas={allowCanvas}
        reducedMotion={prefersReducedMotion}
        backHref={backHref}
      />
    );
  }

  const stats: HubStats = {
    childName: child.display_name ?? 'Explorer',
    xp: child.xp ?? 0,
    level: child.level ?? 1,
    streak: child.streak_count ?? 0,
  };

  return (
    <MissionControlConsole
      stats={stats}
      labs={buildLabInstruments(labsProgress as LabProgressRow[] | undefined)}
      allowCanvas={allowCanvas}
      reducedMotion={prefersReducedMotion}
      backHref={backHref}
    />
  );
}
