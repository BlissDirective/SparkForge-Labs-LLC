// ════════════════════════════════════════════════════════════════════════════
// AI TUTOR AVATAR — Backward-Compatibility Wrapper
// ════════════════════════════════════════════════════════════════════════════
// DEPRECATED: Import from '@/components/sparky/SparkyFloating' directly.
// This file exists for backward compatibility with existing imports.
// All Sparky rendering is now handled by the unified SparkyCore system.

'use client';

import { SparkyFloating } from '@/components/sparky/SparkyFloating';
import type { SparkyExpression } from '@/components/sparky/SparkyCore';

// Re-export the type for existing consumers
export type TutorExpression = SparkyExpression;

interface AITutorAvatarProps {
  expression?: SparkyExpression;
  isChatOpen: boolean;
  onClick: () => void;
  quickTip?: string;
  pulseAttention?: boolean;
}

export function AITutorAvatar(props: AITutorAvatarProps) {
  return <SparkyFloating {...props} />;
}
