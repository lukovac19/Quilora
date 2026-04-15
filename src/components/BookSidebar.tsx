import { BookOpen } from 'lucide-react';

interface Book {
  title: string;
  author: string;
}

interface BookSidebarProps {
  book: Book;
  onChangeBook: () => void;
}

export function BookSidebar({ book, onChangeBook }: BookSidebarProps) {
  return (
    <div className="w-80 bg-[#050A12] border-r border-[#04245A]/30 flex flex-col p-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-5 h-5 text-[#00CFFF]" />
          <span 
            className="text-xs uppercase tracking-wider text-[#00CFFF]/70"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            Aktivna knjiga
          </span>
        </div>
      </div>

      {/* Book Info */}
      <div className="flex-1">
        <div className="bg-[#04245A]/20 rounded-2xl p-8 border border-[#04245A]/40">
          {/* Book Cover Placeholder */}
          <div className="w-full aspect-[2/3] bg-gradient-to-br from-[#04245A] to-[#02153A] rounded-lg mb-8 flex items-center justify-center overflow-hidden">
            <div className="text-center p-4">
              <BookOpen className="w-12 h-12 text-[#00CFFF]/30 mx-auto mb-3" />
              <div className="text-[#00CFFF]/50 text-xs">PDF dokument</div>
            </div>
          </div>

          {/* Book Title */}
          <h2 
            className="text-xl mb-4 text-white leading-tight"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            {book.title}
          </h2>

          {/* Author */}
          <p className="text-sm text-[#E6F0FF]/60 mb-8">
            {book.author}
          </p>

          {/* Metadata */}
          <div className="space-y-3 mb-8 pb-8 border-b border-[#04245A]/40">
            <div className="flex justify-between text-xs">
              <span className="text-[#E6F0FF]/50">Stranica:</span>
              <span className="text-[#E6F0FF]/80">348</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#E6F0FF]/50">Jezik:</span>
              <span className="text-[#E6F0FF]/80">Bosanski</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#E6F0FF]/50">Analizirano:</span>
              <span className="text-[#00CFFF]/80">92%</span>
            </div>
          </div>

          {/* Change Book Button */}
          <button
            onClick={onChangeBook}
            className="w-full py-3 px-4 rounded-xl border-2 border-[#00CFFF]/40 text-[#00CFFF] 
                     hover:bg-[#00CFFF]/10 hover:border-[#00CFFF] transition-all duration-150
                     text-sm tracking-wide"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            Promijeni knjigu
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 space-y-4">
          <div className="bg-[#04245A]/10 rounded-xl p-5 border border-[#04245A]/30">
            <div className="text-xs text-[#E6F0FF]/50 mb-1">Postavljeno pitanja</div>
            <div className="text-2xl text-[#00CFFF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              127
            </div>
          </div>
          
          <div className="bg-[#04245A]/10 rounded-xl p-5 border border-[#04245A]/30">
            <div className="text-xs text-[#E6F0FF]/50 mb-1">Vrijeme čitanja</div>
            <div className="text-2xl text-[#00CFFF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              14h 32m
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}