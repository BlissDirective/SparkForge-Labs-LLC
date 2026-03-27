// ════════════════════════════════════════════════════
// ceremonyMapping — Maps CelebrationType → CeremonyFX type
// ════════════════════════════════════════════════════
// Resolves the type mismatch (S5-WARN-001) between uiStore's
// CelebrationType and CeremonyFX's ceremony type union.
//
// CelebrationType (uiStore): 'xp' | 'badge' | 'level' | 'streak' | 'confetti'
// CeremonyFXType:            'levelUp' | 'badgeEarn' | 'labComplete' | 'streakMilestone'

import type { CelebrationType } from '@/types';
import type { CeremonyFXProps } from '@/components/3d/CeremonyFX';

export type CeremonyFXType = CeremonyFXProps['type'];

/**
 * Maps a CelebrationType from uiStore to the corresponding CeremonyFX type.
 * Returns null if the celebration type has no 3D ceremony (e.g., 'xp' uses 2D toast only).
 */
const CELEBRATION_TO_CEREMONY: Record<CelebrationType, CeremonyFXType | null> = {
  xp: null,                  // XP uses 2D toast only — no 3D ceremony
  badge: 'badgeEarn',        // Badge earned → firework bursts + trophy
  level: 'levelUp',          // Level up → confetti burst + HUD rings + trophy
  streak: 'streakMilestone', // Streak milestone → particle shower + HUD rings
  confetti: 'labComplete',   // Generic celebration → confetti + fireworks + HUD rings
};

export function mapCelebrationToCeremony(
  type: CelebrationType | null
): CeremonyFXType | null {
  if (!type) return null;
  return CELEBRATION_TO_CEREMONY[type] ?? null;
}
