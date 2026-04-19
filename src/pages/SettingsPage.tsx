import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  User,
  Mail,
  Globe,
  Bell,
  Shield,
  LogOut,
  Trash2,
  Save,
  Check,
  AlertTriangle,
  ArrowLeft,
  Camera,
  Award,
  Lock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { updateProfileDisplayName } from '../lib/profileClientUpdate';
import { QuiloraSiteFooter } from '../components/QuiloraSiteFooter';

function weakPasswordMsg(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (!/[a-z]/.test(password)) return 'Add at least one lowercase letter.';
  if (!/[A-Z]/.test(password)) return 'Add at least one uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Add at least one number.';
  return null;
}

const TIER_LABEL: Record<string, string> = {
  bookworm: 'Bookworm',
  bibliophile: 'Bibliophile',
  genesis: 'Genesis',
};

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, setUser, refreshAuthUser, language, setLanguage } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [draftLang, setDraftLang] = useState(language);
  const [emailProductTips, setEmailProductTips] = useState(true);
  const [emailStudyReminders, setEmailStudyReminders] = useState(true);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdBusy, setPwdBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftLang(language);
  }, [language]);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setEmail(user.email);
    setEmailProductTips(user.emailProductTips !== false);
    setEmailStudyReminders(user.emailStudyReminders !== false);
  }, [user]);

  const persistEmailPrefs = async (tips: boolean, reminders: boolean) => {
    if (!user) return;
    const { error } = await supabase.auth.updateUser({
      data: {
        email_product_tips: tips,
        email_study_reminders: reminders,
      },
    });
    if (!error) {
      setUser({ ...user, emailProductTips: tips, emailStudyReminders: reminders });
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const r = await updateProfileDisplayName(user.id, name);
      if (!r.ok) throw new Error(r.message ?? 'Profile update failed');
      await supabase.auth.updateUser({ data: { name: name.trim() } });
      setLanguage(draftLang);
      setUser({ ...user, name: name.trim() || user.name });
      localStorage.setItem('quiloraUserName', name.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaved(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      return;
    }
    setAvatarBusy(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${user.id}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = pub.publicUrl;
      const { error: dbErr } = await supabase.from('profiles').update({ avatar_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', user.id);
      if (dbErr) throw dbErr;
      setUser({ ...user, avatarUrl: publicUrl });
      await refreshAuthUser();
    } catch {
      /* ignore */
    } finally {
      setAvatarBusy(false);
      e.target.value = '';
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    setPwdError('');
    setPwdSuccess(false);
    if (newPassword !== confirmNewPassword) {
      setPwdError('New passwords do not match.');
      return;
    }
    const weak = weakPasswordMsg(newPassword);
    if (weak) {
      setPwdError(weak);
      return;
    }
    setPwdBusy(true);
    try {
      const { error: reErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (reErr) {
        setPwdError('Current password is incorrect.');
        return;
      }
      const { error: upErr } = await supabase.auth.updateUser({ password: newPassword });
      if (upErr) {
        setPwdError(upErr.message);
        return;
      }
      setPwdSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPwdSuccess(false), 4000);
    } finally {
      setPwdBusy(false);
    }
  };

  const handleLogout = () => {
    void logout();
    localStorage.removeItem('quiloraOnboarding');
    localStorage.removeItem('quiloraUserName');
    navigate('/');
  };

  const handleDeleteAccount = () => {
    void logout();
    localStorage.clear();
    navigate('/');
  };

  const tierKey = user?.profileTier ?? 'bookworm';
  const tierLabel = TIER_LABEL[tierKey] ?? 'Bookworm';
  const credits = user?.creditBalance ?? 0;

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#0a1929', fontFamily: 'Inter, sans-serif' }}>
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#266ba7]/5 via-transparent to-[#266ba7]/5" />

      <main className="relative flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a1929]/90 backdrop-blur-xl">
          <div className="px-6 py-5">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70 transition-all hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-white">Settings</h1>
                <p className="mt-0.5 text-sm text-white/50">Manage your account and preferences</p>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-4xl space-y-6 p-6">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a2f45]/40 to-[#0a1929]/40 p-6 backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#266ba7]/10">
                <User className="h-5 w-5 text-[#266ba7]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Profile</h2>
                <p className="text-xs text-white/50">Avatar, tier, credits, and display name</p>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-6">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-white/35" />
                  )}
                </div>
                {user?.genesisBadge && (
                  <div
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl border border-amber-400/40 bg-[#0a1929] text-amber-300 shadow-lg"
                    title="Genesis"
                  >
                    <Award className="h-4 w-4" />
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => void handleAvatarChange(e)} />
                <button
                  type="button"
                  disabled={avatarBusy || !user}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 disabled:opacity-50"
                >
                  <Camera className="h-3.5 w-3.5" />
                  {avatarBusy ? 'Uploading…' : 'Change photo'}
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-2 text-sm text-white/70">
                <p>
                  <span className="text-white/40">Plan tier</span>{' '}
                  <span className="font-semibold text-white">{tierLabel}</span>
                </p>
                <p>
                  <span className="text-white/40">Credits</span>{' '}
                  <span className="font-semibold text-[#7bbdf3]">{credits}</span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70" htmlFor="settings-name">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    id="settings-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/30 transition-all focus:border-[#266ba7]/50 focus:outline-none focus:ring-2 focus:ring-[#266ba7]/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/70" htmlFor="settings-email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    id="settings-email"
                    type="email"
                    value={email}
                    readOnly
                    disabled
                    className="w-full cursor-not-allowed rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white/50"
                  />
                </div>
                <p className="mt-1 text-xs text-white/35">Email changes are not available here.</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/70" htmlFor="settings-lang">
                  Language
                </label>
                <div className="relative">
                  <Globe className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <select
                    id="settings-lang"
                    value={draftLang}
                    onChange={(e) => setDraftLang(e.target.value as typeof language)}
                    className="w-full cursor-pointer appearance-none rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white transition-all focus:border-[#266ba7]/50 focus:outline-none focus:ring-2 focus:ring-[#266ba7]/20"
                  >
                    <option value="en" className="bg-[#1a2f45] text-white">
                      English
                    </option>
                    <option value="bs" className="bg-[#1a2f45] text-white">
                      Bosanski
                    </option>
                    <option value="es" className="bg-[#1a2f45] text-white">
                      Español
                    </option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleSaveProfile()}
                className="flex items-center gap-2 rounded-2xl bg-[#266ba7] px-6 py-3 font-medium text-white shadow-lg transition-all duration-300 hover:bg-[#3b82c4] hover:shadow-xl hover:shadow-[#266ba7]/40"
              >
                {saved ? (
                  <>
                    <Check className="h-4 w-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a2f45]/40 to-[#0a1929]/40 p-6 backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#266ba7]/10">
                <Shield className="h-5 w-5 text-[#266ba7]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Security</h2>
                <p className="text-xs text-white/50">Change your password</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70" htmlFor="cur-pw">
                  Current password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    id="cur-pw"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:border-[#266ba7]/50 focus:outline-none focus:ring-2 focus:ring-[#266ba7]/20"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70" htmlFor="new-pw">
                  New password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    id="new-pw"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:border-[#266ba7]/50 focus:outline-none focus:ring-2 focus:ring-[#266ba7]/20"
                    placeholder="At least 8 characters, mixed case + number"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70" htmlFor="new-pw2">
                  Confirm new password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    id="new-pw2"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:border-[#266ba7]/50 focus:outline-none focus:ring-2 focus:ring-[#266ba7]/20"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>
              {pwdError && <p className="text-sm text-red-400">{pwdError}</p>}
              {pwdSuccess && <p className="text-sm text-emerald-400">Password updated.</p>}
              <button
                id="change-password-btn"
                type="button"
                disabled={pwdBusy}
                onClick={() => void handleChangePassword()}
                className="rounded-2xl bg-white/10 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-50"
              >
                {pwdBusy ? 'Updating…' : 'Change password'}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a2f45]/40 to-[#0a1929]/40 p-6 backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#266ba7]/10">
                <Bell className="h-5 w-5 text-[#266ba7]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Notifications</h2>
                <p className="text-xs text-white/50">Stored on your account (email preferences)</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4">
                <div>
                  <p className="text-sm font-medium text-white">Product tips &amp; updates</p>
                  <p className="mt-1 text-xs text-white/50">Occasional product news and tips by email</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !emailProductTips;
                    setEmailProductTips(next);
                    void persistEmailPrefs(next, emailStudyReminders);
                  }}
                  className={`relative h-6 w-12 rounded-full transition-colors ${emailProductTips ? 'bg-[#266ba7]' : 'bg-white/20'}`}
                >
                  <div
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                      emailProductTips ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4">
                <div>
                  <p className="text-sm font-medium text-white">Study reminders</p>
                  <p className="mt-1 text-xs text-white/50">Gentle nudges to keep your reading streak</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !emailStudyReminders;
                    setEmailStudyReminders(next);
                    void persistEmailPrefs(emailProductTips, next);
                  }}
                  className={`relative h-6 w-12 rounded-full transition-colors ${emailStudyReminders ? 'bg-[#266ba7]' : 'bg-white/20'}`}
                >
                  <div
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                      emailStudyReminders ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a2f45]/40 to-[#0a1929]/40 p-6 backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#266ba7]/10">
                <Shield className="h-5 w-5 text-[#266ba7]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Account</h2>
                <p className="text-xs text-white/50">Manage your account settings</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleLogout}
                className="group flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-white/20 hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="h-5 w-5 text-white/60 transition-colors group-hover:text-white" />
                  <div>
                    <p className="text-sm font-medium text-white">Logout</p>
                    <p className="text-xs text-white/50">Sign out of your account</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="group flex w-full items-center justify-between rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-left transition-all hover:border-red-500/30 hover:bg-red-500/20"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Delete Account</p>
                    <p className="text-xs text-red-400/70">Permanently remove your account and data</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      <QuiloraSiteFooter />

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="animate-scale-in mx-4 w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a2f45]/95 to-[#0a1929]/95 p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Account?</h3>
                <p className="text-xs text-white/50">This action cannot be undone</p>
              </div>
            </div>

            <p className="mb-6 text-sm text-white/70">
              All your PDFs, study sessions, saved insights, and account data will be permanently deleted. Are you sure you want to continue?
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white transition-all hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="flex-1 rounded-2xl bg-red-500 px-4 py-3 font-medium text-white transition hover:bg-red-600"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
