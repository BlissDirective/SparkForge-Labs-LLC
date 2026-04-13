// ════════════════════════════════════════════════════
// REAL OR FAKE V2 — Lab 6 (AI & Ethics)
// Determine if content is real or AI-generated.
// Enhanced: chrome bezel, welcome phase, 12 rounds,
// content type variety, detection tips, age-band depth.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useGameContent } from '@/hooks/useContent';
import { useSceneStore } from '@/stores/sceneStore';
import { Fingerprint, CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import { useSafeTimeout } from '@/hooks/useSafeTimeout';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { useFilteredContent } from '@/hooks/useFilteredContent';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';

// 3D Environment (no SSR)
const RealOrFakeEnvironment = dynamic(
  () => import('@/components/3d/environments/RealOrFakeEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'tips' | 'play' | 'complete';

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
  { type: 'headline', typeLabel: '📰 News Headline', content: 'New AI System Can Predict Earthquakes 48 Hours in Advance with 97% Accuracy', isFake: true, clue: 'Fake! Earthquake prediction is still nearly impossible. No AI can predict them with that accuracy.', clueC: 'Seismic prediction remains an unsolved geophysics problem. Current ML models identify foreshock patterns but cannot reliably forecast timing, location, and magnitude simultaneously. Claims of >90% accuracy are unsubstantiated.', band: 'B' },
  { type: 'text', typeLabel: '📄 Text Snippet', content: 'A group of flamingos is called a "flamboyance." These pink birds get their color from the shrimp and algae they eat.', isFake: false, clue: 'Real! The collective noun for flamingos really is a "flamboyance," and their diet does make them pink.', clueC: 'Carotenoid pigments (astaxanthin) from crustaceans and algae are metabolized and deposited in feathers. Zoo flamingos fed non-carotenoid diets turn white. The etymology of "flamboyance" relates to the French "flambe" (flame).', band: 'A' },
  { type: 'social', typeLabel: '📱 Social Post', content: 'My friend\'s cousin works at NASA and says they found alien signals coming from a planet 4 light years away but they\'re keeping it SECRET! The government doesn\'t want us to know! 👽🛸', isFake: true, clue: 'Fake! "Friend\'s cousin" sources and conspiracy claims are classic misinformation patterns.', clueC: 'Multiple red flags: anonymous sourcing chain ("friend\'s cousin"), conspiracy framing, extraordinary claims without evidence, and emotional manipulation through secrecy narrative. SETI protocols require independent verification and public disclosure.', band: 'A' },
  { type: 'review', typeLabel: '⭐ Product Review', content: 'This is the most incredible, stunning, breathtaking, magnificent, extraordinary product I have ever encountered in my entire existence. It has fundamentally altered my perception of what a kitchen appliance can achieve.', isFake: true, clue: 'Fake! Way too many fancy adjectives and no specific details. Real people don\'t write like this.', clueC: 'Lexical density of superlatives (5 consecutive adjectives) deviates significantly from natural language distributions. Absence of concrete product details and hyperbolic claims indicate generative AI output with high temperature sampling.', band: 'A' },
  { type: 'headline', typeLabel: '📰 News Headline', content: 'Trees in Forests Communicate Through Underground Fungal Networks, Sharing Nutrients with Struggling Neighbors', isFake: false, clue: 'Real! This is called the "Wood Wide Web" — mycorrhizal networks really do connect trees underground.', clueC: 'Mycorrhizal networks facilitate resource transfer between trees via ectomycorrhizal fungi. Suzanne Simard\'s research demonstrated carbon, water, and nutrient sharing through these networks, dubbed the "Wood Wide Web" in Nature (1997).', band: 'B' },
  { type: 'text', typeLabel: '📄 Text Snippet', content: 'The average human body contains enough iron to make a 3-inch nail, enough carbon to make 900 pencils, and enough phosphorus to make 2,200 match heads.', isFake: false, clue: 'Real! The human body contains many elements in surprisingly useful quantities.', clueC: 'Elemental composition of the human body: ~3-4g iron, ~16kg carbon, ~780g phosphorus. These stoichiometric calculations are consistent with established biochemistry references.', band: 'B' },
  { type: 'social', typeLabel: '📱 Social Post', content: 'Just learned that if you microwave a grape cut in half, it creates plasma. Tried it and it actually works! Science is wild. (Don\'t try this at home though, it can damage your microwave)', isFake: false, clue: 'Real! This is actually true — grapes can create plasma in microwaves due to their size and water content.', clueC: 'Grapes are approximately the right size to act as a microwave antenna. The ions in grape juice form a conductive bridge that concentrates electromagnetic energy, creating a plasma discharge. Published in PNAS (2019).', band: 'B' },
  { type: 'review', typeLabel: '⭐ Product Review', content: 'Bought this for my son\'s birthday. Assembly took about 45 minutes — instructions were okay but step 7 was confusing. He loves it but the stickers started peeling after a week. For $35 it\'s fine, just don\'t expect premium quality.', isFake: false, clue: 'Real! Very specific about assembly time, a confusing step, price, and a real flaw. This is authentic.', clueC: 'High experiential specificity: exact assembly duration, specific problematic step, post-use degradation timeline, price anchoring, and tempered expectations. This information density and temporal specificity strongly indicate genuine user experience.', band: 'B' },
  { type: 'headline', typeLabel: '📰 News Headline', content: 'Researchers Develop AI That Can Read Minds with 100% Accuracy Using Only a Standard Smartphone Camera', isFake: true, clue: 'Fake! No AI can read minds, and definitely not through a phone camera. Brain imaging requires specialized equipment.', clueC: 'fMRI-based neural decoding achieves ~50-70% accuracy for simple image categories with expensive equipment. Smartphone cameras lack the spatial resolution for neural signal detection. The "100% accuracy" claim violates the noisy-channel theorem for biological signals.', band: 'C' },
  { type: 'text', typeLabel: '📄 Text Snippet', content: 'Tardigrades (water bears) can survive in the vacuum of space, withstand radiation 1,000 times the lethal dose for humans, and can be frozen to near absolute zero and revived.', isFake: false, clue: 'Real! Tardigrades are incredibly tough — they survived experiments on the outside of the International Space Station!', clueC: 'Tardigrades enter cryptobiosis, replacing water with trehalose glass. TARDIS experiments on the ISS confirmed vacuum and UV survival. Their Dsup protein protects DNA from radiation damage — a mechanism being studied for human applications.', band: 'C' },
  { type: 'social', typeLabel: '📱 Social Post', content: 'PSA: I just read that staring at your phone before bed is actually GOOD for you now. New study from Harvard says blue light helps you fall asleep faster. Sweet dreams! 💙📱', isFake: true, clue: 'Fake! Blue light from screens actually disrupts sleep by suppressing melatonin. This reverses real science!', clueC: 'This directly contradicts established chronobiology: blue light (~460nm) suppresses melatonin synthesis via melanopsin-expressing retinal ganglion cells. Harvard Medical School research specifically warns against evening blue light exposure. The post weaponizes institutional authority for misinformation.', band: 'C' },
  { type: 'headline', typeLabel: '📰 News Headline', content: 'Octopus DNA Is So Unique That Scientists Joked It Could Be Alien — Turns Out Their Genome Really Is Extraordinary', isFake: false, clue: 'Real! Octopus genomes have features found in no other animals, including massive RNA editing capabilities.', clueC: 'The 2015 octopus genome sequencing (Nature) revealed 33,000 protein-coding genes, extensive transposon expansion, and unprecedented RNA editing in neural tissue. Their "alien DNA" nickname reflects genuine genomic uniqueness among metazoans.', band: 'C' },
];

export function RealOrFakeGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('real-or-fake', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [roundIdx, setRoundIdx] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; clue: string } | null>(null);
  // STD-RF5: Removed local score state — use game.score from gameStore instead
  const [tipIdx, setTipIdx] = useState(0);
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const rounds = useFilteredContent(ALL_ROUNDS, tier, ageBand);
  const { safeTimeout } = useSafeTimeout();

  const round = rounds[roundIdx];

  // STD-RF2: Added cleanup return for scene content
  useEffect(() => {
    setGameSceneContent(<RealOrFakeEnvironment verified={Math.floor(game.score / 10)} isChecking={!!feedback} />);
    return () => setGameSceneContent(null);
  }, [game.score, feedback, setGameSceneContent]);

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
    if (correct) game.updateScore(10);
    setFeedback({ correct, clue: ageBand === 'C' ? round.clueC : round.clue });
    safeTimeout(() => {
      setFeedback(null);
      if (roundIdx < rounds.length - 1) { setRoundIdx(i => i + 1); game.advanceRound(); }
      else { setPhase('complete'); game.completeGame(); }
    }, 3500);
  }

  return (
    <GameShell gameId="real-or-fake" title="Real or Fake?" worldNumber={6} worldColor="#FF7050" totalRounds={rounds.length}>
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
                    <h2 className="font-display text-2xl font-bold text-white" aria-label="Real or Fake welcome screen">Real or Fake?</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">Can you spot AI-generated content? Read each piece carefully and decide if it&apos;s real or fake!</p>
                    <div className="flex gap-2 justify-center">
                      {['Deepfakes', 'Misinformation', 'Critical Thinking'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs font-body text-orange-400">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('tips')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #FF6644, #DD4422)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      aria-label="Learn detection tips before playing">
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
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      aria-label={tipIdx < DETECTION_TIPS.length - 1 ? `Next tip, ${tipIdx + 2} of ${DETECTION_TIPS.length}` : 'Start detecting'}>
                      {tipIdx < DETECTION_TIPS.length - 1 ? 'Next Tip →' : 'Start Detecting! 🔍'}
                    </motion.button>
                    <button onClick={() => setPhase('play')} className="font-body text-xs text-white/20 hover:text-white/40"
                      aria-label="Skip tips and start playing">
                      Skip tips →
                    </button>
                  </motion.div>
                )}

                {phase === 'play' && round && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md space-y-2">
                    <div className="flex items-center gap-3 mb-3 px-4">
                      <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                      <GameProgressTracker current={roundIdx + 1} total={rounds.length} labColor="#FF6644" />
                    </div>
                    {/* Round info */}
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <span className="font-body text-xs text-white/30">{round.typeLabel}</span>
                      <span className="font-data text-2xs text-white/15" role="status" aria-label={`Round ${roundIdx + 1} of ${rounds.length}`}>{roundIdx + 1}/{rounds.length}</span>
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
                          <p className="font-body text-2xs text-white/40 mt-1">{feedback.clue}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                    <h2 className="font-display text-2xl font-bold text-white" aria-label="Real or Fake game complete">Real or Fake Complete!</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">You sharpened your media literacy skills and can now spot deepfakes and AI-generated content with confidence.</p>
                    <div className="rounded-xl px-6 py-3 bg-[#FF6644]/10 border border-[#FF6644]/20" role="status" aria-label={`Total score: ${game.score} points`}>
                      <p className="font-data text-2xl" style={{ color: '#FF6644' }}>{game.score}</p>
                      <p className="font-body text-2xs text-white/30">Total Points</p>
                    </div>
                    <div className="mt-4 space-y-2 text-left max-w-sm">
                      <h3 className="font-display text-sm font-bold text-white/70">What You Learned:</h3>
                      <ul className="space-y-1 text-2xs font-body text-white/40">
                        <li>• AI-generated content often uses vague language, extreme claims, and excessive emotional triggers</li>
                        <li>• Real content includes specific details, balanced perspectives, and verifiable facts</li>
                        <li>• Media literacy and critical thinking are essential defenses against deepfakes and misinformation</li>
                      </ul>
                    </div>
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
