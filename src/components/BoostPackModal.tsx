import { X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { openPaddleCheckout } from '../lib/billingCheckout';
import { useApp } from '../context/AppContext';

type Props = {
  open: boolean;
  onClose: () => void;
};

/** EP-02 Boost Pack Modal — $1.99 = 200 credits (confirmed by billing webhooks before balance updates). */
export function BoostPackModal({ open, onClose }: Props) {
  const { user } = useApp();

  if (!open) return null;

  const runConfirm = async () => {
    if (!user?.id) {
      toast.error('Sign in to purchase a Boost Pack.');
      onClose();
      return;
    }
    const res = await openPaddleCheckout({
      product: 'boost_pack',
      userId: user.id,
      email: user.email,
    });
    if (res.ok) {
      toast.success('Checkout opened — 200 credits apply after payment is confirmed.');
      onClose();
      return;
    }
    if (res.reason === 'not_configured') {
      if (import.meta.env.DEV) toast.message(res.message);
      else toast.error('Checkout is not configured.');
      return;
    }
    toast.error(res.message);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="boost-pack-title">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0f2238] p-6 shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <h2 id="boost-pack-title" className="pr-10 text-xl font-bold text-white">
          Boost Pack
        </h2>
        <p id="boost-price-display" className="mt-3 text-lg font-semibold text-[#7bbdf3]">
          $1.99 — 200 credits
        </p>
        <p className="mt-3 text-sm leading-relaxed text-white/65">One-time top-up. Credits appear in your balance after payment completes.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            id="confirm-purchase-btn"
            type="button"
            onClick={() => void runConfirm()}
            className="min-h-11 flex-1 rounded-full bg-[#266ba7] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3b82c4]"
          >
            Confirm purchase
          </button>
          <button id="cancel-btn" type="button" onClick={onClose} className="min-h-11 rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
