import { ReactNode } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { getThemeColors } from '../lib/theme';

interface SimpleLayoutProps {
  children: ReactNode;
}

export function SimpleLayout({ children }: SimpleLayoutProps) {
  const navigate = useNavigate();
  const { theme } = useApp();
  const colors = getThemeColors(theme);

  return (
    <div 
      className="min-h-screen transition-colors duration-500"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {/* Simple Navbar */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-all duration-300"
        style={{
          borderBottom: `1px solid ${colors.borderLight}`,
          backgroundColor: theme === 'dark' ? 'rgba(10, 25, 41, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 ml-2">
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300"
                style={{
                  background: `linear-gradient(to bottom right, ${colors.accent}, ${colors.accentDark})`
                }}
              >
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold transition-colors duration-300" style={{ color: colors.text }}>
                Quilora
              </span>
            </div>

            {/* Back Button */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 transition-all duration-200 hover:opacity-100"
              style={{ color: colors.textSecondary, opacity: 0.7 }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {children}

      {/* Footer */}
      <footer 
        className="py-12 px-6 mt-20 transition-all duration-300"
        style={{ borderTop: `1px solid ${colors.border}` }}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-6 text-sm">
              <a 
                href="/about" 
                className="transition-colors duration-200"
                style={{ color: colors.textTertiary }}
                onMouseEnter={(e) => e.currentTarget.style.color = colors.accent}
                onMouseLeave={(e) => e.currentTarget.style.color = colors.textTertiary}
              >
                About
              </a>
              <a 
                href="/contact" 
                className="transition-colors duration-200"
                style={{ color: colors.textTertiary }}
                onMouseEnter={(e) => e.currentTarget.style.color = colors.accent}
                onMouseLeave={(e) => e.currentTarget.style.color = colors.textTertiary}
              >
                Contact
              </a>
              <a 
                href="/privacy" 
                className="transition-colors duration-200"
                style={{ color: colors.textTertiary }}
                onMouseEnter={(e) => e.currentTarget.style.color = colors.accent}
                onMouseLeave={(e) => e.currentTarget.style.color = colors.textTertiary}
              >
                Privacy Policy
              </a>
              <a 
                href="/terms" 
                className="transition-colors duration-200"
                style={{ color: colors.textTertiary }}
                onMouseEnter={(e) => e.currentTarget.style.color = colors.accent}
                onMouseLeave={(e) => e.currentTarget.style.color = colors.textTertiary}
              >
                Terms of Service
              </a>
              <a 
                href="/payments" 
                className="transition-colors duration-200"
                style={{ color: colors.textTertiary }}
                onMouseEnter={(e) => e.currentTarget.style.color = colors.accent}
                onMouseLeave={(e) => e.currentTarget.style.color = colors.textTertiary}
              >
                Payments
              </a>
            </div>
            <p className="text-sm transition-colors duration-300 md:text-right" style={{ color: colors.textTertiary }}>
              © 2026 Quilora. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
