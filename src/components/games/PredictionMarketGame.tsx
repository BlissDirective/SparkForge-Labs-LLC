// ════════════════════════════════════════════════════
// PREDICTION MARKET V2 — Lab 10 (AI's Future)
// Vote on AI predictions, see aggregate results.
// Enhanced: chrome bezel, welcome phase, 8 predictions,
// time horizon tags, expert analysis, animated tallying.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { TrendingUp, MessageSquare } from 'lucide-react';
import dynamic from 'next/dynamic';

// 3D Environment (no SSR)
const Canvas = dynamic(
  () => import('@react-three/fiber').then(mod => mod.Canvas),
  { ssr: false }
);
const PredictionMarketEnvironment = dynamic(
  () => import('@/components/3d/environments/PredictionMarketEnvironment'),
  { ssr: false }
);

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

type Phase = 'welcome' | 'play';

interface Prediction {
  question: string;
  emoji: string;
  horizon: string;
  mockResults: { yes: number; no: number; maybe: number };
  analysis: string;
  analysisC: string;
  band: 'A' | 'B' | 'C';
}

const ALL_PREDICTIONS: Prediction[] = [
  {
    question: 'Will AI write a #1 hit song by 2030?', emoji: '🎵', horizon: '2030', band: 'A',
    mockResults: { yes: 45, no: 30, maybe: 25 },
    analysis: 'AI can already compose music, but writing a song people LOVE enough to be #1 is really hard. Music isn\'t just notes — it\'s emotion, culture, and timing!',
    analysisC: 'Current models generate coherent audio but struggle with the cultural resonance and emotional specificity that drives chart success. Music virality depends on parasocial factors, zeitgeist alignment, and memetic propagation — all poorly modeled by current architectures.',
  },
  {
    question: 'Will most homework be done with AI help by 2028?', emoji: '📚', horizon: '2028', band: 'A',
    mockResults: { yes: 62, no: 18, maybe: 20 },
    analysis: 'Many students already use AI for homework. The question is whether schools will adapt or try to ban it. Most experts think adaptation will win!',
    analysisC: 'Adoption is rapid but regulatory response from educational institutions will shape outcomes. The equilibrium likely involves AI-assisted pedagogy rather than prohibition — similar to calculator adoption in mathematics education during the 1970s-80s.',
  },
  {
    question: 'Will self-driving cars be common in cities by 2030?', emoji: '🚗', horizon: '2030', band: 'A',
    mockResults: { yes: 38, no: 35, maybe: 27 },
    analysis: 'Self-driving taxis exist in some cities, but "common" everywhere is a big challenge. Weather, different road rules, and unexpected situations make it really hard!',
    analysisC: 'Level 4 autonomy is deployed in geofenced areas (Waymo, Cruise). Full urban deployment requires solving the long tail of edge cases — adverse weather perception, construction zone navigation, and multi-agent interaction in unstructured environments. Regulatory fragmentation across jurisdictions adds non-technical barriers.',
  },
  {
    question: 'Will AI help cure a major disease by 2030?', emoji: '🧬', horizon: '2030', band: 'A',
    mockResults: { yes: 55, no: 15, maybe: 30 },
    analysis: 'AI already helps discover new drugs! AlphaFold solved protein folding — a huge deal for medicine. A cure is possible but takes years of testing even after discovery.',
    analysisC: 'AlphaFold revolutionized structural biology. AI-assisted drug discovery pipelines (Insilico Medicine, Recursion) have candidates in Phase I/II trials. However, "cure" requires successful Phase III trials, FDA approval, and manufacturing scale-up — a 5-10 year pipeline from discovery.',
  },
  {
    question: 'Will AI create a movie that wins an Oscar by 2035?', emoji: '🎬', horizon: '2035', band: 'B',
    mockResults: { yes: 32, no: 40, maybe: 28 },
    analysis: 'AI can help make movies, but Oscar voters value human creativity and storytelling. Maybe AI will be a tool used in an Oscar-winning film, but fully AI-made? That\'s harder.',
    analysisC: 'Current generative video models lack narrative coherence. Academy voting favors auteur vision and emotional authenticity. The more likely path is AI as a production tool (VFX, editing, scoring) in human-directed films — similar to how CGI enabled films without replacing directors.',
  },
  {
    question: 'Will AI replace most customer service agents by 2028?', emoji: '🤖', horizon: '2028', band: 'B',
    mockResults: { yes: 52, no: 25, maybe: 23 },
    analysis: 'AI chatbots handle simple questions well, but complex issues still need humans. Expect AI to handle 80% of easy cases while humans focus on the tricky 20%.',
    analysisC: 'LLM-powered agents handle Tier 1 support effectively. Complex escalation and emotional labor remain human domains. The likely outcome is augmentation — AI handling routine queries (password resets, order tracking) while human agents focus on high-empathy and edge-case interactions.',
  },
  {
    question: 'Will we have AI that truly "understands" like humans by 2035?', emoji: '🧠', horizon: '2035', band: 'C',
    mockResults: { yes: 28, no: 42, maybe: 30 },
    analysis: 'This is one of the biggest debates in AI! We\'re not sure what "understanding" even means. AI can seem very smart without actually understanding anything.',
    analysisC: 'The Chinese Room argument remains unresolved. Current systems exhibit behavioral competence without verified comprehension. Whether artificial general understanding requires embodiment, causal reasoning, or entirely new architectures is an open question in cognitive science and AI research.',
  },
  {
    question: 'Will AI-generated art be legally copyrightable by 2030?', emoji: '🎨', horizon: '2030', band: 'C',
    mockResults: { yes: 40, no: 35, maybe: 25 },
    analysis: 'Courts are still figuring this out. The law hasn\'t caught up with the technology yet. Different countries might have different rules!',
    analysisC: 'Current US Copyright Office position requires human authorship. EU AI Act may establish sui generis rights for AI outputs. The legal landscape is evolving — Thaler v. Perlmutter (2023) denied copyright for fully autonomous AI art, but the threshold of human creative contribution needed remains undefined.',
  },
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

export function PredictionMarketGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const isMobile = useIsMobile();

  const [phase, setPhase] = useState<Phase>('welcome');
  const [predIdx, setPredIdx] = useState(0);
  const [voted, setVoted] = useState(false);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const predictions = useMemo(
    () => ALL_PREDICTIONS.filter(p => BAND_ORDER[p.band] <= BAND_ORDER[ageBand]),
    [ageBand]
  );
  const pred = predictions[predIdx];

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: ((i * 37 + 13) % 100),
    y: ((i * 53 + 7) % 100),
    size: (i % 3) + 1,
    delay: (i * 0.33) % 4,
    dur: (i % 6) + 4,
  })), []);

  function handleVote(vote: string) {
    setMyVote(vote);
    setVoted(true);
    game.updateScore(10);
  }

  function nextPrediction() {
    setVoted(false); setMyVote(null); setShowAnalysis(false);
    if (predIdx < predictions.length - 1) { setPredIdx(i => i + 1); game.advanceRound(); }
    else game.completeGame();
  }

  return (
    <GameShell gameId="prediction-market" title="Prediction Market" worldNumber={10} worldColor="#D946EF" totalRounds={predictions.length}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* 3D Environment Background */}
        {!isMobile && (
          <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
            <Canvas
              camera={{ position: [0, 2, 8], fov: 50 }}
              style={{ background: 'transparent' }}
              gl={{ alpha: true, antialias: true }}
            >
              <PredictionMarketEnvironment predictions={predIdx} confidence={voted ? 0.8 : 0.5} />
            </Canvas>
          </div>
        )}

        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(217,70,239,${0.15 + p.size * 0.06}), transparent)` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(217,70,239,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4 items-center justify-center">
              <AnimatePresence mode="wait">
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }} className="text-center space-y-4">
                    <span className="text-5xl">📈</span>
                    <h2 className="font-display text-2xl font-bold text-white">Prediction Market</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">What will AI do in the future? Vote on predictions and see what others think!</p>
                    <div className="flex gap-2 justify-center">
                      {['AI Future', 'Forecasting', 'Critical Thinking'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 text-xs font-body text-fuchsia-400">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #D946EF, #A855F7)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Start Predicting! <TrendingUp className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {phase === 'play' && pred && (
                  <motion.div key={predIdx} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }} className="max-w-md w-full text-center">
                    {/* Time horizon badge */}
                    <span className="px-2 py-0.5 rounded bg-fuchsia-500/10 font-mono text-[10px] text-fuchsia-400 mb-2 inline-block">by {pred.horizon}</span>
                    <span className="text-4xl block mb-3">{pred.emoji}</span>
                    <h3 className="font-display text-lg font-bold text-white mb-5">{pred.question}</h3>

                    {!voted ? (
                      <div className="flex gap-3 justify-center">
                        {[{ label: 'YES', value: 'yes', color: '#10B981' }, { label: 'NO', value: 'no', color: '#EF4444' }, { label: 'MAYBE', value: 'maybe', color: '#F59E0B' }].map(opt => (
                          <motion.button key={opt.value} onClick={() => handleVote(opt.value)}
                            className="px-6 py-3 rounded-xl border-2 font-display font-bold text-sm"
                            style={{ borderColor: `${opt.color}50`, color: opt.color, background: `${opt.color}10` }}
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} aria-label={`Vote ${opt.label}`}>
                            {opt.label}
                          </motion.button>
                        ))}
                      </div>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <p className="font-body text-xs text-white/30">How others voted:</p>
                        <div className="space-y-2 max-w-xs mx-auto">
                          {[{ label: 'Yes', pct: pred.mockResults.yes, color: '#10B981' }, { label: 'No', pct: pred.mockResults.no, color: '#EF4444' }, { label: 'Maybe', pct: pred.mockResults.maybe, color: '#F59E0B' }].map(r => (
                            <div key={r.label} className="flex items-center gap-2">
                              <span className={`font-body text-xs w-12 text-right ${myVote === r.label.toLowerCase() ? 'text-white font-bold' : 'text-white/30'}`}>{r.label}</span>
                              <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden">
                                <motion.div className="h-full rounded" style={{ backgroundColor: r.color }}
                                  initial={{ width: 0 }} animate={{ width: `${r.pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
                              </div>
                              <span className="font-mono text-xs text-white/30 w-8">{r.pct}%</span>
                            </div>
                          ))}
                        </div>

                        {/* Expert analysis toggle */}
                        <motion.button onClick={() => setShowAnalysis(!showAnalysis)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 mx-auto"
                          whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                          <MessageSquare className="w-3 h-3 text-fuchsia-400" />
                          <span className="font-display text-xs font-bold text-white">Expert Analysis</span>
                        </motion.button>

                        <AnimatePresence>
                          {showAnalysis && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                              <div className="rounded-xl p-3 border border-fuchsia-500/15 bg-fuchsia-500/5">
                                <p className="font-body text-xs text-white/50">{ageBand === 'C' ? pred.analysisC : pred.analysis}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <motion.button onClick={nextPrediction}
                          className="w-full max-w-xs mx-auto py-3 rounded-xl font-display font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #D946EF, #A855F7)' }}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          Next Prediction →
                        </motion.button>
                      </motion.div>
                    )}
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
