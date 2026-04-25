// ════════════════════════════════════════════════════
// Unit tests — nav-focus broadcast event (UX-HIGH-002 B)
// ════════════════════════════════════════════════════
// Verifies the broadcast-store side of the arrow-key 3D nav bridge.
// The visual side (NavigationButtonGrid subscribing to `nav-focus`
// and rendering the keyboard-focus ring) is exercised in the dev
// server + build smoke; this suite covers the contract.

import { describe, it, expect, beforeEach } from 'vitest';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';

describe('cockpitBroadcastStore — nav-focus', () => {
  beforeEach(() => {
    // Reset store state between tests. The store is a Zustand vanilla
    // store so we can reach its raw setState.
    useCockpitBroadcast.setState({
      events: [],
      lastEvent: null,
    });
  });

  it('accepts nav-focus events with source + label + targetPage', () => {
    useCockpitBroadcast.getState().broadcast({
      type: 'nav-focus',
      source: 'nav-home',
      label: 'Home',
      targetPage: '/home',
    });
    const last = useCockpitBroadcast.getState().lastEvent;
    expect(last?.type).toBe('nav-focus');
    expect(last?.source).toBe('nav-home');
    expect(last?.label).toBe('Home');
    expect(last?.targetPage).toBe('/home');
  });

  it('nav-focus events flow through the same events ring as everything else', () => {
    useCockpitBroadcast.getState().broadcast({
      type: 'nav-focus',
      source: 'nav-labs',
    });
    useCockpitBroadcast.getState().broadcast({
      type: 'page-navigate',
      source: 'nav-labs',
      targetPage: '/labs',
    });
    const events = useCockpitBroadcast.getState().events;
    // Most-recent event is at index 0 per the ring-buffer impl
    expect(events.length).toBeGreaterThanOrEqual(2);
    const types = events.map((e) => e.type);
    expect(types).toContain('nav-focus');
    expect(types).toContain('page-navigate');
  });

  it('consumer deriving "keyboardFocusedId" from lastEvent resolves cleanly', () => {
    // NavigationButtonGrid does:
    //   if (lastEvent?.type !== 'nav-focus') return null;
    //   return lastEvent.source;
    useCockpitBroadcast.getState().broadcast({
      type: 'nav-focus',
      source: 'nav-settings',
    });
    let last = useCockpitBroadcast.getState().lastEvent;
    const focused1 = last?.type === 'nav-focus' ? last.source : null;
    expect(focused1).toBe('nav-settings');

    // A subsequent page-navigate clears the keyboard-focused highlight,
    // which matches the UX: user has activated a button, nav-focus is
    // no longer the semantically-current event.
    useCockpitBroadcast.getState().broadcast({
      type: 'page-navigate',
      source: 'nav-settings',
    });
    last = useCockpitBroadcast.getState().lastEvent;
    const focused2 = last?.type === 'nav-focus' ? last.source : null;
    expect(focused2).toBeNull();
  });
});
