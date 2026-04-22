'use client';

// ════════════════════════════════════════════════════════════════
// CommandPalette — UX-ENH Command Palette (Recommended)
// Phase 5 task #7 · Final-Audit_04-15-2026.md
// ════════════════════════════════════════════════════════════════
// ⌘K / Ctrl-K — fuzzy search + keyboard-first nav. Wraps cmdk
// (github.com/pacocoursey/cmdk) with SparkForge styling and
// registry (src/lib/commandPalette.ts).
//
// Mount once at app root. Uses a portal via radix-ui-dialog so it
// floats above any 3D Canvas without z-index gymnastics.
//
// Gated behind the COMMAND_PALETTE feature flag so it can be rolled
// out progressively.
// ════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import * as Dialog from '@radix-ui/react-dialog';
import {
  buildPaletteRegistry,
  pushRecent,
  readRecent,
  type PaletteItem,
} from '@/lib/commandPalette';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { isFeatureEnabled } from '@/lib/feature-flags';

interface CommandPaletteProps {
  /** Optional override — default true when the flag is on. */
  enabled?: boolean;
}

export function CommandPalette({ enabled }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const parent = useAuthStore((s) => s.parent);
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const toggleReduceMotion = useUIStore((s) => s.toggleReduceMotion);
  const toggleHighContrast = useUIStore((s) => s.toggleHighContrast);
  const setPerformanceMode = useUIStore((s) => s.setPerformanceMode);
  const performanceMode = useUIStore((s) => s.performanceMode);

  // Feature flag gate.
  const flagOn = enabled ?? isFeatureEnabled('COMMAND_PALETTE');

  // Build registry once per context.
  const items = useMemo<PaletteItem[]>(
    () =>
      buildPaletteRegistry({
        isAdmin: Boolean(parent?.is_admin),
        isDemo: Boolean(isDemoMode),
      }),
    [parent?.is_admin, isDemoMode],
  );

  // Recent items (re-read when opening).
  const [recentIds, setRecentIds] = useState<string[]>([]);
  useEffect(() => {
    if (open) setRecentIds(readRecent());
  }, [open]);
  const recentItems = useMemo<PaletteItem[]>(() => {
    const byId = new Map(items.map((i) => [i.id, i]));
    return recentIds.map((id) => byId.get(id)).filter(Boolean) as PaletteItem[];
  }, [items, recentIds]);

  // Global hotkey ⌘K / Ctrl-K.
  useEffect(() => {
    if (!flagOn) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flagOn]);

  const run = useCallback(
    (item: PaletteItem) => {
      pushRecent(item.id);
      setOpen(false);
      setQuery('');
      if (item.href) {
        router.push(item.href);
        return;
      }
      // Action items — dispatch by id.
      switch (item.id) {
        case 'action.toggle-reduce-motion':
          toggleReduceMotion();
          break;
        case 'action.toggle-high-contrast':
          toggleHighContrast();
          break;
        case 'action.toggle-perf-mode':
          setPerformanceMode(!performanceMode);
          break;
        case 'action.signout':
          // Sign-out is a GET on our existing /api/auth/logout plus redirect.
          fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
            .then(() => router.push('/login'))
            .catch(() => router.push('/login'));
          break;
        default:
          item.action?.();
      }
    },
    [router, toggleReduceMotion, toggleHighContrast, setPerformanceMode, performanceMode],
  );

  if (!flagOn) return null;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed z-[9999] left-1/2 top-[20%] -translate-x-1/2 w-[min(640px,92vw)]
            rounded-xl border border-white/10 bg-[#0b0e1a] shadow-2xl
            focus-visible:outline-none"
          aria-label="Command palette"
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Command label="Command palette" shouldFilter>
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search commands, labs, settings…"
              className="w-full bg-transparent border-0 border-b border-white/10
                px-4 py-3 text-white/90 placeholder:text-white/40
                focus:outline-none focus:border-white/30"
              autoFocus
            />
            <Command.List className="max-h-[320px] overflow-y-auto py-2">
              <Command.Empty className="px-4 py-6 text-center text-white/50 text-sm">
                No results. Try another search.
              </Command.Empty>

              {query.trim() === '' && recentItems.length > 0 && (
                <Command.Group heading="Recent" className="px-2">
                  {recentItems.map((item) => (
                    <PaletteRow key={`recent-${item.id}`} item={item} onSelect={() => run(item)} />
                  ))}
                </Command.Group>
              )}

              {(
                [
                  'Navigation',
                  'Games',
                  'Settings',
                  'Parent',
                  'Admin',
                  'Actions',
                ] as PaletteItem['group'][]
              ).map((group) => {
                const inGroup = items.filter((i) => i.group === group);
                if (inGroup.length === 0) return null;
                return (
                  <Command.Group key={group} heading={group} className="px-2">
                    {inGroup.map((item) => (
                      <PaletteRow key={item.id} item={item} onSelect={() => run(item)} />
                    ))}
                  </Command.Group>
                );
              })}
            </Command.List>
            <div className="border-t border-white/10 px-3 py-2 flex items-center justify-between text-[11px] text-white/40">
              <span>
                <kbd className="px-1 py-0.5 rounded border border-white/15 bg-white/5">↑↓</kbd> nav
                <span className="mx-1">·</span>
                <kbd className="px-1 py-0.5 rounded border border-white/15 bg-white/5">↵</kbd> select
                <span className="mx-1">·</span>
                <kbd className="px-1 py-0.5 rounded border border-white/15 bg-white/5">esc</kbd> close
              </span>
              <span>SparkForge</span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PaletteRow({ item, onSelect }: { item: PaletteItem; onSelect: () => void }) {
  return (
    <Command.Item
      value={`${item.label} ${item.keywords ?? ''}`}
      onSelect={onSelect}
      className="px-3 py-2 rounded-md text-white/85 text-sm cursor-pointer
        data-[selected=true]:bg-white/10 data-[selected=true]:text-white
        flex items-center justify-between gap-3"
    >
      <span className="truncate">{item.label}</span>
      {item.hint && <span className="text-white/40 text-xs truncate">{item.hint}</span>}
    </Command.Item>
  );
}
