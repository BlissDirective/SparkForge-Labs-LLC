'use client';

// CorePortal — TSL emitter disc + beam cone (W1-02).
// Plate already paints the SF monogram; this mesh is glow only.
// WebGPU: MeshBasicNodeMaterial from forgeCorePortalTSL.
// WebGL2: meshBasicMaterial additive fallback (same geometry).
// Click / keyboard live on the HTML ignite control (a11y + Playwright).

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, Color, DoubleSide, type Mesh } from 'three';
import { isWebGPURenderer } from '@/lib/3d/webgpuRenderer';
import { FORGE_HUB_CORE_PORTAL } from '@/config/forgeHub';
import {
  portalEmitStrength,
  portalPulseRate,
  type PortalPhase,
} from '@/lib/forge-hub/portalMachine';
import { useForgeStore } from '@/stores/sceneStore';
import {
  createBeamConeMaterial,
  createCoreGlowMaterial,
} from '@/shaders/tsl/forgeCorePortalTSL';

function beamStrength(phase: PortalPhase): number {
  if (phase === 'emit') return 1;
  if (phase === 'docked') return 0.62;
  return 0;
}

function CorePortalGpu({ phase }: { phase: PortalPhase }) {
  const glow = useMemo(() => createCoreGlowMaterial(0.22), []);
  const beam = useMemo(() => createBeamConeMaterial(0), []);

  useEffect(() => {
    glow.uniforms.uIntensity.value = portalEmitStrength(phase);
    beam.uniforms.uIntensity.value = beamStrength(phase);
  }, [beam.uniforms, glow.uniforms, phase]);

  useEffect(() => {
    const glowMat = glow.material;
    const beamMat = beam.material;
    return () => {
      const later =
        typeof requestAnimationFrame === 'function'
          ? (cb: () => void) => requestAnimationFrame(cb)
          : (cb: () => void) => setTimeout(cb, 0);
      later(() => {
        glowMat.dispose();
        beamMat.dispose();
      });
    };
  }, [beam.material, glow.material]);

  useFrame((state) => {
    const pulse =
      0.86 + 0.14 * Math.sin(state.clock.elapsedTime * portalPulseRate(phase));
    glow.uniforms.uPulse.value = pulse;
    beam.uniforms.uPulse.value = pulse;
  });

  const cfg = FORGE_HUB_CORE_PORTAL;

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, cfg.lift, 0]}
        material={glow.material}
        userData={{ forge: 'core-glow' }}
      >
        <circleGeometry args={[cfg.radius, 48]} />
      </mesh>
      <mesh
        position={[0, cfg.lift + cfg.beamHeight / 2, 0]}
        material={beam.material}
        userData={{ forge: 'core-beam' }}
        visible={beamStrength(phase) > 0}
      >
        <cylinderGeometry
          args={[
            cfg.beamRadiusTop,
            cfg.beamRadiusBottom,
            cfg.beamHeight,
            28,
            1,
            true,
          ]}
        />
      </mesh>
    </>
  );
}

function CorePortalFallback({ phase }: { phase: PortalPhase }) {
  const discRef = useRef<Mesh>(null);
  const beamRef = useRef<Mesh>(null);
  const cyan = useMemo(() => new Color('#7fe7ff'), []);
  const cfg = FORGE_HUB_CORE_PORTAL;

  useFrame((state) => {
    const pulse =
      0.86 + 0.14 * Math.sin(state.clock.elapsedTime * portalPulseRate(phase));
    const disc = discRef.current;
    const beam = beamRef.current;
    if (disc) {
      const mat = disc.material as { opacity: number };
      mat.opacity = portalEmitStrength(phase) * pulse;
    }
    if (beam) {
      const mat = beam.material as { opacity: number };
      mat.opacity = beamStrength(phase) * pulse * 0.55;
      beam.visible = beamStrength(phase) > 0;
    }
  });

  return (
    <>
      <mesh
        ref={discRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, cfg.lift, 0]}
        userData={{ forge: 'core-glow' }}
      >
        <circleGeometry args={[cfg.radius, 48]} />
        <meshBasicMaterial
          color={cyan}
          transparent
          opacity={portalEmitStrength(phase)}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh
        ref={beamRef}
        position={[0, cfg.lift + cfg.beamHeight / 2, 0]}
        userData={{ forge: 'core-beam' }}
        visible={beamStrength(phase) > 0}
      >
        <cylinderGeometry
          args={[
            cfg.beamRadiusTop,
            cfg.beamRadiusBottom,
            cfg.beamHeight,
            28,
            1,
            true,
          ]}
        />
        <meshBasicMaterial
          color="#4de9ff"
          transparent
          opacity={beamStrength(phase) * 0.55}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}

export function CorePortal() {
  const gl = useThree((s) => s.gl);
  const phase = useForgeStore((s) => s.forge.portalPhase);
  const gpu = isWebGPURenderer(gl);

  return (
    <group
      position={[...FORGE_HUB_CORE_PORTAL.position]}
      userData={{ forge: 'core-portal' }}
    >
      {gpu ? <CorePortalGpu phase={phase} /> : <CorePortalFallback phase={phase} />}
    </group>
  );
}
