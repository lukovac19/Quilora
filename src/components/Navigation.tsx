import { motion } from './ui/motion';
import { Brain, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = ['Features', 'How It Works', 'Demo', 'Pricing', 'Testimonials'];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/[0.03]">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.12 }}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00D1FF] to-[#0FB2FF] flex items-center justify-center">
              <Brain className="w-6 h-6 text-[#0A0A0A]" />
            </div>
            <span className="text-[#E6F0FF] tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              AI<span className="text-[#00D1FF]">Flow</span>
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-[#E6F0FF]/70 hover:text-[#00D1FF] transition-colors duration-120"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.12 }}
              >
                {item}
              </motion.a>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <motion.button
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#00D1FF] to-[#0FB2FF] text-[#0A0A0A] hover:shadow-[0_0_30px_rgba(0,209,255,0.4)] transition-shadow duration-120"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.12 }}
            >
              Get Started
            </motion.button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-[#E6F0FF] p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            className="md:hidden py-6 border-t border-white/[0.03]"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  className="text-[#E6F0FF]/70 hover:text-[#00D1FF] transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <button
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#00D1FF] to-[#0FB2FF] text-[#0A0A0A] mt-2"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}