// ════════════════════════════════════════════════════════════════
// Forge theme token parity — Concept 10 Part 15
// ════════════════════════════════════════════════════════════════
// Guards against missed overrides: every --sf-* custom property that
// design-tokens.css defines in :root MUST also be defined in
// forge-theme.css under :root[data-theme='forge'] — otherwise a
// light-theme value leaks into the forge theme.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function extractSfTokens(css: string): Set<string> {
  const tokens = new Set<string>();
  for (const match of css.matchAll(/--sf-[a-z0-9-]+(?=\s*:)/g)) {
    tokens.add(match[0]);
  }
  return tokens;
}

describe('forge theme token parity', () => {
  const stylesDir = join(__dirname, '../../src/styles');
  const designTokens = readFileSync(join(stylesDir, 'design-tokens.css'), 'utf8');
  const forgeTheme = readFileSync(join(stylesDir, 'forge-theme.css'), 'utf8');

  it('overrides every --sf-* token that design-tokens.css defines', () => {
    const base = extractSfTokens(designTokens);
    const forge = extractSfTokens(forgeTheme);
    const missing = [...base].filter((t) => !forge.has(t));
    expect(missing).toEqual([]);
  });

  it('defines the forge-specific tokens the primitives rely on', () => {
    for (const required of [
      '--forge-molten',
      '--forge-glass-bg',
      '--forge-chrome-hi',
      '--forge-press',
      '--forge-snap',
      '--forge-flow-dur',
    ]) {
      expect(forgeTheme).toContain(required);
    }
  });

  it('keeps the forge ground warm (brown-black, never blue-black)', () => {
    // --sf-surface-alt in forge must be the ember ground 22 16 11.
    expect(forgeTheme).toMatch(/--sf-surface-alt:\s*22 16 11/);
  });
});
