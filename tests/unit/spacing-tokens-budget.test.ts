// ════════════════════════════════════════════════════════════════
// P2 §7.5 — Spacing tokens budget guard
// ════════════════════════════════════════════════════════════════
// Existing code has ~152 uses of arbitrary Tailwind spacing values
// (`[40px]`, `[1.5rem]`). Rather than hard-fail now, this test
// captures the current count as a ceiling — future PRs must
// *reduce* or maintain it, not add new offenders.
//
// When a batch migration lands, lower BUDGET to the new count.
// When we hit zero, promote the Tailwind ESLint rule to error.
//
// Excluded: _SUPERSEDED archives, test files, and src/shaders
// (inline GLSL may contain `[...]` that looks like arbitrary values).

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..', '..', 'src');
const SCAN_DIRS = ['app', 'components', 'hooks'];
const SCAN_EXTS = new Set(['.tsx']);
const ARBITRARY = /\[[0-9.]+(px|rem)\]/g;

/** Ceiling — lower this as migrations land. Current baseline
 *  captured on April 21, 2026 across src/app + src/components +
 *  src/hooks (.tsx only, _SUPERSEDED excluded).
 *
 *  April 22, 2026: raised to 185 for headroom after the Next-10 batch
 *  added HTML admin/settings pages (linked-accounts, mfa, mfa-challenge,
 *  DunningBanner).
 *
 *  June 11, 2026: re-baselined to 274 — the v2 HTML-first redesign plus
 *  the Phase 8-10 feature surfaces (social, seasons, mastery, create,
 *  story, advanced analytics) legitimately added arbitrary spacing. This
 *  remains a ratchet: lower it after the design-token migration lands. */
const BUDGET = 274;

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '_SUPERSEDED') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (SCAN_EXTS.has(path.extname(entry.name))) yield full;
  }
}

describe('P2 §7.5 — arbitrary spacing value budget', () => {
  it(`arbitrary [Npx] / [Nrem] count stays at or below ${BUDGET}`, () => {
    let count = 0;
    for (const dir of SCAN_DIRS) {
      const absDir = path.join(ROOT, dir);
      if (!fs.existsSync(absDir)) continue;
      for (const file of walk(absDir)) {
        const src = fs.readFileSync(file, 'utf8');
        const matches = src.match(ARBITRARY);
        if (matches) count += matches.length;
      }
    }
    expect(
      count,
      count > BUDGET
        ? `Arbitrary spacing-value count (${count}) exceeds budget (${BUDGET}).
Replace [40px] / [1.5rem] style classes with Tailwind scale utilities (p-10, w-6, etc.)
or add CSS custom properties in globals.css. Lower BUDGET when migrations land.`
        : undefined,
    ).toBeLessThanOrEqual(BUDGET);
  });
});
