'use client';

// ════════════════════════════════════════════════════════════════
// FREE PLAY BANNER — Band-A no-fail sandbox affordance (G4c)
// ════════════════════════════════════════════════════════════════
// Rebuild plan §II.6: "Band A gets score-free sandbox modes … not
// every game needs points." This is the honest, reusable banner the
// youngest cohort sees when a game drops into Free Play: every level
// is open to roam and there is no losing. Kids still earn XP/stars —
// they just can't be locked out or fail. Any bespoke (non-level)
// game can adopt the same banner to signal the same contract.
//
// Design: light-theme, lab-colored, lucide icons only (no emoji, so
// the no-emoji ratchet is untouched). Arbitrary sizing uses inline
// style, not [Npx] classes, to respect the spacing-tokens guard.

import { motion } from 'motion/react';
import { Sparkles, Heart } from 'lucide-react';

interface FreePlayBannerProps {
  /** Lab accent color so the banner matches the game it sits in. */
  color: string;
  /** Optional override for the headline (defaults to "Free Play"). */
  title?: string;
  /** Optional override for the sub-line. */
  subtitle?: string;
  className?: string;
}

/**
 * A friendly, low-pressure banner for band-A Free Play. Announces the
 * no-fail contract in kid-legible language and stays visually calm.
 */
export function FreePlayBanner({
  color,
  title = 'Free Play',
  subtitle = 'Hop into any level — there’s no losing here. Play just for fun!',
  className = '',
}: FreePlayBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 22 }}
      role="status"
      aria-label={`${title}. ${subtitle}`}
      className={`flex items-center gap-3 rounded-2xl p-3 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${color}18, ${color}0A)`,
        border: `1.5px solid ${color}40`,
      }}
    >
      <motion.div
        className="flex items-center justify-center rounded-xl"
        style={{
          width: 40,
          height: 40,
          background: `linear-gradient(135deg, ${color}30, ${color}12)`,
        }}
        animate={{ rotate: [0, -8, 8, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        <Sparkles style={{ width: 20, height: 20, color }} aria-hidden="true" />
      </motion.div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold" style={{ color: '#1A1D2B' }}>
            {title}
          </span>
          <Heart style={{ width: 13, height: 13, color }} aria-hidden="true" />
        </div>
        <p className="text-xs leading-snug" style={{ color: '#5A6078' }}>
          {subtitle}
        </p>
      </div>
    </motion.div>
  );
}

export default FreePlayBanner;
