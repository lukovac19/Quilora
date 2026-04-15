import type { User } from '../context/AppContext';

/**
 * Public launch is complete — Phase 4 / canvas lock lifted (server `app_settings` or Vite override).
 */
export function resolvePublicLaunchComplete(serverValue: boolean | null | undefined): boolean {
  if (import.meta.env.VITE_QUILORA_PUBLIC_LAUNCH === 'true') return true;
  if (serverValue === true) return true;
  return false;
}

/**
 * Pre-launch product mode (v4 Phase 4+). In development, off unless VITE_FORCE_PRELAUNCH_HOLDING=true.
 */
export function isPreLaunchHoldingActive(publicLaunchCompleteFromServer: boolean | null | undefined): boolean {
  if (resolvePublicLaunchComplete(publicLaunchCompleteFromServer)) return false;
  if (import.meta.env.DEV && import.meta.env.VITE_FORCE_PRELAUNCH_HOLDING !== 'true') return false;
  return true;
}

/** Paying / plan-confirmed users see Phase 4 dashboard until public launch. */
export function isPreLaunchHoldingDashboard(
  user: User | null,
  publicLaunchCompleteFromServer: boolean | null | undefined,
): boolean {
  return Boolean(user?.billingGatePassed && isPreLaunchHoldingActive(publicLaunchCompleteFromServer));
}

/** Block infinite-canvas sandbox until public launch (v4 — canvas locked). */
export function shouldBlockPreLaunchCanvas(
  user: User | null,
  publicLaunchCompleteFromServer: boolean | null | undefined,
): boolean {
  return Boolean(user?.billingGatePassed && isPreLaunchHoldingActive(publicLaunchCompleteFromServer));
}
