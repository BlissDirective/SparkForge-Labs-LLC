// ════════════════════════════════════════════════════
// AI ART DETECTIVE V2 — Lab 4 (AI That Creates)
// Side-by-side: human vs AI art. Guess which is which.
// Enhanced: chrome bezel, welcome phase, art analysis tips,
// confidence meter, streak scoring, age-band clues.
//
// ENH: Zoom lens hover + tip highlights + animated slider + detective badge
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useGameContent } from '@/hooks/useContent';
import { useSceneStore } from '@/stores/sceneStore';
import { Palette, Eye } from 'lucide-react';
import { useSafeTimeout } from '@/hooks/useSafeTimeout';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';

// 3D Environment (no SSR)
const AiArtDetectiveEnvironment = dynamic(
  () => import('@/components/3d/environments/AiArtDetectiveEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'tips' | 'play' | 'complete';

interface ArtRound {
  leftGradient: string;
  rightGradient: string;
  aiSide: 'left' | 'right';
  clue: string;
  clueC: string;
  leftShapes: { x: number; y: number; size: number; type: 'circle' | 'square'; opacity: number }[];
  rightShapes: { x: number; y: number; size: number; type: 'circle' | 'square'; opacity: number }[];
}

const ROUNDS: ArtRound[] = [
  {
    leftGradient: 'from-rose-600 via-purple-500 to-blue-500',
    rightGradient: 'from-amber-400 via-orange-500 to-red-600',
    aiSide: 'left',
    clue: 'AI art often has smoother, more "perfect" gradients!',
    clueC: 'AI-generated gradients use mathematical interpolation, producing unnaturally smooth transitions.',
    leftShapes: [
      { x: 30, y: 25, size: 40, type: 'circle', opacity: 0.2 },
      { x: 60, y: 55, size: 25, type: 'square', opacity: 0.15 },
    ],
    rightShapes: [
      { x: 25, y: 40, size: 35, type: 'circle', opacity: 0.25 },
      { x: 70, y: 30, size: 20, type: 'square', opacity: 0.18 },
    ],
  },
  {
    leftGradient: 'from-green-400 to-cyan-500',
    rightGradient: 'from-indigo-600 via-purple-600 to-pink-500',
    aiSide: 'right',
    clue: 'AI sometimes creates symmetry that looks too perfect.',
    clueC: 'Generative models trained on centered compositions often produce bilaterally symmetric outputs.',
    leftShapes: [{ x: 40, y: 35, size: 30, type: 'circle', opacity: 0.3 }],
    rightShapes: [
      { x: 50, y: 50, size: 45, type: 'circle', opacity: 0.15 },
      { x: 50, y: 50, size: 30, type: 'square', opacity: 0.1 },
    ],
  },
  {
    leftGradient: 'from-yellow-300 via-green-400 to-blue-600',
    rightGradient: 'from-gray-400 via-slate-500 to-gray-700',
    aiSide: 'left',
    clue: 'AI art can be "too perfect" \u2014 no accidental brushstrokes!',
    clueC: 'Neural networks optimize for aesthetic objectives, eliminating stochastic artifacts present in physical media.',
    leftShapes: [
      { x: 30, y: 60, size: 28, type: 'square', opacity: 0.12 },
      { x: 65, y: 30, size: 22, type: 'circle', opacity: 0.2 },
    ],
    rightShapes: [{ x: 45, y: 45, size: 50, type: 'circle', opacity: 0.1 }],
  },
  {
    leftGradient: 'from-fuchsia-500 to-cyan-400',
    rightGradient: 'from-red-500 via-yellow-400 to-green-500',
    aiSide: 'right',
    clue: 'Check for repeated patterns \u2014 AI loves consistency!',
    clueC: 'Convolutional layers in generative models can produce spatially repeated features.',
    leftShapes: [{ x: 55, y: 40, size: 35, type: 'circle', opacity: 0.2 }],
    rightShapes: [
      { x: 33, y: 33, size: 20, type: 'square', opacity: 0.15 },
      { x: 66, y: 66, size: 20, type: 'square', opacity: 0.15 },
    ],
  },
  {
    leftGradient: 'from-emerald-400 via-teal-500 to-blue-600',
    rightGradient: 'from-violet-500 via-purple-600 to-indigo-700',
    aiSide: 'left',
    clue: 'AI blends colors in mathematically smooth ways.',
    clueC: 'Diffusion models generate images by denoising in latent space, producing mathematically smooth color transitions.',
    leftShapes: [
      { x: 40, y: 30, size: 25, type: 'circle', opacity: 0.2 },
      { x: 60, y: 65, size: 30, type: 'circle', opacity: 0.15 },
    ],
    rightShapes: [{ x: 35, y: 55, size: 40, type: 'square', opacity: 0.1 }],
  },
  {
    leftGradient: 'from-orange-400 via-red-500 to-pink-600',
    rightGradient: 'from-blue-400 via-indigo-500 to-purple-600',
    aiSide: 'right',
    clue: 'Human art has more textural variation.',
    clueC: 'Physical media introduces stochastic texture variation absent in pixel-perfect generated outputs.',
    leftShapes: [{ x: 50, y: 50, size: 30, type: 'circle', opacity: 0.25 }],
    rightShapes: [
      { x: 25, y: 25, size: 18, type: 'circle', opacity: 0.2 },
      { x: 75, y: 75, size: 18, type: 'circle', opacity: 0.2 },
    ],
  },
  {
    leftGradient: 'from-lime-400 to-emerald-600',
    rightGradient: 'from-rose-400 via-pink-500 to-fuchsia-600',
    aiSide: 'right',
    clue: 'AI can struggle with fine details like text or fingers.',
    clueC: 'Generative models have difficulty with structured details due to limited spatial reasoning in latent representations.',
    leftShapes: [
      { x: 45, y: 40, size: 35, type: 'square', opacity: 0.12 },
      { x: 55, y: 60, size: 20, type: 'circle', opacity: 0.18 },
    ],
    rightShapes: [{ x: 50, y: 50, size: 45, type: 'circle', opacity: 0.15 }],
  },
  {
    leftGradient: 'from-cyan-300 via-blue-500 to-indigo-700',
    rightGradient: 'from-amber-300 via-yellow-400 to-orange-500',
    aiSide: 'left',
    clue: 'Does it seem too polished? That might be the AI!',
    clueC: 'Over-optimization toward aesthetic loss functions produces an "uncanny valley" of artistic perfection.',
    leftShapes: [{ x: 35, y: 30, size: 30, type: 'circle', opacity: 0.2 }],
    rightShapes: [
      { x: 30, y: 40, size: 22, type: 'square', opacity: 0.15 },
      { x: 65, y: 55, size: 28, type: 'circle', opacity: 0.18 },
    ],
  },
  {
    leftGradient: 'from-sky-400 via-cyan-500 to-teal-600',
    rightGradient: 'from-pink-400 via-rose-500 to-red-600',
    aiSide: 'right',
    clue: 'AI-generated images sometimes have "impossible" reflections.',
    clueC: 'Generative models lack physical simulation, producing reflections inconsistent with scene geometry.',
    leftShapes: [
      { x: 40, y: 35, size: 32, type: 'circle', opacity: 0.18 },
      { x: 60, y: 65, size: 32, type: 'circle', opacity: 0.18 },
    ],
    rightShapes: [{ x: 50, y: 45, size: 40, type: 'circle', opacity: 0.2 }],
  },
  {
    leftGradient: 'from-purple-400 via-fuchsia-500 to-pink-500',
    rightGradient: 'from-green-400 via-emerald-500 to-teal-600',
    aiSide: 'left',
    clue: 'The best detectives look at overall "feel" \u2014 trust your instincts!',
    clueC: 'Human perception integrates multiple visual cues holistically \u2014 leverage gestalt processing for detection.',
    leftShapes: [{ x: 45, y: 50, size: 35, type: 'square', opacity: 0.12 }],
    rightShapes: [
      { x: 35, y: 35, size: 25, type: 'circle', opacity: 0.2 },
      { x: 65, y: 65, size: 25, type: 'circle', opacity: 0.2 },
    ],
  },
];

const DETECTION_TIPS = [
  { title: 'Symmetry Check', emoji: '\uD83D\uDD04', tip: 'AI art tends to be more symmetrical. Human art usually has natural asymmetry and imperfections.' },
  { title: 'Texture Test', emoji: '\uD83D\uDD8C\uFE0F', tip: 'Look for brushstrokes or texture. AI images are often unnaturally smooth and even.' },
  { title: 'Gradient Analysis', emoji: '\uD83C\uDF08', tip: 'AI blends colors mathematically \u2014 too perfectly smooth gradients are a giveaway.' },
  { title: 'Detail Inspection', emoji: '\uD83D\uDD0D', tip: 'Zoom into edges and fine details. AI struggles with text, fingers, and complex structures.' },
];

export function AiArtDetectiveGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('ai-art-detective', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges
  const [phase, setPhase] = useState<Phase>('welcome');
  const [roundIdx, setRoundIdx] = useState(0);
  const [showResult, setShowResult] = useState<'correct' | 'wrong' | null>(null);
  const [streak, setStreak] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  // ENH: Detective badge earned after 3+ correct
  const [showDetectiveBadge, setShowDetectiveBadge] = useState(false);
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const { safeTimeout } = useSafeTimeout();

  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);

  const round = ROUNDS[roundIdx];
  const confidencePct = roundIdx > 0 ? Math.round((correctCount / roundIdx) * 100) : 0;
  const confidenceColor = confidencePct >= 70 ? '#00FF88' : confidencePct >= 40 ? '#FFAA44' : '#FF6644';

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: ((i * 37 + 13) % 100),
    y: ((i * 53 + 7) % 100),
    size: (i % 3) + 1,
    delay: (i * 0.33) % 4,
    dur: (i % 6) + 4,
  })), []);

  useEffect(() => {
    setGameSceneContent(<AiArtDetectiveEnvironment artworksAnalyzed={roundIdx} isDetecting={phase === 'play' && !showResult} />);
    return () => setGameSceneContent(null);
  }, [roundIdx, phase, showResult, setGameSceneContent]);

  function handleGuess(side: 'left' | 'right') {
    if (showResult) return;
    const correct = side === round.aiSide;
    setShowResult(correct ? 'correct' : 'wrong');
    if (correct) {
      setStreak(s => s + 1);
      const newCount = correctCount + 1;
      setCorrectCount(newCount);
      game.updateScore(12 + streak * 2);
      // ENH: Award detective badge after 3 correct detections
      if (newCount === 3) { setShowDetectiveBadge(true); safeTimeout(() => setShowDetectiveBadge(false), 2500); }
    } else {
      setStreak(0);
      game.updateScore(3);
    }
    safeTimeout(() => {
      setShowResult(null);
      if (roundIdx < ROUNDS.length - 1) {
        setRoundIdx(i => i + 1);
        game.advanceRound();
      } else {
        setPhase('complete');
        game.completeGame();
      }
    }, 3500);
  }

  return (
    <GameShell gameId="ai-art-detective" title="AI Art Detective" worldNumber={4} worldColor="#FFAA44" totalRounds={ROUNDS.length}>
      <div className="h-full flex flex-col relative z-10 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: `radial-gradient(circle, rgba(255,170,68,${0.15 + p.size * 0.06}), rgba(0,0,0,0))`,
              }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }}
            />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div
            className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(255,170,68,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />
            <div className="flex-1 flex flex-col overflow-auto p-4 items-center justify-center">
              <AnimatePresence mode="wait">
                {phase === 'welcome' && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-4"
                  >
                    <span className="text-5xl">{'\uD83C\uDFA8'}</span>
                    <h2 className="font-display text-2xl font-bold text-white" aria-label="AI Art Detective welcome screen">AI Art Detective</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      Can you tell which artwork was made by AI? Study the styles and spot the machine!
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Generative AI', 'Art Analysis', 'Pattern Recognition'].map(t => (
                        <span
                          key={t}
                          className="px-2 py-1 rounded-lg bg-orange-400/10 border border-orange-400/20 text-orange-400 font-body text-2xs"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <motion.button
                      onClick={() => setPhase('tips')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #FFAA44, #DD8822)' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      aria-label="Learn detection tips before playing"
                    >
                      Learn Detection Tips! <Eye className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {phase === 'tips' && (
                  <motion.div
                    key="tips"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-4 max-w-sm"
                  >
                    <Palette className="w-6 h-6 text-orange-400 mx-auto" />
                    <h3 className="font-display text-lg font-bold text-white">Detection Tips</h3>
                    <p className="font-body text-xs text-white/40">
                      {tipIdx + 1} of {DETECTION_TIPS.length}
                    </p>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={tipIdx}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="rounded-xl p-4 border border-orange-400/20 bg-orange-400/5 relative overflow-hidden"
                      >
                        {/* ENH: Pulsing highlight on tip card */}
                        <motion.div
                          className="absolute inset-0 rounded-xl pointer-events-none"
                          animate={{ boxShadow: ['inset 0 0 0px rgba(255,170,68,0)', 'inset 0 0 20px rgba(255,170,68,0.15)', 'inset 0 0 0px rgba(255,170,68,0)'] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span className="text-3xl">{DETECTION_TIPS[tipIdx].emoji}</span>
                        <h4 className="font-display text-sm font-bold text-orange-300 mt-2">
                          {DETECTION_TIPS[tipIdx].title}
                        </h4>
                        <p className="font-body text-xs text-white/50 mt-1">
                          {DETECTION_TIPS[tipIdx].tip}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                    <motion.button
                      onClick={() => {
                        if (tipIdx < DETECTION_TIPS.length - 1) setTipIdx(i => i + 1);
                        else setPhase('play');
                      }}
                      className="w-full py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #FFAA44, #DD8822)' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      aria-label={tipIdx < DETECTION_TIPS.length - 1 ? `Next tip, ${tipIdx + 2} of ${DETECTION_TIPS.length}` : 'Start the gallery'}
                    >
                      {tipIdx < DETECTION_TIPS.length - 1 ? 'Next Tip \u2192' : 'Start the Gallery!'}
                    </motion.button>
                    <button
                      onClick={() => setPhase('play')}
                      className="font-body text-xs text-white/20 hover:text-white/40"
                      aria-label="Skip tips and start playing"
                    >
                      Skip tips {'\u2192'}
                    </button>
                  </motion.div>
                )}

                {phase === 'play' && round && (
                  <motion.div
                    key="play"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full max-w-lg mx-auto"
                  >
                    <div className="flex items-center gap-3 mb-3 px-4">
                      <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                      <GameProgressTracker current={roundIdx + 1} total={ROUNDS.length} labColor="#FFAA44" />
                    </div>
                    {/* Confidence meter */}
                    {roundIdx > 0 && (
                      <div className="mb-3 max-w-xs mx-auto" role="status" aria-label={`Detection confidence: ${confidencePct}%`}>
                        <div className="flex justify-between mb-1">
                          <span className="font-body text-2xs text-white/30">Detection Confidence</span>
                          <span className="font-data text-2xs font-bold" style={{ color: confidenceColor }}>{confidencePct}%</span>
                        </div>
                        {/* ENH: Animated confidence slider with spring physics + thumb indicator */}
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden relative">
                          <motion.div className="h-full rounded-full" style={{ backgroundColor: confidenceColor }}
                            animate={{ width: `${confidencePct}%` }} transition={{ type: 'spring', stiffness: 80, damping: 14 }} />
                          <motion.div
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2"
                            style={{ backgroundColor: confidenceColor, borderColor: 'rgba(255,255,255,0.3)' }}
                            animate={{ left: `${Math.max(confidencePct - 2, 0)}%` }}
                            transition={{ type: 'spring', stiffness: 80, damping: 14 }}
                          />
                        </div>
                      </div>
                    )}
                    {streak >= 3 && (
                      <p className="font-display text-xs text-orange-400 mb-2" role="status" aria-label={`${streak} streak, score multiplier active`}>
                        {streak} streak! Score multiplier active!
                      </p>
                    )}
                    <p className="font-body text-sm text-white/50 mb-3">
                      Which one was made by AI? Round {roundIdx + 1}/{ROUNDS.length}
                    </p>

                    {/* ENH: Detective badge animation overlay */}
                    <AnimatePresence>
                      {showDetectiveBadge && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                        >
                          <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-6 py-4 text-center border border-orange-400/30">
                            <motion.span className="text-4xl block" animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.6, repeat: 2 }}>{'\uD83D\uDD75\uFE0F'}</motion.span>
                            <p className="font-display text-sm font-bold text-orange-300 mt-1">Detective Badge Earned!</p>
                            <p className="font-body text-2xs text-white/40">3 correct detections</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex gap-3 mb-4">
                      {(['left', 'right'] as const).map(side => (
                        <motion.button
                          key={side}
                          onClick={() => handleGuess(side)}
                          className={`flex-1 aspect-square rounded-2xl bg-gradient-to-br ${
                            side === 'left' ? round.leftGradient : round.rightGradient
                          } relative overflow-hidden border-2 ${
                            showResult && side === round.aiSide
                              ? 'border-green-500'
                              : showResult
                                ? 'border-white/10'
                                : 'border-white/20 hover:border-orange-400/50'
                          }`}
                          style={
                            // ENH: Green overlay flash on correct detection
                            showResult === 'correct' && side === round.aiSide
                              ? { boxShadow: '0 0 25px rgba(74, 222, 128, 0.4)' }
                              : {}
                          }
                          // ENH: Zoom lens hover effect — scale 1.05 with shadow lift
                          whileHover={!showResult ? { scale: 1.05, boxShadow: '0 8px 30px rgba(0,0,0,0.4)' } : {}}
                          whileTap={!showResult ? { scale: 0.97 } : {}}
                          aria-label={`Select ${side} artwork as AI-generated, round ${roundIdx + 1} of ${ROUNDS.length}`}
                        >
                          <div className="absolute inset-0">
                            {(side === 'left' ? round.leftShapes : round.rightShapes).map((s, i) => (
                              <div
                                key={i}
                                className="absolute"
                                style={{
                                  left: `${s.x}%`,
                                  top: `${s.y}%`,
                                  width: s.size,
                                  height: s.size,
                                  transform: s.type === 'square' ? 'translate(-50%,-50%) rotate(45deg)' : 'translate(-50%,-50%)',
                                  borderRadius: s.type === 'circle' ? '50%' : '4px',
                                  backgroundColor: `rgba(255,255,255,${s.opacity})`,
                                }}
                              />
                            ))}
                          </div>
                          {showResult && side === round.aiSide && (
                            <motion.div
                              className="absolute inset-0 flex items-center justify-center bg-black/30"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <span className="text-3xl">{'\uD83E\uDD16'}</span>
                            </motion.div>
                          )}
                          <div className="absolute bottom-2 left-0 right-0 text-center">
                            <span className="px-2 py-0.5 rounded bg-black/30 font-display text-2xs text-white/70">
                              {side === 'left' ? 'A' : 'B'}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    <AnimatePresence>
                      {showResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`rounded-xl p-3 max-w-sm mx-auto ${
                            showResult === 'correct'
                              ? 'bg-green-500/10 border border-green-500/30'
                              : 'bg-red-500/10 border border-red-500/30'
                          }`}
                        >
                          <p
                            className="font-display text-sm font-bold"
                            style={{ color: showResult === 'correct' ? '#4ade80' : '#f87171' }}
                          >
                            {showResult === 'correct' ? 'Great eye!' : 'Tricky one!'}
                          </p>
                          <p className="font-body text-xs text-white/50 mt-1">
                            {ageBand === 'C' ? round.clueC : round.clue}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                    <h2 className="font-display text-2xl font-bold text-white" aria-label="AI Art Detective game complete">AI Art Detective Complete!</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">You trained your eye to distinguish AI-generated art from human creations — a crucial skill in the age of generative AI.</p>
                    <div className="rounded-xl px-6 py-3 bg-[#FFAA44]/10 border border-[#FFAA44]/20" role="status" aria-label={`Total score: ${game.score} points`}>
                      <p className="font-data text-2xl" style={{ color: '#FFAA44' }}>{game.score}</p>
                      <p className="font-body text-2xs text-white/30">Total Points</p>
                    </div>
                    <div className="mt-4 space-y-2 text-left max-w-sm">
                      <h3 className="font-display text-sm font-bold text-white/70">What You Learned:</h3>
                      <ul className="space-y-1 text-2xs font-body text-white/40">
                        <li>• AI-generated art often has unnaturally smooth gradients and perfect symmetry</li>
                        <li>• Style analysis clues like texture, brushstrokes, and imperfections help identify human art</li>
                        <li>• Verifying art provenance is becoming essential as generative AI improves</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
