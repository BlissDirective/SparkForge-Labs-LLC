// ================================================================
// FOOL THE AI V2 — Lab 7 (Computer Vision) — STANDARD POLISH
//
// Concept: See items with AI labels and confidence scores.
// Identify wrong labels, low-confidence predictions, and correct ones.
// Teaches about AI confidence, misclassification, and adversarial examples.
//
// V2 Upgrades:
// - Chrome bezel (cyan, Lab 7)
// - Particle background
// - Welcome phase with concept intro
// - Age-band explanations (C: softmax confidence, adversarial examples)
// - 28 items with richer explanations
// - Animated confidence bar with color coding
// - 4 challenge rounds (up from 3)
// - Feedback panel with "why AI got confused" explanations
// - Score multiplier for consecutive correct finds
// - ARIA labels
//
// ENH: Animated confidence bar + answer feedback + fooled counter
// ================================================================

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useGameContent } from '@/hooks/useContent';
import { AlertTriangle, CheckCircle2, Target } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';
import { useSafeTimeout } from '@/hooks/useSafeTimeout';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';

// 3D Environment (no SSR)
const FoolTheAiEnvironment = dynamic(
  () => import('@/components/3d/environments/FoolTheAiEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'learn' | 'play' | 'complete';

interface Item {
  emoji: string;
  aiLabel: string;
  confidence: number;
  isWrong: boolean;
  explanation: string;
  explanationC: string;
}

interface Challenge {
  text: string;
  type: 'wrong' | 'lowconf' | 'correct' | 'highconf';
  target: number;
  check: (item: Item) => boolean;
  descC: string;
}

const LEARN_CARDS = [
  { title: 'How AI Classifies', emoji: '🏷️', desc: 'AI image classifiers look at pictures and try to identify what\'s in them. They assign labels like "dog", "car", or "pizza" with a confidence score.' },
  { title: 'Confidence Scores', emoji: '📊', desc: 'When AI classifies an image, it gives a confidence percentage. 95% means it\'s very sure. 30% means it\'s just guessing!' },
  { title: 'When AI Gets Fooled', emoji: '🃏', desc: 'Sometimes AI gets confused by unusual angles, lighting, or objects that look similar. Finding these mistakes helps researchers make AI better!' },
];

const ITEMS: Item[] = [
  { emoji: '\u{1F34E}', aiLabel: 'Apple', confidence: 95, isWrong: false,
    explanation: 'AI is confident and correct!',
    explanationC: 'Softmax output: 0.95 for "apple" class. High confidence, correct prediction.' },
  { emoji: '\u{1F33D}', aiLabel: 'Banana', confidence: 42, isWrong: true,
    explanation: "That's corn, not a banana! The yellow color confused the AI.",
    explanationC: 'Color-channel bias: yellow hue triggered banana activation. Low confidence (0.42) reflects model uncertainty.' },
  { emoji: '\u{1F415}', aiLabel: 'Dog', confidence: 88, isWrong: false,
    explanation: 'High confidence, correct label.',
    explanationC: 'Strong feature match across multiple convolutional filters. Confidence 0.88 indicates reliable classification.' },
  { emoji: '\u{1F408}', aiLabel: 'Small tiger', confidence: 35, isWrong: true,
    explanation: "It's a cat! The stripes confused the AI.",
    explanationC: 'Feature overlap between cat and tiger classes. The model lacks fine-grained scale awareness. Confidence 0.35.' },
  { emoji: '\u{1F319}', aiLabel: 'Moon', confidence: 91, isWrong: false,
    explanation: 'Clear and confident — correct!',
    explanationC: 'Crescent shape is highly distinctive. Few confusable classes \u2192 concentrated softmax distribution.' },
  { emoji: '\u{1F355}', aiLabel: 'Triangle', confidence: 28, isWrong: true,
    explanation: "It's pizza! AI only saw the shape, not the food.",
    explanationC: 'Shape-dominant classification without texture analysis. The model prioritized geometric features over material properties.' },
  { emoji: '\u{1F3B8}', aiLabel: 'Guitar', confidence: 82, isWrong: false,
    explanation: 'Solid prediction, well done AI.',
    explanationC: 'Distinctive body contour + neck structure. High inter-class distance from other string instruments.' },
  { emoji: '\u{1F9E6}', aiLabel: 'Sleeping bag', confidence: 31, isWrong: true,
    explanation: 'Those are socks! AI confused the shape.',
    explanationC: 'Elongated cloth texture matched sleeping bag training examples. Scale ambiguity in single-image classification.' },
  { emoji: '\u{1F308}', aiLabel: 'Rainbow', confidence: 94, isWrong: false,
    explanation: 'Easy one for the AI — high confidence.',
    explanationC: 'Multi-color arc is a unique signature. No confusable class in ImageNet. Confidence 0.94.' },
  { emoji: '\u{1F991}', aiLabel: 'Spider', confidence: 38, isWrong: true,
    explanation: "It's a squid! Too many tentacles confused the AI.",
    explanationC: 'Tentacle count overlap with arachnid class. The model confuses multi-limbed organisms without body-plan analysis.' },
  { emoji: '\u{1F3C0}', aiLabel: 'Basketball', confidence: 90, isWrong: false,
    explanation: 'AI recognized the orange sphere pattern.',
    explanationC: 'Texture + color + shape alignment. Seam line pattern is a learned discriminative feature. Confidence 0.90.' },
  { emoji: '\u{1F9F2}', aiLabel: 'Horseshoe', confidence: 44, isWrong: true,
    explanation: "It's a magnet! Similar U-shape fooled the AI.",
    explanationC: 'U-shaped contour activated horseshoe class. Without color/material analysis, shape alone causes misclassification.' },
  { emoji: '\u{1F3B9}', aiLabel: 'Piano', confidence: 86, isWrong: false,
    explanation: 'Black and white key pattern recognized correctly.',
    explanationC: 'Alternating black/white bar pattern is highly distinctive. Correct classification with confidence 0.86.' },
  { emoji: '\u{1F95D}', aiLabel: 'Coconut', confidence: 40, isWrong: true,
    explanation: "It's a kiwi! The fuzzy brown exterior confused the AI.",
    explanationC: 'Texture confusion: both have rough brown exterior. Cross-section would disambiguate but single-view limits accuracy.' },
  // ── Expansion batch (14 items) ──────────────────────
  { emoji: '\u{1F98A}', aiLabel: 'Dog', confidence: 68, isWrong: true,
    explanation: 'AI confused a fox with a dog \u2014 they look similar!',
    explanationC: 'Foxes share morphological features with canids. The model\'s training data likely has more dog images, biasing classification toward the more common class.' },
  { emoji: '\u{1F345}', aiLabel: 'Tomato', confidence: 89, isWrong: false,
    explanation: 'AI got it right! Tomatoes are easy to identify.',
    explanationC: 'Distinctive color + shape gives high confidence. Round red objects cluster tightly in the model\'s learned feature space.' },
  { emoji: '\u{1F319}', aiLabel: 'Banana', confidence: 31, isWrong: true,
    explanation: 'AI thought the moon was a banana because of the crescent shape!',
    explanationC: 'Shape-based feature matching without context: crescent shapes have high cosine similarity to banana representations in the embedding space.' },
  { emoji: '\u{1F3B8}', aiLabel: 'Guitar', confidence: 94, isWrong: false,
    explanation: 'Very confident and correct! The shape is distinctive.',
    explanationC: 'Musical instruments have unique silhouettes with low inter-class similarity, enabling high-confidence classification.' },
  { emoji: '\u{1F98E}', aiLabel: 'Snake', confidence: 45, isWrong: true,
    explanation: 'A lizard isn\'t a snake! The AI missed the legs.',
    explanationC: 'Reptile subclasses share texture and color features. The model\'s attention mechanism may focus on scales over limb presence.' },
  { emoji: '\u{1F9CA}', aiLabel: 'Ice Cube', confidence: 82, isWrong: false,
    explanation: 'Correct! The translucent cube shape is clear.',
    explanationC: 'Geometric regularity + transparency cues provide strong classification signal for crystalline objects.' },
  { emoji: '\u{1F3AD}', aiLabel: 'Sunglasses', confidence: 28, isWrong: true,
    explanation: 'Theater masks aren\'t sunglasses! AI was confused by the face shape.',
    explanationC: 'Face-adjacent objects trigger facial feature detectors. The model partially activates eyewear classifiers due to the eye-region overlap.' },
  { emoji: '\u{1F9A2}', aiLabel: 'Swan', confidence: 91, isWrong: false,
    explanation: 'AI is very confident \u2014 swans have a very unique look!',
    explanationC: 'Long curved neck + white body create a near-unique feature combination in bird classification with minimal confusion pairs.' },
  { emoji: '\u{1F33A}', aiLabel: 'Pizza', confidence: 22, isWrong: true,
    explanation: 'A flower isn\'t pizza! The AI saw the circular shape and got confused.',
    explanationC: 'Radial symmetry triggers circular object classifiers. Without color/texture discrimination, round objects have higher confusion rates.' },
  { emoji: '\u{1F3AA}', aiLabel: 'Tent', confidence: 73, isWrong: false,
    explanation: 'Close enough! A circus tent is still a tent.',
    explanationC: 'Hierarchical classification: circus tent is a subclass of tent. The model correctly identifies the superclass even if the specific variant isn\'t in training data.' },
  { emoji: '\u{1F991}', aiLabel: 'Octopus', confidence: 55, isWrong: true,
    explanation: 'A squid has 10 arms, an octopus has 8 \u2014 AI can\'t count tentacles!',
    explanationC: 'Fine-grained classification failure: squid and octopus share the cephalopod body plan. Tentacle counting requires spatial reasoning beyond standard CNNs.' },
  { emoji: '\u{1F3D4}\uFE0F', aiLabel: 'Mountain', confidence: 97, isWrong: false,
    explanation: 'AI is extremely confident \u2014 mountains are unmistakable!',
    explanationC: 'Landscape features have high variance but mountains have distinctive triangular profiles that are well-represented in training data.' },
  { emoji: '\u{1F9F2}', aiLabel: 'Horseshoe', confidence: 41, isWrong: true,
    explanation: 'A magnet isn\'t a horseshoe! Same shape but very different use.',
    explanationC: 'U-shaped objects cluster together in feature space. Without material/context cues, shape-based classification produces systematic errors.' },
  { emoji: '\u{1F99C}', aiLabel: 'Parrot', confidence: 88, isWrong: false,
    explanation: 'Correct! The colorful feathers make parrots easy to spot.',
    explanationC: 'Polychromatic plumage creates a distinctive multi-channel feature signature that separates parrots from other bird species with high accuracy.' },
];

const CHALLENGES: Challenge[] = [
  { text: 'Find 3 WRONG labels!', type: 'wrong', target: 3,
    check: (item) => item.isWrong,
    descC: 'Identify misclassified items where the predicted label \u2260 ground truth.' },
  { text: 'Find 3 items with confidence below 50%!', type: 'lowconf', target: 3,
    check: (item) => item.confidence < 50,
    descC: 'Find predictions where softmax max probability < 0.50 — indicating model uncertainty.' },
  { text: 'Find 4 correctly labeled items!', type: 'correct', target: 4,
    check: (item) => !item.isWrong,
    descC: 'Identify true positives: items where predicted class matches ground truth.' },
  { text: 'Find 3 items with confidence above 85%!', type: 'highconf', target: 3,
    check: (item) => item.confidence > 85,
    descC: 'High-confidence predictions (>0.85). Are they all correct? Explore overconfidence bias.' },
];

export function FoolTheAiGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('fool-the-ai', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const [ci, setCi] = useState(0);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<{ idx: number; hit: boolean } | null>(null);
  const [consecutiveHits, setConsecutiveHits] = useState(0);
  // ENH: Track total fooled count for animated counter
  const [fooledCount, setFooledCount] = useState(0);
  // ENH: Track streak for visual streak indicator
  const [streakFlash, setStreakFlash] = useState(false);
  const { safeTimeout } = useSafeTimeout();

  const challenge = CHALLENGES[ci];
  const matchCount = Array.from(found).filter(idx => challenge.check(ITEMS[idx])).length;

  const particles = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1,
    delay: Math.random() * 4, dur: Math.random() * 6 + 4,
  })), []);

  useEffect(() => {
    setGameSceneContent(<FoolTheAiEnvironment foolAttempts={found.size} isTesting={!!feedback} />);
    return () => setGameSceneContent(null);
  }, [found.size, feedback, setGameSceneContent]);

  function tap(idx: number) {
    if (found.has(idx) || feedback) return;
    const item = ITEMS[idx];
    const hit = challenge.check(item);
    setFound(prev => new Set(prev).add(idx));
    setFeedback({ idx, hit });

    if (hit) {
      const bonus = consecutiveHits >= 2 ? 4 : 0;
      game.updateScore(10 + bonus);
      setConsecutiveHits(c => c + 1);
      // ENH: Increment fooled counter when AI was wrong and player found it
      if (item.isWrong) setFooledCount(c => c + 1);
      // ENH: Flash streak indicator on consecutive hits
      if (consecutiveHits >= 1) { setStreakFlash(true); safeTimeout(() => setStreakFlash(false), 600); }
    } else {
      setConsecutiveHits(0);
    }

    safeTimeout(() => {
      setFeedback(null);
      const newMatch = matchCount + (hit ? 1 : 0);
      if (newMatch >= challenge.target) {
        if (ci < CHALLENGES.length - 1) {
          setCi(i => i + 1);
          setFound(new Set());
          setConsecutiveHits(0);
          game.advanceRound();
        } else {
          setPhase('complete');
          game.completeGame();
        }
      }
    }, 2200);
  }

  return (
    <GameShell gameId="fool-the-ai" title="Fool the AI" worldNumber={7} worldColor="#06B6D4" xpReward={20} totalRounds={CHALLENGES.length}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(6,182,212,${0.12 + p.size * 0.05}), transparent)` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(6,182,212,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <div className="flex-1 flex flex-col p-4 overflow-auto">
              <AnimatePresence mode="wait">
                {/* WELCOME */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    <motion.span className="text-6xl block" animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}>{'\u{1F916}'}</motion.span>
                    <h2 className="font-display text-2xl font-bold text-white" aria-label="Fool the AI welcome screen">Fool the AI</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? 'Examine AI classification outputs with softmax confidence scores. Identify misclassifications, low-confidence predictions, and adversarial failures.'
                        : 'AI labels things, but sometimes it gets confused! Find wrong labels and tricky predictions.'}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['Classification', 'Confidence', 'Adversarial AI'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 font-body text-2xs text-cyan-400">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #06B6D4, #0891B2)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      aria-label="Start investigating AI classifications">
                      Start Investigating! <Target className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {phase === 'learn' && (
                  <motion.div key="learn" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-4">
                    <span className="text-4xl">{LEARN_CARDS[learnIdx].emoji}</span>
                    <h3 className="font-display text-xl font-bold text-white">{LEARN_CARDS[learnIdx].title}</h3>
                    <p className="font-body text-sm text-white/60 max-w-md">{LEARN_CARDS[learnIdx].desc}</p>
                    <div className="flex gap-1 mt-2">
                      {LEARN_CARDS.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i === learnIdx ? 'bg-[#06B6D4]' : 'bg-white/20'}`} />
                      ))}
                    </div>
                    <div className="flex gap-3 mt-4">
                      {learnIdx > 0 && (
                        <motion.button onClick={() => setLearnIdx(i => i - 1)}
                          className="px-4 py-2 rounded-lg border border-white/10 font-display text-xs text-white/60 hover:text-white"
                          whileTap={{ scale: 0.95 }}>Back</motion.button>
                      )}
                      <motion.button onClick={() => learnIdx < LEARN_CARDS.length - 1 ? setLearnIdx(i => i + 1) : setPhase('play')}
                        className="px-6 py-2 rounded-lg font-display text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #06B6D4, #0891B2)' }}
                        whileTap={{ scale: 0.95 }}>{learnIdx < LEARN_CARDS.length - 1 ? 'Next' : 'Start Playing!'}</motion.button>
                    </div>
                  </motion.div>
                )}

                {/* PLAY */}
                {phase === 'play' && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-3 px-4">
                      <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                      <GameProgressTracker current={ci + 1} total={CHALLENGES.length} labColor="#06B6D4" />
                    </div>
                    {/* Challenge header + ENH: fooled counter */}
                    <div className="rounded-xl p-3 mb-3 text-center" role="status" aria-label={`Challenge: ${challenge.text} Progress: ${matchCount} of ${challenge.target}`}
                      style={{ backgroundColor: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)' }}>
                      <p className="font-display text-sm font-bold text-cyan-400">{'\u{1F3AF}'} {challenge.text}</p>
                      {ageBand === 'C' && <p className="font-body text-2xs text-white/25 mt-0.5">{challenge.descC}</p>}
                      <div className="flex items-center justify-center gap-2 mt-1.5">
                        <div className="flex-1 max-w-[120px] h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <motion.div className="h-full rounded-full bg-cyan-500"
                            animate={{ width: `${(matchCount / challenge.target) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
                        </div>
                        <span className="font-mono text-2xs text-white/30">{matchCount}/{challenge.target}</span>
                        <span className="font-body text-2xs text-white/15">Round {ci + 1}/{CHALLENGES.length}</span>
                        {/* ENH: Animated fooled counter */}
                        {fooledCount > 0 && (
                          <motion.span
                            key={fooledCount}
                            initial={{ scale: 1.4, color: '#00FF88' }}
                            animate={{ scale: 1, color: 'rgba(255,255,255,0.3)' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                            className="font-data text-2xs"
                          >
                            {'\u{1F916}'} Fooled: {fooledCount}
                          </motion.span>
                        )}
                        {/* ENH: Streak indicator with fire animation */}
                        {consecutiveHits >= 2 && (
                          <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: streakFlash ? [1, 1.3, 1] : 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                            className="font-data text-2xs text-orange-400"
                          >
                            {'\u{1F525}'} {consecutiveHits}x streak!
                          </motion.span>
                        )}
                      </div>
                    </div>

                    {/* Item grid */}
                    <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 gap-2 content-start">
                      {ITEMS.map((item, i) => {
                        const tapped = found.has(i);
                        const isFeedback = feedback?.idx === i;
                        const confColor = item.confidence > 80 ? '#10B981' : item.confidence > 50 ? '#F59E0B' : '#EF4444';
                        return (
                          <motion.button key={i} onClick={() => tap(i)} disabled={tapped && !isFeedback}
                            className={`rounded-xl border p-2.5 text-center transition-colors ${
                              isFeedback && feedback.hit ? 'border-green-500 bg-green-500/10'
                              : isFeedback && !feedback.hit ? 'border-orange-500 bg-orange-500/10'
                              : tapped ? 'border-white/5 opacity-20'
                              : 'border-white/10 bg-white/[0.02] hover:border-cyan-500/30'
                            }`}
                            // ENH: Green pulse + scale pop on correct, red shake + opacity dip on wrong
                            animate={
                              isFeedback && feedback.hit
                                ? { scale: [1, 1.15, 1.05], boxShadow: ['0 0 0px rgba(16,185,129,0)', '0 0 20px rgba(16,185,129,0.5)', '0 0 8px rgba(16,185,129,0.2)'] }
                                : isFeedback && !feedback.hit
                                  ? { x: [0, -6, 6, -4, 4, 0], opacity: [1, 0.5, 0.7, 0.5, 0.8, 1] }
                                  : {}
                            }
                            transition={isFeedback ? { duration: 0.5, ease: 'easeOut' } : {}}
                            whileTap={!tapped ? { scale: 0.95 } : {}}
                            aria-label={`${item.emoji} labeled as "${item.aiLabel}" with ${item.confidence}% confidence`}>
                            <span className="text-2xl block">{item.emoji}</span>
                            <p className="font-body text-2xs text-white/40 mt-1 truncate">&quot;{item.aiLabel}&quot;</p>
                            {/* ENH: Confidence bar with spring physics */}
                            <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <motion.div className="h-full rounded-full" style={{ backgroundColor: confColor }}
                                initial={{ width: 0 }} animate={{ width: `${item.confidence}%` }}
                                transition={{ type: 'spring', stiffness: 80, damping: 12, delay: i * 0.05 }} />
                            </div>
                            <p className="font-mono text-2xs mt-0.5" style={{ color: confColor }}>{item.confidence}%</p>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Feedback panel */}
                    <AnimatePresence>
                      {feedback && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                          className={`mt-2 p-3 rounded-xl text-center ${feedback.hit ? 'bg-green-500/10 border border-green-500/20' : 'bg-orange-500/10 border border-orange-500/20'}`}>
                          <div className="flex items-center justify-center gap-2 mb-1">
                            {feedback.hit ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-orange-400" />}
                            <p className={`font-display text-xs font-bold ${feedback.hit ? 'text-green-400' : 'text-orange-400'}`}>
                              {feedback.hit ? '\u2713 Good catch!' : "\u2717 Not what we're looking for"}
                            </p>
                          </div>
                          <p className="font-body text-2xs text-white/40">
                            {ageBand === 'C' ? ITEMS[feedback.idx].explanationC : ITEMS[feedback.idx].explanation}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* COMPLETE */}
                {phase === 'complete' && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <motion.span className="text-6xl" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>🏆</motion.span>
                    <h2 className="font-display text-2xl font-bold text-white" aria-label="Fool the AI game complete">Fool the AI Complete!</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">You explored how AI can be tricked and why understanding its weaknesses makes AI systems stronger and more reliable.</p>
                    <div className="rounded-xl px-6 py-3 bg-[#06B6D4]/10 border border-[#06B6D4]/20" role="status" aria-label={`Total score: ${game.score} points`}>
                      <p className="font-data text-2xl" style={{ color: '#06B6D4' }}>{game.score}</p>
                      <p className="font-body text-2xs text-white/30">Total Points</p>
                    </div>
                    <div className="mt-4 space-y-2 text-left max-w-sm">
                      <h3 className="font-display text-sm font-bold text-white/70">What You Learned:</h3>
                      <ul className="space-y-1 text-2xs font-body text-white/40">
                        <li>• Adversarial examples can fool AI by exploiting weaknesses in how models interpret visual features</li>
                        <li>• AI confidence scores don&apos;t always mean the prediction is correct — high confidence can still be wrong</li>
                        <li>• Understanding AI robustness helps researchers build more reliable and trustworthy AI systems</li>
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
