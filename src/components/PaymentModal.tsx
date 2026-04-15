import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CreditCard, Lock, CheckCircle2, ArrowLeft } from 'lucide-react';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PaymentModal({ open, onOpenChange, onSuccess }: PaymentModalProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19); // 16 digits + 3 spaces
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsProcessing(false);
    setIsSuccess(true);

    // Wait a bit before calling success
    setTimeout(() => {
      onSuccess();
      setIsSuccess(false);
      resetForm();
    }, 1500);
  };

  const resetForm = () => {
    setCardNumber('');
    setExpiry('');
    setCvc('');
    setName('');
  };

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[#001F54] border border-[#00D1FF]/30 max-w-md">
          <div className="text-center py-8">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-[#00D1FF]/10 p-6 rounded-full">
                <CheckCircle2 className="w-16 h-16 text-[#00D1FF]" />
              </div>
            </div>
            <h3 className="text-[#E6F0FF] mb-3">Uspješna uplata!</h3>
            <p className="text-[#E6F0FF]/70">
              Dobrodošao u Premium klub. Uživaj u neograničenim pitanjima!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="bg-[#001F54] border border-[#00D1FF]/30 max-w-md">
        <DialogHeader>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute left-4 top-4 text-[#E6F0FF]/70 hover:text-[#E6F0FF] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-[#00D1FF]/10 p-3 rounded-full">
              <CreditCard className="w-8 h-8 text-[#00D1FF]" />
            </div>
          </div>
          <DialogTitle className="text-center text-[#E6F0FF]">
            Plaćanje Premium paketa
          </DialogTitle>
          <DialogDescription className="text-center text-[#E6F0FF]/70">
            Unesite podatke o kartici za mjesečnu pretplatu od 9.99 KM
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber" className="text-[#E6F0FF]">Broj kartice</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00D1FF]/50" />
              <Input
                id="cardNumber"
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                className="bg-[#0A0A0A] border-[#00D1FF]/30 text-[#E6F0FF] pl-10 focus:border-[#00D1FF] focus:ring-[#00D1FF]/20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry" className="text-[#E6F0FF]">Istek</Label>
              <Input
                id="expiry"
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/GG"
                className="bg-[#0A0A0A] border-[#00D1FF]/30 text-[#E6F0FF] focus:border-[#00D1FF] focus:ring-[#00D1FF]/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvc" className="text-[#E6F0FF]">CVC</Label>
              <Input
                id="cvc"
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="123"
                className="bg-[#0A0A0A] border-[#00D1FF]/30 text-[#E6F0FF] focus:border-[#00D1FF] focus:ring-[#00D1FF]/20"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-[#E6F0FF]">Ime na kartici</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="PETAR PETROVIĆ"
              className="bg-[#0A0A0A] border-[#00D1FF]/30 text-[#E6F0FF] focus:border-[#00D1FF] focus:ring-[#00D1FF]/20"
              required
            />
          </div>

          <div className="bg-[#0A0A0A]/50 border border-[#00D1FF]/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#E6F0FF]/70">Premium Plan</span>
              <span className="text-[#E6F0FF]">9.99 KM</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#E6F0FF]/50">Naplata</span>
              <span className="text-[#E6F0FF]/50">Mjesečno</span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-[#00D1FF] hover:bg-[#00D1FF]/90 text-[#0A0A0A] shadow-[0_0_20px_rgba(0,209,255,0.4)] hover:shadow-[0_0_30px_rgba(0,209,255,0.6)] transition-all duration-300 disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[#0A0A0A]/20 border-t-[#0A0A0A] rounded-full animate-spin mr-2"></div>
                Obrada...
              </span>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Plati 9.99 KM
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-[#E6F0FF]/50">
            <Lock className="w-3 h-3" />
            <span>Sigurna uplata • Enkriptovano SSL-om</span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
