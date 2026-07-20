// ════════════════════════════════════════════════════════════════
// PET WIDGET — Home page card for the virtual pet
// Compact overview with avatar, needs, and quick care actions
// ════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, Heart, Zap } from 'lucide-react';
import type { PetState, CareAction } from '@/lib/pet/PetEngine';
import {
  calculateMood,
  MOOD_CONFIG,
  averageNeeds,
  STAGE_LABELS,
  SPECIES_CONFIG,
  checkEvolution,
  hasCriticalNeed,
  getDailyGreeting,
  shouldPromptCare,
} from '@/lib/pet/PetEngine';
import { PetAvatar } from './PetAvatar';
import { PetCarePanel } from './PetCarePanel';
import { PetEvolutionModal } from './PetEvolutionModal';

interface PetWidgetProps {
  pet: PetState;
  childName: string;
  onCare: (action: CareAction) => void;
  onSleep: () => void;
  onEvolve: () => void;
}

export function PetWidget({ pet, childName, onCare, onSleep, onEvolve }: PetWidgetProps) {
  const [showCare, setShowCare] = useState(false);
  const [showEvolve, setShowEvolve] = useState(false);
  const mood = calculateMood(pet.needs);
  const moodCfg = MOOD_CONFIG[mood];
  const avgNeeds = averageNeeds(pet.needs);
  const evoCheck = checkEvolution(pet);
  const needsCare = shouldPromptCare(pet);
  const isCritical = hasCriticalNeed(pet.needs);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          rounded-2xl overflow-hidden relative
          ${isCritical
            ? 'bg-gradient-to-br from-red-950/40 to-orange-950/20 border border-red-500/20'
            : 'bg-gradient-to-br from-indigo-950/30 to-purple-950/20 border border-indigo-500/15'
          }
        `}
      >
        {/* Critical pulse */}
        {isCritical && (
          <motion.div
            className="absolute inset-0 border-2 border-red-500/30 rounded-2xl pointer-events-none"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Your Pet</h3>
              {evoCheck.canEvolve && (
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold"
                >
                  Can Evolve!
                </motion.span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-400 font-semibold">{pet.carePoints} CP</span>
              <button
                onClick={() => setShowCare(!showCare)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 transition-colors"
              >
                {showCare ? 'Hide' : 'Care'} <ChevronRight className={`w-3 h-3 transition-transform ${showCare ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </div>

          {/* Main row: Avatar + Info */}
          <div className="flex items-center gap-4">
            <PetAvatar pet={pet} size="md" />

            <div className="flex-1 min-w-0">
              {/* Greeting */}
              <p className="text-xs text-sf-console-text mb-2 line-clamp-2">
                {getDailyGreeting(pet, childName)}
              </p>

              {/* Need summary */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-sf-console-text-faint">Needs</span>
                    <span className="text-[10px] font-semibold" style={{ color: moodCfg.color }}>
                      {Math.round(avgNeeds)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-sf-console-well/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: isCritical
                          ? 'linear-gradient(90deg, #EF4444, #F87171)'
                          : `linear-gradient(90deg, ${moodCfg.color}, ${moodCfg.color}80)`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${avgNeeds}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>

                {/* Quick stats */}
                <div className="flex gap-2 shrink-0">
                  <div className="text-center">
                    <Heart className="w-3.5 h-3.5 text-pink-400 mx-auto" />
                    <span className="text-[9px] text-sf-console-text-dim">{pet.consecutiveCareDays}d</span>
                  </div>
                  <div className="text-center">
                    <Zap className="w-3.5 h-3.5 text-amber-400 mx-auto" />
                    <span className="text-[9px] text-sf-console-text-dim">{pet.tricksLearned.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Care panel (expandable) */}
          <AnimatePresence>
            {showCare && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-sf-console-border/30">
                  <PetCarePanel pet={pet} onCare={onCare} onSleep={onSleep} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Needs care prompt */}
          {!showCare && needsCare && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowCare(true)}
              className={`
                mt-3 w-full py-2 rounded-lg text-xs font-semibold transition-colors
                ${isCritical
                  ? 'bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                }
              `}
            >
              {isCritical ? '⚠️ Your pet needs urgent care!' : 'Your pet needs some attention'}
            </motion.button>
          )}

          {/* Evolve button */}
          {evoCheck.canEvolve && (
            <motion.button
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setShowEvolve(true)}
              className="mt-2 w-full py-2 rounded-lg bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:from-emerald-500/25 hover:to-teal-500/25 transition-all"
            >
              ✨ Ready to Evolve! Tap to see requirements
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Evolution Modal */}
      <PetEvolutionModal
        pet={pet}
        isOpen={showEvolve}
        onClose={() => setShowEvolve(false)}
        onEvolve={onEvolve}
      />
    </>
  );
}
