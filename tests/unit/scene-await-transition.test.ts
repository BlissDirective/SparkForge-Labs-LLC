// ════════════════════════════════════════════════════════════════
// P2 §5.8 — sceneStore.awaitTransitionComplete contract
// ════════════════════════════════════════════════════════════════
// Verifies the promise resolves at the right moment:
//   1. If no transition is in flight → resolve immediately.
//   2. If a transition is in flight → resolve on completeTransition().
//   3. Multiple awaiters all resolve on the same completion.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useSceneStore } from '@/stores/sceneStore';

beforeEach(() => {
  useSceneStore.setState({
    isTransitioning: false,
    transition: null,
    activeScene: 'cockpit',
    previousScene: null,
  });
});

afterEach(() => {
  useSceneStore.setState({
    isTransitioning: false,
    transition: null,
    activeScene: 'cockpit',
    previousScene: null,
  });
});

describe('P2 §5.8 — awaitTransitionComplete', () => {
  it('resolves immediately when no transition is active', async () => {
    const before = Date.now();
    await useSceneStore.getState().awaitTransitionComplete();
    // Sub-ms; give Node a generous 50ms tolerance.
    expect(Date.now() - before).toBeLessThan(50);
  });

  it('resolves when completeTransition fires', async () => {
    // Simulate an in-flight transition.
    useSceneStore.setState({
      isTransitioning: true,
      transition: {
        from: 'cockpit',
        to: 'game',
        type: 'iris-close',
        progress: 0.3,
        duration: 600,
        startedAt: Date.now(),
      },
    });

    const awaiter = useSceneStore.getState().awaitTransitionComplete();

    // Fire completeTransition after a microtask — awaiter should resolve.
    queueMicrotask(() => useSceneStore.getState().completeTransition());
    await awaiter;
    expect(useSceneStore.getState().isTransitioning).toBe(false);
  });

  it('all concurrent awaiters resolve on one completeTransition', async () => {
    useSceneStore.setState({
      isTransitioning: true,
      transition: {
        from: 'cockpit',
        to: 'game',
        type: 'iris-close',
        progress: 0.1,
        duration: 600,
        startedAt: Date.now(),
      },
    });

    const [a, b, c] = [
      useSceneStore.getState().awaitTransitionComplete(),
      useSceneStore.getState().awaitTransitionComplete(),
      useSceneStore.getState().awaitTransitionComplete(),
    ];

    queueMicrotask(() => useSceneStore.getState().completeTransition());
    await Promise.all([a, b, c]);
    expect(useSceneStore.getState().isTransitioning).toBe(false);
  });
});
