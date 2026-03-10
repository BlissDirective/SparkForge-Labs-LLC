// ════════════════════════════════════════════════════
// LOST IN TRANSLATION V2 — Lab 8 (NLP)
// Pre-computed translation telephone game.
// Enhanced: chrome bezel, welcome phase, 7 rounds,
// language flags, "why it changed" explanations, age-band.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Languages, ArrowDown } from 'lucide-react';

type Phase = 'welcome' | 'play';

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
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

export function LostInTranslationGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState(-1);

  const rounds = useMemo(() => ALL_ROUNDS.filter(r => BAND_ORDER[r.band] <= BAND_ORDER[ageBand]), [ageBand]);

  const round = rounds[idx];
  const allRevealed = step >= (round?.steps.length ?? 0);

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: (i * 37 + 13) % 100, y: (i * 53 + 7) % 100, size: (i % 3) + 1,
    delay: (i * 0.7) % 4, dur: (i % 6) + 4,
  })), []);

  function reveal() {
    if (allRevealed) {
      game.updateScore(10);
      if (idx < rounds.length - 1) { setIdx(i => i + 1); setStep(-1); game.advanceRound(); }
      else game.completeGame();
    } else { setStep(s => s + 1); }
  }

  return (
    <GameShell gameId="lost-in-translation" title="Lost in Translation" worldNumber={8} worldColor="#818CF8" totalRounds={rounds.length}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(99,102,241,${0.15 + p.size * 0.06}), transparent)` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
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
                    <span className="text-5xl" role="img" aria-label="globe">{'\u{1F30D}'}</span>
                    <h2 className="font-display text-2xl font-bold text-white">Lost in Translation</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C' ? 'Observe how neural machine translation degrades meaning through multi-hop translation chains. Analyze why idioms fail.'
                        : 'Watch what happens when a phrase gets translated through multiple languages and back!'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Translation', 'Idioms', 'Language'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 font-body text-[10px] text-indigo-300">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Start Translating! <Languages className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* PLAY */}
                {phase === 'play' && round && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col w-full max-w-md">
                    <p className="font-body text-xs text-white/20 text-center mb-3">{idx + 1}/{rounds.length}</p>

                    {/* Original */}
                    <div className="rounded-xl p-4 mb-3 border border-indigo-500/20 bg-indigo-500/5 text-center">
                      <p className="font-body text-[10px] text-white/30">{'\u{1F1EC}\u{1F1E7}'} Original</p>
                      <p className="font-display text-base font-bold text-white">&ldquo;{round.original}&rdquo;</p>
                    </div>

                    {/* Translation steps */}
                    <div className="space-y-2 mb-3">
                      {round.steps.map((s, i) => (
                        <motion.div key={i} className={`p-3 rounded-xl border text-center transition-all ${i <= step ? 'border-indigo-500/20 bg-indigo-500/5' : 'border-white/5 bg-white/[0.02]'}`}
                          animate={{ opacity: i <= step ? 1 : 0.2 }}>
                          {i <= step && i > 0 && <ArrowDown className="w-3 h-3 text-indigo-500/30 mx-auto mb-1" />}
                          <p className="font-body text-sm text-white/70">{i <= step ? s : '???'}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Final result */}
                    {allRevealed && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="rounded-xl p-4 text-center border border-amber-500/30 bg-amber-500/5 mb-3">
                        <p className="font-body text-[10px] text-white/30">{'\u{1F1EC}\u{1F1E7}'} Back to English:</p>
                        <p className="font-display text-base font-bold text-amber-400">&ldquo;{round.final}&rdquo;</p>
                        <p className="font-body text-[10px] text-white/30 mt-2">{'\u{1F4A1}'} {ageBand === 'C' ? round.whyC : round.why}</p>
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

              </AnimatePresence>
            </div>

            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
