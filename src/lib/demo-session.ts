// Demo session management — 1 hour timed access without account
// Stores session in localStorage with expiry timestamp

const DEMO_SESSION_KEY = 'sparkforge-demo-session';
const DEMO_DURATION_MS = 60 * 60 * 1000; // 1 hour

export interface DemoSession {
  id: string;
  startedAt: number;
  expiresAt: number;
  deviceType: 'desktop' | 'tablet' | 'mobile' | null;
}

export function createDemoSession(): DemoSession {
  const now = Date.now();
  const session: DemoSession = {
    id: `demo-${now}-${Math.random().toString(36).slice(2, 9)}`,
    startedAt: now,
    expiresAt: now + DEMO_DURATION_MS,
    deviceType: null,
  };
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getDemoSession(): DemoSession | null {
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
  localStorage.removeItem(DEMO_SESSION_KEY);
}

export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
