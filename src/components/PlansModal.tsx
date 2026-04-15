import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Check, Zap, Crown, Sparkles } from 'lucide-react';

interface PlansModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPlan: (plan: 'free' | 'premium') => void;
  questionsRemaining?: number;
}

export function PlansModal({ open, onOpenChange, onSelectPlan, questionsRemaining = 0 }: PlansModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#001F54] border border-[#00D1FF]/30 max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-[#00D1FF]/10 p-4 rounded-full">
              <Crown className="w-10 h-10 text-[#00D1FF]" />
            </div>
          </div>
          <DialogTitle className="text-center text-[#E6F0FF]">
            Iskoristio si besplatna pitanja
          </DialogTitle>
          <DialogDescription className="text-center text-[#E6F0FF]/70">
            Izaberi plan koji odgovara tvojim potrebama
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Free Plan */}
          <div className="relative bg-[#0A0A0A] border border-[#00D1FF]/20 rounded-2xl p-6 hover:border-[#00D1FF]/40 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#00D1FF]/10 p-2 rounded-lg">
                <Sparkles className="w-6 h-6 text-[#00D1FF]" />
              </div>
              <h3 className="text-[#E6F0FF]">Free Plan</h3>
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-[#E6F0FF]">0 KM</span>
                <span className="text-[#E6F0FF]/50 text-sm">/ mjesečno</span>
              </div>
              <p className="text-[#E6F0FF]/70 text-sm">Sa 4-satnim cooldown periodom</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#00D1FF] mt-0.5 flex-shrink-0" />
                <span className="text-[#E6F0FF]/80 text-sm">5 pitanja svaka 4 sata</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#00D1FF] mt-0.5 flex-shrink-0" />
                <span className="text-[#E6F0FF]/80 text-sm">Osnovna AI analiza</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#00D1FF] mt-0.5 flex-shrink-0" />
                <span className="text-[#E6F0FF]/80 text-sm">Izvoz citata u PDF</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#00D1FF] mt-0.5 flex-shrink-0" />
                <span className="text-[#E6F0FF]/80 text-sm">Čuvanje citata</span>
              </div>
            </div>

            <Button
              onClick={() => onSelectPlan('free')}
              className="w-full bg-[#001F54] hover:bg-[#003A8C] border border-[#00D1FF]/30 text-[#E6F0FF] transition-all duration-300"
            >
              Nastavi sa Free
            </Button>
          </div>

          {/* Premium Plan */}
          <div className="relative bg-gradient-to-br from-[#001F54] to-[#003A8C] border border-[#00D1FF]/50 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,209,255,0.2)]">
            <div className="absolute -top-3 right-6 bg-[#00D1FF] text-[#0A0A0A] px-4 py-1 rounded-full text-sm">
              Preporučeno
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#00D1FF]/20 p-2 rounded-lg">
                <Zap className="w-6 h-6 text-[#00D1FF]" />
              </div>
              <h3 className="text-[#E6F0FF]">Premium Plan</h3>
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-[#00D1FF]">9.99 KM</span>
                <span className="text-[#E6F0FF]/50 text-sm">/ mjesečno</span>
              </div>
              <p className="text-[#E6F0FF]/70 text-sm">Bez ograničenja, puna moć AI-a</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#00D1FF] mt-0.5 flex-shrink-0" />
                <span className="text-[#E6F0FF]/90 text-sm">Neograničena pitanja</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#00D1FF] mt-0.5 flex-shrink-0" />
                <span className="text-[#E6F0FF]/90 text-sm">Napredna AI analiza</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#00D1FF] mt-0.5 flex-shrink-0" />
                <span className="text-[#E6F0FF]/90 text-sm">Prioritetna obrada</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#00D1FF] mt-0.5 flex-shrink-0" />
                <span className="text-[#E6F0FF]/90 text-sm">Svi AI alati (karakteri, timeline, motivi)</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#00D1FF] mt-0.5 flex-shrink-0" />
                <span className="text-[#E6F0FF]/90 text-sm">Neograničen izvoz i čuvanje</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#00D1FF] mt-0.5 flex-shrink-0" />
                <span className="text-[#E6F0FF]/90 text-sm">Email podrška 24/7</span>
              </div>
            </div>

            <Button
              onClick={() => onSelectPlan('premium')}
              className="w-full bg-[#00D1FF] hover:bg-[#00D1FF]/90 text-[#0A0A0A] shadow-[0_0_20px_rgba(0,209,255,0.4)] hover:shadow-[0_0_30px_rgba(0,209,255,0.6)] transition-all duration-300"
            >
              Nadogradi na Premium
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[#E6F0FF]/50 text-sm">
            💳 Prihvatamo sve glavne kartice • Otkaži bilo kada
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
