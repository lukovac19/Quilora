import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useApp } from '../context/AppContext';

const SESSION_KEY = 'quilora_low_balance_dismissed';

export function LowBalanceBanner() {
  const { user } = useApp();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(SESSION_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!user || dismissed) return null;
  const bal = user.creditBalance ?? 0;
  if (bal >= 100) return null;

  return (
    <div className="mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <span>Your credit balance is low ({bal}). Grab a Boost Pack to keep going.</span>
      <div className="flex items-center gap-2">
        <Link
          to="/pricing?checkout=boost"
          className="rounded-full bg-amber-500/25 px-3 py-1.5 font-medium text-white hover:bg-amber-500/35"
        >
          Boost Pack
        </Link>
        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.setItem(SESSION_KEY, '1');
            } catch {
              /* ignore */
            }
            setDismissed(true);
          }}
          className="text-amber-200/80 hover:text-white"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
