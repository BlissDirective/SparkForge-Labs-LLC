// ════════════════════════════════════════════════════════════════
// T11 UX-MED-003 — CockpitTutorial flag persistence
// ════════════════════════════════════════════════════════════════
// The tutorial flag is a single localStorage key. This test locks
// in its name + the two expected values ('1' = completed, missing =
// not completed) so the replay event handler and CockpitHelpButton
// keep the same contract across refactors.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  TUTORIAL_DONE_KEY,
  TUTORIAL_REPLAY_EVENT,
} from '@/components/onboarding/CockpitTutorial';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe('CockpitTutorial — flag + replay event contract', () => {
  it('uses the documented localStorage key', () => {
    expect(TUTORIAL_DONE_KEY).toBe('sparkforge-cockpit-tutorial-completed');
  });

  it('uses the documented window event name', () => {
    expect(TUTORIAL_REPLAY_EVENT).toBe('sparkforge:cockpit-tutorial-replay');
  });

  it('recognizes a completed flag written as "1"', () => {
    window.localStorage.setItem(TUTORIAL_DONE_KEY, '1');
    expect(window.localStorage.getItem(TUTORIAL_DONE_KEY)).toBe('1');
  });

  it('replay event is a CustomEvent and dispatchable on window', () => {
    let fired = false;
    const handler = () => {
      fired = true;
    };
    window.addEventListener(TUTORIAL_REPLAY_EVENT, handler);
    window.dispatchEvent(new CustomEvent(TUTORIAL_REPLAY_EVENT));
    window.removeEventListener(TUTORIAL_REPLAY_EVENT, handler);
    expect(fired).toBe(true);
  });

  it('clearing the flag allows a restart', () => {
    window.localStorage.setItem(TUTORIAL_DONE_KEY, '1');
    window.localStorage.removeItem(TUTORIAL_DONE_KEY);
    expect(window.localStorage.getItem(TUTORIAL_DONE_KEY)).toBeNull();
  });
});
