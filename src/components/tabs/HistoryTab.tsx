import { Clock, MessageSquare, FileText, TrendingUp } from 'lucide-react';

interface HistoryItem {
  id: string;
  question: string;
  type: 'chat' | 'essay' | 'mindmap';
  timestamp: string;
  answered: boolean;
}

export function HistoryTab() {
  const historyItems: HistoryItem[] = [
    {
      id: '1',
      question: 'Kakva je uloga mosta kao simbola u romanu?',
      type: 'essay',
      timestamp: 'prije 2h',
      answered: true,
    },
    {
      id: '2',
      question: 'Analiziraj karakterizaciju Abidage',
      type: 'chat',
      timestamp: 'prije 5h',
      answered: true,
    },
    {
      id: '3',
      question: 'Koje su glavne teme u djelu?',
      type: 'mindmap',
      timestamp: 'prije 1 dan',
      answered: true,
    },
    {
      id: '4',
      question: 'Koja je simbolika rijeke Drine?',
      type: 'chat',
      timestamp: 'prije 1 dan',
      answered: true,
    },
    {
      id: '5',
      question: 'Koliko puta se spominje Mehmed-paša Sokolović?',
      type: 'chat',
      timestamp: 'prije 2 dana',
      answered: true,
    },
    {
      id: '6',
      question: 'Generiši esej o sukobu civilizacija',
      type: 'essay',
      timestamp: 'prije 3 dana',
      answered: true,
    },
    {
      id: '7',
      question: 'Prikaz ženskih likova u romanu',
      type: 'essay',
      timestamp: 'prije 3 dana',
      answered: true,
    },
    {
      id: '8',
      question: 'Koje historijske periode pokriva roman?',
      type: 'chat',
      timestamp: 'prije 4 dana',
      answered: true,
    },
  ];

  const getTypeIcon = (type: HistoryItem['type']) => {
    switch (type) {
      case 'chat': return <MessageSquare className="w-4 h-4" />;
      case 'essay': return <FileText className="w-4 h-4" />;
      case 'mindmap': return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: HistoryItem['type']) => {
    switch (type) {
      case 'chat': return 'Razgovor';
      case 'essay': return 'Esej';
      case 'mindmap': return 'Mapa';
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 
          className="text-2xl text-white mb-2 uppercase tracking-wide"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          Historija pitanja
        </h2>
        <p className="text-sm text-[#E6F0FF]/60">
          Pregled svih postavljenih pitanja i generisanih analiza
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#04245A]/20 border border-[#04245A]/40 rounded-xl p-4">
          <div className="text-xs text-[#E6F0FF]/50 mb-1">Ukupno pitanja</div>
          <div className="text-2xl text-[#00CFFF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            127
          </div>
        </div>
        <div className="bg-[#04245A]/20 border border-[#04245A]/40 rounded-xl p-4">
          <div className="text-xs text-[#E6F0FF]/50 mb-1">Ove sedmice</div>
          <div className="text-2xl text-[#00CFFF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            23
          </div>
        </div>
        <div className="bg-[#04245A]/20 border border-[#04245A]/40 rounded-xl p-4">
          <div className="text-xs text-[#E6F0FF]/50 mb-1">Eseji</div>
          <div className="text-2xl text-[#00CFFF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            18
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {historyItems.map((item) => (
          <div
            key={item.id}
            className="bg-[#04245A]/10 border border-[#04245A]/30 rounded-xl p-4
                     hover:bg-[#04245A]/20 hover:border-[#00CFFF]/40
                     hover:shadow-[0_0_12px_rgba(0,207,255,0.15)]
                     transition-all duration-150 cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {/* Question */}
                <h3 className="text-[#E6F0FF] mb-2 group-hover:text-[#00CFFF] transition-colors">
                  {item.question}
                </h3>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-[#E6F0FF]/50">
                  <div className="flex items-center gap-1.5">
                    {getTypeIcon(item.type)}
                    <span>{getTypeLabel(item.type)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{item.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              {item.answered && (
                <div className="px-3 py-1 bg-[#00CFFF]/10 border border-[#00CFFF]/30 rounded-lg text-xs text-[#00CFFF]">
                  Odgovoreno
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="mt-6 text-center">
        <button className="px-6 py-3 bg-[#04245A]/20 border border-[#04245A]/40 rounded-xl
                         text-[#E6F0FF] hover:bg-[#04245A]/30 hover:border-[#00CFFF]/40
                         transition-all duration-150">
          Učitaj starije
        </button>
      </div>
    </div>
  );
}
