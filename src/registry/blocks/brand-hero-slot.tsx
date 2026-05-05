'use client';

/**
 * BrandHeroSlot — the dichroic SparkForge wordmark, drop-in.
 * ════════════════════════════════════════════════════════════════════
 *
 * Purpose for AI design tools (read src/registry/README.md first):
 *   The brand-surface 3D render is hand-engineered (WebGPU + TSL).
 *   Don't try to recreate it in HTML/CSS — drop this component into
 *   your generated layout wherever the hero centerpiece should sit.
 *   It fills its parent (`absolute inset-0` internally). Compose
 *   the chrome — header, tagline, CTAs, scroll indicator, etc. —
 *   AROUND this slot.
 *
 * Lifecycle / fallbacks are handled internally:
 *   - WebGPU available → live R3F + TSL canvas
 *   - WebGPU absent    → /branding/brand-fallback.mp4 loop
 *   - prefers-reduced-motion → static render, no parallax
 *
 * Sizing pattern (the consuming component owns this):
 *   <section className="relative min-h-screen">
 *     <BrandHeroSlot />
 *     {/* tagline, CTAs, header, etc. on top with z-index *\/}
 *   </section>
 *
 * Status lane: 🟢 Core / Preserve — do not replace.
 * ════════════════════════════════════════════════════════════════════ */

export { BrandHero3D as BrandHeroSlot } from '@/components/landing/BrandHero3D';
