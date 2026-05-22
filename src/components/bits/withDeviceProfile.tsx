'use client';

import { useDeviceProfile } from '@/hooks/useDeviceProfile';

interface DeviceOptions {
  desktopOnly?: boolean;
  minTier?: 'minimal' | 'low' | 'medium' | 'high';
}

export function withDeviceProfile<P extends object>(
  Component: React.ComponentType<P>,
  options: DeviceOptions = {}
) {
  return function WrappedComponent(props: P) {
    const profile = useDeviceProfile();
    if (options.desktopOnly && profile.tier !== 'desktop') return null;
    const tierOrder = ['minimal', 'low', 'medium', 'high'];
    if (options.minTier && tierOrder.indexOf(profile.tier) < tierOrder.indexOf(options.minTier)) return null;
    return <Component {...props} />;
  };
}
