// ════════════════════════════════════════════════════════════════
// CHOICE CARD DECK — Branching Decision Mechanic
// ════════════════════════════════════════════════════════════════
// Players pick from cards with visible consequences. Used for:
//   • Ethical AI decision scenarios
//   • Privacy/safety trade-off choices
//   • Creative AI prompt engineering paths

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, AlertTriangle } from 'lucide-react';
import type { ChoiceCard } from '@/lib/mechanics/GameMechanicKit';

interface ChoiceCardDeckProps {
  scenario: string;
  emoji: string;
  cards: ChoiceCard[];
  onComplete?: (selectedCard: ChoiceCard) => void;
  onScore?: (points: number) => void;
}

export function ChoiceCardDeck({ scenario, emoji, cards, onComplete, onScore }: ChoiceCardDeckProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = useCallback((cardId: string) => {
    if (revealed) return;
    setSelectedId(cardId);
  }, [revealed]);

  const handleReveal = useCallback(() => {
    if (!selectedId) return;
    setRevealed(true);

    const card = cards.find(c => c.id === selectedId);
    if (!card) return;

    const totalXp = card.consequences?.reduce((sum, c) =>
      c.type === 'xp' ? sum + (c.value as number) :
      c.type === 'penalty' ? sum + (c.value as number) : sum, 0
    ) ?? 0;

    onComplete?.(card);
    onScore?.(totalXp);
  }, [selectedId, cards, onComplete, onScore]);

  const selectedCard = cards.find(c => c.id === selectedId);

  return (
    <div className="space-y-5">
      {/* Scenario */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
        <span className="text-3xl">{emoji}</span>
        <div>
          <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide">Scenario</p>
          <p className="text-sm text-white font-medium leading-relaxed">{scenario}</p>
        </div>
      </div>

      {/* Cards */}
      <div className={`grid gap-3 ${cards.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}>
        {cards.map((card, i) => {
          const isSelected = selectedId === card.id;
          const isOtherSelected = selectedId && !isSelected;

          return (
            <motion.button
              key={card.id}
              whileHover={!revealed ? { scale: 1.03, y: -4 } : {}}
              whileTap={!revealed ? { scale: 0.97 } : {}}
              onClick={() => handleSelect(card.id)}
              className={`
                relative p-4 rounded-xl border-2 text-left transition-all
                ${isSelected
                  ? 'border-indigo-400 bg-indigo-500/10 shadow-lg shadow-indigo-500/15'
                  : isOtherSelected && revealed
                    ? 'border-slate-700/20 opacity-40'
                    : 'border-slate-700/30 bg-slate-800/40 hover:border-slate-600/50'
                }
              `}
            >
              {/* Selection indicator */}
              {isSelected && !revealed && (
                <motion.div
                  layoutId="selection-ring"
                  className="absolute inset-0 rounded-xl border-2 border-indigo-400 pointer-events-none"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}

              <div className="text-2xl mb-2">{card.emoji}</div>
              <h4 className="text-sm font-bold text-white mb-1.5">{card.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{card.description}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Reveal button */}
      {!revealed && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleReveal}
          disabled={!selectedId}
          className={`
            w-full py-3 rounded-xl text-sm font-semibold transition-all
            ${selectedId
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }
          `}
        >
          {selectedId ? 'See What Happens' : 'Choose a card first'}
        </motion.button>
      )}

      {/* Consequences reveal */}
      <AnimatePresence>
        {revealed && selectedCard && selectedCard.consequences && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Consequences:
            </p>

            {selectedCard.consequences.map((cons, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm
                  ${cons.type === 'xp' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : ''}
                  ${cons.type === 'penalty' ? 'bg-red-500/10 border-red-500/20 text-red-400' : ''}
                  ${cons.type === 'hint' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : ''}
                  ${cons.type === 'story' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : ''}
                  ${cons.type === 'unlock' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : ''}
                `}
              >
                <ArrowRight className="w-4 h-4 shrink-0" />
                <span>{cons.description}</span>
              </motion.div>
            ))}

            {/* Penalty warning */}
            {selectedCard.consequences.some(c => c.type === 'penalty') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Think about why this choice had a negative consequence. What would be a better approach?</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
