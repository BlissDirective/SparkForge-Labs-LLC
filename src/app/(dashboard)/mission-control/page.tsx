'use client';

import { FEATURE_FLAGS } from '@/config/feature-flags';
import { MissionControlHub } from '@/components/mission-control/MissionControlHub';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MissionControlPage() {
  const router = useRouter();
  const enabled = FEATURE_FLAGS.MISSION_CONTROL_HUB;

  useEffect(() => {
    if (!enabled) router.replace('/home');
  }, [enabled, router]);

  if (!enabled) return null;

  return <MissionControlHub />;
}
