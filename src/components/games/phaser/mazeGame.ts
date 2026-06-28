// ════════════════════════════════════════════════════════════════════════
// TREAT TRAINER — Phaser-4 maze factory (Wave 7, the single Phaser case)
// ════════════════════════════════════════════════════════════════════════
// A genuine tilemap-style maze with wall collision + BFS pathfinding. The dog
// navigates a recursive-backtracker maze to collect every treat; the player
// learns how an agent SEARCHES for a path to a goal. Built as a factory that
// receives the Phaser namespace at runtime — `import type` is erased at build,
// so Phaser never enters the SSR/server bundle (the React wrapper dynamic-
// imports both Phaser and this module, client-only).

import type * as PhaserNS from 'phaser';

export interface MazeConfig {
  cols: number;
  rows: number;
  treats: number;
  labColor: number; // 0xRRGGBB
  reducedMotion: boolean;
}

export interface MazeControls {
  /** Move the dog one cell. Wired to the DOM d-pad for keyboard/AT play. */
  move: (dir: 'up' | 'down' | 'left' | 'right') => void;
  /** Flash the BFS path to the nearest treat (a pathfinding hint). */
  hint: () => void;
}

export interface MazeCallbacks {
  /** Live state for the inspector / aria-live status. */
  onState: (s: { collected: number; total: number; steps: number }) => void;
  /** Fired once when every treat is collected. score is 0–100 (efficiency). */
  onComplete: (score: number, detail: { steps: number; optimal: number }) => void;
}

interface Cell { n: boolean; e: boolean; s: boolean; w: boolean; visited: boolean; }

// Build a perfect maze (spanning tree → every cell reachable, unique paths).
function genMaze(cols: number, rows: number): Cell[][] {
  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ n: false, e: false, s: false, w: false, visited: false })),
  );
  const stack: [number, number][] = [[0, 0]];
  grid[0][0].visited = true;
  while (stack.length) {
    const [r, c] = stack[stack.length - 1];
    const nbrs: [number, number, keyof Cell, keyof Cell][] = [];
    if (r > 0 && !grid[r - 1][c].visited) nbrs.push([r - 1, c, 'n', 's']);
    if (r < rows - 1 && !grid[r + 1][c].visited) nbrs.push([r + 1, c, 's', 'n']);
    if (c > 0 && !grid[r][c - 1].visited) nbrs.push([r, c - 1, 'w', 'e']);
    if (c < cols - 1 && !grid[r][c + 1].visited) nbrs.push([r, c + 1, 'e', 'w']);
    if (!nbrs.length) { stack.pop(); continue; }
    const [nr, nc, dir, opp] = nbrs[Math.floor(Math.random() * nbrs.length)];
    (grid[r][c][dir] as boolean) = true;
    (grid[nr][nc][opp] as boolean) = true;
    grid[nr][nc].visited = true;
    stack.push([nr, nc]);
  }
  return grid;
}

const key = (r: number, c: number) => `${r},${c}`;

// BFS shortest path between two cells across open passages.
function bfs(grid: Cell[][], from: [number, number], to: [number, number]): [number, number][] {
  const rows = grid.length, cols = grid[0].length;
  const prev = new Map<string, string | null>();
  const q: [number, number][] = [from];
  prev.set(key(...from), null);
  while (q.length) {
    const [r, c] = q.shift()!;
    if (r === to[0] && c === to[1]) break;
    const cell = grid[r][c];
    const moves: [number, number, boolean][] = [
      [r - 1, c, cell.n], [r + 1, c, cell.s], [r, c - 1, cell.w], [r, c + 1, cell.e],
    ];
    for (const [nr, nc, open] of moves) {
      if (!open || nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
      if (prev.has(key(nr, nc))) continue;
      prev.set(key(nr, nc), key(r, c));
      q.push([nr, nc]);
    }
  }
  // Reconstruct.
  const path: [number, number][] = [];
  let cur: string | null | undefined = key(...to);
  if (!prev.has(cur)) return path;
  while (cur) {
    const [r, c] = cur.split(',').map(Number);
    path.unshift([r, c]);
    cur = prev.get(cur) ?? null;
  }
  return path;
}

// Greedy nearest-treat tour length from the start — the scoring baseline.
function optimalTour(grid: Cell[][], start: [number, number], treats: [number, number][]): number {
  let cur = start;
  const left = [...treats];
  let total = 0;
  while (left.length) {
    let bestIdx = 0, bestLen = Infinity;
    for (let i = 0; i < left.length; i++) {
      const len = bfs(grid, cur, left[i]).length - 1;
      if (len < bestLen) { bestLen = len; bestIdx = i; }
    }
    total += bestLen;
    cur = left[bestIdx];
    left.splice(bestIdx, 1);
  }
  return Math.max(1, total);
}

export function createMazeGame(
  Phaser: typeof PhaserNS,
  parent: HTMLElement,
  config: MazeConfig,
  controls: MazeControls,
  callbacks: MazeCallbacks,
): PhaserNS.Game {
  const { cols, rows, treats: treatCount, labColor, reducedMotion } = config;
  const SIZE = 380;

  class MazeScene extends Phaser.Scene {
    private grid: Cell[][] = [];
    private cell = 0;
    private originX = 0;
    private originY = 0;
    private dogCell: [number, number] = [0, 0];
    private dog!: PhaserNS.GameObjects.Arc;
    private treatCells: [number, number][] = [];
    private treatObjs = new Map<string, PhaserNS.GameObjects.Arc>();
    private steps = 0;
    private optimal = 1;
    private done = false;
    private hintGfx!: PhaserNS.GameObjects.Graphics;

    constructor() { super('maze'); }

    create() {
      this.grid = genMaze(cols, rows);
      this.cell = Math.floor((SIZE - 24) / Math.max(cols, rows));
      const gridW = this.cell * cols, gridH = this.cell * rows;
      this.originX = (SIZE - gridW) / 2;
      this.originY = (SIZE - gridH) / 2;

      // Place treats on distinct cells, never the start.
      const candidates: [number, number][] = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (r || c) candidates.push([r, c]);
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      this.treatCells = candidates.slice(0, Math.min(treatCount, candidates.length));
      this.optimal = optimalTour(this.grid, [0, 0], this.treatCells);

      this.drawMaze();

      this.hintGfx = this.add.graphics();

      // Treats.
      for (const [r, c] of this.treatCells) {
        const { x, y } = this.cellCenter(r, c);
        this.treatObjs.set(key(r, c), this.add.circle(x, y, this.cell * 0.16, 0xffd93d).setStrokeStyle(2, 0xffffff, 0.6));
      }

      // Dog.
      const { x, y } = this.cellCenter(0, 0);
      this.dog = this.add.circle(x, y, this.cell * 0.3, labColor).setStrokeStyle(3, 0xffffff, 0.85);
      this.dogCell = [0, 0];

      // Keyboard.
      const kb = this.input.keyboard;
      if (kb) {
        kb.on('keydown-UP', () => this.tryMove('up'));
        kb.on('keydown-DOWN', () => this.tryMove('down'));
        kb.on('keydown-LEFT', () => this.tryMove('left'));
        kb.on('keydown-RIGHT', () => this.tryMove('right'));
        kb.on('keydown-W', () => this.tryMove('up'));
        kb.on('keydown-S', () => this.tryMove('down'));
        kb.on('keydown-A', () => this.tryMove('left'));
        kb.on('keydown-D', () => this.tryMove('right'));
      }

      // Wire the DOM d-pad / hint button into the scene.
      controls.move = (dir) => this.tryMove(dir);
      controls.hint = () => this.showHint();

      callbacks.onState({ collected: 0, total: this.treatCells.length, steps: 0 });
    }

    private cellCenter(r: number, c: number) {
      return {
        x: this.originX + c * this.cell + this.cell / 2,
        y: this.originY + r * this.cell + this.cell / 2,
      };
    }

    private drawMaze() {
      const g = this.add.graphics();
      // Floor.
      g.fillStyle(0x0e1428, 1).fillRoundedRect(this.originX - 4, this.originY - 4, this.cell * cols + 8, this.cell * rows + 8, 10);
      g.lineStyle(2, labColor, 0.5);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cellObj = this.grid[r][c];
          const x = this.originX + c * this.cell, y = this.originY + r * this.cell;
          if (!cellObj.n) g.lineBetween(x, y, x + this.cell, y);
          if (!cellObj.w) g.lineBetween(x, y, x, y + this.cell);
          if (!cellObj.e) g.lineBetween(x + this.cell, y, x + this.cell, y + this.cell);
          if (!cellObj.s) g.lineBetween(x, y + this.cell, x + this.cell, y + this.cell);
        }
      }
    }

    private canMove(dir: 'up' | 'down' | 'left' | 'right'): [number, number] | null {
      const [r, c] = this.dogCell;
      const cellObj = this.grid[r][c];
      if (dir === 'up' && cellObj.n) return [r - 1, c];
      if (dir === 'down' && cellObj.s) return [r + 1, c];
      if (dir === 'left' && cellObj.w) return [r, c - 1];
      if (dir === 'right' && cellObj.e) return [r, c + 1];
      return null;
    }

    private tryMove(dir: 'up' | 'down' | 'left' | 'right') {
      if (this.done) return;
      const next = this.canMove(dir);
      if (!next) return;
      this.dogCell = next;
      this.steps += 1;
      const { x, y } = this.cellCenter(next[0], next[1]);
      if (reducedMotion) { this.dog.setPosition(x, y); }
      else { this.tweens.add({ targets: this.dog, x, y, duration: 90, ease: 'Quad.easeOut' }); }

      // Treat collection.
      const k = key(next[0], next[1]);
      if (this.treatObjs.has(k)) {
        const t = this.treatObjs.get(k)!;
        t.destroy();
        this.treatObjs.delete(k);
      }
      const collected = this.treatCells.length - this.treatObjs.size;
      callbacks.onState({ collected, total: this.treatCells.length, steps: this.steps });

      if (this.treatObjs.size === 0) this.finish();
    }

    private showHint() {
      if (this.done || this.treatObjs.size === 0) return;
      // Nearest remaining treat.
      let best: [number, number][] = [];
      let bestLen = Infinity;
      for (const tk of this.treatObjs.keys()) {
        const [r, c] = tk.split(',').map(Number);
        const p = bfs(this.grid, this.dogCell, [r, c]);
        if (p.length && p.length < bestLen) { bestLen = p.length; best = p; }
      }
      this.hintGfx.clear();
      this.hintGfx.lineStyle(4, 0xffd93d, 0.8);
      this.hintGfx.beginPath();
      best.forEach(([r, c], i) => {
        const { x, y } = this.cellCenter(r, c);
        if (i === 0) this.hintGfx.moveTo(x, y); else this.hintGfx.lineTo(x, y);
      });
      this.hintGfx.strokePath();
      this.time.delayedCall(1100, () => this.hintGfx.clear());
    }

    private finish() {
      this.done = true;
      const efficiency = Math.max(0, Math.min(1, this.optimal / Math.max(1, this.steps)));
      const score = Math.round(efficiency * 100);
      const { x, y } = this.cellCenter(this.dogCell[0], this.dogCell[1]);
      if (!reducedMotion) {
        const ring = this.add.circle(x, y, this.cell * 0.3, 0xffffff, 0).setStrokeStyle(3, 0xffd93d, 1);
        this.tweens.add({ targets: ring, scale: 3, alpha: 0, duration: 600, onComplete: () => ring.destroy() });
      }
      this.time.delayedCall(reducedMotion ? 100 : 500, () => {
        callbacks.onComplete(score, { steps: this.steps, optimal: this.optimal });
      });
    }
  }

  return new Phaser.Game({
    type: Phaser.AUTO,
    width: SIZE,
    height: SIZE,
    parent,
    transparent: true,
    scene: new MazeScene(),
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    banner: false,
  });
}
