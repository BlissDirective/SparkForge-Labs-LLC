'use client';

// ================================================================
// PET CREATURE 3D — Procedural Species Renderer
// ================================================================
// Replaces the old GLB-based loader with 5 procedural AI-themed
// creature species, each with 6 evolution stages.
//
// Decision 6.2: Updated — procedural geometry for maximum interactivity
// Decision 7.5: MeshToonMaterial (3-step gradient) — preserved
//
// Architecture:
// - Renders one of 5 species based on speciesId prop
// - Each species is a separate component with stage-specific geometry
// - Mood affects emissive glow, float speed, sparkle count
// - Evolution stage selects which geometry variant to render
// - All animations procedural via useFrame (no rigging needed)
//
// Species:
//   byteling  — Data & Binary (cubic shapes)
//   sparkpaw  — Neural Networks (spherical/tentacles)
//   voltkit   — Energy & Computing (triangular/spiky)
//   cogsworth — Robotics & Building (cylindrical/mechanical)
//   pixie     — Computer Vision (lens/disc/dome)

import type { SpeciesId, PetMood } from '@/config/creatureConfig';
import { getCreatureComponent } from './creatures';

// === Types ===

export interface PetCreatureProps {
  /** Species to render (default: byteling) */
  speciesId?: SpeciesId;
  /** Evolution stage 0-5 */
  evolutionStage: number;
  /** Current mood — drives emissive, float, sparkles */
  mood: PetMood;
  /** Lab color — used for species-specific tinting */
  labColor?: string;
}

// === Main Exported Component ===
// Renders the appropriate species component based on speciesId

export default function PetCreature3D({
  speciesId = 'byteling',
  evolutionStage = 0,
  mood = 'learning',
  labColor,
}: PetCreatureProps) {
  const CreatureComponent = getCreatureComponent(speciesId);

  return (
    <CreatureComponent
      speciesId={speciesId}
      evolutionStage={evolutionStage}
      mood={mood}
      labColor={labColor}
    />
  );
}
