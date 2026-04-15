interface Motif {
  name: string;
  count: number;
  pages: number[];
  explanation: string;
}

const SAMPLE_MOTIFS: Motif[] = [
  {
    name: 'Sunce',
    count: 24,
    pages: [12, 45, 67, 89, 134, 178, 201],
    explanation: 'Simbol nade i novog početka koji se povećava ka kraju priče'
  },
  {
    name: 'Sloboda',
    count: 18,
    pages: [23, 56, 78, 112, 145, 189],
    explanation: 'Centralna tema koja se razvija kroz sukob glavnog lika'
  },
  {
    name: 'Ptice',
    count: 15,
    pages: [34, 67, 98, 156, 187],
    explanation: 'Metafora za težnju ka slobodi i bekstvu od ograničenja'
  }
];

export function MotifScanner() {
  return (
    <div className="p-6 rounded-xl bg-[#001F54]/40 border border-[#00D1FF]/30 space-y-4" style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03)' }}>
      <h3 className="text-[#E6F0FF] mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        AI skeniranje motiva
      </h3>
      
      <div className="space-y-4">
        {SAMPLE_MOTIFS.map((motif, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-[#0A0A0A]/50 border border-[#00D1FF]/20 hover:border-[#00D1FF]/40 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[#E6F0FF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {motif.name}
              </h4>
              <span className="px-3 py-1 rounded-full bg-[#00D1FF]/10 text-[#00D1FF] text-sm border border-[#00D1FF]/30">
                {motif.count}× ponavljanja
              </span>
            </div>
            
            <p className="text-[#E6F0FF]/70 text-sm mb-3 leading-relaxed">
              {motif.explanation}
            </p>
            
            <div className="flex flex-wrap gap-2">
              {motif.pages.map((page, pageIndex) => (
                <span
                  key={pageIndex}
                  className="px-2 py-1 rounded bg-[#001F54]/60 text-[#00D1FF] text-xs border border-[#00D1FF]/20"
                >
                  {page}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
