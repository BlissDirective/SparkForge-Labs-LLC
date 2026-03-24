// ════════════════════════════════════════════════════
// Environment Components Index
// ════════════════════════════════════════════════════
// Exports all 3D environment components across 3 tiers:
//   - Flagship (5 games, 10M triangle budget)
//   - FL-Lite (9 games, 2M triangle budget)
//   - Standard (20 games, 500K triangle budget)

// ■■ Flagship Environments (10M budget) ■■
export { default as PetTrainerEnvironment } from './PetTrainerEnvironment';
export { default as NeuralBuilderEnvironment } from './NeuralBuilderEnvironment';
export { default as PromptLabEnvironment } from './PromptLabEnvironment';
export { default as AgentArchitectEnvironment } from './AgentArchitectEnvironment';
export { default as BiasDetectiveEnvironment } from './BiasDetectiveEnvironment';
export { FlagshipEnvironmentWrapper } from './FlagshipEnvironmentBase';

// ■■ FL-Lite Environments (2M budget) ■■
export { default as DataDetectiveEnvironment } from './DataDetectiveEnvironment';
export { default as RobotVacuumEnvironment } from './RobotVacuumEnvironment';
export { default as CameraQuestEnvironment } from './CameraQuestEnvironment';
export { default as ChatbotBuilderEnvironment } from './ChatbotBuilderEnvironment';
export { default as EmojiDecoderEnvironment } from './EmojiDecoderEnvironment';
export { default as CodeBlocksEnvironment } from './CodeBlocksEnvironment';
export { default as MyFirstAiAppEnvironment } from './MyFirstAiAppEnvironment';
export { default as FutureForgeEnvironment } from './FutureForgeEnvironment';
export { default as AiOrNotEnvironment } from './AiOrNotEnvironment';
export { FLLiteEnvironmentWrapper } from './FLLiteEnvironmentBase';

// ■■ Standard Environments (500K budget) ■■
export { default as AiSpyEnvironment } from './AiSpyEnvironment';
export { default as TimeMachineEnvironment } from './TimeMachineEnvironment';
export { default as HumanVsMachineEnvironment } from './HumanVsMachineEnvironment';
export { default as TreatTrainerEnvironment } from './TreatTrainerEnvironment';
export { default as NeuronRelayEnvironment } from './NeuronRelayEnvironment';
export { default as PixelInvestigatorEnvironment } from './PixelInvestigatorEnvironment';
export { default as WordPredictorEnvironment } from './WordPredictorEnvironment';
export { default as TokenChopperEnvironment } from './TokenChopperEnvironment';
export { default as AiArtDetectiveEnvironment } from './AiArtDetectiveEnvironment';
export { default as ToolPickerEnvironment } from './ToolPickerEnvironment';
export { default as DataShieldEnvironment } from './DataShieldEnvironment';
export { default as RealOrFakeEnvironment } from './RealOrFakeEnvironment';
export { default as EthicsCourtroomEnvironment } from './EthicsCourtroomEnvironment';
export { default as FoolTheAiEnvironment } from './FoolTheAiEnvironment';
export { default as BuildClassifierEnvironment } from './BuildClassifierEnvironment';
export { default as PredictionMarketEnvironment } from './PredictionMarketEnvironment';
export { default as SentimentScannerEnvironment } from './SentimentScannerEnvironment';
export { default as LostInTranslationEnvironment } from './LostInTranslationEnvironment';
export { default as CareerExplorerEnvironment } from './CareerExplorerEnvironment';
export { default as ApiExplorerEnvironment } from './ApiExplorerEnvironment';
export { StandardEnvironmentWrapper } from './StandardEnvironmentBase';
