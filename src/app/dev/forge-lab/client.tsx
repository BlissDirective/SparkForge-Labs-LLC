'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ForgeLabHub } from '@/components/forge-lab/ForgeLabHub';
import { PREVIEW_PROGRESS, PREVIEW_STATS } from '@/lib/forge-lab/catalog';
import { isForgeLayoutId } from '@/lib/forge-lab/layouts';

function PreviewInner() {
  const params = useSearchParams();
  const calibrate = params.get('calibrate') === '1';
  const layoutParam = params.get('layout');
  const layout = isForgeLayoutId(layoutParam) ? layoutParam : 'hubSplit';

  return (
    <ForgeLabHub
      stats={PREVIEW_STATS}
      progress={PREVIEW_PROGRESS}
      preview
      backHref="/"
      calibrate={calibrate}
      layout={layout}
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
