# Stage 5 Part 1 — Gamification Engine, Cosmetics, Avatar, Sound, Daily Challenge

**Version:** v2 (corrected)
**Build Phase:** 8
**Prerequisites:** Stage 4 complete
**Validation:** `npm run build` PASS, `npx tsc --noEmit` PASS, `npm run lint` PASS

---

## Overview

This part creates the gamification engine, cosmetic shop data, avatar configuration, synthesized sound effects, and daily challenge system. These are all **client-side libraries and hooks** — no API routes or components in this part.

### Files Created / Modified

| # | File | Action | Lines | Purpose |
|---|------|--------|-------|---------|
| 1 | `src/lib/gamification.ts` | CREATE | 274 | XP, levels, streaks, flame tiers, rarity system |
| 2 | `src/lib/cosmetics.ts` | CREATE | 136 | 30 cosmetic items, 7 collections, utility functions |
| 3 | `src/lib/avatar.ts` | CREATE | 97 | Avatar config interface, skin/hair/eye/outfit options |
| 4 | `src/hooks/useSoundEffect.ts` | CREATE | 173 | Web Audio API synthesized sounds (10 events) |
| 5 | `src/lib/dailyChallenge.ts` | CREATE | 258 | 18 challenge templates, deterministic daily selection |
| 6 | `src/stores/uiStore.ts` | MODIFY | 47 | Added soundEnabled, dailyChallengeCompleted state |

---

## Code Review Fixes Applied

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | CRITICAL | `dailyChallenge.ts` imports nonexistent `LAB_NAMES` from `@/types` | Derive from `LABS` array: `Object.fromEntries(LABS.map(l => [l.id, l.title]))` |
| 2 | CRITICAL | `cosmetics.ts` — all 30 items corrupted by PDF encoding | Fully reconstructed with correct prices, rarities, Unicode-escaped emojis |
| 3 | CRITICAL | `gamification.ts` — `getStreakMessage` signature broken (split across lines) | Reconstructed with proper parameter list and return type |
| 4 | CRITICAL | `gamification.ts` — `FlameTier` union type truncated (missing 'diamond') | Completed: 7 tiers spark→candle→campfire→bonfire→inferno→bluecore→diamond |
| 5 | HIGH | `gamification.ts` — all emoji strings corrupted by PDF | Used Unicode escape sequences (`\uD83D\uDC8E` etc.) throughout |
| 6 | HIGH | `cosmetics.ts` — `getItemById` nested inside `getItemsByCategory` (broken scoping) | Made each a standalone exported function |
| 7 | HIGH | `cosmetics.ts` — `getCollectionProgress` return type truncated | Completed with `{ collection, owned, total, complete }[]` |
| 8 | HIGH | `cosmetics.ts` — `CosmeticItem.preview` not optional but no items provide it | Made `preview?: string` optional in interface |
| 9 | HIGH | `avatar.ts` — emoji fields corrupted | Used Unicode escape sequences for all emoji values |
| 10 | HIGH | `dailyChallenge.ts` — challenge template icons corrupted | Used Unicode escape sequences |
| 11 | MEDIUM | `useSoundEffect.ts` — `useUIStore.getState() as any` cast | Removed unnecessary cast; proper `soundEnabled` type after store update |
| 12 | MEDIUM | `dailyChallenge.ts` — `const` in switch without block scope | Used object destructuring instead of switch/case |
| 13 | LOW | `gamification.ts` — `Infinity` tier always returns level 51 | Documented as intentional ceiling for max-tier players |

---

## Step 1: Create `src/lib/gamification.ts`

```typescript
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
  if (count >= 365) return '\uD83D\uDC8E';
  if (count >= 100) return '\uD83D\uDD35';
  if (count >= 60) return '\uD83C\uDF0B';
  if (count >= 30) return '\uD83D\uDD25';
  if (count >= 14) return '\uD83C\uDFD5\uFE0F';
  if (count >= 7) return '\uD83D\uDD6F\uFE0F';
  if (count >= 3) return '\u2728';
  return '\u26A1';
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
```

---

## Step 2: Create `src/lib/cosmetics.ts`

```typescript
// ════════════════════════════════════════════════════
// COSMETIC SHOP DATA
// Avatar accessories and items purchasable with Spark Coins
// Purely cosmetic — no pay-to-win
//
// RARITY VISUAL TREATMENT IN SHOP:
// Common    → Flat on shelf, no effects
// Uncommon  → Faint border shimmer
// Rare      → Holographic sheen sweep, hovers 4px
// Epic      → Purple glow, orbiting particles, hovers 6px
// Legendary → Golden fire halo, slow rotation, hovers 8px, beam of light
// ════════════════════════════════════════════════════

export interface CosmeticItem {
  id: string;
  name: string;
  category: 'hat' | 'glasses' | 'background' | 'pet' | 'effect' | 'title';
  icon: string;
  price: number; // Spark Coins
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  worldTheme?: number; // Which lab it's themed after (for collections)
  preview?: string; // Description for the shop
  collection?: string; // Collection group (completing earns a secret badge)
}

export const COSMETIC_ITEMS: CosmeticItem[] = [
  // ═══ HATS ═══
  { id: 'hat-astronaut', name: 'Space Helmet', category: 'hat', icon: '\uD83E\uDE96', price: 50, rarity: 'common' },
  { id: 'hat-brain', name: 'Brain Cap', category: 'hat', icon: '\uD83E\uDDE0', price: 75, rarity: 'uncommon', worldTheme: 3 },
  { id: 'hat-wizard', name: 'AI Wizard Hat', category: 'hat', icon: '\uD83E\uDDD9', price: 100, rarity: 'uncommon' },
  { id: 'hat-crown', name: 'Data Crown', category: 'hat', icon: '\uD83D\uDC51', price: 200, rarity: 'rare' },
  { id: 'hat-robot', name: 'Robot Antenna', category: 'hat', icon: '\uD83E\uDD16', price: 150, rarity: 'rare', worldTheme: 5 },
  { id: 'hat-spark', name: 'Spark Crown', category: 'hat', icon: '\u26A1', price: 500, rarity: 'epic' },

  // ═══ GLASSES ═══
  { id: 'glasses-pixel', name: 'Pixel Shades', category: 'glasses', icon: '\uD83D\uDD76\uFE0F', price: 40, rarity: 'common', worldTheme: 7 },
  { id: 'glasses-science', name: 'Lab Goggles', category: 'glasses', icon: '\uD83E\uDD7D', price: 60, rarity: 'uncommon' },
  { id: 'glasses-vr', name: 'VR Headset', category: 'glasses', icon: '\uD83E\uDD7D', price: 150, rarity: 'rare', worldTheme: 10 },
  { id: 'glasses-star', name: 'Star Glasses', category: 'glasses', icon: '\u2B50', price: 120, rarity: 'uncommon' },

  // ═══ PETS ═══
  { id: 'pet-robot-dog', name: 'AI Puppy', category: 'pet', icon: '\uD83D\uDC15', price: 200, rarity: 'rare', worldTheme: 2 },
  { id: 'pet-cat', name: 'Code Cat', category: 'pet', icon: '\uD83D\uDC31', price: 200, rarity: 'rare', worldTheme: 9 },
  { id: 'pet-owl', name: 'Wisdom Owl', category: 'pet', icon: '\uD83E\uDD89', price: 250, rarity: 'rare', worldTheme: 6 },
  { id: 'pet-dragon', name: 'Data Dragon', category: 'pet', icon: '\uD83D\uDC09', price: 500, rarity: 'epic' },
  { id: 'pet-phoenix', name: 'Neural Phoenix', category: 'pet', icon: '\uD83E\uDD85', price: 1000, rarity: 'legendary', worldTheme: 3 },

  // ═══ BACKGROUNDS ═══
  { id: 'bg-nebula', name: 'Nebula Glow', category: 'background', icon: '\uD83C\uDF0C', price: 100, rarity: 'uncommon' },
  { id: 'bg-matrix', name: 'Data Stream', category: 'background', icon: '\uD83D\uDCBB', price: 100, rarity: 'uncommon', worldTheme: 9 },
  { id: 'bg-aurora', name: 'Aurora Field', category: 'background', icon: '\uD83C\uDF08', price: 150, rarity: 'rare' },
  { id: 'bg-circuit', name: 'Circuit Board', category: 'background', icon: '\u26A1', price: 80, rarity: 'common', worldTheme: 3 },
  { id: 'bg-sunset', name: 'AI Sunset', category: 'background', icon: '\uD83C\uDF05', price: 200, rarity: 'rare' },
  { id: 'bg-forge', name: 'The Forge', category: 'background', icon: '\uD83D\uDD25', price: 750, rarity: 'legendary' },

  // ═══ EFFECTS ═══
  { id: 'effect-sparkle', name: 'Sparkle Trail', category: 'effect', icon: '\u2728', price: 100, rarity: 'uncommon' },
  { id: 'effect-fire', name: 'Fire Aura', category: 'effect', icon: '\uD83D\uDD25', price: 150, rarity: 'rare' },
  { id: 'effect-electric', name: 'Electric Pulse', category: 'effect', icon: '\u26A1', price: 200, rarity: 'rare' },
  { id: 'effect-rainbow', name: 'Rainbow Glow', category: 'effect', icon: '\uD83C\uDF08', price: 300, rarity: 'epic' },

  // ═══ TITLES ═══
  { id: 'title-curious', name: '"The Curious"', category: 'title', icon: '\uD83D\uDD0D', price: 50, rarity: 'common' },
  { id: 'title-builder', name: '"The Builder"', category: 'title', icon: '\uD83D\uDD28', price: 75, rarity: 'uncommon', worldTheme: 9 },
  { id: 'title-detective', name: '"Bias Detective"', category: 'title', icon: '\uD83D\uDD0E', price: 100, rarity: 'uncommon', worldTheme: 6 },
  { id: 'title-dreamer', name: '"AI Dreamer"', category: 'title', icon: '\uD83D\uDCAD', price: 100, rarity: 'uncommon', worldTheme: 10 },
  { id: 'title-legend', name: '"Forge Legend"', category: 'title', icon: '\uD83C\uDFC6', price: 1500, rarity: 'legendary' },
];

// ═══ COLLECTIONS ═══
// Themed groups of items. Owning all items in a collection unlocks a secret badge.

export interface Collection {
  id: string;
  name: string;
  worldTheme: number;
  icon: string;
  itemIds: string[];
  badgeReward: string; // Badge ID awarded on completion
}

export const COLLECTIONS: Collection[] = [
  {
    id: 'neural', name: 'Neural Network Collection', worldTheme: 3, icon: '\uD83E\uDDE0',
    itemIds: ['hat-brain', 'bg-circuit', 'pet-phoenix'],
    badgeReward: 'badge-collection-neural',
  },
  {
    id: 'agent', name: 'Agent Collection', worldTheme: 5, icon: '\uD83E\uDD16',
    itemIds: ['hat-robot'],
    badgeReward: 'badge-collection-agent',
  },
  {
    id: 'vision', name: 'Computer Vision Collection', worldTheme: 7, icon: '\uD83D\uDC41\uFE0F',
    itemIds: ['glasses-pixel'],
    badgeReward: 'badge-collection-vision',
  },
  {
    id: 'builder', name: 'Builder Collection', worldTheme: 9, icon: '\uD83D\uDD28',
    itemIds: ['pet-cat', 'bg-matrix', 'title-builder'],
    badgeReward: 'badge-collection-builder',
  },
  {
    id: 'ethics', name: 'Ethics Collection', worldTheme: 6, icon: '\u2696\uFE0F',
    itemIds: ['pet-owl', 'title-detective'],
    badgeReward: 'badge-collection-ethics',
  },
  {
    id: 'future', name: 'Future Collection', worldTheme: 10, icon: '\uD83D\uDD2E',
    itemIds: ['glasses-vr', 'title-dreamer'],
    badgeReward: 'badge-collection-future',
  },
  {
    id: 'trainer', name: 'Trainer Collection', worldTheme: 2, icon: '\uD83D\uDC15',
    itemIds: ['pet-robot-dog'],
    badgeReward: 'badge-collection-trainer',
  },
];

export function getItemsByCategory(category: CosmeticItem['category']): CosmeticItem[] {
  return COSMETIC_ITEMS.filter((i) => i.category === category);
}

export function getItemById(id: string): CosmeticItem | undefined {
  return COSMETIC_ITEMS.find((i) => i.id === id);
}

export function getCollectionProgress(ownedItemIds: string[]): { collection: Collection; owned: number; total: number; complete: boolean }[] {
  return COLLECTIONS.map((c) => ({
    collection: c,
    owned: c.itemIds.filter((id) => ownedItemIds.includes(id)).length,
    total: c.itemIds.length,
    complete: c.itemIds.every((id) => ownedItemIds.includes(id)),
  }));
}
```

---

## Step 3: Create `src/lib/avatar.ts`

```typescript
// ════════════════════════════════════════════════════
// AVATAR CONFIGURATION OPTIONS
// Face shapes, skin tones, hair styles, etc.
// Used by AvatarBuilder and AvatarDisplay components
// ════════════════════════════════════════════════════

export interface AvatarConfig {
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  faceShape: string;
  accessories: string[];
  outfit: string;
  background: string;
  pet?: string;
  ownedItems?: string[];
  equippedItems?: string[];
}

export const SKIN_TONES = [
  { id: 'tone-1', color: '#FDEBD0', label: 'Light' },
  { id: 'tone-2', color: '#FDBCB4', label: 'Light Warm' },
  { id: 'tone-3', color: '#E8B89D', label: 'Medium Light' },
  { id: 'tone-4', color: '#D4956B', label: 'Medium' },
  { id: 'tone-5', color: '#C68642', label: 'Medium Warm' },
  { id: 'tone-6', color: '#8D5524', label: 'Medium Dark' },
  { id: 'tone-7', color: '#6B3A20', label: 'Dark' },
  { id: 'tone-8', color: '#4A2511', label: 'Deep' },
];

export const FACE_SHAPES = [
  { id: 'round', label: 'Round', emoji: '\uD83D\uDE0A' },
  { id: 'oval', label: 'Oval', emoji: '\uD83D\uDE42' },
  { id: 'square', label: 'Square', emoji: '\uD83D\uDE10' },
  { id: 'heart', label: 'Heart', emoji: '\uD83D\uDC96' },
  { id: 'diamond', label: 'Diamond', emoji: '\uD83D\uDC8E' },
  { id: 'star', label: 'Star', emoji: '\u2B50' },
];

export const HAIR_STYLES = [
  { id: 'short', label: 'Short', emoji: '\uD83D\uDC87' },
  { id: 'medium', label: 'Medium', emoji: '\uD83D\uDC69' },
  { id: 'long', label: 'Long', emoji: '\uD83D\uDC69\u200D\uD83E\uDDB0' },
  { id: 'curly', label: 'Curly', emoji: '\uD83D\uDC69\u200D\uD83E\uDDB1' },
  { id: 'afro', label: 'Afro', emoji: '\uD83E\uDDD1\u200D\uD83E\uDDB1' },
  { id: 'braids', label: 'Braids', emoji: '\uD83D\uDC67' },
  { id: 'mohawk', label: 'Mohawk', emoji: '\uD83E\uDDD1\u200D\uD83C\uDFA4' },
  { id: 'ponytail', label: 'Ponytail', emoji: '\uD83D\uDC71\u200D\u2640\uFE0F' },
  { id: 'bun', label: 'Bun', emoji: '\uD83D\uDC69' },
  { id: 'spiky', label: 'Spiky', emoji: '\uD83E\uDD94' },
  { id: 'wavy', label: 'Wavy', emoji: '\uD83C\uDF0A' },
  { id: 'bald', label: 'None', emoji: '\uD83E\uDDD1\u200D\uD83E\uDDB2' },
];

export const HAIR_COLORS = [
  { id: 'black', color: '#1A1A2E', label: 'Black' },
  { id: 'brown', color: '#3B2F2F', label: 'Brown' },
  { id: 'blonde', color: '#E6C88C', label: 'Blonde' },
  { id: 'red', color: '#A0522D', label: 'Auburn' },
  { id: 'ginger', color: '#D4652F', label: 'Ginger' },
  { id: 'purple', color: '#8B5CF6', label: 'Purple' },
  { id: 'blue', color: '#3B82F6', label: 'Blue' },
  { id: 'pink', color: '#EC4899', label: 'Pink' },
];

export const EYE_COLORS = [
  { id: 'brown', color: '#634E34', label: 'Brown' },
  { id: 'hazel', color: '#8E7618', label: 'Hazel' },
  { id: 'green', color: '#3D9970', label: 'Green' },
  { id: 'blue', color: '#4A90D9', label: 'Blue' },
  { id: 'gray', color: '#8E99A4', label: 'Gray' },
  { id: 'violet', color: '#8B5CF6', label: 'Violet' },
];

export const OUTFITS = [
  { id: 'astronaut', label: 'Astronaut', emoji: '\uD83E\uDDD1\u200D\uD83D\uDE80' },
  { id: 'scientist', label: 'Scientist', emoji: '\uD83E\uDDD1\u200D\uD83D\uDD2C' },
  { id: 'coder', label: 'Coder', emoji: '\uD83D\uDCBB' },
  { id: 'explorer', label: 'Explorer', emoji: '\uD83E\uDDED' },
  { id: 'artist', label: 'Artist', emoji: '\uD83C\uDFA8' },
  { id: 'robot', label: 'Robot Suit', emoji: '\uD83E\uDD16' },
];

export const DEFAULT_AVATAR: AvatarConfig = {
  skinTone: '#FDBCB4',
  hairStyle: 'short',
  hairColor: '#3B2F2F',
  eyeColor: '#634E34',
  faceShape: 'round',
  accessories: [],
  outfit: 'astronaut',
  background: 'stars',
  pet: undefined,
  ownedItems: [],
  equippedItems: [],
};
```

---

## Step 4: Create `src/hooks/useSoundEffect.ts`

```typescript
'use client';

// ════════════════════════════════════════════════════
// SPARKFORGE SOUND EFFECT HOOK
// Web Audio API synthesized sounds — no audio files needed
// Respects user mute preference + reduced-motion
// ════════════════════════════════════════════════════

import { useCallback, useRef, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

export type SoundEvent =
  | 'xp-gain'
  | 'combo-hit'
  | 'level-up'
  | 'tier-change'
  | 'badge-unlock'
  | 'streak-milestone'
  | 'purchase'
  | 'daily-complete'
  | 'shield-break'
  | 'welcome';

// Synthesize a tone with Web Audio API
function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3,
  delay: number = 0
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

// Sound definitions — each event triggers a unique synthesized pattern
function synthesize(ctx: AudioContext, event: SoundEvent): void {
  switch (event) {
    case 'xp-gain':
      // Quick ascending chirp
      playTone(ctx, 880, 0.1, 'sine', 0.2);
      playTone(ctx, 1100, 0.1, 'sine', 0.2, 0.05);
      break;

    case 'combo-hit':
      // Rapid triple blip
      playTone(ctx, 660, 0.08, 'square', 0.15);
      playTone(ctx, 880, 0.08, 'square', 0.15, 0.06);
      playTone(ctx, 1100, 0.08, 'square', 0.15, 0.12);
      break;

    case 'level-up':
      // Triumphant ascending arpeggio
      playTone(ctx, 523, 0.15, 'sine', 0.25);
      playTone(ctx, 659, 0.15, 'sine', 0.25, 0.1);
      playTone(ctx, 784, 0.15, 'sine', 0.25, 0.2);
      playTone(ctx, 1047, 0.25, 'sine', 0.3, 0.3);
      break;

    case 'tier-change':
      // Dramatic two-part fanfare
      playTone(ctx, 440, 0.2, 'sine', 0.3);
      playTone(ctx, 554, 0.2, 'sine', 0.3, 0.15);
      playTone(ctx, 659, 0.2, 'sine', 0.3, 0.3);
      playTone(ctx, 880, 0.4, 'triangle', 0.35, 0.45);
      break;

    case 'badge-unlock':
      // Sparkle cascade
      playTone(ctx, 1200, 0.12, 'sine', 0.2);
      playTone(ctx, 1500, 0.12, 'sine', 0.2, 0.08);
      playTone(ctx, 1800, 0.12, 'sine', 0.2, 0.16);
      playTone(ctx, 2400, 0.2, 'sine', 0.15, 0.24);
      break;

    case 'streak-milestone':
      // Fire crackle (noise-like with pitch bends)
      playTone(ctx, 300, 0.15, 'sawtooth', 0.15);
      playTone(ctx, 600, 0.1, 'square', 0.1, 0.1);
      playTone(ctx, 900, 0.2, 'sine', 0.25, 0.15);
      break;

    case 'purchase':
      // Cash register ding
      playTone(ctx, 1400, 0.08, 'sine', 0.25);
      playTone(ctx, 1800, 0.15, 'sine', 0.2, 0.08);
      break;

    case 'daily-complete':
      // Completion chime — warm descending
      playTone(ctx, 1047, 0.15, 'sine', 0.25);
      playTone(ctx, 784, 0.15, 'sine', 0.25, 0.12);
      playTone(ctx, 1047, 0.3, 'triangle', 0.2, 0.24);
      break;

    case 'shield-break':
      // Shattering glass effect
      playTone(ctx, 800, 0.1, 'sawtooth', 0.2);
      playTone(ctx, 400, 0.15, 'sawtooth', 0.15, 0.05);
      playTone(ctx, 200, 0.2, 'sawtooth', 0.1, 0.1);
      break;

    case 'welcome':
      // Warm greeting — soft ascending
      playTone(ctx, 440, 0.2, 'sine', 0.15);
      playTone(ctx, 554, 0.2, 'sine', 0.15, 0.15);
      playTone(ctx, 659, 0.3, 'sine', 0.2, 0.3);
      break;
  }
}

export function useSoundEffect() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Lazy-init AudioContext (must be triggered by user gesture)
  const getContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new AudioContext();
      } catch {
        return null;
      }
    }
    // Resume if suspended (autoplay policy)
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Close AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  const play = useCallback(
    (event: SoundEvent) => {
      // Check mute preference from store
      const { soundEnabled } = useUIStore.getState();
      if (!soundEnabled) return;

      // Respect reduced-motion preference
      if (typeof window !== 'undefined') {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;
      }

      const ctx = getContext();
      if (!ctx) return;

      synthesize(ctx, event);
    },
    [getContext]
  );

  return { play };
}
```

---

## Step 5: Create `src/lib/dailyChallenge.ts`

```typescript
// ════════════════════════════════════════════════════
// SPARKFORGE DAILY CHALLENGE SYSTEM
// Deterministic date-seeded challenge selection
// Resets at midnight UTC
// ════════════════════════════════════════════════════

import { LABS } from '@/types';

// Derive lab names from LABS array (LAB_NAMES not exported from types)
const LAB_NAMES: Record<number, string> = Object.fromEntries(
  LABS.map((lab) => [lab.id, lab.title])
);

export type ChallengeType =
  | 'play-game'
  | 'complete-quiz'
  | 'read-lesson'
  | 'explore-lab'
  | 'earn-xp'
  | 'play-any';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: ChallengeType;
  targetLabId?: number;
  targetSlug?: string;
  xpReward: number;
  requirementCount: number;
}

// 18 challenge templates — deterministically selected by date
const CHALLENGE_TEMPLATES: Omit<DailyChallenge, 'id'>[] = [
  // Play-game challenges (6)
  {
    title: 'Game Explorer',
    description: 'Play any game to complete this challenge',
    icon: '\uD83C\uDFAE',
    type: 'play-any',
    xpReward: 30,
    requirementCount: 1,
  },
  {
    title: 'Double Play',
    description: 'Play any 2 games today',
    icon: '\uD83C\uDFB2',
    type: 'play-any',
    xpReward: 40,
    requirementCount: 2,
  },
  {
    title: 'Lab Visitor',
    description: 'Play a game from Lab {labId}',
    icon: '\uD83D\uDD2C',
    type: 'play-game',
    xpReward: 35,
    requirementCount: 1,
  },
  {
    title: 'Lab Hopper',
    description: 'Play games from 2 different labs',
    icon: '\uD83D\uDE80',
    type: 'play-any',
    xpReward: 45,
    requirementCount: 2,
  },
  {
    title: 'Triple Threat',
    description: 'Play any 3 games today',
    icon: '\u26A1',
    type: 'play-any',
    xpReward: 50,
    requirementCount: 3,
  },
  {
    title: 'Flagship Focus',
    description: 'Play a flagship game today',
    icon: '\u2B50',
    type: 'play-any',
    xpReward: 40,
    requirementCount: 1,
  },
  // Quiz challenges (3)
  {
    title: 'Quiz Whiz',
    description: 'Complete any quiz today',
    icon: '\u2753',
    type: 'complete-quiz',
    xpReward: 30,
    requirementCount: 1,
  },
  {
    title: 'Double Quiz',
    description: 'Complete 2 quizzes today',
    icon: '\uD83E\uDDE0',
    type: 'complete-quiz',
    xpReward: 45,
    requirementCount: 2,
  },
  {
    title: 'Perfect Score',
    description: 'Score 100% on any quiz',
    icon: '\uD83C\uDFC6',
    type: 'complete-quiz',
    xpReward: 50,
    requirementCount: 1,
  },
  // Lesson challenges (3)
  {
    title: 'Lesson Learner',
    description: 'Read any lesson today',
    icon: '\uD83D\uDCDA',
    type: 'read-lesson',
    xpReward: 25,
    requirementCount: 1,
  },
  {
    title: 'Study Session',
    description: 'Read 2 lessons today',
    icon: '\uD83D\uDCD6',
    type: 'read-lesson',
    xpReward: 40,
    requirementCount: 2,
  },
  {
    title: 'Bookworm',
    description: 'Read 3 lessons today',
    icon: '\uD83D\uDC1B',
    type: 'read-lesson',
    xpReward: 50,
    requirementCount: 3,
  },
  // Explore challenges (3)
  {
    title: 'Lab Explorer',
    description: 'Visit Lab {labId} and try an activity',
    icon: '\uD83D\uDDFA\uFE0F',
    type: 'explore-lab',
    xpReward: 30,
    requirementCount: 1,
  },
  {
    title: 'World Tour',
    description: 'Visit 3 different labs today',
    icon: '\uD83C\uDF0D',
    type: 'explore-lab',
    xpReward: 45,
    requirementCount: 3,
  },
  {
    title: 'New Territory',
    description: 'Try a lab you haven\'t visited this week',
    icon: '\uD83C\uDF1F',
    type: 'explore-lab',
    xpReward: 40,
    requirementCount: 1,
  },
  // XP challenges (3)
  {
    title: 'XP Sprint',
    description: 'Earn 50 XP today',
    icon: '\uD83D\uDCAA',
    type: 'earn-xp',
    xpReward: 30,
    requirementCount: 50,
  },
  {
    title: 'XP Marathon',
    description: 'Earn 100 XP today',
    icon: '\uD83C\uDFC3',
    type: 'earn-xp',
    xpReward: 45,
    requirementCount: 100,
  },
  {
    title: 'XP Champion',
    description: 'Earn 200 XP today',
    icon: '\uD83E\uDD47',
    type: 'earn-xp',
    xpReward: 60,
    requirementCount: 200,
  },
];

// Deterministic hash from date string -> stable daily index
function dateSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const ch = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return Math.abs(hash);
}

// Get today's date string in UTC (YYYY-MM-DD)
function getTodayUTC(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Get today's challenge based on deterministic date seed
export function getTodaysChallenge(): DailyChallenge {
  const today = getTodayUTC();
  const seed = dateSeed(today);
  const templateIndex = seed % CHALLENGE_TEMPLATES.length;
  const template = { ...CHALLENGE_TEMPLATES[templateIndex] };

  // Assign a lab ID for lab-specific challenges
  const labSeed = dateSeed(today + '-lab');
  const labId = (labSeed % 10) + 1; // Labs 1-10

  if (template.description.includes('{labId}')) {
    template.targetLabId = labId;
    const labName = LAB_NAMES[labId] || `Lab ${labId}`;
    template.description = template.description.replace('{labId}', labName);
  }

  return {
    ...template,
    id: `daily-${today}`,
  };
}

// Check if a specific date's challenge is complete
export function isChallengeComplete(
  completedDate: string | null | undefined,
): boolean {
  if (!completedDate) return false;
  return completedDate === getTodayUTC();
}

// Get seconds until next daily reset (midnight UTC)
export function getSecondsUntilReset(): number {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0,
  ));
  return Math.max(0, Math.floor((tomorrow.getTime() - now.getTime()) / 1000));
}

// Format remaining time as "Xh Ym"
export function formatTimeRemaining(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return 'Less than a minute';
}
```

---

## Step 6: Update `src/stores/uiStore.ts`

Add `soundEnabled`, `dailyChallengeCompleted` state and their actions to the existing UIState interface and store.

**Changes to interface:**
```typescript
// ADD these to UIState interface:
soundEnabled: boolean;
dailyChallengeCompleted: boolean;
toggleSound: () => void;
markDailyChallengeComplete: () => void;
resetDailyChallenge: () => void;
```

**Changes to store implementation:**
```typescript
// ADD these to create<UIState>:
soundEnabled: true,
dailyChallengeCompleted: false,
toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
markDailyChallengeComplete: () => set({ dailyChallengeCompleted: true }),
resetDailyChallenge: () => set({ dailyChallengeCompleted: false }),
```

**Full updated file:**
```typescript
import { create } from 'zustand';
import type { CelebrationType } from '@/types';

interface UIState {
  sidebarOpen: boolean;
  showCelebration: boolean;
  celebrationType: CelebrationType | null;
  celebrationData: Record<string, unknown> | null;
  labColor: string;
  labTint: string;
  soundEnabled: boolean;
  dailyChallengeCompleted: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  triggerCelebration: (type: CelebrationType, data?: Record<string, unknown>) => void;
  dismissCelebration: () => void;
  setLabColor: (color: string, tint?: string) => void;
  toggleSound: () => void;
  markDailyChallengeComplete: () => void;
  resetDailyChallenge: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  showCelebration: false,
  celebrationType: null,
  celebrationData: null,
  labColor: '#00BBFF',
  labTint: '#00BBFF',
  soundEnabled: true,
  dailyChallengeCompleted: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  triggerCelebration: (type, data = {}) => set({ showCelebration: true, celebrationType: type, celebrationData: data }),
  dismissCelebration: () => set({ showCelebration: false, celebrationType: null, celebrationData: null }),
  setLabColor: (labColor, labTint) => {
    set({ labColor, labTint: labTint || labColor });
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--lab-color', labColor);
      document.documentElement.style.setProperty('--lab-glow', labColor + '40');
    }
  },
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  markDailyChallengeComplete: () => set({ dailyChallengeCompleted: true }),
  resetDailyChallenge: () => set({ dailyChallengeCompleted: false }),
}));
```

---

## Validation

```
npx tsc --noEmit     → PASS (0 errors)
npm run lint         → PASS (0 warnings)
npm run build        → PASS (all routes compile)
```
