// ════════════════════════════════════════════════════
// ACCESSIBILITY TOOLBAR — Settings panel for a11y
// Toggle switches for all accessibility preferences
// ════════════════════════════════════════════════════

'use client';

import { motion } from 'motion/react';
import { useA11yStore } from '@/stores/accessibilityStore';
import { Moon, Type, Eye, Zap } from 'lucide-react';

export function AccessibilityToolbar() {
  const {
    fontSize,
    setFontSize,
    dyslexiaFont,
    toggleDyslexiaFont,
    reduceMotion,
    toggleReduceMotion,
    highContrast,
    toggleHighContrast,
  } = useA11yStore();

  return (
    <div className="space-y-4">
      <h3 className="font-display text-sm font-bold text-white/80 flex items-center gap-2">
        <span
          className="w-1 h-4 rounded-full bg-neon-blue"
          aria-hidden="true"
        />
        Accessibility
      </h3>

      {/* Dark Mode — disabled per CLAUDE.md: SparkForge is dark-mode only.
         The toggle is rendered but non-interactive to maintain layout consistency.
         Light mode is not supported in the Frost-Prismatic design system. */}
      <ToggleRow
        icon={<Moon className="w-4 h-4" />}
        label="Dark Mode (Always On)"
        active={true}
        onToggle={() => { /* Dark-mode only — toggle disabled */ }}
      />

      {/* Font Size */}
      <div className="flex items-center gap-3">
        <Type className="w-4 h-4 text-white/40" aria-hidden="true" />
        <span className="font-body text-xs text-white/50 flex-1">
          Text Size
        </span>
        <div className="flex gap-1" role="radiogroup" aria-label="Font size">
          {(['normal', 'large', 'xl'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFontSize(s)}
              className={`px-2.5 py-1 rounded-lg font-body font-bold transition-colors ${
                fontSize === s
                  ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                  : 'bg-white/5 text-white/30 border border-white/10 hover:bg-white/10'
              }`}
              style={{
                fontSize: s === 'normal' ? '10px' : s === 'large' ? '12px' : '14px',
              }}
              role="radio"
              aria-checked={fontSize === s}
              aria-label={`Font size ${s}`}
            >
              A
            </button>
          ))}
        </div>
      </div>

      {/* Dyslexia Font */}
      <ToggleRow
        icon={<Type className="w-4 h-4" />}
        label="Dyslexia-Friendly Font"
        active={dyslexiaFont}
        onToggle={toggleDyslexiaFont}
      />

      {/* Reduce Motion */}
      <ToggleRow
        icon={<Zap className="w-4 h-4" />}
        label="Reduce Motion"
        active={reduceMotion}
        onToggle={toggleReduceMotion}
      />

      {/* High Contrast */}
      <ToggleRow
        icon={<Eye className="w-4 h-4" />}
        label="High Contrast"
        active={highContrast}
        onToggle={toggleHighContrast}
      />
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  active,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-3 w-full group"
      role="switch"
      aria-checked={active}
      aria-label={label}
    >
      <span className="text-white/40 group-hover:text-white/60 transition-colors">
        {icon}
      </span>
      <span className="font-body text-xs text-white/50 flex-1 text-left">
        {label}
      </span>
      <div
        className={`w-9 h-5 rounded-full transition-colors relative ${
          active ? 'bg-neon-blue shadow-glow-blue' : 'bg-white/20'
        }`}
      >
        <motion.div
          className="w-4 h-4 rounded-full bg-white absolute top-0.5"
          animate={{ left: active ? 18 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}
