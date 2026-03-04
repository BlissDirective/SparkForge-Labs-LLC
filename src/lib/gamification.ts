// ════════════════════════════════════════════════════
// GAMIFICATION ENGINE — Client-side XP, Level, Streak logic
// Used by hooks and components for instant UI updates
// before server confirmation.
// ════════════════════════════════════════════════════

import { LEVEL_THRESHOLDS, XP_REWARDS } from '@/types';

// ═══ LEVEL CALCULATION ═══

export interface LevelInfo {
  level: number;
  title: string;
  progress: number; // 0-1, progress within current level
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpInLevel: number;
  tierChanged?: boolean; // True if this level crosses into a new tier
}

export function calculateLevel(xp: number): LevelInfo {
  for (const tier of LEVEL_THRESHOLDS) {
    if (xp <= tier.max) {
      const tierRange = tier.max - tier.min;
      const levelsInTier = tier.level_range[1] - tier.level_range[0] + 1;
      const xpPerLevel = tierRange / levelsInTier;
      const xpInTier = xp - tier.min;
      const levelInTier = Math.floor(xpInTier / xpPerLevel);
      const level = tier.level_range[0] + levelInTier;
      const progress = (xpInTier % xpPerLevel) / xpPerLevel;
      const xpForCurrentLevel = tier.min + (levelInTier * xpPerLevel);
      const xpForNextLevel = xpForCurrentLevel + xpPerLevel;
      // Check if this is the first level in the tier
      const tierChanged = level === tier.level_range[0];

      return {
        level: Math.max(1, level),
        title: tier.title,
        progress,
        xpForCurrentLevel: Math.floor(xpForCurrentLevel),
        xpForNextLevel: Math.floor(xpForNextLevel),
        xpInLevel: Math.floor(xp - xpForCurrentLevel),
        tierChanged,
      };
    }
  }

  // Forge Master ceiling — max tier, no further progression
  return {
    level: 51, title: 'Forge Master', progress: 1,
    xpForCurrentLevel: 15001, xpForNextLevel: 99999, xpInLevel: 0,
    tierChanged: false,
  };
}

// Check if leveling from oldXP to newXP crosses a tier boundary
export function didTierChange(oldXP: number, newXP: number): boolean {
  const oldLevel = calculateLevel(oldXP);
  const newLevel = calculateLevel(newXP);
  return oldLevel.title !== newLevel.title;
}

// ═══ XP REWARD AMOUNTS ═══

export function getXPReward(source: keyof typeof XP_REWARDS): number {
  return XP_REWARDS[source] || 15;
}

// ═══ STREAK HELPERS ═══

export function getStreakMultiplier(streakCount: number): number {
  return streakCount >= 7 ? 2 : 1;
}

export function getStreakEmoji(count: number): string {
  if (count >= 365) return '💎';
  if (count >= 100) return '🔵';
  if (count >= 60) return '🌋';
  if (count >= 30) return '🔥';
  if (count >= 14) return '🏕️';
  if (count >= 7) return '🕯️';
  if (count >= 3) return '✨';
  return '⚡';
}

export function getStreakMessage(count: number, shieldUsed: boolean, recovered: boolean): string {
  if (shieldUsed) return "Streak Shield activated! You're still going strong!";
  if (recovered) return 'Welcome back! Your adventure continues!';
  if (count >= 100) return "LEGENDARY streak! You're unstoppable!";
  if (count >= 30) return "A whole month! You're an AI superstar!";
  if (count >= 14) return 'Two weeks strong! Keep it up!';
  if (count >= 7) return 'One week! You earned a Streak Shield!';
  if (count >= 3) return "Three days in a row! You're building momentum!";
  return 'Great start! Come back tomorrow to keep your streak!';
}

// ═══ STREAK FLAME TIERS ═══
// Determines the visual intensity of the streak flame animation.
// Each tier maps to a different flame component variant.

export type FlameTier = 'spark' | 'candle' | 'campfire' | 'bonfire' | 'inferno' | 'bluecore' | 'diamond';

export interface FlameConfig {
  tier: FlameTier;
  label: string;
  layers: number; // Number of overlapping flame gradient divs
  hasEmbers: boolean; // Rising ember particles
  hasOrbits: boolean; // Orbiting spark particles
  hasDistortion: boolean; // Heat shimmer effect above flame
  hasPrismatic: boolean; // Rainbow refractions (diamond only)
  coreColor: string; // Inner flame color
  outerColor: string; // Outer flame color
  glowColor: string; // Ambient glow beneath
  intensity: number; // 0-1 overall animation intensity
}

export function getFlameConfig(streakCount: number): FlameConfig {
  if (streakCount >= 100) return {
    tier: 'diamond', label: 'Diamond Fire',
    layers: 5, hasEmbers: true, hasOrbits: true, hasDistortion: true, hasPrismatic: true,
    coreColor: '#FFFFFF', outerColor: '#00BBFF',
    glowColor: 'rgba(0,187,255,0.4)', intensity: 1.0,
  };
  if (streakCount >= 30) return {
    tier: 'bluecore', label: 'Blue Core',
    layers: 4, hasEmbers: true, hasOrbits: true, hasDistortion: true, hasPrismatic: false,
    coreColor: '#00BBFF', outerColor: '#FF6644',
    glowColor: 'rgba(0,187,255,0.3)', intensity: 0.9,
  };
  if (streakCount >= 14) return {
    tier: 'inferno', label: 'Inferno',
    layers: 4, hasEmbers: true, hasOrbits: true, hasDistortion: false, hasPrismatic: false,
    coreColor: '#FFAA44', outerColor: '#FF6644',
    glowColor: 'rgba(255,170,68,0.3)', intensity: 0.8,
  };
  if (streakCount >= 7) return {
    tier: 'bonfire', label: 'Bonfire',
    layers: 3, hasEmbers: true, hasOrbits: false, hasDistortion: false, hasPrismatic: false,
    coreColor: '#FFD700', outerColor: '#FF8C00',
    glowColor: 'rgba(255,140,0,0.25)', intensity: 0.65,
  };
  if (streakCount >= 3) return {
    tier: 'campfire', label: 'Campfire',
    layers: 3, hasEmbers: false, hasOrbits: false, hasDistortion: false, hasPrismatic: false,
    coreColor: '#FFA500', outerColor: '#FF4500',
    glowColor: 'rgba(255,69,0,0.2)', intensity: 0.5,
  };
  if (streakCount >= 1) return {
    tier: 'candle', label: 'Candle',
    layers: 2, hasEmbers: false, hasOrbits: false, hasDistortion: false, hasPrismatic: false,
    coreColor: '#FFD700', outerColor: '#FFA500',
    glowColor: 'rgba(255,165,0,0.15)', intensity: 0.3,
  };
  return {
    tier: 'spark', label: 'Spark',
    layers: 1, hasEmbers: false, hasOrbits: false, hasDistortion: false, hasPrismatic: false,
    coreColor: '#64748B', outerColor: '#475569',
    glowColor: 'rgba(100,116,139,0.1)', intensity: 0.1,
  };
}

// ═══ LEVEL TIER COLORS ═══
// Each tier has a signature color used for UI theming.

export function getLevelColor(level: number): string {
  if (level >= 51) return '#D946EF'; // Forge Master — fuchsia
  if (level >= 41) return '#F59E0B'; // AI Architect — amber
  if (level >= 31) return '#8B5CF6'; // Machine Mentor — purple
  if (level >= 21) return '#3B82F6'; // Neural Navigator — blue
  if (level >= 16) return '#10B981'; // Algorithm Ace — green
  if (level >= 11) return '#06B6D4'; // Data Explorer — cyan
  if (level >= 6) return '#F97316'; // AI Apprentice — orange
  return '#64748B'; // Spark Starter — gray
}

export function getLevelTierName(level: number): string {
  if (level >= 51) return 'Forge Master';
  if (level >= 41) return 'AI Architect';
  if (level >= 31) return 'Machine Mentor';
  if (level >= 21) return 'Neural Navigator';
  if (level >= 16) return 'Algorithm Ace';
  if (level >= 11) return 'Data Explorer';
  if (level >= 6) return 'AI Apprentice';
  return 'Spark Starter';
}

// ═══ RARITY SYSTEM ═══
// Used for both badges and cosmetic shop items.

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'legendary': return '#F59E0B';
    case 'epic': return '#8B5CF6';
    case 'rare': return '#3B82F6';
    case 'uncommon': return '#10B981';
    default: return '#64748B';
  }
}

export function getRarityGlow(rarity: string): string {
  switch (rarity) {
    case 'legendary': return '0 0 20px #F59E0B40, 0 0 40px #F59E0B20';
    case 'epic': return '0 0 16px #8B5CF640, 0 0 32px #8B5CF620';
    case 'rare': return '0 0 12px #3B82F640';
    case 'uncommon': return '0 0 8px #10B98130';
    default: return 'none';
  }
}

export function getRarityLabel(rarity: string): string {
  switch (rarity) {
    case 'legendary': return '\u2605\u2605\u2605\u2605\u2605';
    case 'epic': return '\u2605\u2605\u2605\u2605';
    case 'rare': return '\u2605\u2605\u2605';
    case 'uncommon': return '\u2605\u2605';
    default: return '\u2605';
  }
}

// Rarity-based animation config for 3D badge/item display
export interface RarityVisualConfig {
  borderGradient: string;
  particleCount: number;
  hasOrbit: boolean;
  hasPulse: boolean;
  hasFireHalo: boolean;
  levitateHeight: number; // px above resting position
  rotateSpeed: number; // seconds per full Y rotation (0 = no rotation)
}

export function getRarityVisuals(rarity: string): RarityVisualConfig {
  switch (rarity) {
    case 'legendary': return {
      borderGradient: 'linear-gradient(135deg, #F59E0B, #FCD34D, #F59E0B)',
      particleCount: 8, hasOrbit: false, hasPulse: true, hasFireHalo: true,
      levitateHeight: 8, rotateSpeed: 12,
    };
    case 'epic': return {
      borderGradient: 'linear-gradient(135deg, #8B5CF6, #C084FC, #8B5CF6)',
      particleCount: 5, hasOrbit: true, hasPulse: true, hasFireHalo: false,
      levitateHeight: 6, rotateSpeed: 16,
    };
    case 'rare': return {
      borderGradient: 'linear-gradient(135deg, #3B82F6, #93C5FD, #3B82F6)',
      particleCount: 3, hasOrbit: false, hasPulse: true, hasFireHalo: false,
      levitateHeight: 4, rotateSpeed: 20,
    };
    case 'uncommon': return {
      borderGradient: 'linear-gradient(135deg, #10B981, #6EE7B7, #10B981)',
      particleCount: 0, hasOrbit: false, hasPulse: false, hasFireHalo: false,
      levitateHeight: 2, rotateSpeed: 0,
    };
    default: return {
      borderGradient: 'none',
      particleCount: 0, hasOrbit: false, hasPulse: false, hasFireHalo: false,
      levitateHeight: 0, rotateSpeed: 0,
    };
  }
}

// ═══ WELCOME BADGE ═══
// Awarded automatically on first login. Triggers cinematic reveal.
export const WELCOME_BADGE = {
  id: 'welcome-spark-ignited',
  name: 'Spark Ignited',
  description: 'Began your AI learning journey!',
  icon: '\u2728',
  category: 'secret' as const,
  rarity: 'uncommon' as const,
  criteria: 'Login for the first time',
};
