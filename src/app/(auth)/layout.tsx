'use client';

import { createContext, Suspense, useContext, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { DemoSessionBanner } from '@/components/auth/DemoSessionBanner';
import { AuthProvider } from '@/components/providers/AuthProvider';

// S3-WARN-002: Context to pass card hover state from login page to 3D portal
const AuthHoverContext = createContext<{
  isCardHovered: boolean;
  setIsCardHovered: (hovered: boolean) => void;
}>({ isCardHovered: false, setIsCardHovered: () => {} });

export const useAuthHover = () => useContext(AuthHoverContext);

// Dynamic 3D imports — SSR disabled
const LoginPortal3D = dynamic(
  () => import('@/components/3d/LoginPortal3D'),
  { ssr: false }
);

const LoginParticles3D = dynamic(
  () => import('@/components/3d/LoginParticles3D'),
  { ssr: false }
);

const R3FCanvas = dynamic(
  () => import('@react-three/fiber').then((mod) => mod.Canvas),
  { ssr: false }
);

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [isCardHovered, setIsCardHovered] = useState(false);

  return (
    <AuthProvider>
    <AuthHoverContext.Provider value={{ isCardHovered, setIsCardHovered }}>
      <div className="min-h-screen bg-surface-deep bg-cosmic-dark flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Demo session banner — renders only when in demo mode */}
        <DemoSessionBanner />

        {/* 3D Background Layer — always rendered (D3D-1: desktop-only platform) */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Suspense fallback={null}>
            <R3FCanvas
              camera={{ position: [0, 0, 5], fov: 50 }}
              dpr={[1, 3]}
              style={{ background: 'transparent' }}
              gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
            >
              <ambientLight intensity={0.15} />
              <LoginPortal3D portalColor="#AA66FF" intensity={1.0} isHovered={isCardHovered} />
              <LoginParticles3D count={150} color="#AA66FF" spread={6} />
            </R3FCanvas>
          </Suspense>
        </div>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-8 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-spark-purple to-spark-blue flex items-center justify-center shadow-lg shadow-spark-purple/25">
            <span className="text-2xl">⚡</span>
          </div>
          <span className="font-display text-2xl font-bold text-white drop-shadow-lg">
            SparkForge
          </span>
        </Link>

        {/* Card container — above 3D layer */}
        <div className="w-full max-w-md relative z-10">
          {children}
        </div>

        {/* Footer */}
        <p className="mt-8 text-white/20 text-xs font-body text-center relative z-10">
          &copy; 2026 BlissDirective &middot; SparkForge
        </p>
      </div>
    </AuthHoverContext.Provider>
    </AuthProvider>
  );
}
