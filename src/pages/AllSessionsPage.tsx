import { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  MessageSquare, 
  Search, 
  Filter,
  Calendar,
  BookOpen,
  PlayCircle,
  TrendingUp,
  Clock,
  X
} from 'lucide-react';

interface StudySession {
  id: string;
  bookName: string;
  pdfId: string;
  lastActive: Date;
  progress: number;
  questionsAsked: number;
  insightsSaved: number;
  status: 'active' | 'completed' | 'paused';
}

export function AllSessionsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'paused'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Mock data
  const [sessions] = useState<StudySession[]>([
    {
      id: 'session-1',
      bookName: 'The Great Gatsby',
      pdfId: '1',
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
      progress: 75,
      questionsAsked: 23,
      insightsSaved: 8,
      status: 'active'
    },
    {
      id: 'session-2',
      bookName: '1984 by George Orwell',
      pdfId: '2',
      lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
      progress: 45,
      questionsAsked: 18,
      insightsSaved: 5,
      status: 'active'
    },
    {
      id: 'session-3',
      bookName: 'To Kill a Mockingbird',
      pdfId: '3',
      lastActive: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      progress: 100,
      questionsAsked: 31,
      insightsSaved: 12,
      status: 'completed'
    },
    {
      id: 'session-4',
      bookName: 'Pride and Prejudice',
      pdfId: '4',
      lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      progress: 20,
      questionsAsked: 7,
      insightsSaved: 2,
      status: 'paused'
    },
    {
      id: 'session-5',
      bookName: 'Brave New World',
      pdfId: '5',
      lastActive: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      progress: 100,
      questionsAsked: 42,
      insightsSaved: 15,
      status: 'completed'
    },
    {
      id: 'session-6',
      bookName: 'The Catcher in the Rye',
      pdfId: '6',
      lastActive: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      progress: 60,
      questionsAsked: 19,
      insightsSaved: 6,
      status: 'paused'
    }
  ]);

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.bookName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || session.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleContinueSession = (sessionId: string) => {
    navigate(`/study-session?continue=${sessionId}`);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-400';
      case 'completed': return 'text-[#266ba7]';
      case 'paused': return 'text-orange-400';
      default: return 'text-white/50';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'completed': return 'bg-[#266ba7]/10 border-[#266ba7]/20';
      case 'paused': return 'bg-orange-500/10 border-orange-500/20';
      default: return 'bg-white/5 border-white/10';
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0a1929', fontFamily: 'Inter, sans-serif' }}>
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#266ba7]/5 via-transparent to-[#266ba7]/5 pointer-events-none" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a1929]/90 backdrop-blur-xl">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-white">All Study Sessions</h1>
                <p className="text-sm text-white/50 mt-0.5">View and manage all your reading sessions</p>
              </div>
              <button
                onClick={() => navigate('/study-session')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#266ba7] hover:bg-[#3b82c4] text-white font-medium shadow-lg hover:shadow-xl hover:shadow-[#266ba7]/40 transition-all duration-300"
              >
                <PlayCircle className="w-4 h-4" />
                New Session
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#266ba7]/50 focus:ring-2 focus:ring-[#266ba7]/20 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all ${
                    filterStatus !== 'all'
                      ? 'bg-[#266ba7]/20 border-[#266ba7]/30 text-[#266ba7]'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium capitalize">{filterStatus}</span>
                </button>

                {showFilterMenu && (
                  <div className="absolute top-full right-0 mt-2 w-40 p-2 rounded-2xl bg-[#1a2f45]/95 backdrop-blur-xl border border-white/10 shadow-2xl animate-scale-in z-50">
                    {['all', 'active', 'completed', 'paused'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setFilterStatus(status as any);
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all capitalize ${
                          filterStatus === status
                            ? 'bg-[#266ba7]/20 text-[#266ba7] font-medium'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Sessions Grid */}
        <div className="p-6 max-w-7xl mx-auto">
          {filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
              <div className="w-20 h-20 rounded-3xl bg-[#266ba7]/10 flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-[#266ba7]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery || filterStatus !== 'all' ? 'No sessions found' : 'No study sessions yet'}
              </h3>
              <p className="text-white/50 mb-6">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Start your first study session to begin your literary journey'}
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <button
                  onClick={() => navigate('/study-session')}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#266ba7] hover:bg-[#3b82c4] text-white font-medium shadow-lg hover:shadow-xl hover:shadow-[#266ba7]/40 transition-all duration-300"
                >
                  <PlayCircle className="w-4 h-4" />
                  Start First Session
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSessions.map((session, index) => (
                <div
                  key={session.id}
                  className="group p-5 rounded-3xl bg-gradient-to-br from-[#1a2f45]/40 to-[#0a1929]/40 backdrop-blur-xl border border-white/10 hover:border-[#266ba7]/30 transition-all duration-300 hover:scale-[1.02] animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleContinueSession(session.id)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white mb-2 group-hover:text-[#266ba7] transition-colors line-clamp-2">
                        {session.bookName}
                      </h3>
                      <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${getStatusBg(session.status)}`}>
                        <span className={getStatusColor(session.status)} style={{ textTransform: 'capitalize' }}>
                          {session.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-3 h-3 text-[#266ba7]" />
                        <span className="text-xs text-white/50">Questions</span>
                      </div>
                      <div className="text-lg font-semibold text-white">{session.questionsAsked}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-3 h-3 text-[#266ba7]" />
                        <span className="text-xs text-white/50">Insights</span>
                      </div>
                      <div className="text-lg font-semibold text-white">{session.insightsSaved}</div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/50">Progress</span>
                      <span className="text-xs text-white/70 font-medium">{session.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#266ba7] to-[#3b82c4] rounded-full transition-all duration-500" 
                        style={{ width: `${session.progress}%` }} 
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-2 text-xs text-white/40 pt-3 border-t border-white/5">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(session.lastActive)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
