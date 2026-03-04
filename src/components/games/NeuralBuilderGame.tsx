// ================================================================
// NEURAL NETWORK BUILDER v3-FINAL — Lab 3 Flagship
// ================================================================
// Build, train, and test neural networks in 3D.
// Full R3F 3D rotatable network (Decision 6.1), chrome bezel,
// 6 phases, 3 challenge tasks, 4 architecture challenges,
// age-band differentiation (B/C), Tone.js audio,
// heartbeat animation, synaptic sparks, comprehensive a11y.
//
// v3 Changes from v2:
// - SVG network visualization REPLACED by NeuralNetwork3D (6.1)
// - NeuralNet3D brain orb REMOVED (replaced by network)
// - All game logic, phases, content UNCHANGED
// - Heartbeat + sparks now drive 3D props instead of SVG
// - Audio hook unchanged (useNetworkAudio)
//
// Teaches: neural network architecture, layers, neurons,
// weights, training, epochs, accuracy, loss functions.
// ================================================================

'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useNetworkAudio } from '@/hooks/useNetworkAudio';
import {
  Brain, Zap, ChevronRight, Plus, Minus, Play,
  RotateCcw, GraduationCap, Target, Volume2, VolumeX,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

// === [v3] Dynamic import for 3D network (no SSR) ===
const NeuralNetwork3D = dynamic(
  () => import('@/components/3d/NeuralNetwork3D'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] rounded-lg bg-pink-500/5 animate-pulse flex items-center justify-center">
        <span className="text-4xl animate-bounce">{'\u{1F9E0}'}</span>
      </div>
    ),
  }
);

// ================================================================
// TYPES
// ================================================================

type Phase = 'welcome' | 'learn' | 'build' | 'train' | 'test' | 'report';

interface NetworkNode {
  id: string;
  layer: number;
  index: number;
  activation: number;
}

interface Connection {
  fromId: string;
  toId: string;
  weight: number;
  prevWeight: number;
  sparkIntensity: number;
}

interface NetworkData {
  nodes: NetworkNode[];
  connections: Connection[];
}

interface Challenge {
  id: string;
  title: string;
  emoji: string;
  description: string;
  descriptionC: string;
  inputLabels: string[];
  outputLabels: string[];
  startLayers: number[];
  optimalLayers: number[];
  drawMode: boolean;
  testItems: { emoji: string; answer: number; label: string }[];
}

interface ArchChallenge {
  id: string;
  title: string;
  description: string;
  requireChallenge: string;
  targetAcc: number;
  maxNeurons?: number;
  maxLayers?: number;
}

// ================================================================
// DATA: Challenge Tasks
// ================================================================

const CHALLENGES: Challenge[] = [
  {
    id: 'digits',
    title: 'Digit Reader',
    emoji: '\u{1F522}',
    description:
      'Build a network that reads handwritten digits! Draw a number and see if your AI can recognize it.',
    descriptionC:
      'Classify 28x28 pixel images into digit classes 0-9. Input layer receives flattened pixel intensities. Hidden layers extract hierarchical features (edges, curves, strokes). Adjust architecture to balance capacity vs. training efficiency.',
    inputLabels: ['Pixel 1', 'Pixel 2', 'Pixel 3', 'Pixel 4'],
    outputLabels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    startLayers: [4, 6, 10],
    optimalLayers: [4, 8, 8, 10],
    drawMode: true,
    testItems: [
      { emoji: '0\uFE0F\u20E3', answer: 0, label: 'Zero' },
      { emoji: '3\uFE0F\u20E3', answer: 3, label: 'Three' },
      { emoji: '7\uFE0F\u20E3', answer: 7, label: 'Seven' },
      { emoji: '5\uFE0F\u20E3', answer: 5, label: 'Five' },
    ],
  },
  {
    id: 'colors',
    title: 'Color Classifier',
    emoji: '\u{1F3A8}',
    description:
      'Build a network that classifies colors! Given RGB values, can it name the color?',
    descriptionC:
      'RGB-to-label classification. Three continuous input features (R, G, B values 0-255) mapped to 6 color categories.',
    inputLabels: ['Red', 'Green', 'Blue'],
    outputLabels: [
      '\u{1F534} Red', '\u{1F7E2} Green', '\u{1F535} Blue',
      '\u{1F7E1} Yellow', '\u{1F7E3} Purple', '\u{1F7E0} Orange',
    ],
    startLayers: [3, 4, 6],
    optimalLayers: [3, 6, 6],
    drawMode: false,
    testItems: [
      { emoji: '\u{1F534}', answer: 0, label: 'Bright Red' },
      { emoji: '\u{1F535}', answer: 2, label: 'Deep Blue' },
      { emoji: '\u{1F7E1}', answer: 3, label: 'Sunny Yellow' },
      { emoji: '\u{1F7E3}', answer: 4, label: 'Royal Purple' },
      { emoji: '\u{1F7E2}', answer: 1, label: 'Forest Green' },
      { emoji: '\u{1F7E0}', answer: 5, label: 'Warm Orange' },
    ],
  },
  {
    id: 'shapes',
    title: 'Shape Sorter',
    emoji: '\u{1F537}',
    description:
      'Build a network that recognizes shapes! It looks at features like number of sides and roundness.',
    descriptionC:
      'Multi-feature geometric classification. Input features encode geometric properties (sides, roundness, symmetry, area ratio).',
    inputLabels: ['Sides', 'Roundness', 'Symmetry', 'Area'],
    outputLabels: ['\u{2B55} Circle', '\u{2B1C} Square', '\u{1F53A} Triangle', '\u2B21 Hexagon'],
    startLayers: [4, 4, 4],
    optimalLayers: [4, 6, 6, 4],
    drawMode: false,
    testItems: [
      { emoji: '\u{2B55}', answer: 0, label: 'Circle' },
      { emoji: '\u{2B1C}', answer: 1, label: 'Square' },
      { emoji: '\u{1F53A}', answer: 2, label: 'Triangle' },
      { emoji: '\u2B21', answer: 3, label: 'Hexagon' },
    ],
  },
];

// ================================================================
// DATA: Architecture Challenges (V2 Enhancement)
// ================================================================

const ARCH_CHALLENGES: ArchChallenge[] = [
  {
    id: 'minimalist',
    title: 'The Minimalist',
    description: 'Reach 85% accuracy using 12 or fewer neurons total',
    requireChallenge: 'colors',
    targetAcc: 85,
    maxNeurons: 12,
  },
  {
    id: 'shallow',
    title: 'Shallow Master',
    description: 'Reach 90% accuracy using only 2 layers (input + output)',
    requireChallenge: 'shapes',
    targetAcc: 90,
    maxLayers: 2,
  },
  {
    id: 'deep-thinker',
    title: 'Deep Thinker',
    description: 'Reach 95% accuracy with 4+ layers on digit recognition',
    requireChallenge: 'digits',
    targetAcc: 95,
  },
  {
    id: 'efficient',
    title: 'Efficiency Expert',
    description: 'Reach 90% on colors with max 15 neurons and max 3 layers',
    requireChallenge: 'colors',
    targetAcc: 90,
    maxNeurons: 15,
    maxLayers: 3,
  },
];

// ================================================================
// HELPERS
// ================================================================

function buildNetwork(sizes: number[]): NetworkData {
  const nodes: NetworkNode[] = [];
  const connections: Connection[] = [];

  sizes.forEach((size, layerIdx) => {
    for (let i = 0; i < size; i++) {
      const id = `n-${layerIdx}-${i}`;
      nodes.push({ id, layer: layerIdx, index: i, activation: 0 });

      if (layerIdx > 0) {
        for (let j = 0; j < sizes[layerIdx - 1]; j++) {
          connections.push({
            fromId: `n-${layerIdx - 1}-${j}`,
            toId: id,
            weight: parseFloat((Math.random() * 2 - 1).toFixed(2)),
            prevWeight: 0,
            sparkIntensity: 0,
          });
        }
      }
    }
  });

  return { nodes, connections };
}

function detectMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function NeuralBuilderGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'B' | 'C';

  // --- Phase ---
  const [phase, setPhase] = useState<Phase>('welcome');
  const [challengeId, setChallengeId] = useState('digits');

  // --- Network state ---
  const [layerSizes, setLayerSizes] = useState<number[]>([4, 6, 10]);
  const [network, setNetwork] = useState(() => buildNetwork([4, 6, 10]));
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [inspectedNode, setInspectedNode] = useState<string | null>(null);

  // --- Training state ---
  const [isTraining, setIsTraining] = useState(false);
  const [trainEpoch, setTrainEpoch] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [lossHistory, setLossHistory] = useState<
    { epoch: number; loss: number; acc: number }[]
  >([]);
  const [learningRate, setLearningRate] = useState(0.01);
  const [dataFlowActive, setDataFlowActive] = useState(false);

  // --- Test state ---
  const [testIdx, setTestIdx] = useState(0);
  const [testResults, setTestResults] = useState<
    { correct: boolean; predicted: number; confidence: number }[]
  >([]);
  const [showCanvas, setShowCanvas] = useState(false);

  // --- Canvas ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  // --- Audio (V2 Enhancement) ---
  const audio = useNetworkAudio();
  const [soundEnabled, setSoundEnabled] = useState(false);

  // --- Architecture challenges (V2 Enhancement) ---
  const [showChallenges, setShowChallenges] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<string | null>(null);

  // --- Heartbeat (V2 Enhancement) ---
  const [heartbeatPhase, setHeartbeatPhase] = useState(0);

  // --- Mobile detection ---
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(detectMobile());
  }, []);

  // --- Particles ---
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 4,
        duration: Math.random() * 6 + 4,
      })),
    []
  );

  // --- Derived ---
  const challenge = useMemo(
    () => CHALLENGES.find((c) => c.id === challengeId) || CHALLENGES[0],
    [challengeId]
  );
  const description =
    ageBand === 'C' ? challenge.descriptionC : challenge.description;
  const totalNeurons = layerSizes.reduce((a, b) => a + b, 0);
  const totalConnections = network.connections.length;
  const complexity = Math.min(1, totalNeurons / 40);
  const trainingProgress = accuracy / 100;

  // --- Heartbeat idle animation (V2 Enhancement) ---
  useEffect(() => {
    if (isTraining || phase !== 'build') return;
    const interval = setInterval(() => {
      setHeartbeatPhase((prev) => (prev + 0.015) % 1);
    }, 50);
    return () => clearInterval(interval);
  }, [isTraining, phase]);

  // --- Sound toggle (V2 Enhancement) ---
  const toggleSound = useCallback(async () => {
    if (!soundEnabled) {
      await audio.initTone();
      setSoundEnabled(true);
    } else {
      setSoundEnabled(false);
    }
  }, [soundEnabled, audio]);

  // --- Architecture challenge handlers (V2 Enhancement) ---
  function startArchChallenge(ch: ArchChallenge) {
    selectChallenge(ch.requireChallenge);
    setActiveChallenge(ch.id);
    setShowChallenges(false);
  }

  // --- Challenge pass/fail check (V2 Enhancement) ---
  const challengeResult = useMemo(() => {
    if (!activeChallenge || accuracy === 0) return null;
    const ch = ARCH_CHALLENGES.find((c) => c.id === activeChallenge);
    if (!ch) return null;
    const meetsAcc = accuracy >= ch.targetAcc;
    const meetsNeurons = !ch.maxNeurons || totalNeurons <= ch.maxNeurons;
    const meetsLayers = !ch.maxLayers || layerSizes.length <= ch.maxLayers;
    return {
      challenge: ch,
      passed: meetsAcc && meetsNeurons && meetsLayers,
      meetsAcc,
      meetsNeurons,
      meetsLayers,
    };
  }, [activeChallenge, accuracy, totalNeurons, layerSizes.length]);

  // --- Challenge selection ---
  function selectChallenge(id: string) {
    const ch = CHALLENGES.find((c) => c.id === id);
    if (!ch) return;
    setChallengeId(id);
    setLayerSizes([...ch.startLayers]);
    setNetwork(buildNetwork(ch.startLayers));
    setAccuracy(0);
    setTrainEpoch(0);
    setLossHistory([]);
    setTestResults([]);
    setTestIdx(0);
    setSelectedConnection(null);
    setInspectedNode(null);
  }

  // --- Layer controls ---
  function addLayer() {
    if (layerSizes.length >= 6) return;
    const newSizes = [...layerSizes];
    newSizes.splice(newSizes.length - 1, 0, 4);
    setLayerSizes(newSizes);
    setNetwork(buildNetwork(newSizes));
    setAccuracy(0);
    setTrainEpoch(0);
    setLossHistory([]);
  }

  function removeLayer() {
    if (layerSizes.length <= 2) return;
    const newSizes = [...layerSizes];
    newSizes.splice(newSizes.length - 2, 1);
    setLayerSizes(newSizes);
    setNetwork(buildNetwork(newSizes));
    setAccuracy(0);
    setTrainEpoch(0);
    setLossHistory([]);
  }

  function adjustNeurons(layerIdx: number, delta: number) {
    const newSizes = [...layerSizes];
    newSizes[layerIdx] = Math.max(1, Math.min(12, newSizes[layerIdx] + delta));
    setLayerSizes(newSizes);
    setNetwork(buildNetwork(newSizes));
    setAccuracy(0);
    setTrainEpoch(0);
    setLossHistory([]);
  }

  // --- Training simulation ---
  async function trainNetwork() {
    if (isTraining) return;
    setIsTraining(true);
    setDataFlowActive(true);
    setAccuracy(0);
    setTrainEpoch(0);
    setLossHistory([]);

    const epochs = 20;
    const optimalMatch =
      layerSizes.length === challenge.optimalLayers.length
        ? layerSizes.reduce(
            (sum, s, i) => sum + Math.abs(s - challenge.optimalLayers[i]),
            0
          ) / totalNeurons
        : 0.5;
    const maxAcc = Math.min(98, 60 + (1 - optimalMatch) * 38);

    for (let e = 1; e <= epochs; e++) {
      await new Promise((r) => setTimeout(r, 600));
      const acc = Math.min(
        maxAcc,
        (e / epochs) * maxAcc + Math.random() * 5
      );
      const loss = Math.max(
        0.01,
        2.0 - (e / epochs) * 1.9 + Math.random() * 0.2
      );

      setTrainEpoch(e);
      setAccuracy(Math.round(acc));
      setLossHistory((prev) => [
        ...prev,
        { epoch: e, loss: parseFloat(loss.toFixed(3)), acc: Math.round(acc) },
      ]);

      // Update node activations + connection sparks
      setNetwork((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => ({
          ...n,
          activation: Math.random() * 0.3 + (acc / 100) * 0.7,
        })),
        connections: prev.connections.map((c) => {
          const newWeight = parseFloat(
            (c.weight + (Math.random() - 0.5) * learningRate * 2).toFixed(2)
          );
          return {
            ...c,
            prevWeight: c.weight,
            weight: Math.max(-1, Math.min(1, newWeight)),
            sparkIntensity: Math.abs(newWeight - c.weight),
          };
        }),
      }));

      // Sound feedback (V2 Enhancement)
      if (soundEnabled) {
        audio.playEpochChord(e, epochs, acc);
        if (e % 3 === 0) {
          audio.playActivation(e % layerSizes.length, layerSizes.length);
        }
      }
    }

    if (soundEnabled) audio.playComplete();
    setIsTraining(false);
    setDataFlowActive(false);
    game.updateScore(Math.round(maxAcc / 10) * 5);
  }

  // --- Weight slider ---
  function handleWeightChange(connId: string, newWeight: number) {
    setNetwork((prev) => ({
      ...prev,
      connections: prev.connections.map((c) => {
        const cId = `${c.fromId}-${c.toId}`;
        if (cId === connId) {
          return {
            ...c,
            prevWeight: c.weight,
            weight: newWeight,
            sparkIntensity: 0,
          };
        }
        return c;
      }),
    }));
  }

  // --- Drawing canvas ---
  function initCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 200, 200);
    setShowCanvas(true);
  }

  function handleCanvasPointerDown(e: React.PointerEvent) {
    drawingRef.current = true;
    draw(e);
  }

  function handleCanvasPointerMove(e: React.PointerEvent) {
    if (!drawingRef.current) return;
    draw(e);
  }

  function handleCanvasPointerUp() {
    drawingRef.current = false;
  }

  function draw(e: React.PointerEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 200;
    const y = ((e.clientY - rect.top) / rect.height) * 200;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 200, 200);
  }

  // --- Test ---
  function runTest() {
    const testItem = challenge.testItems[testIdx];
    if (!testItem) return;
    const correct = Math.random() < accuracy / 100;
    const predicted = correct
      ? testItem.answer
      : (testItem.answer + 1) % challenge.outputLabels.length;
    const confidence = correct
      ? 0.7 + Math.random() * 0.25
      : 0.3 + Math.random() * 0.3;

    setTestResults((prev) => [...prev, { correct, predicted, confidence }]);
    if (testIdx + 1 < challenge.testItems.length) {
      setTestIdx(testIdx + 1);
    } else {
      setTimeout(() => {
        setPhase('report');
        game.completeGame();
      }, 1500);
    }
  }

  // --- Replay ---
  function handleReplay() {
    setPhase('build');
    setAccuracy(0);
    setTrainEpoch(0);
    setLossHistory([]);
    setTestResults([]);
    setTestIdx(0);
    setShowCanvas(false);
    setActiveChallenge(null);
  }

  // --- Selected connection data ---
  const selectedConnData = useMemo(() => {
    if (!selectedConnection) return null;
    return (
      network.connections.find(
        (c) => `${c.fromId}-${c.toId}` === selectedConnection
      ) || null
    );
  }, [selectedConnection, network.connections]);

  // --- Inspected node data ---
  const inspectedNodeData = useMemo(() => {
    if (!inspectedNode) return null;
    const node = network.nodes.find((n) => n.id === inspectedNode);
    if (!node) return null;
    const inputs = network.connections.filter(
      (c) => c.toId === inspectedNode
    ).length;
    const outputs = network.connections.filter(
      (c) => c.fromId === inspectedNode
    ).length;
    return { ...node, inputs, outputs };
  }, [inspectedNode, network]);

  // --- Test accuracy ---
  const testAccuracy = useMemo(() => {
    if (testResults.length === 0) return 0;
    return Math.round(
      (testResults.filter((r) => r.correct).length / testResults.length) * 100
    );
  }, [testResults]);

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <GameShell
      gameId="neural-builder"
      title="Neural Network Builder"
      worldNumber={3}
      worldColor="#EC4899"
      totalRounds={1}
    >
      {/* Chrome bezel + particles */}
      <div
        className="relative min-h-[600px] rounded-2xl overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, #0f0a1a 0%, #1a0a2e 50%, #0f0a1a 100%)',
        }}
      >
        {/* Particle background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full bg-pink-400/20"
              style={{
                width: p.size,
                height: p.size,
                left: `${p.x}%`,
                top: `${p.y}%`,
              }}
              animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
              }}
            />
          ))}
        </div>

        {/* Chrome bezel border */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none z-10"
          style={{
            boxShadow:
              'inset 0 0 0 2px rgba(236,72,153,0.3), inset 0 0 30px rgba(236,72,153,0.05)',
            border: '1px solid rgba(236,72,153,0.15)',
          }}
        />

        {/* LED rim glow */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none z-10"
          style={{
            boxShadow:
              '0 0 15px rgba(236,72,153,0.2), 0 0 30px rgba(236,72,153,0.1)',
          }}
        />

        {/* Content */}
        <div className="relative z-20 p-6">
          <AnimatePresence mode="wait">

            {/* ===== PHASE: WELCOME ===== */}
            {phase === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-lg mx-auto text-center space-y-6 py-8"
              >
                <div className="text-6xl">{'\u{1F9E0}'}</div>
                <h2 className="font-display text-2xl font-bold text-white">
                  Neural Network Builder
                </h2>
                <p className="font-body text-sm text-white/60">
                  {ageBand === 'C'
                    ? 'Design neural network architectures, configure hyperparameters, train on classification tasks, and analyze convergence behavior.'
                    : 'Build your own brain-like network! Add layers and neurons, train it on challenges, and watch it learn.'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Layers', 'Neurons', 'Weights', 'Training', 'Accuracy'].map(
                    (tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-xs font-body bg-pink-500/10 text-pink-300 border border-pink-500/20"
                      >
                        {tag}
                      </span>
                    )
                  )}
                </div>
                <motion.button
                  onClick={() => setPhase('learn')}
                  className="px-8 py-3 rounded-xl font-display font-bold text-white bg-gradient-to-r from-pink-500 to-pink-600 shadow-lg shadow-pink-500/25"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Start building neural networks"
                >
                  Start Building{' '}
                  <ChevronRight className="inline w-4 h-4 ml-1" />
                </motion.button>
              </motion.div>
            )}

            {/* ===== PHASE: LEARN ===== */}
            {phase === 'learn' && (
              <motion.div
                key="learn"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-lg mx-auto space-y-6 py-4"
              >
                <h3 className="font-display text-lg font-bold text-white text-center">
                  {ageBand === 'C'
                    ? 'Neural Network Architecture'
                    : 'What is a Neural Network?'}
                </h3>

                {[
                  {
                    icon: '\u{1F4E5}',
                    title: ageBand === 'C' ? 'Input Layer' : 'Inputs',
                    text:
                      ageBand === 'C'
                        ? 'Receives raw feature vectors. Dimensionality matches the input space.'
                        : 'Data goes in here \u2014 like pixels from a picture or numbers describing a color.',
                  },
                  {
                    icon: '\u{1F9F1}',
                    title: 'Hidden Layers',
                    text:
                      ageBand === 'C'
                        ? 'Transform representations through weighted sums and activation functions. Depth enables hierarchical feature extraction.'
                        : 'Secret layers that find patterns! More layers = the network can learn more complex things.',
                  },
                  {
                    icon: '\u26A1',
                    title:
                      ageBand === 'C'
                        ? 'Weights & Backpropagation'
                        : 'Connections',
                    text:
                      ageBand === 'C'
                        ? 'Weights adjust via gradient descent during training. The loss function guides optimization toward better predictions.'
                        : 'Lines between neurons carry signals. Training adjusts these connections to make better guesses.',
                  },
                  {
                    icon: '\u{1F3AF}',
                    title: ageBand === 'C' ? 'Output Layer' : 'Outputs',
                    text:
                      ageBand === 'C'
                        ? 'Produces class probabilities via softmax. The predicted class is the argmax of the output vector.'
                        : "The network\u2019s answer! Each output represents a possible answer.",
                  },
                ].map((card, i) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <span className="text-2xl">{card.icon}</span>
                    <div>
                      <h4 className="font-display text-sm font-bold text-white">
                        {card.title}
                      </h4>
                      <p className="font-body text-xs text-white/50 mt-1">
                        {card.text}
                      </p>
                    </div>
                  </motion.div>
                ))}

                <div className="text-center">
                  <motion.button
                    onClick={() => {
                      setPhase('build');
                      selectChallenge('digits');
                    }}
                    className="px-8 py-3 rounded-xl font-display font-bold text-white bg-gradient-to-r from-pink-500 to-pink-600"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Start building your network"
                  >
                    {"Let\u2019s Build!"} <Brain className="inline w-4 h-4 ml-1" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ===== PHASE: BUILD ===== */}
            {phase === 'build' && (
              <motion.div
                key="build"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Challenge selector */}
                <div className="flex gap-2 justify-center flex-wrap">
                  {CHALLENGES.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => selectChallenge(ch.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-all ${
                        challengeId === ch.id
                          ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                      aria-pressed={challengeId === ch.id}
                      aria-label={`Select ${ch.title} challenge`}
                    >
                      {ch.emoji} {ch.title}
                    </button>
                  ))}
                </div>

                <p className="font-body text-xs text-white/50 text-center max-w-md mx-auto">
                  {description}
                </p>

                {/* Controls row */}
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <button
                    onClick={addLayer}
                    disabled={layerSizes.length >= 6}
                    className="px-3 py-1.5 rounded-lg text-xs font-display font-bold bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-30"
                    aria-label="Add a hidden layer"
                  >
                    <Plus className="inline w-3 h-3 mr-1" /> Layer
                  </button>
                  <button
                    onClick={removeLayer}
                    disabled={layerSizes.length <= 2}
                    className="px-3 py-1.5 rounded-lg text-xs font-display font-bold bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-30"
                    aria-label="Remove a hidden layer"
                  >
                    <Minus className="inline w-3 h-3 mr-1" /> Layer
                  </button>
                  <button
                    onClick={toggleSound}
                    className="px-3 py-1.5 rounded-lg text-xs font-display bg-white/5 text-white/70 hover:bg-white/10"
                    aria-label={
                      soundEnabled
                        ? 'Mute network sounds'
                        : 'Enable network sounds'
                    }
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-3.5 h-3.5" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowChallenges(!showChallenges)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold ${
                      activeChallenge
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                    aria-label="Toggle architecture challenges"
                  >
                    <Target className="inline w-3 h-3 mr-1" /> Challenges
                  </button>
                  {ageBand === 'C' && (
                    <div className="flex items-center gap-2">
                      <label className="font-body text-[10px] text-white/40">
                        LR:
                      </label>
                      <input
                        type="range"
                        min="0.001"
                        max="0.1"
                        step="0.001"
                        value={learningRate}
                        onChange={(e) =>
                          setLearningRate(parseFloat(e.target.value))
                        }
                        className="w-20 accent-pink-500"
                        aria-label={`Learning rate: ${learningRate}`}
                      />
                      <span className="font-mono text-[10px] text-white/50">
                        {learningRate}
                      </span>
                    </div>
                  )}
                </div>

                {/* Architecture challenges drawer (V2) */}
                <AnimatePresence>
                  {showChallenges && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-2 max-w-md mx-auto p-3 rounded-xl bg-white/5 border border-white/10">
                        {ARCH_CHALLENGES.map((ch) => (
                          <button
                            key={ch.id}
                            onClick={() => startArchChallenge(ch)}
                            className="p-2 rounded-lg text-left bg-white/5 hover:bg-white/10 transition-all"
                            aria-label={`Start challenge: ${ch.title}`}
                          >
                            <p className="font-display text-xs font-bold text-amber-300">
                              {ch.title}
                            </p>
                            <p className="font-body text-[10px] text-white/40 mt-0.5">
                              {ch.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Active challenge indicator (V2) */}
                {activeChallenge && (
                  <div className="flex items-center justify-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-display font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {'\u{1F3AF}'}{' '}
                      {
                        ARCH_CHALLENGES.find((c) => c.id === activeChallenge)
                          ?.title
                      }
                    </span>
                    <button
                      onClick={() => setActiveChallenge(null)}
                      className="text-white/30 hover:text-white/60 text-xs"
                      aria-label="Cancel active challenge"
                    >
                      {'\u2715'}
                    </button>
                  </div>
                )}

                {/* Neuron controls per layer */}
                <div className="flex gap-2 justify-center flex-wrap">
                  {layerSizes.map((size, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5"
                    >
                      <span className="font-body text-[10px] text-white/40">
                        {i === 0
                          ? 'In'
                          : i === layerSizes.length - 1
                            ? 'Out'
                            : `H${i}`}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => adjustNeurons(i, -1)}
                          className="w-5 h-5 rounded bg-white/10 text-white/60 text-xs flex items-center justify-center"
                          aria-label={`Decrease neurons in layer ${i}`}
                        >
                          -
                        </button>
                        <span className="font-mono text-sm text-white w-6 text-center">
                          {size}
                        </span>
                        <button
                          onClick={() => adjustNeurons(i, 1)}
                          className="w-5 h-5 rounded bg-white/10 text-white/60 text-xs flex items-center justify-center"
                          aria-label={`Increase neurons in layer ${i}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats bar */}
                <div className="flex gap-4 justify-center text-center">
                  <div>
                    <p className="font-mono text-lg text-white font-bold">
                      {totalNeurons}
                    </p>
                    <p className="font-body text-[10px] text-white/40">
                      Neurons
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-lg text-white font-bold">
                      {totalConnections}
                    </p>
                    <p className="font-body text-[10px] text-white/40">
                      Connections
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-lg text-white font-bold">
                      {layerSizes.length}
                    </p>
                    <p className="font-body text-[10px] text-white/40">
                      Layers
                    </p>
                  </div>
                </div>

                {/* === [v3] 3D NETWORK VISUALIZATION === */}
                <NeuralNetwork3D
                  layerSizes={layerSizes}
                  network={network}
                  isTraining={isTraining}
                  trainEpoch={trainEpoch}
                  accuracy={accuracy}
                  complexity={complexity}
                  trainingProgress={trainingProgress}
                  dataFlowActive={dataFlowActive}
                  heartbeatPhase={heartbeatPhase}
                  selectedConnection={selectedConnection}
                  inspectedNode={inspectedNode}
                  onSelectConnection={setSelectedConnection}
                  onInspectNode={setInspectedNode}
                  labColor="#EC4899"
                  isMobile={isMobile}
                />

                {/* Node inspection panel */}
                {inspectedNodeData && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-white/5 border border-pink-500/20 max-w-xs mx-auto"
                  >
                    <p className="font-display text-xs font-bold text-white">
                      {'\u{1F9E0}'}{' '}
                      {inspectedNodeData.layer === 0
                        ? 'Input'
                        : inspectedNodeData.layer === layerSizes.length - 1
                          ? 'Output'
                          : 'Hidden'}{' '}
                      Neuron
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                      <div>
                        <p className="font-mono text-sm text-pink-300">
                          {inspectedNodeData.activation.toFixed(2)}
                        </p>
                        <p className="font-body text-[10px] text-white/40">
                          Activation
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-sm text-pink-300">
                          {inspectedNodeData.inputs}
                        </p>
                        <p className="font-body text-[10px] text-white/40">
                          Inputs
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-sm text-pink-300">
                          {inspectedNodeData.outputs}
                        </p>
                        <p className="font-body text-[10px] text-white/40">
                          Outputs
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Weight slider */}
                {selectedConnection && selectedConnData && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-white/5 border border-pink-500/20 max-w-xs mx-auto"
                  >
                    <p className="font-display text-xs font-bold text-white">
                      {'\u{1F517}'} Connection Weight
                    </p>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.01"
                      value={selectedConnData.weight}
                      onChange={(e) =>
                        handleWeightChange(
                          selectedConnection,
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full accent-pink-500 mt-2"
                      aria-label={`Weight: ${selectedConnData.weight}`}
                    />
                    <p className="font-mono text-xs text-white/50 text-center mt-1">
                      {selectedConnData.weight.toFixed(2)}
                    </p>
                    <button
                      onClick={() => setSelectedConnection(null)}
                      className="mt-2 text-xs text-white/30 hover:text-white/60"
                      aria-label="Close weight editor"
                    >
                      Close
                    </button>
                  </motion.div>
                )}

                {/* Train button */}
                <div className="text-center">
                  <motion.button
                    onClick={trainNetwork}
                    disabled={isTraining}
                    className="px-8 py-3 rounded-xl font-display font-bold text-white bg-gradient-to-r from-pink-500 to-pink-600 shadow-lg shadow-pink-500/25 disabled:opacity-50"
                    whileHover={!isTraining ? { scale: 1.05 } : {}}
                    whileTap={!isTraining ? { scale: 0.95 } : {}}
                    aria-label={
                      isTraining
                        ? 'Training in progress'
                        : 'Train your neural network'
                    }
                  >
                    {isTraining ? (
                      <span>
                        Training... Epoch {trainEpoch}/20 &mdash; {accuracy}%
                      </span>
                    ) : (
                      <span>
                        <Play className="inline w-4 h-4 mr-1" /> Train Network
                      </span>
                    )}
                  </motion.button>
                </div>

                {/* Training progress */}
                {isTraining && (
                  <div className="max-w-md mx-auto">
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-pink-500 to-pink-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${(trainEpoch / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Challenge result banner (V2) */}
                {challengeResult && !isTraining && accuracy > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-3 rounded-xl max-w-sm mx-auto text-center border ${
                      challengeResult.passed
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <p
                      className={`font-display text-sm font-bold ${
                        challengeResult.passed
                          ? 'text-green-300'
                          : 'text-red-300'
                      }`}
                    >
                      {challengeResult.passed
                        ? '\u2705 Challenge Complete!'
                        : '\u274C Not Quite...'}
                    </p>
                    <div className="flex gap-3 justify-center mt-2 text-[10px] font-mono">
                      <span
                        className={
                          challengeResult.meetsAcc
                            ? 'text-green-400'
                            : 'text-red-400'
                        }
                      >
                        {challengeResult.meetsAcc ? '\u2713' : '\u2717'} Acc: {accuracy}%
                        (need {challengeResult.challenge.targetAcc}%)
                      </span>
                      {challengeResult.challenge.maxNeurons && (
                        <span
                          className={
                            challengeResult.meetsNeurons
                              ? 'text-green-400'
                              : 'text-red-400'
                          }
                        >
                          {challengeResult.meetsNeurons ? '\u2713' : '\u2717'} Neurons:{' '}
                          {totalNeurons} (max{' '}
                          {challengeResult.challenge.maxNeurons})
                        </span>
                      )}
                      {challengeResult.challenge.maxLayers && (
                        <span
                          className={
                            challengeResult.meetsLayers
                              ? 'text-green-400'
                              : 'text-red-400'
                          }
                        >
                          {challengeResult.meetsLayers ? '\u2713' : '\u2717'} Layers:{' '}
                          {layerSizes.length} (max{' '}
                          {challengeResult.challenge.maxLayers})
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Loss curve (Band C only) */}
                {ageBand === 'C' && lossHistory.length > 0 && (
                  <div className="max-w-md mx-auto p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="font-display text-xs font-bold text-white mb-2">
                      {'\u{1F4C9}'} Loss Curve
                    </p>
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={lossHistory}>
                        <XAxis
                          dataKey="epoch"
                          stroke="#ffffff30"
                          fontSize={9}
                        />
                        <YAxis stroke="#ffffff30" fontSize={9} />
                        <Tooltip
                          contentStyle={{
                            background: '#1a1a2e',
                            border: '1px solid #EC4899',
                            fontSize: 10,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="loss"
                          stroke="#EC4899"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="acc"
                          stroke="#22c55e"
                          strokeWidth={1}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Go to test (only if trained) */}
                {accuracy > 0 && !isTraining && (
                  <div className="text-center">
                    <motion.button
                      onClick={() => {
                        setTestIdx(0);
                        setTestResults([]);
                        if (challenge.drawMode) initCanvas();
                        setPhase('test');
                      }}
                      className="px-6 py-2 rounded-xl font-display font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Test your trained network"
                    >
                      Test It! <Zap className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ===== PHASE: TEST ===== */}
            {phase === 'test' && (
              <motion.div
                key="test"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-md mx-auto space-y-4 py-4"
              >
                <h3 className="font-display text-lg font-bold text-white text-center">
                  {'\u{1F52C}'} Test Your Network
                </h3>

                {challenge.drawMode && showCanvas && (
                  <div className="flex flex-col items-center gap-3">
                    <canvas
                      ref={canvasRef}
                      width={200}
                      height={200}
                      className="rounded-xl border-2 border-pink-500/30 cursor-crosshair touch-none"
                      onPointerDown={handleCanvasPointerDown}
                      onPointerMove={handleCanvasPointerMove}
                      onPointerUp={handleCanvasPointerUp}
                      onPointerLeave={handleCanvasPointerUp}
                      aria-label="Drawing canvas — draw a digit for the network to recognize"
                    />
                    <button
                      onClick={clearCanvas}
                      className="px-3 py-1 rounded-lg text-xs font-display bg-white/10 text-white/60"
                      aria-label="Clear canvas"
                    >
                      <RotateCcw className="inline w-3 h-3 mr-1" /> Clear
                    </button>
                  </div>
                )}

                {testIdx < challenge.testItems.length && (
                  <div className="text-center space-y-3">
                    <div className="text-5xl">
                      {challenge.testItems[testIdx].emoji}
                    </div>
                    <p className="font-body text-sm text-white/60">
                      {challenge.testItems[testIdx].label}
                    </p>
                    <motion.button
                      onClick={runTest}
                      className="px-6 py-2 rounded-xl font-display font-bold text-white bg-gradient-to-r from-pink-500 to-pink-600"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Run prediction on this item"
                    >
                      Predict! <Brain className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </div>
                )}

                <div className="flex gap-2 justify-center flex-wrap">
                  {testResults.map((r, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                        r.correct
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {r.correct ? '\u2713' : '\u2717'}
                    </div>
                  ))}
                </div>

                <p className="font-body text-xs text-white/40 text-center">
                  {testIdx}/{challenge.testItems.length} tested &mdash;{' '}
                  {testAccuracy}% accuracy
                </p>
              </motion.div>
            )}

            {/* ===== PHASE: REPORT ===== */}
            {phase === 'report' && (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-lg mx-auto space-y-6 py-4 text-center"
              >
                <div className="text-5xl">{'\u{1F3C6}'}</div>
                <h3 className="font-display text-xl font-bold text-white">
                  Network Report
                </h3>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="font-display text-sm font-bold text-white mb-3">
                    Architecture
                  </p>
                  <div className="flex gap-2 justify-center">
                    {layerSizes.map((s, i) => (
                      <div
                        key={i}
                        className="px-3 py-2 rounded-lg bg-pink-500/10 border border-pink-500/20"
                      >
                        <p className="font-mono text-lg text-white font-bold">
                          {s}
                        </p>
                        <p className="font-body text-[10px] text-white/40">
                          {i === 0
                            ? 'In'
                            : i === layerSizes.length - 1
                              ? 'Out'
                              : `H${i}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-6 justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full border-4 border-pink-500 flex items-center justify-center">
                      <span className="font-mono text-xl text-white font-bold">
                        {accuracy}%
                      </span>
                    </div>
                    <p className="font-body text-xs text-white/40 mt-2">
                      Train Accuracy
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full border-4 border-emerald-500 flex items-center justify-center">
                      <span className="font-mono text-xl text-white font-bold">
                        {testAccuracy}%
                      </span>
                    </div>
                    <p className="font-body text-xs text-white/40 mt-2">
                      Test Accuracy
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left">
                  <p className="font-display text-sm font-bold text-white mb-2">
                    <GraduationCap className="inline w-4 h-4 mr-1" /> What You
                    Learned
                  </p>
                  <ul className="space-y-1">
                    {[
                      'Neural networks have layers of connected neurons',
                      'More layers can learn more complex patterns',
                      'Training adjusts weights to improve accuracy',
                      ageBand === 'C'
                        ? 'Learning rate controls step size during gradient descent'
                        : 'The network gets smarter with each training round',
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="font-body text-xs text-white/50 flex gap-2"
                      >
                        <span className="text-pink-400">{'\u2726'}</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <motion.button
                  onClick={handleReplay}
                  className="px-6 py-2 rounded-xl font-display font-bold text-white bg-gradient-to-r from-pink-500 to-pink-600"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Try another challenge"
                >
                  <RotateCcw className="inline w-4 h-4 mr-1" /> Try Again
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </GameShell>
  );
}

export default NeuralBuilderGame;
