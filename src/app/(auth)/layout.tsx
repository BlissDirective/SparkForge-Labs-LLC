'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { DemoSessionBanner } from '@/components/auth/DemoSessionBanner';

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
  const [isMobile, setIsMobile] = useState(true); // default to mobile (no SSR flash)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  return (
    <div className="min-h-screen bg-surface-deep bg-cosmic-dark flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Demo session banner — renders only when in demo mode */}
      <DemoSessionBanner />

      {/* 3D Background Layer — desktop only */}
      {!isMobile && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Suspense fallback={null}>
            <R3FCanvas
              camera={{ position: [0, 0, 5], fov: 50 }}
              dpr={[1, 2]}
              style={{ background: 'transparent' }}
              gl={{ alpha: true, antialias: true }}
            >
              <ambientLight intensity={0.15} />
              <LoginPortal3D portalColor="#AA66FF" intensity={1.0} />
              <LoginParticles3D count={150} color="#AA66FF" spread={6} />
            </R3FCanvas>
          </Suspense>
        </div>
      )}

      {/* CSS Particle Fallback — mobile */}
      {isMobile && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-pulse"
              style={{
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: i % 3 === 0 ? '#AA66FF' : i % 3 === 1 ? '#00BBFF' : '#00FF88',
                opacity: 0.3 + Math.random() * 0.4,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      )}

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
  );
}
