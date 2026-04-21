// ════════════════════════════════════════════════════════════════
// T19 UX-HIGH-005 — text-white/10-40 regression guard
// ════════════════════════════════════════════════════════════════
// After the April 21, 2026 contrast sweep, no src file should ever
// use text-white/10, /20, /30, or /40. WCAG 2.2 AA requires 4.5:1
// on normal text and white at ≤40% opacity on our #0A0E16 surface
// tests below that.
//
// Archived files under _SUPERSEDED/ are excluded — they are not
// shipped.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..', '..', 'src');
const SCAN_EXTS = new Set(['.tsx', '.ts', '.mdx']);
const LOW_CONTRAST = /text-white\/(10|20|30|40)\b/;

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '_SUPERSEDED') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (SCAN_EXTS.has(path.extname(entry.name))) {
      yield full;
    }
  }
}

describe('T19 regression guard — no text-white/10-40 in src/', () => {
  it('every .tsx/.ts file is contrast-AA-clean', () => {
    const offenders: string[] = [];
    for (const file of walk(ROOT)) {
      const src = fs.readFileSync(file, 'utf8');
      if (LOW_CONTRAST.test(src)) {
        offenders.push(path.relative(ROOT, file));
      }
    }
    expect(
      offenders,
      `text-white/{10,20,30,40} found — bump to /50+:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
