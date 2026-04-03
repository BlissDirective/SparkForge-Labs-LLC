'use client';

// ════════════════════════════════════════════════════
// MechanicalIris — Camera-Aperture Scene Transition
// ════════════════════════════════════════════════════
// Signature visual transition for cockpit <-> game scenes.
// Triangle budget: ~100,000 (lightweight transition overlay).
//
// Renders a mechanical camera-aperture iris with:
//   - 8 shutter blades arranged radially (carbon composite)
//   - Outer gear ring with 32 instanced teeth (chrome)
//   - 8 small pistons connecting gear ring to blades (chrome)
//   - 4 light ray cones from center gap (additive blending, LED-intensified)
//   - Staggered spiral opening: blades open one at a time (50ms apart)
//
// Animation timeline for iris-open (progress 0->1):
//   0.0-0.3  Gear ring rotates 45 deg, pistons extend outward
//   0.0-0.85 8 shutter blades rotate open (staggered spiral, 50ms apart)
//   0.5-0.9  4 light ray cones grow from center
//   0.9-1.0  Final snap — blades at max rotation, gear settled
//
// For iris-close: progress 0->1 but animation is reversed.
//
// Driven by sceneStore transition.progress.

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Euler,
  ExtrudeGeometry,
  ExtrudeGeometryOptions,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointLight,
  Quaternion,
  Shape,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three';
import { useSceneStore } from '@/stores/sceneStore';
import {
  CHROME_BORDER,
  EMISSIVE_LED_MULTIPLIER,
  SPRING_PRESETS as _SPRING_PRESETS,
  TRANSITION_DURATION_MS as _TRANSITION_DURATION_MS,
  getEmissive as _getEmissive,
} from '@/lib/3d/cockpitDesignTokens';

// ■■ Types ■■

interface BladeRefs {
  mesh: Mesh;
  pivotGroup: Group;
}

interface PistonRef {
  mesh: Mesh;
  group: Group;
}

// ■■ Constants ■■

const BLADE_COUNT = 8;
const BLADE_INNER_RADIUS = 0.3;
const BLADE_OUTER_RADIUS = 3.5;
const BLADE_ARC_ANGLE = (Math.PI * 2) / BLADE_COUNT; // ~0.785 rad (45 deg each -> ~30 deg visible arc)
const BLADE_THICKNESS = 0.08;
const BLADE_MAX_ROTATION = Math.PI * 0.38; // max open rotation per blade

const GEAR_RING_RADIUS = 3.8;
const GEAR_RING_TUBE = 0.12;
const GEAR_TOOTH_COUNT = 32;
const GEAR_MAX_ROTATION = Math.PI / 4; // 45 deg

const PISTON_RADIUS = 0.03;
const PISTON_MIN_LENGTH = 0.2;
const PISTON_MAX_LENGTH = 0.6;

const LIGHT_RAY_COUNT = 4;
const LIGHT_RAY_MAX_HEIGHT = 6.0;
const LIGHT_RAY_MAX_RADIUS = 0.4;

const IRIS_Z_POSITION = 2;

const DEFAULT_LAB_COLOR = '#00BBFF';

// Staggered spiral opening constants
const BLADE_STAGGER = 0.05; // 50ms apart = 0.05 progress units (assuming ~1s total)
const BLADE_OPEN_DURATION = 0.45; // each blade takes 45% of total progress to open

// ■■ Easing Helpers ■■

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Map progress within [start, end] range to [0, 1] */
function rangeProgress(progress: number, start: number, end: number): number {
  return clamp((progress - start) / (end - start), 0, 1);
}

/** Smooth ease-in-out */
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Snap ease for final settle */
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ■■ Geometry Builders (memoized outside component) ■■

function createBladeShape(): Shape {
  const shape = new Shape();
  const innerR = BLADE_INNER_RADIUS;
  const outerR = BLADE_OUTER_RADIUS;
  // Pie-slice wedge: arc from -halfArc to +halfArc
  const halfArc = BLADE_ARC_ANGLE * 0.48; // slight gap between blades
  const segments = 12;

  // Start at inner radius, negative angle
  shape.moveTo(
    Math.cos(-halfArc) * innerR,
    Math.sin(-halfArc) * innerR
  );

  // Outer arc (inner -> outer at negative angle)
  shape.lineTo(
    Math.cos(-halfArc) * outerR,
    Math.sin(-halfArc) * outerR
  );

  // Arc along outer radius
  const outerArcPoints: Vector2[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = -halfArc + (2 * halfArc * i) / segments;
    outerArcPoints.push(
      new Vector2(Math.cos(angle) * outerR, Math.sin(angle) * outerR)
    );
  }
  // Skip first point (already there via lineTo)
  for (let i = 1; i <= segments; i++) {
    shape.lineTo(outerArcPoints[i].x, outerArcPoints[i].y);
  }

  // Back to inner radius at positive angle
  shape.lineTo(
    Math.cos(halfArc) * innerR,
    Math.sin(halfArc) * innerR
  );

  // Arc along inner radius back to start
  for (let i = segments; i >= 0; i--) {
    const angle = -halfArc + (2 * halfArc * i) / segments;
    shape.lineTo(
      Math.cos(angle) * innerR,
      Math.sin(angle) * innerR
    );
  }

  shape.closePath();
  return shape;
}

// ■■ Props ■■

interface MechanicalIrisProps {
  /** Lab color override — falls back to sceneStore.activeGameLabColor */
  labColor?: string;
}

// ■■ MechanicalIris Component ■■

export function MechanicalIris({ labColor: labColorProp }: MechanicalIrisProps) {
  // ── Store ──
  const transition = useSceneStore((s) => s.transition);
  const isTransitioning = useSceneStore((s) => s.isTransitioning);
  const activeGameLabColor = useSceneStore((s) => s.activeGameLabColor);

  // ── Refs ──
  const groupRef = useRef<Group>(null);
  const gearRingRef = useRef<Mesh>(null);
  const gearTeethRef = useRef<InstancedMesh>(null);
  const bladeRefs = useRef<(BladeRefs | null)[]>(new Array(BLADE_COUNT).fill(null));
  const pistonRefs = useRef<(PistonRef | null)[]>(new Array(BLADE_COUNT).fill(null));
  const lightRayRefs = useRef<(Mesh | null)[]>(new Array(LIGHT_RAY_COUNT).fill(null));
  const centerLightRef = useRef<PointLight>(null);

  // ── Derived Values ──
  const labColor = labColorProp || activeGameLabColor || DEFAULT_LAB_COLOR;

  // ── Memoized Geometries ──
  const bladeGeometry = useMemo(() => {
    const shape = createBladeShape();
    const extrudeSettings: ExtrudeGeometryOptions = {
      depth: BLADE_THICKNESS,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2,
    };
    const geo = new ExtrudeGeometry(shape, extrudeSettings);
    geo.translate(0, 0, -BLADE_THICKNESS / 2);
    return geo;
  }, []);

  const gearRingGeometry = useMemo(() => {
    return new TorusGeometry(GEAR_RING_RADIUS, GEAR_RING_TUBE, 16, 64);
  }, []);

  const gearToothGeometry = useMemo(() => {
    return new BoxGeometry(0.15, 0.08, 0.15);
  }, []);

  const pistonGeometry = useMemo(() => {
    return new CylinderGeometry(PISTON_RADIUS, PISTON_RADIUS, 1, 8);
  }, []);

  const lightRayGeometry = useMemo(() => {
    return new ConeGeometry(1, 1, 16, 1, true);
  }, []);

  // ── Materials (memoized) ──

  // Chrome material for gear ring and teeth — uses design token CHROME_BORDER color
  const chromeMaterial = useMemo(() => {
    return new MeshStandardMaterial({
      color: CHROME_BORDER.color,
      metalness: 0.9,
      roughness: 0.15,
      envMapIntensity: 1.2,
    });
  }, []);

  // Carbon composite blade material — dark #0A0F1F matching cockpit panels
  const bladeMaterial = useMemo(() => {
    return new MeshStandardMaterial({
      color: new Color('#0A0F1F'),
      metalness: 0.85,
      roughness: 0.35,
      emissive: new Color('#0A0F1F'),
      emissiveIntensity: 0.05, // very subtle self-illumination
    });
  }, []);

  // Chrome piston material — uses design token CHROME_BORDER colorHex
  const pistonMaterial = useMemo(() => {
    return new MeshStandardMaterial({
      color: new Color(CHROME_BORDER.colorHex),
      metalness: 0.9,
      roughness: 0.2,
    });
  }, []);

  const lightRayMaterial = useMemo(() => {
    return new MeshBasicMaterial({
      color: new Color(labColor),
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      side: DoubleSide,
      depthWrite: false,
    });
  }, [labColor]);

  // ── Geometry & Material Disposal on Unmount ──
  useEffect(() => {
    return () => {
      bladeGeometry.dispose();
      gearRingGeometry.dispose();
      gearToothGeometry.dispose();
      pistonGeometry.dispose();
      lightRayGeometry.dispose();
      chromeMaterial.dispose();
      bladeMaterial.dispose();
      pistonMaterial.dispose();
      lightRayMaterial.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Gear Teeth Instance Matrix Setup ──
  const gearTeethMatrices = useMemo(() => {
    const matrices: Matrix4[] = [];
    const tempMatrix = new Matrix4();
    const tempPosition = new Vector3();
    const tempQuaternion = new Quaternion();
    const tempScale = new Vector3(1, 1, 1);
    const tempEuler = new Euler();

    for (let i = 0; i < GEAR_TOOTH_COUNT; i++) {
      const angle = (i / GEAR_TOOTH_COUNT) * Math.PI * 2;
      const x = Math.cos(angle) * (GEAR_RING_RADIUS + GEAR_RING_TUBE + 0.06);
      const y = Math.sin(angle) * (GEAR_RING_RADIUS + GEAR_RING_TUBE + 0.06);

      tempPosition.set(x, y, 0);
      tempEuler.set(0, 0, angle);
      tempQuaternion.setFromEuler(tempEuler);

      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      matrices.push(tempMatrix.clone());
    }
    return matrices;
  }, []);

  // Initialize instanced mesh matrices
  const initGearTeeth = useCallback(
    (mesh: InstancedMesh | null) => {
      if (!mesh) return;
      gearTeethRef.current = mesh;
      for (let i = 0; i < GEAR_TOOTH_COUNT; i++) {
        mesh.setMatrixAt(i, gearTeethMatrices[i]);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
    [gearTeethMatrices]
  );

  // ── Reusable math objects for animation frame ──
  const _tempMatrix = useMemo(() => new Matrix4(), []);
  const _tempPos = useMemo(() => new Vector3(), []);
  const _tempQuat = useMemo(() => new Quaternion(), []);
  const _tempScale = useMemo(() => new Vector3(1, 1, 1), []);
  const _tempEuler = useMemo(() => new Euler(), []);

  // ── Animation Loop ──
  useFrame(() => {
    if (!groupRef.current) return;

    // Determine effective progress
    const isActive =
      isTransitioning &&
      transition != null &&
      (transition.type === 'iris-open' || transition.type === 'iris-close');

    if (!isActive || transition == null) {
      // When not transitioning, iris is fully open (invisible) or fully closed
      // Default: fully open (progress=1 equivalent for iris-open)
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    const rawProgress = transition.progress;
    // For iris-close, reverse the animation direction
    const progress =
      transition.type === 'iris-close' ? 1 - rawProgress : rawProgress;

    // ── Gear Ring Rotation ──
    const gearProgress = rangeProgress(progress, 0.0, 0.3);
    const gearAngle = easeInOut(gearProgress) * GEAR_MAX_ROTATION;

    if (gearRingRef.current) {
      gearRingRef.current.rotation.z = gearAngle;
    }

    // Update instanced gear teeth — rotate entire group with gear ring
    if (gearTeethRef.current) {
      for (let i = 0; i < GEAR_TOOTH_COUNT; i++) {
        const baseAngle = (i / GEAR_TOOTH_COUNT) * Math.PI * 2 + gearAngle;
        const x = Math.cos(baseAngle) * (GEAR_RING_RADIUS + GEAR_RING_TUBE + 0.06);
        const y = Math.sin(baseAngle) * (GEAR_RING_RADIUS + GEAR_RING_TUBE + 0.06);

        _tempPos.set(x, y, 0);
        _tempEuler.set(0, 0, baseAngle);
        _tempQuat.setFromEuler(_tempEuler);
        _tempScale.set(1, 1, 1);
        _tempMatrix.compose(_tempPos, _tempQuat, _tempScale);
        gearTeethRef.current.setMatrixAt(i, _tempMatrix);
      }
      gearTeethRef.current.instanceMatrix.needsUpdate = true;
    }

    // ── Shutter Blades (Staggered Spiral Opening) ──
    // Each blade opens sequentially: blade 0 starts at progress 0.0,
    // blade 1 at 0.05, blade 2 at 0.10, etc. (50ms apart assuming ~1s total).
    // Each blade's individual open progress = clamp((overall - delay) / duration, 0, 1).
    for (let i = 0; i < BLADE_COUNT; i++) {
      const bladeRef = bladeRefs.current[i];
      if (!bladeRef) continue;

      const bladeDelay = i * BLADE_STAGGER;
      const bladeProgress = Math.max(0, Math.min(1,
        (progress - bladeDelay) / BLADE_OPEN_DURATION
      ));

      // Use easeOutBack for the final snap feel when blade is nearly fully open
      const easedBlade =
        bladeProgress > 0.85 ? easeOutBack(bladeProgress) : easeInOut(bladeProgress);
      const bladeRotation = easedBlade * BLADE_MAX_ROTATION;

      bladeRef.pivotGroup.rotation.z = bladeRotation;
    }

    // ── Pistons ──
    for (let i = 0; i < BLADE_COUNT; i++) {
      const pistonRef = pistonRefs.current[i];
      if (!pistonRef) continue;

      const pistonProgress = rangeProgress(progress, 0.0, 0.3);
      const easedPiston = easeInOut(pistonProgress);
      const pistonLength =
        PISTON_MIN_LENGTH + easedPiston * (PISTON_MAX_LENGTH - PISTON_MIN_LENGTH);

      // Scale cylinder along Y (its length axis)
      pistonRef.mesh.scale.y = pistonLength;

      // Position piston to connect gear ring to blade pivot
      const bladeAngle = (i / BLADE_COUNT) * Math.PI * 2;
      const midRadius = GEAR_RING_RADIUS - GEAR_RING_TUBE - pistonLength / 2 - 0.05;
      pistonRef.group.position.x = Math.cos(bladeAngle) * midRadius;
      pistonRef.group.position.y = Math.sin(bladeAngle) * midRadius;
      pistonRef.group.rotation.z = bladeAngle - Math.PI / 2;
    }

    // ── Light Rays (LED-intensified accent color) ──
    const rayProgress = rangeProgress(progress, 0.5, 0.9);
    const easedRay = easeInOut(rayProgress);
    const rayMaxOpacity = EMISSIVE_LED_MULTIPLIER * 2; // design token intensified

    for (let i = 0; i < LIGHT_RAY_COUNT; i++) {
      const ray = lightRayRefs.current[i];
      if (!ray) continue;

      const height = easedRay * LIGHT_RAY_MAX_HEIGHT;
      const radius = easedRay * LIGHT_RAY_MAX_RADIUS;

      ray.scale.set(radius, Math.max(height, 0.001), radius);
      ray.position.z = height / 2;

      // Update material opacity — intensified by EMISSIVE_LED_MULTIPLIER
      const mat = ray.material as MeshBasicMaterial;
      mat.opacity = easedRay * Math.min(rayMaxOpacity, 1.0);
    }

    // ── Center Light ──
    if (centerLightRef.current) {
      const lightIntensity = easeInOut(rayProgress) * 3.0;
      centerLightRef.current.intensity = lightIntensity;
    }

    // ── Subtle self-illumination pulse on blades keyed to progress ──
    // Carbon composite blades have very subtle emissive (0.05 base)
    const pulseIntensity = 0.05 + progress * 0.1;
    bladeMaterial.emissiveIntensity = pulseIntensity;
  });

  // ── Render ──
  // Don't render anything if no transition types we care about have ever fired
  // (the group is hidden via visible=false in useFrame when not active)

  return (
    <group ref={groupRef} position={[0, 0, IRIS_Z_POSITION]} visible={false}>
      {/* ── Gear Ring ── */}
      <mesh
        ref={gearRingRef}
        geometry={gearRingGeometry}
        material={chromeMaterial}
      />

      {/* ── Gear Teeth (Instanced) ── */}
      <instancedMesh
        ref={initGearTeeth}
        args={[gearToothGeometry, chromeMaterial, GEAR_TOOTH_COUNT]}
        frustumCulled={false}
      />

      {/* ── Shutter Blades ── */}
      {Array.from({ length: BLADE_COUNT }, (_, i) => {
        const baseAngle = (i / BLADE_COUNT) * Math.PI * 2;
        // Pivot point is at the blade's inner radius edge
        const pivotX = Math.cos(baseAngle) * BLADE_INNER_RADIUS;
        const pivotY = Math.sin(baseAngle) * BLADE_INNER_RADIUS;

        return (
          <group
            key={`blade-${i}`}
            position={[pivotX, pivotY, 0]}
            rotation={[0, 0, baseAngle]}
          >
            <group
              ref={(el: Group | null) => {
                if (el) {
                  bladeRefs.current[i] = {
                    mesh: el.children[0] as Mesh,
                    pivotGroup: el,
                  };
                }
              }}
            >
              <mesh
                geometry={bladeGeometry}
                material={bladeMaterial}
                castShadow={false}
                receiveShadow={false}
              />
            </group>
          </group>
        );
      })}

      {/* ── Pistons ── */}
      {Array.from({ length: BLADE_COUNT }, (_, i) => {
        const bladeAngle = (i / BLADE_COUNT) * Math.PI * 2;
        const midRadius =
          GEAR_RING_RADIUS - GEAR_RING_TUBE - PISTON_MIN_LENGTH / 2 - 0.05;

        return (
          <group
            key={`piston-${i}`}
            ref={(el: Group | null) => {
              if (el) {
                pistonRefs.current[i] = {
                  mesh: el.children[0] as Mesh,
                  group: el,
                };
              }
            }}
            position={[
              Math.cos(bladeAngle) * midRadius,
              Math.sin(bladeAngle) * midRadius,
              0,
            ]}
            rotation={[0, 0, bladeAngle - Math.PI / 2]}
          >
            <mesh
              geometry={pistonGeometry}
              material={pistonMaterial}
              scale={[1, PISTON_MIN_LENGTH, 1]}
            />
          </group>
        );
      })}

      {/* ── Light Ray Cones ── */}
      {Array.from({ length: LIGHT_RAY_COUNT }, (_, i) => {
        const rayAngle = (i / LIGHT_RAY_COUNT) * Math.PI * 2;
        // Slight radial offset from center
        const offsetX = Math.cos(rayAngle) * 0.08;
        const offsetY = Math.sin(rayAngle) * 0.08;

        return (
          <mesh
            key={`ray-${i}`}
            ref={(el: Mesh | null) => {
              lightRayRefs.current[i] = el;
            }}
            geometry={lightRayGeometry}
            material={lightRayMaterial}
            position={[offsetX, offsetY, 0]}
            rotation={[Math.PI / 2, 0, rayAngle]}
            scale={[0.001, 0.001, 0.001]}
            frustumCulled={false}
          />
        );
      })}

      {/* ── Center Glow Point Light ── */}
      <pointLight
        ref={centerLightRef}
        color={labColor}
        intensity={0}
        distance={8}
        decay={2}
        position={[0, 0, 0.5]}
      />
    </group>
  );
}

export default MechanicalIris;
