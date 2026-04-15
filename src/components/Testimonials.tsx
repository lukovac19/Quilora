import { motion } from './ui/motion';
import { Star, Quote } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'CTO, TechVision',
    image: 'https://images.unsplash.com/photo-1737573744382-73c017a9ab25?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNoJTIwd29ya3NwYWNlJTIwdGVhbXxlbnwxfHx8fDE3NjA4MTEwMTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    quote: 'AIFlow transformed how we handle data processing. What used to take hours now happens in minutes. The ROI was clear within the first month.',
    rating: 5,
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Head of Innovation, DataCorp',
    image: 'https://images.unsplash.com/photo-1697577418970-95d99b5a55cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NjA3NjE0NDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    quote: 'The platform is incredibly intuitive. Our team was up and running within days, and the AI models are remarkably accurate. Highly recommended.',
    rating: 5,
  },
  {
    name: 'Emily Watson',
    role: 'Founder, StartupX',
    image: 'https://images.unsplash.com/photo-1717501219263-9aa2d6a768d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXVyYWwlMjBuZXR3b3JrJTIwQUl8ZW58MXx8fHwxNzYwNzgyNTMxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    quote: 'Best AI platform we\'ve used. The support team is fantastic, and the documentation made integration seamless. Game-changer for our product.',
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="relative py-24 bg-[#0A0A0A] overflow-hidden">
      {/* Background effects */}
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#001F54]/20 rounded-full blur-[120px]" />
      
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
            Trusted by Industry Leaders
          </h2>
          <p className="text-[#E6F0FF]/70 max-w-2xl mx-auto text-lg">
            See what our customers have to say about their experience with AIFlow.
          </p>
        </motion.div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              className="relative p-8 rounded-2xl bg-gradient-to-br from-[#001F54]/30 to-[#001F54]/10 border border-white/[0.03] hover:border-[#00D1FF]/30 transition-all duration-120"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              style={{
                boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03)',
              }}
            >
              {/* Quote icon */}
              <div className="mb-6">
                <Quote className="w-10 h-10 text-[#00D1FF]/30" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#00D1FF] text-[#00D1FF]" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-[#E6F0FF]/80 mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-6 border-t border-white/[0.05]">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#001F54] ring-2 ring-[#00D1FF]/20">
                  <ImageWithFallback
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-[#E6F0FF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {testimonial.name}
                  </div>
                  <div className="text-[#E6F0FF]/50">
                    {testimonial.role}
                  </div>
                </div>
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#00D1FF]/0 to-[#0FB2FF]/0 hover:from-[#00D1FF]/5 hover:to-[#0FB2FF]/5 transition-all duration-120 pointer-events-none -z-10" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}