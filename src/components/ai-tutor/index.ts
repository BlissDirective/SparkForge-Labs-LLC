// ════════════════════════════════════════════════════════════════
// AI Tutor — Component Exports
// ════════════════════════════════════════════════════════════════

export { AITutor } from './AITutor';
export { AITutorAvatar } from './AITutorAvatar';
export { AITutorChat } from './AITutorChat';
export { AITutorProvider, useAITutor } from './AITutorContext';
export {
  filterInput,
  generateTutorResponse,
} from './ai-tutor-engine';

// Types
export type { TutorExpression } from './AITutorAvatar';
export type { ChatMessage } from './AITutorChat';
export type { TutorContext, TutorResponse } from './ai-tutor-engine';
