import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { clearCheckoutFunnelEntered } from '../lib/prelaunchFlowFlag';
import { hasCompletedQuiloraOnboardingV4 } from '../lib/quiloraOnboardingStorage';

/**
 * Post–Dodo Checkout Session redirect (`return_url` → `/billing/success`).
 * Refreshes the session, then continues the product flow: onboarding questions → thank-you (on `/onboarding`),
 * or dashboard if onboarding was already completed.
 */
export function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const { refreshAuthUser, user, authLoading } = useApp();
  const [sessionRefreshed, setSessionRefreshed] = useState(false);

  useEffect(() => {
    clearCheckoutFunnelEntered();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refreshAuthUser();
      } finally {
        if (!cancelled) setSessionRefreshed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshAuthUser]);

  useEffect(() => {
    if (!sessionRefreshed || authLoading) return;
    if (!user) return;

    if (!user.emailConfirmed) {
      navigate('/auth/verify-email?redirect=' + encodeURIComponent('/onboarding'), { replace: true });
      return;
    }
    if (hasCompletedQuiloraOnboardingV4()) {
      navigate('/dashboard', { replace: true });
      return;
    }
    navigate('/onboarding', { replace: true });
  }, [sessionRefreshed, authLoading, user, navigate]);

  if (sessionRefreshed && !user && !authLoading) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a1929] px-5 text-center text-white"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <p className="max-w-md text-sm text-white/60">
          We couldn&apos;t load your account session. Sign in to continue to onboarding.
        </p>
        <Link
          to="/auth?redirect=/onboarding"
          className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90 transition hover:border-[#7bbdf3]/40 hover:bg-white/10"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[#0a1929] px-5 py-16 text-white"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <p className="text-sm text-white/55">Confirming your purchase…</p>
    </div>
  );
}
