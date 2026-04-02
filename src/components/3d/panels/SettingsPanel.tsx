'use client';

// ════════════════════════════════════════════════════════════════
// SettingsPanel — Settings Center Content
// ════════════════════════════════════════════════════════════════
// Per SparkForge-Full-ControlScreen.json §center_console.per_page_content["/settings"]:
//   - Audio Controls: Master Audio toggle, Cockpit Ambient toggle, Volume dial
//   - Visual Controls: Skip Hero Intro toggle, Particle Intensity selector
//   - Cockpit Skin: 5-option selector (default, cyberpunk, space, underwater, crystal)
//
// Uses existing ToggleSwitch3D, RadialDial3D, and HolographicButton components.

import { useCallback } from 'react';
import { Text } from '@react-three/drei';
import { ToggleSwitch3D } from '../ui/ToggleSwitch3D';
import { RadialDial3D } from '../ui/RadialDial3D';
import { HolographicButton } from '../ui/HolographicButton';
import { useUIStore } from '@/stores/uiStore';
import { useCockpitStore, SKIN_UNLOCK_CONDITIONS } from '@/stores/cockpitStore';
import type { CockpitSkin } from '@/types';

const PARTICLE_OPTIONS = ['Off', 'Low', 'Med', 'High'] as const;
const PARTICLE_MAP: Record<string, 'off' | 'low' | 'medium' | 'high'> = {
  Off: 'off', Low: 'low', Med: 'medium', High: 'high',
};

const SKIN_LIST: CockpitSkin[] = ['default', 'cyberpunk', 'space', 'underwater', 'crystal'];

export default function SettingsPanel() {
  // Audio bindings
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
      {/* ═══ Section: Audio Controls ═══ */}
      <group position={[-0.3, 0.5, 0]}>
        <Text
          position={[0.2, 0.12, 0]}
          fontSize={0.028}
          color="#FFAA44"
          anchorX="center"
          font="/fonts/Exo2-Bold.woff2"
        >
          Audio Controls
        </Text>

        <ToggleSwitch3D
          id="master-audio"
          label="Master"
          value={soundEnabled}
          onChange={handleSoundToggle}
          position={[0, 0, 0]}
        />
        <ToggleSwitch3D
          id="cockpit-ambient"
          label="Ambient"
          value={cockpitAudioEnabled}
          onChange={(v) => setCockpitAudio(v)}
          position={[0.25, 0, 0]}
        />
        <RadialDial3D
          id="volume"
          label="VOL"
          value={ambientVolume}
          min={0}
          max={1}
          onChange={setAmbientVolume}
          color="#FFAA44"
          position={[0.45, 0, 0]}
          scale={0.8}
        />
      </group>

      {/* ═══ Section: Visual Controls ═══ */}
      <group position={[-0.3, 0.1, 0]}>
        <Text
          position={[0.2, 0.12, 0]}
          fontSize={0.028}
          color="#FFAA44"
          anchorX="center"
          font="/fonts/Exo2-Bold.woff2"
        >
          Visual Controls
        </Text>

        <ToggleSwitch3D
          id="skip-hero"
          label="Skip Intro"
          value={skipIntroAnimation}
          onChange={handleSkipToggle}
          position={[0, 0, 0]}
        />

        {/* Particle intensity selector */}
        <group position={[0.25, -0.02, 0]}>
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
                scale={0.5}
                width={0.07}
                height={0.035}
              />
            );
          })}
        </group>
      </group>

      {/* ═══ Section: Cockpit Skin ═══ */}
      <group position={[-0.3, -0.35, 0]}>
        <Text
          position={[0.2, 0.12, 0]}
          fontSize={0.028}
          color="#FFAA44"
          anchorX="center"
          font="/fonts/Exo2-Bold.woff2"
        >
          Cockpit Skin
        </Text>

        {SKIN_LIST.map((skin, i) => {
          const unlocked = unlockedSkins.includes(skin);
          const active = cockpitSkin === skin;
          return (
            <HolographicButton
              key={skin}
              id={`skin-${skin}`}
              label={skin.charAt(0).toUpperCase() + skin.slice(1)}
              color={active ? '#FFAA44' : unlocked ? '#666666' : '#333333'}
              active={active}
              onClick={() => unlocked && setCockpitSkin(skin)}
              position={[i * 0.1, 0, 0]}
              scale={0.55}
              width={0.085}
              height={0.04}
            />
          );
        })}
      </group>
    </group>
  );
}
