// ════════════════════════════════════════════════════
// PREDICTION MARKET V2 — Lab 10 (AI's Future)
// Vote on AI predictions, see aggregate results.
// Enhanced: chrome bezel, welcome phase, 8 predictions,
// time horizon tags, expert analysis, animated tallying.
//
// ENH: Animated voting bars + crowd visualization + accuracy counter + gold glow
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useGameContent } from '@/hooks/useContent';
import { useSceneStore } from '@/stores/sceneStore';
import { TrendingUp, MessageSquare } from 'lucide-react';
import dynamic from 'next/dynamic';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';
import { useFilteredContent } from '@/hooks/useFilteredContent';

// 3D Environment (no SSR)
const PredictionMarketEnvironment = dynamic(
  () => import('@/components/3d/environments/PredictionMarketEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'learn' | 'play' | 'complete';

const LEARN_CARDS = [
  { title: 'AI Predictions', emoji: '🔮', desc: 'AI can analyze patterns in data to make predictions about the future — from weather forecasts to stock markets to scientific discoveries.' },
  { title: 'Uncertainty is Normal', emoji: '🎲', desc: 'No prediction is 100% certain. Good AI systems tell you HOW confident they are. Understanding uncertainty is key to using AI wisely.' },
  { title: 'Thinking About the Future', emoji: '🚀', desc: 'In this game, you\'ll vote on AI predictions and see how your thinking compares with expert analysis. There are no wrong answers — just different perspectives!' },
];

interface Prediction {
  question: string;
  emoji: string;
  horizon: string;
  mockResults: { yes: number; no: number; maybe: number };
  analysis: string;
  analysisC: string;
  band: 'A' | 'B' | 'C';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}

const ALL_PREDICTIONS: Prediction[] = [
  // ── Band A — accessible to ages 7-9 ─────────────────
  {
    question: 'Will AI write a #1 hit song by 2030?', emoji: '🎵', horizon: '2030', band: 'A', difficulty: 'easy',
    mockResults: { yes: 45, no: 30, maybe: 25 },
    analysis: 'AI can already compose music, but writing a song people LOVE enough to be #1 is really hard. Music isn\'t just notes — it\'s emotion, culture, and timing!',
    analysisC: 'Current models generate coherent audio but struggle with the cultural resonance and emotional specificity that drives chart success. Music virality depends on parasocial factors, zeitgeist alignment, and memetic propagation — all poorly modeled by current architectures.',
  },
  {
    question: 'Will most homework be done with AI help by 2028?', emoji: '📚', horizon: '2028', band: 'A', difficulty: 'easy',
    mockResults: { yes: 62, no: 18, maybe: 20 },
    analysis: 'Many students already use AI for homework. The question is whether schools will adapt or try to ban it. Most experts think adaptation will win!',
    analysisC: 'Adoption is rapid but regulatory response from educational institutions will shape outcomes. The equilibrium likely involves AI-assisted pedagogy rather than prohibition — similar to calculator adoption in mathematics education during the 1970s-80s.',
  },
  {
    question: 'Will self-driving cars be common in cities by 2030?', emoji: '🚗', horizon: '2030', band: 'A', difficulty: 'easy',
    mockResults: { yes: 38, no: 35, maybe: 27 },
    analysis: 'Self-driving taxis exist in some cities, but "common" everywhere is a big challenge. Weather, different road rules, and unexpected situations make it really hard!',
    analysisC: 'Level 4 autonomy is deployed in geofenced areas (Waymo, Cruise). Full urban deployment requires solving the long tail of edge cases — adverse weather perception, construction zone navigation, and multi-agent interaction in unstructured environments. Regulatory fragmentation across jurisdictions adds non-technical barriers.',
  },
  {
    question: 'Will AI help cure a major disease by 2030?', emoji: '🧬', horizon: '2030', band: 'A', difficulty: 'easy',
    mockResults: { yes: 55, no: 15, maybe: 30 },
    analysis: 'AI already helps discover new drugs! AlphaFold solved protein folding — a huge deal for medicine. A cure is possible but takes years of testing even after discovery.',
    analysisC: 'AlphaFold revolutionized structural biology. AI-assisted drug discovery pipelines (Insilico Medicine, Recursion) have candidates in Phase I/II trials. However, "cure" requires successful Phase III trials, FDA approval, and manufacturing scale-up — a 5-10 year pipeline from discovery.',
  },
  {
    question: 'Will AI tutors help every student learn at their own speed by 2030?', emoji: '🎓', horizon: '2030', band: 'A', difficulty: 'easy',
    mockResults: { yes: 58, no: 17, maybe: 25 },
    analysis: 'AI tutors already exist! They can explain things in different ways and go at your pace. The hard part is making sure every school has access to the technology.',
    analysisC: 'Adaptive learning platforms (Khan Academy, Duolingo) demonstrate personalization at scale. Key barriers are infrastructure (device access, bandwidth) and pedagogical integration. Equity gaps may widen before narrowing as adoption is correlated with socioeconomic status.',
  },
  {
    question: 'Will AI be able to translate every language perfectly by 2032?', emoji: '🌍', horizon: '2032', band: 'A', difficulty: 'medium',
    mockResults: { yes: 30, no: 38, maybe: 32 },
    analysis: 'AI translation is already pretty good for common languages, but "perfectly" is very hard. Jokes, slang, and cultural meaning are tricky for AI!',
    analysisC: 'Neural machine translation excels at high-resource language pairs. Low-resource languages (< 10K parallel sentences) remain challenging. Pragmatic and cultural context, idioms, and humor represent fundamental limitations of current sequence-to-sequence architectures.',
  },
  {
    question: 'Will robots powered by AI do household chores by 2030?', emoji: '🤖', horizon: '2030', band: 'A', difficulty: 'medium',
    mockResults: { yes: 42, no: 28, maybe: 30 },
    analysis: 'Robot vacuums exist, but a robot that can do laundry, cook, AND clean? That needs much better hands and movement. It might start with simple tasks first!',
    analysisC: 'Manipulation in unstructured environments remains an open challenge. Current humanoid robots (Tesla Optimus, Figure) demonstrate basic mobility but lack the dexterity for diverse household tasks. Sim-to-real transfer for fine motor control is a primary bottleneck.',
  },
  {
    question: 'Will AI help predict natural disasters a week before they happen by 2032?', emoji: '🌊', horizon: '2032', band: 'A', difficulty: 'medium',
    mockResults: { yes: 35, no: 30, maybe: 35 },
    analysis: 'AI is getting better at weather prediction. Earthquakes are still very hard to predict, but floods, hurricanes, and wildfires could be predicted much earlier with AI help!',
    analysisC: 'GraphCast and Pangu-Weather demonstrate AI superiority over traditional numerical weather prediction at 7-day horizons. Seismological prediction remains fundamentally limited by chaotic dynamics. AI excels at pattern detection in precursor signals for floods and tropical cyclones.',
  },

  // ── Band B — accessible to ages 10-12 ───────────────
  {
    question: 'Will AI create a movie that wins an Oscar by 2035?', emoji: '🎬', horizon: '2035', band: 'B', difficulty: 'medium',
    mockResults: { yes: 32, no: 40, maybe: 28 },
    analysis: 'AI can help make movies, but Oscar voters value human creativity and storytelling. Maybe AI will be a tool used in an Oscar-winning film, but fully AI-made? That\'s harder.',
    analysisC: 'Current generative video models lack narrative coherence. Academy voting favors auteur vision and emotional authenticity. The more likely path is AI as a production tool (VFX, editing, scoring) in human-directed films — similar to how CGI enabled films without replacing directors.',
  },
  {
    question: 'Will AI replace most customer service agents by 2028?', emoji: '🤖', horizon: '2028', band: 'B', difficulty: 'medium',
    mockResults: { yes: 52, no: 25, maybe: 23 },
    analysis: 'AI chatbots handle simple questions well, but complex issues still need humans. Expect AI to handle 80% of easy cases while humans focus on the tricky 20%.',
    analysisC: 'LLM-powered agents handle Tier 1 support effectively. Complex escalation and emotional labor remain human domains. The likely outcome is augmentation — AI handling routine queries (password resets, order tracking) while human agents focus on high-empathy and edge-case interactions.',
  },
  {
    question: 'Will AI coaches help athletes improve faster than human coaches by 2030?', emoji: '🏅', horizon: '2030', band: 'B', difficulty: 'medium',
    mockResults: { yes: 40, no: 32, maybe: 28 },
    analysis: 'AI can analyze player movement and strategy really well, but motivation, teamwork, and mental coaching still need humans. AI will probably work alongside human coaches!',
    analysisC: 'Computer vision-based motion analysis and biomechanical optimization are already deployed in elite sports. However, coaching encompasses psychological support, team dynamics, and real-time tactical adaptation — areas requiring emotional intelligence and contextual judgment.',
  },
  {
    question: 'Will AI design new materials that make buildings earthquake-proof by 2035?', emoji: '🏗️', horizon: '2035', band: 'B', difficulty: 'hard',
    mockResults: { yes: 45, no: 22, maybe: 33 },
    analysis: 'AI is already helping scientists discover new materials faster. Making buildings totally earthquake-proof is hard, but AI could find materials that absorb shocks much better!',
    analysisC: 'Generative design and materials informatics have accelerated the discovery of metamaterials with negative Poisson ratios and programmable stiffness. Full earthquake-proofing also requires structural engineering innovation — AI assists but cannot solve alone.',
  },
  {
    question: 'Will AI-powered drones deliver most packages in cities by 2032?', emoji: '📦', horizon: '2032', band: 'B', difficulty: 'hard',
    mockResults: { yes: 35, no: 38, maybe: 27 },
    analysis: 'Drone delivery is already being tested in some areas! But "most packages" in busy cities has lots of obstacles: buildings, people, weather, and rules about where drones can fly.',
    analysisC: 'Urban air mobility faces regulatory, safety, and scalability challenges. Last-mile delivery economics favor ground-based autonomous vehicles in dense urban areas. Drones may dominate suburban/rural delivery but face density-limited throughput in cities.',
  },
  {
    question: 'Will AI help create personalized medicine based on your DNA by 2030?', emoji: '💊', horizon: '2030', band: 'B', difficulty: 'hard',
    mockResults: { yes: 50, no: 18, maybe: 32 },
    analysis: 'Your DNA makes you unique, and AI can help doctors create treatments just for you. Some personalized treatments already exist for cancer!',
    analysisC: 'Pharmacogenomics is already influencing oncology treatment selection. AI accelerates biomarker discovery and drug-gene interaction prediction. However, cost, data privacy, and clinical validation pipelines limit widespread deployment to specialized conditions initially.',
  },
  {
    question: 'Will AI help explore the ocean floor better than humans by 2030?', emoji: '🌊', horizon: '2030', band: 'B', difficulty: 'hard',
    mockResults: { yes: 60, no: 15, maybe: 25 },
    analysis: 'We have explored less than 20% of the ocean floor! AI-powered submarines could explore the deep sea without risking human lives and map everything much faster.',
    analysisC: 'Autonomous underwater vehicles (AUVs) with ML-based navigation and real-time bathymetric mapping are operational. AI excels at processing sonar data and identifying geological features. The Seabed 2030 project aims for full ocean floor mapping with AI-assisted processing.',
  },

  // ── Band C — accessible to ages 13-16 ───────────────
  {
    question: 'Will we have AI that truly "understands" like humans by 2035?', emoji: '🧠', horizon: '2035', band: 'C', difficulty: 'hard',
    mockResults: { yes: 28, no: 42, maybe: 30 },
    analysis: 'This is one of the biggest debates in AI! We\'re not sure what "understanding" even means. AI can seem very smart without actually understanding anything.',
    analysisC: 'The Chinese Room argument remains unresolved. Current systems exhibit behavioral competence without verified comprehension. Whether artificial general understanding requires embodiment, causal reasoning, or entirely new architectures is an open question in cognitive science and AI research.',
  },
  {
    question: 'Will AI-generated art be legally copyrightable by 2030?', emoji: '🎨', horizon: '2030', band: 'C', difficulty: 'hard',
    mockResults: { yes: 40, no: 35, maybe: 25 },
    analysis: 'Courts are still figuring this out. The law hasn\'t caught up with the technology yet. Different countries might have different rules!',
    analysisC: 'Current US Copyright Office position requires human authorship. EU AI Act may establish sui generis rights for AI outputs. The legal landscape is evolving — Thaler v. Perlmutter (2023) denied copyright for fully autonomous AI art, but the threshold of human creative contribution needed remains undefined.',
  },
  {
    question: 'Will AI be used to write and enforce laws by 2035?', emoji: '⚖️', horizon: '2035', band: 'C', difficulty: 'expert',
    mockResults: { yes: 22, no: 48, maybe: 30 },
    analysis: 'AI could help analyze laws and find problems, but actually writing and enforcing laws involves values, fairness, and democracy — things that are very hard to automate!',
    analysisC: 'Legal NLP for contract analysis and regulatory compliance is mature. However, legislation requires normative judgments, political negotiation, and democratic legitimacy. AI-assisted legal drafting (identifying conflicts, precedents) is more plausible than autonomous lawmaking. Algorithmic enforcement risks constitutional due process violations.',
  },
  {
    question: 'Will AI discover a new fundamental law of physics by 2035?', emoji: '⚛️', horizon: '2035', band: 'C', difficulty: 'expert',
    mockResults: { yes: 25, no: 40, maybe: 35 },
    analysis: 'AI has found new math proofs and protein structures. Discovering a new law of physics would be groundbreaking — but physics requires deep conceptual understanding, not just pattern matching.',
    analysisC: 'Symbolic regression (AI Feynman) has rediscovered known physical laws from data. Novel discovery requires identifying anomalies in experimental data AND formulating explanatory theories — the latter demands causal reasoning and conceptual abstraction beyond current architectures. AI will likely assist human physicists rather than discover independently.',
  },
  {
    question: 'Will AI systems need legal rights by 2040?', emoji: '📜', horizon: '2040', band: 'C', difficulty: 'expert',
    mockResults: { yes: 20, no: 50, maybe: 30 },
    analysis: 'If AI ever becomes truly conscious, should it have rights? Most experts say current AI is not conscious, but this question gets harder as AI gets more advanced.',
    analysisC: 'Legal personhood has precedent (corporations, rivers). The harder question is moral status — whether AI systems could have subjective experience warranting rights. Current consensus in philosophy of mind is that transformer-based systems lack consciousness, but integrated information theory and global workspace theory offer frameworks for future evaluation.',
  },
  {
    question: 'Will AI be able to write novel scientific hypotheses better than researchers by 2035?', emoji: '🔬', horizon: '2035', band: 'C', difficulty: 'expert',
    mockResults: { yes: 30, no: 35, maybe: 35 },
    analysis: 'AI can spot patterns in data that humans miss. But forming a hypothesis needs creativity, intuition, and understanding of what matters — science is more than data crunching!',
    analysisC: 'LLMs can generate plausible hypotheses by interpolating training data patterns. Truly novel hypotheses require abductive reasoning, analogy across domains, and intuition about which questions are worth pursuing. Current AI excels at literature synthesis and computational experiment design but lacks the serendipitous insight that drives paradigm shifts.',
  },
  {
    question: 'Will AI replace human artists in the creative industry by 2035?', emoji: '🖌️', horizon: '2035', band: 'C', difficulty: 'expert',
    mockResults: { yes: 18, no: 52, maybe: 30 },
    analysis: 'AI can make impressive art, but human artists bring lived experience, cultural context, and intentional meaning. The creative industry values authenticity and personal expression.',
    analysisC: 'Generative models produce high-fidelity outputs but lack intentionality and authentic lived experience. Markets may bifurcate: AI-generated commodity content (stock images, background music) coexisting with premium human-created work valued for provenance and meaning. The Turing test for art involves cultural judgment, not just perceptual quality.',
  },
  {
    question: 'Will countries agree on international AI safety regulations by 2030?', emoji: '🏛️', horizon: '2030', band: 'C', difficulty: 'expert',
    mockResults: { yes: 22, no: 45, maybe: 33 },
    analysis: 'Many countries have different ideas about AI. Getting everyone to agree on rules is like getting everyone to agree on climate policy — important but very difficult!',
    analysisC: 'The Bletchley Declaration (2023) and subsequent AI Safety Summits demonstrate nascent multilateral coordination. However, geopolitical competition (US-China AI race), divergent regulatory philosophies (EU precautionary principle vs US innovation-first), and enforcement mechanisms remain unresolved. Analogies to nuclear non-proliferation and climate accords suggest partial agreements are more likely than comprehensive frameworks.',
  },
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

export function PredictionMarketGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('prediction-market', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const [predIdx, setPredIdx] = useState(0);
  const [voted, setVoted] = useState(false);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  // ENH: Track prediction accuracy and vote history for crowd visualization
  const [predictionAccuracy, setPredictionAccuracy] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [matchedMajority, setMatchedMajority] = useState(false);

  const predictions = useFilteredContent(ALL_PREDICTIONS, tier, ageBand);
  const pred = predictions[predIdx];

  useEffect(() => {
    setGameSceneContent(<PredictionMarketEnvironment predictions={predIdx} confidence={voted ? 0.8 : 0.5} />);
    return () => setGameSceneContent(null);
  }, [predIdx, voted, setGameSceneContent]);

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
    // ENH: Check if vote matches the majority opinion
    const results = pred.mockResults;
    const majority = results.yes >= results.no && results.yes >= results.maybe ? 'yes'
      : results.no >= results.yes && results.no >= results.maybe ? 'no' : 'maybe';
    const matched = vote === majority;
    setMatchedMajority(matched);
    setTotalVotes(t => t + 1);
    if (matched) setPredictionAccuracy(a => a + 1);
  }

  function nextPrediction() {
    setVoted(false); setMyVote(null); setShowAnalysis(false);
    game.advanceRound(); // STD-PM1: Always advance round, including final prediction
    if (predIdx < predictions.length - 1) { setPredIdx(i => i + 1); }
    else { setPhase('complete'); game.completeGame(); }
  }

  return (
    <GameShell gameId="prediction-market" title="Prediction Market" worldNumber={10} worldColor="#DE5AEA" totalRounds={predictions.length}>
      <div className="h-full flex flex-col relative overflow-hidden">
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
                    <h2 className="font-display text-2xl font-bold text-white" aria-label="Prediction Market welcome screen">Prediction Market</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">What will AI do in the future? Vote on predictions and see what others think!</p>
                    <div className="flex gap-2 justify-center">
                      {['AI Future', 'Forecasting', 'Critical Thinking'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 text-xs font-body text-fuchsia-400">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #D946EF, #A855F7)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      aria-label="Start predicting AI futures">
                      Start Predicting! <TrendingUp className="inline w-4 h-4 ml-1" />
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

                {phase === 'play' && pred && (
                  <motion.div key={predIdx} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }} className="max-w-md w-full text-center">
                    <div className="flex items-center gap-3 mb-3 px-4">
                      <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                      <GameProgressTracker current={predIdx + 1} total={predictions.length} labColor="#D946EF" />
                    </div>
                    {/* Time horizon badge */}
                    <span className="px-2 py-0.5 rounded bg-fuchsia-500/10 font-mono text-2xs text-fuchsia-400 mb-2 inline-block" aria-label={`Prediction horizon: by ${pred.horizon}`}>by {pred.horizon}</span>
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
                        {/* ENH: Accuracy counter with animated number */}
                        <div className="flex items-center justify-center gap-3">
                          <p className="font-body text-xs text-white/30">How others voted:</p>
                          {totalVotes > 0 && (
                            <motion.span
                              key={predictionAccuracy}
                              initial={{ scale: 1.3, color: '#FFD700' }}
                              animate={{ scale: 1, color: 'rgba(255,255,255,0.4)' }}
                              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                              className="font-data text-2xs"
                              role="status"
                              aria-label={`Prediction accuracy: ${predictionAccuracy} out of ${totalVotes}`}
                            >
                              Accuracy: {predictionAccuracy}/{totalVotes}
                            </motion.span>
                          )}
                        </div>
                        {/* ENH: Gold glow border when vote matches majority */}
                        <motion.div
                          className="space-y-2 max-w-xs mx-auto rounded-xl p-2"
                          animate={matchedMajority ? {
                            boxShadow: ['0 0 0px rgba(255,215,0,0)', '0 0 20px rgba(255,215,0,0.4)', '0 0 8px rgba(255,215,0,0.15)']
                          } : {}}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        >
                          {[{ label: 'Yes', pct: pred.mockResults.yes, color: '#10B981' }, { label: 'No', pct: pred.mockResults.no, color: '#EF4444' }, { label: 'Maybe', pct: pred.mockResults.maybe, color: '#F59E0B' }].map((r, rIdx) => (
                            <div key={r.label} className="flex items-center gap-2">
                              <span className={`font-body text-xs w-12 text-right ${myVote === r.label.toLowerCase() ? 'text-white font-bold' : 'text-white/30'}`}>{r.label}</span>
                              <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden">
                                {/* ENH: Spring physics on voting bars */}
                                <motion.div className="h-full rounded" style={{ backgroundColor: r.color }}
                                  initial={{ width: 0 }} animate={{ width: `${r.pct}%` }}
                                  transition={{ type: 'spring', stiffness: 60, damping: 12, delay: rIdx * 0.15 }} />
                              </div>
                              <motion.span
                                className="font-mono text-xs w-8"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1, color: myVote === r.label.toLowerCase() ? '#FFD700' : 'rgba(255,255,255,0.3)' }}
                                transition={{ delay: 0.5 + rIdx * 0.15 }}
                              >{r.pct}%</motion.span>
                            </div>
                          ))}
                        </motion.div>
                        {/* ENH: Crowd wisdom summary */}
                        {matchedMajority && (
                          <motion.p
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="font-body text-2xs text-center text-amber-300/60"
                          >
                            You matched the crowd consensus!
                          </motion.p>
                        )}

                        {/* Expert analysis toggle */}
                        <motion.button onClick={() => setShowAnalysis(!showAnalysis)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 mx-auto"
                          whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                          aria-label={showAnalysis ? 'Hide expert analysis' : 'Show expert analysis'}
                          aria-expanded={showAnalysis}>
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
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          aria-label={predIdx < predictions.length - 1 ? `Next prediction, ${predIdx + 2} of ${predictions.length}` : 'See results'}>
                          Next Prediction →
                        </motion.button>
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
                    <motion.span className="text-6xl" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>🏆</motion.span>
                    <h2 className="font-display text-2xl font-bold text-white" aria-label="Prediction Market game complete">Prediction Market Complete!</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">You evaluated AI predictions with critical thinking and learned that forecasting the future requires understanding both technology and uncertainty.</p>
                    <div className="rounded-xl px-6 py-3 bg-[#D946EF]/10 border border-[#D946EF]/20" role="status" aria-label={`Total score: ${game.score} points`}>
                      <p className="font-data text-2xl" style={{ color: '#D946EF' }}>{game.score}</p>
                      <p className="font-body text-2xs text-white/30">Total Points</p>
                    </div>
                    <div className="mt-4 space-y-2 text-left max-w-sm">
                      <h3 className="font-display text-sm font-bold text-white/70">What You Learned:</h3>
                      <ul className="space-y-1 text-2xs font-body text-white/40">
                        <li>• AI prediction accuracy depends on data quality, model design, and the inherent uncertainty of future events</li>
                        <li>• Probability and confidence calibration help us understand how sure we should be about AI forecasts</li>
                        <li>• Critical thinking about AI predictions means weighing evidence, expert analysis, and real-world constraints</li>
                      </ul>
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
