import { Instagram, Mail, Coffee } from 'lucide-react';

export function QuoteQuestFooter() {
  return (
    <footer className="relative bg-[#0A0A0A] border-t border-[#00D1FF]/10">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="text-center space-y-4">
          {/* Text */}
          <p className="text-[#E6F0FF]/70 leading-relaxed max-w-2xl mx-auto">
            Pratite nas na Instagramu da budete u toku! Za sva pitanja, nedoumice ili prijedloge pišite nam na Instagram ili email, uvijek smo tu :)
          </p>
          
          {/* Donation Section */}
          <div className="flex justify-center py-4">
            <a
              href="https://www.buymeacoffee.com/quotequest"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center gap-2 px-6 py-3 bg-[#001F54] border border-[#00D1FF]/30 rounded-lg overflow-hidden transition-all duration-300 hover:border-[#00D1FF] hover:shadow-[0_0_20px_rgba(0,209,255,0.3)]"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#00D1FF]/0 via-[#00D1FF]/10 to-[#00D1FF]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <Coffee className="w-5 h-5 text-[#00D1FF] relative z-10 transition-transform duration-300 group-hover:scale-110" />
              <span className="relative z-10 text-[#E6F0FF] transition-colors duration-300 group-hover:text-[#00D1FF]">
                Podržite QuoteQuest
              </span>
            </a>
          </div>
          
          {/* Social Icons */}
          <div className="flex items-center justify-center gap-6">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E6F0FF]/50 hover:text-[#00D1FF] transition-all duration-300 hover:scale-110"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="mailto:contact@quotequest.com"
              className="text-[#E6F0FF]/50 hover:text-[#00D1FF] transition-all duration-300 hover:scale-110"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
          
          {/* Copyright */}
          <p className="text-[#E6F0FF]/50 text-sm">
            © 2025 Ema Lukovac. Sva prava zadržana.
          </p>
        </div>
      </div>
    </footer>
  );
}