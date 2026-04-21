const PRELAUNCH_FLOW_STORAGE_KEY = 'quilora_prelaunch_flow_entered';

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
