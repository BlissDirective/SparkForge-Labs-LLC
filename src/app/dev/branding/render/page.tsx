/**
 * Render-only dev route — /dev/branding/render
 *
 * UI-chrome-free version of /dev/branding used by scripts/render-branding.ts
 * (Phase 4 offline render pipeline). Reads ?subject=sf|sparkforge|loop and
 * ?t= query params; mounts the chosen subject at full viewport with a
 * canonical pose; sets `window.__brandingReady = true` once the first
 * frame has rendered so puppeteer can wait for it before screenshotting.
 *
 * Not reachable in production (same guard as /dev/branding).
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BrandingRenderClient } from './client';

export const metadata: Metadata = {
  title: 'SparkForge Branding · Render',
  description: 'Internal — offline render pipeline target',
  robots: { index: false, follow: false },
};

export default function BrandingRenderPage() {
  const allowDevRoutes =
    process.env.NEXT_PUBLIC_ALLOW_DEV_ROUTES === 'true';
  if (process.env.NODE_ENV === 'production' && !allowDevRoutes) {
    notFound();
  }
  return <BrandingRenderClient />;
}
