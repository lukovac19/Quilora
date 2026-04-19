import { useApp, type User } from '../context/AppContext';
import { useTranslation } from '../lib/translations';
import { supabase } from '../lib/supabase';
import { quiloraEdgePostJson, QUILORA_EDGE_SLUG } from '../lib/quiloraEdge';
import { dodoCheckoutConfigured, openDodoCheckout, priceConfigured } from '../lib/billingCheckout';
import { X, Check, Zap, Target, Sparkles, Infinity } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export function PricingModal({ isOpen, onClose, user: propsUser }: PricingModalProps) {
  const { user: contextUser, setUser, refreshAuthUser } = useApp();
  const { t } = useTranslation();
  const user = propsUser || contextUser;

  if (!isOpen) return null;

  const handleUpgrade = async (tier: 'normal' | 'hardquest' | 'lifetime' | 'blitz') => {
    if (!user || tier === 'blitz') return;

    const productByTier = {
      normal: 'bookworm_monthly',
      hardquest: 'sage_monthly',
      lifetime: 'lifetime_early_bird',
    } as const;
    const product = productByTier[tier];

    if (dodoCheckoutConfigured() && priceConfigured(product)) {
      const res = await openDodoCheckout({
        product,
        userId: user.id,
        email: user.email,
      });
      if (res.ok) {
        onClose();
        return;
      }
      if (res.reason === 'sold_out') {
        toast.error(res.message);
        return;
      }
      if (res.reason === 'not_allowed') {
        toast.error(res.message);
        return;
      }
      if (res.reason !== 'no_dodo' && res.reason !== 'no_price') {
        toast.error(res.message);
        return;
      }
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast.error('Please sign in to upgrade.');
        return;
      }

      try {
        const data = await quiloraEdgePostJson<{ user?: unknown; error?: string }>(
          `${QUILORA_EDGE_SLUG}/subscription/upgrade`,
          token,
          { tier },
        );

        if (data && typeof data === 'object' && 'error' in data && data.error) {
          toast.error(data.error);
          return;
        }
        await refreshAuthUser();
        toast.success(t('common.success'));
        onClose();
      } catch (fetchError: unknown) {
        const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
        if (message === 'Failed to fetch' || fetchError instanceof TypeError) {
          const base = (contextUser ?? user) as User | null;
          const upgradedUser: User = {
            ...(base ?? (user as User)),
            subscriptionTier: tier,
            billingGatePassed:
              tier === 'hardquest' || tier === 'lifetime' ? true : Boolean(base?.billingGatePassed),
          };

          setUser(upgradedUser);
          toast.success(`${t('common.success')} (Demo mode)`);
          onClose();
        } else {
          throw fetchError;
        }
      }
    } catch (error: unknown) {
      console.error('Upgrade error:', error);
      const msg = error instanceof Error ? error.message : t('common.error');
      toast.error(msg || t('common.error'));
    }
  };

  const plans = [
    {
      id: 'blitz',
      name: t('pricing.blitz.name'),
      description: t('pricing.blitz.description'),
      price: t('pricing.blitz.price'),
      period: '',
      icon: Zap,
      color: 'gray',
      features: t('pricing.blitz.features') as any as string[],
      current: user?.subscriptionTier === 'blitz',
      disabled: true,
    },
    {
      id: 'normal',
      name: t('pricing.normal.name'),
      description: t('pricing.normal.description'),
      price: t('pricing.normal.price'),
      period: t('pricing.monthly'),
      icon: Target,
      color: 'blue',
      features: t('pricing.normal.features') as any as string[],
      current: user?.subscriptionTier === 'normal',
    },
    {
      id: 'hardquest',
      name: t('pricing.hardquest.name'),
      description: t('pricing.hardquest.description'),
      price: t('pricing.hardquest.price'),
      period: t('pricing.monthly'),
      icon: Sparkles,
      color: 'purple',
      popular: true,
      features: t('pricing.hardquest.features') as any as string[],
      current: user?.subscriptionTier === 'hardquest',
    },
    {
      id: 'lifetime',
      name: t('pricing.lifetime.name'),
      description: t('pricing.lifetime.description'),
      price: t('pricing.lifetime.price'),
      period: t('pricing.oneTime'),
      icon: Infinity,
      color: 'cyan',
      features: t('pricing.lifetime.features') as any as string[],
      current: user?.subscriptionTier === 'lifetime',
    },
  ];

  const getColorClasses = (color: string, active?: boolean) => {
    const colors: Record<string, { border: string; bg: string; text: string; button: string }> = {
      gray: {
        border: 'border-gray-500/30',
        bg: 'bg-gray-500/10',
        text: 'text-gray-300',
        button: 'bg-gray-500/20 hover:bg-gray-500/30',
      },
      blue: {
        border: 'border-blue-500/30',
        bg: 'bg-blue-500/10',
        text: 'text-blue-300',
        button: 'bg-gradient-to-r from-blue-500 to-blue-600 btn-hover-glow',
      },
      purple: {
        border: active ? 'border-purple-500/50' : 'border-purple-500/30',
        bg: active ? 'bg-gradient-to-br from-purple-500/20 to-[#00CFFF]/20' : 'bg-purple-500/10',
        text: 'text-purple-300',
        button: 'bg-gradient-to-r from-purple-500 to-purple-600 btn-hover-glow',
      },
      cyan: {
        border: 'border-cyan-500/30',
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-300',
        button: 'bg-gradient-to-r from-[#00CFFF] to-cyan-600 btn-hover-glow',
      },
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm modal-overlay">
      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-[#0A0F18] rounded-2xl border border-[#00CFFF]/30 custom-scrollbar modal-content">
        {/* Header */}
        <div className="sticky top-0 z-10 p-6 border-b border-[#00CFFF]/10 bg-[#0A0F18]/95 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-3xl font-bold"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                {t('pricing.title')}
              </h2>
              <p className="text-[#E6F0FF]/70 mt-1">
                {t('pricing.subtitle')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#04245A]/40 transition-all duration-200 hover:scale-110"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="p-6 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const colors = getColorClasses(plan.color, plan.popular);

            return (
              <div
                key={plan.id}
                className={`relative p-6 rounded-2xl border-2 ${colors.border} ${colors.bg} card-hover animate-fade-in-up`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-purple-500 text-white text-xs font-bold animate-pulse">
                    {t('pricing.popular')}
                  </div>
                )}

                {plan.current && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-green-500 text-white text-xs font-bold">
                    {t('pricing.currentPlan')}
                  </div>
                )}

                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00CFFF]/20 to-[#04245A]/40 flex items-center justify-center mb-4">
                  <Icon className={`w-7 h-7 ${colors.text}`} />
                </div>

                {/* Name */}
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {plan.name}
                </h3>

                {/* Description */}
                <p className="text-xs text-[#E6F0FF]/60 mb-4">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${colors.text}`}>{plan.price}</span>
                    <span className="text-sm text-[#E6F0FF]/60">{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm animate-fade-in" style={{ animationDelay: `${(index * 100) + (idx * 50)}ms` }}>
                      <Check className="w-4 h-4 text-[#00CFFF] mt-0.5 flex-shrink-0" />
                      <span className="text-[#E6F0FF]/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleUpgrade(plan.id as any)}
                  disabled={plan.disabled || plan.current}
                  className={`w-full py-3 rounded-xl text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${colors.button}`}
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {plan.current ? t('pricing.currentPlan') : plan.disabled ? t('pricing.currentPlan') : t('pricing.upgradeTo')}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#00CFFF]/10 bg-[#04245A]/10">
          <p className="text-center text-sm text-[#E6F0FF]/60">
            All plans include secure payment processing and 30-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
}