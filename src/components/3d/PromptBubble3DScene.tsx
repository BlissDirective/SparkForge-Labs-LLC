'use client';

// ================================================================
// PromptBubble3DScene -- SSR-safe Canvas wrapper
// ================================================================
// Wraps PromptBubble3D in an R3F Canvas so the entire 3D scene
// can be loaded via next/dynamic with { ssr: false }. This avoids
// hydration errors from Canvas accessing browser APIs at import time.
// ================================================================

import { Canvas } from '@react-three/fiber';
import PromptBubble3D from './PromptBubble3D';
import PromptLabEnvironment from './environments/PromptLabEnvironment';

interface Props {
  keywords: string[];
  isThinking: boolean;
  temperature: number;
}

export default function PromptBubble3DScene({ keywords, isThinking, temperature }: Props) {
  // frameloop="always" is required here because PromptBubble3D uses continuous
  // spring physics simulation (bubble positions, velocities, and damping are
  // computed every frame via useFrame). Using "demand" would freeze bubble
  // motion since there is no invalidate() call in the physics loop.
  return (
    <Canvas
      camera={{ position: [0, 1, 6], fov: 50 }}
      frameloop="always"
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      shadows
      style={{ background: 'transparent' }}
    >
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
    </Canvas>
  );
}
