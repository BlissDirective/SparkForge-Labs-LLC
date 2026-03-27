'use client';

// ════════════════════════════════════════════════════
// SETTINGS PAGE — 3D-Embedded Cockpit Controls
// ════════════════════════════════════════════════════
// Stage 4: Settings page for cockpit preferences.
// Camera flies to left console zone on mount.
//
// 3D Integration:
//   - setSkipIntroAnimation() → uiStore → HeroAnimation
//   - toggleSound() → uiStore → CockpitAudioEngine mutes/unmutes
//   - setParticleIntensity() → uiStore → ambient particles adjust
//   - cockpitStore.setCockpitSkin() → full cockpit re-texture
//
// Resolves S4-WARN-003 (missing settings page)
// Resolves S3-INFO-3D-002 (setSkipIntroAnimation no UI)

import { useEffect } from 'react';
import { motion } from 'motion/react';
import { useUIStore } from '@/stores/uiStore';
import { useCockpitStore } from '@/stores/cockpitStore';
import { SKIN_UNLOCK_CONDITIONS } from '@/stores/cockpitStore';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { Volume2, VolumeX, Sparkles, Film, Monitor, Palette } from 'lucide-react';
import type { CockpitSkin } from '@/types';

const PARTICLE_OPTIONS = [
  { value: 'off' as const, label: 'Off', description: 'No ambient particles' },
  { value: 'low' as const, label: 'Low', description: 'Subtle ambiance' },
  { value: 'medium' as const, label: 'Medium', description: 'Balanced (default)' },
  { value: 'high' as const, label: 'High', description: 'Maximum spectacle' },
];

const SKIN_OPTIONS: { id: CockpitSkin; label: string; color: string; icon: string }[] = [
  { id: 'default', label: 'Frost-Prismatic', color: '#00BBFF', icon: '❄️' },
  { id: 'cyberpunk', label: 'Cyberpunk', color: '#FF00FF', icon: '🌃' },
  { id: 'space', label: 'Deep Space', color: '#4444FF', icon: '🌌' },
  { id: 'underwater', label: 'Oceanic', color: '#00BBFF', icon: '🌊' },
  { id: 'crystal', label: 'Crystal Cave', color: '#AA66FF', icon: '💎' },
];

export default function SettingsPage() {
  const {
    soundEnabled, toggleSound,
    skipIntroAnimation, setSkipIntroAnimation,
    particleIntensity, setParticleIntensity,
    setLabColor,
  } = useUIStore();

  const {
    cockpitSkin, setCockpitSkin,
    unlockedSkins,
    cockpitAudioEnabled, setCockpitAudio,
    ambientVolume, setAmbientVolume,
  } = useCockpitStore();

  // Set cockpit to settings amber on mount
  useEffect(() => {
    setLabColor('#FFAA44');
  }, [setLabColor]);

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6 max-w-2xl mx-auto"
      role="main"
      aria-label="SparkForge Settings"
    >
      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="font-display text-2xl font-bold text-white drop-shadow-[0_0_12px_rgba(255,170,68,0.3)]">
          Settings
        </h1>
        <p className="font-mono text-xs text-spark-orange/60 tracking-wider mt-1">
          COCKPIT CONFIGURATION · PREFERENCES
        </p>
      </motion.div>

      {/* ═══ Sound Controls ═══ */}
      <motion.div variants={staggerItem} className="rounded-xl p-5 backdrop-blur-md border border-white/[0.06] bg-surface-card/50 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Volume2 className="w-4 h-4 text-neon-blue" />
          <h2 className="font-display font-bold text-white text-sm">Audio</h2>
        </div>

        {/* Master sound toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-sm text-white/80">Master Sound</p>
            <p className="font-mono text-[10px] text-white/30">Game sounds + cockpit audio</p>
          </div>
          <button
            onClick={toggleSound}
            className={`w-12 h-6 rounded-full transition-all relative ${
              soundEnabled ? 'bg-neon-blue/30 border-neon-blue/50' : 'bg-white/10 border-white/20'
            } border`}
            role="switch"
            aria-checked={soundEnabled}
            aria-label="Toggle master sound"
          >
            <div className={`w-4 h-4 rounded-full transition-all absolute top-0.5 ${
              soundEnabled ? 'left-6 bg-neon-blue' : 'left-1 bg-white/40'
            }`} />
          </button>
        </div>

        {/* Cockpit ambient audio */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-sm text-white/80">Cockpit Ambient</p>
            <p className="font-mono text-[10px] text-white/30">Background cockpit sounds</p>
          </div>
          <button
            onClick={() => setCockpitAudio(!cockpitAudioEnabled)}
            className={`w-12 h-6 rounded-full transition-all relative ${
              cockpitAudioEnabled ? 'bg-neon-blue/30 border-neon-blue/50' : 'bg-white/10 border-white/20'
            } border`}
            role="switch"
            aria-checked={cockpitAudioEnabled}
            aria-label="Toggle cockpit ambient audio"
          >
            <div className={`w-4 h-4 rounded-full transition-all absolute top-0.5 ${
              cockpitAudioEnabled ? 'left-6 bg-neon-blue' : 'left-1 bg-white/40'
            }`} />
          </button>
        </div>

        {/* Ambient volume slider */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="font-body text-sm text-white/80">Ambient Volume</p>
            <span className="font-data text-xs text-neon-blue">{Math.round(ambientVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={ambientVolume}
            onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
            className="w-full accent-neon-blue"
            aria-label="Ambient volume"
          />
        </div>
      </motion.div>

      {/* ═══ Visual Controls ═══ */}
      <motion.div variants={staggerItem} className="rounded-xl p-5 backdrop-blur-md border border-white/[0.06] bg-surface-card/50 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Monitor className="w-4 h-4 text-spark-purple" />
          <h2 className="font-display font-bold text-white text-sm">Visual</h2>
        </div>

        {/* Skip intro animation */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-sm text-white/80">Skip Intro Animation</p>
            <p className="font-mono text-[10px] text-white/30">Skip the 19s hero animation on login</p>
          </div>
          <button
            onClick={() => setSkipIntroAnimation(!skipIntroAnimation)}
            className={`w-12 h-6 rounded-full transition-all relative ${
              skipIntroAnimation ? 'bg-spark-purple/30 border-spark-purple/50' : 'bg-white/10 border-white/20'
            } border`}
            role="switch"
            aria-checked={skipIntroAnimation}
            aria-label="Toggle skip intro animation"
          >
            <div className={`w-4 h-4 rounded-full transition-all absolute top-0.5 ${
              skipIntroAnimation ? 'left-6 bg-spark-purple' : 'left-1 bg-white/40'
            }`} />
          </button>
        </div>

        {/* Particle intensity */}
        <div>
          <p className="font-body text-sm text-white/80 mb-2">Particle Intensity</p>
          <div className="grid grid-cols-4 gap-1.5">
            {PARTICLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setParticleIntensity(opt.value)}
                className={`px-2 py-2 rounded-lg border text-xs font-display font-bold transition-all ${
                  particleIntensity === opt.value
                    ? 'border-neon-green/40 bg-neon-green/10 text-neon-green'
                    : 'border-white/[0.06] bg-transparent text-white/40 hover:text-white/60'
                }`}
                aria-pressed={particleIntensity === opt.value}
                aria-label={`${opt.label} particles: ${opt.description}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ═══ Cockpit Skins ═══ */}
      <motion.div variants={staggerItem} className="rounded-xl p-5 backdrop-blur-md border border-white/[0.06] bg-surface-card/50 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-spark-orange" />
          <h2 className="font-display font-bold text-white text-sm">Cockpit Skin</h2>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {SKIN_OPTIONS.map((skin) => {
            const isUnlocked = unlockedSkins.includes(skin.id);
            const isActive = cockpitSkin === skin.id;
            const unlockInfo = SKIN_UNLOCK_CONDITIONS[skin.id];

            return (
              <button
                key={skin.id}
                onClick={() => isUnlocked && setCockpitSkin(skin.id)}
                disabled={!isUnlocked}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                  isActive
                    ? 'border-white/20 bg-white/10'
                    : isUnlocked
                      ? 'border-white/[0.06] bg-transparent hover:bg-white/5 cursor-pointer'
                      : 'border-white/[0.04] bg-transparent opacity-40 cursor-not-allowed'
                }`}
                aria-label={`${skin.label} skin${!isUnlocked ? ' — locked' : ''}${isActive ? ' — active' : ''}`}
              >
                <span className="text-xl">{skin.icon}</span>
                <div className="flex-1">
                  <p className="font-display font-bold text-sm text-white">{skin.label}</p>
                  {!isUnlocked && unlockInfo && (
                    <p className="font-mono text-[9px] text-white/30 mt-0.5">
                      🔒 {unlockInfo.description}
                    </p>
                  )}
                </div>
                {isActive && (
                  <span className="font-data text-[10px] font-bold" style={{ color: skin.color }}>
                    ACTIVE
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
