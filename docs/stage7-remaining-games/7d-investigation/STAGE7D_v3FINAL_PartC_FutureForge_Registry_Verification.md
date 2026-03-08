# SPARKFORGE — STAGE 7D v3-FINAL (PART C): Future Forge + Registry + Verification

**Date:** February 28, 2026 | **GCUD Version:** V9
**Vision:** Laboratory Control Station
**Decision IDs:** 6.5 (Tier 2 Enhanced 3D)
**Code-Reviewed:** March 8, 2026 by Claude Code (Code Review Role per CLAUDE.md §3.1)

---

## Overview

| File | Type | Lines | Treatment |
|------|------|-------|-----------|
| FutureForgeGame.tsx | REPLACE | ~530 | Dynamic import FutureForge3D, isMobile, 3D Canvas above build area |
| PixelInvestigatorGame.tsx | UNCHANGED | ~320 | Tier 3 standard (no 3D) |
| FoolTheAiGame.tsx | UNCHANGED | ~260 | Tier 3 standard (no 3D) |
| index.ts | UNCHANGED | ~40 | All 28 game exports already present |
| [gameSlug]/page.tsx | UNCHANGED | ~60 | All 28 route mappings already present |

**Prerequisites:** Part A (FutureForge3D.tsx) + Part B complete.
**Supersedes:** STAGE7D_Part3_FutureForge_Registry.pdf (Feb 20, 2026) — FutureForge game file only.

---

## AUTO-FIX LOG (Applied During Code Review)

| # | Category | Original | Fixed | Reason |
|---|----------|----------|-------|--------|
| 1 | **Store API** | `game.addScore(...)` | `game.updateScore(...)` | `addScore` does not exist on gameStore |
| 2 | **Missing prop** | `GameShell` missing `totalRounds` | Added `totalRounds={1}` | Required by GameShellProps. Future Forge is a single-invention design flow. |
| 3 | **Broken TypeScript** | `ImpactRadar` function signature — type annotations outside destructured params | Fixed function signature | PDF formatting broke the TypeScript destructuring syntax |
| 4 | **Broken array** | `impact` useMemo — `Feasible` entry nested inside `Creative` entry | Fixed to 3 separate array entries | PDF line-wrapping interleaved the objects |
| 5 | **Missing game completion** | Patent card (step 4) has no mechanism to call `game.completeGame()` | Added "Complete!" button below patent card | Without this, the game never signals completion for XP/celebration |
| 6 | **Truncated strings** | ~12 truncated descriptions in PROBLEMS, LEARN_CARDS, AI_SKILLS arrays | Completed all strings with contextually appropriate endings | PDF line-wrap truncation |
| 7 | **Truncated classNames** | 4+ truncated Tailwind class strings on buttons, inputs, textarea | Completed all classNames | PDF line-wrap truncation |
| 8 | **Truncated CSS** | `backgroundImage` blueprint grid string cut off | Completed the CSS value | PDF line-wrap truncation |
| 9 | **Orphaned JSX** | Bottom LED `<div>` outside `</GameShell>` | Moved inside component tree | JSX elements must be within parent |
| 10 | **Quote style** | `"use client"` | `'use client'` | Consistency with all existing project components |

---

## UNCHANGED FILES (Tier 3 Standard Polish — No 3D Additions)

### PixelInvestigatorGame.tsx — UNCHANGED

- **File:** `src/components/games/PixelInvestigatorGame.tsx`
- **Status:** Retain v2 code as delivered in STAGE7D_Part1
- **Treatment:** Tier 3 Standard Polish (pink bezel, particles, welcome/learn phases)
- **Reason:** Standard (non-flagship-lite) game per Decision 6.5

**v2 Features Confirmed:**
- 12 images across 3 tiers (basic, medium, tricky)
- Blur-reveal mechanic with slider
- AI confidence simulation per image
- Streak bonus scoring
- Welcome phase, learn phase with 4 concept cards
- Chrome bezel (pink, Lab 3), particle background
- Age-band depth (A: simple hints, C: pixel analysis terminology)

### FoolTheAiGame.tsx — UNCHANGED

- **File:** `src/components/games/FoolTheAiGame.tsx`
- **Status:** Retain v2 code as delivered in STAGE7D_Part1
- **Treatment:** Tier 3 Standard Polish (cyan bezel, particles, welcome/learn phases)
- **Reason:** Standard (non-flagship-lite) game per Decision 6.5

**v2 Features Confirmed:**
- 14 items across 4 challenge rounds
- Dual explanations (A: simple, C: technical)
- AI confidence bars per item
- Score tracking with round progression
- Welcome phase, learn phase with 4 concept cards
- Chrome bezel (cyan, Lab 7), particle background
- Age-band depth (A: simplified, C: adversarial ML terminology)

---

## REGISTRY FILES — NO CHANGES REQUIRED

- `src/components/games/index.ts` — All 28 game exports verified present
- `src/app/(dashboard)/arcade/[gameSlug]/page.tsx` — All 28 route mappings verified present

---

## File 1: `src/components/games/FutureForgeGame.tsx`

```tsx
'use client';

// ================================================================
// FUTURE FORGE V2 — Lab 10 (AI's Future) — FLAGSHIP-LITE
// [v3] Decision 6.5: Tier 2 Enhanced 3D (blueprint table + holographic)
//
// Blueprint workshop, AI capability cards, patent certificate,
// impact radar chart, inspiration gallery. Welcome + learn phases.
// [v3] 3D blueprint table + skill orbs + holographic patent on desktop
// ================================================================

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import {
  BookOpen, Lightbulb, Rocket, Star, Award, Sparkles,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// [v3] Dynamic import — SSR disabled for R3F
const FutureForge3D = dynamic(
  () => import('@/components/3d/FutureForge3D'),
  { ssr: false }
);

type Phase = 'welcome' | 'learn' | 'build';

const PROBLEMS = [
  { emoji: '🌍', label: 'Climate Change', descA: 'Help save the planet!', descC: 'Environmental monitoring, carbon modeling, sustainability optimization' },
  { emoji: '🏥', label: 'Healthcare', descA: 'Help people stay healthy!', descC: 'Diagnostic imaging, drug discovery, patient monitoring systems' },
  { emoji: '🎓', label: 'Education', descA: 'Help kids learn better!', descC: 'Adaptive learning, knowledge graphs, assessment generation' },
  { emoji: '🚗', label: 'Transportation', descA: 'Make travel safer!', descC: 'Autonomous navigation, traffic optimization, route planning' },
  { emoji: '🎨', label: 'Creativity', descA: 'Help people make things!', descC: 'Generative art, music composition, design assistance' },
  { emoji: '♿', label: 'Accessibility', descA: 'Help everyone participate!', descC: 'Assistive technology, real-time captioning, navigation aids' },
  { emoji: '🌾', label: 'Food & Farming', descA: 'Grow food for everyone!', descC: 'Precision agriculture, yield prediction, supply chain optimization' },
  { emoji: '🐾', label: 'Animal Protection', descA: 'Help protect animals!', descC: 'Wildlife tracking, species identification, habitat monitoring' },
];

const AI_SKILLS = [
  { name: 'Computer Vision', emoji: '👁', desc: 'See and understand images', descC: 'CNNs, object detection, segmentation' },
  { name: 'Natural Language', emoji: '💬', desc: 'Read and write language', descC: 'LLMs, NER, sentiment analysis' },
  { name: 'Prediction', emoji: '🔮', desc: 'Predict what happens next', descC: 'Time series, regression, forecasting' },
  { name: 'Robotics', emoji: '🤖', desc: 'Control physical machines', descC: 'Motion planning, SLAM, manipulation' },
  { name: 'Recommendation', emoji: '⭐', desc: 'Suggest the right things', descC: 'Collaborative filtering, content-based' },
  { name: 'Generation', emoji: '✨', desc: 'Create new content', descC: 'Diffusion models, GANs, transformers' },
  { name: 'Analysis', emoji: '📊', desc: 'Find patterns in data', descC: 'Clustering, anomaly detection, PCA' },
  { name: 'Speech', emoji: '🎙️', desc: 'Listen and speak', descC: 'ASR, TTS, emotion recognition' },
];

const LEARN_CARDS = [
  { title: 'AI Capabilities', emoji: '🧠', desc: 'AI can see, read, predict, create, and analyze. Each capability is like a superpower you can combine!' },
  { title: 'Combining Skills', emoji: '🧩', desc: 'The best AI inventions combine multiple skills. Vision + Language = image description. Prediction + Analysis = early warning systems.' },
  { title: 'Real Impact', emoji: '🌍', desc: 'AI is already solving real problems: diagnosing diseases, protecting wildlife, and teaching students around the world.' },
  { title: 'Your Turn!', emoji: '🚀', desc: 'Pick a problem, choose AI skills, and design your own AI invention!' },
];

const SAMPLES = [
  { name: 'EcoGuard', problem: '🌍', skills: ['Vision', 'Prediction'], desc: 'Satellite AI that predicts wildfires' },
  { name: 'MediScan', problem: '🏥', skills: ['Vision', 'Analysis'], desc: 'Phone that detects skin conditions' },
  { name: 'LearnBot', problem: '🎓', skills: ['Language', 'Recommendation'], desc: 'AI tutor that adapts to you' },
];

function ImpactRadar({
  scores,
  color,
}: {
  scores: { label: string; value: number }[];
  color: string;
}) {
  const cx = 60,
    cy = 60,
    r = 45,
    n = scores.length;

  function toXY(angle: number, radius: number): [number, number] {
    const rad = (angle - 90) * (Math.PI / 180);
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
  }

  const step = 360 / n;
  const pts = scores.map((s, i) => toXY(i * step, (s.value / 100) * r));
  const grid = scores.map((_, i) => toXY(i * step, r));

  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28 mx-auto">
      {[0.33, 0.66, 1].map((s) => (
        <polygon
          key={s}
          points={grid
            .map((_, i) => toXY(i * step, r * s).join(','))
            .join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
        />
      ))}
      {grid.map(([x, y], i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={x}
          y2={y}
          stroke="rgba(255,255,255,0.05)"
        />
      ))}
      <motion.polygon
        points={pts.map((p) => p.join(',')).join(' ')}
        fill={`${color}20`}
        stroke={color}
        strokeWidth={1.5}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.5} fill={color} />
      ))}
      {scores.map((s, i) => {
        const [lx, ly] = toXY(i * step, r + 12);
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            fill="rgba(255,255,255,0.3)"
            fontSize={6}
            fontFamily="monospace"
          >
            {s.label}
          </text>
        );
      })}
    </svg>
  );
}

export function FutureForgeGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [problem, setProblem] = useState('');
  const [problemEmoji, setProblemEmoji] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [skills, setSkills] = useState<Set<string>>(new Set());

  // [v3] Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const innovation = useMemo(() => {
    const ns = Math.min(20, name.length * 2);
    const ds = Math.min(30, desc.split(' ').filter(Boolean).length * 3);
    const ss = Math.min(30, skills.size * 8);
    const v = skills.size >= 3 ? 10 : skills.size >= 2 ? 5 : 0;
    return Math.min(100, 10 + ns + ds + ss + v);
  }, [name, desc, skills]);

  const impact = useMemo(
    () => [
      {
        label: 'Help',
        value: Math.min(
          100,
          40 + desc.split(' ').length * 3 + skills.size * 8
        ),
      },
      {
        label: 'Feasible',
        value: Math.min(100, 50 + skills.size * 12),
      },
      {
        label: 'Creative',
        value: Math.min(
          100,
          30 + name.length * 3 + (skills.size >= 3 ? 20 : 0)
        ),
      },
    ],
    [name, desc, skills]
  );

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

  function toggleSkill(s: string) {
    setSkills((prev) => {
      const n = new Set(prev);
      n.has(s) ? n.delete(s) : n.add(s);
      return n;
    });
  }

  function generateCard() {
    setStep(4);
    game.updateScore(innovation >= 80 ? 30 : innovation >= 60 ? 20 : 10);
  }

  return (
    <GameShell
      gameId="future-forge"
      title="Future Forge"
      worldNumber={10}
      worldColor="#D946EF"
      xpReward={25}
      totalRounds={1}
    >
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Blueprint grid background */}
        {phase === 'build' && (
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(217,70,239,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(217,70,239,0.3) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
          </div>
        )}

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
                background: `radial-gradient(circle, rgba(217,70,239,${
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
              border: '1px solid rgba(217,70,239,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent" />
            <div className="flex-1 flex flex-col p-4 overflow-auto">
              <AnimatePresence mode="wait">
                {/* WELCOME */}
                {phase === 'welcome' && (
                  <motion.div
                    key="w"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <motion.span
                      className="text-6xl"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      🚀
                    </motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">
                      Future Forge
                    </h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? 'Design an AI system: select problem domain, compose capability stack, and evaluate innovation metrics.'
                        : 'Invent the future! Pick a problem, combine AI superpowers, and create something amazing!'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['AI Design', 'Innovation', 'Future Tech'].map((t) => (
                        <span
                          key={t}
                          className="px-2 py-1 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 font-body text-[10px] text-fuchsia-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <motion.button
                      onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{
                        background:
                          'linear-gradient(135deg, #D946EF, #C026D3)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Learn AI Skills!{' '}
                      <Lightbulb className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* LEARN */}
                {phase === 'learn' && (
                  <motion.div
                    key="l"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center space-y-4"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={learnIdx}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="max-w-md w-full rounded-xl p-5 border border-fuchsia-500/20 bg-fuchsia-500/[0.03]"
                      >
                        <span className="text-4xl">
                          {LEARN_CARDS[learnIdx].emoji}
                        </span>
                        <h4 className="font-display text-base font-bold text-fuchsia-300 mt-3">
                          {LEARN_CARDS[learnIdx].title}
                        </h4>
                        <p className="font-body text-sm text-white/60 mt-2">
                          {LEARN_CARDS[learnIdx].desc}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                    <motion.button
                      onClick={() => {
                        if (learnIdx < 3) setLearnIdx((i) => i + 1);
                        else setPhase('build');
                      }}
                      className="w-full max-w-md py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{
                        background:
                          'linear-gradient(135deg, #D946EF, #C026D3)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {learnIdx < 3
                        ? 'Next →'
                        : 'Start Inventing! 🚀'}
                    </motion.button>
                    <button
                      onClick={() => setPhase('build')}
                      className="font-body text-xs text-white/20 hover:text-white/40"
                    >
                      Skip tutorial
                    </button>
                  </motion.div>
                )}

                {/* BUILD */}
                {phase === 'build' && (
                  <motion.div
                    key="b"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center"
                  >
                    {/* [v3] 3D Scene — desktop only */}
                    {!isMobile && (
                      <FutureForge3D
                        step={step}
                        selectedSkills={skills}
                        allSkills={AI_SKILLS}
                        problemEmoji={problemEmoji || '🚀'}
                        inventionName={name}
                        innovationScore={innovation}
                        isMobile={isMobile}
                      />
                    )}

                    <div className="max-w-md w-full">
                      {/* Step 0: Choose Problem */}
                      {step === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <h3 className="font-display text-lg font-bold text-white text-center mb-3">
                            Choose a Problem to Solve
                          </h3>
                          {/* Inspiration */}
                          <div className="mb-3 space-y-1">
                            {SAMPLES.map((s, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/[0.02]"
                              >
                                <span>{s.problem}</span>
                                <span className="font-display text-[10px] font-bold text-white/40">
                                  {s.name}
                                </span>
                                <span className="font-body text-[8px] text-white/20 flex-1">
                                  {s.desc}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {PROBLEMS.map((p) => (
                              <motion.button
                                key={p.label}
                                onClick={() => {
                                  setProblem(p.label);
                                  setProblemEmoji(p.emoji);
                                  setStep(1);
                                }}
                                className="py-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-fuchsia-500/5 hover:border-fuchsia-500/20 transition-colors"
                                whileTap={{ scale: 0.95 }}
                              >
                                <span className="text-2xl block">
                                  {p.emoji}
                                </span>
                                <p className="font-display text-xs font-bold text-white mt-1">
                                  {p.label}
                                </p>
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Step 1: Name */}
                      {step === 1 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-3"
                        >
                          <h3 className="font-display text-lg font-bold text-white">
                            Name your invention
                          </h3>
                          <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. EcoGuard, MediScan..."
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-body text-sm placeholder:text-white/20"
                            maxLength={30}
                            aria-label="Invention name"
                          />
                          <button
                            onClick={() => name.trim() && setStep(2)}
                            disabled={!name.trim()}
                            className="w-full py-3 rounded-xl bg-fuchsia-500/20 text-fuchsia-300 font-display font-bold text-sm disabled:opacity-30"
                          >
                            Next: Describe it →
                          </button>
                        </motion.div>
                      )}

                      {/* Step 2: Description */}
                      {step === 2 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-3"
                        >
                          <h3 className="font-display text-lg font-bold text-white">
                            Describe what {name} does
                          </h3>
                          <textarea
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            placeholder="What does your invention do? How does it help?"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-body text-sm placeholder:text-white/20 resize-none h-24"
                            aria-label="Invention description"
                          />
                          <button
                            onClick={() => desc.trim() && setStep(3)}
                            disabled={!desc.trim()}
                            className="w-full py-3 rounded-xl bg-fuchsia-500/20 text-fuchsia-300 font-display font-bold text-sm disabled:opacity-30"
                          >
                            Next: Choose AI Skills →
                          </button>
                        </motion.div>
                      )}

                      {/* Step 3: Skills */}
                      {step === 3 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-3"
                        >
                          <h3 className="font-display text-lg font-bold text-white text-center">
                            Choose AI Skills for {name}
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            {AI_SKILLS.map((s) => (
                              <button
                                key={s.name}
                                onClick={() => toggleSkill(s.name)}
                                className={`px-3 py-2 rounded-xl text-left border transition-colors ${
                                  skills.has(s.name)
                                    ? 'border-fuchsia-500/40 bg-fuchsia-500/10'
                                    : 'border-white/10 bg-white/[0.02]'
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm">{s.emoji}</span>
                                  <span
                                    className={`font-display text-[10px] font-bold ${
                                      skills.has(s.name)
                                        ? 'text-fuchsia-300'
                                        : 'text-white/50'
                                    }`}
                                  >
                                    {s.name}
                                  </span>
                                </div>
                                <p className="font-body text-[8px] text-white/25 mt-0.5">
                                  {ageBand === 'C' ? s.descC : s.desc}
                                </p>
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={generateCard}
                            disabled={skills.size === 0}
                            className="w-full py-3 rounded-xl text-white font-display font-bold text-sm disabled:opacity-30"
                            style={{
                              background:
                                skills.size > 0
                                  ? 'linear-gradient(135deg, #D946EF, #C026D3)'
                                  : 'rgba(255,255,255,0.05)',
                            }}
                          >
                            Generate Patent Card 📜
                          </button>
                        </motion.div>
                      )}

                      {/* PATENT CARD */}
                      {step === 4 && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="space-y-3"
                        >
                          <div
                            className="rounded-2xl p-5 text-center border border-fuchsia-500/20"
                            style={{
                              background:
                                'linear-gradient(135deg, rgba(217,70,239,0.08), rgba(168,85,247,0.04))',
                            }}
                          >
                            {/* Patent header */}
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <div className="w-6 h-[1px] bg-fuchsia-500/30" />
                              <Award className="w-4 h-4 text-fuchsia-400" />
                              <span className="font-mono text-[8px] text-fuchsia-400/50">
                                PATENT APPROVED
                              </span>
                              <Award className="w-4 h-4 text-fuchsia-400" />
                              <div className="w-6 h-[1px] bg-fuchsia-500/30" />
                            </div>

                            <span className="text-5xl block my-2">🏆</span>
                            <h3 className="font-display text-xl font-bold text-white">
                              {name}
                            </h3>
                            <p className="font-body text-[10px] text-white/30 mt-0.5">
                              Solving: {problem} {problemEmoji}
                            </p>
                            <p className="font-body text-sm text-white/60 mt-2 italic">
                              &quot;{desc}&quot;
                            </p>

                            {/* Skills */}
                            <div className="flex flex-wrap gap-1 justify-center mt-3">
                              {Array.from(skills).map((s) => {
                                const skill = AI_SKILLS.find(
                                  (sk) => sk.name === s
                                );
                                return (
                                  <span
                                    key={s}
                                    className="px-2 py-0.5 rounded-lg bg-fuchsia-500/10 font-body text-[9px] text-fuchsia-300"
                                  >
                                    {skill?.emoji} {s}
                                  </span>
                                );
                              })}
                            </div>

                            {/* Impact radar */}
                            <ImpactRadar scores={impact} color="#D946EF" />

                            {/* Innovation score */}
                            <div
                              className="inline-block px-6 py-2 rounded-full mt-2"
                              style={{
                                background: `linear-gradient(135deg, ${
                                  innovation >= 80
                                    ? '#D946EF'
                                    : innovation >= 60
                                    ? '#FBBF24'
                                    : '#EF4444'
                                }, ${
                                  innovation >= 80
                                    ? '#A855F7'
                                    : innovation >= 60
                                    ? '#F59E0B'
                                    : '#DC2626'
                                })`,
                              }}
                            >
                              <span className="font-display text-lg font-bold text-white">
                                Innovation: {innovation}/100
                              </span>
                            </div>

                            <p className="font-body text-[10px] text-white/25 mt-2">
                              {innovation >= 80
                                ? '🌟 Brilliant invention! Ready for the future!'
                                : innovation >= 60
                                ? '💡 Great start! Add more details to boost your score.'
                                : '🔧 Keep building! Try adding more skills and description.'}
                            </p>
                            <p className="font-body text-[10px] text-fuchsia-300/30 mt-3">
                              Inventor: You | Lab 10: AI&apos;s Future
                            </p>
                          </div>

                          {/* Complete button */}
                          <motion.button
                            onClick={() => game.completeGame()}
                            className="w-full py-3 rounded-xl font-display font-bold text-sm text-white"
                            style={{
                              background:
                                'linear-gradient(135deg, #D946EF, #C026D3)',
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Complete! 🎉
                          </motion.button>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
```

---

## Verification Checklist — All 5 Stage 7D Games

### Pre-Implementation Checks
- [ ] Stage 3 Part 3 v3-FINAL complete (StationFrame + R3F packages installed)
- [ ] Part A complete: RobotVacuum3D.tsx, CameraQuest3D.tsx, FutureForge3D.tsx exist in `src/components/3d/`
- [ ] Part B complete: RobotVacuumGame.tsx, CameraQuestGame.tsx replaced
- [ ] `npm list three @react-three/fiber @react-three/drei @react-three/postprocessing` — all present

### Per-Game Verification

**Robot Vacuum** (`/arcade/robot-vacuum`):
- [ ] Welcome phase renders with emerald theme
- [ ] Learn phase: 4 cards cycle correctly
- [ ] Play phase: 6x6 grid with furniture emoji, dust particles
- [ ] IF/THEN rule builder: add/remove/edit rules
- [ ] Simulation runs with coverage tracking
- [ ] Results panel: coverage %, steps, optimal, efficiency
- [ ] [v3] Desktop: 3D isometric room appears above grid
- [ ] [v3] Mobile: CSS grid only (no 3D Canvas)
- [ ] Age-band C: production rules terminology in results

**Camera Quest** (`/arcade/camera-quest`):
- [ ] Welcome phase renders with cyan theme + privacy badge
- [ ] Learn phase: 4 cards cycle correctly
- [ ] Hunt phase: collection progress grid, current challenge card
- [ ] Camera button opens camera (or falls back to manual)
- [ ] Confidence meter animates correctly per item
- [ ] Found it / Skip buttons advance correctly
- [ ] Streak bonus and difficulty bonus scoring
- [ ] [v3] Desktop: 3D polaroid cards appear above hunt area
- [ ] [v3] Mobile: CSS buttons only (no 3D Canvas)
- [ ] Age-band A: only difficulty 1-2 items shown

**Future Forge** (`/arcade/future-forge`):
- [ ] Welcome phase renders with fuchsia theme
- [ ] Learn phase: 4 cards cycle correctly
- [ ] Build step 0: Inspiration gallery + 8 problem buttons
- [ ] Build step 1: Name input with validation
- [ ] Build step 2: Description textarea with validation
- [ ] Build step 3: 8 AI skill toggle cards
- [ ] Build step 4: Patent card with radar chart + innovation score
- [ ] Complete button triggers `game.completeGame()`
- [ ] [v3] Desktop: 3D blueprint table + skill orbs + holographic patent
- [ ] [v3] Mobile: CSS grid background only (no 3D Canvas)
- [ ] Age-band C: technical descriptions for skills

**Pixel Investigator** (`/arcade/pixel-investigator`):
- [ ] Game loads and runs with all v2 features
- [ ] Chrome bezel (pink), particles present
- [ ] No 3D Canvas rendered (Tier 3 standard)

**Fool the AI** (`/arcade/fool-the-ai`):
- [ ] Game loads and runs with all v2 features
- [ ] Chrome bezel (cyan), particles present
- [ ] No 3D Canvas rendered (Tier 3 standard)

---

## Supersedes Statement

| v2 Document | What It Covered | Status |
|-------------|----------------|--------|
| STAGE7D_Part1_PixelInvestigator_FoolTheAI.pdf | PixelInvestigatorGame + FoolTheAiGame | NOT replaced — v2 remains authoritative |
| STAGE7D_Part2_RobotVacuum_CameraQuest.pdf | RobotVacuumGame + CameraQuestGame | REPLACED by Parts A + B |
| STAGE7D_Part3_FutureForge_Registry.pdf | FutureForgeGame + index.ts + page.tsx | PARTIALLY replaced — FutureForge by Parts A + C; registry/router unchanged |

---

## Stage 7D v3-FINAL Complete Summary (Parts A + B + C)

| File | Part | Type | Lines | 3D Treatment |
|------|------|------|-------|-------------|
| RobotVacuum3D.tsx | A | NEW | ~300 | Tier 2: 3D isometric room (~3K tri) |
| CameraQuest3D.tsx | A | NEW | ~300 | Tier 2: 3D polaroid cards (~2K tri) |
| FutureForge3D.tsx | A | NEW | ~300 | Tier 2: 3D blueprint table (~2K tri) |
| RobotVacuumGame.tsx | B | REPLACE | ~600 | Dynamic import + isMobile |
| CameraQuestGame.tsx | B | REPLACE | ~550 | Dynamic import + isMobile |
| FutureForgeGame.tsx | C | REPLACE | ~530 | Dynamic import + isMobile |
| PixelInvestigatorGame.tsx | — | UNCHANGED | ~320 | Tier 3 standard (no 3D) |
| FoolTheAiGame.tsx | — | UNCHANGED | ~260 | Tier 3 standard (no 3D) |
| index.ts | — | UNCHANGED | ~40 | No changes needed |
| [gameSlug]/page.tsx | — | UNCHANGED | ~60 | No changes needed |

**Stage 7D v3-FINAL COMPLETE (Parts A + B + C)**
