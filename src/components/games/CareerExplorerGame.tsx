// ================================================================
// CAREER EXPLORER — Lab 9 (AI Careers) — STANDARD
//
// Concept: Explore AI career paths by matching skills to jobs.
// Players learn about real AI job roles and the skills needed.
//
// Features:
// • Chrome bezel (orange, Lab 9)
// • Particle background
// • Welcome → Learn → Play → Complete phases
// • Career cards with descriptions
// • Skill matching gameplay
// • Age-band depth (B: intermediate, C: advanced roles)
// • ARIA labels
// ================================================================

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGame } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useGameContent } from '@/hooks/useContent';
import { BookOpen, Briefcase, CheckCircle2, XCircle, Star } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSceneStore } from '@/stores/sceneStore';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { useFilteredContent } from '@/hooks/useFilteredContent';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';

// 3D Environment (no SSR)
const CareerExplorerEnvironment = dynamic(
  () => import('@/components/3d/environments/CareerExplorerEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'learn' | 'play' | 'complete';

interface Career {
  title: string;
  emoji: string;
  description: string;
  descriptionC: string;
  skills: string[];
  distractors: string[];
}

const LEARN_CARDS = [
  {
    title: 'AI Is Everywhere',
    emoji: '🌍',
    desc: 'AI is used in healthcare, gaming, finance, art, and more. Each field needs people with different AI skills.',
  },
  {
    title: 'Many Roles',
    emoji: '👩‍💻',
    desc: 'From training models to designing user interfaces — AI careers are diverse and creative, not just coding!',
  },
  {
    title: 'Skills Matter',
    emoji: '🧩',
    desc: 'Each AI career requires a unique mix of skills. Can you match the right skills to the right job?',
  },
];

const CAREERS_A: Career[] = [
  { title: 'AI Artist', emoji: '🎨', description: 'Makes pictures and art using AI tools.', descriptionC: 'Uses generative AI models to create digital artwork.', skills: ['Creativity', 'Drawing', 'Imagination'], distractors: ['Cooking', 'Swimming', 'Driving'] },
  { title: 'Robot Helper', emoji: '🤖', description: 'Builds and programs friendly robots that help people.', descriptionC: 'Designs and programs robotic systems for human assistance.', skills: ['Building', 'Problem Solving', 'Teamwork'], distractors: ['Singing', 'Dancing', 'Painting'] },
  { title: 'Data Collector', emoji: '📊', description: 'Gathers information to help AI learn new things.', descriptionC: 'Curates training datasets for machine learning systems.', skills: ['Organizing', 'Attention to Detail', 'Research'], distractors: ['Juggling', 'Skateboarding', 'Fishing'] },
  { title: 'Smart Toy Designer', emoji: '🧸', description: 'Creates fun toys that use AI to play and learn with kids.', descriptionC: 'Designs AI-powered interactive educational toys.', skills: ['Creativity', 'Fun Ideas', 'Technology'], distractors: ['Gardening', 'Hiking', 'Surfing'] },
  { title: 'AI Music Maker', emoji: '🎵', description: 'Uses AI to create and mix music.', descriptionC: 'Leverages AI composition tools for music production.', skills: ['Music', 'Creativity', 'Listening'], distractors: ['Carpentry', 'Knitting', 'Archery'] },
  { title: 'Animal AI Tracker', emoji: '🐾', description: 'Uses AI cameras to watch and protect wild animals.', descriptionC: 'Deploys computer vision systems for wildlife monitoring.', skills: ['Nature', 'Observation', 'Patience'], distractors: ['Racing', 'Boxing', 'Fencing'] },
  { title: 'Weather AI Helper', emoji: '🌤️', description: 'Uses AI to predict the weather and keep people safe.', descriptionC: 'Applies ML models to meteorological prediction systems.', skills: ['Science', 'Math', 'Curiosity'], distractors: ['Acting', 'Pottery', 'Karate'] },
  { title: 'Space AI Explorer', emoji: '🚀', description: 'Uses AI to explore space and find new planets.', descriptionC: 'Applies AI to astronomical data analysis and space exploration.', skills: ['Science', 'Exploring', 'Bravery'], distractors: ['Baking', 'Weaving', 'Golf'] },
];

const CAREERS_B: Career[] = [
  {
    title: 'Machine Learning Engineer',
    emoji: '🤖',
    description: 'Builds and trains AI models that learn from data to make predictions.',
    descriptionC: 'Designs ML pipelines, selects model architectures, optimizes hyperparameters, and deploys models to production infrastructure.',
    skills: ['Python', 'Math', 'Data Analysis'],
    distractors: ['Painting', 'Cooking', 'Singing'],
  },
  {
    title: 'Data Scientist',
    emoji: '📊',
    description: 'Finds patterns and insights hidden in large amounts of data.',
    descriptionC: 'Applies statistical modeling, hypothesis testing, and visualization to extract actionable insights from structured and unstructured datasets.',
    skills: ['Statistics', 'Data Visualization', 'SQL'],
    distractors: ['Gardening', 'Dancing', 'Carpentry'],
  },
  {
    title: 'AI Ethics Researcher',
    emoji: '⚖️',
    description: 'Makes sure AI systems are fair, safe, and respect people\'s rights.',
    descriptionC: 'Audits models for bias, develops fairness metrics, drafts governance frameworks, and advises on responsible AI deployment.',
    skills: ['Critical Thinking', 'Writing', 'Research'],
    distractors: ['Weightlifting', 'Skateboarding', 'Juggling'],
  },
  {
    title: 'Robotics Engineer',
    emoji: '🦾',
    description: 'Designs robots that can sense, move, and interact with the real world using AI.',
    descriptionC: 'Integrates perception, planning, and control systems using reinforcement learning and sensor fusion for autonomous operation.',
    skills: ['Engineering', 'Programming', 'Physics'],
    distractors: ['Knitting', 'Surfing', 'Pottery'],
  },
  {
    title: 'NLP Specialist',
    emoji: '💬',
    description: 'Teaches computers to understand and generate human language.',
    descriptionC: 'Develops transformer-based models for tasks like machine translation, sentiment analysis, named entity recognition, and text generation.',
    skills: ['Linguistics', 'Programming', 'Text Analysis'],
    distractors: ['Diving', 'Baking', 'Drumming'],
  },
  {
    title: 'Computer Vision Engineer',
    emoji: '👁️',
    description: 'Builds AI that can see and understand images and videos.',
    descriptionC: 'Implements CNNs and vision transformers for object detection, segmentation, pose estimation, and real-time video analysis.',
    skills: ['Image Processing', 'Math', 'Deep Learning'],
    distractors: ['Fishing', 'Hiking', 'Origami'],
  },
  {
    title: 'AI Product Manager',
    emoji: '📋',
    description: 'Decides what AI features to build and makes sure they help real users.',
    descriptionC: 'Translates business requirements into ML problem statements, defines success metrics, and coordinates cross-functional teams to ship AI products.',
    skills: ['Communication', 'Strategy', 'User Research'],
    distractors: ['Archery', 'Fencing', 'Astronomy'],
  },
  {
    title: 'AI Content Creator',
    emoji: '🎨',
    description: 'Uses AI tools to create art, music, videos, and stories.',
    descriptionC: 'Leverages generative models (diffusion, GANs, LLMs) with prompt engineering and fine-tuning to produce creative media at scale.',
    skills: ['Creativity', 'Prompt Engineering', 'Design'],
    distractors: ['Plumbing', 'Farming', 'Mining'],
  },
  {
    title: 'Prompt Engineer',
    emoji: '✍️',
    description: 'Writes instructions for AI to get the best results.',
    descriptionC: 'Designs and optimizes prompts for large language models to maximize output quality and reliability.',
    skills: ['Writing', 'Creativity', 'Testing'],
    distractors: ['Welding', 'Plumbing', 'Carpentry'],
  },
  {
    title: 'AI Safety Researcher',
    emoji: '🛡️',
    description: 'Makes sure AI systems are safe and don\'t cause harm.',
    descriptionC: 'Studies alignment, robustness, and interpretability to ensure AI systems behave as intended under all conditions.',
    skills: ['Research', 'Critical Thinking', 'Ethics'],
    distractors: ['Surfing', 'Skating', 'Climbing'],
  },
  {
    title: 'AI Trainer',
    emoji: '🏋️',
    description: 'Teaches AI by labeling data and giving it feedback.',
    descriptionC: 'Provides RLHF annotations, creates training datasets, and evaluates model outputs for quality and accuracy.',
    skills: ['Attention to Detail', 'Patience', 'Communication'],
    distractors: ['Magic', 'Juggling', 'Pottery'],
  },
  {
    title: 'Autonomous Vehicle Engineer',
    emoji: '🚗',
    description: 'Builds self-driving cars that use AI to navigate safely.',
    descriptionC: 'Develops perception, planning, and control systems for autonomous vehicles using sensor fusion and deep learning.',
    skills: ['Engineering', 'Problem Solving', 'Safety'],
    distractors: ['Cooking', 'Singing', 'Painting'],
  },
];

export default function CareerExplorerGame() {
  const prefersReducedMotion = useReducedMotion();
  const game = useGame();
  const activeChild = useActiveChild();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('career-explorer', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges

  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [round, setRound] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const careers = useFilteredContent((ageBand === 'A' ? CAREERS_A : CAREERS_B) as any[], tier, ageBand) as typeof CAREERS_B;
  const currentCareer = careers[round];
  const totalRounds = 8;

  useEffect(() => {
    setGameSceneContent(<CareerExplorerEnvironment careersExplored={round} currentCareer={currentCareer?.title ?? ''} />);
    return () => setGameSceneContent(null);
  }, [round, currentCareer?.title, setGameSceneContent]);

  const shuffledOptions = useMemo(() => {
    if (!currentCareer) return [];
    const all = [...currentCareer.skills, ...currentCareer.distractors];
    // Fisher-Yates shuffle
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
  }, [currentCareer]);

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

  const toggleSkill = useCallback(
    (skill: string) => {
      if (showFeedback) return;
      setSelectedSkills((prev) =>
        prev.includes(skill)
          ? prev.filter((s) => s !== skill)
          : prev.length < 3
            ? [...prev, skill]
            : prev
      );
    },
    [showFeedback]
  );

  function checkAnswer() {
    if (selectedSkills.length !== 3) return;
    const correct = currentCareer.skills.every((s) => selectedSkills.includes(s));
    setWasCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      game.updateScore(10);
      setScore((s) => s + 10);
    } else {
      game.updateScore(3);
      setScore((s) => s + 3);
    }
  }

  function nextRound() {
    setShowFeedback(false);
    setSelectedSkills([]);
    setWasCorrect(false);
    game.advanceRound();

    if (round < totalRounds - 1) {
      setRound((r) => r + 1);
    } else {
      setPhase('complete');
      game.completeGame();
    }
  }

  function handleComplete() {
    game.completeGame();
  }

  return (
    <GameShell
      gameId="career-explorer"
      title="Career Explorer"
      worldNumber={9}
      worldColor="#E68E28"
      totalRounds={totalRounds}
    >
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particle background */}
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
                background: 'radial-gradient(circle, rgba(249,115,22,0.15), transparent)',
              }}
              animate={prefersReducedMotion ? {} : { y: [0, -12, 0], opacity: [0.1, 0.3, 0.1] }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: p.dur, delay: p.delay, repeat: Infinity }}
            />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div
            className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(249,115,22,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.3)',
            }}
          >
            {/* Top LED rim */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

            <div className="flex-1 flex flex-col p-4 overflow-auto">
              <AnimatePresence mode="wait">
                {/* WELCOME */}
                {phase === 'welcome' && (
                  <motion.div
                    key="w"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto"
                  >
                    <motion.span
                      className="text-6xl"
                      animate={prefersReducedMotion ? {} : { scale: [1, 1.1, 1] }}
                      transition={prefersReducedMotion ? { duration: 0 } : { duration: 2, repeat: Infinity }}
                    >
                      🚀
                    </motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">
                      Career Explorer
                    </h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? 'Explore advanced AI career paths — from ML engineering to AI ethics. Match specialized skills to cutting-edge roles in the AI industry.'
                        : 'Discover exciting AI careers! Match the right skills to each job and learn what it takes to work in artificial intelligence.'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['AI Careers', 'Skills', 'Job Roles'].map((t) => (
                        <span
                          key={t}
                          className="px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 font-body text-2xs text-orange-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <motion.button
                      onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                      whileTap={{ scale: 0.98 }}
                      aria-label="Start learning about AI careers"
                    >
                      Explore Careers! <BookOpen className="inline w-4 h-4 ml-1" />
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
                        className="max-w-md w-full rounded-xl p-5 border border-orange-500/20 bg-orange-500/5"
                      >
                        <span className="text-4xl">{LEARN_CARDS[learnIdx].emoji}</span>
                        <h4 className="font-display text-base font-bold text-orange-300 mt-3">
                          {LEARN_CARDS[learnIdx].title}
                        </h4>
                        <p className="font-body text-sm text-white/60 mt-2">
                          {LEARN_CARDS[learnIdx].desc}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                    <motion.button
                      onClick={() => {
                        if (learnIdx < LEARN_CARDS.length - 1) setLearnIdx((i) => i + 1);
                        else {
                          game.startGame('career-explorer', totalRounds);
                          setPhase('play');
                        }
                      }}
                      className="w-full max-w-md py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                      whileTap={{ scale: 0.98 }}
                      aria-label={learnIdx < LEARN_CARDS.length - 1 ? 'Next card' : 'Start playing'}
                    >
                      {learnIdx < LEARN_CARDS.length - 1 ? 'Next →' : 'Start Matching! 🎯'}
                    </motion.button>
                    <button
                      onClick={() => {
                        game.startGame('career-explorer', totalRounds);
                        setPhase('play');
                      }}
                      className="font-body text-xs text-white/55 hover:text-white/70"
                    >
                      Skip intro →
                    </button>
                  </motion.div>
                )}

                {/* PLAY */}
                {phase === 'play' && currentCareer && (
                  <motion.div
                    key={`play-${round}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center space-y-3"
                  >
                    <div className="flex items-center gap-3 mb-3 px-4">
                      <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                      <GameProgressTracker current={round + 1} total={totalRounds} labColor="#F97316" />
                    </div>
                    {/* Round indicator */}
                    <div className="flex items-center gap-1 mb-1">
                      {Array.from({ length: totalRounds }, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < round
                              ? 'bg-orange-400'
                              : i === round
                                ? 'bg-orange-500 ring-2 ring-orange-500/30'
                                : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="font-body text-2xs text-white/60">
                      Round {round + 1} of {totalRounds}
                    </p>

                    {/* Career card */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="max-w-md w-full rounded-xl p-4 border border-orange-500/20"
                      style={{
                        background: 'rgba(249,115,22,0.05)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{currentCareer.emoji}</span>
                        <div>
                          <h3 className="font-display text-lg font-bold text-white">
                            {currentCareer.title}
                          </h3>
                          <Briefcase className="inline w-3 h-3 text-orange-400 mr-1" />
                          <span className="font-body text-2xs text-orange-400">
                            AI Career
                          </span>
                        </div>
                      </div>
                      <p className="font-body text-sm text-white/50">
                        {ageBand === 'C'
                          ? currentCareer.descriptionC
                          : currentCareer.description}
                      </p>
                    </motion.div>

                    {/* Instruction */}
                    <p className="font-body text-xs text-white/70">
                      Select the <span className="text-orange-400 font-bold">3 skills</span> needed for this career:
                    </p>

                    {/* Skill options */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-md w-full">
                      {shuffledOptions.map((skill) => {
                        const isSelected = selectedSkills.includes(skill);
                        const isCorrectSkill = currentCareer.skills.includes(skill);
                        let borderColor = 'rgba(255,255,255,0.08)';
                        let bgColor = 'rgba(255,255,255,0.02)';
                        let textColor = 'rgba(255,255,255,0.6)';

                        if (isSelected && !showFeedback) {
                          borderColor = 'rgba(249,115,22,0.5)';
                          bgColor = 'rgba(249,115,22,0.1)';
                          textColor = '#F97316';
                        } else if (showFeedback && isCorrectSkill) {
                          borderColor = 'rgba(16,185,129,0.5)';
                          bgColor = 'rgba(16,185,129,0.1)';
                          textColor = '#10B981';
                        } else if (showFeedback && isSelected && !isCorrectSkill) {
                          borderColor = 'rgba(239,68,68,0.5)';
                          bgColor = 'rgba(239,68,68,0.1)';
                          textColor = '#EF4444';
                        }

                        return (
                          <motion.button
                            key={skill}
                            onClick={() => toggleSkill(skill)}
                            className="px-3 py-2.5 rounded-xl font-body text-sm font-medium transition-colors"
                            style={{
                              border: `1px solid ${borderColor}`,
                              background: bgColor,
                              color: textColor,
                            }}
                            whileTap={showFeedback ? {} : { scale: 0.95 }}
                            aria-label={`${isSelected ? 'Deselect' : 'Select'} skill: ${skill}`}
                            aria-pressed={isSelected}
                          >
                            {showFeedback && isCorrectSkill && (
                              <CheckCircle2 className="inline w-3 h-3 mr-1" />
                            )}
                            {showFeedback && isSelected && !isCorrectSkill && (
                              <XCircle className="inline w-3 h-3 mr-1" />
                            )}
                            {skill}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Feedback or submit */}
                    {!showFeedback ? (
                      <motion.button
                        onClick={checkAnswer}
                        disabled={selectedSkills.length !== 3}
                        className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white disabled:opacity-30"
                        style={{
                          background:
                            selectedSkills.length === 3
                              ? 'linear-gradient(135deg, #F97316, #EA580C)'
                              : 'rgba(255,255,255,0.05)',
                        }}
                        whileTap={selectedSkills.length === 3 ? { scale: 0.98 } : {}}
                        aria-label="Submit your skill selection"
                      >
                        {selectedSkills.length === 3
                          ? 'Check Answer!'
                          : `Select ${3 - selectedSkills.length} more skill${3 - selectedSkills.length !== 1 ? 's' : ''}`}
                      </motion.button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center gap-2 w-full max-w-xs"
                      >
                        <div
                          className="w-full text-center py-2 rounded-lg font-display text-sm font-bold"
                          style={{
                            background: wasCorrect
                              ? 'rgba(16,185,129,0.1)'
                              : 'rgba(239,68,68,0.1)',
                            color: wasCorrect ? '#10B981' : '#EF4444',
                            border: `1px solid ${wasCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                          }}
                        >
                          {wasCorrect ? 'Perfect Match!' : 'Not quite — check the correct skills above!'}
                        </div>
                        <motion.button
                          onClick={nextRound}
                          className="w-full py-3 rounded-xl font-display font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                          whileTap={{ scale: 0.98 }}
                          aria-label="Continue to next career"
                        >
                          {round < totalRounds - 1 ? 'Next Career →' : 'See Results!'}
                        </motion.button>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* COMPLETE */}
                {phase === 'complete' && (
                  <motion.div
                    key="c"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto"
                  >
                    <motion.div
                      animate={prefersReducedMotion ? {} : { rotate: [0, 10, -10, 0] }}
                      transition={prefersReducedMotion ? { duration: 0 } : { duration: 1.5, repeat: Infinity }}
                    >
                      <Star className="w-12 h-12 text-orange-400" />
                    </motion.div>
                    <h2 className="font-display text-2xl font-bold text-white">
                      Career Expert!
                    </h2>
                    <p className="font-body text-sm text-white/50">
                      You explored {totalRounds} AI careers and scored {score} points!
                    </p>

                    {/* Career summary */}
                    <div className="w-full grid grid-cols-4 gap-2">
                      {careers.map((c, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.08 }}
                          className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/5"
                        >
                          <span className="text-lg">{c.emoji}</span>
                          <p className="font-body text-2xs text-white/60 mt-1 leading-tight text-center">
                            {c.title}
                          </p>
                        </motion.div>
                      ))}
                    </div>

                    <div className="rounded-xl p-3 border border-orange-500/15 bg-orange-500/5 w-full">
                      <p className="font-body text-xs text-white/70">
                        {ageBand === 'C'
                          ? 'AI careers span research, engineering, product, ethics, and creative domains. Each requires a unique blend of technical and soft skills — the field is far broader than just coding!'
                          : 'AI has so many career paths! Whether you love art, science, writing, or building things — there\'s an AI career for you.'}
                      </p>
                    </div>

                    <motion.button
                      onClick={handleComplete}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                      whileTap={{ scale: 0.98 }}
                      aria-label="Complete the game"
                    >
                      Complete!
                    </motion.button>
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
