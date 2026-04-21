#!/usr/bin/env node
/* eslint-disable no-console */
// ════════════════════════════════════════════════════════════════
// P2 §4.7 — Design Compliance Matrix generator
// ════════════════════════════════════════════════════════════════
// Reads src/lib/3d/cockpitDesignTokens.ts and emits a markdown
// table listing every exported token, its value, and (when present
// in a JSDoc comment) the decision-log reference.
//
// Usage:
//   node scripts/generate-design-matrix.mjs [--write]
//
// --write  Write to docs/DESIGN_COMPLIANCE_MATRIX.md (default: stdout).
//
// Run on every cockpitDesignTokens.ts edit so DESIGN_DECISIONS_LOG.md
// stays in sync.
// ════════════════════════════════════════════════════════════════

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const TOKENS_PATH = path.resolve(__dirname, '..', 'src', 'lib', '3d', 'cockpitDesignTokens.ts');
const OUTPUT_PATH = path.resolve(__dirname, '..', 'docs', 'DESIGN_COMPLIANCE_MATRIX.md');

const src = fs.readFileSync(TOKENS_PATH, 'utf8');

// Regex-scan for `export const <NAME> = <something>` with an optional
// preceding JSDoc block that may contain "@decision D####" or
// "(Decision X.Y)".
const EXPORT_RE =
  /(?:(\/\*\*[\s\S]*?\*\/)\s*)?export\s+const\s+([A-Z_][A-Z0-9_]*)\s*(?::[^=]+)?=\s*([\s\S]*?);/gm;

const SECTION_RE = /SECTION\s+(\d+):\s*([^\n]+)/g;

// First pass — discover sections (line number → title)
const sections = [];
for (const m of src.matchAll(SECTION_RE)) {
  const startIdx = m.index ?? 0;
  sections.push({
    startIdx,
    number: m[1],
    title: m[2].trim(),
  });
}

function sectionFor(idx) {
  let current = null;
  for (const s of sections) {
    if (s.startIdx <= idx) current = s;
    else break;
  }
  return current;
}

// Second pass — collect exported tokens.
const rows = [];
for (const m of src.matchAll(EXPORT_RE)) {
  const doc = m[1] ?? '';
  const name = m[2];
  const value = m[3].trim();
  const idx = m.index ?? 0;

  // Decision references — match Decision X.Y or D### or DD-N.N.
  const decisionMatch = doc.match(/Decision\s+[\w.]+|\bD\d+(?:-\d+)?\b/g) ?? [];

  // JSDoc description line (first prose line).
  const description = (() => {
    const lines = doc.split('\n').map((l) => l.replace(/^\s*\*\s?/, '').trim());
    const firstProse = lines.find((l) => l && !l.startsWith('/') && !l.startsWith('*'));
    return firstProse ?? '';
  })();

  const section = sectionFor(idx);

  // Trim value to a single line for the table.
  const shortValue =
    value.length > 60
      ? value.split('\n')[0].slice(0, 60) + '…'
      : value.replace(/\s+/g, ' ');

  rows.push({
    section: section ? `${section.number}. ${section.title}` : '—',
    name,
    value: shortValue,
    decisions: decisionMatch.join(', '),
    description,
  });
}

// Emit markdown.
let out = '';
out += '# SparkForge — Design Compliance Matrix\n\n';
out += `**Generated:** ${new Date().toISOString().split('T')[0]} · **Source:** \`src/lib/3d/cockpitDesignTokens.ts\`\n\n`;
out += 'This table is auto-generated. Edit the source token file, then rerun\n';
out += '`node scripts/generate-design-matrix.mjs --write`.\n\n';
out += '---\n\n';

// Group by section.
const bySection = new Map();
for (const r of rows) {
  if (!bySection.has(r.section)) bySection.set(r.section, []);
  bySection.get(r.section).push(r);
}

for (const [sectionKey, sectionRows] of bySection) {
  out += `## ${sectionKey}\n\n`;
  out += '| Token | Value | Decision(s) | Description |\n';
  out += '|---|---|---|---|\n';
  for (const r of sectionRows) {
    out += `| \`${r.name}\` | \`${r.value.replace(/\|/g, '\\|')}\` | ${r.decisions || '—'} | ${r.description || '—'} |\n`;
  }
  out += '\n';
}

out += '---\n\n';
out += `**Total tokens documented:** ${rows.length}\n\n`;
out += 'See also: `DESIGN_DECISIONS_LOG.md` for decision rationale, `Master-SparkForge-UI-Design-Change.md` for the full spec.\n';

if (process.argv.includes('--write')) {
  fs.writeFileSync(OUTPUT_PATH, out, 'utf8');
  console.log(`→ Wrote ${OUTPUT_PATH} (${rows.length} tokens across ${bySection.size} sections)`);
} else {
  process.stdout.write(out);
}
