import { useCallback, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router';
import { toast } from 'sonner@2.0.3';
import { BILLING_DODO_CHECKOUT_SESSION_PATH, quiloraEdgePostJson } from '../lib/quiloraEdge';
import { supabase } from '../lib/supabase';
import { dodoCheckoutConfigured, fetchCheckoutEligibility } from '../lib/billingCheckout';
import { scheduleWebhookDelayWatchAfterCheckout } from '../lib/postCheckoutWebhookDelayWatch';
import { assertPrelaunchCheckoutAllowed, type PrelaunchCheckoutIntent } from '../lib/prelaunchPurchaseGuards';
import { DuplicatePrelaunchPurchaseModal } from './prelaunch/DuplicatePrelaunchPurchaseModal';
import { markCheckoutFunnelEntered } from '../lib/prelaunchFlowFlag';

export type CheckoutButtonProps = {
  productId: string;
  label: string;
  /** Stored on the payment/subscription and echoed in webhooks (e.g. `bookworm_monthly`, `lifetime_early_bird`). */
  productKind?: string;
  className?: string;
  disabled?: boolean;
  /** When set, blocks duplicate/conflicting purchases before opening checkout (pre-launch guard). */
  duplicateGate?: PrelaunchCheckoutIntent;
  requireEmailVerified?: boolean;
};

/**
 * Dodo overlay checkout — session is created on the server (`DODO_PAYMENTS_API_KEY` never in the browser).
 */
export function CheckoutButton({
  productId,
  label,
  productKind = 'checkout',
  className,
  disabled,
  duplicateGate,
  requireEmailVerified,
}: CheckoutButtonProps) {
  const { user } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dupModal, setDupModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const onClick = useCallback(async () => {
    console.log('[debug] all env vars:', {
      bookworm_monthly: import.meta.env.NEXT_PUBLIC_PRICE_ID_BOOKWORM_MONTHLY,
      vite_bookworm: import.meta.env.VITE_DODO_PRODUCT_BOOKWORM_MONTHLY,
      productId_prop: productId,
      dodoConfigured: dodoCheckoutConfigured(),
    });
    if (!user?.id) {
      navigate('/auth?mode=signup&redirect=' + encodeURIComponent('/pricing'));
      return;
    }
    if (requireEmailVerified && !user.emailConfirmed) {
      toast.error('Please verify your email before checkout.');
      navigate('/auth/verify-email?redirect=' + encodeURIComponent('/pricing'));
      return;
    }
    if (duplicateGate && user) {
      const gate = assertPrelaunchCheckoutAllowed(user, duplicateGate);
      if (!gate.ok) {
        setDupModal({ open: true, message: gate.message });
        return;
      }
    }
    if (!dodoCheckoutConfigured()) {
      toast.message('Checkout is not configured (set NEXT_PUBLIC_PRICE_ID_* or legacy VITE_DODO product IDs).');
      return;
    }
    if (!productId.trim()) {
      toast.error('Missing product ID for this plan.');
      return;
    }

    const elig = await fetchCheckoutEligibility(productKind);
    if (elig && !elig.ok) {
      setDupModal({
        open: true,
        message:
          elig.error === 'DUPLICATE_BOOKWORM' || elig.error === 'DUPLICATE_SAGE' || elig.error === 'DUPLICATE_GENESIS'
            ? 'You already have an active plan for this checkout.'
            : elig.error || 'Checkout is not available for your account.',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getSession();
      const bearer = auth.session?.access_token;
      if (!bearer) {
        toast.error('Sign in to continue.');
        return;
      }
      console.log('[debug] productId being sent:', productId);
      const session = await quiloraEdgePostJson<{ checkoutUrl?: string; error?: string }>(
        BILLING_DODO_CHECKOUT_SESSION_PATH,
        bearer,
        { productId, productKind },
      );
      const checkoutUrl = session.checkoutUrl?.trim();
      if (!checkoutUrl) {
        toast.error(session.error || 'Could not start checkout.');
        return;
      }
      if (user?.id) {
        scheduleWebhookDelayWatchAfterCheckout(user.id, productKind);
      }
      markCheckoutFunnelEntered();
      window.location.assign(checkoutUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/DUPLICATE_|BLOCK_BW|CHECKOUT_NOT_ALLOWED/i.test(msg)) {
        setDupModal({
          open: true,
          message: 'You already have an active plan or this checkout is not available for your account.',
        });
        return;
      }
      toast.error(msg || 'Checkout failed.');
    } finally {
      setLoading(false);
    }
  }, [user, navigate, productId, productKind, duplicateGate, requireEmailVerified]);

  return (
    <>
      <DuplicatePrelaunchPurchaseModal
        open={dupModal.open}
        message={dupModal.message}
        onClose={() => setDupModal({ open: false, message: '' })}
        onGoDashboard={() => {
          setDupModal({ open: false, message: '' });
          navigate('/dashboard');
        }}
      />
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => void onClick()}
        className={
          className ??
          'inline-flex min-h-11 items-center justify-center rounded-full bg-[#266ba7] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3b82c4] disabled:cursor-not-allowed disabled:opacity-50'
        }
      >
        {loading ? 'Opening…' : label}
      </button>
    </>
  );
}
