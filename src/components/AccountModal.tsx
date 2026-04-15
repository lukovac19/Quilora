import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { User, Mail, Crown, Zap, Calendar, CheckCircle2 } from 'lucide-react';

interface AccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: any;
  questionsRemaining: number;
  onUpgrade: () => void;
}

const QUESTIONS_LIMIT = 5;

export function AccountModal({ open, onOpenChange, currentUser, questionsRemaining, onUpgrade }: AccountModalProps) {
  if (!currentUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#001F54] border border-[#00D1FF]/30 max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-[#00D1FF]/20 rounded-full blur-xl"></div>
              <div className="relative bg-[#00D1FF]/10 p-4 rounded-full">
                <User className="w-10 h-10 text-[#00D1FF]" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-center text-[#E6F0FF]">
            Moj Nalog
          </DialogTitle>
          <DialogDescription className="text-center text-[#E6F0FF]/70">
            Pregled tvog QuoteQuest naloga
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* User Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-[#0A0A0A]/50 rounded-xl p-3 border border-[#00D1FF]/20">
              <User className="w-5 h-5 text-[#00D1FF]" />
              <div className="flex-1">
                <p className="text-[#E6F0FF]/60 text-sm">Ime</p>
                <p className="text-[#E6F0FF]">{currentUser.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#0A0A0A]/50 rounded-xl p-3 border border-[#00D1FF]/20">
              <Mail className="w-5 h-5 text-[#00D1FF]" />
              <div className="flex-1">
                <p className="text-[#E6F0FF]/60 text-sm">Email</p>
                <p className="text-[#E6F0FF]">{currentUser.email}</p>
              </div>
            </div>
          </div>

          {/* Plan Status */}
          <div className="border-t border-[#00D1FF]/20 pt-6">
            <div className={`rounded-xl p-4 ${
              currentUser.isPremium 
                ? 'bg-gradient-to-br from-[#00D1FF]/20 to-[#0FB2FF]/10 border-2 border-[#00D1FF]/50' 
                : 'bg-[#0A0A0A]/50 border border-[#00D1FF]/20'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {currentUser.isPremium ? (
                    <Crown className="w-6 h-6 text-[#00D1FF]" />
                  ) : (
                    <Zap className="w-6 h-6 text-[#E6F0FF]/50" />
                  )}
                  <h3 className="text-[#E6F0FF]">
                    {currentUser.isPremium ? 'Premium Plan' : 'Free Plan'}
                  </h3>
                </div>
                {currentUser.isPremium && (
                  <span className="bg-[#00D1FF] text-[#0A0A0A] text-xs px-3 py-1 rounded-full">
                    Aktivan
                  </span>
                )}
              </div>

              {currentUser.isPremium ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-[#E6F0FF]/80">
                    <CheckCircle2 className="w-4 h-4 text-[#00D1FF]" />
                    <span>Neograničena pitanja</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#E6F0FF]/80">
                    <CheckCircle2 className="w-4 h-4 text-[#00D1FF]" />
                    <span>Napredna AI analiza</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#E6F0FF]/80">
                    <CheckCircle2 className="w-4 h-4 text-[#00D1FF]" />
                    <span>Prioritetna podrška</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#E6F0FF]/80">
                    <Calendar className="w-4 h-4 text-[#00D1FF]" />
                    <span>9.99 KM / mjesečno</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-[#001F54]/40 rounded-lg p-3 border border-[#00D1FF]/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#E6F0FF]/70 text-sm">Preostala pitanja</span>
                      <span className="text-[#00D1FF]">
                        {questionsRemaining} / {QUESTIONS_LIMIT}
                      </span>
                    </div>
                    <div className="w-full bg-[#0A0A0A]/50 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-[#00D1FF] to-[#0FB2FF] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(questionsRemaining / QUESTIONS_LIMIT) * 100}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-[#E6F0FF]/60 text-sm">
                    {questionsRemaining > 0 
                      ? `Imaš još ${questionsRemaining} ${questionsRemaining === 1 ? 'pitanje' : 'pitanja'} preostalo.`
                      : 'Potrošio si sva besplatna pitanja. Čekaj 4 sata ili nadogradi!'
                    }
                  </p>

                  <Button
                    onClick={() => {
                      onUpgrade();
                      onOpenChange(false);
                    }}
                    className="w-full bg-gradient-to-r from-[#00D1FF] to-[#0FB2FF] hover:from-[#00D1FF]/90 hover:to-[#0FB2FF]/90 text-[#0A0A0A] shadow-[0_0_20px_rgba(0,209,255,0.4)] hover:shadow-[0_0_30px_rgba(0,209,255,0.6)] transition-all duration-300"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Nadogradi na Premium
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Account created info */}
          <div className="text-center text-[#E6F0FF]/40 text-sm border-t border-[#00D1FF]/10 pt-4">
            Nalog ID: {currentUser.id}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
