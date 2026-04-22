/** True when v4 onboarding JSON exists in localStorage (written when onboarding + thank-you completes). */
export function hasCompletedQuiloraOnboardingV4(): boolean {
  try {
    const raw = localStorage.getItem('quiloraOnboarding');
    if (!raw) return false;
    const o = JSON.parse(raw) as { version?: number; displayName?: string };
    return o?.version === 4 && typeof o.displayName === 'string' && o.displayName.trim().length > 0;
  } catch {
    return false;
  }
}
