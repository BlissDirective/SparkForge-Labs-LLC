// ════════════════════════════════════════════════════
// REAL OR FAKE V2 — Lab 6 (AI & Ethics)
// Determine if content is real or AI-generated.
// Enhanced: chrome bezel, welcome phase, 12 rounds,
// content type variety, detection tips, age-band depth.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Fingerprint, CheckCircle2, XCircle, BookOpen } from 'lucide-react';

type Phase = 'welcome' | 'tips' | 'play';

const DETECTION_TIPS = [
  { title: 'Vague vs Specific', emoji: '🔎', tip: 'Fake content is often vague and uses general praise. Real content includes specific details, measurements, and nuanced opinions.' },
  { title: 'Too Perfect?', emoji: '✨', tip: 'If something sounds too good or too dramatic to be true, it might be AI-generated. Real content has imperfections and balance.' },
  { title: 'Check the Source', emoji: '📰', tip: 'Real news comes from known sources. AI-generated headlines often use clickbait language and make extreme claims.' },
  { title: 'Emotional Manipulation', emoji: '😱', tip: 'Fake social posts use excessive excitement, ALL CAPS, and lots of emoji to trigger emotional reactions instead of critical thinking.' },
];

interface RFRound {
  type: 'text' | 'headline' | 'review' | 'social';
  typeLabel: string;
  content: string;
  isFake: boolean;
  clue: string;
  clueC: string;
  band: 'A' | 'B' | 'C';
}

const ALL_ROUNDS: RFRound[] = [
  { type: 'text', typeLabel: '📄 Text Snippet', content: 'Honey never spoils. Archaeologists have found 3,000-year-old honey in Egyptian tombs that was still perfectly edible.', isFake: false, clue: 'This is true! Honey\'s low moisture and acidity preserve it for thousands of years.', clueC: 'Honey\'s hygroscopic nature and low water activity (aw ~0.6) inhibit microbial growth. The gluconic acid and hydrogen peroxide from glucose oxidase create an inhospitable environment for bacteria — this is empirically verified by archaeological finds in the Valley of the Kings.', band: 'A' },
  { type: 'headline', typeLabel: '📰 News Headline', content: 'Scientists Discover New Species of Glow-in-the-Dark Shark Living 3,000 Feet Below the Ocean Surface', isFake: false, clue: 'Real! Bioluminescent sharks have been found in deep ocean waters. New species are discovered regularly.', clueC: 'Bioluminescent sharks (e.g., Dalatias licha, kitefin shark) were confirmed by marine biologists in 2021. Deep-sea species discovery is ongoing — an estimated 91% of ocean species remain unclassified.', band: 'A' },
  { type: 'review', typeLabel: '⭐ Product Review', content: 'This blender is absolutely life-changing! It transformed my kitchen experience completely. Every smoothie is perfection. My whole family agrees this is the best purchase we\'ve ever made. 10/10 would recommend to everyone!', isFake: true, clue: 'Fake! Too perfect and vague. Real reviews mention specific features and some downsides.', clueC: 'This exhibits classic AI-generated review patterns: hyperbolic superlatives, no specific product details, absence of comparative context, and universal positive sentiment — a statistical anomaly in authentic consumer reviews.', band: 'A' },
  { type: 'text', typeLabel: '📄 Text Snippet', content: 'Octopuses have three hearts. Two pump blood to the gills, while one pumps it to the rest of the body. When an octopus swims, the heart that delivers blood to the body actually stops beating.', isFake: false, clue: 'Real! Octopuses really do have three hearts — and the main one stops when they swim!', clueC: 'Cephalopod cardiovascular anatomy includes two branchial hearts for gill perfusion and one systemic heart. The systemic heart ceases during jet propulsion, which is why octopuses prefer crawling — swimming is metabolically exhausting.', band: 'A' },
  { type: 'social', typeLabel: '📱 Social Post', content: 'OMG just saw a purple rainbow over downtown!!! The colors were in reverse order and it lasted for 3 hours straight! Nature is AMAZING 🌈💜', isFake: true, clue: 'Fake! Rainbows can\'t be purple or last 3 hours. The exaggerated excitement is a clue too.', clueC: 'Rainbows follow Snell\'s law of refraction with a fixed spectral order (red->violet). A "purple rainbow" would require impossible atmospheric optics. Duration is limited by solar angle and precipitation — 3 hours violates geometric constraints.', band: 'A' },
  { type: 'headline', typeLabel: '📰 News Headline', content: 'Japan\'s Bullet Trains Have an Average Delay of Only 17 Seconds Per Year, Including Natural Disasters', isFake: false, clue: 'True! Japan\'s Shinkansen is incredibly punctual — their average delay really is about 17 seconds!', clueC: 'JR Central\'s Tokaido Shinkansen reports an average delay of ~0.9 minutes annually (including typhoons and earthquakes). The 17-second figure reflects their operational precision — a testament to systems engineering and predictive maintenance.', band: 'B' },
  { type: 'review', typeLabel: '⭐ Product Review', content: 'The battery on this laptop lasts about 6 hours with normal use, which is decent but not great. The keyboard feels good but the trackpad is a bit small. Good for the price if you don\'t need top performance.', isFake: false, clue: 'Real! This review has specific details, mentions pros AND cons, and feels balanced.', clueC: 'Authentic reviews exhibit hedging language, specific quantitative claims, comparative framing, and balanced sentiment. The specificity-to-generality ratio here matches human review patterns rather than generated text.', band: 'A' },
  { type: 'text', typeLabel: '📄 Text Snippet', content: 'The Great Wall of China is the only man-made structure visible from space with the naked eye.', isFake: true, clue: 'Fake! This is a common myth. Astronauts have confirmed you can\'t see the Great Wall from space without magnification.', clueC: 'This is a persistent misconception debunked by multiple astronauts including Yang Liwei (2003). At ~6m width, the Great Wall is below the angular resolution threshold of human vision from LEO (~400km altitude). Highways and airports are more visible.', band: 'A' },
  { type: 'social', typeLabel: '📱 Social Post', content: 'New study proves eating chocolate every day makes you live 20 years longer! Scientists say dark chocolate is basically medicine now! 🍫🎉', isFake: true, clue: 'Fake! No food adds 20 years to your life. Real science is more cautious with claims like this.', clueC: 'The "20 years" claim violates epidemiological plausibility. Legitimate studies show modest cardiovascular benefits from flavonoids in dark chocolate, but effect sizes are measured in months, not decades. The absolute certainty language ("proves") is a hallmark of misinformation.', band: 'B' },
  { type: 'headline', typeLabel: '📰 News Headline', content: 'Finland Ranked World\'s Happiest Country for the Sixth Consecutive Year in UN Report', isFake: false, clue: 'Real! Finland has topped the UN World Happiness Report multiple years in a row.', clueC: 'Finland has led the World Happiness Report (based on Gallup World Poll data) since 2018. The ranking uses GDP per capita, social support, life expectancy, freedom, generosity, and corruption perception as variables.', band: 'B' },
  { type: 'text', typeLabel: '📄 Text Snippet', content: 'Recent advances in quantum computing have enabled scientists to teleport physical objects up to 10 grams across distances of 500 meters, revolutionizing transportation technology.', isFake: true, clue: 'Fake! Quantum teleportation only works with quantum states (information), not physical objects. This exaggerates real science.', clueC: 'Quantum teleportation transfers quantum states via entanglement and classical communication channels — not physical matter. The no-cloning theorem and energy requirements make matter teleportation physically impossible. Current experiments teleport photon states over ~1,400km (Micius satellite).', band: 'C' },
  { type: 'review', typeLabel: '⭐ Product Review', content: 'Decent headphones for the price. Sound quality is clear for music and podcasts. Bass could be stronger. Comfortable for about 2 hours before ears get warm. Bluetooth connection drops occasionally when I walk to another room.', isFake: false, clue: 'Real! Specific details about comfort duration, bass quality, and Bluetooth range — that\'s authentic experience.', clueC: 'This review demonstrates experiential specificity: time-bounded comfort assessment, frequency-specific audio critique, and environmental context for connectivity issues. These details require actual product interaction — difficult for generative models to fabricate coherently.', band: 'B' },
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

export function RealOrFakeGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [roundIdx, setRoundIdx] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; clue: string } | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [tipIdx, setTipIdx] = useState(0);

  const rounds = useMemo(
    () => ALL_ROUNDS.filter(r => BAND_ORDER[r.band] <= BAND_ORDER[ageBand]),
    [ageBand]
  );
  const round = rounds[roundIdx];

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: ((i * 37 + 13) % 100),
    y: ((i * 53 + 7) % 100),
    size: (i % 3) + 1,
    delay: (i * 0.33) % 4,
    dur: (i % 6) + 4,
  })), []);

  function handleGuess(guessedFake: boolean) {
    if (feedback) return;
    const correct = guessedFake === round.isFake;
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    if (correct) game.updateScore(12);
    setFeedback({ correct, clue: ageBand === 'C' ? round.clueC : round.clue });
    setTimeout(() => {
      setFeedback(null);
      if (roundIdx < rounds.length - 1) { setRoundIdx(i => i + 1); game.advanceRound(); }
      else game.completeGame();
    }, 3500);
  }

  return (
    <GameShell gameId="real-or-fake" title="Real or Fake?" worldNumber={6} worldColor="#FF6644" totalRounds={rounds.length}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(255,102,68,${0.15 + p.size * 0.06}), transparent)` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,102,68,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4 items-center justify-center">
              <AnimatePresence mode="wait">
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }} className="text-center space-y-4">
                    <span className="text-5xl">🔍</span>
                    <h2 className="font-display text-2xl font-bold text-white">Real or Fake?</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">Can you spot AI-generated content? Read each piece carefully and decide if it&apos;s real or fake!</p>
                    <div className="flex gap-2 justify-center">
                      {['Deepfakes', 'Misinformation', 'Critical Thinking'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs font-body text-orange-400">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('tips')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #FF6644, #DD4422)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Learn Detection Tips! <BookOpen className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {phase === 'tips' && (
                  <motion.div key="tips" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }} className="text-center space-y-4 max-w-sm">
                    <Fingerprint className="w-6 h-6 text-orange-400 mx-auto" />
                    <h3 className="font-display text-lg font-bold text-white">Detection Strategies</h3>
                    <p className="font-body text-xs text-white/40">{tipIdx + 1} of {DETECTION_TIPS.length}</p>
                    <AnimatePresence mode="wait">
                      <motion.div key={tipIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }} className="rounded-xl p-4 border border-orange-500/20 bg-orange-500/5">
                        <span className="text-3xl">{DETECTION_TIPS[tipIdx].emoji}</span>
                        <h4 className="font-display text-sm font-bold text-orange-300 mt-2">{DETECTION_TIPS[tipIdx].title}</h4>
                        <p className="font-body text-xs text-white/50 mt-1">{DETECTION_TIPS[tipIdx].tip}</p>
                      </motion.div>
                    </AnimatePresence>
                    <motion.button
                      onClick={() => { if (tipIdx < DETECTION_TIPS.length - 1) setTipIdx(i => i + 1); else setPhase('play'); }}
                      className="w-full py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #FF6644, #DD4422)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      {tipIdx < DETECTION_TIPS.length - 1 ? 'Next Tip →' : 'Start Detecting! 🔍'}
                    </motion.button>
                    <button onClick={() => setPhase('play')} className="font-body text-xs text-white/20 hover:text-white/40">
                      Skip tips →
                    </button>
                  </motion.div>
                )}

                {phase === 'play' && round && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md space-y-2">
                    {/* Round info */}
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <span className="font-body text-xs text-white/30">{round.typeLabel}</span>
                      <span className="font-data text-[10px] text-white/15">{score.correct}/{score.total}</span>
                    </div>

                    {/* Content card with flip animation */}
                    <motion.div key={roundIdx} initial={{ opacity: 0, rotateY: 90 }} animate={{ opacity: 1, rotateY: 0 }}
                      className="rounded-2xl p-5 border border-white/10 bg-white/[0.02] mb-5">
                      <p className="font-body text-sm text-white leading-relaxed italic">{'"'}{round.content}{'"'}</p>
                    </motion.div>

                    {/* Real / Fake buttons */}
                    <div className="flex gap-3 mb-4 justify-center">
                      <motion.button onClick={() => handleGuess(false)} disabled={!!feedback}
                        className="px-8 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 font-display text-sm font-bold text-emerald-400 flex items-center gap-2"
                        whileTap={{ scale: 0.95 }} aria-label="This is real">
                        <CheckCircle2 className="w-4 h-4" /> REAL
                      </motion.button>
                      <motion.button onClick={() => handleGuess(true)} disabled={!!feedback}
                        className="px-8 py-3 rounded-xl bg-red-500/15 border border-orange-500/30 font-display text-sm font-bold text-orange-400 flex items-center gap-2"
                        whileTap={{ scale: 0.95 }} aria-label="This is fake">
                        <XCircle className="w-4 h-4" /> FAKE
                      </motion.button>
                    </div>

                    {/* Feedback */}
                    <AnimatePresence>
                      {feedback && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className={`rounded-xl p-3 max-w-sm mx-auto ${feedback.correct ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-orange-500/10 border border-orange-500/20'}`}>
                          <p className="font-display text-sm font-bold" style={{ color: feedback.correct ? '#10B981' : '#EF4444' }}>
                            {feedback.correct ? '✅ You spotted it!' : '❌ Tricky one!'}
                          </p>
                          <p className="font-body text-[10px] text-white/40 mt-1">{feedback.clue}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
