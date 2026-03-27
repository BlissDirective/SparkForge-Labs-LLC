'use client';

// ================================================================
// PromptBubble3DScene — Group wrapper (D3D-B1 compliant)
// ================================================================
// S6-CRIT-002: Refactored from standalone Canvas to <group> that
// renders inside CockpitCanvas via sceneStore.setGameSceneContent.
// Canvas, camera, dpr, gl config removed — CockpitCanvas provides these.
// ================================================================

import PromptBubble3D from './PromptBubble3D';
import PromptLabEnvironment from './environments/PromptLabEnvironment';

interface Props {
  keywords: string[];
  isThinking: boolean;
  temperature: number;
}

export default function PromptBubble3DScene({ keywords, isThinking, temperature }: Props) {
  return (
    <group>
      {/* [5M] Immersive AI Workshop Environment */}
      <PromptLabEnvironment
        isThinking={isThinking}
        tokenUsage={keywords.length / 12}
      />

      <PromptBubble3D
        keywords={keywords}
        isThinking={isThinking}
        temperature={temperature}
      />
    </group>
  );
}
