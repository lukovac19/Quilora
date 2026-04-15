import { Lightbulb, CheckCircle2 } from 'lucide-react';

export function AIGuidancePanel() {
  const suggestions = [
    'Fokusirajte se na simboliku mosta',
    'Analizirajte odnos karaktera prema promjenama',
    'Istražite temporalnu strukturu narativa',
    'Uporedite različite historijske periode',
  ];

  return (
    <div className="w-96 bg-[#050A12] border-l border-[#04245A]/30 flex flex-col p-8 overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#00CFFF]/10 rounded-xl flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-[#00CFFF]" />
          </div>
          <h2 
            className="text-xl text-white uppercase tracking-wide"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            AI Savjet
          </h2>
        </div>
        <p className="text-sm text-[#E6F0FF]/60 leading-relaxed">
          Personalizirani prijedlozi za dublje razumijevanje djela
        </p>
      </div>

      {/* Main Tip Card */}
      <div className="bg-gradient-to-br from-[#04245A]/40 to-[#04245A]/20 border border-[#04245A]/50 rounded-2xl p-7 mb-8">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 bg-[#00CFFF]/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4 text-[#00CFFF]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#00CFFF] mb-2">
              Trenutni fokus
            </h3>
            <p className="text-sm text-[#E6F0FF]/80 leading-relaxed">
              Na osnovu vaših nedavnih pitanja, preporučujemo dublju analizu simboličke dimenzije 
              mosta. Razmotrите kako Andrić koristi arhitekturu kao metaforu za ljudske odnose.
            </p>
          </div>
        </div>
      </div>

      {/* Suggestions Checklist */}
      <div className="mb-8">
        <h3 
          className="text-sm text-[#E6F0FF]/70 mb-4 uppercase tracking-wider"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          Preporučeni koraci
        </h3>
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 bg-[#04245A]/10 border border-[#04245A]/30 
                       rounded-xl hover:bg-[#04245A]/20 hover:border-[#00CFFF]/30
                       transition-all duration-150 cursor-pointer group"
            >
              <CheckCircle2 className="w-4 h-4 text-[#00CFFF]/50 group-hover:text-[#00CFFF] transition-colors flex-shrink-0 mt-0.5" />
              <span className="text-sm text-[#E6F0FF]/70 group-hover:text-[#E6F0FF] transition-colors">
                {suggestion}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Study Stats */}
      <div className="bg-[#04245A]/10 border border-[#04245A]/30 rounded-xl p-5 mb-8">
        <h3 
          className="text-xs text-[#E6F0FF]/50 mb-4 uppercase tracking-wider"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          Vaš progres
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-[#E6F0FF]/60">Pokriveno djelo</span>
              <span className="text-[#00CFFF]">76%</span>
            </div>
            <div className="h-2 bg-[#04245A]/40 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#00CFFF] to-[#00CFFF]/60 rounded-full"
                style={{ width: '76%' }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-[#E6F0FF]/60">Razumijevanje tema</span>
              <span className="text-[#00CFFF]">82%</span>
            </div>
            <div className="h-2 bg-[#04245A]/40 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#00CFFF] to-[#00CFFF]/60 rounded-full"
                style={{ width: '82%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <button className="w-full py-3 px-4 bg-[#04245A]/20 border border-[#04245A]/40 rounded-xl
                         text-sm text-[#E6F0FF] hover:bg-[#04245A]/30 hover:border-[#00CFFF]/40
                         transition-all duration-150">
          Generiši novi savjet
        </button>
        <button className="w-full py-3 px-4 bg-[#00CFFF]/10 border border-[#00CFFF]/40 rounded-xl
                         text-sm text-[#00CFFF] hover:bg-[#00CFFF]/20 hover:border-[#00CFFF]
                         transition-all duration-150">
          Prikaži sve preporuke
        </button>
      </div>

      {/* Reading Mode Tip */}
      <div className="mt-auto pt-8 border-t border-[#04245A]/30">
        <div className="text-xs text-[#E6F0FF]/40 leading-relaxed">
          <span className="text-[#00CFFF]/60">💡 Savjet:</span> Koristite "Mapa uma" tab za 
          vizuelni pregled svih povezanih tema i koncepata u djelu.
        </div>
      </div>
    </div>
  );
}