// ════════════════════════════════════════════════════
// CurrencyDisplay — Gem Counter & Wallet UI
// Shows gem balance with animations
// ════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gem, Gift, ChevronRight, Loader2, Sparkles } from 'lucide-react';

interface CurrencyDisplayProps {
  gems: number;
  canClaimDaily: boolean;
  dailyStreak: number;
  onClaimDaily: () => Promise<boolean>;
  onOpenShop?: () => void;
  compact?: boolean;
}

export function CurrencyDisplay({
  gems,
  canClaimDaily,
  dailyStreak,
  onClaimDaily,
  onOpenShop,
  compact = false,
}: CurrencyDisplayProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [showClaimSuccess, setShowClaimSuccess] = useState(false);
  const [addedGems, setAddedGems] = useState(0);

  const handleClaim = async () => {
    if (!canClaimDaily || isClaiming) return;
    setIsClaiming(true);
    const success = await onClaimDaily();
    if (success) {
      setAddedGems(5 + dailyStreak * 2); // Approximate reward
      setShowClaimSuccess(true);
      setTimeout(() => setShowClaimSuccess(false), 2000);
    }
    setIsClaiming(false);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* Daily reward button */}
        <AnimatePresence>
          {canClaimDaily && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClaim}
              disabled={isClaiming}
              className="relative w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500
                flex items-center justify-center shadow-lg shadow-orange-500/30
                disabled:opacity-60"
            >
              {isClaiming ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Gift className="w-4 h-4 text-white" />
              )}
              {/* Pulse ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-amber-400"
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Gem balance */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={onOpenShop}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
            bg-slate-800/80 border border-slate-700/50
            hover:border-amber-500/30 transition-all"
        >
          <Gem className="w-3.5 h-3.5 text-amber-400" />
          <AnimatePresence mode="popLayout">
            <motion.span
              key={gems}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-xs font-bold text-amber-300"
            >
              {gems.toLocaleString()}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-700/30 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
            <Gem className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Gems</h3>
            <p className="text-[10px] text-slate-400">Spend in the shop</p>
          </div>
        </div>
        {onOpenShop && (
          <button
            onClick={onOpenShop}
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Shop <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Balance */}
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          className="text-3xl font-bold text-amber-400"
          key={gems}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {gems.toLocaleString()}
        </motion.div>
        <Gem className="w-6 h-6 text-amber-400" />

        {/* Added animation */}
        <AnimatePresence>
          {showClaimSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: -20 }}
              exit={{ opacity: 0 }}
              className="absolute left-1/2 -translate-x-1/2 text-emerald-400 font-bold text-sm"
            >
              +{addedGems}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Daily reward */}
      {canClaimDaily ? (
        <motion.button
          onClick={handleClaim}
          disabled={isClaiming}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
            bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium
            hover:from-amber-400 hover:to-orange-400 transition-all
            disabled:opacity-60"
        >
          {isClaiming ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Gift className="w-4 h-4" />
              Claim Daily Reward
              <Sparkles className="w-4 h-4" />
            </>
          )}
        </motion.button>
      ) : (
        <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl
          bg-slate-800 text-slate-400 text-sm">
          <Gift className="w-4 h-4" />
          Daily reward claimed — come back tomorrow!
        </div>
      )}

      {/* Daily streak */}
      {dailyStreak > 0 && (
        <p className="mt-2 text-center text-xs text-amber-400/60">
          {dailyStreak}-day claim streak
        </p>
      )}
    </div>
  );
}
