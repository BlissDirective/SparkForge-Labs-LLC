// ════════════════════════════════════════════════════════════════
// P2 §4.7 — Design matrix stays in sync with cockpitDesignTokens
// ════════════════════════════════════════════════════════════════
// Regenerates DESIGN_COMPLIANCE_MATRIX.md in memory from the token
// file and compares against the committed version. If they drift,
// the fix is `node scripts/generate-design-matrix.mjs --write` +
// commit.

import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const MATRIX = path.join(REPO_ROOT, 'docs', 'DESIGN_COMPLIANCE_MATRIX.md');
const SCRIPT = path.join(REPO_ROOT, 'scripts', 'generate-design-matrix.mjs');

describe('P2 §4.7 — design-matrix ↔ tokens sync', () => {
  it('DESIGN_COMPLIANCE_MATRIX.md matches the generator output (minus Generated date line)', () => {
    const committed = fs.readFileSync(MATRIX, 'utf8');
    const generated = execSync(`node ${SCRIPT}`, { cwd: REPO_ROOT }).toString();

    // The `Generated: YYYY-MM-DD` stamp changes daily — strip it.
    const normalize = (s: string) =>
      s.replace(/\*\*Generated:\*\*\s+\d{4}-\d{2}-\d{2}/, '**Generated:** <date>');

    expect(normalize(committed)).toBe(normalize(generated));
  });
});
