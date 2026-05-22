// ════════════════════════════════════════════════════════════════
// SETTINGS — Account & App Settings (Phase 3)
// ════════════════════════════════════════════════════════════════
// Clean, organized settings page with sections for account,
// notifications, accessibility, and privacy.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Settings, User, Bell, Eye, Palette, Volume2,
  Shield, Moon, Globe, ChevronRight, Smartphone,
  LogOut, CircleHelp,
} from 'lucide-react';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import { SFInput } from '@/components/ui/SFInput';
import SpotlightCard from '@/components/bits/SpotlightCard';
import GradientText from '@/components/bits/GradientText';

interface ToggleProps {
  label: string;
  description?: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ label, description, enabled, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-medium" style={{ color: '#1A1D2B' }}>{label}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: '#8C94AC' }}>{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-all ${enabled ? 'bg-sf-primary' : 'bg-sf-border'}`}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${enabled ? 'left-[22px]' : 'left-0.5'}`}
        />
      </button>
    </div>
  );
}

const SETTINGS_SECTIONS = [
  {
    title: 'Account',
    icon: User,
    color: '#4F6EF7',
    items: [
      { label: 'Profile Information', href: '/profile', icon: User, desc: 'Name, avatar, age' },
      { label: 'Linked Accounts', href: '/settings/linked-accounts', icon: Globe, desc: 'Google, Apple sign-in' },
      { label: 'Security', href: '/settings/mfa', icon: Shield, desc: 'Password, 2FA' },
    ],
  },
  {
    title: 'Notifications',
    icon: Bell,
    color: '#FF6B35',
    items: [
      { label: 'Push Notifications', href: '#', icon: Bell, desc: 'Game reminders, streak alerts' },
      { label: 'Email Updates', href: '#', icon: Globe, desc: 'Weekly progress reports' },
      { label: 'SMS Alerts', href: '#', icon: Smartphone, desc: 'Parent notifications' },
    ],
  },
  {
    title: 'Accessibility',
    icon: Eye,
    color: '#2ECC71',
    items: [
      { label: 'Text Size', href: '#', icon: Palette, desc: 'Adjust font size' },
      { label: 'Reduced Motion', href: '#', icon: Moon, desc: 'Minimize animations' },
      { label: 'Sound Effects', href: '#', icon: Volume2, desc: 'Game audio settings' },
    ],
  },
];

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20 lg:pb-0">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-1" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
          <GradientText from="#8C94AC" to="#4F6EF7">
            <Settings className="w-7 h-7 inline mr-2" style={{ color: '#8C94AC' }} />
            Settings
          </GradientText>
        </h1>
        <p className="text-sm" style={{ color: '#8C94AC' }}>
          Manage your account, preferences, and privacy
        </p>
      </motion.div>

      {/* Quick Toggles */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SpotlightCard spotlightColor="rgba(79,110,247,0.06)">
          <div className="p-5 divide-y" style={{ borderColor: '#EEF2FA' }}>
            <Toggle
              label="Notifications"
              description="Receive game reminders and streak alerts"
              enabled={notifications}
              onChange={setNotifications}
            />
            <Toggle
              label="Sound Effects"
              description="Play sounds during games and celebrations"
              enabled={soundEffects}
              onChange={setSoundEffects}
            />
            <Toggle
              label="Reduced Motion"
              description="Minimize animations for accessibility"
              enabled={reducedMotion}
              onChange={setReducedMotion}
            />
          </div>
        </SpotlightCard>
      </motion.div>

      {/* Settings Sections */}
      {SETTINGS_SECTIONS.map((section, si) => (
        <motion.section
          key={section.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + si * 0.1 }}
        >
          <h2
            className="text-sm font-bold uppercase tracking-wider mb-3"
            style={{ color: '#8C94AC', fontFamily: 'var(--font-body)' }}
          >
            <section.icon className="w-4 h-4 inline mr-1.5" style={{ color: section.color }} />
            {section.title}
          </h2>

          <div className="space-y-2">
            {section.items.map((item) => (
              <Link key={item.label} href={item.href}>
                <SFCard variant="default" padding="sm" className="flex items-center gap-4 cursor-pointer hover:shadow-sf-md transition-all">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${section.color}12` }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: section.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#1A1D2B' }}>{item.label}</p>
                    <p className="text-xs" style={{ color: '#8C94AC' }}>{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#8C94AC' }} />
                </SFCard>
              </Link>
            ))}
          </div>
        </motion.section>
      ))}

      {/* Danger Zone */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: '#FF5252' }}>
          Danger Zone
        </h2>
        <SFCard variant="outlined" padding="md" className="border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: '#1A1D2B' }}>Delete Account</p>
              <p className="text-xs" style={{ color: '#8C94AC' }}>This action cannot be undone</p>
            </div>
            <SFButton variant="danger" size="sm">
              Delete
            </SFButton>
          </div>
        </SFCard>
      </motion.section>

      {/* Version */}
      <div className="text-center pt-4 pb-8">
        <p className="text-xs" style={{ color: '#8C94AC' }}>SparkForge v3.0.0 &middot; Build 2026.05</p>
      </div>
    </div>
  );
}
