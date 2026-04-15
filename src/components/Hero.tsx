import { motion } from './ui/motion';
import { ArrowRight, Play } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useEffect, useRef } from 'react';

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      connections: number[];
    }> = [];

    // Create particles
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        connections: [],
      });
    }

    function animate() {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Draw particle
        ctx.fillStyle = '#00D1FF';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw connections
        particles.forEach((otherParticle, j) => {
          if (i === j) return;
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.strokeStyle = `rgba(0, 209, 255, ${0.15 * (1 - distance / 120)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    }

    animate();
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0A0A] pt-20">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#001F54]/30 via-transparent to-[#001F54]/20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00D1FF]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#0FB2FF]/10 rounded-full blur-[120px]" />

      {/* Neural network canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-40"
      />

      {/* Content */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-12 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#001F54]/40 border border-[#00D1FF]/20 mb-8"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.12 }}
          >
            <div className="w-2 h-2 rounded-full bg-[#00D1FF] animate-pulse" />
            <span className="text-[#00D1FF]">Powered by Next-Gen AI</span>
          </motion.div>

          {/* Heading */}
          <h1 
            className="text-[#E6F0FF] mb-6 max-w-4xl mx-auto"
            style={{ 
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
              lineHeight: '1.1',
              letterSpacing: '-0.02em'
            }}
          >
            Empower Your AI Workflow
          </h1>

          {/* Subheading */}
          <p className="text-[#E6F0FF]/70 mb-12 max-w-2xl mx-auto text-lg md:text-xl">
            Next-gen AI tools for modern enterprises. Streamline operations, accelerate innovation, 
            and unlock unprecedented insights with our cutting-edge platform.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.button
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#00D1FF] to-[#0FB2FF] text-[#0A0A0A] flex items-center gap-2 hover:shadow-[0_0_40px_rgba(0,209,255,0.5)] transition-shadow duration-120 group"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.12 }}
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              className="px-8 py-4 rounded-xl border-2 border-[#00D1FF]/50 text-[#E6F0FF] flex items-center gap-2 hover:bg-[#00D1FF]/10 hover:border-[#00D1FF] transition-all duration-120 group"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.12 }}
            >
              <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Watch Demo
            </motion.button>
          </div>

          {/* Hero visual */}
          <motion.div
            className="mt-16 relative max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative rounded-2xl overflow-hidden border border-[#00D1FF]/20 shadow-[0_0_80px_rgba(0,209,255,0.2)]">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1717501219263-9aa2d6a768d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXVyYWwlMjBuZXR3b3JrJTIwQUl8ZW58MXx8fHwxNzYwNzgyNTMxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="AI Neural Network Visualization"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
            </div>
            
            {/* Floating elements */}
            <motion.div
              className="absolute -top-4 -left-4 w-20 h-20 rounded-xl bg-gradient-to-br from-[#00D1FF] to-[#0FB2FF] opacity-20 blur-xl"
              animate={{ y: [0, 20, 0], rotate: [0, 90, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-4 -right-4 w-32 h-32 rounded-xl bg-gradient-to-br from-[#0FB2FF] to-[#00D1FF] opacity-20 blur-xl"
              animate={{ y: [0, -20, 0], rotate: [0, -90, 0] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
    </section>
  );
}