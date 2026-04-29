'use client';

/**
 * Render-only client for /dev/branding/render.
 *
 * Behaviour:
 *   1. Reads ?subject= (sf | sparkforge | loop) and ?t= (seconds).
 *   2. Mounts BrandingShowcase full-viewport, no overlays/sliders.
 *   3. For loop subject, drives a slow rotation by `t` so puppeteer can
 *      capture an even sequence of frames (60 frames × dt = 1/30 → 2s loop).
 *   4. Sets `window.__brandingReady = true` after the first frame paints
 *      (via a dispatched flag from a useFrame-once hook).
 *
 * The shader pipeline is identical to /dev/branding — same BrandingMaterial,
 * same lighting rig, same SVG sources. This guarantees offline renders are
 * a faithful replica of what the live hero will display.
 */

import { Suspense, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSearchParams } from 'next/navigation';
import { BrandingShowcase } from '@/components/3d/branding/BrandingShowcase';
import { SfMark3D } from '@/components/3d/branding/SfMark3D';
import { SparkForgeWordmark3D } from '@/components/3d/branding/SparkForgeWordmark3D';

type RenderSubject = 'sf' | 'sparkforge' | 'loop';

function parseSubject(s: string | null): RenderSubject {
  if (s === 'sf' || s === 'sparkforge' || s === 'loop') return s;
  return 'sf';
}

function parseTime(s: string | null): number {
  const n = Number.parseFloat(s ?? '0');
  return Number.isFinite(n) ? n : 0;
}

declare global {
  interface Window {
    __brandingReady?: boolean;
  }
}

/**
 * One-shot ready-flag emitter. Sets window.__brandingReady = true after
 * the first useFrame tick, signalling to puppeteer that the canvas has
 * actually rendered (not just mounted).
 */
function ReadyFlag() {
  useFrame(() => {
    if (typeof window !== 'undefined' && !window.__brandingReady) {
      window.__brandingReady = true;
    }
  });
  return null;
}

/**
 * Loop driver — rotates the subject group around Y by `t` * 0.2 rad.
 * Used for the brand-fallback.mp4 capture (slow ±0.2 rad sweep over 2s).
 */
function LoopRotator({ children, t }: { children: React.ReactNode; t: number }) {
  const angle = Math.sin(t * Math.PI) * 0.2; // ±0.2 rad
  return <group rotation={[0, angle, 0]}>{children}</group>;
}

export function BrandingRenderClient() {
  const params = useSearchParams();
  const subject = parseSubject(params.get('subject'));
  const t = parseTime(params.get('t'));

  // Reset the ready flag on every navigation so the script can re-await
  // (puppeteer keeps the page alive across screenshots).
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__brandingReady = false;
    }
  }, [subject, t]);

  // Camera distance per subject. Wordmark needs 10.0; SF mark 6.4.
  const cameraDistance = useMemo(() => {
    if (subject === 'sparkforge') return 10.0;
    return 6.4; // sf + loop both render the SF mark
  }, [subject]);

  return (
    <main
      className="h-screen w-screen"
      style={{ overflow: 'hidden', background: 'transparent' }}
    >
      <BrandingShowcase
        cameraDistance={cameraDistance}
        enableControls={false}
        ariaLabel="Offline render target"
        transparent={subject !== 'loop'}
      >
        <ReadyFlag />
        {subject === 'sparkforge' ? (
          <Suspense fallback={null}>
            <SparkForgeWordmark3D />
          </Suspense>
        ) : subject === 'loop' ? (
          <Suspense fallback={null}>
            <LoopRotator t={t}>
              <SfMark3D />
            </LoopRotator>
          </Suspense>
        ) : (
          <Suspense fallback={null}>
            <SfMark3D />
          </Suspense>
        )}
      </BrandingShowcase>
    </main>
  );
}
