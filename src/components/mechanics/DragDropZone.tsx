// ════════════════════════════════════════════════════════════════
// DRAG DROP ZONE — Classification/Sorting Mechanic
// ════════════════════════════════════════════════════════════════
// Items are dragged into labeled buckets. Used for:
//   • Classifying data types (personal/sensitive/behavioral)
//   • Sorting AI concepts into categories
//   • Matching terms to definitions

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Check, X, RotateCcw, HelpCircle } from 'lucide-react';
import type { MechanicItem, DropZone } from '@/lib/mechanics/GameMechanicKit';
import { validateDragDrop } from '@/lib/mechanics/GameMechanicKit';

interface DragDropZoneProps {
  zones: DropZone[];
  poolItems: MechanicItem[];
  onComplete?: (result: { allCorrect: boolean; score: number }) => void;
  onScore?: (points: number) => void;
  showHints?: boolean;
}

export function DragDropZone({ zones: initialZones, poolItems, onComplete, onScore, showHints = true }: DragDropZoneProps) {
  const [zones, setZones] = useState<DropZone[]>(initialZones);
  const [pool, setPool] = useState<MechanicItem[]>(poolItems);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [validation, setValidation] = useState<ReturnType<typeof validateDragDrop> | null>(null);

  const handleDragStart = useCallback((itemId: string) => {
    setDraggedId(itemId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
  }, []);

  const moveItemToZone = useCallback((itemId: string, zoneId: string) => {
    if (submitted) return;

    // Find item in pool or other zones
    let item: MechanicItem | undefined;
    const newPool = [...pool];
    const newZones = zones.map(z => ({ ...z, items: [...z.items] }));

    // Check pool first
    const poolIdx = newPool.findIndex(i => i.id === itemId);
    if (poolIdx >= 0) {
      item = newPool[poolIdx];
      newPool.splice(poolIdx, 1);
    } else {
      // Check zones
      for (const z of newZones) {
        const zi = z.items.findIndex(i => i.id === itemId);
        if (zi >= 0) {
          item = z.items[zi];
          z.items.splice(zi, 1);
          break;
        }
      }
    }

    if (!item) return;

    // Add to target zone
    const targetZone = newZones.find(z => z.id === zoneId);
    if (targetZone && (!targetZone.maxItems || targetZone.items.length < targetZone.maxItems)) {
      targetZone.items.push(item);
    } else {
      newPool.push(item); // Zone full, return to pool
    }

    setPool(newPool);
    setZones(newZones);
  }, [pool, zones, submitted]);

  const handleSubmit = useCallback(() => {
    const result = validateDragDrop(zones);
    setValidation(result);
    setSubmitted(true);

    const totalItems = zones.reduce((sum, z) => sum + z.items.length, 0);
    const correctItems = result.zoneResults.reduce((sum, z) => sum + z.correct, 0);
    const score = totalItems > 0 ? Math.round((correctItems / totalItems) * 100) : 0;

    onComplete?.({ allCorrect: result.allCorrect, score });
    if (result.allCorrect) onScore?.(20);
    else onScore?.(Math.round((correctItems / totalItems) * 15));
  }, [zones, onComplete, onScore]);

  const handleReset = useCallback(() => {
    setZones(initialZones.map(z => ({ ...z, items: [] })));
    setPool([...poolItems]);
    setSubmitted(false);
    setValidation(null);
  }, [initialZones, poolItems]);

  return (
    <div className="space-y-4">
      {/* Item Pool */}
      <div className="rounded-xl bg-slate-800/40 border border-slate-700/30 p-3 min-h-[80px]">
        <p className="text-xs text-slate-400 mb-2">Drag items into the correct zones:</p>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout">
            {pool.map(item => (
              <motion.div
                key={item.id}
                layout
                layoutId={item.id}
                draggable={!submitted}
                onDragStart={() => handleDragStart(item.id)}
                onDragEnd={handleDragEnd}
                whileHover={!submitted ? { scale: 1.05, y: -2 } : {}}
                whileTap={!submitted ? { scale: 0.95 } : {}}
                className={`
                  px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing
                  text-xs font-medium flex items-center gap-2 select-none
                  transition-colors
                  ${submitted ? 'opacity-60 cursor-default' : 'hover:shadow-lg'}
                `}
                style={{
                  background: `${item.color || '#3B82F6'}15`,
                  borderColor: `${item.color || '#3B82F6'}30`,
                  color: item.color || '#60A5FA',
                }}
                onClick={() => {
                  if (!submitted && pool.length > 0) {
                    // Click to move: cycle through zones
                    const zoneIdx = zones.findIndex(z =>
                      !z.maxItems || z.items.length < z.maxItems
                    );
                    if (zoneIdx >= 0) moveItemToZone(item.id, zones[zoneIdx].id);
                  }
                }}
              >
                {item.emoji && <span>{item.emoji}</span>}
                {item.label}
              </motion.div>
            ))}
          </AnimatePresence>

          {pool.length === 0 && !submitted && (
            <p className="text-xs text-slate-500 italic">All items placed!</p>
          )}
        </div>
      </div>

      {/* Drop Zones */}
      <div className={`grid gap-3 ${zones.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {zones.map(zone => {
          const zoneResult = validation?.zoneResults.find(z => z.zoneId === zone.id);
          const isZoneCorrect = submitted && zoneResult && zoneResult.misplaced.length === 0 && zoneResult.total > 0;
          const hasMisplaced = submitted && zoneResult && zoneResult.misplaced.length > 0;

          return (
            <motion.div
              key={zone.id}
              className={`
                rounded-xl border-2 border-dashed p-3 min-h-[120px] transition-all
                ${submitted
                  ? isZoneCorrect
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : hasMisplaced
                      ? 'border-red-500/40 bg-red-500/5'
                      : 'border-slate-700/30 bg-slate-800/20'
                  : 'border-slate-700/30 bg-slate-800/20 hover:border-slate-600/40'
                }
              `}
              onDragOver={e => { e.preventDefault(); }}
              onDrop={e => {
                e.preventDefault();
                if (draggedId) moveItemToZone(draggedId, zone.id);
              }}
            >
              {/* Zone header */}
              <div className="flex items-center gap-2 mb-2">
                {zone.emoji && <span className="text-sm">{zone.emoji}</span>}
                <span className="text-xs font-semibold text-white">{zone.label}</span>
                {submitted && isZoneCorrect && <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
                {submitted && hasMisplaced && <X className="w-3.5 h-3.5 text-red-400 ml-auto" />}
                {zone.maxItems && (
                  <span className="text-[10px] text-slate-500 ml-auto">{zone.items.length}/{zone.maxItems}</span>
                )}
              </div>

              {/* Zone items */}
              <div className="flex flex-wrap gap-1.5">
                <AnimatePresence mode="popLayout">
                  {zone.items.map(item => {
                    const isMisplaced = zoneResult?.misplaced.some(m => m.id === item.id);
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        layoutId={item.id}
                        draggable={!submitted}
                        onDragStart={() => handleDragStart(item.id)}
                        onDragEnd={handleDragEnd}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className={`
                          px-2 py-1 rounded-md border text-[10px] font-medium flex items-center gap-1
                          ${submitted && isMisplaced ? 'border-red-500/40 bg-red-500/10 text-red-300' : ''}
                          ${submitted && !isMisplaced ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : ''}
                          ${!submitted ? 'cursor-grab active:cursor-grabbing' : ''}
                        `}
                        style={!submitted ? {
                          background: `${item.color || '#3B82F6'}15`,
                          borderColor: `${item.color || '#3B82F6'}30`,
                          color: item.color || '#60A5FA',
                        } : {}}
                      >
                        {item.emoji && <span className="text-xs">{item.emoji}</span>}
                        {item.label}
                        {submitted && isMisplaced && <X className="w-3 h-3 text-red-400" />}
                        {submitted && !isMisplaced && <Check className="w-3 h-3 text-emerald-400" />}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {zone.items.length === 0 && (
                  <p className="text-[10px] text-slate-600 italic">Drop items here</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {!submitted ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={pool.length > 0}
            className={`
              px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${pool.length === 0
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }
            `}
          >
            Check Answer
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </motion.button>
        )}

        {showHints && !submitted && (
          <button className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-slate-300 transition-colors" title="Hint: Read each item carefully and think about what type of data it is.">
            <HelpCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
