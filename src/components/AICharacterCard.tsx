interface CharacterData {
  name: string;
  role: string;
  traits: string;
  development: string;
  keyQuotes: Array<{ text: string; page: number }>;
}

interface AICharacterCardProps {
  character: CharacterData;
}

export function AICharacterCard({ character }: AICharacterCardProps) {
  return (
    <div className="p-6 rounded-xl bg-[#001F54]/40 border border-[#00D1FF]/30 space-y-4" style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03)' }}>
      {/* Header */}
      <div className="pb-4 border-b border-[#00D1FF]/20">
        <h3 className="text-[#E6F0FF] text-xl mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          {character.name}
        </h3>
        <p className="text-[#00D1FF] text-sm">{character.role}</p>
      </div>

      {/* Character Traits */}
      <div>
        <h4 className="text-[#E6F0FF]/80 text-sm mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          Karakter
        </h4>
        <p className="text-[#E6F0FF]/70 leading-relaxed">{character.traits}</p>
      </div>

      {/* Development */}
      <div>
        <h4 className="text-[#E6F0FF]/80 text-sm mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          Razvoj lika
        </h4>
        <p className="text-[#E6F0FF]/70 leading-relaxed">{character.development}</p>
      </div>

      {/* Key Quotes */}
      <div>
        <h4 className="text-[#E6F0FF]/80 text-sm mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          Ključni citati
        </h4>
        <div className="space-y-2">
          {character.keyQuotes.map((quote, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-[#0A0A0A]/50 border border-[#00D1FF]/10"
            >
              <p className="text-[#E6F0FF]/70 text-sm mb-2">"{quote.text}"</p>
              <span className="text-[#00D1FF] text-xs px-2 py-1 rounded bg-[#00D1FF]/10 border border-[#00D1FF]/30">
                Stranica {quote.page}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
