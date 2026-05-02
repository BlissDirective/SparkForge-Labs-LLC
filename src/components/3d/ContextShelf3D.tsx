'use client';

// ════════════════════════════════════════════════════════════════
// ContextShelf3D — Stage 11B dynamic scene content
// ════════════════════════════════════════════════════════════════
// Lab 8 | Color: #8F96FA (violet)
//
// What this component owns (per Doc 2 §E.8):
//   • A glowing 3D bookshelf — cards rendered as floating slabs
//   • Token-bar fills as cards added; turns red as you exceed budget
//   • Cards color-coded by relevance to active question
//   • Reduced cards visibly half-height; isolated cards translucent
//   • Rot glow envelopes the shelf as Rot rises
//
// Reads from useContextArchitectStore.
// ════════════════════════════════════════════════════════════════

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
} from 'three';

import { useContextArchitectStore } from '@/stores/contextArchitectStore';
import { getCard, reducedTokensFor, THEME_META } from '@/lib/contextarch/cardLibrary';
import type { ShelfPlacement } from '@/types/contextArchitect';

const LAB8_HEX = '#8F96FA';
const LAB8_SOFT = '#C2C7FF';
const ROT_HEX = '#FF7050';

// ─── Shelf platform + token-budget bar ───────────────────────────

function ShelfPlatform() {
  const used = useContextArchitectStore((s) => s.used);
  const budget = useContextArchitectStore((s) => s.budget);
  const rot = useContextArchitectStore((s) => s.rot);

  const fillRef = useRef<MeshBasicMaterial>(null);
  const rotGlowRef = useRef<MeshBasicMaterial>(null);
  const platformGlowRef = useRef<MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (fillRef.current) {
      // Color shifts toward red when over budget, magenta beyond.
      const overFraction = budget > 0 ? Math.max(0, used - budget) / budget : 0;
      const baseColor = new Color(LAB8_HEX);
      const dangerColor = new Color(ROT_HEX);
      baseColor.lerp(dangerColor, Math.min(1, overFraction));
      fillRef.current.color.copy(baseColor);
    }
    if (rotGlowRef.current) {
      // Rot glow opacity ties directly to rot value; pulses faster as rot rises.
      const baseOpacity = rot * 0.5;
      const pulse = rot > 0.1 ? rot * 0.15 * Math.sin(t * (1 + rot * 4)) : 0;
      rotGlowRef.current.opacity = baseOpacity + pulse;
    }
    if (platformGlowRef.current) {
      platformGlowRef.current.opacity = 0.45 + 0.1 * Math.sin(t * 0.6);
    }
  });

  // Token bar runs across the front edge of the shelf at y=0.6.
  const fillFraction = budget > 0 ? Math.min(1.4, used / budget) : 0;
  const fillWidth = Math.max(0.02, fillFraction * 2.4);

  return (
    <group position={[0, 0.6, 0]}>
      {/* Lectern-mounted shelf platform - thin glowing disk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.35, 1.42, 48]} />
        <meshBasicMaterial ref={platformGlowRef} color={LAB8_HEX} side={DoubleSide} transparent opacity={0.55} />
      </mesh>
      {/* Token-bar background */}
      <mesh position={[0, 0.5, 1.4]}>
        <boxGeometry args={[2.4, 0.06, 0.04]} />
        <meshBasicMaterial color="#1A1F38" />
      </mesh>
      {/* Token-bar fill (color shifts red over budget) */}
      <mesh position={[-1.2 + fillWidth / 2, 0.5, 1.42]}>
        <boxGeometry args={[fillWidth, 0.04, 0.05]} />
        <meshBasicMaterial ref={fillRef} color={LAB8_HEX} />
      </mesh>
      {/* Rot envelope - large translucent sphere around the lectern */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[2.6, 24, 16]} />
        <meshBasicMaterial ref={rotGlowRef} color={ROT_HEX} transparent opacity={0} side={DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─── Card slab (one per shelf placement) ─────────────────────────

interface CardSlabProps {
  placement: ShelfPlacement;
  isKey: boolean;          // true if part of the active question's keyCardIds
  isDecoy: boolean;        // true if a decoy
  index: number;
}

function CardSlab({ placement, isKey, isDecoy, index }: CardSlabProps) {
  const card = getCard(placement.cardId);
  const groupRef = useRef<Group>(null);
  const fillRef = useRef<MeshBasicMaterial>(null);

  const color = useMemo(() => {
    if (!card) return new Color(LAB8_HEX);
    if (isKey) return new Color(THEME_META[card.theme].color);
    if (isDecoy) return new Color(ROT_HEX);
    // Neutral cards fade to LAB8_SOFT.
    return new Color(LAB8_SOFT);
  }, [card, isKey, isDecoy]);

  // Slab dimensions tied to card size.
  const tokenSize = card ? (placement.reduced ? reducedTokensFor(card) : card.tokens) : 16;
  const slabWidth = 0.4 + (tokenSize / 64) * 0.6;       // 0.475 .. 1.0
  const slabHeight = placement.reduced ? 0.12 : 0.22;
  const slabDepth = 0.04;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // Idle bob, indexed so cards don't pulse in lockstep.
    groupRef.current.position.y = 0.7 + 0.25 + 0.018 * Math.sin(clock.elapsedTime * 1.1 + index * 0.4);
    if (fillRef.current) {
      // Isolated cards are translucent.
      fillRef.current.opacity = placement.isolated ? 0.25 : (isKey ? 0.95 : 0.75);
    }
  });

  if (!card) return null;

  // Layout: cards arranged in a horizontal row above the lectern.
  // Up to 6 cards in one row, then wrap.
  const COL = 6;
  const col = index % COL;
  const row = Math.floor(index / COL);
  const x = (col - (COL - 1) / 2) * 0.65;
  const z = -row * 0.7 - 0.2;

  return (
    <group ref={groupRef} position={[x, 1.0, z]}>
      <mesh>
        <boxGeometry args={[slabWidth, slabHeight, slabDepth]} />
        <meshBasicMaterial ref={fillRef} color={color} transparent opacity={0.85} />
      </mesh>
      {/* Wireframe outline */}
      <mesh>
        <boxGeometry args={[slabWidth * 1.04, slabHeight * 1.08, slabDepth * 1.5]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.45} />
      </mesh>
      {/* Reduced indicator: small notch on the side */}
      {placement.reduced && (
        <mesh position={[slabWidth / 2 + 0.04, 0, 0]}>
          <boxGeometry args={[0.04, slabHeight * 0.7, slabDepth * 0.8]} />
          <meshBasicMaterial color="#D9A430" transparent opacity={0.8} />
        </mesh>
      )}
      {/* Isolated indicator: floating dim ring above */}
      {placement.isolated && (
        <mesh position={[0, slabHeight / 2 + 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[slabWidth / 2 + 0.04, slabWidth / 2 + 0.07, 16]} />
          <meshBasicMaterial color={LAB8_SOFT} side={DoubleSide} transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// ─── External-memory shelf (offloaded cards, dimmer, off to side) ─

function ExternalMemoryStack() {
  const external = useContextArchitectStore((s) => s.external);

  return (
    <group position={[2.6, 0.85, 0.2]} rotation={[0, -0.25, 0]}>
      {external.map((p, i) => {
        const card = getCard(p.cardId);
        if (!card) return null;
        const color = THEME_META[card.theme].color;
        return (
          <group key={p.cardId} position={[0, i * 0.13, 0]}>
            <mesh>
              <boxGeometry args={[0.5, 0.08, 0.04]} />
              <meshBasicMaterial color={color} transparent opacity={0.4} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.52, 0.09, 0.05]} />
              <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ─── Top-level scene component ───────────────────────────────────

export default function ContextShelf3D() {
  const shelf = useContextArchitectStore((s) => s.shelf);
  const currentQuestion = useContextArchitectStore((s) => s.currentQuestion);

  const keySet = useMemo(
    () => new Set(currentQuestion?.keyCardIds ?? []),
    [currentQuestion],
  );
  const decoySet = useMemo(
    () => new Set(currentQuestion?.decoyCardIds ?? []),
    [currentQuestion],
  );

  return (
    <group>
      <ShelfPlatform />
      {shelf.map((p, i) => (
        <CardSlab
          key={p.cardId}
          placement={p}
          isKey={keySet.has(p.cardId)}
          isDecoy={decoySet.has(p.cardId)}
          index={i}
        />
      ))}
      <ExternalMemoryStack />
    </group>
  );
}
