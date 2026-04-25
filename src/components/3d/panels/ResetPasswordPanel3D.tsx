'use client';

// ════════════════════════════════════════════════════════════════
// ResetPasswordPanel3D — 3D Password Reset Form (Phase 3)
// ════════════════════════════════════════════════════════════════
// Simple 2-state panel: email input → success confirmation.
// Same cockpit design token visual language as Login/Signup panels.

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import {
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  MeshBasicMaterial,
  AdditiveBlending,
  DoubleSide,
} from 'three';
import {
  CHROME_BORDER,
  HOVER_GLOW,
  TYPE_SCALE,
  TEXT_COLORS,
  EMISSIVE_IDLE_BUTTON,
  EMISSIVE_HOVER_MULTIPLIER,
  EMISSIVE_SCALE,
  SPRING_PRESETS,
  PRESS_DEPTH,
} from '@/lib/3d/cockpitDesignTokens';
import {
  resetPasswordSchema,
  validateForm,
} from '@/lib/validation/authSchemas';

// ═══════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════

interface ResetPasswordPanel3DProps {
  onReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  onNavigateLogin: () => void;
}

const PANEL_WIDTH = 1.4;
const PANEL_HEIGHT = 1.2;
const PANEL_DEPTH = 0.008;
const ACCENT_COLOR = '#AA66FF';
const INPUT_WIDTH = 1.0;
const INPUT_HEIGHT = 0.12;
const BUTTON_HEIGHT = 0.14;
const BUTTON_DEPTH = 0.012;

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS (same pattern as LoginPanel3D)
// ═══════════════════════════════════════════════════════════════

function InputField3D({
  label, value, placeholder, position, focused, onFocus,
}: {
  label: string; value: string; placeholder: string;
  position: [number, number, number]; focused: boolean; onFocus: () => void;
}) {
  const meshRef = useRef<Mesh>(null);
  const caretRef = useRef<Mesh>(null);
  const accentC = useMemo(() => new Color(ACCENT_COLOR), []);
  const chromeC = useMemo(() => new Color('#a8b5c8'), []);

  useFrame((state) => {
    if (caretRef.current) caretRef.current.visible = focused && Math.sin(state.clock.elapsedTime * Math.PI * 2) > 0;
    if (meshRef.current) {
      const mat = meshRef.current.material as MeshStandardMaterial;
      mat.emissive = focused ? accentC : chromeC;
      // Phase 2 audit fix (Section 7.1): Design token adoption — 0.4 === EMISSIVE_SCALE.dim
      mat.emissiveIntensity = focused ? EMISSIVE_SCALE.dim : CHROME_BORDER.glowIntensity;
    }
  });

  return (
    <group position={position}>
      <Text position={[-INPUT_WIDTH / 2, INPUT_HEIGHT / 2 + 0.04, 0.001]}
        fontSize={TYPE_SCALE.label.fontSize} color={TEXT_COLORS.secondary.hex}
        anchorX="left" anchorY="middle" font={TYPE_SCALE.label.fontPath} fillOpacity={TEXT_COLORS.secondary.opacity}
      >{label}</Text>
      <mesh ref={meshRef} onClick={onFocus}>
        <boxGeometry args={[INPUT_WIDTH + 0.006, INPUT_HEIGHT + 0.006, 0.003]} />
        <meshStandardMaterial color={chromeC} metalness={0.95} roughness={0.1} emissive={chromeC} emissiveIntensity={CHROME_BORDER.glowIntensity} />
      </mesh>
      <mesh position={[0, 0, 0.002]} onClick={onFocus}>
        <boxGeometry args={[INPUT_WIDTH, INPUT_HEIGHT, 0.002]} />
        <meshStandardMaterial color={new Color('#0a1625')} metalness={0.3} roughness={0.6} />
      </mesh>
      <Text position={[-INPUT_WIDTH / 2 + 0.04, 0, 0.005]}
        fontSize={TYPE_SCALE.body.fontSize} color={value ? TEXT_COLORS.primary.hex : TEXT_COLORS.dim.hex}
        anchorX="left" anchorY="middle" font={TYPE_SCALE.body.fontPath}
        fillOpacity={value ? 1.0 : 0.3} maxWidth={INPUT_WIDTH - 0.08}
      >{value || placeholder}</Text>
      <mesh ref={caretRef} position={[-INPUT_WIDTH / 2 + 0.04 + Math.min(value.length * 0.018, INPUT_WIDTH - 0.1), 0, 0.006]} visible={false}>
        <boxGeometry args={[0.003, INPUT_HEIGHT * 0.6, 0.001]} />
        <meshBasicMaterial color={ACCENT_COLOR} toneMapped={false} />
      </mesh>
    </group>
  );
}

function ActionButton3D({
  label, color, position, onClick, disabled = false, width = INPUT_WIDTH,
}: {
  label: string; color: string; position: [number, number, number];
  onClick: () => void; disabled?: boolean; width?: number;
}) {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const depthRef = useRef(0);
  const velRef = useRef(0);
  const accentC = useMemo(() => new Color(color), [color]);

  const baseMat = useMemo(() => new MeshStandardMaterial({
    color: accentC, emissive: accentC, emissiveIntensity: EMISSIVE_IDLE_BUTTON,
    metalness: 0.7, roughness: 0.3,
  }), [accentC]);

  const borderMat = useMemo(() => new MeshStandardMaterial({
    color: new Color(CHROME_BORDER.colorHex), metalness: 0.95, roughness: 0.1,
    emissive: accentC, emissiveIntensity: CHROME_BORDER.glowIntensity,
  }), [accentC]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = pressed ? PRESS_DEPTH : 0;
    const spring = SPRING_PRESETS.snap;
    velRef.current += ((spring.stiffness * (target - depthRef.current) - spring.damping * velRef.current) / spring.mass) * delta;
    depthRef.current += velRef.current * delta;
    groupRef.current.position.z = position[2] - depthRef.current;
    baseMat.emissiveIntensity = disabled ? 0.05 : hovered ? EMISSIVE_IDLE_BUTTON * EMISSIVE_HOVER_MULTIPLIER : EMISSIVE_IDLE_BUTTON;
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh><boxGeometry args={[width + 0.008, BUTTON_HEIGHT + 0.008, BUTTON_DEPTH]} /><primitive object={borderMat} /></mesh>
      <mesh position={[0, 0, 0.001]}
        onClick={() => { if (!disabled) { setPressed(true); onClick(); setTimeout(() => setPressed(false), 200); } }}
        onPointerOver={() => { if (!disabled) { setHovered(true); document.body.style.cursor = 'pointer'; } }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <boxGeometry args={[width, BUTTON_HEIGHT, BUTTON_DEPTH - 0.002]} /><primitive object={baseMat} />
      </mesh>
      <Text position={[0, 0, BUTTON_DEPTH / 2 + 0.002]} fontSize={TYPE_SCALE.h3.fontSize}
        color={disabled ? '#555566' : '#ffffff'} anchorX="center" anchorY="middle" font={TYPE_SCALE.h3.fontPath}
      >{disabled ? 'Sending...' : label}</Text>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function ResetPasswordPanel3D({ onReset, onNavigateLogin }: ResetPasswordPanel3DProps) {
  const glowRef = useRef<Mesh>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const accentColor = useMemo(() => new Color(ACCENT_COLOR), []);
  const chromeColor = useMemo(() => new Color(CHROME_BORDER.colorHex), []);

  const panelMat = useMemo(() => new MeshStandardMaterial({
    color: new Color('#0A0F1F'), metalness: 0.85, roughness: 0.35, transparent: true, opacity: 0.92,
  }), []);
  const chromeMat = useMemo(() => new MeshStandardMaterial({
    color: chromeColor, metalness: 0.95, roughness: 0.1,
    emissive: accentColor, emissiveIntensity: CHROME_BORDER.glowIntensity,
  }), [chromeColor, accentColor]);
  const glowMat = useMemo(() => new MeshBasicMaterial({
    color: accentColor, transparent: true, opacity: 0.08,
    blending: AdditiveBlending, side: DoubleSide, depthWrite: false, toneMapped: false,
  }), [accentColor]);

  useFrame((state) => {
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * (Math.PI * 2 / HOVER_GLOW.pulsePeriodS));
      (glowRef.current.material as MeshBasicMaterial).opacity = 0.08 + pulse * 0.03;
    }
  });

  const handleReset = useCallback(async () => {
    setError('');
    // Phase 5 P.8-MAX (§8.10): Zod validation from authSchemas
    const validation = validateForm(resetPasswordSchema, { email });
    if (validation) {
      setError(validation.email || 'Please check your email address');
      return;
    }
    setLoading(true);
    const result = await onReset(email);
    setLoading(false);
    if (result.success) setSent(true);
    else setError(result.error || 'Failed to send reset email');
  }, [email, onReset]);

  useEffect(() => {
    if (focused && emailRef.current) emailRef.current.focus();
  }, [focused]);

  return (
    <group position={[0, 0, 0.5]}>
      <mesh ref={glowRef} position={[0, 0, -0.005]}>
        <planeGeometry args={[PANEL_WIDTH + 0.06, PANEL_HEIGHT + 0.06]} />
        <primitive object={glowMat} />
      </mesh>
      <mesh>
        <boxGeometry args={[PANEL_WIDTH, PANEL_HEIGHT, PANEL_DEPTH]} />
        <primitive object={panelMat} />
      </mesh>
      {/* Chrome frame */}
      <mesh position={[0, PANEL_HEIGHT / 2, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[PANEL_WIDTH, 0.004, 0.004]} />
      </mesh>
      <mesh position={[0, -PANEL_HEIGHT / 2, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[PANEL_WIDTH, 0.004, 0.004]} />
      </mesh>
      <mesh position={[-PANEL_WIDTH / 2, 0, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[0.004, PANEL_HEIGHT, 0.004]} />
      </mesh>
      <mesh position={[PANEL_WIDTH / 2, 0, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[0.004, PANEL_HEIGHT, 0.004]} />
      </mesh>

      <group position={[0, 0, PANEL_DEPTH / 2 + 0.003]}>
        {sent ? (
          <>
            <Text position={[0, 0.3, 0]} fontSize={TYPE_SCALE.h1.fontSize} color={TEXT_COLORS.primary.hex}
              anchorX="center" anchorY="middle" font={TYPE_SCALE.h1.fontPath}
            >Check Your Email</Text>
            <Text position={[0, 0.15, 0]} fontSize={TYPE_SCALE.body.fontSize} color={TEXT_COLORS.secondary.hex}
              anchorX="center" anchorY="middle" font={TYPE_SCALE.body.fontPath}
              fillOpacity={TEXT_COLORS.secondary.opacity} maxWidth={INPUT_WIDTH} textAlign="center"
            >We sent a password reset link to</Text>
            <Text position={[0, 0.08, 0]} fontSize={TYPE_SCALE.body.fontSize} color={ACCENT_COLOR}
              anchorX="center" anchorY="middle" font={TYPE_SCALE.body.fontPath}
            >{email}</Text>
            <Text position={[0, -0.15, 0]} fontSize={TYPE_SCALE.caption.fontSize} color={ACCENT_COLOR}
              anchorX="center" anchorY="middle" font={TYPE_SCALE.caption.fontPath}
              onClick={onNavigateLogin}
              onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
              onPointerOut={() => { document.body.style.cursor = 'default'; }}
            >Back to login</Text>
          </>
        ) : (
          <>
            <Text position={[0, 0.38, 0]} fontSize={TYPE_SCALE.h1.fontSize} color={TEXT_COLORS.primary.hex}
              anchorX="center" anchorY="middle" font={TYPE_SCALE.h1.fontPath}
            >Reset Password</Text>
            <Text position={[0, 0.3, 0]} fontSize={TYPE_SCALE.caption.fontSize} color={TEXT_COLORS.muted.hex}
              anchorX="center" anchorY="middle" font={TYPE_SCALE.caption.fontPath} fillOpacity={TEXT_COLORS.muted.opacity}
            >{"We'll send you a reset link"}</Text>
            <mesh position={[0, 0.24, 0]} material={chromeMat}>
              <boxGeometry args={[PANEL_WIDTH * 0.7, 0.002, 0.002]} />
            </mesh>

            {error && (
              <group position={[0, 0.16, 0]}>
                <mesh>
                  <boxGeometry args={[INPUT_WIDTH + 0.04, 0.07, 0.003]} />
                  <meshStandardMaterial color={new Color('#FF6644')} emissive={new Color('#FF6644')} emissiveIntensity={0.3} transparent opacity={0.15} />
                </mesh>
                <Text fontSize={TYPE_SCALE.caption.fontSize} color="#FF6644" anchorX="center" anchorY="middle"
                  font={TYPE_SCALE.caption.fontPath}
                >{error}</Text>
              </group>
            )}

            <InputField3D label="EMAIL" value={email} placeholder="parent@example.com"
              position={[0, 0.02, 0]} focused={focused} onFocus={() => setFocused(true)} />

            <ActionButton3D label="SEND RESET LINK" color={ACCENT_COLOR} position={[0, -0.18, 0]}
              onClick={handleReset} disabled={loading || !email} />

            <Text position={[0, -0.36, 0]} fontSize={TYPE_SCALE.caption.fontSize} color={ACCENT_COLOR}
              anchorX="center" anchorY="middle" font={TYPE_SCALE.caption.fontPath}
              onClick={onNavigateLogin}
              onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
              onPointerOut={() => { document.body.style.cursor = 'default'; }}
            >Back to login</Text>

            <Html position={[0, 0, -10]} style={{ opacity: 0, position: 'absolute', pointerEvents: focused ? 'auto' : 'none' }}>
              <input ref={emailRef} id="reset-email" name="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} autoComplete="email"
                aria-label="Email address"
                aria-describedby={error ? 'reset-email-error' : undefined}
                aria-invalid={error ? true : undefined}
                style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleReset(); }}
                onBlur={() => { if (focused) emailRef.current?.focus(); }}
              />
              {error && (
                <div id="reset-email-error" role="alert" aria-live="polite" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
                  {error}
                </div>
              )}
            </Html>
          </>
        )}
      </group>
    </group>
  );
}
