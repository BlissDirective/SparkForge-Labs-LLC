'use client';

// UX-ENH-006 (Max): Inline contextual hint bubble
//
// Small HTML overlay rendered when guideStore.hintVisible is true.
// Auto-dismisses at hintExpiresAt. Click the bubble or the X to
// dismiss manually; clicking opens the full chat panel so the child
// can follow up without losing the thread.

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { useGuideStore } from '@/stores/guideStore';

export default function GuideHintBubble() {
  const hintVisible = useGuideStore((s) => s.hintVisible);
  const hintText = useGuideStore((s) => s.hintText);
  const hintAnchor = useGuideStore((s) => s.hintAnchor);
  const hintExpiresAt = useGuideStore((s) => s.hintExpiresAt);
  const context = useGuideStore((s) => s.context);
  const labId = useGuideStore((s) => s.labId);
  const gameId = useGuideStore((s) => s.gameId);
  const dismissHint = useGuideStore((s) => s.dismissHint);
  const show = useGuideStore((s) => s.show);

  // Auto-dismiss timer
  useEffect(() => {
    if (!hintVisible || !hintExpiresAt) return;
    const remaining = hintExpiresAt - Date.now();
    if (remaining <= 0) {
      dismissHint();
      return;
    }
    const t = setTimeout(() => dismissHint(), remaining);
    return () => clearTimeout(t);
  }, [hintVisible, hintExpiresAt, dismissHint]);

  // Position — anchor to the avatar corner (bottom-right) by default.
  const anchorClasses =
    hintAnchor === 'top-center'
      ? 'top-20 left-1/2 -translate-x-1/2'
      : hintAnchor === 'bottom-center'
        ? 'bottom-24 left-1/2 -translate-x-1/2'
        : 'bottom-20 right-6 md:right-24';

  const hintKey = `${context}:${labId ?? ''}:${gameId ?? ''}`;

  return (
    <AnimatePresence>
      {hintVisible && hintText && (
        <motion.div
          role="status"
          aria-live="polite"
          className={`fixed ${anchorClasses} z-40 max-w-xs pointer-events-auto`}
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        >
          <button
            type="button"
            onClick={() => {
              show();
              dismissHint(hintKey);
            }}
            className="w-full text-left rounded-xl border border-cyan-400/30 bg-[#0c1425]/95 px-4 py-3 pr-9
                       shadow-[0_0_32px_rgba(34,211,238,0.15)] backdrop-blur
                       hover:bg-[#12182c]/95 focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-cyan-400/60"
            aria-label="Open Sparky for more help"
          >
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 mt-0.5 text-cyan-300 shrink-0" aria-hidden="true" />
              <p className="text-sm text-white/90 leading-snug">{hintText}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => dismissHint(hintKey)}
            className="absolute top-2 right-2 p-1 rounded-full text-white/60 hover:text-white/90
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label="Dismiss hint"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
