// ════════════════════════════════════════════════════════════════
// commandPalette — UX-ENH Command Palette (Recommended)
// Phase 5 task #7 · Final-Audit_04-15-2026.md
// ════════════════════════════════════════════════════════════════
// Static command + entity registry feeding the ⌘K palette. Entries
// are rendered into a fuzzy-searchable list in the CommandPalette
// component. Search scores are computed by cmdk — we just provide
// searchable strings.
//
// Scope (Recommended tier): fuzzy search across games/settings/labs,
// recent actions, keyboard-first nav, context-aware results. No AI
// assistance (Max/Ultra).
// ════════════════════════════════════════════════════════════════

export interface PaletteItem {
  id: string;
  label: string;
  /** Optional secondary text rendered in muted tone. */
  hint?: string;
  /** Comma-joined extra tokens for fuzzy matching (e.g. aliases). */
  keywords?: string;
  /** Section header the item belongs to. */
  group: 'Navigation' | 'Games' | 'Settings' | 'Parent' | 'Actions' | 'Recent' | 'Admin';
  /** Where to send the user on select. */
  href?: string;
  /** Alternative: run a callback when selected (e.g. toggle a setting). */
  action?: () => void;
  /** When truthy, item only shows to admin users. */
  adminOnly?: boolean;
  /** When truthy, item only shows to parents (hide from demo). */
  parentOnly?: boolean;
}

const NAV: PaletteItem[] = [
  { id: 'nav.home', label: 'Home', hint: 'Dashboard', group: 'Navigation', href: '/home', keywords: 'dashboard overview main' },
  { id: 'nav.labs', label: 'Labs', hint: 'Browse all labs', group: 'Navigation', href: '/labs', keywords: 'worlds games list' },
  { id: 'nav.arcade', label: 'Arcade', hint: 'Full game list', group: 'Navigation', href: '/arcade', keywords: 'games all 35' },
  { id: 'nav.profile', label: 'Profile', hint: 'Your avatar + stats', group: 'Navigation', href: '/profile', keywords: 'me badges trophies' },
  { id: 'nav.settings', label: 'Settings', hint: 'Audio, visuals, a11y', group: 'Navigation', href: '/settings', keywords: 'preferences config options' },
  { id: 'nav.sessions', label: 'Active Sessions', hint: 'Manage signed-in devices', group: 'Navigation', href: '/settings/sessions', keywords: 'login device revoke security', parentOnly: true },
  { id: 'nav.linkedAccounts', label: 'Linked Accounts', hint: 'Google, Apple, Microsoft', group: 'Navigation', href: '/settings/linked-accounts', keywords: 'oauth google apple microsoft azure link unlink provider', parentOnly: true },
];

const LABS: PaletteItem[] = [
  { id: 'lab.1', label: 'Lab 1 — AI Spy', group: 'Games', href: '/labs/1', keywords: 'spy detective world1' },
  { id: 'lab.2', label: 'Lab 2 — Prompt Lab', group: 'Games', href: '/labs/2', keywords: 'prompt writing world2' },
  { id: 'lab.3', label: 'Lab 3 — Pet Trainer', group: 'Games', href: '/labs/3', keywords: 'pet train animal world3' },
  { id: 'lab.4', label: 'Lab 4 — Neural Builder', group: 'Games', href: '/labs/4', keywords: 'neural network world4' },
  { id: 'lab.5', label: 'Lab 5 — Data Detective', group: 'Games', href: '/labs/5', keywords: 'data analyze world5' },
  { id: 'lab.6', label: 'Lab 6 — Bias Detector', group: 'Games', href: '/labs/6', keywords: 'bias ethics world6' },
  { id: 'lab.7', label: 'Lab 7 — Future Forge', group: 'Games', href: '/labs/7', keywords: 'future scenario world7' },
  { id: 'lab.8', label: 'Lab 8 — AI Ethics', group: 'Games', href: '/labs/8', keywords: 'ethics moral world8' },
  { id: 'lab.9', label: 'Lab 9 — Safe Web', group: 'Games', href: '/labs/9', keywords: 'safety internet world9' },
  { id: 'lab.10', label: 'Lab 10 — Career Explorer', group: 'Games', href: '/labs/10', keywords: 'career job world10' },
];

const PARENT: PaletteItem[] = [
  { id: 'parent.dashboard', label: 'Parent Dashboard', group: 'Parent', href: '/parent', parentOnly: true, keywords: 'parental overview kids' },
  { id: 'parent.addchild', label: 'Add a child', group: 'Parent', href: '/parent/add-child', parentOnly: true, keywords: 'new child profile kid' },
  { id: 'parent.subscription', label: 'Subscription & Billing', group: 'Parent', href: '/parent/subscription', parentOnly: true, keywords: 'stripe pay plan tier' },
  { id: 'parent.export', label: 'Export data', group: 'Parent', href: '/parent/export', parentOnly: true, keywords: 'coppa download json' },
  { id: 'parent.prompts', label: 'Prompt history', group: 'Parent', href: '/parent/prompt-history', parentOnly: true, keywords: 'prompt log ai chat' },
];

const ADMIN: PaletteItem[] = [
  { id: 'admin.content', label: 'Content review', group: 'Admin', href: '/admin', adminOnly: true, keywords: 'content queue publish' },
];

const ACTIONS: PaletteItem[] = [
  // Bound to toggles in CommandPalette component.
  { id: 'action.toggle-reduce-motion', label: 'Toggle reduce motion', group: 'Actions', keywords: 'accessibility animation motion a11y' },
  { id: 'action.toggle-high-contrast', label: 'Toggle high contrast', group: 'Actions', keywords: 'a11y color accessibility' },
  { id: 'action.toggle-perf-mode', label: 'Toggle performance mode', group: 'Actions', keywords: 'fps 3d quality low' },
  { id: 'action.signout', label: 'Sign out', group: 'Actions', keywords: 'logout quit leave' },
];

export function buildPaletteRegistry(
  ctx: { isAdmin: boolean; isDemo: boolean },
): PaletteItem[] {
  const all = [...NAV, ...LABS, ...PARENT, ...ADMIN, ...ACTIONS];
  return all.filter((item) => {
    if (item.adminOnly && !ctx.isAdmin) return false;
    if (item.parentOnly && ctx.isDemo) return false;
    return true;
  });
}

// ─── Recent actions (localStorage-backed) ─────────────────────────

const STORAGE_KEY = 'sparkforge-cmdk-recent';
const MAX_RECENT = 6;

export function readRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string').slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function pushRecent(itemId: string): void {
  if (typeof window === 'undefined') return;
  const current = readRecent();
  const next = [itemId, ...current.filter((id) => id !== itemId)].slice(0, MAX_RECENT);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota or private mode */
  }
}

export function clearRecent(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
