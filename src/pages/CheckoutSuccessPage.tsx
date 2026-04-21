import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { clearCheckoutFunnelEntered } from '../lib/prelaunchFlowFlag';

/**
 * Post–Dodo Checkout Session redirect (`return_url` → `/billing/success`).
 * Plan activation is applied server-side via webhooks; we refresh the session here.
 */
export function CheckoutSuccessPage() {
  const { refreshAuthUser, user } = useApp();

  useEffect(() => {
    void refreshAuthUser();
  }, [refreshAuthUser]);

  useEffect(() => {
    clearCheckoutFunnelEntered();
  }, []);

  const email = user?.email?.trim();
  const leadLine = email ? `You're all set, ${email}.` : "You're all set.";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a1929] px-5 py-16 text-white">
      <div className="mx-auto w-full max-w-lg space-y-5 text-center">
        <p className="text-lg font-semibold leading-snug tracking-tight text-white md:text-xl">{leadLine}</p>
        <p className="text-sm leading-relaxed text-white/70 md:text-base">
          Your canvas is waiting. We&apos;ll let you know the moment Quilora goes live.
        </p>
        <p className="text-sm leading-relaxed text-white/70 md:text-base">
          Your plan starts on launch day. If Quilora doesn&apos;t reach public launch (full canvas access for paid
          users) within 90 days of your purchase, you&apos;ll receive a full refund automatically via Dodo Payments.
        </p>
        <p className="text-sm leading-relaxed text-white/70 md:text-base">
          Changed your mind? You can cancel anytime before launch day from your account dashboard for a full refund.
        </p>
      </div>
    </div>
  );
}
