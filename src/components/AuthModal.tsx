import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Mail, Lock, User, Sparkles, ArrowRight, BookOpen } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (user: any) => void;
}

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || (!isLogin && !name)) {
      setError('Molimo popunite sva polja');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Unesite validnu email adresu');
      return;
    }

    if (password.length < 6) {
      setError('Lozinka mora imati najmanje 6 karaktera');
      return;
    }

    // Get existing users from localStorage
    const users = JSON.parse(localStorage.getItem('quotequest_users') || '{}');

    if (isLogin) {
      // Login logic
      const user = users[email];
      if (!user || user.password !== password) {
        setError('Pogrešan email ili lozinka');
        return;
      }
      
      const currentUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        isPremium: user.isPremium || false,
        questionsAsked: user.questionsAsked || 0,
        lastQuestionTime: user.lastQuestionTime || null,
        cooldownUntil: user.cooldownUntil || null,
      };

      localStorage.setItem('quotequest_currentUser', JSON.stringify(currentUser));
      onSuccess(currentUser);
      onOpenChange(false);
      resetForm();
    } else {
      // Signup logic
      if (users[email]) {
        setError('Korisnik sa ovim emailom već postoji');
        return;
      }

      const newUser = {
        id: Date.now().toString(),
        email,
        name,
        password,
        isPremium: false,
        questionsAsked: 0,
        lastQuestionTime: null,
        cooldownUntil: null,
      };

      users[email] = newUser;
      localStorage.setItem('quotequest_users', JSON.stringify(users));

      const currentUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        isPremium: false,
        questionsAsked: 0,
        lastQuestionTime: null,
        cooldownUntil: null,
      };

      localStorage.setItem('quotequest_currentUser', JSON.stringify(currentUser));
      onSuccess(currentUser);
      onOpenChange(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="bg-[#0A0F18]/95 border-[#00CFFF]/20 max-w-[1440px] w-[calc(100vw-2rem)] p-0 overflow-hidden backdrop-blur-xl">
        {/* Visually hidden but accessible title and description */}
        <DialogTitle className="sr-only">
          {isLogin ? 'Prijavite se na QuoteQuest' : 'Kreirajte QuoteQuest nalog'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {isLogin 
            ? 'Unesite vaše podatke da se prijavite na QuoteQuest platformu' 
            : 'Unesite vaše podatke da kreirate novi QuoteQuest nalog'}
        </DialogDescription>
        
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto] h-[100vh] max-h-[900px]">
          {/* Left Side - Branding & Visual */}
          <div className="relative bg-gradient-to-br from-[#04245A] via-[#001F54] to-[#0A0F18] px-16 py-20 flex flex-col justify-between overflow-hidden hidden lg:flex">
            {/* Animated background glow */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-32 left-32 w-[500px] h-[500px] bg-[#00CFFF] rounded-full blur-[140px]" />
              <div className="absolute bottom-32 right-32 w-[500px] h-[500px] bg-[#0FB2FF] rounded-full blur-[140px]" />
            </div>

            <div className="relative z-10 max-w-[560px]">
              {/* Logo/Brand */}
              <div className="flex items-center gap-4 mb-12">
                <div className="bg-[#00CFFF]/20 p-3.5 rounded-xl backdrop-blur-sm border border-[#00CFFF]/30">
                  <BookOpen className="w-9 h-9 text-[#00CFFF]" />
                </div>
                <h1 
                  className="text-[32px] text-[#E6F0FF]"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  QuoteQuest
                </h1>
              </div>

              {/* Tagline */}
              <h2 
                className="text-5xl text-[#E6F0FF] mb-8 leading-[1.15]"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                Oslobodite moć<br />
                <span className="text-[#00CFFF]">AI analize</span>
              </h2>
              <p className="text-[#E6F0FF]/70 text-[17px] leading-relaxed max-w-[480px]">
                Analizirajte knjige, pronađite citate i dublje razumijte književna djela uz pomoć napredne umjetne inteligencije.
              </p>
            </div>

            {/* Features List */}
            <div className="relative z-10 space-y-5 max-w-[560px]">
              {[
                'Instant AI pretraga kroz cijele knjige',
                'Precizni citati sa stranicama',
                'Neograničene analize za Premium korisnike'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-[#00CFFF] shadow-[0_0_8px_rgba(0,207,255,0.5)]" />
                  <span className="text-[#E6F0FF]/80 text-[15px]">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="bg-[#0A0F18]/60 px-8 py-20 lg:px-20 flex flex-col justify-center backdrop-blur-sm lg:w-[640px]">
            {/* Mobile Logo */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <BookOpen className="w-6 h-6 text-[#00CFFF]" />
              <span 
                className="text-xl text-[#E6F0FF]"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                QuoteQuest
              </span>
            </div>

            {/* Form Container - Centered and Constrained */}
            <div className="w-full max-w-[450px] mx-auto">
              {/* Form Header */}
              <div className="mb-10">
                <h3 
                  className="text-[32px] text-[#E6F0FF] mb-3 leading-tight"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {isLogin ? 'Dobrodošli nazad' : 'Kreirajte nalog'}
                </h3>
                <p className="text-[#E6F0FF]/60 text-[15px]">
                  {isLogin 
                    ? 'Ulogujte se da nastavite analizu' 
                    : 'Započnite svoju literaturu analizu danas'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <div className="space-y-2.5">
                    <label htmlFor="name" className="text-[#E6F0FF]/80 text-[13px] block">
                      Puno ime
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00CFFF]/40 group-focus-within:text-[#00CFFF] transition-colors duration-150" />
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Vaše ime i prezime"
                        className="bg-[#04245A]/30 border-[#00CFFF]/20 text-[#E6F0FF] pl-12 pr-4 h-[52px]
                                 focus:border-[#00CFFF] focus:shadow-[0_0_20px_rgba(0,207,255,0.15)]
                                 transition-all duration-150 rounded-xl text-[15px]"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  <label htmlFor="email" className="text-[#E6F0FF]/80 text-[13px] block">
                    Email adresa
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00CFFF]/40 group-focus-within:text-[#00CFFF] transition-colors duration-150" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vas@email.com"
                      className="bg-[#04245A]/30 border-[#00CFFF]/20 text-[#E6F0FF] pl-12 pr-4 h-[52px]
                               focus:border-[#00CFFF] focus:shadow-[0_0_20px_rgba(0,207,255,0.15)]
                               transition-all duration-150 rounded-xl text-[15px]"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label htmlFor="password" className="text-[#E6F0FF]/80 text-[13px] block">
                    Lozinka
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00CFFF]/40 group-focus-within:text-[#00CFFF] transition-colors duration-150" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Najmanje 6 karaktera"
                      className="bg-[#04245A]/30 border-[#00CFFF]/20 text-[#E6F0FF] pl-12 pr-4 h-[52px]
                               focus:border-[#00CFFF] focus:shadow-[0_0_20px_rgba(0,207,255,0.15)]
                               transition-all duration-150 rounded-xl text-[15px]"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-red-400 text-[13px]">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-[52px] rounded-xl bg-gradient-to-r from-[#00CFFF] to-[#0FB2FF] 
                           hover:from-[#00CFFF]/90 hover:to-[#0FB2FF]/90 
                           text-[#0A0F18] transition-all duration-150 
                           shadow-[0_0_30px_rgba(0,207,255,0.3)] hover:shadow-[0_0_40px_rgba(0,207,255,0.5)]
                           group text-[15px]"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  <span className="mr-2">{isLogin ? 'Prijavi se' : 'Kreiraj nalog'}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-150" />
                </Button>

                {/* Toggle Login/Signup */}
                <div className="pt-8 border-t border-[#00CFFF]/10 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError('');
                    }}
                    className="text-[#00CFFF] hover:text-[#00CFFF]/80 text-[13px] transition-colors duration-150 inline-flex items-center gap-1.5"
                  >
                    {isLogin ? (
                      <>
                        <span>Nemate nalog?</span>
                        <span className="underline underline-offset-2">Registrujte se</span>
                      </>
                    ) : (
                      <>
                        <span>Već imate nalog?</span>
                        <span className="underline underline-offset-2">Prijavite se</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}