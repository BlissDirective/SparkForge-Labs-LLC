// ════════════════════════════════════════════════════
// StreakFreezeCard — Streak Freeze Management UI
// Equip/unequip freezes with visual shield animation
// ════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldCheck, ShieldOff, Plus, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StreakFreezeCardProps {
  freezesAvailable: number;
  freezesEquipped: number;
  maxEquipped?: number;
  onEquip: () => Promise<boolean>;
  onUnequip: () => Promise<boolean>;
  onPurchase?: () => void;
}

export function StreakFreezeCard({
  freezesAvailable,
  freezesEquipped,
  maxEquipped = 2,
  onEquip,
  onUnequip,
  onPurchase,
}: StreakFreezeCardProps) {
  const [isEquipping, setIsEquipping] = useState(false);
  const [showTip, setShowTip] = useState(false);

  const canEquip = freezesAvailable > 0 && freezesEquipped < maxEquipped;
  const canUnequip = freezesEquipped > 0;
  const allEquipped = freezesEquipped >= maxEquipped;

  const handleEquip = async () => {
    if (!canEquip || isEquipping) return;
    setIsEquipping(true);
    await onEquip();
    setIsEquipping(false);
  };

  const handleUnequip = async () => {
    if (!canUnequip || isEquipping) return;
    setIsEquipping(true);
    await onUnequip();
    setIsEquipping(false);
  };

  return (
    <TooltipProvider>
      <div className="rounded-2xl bg-slate-900/60 border border-slate-700/30 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Streak Freezes</h3>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-slate-400 hover:text-white transition-colors">
                <Info className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">
                Freezes protect your streak if you miss a day.
                Equip them in advance — they auto-apply when needed.
                Max {maxEquipped} equipped at once.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Freeze slots */}
        <div className="flex items-center gap-3 mb-4">
          {Array.from({ length: maxEquipped }, (_, i) => {
            const isActive = i < freezesEquipped;
            const isAvailable = !isActive && i < freezesEquipped + freezesAvailable;

            return (
              <motion.div
                key={i}
                className={`
                  relative w-14 h-14 rounded-xl flex items-center justify-center
                  border-2 transition-all duration-300
                  ${isActive
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/20'
                    : isAvailable
                      ? 'bg-slate-800 border-slate-600 cursor-pointer hover:border-cyan-400/50'
                      : 'bg-slate-800/50 border-slate-700/30 opacity-50'
                  }
                `}
                whileHover={isAvailable && !isActive ? { scale: 1.1 } : {}}
                whileTap={isAvailable && !isActive ? { scale: 0.95 } : {}}
                onClick={isActive ? handleUnequip : isAvailable ? handleEquip : undefined}
              >
                <AnimatePresence mode="wait">
                  {isActive ? (
                    <motion.div
                      key="active"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                    >
                      <ShieldCheck className="w-7 h-7 text-cyan-400" />
                    </motion.div>
                  ) : isAvailable ? (
                    <motion.div
                      key="available"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Shield className="w-7 h-7 text-slate-500" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <ShieldOff className="w-7 h-7 text-slate-600" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pulse ring for equipped */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-cyan-400"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Status text */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {freezesEquipped > 0 ? (
              <span className="text-cyan-400">
                {freezesEquipped} freeze{freezesEquipped !== 1 ? 's' : ''} equipped
              </span>
            ) : (
              'No freezes equipped'
            )}
            {' · '}
            {freezesAvailable} in inventory
          </p>

          {allEquipped && freezesAvailable > 0 && (
            <span className="text-xs text-amber-400">Max equipped</span>
          )}
        </div>

        {/* Purchase button */}
        {freezesAvailable === 0 && onPurchase && (
          <motion.button
            onClick={onPurchase}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg
              bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-medium
              hover:from-cyan-500 hover:to-blue-500 transition-all"
          >
            <Plus className="w-4 h-4" />
            Get Freezes
          </motion.button>
        )}
      </div>
    </TooltipProvider>
  );
}
