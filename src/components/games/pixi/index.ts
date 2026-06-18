// ════════════════════════════════════════════════════════════════════════
// PIXI GAME ARCHETYPES — public surface for the lab-by-lab rollout (Phase C)
// ════════════════════════════════════════════════════════════════════════
// Compose a game's `play` phase as:
//   <PixiGameStage labColor ariaLabel a11y status inspector>
//     {({ width, height }) => <SomeScene ... width={width} height={height} />}
//   </PixiGameStage>
// Always load via next/dynamic({ ssr: false }) — Pixi is client-only.

export { default as PixiGameStage, type StageDims } from './PixiGameStage';
export { ChipToken, type ChipTokenProps } from './ChipToken';
export { ParticleField, type ParticleController } from './ParticleField';
export { hexNum, shortCode, clamp, STAGE_PAD } from './primitives';

// Scene archetypes
export { default as SortDragScene, type SortItem } from './scenes/SortDragScene';
export { default as ConnectBoardScene, type BoardNode } from './scenes/ConnectBoardScene';
export { default as ReactionArena } from './scenes/ReactionArena';
export { default as RevealMapScene, type RevealTile } from './scenes/RevealMapScene';
