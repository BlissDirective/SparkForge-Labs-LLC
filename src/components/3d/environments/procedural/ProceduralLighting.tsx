'use client';

import { useMemo } from 'react';
import { Color } from 'three';
import { ContactShadows } from '@react-three/drei';
import {
  LabThemeProfile,
  TierConfig,
} from '@/lib/3d/proceduralConfig';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProceduralLightingProps {
  theme: LabThemeProfile;
  tierConfig: TierConfig;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DIRECTIONAL_POSITION: [number, number, number] = [5, 8, 3];
const DIRECTIONAL_INTENSITY = 0.8;
const SHADOW_CAMERA_BOUNDS = 10;
const SHADOW_CAMERA_FAR = 30;

const POINT_LIGHT_A_POSITION: [number, number, number] = [-3, 2.5, -2];
const POINT_LIGHT_A_INTENSITY = 0.35;
const POINT_LIGHT_A_DISTANCE = 12;

const POINT_LIGHT_B_POSITION: [number, number, number] = [3, 1.5, 3];
const POINT_LIGHT_B_INTENSITY = 0.2;
const POINT_LIGHT_B_DISTANCE = 10;

const CONTACT_SHADOW_POSITION: [number, number, number] = [0, -0.99, 0];
const CONTACT_SHADOW_OPACITY = 0.3;
const CONTACT_SHADOW_SCALE = 16;
const CONTACT_SHADOW_BLUR = 2;
const CONTACT_SHADOW_FAR = 2.5;

// ---------------------------------------------------------------------------
// ProceduralLighting component
// ---------------------------------------------------------------------------

export default function ProceduralLighting({
  theme,
  tierConfig,
}: ProceduralLightingProps) {
  const ambientIntensity = theme.ambientIntensity ?? 0.3;
  const shadowMapSize = tierConfig.shadowMapSize ?? 1024;

  const labColor = useMemo(() => new Color(theme.labColor), [theme.labColor]);
  const accentColor = useMemo(
    () => new Color(theme.accentColor),
    [theme.accentColor],
  );

  return (
    <group>
      {/* Ambient fill */}
      <ambientLight intensity={ambientIntensity} />

      {/* Primary directional light with shadows */}
      <directionalLight
        position={DIRECTIONAL_POSITION}
        intensity={DIRECTIONAL_INTENSITY}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-left={-SHADOW_CAMERA_BOUNDS}
        shadow-camera-right={SHADOW_CAMERA_BOUNDS}
        shadow-camera-top={SHADOW_CAMERA_BOUNDS}
        shadow-camera-bottom={-SHADOW_CAMERA_BOUNDS}
        shadow-camera-far={SHADOW_CAMERA_FAR}
      />

      {/* Lab-colored point light — primary accent fill */}
      <pointLight
        position={POINT_LIGHT_A_POSITION}
        intensity={POINT_LIGHT_A_INTENSITY}
        color={labColor}
        distance={POINT_LIGHT_A_DISTANCE}
      />

      {/* Accent-colored point light — secondary fill */}
      <pointLight
        position={POINT_LIGHT_B_POSITION}
        intensity={POINT_LIGHT_B_INTENSITY}
        color={accentColor}
        distance={POINT_LIGHT_B_DISTANCE}
      />

      {/* Contact shadows for ground-level soft shadow */}
      <ContactShadows
        position={CONTACT_SHADOW_POSITION}
        opacity={CONTACT_SHADOW_OPACITY}
        scale={CONTACT_SHADOW_SCALE}
        blur={CONTACT_SHADOW_BLUR}
        far={CONTACT_SHADOW_FAR}
      />
    </group>
  );
}
