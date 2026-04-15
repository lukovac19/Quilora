import { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Bookmark, 
  Quote, 
  FileQuestion, 
  StickyNote, 
  Sparkles,
  Copy,
  Trash2,
  Download,
  Search,
  Filter,
  X,
  Check,
  Calendar,
  BookOpen,
  ArrowLeft
} from 'lucide-react';

type InsightType = 'all' | 'quotes' | 'quizzes' | 'notes' | 'explanations';

interface SavedInsight {
  id: string;
  type: 'quote' | 'quiz' | 'note' | 'explanation';
  content: string;
  bookName: string;
  savedDate: Date;
  metadata?: any;
}

export function SavedInsightsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<InsightType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Mock data
  const [insights, setInsights] = useState<SavedInsight[]>([
    {
      id: '1',
      type: 'quote',
      content: 'The green light symbolizes Gatsby\'s hopes and dreams for the future, particularly his desire to reunite with Daisy. It represents the unattainable nature of the American Dream.',
      bookName: 'The Great Gatsby',
      savedDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: '2',
      type: 'explanation',
      content: 'The significance of the Valley of Ashes represents the moral and social decay hidden beneath the glittering surface of the 1920s. It serves as a stark contrast to the wealth of East and West Egg.',
      bookName: 'The Great Gatsby',
      savedDate: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      id: '3',
      type: 'quiz',
      content: '7-question quiz on Chapter 3: The Party Scene',
      bookName: 'The Great Gatsby',
      savedDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      metadata: { score: 6, total: 7 }
    },
    {
      id: '4',
      type: 'note',
      content: 'Important to remember: Nick is an unreliable narrator. His perspective shapes our understanding of Gatsby, but we must question his interpretations.',
      bookName: 'The Great Gatsby',
      savedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: '5',
      type: 'quote',
      content: 'Big Brother is watching you. This phrase encapsulates the novel\'s central theme of surveillance and totalitarian control over individual freedom.',
      bookName: '1984',
      savedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: '6',
      type: 'explanation',
      content: 'Doublethink is the ability to hold two contradictory beliefs simultaneously and accept both. This psychological manipulation is central to the Party\'s control over reality itself.',
      bookName: '1984',
      savedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      id: '7',
      type: 'note',
      content: 'Winston\'s diary represents his first act of rebellion. The act of writing itself is a form of resistance against the Party\'s control of history and memory.',
      bookName: '1984',
      savedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    }
  ]);

  const tabs = [
    { id: 'all' as InsightType, label: 'All', icon: Bookmark },
    { id: 'quotes' as InsightType, label: 'Quotes', icon: Quote },
    { id: 'quizzes' as InsightType, label: 'Quizzes', icon: FileQuestion },
    { id: 'notes' as InsightType, label: 'Notes', icon: StickyNote },
    { id: 'explanations' as InsightType, label: 'Explanations', icon: Sparkles },
  ];

  const filteredInsights = insights.filter(insight => {
    const matchesSearch = 
      insight.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.bookName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || insight.type === activeTab.slice(0, -1);
    return matchesSearch && matchesTab;
  });

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    setInsights(prev => prev.filter(insight => insight.id !== id));
  };

  const handleExport = () => {
    const exportData = JSON.stringify(filteredInsights, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quilora-insights.json';
    a.click();
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quote': return Quote;
      case 'quiz': return FileQuestion;
      case 'note': return StickyNote;
      case 'explanation': return Sparkles;
      default: return Bookmark;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'quote': return '#266ba7';
      case 'quiz': return '#3b82c4';
      case 'note': return '#4a9dd4';
      case 'explanation': return '#5aa3e4';
      default: return '#266ba7';
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
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-semibold text-white">Saved Insights</h1>
                  <p className="text-sm text-white/50 mt-0.5">Your collected knowledge and discoveries</p>
                </div>
              </div>
              {filteredInsights.length > 0 && (
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium transition-all duration-300"
                >
                  <Download className="w-4 h-4" />
                  Export All
                </button>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search insights..."
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

            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const count = tab.id === 'all' 
                  ? insights.length 
                  : insights.filter(i => i.type === tab.id.slice(0, -1)).length;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[#266ba7]/20 border-[#266ba7]/30 text-[#266ba7]'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-[#266ba7]/20' : 'bg-white/10'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Insights Grid */}
        <div className="p-6 max-w-7xl mx-auto">
          {filteredInsights.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
              <div className="w-20 h-20 rounded-3xl bg-[#266ba7]/10 flex items-center justify-center mb-6">
                <Bookmark className="w-10 h-10 text-[#266ba7]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery ? 'No insights found' : 'No saved insights yet'}
              </h3>
              <p className="text-white/50 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search query' 
                  : 'Save insights during your study sessions to build your knowledge library'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInsights.map((insight, index) => {
                const TypeIcon = getTypeIcon(insight.type);
                const typeColor = getTypeColor(insight.type);

                return (
                  <div
                    key={insight.id}
                    className="group p-5 rounded-3xl bg-gradient-to-br from-[#1a2f45]/40 to-[#0a1929]/40 backdrop-blur-xl border border-white/10 hover:border-[#266ba7]/30 transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${typeColor}20` }}
                        >
                          <TypeIcon className="w-4 h-4" style={{ color: typeColor }} />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: typeColor }}>
                          {insight.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(insight.content, insight.id)}
                          className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all"
                          title="Copy"
                        >
                          {copiedId === insight.id ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(insight.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-white/60 hover:text-red-400 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      <p className="text-sm text-white/80 leading-relaxed line-clamp-4">
                        {insight.content}
                      </p>
                      {insight.metadata?.score !== undefined && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <span className="text-xs text-emerald-400 font-semibold">
                              Score: {insight.metadata.score}/{insight.metadata.total}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <BookOpen className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{insight.bookName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(insight.savedDate)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}