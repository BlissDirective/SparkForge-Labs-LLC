# Stage 8 Part 3 v3-FINAL (A) — Scroll Journey + Act Components

**Version:** v3-FINAL (corrected)
**Build Phase:** 24 (Stage 8 Part 3 — Landing + Pricing, Part A: Scroll Journey + Acts 2-4)
**Date:** March 1, 2026 | **Audited:** March 10, 2026
**GCUD:** V10
**Prerequisites:** Stage 8 Parts 1-2 complete, Stage 3 Part 3B v3-FINAL (CrystalHero R3F component), GSAP installed (`gsap` in package.json)
**Validation:** `npm run build` PASS, `npx tsc --noEmit` PASS
**Supersedes:** STAGE3_Part3A_v3FINAL (landing page section only — does NOT supersede Stage 3 station frame/crystal shatter)

---

## Overview

This document creates the 5-act GSAP scroll-driven landing experience for SparkForge. It replaces the existing simple Motion landing page (`src/app/(marketing)/page.tsx`) with a cinematic, parallax scroll journey featuring a crystal hero, lab discovery ring, holographic feature cards, station preview mockup, and final CTA.

**Part A scope:** 4 new component files. Part B will create the `/pricing` route. Part C will integrate the ScrollJourney into the marketing page and provide full verification.

### Decisions Implemented

| Decision | Description | Component |
|----------|-------------|-----------|
| 8.1 | Crystal hero: shared DNA, different execution (R3F desktop / CSS gradient mobile) | ScrollJourney.tsx Act 1 |
| 8.2 | Station preview: static image + CSS glow pulse + LED rim animation | StationPreview.tsx |
| 8.3 | Feature cards: CSS-only holographic (conic-gradient + mix-blend-mode + sweep) | FeatureShowcase.tsx |
| 8.5 | Mobile: CSS gradient hero (no 3D), 2 parallax layers, identical Acts 2-5 | ScrollJourney.tsx (isMobile checks) |

### Files Created / Modified

| # | File | Action | Purpose |
|---|------|--------|---------|
| 1 | `src/components/landing/ScrollJourney.tsx` | CREATE | 5-act GSAP scroll orchestrator + parallax layers |
| 2 | `src/components/landing/LabDiscoveryRing.tsx` | CREATE | Act 2: 10 hex tiles + CSS lab patterns + LED accents |
| 3 | `src/components/landing/FeatureShowcase.tsx` | CREATE | Act 3: 4 holographic feature cards + mini animations |
| 4 | `src/components/landing/StationPreview.tsx` | CREATE | Act 4: CSS station mockup + LED pulse + stat counters |

### 5-Act Scroll Journey Architecture

| Act | Scroll % | Component | GSAP Animations | Mobile |
|-----|----------|-----------|-----------------|--------|
| Act 1: Crystal Hero | 0-20% | CrystalHero (R3F) via ScrollJourney | Title fade-in, tagline slide-up, CTA entrance | CSS gradient (no 3D) |
| Act 2: Lab Discovery | 20-50% | LabDiscoveryRing | 10 hex tiles stagger from alternating sides (L/R) | Identical |
| Act 3: Features | 50-70% | FeatureShowcase | 4 cards rise from below with 0.15s stagger | Identical |
| Act 4: Station Preview | 70-85% | StationPreview | Preview scale-in, stat counters tick up | Identical |
| Act 5: CTA | 85-100% | Inline in ScrollJourney | Fade-in entrance, aurora intensification | Identical |

### Parallax Depth Layers

| Layer | Speed | Content | Desktop | Mobile |
|-------|-------|---------|---------|--------|
| Background | 0.3x | Aurora gradient blobs | Active | Active |
| Mid-layer | 0.6x | Decorative hex shapes | Active | Hidden (Decision 8.5) |
| Content | 1.0x | All acts / sections | Normal | Normal |

### v2 → v3 Changes

| Aspect | v2 (Current `page.tsx`) | v3-FINAL (This Document) |
|--------|------------------------|--------------------------|
| Scroll behavior | Static sections with `whileInView` | GSAP ScrollTrigger with 5 acts + parallax |
| Hero | Emoji crystal (💎) + gradient bg | R3F CrystalHero (desktop) / animated CSS gradient (mobile) |
| Lab showcase | 2×5 grid of small cards | Full-width hex tiles with CSS patterns + LED accents |
| Feature section | 2-column simple cards | CSS holographic cards with conic-gradient shimmer |
| Station preview | None | CSS mockup with chrome bezel, LED pulse, stat counters |
| Parallax | None | 3-layer parallax (aurora 0.3x, hex 0.6x, content 1.0x) |
| Animation library | Motion only | GSAP ScrollTrigger + Motion (hero fallback) |

### Code Review Fixes Applied (vs. Original Source Document)

| # | Severity | File | Issue | Fix |
|---|----------|------|-------|-----|
| 1 | **CRITICAL** | ScrollJourney.tsx | Uses `React.lazy()` for CrystalHero — must use `next/dynamic` with `{ ssr: false }` per CLAUDE.md 3D architecture rules | Changed to `dynamic(() => import(...), { ssr: false })` |
| 2 | **CRITICAL** | ScrollJourney.tsx | Multiple truncated JSX lines: Link className, aurora div background, CTA section divs all cut off mid-string | Fully reconstructed all truncated code with complete Frost-Prismatic styling |
| 3 | **CRITICAL** | LabDiscoveryRing.tsx | Misplaced JSX: `style={{` and `className=` on wrong lines, `aria-hidden` after closing `/>` | Corrected all JSX attribute ordering to valid syntax |
| 4 | **CRITICAL** | StationPreview.tsx | Same misplaced attribute issues — `aria-hidden` after closing tags, `style` on separate line from element | Fixed all JSX to valid React syntax |
| 5 | **HIGH** | FeatureShowcase.tsx | Uses `<style jsx>` (styled-jsx) — should use Tailwind `@keyframes` in globals.css or inline style object | Changed to standard `<style>` tag (valid in React/Next.js client components) with `dangerouslySetInnerHTML` pattern for keyframes |
| 6 | **HIGH** | StationPreview.tsx | Game count shows "28+" — GCUD V10 lists 35 total games | Updated to "35+" to match GCUD |
| 7 | **HIGH** | LabDiscoveryRing.tsx | Lab colors use arbitrary hex values that don't match Tailwind `lab.*` tokens or `types/index.ts` `LABS` colors | Aligned to CLAUDE.md Section 6 authoritative lab colors |
| 8 | **HIGH** | LabDiscoveryRing.tsx | Imports `WORLDS` from `@/types` but doesn't use it — all data is hardcoded | Removed unused import; data intentionally hardcoded for landing page independence |
| 9 | **MEDIUM** | ScrollJourney.tsx | `gsap.context()` used but `ctx` typed as `any` | Typed as `ReturnType<typeof gsap.context> | undefined` |
| 10 | **MEDIUM** | FeatureShowcase.tsx | `JSX.Element` return type on animation map — deprecated in React 19+ | Changed to `React.ReactNode` return type |
| 11 | **MEDIUM** | StationPreview.tsx | Math.random() in render causes hydration mismatch (SSR vs client) | Replaced with deterministic values |
| 12 | **LOW** | All files | Missing ARIA labels on interactive sections | Added `aria-label` to all `<section>` elements |
| 13 | **LOW** | LabDiscoveryRing.tsx | Game count hardcoded as `id <= 7 ? '3' : '2'` — doesn't match actual game distribution | Updated with actual per-lab game counts from GCUD V10 |

### Enhancement Suggestions

| # | Category | Enhancement | Rationale |
|---|----------|-------------|-----------|
| 1 | **UI/UX** | Add `prefers-reduced-motion` media query to disable parallax and GSAP animations | Accessibility requirement for motion-sensitive users |
| 2 | **UI/UX** | Add subtle gradient border glow on lab tiles that matches each lab's color on hover | Reinforces the color identity of each lab beyond just the LED strip |
| 3 | **Interactivity** | Add `IntersectionObserver` fallback for GSAP ScrollTrigger load failure | Graceful degradation if GSAP CDN/bundle fails |
| 4 | **Performance** | Lazy-load LabDiscoveryRing, FeatureShowcase, and StationPreview with `next/dynamic` | Reduces initial bundle since these are below-the-fold |
| 5 | **Visual** | Add a subtle scanline overlay (2px repeating gradient) on the StationPreview mockup | Reinforces the "control station screen" aesthetic from Stage 3 |
| 6 | **Interactivity** | Make lab tiles clickable with `Link` to `/dashboard/labs/{id}` for logged-in users | Converts the showcase into navigation |
| 7 | **Visual** | Add particle trail effect between acts during scroll | Creates visual continuity between the 5 acts |

---

## Directory Setup

```bash
mkdir -p src/components/landing
```

---

## Step 1: ScrollJourney.tsx

5-act GSAP scroll orchestrator. Manages parallax layers, dynamic CrystalHero import (desktop via `next/dynamic`), CSS gradient fallback (mobile), ScrollTrigger animations for all acts, and Act 1 hero + Act 5 CTA inline content.

```tsx
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
// ================================================================

'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Rocket, Sparkles, ArrowDown } from 'lucide-react';
import { LabDiscoveryRing } from '@/components/landing/LabDiscoveryRing';
import { FeatureShowcase } from '@/components/landing/FeatureShowcase';
import { StationPreview } from '@/components/landing/StationPreview';

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

// ---- Component ----
export function ScrollJourney() {
  const containerRef = useRef<HTMLDivElement>(null);
  const auroraRef = useRef<HTMLDivElement>(null);
  const hexLayerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(true);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // GSAP ScrollTrigger initialization
  useEffect(() => {
    let ctx: ReturnType<typeof import('gsap').gsap.context> | undefined;

    async function initGSAP() {
      try {
        const gsapModule = await import('gsap');
        const scrollModule = await import('gsap/ScrollTrigger');
        const gsap = gsapModule.default || gsapModule.gsap;
        const ScrollTrigger = scrollModule.ScrollTrigger || scrollModule.default;
        gsap.registerPlugin(ScrollTrigger);

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
      }
    }

    initGSAP();

    return () => {
      ctx?.revert();
    };
  }, [isMobile]);

  return (
    <div ref={containerRef} className="relative">
      {/* ■■■■ PARALLAX LAYER 1: Aurora Background (0.3x) ■■■■ */}
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

      {/* ■■■■ PARALLAX LAYER 2: Mid-layer Hex Shapes (0.6x, desktop only) ■■■■ */}
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

      {/* ■■■■ ACT 1: Crystal Hero (0-20%) ■■■■ */}
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
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            {/* Sparkle dots */}
            {[15, 30, 45, 55, 65, 75, 35, 50].map((seed, i) => (
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
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          aria-hidden="true"
        >
          <ArrowDown className="w-5 h-5 text-white/30" />
        </motion.div>
      </section>

      {/* ■■■■ ACT 2: Lab Discovery Ring (20-50%) ■■■■ */}
      <section data-act="2" className="py-24 px-6" aria-label="Explore 10 AI Labs">
        <LabDiscoveryRing />
      </section>

      {/* ■■■■ ACT 3: Feature Showcase (50-70%) ■■■■ */}
      <section data-act="3" className="py-24 px-6" aria-label="Platform features">
        <FeatureShowcase />
      </section>

      {/* ■■■■ ACT 4: Station Preview (70-85%) ■■■■ */}
      <section data-act="4" className="py-24 px-6" aria-label="Station preview">
        <StationPreview />
      </section>

      {/* ■■■■ ACT 5: Call to Action (85-100%) ■■■■ */}
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
```

---

## Step 2: LabDiscoveryRing.tsx

Act 2 component. 10 lab tiles with hex badge, CSS pattern backgrounds, lab names/descriptions, game counts, and LED accent strips. GSAP stagger animation from alternating sides applied by parent ScrollJourney via `data-lab-tile` attributes.

```tsx
// src/components/landing/LabDiscoveryRing.tsx
// ================================================================
// LAB DISCOVERY RING — Act 2: Hex Tile Lab Showcase
// ================================================================
// Decision 8.1: 10 hex tiles stagger in from alternating sides
// via GSAP ScrollTrigger. Each tile shows lab icon, name, and
// CSS pattern background. Tiles "light up" as user scrolls past.
//
// Pure CSS/GSAP — no 3D elements.
// GSAP animations applied by parent ScrollJourney via data attrs.
// Lab colors aligned to CLAUDE.md Section 6 authoritative values.
// ================================================================

'use client';

// ---- Lab Pattern CSS backgrounds (approximating GLSL shaders) ----
const LAB_PATTERNS: Record<number, string> = {
  1: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,187,255,0.06) 8px, rgba(0,187,255,0.06) 16px)',
  2: 'radial-gradient(circle at 30% 40%, rgba(170,102,255,0.08) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(170,102,255,0.06) 0%, transparent 50%)',
  3: 'repeating-conic-gradient(from 0deg, transparent 0deg 30deg, rgba(255,102,170,0.05) 30deg 60deg)',
  4: 'linear-gradient(135deg, rgba(255,170,68,0.06) 25%, transparent 25%, transparent 75%, rgba(255,170,68,0.06) 75%)',
  5: 'repeating-linear-gradient(0deg, transparent, transparent 12px, rgba(0,255,136,0.05) 12px, rgba(0,255,136,0.05) 24px)',
  6: 'radial-gradient(circle at 50% 50%, rgba(255,102,68,0.07) 0%, transparent 60%)',
  7: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(6,182,212,0.05) 10px, rgba(6,182,212,0.05) 20px)',
  8: 'linear-gradient(45deg, rgba(129,140,248,0.06) 0%, transparent 50%, rgba(129,140,248,0.04) 100%)',
  9: 'repeating-conic-gradient(from 45deg, transparent 0deg 45deg, rgba(249,115,22,0.05) 45deg 90deg)',
  10: 'radial-gradient(circle at 60% 30%, rgba(217,70,239,0.07) 0%, transparent 50%), linear-gradient(180deg, rgba(217,70,239,0.03) 0%, transparent 100%)',
};

// ---- Lab Colors (CLAUDE.md Section 6 authoritative) ----
const LAB_COLORS: Record<number, string> = {
  1: '#00BBFF',
  2: '#AA66FF',
  3: '#FF66AA',
  4: '#FFAA44',
  5: '#00FF88',
  6: '#FF6644',
  7: '#06B6D4',
  8: '#818CF8',
  9: '#F97316',
  10: '#D946EF',
};

// ---- Lab Icons (emoji) ----
const LAB_ICONS: Record<number, string> = {
  1: '\u{1F4BB}',  // 💻
  2: '\u{1F4CA}',  // 📊
  3: '\u{1F9E0}',  // 🧠
  4: '\u{1F3A8}',  // 🎨
  5: '\u{1F916}',  // 🤖
  6: '\u{2696}',   // ⚖️
  7: '\u{1F441}',  // 👁️
  8: '\u{1F4AC}',  // 💬
  9: '\u{1F528}',  // 🔨
  10: '\u{1F52D}', // 🔭
};

// ---- Lab Names ----
const LAB_NAMES: Record<number, string> = {
  1: 'Code Lab',
  2: 'Data Lab',
  3: 'Neural Lab',
  4: 'Create Lab',
  5: 'Agent Lab',
  6: 'Ethics Lab',
  7: 'Vision Lab',
  8: 'Language Lab',
  9: 'Build Lab',
  10: 'Frontier Lab',
};

// ---- Lab Descriptions ----
const LAB_DESCS: Record<number, string> = {
  1: 'Learn the building blocks of programming and AI logic',
  2: 'Discover how AI finds patterns in data',
  3: 'Build and train neural networks from scratch',
  4: 'Create AI-powered art, music, and stories',
  5: 'Design autonomous AI agents that take action',
  6: 'Explore fairness, bias, and responsible AI',
  7: 'Teach machines to see and understand images',
  8: 'Give AI the power to understand human language',
  9: 'Build complete AI-powered applications',
  10: 'Push the boundaries of what AI can do',
};

// ---- Per-lab game counts (from GCUD V10) ----
const LAB_GAME_COUNTS: Record<number, number> = {
  1: 3, 2: 4, 3: 3, 4: 4, 5: 3, 6: 4, 7: 3, 8: 4, 9: 4, 10: 3,
};

export function LabDiscoveryRing() {
  const labIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Section header */}
      <div className="text-center mb-12">
        <p className="font-mono text-xs text-[#00BBFF]/60 uppercase tracking-widest mb-2">
          Explore
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
          10 AI Laboratories
        </h2>
        <p className="font-body text-base text-white/40 max-w-md mx-auto">
          Each lab unlocks a new area of AI discovery. Complete experiments
          to earn XP, collect badges, and advance through the station.
        </p>
      </div>

      {/* Lab tiles */}
      <div className="space-y-4">
        {labIds.map((id) => {
          const color = LAB_COLORS[id];
          const gameCount = LAB_GAME_COUNTS[id];
          return (
            <div
              key={id}
              data-lab-tile
              className="group relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300"
            >
              {/* Pattern background */}
              <div
                className="absolute inset-0 opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ backgroundImage: LAB_PATTERNS[id] }}
                aria-hidden="true"
              />

              {/* Glow accent on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(ellipse at center, ${color}10, transparent 70%)`,
                }}
                aria-hidden="true"
              />

              <div className="relative flex items-center gap-4 p-5 md:p-6">
                {/* Lab number hex badge */}
                <div
                  className="flex-shrink-0 w-14 h-14 flex items-center justify-center text-2xl"
                  style={{
                    clipPath:
                      'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                    background: `linear-gradient(135deg, ${color}20, ${color}08)`,
                  }}
                >
                  {LAB_ICONS[id]}
                </div>

                {/* Lab info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: `${color}15`, color }}
                    >
                      LAB {id}
                    </span>
                    <h3 className="font-display text-base font-bold text-white">
                      {LAB_NAMES[id]}
                    </h3>
                  </div>
                  <p className="font-body text-sm text-white/40 leading-relaxed">
                    {LAB_DESCS[id]}
                  </p>
                </div>

                {/* Game count badge */}
                <div className="flex-shrink-0 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <span className="font-mono text-xs text-white/30">
                    {gameCount} games
                  </span>
                </div>
              </div>

              {/* Bottom LED accent */}
              <div
                className="h-[2px] w-full opacity-30 group-hover:opacity-70 transition-opacity"
                style={{
                  background: `linear-gradient(to right, transparent, ${color}, transparent)`,
                }}
                aria-hidden="true"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## Step 3: FeatureShowcase.tsx

Act 3 component. 4 feature cards with CSS holographic effect (Decision 8.3: conic-gradient + mix-blend-mode). Rainbow sweep animation on hover. Mini animations: XP tick, badge glow, age band indicators, chart bars. GSAP entrance via `data-feature-card` attributes.

```tsx
// src/components/landing/FeatureShowcase.tsx
// ================================================================
// FEATURE SHOWCASE — Act 3: CSS Holographic Feature Cards
// ================================================================
// Decision 8.3: CSS-only holographic effect (conic-gradient +
// mix-blend-mode) for premium feel. Consistent with Decision 4.3
// (holographic shader limited to collectibles). Lighter than R3F.
//
// 4 feature cards: Gamification, AI Safety, Adaptive Learning,
// Parent Dashboard. Each has a mini CSS animation.
//
// GSAP animations applied by parent ScrollJourney via data attrs.
// ================================================================

'use client';

import React from 'react';
import {
  Sparkles, Shield, Brain, BarChart3,
  Award, Zap,
} from 'lucide-react';

// ---- Feature Card Data ----
interface FeatureCard {
  icon: typeof Sparkles;
  title: string;
  description: string;
  color: string;
  miniAnimation: 'xp-tick' | 'badge-glow' | 'brain-pulse' | 'chart-grow';
}

const FEATURES: FeatureCard[] = [
  {
    icon: Sparkles,
    title: 'Gamified Learning',
    description:
      'Earn XP, collect badges, unlock new labs, and climb the leaderboard. Every experiment rewards curiosity.',
    color: '#FFAA44',
    miniAnimation: 'xp-tick',
  },
  {
    icon: Shield,
    title: 'AI Safety First',
    description:
      'COPPA 2025 compliant. Content moderation, bias detection lessons, and responsible AI baked into every lab.',
    color: '#00FF88',
    miniAnimation: 'badge-glow',
  },
  {
    icon: Brain,
    title: 'Adaptive Learning',
    description:
      "Three age bands (7-9, 10-12, 13-16) with content that adapts to each child's level. No child left behind.",
    color: '#AA66FF',
    miniAnimation: 'brain-pulse',
  },
  {
    icon: BarChart3,
    title: 'Parent Dashboard',
    description:
      'Track progress, set time limits, review completed experiments, and celebrate milestones together.',
    color: '#00BBFF',
    miniAnimation: 'chart-grow',
  },
];

// ---- Mini Animation Components ----
function XPTickAnimation() {
  return (
    <div className="flex items-center gap-1">
      <Zap className="w-3.5 h-3.5 text-[#FFAA44]" />
      <span className="font-mono text-xs text-[#FFAA44]">+15 XP</span>
    </div>
  );
}

function BadgeGlowAnimation() {
  return (
    <div className="relative">
      <Award className="w-5 h-5 text-[#00FF88]" />
      <div
        className="absolute inset-0 rounded-full bg-[#00FF88]/20 animate-ping"
        style={{ animationDuration: '2s' }}
      />
    </div>
  );
}

function BrainPulseAnimation() {
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {['A', 'B', 'C'].map((band) => (
          <span
            key={band}
            className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center bg-[#AA66FF]/20 text-[#AA66FF]"
          >
            {band}
          </span>
        ))}
      </div>
    </div>
  );
}

function ChartGrowAnimation() {
  return (
    <div className="flex items-end gap-0.5 h-5">
      {[30, 50, 40, 70, 60, 80, 75].map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-t bg-[#00BBFF]/60"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

const MINI_ANIMATIONS: Record<string, () => React.ReactNode> = {
  'xp-tick': XPTickAnimation,
  'badge-glow': BadgeGlowAnimation,
  'brain-pulse': BrainPulseAnimation,
  'chart-grow': ChartGrowAnimation,
};

// ---- Component ----
export function FeatureShowcase() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Section header */}
      <div className="text-center mb-12">
        <p className="font-mono text-xs text-[#AA66FF]/60 uppercase tracking-widest mb-2">
          Why SparkForge
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
          Built for Young Explorers
        </h2>
        <p className="font-body text-base text-white/40 max-w-md mx-auto">
          Every feature is designed to make AI learning safe, fun,
          and genuinely educational.
        </p>
      </div>

      {/* Feature cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          const MiniAnim = MINI_ANIMATIONS[feature.miniAnimation];

          return (
            <div
              key={feature.title}
              data-feature-card
              className="group relative rounded-2xl overflow-hidden"
            >
              {/* CSS Holographic shimmer layer (Decision 8.3) */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{
                  mixBlendMode: 'screen',
                  background: `conic-gradient(from 180deg at 50% 50%, ${feature.color}08, transparent, ${feature.color}05, transparent, ${feature.color}08)`,
                }}
                aria-hidden="true"
              />

              {/* Rainbow sweep on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none holographic-sweep-bg"
                style={{
                  background: `linear-gradient(105deg, transparent 40%, ${feature.color}15 45%, ${feature.color}25 50%, ${feature.color}15 55%, transparent 60%)`,
                  backgroundSize: '200% 100%',
                }}
                aria-hidden="true"
              />

              {/* Card content */}
              <div className="relative border border-white/[0.06] bg-white/[0.02] group-hover:bg-white/[0.04] rounded-2xl p-6 md:p-8 transition-colors duration-300">
                {/* Top row: icon + mini animation */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${feature.color}12` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: feature.color }} />
                  </div>
                  <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                    {MiniAnim && <MiniAnim />}
                  </div>
                </div>

                <h3 className="font-display text-lg font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="font-body text-sm text-white/50 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Keyframe for holographic sweep — injected once */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes holographic-sweep {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
            .holographic-sweep-bg {
              animation: holographic-sweep 3s linear infinite;
            }
          `,
        }}
      />
    </div>
  );
}
```

---

## Step 4: StationPreview.tsx

Act 4 component. CSS mockup of the station frame with chrome bezel, LED rim glow pulse, aurora background, dashboard UI placeholders, and corner rivets. Stats counters (10 Labs, 35+ Games, 100+ Badges) tick up via GSAP `data-stat-counter` attributes.

```tsx
// src/components/landing/StationPreview.tsx
// ================================================================
// STATION PREVIEW — Act 4: Dashboard Teaser with CSS Glow
// ================================================================
// Decision 8.2: High-quality CSS mockup of the station frame
// with subtle animation (LED rim glow pulse, parallax shift).
// Stats counters tick up via GSAP ScrollTrigger (from parent).
//
// Zero 3D overhead — purely CSS.
// ================================================================

'use client';

import { Sparkles, Gamepad2, Award, Zap, Trophy } from 'lucide-react';

// ---- Stats Data ----
const STATS = [
  { label: 'AI Labs', value: 10, suffix: '', icon: Sparkles, color: '#00BBFF' },
  { label: 'Games', value: 35, suffix: '+', icon: Gamepad2, color: '#AA66FF' },
  { label: 'Badges', value: 100, suffix: '+', icon: Award, color: '#FFAA44' },
];

// ---- Deterministic mock lab cards (avoid Math.random in render) ----
const MOCK_LABS = [
  { color: '#00BBFF', label: 'Code', progress: 72 },
  { color: '#AA66FF', label: 'Data', progress: 55 },
  { color: '#FF66AA', label: 'Neural', progress: 40 },
  { color: '#FFAA44', label: 'Create', progress: 88 },
  { color: '#00FF88', label: 'Agent', progress: 63 },
];

// ---- Deterministic mini bar heights ----
const MINI_BARS = [10, 14, 8, 18, 12];

export function StationPreview() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Section header */}
      <div className="text-center mb-12">
        <p className="font-mono text-xs text-[#06B6D4]/60 uppercase tracking-widest mb-2">
          Your Workspace
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
          The Laboratory Control Station
        </h2>
        <p className="font-body text-base text-white/40 max-w-md mx-auto">
          A beautiful, immersive dashboard where every experiment
          comes to life.
        </p>
      </div>

      {/* Station mockup (CSS placeholder) */}
      <div data-station-preview className="relative rounded-2xl overflow-hidden">
        {/* Outer chrome bezel */}
        <div className="relative rounded-2xl border border-white/[0.08] bg-[#0B1628] p-1.5 md:p-2">
          {/* LED rim glow pulse */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none led-rim-pulse"
            style={{
              boxShadow:
                '0 0 30px rgba(0,187,255,0.08), inset 0 0 30px rgba(0,187,255,0.04)',
            }}
            aria-hidden="true"
          />

          {/* Inner screen */}
          <div className="relative rounded-xl overflow-hidden bg-[#0D1117] border border-white/[0.04]">
            {/* Aurora background simulation */}
            <div className="absolute inset-0" aria-hidden="true">
              <div className="absolute top-[10%] left-[20%] w-64 h-32 rounded-full bg-[#00BBFF]/[0.06] blur-[60px]" />
              <div className="absolute top-[30%] right-[15%] w-48 h-48 rounded-full bg-[#AA66FF]/[0.04] blur-[50px]" />
              <div className="absolute bottom-[20%] left-[40%] w-56 h-28 rounded-full bg-[#06B6D4]/[0.04] blur-[40px]" />
            </div>

            {/* Mock dashboard content */}
            <div className="relative p-6 md:p-10 min-h-[280px] md:min-h-[360px]">
              {/* Top bar mockup */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00BBFF]/30 to-[#AA66FF]/30" />
                  <div className="w-20 h-3 rounded bg-white/[0.06]" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FFAA44]/10">
                    <Zap className="w-3 h-3 text-[#FFAA44]" />
                    <span className="font-mono text-[10px] text-[#FFAA44]">
                      1,250 XP
                    </span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/[0.08]" />
                </div>
              </div>

              {/* Lab cards mockup */}
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 mb-6">
                {MOCK_LABS.map((lab) => (
                  <div
                    key={lab.label}
                    className="rounded-xl p-3 border border-white/[0.06]"
                    style={{ background: `${lab.color}08` }}
                  >
                    <div
                      className="w-6 h-6 rounded-lg mb-2"
                      style={{ background: `${lab.color}20` }}
                    />
                    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${lab.progress}%`,
                          background: lab.color,
                          opacity: 0.5,
                        }}
                      />
                    </div>
                    <p className="font-mono text-[8px] text-white/20 mt-1">
                      {lab.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bottom stats mockup */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#FFAA44]/40" />
                  <div className="w-16 h-2 rounded bg-white/[0.04]" />
                </div>
                <div className="flex items-center gap-1">
                  {MINI_BARS.map((h, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-[#00BBFF]/30"
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom LED strip */}
            <div
              className="h-[2px] w-full"
              style={{
                opacity: 0.3,
                background:
                  'linear-gradient(to right, transparent, #00BBFF, #AA66FF, #06B6D4, transparent)',
              }}
              aria-hidden="true"
            />
          </div>

          {/* Corner chrome rivets */}
          {['top-1 left-1', 'top-1 right-1', 'bottom-1 left-1', 'bottom-1 right-1'].map(
            (pos) => (
              <div
                key={pos}
                className={`absolute ${pos} w-2 h-2 rounded-full bg-white/[0.06] border border-white/[0.08]`}
                aria-hidden="true"
              />
            )
          )}
        </div>
      </div>

      {/* Stats counters (GSAP animated via data attrs) */}
      <div className="grid grid-cols-3 gap-4 md:gap-8 mt-10 max-w-lg mx-auto">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="text-center">
              <Icon
                className="w-5 h-5 mx-auto mb-2"
                style={{ color: stat.color, opacity: 0.6 }}
              />
              <p
                data-stat-counter
                data-target={stat.value}
                data-suffix={stat.suffix}
                className="font-display text-3xl md:text-4xl font-bold text-white"
              >
                0{stat.suffix}
              </p>
              <p className="font-body text-xs text-white/30 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Keyframe for LED pulse */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes led-pulse {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
            .led-rim-pulse {
              animation: led-pulse 4s ease-in-out infinite;
            }
          `,
        }}
      />
    </div>
  );
}
```

---

## Verification Checklist

```
✅ src/components/landing/ScrollJourney.tsx   — 5-act orchestrator with parallax
✅ src/components/landing/LabDiscoveryRing.tsx — 10 lab hex tiles with LED accents
✅ src/components/landing/FeatureShowcase.tsx  — 4 holographic feature cards
✅ src/components/landing/StationPreview.tsx   — CSS station mockup with counters
✅ CrystalHero imported via next/dynamic with { ssr: false }
✅ Lab colors match CLAUDE.md Section 6 authoritative values
✅ Game count = 35+ (GCUD V10 compliant)
✅ All aria-hidden and aria-label attributes present
✅ No Math.random() in render (hydration-safe)
✅ No styled-jsx — uses standard style injection
✅ Fonts: font-display (Exo 2), font-body (Sora), font-mono (JetBrains Mono)
✅ npm run build          — PASS
✅ npx tsc --noEmit       — PASS
```

## Component Audit Summary

| Component | Lines | GSAP | R3F | Mobile Fallback | ARIA | Fonts |
|-----------|-------|------|-----|-----------------|------|-------|
| ScrollJourney | ~310 | ScrollTrigger + parallax | CrystalHero (dynamic) | CSS gradient + sparkles | ✅ | display, body |
| LabDiscoveryRing | ~155 | via data-lab-tile | None | Identical | ✅ | display, body, mono |
| FeatureShowcase | ~175 | via data-feature-card | None | Identical | ✅ | display, body, mono |
| StationPreview | ~175 | via data-stat-counter | None | Identical | ✅ | display, body, mono, data |

## Decision Implementation Status (Part A)

| Decision | Description | Component | Status |
|----------|-------------|-----------|--------|
| 8.1 | Crystal hero: shared DNA, diff execution | ScrollJourney Act 1 (CrystalHero R3F / CSS fallback) | ✅ COMPLETE |
| 8.2 | Station preview: static + CSS glow | StationPreview.tsx | ✅ COMPLETE |
| 8.3 | Feature cards: CSS holographic | FeatureShowcase.tsx | ✅ COMPLETE |
| 8.4 | Pricing: separate /pricing route | Part B (upcoming) | ⏳ PENDING |
| 8.5 | Mobile: simplified 2D + CSS | ScrollJourney (isMobile checks) | ✅ COMPLETE |

---

**NEXT:** Part B — Pricing page replacement (`src/app/(marketing)/pricing/page.tsx`) with v3 station aesthetics

---

## SOURCE CODE VERIFICATION — 2026-03-15

**Audit Scope:** Line-by-line verification of all source code files produced by this document.
**Result:** ALL FILES COMPLETE AND CORRECT

| File | Lines | Status |
|------|-------|--------|
| `src/components/landing/ScrollJourney.tsx` | 598 | ✓ COMPLETE — All 5 acts, parallax layers, GSAP init, IO fallback |
| `src/components/landing/FeatureShowcase.tsx` | 238 | ✓ COMPLETE — 4 feature cards, mini animations, holographic CSS |
| `src/components/landing/StationPreview.tsx` | 232 | ✓ COMPLETE — LED pulse, scanline overlay, stats counters |
| `src/components/landing/LabDiscoveryRing.tsx` | 225 | ✓ COMPLETE — 10 lab tiles with patterns, colors, descriptions |
| `src/hooks/useGSAPScroll.ts` | 171 | ✓ COMPLETE — ScrollTrigger, parallax, stagger utilities |
| `src/components/3d/CrystalHero.tsx` | 166 | ✓ COMPLETE — R3F crystal, sparkles, bloom, mouse parallax |

**Compliance Checks:**
- ✓ Game count: "35+" in StationPreview (line 23) and all metadata — issue 8.12 RESOLVED
- ✓ GSAP dynamic import with try-catch error handling (ScrollJourney lines 207-211, 374-378) — issue 8.9 RESOLVED
- ✓ CrystalHero: `ssr: false` dynamic import — correct
- ✓ No Fredoka/Nunito Sans font references
- ✓ TypeScript strict mode passes
- ✓ Build passes with 0 errors
