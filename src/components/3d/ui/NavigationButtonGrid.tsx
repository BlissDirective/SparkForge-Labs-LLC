'use client';

// ════════════════════════════════════════════════════
// NavigationButtonGrid — Physical Cockpit Page Navigation
// ════════════════════════════════════════════════════
// Per cockpit-architecture.json: "Lighted selectable buttons in geometric
// radial pattern; each triggers full cockpit state change with holographic
// pop-up mapping and camera movement"
//
// 5 buttons in radial arc at center-bottom console:
//   HOME (cyan) | LABS (purple) | ARCADE (green) | SETTINGS (amber) | PROFILE (pink)
//
// Press → full cockpit state transition:
//   - Camera flies to target position
//   - LED rim color shifts
//   - Active button stays depressed with pulsing glow
//   - Broadcasts page-navigate event to cockpitBroadcastStore
//   - Variable dials reconfigure for page context
//
// ~1M triangles total (5 buttons × ~200K each including chrome housings)

import { useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { HolographicButton } from './HolographicButton';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { useUIStore } from '@/stores/uiStore';

interface NavButton {
  id: string;
  label: string;
  icon: string;
  color: string;
  route: string;
  position: [number, number, number];
}

const NAV_BUTTONS: NavButton[] = [
  { id: 'nav-home',     label: 'HOME',     icon: '🏠', color: '#00BBFF', route: '/home',     position: [-0.30, 0, 0] },
  { id: 'nav-labs',     label: 'LABS',     icon: '🔬', color: '#AA66FF', route: '/labs',     position: [-0.15, 0, 0] },
  { id: 'nav-arcade',   label: 'ARCADE',   icon: '🎮', color: '#00FF88', route: '/arcade',   position: [0, 0, 0] },
  { id: 'nav-settings', label: 'SETTINGS', icon: '⚙️', color: '#FFAA44', route: '/settings', position: [0.15, 0, 0] },
  { id: 'nav-profile',  label: 'PROFILE',  icon: '👤', color: '#FF66AA', route: '/profile',  position: [0.30, 0, 0] },
];

interface NavigationButtonGridProps {
  /** Position of the entire grid in cockpit space */
  position?: [number, number, number];
  /** Scale multiplier */
  scale?: number;
}

export function NavigationButtonGrid({
  position = [0, 0.35, -1.85],
  scale = 1,
}: NavigationButtonGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  const setLabColor = useUIStore((s) => s.setLabColor);

  // Determine which button is active based on current route
  const activeRoute = useMemo(() => {
    if (!pathname) return '/home';
    if (pathname.startsWith('/labs')) return '/labs';
    if (pathname.startsWith('/arcade')) return '/arcade';
    if (pathname.startsWith('/settings')) return '/settings';
    if (pathname.startsWith('/profile')) return '/profile';
    return '/home';
  }, [pathname]);

  const handleNavigation = useCallback((button: NavButton) => {
    // Broadcast navigation event — triggers full cockpit state transition
    broadcast({
      type: 'page-navigate',
      source: button.id,
      color: button.color,
      label: button.label,
      targetPage: button.route,
    });

    // Update lab color for visual feedback
    setLabColor(button.color);

    // Navigate
    router.push(button.route);
  }, [broadcast, setLabColor, router]);

  return (
    <group position={position} scale={scale}>
      {NAV_BUTTONS.map((button) => (
        <HolographicButton
          key={button.id}
          id={button.id}
          label={button.label}
          icon={button.icon}
          color={button.color}
          position={button.position}
          active={activeRoute === button.route}
          onClick={() => handleNavigation(button)}
          width={0.12}
          height={0.05}
        />
      ))}
    </group>
  );
}

export default NavigationButtonGrid;
