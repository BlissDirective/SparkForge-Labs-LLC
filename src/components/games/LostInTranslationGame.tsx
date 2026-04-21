// ════════════════════════════════════════════════════
// LOST IN TRANSLATION V2 — Lab 8 (NLP)
// Pre-computed translation telephone game.
// Enhanced: chrome bezel, welcome phase, 7 rounds,
// language flags, "why it changed" explanations, age-band.
// ENH: Step reveal + flag bounce + degradation meter + comparison highlights
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useGameContent } from '@/hooks/useContent';
import { Languages, ArrowDown } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSceneStore } from '@/stores/sceneStore';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { useFilteredContent } from '@/hooks/useFilteredContent';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';

// ENH: Compute simple degradation score (how different original vs final are)
function computeDegradation(original: string, final: string): number {
  const origWords = original.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  const finalWords = final.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  const origSet = new Set(origWords);
  const shared = finalWords.filter(w => origSet.has(w)).length;
  const total = Math.max(origWords.length, finalWords.length);
  return total > 0 ? Math.round((1 - shared / total) * 100) : 0;
}

// 3D Environment (no SSR)
const LostInTranslationEnvironment = dynamic(
  () => import('@/components/3d/environments/LostInTranslationEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'learn' | 'play' | 'complete';

const LEARN_CARDS = [
  { title: 'Machine Translation', emoji: '🌐', desc: 'AI translators convert text between languages. They\'re incredibly useful, but they\'re not perfect — especially with tricky phrases!' },
  { title: 'Why Idioms Are Hard', emoji: '🤔', desc: 'Idioms like "it\'s raining cats and dogs" don\'t translate well word-by-word. AI often struggles with figurative language and cultural expressions.' },
  { title: 'Lost in the Chain', emoji: '🔗', desc: 'In this game, you\'ll see what happens when text gets translated through multiple languages. Watch how meaning shifts and changes along the way!' },
];

interface Round {
  original: string;
  steps: string[];
  final: string;
  why: string;
  whyC: string;
  band: 'A' | 'B' | 'C';
}

const ALL_ROUNDS: Round[] = [
  {
    original: 'Break a leg!',
    steps: ['\u{1F1EB}\u{1F1F7} Casse une jambe!', '\u{1F1EF}\u{1F1F5} \u8DB3\u3092\u6298\u3063\u3066!', '\u{1F1E9}\u{1F1EA} Brich dir ein Bein!'],
    final: 'Break yourself a bone!',
    why: 'Idioms don\'t translate well! "Break a leg" means "good luck" in English only.',
    whyC: 'Idiomatic expressions are non-compositional \u2014 their meaning can\'t be derived from individual words. MT models lack pragmatic context.',
    band: 'A',
  },
  {
    original: 'It\'s raining cats and dogs',
    steps: ['\u{1F1F0}\u{1F1F7} \uACE0\uC591\uC774\uC640 \uAC1C\uAC00 \uBE44\uCC98\uB7FC', '\u{1F1EB}\u{1F1F7} Chats et chiens tombent du ciel', '\u{1F1EA}\u{1F1F8} Caen gatos y perros del cielo'],
    final: 'Cats and dogs are falling from the sky!',
    why: 'Another idiom! AI translated the literal words instead of the meaning.',
    whyC: 'Statistical MT models often fail on metaphorical language because they optimize for word-level or phrase-level translation without discourse awareness.',
    band: 'A',
  },
  {
    original: 'Piece of cake!',
    steps: ['\u{1F1E8}\u{1F1F3} \u4E00\u5757\u86CB\u7CD5\uFF01', '\u{1F1EA}\u{1F1F8} \u00A1Un pedazo de pastel!', '\u{1F1F7}\u{1F1FA} \u041A\u0443\u0441\u043E\u043A \u0442\u043E\u0440\u0442\u0430!'],
    final: 'A slice of cake!',
    why: 'The "easy" meaning was lost \u2014 AI just translated the food words!',
    whyC: 'Polysemy resolution failure \u2014 the model selected the food sense of "piece of cake" rather than the idiomatic "easy" sense.',
    band: 'A',
  },
  {
    original: 'I have butterflies in my stomach',
    steps: ['\u{1F1E9}\u{1F1EA} Schmetterlinge im Bauch', '\u{1F1EF}\u{1F1F5} \u304A\u8179\u306B\u8776\u304C\u3044\u308B', '\u{1F1EB}\u{1F1F7} Des papillons dans le ventre'],
    final: 'There are butterflies living in my belly!',
    why: 'The "nervous" feeling became literal butterflies! Emotions are hard to translate.',
    whyC: 'Somatic metaphors for emotions vary cross-linguistically. German preserves this idiom, but re-translation through Japanese literalizes it.',
    band: 'B',
  },
  {
    original: 'The early bird catches the worm',
    steps: ['\u{1F1E8}\u{1F1F3} \u65E9\u8D77\u7684\u9E1F\u513F\u6709\u866B\u5403', '\u{1F1EE}\u{1F1F9} L\'uccello mattiniero prende il verme', '\u{1F1E9}\u{1F1EA} Der fr\u00FChe Vogel f\u00E4ngt den Wurm'],
    final: 'The morning bird takes the worm!',
    why: 'The proverb\'s wisdom about working hard was lost \u2014 only the bird and worm survived!',
    whyC: 'Proverbial expressions encode cultural knowledge that isn\'t preserved by compositional translation. The moral is lost in favor of literal content.',
    band: 'B',
  },
  {
    original: 'Let the cat out of the bag',
    steps: ['\u{1F1EA}\u{1F1F8} Dejar salir al gato de la bolsa', '\u{1F1EF}\u{1F1F5} \u888B\u304B\u3089\u732B\u3092\u51FA\u3059', '\u{1F1EB}\u{1F1F7} Laisser sortir le chat du sac'],
    final: 'Release the cat from the bag!',
    why: 'The secret-revealing meaning became a literal cat rescue! Context matters.',
    whyC: 'Without pragmatic context, NMT models cannot disambiguate between literal and figurative interpretations of the same surface form.',
    band: 'C',
  },
  {
    original: 'Time flies like an arrow',
    steps: ['\u{1F1E9}\u{1F1EA} Die Zeit fliegt wie ein Pfeil', '\u{1F1E8}\u{1F1F3} \u65F6\u95F4\u50CF\u7BAD\u4E00\u6837\u98DE', '\u{1F1EA}\u{1F1F8} El tiempo vuela como una flecha'],
    final: 'Time flies like an arrow!',
    why: 'This one stayed close! Simple metaphors with clear structure translate better.',
    whyC: 'Transparent metaphors with direct structural analogs across languages preserve meaning through translation chains more reliably.',
    band: 'C',
  },
  {
    original: 'Break a leg',
    steps: ['🇫🇷 Casse-toi une jambe', '🇯🇵 足を折れ', '🇪🇸 Rompe una pierna'],
    final: 'Break a leg for yourself!',
    why: 'The good luck wish became a literal command to break a bone!',
    whyC: 'Performative speech acts that convey opposite literal meaning are systematically mishandled by NMT.',
    band: 'A',
  },
  {
    original: 'Piece of cake',
    steps: ['🇩🇪 Stück Kuchen', '🇨🇳 一块蛋糕', '🇮🇹 Un pezzo di torta'],
    final: 'A piece of cake!',
    why: 'This one survived! Simple metaphors sometimes make it through because the image is universal.',
    whyC: 'Transparent metaphors with cross-linguistic equivalents preserve well through translation chains.',
    band: 'A',
  },
  {
    original: 'Hit the nail on the head',
    steps: ['🇪🇸 Dar en el clavo', '🇫🇷 Mettre le doigt dessus', '🇩🇪 Den Nagel auf den Kopf treffen'],
    final: 'Hit the nail on the head!',
    why: 'Many languages have their own version of this idiom, so it survived the chain!',
    whyC: 'Cross-linguistic idiom equivalents enable semantic preservation even when surface forms differ entirely.',
    band: 'B',
  },
  {
    original: 'Burning the midnight oil',
    steps: ['🇫🇷 Brûler l\'huile de minuit', '🇯🇵 真夜中の油を燃やす', '🇪🇸 Quemar el aceite de medianoche'],
    final: 'Burn the oil at midnight!',
    why: 'The idea of working late survived, but it sounds like an arson instruction now!',
    whyC: 'Temporal metaphors lose their figurative reading when translated literally across multiple language families.',
    band: 'B',
  },
  {
    original: 'When pigs fly',
    steps: ['🇩🇪 Wenn Schweine fliegen', '🇨🇳 当猪飞的时候', '🇫🇷 Quand les cochons voleront'],
    final: 'When the pigs will fly!',
    why: 'The impossibility idiom kept its meaning because the image is so vivid and absurd!',
    whyC: 'Impossibility idioms using surreal imagery tend to preserve meaning because the literal absurdity signals figurative intent.',
    band: 'A',
  },
  {
    original: 'Spill the beans',
    steps: ['🇮🇹 Versare i fagioli', '🇯🇵 豆をこぼす', '🇪🇸 Derramar los frijoles'],
    final: 'Spill the beans everywhere!',
    why: 'Revealing a secret became a cooking disaster! The secret-telling meaning was completely lost.',
    whyC: 'Opaque idioms where meaning is unrelated to component words are consistently lost in multi-hop translation.',
    band: 'B',
  },
  {
    original: 'Cost an arm and a leg',
    steps: ['🇫🇷 Coûter les yeux de la tête', '🇩🇪 Die Augen des Kopfes kosten', '🇨🇳 花费头的眼睛'],
    final: 'Cost the eyes of the head!',
    why: 'French uses "cost the eyes from the head" for expensive, and that image stuck through the chain!',
    whyC: 'When target language has a parallel idiom with different body parts, the translation chain produces chimeric expressions mixing metaphor domains.',
    band: 'C',
  },
];

export function LostInTranslationGame() {
  const prefersReducedMotion = useReducedMotion();
  const game = useGameStore();
  const activeChild = useActiveChild();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('lost-in-translation', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges

  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const rounds = useFilteredContent(ALL_ROUNDS, tier, ageBand);
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState(-1);
  const animatedScore = useAnimatedCounter(game.score);

  const round = rounds[idx];
  const allRevealed = step >= (round?.steps.length ?? 0);

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: (i * 37 + 13) % 100, y: (i * 53 + 7) % 100, size: (i % 3) + 1,
    delay: (i * 0.7) % 4, dur: (i % 6) + 4,
  })), []);

  useEffect(() => {
    setGameSceneContent(<LostInTranslationEnvironment languagePair={round?.original ?? ''} translationsCompleted={idx} />);
    return () => setGameSceneContent(null);
  }, [round?.original, idx, setGameSceneContent]);

  function reveal() {
    if (allRevealed) {
      game.updateScore(10);
      if (idx < rounds.length - 1) { setIdx(i => i + 1); setStep(-1); game.advanceRound(); }
      else { setPhase('complete'); game.completeGame(); }
    } else { setStep(s => s + 1); }
  }

  return (
    <GameShell gameId="lost-in-translation" title="Lost in Translation" worldNumber={8} worldColor="#8F96FA" totalRounds={rounds.length}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(99,102,241,${0.15 + p.size * 0.06}), transparent)` }}
              animate={prefersReducedMotion ? {} : { y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(99,102,241,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4 items-center justify-center">
              <AnimatePresence mode="wait">

                {/* WELCOME */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-4">
                    {/* ENH: Animated globe entrance with orbiting flags */}
                    <motion.div
                      className="relative"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 180, damping: 14 }}
                    >
                      <motion.span
                        className="text-5xl inline-block"
                        role="img"
                        aria-label="globe"
                        animate={prefersReducedMotion ? {} : { rotate: [0, 360] }}
                        transition={prefersReducedMotion ? { duration: 0 } : { duration: 20, repeat: Infinity, ease: 'linear' }}
                      >
                        {'\u{1F30D}'}
                      </motion.span>
                      <motion.div
                        className="absolute -inset-3 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent)' }}
                        animate={prefersReducedMotion ? {} : { scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                        transition={prefersReducedMotion ? { duration: 0 } : { duration: 2, repeat: Infinity }}
                      />
                      {/* ENH: Bouncing flag emojis around the globe */}
                      {['\u{1F1EB}\u{1F1F7}', '\u{1F1EF}\u{1F1F5}', '\u{1F1E9}\u{1F1EA}', '\u{1F1EA}\u{1F1F8}'].map((flag, i) => (
                        <motion.span
                          key={i}
                          className="absolute text-lg"
                          style={{ top: '50%', left: '50%' }}
                          animate={prefersReducedMotion ? {} : {
                            x: [Math.cos((i * Math.PI) / 2) * 36, Math.cos((i * Math.PI) / 2 + Math.PI) * 36],
                            y: [Math.sin((i * Math.PI) / 2) * 36, Math.sin((i * Math.PI) / 2 + Math.PI) * 36],
                            scale: [1, 1.2, 1],
                          }}
                          transition={prefersReducedMotion ? { duration: 0 } : { duration: 3, repeat: Infinity, delay: i * 0.4 }}
                        >
                          {flag}
                        </motion.span>
                      ))}
                    </motion.div>
                    <h2 className="font-display text-2xl font-bold text-white">Lost in Translation</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C' ? 'Observe how neural machine translation degrades meaning through multi-hop translation chains. Analyze why idioms fail.'
                        : 'Watch what happens when a phrase gets translated through multiple languages and back!'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Translation', 'Idioms', 'Language'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 font-body text-2xs text-indigo-300">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Start Translating! <Languages className="inline w-4 h-4 ml-1" />
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
                        <div key={i} className={`w-2 h-2 rounded-full ${i === learnIdx ? 'bg-[#818CF8]' : 'bg-white/20'}`} />
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
                        style={{ background: 'linear-gradient(135deg, #818CF8, #6366F1)' }}
                        whileTap={{ scale: 0.95 }}>{learnIdx < LEARN_CARDS.length - 1 ? 'Next' : 'Start Playing!'}</motion.button>
                    </div>
                  </motion.div>
                )}

                {/* PLAY */}
                {phase === 'play' && round && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col w-full max-w-md">
                    <div className="flex items-center gap-3 mb-3 px-4">
                      <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                      <GameProgressTracker current={idx + 1} total={rounds.length} labColor="#818CF8" />
                    </div>
                    <p className="font-body text-xs text-white/55 text-center mb-3">{idx + 1}/{rounds.length}</p>

                    {/* Original */}
                    <div className="rounded-xl p-4 mb-3 border border-indigo-500/20 bg-indigo-500/5 text-center">
                      <p className="font-body text-2xs text-white/60">{'\u{1F1EC}\u{1F1E7}'} Original</p>
                      <p className="font-display text-base font-bold text-white">&ldquo;{round.original}&rdquo;</p>
                    </div>

                    {/* ENH: Translation steps with sliding entrance + flag bounce */}
                    <div className="space-y-2 mb-3">
                      {round.steps.map((s, i) => (
                        <motion.div
                          key={i}
                          className={`p-3 rounded-xl border text-center transition-colors ${i <= step ? 'border-indigo-500/20 bg-indigo-500/5' : 'border-white/5 bg-white/[0.02]'}`}
                          initial={i <= step ? { opacity: 0, x: -30 } : { opacity: 0.2 }}
                          animate={i <= step ? { opacity: 1, x: 0 } : { opacity: 0.2 }}
                          transition={i <= step ? { type: 'spring', stiffness: 120, damping: 15, delay: 0.1 } : {}}
                        >
                          {i <= step && i > 0 && <ArrowDown className="w-3 h-3 text-indigo-500/30 mx-auto mb-1" />}
                          {i <= step ? (
                            <div className="flex items-center justify-center gap-2">
                              {/* ENH: Flag emoji bounce on reveal */}
                              <motion.span
                                className="inline-block"
                                initial={{ scale: 0, y: -10 }}
                                animate={{ scale: [0, 1.3, 1], y: [- 10, 4, 0] }}
                                transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.15 }}
                              >
                                {s.slice(0, 4)}
                              </motion.span>
                              <p className="font-body text-sm text-white/70">{s.slice(4)}</p>
                            </div>
                          ) : (
                            <p className="font-body text-sm text-white/70">???</p>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* ENH: Degradation meter — shows how much meaning was lost */}
                    {allRevealed && (() => {
                      const deg = computeDegradation(round.original, round.final);
                      const color = deg > 60 ? '#EF4444' : deg > 30 ? '#FFAA44' : '#4ade80';
                      return (
                        <motion.div
                          className="mb-3"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-body text-2xs text-white/60">Meaning degradation</span>
                            <span className="font-data text-2xs" style={{ color }}>{deg}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: `linear-gradient(90deg, #4ade80, ${color})` }}
                              initial={{ width: 0 }}
                              animate={{ width: `${deg}%` }}
                              transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.3 }}
                            />
                          </div>
                        </motion.div>
                      );
                    })()}

                    {/* ENH: Final result with comparison highlights */}
                    {allRevealed && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="rounded-xl p-4 text-center border border-amber-500/30 bg-amber-500/5 mb-3">
                        <p className="font-body text-2xs text-white/60">{'\u{1F1EC}\u{1F1E7}'} Back to English:</p>
                        <p className="font-display text-base font-bold text-amber-400">&ldquo;{round.final}&rdquo;</p>
                        {/* ENH: Side-by-side comparison with highlight */}
                        <motion.div
                          className="mt-2 grid grid-cols-2 gap-2 text-left"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <div className="p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                            <p className="font-body text-2xs text-indigo-300/50 mb-0.5">Original</p>
                            <p className="font-body text-xs text-white/60">{round.original}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                            <p className="font-body text-2xs text-amber-300/50 mb-0.5">Result</p>
                            <p className="font-body text-xs text-amber-400/80">{round.final}</p>
                          </div>
                        </motion.div>
                        <p className="font-body text-2xs text-white/60 mt-2">{'\u{1F4A1}'} {ageBand === 'C' ? round.whyC : round.why}</p>
                      </motion.div>
                    )}

                    <motion.button onClick={reveal}
                      aria-label={allRevealed ? (idx < rounds.length - 1 ? 'Next phrase' : 'Finish game') : 'Reveal next translation step'}
                      className="w-full py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      {allRevealed ? (idx < rounds.length - 1 ? 'Next Phrase \u2192' : 'Finish!') : 'Reveal Next Translation \u2192'}
                    </motion.button>
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
                    <h2 className="font-display text-2xl font-bold text-white">Lost in Translation Complete!</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">You discovered how meaning gets lost when AI translates through multiple languages — idioms, metaphors, and cultural expressions are still a big challenge for machine translation!</p>
                    {/* ENH: Animated score counter */}
                    <motion.div
                      className="rounded-xl px-6 py-3 bg-[#818CF8]/10 border border-[#818CF8]/20"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 200, delay: 0.4 }}
                    >
                      <motion.p
                        className="font-data text-2xl"
                        style={{ color: '#818CF8' }}
                        animate={prefersReducedMotion ? {} : { textShadow: ['0 0 0px rgba(99,102,241,0)', '0 0 12px rgba(99,102,241,0.5)', '0 0 0px rgba(99,102,241,0)'] }}
                        transition={prefersReducedMotion ? { duration: 0 } : { duration: 2, repeat: Infinity }}
                      >
                        {animatedScore}
                      </motion.p>
                      <p className="font-body text-2xs text-white/60">Total Points</p>
                    </motion.div>
                    <div className="mt-4 space-y-2 text-left max-w-sm">
                      <h3 className="font-display text-sm font-bold text-white/70">What You Learned:</h3>
                      <ul className="space-y-1 text-2xs font-body text-white/70">
                        <li>• Machine translation works word-by-word but misses figurative meaning</li>
                        <li>• Language ambiguity means one phrase can have multiple interpretations</li>
                        <li>• Context is crucial in NLP — without it, AI takes everything literally</li>
                      </ul>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
