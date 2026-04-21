// ════════════════════════════════════════════════════════════════
// T13 PERF-MED-002 — <img> regression guard
// ════════════════════════════════════════════════════════════════
// The audit found no raw <img> tags in src/. This test locks that
// in — any future PR that introduces <img> fails CI here as well
// as under the ESLint rule `@next/next/no-img-element` = error.
//
// We scan `.tsx` source in src/components, src/app, and src/hooks.
// `.ts` files can't contain JSX but we scan them defensively.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..', '..', 'src');
const SCAN_EXTS = new Set(['.tsx', '.ts']);
const RAW_IMG = /<img\s[^>]*\/?>|<img>/;

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (SCAN_EXTS.has(path.extname(entry.name))) {
      yield full;
    }
  }
}

describe('T13 regression guard — no raw <img> tags in src/', () => {
  it('every .tsx/.ts file is <img>-free', () => {
    const offenders: string[] = [];
    for (const file of walk(ROOT)) {
      const src = fs.readFileSync(file, 'utf8');
      if (RAW_IMG.test(src)) {
        offenders.push(path.relative(ROOT, file));
      }
    }
    expect(
      offenders,
      `Raw <img> tags found — migrate to next/image or <OptimizedImage>:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
