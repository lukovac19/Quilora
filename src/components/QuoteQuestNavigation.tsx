import { BookOpen, Bookmark, LogIn, LogOut, User, Zap, Settings } from 'lucide-react';
import { useState } from 'react';

interface QuoteQuestNavigationProps {
  onOpenSavedQuotes: () => void;
  currentUser: any | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenAccount?: () => void;
  onOpenDashboard?: () => void;
}

const QUESTIONS_LIMIT = 5;

export function QuoteQuestNavigation({ onOpenSavedQuotes, currentUser, onLogin, onLogout, onOpenAccount, onOpenDashboard }: QuoteQuestNavigationProps) {
  const [activeLink, setActiveLink] = useState('home');

  const questionsRemaining = currentUser && !currentUser.isPremium 
    ? Math.max(0, QUESTIONS_LIMIT - currentUser.questionsAsked)
    : null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/[0.03]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00D1FF] to-[#0FB2FF] flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#0A0A0A]" />
            </div>
            <span className="text-[#E6F0FF] text-xl" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Quote<span className="text-[#00D1FF]">Quest</span>
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#home"
                onClick={() => setActiveLink('home')}
                className={`relative text-[#E6F0FF]/70 hover:text-[#00D1FF] transition-all duration-300 ${
                  activeLink === 'home' ? 'text-[#00D1FF]' : ''
                }`}
                style={{
                  textShadow: activeLink === 'home' ? '0 0 20px rgba(0, 209, 255, 0.5)' : 'none'
                }}
              >
                Početna
                {activeLink === 'home' && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#00D1FF]" 
                    style={{ boxShadow: '0 0 10px rgba(0, 209, 255, 0.8)' }}
                  />
                )}
              </a>
              <a
                href="#features"
                onClick={() => setActiveLink('features')}
                className={`relative text-[#E6F0FF]/70 hover:text-[#00D1FF] transition-all duration-300 ${
                  activeLink === 'features' ? 'text-[#00D1FF]' : ''
                }`}
                style={{
                  textShadow: activeLink === 'features' ? '0 0 20px rgba(0, 209, 255, 0.5)' : 'none'
                }}
              >
                Mogućnosti
                {activeLink === 'features' && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#00D1FF]"
                    style={{ boxShadow: '0 0 10px rgba(0, 209, 255, 0.8)' }}
                  />
                )}
              </a>
              <a
                href="#about"
                onClick={() => setActiveLink('about')}
                className={`relative text-[#E6F0FF]/70 hover:text-[#00D1FF] transition-all duration-300 ${
                  activeLink === 'about' ? 'text-[#00D1FF]' : ''
                }`}
                style={{
                  textShadow: activeLink === 'about' ? '0 0 20px rgba(0, 209, 255, 0.5)' : 'none'
                }}
              >
                O nama
                {activeLink === 'about' && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#00D1FF]"
                    style={{ boxShadow: '0 0 10px rgba(0, 209, 255, 0.8)' }}
                  />
                )}
              </a>

              {/* Dashboard Link - Only show if user is logged in */}
              {currentUser && onOpenDashboard && (
                <button
                  onClick={onOpenDashboard}
                  className="relative text-[#E6F0FF]/70 hover:text-[#00D1FF] transition-all duration-300"
                >
                  Dashboard
                </button>
              )}
            </div>
            
            <button
              onClick={onOpenSavedQuotes}
              className="flex items-center gap-2 text-[#E6F0FF]/70 hover:text-[#00D1FF] transition-all duration-300 hover:scale-105"
            >
              <Bookmark className="w-5 h-5" />
              <span className="hidden sm:inline">Moji citati</span>
            </button>

            {/* Auth Button */}
            {currentUser ? (
              <div className="flex items-center gap-3">
                {/* Questions Counter for Free Users */}
                {!currentUser.isPremium && questionsRemaining !== null && (
                  <div className={`hidden sm:flex items-center gap-2 bg-[#001F54]/50 border rounded-full px-3 py-1.5 ${
                    questionsRemaining <= 2 
                      ? 'border-orange-500/50 animate-pulse' 
                      : 'border-[#00D1FF]/30'
                  }`}>
                    <Zap className={`w-4 h-4 ${questionsRemaining <= 2 ? 'text-orange-400' : 'text-[#00D1FF]'}`} />
                    <span className={`text-sm ${questionsRemaining <= 2 ? 'text-orange-300' : 'text-[#E6F0FF]'}`}>
                      {questionsRemaining}/{QUESTIONS_LIMIT}
                    </span>
                  </div>
                )}

                <button
                  onClick={onOpenAccount}
                  className="hidden sm:flex items-center gap-2 bg-[#001F54]/50 border border-[#00D1FF]/30 rounded-full px-3 py-1.5 hover:bg-[#001F54]/70 hover:border-[#00D1FF]/50 transition-all"
                >
                  <User className="w-4 h-4 text-[#00D1FF]" />
                  <span className="text-[#E6F0FF] text-sm">{currentUser.name}</span>
                  {currentUser.isPremium && (
                    <span className="bg-[#00D1FF] text-[#0A0A0A] text-xs px-2 py-0.5 rounded-full">PRO</span>
                  )}
                </button>

                {/* Mobile Account Button */}
                <button
                  onClick={onOpenAccount}
                  className="sm:hidden flex items-center gap-2 text-[#E6F0FF]/70 hover:text-[#00D1FF] transition-all duration-300"
                >
                  <Settings className="w-5 h-5" />
                </button>

                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 text-[#E6F0FF]/70 hover:text-[#00D1FF] transition-all duration-300 hover:scale-105"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-2 bg-gradient-to-r from-[#001F54] to-[#003A8C] hover:from-[#003A8C] hover:to-[#001F54] border border-[#00D1FF]/50 px-4 py-2 rounded-lg text-[#E6F0FF] transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,209,255,0.3)]"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Prijavi se</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}