import { motion } from './ui/motion';
import { Check, Zap } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '49',
    description: 'Perfect for small teams and MVPs',
    features: [
      '10,000 API calls/month',
      'Basic AI models',
      'Email support',
      'Community access',
      '1 team member',
    ],
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '199',
    description: 'For growing businesses',
    features: [
      '100,000 API calls/month',
      'Advanced AI models',
      'Priority support',
      'Custom integrations',
      '5 team members',
      'Advanced analytics',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Tailored for large organizations',
    features: [
      'Unlimited API calls',
      'Custom AI models',
      '24/7 dedicated support',
      'SLA guarantee',
      'Unlimited team members',
      'On-premise deployment',
    ],
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24 bg-gradient-to-b from-[#0A0A0A] via-[#001F54]/5 to-[#0A0A0A]">
      {/* Background effects */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#00D1FF]/10 rounded-full blur-[120px]" />
      
      <div className="relative max-w-[1440px] mx-auto px-6 lg:px-12">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 
            className="text-[#E6F0FF] mb-4"
            style={{ 
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              letterSpacing: '-0.02em'
            }}
          >
            Simple, Transparent Pricing
          </h2>
          <p className="text-[#E6F0FF]/70 max-w-2xl mx-auto text-lg">
            Choose the perfect plan for your needs. All plans include a 14-day free trial.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-2xl p-8 ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-[#001F54]/60 to-[#001F54]/30 border-2 border-[#00D1FF]/50'
                  : 'bg-gradient-to-br from-[#001F54]/20 to-transparent border border-white/[0.03]'
              } ${plan.highlighted ? 'md:scale-105 md:-mt-4 md:mb-4' : ''}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              style={{
                boxShadow: plan.highlighted
                  ? '0 0 50px rgba(0, 209, 255, 0.2)'
                  : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03)',
              }}
            >
              {/* Popular badge */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#00D1FF] to-[#0FB2FF] text-[#0A0A0A]">
                    <Zap className="w-4 h-4" />
                    <span style={{ fontFamily: 'Orbitron, sans-serif' }}>Most Popular</span>
                  </div>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-8">
                <h3 
                  className="text-[#E6F0FF] mb-2"
                  style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.5rem' }}
                >
                  {plan.name}
                </h3>
                <p className="text-[#E6F0FF]/60 mb-6">
                  {plan.description}
                </p>
                
                <div className="flex items-baseline gap-2">
                  {plan.price !== 'Custom' && (
                    <span className="text-[#E6F0FF]/40">$</span>
                  )}
                  <span 
                    className="text-[#00D1FF]"
                    style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '3rem', lineHeight: '1' }}
                  >
                    {plan.price}
                  </span>
                  {plan.price !== 'Custom' && (
                    <span className="text-[#E6F0FF]/40">/month</span>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full ${
                      plan.highlighted ? 'bg-[#00D1FF]' : 'bg-[#00D1FF]/20'
                    } flex items-center justify-center mt-0.5`}>
                      <Check className={`w-3 h-3 ${
                        plan.highlighted ? 'text-[#0A0A0A]' : 'text-[#00D1FF]'
                      }`} />
                    </div>
                    <span className="text-[#E6F0FF]/70">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              <motion.button
                className={`w-full py-3 rounded-xl transition-all duration-120 ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-[#00D1FF] to-[#0FB2FF] text-[#0A0A0A] hover:shadow-[0_0_30px_rgba(0,209,255,0.4)]'
                    : 'border-2 border-[#00D1FF]/30 text-[#E6F0FF] hover:bg-[#00D1FF]/10 hover:border-[#00D1FF]'
                }`}
                style={{ fontFamily: 'Orbitron, sans-serif' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}