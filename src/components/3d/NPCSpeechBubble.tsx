'use client';

// ════════════════════════════════════════════════════
// NPC SPEECH BUBBLE — Phase 6: Floating 3D text above NPC bots
// Displays content-driven tips from the Content Agent
// Renders as Html overlay positioned relative to NPC
// ════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Html } from '@react-three/drei';

interface NPCSpeechBubbleProps {
  text: string;
  visible: boolean;
  position?: [number, number, number];
  color?: string;
  autoHideMs?: number;
}

export function NPCSpeechBubble({
  text,
  visible,
  position = [0, 2, 0],
  color = '#00BBFF',
  autoHideMs = 8000,
}: NPCSpeechBubbleProps) {
  const [show, setShow] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), autoHideMs);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, autoHideMs, text]);

  if (!show || !text) return null;

  return (
    <Html
      position={position}
      center
      distanceFactor={6}
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="relative px-3 py-1.5 rounded-lg max-w-[200px] text-center animate-fadeIn"
        style={{
          background: 'rgba(10, 14, 22, 0.85)',
          border: `1px solid ${color}30`,
          boxShadow: `0 0 12px ${color}15`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <p className="text-[10px] text-white/80 font-body leading-tight">
          {text}
        </p>
        {/* Speech bubble tail */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-2.5 h-2.5 rotate-45"
          style={{
            background: 'rgba(10, 14, 22, 0.85)',
            borderRight: `1px solid ${color}30`,
            borderBottom: `1px solid ${color}30`,
          }}
        />
      </div>
    </Html>
  );
}

export default NPCSpeechBubble;
