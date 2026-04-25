'use client';

// ═══════════════════════════════════════════════════════════════════
// useMagneticCursor — Spring-Physics Cursor Magnetism (Phase 4 §10.3)
// ═══════════════════════════════════════════════════════════════════
// When the cursor enters a configurable radius around a 3D control
// (nav button, dial, toggle), the control "pulls" toward the cursor
// using spring physics. Reinforces the physical console metaphor —
// controls feel magnetized to the pilot's hand.
//
// Usage:
//   const magnetic = useMagneticCursor({ radius: 0.6, strength: 0.12 });
//   const group = useRef<Group>(null);
//   useFrame(() => {
//     if (group.current) {
//       magnetic.update(group.current.position, cursorWorld);
//     }
//   });
//
// Reads from Motion's spring presets (stiffness: 300, damping: 20) as
// specified in audit §10.3. Pairs with cockpitDesignTokens for visual
// consistency.
// ═══════════════════════════════════════════════════════════════════

import { useMemo, useRef } from 'react';
import { Vector3 } from 'three';

export interface MagneticCursorOptions {
  /** Radius (in world units) within which magnetic pull activates. Default: 0.6. */
  radius?: number;
  /** Strength of the pull — fraction of distance-to-cursor applied per frame. Default: 0.12. */
  strength?: number;
  /** Spring stiffness controlling snap-back to rest. Default: 300. */
  stiffness?: number;
  /** Spring damping controlling oscillation. Default: 20. */
  damping?: number;
  /** Max displacement from rest in any axis (world units). Default: 0.15. */
  maxOffset?: number;
}

/** Ref shape the hook exposes — writes to `offset`, `velocity` per frame. */
interface MagneticState {
  offset: Vector3;
  velocity: Vector3;
  /** Whether the cursor is currently within the magnetic radius. */
  isActive: boolean;
}

/**
 * Phase 4 §10.3 — spring-physics magnetic cursor hook.
 *
 * Returns a `state` ref (current displacement + velocity + active flag)
 * and an `update(rest, cursor, delta)` method that advances the spring
 * simulation one frame and writes the new offset to state.offset.
 *
 * Apply `state.offset` to the 3D control's position each frame:
 *   mesh.position.copy(restPosition).add(state.offset);
 */
export function useMagneticCursor(options: MagneticCursorOptions = {}) {
  const radius = options.radius ?? 0.6;
  const strength = options.strength ?? 0.12;
  const stiffness = options.stiffness ?? 300;
  const damping = options.damping ?? 20;
  const maxOffset = options.maxOffset ?? 0.15;

  const state = useRef<MagneticState>({
    offset: new Vector3(),
    velocity: new Vector3(),
    isActive: false,
  });

  // Scratch objects — reused per frame to avoid GC pressure (Phase 3 pattern)
  const scratch = useMemo(
    () => ({
      delta: new Vector3(),
      springForce: new Vector3(),
      dampForce: new Vector3(),
    }),
    []
  );

  /**
   * Advance spring one frame. Call from useFrame.
   * @param rest World-space rest position of the control.
   * @param cursor World-space cursor position (null disables magnetism).
   * @param dt Frame delta (seconds).
   */
  const update = (
    rest: Vector3 | [number, number, number],
    cursor: Vector3 | null,
    dt: number
  ) => {
    const s = state.current;
    const restVec = rest instanceof Vector3 ? rest : scratch.delta.set(rest[0], rest[1], rest[2]);

    // Compute pull target: if cursor is within radius, pull toward it;
    // else pull back toward rest (offset → 0).
    let targetOffsetX = 0;
    let targetOffsetY = 0;
    let targetOffsetZ = 0;

    if (cursor) {
      const dx = cursor.x - restVec.x;
      const dy = cursor.y - restVec.y;
      const dz = cursor.z - restVec.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < radius) {
        // Magnetic zone — pull toward cursor with strength falloff
        const falloff = 1 - distance / radius; // 1 at cursor, 0 at radius edge
        targetOffsetX = dx * strength * falloff;
        targetOffsetY = dy * strength * falloff;
        targetOffsetZ = dz * strength * falloff;
        s.isActive = true;
      } else {
        s.isActive = false;
      }
    } else {
      s.isActive = false;
    }

    // Spring-damper integration: acceleration = (target - offset) × stiffness - velocity × damping
    const springX = (targetOffsetX - s.offset.x) * stiffness;
    const springY = (targetOffsetY - s.offset.y) * stiffness;
    const springZ = (targetOffsetZ - s.offset.z) * stiffness;

    s.velocity.x += (springX - s.velocity.x * damping) * dt;
    s.velocity.y += (springY - s.velocity.y * damping) * dt;
    s.velocity.z += (springZ - s.velocity.z * damping) * dt;

    s.offset.x += s.velocity.x * dt;
    s.offset.y += s.velocity.y * dt;
    s.offset.z += s.velocity.z * dt;

    // Clamp max displacement to avoid runaway
    s.offset.x = Math.max(-maxOffset, Math.min(maxOffset, s.offset.x));
    s.offset.y = Math.max(-maxOffset, Math.min(maxOffset, s.offset.y));
    s.offset.z = Math.max(-maxOffset, Math.min(maxOffset, s.offset.z));
  };

  return { state, update };
}
