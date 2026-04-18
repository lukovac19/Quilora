import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useApp } from '../context/AppContext';
import { shouldBlockPreLaunchCanvas } from '../lib/preLaunchProductMode';

const BILLING_EXEMPT_PREFIXES = [
  '/pricing',
  '/payments',
  '/billing',
  '/early-access',
  '/early-access/genesis-choice',
  '/onboarding',
  '/home',
  '/',
];

function isBillingGateExemptPath(pathname: string): boolean {
  return BILLING_EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, authLoading, publicLaunchComplete } = useApp();
  const location = useLocation();

  if (authLoading) {
    return <div className="min-h-screen bg-[#0a1929]" aria-busy="true" />;
  }

  if (!user) {
    const returnTo = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/auth?redirect=${returnTo}`} replace />;
  }

  if (!user.emailConfirmed) {
    const returnTo = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/auth/verify-email?redirect=${returnTo}`} replace />;
  }

  if (location.pathname === '/sandbox-loading-frame' && shouldBlockPreLaunchCanvas(user, publicLaunchComplete)) {
    return <Navigate to="/dashboard" replace />;
  }

  /** Onboarding and marketing paths stay reachable without billing; otherwise require billing in production. */
  if (!user.billingGatePassed && !isBillingGateExemptPath(location.pathname) && !import.meta.env.DEV) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/early-access?redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
}
