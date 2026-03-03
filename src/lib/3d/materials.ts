// ================================================================
// SparkForge PBR Material Presets
// ================================================================
// Decision 7.1: Custom Frost-Prismatic HDR
// Decision 7.2: All 5 rarity pedestal tiers
// Decision 7.3: PBR desktop, CSS mobile
// Decision 7.5: MeshToonMaterial for Pet Trainer

import * as THREE from 'three';

// ■■ HDR Environment Map Path ■■
// Custom Frost-Prismatic HDR: dark studio, blue key, purple fill, teal rim
// Generated in Blender (1024x512 equirectangular)
// Lazy-loaded on first 3D scene render, then cached in GPU memory
export const FROST_PRISMATIC_HDR_PATH = '/hdri/frost-prismatic.hdr';

// ■■ Fallback: drei preset name ■■
// Used until custom HDR is generated — 'night' preset is closest match
export const HDR_FALLBACK_PRESET = 'night' as const;

// ■■ Material Preset Types ■■
export interface MaterialPreset {
  name: string;
  metalness: number;
  roughness: number;
  envMapIntensity: number;
  color?: string;
  emissive?: string;
  emissiveIntensity?: number;
  special?: string;
}

// ■■ 7 Material Presets ■■
export const MATERIAL_PRESETS: Record<string, MaterialPreset> = {
  StationChrome: {
    name: 'StationChrome',
    metalness: 1.0,
    roughness: 0.25,
    envMapIntensity: 1.5,
    color: '#c0c8d4',
    special: 'Frame bezel (desktop PBR)',
  },
  BrushedSteel: {
    name: 'BrushedSteel',
    metalness: 0.9,
    roughness: 0.4,
    envMapIntensity: 1.0,
    color: '#a8b0b8',
    special: 'Uncommon badge pedestals — subtle normal map for brush marks',
  },
  BrushedGold: {
    name: 'BrushedGold',
    metalness: 1.0,
    roughness: 0.3,
    envMapIntensity: 1.2,
    color: '#d4a843',
    special: 'Rare badge pedestals — gold tint + envMap',
  },
  MirrorChrome: {
    name: 'MirrorChrome',
    metalness: 1.0,
    roughness: 0.05,
    envMapIntensity: 2.0,
    color: '#e8eef4',
    special: 'Epic badge pedestals — high reflectivity',
  },
  CrystalGlass: {
    name: 'CrystalGlass',
    metalness: 0.0,
    roughness: 0.1,
    envMapIntensity: 1.0,
    color: '#ffffff',
    special: 'Legendary pedestals + hero crystal — MeshTransmissionMaterial',
  },
  CartoonMatte: {
    name: 'CartoonMatte',
    metalness: 0.0,
    roughness: 0.9,
    envMapIntensity: 0.0,
    color: '#ffffff',
    special: 'Pet Trainer creature — MeshToonMaterial, 3-step gradientMap',
  },
  EmissiveGlow: {
    name: 'EmissiveGlow',
    metalness: 0.0,
    roughness: 0.5,
    envMapIntensity: 0.0,
    color: '#000000',
    emissive: '#00BBFF',
    emissiveIntensity: 2.0,
    special: 'LED rim + active indicators',
  },
};

// ■■ Helper: Create MeshPhysicalMaterial from preset ■■
export function createPhysicalMaterial(
  presetName: keyof typeof MATERIAL_PRESETS,
  envMap?: THREE.Texture | null
): THREE.MeshPhysicalMaterial {
  const preset = MATERIAL_PRESETS[presetName];
  if (!preset) throw new Error(`Unknown material preset: ${presetName}`);

  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(preset.color || '#ffffff'),
    metalness: preset.metalness,
    roughness: preset.roughness,
    envMap: envMap || null,
    envMapIntensity: preset.envMapIntensity,
    emissive: preset.emissive ? new THREE.Color(preset.emissive) : undefined,
    emissiveIntensity: preset.emissiveIntensity || 0,
  });
}

// ■■ Helper: Create 3-step toon gradient map ■■
// Decision 7.5: MeshToonMaterial with 3-step gradient
export function createToonGradientMap(): THREE.DataTexture {
  const colors = new Uint8Array(3);
  colors[0] = 80;  // Shadow band
  colors[1] = 160; // Mid band
  colors[2] = 255; // Light band

  const gradientMap = new THREE.DataTexture(colors, 3, 1, THREE.RedFormat);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.needsUpdate = true;
  return gradientMap;
}

// ■■ Helper: Create emissive material for LED rim ■■
export function createLEDMaterial(
  color: string,
  _intensity: number = 2.0
): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.9,
    toneMapped: false,
  });
}
