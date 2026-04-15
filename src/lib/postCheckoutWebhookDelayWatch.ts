import { QUILORA_EDGE_SLUG, quiloraEdgePostJson } from './quiloraEdge';
import { supabase } from './supabase';

type RefreshUser = () => Promise<{ billingGatePassed: boolean } | null>;

let refreshUser: RefreshUser | null = null;

/** Wired from `AppProvider` so Paddle overlay can schedule EC-03 support alerts without React coupling. */
export function registerPostCheckoutWebhookDelayWatch(refresh: RefreshUser) {
  refreshUser = refresh;
}

/**
 * EC-03 — After Paddle `checkout.completed`, poll until `billingGatePassed` or ~5 minutes, then notify support.
 */
export function scheduleWebhookDelayWatchAfterCheckout(userId: string, productKind: string) {
  if (!refreshUser) return;
  const stepMs = 30_000;
  const steps = 10;

  const run = async () => {
    for (let i = 0; i < steps; i += 1) {
      await new Promise((r) => setTimeout(r, stepMs));
      try {
        const u = await refreshUser();
        if (u?.billingGatePassed) return;
      } catch {
        /* keep polling */
      }
    }
    try {
      const { data: auth } = await supabase.auth.getSession();
      const token = auth.session?.access_token;
      if (!token) return;
      await quiloraEdgePostJson(`${QUILORA_EDGE_SLUG}/billing/report-webhook-delay`, token, {
        userId,
        productKind,
      });
    } catch {
      /* ignore */
    }
  };

  void run();
}
