import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { safeInternalPath } from '../lib/safeInternalPath';
import { markGenesisChoiceFlowPending } from '../lib/genesisEarlyAccessSession';

const GENESIS_CHOICE_REDIRECT_PATH = '/early-access/genesis-choice';
import { useApp } from '../context/AppContext';
import { ModernNavbar } from '../components/ModernNavbar';
import { QUILORA_CONTACT_EMAIL } from '../lib/siteContact';
import { getAuthRedirectBaseUrl } from '../lib/publicSiteOrigin';
import {
  collectSupabaseAuthUrlParams,
  formatSupabaseAuthUrlErrorMessage,
  stripSupabaseOAuthErrorParamsFromUrl,
} from '../lib/supabaseAuthUrlParams';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const { logout, refreshAuthUser } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [expiredOrError, setExpiredOrError] = useState<string | null>(null);
  const autoResentOnceRef = useRef(false);

  const refreshSession = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/auth?mode=login', { replace: true });
      return;
    }
    if (session.user.email_confirmed_at) {
      await supabase.auth.refreshSession();
      const hydrated = await refreshAuthUser();
      if (hydrated && !hydrated.billingGatePassed) {
        const redirect =
          safeInternalPath(new URLSearchParams(window.location.search).get('redirect')) ?? '/dashboard';
        if (redirect === GENESIS_CHOICE_REDIRECT_PATH) {
          markGenesisChoiceFlowPending();
          navigate(GENESIS_CHOICE_REDIRECT_PATH, { replace: true });
          return;
        }
        navigate(`/early-access?redirect=${encodeURIComponent(redirect)}`, { replace: true });
        return;
      }
      navigate('/dashboard', { replace: true });
      return;
    }
    setEmail(session.user.email ?? '');
    setLoading(false);
  }, [navigate, refreshAuthUser]);

  useEffect(() => {
    const params = collectSupabaseAuthUrlParams();
    const msg = formatSupabaseAuthUrlErrorMessage(params);
    if (msg) setExpiredOrError(msg);
    if (params.error || params.error_code) stripSupabaseOAuthErrorParamsFromUrl();
    void refreshSession();
  }, [refreshSession]);

  const handleResend = useCallback(async () => {
    const target = email.trim();
    if (!target) return;
    setResendBusy(true);
    setResendMessage(null);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: target,
      options: { emailRedirectTo: getAuthRedirectBaseUrl() },
    });
    setResendBusy(false);
    if (error) {
      setResendMessage(error.message);
      return;
    }
    setResendMessage('Check your inbox — we sent another confirmation link.');
  }, [email]);

  useEffect(() => {
    if (loading || !email || autoResentOnceRef.current) return;
    const id = window.setTimeout(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) return;
      if (autoResentOnceRef.current) return;
      autoResentOnceRef.current = true;
      await handleResend();
      setResendMessage((prev) => prev ?? 'We re-sent your confirmation link because verification was still pending.');
    }, 10 * 60 * 1000);
    return () => window.clearTimeout(id);
  }, [loading, email, handleResend]);

  const handleSignOut = async () => {
    await logout();
    navigate('/auth?mode=login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F18]" style={{ fontFamily: 'Inter, sans-serif' }}>
        <ModernNavbar appearance="landingDark" variant="auth" />
        <div className="flex min-h-[50vh] items-center justify-center text-white/60">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0F18]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <ModernNavbar appearance="landingDark" variant="auth" />

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
        <div className="rounded-3xl border border-white/10 bg-[#f8fafc] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-10">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#266ba7]/12 text-[#266ba7]">
            <Mail className="h-7 w-7" />
          </div>

          {/* verify-banner */}
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Confirm your email</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            We sent a link to <span className="font-semibold text-[#0f172a]">{email}</span>. Open it on this device to unlock your account.
          </p>

          {expiredOrError ? (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            >
              {expiredOrError}
            </div>
          ) : null}

          <div className="mt-8 space-y-3 rounded-2xl border border-[#266ba7]/25 bg-[#266ba7]/[0.08] px-4 py-4 text-sm leading-relaxed text-[#0f172a]">
            <p className="font-semibold text-[#0f172a]">Check your spam or junk folder</p>
            <p className="text-slate-700">
              Our confirmation emails sometimes land in spam. If you still see nothing after a few minutes, contact{' '}
              <a href={`mailto:${QUILORA_CONTACT_EMAIL}`} className="font-medium text-[#266ba7] underline-offset-2 hover:underline">
                {QUILORA_CONTACT_EMAIL}
              </a>{' '}
              and we&apos;ll verify you manually.
            </p>
            <p className="text-xs text-slate-600">
              If your address is still unverified after 10 minutes, we automatically try sending one more confirmation
              email (once).
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              disabled={resendBusy || !email}
              onClick={() => void handleResend()}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#0f172a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${resendBusy ? 'animate-spin' : ''}`} />
              Resend confirmation email
            </button>
          </div>

          {resendMessage ? <p className="mt-4 text-center text-sm text-slate-600">{resendMessage}</p> : null}

          <p className="mt-8 text-center text-sm text-slate-500">
            Already verified?{' '}
            <button
              type="button"
              className="font-semibold text-[#266ba7] underline-offset-2 hover:underline"
              onClick={() => void refreshSession()}
            >
              Continue to Quilora
            </button>
          </p>

          <p className="mt-4 text-center text-sm text-slate-500">
            <button type="button" onClick={() => void handleSignOut()} className="font-medium text-slate-600 underline-offset-2 hover:underline">
              Sign out
            </button>{' '}
            ·{' '}
            <Link to="/" className="font-medium text-[#266ba7] underline-offset-2 hover:underline">
              Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
