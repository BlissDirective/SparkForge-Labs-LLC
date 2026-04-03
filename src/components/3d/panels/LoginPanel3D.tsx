'use client';

// ════════════════════════════════════════════════════════════════
// LoginPanel3D — 3D Cockpit-Style Login Form (Phase 3: Auth + Forms)
// ════════════════════════════════════════════════════════════════
// Replaces the HTML LoginFormCard with a full 3D form rendered inside
// the auth Canvas. Uses cockpit design tokens for visual consistency
// with the post-auth cockpit environment.
//
// Per SparkForge-Full-ControlScreen.json §interaction_model.text_input:
//   - CockpitInput with hidden HTML proxy for keyboard/paste/autocomplete
//   - SDF text rendering inside Canvas
//   - Carbon composite background, chrome bezel borders
//   - Focus ring in accent color, per-character spring animation
//
// Architecture: Renders inside the auth layout's R3F Canvas alongside
// LoginPortal3D backdrop. NOT inside CockpitCanvas (user isn't auth'd yet).

import { useState, useCallback, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import {
  Color,
  Group,
  Mesh,
  Shape,
  ExtrudeGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  AdditiveBlending,
  DoubleSide,
} from 'three';
import {
  CHROME_BORDER,
  BEVEL_STYLE,
  HOVER_GLOW,
  TYPE_SCALE,
  TEXT_COLORS,
  EMISSIVE_IDLE_BUTTON,
  EMISSIVE_HOVER_MULTIPLIER,
  SPRING_PRESETS,
  PRESS_DEPTH,
} from '@/lib/3d/cockpitDesignTokens';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface LoginPanel3DProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onNavigateSignup: () => void;
  onNavigateReset: () => void;
  onDemoStart: () => void;
  loading?: boolean;
  error?: string;
  demoExpired?: boolean;
  demoLoading?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// GEOMETRY HELPERS
// ═══════════════════════════════════════════════════════════════

const _PANEL_CHAMFER = BEVEL_STYLE.structural.value;

function createChamferedRect(w: number, h: number, chamfer: number): Shape {
  const s = new Shape();
  const hw = w / 2, hh = h / 2, c = chamfer;
  s.moveTo(-hw + c, -hh);
  s.lineTo(hw - c, -hh);
  s.lineTo(hw, -hh + c);
  s.lineTo(hw, hh - c);
  s.lineTo(hw - c, hh);
  s.lineTo(-hw + c, hh);
  s.lineTo(-hw, hh - c);
  s.lineTo(-hw, -hh + c);
  s.closePath();
  return s;
}

function _createChamferedGeometry(w: number, h: number, depth: number, chamfer: number) {
  return new ExtrudeGeometry(createChamferedRect(w, h, chamfer), {
    depth,
    bevelEnabled: false,
  });
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const PANEL_WIDTH = 1.6;
const PANEL_HEIGHT = 1.8;
const PANEL_DEPTH = 0.008;
const ACCENT_COLOR = '#AA66FF';
const INPUT_WIDTH = 1.2;
const INPUT_HEIGHT = 0.12;
const INPUT_BG = '#0a1625';
const INPUT_BORDER = '#a8b5c8';
const _INPUT_RADIUS = 0.006;
const BUTTON_WIDTH = 1.2;
const BUTTON_HEIGHT = 0.14;
const BUTTON_DEPTH = 0.012;

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

/** 3D Input field visual (the actual input is handled by hidden HTML proxy) */
function InputField3D({
  label,
  value,
  placeholder,
  position,
  focused,
  onFocus,
  type = 'text',
}: {
  label: string;
  value: string;
  placeholder: string;
  position: [number, number, number];
  focused: boolean;
  onFocus: () => void;
  type?: string;
}) {
  const meshRef = useRef<Mesh>(null);
  const accentColor = useMemo(() => new Color(ACCENT_COLOR), []);
  const chromeColor = useMemo(() => new Color(INPUT_BORDER), []);

  const borderMat = useMemo(() => new MeshStandardMaterial({
    color: chromeColor,
    metalness: 0.95,
    roughness: 0.1,
    emissive: focused ? accentColor : chromeColor,
    emissiveIntensity: focused ? 0.4 : CHROME_BORDER.glowIntensity,
  }), [chromeColor, accentColor, focused]);

  const bgMat = useMemo(() => new MeshStandardMaterial({
    color: new Color(INPUT_BG),
    metalness: 0.3,
    roughness: 0.6,
  }), []);

  // Caret blink
  const caretRef = useRef<Mesh>(null);
  useFrame((state) => {
    if (caretRef.current) {
      caretRef.current.visible = focused && Math.sin(state.clock.elapsedTime * Math.PI * 2) > 0;
    }
    // Focus border glow
    if (meshRef.current) {
      const mat = meshRef.current.material as MeshStandardMaterial;
      mat.emissive = focused ? accentColor : chromeColor;
      mat.emissiveIntensity = focused ? 0.4 : CHROME_BORDER.glowIntensity;
    }
  });

  const displayValue = type === 'password' ? '\u2022'.repeat(value.length) : value;

  return (
    <group position={position}>
      {/* Label */}
      <Text
        position={[-INPUT_WIDTH / 2, INPUT_HEIGHT / 2 + 0.04, 0.001]}
        fontSize={TYPE_SCALE.label.fontSize}
        color={TEXT_COLORS.secondary.hex}
        anchorX="left"
        anchorY="middle"
        font={TYPE_SCALE.label.fontPath}
        fillOpacity={TEXT_COLORS.secondary.opacity}
      >
        {label}
      </Text>

      {/* Border frame */}
      <mesh ref={meshRef} onClick={onFocus}>
        <boxGeometry args={[INPUT_WIDTH + 0.006, INPUT_HEIGHT + 0.006, 0.003]} />
        <primitive object={borderMat} />
      </mesh>

      {/* Background fill */}
      <mesh position={[0, 0, 0.002]} onClick={onFocus}>
        <boxGeometry args={[INPUT_WIDTH, INPUT_HEIGHT, 0.002]} />
        <primitive object={bgMat} />
      </mesh>

      {/* Value or placeholder text */}
      <Text
        position={[-INPUT_WIDTH / 2 + 0.04, 0, 0.005]}
        fontSize={TYPE_SCALE.body.fontSize}
        color={value ? TEXT_COLORS.primary.hex : TEXT_COLORS.dim.hex}
        anchorX="left"
        anchorY="middle"
        font={TYPE_SCALE.body.fontPath}
        fillOpacity={value ? TEXT_COLORS.primary.opacity : 0.3}
        maxWidth={INPUT_WIDTH - 0.08}
        overflowWrap="break-word"
        clipRect={[-0.01, -INPUT_HEIGHT / 2, INPUT_WIDTH - 0.06, INPUT_HEIGHT / 2]}
      >
        {value || placeholder}
      </Text>

      {/* Caret */}
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

/** 3D Button */
function ActionButton3D({
  label,
  color,
  position,
  onClick,
  disabled = false,
  variant = 'primary',
  width = BUTTON_WIDTH,
}: {
  label: string;
  color: string;
  position: [number, number, number];
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  width?: number;
}) {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const depthRef = useRef(0);
  const velRef = useRef(0);

  const accentColor = useMemo(() => new Color(color), [color]);

  const baseMat = useMemo(() => {
    if (variant === 'outline') {
      return new MeshStandardMaterial({
        color: new Color('#0A0F1F'),
        metalness: 0.85,
        roughness: 0.35,
        transparent: true,
        opacity: 0.8,
      });
    }
    return new MeshStandardMaterial({
      color: variant === 'secondary' ? new Color('#0A0F1F') : accentColor,
      emissive: accentColor,
      emissiveIntensity: variant === 'primary' ? EMISSIVE_IDLE_BUTTON : 0.2,
      metalness: 0.7,
      roughness: 0.3,
    });
  }, [accentColor, variant]);

  const borderMat = useMemo(() => new MeshStandardMaterial({
    color: new Color(CHROME_BORDER.colorHex),
    metalness: 0.95,
    roughness: 0.1,
    emissive: accentColor,
    emissiveIntensity: CHROME_BORDER.glowIntensity,
  }), [accentColor]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = pressed ? PRESS_DEPTH : 0;
    const spring = SPRING_PRESETS.snap;
    const force = spring.stiffness * (target - depthRef.current);
    const damp = -spring.damping * velRef.current;
    velRef.current += (force + damp) / spring.mass * delta;
    depthRef.current += velRef.current * delta;
    groupRef.current.position.z = position[2] - depthRef.current;

    // Hover emissive
    baseMat.emissiveIntensity = disabled ? 0.05 :
      hovered ? EMISSIVE_IDLE_BUTTON * EMISSIVE_HOVER_MULTIPLIER :
      variant === 'primary' ? EMISSIVE_IDLE_BUTTON : 0.2;
  });

  const handleClick = useCallback(() => {
    if (disabled) return;
    setPressed(true);
    onClick();
    setTimeout(() => setPressed(false), 200);
  }, [disabled, onClick]);

  return (
    <group ref={groupRef} position={position}>
      {/* Border */}
      <mesh>
        <boxGeometry args={[width + 0.008, BUTTON_HEIGHT + 0.008, BUTTON_DEPTH]} />
        <primitive object={borderMat} />
      </mesh>
      {/* Face */}
      <mesh
        position={[0, 0, 0.001]}
        onClick={handleClick}
        onPointerOver={() => { if (!disabled) { setHovered(true); document.body.style.cursor = 'pointer'; } }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <boxGeometry args={[width, BUTTON_HEIGHT, BUTTON_DEPTH - 0.002]} />
        <primitive object={baseMat} />
      </mesh>
      {/* Label */}
      <Text
        position={[0, 0, BUTTON_DEPTH / 2 + 0.002]}
        fontSize={TYPE_SCALE.h3.fontSize}
        color={disabled ? '#555566' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
        font={TYPE_SCALE.h3.fontPath}
      >
        {disabled ? 'Loading...' : label}
      </Text>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function LoginPanel3D({
  onLogin,
  onNavigateSignup,
  onNavigateReset,
  onDemoStart,
  loading = false,
  error,
  demoExpired = false,
  demoLoading = false,
}: LoginPanel3DProps) {
  const groupRef = useRef<Group>(null);
  const glowRef = useRef<Mesh>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [showDemoConfirm, setShowDemoConfirm] = useState(false);

  // Hidden HTML input refs for keyboard proxy
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const accentColor = useMemo(() => new Color(ACCENT_COLOR), []);
  const chromeColor = useMemo(() => new Color(CHROME_BORDER.colorHex), []);

  // Panel materials
  const panelMat = useMemo(() => new MeshStandardMaterial({
    color: new Color('#0A0F1F'),
    metalness: 0.85,
    roughness: 0.35,
    transparent: true,
    opacity: 0.92,
  }), []);

  const chromeMat = useMemo(() => new MeshStandardMaterial({
    color: chromeColor,
    metalness: 0.95,
    roughness: 0.1,
    emissive: accentColor,
    emissiveIntensity: CHROME_BORDER.glowIntensity,
  }), [chromeColor, accentColor]);

  const glowMat = useMemo(() => new MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.08,
    blending: AdditiveBlending,
    side: DoubleSide,
    depthWrite: false,
    toneMapped: false,
  }), [accentColor]);

  // Breathing glow
  useFrame((state) => {
    if (glowRef.current) {
      const t = state.clock.elapsedTime;
      const pulse = Math.sin(t * (Math.PI * 2 / HOVER_GLOW.pulsePeriodS));
      (glowRef.current.material as MeshBasicMaterial).opacity = 0.08 + pulse * 0.03;
    }
  });

  const handleLogin = useCallback(() => {
    if (!email || !password || loading) return;
    onLogin(email, password);
  }, [email, password, loading, onLogin]);

  const _handleDemoClick = useCallback(() => {
    if (showDemoConfirm) {
      onDemoStart();
    } else {
      setShowDemoConfirm(true);
    }
  }, [showDemoConfirm, onDemoStart]);

  return (
    <group ref={groupRef} position={[0, 0, 0.5]}>
      {/* ═══ Panel glow backing ═══ */}
      <mesh ref={glowRef} position={[0, 0, -0.005]}>
        <planeGeometry args={[PANEL_WIDTH + 0.06, PANEL_HEIGHT + 0.06]} />
        <primitive object={glowMat} />
      </mesh>

      {/* ═══ Carbon composite panel base ═══ */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[PANEL_WIDTH, PANEL_HEIGHT, PANEL_DEPTH]} />
        <primitive object={panelMat} />
      </mesh>

      {/* ═══ Chrome border frame (4 edges) ═══ */}
      {/* Top */}
      <mesh position={[0, PANEL_HEIGHT / 2, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[PANEL_WIDTH, 0.004, 0.004]} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, -PANEL_HEIGHT / 2, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[PANEL_WIDTH, 0.004, 0.004]} />
      </mesh>
      {/* Left */}
      <mesh position={[-PANEL_WIDTH / 2, 0, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[0.004, PANEL_HEIGHT, 0.004]} />
      </mesh>
      {/* Right */}
      <mesh position={[PANEL_WIDTH / 2, 0, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[0.004, PANEL_HEIGHT, 0.004]} />
      </mesh>

      {/* ═══ Content Layer ═══ */}
      <group position={[0, 0, PANEL_DEPTH / 2 + 0.003]}>
        {/* Title */}
        <Text
          position={[0, 0.7, 0]}
          fontSize={TYPE_SCALE.h1.fontSize}
          color={TEXT_COLORS.primary.hex}
          anchorX="center"
          anchorY="middle"
          font={TYPE_SCALE.h1.fontPath}
        >
          Welcome Back
        </Text>
        <Text
          position={[0, 0.62, 0]}
          fontSize={TYPE_SCALE.caption.fontSize}
          color={TEXT_COLORS.muted.hex}
          anchorX="center"
          anchorY="middle"
          font={TYPE_SCALE.caption.fontPath}
          fillOpacity={TEXT_COLORS.muted.opacity}
        >
          Log in to continue your adventure
        </Text>

        {/* Chrome divider bar under title */}
        <mesh position={[0, 0.56, 0]} material={chromeMat}>
          <boxGeometry args={[PANEL_WIDTH * 0.7, 0.002, 0.002]} />
        </mesh>

        {/* Demo expired banner */}
        {demoExpired && (
          <group position={[0, 0.48, 0]}>
            <mesh>
              <boxGeometry args={[INPUT_WIDTH + 0.04, 0.08, 0.003]} />
              <meshStandardMaterial
                color={new Color('#FFAA44')}
                emissive={new Color('#FFAA44')}
                emissiveIntensity={0.3}
                transparent
                opacity={0.15}
              />
            </mesh>
            <Text
              fontSize={TYPE_SCALE.caption.fontSize}
              color="#FFAA44"
              anchorX="center"
              anchorY="middle"
              font={TYPE_SCALE.caption.fontPath}
            >
              Demo session ended. Log in or create an account.
            </Text>
          </group>
        )}

        {/* Error message */}
        {error && (
          <group position={[0, demoExpired ? 0.38 : 0.48, 0]}>
            <mesh>
              <boxGeometry args={[INPUT_WIDTH + 0.04, 0.08, 0.003]} />
              <meshStandardMaterial
                color={new Color('#FF6644')}
                emissive={new Color('#FF6644')}
                emissiveIntensity={0.3}
                transparent
                opacity={0.15}
              />
            </mesh>
            <Text
              fontSize={TYPE_SCALE.caption.fontSize}
              color="#FF6644"
              anchorX="center"
              anchorY="middle"
              font={TYPE_SCALE.caption.fontPath}
              maxWidth={INPUT_WIDTH - 0.04}
            >
              {error}
            </Text>
          </group>
        )}

        {/* Email input */}
        <InputField3D
          label="EMAIL"
          value={email}
          placeholder="parent@example.com"
          position={[0, 0.28, 0]}
          focused={focusedField === 'email'}
          onFocus={() => setFocusedField('email')}
        />

        {/* Password input */}
        <InputField3D
          label="PASSWORD"
          value={password}
          placeholder="Enter your password"
          position={[0, 0.02, 0]}
          focused={focusedField === 'password'}
          onFocus={() => setFocusedField('password')}
          type="password"
        />

        {/* Forgot password link */}
        <Text
          position={[INPUT_WIDTH / 2, -0.08, 0]}
          fontSize={TYPE_SCALE.caption.fontSize}
          color={ACCENT_COLOR}
          anchorX="right"
          anchorY="middle"
          font={TYPE_SCALE.caption.fontPath}
          onClick={onNavigateReset}
          onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'default'; }}
        >
          Forgot password?
        </Text>

        {/* Login button */}
        <ActionButton3D
          label="LOG IN"
          color={ACCENT_COLOR}
          position={[0, -0.2, 0]}
          onClick={handleLogin}
          disabled={loading || !email || !password}
        />

        {/* Divider */}
        <group position={[0, -0.36, 0]}>
          <mesh position={[-0.35, 0, 0]} material={chromeMat}>
            <boxGeometry args={[0.4, 0.001, 0.001]} />
          </mesh>
          <Text
            fontSize={TYPE_SCALE.caption.fontSize}
            color={TEXT_COLORS.dim.hex}
            anchorX="center"
            anchorY="middle"
            font={TYPE_SCALE.caption.fontPath}
            fillOpacity={TEXT_COLORS.dim.opacity}
          >
            OR
          </Text>
          <mesh position={[0.35, 0, 0]} material={chromeMat}>
            <boxGeometry args={[0.4, 0.001, 0.001]} />
          </mesh>
        </group>

        {/* Demo button / confirm */}
        {!showDemoConfirm ? (
          <ActionButton3D
            label="TRY DEMO (NO ACCOUNT)"
            color="#00FF88"
            position={[0, -0.48, 0]}
            onClick={() => setShowDemoConfirm(true)}
            variant="outline"
          />
        ) : (
          <group position={[0, -0.52, 0]}>
            {/* Demo info */}
            <Text
              position={[0, 0.1, 0]}
              fontSize={TYPE_SCALE.caption.fontSize}
              color={TEXT_COLORS.secondary.hex}
              anchorX="center"
              anchorY="middle"
              font={TYPE_SCALE.caption.fontPath}
              fillOpacity={TEXT_COLORS.secondary.opacity}
              maxWidth={INPUT_WIDTH - 0.08}
              textAlign="center"
            >
              {'1 hour to explore. No data saved.\nCreate an account anytime to keep progress.'}
            </Text>
            <group position={[0, -0.06, 0]}>
              <ActionButton3D
                label="CANCEL"
                color="#555566"
                position={[-0.32, 0, 0]}
                onClick={() => setShowDemoConfirm(false)}
                variant="secondary"
                width={0.5}
              />
              <ActionButton3D
                label="START DEMO"
                color="#00FF88"
                position={[0.32, 0, 0]}
                onClick={onDemoStart}
                disabled={demoLoading}
                width={0.5}
              />
            </group>
          </group>
        )}

        {/* Sign up link */}
        <group position={[0, showDemoConfirm ? -0.76 : -0.64, 0]}>
          <Text
            fontSize={TYPE_SCALE.caption.fontSize}
            color={TEXT_COLORS.dim.hex}
            anchorX="center"
            anchorY="middle"
            font={TYPE_SCALE.caption.fontPath}
            fillOpacity={TEXT_COLORS.dim.opacity}
          >
            {"Don't have an account?"}
          </Text>
          <Text
            position={[0, -0.035, 0]}
            fontSize={TYPE_SCALE.caption.fontSize}
            color={ACCENT_COLOR}
            anchorX="center"
            anchorY="middle"
            font={TYPE_SCALE.caption.fontPath}
            onClick={onNavigateSignup}
            onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = 'default'; }}
          >
            Sign up
          </Text>
        </group>
      </group>

      {/* ═══ Hidden HTML Input Proxies ═══ */}
      {/* These are rendered via drei Html to capture keyboard events */}
      {/* The 3D InputField3D visuals above reflect the state */}
      <HiddenInputProxy
        inputRef={emailInputRef}
        value={email}
        onChange={setEmail}
        focused={focusedField === 'email'}
        type="email"
        autoComplete="email"
        onEnter={() => {
          setFocusedField('password');
          passwordInputRef.current?.focus();
        }}
      />
      <HiddenInputProxy
        inputRef={passwordInputRef}
        value={password}
        onChange={setPassword}
        focused={focusedField === 'password'}
        type="password"
        autoComplete="current-password"
        onEnter={handleLogin}
      />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// HIDDEN INPUT PROXY — Bridges browser keyboard to 3D text
// ═══════════════════════════════════════════════════════════════

import { Html } from '@react-three/drei';
import { useEffect } from 'react';

function HiddenInputProxy({
  inputRef,
  value,
  onChange,
  focused,
  type = 'text',
  autoComplete,
  onEnter,
}: {
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  value: string;
  onChange: (v: string) => void;
  focused: boolean;
  type?: string;
  autoComplete?: string;
  onEnter?: () => void;
}) {
  useEffect(() => {
    if (focused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [focused, inputRef]);

  return (
    <Html position={[0, 0, -10]} style={{ opacity: 0, position: 'absolute', pointerEvents: focused ? 'auto' : 'none' }}>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onEnter?.();
        }}
        onBlur={() => {
          // Keep focus if still targeting this field
          if (focused) inputRef.current?.focus();
        }}
      />
    </Html>
  );
}
