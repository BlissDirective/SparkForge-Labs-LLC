// ════════════════════════════════════════════════════════════════
// T20 PERF-HIGH-001 — game components MUST use a store selector
// ════════════════════════════════════════════════════════════════
// Every file in src/components/games/ that subscribes to gameStore
// MUST do so via a selector hook (useGame / useGameActions /
// useGameScore / useGamePhase) — NEVER `const x = useGameStore()`
// without an argument, which re-renders on every store change
// (including the 1-Hz timeElapsed tick).

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const GAMES_DIR = path.resolve(__dirname, '..', '..', 'src', 'components', 'games');
const BARE_CALL = /\buseGameStore\s*\(\s*\)/;

function listGameFiles(): string[] {
  return fs
    .readdirSync(GAMES_DIR)
    .filter((f) => f.endsWith('Game.tsx'))
    .map((f) => path.join(GAMES_DIR, f));
}

describe('T20 regression guard — no bare useGameStore() in games', () => {
  it('every game file subscribes via a selector hook', () => {
    const offenders: string[] = [];
    for (const file of listGameFiles()) {
      const src = fs.readFileSync(file, 'utf8');
      if (BARE_CALL.test(src)) {
        offenders.push(path.basename(file));
      }
    }
    expect(
      offenders,
      `Bare useGameStore() found — migrate to useGame / useGameActions / useGameScore:\n${offenders.join(
        '\n',
      )}`,
    ).toEqual([]);
  });
});
