/**
 * Branding showcase route — /dev/branding
 *
 * Visual checkpoint for the BrandingMaterial / SF mark / SparkForge wordmark
 * stack. Reachable on every environment (local, preview, production).
 *
 * Mythos halt rule (CLAUDE.md v6.6): iterate sf-material.config.ts until
 * SSIM(canvas-snapshot, IMG_4607) >= 0.96 over a matched-rotation frame.
 */

import { Metadata } from 'next';
import { BrandingDevClient } from './client';

export const metadata: Metadata = {
  title: 'SparkForge Branding · Dev Lab',
  description: 'BrandingMaterial visual checkpoint',
  robots: { index: false, follow: false },
};

export default function BrandingDevPage() {
  return <BrandingDevClient />;
}
