// Demo session management — 1 hour timed access without account
// Stores session in localStorage with expiry timestamp

import type { Child } from '@/types';
import { DEFAULT_PREFERENCES } from '@/types';

const DEMO_SESSION_KEY = 'sparkforge-demo-session';
const DEMO_DURATION_MS = 60 * 60 * 1000; // 1 hour
export const DEMO_CHILD_ID = 'demo-child';
export const DEMO_PARENT_ID = 'demo-parent';

export interface DemoSession {
  id: string;
  startedAt: number;
  expiresAt: number;
  // D3D-1: Desktop-only platform — no tablet/mobile support
  deviceType: 'desktop';
}

export function createDemoSession(): DemoSession {
  if (typeof window === 'undefined') {
    throw new Error('createDemoSession can only be called in the browser');
  }
  const now = Date.now();
  const session: DemoSession = {
    id: `demo-${now}-${Math.random().toString(36).slice(2, 9)}`,
    startedAt: now,
    expiresAt: now + DEMO_DURATION_MS,
    deviceType: 'desktop',
  };
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getDemoSession(): DemoSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(DEMO_SESSION_KEY);
  if (!raw) return null;
  try {
    const session: DemoSession = JSON.parse(raw);
    if (Date.now() >= session.expiresAt) {
      clearDemoSession();
      return null;
    }
    return session;
  } catch {
    clearDemoSession();
    return null;
  }
}

export function getDemoTimeRemaining(): number {
  const session = getDemoSession();
  if (!session) return 0;
  return Math.max(0, session.expiresAt - Date.now());
}

export function isDemoExpired(): boolean {
  const session = getDemoSession();
  if (!session) return true;
  return Date.now() >= session.expiresAt;
}

export function clearDemoSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DEMO_SESSION_KEY);
}

export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Synthetic child profile so demo users hit the same dashboard rendering path as
// authenticated users. Without this, /home stalls forever on the activeChild gate.
export function createDemoChild(): Child {
  return {
    id: DEMO_CHILD_ID,
    parent_id: DEMO_PARENT_ID,
    display_name: 'Explorer',
    age_band: 'B',
    birth_year: new Date().getFullYear() - 10,
    xp: 0,
    level: 1,
    level_title: 'Spark',
    spark_coins: 0,
    streak_count: 0,
    streak_shields: 0,
    avatar_config: {},
    preferences: DEFAULT_PREFERENCES,
    prompt_lab_enabled: false,
    prompts_used_today: 0,
    games_played_this_week: 0,
    created_at: new Date().toISOString(),
  };
}
