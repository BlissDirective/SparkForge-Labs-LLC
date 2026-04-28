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
  // Hard-stop the route in production. Dev only.
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  return <BrandingDevClient />;
}
