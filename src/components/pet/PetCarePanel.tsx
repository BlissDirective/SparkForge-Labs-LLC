// ════════════════════════════════════════════════════════════════
// PET CARE PANEL — Main care interaction interface
// Need bars, care action buttons, warnings, recommended actions
// ════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Gamepad2,
  Bath,
  Bed,
  Dumbbell,
  AlertTriangle,
  Sparkles,
  Heart,
  Moon,
  Sun,
} from 'lucide-react';
import type { PetState, CareAction } from '@/lib/pet/PetEngine';
import {
  calculateMood,
  MOOD_CONFIG,
  getNeedWarnings,
  getRecommendedAction,
  CARE_ACTION_EFFECTS,
  CRITICAL_THRESHOLD,
} from '@/lib/pet/PetEngine';

interface PetCarePanelProps {
  pet: PetState;
  onCare: (action: CareAction) => void;
  onSleep: () => void;
}

const CARE_BUTTONS: { action: CareAction; icon: typeof Utensils; label: string; color: string }[] = [
  { action: 'feed', icon: Utensils, label: 'Feed', color: '#F59E0B' },
  { action: 'play', icon: Gamepad2, label: 'Play', color: '#10B981' },
  { action: 'clean', icon: Bath, label: 'Clean', color: '#3B82F6' },
  { action: 'rest', icon: Bed, label: 'Rest', color: '#8B5CF6' },
  { action: 'train', icon: Dumbbell, label: 'Train', color: '#E945F5' },
];

function NeedBar({ label, value, color }: { label: string; value: number; color: string }) {
  const isCritical = value < CRITICAL_THRESHOLD;
  const isLow = value < 40;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <span className={`text-xs font-semibold ${isCritical ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-slate-300'}`}>
          {Math.round(value)}%
        </span>
      </div>
      <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full relative"
          style={{
            background: isCritical
              ? 'linear-gradient(90deg, #EF4444, #F87171)'
              : isLow
                ? `linear-gradient(90deg, ${color}80, ${color})`
                : `linear-gradient(90deg, ${color}, ${color}dd)`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {isCritical && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: 'rgba(239,68,68,0.4)' }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}

export function PetCarePanel({ pet, onCare, onSleep }: PetCarePanelProps) {
  const [justCared, setJustCared] = useState<string | null>(null);
  const mood = calculateMood(pet.needs);
  const moodCfg = MOOD_CONFIG[mood];
  const warnings = getNeedWarnings(pet.needs);
  const recommended = getRecommendedAction(pet);
  const hasCritical = warnings.some(w => w.includes('💔'));

  const handleCare = (action: CareAction) => {
    onCare(action);
    setJustCared(action);
    setTimeout(() => setJustCared(null), 2000);
  };

  return (
    <div className="relative rounded-2xl bg-slate-900/60 border border-slate-700/30 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4" style={{ color: moodCfg.color }} />
          <h3 className="text-sm font-semibold text-white">Care</h3>
          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${moodCfg.color}20`, color: moodCfg.color }}>
            {moodCfg.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-400 font-semibold">{pet.carePoints} CP</span>
          <button
            onClick={onSleep}
            className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
            title={pet.isSleeping ? 'Wake up' : 'Sleep'}
          >
            {pet.isSleeping ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>
        </div>
      </div>

      {/* Need bars */}
      <div className="space-y-2.5">
        <NeedBar label="Hunger" value={pet.needs.hunger} color="#F59E0B" />
        <NeedBar label="Happiness" value={pet.needs.happiness} color="#EC4899" />
        <NeedBar label="Energy" value={pet.needs.energy} color="#10B981" />
        <NeedBar label="Cleanliness" value={pet.needs.cleanliness} color="#3B82F6" />
      </div>

      {/* Warnings */}
      <AnimatePresence>
        {warnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`rounded-lg p-2.5 space-y-1 ${hasCritical ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}
          >
            {warnings.slice(0, 3).map((w, i) => (
              <p key={i} className={`text-xs flex items-center gap-1.5 ${hasCritical ? 'text-red-400' : 'text-amber-400'}`}>
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {w}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recommended action */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Sparkles className="w-3 h-3 text-indigo-400" />
        Recommended: <span className="text-indigo-400 font-medium capitalize">{recommended}</span>
      </div>

      {/* Care action buttons */}
      <div className="grid grid-cols-5 gap-2">
        {CARE_BUTTONS.map(({ action, icon: Icon, label, color }) => {
          const cost = CARE_ACTION_EFFECTS[action].cpCost;
          const canAfford = pet.carePoints >= cost;
          const isRecommended = recommended === action;
          const justDid = justCared === action;

          return (
            <motion.button
              key={action}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCare(action)}
              disabled={pet.isSleeping || !canAfford}
              className={`
                flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all
                ${pet.isSleeping || !canAfford
                  ? 'opacity-40 cursor-not-allowed bg-slate-800'
                  : 'hover:shadow-lg'
                }
                ${isRecommended && canAfford && !pet.isSleeping ? 'ring-1 ring-offset-1 ring-offset-slate-900' : ''}
              `}
              style={
                canAfford && !pet.isSleeping
                  ? {
                      background: `linear-gradient(135deg, ${color}15, ${color}08)`,
                      border: `1px solid ${color}30`,
                      ...(isRecommended ? { ['--tw-ring-color' as string]: color } : {}),
                    }
                  : {}
              }
            >
              <motion.div
                animate={justDid ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <Icon className="w-5 h-5" style={{ color: canAfford ? color : '#64748B' }} />
              </motion.div>
              <span className="text-[10px] font-medium text-slate-300">{label}</span>
              {cost > 0 && (
                <span className="text-[9px] text-slate-500">{cost} CP</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Sleeping overlay */}
      <AnimatePresence>
        {pet.isSleeping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 rounded-2xl flex items-center justify-center backdrop-blur-sm"
          >
            <div className="text-center">
              <Moon className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <p className="text-sm text-white font-semibold">Sleeping...</p>
              <p className="text-xs text-slate-400">Energy recovering</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
