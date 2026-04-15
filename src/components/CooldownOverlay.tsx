import { useEffect, useState } from 'react';
import { Clock, Zap, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

interface CooldownOverlayProps {
  cooldownUntil: number;
  onUpgrade: () => void;
  onCooldownEnd: () => void;
}

export function CooldownOverlay({ cooldownUntil, onUpgrade, onCooldownEnd }: CooldownOverlayProps) {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = cooldownUntil - now;

      if (remaining <= 0) {
        onCooldownEnd();
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [cooldownUntil, onCooldownEnd]);

  return (
    <div className="fixed inset-0 bg-[#0A0A0A]/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#001F54] to-[#003A8C] border border-[#00D1FF]/50 rounded-3xl p-8 max-w-lg w-full text-center shadow-[0_0_40px_rgba(0,209,255,0.3)]">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-[#00D1FF]/20 rounded-full blur-xl"></div>
            <div className="relative bg-[#00D1FF]/10 p-6 rounded-full">
              <Clock className="w-16 h-16 text-[#00D1FF]" />
            </div>
          </div>
        </div>

        <h2 className="text-[#E6F0FF] mb-3">Cooldown period aktivan</h2>
        
        <p className="text-[#E6F0FF]/70 mb-6">
          Iskoristio si svih 5 besplatnih pitanja. Možeš ponovo koristiti QuoteQuest za:
        </p>

        <div className="bg-[#0A0A0A]/50 border border-[#00D1FF]/30 rounded-2xl p-6 mb-8">
          <div className="text-[#00D1FF] mb-2">Preostalo vrijeme</div>
          <div className="text-[#E6F0FF] tracking-wider">{timeRemaining}</div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={onUpgrade}
            className="w-full bg-[#00D1FF] hover:bg-[#00D1FF]/90 text-[#0A0A0A] shadow-[0_0_20px_rgba(0,209,255,0.4)] hover:shadow-[0_0_30px_rgba(0,209,255,0.6)] transition-all duration-300 group"
          >
            <Zap className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            Nadogradi na Premium - Neograničeno pitanja
          </Button>

          <div className="flex items-center gap-3 justify-center text-[#E6F0FF]/50 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>ili čekaj da cooldown istekne</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#00D1FF]/20">
          <p className="text-[#E6F0FF]/60 text-sm mb-3">Premium prednosti:</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#0A0A0A]/30 rounded-lg p-2 text-[#E6F0FF]/70">
              ✨ Bez cooldown-a
            </div>
            <div className="bg-[#0A0A0A]/30 rounded-lg p-2 text-[#E6F0FF]/70">
              ⚡ Brža obrada
            </div>
            <div className="bg-[#0A0A0A]/30 rounded-lg p-2 text-[#E6F0FF]/70">
              🎯 Sve AI funkcije
            </div>
            <div className="bg-[#0A0A0A]/30 rounded-lg p-2 text-[#E6F0FF]/70">
              💬 24/7 podrška
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
