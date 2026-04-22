// STATE-ENH-005 (Recommended): Onboarding / consent flow machine
//
// Covers the post-signup onboarding walk:
//   verify-email → coppa-consent → first-child → tutorial → done
//
// Each step can fail (backend error, user cancels) and re-enters its
// own state with an error context. The `done` terminal fires a final
// event consumers can subscribe to for navigation.

import { setup, assign } from 'xstate';

export type OnboardingStep =
  | 'verifyEmail'
  | 'coppaConsent'
  | 'firstChild'
  | 'tutorial'
  | 'done';

export interface OnboardingContext {
  parentEmail: string | null;
  emailVerified: boolean;
  consentGiven: boolean;
  firstChildCreated: boolean;
  lastError: string | null;
}

export type OnboardingEvent =
  | { type: 'EMAIL_VERIFIED' }
  | { type: 'CONSENT_GIVEN' }
  | { type: 'CHILD_CREATED' }
  | { type: 'TUTORIAL_DONE' }
  | { type: 'ERROR'; message: string }
  | { type: 'SKIP_TUTORIAL' }
  | { type: 'BACK' }
  | { type: 'RESET' };

export const onboardingMachine = setup({
  types: {} as {
    context: OnboardingContext;
    events: OnboardingEvent;
    input: { parentEmail: string | null };
  },
  actions: {
    markEmailVerified: assign({ emailVerified: true, lastError: null }),
    markConsent: assign({ consentGiven: true, lastError: null }),
    markChildCreated: assign({ firstChildCreated: true, lastError: null }),
    setError: assign(({ event }) => {
      if (event.type !== 'ERROR') return {};
      return { lastError: event.message };
    }),
    reset: assign(() => ({
      parentEmail: null,
      emailVerified: false,
      consentGiven: false,
      firstChildCreated: false,
      lastError: null,
    })),
  },
}).createMachine({
  id: 'onboarding',
  initial: 'verifyEmail',
  context: ({ input }) => ({
    parentEmail: input.parentEmail,
    emailVerified: false,
    consentGiven: false,
    firstChildCreated: false,
    lastError: null,
  }),
  states: {
    verifyEmail: {
      on: {
        EMAIL_VERIFIED: { target: 'coppaConsent', actions: 'markEmailVerified' },
        ERROR: { actions: 'setError' },
      },
    },
    coppaConsent: {
      on: {
        CONSENT_GIVEN: { target: 'firstChild', actions: 'markConsent' },
        BACK: { target: 'verifyEmail' },
        ERROR: { actions: 'setError' },
      },
    },
    firstChild: {
      on: {
        CHILD_CREATED: { target: 'tutorial', actions: 'markChildCreated' },
        BACK: { target: 'coppaConsent' },
        ERROR: { actions: 'setError' },
      },
    },
    tutorial: {
      on: {
        TUTORIAL_DONE: { target: 'done' },
        SKIP_TUTORIAL: { target: 'done' },
        ERROR: { actions: 'setError' },
      },
    },
    done: {
      type: 'final',
    },
  },
  on: {
    RESET: { target: '.verifyEmail', actions: 'reset' },
  },
});
