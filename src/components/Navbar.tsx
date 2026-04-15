import { Link } from 'react-router';
import { useApp } from '../context/AppContext';
import { t } from '../lib/translations';
import { Globe, User } from 'lucide-react';
import { useState } from 'react';
import QuiloraLogo from '../assets/logo.png';

export function Navbar() {
  const { user, language, setLanguage } = useApp();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const languages = [
    { code: 'en' as const, label: 'English' },
    { code: 'bs' as const, label: 'Bosanski' },
    { code: 'es' as const, label: 'Español' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0F18]/80 backdrop-blur-xl border-b border-[#00CFFF]/10">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img
              src={QuiloraLogo}
              alt="Quilora logo"
              className="h-8 w-auto"
            />
            <span
              className="text-xl font-bold text-[#00CFFF]"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              QuoteQuest AI
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-[#E6F0FF]/70 hover:text-[#00CFFF] transition-colors duration-150"
                >
                  {t('nav.dashboard', language)}
                </Link>
                <Link
                  to="/pdfs"
                  className="text-[#E6F0FF]/70 hover:text-[#00CFFF] transition-colors duration-150"
                >
                  {t('dashboard.myPdfs', language)}
                </Link>
                <Link
                  to="/saved"
                  className="text-[#E6F0FF]/70 hover:text-[#00CFFF] transition-colors duration-150"
                >
                  {t('dashboard.savedOutputs', language)}
                </Link>
              </>
            ) : (
              <>
                <a
                  href="#features"
                  className="text-[#E6F0FF]/70 hover:text-[#00CFFF] transition-colors duration-150"
                >
                  {t('nav.features', language)}
                </a>
                <a
                  href="#pricing"
                  className="text-[#E6F0FF]/70 hover:text-[#00CFFF] transition-colors duration-150"
                >
                  {t('nav.pricing', language)}
                </a>
              </>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-[#04245A]/40 border border-[#00CFFF]/20 
                           hover:border-[#00CFFF]/50 transition-all duration-150"
              >
                <Globe className="w-4 h-4 text-[#00CFFF]" />
                <span className="text-sm text-[#E6F0FF]">{language.toUpperCase()}</span>
              </button>

              {showLangMenu && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-[#04245A] border border-[#00CFFF]/30 rounded-xl overflow-hidden shadow-xl">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors duration-150 ${
                        language === lang.code
                          ? 'bg-[#00CFFF]/20 text-[#00CFFF]'
                          : 'text-[#E6F0FF] hover:bg-[#00CFFF]/10'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <>
                {/* User Menu */}
                <Link
                  to="/settings"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#04245A]/40 border border-[#00CFFF]/20 
                             hover:border-[#00CFFF]/50 transition-all duration-150"
                >
                  <User className="w-4 h-4 text-[#00CFFF]" />
                  <span className="text-sm text-[#E6F0FF] hidden lg:block">{user.name}</span>
                </Link>

                {/* Subscription Badge */}
                <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#00CFFF]/20 to-[#04245A]/40 border border-[#00CFFF]/30">
                  <span
                    className="text-xs text-[#00CFFF] uppercase font-bold"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    {user.subscriptionTier}
                  </span>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/auth?mode=login"
                  className="px-4 py-2 text-[#E6F0FF] hover:text-[#00CFFF] transition-colors duration-150"
                >
                  {t('nav.login', language)}
                </Link>
                <Link
                  to="/auth?mode=signup"
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#00CFFF] to-[#0090FF] text-[#0A0F18] font-bold
                             hover:shadow-[0_0_20px_rgba(0,207,255,0.4)] transition-all duration-150"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {t('nav.signup', language)}
                </Link>
              </>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}