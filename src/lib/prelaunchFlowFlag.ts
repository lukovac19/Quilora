const PRELAUNCH_FLOW_STORAGE_KEY = 'quilora_prelaunch_flow_entered';
const CHECKOUT_FUNNEL_STORAGE_KEY = 'quilora_checkout_funnel_entered';

export function markPrelaunchFlowEntered(): void {
  try {
    localStorage.setItem(PRELAUNCH_FLOW_STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function hasPrelaunchFlowEntered(): boolean {
  try {
    return localStorage.getItem(PRELAUNCH_FLOW_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Set when checkout opens so cancel / stray navigation stays off public marketing routes. */
export function markCheckoutFunnelEntered(): void {
  try {
    localStorage.setItem(CHECKOUT_FUNNEL_STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function clearCheckoutFunnelEntered(): void {
  try {
    localStorage.removeItem(CHECKOUT_FUNNEL_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasCheckoutFunnelEntered(): boolean {
  try {
    return localStorage.getItem(CHECKOUT_FUNNEL_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Block `/` (landing) and `/pricing` for users in prelaunch or post–checkout-open funnel. */
export function shouldBlockPublicMarketing(): boolean {
  return hasPrelaunchFlowEntered() || hasCheckoutFunnelEntered();
}
