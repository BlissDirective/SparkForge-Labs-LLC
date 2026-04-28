/**
 * Dev showcase route — /dev/branding
 *
 * Visual checkpoint for Phase 1: BrandingMaterial applied to placeholder
 * geometry, side-by-side with the IMG_4607 reference for eye-comparison.
 *
 * Mythos halt rule (CLAUDE.md v6.6): iterate sf-material.config.ts until
 * SSIM(canvas-snapshot, IMG_4607) >= 0.96 over a matched-rotation frame.
 *
 * Not for production. Excluded from sitemap and crawlers.
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BrandingDevClient } from './client';

export const metadata: Metadata = {
  title: 'SparkForge Branding · Dev Lab',
  description: 'Internal — BrandingMaterial visual checkpoint',
  robots: { index: false, follow: false },
};

export default function BrandingDevPage() {
  // Hard-stop the route in production unless the preview override is
  // explicitly set. Mirrors the middleware check, defence-in-depth.
  const allowDevRoutes =
    process.env.NEXT_PUBLIC_ALLOW_DEV_ROUTES === 'true';
  if (process.env.NODE_ENV === 'production' && !allowDevRoutes) {
    notFound();
  }
  return <BrandingDevClient />;
}
