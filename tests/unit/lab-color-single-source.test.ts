// ════════════════════════════════════════════════════════════════
// P2 §7.2 — Lab colors single source
// ════════════════════════════════════════════════════════════════
// Verifies the canonical LAB_COLORS_TABLE is the only place that
// declares the full 10-lab hex palette (outside of design docs).
//
// Scoped to `src/app/**` + `src/components/**` to keep the net
// narrow; `src/config/labColors.ts` is the source of truth, so
// exempted.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LAB_COLORS_TABLE } from '@/config/labColors';

const ROOT = path.resolve(__dirname, '..', '..', 'src');
const SCAN_DIRS = ['app', 'components'];
const SCAN_EXTS = new Set(['.tsx', '.ts']);

// The full 10-hex palette, in order.
const HEXES = LAB_COLORS_TABLE.map((l) => l.hex);

// Build a regex matching a 5+ consecutive-hex lab palette. A
// component that hardcodes 5+ of the 10 lab hexes in sequence is
// almost certainly a duplication of the palette, not a coincidence.
function buildPaletteDetector(): RegExp {
  const escaped = HEXES.map((h) => h.replace('#', '\\#'));
  // look for any 5 of the 10 palette hexes within 300 chars of each other
  const any = escaped.join('|');
  return new RegExp(`(?:${any})[\\s\\S]{0,300}(?:${any})[\\s\\S]{0,300}(?:${any})[\\s\\S]{0,300}(?:${any})[\\s\\S]{0,300}(?:${any})`);
}

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '_SUPERSEDED') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (SCAN_EXTS.has(path.extname(entry.name))) yield full;
  }
}

describe('P2 §7.2 — lab colors single source', () => {
  it('no file hardcodes 5+ lab-palette hexes in sequence', () => {
    const detector = buildPaletteDetector();
    const offenders: string[] = [];
    for (const dir of SCAN_DIRS) {
      for (const file of walk(path.join(ROOT, dir))) {
        const src = fs.readFileSync(file, 'utf8');
        if (detector.test(src)) {
          offenders.push(path.relative(ROOT, file));
        }
      }
    }
    expect(
      offenders,
      `Files hardcoding the 10-lab hex palette — import LAB_COLORS_TABLE instead:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('canonical table has exactly 10 labs', () => {
    expect(LAB_COLORS_TABLE.length).toBe(10);
  });

  it('every lab has a unique hex', () => {
    const hexes = LAB_COLORS_TABLE.map((l) => l.hex.toLowerCase());
    expect(new Set(hexes).size).toBe(10);
  });
});
