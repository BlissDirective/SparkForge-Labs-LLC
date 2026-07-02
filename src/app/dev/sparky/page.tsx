/**
 * Sparky mascot showcase route — /dev/sparky
 *
 * Visual checkpoint for the Sparky component system (Phase 3):
 * SparkyCore expressions/sizes, SparkyFloating, SparkyPresenter, and the
 * SparkyRive reactive game mascot (procedural fallback until
 * public/rive/sparky.riv is authored — see docs/SPARKY-RIVE-SPEC.md).
 *
 * /dev/* routes are public on every environment (middleware).
 */

import { Metadata } from 'next';
import { SparkyDevClient } from './client';

export const metadata: Metadata = {
  title: 'Sparky Mascot · Dev Lab',
  description: 'Sparky component system visual checkpoint',
  robots: { index: false, follow: false },
};

export default function SparkyDevPage() {
  return <SparkyDevClient />;
}
