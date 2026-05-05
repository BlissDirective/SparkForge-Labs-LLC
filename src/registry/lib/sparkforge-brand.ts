/**
 * SparkForge — Brand Reference (registry/lib)
 * ════════════════════════════════════════════════════════════════════
 *
 * Read src/registry/README.md first. This file is a REFERENCE for AI
 * design tools and humans, not a restriction.
 *
 * Re-exports the brand-DNA data (lab identities, audience signals,
 * tier metadata) from the canonical sources of truth elsewhere in the
 * codebase, plus a few registry-only constants that capture intent
 * concisely. Editing this file is fine; editing the source-of-truth
 * upstream is preferred when both are options.
 * ════════════════════════════════════════════════════════════════════ */

// 🟢 Core / Preserve — re-exports of the canonical lab table
export {
  LAB_COLORS_TABLE,
  LAB_COLORS_HEX,
  LAB_COLORS_OKLCH,
  LAB_NAMES_MAP,
  type LabColor,
} from '@/config/labColors';

// 🟢 Core / Preserve — minimal lab descriptions for tools generating
// marketing copy. Source of truth for full descriptions lives in
// src/components/landing/LabDiscoveryRing.tsx (LAB_DESCS). This map
// is shorter, intentionally — for tools assembling card copy, not
// for the production product surface.
export const LAB_BRIEF_BY_ID: Record<number, string> = {
  1:  'Foundations: what AI actually is and how it learns.',
  2:  'Hands-on: train tiny models on your own examples.',
  3:  'Open the brain — neural networks from first principles.',
  4:  'Generative AI: art, music, story, voice.',
  5:  'AI helpers: assistants, planners, summarizers.',
  6:  'Ethics, fairness, bias, and safety.',
  7:  'Computer vision: teach machines to see.',
  8:  'Language models: read, write, translate.',
  9:  'Build your AI app end-to-end.',
  10: 'Frontiers: where AI is going next.',
  11: 'Agentic AI: build teams of agents, equip them, keep them safe.',
};

// 🔵 Reference signals — audience metadata so generated copy lands.
export const SPARKFORGE_AUDIENCE = {
  /** Primary user is the kid; secondary buyer is the parent. */
  primaryUser: { role: 'child', ageRange: [7, 16] as const },
  buyer:        { role: 'parent', purchases: 'subscription' as const },
  toneForKids:  'curious, encouraging, playful but not babyish',
  toneForParents: 'calm, trustworthy, COPPA-aware, value-clear',
} as const;

// 🔵 Reference signals — the three subscription tiers, for any
// tool that needs to render pricing or feature-gating chrome.
export const SPARKFORGE_TIERS = [
  { id: 'free',  name: 'Free',  unlocks: 'Labs 1–3' },
  { id: 'plus',  name: 'Plus',  unlocks: 'All 11 labs + multi-child' },
  { id: 'forge', name: 'Forge', unlocks: 'Plus + early access + creator tools' },
] as const;

// 🟢 Core / Preserve — the names of the irreplaceable 3D primitives
// design tools should compose AROUND, not try to recreate. See the
// slot blocks in src/registry/blocks/*-slot.tsx for inline use.
export const SPARKFORGE_3D_SLOTS = [
  {
    component: 'BrandHero3D',
    importPath: '@/components/landing/BrandHero3D',
    purpose:
      'The dichroic SparkForge wordmark with anamorphic lensflares. ' +
      'Use as the marketing hero centerpiece. WebGPU+TSL render with ' +
      'an MP4 fallback baked in.',
    fillsParent: true,
  },
  {
    component: 'CockpitPreview3D',
    importPath: '@/components/3d/CockpitPreview3D',
    purpose:
      'A miniature, non-interactive cockpit dashboard scene for ' +
      'marketing / pricing pages. ~50K tris, low DPR. Wraps in an ' +
      '<R3FCanvas>; see StationPreview.tsx for the wiring pattern.',
    fillsParent: true,
  },
  {
    component: 'LoginPanel3D',
    importPath: '@/components/3d/panels/LoginPanel3D',
    purpose:
      'The full 3D auth form panel. Owns email/password/OAuth/demo ' +
      'flow internally. Drop into any auth route; the route page ' +
      'just provides handlers.',
    fillsParent: true,
  },
  {
    component: 'HolographicLabMap',
    importPath: '@/components/3d/HolographicLabMap',
    purpose:
      'The 11-lab holographic ring used in the post-auth cockpit. ' +
      'Heavy (~1000 LOC), interactive (drag-rotate, click, focus). ' +
      'Compose with intent — not for casual marketing surfaces.',
    fillsParent: true,
  },
  {
    component: 'SparkForgeWordmark3D',
    importPath: '@/components/3d/branding/SparkForgeWordmark3D',
    purpose:
      'The wordmark itself, per-letter ExtrudeGeometry with the ' +
      'BrandingMaterial TSL pipeline. Used inside BrandHero3D; can ' +
      'also be embedded in other branding-heavy moments. Needs a ' +
      'BrandingShowcase canvas wrapper.',
    fillsParent: false,
  },
] as const;

export type SparkForge3DSlot = (typeof SPARKFORGE_3D_SLOTS)[number];
