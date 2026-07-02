'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useMotionValue, useSpring } from 'motion/react';
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

  // ── Sparky cursor-reactivity (desktop only) ──
  // Raw pointer offset (px) from the hero center, smoothed with springs
  // so the orb lags gently behind the cursor instead of snapping.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const sparkyX = useSpring(pointerX, { stiffness: 80, damping: 18, mass: 0.6 });
  const sparkyY = useSpring(pointerY, { stiffness: 80, damping: 18, mass: 0.6 });

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    // Reduced motion: no tracking. Touch/pen: no hover concept, keep static.
    if (reducedMotion || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    pointerX.set(nx * 16);
    pointerY.set(ny * 12);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <section
      className="relative w-full min-h-[100dvh] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#0A0F1E' }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
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
        <HeroContent
          sparkyX={sparkyX}
          sparkyY={sparkyY}
          reducedMotion={reducedMotion}
        />
      </div>
    </section>
  );
}
