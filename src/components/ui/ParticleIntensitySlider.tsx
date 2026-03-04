'use client';

// ================================================================
// SparkForge ParticleIntensitySlider — Particle Preference Control
// ================================================================
// Decision 5.5: Low/Medium/High/Off, default Medium
// Persists to uiStore. Affects all particle systems.
// Rendered in Profile page settings section.
//
// FIX APPLIED: Removed raw TypeScript code that leaked outside the
// component at the bottom of the file (uiStore instructions were
// not properly commented — they appeared as executable code).
//
// FIX APPLIED: Replaced unsafe `as Record<...>` casts with properly
// typed uiStore selectors after store update.

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Flame, Wind, X } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

type IntensityLevel = 'off' | 'low' | 'medium' | 'high';

const LEVELS: {
  value: IntensityLevel;
  label: string;
  icon: typeof Sparkles;
  color: string;
  description: string;
}[] = [
  {
    value: 'off',
    label: 'Off',
    icon: X,
    color: '#64748B',
    description: 'No particles',
  },
  {
    value: 'low',
    label: 'Low',
    icon: Wind,
    color: '#3B82F6',
    description: 'Subtle ambient',
  },
  {
    value: 'medium',
    label: 'Medium',
    icon: Sparkles,
    color: '#8B5CF6',
    description: 'Balanced (default)',
  },
  {
    value: 'high',
    label: 'High',
    icon: Flame,
    color: '#F59E0B',
    description: 'Full spectacle',
  },
];

interface ParticleIntensitySliderProps {
  className?: string;
}

export function ParticleIntensitySlider({
  className,
}: ParticleIntensitySliderProps) {
  // Properly typed store access (particleIntensity added to uiStore in v3)
  const particleIntensity = useUIStore((s) => s.particleIntensity);
  const setParticleIntensity = useUIStore((s) => s.setParticleIntensity);

  const handleSelect = useCallback(
    (level: IntensityLevel) => {
      setParticleIntensity(level);
    },
    [setParticleIntensity]
  );

  const activeIndex = LEVELS.findIndex((l) => l.value === particleIntensity);

  return (
    <div className={`space-y-3 ${className || ''}`}>
      <label className="font-display text-sm font-medium text-white/70">
        Particle Effects
      </label>

      <div
        className="flex gap-2"
        role="radiogroup"
        aria-label="Particle intensity level"
      >
        {LEVELS.map((level) => {
          const Icon = level.icon;
          const isActive = particleIntensity === level.value;

          return (
            <button
              key={level.value}
              role="radio"
              aria-checked={isActive}
              aria-label={`${level.label}: ${level.description}`}
              onClick={() => handleSelect(level.value)}
              className={`
                relative flex-1 flex flex-col items-center gap-1.5
                px-3 py-2.5 rounded-xl border transition-all
                duration-200 cursor-pointer
                ${
                  isActive
                    ? 'border-white/30 bg-white/10'
                    : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                }
              `}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="particle-intensity-active"
                  className="absolute inset-0 rounded-xl border-2"
                  style={{ borderColor: level.color }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                />
              )}

              <Icon
                className="w-4 h-4 transition-colors"
                style={{ color: isActive ? level.color : '#64748B' }}
              />

              <span
                className="font-data text-[10px] font-medium transition-colors"
                style={{ color: isActive ? level.color : '#94A3B8' }}
              >
                {level.label}
              </span>

              {/* Particle preview dots */}
              {level.value !== 'off' && isActive && (
                <div className="flex gap-0.5">
                  {Array.from({
                    length: LEVELS.findIndex((l) => l.value === level.value),
                  }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: level.color }}
                      animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.8, 1.2, 0.8],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Current description */}
      <p className="font-body text-[10px] text-white/30 text-center">
        {LEVELS[activeIndex]?.description || 'Balanced (default)'}
      </p>
    </div>
  );
}

export default ParticleIntensitySlider;
