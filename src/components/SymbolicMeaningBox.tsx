interface SymbolicMeaningProps {
  symbol: string;
  meaning: string;
  pages: number[];
}

const SYMBOL_MEANINGS: Record<string, { meaning: string; pages: number[] }> = {
  'sunce': {
    meaning: 'Simbol nade, optimizma i novog početka. Sunce često označava prosvetljenje ili pozitivnu transformaciju likova.',
    pages: [12, 45, 89, 134, 201]
  },
  'voda': {
    meaning: 'Predstavlja život, čišćenje ili promjenu. Voda može simbolizovati emocionalnu dubinu ili duhovnu očišćenje.',
    pages: [23, 67, 112, 178]
  },
  'noć': {
    meaning: 'Simbol tajni, straha ili nepoznatog. Noć često označava unutrašnji sukob ili period neizvjesnosti.',
    pages: [34, 78, 145, 189]
  },
  'ptica': {
    meaning: 'Metafora slobode, bekstva ili duhovne težnje. Ptice predstavljaju želju za oslobođenjem od ograničenja.',
    pages: [56, 98, 156, 187]
  },
  'put': {
    meaning: 'Simbolizuje životno putovanje, preobražaj ili potragu za identitetom. Put označava razvoj lika kroz priču.',
    pages: [45, 89, 134, 167, 203]
  }
};

export function SymbolicMeaningBox({ symbol }: { symbol: string }) {
  const data = SYMBOL_MEANINGS[symbol.toLowerCase()];
  
  if (!data) return null;

  return (
    <div 
      className="p-5 rounded-xl bg-gradient-to-br from-[#001F54]/60 to-[#001F54]/30 border border-[#00D1FF]/40 space-y-3"
      style={{ 
        boxShadow: '0 0 20px rgba(0,209,255,0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.03)',
        animation: 'fadeIn 0.4s ease-in'
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-[#00D1FF] shadow-[0_0_10px_rgba(0,209,255,0.5)]" />
        <h4 className="text-[#00D1FF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          Simbolički značaj: {symbol}
        </h4>
      </div>
      
      <p className="text-[#E6F0FF]/80 leading-relaxed">
        {data.meaning}
      </p>
      
      <div className="pt-2 border-t border-[#00D1FF]/20">
        <p className="text-[#E6F0FF]/50 text-sm mb-2">Pojavljuje se na stranicama:</p>
        <div className="flex flex-wrap gap-2">
          {data.pages.map((page, index) => (
            <span
              key={index}
              className="px-2 py-1 rounded bg-[#00D1FF]/10 text-[#00D1FF] text-sm border border-[#00D1FF]/30"
            >
              {page}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
