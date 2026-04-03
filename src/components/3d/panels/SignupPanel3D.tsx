'use client';

// ════════════════════════════════════════════════════════════════
// SignupPanel3D — 3D Multi-Step Signup Wizard (Phase 3: Auth + Forms)
// ════════════════════════════════════════════════════════════════
// 4-step signup flow rendered in 3D inside the auth Canvas:
//   Step 1: Email + Password (account creation)
//   Step 2: Email Verification (info panel)
//   Step 3: COPPA Consent (checkbox + shield icons)
//   Step 4: Child Profile (name + age slider)
//
// Uses the same design tokens as LoginPanel3D for visual consistency.
// All text via drei <Text>, all inputs via hidden HTML proxy pattern.

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
  SPRING_PRESETS,
  PRESS_DEPTH,
  NUMERIC_FONT,
} from '@/lib/3d/cockpitDesignTokens';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type SignupStep = 1 | 2 | 3 | 4;

interface SignupPanel3DProps {
  onNavigateLogin: () => void;
  onComplete: (email: string, password: string, displayName: string, childAge: number, coppaConsent: boolean) => void;
  /** Step 1 submit handler — creates parent account */
  onStep1: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  /** Step 3 submit handler — records COPPA consent */
  onStep3: (email: string) => Promise<{ success: boolean; error?: string }>;
  /** Step 4 submit handler — creates child + redirects */
  onStep4: (email: string, password: string, displayName: string, childAge: number) => Promise<{ success: boolean; error?: string }>;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const PANEL_WIDTH = 1.6;
const PANEL_HEIGHT = 2.0;
const PANEL_DEPTH = 0.008;
const ACCENT_COLOR = '#AA66FF';
const GREEN_COLOR = '#00FF88';
const INPUT_WIDTH = 1.2;
const INPUT_HEIGHT = 0.12;
const BUTTON_HEIGHT = 0.14;
const BUTTON_DEPTH = 0.012;

const STEP_LABELS = ['Account', 'Verify', 'Consent', 'Profile'];

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS (shared with LoginPanel3D pattern)
// ═══════════════════════════════════════════════════════════════

function InputField3D({
  label, value, placeholder, position, focused, onFocus, type = 'text',
}: {
  label: string; value: string; placeholder: string;
  position: [number, number, number]; focused: boolean;
  onFocus: () => void; type?: string;
}) {
  const meshRef = useRef<Mesh>(null);
  const caretRef = useRef<Mesh>(null);
  const accentC = useMemo(() => new Color(ACCENT_COLOR), []);
  const chromeC = useMemo(() => new Color('#a8b5c8'), []);

  useFrame((state) => {
    if (caretRef.current) {
      caretRef.current.visible = focused && Math.sin(state.clock.elapsedTime * Math.PI * 2) > 0;
    }
    if (meshRef.current) {
      const mat = meshRef.current.material as MeshStandardMaterial;
      mat.emissive = focused ? accentC : chromeC;
      mat.emissiveIntensity = focused ? 0.4 : CHROME_BORDER.glowIntensity;
    }
  });

  const displayValue = type === 'password' ? '\u2022'.repeat(value.length) : value;

  return (
    <group position={position}>
      <Text
        position={[-INPUT_WIDTH / 2, INPUT_HEIGHT / 2 + 0.04, 0.001]}
        fontSize={TYPE_SCALE.label.fontSize}
        color={TEXT_COLORS.secondary.hex}
        anchorX="left" anchorY="middle"
        font={TYPE_SCALE.label.fontPath}
        fillOpacity={TEXT_COLORS.secondary.opacity}
      >
        {label}
      </Text>
      <mesh ref={meshRef} onClick={onFocus}>
        <boxGeometry args={[INPUT_WIDTH + 0.006, INPUT_HEIGHT + 0.006, 0.003]} />
        <meshStandardMaterial color={chromeC} metalness={0.95} roughness={0.1} emissive={chromeC} emissiveIntensity={CHROME_BORDER.glowIntensity} />
      </mesh>
      <mesh position={[0, 0, 0.002]} onClick={onFocus}>
        <boxGeometry args={[INPUT_WIDTH, INPUT_HEIGHT, 0.002]} />
        <meshStandardMaterial color={new Color('#0a1625')} metalness={0.3} roughness={0.6} />
      </mesh>
      <Text
        position={[-INPUT_WIDTH / 2 + 0.04, 0, 0.005]}
        fontSize={TYPE_SCALE.body.fontSize}
        color={value ? TEXT_COLORS.primary.hex : TEXT_COLORS.dim.hex}
        anchorX="left" anchorY="middle"
        font={TYPE_SCALE.body.fontPath}
        fillOpacity={value ? 1.0 : 0.3}
        maxWidth={INPUT_WIDTH - 0.08}
        clipRect={[-0.01, -INPUT_HEIGHT / 2, INPUT_WIDTH - 0.06, INPUT_HEIGHT / 2]}
      >
        {displayValue || placeholder}
      </Text>
      <mesh
        ref={caretRef}
        position={[-INPUT_WIDTH / 2 + 0.04 + Math.min(displayValue.length * 0.018, INPUT_WIDTH - 0.1), 0, 0.006]}
        visible={false}
      >
        <boxGeometry args={[0.003, INPUT_HEIGHT * 0.6, 0.001]} />
        <meshBasicMaterial color={ACCENT_COLOR} toneMapped={false} />
      </mesh>
    </group>
  );
}

function ActionButton3D({
  label, color, position, onClick, disabled = false, variant = 'primary', width = INPUT_WIDTH,
}: {
  label: string; color: string; position: [number, number, number];
  onClick: () => void; disabled?: boolean; variant?: 'primary' | 'secondary' | 'outline';
  width?: number;
}) {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const depthRef = useRef(0);
  const velRef = useRef(0);
  const accentC = useMemo(() => new Color(color), [color]);

  const baseMat = useMemo(() => {
    if (variant === 'outline') return new MeshStandardMaterial({ color: new Color('#0A0F1F'), metalness: 0.85, roughness: 0.35, transparent: true, opacity: 0.8 });
    return new MeshStandardMaterial({
      color: variant === 'secondary' ? new Color('#0A0F1F') : accentC,
      emissive: accentC, emissiveIntensity: variant === 'primary' ? EMISSIVE_IDLE_BUTTON : 0.2,
      metalness: 0.7, roughness: 0.3,
    });
  }, [accentC, variant]);

  const borderMat = useMemo(() => new MeshStandardMaterial({
    color: new Color(CHROME_BORDER.colorHex), metalness: 0.95, roughness: 0.1,
    emissive: accentC, emissiveIntensity: CHROME_BORDER.glowIntensity,
  }), [accentC]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = pressed ? PRESS_DEPTH : 0;
    const spring = SPRING_PRESETS.snap;
    const force = spring.stiffness * (target - depthRef.current);
    const damp = -spring.damping * velRef.current;
    velRef.current += (force + damp) / spring.mass * delta;
    depthRef.current += velRef.current * delta;
    groupRef.current.position.z = position[2] - depthRef.current;
    baseMat.emissiveIntensity = disabled ? 0.05 : hovered ? EMISSIVE_IDLE_BUTTON * EMISSIVE_HOVER_MULTIPLIER : variant === 'primary' ? EMISSIVE_IDLE_BUTTON : 0.2;
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
      >{disabled ? 'Loading...' : label}</Text>
    </group>
  );
}

function HiddenInputProxy({
  inputRef, value, onChange, focused, type = 'text', autoComplete, onEnter,
}: {
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  value: string; onChange: (v: string) => void; focused: boolean;
  type?: string; autoComplete?: string; onEnter?: () => void;
}) {
  useEffect(() => {
    if (focused && inputRef.current) inputRef.current.focus();
  }, [focused, inputRef]);

  return (
    <Html position={[0, 0, -10]} style={{ opacity: 0, position: 'absolute', pointerEvents: focused ? 'auto' : 'none' }}>
      <input ref={inputRef} type={type} value={value}
        onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete}
        style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
        onKeyDown={(e) => { if (e.key === 'Enter') onEnter?.(); }}
        onBlur={() => { if (focused) inputRef.current?.focus(); }}
      />
    </Html>
  );
}

/** Checkbox toggle rendered in 3D */
function Checkbox3D({
  checked, onChange, position,
}: {
  checked: boolean; onChange: (v: boolean) => void; position: [number, number, number];
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <group position={position}>
      <mesh
        onClick={() => onChange(!checked)}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <boxGeometry args={[0.06, 0.06, 0.004]} />
        <meshStandardMaterial
          color={checked ? new Color(GREEN_COLOR) : new Color('#1A1822')}
          emissive={checked ? new Color(GREEN_COLOR) : new Color(hovered ? '#333' : '#111')}
          emissiveIntensity={checked ? 0.5 : 0.1}
          metalness={0.5} roughness={0.3}
        />
      </mesh>
      {checked && (
        <Text position={[0, 0, 0.005]} fontSize={0.035} color="#ffffff"
          anchorX="center" anchorY="middle" font={TYPE_SCALE.body.fontPath}
        >
          {'✓'}
        </Text>
      )}
    </group>
  );
}

/** Step indicator dots */
function StepIndicator3D({ step, position }: { step: SignupStep; position: [number, number, number] }) {
  return (
    <group position={position}>
      {STEP_LABELS.map((label, i) => {
        const isActive = i + 1 === step;
        const isComplete = i + 1 < step;
        const x = (i - 1.5) * 0.25;
        return (
          <group key={i} position={[x, 0, 0]}>
            <mesh>
              <circleGeometry args={[0.018, 16]} />
              <meshStandardMaterial
                color={isComplete ? new Color(GREEN_COLOR) : isActive ? new Color(ACCENT_COLOR) : new Color('#333')}
                emissive={isComplete ? new Color(GREEN_COLOR) : isActive ? new Color(ACCENT_COLOR) : new Color('#111')}
                emissiveIntensity={isComplete || isActive ? 0.5 : 0.05}
              />
            </mesh>
            <Text position={[0, -0.035, 0]} fontSize={TYPE_SCALE.caption.fontSize * 0.8}
              color={isActive ? ACCENT_COLOR : isComplete ? GREEN_COLOR : TEXT_COLORS.dim.hex}
              anchorX="center" anchorY="middle" font={TYPE_SCALE.caption.fontPath}
            >{label}</Text>
            {/* Connector line between dots */}
            {i < 3 && (
              <mesh position={[0.125, 0, -0.001]}>
                <boxGeometry args={[0.1, 0.002, 0.001]} />
                <meshBasicMaterial color={isComplete ? GREEN_COLOR : '#333'} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function SignupPanel3D({
  onNavigateLogin,
  onStep1,
  onStep3,
  onStep4,
}: SignupPanel3DProps) {
  const groupRef = useRef<Group>(null);
  const glowRef = useRef<Mesh>(null);

  const [step, setStep] = useState<SignupStep>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1 state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Step 3 state
  const [coppaChecked, setCoppaChecked] = useState(false);

  // Step 4 state
  const [displayName, setDisplayName] = useState('');
  const [childAge, setChildAge] = useState(10);

  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

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

  // Password validation
  const passChecks = useMemo(() => [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
  ], [password]);

  const handleStep1 = useCallback(async () => {
    setError('');
    if (!email.includes('@')) { setError('Please enter a valid email address'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!passChecks.every(Boolean)) { setError('Password needs uppercase, lowercase, and number'); return; }
    setLoading(true);
    const result = await onStep1(email, password);
    setLoading(false);
    if (result.success) setStep(2);
    else setError(result.error || 'Something went wrong');
  }, [email, password, passChecks, onStep1]);

  const handleStep3 = useCallback(async () => {
    if (!coppaChecked) { setError('Please confirm you are 18 or older'); return; }
    setError('');
    setLoading(true);
    const result = await onStep3(email);
    setLoading(false);
    if (result.success) setStep(4);
    else setError(result.error || 'Failed to record consent');
  }, [coppaChecked, email, onStep3]);

  const handleStep4 = useCallback(async () => {
    if (!displayName.trim()) { setError('Please enter a display name'); return; }
    if (displayName.length > 20) { setError('Display name must be 20 characters or less'); return; }
    setError('');
    setLoading(true);
    const result = await onStep4(email, password, displayName.trim(), childAge);
    setLoading(false);
    if (!result.success) setError(result.error || 'Failed to create profile');
  }, [displayName, childAge, email, password, onStep4]);

  const ageBand = childAge <= 10 ? 'A' : childAge <= 13 ? 'B' : 'C';
  const ageBandLabel = childAge <= 10 ? 'Fun & Visual' : childAge <= 13 ? 'Interactive' : 'Deep Dive';
  const ageBandColor = childAge <= 10 ? '#60A5FA' : childAge <= 13 ? '#A78BFA' : '#FB923C';

  return (
    <group ref={groupRef} position={[0, 0, 0.5]}>
      {/* Glow */}
      <mesh ref={glowRef} position={[0, 0, -0.005]}>
        <planeGeometry args={[PANEL_WIDTH + 0.06, PANEL_HEIGHT + 0.06]} />
        <primitive object={glowMat} />
      </mesh>

      {/* Panel base */}
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

      {/* Content */}
      <group position={[0, 0, PANEL_DEPTH / 2 + 0.003]}>
        {/* Step indicator */}
        <StepIndicator3D step={step} position={[0, 0.86, 0]} />

        {/* Error banner */}
        {error && (
          <group position={[0, 0.7, 0]}>
            <mesh>
              <boxGeometry args={[INPUT_WIDTH + 0.04, 0.07, 0.003]} />
              <meshStandardMaterial color={new Color('#FF6644')} emissive={new Color('#FF6644')} emissiveIntensity={0.3} transparent opacity={0.15} />
            </mesh>
            <Text fontSize={TYPE_SCALE.caption.fontSize} color="#FF6644" anchorX="center" anchorY="middle"
              font={TYPE_SCALE.caption.fontPath} maxWidth={INPUT_WIDTH - 0.04}
            >{error}</Text>
          </group>
        )}

        {/* ═══ STEP 1: Account ═══ */}
        {step === 1 && (
          <group>
            <Text position={[0, 0.58, 0]} fontSize={TYPE_SCALE.h1.fontSize} color={TEXT_COLORS.primary.hex}
              anchorX="center" anchorY="middle" font={TYPE_SCALE.h1.fontPath}
            >Create Your Account</Text>
            <Text position={[0, 0.5, 0]} fontSize={TYPE_SCALE.caption.fontSize} color={TEXT_COLORS.muted.hex}
              anchorX="center" anchorY="middle" font={TYPE_SCALE.caption.fontPath} fillOpacity={TEXT_COLORS.muted.opacity}
            >Parents sign up first — it takes 2 minutes</Text>

            <mesh position={[0, 0.44, 0]} material={chromeMat}>
              <boxGeometry args={[PANEL_WIDTH * 0.7, 0.002, 0.002]} />
            </mesh>

            <InputField3D label="EMAIL" value={email} placeholder="parent@example.com"
              position={[0, 0.28, 0]} focused={focusedField === 'email'} onFocus={() => setFocusedField('email')} />
            <InputField3D label="PASSWORD" value={password} placeholder="Min 8 chars, upper, lower, number"
              position={[0, 0.02, 0]} focused={focusedField === 'password'} onFocus={() => setFocusedField('password')} type="password" />

            {/* Password rules */}
            <group position={[-INPUT_WIDTH / 2, -0.1, 0]}>
              {['8+ chars', 'Uppercase', 'Lowercase', 'Number'].map((rule, i) => (
                <Text key={rule} position={[i * 0.24 + 0.08, 0, 0]}
                  fontSize={TYPE_SCALE.caption.fontSize * 0.85}
                  color={passChecks[i] ? GREEN_COLOR : TEXT_COLORS.dim.hex}
                  anchorX="center" anchorY="middle" font={TYPE_SCALE.caption.fontPath}
                >{passChecks[i] ? `✓ ${rule}` : rule}</Text>
              ))}
            </group>

            <ActionButton3D label="CONTINUE" color={ACCENT_COLOR} position={[0, -0.24, 0]}
              onClick={handleStep1} disabled={loading || !email || password.length < 8} />

            <group position={[0, -0.42, 0]}>
              <Text fontSize={TYPE_SCALE.caption.fontSize} color={TEXT_COLORS.dim.hex}
                anchorX="center" anchorY="middle" font={TYPE_SCALE.caption.fontPath} fillOpacity={TEXT_COLORS.dim.opacity}
              >Already have an account?</Text>
              <Text position={[0, -0.035, 0]} fontSize={TYPE_SCALE.caption.fontSize} color={ACCENT_COLOR}
                anchorX="center" anchorY="middle" font={TYPE_SCALE.caption.fontPath}
                onClick={onNavigateLogin}
                onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { document.body.style.cursor = 'default'; }}
              >Log in</Text>
            </group>

            <HiddenInputProxy inputRef={emailRef} value={email} onChange={setEmail}
              focused={focusedField === 'email'} type="email" autoComplete="email"
              onEnter={() => { setFocusedField('password'); passRef.current?.focus(); }} />
            <HiddenInputProxy inputRef={passRef} value={password} onChange={setPassword}
              focused={focusedField === 'password'} type="password" autoComplete="new-password"
              onEnter={handleStep1} />
          </group>
        )}

        {/* ═══ STEP 2: Email Verification ═══ */}
        {step === 2 && (
          <group>
            <Text position={[0, 0.5, 0]} fontSize={TYPE_SCALE.h1.fontSize} color={TEXT_COLORS.primary.hex}
              anchorX="center" anchorY="middle" font={TYPE_SCALE.h1.fontPath}
            >Check Your Email</Text>
            <Text position={[0, 0.35, 0]} fontSize={TYPE_SCALE.body.fontSize} color={TEXT_COLORS.secondary.hex}
              anchorX="center" anchorY="middle" font={TYPE_SCALE.body.fontPath}
              fillOpacity={TEXT_COLORS.secondary.opacity} maxWidth={INPUT_WIDTH} textAlign="center"
            >{`We sent a verification link to`}</Text>
            <Text position={[0, 0.28, 0]} fontSize={TYPE_SCALE.body.fontSize} color={ACCENT_COLOR}
              anchorX="center" anchorY="middle" font={TYPE_SCALE.body.fontPath}
            >{email}</Text>
            <Text position={[0, 0.18, 0]} fontSize={TYPE_SCALE.caption.fontSize} color={TEXT_COLORS.dim.hex}
              anchorX="center" anchorY="middle" font={TYPE_SCALE.caption.fontPath} fillOpacity={TEXT_COLORS.dim.opacity}
            >{"Can't find it? Check your spam folder."}</Text>

            <ActionButton3D label="I'VE VERIFIED — CONTINUE" color={ACCENT_COLOR} position={[0, -0.1, 0]}
              onClick={() => setStep(3)} />
          </group>
        )}

        {/* ═══ STEP 3: COPPA Consent ═══ */}
        {step === 3 && (
          <group>
            <Text position={[0, 0.58, 0]} fontSize={TYPE_SCALE.h1.fontSize} color={TEXT_COLORS.primary.hex}
              anchorX="center" anchorY="middle" font={TYPE_SCALE.h1.fontPath}
            >Child Safety Consent</Text>
            <Text position={[0, 0.5, 0]} fontSize={TYPE_SCALE.caption.fontSize} color={TEXT_COLORS.muted.hex}
              anchorX="center" anchorY="middle" font={TYPE_SCALE.caption.fontPath} fillOpacity={TEXT_COLORS.muted.opacity}
            >Required by COPPA 2025 for children under 16</Text>

            <mesh position={[0, 0.44, 0]} material={chromeMat}>
              <boxGeometry args={[PANEL_WIDTH * 0.7, 0.002, 0.002]} />
            </mesh>

            {/* Shield info items */}
            {[
              'No personal data collected from children',
              'AI conversations are not stored or used for training',
              'Full parental controls and content filtering',
              'You can delete all data at any time',
            ].map((text, i) => (
              <group key={i} position={[-INPUT_WIDTH / 2 + 0.04, 0.32 - i * 0.08, 0]}>
                {/* Shield icon (green dot) */}
                <mesh position={[0, 0, 0]}>
                  <circleGeometry args={[0.012, 8]} />
                  <meshStandardMaterial color={new Color(GREEN_COLOR)} emissive={new Color(GREEN_COLOR)} emissiveIntensity={0.4} />
                </mesh>
                <Text position={[0.04, 0, 0]} fontSize={TYPE_SCALE.caption.fontSize}
                  color={TEXT_COLORS.secondary.hex} anchorX="left" anchorY="middle"
                  font={TYPE_SCALE.caption.fontPath} fillOpacity={TEXT_COLORS.secondary.opacity}
                  maxWidth={INPUT_WIDTH - 0.12}
                >{text}</Text>
              </group>
            ))}

            {/* Consent checkbox */}
            <group position={[-INPUT_WIDTH / 2, -0.1, 0]}>
              <Checkbox3D checked={coppaChecked} onChange={setCoppaChecked} position={[0.04, 0, 0]} />
              <Text position={[0.1, 0, 0]} fontSize={TYPE_SCALE.caption.fontSize}
                color={TEXT_COLORS.secondary.hex} anchorX="left" anchorY="middle"
                font={TYPE_SCALE.caption.fontPath} fillOpacity={TEXT_COLORS.secondary.opacity}
                maxWidth={INPUT_WIDTH - 0.15} textAlign="left"
              >I am 18+ and consent to my child using SparkForge</Text>
            </group>

            <ActionButton3D label="I CONSENT — CONTINUE" color={ACCENT_COLOR} position={[0, -0.3, 0]}
              onClick={handleStep3} disabled={!coppaChecked || loading} />
          </group>
        )}

        {/* ═══ STEP 4: Child Profile ═══ */}
        {step === 4 && (
          <group>
            <Text position={[0, 0.58, 0]} fontSize={TYPE_SCALE.h1.fontSize} color={TEXT_COLORS.primary.hex}
              anchorX="center" anchorY="middle" font={TYPE_SCALE.h1.fontPath}
            >Create Explorer Profile</Text>
            <Text position={[0, 0.5, 0]} fontSize={TYPE_SCALE.caption.fontSize} color={TEXT_COLORS.muted.hex}
              anchorX="center" anchorY="middle" font={TYPE_SCALE.caption.fontPath} fillOpacity={TEXT_COLORS.muted.opacity}
            >{"Set up your child's learning profile"}</Text>

            <mesh position={[0, 0.44, 0]} material={chromeMat}>
              <boxGeometry args={[PANEL_WIDTH * 0.7, 0.002, 0.002]} />
            </mesh>

            <InputField3D label="DISPLAY NAME" value={displayName} placeholder="Choose a display name"
              position={[0, 0.28, 0]} focused={focusedField === 'name'} onFocus={() => setFocusedField('name')} />

            {/* Character count */}
            <Text position={[INPUT_WIDTH / 2, 0.12, 0]} fontSize={TYPE_SCALE.caption.fontSize * 0.8}
              color={TEXT_COLORS.dim.hex} anchorX="right" anchorY="middle" font={NUMERIC_FONT}
              fillOpacity={TEXT_COLORS.dim.opacity}
            >{`${displayName.length}/20`}</Text>

            {/* Age label */}
            <Text position={[-INPUT_WIDTH / 2, 0.04, 0]} fontSize={TYPE_SCALE.label.fontSize}
              color={TEXT_COLORS.secondary.hex} anchorX="left" anchorY="middle"
              font={TYPE_SCALE.label.fontPath} fillOpacity={TEXT_COLORS.secondary.opacity}
            >{`AGE: `}</Text>
            <Text position={[-INPUT_WIDTH / 2 + 0.12, 0.04, 0]} fontSize={TYPE_SCALE.label.fontSize}
              color={ageBandColor} anchorX="left" anchorY="middle" font={NUMERIC_FONT}
            >{`${childAge}`}</Text>

            {/* Age "slider" — clickable segments */}
            <group position={[0, -0.06, 0]}>
              {Array.from({ length: 10 }, (_, i) => i + 7).map((age) => {
                const x = ((age - 7) / 9 - 0.5) * INPUT_WIDTH;
                const isSelected = age === childAge;
                return (
                  <mesh key={age} position={[x, 0, 0]}
                    onClick={() => setChildAge(age)}
                    onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
                    onPointerOut={() => { document.body.style.cursor = 'default'; }}
                  >
                    <boxGeometry args={[INPUT_WIDTH / 10 - 0.008, 0.05, 0.004]} />
                    <meshStandardMaterial
                      color={isSelected ? new Color(ageBandColor) : new Color('#1A1822')}
                      emissive={isSelected ? new Color(ageBandColor) : new Color('#222')}
                      emissiveIntensity={isSelected ? 0.5 : 0.05}
                      metalness={0.5} roughness={0.4}
                    />
                  </mesh>
                );
              })}
              {/* Age labels */}
              {[7, 10, 13, 16].map((age) => {
                const x = ((age - 7) / 9 - 0.5) * INPUT_WIDTH;
                return (
                  <Text key={age} position={[x, -0.05, 0]} fontSize={TYPE_SCALE.caption.fontSize * 0.8}
                    color={TEXT_COLORS.dim.hex} anchorX="center" anchorY="middle" font={NUMERIC_FONT}
                  >{`${age}`}</Text>
                );
              })}
            </group>

            {/* Age band indicator */}
            <group position={[-INPUT_WIDTH / 2, -0.16, 0]}>
              <mesh>
                <boxGeometry args={[0.3, 0.05, 0.003]} />
                <meshStandardMaterial color={new Color(ageBandColor)} emissive={new Color(ageBandColor)}
                  emissiveIntensity={0.2} transparent opacity={0.2} />
              </mesh>
              <Text fontSize={TYPE_SCALE.caption.fontSize * 0.85} color={ageBandColor}
                anchorX="center" anchorY="middle" font={TYPE_SCALE.caption.fontPath}
              >{`Band ${ageBand} · ${ageBandLabel}`}</Text>
            </group>

            <ActionButton3D label="START LEARNING!" color={GREEN_COLOR} position={[0, -0.34, 0]}
              onClick={handleStep4} disabled={loading || !displayName.trim()} />

            <HiddenInputProxy inputRef={nameRef} value={displayName}
              onChange={(v) => setDisplayName(v.slice(0, 20))}
              focused={focusedField === 'name'} type="text" autoComplete="off"
              onEnter={handleStep4} />
          </group>
        )}
      </group>
    </group>
  );
}
