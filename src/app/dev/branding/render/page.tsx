/**
 * Render-only branding route — /dev/branding/render
 *
 * UI-chrome-free version of /dev/branding used by scripts/render-branding.ts
 * (offline 4K render pipeline). Reads ?subject=sf|sparkforge|loop and
 * ?t= query params; mounts the chosen subject at full viewport with a
 * canonical pose; sets `window.__brandingReady = true` once the first
 * frame has rendered so puppeteer can wait for it before screenshotting.
 *
 * Reachable on every environment (local, preview, production).
 */

import { Metadata } from 'next';
import { BrandingRenderClient } from './client';

export const metadata: Metadata = {
  title: 'SparkForge Branding · Render',
  description: 'Offline render pipeline target',
  robots: { index: false, follow: false },
};

export default function BrandingRenderPage() {
  return <BrandingRenderClient />;
}
