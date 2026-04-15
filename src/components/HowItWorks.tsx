import { motion } from './ui/motion';
import { Upload, Cpu, Rocket } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    number: '01',
    title: 'Connect Your Data',
    description: 'Seamlessly integrate your data sources with our secure platform. Support for APIs, databases, and file uploads.',
  },
  {
    icon: Cpu,
    number: '02',
    title: 'AI Processing',
    description: 'Our advanced neural networks analyze and process your data, identifying patterns and generating insights.',
  },
  {
    icon: Rocket,
    number: '03',
    title: 'Deploy & Scale',
    description: 'Launch your AI models into production and scale effortlessly with our cloud infrastructure.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 bg-gradient-to-b from-[#0A0A0A] to-[#001F54]/10">
      {/* Background effects */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-[#00D1FF]/10 rounded-full blur-[120px]" />
      
      <div className="relative max-w-[1440px] mx-auto px-6 lg:px-12">
        {/* Section header */}
        <motion.div
          className="text-center mb-20"
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
            How It Works
          </h2>
          <p className="text-[#E6F0FF]/70 max-w-2xl mx-auto text-lg">
            Get started in three simple steps and transform your business with AI.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connection lines (desktop) */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5">
            <div className="max-w-4xl mx-auto px-32 h-full relative">
              <div className="h-full bg-gradient-to-r from-[#00D1FF]/20 via-[#00D1FF]/40 to-[#00D1FF]/20" />
            </div>
          </div>

          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              className="relative flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              {/* Step number and icon */}
              <motion.div
                className="relative mb-8"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.12 }}
              >
                {/* Number background */}
                <div className="absolute -top-4 -left-4 text-[#00D1FF]/10 text-8xl z-0" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {step.number}
                </div>
                
                {/* Icon container */}
                <div className="relative z-10 w-24 h-24 rounded-2xl bg-gradient-to-br from-[#001F54] to-[#001F54]/50 border border-[#00D1FF]/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,209,255,0.2)]">
                  <step.icon className="w-12 h-12 text-[#00D1FF]" />
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-[#00D1FF]/20 blur-xl -z-10" />
              </motion.div>

              {/* Content */}
              <h3 
                className="text-[#E6F0FF] mb-4"
                style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.5rem' }}
              >
                {step.title}
              </h3>
              <p className="text-[#E6F0FF]/60 leading-relaxed max-w-xs">
                {step.description}
              </p>

              {/* Mobile connector */}
              {index < steps.length - 1 && (
                <div className="md:hidden w-0.5 h-12 bg-gradient-to-b from-[#00D1FF]/40 to-transparent mt-8" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}