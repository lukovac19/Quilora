import { Home, FileText, Bookmark, Sparkles, Settings } from 'lucide-react';

export function DashboardFrame2() {
  return (
    <div className="min-h-screen bg-[#0a1929] flex">
      {/* Left Sidebar - Keep exactly as exists */}
      <aside className="w-72 border-r border-white/5">
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#266ba7]/90 text-white shadow-lg shadow-[#266ba7]/20 transition-all">
              <Home className="w-5 h-5 text-white" />
              <span className="font-medium text-sm">Dashboard</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 transition-all">
              <FileText className="w-5 h-5" />
              <span className="font-medium text-sm">PDFs</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 transition-all">
              <Bookmark className="w-5 h-5" />
              <span className="font-medium text-sm">Saved Insights</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 transition-all">
              <Settings className="w-5 h-5" />
              <span className="font-medium text-sm">Settings</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#266ba7]/10 to-transparent text-[#266ba7] hover:from-[#266ba7]/20 transition-all">
              <Sparkles className="w-5 h-5 text-[#266ba7]" />
              <span className="font-medium text-sm">Upgrade</span>
              <Sparkles className="w-4 h-4 ml-auto text-[#266ba7]" />
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content Area - Completely rebuilt */}
      <main className="flex-1 flex flex-col">
        {/* Top Greeting Block */}
        <div className="px-8 py-6 border-b border-white/10">
          <h1 className="text-3xl font-bold text-white">Hi, Emma</h1>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="w-full h-full border-2 border-white/20 rounded-3xl bg-gradient-to-br from-[#1a2f45]/30 to-[#0a1929]/30 p-8">
            {/* Three Sandbox Cards */}
            <div className="flex gap-6">
              <div className="w-64 h-80 rounded-3xl bg-[#266ba7] flex items-center justify-center">
                <span className="text-white font-semibold text-lg">Sandbox 1</span>
              </div>
              <div className="w-64 h-80 rounded-3xl bg-[#22c55e] flex items-center justify-center">
                <span className="text-white font-semibold text-lg">Sandbox 2</span>
              </div>
              <div className="w-64 h-80 rounded-3xl bg-[#eab308] flex items-center justify-center">
                <span className="text-white font-semibold text-lg">Sandbox 3</span>
              </div>
            </div>
            {/* Rest of the space is intentionally empty */}
          </div>
        </div>
      </main>
    </div>
  );
}
