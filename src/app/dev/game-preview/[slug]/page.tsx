// ════════════════════════════════════════════════════════════════════════
// DEV GAME PREVIEW ROUTE — /dev/game-preview/[slug]
// ════════════════════════════════════════════════════════════════════════
// Auth-free single-game mount for the Playwright migration smoke test
// (HS-5 visual checkpoint). Guarded to non-production so it never ships live.

import type { Metadata } from 'next';
import GamePreviewClient from './GamePreviewClient';

// Reachable on every environment (no NODE_ENV gate), matching the existing
// /dev/* visual-checkpoint routes (/dev/hero-v3, /dev/branding) per the project
// convention. Always noindex. Mounts a single game with no auth so the
// Playwright migration smoke test can run against a production build.
export const metadata: Metadata = {
  title: 'Game Preview · Dev Lab',
  robots: { index: false, follow: false },
};

export default async function GamePreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <GamePreviewClient slug={slug} />;
}
