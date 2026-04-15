interface StylisticFigure {
  type: string;
  example: string;
  explanation: string;
  page: number;
}

const SAMPLE_FIGURES: StylisticFigure[] = [
  {
    type: 'Metafora',
    example: '"Život je rijeka koja teče bez prestanka"',
    explanation: 'Život se upoređuje sa rijekom radi naglašavanja stalnih promjena',
    page: 42
  },
  {
    type: 'Personifikacija',
    example: '"Vjetar je šaputao tajne kroz noć"',
    explanation: 'Vjetru se pripisuju ljudske osobine šaputanja',
    page: 67
  },
  {
    type: 'Epitet',
    example: '"Beskrajno modro nebo"',
    explanation: 'Opisni pridjev koji naglašava ljepotu i veličinu neba',
    page: 89
  },
  {
    type: 'Poređenje',
    example: '"Bila je brza kao munja"',
    explanation: 'Direktno poređenje brzine sa munjom',
    page: 112
  }
];

export function StylisticFiguresDetector() {
  return (
    <div className="p-6 rounded-xl bg-[#001F54]/40 border border-[#00D1FF]/30 space-y-4" style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03)' }}>
      <h3 className="text-[#E6F0FF] mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        Detektor stilskih figura
      </h3>
      
      <div className="space-y-3">
        {SAMPLE_FIGURES.map((figure, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-[#0A0A0A]/50 border border-[#00D1FF]/20"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[#00D1FF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {figure.type}
              </h4>
              <span className="px-2 py-1 rounded bg-[#00D1FF]/10 text-[#00D1FF] text-xs border border-[#00D1FF]/30">
                str. {figure.page}
              </span>
            </div>
            
            <p className="text-[#E6F0FF]/80 text-sm mb-2 italic">
              {figure.example}
            </p>
            
            <p className="text-[#E6F0FF]/60 text-sm">
              {figure.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
