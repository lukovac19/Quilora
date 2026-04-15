import { motion } from './ui/motion';
import { Brain, Zap, Shield, BarChart3, Workflow, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'Neural Intelligence',
    description: 'Advanced machine learning models that adapt and learn from your data in real-time.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Process millions of data points in seconds with our optimized AI infrastructure.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level encryption and compliance with global data protection standards.',
  },
  {
    icon: BarChart3,
    title: 'Actionable Insights',
    description: 'Transform raw data into strategic decisions with AI-powered analytics.',
  },
  {
    icon: Workflow,
    title: 'Seamless Integration',
    description: 'Connect with your existing tools through our extensive API and webhooks.',
  },
  {
    icon: Sparkles,
    title: 'Auto-Optimization',
    description: 'Self-improving algorithms that continuously enhance performance over time.',
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 bg-[#0A0A0A] overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-[#001F54]/20 rounded-full blur-[120px]" />
      
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
            Powerful Features
          </h2>
          <p className="text-[#E6F0FF]/70 max-w-2xl mx-auto text-lg">
            Everything you need to build, deploy, and scale AI solutions that transform your business.
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group relative p-8 rounded-xl bg-gradient-to-br from-[#001F54]/20 to-transparent border border-white/[0.03] hover:border-[#00D1FF]/30 transition-all duration-120 hover:shadow-[0_0_30px_rgba(0,209,255,0.1)]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              style={{
                boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03)',
              }}
            >
              {/* Icon */}
              <div className="mb-6 w-14 h-14 rounded-lg bg-gradient-to-br from-[#00D1FF]/20 to-[#0FB2FF]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-120">
                <feature.icon className="w-7 h-7 text-[#00D1FF]" />
              </div>

              {/* Content */}
              <h3 
                className="text-[#E6F0FF] mb-3"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                {feature.title}
              </h3>
              <p className="text-[#E6F0FF]/60 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#00D1FF]/0 to-[#0FB2FF]/0 group-hover:from-[#00D1FF]/5 group-hover:to-[#0FB2FF]/5 transition-all duration-120 -z-10" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}