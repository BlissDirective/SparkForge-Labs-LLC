// ════════════════════════════════════════════════════════════════
// No-emoji guard (ratchet toward zero)
// ════════════════════════════════════════════════════════════════
// Directive: no emojis anywhere in the app — they render inconsistently
// across platforms, break the brand, and read as AI "slop". See
// Ui-Creation.md for the full migration plan and emoji→lucide mapping.
//
// This guard ratchets: it counts Unicode emoji (Extended_Pictographic)
// across src/ and asserts the total stays AT OR BELOW the budget. For UI
// AFFORDANCES the budget only moves DOWN — use a lucide <Icon> or an asset,
// never a decorative emoji. The one sanctioned exception is GAME CONTENT:
// several G3 game redesigns are emoji-native (Emoji Decoder decodes emoji
// sequences; Sentiment Scanner's sarcasm 🙄 IS the lesson; the object-hunt
// tiles are emoji) — there the emoji is the played material, not an
// affordance, and a lucide icon can't stand in. When a G3 content wave lands
// the budget is re-baselined to the exact measured count (so it still catches
// stray decorative emoji within a wave); it is NOT a blank check.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..', '..', 'src');
const SCAN_EXTS = new Set(['.ts', '.tsx']);
const EMOJI = /\p{Extended_Pictographic}/gu;

// Baseline captured 2026-06-11 after the E0 inventory + first E2 sweep
// (social/seasons UI components). RATCHET DOWN for UI affordances; re-baselined
// upward ONLY for G3 emoji-native game-content waves (see header). Re-baselined
// to 1505 after G3 wave C2 (Emoji Decoder / Sentiment / Data Detective content).
const BUDGET = 1505;

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

describe('no-emoji guard — ratchet toward zero', () => {
  it(`emoji count in src/ stays at or below ${BUDGET}`, () => {
    let count = 0;
    for (const file of walk(ROOT)) {
      const matches = fs.readFileSync(file, 'utf8').match(EMOJI);
      if (matches) count += matches.length;
    }
    expect(
      count,
      count > BUDGET
        ? `Emoji count (${count}) exceeds budget (${BUDGET}). Do not add emojis — use a lucide <Icon> for affordances or an asset for identity (see Ui-Creation.md).`
        : undefined,
    ).toBeLessThanOrEqual(BUDGET);
  });
});
