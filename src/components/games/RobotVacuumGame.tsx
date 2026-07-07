// ════════════════════════════════════════════════════════════════════════
// ROBOT VACUUM v5 — Lab 5 (Redesigned: REAL coverage simulation)
// ════════════════════════════════════════════════════════════════════════
// Audit §II.4 #16 (REPLACE). The old version was 4 sliders whose score was
// distance from hidden magic numbers. This rebuild is an HONEST, deterministic
// coverage sim: the child picks SENSORS + a CLEANING STRATEGY, then WATCHES a
// robot trace a real path cell-by-cell across a tiled room while battery ticks
// down. Every strategy is a genuine pathing algorithm executed over the actual
// grid — spiral coils, wall-follow hugs the right-hand wall, snake sweeps rows,
// frontier seeks the nearest dirty cell, random bounces. Coverage % and battery
// use are the true outputs of that algorithm on that room (G1 honesty: no hidden
// target numbers). Cliff sensors matter on stair levels (fall = fail); pets
// wander in as moving obstacles on later levels. Built as DOM/SVG (no Pixi/
// Phaser/Three) — reduced-motion shows the final coverage without animation.

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Play, RotateCcw, Battery, ChevronRight, ShieldCheck, Dog, Bot,
  Waypoints, Spline, Square, Shuffle, Radar, GraduationCap, LayoutGrid,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import { SFProgressBar } from '@/components/ui/SFProgressBar';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import GameLevelSystem, {
  type LevelConfig, type LevelResult,
} from '@/components/games/shared/GameLevelSystem';

const LAB_COLOR = '#2ECC71';

// ── Types ────────────────────────────────────────────────────────────────
type CellType = 'void' | 'wall' | 'floor' | 'cliff';
type StrategyId = 'snake' | 'spiral' | 'wall' | 'frontier' | 'random';
type Band = 'A' | 'B' | 'C';

interface Grid {
  w: number;
  h: number;
  cells: CellType[];
  dock: number;
}

interface PetLoop {
  y: number;
  x0: number;
  x1: number;
}

interface RoomDef {
  map: string[];
  petLoops: PetLoop[];
  /** battery budget multiplier vs cleanable-cell count */
  batteryFactor: number;
}

interface SimFrame {
  pos: number;
  battery: number;
  cleaned: number;
  pets: number[];
  collided: boolean;
  fell: boolean;
}

interface SimOutcome {
  grid: Grid;
  frames: SimFrame[];
  cleanTick: Record<number, number>;
  totalCleanable: number;
  capacity: number;
  coverage: number;
  batteryUsed: number;
  fell: boolean;
  finished: boolean;
}

interface Sensors {
  cliff: boolean;
  pet: boolean;
}

// U, R, D, L
const DIRS: ReadonlyArray<readonly [number, number]> = [
  [0, -1], [1, 0], [0, 1], [-1, 0],
];

const COLLISION_COST = 2;

// ── Strategy metadata (child-facing) ──────────────────────────────────────
const STRATEGIES: {
  id: StrategyId;
  label: string;
  icon: typeof Waypoints;
  blurb: string;
}[] = [
  { id: 'snake', label: 'Snake Rows', icon: Waypoints, blurb: 'Sweeps back and forth in straight rows. Very efficient in open rooms.' },
  { id: 'spiral', label: 'Spiral', icon: Spline, blurb: 'Coils outward from the dock. Great for one clear area at a time.' },
  { id: 'frontier', label: 'Nearest Dirt', icon: Radar, blurb: 'Always drives to the closest dirty cell. Best coverage, but lots of travel.' },
  { id: 'wall', label: 'Wall Follow', icon: Square, blurb: 'Hugs the right-hand wall. Cleans edges well, misses the middle.' },
  { id: 'random', label: 'Random Bounce', icon: Shuffle, blurb: 'Bounces in random directions. Wastes battery re-cleaning spots.' },
];

// ── Rooms ──────────────────────────────────────────────────────────────────
// '#' wall/furniture  '.' floor(dirt)  'S' dock(floor)  'C' cliff  ' ' void
const ROOMS: Record<number, RoomDef> = {
  1: {
    map: [
      '########',
      '#S.....#',
      '#......#',
      '#......#',
      '#......#',
      '########',
    ],
    petLoops: [],
    batteryFactor: 1.9,
  },
  2: {
    map: [
      '##########',
      '#S.......#',
      '#..####..#',
      '#..####..#',
      '#........#',
      '#.##..##.#',
      '#........#',
      '##########',
    ],
    petLoops: [],
    batteryFactor: 1.55,
  },
  3: {
    map: [
      '############',
      '#S.........#',
      '#..........#',
      '#...CCCC...#',
      '#..........#',
      '#CC......CC#',
      '#..........#',
      '#..........#',
      '############',
    ],
    petLoops: [],
    batteryFactor: 1.45,
  },
  4: {
    map: [
      '##############',
      '#S...........#',
      '#....####....#',
      '#....#..#....#',
      '#....#..#....#',
      '#............#',
      '#..#######...#',
      '#..#.....#...#',
      '#..#.....#...#',
      '#............#',
      '##############',
    ],
    petLoops: [],
    batteryFactor: 1.02,
  },
  5: {
    map: [
      '############',
      '#S.........#',
      '#..######..#',
      '#..........#',
      '#....##....#',
      '#..........#',
      '#..######..#',
      '#..........#',
      '#..........#',
      '############',
    ],
    petLoops: [
      { y: 3, x0: 1, x1: 10 },
      { y: 7, x0: 10, x1: 1 },
    ],
    batteryFactor: 1.15,
  },
};

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Studio', description: 'A small open room. Pick a strategy and watch it clean!', emoji: '🏠', difficulty: 'easy', starThresholds: [60, 80, 95], xpReward: 50 },
  { id: 2, name: 'Furniture', description: 'Sofas and tables get in the way. Which strategy reaches behind them?', emoji: '🛋️', difficulty: 'easy', starThresholds: [55, 78, 92], xpReward: 70 },
  { id: 3, name: 'Stairs', description: 'There is a drop! Equip the cliff sensor or the robot falls.', emoji: '📶', difficulty: 'medium', starThresholds: [55, 75, 90], xpReward: 90 },
  { id: 4, name: 'Mansion', description: 'A huge multi-room house. Battery runs low — choose wisely!', emoji: '🏰', difficulty: 'hard', starThresholds: [50, 70, 88], xpReward: 120 },
  { id: 5, name: 'Pets!', description: 'A dog wanders the halls. Equip the pet sensor to steer around it.', emoji: '🐕', difficulty: 'hard', starThresholds: [50, 70, 85], xpReward: 150 },
];

const CONCEPTS: Record<number, string> = {
  1: 'Coverage path planning: a vacuum must visit every floor cell. A tidy sweep beats a random one.',
  2: 'Obstacles force the path to detour. Some strategies leave gaps behind furniture.',
  3: 'Cliff sensors use infrared to spot drops (stairs). Without one, the robot cannot tell a stair from the floor.',
  4: 'Battery is finite. In a big house you must trade thoroughness for how far you can drive.',
  5: 'Moving obstacles (pets, people) mean the robot must re-plan its route in real time.',
};

// ── Room parsing ────────────────────────────────────────────────────────────
function parseRoom(map: string[]): Grid {
  const h = map.length;
  const w = Math.max(...map.map((r) => r.length));
  const cells: CellType[] = new Array(w * h).fill('void');
  let dock = 0;
  for (let y = 0; y < h; y++) {
    const row = map[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x] ?? ' ';
      const i = y * w + x;
      if (ch === '#') cells[i] = 'wall';
      else if (ch === '.') cells[i] = 'floor';
      else if (ch === 'C') cells[i] = 'cliff';
      else if (ch === 'S') { cells[i] = 'floor'; dock = i; }
      else cells[i] = 'void';
    }
  }
  return { w, h, cells, dock };
}

/** Reachable dirty-floor cells from the dock (cliffs treated as walls). */
function floodCleanable(grid: Grid): number {
  const { w, cells, dock } = grid;
  const seen = new Set<number>([dock]);
  const q = [dock];
  let count = 0;
  while (q.length) {
    const cur = q.shift()!;
    if (cells[cur] === 'floor') count++;
    const x = cur % w;
    const y = Math.floor(cur / w);
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= grid.h) continue;
      const n = ny * w + nx;
      if (seen.has(n)) continue;
      if (cells[n] === 'floor') { seen.add(n); q.push(n); }
    }
  }
  return count;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function petCellsAt(grid: Grid, loops: PetLoop[], tick: number): number[] {
  const out: number[] = [];
  for (const loop of loops) {
    const lo = Math.min(loop.x0, loop.x1);
    const hi = Math.max(loop.x0, loop.x1);
    const span = hi - lo;
    if (span <= 0) { out.push(loop.y * grid.w + lo); continue; }
    const period = span * 2;
    const p = tick % period;
    const x = p <= span ? lo + p : hi - (p - span);
    out.push(loop.y * grid.w + x);
  }
  return out;
}

// ── The honest simulation ───────────────────────────────────────────────────
function simulate(
  grid: Grid,
  petLoops: PetLoop[],
  batteryFactor: number,
  bandMult: number,
  strategy: StrategyId,
  sensors: Sensors,
): SimOutcome {
  const { w, h, cells, dock } = grid;
  const totalCleanable = floodCleanable(grid);
  const capacity = Math.max(10, Math.round(totalCleanable * batteryFactor * bandMult));

  const rng = mulberry32(0x5f3a + strategy.length * 131 + dock * 17);

  const neighbor = (pos: number, d: number): number => {
    const x = (pos % w) + DIRS[d][0];
    const y = Math.floor(pos / w) + DIRS[d][1];
    if (x < 0 || y < 0 || x >= w || y >= h) return -1;
    return y * w + x;
  };
  const dirTo = (a: number, b: number): number => {
    const dx = (b % w) - (a % w);
    const dy = Math.floor(b / w) - Math.floor(a / w);
    if (dx === 1) return 1;
    if (dx === -1) return 3;
    if (dy === 1) return 2;
    return 0;
  };
  // What the robot PERCEIVES as clean-able floor. Without a cliff sensor it is
  // blind to the drop and treats cliff cells as ordinary dirty floor → it will
  // happily drive over the edge.
  const percFloor = (cell: number): boolean => {
    if (cell < 0) return false;
    const t = cells[cell];
    if (t === 'floor') return true;
    if (t === 'cliff') return !sensors.cliff;
    return false;
  };
  const enterable = (cell: number, pets: Set<number>): boolean =>
    percFloor(cell) && !(sensors.pet && pets.has(cell));

  const cleaned = new Set<number>([dock]);
  const cleanTick: Record<number, number> = { [dock]: 0 };
  const frames: SimFrame[] = [];
  let pos = dock;
  let battery = capacity;
  let heading = 1; // start facing right
  let snakeH = 1; // +1 = sweeping right, -1 = left
  let fell = false;

  const mkFrame = (pets: Set<number>, collided: boolean, isFall: boolean): SimFrame => ({
    pos,
    battery: Math.max(0, battery),
    cleaned: cleaned.size,
    pets: [...pets],
    collided,
    fell: isFall,
  });

  // BFS to the nearest perceived-dirty cell; return the first step toward it.
  const frontierStep = (pets: Set<number>): number => {
    const parent = new Map<number, number>();
    const seen = new Set<number>([pos]);
    const q = [pos];
    while (q.length) {
      const cur = q.shift()!;
      if (cur !== pos && percFloor(cur) && !cleaned.has(cur)) {
        let step = cur;
        while (parent.get(step) !== pos) step = parent.get(step)!;
        return step;
      }
      for (let d = 0; d < 4; d++) {
        const n = neighbor(cur, d);
        if (n < 0 || seen.has(n) || !enterable(n, pets)) continue;
        seen.add(n);
        parent.set(n, cur);
        q.push(n);
      }
    }
    return -1;
  };

  type Choice = { kind: 'move'; cell: number } | { kind: 'wait' } | { kind: 'done' };

  const chooseMove = (pets: Set<number>): Choice => {
    if (strategy === 'random') {
      const cands: number[] = [];
      for (let d = 0; d < 4; d++) {
        const c = neighbor(pos, d);
        if (enterable(c, pets)) cands.push(c);
      }
      if (!cands.length) return { kind: 'wait' };
      return { kind: 'move', cell: cands[Math.floor(rng() * cands.length)] };
    }

    if (strategy === 'wall') {
      const order = [(heading + 1) % 4, heading, (heading + 3) % 4, (heading + 2) % 4];
      for (const d of order) {
        const c = neighbor(pos, d);
        if (enterable(c, pets)) { heading = d; return { kind: 'move', cell: c }; }
      }
      return { kind: 'wait' };
    }

    if (strategy === 'spiral') {
      const order = [(heading + 1) % 4, heading, (heading + 3) % 4, (heading + 2) % 4];
      for (const d of order) {
        const c = neighbor(pos, d);
        if (enterable(c, pets) && !cleaned.has(c)) { heading = d; return { kind: 'move', cell: c }; }
      }
      const s = frontierStep(pets);
      if (s >= 0) { heading = dirTo(pos, s); return { kind: 'move', cell: s }; }
      return { kind: 'done' };
    }

    if (strategy === 'snake') {
      const hDir = snakeH > 0 ? 1 : 3;
      const otherH = snakeH > 0 ? 3 : 1;
      const order = [hDir, 2 /* down */, otherH, 0 /* up */];
      for (const d of order) {
        const c = neighbor(pos, d);
        if (enterable(c, pets) && !cleaned.has(c)) {
          if (d === 2) snakeH *= -1;
          heading = d;
          return { kind: 'move', cell: c };
        }
      }
      const s = frontierStep(pets);
      if (s >= 0) { heading = dirTo(pos, s); return { kind: 'move', cell: s }; }
      return { kind: 'done' };
    }

    // frontier
    const s = frontierStep(pets);
    if (s >= 0) { heading = dirTo(pos, s); return { kind: 'move', cell: s }; }
    return { kind: 'done' };
  };

  frames.push(mkFrame(new Set(petCellsAt(grid, petLoops, 0)), false, false));

  let tick = 0;
  const maxTicks = capacity + 6;
  while (battery > 0 && cleaned.size < totalCleanable && !fell && tick < maxTicks) {
    tick++;
    const pets = new Set(petCellsAt(grid, petLoops, tick));
    const choice = chooseMove(pets);
    if (choice.kind === 'done') break;
    if (choice.kind === 'wait') {
      battery -= 1;
      frames.push(mkFrame(pets, false, false));
      continue;
    }
    const cell = choice.cell;
    // Real drop under the robot's wheels — only reachable when the cliff sensor
    // is missing (otherwise cliffs are never enterable).
    if (cells[cell] === 'cliff') {
      pos = cell;
      battery -= 1;
      fell = true;
      frames.push(mkFrame(pets, false, true));
      break;
    }
    // Bumped a pet with no pet sensor: lose extra charge, stay put.
    if (!sensors.pet && pets.has(cell)) {
      battery -= COLLISION_COST;
      frames.push(mkFrame(pets, true, false));
      continue;
    }
    pos = cell;
    battery -= 1;
    if (!cleaned.has(pos)) {
      cleaned.add(pos);
      cleanTick[pos] = frames.length;
    }
    frames.push(mkFrame(pets, false, false));
  }

  const coverage = Math.round((cleaned.size / totalCleanable) * 100);
  return {
    grid,
    frames,
    cleanTick,
    totalCleanable,
    capacity,
    coverage: fell ? Math.min(coverage, 100) : coverage,
    batteryUsed: capacity - Math.max(0, battery),
    fell,
    finished: cleaned.size >= totalCleanable,
  };
}

function bandMultFor(band: Band): number {
  return band === 'A' ? 1.6 : band === 'C' ? 0.82 : 1.05;
}

// ── Cell / robot rendering ──────────────────────────────────────────────────
function batteryColor(pct: number): string {
  if (pct > 50) return '#2ECC71';
  if (pct > 20) return '#FFB020';
  return '#FF5252';
}

function RoomView({
  grid, cleanedAt, robotPos, pets, showRobot, reduced,
}: {
  grid: Grid;
  cleanedAt: (cell: number) => boolean;
  robotPos: number;
  pets: number[];
  showRobot: boolean;
  reduced: boolean;
}) {
  const { w, h, cells } = grid;
  const rx = robotPos % w;
  const ry = Math.floor(robotPos / w);
  const petSet = new Set(pets);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Room map with the robot vacuum and its cleaned path"
      className="w-full h-auto rounded-2xl"
      style={{ background: '#0B1020', border: '1px solid #2ECC7130', maxWidth: 480, display: 'block', margin: '0 auto' }}
    >
      <defs>
        <pattern id="rv-cliff" width="0.34" height="0.34" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="0.34" height="0.34" fill="#0A0E1A" />
          <rect width="0.17" height="0.34" fill="#3A2030" />
        </pattern>
      </defs>

      {cells.map((t, i) => {
        if (t === 'void') return null;
        const x = i % w;
        const y = Math.floor(i / w);
        if (t === 'wall') {
          return (
            <rect key={i} x={x + 0.04} y={y + 0.04} width={0.92} height={0.92} rx={0.12}
              fill="#28324D" stroke="#3B476B" strokeWidth={0.03} />
          );
        }
        if (t === 'cliff') {
          return (
            <g key={i}>
              <rect x={x} y={y} width={1} height={1} fill="url(#rv-cliff)" />
              <rect x={x + 0.06} y={y + 0.06} width={0.88} height={0.88} rx={0.08}
                fill="none" stroke="#FF5252" strokeWidth={0.05} strokeDasharray="0.14 0.1" />
            </g>
          );
        }
        // floor
        const clean = cleanedAt(i);
        return (
          <g key={i}>
            <rect x={x + 0.02} y={y + 0.02} width={0.96} height={0.96} rx={0.06}
              fill={clean ? '#123A24' : '#141C33'} stroke={clean ? '#2ECC7160' : '#1E2740'} strokeWidth={0.02} />
            {clean
              ? <circle cx={x + 0.5} cy={y + 0.5} r={0.11} fill="#2ECC7155" />
              : <circle cx={x + 0.5} cy={y + 0.5} r={0.08} fill="#4C5A80" />}
          </g>
        );
      })}

      {/* Pets (moving obstacles) */}
      {[...petSet].map((p) => (
        <text key={`pet-${p}`} x={(p % w) + 0.5} y={Math.floor(p / w) + 0.72}
          fontSize={0.72} textAnchor="middle" aria-hidden="true">🐕</text>
      ))}

      {/* Robot vacuum with Sparky riding on top */}
      {showRobot && (
        <g
          transform={`translate(${rx} ${ry})`}
          style={{ transition: reduced ? 'none' : 'transform 0.07s linear' }}
        >
          <circle cx={0.5} cy={0.5} r={0.42} fill="#EDEFF5" stroke={LAB_COLOR} strokeWidth={0.06} />
          <circle cx={0.5} cy={0.5} r={0.2} fill="#0B1020" opacity={0.35} />
          <circle cx={0.38} cy={0.42} r={0.06} fill={LAB_COLOR} />
          <circle cx={0.62} cy={0.42} r={0.06} fill={LAB_COLOR} />
          {/* Sparky = little star rider (no mascot art, pure SVG) */}
          <path
            d="M0.5 0.06 L0.56 0.2 L0.7 0.2 L0.59 0.29 L0.63 0.42 L0.5 0.34 L0.37 0.42 L0.41 0.29 L0.3 0.2 L0.44 0.2 Z"
            fill="#FFD93D" stroke="#E0A800" strokeWidth={0.015} transform="translate(0 -0.06) scale(0.7) translate(0.21 0.03)"
          />
        </g>
      )}
    </svg>
  );
}

// ── Level renderer (one room) ────────────────────────────────────────────────
function RobotVacuumLevel({
  level, band, onComplete, onExit,
}: {
  level: LevelConfig;
  band: Band;
  onComplete: (r: LevelResult) => void;
  onExit: () => void;
}) {
  const reduced = useReducedMotion() ?? false;
  const room = ROOMS[level.id];
  const grid = useMemo(() => parseRoom(room.map), [room.map]);

  const hasCliffs = useMemo(() => grid.cells.includes('cliff'), [grid]);
  const hasPets = room.petLoops.length > 0;

  const [strategy, setStrategy] = useState<StrategyId>('snake');
  const [sensors, setSensors] = useState<Sensors>(() => ({
    cliff: band === 'A',
    pet: band === 'A',
  }));
  const [phase, setPhase] = useState<'setup' | 'run' | 'result'>('setup');
  const [outcome, setOutcome] = useState<SimOutcome | null>(null);
  const [frameIdx, setFrameIdx] = useState(0);
  const [live, setLive] = useState('');
  const startTime = useRef<number>(Date.now());

  // Band C runs two pets; band A only one (gentler).
  const petLoops = useMemo(
    () => (band === 'A' ? room.petLoops.slice(0, 1) : room.petLoops),
    [band, room.petLoops],
  );

  // Preview pets (frame 0) for the setup screen.
  const previewPets = useMemo(() => petCellsAt(grid, petLoops, 0), [grid, petLoops]);

  const runSim = useCallback(() => {
    const result = simulate(grid, petLoops, room.batteryFactor, bandMultFor(band), strategy, sensors);
    startTime.current = Date.now();
    setOutcome(result);
    if (reduced) {
      setFrameIdx(result.frames.length - 1);
      setPhase('result');
      setLive(`Cleaning finished. Coverage ${result.coverage} percent. Battery ${Math.round(((result.capacity - result.batteryUsed) / result.capacity) * 100)} percent remaining.`);
    } else {
      setFrameIdx(0);
      setPhase('run');
      setLive(`Cleaning started using the ${STRATEGIES.find((s) => s.id === strategy)?.label} strategy.`);
    }
  }, [grid, petLoops, room.batteryFactor, band, strategy, sensors, reduced]);

  // Playback animation.
  useEffect(() => {
    if (phase !== 'run' || !outcome || reduced) return;
    const total = outcome.frames.length;
    const interval = Math.min(110, Math.max(35, Math.round(4500 / total)));
    const id = window.setInterval(() => {
      setFrameIdx((f) => {
        if (f >= total - 1) {
          window.clearInterval(id);
          return f;
        }
        return f + 1;
      });
    }, interval);
    return () => window.clearInterval(id);
  }, [phase, outcome, reduced]);

  // When playback reaches the last frame, move to result.
  useEffect(() => {
    if (phase !== 'run' || !outcome) return;
    if (frameIdx >= outcome.frames.length - 1) {
      const remain = Math.round(((outcome.capacity - outcome.batteryUsed) / outcome.capacity) * 100);
      setPhase('result');
      setLive(
        outcome.fell
          ? 'The robot fell down the stairs! Equip the cliff sensor and try again.'
          : `Cleaning finished. Coverage ${outcome.coverage} percent. Battery ${remain} percent remaining.`,
      );
    }
  }, [frameIdx, phase, outcome]);

  const frame = outcome?.frames[frameIdx];
  const coverage = phase === 'setup' ? 0 : outcome ? Math.round(((frame?.cleaned ?? 0) / outcome.totalCleanable) * 100) : 0;
  const batteryPct = phase === 'setup' ? 100 : outcome ? Math.round(((frame?.battery ?? 0) / outcome.capacity) * 100) : 100;

  const cleanedAt = useCallback(
    (cell: number) => {
      if (phase === 'setup' || !outcome) return false;
      const t = outcome.cleanTick[cell];
      return t !== undefined && t <= frameIdx;
    },
    [phase, outcome, frameIdx],
  );

  const robotPos = phase === 'setup' ? grid.dock : frame?.pos ?? grid.dock;
  const petsNow = phase === 'setup' ? previewPets : frame?.pets ?? [];

  const stars: 0 | 1 | 2 | 3 = useMemo(() => {
    if (!outcome || outcome.fell) return 0;
    const [t1, t2, t3] = level.starThresholds;
    if (outcome.coverage >= t3) return 3;
    if (outcome.coverage >= t2) return 2;
    if (outcome.coverage >= t1) return 1;
    return 0;
  }, [outcome, level.starThresholds]);

  const finish = useCallback(() => {
    if (!outcome) return;
    onComplete({
      score: outcome.coverage,
      maxScore: 100,
      stars,
      xpEarned: Math.round((level.xpReward * stars) / 3),
      timeMs: Date.now() - startTime.current,
    });
  }, [outcome, stars, level.xpReward, onComplete]);

  const activeStrat = STRATEGIES.find((s) => s.id === strategy)!;

  return (
    <div className="relative space-y-4">
      {/* Live region for coverage / battery announcements */}
      <p className="sr-only" role="status" aria-live="polite">{live}</p>

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${LAB_COLOR}18` }}>
            <Bot className="w-5 h-5" style={{ color: LAB_COLOR }} />
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: '#E8ECF5' }}>Level {level.id}: {level.name}</h2>
            <p className="text-xs" style={{ color: '#8C94AC' }}>{level.description}</p>
          </div>
        </div>
        <SFButton variant="ghost" size="sm" onClick={onExit} aria-label="Back to level map">
          <LayoutGrid className="w-4 h-4" />
        </SFButton>
      </div>

      {/* Room + live meters */}
      <SFCard variant="elevated" className="p-4" style={{ background: '#0E1428', borderColor: `${LAB_COLOR}22` }}>
        <RoomView
          grid={grid}
          cleanedAt={cleanedAt}
          robotPos={robotPos}
          pets={petsNow}
          showRobot
          reduced={reduced}
        />

        <div className="mt-4 grid grid-cols-2 gap-3" aria-live="polite" aria-atomic="true">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold flex items-center gap-1" style={{ color: '#B8C0D8' }}>
                <Radar className="w-3.5 h-3.5" style={{ color: LAB_COLOR }} /> Coverage
              </span>
              <span className="font-bold" style={{ color: LAB_COLOR }}>{coverage}%</span>
            </div>
            <SFProgressBar value={coverage} variant="custom" color="linear-gradient(90deg,#2ECC71,#5EE897)" size="md"
              aria-label={`Coverage ${coverage} percent`} />
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold flex items-center gap-1" style={{ color: '#B8C0D8' }}>
                <Battery className="w-3.5 h-3.5" style={{ color: batteryColor(batteryPct) }} /> Battery
              </span>
              <span className="font-bold" style={{ color: batteryColor(batteryPct) }}>{batteryPct}%</span>
            </div>
            <SFProgressBar value={batteryPct} variant="custom" color={batteryColor(batteryPct)} size="md"
              aria-label={`Battery ${batteryPct} percent`} />
          </div>
        </div>
      </SFCard>

      {/* Setup controls */}
      {phase === 'setup' && (
        <>
          {/* Sensors */}
          {(hasCliffs || hasPets) && (
            <SFCard variant="elevated" className="p-4" style={{ background: '#0E1428', borderColor: '#1E2740' }}>
              <h3 className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: '#E8ECF5' }}>
                <ShieldCheck className="w-4 h-4" style={{ color: LAB_COLOR }} /> Equip Sensors
              </h3>
              <div className="flex flex-wrap gap-2">
                {hasCliffs && (
                  <SensorToggle
                    icon={ShieldCheck}
                    label="Cliff Sensor"
                    hint="Spots stair drops"
                    checked={sensors.cliff}
                    onToggle={() => setSensors((s) => ({ ...s, cliff: !s.cliff }))}
                  />
                )}
                {hasPets && (
                  <SensorToggle
                    icon={Dog}
                    label="Pet Sensor"
                    hint="Steers around pets"
                    checked={sensors.pet}
                    onToggle={() => setSensors((s) => ({ ...s, pet: !s.pet }))}
                  />
                )}
              </div>
            </SFCard>
          )}

          {/* Strategy */}
          <SFCard variant="elevated" className="p-4" style={{ background: '#0E1428', borderColor: '#1E2740' }}>
            <h3 className="text-xs font-bold mb-2" style={{ color: '#E8ECF5' }}>Choose a Cleaning Strategy</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Cleaning strategy">
              {STRATEGIES.map((s) => {
                const Icon = s.icon;
                const sel = strategy === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={sel}
                    onClick={() => setStrategy(s.id)}
                    className="flex items-center gap-2 rounded-xl p-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2"
                    style={{
                      background: sel ? `${LAB_COLOR}20` : '#141C33',
                      border: `2px solid ${sel ? LAB_COLOR : '#232E4A'}`,
                      ['--tw-ring-color' as string]: LAB_COLOR,
                    }}
                  >
                    <Icon className="w-4 h-4 shrink-0" style={{ color: sel ? LAB_COLOR : '#8C94AC' }} />
                    <span className="text-xs font-semibold" style={{ color: sel ? '#E8ECF5' : '#B8C0D8' }}>{s.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: `${LAB_COLOR}12`, color: '#B8C0D8' }}>
              <activeStrat.icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: LAB_COLOR }} />
              <span>{activeStrat.blurb}</span>
            </div>
            <div className="mt-2 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#4F6EF712', color: '#9FB0E8' }}>
              <GraduationCap className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{CONCEPTS[level.id]}</span>
            </div>
          </SFCard>

          <SFButton variant="primary" size="lg" className="w-full" onClick={runSim}>
            <Play className="w-5 h-5 mr-2" /> Start Cleaning
          </SFButton>
        </>
      )}

      {/* Running */}
      {phase === 'run' && (
        <div className="rounded-xl p-3 text-center text-xs" style={{ background: '#141C33', color: '#B8C0D8' }}>
          Cleaning with <strong style={{ color: LAB_COLOR }}>{activeStrat.label}</strong>… watch the path fill in!
        </div>
      )}

      {/* Result */}
      {phase === 'result' && outcome && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <SFCard variant="elevated" className="p-4" style={{ background: '#0E1428', borderColor: `${LAB_COLOR}30` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold" style={{ color: '#E8ECF5' }}>
                {outcome.fell ? 'Robot Fell!' : outcome.finished ? 'Every cell cleaned!' : 'Out of battery!'}
              </span>
              <div className="flex gap-1" role="img" aria-label={`${stars} of 3 stars`}>
                {[1, 2, 3].map((n) => (
                  <span key={n} style={{ color: n <= stars ? '#FFD93D' : '#2A3450', fontSize: 18 }}>★</span>
                ))}
              </div>
            </div>
            <p className="text-xs mb-2" style={{ color: '#8C94AC' }}>
              {outcome.fell
                ? 'Without a cliff sensor the robot could not see the drop and tumbled down the stairs.'
                : `${activeStrat.label} covered ${outcome.coverage}% of the ${outcome.totalCleanable} reachable cells using ${outcome.batteryUsed} of ${outcome.capacity} battery.`}
            </p>
            {!outcome.fell && !outcome.finished && (
              <p className="text-xs" style={{ color: '#FFB020' }}>
                The battery ran out before every cell was clean — a tidier strategy or a smaller room helps.
              </p>
            )}
          </SFCard>

          <div className="flex gap-2">
            <SFButton variant="outline" className="flex-1" onClick={() => { setPhase('setup'); setOutcome(null); setFrameIdx(0); }}>
              <RotateCcw className="w-4 h-4 mr-1" /> Try Again
            </SFButton>
            <SFButton variant="primary" className="flex-1" onClick={finish}>
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </SFButton>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function SensorToggle({
  icon: Icon, label, hint, checked, onToggle,
}: {
  icon: typeof ShieldCheck;
  label: string;
  hint: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${label}: ${hint}`}
      onClick={onToggle}
      className="flex items-center gap-2 rounded-xl px-3 py-2 transition-all focus-visible:outline-none focus-visible:ring-2"
      style={{
        background: checked ? `${LAB_COLOR}20` : '#141C33',
        border: `2px solid ${checked ? LAB_COLOR : '#232E4A'}`,
        ['--tw-ring-color' as string]: LAB_COLOR,
      }}
    >
      <Icon className="w-4 h-4" style={{ color: checked ? LAB_COLOR : '#8C94AC' }} />
      <span className="text-xs font-semibold" style={{ color: checked ? '#E8ECF5' : '#B8C0D8' }}>{label}</span>
      <span className="text-xs font-bold" style={{ color: checked ? LAB_COLOR : '#5A6078' }}>{checked ? 'ON' : 'OFF'}</span>
    </button>
  );
}

// ── Game entry ────────────────────────────────────────────────────────────────
export default function RobotVacuumGame() {
  const { awardXP, completeGame } = useGameActions();
  const band = (useActiveChild()?.age_band || 'B') as Band;

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    const maxStars = LEVELS.length * 3;
    const ratio = maxStars ? totalStars / maxStars : 0;
    const finalStars = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
    awardXP(Math.round(totalXP));
    completeGame('robot-vacuum', finalStars);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Robot Vacuum" color={LAB_COLOR} labNum={5}>
      <div className="p-4 sm:p-5">
        <GameLevelSystem
          gameTitle="Robot Vacuum"
          gameEmoji="🤖"
          labColor={LAB_COLOR}
          levels={LEVELS}
          onComplete={handleComplete}
          renderLevel={(level, onLevelComplete, onExit) => (
            <RobotVacuumLevel
              key={`${level.id}-${band}`}
              level={level}
              band={band}
              onComplete={onLevelComplete}
              onExit={onExit}
            />
          )}
        />
      </div>
    </GameShell>
  );
}
