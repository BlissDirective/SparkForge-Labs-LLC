'use client';

/**
 * W2-07 — live HoloC reading-plate login (TAP §2.9 / P2 exit).
 * Real email + password fields, not the Glazier stub copy. /dev/forge-hub
 * submit plays Director `login-success-hubsplit`; production `/login`
 * stays gated (no FORGE_HUB flip). Stays mounted across the P2 cycle
 * even when hidden so the form node never unmounts.
 */

import { useState } from 'react';
import { playForgeTransition } from '@/lib/forge-hub/director';
import { useForgeReducedMotion } from '@/lib/forge-hub/useForgeReducedMotion';

export interface WelcomeLoginFormProps {
  /** Visible + interactive only in `welcome`. Hidden keeps the node mounted. */
  active?: boolean;
}

export function WelcomeLoginForm({ active = true }: WelcomeLoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const reducedMotion = useForgeReducedMotion();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active || !email || !password) return;
    playForgeTransition('login-success-hubsplit', {
      reducedMotion: !!reducedMotion,
    });
  }

  return (
    <form
      data-testid="forge-hub-welcome-login"
      data-forge-holoc-login="1"
      aria-label="Log in to SparkForge"
      hidden={!active}
      className="fh-welcome-login"
      onSubmit={onSubmit}
    >
      <p className="fh-welcome-login__lede">
        Sign in to continue. This plate rides HoloC through the morph cycle.
      </p>
      <div className="fh-welcome-login__field">
        <label htmlFor="forge-hub-login-email">Email</label>
        <input
          id="forge-hub-login-email"
          data-testid="forge-hub-login-email"
          name="email"
          type="email"
          autoComplete="username email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="parent@example.com"
          disabled={!active}
        />
      </div>
      <div className="fh-welcome-login__field">
        <label htmlFor="forge-hub-login-password">Password</label>
        <input
          id="forge-hub-login-password"
          data-testid="forge-hub-login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          disabled={!active}
        />
      </div>
      <button
        type="submit"
        data-testid="forge-hub-login-submit"
        className="fh-welcome-login__submit"
        disabled={!active || !email || !password}
      >
        Log In
      </button>
    </form>
  );
}
