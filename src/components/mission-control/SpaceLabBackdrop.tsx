'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Canvas3DErrorBoundary } from '@/components/3d/Canvas3DErrorBoundary';

const SpaceLabCanvas = dynamic(() => import('./SpaceLabCanvas'), {
  ssr: false,
  loading: () => null,
});

interface SpaceLabBackdropProps {
  /** Mount the restrained R3F backdrop. CSS world always paints underneath. */
  allowCanvas: boolean;
}

export function SpaceLabBackdrop({ allowCanvas }: SpaceLabBackdropProps) {
  return (
    <div className="mc-backdrop" aria-hidden="true">
      <div className="mc-starfield" />
      <div className="mc-nebula" />
      <div className="mc-circuit" />
      <div className="mc-portal" />
      {allowCanvas ? (
        <Canvas3DErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <SpaceLabCanvas />
          </Suspense>
        </Canvas3DErrorBoundary>
      ) : null}
    </div>
  );
}
