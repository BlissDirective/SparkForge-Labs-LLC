// ================================================================
// FUTURE FORGE — Lab 10 (Future of AI)
// Design AI solutions for future problems by combining capabilities.
// Teaches: AI applications, capability composition, impact assessment.
//
// V3 ENHANCEMENTS:
// - Desktop: Blueprint-style 3D via FutureForge3D
// - Mobile fallback: 2D CSS card layout (V2 behavior)
// ================================================================

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Rocket, Zap, Eye, MessageSquare, Cpu, Bot, Shield, Sparkles, CheckCircle, Star } from 'lucide-react';
import dynamic from 'next/dynamic';

const FutureForge3D = dynamic(
  () => import('@/components/3d/FutureForge3D'),
  { ssr: false }
);

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => { setM(window.innerWidth < 768); }, []);
  return m;
}

type Phase = 'welcome' | 'learn' | 'play' | 'complete';

interface Capability {
  id: string;
  name: string;
  icon: typeof Eye;
  color: string;
  description: string;
}

interface Scenario {
  id: string;
  title: string;
  problem: string;
  problemSimple: string;
  correctCapabilities: string[];
  bonusCapability?: string;
  impactText: string;
  impactTextSimple: string;
}

const CAPABILITIES: Capability[] = [
  { id: 'vision', name: 'Computer Vision', icon: Eye, color: '#00BBFF', description: 'See and understand images' },
  { id: 'language', name: 'Language AI', icon: MessageSquare, color: '#AA66FF', description: 'Understand and generate text' },
  { id: 'robotics', name: 'Robotics', icon: Bot, color: '#00FF88', description: 'Move and interact physically' },
  { id: 'prediction', name: 'Prediction', icon: Zap, color: '#FFAA44', description: 'Forecast future outcomes' },
  { id: 'processing', name: 'Data Processing', icon: Cpu, color: '#06B6D4', description: 'Analyze large datasets fast' },
  { id: 'safety', name: 'Safety Systems', icon: Shield, color: '#FF6644', description: 'Detect dangers and protect' },
];

const SCENARIOS: Scenario[] = [
  {
    id: 's1', title: 'Ocean Cleanup',
    problem: 'Millions of tons of plastic pollute our oceans. Design an AI system to find and collect ocean plastic.',
    problemSimple: 'The ocean has lots of plastic trash. Build an AI helper to find and pick it up!',
    correctCapabilities: ['vision', 'robotics', 'processing'],
    bonusCapability: 'prediction',
    impactText: 'Your AI fleet could remove 80% of surface ocean plastic, protecting marine ecosystems.',
    impactTextSimple: 'Your robot helpers could clean up most of the ocean trash and save the fish!',
  },
  {
    id: 's2', title: 'Wildfire Prevention',
    problem: 'Climate change increases wildfire risk. Design an AI system for early detection and prevention.',
    problemSimple: 'Forest fires are dangerous. Build an AI that spots fires before they get big!',
    correctCapabilities: ['vision', 'prediction', 'processing'],
    bonusCapability: 'safety',
    impactText: 'Early AI detection could reduce wildfire damage by 60% through rapid response coordination.',
    impactTextSimple: 'Your AI could spot fires super early and help firefighters save the forest!',
  },
  {
    id: 's3', title: 'Language Translator',
    problem: 'There are 7,000+ languages worldwide. Design an AI that enables real-time universal translation.',
    problemSimple: 'People speak different languages. Build an AI that helps everyone understand each other!',
    correctCapabilities: ['language', 'processing'],
    bonusCapability: 'vision',
    impactText: 'Universal translation AI could connect 8 billion people, breaking down communication barriers.',
    impactTextSimple: 'Your AI could help everyone in the whole world talk to each other!',
  },
  {
    id: 's4', title: 'Smart Farm',
    problem: 'Growing food efficiently is vital. Design an AI system to optimize farming and reduce waste.',
    problemSimple: 'Farmers need help growing food. Build an AI that helps plants grow better!',
    correctCapabilities: ['vision', 'prediction', 'robotics'],
    bonusCapability: 'processing',
    impactText: 'AI-optimized farming could increase crop yields by 40% while using 30% less water.',
    impactTextSimple: 'Your AI farm could grow way more food and use less water!',
  },
  {
    id: 's5', title: 'Space Explorer',
    problem: 'Exploring distant planets requires autonomous AI systems. Design an AI space probe.',
    problemSimple: 'We want to explore space! Build an AI robot that can explore other planets!',
    correctCapabilities: ['vision', 'robotics', 'safety'],
    bonusCapability: 'processing',
    impactText: 'Autonomous AI probes could explore 10x more planets than human-operated missions.',
    impactTextSimple: 'Your space robot could explore planets we have never seen before!',
  },
  {
    id: 's6', title: 'Medical Helper',
    problem: 'Doctors need help diagnosing rare diseases. Design an AI medical assistant.',
    problemSimple: 'Doctors need a helper. Build an AI that helps find out why people feel sick!',
    correctCapabilities: ['language', 'processing', 'prediction'],
    bonusCapability: 'vision',
    impactText: 'AI diagnostics could improve rare disease detection rates by 50%, saving thousands of lives.',
    impactTextSimple: 'Your AI doctor helper could find sicknesses faster and help people get better!',
  },
  {
    id: 's7', title: 'Traffic Controller',
    problem: 'City traffic wastes time and fuel. Design an AI system to optimize traffic flow.',
    problemSimple: 'Cars get stuck in traffic. Build an AI that helps all the cars move smoothly!',
    correctCapabilities: ['prediction', 'processing', 'safety'],
    bonusCapability: 'vision',
    impactText: 'AI traffic optimization could reduce commute times by 35% and emissions by 25%.',
    impactTextSimple: 'Your AI could make traffic jams disappear and help everyone get home faster!',
  },
  {
    id: 's8', title: 'Disaster Response',
    problem: 'Natural disasters require rapid, coordinated response. Design an AI emergency management system.',
    problemSimple: 'When storms or earthquakes happen, people need help fast. Build an AI rescue helper!',
    correctCapabilities: ['vision', 'robotics', 'safety'],
    bonusCapability: 'prediction',
    impactText: 'AI-coordinated disaster response could reduce emergency response times by 70%.',
    impactTextSimple: 'Your AI could help rescue people much faster when bad things happen!',
  },
];

export default function FutureForgeGame() {
  const game = useGameStore();
  const ageBand = useChildStore(s => s.activeChild?.age_band) || 'B';
  const isMobile = useIsMobile();

  const [phase, setPhase] = useState<Phase>('welcome');
  const [round, setRound] = useState(1);
  const totalRounds = 8;

  const scenario = useMemo(() => SCENARIOS[(round - 1) % SCENARIOS.length], [round]);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [roundScore, setRoundScore] = useState(0);

  const toggleCapability = useCallback((id: string) => {
    if (submitted) return;
    setSelected(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  }, [submitted]);

  const submitSolution = useCallback(() => {
    if (selected.length === 0) return;

    const correct = selected.filter(s => scenario.correctCapabilities.includes(s)).length;
    const total = scenario.correctCapabilities.length;
    const hasBonus = scenario.bonusCapability && selected.includes(scenario.bonusCapability);
    const wrongPicks = selected.filter(s => !scenario.correctCapabilities.includes(s) && s !== scenario.bonusCapability).length;

    let score = Math.round((correct / total) * 80);
    if (hasBonus) score += 15;
    if (wrongPicks === 0 && correct === total) score += 5;
    score = Math.min(score, 100);

    setRoundScore(score);
    game.updateScore(score);
    setSubmitted(true);
  }, [selected, scenario, game]);

  const nextRound = useCallback(() => {
    game.advanceRound();
    if (round < totalRounds) {
      setRound(r => r + 1);
      setSelected([]);
      setSubmitted(false);
      setRoundScore(0);
    } else {
      setPhase('complete');
      game.completeGame();
    }
  }, [round, totalRounds, game]);

  const learnText = useMemo(() => {
    if (ageBand === 'A') return 'AI can solve big problems by combining different super powers — like seeing, talking, and moving! Pick the right powers to solve each challenge!';
    if (ageBand === 'B') return 'Real AI solutions combine multiple capabilities — computer vision, natural language processing, robotics, and more. Your job is to design the right combination for each problem.';
    return 'Modern AI systems are composite architectures combining specialized capabilities. You\'ll practice systems design by selecting the optimal capability stack for complex real-world scenarios.';
  }, [ageBand]);

  const isCorrectPick = useCallback((id: string) => scenario.correctCapabilities.includes(id), [scenario]);
  const isBonusPick = useCallback((id: string) => scenario.bonusCapability === id, [scenario]);

  return (
    <GameShell gameId="future-forge" title="Future Forge" worldNumber={10} worldColor="#D946EF" totalRounds={totalRounds}>
      <AnimatePresence mode="wait">
        {phase === 'welcome' && (
          <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center gap-6 p-8 text-center">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
              <Rocket className="w-16 h-16 text-[#D946EF]" />
            </motion.div>
            <h2 className="font-display text-3xl text-white">Future Forge</h2>
            <p className="font-body text-white/70 max-w-md">Design AI solutions for tomorrow&apos;s biggest challenges!</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setPhase('learn'); game.startGame('future-forge', totalRounds); }}
              className="px-8 py-3 rounded-xl font-display text-lg"
              style={{ background: 'linear-gradient(135deg, #D946EF, #A855F7)', color: '#0A0E16' }}>
              Start Building
            </motion.button>
          </motion.div>
        )}

        {phase === 'learn' && (
          <motion.div key="learn" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center gap-6 p-8 text-center">
            <Sparkles className="w-12 h-12 text-[#D946EF]" />
            <h2 className="font-display text-2xl text-white">AI Capabilities</h2>
            <p className="font-body text-white/70 max-w-lg">{learnText}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-lg">
              {CAPABILITIES.map(cap => {
                const Icon = cap.icon;
                return (
                  <div key={cap.id} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(17,17,24,0.8)', border: `1px solid ${cap.color}30` }}>
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: cap.color }} />
                    <span className="font-body text-xs text-white/70">{cap.name}</span>
                  </div>
                );
              })}
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setPhase('play')}
              className="px-8 py-3 rounded-xl font-display text-lg"
              style={{ background: 'linear-gradient(135deg, #D946EF, #A855F7)', color: '#0A0E16' }}>
              Let&apos;s Design!
            </motion.button>
          </motion.div>
        )}

        {phase === 'play' && (
          <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4 p-4 w-full max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="font-display text-sm text-white/60">Round {round}/{totalRounds}</span>
              <span className="font-data text-sm" style={{ color: '#D946EF' }}>{game.score} pts</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
              {/* 3D Scene */}
              {!isMobile && (
                <div className="hidden lg:block w-44 h-44 flex-shrink-0">
                  <FutureForge3D
                      step={round}
                      selectedSkills={new Set(selected)}
                      allSkills={CAPABILITIES.map(c => ({ name: c.name, emoji: '⚡' }))}
                      problemEmoji="🔧"
                      inventionName={scenario.title}
                      innovationScore={roundScore}
                    />
                </div>
              )}

              {/* Scenario Card */}
              <div className="flex-1">
                <motion.div layout className="p-5 rounded-xl mb-4"
                  style={{ background: 'rgba(17,17,24,0.8)', border: '1px solid rgba(217,70,239,0.2)' }}>
                  <h3 className="font-display text-xl text-white mb-2">{scenario.title}</h3>
                  <p className="font-body text-sm text-white/70">
                    {ageBand === 'A' ? scenario.problemSimple : scenario.problem}
                  </p>
                  {!submitted && (
                    <p className="font-body text-xs text-white/40 mt-2">Select up to 4 AI capabilities to solve this problem.</p>
                  )}
                </motion.div>

                {/* Capability Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CAPABILITIES.map(cap => {
                    const Icon = cap.icon;
                    const isSelected = selected.includes(cap.id);
                    const showCorrect = submitted && isCorrectPick(cap.id);
                    const showBonus = submitted && isBonusPick(cap.id) && isSelected;
                    const showWrong = submitted && isSelected && !isCorrectPick(cap.id) && !isBonusPick(cap.id);
                    const showMissed = submitted && !isSelected && isCorrectPick(cap.id);

                    return (
                      <motion.button key={cap.id} whileHover={!submitted ? { scale: 1.03 } : {}} whileTap={!submitted ? { scale: 0.97 } : {}}
                        onClick={() => toggleCapability(cap.id)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-all"
                        style={{
                          background: isSelected ? `${cap.color}15` : 'rgba(17,17,24,0.8)',
                          border: showCorrect || showBonus ? '2px solid #00FF88' : showWrong ? '2px solid #FF6644' : showMissed ? '2px dashed rgba(255,255,255,0.2)' : isSelected ? `2px solid ${cap.color}` : '1px solid rgba(255,255,255,0.06)',
                        }}
                        aria-label={`${isSelected ? 'Remove' : 'Add'} ${cap.name}`}
                        aria-pressed={isSelected}>
                        <Icon className="w-6 h-6" style={{ color: cap.color }} />
                        <span className="font-display text-xs text-white">{cap.name}</span>
                        <span className="font-body text-[10px] text-white/40">{cap.description}</span>
                        {showBonus && <Star className="w-3 h-3 text-[#FFAA44] absolute -top-1 -right-1" />}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Submit / Results */}
            <div className="flex flex-col items-center gap-3">
              {!submitted ? (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={submitSolution} disabled={selected.length === 0}
                  className="px-8 py-3 rounded-xl font-display text-sm disabled:opacity-30"
                  style={{ background: 'linear-gradient(135deg, #D946EF, #A855F7)', color: '#0A0E16' }}
                  aria-label="Submit solution">
                  Submit Solution
                </motion.button>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl w-full max-w-md"
                  style={{ background: 'rgba(17,17,24,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="font-data text-2xl" style={{ color: roundScore >= 75 ? '#00FF88' : roundScore >= 50 ? '#FFAA44' : '#FF6644' }}>
                    {roundScore} points
                  </div>
                  <p className="font-body text-sm text-white/70 text-center">
                    {ageBand === 'A' ? scenario.impactTextSimple : scenario.impactText}
                  </p>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={nextRound}
                    className="px-6 py-2 rounded-xl font-display text-sm"
                    style={{ background: 'linear-gradient(135deg, #D946EF, #A855F7)', color: '#0A0E16' }}
                    aria-label={round < totalRounds ? 'Next scenario' : 'Finish'}>
                    {round < totalRounds ? 'Next Scenario' : 'See Results!'}
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {phase === 'complete' && (
          <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center gap-6 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-[#D946EF]" />
            <h2 className="font-display text-3xl text-white">Future Designed!</h2>
            <p className="font-body text-white/70 max-w-md">
              {ageBand === 'A' ? 'You combined AI super powers to solve amazing future problems! You\'re a real AI inventor!' :
               ageBand === 'B' ? 'You designed AI solutions by combining the right capabilities for each challenge. That\'s how real AI engineers think!' :
               'You demonstrated AI systems design by composing capability architectures for complex scenarios. This compositional thinking is at the core of modern AI engineering.'}
            </p>
            <div className="font-data text-4xl" style={{ color: '#D946EF' }}>{game.score} pts</div>
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  );
}
