/**
 * Mission Control Hub — public prototype preview (/dev/mission-control)
 *
 * Renders the spatial kid-hub shell with sample instruments so reviewers
 * can inspect architecture without a session. The authenticated kid path
 * is /mission-control and is gated by FEATURE_FLAGS.MISSION_CONTROL_HUB.
 *
 * /dev/* routes are public on every environment (middleware).
 */

import { Metadata } from 'next';
import { MissionControlPreviewClient } from './client';

export const metadata: Metadata = {
  title: 'Mission Control Hub · Dev Lab',
  description: 'Spatial kid-hub prototype — holographic instrument console',
  robots: { index: false, follow: false },
};

export default function MissionControlDevPage() {
  return <MissionControlPreviewClient />;
}
