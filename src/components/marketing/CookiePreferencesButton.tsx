'use client';

// ════════════════════════════════════════════════════
// CookiePreferencesButton — re-opens the cookie notice
// from the marketing footer. Client component so it can
// touch localStorage and reload, while the footer itself
// stays a server component.
// ════════════════════════════════════════════════════

import { clearCookieNoticeDismissal } from '@/components/ui/CookieNotice';

export function CookiePreferencesButton() {
  return (
    <button
      type="button"
      onClick={() => {
        clearCookieNoticeDismissal();
        // Reload so the layout re-mounts CookieNotice with the
        // dismissal flag cleared. Avoids a global event-bus.
        window.location.reload();
      }}
      className="text-white/50 hover:text-white/80 text-sm transition focus:outline-none focus-visible:underline"
    >
      Cookie preferences
    </button>
  );
}
