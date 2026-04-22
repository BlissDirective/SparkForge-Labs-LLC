// STATE-ENH-005 (Recommended): Stripe checkout flow state machine
//
// Replaces the ad-hoc useState flags across /pricing + /parent/subscription
// (loading, redirecting, returning, complete, errored). A single machine
// makes the flow auditable and prevents impossible states like "loading
// AND errored" simultaneously.

import { setup, assign, fromPromise } from 'xstate';

export type CheckoutTier = 'plus' | 'forge';
export type CheckoutInterval = 'monthly' | 'yearly';

export interface CheckoutContext {
  tier: CheckoutTier | null;
  interval: CheckoutInterval;
  sessionUrl: string | null;
  errorMessage: string | null;
}

export type CheckoutEvent =
  | { type: 'SELECT_TIER'; tier: CheckoutTier; interval: CheckoutInterval }
  | { type: 'BEGIN_CHECKOUT' }
  | { type: 'CHECKOUT_SUCCESS'; url: string }
  | { type: 'CHECKOUT_ERROR'; message: string }
  | { type: 'RETURNED_FROM_STRIPE'; status: 'success' | 'canceled' }
  | { type: 'RESET' };

export const checkoutMachine = setup({
  types: {} as {
    context: CheckoutContext;
    events: CheckoutEvent;
  },
  actions: {
    setTier: assign(({ event }) => {
      if (event.type !== 'SELECT_TIER') return {};
      return { tier: event.tier, interval: event.interval, errorMessage: null };
    }),
    setSessionUrl: assign(({ event }) => {
      if (event.type !== 'CHECKOUT_SUCCESS') return {};
      return { sessionUrl: event.url };
    }),
    setError: assign(({ event }) => {
      if (event.type !== 'CHECKOUT_ERROR') return {};
      return { errorMessage: event.message };
    }),
    reset: assign(() => ({
      tier: null,
      interval: 'monthly' as CheckoutInterval,
      sessionUrl: null,
      errorMessage: null,
    })),
  },
}).createMachine({
  id: 'checkout',
  initial: 'idle',
  context: {
    tier: null,
    interval: 'monthly',
    sessionUrl: null,
    errorMessage: null,
  },
  states: {
    idle: {
      on: {
        SELECT_TIER: { target: 'tierSelected', actions: 'setTier' },
      },
    },
    tierSelected: {
      on: {
        SELECT_TIER: { actions: 'setTier' },
        BEGIN_CHECKOUT: { target: 'creatingSession' },
        RESET: { target: 'idle', actions: 'reset' },
      },
    },
    creatingSession: {
      on: {
        CHECKOUT_SUCCESS: { target: 'redirecting', actions: 'setSessionUrl' },
        CHECKOUT_ERROR: { target: 'error', actions: 'setError' },
      },
    },
    redirecting: {
      // The browser navigates away here. If we re-enter this state
      // (user hit back), the RETURNED_FROM_STRIPE event transitions
      // us to the terminal state.
      on: {
        RETURNED_FROM_STRIPE: [
          {
            guard: ({ event }) => event.status === 'success',
            target: 'complete',
          },
          { target: 'tierSelected' },
        ],
      },
    },
    complete: {
      on: { RESET: { target: 'idle', actions: 'reset' } },
    },
    error: {
      on: {
        BEGIN_CHECKOUT: { target: 'creatingSession' },
        RESET: { target: 'idle', actions: 'reset' },
      },
    },
  },
});

/** Convenience: the async actor used by hooks that prefer XState's
 *  fromPromise pattern over manual event emission. */
export const createCheckoutSessionActor = fromPromise<
  { url: string },
  { tier: CheckoutTier; interval: CheckoutInterval }
>(async ({ input }) => {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier: input.tier, interval: input.interval }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({ error: 'Checkout failed' }));
    throw new Error(json.error ?? 'Checkout failed');
  }
  const json = await res.json();
  return { url: json.data.url as string };
});
