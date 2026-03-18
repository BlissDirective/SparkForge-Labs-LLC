// Flagship Environment Components — 5M triangle budget immersive scenes
// Each environment wraps the existing 3D game component with a rich,
// LOD-aware, themed environment that fills the flagship triangle budget.

export { default as PetTrainerEnvironment } from './PetTrainerEnvironment';
export { default as NeuralBuilderEnvironment } from './NeuralBuilderEnvironment';
export { default as PromptLabEnvironment } from './PromptLabEnvironment';
export { default as AgentArchitectEnvironment } from './AgentArchitectEnvironment';
export { default as BiasDetectiveEnvironment } from './BiasDetectiveEnvironment';
export { FlagshipEnvironmentWrapper, useFlagshipLOD } from './FlagshipEnvironmentBase';
export type { FlagshipLOD } from './FlagshipEnvironmentBase';
