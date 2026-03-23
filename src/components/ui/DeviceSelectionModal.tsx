'use client';

// ════════════════════════════════════════════════════
// DeviceSelectionModal — First-Launch Device Prompt
// ════════════════════════════════════════════════════
// Appears once on first visit. User selects their
// device type to optimize FPS and 3D quality.
// Choice persists in localStorage via deviceStore.
// Can be changed later in Settings.

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDeviceStore, type DeviceType } from '@/stores/deviceStore';

const DEVICE_OPTIONS: {
  type: DeviceType;
  icon: string;
  label: string;
  description: string;
  fpsLabel: string;
}[] = [
  {
    type: 'desktop',
    icon: '🖥️',
    label: 'Computer',
    description: 'Desktop or laptop with dedicated GPU. Maximum visual quality with full 3D effects, shadows, and high particle counts.',
    fpsLabel: '60 FPS — Full Quality',
  },
  {
    type: 'tablet',
    icon: '📱',
    label: 'Tablet',
    description: 'iPad, Android tablet, or 2-in-1 device. Balanced visuals with optimized effects for smooth performance.',
    fpsLabel: '45 FPS — Balanced',
  },
  {
    type: 'mobile',
    icon: '📲',
    label: 'Phone',
    description: 'Smartphone or low-power device. Streamlined 3D with essential effects for the best battery life and smoothness.',
    fpsLabel: '30 FPS — Power Saver',
  },
];

export function DeviceSelectionModal() {
  const hasSelected = useDeviceStore((s) => s.hasSelected);
  const setDeviceType = useDeviceStore((s) => s.setDeviceType);
  const [hoveredType, setHoveredType] = useState<DeviceType | null>(null);
  const [selectedType, setSelectedType] = useState<DeviceType | null>(null);

  // Don't render if user already selected
  if (hasSelected) return null;

  const handleSelect = (type: DeviceType) => {
    setSelectedType(type);
    // Brief delay for the selection animation before dismissing
    setTimeout(() => {
      setDeviceType(type);
    }, 400);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-[#0A0E16]/95 backdrop-blur-md" />

        {/* Modal */}
        <motion.div
          className="relative z-10 w-full max-w-2xl mx-4"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.1 }}
        >
          {/* Chrome bezel frame */}
          <div
            className="rounded-2xl p-[1px]"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04), rgba(255,255,255,0.08))',
            }}
          >
            <div className="rounded-2xl bg-[#111118] p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <motion.h2
                  className="font-display text-2xl text-white mb-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Welcome to SparkForge
                </motion.h2>
                <motion.p
                  className="font-body text-white/60 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Select your device type for the best experience
                </motion.p>
              </div>

              {/* Device Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {DEVICE_OPTIONS.map((option, index) => {
                  const isSelected = selectedType === option.type;
                  const isHovered = hoveredType === option.type;

                  return (
                    <motion.button
                      key={option.type}
                      className={`
                        relative rounded-xl p-5 text-left transition-all duration-200
                        border focus:outline-none focus:ring-2 focus:ring-[#00BBFF]/50
                        ${isSelected
                          ? 'border-[#00BBFF] bg-[#00BBFF]/10'
                          : isHovered
                            ? 'border-white/20 bg-white/5'
                            : 'border-white/6 bg-[#1A1822]'
                        }
                      `}
                      onMouseEnter={() => setHoveredType(option.type)}
                      onMouseLeave={() => setHoveredType(null)}
                      onClick={() => handleSelect(option.type)}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      aria-label={`Select ${option.label} — ${option.fpsLabel}`}
                      disabled={selectedType !== null}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <motion.div
                          className="absolute inset-0 rounded-xl border-2 border-[#00BBFF]"
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', damping: 20 }}
                        />
                      )}

                      {/* Icon */}
                      <div className="text-3xl mb-3" aria-hidden="true">
                        {option.icon}
                      </div>

                      {/* Label */}
                      <h3 className="font-display text-lg text-white mb-1">
                        {option.label}
                      </h3>

                      {/* FPS badge */}
                      <div
                        className={`
                          inline-block rounded-full px-2.5 py-0.5 text-xs font-data mb-3
                          ${isSelected
                            ? 'bg-[#00BBFF]/20 text-[#00BBFF]'
                            : 'bg-white/5 text-white/50'
                          }
                        `}
                      >
                        {option.fpsLabel}
                      </div>

                      {/* Description */}
                      <p className="font-body text-xs text-white/40 leading-relaxed">
                        {option.description}
                      </p>
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer note */}
              <motion.p
                className="text-center font-body text-xs text-white/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                You can change this anytime in Settings
              </motion.p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
