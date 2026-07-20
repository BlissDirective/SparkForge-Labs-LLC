'use client';

// ════════════════════════════════════════════════════════════════
// CORE IGNITION — game #43 (Forge F8, Concept 10 Part 12)
// ════════════════════════════════════════════════════════════════
// "Race the data stream. Forge the prompt. Break the wall."
//
// Auto-runner on a molten 3-lane data stream. Reaching a gate enters
// OVERCLOCK — time stops (no timer, ever) while the child forges a
// prompt; quality = break-through power + speed multiplier. Skill is
// quality, not typing speed (band A safe by design).
//
// Phases: welcome → learn (3 cards) → play (run) → complete.
// DOM/CSS only (invariant 0.1.2). Reduced-motion: the run becomes a
// stepped gate-to-gate journey — fully playable, nothing lost.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, ChevronUp, ChevronDown, Flame } from 'lucide-react';
import { ForgePanel, ForgeButton, MoltenProgress, HoloChip, SparkBurst } from '@/components/forge';
import { ForgeSparkCore } from '@/components/sparky/ForgeSparkCore';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useActiveChild } from '@/hooks/useChildren';
import { useGameActions } from '@/stores/gameStore';
import { drawScenarios } from './core-ignition/content';
import { scoreGate } from './core-ignition/scoring';
import { PromptForge } from './core-ignition/PromptForge';
import { GATE_META } from '@/types/coreIgnition';
import type { CoreIgnitionBand, GateResult, GateScenario } from '@/types/coreIgnition';
import type { GateInput } from './core-ignition/scoring';

type Phase = 'welcome' | 'learn' | 'play' | 'complete';
type RunState = 'running' | 'overclock' | 'feedback' | 'sprint';

const GATES_PER_BAND: Record<CoreIgnitionBand, number> = { A: 6, B: 7, C: 8 };
const SEGMENT_MS = 9000;
const MOTES_PER_SEGMENT = 3;
const MOTE_CAP = 20;

const LEARN_CARDS = [
  {
    icon: '⚒️',
    title: 'Prompts are instructions you forge',
    body: 'A great prompt says WHO should help, WHAT to do, and the KEY DETAIL that matters. Weak prompts bounce off. Strong prompts break through.',
  },
  {
    icon: '🧱',
    title: 'Walls stop weak prompts',
    body: 'Vague Fog, Bias Walls, Context Canyons, Hallucination Gaps, Token Overload — each wall stops a different kind of weak prompt. Your job: supply the missing ingredient.',
  },
  {
    icon: '⏸️',
    title: 'Overclock = time stops while YOU think',
    body: 'When you hit a wall, the run freezes. No timer. No rush. Forge the best prompt you can, then STRIKE. Between walls, switch lanes to catch data motes!',
  },
] as const;

export default function CoreIgnitionGame() {
  const reducedMotion = useReducedMotion();
  const band = (useActiveChild()?.age_band as CoreIgnitionBand) || 'B';
  const game = useGameActions();

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIndex, setLearnIndex] = useState(0);

  // ── Run state ──
  const gateCount = GATES_PER_BAND[band];
  const [scenarios, setScenarios] = useState<GateScenario[]>([]);
  const [gateIndex, setGateIndex] = useState(0);
  const [runState, setRunState] = useState<RunState>('running');
  const [results, setResults] = useState<GateResult[]>([]);
  const [lastResult, setLastResult] = useState<GateResult | null>(null);
  const [lane, setLane] = useState(1); // 0..2
  const [motes, setMotes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [burst, setBurst] = useState(0);
  const [liveMotes, setLiveMotes] = useState<Array<{ id: number; lane: number }>>([]);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const laneRef = useRef(lane);
  laneRef.current = lane;

  const overclockStreak = streak >= 2;
  const gatePoints = results.reduce((s, r) => s + r.points, 0);
  const maxScore = gateCount * 10 + (reducedMotion ? 0 : MOTE_CAP);
  const score = gatePoints + motes;

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  // ── Start the run ──
  const startRun = useCallback(() => {
    const seed = band.charCodeAt(0) + new Date().getDate();
    setScenarios(drawScenarios(band, gateCount, seed));
    setGateIndex(0);
    setResults([]);
    setMotes(0);
    setStreak(0);
    setPhase('play');
    setRunState(reducedMotion ? 'overclock' : 'running');
    game.startGame?.('core-ignition', gateCount);
    game.setMaxScore?.(gateCount * 10 + (reducedMotion ? 0 : MOTE_CAP));
  }, [band, gateCount, reducedMotion, game]);

  // ── Segment: schedule motes then the gate ──
  useEffect(() => {
    if (phase !== 'play' || runState !== 'running' || reducedMotion) return;
    clearTimers();
    // Deterministic-ish mote lanes from gateIndex.
    for (let m = 0; m < MOTES_PER_SEGMENT; m++) {
      const eta = 1500 + m * 2200;
      const moteLane = (gateIndex + m * 2) % 3;
      const id = gateIndex * 10 + m;
      timers.current.push(
        setTimeout(() => setLiveMotes((lm) => [...lm, { id, lane: moteLane }]), eta - 1400)
      );
      timers.current.push(
        setTimeout(() => {
          setLiveMotes((lm) => lm.filter((x) => x.id !== id));
          if (laneRef.current === moteLane) {
            setMotes((c) => Math.min(MOTE_CAP, c + (overclockStreakRef.current ? 2 : 1)));
            setBurst((b) => b + 1);
          }
        }, eta)
      );
    }
    timers.current.push(setTimeout(() => setRunState('overclock'), SEGMENT_MS));
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, runState, gateIndex, reducedMotion]);

  const overclockStreakRef = useRef(false);
  overclockStreakRef.current = overclockStreak;

  // ── Gate forged ──
  const handleForge = useCallback(
    (input: GateInput) => {
      const scenario = scenarios[gateIndex];
      if (!scenario) return;
      const result = scoreGate(input, scenario);
      setResults((r) => [...r, result]);
      setLastResult(result);
      setStreak((s) => (result.points >= 8 ? s + 1 : result.points < 5 ? 0 : s));
      game.updateScore?.(result.points);
      setRunState('feedback');
    },
    [scenarios, gateIndex, game]
  );

  // ── Continue after feedback ──
  const continueRun = useCallback(() => {
    const next = gateIndex + 1;
    game.advanceRound?.();
    if (next >= gateCount) {
      setRunState('sprint');
      const t = setTimeout(() => {
        setPhase('complete');
      }, reducedMotion ? 300 : 4200);
      timers.current.push(t);
    } else {
      setGateIndex(next);
      setRunState(reducedMotion ? 'overclock' : 'running');
    }
  }, [gateIndex, gateCount, reducedMotion, game]);

  // ── Completion → store ──
  const completedRef = useRef(false);
  useEffect(() => {
    if (phase !== 'complete' || completedRef.current) return;
    completedRef.current = true;
    const pct = score / maxScore;
    const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : pct >= 0.3 ? 1 : 0;
    game.awardXP?.(Math.round(pct * 50));
    game.completeGame?.('core-ignition', stars);
  }, [phase, score, maxScore, game]);

  // ── Keyboard lanes ──
  useEffect(() => {
    if (phase !== 'play' || runState !== 'running') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') setLane((l) => Math.max(0, l - 1));
      if (e.key === 'ArrowDown') setLane((l) => Math.min(2, l + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, runState]);

  const scenario = scenarios[gateIndex];
  const meta = scenario ? GATE_META[scenario.gateType] : null;

  // ════════════════ RENDER ════════════════
  return (
    <div className="relative p-4 md:p-6" style={{ minHeight: 500, color: 'rgb(var(--sf-text-primary) / 1)' }}>
      {/* ambient particles (game template requirement: 12-15 lab-colored) */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        {!reducedMotion &&
          Array.from({ length: 13 }, (_, i) => (
            <span
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                left: `${(i * 7.3) % 100}%`,
                bottom: 0,
                backgroundColor: i % 3 === 0 ? 'rgb(var(--sf-secondary) / 0.6)' : 'rgb(var(--sf-primary) / 0.6)',
                ['--ember-travel' as string]: '60vh',
                ['--ember-opacity' as string]: 0.5,
                ['--ember-sway' as string]: `${((i % 5) - 2) * 10}px`,
                animation: `forge-ember-rise ${8 + (i % 5)}s linear ${i * 0.9}s infinite`,
                opacity: 0,
              }}
            />
          ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ═══ WELCOME ═══ */}
        {phase === 'welcome' && (
          <motion.div
            key="welcome"
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative text-center space-y-6 py-8"
          >
            <ForgeSparkCore expression="excited" size="xl" />
            <div>
              <h1 className="text-3xl font-extrabold font-display" style={{ textShadow: 'var(--glow-text, none)' }}>
                CORE IGNITION
              </h1>
              <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: 'rgb(var(--sf-text-secondary) / 1)' }}>
                Race the data stream. Forge prompts in mid-run to break through the
                walls that stop weak prompts cold.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <HoloChip tone="amber">{gateCount} gates</HoloChip>
              <HoloChip tone="cyan">Band {band}</HoloChip>
              <HoloChip tone="green">No timers in Overclock</HoloChip>
            </div>
            <ForgeButton variant="molten" size="lg" onClick={() => setPhase('learn')} aria-label="Start Core Ignition">
              <Play className="w-5 h-5" /> IGNITE
            </ForgeButton>
          </motion.div>
        )}

        {/* ═══ LEARN ═══ */}
        {phase === 'learn' && (
          <motion.div
            key="learn"
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative max-w-lg mx-auto space-y-5 py-6"
          >
            <ForgePanel variant="glass" as="div" className="p-6 text-center space-y-3">
              <span className="text-4xl" aria-hidden="true">{LEARN_CARDS[learnIndex].icon}</span>
              <h2 className="text-xl font-bold font-display">{LEARN_CARDS[learnIndex].title}</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'rgb(var(--sf-text-secondary) / 1)' }}>
                {LEARN_CARDS[learnIndex].body}
              </p>
            </ForgePanel>
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5" aria-label={`Card ${learnIndex + 1} of 3`}>
                {LEARN_CARDS.map((_, i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: i === learnIndex ? 'rgb(var(--sf-primary) / 1)' : 'rgb(var(--sf-border) / 1)' }}
                  />
                ))}
              </div>
              {learnIndex < 2 ? (
                <ForgeButton variant="alloy" onClick={() => setLearnIndex((i) => i + 1)}>Next</ForgeButton>
              ) : (
                <ForgeButton variant="molten" onClick={startRun}>Start the run!</ForgeButton>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══ PLAY ═══ */}
        {phase === 'play' && (
          <motion.div key="play" initial={false} animate={{ opacity: 1 }} className="relative space-y-4">
            {/* HUD */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <HoloChip tone="amber">Gate {Math.min(gateIndex + 1, gateCount)}/{gateCount}</HoloChip>
                {!reducedMotion && <HoloChip tone="cyan">✦ {motes} motes</HoloChip>}
                {overclockStreak && (
                  <HoloChip tone="green"><Flame className="w-3 h-3" /> OVERCLOCK ×2</HoloChip>
                )}
              </div>
              <span className="text-sm font-bold tabular-nums" style={{ fontFamily: 'var(--font-mono)', color: 'rgb(var(--sf-primary-light) / 1)' }}>
                {score} pts
              </span>
            </div>
            <MoltenProgress value={gateIndex / gateCount} height={6} label="Run progress" />

            {/* ── TRACK (running) ── */}
            {runState === 'running' && !reducedMotion && (
              <div
                className="relative rounded-2xl overflow-hidden border"
                style={{ borderColor: 'rgb(var(--sf-border) / 1)', height: 260, perspective: 900 }}
                role="application"
                aria-label="Data stream — use up and down arrows or the lane buttons to catch motes"
              >
                {/* parallax skyline */}
                <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1/3" style={{ background: 'linear-gradient(180deg, rgb(var(--sf-surface-alt)), transparent)' }} />
                {/* lanes */}
                <div className="absolute inset-x-0 bottom-0 top-8">
                  {[0, 1, 2].map((l) => (
                    <div
                      key={l}
                      className="absolute inset-x-0"
                      style={{ top: `${l * 33}%`, height: '30%' }}
                    >
                      <div
                        className="absolute inset-x-0 top-1/2 h-1 forge-molten-fill forge-anim"
                        style={{ opacity: lane === l ? 0.9 : 0.3 }}
                        aria-hidden="true"
                      />
                      {/* motes in this lane */}
                      {liveMotes.filter((m) => m.lane === l).map((m) => (
                        <span
                          key={m.id}
                          aria-hidden="true"
                          className="absolute top-1/2 -mt-1.5 w-3 h-3 rounded-full"
                          style={{
                            background: 'radial-gradient(circle, rgb(var(--sf-primary-light)), rgb(var(--sf-primary) / 0.4))',
                            boxShadow: '0 0 8px rgb(var(--sf-primary) / 0.8)',
                            animation: 'forge-mote-travel 1.4s linear forwards',
                          }}
                        />
                      ))}
                    </div>
                  ))}
                  {/* avatar */}
                  <div
                    className="absolute left-[12%] w-14 transition-[top] duration-200"
                    style={{ top: `calc(${lane * 33}% - 8px)` }}
                  >
                    <ForgeSparkCore expression={overclockStreak ? 'excited' : 'happy'} size="sm" showAura={false} />
                    <SparkBurst fire={burst} count={8} />
                  </div>
                </div>
                {/* lane buttons (touch) */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                  <ForgeButton variant="alloy" size="sm" sparks={false} onClick={() => setLane((l) => Math.max(0, l - 1))} aria-label="Move up a lane">
                    <ChevronUp className="w-5 h-5" />
                  </ForgeButton>
                  <ForgeButton variant="alloy" size="sm" sparks={false} onClick={() => setLane((l) => Math.min(2, l + 1))} aria-label="Move down a lane">
                    <ChevronDown className="w-5 h-5" />
                  </ForgeButton>
                </div>
                {/* approaching gate */}
                {meta && (
                  <div aria-hidden="true" className="absolute right-0 inset-y-8 w-16 flex items-center justify-center text-4xl opacity-60">
                    {meta.icon}
                  </div>
                )}
              </div>
            )}

            {/* ── OVERCLOCK (gate) ── */}
            {(runState === 'overclock' || runState === 'feedback') && scenario && meta && (
              <ForgePanel variant="glass" glow="active" as="div" className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">{meta.icon}</span>
                  <div>
                    <h2 className="font-display font-bold text-lg">{meta.name}</h2>
                    <p className="text-xs" style={{ color: 'rgb(var(--sf-secondary) / 1)', fontFamily: 'var(--font-mono)' }}>
                      ⏸ OVERCLOCK — time is stopped. No rush.
                    </p>
                  </div>
                </div>
                <p className="text-sm" style={{ color: 'rgb(var(--sf-text-secondary) / 1)' }}>{scenario.setup}</p>
                <p className="text-sm font-semibold">{scenario.goal}</p>

                {runState === 'overclock' ? (
                  <PromptForge band={band} scenario={scenario} onForge={handleForge} />
                ) : (
                  lastResult && (
                    <div className="space-y-4" aria-live="polite">
                      <div className="flex items-center gap-3">
                        <span
                          className="text-2xl font-bold tabular-nums"
                          style={{ fontFamily: 'var(--font-mono)', color: lastResult.points >= 8 ? 'rgb(var(--sf-accent-green) / 1)' : 'rgb(var(--sf-primary-light) / 1)' }}
                        >
                          +{lastResult.points}
                        </span>
                        <ForgeSparkCore expression={lastResult.points >= 8 ? 'celebrating' : lastResult.points >= 5 ? 'happy' : 'sad'} size="sm" showAura={false} />
                      </div>
                      <p className="text-sm">{lastResult.feedback}</p>
                      {band === 'C' && scenario.exemplar && lastResult.points < 8 && (
                        <p className="text-xs italic" style={{ color: 'rgb(var(--sf-text-muted) / 1)' }}>
                          Master smith&apos;s example: &ldquo;{scenario.exemplar}&rdquo;
                        </p>
                      )}
                      <ForgeButton variant="molten" className="w-full" onClick={continueRun}>
                        {gateIndex + 1 >= gateCount ? '🔥 Ignition Sprint!' : 'Back to the stream →'}
                      </ForgeButton>
                    </div>
                  )
                )}
              </ForgePanel>
            )}

            {/* ── SPRINT ── */}
            {runState === 'sprint' && (
              <div className="text-center py-10 space-y-4" aria-label="Ignition sprint — run complete">
                <motion.div
                  animate={reducedMotion ? {} : { x: [0, 40, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.2, repeat: reducedMotion ? 0 : 3 }}
                  className="inline-block"
                >
                  <ForgeSparkCore expression="celebrating" size="lg" />
                </motion.div>
                <p className="font-display text-xl font-bold" style={{ textShadow: 'var(--glow-text, none)' }}>
                  IGNITION SPRINT!
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ COMPLETE ═══ */}
        {phase === 'complete' && (
          <motion.div
            key="complete"
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative max-w-lg mx-auto text-center space-y-5 py-6"
          >
            <ForgeSparkCore expression="celebrating" size="lg" />
            <h2 className="text-2xl font-extrabold font-display" style={{ textShadow: 'var(--glow-text, none)' }}>
              Run Complete!
            </h2>
            <p className="text-lg font-bold tabular-nums" style={{ fontFamily: 'var(--font-mono)', color: 'rgb(var(--sf-primary-light) / 1)' }}>
              {score} / {maxScore} pts
            </p>
            {/* Pedagogy recap — do not skip (plan §12.7) */}
            <ForgePanel variant="alloy" as="div" className="p-4 text-left space-y-2">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wide">You forged:</h3>
              <ul className="space-y-1 text-sm" style={{ color: 'rgb(var(--sf-text-secondary) / 1)' }}>
                {results.map((r) => (
                  <li key={r.scenarioId} className="flex items-center gap-2">
                    <span aria-hidden="true">{GATE_META[r.gateType].icon}</span>
                    <span>
                      {GATE_META[r.gateType].name}: {r.points}/10
                      {r.ingredients.length > 0 && ` — supplied ${r.ingredients.join(', ')}`}
                    </span>
                  </li>
                ))}
              </ul>
            </ForgePanel>
            <ForgeButton
              variant="molten"
              size="lg"
              onClick={() => {
                completedRef.current = false;
                setPhase('welcome');
                setLearnIndex(0);
              }}
            >
              Forge another run
            </ForgeButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
