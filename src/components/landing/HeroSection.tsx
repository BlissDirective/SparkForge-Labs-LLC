'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { HeroContent } from './HeroContent';
import { FloatingLinesFallback } from './FloatingLinesFallback';
import { useWebGLSupport } from '@/hooks/useWebGLSupport';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const FloatingLines = dynamic(
  () => import('@/components/bits/FloatingLines'),
  {
    ssr: false,
    loading: () => <FloatingLinesFallback />,
  }
);

export function HeroSection() {
  const webgl = useWebGLSupport();
  const reducedMotion = useReducedMotion();

  const showAnimated = !reducedMotion && webgl.supported;

  return (
    <section
      className="relative w-full min-h-[100dvh] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#0a0a1a' }}
    >
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        {showAnimated ? (
          <Suspense fallback={<FloatingLinesFallback />}>
            <FloatingLines
              linesGradient={['#E945F5', '#2F4BC0', '#E945F5', '#FFFFFF', '#FFFFFF']}
              animationSpeed={1}
              interactive={true}
              bendRadius={5.0}
              bendStrength={-0.5}
              mouseDamping={0.05}
              parallax={true}
              parallaxStrength={0.2}
              mixBlendMode="screen"
              lineCount={[6]}
              lineDistance={[5]}
              enabledWaves={['top', 'middle', 'bottom']}
            />
          </Suspense>
        ) : (
          <FloatingLinesFallback />
        )}
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <HeroContent />
      </div>
    </section>
  );
}
