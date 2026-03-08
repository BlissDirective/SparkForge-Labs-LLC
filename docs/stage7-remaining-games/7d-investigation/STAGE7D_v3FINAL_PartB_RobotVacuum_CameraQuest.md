# SPARKFORGE — STAGE 7D v3-FINAL (PART B): Robot Vacuum + Camera Quest

**Date:** February 28, 2026 | **GCUD Version:** V9
**Vision:** Laboratory Control Station
**Decision IDs:** 6.5 (Tier 2 Enhanced 3D)
**Code-Reviewed:** March 8, 2026 by Claude Code (Code Review Role per CLAUDE.md §3.1)

---

## Overview

Two complete standalone game file replacements with v3 3D integration:

| File | Type | Lines | v3 Additions | v2 Preserved |
|------|------|-------|-------------|-------------|
| RobotVacuumGame.tsx | REPLACE | ~600 | Dynamic import RobotVacuum3D, isMobile, 3D Canvas above grid | 4 rooms, IF/THEN builder, coverage, efficiency, welcome/learn, particles, bezel |
| CameraQuestGame.tsx | REPLACE | ~550 | Dynamic import CameraQuest3D, isMobile, 3D Canvas above hunt | 11 items, camera+manual, confidence, stars, privacy, welcome/learn, particles, bezel |

**Prerequisites:** Part A must be complete (RobotVacuum3D.tsx + CameraQuest3D.tsx created).
**Supersedes:** STAGE7D_Part2_RobotVacuum_CameraQuest.pdf (Feb 20, 2026).

---

## AUTO-FIX LOG (Applied During Code Review)

| # | Category | File | Original | Fixed | Reason |
|---|----------|------|----------|-------|--------|
| 1 | **Store API** | RobotVacuumGame | `game.addScore(pts)` | `game.updateScore(pts)` | `addScore` does not exist on gameStore. Correct method is `updateScore`. |
| 2 | **Store API** | RobotVacuumGame | `game.nextRound()` | `game.advanceRound()` | `nextRound` does not exist on gameStore. Correct method is `advanceRound`. |
| 3 | **Store API** | CameraQuestGame | `game.addScore(10 + bonus + ...)` | `game.updateScore(10 + bonus + ...)` | Same as #1. |
| 4 | **Store API** | CameraQuestGame | `game.nextRound()` | `game.advanceRound()` | Same as #2. |
| 5 | **Missing prop** | RobotVacuumGame | `GameShell` missing `totalRounds` | Added `totalRounds={ROOMS.length}` | `totalRounds` is required by GameShellProps interface. |
| 6 | **Missing prop** | CameraQuestGame | `GameShell` missing `totalRounds` | Added `totalRounds={items.length}` | Same as #5. Note: `items` depends on age band, so uses computed value. |
| 7 | **Broken JSX** | RobotVacuumGame | `<GameShell>` closing `>` before props | Fixed element structure | PDF formatting broke the JSX element. |
| 8 | **Broken JSX** | CameraQuestGame | Camera `<div>` and `<video>` interleaved | Reconstructed camera UI section | PDF line-wrapping severely mangled the camera active state JSX. |
| 9 | **Truncated strings** | Both files | Multiple truncated strings/classNames (6+ instances) | Completed all strings | PDF line-wrap truncation. |
| 10 | **Orphaned JSX** | Both files | Bottom LED `<div>` outside `</GameShell>` | Moved inside `</GameShell>` | JSX elements must be within the parent component tree. |
| 11 | **Quote style** | Both files | `"use client"` (double quotes) | `'use client'` (single quotes) | Consistency with all existing project components. |

---

## v3 Integration Pattern (consistent across all game files)

```typescript
// 1. Dynamic import with loading fallback [ENH-1]
import dynamic from 'next/dynamic';
const Component3D = dynamic(() => import('@/components/3d/...'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-32 rounded-xl bg-[labColor]/5 animate-pulse
      flex items-center justify-center">
      <span className="text-[labColor]/30 text-xs font-body">Loading 3D…</span>
    </div>
  ),
});

// 2. Mobile detection — shared hook [ENH-2]
import { useIsMobile } from '@/hooks/useIsMobile';
const isMobile = useIsMobile();

// 3. Render above game UI in play phase
{!isMobile && <Component3D ...props isMobile={isMobile} />}

// 4. Mobile: existing CSS/emoji/SVG UI unchanged (no 3D Canvas)
```

---

## File 1: `src/components/games/RobotVacuumGame.tsx`

```tsx
'use client';

// ================================================================
// ROBOT VACUUM V2 — Lab 5 (AI Helpers) — FLAGSHIP-LITE
// [v3] Decision 6.5: Tier 2 Enhanced 3D (isometric room)
//
// FEATURES:
// 1. Isometric-style room grid with furniture emoji obstacles
// 2. Dust particles that get cleaned with swoosh trail
// 3. Rule builder UI with IF/THEN dropdown blocks
// 4. Live coverage percentage counter
// 5. Efficiency comparison vs. optimal path
// 6. 4 rooms with escalating difficulty
// 7. Welcome phase, learn phase with 4 concept cards
// 8. Chrome bezel (green, Lab 5), particles, age-band depth
// 9. [v3] 3D isometric room on desktop (RobotVacuum3D)
// ================================================================

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  Play, Plus, Trash2, RotateCcw, BookOpen, Zap, Award,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// [v3] Dynamic import — SSR disabled for R3F [ENH-1: loading fallback]
const RobotVacuum3D = dynamic(
  () => import('@/components/3d/RobotVacuum3D'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-32 rounded-xl bg-emerald-500/5 animate-pulse flex items-center justify-center">
        <span className="text-emerald-400/30 text-xs font-body">Loading 3D…</span>
      </div>
    ),
  }
);

type Phase = 'welcome' | 'learn' | 'play';

interface Rule {
  condition: string;
  action: string;
}

interface Room {
  title: string;
  emoji: string;
  walls: [number, number][];
  furniture: { pos: [number, number]; emoji: string }[];
  dirt: [number, number][];
  charger: [number, number];
  optimalSteps: number;
}

const CONDITIONS = [
  'See dirt',
  'See wall ahead',
  'Battery low',
  'Path clear',
  'At charger',
  'Dirt nearby',
];

const ACTIONS = [
  'Move forward',
  'Turn left',
  'Turn right',
  'Clean',
  'Go to charger',
  'Turn around',
];

const GRID = 6;

const ROOMS: Room[] = [
  {
    title: 'Living Room',
    emoji: '🛋',
    walls: [[0, 2], [1, 2], [3, 0], [3, 1]],
    furniture: [
      { pos: [0, 2], emoji: '🛋' },
      { pos: [1, 2], emoji: '🛋' },
      { pos: [3, 0], emoji: '📺' },
      { pos: [3, 1], emoji: '📺' },
    ],
    dirt: [[1, 1], [2, 3], [4, 4], [5, 1]],
    charger: [0, 0],
    optimalSteps: 18,
  },
  {
    title: 'Kitchen',
    emoji: '🍳',
    walls: [[1, 1], [1, 3], [3, 3], [4, 1]],
    furniture: [
      { pos: [1, 1], emoji: '🍳' },
      { pos: [1, 3], emoji: '🧊' },
      { pos: [3, 3], emoji: '🧊' },
      { pos: [4, 1], emoji: '🍳' },
    ],
    dirt: [[0, 3], [2, 2], [3, 4], [5, 5], [4, 0]],
    charger: [0, 0],
    optimalSteps: 22,
  },
  {
    title: 'Bedroom',
    emoji: '🛏',
    walls: [[2, 0], [2, 1], [2, 3], [4, 4]],
    furniture: [
      { pos: [2, 0], emoji: '🛏' },
      { pos: [2, 1], emoji: '🛏' },
      { pos: [2, 3], emoji: '🧳' },
      { pos: [4, 4], emoji: '🛏' },
    ],
    dirt: [[0, 4], [1, 2], [3, 1], [5, 3], [4, 5], [1, 5]],
    charger: [5, 5],
    optimalSteps: 26,
  },
  {
    title: 'Office',
    emoji: '💻',
    walls: [[1, 0], [1, 4], [3, 2], [4, 2], [4, 4]],
    furniture: [
      { pos: [1, 0], emoji: '💻' },
      { pos: [1, 4], emoji: '📚' },
      { pos: [3, 2], emoji: '🪑' },
      { pos: [4, 2], emoji: '🪑' },
      { pos: [4, 4], emoji: '📚' },
    ],
    dirt: [[0, 2], [0, 5], [2, 1], [2, 4], [3, 5], [5, 0], [5, 3]],
    charger: [0, 0],
    optimalSteps: 30,
  },
];

const LEARN_CARDS = [
  {
    title: 'IF/THEN Rules',
    emoji: '📋',
    desc: 'AI agents follow rules: IF something is true, THEN do an action. Simple rules create smart behavior!',
  },
  {
    title: 'Sensors',
    emoji: '👁',
    desc: 'The vacuum "sees" what\'s around it — dirt, walls, and its battery level. These are its sensors.',
  },
  {
    title: 'Priority Order',
    emoji: '⬆️',
    desc: 'Rules at the top are checked first. Put important rules higher!',
  },
  {
    title: 'Coverage',
    emoji: '📊',
    desc: 'A good agent cleans ALL the dirt efficiently. Fewer steps = better!',
  },
];

const DIR_OFFSETS: [number, number][] = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

export function RobotVacuumGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [rules, setRules] = useState<Rule[]>([
    { condition: 'See dirt', action: 'Clean' },
    { condition: 'Path clear', action: 'Move forward' },
    { condition: 'See wall ahead', action: 'Turn right' },
  ]);
  const [roomIdx, setRoomIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [vacPos, setVacPos] = useState<[number, number]>([0, 0]);
  const [vacDir, setVacDir] = useState(0);
  const [cleaned, setCleaned] = useState<Set<string>>(new Set());
  const [stepCount, setStepCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [trail, setTrail] = useState<string[]>([]);

  // [v3] Mobile detection — shared hook [ENH-2]
  const isMobile = useIsMobile();

  const room = ROOMS[roomIdx];

  const isWall = (r: number, c: number) =>
    room.walls.some(([wr, wc]) => wr === r && wc === c);

  const getFurniture = (r: number, c: number) =>
    room.furniture.find((f) => f.pos[0] === r && f.pos[1] === c);

  const totalDirt = room.dirt.length;
  const cleanedCount = cleaned.size;
  const coverage =
    totalDirt > 0 ? Math.round((cleanedCount / totalDirt) * 100) : 0;

  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 4,
        dur: Math.random() * 6 + 4,
      })),
    []
  );

  function addRule() {
    if (rules.length < 8)
      setRules((p) => [...p, { condition: CONDITIONS[0], action: ACTIONS[0] }]);
  }

  function removeRule(i: number) {
    setRules((p) => p.filter((_, idx) => idx !== i));
  }

  function updateRule(i: number, field: 'condition' | 'action', val: string) {
    setRules((p) =>
      p.map((r, idx) => (idx === i ? { ...r, [field]: val } : r))
    );
  }

  const runSim = useCallback(async () => {
    setRunning(true);
    setCleaned(new Set());
    setTrail([]);
    setStepCount(0);
    setShowResults(false);

    let pos: [number, number] = [room.charger[0], room.charger[1]];
    let dir = 0;
    const cl = new Set<string>();
    const tr: string[] = [];

    for (let step = 0; step < 80; step++) {
      setVacPos([...pos]);
      setVacDir(dir);
      setStepCount(step);
      tr.push(`${pos[0]},${pos[1]}`);
      setTrail([...tr]);

      let acted = false;
      for (const rule of rules) {
        const ahead: [number, number] = [
          pos[0] + DIR_OFFSETS[dir][0],
          pos[1] + DIR_OFFSETS[dir][1],
        ];
        const aheadBlocked =
          ahead[0] < 0 ||
          ahead[0] >= GRID ||
          ahead[1] < 0 ||
          ahead[1] >= GRID ||
          isWall(ahead[0], ahead[1]);
        const onDirt = room.dirt.some(
          ([r, c]) => r === pos[0] && c === pos[1] && !cl.has(`${r},${c}`)
        );
        const nearDirt = DIR_OFFSETS.some(([dr, dc]) => {
          const nr = pos[0] + dr;
          const nc = pos[1] + dc;
          return room.dirt.some(
            ([r, c]) => r === nr && c === nc && !cl.has(`${r},${c}`)
          );
        });
        const atCharger =
          pos[0] === room.charger[0] && pos[1] === room.charger[1];
        const battLow = step > 55;

        let condMet = false;
        if (rule.condition === 'See dirt' && onDirt) condMet = true;
        if (rule.condition === 'See wall ahead' && aheadBlocked) condMet = true;
        if (rule.condition === 'Battery low' && battLow) condMet = true;
        if (rule.condition === 'Path clear' && !aheadBlocked) condMet = true;
        if (rule.condition === 'At charger' && atCharger) condMet = true;
        if (rule.condition === 'Dirt nearby' && nearDirt) condMet = true;

        if (condMet) {
          if (rule.action === 'Move forward' && !aheadBlocked) pos = ahead;
          else if (rule.action === 'Turn left') dir = (dir + 3) % 4;
          else if (rule.action === 'Turn right') dir = (dir + 1) % 4;
          else if (rule.action === 'Turn around') dir = (dir + 2) % 4;
          else if (rule.action === 'Clean' && onDirt)
            cl.add(`${pos[0]},${pos[1]}`);
          acted = true;
          break;
        }
      }

      setCleaned(new Set(cl));
      await new Promise((r) => setTimeout(r, 200));
      if (cl.size === totalDirt || !acted) break;
    }

    setShowResults(true);
    const pts = cl.size * 4;
    game.updateScore(pts);
    setRunning(false);
  }, [rules, room, roomIdx, game, totalDirt]);

  function nextRoom() {
    if (roomIdx < ROOMS.length - 1) {
      const next = roomIdx + 1;
      setRoomIdx(next);
      setCleaned(new Set());
      setVacPos([ROOMS[next].charger[0], ROOMS[next].charger[1]]);
      setVacDir(0);
      setStepCount(0);
      setShowResults(false);
      setTrail([]);
      game.advanceRound();
    } else {
      game.completeGame();
    }
  }

  function resetRoom() {
    setCleaned(new Set());
    setVacPos([room.charger[0], room.charger[1]]);
    setVacDir(0);
    setStepCount(0);
    setShowResults(false);
    setTrail([]);
  }

  return (
    <GameShell
      gameId="robot-vacuum"
      title="Robot Vacuum"
      worldNumber={5}
      worldColor="#10B981"
      xpReward={25}
      totalRounds={ROOMS.length}
    >
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: `radial-gradient(circle, rgba(16,185,129,${
                  0.12 + p.size * 0.05
                }), transparent)`,
              }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.3, 0.1] }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div
            className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(16,185,129,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
            <div className="flex-1 flex flex-col p-4 overflow-auto">
              <AnimatePresence mode="wait">
                {/* === WELCOME === */}
                {phase === 'welcome' && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <motion.span
                      className="text-6xl block"
                      animate={{ x: [0, 8, 0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      🧹
                    </motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">
                      Robot Vacuum Challenge
                    </h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? 'Design a rule-based agent: define IF/THEN production rules, set priority order, and optimize for coverage efficiency vs. optimal path length.'
                        : 'Program a robot vacuum with IF/THEN rules! Make it clean every dust speck in the room!'}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['Rule-Based AI', 'Agents', 'Sensors', 'Planning'].map(
                        (t) => (
                          <span
                            key={t}
                            className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 font-body text-[10px] text-emerald-300"
                          >
                            {t}
                          </span>
                        )
                      )}
                    </div>
                    <motion.button
                      onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Learn the Rules!{' '}
                      <BookOpen className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* === LEARN === */}
                {phase === 'learn' && (
                  <motion.div
                    key="learn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center space-y-4"
                  >
                    <Zap className="w-6 h-6 text-emerald-400" />
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={learnIdx}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="max-w-md w-full rounded-xl p-5 border border-emerald-500/20 bg-emerald-500/[0.03]"
                      >
                        <span className="text-4xl">
                          {LEARN_CARDS[learnIdx].emoji}
                        </span>
                        <h4 className="font-display text-base font-bold text-emerald-300 mt-3">
                          {LEARN_CARDS[learnIdx].title}
                        </h4>
                        <p className="font-body text-sm text-white/60 mt-2">
                          {LEARN_CARDS[learnIdx].desc}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                    <motion.button
                      onClick={() => {
                        if (learnIdx < LEARN_CARDS.length - 1)
                          setLearnIdx((i) => i + 1);
                        else setPhase('play');
                      }}
                      className="w-full max-w-md py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {learnIdx < LEARN_CARDS.length - 1
                        ? 'Next →'
                        : 'Start Cleaning! 🧹'}
                    </motion.button>
                    <button
                      onClick={() => setPhase('play')}
                      className="font-body text-xs text-white/20 hover:text-white/40"
                    >
                      Skip tutorial
                    </button>
                  </motion.div>
                )}

                {/* === PLAY === */}
                {phase === 'play' && (
                  <motion.div
                    key="play"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col"
                  >
                    {/* Room header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{room.emoji}</span>
                      <h3 className="font-display text-sm font-bold text-white flex-1">
                        {room.title}
                      </h3>
                      <span className="font-mono text-[10px] text-white/20">
                        Room {roomIdx + 1}/{ROOMS.length}
                      </span>
                    </div>

                    {/* Coverage bar */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          animate={{ width: `${coverage}%` }}
                          style={{
                            backgroundColor:
                              coverage >= 100
                                ? '#10B981'
                                : coverage >= 50
                                ? '#FBBF24'
                                : '#EF4444',
                          }}
                        />
                      </div>
                      <span
                        className="font-display text-xs font-bold"
                        style={{
                          color:
                            coverage >= 100
                              ? '#10B981'
                              : coverage >= 50
                              ? '#FBBF24'
                              : '#EF4444',
                        }}
                      >
                        {coverage}%
                      </span>
                    </div>

                    {/* [v3] 3D Scene — desktop only */}
                    {!isMobile && phase === 'play' && (
                      <RobotVacuum3D
                        room={room}
                        vacPos={vacPos}
                        vacDir={vacDir}
                        cleaned={cleaned}
                        trail={trail}
                        gridSize={GRID}
                        running={running}
                        isMobile={isMobile}
                      />
                    )}

                    {/* Main area: Grid + Rules side by side */}
                    <div className="flex gap-3 flex-1 mb-2">
                      {/* Grid */}
                      <div className="flex-shrink-0">
                        <div
                          className="grid gap-0.5"
                          style={{
                            gridTemplateColumns: `repeat(${GRID}, 2rem)`,
                          }}
                        >
                          {Array.from({ length: GRID * GRID }).map((_, i) => {
                            const r = Math.floor(i / GRID);
                            const c = i % GRID;
                            const isV = vacPos[0] === r && vacPos[1] === c;
                            const wall = isWall(r, c);
                            const furn = getFurniture(r, c);
                            const isDirt = room.dirt.some(
                              ([dr, dc]) => dr === r && dc === c
                            );
                            const isCleaned = cleaned.has(`${r},${c}`);
                            const isCharger =
                              room.charger[0] === r && room.charger[1] === c;
                            const wasVisited = trail.includes(`${r},${c}`);

                            return (
                              <div
                                key={i}
                                className="w-8 h-8 rounded-md flex items-center justify-center text-xs"
                                style={{
                                  backgroundColor: isV
                                    ? 'rgba(16,185,129,0.2)'
                                    : wall
                                    ? 'rgba(255,255,255,0.08)'
                                    : isCleaned
                                    ? 'rgba(16,185,129,0.06)'
                                    : wasVisited
                                    ? 'rgba(16,185,129,0.02)'
                                    : 'rgba(255,255,255,0.02)',
                                  border: isV
                                    ? '1px solid rgba(16,185,129,0.4)'
                                    : '1px solid rgba(255,255,255,0.05)',
                                }}
                              >
                                {isV && (
                                  <motion.span
                                    animate={{ rotate: [0, 5, -5, 0] }}
                                    transition={{
                                      duration: 0.5,
                                      repeat: Infinity,
                                    }}
                                  >
                                    🧹
                                  </motion.span>
                                )}
                                {!isV && furn && <span>{furn.emoji}</span>}
                                {!isV && !furn && isDirt && !isCleaned && (
                                  <span className="text-[8px] opacity-60">
                                    🟤
                                  </span>
                                )}
                                {!isV && !furn && isCleaned && (
                                  <motion.span
                                    className="text-[8px]"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                  >
                                    ✨
                                  </motion.span>
                                )}
                                {!isV && !furn && !isDirt && isCharger && (
                                  <span className="text-[8px]">⚡</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <p className="font-mono text-[8px] text-white/15 text-center mt-1">
                          Steps: {stepCount}
                        </p>
                      </div>

                      {/* Rules panel */}
                      <div className="flex-1 flex flex-col min-w-0">
                        <p className="font-display text-[10px] font-bold text-white/30 mb-1">
                          Rules (priority order):
                        </p>
                        <div className="flex-1 overflow-auto space-y-1">
                          {rules.map((rule, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.02]"
                            >
                              <span className="font-mono text-[8px] text-white/15 w-3">
                                {i + 1}
                              </span>
                              <select
                                value={rule.condition}
                                onChange={(e) =>
                                  updateRule(i, 'condition', e.target.value)
                                }
                                className="flex-1 px-1 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/15 text-white font-body text-[9px]"
                                aria-label={`Rule ${i + 1} condition`}
                              >
                                {CONDITIONS.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                              <span className="font-mono text-[8px] text-white/15">
                                →
                              </span>
                              <select
                                value={rule.action}
                                onChange={(e) =>
                                  updateRule(i, 'action', e.target.value)
                                }
                                className="flex-1 px-1 py-0.5 rounded bg-blue-500/10 border border-blue-500/15 text-white font-body text-[9px]"
                                aria-label={`Rule ${i + 1} action`}
                              >
                                {ACTIONS.map((a) => (
                                  <option key={a} value={a}>
                                    {a}
                                  </option>
                                ))}
                              </select>
                              {!running && rules.length > 1 && (
                                <button
                                  onClick={() => removeRule(i)}
                                  className="text-white/10 hover:text-red-400"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        {!running && rules.length < 8 && (
                          <button
                            onClick={addRule}
                            className="mt-1 w-full py-1 rounded-lg border border-dashed border-white/10 text-white/20 font-body text-[9px] flex items-center justify-center gap-1"
                          >
                            <Plus className="w-2.5 h-2.5" /> Add Rule
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Results panel */}
                    <AnimatePresence>
                      {showResults && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mb-2 rounded-xl p-3 border border-emerald-500/15 bg-emerald-500/[0.03]"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p
                                className="font-display text-lg font-black"
                                style={{
                                  color:
                                    coverage >= 100 ? '#10B981' : '#FBBF24',
                                }}
                              >
                                {coverage}%
                              </p>
                              <p className="font-body text-[8px] text-white/25">
                                Coverage
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="font-display text-lg font-black text-white">
                                {stepCount}
                              </p>
                              <p className="font-body text-[8px] text-white/25">
                                Steps
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="font-display text-lg font-black text-blue-400">
                                {room.optimalSteps}
                              </p>
                              <p className="font-body text-[8px] text-white/25">
                                Optimal
                              </p>
                            </div>
                            <div className="text-center">
                              <p
                                className="font-display text-sm font-black"
                                style={{
                                  color:
                                    stepCount <= room.optimalSteps * 1.2
                                      ? '#10B981'
                                      : '#FBBF24',
                                }}
                              >
                                {stepCount > 0
                                  ? Math.round(
                                      (room.optimalSteps / stepCount) * 100
                                    )
                                  : 0}
                                %
                              </p>
                              <p className="font-body text-[8px] text-white/25">
                                Efficiency
                              </p>
                            </div>
                          </div>
                          {ageBand === 'C' && (
                            <p className="font-body text-[9px] text-white/25 mt-1 text-center">
                              Rule evaluation: {rules.length} production rules,
                              first-match semantics. Efficiency = optimal/actual
                              steps.
                            </p>
                          )}
                          {/* [ENH-3] Edit Rules — reset simulation, keep rules for iterative learning */}
                          <button
                            onClick={() => {
                              setCleaned(new Set());
                              setTrail([]);
                              setStepCount(0);
                              setShowResults(false);
                              setVacPos(room.charger);
                              setVacDir(0);
                            }}
                            className="mt-2 w-full py-1.5 rounded-lg border border-emerald-500/20 text-emerald-400/60 font-body text-[10px] hover:bg-emerald-500/5 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1"
                          >
                            <RotateCcw className="w-2.5 h-2.5" /> Edit Rules &amp; Retry
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Controls */}
                    <div className="flex gap-1.5">
                      <button
                        onClick={resetRoom}
                        disabled={running}
                        className="px-3 py-2 rounded-xl border border-white/10 text-white/25 font-body text-xs flex items-center gap-1 hover:border-white/20"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                      {!showResults ? (
                        <motion.button
                          onClick={runSim}
                          disabled={running || rules.length === 0}
                          className="flex-1 py-2 rounded-xl font-display font-bold text-sm text-white flex items-center justify-center gap-1"
                          style={{
                            background:
                              !running && rules.length > 0
                                ? 'linear-gradient(135deg, #10B981, #059669)'
                                : 'rgba(255,255,255,0.05)',
                          }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Play className="w-3.5 h-3.5" />{' '}
                          {running ? 'Running...' : 'Run Vacuum!'}
                        </motion.button>
                      ) : (
                        <motion.button
                          onClick={nextRoom}
                          className="flex-1 py-2 rounded-xl font-display font-bold text-sm text-white"
                          style={{
                            background:
                              'linear-gradient(135deg, #10B981, #059669)',
                          }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {roomIdx < ROOMS.length - 1
                            ? 'Next Room →'
                            : 'Complete! 🎉'}
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
```

---

## File 2: `src/components/games/CameraQuestGame.tsx`

```tsx
'use client';

// ================================================================
// CAMERA QUEST V2 — Lab 7 (Computer Vision) — FLAGSHIP-LITE
// [v3] Decision 6.5: Tier 2 Enhanced 3D (polaroid cards + gauge)
//
// FEATURES:
// 1. Polaroid-style scavenger hunt cards that flip when found
// 2. Photo gallery with trophy frames
// 3. Difficulty progression: colors -> shapes -> abstract
// 4. AI confidence simulation meter
// 5. Privacy-first: no images stored, clear consent messaging
// 6. Welcome phase, learn phase, chrome bezel
// 7. Manual fallback for no-camera devices
// 8. [v3] 3D polaroid cards + confidence gauge on desktop
// ================================================================

import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  Camera, Check, X, BookOpen, Eye, Lock, Star, Sparkles,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// [v3] Dynamic import — SSR disabled for R3F [ENH-1: loading fallback]
const CameraQuest3D = dynamic(
  () => import('@/components/3d/CameraQuest3D'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-32 rounded-xl bg-cyan-500/5 animate-pulse flex items-center justify-center">
        <span className="text-cyan-400/30 text-xs font-body">Loading 3D…</span>
      </div>
    ),
  }
);

type Phase = 'welcome' | 'learn' | 'hunt';

interface HuntItem {
  text: string;
  emoji: string;
  category: 'color' | 'shape' | 'abstract';
  difficulty: 1 | 2 | 3;
  hintA: string;
  hintC: string;
  simConfidence: number;
}

const HUNT_ITEMS: HuntItem[] = [
  // Easy — colors
  {
    text: 'Something RED',
    emoji: '🔴',
    category: 'color',
    difficulty: 1,
    simConfidence: 92,
    hintA: 'Look for a red toy, book, or cup!',
    hintC: 'Color detection uses HSV space — red occupies H:0-10 and H:170-180. Saturation threshold matters.',
  },
  {
    text: 'Something BLUE',
    emoji: '🔵',
    category: 'color',
    difficulty: 1,
    simConfidence: 89,
    hintA: 'The sky, a pen, or a shirt!',
    hintC: 'Blue channel isolation in RGB. Sky detection uses semantic segmentation.',
  },
  {
    text: 'Something GREEN',
    emoji: '🟢',
    category: 'color',
    difficulty: 1,
    simConfidence: 87,
    hintA: 'A plant, a crayon, or some food!',
    hintC: 'Green is common in nature — plants dominate this channel. Chlorophyll reflects 500-565nm.',
  },
  {
    text: 'Something YELLOW',
    emoji: '🟡',
    category: 'color',
    difficulty: 1,
    simConfidence: 84,
    hintA: 'A banana, a toy, or a sign!',
    hintC: 'Yellow = high red + high green, low blue. Narrow band in HSV (H:20-35).',
  },
  // Medium — shapes
  {
    text: 'Something ROUND',
    emoji: '⭕',
    category: 'shape',
    difficulty: 2,
    simConfidence: 78,
    hintA: 'A ball, a plate, or a clock!',
    hintC: 'Circle detection via Hough transform. Look for objects with consistent radius.',
  },
  {
    text: 'Something SQUARE',
    emoji: '🟧',
    category: 'shape',
    difficulty: 2,
    simConfidence: 72,
    hintA: 'A book, a window, or a screen!',
    hintC: 'Rectangle detection: 4 corners with ~90 degree angles. Perspective correction may be needed.',
  },
  {
    text: 'Something with STRIPES',
    emoji: '🏳',
    category: 'shape',
    difficulty: 2,
    simConfidence: 68,
    hintA: 'A shirt, a rug, or a flag!',
    hintC: 'Repetitive pattern detection. Fourier analysis reveals stripe frequency.',
  },
  {
    text: 'Something TALL',
    emoji: '🗼',
    category: 'shape',
    difficulty: 2,
    simConfidence: 65,
    hintA: 'A door, a lamp, or a bottle!',
    hintC: 'Height estimation requires reference objects. Aspect ratio > 2:1 suggests tall.',
  },
  // Hard — abstract
  {
    text: 'Something SOFT',
    emoji: '☁️',
    category: 'abstract',
    difficulty: 3,
    simConfidence: 35,
    hintA: 'A pillow, a stuffed animal, or a blanket!',
    hintC: 'Texture classification: soft materials have low-frequency texture patterns. Hard for CV!',
  },
  {
    text: "Something the AI wouldn't recognize",
    emoji: '🤔',
    category: 'abstract',
    difficulty: 3,
    simConfidence: 15,
    hintA: 'Something weird or unusual!',
    hintC: 'Out-of-distribution objects produce low-confidence scores across all classes.',
  },
  {
    text: 'Something with TEXT on it',
    emoji: '📝',
    category: 'abstract',
    difficulty: 3,
    simConfidence: 82,
    hintA: 'A book, a sign, or a cereal box!',
    hintC: 'OCR pipeline: text detection (EAST/CRAFT) then recognition (Tesseract/CRNN).',
  },
];

const LEARN_CARDS = [
  {
    title: 'Computer Vision',
    emoji: '👁',
    desc: 'AI can "see" through cameras — it detects colors, shapes, and objects.',
  },
  {
    title: 'Object Detection',
    emoji: '🔍',
    desc: 'AI draws boxes around things it recognizes. Some objects are easier than others!',
  },
  {
    title: 'Confidence',
    emoji: '📊',
    desc: "AI isn't 100% sure about everything. It gives a confidence score for each guess.",
  },
  {
    title: 'Limits',
    emoji: '⚠️',
    desc: "AI struggles with unusual objects, bad lighting, and abstract concepts like 'soft' or 'tall'.",
  },
];

export function CameraQuestGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [ci, setCi] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [showConfidence, setShowConfidence] = useState(false);
  const [streak, setStreak] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // [v3] Mobile detection — shared hook [ENH-2]
  const isMobile = useIsMobile();

  // Filter items by age band
  const items = useMemo(() => {
    if (ageBand === 'A') return HUNT_ITEMS.filter((i) => i.difficulty <= 2);
    return HUNT_ITEMS;
  }, [ageBand]);

  const item = items[ci];

  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 4,
        dur: Math.random() * 6 + 4,
      })),
    []
  );

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch {
      setCaptured(true); // Fallback to manual
    }
  }

  function capture() {
    setCaptured(true);
    setShowConfidence(true);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      setCameraActive(false);
    }
  }

  function confirm(foundIt: boolean) {
    if (foundIt) {
      const bonus = streak >= 2 ? 5 : 0;
      game.updateScore(10 + bonus + (item.difficulty === 3 ? 5 : 0));
      setFound((prev) => new Set(prev).add(ci));
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }

    setCaptured(false);
    setShowConfidence(false);

    if (ci < items.length - 1) {
      setCi((i) => i + 1);
      game.advanceRound();
    } else {
      game.completeGame();
    }
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <GameShell
      gameId="camera-quest"
      title="Camera Quest"
      worldNumber={7}
      worldColor="#06B6D4"
      xpReward={25}
      totalRounds={items.length}
    >
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: `radial-gradient(circle, rgba(6,182,212,${
                  0.12 + p.size * 0.05
                }), transparent)`,
              }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.3, 0.1] }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div
            className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(6,182,212,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <div className="flex-1 flex flex-col p-4 overflow-auto">
              <AnimatePresence mode="wait">
                {/* === WELCOME === */}
                {phase === 'welcome' && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <motion.span
                      className="text-6xl block"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      📷
                    </motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">
                      Camera Quest
                    </h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? 'Scavenger hunt teaching computer vision concepts: color detection (HSV), shape recognition (Hough transform), and classification confidence.'
                        : 'Use your camera to find real objects! Hunt for colors, shapes, and tricky things!'}
                    </p>
                    {/* Privacy badge */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/5 border border-cyan-500/15">
                      <Lock className="w-3 h-3 text-cyan-400" />
                      <p className="font-body text-[10px] text-cyan-300">
                        No images are stored — privacy first!
                      </p>
                    </div>
                    <motion.button
                      onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{
                        background: 'linear-gradient(135deg, #06B6D4, #0891B2)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      How AI Sees!{' '}
                      <Eye className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* === LEARN === */}
                {phase === 'learn' && (
                  <motion.div
                    key="learn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center space-y-4"
                  >
                    <Eye className="w-6 h-6 text-cyan-400" />
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={learnIdx}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="max-w-md w-full rounded-xl p-5 border border-cyan-500/20 bg-cyan-500/[0.03]"
                      >
                        <span className="text-4xl">
                          {LEARN_CARDS[learnIdx].emoji}
                        </span>
                        <h4 className="font-display text-base font-bold text-cyan-300 mt-3">
                          {LEARN_CARDS[learnIdx].title}
                        </h4>
                        <p className="font-body text-sm text-white/60 mt-2">
                          {LEARN_CARDS[learnIdx].desc}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                    <motion.button
                      onClick={() => {
                        if (learnIdx < LEARN_CARDS.length - 1)
                          setLearnIdx((i) => i + 1);
                        else setPhase('hunt');
                      }}
                      className="w-full max-w-md py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{
                        background: 'linear-gradient(135deg, #06B6D4, #0891B2)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {learnIdx < LEARN_CARDS.length - 1
                        ? 'Next →'
                        : 'Start the Hunt! 🔍'}
                    </motion.button>
                    <button
                      onClick={() => setPhase('hunt')}
                      className="font-body text-xs text-white/20 hover:text-white/40"
                    >
                      Skip tutorial
                    </button>
                  </motion.div>
                )}

                {/* === HUNT === */}
                {phase === 'hunt' && item && (
                  <motion.div
                    key="hunt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center"
                  >
                    {/* [v3] 3D Scene — desktop only */}
                    {!isMobile && (
                      <CameraQuest3D
                        items={items}
                        currentIndex={ci}
                        found={found}
                        showConfidence={showConfidence}
                        captured={captured}
                        isMobile={isMobile}
                      />
                    )}

                    {/* Collection progress */}
                    <div className="flex gap-1 mb-3 flex-wrap justify-center">
                      {items.map((it, i) => (
                        <motion.div
                          key={i}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs border ${
                            found.has(i)
                              ? 'border-cyan-500/40 bg-cyan-500/10'
                              : i === ci
                              ? 'border-cyan-500/30 bg-white/5'
                              : 'border-white/5 bg-white/[0.01]'
                          }`}
                          animate={i === ci ? { scale: [1, 1.05, 1] } : {}}
                          transition={{
                            duration: 1.5,
                            repeat: i === ci ? Infinity : 0,
                          }}
                        >
                          {found.has(i) ? (
                            <Check className="w-3 h-3 text-cyan-400" />
                          ) : (
                            <span className="opacity-30">{it.emoji}</span>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Current challenge */}
                    <motion.div
                      key={ci}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center mb-4"
                    >
                      <div className="flex items-center gap-1 justify-center mb-1">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 font-body text-[9px] text-cyan-300">
                          {item.category}
                        </span>
                        <span className="flex gap-0.5">
                          {[1, 2, 3].map((d) => (
                            <Star
                              key={d}
                              className={`w-2.5 h-2.5 ${
                                d <= item.difficulty
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-white/10'
                              }`}
                            />
                          ))}
                        </span>
                      </div>
                      <span className="text-5xl block mb-2">{item.emoji}</span>
                      <h3 className="font-display text-xl font-bold text-white">
                        Find {item.text}
                      </h3>
                      <p className="font-body text-[10px] text-white/30 mt-1 max-w-sm">
                        {ageBand === 'C' ? item.hintC : item.hintA}
                      </p>
                    </motion.div>

                    {/* Camera / capture UI */}
                    {!cameraActive && !captured && (
                      <div className="flex flex-col gap-2 w-full max-w-xs">
                        <motion.button
                          onClick={startCamera}
                          className="w-full py-3 rounded-xl font-display font-bold text-sm text-white flex items-center justify-center gap-2"
                          style={{
                            background: 'linear-gradient(135deg, #06B6D4, #0891B2)',
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Camera className="w-5 h-5" /> Open Camera
                        </motion.button>
                        <button
                          onClick={() => setCaptured(true)}
                          className="w-full py-2 rounded-xl border border-white/10 text-white/30 font-body text-xs"
                        >
                          No camera? Use manual mode
                        </button>
                      </div>
                    )}

                    {cameraActive && (
                      <div className="relative w-full max-w-sm aspect-[4/3] rounded-2xl overflow-hidden border border-cyan-500/20">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        {/* Viewfinder overlay */}
                        <div className="absolute inset-4 border-2 border-cyan-500/30 rounded-xl" />
                        <motion.button
                          onClick={capture}
                          className="absolute bottom-3 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full border-4 border-white/80 flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(6,182,212,0.2)' }}
                          whileTap={{ scale: 0.8 }}
                          aria-label="Capture photo"
                        >
                          <div className="w-10 h-10 rounded-full bg-white" />
                        </motion.button>
                      </div>
                    )}

                    {captured && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {/* Simulated confidence meter */}
                        {showConfidence && (
                          <div className="mb-3 rounded-xl p-3 border border-cyan-500/15 bg-cyan-500/[0.03]">
                            <p className="font-body text-[10px] text-white/30 mb-1">
                              AI Confidence:
                            </p>
                            <div className="h-3 rounded-full bg-white/5 overflow-hidden mb-1">
                              <motion.div
                                className="h-full rounded-full"
                                style={{
                                  backgroundColor:
                                    item.simConfidence > 80
                                      ? '#10B981'
                                      : item.simConfidence > 50
                                      ? '#FBBF24'
                                      : '#EF4444',
                                }}
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${item.simConfidence}%`,
                                }}
                                transition={{ duration: 1.5 }}
                              />
                            </div>
                            <p
                              className="font-display text-xs font-bold"
                              style={{
                                color:
                                  item.simConfidence > 80
                                    ? '#10B981'
                                    : item.simConfidence > 50
                                    ? '#FBBF24'
                                    : '#EF4444',
                              }}
                            >
                              {item.simConfidence}% confident
                            </p>
                            {item.simConfidence < 50 && (
                              <p className="font-body text-[9px] text-white/25 mt-0.5">
                                {ageBand === 'C'
                                  ? 'Low confidence: abstract properties are difficult for standard classifiers.'
                                  : 'AI finds this one tricky! Some things are hard for computers to see.'}
                              </p>
                            )}
                          </div>
                        )}

                        <p className="font-body text-sm text-white/50 mb-3">
                          Did you find {item.text}?
                        </p>
                        <div className="flex gap-3 justify-center">
                          <motion.button
                            onClick={() => confirm(true)}
                            className="px-6 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-display text-sm font-bold flex items-center gap-1"
                            whileTap={{ scale: 0.95 }}
                          >
                            <Check className="w-4 h-4" /> Found it!
                          </motion.button>
                          <motion.button
                            onClick={() => confirm(false)}
                            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 font-display text-sm font-bold flex items-center gap-1"
                            whileTap={{ scale: 0.95 }}
                          >
                            <X className="w-4 h-4" /> Skip
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
```

---

## Notes for Build

- Both files are **complete standalone replacements** — copy entire file contents.
- `totalRounds` is passed to `GameShell` which calls `startGame(gameId, totalRounds)` on mount.
- Store API uses `updateScore()` and `advanceRound()` (NOT `addScore`/`nextRound`).
- The bottom LED strip `<div>` is inside the bezel container, before the closing `</div>` of the card.
- Camera Quest's `items` array is age-band filtered (A gets difficulty ≤ 2), so `totalRounds` uses the computed `items.length`.
- Unused imports `Award` (RobotVacuum) and `Sparkles`/`BookOpen` (CameraQuest) are kept for potential use in future enhancements but can be removed during build if ESLint flags them.

**NEXT:** Part C — FutureForgeGame.tsx + Pixel Investigator (UNCHANGED) + Fool the AI (UNCHANGED) + Registry + Verification + Git
