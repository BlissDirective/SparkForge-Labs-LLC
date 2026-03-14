'use client';

// ================================================================
// CPA v1.0 — CockpitPanels: Curved Panoramic Dashboard Geometry
// ================================================================
// Decision CPA-1: CylinderGeometry segments, 140° arc, r=4.0
// Decision CPA-2: 2 hex clusters x 3 hexes = 6 total
// Decision CPA-11: ~1200 tris budget (panels + hexes)
//
// Renders the curved cockpit shell surrounding the central viewport:
// - Top instrument bar (10% height)
// - Side panel zones (12% width each) — geometry only, content via SidePanels
// - Console desk (15% height) with hex sub-panels
// - Cutout for central viewport (56% width)
//
// Uses PanelFace, WornChrome, ConsoleBase materials.
// All geometry dims/retracts in game mode (Decision 3.4).

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COCKPIT_GEOMETRY } from '@/lib/3d/cockpitConfig';

interface CockpitPanelsProps {
  curvature: number;       // 0.0 (flat/retracted) to 0.85 (full cockpit)
  opacity: number;         // 0.0-1.0, mode-driven
  labColor: string;        // Active lab accent for hex indicators
  frameDimmed: boolean;    // Game mode dim
}

// Create a hexagonal shape
function createHexShape(radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6; // flat-top hex
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

export function CockpitPanels({
  curvature,
  opacity,
  labColor,
  frameDimmed,
}: CockpitPanelsProps) {
  const groupRef = useRef<THREE.Group>(null);
  const panelMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const hexMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const hexEmissiveRef = useRef<THREE.MeshStandardMaterial>(null);
  const targetCurvature = useRef(curvature);
  const currentCurvature = useRef(curvature);

  targetCurvature.current = curvature;

  const {
    totalWrapArc,
    panelRadius,
    centralViewportWidth,
    topBarHeight,
    consoleDeskHeight,
    hexRadius,
    hexDepth,
  } = COCKPIT_GEOMETRY;

  // Pre-compute geometry
  const panelGeometries = useMemo(() => {
    const arcRad = (totalWrapArc * Math.PI) / 180;
    const sideArcStart = (centralViewportWidth / 2) * arcRad;
    const sideArcEnd = arcRad / 2;
    const sideArc = sideArcEnd - sideArcStart;

    // Top bar: full arc, thin strip
    const topGeo = new THREE.CylinderGeometry(
      panelRadius,
      panelRadius,
      topBarHeight * 8, // Height in world units
      32, // segments
      1,
      true, // open-ended
      -arcRad / 2,
      arcRad
    );

    // Left side panel
    const leftGeo = new THREE.CylinderGeometry(
      panelRadius,
      panelRadius,
      3.5,
      16,
      1,
      true,
      -arcRad / 2,
      sideArc
    );

    // Right side panel
    const rightGeo = new THREE.CylinderGeometry(
      panelRadius,
      panelRadius,
      3.5,
      16,
      1,
      true,
      sideArcStart,
      sideArc
    );

    // Console desk (bottom)
    const consoleGeo = new THREE.CylinderGeometry(
      panelRadius * 0.95,
      panelRadius * 0.95,
      consoleDeskHeight * 8,
      32,
      1,
      true,
      -arcRad / 2,
      arcRad
    );

    // Hex shapes for sub-panels
    const hexShape = createHexShape(hexRadius);
    const hexGeo = new THREE.ExtrudeGeometry(hexShape, {
      depth: hexDepth,
      bevelEnabled: false,
    });

    return { topGeo, leftGeo, rightGeo, consoleGeo, hexGeo };
  }, [totalWrapArc, panelRadius, centralViewportWidth, topBarHeight, consoleDeskHeight, hexRadius, hexDepth]);

  // Animate curvature transitions
  useFrame(({ clock }) => {
    // Lerp curvature
    currentCurvature.current = THREE.MathUtils.lerp(
      currentCurvature.current,
      targetCurvature.current,
      0.05
    );

    // Scale group based on curvature (0 = hidden, 0.85 = full)
    if (groupRef.current) {
      const scale = currentCurvature.current / COCKPIT_GEOMETRY.panelCurvature;
      groupRef.current.scale.setScalar(Math.max(scale, 0.01));
    }

    // Update materials
    if (panelMatRef.current) {
      panelMatRef.current.opacity = opacity;
    }
    if (hexMatRef.current) {
      hexMatRef.current.opacity = opacity;
    }

    // Hex emissive pulse (4s period, dashboard mode only)
    if (hexEmissiveRef.current && !frameDimmed) {
      const pulse = Math.sin(clock.elapsedTime * 1.5708) * 0.1 + 0.4; // 0.3-0.5
      hexEmissiveRef.current.emissiveIntensity = pulse;
    }
  });

  const labColorObj = useMemo(() => new THREE.Color(labColor), [labColor]);

  return (
    <group ref={groupRef} rotation={[0, 0, 0]}>
      {/* Top instrument bar */}
      <mesh
        geometry={panelGeometries.topGeo}
        position={[0, 3.5, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial
          ref={panelMatRef}
          color="#1a1e2e"
          metalness={0.85}
          roughness={0.35}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Left side panel geometry */}
      <mesh
        geometry={panelGeometries.leftGeo}
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial
          color="#1a1e2e"
          metalness={0.85}
          roughness={0.35}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Right side panel geometry */}
      <mesh
        geometry={panelGeometries.rightGeo}
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial
          color="#1a1e2e"
          metalness={0.85}
          roughness={0.35}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Console desk (bottom) */}
      <mesh
        geometry={panelGeometries.consoleGeo}
        position={[0, -3.2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial
          color="#0e1118"
          metalness={0.7}
          roughness={0.6}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Left hex cluster (3 hexes) */}
      <group position={[-3.2, -2.5, -panelRadius + 0.5]}>
        {[0, 1, 2].map((i) => (
          <mesh
            key={`hex-left-${i}`}
            geometry={panelGeometries.hexGeo}
            position={[
              (i % 2) * hexRadius * 1.5,
              Math.floor(i / 2) * hexRadius * 1.7 - hexRadius * 0.85,
              0,
            ]}
          >
            <meshStandardMaterial
              ref={i === 0 ? hexMatRef : undefined}
              color="#8a9098"
              metalness={0.95}
              roughness={0.45}
              transparent
              opacity={opacity}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
        {/* Hex emissive indicator */}
        <mesh position={[0, 0, hexDepth + 0.01]}>
          <circleGeometry args={[hexRadius * 0.3, 6]} />
          <meshStandardMaterial
            ref={hexEmissiveRef}
            color="#000000"
            emissive={labColorObj}
            emissiveIntensity={0.4}
            transparent
            opacity={opacity * 0.8}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Right hex cluster (3 hexes) */}
      <group position={[3.2, -2.5, -panelRadius + 0.5]}>
        {[0, 1, 2].map((i) => (
          <mesh
            key={`hex-right-${i}`}
            geometry={panelGeometries.hexGeo}
            position={[
              -(i % 2) * hexRadius * 1.5,
              Math.floor(i / 2) * hexRadius * 1.7 - hexRadius * 0.85,
              0,
            ]}
          >
            <meshStandardMaterial
              color="#8a9098"
              metalness={0.95}
              roughness={0.45}
              transparent
              opacity={opacity}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
        {/* Right hex emissive indicator */}
        <mesh position={[0, 0, hexDepth + 0.01]}>
          <circleGeometry args={[hexRadius * 0.3, 6]} />
          <meshStandardMaterial
            color="#000000"
            emissive={labColorObj}
            emissiveIntensity={0.4}
            transparent
            opacity={opacity * 0.8}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}
