// ════════════════════════════════════════════════════════════════════════
// NEURAL NETWORK BUILDER v4 — Lab 3 Flagship (Redesigned)
// ════════════════════════════════════════════════════════════════════════
// Build neural networks with animated SVG visualization.
// Replaced Three.js with glowing SVG neural net + particle field.
// 10 levels with progressive complexity, star ratings, combo system.
//
// Teaches: neurons, layers, weights, activation, training, epochs,
// backpropagation, architecture design.

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain, Zap, ChevronRight, Plus, Minus, RotateCcw,
  GraduationCap, Target, Star, Trophy, Sparkles,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import { SFBadge } from '@/components/ui/SFBadge';
import GameLevelSystem, { type LevelConfig, type LevelResult } from '@/components/games/shared/GameLevelSystem';
import {
  AnimatedNeuralNet, ScoreDisplay,
  GlowingTitle, FeedbackPopup, ComboCounter, TimerDisplay, LevelBadge,
} from '@/components/games/shared/GameVisualKit';

// ════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════
type Phase = 'welcome' | 'build' | 'train' | 'test' | 'level-complete';

interface LevelData {
  title: string;
  description: string;
  concept: string;
  inputNodes: number;
  hiddenLayers: number[];
  outputNodes: number;
  trainingRounds: number;
  targetAccuracy: number;
  challenge?: string;
}

// ════════════════════════════════════════════════════════════════════════
// 10 LEVELS (2 hours of content)
// ════════════════════════════════════════════════════════════════════════
const LEVELS: LevelConfig[] = [
  { id: 1, name: 'First Neuron', description: 'Build a single neuron', emoji: '🧠', difficulty: 'easy', starThresholds: [60, 80, 95], xpReward: 50 },
  { id: 2, name: 'Layer Up', description: 'Add a hidden layer', emoji: '🏗️', difficulty: 'easy', starThresholds: [60, 80, 95], xpReward: 60 },
  { id: 3, name: 'Deep Net', description: 'Stack 3 hidden layers', emoji: '📚', difficulty: 'easy', starThresholds: [60, 80, 95], xpReward: 70 },
  { id: 4, name: 'Weight Wizard', description: 'Tune weights for accuracy', emoji: '⚖️', difficulty: 'medium', starThresholds: [60, 80, 90], xpReward: 80 },
  { id: 5, name: 'Pattern Match', description: 'Recognize shapes', emoji: '🔍', difficulty: 'medium', starThresholds: [60, 80, 90], xpReward: 90 },
  { id: 6, name: 'Speed Train', description: 'Train under time pressure', emoji: '⏱️', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 100 },
  { id: 7, name: 'Overfit Alert', description: 'Balance training data', emoji: '⚠️', difficulty: 'hard', starThresholds: [50, 75, 85], xpReward: 120 },
  { id: 8, name: 'Multi-Task', description: 'Classify multiple outputs', emoji: '🔀', difficulty: 'hard', starThresholds: [50, 75, 85], xpReward: 130 },
  { id: 9, name: 'Architect', description: 'Design optimal architecture', emoji: '🏛️', difficulty: 'expert', starThresholds: [50, 70, 85], xpReward: 150 },
  { id: 10, name: 'Grandmaster', description: 'Master challenge', emoji: '👑', difficulty: 'expert', starThresholds: [50, 70, 85], xpReward: 200, isBonus: true },
];

const LEVEL_DATA: Record<number, LevelData> = {
  1: { title: 'First Neuron', description: 'Build a single neuron that can tell light from dark.', concept: 'A neuron takes inputs, multiplies them by weights, adds them up, and decides "yes" or "no."', inputNodes: 2, hiddenLayers: [], outputNodes: 1, trainingRounds: 3, targetAccuracy: 70 },
  2: { title: 'Layer Up', description: 'Add a hidden layer — neurons talking to other neurons!', concept: 'Hidden layers let the network learn intermediate patterns. More layers = deeper thinking.', inputNodes: 2, hiddenLayers: [3], outputNodes: 1, trainingRounds: 4, targetAccuracy: 75 },
  3: { title: 'Deep Net', description: 'Stack 3 hidden layers for deep pattern recognition.', concept: 'Deep networks can learn complex hierarchies: edges → shapes → objects.', inputNodes: 3, hiddenLayers: [4, 3], outputNodes: 2, trainingRounds: 5, targetAccuracy: 80 },
  4: { title: 'Weight Wizard', description: 'Tune individual weights for maximum accuracy.', concept: 'Weights decide how much each input matters. Learning good weights is a big part of what real neural networks do.', inputNodes: 3, hiddenLayers: [4, 4], outputNodes: 2, trainingRounds: 6, targetAccuracy: 82, challenge: 'Fun fact: in real networks, some weights help more than others!' },
  5: { title: 'Pattern Match', description: 'Teach your net to recognize shapes from pixel data.', concept: 'Each pixel is an input. The network learns to see lines, curves, and eventually shapes.', inputNodes: 4, hiddenLayers: [5, 4, 3], outputNodes: 3, trainingRounds: 6, targetAccuracy: 85 },
  6: { title: 'Speed Train', description: 'Train fast! Every second counts in this timed challenge.', concept: 'Training speed vs accuracy is a tradeoff. More epochs = better results but takes longer.', inputNodes: 4, hiddenLayers: [5, 5], outputNodes: 3, trainingRounds: 8, targetAccuracy: 80, challenge: 'Complete training in under 45 seconds!' },
  7: { title: 'Overfit Alert', description: 'Your network memorized the answers! Fix it.', concept: 'Overfitting = the network memorizes training data but fails on new data. Solution: generalization.', inputNodes: 5, hiddenLayers: [6, 5, 4], outputNodes: 3, trainingRounds: 8, targetAccuracy: 83, challenge: 'See how close the test accuracy lands to the training accuracy.' },
  8: { title: 'Multi-Task', description: 'Classify multiple things at once with shared layers.', concept: 'Multi-task learning: one network learns several related tasks, sharing what it learns.', inputNodes: 5, hiddenLayers: [6, 6, 5], outputNodes: 4, trainingRounds: 10, targetAccuracy: 85 },
  9: { title: 'The Architect', description: 'Design the perfect network architecture for the problem.', concept: 'Architecture matters a lot! In real networks, too small can underfit and too big can overfit — engineers hunt for the sweet spot.', inputNodes: 6, hiddenLayers: [7, 6, 5, 4], outputNodes: 4, trainingRounds: 10, targetAccuracy: 88, challenge: 'Design your own hidden layer sizes!' },
  10: { title: 'Neural Grandmaster', description: 'The ultimate test. Master everything.', concept: 'True mastery: understand when to go deep, when to stay shallow, and how to balance it all.', inputNodes: 6, hiddenLayers: [8, 7, 6, 5], outputNodes: 5, trainingRounds: 12, targetAccuracy: 90, challenge: 'Beat all previous accuracy records!' },
};

// ════════════════════════════════════════════════════════════════════════
// NEURAL NETWORK STATE
// ════════════════════════════════════════════════════════════════════════
interface NNState {
  layers: number[]; // node counts per layer
  weights: number[][][]; // weights[layer][from][to]
  activations: number[][]; // activations[layer][node]
  trainingProgress: number;
  accuracy: number;
  epochs: number;
  isTraining: boolean;
}

function initNN(input: number, hidden: number[], output: number): NNState {
  const layers = [input, ...hidden, output];
  const weights = layers.slice(0, -1).map((fromCount, li) =>
    Array.from({ length: fromCount }, () =>
      Array.from({ length: layers[li + 1] }, () => (Math.random() - 0.5) * 0.5)
    )
  );
  const activations = layers.map((n) => Array(n).fill(0.5));
  return { layers, weights, activations, trainingProgress: 0, accuracy: 0, epochs: 0, isTraining: false };
}

function simulateTraining(state: NNState, rounds: number): NNState {
  const newState = { ...state, isTraining: true };
  // Simulate accuracy improvement with diminishing returns
  const baseImprovement = 15 / rounds;
  const epochBoost = Math.min(newState.epochs * 2, 20);
  const noise = (Math.random() - 0.3) * 10;
  newState.accuracy = Math.min(98, Math.max(30,
    newState.accuracy + baseImprovement + epochBoost / rounds + noise
  ));
  newState.epochs += 1;
  newState.trainingProgress = Math.min(100, (newState.epochs / rounds) * 100);

  // Update activations with simulated forward pass
  newState.activations = newState.layers.map((n, li) =>
    Array.from({ length: n }, (_, ni) => {
      if (li === 0) return 0.3 + Math.random() * 0.5; // Input
      const prevActivations = newState.activations[li - 1];
      const prevWeights = newState.weights[li - 1];
      let sum = 0;
      prevActivations.forEach((a, pi) => {
        sum += a * (prevWeights[pi]?.[ni] || 0);
      });
      // Sigmoid
      return 1 / (1 + Math.exp(-sum));
    })
  );

  newState.isTraining = false;
  return newState;
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, onComplete, onExit,
}: {
  level: LevelConfig; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const data = LEVEL_DATA[level.id];
  const [phase, setPhase] = useState<Phase>('welcome');
  const [nn, setNN] = useState(() => initNN(data.inputNodes, data.hiddenLayers, data.outputNodes));
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'info'; message: string; explanation?: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(level.id === 6 ? 45 : 90);
  const [testResults, setTestResults] = useState<boolean[]>([]);

  const maxScore = data.trainingRounds * 10 + 20;
  const labColor = '#E945F5';

  // Timer — counts down once the train/test phase begins, cleans up on unmount/phase change.
  useEffect(() => {
    if (phase === 'train' || phase === 'test') {
      const interval = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { clearInterval(interval); return 0; }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  const handleAddLayer = useCallback(() => {
    if (nn.layers.length - 2 >= 5) return; // Max 5 hidden
    const newLayers = [...nn.layers];
    newLayers.splice(newLayers.length - 1, 0, 3); // Insert hidden layer with 3 nodes
    const newWeights = initNN(newLayers[0], newLayers.slice(1, -1), newLayers[newLayers.length - 1]).weights;
    setNN((prev) => ({ ...prev, layers: newLayers, weights: newWeights }));
    setFeedback({ type: 'info', message: 'Hidden layer added!', explanation: 'More layers let the network learn deeper patterns.' });
  }, [nn.layers]);

  const handleRemoveLayer = useCallback(() => {
    if (nn.layers.length <= 3) return;
    const newLayers = nn.layers.filter((_, i) => i !== nn.layers.length - 2);
    const newWeights = initNN(newLayers[0], newLayers.slice(1, -1), newLayers[newLayers.length - 1]).weights;
    setNN((prev) => ({ ...prev, layers: newLayers, weights: newWeights }));
  }, [nn.layers]);

  const handleAddNode = useCallback((layerIdx: number) => {
    if (nn.layers[layerIdx] >= 10) return;
    const newLayers = nn.layers.map((n, i) => i === layerIdx ? n + 1 : n);
    const newNN = initNN(newLayers[0], newLayers.slice(1, -1), newLayers[newLayers.length - 1]);
    setNN((prev) => ({ ...prev, layers: newLayers, weights: newNN.weights, activations: newNN.activations }));
  }, [nn.layers]);

  const handleTrain = useCallback(() => {
    if (nn.isTraining) return;
    const trained = simulateTraining(nn, data.trainingRounds);
    setNN(trained);

    const roundScore = Math.round(trained.accuracy / 10);
    setScore((s) => s + roundScore);
    setCombo((c) => c + 1);

    if (trained.epochs >= data.trainingRounds) {
      setPhase('test');
      setFeedback({
        type: trained.accuracy >= data.targetAccuracy ? 'correct' : 'wrong',
        message: trained.accuracy >= data.targetAccuracy
          ? `Training complete! ${Math.round(trained.accuracy)}% accuracy` 
          : `Training done. ${Math.round(trained.accuracy)}% — below target ${data.targetAccuracy}%`,
        explanation: trained.accuracy >= data.targetAccuracy
          ? 'Great job! Your network learned the patterns well.'
          : 'In real training, engineers might add layers or train longer to improve.',
      });
    } else {
      setFeedback({
        type: 'info',
        message: `Epoch ${trained.epochs}: ${Math.round(trained.accuracy)}% accuracy`,
        explanation: 'Keep training! Each epoch improves the weights.',
      });
    }
  }, [nn, data]);

  const handleTest = useCallback(() => {
    const results = Array.from({ length: 5 }, () => nn.accuracy + (Math.random() - 0.5) * 15 > 60);
    setTestResults(results);
    const passCount = results.filter(Boolean).length;
    const testScore = passCount * 4;
    setScore((s) => s + testScore);

    const totalScore = score + testScore;
    const stars = totalScore >= level.starThresholds[2] ? 3 : totalScore >= level.starThresholds[1] ? 2 : totalScore >= level.starThresholds[0] ? 1 : 0;

    setFeedback({
      type: passCount >= 3 ? 'correct' : 'wrong',
      message: `${passCount}/5 tests passed!`,
      explanation: passCount >= 3 ? 'Your neural network generalizes well!' : 'Try adjusting your architecture.',
    });

    setTimeout(() => {
      onComplete({
        score: totalScore,
        maxScore,
        stars: stars as 0 | 1 | 2 | 3,
        xpEarned: level.xpReward * (stars / 3),
        timeMs: (90 - timeLeft) * 1000,
      });
    }, 2000);
  }, [nn, score, level, maxScore, timeLeft]);

  // ═══ WELCOME PHASE ═══
  if (phase === 'welcome') {
    return (
      <div className="relative">
        <div className="relative z-10 space-y-5">
          <GlowingTitle emoji="🧠" color={labColor}>Level {level.id}: {data.title}</GlowingTitle>

          <SFCard variant="elevated" className="p-5">
            <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{data.description}</p>
            <div className="rounded-xl p-3 text-xs" style={{ background: `${labColor}10`, color: labColor }}>
              <GraduationCap className="w-4 h-4 inline mr-1" />
              <strong>Concept:</strong> {data.concept}
            </div>
            {data.challenge && (
              <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
                <Target className="w-4 h-4 shrink-0 mt-0.5" />
                <span><strong>Challenge:</strong> {data.challenge}</span>
              </div>
            )}
          </SFCard>

          <div className="rounded-2xl overflow-hidden" style={{ background: '#0D0F1A' }}>
            <AnimatedNeuralNet layers={nn.layers} color={labColor} animated={true} />
          </div>

          <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('build')}>
            Start Building <ChevronRight className="w-5 h-5 ml-2" />
          </SFButton>
        </div>
      </div>
    );
  }

  // ═══ BUILD PHASE ═══
  if (phase === 'build') {
    return (
      <div className="relative space-y-4">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <GlowingTitle emoji="🧠" color={labColor}>Build Network</GlowingTitle>
            <LevelBadge level={level.id} color={labColor} />
          </div>

          <ScoreDisplay score={score} maxScore={maxScore} />
          <ComboCounter combo={combo} />

          {/* Network visualization */}
          <div className="rounded-2xl overflow-hidden p-4" style={{ background: '#0D0F1A' }}>
            <AnimatedNeuralNet layers={nn.layers} color={labColor} animated={true} size={{ w: 300, h: 220 }} />
          </div>

          {/* Layer controls */}
          <div className="flex flex-wrap gap-2">
            <SFButton variant="outline" size="sm" onClick={handleAddLayer} disabled={nn.layers.length - 2 >= 5}>
              <Plus className="w-4 h-4 mr-1" /> Add Layer
            </SFButton>
            <SFButton variant="outline" size="sm" onClick={handleRemoveLayer} disabled={nn.layers.length <= 3}>
              <Minus className="w-4 h-4 mr-1" /> Remove Layer
            </SFButton>
            {nn.layers.map((count, i) => (
              i > 0 && i < nn.layers.length - 1 && (
                <SFButton key={i} variant="outline" size="sm" onClick={() => handleAddNode(i)} disabled={count >= 10}>
                  L{i}: {count} <Plus className="w-3 h-3 ml-0.5" />
                </SFButton>
              )
            ))}
          </div>

          <SFCard variant="default" className="p-3 text-xs" style={{ color: '#5A6078' }}>
            <Brain className="w-4 h-4 inline mr-1" style={{ color: labColor }} />
            Input: {nn.layers[0]} → Hidden: {nn.layers.slice(1, -1).join('-')} → Output: {nn.layers[nn.layers.length - 1]}
          </SFCard>

          <SFButton variant="primary" size="lg" className="w-full" onClick={() => { setPhase('train'); setCombo(0); }}>
            <Zap className="w-5 h-5 mr-2" /> Start Training
          </SFButton>
        </div>
      </div>
    );
  }

  // ═══ TRAIN PHASE ═══
  if (phase === 'train') {
    return (
      <div className="relative space-y-4">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <GlowingTitle emoji="⚡" color={labColor}>Training</GlowingTitle>
            <TimerDisplay seconds={timeLeft} />
          </div>

          <ScoreDisplay score={score} maxScore={maxScore} />

          {/* Progress */}
          <div className="rounded-xl p-3" style={{ background: `${labColor}08` }}>
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: '#8C94AC' }}>Epoch {nn.epochs} / {data.trainingRounds}</span>
              <span className="font-bold" style={{ color: labColor }}>{Math.round(nn.accuracy)}% accuracy</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#EEF0F8' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${labColor}, #FF6B35)` }}
                animate={{ width: `${nn.trainingProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Neural net visualization */}
          <div className="rounded-2xl overflow-hidden p-4" style={{ background: '#0D0F1A' }}>
            <AnimatedNeuralNet layers={nn.layers} color={labColor} animated={nn.isTraining} size={{ w: 300, h: 220 }} />
          </div>

          {feedback && <FeedbackPopup {...feedback} />}

          <div className="flex gap-2">
            {nn.epochs < data.trainingRounds ? (
              <SFButton variant="primary" className="flex-1" onClick={handleTrain}>
                <Zap className="w-4 h-4 mr-2" /> Train Epoch {nn.epochs + 1}
              </SFButton>
            ) : (
              <SFButton variant="primary" className="flex-1" onClick={() => setPhase('test')}>
                <Target className="w-4 h-4 mr-2" /> Run Tests
              </SFButton>
            )}
            <SFButton variant="outline" onClick={onExit}>
              <RotateCcw className="w-4 h-4" />
            </SFButton>
          </div>
        </div>
      </div>
    );
  }

  // ═══ TEST PHASE ═══
  if (phase === 'test') {
    return (
      <div className="relative space-y-4">
        <div className="relative z-10 space-y-4">
          <GlowingTitle emoji="🧪" color={labColor}>Testing</GlowingTitle>
          <ScoreDisplay score={score} maxScore={maxScore} />

          <div className="rounded-2xl p-4 text-center" style={{ background: `${labColor}08` }}>
            <p className="text-sm" style={{ color: '#5A6078' }}>Final Training Accuracy</p>
            <motion.p
              className="text-4xl font-extrabold"
              style={{ color: labColor, fontFamily: 'var(--font-display)' }}
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
            >
              {Math.round(nn.accuracy)}%
            </motion.p>
          </div>

          {feedback && <FeedbackPopup {...feedback} />}

          <SFButton variant="primary" size="lg" className="w-full" onClick={handleTest}>
            <Target className="w-5 h-5 mr-2" /> Run Final Tests
          </SFButton>
        </div>
      </div>
    );
  }

  return null;
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function NeuralBuilderGame() {
  const { awardXP, completeGame } = useGameActions();
  const child = useActiveChild();

  const handleAllComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('neural-builder', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Neural Network Builder" color="#E945F5" labNum={3}>
      <GameLevelSystem
        gameTitle="Neural Network Builder"
        gameEmoji="🧠"
        labColor="#E945F5"
        levels={LEVELS}
        onComplete={handleAllComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer level={level} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
