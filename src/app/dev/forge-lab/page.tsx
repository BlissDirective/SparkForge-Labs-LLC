/**
 * Forge Lab hotspot hub — public prototype preview (/dev/forge-lab)
 *
 * Indoor forge laboratory with a locked world plate + DOM hotspot twins.
 * Authenticated path is /forge-lab, gated by FEATURE_FLAGS.FORGE_LAB_HUB.
 *
 * /dev/* routes are public on every environment (middleware).
 */

import { Metadata } from 'next';
import { ForgeLabPreviewClient } from './client';

export const metadata: Metadata = {
  title: 'Forge Lab Hub · Dev Lab',
  description: 'Indoor forge-lab hotspot hub — always-on top hologram + SF portal',
  robots: { index: false, follow: false },
};

export default function ForgeLabDevPage() {
  return <ForgeLabPreviewClient />;
}
