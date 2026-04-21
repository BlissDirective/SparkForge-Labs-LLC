'use client';

// ════════════════════════════════════════════════════════════════
// PauseButton3D — UX-MED-002 (T10b)
// ════════════════════════════════════════════════════════════════
// Hex-prism pause/play button rendered at the top-center of the
// game viewport (above the HUD band, below the status bar). Uses
// the active game's lab color from sceneStore so the button reads
// as part of the theming, not a fixed UI chrome element.
//
// Interaction model:
//   - Click → useSafePause().toggle()
//   - Hover → scale 1.08 + broadcast 'button-focus' event
//   - P key → toggle (handled here so users can pause without
//             mousing to the button)
//   - Escape → toggle (handled in GameShell, per T10a)
//
// Visual states:
//   playing → two vertical bars (pause glyph), soft breathe
//   paused  → right-pointing triangle (play glyph), stronger pulse
//
// Per Option C (LED rim dim selection in Q3), the cockpit LEDRim is
// dimmed to 40% intensity when paused. That bridge is wired inside
// CockpitCanvas — see intensityForPause() there.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import {
  Color,
  CylinderGeometry,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import { useGameStore } from '@/stores/gameStore';
import { useSceneStore } from '@/stores/sceneStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';

const SIZE = 0.08;
const DEPTH = 0.025;

interface PauseButton3DProps {
  /** Position in the same parent space as GameHUD3D. */
  position?: [number, number, number];
}

export function PauseButton3D({
  position = [0, 1.2, -2.0],
}: PauseButton3DProps) {
  const isPaused = useGameStore((s) => s.isPaused);
  const togglePause = useGameStore((s) => s.togglePause);
  const activeScene = useSceneStore((s) => s.activeScene);
  const labColor = useSceneStore((s) => s.activeGameLabColor);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);

  const [hovered, setHovered] = useState(false);
  const hexRef = useRef<Mesh>(null);
  const matRef = useRef<MeshStandardMaterial>(null);

  // Only render during active game scenes.
  const shouldRender = activeScene === 'game';

  const geometry = useMemo(() => new CylinderGeometry(SIZE, SIZE, DEPTH, 6), []);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color(labColor),
        emissive: new Color(labColor),
        emissiveIntensity: 1.5,
        metalness: 0.6,
        roughness: 0.3,
      }),
    [labColor],
  );

  // P-key shortcut — separate from the Escape handler in GameShell so
  // both work. Guards on activeScene so P typed into a chat input in
  // a future panel doesn't silently pause the background cockpit.
  useEffect(() => {
    if (!shouldRender) return;
    function onKey(e: KeyboardEvent) {
      if ((e.key === 'p' || e.key === 'P') && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement | null;
        // Ignore when the user is typing in an input-like element.
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        useGameStore.getState().togglePause();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shouldRender]);

  useFrame((state, delta) => {
    if (!hexRef.current || !matRef.current) return;
    const t = state.clock.elapsedTime;
    // Hover scale lerp
    const targetScale = hovered ? 1.08 : 1;
    const lerp = 1 - Math.exp(-delta * 14);
    hexRef.current.scale.x += (targetScale - hexRef.current.scale.x) * lerp;
    hexRef.current.scale.z += (targetScale - hexRef.current.scale.z) * lerp;

    // Emissive pulse — faster when paused for a clearer "paused" beat.
    const speed = isPaused ? 1.0 : 0.5;
    const base = isPaused ? 2.0 : 1.2;
    const pulse = Math.abs(Math.sin(t * Math.PI * speed)) * 0.6;
    matRef.current.emissiveIntensity = base + pulse;
    // Sync color with lab color (updates on game switch without remount)
    matRef.current.color.set(labColor);
    matRef.current.emissive.set(labColor);
  });

  const handleClick = useCallback(() => {
    togglePause();
    broadcast({ type: 'button-press', source: 'pause-button', value: 1.0 });
  }, [togglePause, broadcast]);

  const handleHover = useCallback(
    (v: boolean) => {
      setHovered(v);
      // Intentionally no broadcast on hover — the cockpit broadcast
      // event vocabulary covers press/release only, not focus. Hover
      // feedback is purely local (scale + cursor change).
    },
    [],
  );

  if (!shouldRender) return null;

  return (
    <group position={position}>
      <mesh
        ref={hexRef}
        geometry={geometry}
        rotation={[Math.PI / 2, 0, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          handleHover(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          handleHover(false);
          document.body.style.cursor = '';
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
      >
        <primitive ref={matRef} object={material} attach="material" />
      </mesh>

      {/* Glyph — pause bars (playing) or play triangle (paused). */}
      {isPaused ? (
        <mesh position={[0, 0, DEPTH / 2 + 0.001]}>
          <coneGeometry args={[SIZE * 0.45, SIZE * 0.7, 3]} />
          <meshBasicMaterial color="#0A0E16" toneMapped={false} />
        </mesh>
      ) : (
        <group position={[0, 0, DEPTH / 2 + 0.001]}>
          <mesh position={[-SIZE * 0.18, 0, 0]}>
            <boxGeometry args={[SIZE * 0.14, SIZE * 0.55, 0.005]} />
            <meshBasicMaterial color="#0A0E16" toneMapped={false} />
          </mesh>
          <mesh position={[SIZE * 0.18, 0, 0]}>
            <boxGeometry args={[SIZE * 0.14, SIZE * 0.55, 0.005]} />
            <meshBasicMaterial color="#0A0E16" toneMapped={false} />
          </mesh>
        </group>
      )}

      {/* Hidden HTML proxy for screen readers + keyboard navigation */}
      <Html position={[0, 0, 0]} style={{ pointerEvents: 'none' }}>
        <button
          type="button"
          aria-label={isPaused ? 'Resume game' : 'Pause game'}
          aria-pressed={isPaused}
          aria-keyshortcuts="P Escape"
          onClick={handleClick}
          style={{
            position: 'absolute',
            clip: 'rect(0 0 0 0)',
            width: 1,
            height: 1,
            overflow: 'hidden',
            pointerEvents: 'auto',
          }}
        />
      </Html>
    </group>
  );
}
