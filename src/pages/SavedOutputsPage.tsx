import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { t } from '../lib/translations';
import {
  Quote,
  HelpCircle,
  FileText,
  ChevronLeft,
  Trash2,
  Copy,
  Download,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type TabType = 'quotes' | 'questions' | 'essays';

export function SavedOutputsPage() {
  const { user, language, savedItems, deleteSavedItem } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('quotes');

  if (!user) {
    navigate('/auth');
    return null;
  }

  const filteredItems = savedItems.filter((item) => {
    if (activeTab === 'quotes') return item.type === 'quote';
    if (activeTab === 'questions') return item.type === 'question';
    if (activeTab === 'essays') return item.type === 'essay';
    return false;
  });

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleExport = () => {
    const content = filteredItems.map((item) => item.content).join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotequest-${activeTab}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported successfully');
  };

  const tabs = [
    { id: 'quotes', label: 'Quotes', icon: Quote },
    { id: 'questions', label: 'Questions', icon: HelpCircle },
    { id: 'essays', label: 'Essays', icon: FileText },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0A0F18] text-[#E6F0FF]">
      {/* Header */}
      <header className="border-b border-[#00CFFF]/10 bg-[#0A0F18]/80 backdrop-blur-xl p-6 sticky top-0 z-40">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-[#04245A]/40 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1
                  className="text-2xl font-bold"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {t('dashboard.savedOutputs', language)}
                </h1>
                <p className="text-sm text-[#E6F0FF]/60">
                  {savedItems.length} items saved
                </p>
              </div>
            </div>

            {filteredItems.length > 0 && (
              <button
                onClick={handleExport}
                className="px-4 py-2 rounded-lg bg-[#04245A]/40 hover:bg-[#04245A]/60 border border-[#00CFFF]/20 hover:border-[#00CFFF]/40 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export All</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-[#00CFFF]/10 bg-[#04245A]/10">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const count = savedItems.filter((item) => item.type === tab.id).length;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-[#00CFFF] text-[#00CFFF]'
                      : 'border-transparent text-[#E6F0FF]/60 hover:text-[#E6F0FF]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-[#00CFFF]/20 text-[#00CFFF]'
                        : 'bg-[#04245A]/40 text-[#E6F0FF]/60'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto max-w-7xl p-6 lg:p-8">
        {filteredItems.length > 0 ? (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-6 rounded-2xl bg-[#04245A]/30 border border-[#00CFFF]/20 hover:border-[#00CFFF]/40 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {item.bookName && (
                      <div className="flex items-center gap-2 text-sm text-[#00CFFF] mb-2">
                        <BookOpen className="w-4 h-4" />
                        <span>{item.bookName}</span>
                      </div>
                    )}
                    <p className="text-[#E6F0FF] leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-[#E6F0FF]/60">
                    <span>{new Date(item.dateSaved).toLocaleDateString()}</span>
                    {item.page && <span>Page {item.page}</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(item.content)}
                      className="p-2 rounded-lg bg-[#04245A]/40 hover:bg-[#04245A]/60 border border-[#00CFFF]/20 hover:border-[#00CFFF]/40 transition-all"
                    >
                      <Copy className="w-4 h-4 text-[#00CFFF]" />
                    </button>
                    <button
                      onClick={() => {
                        deleteSavedItem(item.id);
                        toast.success('Item deleted');
                      }}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center bg-[#04245A]/20 rounded-2xl border border-[#00CFFF]/10">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#00CFFF]/20 to-[#04245A]/40 flex items-center justify-center mx-auto mb-6">
              {activeTab === 'quotes' && <Quote className="w-12 h-12 text-[#00CFFF]" />}
              {activeTab === 'questions' && <HelpCircle className="w-12 h-12 text-[#00CFFF]" />}
              {activeTab === 'essays' && <FileText className="w-12 h-12 text-[#00CFFF]" />}
            </div>
            <h3 className="text-xl font-bold mb-2">No {activeTab} saved yet</h3>
            <p className="text-[#E6F0FF]/60 mb-6">
              Start studying and save items to build your collection
            </p>
            <button
              onClick={() => navigate('/session')}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#00CFFF] to-[#04A4FF] text-white font-bold hover:shadow-[0_0_30px_rgba(0,207,255,0.5)] transition-all"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              Start Studying
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
