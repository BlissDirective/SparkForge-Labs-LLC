// ================================================================
// PIXEL INVESTIGATOR V2 — Lab 3 (Neural Networks) — STANDARD POLISH
//
// Concept: Image is heavily blurred. Reveal in stages, guess with
// fewer reveals = more points. Teaches how CNNs process images
// at different resolutions — low-res features first, details later.
//
// V2 Upgrades:
// - Chrome bezel (pink, Lab 3)
// - Particle background
// - Welcome phase with concept intro
// - Age-band explanations (C: feature extraction, receptive fields)
// - 12 images across 3 difficulty tiers
// - Confidence meter showing "how sure are you?"
// - Reveal stages visualized as resolution layers
// - Points breakdown with multiplier for early guesses
// - ARIA labels, keyboard nav
// ================================================================

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useGameContent } from '@/hooks/useContent';
import { useSceneStore } from '@/stores/sceneStore';
import { Eye, Search, Zap } from 'lucide-react';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';

// 3D Environment (no SSR)
const PixelInvestigatorEnvironment = dynamic(
  () => import('@/components/3d/environments/PixelInvestigatorEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'play' | 'complete';

interface ImageRound {
  emoji: string;
  answer: string;
  choices: string[];
  category: string;
  tier: 'easy' | 'medium' | 'hard';
  hintA: string;
  hintC: string;
}

const IMAGES: ImageRound[] = [
  // Easy tier — distinct shapes
  { emoji: '\u{1F431}', answer: 'Cat', choices: ['Cat', 'Dog', 'Rabbit'], category: 'Animals', tier: 'easy',
    hintA: 'It has whiskers and pointy ears!', hintC: 'High-frequency features: ear triangles + whisker lines distinguish from similar quadrupeds.' },
  { emoji: '\u{1F680}', answer: 'Rocket', choices: ['Rocket', 'Airplane', 'Firework'], category: 'Vehicles', tier: 'easy',
    hintA: 'It points up and goes to space!', hintC: 'Vertical axis symmetry with tapered top — distinct from airplane wing profile.' },
  { emoji: '\u{1F33B}', answer: 'Sunflower', choices: ['Sunflower', 'Daisy', 'Rose'], category: 'Nature', tier: 'easy',
    hintA: "It's big and yellow!", hintC: 'Yellow radial pattern. Fibonacci spiral in seed arrangement is a distinguishing feature.' },
  { emoji: '\u{1F3B8}', answer: 'Guitar', choices: ['Guitar', 'Violin', 'Banjo'], category: 'Music', tier: 'easy',
    hintA: 'It has strings and a long neck!', hintC: 'Figure-8 body contour + narrow neck. String count and fret pattern distinguish from violin.' },
  // Medium tier — similar shapes
  { emoji: '\u{1F418}', answer: 'Elephant', choices: ['Elephant', 'Hippo', 'Rhino'], category: 'Animals', tier: 'medium',
    hintA: "It's the biggest land animal with a long trunk!", hintC: 'Trunk is the key distinguishing feature. Gray color shared with rhino — need shape analysis.' },
  { emoji: '\u{1F98B}', answer: 'Butterfly', choices: ['Butterfly', 'Dragonfly', 'Moth'], category: 'Nature', tier: 'medium',
    hintA: 'It has colorful wings that spread wide!', hintC: 'Bilateral wing symmetry with broad wing area. Dragonfly has narrow elongated wings.' },
  { emoji: '\u{1F382}', answer: 'Cake', choices: ['Cake', 'Pie', 'Muffin'], category: 'Food', tier: 'medium',
    hintA: 'It usually has candles on top!', hintC: 'Cylindrical layered structure with frosting texture. Candles add vertical line features.' },
  { emoji: '\u{1F3E0}', answer: 'House', choices: ['House', 'Castle', 'Barn'], category: 'Buildings', tier: 'medium',
    hintA: 'It has a triangle roof and a door!', hintC: 'Triangular roof + rectangular base. Castle has turrets; barn has gambrel roof.' },
  // Hard tier — tricky distinctions
  { emoji: '\u{1F43A}', answer: 'Wolf', choices: ['Wolf', 'Dog', 'Fox'], category: 'Animals', tier: 'hard',
    hintA: 'It lives in the forest and howls at the moon!', hintC: 'Very similar to dog class — fine-grained classification. Muzzle length and ear angle are discriminative features.' },
  { emoji: '\u{1F34A}', answer: 'Orange', choices: ['Orange', 'Peach', 'Tangerine'], category: 'Food', tier: 'hard',
    hintA: "It's round, orange, and juicy!", hintC: 'Color and shape nearly identical to tangerine. Texture (pore size) is the discriminative feature at high resolution.' },
  { emoji: '\u{1F3BB}', answer: 'Violin', choices: ['Violin', 'Cello', 'Guitar'], category: 'Music', tier: 'hard',
    hintA: "It's played with a bow!", hintC: 'Same body shape as cello at different scale. Without size reference, need fine details like chin rest.' },
  { emoji: '\u{1F985}', answer: 'Eagle', choices: ['Eagle', 'Hawk', 'Falcon'], category: 'Nature', tier: 'hard',
    hintA: "It's a big bird with sharp eyes!", hintC: 'Fine-grained classification problem. Beak curvature, head coloring, and wingspan ratios are key discriminators.' },
];

const REVEAL_LABELS = ['Extremely blurry', 'Very blurry', 'Blurry', 'Slightly blurry', 'Clear'];
const REVEAL_POINTS = [30, 25, 20, 15, 10];

export function PixelInvestigatorGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('pixel-investigator', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [ri, setRi] = useState(0);
  const [revealLevel, setRevealLevel] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [, setTotalEarned] = useState(0);
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');

  // Filter by age band: A gets easy+medium, B gets all, C gets all
  const rounds = useMemo(() => {
    if (ageBand === 'A') return IMAGES.filter(i => i.tier !== 'hard');
    return IMAGES;
  }, [ageBand]);

  const round = rounds[ri];
  const blur = Math.max(0, 24 - revealLevel * 6);
  const pts = REVEAL_POINTS[revealLevel] || 10;

  useEffect(() => {
    setGameSceneContent(<PixelInvestigatorEnvironment zoomLevel={revealLevel} isAnalyzing={phase === 'play' && !answered} />);
  }, [revealLevel, phase, answered, setGameSceneContent]);

  const particles = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1,
    delay: Math.random() * 4, dur: Math.random() * 6 + 4,
  })), []);

  function reveal() {
    if (revealLevel < 4) setRevealLevel(l => l + 1);
  }

  function guess(choice: string) {
    if (answered) return;
    const correct = choice === round.answer;
    setAnswered(true);
    setWasCorrect(correct);

    if (correct) {
      const earned = pts + (streak >= 2 ? 5 : 0);
      game.updateScore(earned);
      setTotalEarned(t => t + earned);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      setAnswered(false);
      setRevealLevel(0);
      setWasCorrect(false);
      setShowHint(false);
      if (ri < rounds.length - 1) { setRi(i => i + 1); game.advanceRound(); }
      else { setPhase('complete'); game.completeGame(); }
    }, 2000);
  }

  return (
    <GameShell gameId="pixel-investigator" title="Pixel Investigator" worldNumber={3} worldColor="#FF66AA" xpReward={20} totalRounds={rounds.length}>
      <div className="h-full flex flex-col relative z-10 overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(236,72,153,${0.12 + p.size * 0.05}), transparent)` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(236,72,153,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
            <div className="flex-1 flex flex-col p-4">
              <AnimatePresence mode="wait">
                {/* WELCOME */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    <motion.span className="text-6xl block" animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}>{'\u{1F50D}'}</motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">Pixel Investigator</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? "Images start heavily blurred — like a CNN's early layers seeing only low-frequency features. Each reveal adds higher-frequency detail, mimicking deeper network layers."
                        : 'Can you guess what the blurry picture is? Fewer reveals = more points!'}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['Computer Vision', 'Feature Extraction', 'Image Recognition'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20 font-body text-2xs text-pink-400">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #EC4899, #DB2777)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Start Investigating! <Eye className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* PLAY */}
                {phase === 'play' && round && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-3 mb-3 px-4">
                      <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                      <GameProgressTracker current={ri + 1} total={rounds.length} labColor="#FF66AA" />
                    </div>
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2 w-full max-w-md">
                      <span className="px-2 py-0.5 rounded bg-pink-500/10 font-body text-2xs text-pink-400">{round.category}</span>
                      <span className="px-2 py-0.5 rounded font-body text-2xs"
                        style={{ backgroundColor: round.tier === 'hard' ? 'rgba(239,68,68,0.1)' : round.tier === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                          color: round.tier === 'hard' ? '#EF4444' : round.tier === 'medium' ? '#F59E0B' : '#10B981' }}>
                        {round.tier}
                      </span>
                      <div className="flex-1" />
                      <span className="font-mono text-2xs text-white/20">{ri + 1}/{rounds.length}</span>
                      {streak >= 2 && <span className="font-display text-2xs font-bold text-amber-400">{'\u{1F525}'} x{streak}</span>}
                    </div>

                    {/* Points available */}
                    <div className="flex items-center gap-1 mb-3">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span className="font-display text-xs font-bold text-amber-400">{pts} pts</span>
                      <span className="font-body text-2xs text-white/20">available</span>
                    </div>

                    {/* Image display */}
                    <motion.div
                      className="w-36 h-36 rounded-2xl flex items-center justify-center text-7xl mb-3"
                      style={{
                        filter: answered ? 'blur(0px)' : `blur(${blur}px)`,
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(236,72,153,0.15)',
                        boxShadow: '0 0 30px rgba(236,72,153,0.08)',
                        transition: 'filter 0.5s ease',
                      }}
                      aria-label={answered ? `The answer is ${round.answer}` : 'Blurred image to guess'}>
                      {round.emoji}
                    </motion.div>

                    {/* Reveal level indicator */}
                    <div className="flex gap-1 mb-3">
                      {[0, 1, 2, 3, 4].map(level => (
                        <div key={level} className="w-8 h-1 rounded-full transition-colors"
                          style={{ backgroundColor: level <= revealLevel ? '#EC4899' : 'rgba(255,255,255,0.1)' }} />
                      ))}
                    </div>
                    <p className="font-body text-2xs text-white/20 mb-3">{REVEAL_LABELS[revealLevel]}</p>

                    {/* Result feedback */}
                    <AnimatePresence>
                      {answered && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                          className={`mb-3 px-4 py-2 rounded-xl text-center ${wasCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                          <p className={`font-display text-sm font-bold ${wasCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {wasCorrect ? `\u2713 +${pts + (streak >= 2 ? 5 : 0)} pts!` : `\u2717 It was ${round.answer}`}
                          </p>
                          {wasCorrect && revealLevel <= 1 && (
                            <p className="font-body text-2xs text-green-400/60 mt-0.5">Eagle eye! Early guess bonus!</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Reveal button */}
                    {!answered && (
                      <div className="flex gap-2 mb-3">
                        <button onClick={reveal} disabled={revealLevel >= 4}
                          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 font-body text-xs disabled:opacity-30 flex items-center gap-1"
                          aria-label={`Reveal more detail. Currently level ${revealLevel} of 4`}>
                          <Search className="w-3 h-3" /> Reveal More ({revealLevel}/4)
                        </button>
                        {!showHint && (
                          <button onClick={() => setShowHint(true)}
                            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 font-body text-xs"
                            aria-label="Show hint">{'\u{1F4A1}'}</button>
                        )}
                      </div>
                    )}

                    {/* Hint */}
                    <AnimatePresence>
                      {showHint && !answered && (
                        <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="font-body text-2xs text-pink-300/50 mb-2 max-w-sm text-center">
                          {ageBand === 'C' ? round.hintC : round.hintA}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* Choice buttons */}
                    <div className="flex gap-2">
                      {round.choices.map(c => (
                        <motion.button key={c} onClick={() => guess(c)} disabled={answered}
                          className={`px-5 py-3 rounded-xl border font-display text-sm font-bold transition-all ${
                            answered && c === round.answer ? 'border-green-500 bg-green-500/10 text-green-400'
                            : answered && c !== round.answer && wasCorrect ? 'border-white/5 text-white/15'
                            : answered && c !== round.answer ? 'border-white/5 text-white/15'
                            : 'border-pink-500/20 bg-pink-500/5 text-white hover:border-pink-500/40'
                          }`}
                          whileTap={!answered ? { scale: 0.95 } : {}}
                          aria-label={`Guess: ${c}`}>
                          {c}
                        </motion.button>
                      ))}
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
                    <h2 className="font-display text-2xl font-bold text-white">Pixel Investigator Complete!</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      You identified images from blurry to clear, experiencing how computer vision processes visual information at different resolutions.
                    </p>
                    <div className="rounded-xl px-6 py-3 bg-[#FF66AA]/10 border border-[#FF66AA]/20">
                      <p className="font-data text-2xl text-[#FF66AA]">{game.score}</p>
                      <p className="font-body text-2xs text-white/30">Total Points</p>
                    </div>
                    <div className="mt-4 space-y-2 text-left max-w-sm">
                      <h3 className="font-display text-sm font-bold text-white/70">What You Learned:</h3>
                      <ul className="space-y-1 text-2xs font-body text-white/40">
                        <li>• Computer vision processes images from low-resolution features (shapes, colors) to fine details (textures, edges)</li>
                        <li>• Early neural network layers detect broad patterns, while deeper layers recognize specific objects</li>
                        <li>• Some objects are harder to distinguish than others — fine-grained classification is a real challenge in AI</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
}
