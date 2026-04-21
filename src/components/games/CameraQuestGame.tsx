'use client';

// ================================================================
// CAMERA QUEST V2 — Lab 7 (Computer Vision) — FLAGSHIP-LITE
// [v3] Decision 6.5: Tier 2 Enhanced 3D (polaroid cards + gauge)
//
// FEATURES:
// 1. Polaroid-style scavenger hunt cards that flip when found
// 2. Photo gallery with trophy frames
// 3. Difficulty progression: colors -> shapes -> abstract
// 4. AI confidence simulation meter
// 5. Privacy-first: no images stored, clear consent messaging
// 6. Welcome phase, learn phase, chrome bezel
// 7. Manual fallback for no-camera devices
// 8. [v3] 3D polaroid cards + confidence gauge on desktop
// ================================================================

import { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useGameContent } from '@/hooks/useContent';
import { useSceneStore } from '@/stores/sceneStore';
import {
  Camera, Check, X, Eye, Lock, Star,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { useFilteredContent } from '@/hooks/useFilteredContent';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';

// [v3] Dynamic import — SSR disabled for R3F [ENH-1: loading fallback]
const CameraQuest3D = dynamic(
  () => import('@/components/3d/CameraQuest3D'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-32 rounded-xl bg-cyan-500/5 animate-pulse flex items-center justify-center">
        <span className="text-cyan-400/30 text-xs font-body">Loading 3D...</span>
      </div>
    ),
  }
);

type Phase = 'welcome' | 'learn' | 'hunt' | 'complete';

interface HuntItem {
  text: string;
  emoji: string;
  category: 'color' | 'shape' | 'abstract';
  difficulty: 1 | 2 | 3;
  hintA: string;
  hintC: string;
  simConfidence: number;
  isAI?: boolean;
}

const HUNT_ITEMS: HuntItem[] = [
  // Easy — colors
  {
    text: 'Something RED',
    emoji: '\u{1F534}',
    category: 'color',
    difficulty: 1,
    simConfidence: 92,
    hintA: 'Look for a red toy, book, or cup!',
    hintC: 'Color detection uses HSV space \u2014 red occupies H:0-10 and H:170-180. Saturation threshold matters.',
  },
  {
    text: 'Something BLUE',
    emoji: '\u{1F535}',
    category: 'color',
    difficulty: 1,
    simConfidence: 89,
    hintA: 'The sky, a pen, or a shirt!',
    hintC: 'Blue channel isolation in RGB. Sky detection uses semantic segmentation.',
  },
  {
    text: 'Something GREEN',
    emoji: '\u{1F7E2}',
    category: 'color',
    difficulty: 1,
    simConfidence: 87,
    hintA: 'A plant, a crayon, or some food!',
    hintC: 'Green is common in nature \u2014 plants dominate this channel. Chlorophyll reflects 500-565nm.',
  },
  {
    text: 'Something YELLOW',
    emoji: '\u{1F7E1}',
    category: 'color',
    difficulty: 1,
    simConfidence: 84,
    hintA: 'A banana, a toy, or a sign!',
    hintC: 'Yellow = high red + high green, low blue. Narrow band in HSV (H:20-35).',
  },
  // Medium — shapes
  {
    text: 'Something ROUND',
    emoji: '\u2B55',
    category: 'shape',
    difficulty: 2,
    simConfidence: 78,
    hintA: 'A ball, a plate, or a clock!',
    hintC: 'Circle detection via Hough transform. Look for objects with consistent radius.',
  },
  {
    text: 'Something SQUARE',
    emoji: '\u{1F7E7}',
    category: 'shape',
    difficulty: 2,
    simConfidence: 72,
    hintA: 'A book, a window, or a screen!',
    hintC: 'Rectangle detection: 4 corners with ~90 degree angles. Perspective correction may be needed.',
  },
  {
    text: 'Something with STRIPES',
    emoji: '\u{1F3F3}',
    category: 'shape',
    difficulty: 2,
    simConfidence: 68,
    hintA: 'A shirt, a rug, or a flag!',
    hintC: 'Repetitive pattern detection. Fourier analysis reveals stripe frequency.',
  },
  {
    text: 'Something TALL',
    emoji: '\u{1F5FC}',
    category: 'shape',
    difficulty: 2,
    simConfidence: 65,
    hintA: 'A door, a lamp, or a bottle!',
    hintC: 'Height estimation requires reference objects. Aspect ratio > 2:1 suggests tall.',
  },
  // Hard — abstract
  {
    text: 'Something SOFT',
    emoji: '\u2601\uFE0F',
    category: 'abstract',
    difficulty: 3,
    simConfidence: 35,
    hintA: 'A pillow, a stuffed animal, or a blanket!',
    hintC: 'Texture classification: soft materials have low-frequency texture patterns. Hard for CV!',
  },
  {
    text: "Something the AI wouldn't recognize",
    emoji: '\u{1F914}',
    category: 'abstract',
    difficulty: 3,
    simConfidence: 15,
    hintA: 'Something weird or unusual!',
    hintC: 'Out-of-distribution objects produce low-confidence scores across all classes.',
  },
  {
    text: 'Something with TEXT on it',
    emoji: '\u{1F4DD}',
    category: 'abstract',
    difficulty: 3,
    simConfidence: 82,
    hintA: 'A book, a sign, or a cereal box!',
    hintC: 'OCR pipeline: text detection (EAST/CRAFT) then recognition (Tesseract/CRNN).',
  },
  // ═══════ 5x CONTENT EXPANSION (40 new items) ═══════
  // --- COLORS (difficulty 1) ---
  { text: 'Something ORANGE', emoji: '\u{1F7E0}', category: 'color', difficulty: 1, simConfidence: 88, hintA: 'A carrot, an orange fruit, or a cone!', hintC: 'Orange sits between red and yellow in HSV (H:10-25). Often confused with red in low light.' },
  { text: 'Something PURPLE', emoji: '\u{1F7E3}', category: 'color', difficulty: 1, simConfidence: 85, hintA: 'A grape, a flower, or a crayon!', hintC: 'Purple is a mix of R+B channels. Hard to distinguish from dark blue in shadows.' },
  { text: 'Something PINK', emoji: '\u{1F338}', category: 'color', difficulty: 1, simConfidence: 83, hintA: 'A flower, a toy, or some clothes!', hintC: 'Pink = desaturated red. High value + medium saturation in HSV. Common in children\'s products.' },
  { text: 'Something WHITE', emoji: '\u26AA', category: 'color', difficulty: 1, simConfidence: 90, hintA: 'Paper, a wall, or a cloud!', hintC: 'White = high value, low saturation across all hues. Overexposure is a common false positive.' },
  { text: 'Something BLACK', emoji: '\u26AB', category: 'color', difficulty: 1, simConfidence: 86, hintA: 'A phone, shoes, or a keyboard!', hintC: 'Black = near-zero value. Shadow detection must distinguish true black objects from cast shadows.' },
  { text: 'Something BROWN', emoji: '\u{1F7EB}', category: 'color', difficulty: 1, simConfidence: 75, hintA: 'Wood, chocolate, or a teddy bear!', hintC: 'Brown = low saturation orange/red. Notoriously hard for CV — confused with dark orange and khaki.' },
  { text: 'Something SHINY', emoji: '\u2728', category: 'color', difficulty: 1, simConfidence: 70, hintA: 'A mirror, foil, or metal!', hintC: 'Specular highlights create bright spots. Reflection detection uses polarization analysis.' },
  { text: 'Something with TWO colors', emoji: '\u{1F308}', category: 'color', difficulty: 1, simConfidence: 72, hintA: 'A striped sock, a flag, or a ball!', hintC: 'Multi-color segmentation: K-means clustering on pixel colors to identify dominant hues.' },
  // --- SHAPES (difficulty 2) ---
  { text: 'Something TRIANGULAR', emoji: '\u{1F53A}', category: 'shape', difficulty: 2, simConfidence: 74, hintA: 'A slice of pizza, a road sign, or a roof!', hintC: 'Triangle detection: 3 corners with consistent edge lengths. Contour approximation with epsilon.' },
  { text: 'Something CURVED', emoji: '\u{1F319}', category: 'shape', difficulty: 2, simConfidence: 66, hintA: 'A banana, an arch, or a handle!', hintC: 'Curvature estimation from contour points. Bezier fitting for smooth curve classification.' },
  { text: 'Something TINY', emoji: '\u{1F41C}', category: 'shape', difficulty: 2, simConfidence: 55, hintA: 'A coin, a button, or a paperclip!', hintC: 'Small object detection requires high-resolution input. YOLO struggles below 32px bounding boxes.' },
  { text: 'Something FLAT', emoji: '\u{1F4C4}', category: 'shape', difficulty: 2, simConfidence: 60, hintA: 'A book, a table top, or a card!', hintC: 'Planarity detection uses depth estimation or edge analysis for 2D surface identification.' },
  { text: 'Something LONG', emoji: '\u{1F4CF}', category: 'shape', difficulty: 2, simConfidence: 62, hintA: 'A ruler, a snake toy, or a necklace!', hintC: 'Aspect ratio analysis: width/height < 0.3 suggests elongated objects. Bounding box orientation matters.' },
  { text: 'Something SYMMETRICAL', emoji: '\u{1F98B}', category: 'shape', difficulty: 2, simConfidence: 58, hintA: 'A butterfly picture, a face, or a leaf!', hintC: 'Symmetry detection: flip image along axis and compare pixel similarity. Bilateral symmetry is most common.' },
  { text: 'Something with HOLES', emoji: '\u{1F369}', category: 'shape', difficulty: 2, simConfidence: 64, hintA: 'A donut, a button, or a keyhole!', hintC: 'Topological feature: holes are detected via contour hierarchy (parent-child relationships in OpenCV).' },
  { text: 'Something with PATTERNS', emoji: '\u{1F3B2}', category: 'shape', difficulty: 2, simConfidence: 56, hintA: 'A dice, a checkerboard, or polka dots!', hintC: 'Gabor filters detect repeating texture patterns. Frequency domain analysis reveals periodicity.' },
  // --- ABSTRACT (difficulty 3) ---
  { text: 'Something FRAGILE', emoji: '\u{1FAB6}', category: 'abstract', difficulty: 3, simConfidence: 25, hintA: 'An egg, a glass, or a flower!', hintC: 'Material property inference: AI infers fragility from object class, not direct visual cues. Requires world knowledge.' },
  { text: 'Something HEAVY', emoji: '\u{1F4A4}', category: 'abstract', difficulty: 3, simConfidence: 20, hintA: 'A brick, a bowling ball, or a rock!', hintC: 'Weight estimation from visual cues: size + material class + density lookup tables. Very unreliable.' },
  { text: 'Something OLD', emoji: '\u{1F3DB}', category: 'abstract', difficulty: 3, simConfidence: 30, hintA: 'An antique, a worn book, or old shoes!', hintC: 'Age estimation from wear patterns: scratches, discoloration, patina. Requires training on temporal degradation.' },
  { text: 'Something that MOVES', emoji: '\u{1F3C3}', category: 'abstract', difficulty: 3, simConfidence: 40, hintA: 'A pet, a clock, or a spinning top!', hintC: 'Motion detection via optical flow (Lucas-Kanade/Farneback). Temporal analysis across frames.' },
  { text: 'Something NATURAL', emoji: '\u{1F33F}', category: 'abstract', difficulty: 3, simConfidence: 65, hintA: 'A rock, a leaf, or a shell!', hintC: 'Natural vs synthetic classification: fractal dimension analysis. Natural objects have higher complexity.' },
  { text: 'Something HANDMADE', emoji: '\u{1F9F6}', category: 'abstract', difficulty: 3, simConfidence: 22, hintA: 'A drawing, a clay thing, or a bracelet!', hintC: 'Handmade detection: irregular edges + imperfect symmetry + unique texture. Extremely difficult for CV.' },
  { text: 'Something EDIBLE', emoji: '\u{1F96A}', category: 'abstract', difficulty: 3, simConfidence: 50, hintA: 'Fruit, a sandwich, or a candy!', hintC: 'Food classification is well-studied (Food-101 dataset). Cross-domain transfer from ImageNet is common.' },
  { text: 'Something that makes SOUND', emoji: '\u{1F50A}', category: 'abstract', difficulty: 3, simConfidence: 18, hintA: 'A bell, a drum, or a whistle!', hintC: 'Sound inference from visual appearance requires multimodal reasoning — pure CV cannot determine this.' },
  { text: 'Something TRANSPARENT', emoji: '\u{1F4A7}', category: 'abstract', difficulty: 3, simConfidence: 28, hintA: 'A window, a water bottle, or glasses!', hintC: 'Transparency detection is a major CV challenge. Glass and water distort backgrounds, creating edge artifacts.' },
  { text: 'Something COLD', emoji: '\u2744\uFE0F', category: 'abstract', difficulty: 3, simConfidence: 15, hintA: 'Ice, a fridge, or a metal pole!', hintC: 'Temperature inference from visual cues is nearly impossible. Thermal cameras use IR spectrum, not visible light.' },
  { text: 'Something UPSIDE DOWN', emoji: '\u{1F643}', category: 'abstract', difficulty: 3, simConfidence: 45, hintA: 'Flip a cup, a book, or a toy!', hintC: 'Orientation detection: CNNs trained on upright images lose accuracy 30-60% on rotated objects. Data augmentation helps.' },
  { text: 'Find a FACE', emoji: '\u{1F600}', category: 'abstract', difficulty: 3, simConfidence: 95, hintA: 'Your face, a poster, or a photo!', hintC: 'Face detection (Haar cascades, MTCNN, RetinaFace) is one of CV\'s most mature domains. 99%+ accuracy.' },
  { text: 'Something the AI would MISCOUNT', emoji: '\u{1F522}', category: 'abstract', difficulty: 3, simConfidence: 32, hintA: 'A pile of coins, lots of pencils, or a bunch of grapes!', hintC: 'Object counting with occlusion is hard. Density estimation or counting-by-detection both have error margins.' },
  { text: 'Something BEHIND something else', emoji: '\u{1F441}', category: 'abstract', difficulty: 3, simConfidence: 38, hintA: 'A toy behind a box, or a cat behind a curtain!', hintC: 'Occlusion reasoning: amodal completion allows AI to infer hidden parts from visible contours. Still researched.' },
  { text: 'Something REFLECTED', emoji: '\u{1FA9E}', category: 'abstract', difficulty: 3, simConfidence: 33, hintA: 'Your reflection in a mirror or window!', hintC: 'Reflection detection: mirror/glass creates duplicate features. Challenging for stereo depth estimation.' },
];

const LEARN_CARDS = [
  {
    title: 'Computer Vision',
    emoji: '\u{1F441}',
    desc: 'AI can "see" through cameras \u2014 it detects colors, shapes, and objects.',
  },
  {
    title: 'Object Detection',
    emoji: '\u{1F50D}',
    desc: 'AI draws boxes around things it recognizes. Some objects are easier than others!',
  },
  {
    title: 'Confidence',
    emoji: '\u{1F4CA}',
    desc: "AI isn't 100% sure about everything. It gives a confidence score for each guess.",
  },
  {
    title: 'Limits',
    emoji: '\u26A0\uFE0F',
    desc: "AI struggles with unusual objects, bad lighting, and abstract concepts like 'soft' or 'tall'.",
  },
];

export function CameraQuestGame() {
  const prefersReducedMotion = useReducedMotion();
  const game = useGameStore();
  const activeChild = useActiveChild();
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: dynamicContent } = useGameContent('camera-quest', ageBand);

  const [phase, setPhase] = useState<Phase>('welcome');
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const filteredItems = useFilteredContent(HUNT_ITEMS as any[], tier, ageBand) as typeof HUNT_ITEMS;
  const [learnIdx, setLearnIdx] = useState(0);
  const [ci, setCi] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [showConfidence, setShowConfidence] = useState(false);
  const [streak, setStreak] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Filter items by age band — merge dynamic content
  const items = useMemo(() => {
    const maxDiff = ageBand === 'A' ? 1 : 3; // FLL-012: Band A sees colors+shapes only
    const hardcoded = HUNT_ITEMS.filter((i) => i.difficulty <= maxDiff);
    if (!dynamicContent?.scenarios?.length) return hardcoded;
    const dynamic: HuntItem[] = dynamicContent.scenarios
      .map(s => { try { return { ...JSON.parse(s.content_body), isAI: true } as HuntItem; } catch { return null; } })
      .filter((i): i is HuntItem => i !== null && i.difficulty <= maxDiff);
    return [...hardcoded, ...dynamic];
  }, [ageBand, dynamicContent?.scenarios]);

  const item = items[ci];

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

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch {
      setCaptured(true); // Fallback to manual
    }
  }

  function capture() {
    setCaptured(true);
    setShowConfidence(true);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      setCameraActive(false);
    }
  }

  function confirm(foundIt: boolean) {
    if (foundIt) {
      const bonus = streak >= 2 ? 5 : 0;
      game.updateScore(10 + bonus + (item.difficulty === 3 ? 5 : 0));
      setFound((prev) => new Set(prev).add(ci));
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }

    setCaptured(false);
    setShowConfidence(false);

    if (ci < items.length - 1) {
      setCi((i) => i + 1);
      game.advanceRound();
    } else {
      setPhase('complete');
      game.completeGame();
    }
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null; // FLL-014: clear srcObject
    };
  }, []);

  useEffect(() => {
    if (phase === 'hunt') {
      setGameSceneContent(
        <CameraQuest3D items={items} currentIndex={ci} found={found} showConfidence={showConfidence} captured={captured} />
      );
    } else {
      setGameSceneContent(null);
    }
  }, [phase, items, ci, found, showConfidence, captured, setGameSceneContent]);

  return (
    <GameShell
      gameId="camera-quest"
      title="Camera Quest"
      worldNumber={7}
      worldColor="#10BAD2"
      xpReward={25}
      totalRounds={items.length}
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
                background: `radial-gradient(circle, rgba(6,182,212,${
                  0.12 + p.size * 0.05
                }), transparent)`,
              }}
              animate={prefersReducedMotion ? {} : { y: [0, -12, 0], opacity: [0.1, 0.3, 0.1] }}
              transition={prefersReducedMotion ? { duration: 0 } : {
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
              border: '1px solid rgba(6,182,212,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
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
                      animate={prefersReducedMotion ? {} : { scale: [1, 1.1, 1] }}
                      transition={prefersReducedMotion ? { duration: 0 } : { duration: 2, repeat: Infinity }}
                    >
                      {'\u{1F4F7}'}
                    </motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">
                      Camera Quest
                    </h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? 'Scavenger hunt teaching computer vision concepts: color detection (HSV), shape recognition (Hough transform), and classification confidence.'
                        : 'Use your camera to find real objects! Hunt for colors, shapes, and tricky things!'}
                    </p>
                    {/* Privacy badge */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/5 border border-cyan-500/15">
                      <Lock className="w-3 h-3 text-cyan-400" />
                      <p className="font-body text-2xs text-cyan-300">
                        No images are stored \u2014 privacy first!
                      </p>
                    </div>
                    <motion.button
                      onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{
                        background: 'linear-gradient(135deg, #06B6D4, #0891B2)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      aria-label="Learn how AI sees"
                    >
                      How AI Sees!{' '}
                      <Eye className="inline w-4 h-4 ml-1" />
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
                    <Eye className="w-6 h-6 text-cyan-400" />
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={learnIdx}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="max-w-md w-full rounded-xl p-5 border border-cyan-500/20 bg-cyan-500/[0.03]"
                      >
                        <span className="text-4xl">
                          {LEARN_CARDS[learnIdx].emoji}
                        </span>
                        <h4 className="font-display text-base font-bold text-cyan-300 mt-3">
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
                        else setPhase('hunt');
                      }}
                      className="w-full max-w-md py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{
                        background: 'linear-gradient(135deg, #06B6D4, #0891B2)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      aria-label={learnIdx < LEARN_CARDS.length - 1 ? 'Next learn card' : 'Start the hunt'}
                    >
                      {learnIdx < LEARN_CARDS.length - 1
                        ? 'Next \u2192'
                        : 'Start the Hunt! \u{1F50D}'}
                    </motion.button>
                    <button
                      onClick={() => setPhase('hunt')}
                      className="font-body text-xs text-white/20 hover:text-white/40"
                      aria-label="Skip tutorial"
                    >
                      Skip tutorial
                    </button>
                  </motion.div>
                )}

                {/* === HUNT === */}
                {phase === 'hunt' && item && (
                  <motion.div
                    key="hunt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center"
                  >
                    <div className="flex items-center gap-3 mb-3 px-4">
                      <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                      <GameProgressTracker current={ci + 1} total={items.length} labColor="#06B6D4" />
                    </div>
                    {/* 3D renders in CockpitCanvas via sceneStore (D3D-B3) */}

                    {/* Collection progress */}
                    <div className="flex gap-1 mb-3 flex-wrap justify-center">
                      {items.map((it, i) => (
                        <motion.div
                          key={i}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs border ${
                            found.has(i)
                              ? 'border-cyan-500/40 bg-cyan-500/10'
                              : i === ci
                              ? 'border-cyan-500/30 bg-white/5'
                              : 'border-white/5 bg-white/[0.01]'
                          }`}
                          animate={i === ci ? { scale: [1, 1.05, 1] } : {}}
                          transition={{
                            duration: 1.5,
                            repeat: i === ci ? Infinity : 0,
                          }}
                        >
                          {found.has(i) ? (
                            <Check className="w-3 h-3 text-cyan-400" />
                          ) : (
                            <span className="opacity-30">{it.emoji}</span>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Current challenge */}
                    <motion.div
                      key={ci}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center mb-4"
                    >
                      <div className="flex items-center gap-1 justify-center mb-1">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 font-body text-2xs text-cyan-300">
                          {item.category}
                        </span>
                        <span className="flex gap-0.5">
                          {[1, 2, 3].map((d) => (
                            <Star
                              key={d}
                              className={`w-2.5 h-2.5 ${
                                d <= item.difficulty
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-white/10'
                              }`}
                            />
                          ))}
                        </span>
                      </div>
                      <span className="text-5xl block mb-2">{item.emoji}</span>
                      <h3 className="font-display text-xl font-bold text-white">
                        Find {item.text}
                      </h3>
                      <p className="font-body text-2xs text-white/30 mt-1 max-w-sm">
                        {ageBand === 'C' ? item.hintC : item.hintA}
                      </p>
                    </motion.div>

                    {/* Camera / capture UI */}
                    {!cameraActive && !captured && (
                      <div className="flex flex-col gap-2 w-full max-w-xs">
                        <motion.button
                          onClick={startCamera}
                          className="w-full py-3 rounded-xl font-display font-bold text-sm text-white flex items-center justify-center gap-2"
                          style={{
                            background: 'linear-gradient(135deg, #06B6D4, #0891B2)',
                          }}
                          whileTap={{ scale: 0.95 }}
                          aria-label="Open camera"
                        >
                          <Camera className="w-5 h-5" /> Open Camera
                        </motion.button>
                        <button
                          onClick={() => setCaptured(true)}
                          className="w-full py-2 rounded-xl border border-white/10 text-white/30 font-body text-xs"
                          aria-label="Use manual mode without camera"
                        >
                          No camera? Use manual mode
                        </button>
                      </div>
                    )}

                    {cameraActive && (
                      <div className="relative w-full max-w-sm aspect-[4/3] rounded-2xl overflow-hidden border border-cyan-500/20">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        {/* Viewfinder overlay */}
                        <div className="absolute inset-4 border-2 border-cyan-500/30 rounded-xl" />
                        <motion.button
                          onClick={capture}
                          className="absolute bottom-3 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full border-4 border-white/80 flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(6,182,212,0.2)' }}
                          whileTap={{ scale: 0.8 }}
                          aria-label="Capture photo"
                        >
                          <div className="w-10 h-10 rounded-full bg-white" />
                        </motion.button>
                      </div>
                    )}

                    {captured && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {/* Simulated confidence meter */}
                        {showConfidence && (
                          <div className="mb-3 rounded-xl p-3 border border-cyan-500/15 bg-cyan-500/[0.03]">
                            <p className="font-body text-2xs text-white/30 mb-1">
                              Expected AI Confidence:
                            </p>
                            <div className="h-3 rounded-full bg-white/5 overflow-hidden mb-1">
                              <motion.div
                                className="h-full rounded-full"
                                style={{
                                  backgroundColor:
                                    item.simConfidence > 80
                                      ? '#10B981'
                                      : item.simConfidence > 50
                                      ? '#FBBF24'
                                      : '#EF4444',
                                }}
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${item.simConfidence}%`,
                                }}
                                transition={{ duration: 1.5 }}
                              />
                            </div>
                            <p
                              className="font-display text-xs font-bold"
                              style={{
                                color:
                                  item.simConfidence > 80
                                    ? '#10B981'
                                    : item.simConfidence > 50
                                    ? '#FBBF24'
                                    : '#EF4444',
                              }}
                            >
                              {item.simConfidence}% confident
                            </p>
                            {item.simConfidence < 50 && (
                              <p className="font-body text-2xs text-white/25 mt-0.5">
                                {ageBand === 'C'
                                  ? 'Low confidence: abstract properties are difficult for standard classifiers.'
                                  : 'AI finds this one tricky! Some things are hard for computers to see.'}
                              </p>
                            )}
                          </div>
                        )}

                        <p className="font-body text-sm text-white/50 mb-3">
                          Did you find {item.text}?
                        </p>
                        <div className="flex gap-3 justify-center">
                          <motion.button
                            onClick={() => confirm(true)}
                            className="px-6 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-display text-sm font-bold flex items-center gap-1"
                            whileTap={{ scale: 0.95 }}
                            aria-label="Confirm item found"
                          >
                            <Check className="w-4 h-4" /> Found it!
                          </motion.button>
                          <motion.button
                            onClick={() => confirm(false)}
                            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 font-display text-sm font-bold flex items-center gap-1"
                            whileTap={{ scale: 0.95 }}
                            aria-label="Skip this item"
                          >
                            <X className="w-4 h-4" /> Skip
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {phase === 'complete' && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <motion.span className="text-6xl" animate={prefersReducedMotion ? {} : { rotate: [0, 10, -10, 0] }} transition={prefersReducedMotion ? { duration: 0 } : { duration: 1.5, repeat: Infinity }}>🏆</motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">Camera Quest Complete!</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">You explored how computer vision works by hunting for objects with different levels of difficulty — from simple colors to abstract concepts AI struggles with!</p>
                    <div className="rounded-xl px-6 py-3 bg-[#06B6D4]/10 border border-[#06B6D4]/20">
                      <p className="font-data text-2xl" style={{ color: '#06B6D4' }}>{game.score}</p>
                      <p className="font-body text-2xs text-white/30">Total Points</p>
                    </div>
                    <div className="mt-4 space-y-2 text-left max-w-sm">
                      <h3 className="font-display text-sm font-bold text-white/70">What You Learned:</h3>
                      <ul className="space-y-1 text-2xs font-body text-white/40">
                        <li>• Computer vision detects colors, shapes, and objects in images</li>
                        <li>• AI assigns confidence scores to show how certain it is</li>
                        <li>• Abstract concepts like &quot;soft&quot; or &quot;tall&quot; are much harder for AI to recognize</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
