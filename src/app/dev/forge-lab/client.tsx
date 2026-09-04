'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ForgeLabHub } from '@/components/forge-lab/ForgeLabHub';
import { PREVIEW_PROGRESS, PREVIEW_STATS } from '@/lib/forge-lab/catalog';

function PreviewInner() {
  const params = useSearchParams();
  const calibrate = params.get('calibrate') === '1';

  return (
    <ForgeLabHub
      stats={PREVIEW_STATS}
      progress={PREVIEW_PROGRESS}
      preview
      backHref="/"
      calibrate={calibrate}
    />
  );
}

export function ForgeLabPreviewClient() {
  return (
    <Suspense fallback={null}>
      <PreviewInner />
    </Suspense>
  );
}
