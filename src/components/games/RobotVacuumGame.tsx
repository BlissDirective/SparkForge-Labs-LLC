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

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useGameContent } from '@/hooks/useContent';
import { useSceneStore } from '@/stores/sceneStore';
import {
  Play, Plus, Trash2, RotateCcw, BookOpen, Zap,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';

// [v3] Dynamic import — SSR disabled for R3F [ENH-1: loading fallback]
const RobotVacuum3D = dynamic(
  () => import('@/components/3d/RobotVacuum3D'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-32 rounded-xl bg-emerald-500/5 animate-pulse flex items-center justify-center">
        <span className="text-emerald-400/30 text-xs font-body">Loading 3D...</span>
      </div>
    ),
  }
);

type Phase = 'welcome' | 'learn' | 'play' | 'complete';

interface Rule {
  condition: string;
  action: string;
}

type RoomDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

interface Room {
  title: string;
  emoji: string;
  difficulty: RoomDifficulty;
  walls: [number, number][];
  furniture: { pos: [number, number]; emoji: string }[];
  dirt: [number, number][];
  charger: [number, number];
  optimalSteps: number;
  isAI?: boolean;
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
    emoji: '\u{1F6CB}',
    difficulty: 'easy',
    walls: [[0, 2], [1, 2], [3, 0], [3, 1]],
    furniture: [
      { pos: [0, 2], emoji: '\u{1F6CB}' },
      { pos: [1, 2], emoji: '\u{1F6CB}' },
      { pos: [3, 0], emoji: '\u{1F4FA}' },
      { pos: [3, 1], emoji: '\u{1F4FA}' },
    ],
    dirt: [[1, 1], [2, 3], [4, 4], [5, 1]],
    charger: [0, 0],
    optimalSteps: 18,
  },
  {
    title: 'Kitchen',
    emoji: '\u{1F373}',
    difficulty: 'easy',
    walls: [[1, 1], [1, 3], [3, 3], [4, 1]],
    furniture: [
      { pos: [1, 1], emoji: '\u{1F373}' },
      { pos: [1, 3], emoji: '\u{1F9CA}' },
      { pos: [3, 3], emoji: '\u{1F9CA}' },
      { pos: [4, 1], emoji: '\u{1F373}' },
    ],
    dirt: [[0, 3], [2, 2], [3, 4], [5, 5], [4, 0]],
    charger: [0, 0],
    optimalSteps: 22,
  },
  {
    title: 'Bedroom',
    emoji: '\u{1F6CF}',
    difficulty: 'medium',
    walls: [[2, 0], [2, 1], [2, 3], [4, 4]],
    furniture: [
      { pos: [2, 0], emoji: '\u{1F6CF}' },
      { pos: [2, 1], emoji: '\u{1F6CF}' },
      { pos: [2, 3], emoji: '\u{1F9F3}' },
      { pos: [4, 4], emoji: '\u{1F6CF}' },
    ],
    dirt: [[0, 4], [1, 2], [3, 1], [5, 3], [4, 5], [1, 5]],
    charger: [5, 5],
    optimalSteps: 26,
  },
  {
    title: 'Office',
    emoji: '\u{1F4BB}',
    difficulty: 'medium',
    walls: [[1, 0], [1, 4], [3, 2], [4, 2], [4, 4]],
    furniture: [
      { pos: [1, 0], emoji: '\u{1F4BB}' },
      { pos: [1, 4], emoji: '\u{1F4DA}' },
      { pos: [3, 2], emoji: '\u{1FA91}' },
      { pos: [4, 2], emoji: '\u{1FA91}' },
      { pos: [4, 4], emoji: '\u{1F4DA}' },
    ],
    dirt: [[0, 2], [0, 5], [2, 1], [2, 4], [3, 5], [5, 0], [5, 3]],
    charger: [0, 0],
    optimalSteps: 30,
  },
  // ═══════ 5x CONTENT EXPANSION (16 new rooms) ═══════
  // --- EASY TIER (3 new rooms) ---
  {
    title: 'Playroom',
    emoji: '\u{1F9F8}',
    difficulty: 'easy',
    walls: [[2, 0], [2, 1]],
    furniture: [
      { pos: [2, 0], emoji: '\u{1F9F8}' },
      { pos: [2, 1], emoji: '\u{1F3AE}' },
    ],
    dirt: [[0, 3], [1, 1], [3, 4], [4, 2]],
    charger: [0, 0],
    optimalSteps: 16,
  },
  {
    title: 'Hallway',
    emoji: '\u{1F6AA}',
    difficulty: 'easy',
    walls: [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]],
    furniture: [
      { pos: [0, 2], emoji: '\u{1F5BC}' },
      { pos: [2, 2], emoji: '\u{1F6AA}' },
      { pos: [4, 2], emoji: '\u{1F5BC}' },
    ],
    dirt: [[0, 0], [2, 0], [4, 0], [1, 4], [3, 5]],
    charger: [5, 0],
    optimalSteps: 20,
  },
  {
    title: 'Garage',
    emoji: '\u{1F697}',
    difficulty: 'easy',
    walls: [[0, 0], [0, 1], [5, 4], [5, 5]],
    furniture: [
      { pos: [0, 0], emoji: '\u{1F697}' },
      { pos: [0, 1], emoji: '\u{1F697}' },
      { pos: [5, 4], emoji: '\u{1F9F0}' },
      { pos: [5, 5], emoji: '\u{1F9F0}' },
    ],
    dirt: [[1, 3], [2, 1], [3, 4], [4, 2]],
    charger: [5, 0],
    optimalSteps: 17,
  },
  // --- MEDIUM TIER (5 new rooms) ---
  {
    title: 'Dining Room',
    emoji: '\u{1F37D}',
    difficulty: 'medium',
    walls: [[1, 1], [1, 2], [1, 3], [1, 4]],
    furniture: [
      { pos: [1, 1], emoji: '\u{1FA91}' },
      { pos: [1, 2], emoji: '\u{1F37D}' },
      { pos: [1, 3], emoji: '\u{1F37D}' },
      { pos: [1, 4], emoji: '\u{1FA91}' },
    ],
    dirt: [[0, 0], [0, 5], [2, 2], [3, 1], [3, 4], [4, 3]],
    charger: [5, 5],
    optimalSteps: 24,
  },
  {
    title: 'Bathroom',
    emoji: '\u{1F6C1}',
    difficulty: 'medium',
    walls: [[0, 3], [0, 4], [0, 5], [3, 0], [3, 1]],
    furniture: [
      { pos: [0, 3], emoji: '\u{1F6C1}' },
      { pos: [0, 4], emoji: '\u{1F6BF}' },
      { pos: [0, 5], emoji: '\u{1FAA5}' },
      { pos: [3, 0], emoji: '\u{1FAA5}' },
      { pos: [3, 1], emoji: '\u{1F9F4}' },
    ],
    dirt: [[1, 0], [1, 5], [2, 2], [4, 1], [4, 4], [5, 3]],
    charger: [5, 5],
    optimalSteps: 25,
  },
  {
    title: 'Studio',
    emoji: '\u{1F3A8}',
    difficulty: 'medium',
    walls: [[2, 2], [2, 3], [3, 2], [3, 3]],
    furniture: [
      { pos: [2, 2], emoji: '\u{1F3A8}' },
      { pos: [2, 3], emoji: '\u{1F58C}' },
      { pos: [3, 2], emoji: '\u{1F5BC}' },
      { pos: [3, 3], emoji: '\u{1F3A8}' },
    ],
    dirt: [[0, 0], [0, 5], [1, 3], [4, 1], [4, 5], [5, 2]],
    charger: [0, 0],
    optimalSteps: 26,
  },
  {
    title: 'Music Room',
    emoji: '\u{1F3B5}',
    difficulty: 'medium',
    walls: [[0, 3], [1, 3], [4, 1], [4, 2]],
    furniture: [
      { pos: [0, 3], emoji: '\u{1F3B9}' },
      { pos: [1, 3], emoji: '\u{1F3B8}' },
      { pos: [4, 1], emoji: '\u{1F941}' },
      { pos: [4, 2], emoji: '\u{1F3B7}' },
    ],
    dirt: [[0, 0], [1, 5], [2, 2], [3, 4], [5, 1], [5, 5]],
    charger: [0, 0],
    optimalSteps: 24,
  },
  {
    title: 'Laundry Room',
    emoji: '\u{1F9FA}',
    difficulty: 'medium',
    walls: [[1, 0], [1, 1], [3, 4], [3, 5]],
    furniture: [
      { pos: [1, 0], emoji: '\u{1F9FA}' },
      { pos: [1, 1], emoji: '\u{1F9FA}' },
      { pos: [3, 4], emoji: '\u{1F9F9}' },
      { pos: [3, 5], emoji: '\u{1F9F4}' },
    ],
    dirt: [[0, 3], [0, 5], [2, 2], [2, 4], [4, 0], [4, 3], [5, 5]],
    charger: [5, 0],
    optimalSteps: 28,
  },
  // --- HARD TIER (5 new rooms) ---
  {
    title: 'Lab',
    emoji: '\u{1F52C}',
    difficulty: 'hard',
    walls: [[0, 2], [0, 3], [2, 0], [2, 5], [4, 2], [4, 3]],
    furniture: [
      { pos: [0, 2], emoji: '\u{1F52C}' },
      { pos: [0, 3], emoji: '\u{1F9EA}' },
      { pos: [2, 0], emoji: '\u{1F9EB}' },
      { pos: [2, 5], emoji: '\u{1F52C}' },
      { pos: [4, 2], emoji: '\u{1F9EA}' },
      { pos: [4, 3], emoji: '\u{1F9EB}' },
    ],
    dirt: [[1, 1], [1, 4], [3, 1], [3, 4], [5, 0], [5, 2], [5, 5]],
    charger: [0, 0],
    optimalSteps: 32,
  },
  {
    title: 'Gym',
    emoji: '\u{1F3CB}',
    difficulty: 'hard',
    walls: [[1, 1], [1, 4], [3, 0], [3, 5], [5, 2], [5, 3]],
    furniture: [
      { pos: [1, 1], emoji: '\u{1F3CB}' },
      { pos: [1, 4], emoji: '\u{1F3CB}' },
      { pos: [3, 0], emoji: '\u{1F6B4}' },
      { pos: [3, 5], emoji: '\u{1F6B4}' },
      { pos: [5, 2], emoji: '\u{1F3CB}' },
      { pos: [5, 3], emoji: '\u{1F3CB}' },
    ],
    dirt: [[0, 0], [0, 3], [0, 5], [2, 2], [4, 1], [4, 4], [5, 0], [5, 5]],
    charger: [0, 0],
    optimalSteps: 35,
  },
  {
    title: 'Library',
    emoji: '\u{1F4DA}',
    difficulty: 'hard',
    walls: [[0, 1], [1, 1], [2, 1], [0, 4], [1, 4], [2, 4]],
    furniture: [
      { pos: [0, 1], emoji: '\u{1F4DA}' },
      { pos: [1, 1], emoji: '\u{1F4DA}' },
      { pos: [2, 1], emoji: '\u{1F4DA}' },
      { pos: [0, 4], emoji: '\u{1F4DA}' },
      { pos: [1, 4], emoji: '\u{1F4DA}' },
      { pos: [2, 4], emoji: '\u{1F4DA}' },
    ],
    dirt: [[0, 0], [0, 5], [3, 0], [3, 3], [3, 5], [4, 2], [5, 1], [5, 4]],
    charger: [5, 5],
    optimalSteps: 34,
  },
  {
    title: 'Warehouse',
    emoji: '\u{1F4E6}',
    difficulty: 'hard',
    walls: [[1, 0], [1, 2], [1, 4], [3, 1], [3, 3], [3, 5]],
    furniture: [
      { pos: [1, 0], emoji: '\u{1F4E6}' },
      { pos: [1, 2], emoji: '\u{1F4E6}' },
      { pos: [1, 4], emoji: '\u{1F4E6}' },
      { pos: [3, 1], emoji: '\u{1F4E6}' },
      { pos: [3, 3], emoji: '\u{1F4E6}' },
      { pos: [3, 5], emoji: '\u{1F4E6}' },
    ],
    dirt: [[0, 1], [0, 5], [2, 1], [2, 3], [2, 5], [4, 0], [4, 2], [4, 4], [5, 3]],
    charger: [0, 0],
    optimalSteps: 38,
  },
  {
    title: 'Hospital Wing',
    emoji: '\u{1F3E5}',
    difficulty: 'hard',
    walls: [[0, 2], [1, 2], [3, 2], [4, 2], [2, 4], [2, 5]],
    furniture: [
      { pos: [0, 2], emoji: '\u{1F6CF}' },
      { pos: [1, 2], emoji: '\u{1F6CF}' },
      { pos: [3, 2], emoji: '\u{1F6CF}' },
      { pos: [4, 2], emoji: '\u{1F6CF}' },
      { pos: [2, 4], emoji: '\u{1FA7A}' },
      { pos: [2, 5], emoji: '\u{1FA7A}' },
    ],
    dirt: [[0, 0], [0, 4], [1, 5], [3, 0], [3, 5], [4, 4], [5, 1], [5, 3]],
    charger: [5, 5],
    optimalSteps: 36,
  },
  // --- EXPERT TIER (3 new rooms) ---
  {
    title: 'Maze',
    emoji: '\u{1F9E9}',
    difficulty: 'expert',
    walls: [[0, 1], [1, 3], [2, 1], [2, 5], [3, 3], [4, 1], [4, 5], [5, 3]],
    furniture: [
      { pos: [0, 1], emoji: '\u{1F9F1}' },
      { pos: [1, 3], emoji: '\u{1F9F1}' },
      { pos: [2, 1], emoji: '\u{1F9F1}' },
      { pos: [2, 5], emoji: '\u{1F9F1}' },
      { pos: [3, 3], emoji: '\u{1F9F1}' },
      { pos: [4, 1], emoji: '\u{1F9F1}' },
      { pos: [4, 5], emoji: '\u{1F9F1}' },
      { pos: [5, 3], emoji: '\u{1F9F1}' },
    ],
    dirt: [[0, 4], [1, 0], [1, 5], [2, 3], [3, 0], [3, 5], [4, 3], [5, 0], [5, 5]],
    charger: [0, 0],
    optimalSteps: 42,
  },
  {
    title: 'Server Room',
    emoji: '\u{1F5A5}',
    difficulty: 'expert',
    walls: [[0, 1], [0, 3], [0, 5], [2, 0], [2, 2], [2, 4], [4, 1], [4, 3], [4, 5]],
    furniture: [
      { pos: [0, 1], emoji: '\u{1F5A5}' },
      { pos: [0, 3], emoji: '\u{1F5A5}' },
      { pos: [0, 5], emoji: '\u{1F5A5}' },
      { pos: [2, 0], emoji: '\u{1F5A5}' },
      { pos: [2, 2], emoji: '\u{1F5A5}' },
      { pos: [2, 4], emoji: '\u{1F5A5}' },
      { pos: [4, 1], emoji: '\u{1F5A5}' },
      { pos: [4, 3], emoji: '\u{1F5A5}' },
      { pos: [4, 5], emoji: '\u{1F5A5}' },
    ],
    dirt: [[1, 0], [1, 2], [1, 4], [3, 1], [3, 3], [3, 5], [5, 0], [5, 2], [5, 4]],
    charger: [0, 0],
    optimalSteps: 45,
  },
  {
    title: 'Space Station',
    emoji: '\u{1F680}',
    difficulty: 'expert',
    walls: [[0, 0], [0, 5], [2, 2], [2, 3], [3, 2], [3, 3], [5, 0], [5, 5]],
    furniture: [
      { pos: [0, 0], emoji: '\u{1F680}' },
      { pos: [0, 5], emoji: '\u{1F6F0}' },
      { pos: [2, 2], emoji: '\u{1F52D}' },
      { pos: [2, 3], emoji: '\u{1F52D}' },
      { pos: [3, 2], emoji: '\u{1FA90}' },
      { pos: [3, 3], emoji: '\u{1FA90}' },
      { pos: [5, 0], emoji: '\u{1F6F0}' },
      { pos: [5, 5], emoji: '\u{1F680}' },
    ],
    dirt: [[0, 2], [0, 3], [1, 0], [1, 5], [4, 0], [4, 5], [5, 2], [5, 3], [1, 3], [4, 2]],
    charger: [3, 0],
    optimalSteps: 48,
  },
];

const LEARN_CARDS = [
  {
    title: 'IF/THEN Rules',
    emoji: '\u{1F4CB}',
    desc: 'AI agents follow rules: IF something is true, THEN do an action. Simple rules create smart behavior!',
  },
  {
    title: 'Sensors',
    emoji: '\u{1F441}',
    desc: 'The vacuum "sees" what\'s around it \u2014 dirt, walls, and its battery level. These are its sensors.',
  },
  {
    title: 'Priority Order',
    emoji: '\u2B06\uFE0F',
    desc: 'Rules at the top are checked first. Put important rules higher!',
  },
  {
    title: 'Coverage',
    emoji: '\u{1F4CA}',
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
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: dynamicContent } = useGameContent('robot-vacuum', ageBand);

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [rules, setRules] = useState<Rule[]>([
    { condition: 'See dirt', action: 'Clean' },
    { condition: 'Path clear', action: 'Move forward' },
    { condition: 'See wall ahead', action: 'Turn right' },
  ]);
  // Filter rooms by age band: A=easy, B=easy+medium, C=all tiers — merge dynamic content
  const rooms = useMemo(() => {
    const allowed: RoomDifficulty[] = ageBand === 'A' ? ['easy'] : ageBand === 'B' ? ['easy', 'medium'] : ['easy', 'medium', 'hard', 'expert'];
    const hardcoded = ROOMS.filter(r => allowed.includes(r.difficulty));
    if (!dynamicContent?.scenarios?.length) return hardcoded;
    const dynamic: Room[] = dynamicContent.scenarios
      .map(s => { try { return { ...JSON.parse(s.content_body), isAI: true } as Room; } catch { return null; } })
      .filter((r): r is Room => r !== null && allowed.includes(r.difficulty));
    return [...hardcoded, ...dynamic];
  }, [ageBand, dynamicContent?.scenarios]);

  const [roomIdx, setRoomIdx] = useState(0);
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const [running, setRunning] = useState(false);
  const [vacPos, setVacPos] = useState<[number, number]>([0, 0]);
  const [vacDir, setVacDir] = useState(0);
  const [cleaned, setCleaned] = useState<Set<string>>(new Set());
  const [stepCount, setStepCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [trail, setTrail] = useState<string[]>([]);

  const room = rooms[roomIdx];

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
          else if (rule.action === 'Go to charger') {
            // Move one step toward charger (FLL-005 fix)
            const dr = Math.sign(room.charger[0] - pos[0]);
            const dc = Math.sign(room.charger[1] - pos[1]);
            const nextR = pos[0] + dr;
            const nextC = pos[1] + dc;
            if (nextR >= 0 && nextR < GRID && nextC >= 0 && nextC < GRID && !isWall(nextR, nextC)) {
              pos = [nextR, nextC];
            }
          }
          acted = true;
          break;
        }
      }

      setCleaned(new Set(cl));
      await new Promise((r) => setTimeout(r, 200));
      if (cl.size === totalDirt || !acted) break;
    }

    setShowResults(true);
    // FLL-006: Efficiency-based scoring — reward fewer steps
    const coverageBase = cl.size * 4;
    const stepsTaken = tr.length || 1;
    const efficiencyBonus = cl.size === totalDirt ? Math.max(0, Math.round((room.optimalSteps / stepsTaken) * 10)) : 0;
    const pts = coverageBase + efficiencyBonus;
    game.updateScore(pts);
    setRunning(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rules, room, roomIdx, game, totalDirt]);

  function nextRoom() {
    if (roomIdx < rooms.length - 1) {
      const next = roomIdx + 1;
      setRoomIdx(next);
      setCleaned(new Set());
      setVacPos([rooms[next].charger[0], rooms[next].charger[1]]);
      setVacDir(0);
      setStepCount(0);
      setShowResults(false);
      setTrail([]);
      game.advanceRound();
    } else {
      setPhase('complete');
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

  useEffect(() => {
    if (phase === 'play') {
      setGameSceneContent(
        <RobotVacuum3D room={room} vacPos={vacPos} vacDir={vacDir} cleaned={cleaned} trail={trail} gridSize={GRID} running={running} />
      );
    } else {
      setGameSceneContent(null);
    }
  }, [phase, room, vacPos, vacDir, cleaned, trail, running, setGameSceneContent]);

  return (
    <GameShell
      gameId="robot-vacuum"
      title="Robot Vacuum"
      worldNumber={5}
      worldColor="#10B981"
      xpReward={25}
      totalRounds={rooms.length}
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
                      {'\u{1F9F9}'}
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
                            className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 font-body text-2xs text-emerald-300"
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
                      aria-label="Learn the rules"
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
                      aria-label={learnIdx < LEARN_CARDS.length - 1 ? 'Next learn card' : 'Start cleaning'}
                    >
                      {learnIdx < LEARN_CARDS.length - 1
                        ? 'Next \u2192'
                        : 'Start Cleaning! \u{1F9F9}'}
                    </motion.button>
                    <button
                      onClick={() => setPhase('play')}
                      className="font-body text-xs text-white/50 hover:text-white/40"
                      aria-label="Skip tutorial"
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
                    <div className="flex items-center gap-3 mb-3 px-4">
                      <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                      <GameProgressTracker current={roomIdx + 1} total={rooms.length} labColor="#00FF88" />
                    </div>
                    {/* Room header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{room.emoji}</span>
                      <h3 className="font-display text-sm font-bold text-white flex-1">
                        {room.title}
                      </h3>
                      <span className="font-mono text-2xs text-white/50">
                        Room {roomIdx + 1}/{rooms.length}
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

                    {/* 3D renders in CockpitCanvas via sceneStore (D3D-B3) */}

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
                                    {'\u{1F9F9}'}
                                  </motion.span>
                                )}
                                {!isV && furn && <span>{furn.emoji}</span>}
                                {!isV && !furn && isDirt && !isCleaned && (
                                  <span className="text-2xs opacity-60">
                                    {'\u{1F7E4}'}
                                  </span>
                                )}
                                {!isV && !furn && isCleaned && (
                                  <motion.span
                                    className="text-2xs"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                  >
                                    {'\u2728'}
                                  </motion.span>
                                )}
                                {!isV && !furn && !isDirt && isCharger && (
                                  <span className="text-2xs">{'\u26A1'}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <p className="font-mono text-2xs text-white/50 text-center mt-1">
                          Steps: {stepCount}
                        </p>
                      </div>

                      {/* Rules panel */}
                      <div className="flex-1 flex flex-col min-w-0">
                        <p className="font-display text-2xs font-bold text-white/30 mb-1">
                          Rules (priority order):
                        </p>
                        <div className="flex-1 overflow-auto space-y-1">
                          {rules.map((rule, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.02]"
                            >
                              <span className="font-mono text-2xs text-white/50 w-3">
                                {i + 1}
                              </span>
                              <select
                                value={rule.condition}
                                onChange={(e) =>
                                  updateRule(i, 'condition', e.target.value)
                                }
                                className="flex-1 px-1 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/15 text-white font-body text-2xs"
                                aria-label={`Rule ${i + 1} condition`}
                              >
                                {CONDITIONS.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                              <span className="font-mono text-2xs text-white/50">
                                {'\u2192'}
                              </span>
                              <select
                                value={rule.action}
                                onChange={(e) =>
                                  updateRule(i, 'action', e.target.value)
                                }
                                className="flex-1 px-1 py-0.5 rounded bg-blue-500/10 border border-blue-500/15 text-white font-body text-2xs"
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
                                  aria-label={`Remove rule ${i + 1}`}
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
                            className="mt-1 w-full py-1 rounded-lg border border-dashed border-white/10 text-white/50 font-body text-2xs flex items-center justify-center gap-1"
                            aria-label="Add a new rule"
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
                              <p className="font-body text-2xs text-white/25">
                                Coverage
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="font-display text-lg font-black text-white">
                                {stepCount}
                              </p>
                              <p className="font-body text-2xs text-white/25">
                                Steps
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="font-display text-lg font-black text-blue-400">
                                {room.optimalSteps}
                              </p>
                              <p className="font-body text-2xs text-white/25">
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
                              <p className="font-body text-2xs text-white/25">
                                Efficiency
                              </p>
                            </div>
                          </div>
                          {ageBand === 'C' && (
                            <p className="font-body text-2xs text-white/25 mt-1 text-center">
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
                            className="mt-2 w-full py-1.5 rounded-lg border border-emerald-500/20 text-emerald-400/60 font-body text-2xs hover:bg-emerald-500/5 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1"
                            aria-label="Edit rules and retry"
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
                        aria-label="Reset room"
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
                          aria-label={running ? 'Simulation running' : 'Run vacuum simulation'}
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
                          aria-label={roomIdx < rooms.length - 1 ? 'Go to next room' : 'Complete the game'}
                        >
                          {roomIdx < rooms.length - 1
                            ? 'Next Room \u2192'
                            : 'Complete! \u{1F389}'}
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}

                {phase === 'complete' && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <motion.span className="text-6xl" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>🏆</motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">Robot Vacuum Complete!</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">You programmed an intelligent agent using IF/THEN rules to navigate rooms and clean efficiently — just like real robot vacuums use rule-based AI!</p>
                    <div className="rounded-xl px-6 py-3 bg-[#10B981]/10 border border-[#10B981]/20">
                      <p className="font-data text-2xl" style={{ color: '#10B981' }}>{game.score}</p>
                      <p className="font-body text-2xs text-white/30">Total Points</p>
                    </div>
                    <div className="mt-4 space-y-2 text-left max-w-sm">
                      <h3 className="font-display text-sm font-bold text-white/70">What You Learned:</h3>
                      <ul className="space-y-1 text-2xs font-body text-white/40">
                        <li>• Robot pathfinding uses rules to decide where to move next</li>
                        <li>• Rule priority order determines which action fires first</li>
                        <li>• Coverage optimization balances thoroughness with efficiency</li>
                      </ul>
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
