import { useState, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type LucideIcon } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useApp, type User } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/promiseTimeout';
import { Mail, Lock, X, Sparkles, LayoutGrid, BrainCircuit, Highlighter } from 'lucide-react';
import { ModernNavbar } from '../components/ModernNavbar';
import { safeInternalPath } from '../lib/safeInternalPath';
import { markGenesisChoiceFlowPending } from '../lib/genesisEarlyAccessSession';

const GENESIS_CHOICE_REDIRECT_PATH = '/early-access/genesis-choice';

/** Prevents “Please wait…” forever if the Auth API never returns (network / stalled request). */
const AUTH_REQUEST_TIMEOUT_MS = 45000;
/** Profile hydration after sign-in can race SIGNED_IN; bound wait then fall back to session-only user. */
const PROFILE_REFRESH_TIMEOUT_MS = 25000;

type AuthMode = 'login' | 'signup' | 'forgot';

function parseAuthHashParams(): Record<string, string> {
  const raw = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
  const out: Record<string, string> = {};
  if (!raw) return out;
  for (const part of raw.split('&')) {
    const [k, v] = part.split('=');
    if (k) out[decodeURIComponent(k)] = v ? decodeURIComponent(v.replace(/\+/g, ' ')) : '';
  }
  return out;
}

function isDuplicateEmailError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /already registered|already been registered|User already|email address is already|duplicate key/i.test(msg);
}

/** Supabase often returns this when Auth email (SMTP / built-in) is not configured or confirm-email flow fails. */
function formatAuthProviderHint(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('timed out')) {
    return `${message}\n\nCheck your connection. If it keeps happening, confirm the Supabase project is not paused (Dashboard → Project settings) and that VITE_SUPABASE_* env values match the project.`;
  }
  const emailFix =
    'U Supabase Dashboard: Authentication → Providers → Email — za lokalni test isključi „Confirm email“, ili uključi Custom SMTP. Pogledaj i Logs → Auth za tačan uzrok.';
  if (
    lower.includes('confirmation email') ||
    lower.includes('error sending') ||
    lower.includes('sending email') ||
    (lower.includes('email') && lower.includes('send'))
  ) {
    return `${message}\n\n${emailFix}`;
  }
  if (lower.includes('internal server error') || /\b500\b/.test(lower)) {
    return `${message}\n\nČesto: isti problem s mejlom kao gore, ili SQL trigger na auth.users (npr. insert u profiles). Logs → Auth i Postgres u dashboardu.`;
  }
  return message;
}

/** EP-01 weak-password-error-state — explicit rules before Supabase signup. */
function getWeakPasswordMessage(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (!/[a-z]/.test(password)) return 'Add at least one lowercase letter.';
  if (!/[A-Z]/.test(password)) return 'Add at least one uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Add at least one number.';
  return null;
}

const FEATURE_CARDS: { title: string; icon: LucideIcon; description: string }[] = [
  {
    title: 'AI Analysis',
    icon: Sparkles,
    description: 'Deep literary insights powered by AI',
  },
  {
    title: 'Infinite Canvas',
    icon: LayoutGrid,
    description: 'Build your knowledge map visually',
  },
  {
    title: 'Mastery Mode',
    icon: BrainCircuit,
    description: 'Test and validate what you truly understand',
  },
  {
    title: 'Smart Reading',
    icon: Highlighter,
    description: 'Annotate, highlight, and ask anything',
  },
];

function AuthVisualPanel() {
  const [visible, setVisible] = useState<number[]>([]);

  useEffect(() => {
    setVisible([]);
    const timers: number[] = [];
    FEATURE_CARDS.forEach((_, i) => {
      timers.push(
        window.setTimeout(() => {
          setVisible((prev) => (prev.includes(i) ? prev : [...prev, i]));
        }, 140 + i * 180),
      );
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  return (
    <div className="relative flex h-full min-h-[560px] flex-col justify-center overflow-hidden bg-[#061528] p-8 lg:p-12">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#266ba7]/20 via-transparent to-[#0a1929]" aria-hidden />
      <div
        className="pointer-events-none absolute -right-24 top-1/4 h-[380px] w-[380px] rounded-full bg-[#266ba7]/25 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-1/4 h-[300px] w-[300px] rounded-full bg-[#3b82c4]/20 blur-[90px]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-lg">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <img src="/quilora-logo-icon.png" alt="" className="h-10 w-10 shrink-0 object-contain" width={40} height={40} />
          <span className="text-lg font-semibold text-white">Quilora</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {FEATURE_CARDS.map((item, i) => {
            const Icon = item.icon;
            const show = visible.includes(i);
            return (
              <div
                key={item.title}
                className={`group rounded-2xl border border-white/[0.08] bg-[#0a1929]/80 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-all duration-500 ease-out hover:-translate-y-1 hover:border-[#3b82c4]/35 hover:shadow-[0_24px_60px_rgba(38,107,167,0.2)] ${
                  show ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                }`}
                style={{ transitionDelay: show ? `${i * 40}ms` : '0ms' }}
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#266ba7]/20 text-[#7bbdf3] ring-1 ring-[#266ba7]/30 transition-transform duration-300 group-hover:scale-105">
                  <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                </div>
                <h3 className="text-sm font-bold tracking-tight text-white">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-white/55">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, refreshAuthUser } = useApp();
  const { showToast } = useToast();

  const modeParam = searchParams.get('mode') as AuthMode | null;
  const [mode, setModeState] = useState<AuthMode>(() =>
    modeParam === 'signup' || modeParam === 'login' || modeParam === 'forgot' ? modeParam : 'login',
  );
  const [recoveryFlow, setRecoveryFlow] = useState(() =>
    typeof window !== 'undefined' &&
    (window.location.hash.includes('type=recovery') || window.location.hash.includes('recovery')),
  );
  const recoveryRef = useRef(recoveryFlow);
  recoveryRef.current = recoveryFlow;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  /** When a session exists but the user opened /auth?mode=login|signup explicitly, we stay on this page. */
  const [existingSessionEmail, setExistingSessionEmail] = useState<string | null>(null);
  /** EP-01 verify-email-banner — after signup when Supabase returns no session (confirm email flow). */
  const [signUpPendingVerify, setSignUpPendingVerify] = useState(false);
  /** EP-01 duplicate-email-error-state */
  const [duplicateEmailError, setDuplicateEmailError] = useState(false);
  /** EP-01 weak-password-error-state message */
  const [weakPasswordMessage, setWeakPasswordMessage] = useState<string | null>(null);
  /** EP-01 success-redirect — forgot password email sent */
  const [forgotEmailSent, setForgotEmailSent] = useState(false);
  const [passwordResetSuccessBanner, setPasswordResetSuccessBanner] = useState(false);

  const setMode = useCallback(
    (next: AuthMode) => {
      setModeState(next);
      setSearchParams({ mode: next }, { replace: true });
      setError('');
      setDuplicateEmailError(false);
      setWeakPasswordMessage(null);
      setSignUpPendingVerify(false);
      setForgotEmailSent(false);
      setPasswordResetSuccessBanner(false);
      setFirstName('');
      setLastName('');
      setConfirmEmail('');
    },
    [setSearchParams],
  );

  useEffect(() => {
    const m = searchParams.get('mode');
    if (m === 'signup' || m === 'login' || m === 'forgot') {
      setModeState(m);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      setPasswordResetSuccessBanner(true);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('reset');
          return next;
        },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const h = parseAuthHashParams();
    if (h.error_code === 'otp_expired' || (h.error && /expired/i.test(h.error))) {
      setError('That link has expired. Request a new reset or confirmation email.');
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  }, []);

  const authRedirectUrl = `${window.location.origin}/auth`;

  const mapSessionToUser = useCallback((sessionUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown>; email_confirmed_at?: string | null }): User => {
    const meta = sessionUser.user_metadata as {
      name?: string;
      first_name?: string;
      last_name?: string;
      email_product_tips?: boolean;
      email_study_reminders?: boolean;
    } | undefined;
    const emailStr = sessionUser.email ?? '';
    const emailConfirmed = Boolean(sessionUser.email_confirmed_at);
    const combinedFromNames = [meta?.first_name, meta?.last_name]
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
      .filter(Boolean)
      .join(' ')
      .trim();
    return {
      id: sessionUser.id,
      email: emailStr,
      name: (meta?.name && String(meta.name).trim()) || combinedFromNames || emailStr.split('@')[0] || 'Reader',
      subscriptionTier: 'normal' as const,
      questionsAsked: 0,
      lastQuestionTime: null,
      cooldownUntil: null,
      emailConfirmed,
      avatarUrl: null,
      profileTier: 'bookworm',
      genesisBadge: false,
      emailProductTips: meta?.email_product_tips !== false,
      emailStudyReminders: meta?.email_study_reminders !== false,
      billingGatePassed: false,
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      let session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];
      try {
        const { data } = await withTimeout(supabase.auth.getSession(), 15000, 'getSession');
        session = data.session;
      } catch {
        return;
      }
      if (cancelled) return;
      if (!session?.user) {
        setExistingSessionEmail(null);
        return;
      }
      if (recoveryRef.current) return;
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      if (hash.includes('type=recovery') || hash.includes('recovery')) return;

      const mode = searchParams.get('mode');
      if (!session.user.email_confirmed_at && mode !== 'forgot') {
        navigate('/auth/verify-email', { replace: true });
        return;
      }

      const explicitAuthScreen = mode === 'signup' || mode === 'login' || mode === 'forgot';
      if (explicitAuthScreen) {
        setUser(mapSessionToUser(session.user));
        setExistingSessionEmail(session.user.email ?? '');
        return;
      }

      setExistingSessionEmail(null);
      let hydrated: User | null = null;
      try {
        hydrated = await withTimeout(
          refreshAuthUser(session as Session),
          PROFILE_REFRESH_TIMEOUT_MS,
          'Load profile',
        );
      } catch {
        hydrated = null;
      }
      if (cancelled) return;
      const navUser = hydrated ?? mapSessionToUser(session.user);
      if (!hydrated) {
        setUser(mapSessionToUser(session.user));
        void refreshAuthUser(session as Session);
      }
      const redirect = safeInternalPath(new URLSearchParams(window.location.search).get('redirect'));
      if (navUser.emailConfirmed && !navUser.billingGatePassed) {
        if (redirect === GENESIS_CHOICE_REDIRECT_PATH) {
          markGenesisChoiceFlowPending();
          navigate(GENESIS_CHOICE_REDIRECT_PATH, { replace: true });
          return;
        }
        navigate(`/early-access${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`, { replace: true });
        return;
      }
      navigate(redirect ?? '/dashboard', { replace: true });
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        recoveryRef.current = true;
        setRecoveryFlow(true);
        setError('');
        return;
      }
      if (event === 'SIGNED_IN' && session?.user && !recoveryRef.current) {
        if (!session.user.email_confirmed_at) {
          setUser(mapSessionToUser(session.user));
          navigate('/auth/verify-email', { replace: true });
          return;
        }
        void (async () => {
          let hydrated: User | null = null;
          try {
            hydrated = await withTimeout(
              refreshAuthUser(session as Session),
              PROFILE_REFRESH_TIMEOUT_MS,
              'Load profile',
            );
          } catch {
            hydrated = null;
          }
          const navUser = hydrated ?? mapSessionToUser(session.user);
          if (!hydrated) {
            setUser(mapSessionToUser(session.user));
            void refreshAuthUser(session as Session);
          }
          setExistingSessionEmail(null);
          const redirect = safeInternalPath(new URLSearchParams(window.location.search).get('redirect'));
          if (!navUser.billingGatePassed) {
            if (redirect === GENESIS_CHOICE_REDIRECT_PATH) {
              markGenesisChoiceFlowPending();
              navigate(GENESIS_CHOICE_REDIRECT_PATH, { replace: true });
              return;
            }
            navigate(`/early-access${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`, { replace: true });
            return;
          }
          navigate(redirect ?? '/dashboard', { replace: true });
        })();
      }
      if (event === 'SIGNED_OUT') {
        setExistingSessionEmail(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [mapSessionToUser, navigate, setUser, searchParams, refreshAuthUser]);

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    setError('');
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: authRedirectUrl,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Social login failed';
      setError(message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (mode === 'login') setPasswordResetSuccessBanner(false);

    try {
      if (recoveryFlow) {
        const weakNew = getWeakPasswordMessage(newPassword);
        if (weakNew) {
          setError(weakNew);
          setLoading(false);
          return;
        }
        if (newPassword !== confirmNewPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        const { error: updateError } = await withTimeout(
          supabase.auth.updateUser({ password: newPassword }),
          AUTH_REQUEST_TIMEOUT_MS,
          'Update password',
        );
        if (updateError) throw updateError;
        showToast('Password updated. Sign in with your new password.', 'success');
        recoveryRef.current = false;
        setRecoveryFlow(false);
        setUser(null);
        await supabase.auth.signOut();
        navigate('/auth?mode=login&reset=success', { replace: true });
        setLoading(false);
        return;
      }

      if (mode === 'signup') {
        setDuplicateEmailError(false);
        setWeakPasswordMessage(null);
        if (!firstName.trim()) {
          setError('Please enter your first name.');
          setLoading(false);
          return;
        }
        if (!lastName.trim()) {
          setError('Please enter your last name.');
          setLoading(false);
          return;
        }
        if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
          setError('Confirm Email must match your email.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        const weak = getWeakPasswordMessage(password);
        if (weak) {
          setWeakPasswordMessage(weak);
          setLoading(false);
          return;
        }
        const { data, error: signUpError } = await withTimeout(
          supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: authRedirectUrl,
              data: {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                name: [firstName.trim(), lastName.trim()].filter(Boolean).join(' '),
              },
            },
          }),
          AUTH_REQUEST_TIMEOUT_MS,
          'Sign up',
        );
        if (signUpError) {
          if (isDuplicateEmailError(signUpError)) {
            setDuplicateEmailError(true);
            setError('An account with this email already exists. Try logging in instead.');
          } else {
            setError(formatAuthProviderHint(signUpError.message));
          }
          setLoading(false);
          return;
        }

        if (data.session?.user) {
          const u = data.session.user;
          if (!u.email_confirmed_at) {
            setUser(mapSessionToUser(u));
            showToast('Check your inbox to verify your email.', 'success');
            navigate('/auth/verify-email', { replace: true });
            setLoading(false);
            return;
          }
          let hydrated: User | null = null;
          try {
            hydrated = await withTimeout(
              refreshAuthUser(data.session as Session),
              PROFILE_REFRESH_TIMEOUT_MS,
              'Load profile',
            );
          } catch {
            hydrated = null;
          }
          if (!hydrated) {
            setUser(mapSessionToUser(u));
            void refreshAuthUser(data.session as Session);
          }
          const navUser = hydrated ?? mapSessionToUser(u);
          showToast(hydrated ? 'Welcome to Quilora!' : 'Welcome — loading your profile…', hydrated ? 'success' : 'info');
          const redirect = safeInternalPath(searchParams.get('redirect'));
          if (!navUser.billingGatePassed) {
            if (redirect === GENESIS_CHOICE_REDIRECT_PATH) {
              markGenesisChoiceFlowPending();
              navigate(GENESIS_CHOICE_REDIRECT_PATH, { replace: true });
              setLoading(false);
              return;
            }
            navigate(`/early-access${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`, { replace: true });
            setLoading(false);
            return;
          }
          setLoading(false);
          navigate(redirect ?? '/dashboard', { replace: true });
        } else {
          setSignUpPendingVerify(true);
          setModeState('login');
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.set('mode', 'login');
              return next;
            },
            { replace: true },
          );
          setError('');
          setDuplicateEmailError(false);
          setWeakPasswordMessage(null);
          setForgotEmailSent(false);
          showToast('Check your email to confirm your account.', 'success');
        }
      } else if (mode === 'login') {
        const { data, error: signInError } = await withTimeout(
          supabase.auth.signInWithPassword({
            email,
            password,
          }),
          AUTH_REQUEST_TIMEOUT_MS,
          'Log in',
        );
        if (signInError) throw signInError;
        const authUser = data.user ?? data.session?.user ?? null;
        if (!authUser) {
          setError('Sign-in returned no user. Please try again.');
          return;
        }
        if (!authUser.email_confirmed_at) {
          setUser(mapSessionToUser(authUser));
          showToast('Please verify your email to continue.', 'info');
          navigate('/auth/verify-email', { replace: true });
          setLoading(false);
          return;
        }
        const sessionForHydrate = (data.session ?? null) as Session | null;
        let hydrated: User | null = null;
        try {
          hydrated = await withTimeout(
            sessionForHydrate
              ? refreshAuthUser(sessionForHydrate)
              : refreshAuthUser(),
            PROFILE_REFRESH_TIMEOUT_MS,
            'Load profile',
          );
        } catch {
          hydrated = null;
        }
        if (!hydrated) {
          setUser(mapSessionToUser(authUser));
          void (sessionForHydrate ? refreshAuthUser(sessionForHydrate) : refreshAuthUser());
        }
        const navUser = hydrated ?? mapSessionToUser(authUser);
        showToast(hydrated ? 'Logged in successfully!' : 'Logged in — finishing setup…', hydrated ? 'success' : 'info');
        const redirect = safeInternalPath(searchParams.get('redirect'));
        if (!navUser.billingGatePassed) {
          if (redirect === GENESIS_CHOICE_REDIRECT_PATH) {
            markGenesisChoiceFlowPending();
            navigate(GENESIS_CHOICE_REDIRECT_PATH, { replace: true });
            setLoading(false);
            return;
          }
          navigate(`/early-access${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`, { replace: true });
          setLoading(false);
          return;
        }
        setLoading(false);
        navigate(redirect ?? '/dashboard', { replace: true });
      } else if (mode === 'forgot') {
        const { error: resetError } = await withTimeout(
          supabase.auth.resetPasswordForEmail(email, {
            redirectTo: authRedirectUrl,
          }),
          AUTH_REQUEST_TIMEOUT_MS,
          'Password reset email',
        );
        if (resetError) throw resetError;
        setForgotEmailSent(true);
        showToast('If an account exists, you will receive a reset link shortly.', 'success');
      }
    } catch (err: unknown) {
      console.error('Auth error:', err);
      const raw = err instanceof Error ? err.message : 'Something went wrong';
      setError(formatAuthProviderHint(raw));
    } finally {
      setLoading(false);
    }
  };

  const showSplitLayout = (mode === 'login' || mode === 'signup') && !recoveryFlow;
  const showSocial = (mode === 'login' || mode === 'signup') && !recoveryFlow;
  const forgotStandalone = mode === 'forgot' && !recoveryFlow;

  const inputClass =
    'w-full min-h-11 rounded-full border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-base text-[#0f172a] placeholder:text-slate-400 shadow-sm transition-all focus:border-[#266ba7]/50 focus:outline-none focus:ring-2 focus:ring-[#266ba7]/15';

  const inputClassPlain =
    'w-full min-h-11 rounded-full border border-slate-200 bg-white px-4 py-3.5 text-base text-[#0f172a] placeholder:text-slate-400 shadow-sm transition-all focus:border-[#266ba7]/50 focus:outline-none focus:ring-2 focus:ring-[#266ba7]/15';

  const socialBtnClass =
    'flex min-h-11 w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white px-4 py-3.5 text-base font-medium text-[#0f172a] shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

  const primaryBtnClass =
    'min-h-11 w-full rounded-full bg-[#0f172a] py-4 text-base font-semibold text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-50';

  const handleSignOutFromBanner = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setExistingSessionEmail(null);
  }, [setUser]);

  /** Matches `ModernNavbar` default (non-auth) "Get Started": rounded-2xl, px-6 py-2, font-medium, gradient + glow */
  const landingNavbarCtaClass =
    'min-h-11 w-full rounded-2xl px-6 py-2 font-medium text-white transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none';
  const landingNavbarCtaStyle: CSSProperties = {
    background: 'linear-gradient(to right, #266ba7, #3b82c4)',
    boxShadow: '0 0 20px rgba(38, 107, 167, 0.19)',
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0F18]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <ModernNavbar appearance="landingDark" variant="auth" />

      <div className="relative flex flex-1 pt-20">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="absolute right-4 top-24 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#0a1929]/90 text-white/70 shadow-lg transition-all hover:border-[#3b82c4]/40 hover:text-white sm:right-6"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {forgotStandalone ? (
          <div className="flex min-h-[calc(100vh-5rem)] w-full flex-1 flex-col items-center justify-center px-6 py-16">
            <div className="w-full max-w-md animate-fade-in-up rounded-3xl border border-white/10 bg-[#f8fafc] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-10">
              {forgotEmailSent ? (
                <>
                  <h1 className="text-center text-3xl font-bold tracking-tight text-[#0f172a]">Check your email</h1>
                  <p className="mt-3 text-center text-sm leading-relaxed text-slate-500">
                    If an account exists for that address, we sent a password reset link. Links expire after a while—use
                    &quot;Forgot your password?&quot; again if you need a new one.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`mt-10 ${primaryBtnClass}`}
                  >
                    Back to Log In
                  </button>
                </>
              ) : (
                <>
                  <h1 className="text-center text-3xl font-bold tracking-tight text-[#0f172a]">Reset your password</h1>
                  <p className="mt-3 text-center text-sm leading-relaxed text-slate-500">
                    Enter your email and we&apos;ll send you a reset link
                  </p>

                  {error && (
                    <div className="mt-8 whitespace-pre-line rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="mt-10 space-y-5">
                    <div>
                      <label htmlFor="forgot-email" className="sr-only">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#266ba7]/60" />
                        <input
                          id="forgot-email"
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setDuplicateEmailError(false);
                          }}
                          required
                          autoComplete="email"
                          className={inputClass}
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className={primaryBtnClass}>
                      {loading ? 'Please wait…' : 'Send Reset Link'}
                    </button>
                  </form>

                  <p className="mt-8 text-center text-sm text-slate-500">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="font-medium text-[#266ba7] underline-offset-2 hover:underline"
                    >
                      Back to Log In
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <div
              className={`relative flex flex-col justify-center bg-[#f8fafc] px-4 py-10 sm:px-8 sm:py-14 md:px-12 lg:px-16 ${
                showSplitLayout ? 'w-full lg:w-[52%]' : 'w-full'
              }`}
            >
              <div className={`mx-auto w-full ${showSplitLayout ? 'max-w-md' : 'max-w-md'} animate-fade-in-up`}>
                {existingSessionEmail && showSplitLayout && (
                  <div className="mb-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/95 p-4 text-sm text-emerald-950 shadow-sm">
                    <p>
                      Već ste prijavljeni kao <span className="font-semibold">{existingSessionEmail}</span>. Možete ići na nadzornu ploču ili se odjaviti da biste koristili drugi račun.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="rounded-full bg-[#0f172a] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1e293b]"
                      >
                        Nastavi na Dashboard
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSignOutFromBanner()}
                        className="rounded-full border border-emerald-700/30 bg-white px-4 py-2 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100/80"
                      >
                        Odjavi se
                      </button>
                    </div>
                  </div>
                )}
                {recoveryFlow ? (
                  <>
                    <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">Set a new password</h1>
                    <p className="mt-3 text-sm leading-relaxed text-slate-500">Choose a strong password for your account.</p>
                  </>
                ) : mode === 'signup' ? (
                  <>
                    <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">Welcome to Quilora</h1>
                    <p className="mt-3 text-base text-slate-500">Infinite ways to master your reading list</p>
                  </>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">Welcome back to Quilora</h1>
                    <p className="mt-3 text-base text-slate-500">Pick up where you left off</p>
                  </>
                )}

                {passwordResetSuccessBanner && mode === 'login' && !recoveryFlow && (
                  <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-sm">
                    Your password was reset. Sign in with your new password.
                  </div>
                )}
                {signUpPendingVerify && mode === 'login' && !recoveryFlow && (
                  <div className="mt-8 rounded-2xl border border-[#266ba7]/25 bg-[#e8f2fb] p-4 text-sm text-[#0f172a] shadow-sm">
                    We sent a confirmation link to your email. Open it to verify your account, then sign in here.
                  </div>
                )}
                {error && (
                  <div className="mt-8 whitespace-pre-line rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {showSocial && (
                  <div className="mt-10 space-y-3">
                    <button type="button" onClick={() => handleSocialLogin('google')} disabled={loading} className={socialBtnClass}>
                      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </button>
                    <button type="button" onClick={() => handleSocialLogin('facebook')} disabled={loading} className={socialBtnClass}>
                      <svg className="h-5 w-5 shrink-0 fill-[#1877F2]" viewBox="0 0 24 24" aria-hidden>
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Continue with Facebook
                    </button>
                    <div className="relative my-8 flex items-center gap-4">
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="text-xs font-medium uppercase tracking-wider text-slate-400">or</span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {mode === 'signup' && !recoveryFlow && (
                    <>
                      <div>
                        <label htmlFor="auth-first-name" className="sr-only">
                          First name
                        </label>
                        <input
                          id="auth-first-name"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          autoComplete="given-name"
                          className={inputClassPlain}
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <label htmlFor="auth-last-name" className="sr-only">
                          Last name
                        </label>
                        <input
                          id="auth-last-name"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          autoComplete="family-name"
                          className={inputClassPlain}
                          placeholder="Last name"
                        />
                      </div>
                    </>
                  )}
                  {!recoveryFlow && (
                    <div>
                      <label htmlFor="auth-email" className="sr-only">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#266ba7]/60" />
                        <input
                          id="auth-email"
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setDuplicateEmailError(false);
                          }}
                          required
                          autoComplete="email"
                          className={`${inputClass} ${duplicateEmailError ? 'border-amber-500 ring-2 ring-amber-100' : ''}`}
                          placeholder="Enter your email"
                          aria-invalid={duplicateEmailError}
                        />
                      </div>
                    </div>
                  )}
                  {mode === 'signup' && !recoveryFlow && (
                    <div>
                      <label htmlFor="auth-confirm-email" className="sr-only">
                        Confirm email
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#266ba7]/60" />
                        <input
                          id="auth-confirm-email"
                          type="email"
                          value={confirmEmail}
                          onChange={(e) => setConfirmEmail(e.target.value)}
                          required
                          autoComplete="email"
                          className={inputClass}
                          placeholder="Confirm email"
                        />
                      </div>
                    </div>
                  )}

                  {recoveryFlow && (
                    <>
                      <div>
                        <label htmlFor="new-password" className="sr-only">
                          New password
                        </label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#266ba7]/60" />
                          <input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={8}
                            autoComplete="new-password"
                            className={inputClass}
                            placeholder="New password"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="confirm-new-password" className="sr-only">
                          Confirm new password
                        </label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#266ba7]/60" />
                          <input
                            id="confirm-new-password"
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            required
                            minLength={8}
                            autoComplete="new-password"
                            className={inputClass}
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {mode !== 'forgot' && !recoveryFlow && (
                    <div>
                      <label htmlFor="auth-password" className="sr-only">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#266ba7]/60" />
                        <input
                          id="auth-password"
                          type="password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setWeakPasswordMessage(null);
                          }}
                          required={mode !== 'forgot'}
                          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                          className={`${inputClass} ${weakPasswordMessage && mode === 'signup' ? 'border-amber-500 ring-2 ring-amber-100' : ''}`}
                          placeholder="Password"
                        />
                      </div>
                      {mode === 'signup' && weakPasswordMessage && (
                        <p className="mt-2 text-xs font-medium text-amber-800">{weakPasswordMessage}</p>
                      )}
                    </div>
                  )}

                  {mode === 'signup' && !recoveryFlow && (
                    <div>
                      <label htmlFor="auth-confirm-password" className="sr-only">
                        Confirm password
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#266ba7]/60" />
                        <input
                          id="auth-confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          autoComplete="new-password"
                          className={inputClass}
                          placeholder="Confirm password"
                        />
                      </div>
                    </div>
                  )}

                  {mode === 'login' && !recoveryFlow && (
                    <div className="space-y-3 pt-0.5">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setMode('forgot')}
                          className="text-sm font-medium text-[#266ba7] underline-offset-2 hover:underline"
                        >
                          Forgot your password?
                        </button>
                      </div>
                      <div
                        id="session-persistence-flag"
                        className="flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-slate-50/90 px-3 py-2 text-left text-xs text-slate-600"
                        title="Your sign-in session is stored on this browser until you sign out. Managed by Supabase Auth (persistSession)."
                      >
                        <span
                          className="inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]"
                          aria-hidden
                        />
                        <span>
                          <span className="font-semibold text-slate-800">Stay signed in</span>
                          <span className="text-slate-500"> — active on this device</span>
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={`mt-2 ${
                      !recoveryFlow && (mode === 'login' || mode === 'signup') ? landingNavbarCtaClass : primaryBtnClass
                    }`}
                    style={!recoveryFlow && (mode === 'login' || mode === 'signup') ? landingNavbarCtaStyle : undefined}
                  >
                    {loading
                      ? 'Please wait…'
                      : recoveryFlow
                        ? 'Update password'
                        : mode === 'login'
                          ? 'Log In'
                          : mode === 'signup'
                            ? 'Get Started'
                            : 'Send Reset Link'}
                  </button>
                </form>

                {!recoveryFlow && (
                  <div className="mt-8 space-y-6 text-center">
                    {mode === 'signup' && (
                      <p className="text-xs leading-relaxed text-slate-500">
                        By signing up, you agree to our{' '}
                        <a href="/terms" className="font-medium text-[#266ba7] underline-offset-2 hover:underline">
                          Terms of Use
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" className="font-medium text-[#266ba7] underline-offset-2 hover:underline">
                          Privacy Policy
                        </a>
                        .
                      </p>
                    )}
                    {mode === 'login' && (
                      <p className="text-sm text-slate-600">
                        Don&apos;t have an account?{' '}
                        <button
                          type="button"
                          onClick={() => setMode('signup')}
                          className="font-semibold text-[#266ba7] underline-offset-2 hover:underline"
                        >
                          Sign up
                        </button>
                      </p>
                    )}
                    {mode === 'signup' && (
                      <p className="text-sm text-slate-600">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => setMode('login')}
                          className="font-semibold text-[#266ba7] underline-offset-2 hover:underline"
                        >
                          Log in
                        </button>
                      </p>
                    )}
                  </div>
                )}

                {recoveryFlow && (
                  <div className="mt-8 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        recoveryRef.current = false;
                        setRecoveryFlow(false);
                        void supabase.auth.signOut();
                        setMode('login');
                      }}
                      className="text-sm font-medium text-[#266ba7] underline-offset-2 hover:underline"
                    >
                      Back to Log In
                    </button>
                  </div>
                )}
              </div>
            </div>

            {showSplitLayout && (
              <div className="hidden min-h-[calc(100vh-73px)] lg:flex lg:flex-1 lg:flex-col">
                <AuthVisualPanel />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
