// ════════════════════════════════════════════════════════════════
// PET AVATAR — Visual representation of the pet
// Animated, mood-responsive, stage-appropriate rendering
// ════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import type { PetState, PetStage, PetMood, PetSpecies } from '@/lib/pet/PetEngine';
import {
  calculateMood,
  MOOD_CONFIG,
  STAGE_LABELS,
  SPECIES_CONFIG,
  STAGE_SIZE_MULT,
} from '@/lib/pet/PetEngine';

interface PetAvatarProps {
  pet: PetState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  onClick?: () => void;
}

const SIZE_MAP = { sm: 48, md: 80, lg: 120, xl: 180 };

export function PetAvatar({ pet, size = 'md', animate = true, onClick }: PetAvatarProps) {
  const mood = calculateMood(pet.needs);
  const moodCfg = MOOD_CONFIG[mood];
  const speciesCfg = SPECIES_CONFIG[pet.species];
  const stageMult = STAGE_SIZE_MULT[pet.stage];
  const pixelSize = Math.round(SIZE_MAP[size] * stageMult);

  return (
    <motion.div
      className="relative flex flex-col items-center cursor-pointer select-none"
      onClick={onClick}
      whileHover={animate ? { scale: 1.05 } : undefined}
      whileTap={animate ? { scale: 0.95 } : undefined}
    >
      {/* Glow effect based on mood */}
      <div
        className="absolute rounded-full blur-2xl opacity-20 pointer-events-none"
        style={{
          width: pixelSize * 1.5,
          height: pixelSize * 1.5,
          backgroundColor: moodCfg.color,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Pet container */}
      <motion.div
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: pixelSize,
          height: pixelSize,
          background: `radial-gradient(circle, ${speciesCfg.colors[0]}30, ${speciesCfg.colors[1]}15)`,
          border: `2px solid ${speciesCfg.colors[0]}40`,
        }}
        animate={
          animate && !pet.isSleeping
            ? {
                y: [0, -4, 0, -2, 0],
                scale: [1, 1.02, 1, 1.01, 1],
              }
            : animate && pet.isSleeping
              ? { scale: [1, 1.01, 1], opacity: [0.8, 0.9, 0.8] }
              : undefined
        }
        transition={
          animate && !pet.isSleeping
            ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        {/* Sleep indicator */}
        {pet.isSleeping && (
          <motion.div
            className="absolute -top-1 -right-1 z-10"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Moon className="w-4 h-4 text-indigo-400" fill="#818CF8" />
          </motion.div>
        )}

        {/* Pet emoji */}
        <span
          className="select-none"
          style={{ fontSize: `${pixelSize * 0.5}px` }}
        >
          {pet.stage === 'egg' ? '🥚' : speciesCfg.emoji}
        </span>

        {/* Mood indicator dot */}
        <div
          className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900"
          style={{ backgroundColor: moodCfg.color }}
        />
      </motion.div>

      {/* Name label */}
      <p className="mt-2 text-xs font-semibold text-white">{pet.name}</p>
      <p className="text-[10px] text-slate-500">
        {STAGE_LABELS[pet.stage]} · {moodCfg.emoji} {moodCfg.label}
      </p>
    </motion.div>
  );
}
