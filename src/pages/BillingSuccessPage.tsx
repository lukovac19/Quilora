import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner@2.0.3';
import { useApp } from '../context/AppContext';
import { openPlanCheckout, POLAR_POST_GENESIS_PLAN_KEY } from '../lib/billingCheckout';
import type { InternalPlanKey } from '../lib/billing/types';
import { normalizeBillingState, type BillingMePayload } from '../lib/billing/status';
import { QUILORA_EDGE_SLUG, quiloraEdgeGetJson, quiloraEdgePostJson } from '../lib/quiloraEdge';
import { supabase } from '../lib/supabase';

const AFTER_CHECKOUT_NAV_KEY = 'quilora_after_checkout_nav';
const PENDING_GENESIS_BUNDLE_SS = 'quilora_pending_genesis_bundle';
const GENESIS_BUNDLE_LS = 'quiloraGenesisBundleChoice';

const POLL_MS = 2000;
const POLL_MAX_MS = 60000;

async function fetchBillingMeActive(token: string): Promise<boolean> {
  const me = await quiloraEdgeGetJson<BillingMePayload>(`${QUILORA_EDGE_SLUG}/billing/me`, token);
  return Boolean(normalizeBillingState(me)?.activeAccess);
}

export function BillingSuccessPage() {
  const { refreshAuthUser } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const checkoutId = useMemo(() => searchParams.get('checkout_id')?.trim() ?? '', [searchParams]);
  const [, setPhase] = useState<'working' | 'done' | 'error'>('working');

  useEffect(() => {
    if (!checkoutId) {
      setPhase('error');
      toast.error('Missing checkout reference.');
      navigate('/pricing?checkout=error', { replace: true });
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        const uid = session?.user?.id;
        const em = session?.user?.email;
        if (!token || !uid || !em) {
          navigate(`/auth?mode=login&redirect=${encodeURIComponent(`/billing/success?checkout_id=${encodeURIComponent(checkoutId)}`)}`, {
            replace: true,
          });
          return;
        }

        const pollUntilActive = async () => {
          const deadline = Date.now() + POLL_MAX_MS;
          while (!cancelled && Date.now() < deadline) {
            if (await fetchBillingMeActive(token)) return true;
            await new Promise((r) => setTimeout(r, POLL_MS));
          }
          return false;
        };

        try {
          await quiloraEdgePostJson(`${QUILORA_EDGE_SLUG}/billing/sync-checkout`, token, { checkoutId });
        } catch {
          /* webhook may still be processing — poll billing state */
        }
        if (cancelled) return;

        if (!(await fetchBillingMeActive(token))) {
          const ok = await pollUntilActive();
          if (!ok && !cancelled) {
            throw new Error('Billing not active yet — try refreshing in a moment.');
          }
        }

        if (cancelled) return;
        await refreshAuthUser();

        let nextPlan: string | null = null;
        try {
          nextPlan = sessionStorage.getItem(POLAR_POST_GENESIS_PLAN_KEY);
        } catch {
          /* ignore */
        }
        if (nextPlan === 'sage_yearly' || nextPlan === 'sage_monthly') {
          try {
            sessionStorage.removeItem(POLAR_POST_GENESIS_PLAN_KEY);
          } catch {
            /* ignore */
          }
          const r2 = await openPlanCheckout({
            planKey: nextPlan as InternalPlanKey,
            userId: uid,
            email: em,
            afterSuccessNavigate: (() => {
              try {
                return sessionStorage.getItem(AFTER_CHECKOUT_NAV_KEY) ?? '/onboarding';
              } catch {
                return '/onboarding';
              }
            })(),
          });
          if (!r2.ok) toast.error(r2.message);
          return;
        }

        setPhase('done');
        let target = '/onboarding';
        try {
          target = sessionStorage.getItem(AFTER_CHECKOUT_NAV_KEY) ?? '/onboarding';
        } catch {
          /* ignore */
        }
        try {
          sessionStorage.removeItem(AFTER_CHECKOUT_NAV_KEY);
        } catch {
          /* ignore */
        }
        try {
          const pending = sessionStorage.getItem(PENDING_GENESIS_BUNDLE_SS);
          if (pending === 'ltd_only' || pending === 'ltd_sage_year') {
            localStorage.setItem(GENESIS_BUNDLE_LS, pending);
            sessionStorage.removeItem(PENDING_GENESIS_BUNDLE_SS);
          }
        } catch {
          /* ignore */
        }
        navigate(target, { replace: true });
      } catch (e) {
        if (cancelled) return;
        setPhase('error');
        const msg = e instanceof Error ? e.message : 'Sync failed';
        toast.error(msg);
        navigate('/pricing?checkout=pending', { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkoutId, navigate, refreshAuthUser]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a1929] px-6 text-center text-white">
      <p className="text-lg font-semibold">Syncing your access…</p>
      <p className="mt-2 max-w-md text-sm text-white/60">
        This usually takes a few seconds while we confirm payment and update your account. Do not close this tab.
      </p>
    </div>
  );
}
