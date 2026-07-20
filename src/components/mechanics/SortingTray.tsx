// ════════════════════════════════════════════════════════════════
// SORTING TRAY — Sequence/Order Mechanic
// ════════════════════════════════════════════════════════════════
// Players reorder items into the correct sequence. Used for:
//   • Ordering ML pipeline steps
//   • Sequencing AI training phases
//   • Ranking concepts by importance

'use client';

import { useState, useCallback } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowUpDown, RotateCcw } from 'lucide-react';
import type { SortableItem } from '@/lib/mechanics/GameMechanicKit';
import { validateSorting } from '@/lib/mechanics/GameMechanicKit';

interface SortingTrayProps {
  items: SortableItem[];
  onComplete?: (result: { allCorrect: boolean; score: number }) => void;
  onScore?: (points: number) => void;
  title?: string;
}

export function SortingTray({ items: initialItems, onComplete, onScore, title }: SortingTrayProps) {
  const [items, setItems] = useState<SortableItem[]>(
    // Shuffle items on mount
    [...initialItems].sort(() => Math.random() - 0.5)
  );
  const [submitted, setSubmitted] = useState(false);
  const [validation, setValidation] = useState<ReturnType<typeof validateSorting> | null>(null);

  const handleReorder = useCallback((newOrder: SortableItem[]) => {
    if (!submitted) setItems(newOrder);
  }, [submitted]);

  const handleSubmit = useCallback(() => {
    // Reorder only changes array order, not each item's `currentPosition`
    // field — so snapshot the live order into `currentPosition` before
    // validating, otherwise scoring reads the original (shuffled) layout.
    const ordered = items.map((it, i) => ({ ...it, currentPosition: i }));
    const result = validateSorting(ordered);
    setValidation(result);
    setSubmitted(true);
    const score = ordered.length > 0
      ? Math.round((result.correctPositions / ordered.length) * 100)
      : 0;
    onComplete?.({ allCorrect: result.allCorrect, score });
    onScore?.(result.allCorrect ? 20 : Math.round((result.correctPositions / ordered.length) * 15));
  }, [items, onComplete, onScore]);

  const handleReset = useCallback(() => {
    setItems([...initialItems].sort(() => Math.random() - 0.5));
    setSubmitted(false);
    setValidation(null);
  }, [initialItems]);

  return (
    <div className="space-y-4">
      {title && <p className="text-xs text-sf-console-text-dim">{title}</p>}

      <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-2">
        <AnimatePresence>
          {items.map((item, index) => {
            const isCorrect = submitted && validation && item.correctPosition === index;
            const isWrong = submitted && validation && item.correctPosition !== index;

            return (
              <Reorder.Item
                key={item.id}
                value={item}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
                  ${submitted ? '' : 'cursor-grab active:cursor-grabbing hover:shadow-lg'}
                  ${isCorrect ? 'border-emerald-500/40 bg-emerald-500/10' : ''}
                  ${isWrong ? 'border-red-500/30 bg-red-500/5' : ''}
                  ${!submitted ? 'border-sf-console-border/30 bg-sf-console-raised/40' : ''}
                `}
                whileDrag={{ scale: 1.03, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
              >
                {/* Position number */}
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                  ${isCorrect ? 'bg-emerald-500/20 text-emerald-400' : ''}
                  ${isWrong ? 'bg-red-500/20 text-red-400' : ''}
                  ${!submitted ? 'bg-sf-console-well/50 text-sf-console-text-dim' : ''}
                `}>
                  {submitted && isCorrect ? <Check className="w-3.5 h-3.5" /> : index + 1}
                </div>

                {/* Item content */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  {item.emoji && <span className="text-lg">{item.emoji}</span>}
                  <span className={`text-sm font-medium ${isWrong ? 'text-red-300' : 'text-white'}`}>
                    {item.label}
                  </span>
                </div>

                {/* Drag handle */}
                {!submitted && (
                  <ArrowUpDown className="w-4 h-4 text-sf-console-text-faint shrink-0" />
                )}

                {/* Feedback */}
                {submitted && isCorrect && (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                {submitted && isWrong && (
                  <div className="flex items-center gap-1 shrink-0">
                    <X className="w-4 h-4 text-red-400" />
                    <span className="text-[10px] text-sf-console-text-faint">#{item.correctPosition + 1}</span>
                  </div>
                )}
              </Reorder.Item>
            );
          })}
        </AnimatePresence>
      </Reorder.Group>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        {!submitted ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-400 hover:to-purple-400 transition-all"
          >
            Check Order
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-sf-console-raised text-sf-console-text hover:bg-sf-console-well transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Reshuffle
          </motion.button>
        )}

        {submitted && validation && (
          <span className={`text-xs font-semibold ${validation.allCorrect ? 'text-emerald-400' : 'text-amber-400'}`}>
            {validation.correctPositions}/{items.length} correct
          </span>
        )}
      </div>
    </div>
  );
}
