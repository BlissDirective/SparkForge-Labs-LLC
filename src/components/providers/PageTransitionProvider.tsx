'use client';

// ================================================================
// SparkForge PageTransitionProvider — Page Transition Orchestrator
// ================================================================
// Referenced in: STAGE3_Auth_Layout_Shell_v3_PART3A
// Coordinates DOM transitions (Motion AnimatePresence) with
// 3D scene transitions (sceneStore) for seamless page changes.
//
// Transition types:
//   'lab'  — Lab entry/exit (triggers sceneStore.enterSpatial/exitSpatial)
//   'game' — Game entry/exit (triggers sceneStore.enterGame/exitGame)
//   'page' — Standard page navigation (DOM-only, no 3D scene change)
//
// Usage:
//   const { startTransition, isTransitioning } = usePageTransition();
//   startTransition('lab', '/labs/1');

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { useSceneStore } from '@/stores/sceneStore';

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────

export type TransitionType = 'lab' | 'game' | 'page';

export interface PageTransitionState {
  isTransitioning: boolean;
  transitionType: TransitionType | null;
  progress: number; // 0..1
  targetRoute: string | null;
}

interface PageTransitionContextValue extends PageTransitionState {
  startTransition: (type: TransitionType, targetRoute: string) => void;
  completeTransition: () => void;
}

// ────────────────────────────────────────
// Context
// ────────────────────────────────────────

const PageTransitionContext = createContext<PageTransitionContextValue | null>(null);

// ────────────────────────────────────────
// Constants
// ────────────────────────────────────────

const TRANSITION_DURATIONS: Record<TransitionType, number> = {
  lab: 800,   // 0.8s — matches LabReconfiguration (Decision 3.5)
  game: 600,  // 0.6s — matches MechanicalIris duration (D3D-B2)
  page: 300,  // 0.3s — quick DOM crossfade
};

const OVERLAY_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// ────────────────────────────────────────
// Provider
// ────────────────────────────────────────

interface PageTransitionProviderProps {
  children: ReactNode;
}

export function PageTransitionProvider({ children }: PageTransitionProviderProps) {
  const router = useRouter();
  const sceneStore = useSceneStore();

  const [state, setState] = useState<PageTransitionState>({
    isTransitioning: false,
    transitionType: null,
    progress: 0,
    targetRoute: null,
  });

  // Track whether a transition is in-flight to prevent overlap
  const transitionRef = useRef(false);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up progress interval
  const clearProgressTimer = useCallback(() => {
    if (progressTimerRef.current !== null) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const completeTransition = useCallback(() => {
    clearProgressTimer();
    transitionRef.current = false;

    setState({
      isTransitioning: false,
      transitionType: null,
      progress: 0,
      targetRoute: null,
    });
  }, [clearProgressTimer]);

  const startTransition = useCallback(
    (type: TransitionType, targetRoute: string) => {
      // Guard: prevent overlapping transitions
      if (transitionRef.current) return;
      transitionRef.current = true;

      const duration = TRANSITION_DURATIONS[type];

      setState({
        isTransitioning: true,
        transitionType: type,
        progress: 0,
        targetRoute,
      });

      // Kick off 3D scene transitions through sceneStore
      if (type === 'lab') {
        sceneStore.enterSpatial();
      } else if (type === 'game') {
        // Game transitions extract labColor from route or use default
        const labColor = sceneStore.activeGameLabColor || '#00BBFF';
        const gameId = targetRoute.split('/').pop() || '';
        sceneStore.enterGame(gameId, labColor);
      }

      // Animate progress from 0 to 1 over the duration
      const startTime = Date.now();
      const tickInterval = 16; // ~60fps

      clearProgressTimer();
      progressTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        setState((prev: PageTransitionState) => ({ ...prev, progress }));

        if (progress >= 1) {
          clearProgressTimer();

          // Navigate at the halfway point has already happened;
          // now finalize
          completeTransition();
        }
      }, tickInterval);

      // Navigate to the target route at the midpoint of the transition
      // so the new page loads behind the overlay
      const navigateDelay = Math.round(duration * 0.4);
      setTimeout(() => {
        router.push(targetRoute);
      }, navigateDelay);
    },
    [router, sceneStore, clearProgressTimer, completeTransition]
  );

  const contextValue: PageTransitionContextValue = {
    ...state,
    startTransition,
    completeTransition,
  };

  return (
    <PageTransitionContext.Provider value={contextValue}>
      {children}

      {/* Transition overlay — renders on top of page content */}
      <AnimatePresence>
        {state.isTransitioning && state.transitionType && (
          <motion.div
            key="page-transition-overlay"
            className="fixed inset-0 z-[9999] pointer-events-none"
            variants={OVERLAY_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            aria-hidden="true"
          >
            {/* Lab transition: radial glow sweep */}
            {state.transitionType === 'lab' && (
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at center, transparent 20%, ${
                    sceneStore.activeGameLabColor || '#00BBFF'
                  }15 60%, #0A0E1680 100%)`,
                  opacity: Math.sin(state.progress * Math.PI),
                }}
              />
            )}

            {/* Game transition: dark vignette (MechanicalIris handles 3D) */}
            {state.transitionType === 'game' && (
              <div
                className="absolute inset-0 bg-[#0A0E16]"
                style={{
                  opacity: Math.sin(state.progress * Math.PI) * 0.7,
                }}
              />
            )}

            {/* Page transition: quick fade */}
            {state.transitionType === 'page' && (
              <div
                className="absolute inset-0 bg-[#0A0E16]"
                style={{
                  opacity: Math.sin(state.progress * Math.PI) * 0.4,
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransitionContext.Provider>
  );
}

// ────────────────────────────────────────
// Hook
// ────────────────────────────────────────

export function usePageTransition(): PageTransitionContextValue {
  const context = useContext(PageTransitionContext);
  if (!context) {
    throw new Error(
      'usePageTransition must be used within a <PageTransitionProvider>. ' +
      'Wrap your layout with PageTransitionProvider.'
    );
  }
  return context;
}
