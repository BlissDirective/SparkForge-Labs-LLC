// proceduralConfig.ts — Master configuration for Procedural Environment Generation
// Defines seeded RNG, tier configs, and all 10 lab theme profiles.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LabThemeId =
  | 'digital-detection' | 'enchanted-lab' | 'neural-organic'
  | 'creative-studio' | 'mission-control' | 'courthouse'
  | 'lens-world' | 'library-archive' | 'workshop-forge' | 'quantum-frontier';

export type GameTier = 'standard' | 'fl-lite' | 'flagship';

export interface NoiseConfig {
  octaves: number;
  frequency: number;
  amplitude: number;
  lacunarity: number;
  persistence: number;
  warpStrength: number;
}

export interface SkyConfig {
  topColor: string;
  horizonColor: string;
  starDensity: number;
  auroraEnabled: boolean;
  auroraColor: string;
  nebulaOpacity: number;
}

export interface FogConfig {
  behavior: 'drift' | 'sparkle' | 'swirl' | 'pulse' | 'rise';
  particleScale: number;
  speed: number;
  opacity: number;
  spread: number;
}

export interface PropDefinition {
  type: 'crystal' | 'cube' | 'sphere' | 'torus' | 'cone' | 'octahedron' | 'tetrahedron' | 'cylinder' | 'ring' | 'icosahedron';
  scale: [number, number, number];
  emissive: boolean;
  emissiveIntensity: number;
  metalness: number;
  roughness: number;
  color: string;
  floats: boolean;
  rotates: boolean;
  count: number;
}

export interface LabThemeProfile {
  id: LabThemeId;
  labId: number;
  labName: string;
  labColor: string;
  seed: number;
  noise: NoiseConfig;
  sky: SkyConfig;
  fog: FogConfig;
  props: PropDefinition[];
  terrainColor: string;
  terrainSecondaryColor: string;
  accentColor: string;
  ambientIntensity: number;
  gridFloor: boolean;
}

export interface TierConfig {
  segments: number;
  fogCount: number;
  propCountMultiplier: number;
  shadowMapSize: number;
  terrainSize: number;
  heightScale: number;
  skyRadius: number;
  skySegments: number;
}

// ---------------------------------------------------------------------------
// Seeded PRNG (Mulberry32)
// ---------------------------------------------------------------------------

export function createSeededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Tier Configs
// ---------------------------------------------------------------------------

export const TIER_CONFIGS: Record<GameTier, TierConfig> = {
  standard: {
    segments: 128,
    fogCount: 60,
    propCountMultiplier: 1,
    shadowMapSize: 512,
    terrainSize: 20,
    heightScale: 0.1,
    skyRadius: 80,
    skySegments: 24,
  },
  'fl-lite': {
    segments: 256,
    fogCount: 100,
    propCountMultiplier: 2.6,
    shadowMapSize: 1024,
    terrainSize: 30,
    heightScale: 0.15,
    skyRadius: 120,
    skySegments: 32,
  },
  flagship: {
    segments: 512,
    fogCount: 500,
    propCountMultiplier: 6.6,
    shadowMapSize: 2048,
    terrainSize: 40,
    heightScale: 0.3,
    skyRadius: 200,
    skySegments: 48,
  },
};

// ---------------------------------------------------------------------------
// Lab Theme Profiles
// ---------------------------------------------------------------------------

export const LAB_THEMES: Record<number, LabThemeProfile> = {
  1: {
    id: 'digital-detection',
    labId: 1,
    labName: 'Digital Detection',
    labColor: '#00BBFF',
    seed: 10271,
    noise: { octaves: 4, frequency: 3.2, amplitude: 0.08, lacunarity: 2.0, persistence: 0.5, warpStrength: 0.0 },
    sky: { topColor: '#060A14', horizonColor: '#0A1428', starDensity: 0.8, auroraEnabled: false, auroraColor: '#00BBFF', nebulaOpacity: 0.05 },
    fog: { behavior: 'drift', particleScale: 0.12, speed: 0.3, opacity: 0.25, spread: 18 },
    props: [
      { type: 'cube', scale: [0.3, 0.8, 0.15], emissive: true, emissiveIntensity: 0.6, metalness: 0.9, roughness: 0.1, color: 'lab', floats: true, rotates: false, count: 15 },
      { type: 'ring', scale: [0.5, 1.2, 0.2], emissive: true, emissiveIntensity: 0.4, metalness: 0.8, roughness: 0.2, color: '#00DDFF', floats: false, rotates: true, count: 10 },
    ],
    terrainColor: '#0B1018',
    terrainSecondaryColor: '#0E1520',
    accentColor: '#00DDFF',
    ambientIntensity: 0.35,
    gridFloor: true,
  },
  2: {
    id: 'enchanted-lab',
    labId: 2,
    labName: 'Enchanted Lab',
    labColor: '#AA66FF',
    seed: 20482,
    noise: { octaves: 5, frequency: 1.4, amplitude: 0.35, lacunarity: 2.2, persistence: 0.45, warpStrength: 0.15 },
    sky: { topColor: '#0A0618', horizonColor: '#14082A', starDensity: 0.5, auroraEnabled: true, auroraColor: '#AA66FF', nebulaOpacity: 0.2 },
    fog: { behavior: 'drift', particleScale: 0.18, speed: 0.2, opacity: 0.3, spread: 22 },
    props: [
      { type: 'crystal', scale: [0.4, 1.5, 0.3], emissive: true, emissiveIntensity: 0.8, metalness: 0.3, roughness: 0.4, color: 'lab', floats: false, rotates: false, count: 12 },
      { type: 'sphere', scale: [0.2, 0.6, 0.1], emissive: true, emissiveIntensity: 1.0, metalness: 0.1, roughness: 0.2, color: '#CC88FF', floats: true, rotates: false, count: 18 },
    ],
    terrainColor: '#0C0A16',
    terrainSecondaryColor: '#100E1E',
    accentColor: '#CC88FF',
    ambientIntensity: 0.3,
    gridFloor: false,
  },
  3: {
    id: 'neural-organic',
    labId: 3,
    labName: 'Neural Organic',
    labColor: '#FF66AA',
    seed: 30693,
    noise: { octaves: 6, frequency: 2.8, amplitude: 0.5, lacunarity: 2.4, persistence: 0.55, warpStrength: 0.6 },
    sky: { topColor: '#0A0612', horizonColor: '#18081A', starDensity: 0.3, auroraEnabled: false, auroraColor: '#FF66AA', nebulaOpacity: 0.45 },
    fog: { behavior: 'pulse', particleScale: 0.15, speed: 0.5, opacity: 0.35, spread: 16 },
    props: [
      { type: 'sphere', scale: [0.3, 1.0, 0.2], emissive: true, emissiveIntensity: 0.7, metalness: 0.2, roughness: 0.5, color: 'lab', floats: true, rotates: false, count: 14 },
      { type: 'torus', scale: [0.6, 1.4, 0.25], emissive: true, emissiveIntensity: 0.5, metalness: 0.4, roughness: 0.3, color: '#FF88CC', floats: false, rotates: true, count: 8 },
    ],
    terrainColor: '#0E0A12',
    terrainSecondaryColor: '#120C18',
    accentColor: '#FF88CC',
    ambientIntensity: 0.28,
    gridFloor: false,
  },
  4: {
    id: 'creative-studio',
    labId: 4,
    labName: 'Creative Studio',
    labColor: '#FFAA44',
    seed: 40814,
    noise: { octaves: 3, frequency: 0.6, amplitude: 0.12, lacunarity: 2.0, persistence: 0.4, warpStrength: 0.0 },
    sky: { topColor: '#0A0A08', horizonColor: '#1A1408', starDensity: 0.2, auroraEnabled: false, auroraColor: '#FFAA44', nebulaOpacity: 0.1 },
    fog: { behavior: 'rise', particleScale: 0.2, speed: 0.15, opacity: 0.2, spread: 20 },
    props: [
      { type: 'cube', scale: [0.5, 1.2, 0.3], emissive: false, emissiveIntensity: 0.0, metalness: 0.1, roughness: 0.8, color: '#FFCC66', floats: true, rotates: false, count: 10 },
      { type: 'icosahedron', scale: [0.2, 0.5, 0.1], emissive: true, emissiveIntensity: 0.9, metalness: 0.0, roughness: 0.6, color: 'lab', floats: true, rotates: true, count: 16 },
    ],
    terrainColor: '#0E0C0A',
    terrainSecondaryColor: '#141008',
    accentColor: '#FFCC66',
    ambientIntensity: 0.4,
    gridFloor: true,
  },
  5: {
    id: 'mission-control',
    labId: 5,
    labName: 'Mission Control',
    labColor: '#00FF88',
    seed: 51025,
    noise: { octaves: 4, frequency: 1.6, amplitude: 0.3, lacunarity: 2.0, persistence: 0.5, warpStrength: 0.05 },
    sky: { topColor: '#060E0A', horizonColor: '#0A1810', starDensity: 0.7, auroraEnabled: false, auroraColor: '#00FF88', nebulaOpacity: 0.08 },
    fog: { behavior: 'drift', particleScale: 0.1, speed: 0.25, opacity: 0.22, spread: 24 },
    props: [
      { type: 'cylinder', scale: [0.3, 1.0, 0.15], emissive: true, emissiveIntensity: 0.6, metalness: 0.85, roughness: 0.15, color: 'lab', floats: true, rotates: false, count: 12 },
      { type: 'ring', scale: [0.8, 1.6, 0.2], emissive: true, emissiveIntensity: 0.4, metalness: 0.9, roughness: 0.1, color: '#44FFAA', floats: false, rotates: true, count: 8 },
    ],
    terrainColor: '#0A0E10',
    terrainSecondaryColor: '#0C1214',
    accentColor: '#44FFAA',
    ambientIntensity: 0.32,
    gridFloor: true,
  },
  6: {
    id: 'courthouse',
    labId: 6,
    labName: 'Courthouse',
    labColor: '#FF6644',
    seed: 61236,
    noise: { octaves: 3, frequency: 0.8, amplitude: 0.55, lacunarity: 1.8, persistence: 0.35, warpStrength: 0.0 },
    sky: { topColor: '#0C0806', horizonColor: '#1A100A', starDensity: 0.15, auroraEnabled: false, auroraColor: '#FF6644', nebulaOpacity: 0.15 },
    fog: { behavior: 'swirl', particleScale: 0.16, speed: 0.35, opacity: 0.28, spread: 18 },
    props: [
      { type: 'torus', scale: [0.6, 1.2, 0.2], emissive: true, emissiveIntensity: 0.5, metalness: 0.7, roughness: 0.3, color: 'lab', floats: false, rotates: true, count: 8 },
      { type: 'octahedron', scale: [0.4, 1.0, 0.2], emissive: true, emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.25, color: '#FF8866', floats: true, rotates: false, count: 10 },
    ],
    terrainColor: '#0E0A0A',
    terrainSecondaryColor: '#140E0C',
    accentColor: '#FF8866',
    ambientIntensity: 0.34,
    gridFloor: false,
  },
  7: {
    id: 'lens-world',
    labId: 7,
    labName: 'Lens World',
    labColor: '#06B6D4',
    seed: 71447,
    noise: { octaves: 4, frequency: 1.8, amplitude: 0.15, lacunarity: 2.1, persistence: 0.42, warpStrength: 0.1 },
    sky: { topColor: '#06101A', horizonColor: '#0A1A28', starDensity: 0.85, auroraEnabled: false, auroraColor: '#06B6D4', nebulaOpacity: 0.06 },
    fog: { behavior: 'sparkle', particleScale: 0.08, speed: 0.4, opacity: 0.2, spread: 26 },
    props: [
      { type: 'ring', scale: [0.6, 1.8, 0.3], emissive: true, emissiveIntensity: 0.7, metalness: 0.9, roughness: 0.1, color: 'lab', floats: false, rotates: true, count: 10 },
      { type: 'sphere', scale: [0.3, 0.8, 0.15], emissive: true, emissiveIntensity: 0.5, metalness: 0.95, roughness: 0.05, color: '#08D4F4', floats: true, rotates: false, count: 14 },
    ],
    terrainColor: '#080E14',
    terrainSecondaryColor: '#0A121A',
    accentColor: '#08D4F4',
    ambientIntensity: 0.3,
    gridFloor: true,
  },
  8: {
    id: 'library-archive',
    labId: 8,
    labName: 'Library Archive',
    labColor: '#818CF8',
    seed: 81658,
    noise: { octaves: 5, frequency: 2.4, amplitude: 0.28, lacunarity: 2.3, persistence: 0.48, warpStrength: 0.08 },
    sky: { topColor: '#08081A', horizonColor: '#0E0E28', starDensity: 0.4, auroraEnabled: false, auroraColor: '#818CF8', nebulaOpacity: 0.18 },
    fog: { behavior: 'drift', particleScale: 0.14, speed: 0.18, opacity: 0.22, spread: 20 },
    props: [
      { type: 'cube', scale: [0.25, 0.7, 0.1], emissive: false, emissiveIntensity: 0.0, metalness: 0.2, roughness: 0.7, color: '#9AA4FF', floats: true, rotates: false, count: 20 },
      { type: 'tetrahedron', scale: [0.15, 0.4, 0.08], emissive: true, emissiveIntensity: 0.5, metalness: 0.3, roughness: 0.5, color: 'lab', floats: true, rotates: true, count: 12 },
    ],
    terrainColor: '#0A0A14',
    terrainSecondaryColor: '#0E0E1A',
    accentColor: '#9AA4FF',
    ambientIntensity: 0.26,
    gridFloor: false,
  },
  9: {
    id: 'workshop-forge',
    labId: 9,
    labName: 'Workshop Forge',
    labColor: '#10B981',
    seed: 91869,
    noise: { octaves: 3, frequency: 0.9, amplitude: 0.32, lacunarity: 1.9, persistence: 0.4, warpStrength: 0.0 },
    sky: { topColor: '#060E08', horizonColor: '#0A1A0E', starDensity: 0.3, auroraEnabled: false, auroraColor: '#10B981', nebulaOpacity: 0.08 },
    fog: { behavior: 'rise', particleScale: 0.1, speed: 0.45, opacity: 0.32, spread: 16 },
    props: [
      { type: 'torus', scale: [0.5, 1.2, 0.2], emissive: true, emissiveIntensity: 0.6, metalness: 0.85, roughness: 0.2, color: 'lab', floats: false, rotates: true, count: 10 },
      { type: 'cube', scale: [0.3, 0.9, 0.15], emissive: true, emissiveIntensity: 0.4, metalness: 0.7, roughness: 0.3, color: '#22D9A0', floats: true, rotates: false, count: 14 },
    ],
    terrainColor: '#0A0E0C',
    terrainSecondaryColor: '#0C1210',
    accentColor: '#22D9A0',
    ambientIntensity: 0.36,
    gridFloor: true,
  },
  10: {
    id: 'quantum-frontier',
    labId: 10,
    labName: 'Quantum Frontier',
    labColor: '#D946EF',
    seed: 102070,
    noise: { octaves: 6, frequency: 2.0, amplitude: 0.6, lacunarity: 2.5, persistence: 0.52, warpStrength: 0.7 },
    sky: { topColor: '#08041A', horizonColor: '#140828', starDensity: 0.9, auroraEnabled: true, auroraColor: '#D946EF', nebulaOpacity: 0.3 },
    fog: { behavior: 'swirl', particleScale: 0.18, speed: 0.5, opacity: 0.35, spread: 22 },
    props: [
      { type: 'torus', scale: [0.5, 1.6, 0.3], emissive: true, emissiveIntensity: 0.9, metalness: 0.5, roughness: 0.2, color: 'lab', floats: false, rotates: true, count: 8 },
      { type: 'icosahedron', scale: [0.2, 0.7, 0.15], emissive: true, emissiveIntensity: 1.0, metalness: 0.3, roughness: 0.15, color: '#EE66FF', floats: true, rotates: true, count: 14 },
    ],
    terrainColor: '#0C0816',
    terrainSecondaryColor: '#100A1E',
    accentColor: '#EE66FF',
    ambientIntensity: 0.28,
    gridFloor: false,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getLabTheme(labId: number): LabThemeProfile {
  return LAB_THEMES[labId] ?? LAB_THEMES[1];
}

export function getTierConfig(tier: GameTier): TierConfig {
  return TIER_CONFIGS[tier];
}
