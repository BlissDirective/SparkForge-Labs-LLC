'use client';

// ════════════════════════════════════════════════════════════════
// ChatPanel3D — AI Guide Chat Panel (Phase 3: Auth + Forms)
// ════════════════════════════════════════════════════════════════
// 3D cockpit-style chat interface for the AI Guide. Replaces the
// HTML GuideChatPanel overlay with a panel rendered inside CockpitCanvas.
//
// Per SparkForge-Full-ControlScreen.json §interaction_model.text_input:
//   - CockpitInput with hidden HTML proxy for chat input
//   - Message history rendered as stacked 3D text blocks
//   - Chrome bezel frame, carbon composite background
//
// Architecture: Renders as center content in CockpitUILayer when
// the guide chat is opened (via cockpitUIStore 'chat' key).
// The GuideAvatar3D continues rendering in the left quadrant.

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import {
  Color,
  Mesh,
  MeshStandardMaterial,
  MeshBasicMaterial,
  AdditiveBlending,
  DoubleSide,
} from 'three';
import { useGuideStore, type GuideMessage } from '@/stores/guideStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import {
  CHROME_BORDER,
  HOVER_GLOW,
  TYPE_SCALE,
  TEXT_COLORS,
  EMISSIVE_IDLE_BUTTON,
  _EMISSIVE_HOVER_MULTIPLIER,
  _SPRING_PRESETS,
  _PRESS_DEPTH,
  _MAX_VISIBLE_ITEMS,
} from '@/lib/3d/cockpitDesignTokens';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const PANEL_WIDTH = 1.4;
const PANEL_HEIGHT = 1.6;
const PANEL_DEPTH = 0.006;
const ACCENT_COLOR = '#AA66FF';
const USER_COLOR = '#00BBFF';
const ASSISTANT_COLOR = '#AA66FF';
const INPUT_WIDTH = 1.15;
const INPUT_HEIGHT = 0.1;
const MAX_VISIBLE_MESSAGES = 6;
const MESSAGE_HEIGHT = 0.12;
const MESSAGE_GAP = 0.02;

// ═══════════════════════════════════════════════════════════════
// MESSAGE BUBBLE
// ═���═════════════════════════════════════════════════════════════

function MessageBubble3D({
  message,
  position,
}: {
  message: GuideMessage;
  position: [number, number, number];
}) {
  const isUser = message.role === 'user';
  const bubbleColor = isUser ? USER_COLOR : ASSISTANT_COLOR;
  const align = isUser ? 'right' : 'left';

  return (
    <group position={position}>
      {/* Message background */}
      <mesh position={[isUser ? 0.15 : -0.15, 0, 0]}>
        <boxGeometry args={[INPUT_WIDTH * 0.75, MESSAGE_HEIGHT, 0.003]} />
        <meshStandardMaterial
          color={new Color(bubbleColor)}
          emissive={new Color(bubbleColor)}
          emissiveIntensity={0.15}
          transparent
          opacity={0.12}
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>
      {/* Chrome accent bar on edge */}
      <mesh position={[isUser ? INPUT_WIDTH * 0.75 / 2 + 0.15 : -INPUT_WIDTH * 0.75 / 2 - 0.15, 0, 0.002]}>
        <boxGeometry args={[0.003, MESSAGE_HEIGHT - 0.01, 0.003]} />
        <meshStandardMaterial
          color={new Color(bubbleColor)}
          emissive={new Color(bubbleColor)}
          emissiveIntensity={0.5}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      {/* Role label */}
      <Text
        position={[isUser ? INPUT_WIDTH * 0.75 / 2 + 0.1 : -INPUT_WIDTH * 0.75 / 2 - 0.1, MESSAGE_HEIGHT / 2 - 0.01, 0.004]}
        fontSize={TYPE_SCALE.caption.fontSize * 0.7}
        color={bubbleColor}
        anchorX={align}
        anchorY="top"
        font={TYPE_SCALE.caption.fontPath}
      >
        {isUser ? 'YOU' : 'SPARK'}
      </Text>
      {/* Message text */}
      <Text
        position={[isUser ? 0.15 : -0.15, -0.005, 0.004]}
        fontSize={TYPE_SCALE.caption.fontSize}
        color={TEXT_COLORS.primary.hex}
        anchorX="center"
        anchorY="middle"
        font={TYPE_SCALE.body.fontPath}
        fillOpacity={TEXT_COLORS.primary.opacity}
        maxWidth={INPUT_WIDTH * 0.7}
        textAlign={align}
        overflowWrap="break-word"
      >
        {message.content.length > 120 ? message.content.slice(0, 117) + '...' : message.content}
      </Text>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function ChatPanel3D() {
  const glowRef = useRef<Mesh>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages = useGuideStore((s) => s.messages);
  const isStreaming = useGuideStore((s) => s.isStreaming);
  const streamingContent = useGuideStore((s) => s.streamingContent);
  const addMessage = useGuideStore((s) => s.addMessage);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);

  const [inputValue, setInputValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [page, setPage] = useState(0);

  const accentColor = useMemo(() => new Color(ACCENT_COLOR), []);
  const chromeColor = useMemo(() => new Color(CHROME_BORDER.colorHex), []);

  const panelMat = useMemo(() => new MeshStandardMaterial({
    color: new Color('#0A0F1F'), metalness: 0.85, roughness: 0.35, transparent: true, opacity: 0.92,
  }), []);
  const chromeMat = useMemo(() => new MeshStandardMaterial({
    color: chromeColor, metalness: 0.95, roughness: 0.1,
    emissive: accentColor, emissiveIntensity: CHROME_BORDER.glowIntensity,
  }), [chromeColor, accentColor]);
  const glowMat = useMemo(() => new MeshBasicMaterial({
    color: accentColor, transparent: true, opacity: 0.06,
    blending: AdditiveBlending, side: DoubleSide, depthWrite: false, toneMapped: false,
  }), [accentColor]);

  useFrame((state) => {
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * (Math.PI * 2 / HOVER_GLOW.pulsePeriodS));
      (glowRef.current.material as MeshBasicMaterial).opacity = 0.06 + pulse * 0.02;
    }
  });

  // Visible messages (paginated from end)
  const allMessages = useMemo(() => {
    const msgs = [...messages];
    // Add streaming message if active
    if (isStreaming && streamingContent) {
      msgs.push({ id: 'streaming', role: 'assistant', content: streamingContent, timestamp: Date.now() });
    }
    return msgs;
  }, [messages, isStreaming, streamingContent]);

  const totalPages = Math.max(1, Math.ceil(allMessages.length / MAX_VISIBLE_MESSAGES));
  const visibleMessages = useMemo(() => {
    // Show latest messages first (page 0 = most recent)
    const start = Math.max(0, allMessages.length - (page + 1) * MAX_VISIBLE_MESSAGES);
    const end = Math.max(0, allMessages.length - page * MAX_VISIBLE_MESSAGES);
    return allMessages.slice(start, end);
  }, [allMessages, page]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isStreaming) return;
    const text = inputValue.trim();
    setInputValue('');

    // Add user message to store — API streaming handled by GuideChatPanel/hook
    addMessage({ id: `user-${Date.now()}`, role: 'user', content: text, timestamp: Date.now() });

    broadcast({
      type: 'button-press',
      source: 'chat-send',
      color: ACCENT_COLOR,
      label: 'Chat message sent',
    });

    // Reset to latest page
    setPage(0);
  }, [inputValue, isStreaming, addMessage, broadcast]);

  useEffect(() => {
    if (focused && inputRef.current) inputRef.current.focus();
  }, [focused]);

  // Input border material (focus-aware)
  const inputBorderColor = focused ? accentColor : chromeColor;

  return (
    <group name="chat-panel">
      {/* Glow */}
      <mesh ref={glowRef} position={[0, 0, -0.003]}>
        <planeGeometry args={[PANEL_WIDTH + 0.04, PANEL_HEIGHT + 0.04]} />
        <primitive object={glowMat} />
      </mesh>

      {/* Panel */}
      <mesh>
        <boxGeometry args={[PANEL_WIDTH, PANEL_HEIGHT, PANEL_DEPTH]} />
        <primitive object={panelMat} />
      </mesh>

      {/* Chrome frame */}
      <mesh position={[0, PANEL_HEIGHT / 2, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[PANEL_WIDTH, 0.003, 0.003]} />
      </mesh>
      <mesh position={[0, -PANEL_HEIGHT / 2, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[PANEL_WIDTH, 0.003, 0.003]} />
      </mesh>
      <mesh position={[-PANEL_WIDTH / 2, 0, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[0.003, PANEL_HEIGHT, 0.003]} />
      </mesh>
      <mesh position={[PANEL_WIDTH / 2, 0, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[0.003, PANEL_HEIGHT, 0.003]} />
      </mesh>

      {/* Content */}
      <group position={[0, 0, PANEL_DEPTH / 2 + 0.002]}>
        {/* Header */}
        <Text position={[0, PANEL_HEIGHT / 2 - 0.05, 0]} fontSize={TYPE_SCALE.h2.fontSize}
          color={TEXT_COLORS.primary.hex} anchorX="center" anchorY="middle" font={TYPE_SCALE.h2.fontPath}
        >SPARK GUIDE</Text>
        <mesh position={[0, PANEL_HEIGHT / 2 - 0.08, 0]} material={chromeMat}>
          <boxGeometry args={[PANEL_WIDTH * 0.8, 0.002, 0.002]} />
        </mesh>

        {/* Streaming indicator */}
        {isStreaming && (
          <Text position={[PANEL_WIDTH / 2 - 0.08, PANEL_HEIGHT / 2 - 0.05, 0]}
            fontSize={TYPE_SCALE.caption.fontSize * 0.8} color={ACCENT_COLOR}
            anchorX="right" anchorY="middle" font={TYPE_SCALE.caption.fontPath}
          >{'typing...'}</Text>
        )}

        {/* Message area */}
        <group position={[0, 0.05, 0]}>
          {visibleMessages.length === 0 ? (
            <Text position={[0, 0, 0]} fontSize={TYPE_SCALE.body.fontSize}
              color={TEXT_COLORS.dim.hex} anchorX="center" anchorY="middle"
              font={TYPE_SCALE.body.fontPath} fillOpacity={TEXT_COLORS.dim.opacity}
              maxWidth={PANEL_WIDTH * 0.7} textAlign="center"
            >{"Ask me anything about AI!\nI'm here to help you learn."}</Text>
          ) : (
            visibleMessages.map((msg, i) => (
              <MessageBubble3D
                key={msg.id}
                message={msg}
                position={[0, (MAX_VISIBLE_MESSAGES / 2 - i - 0.5) * (MESSAGE_HEIGHT + MESSAGE_GAP), 0]}
              />
            ))
          )}
        </group>

        {/* Pagination (if many messages) */}
        {totalPages > 1 && (
          <group position={[0, -PANEL_HEIGHT / 2 + 0.28, 0]}>
            <Text
              position={[-0.12, 0, 0]}
              fontSize={TYPE_SCALE.caption.fontSize}
              color={page < totalPages - 1 ? ACCENT_COLOR : TEXT_COLORS.dim.hex}
              anchorX="center" anchorY="middle" font={TYPE_SCALE.caption.fontPath}
              onClick={() => { if (page < totalPages - 1) setPage(page + 1); }}
              onPointerOver={() => { if (page < totalPages - 1) document.body.style.cursor = 'pointer'; }}
              onPointerOut={() => { document.body.style.cursor = 'default'; }}
            >{'< older'}</Text>
            <Text
              position={[0.12, 0, 0]}
              fontSize={TYPE_SCALE.caption.fontSize}
              color={page > 0 ? ACCENT_COLOR : TEXT_COLORS.dim.hex}
              anchorX="center" anchorY="middle" font={TYPE_SCALE.caption.fontPath}
              onClick={() => { if (page > 0) setPage(page - 1); }}
              onPointerOver={() => { if (page > 0) document.body.style.cursor = 'pointer'; }}
              onPointerOut={() => { document.body.style.cursor = 'default'; }}
            >{'newer >'}</Text>
          </group>
        )}

        {/* Input area */}
        <group position={[0, -PANEL_HEIGHT / 2 + 0.12, 0]}>
          {/* Input border */}
          <mesh onClick={() => setFocused(true)}>
            <boxGeometry args={[INPUT_WIDTH + 0.006, INPUT_HEIGHT + 0.006, 0.003]} />
            <meshStandardMaterial color={inputBorderColor} metalness={0.95} roughness={0.1}
              emissive={inputBorderColor} emissiveIntensity={focused ? 0.4 : CHROME_BORDER.glowIntensity} />
          </mesh>
          {/* Input bg */}
          <mesh position={[0, 0, 0.002]} onClick={() => setFocused(true)}>
            <boxGeometry args={[INPUT_WIDTH, INPUT_HEIGHT, 0.002]} />
            <meshStandardMaterial color={new Color('#0a1625')} metalness={0.3} roughness={0.6} />
          </mesh>
          {/* Input text */}
          <Text position={[-INPUT_WIDTH / 2 + 0.04, 0, 0.005]}
            fontSize={TYPE_SCALE.body.fontSize}
            color={inputValue ? TEXT_COLORS.primary.hex : TEXT_COLORS.dim.hex}
            anchorX="left" anchorY="middle" font={TYPE_SCALE.body.fontPath}
            fillOpacity={inputValue ? 1.0 : 0.3}
            maxWidth={INPUT_WIDTH - 0.15}
          >{inputValue || 'Type a message...'}</Text>

          {/* Send button */}
          <group position={[INPUT_WIDTH / 2 + 0.06, 0, 0]}>
            <mesh
              onClick={handleSend}
              onPointerOver={() => { if (inputValue.trim()) document.body.style.cursor = 'pointer'; }}
              onPointerOut={() => { document.body.style.cursor = 'default'; }}
            >
              <boxGeometry args={[0.08, INPUT_HEIGHT, 0.006]} />
              <meshStandardMaterial
                color={new Color(ACCENT_COLOR)}
                emissive={new Color(ACCENT_COLOR)}
                emissiveIntensity={inputValue.trim() ? EMISSIVE_IDLE_BUTTON : 0.1}
                metalness={0.7} roughness={0.3}
              />
            </mesh>
            <Text position={[0, 0, 0.005]} fontSize={TYPE_SCALE.label.fontSize}
              color="#ffffff" anchorX="center" anchorY="middle" font={TYPE_SCALE.label.fontPath}
            >{'>'}</Text>
          </group>
        </group>

        {/* Hidden HTML input proxy */}
        <Html position={[0, 0, -10]} style={{ opacity: 0, position: 'absolute', pointerEvents: focused ? 'auto' : 'none' }}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            onBlur={() => { if (focused) inputRef.current?.focus(); }}
          />
        </Html>
      </group>
    </group>
  );
}
