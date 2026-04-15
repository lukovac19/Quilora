import { Link, useLocation, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../lib/translations';
import { 
  LayoutDashboard, 
  FileText, 
  Save, 
  Settings, 
  Zap,
  LogOut,
  BookOpen,
  Home
} from 'lucide-react';

export function Sidebar() {
  const { user, setUser } = useApp();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  const menuItems = [
    {
      label: t('sidebar.dashboard'),
      icon: LayoutDashboard,
      path: '/dashboard',
    },
    {
      label: t('sidebar.studySessions'),
      icon: BookOpen,
      path: '/session',
    },
    {
      label: t('sidebar.myPdfs'),
      icon: FileText,
      path: '/pdfs',
    },
    {
      label: t('sidebar.savedOutputs'),
      icon: Save,
      path: '/saved',
    },
    {
      label: t('sidebar.settings'),
      icon: Settings,
      path: '/settings',
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex-col bg-[#04245A]/40 border-r border-[#00CFFF]/10 backdrop-blur-xl z-50 animate-fade-in">
        <div className="flex flex-col flex-1 p-6">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 mb-8 group">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00CFFF] to-[#0090FF] rounded-xl flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(0,207,255,0.4)] transition-all duration-200">
              <span className="text-[#0A0F18] font-bold text-lg" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Q
              </span>
            </div>
            <span className="text-lg font-bold text-[#00CFFF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              QuoteQuest AI
            </span>
          </Link>

          {/* User Info */}
          <div className="bg-[#04245A]/60 border border-[#00CFFF]/20 rounded-2xl p-4 mb-6 card-hover">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00CFFF] to-[#0090FF] flex items-center justify-center">
                <span className="text-[#0A0F18] font-bold">
                  {user?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#E6F0FF] truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-[#E6F0FF]/60 truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#00CFFF]/10">
              <span className="text-xs text-[#E6F0FF]/60">{t('sidebar.currentPlan')}</span>
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3 text-[#00CFFF]" />
                <span className="text-xs text-[#00CFFF] font-bold uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {user?.subscriptionTier}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || 
                             (item.path === '/session' && location.pathname.startsWith('/session'));
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 sidebar-item
                    ${isActive 
                      ? 'bg-[#00CFFF]/20 text-[#00CFFF] border border-[#00CFFF]/30 shadow-[0_0_15px_rgba(0,207,255,0.15)]' 
                      : 'text-[#E6F0FF]/70 hover:bg-[#04245A]/60 hover:text-[#00CFFF] border border-transparent'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="space-y-2 pt-6 border-t border-[#00CFFF]/10">
            <Link
              to="/"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-[#E6F0FF]/70 
                       hover:bg-[#04245A]/60 hover:text-[#00CFFF] transition-all duration-200 sidebar-item"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">{t('nav.home')}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-[#E6F0FF]/70 
                       hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#04245A]/40 backdrop-blur-xl border-b border-[#00CFFF]/10 animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-gradient-to-br from-[#00CFFF] to-[#0090FF] rounded-lg flex items-center justify-center">
              <span className="text-[#0A0F18] font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Q
              </span>
            </div>
            <span className="text-lg font-bold text-[#00CFFF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              QuoteQuest AI
            </span>
          </Link>

          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 rounded-lg bg-[#00CFFF]/20 border border-[#00CFFF]/30">
              <span className="text-xs text-[#00CFFF] font-bold uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {user?.subscriptionTier}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#04245A]/60 backdrop-blur-xl border-t border-[#00CFFF]/10 px-4 py-2">
          <div className="flex items-center justify-around">
            {menuItems.slice(0, 5).map((item) => {
              const isActive = location.pathname === item.path || 
                             (item.path === '/session' && location.pathname.startsWith('/session'));
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all duration-200
                    ${isActive ? 'text-[#00CFFF]' : 'text-[#E6F0FF]/60'}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.label.split(' ')[0]}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}