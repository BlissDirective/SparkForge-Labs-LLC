// ════════════════════════════════════════════════════════════════
// P2 §6.3 — cockpitConfig single-source-of-truth contract
// ════════════════════════════════════════════════════════════════
// Verifies structural-detail counts derive from cockpitConfig.
// If anyone hand-edits the CockpitStructuralDetail.tsx `ultra`
// tier without also touching cockpitConfig, this test flags it.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { COCKPIT_GEOMETRY } from '@/lib/3d/cockpitConfig';

const ROOT = path.resolve(__dirname, '..', '..', 'src');

describe('P2 §6.3 — cockpitConfig is the source of truth', () => {
  it('CockpitStructuralDetail reads cableBundleCount from config', () => {
    const src = fs.readFileSync(
      path.join(ROOT, 'components', '3d', 'CockpitStructuralDetail.tsx'),
      'utf8',
    );
    expect(src).toMatch(/COCKPIT_GEOMETRY\.cableBundleCount/);
    // And the original hardcoded value no longer appears in the
    // `ultra` tier object literal.
    expect(src).not.toMatch(/cables:\s*60\b/);
  });

  it('cockpitConfig defines the canonical geometry surface', () => {
    // Regression: if anyone removes a field the 3D code relies on,
    // they'll find out from this test before the 3D components
    // crash at runtime.
    expect(typeof COCKPIT_GEOMETRY.panelRadius).toBe('number');
    expect(typeof COCKPIT_GEOMETRY.totalWrapArc).toBe('number');
    expect(typeof COCKPIT_GEOMETRY.panelCurvature).toBe('number');
    expect(typeof COCKPIT_GEOMETRY.cableBundleCount).toBe('number');
    expect(typeof COCKPIT_GEOMETRY.ventPanelCount).toBe('number');
    expect(Array.isArray(COCKPIT_GEOMETRY.leftConsolePosition)).toBe(true);
    expect(Array.isArray(COCKPIT_GEOMETRY.rightConsolePosition)).toBe(true);
  });
});
