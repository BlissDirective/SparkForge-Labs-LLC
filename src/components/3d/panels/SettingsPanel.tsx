'use client';

// ════════════════════════════════════════════════════════════════
// SettingsPanel — Settings Center Content
// ════════════════════════════════════════════════════════════════
// Decision 28.1: Column layout — Audio left half, Visual right half, Skin full-width below
// Decision 28.2: Skin selector — 5 preview HolographicCards with visual preview

import { useCallback } from 'react';
import { Text } from '@react-three/drei';
import { ToggleSwitch3D } from '../ui/ToggleSwitch3D';
import { RadialDial3D } from '../ui/RadialDial3D';
import { HolographicButton } from '../ui/HolographicButton';
import { HolographicCard } from '../ui/HolographicCard';
import { useUIStore } from '@/stores/uiStore';
import { useCockpitStore } from '@/stores/cockpitStore';
import type { CockpitSkin } from '@/types';
import {
  TYPE_SCALE,
  CHROME_BORDER,
} from '@/lib/3d/cockpitDesignTokens';

const PARTICLE_OPTIONS = ['Off', 'Low', 'Med', 'High'] as const;
const PARTICLE_MAP: Record<string, 'off' | 'low' | 'medium' | 'high'> = {
  Off: 'off', Low: 'low', Med: 'medium', High: 'high',
};

const SKIN_LIST: CockpitSkin[] = ['default', 'cyberpunk', 'space', 'underwater', 'crystal'];
const SKIN_COLORS: Record<string, string> = {
  default: '#00BBFF', cyberpunk: '#FF6644', space: '#AA66FF',
  underwater: '#06B6D4', crystal: '#D946EF',
};

export default function SettingsPanel() {
  const soundEnabled = useUIStore((s) => s.soundEnabled);
  const toggleSound = useUIStore((s) => s.toggleSound);
  const skipIntroAnimation = useUIStore((s) => s.skipIntroAnimation);
  const setSkipIntroAnimation = useUIStore((s) => s.setSkipIntroAnimation);
  const particleIntensity = useUIStore((s) => s.particleIntensity);
  const setParticleIntensity = useUIStore((s) => s.setParticleIntensity);

  const cockpitAudioEnabled = useCockpitStore((s) => s.cockpitAudioEnabled);
  const setCockpitAudio = useCockpitStore((s) => s.setCockpitAudio);
  const ambientVolume = useCockpitStore((s) => s.ambientVolume);
  const setAmbientVolume = useCockpitStore((s) => s.setAmbientVolume);
  const cockpitSkin = useCockpitStore((s) => s.cockpitSkin);
  const setCockpitSkin = useCockpitStore((s) => s.setCockpitSkin);
  const unlockedSkins = useCockpitStore((s) => s.unlockedSkins);

  const handleSoundToggle = useCallback((_v: boolean) => toggleSound(), [toggleSound]);
  const handleSkipToggle = useCallback((v: boolean) => setSkipIntroAnimation(v), [setSkipIntroAnimation]);

  return (
    <group name="settings">
      {/* ═══ Left Column: Audio Controls (Decision 28.1) ═══ */}
      <group position={[-0.35, 0.45, 0]}>
        <Text
          position={[0.12, 0.12, 0]}
          fontSize={TYPE_SCALE.h3.fontSize}
          color="#FFAA44"
          anchorX="center"
          font={TYPE_SCALE.h3.fontPath}
        >
          Audio
        </Text>
        {/* Chrome divider bar */}
        <mesh position={[0.3, 0.1, 0]}>
          <boxGeometry args={[0.25, 0.002, 0.003]} />
          <meshStandardMaterial color={CHROME_BORDER.colorHex} metalness={0.95} roughness={0.15} />
        </mesh>

        <ToggleSwitch3D id="master-audio" label="Master" value={soundEnabled} onChange={handleSoundToggle} position={[0, 0, 0]} />
        <ToggleSwitch3D id="cockpit-ambient" label="Ambient" value={cockpitAudioEnabled} onChange={(v) => setCockpitAudio(v)} position={[0, -0.08, 0]} />
        <RadialDial3D id="volume" label="VOL" value={ambientVolume} min={0} max={1} onChange={setAmbientVolume} color="#FFAA44" position={[0.12, -0.2, 0]} scale={0.7} />
      </group>

      {/* ═══ Right Column: Visual Controls (Decision 28.1) ═══ */}
      <group position={[0.15, 0.45, 0]}>
        <Text
          position={[0.12, 0.12, 0]}
          fontSize={TYPE_SCALE.h3.fontSize}
          color="#FFAA44"
          anchorX="center"
          font={TYPE_SCALE.h3.fontPath}
        >
          Visual
        </Text>
        <mesh position={[0.3, 0.1, 0]}>
          <boxGeometry args={[0.25, 0.002, 0.003]} />
          <meshStandardMaterial color={CHROME_BORDER.colorHex} metalness={0.95} roughness={0.15} />
        </mesh>

        <ToggleSwitch3D id="skip-hero" label="Skip Intro" value={skipIntroAnimation} onChange={handleSkipToggle} position={[0, 0, 0]} />

        <group position={[0, -0.1, 0]}>
          {PARTICLE_OPTIONS.map((opt, i) => {
            const mapped = PARTICLE_MAP[opt];
            return (
              <HolographicButton
                key={opt}
                id={`particles-${opt}`}
                label={opt}
                color={particleIntensity === mapped ? '#FFAA44' : '#444444'}
                active={particleIntensity === mapped}
                onClick={() => setParticleIntensity(mapped)}
                position={[i * 0.085, 0, 0]}
                size="sm"
                scale={0.6}
              />
            );
          })}
        </group>
      </group>

      {/* ═══ Full-Width: Cockpit Skin Selector (Decision 28.2) ═══ */}
      <group position={[-0.35, -0.25, 0]}>
        <Text
          position={[0.35, 0.12, 0]}
          fontSize={TYPE_SCALE.h3.fontSize}
          color="#FFAA44"
          anchorX="center"
          font={TYPE_SCALE.h3.fontPath}
        >
          Cockpit Skin
        </Text>
        <mesh position={[0.6, 0.1, 0]}>
          <boxGeometry args={[0.35, 0.002, 0.003]} />
          <meshStandardMaterial color={CHROME_BORDER.colorHex} metalness={0.95} roughness={0.15} />
        </mesh>

        {/* 5 preview HolographicCards */}
        {SKIN_LIST.map((skin, i) => {
          const unlocked = unlockedSkins.includes(skin);
          const active = cockpitSkin === skin;
          const skinColor = SKIN_COLORS[skin] ?? '#00BBFF';
          return (
            <HolographicCard
              key={skin}
              title={skin.charAt(0).toUpperCase() + skin.slice(1)}
              subtitle={unlocked ? (active ? 'ACTIVE' : 'UNLOCKED') : 'LOCKED'}
              color={active ? skinColor : unlocked ? '#666666' : '#333333'}
              active={active}
              onClick={() => unlocked && setCockpitSkin(skin)}
              position={[i * 0.15, 0, 0]}
              width={0.13}
              height={0.08}
              scale={0.9}
            />
          );
        })}
      </group>
    </group>
  );
}
