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
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import {
  Camera, Check, X, Eye, Lock, Star,
} from 'lucide-react';
import dynamic from 'next/dynamic';

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

type Phase = 'welcome' | 'learn' | 'hunt';

interface HuntItem {
  text: string;
  emoji: string;
  category: 'color' | 'shape' | 'abstract';
  difficulty: 1 | 2 | 3;
  hintA: string;
  hintC: string;
  simConfidence: number;
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
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [ci, setCi] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [showConfidence, setShowConfidence] = useState(false);
  const [streak, setStreak] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Filter items by age band
  const items = useMemo(() => {
    if (ageBand === 'A') return HUNT_ITEMS.filter((i) => i.difficulty <= 2);
    return HUNT_ITEMS;
  }, [ageBand]);

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
      game.completeGame();
    }
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <GameShell
      gameId="camera-quest"
      title="Camera Quest"
      worldNumber={7}
      worldColor="#06B6D4"
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
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.3, 0.1] }}
              transition={{
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
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
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
                    >
                      {learnIdx < LEARN_CARDS.length - 1
                        ? 'Next \u2192'
                        : 'Start the Hunt! \u{1F50D}'}
                    </motion.button>
                    <button
                      onClick={() => setPhase('hunt')}
                      className="font-body text-xs text-white/20 hover:text-white/40"
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
                    {/* [v3] 3D Scene */}
                    <CameraQuest3D
                      items={items}
                      currentIndex={ci}
                      found={found}
                      showConfidence={showConfidence}
                      captured={captured}
                    />

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
                        >
                          <Camera className="w-5 h-5" /> Open Camera
                        </motion.button>
                        <button
                          onClick={() => setCaptured(true)}
                          className="w-full py-2 rounded-xl border border-white/10 text-white/30 font-body text-xs"
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
                              AI Confidence:
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
                          >
                            <Check className="w-4 h-4" /> Found it!
                          </motion.button>
                          <motion.button
                            onClick={() => confirm(false)}
                            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 font-display text-sm font-bold flex items-center gap-1"
                            whileTap={{ scale: 0.95 }}
                          >
                            <X className="w-4 h-4" /> Skip
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
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
