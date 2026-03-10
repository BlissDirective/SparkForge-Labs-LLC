// ════════════════════════════════════════════════════
// DATA DETECTIVE V2 — Lab 2 (Teaching AI) — FL-Lite
// Investigate datasets for patterns, anomalies, and bias.
// Enhanced: chrome bezel, welcome phase, age-band content,
// 3D magnifying glass on desktop, evidence card flips.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Search, AlertTriangle, CheckCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

const DataDetective3D = dynamic(
  () => import('@/components/3d/DataDetective3D'),
  { ssr: false }
);

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => { setM(window.innerWidth < 768); }, []);
  return m;
}

type Phase = 'welcome' | 'play' | 'complete';

interface DataCase {
  title: string;
  description: string;
  data: { label: string; value: number; flagged?: boolean }[];
  question: string;
  correctIndex: number;
  explanation: string;
  explanationKids: string;
}

const CASES: DataCase[] = [
  {
    title: 'Pet Popularity Survey',
    description: 'A school surveyed 100 students about their favorite pets. Examine the results.',
    data: [
      { label: 'Dogs', value: 45 },
      { label: 'Cats', value: 30 },
      { label: 'Fish', value: 12 },
      { label: 'Hamsters', value: 8 },
      { label: 'Dragons', value: 55, flagged: true },
    ],
    question: 'Which data point looks suspicious?',
    correctIndex: 4,
    explanation: 'Dragons got 55 votes in a 100-student survey — that\'s more than dogs, and dragons aren\'t real pets! This is an anomaly.',
    explanationKids: 'Dragons aren\'t real pets, and 55 is way too many votes! Something fishy is going on!',
  },
  {
    title: 'Weather Station Readings',
    description: 'Temperature readings from a weather station over one week in summer.',
    data: [
      { label: 'Mon', value: 28 },
      { label: 'Tue', value: 30 },
      { label: 'Wed', value: -40, flagged: true },
      { label: 'Thu', value: 27 },
      { label: 'Fri', value: 31 },
    ],
    question: 'Which reading is an outlier?',
    correctIndex: 2,
    explanation: 'Wednesday shows -40°C in summer — a sensor malfunction or data entry error. This outlier would skew any analysis.',
    explanationKids: '-40 degrees in summer?! That\'s way too cold — the sensor must have glitched!',
  },
  {
    title: 'App Downloads by Age',
    description: 'An AI app tracked downloads. Does anything seem unfair in the data?',
    data: [
      { label: 'Ages 10-15', value: 200 },
      { label: 'Ages 16-20', value: 850 },
      { label: 'Ages 21-30', value: 1200 },
      { label: 'Ages 31-40', value: 900 },
      { label: 'Ages 0-9', value: 0, flagged: true },
    ],
    question: 'Which group might indicate bias in the data?',
    correctIndex: 4,
    explanation: 'Zero downloads from ages 0-9 could mean the app wasn\'t available to young children — this is selection bias that could skew conclusions.',
    explanationKids: 'No kids under 10 tried the app at all! Maybe they weren\'t allowed to — that makes the data unfair.',
  },
  {
    title: 'Robot Speed Tests',
    description: 'Five robots raced across a room. Check the results carefully.',
    data: [
      { label: 'Bot-A', value: 12 },
      { label: 'Bot-B', value: 15 },
      { label: 'Bot-C', value: 11 },
      { label: 'Bot-D', value: 999, flagged: true },
      { label: 'Bot-E', value: 14 },
    ],
    question: 'Which result seems like a measurement error?',
    correctIndex: 3,
    explanation: 'Bot-D recorded 999 units — likely a default error value or buffer overflow. Real speed should be similar to other bots.',
    explanationKids: '999 is waaay faster than the others — that\'s probably a glitch, not a real speed!',
  },
  {
    title: 'Student Test Scores',
    description: 'An AI grading tool scored student essays. Review the pattern.',
    data: [
      { label: 'Student A', value: 82 },
      { label: 'Student B', value: 78 },
      { label: 'Student C', value: 85 },
      { label: 'Student D', value: 50, flagged: true },
      { label: 'Student E', value: 80 },
    ],
    question: 'Which score might need a human review?',
    correctIndex: 3,
    explanation: 'Student D scored significantly lower. While it could be genuine, outliers in AI grading should be human-reviewed to check for bias.',
    explanationKids: 'Student D got a much lower score. A teacher should double-check — maybe the AI made a mistake!',
  },
];

export function DataDetectiveGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const isMobile = useIsMobile();

  const [phase, setPhase] = useState<Phase>('welcome');
  const [caseIdx, setCaseIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [_investigating, setInvestigating] = useState(false);

  const currentCase = CASES[caseIdx];
  const maxBar = useMemo(() => Math.max(...currentCase.data.map(d => d.value)), [caseIdx]);

  const handleSelect = useCallback((idx: number) => {
    if (showResult) return;
    setSelected(idx);
    setInvestigating(true);

    setTimeout(() => {
      setInvestigating(false);
      setShowResult(true);

      if (idx === currentCase.correctIndex) {
        game.updateScore(20);
        game.advanceRound();
      }
    }, 800);
  }, [showResult, currentCase.correctIndex, game]);

  const handleNext = useCallback(() => {
    if (caseIdx < CASES.length - 1) {
      setCaseIdx(i => i + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setPhase('complete');
      game.completeGame();
    }
  }, [caseIdx, game]);

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: (i * 37 + 13) % 100, y: (i * 53 + 7) % 100, size: (i % 3) + 1,
    delay: (i * 0.7) % 4, dur: (i % 6) + 4,
  })), []);

  return (
    <GameShell gameId="data-detective" title="Data Detective" worldNumber={2} worldColor="#AA66FF" totalRounds={CASES.length}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(170,102,255,${0.15 + p.size * 0.06}), transparent)` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(170,102,255,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4 items-center justify-center">
              <AnimatePresence mode="wait">

                {/* WELCOME */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-4">
                    <span className="text-5xl" role="img" aria-label="magnifying glass">{'\u{1F50D}'}</span>
                    <h2 className="font-display text-2xl font-bold text-white">Data Detective</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? 'Analyze datasets for anomalies, outliers, and selection bias. Identify suspicious data points that could compromise ML model training.'
                        : ageBand === 'B'
                        ? 'Investigate data like a detective! Find the suspicious numbers hiding in each dataset.'
                        : 'Look at the numbers and find the one that doesn\'t belong! Be a data detective!'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Data Analysis', 'Anomaly Detection', 'Bias'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 font-body text-[10px] text-purple-300">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #AA66FF, #8844DD)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      aria-label="Start investigating">
                      Start Investigating! <Search className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* PLAY */}
                {phase === 'play' && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col w-full max-w-lg">
                    {/* 3D Scene */}
                    {!isMobile && (
                      <div className="h-32 mb-3 rounded-xl overflow-hidden">
                        <DataDetective3D
                          selectedRow={selected}
                          totalRows={currentCase.data.length}
                          fixedRows={new Set()}
                          deletedRows={new Set()}
                          lastFixedRow={showResult && selected === currentCase.correctIndex ? selected : null}
                          worldColor="#AA66FF"
                        />
                      </div>
                    )}

                    {/* Case header */}
                    <div className="rounded-xl p-3 mb-3 border border-purple-500/20 bg-purple-500/5 text-center">
                      <p className="font-display text-sm font-bold text-purple-400">{'\u{1F4CB}'} Case {caseIdx + 1}: {currentCase.title}</p>
                      <p className="font-body text-xs text-white/40 mt-1">{currentCase.description}</p>
                    </div>

                    {/* Data bars */}
                    <div className="space-y-2 mb-3">
                      {currentCase.data.map((d, i) => (
                        <motion.button key={i} onClick={() => handleSelect(i)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                            selected === i
                              ? showResult
                                ? i === currentCase.correctIndex
                                  ? 'border-green-500/40 bg-green-500/10'
                                  : 'border-red-500/40 bg-red-500/10'
                                : 'border-purple-500/40 bg-purple-500/10'
                              : 'border-white/5 bg-white/[0.02] hover:border-purple-500/20'
                          }`}
                          whileHover={{ scale: showResult ? 1 : 1.01 }}
                          whileTap={{ scale: showResult ? 1 : 0.99 }}
                          aria-label={`${d.label}: ${d.value}`}
                          disabled={showResult}>
                          <span className="font-body text-xs text-white/60 w-20 text-left">{d.label}</span>
                          <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div className="h-full rounded-full"
                              style={{ background: showResult && d.flagged ? 'linear-gradient(90deg, #EF4444, #F97316)' : 'linear-gradient(90deg, #AA66FF, #8844DD)' }}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (d.value / maxBar) * 100)}%` }}
                              transition={{ duration: 0.6, delay: i * 0.1 }} />
                          </div>
                          <span className="font-data text-xs text-white/40 w-10 text-right">{d.value}</span>
                          {showResult && d.flagged && <AlertTriangle className="w-4 h-4 text-orange-400" />}
                          {showResult && selected === i && i === currentCase.correctIndex && <CheckCircle className="w-4 h-4 text-green-400" />}
                        </motion.button>
                      ))}
                    </div>

                    {/* Question */}
                    <div className="rounded-xl p-3 mb-3 border border-purple-500/10 bg-white/[0.02] text-center">
                      <p className="font-display text-sm font-bold text-white">{'\u{1F914}'} {currentCase.question}</p>
                    </div>

                    {/* Result */}
                    <AnimatePresence>
                      {showResult && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className={`mb-3 rounded-xl p-3 border text-center ${
                            selected === currentCase.correctIndex
                              ? 'bg-green-500/10 border-green-500/20'
                              : 'bg-red-500/10 border-red-500/20'
                          }`}>
                          <p className="font-display text-sm font-bold mb-1" style={{ color: selected === currentCase.correctIndex ? '#4ADE80' : '#F87171' }}>
                            {selected === currentCase.correctIndex ? '\u2705 Correct!' : '\u274C Not quite!'}
                          </p>
                          <p className="font-body text-xs text-white/50">
                            {ageBand === 'A' ? currentCase.explanationKids : currentCase.explanation}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Next button */}
                    {showResult && (
                      <motion.button onClick={handleNext}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="w-full py-3 rounded-xl font-display font-bold text-sm text-white"
                        style={{ background: 'linear-gradient(135deg, #AA66FF, #8844DD)' }}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        aria-label={caseIdx < CASES.length - 1 ? 'Next case' : 'Complete'}>
                        {caseIdx < CASES.length - 1 ? 'Next Case \u2192' : 'Complete Investigation!'}
                      </motion.button>
                    )}
                  </motion.div>
                )}

                {/* COMPLETE */}
                {phase === 'complete' && (
                  <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4">
                    <span className="text-5xl">{'\u{1F3C6}'}</span>
                    <h2 className="font-display text-2xl font-bold text-white">Case Closed!</h2>
                    <p className="font-body text-sm text-white/50">
                      {ageBand === 'C'
                        ? 'Excellent analytical work! You\'ve demonstrated key data quality assessment skills.'
                        : 'Great detective work! You found all the suspicious data!'}
                    </p>
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
