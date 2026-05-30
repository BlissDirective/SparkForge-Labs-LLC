// ════════════════════════════════════════════════════════════════
// PET EVOLUTION MODAL — Cinematic evolution reveal
// Shows evolution requirements, plays evolution animation
// ════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ChevronRight, Check, Lock } from 'lucide-react';
import type { PetState } from '@/lib/pet/PetEngine';
import {
  checkEvolution,
  STAGE_LABELS,
  EVOLUTION_PATHS,
  SPECIES_CONFIG,
} from '@/lib/pet/PetEngine';

interface PetEvolutionModalProps {
  pet: PetState;
  isOpen: boolean;
  onClose: () => void;
  onEvolve: () => void;
}

export function PetEvolutionModal({ pet, isOpen, onClose, onEvolve }: PetEvolutionModalProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const check = checkEvolution(pet);
  const speciesCfg = SPECIES_CONFIG[pet.species];

  const handleEvolve = () => {
    setShowCelebration(true);
    onEvolve();
    setTimeout(() => {
      setShowCelebration(false);
      onClose();
    }, 3000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700/50 p-6 relative overflow-hidden"
          >
            {/* Close */}
            <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 transition-colors z-10">
              <X className="w-4 h-4 text-slate-400" />
            </button>

            {/* Celebration overlay */}
            <AnimatePresence>
              {showCelebration && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/95"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="text-center"
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                      className="text-6xl mb-4"
                    >
                      ✨
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-2">Evolution Complete!</h3>
                    <p className="text-sm text-slate-400">
                      {pet.name} grew into a {check.toEvolution
                        ? EVOLUTION_PATHS.find(e => e.evolution === check.toEvolution)?.label
                        : ''}{' '}
                      {check.toStage ? STAGE_LABELS[check.toStage] : ''}!
                    </p>
                    {Array.from({ length: 12 }, (_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: speciesCfg.colors[0],
                          left: `${10 + Math.random() * 80}%`,
                          top: `${10 + Math.random() * 80}%`,
                        }}
                        initial={{ opacity: 1, scale: 1 }}
                        animate={{ opacity: 0, scale: 0, y: -50 }}
                        transition={{ duration: 1.5, delay: i * 0.1 }}
                      />
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: `linear-gradient(135deg, ${speciesCfg.colors[0]}30, ${speciesCfg.colors[1]}20)` }}
              >
                {pet.stage === 'egg' ? '🥚' : speciesCfg.emoji}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{pet.name}</h3>
                <p className="text-xs text-slate-400">
                  {STAGE_LABELS[pet.stage]} · Day {pet.ageDays}
                </p>
              </div>
            </div>

            {/* Current Stage */}
            <div className="mb-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
              <p className="text-xs text-slate-400 mb-1">Current Stage</p>
              <div className="flex items-center gap-2">
                <span className="text-lg">{pet.stage === 'egg' ? '🥚' : speciesCfg.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{STAGE_LABELS[pet.stage]}</p>
                  <p className="text-xs text-slate-500">Day {pet.ageDays}</p>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center my-3">
              <ChevronRight className="w-5 h-5 text-slate-600 rotate-90" />
            </div>

            {/* Next Stage */}
            <div className="mb-4 p-3 rounded-xl border border-dashed" style={{ borderColor: check.canEvolve ? '#10B98140' : '#6B728040' }}>
              <p className="text-xs mb-1" style={{ color: check.canEvolve ? '#10B981' : '#6B7280' }}>
                {check.canEvolve ? 'Next Stage (Ready!)' : 'Next Stage (Locked)'}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {check.toStage === 'egg' ? '🥚' : speciesCfg.emoji}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {check.toEvolution
                      ? `${EVOLUTION_PATHS.find(e => e.evolution === check.toEvolution)?.label} ${check.toStage ? STAGE_LABELS[check.toStage] : ''}`
                      : check.toStage ? STAGE_LABELS[check.toStage] : 'Max Stage'}
                  </p>
                </div>
                {check.canEvolve ? (
                  <Check className="w-4 h-4 text-emerald-400 ml-auto" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-600 ml-auto" />
                )}
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-1.5 mb-5">
              {check.requirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {req.startsWith('✅') ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Star className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  <span className={req.startsWith('✅') ? 'text-emerald-400' : 'text-slate-400'}>
                    {req.replace('✅ ', '')}
                  </span>
                </div>
              ))}
            </div>

            {/* Evolve button */}
            <motion.button
              whileHover={{ scale: check.canEvolve ? 1.02 : 1 }}
              whileTap={{ scale: check.canEvolve ? 0.98 : 1 }}
              onClick={handleEvolve}
              disabled={!check.canEvolve}
              className={`
                w-full py-2.5 rounded-xl font-semibold text-sm transition-all
                ${check.canEvolve
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }
              `}
            >
              {check.canEvolve ? '✨ Evolve!' : 'Keep Caring'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
