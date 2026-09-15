'use client';

/**
 * ToastRail — TAP W2 edge chips.
 * Absorbs offline / demo / verify banners + toastStore on the hub.
 * Footer chip reaches /pricing and legal (EscapeFlat on /dev).
 * Portaled to document.body (OVERLAY-CRIT-001).
 */

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info,
  Mail,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useDemoSession } from '@/hooks/useDemoSession';
import { HOLO_BLEND_CSS_VARS } from '@/lib/forge-hub/holoBlend';
import { useAuthStore } from '@/stores/authStore';
import {
  useToastActions,
  useToasts,
  type ToastType,
} from '@/stores/toastStore';

const TOAST_ICONS: Record<ToastType, typeof Info> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

type NetPhase = 'online' | 'offline' | 'reconnecting';

export interface ToastRailProps {
  lock?: boolean;
  showFooter?: boolean;
  onOpenLegal?: () => void;
}

export function ToastRail({
  lock = false,
  showFooter = true,
  onOpenLegal,
}: ToastRailProps) {
  const toasts = useToasts();
  const { removeToast } = useToastActions();
  const demo = useDemoSession();
  const parent = useAuthStore((s) => s.parent);
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const authLoading = useAuthStore((s) => s.isLoading);

  const [net, setNet] = useState<NetPhase>('online');
  const [verifyDismissed, setVerifyDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setNet(navigator.onLine ? 'online' : 'offline');
    const goOffline = () => setNet('offline');
    const goOnline = () =>
      setNet((prev) => (prev === 'offline' ? 'reconnecting' : 'online'));
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  useEffect(() => {
    if (net !== 'reconnecting') return;
    const t = window.setTimeout(() => setNet('online'), 1800);
    return () => window.clearTimeout(t);
  }, [net]);

  const showVerify =
    !authLoading &&
    !isDemoMode &&
    !!parent &&
    !parent.email_verified_at &&
    !verifyDismissed;

  const dismissVerify = useCallback(() => {
    setVerifyDismissed(true);
  }, []);

  if (!mounted || lock || typeof document === 'undefined') return null;

  const rail = (
    <div
      data-testid="forge-hub-toast-rail"
      className="fh-toast-rail"
      style={{
        ...HOLO_BLEND_CSS_VARS,
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        pointerEvents: 'none',
        filter: 'none',
        transform: 'none',
        backdropFilter: 'none',
      }}
    >
      <div className="fh-toast-rail__stack" aria-live="polite">
        {net === 'offline' ? (
          <div
            role="status"
            data-testid="forge-hub-toast-offline"
            className="fh-toast-chip fh-toast-chip--alert"
          >
            <WifiOff className="fh-toast-chip__icon" aria-hidden="true" />
            <span>Offline — changes save when you reconnect.</span>
          </div>
        ) : null}
        {net === 'reconnecting' ? (
          <div
            role="status"
            data-testid="forge-hub-toast-online"
            className="fh-toast-chip fh-toast-chip--ok"
          >
            <Wifi className="fh-toast-chip__icon" aria-hidden="true" />
            <span>Back online — syncing…</span>
          </div>
        ) : null}
        {demo.isDemoMode ? (
          <div
            role="status"
            data-testid="forge-hub-toast-demo"
            className={`fh-toast-chip ${demo.isUrgent ? 'fh-toast-chip--alert' : ''}`}
          >
            <Clock className="fh-toast-chip__icon" aria-hidden="true" />
            <span>
              Demo {demo.timeRemaining} remaining
            </span>
          </div>
        ) : null}
        {showVerify ? (
          <div
            role="status"
            data-testid="forge-hub-toast-verify"
            className="fh-toast-chip fh-toast-chip--warn"
          >
            <Mail className="fh-toast-chip__icon" aria-hidden="true" />
            <span>Verify your email</span>
            <button
              type="button"
              className="fh-toast-chip__dismiss"
              aria-label="Dismiss email verification reminder"
              onClick={dismissVerify}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : null}
        {toasts.map((item) => {
          const Icon = TOAST_ICONS[item.type];
          return (
            <div
              key={item.id}
              role="alert"
              data-testid={`forge-hub-toast-${item.type}`}
              className={`fh-toast-chip fh-toast-chip--${item.type}`}
            >
              <Icon className="fh-toast-chip__icon" aria-hidden="true" />
              <span>{item.message}</span>
              {item.action ? (
                <button
                  type="button"
                  className="fh-toast-chip__action"
                  onClick={() => {
                    item.action?.onClick();
                    removeToast(item.id);
                  }}
                >
                  {item.action.label}
                </button>
              ) : null}
              <button
                type="button"
                className="fh-toast-chip__dismiss"
                aria-label="Dismiss notification"
                onClick={() => removeToast(item.id)}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
      <div className="fh-toast-rail__foot">
        {showFooter ? (
          <button
            type="button"
            data-testid="forge-hub-toast-legal"
            className="fh-toast-chip fh-toast-chip--footer"
            onClick={onOpenLegal}
          >
            Pricing · Legal
          </button>
        ) : null}
      </div>
    </div>
  );

  return createPortal(rail, document.body);
}
