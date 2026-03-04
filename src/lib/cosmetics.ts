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
