// ════════════════════════════════════════════════════
// TREAT TRAINER V2 — Lab 2 (Teaching AI)
// Reinforcement learning grid maze.
// Enhanced: chrome bezel, welcome phase, age-band explanations,
// visual reward sliders, learning progress chart, RL vocabulary.
// ════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useGameContent } from '@/hooks/useContent';
import { useSceneStore } from '@/stores/sceneStore';
import { Play, Dog } from 'lucide-react';

// 3D Environment (no SSR)
const TreatTrainerEnvironment = dynamic(
  () => import('@/components/3d/environments/TreatTrainerEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'play' | 'complete';

const SIZE = 7;
const WALLS: [number, number][] = [[1,1],[1,2],[2,4],[3,1],[3,3],[4,5],[5,2],[5,3]];
const START: [number, number] = [0, 0];
const GOAL: [number, number] = [6, 6];
const TOTAL_EPISODES = 10;

const isWall = (r: number, c: number) => WALLS.some(([wr, wc]) => wr === r && wc === c);

export function TreatTrainerGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('treat-trainer', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);

  // Initialize game store
  useEffect(() => { game.startGame("treat-trainer", TOTAL_EPISODES); }, []);

  const [phase, setPhase] = useState<Phase>('welcome');
  const [rewards, setRewards] = useState({ toward: 3, away: -2, wall: -5, goal: 10 });
  const [episode, setEpisode] = useState(0);
  const [path, setPath] = useState<[number, number][]>([]);
  const [robotPos, setRobotPos] = useState<[number, number]>(START);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    setGameSceneContent(<TreatTrainerEnvironment treatCount={episode} isTraining={phase === 'play'} />);
  }, [episode, phase, setGameSceneContent]);

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: (i * 37 + 13) % 100, y: (i * 53 + 7) % 100, size: (i % 3) + 1,
    delay: (i * 0.7) % 4, dur: (i % 6) + 4,
  })), []);

  const runEpisode = useCallback(async () => {
    setRunning(true);
    let pos: [number, number] = [...START];
    const trail: [number, number][] = [[...pos]];
    const visited = new Set<string>();
    let steps = 0;

    for (let s = 0; s < 50; s++) {
      steps++;
      const moves = ([[0,1],[0,-1],[1,0],[-1,0]] as [number, number][]).filter(([dr, dc]) => {
        const nr = pos[0] + dr, nc = pos[1] + dc;
        return nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && !isWall(nr, nc);
      });
      if (moves.length === 0) break;

      const scored = moves.map(([dr, dc]) => {
        const nr = pos[0] + dr, nc = pos[1] + dc;
        let sc = 0;
        const dB = Math.abs(pos[0] - GOAL[0]) + Math.abs(pos[1] - GOAL[1]);
        const dA = Math.abs(nr - GOAL[0]) + Math.abs(nc - GOAL[1]);
        sc += dA < dB ? rewards.toward : rewards.away;
        if (nr === GOAL[0] && nc === GOAL[1]) sc += rewards.goal;
        if (visited.has(`${nr},${nc}`)) sc -= 1;
        sc += (Math.random() - 0.5) * Math.max(1, 6 - episode);
        return { dr, dc, sc };
      });
      scored.sort((a, b) => b.sc - a.sc);

      pos = [pos[0] + scored[0].dr, pos[1] + scored[0].dc];
      visited.add(`${pos[0]},${pos[1]}`);
      trail.push([...pos]);
      setRobotPos([...pos]);
      setPath([...trail]);

      await new Promise(r => setTimeout(r, 100));
      if (pos[0] === GOAL[0] && pos[1] === GOAL[1]) break;
    }

    setHistory(prev => [...prev, steps]);
    setEpisode(e => e + 1);
    game.updateScore(5);
    game.advanceRound();
    setRunning(false);
    if (episode >= 9) { setPhase('complete'); game.completeGame(); }
  }, [rewards, episode, game]);

  return (
    <GameShell gameId="treat-trainer" title="Treat Trainer" worldNumber={2} worldColor="#8B5CF6" totalRounds={TOTAL_EPISODES}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(139,92,246,${0.15 + p.size * 0.06}), transparent)` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(139,92,246,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4">
              <AnimatePresence mode="wait">

                {/* WELCOME */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    <span className="text-5xl" role="img" aria-label="dog">&#x1F415;</span>
                    <h2 className="font-display text-2xl font-bold text-white">Treat Trainer</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C' ? "Tune the reward function to shape an agent's policy in a grid maze. Observe convergence over 10 episodes."
                        : 'Train a robot to find the treat! Adjust rewards to teach it the best path.'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Reinforcement Learning', 'Rewards', 'Training'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 font-body text-2xs text-purple-300">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      aria-label="Start training the robot">
                      Start Training! <Dog className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* PLAY */}
                {phase === 'play' && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
                    <p className="font-body text-xs text-white/40 text-center mb-2">
                      {ageBand === 'C' ? `Episode ${episode + 1}/10 — Tune the reward function and observe convergence.`
                        : `Episode ${episode + 1}/10 — Adjust rewards and run!`}
                    </p>

                    {/* Reward sliders */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {([
                        { key: 'toward' as const, label: ageBand === 'C' ? 'R(closer)' : 'Toward', color: '#10B981' },
                        { key: 'away' as const, label: ageBand === 'C' ? 'R(farther)' : 'Away', color: '#EF4444' },
                        { key: 'wall' as const, label: ageBand === 'C' ? 'R(wall)' : 'Hit wall', color: '#F59E0B' },
                        { key: 'goal' as const, label: ageBand === 'C' ? 'R(goal)' : 'Reach goal', color: '#8B5CF6' },
                      ]).map(({ key, label, color }) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="font-body text-2xs text-white/40 w-20 truncate">{label}</span>
                          <input type="range" min={-10} max={10} value={rewards[key]}
                            onChange={e => setRewards(r => ({ ...r, [key]: +e.target.value }))}
                            className="flex-1 h-1 accent-purple-500"
                            aria-label={`${label} reward`} />
                          <span className="font-mono text-2xs w-6 text-right" style={{ color }}>{rewards[key]}</span>
                        </div>
                      ))}
                    </div>

                    {/* Grid */}
                    <div className="flex-1 flex items-center justify-center">
                      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${SIZE}, 32px)` }}>
                        {Array.from({ length: SIZE * SIZE }).map((_, i) => {
                          const r = Math.floor(i / SIZE), c = i % SIZE;
                          const isR = robotPos[0] === r && robotPos[1] === c;
                          const isG = r === GOAL[0] && c === GOAL[1];
                          const isS = r === START[0] && c === START[1];
                          const isW = isWall(r, c);
                          const inP = path.some(([pr, pc]) => pr === r && pc === c);
                          return (
                            <div key={i} className={`w-[32px] h-[32px] rounded-sm flex items-center justify-center text-xs
                              ${isW ? 'bg-white/10' : isR ? 'bg-purple-500/30' : isG ? 'bg-green-500/20' : isS ? 'bg-blue-500/20' : inP ? 'bg-purple-500/10' : 'bg-white/[0.02]'}`}>
                              {isR ? '\u{1F916}' : isG ? '\u{1F9B4}' : isS ? '\u{1F3C1}' : isW ? '\u{1F9F1}' : inP ? <span className="text-2xs text-purple-400">{'\u2022'}</span> : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Steps chart */}
                    {history.length > 0 && (
                      <div className="mb-2">
                        <p className="font-body text-2xs text-white/20 mb-1">
                          {ageBand === 'C' ? 'Steps per episode (convergence)' : 'Steps taken'}
                        </p>
                        <div className="flex items-end gap-1 h-8 justify-center">
                          {history.map((s, i) => (
                            <motion.div key={i} className="w-3 bg-purple-500/50 rounded-t"
                              initial={{ height: 0 }} animate={{ height: `${Math.min(100, s * 2)}%` }}>
                              <span className="font-mono text-2xs text-white/20 block text-center">{s}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    <motion.button onClick={runEpisode} disabled={running || episode >= 10}
                      className="w-full py-3 rounded-xl font-display font-bold text-sm text-white flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      aria-label={running ? 'Episode is running' : `Run training episode ${episode + 1}`}>
                      <Play className="w-4 h-4" /> {running ? 'Running...' : `Run Episode ${episode + 1}`}
                    </motion.button>
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
                    <h2 className="font-display text-2xl font-bold text-white">Treat Trainer Complete!</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      You trained a robot agent across 10 episodes by tuning reward values, watching it learn to find the optimal path to the goal.
                    </p>
                    <div className="rounded-xl px-6 py-3 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20">
                      <p className="font-data text-2xl text-[#8B5CF6]">{game.score}</p>
                      <p className="font-body text-2xs text-white/30">Total Points</p>
                    </div>
                    <div className="mt-4 space-y-2 text-left max-w-sm">
                      <h3 className="font-display text-sm font-bold text-white/70">What You Learned:</h3>
                      <ul className="space-y-1 text-2xs font-body text-white/40">
                        <li>• Reinforcement learning uses rewards and penalties to teach AI agents how to behave</li>
                        <li>• Positive rewards encourage desired actions while negative rewards discourage bad ones</li>
                        <li>• Over many training episodes, the agent converges on better strategies — just like practice makes perfect</li>
                      </ul>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
