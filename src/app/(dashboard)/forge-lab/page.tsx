'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FEATURE_FLAGS } from '@/config/feature-flags';
import { ForgeLabHub } from '@/components/forge-lab/ForgeLabHub';
import { PREVIEW_PROGRESS, type HubStats } from '@/lib/forge-lab/catalog';
import { useActiveChild } from '@/hooks/useChildren';
import { useAllLabsProgress } from '@/hooks/useProgress';

export default function ForgeLabPage() {
  const router = useRouter();
  const enabled = FEATURE_FLAGS.FORGE_LAB_HUB;
  const child = useActiveChild();
  const { data: labsProgress } = useAllLabsProgress(child?.id ?? '');

  useEffect(() => {
    if (!enabled) router.replace('/home');
  }, [enabled, router]);

  if (!enabled) return null;

  const stats: HubStats = {
    childName: child?.display_name ?? 'Explorer',
    xp: child?.xp ?? 0,
    level: child?.level ?? 1,
    streak: child?.streak_count ?? 0,
    labName: 'Forge Lab',
  };

  return (
    <ForgeLabHub
      stats={stats}
      progress={child ? (labsProgress as typeof PREVIEW_PROGRESS | undefined) : PREVIEW_PROGRESS}
      backHref="/home"
    />
  );
}
