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
      style={{ backgroundColor: '#0A0F1E' }}
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

      {/* Readability scrim — the animated light streaks can pass directly
          behind the headline and wash the text out (P1-3). A soft radial
          darkening behind the content keeps WCAG contrast without
          dimming the whole animation. */}
      <div
        className="absolute inset-0 z-[5] pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(10,15,30,0.72) 0%, rgba(10,15,30,0.35) 55%, rgba(10,15,30,0) 100%)',
        }}
      />

      {/* Content Overlay */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <HeroContent />
      </div>
    </section>
  );
}
