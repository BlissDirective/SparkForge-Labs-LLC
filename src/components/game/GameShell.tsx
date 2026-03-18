'use client';

// ================================================================
// GAME SHELL — Standard wrapper for all 35 SparkForge games
// ================================================================
// Initializes gameStore on mount, provides consistent layout wrapper.
// Every game passes configuration props; GameShell calls startGame()
// and renders children inside a full-height container.
//
// Created as a prerequisite stub for Stage 6B Part B.
// Full chrome bezel + LED rim visuals are handled per-game in v3.
//
// FIX-DUAL-CANVAS: Calls setGameActive(true/false) on mount/unmount
// so StationFrame unmounts its R3F Canvas during gameplay.
//
// LOD Integration: Wraps children with LODWrapper so all 3D components
// within games can access LOD state via useLODContext(). Tier is
// resolved from gameRegistry by gameId.

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useUIStore } from '@/stores/uiStore';
import { LODWrapper } from '@/components/3d/LODWrapper';
import { GenericGameParticles } from '@/components/3d/GenericGameParticles';
import { GAME_REGISTRY, type GameTier } from '@/config/gameRegistry';

/** Map gameRegistry tier strings to LODWrapper tier prop */
function toLODTier(tier: GameTier): 'flagship' | 'flLite' | 'standard' {
  if (tier === 'fl-lite') return 'flLite';
  return tier; // 'flagship' | 'standard' pass through
}

interface GameShellProps {
  gameId: string;
  title: string;
  worldNumber: number;
  worldColor: string;
  xpReward?: number;
  totalRounds: number;
  hints?: number;
  children: ReactNode;
}

export function GameShell({
  gameId,
  title,
  worldNumber,
  worldColor,
  totalRounds,
  hints = 3,
  children,
}: GameShellProps) {
  const startGame = useGameStore((s) => s.startGame);
  const resetGame = useGameStore((s) => s.resetGame);
  const setGameActive = useUIStore((s) => s.setGameActive);

  // Resolve LOD tier from game registry
  const lodTier = useMemo(() => {
    const entry = GAME_REGISTRY.find((g) => g.slug === gameId);
    return entry ? toLODTier(entry.tier) : 'standard';
  }, [gameId]);

  // Mobile detection for CSS particle fallback
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    startGame(gameId, totalRounds, hints);
    // FIX-DUAL-CANVAS: Signal StationFrame to unmount its R3F Canvas
    // so this game gets full GPU ownership for its own 3D content.
    setGameActive(true);
    return () => {
      setGameActive(false);
      resetGame();
    };
  }, [gameId, totalRounds, hints, startGame, resetGame, setGameActive]);

  return (
    <div
      className="h-full w-full"
      data-game-id={gameId}
      data-world={worldNumber}
      data-world-color={worldColor}
      role="region"
      aria-label={`${title} game`}
    >
      {/* Mobile CSS particle fallback — provides visual bg when 3D Canvas is hidden */}
      {isMobile && <GenericGameParticles color={worldColor} />}
      <LODWrapper tier={lodTier} adaptive>
        {children}
      </LODWrapper>
    </div>
  );
}

export default GameShell;
