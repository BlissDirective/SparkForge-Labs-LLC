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
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';

import { useSceneStore } from '@/stores/sceneStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { useUIStore } from '@/stores/uiStore';
import { useNetworkAudio } from '@/hooks/useNetworkAudio';
import {
  Brain, Zap, ChevronRight, Plus, Minus, Play,
  RotateCcw, GraduationCap, Target, Volume2, VolumeX,
} from 'lucide-react';
import { useAIContent } from '@/hooks/useAIContent';
import { ResponsiveLine } from '@nivo/line';

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

// ================================================================
// DATA: Band A Challenges (Ages 7–9 — simplified brain-building)
// ================================================================

const BAND_A_CHALLENGES: Challenge[] = [
  {
    id: 'connect-dots',
    title: 'Connect the Dots',
    emoji: '\u{1F9E0}',
    description: 'Connect colorful brain cells to make a thinking path! More connections make a smarter brain!',
    descriptionC: '',
    inputLabels: ['Start', 'Start'],
    outputLabels: ['End', 'End'],
    startLayers: [2, 3, 2],
    optimalLayers: [2, 4, 2],
    drawMode: false,
    testItems: [
      { emoji: '\u{2B50}', answer: 0, label: 'Path A' },
      { emoji: '\u{1F31F}', answer: 1, label: 'Path B' },
    ],
  },
  {
    id: 'simple-brain',
    title: 'Build a Simple Brain',
    emoji: '\u{1F9E9}',
    description: 'Stack layers of brain cells to build a thinking machine! More layers help it think harder!',
    descriptionC: '',
    inputLabels: ['Eye', 'Ear'],
    outputLabels: ['Happy', 'Sad', 'Surprised'],
    startLayers: [2, 3, 3],
    optimalLayers: [2, 4, 3],
    drawMode: false,
    testItems: [
      { emoji: '\u{1F60A}', answer: 0, label: 'Happy Face' },
      { emoji: '\u{1F622}', answer: 1, label: 'Sad Face' },
      { emoji: '\u{1F632}', answer: 2, label: 'Surprised Face' },
    ],
  },
  {
    id: 'color-sorter',
    title: 'Color Sorter',
    emoji: '\u{1F308}',
    description: 'Feed colored balls into your brain and watch them come out sorted! Can your brain learn which color goes where?',
    descriptionC: '',
    inputLabels: ['Color In'],
    outputLabels: ['\u{1F534} Red', '\u{1F535} Blue', '\u{1F7E2} Green'],
    startLayers: [1, 3, 3],
    optimalLayers: [1, 4, 3],
    drawMode: false,
    testItems: [
      { emoji: '\u{1F534}', answer: 0, label: 'Red Ball' },
      { emoji: '\u{1F535}', answer: 1, label: 'Blue Ball' },
      { emoji: '\u{1F7E2}', answer: 2, label: 'Green Ball' },
    ],
  },
];

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
  // === NEW CHALLENGES (Phase D expansion) ===
  {
    id: 'sounds',
    title: 'Sound Recognizer',
    emoji: '\u{1F3B5}',
    description: 'Build a network that recognizes musical instruments from their sound waves!',
    descriptionC: 'Audio waveform classification. Input features represent frequency-domain spectral coefficients (MFCCs). The network maps acoustic features to instrument categories.',
    inputLabels: ['Freq 1', 'Freq 2', 'Freq 3', 'Freq 4', 'Freq 5', 'Freq 6', 'Freq 7', 'Freq 8'],
    outputLabels: ['\u{1F3B8} Guitar', '\u{1F3B9} Piano', '\u{1F941} Drums', '\u{1F3BB} Violin'],
    startLayers: [8, 6, 4],
    optimalLayers: [8, 12, 4],
    drawMode: false,
    testItems: [
      { emoji: '\u{1F3B8}', answer: 0, label: 'Guitar strum' },
      { emoji: '\u{1F3B9}', answer: 1, label: 'Piano chord' },
      { emoji: '\u{1F941}', answer: 2, label: 'Drum beat' },
      { emoji: '\u{1F3BB}', answer: 3, label: 'Violin note' },
    ],
  },
  {
    id: 'emotions',
    title: 'Emotion Detector',
    emoji: '\u{1F60A}',
    description: 'Build a network that reads facial expressions and identifies emotions!',
    descriptionC: 'Facial expression classification with 6 emotion classes. Input features represent facial landmarks (brow angle, mouth curvature, eye openness). Deeper architectures capture subtle expression combinations.',
    inputLabels: ['Brow', 'Eyes', 'Mouth', 'Cheeks', 'Nose', 'Forehead', 'Jaw', 'L-Eye', 'R-Eye', 'Chin'],
    outputLabels: ['\u{1F60A} Happy', '\u{1F622} Sad', '\u{1F620} Angry', '\u{1F632} Surprised', '\u{1F628} Scared', '\u{1F914} Confused'],
    startLayers: [10, 6, 6],
    optimalLayers: [10, 8, 8, 6],
    drawMode: false,
    testItems: [
      { emoji: '\u{1F60A}', answer: 0, label: 'Smiling face' },
      { emoji: '\u{1F622}', answer: 1, label: 'Crying face' },
      { emoji: '\u{1F620}', answer: 2, label: 'Frowning face' },
      { emoji: '\u{1F632}', answer: 3, label: 'Wide-eyed face' },
      { emoji: '\u{1F628}', answer: 4, label: 'Fearful face' },
      { emoji: '\u{1F914}', answer: 5, label: 'Puzzled face' },
    ],
  },
  {
    id: 'animals',
    title: 'Animal Identifier',
    emoji: '\u{1F43E}',
    description: 'Build a network that identifies animals from their silhouettes!',
    descriptionC: 'Silhouette-based species classification. Input features encode boundary shape descriptors (Fourier descriptors, aspect ratio, compactness, symmetry).',
    inputLabels: ['Shape 1', 'Shape 2', 'Shape 3', 'Shape 4', 'Ratio', 'Sym', 'Compact', 'Size'],
    outputLabels: ['\u{1F431} Cat', '\u{1F436} Dog', '\u{1F426} Bird', '\u{1F41F} Fish', '\u{1F40D} Snake'],
    startLayers: [8, 6, 5],
    optimalLayers: [8, 10, 5],
    drawMode: false,
    testItems: [
      { emoji: '\u{1F431}', answer: 0, label: 'Cat silhouette' },
      { emoji: '\u{1F436}', answer: 1, label: 'Dog silhouette' },
      { emoji: '\u{1F426}', answer: 2, label: 'Bird silhouette' },
      { emoji: '\u{1F41F}', answer: 3, label: 'Fish silhouette' },
      { emoji: '\u{1F40D}', answer: 4, label: 'Snake silhouette' },
    ],
  },
  {
    id: 'text',
    title: 'Text Classifier',
    emoji: '\u{1F4DD}',
    description: 'Build a network that classifies sentences by their type — questions, statements, exclamations, and commands!',
    descriptionC: 'Sentence-type classification from syntactic features. Input encodes punctuation type, word count, first-word POS tag, verb mood, and token statistics. Requires deeper architecture for nuanced classification.',
    inputLabels: ['Punct', 'Words', 'POS-1', 'Verb', 'Cap', 'Len', 'Q-word', 'Subj', 'Has-!', 'Has-?', 'Imp', 'Tone'],
    outputLabels: ['\u2753 Question', '\u{1F4AC} Statement', '\u2757 Exclamation', '\u{1F449} Command'],
    startLayers: [12, 6, 4],
    optimalLayers: [12, 8, 6, 4],
    drawMode: false,
    testItems: [
      { emoji: '\u2753', answer: 0, label: '"What is AI?"' },
      { emoji: '\u{1F4AC}', answer: 1, label: '"AI learns from data."' },
      { emoji: '\u2757', answer: 2, label: '"Wow, that\'s amazing!"' },
      { emoji: '\u{1F449}', answer: 3, label: '"Train the model now."' },
    ],
  },
  {
    id: 'weather',
    title: 'Weather Predictor',
    emoji: '\u26C5',
    description: 'Build a network that predicts weather from temperature, humidity, and wind data!',
    descriptionC: 'Multi-variate regression/classification from meteorological features. Three continuous inputs mapped to 5 weather classes. Demonstrates how simple features combine for complex predictions.',
    inputLabels: ['Temp', 'Humidity', 'Wind'],
    outputLabels: ['\u2600\uFE0F Sunny', '\u{1F327}\uFE0F Rain', '\u2744\uFE0F Snow', '\u2601\uFE0F Cloudy', '\u26C8\uFE0F Storm'],
    startLayers: [3, 4, 5],
    optimalLayers: [3, 8, 5],
    drawMode: false,
    testItems: [
      { emoji: '\u2600\uFE0F', answer: 0, label: 'Hot & dry' },
      { emoji: '\u{1F327}\uFE0F', answer: 1, label: 'Warm & humid' },
      { emoji: '\u2744\uFE0F', answer: 2, label: 'Cold & wet' },
      { emoji: '\u2601\uFE0F', answer: 3, label: 'Cool & calm' },
      { emoji: '\u26C8\uFE0F', answer: 4, label: 'Hot & windy' },
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
  // === NEW ARCHITECTURE TESTS (Phase D expansion) ===
  {
    id: 'overfitter',
    title: 'The Overfitter',
    description: 'Build the LARGEST network possible (max layers, max neurons) and observe overfitting',
    requireChallenge: 'shapes',
    targetAcc: 70,
  },
  {
    id: 'underfitter',
    title: 'The Underfitter',
    description: 'Build the SMALLEST network (1 hidden layer, 2 neurons) and see what happens',
    requireChallenge: 'colors',
    targetAcc: 50,
    maxNeurons: 5,
    maxLayers: 2,
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Reach 80%+ accuracy with the FEWEST total neurons possible',
    requireChallenge: 'digits',
    targetAcc: 80,
    maxNeurons: 20,
  },
  {
    id: 'memory-master',
    title: 'Memory Master',
    description: 'Achieve the highest accuracy on Weather Predictor — the most complex challenge',
    requireChallenge: 'weather',
    targetAcc: 92,
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

// ================================================================
// MAIN COMPONENT
// ================================================================

export function NeuralBuilderGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  // Band A uses simplified challenges; B/C use full challenges
  const availableChallenges = ageBand === 'A' ? BAND_A_CHALLENGES : CHALLENGES;

  // Phase F: AI-generated random challenge
  const _aiChallenge = useAIContent('neural-builder', 'neural-challenge', ageBand);

  // --- Phase ---
  const [phase, setPhase] = useState<Phase>('welcome');
  const [challengeId, setChallengeId] = useState(ageBand === 'A' ? 'connect-dots' : 'digits');

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

  // Band C advanced hyperparameters (Phase D expansion)
  const [activationFn, setActivationFn] = useState<'relu' | 'sigmoid' | 'tanh'>('relu');
  const [dropoutRate, setDropoutRate] = useState(0);
  const [batchSize, setBatchSize] = useState(32);

  // Competition mode (Phase D expansion)
  const [competitionMode, setCompetitionMode] = useState(false);
  const [bestAccuracy, setBestAccuracy] = useState(0);

  // Band A star rating (visual-only, no percentage)
  const starRating = ageBand === 'A' ? Math.min(5, Math.max(1, Math.round(accuracy / 20))) : 0;

  // --- Test state ---
  const [testIdx, setTestIdx] = useState(0);
  const [testResults, setTestResults] = useState<
    { correct: boolean; predicted: number; confidence: number }[]
  >([]);
  const [showCanvas, setShowCanvas] = useState(false);

  // --- Canvas ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  // BUG-NB5: timeout ref for cleanup on unmount
  const testTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Audio (V2 Enhancement) ---
  const audio = useNetworkAudio();
  const [soundEnabled, setSoundEnabled] = useState(false);
  // BUG-NB7: limit concurrent audio events to prevent distortion
  const activeAudioCount = useRef(0);
  const MAX_CONCURRENT_AUDIO = 3;

  // P1: Cockpit broadcast integration
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  // P4: CeremonyFX milestones
  const triggerCelebration = useUIStore((s) => s.triggerCelebration);

  // --- Architecture challenges (V2 Enhancement) ---
  const [showChallenges, setShowChallenges] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<string | null>(null);

  // --- Heartbeat (V2 Enhancement) ---
  const [heartbeatPhase, setHeartbeatPhase] = useState(0);

  // S6-CRIT-002: Register 3D scene content with sceneStore (D3D-B1)
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  useEffect(() => {
    setGameSceneContent(
      <NeuralNetwork3D
        layerSizes={layerSizes}
        network={network}
        isTraining={isTraining}
        trainEpoch={trainEpoch}
        accuracy={accuracy}
        complexity={layerSizes.length / 5}
        trainingProgress={trainEpoch / 50}
        dataFlowActive={dataFlowActive}
        heartbeatPhase={heartbeatPhase}
        selectedConnection={selectedConnection}
        inspectedNode={inspectedNode}
        onSelectConnection={setSelectedConnection}
        onInspectNode={setInspectedNode}
        labColor="#FF66AA"
      />
    );
    return () => setGameSceneContent(null);
  }, [layerSizes, network, isTraining, trainEpoch, accuracy, dataFlowActive, heartbeatPhase, selectedConnection, inspectedNode, setGameSceneContent]);

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
    () => availableChallenges.find((c) => c.id === challengeId) || availableChallenges[0],
    [challengeId, availableChallenges]
  );
  const description =
    ageBand === 'C' ? challenge.descriptionC : challenge.description;
  const totalNeurons = layerSizes.reduce((a, b) => a + b, 0);
  const totalConnections = network.connections.length;
  const _complexity = Math.min(1, totalNeurons / 40);
  const _trainingProgress = accuracy / 100;

  // --- Heartbeat animation (V2 Enhancement) ---
  // BUG-NB6 fix: continue heartbeat during training at increased speed
  useEffect(() => {
    if (phase !== 'build' && phase !== 'train') return;
    const speed = isTraining ? 0.04 : 0.015;
    const interval = setInterval(() => {
      setHeartbeatPhase((prev) => (prev + speed) % 1);
    }, 50);
    return () => clearInterval(interval);
  }, [isTraining, phase]);

  // BUG-NB5: cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (testTimeoutRef.current) clearTimeout(testTimeoutRef.current);
    };
  }, []);

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
    const ch = availableChallenges.find((c) => c.id === id) || CHALLENGES.find((c) => c.id === id);
    if (!ch) return;
    setChallengeId(id);
    // BUG-NB8 fix: clear canvas when switching challenges
    clearCanvas();
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
    // BUG-NB2 fix: normalize by sum of optimal neurons, not totalNeurons
    const optimalNeuronSum = challenge.optimalLayers.reduce((a, b) => a + b, 0);
    const optimalMatch =
      layerSizes.length === challenge.optimalLayers.length
        ? layerSizes.reduce(
            (sum, s, i) => sum + Math.abs(s - challenge.optimalLayers[i]),
            0
          ) / optimalNeuronSum
        : 0.5;
    // BUG-NB1 fix: architecture-dependent training curve
    const archQuality = 1 - Math.min(1, optimalMatch);
    const maxAcc = Math.min(98, 60 + archQuality * 38);
    // Good arch: fast convergence, low noise. Bad arch: slow start, high noise, possible divergence.
    let convergenceRate = 0.5 + archQuality * 0.5; // 0.5 (bad) to 1.0 (good)
    let noiseLevel = 2 + (1 - archQuality) * 8; // 2 (good) to 10 (bad)
    const plateauEpoch = Math.floor(epochs * (0.3 + archQuality * 0.5)); // early plateau for bad arch

    // Band C hyperparameter effects on training curve
    if (ageBand === 'C') {
      // Activation function affects convergence
      if (activationFn === 'sigmoid') { convergenceRate *= 0.75; noiseLevel *= 0.8; } // smooth but slow
      else if (activationFn === 'tanh') { convergenceRate *= 0.9; noiseLevel *= 0.9; } // balanced
      // Dropout reduces overfitting, adds noise
      if (dropoutRate > 0) { noiseLevel *= (1 + dropoutRate * 0.3); }
      // Batch size: small = noisy, large = smooth
      if (batchSize <= 8) { noiseLevel *= 1.3; } else if (batchSize >= 128) { noiseLevel *= 0.6; }
    }

    let prevAcc = 0;
    for (let e = 1; e <= epochs; e++) {
      await new Promise((r) => setTimeout(r, 600));
      // BUG-NB1 fix: architecture-dependent convergence curve
      const progress = e / epochs;
      const curvedProgress = e <= plateauEpoch
        ? Math.pow(progress / (plateauEpoch / epochs), convergenceRate)
        : 1.0;
      const noise = (Math.random() - 0.5) * noiseLevel;
      const acc = Math.min(maxAcc, Math.max(0, curvedProgress * maxAcc + noise));
      const loss = Math.max(
        0.01,
        2.0 - curvedProgress * 1.9 + (Math.random() - 0.5) * (1 - archQuality) * 0.5
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
          // BUG-NB3 fix: calculate sparkIntensity from raw delta before clamping
          const rawDelta = (Math.random() - 0.5) * learningRate * 2;
          const newWeight = parseFloat(
            (c.weight + rawDelta).toFixed(2)
          );
          return {
            ...c,
            prevWeight: c.weight,
            weight: Math.max(-1, Math.min(1, newWeight)),
            sparkIntensity: Math.abs(rawDelta),
          };
        }),
      }));

      // Sound feedback (V2 Enhancement)
      // BUG-NB7 fix: limit concurrent audio to prevent queuing/distortion
      if (soundEnabled && activeAudioCount.current < MAX_CONCURRENT_AUDIO) {
        activeAudioCount.current++;
        audio.playEpochChord(e, epochs, acc);
        if (e % 3 === 0) {
          audio.playActivation(e % layerSizes.length, layerSizes.length);
        }
        setTimeout(() => { activeAudioCount.current = Math.max(0, activeAudioCount.current - 1); }, 400);
      }
      // P1: Broadcast training progress to cockpit
      if (e % 5 === 0) {
        broadcast({ type: 'dial-rotate', source: 'neural-builder', value: acc / 100, color: '#EC4899' });
      }
      // P4: Milestone celebrations at 50%, 75%, 90%
      if ((acc >= 50 && prevAcc < 50) || (acc >= 75 && prevAcc < 75) || (acc >= 90 && prevAcc < 90)) {
        broadcast({ type: 'celebration-start', source: 'neural-builder', value: acc, color: '#EC4899' });
        triggerCelebration(acc >= 90 ? 'streak' : 'confetti');
      }
      prevAcc = acc;
    }

    if (soundEnabled) audio.playComplete();
    broadcast({ type: 'celebration-start', source: 'neural-builder', value: 1, color: '#EC4899' });
    setIsTraining(false);
    setDataFlowActive(false);
    game.updateScore(Math.round(maxAcc / 10) * 5);
    // Track best accuracy for competition mode
    if (accuracy > bestAccuracy) setBestAccuracy(Math.round(maxAcc));
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
      // BUG-NB5 fix: store timeout ref for cleanup on unmount
      testTimeoutRef.current = setTimeout(() => {
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
                  {ageBand === 'A'
                    ? 'Build a thinking brain! Stack colorful brain cells and watch your creation learn!'
                    : ageBand === 'C'
                      ? 'Design neural network architectures, configure hyperparameters, train on classification tasks, and analyze convergence behavior.'
                      : 'Build your own brain-like network! Add layers and neurons, train it on challenges, and watch it learn.'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {(ageBand === 'A'
                    ? ['Brain Cells', 'Connections', 'Learning', 'Stars']
                    : ['Layers', 'Neurons', 'Weights', 'Training', 'Accuracy']
                  ).map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs font-body bg-pink-500/10 text-pink-300 border border-pink-500/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Competition mode toggle (Band B/C only) */}
                {ageBand !== 'A' && (
                  <button
                    onClick={() => setCompetitionMode(!competitionMode)}
                    className={`px-4 py-2 rounded-lg font-display text-xs border transition-colors ${
                      competitionMode
                        ? 'bg-yellow-500/10 border-yellow-400/30 text-yellow-300'
                        : 'bg-white/[0.02] border-white/10 text-white/30 hover:text-white/50'
                    }`}
                    aria-label={`Competition mode: ${competitionMode ? 'on' : 'off'}. Beat the benchmark for bronze/silver/gold tiers.`}
                    aria-pressed={competitionMode}
                  >
                    {'\u{1F3C6}'} Beat the Benchmark {competitionMode ? '(ON)' : '(OFF)'}
                  </button>
                )}

                <motion.button
                  onClick={() => setPhase('learn')}
                  className="px-8 py-3 rounded-xl font-display font-bold text-white bg-gradient-to-r from-pink-500 to-pink-600 shadow-lg shadow-pink-500/25"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Start building neural networks"
                >
                  {ageBand === 'A' ? 'Build a Brain!' : 'Start Building'}{' '}
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
                  {ageBand === 'A'
                    ? 'How Does a Brain Work?'
                    : ageBand === 'C'
                      ? 'Neural Network Architecture'
                      : 'What is a Neural Network?'}
                </h3>

                {[
                  {
                    icon: '\u{1F4E5}',
                    title: ageBand === 'A' ? 'Eyes & Ears' : ageBand === 'C' ? 'Input Layer' : 'Inputs',
                    text:
                      ageBand === 'A'
                        ? 'Your brain gets information through your eyes and ears. Our brain machine gets info the same way!'
                        : ageBand === 'C'
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
                      <label className="font-body text-2xs text-white/40">
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
                      <span className="font-mono text-2xs text-white/50">
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
                            <p className="font-body text-2xs text-white/40 mt-0.5">
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
                    <span className="px-2 py-0.5 rounded text-2xs font-display font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
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
                      <span className="font-body text-2xs text-white/40">
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
                    <p className="font-body text-2xs text-white/40">
                      Neurons
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-lg text-white font-bold">
                      {totalConnections}
                    </p>
                    <p className="font-body text-2xs text-white/40">
                      Connections
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-lg text-white font-bold">
                      {layerSizes.length}
                    </p>
                    <p className="font-body text-2xs text-white/40">
                      Layers
                    </p>
                  </div>
                </div>

                {/* BUG-NB4 fix: Removed duplicate inline NeuralNetwork3D.
                   3D network renders via sceneStore registration (line ~305) inside CockpitCanvas per D3D-B1. */}

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
                        <p className="font-body text-2xs text-white/40">
                          Activation
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-sm text-pink-300">
                          {inspectedNodeData.inputs}
                        </p>
                        <p className="font-body text-2xs text-white/40">
                          Inputs
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-sm text-pink-300">
                          {inspectedNodeData.outputs}
                        </p>
                        <p className="font-body text-2xs text-white/40">
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
                        {ageBand === 'A'
                          ? `Feeding brain... ${'\u2B50}'.repeat(starRating)}`
                          : `Training... Epoch ${trainEpoch}/20 \u2014 ${accuracy}%`}
                      </span>
                    ) : (
                      <span>
                        <Play className="inline w-4 h-4 mr-1" /> {ageBand === 'A' ? 'Feed Your Brain!' : 'Train Network'}
                      </span>
                    )}
                  </motion.button>
                </div>

                {/* Band C: Hyperparameter controls (Phase D expansion) */}
                {ageBand === 'C' && !isTraining && (
                  <div className="grid grid-cols-2 gap-2 mt-3" role="group" aria-label="Hyperparameter controls">
                    <div className="rounded-lg p-2 bg-white/[0.02] border border-white/5">
                      <p className="font-body text-2xs text-white/30 mb-1">Activation Function</p>
                      <select
                        value={activationFn}
                        onChange={(e) => setActivationFn(e.target.value as 'relu' | 'sigmoid' | 'tanh')}
                        className="w-full bg-black/30 text-white text-xs rounded px-2 py-1 border border-white/10 outline-none"
                        aria-label="Select activation function"
                      >
                        <option value="relu">ReLU (fast)</option>
                        <option value="sigmoid">Sigmoid (smooth)</option>
                        <option value="tanh">Tanh (centered)</option>
                      </select>
                    </div>
                    <div className="rounded-lg p-2 bg-white/[0.02] border border-white/5">
                      <p className="font-body text-2xs text-white/30 mb-1">Dropout</p>
                      <select
                        value={dropoutRate}
                        onChange={(e) => setDropoutRate(Number(e.target.value))}
                        className="w-full bg-black/30 text-white text-xs rounded px-2 py-1 border border-white/10 outline-none"
                        aria-label="Select dropout rate"
                      >
                        <option value={0}>Off</option>
                        <option value={0.25}>25%</option>
                        <option value={0.5}>50%</option>
                      </select>
                    </div>
                    <div className="rounded-lg p-2 bg-white/[0.02] border border-white/5">
                      <p className="font-body text-2xs text-white/30 mb-1">Learning Rate</p>
                      <input
                        type="range"
                        min={0.001}
                        max={0.1}
                        step={0.001}
                        value={learningRate}
                        onChange={(e) => setLearningRate(Number(e.target.value))}
                        className="w-full accent-pink-400"
                        aria-label={`Learning rate: ${learningRate}`}
                      />
                      <p className="font-data text-2xs text-pink-300 text-center">{learningRate.toFixed(3)}</p>
                    </div>
                    <div className="rounded-lg p-2 bg-white/[0.02] border border-white/5">
                      <p className="font-body text-2xs text-white/30 mb-1">Batch Size</p>
                      <select
                        value={batchSize}
                        onChange={(e) => setBatchSize(Number(e.target.value))}
                        className="w-full bg-black/30 text-white text-xs rounded px-2 py-1 border border-white/10 outline-none"
                        aria-label="Select batch size"
                      >
                        <option value={1}>1 (SGD)</option>
                        <option value={8}>8</option>
                        <option value={32}>32</option>
                        <option value={128}>128</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Competition mode benchmark display */}
                {competitionMode && !isTraining && accuracy > 0 && (
                  <div className="mt-2 rounded-lg p-2 bg-yellow-500/5 border border-yellow-500/20 text-center">
                    <p className="font-body text-xs text-yellow-300">
                      {'\u{1F3C6}'} Benchmark: {challenge.optimalLayers.length <= 3 ? '85%' : '80%'} |
                      Your best: {bestAccuracy}% |
                      {bestAccuracy >= (challenge.optimalLayers.length <= 3 ? 95 : 90) ? ' \u{1F947} Gold!'
                        : bestAccuracy >= (challenge.optimalLayers.length <= 3 ? 90 : 85) ? ' \u{1F948} Silver!'
                          : bestAccuracy >= (challenge.optimalLayers.length <= 3 ? 85 : 80) ? ' \u{1F949} Bronze!'
                            : ' Keep training!'}
                    </p>
                  </div>
                )}

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
                    <div className="flex gap-3 justify-center mt-2 text-2xs font-mono">
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
                    <div style={{ height: 120 }}>
                      <ResponsiveLine
                        data={[
                          {
                            id: 'loss',
                            data: lossHistory.map((d) => ({ x: d.epoch, y: d.loss })),
                          },
                          {
                            id: 'acc',
                            data: lossHistory.map((d) => ({ x: d.epoch, y: d.acc })),
                          },
                        ]}
                        colors={['#EC4899', '#22c55e']}
                        lineWidth={2}
                        enablePoints={false}
                        enableGridX={false}
                        enableGridY={false}
                        axisBottom={{
                          tickSize: 3,
                          tickPadding: 3,
                        }}
                        axisLeft={{
                          tickSize: 3,
                          tickPadding: 3,
                        }}
                        theme={{
                          axis: {
                            ticks: { text: { fill: '#ffffff30', fontSize: 9 } },
                          },
                          tooltip: {
                            container: {
                              background: '#1a1a2e',
                              border: '1px solid #EC4899',
                              fontSize: 10,
                            },
                          },
                        }}
                        margin={{ top: 5, right: 10, bottom: 25, left: 30 }}
                        curve="monotoneX"
                      />
                    </div>
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
                        <p className="font-body text-2xs text-white/40">
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
