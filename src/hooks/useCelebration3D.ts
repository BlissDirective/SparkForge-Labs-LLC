// ════════════════════════════════════════════════════════════════
// useCelebration3D — 3D Celebration Orchestration Hook (Phase 4)
// ════════════════════════════════════════════════════════════════
// Orchestrates the full celebration sequence in the 3D cockpit:
//   1. Switch cockpit to 'celebration' mode (gold LEDs, bloom spike)
//   2. Trigger CeremonyFX (confetti, fireworks, trophy)
//   3. Show XP popup (XPPopup3D)
//   4. Show celebration detail panel (badge/level info)
//   5. Auto-dismiss and restore previous mode
//
// Replaces the HTML CelebrationOverlay flow with a fully 3D pipeline.
// Hooks into uiStore.triggerCelebration for backward compatibility.

import { useCallback, useEffect, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import type { CelebrationType } from '@/types';
import { useCockpitStore } from '@/stores/cockpitStore';
import type { CockpitMode } from '@/lib/3d/cockpitModePresets';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { useXPPopup3DStore } from '@/components/3d/XPPopup3D';
import { CELEBRATION_TIERS, type CelebrationTier } from '@/lib/3d/cockpitDesignTokens';

// ═══════════════════════════════════════════════════════════════
// CELEBRATION TYPE → TIER MAPPING
// ═══════════════════════════════════════════════════════════════

const CELEBRATION_TIER_MAP: Record<CelebrationType, CelebrationTier> = {
  xp: 'minor',
  badge: 'major',
  level: 'epic',
  streak: 'minor',
  confetti: 'major',
};

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

export function useCelebration3D() {
  const showCelebration = useUIStore((s) => s.showCelebration);
  const celebrationType = useUIStore((s) => s.celebrationType);
  const celebrationData = useUIStore((s) => s.celebrationData);
  const dismissCelebration = useUIStore((s) => s.dismissCelebration);

  const setMode = useCockpitStore((s) => s.setActiveMode);
  const previousModeRef = useRef<string>('dashboard');
  const activeMode = useCockpitStore((s) => s.activeMode);

  const setCenterContent = useCockpitStore((s) => s.setCenterContent);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  const showXP = useXPPopup3DStore((s) => s.showXP);

  const isActiveRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Watch for celebration triggers
  useEffect(() => {
    if (!showCelebration || !celebrationType) return;
    if (isActiveRef.current) return; // Already celebrating

    isActiveRef.current = true;
    const tier = CELEBRATION_TIER_MAP[celebrationType] || 'minor';
    const config = CELEBRATION_TIERS[tier];

    // 1. Save current mode for restoration
    previousModeRef.current = activeMode;

    // 2. Switch to celebration mode (gold LEDs, bloom spike)
    if (tier !== 'minor') {
      setMode('celebration');
    }

    // 3. Show XP popup for XP celebrations
    if (celebrationType === 'xp' && celebrationData) {
      const xpAmount = typeof celebrationData === 'object' && 'amount' in celebrationData
        ? (celebrationData as { amount: number }).amount
        : typeof celebrationData === 'number'
          ? celebrationData
          : 0;
      if (xpAmount > 0) {
        showXP(xpAmount, {
          combo: typeof celebrationData === 'object' && 'combo' in celebrationData
            ? (celebrationData as { combo?: number }).combo
            : undefined,
        });
      }
    }

    // 4. Show celebration panel in center viewport for major/epic
    if (tier === 'major' || tier === 'epic') {
      setCenterContent('celebration', {
        celebrationType,
        celebrationData,
        tier,
      });
    }

    // 5. Broadcast celebration-start for LED/HUD/StatusBar reactions
    broadcast({
      type: 'celebration-start',
      source: `celebration-${celebrationType}`,
      color: '#FFD700',
      label: celebrationType,
    });

    // 6. Auto-dismiss after tier duration
    timerRef.current = setTimeout(() => {
      // Restore previous mode
      if (tier !== 'minor') {
        setMode(previousModeRef.current as CockpitMode);
      }

      // Restore previous center content
      if (tier === 'major' || tier === 'epic') {
        // Map previous mode back to center content
        const prevContent = previousModeRef.current === 'labs' ? 'labs'
          : previousModeRef.current === 'profile' ? 'profile'
          : previousModeRef.current === 'settings' ? 'settings'
          : previousModeRef.current === 'parent' ? 'parent'
          : 'home';
        setCenterContent(prevContent);
      }

      // Broadcast celebration-end
      broadcast({
        type: 'celebration-end',
        source: `celebration-${celebrationType}`,
        color: '#FFD700',
      });

      // Dismiss from uiStore
      dismissCelebration();
      isActiveRef.current = false;
    }, config.durationMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [showCelebration, celebrationType, celebrationData, activeMode, setMode, setCenterContent, broadcast, showXP, dismissCelebration]);

  // Manual trigger for programmatic use
  const triggerCelebration3D = useCallback((
    type: CelebrationType,
    data?: Record<string, unknown>,
  ) => {
    const triggerCelebration = useUIStore.getState().triggerCelebration;
    triggerCelebration(type, data);
  }, []);

  return { triggerCelebration3D };
}
