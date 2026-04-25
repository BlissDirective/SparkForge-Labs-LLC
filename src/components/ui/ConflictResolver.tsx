'use client';

// ════════════════════════════════════════════════════════════════
// ConflictResolver — STATE-ENH Optimistic primitives (Max)
// Phase 5 task #10 · Final-Audit_04-15-2026.md
// ════════════════════════════════════════════════════════════════
// Global conflict dialog surfaced when an optimistic mutation's
// predicted value diverges from what the server returned.
//
// Not rendered by default — an imperative API (`openConflictResolver`)
// lets any `onConflict` hook invoke it.
// ════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

export interface ConflictPayload {
  title: string;
  description?: string;
  predicted: unknown;
  actual: unknown;
  onKeepLocal: () => void;
  onAcceptServer: () => void;
}

type Subscriber = (p: ConflictPayload | null) => void;
const subs = new Set<Subscriber>();
let current: ConflictPayload | null = null;

export function openConflictResolver(p: ConflictPayload): void {
  current = p;
  for (const s of subs) s(p);
}

export function closeConflictResolver(): void {
  current = null;
  for (const s of subs) s(null);
}

export function ConflictResolver() {
  const [payload, setPayload] = useState<ConflictPayload | null>(current);

  useEffect(() => {
    const sub: Subscriber = (p) => setPayload(p);
    subs.add(sub);
    return () => {
      subs.delete(sub);
    };
  }, []);

  if (!payload) return null;

  return (
    <Dialog.Root open onOpenChange={(open) => !open && closeConflictResolver()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
            w-[min(480px,92vw)] rounded-xl border border-white/10 bg-[#0b0e1a]
            shadow-2xl p-5"
        >
          <Dialog.Title className="text-lg font-semibold text-white/90 mb-1">
            {payload.title}
          </Dialog.Title>
          {payload.description && (
            <Dialog.Description className="text-white/60 text-sm mb-4">
              {payload.description}
            </Dialog.Description>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs mb-5">
            <div className="rounded border border-white/10 bg-white/5 p-3">
              <div className="uppercase text-white/60 mb-1 tracking-wide">Your change</div>
              <pre className="text-white/80 whitespace-pre-wrap break-all">
                {safeStringify(payload.predicted)}
              </pre>
            </div>
            <div className="rounded border border-white/10 bg-white/5 p-3">
              <div className="uppercase text-white/60 mb-1 tracking-wide">Server</div>
              <pre className="text-white/80 whitespace-pre-wrap break-all">
                {safeStringify(payload.actual)}
              </pre>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => {
                payload.onKeepLocal();
                closeConflictResolver();
              }}
              className="px-3 py-1.5 rounded border border-white/15 text-sm text-white/80
                hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              Keep my change
            </button>
            <button
              type="button"
              onClick={() => {
                payload.onAcceptServer();
                closeConflictResolver();
              }}
              className="px-3 py-1.5 rounded bg-white/90 text-black text-sm font-medium
                hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              Use server value
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
