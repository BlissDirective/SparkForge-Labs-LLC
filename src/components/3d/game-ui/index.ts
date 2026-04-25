// ════════════════════════════════════════════════════════════════
// Game UI 3D Components — Barrel Export (Phase 5 + 6)
// ════════════════════════════════════════════════════════════════
// Shared 3D game HUD + chrome + templates used by all 35 games.
// Rendered inside CockpitCanvas during game mode (UI-8: 75% takeover).

// Phase 5: HUD + Phase Overlays
export { GameHUD3D } from './GameHUD3D';
export { GameTimerBar3D } from './GameTimerBar3D';
export { GameWelcomePanel3D, GameCompletePanel3D } from './GamePhaseOverlay3D';

// Phase 6: Shared Templates (4 layout patterns for 29 non-flagship games)
export { ChoiceButton3D, type ChoiceFeedback, type ChoiceButton3DProps } from './ChoiceButton3D';
export { QuizGameTemplate, type QuizChoice, type QuizGameTemplateProps } from './QuizGameTemplate';
export { BuilderGameTemplate, type BuilderGameTemplateProps } from './BuilderGameTemplate';
export { ExplorerGameTemplate, type InfoCard, type ExplorerGameTemplateProps } from './ExplorerGameTemplate';
export { LabGameTemplate, type MetricDisplay, type LabGameTemplateProps } from './LabGameTemplate';
export { GameLearnCards3D, type LearnCard, type GameLearnCards3DProps } from './GameLearnCards3D';
