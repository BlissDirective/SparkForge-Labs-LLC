// ════════════════════════════════════════════════════════════════
// CONTENT FILTER CARD — Age-Appropriate Content Controls (Phase 5)
// ════════════════════════════════════════════════════════════════
// Toggle-based content filtering settings organized by category.
// Parents can enable/disable game categories, set maturity filters,
// and manage AI chat permissions per child.

'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Gamepad2, MessageCircle, BookOpen, ShieldCheck } from 'lucide-react';
import { SFCard } from '@/components/ui/SFCard';

interface FilterCategory {
  id: string;
  label: string;
  description: string;
  icon: typeof Eye;
  enabled: boolean;
  color: string;
}

interface ContentFilterCardProps {
  childName: string;
  ageBand: 'A' | 'B' | 'C';
  onUpdateFilters?: (filters: Record<string, boolean>) => void;
}

const AGE_LABELS: Record<string, string> = {
  A: 'Ages 5–7 (Beginner)',
  B: 'Ages 8–10 (Intermediate)',
  C: 'Ages 11–13 (Advanced)',
};

export default function ContentFilterCard({
  childName,
  ageBand,
  onUpdateFilters,
}: ContentFilterCardProps) {
  const [filters, setFilters] = useState<FilterCategory[]>([
    {
      id: 'flagship_games',
      label: 'Flagship Games',
      description: 'Full 3D immersive experiences',
      icon: Gamepad2,
      enabled: true,
      color: '#E945F5',
    },
    {
      id: 'ai_tutor_chat',
      label: 'AI Tutor Chat',
      description: 'Personalized AI learning assistant',
      icon: MessageCircle,
      enabled: true,
      color: '#4F6EF7',
    },
    {
      id: 'advanced_labs',
      label: 'Advanced Labs',
      description: 'Complex projects for older kids',
      icon: BookOpen,
      enabled: ageBand !== 'A',
      color: '#FF6B35',
    },
    {
      id: 'social_features',
      label: 'Social Features',
      description: 'Leaderboards and achievements sharing',
      icon: ShieldCheck,
      enabled: ageBand !== 'A',
      color: '#2ECC71',
    },
  ]);

  const toggleFilter = useCallback((id: string) => {
    setFilters((prev) => {
      const updated = prev.map((f) =>
        f.id === id ? { ...f, enabled: !f.enabled } : f
      );
      if (onUpdateFilters) {
        const filterMap: Record<string, boolean> = {};
        updated.forEach((f) => { filterMap[f.id] = f.enabled; });
        onUpdateFilters(filterMap);
      }
      return updated;
    });
  }, [onUpdateFilters]);

  return (
    <SFCard variant="elevated" className="p-5">
      <div className="flex items-center gap-2 mb-1">
        <Eye className="w-5 h-5" style={{ color: '#2ECC71' }} />
        <h3 className="text-base font-bold" style={{ color: '#1A1D2B', fontFamily: 'var(--font-display)' }}>
          Content Filter
        </h3>
      </div>

      <p className="text-sm mb-1" style={{ color: '#5A6078' }}>
        Content settings for <strong style={{ color: '#1A1D2B' }}>{childName}</strong>
      </p>
      <p className="text-xs mb-4" style={{ color: '#8C94AC' }}>
        Age band: {AGE_LABELS[ageBand] || ageBand}
      </p>

      {/* Filter toggles */}
      <div className="space-y-3">
        {filters.map((filter, index) => {
          const Icon = filter.icon;
          const isEnabled = filter.enabled;

          return (
            <motion.div
              key={filter.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="flex items-center justify-between p-3 rounded-xl transition-colors"
              style={{ background: isEnabled ? `${filter.color}10` : '#F8F7FF' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: isEnabled ? `${filter.color}20` : '#EEF0F8' }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: isEnabled ? filter.color : '#8C94AC' }}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: isEnabled ? '#1A1D2B' : '#8C94AC' }}>
                    {filter.label}
                  </p>
                  <p className="text-xs" style={{ color: '#8C94AC' }}>
                    {filter.description}
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                onClick={() => toggleFilter(filter.id)}
                className={`relative w-12 h-7 rounded-full transition-colors focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-offset-2`}
                style={{
                  background: isEnabled ? filter.color : '#D1D5DB',
                  focusVisibleRingColor: filter.color,
                }}
                role="switch"
                aria-checked={isEnabled}
                aria-label={`Toggle ${filter.label}`}
              >
                <motion.div
                  className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm"
                  animate={{ left: isEnabled ? 24 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
                {isEnabled ? (
                  <Eye className="absolute left-1.5 top-1.5 w-4 h-4 text-white/60" />
                ) : (
                  <EyeOff className="absolute right-1.5 top-1.5 w-4 h-4 text-white/40" />
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* COPPA notice */}
      <div
        className="mt-4 p-3 rounded-xl text-xs flex items-start gap-2"
        style={{ background: '#4F6EF710', color: '#4F6EF7' }}
      >
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          All content is COPPA-compliant. AI interactions are filtered for age-appropriateness
          and never store personal identifying information.
        </span>
      </div>
    </SFCard>
  );
}
