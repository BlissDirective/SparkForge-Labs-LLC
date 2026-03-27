// ════════════════════════════════════════════════════
// COCKPIT MATERIALS — Centralized Material Factory
// ════════════════════════════════════════════════════
// 3D-Embedded UI Enhancement: Materials matched to user's
// cockpit-architecture.json vision spec. All cockpit components
// should import materials from here for visual consistency.
//
// Reference: cockpit-architecture.json v1.2 globalMaterials

import {
  MeshStandardMaterial,
  MeshPhongMaterial,
  MeshBasicMaterial,
  AdditiveBlending,
  DoubleSide,
  Color,
} from 'three';

// ■■ Metallic Alloy Frame — chrome bezels, structural frames ■■
// Lighter chrome with blue undertone emissive
export function createAlloyFrameMaterial(labColor?: string) {
  return new MeshStandardMaterial({
    color: new Color('#a8b5c8'),
    metalness: 0.98,
    roughness: 0.12,
    emissive: new Color(labColor || '#223344'),
    emissiveIntensity: 0.5,
    envMapIntensity: 1.5,
  });
}

// ■■ Curved Control Panel — dark surfaces with cyan emissive glow ■■
// High shininess + specular for that wet-glass look
export function createControlPanelMaterial(labColor?: string) {
  return new MeshPhongMaterial({
    color: new Color('#0a1625'),
    shininess: 95,
    emissive: new Color(labColor || '#00bbff'),
    emissiveIntensity: 0.85,
    specular: new Color('#88eeff'),
  });
}

// ■■ Holographic Element — additive blending, high opacity ■■
// Used for HUD rings, holographic cards, data overlays
export function createHolographicMaterial(color?: string) {
  return new MeshBasicMaterial({
    color: new Color(color || '#00eeff'),
    transparent: true,
    opacity: 0.9,
    side: DoubleSide,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
}

// ■■ Lighted Button — high emissive for interactive controls ■■
// Bright glow that draws the eye to interactive elements
export function createButtonMaterial(color?: string, active = false) {
  return new MeshPhongMaterial({
    color: new Color(color || '#00ffcc'),
    emissive: new Color(color || '#00ffcc'),
    emissiveIntensity: active ? 2.5 : 1.8,
    shininess: 120,
  });
}

// ■■ Chrome Bezel — structural edge highlights ■■
export function createBezelMaterial() {
  return new MeshStandardMaterial({
    color: new Color('#c0cee0'),
    metalness: 0.95,
    roughness: 0.08,
    emissive: new Color('#1a2233'),
    emissiveIntensity: 0.3,
    envMapIntensity: 2.0,
  });
}

// ■■ Console Surface — dark matte for readability ■■
export function createConsoleSurfaceMaterial() {
  return new MeshStandardMaterial({
    color: new Color('#0d1018'),
    metalness: 0.4,
    roughness: 0.6,
    emissive: new Color('#001122'),
    emissiveIntensity: 0.15,
  });
}

// ■■ LED Emissive — ultra-bright for LED rim/indicators ■■
export function createLEDMaterial(color?: string) {
  return new MeshBasicMaterial({
    color: new Color(color || '#00eeff'),
    toneMapped: false,
  });
}

// ■■ Material Constants — referenced by all cockpit components ■■
export const COCKPIT_MATERIAL_COLORS = {
  alloyFrame: '#a8b5c8',
  panelSurface: '#0a1625',
  consoleDark: '#0d1018',
  holographic: '#00eeff',
  button: '#00ffcc',
  bezel: '#c0cee0',
  ledDefault: '#00bbff',
  emissiveSubtle: '#223344',
} as const;

// ■■ Lab-Tinted Material Factory ■■
// Creates a material set tinted to a specific lab color
export function createLabTintedMaterials(labColor: string) {
  return {
    frame: createAlloyFrameMaterial(labColor),
    panel: createControlPanelMaterial(labColor),
    holographic: createHolographicMaterial(labColor),
    button: createButtonMaterial(labColor),
    led: createLEDMaterial(labColor),
  };
}
