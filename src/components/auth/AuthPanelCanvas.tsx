'use client';

// ════════════════════════════════════════════════════════════════
// AuthPanelCanvas — page-local R3F Canvas for 3D auth panels
// ════════════════════════════════════════════════════════════════
// The auth layout's Canvas now hosts only the portal backdrop, so
// pages that still render their UI as a 3D panel (Signup, Reset
// Password) need their own Canvas in front of the backdrop. This
// wrapper provides that Canvas with the same softened GL settings
// and the Canvas3DErrorBoundary used elsewhere.
//
// Note: child must be R3F primitives (e.g. <SignupPanel3D/>),
// since it is rendered inside <Canvas>.

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Canvas3DErrorBoundary } from '@/components/3d/Canvas3DErrorBoundary';

const R3FCanvas = dynamic(
  () => import('@react-three/fiber').then((mod) => mod.Canvas),
  { ssr: false }
);

interface AuthPanelCanvasProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthPanelCanvas({ children, fallback = null }: AuthPanelCanvasProps) {
  return (
    <div className="fixed inset-0 z-10">
      <Canvas3DErrorBoundary fallback={fallback}>
        <Suspense fallback={null}>
          <R3FCanvas
            camera={{ position: [0, 0, 3.5], fov: 50 }}
            dpr={[1, 1.5]}
            style={{ background: 'transparent' }}
            gl={{
              alpha: true,
              antialias: true,
              powerPreference: 'default',
              failIfMajorPerformanceCaveat: false,
            }}
          >
            <ambientLight intensity={0.2} />
            <directionalLight position={[2, 3, 4]} intensity={0.4} />
            {children}
          </R3FCanvas>
        </Suspense>
      </Canvas3DErrorBoundary>
    </div>
  );
}
