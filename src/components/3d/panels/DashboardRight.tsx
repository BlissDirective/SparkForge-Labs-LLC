'use client';

// ════════════════════════════════════════════════════════════════
// DashboardRight — Control & Monitoring Hub (Right Quadrant, FIXED)
// ════════════════════════════════════════════════════════════════
// Decision 23.1: Mini cards — activity items with chrome border
// Decision 23.2: Horizontal row — 4 quick action buttons in single row
// Decision 23.3: Collapsed header — settings panel starts collapsed
//
// Always visible. Content is about WHAT'S HAPPENING and WHAT YOU CAN CONTROL.

import { useCallback, useState } from 'react';
import { Text } from '@react-three/drei';
import { ToggleSwitch3D } from '../ui/ToggleSwitch3D';
import { RadialDial3D } from '../ui/RadialDial3D';
import { HolographicButton } from '../ui/HolographicButton';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useUIStore } from '@/stores/uiStore';
import {
  CHROME_BORDER,
  TYPE_SCALE,
  TEXT_COLORS,
  MAX_VISIBLE_ITEMS,
  GHOST_PLACEHOLDER_OPACITY,
} from '@/lib/3d/cockpitDesignTokens';

export default function DashboardRight() {
  const cockpitAudioEnabled = useCockpitStore((s) => s.cockpitAudioEnabled);
  const setCockpitAudio = useCockpitStore((s) => s.setCockpitAudio);
  const ambientVolume = useCockpitStore((s) => s.ambientVolume);
  const setAmbientVolume = useCockpitStore((s) => s.setAmbientVolume);
  const brightness = useCockpitStore((s) => s.brightness);
  const setBrightness = useCockpitStore((s) => s.setBrightness);
  const soundEnabled = useUIStore((s) => s.soundEnabled);
  const toggleSound = useUIStore((s) => s.toggleSound);

  // Decision 23.3: Collapsed settings header
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  const handleSoundToggle = useCallback((_v: boolean) => toggleSound(), [toggleSound]);
  const handleAudioToggle = useCallback((v: boolean) => setCockpitAudio(v), [setCockpitAudio]);

  return (
    <group name="dashboard-right">
      {/* ═══ Settings — Collapsed Header (Decision 23.3) ═══ */}
      <group position={[-0.35, 0.4, 0.15]}>
        <HolographicButton
          id="settings-toggle"
          label={settingsExpanded ? 'CONTROLS ▾' : 'CONTROLS ▸'}
          color="#FFAA44"
          position={[0.15, 0.15, 0]}
          size="sm"
          onClick={() => setSettingsExpanded(!settingsExpanded)}
        />

        {/* Expandable settings controls */}
        {settingsExpanded && (
          <group position={[0, 0, 0]}>
            <ToggleSwitch3D
              id="audio-toggle"
              label="Audio"
              value={soundEnabled}
              onChange={handleSoundToggle}
              position={[0, 0.05, 0]}
              scale={0.9}
            />
            <ToggleSwitch3D
              id="ambient-toggle"
              label="Ambient"
              value={cockpitAudioEnabled}
              onChange={handleAudioToggle}
              position={[0.3, 0.05, 0]}
              scale={0.9}
            />
            <RadialDial3D
              id="volume-dial"
              label="VOL"
              value={ambientVolume}
              min={0}
              max={1}
              onChange={setAmbientVolume}
              color="#00BBFF"
              position={[0, -0.12, 0]}
              scale={0.7}
            />
            <RadialDial3D
              id="brightness-dial"
              label="BRT"
              value={brightness}
              min={0}
              max={1}
              onChange={setBrightness}
              color="#FFAA44"
              position={[0.3, -0.12, 0]}
              scale={0.7}
            />
          </group>
        )}
      </group>

      {/* ═══ Activity Log — Mini Cards (Decision 23.1) ═══ */}
      <group position={[-0.15, -0.05, 0]}>
        <Text
          position={[0, 0.12, 0]}
          fontSize={TYPE_SCALE.caption.fontSize}
          color={TEXT_COLORS.muted.hex}
          anchorX="center"
          font={TYPE_SCALE.caption.fontPath}
          fillOpacity={TEXT_COLORS.muted.opacity}
        >
          ACTIVITY
        </Text>
        {/* Activity mini cards with chrome border */}
        {Array.from({ length: MAX_VISIBLE_ITEMS.activityLog }, (_, i) => (
          <group key={i} position={[0, 0.04 - i * 0.06, 0]}>
            {/* Chrome border card */}
            <mesh>
              <planeGeometry args={[0.36, 0.048]} />
              <meshStandardMaterial
                color={CHROME_BORDER.colorHex}
                metalness={0.9}
                roughness={0.2}
                transparent
                opacity={0.15}
              />
            </mesh>
            {/* Card inner surface */}
            <mesh position={[0, 0, 0.001]}>
              <planeGeometry args={[0.35, 0.042]} />
              <meshStandardMaterial
                color="#0A0F1F"
                metalness={0.3}
                roughness={0.8}
                transparent
                opacity={0.7}
              />
            </mesh>
            <Text
              position={[0, 0, 0.002]}
              fontSize={TYPE_SCALE.caption.fontSize}
              color={TEXT_COLORS.dim.hex}
              anchorX="center"
              font={TYPE_SCALE.caption.fontPath}
              fillOpacity={i === 0 ? TEXT_COLORS.muted.opacity : GHOST_PLACEHOLDER_OPACITY}
            >
              {i === 0 ? 'Awaiting activity...' : ''}
            </Text>
          </group>
        ))}
      </group>

      {/* ═══ Quick Actions — Horizontal Row (Decision 23.2) ═══ */}
      <group position={[-0.25, -0.55, 0]}>
        <Text
          position={[0.2, 0.08, 0]}
          fontSize={TYPE_SCALE.caption.fontSize}
          color={TEXT_COLORS.muted.hex}
          anchorX="center"
          font={TYPE_SCALE.caption.fontPath}
          fillOpacity={TEXT_COLORS.muted.opacity}
        >
          QUICK ACTIONS
        </Text>
        {/* 4 buttons in single horizontal row */}
        <HolographicButton id="quick-continue" label="Continue" color="#00BBFF" position={[0, 0, 0]} size="sm" scale={0.7} />
        <HolographicButton id="quick-daily" label="Daily" color="#FFAA44" position={[0.1, 0, 0]} size="sm" scale={0.7} />
        <HolographicButton id="quick-guide" label="Guide" color="#AA66FF" position={[0.2, 0, 0]} size="sm" scale={0.7} />
        <HolographicButton id="quick-parent" label="Parent" color="#00FF88" position={[0.3, 0, 0]} size="sm" scale={0.7} />
      </group>
    </group>
  );
}
