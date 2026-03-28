'use client';

// ════════════════════════════════════════════════════
// GUIDE CONTEXT HOOK — Phase 5: Auto-detect context from route/stores
// Updates guideStore context when navigation changes
// ════════════════════════════════════════════════════

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useGuideStore, type GuideContext } from '@/stores/guideStore';
import { useSceneStore } from '@/stores/sceneStore';

/**
 * Detects the current guide context from the URL and scene state.
 * Call this once in the dashboard layout to keep guideStore in sync.
 */
export function useGuideContext() {
  const pathname = usePathname();
  const activeScene = useSceneStore(s => s.activeScene);
  const activeGameId = useSceneStore(s => s.activeGameId);
  const setContext = useGuideStore(s => s.setContext);

  useEffect(() => {
    let context: GuideContext = 'cockpit';
    let labId: number | undefined;
    let gameId: string | undefined;

    // Game scene active
    if (activeScene === 'game' && activeGameId) {
      context = 'game';
      gameId = activeGameId;
    }
    // Spatial/lab view
    else if (activeScene === 'spatial') {
      context = 'lab';
    }
    // URL-based detection
    else if (pathname) {
      if (pathname.startsWith('/profile')) {
        context = 'profile';
      } else if (pathname.startsWith('/settings')) {
        context = 'settings';
      } else if (pathname.startsWith('/lab/')) {
        context = 'lab';
        const labMatch = pathname.match(/\/lab\/(\d+)/);
        if (labMatch) labId = parseInt(labMatch[1], 10);
      } else if (pathname.startsWith('/arcade/')) {
        context = 'game';
        const slugMatch = pathname.match(/\/arcade\/([a-z0-9-]+)/);
        if (slugMatch) gameId = slugMatch[1];
      }
    }

    setContext(context, labId, gameId);
  }, [pathname, activeScene, activeGameId, setContext]);
}
