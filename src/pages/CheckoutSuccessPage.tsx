import { useEffect } from 'react';
import { Link } from 'react-router';
import { useApp } from '../context/AppContext';

/**
 * Post–Dodo Checkout Session redirect (`return_url` → `/checkout/success`).
 * Plan activation is applied server-side via webhooks; we refresh the session here.
 */
export function CheckoutSuccessPage() {
  const { refreshAuthUser } = useApp();

  useEffect(() => {
    void refreshAuthUser();
  }, [refreshAuthUser]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a1929] px-4 text-center text-white">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Payment received</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
        Thanks — your subscription or purchase is being confirmed. If your dashboard does not update within a few
        minutes, contact support with your account email.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#266ba7] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#3b82c4]"
        >
          Go to dashboard
        </Link>
        <Link
          to="/pricing"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/10"
        >
          Pricing
        </Link>
      </div>
    </div>
  );
}
