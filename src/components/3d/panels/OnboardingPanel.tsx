'use client';

// ════════════════════════════════════════════════════════════════
// OnboardingPanel — 3D Onboarding Wizard (DASH-03 fix)
// ════════════════════════════════════════════════════════════════
// Replaces the HTML onboarding page with a 3D panel that renders
// inside CockpitUILayer's center quadrant. 3-step wizard:
//   Step 1: Your Explorer (child profile review)
//   Step 2: Pick Your First Lab (3 free labs)
//   Step 3: Launch! (celebration + redirect)
//
// Uses cockpit 3D UI primitives (HolographicButton, HolographicCard,
// CockpitText) for full design-system compliance.

import { useState, useEffect, useCallback } from 'react';
import { csrfHeader } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Text } from '@react-three/drei';
import { Color } from 'three';
import { HolographicButton } from '../ui/HolographicButton';
import { HolographicCard } from '../ui/HolographicCard';
import { useChildStore } from '@/stores/childStore';
import { useAuthStore } from '@/stores/authStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { useUIStore } from '@/stores/uiStore';
import { useSafeTimeout } from '@/hooks/useSafeTimeout';
import { WORLDS } from '@/types';
import {
  TYPE_SCALE,
  TEXT_COLORS,
  CHROME_BORDER,
} from '@/lib/3d/cockpitDesignTokens';

const FREE_LABS = WORLDS.filter((w) => w.id <= 3);

// Step indicator dot positions
const STEP_DOT_X = [-0.04, 0, 0.04];

export default function OnboardingPanel() {
  const router = useRouter();
  const activeChild = useChildStore((s) => s.activeChild);
  const parent = useAuthStore((s) => s.parent);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  const triggerCelebration = useUIStore((s) => s.triggerCelebration);
  const { safeTimeout } = useSafeTimeout();

  // DASH-05: Restore onboarding progress from localStorage
  const [step, setStep] = useState(() => {
    if (typeof window === 'undefined') return 1;
    const saved = localStorage.getItem('sparkforge-onboarding');
    if (!saved) return 1;
    try { return JSON.parse(saved).step || 1; } catch { return 1; }
  });
  const [selectedLab, setSelectedLab] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    const saved = localStorage.getItem('sparkforge-onboarding');
    if (!saved) return 1;
    try { return JSON.parse(saved).selectedLab || 1; } catch { return 1; }
  });
  const [loading, setLoading] = useState(false);

  // DASH-05: Persist progress on step/lab changes
  useEffect(() => {
    localStorage.setItem('sparkforge-onboarding', JSON.stringify({ step, selectedLab }));
  }, [step, selectedLab]);

  const childName = activeChild?.display_name || 'Explorer';
  const selectedLabColor = FREE_LABS.find((l) => l.id === selectedLab)?.color || '#AA66FF';

  // If already onboarded, redirect
  useEffect(() => {
    if (parent?.onboarding_complete) {
      router.push('/home');
    }
  }, [parent, router]);

  // Broadcast step changes
  useEffect(() => {
    broadcast({
      type: 'page-navigate',
      source: `onboarding-step-${step}`,
      color: '#AA66FF',
      label: `ONBOARDING ${step}/3`,
      targetPage: '/onboarding',
    });
  }, [step, broadcast]);

  const completeOnboarding = useCallback(async () => {
    setLoading(true);

    broadcast({
      type: 'game-enter',
      source: 'onboarding-launch',
      color: selectedLabColor,
      label: 'First Lab Launch!',
    });
    broadcast({
      type: 'celebration-start',
      source: 'onboarding-complete',
      color: '#FFD700',
      label: 'Welcome to SparkForge!',
    });
    triggerCelebration('confetti', { reason: 'onboarding-complete' });

    try {
      await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({ onboardingComplete: true }),
      });

      safeTimeout(() => {
        router.push(`/labs/${selectedLab}`);
      }, 800);
    } catch (error) {
      console.error('Onboarding error:', error);
      setLoading(false);
    }
  }, [selectedLab, selectedLabColor, broadcast, triggerCelebration, router, safeTimeout]);

  return (
    <group name="onboarding-panel">
      {/* ═══ Title ═══ */}
      <Text
        position={[0, 0.52, 0]}
        fontSize={TYPE_SCALE.h2.fontSize}
        color={TEXT_COLORS.primary.hex}
        anchorX="center"
        anchorY="middle"
        font={TYPE_SCALE.h2.fontPath}
      >
        {step === 1 ? 'Your Explorer' : step === 2 ? 'Pick Your First Lab' : "You're Ready!"}
      </Text>

      {/* ═══ Step Indicator Dots ═══ */}
      <group position={[0, 0.44, 0]}>
        {[1, 2, 3].map((s, i) => (
          <mesh key={s} position={[STEP_DOT_X[i], 0, 0]}>
            <sphereGeometry args={[s === step ? 0.008 : 0.006, 16, 16]} />
            <meshStandardMaterial
              color={new Color(s < step ? '#00FF88' : s === step ? '#AA66FF' : '#333344')}
              emissive={new Color(s === step ? '#AA66FF' : '#000000')}
              emissiveIntensity={s === step ? 0.6 : 0}
            />
          </mesh>
        ))}
      </group>

      {/* Chrome divider */}
      <mesh position={[0, 0.39, 0]}>
        <boxGeometry args={[0.5, 0.002, 0.003]} />
        <meshStandardMaterial color={CHROME_BORDER.colorHex} metalness={0.95} roughness={0.15} />
      </mesh>

      {/* ═══ STEP 1: Explorer Profile ═══ */}
      {step === 1 && (
        <group>
          {/* Avatar circle (initial letter) */}
          <mesh position={[0, 0.24, 0]}>
            <circleGeometry args={[0.06, 32]} />
            <meshStandardMaterial
              color={new Color('#AA66FF')}
              emissive={new Color('#AA66FF')}
              emissiveIntensity={0.3}
            />
          </mesh>
          <Text
            position={[0, 0.24, 0.001]}
            fontSize={0.04}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
            font={TYPE_SCALE.h1.fontPath}
          >
            {childName[0]?.toUpperCase() || '?'}
          </Text>

          {/* Name */}
          <Text
            position={[0, 0.14, 0]}
            fontSize={TYPE_SCALE.h3.fontSize}
            color={TEXT_COLORS.primary.hex}
            anchorX="center"
            anchorY="middle"
            font={TYPE_SCALE.h3.fontPath}
          >
            {childName}
          </Text>

          {/* Age band info */}
          <Text
            position={[0, 0.08, 0]}
            fontSize={TYPE_SCALE.caption.fontSize}
            color={TEXT_COLORS.muted.hex}
            fillOpacity={TEXT_COLORS.muted.opacity}
            anchorX="center"
            anchorY="middle"
            font={TYPE_SCALE.caption.fontPath}
          >
            {activeChild ? `Band ${activeChild.age_band} · Ready to explore AI!` : 'Ready to explore AI!'}
          </Text>

          {/* Next button */}
          <HolographicButton
            id="onboarding-next-1"
            label="NEXT"
            color="#AA66FF"
            position={[0, -0.1, 0]}
            size="lg"
            onClick={() => setStep(2)}
          />
        </group>
      )}

      {/* ═══ STEP 2: Lab Selection ═══ */}
      {step === 2 && (
        <group>
          <Text
            position={[0, 0.3, 0]}
            fontSize={TYPE_SCALE.caption.fontSize}
            color={TEXT_COLORS.muted.hex}
            fillOpacity={TEXT_COLORS.muted.opacity}
            anchorX="center"
            anchorY="middle"
            font={TYPE_SCALE.caption.fontPath}
          >
            These 3 labs are free to explore!
          </Text>

          {/* Lab selection cards with labels */}
          {FREE_LABS.map((lab, idx) => {
            const cardY = 0.15 - idx * 0.12;
            return (
              <group key={lab.id}>
                <HolographicCard
                  position={[0, cardY, 0]}
                  width={0.5}
                  height={0.1}
                  color={lab.color}
                  active={selectedLab === lab.id}
                  onClick={() => {
                    setSelectedLab(lab.id);
                    broadcast({ type: 'lab-select', source: `lab-${lab.id}`, color: lab.color, label: lab.title });
                  }}
                />
                <Text
                  position={[-0.18, cardY + 0.01, 0.01]}
                  fontSize={TYPE_SCALE.label.fontSize}
                  color={TEXT_COLORS.primary.hex}
                  anchorX="left"
                  anchorY="middle"
                  font={TYPE_SCALE.label.fontPath}
                >
                  {lab.title}
                </Text>
                <Text
                  position={[-0.18, cardY - 0.02, 0.01]}
                  fontSize={TYPE_SCALE.caption.fontSize}
                  color={TEXT_COLORS.muted.hex}
                  fillOpacity={TEXT_COLORS.muted.opacity}
                  anchorX="left"
                  anchorY="middle"
                  font={TYPE_SCALE.caption.fontPath}
                  maxWidth={0.4}
                >
                  {lab.description}
                </Text>
              </group>
            );
          })}

          {/* Back / Next buttons */}
          <HolographicButton
            id="onboarding-back-2"
            label="BACK"
            color="#555566"
            position={[-0.12, -0.25, 0]}
            size="md"
            onClick={() => setStep(1)}
          />
          <HolographicButton
            id="onboarding-next-2"
            label="NEXT"
            color="#AA66FF"
            position={[0.12, -0.25, 0]}
            size="md"
            onClick={() => setStep(3)}
          />
        </group>
      )}

      {/* ═══ STEP 3: Launch ═══ */}
      {step === 3 && (
        <group>
          {/* Rocket icon (3D sphere with emissive) */}
          <mesh position={[0, 0.24, 0]}>
            <sphereGeometry args={[0.05, 32, 32]} />
            <meshStandardMaterial
              color={new Color(selectedLabColor)}
              emissive={new Color(selectedLabColor)}
              emissiveIntensity={0.5}
              transparent
              opacity={0.8}
            />
          </mesh>

          <Text
            position={[0, 0.12, 0]}
            fontSize={TYPE_SCALE.body.fontSize}
            color={TEXT_COLORS.primary.hex}
            anchorX="center"
            anchorY="middle"
            font={TYPE_SCALE.body.fontPath}
          >
            {`Welcome, ${childName}!`}
          </Text>

          <Text
            position={[0, 0.04, 0]}
            fontSize={TYPE_SCALE.caption.fontSize}
            color={TEXT_COLORS.muted.hex}
            fillOpacity={TEXT_COLORS.muted.opacity}
            anchorX="center"
            anchorY="middle"
            font={TYPE_SCALE.caption.fontPath}
          >
            Your first lab awaits.
          </Text>

          {/* Back / Launch buttons */}
          <HolographicButton
            id="onboarding-back-3"
            label="BACK"
            color="#555566"
            position={[-0.12, -0.1, 0]}
            size="md"
            onClick={() => setStep(2)}
          />
          <HolographicButton
            id="onboarding-launch"
            label={loading ? 'LAUNCHING...' : 'LAUNCH!'}
            color={selectedLabColor}
            position={[0.12, -0.1, 0]}
            size="lg"
            disabled={loading}
            onClick={completeOnboarding}
          />
        </group>
      )}
    </group>
  );
}
