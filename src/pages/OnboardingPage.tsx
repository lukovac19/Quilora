import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { BookOpen, ArrowRight, Check } from 'lucide-react';
import { useApp, type User } from '../context/AppContext';
import { supabase } from '../lib/supabase';

/** Pre-launch onboarding v4 — persisted JSON (flow doc Phase 3C). */
export interface QuiloraOnboardingV4 {
  version: 4;
  displayName: string;
  persona: string;
  contentTypes: string[];
  readingHabits: string[];
  primaryGoal: string;
}

const PERSONA_OPTIONS = [
  { value: 'student', label: "I'm a student" },
  { value: 'growth', label: 'I read for personal growth' },
  { value: 'bookclub', label: "I'm part of a book club" },
  { value: 'professional', label: "I'm a professional — I read for work" },
  { value: 'general', label: 'I just love reading' },
] as const;

const CONTENT_OPTIONS = [
  'Fiction and novels',
  'Non-fiction and essays',
  'Academic and course material',
  'Business and strategy books',
  'Philosophy and theory',
  'Mixed — a bit of everything',
] as const;

const READING_OPTIONS = [
  'I highlight and take notes',
  'I just read and try to remember',
  'I discuss it with others',
  'I use tools like Notion or Obsidian',
  "I don't have a system — that's the problem",
] as const;

const GOAL_OPTIONS = [
  'Understand what I read more deeply',
  'Remember more of what I read',
  'Organize my thoughts and ideas',
  'Prepare for exams or essays',
  'Read faster and more efficiently',
] as const;

function tierLabelFromUser(user: User | null): string {
  const t = user?.profileTier ?? 'bookworm';
  if (t === 'genesis') return 'Genesis (Lifetime Deal)';
  if (t === 'bibliophile') return 'Sage';
  return 'Bookworm';
}

function mapPersonaToUserType(persona: string): 'student' | 'casual' | 'researcher' {
  if (persona === 'student') return 'student';
  if (persona === 'professional') return 'researcher';
  return 'casual';
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, setUser } = useApp();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    displayName: user?.name?.trim() || '',
    persona: '',
    contentTypes: [] as string[],
    readingHabits: [] as string[],
    primaryGoal: '',
  });

  useEffect(() => {
    if (user?.name?.trim() && !data.displayName) {
      setData((d) => ({ ...d, displayName: user.name.trim() }));
    }
  }, [user?.name, data.displayName]);

  const persistAndFinish = useCallback(async () => {
    const v4: QuiloraOnboardingV4 = {
      version: 4,
      displayName: data.displayName.trim(),
      persona: data.persona,
      contentTypes: [...data.contentTypes],
      readingHabits: [...data.readingHabits],
      primaryGoal: data.primaryGoal,
    };
    try {
      localStorage.setItem('quiloraOnboarding', JSON.stringify(v4));
      localStorage.setItem('quiloraUserName', v4.displayName);
    } catch {
      /* ignore */
    }
    if (user) {
      await supabase
        .from('profiles')
        .update({
          full_name: v4.displayName,
          streak_goal: 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      setUser({
        ...user,
        name: v4.displayName,
        onboardingCompleted: true,
        userType: mapPersonaToUserType(data.persona),
      });
    }
    navigate('/dashboard');
  }, [user, setUser, navigate, data]);

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return data.displayName.trim().length > 0;
      case 2:
        return data.persona.length > 0;
      case 3:
        return data.contentTypes.length > 0;
      case 4:
        return data.readingHabits.length > 0;
      case 5:
        return data.primaryGoal.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
      return;
    }
    if (step === 5) {
      setStep(6);
    }
  };

  const toggleMulti = (field: 'contentTypes' | 'readingHabits', value: string) => {
    setData((d) => {
      const arr = d[field];
      const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
      return { ...d, [field]: next };
    });
  };

  const progressSteps = 6;
  const showProgress = step >= 1 && step <= 6;
  const progressIndex = step >= 6 ? 6 : step;

  return (
    <div className="relative flex min-h-screen flex-col" style={{ backgroundColor: '#0a1929', fontFamily: 'Inter, sans-serif' }}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#266ba7]/5 via-transparent to-transparent" />
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-6">
        <div className="relative w-full max-w-xl">
          <div className="mb-8 flex items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#266ba7] to-[#1e5a8f] shadow-lg">
              <BookOpen className="h-6 w-6 text-white" aria-hidden />
            </div>
            <span className="text-2xl font-semibold text-white">Quilora</span>
          </div>

          {showProgress ? (
            <div className="mb-8">
              <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-white/40">
                Step {step} of {progressSteps}
              </p>
              <div className="mb-3 flex items-center justify-between gap-1">
                {Array.from({ length: progressSteps }, (_, i) => i + 1).map((s) => (
                  <div key={s} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                        s <= progressIndex ? 'bg-[#266ba7] text-white shadow-md shadow-[#266ba7]/25' : 'bg-white/5 text-white/30'
                      }`}
                    >
                      {s < progressIndex ? <Check className="h-4 w-4" /> : s}
                    </div>
                    {s < progressSteps && (
                      <div className={`hidden h-0.5 w-full sm:block ${s < progressIndex ? 'bg-[#266ba7]' : 'bg-white/5'}`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#266ba7] to-[#3b82c4] transition-all duration-500 ease-out"
                  style={{ width: `${(progressIndex / progressSteps) * 100}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a2f45]/60 to-[#0a1929]/60 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
            {step === 1 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="mb-2 text-2xl font-semibold text-white sm:text-3xl">Welcome to Quilora.</h2>
                  <p className="text-sm text-white/55">Choose how we&apos;ll greet you in the product.</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">Display name</label>
                  <input
                    type="text"
                    value={data.displayName}
                    onChange={(e) => setData({ ...data, displayName: e.target.value })}
                    placeholder="Your name"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-white placeholder:text-white/30 transition-all focus:border-[#266ba7] focus:outline-none focus:ring-2 focus:ring-[#266ba7]/20"
                    autoFocus
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
                  <span className="text-white/45">Your plan: </span>
                  <span className="font-semibold text-[#7bbdf3]">{tierLabelFromUser(user)}</span>
                </div>
                {user?.profileTier === 'genesis' || user?.genesisBadge ? (
                  <div className="rounded-2xl border border-[#266ba7]/25 bg-[#266ba7]/10 px-4 py-3 text-sm text-white/80">
                    <p className="font-medium text-[#7bbdf3]">Genesis founding member</p>
                    <p className="mt-1 text-white/60">
                      Lifetime credits, badge, and member perks are attached to your account.
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="mb-2 text-2xl font-semibold text-white sm:text-3xl">First, tell us a little about yourself.</h2>
                  <p className="text-sm text-white/55">Pick one.</p>
                </div>
                <div className="space-y-2">
                  {PERSONA_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setData({ ...data, persona: o.value })}
                      className={`w-full rounded-2xl border px-4 py-3.5 text-left text-sm transition-all duration-200 sm:text-base ${
                        data.persona === o.value
                          ? 'border-[#266ba7] bg-[#266ba7] text-white shadow-lg shadow-[#266ba7]/25'
                          : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="mb-2 text-2xl font-semibold text-white sm:text-3xl">What kind of material do you usually read?</h2>
                  <p className="text-sm text-white/55">Pick all that apply.</p>
                </div>
                <div className="space-y-2">
                  {CONTENT_OPTIONS.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleMulti('contentTypes', label)}
                      className={`w-full rounded-2xl border px-4 py-3.5 text-left text-sm transition-all duration-200 sm:text-base ${
                        data.contentTypes.includes(label)
                          ? 'border-[#266ba7] bg-[#266ba7]/90 text-white shadow-md shadow-[#266ba7]/20'
                          : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="mb-2 text-2xl font-semibold text-white sm:text-3xl">How do you usually make sense of what you read?</h2>
                  <p className="text-sm text-white/55">Pick all that apply.</p>
                </div>
                <div className="space-y-2">
                  {READING_OPTIONS.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleMulti('readingHabits', label)}
                      className={`w-full rounded-2xl border px-4 py-3.5 text-left text-sm transition-all duration-200 sm:text-base ${
                        data.readingHabits.includes(label)
                          ? 'border-[#266ba7] bg-[#266ba7]/90 text-white shadow-md shadow-[#266ba7]/20'
                          : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="mb-2 text-2xl font-semibold text-white sm:text-3xl">What do you want Quilora to help you with most?</h2>
                  <p className="text-sm text-white/55">Pick one.</p>
                </div>
                <div className="space-y-2">
                  {GOAL_OPTIONS.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setData({ ...data, primaryGoal: label })}
                      className={`w-full rounded-2xl border px-4 py-3.5 text-left text-sm transition-all duration-200 sm:text-base ${
                        data.primaryGoal === label
                          ? 'border-[#266ba7] bg-[#266ba7] text-white shadow-lg shadow-[#266ba7]/25'
                          : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="animate-fade-in space-y-6 text-center">
                <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                  You&apos;re all set, {data.displayName.trim()}.
                </h2>
                <p className="text-base leading-relaxed text-white/60">
                  Your canvas is waiting. We&apos;ll let you know the moment Quilora goes live.
                </p>
                <p className="text-sm leading-relaxed text-white/45">
                  Your plan starts on launch day. If Quilora doesn&apos;t reach public launch (full canvas access for paid
                  users) within 90 days of your purchase, you&apos;ll receive a full refund automatically via Paddle.
                </p>
                {user?.profileTier === 'genesis' || user?.genesisBadge ? (
                  <p className="text-sm leading-relaxed text-white/45">
                    Changed your mind? Contact support before launch for a full refund. Your Genesis seat will be released
                    for others.
                  </p>
                ) : (
                  <p className="text-sm leading-relaxed text-white/45">
                    Changed your mind? You can cancel anytime before launch day from your account dashboard for a full
                    refund.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void persistAndFinish()}
                  className="mt-4 w-full rounded-full bg-[#266ba7] py-3.5 text-base font-semibold text-white shadow-lg shadow-[#266ba7]/25 transition-all duration-200 hover:bg-[#3b82c4] hover:shadow-xl"
                >
                  Go to My Account
                </button>
              </div>
            )}

            {step <= 5 ? (
              <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="rounded-full px-5 py-2.5 text-sm text-white/70 transition-all hover:bg-white/5 hover:text-white"
                  >
                    Back
                  </button>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  onClick={() => void handleNext()}
                  disabled={!canProceed()}
                  className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-200 sm:text-base ${
                    canProceed()
                      ? 'bg-[#266ba7] text-white shadow-lg hover:-translate-y-0.5 hover:bg-[#3b82c4] hover:shadow-xl hover:shadow-[#266ba7]/30'
                      : 'cursor-not-allowed bg-white/5 text-white/30'
                  }`}
                >
                  {step === 5 ? 'Finish' : 'Continue'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
