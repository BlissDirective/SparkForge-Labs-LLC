// ════════════════════════════════════════════════════════════════
// P1 C6 PERF-HIGH-001 — repo-wide store-selector regression guard
// ════════════════════════════════════════════════════════════════
// After P1 C1–C5, every src/ site that subscribes to a Zustand store
// does so via a selector or a named selector hook. This test walks
// the whole tree (excluding _SUPERSEDED archives) and fails CI on
// any reintroduction of a bare `useXStore()` call.
//
// Legal patterns:
//   const x = useXStore(s => s.field)      ✓ narrow selector
//   const x = useXStore(useShallow(...))    ✓ stable bundle
//   useXStore.getState() / .setState()      ✓ static API (no sub)
//   useXStore.subscribe(...)                ✓ imperative sub
//   // inside a named selector hook file:
//   export function useFoo() { return useXStore(useShallow(...)) }
//     → the store-file's own hook declarations are allow-listed.
//
// Illegal pattern:
//   const x = useXStore()                   ✗ full-store subscription
// ════════════════════════════════════════════════════════════════

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..', '..', 'src');
const SCAN_EXTS = new Set(['.tsx', '.ts']);

// Match bare zero-arg calls like `useGameStore()` / `useUIStore()`.
// Must NOT match `useXStore(...)`, `useXStore.getState()`, or
// `useXStore.setState(...)`.
const BARE_CALL = /\buse[A-Z]\w*Store\s*\(\s*\)/;

// Poor-man's comment / string stripper. Enough to eliminate false
// positives from JSDoc examples and LLM-prompt template literals
// without dragging in a full parser. Order matters: multi-char
// delimiters first so we don't break them apart.
function stripCommentsAndStrings(src: string): string {
  return src
    // Block comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Line comments (greedy to end of line)
    .replace(/\/\/[^\n]*/g, '')
    // Template literals (including escaped backticks)
    .replace(/`(?:\\.|[^`\\])*`/g, '``')
    // Double-quoted strings
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    // Single-quoted strings
    .replace(/'(?:\\.|[^'\\])*'/g, "''");
}

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

// The store files themselves contain `useXStore()` in test harness
// snippets within JSDoc comments, and DevTools utilities sometimes
// receive a bare call for introspection. Only src/stores/ is
// exempted — store internals can do whatever they like; consumers
// must use selectors.
const STORE_FILE_PREFIX = path.join(ROOT, 'stores');

describe('P1 C6 — repo-wide PERF-HIGH-001 regression guard', () => {
  it('every consumer uses a selector — no bare useXStore() anywhere', () => {
    const offenders: string[] = [];
    for (const file of walk(ROOT)) {
      if (file.startsWith(STORE_FILE_PREFIX)) continue;
      const raw = fs.readFileSync(file, 'utf8');
      const code = stripCommentsAndStrings(raw);
      if (BARE_CALL.test(code)) {
        offenders.push(path.relative(ROOT, file));
      }
    }
    expect(
      offenders,
      `Bare useXStore() calls found — use a selector hook:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
