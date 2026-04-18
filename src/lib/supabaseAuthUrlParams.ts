function parseAmpersandParams(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw) return out;
  for (const part of raw.split('&')) {
    const [k, v] = part.split('=');
    if (k) out[decodeURIComponent(k)] = v ? decodeURIComponent(v.replace(/\+/g, ' ')) : '';
  }
  return out;
}

/** Merge `#fragment` and `?query` (query wins on duplicate keys). Supabase may send errors in either. */
export function collectSupabaseAuthUrlParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const fromHash = parseAmpersandParams(window.location.hash.replace(/^#/, ''));
  const fromSearch = parseAmpersandParams(window.location.search.replace(/^\?/, ''));
  return { ...fromHash, ...fromSearch };
}

export function stripSupabaseOAuthErrorParamsFromUrl(): void {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['error', 'error_code', 'error_description', 'details']) {
    sp.delete(k);
  }
  const qs = sp.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
}

export function formatSupabaseAuthUrlErrorMessage(params: Record<string, string>): string | null {
  const code = params.error_code;
  const err = params.error ?? '';
  const desc = (params.error_description ?? '').replace(/\+/g, ' ');
  const expiredOrInvalid =
    code === 'otp_expired' ||
    /expired/i.test(err) ||
    /expired/i.test(desc) ||
    /invalid or has expired/i.test(desc) ||
    /invalid.*expired/i.test(desc);
  if (expiredOrInvalid) {
    if (desc.trim()) return desc.trim();
    return 'That link has expired or is invalid. Request a new confirmation or reset email from the form below.';
  }
  if (params.error || code) {
    if (desc.trim()) return desc.trim();
    if (err.trim()) return err.trim();
    return 'Authentication could not be completed. Try signing in again.';
  }
  return null;
}
