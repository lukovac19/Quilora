import { Link, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useTranslation, t } from '../lib/translations';
import { ChevronDown, User, LogOut, Settings, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { getThemeColors } from '../lib/theme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

type ModernNavbarProps = {
  /** Match landing / auth: navy bar with dark theme tokens regardless of global theme. */
  appearance?: 'default' | 'landingDark';
  /** Same center links as Quilora landing; hides language selector (use on auth). */
  variant?: 'default' | 'auth';
};

export function ModernNavbar({ appearance = 'default', variant = 'default' }: ModernNavbarProps) {
  const { user, language, setLanguage, theme } = useApp();
  const { t: translate } = useTranslation();
  const navigate = useNavigate();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const isAuthNav = variant === 'auth';

  const effectiveTheme = appearance === 'landingDark' ? 'dark' : theme;
  const colors = getThemeColors(effectiveTheme);

  const languages = [
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
    { code: 'bs' as const, name: 'Bosanski', flag: '🇧🇦' },
    { code: 'es' as const, name: 'Español', flag: '🇪🇸' },
  ];

  const currentLang = languages.find((l) => l.code === language);

  const handleLogout = () => {
    setLanguage(language);
    localStorage.removeItem('qq_user');
    localStorage.removeItem('qq_access_token');
    navigate('/');
  };

  const getPlanBadgeColor = (tier: string) => {
    switch (tier) {
      case 'blitz':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'normal':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'hardquest':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'lifetime':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getPlanName = (tier: string) => {
    const map: Record<string, string> = {
      bookworm: 'normal',
      bibliophile: 'hardquest',
      genesis: 'lifetime',
      blitz: 'blitz',
      normal: 'normal',
      hardquest: 'hardquest',
      lifetime: 'lifetime',
    };
    const pricingKey = map[tier] ?? 'normal';
    return t(`pricing.${pricingKey}.name`, language);
  };

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl animate-fade-in transition-all duration-300"
      style={{
        borderBottom: `1px solid ${appearance === 'landingDark' ? 'rgba(0, 207, 255, 0.12)' : colors.borderLight}`,
        backgroundColor: appearance === 'landingDark' ? 'rgba(10, 25, 41, 0.86)' : effectiveTheme === 'dark' ? 'rgba(10, 25, 41, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      }}
    >
      <div className={`container mx-auto px-6 py-4 ${isAuthNav ? 'max-w-7xl' : ''}`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className={`group ml-2 flex items-center gap-3 ${isAuthNav ? 'shrink-0' : 'min-w-0 shrink-0 md:min-w-0'}`}>
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center group-hover:shadow-lg transition-all duration-200"
              style={{
                background: `linear-gradient(to bottom right, ${colors.accent}, ${colors.accentDark})`
              }}
            >
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span 
              className="text-2xl font-bold transition-colors duration-300"
              style={{ color: colors.text }}
            >
              Quilora
            </span>
          </Link>

          {isAuthNav && (
            <nav
              className="flex min-w-0 flex-1 justify-center overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] md:px-2 [&::-webkit-scrollbar]:hidden"
              aria-label="Marketing pages"
            >
              <div className="flex shrink-0 items-center gap-4 sm:gap-6 md:gap-8">
                <Link to="/features" className="whitespace-nowrap text-base text-white/70 transition-colors duration-200 hover:text-white">
                  Features
                </Link>
                <Link to="/how-it-works" className="whitespace-nowrap text-base text-white/70 transition-colors duration-200 hover:text-white">
                  How it Works
                </Link>
                <Link to="/pricing" className="whitespace-nowrap text-base text-white/70 transition-colors duration-200 hover:text-white">
                  Pricing
                </Link>
                <Link to="/faq" className="whitespace-nowrap text-base text-white/70 transition-colors duration-200 hover:text-white">
                  FAQ
                </Link>
              </div>
            </nav>
          )}

          {!isAuthNav && (
            <nav
              className="hidden min-w-0 flex-1 justify-center overflow-x-auto px-2 [-ms-overflow-style:none] [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden"
              aria-label="Marketing pages"
            >
              <div className="flex shrink-0 items-center gap-8">
                <Link
                  to="/features"
                  className="whitespace-nowrap text-base transition-colors duration-200 hover:text-white"
                  style={{ color: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary }}
                >
                  Features
                </Link>
                <Link
                  to="/how-it-works"
                  className="whitespace-nowrap text-base transition-colors duration-200 hover:text-white"
                  style={{ color: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary }}
                >
                  How it Works
                </Link>
                <Link
                  to="/pricing"
                  className="whitespace-nowrap text-base transition-colors duration-200 hover:text-white"
                  style={{ color: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary }}
                >
                  Pricing
                </Link>
                <Link
                  to="/faq"
                  className="whitespace-nowrap text-base transition-colors duration-200 hover:text-white"
                  style={{ color: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary }}
                >
                  FAQ
                </Link>
              </div>
            </nav>
          )}

          {/* Right Side */}
          <div className={`flex items-center gap-2 sm:gap-4 ${isAuthNav ? 'shrink-0 justify-end' : ''}`}>
            {/* Language Selector */}
            {!isAuthNav && (
            <DropdownMenu open={langMenuOpen} onOpenChange={setLangMenuOpen}>
              <DropdownMenuTrigger 
                className="flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-200"
                style={{
                  backgroundColor: effectiveTheme === 'dark' ? 'rgba(26, 47, 69, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                  border: `1px solid ${colors.borderLight}`,
                  color: colors.text,
                }}
              >
                <span className="text-xl">{currentLang?.flag}</span>
                <span className="text-sm">{currentLang?.name}</span>
                <ChevronDown className="w-4 h-4" style={{ color: colors.accent }} />
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="dropdown-enter"
                style={{
                  backgroundColor: effectiveTheme === 'dark' ? '#1a2f45' : '#ffffff',
                  border: `1px solid ${colors.borderLight}`,
                }}
              >
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setLangMenuOpen(false);
                    }}
                    className="cursor-pointer transition-all duration-150"
                    style={{
                      color: colors.text,
                    }}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            )}

            {/* User Menu or Auth Buttons (hide account chrome on auth pages — cleaner login/signup) */}
            {user && !isAuthNav ? (
              <div className="flex items-center gap-3">
                {/* Plan Badge */}
                <div
                  className={`px-3 py-1 rounded-xl border text-xs font-medium ${getPlanBadgeColor(
                    user.subscriptionTier
                  )}`}
                >
                  {getPlanName(user.subscriptionTier)}
                </div>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger 
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-200"
                    style={{
                      backgroundColor: effectiveTheme === 'dark' ? 'rgba(26, 47, 69, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                      border: `1px solid ${colors.borderLight}`,
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(to bottom right, ${colors.accent}, ${colors.accentDark})`
                      }}
                    >
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm" style={{ color: colors.text }}>{user.name}</span>
                    <ChevronDown className="w-4 h-4" style={{ color: colors.accent }} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="dropdown-enter"
                    style={{
                      backgroundColor: effectiveTheme === 'dark' ? '#1a2f45' : '#ffffff',
                      border: `1px solid ${colors.borderLight}`,
                    }}
                  >
                    <DropdownMenuItem
                      onClick={() => navigate('/dashboard')}
                      className="cursor-pointer transition-all duration-150"
                      style={{ color: colors.text }}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      {translate('nav.dashboard')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate('/settings')}
                      className="cursor-pointer transition-all duration-150"
                      style={{ color: colors.text }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {translate('settings.title')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator style={{ backgroundColor: colors.borderLight }} />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-400 hover:bg-red-500/20 cursor-pointer transition-all duration-150"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {translate('nav.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : !user ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/auth?mode=login')}
                  className={`rounded-2xl transition-colors duration-200 ${isAuthNav ? 'px-2 py-2 text-sm text-white/70 hover:text-white' : 'px-5 py-2'}`}
                  style={
                    isAuthNav
                      ? undefined
                      : {
                          color: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(10, 25, 41, 0.7)',
                        }
                  }
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/auth?mode=signup')}
                  className={`rounded-full font-medium transition-all duration-200 hover:shadow-lg ${isAuthNav ? 'bg-[#266ba7] px-6 py-2.5 text-sm text-white hover:bg-[#3b82c4] hover:shadow-[#266ba7]/30 hover:-translate-y-0.5' : 'px-6 py-2 rounded-2xl text-white'}`}
                  style={
                    isAuthNav
                      ? undefined
                      : {
                          background: `linear-gradient(to right, ${colors.accent}, ${colors.accentLight})`,
                          boxShadow: `0 0 20px ${colors.accent}30`,
                        }
                  }
                >
                  Get Started
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}