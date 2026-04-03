'use client';

// ════════════════════════════════════════════════════════════════
// Login Page — 3D Scene Descriptor (Phase 3)
// ════════════════════════════════════════════════════════════════
// Thin wrapper that renders LoginPanel3D inside the auth layout Canvas.
// All visual rendering happens in 3D — this page has zero HTML UI.

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/stores/authStore';

const LoginPanel3D = dynamic(
  () => import('@/components/3d/panels/LoginPanel3D'),
  { ssr: false }
);

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startDemoSession = useAuthStore((s) => s.startDemoSession);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const demoExpired = searchParams.get('demo') === 'expired';

  const handleLogin = useCallback(async (email: string, password: string) => {
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter your email and password');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid email or password');
        setLoading(false);
        return;
      }

      router.push('/home');
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleDemoStart = useCallback(async () => {
    setDemoLoading(true);
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        setDemoLoading(false);
        return;
      }

      startDemoSession();
      router.push('/home');
    } catch {
      setDemoLoading(false);
    }
  }, [router, startDemoSession]);

  return (
    <LoginPanel3D
      onLogin={handleLogin}
      onNavigateSignup={() => router.push('/signup')}
      onNavigateReset={() => router.push('/reset-password')}
      onDemoStart={handleDemoStart}
      loading={loading}
      error={error}
      demoExpired={demoExpired}
      demoLoading={demoLoading}
    />
  );
}
