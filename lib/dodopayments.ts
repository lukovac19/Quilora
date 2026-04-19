import DodoPayments from 'dodopayments';

export type DodoEnvironment = 'test_mode' | 'live_mode';

/**
 * Server-only Dodo Payments API client (`DODO_PAYMENTS_API_KEY`).
 * Use from Node (e.g. Next.js Route Handlers, scripts). Never import from client bundles.
 *
 * Environment follows `NODE_ENV`: production → `live_mode`, otherwise `test_mode`
 * (API hosts: https://live.dodopayments.com / https://test.dodopayments.com).
 */
export function createDodoPaymentsServerClient(): DodoPayments {
  const bearerToken = process.env.DODO_PAYMENTS_API_KEY?.trim();
  if (!bearerToken) {
    throw new Error('DODO_PAYMENTS_API_KEY is not set');
  }
  const environment: DodoEnvironment = process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode';

  const webhookKey =
    process.env.DODO_PAYMENTS_WEBHOOK_SECRET?.trim() ||
    process.env.DODO_PAYMENTS_WEBHOOK_KEY?.trim() ||
    undefined;

  return new DodoPayments({
    bearerToken,
    environment,
    webhookKey: webhookKey ?? null,
  });
}
