import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { computeBillingGatePassed } from '../lib/billingGate';
import { subscriptionRowGrantsPaidSeat } from '../lib/billing/effectiveBillingState';
import { QUILORA_EDGE_SLUG, quiloraEdgeGetJson } from '../lib/quiloraEdge';
import { registerPostCheckoutWebhookDelayWatch } from '../lib/postCheckoutWebhookDelayWatch';

type Language = 'en' | 'bs' | 'es';
type Theme = 'dark' | 'light';

type SubscriptionTier = 'blitz' | 'normal' | 'hardquest' | 'lifetime';

/** Raw tier from `public.profiles.tier` (server-side billing). */
export type QuiloraProfileTier = 'bookworm' | 'bibliophile' | 'genesis';

export interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: SubscriptionTier;
  questionsAsked: number;
  lastQuestionTime: number | null;
  cooldownUntil: number | null;
  onboardingCompleted?: boolean;
  userType?: 'student' | 'casual' | 'researcher';
  creditBalance?: number;
  streakCount?: number;
  streakGoal?: number;
  /** From auth.users.email_confirmed_at — required for EP-01 verification gate. */
  emailConfirmed: boolean;
  avatarUrl?: string | null;
  profileTier?: QuiloraProfileTier;
  genesisBadge?: boolean;
  /** Product tips / marketing-style emails (stored in auth user_metadata). */
  emailProductTips?: boolean;
  /** Study reminder emails (auth user_metadata). */
  emailStudyReminders?: boolean;
  /** EP-02: false until Bookworm plan is confirmed on /pricing or paid subscription is active / paid tier. */
  billingGatePassed: boolean;
}

interface PDFDocument {
  id: string;
  name: string;
  uploadDate: string;
  status: 'processing' | 'ready' | 'failed';
  fileSize?: string;
  pages?: number;
}

interface SavedItem {
  id: string;
  type: 'quote' | 'question' | 'essay';
  content: string;
  page?: number;
  dateSaved: string;
  sessionId?: string;
  bookName?: string;
}

interface Character {
  id: string;
  name: string;
  mentions: number;
}

interface StudySession {
  id: string;
  pdfId: string;
  bookName: string;
  startDate: string;
  lastActive: string;
  messagesCount: number;
  characters?: Character[];
}

interface AppContextType {
  user: User | null;
  language: Language;
  theme: Theme;
  pdfs: PDFDocument[];
  savedItems: SavedItem[];
  sessions: StudySession[];
  setUser: (user: User | null) => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  addPDF: (pdf: PDFDocument) => void;
  updatePDF: (id: string, updates: Partial<PDFDocument>) => void;
  deletePDF: (id: string) => void;
  addSavedItem: (item: SavedItem) => void;
  deleteSavedItem: (id: string) => void;
  addSession: (session: StudySession) => void;
  updateSession: (id: string, updates: Partial<StudySession>) => void;
  deleteSession: (id: string) => void;
  incrementQuestions: () => void;
  isQuestionLimitReached: boolean;
  questionsRemaining: number;
  logout: () => Promise<void>;
  authLoading: boolean;
  /** Re-fetch session + profile (e.g. after email verification). Returns the hydrated user. */
  refreshAuthUser: () => Promise<User | null>;
  /** From Edge `billing/app-state` — when true, Phase 5 canvas unlock is live. */
  publicLaunchComplete: boolean | null;
  refreshLaunchState: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function mapProfileTierToSubscription(tier: string | undefined): SubscriptionTier {
  if (tier === 'genesis') return 'lifetime';
  if (tier === 'bibliophile') return 'hardquest';
  return 'normal';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [publicLaunchComplete, setPublicLaunchComplete] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('bs');
  const [theme, setTheme] = useState<Theme>('dark');
  const [pdfs, setPDFs] = useState<PDFDocument[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);

  const refreshLaunchState = useCallback(async () => {
    try {
      const data = await quiloraEdgeGetJson<{ publicLaunchComplete?: boolean }>(
        `${QUILORA_EDGE_SLUG}/billing/app-state`,
      );
      setPublicLaunchComplete(Boolean(data.publicLaunchComplete));
    } catch {
      setPublicLaunchComplete(false);
    }
  }, []);

  useEffect(() => {
    void refreshLaunchState();
  }, [refreshLaunchState]);

  const hydrateFromSession = useCallback(async (): Promise<User | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setUser(null);
      setAuthLoading(false);
      return null;
    }
    const u = session.user;
    const [{ data: profile }, { data: subRows }] = await Promise.all([
      supabase
        .from('profiles')
        .select(
          'full_name, email, tier, credit_balance, streak_count, streak_goal, avatar_url, genesis_badge, plan_selection_completed',
        )
        .eq('id', u.id)
        .maybeSingle(),
      supabase
        .from('subscriptions')
        .select('status, cancel_at_period_end, current_period_end, is_lifetime, internal_plan_key, billing_provider')
        .eq('user_id', u.id)
        .order('updated_at', { ascending: false })
        .limit(1),
    ]);
    const sub = subRows?.[0] ?? null;
    const meta = u.user_metadata as {
      name?: string;
      email_product_tips?: boolean;
      email_study_reminders?: boolean;
    } | undefined;
    const displayName =
      (profile?.full_name as string | undefined)?.trim() ||
      meta?.name ||
      (u.email ?? '').split('@')[0] ||
      'Reader';
    const rawTier = profile?.tier as string | undefined;
    const profileTier: QuiloraProfileTier =
      rawTier === 'bibliophile' || rawTier === 'genesis' ? rawTier : 'bookworm';
    const emailConfirmed = Boolean(u.email_confirmed_at);
    const planSelectionCompleted = Boolean((profile as { plan_selection_completed?: boolean } | null)?.plan_selection_completed);
    const hasActivePaidSubscription = sub
      ? subscriptionRowGrantsPaidSeat({
          status: sub.status as string,
          cancel_at_period_end: sub.cancel_at_period_end as boolean | null,
          current_period_end: sub.current_period_end as string | null,
          is_lifetime: sub.is_lifetime as boolean | null,
        })
      : false;
    const billingGatePassed = computeBillingGatePassed({
      profileTier,
      planSelectionCompleted,
      hasActivePaidSubscription,
    });
    const userObj: User = {
      id: u.id,
      email: u.email ?? (profile?.email as string) ?? '',
      name: displayName,
      subscriptionTier: mapProfileTierToSubscription(profile?.tier as string | undefined),
      questionsAsked: 0,
      lastQuestionTime: null,
      cooldownUntil: null,
      creditBalance: Number(profile?.credit_balance ?? 0),
      streakCount: Number(profile?.streak_count ?? 0),
      streakGoal: Number(profile?.streak_goal ?? 1),
      emailConfirmed,
      avatarUrl: (profile?.avatar_url as string | null | undefined) ?? null,
      profileTier,
      genesisBadge: Boolean(profile?.genesis_badge),
      emailProductTips: meta?.email_product_tips !== false,
      emailStudyReminders: meta?.email_study_reminders !== false,
      billingGatePassed,
    };
    setUser(userObj);
    setAuthLoading(false);
    return userObj;
  }, []);

  const refreshAuthUser = useCallback(async () => {
    return await hydrateFromSession();
  }, [hydrateFromSession]);

  useEffect(() => {
    registerPostCheckoutWebhookDelayWatch(refreshAuthUser);
  }, [refreshAuthUser]);

  useEffect(() => {
    void hydrateFromSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void hydrateFromSession();
    });
    return () => subscription.unsubscribe();
  }, [hydrateFromSession]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`profile-credits-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        () => {
          void hydrateFromSession();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, hydrateFromSession]);

  // Load from localStorage on mount (user comes from Supabase session via hydrateFromSession)
  useEffect(() => {
    const savedLang = localStorage.getItem('qq_language');
    const savedTheme = localStorage.getItem('qq_theme');
    const savedPDFs = localStorage.getItem('qq_pdfs');
    const savedSavedItems = localStorage.getItem('qq_saved_items');
    const savedSessions = localStorage.getItem('qq_sessions');
    if (savedLang) setLanguage(savedLang as Language);
    if (savedTheme) setTheme(savedTheme as Theme);
    try {
      if (savedPDFs) setPDFs(JSON.parse(savedPDFs));
    } catch {
      /* ignore corrupt stored pdfs */
    }
    try {
      if (savedSavedItems) setSavedItems(JSON.parse(savedSavedItems));
    } catch {
      /* ignore corrupt stored saved items */
    }
    try {
      if (savedSessions) setSessions(JSON.parse(savedSessions));
    } catch {
      /* ignore corrupt stored sessions */
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('qq_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('qq_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('qq_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('qq_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('qq_pdfs', JSON.stringify(pdfs));
  }, [pdfs]);

  useEffect(() => {
    localStorage.setItem('qq_saved_items', JSON.stringify(savedItems));
  }, [savedItems]);

  useEffect(() => {
    localStorage.setItem('qq_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const addPDF = (pdf: PDFDocument) => {
    setPDFs((prev) => [...prev, pdf]);
  };

  const updatePDF = (id: string, updates: Partial<PDFDocument>) => {
    setPDFs((prev) =>
      prev.map((pdf) => (pdf.id === id ? { ...pdf, ...updates } : pdf))
    );
  };

  const deletePDF = (id: string) => {
    setPDFs((prev) => prev.filter((pdf) => pdf.id !== id));
    // Also delete related sessions
    setSessions((prev) => prev.filter((session) => session.pdfId !== id));
  };

  const addSavedItem = (item: SavedItem) => {
    setSavedItems((prev) => [...prev, item]);
  };

  const deleteSavedItem = (id: string) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addSession = (session: StudySession) => {
    setSessions((prev) => [...prev, session]);
  };

  const updateSession = (id: string, updates: Partial<StudySession>) => {
    setSessions((prev) =>
      prev.map((session) => (session.id === id ? { ...session, ...updates } : session))
    );
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== id));
  };

  const incrementQuestions = () => {
    if (!user) return;

    const now = Date.now();
    const newQuestionsAsked = user.questionsAsked + 1;

    // Blitz mode has 5 question limit with cooldown
    if (user.subscriptionTier === 'blitz' && newQuestionsAsked >= 5) {
      const cooldownUntil = now + 4 * 60 * 60 * 1000; // 4 hours
      setUser({
        ...user,
        questionsAsked: newQuestionsAsked,
        lastQuestionTime: now,
        cooldownUntil,
      });
    } else {
      setUser({
        ...user,
        questionsAsked: newQuestionsAsked,
        lastQuestionTime: now,
      });
    }
  };

  const isQuestionLimitReached =
    user?.subscriptionTier === 'blitz' &&
    user.questionsAsked >= 5 &&
    user.cooldownUntil !== null &&
    user.cooldownUntil > Date.now();

  const questionsRemaining =
    user?.subscriptionTier === 'blitz' ? Math.max(0, 5 - user.questionsAsked) : Infinity;

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('qq_user');
    try {
      localStorage.removeItem('quilora_sandboxes');
      localStorage.removeItem('quiloraOnboarding');
      localStorage.removeItem('quiloraUserName');
    } catch {
      /* ignore */
    }
    setUser(null);
  };

  const value: AppContextType = {
    user,
    language,
    theme,
    pdfs,
    savedItems,
    sessions,
    setUser,
    setLanguage,
    setTheme,
    addPDF,
    updatePDF,
    deletePDF,
    addSavedItem,
    deleteSavedItem,
    addSession,
    updateSession,
    deleteSession,
    incrementQuestions,
    isQuestionLimitReached,
    questionsRemaining,
    logout,
    authLoading,
    refreshAuthUser,
    publicLaunchComplete,
    refreshLaunchState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    // Return default values instead of throwing error
    // This allows components to work in preview/isolation mode
    console.warn('useApp is being used outside AppProvider - using default values');
    return {
      user: null,
      language: 'en' as Language,
      theme: 'dark' as Theme,
      pdfs: [],
      savedItems: [],
      sessions: [],
      setUser: () => {},
      setLanguage: () => {},
      setTheme: () => {},
      addPDF: () => {},
      updatePDF: () => {},
      deletePDF: () => {},
      addSavedItem: () => {},
      deleteSavedItem: () => {},
      addSession: () => {},
      updateSession: () => {},
      deleteSession: () => {},
      incrementQuestions: () => {},
      isQuestionLimitReached: false,
      questionsRemaining: 5,
      logout: async () => {},
      authLoading: false,
      refreshAuthUser: async () => null,
      publicLaunchComplete: null,
      refreshLaunchState: async () => {},
    };
  }
  return context;
}