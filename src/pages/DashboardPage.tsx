import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Home,
  FileText,
  Bookmark,
  Sparkles,
  Settings,
  Upload,
  Clock,
  TrendingUp,
  MessageSquare,
  LogOut,
  Menu,
  X,
  ArrowRight,
  Activity,
  Target,
  Calendar,
  Pencil,
  Trash2,
} from 'lucide-react';
import { LowBalanceBanner } from '../components/LowBalanceBanner';
import { CreditBalanceWidget } from '../components/CreditBalanceWidget';
import { PreLaunchAccountHoldingCard } from '../components/prelaunch/PreLaunchAccountHoldingCard';
import { useApp, type User } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { isPreLaunchHoldingDashboard } from '../lib/preLaunchProductMode';
import { hasCompletedQuiloraOnboardingV4 } from '../lib/quiloraOnboardingStorage';
import { QUILORA_EDGE_SLUG, quiloraEdgePostJson } from '../lib/quiloraEdge';
import { supabase } from '../lib/supabase';

function dashboardSidebarPlanLabel(user: User | null): string {
  if (!user) return 'Account';
  if (user.profileTier === 'genesis') return 'Genesis';
  if (user.profileTier === 'bibliophile') return 'Sage';
  return 'Bookworm';
}

type SandboxCard = {
  id: string;
  sandbox_name: string | null;
  pdf_file_name: string | null;
  pdf_file_url: string | null;
  last_opened_at: string | null;
  read_only?: boolean;
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout, publicLaunchComplete, refreshAuthUser, refreshLaunchState } = useApp();
  const { showToast } = useToast();
  const preLaunchHolding = isPreLaunchHoldingDashboard(user, publicLaunchComplete);

  const cancelBookwormSageApi = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) {
      showToast('Sign in again to cancel.', 'error');
      return;
    }
    await quiloraEdgePostJson(`${QUILORA_EDGE_SLUG}/billing/cancel-prelaunch`, token, {});
    showToast('Cancellation recorded. Refund completes via Dodo Payments.', 'success');
    await refreshAuthUser();
    await refreshLaunchState();
  }, [showToast, refreshAuthUser, refreshLaunchState]);

  const openBillingPortal = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) {
      showToast('Sign in again to manage billing.', 'error');
      return;
    }
    try {
      const res = await quiloraEdgePostJson<{ portalUrl?: string; error?: string }>(
        `${QUILORA_EDGE_SLUG}/billing/dodo/customer-portal`,
        token,
        {},
      );
      const url = res.portalUrl?.trim();
      if (!url) {
        showToast(res.error || 'Billing portal is not available yet.', 'error');
        return;
      }
      window.location.href = url;
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not open billing portal.', 'error');
    }
  }, [showToast]);

  const cancelGenesisApi = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) {
      showToast('Sign in again.', 'error');
      return;
    }
    await quiloraEdgePostJson(`${QUILORA_EDGE_SLUG}/billing/cancel-genesis`, token, {});
    showToast('Genesis seat released in Quilora.', 'success');
    await refreshAuthUser();
    await refreshLaunchState();
  }, [showToast, refreshAuthUser, refreshLaunchState]);
  const bookwormTier = user?.profileTier === 'bookworm' || !user?.profileTier;
  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sandboxes, setSandboxes] = useState<SandboxCard[]>([]);
  const [cardMenuSandboxId, setCardMenuSandboxId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<SandboxCard | null>(null);
  const [fadingOutId, setFadingOutId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isUuid = (id: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

  const persistLocalSandboxes = useCallback((next: SandboxCard[]) => {
    setSandboxes(next);
    try {
      localStorage.setItem('quilora_sandboxes', JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!hasCompletedQuiloraOnboardingV4()) {
      navigate('/onboarding');
      return;
    }
    const raw = localStorage.getItem('quiloraOnboarding');
    let display: string | null = null;
    if (raw) {
      try {
        const o = JSON.parse(raw) as { version?: number; displayName?: string };
        if (o?.version === 4 && typeof o.displayName === 'string' && o.displayName.trim()) {
          display = o.displayName.trim();
        }
      } catch {
        /* ignore */
      }
    }
    if (!display) {
      navigate('/onboarding');
      return;
    }

    const storedName = localStorage.getItem('quiloraUserName')?.trim() || display || 'there';
    setUserName(storedName);

    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Trigger load animations
    setTimeout(() => setIsLoaded(true), 100);
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!user?.id) {
        try {
          const stored = localStorage.getItem('quilora_sandboxes');
          if (!cancelled) setSandboxes(stored ? (JSON.parse(stored) as SandboxCard[]) : []);
        } catch {
          if (!cancelled) setSandboxes([]);
        }
        return;
      }
      const { data, error } = await supabase
        .from('sandboxes')
        .select('id,name,pdf_filename,pdf_url,last_opened_at,read_only')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('last_opened_at', { ascending: false });
      if (cancelled) return;
      if (error || !data) {
        try {
          const stored = localStorage.getItem('quilora_sandboxes');
          setSandboxes(stored ? (JSON.parse(stored) as SandboxCard[]) : []);
        } catch {
          setSandboxes([]);
        }
        return;
      }
      setSandboxes(
        data.map((row) => ({
          id: row.id as string,
          sandbox_name: (row.name as string) ?? null,
          pdf_file_name: (row.pdf_filename as string) ?? null,
          pdf_file_url: (row.pdf_url as string) ?? null,
          last_opened_at: (row.last_opened_at as string) ?? null,
          read_only: Boolean((row as { read_only?: boolean }).read_only),
        })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!cardMenuSandboxId) return;
    const close = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setCardMenuSandboxId(null);
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [cardMenuSandboxId]);

  const formatLastOpened = (isoValue: string | null) => {
    if (!isoValue) return 'Last opened recently';
    const diffMs = Date.now() - new Date(isoValue).getTime();
    const hours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
    if (hours < 24) return `Last opened ${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.round(hours / 24);
    return `Last opened ${days} day${days === 1 ? '' : 's'} ago`;
  };

  const saveRename = useCallback(async () => {
    if (!renamingId || !renameDraft.trim()) return;
    const name = renameDraft.trim();
    if (isUuid(renamingId) && user?.id) {
      await supabase.from('sandboxes').update({ name, last_opened_at: new Date().toISOString() }).eq('id', renamingId).eq('user_id', user.id);
    }
    persistLocalSandboxes(sandboxes.map((item) => (item.id === renamingId ? { ...item, sandbox_name: name } : item)));
    setRenamingId(null);
  }, [renamingId, renameDraft, sandboxes, persistLocalSandboxes, user?.id]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    setFadingOutId(id);
    if (isUuid(id) && user?.id) {
      await supabase.from('sandbox_content').delete().eq('sandbox_id', id);
      await supabase.from('sandboxes').update({ is_deleted: true }).eq('id', id).eq('user_id', user.id);
    }
    window.setTimeout(() => {
      persistLocalSandboxes(sandboxes.filter((item) => item.id !== id));
      setFadingOutId(null);
    }, 320);
  }, [deleteTarget, persistLocalSandboxes, sandboxes, user?.id]);

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('quiloraOnboarding');
    localStorage.removeItem('quiloraUserName');
    navigate('/');
  };

  const navigationItems = useMemo(
    () => [
      { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
      { id: 'pdfs', label: 'My PDFs', icon: FileText, path: '/pdfs' },
      { id: 'insights', label: 'Saved Insights', icon: Bookmark, path: '/saved' },
      {
        id: 'upgrade',
        label: 'Upgrade',
        icon: Sparkles,
        highlight: true,
        path: preLaunchHolding ? '/early-access' : '/pricing',
      },
      { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
    ],
    [preLaunchHolding],
  );

  const topStats = [
    {
      label: 'Daily streak',
      value: user?.streakCount != null ? `${user.streakCount}/${user.streakGoal ?? 1}` : '—',
      icon: Activity,
      color: '#266ba7',
      change: 'Opens any sandbox today',
    },
    { label: 'PDFs Analyzed', value: '8', icon: FileText, color: '#3b82c4', change: '2 in progress' },
    { label: 'Questions Asked', value: '147', icon: TrendingUp, color: '#4a9dd4', change: '+24 today' },
    { label: 'Insights Saved', value: '34', icon: Bookmark, color: '#5aa3e4', change: '12 themes' }
  ];

  const recentSessions = [
    { id: '1', title: 'The Great Gatsby', lastActive: '2 hours ago', progress: 75, questions: 23 },
    { id: '2', title: '1984 by George Orwell', lastActive: '1 day ago', progress: 45, questions: 18 },
    { id: '3', title: 'To Kill a Mockingbird', lastActive: '3 days ago', progress: 100, questions: 31 }
  ];

  const handleContinueSession = (sessionId: string) => {
    navigate(`/study-session?continue=${sessionId}`);
  };

  const weeklyActivity = [
    { day: 'Mon', sessions: 2 },
    { day: 'Tue', sessions: 3 },
    { day: 'Wed', sessions: 1 },
    { day: 'Thu', sessions: 4 },
    { day: 'Fri', sessions: 2 },
    { day: 'Sat', sessions: 0 },
    { day: 'Sun', sessions: 1 }
  ];

  const maxSessions = Math.max(...weeklyActivity.map(d => d.sessions));

  return (
    <div className="flex min-h-screen min-w-0 overflow-x-hidden" style={{ backgroundColor: '#0a1929', fontFamily: 'Inter, sans-serif' }}>
      {/* Subtle animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#266ba7]/5 via-transparent to-[#266ba7]/5 pointer-events-none" />

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 border-r border-white/5 bg-[#0a1929]/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between">
              <a href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
                <img src="/quilora-logo-icon.png" alt="" className="h-10 w-10 shrink-0 object-contain" width={40} height={40} />
                <span className="text-xl font-semibold text-white">Quilora</span>
              </a>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                    if (item.path) navigate(item.path);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-[#266ba7]/90 text-white shadow-lg shadow-[#266ba7]/20'
                      : item.highlight
                      ? 'bg-gradient-to-r from-[#266ba7]/10 to-transparent text-[#266ba7] hover:from-[#266ba7]/20'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                  style={{
                    transform: isActive ? 'translateX(2px)' : 'none'
                  }}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : item.highlight ? 'text-[#266ba7]' : ''}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                  {item.highlight && !isActive && (
                    <Sparkles className="w-4 h-4 ml-auto text-[#266ba7]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 mb-2 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#266ba7] to-[#3b82c4] flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm truncate">{userName}</div>
                <div className="text-xs text-white/40">{dashboardSidebarPlanLabel(user)}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void openBillingPortal()}
              className="mb-2 w-full rounded-2xl border border-white/10 bg-[#1a2f45]/50 px-4 py-2.5 text-left text-xs font-medium text-white/80 transition-colors hover:border-[#266ba7]/40 hover:text-white"
            >
              Manage subscription
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="relative min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a1929]/90 backdrop-blur-xl">
          <div className="px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-white/60 hover:text-white transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className={`flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                <div>
                  <h1 className="text-2xl font-semibold text-white">
                    {greeting}, {userName}
                  </h1>
                  <p className="mt-0.5 text-sm text-white/50">
                    {preLaunchHolding
                      ? 'Pre-launch — we&apos;ll email you the moment canvas access goes live.'
                      : 'Let&apos;s explore some great literature today'}
                  </p>
                </div>
                <CreditBalanceWidget
                  variant="dashboard"
                  className="justify-end"
                  creditsLocked={preLaunchHolding}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 max-w-7xl mx-auto space-y-8">
          {!preLaunchHolding ? <LowBalanceBanner /> : null}
          {activeTab === 'dashboard' && (
            <>
              {preLaunchHolding && user ? (
                <div className="mb-6">
                  <PreLaunchAccountHoldingCard
                    user={user}
                    navigate={navigate}
                    onCancelBookwormSage={cancelBookwormSageApi}
                    onCancelGenesisSeat={cancelGenesisApi}
                  />
                </div>
              ) : null}
              {/* Main Content */}
              <div className="w-full border-2 border-white/20 rounded-3xl bg-gradient-to-br from-[#1a2f45]/30 to-[#0a1929]/30 p-10">
                {bookwormTier && sandboxes.some((s) => s.read_only) ? (
                  <div
                    id="limit-reached-banner"
                    className="mx-auto mb-8 max-w-2xl rounded-2xl border border-amber-500/35 bg-amber-500/10 px-5 py-4 text-left text-sm text-amber-50"
                  >
                    <p className="font-semibold text-amber-100">Sandbox limit reached (Bookworm)</p>
                    <p className="mt-1 text-amber-100/85">
                      Older sandboxes are <strong>read-only</strong> until you upgrade. New edits apply to your five most recent writable sandboxes.
                    </p>
                    <p id="restore-on-upgrade-note" className="mt-2 text-xs text-amber-100/70">
                      Upgrade to <strong>Sage</strong> for unlimited writable sandboxes and rollover credits.
                    </p>
                    <button
                      type="button"
                      id="upgrade-to-sage-btn"
                      onClick={() => navigate(preLaunchHolding ? '/early-access' : '/pricing')}
                      className="mt-3 inline-flex rounded-full bg-white px-5 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-50"
                    >
                      Upgrade to Sage
                    </button>
                  </div>
                ) : null}
                <div className="text-center space-y-6 max-w-2xl mx-auto py-14">
                  <h2 className="text-4xl lg:text-5xl font-bold text-white">
                    What are we studying today?
                  </h2>
                  <p className="text-xl text-white/60">
                    Create your very first{' '}
                    <button className="text-[#266ba7] hover:text-[#3b82c4] underline font-medium transition-colors">
                      Sandbox
                    </button>{' '}
                    to start learning
                  </p>
                  <button
                    type="button"
                    disabled={preLaunchHolding}
                    onClick={async () => {
                      if (preLaunchHolding) {
                        showToast('Canvas and sandboxes unlock on public launch day.', 'info');
                        return;
                      }
                      if (user?.id) {
                        const { data: prof } = await supabase.from('profiles').select('tier').eq('id', user.id).maybeSingle();
                        if (prof?.tier === 'bookworm') {
                          const { count } = await supabase
                            .from('sandboxes')
                            .select('id', { count: 'exact', head: true })
                            .eq('user_id', user.id)
                            .eq('is_deleted', false);
                          if ((count ?? 0) >= 5) {
                            navigate(preLaunchHolding ? '/early-access' : '/pricing');
                            return;
                          }
                        }
                      }
                      navigate('/sandbox-loading-frame');
                    }}
                    className={`inline-flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-lg transition-all ${
                      preLaunchHolding
                        ? 'cursor-not-allowed border border-white/15 bg-white/10 text-white/45'
                        : 'bg-[#266ba7] hover:bg-[#3b82c4] text-white hover:shadow-xl hover:shadow-[#266ba7]/40 hover:-translate-y-0.5'
                    }`}
                  >
                    <div className={`h-3 w-3 rounded-full ${preLaunchHolding ? 'bg-white/30' : 'bg-white/90'}`} />
                    {preLaunchHolding ? 'Canvas — available on launch day' : 'Create a Sandbox'}
                  </button>
                </div>
                {sandboxes.length > 0 && (
                  <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {sandboxes.map((sandbox) => (
                      <div
                        key={sandbox.id}
                        className={`relative rounded-3xl border border-[#3b82c4]/35 bg-[#0f2238] p-5 transition duration-300 hover:shadow-[0_0_30px_rgba(59,130,196,0.25)] ${fadingOutId === sandbox.id ? 'pointer-events-none scale-95 opacity-0' : 'opacity-100'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            {renamingId === sandbox.id ? (
                              <input
                                autoFocus
                                value={renameDraft}
                                onChange={(event) => setRenameDraft(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') void saveRename();
                                  if (event.key === 'Escape') setRenamingId(null);
                                }}
                                onBlur={() => setRenamingId(null)}
                                className="w-full rounded-xl border border-[#3b82c4]/40 bg-[#0a1929] px-3 py-2 text-lg font-bold text-white outline-none ring-2 ring-[#266ba7]/30"
                              />
                            ) : (
                              <h3 className="truncate text-lg font-bold text-white">{sandbox.sandbox_name ?? sandbox.pdf_file_name ?? 'Sandbox'}</h3>
                            )}
                            {sandbox.read_only ? (
                              <p id="frozen-sandbox-state" className="mt-1 text-xs font-medium uppercase tracking-wide text-amber-200/90">
                                Read-only
                              </p>
                            ) : null}
                            <p className="mt-2 text-sm text-white/50">{formatLastOpened(sandbox.last_opened_at)}</p>
                            <button
                              onClick={() => {
                                if (preLaunchHolding) {
                                  showToast('Canvas unlocks on public launch day.', 'info');
                                  return;
                                }
                                const updated = sandboxes.map((item) => (item.id === sandbox.id ? { ...item, last_opened_at: new Date().toISOString() } : item));
                                persistLocalSandboxes(updated);
                                if (isUuid(sandbox.id) && user?.id) {
                                  void supabase.from('sandboxes').update({ last_opened_at: new Date().toISOString() }).eq('id', sandbox.id).eq('user_id', user.id);
                                }
                                navigate('/sandbox-loading-frame', {
                                  state: { sandbox: { ...sandbox, read_only: sandbox.read_only } },
                                });
                              }}
                              type="button"
                              className={`mt-4 rounded-full px-4 py-2 text-sm font-semibold ${
                                preLaunchHolding
                                  ? 'cursor-not-allowed bg-white/5 text-white/35'
                                  : 'bg-[#266ba7]/20 text-[#9bcfff] hover:bg-[#266ba7]/35'
                              }`}
                            >
                              {preLaunchHolding ? 'Available on launch →' : sandbox.read_only ? 'View sandbox →' : 'Jump back in →'}
                            </button>
                          </div>
                          <button
                            type="button"
                            aria-label="Sandbox options"
                            className="flex min-h-11 min-w-11 shrink-0 touch-manipulation items-center justify-center rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
                            onClick={(event) => {
                              event.stopPropagation();
                              setCardMenuSandboxId((current) => (current === sandbox.id ? null : sandbox.id));
                            }}
                          >
                            <span className="text-lg leading-none text-white/80" aria-hidden>⋯</span>
                          </button>
                        </div>
                        {cardMenuSandboxId === sandbox.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-3 top-12 z-20 min-w-[160px] overflow-hidden rounded-xl border border-white/10 bg-[#0a1929] py-1 text-sm shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
                          >
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-white/90 hover:bg-white/10"
                              onClick={() => {
                                setRenameDraft(sandbox.sandbox_name || sandbox.pdf_file_name || 'Sandbox');
                                setRenamingId(sandbox.id);
                                setCardMenuSandboxId(null);
                              }}
                            >
                              <Pencil className="h-4 w-4 shrink-0 text-[#9bcfff]" />
                              Rename
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-rose-300 hover:bg-rose-500/15"
                              onClick={() => {
                                setDeleteTarget(sandbox);
                                setCardMenuSandboxId(null);
                              }}
                            >
                              <Trash2 className="h-4 w-4 shrink-0" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {deleteTarget && (
                  <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" role="presentation" onClick={() => setDeleteTarget(null)}>
                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a1929] p-6 text-white shadow-2xl" role="dialog" aria-modal onClick={(event) => event.stopPropagation()}>
                      <p className="text-center text-sm leading-relaxed text-white/90">
                        Are you sure you want to delete this sandbox? This cannot be undone.
                      </p>
                      <div className="mt-6 flex justify-center gap-3">
                        <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5">
                          Cancel
                        </button>
                        <button type="button" onClick={() => void confirmDelete()} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}


        </div>
      </main>
    </div>
  );
}