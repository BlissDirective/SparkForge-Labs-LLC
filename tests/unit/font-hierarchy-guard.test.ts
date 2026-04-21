// ════════════════════════════════════════════════════════════════
// P2 §7.4 — Font hierarchy regression guard (B + C)
// ════════════════════════════════════════════════════════════════
// ESLint rule `no-restricted-syntax` flags `font-body` / `font-mono`
// className attributes directly paired with numeric JSX children.
// It runs only on JSXAttribute with Literal values — template
// literals slip through. This vitest scans repo-wide for the looser
// pattern using string inspection + comment stripping.
//
// Covered patterns:
//   className="font-body ...">42<
//   className={`font-body ${x}`}>42<
//   Any variant of font-body / font-mono touching a pure-digit span.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..', '..', 'src');
const SCAN_EXTS = new Set(['.tsx']);

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '_SUPERSEDED') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (SCAN_EXTS.has(path.extname(entry.name))) yield full;
  }
}

// Poor-man's strip of line / block comments — doesn't touch JSX.
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
}

// Loose pattern: font-body / font-mono within a className literal or
// template, followed within 120 chars by a pure-numeric JSX child
// between a `>` and `<`.
const BAD = /className\s*=\s*["'{`][^"'}`]*(?:font-body|font-mono)[^"'}`]*["'}`]\s*[^>]*>\s*[+\-]?\d[\d.,]*\s*</;

describe('P2 §7.4 — font hierarchy regression guard', () => {
  it('no .tsx uses font-body / font-mono on numeric JSX text', () => {
    const offenders: string[] = [];
    for (const file of walk(ROOT)) {
      const src = stripComments(fs.readFileSync(file, 'utf8'));
      if (BAD.test(src)) offenders.push(path.relative(ROOT, file));
    }
    expect(
      offenders,
      `Numeric values inside font-body / font-mono — use font-data (Orbitron) or <DataNumber>:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
