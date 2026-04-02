'use client';

// ════════════════════════════════════════════════════════════════
// DashboardRight — Control & Monitoring Hub (Right Quadrant, FIXED)
// ════════════════════════════════════════════════════════════════
// Per SparkForge-Full-ControlScreen.json §right_quadrant:
//   - Settings panel (compact): 2 toggles + 2 dials
//   - Activity log (scrollable, 20 items max)
//   - Quick actions (4 buttons: Continue, Daily, Guide, Parent)
//
// Always visible. Content is about WHAT'S HAPPENING and WHAT YOU CAN CONTROL.
// Position/rotation handled by CockpitUILayer parent group.

import { useCallback } from 'react';
import { Text } from '@react-three/drei';
import { ToggleSwitch3D } from '../ui/ToggleSwitch3D';
import { RadialDial3D } from '../ui/RadialDial3D';
import { HolographicButton } from '../ui/HolographicButton';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useUIStore } from '@/stores/uiStore';

export default function DashboardRight() {
  // Settings bindings
  const cockpitAudioEnabled = useCockpitStore((s) => s.cockpitAudioEnabled);
  const setCockpitAudio = useCockpitStore((s) => s.setCockpitAudio);
  const ambientVolume = useCockpitStore((s) => s.ambientVolume);
  const setAmbientVolume = useCockpitStore((s) => s.setAmbientVolume);
  const brightness = useCockpitStore((s) => s.brightness);
  const setBrightness = useCockpitStore((s) => s.setBrightness);
  const soundEnabled = useUIStore((s) => s.soundEnabled);
  const toggleSound = useUIStore((s) => s.toggleSound);

  const handleSoundToggle = useCallback((_v: boolean) => toggleSound(), [toggleSound]);
  const handleAudioToggle = useCallback((v: boolean) => setCockpitAudio(v), [setCockpitAudio]);

  return (
    <group name="dashboard-right">
      {/* ═══ Settings Panel (compact) ═══ */}
      <group position={[-0.35, 0.35, 0.15]}>
        <Text
          position={[0.15, 0.15, 0]}
          fontSize={0.022}
          color="#F0F0F480"
          anchorX="center"
          font="/fonts/Sora-Regular.woff2"
        >
          CONTROLS
        </Text>

        {/* Toggle: Master Audio */}
        <ToggleSwitch3D
          id="audio-toggle"
          label="Audio"
          value={soundEnabled}
          onChange={handleSoundToggle}
          position={[0, 0.05, 0]}
          scale={0.9}
        />

        {/* Toggle: Cockpit Ambient */}
        <ToggleSwitch3D
          id="ambient-toggle"
          label="Ambient"
          value={cockpitAudioEnabled}
          onChange={handleAudioToggle}
          position={[0.3, 0.05, 0]}
          scale={0.9}
        />

        {/* Dial: Volume */}
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

        {/* Dial: Brightness */}
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

      {/* ═══ Activity Log (placeholder — scrollable feed) ═══ */}
      <group position={[-0.15, -0.15, 0]}>
        <Text
          position={[0, 0.12, 0]}
          fontSize={0.02}
          color="#F0F0F480"
          anchorX="center"
          font="/fonts/Sora-Regular.woff2"
        >
          ACTIVITY
        </Text>
        {/* Activity entries — placeholder chrome cards */}
        {[0, 1, 2].map((i) => (
          <group key={i} position={[0, 0.04 - i * 0.06, 0]}>
            <mesh>
              <planeGeometry args={[0.35, 0.045]} />
              <meshStandardMaterial
                color="#0A0F1F"
                metalness={0.3}
                roughness={0.8}
                transparent
                opacity={0.7}
              />
            </mesh>
            <Text
              position={[0, 0, 0.001]}
              fontSize={0.014}
              color="#F0F0F460"
              anchorX="center"
              font="/fonts/Sora-Regular.woff2"
            >
              {['Awaiting activity...', '', ''][i]}
            </Text>
          </group>
        ))}
      </group>

      {/* ═══ Quick Actions (4 buttons) ═══ */}
      <group position={[-0.25, -0.55, 0]}>
        <Text
          position={[0.15, 0.08, 0]}
          fontSize={0.02}
          color="#F0F0F480"
          anchorX="center"
          font="/fonts/Sora-Regular.woff2"
        >
          QUICK ACTIONS
        </Text>
        <HolographicButton
          id="quick-continue"
          label="Continue"
          color="#00BBFF"
          position={[0, 0, 0]}
          scale={0.6}
          width={0.12}
          height={0.04}
        />
        <HolographicButton
          id="quick-daily"
          label="Daily"
          color="#FFAA44"
          position={[0.15, 0, 0]}
          scale={0.6}
          width={0.12}
          height={0.04}
        />
        <HolographicButton
          id="quick-guide"
          label="Guide"
          color="#AA66FF"
          position={[0, -0.07, 0]}
          scale={0.6}
          width={0.12}
          height={0.04}
        />
        <HolographicButton
          id="quick-parent"
          label="Parent"
          color="#00FF88"
          position={[0.15, -0.07, 0]}
          scale={0.6}
          width={0.12}
          height={0.04}
        />
      </group>
    </group>
  );
}
