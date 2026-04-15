/** Session flag: user chose Lifetime Deal on early access and should see Screen 3 (pre-checkout). */
export const GENESIS_CHOICE_SESSION_KEY = 'quiloraGenesisChoice';

export function markGenesisChoiceFlowPending(): void {
  try {
    sessionStorage.setItem(GENESIS_CHOICE_SESSION_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function clearGenesisChoiceFlowPending(): void {
  try {
    sessionStorage.removeItem(GENESIS_CHOICE_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function isGenesisChoiceFlowPending(): boolean {
  try {
    return sessionStorage.getItem(GENESIS_CHOICE_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}
