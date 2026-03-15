// src/components/landing/ScrollJourney.tsx
// ================================================================
// SCROLL JOURNEY — 5-Act GSAP Scroll-Driven Landing Experience
// ================================================================
// Decision 8.1-8.5: Scroll-driven station reveal
//
// 5 Acts:
//   Act 1 (0-20%):  Crystal Hero — R3F crystal (desktop) / CSS gradient (mobile)
//   Act 2 (20-50%): Lab Discovery Ring — 10 hex tiles stagger in
//   Act 3 (50-70%): Feature Showcase — 4 holographic CSS cards
//   Act 4 (70-85%): Station Preview — static image + CSS glow + counters
//   Act 5 (85-100%): Call to Action — "Your Station Awaits" + CTA
//
// Parallax depth layers (Decision 8.3 from VEC v2):
//   Background aurora: 0.3x scroll speed
//   Mid-layer hex shapes: 0.6x scroll speed (desktop only)
//   Content: 1.0x (normal)
//
// Mobile (Decision 8.5): CSS gradient hero, 2 parallax layers
// GSAP: GPU-composited transforms throughout
//
// ENHANCEMENTS APPLIED:
//   1. prefers-reduced-motion — disables parallax + GSAP animations
//   3. IntersectionObserver fallback if GSAP fails to load
//   4. Lazy-loading below-fold components via next/dynamic
//   7. Particle trails between acts during scroll
// ================================================================

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Rocket, Sparkles, ArrowDown } from 'lucide-react';

// [Enhancement #4] Lazy-load below-fold components
const LabDiscoveryRing = dynamic(
  () => import('@/components/landing/LabDiscoveryRing').then(mod => ({ default: mod.LabDiscoveryRing })),
  { ssr: true, loading: () => <div className="min-h-[400px]" /> }
);

const FeatureShowcase = dynamic(
  () => import('@/components/landing/FeatureShowcase').then(mod => ({ default: mod.FeatureShowcase })),
  { ssr: true, loading: () => <div className="min-h-[400px]" /> }
);

const StationPreview = dynamic(
  () => import('@/components/landing/StationPreview').then(mod => ({ default: mod.StationPreview })),
  { ssr: true, loading: () => <div className="min-h-[400px]" /> }
);

// [v3] Dynamic import for CrystalHero — desktop only, SSR disabled
const CrystalHero = dynamic(
  () => import('@/components/3d/CrystalHero').then(mod => ({ default: mod.CrystalHero })),
  { ssr: false, loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#3B82F6]/20 to-[#8B5CF6]/20 blur-2xl animate-pulse" />
    </div>
  )}
);

// ---- Parallax Hex Shapes (mid-layer decoration) ----
const HEX_SHAPES = [
  { x: '8%', y: '15%', size: 60, opacity: 0.04, delay: 0 },
  { x: '85%', y: '25%', size: 45, opacity: 0.03, delay: 0.5 },
  { x: '12%', y: '45%', size: 35, opacity: 0.05, delay: 1 },
  { x: '78%', y: '55%', size: 50, opacity: 0.03, delay: 0.3 },
  { x: '20%', y: '70%', size: 40, opacity: 0.04, delay: 0.8 },
  { x: '90%', y: '80%', size: 55, opacity: 0.03, delay: 0.2 },
  { x: '5%', y: '90%', size: 30, opacity: 0.05, delay: 1.2 },
];

// [Enhancement #7] Particle trail positions between acts
const ACT_TRAIL_PARTICLES = [
  // Between Act 1 & 2
  { top: '19%', left: '25%', color: '#00BBFF', size: 3, delay: 0 },
  { top: '20%', left: '55%', color: '#AA66FF', size: 2, delay: 0.4 },
  { top: '18%', left: '75%', color: '#06B6D4', size: 2, delay: 0.8 },
  // Between Act 2 & 3
  { top: '48%', left: '35%', color: '#AA66FF', size: 3, delay: 0.2 },
  { top: '49%', left: '60%', color: '#00FF88', size: 2, delay: 0.6 },
  { top: '50%', left: '80%', color: '#00BBFF', size: 2, delay: 1.0 },
  // Between Act 3 & 4
  { top: '69%', left: '20%', color: '#FFAA44', size: 2, delay: 0.3 },
  { top: '70%', left: '50%', color: '#06B6D4', size: 3, delay: 0.7 },
  { top: '68%', left: '70%', color: '#FF6644', size: 2, delay: 1.1 },
  // Between Act 4 & 5
  { top: '84%', left: '30%', color: '#00BBFF', size: 3, delay: 0.1 },
  { top: '85%', left: '65%', color: '#AA66FF', size: 2, delay: 0.5 },
  { top: '83%', left: '45%', color: '#00FF88', size: 2, delay: 0.9 },
];

// ---- Component ----
export function ScrollJourney() {
  const containerRef = useRef<HTMLDivElement>(null);
  const auroraRef = useRef<HTMLDivElement>(null);
  const hexLayerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const gsapLoadedRef = useRef(false);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // [Enhancement #1] Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // [Enhancement #3] IntersectionObserver fallback for GSAP
  const applyIOFallback = useCallback(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') return;

    const targets = containerRef.current.querySelectorAll<HTMLElement>(
      '[data-lab-tile], [data-feature-card], [data-station-preview], [data-act="5"]'
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.opacity = '1';
            el.style.transform = 'translateY(0) translateX(0) scale(1)';
            el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1 }
    );

    targets.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(40px)';
      observer.observe(el);
    });

    // Counter fallback via IO
    const counters = containerRef.current.querySelectorAll<HTMLElement>('[data-stat-counter]');
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const target = parseInt(el.dataset.target || '0', 10);
            const suffix = el.dataset.suffix || '';
            let current = 0;
            const step = Math.max(1, Math.ceil(target / 60));
            const tick = () => {
              current = Math.min(current + step, target);
              el.textContent = current + suffix;
              if (current < target) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            counterObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.1 }
    );
    counters.forEach((el) => counterObserver.observe(el));

    return () => {
      observer.disconnect();
      counterObserver.disconnect();
    };
  }, []);

  // GSAP ScrollTrigger initialization
  useEffect(() => {
    // [Enhancement #1] Skip all GSAP animations when reduced motion is preferred
    if (prefersReducedMotion) {
      // Still need to reveal elements, just without animation
      if (!containerRef.current) return;
      const hiddenEls = containerRef.current.querySelectorAll<HTMLElement>(
        '[data-lab-tile], [data-feature-card], [data-station-preview], [data-act="5"], [data-hero-title], [data-hero-tagline], [data-hero-cta]'
      );
      hiddenEls.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      // Animate counters instantly
      const counters = containerRef.current.querySelectorAll<HTMLElement>('[data-stat-counter]');
      counters.forEach((el) => {
        const target = el.dataset.target || '0';
        const suffix = el.dataset.suffix || '';
        el.textContent = target + suffix;
      });
      return;
    }

    let ctx: ReturnType<typeof import('gsap').gsap.context> | undefined;

    async function initGSAP() {
      try {
        const gsapModule = await import('gsap');
        const scrollModule = await import('gsap/ScrollTrigger');
        const gsap = gsapModule.default || gsapModule.gsap;
        const ScrollTrigger = scrollModule.ScrollTrigger || scrollModule.default;
        gsap.registerPlugin(ScrollTrigger);
        gsapLoadedRef.current = true;

        if (!containerRef.current) return;

        ctx = gsap.context(() => {
          // ---- Parallax: Aurora background (0.3x speed) ----
          if (auroraRef.current) {
            gsap.to(auroraRef.current, {
              yPercent: -30,
              ease: 'none',
              scrollTrigger: {
                trigger: containerRef.current,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1,
              },
            });
          }

          // ---- Parallax: Mid-layer hex shapes (0.6x speed, desktop only) ----
          if (hexLayerRef.current && !isMobile) {
            gsap.to(hexLayerRef.current, {
              yPercent: -15,
              ease: 'none',
              scrollTrigger: {
                trigger: containerRef.current,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1,
              },
            });
          }

          // [Enhancement #7] Particle trails fade in/out between acts
          gsap.utils.toArray<HTMLElement>('[data-trail-particle]').forEach((particle) => {
            gsap.fromTo(
              particle,
              { opacity: 0, scale: 0.3 },
              {
                opacity: 0.6,
                scale: 1,
                duration: 0.5,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: particle,
                  start: 'top 90%',
                  end: 'top 30%',
                  scrub: 1,
                },
              }
            );
          });

          // ---- Act 1: Hero text fade-in ----
          gsap.from('[data-act="1"] [data-hero-title]', {
            opacity: 0,
            y: 40,
            duration: 1.2,
            ease: 'power3.out',
            delay: 0.3,
          });

          gsap.from('[data-act="1"] [data-hero-tagline]', {
            opacity: 0,
            y: 30,
            duration: 1,
            ease: 'power3.out',
            delay: 0.6,
          });

          gsap.from('[data-act="1"] [data-hero-cta]', {
            opacity: 0,
            y: 20,
            duration: 0.8,
            ease: 'power3.out',
            delay: 0.9,
          });

          // ---- Act 2: Lab tiles stagger (ScrollTrigger) ----
          gsap.utils.toArray<HTMLElement>('[data-lab-tile]').forEach((tile, i) => {
            const fromX = i % 2 === 0 ? -60 : 60;
            gsap.from(tile, {
              x: fromX,
              opacity: 0,
              duration: 0.8,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: tile,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
              },
            });
          });

          // ---- Act 3: Feature cards rise from below ----
          gsap.utils.toArray<HTMLElement>('[data-feature-card]').forEach((card, i) => {
            gsap.from(card, {
              y: 80,
              opacity: 0,
              duration: 0.7,
              delay: i * 0.15,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 90%',
                toggleActions: 'play none none reverse',
              },
            });
          });

          // ---- Act 4: Station preview reveal ----
          gsap.from('[data-station-preview]', {
            y: 60,
            opacity: 0,
            scale: 0.95,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '[data-station-preview]',
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          });

          // ---- Act 4: Stats counter tick-up ----
          gsap.utils.toArray<HTMLElement>('[data-stat-counter]').forEach((counter) => {
            const target = parseInt(counter.dataset.target || '0', 10);
            const suffix = counter.dataset.suffix || '';
            gsap.fromTo(
              counter,
              { textContent: '0' },
              {
                textContent: target,
                duration: 2,
                ease: 'power2.out',
                snap: { textContent: 1 },
                scrollTrigger: {
                  trigger: counter,
                  start: 'top 85%',
                  toggleActions: 'play none none reverse',
                },
                onUpdate: function () {
                  counter.textContent =
                    Math.round(parseFloat(counter.textContent || '0')) + suffix;
                },
              }
            );
          });

          // ---- Act 5: CTA entrance ----
          gsap.from('[data-act="5"]', {
            opacity: 0,
            y: 40,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '[data-act="5"]',
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          });
        }, containerRef);
      } catch (err) {
        console.warn('GSAP ScrollTrigger failed to load:', err);
        // [Enhancement #3] Fall back to IntersectionObserver
        applyIOFallback();
      }
    }

    initGSAP();

    return () => {
      ctx?.revert();
    };
  }, [isMobile, prefersReducedMotion, applyIOFallback]);

  return (
    <div ref={containerRef} className="relative">
      {/* ---- PARALLAX LAYER 1: Aurora Background (0.3x) ---- */}
      <div
        ref={auroraRef}
        className="fixed inset-0 -z-20 pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D1117] via-[#0B1628] to-[#0D1117]" />
        <div className="absolute top-[20%] left-[30%] w-[600px] h-[600px] rounded-full bg-[#3B82F6]/[0.04] blur-[120px]" />
        <div className="absolute top-[50%] right-[20%] w-[500px] h-[500px] rounded-full bg-[#8B5CF6]/[0.03] blur-[100px]" />
        <div className="absolute bottom-[10%] left-[40%] w-[400px] h-[400px] rounded-full bg-[#06B6D4]/[0.03] blur-[80px]" />
      </div>

      {/* ---- PARALLAX LAYER 2: Mid-layer Hex Shapes (0.6x, desktop only) ---- */}
      {!isMobile && (
        <div
          ref={hexLayerRef}
          className="fixed inset-0 -z-10 pointer-events-none"
          aria-hidden="true"
        >
          {HEX_SHAPES.map((hex, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: hex.x,
                top: hex.y,
                width: hex.size,
                height: hex.size,
                opacity: hex.opacity,
                clipPath:
                  'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              }}
            />
          ))}
        </div>
      )}

      {/* [Enhancement #7] Particle trails between acts */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none -z-5" aria-hidden="true">
          {ACT_TRAIL_PARTICLES.map((p, i) => (
            <div
              key={i}
              data-trail-particle
              className="absolute rounded-full"
              style={{
                top: p.top,
                left: p.left,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size * 3}px ${p.color}60`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* ---- ACT 1: Crystal Hero (0-20%) ---- */}
      <section
        data-act="1"
        className="min-h-screen flex flex-col items-center justify-center relative px-6"
        aria-label="SparkForge hero"
      >
        {/* Crystal — desktop: R3F, mobile: CSS gradient */}
        {!isMobile ? (
          <div className="absolute inset-0 -z-10">
            <CrystalHero />
          </div>
        ) : (
          /* Decision 8.5: Mobile CSS gradient hero */
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72">
              <motion.div
                className="w-full h-full rounded-full bg-gradient-to-br from-[#3B82F6]/30 via-[#8B5CF6]/20 to-[#06B6D4]/30 blur-3xl"
                animate={prefersReducedMotion ? undefined : {
                  scale: [1, 1.15, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            {/* Sparkle dots */}
            {!prefersReducedMotion && [15, 30, 45, 55, 65, 75, 35, 50].map((seed, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-white/40"
                style={{
                  left: `${20 + (seed * 1.1) % 60}%`,
                  top: `${20 + (seed * 0.9) % 60}%`,
                }}
                animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.2, 0.5] }}
                transition={{
                  duration: 2 + (i % 3),
                  delay: (i * 0.4) % 3,
                  repeat: Infinity,
                }}
              />
            ))}
          </div>
        )}

        {/* Hero Text */}
        <div className="text-center relative z-10 max-w-2xl">
          <h1
            data-hero-title
            className="font-display text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight"
          >
            SPARK
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]">
              FORGE
            </span>
          </h1>

          <p
            data-hero-tagline
            className="font-body text-lg md:text-xl text-white/50 mb-8 max-w-md mx-auto"
          >
            The AI Laboratory where kids discover, experiment, and build
            with artificial intelligence.
          </p>

          <div data-hero-cta className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#6366F1] text-white font-display font-bold hover:brightness-110 transition-all shadow-lg shadow-[#3B82F6]/20"
            >
              <Rocket className="w-5 h-5" /> Start Free
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/70 font-display font-medium hover:bg-white/[0.06] transition-colors"
            >
              <Sparkles className="w-5 h-5" /> View Plans
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        {!prefersReducedMotion && (
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 8, 0], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            aria-hidden="true"
          >
            <ArrowDown className="w-5 h-5 text-white/30" />
          </motion.div>
        )}
      </section>

      {/* ---- ACT 2: Lab Discovery Ring (20-50%) ---- */}
      <section data-act="2" className="py-24 px-6" aria-label="Explore 10 AI Labs">
        <LabDiscoveryRing />
      </section>

      {/* ---- ACT 3: Feature Showcase (50-70%) ---- */}
      <section data-act="3" className="py-24 px-6" aria-label="Platform features">
        <FeatureShowcase />
      </section>

      {/* ---- ACT 4: Station Preview (70-85%) ---- */}
      <section data-act="4" className="py-24 px-6" aria-label="Station preview">
        <StationPreview />
      </section>

      {/* ---- ACT 5: Call to Action (85-100%) ---- */}
      <section
        data-act="5"
        className="py-32 px-6 text-center relative"
        aria-label="Get started"
      >
        {/* Intensified aurora glow */}
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-gradient-to-r from-[#3B82F6]/[0.06] via-[#8B5CF6]/[0.08] to-[#06B6D4]/[0.06] blur-[100px]" />
        </div>

        <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
          Your Station Awaits
        </h2>
        <p className="font-body text-base text-white/50 max-w-md mx-auto mb-10">
          Join thousands of young explorers discovering the future of AI.
          Start your journey today.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#6366F1] text-white font-display font-bold text-lg hover:brightness-110 transition-all shadow-lg shadow-[#3B82F6]/20"
          >
            <Rocket className="w-5 h-5" /> Start Free
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl border border-white/[0.15] bg-white/[0.04] text-white/70 font-display font-medium hover:bg-white/[0.08] transition-colors"
          >
            View Plans
          </Link>
        </div>

        <p className="font-body text-xs text-white/20 mt-6">
          No credit card required. Free plan includes Labs 1-3.
        </p>
      </section>
    </div>
  );
}
