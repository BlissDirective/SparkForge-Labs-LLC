'use client';

import { Suspense } from 'react';
import { LoginFormCard } from '@/components/auth/LoginFormCard';
import { DemoLoginButton } from '@/components/auth/DemoLoginButton';
import { useAuthHover } from '../layout';

export default function LoginPage() {
  // S3-WARN-002: Hover state wired to 3D portal via AuthHoverContext
  const { setIsCardHovered } = useAuthHover();

  return (
    <Suspense fallback={null}>
      <LoginFormCard onHoverChange={setIsCardHovered} />
      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-white/10" />
        <span className="font-body text-xs text-white/30 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>
      {/* Demo Login */}
      <DemoLoginButton />
    </Suspense>
  );
}
