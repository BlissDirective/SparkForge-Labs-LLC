// ================================================================
// Creature Species — Barrel Export
// ================================================================
// 5 procedural AI-themed creature species for the Pet Trainer game.
// Each species has 6 evolution stages with unique geometry + animations.

export { default as BytelingCreature } from './BytelingCreature';
export { default as SparkpawCreature } from './SparkpawCreature';
export { default as VoltkitCreature } from './VoltkitCreature';
export { default as CogsworthCreature } from './CogsworthCreature';
export { default as PixieCreature } from './PixieCreature';

export {
  CreatureWrapper,
  BlinkingEye,
  InnerGlow,
  useToonSetup,
  createToonGradient,
} from './CreatureBase';

export type { CreatureProps } from './CreatureBase';

import type { SpeciesId } from '@/config/creatureConfig';
import BytelingCreature from './BytelingCreature';
import SparkpawCreature from './SparkpawCreature';
import VoltkitCreature from './VoltkitCreature';
import CogsworthCreature from './CogsworthCreature';
import PixieCreature from './PixieCreature';

/** Map species ID → creature component */
export const CREATURE_COMPONENTS: Record<SpeciesId, typeof BytelingCreature> = {
  byteling: BytelingCreature,
  sparkpaw: SparkpawCreature,
  voltkit: VoltkitCreature,
  cogsworth: CogsworthCreature,
  pixie: PixieCreature,
};

/** Get creature component by species ID */
export function getCreatureComponent(speciesId: SpeciesId) {
  return CREATURE_COMPONENTS[speciesId];
}
